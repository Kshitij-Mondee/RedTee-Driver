/* Living screencast engine (2026-10-16). A believable generic application, redrawn as sharp vector UI from a compact
 * spec, walked through by a pointer that is the learner, with a camera that frames the active region and a teaching
 * layer that is visibly imposed on the product.
 *
 * Learned from lemo-opuscar's living-screencast style (a real UI redrawn, the cursor as the user, push-in on the action,
 * a keystroke HUD, chapter pills, a spotlight freeze, a time-lapse tag), from van der Meij and van der Meij (2013) and
 * Plaisant and Shneiderman (2005) on software demonstrations, and from NN/g on motion and change blindness
 * (docs/research/2026-10-16-style-screencast.md). Rebuilt for Loom, not copied: no mascot, no whip pans or motion blur,
 * a generic app built from the lesson's words (never a real product's look), two registers (tour and walkthrough) on one
 * held shell, every mark an SVG node inside an element a scene made with ctx.el, colours as pack tokens, and a frame a
 * pure function of time.
 *
 *   const W = ctx.engine;
 *   const A = W.app(ctx, "app", {
 *     chrome: "browser", url: "expenses.example.com/reports", brand: "Expenses",
 *     nav: [{ id: "reports", label: "Reports", icon: "file-text" }, { id: "settings", label: "Settings", icon: "settings" }],
 *     active: "reports", search: "Search reports", user: "AK",
 *     page: { title: "Reports", toolbar: [{ id: "new", label: "New report", kind: "primary", icon: "plus" }] },
 *     content: [{ id: "list", kind: "table", columns: [...], rows: [...] }],
 *   }, { at: 0.4 });
 *   A.pointer(1.2);                                         // the learner arrives
 *   let t = A.click("tool.new", { at: ctx.cue("New report"), zoom: true });
 *   t = A.type("dialog.name", "Q3 travel", { at: t + 0.4 });
 *   A.keys(["Ctrl", "Enter"], { at: t + 0.3 });
 *   A.spotlight("toast", { at: t + 1.2, dur: 2, label: "Saved" });
 *
 * One performer per app: the pointer and the camera are posed by one clock from one schedule (the pointer cannot be in
 * two places; a press never lands while the camera moves). UI states (hover, press, toggles, dialogs, menus, toasts,
 * typed text) are tweens and drives on the lesson's timeline. The teaching layer (rings, callouts, the spotlight, tags,
 * pills) is drawn in the pack's signal colour, accent2, which no product state uses.
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const K = () => Loom.kit;
  const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const f3 = (v) => (Math.round(v * 1000) / 1000).toFixed(3);
  const minjerk = (u) => { u = clamp(u, 0, 1); return u * u * u * (10 - 15 * u + 6 * u * u); };   // a human reach (Flash and Hogan)
  const easeIO = (u) => (Loom.ease && Loom.ease.editorial ? Loom.ease.editorial(clamp(u, 0, 1)) : u * u * (3 - 2 * u));
  const easeOut = (u) => (Loom.ease && Loom.ease.enter ? Loom.ease.enter(clamp(u, 0, 1)) : 1 - Math.pow(1 - u, 3));
  // a scroll with inertia: a short push (velocity ramps up over the first 12 %), then a glide that decays exponentially,
  // as a wheel flick or a trackpad does; continuous velocity, almost still at the end
  const inertia = (u) => {
    u = clamp(u, 0, 1);
    const a = 0.12, k = 4.5, g = (u < a ? (u * u) / (2 * a) : u - a / 2) / (1 - a / 2);
    return (1 - Math.exp(-k * g)) / (1 - Math.exp(-k));
  };
  // a person's typing: each key's interval varies (seeded), a word starts a little later, punctuation and shifted keys
  // take longer, a repeated key is quicker. Returns the time each character lands, from the start, summing to dur
  function cadence(str, dur, seed) {
    const s = String(str), n = s.length;
    if (!n) return [];
    const rng = Loom.rng ? Loom.rng(seed) : null, w = [];
    for (let i = 0; i < n; i++) {
      const c = s[i], prev = i ? s[i - 1] : "";
      let k = 0.7 + 0.6 * (rng ? rng() : 0.5);
      if (prev === " ") k *= 1.45;
      if (/[.,:;!?)\]}]/.test(prev)) k *= 1.6;
      if (/[A-Z$#@{}[\]()<>|_~^%&*+="]/.test(c)) k *= 1.25;
      if (prev === c) k *= 0.8;
      w.push(k);
    }
    const sum = w.reduce((a, b) => a + b, 0);
    let acc = 0;
    return w.map((x) => ((acc += x) / sum) * dur);
  }
  // how many characters have landed dt after the start (binary search on the cadence)
  function typedBy(T, dt) { let lo = 0, hi = T.length; while (lo < hi) { const m = (lo + hi) >> 1; if (T[m] <= dt + 1e-9) lo = m + 1; else hi = m; } return lo; }

  // ---------------------------------------------------------------- the pack's screencast block (video sizes, pacing)
  const DEF = { ui_text: 21, ui_small: 20, ui_head: 26, row: 56, nav_row: 54, control_h: 48, radius: 10, zoom_min: 1.25, zoom_max: 2.4,
    zoom_in_s: 0.8, zoom_out_s: 0.7, pointer_px_s: 1500, dwell_s: 0.3, after_click_s: 0.6, type_cps: 14, read_px: 32,
    // code and terminal text (mono): 26 px code reaches the 32 px reading floor at the smallest zoom (1.25), so an editor framed
    // with its file tree and tabs is readable; a terminal is often half the frame beside another window, so 24 px
    code_px: 26, code_lh: 1.5, term_px: 24, term_lh: 1.45 };
  // a product's own look (2026-10-16): an app built with `theme` (tools/screenshot_theme.py proposes one from the user's
  // screenshots) draws its product in that theme's colours and sizes. THEME is set while that app builds and while any of
  // its product calls runs (app() wraps them); the teaching layer always draws in the pack (accent2 stays the signal)
  let THEME = null;
  function normTheme(t) {
    if (!t) return null;
    const cfg = {};
    for (const k of ["radius", "row", "nav_row", "control_h", "ui_text", "ui_small", "ui_head"]) if (t[k] != null) cfg[k] = Math.max(k.startsWith("ui_") ? 20 : 1, +t[k]);
    return { c: Object.assign({}, t.palette || {}), tone: Object.assign({}, t.tone || {}), cfg };
  }
  const CFG = () => Object.assign({}, DEF, (S().pack && S().pack.screencast) || {}, (THEME && THEME.cfg) || {});
  const C = (t) => (THEME && THEME.c[t]) || S().c(t);
  const mix = (a, b, p) => S().mix(C(a), C(b), p);
  // derived product tones (hairlines, hover and selection washes) from pack tokens, never literals (a theme may set any)
  const TONE = () => Object.assign({
    hair: mix("surface", "line", 0.26), hair2: mix("surface", "line", 0.46), page: C("surface2"), side: C("surface"),
    hover: mix("surface", "accent", 0.06), sel: mix("surface", "accent", 0.1), selBar: C("accent"), chrome: mix("surface2", "field2", 0.55),
    dot: mix("field2", "line", 0.35), input: C("surface"), track: mix("surface", "line", 0.4),
  }, (THEME && THEME.tone) || {});
  // a colour name for kit.text and kit.icon: a theme's colour is drawn with a pack token and then set (kit takes tokens)
  const themed = (tok) => (THEME && THEME.c[tok]) || null;
  const TONES = { pos: "pos", neg: "neg", warn: "accent4", info: "accent", neutral: "accent3" };
  const toneTok = (t) => TONES[t] || (t && S().pack.palette[t] ? t : "accent3");

  // ---------------------------------------------------------------- code and terminal: colours, the mono face, the tokenizer
  // syntax colours from pack tokens (or a mix of two), never literals. A pack may override any kind in screencast.syntax:
  // {kind: "token" | ["tokenA", "tokenB", share of B]}. The product's palette, not the teaching one: never accent2
  const SYN_DEF = { plain: "ink", punct: "muted", key: ["neg", "ink", 0.35], keyword: "accent", string: "pos", number: "accent4", const: "accent4",
    comment: ["muted", "surface", 0.08], fn: ["accent4", "ink", 0.4], type: ["pos", "accent", 0.5], var: "accent", flag: "accent3" };
  const tokCol = (v) => (Array.isArray(v) ? mix(v[0], v[1], v[2]) : C(v));
  const SYN = () => { const o = Object.assign({}, SYN_DEF, CFG().syntax || {}), r = {}; for (const k in o) r[k] = tokCol(o[k]); return r; };
  // the dark terminal, from the pack's shadow and ink with its own product tones lifted toward surface (contrast on the
  // dark ground: text about 15:1, the tones 5 to 7:1)
  const TERM = () => ({ bg: mix("shadow", "ink", 0.3), bar: mix("shadow", "line", 0.22), text: mix("surface", "field2", 0.2), dim: mix("surface", "shadow", 0.4),
    prompt: mix("pos", "surface", 0.32), path: mix("accent", "surface", 0.5), ok: mix("pos", "surface", 0.32), warn: mix("accent4", "surface", 0.32),
    error: mix("neg", "surface", 0.32), caret: mix("surface", "field2", 0.1), sel: mix("shadow", "surface", 0.14), dot: mix("shadow", "surface", 0.3) });
  const monoFam = () => ((S().font && S().font("mono")) || {}).family || "monospace";
  const monoW = (size) => K().measure("0000000000", "mono", size, 400) / 10;     // one cell of the mono face
  function monoBase(top, lh, size) { const v = K().vmetrics("mono", size, 400); return top + (lh - (v.ascent + v.descent)) / 2 + v.ascent; }
  // a line of mono text: each run of non-space characters is its own tspan at its exact column, so indentation and
  // alignment never depend on how the renderer treats whitespace (kit.text splits on it; SVG collapses it).
  // segs: [[text, fill, weight?]]. Returns the spans (with their column) for a typing reveal
  function monoText(p, x, base, segs, size, tag) {
    const cw = monoW(size), t = svg("text", { x: f1(x), y: f1(base), "font-family": monoFam(), "font-size": size, "font-weight": 400, "data-sc": tag || "code" }, p);
    const spans = []; let col = 0;
    for (const [s, fill, wt] of segs) {
      const re = /\S+/g; let m;
      while ((m = re.exec(s))) {
        const node = svg("tspan", { x: f1(x + (col + m.index) * cw), fill, "font-weight": wt }, t);
        node.textContent = m[0];
        spans.push({ node, col: col + m.index, s: m[0] });
      }
      col += s.length;
    }
    return { t, spans, cols: col };
  }
  // the first k columns of a line (typing): a pure function of k
  function monoReveal(spans, k) { for (const sp of spans) sp.node.textContent = sp.s.slice(0, Math.max(0, k - sp.col)); }
  // the words are reported like kit.text's, so the lesson-vocabulary audit sees code and terminal text too
  function monoReport(str, size, box) {
    if (!String(str).trim()) return;
    if (Loom.report && Loom.report.texts) Loom.report.texts.push({ beat: Loom.ctxBeat && Loom.ctxBeat.id, role: "mono", size, lines: 1, text: String(str).slice(0, 400), w: String(str).length * monoW(size), h: box.h, floor: 20, box, engine: "screencast" });
  }

  // a small deterministic tokenizer, one line at a time: [[text, kind]] whose texts join to the line exactly. Kinds: plain,
  // punct, key, keyword, string, number, const, comment, fn, type, var, flag. Enough for a lesson's snippet, not a compiler
  const LANG = { yaml: "yaml", yml: "yaml", json: "json", js: "js", javascript: "js", jsx: "js", ts: "js", typescript: "js", tsx: "js",
    py: "py", python: "py", sh: "sh", bash: "sh", shell: "sh", zsh: "sh", console: "sh" };
  const KW = {
    js: new Set("break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return super switch this throw try typeof var void while with yield async await static as interface type enum implements private public protected readonly declare namespace abstract keyof".split(" ")),
    py: new Set("and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case self".split(" ")),
    sh: new Set("if then else elif fi for while until do done case esac function in return export local readonly declare set unset source exit".split(" ")),
  };
  const CONSTS = new Set(["true", "false", "null", "undefined", "None", "True", "False", "NaN", "Infinity", "yes", "no", "on", "off", "~"]);
  const PY_BUILTIN = new Set(["print", "len", "range", "open", "int", "str", "float", "dict", "list", "set", "tuple", "min", "max", "sum", "sorted", "enumerate", "zip", "isinstance"]);
  // one line in a state carried from the line before (null: none): a js block comment or template literal, a python
  // triple-quoted string, a yaml block scalar (`key: |`), a bash heredoc. Returns [tokens, the state after the line]
  function tokenizeState(src, lang, st0) {
    src = String(src == null ? "" : src);
    const L = LANG[String(lang || "").toLowerCase()] || "text";
    if (L === "text") return [src ? [[src, "plain"]] : [], null];
    const out = [], n = src.length;
    let i = 0, cmdStart = true, prevWord = "", st = null;
    const push = (s, k) => { if (!s) return; const last = out[out.length - 1]; if (last && last[1] === k) last[0] += s; else out.push([s, k]); };
    const at = (re) => { re.lastIndex = i; const m = re.exec(src); return m && m.index === i ? m[0] : null; };
    const wordBefore = () => i > 0 && /[\w$]/.test(src[i - 1]);
    // ---- a line that starts inside something the line before opened
    if (st0) {
      if (st0.k === "block" || st0.k === "tpl" || st0.k === "q3") {
        const close = st0.k === "block" ? "*/" : st0.k === "tpl" ? "`" : st0.q;
        let j = src.indexOf(close);
        while (j > 0 && st0.k !== "block" && src[j - 1] === "\\") j = src.indexOf(close, j + 1);
        if (j < 0) return [[[src, st0.k === "block" ? "comment" : "string"]].filter((x) => x[0]), st0];
        push(src.slice(0, j + close.length), st0.k === "block" ? "comment" : "string"); i = j + close.length;
      } else if (st0.k === "yblock") {
        const ind = /^\s*/.exec(src)[0].length;
        if (!src.trim() || ind > st0.ind) { push(src.slice(0, ind), "plain"); push(src.slice(ind), "string"); return [out, st0]; }
      } else if (st0.k === "heredoc") {
        if (src.trim() === st0.d) return [[[src, "punct"]], null];
        return [src ? [[src, "string"]] : [], st0];
      }
    }
    if (L === "yaml" && i === 0) {
      const m = /^(\s*)((?:-\s+)?)/.exec(src);
      push(m[1], "plain"); push(m[2], "punct"); i = m[0].length;
      const km = /^("[^"]*"|'[^']*'|[^\s:#'"][^:#]*?)(\s*)(:)(?=\s|$)/.exec(src.slice(i));
      if (km && src[i] !== "#") {
        push(km[1], "key"); push(km[2], "plain"); push(":", "punct"); i += km[0].length;
        if (/^\s*[|>][-+0-9]*\s*(#.*)?$/.test(src.slice(i))) st = { k: "yblock", ind: m[1].length };   // a block scalar follows
      }
    }
    while (i < n) {
      const c = src[i];
      let s;
      if ((s = at(/\s+/y))) { push(s, "plain"); i += s.length; continue; }
      if ((L === "yaml" || L === "py" || L === "sh") && c === "#" && (i === 0 || /\s/.test(src[i - 1]))) { push(src.slice(i), "comment"); break; }
      if (L === "js" && src.startsWith("//", i)) { push(src.slice(i), "comment"); break; }
      if (L === "js" && (s = at(/\/\*.*?(?:\*\/|$)/y))) { push(s, "comment"); i += s.length; if (!/\*\/$/.test(s) || s.length < 4) st = { k: "block" }; continue; }
      if (L === "py" && (src.startsWith('"""', i) || src.startsWith("'''", i))) {
        const q = src.slice(i, i + 3), j = src.indexOf(q, i + 3);
        if (j < 0) { push(src.slice(i), "string"); st = { k: "q3", q }; break; }
        push(src.slice(i, j + 3), "string"); i = j + 3; continue;
      }
      if (L === "sh" && (s = at(/<<-?\s*(['"]?)([A-Za-z_]\w*)\1/y))) { push(s, "punct"); st = { k: "heredoc", d: /([A-Za-z_]\w*)/.exec(s.slice(2))[1] }; i += s.length; continue; }
      if (!wordBefore() || (L === "py" && /[rbfuRBFU]/.test(src[i - 1] || ""))) {
        const q = L === "js" ? /"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`(?:[^`\\]|\\.)*`?/y : /"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?/y;
        if ((c === '"' || c === "'" || c === "`") && (s = at(q))) {
          const isKey = (L === "json" || L === "js" || L === "yaml") && /^\s*:/.test(src.slice(i + s.length));
          push(s, isKey ? "key" : "string"); i += s.length; cmdStart = false;
          if (c === "`" && (s.length < 2 || s[s.length - 1] !== "`")) { st = { k: "tpl" }; break; }   // a template literal runs on
          continue;
        }
      }
      if (L === "sh" && c === "$" && (s = at(/\$(?:\{[^}]*\}?|\(|[A-Za-z_]\w*|[0-9@#?*!$-])/y))) { push(s, "var"); i += s.length; if (s === "$(") cmdStart = true; continue; }
      if (L === "sh" && c === "-" && (i === 0 || /\s/.test(src[i - 1])) && (s = at(/--?[A-Za-z][\w-]*(?:=)?/y))) { push(s, "flag"); i += s.length; continue; }
      if (L === "py" && c === "@" && (s = at(/@[A-Za-z_][\w.]*/y))) { push(s, "fn"); i += s.length; continue; }
      if (!wordBefore() && (s = at(/-?(?:0[xX][0-9a-fA-F]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)(?![\w.])/y))) {
        if (s[0] === "-" && i > 0 && /[\w)\]]/.test(src[i - 1] || "")) { push("-", "punct"); i += 1; continue; }
        push(s, "number"); i += s.length; cmdStart = false; continue;
      }
      if ((s = at(L === "sh" ? /[A-Za-z_][\w./-]*/y : /[A-Za-z_$][\w$]*/y))) {
        const after = src.slice(i + s.length);
        let k = "plain";
        if (CONSTS.has(s) && L !== "sh") k = "const";
        else if (L === "sh") k = KW.sh.has(s) && cmdStart ? "keyword" : cmdStart ? "fn" : "plain";
        else if (L === "json" || L === "yaml") k = "plain";
        else if (KW[L] && KW[L].has(s)) k = "keyword";
        else if (prevWord === "def" || prevWord === "function") k = "fn";
        else if (prevWord === "class" || (L === "js" && /^[A-Z]/.test(s))) k = "type";
        else if (/^\s*\(/.test(after) || (L === "py" && PY_BUILTIN.has(s))) k = "fn";
        else if (L === "js" && /^\s*:/.test(after) && /^[{,\s]*$/.test(src.slice(0, i).replace(/^.*[{,]/, ""))) k = "key";
        push(s, k); prevWord = s; i += s.length;
        if (L === "sh") cmdStart = KW.sh.has(s) && s !== "in";
        continue;
      }
      if ((s = at(/[{}[\]();,.:=<>+\-*/%!&|^~?]+/y))) { push(s, "punct"); if (L === "sh" && /[|;&(]/.test(s)) cmdStart = true; i += s.length; continue; }
      push(c, "plain"); i += 1;
    }
    // a heredoc or block scalar opened earlier on the line still applies after it
    return [out, st];
  }
  const tokenize = (src, lang) => tokenizeState(src, lang, null)[0];
  // every line of a file, the state carried from line to line: [{toks, st}] (st: the state the line starts in)
  function tokenizeLines(lines, lang) {
    let st = null;
    return lines.map((ln) => { const [toks, out] = tokenizeState(ln, lang, st), r = { toks, st }; st = out; return r; });
  }
  // a terminal output line: status words in the product's tones, as a CLI colours them
  // (a bare "error" in "error rate 0.4%" is a noun, not a status: lower-case error words count only with a colon)
  const WORD_TONE = [
    [/^(\[?(OK|DONE|PASS|PASSED|READY|SUCCESS)\]?|\[?(ok|done|passed|ready|healthy|succeeded|completed)\]?[:!.,]?|✓|✔)$/, "ok"],
    [/^(\[?(WARN|WARNING)\]?:?|\[?(warn|warning)\]?:|degraded[:!.,]?|retrying[:!.,]?|skipped[:!.,]?)$/, "warn"],
    [/^(\[?(ERROR|ERR|FATAL|FAIL|FAILED)\]?:?|\[?(error|err|fatal)\]?:|(failed|failure|denied|refused|unhealthy)[:!.,]?|✗)$/, "error"],
  ];
  function wordTone(w) { for (const [re, tn] of WORD_TONE) if (re.test(w)) return tn; return null; }

  const FRAME = { x: 96, y: 78, w: 1728, h: 856 };    // the window at zoom 1: above the caption band, room for pills above
  const VIEW = { cx: 960, cy: 500, w: 1920, h: 1080, hb: 944 };   // hb: the caption band starts below it // the zoomed view centres a little above the middle (captions below)

  // ---------------------------------------------------------------- drawing helpers (tokens only)
  function rect(p, x, y, w, h, o) {
    o = o || {};
    return svg("rect", { x: f1(x), y: f1(y), width: f1(Math.max(0, w)), height: f1(Math.max(0, h)), rx: o.r == null ? CFG().radius : o.r,
      fill: o.fill || "none", stroke: o.stroke || "none", "stroke-width": o.sw || (o.stroke ? 1.5 : 0), opacity: o.opacity, class: o.cls }, p);
  }
  // one line of UI text through kit.text (so it is measured, checked and reported), ellipsised to its box the way a real UI
  // truncates; never below the role floor
  function ell(str, role, size, w, weight) {
    str = String(str == null ? "" : str);
    if (!w || K().measure(str, role, size, weight) <= w) return str;
    let lo = 0, hi = str.length;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (K().measure(str.slice(0, m) + "…", role, size, weight) <= w) lo = m; else hi = m; }
    return str.slice(0, lo).replace(/\s+$/, "") + "…";
  }
  function text(p, str, o) {
    o = o || {};
    const role = o.role || "caption", size = o.size || CFG().ui_text, w = o.w || 400, h = o.h || size * 1.6;
    const s = ell(str, role, size, w - 2, o.weight);
    const ov = themed(o.color || "ink");
    const t = K().text(p, s, { role, size, x: o.x || 0, y: o.y || 0, w, h, maxLines: 1, valign: o.valign || "middle", align: o.align || "left", weight: o.weight, color: ov ? "ink" : o.color || "ink" });
    if (ov) t.setAttribute("fill", ov);
    t.setAttribute("data-sc", o.tag || "ui");
    return t;
  }
  const textW = (str, role, size, weight) => K().measure(String(str), role || "caption", size || CFG().ui_text, weight);
  function icon(p, name, cx, cy, size, color) {
    if (!name) return null;
    const ov = themed(color || "muted"), g = K().icon(p, name, { x: cx, y: cy, size: size || 24, color: ov ? "muted" : color || "muted" });
    if (ov && g) g.setAttribute("stroke", ov);
    return g;
  }
  function monogram(p, str, cx, cy, r, fill) {
    svg("circle", { cx: f1(cx), cy: f1(cy), r: f1(r), fill: C(fill || "accent3") }, p);
    return text(p, String(str || "").slice(0, 2).toUpperCase(), { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, size: Math.max(20, Math.min(24, r * 0.9)), weight: 600, align: "center", color: "onAccent", tag: "mono" });
  }
  function shadowRects(p, x, y, w, h, r) {                    // a soft lift without a blur filter: three offset washes
    [[0, 18, 0.05, 10], [0, 8, 0.06, 4], [0, 2, 0.08, 1]].forEach(([dx, dy, op, grow]) =>
      rect(p, x + dx - grow, y + dy - grow / 2, w + 2 * grow, h + grow, { r: r + grow, fill: C("shadow"), opacity: op, cls: "lm-shadow" }));
  }

  // ---------------------------------------------------------------- captured web pages (tools/page_capture.py, 2026-10-16)
  // A capture is the real page once, offline: its DOM (scripts gone, data-lm-i on each element), its CSS at the capture
  // width (:hover, :focus and :active as classes the engine sets on cue), its fonts and images inlined, and each element's
  // box. The .page.js file a capture writes calls Loom.webpage(name, snapshot) when it loads; its fonts join the document
  // then, before boot waits for fonts, so the page is drawn in them from the first frame.
  Loom.webpages = Loom.webpages || {};
  Loom.webpage = function (name, snap) {
    Loom.webpages[name] = snap;
    if (typeof FontFace !== "undefined" && typeof document !== "undefined" && document.fonts && document.fonts.add) {
      for (const f of snap.fonts || []) {
        try {
          const ff = new FontFace(f.family, `url(data:${f.mime || "font/woff2"};base64,${f.b64})`, { weight: String(f.weight || 400), style: f.style || "normal" });
          document.fonts.add(ff); ff.load().catch(() => {});
        } catch (e) { /* a face the browser cannot read: the page falls back, as the real one would */ }
      }
    }
  };
  // a small selector engine over the snapshot's element list (the same in the browser and in the Node preview, and no
  // layout needed): tag, #id, .class, [attr], [attr=v], [attr*=v], [attr^=v], [attr$=v], descendant (space) and child
  // (>) combinators, a list (a, b); "text=Sign in" finds the element whose own words are that (or contain it); a final
  // ":nth(k)" picks the k-th match (from 0) in document order
  function webCompound(src) {
    const c = { tag: null, id: null, cls: [], at: [] };
    const re = /^([a-zA-Z*][\w-]*)|#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]*)))?\s*\]/y;
    let i = 0;
    while (i < src.length) {
      re.lastIndex = i; const m = re.exec(src);
      if (!m || m.index !== i) throw new Error(`screencast page selector: cannot read "${src}" at "${src.slice(i)}"`);
      if (m[1]) c.tag = m[1].toLowerCase(); else if (m[2]) c.id = m[2]; else if (m[3]) c.cls.push(m[3]);
      else c.at.push([m[4], m[5] || null, m[6] != null ? m[6] : m[7] != null ? m[7] : m[8]]);
      i = re.lastIndex;
    }
    return c;
  }
  function webAttr(e, k) {
    if (k === "id") return e.id; if (k === "class") return e.cls;
    return e.a && e.a[k] != null ? e.a[k] : undefined;
  }
  function webMatch(e, c) {
    if (c.tag && c.tag !== "*" && e.tag !== c.tag) return false;
    if (c.id && e.id !== c.id) return false;
    if (c.cls.length) { const cl = String(e.cls || "").split(/\s+/); if (!c.cls.every((x) => cl.includes(x))) return false; }
    for (const [k, op, v] of c.at) {
      const a = webAttr(e, k);
      if (a == null) return false;
      if (op === "=" && a !== v) return false;
      if (op === "*=" && !a.includes(v)) return false;
      if (op === "^=" && !a.startsWith(v)) return false;
      if (op === "$=" && !a.endsWith(v)) return false;
    }
    return true;
  }
  function webSelect(snap, sel) {
    const els = snap.els, by = snap._by || (snap._by = new Map(els.map((e) => [e.i, e])));
    let nth = null;
    sel = String(sel).trim().replace(/:nth\((\d+)\)\s*$/, (m, k) => { nth = +k; return ""; }).trim();
    let out;
    if (/^text=/.test(sel)) {
      const want = sel.slice(5).trim().replace(/^["']|["']$/g, "").toLowerCase();
      const exact = els.filter((e) => (e.tx || "").toLowerCase() === want), part = els.filter((e) => (e.tx || "").toLowerCase().includes(want));
      out = exact.length ? exact : part;
    } else {
      const alts = sel.split(/\s*,\s*/);
      const set = new Set();
      for (const alt of alts) {
        const toks = alt.replace(/\s*>\s*/g, " > ").split(/\s+/).filter(Boolean);
        const steps = []; let comb = " ";
        for (const t of toks) { if (t === ">") { comb = ">"; continue; } steps.push([comb, webCompound(t)]); comb = " "; }
        const up = (e, k) => {                   // does e match steps[0..k], e matching steps[k]?
          if (!webMatch(e, steps[k][1])) return false;
          if (k === 0) return true;
          const comb0 = steps[k][0];
          let q = by.get(e.p);
          if (comb0 === ">") return !!q && up(q, k - 1);
          while (q) { if (up(q, k - 1)) return true; q = by.get(q.p); }
          return false;
        };
        for (const e of els) if (up(e, steps.length - 1)) set.add(e);
      }
      out = els.filter((e) => set.has(e));
    }
    out = out.filter((e) => e.b && e.b[2] > 0 && e.b[3] > 0);   // shown on the page
    return nth != null ? out.slice(nth, nth + 1) : out;
  }
  const webAncestors = (snap, i) => { const by = snap._by || (snap._by = new Map(snap.els.map((e) => [e.i, e]))), r = []; let q = by.get(i); while (q) { r.push(q.i); q = by.get(q.p); } return r; };
  let MCTX = null;
  function pageMeasure(str, font) {
    if (!MCTX) { const cv = document.createElement("canvas"); MCTX = cv && cv.getContext ? cv.getContext("2d") : null; }
    if (!MCTX) return String(str).length * 8;
    MCTX.font = font || "16px sans-serif";
    return MCTX.measureText(String(str)).width;
  }

  // ---------------------------------------------------------------- the app
  const TEACH = new Set(["chapters", "step", "callout", "spotlight", "timelapse", "name", "clearNames", "focus", "unfocus", "chapterCard", "keys"]);
  function app(ctx, name, spec, opts) {
    const th = normTheme(spec && spec.theme), prev = THEME;
    THEME = th;
    try {
      const A = buildApp(ctx, name, spec, opts);
      A.theme = th;
      for (const k of Object.keys(A)) {
        const f = A[k];
        if (typeof f !== "function" || k === "warn" || k === "meta") continue;
        const want = TEACH.has(k) ? null : th;
        A[k] = function () { const p0 = THEME; THEME = want; try { return f.apply(this, arguments); } finally { THEME = p0; } };
      }
      return A;
    } finally { THEME = prev; }
  }
  function buildApp(ctx, name, spec, opts) {
    spec = spec || {}; opts = opts || {};
    const cfg = CFG(), tone = TONE();
    const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "panel", exit: opts.exit || "recede" });
    // A.id is the app's name (A.name is the tour's naming call, set by teach)
    const A = { id: name, name, ctx, E, spec, cfg, parts: {}, regions: {}, pages: {}, page: null, win: null, warnings: [], overlays: [] };
    E.sc = A;
    APPS.push(A);
    const beatId = () => (A.ctx && A.ctx.beat && A.ctx.beat.id) || E.beat;
    const meta = (kind, nm, content) => ({ kind, beat: beatId(), name: `${name}.${nm || kind}`, content: content !== false });
    A.meta = meta;
    const warn = (code, msg) => { A.warnings.push({ code, msg }); Loom.warn(code, `${beatId()}: ${msg}`, { beat: beatId() }); };
    A.warn = warn;
    // every overlay on screen (step pills, callouts, names, the HUD, time-lapse tags, spotlight labels, toasts) with its
    // window: the audit counts them at each moment (sc_overlays_crowded)
    A.overlay = (kind, label, t0, t1) => { const r = { id: `${name}:${A.overlays.length}`, kind, label: String(label == null ? "" : label).slice(0, 48), t0, t1: t1 == null ? Infinity : t1 }; A.overlays.push(r); return r; };

    // ---- layers: the camera group (window, content, veil, marks, pointer) and the screen-space hud above it
    const cam = svg("g", { class: "lm-sc-cam" }, E.inner);
    const base = svg("g", { class: "lm-sc-base" }, cam);
    const content = svg("g", { class: "lm-sc-content" }, cam);
    const over = svg("g", { class: "lm-sc-over" }, cam);       // dialogs, menus, toasts: product overlays
    const veil = svg("g", { class: "lm-sc-veil" }, cam);
    const marks = svg("g", { class: "lm-sc-marks" }, cam);
    const ptrG = svg("g", { class: "lm-sc-pointer", opacity: 0 }, cam);
    const hud = svg("g", { class: "lm-sc-hud" }, E.inner);
    A.layers = { cam, base, content, over, veil, marks, ptr: ptrG, hud };

    // ---- the window
    const win = Object.assign({}, FRAME, spec.frame || {});
    A.win = win;
    E.matchBox = win;   // the app element is full frame; what it shows is its window (Loom.world.redrawOf matches on this)
    const R = cfg.radius + 4;
    const chromeKind = spec.chrome || "window";
    // chrome "terminal": a terminal window, dark from edge to edge (its content is one terminal region)
    const TT = chromeKind === "terminal" ? TERM() : null;
    A.dark = TT;
    shadowRects(base, win.x, win.y, win.w, win.h, R);
    rect(base, win.x, win.y, win.w, win.h, { r: R, fill: TT ? TT.bg : C("surface"), stroke: TT ? TT.bar : tone.hair2, sw: 1.5 });
    let top = win.y;
    if (chromeKind !== "none") {
      const ch = chromeKind === "browser" ? 66 : 54;
      const g = svg("g", { class: "lm-sc-chrome" }, content);
      // the bar: rounded at the top only
      svg("path", { d: `M${win.x} ${win.y + ch} L${win.x} ${win.y + R} Q${win.x} ${win.y} ${win.x + R} ${win.y} L${win.x + win.w - R} ${win.y} Q${win.x + win.w} ${win.y} ${win.x + win.w} ${win.y + R} L${win.x + win.w} ${win.y + ch} Z`, fill: TT ? TT.bar : tone.chrome }, g);
      svg("rect", { x: win.x, y: win.y + ch - 1, width: win.w, height: 1.5, fill: TT ? TT.bg : tone.hair2 }, g);
      [0, 1, 2].forEach((i) => svg("circle", { cx: win.x + 28 + i * 24, cy: win.y + ch / 2, r: 7, fill: TT ? TT.dot : tone.dot }, g));
      // (drawn in surface, then set to the derived dim tone: kit.text takes tokens only)
      if (TT && spec.title) text(g, spec.title, { x: win.x + 140, y: win.y + 6, w: win.w - 280, h: ch - 12, size: cfg.ui_small, weight: 600, color: "surface", align: "center", tag: "title" }).setAttribute("fill", TT.dim);
      if (chromeKind === "browser") {
        [["arrow-left", 132], ["arrow-right", 170], ["rotate-cw", 208]].forEach(([ic, x]) => icon(g, ic, win.x + x, win.y + ch / 2, 22, "muted"));
        const aw = Math.min(900, win.w - 520), ax = win.x + (win.w - aw) / 2, ay = win.y + 12, ah = ch - 24;
        const ag = svg("g", {}, g);
        rect(ag, ax, ay, aw, ah, { r: ah / 2, fill: C("surface"), stroke: tone.hair2, sw: 1.2 });
        icon(ag, "lock", ax + 26, ay + ah / 2, 18, "muted");
        if (spec.url) text(ag, spec.url, { x: ax + 46, y: ay, w: aw - 70, h: ah, size: cfg.ui_small, color: "muted", tag: "url" });
        reg({ id: "url", kind: "field", x: ax, y: ay, w: aw, h: ah, g: ag, r: ah / 2 });
      } else if (spec.title && !TT) {
        const tg = svg("g", {}, g);
        rect(tg, win.x + 120, win.y + 6, win.w - 240, ch - 12, { r: 8, fill: tone.chrome });
        text(tg, spec.title, { x: win.x + 140, y: win.y + 6, w: win.w - 280, h: ch - 12, size: cfg.ui_small, weight: 600, color: "muted", align: "center", tag: "title" });
      }
      top = win.y + ch;
    }
    A.appTop = top;

    // ---- part registry: every region and control is an element-local rect with a group and a state layer
    function reg(p) {
      // the same control on two pages (a tab row, a toolbar) is that page's own: "<page>:<id>" for every page after the first
      if (A.parts[p.id] && A.building && A.parts[p.id].page && A.parts[p.id].page !== A.building) p.id = `${A.building}:${p.id}`;
      if (A.parts[p.id]) warn("sc_part_duplicate", `part "${p.id}" is defined twice in "${name}"; the second hides the first`);
      p.page = p.page || A.building || null;
      p.region = p.region || null;
      A.parts[p.id] = p;
      // the state layer: an ink wash on top of the part (hover 0.06, press 0.14), off at load
      if (p.g && !p.nofx && p.kind !== "region" && p.kind !== "text" && p.kind !== "field" && p.kind !== "select") {
        p.fx = rect(p.g, p.x, p.y, p.w, p.h, { r: p.r == null ? cfg.radius - 2 : p.r, fill: C("ink"), opacity: 0 });
        p.fx.setAttribute("pointer-events", "none");
      }
      return p;
    }
    A.reg = reg;

    // ---- sidebar
    let left = win.x;
    if (spec.nav && spec.nav.length) {
      const sw = spec.sidebarW || (spec.layout && spec.layout.sidebarW) || 300;
      const g = svg("g", { class: "lm-sc-sidebar" }, content);
      svg("rect", { x: win.x, y: top, width: sw, height: win.y + win.h - top, fill: tone.side }, g);
      svg("rect", { x: win.x + sw - 1, y: top, width: 1.5, height: win.y + win.h - top, fill: tone.hair2 }, g);
      let y = top + 22;
      if (spec.brand) {
        const bg = svg("g", {}, g);
        rect(bg, win.x + 24, y, 44, 44, { r: 10, fill: C("accent") });
        text(bg, String(spec.brand).trim().charAt(0).toUpperCase(), { x: win.x + 24, y, w: 44, h: 44, role: "label", size: 24, weight: 700, align: "center", color: "onAccent", tag: "logo" });
        text(g, spec.brand, { x: win.x + 82, y, w: sw - 100, h: 44, role: "label", size: 24, weight: 700, color: themed("sideOn") ? "sideOn" : themed("sideInk") ? "sideInk" : "ink", tag: "brand" });
        y += 44 + 26;
      }
      for (const it of spec.nav) {
        if (it.section) {
          text(g, it.section, { x: win.x + 28, y, w: sw - 56, h: 34, size: cfg.ui_small, weight: 600, color: themed("sideMuted") ? "sideMuted" : "muted", tag: "nav_section" });
          y += 38; continue;
        }
        const ng = svg("g", { class: "lm-sc-nav" }, g);
        const x = win.x + 14, w = sw - 28, h = cfg.nav_row;
        const SI = themed("sideInk") ? "sideInk" : "ink", SM = themed("sideInk") ? "sideInk" : "muted", SO = themed("sideOn") ? "sideOn" : "accent";
        const sel = rect(ng, x, y, w, h, { r: Math.min(10, cfg.radius), fill: tone.sideSel || tone.sel, opacity: 0 });
        const bar = rect(ng, x, y + 12, 4, h - 24, { r: 2, fill: tone.selBar, opacity: 0 });
        const icMuted = icon(ng, it.icon, x + 30, y + h / 2, 24, SM);
        const icOn = icon(ng, it.icon, x + 30, y + h / 2, 24, SO);
        if (icOn) icOn.setAttribute("opacity", 0);
        const lbW = w - (it.icon ? 58 : 20) - (it.count != null ? 56 : 0);
        const lb = text(ng, it.label, { x: x + (it.icon ? 56 : 18), y, w: lbW, h, size: cfg.ui_text, weight: 600, color: SI, tag: "nav" });
        const lbOn = text(ng, it.label, { x: x + (it.icon ? 56 : 18), y, w: lbW, h, size: cfg.ui_text, weight: 600, color: SO, tag: "nav_on" });
        lbOn.setAttribute("opacity", 0);
        if (it.count != null) {
          const cg = svg("g", {}, ng), cw = Math.max(40, textW(String(it.count), "caption", 20, 600) + 22);
          rect(cg, x + w - cw - 10, y + (h - 32) / 2, cw, 32, { r: 16, fill: tone.track });
          text(cg, String(it.count), { x: x + w - cw - 10, y: y + (h - 32) / 2, w: cw, h: 32, size: 20, weight: 600, align: "center", color: "ink", tag: "count" });
        }
        const P = reg({ id: "nav." + it.id, kind: "nav", x, y, w, h, g: ng, r: 10, label: it.label, on: [sel, bar, icOn, lbOn], off: [icMuted, lb] });
        if (it.id === spec.active) setOn(P, true, null);
        y += h + 6;
      }
      left = win.x + sw;
    }
    A.left = left;

    // ---- top bar: search, icon buttons, the user
    let y0 = top;
    if (spec.search != null || spec.user || (spec.actions && spec.actions.length)) {
      const th = (spec.layout && spec.layout.topbarH) || 76, g = svg("g", { class: "lm-sc-topbar" }, content);
      svg("rect", { x: left, y: top, width: win.x + win.w - left, height: th, fill: tone.bar || C("surface") }, g);
      svg("rect", { x: left, y: top + th - 1, width: win.x + win.w - left, height: 1.5, fill: tone.hair2 }, g);
      if (spec.search != null) {
        const sgp = svg("g", {}, g), sw_ = Math.min(560, (win.x + win.w - left) * 0.45), sx = left + 28, sy = top + 14, sh = th - 28;
        rect(sgp, sx, sy, sw_, sh, { r: 10, fill: C("surface2"), stroke: tone.hair, sw: 1.2 });
        icon(sgp, "search", sx + 26, sy + sh / 2, 22, "muted");
        const ph = spec.search ? text(sgp, spec.search, { x: sx + 50, y: sy, w: sw_ - 66, h: sh, size: cfg.ui_text, color: "muted", tag: "placeholder" }) : null;
        if (spec.searchKey) {
          const kw = textW(spec.searchKey, "caption", 20, 600) + 30;
          const kg = svg("g", {}, sgp);
          rect(kg, sx + sw_ - kw - 12, sy + (sh - 36) / 2, kw, 36, { r: 6, fill: C("surface"), stroke: tone.hair2, sw: 1.2 });
          text(kg, spec.searchKey, { x: sx + sw_ - kw - 12, y: sy + (sh - 36) / 2, w: kw, h: 36, size: 20, weight: 600, align: "center", color: "muted", tag: "kbd" });
        }
        reg({ id: "search", kind: "field", x: sx, y: sy, w: sw_, h: sh, g: sgp, r: 10, placeholder: ph, pad: 50 });
      }
      let rx = win.x + win.w - 28;
      if (spec.user) {
        const ug = svg("g", {}, g);
        rx -= 44;
        monogram(ug, spec.user, rx + 22, top + th / 2, 22, "accent3");
        reg({ id: "user", kind: "button", x: rx, y: top + th / 2 - 22, w: 44, h: 44, g: ug, r: 22 });
        rx -= 18;
      }
      for (const ic of (spec.actions || []).slice().reverse()) {
        const id = typeof ic === "string" ? ic : ic.id, nm = typeof ic === "string" ? ic : ic.icon;
        const ag = svg("g", {}, g);
        rx -= 48;
        rect(ag, rx, top + th / 2 - 24, 48, 48, { r: 10, fill: C("surface") });
        icon(ag, nm, rx + 24, top + th / 2, 24, "muted");
        if (ic.badge) svg("circle", { cx: rx + 34, cy: top + th / 2 - 13, r: 6, fill: C("neg") }, ag);
        reg({ id: "top." + id, kind: "button", x: rx, y: top + th / 2 - 24, w: 48, h: 48, g: ag, r: 10 });
        rx -= 8;
      }
      y0 = top + th;
    }
    A.mainTop = y0;
    const MAIN = { x: left, y: y0, w: win.x + win.w - left, h: win.y + win.h - y0 };
    A.main = MAIN;
    svg("rect", { x: MAIN.x, y: MAIN.y, width: MAIN.w, height: MAIN.h - R * 0.4, fill: TT ? TT.bg : tone.page }, content);

    function buildPage(pid, pg, g) {
      // a terminal window's terminal runs to its edges, and so does a captured web page in its browser
      const bare = (pg.content || []).length === 1 && !Array.isArray(pg.content[0]) && pg.content[0].kind === "page" && !pg.title && !(pg.toolbar || []).length && !pg.tabs;
      const pad = bare ? 0 : A.dark ? 8 : 32;
      let y = MAIN.y + (bare ? 0 : A.dark ? 8 : 26);
      const x0 = MAIN.x + pad, w0 = MAIN.w - 2 * pad;
      if (pg.title || (pg.toolbar && pg.toolbar.length)) {
        const hh = 60;
        if (pg.title) {
          const tw = Math.max(200, w0 - toolbarW(pg.toolbar) - 24);
          text(g, pg.title, { x: x0, y, w: tw, h: pg.sub ? 40 : hh, role: "label", size: cfg.ui_head + 2, weight: 700, tag: "page_title" });
          if (pg.sub) text(g, pg.sub, { x: x0, y: y + 38, w: tw, h: 30, size: cfg.ui_small, color: "muted", tag: "page_sub" });
        }
        let bx = x0 + w0;
        for (const b of (pg.toolbar || []).slice().reverse()) {
          const bw = buttonW(b);
          bx -= bw;
          button(g, Object.assign({}, b, { id: "tool." + b.id }), bx, y + (hh - cfg.control_h) / 2, bw);
          bx -= 12;
        }
        y += hh + 14;
      }
      if (pg.tabs && pg.tabs.items) {
        const tg = svg("g", { class: "lm-sc-tabs" }, g);
        svg("rect", { x: x0, y: y + 50, width: w0, height: 1.5, fill: tone.hair2 }, tg);
        let tx = x0;
        pg.tabs.items.forEach((lab, i) => {
          const L = typeof lab === "string" ? { id: String(i), label: lab } : lab;
          const tw = textW(L.label, "caption", cfg.ui_text, 600) + 36;
          const g1 = svg("g", {}, tg);
          const lb = text(g1, L.label, { x: tx, y, w: tw, h: 50, size: cfg.ui_text, weight: 600, color: "muted", align: "center", tag: "tab" });
          const lbOn = text(g1, L.label, { x: tx, y, w: tw, h: 50, size: cfg.ui_text, weight: 600, color: "accent", align: "center", tag: "tab_on" });
          lbOn.setAttribute("opacity", 0);
          const ul = rect(g1, tx + 8, y + 47, tw - 16, 4, { r: 2, fill: C("accent"), opacity: 0 });
          const P = reg({ id: "tab." + L.id, kind: "tab", x: tx, y, w: tw, h: 50, g: g1, r: 6, on: [lbOn, ul], off: [lb], group: "tabs:" + pid });
          if ((pg.tabs.active == null ? 0 : pg.tabs.active) === i || pg.tabs.active === L.id) setOn(P, true, null);
          tx += tw + 8;
        });
        y += 66;
      }
      // content rows: a region, or an array of regions side by side ({w: fraction})
      const rows = (pg.content || []).map((r) => (Array.isArray(r) ? r : [r]));
      const bottom = MAIN.y + MAIN.h - (bare ? 0 : A.dark ? 8 : 26), gap = 22;
      const fixed = rows.map((row) => Math.max(...row.map((rg) => regionH(rg))));
      const flex = rows.map((row) => row.some((rg) => rg.h == null && FLEX.has(rg.kind)));
      const free = bottom - y - fixed.reduce((a, b, i) => a + (flex[i] ? 0 : b), 0) - gap * Math.max(0, rows.length - 1);
      const nflex = flex.filter(Boolean).length;
      rows.forEach((row, ri) => {
        const h = flex[ri] ? Math.max(fixed[ri], free / Math.max(1, nflex)) : fixed[ri];
        const fr = row.map((rg) => rg.w || 1 / row.length), sum = fr.reduce((a, b) => a + b, 0);
        let x = x0;
        row.forEach((rg, i) => {
          let w = (w0 - gap * (row.length - 1)) * fr[i] / sum;
          // a settings list keeps a readable measure, as real settings pages do (and the camera can frame a row at 32 px)
          if (row.length === 1 && (rg.maxW || rg.kind === "settings")) w = Math.min(w, rg.maxW || 1000);
          region(g, rg, x, y, w, h, pid);
          x += w + gap;
        });
        y += h + gap;
      });
      if (y - gap > bottom + 1) warn("sc_page_overflow", `page "${pid}" of "${name}" is ${Math.round(y - gap - bottom)} px taller than the window: fewer rows, or a scroll region`);
    }
    function toolbarW(tb) { return (tb || []).reduce((a, b) => a + buttonW(b) + 12, 0); }
    function buttonW(b) { return b.w || Math.ceil(textW(b.label || "", "caption", cfg.ui_text, 600) + (b.icon ? 64 : 40)); }
    function button(g, b, x, y, w, h) {
      h = h || cfg.control_h;
      const kind = b.kind || "secondary", bg = svg("g", { class: "lm-sc-button" }, g);
      const fill = kind === "primary" ? C("accent") : kind === "danger" ? C("neg") : kind === "ghost" ? "none" : C("surface");
      rect(bg, x, y, w, h, { r: 10, fill, stroke: kind === "secondary" ? tone.hair2 : "none", sw: 1.5 });
      const col = kind === "primary" || kind === "danger" ? "onAccent" : kind === "ghost" ? "accent" : "ink";
      const lx = x + (b.icon ? 44 : 20);
      if (b.icon) icon(bg, b.icon, x + 26, y + h / 2, 22, col);
      if (b.label) text(bg, b.label, { x: lx, y, w: w - (lx - x) - 16, h, size: cfg.ui_text, weight: 600, color: col, align: b.icon ? "left" : "center", tag: "button" });
      return reg({ id: b.id, kind: "button", x, y, w, h, g: bg, r: 10, label: b.label, variant: kind });
    }
    A.button = button;

    // ---- regions
    const FLEX = new Set(["table", "list", "settings", "empty", "detail", "form", "code", "terminal", "page"]);
    function regionH(rg) {
      if (rg.h != null) return rg.h;
      if (rg.kind === "cards") return 132;
      if (rg.kind === "code") return (rg.title ? 56 : 0) + 24 + Math.round((rg.size || cfg.code_px) * cfg.code_lh) * 4;
      if (rg.kind === "terminal") return 28 + Math.round((rg.size || cfg.term_px) * cfg.term_lh) * 4;
      if (rg.kind === "chart") return 300;
      if (rg.kind === "table") return 52 + cfg.row * Math.min(3, (rg.rows || []).length) + (rg.title ? 56 : 0);
      if (rg.kind === "form") return formH(rg);
      if (rg.kind === "settings") return (rg.title ? 64 : 12) + 92 * Math.min(2, (rg.rows || []).length);
      if (rg.kind === "detail") return (rg.title ? 64 : 16) + 58 * (rg.rows || []).length + (rg.actions ? 72 : 8);
      if (rg.kind === "list") return (rg.title ? 64 : 12) + 76 * Math.min(2, (rg.items || []).length);
      return 160;
    }
    function card(g, x, y, w, h) { return rect(g, x, y, w, h, { r: 12, fill: C("surface"), stroke: tone.hair2, sw: 1.5 }); }
    function regionTitle(g, rg, x, y, w) {
      if (!rg.title) return 0;
      text(g, rg.title, { x: x + 24, y: y + 12, w: w - 48 - (rg.titleAction ? 200 : 0), h: 44, role: "label", size: 24, weight: 700, tag: "region_title" });
      if (rg.titleAction) button(g, Object.assign({ kind: "ghost" }, rg.titleAction, { id: rg.id + "." + rg.titleAction.id }), x + w - 210, y + 10, 190, 44);
      return 56;
    }
    function region(g0, rg, x, y, w, h, pid) {
      if (!rg.id) throw new Error(`screencast app "${name}": every content region needs an id (a ${rg.kind})`);
      const g = svg("g", { class: "lm-sc-region", "data-region": rg.id }, g0);
      const RG = { id: rg.id, kind: rg.kind, x, y, w, h, g, spec: rg, page: pid, scroll: [], body: null };
      A.regions[rg.id] = RG;
      reg({ id: rg.id, kind: "region", x, y, w, h, g, r: 12 });
      const fn = REGION[rg.kind];
      if (!fn) throw new Error(`screencast app "${name}": no region kind "${rg.kind}" (have: ${Object.keys(REGION).join(", ")})`);
      fn(g, rg, x, y, w, h, RG);
      return RG;
    }
    // a scroll body: rows drawn in a clipped group that A.scroll moves; parts in it carry the region so their rect follows
    function body(RG, g, x, y, w, h) {
      const id = Loom.uid ? Loom.uid("scclip") : "scclip" + Math.round(x * 7 + y);
      const cp = svg("clipPath", { id }, g); svg("rect", { x: f1(x), y: f1(y), width: f1(w), height: f1(h) }, cp);
      const outer = svg("g", { "clip-path": `url(#${id})` }, g);
      const inner = svg("g", {}, outer);
      RG.body = { x, y, w, h, g: inner, content: 0 };
      return inner;
    }
    const REGION = {};
    REGION.cards = (g, rg, x, y, w, h, RG) => {
      const items = rg.items || [], n = Math.max(1, items.length), gap = 20, cw = (w - gap * (n - 1)) / n;
      items.forEach((it, i) => {
        const cx = x + i * (cw + gap), cg = svg("g", {}, g);
        card(cg, cx, y, cw, h);
        if (it.icon) icon(cg, it.icon, cx + cw - 40, y + 38, 26, toneTok(it.tone) === "accent3" ? "muted" : toneTok(it.tone));
        text(cg, it.label, { x: cx + 24, y: y + 16, w: cw - 48 - (it.icon ? 40 : 0), h: 40, size: cfg.ui_small, color: "muted", tag: "card_label" });
        const valBox = { x: cx + 24, y: y + 48, w: cw - 48, h: 66, role: "title", size: 52, weight: 700, tag: "card_value" };
        const vn = text(cg, it.value, Object.assign({}, valBox, { color: it.tone ? toneTok(it.tone) : "ink" }));
        const subBox = h > 150 ? { x: cx + 24, y: y + 116, w: cw - 48, h: 28, size: cfg.ui_small, color: "muted", tag: "card_sub" } : null;
        const sn = it.sub && subBox ? text(cg, it.sub, subBox) : null;
        const cp = reg({ id: `${rg.id}.card.${it.id == null ? i : it.id}`, kind: "card", x: cx, y, w: cw, h, g: cg, r: 12, region: rg.id, item: it, valBox, subBox, valueNode: vn, subNode: sn, valueStr: String(it.value == null ? "" : it.value) });
        // a card answers to its index and to its id
        if (it.id != null && !A.parts[`${rg.id}.card.${i}`]) A.parts[`${rg.id}.card.${i}`] = cp;
      });
    };
    REGION.table = (g, rg, x, y, w, h, RG) => {
      card(g, x, y, w, h);
      const th0 = regionTitle(g, rg, x, y, w);
      const cols = rg.columns || [], fr = cols.map((c) => c.w || 1), sum = fr.reduce((a, b) => a + b, 0) || 1;
      const check = !!rg.check, cx0 = x + (check ? 64 : 20), cwAll = w - (check ? 64 : 20) - 20;
      const colX = []; let acc = cx0;
      cols.forEach((c, i) => { colX.push(acc); acc += cwAll * fr[i] / sum; });
      const colW = cols.map((c, i) => cwAll * fr[i] / sum);
      const hy = y + th0, hh = 50;
      const hg = svg("g", {}, g);
      if (th0) rect(hg, x + 1, hy, w - 2, hh, { r: 0, fill: C("surface2") });
      else svg("path", { d: `M${f1(x + 1)} ${f1(hy + hh)} V${f1(hy + 12)} Q${f1(x + 1)} ${f1(hy + 1)} ${f1(x + 12)} ${f1(hy + 1)} H${f1(x + w - 12)} Q${f1(x + w - 1)} ${f1(hy + 1)} ${f1(x + w - 1)} ${f1(hy + 12)} V${f1(hy + hh)} Z`, fill: C("surface2") }, hg);
      svg("rect", { x: x, y: hy + hh - 1, width: w, height: 1.5, fill: tone.hair2 }, hg);
      if (check) checkbox(hg, x + 22, hy + hh / 2 - 13, false);
      cols.forEach((c, i) => text(hg, c.label, { x: colX[i] + 4, y: hy, w: colW[i] - 12 - (c.align === "right" ? 28 : 0), h: hh, size: cfg.ui_small, weight: 600, color: "muted", align: c.align || "left", tag: "th" }));
      const by = hy + hh, bh = y + h - by - 2;
      const B = body(RG, g, x, by, w, bh);
      const rows = rg.rows || [];
      rows.forEach((row, r) => {
        const ry = by + r * cfg.row, rgp = svg("g", { class: "lm-sc-row" }, B);
        const sel = rect(rgp, x + 1, ry, w - 2, cfg.row, { r: 0, fill: tone.sel, opacity: 0 });
        const selBar = rect(rgp, x + 1, ry, 4, cfg.row, { r: 0, fill: tone.selBar, opacity: 0 });
        if (r < rows.length - 1) svg("rect", { x: x + 16, y: ry + cfg.row - 1, width: w - 32, height: 1, fill: tone.hair }, rgp);
        const cells = Array.isArray(row) ? row : cols.map((c) => row[c.key]);
        const P = reg({ id: `${rg.id}.row.${r}`, kind: "row", x: x + 1, y: ry, w: w - 2, h: cfg.row, g: rgp, r: 0, region: rg.id, on: [sel, selBar], off: [], cells: [] });
        if (check) P.check = checkbox(rgp, x + 22, ry + cfg.row / 2 - 13, !!(rg.checked || []).includes(r));
        cells.forEach((v, i) => {
          const c = cols[i] || {}, cg = svg("g", {}, rgp);
          P.cells.push(cell(cg, c, v, colX[i] + 4, ry, colW[i] - 12, cfg.row, rg));
          reg({ id: `${rg.id}.cell.${r}.${i}`, kind: "cell", x: colX[i], y: ry, w: colW[i], h: cfg.row, g: cg, r: 6, region: rg.id });
        });
        if (rg.select === r) setOn(P, true, null);
      });
      RG.body.content = rows.length * cfg.row;
      if (RG.body.content > bh + 1) scrollbar(RG);
    };
    // a cell: text, strong, muted, mono, status (a tone pill), avatar (a monogram and a name)
    function cell(g, c, v, x, y, w, h, rg) {
      const kind = c.kind || "text", out = { g, kind, x, y, w, h, nodes: [] };
      if (v == null || v === "") return out;
      if (kind === "status") {
        const tn = toneTok((c.tones || rg.tones || {})[v] || "neutral");
        // 22 px either side: the pill's round ends eat the inset, and the layout check measured 5 px with 15 (2026-10-16)
        // 38 px tall: the check measures the inset on all four sides (a 34 px pill left 5 px above and below a 20 px word)
        const pw = Math.min(w, textW(v, "caption", 20, 600) + 44), py = y + (h - 38) / 2;
        const pg = svg("g", {}, g);
        out.pill = rect(pg, x, py, pw, 38, { r: 19, fill: S().mix(C(tn), C("surface"), 0.86) });
        out.nodes.push(pg, text(pg, v, { x, y: py, w: pw, h: 38, size: 20, weight: 600, align: "center", color: tn, tag: "status" }));
        return out;
      }
      if (kind === "avatar") {
        monogram(g, String(v).split(/\s+/).map((s) => s[0]).join(""), x + 18, y + h / 2, 18, "accent3");
        out.nodes.push(text(g, v, { x: x + 46, y, w: w - 46, h, size: cfg.ui_text, tag: "td" }));
        return out;
      }
      out.nodes.push(text(g, v, { x, y, w: c.align === "right" ? w - 28 : w, h, size: cfg.ui_text, weight: kind === "strong" ? 600 : undefined, color: kind === "muted" ? "muted" : "ink", align: c.align || "left", tag: kind === "mono" ? "td_mono" : "td" }));
      return out;
    }
    function checkbox(g, x, y, on) {
      const cg = svg("g", {}, g);
      rect(cg, x, y, 26, 26, { r: 6, fill: C("surface"), stroke: tone.hair2, sw: 2 });
      const onG = svg("g", { opacity: on ? 1 : 0 }, cg);
      rect(onG, x, y, 26, 26, { r: 6, fill: C("accent") });
      svg("path", { d: `M${x + 6} ${y + 13.5} L${x + 11} ${y + 18.5} L${x + 20} ${y + 8}`, fill: "none", stroke: C("onAccent"), "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, onG);
      return { g: cg, on: onG, state: !!on };
    }
    function toggle(g, x, y, on) {
      const tg = svg("g", {}, g), w = 56, h = 32;
      const trackOff = rect(tg, x, y, w, h, { r: h / 2, fill: tone.track });
      const trackOn = rect(tg, x, y, w, h, { r: h / 2, fill: C("accent"), opacity: on ? 1 : 0 });
      const knobG = svg("g", { transform: `translate(${on ? w - h : 0} 0)` }, tg);
      svg("circle", { cx: x + h / 2, cy: y + h / 2 + 1, r: h / 2 - 4, fill: C("shadow"), opacity: 0.18 }, knobG);
      svg("circle", { cx: x + h / 2, cy: y + h / 2, r: h / 2 - 4, fill: C("surface") }, knobG);
      return { g: tg, trackOn, trackOff, knob: knobG, state: !!on, travel: w - h, x, y, w, h };
    }
    function scrollbar(RG) {
      const B = RG.body, trackH = B.h - 16, th = Math.max(48, trackH * B.h / B.content);
      const sg = svg("g", {}, RG.g);
      rect(sg, B.x + B.w - 14, B.y + 8, 6, trackH, { r: 3, fill: tone.hair, opacity: 0.8 });
      RG.thumb = rect(sg, B.x + B.w - 14, B.y + 8, 6, th, { r: 3, fill: tone.hair2 });
      RG.thumbH = th; RG.trackH = trackH;
    }
    function formH(rg) {
      const cols = rg.cols || 1, n = Math.ceil((rg.fields || []).length / cols);
      return (rg.title ? 64 : 20) + (rg.fields || []).reduce((a, f, i) => (i % cols === 0 ? a + fieldH(f) : a), 0) + (rg.actions ? 76 : 8) + (n ? 0 : 0);
    }
    const fieldH = (f) => (f.kind === "toggle" || f.kind === "checkbox" ? 64 : f.kind === "textarea" ? 176 : 118);
    REGION.form = (g, rg, x, y, w, h, RG) => {
      if (!rg.bare) card(g, x, y, w, h);
      let yy = y + (rg.title ? regionTitle(g, rg, x, y, w) + 8 : 20);
      const cols = rg.cols || 1, gap = 24, fw = (w - 48 - gap * (cols - 1)) / cols;
      const fields = rg.fields || [];
      for (let i = 0; i < fields.length; i += cols) {
        let rowH = 0;
        for (let j = 0; j < cols && i + j < fields.length; j++) {
          const f = fields[i + j], fx = x + 24 + j * (fw + gap);
          field(g, f, rg.id, fx, yy, fw);
          rowH = Math.max(rowH, fieldH(f));
        }
        yy += rowH;
      }
      if (rg.actions) {
        let bx = x + w - 24;
        for (const b of rg.actions.slice().reverse()) { const bw = buttonW(b); bx -= bw; button(g, Object.assign({}, b, { id: rg.id + ".action." + b.id }), bx, y + h - 24 - cfg.control_h, bw); bx -= 12; }
      }
    };
    // a field: a label above, the input (text, password, select, textarea), help or error text below; toggles and
    // checkboxes sit on one line. Its part carries what typing, errors and values need.
    function field(g, f, rid, x, y, w) {
      const id = rid ? `${rid}.${f.id}` : f.id, fg = svg("g", { class: "lm-sc-field" }, g);
      if (f.kind === "toggle" || f.kind === "checkbox") {
        const ctl = f.kind === "toggle" ? toggle(fg, x + w - 56, y + 14, !!f.value) : checkbox(fg, x, y + 17, !!f.value);
        text(fg, f.label, { x: f.kind === "toggle" ? x : x + 40, y: y + 4, w: w - 72, h: 52, size: cfg.ui_text, weight: 600, tag: "label" });
        return reg({ id, kind: f.kind, x: f.kind === "toggle" ? x + w - 56 : x, y: f.kind === "toggle" ? y + 14 : y + 17, w: f.kind === "toggle" ? 56 : 26, h: f.kind === "toggle" ? 32 : 26,
          g: fg, r: f.kind === "toggle" ? 16 : 6, ctl, region: rid, label: f.label });
      }
      text(fg, f.label, { x, y, w, h: 34, size: cfg.ui_small, weight: 600, color: "ink", tag: "label" });
      const ih = f.kind === "textarea" ? 116 : 52, iy = y + 38;
      const ig = svg("g", {}, fg);
      const box = rect(ig, x, iy, w, ih, { r: 8, fill: C("surface"), stroke: tone.hair2, sw: 1.5 });
      const ring = rect(ig, x - 3, iy - 3, w + 6, ih + 6, { r: 10, fill: "none", stroke: C("accent"), sw: 2.5, opacity: 0 });
      const bad = rect(ig, x, iy, w, ih, { r: 8, fill: "none", stroke: C("neg"), sw: 2.5, opacity: 0 });
      const pad = 18, right = f.kind === "select" ? 46 : 0;
      let val = null, ph = null;
      const shown = f.kind === "password" && f.value ? "•".repeat(Math.min(14, String(f.value).length)) : f.value;
      if (f.value != null && f.value !== "") val = text(ig, shown, { x: x + pad, y: iy, w: w - 2 * pad - right, h: f.kind === "textarea" ? 52 : ih, size: cfg.ui_text, tag: "value" });
      else if (f.placeholder) ph = text(ig, f.placeholder, { x: x + pad, y: iy, w: w - 2 * pad - right, h: f.kind === "textarea" ? 52 : ih, size: cfg.ui_text, color: "muted", tag: "placeholder" });
      if (f.kind === "select") icon(ig, "chevron-down", x + w - 26, iy + ih / 2, 22, "muted");
      let help = null;
      if (f.help) help = text(fg, f.help, { x, y: iy + ih + 4, w, h: 26, size: 20, color: "muted", tag: "help" });
      return reg({ id, kind: f.kind === "select" ? "select" : "field", x, y: iy, w, h: ih, g: ig, r: 8, ring, bad, box, value: val, placeholder: ph, help, pad, right,
        password: f.kind === "password", label: f.label, region: rid, fg, msgY: iy + ih + 4, fieldW: w, multiline: f.kind === "textarea" });
    }
    A.field = field;
    REGION.settings = (g, rg, x, y, w, h, RG) => {
      card(g, x, y, w, h);
      const t0 = regionTitle(g, rg, x, y, w);
      const B = body(RG, g, x, y + t0 + 4, w, h - t0 - 8);
      const rh = 92;
      (rg.rows || []).forEach((row, i) => {
        const ry = y + t0 + 4 + i * rh, sg = svg("g", { class: "lm-sc-setting" }, B);
        if (i) svg("rect", { x: x + 24, y: ry, width: w - 48, height: 1, fill: tone.hair }, sg);
        const ctlW = row.kind === "toggle" ? 56 : row.kind === "select" ? 240 : row.kind === "button" ? buttonW(row.button || { label: row.value }) : 40;
        text(sg, row.label, { x: x + 24, y: ry + (row.desc ? 12 : 20), w: w - 72 - ctlW, h: 36, size: cfg.ui_text, weight: 600, tag: "setting" });
        if (row.desc) text(sg, row.desc, { x: x + 24, y: ry + 46, w: w - 72 - ctlW, h: 30, size: 20, color: "muted", tag: "setting_desc" });
        const cx = x + w - 24 - ctlW, cy = ry + rh / 2;
        if (row.kind !== "chevron") reg({ id: `${rg.id}.${row.id}.row`, kind: "text", x: x + 8, y: ry + 4, w: w - 16, h: rh - 8, g: sg, r: 10, region: rg.id });
        if (row.kind === "toggle") {
          const ctl = toggle(sg, cx, cy - 16, !!row.value);
          reg({ id: `${rg.id}.${row.id}`, kind: "toggle", x: cx, y: cy - 16, w: 56, h: 32, g: sg, r: 16, ctl, region: rg.id, label: row.label, row: { x: x + 1, y: ry, w: w - 2, h: rh } });
        } else if (row.kind === "select") {
          const fg = svg("g", {}, sg);
          const box = rect(fg, cx, cy - 24, ctlW, 48, { r: 8, fill: C("surface"), stroke: tone.hair2, sw: 1.5 });
          const ring = rect(fg, cx - 3, cy - 27, ctlW + 6, 54, { r: 10, fill: "none", stroke: C("accent"), sw: 2.5, opacity: 0 });
          const val = text(fg, row.value || "", { x: cx + 16, y: cy - 24, w: ctlW - 60, h: 48, size: cfg.ui_text, tag: "value" });
          icon(fg, "chevron-down", cx + ctlW - 24, cy, 22, "muted");
          reg({ id: `${rg.id}.${row.id}`, kind: "select", x: cx, y: cy - 24, w: ctlW, h: 48, g: fg, r: 8, ring, box, value: val, pad: 16, right: 44, region: rg.id, label: row.label });
        } else if (row.kind === "button") {
          button(sg, Object.assign({}, row.button || { label: row.value }, { id: `${rg.id}.${row.id}` }), cx, cy - cfg.control_h / 2, ctlW);
          A.parts[`${rg.id}.${row.id}`].region = rg.id;
        } else {
          icon(sg, "chevron-right", cx + 20, cy, 24, "muted");
          reg({ id: `${rg.id}.${row.id}`, kind: "row", x: x + 1, y: ry, w: w - 2, h: rh, g: sg, r: 0, region: rg.id, on: [], off: [] });
        }
      });
      RG.body.content = (rg.rows || []).length * rh;
      if (RG.body.content > RG.body.h + 1) scrollbar(RG);
    };
    REGION.detail = (g, rg, x, y, w, h, RG) => {
      card(g, x, y, w, h);
      let yy = y + regionTitle(g, rg, x, y, w) + 6;
      (rg.rows || []).forEach(([k, v, kind], i) => {
        const dg = svg("g", {}, g);
        text(dg, k, { x: x + 24, y: yy, w: w * 0.38 - 24, h: 52, size: cfg.ui_small, color: "muted", tag: "dt" });
        if (kind && TONES[kind]) {
          const tn = toneTok(kind), pw = Math.min(w * 0.62 - 24, textW(v, "caption", 20, 600) + 30);
          rect(dg, x + w * 0.38, yy + 9, pw, 34, { r: 17, fill: S().mix(C(tn), C("surface"), 0.86) });
          text(dg, v, { x: x + w * 0.38, y: yy + 9, w: pw, h: 34, size: 20, weight: 600, align: "center", color: tn, tag: "status" });
        } else text(dg, v, { x: x + w * 0.38, y: yy, w: w * 0.62 - 24, h: 52, size: cfg.ui_text, weight: 600, tag: "dd" });
        reg({ id: `${rg.id}.${i}`, kind: "text", x: x + 16, y: yy, w: w - 32, h: 52, g: dg, r: 6, region: rg.id });
        yy += 58;
      });
      if (rg.actions) {
        let bx = x + 24;
        for (const b of rg.actions) { const bw = buttonW(b); button(g, Object.assign({}, b, { id: rg.id + ".action." + b.id }), bx, y + h - 24 - cfg.control_h, bw); bx += bw + 12; }
      }
    };
    REGION.list = (g, rg, x, y, w, h, RG) => {
      card(g, x, y, w, h);
      const t0 = regionTitle(g, rg, x, y, w);
      const B = body(RG, g, x, y + t0 + 2, w, h - t0 - 6);
      const rh = 76;
      (rg.items || []).forEach((it, i) => {
        const iy = y + t0 + 2 + i * rh, ig = svg("g", { class: "lm-sc-item" }, B);
        const sel = rect(ig, x + 1, iy, w - 2, rh, { r: 0, fill: tone.sel, opacity: 0 });
        if (i) svg("rect", { x: x + 24, y: iy, width: w - 48, height: 1, fill: tone.hair }, ig);
        let tx = x + 24;
        if (it.icon) { rect(ig, x + 22, iy + 16, 44, 44, { r: 10, fill: C("surface2") }); icon(ig, it.icon, x + 44, iy + 38, 24, toneTok(it.tone) === "accent3" ? "muted" : toneTok(it.tone)); tx = x + 82; }
        const mw = it.meta ? Math.min(w * 0.3, textW(it.meta, "caption", 20) + 12) : 0;
        text(ig, it.title, { x: tx, y: iy + (it.sub ? 8 : 0), w: x + w - 24 - mw - tx, h: it.sub ? 36 : rh, size: cfg.ui_text, weight: 600, tag: "item" });
        if (it.sub) text(ig, it.sub, { x: tx, y: iy + 40, w: x + w - 24 - mw - tx, h: 28, size: 20, color: "muted", tag: "item_sub" });
        if (it.meta) text(ig, it.meta, { x: x + w - 24 - mw, y: iy, w: mw, h: rh, size: 20, color: "muted", align: "right", tag: "item_meta" });
        const P = reg({ id: `${rg.id}.item.${it.id == null ? i : it.id}`, kind: "row", x: x + 1, y: iy, w: w - 2, h: rh, g: ig, r: 0, region: rg.id, on: [sel], off: [] });
        if (rg.select === i) setOn(P, true, null);
      });
      RG.body.content = (rg.items || []).length * rh;
      if (RG.body.content > RG.body.h + 1) scrollbar(RG);
    };
    REGION.empty = (g, rg, x, y, w, h) => {
      card(g, x, y, w, h);
      if (rg.icon) { svg("circle", { cx: x + w / 2, cy: y + h / 2 - 54, r: 40, fill: C("surface2") }, g); icon(g, rg.icon, x + w / 2, y + h / 2 - 54, 36, "muted"); }
      if (rg.title) text(g, rg.title, { x: x + 40, y: y + h / 2 - 6, w: w - 80, h: 40, role: "label", size: 24, weight: 700, align: "center", tag: "empty_title" });
      if (rg.text) text(g, rg.text, { x: x + 40, y: y + h / 2 + 36, w: w - 80, h: 30, size: cfg.ui_small, color: "muted", align: "center", tag: "empty_text" });
    };
    // ---- a code editor: line numbers and diff markers in a quiet gutter, the code in the pack's mono face with syntax colour,
    // indentation kept to the column, a current-line highlight; it scrolls like a table. Parts: <id>.line.<n> (the line's
    // words) and <id>.row.<n> (the whole row), n counted from `start` (1) as the gutter shows it
    REGION.code = (g, rg, x, y, w, h, RG) => {
      card(g, x, y, w, h);
      const t0 = regionTitle(g, rg, x, y, w);
      const size = rg.size || cfg.code_px, lh = Math.round(size * (rg.lh || cfg.code_lh)), cw = monoW(size), nsize = Math.max(20, Math.round(size * 0.85));
      const src = Array.isArray(rg.lines) ? rg.lines.map((s) => String(s == null ? "" : s)) : String(rg.text || "").replace(/\n$/, "").split("\n");
      const start = rg.start || 1;
      const numW = String(start + src.length - 1).length * monoW(nsize) + 30, markW = 24, gw = numW + markW;
      const top = y + t0;
      // the gutter strip (rounded where it meets the card's corners)
      const gg = svg("g", { class: "lm-sc-gutter" }, g);
      rect(gg, x + 1, top + (t0 ? 0 : 1), gw, h - t0 - 2 + (t0 ? 1 : 0), { r: 11, fill: C("surface2") });
      rect(gg, x + gw - 14, top + (t0 ? 0 : 1), 14, h - t0 - 2 + (t0 ? 1 : 0), { r: 0, fill: C("surface2") });
      if (t0) rect(gg, x + 1, top, gw, 14, { r: 0, fill: C("surface2") });
      svg("rect", { x: f1(x + gw), y: f1(top), width: 1.5, height: f1(h - t0), fill: tone.hair }, gg);
      const B = body(RG, g, x, top + 1, w, h - t0 - 2);
      const pad = Math.round(lh * 0.3);
      RG.code = { size, lh, cw, nsize, cx0: x + gw + 20, top: top + 1 + pad, pad, x, w, gw, numR: x + numW - 8, markX: x + numW + markW / 2 - 4, start, lang: rg.lang, lines: [], B, syn: SYN() };
      RG.textPx = size;
      const TL = tokenizeLines(src, rg.lang);
      src.forEach((s, i) => codeLine(RG, rg.id, i, s, TL[i]));
      RG.body.content = 2 * pad + src.length * lh;
      if (RG.body.content > RG.body.h + 1) scrollbar(RG);
      for (const n of [].concat(rg.highlight == null ? [] : rg.highlight)) { const L = RG.code.lines[n - start]; if (L) { L.hl.setAttribute("opacity", 1); L.numOn.setAttribute("opacity", 1); L.num.setAttribute("opacity", 0); L.hlOn = true; } }
      RG.diff0 = rg.diff || null;                         // marked once the handle has codeMark (after walk)
      const room = (w - gw - 40) / cw, wide = src.map((s, i) => [s, i]).filter(([s]) => s.replace(/\s+$/, "").length > room);
      if (wide.length) warn("sc_code_wide", `${wide.length} line(s) of "${rg.id}" are wider than the editor (${Math.floor(room)} columns at ${size} px; line ${wide[0][1] + start} has ${wide[0][0].length}) and are cut at its edge: shorten them or widen the region`);
    };
    function codeLine(RG, rid, i, s, tl) {
      const K0 = RG.code, n = K0.start + i, ry = K0.top + i * K0.lh, base = monoBase(ry, K0.lh, K0.size);
      const lg = svg("g", { class: "lm-sc-line", "data-line": n }, K0.B);
      const back = svg("g", {}, lg);                             // tints behind the words: diff marks, the highlight
      // the current-line wash is translucent, so a diff tint under it still shows (green or red, washed toward accent)
      const hl = rect(back, K0.x + K0.gw + 1.5, ry, K0.w - K0.gw - 3, K0.lh, { r: 0, fill: mix("surface", "accent", 0.16), opacity: 0 });
      hl.setAttribute("fill-opacity", 0.55);
      const ncw = monoW(K0.nsize), nb = monoBase(ry, K0.lh, K0.nsize), ns = String(n);
      const num = monoText(lg, K0.numR - ns.length * ncw, nb, [[ns, C("muted")]], K0.nsize, "line_no").t;
      const numOn = monoText(lg, K0.numR - ns.length * ncw, nb, [[ns, C("ink"), 700]], K0.nsize, "line_no").t;
      numOn.setAttribute("opacity", 0);
      const wrap = svg("g", {}, lg);
      monoText(wrap, K0.cx0, base, tl.toks.map(([t, k]) => [t, K0.syn[k] || K0.syn.plain]), K0.size, "code");
      const L = { n, i, y: ry, base, g: lg, back, hl, num, numOn, cur: wrap, text: s, mark: null, marks: {}, hlOn: false, st: tl.st };
      K0.lines[i] = L;
      reg({ id: `${rid}.row.${n}`, kind: "row", x: K0.x + K0.gw, y: ry, w: K0.w - K0.gw, h: K0.lh, g: lg, r: 0, region: rid, on: [hl, numOn], off: [num] });
      reg({ id: `${rid}.line.${n}`, kind: "text", x: K0.cx0 - 8, y: ry, w: Math.max(6, s.replace(/\s+$/, "").length) * K0.cw + 16, h: K0.lh, g: lg, r: 4, region: rid });
      monoReport(s, K0.size, { x: K0.cx0, y: ry, w: K0.w - K0.gw, h: K0.lh });
      return L;
    }
    // ---- a terminal: dark from the pack, the mono face, a prompt, commands typed in (A.run) and output streaming in
    // (A.out); status words in the product's tones; it scrolls as lines arrive. Parts: <id>.line.<n>, n from 1 in the order
    // the lines appear
    REGION.terminal = (g, rg, x, y, w, h, RG) => {
      const T = TERM();
      rect(g, x, y, w, h, { r: 12, fill: T.bg });
      const size = rg.size || cfg.term_px, lh = Math.round(size * (rg.lh || cfg.term_lh)), cw = monoW(size), pad = 22;
      const B = body(RG, g, x, y + 2, w, h - 4);
      RG.term = { size, lh, cw, x0: x + pad, top: y + 16, x, w, T, prompt: rg.prompt == null ? "$" : String(rg.prompt), lines: [], B, cols: Math.floor((w - 2 * pad) / cw) };
      RG.textPx = size;
      for (const ln of rg.lines || []) termLine(RG, rg.id, ln, null);
      RG.body.content = termNeed(RG, RG.term.lines.length);
      if (RG.body.content > RG.body.h) {                // a long history opens scrolled to its end, as a terminal does
        const off = RG.body.content - RG.body.h;
        RG.scroll.push({ t0: -1, t1: -1, from: off, to: off });
        B.setAttribute("transform", `translate(0 ${f1(-off)})`);
      }
    };
    const termNeed = (RG, n) => (RG.term.top - RG.body.y) + n * RG.term.lh + 14;
    function promptSegs(K0, pr) {
      const m = /^(.*?)(\s*)([$#>%])$/.exec(pr);
      return m ? [[m[1] + m[2], K0.T.path], [m[3], K0.T.prompt, 700], [" ", K0.T.text]] : [[pr + " ", K0.T.prompt, 700]];
    }
    function termSegs(K0, s, tn) {
      if (tn) return [[s, tn === "plain" ? K0.T.text : tn === "muted" || tn === "dim" ? K0.T.dim : K0.T[tn] || K0.T.text]];
      return s.split(/(\s+)/).filter((p) => p !== "").map((p) => { const w = /\s/.test(p) ? null : wordTone(p); return [p, w ? K0.T[w] : K0.T.text, w ? 700 : undefined]; });
    }
    // one terminal line drawn (at t, or at build when t is null): an output string, {out, tone} or {cmd, prompt}
    function termLine(RG, rid, ln, t) {
      const K0 = RG.term, i = K0.lines.length, n = i + 1, ry = K0.top + i * K0.lh, base = monoBase(ry, K0.lh, K0.size);
      const o = typeof ln === "string" ? { out: ln } : ln || {};
      const lg = svg("g", { class: "lm-sc-tline", "data-line": n, opacity: t == null ? 1 : 0 }, K0.B);
      const hl = rect(lg, K0.x + 6, ry, K0.w - 12, K0.lh, { r: 6, fill: K0.T.sel, opacity: 0 });
      let segs, str;
      if (o.cmd != null) { const ps = promptSegs(K0, o.prompt == null ? K0.prompt : o.prompt); segs = ps.concat([[String(o.cmd), K0.T.text]]); str = ps.map((p) => p[0]).join("") + o.cmd; }
      else { str = String(o.out == null ? "" : o.out); segs = termSegs(K0, str, o.tone); }
      const mt = monoText(lg, K0.x0, base, segs, K0.size, o.cmd != null ? "term_cmd" : "term_out");
      if (str.length > K0.cols) warn("sc_term_wide", `terminal line ${n} of "${rid}" has ${str.length} characters; ${K0.cols} fit at ${K0.size} px, the rest is cut: shorten it or widen the window`);
      const L = { n, i, y: ry, base, g: lg, hl, mt, text: str, hlOn: false, t };
      K0.lines.push(L);
      const p = reg({ id: `${rid}.line.${n}`, kind: "text", x: K0.x0 - 8, y: ry, w: Math.max(6, str.length) * K0.cw + 16, h: K0.lh, g: lg, r: 4, region: rid });
      if (t != null) { p.hiddenUntil = t; Loom.tween(lg, { opacity: 0 }, { opacity: 1, duration: 0.06 }, t, meta("reveal", `${rid}.line.${n}`)); }
      monoReport(str, K0.size, { x: K0.x0, y: ry, w: K0.w, h: K0.lh });
      return L;
    }
    // ---- a chart: a line or bar series (one or more) on a quiet grid, values that change on cue (A.series). Parts:
    // <id>.plot (the plot area) and <id>.col.<i> (the column of the i-th label)
    const niceMax = (v) => { if (!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v - 1e-9) return m * p; return 10 * p; };
    REGION.chart = (g, rg, x, y, w, h, RG) => {
      card(g, x, y, w, h);
      const t0 = regionTitle(g, rg, x, y, w);
      const series = (rg.series || []).map((s) => (Array.isArray(s) ? { values: s } : s));
      const labels = rg.labels || [];
      const n = Math.max(1, labels.length, ...series.map((s) => (s.values || []).length));
      const vals = series.flatMap((s) => s.values || []).filter((v) => v != null);
      const min = rg.min || 0, max = rg.max != null ? rg.max : niceMax(Math.max(0, ...vals, rg.limit ? rg.limit.value : 0) * 1.15);
      // gridlines on a round step (1, 2, 2.5 or 5 times a power of ten), 3 to 5 intervals
      const span = (max - min) || 1, p10 = Math.pow(10, Math.floor(Math.log10(span / 5)));
      const step = [1, 2, 2.5, 5, 10, 20, 25, 50].map((m) => m * p10).find((st) => span / st <= 5 + 1e-9) || span / 4;
      const ticks = []; for (let v = min; v <= max + step * 1e-6; v += step) ticks.push(+v.toFixed(10));
      const sdec = (String(+step.toFixed(10)).split(".")[1] || "").length;
      const dec = rg.decimals != null ? Math.max(rg.decimals, sdec) : sdec;
      const fmt = (v) => `${(+v).toFixed(dec)}${rg.unit || ""}`;
      const ylw = Math.max(...ticks.map((v) => textW(fmt(v), "caption", 20))) + 14;
      const px = x + 24 + ylw, py = y + (t0 || 20) + 14, pw = x + w - 32 - px, ph = y + h - 20 - 34 - py;
      const gg = svg("g", { class: "lm-sc-grid" }, g);
      const Y = (v) => py + ph - (clamp(v, min, max) - min) / ((max - min) || 1) * ph, X = (i) => px + (i + 0.5) * pw / n;
      ticks.forEach((v) => {
        svg("rect", { x: f1(px), y: f1(Y(v) - 0.5), width: f1(pw), height: 1, fill: v === min ? tone.hair2 : tone.hair }, gg);
        text(gg, fmt(v), { x: x + 16, y: Y(v) - 15, w: ylw, h: 30, size: 20, color: "muted", align: "right", tag: "chart_y" });
      });
      const lw = Math.max(1, ...labels.map((l) => textW(String(l), "caption", 20))) + 16, every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(pw / lw))));
      labels.forEach((l, i) => { if (i % every === 0) text(gg, l, { x: X(i) - pw / n / 2 - 40, y: py + ph + 6, w: pw / n + 80, h: 30, size: 20, color: "muted", align: "center", tag: "chart_x" }); });
      // series in the product's tones (never accent2); a legend in the title row when there are two or more
      const TN = ["accent", "accent3", "pos", "accent4"];
      const S0 = series.map((s, si) => ({ tone: C(toneTok(s.tone || TN[si % TN.length])), name: s.name, cur: Array.from({ length: n }, (_, i) => (s.values || [])[i] == null ? null : +(s.values || [])[i]) }));
      if (S0.length > 1 || rg.legend) {
        let lx = x + w - 24;
        S0.slice().reverse().forEach((s) => {
          if (!s.name) return;
          const tw = textW(s.name, "caption", 20) + 4; lx -= tw;
          text(g, s.name, { x: lx, y: y + 14, w: tw, h: 40, size: 20, color: "muted", tag: "legend" });
          lx -= 26; rect(g, lx, y + 27, 16, 16, { r: 4, fill: s.tone }); lx -= 22;
        });
      }
      if (rg.limit) {
        const ly = Y(rg.limit.value), lt = toneTok(rg.limit.tone || "neg");
        svg("line", { x1: f1(px), y1: f1(ly), x2: f1(px + pw), y2: f1(ly), stroke: C(lt), "stroke-width": 2.5, "stroke-dasharray": "10 8" }, gg);
        if (rg.limit.label) { const tw = textW(rg.limit.label, "caption", 20, 600) + 8; text(gg, rg.limit.label, { x: px + pw - tw, y: ly - 32, w: tw, h: 30, size: 20, weight: 600, color: lt, align: "right", tag: "chart_limit" }); }
        RG.limitY = ly;
      }
      const type = rg.type || "line", sg = svg("g", { class: "lm-sc-series" }, g), base = Y(min);
      S0.forEach((s, si) => {
        const g1 = svg("g", {}, sg);
        if (type === "bar") {
          const slot = pw / n, bw = slot * 0.62 / S0.length;
          s.nodes = s.cur.map((_, i) => rect(g1, X(i) - slot * 0.31 + si * bw, base, bw - 4, 0.01, { r: 4, fill: s.tone }));
        } else {
          s.area = S0.length === 1 ? svg("path", { d: "", fill: S().mix(s.tone, C("surface"), 0.86) }, g1) : null;
          s.line = svg("path", { d: "", fill: "none", stroke: s.tone, "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" }, g1);
          s.nodes = s.cur.map(() => svg("circle", { r: 6, fill: s.tone, stroke: C("surface"), "stroke-width": 2.5, cx: 0, cy: 0, opacity: 0 }, g1));
        }
      });
      // the series drawn from values (null: no point yet) and a visibility per point: a pure function of its arguments
      const draw = (si, v, vis) => {
        const s = S0[si];
        if (type === "bar") { s.nodes.forEach((nd, i) => { const yy = v[i] == null ? base : Y(v[i]); nd.setAttribute("y", f1(yy)); nd.setAttribute("height", f1(Math.max(0.01, base - yy))); nd.setAttribute("opacity", f3(vis[i])); }); return; }
        let d = "", first = -1, last = -1;
        v.forEach((q, i) => { if (q == null || vis[i] <= 0) return; d += (d && last === i - 1 ? " L" : (d ? " M" : "M")) + `${f1(X(i))} ${f1(Y(q))}`; if (first < 0) first = i; last = i; });
        s.line.setAttribute("d", d);
        if (s.area) s.area.setAttribute("d", first >= 0 && last > first ? `M${f1(X(first))} ${f1(base)} L` + d.replace(/^M/, "").replace(/ M/g, " L") + ` L${f1(X(last))} ${f1(base)} Z` : "");
        s.nodes.forEach((nd, i) => { const on = v[i] != null ? vis[i] : 0; nd.setAttribute("opacity", f3(on)); if (v[i] != null) { nd.setAttribute("cx", f1(X(i))); nd.setAttribute("cy", f1(Y(v[i]))); } });
      };
      RG.chart = { type, n, min, max, series: S0, draw, X, Y };
      S0.forEach((s, si) => draw(si, s.cur, s.cur.map((q) => (q == null ? 0 : 1))));
      reg({ id: `${rg.id}.plot`, kind: "text", x: px, y: py, w: pw, h: ph, g, r: 4, region: rg.id });
      if (RG.limitY != null) reg({ id: `${rg.id}.limit`, kind: "text", x: px, y: RG.limitY - 4, w: pw * 0.7, h: 8, g, r: 2, region: rg.id });
      for (let i = 0; i < n; i++) reg({ id: `${rg.id}.col.${i}`, kind: "text", x: X(i) - pw / n / 2, y: py, w: pw / n, h: ph, g, r: 4, region: rg.id });
    };
    // ---- a captured web page (tools/page_capture.py): the real page drawn live inside the window (an HTML subtree in a
    // foreignObject, its CSS in a shadow root so it cannot touch the lesson), scaled to the region's width, scrolled like
    // any region; the cursor, camera and callouts go on top. Its elements are parts by selector: "<region>@<selector>"
    REGION.page = (g, rg, x, y, w, h, RG) => {
      const snap = Loom.webpages[rg.page];
      if (!snap) throw new Error(`screencast app "${name}": no captured page "${rg.page}" (have: ${Object.keys(Loom.webpages).join(", ") || "none"}): capture it with tools/page_capture.py and load its .page.js before the scene`);
      const k = rg.scale || w / snap.w;
      svg("rect", { x: f1(x), y: f1(y), width: f1(w), height: f1(h), fill: snap.htmlBg && !/rgba\(0, 0, 0, 0\)/.test(snap.htmlBg) ? snap.htmlBg : snap.bg || C("surface") }, g);
      const B = body(RG, g, x, y, w, h);
      const pg = svg("g", { class: "lm-sc-webpage", transform: `translate(${f1(x)} ${f1(y)}) scale(${f3(k)})` }, B);
      const fo = svg("foreignObject", { x: 0, y: 0, width: snap.w, height: snap.h }, pg);
      let root = null;
      try {
        const host = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
        if (host && host.attachShadow) {
          host.setAttribute("style", `width:${snap.w}px;height:${snap.h}px;overflow:hidden`);
          fo.appendChild(host);
          root = host.attachShadow({ mode: "open" });
          const at = (o) => Object.entries(o || {}).filter(([k0]) => k0 !== "class").map(([k0, v]) => ` ${k0}="${String(v).replace(/"/g, "&quot;")}"`).join("");
          // the browser's own defaults for html and body (they are divs here), animations and transitions off (they run on
          // the wall clock), the page's CSS after them so it wins
          const base = `:host{all:initial;display:block}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}` +
            `.lm-html{display:block;width:${snap.w}px;min-height:${snap.h}px}.lm-body{display:block;margin:8px}`;
          root.innerHTML = `<style>${base}\n${snap.css}</style><div class="lm-html ${(snap.htmlAttrs || {}).class || ""}"${at(snap.htmlAttrs)}><div class="lm-body ${(snap.bodyAttrs || {}).class || ""}" data-lm-i="0"${at(snap.bodyAttrs)}>${snap.html}</div></div>`;
        }
      } catch (e) { root = null; }
      if (!root) rect(pg, 0, 0, snap.w, snap.h, { r: 0, fill: C("surface2") });   // no live DOM here (the Node preview)
      const over = svg("g", { class: "lm-sc-webover" }, B);
      RG.web = { snap, k, x, y, root, over, nodes: new Map() };
      RG.textPx = 16 * k;
      RG.body.content = snap.h * k;
      if (RG.body.content > RG.body.h + 1) scrollbar(RG);
    };
    A.cellDraw = cell; A.fieldH = fieldH; A.termLine = termLine; A.termNeed = termNeed;

    // ---- pages (one or many). A page: {title, sub, toolbar, tabs, content}. spec.page (one) or spec.pages + spec.start
    const pages = spec.pages || { main: spec.page ? Object.assign({ content: spec.content }, spec.page) : { content: spec.content } };
    const start = spec.start || Object.keys(pages)[0];
    for (const [pid, pg] of Object.entries(pages)) {
      const g = svg("g", { class: "lm-sc-page", "data-page": pid }, content);
      A.building = pid;
      buildPage(pid, pg, g);
      A.building = null;
      A.pages[pid] = { g, spec: pg };
      if (pid !== start) g.setAttribute("opacity", 0);
    }
    A.page = start;
    A.pageAt = [{ t: -1, page: start }];

    // ---- on / off states of a selectable part (nav, tab, row): instant at build (t null) or eased on the timeline
    function setOn(P, on, t, dur) {
      P.state = on;
      const sh = on ? P.on || [] : P.off || [], hd = on ? P.off || [] : P.on || [];
      if (t == null) { for (const n of sh) n && n.setAttribute("opacity", 1); for (const n of hd) n && n.setAttribute("opacity", 0); P.sel0 = on; return; }
      const d = dur == null ? 0.18 : dur;
      for (const n of sh) if (n) Loom.tween(n, { opacity: 0 }, { opacity: 1, duration: d, ease: Loom.ease.enter }, t, meta("state", P.id));
      for (const n of hd) if (n) Loom.tween(n, { opacity: 1 }, { opacity: 0, duration: d, ease: Loom.ease.enter }, t, meta("state", P.id));
    }
    A.setOn = setOn;

    // ---- the shell appears (a reveal the checks can see); `build: "regions"` lets regions settle in, top to bottom
    const at = opts.at == null ? (ctx.speechStart || 0) : opts.at;
    Loom.tween(E.inner, { opacity: 0 }, { opacity: 1, duration: opts.at === 0 ? 0.01 : 0.4, ease: Loom.ease.enter }, at, meta("reveal", "shell"));
    if (E.revealT == null || at < E.revealT) E.revealT = at;
    if (opts.build === "regions") {
      Object.values(A.regions).filter((r) => r.page === start).sort((a, b) => a.y - b.y || a.x - b.x).forEach((r, i) =>
        Loom.tween(r.g, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: Loom.ease.enter }, at + 0.25 + i * 0.08, meta("reveal", r.id)));
    }
    A.t0 = at;

    performer(A);
    walk(A);
    teach(A);
    for (const RG of Object.values(A.regions)) if (RG.diff0) for (const [n, m] of Object.entries(RG.diff0)) A.codeMark(RG.id, +n, m, null);
    return A;
  }

  // ================================================================ the performer: one clock poses camera, pointer, pins
  function performer(A) {
    const cfg = A.cfg, P = { segs: [], vis: [], shapes: [], dips: [], free: -1, pos: null };
    const CAM = { moves: [], free: -1 };
    A.pointerSched = P; A.camSched = CAM; A.pins = []; A.actions = []; A.reactions = [];
    const win = A.win;
    // the pointer: an arrow (and an I-beam over text fields), large enough to find at video size, with a soft offset shadow
    const ptr = A.layers.ptr;
    const arrow = svg("g", {}, ptr), beam = svg("g", { opacity: 0 }, ptr);
    const AR = "M0 0 L0 36 L9 28 L15.5 43 L22 40.2 L15.6 25.6 L27.5 25.6 Z";
    svg("path", { d: AR, transform: "translate(2.5 3)", fill: C("shadow"), opacity: 0.22 }, arrow);
    svg("path", { d: AR, fill: C("ink"), stroke: C("surface"), "stroke-width": 2.6, "stroke-linejoin": "round" }, arrow);
    const BM = "M-7 -16 L-2 -16 L0 -13.5 L2 -16 L7 -16 M0 -13.5 L0 13.5 M-7 16 L-2 16 L0 13.5 L2 16 L7 16";
    svg("path", { d: BM, fill: "none", stroke: C("surface"), "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" }, beam);
    svg("path", { d: BM, fill: "none", stroke: C("ink"), "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, beam);
    A.ptrNodes = { arrow, beam };
    P.pos = { x: win.x + win.w * 0.72, y: win.y + win.h * 0.62 };
    P.start = Object.assign({}, P.pos);

    // ---- the camera: a view {s, fx, fy}: frame point (fx, fy) at the view centre, scaled s, clamped so the window never
    // shows its edge once it is larger than the frame (and is never smaller than the frame's whole picture at s = 1)
    const home = { s: 1, fx: VIEW.cx, fy: VIEW.cy };
    function transformOf(v) {
      const s = v.s;
      let tx = VIEW.cx - s * v.fx, ty = VIEW.cy - s * v.fy;
      if (s > 1.0001) {
        const ax = -s * win.x, bx = VIEW.w - s * (win.x + win.w), ay = -s * win.y, by = VIEW.hb - s * (win.y + win.h);
        // as s grows from 1, the window first stays wholly in the frame, then covers it
        const homeT = { x: 0, y: 0 };
        const k0 = clamp((s - 1) / 0.12, 0, 1), k = k0 * k0 * (3 - 2 * k0);   // smoothstep: no kink at 1.12x
        tx = clamp(tx, Math.min(ax, bx), Math.max(ax, bx)); ty = clamp(ty, Math.min(ay, by), Math.max(ay, by));
        tx = lerp(homeT.x + (1 - s) * VIEW.cx, tx, k); ty = lerp(homeT.y + (1 - s) * VIEW.cy, ty, k);
      } else { tx = 0; ty = 0; }
      return { s, tx, ty };
    }
    // the camera's TARGET: each move eases (minimum jerk) over the first 70 % of its time, scale in log space
    function targetAt(t) {
      const M = CAM.moves;
      let v = home;
      for (const m of M) {
        if (t < m.t0) break;
        if (t >= m.t1) { v = m.to; continue; }
        const u = minjerk((t - m.t0) / ((m.t1 - m.t0) * 0.7));
        const ls = Math.log(m.from.s), le = Math.log(m.to.s);
        v = { s: Math.exp(lerp(ls, le, u)), fx: lerp(m.from.fx, m.to.fx, u), fy: lerp(m.from.fy, m.to.fy, u) };
        break;
      }
      return v;
    }
    A.targetAt = targetAt;
    // the camera itself follows the target's on-screen transform (after the clamp that keeps the window's edge out of the
    // frame, so a framing that slides along that edge cannot kink) with a critically damped spring: no overshoot, no
    // snap, its velocity continuous whatever the target does, settled to under 1 % of a move by the move's end. Stepped
    // exactly at 240 Hz from t = 0 into a table once per schedule (a pure function of the moves), read by interpolation
    const SPRING_W = 13 / Math.max(0.3, cfg.zoom_in_s), SDT = 1 / 240;
    function camTable() {
      if (CAM.table) return CAM.table;
      const M = CAM.moves, tEnd = (M.length ? Math.max(...M.map((m) => m.t1)) : 0) + 2;
      const n = Math.ceil(tEnd / SDT) + 2, xs = new Float64Array(n * 3), e = Math.exp(-SPRING_W * SDT);
      const x = [0, 0, 0], v = [0, 0, 0];
      for (let i = 0; i < n; i++) {
        const g = transformOf(targetAt(i * SDT)), gv = [Math.log(g.s), g.tx, g.ty];
        for (let k = 0; k < 3; k++) {
          xs[i * 3 + k] = x[k];
          const y0 = x[k] - gv[k], c = v[k] + SPRING_W * y0;
          x[k] = gv[k] + (y0 + c * SDT) * e; v[k] = (v[k] - SPRING_W * c * SDT) * e;
        }
      }
      CAM.table = { n, xs, end: transformOf(targetAt(tEnd + 1)) };
      return CAM.table;
    }
    function camAt(t) {
      if (!(t > 0)) return transformOf(targetAt(t));
      const T = camTable(), f = t / SDT, i = Math.floor(f);
      if (i >= T.n - 1) return T.end;
      const k = f - i, a = T.xs, j = i * 3, ls = lerp(a[j], a[j + 3], k);
      const sc = Math.abs(ls) < 1e-5 ? 1 : Math.exp(ls);
      return sc === 1 && Math.abs(a[j + 1]) < 0.05 && Math.abs(a[j + 2]) < 0.05 ? { s: 1, tx: 0, ty: 0 } : { s: sc, tx: lerp(a[j + 1], a[j + 4], k), ty: lerp(a[j + 2], a[j + 5], k) };
    }
    // the view a move aims at (the target), and the transform the camera really has (the spring); everything drawn reads
    // A.transformAt, so a test can plant a jump there and see the smoothness measure catch it
    A.viewAt = targetAt;
    A.transformAt = camAt;
    A.project = (x, y, t) => { const T = A.transformAt(t); return { x: T.tx + T.s * x, y: T.ty + T.s * y, s: T.s }; };
    A.projectRect = (r, t) => { const a = A.project(r.x, r.y, t); return { x: a.x, y: a.y, w: r.w * a.s, h: r.h * a.s, s: a.s }; };

    // ---- the pointer's pose at t
    const visRamp = (a, t) => { const k = clamp((t - a.v.t0) / 0.2, 0, 1); return a.v.on ? a.s0 + (1 - a.s0) * k : a.s0 * (1 - k); };
    function pointerAt(t) {
      let p = P.start, shape = "arrow";
      for (const s of P.segs) {
        if (t < s.t0) break;
        if (t >= s.t1) { p = s.b; continue; }
        const r = (t - s.t0) / (s.t1 - s.t0), u = minjerk(r), w = 1 - u;
        p = { x: w * w * s.a.x + 2 * w * u * s.c.x + u * u * s.b.x, y: w * w * s.a.y + 2 * w * u * s.c.y + u * u * s.b.y };
        // the settle: a hand arrives a few px past the target and comes back (a bump with zero slope at both ends, so the
        // velocity stays continuous)
        const q = (r - 0.7) / 0.3;
        if (q > 0 && s.amp) { const b = 16 * q * q * (1 - q) * (1 - q) * s.amp; p.x += s.ux * b; p.y += s.uy * b; }
        break;
      }
      for (const sh of P.shapes) { if (t < sh.t) break; shape = sh.shape; }
      // each show or hide ramps from the level the pointer HAS when it starts: a hide used to ramp from 1, so
      // pointerOut on a pointer already gone (every beat of st-sc-2fa opened with A.pointerOut(ctx.start)) flashed it at
      // its last place, the nav, on the join frame (D-190)
      let a = null;
      for (const v of P.vis) {
        if (t < v.t0) break;
        a = { v, s0: a ? visRamp(a, v.t0) : 0 };
      }
      const vis = a ? visRamp(a, t) : 0;
      let dip = 1;
      for (const d of P.dips) if (t >= d.t && t < d.t + 0.22) { const u = (t - d.t) / 0.22; dip = 1 - 0.14 * Math.sin(Math.PI * u); }
      return { p, shape, vis, dip };
    }
    A.pointerAt = pointerAt;

    function pose(t) {
      const T = A.transformAt(t);
      A.layers.cam.setAttribute("transform", `translate(${f1(T.tx)} ${f1(T.ty)}) scale(${f3(T.s)})`);
      const q = pointerAt(t), k = q.dip / Math.sqrt(T.s);   // the pointer grows with the zoom, but less (a big arrow hides words)
      ptr.setAttribute("opacity", f3(q.vis));
      ptr.setAttribute("transform", `translate(${f1(q.p.x)} ${f1(q.p.y)}) scale(${f3(k)})`);
      arrow.setAttribute("opacity", q.shape === "beam" ? 0 : 1);
      beam.setAttribute("opacity", q.shape === "beam" ? 1 : 0);
      for (const pin of A.pins) pin(t, T);
    }
    A.pose = pose;
    if (Loom.clock) Loom.clock(pose);
    else {
      const proxy = { v: 0 };
      Loom.tween(proxy, { v: 0 }, { v: 1, duration: 3600, ease: "none", onUpdate() { pose(proxy.v * 3600); } }, 0, { kind: "performer", name: A.id + "_clock", content: false });
    }
    pose(0);

    // ---- scheduling
    const report = (t0, t1, kind, nm, content) => { if (Loom.report && Loom.report.tweens) Loom.report.tweens.push({ t0: +t0.toFixed(3), t1: +t1.toFixed(3), kind, beat: A.meta(kind).beat, name: `${A.id}.${nm}`, content: !!content }); };
    A.reportMotion = report;
    // the view that frames a rect: the scale that fits it (with a margin) between zoom_min and zoom_max
    A.viewFor = function (r, o) {
      o = o || {};
      const m = o.margin == null ? 56 : o.margin;
      let s = o.scale || Math.min((VIEW.w - 160) / (r.w + 2 * m), (VIEW.h - 300) / (r.h + 2 * m));
      s = clamp(s, cfg.zoom_min, o.max || cfg.zoom_max);
      let fy = r.y + r.h / 2;
      // the frame's top edge never slices a card (Chrome strip of sc_lesson, 2026-10-16: the KPI cards showed as half-cut
      // strips under the chapter pills while the camera framed the table below them). Judged on the view the camera will
      // really show (transformOf clamps it so the window never shows its edge): move the view so the card leaves, or so it
      // is whole; if neither fits at this scale, zoom out a step (never below zoom_min) and try again.
      if (o.snap !== false && s > 1.0001) {
        const fx = r.x + r.w / 2;
        const solve = (sc, f0) => {
          const eff = (f) => (VIEW.cy - transformOf({ s: sc, fx, fy: f }).ty) / sc;
          const topY = (f) => eff(f) - (VIEW.cy - 80) / sc, botY = (f) => eff(f) + (VIEW.hb - 8 - VIEW.cy) / sc;
          const yT = topY(f0);
          for (const p of Object.values(A.parts)) {
            if (!p || p.kind !== "card" || p.w == null || p.h == null || p.y == null) continue;
            if (!(p.y < yT - 1 && p.y + p.h > yT + 1)) continue;            // not sliced by the top edge
            if (p.x + p.w < r.x - m || p.x > r.x + r.w + m) continue;       // not in the framed columns
            const down = p.y + p.h + 10 - yT, up = yT - (p.y - 10);
            if (topY(f0 + down) >= p.y + p.h + 9 && r.y - m * 0.5 >= topY(f0 + down)) return f0 + down;
            if (topY(f0 - up) <= p.y - 9 && r.y + r.h <= botY(f0 - up)) return f0 - up;
            return null;                                                     // sliced, and no move fixes it here
          }
          return f0;                                                         // nothing sliced
        };
        let sc = s, got = solve(sc, fy);
        while (got == null && sc - 0.05 >= cfg.zoom_min) { sc -= 0.05; got = solve(sc, fy); }
        if (got != null) { if (sc < s - 1e-6) A.warn("sc_zoom_eased", `the view on a rect was eased from ${s.toFixed(2)}x to ${sc.toFixed(2)}x so its top edge does not slice a card`); s = sc; fy = got; }
      }
      return { s, fx: r.x + r.w / 2, fy };
    };
    // one camera move from wherever the view is at t0; never two in flight; never across a press or a typed line
    A.camTo = function (v, t0, dur, nm) {
      if (t0 < CAM.free - 1e-6) { A.warn("sc_camera_busy", `a camera move asked at ${t0.toFixed(2)} s waits for the one in flight (until ${CAM.free.toFixed(2)} s)`); t0 = CAM.free; }
      const from = targetAt(t0);
      // a zoom a person can follow: at least 0.3 s, plus 0.18 s per doubling of scale and the pan at 4000 px/s on screen (at
      // most 0.2 s of it), so the pack's own 0.8 s zooms and 0.7 s pull-backs pass. st-sc-2fa b17 framed a dialog at 2x in 0.35 s (a scene's
      // ctx.style.dur("move")), which read as a snap (D-190)
      const ratio = Math.abs(Math.log2((v.s || 1) / (from.s || 1)));
      const pan = Math.hypot(((v.fx || 0) - (from.fx || 0)) * Math.max(v.s || 1, from.s || 1), ((v.fy || 0) - (from.fy || 0)) * Math.max(v.s || 1, from.s || 1));
      const minDur = 0.3 + 0.18 * ratio + Math.min(0.2, pan / 4000);
      if (ratio > 0.05 && dur < minDur - 1e-6) {
        A.warn("sc_zoom_fast", `a ${nm || "camera"} move to ${(v.s || 1).toFixed(2)}x in ${dur.toFixed(2)} s is faster than the eye follows: stretched to ${minDur.toFixed(2)} s`);
        dur = minDur;
      }
      const t1 = t0 + dur;
      for (const a of A.actions) if (a.t1 > t0 + 0.02 && a.t0 < t1 - 0.02) A.warn("sc_camera_during_action", `the camera moves (${t0.toFixed(2)} to ${t1.toFixed(2)} s) while "${a.what}" happens (${a.t0.toFixed(2)} to ${a.t1.toFixed(2)} s): act on a still frame`);
      CAM.moves.push({ t0, t1, from, to: v });
      CAM.moves.sort((a, b) => a.t0 - b.t0);
      CAM.table = null;
      CAM.free = t1;
      report(t0, t1, "camera", nm || "camera", false);
      return t1;
    };
    A.isHome = (t) => A.transformAt(t).s < 1.0001;

    // the pointer travels to (x, y) from where it is at t0: minimum-jerk speed on a slight arc, never faster than a person
    A.travel = function (to, t0, o) {
      o = o || {};
      if (t0 < P.free - 1e-6) t0 = P.free;
      const from = Object.assign({}, P.pos), d = Math.hypot(to.x - from.x, to.y - from.y);
      if (d < 1.5) { P.pos = to; return t0; }
      const s = A.transformAt(t0).s, ds = d * s;              // speed is judged on screen
      const natural = clamp(0.42 + ds / cfg.pointer_px_s, 0.5, 1.3);
      let dur = o.dur || natural;
      const minDur = ds / cfg.pointer_px_s;
      if (dur < minDur) { A.warn("sc_pointer_fast", `a pointer move of ${Math.round(ds)} px in ${dur.toFixed(2)} s is faster than a person (${cfg.pointer_px_s} px/s): stretched to ${minDur.toFixed(2)} s`); dur = minDur; }
      const rng = Loom.rng ? Loom.rng(`${A.id}:${P.segs.length}`) : () => 0.5;
      const bend = (rng() < 0.5 ? -1 : 1) * Math.min(60, d * 0.12);
      const nx = -(to.y - from.y) / (d || 1), ny = (to.x - from.x) / (d || 1);
      const c = { x: (from.x + to.x) / 2 + nx * bend, y: (from.y + to.y) / 2 + ny * bend };
      P.segs.push({ t0, t1: t0 + dur, a: from, b: Object.assign({}, to), c, amp: Math.min(4, d * 0.012), ux: (to.x - from.x) / d, uy: (to.y - from.y) / d });
      P.segs.sort((a, b) => a.t0 - b.t0);
      P.pos = Object.assign({}, to);
      P.free = t0 + dur;
      report(t0, t0 + dur, "cursor", "pointer", true);
      return t0 + dur;
    };
  }

  // ================================================================ the walkthrough: the learner's actions
  function walk(A) {
    const cfg = A.cfg, P = A.pointerSched;
    const part = (id) => {
      if (id && typeof id === "object" && id.x != null && id.w != null) return id;
      let p = A.parts[id];
      if (!p && typeof id === "string" && id.includes("@")) p = A.webPart(id);
      if (!p) {
        const near = Object.keys(A.parts).filter((k) => k.split(".")[0] === String(id).split(".")[0]).slice(0, 12);
        throw new Error(`screencast app "${A.id}": no part "${id}"` + (near.length ? ` (near: ${near.join(", ")})` : ` (parts: ${Object.keys(A.parts).slice(0, 20).join(", ")} ...)`));
      }
      return p;
    };
    A.part = part;
    // an element of a captured page as a part: "<region>@<selector>" (see webSelect); its box from the capture, scaled
    A.webPart = function (id) {
      const at = id.indexOf("@"), rid = id.slice(0, at), sel = id.slice(at + 1), RG = A.regions[rid];
      if (!RG || !RG.web) throw new Error(`screencast app "${A.id}": "${rid}" is not a captured page region (in "${id}")`);
      const els = webSelect(RG.web.snap, sel);
      if (!els.length) {
        const ids = RG.web.snap.els.filter((e) => e.id).map((e) => "#" + e.id).slice(0, 16);
        throw new Error(`screencast app "${A.id}": nothing in page "${RG.web.snap.name || RG.spec.page}" matches "${sel}" (ids there: ${ids.join(", ")})`);
      }
      const e = els[0], K = RG.web.k, [bx, by, bw, bh] = e.b, ty = ((e.a || {}).type || "").toLowerCase();
      const kind = e.tag === "textarea" || (e.tag === "input" && !/^(checkbox|radio|submit|button|reset|range|color|file)$/.test(ty)) ? "field"
        : e.tag === "select" ? "select" : e.tag === "input" && /^(checkbox|radio)$/.test(ty) ? "checkbox"
          : /^(button|a|summary|label)$/.test(e.tag) || (e.a || {}).role === "button" || ty === "submit" ? "button" : "text";
      return A.reg({ id, kind, x: RG.web.x + bx * K, y: RG.web.y + by * K, w: bw * K, h: bh * K, g: RG.web.over, r: 8 * K, region: rid, nofx: true,
        web: { rid, el: e }, textPx: e.fs * K, pad: (e.pl || 12) * K, label: e.tx });
    };
    // the page's own states, kept as windows and drawn once the whole schedule is known (A.flushWeb, from the audit)
    const webLog = [];
    A.webLog = webLog;
    const webWin = (p, cls, t0, t1, up) => webLog.push({ rid: p.web.rid, i: p.web.el.i, cls, t0, t1, up: !!up, id: p.id });
    A.webClass = function (id, cls, on, t) {                // a class on an element from t (on) or off from t
      const p = part(id);
      if (!p.web) throw new Error(`screencast app "${A.id}": webClass needs a page element ("${id}")`);
      p.webCls = p.webCls || {};
      if (on && p.webCls[cls] == null) p.webCls[cls] = t;
      if (!on && p.webCls[cls] != null) { webWin(p, cls, p.webCls[cls], t, false); p.webCls[cls] = null; }
      A.reaction(p, t, t + 0.15);
      return t + 0.15;
    };
    // a value set by the page (a select's choice, a field filled in): the element's own value from t
    A.webSet = function (id, value, t) {
      const p = part(id);
      p.webVals = p.webVals || [];
      p.webVals.push({ t, v: String(value) });
      p.webValue = String(value);
      A.reaction(p, t, t + 0.15);
      return t + 0.15;
    };
    A.webFocus = null;
    function webBlur(t) { const f = A.webFocus; if (f) { webWin(f.p, "lm-focus", f.t, t, false); webWin(f.p, "lm-focus-within", f.t, t, true); A.webFocus = null; } }
    // the page answers a press: :active for the press, focus for a field (and blur of the one before), a checkbox ticks,
    // `toggle: {target, cls}` toggles a class (a menu that opens, a switch that flips)
    function webReact(p, t, o) {
      webWin(p, "lm-active", t - 0.12, t + 0.1, true);
      if (p.kind === "field" || p.kind === "select") { if (!A.webFocus || A.webFocus.p !== p) { webBlur(t); A.webFocus = { p, t }; } }
      else webBlur(t);
      if (p.kind === "checkbox") {
        p.webOn = p.webOn == null ? !!p.web.el.on : p.webOn;
        p.webOn = !p.webOn;
        p.webChecks = (p.webChecks || []).concat([{ t, v: p.webOn }]);
      }
      if (o.toggle) {
        const tg = typeof o.toggle === "string" ? { cls: o.toggle } : o.toggle, tp = tg.target ? part(tg.target) : p;
        tp.webCls = tp.webCls || {};
        A.webClass(tp.id, tg.cls, tp.webCls[tg.cls] == null, t);
      }
      if (o.menu) return A.menu(p.id, o.menu, { at: t + 0.04, w: o.menuW });
      A.reaction(p, t, t + 0.15);
      return t + 0.15;
    }
    A.ids = () => Object.keys(A.parts);
    // a part's rect at time t: a part in a scroll region follows the region's scroll
    A.rectAt = function (id, t) {
      const p = part(id), off = p.region ? scrollAt(p.region, t) : 0;
      return { x: p.x, y: p.y - off, w: p.w, h: p.h };
    };
    function scrollAt(rid, t) {
      const RG = A.regions[rid];
      if (!RG || !RG.scroll.length) return 0;
      let v = 0;
      for (const s of RG.scroll) { if (t < s.t0) break; v = t >= s.t1 ? s.to : lerp(s.from, s.to, inertia((t - s.t0) / (s.t1 - s.t0))); if (t < s.t1) break; }
      return v;
    }
    A.scrollAt = scrollAt;
    const hotspot = (r, o) => ({ x: r.x + (o && o.dx != null ? o.dx : Math.min(r.w * 0.5, Math.max(18, r.w * 0.5))), y: r.y + (o && o.dy != null ? o.dy : r.h * 0.55) });
    const pageOf = (t) => { let pg = A.pageAt[0].page; for (const q of A.pageAt) { if (t < q.t) break; pg = q.page; } return pg; };
    A.pageOf = pageOf;
    function checkVisible(p, t) {
      if (p.page && pageOf(t) !== p.page) A.warn("sc_part_hidden", `"${p.id}" is on page "${p.page}", which is not showing at ${t.toFixed(2)} s (A.go("${p.page}", t) first)`);
      if (p.hiddenUntil != null && t < p.hiddenUntil) A.warn("sc_part_hidden", `"${p.id}" is not open yet at ${t.toFixed(2)} s`);
    }

    // ---- the pointer appears (and leaves)
    A.pointer = function (at, o) {
      o = o || {};
      if (o.x != null) { P.start = { x: o.x, y: o.y }; P.pos = Object.assign({}, P.start); }
      P.vis.push({ t0: at, on: true }); P.vis.sort((a, b) => a.t0 - b.t0);
      P.free = Math.max(P.free, at + 0.2);
      A.reportMotion(at, at + 0.2, "cursor", "pointer_in", true);
      return at + 0.2;
    };
    A.pointerOut = function (at) { P.vis.push({ t0: at, on: false }); P.vis.sort((a, b) => a.t0 - b.t0); return at + 0.2; };
    const shapeFor = (p) => (p.kind === "field" ? "beam" : "arrow");
    function hoverOn(p, t0, t1) {
      if (p.web) { if (p.webHover == null) p.webHover = t0; return; }   // the page's own :hover, from arrival
      if (!p.fx) return;
      Loom.tween(p.fx, { opacity: 0 }, { opacity: 0.06, duration: 0.12, ease: Loom.ease.enter }, t0, A.meta("hover", p.id, false));
      if (t1 != null) Loom.tween(p.fx, { opacity: 0.06 }, { opacity: 0, duration: 0.12, ease: Loom.ease.enter }, t1, A.meta("hover", p.id, false));
    }
    let lastHover = null;
    function leaveHover(t) {
      if (lastHover && lastHover.web && lastHover.webHover != null) { webWin(lastHover, "lm-hover", lastHover.webHover, t, true); lastHover.webHover = null; }
      if (lastHover && lastHover.fx) { Loom.tween(lastHover.fx, { opacity: 0.06 }, { opacity: 0, duration: 0.12, ease: Loom.ease.enter }, t, A.meta("hover", lastHover.id, false)); } lastHover = null; }

    // ---- move to a part (or a point); returns the arrival time. `arrive` asks for an arrival time (the move starts early
    // enough to make it, never earlier than the pointer is free)
    A.move = function (target, o) {
      o = o || {};
      const want = o.at == null ? Math.max(P.free, A.ctx.speechStart || 0) : o.at;
      let p = null, pt;
      if (target && target.x != null && target.w == null) pt = { x: target.x, y: target.y };
      else { p = part(target); pt = hotspot(A.rectAt(p.id, want + 0.6), o); }
      // when the move would start: its duration depends on the view at that time
      const s = A.transformAt(want).s, d = Math.hypot(pt.x - P.pos.x, pt.y - P.pos.y) * s;
      const dur = o.dur || clamp(0.42 + d / cfg.pointer_px_s, 0.5, 1.3);
      let t0 = o.arrive != null ? o.arrive - dur : want;
      if (t0 < P.free) t0 = P.free;
      // leaving a text field, the I-beam turns back into the arrow as the hand starts to move (not on arrival)
      if (lastHover && lastHover.kind === "field" && lastHover !== p) { P.shapes.push({ t: t0 + 0.08, shape: "arrow" }); P.shapes.sort((a, b) => a.t - b.t); }
      if (lastHover && lastHover !== p) leaveHover(t0 + 0.05);
      const t1 = A.travel(pt, t0, { dur });
      if (p) {
        P.shapes.push({ t: t1 - 0.06, shape: shapeFor(p) }); P.shapes.sort((a, b) => a.t - b.t);
        if (lastHover !== p) { hoverOn(p, t1 - 0.05); lastHover = p; }
        checkVisible(p, t1);
      } else { P.shapes.push({ t: t1, shape: "arrow" }); P.shapes.sort((a, b) => a.t - b.t); }
      A.lastMove = { t0, t1 };
      return t1;
    };

    // a press on a part: the pointer dips, the part darkens, a ring in the signal colour opens at the point, a click is heard
    function press(p, t, pt) {
      P.dips.push({ t }); P.dips.sort((a, b) => a.t - b.t);
      if (p.fx) {
        Loom.tween(p.fx, { opacity: 0.06 }, { opacity: 0.16, duration: 0.07, ease: Loom.ease.enter }, t, A.meta("press", p.id, false));
        Loom.tween(p.fx, { opacity: 0.16 }, { opacity: 0.06, duration: 0.14, ease: Loom.ease.enter }, t + 0.1, A.meta("press", p.id, false));
      }
      // the product's own press feedback: a ripple from the point that fills the control, clipped to it, then fades
      if (p.g && p.w && p.h && p.kind !== "toggle" && p.kind !== "checkbox" && p.kind !== "field" && p.kind !== "select" && p.kind !== "region") {
        const off = p.region ? A.scrollAt(p.region, t) : 0, lx = pt.x, ly = pt.y + off;
        const cid = Loom.uid ? Loom.uid("scrip") : `scrip${Math.round(t * 1000)}`;
        const cp = svg("clipPath", { id: cid }, p.g);
        rect(cp, p.x, p.y, p.w, p.h, { r: p.r == null ? cfg.radius - 2 : p.r, fill: C("ink") });
        const rip = svg("circle", { cx: f1(lx), cy: f1(ly), r: 1, fill: C(p.variant === "primary" || p.variant === "danger" ? "onAccent" : "ink"), opacity: 0, "clip-path": `url(#${cid})`, "pointer-events": "none" }, p.g);
        const R = Math.hypot(Math.max(lx - p.x, p.x + p.w - lx), Math.max(ly - p.y, p.y + p.h - ly));
        Loom.drive((e, raw) => {
          const on = raw > 0 && raw < 1;
          rip.setAttribute("r", f1(1 + R * easeOut(Math.min(1, raw * 1.6))));
          rip.setAttribute("opacity", on ? f3(0.14 * (raw < 0.55 ? 1 : 1 - (raw - 0.55) / 0.45)) : 0);
        }, t, 0.55, "linear", { kind: "gesture", beat: A.meta("g").beat, name: `${A.id}.ripple`, content: false, key: `scrip:${A.id}:${t.toFixed(3)}:${p.id}` });
      }
      const ring = svg("circle", { cx: f1(pt.x), cy: f1(pt.y), r: 8, fill: "none", stroke: C("accent2"), "stroke-width": 4, opacity: 0 }, A.layers.marks);
      const dot = svg("circle", { cx: f1(pt.x), cy: f1(pt.y), r: 7, fill: C("accent2"), opacity: 0 }, A.layers.marks);
      Loom.drive((e, raw) => {
        const on = raw > 0 && raw < 1;
        ring.setAttribute("r", f1(8 + 30 * e)); ring.setAttribute("opacity", on ? f3(0.9 * (1 - raw)) : 0);
        dot.setAttribute("opacity", on ? f3(0.55 * (1 - raw * 1.6 < 0 ? 0 : 1 - raw * 1.6)) : 0);
      }, t, 0.5, (u) => 1 - Math.pow(1 - u, 2), { kind: "gesture", beat: A.meta("g").beat, name: `${A.id}.click`, content: false, key: `scring:${A.id}:${t.toFixed(3)}:${pt.x.toFixed(0)}` });
      if (Loom.sfx) Loom.sfx("click", t, { g: 0.5 });
      A.actions.push({ t0: t - 0.05, t1: t + 0.25, what: `click ${p.id}` });
    }

    // ---- click: arrive `dwell` before the press, press at `at` (the cue word); `zoom: true` frames the target as the
    // pointer travels (both arrive together); built-in reactions by part kind (a toggle flips, a tab or nav item or row
    // is selected, a checkbox ticks, a select opens its menu when `menu` is given). Returns when the reaction has settled.
    A.click = function (id, o) {
      o = o || {};
      const p = part(id);
      const at = o.at == null ? Math.max(P.free + cfg.dwell_s + 0.6, A.ctx.speechStart || 0) : o.at;
      let arrive = at - cfg.dwell_s;
      if (o.zoom) {
        const r = A.rectAt(p.id, at);
        let ctxR = o.frame ? frameRect(o.frame, at) : contextRect(p, r);
        if (o.menu) {                       // a menu opens below its anchor: frame the anchor and the menu it opens
          const mh = o.menu.reduce((a, it) => a + (it.divider ? 17 : 54), 0) + 24, mw = Math.max(r.w, o.menuW || 300);
          const x0 = Math.min(ctxR.x, r.x + r.w - mw), y1 = Math.max(ctxR.y + ctxR.h, r.y + r.h + 8 + mh);
          ctxR = { x: x0, y: ctxR.y, w: Math.max(ctxR.x + ctxR.w, r.x + r.w) - x0, h: y1 - ctxR.y };
        }
        const v = A.viewFor(ctxR, { scale: o.scale, margin: o.margin, snap: o.snap });
        const px = v.s * A.readPx(o.read || (typeof o.frame === "string" || Array.isArray(o.frame) ? o.frame : p.id));
        if (px < cfg.read_px - 0.5) A.warn("sc_zoom_small_text", `the zoom on "${p.id}" reaches ${px.toFixed(0)} px text at ${v.s.toFixed(2)}x${o.scale ? ` (scale ${o.scale} asked)` : ""} (${cfg.read_px} px is the reading floor): frame less (frame: [ids]), narrow the region (maxW)${o.scale ? " or a larger scale" : ""}`);
        const dur = Math.max(cfg.zoom_in_s, 0.7);
        let z0 = arrive - dur;
        if (z0 < P.free) { z0 = P.free; arrive = z0 + dur; }
        A.camTo(v, z0, dur, "zoom:" + p.id);
        A.move(p, { arrive, dur, dx: o.dx, dy: o.dy });
      } else A.move(p, { arrive, dx: o.dx, dy: o.dy });
      const tArr = P.free;
      const tp = Math.max(at, tArr + cfg.dwell_s * 0.8);
      if (tp > at + 0.25) A.warn("sc_pointer_late", `the click on "${p.id}" lands at ${tp.toFixed(2)} s, ${(tp - at).toFixed(2)} s after it was asked (the pointer was still busy)`);
      const r = A.rectAt(p.id, tp);
      const pt = hotspot(r, o);
      press(p, tp, pt);
      let tEnd = tp + 0.22;
      if (o.react !== false) tEnd = Math.max(tEnd, react(p, tp + 0.12, o));
      if (o.go) tEnd = Math.max(tEnd, A.go(o.go, tp + 0.2));
      P.free = Math.max(P.free, tp + 0.15);
      A.lastClick = tp;
      P.lastField = p.kind === "field" || p.kind === "select" ? p.id : null;
      return tEnd + (o.hold == null ? 0 : o.hold);
    };
    function contextRect(p, r) {
      // a control is framed with its neighbourhood: its row in a settings list, its field with its label, else a box
      // around it at least 520 x 300 (enough to read where it is)
      let c = p.row ? Object.assign({}, p.row) : p.fg ? { x: p.x, y: p.y - 40, w: p.fieldW || p.w, h: p.h + 72 } : Object.assign({}, r);
      if (p.row && p.region) c.y -= scrollAt(p.region, 1e9) * 0;   // rows are framed where they are now
      const minW = 560, minH = 300;
      if (c.w < minW) { c.x -= (minW - c.w) / 2; c.w = minW; }
      if (c.h < minH) { c.y -= (minH - c.h) / 2; c.h = minH; }
      return c;
    }
    function frameRect(f, t) {
      if (Array.isArray(f)) {
        const rs = f.map((id) => A.rectAt(id, t));
        const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y)), x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h));
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      }
      if (typeof f === "string") return A.rectAt(f, t);
      return f;
    }
    A.frameRect = frameRect;
    // the product's own reaction to a click on this kind of part
    function react(p, t, o) {
      if (p.web) return webReact(p, t, o);
      if (A.webFocus) webBlur(t);
      if (p.kind === "toggle") return A.toggle(p.id, !p.ctl.state, t);
      if (p.kind === "checkbox") return A.check(p.id, !p.ctl.state, t);
      if (p.kind === "tab" || p.kind === "nav" || (p.kind === "row" && o.select !== false && (p.on || []).length)) return A.select(p.id, t);
      if ((p.kind === "field" || p.kind === "select") && p.ring) { focusRing(p, t, o.blur); if (p.kind === "select" && o.menu) return A.menu(p.id, o.menu, { at: t + 0.04 }); return t + 0.15; }
      if (o.menu) return A.menu(p.id, o.menu, { at: t + 0.04, w: o.menuW });
      return t + 0.1;
    }
    function focusRing(p, t, until) {
      if (!p.ring || p.focusAt === t) return;
      p.focusAt = t;
      Loom.tween(p.ring, { opacity: 0 }, { opacity: 1, duration: 0.14, ease: Loom.ease.enter }, t, A.meta("focus", p.id));
      if (until != null) Loom.tween(p.ring, { opacity: 1 }, { opacity: 0, duration: 0.14 }, until, A.meta("focus", p.id));
    }
    A.blur = function (id, t) { const p = part(id); if (p.ring) Loom.tween(p.ring, { opacity: 1 }, { opacity: 0, duration: 0.14 }, t, A.meta("focus", p.id)); return t + 0.14; };

    // ---- hover only (a tooltip with `tip`)
    A.hover = function (id, o) {
      o = o || {};
      const p = part(id), t1 = A.move(p, { at: o.at, dx: o.dx, dy: o.dy });
      if (o.tip) A.tooltip(p.id, o.tip, { at: t1 + 0.35, until: o.until });
      return t1 + (o.tip ? 0.6 : 0.2);
    };
    A.tooltip = function (id, str, o) {
      o = o || {};
      const p = part(id), r = A.rectAt(p.id, o.at), g = svg("g", { opacity: 0 }, A.layers.over);
      const w = textW(str, "caption", 20, 600) + 28, h = 40, x = clamp(r.x + r.w / 2 - w / 2, A.win.x + 8, A.win.x + A.win.w - w - 8), y = r.y + r.h + 10;
      rect(g, x, y, w, h, { r: 8, fill: C("shadow") });
      text(g, str, { x, y, w, h, size: 20, weight: 600, color: "surface", align: "center", tag: "tooltip" });
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: Loom.ease.enter }, o.at, A.meta("reveal", "tooltip"));
      Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.15 }, o.until || o.at + 2, A.meta("exit", "tooltip"));
      return o.at + 0.15;
    };

    // ---- typing: a click into the field (unless the caret is already there), the placeholder clears, characters arrive at
    // a person's pace with the caret after them; every 3rd key ticks. Returns when the last character is in.
    A.type = function (id, str, o) {
      o = o || {};
      const p = part(id);
      if (!(p.kind === "field" || p.kind === "select")) throw new Error(`screencast app "${A.id}": type() needs a text field ("${p.id}" is a ${p.kind})`);
      let t = o.at == null ? Math.max(P.free + 0.4, A.ctx.speechStart || 0) : o.at;
      if (o.click !== false && P.lastField !== p.id) t = A.click(p.id, { at: t, zoom: o.zoom, frame: o.frame, scale: o.scale, read: o.read, dx: p.w * 0.78 }) + 0.1;
      else focusRing(p, t);
      P.lastField = p.id;
      if (p.web) return webType(p, String(str), t, o);
      const cps = o.cps || cfg.type_cps, s = String(str), shown = p.password ? "•".repeat(s.length) : s;
      const r = p, role = "caption", size = cfg.ui_text;
      const boxW = r.w - 2 * (p.pad || 18) - (p.right || 0);
      if (textW(shown, role, size) > boxW) A.warn("sc_type_long", `"${s.slice(0, 30)}" is wider than the field "${p.id}": shorten it (a field never scrolls in a lesson)`);
      // the old value or placeholder leaves as typing starts
      for (const n of [p.value, p.placeholder]) if (n) Loom.tween(n, { opacity: 1 }, { opacity: 0, duration: 0.08 }, t, A.meta("state", p.id));
      const tx = text(p.g, shown, { x: p.x + (p.pad || 18), y: p.y, w: boxW, h: p.multiline ? 52 : p.h, size, tag: "typed" });
      const spans = Array.from(tx.querySelectorAll ? tx.querySelectorAll("tspan") : []);
      const target = spans[0] || tx, full = target.textContent;
      const n = full.length, dur = Math.max(0.25, n / cps);
      const caret = svg("rect", { x: f1(p.x + (p.pad || 18)), y: f1(p.y + (p.multiline ? 52 : p.h) / 2 - size * 0.6), width: 2.5, height: f1(size * 1.2), fill: C("accent"), opacity: 0 }, p.g);
      const hold = o.hold == null ? 0.8 : o.hold, t0 = t;
      const TT = cadence(full, dur, `${A.id}:type:${p.id}:${t0.toFixed(3)}`);
      Loom.drive((e, raw) => {
        const now = t0 + raw * (dur + hold);
        const k = raw <= 0 ? 0 : Math.max(0, Math.min(n, typedBy(TT, now - t0)));
        target.textContent = full.slice(0, k);
        caret.setAttribute("x", f1(p.x + (p.pad || 18) + K().measure(full.slice(0, k), role, size) + 2));
        const typing = now <= t0 + dur, blink = Math.floor((now - t0) / 0.53) % 2 === 0;
        caret.setAttribute("opacity", raw <= 0 || raw >= 1 ? 0 : typing || blink ? 1 : 0);
      }, t0, dur + hold, "linear", { kind: "typewriter", beat: A.meta("t").beat, name: `${A.id}.type.${p.id}`, content: true, key: `sctype:${A.id}:${p.id}:${t0.toFixed(3)}` });
      for (let i = 0; i < n; i += 3) if (full[i] !== " " && Loom.sfx) Loom.sfx("key", t0 + (i ? TT[i - 1] : 0), { i, g: 0.35 });
      A.actions.push({ t0, t1: t0 + dur, what: `typing in ${p.id}` });
      p.value = tx; p.placeholder = null;
      P.free = Math.max(P.free, t0 + dur);
      return t0 + dur;
    };

    // typing into a captured page's real input: its value grows at a person's cadence, our caret after the last
    // character (measured in the page's own font, at the page's scale)
    function webType(p, s, t0, o) {
      const RG = A.regions[p.web.rid], e = p.web.el, K = RG.web.k, cps = o.cps || cfg.type_cps;
      const shown = (e.a || {}).type === "password" ? "•".repeat(s.length) : s, n = shown.length, dur = Math.max(0.25, n / cps), hold = o.hold == null ? 0.8 : o.hold;
      const prev = p.webValue != null ? p.webValue : e.v || "";
      const TT = cadence(shown, dur, `${A.id}:web:${p.id}:${t0.toFixed(3)}`);
      const ch = e.fs * K * 1.25, cy = p.y + p.h / 2 - ch / 2;
      const caret = svg("rect", { x: f1(p.x + p.pad), y: f1(cy), width: f1(Math.max(2, 1.6 * K)), height: f1(ch), fill: C("ink"), opacity: 0 }, RG.web.over);
      const node = () => webNode(RG, e.i);
      const wpx = (k) => pageMeasure(shown.slice(0, k), e.ff) * K;
      Loom.drive((ee, raw) => {
        const now = t0 + raw * (dur + hold), k = raw <= 0 ? 0 : Math.max(0, Math.min(n, typedBy(TT, now - t0)));
        const nd = node();
        if (nd) nd.value = raw <= 0 ? prev : s.slice(0, k);
        caret.setAttribute("x", f1(p.x + p.pad + wpx(k) + 1));
        const typing = now <= t0 + dur, blink = Math.floor((now - t0) / 0.53) % 2 === 0;
        caret.setAttribute("opacity", raw <= 0 || raw >= 1 ? 0 : typing || blink ? 1 : 0);
      }, t0, dur + hold, "linear", { kind: "typewriter", beat: A.meta("t").beat, name: `${A.id}.webtype.${p.id}`, content: true, key: `scwebtype:${A.id}:${p.id}:${t0.toFixed(3)}` });
      for (let i = 0; i < n; i += 3) if (s[i] !== " " && Loom.sfx) Loom.sfx("key", t0 + (i ? TT[i - 1] : 0), { i, g: 0.35 });
      if (pageMeasure(shown, e.ff) * K > p.w - 2 * p.pad) A.warn("sc_type_long", `"${s.slice(0, 30)}" is wider than the page's field "${p.id}"`);
      p.webValue = s;
      A.actions.push({ t0, t1: t0 + dur, what: `typing in ${p.id}` });
      P.free = Math.max(P.free, t0 + dur);
      return t0 + dur;
    }
    function webNode(RG, i) {
      if (!RG.web.root) return null;
      if (!RG.web.nodes.has(i)) RG.web.nodes.set(i, RG.web.root.querySelector(`[data-lm-i="${i}"]`));
      return RG.web.nodes.get(i);
    }
    A.webNode = (rid, i) => webNode(A.regions[rid], i);
    // scroll a region so a part sits `pos` of the way down it (a page's element, a row, a line)
    A.scrollTo = function (id, o) {
      o = o || {};
      const p = part(id), RG = A.regions[p.region];
      if (!RG || !RG.body) throw new Error(`screencast app "${A.id}": "${id}" is not in a scrolling region`);
      const t = o.at == null ? P.free + 0.2 : o.at, maxOff = Math.max(0, RG.body.content - RG.body.h);
      const to = clamp(p.y - RG.body.y - (RG.body.h - p.h) * (o.pos == null ? 0.3 : o.pos), 0, maxOff);
      return A.scroll(p.region, to - scrollAt(p.region, t), { at: t, dur: o.dur });
    };
    // every page state as drives, once the schedule is whole: per element and class, the union of its windows (a
    // :hover on a parent shared by two children stays on across both), checks and values as steps in time
    A.flushWeb = function () {
      if (A.webFlushed) return;
      A.webFlushed = true;
      const END = 1e4;
      for (const p of Object.values(A.parts)) {
        if (!p.web) continue;
        if (p.webHover != null) { webWin(p, "lm-hover", p.webHover, END, true); p.webHover = null; }
        for (const [cls, t0] of Object.entries(p.webCls || {})) if (t0 != null) webWin(p, cls, t0, END, false);
      }
      if (A.webFocus) webBlur(END);
      const wins = new Map();
      for (const w of webLog) {
        const RG = A.regions[w.rid], ids = w.up ? webAncestors(RG.web.snap, w.i) : [w.i];
        for (const i of ids) { const key = `${w.rid}|${i}|${w.cls}`; if (!wins.has(key)) wins.set(key, []); wins.get(key).push([w.t0, w.t1]); }
      }
      for (const [key, list] of wins) {
        const [rid, si, cls] = key.split("|"), RG = A.regions[rid];
        if (!RG.web.root) continue;
        list.sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (const [a, b] of list) { const last = merged[merged.length - 1]; if (last && a <= last[1] + 1e-6) last[1] = Math.max(last[1], b); else merged.push([a, b]); }
        const nd = webNode(RG, +si), t0 = merged[0][0], dur = Math.min(END, Math.max(...merged.map((m) => m[1]))) - t0;
        if (!nd) continue;
        Loom.drive((e, raw) => {
          const now = t0 + raw * dur, on = raw > 0 && merged.some(([a, b]) => now >= a && now < b);
          nd.classList.toggle(cls, on);
        }, t0, Math.max(0.01, dur), "linear", { kind: "state", beat: A.meta("w").beat, name: `${A.id}.web.${cls}`, content: false, key: `scweb:${A.id}:${key}` });
      }
      for (const p of Object.values(A.parts)) {
        if (!p.web) continue;
        const RG = A.regions[p.web.rid], nd = webNode(RG, p.web.el.i);
        if (!nd) continue;
        for (const [prop, steps, v0] of [["checked", p.webChecks, !!p.web.el.on], ["value", p.webVals, p.web.el.v]]) {
          if (!steps || !steps.length) continue;
          const t0 = steps[0].t;
          Loom.drive((e, raw) => {
            const now = t0 + raw * END; let v = v0;
            if (raw > 0) for (const st of steps) if (now >= st.t) v = st.v;
            nd[prop] = v;
          }, t0, END, "linear", { kind: "state", beat: A.meta("w").beat, name: `${A.id}.web.${prop}`, content: false, key: `scweb:${A.id}:${p.id}:${prop}` });
        }
      }
    };

    // ---- a held app changed by the system as a later beat opens (D-190): the picture the last beat ended on jumps at the
    // join. st-sc-2fa b06 cleared the password b05 had typed at its first frame (to type it again), and the field emptied
    // on the cut. A value cleared there is an error; any other system change there (a toggle, a page, a selection) a warning
    const atJoin = (what, t, undo) => {
      const b = Loom.ctxBeat;
      if (!b || !A.E || A.E.beat === b.id || !(t >= b.start - 0.2 && t <= b.start + 0.4)) return;
      const msg = `${what} at ${t.toFixed(2)} s, as ${b.id} opens on the app "${A.id}" it holds: the picture the beat before ended on ` +
        `jumps at the join. End the beat before on this state, or show the change as an action after the first words ` +
        `(the pointer clears the field, a click turns the page)`;
      if (undo) Loom.error("sc_reset_at_join", `${b.id}: ${msg}`, { beat: b.id });
      else A.warn("sc_change_at_join", msg);
    };
    // ---- a value set by the system (not typed): a quick cross-fade in the field or select
    A.setValue = function (id, str, t) {
      const p = part(id);
      atJoin(`"${id}" set to ${str === "" ? "nothing" : `"${String(str).slice(0, 24)}"`}`, t, str === "" && !!p.value);
      const old = p.value || p.placeholder;
      if (old) Loom.tween(old, { opacity: 1 }, { opacity: 0, duration: 0.12 }, t, A.meta("state", p.id));
      const nv = text(p.g, p.password ? "•".repeat(String(str).length) : str, { x: p.x + (p.pad || 18), y: p.y, w: p.w - 2 * (p.pad || 18) - (p.right || 0), h: p.multiline ? 52 : p.h, size: cfg.ui_text, tag: "value" });
      Loom.tween(nv, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: Loom.ease.enter }, t + 0.06, A.meta("reveal", p.id));
      p.value = nv; p.placeholder = null;
      A.reaction(p, t, t + 0.22);
      return t + 0.22;
    };

    // ---- system reactions
    A.reaction = function (p, t0, t1) {
      const where = p.region || p.id.split(".")[0];
      for (const q of A.reactions) if (q.t0 < t1 - 0.05 && q.t1 > t0 + 0.05 && q.where !== where && !q.with && !(p.with))
        A.warn("sc_two_changes", `two changes at once in different places ("${q.id}" and "${p.id}" around ${t0.toFixed(2)} s): one change at a time, or the second goes unseen`);
      A.reactions.push({ t0, t1, where, id: p.id });
      p.rectOk = p.w != null && !!A.parts[p.id];
      A.reactions[A.reactions.length - 1].p = p;
    };
    A.toggle = function (id, on, t) {
      const p = part(id), c = p.ctl;
      if (!c || !c.knob) throw new Error(`screencast app "${A.id}": "${id}" is not a toggle`);
      if (!!c.state !== !!on) atJoin(`the toggle "${id}" turned ${on ? "on" : "off"}`, t, !on);
      const from = c.state ? 1 : 0, to = on ? 1 : 0;
      c.state = !!on;
      Loom.drive((e) => {
        const k = lerp(from, to, e);
        c.knob.setAttribute("transform", `translate(${f1(k * c.travel)} 0)`);
        c.trackOn.setAttribute("opacity", f3(k));
      }, t, 0.2, (u) => easeOut(u), { kind: "state", beat: A.meta("s").beat, name: `${A.id}.toggle.${p.id}`, content: true, key: `sctog:${A.id}:${p.id}` });
      A.reaction(p, t, t + 0.2);
      return t + 0.2;
    };
    A.check = function (id, on, t) {
      const p = part(id), c = p.ctl || p.check;
      c.state = !!on;
      Loom.tween(c.on, { opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0, duration: 0.12, ease: Loom.ease.enter }, t, A.meta("state", p.id));
      A.reaction(p, t, t + 0.12);
      return t + 0.12;
    };
    // select a nav item, tab or row: the others in its group turn off
    A.select = function (id, t) {
      const p = part(id);
      const group = p.kind === "nav" ? (q) => q.kind === "nav" : p.kind === "tab" ? (q) => q.group === p.group : (q) => q.kind === "row" && q.region === p.region;
      for (const q of Object.values(A.parts)) if (q !== p && group(q) && stateAt(q)) A.setOn(q, false, t);
      if (!stateAt(p)) A.setOn(p, true, t);
      A.reaction(p, t, t + 0.18);
      return t + 0.18;
    };
    const stateAt = (q) => !!q.state;
    // a table cell's new value (a status that changes, a total that updates): the old fades, the new lands with a brief tint
    A.cell = function (rid, r, c, value, t, o) {
      o = o || {};
      if (A.regions[rid] && A.regions[rid].kind === "cards") return A.card(rid, r, value, t, o);   // a card: r is its index or id
      const row = part(`${rid}.row.${r}`), cl = row.cells[c];
      if (!cl) throw new Error(`screencast app "${A.id}": no cell ${r}, ${c} in "${rid}"`);
      for (const n of cl.nodes) Loom.tween(n, { opacity: 1 }, { opacity: 0, duration: 0.14 }, t, A.meta("state", row.id));
      const RG = A.regions[rid], col = (RG.spec.columns || [])[c] || {};
      const ng = svg("g", { opacity: 0 }, cl.g);
      const nc = A.cellDraw(ng, Object.assign({}, col, o.kind ? { kind: o.kind } : {}), value, cl.x, cl.y, cl.w, cl.h, RG.spec);
      Loom.tween(ng, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: Loom.ease.enter }, t + 0.1, A.meta("reveal", row.id));
      cl.nodes = [ng]; cl.kind = nc.kind;
      A.reaction(row, t, t + 0.3);
      return t + 0.3;
    };
    A.disable = function (id, on, t) {
      const p = part(id);
      Loom.tween(p.g, { opacity: on ? 1 : 0.45 }, { opacity: on ? 0.45 : 1, duration: 0.16 }, t, A.meta("state", p.id));
      return t + 0.16;
    };
    // a validation error under a field (the box turns red, the message in neg); clearError removes it
    A.error = function (id, msg, t) {
      const p = part(id);
      Loom.tween(p.bad, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: Loom.ease.enter }, t, A.meta("state", p.id));
      if (p.help) Loom.tween(p.help, { opacity: 1 }, { opacity: 0, duration: 0.1 }, t, A.meta("state", p.id));
      const eg = svg("g", { opacity: 0 }, p.fg || p.g);
      icon(eg, "circle-alert", p.x + 11, p.msgY + 13, 20, "neg");
      text(eg, msg, { x: p.x + 28, y: p.msgY, w: (p.fieldW || p.w) - 28, h: 26, size: 20, weight: 600, color: "neg", tag: "error" });
      Loom.tween(eg, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: Loom.ease.enter }, t, A.meta("reveal", p.id + ".error"));
      p.err = eg;
      A.reaction(p, t, t + 0.2);
      return t + 0.2;
    };
    A.clearError = function (id, t) {
      const p = part(id);
      if (p.err) Loom.tween(p.err, { opacity: 1 }, { opacity: 0, duration: 0.14 }, t, A.meta("exit", p.id + ".error"));
      Loom.tween(p.bad, { opacity: 1 }, { opacity: 0, duration: 0.14 }, t, A.meta("state", p.id));
      if (p.help) Loom.tween(p.help, { opacity: 0 }, { opacity: 1, duration: 0.14 }, t + 0.1, A.meta("state", p.id));
      return t + 0.24;
    };

    // ---- scroll a region's body by dy (positive: content moves up) over dur; parts in it follow
    A.scroll = function (rid, dy, o) {
      o = o || {};
      const RG = A.regions[rid];
      if (!RG || !RG.body) throw new Error(`screencast app "${A.id}": "${rid}" is not a scrolling region (table, list or settings)`);
      const t = o.at == null ? P.free + 0.2 : o.at, dur = o.dur || clamp(0.5 + Math.abs(dy) / 900, 0.6, 1.4);
      const from = scrollAt(rid, t), maxOff = Math.max(0, RG.body.content - RG.body.h);
      const to = clamp(from + dy, 0, maxOff);
      if (Math.abs(to - from - dy) > 1) A.warn("sc_scroll_end", `scrolling "${rid}" by ${dy} px stops at its end (${Math.round(to - from)} px)`);
      RG.scroll.push({ t0: t, t1: t + dur, from, to }); RG.scroll.sort((a, b) => a.t0 - b.t0);
      const B = RG.body;
      Loom.drive((e) => {
        const v = lerp(from, to, e);
        B.g.setAttribute("transform", `translate(0 ${f1(-v)})`);
        if (RG.thumb) RG.thumb.setAttribute("y", f1(B.y + 8 + (RG.trackH - RG.thumbH) * (maxOff ? v / maxOff : 0)));
      }, t, dur, (u) => inertia(u), { kind: "scroll", beat: A.meta("s").beat, name: `${A.id}.scroll.${rid}`, content: true, key: `scscroll:${A.id}:${rid}` });
      if (o.wheel !== false && P.vis.length) A.actions.push({ t0: t, t1: t + dur, what: `scrolling ${rid}` });
      return t + dur;
    };

    // ---- go to another page (the nav item turns on; the page cross-fades in place)
    A.go = function (pid, t, o) {
      o = o || {};
      const cur = pageOf(t);
      if (!A.pages[pid]) throw new Error(`screencast app "${A.id}": no page "${pid}" (have: ${Object.keys(A.pages).join(", ")})`);
      if (cur === pid) return t;
      atJoin(`the page changed from "${cur}" to "${pid}"`, t, false);
      Loom.tween(A.pages[cur].g, { opacity: 1 }, { opacity: 0, duration: 0.16 }, t, A.meta("exit", "page." + cur));
      Loom.tween(A.pages[pid].g, { opacity: 0 }, { opacity: 1, duration: 0.24, ease: Loom.ease.enter }, t + 0.1, A.meta("reveal", "page." + pid));
      // the new page arrives with a short slide (24 px, eased out), the old one drifts the other way as it fades; at rest
      // both sit at 0 (a drive never leaves a page offset outside its window)
      const dir = o.back ? -1 : 1, gOld = A.pages[cur].g, gNew = A.pages[pid].g;
      Loom.drive((e, raw) => {
        const on = raw > 0 && raw < 1;
        gNew.setAttribute("transform", on ? `translate(${f1(dir * 24 * (1 - e))} 0)` : "translate(0 0)");
        gOld.setAttribute("transform", on && raw < 0.5 ? `translate(${f1(-dir * 10 * easeOut(raw * 2))} 0)` : "translate(0 0)");
      }, t, 0.34, (u) => easeOut(u), { kind: "reveal", beat: A.meta("g").beat, name: `${A.id}.go.${pid}`, content: false, key: `scgo:${A.id}:${pid}:${t.toFixed(3)}` });
      A.pageAt.push({ t: t + 0.1, page: pid }); A.pageAt.sort((a, b) => a.t - b.t);
      if (o.nav && A.parts["nav." + o.nav]) A.select("nav." + o.nav, t);
      A.reaction({ id: "page." + pid, with: true }, t, t + 0.32);
      return t + 0.32;
    };

    // ---- keystroke HUD: key caps bottom centre (above the captions), each pressing in turn
    A.keys = function (keys, o) {
      o = o || {};
      const t = o.at == null ? P.free + 0.2 : o.at, hold = o.hold || 1.6;
      const hud = A.layers.hud, g = svg("g", { opacity: 0, class: "lm-sc-keys" }, hud);
      const size = 28, h = 64, gap = 14, plus = 26;
      const ws = keys.map((k) => Math.max(h, textW(k, "label", size, 600) + 36));
      const total = ws.reduce((a, b) => a + b, 0) + (keys.length - 1) * (gap * 2 + plus) + 36;
      let x = 960 - total / 2 + 18;
      const y = o.y || 860;
      rect(g, 960 - total / 2, y - 14, total, h + 28, { r: 22, fill: C("shadow"), opacity: 0.86 });
      keys.forEach((k, i) => {
        const kg = svg("g", {}, g), kx = x;
        rect(kg, kx, y + 5, ws[i], h, { r: 12, fill: C("ink") });
        const cap = svg("g", {}, kg);
        rect(cap, kx, y, ws[i], h, { r: 12, fill: C("surface") });
        text(cap, k, { x: kx, y, w: ws[i], h, role: "label", size, weight: 600, align: "center", color: "ink", tag: "key" });
        Loom.drive((e, raw) => { const d = raw > 0 && raw < 1 ? Math.sin(Math.PI * raw) * 4 : 0; cap.setAttribute("transform", `translate(0 ${f1(d)})`); },
          t + 0.12 + i * 0.09, 0.16, "linear", { kind: "gesture", beat: A.meta("k").beat, name: `${A.id}.key`, content: false, key: `sckey:${A.id}:${t.toFixed(3)}:${i}` });
        x += ws[i];
        if (i < keys.length - 1) { text(g, "+", { x: x + gap, y, w: plus, h, role: "label", size, weight: 600, align: "center", color: "surface", tag: "key_plus" }); x += gap * 2 + plus; }
      });
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: Loom.ease.enter }, t, A.meta("reveal", "keys"));
      Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.25 }, t + hold, A.meta("exit", "keys"));
      if (Loom.sfx) Loom.sfx("key", t + 0.12, { g: 0.45 });
      A.actions.push({ t0: t, t1: t + 0.4, what: "a shortcut" });
      A.overlay("keys", keys.join("+"), t, t + hold);
      return t + 0.4;
    };

    // ---- product overlays: a dialog (backdrop over the app), a menu under its anchor, a toast
    A.dialog = function (d, o) {
      o = o || {};
      const t = o.at == null ? P.free + 0.2 : o.at, win = A.win;
      const g = svg("g", { opacity: 0, class: "lm-sc-dialog" }, A.layers.over);
      const top = A.appTop;
      svg("rect", { x: win.x, y: top, width: win.w, height: win.y + win.h - top, fill: C("shadow"), opacity: 0.32 }, g);
      const w = d.w || 680;
      const flds = d.fields || [];
      const h = d.h || (96 + (d.text ? 70 : 0) + flds.reduce((a, f) => a + A.fieldH(f), 0) + (d.actions ? 96 : 24));
      const x = win.x + (win.w - w) / 2, y = top + (win.y + win.h - top - h) / 2 - 10;
      const box = svg("g", {}, g);
      shadowRects(box, x, y, w, h, 16);
      rect(box, x, y, w, h, { r: 16, fill: C("surface") });
      text(box, d.title || "", { x: x + 32, y: y + 26, w: w - 104, h: 44, role: "label", size: 26, weight: 700, tag: "dialog_title" });
      icon(box, "x", x + w - 42, y + 48, 24, "muted");
      let yy = y + 82;
      if (d.text) { K().text(box, d.text, { role: "caption", size: 21, x: x + 32, y: yy, w: w - 64, h: 60, maxLines: 2, color: "muted" }).setAttribute("data-sc", "dialog_text"); yy += 70; }
      A.building = null;
      for (const f of flds) { const fp = A.field(box, f, "dialog", x + 32, yy, w - 64); fp.hiddenUntil = t; fp.dialog = true; yy += A.fieldH(f); }
      if (d.actions) {
        let bx = x + w - 32;
        for (const b of d.actions.slice().reverse()) { const bw = buttonWidth(b); bx -= bw; const bp = A.button(box, Object.assign({}, b, { id: "dialog.action." + b.id }), bx, y + h - 32 - cfg.control_h, bw); bp.hiddenUntil = t; bx -= 12; }
      }
      const dp = A.reg({ id: "dialog", kind: "region", x, y, w, h, g: box, r: 16 });
      dp.hiddenUntil = t;
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.26, ease: Loom.ease.enter }, t, A.meta("reveal", "dialog"));
      Loom.drive((e) => { const k = 0.96 + 0.04 * e; box.setAttribute("transform", `translate(${f1((x + w / 2) * (1 - k))} ${f1((y + h / 2) * (1 - k))}) scale(${f3(k)})`); }, t, 0.26, (u) => easeOut(u),
        { kind: "reveal", beat: A.meta("d").beat, name: `${A.id}.dialog`, content: false, key: `scdlg:${A.id}:${t.toFixed(3)}` });
      A.openDialog = { g, t };
      A.reaction({ id: "dialog", with: true }, t, t + 0.26);
      return t + 0.26;
    };
    function buttonWidth(b) { return b.w || Math.ceil(textW(b.label || "", "caption", cfg.ui_text, 600) + (b.icon ? 64 : 40)); }
    A.closeDialog = function (t) {
      if (!A.openDialog) return t;
      Loom.tween(A.openDialog.g, { opacity: 1 }, { opacity: 0, duration: 0.2 }, t, A.meta("exit", "dialog"));
      for (const p of Object.values(A.parts)) if (p.dialog || p.id === "dialog" || p.id.startsWith("dialog.")) p.closedAt = t;
      A.pointerSched.shapes.push({ t, shape: "arrow" }); A.pointerSched.shapes.sort((a, b) => a.t - b.t);
      A.openDialog = null;
      return t + 0.2;
    };
    A.menu = function (anchor, items, o) {
      o = o || {};
      const a = part(anchor), t = o.at == null ? P.free : o.at, r = A.rectAt(a.id, t);
      const rh = 54, w = o.w || Math.max(r.w, 280, ...items.map((it) => textW(it.label || "", "caption", cfg.ui_text, 600) + (it.icon ? 96 : 56)));
      const hs = items.map((it) => (it.divider ? 17 : rh)), h = hs.reduce((a, b) => a + b, 0) + 16;
      let x = r.x, y = r.y + r.h + 8;
      if (x + w > A.win.x + A.win.w - 12) x = r.x + r.w - w;
      if (y + h > A.win.y + A.win.h - 12) y = r.y - h - 8;
      const g = svg("g", { opacity: 0, class: "lm-sc-menu" }, A.layers.over);
      shadowRects(g, x, y, w, h, 12);
      rect(g, x, y, w, h, { r: 12, fill: C("surface"), stroke: A.tone.hair2, sw: 1.5 });
      let iy = y + 8;
      items.forEach((it, i) => {
        if (it.divider) { svg("rect", { x: x + 12, y: iy + 8, width: w - 24, height: 1, fill: A.tone.hair }, g); iy += hs[i]; return; }
        const ig = svg("g", {}, g);
        const col = it.tone === "neg" || it.danger ? "neg" : "ink";
        if (it.icon) icon(ig, it.icon, x + 30, iy + rh / 2, 22, col === "neg" ? "neg" : "muted");
        text(ig, it.label, { x: x + (it.icon ? 56 : 20), y: iy, w: w - (it.icon ? 76 : 40) - (it.hint ? 90 : 0), h: rh, size: cfg.ui_text, color: col, tag: "menu_item" });
        if (it.hint) text(ig, it.hint, { x: x + w - 110, y: iy, w: 92, h: rh, size: 20, color: "muted", align: "right", tag: "menu_hint" });
        const mp = A.reg({ id: "menu." + (it.id || i), kind: "button", x: x + 6, y: iy, w: w - 12, h: rh, g: ig, r: 8 });
        mp.hiddenUntil = t;
        iy += rh;
      });
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: Loom.ease.enter }, t, A.meta("reveal", "menu"));
      Loom.drive((e) => g.setAttribute("transform", `translate(0 ${f1(-8 * (1 - e))})`), t, 0.2, (u) => easeOut(u),
        { kind: "reveal", beat: A.meta("m").beat, name: `${A.id}.menu`, content: false, key: `scmenu:${A.id}:${t.toFixed(3)}` });
      A.openMenu = { g, t };
      A.reaction({ id: "menu." + anchor, with: true }, t, t + 0.2);
      return t + 0.2;
    };
    A.closeMenu = function (t) {
      if (!A.openMenu) return t;
      Loom.tween(A.openMenu.g, { opacity: 1 }, { opacity: 0, duration: 0.14 }, t, A.meta("exit", "menu"));
      A.openMenu = null;
      return t + 0.14;
    };
    A.toast = function (str, o) {
      o = o || {};
      const t = o.at == null ? P.free + 0.2 : o.at, tn = toneTok(o.tone || "pos");
      const h = o.progress ? 104 : 76, th = o.progress ? 72 : h, w = Math.min(720, Math.max(o.progress ? 480 : 0, textW(str, "caption", 22, 600) + (o.icon === false ? 72 : 120)));
      // where the product shows it: `place` (bottom-right by default, as most apps do), or the first of the usual places
      // that covers none of the parts named in `avoid` (a chart's axis, the rows the narration is about)
      const W0 = A.win, PL = {
        "bottom-right": [W0.x + W0.w - w - 32, W0.y + W0.h - h - 32], "bottom-left": [A.left + 32, W0.y + W0.h - h - 32],
        "bottom-center": [A.left + (W0.x + W0.w - A.left - w) / 2, W0.y + W0.h - h - 32],
        "top-right": [W0.x + W0.w - w - 32, A.mainTop + 20], "top-center": [A.left + (W0.x + W0.w - A.left - w) / 2, A.mainTop + 20] };
      let place = o.place || "bottom-right";
      if (o.avoid) {
        const rs = [].concat(o.avoid).map((id) => A.rectAt(id, t));
        const hits = (k) => rs.some((r) => PL[k][0] < r.x + r.w && PL[k][0] + w > r.x && PL[k][1] < r.y + r.h && PL[k][1] + h > r.y);
        place = [place, "bottom-right", "bottom-left", "bottom-center", "top-right", "top-center"].find((k) => PL[k] && !hits(k)) || place;
      }
      if (!PL[place]) throw new Error(`screencast app "${A.id}": a toast's place is one of ${Object.keys(PL).join(", ")}`);
      const [x, y] = PL[place];
      const g = svg("g", { opacity: 0, class: "lm-sc-toast" }, A.layers.over), box = svg("g", {}, g);
      shadowRects(box, x, y, w, h, 14);
      rect(box, x, y, w, h, { r: 14, fill: C("surface"), stroke: A.tone.hair2, sw: 1.5 });
      rect(box, x, y, 8, h, { r: 4, fill: C(tn) });
      if (o.icon !== false) icon(box, o.icon || (tn === "neg" ? "circle-alert" : "circle-check"), x + 46, y + th / 2 + (o.progress ? 4 : 0), 30, tn);
      text(box, str, { x: x + (o.icon === false ? 32 : 76), y: y + (o.progress ? 4 : 0), w: w - (o.icon === false ? 56 : 100), h: th, size: 22, weight: 600, tag: "toast" });
      const tp = A.reg({ id: o.id || "toast", kind: "region", x, y, w, h, g: box, r: 14, textPx: 22 });
      tp.hiddenUntil = t;
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: Loom.ease.enter }, t, A.meta("reveal", "toast"));
      Loom.drive((e) => box.setAttribute("transform", `translate(0 ${f1(18 * (1 - e))})`), t, 0.28, (u) => easeOut(u),
        { kind: "reveal", beat: A.meta("t").beat, name: `${A.id}.toast`, content: false, key: `sctoast:${A.id}:${t.toFixed(3)}` });
      if (o.until !== false) Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.25 }, o.until || t + 3.5, A.meta("exit", "toast"));
      A.overlay("toast", str, t, o.until === false ? null : o.until || t + 3.5);
      if (Loom.sfx && o.sound !== false) Loom.sfx(tn === "neg" ? "error" : "success", t + 0.05, { g: 0.35 });
      A.reaction(Object.assign(tp, { with: true }), t, t + 0.28);
      return t + 0.28;
    };
    // ---- a progress bar inside a part (an export, an upload): fills from..to over dur; used with a time-lapse tag
    A.progress = function (id, o) {
      o = o || {};
      const p = part(id), t = o.at, dur = o.dur || 2;
      const g = svg("g", {}, p.g), bx = p.x + (o.inset || 24), bw = p.w - 2 * (o.inset || 24), by = o.y != null ? o.y : p.y + p.h - (o.inset || 24) - 6;
      rect(g, bx, by, bw, 10, { r: 5, fill: A.tone.track });
      const bar = rect(g, bx, by, 0.01, 10, { r: 5, fill: C(o.tone || "accent") });
      Loom.drive((e) => bar.setAttribute("width", f1(Math.max(0.01, bw * lerp(o.from || 0, o.to == null ? 1 : o.to, e)))), t, dur, "linear",
        { kind: "count", beat: A.meta("p").beat, name: `${A.id}.progress.${p.id}`, content: true, key: `scprog:${A.id}:${p.id}` });
      return t + dur;
    };

    // ---- a card's value changes (a KPI that updates): the old fades, the new lands; {count: true} counts a number to it
    // ("0.6%" to "0.4%"), {tone} recolours it, {sub} changes the line under it
    const NUM = /^(\D*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/;
    A.card = function (rid, which, value, t, o) {
      o = o || {};
      const p = part(`${rid}.card.${which}`), it = p.item || {}, str = String(value);
      const tn = o.tone !== undefined ? o.tone : it.tone;
      if (p.valueNode) Loom.tween(p.valueNode, { opacity: 1 }, { opacity: 0, duration: o.count ? 0.01 : 0.14 }, t, A.meta("state", p.id));
      const nv = text(p.g, str, Object.assign({}, p.valBox, { color: tn ? toneTok(tn) : "ink" }));
      Loom.tween(nv, { opacity: 0 }, { opacity: 1, duration: o.count ? 0.01 : 0.2, ease: Loom.ease.enter }, o.count ? t : t + 0.1, A.meta("reveal", p.id));
      let end = t + 0.3;
      const a = NUM.exec(p.valueStr || ""), b = NUM.exec(str);
      if (o.count && a && b) {
        const from = +a[2].replace(/,/g, ""), to = +b[2].replace(/,/g, ""), dec = (b[2].split(".")[1] || "").length, dur = o.dur || 0.8;
        const sp = nv.querySelector ? nv.querySelector("tspan") || nv : nv;
        Loom.drive((e, raw) => { sp.textContent = raw >= 1 ? str : `${b[1]}${lerp(from, to, e).toFixed(dec)}${b[3]}`; }, t, dur, (u) => easeIO(u),
          { kind: "count", beat: A.meta("c").beat, name: `${A.id}.card.${p.id}`, content: true, key: `sccard:${A.id}:${p.id}:${t.toFixed(3)}` });
        end = t + dur;
      } else if (o.count) A.warn("sc_card_count", `card "${p.id}": "${p.valueStr}" to "${str}" is not a number to count; it cross-fades`);
      if (o.sub != null && p.subBox) {
        if (p.subNode) Loom.tween(p.subNode, { opacity: 1 }, { opacity: 0, duration: 0.14 }, t, A.meta("state", p.id));
        const ns = text(p.g, String(o.sub), p.subBox);
        Loom.tween(ns, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: Loom.ease.enter }, t + 0.1, A.meta("reveal", p.id));
        p.subNode = ns;
      }
      p.valueNode = nv; p.valueStr = str;
      A.reaction(p, t, end);
      return end;
    };

    // ---- the code editor
    const codeRG = (rid) => {
      const RG = A.regions[rid];
      if (!RG || !RG.code) throw new Error(`screencast app "${A.id}": "${rid}" is not a code region`);
      return RG;
    };
    const lineOf = (RG, n) => {
      const K0 = RG.code || RG.term, L = RG.code ? K0.lines[n - K0.start] : K0.lines[n - 1];
      if (!L) throw new Error(`screencast app "${A.id}": "${RG.id}" has no line ${n} (it has ${K0.lines.length}${RG.code ? `, from ${K0.start}` : ""})`);
      return L;
    };
    A.lineCount = (rid) => { const RG = A.regions[rid]; return RG && (RG.code || RG.term) ? (RG.code || RG.term).lines.length : 0; };
    // a diff marker on a line: "+" (added: a pos tint and a + in the gutter), "-" (removed: neg), null (none)
    A.codeMark = function (rid, n, mark, t) {
      const RG = codeRG(rid), K0 = RG.code, L = lineOf(RG, n);
      const m = mark === "add" || mark === "added" ? "+" : mark === "remove" || mark === "removed" || mark === "del" ? "-" : mark === "changed" || mark === "modified" ? "~" : mark;
      const make = (mm) => {
        if (L.marks[mm]) return L.marks[mm];
        // + added (a pos tint and a +), - removed (neg), ~ changed since the last save (an accent bar only, as editors mark it)
        const tn = mm === "+" ? "pos" : mm === "-" ? "neg" : "accent", mg = svg("g", { opacity: 0, class: "lm-sc-diff" }, null);
        L.back.insertBefore(mg, L.hl);
        if (mm !== "~") rect(mg, K0.x + K0.gw + 1.5, L.y, K0.w - K0.gw - 3, K0.lh, { r: 0, fill: mix("surface", tn, mm === "+" ? 0.12 : 0.1) });
        rect(mg, K0.x + K0.gw - 3, L.y + 3, 5, K0.lh - 6, { r: 2.5, fill: C(tn) });
        if (mm !== "~") monoText(mg, K0.markX - monoW(K0.size) / 2, L.base, [[mm, C(tn), 700]], K0.size, "diff_mark");
        L.marks[mm] = mg;
        return mg;
      };
      if (m != null && m !== "+" && m !== "-" && m !== "~") throw new Error(`screencast app "${A.id}": a diff mark is "+", "-", "~" or null (got ${JSON.stringify(mark)})`);
      const was = L.mark ? L.marks[L.mark] : null, now = m ? make(m) : null;
      if (t == null) { if (was) was.setAttribute("opacity", 0); if (now) now.setAttribute("opacity", 1); }
      else {
        if (was && was !== now) Loom.tween(was, { opacity: 1 }, { opacity: 0, duration: 0.16 }, t, A.meta("state", `${rid}.row.${n}`));
        if (now && now !== was) Loom.tween(now, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: Loom.ease.enter }, t, A.meta("state", `${rid}.row.${n}`));
      }
      L.mark = m || null;
      return t == null ? null : t + 0.2;
    };
    // the current-line highlight on a code or terminal line, from `at` (to `until`)
    A.highlight = function (rid, n, o) {
      o = o || {};
      const RG = A.regions[rid];
      if (!RG || !(RG.code || RG.term)) throw new Error(`screencast app "${A.id}": highlight() needs a code or terminal region ("${rid}")`);
      const L = lineOf(RG, n), t = o.at;
      const on = RG.code ? [L.hl, L.numOn] : [L.hl], off = RG.code ? [L.num] : [];
      if (!L.hlOn) {
        for (const nd of on) Loom.tween(nd, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: Loom.ease.enter }, t, A.meta("state", `${rid}.line.${n}`));
        for (const nd of off) Loom.tween(nd, { opacity: 1 }, { opacity: 0, duration: 0.18 }, t, A.meta("state", `${rid}.line.${n}`));
        L.hlOn = true;
      }
      if (o.until != null) {
        for (const nd of on) Loom.tween(nd, { opacity: 1 }, { opacity: 0, duration: 0.18 }, o.until, A.meta("state", `${rid}.line.${n}`));
        for (const nd of off) Loom.tween(nd, { opacity: 0 }, { opacity: 1, duration: 0.18 }, o.until, A.meta("state", `${rid}.line.${n}`));
        L.hlOn = false;
      }
      return t + 0.18;
    };
    // scroll a code or terminal region so line n sits `pos` of the way down its box (0.35 by default)
    A.scrollToLine = function (rid, n, o) {
      o = o || {};
      const RG = A.regions[rid], L = lineOf(RG, n), K0 = RG.code || RG.term;
      const t = o.at == null ? P.free + 0.2 : o.at, maxOff = Math.max(0, RG.body.content - RG.body.h);
      const to = clamp(L.y - RG.body.y - (RG.body.h - K0.lh) * (o.pos == null ? 0.35 : o.pos), 0, maxOff);
      return A.scroll(rid, to - scrollAt(rid, t), { at: t, dur: o.dur });
    };
    // type a line in the editor, character by character with a caret, from the characters it keeps (`keep`; by default the
    // part the old line and the new one share). {diff: "+"} marks it added as the typing starts. An empty line in the spec
    // ("") is where a new line is typed
    A.codeType = function (rid, n, str, o) {
      o = o || {};
      const RG = codeRG(rid), K0 = RG.code, L = lineOf(RG, n), s = String(str), old = L.text;
      let keep = o.keep;
      if (keep == null) { keep = 0; while (keep < old.length && keep < s.length && old[keep] === s[keep]) keep++; }
      keep = clamp(keep, 0, s.length);
      const t0 = o.at == null ? Math.max(P.free + 0.4, A.ctx.speechStart || 0) : o.at, cps = o.cps || cfg.type_cps;
      const typed = s.length - keep, dur = Math.max(0.25, typed / cps), hold = o.hold == null ? 0.6 : o.hold;
      // the new words in their own nodes (the drive owns them); the old line leaves under them as typing starts
      const wrap = svg("g", {}, L.g), inner = svg("g", { opacity: 0 }, wrap);
      const mt = monoText(inner, K0.cx0, L.base, tokenizeState(s, K0.lang, L.st)[0].map(([w, k]) => [w, K0.syn[k] || K0.syn.plain]), K0.size, "typed_code");
      const ch = K0.size * 1.25, caret = svg("rect", { x: f1(K0.cx0), y: f1(L.y + (K0.lh - ch) / 2), width: 2.5, height: f1(ch), fill: C("ink"), opacity: 0 }, inner);
      Loom.tween(L.cur, { opacity: 1 }, { opacity: 0, duration: 0.01 }, t0, A.meta("state", `${rid}.line.${n}`));
      const TT = cadence(s.slice(keep), dur, `${A.id}:code:${rid}:${n}:${t0.toFixed(3)}`);
      Loom.drive((e, raw) => {
        const now = t0 + raw * (dur + hold);
        const k = raw <= 0 ? keep : keep + Math.max(0, Math.min(typed, typedBy(TT, now - t0)));
        inner.setAttribute("opacity", raw > 0 ? 1 : 0);
        monoReveal(mt.spans, raw >= 1 ? s.length : k);
        caret.setAttribute("x", f1(K0.cx0 + k * K0.cw - 1));
        const typing = now <= t0 + dur, blink = Math.floor((now - t0) / 0.53) % 2 === 0;
        caret.setAttribute("opacity", raw <= 0 || raw >= 1 ? 0 : typing || blink ? 1 : 0);
      }, t0, dur + hold, "linear", { kind: "typewriter", beat: A.meta("t").beat, name: `${A.id}.code.${rid}.${n}`, content: true, key: `sccode:${A.id}:${rid}:${n}:${t0.toFixed(3)}` });
      for (let i = 0; i < typed; i += 3) if (s[keep + i] !== " " && Loom.sfx) Loom.sfx("key", t0 + (i ? TT[i - 1] : 0), { i, g: 0.35 });
      if (o.diff) A.codeMark(rid, n, o.diff, t0);
      L.cur = wrap; L.text = s;
      const lp = A.parts[`${rid}.line.${n}`]; lp.w = Math.max(lp.w, Math.max(6, s.length) * K0.cw + 16);
      monoReport(s, K0.size, { x: K0.cx0, y: L.y, w: K0.w - K0.gw, h: K0.lh });
      if (s.replace(/\s+$/, "").length > (K0.w - K0.gw - 40) / K0.cw) A.warn("sc_code_wide", `the typed line ${n} of "${rid}" is wider than the editor and is cut at its edge`);
      A.actions.push({ t0, t1: t0 + dur, what: `typing in ${rid} line ${n}` });
      A.reaction(A.parts[`${rid}.row.${n}`], t0, t0 + dur);
      P.free = Math.max(P.free, t0 + dur);
      return t0 + dur;
    };

    // ---- the terminal
    const termRG = (rid) => {
      const RG = A.regions[rid];
      if (!RG || !RG.term) throw new Error(`screencast app "${A.id}": "${rid}" is not a terminal region`);
      return RG;
    };
    // keep line i (0-based) in view at t: the body scrolls one line at a time as output arrives
    function termFollow(RG, i, t) {
      const need = A.termNeed(RG, i + 1);
      RG.body.content = Math.max(RG.body.content, need);
      const cur = scrollAt(RG.id, t), over = need - RG.body.h - cur;
      if (over > 0.5) A.scroll(RG.id, over, { at: t, dur: 0.12, wheel: false });
    }
    // a command: the prompt appears with a waiting caret, the command is typed at a person's pace, Enter. Returns when the
    // command is in (output follows with A.out)
    A.run = function (rid, cmd, o) {
      o = o || {};
      const RG = termRG(rid), K0 = RG.term, c = String(cmd);
      const t0 = o.at == null ? Math.max(P.free + 0.3, A.ctx.speechStart || 0) : o.at;
      const wait = o.wait == null ? 0.35 : o.wait, cps = o.cps || cfg.type_cps, dur = Math.max(0.25, c.length / cps);
      termFollow(RG, K0.lines.length, t0);
      const L = A.termLine(RG, rid, { cmd: "", prompt: o.prompt }, t0);
      const pcols = L.text.length;
      const inner = svg("g", {}, L.g);
      const mt = monoText(inner, K0.x0 + pcols * K0.cw, L.base, [[c, K0.T.text]], K0.size, "term_cmd");
      const caret = svg("rect", { x: f1(K0.x0 + pcols * K0.cw), y: f1(L.y + K0.lh * 0.14), width: f1(K0.cw), height: f1(K0.lh * 0.72), fill: K0.T.caret, opacity: 0 }, inner);
      const total = wait + dur + 0.2, TT = cadence(c, dur, `${A.id}:run:${rid}:${t0.toFixed(3)}`);
      Loom.drive((e, raw) => {
        const now = t0 + raw * total, u = (now - t0 - wait) / dur;
        const k = raw <= 0 ? 0 : raw >= 1 ? c.length : Math.max(0, Math.min(c.length, typedBy(TT, now - t0 - wait)));
        monoReveal(mt.spans, k);
        caret.setAttribute("x", f1(K0.x0 + (pcols + k) * K0.cw));
        const typing = u >= 0 && u <= 1, blink = Math.floor((now - t0) / 0.53) % 2 === 0;
        caret.setAttribute("opacity", raw <= 0 || raw >= 1 ? 0 : typing || blink ? 0.9 : 0);
      }, t0, total, "linear", { kind: "typewriter", beat: A.meta("r").beat, name: `${A.id}.run.${rid}`, content: true, key: `scrun:${A.id}:${rid}:${t0.toFixed(3)}` });
      for (let i = 0; i < c.length; i += 3) if (c[i] !== " " && Loom.sfx) Loom.sfx("key", t0 + wait + (i ? TT[i - 1] : 0), { i, g: 0.35 });
      if (Loom.sfx) Loom.sfx("key", t0 + wait + dur + 0.1, { g: 0.45 });
      L.text += c;
      const lp = A.parts[`${rid}.line.${L.n}`]; lp.w = Math.max(6, L.text.length) * K0.cw + 16;
      monoReport(c, K0.size, { x: K0.x0, y: L.y, w: K0.w, h: K0.lh });
      if (L.text.length > K0.cols) A.warn("sc_term_wide", `the command on terminal line ${L.n} of "${rid}" is ${L.text.length} characters with its prompt; ${K0.cols} fit`);
      A.actions.push({ t0: t0 + wait, t1: t0 + wait + dur, what: `typing in ${rid}` });
      P.free = Math.max(P.free, t0 + wait + dur);
      return t0 + wait + dur + 0.2;
    };
    // output lines stream in, one every `gap` seconds (a string, or {out, tone: ok|warn|error|muted|plain}); returns when
    // the last is in
    A.out = function (rid, lines, o) {
      o = o || {};
      const RG = termRG(rid), K0 = RG.term, arr = [].concat(lines);
      const t0 = o.at == null ? P.free + 0.15 : o.at, gap = o.gap == null ? 0.16 : o.gap;
      arr.forEach((ln, j) => { const ti = t0 + j * gap; termFollow(RG, K0.lines.length, ti); A.termLine(RG, rid, ln, ti); });
      const end = t0 + Math.max(0, arr.length - 1) * gap + 0.08;
      A.reaction(A.parts[rid], t0, end);
      return end;
    };

    // ---- a chart's series s moves to new values over dur (null: no point yet; a point that arrives grows from the last one)
    A.series = function (rid, si, values, t, o) {
      o = o || {};
      const RG = A.regions[rid];
      if (!RG || !RG.chart) throw new Error(`screencast app "${A.id}": "${rid}" is not a chart region`);
      const CH = RG.chart, s = CH.series[si];
      if (!s) throw new Error(`screencast app "${A.id}": chart "${rid}" has no series ${si} (it has ${CH.series.length})`);
      const to = Array.from({ length: CH.n }, (_, i) => (values[i] == null ? null : +values[i]));
      const from0 = s.cur.slice(), from = from0.map((v, i) => {
        if (v != null || to[i] == null) return v;
        for (let j = i - 1; j >= 0; j--) if (from0[j] != null) return from0[j];
        return to[i];
      });
      const out = to.filter((v) => v != null && (v > CH.max + 1e-9 || v < CH.min - 1e-9));
      if (out.length) A.warn("sc_chart_range", `chart "${rid}" gets ${out[0]}, outside its axis (${CH.min} to ${CH.max}): set its max (or min) in the spec`);
      const dur = o.dur || 0.6;
      Loom.drive((e) => {
        const v = to.map((q, i) => (q == null ? (e < 1 ? from0[i] : null) : lerp(from[i] == null ? q : from[i], q, e)));
        const vis = to.map((q, i) => (q == null ? (from0[i] == null ? 0 : 1 - e) : from0[i] == null ? e : 1));
        CH.draw(si, v, vis);
      }, t, dur, (u) => easeIO(u), { kind: "count", beat: A.meta("ch").beat, name: `${A.id}.chart.${rid}`, content: true, key: `scchart:${A.id}:${rid}:${si}` });
      s.cur = to;
      A.reaction(A.parts[rid], t, t + dur);
      return t + dur;
    };
  }

  // ================================================================ the teaching layer (accent2, visibly imposed)
  function teach(A) {
    const cfg = A.cfg;
    const hud = A.layers.hud;
    const part = A.part;
    // the size of the text a framing is read at: a code or terminal region's mono size, else the UI text size
    A.readPx = function (target) {
      const ids = Array.isArray(target) ? target : typeof target === "string" ? [target] : [];
      let px = Infinity;
      for (const id of ids) {
        const p = A.parts[id], rid = A.regions[id] ? id : p && p.region, RG = rid && A.regions[rid];
        px = Math.min(px, RG && RG.textPx ? RG.textPx : p && p.textPx ? p.textPx : cfg.ui_text);
      }
      return isFinite(px) ? px : cfg.ui_text;
    };
    // ---- the camera, by hand: frame a part (or parts, or a rect) and come back
    A.zoom = function (target, o) {
      o = o || {};
      const t = o.at == null ? A.pointerSched.free : o.at;
      const r = A.frameRect(target, t);
      const v = A.viewFor(r, { scale: o.scale, margin: o.margin, snap: o.snap });
      // checked whatever set the scale (an explicit `scale` too): the text the camera frames, at the scale it really gets
      const px = v.s * A.readPx(o.read || target);
      if (px < cfg.read_px - 0.5) A.warn("sc_zoom_small_text", `zoom on ${JSON.stringify(target).slice(0, 40)} reaches ${px.toFixed(0)} px text at ${v.s.toFixed(2)}x${o.scale ? ` (scale ${o.scale} asked)` : ""} (${cfg.read_px} px is the reading floor): frame less${o.scale ? ", or a larger scale" : ""}`);
      return A.camTo(v, t, o.dur || cfg.zoom_in_s, "zoom");
    };
    A.zoomOut = function (o) {
      o = o || {};
      const t = o.at == null ? Math.max(A.pointerSched.free, A.camSched.free) + 0.3 : o.at;
      return A.camTo({ s: 1, fx: VIEW.cx, fy: VIEW.cy }, t, o.dur || cfg.zoom_out_s, "zoom_out");
    };
    // ---- chapter pills (top left, above the window): where in the task we are
    A.chapters = function (labels, o) {
      o = o || {};
      const t = o.at == null ? A.t0 : o.at, g = svg("g", { opacity: 0, class: "lm-sc-chapters" }, hud);
      const size = 24, h = 46, y = 16;
      // a band of the page colour behind the pills: invisible at zoom 1 (the window starts below it), and when the camera
      // has zoomed it is the strip the pills sit on, so half-cut content never shows through between them (Chrome strip of
      // sc_lesson, 2026-10-16)
      if (o.band !== false) rect(g, 0, 0, 1920, y + h + 12, { r: 0, fill: C("field") });
      let x = o.x || A.win.x;
      const pills = labels.map((lab, i) => {
        const num = String(i + 1).padStart(2, "0"), w = textW(lab, "label", size, 600) + 84;
        const pg = svg("g", {}, g);
        const off = svg("g", {}, pg);
        rect(off, x, y, w, h, { r: h / 2, fill: C("surface"), stroke: A.tone.hair2, sw: 1.5 });
        text(off, num, { x: x + 14, y, w: 40, h, role: "label", size, weight: 700, color: "muted", tag: "chapter_num" });
        text(off, lab, { x: x + 54, y, w: w - 66, h, role: "label", size, weight: 600, color: "muted", tag: "chapter" });
        const on = svg("g", { opacity: 0 }, pg);
        rect(on, x, y, w, h, { r: h / 2, fill: C("accent2") });
        text(on, num, { x: x + 14, y, w: 40, h, role: "label", size, weight: 700, color: "onAccent", tag: "chapter_num" });
        text(on, lab, { x: x + 54, y, w: w - 66, h, role: "label", size, weight: 600, color: "onAccent", tag: "chapter_on" });
        const done = svg("g", { opacity: 0 }, pg);
        svg("circle", { cx: f1(x + 30), cy: f1(y + h / 2), r: 16, fill: C("pos") }, done);
        svg("path", { d: `M${f1(x + 23)} ${f1(y + h / 2)} L${f1(x + 28)} ${f1(y + h / 2 + 5)} L${f1(x + 37)} ${f1(y + h / 2 - 5)}`, fill: "none", stroke: C("onAccent"), "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, done);
        const P = { x, w, on, off, done };
        x += w + 10;
        return P;
      });
      if (x > 1920 - 40) A.warn("sc_chapters_wide", `the chapter pills are ${Math.round(x)} px wide: shorter chapter names (2 or 3 words)`);
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: Loom.ease.enter }, t, A.meta("reveal", "chapters"));
      let cur = -1;
      const H = { pills, g, right: x - 10 };
      H.go = function (i, when) {
        if (cur >= 0) {
          Loom.tween(pills[cur].on, { opacity: 1 }, { opacity: 0, duration: 0.25 }, when, A.meta("state", "chapter"));
          Loom.tween(pills[cur].done, { opacity: 0 }, { opacity: 1, duration: 0.25 }, when, A.meta("state", "chapter"));
        }
        Loom.tween(pills[i].on, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: Loom.ease.enter }, when, A.meta("reveal", "chapter"));
        cur = i;
        return when + 0.3;
      };
      H.hide = (when) => { Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.25 }, when, A.meta("exit", "chapters")); return when + 0.25; };
      if (o.active != null) H.go(o.active, t);
      A.chapterPills = H;
      return H;
    };
    // ---- a step pill (top right, above the window): "2 / 4" and what this step does
    A.step = function (label, o) {
      o = o || {};
      const t = o.at, size = 24, h = 46, y = 16;
      const badge = o.n != null ? `${o.n} / ${o.of}` : null;
      const bw = badge ? textW(badge, "label", size, 700) + 28 : 0;
      const w = Math.min(860, textW(label, "label", size, 600) + bw + 44), x = (o.right || A.win.x + A.win.w) - w;
      const g = svg("g", { opacity: 0, class: "lm-sc-step" }, hud);
      rect(g, x, y, w, h, { r: h / 2, fill: C("shadow") });
      // the badge is the pill's full height (its left cap): inset 4 px it left 38 px for a 24 px figure, 4.5 px above and
      // below its font box in Chrome where 6 is needed (tight_inset, stress test 2026-10-16)
      if (badge) { rect(g, x, y, bw, h, { r: h / 2, fill: C("accent2") }); text(g, badge, { x, y, w: bw, h, role: "label", size, weight: 700, color: "onAccent", align: "center", tag: "step_n" }); }
      text(g, label, { x: x + bw + 18, y, w: w - bw - 32, h, role: "label", size, weight: 600, color: "surface", tag: "step" });
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: Loom.ease.enter }, t, A.meta("reveal", "step"));
      Loom.drive((e) => g.setAttribute("transform", `translate(0 ${f1(-6 * (1 - e))})`), t, 0.25, (u) => easeOut(u), { kind: "reveal", beat: A.meta("s").beat, name: `${A.id}.step`, content: false, key: `scstep:${A.id}:${t.toFixed(3)}` });
      if (o.until != null) Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.2 }, o.until, A.meta("exit", "step"));
      A.overlay("step", label, t, o.until);
      return t + 0.25;
    };
    // ---- a callout: a dark card in screen space with a leader in the signal colour to the part; the leader's end follows the
    // camera (posed by the clock). 2 to 6 words: it names, it never repeats the narration
    A.callout = function (id, str, o) {
      o = o || {};
      const t = o.at, until = o.until == null ? t + Math.max(2.5, 0.6 + String(str).split(/\s+/).length * 0.4) : o.until;
      if (String(str).split(/\s+/).length > 8) A.warn("sc_callout_long", `callout "${String(str).slice(0, 40)}" has more than 8 words: a callout names, the narration explains`);
      const sr = A.projectRect(A.rectAt(id, t), t);
      const size = 26, padX = 22, lines = textW(str, "label", size, 600) > 420 ? 2 : 1;
      const w = Math.min(460, textW(str, "label", size, 600) / lines + 2 * padX + 6), h = lines * 36 + 30;
      const side = o.side || (sr.x + sr.w + 40 + w < 1880 ? "right" : sr.x - 40 - w > 40 ? "left" : sr.y - 40 - h > 70 ? "above" : "below");
      let x = side === "right" ? sr.x + sr.w + 56 : side === "left" ? sr.x - 56 - w : sr.x + sr.w / 2 - w / 2;
      let y = side === "above" ? sr.y - 48 - h : side === "below" ? sr.y + sr.h + 48 : sr.y + sr.h / 2 - h / 2;
      x = clamp(x, 28, 1892 - w); y = clamp(y, 76, 930 - h);
      const g = svg("g", { opacity: 0, class: "lm-sc-callout" }, hud);
      const lead = svg("path", { d: "", fill: "none", stroke: C("accent2"), "stroke-width": 3.5, "stroke-linecap": "round" }, g);
      const ring = svg("circle", { r: 9, fill: C("surface"), stroke: C("accent2"), "stroke-width": 3.5 }, g);
      const box = svg("g", {}, g);
      rect(box, x, y, w, h, { r: 12, fill: C("shadow") });
      rect(box, x, y, 6, h, { r: 3, fill: C("accent2") });
      K().text(box, str, { role: "label", size, x: x + padX, y: y + 12, w: w - 2 * padX, h: h - 24, maxLines: 2, weight: 600, color: "surface", valign: "middle" }).setAttribute("data-sc", "callout");
      const anchor = o.point || "edge";
      A.pins.push((tt) => {
        if (tt < t - 0.05 || tt > until + 0.3) return;
        const r = A.projectRect(A.rectAt(id, tt), tt);
        let ax, ay;
        if (anchor === "centre") { ax = r.x + r.w / 2; ay = r.y + r.h / 2; }
        else if (side === "right") { ax = r.x + r.w; ay = r.y + r.h / 2; } else if (side === "left") { ax = r.x; ay = r.y + r.h / 2; }
        else if (side === "above") { ax = r.x + r.w / 2; ay = r.y; } else { ax = r.x + r.w / 2; ay = r.y + r.h; }
        const bx = side === "right" ? x : side === "left" ? x + w : clamp(ax, x + 20, x + w - 20), by = side === "above" ? y + h : side === "below" ? y : y + h / 2;
        const mx = side === "right" || side === "left" ? (ax + bx) / 2 : bx, my = side === "right" || side === "left" ? by : (ay + by) / 2;
        lead.setAttribute("d", `M${f1(ax)} ${f1(ay)} Q${f1(mx)} ${f1(my)} ${f1(bx)} ${f1(by)}`);
        ring.setAttribute("cx", f1(ax)); ring.setAttribute("cy", f1(ay));
      });
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: Loom.ease.enter }, t, A.meta("reveal", "callout"));
      Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.2 }, until, A.meta("exit", "callout"));
      A.overlay("callout", str, t, until);
      return t + 0.25;
    };
    // ---- spotlight freeze: everything dims but the one result (an even-odd cut-out that follows the camera), a ring in the
    // signal colour, an optional label. The pointer holds still for its duration (a move inside it warns)
    A.spotlight = function (id, o) {
      o = o || {};
      const t = o.at, dur = o.dur || 2.2, pad = o.pad == null ? 14 : o.pad;
      const g = svg("g", { opacity: 0, class: "lm-sc-spotlight" }, hud);
      const dim = svg("path", { d: "", fill: C("shadow"), "fill-rule": "evenodd", opacity: 0.58 }, g);
      const edge = svg("rect", { fill: "none", stroke: C("accent2"), "stroke-width": 4, rx: 14 }, g);
      let lab = null, labW = 0, labH = 52;
      if (o.label) {
        labW = textW(o.label, "label", 26, 700) + 76;
        lab = svg("g", {}, g);
        rect(lab, 0, 0, labW, labH, { r: labH / 2, fill: C("accent2") });
        icon(lab, o.icon || "circle-check", 30, labH / 2, 24, "onAccent");
        text(lab, o.label, { x: 48, y: 0, w: labW - 60, h: labH, role: "label", size: 26, weight: 700, color: "onAccent", tag: "spotlight" });
      }
      A.pins.push((tt) => {
        if (tt < t - 0.05 || tt > t + dur + 0.6) return;
        const r = A.projectRect(A.rectAt(id, tt), tt);
        const x = r.x - pad, y = r.y - pad, w = r.w + 2 * pad, h = r.h + 2 * pad, rr = 14;
        dim.setAttribute("d", `M0 0 H1920 V1080 H0 Z M${f1(x + rr)} ${f1(y)} H${f1(x + w - rr)} Q${f1(x + w)} ${f1(y)} ${f1(x + w)} ${f1(y + rr)} V${f1(y + h - rr)} Q${f1(x + w)} ${f1(y + h)} ${f1(x + w - rr)} ${f1(y + h)} H${f1(x + rr)} Q${f1(x)} ${f1(y + h)} ${f1(x)} ${f1(y + h - rr)} V${f1(y + rr)} Q${f1(x)} ${f1(y)} ${f1(x + rr)} ${f1(y)} Z`);
        edge.setAttribute("x", f1(x)); edge.setAttribute("y", f1(y)); edge.setAttribute("width", f1(w)); edge.setAttribute("height", f1(h));
        if (lab) {
          const below = y + h + 18 + labH < 930;
          lab.setAttribute("transform", `translate(${f1(clamp(x + w / 2 - labW / 2, 24, 1896 - labW))} ${f1(below ? y + h + 18 : y - 18 - labH)})`);
        }
      });
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: Loom.ease.enter }, t, A.meta("reveal", "spotlight"));
      Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.35 }, t + dur, A.meta("exit", "spotlight"));
      for (const s of A.pointerSched.segs) if (s.t1 > t && s.t0 < t + dur) A.warn("sc_spotlight_moves", `the pointer moves during the spotlight on "${id}" (${t.toFixed(2)} to ${(t + dur).toFixed(2)} s): a freeze holds still`);
      A.pointerSched.free = Math.max(A.pointerSched.free, t + dur);
      A.actions.push({ t0: t, t1: t + dur, what: `the spotlight on ${id}` });
      if (o.label) A.overlay("spotlight", o.label, t, t + dur);
      return t + dur + 0.35;
    };
    // ---- time-lapse tag: the real wait is cut; the tag says how long it really takes (wait time is information)
    A.timelapse = function (o) {
      o = o || {};
      const t = o.at, dur = o.dur || 2, label = o.label || "", speed = o.speed || "";
      const g = svg("g", { opacity: 0, class: "lm-sc-timelapse" }, hud);
      const size = 24, h = 46, y = 16;
      const sw = speed ? textW(speed, "label", size, 700) + 24 : 0, lw = label ? textW(label, "label", size, 600) : 0;
      const w = 64 + sw + lw + 24, x = Math.max(960 - w / 2, (A.chapterPills ? A.chapterPills.right : 0) + 24);
      rect(g, x, y, w, h, { r: h / 2, fill: C("shadow") });
      const ff = svg("g", {}, g);
      icon(ff, "fast-forward", x + 32, y + h / 2, 24, "accent2");
      if (speed) text(g, speed, { x: x + 52, y, w: sw, h, role: "label", size, weight: 700, color: "surface", tag: "timelapse_speed" });
      if (label) text(g, label, { x: x + 56 + sw, y, w: lw + 8, h, role: "label", size, weight: 600, color: "surface", tag: "timelapse" });
      const bar = rect(g, x + 22, y + h - 6, 0.01, 3, { r: 1.5, fill: C("accent2") });
      Loom.drive((e, raw) => {
        bar.setAttribute("width", f1(Math.max(0.01, (w - 44) * e)));
        ff.setAttribute("opacity", raw > 0 && raw < 1 ? f3(0.55 + 0.45 * Math.abs(Math.cos(raw * dur * Math.PI * 1.5))) : 1);
      }, t, dur, "linear", { kind: "count", beat: A.meta("tl").beat, name: `${A.id}.timelapse`, content: true, key: `sctl:${A.id}:${t.toFixed(3)}` });
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: Loom.ease.enter }, t, A.meta("reveal", "timelapse"));
      Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.25 }, t + dur + 0.2, A.meta("exit", "timelapse"));
      A.overlay("timelapse", label || speed, t, t + dur + 0.2);
      return t + dur;
    };
    // ---- the tour: name a region (an outline in the signal colour and a numbered tag); the region named before shrinks to
    // its number, so the map stays and the eye goes to the new one. clearNames() takes them all away
    A.names = [];
    A.name = function (id, label, o) {
      o = o || {};
      const t = o.at, r = A.rectAt(id, t), n = o.n == null ? A.names.length + 1 : o.n, pad = o.pad == null ? 6 : o.pad, win = A.win;
      const g = svg("g", { opacity: 0, class: "lm-sc-name" }, A.layers.marks);
      const ox = r.x - pad, oy = r.y - pad, ow = r.w + 2 * pad, oh = r.h + 2 * pad;
      // the rest of the window recedes under a light wash while this region is named (the label sits on the wash)
      const veil = svg("path", { d: `M${win.x} ${A.appTop} H${win.x + win.w} V${win.y + win.h} H${win.x} Z M${f1(ox)} ${f1(oy)} V${f1(oy + oh)} H${f1(ox + ow)} V${f1(oy)} Z`,
        fill: C("surface"), "fill-rule": "evenodd", opacity: o.veil === false ? 0 : 0.5 }, g);
      const out = rect(g, ox, oy, ow, oh, { r: 14, fill: "none", stroke: C("accent2"), sw: 3.5 });
      const size = 26, th = 50, nw = 50;
      const lw = textW(label, "label", size, 700) + nw + 36;
      // the label goes OUTSIDE the region, where it covers only the receding wash: below, above, right, left, else inside
      const fits = (x, y) => x >= win.x + 8 && x + lw <= win.x + win.w - 8 && y >= A.appTop + 6 && y + th <= win.y + win.h - 8;
      const cx0 = clamp(ox, win.x + 8, win.x + win.w - lw - 8);
      const cands = { below: [cx0, oy + oh + 10], above: [cx0, oy - th - 10], right: [ox + ow + 14, oy + Math.min(10, oh / 2 - th / 2)], left: [ox - lw - 14, oy + Math.min(10, oh / 2 - th / 2)], inside: [cx0 + 8, oy + 10] };
      const order = o.tag ? [o.tag, "below", "above", "right", "left", "inside"] : ["below", "above", "right", "left", "inside"];
      let side = order.find((k) => cands[k] && fits(cands[k][0], cands[k][1])) || "inside";
      let [tx, ty] = cands[side];
      if (o.tagX != null) tx = o.tagX;
      if (o.tagY != null) ty = o.tagY;
      const tag = svg("g", {}, g);
      const full = svg("g", {}, tag);
      rect(full, tx, ty, lw, th, { r: th / 2, fill: C("accent2") });
      svg("circle", { cx: f1(tx + th / 2), cy: f1(ty + th / 2), r: th / 2 - 7, fill: C("surface") }, full);
      text(full, String(n), { x: tx + 7, y: ty, w: th - 14, h: th, role: "label", size: 24, weight: 700, color: "accent2", align: "center", tag: "name_n" });
      text(full, label, { x: tx + nw + 6, y: ty, w: lw - nw - 18, h: th, role: "label", size, weight: 700, color: "onAccent", tag: "name" });
      // what stays once the next region is named: the outline, faint, and the number on its corner
      const small = svg("g", { opacity: 0 }, g), br = 19, bx = ox + 4, by = oy + 4;
      svg("circle", { cx: f1(bx), cy: f1(by), r: br + 3, fill: C("surface") }, small);
      svg("circle", { cx: f1(bx), cy: f1(by), r: br, fill: C("accent2") }, small);
      text(small, String(n), { x: bx - br, y: by - br, w: 2 * br, h: 2 * br, size: 22, weight: 700, color: "onAccent", align: "center", tag: "name_n" });
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: Loom.ease.enter }, t, A.meta("reveal", "name." + id));
      const prev = A.names.filter((q) => !q.shrunk && !q.cleared);
      for (const q of prev) {
        Loom.tween(q.full, { opacity: 1 }, { opacity: 0, duration: 0.25 }, t, A.meta("state", "name"));
        Loom.tween(q.veil, { opacity: q.veilOp }, { opacity: 0, duration: 0.25 }, t, A.meta("state", "name"));
        Loom.tween(q.small, { opacity: 0 }, { opacity: 1, duration: 0.25 }, t, A.meta("state", "name"));
        Loom.tween(q.out, { opacity: 1 }, { opacity: 0.35, duration: 0.25 }, t, A.meta("state", "name"));
        q.shrunk = true;
        if (q.ov) q.ov.t1 = Math.min(q.ov.t1, t);         // a shrunk name is a badge, no longer an overlay to read
      }
      A.names.push({ g, full, small, out, veil, veilOp: o.veil === false ? 0 : 0.5, id, t, side, ov: A.overlay("name", label, t, null) });
      return t + 0.3;
    };
    A.clearNames = function (t) {
      for (const nm of A.names) if (!nm.cleared) { Loom.tween(nm.g, { opacity: 1 }, { opacity: 0, duration: 0.3 }, t, A.meta("exit", "names")); nm.cleared = true; if (nm.ov) nm.ov.t1 = Math.min(nm.ov.t1, t); }
      return t + 0.3;
    };
    // ---- rack focus without blur: the rest of the window recedes under a light wash, words still crisp
    A.focus = function (id, o) {
      o = o || {};
      const t = o.at, r = A.rectAt(id, t), win = A.win, pad = 8;
      const x = r.x - pad, y = r.y - pad, w = r.w + 2 * pad, h = r.h + 2 * pad;
      const g = svg("g", { opacity: 0, class: "lm-sc-focus" }, A.layers.veil);
      svg("path", { d: `M${win.x} ${A.appTop} H${win.x + win.w} V${win.y + win.h} H${win.x} Z M${f1(x)} ${f1(y)} V${f1(y + h)} H${f1(x + w)} V${f1(y)} Z`, fill: C("surface2"), "fill-rule": "evenodd", opacity: 0.68 }, g);
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: Loom.ease.enter }, t, A.meta("state", "focus"));
      if (o.until != null) Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.4 }, o.until, A.meta("state", "focus"));
      A.lastFocus = g;
      return t + 0.4;
    };
    A.unfocus = function (t) { if (A.lastFocus) Loom.tween(A.lastFocus, { opacity: 1 }, { opacity: 0, duration: 0.4 }, t, A.meta("state", "focus")); A.lastFocus = null; return t + 0.4; };
    // ---- a chapter card: the signpost between chapters, over the dimmed app
    A.chapterCard = function (title, o) {
      o = o || {};
      const t = o.at, dur = o.dur || 2.4;
      const g = svg("g", { opacity: 0, class: "lm-sc-chapter-card" }, hud);
      svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: C("field"), opacity: 0.86 }, g);
      const w = Math.min(1200, Math.max(720, textW(title, "title", 64, 700) + 160)), h = o.sub ? 300 : 240, x = 960 - w / 2, y = 470 - h / 2;
      const box = svg("g", {}, g);
      shadowRects(box, x, y, w, h, 24);
      rect(box, x, y, w, h, { r: 24, fill: C("surface") });
      rect(box, x, y + 36, 8, h - 72, { r: 4, fill: C("accent2") });
      if (o.kicker) K().kicker(box, o.kicker, { x: x + 64, y: y + 40, w: w - 128, h: 40, color: "accent2" });
      K().text(box, title, { role: "title", size: 64, x: x + 64, y: y + (o.kicker ? 84 : 60), w: w - 128, h: 100, maxLines: 1, valign: "middle" }).setAttribute("data-sc", "chapter_title");
      if (o.sub) K().text(box, o.sub, { role: "lead", size: 32, x: x + 64, y: y + 190, w: w - 128, h: 70, maxLines: 2, color: "muted" }).setAttribute("data-sc", "chapter_sub");
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: Loom.ease.enter }, t, A.meta("reveal", "chapter_card"));
      Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.35 }, t + dur, A.meta("exit", "chapter_card"));
      A.actions.push({ t0: t, t1: t + dur, what: "a chapter card" });
      return t + dur + 0.35;
    };
    A.tone = TONE();
  }

  // ---------------------------------------------------------------- a held app in a later beat: the same handle, this beat's ctx
  function resume(ctx, name) {
    const E = ctx.held ? ctx.held(name) : null;
    if (!E || !E.sc) throw new Error(`screencast: resume("${name}") found no held app (draw it with W.app in the beat before, on the same station, and keep it)`);
    E.sc.ctx = ctx;
    return E.sc;
  }

  // ---------------------------------------------------------------- the engine audit (boot calls it after every scene built)
  // ---------------------------------------------------------------- the engine audit (boot calls it after every scene built):
  // with every scene's schedule known, check what can only be checked whole
  const APPS = [];
  function audit() {
    const R = Loom.report || {};
    const out = { engine: "screencast", version: "1", apps: [] };
    for (const A of APPS) if (A.flushWeb) A.flushWeb();
    for (const A of APPS) {
      // action and reaction in tandem: a reaction the camera does not show is a reaction nobody sees (judged once the
      // camera has settled after it, so a camera that follows the reaction is fine)
      for (const q of A.reactions) {
        if (!q.p || !q.p.rectOk) continue;
        let t = q.t1;
        for (const m of A.camSched.moves) if (m.t0 <= t + 0.6 && m.t1 > t) t = m.t1;
        const r = A.projectRect(A.rectAt(q.p.id, t), t), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        if (cx < 0 || cx > 1920 || cy < 0 || cy > 1000) A.warn("sc_reaction_offscreen", `"${q.p.id}" changes at ${q.t0.toFixed(2)} s outside the camera's frame: zoom out, or frame it`);
      }
      const segs = A.pointerSched.segs, sm = smoothness(A);
      if (sm.cam_dv > JUMP_DV) A.warn("sc_jump", `the camera jumps at ${sm.cam_at.toFixed(2)} s: its screen velocity changes by ${Math.round(sm.cam_dv)} px/s in one frame (a smooth move stays under ${JUMP_DV})`);
      if (sm.ptr_dv > JUMP_DV) A.warn("sc_jump", `the pointer jumps at ${sm.ptr_at.toFixed(2)} s: its screen velocity changes by ${Math.round(sm.ptr_dv)} px/s in one frame (a smooth move stays under ${JUMP_DV})`);
      out.apps.push({ name: A.id, parts: Object.keys(A.parts).length, pointer_moves: segs.length, camera_moves: A.camSched.moves.length,
        reactions: A.reactions.length, max_zoom: Math.max(1, ...A.camSched.moves.map((m) => m.to.s)), smooth: sm, warnings: A.warnings.map((w) => w.code) });
    }
    crowding();
    byHand(out);
    R.screencast = out;
    return out;
  }

  // ---- the product is the app's, the pointer is the app's (D-190). st-sc-2fa b07 drew a "plain settings page" and its own
  // arrow over the held browser, b12 a backup-codes panel: hand-drawn layers that do not zoom, scroll or answer with the app,
  // and come and go on their own at the joins (the old page dropping out, two pointers, content rebuilt from nothing).
  // A beat that shows an app may not draw a second pointer, nor a product surface of its own over the app's window; the
  // teaching layer (callouts, pills, names, rings) is the app's own calls. Errors, sent to the beat's author.
  const SMALL = { text: 1, label: 1, tag: 1, mark: 1, icon: 1, token: 1, value: 1, chip: 1, bubble: 1, stamp: 1, connector: 1, chapter: 1, motif: 1 };
  function byHand(out) {
    const W = Loom.world;
    if (!W || !W.sceneRecs) return;
    const hits = [];
    for (const r of W.sceneRecs) {
      const apps = r.els.filter((E) => E.sc && E.outer && E.outer.isConnected);
      if (!apps.length) continue;
      const appEls = new Set(apps);
      const isPart = (E) => { for (let o = E.outer && E.outer.parentNode; o; o = o.parentNode) if (o.__E && appEls.has(o.__E)) return true; return false; };
      for (const E of r.els) {
        if (appEls.has(E) || (r.claimedFrom || []).includes(E) || !E.outer || isPart(E)) continue;
        if (/(^|_)(pointer|cursor|mouse|arrow_cursor)(_|$)/i.test(E.name)) {
          hits.push(E.name);
          Loom.error("sc_second_pointer", `${r.beat.id}: "${E.name}" is a pointer drawn by hand while the app "${apps[0].sc.id}" is on screen: ` +
            `the app's own pointer is the only one (A.pointer, A.move, A.click, A.type; it zooms and settles with the app). Remove it`, { beat: r.beat.id });
          continue;
        }
        if (SMALL[E.kind] || !(E.w > 0 && E.h > 0)) continue;
        for (const Ap of apps) {
          const w = Ap.sc.win, ix = Math.max(0, Math.min(E.x + E.w, w.x + w.w) - Math.max(E.x, w.x)), iy = Math.max(0, Math.min(E.y + E.h, w.y + w.h) - Math.max(E.y, w.y));
          const inside = (ix * iy) / (E.w * E.h), share = (E.w * E.h) / (w.w * w.h);
          if (inside >= 0.6 && share >= 0.12) {
            hits.push(E.name);
            Loom.error("sc_ui_by_hand", `${r.beat.id}: "${E.name}" (${E.kind}, ${Math.round(share * 100)} % of the window) is drawn by hand over the app ` +
              `"${Ap.sc.id}": the product's screens are the app's pages (spec.pages, A.go, A.dialog, A.cell, A.setValue), so they zoom, scroll and ` +
              `answer with it and stay put across joins. Move it into the app; teaching marks are A.callout, A.spotlight, A.chapters`, { beat: r.beat.id });
            break;
          }
        }
      }
    }
    out.by_hand = hits;
  }

  // ---- smoothness, measured: the camera (three points of the window on screen) and the pointer sampled at 60 fps over
  // the app's life; the largest change of screen velocity between two frames (px/s per frame) and the largest speed.
  // A snap shows as one frame's jump: a move of D px in a frame changes the velocity by D x 60. Eased moves, the spring
  // and the settle stay far under JUMP_DV (about 100 to 300 in the lab scenes)
  const JUMP_DV = 1500, FPS = 60;
  function smoothness(A) {
    const W = A.win, refs = [[W.x, W.y], [W.x + W.w, W.y + W.h], [W.x + W.w / 2, W.y + W.h / 2]];
    const ends = [A.t0 + 1].concat(A.camSched.moves.map((m) => m.t1), A.pointerSched.segs.map((q) => q.t1));
    let t1 = Math.max(...ends) + 1;
    if (A.E && A.E.exitT != null) t1 = Math.min(t1, A.E.exitT);
    const out = { cam_dv: 0, cam_at: 0, ptr_dv: 0, ptr_at: 0, cam_v: 0, ptr_v: 0, fps: FPS };
    let prevC = null, prevVC = null, prevP = null, prevVP = null;
    for (let i = Math.max(0, Math.floor(A.t0 * FPS)); i <= Math.ceil(t1 * FPS); i++) {
      const t = i / FPS;
      const cs = refs.map(([x, y]) => A.project(x, y, t));
      if (prevC) {
        const vs = cs.map((c, k) => ({ x: (c.x - prevC[k].x) * FPS, y: (c.y - prevC[k].y) * FPS }));
        for (const v of vs) out.cam_v = Math.max(out.cam_v, Math.hypot(v.x, v.y));
        if (prevVC) vs.forEach((v, k) => { const dv = Math.hypot(v.x - prevVC[k].x, v.y - prevVC[k].y); if (dv > out.cam_dv) { out.cam_dv = dv; out.cam_at = t; } });
        prevVC = vs;
      }
      prevC = cs;
      const q = A.pointerAt(t);
      if (q.vis < 0.5) { prevP = null; prevVP = null; continue; }
      const pp = A.project(q.p.x, q.p.y, t);
      if (prevP) {
        const v = { x: (pp.x - prevP.x) * FPS, y: (pp.y - prevP.y) * FPS };
        out.ptr_v = Math.max(out.ptr_v, Math.hypot(v.x, v.y));
        if (prevVP) { const dv = Math.hypot(v.x - prevVP.x, v.y - prevVP.y); if (dv > out.ptr_dv) { out.ptr_dv = dv; out.ptr_at = t; } }
        prevVP = v;
      }
      prevP = pp;
    }
    for (const k of ["cam_dv", "ptr_dv", "cam_v", "ptr_v"]) out[k] = Math.round(out[k]);
    out.cam_at = +out.cam_at.toFixed(2); out.ptr_at = +out.ptr_at.toFixed(2);
    return out;
  }

  // ---- overlays on screen at once, across every app (they share the screen): the guide allows a step pill plus one teaching
  // overlay (a callout, a region name, the HUD, a time-lapse tag, a spotlight label), and the product's own toast. One
  // warning per crowded stretch, naming what is on screen at its fullest
  function crowding() {
    const all = [];
    for (const A of APPS) for (const o of A.overlays || []) {
      const end = Math.min(o.t1, A.E && A.E.exitT != null ? A.E.exitT : Infinity);
      if (end > o.t0 + 0.05) all.push(Object.assign({ A, end }, o));
    }
    const times = Array.from(new Set(all.flatMap((o) => [o.t0 + 0.06, o.end + 0.06]).filter(isFinite).map((t) => +t.toFixed(3)))).sort((a, b) => a - b);
    const onAt = (t) => all.filter((q) => q.t0 <= t + 1e-6 && q.end > t + 0.05);
    const crowded = (on) => on.filter((q) => q.kind !== "toast").length > 2 || on.length > 3;
    let ep = null;
    const flush = () => {
      if (!ep) return;
      const on = ep.most, A = on.slice().sort((a, b) => b.t0 - a.t0)[0].A;
      A.warn("sc_overlays_crowded", `${on.length} overlays on screen at once from ${ep.t.toFixed(2)} s: ${on.map((q) => `${q.kind} "${q.label}"`).join(", ")}. The limit is a step pill plus one teaching overlay (a callout, a name, the HUD, a time-lapse tag), and the product's own toast: end one (until) before the next arrives`);
      ep = null;
    };
    for (const t of times) {
      const on = onAt(t);
      if (crowded(on)) { if (!ep) ep = { t: t - 0.06, most: on }; else if (on.length > ep.most.length) ep.most = on; }
      else flush();
    }
    flush();
  }

  Loom.engines.define("screencast", {
    version: "1",
    summary: "a living screencast: a generic app shell built from a compact spec (window or browser chrome, sidebar nav, top bar with search, page header and toolbar, tabs, tables, forms, settings, cards, detail, list, empty state, a code editor (mono, syntax colour, line numbers, diff markers, typing with a caret), a dark terminal (a prompt, commands typed, output streaming), a chart (line or bar series that update); dialogs, menus, toasts, tooltips), every region and control a named part; one performer per app (a pointer at a person's pace with hover, press, ring and click, typing with a caret, and a camera that frames the active region and returns, posed by one clock); system reactions (toggles, ticks, selection, cell and card updates, chart series, validation errors, page changes, scroll, progress); a teaching layer in the signal colour (keystroke HUD, chapter and step pills, callouts with leaders, spotlight freeze, time-lapse tag, region names for the tour, rack focus without blur, chapter cards)",
    api: { app, resume, audit, tokenize, tokenizeLines, smoothness: () => APPS.map((A) => Object.assign({ name: A.id }, smoothness(A))) },
  });
})();
