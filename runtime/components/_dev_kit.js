/* Loom dev kit: the shared parts of the developer components (Family A, hand-off sheet T-001 to T-018).
 *
 * Not a component: the helpers the dev_* components share, loaded before them (files starting with "_" load first;
 * it runs after _app_kit.js, whose mono text, measured UI text and motion helpers it uses). It solves, once:
 *   - code in the pack's mono face, a run per token, each run at its own column (Loom.appKit.mono), reported to the
 *     text checks like any other words;
 *   - a small tokenizer per language (keywords, strings, numbers, comments, function names, types, keys, flags, tags),
 *     no library at runtime; a comment opens only with the language's own marker;
 *   - colours that stay legible: a tone (pos, neg, accent...) on a dark or light body is mixed toward the body's text
 *     colour until it reads (contrast 4.5 or more), so a blue prompt on a near-black terminal is never lost;
 *   - a window frame with a title bar, drawn in the pack's shape language, or by the style's engine when the lesson has
 *     one and the component is animated: the whiteboard hand draws the outline, the blueprint pen drafts it;
 *   - words a person would write on a diagram (branch names, stage names) routed through the whiteboard or blueprint
 *     engine, so the board's two-face rule holds.
 * Colours are pack tokens (mixes of tokens for washes), fonts are pack roles. No words of its own.
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const K = () => Loom.kit;
  const AK = () => Loom.appKit;
  const svg = (t, a, p) => Loom.svg(t, a, p);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const DK = (Loom.devKit = {});
  DK.clamp = clamp; DK.f1 = f1;

  // ------------------------------------------------------------------ the style's engine, when the lesson has one
  /** {id, W, E} for the whiteboard, blueprint or screencast engine (E: the component's own element), or null.
   *  `engine: "off"` on the component, no engine in the style, or a component drawn into a parent group: null. */
  DK.engine = function (ctx, g, p) {
    if (p && p.engine === "off") return null;
    let eng = null;
    try { eng = Loom.engines && Loom.engines.current ? Loom.engines.current() : null; } catch (e) { eng = null; }
    if (!eng || !eng.api) return null;
    const el = g && g.closest ? g.closest("g.lm-el") : null, E = el && el.__E;
    if (!E || E.inner !== g) return null;
    return { id: eng.id, W: eng.api, E };
  };
  /** the whiteboard board or blueprint sheet of this scene, or null when the engine cannot give one */
  DK.pen = function (ctx, eng) {
    if (!eng) return null;
    try {
      if (eng.id === "whiteboard") return { kind: "wb", B: eng.W.board(ctx), W: eng.W };
      if (eng.id === "blueprint") return { kind: "bp", D: eng.W.sheet(ctx), W: eng.W };
    } catch (e) { Loom.warn("dev_engine", `the ${eng.id} engine could not be used here (${e && e.message}); drawn with the kit instead`); }
    return null;
  };

  // ------------------------------------------------------------------ colour
  DK.hex = (tok) => S().c(tok);
  DK.mix = (a, b, k) => S().mix(a.charAt(0) === "#" ? a : S().c(a), b.charAt(0) === "#" ? b : S().c(b), k);
  /** a tone that reads on bg: mixed toward `toward` (the body's text colour) until its contrast is 4.5 or more (WCAG AA) */
  DK.legible = function (tone, bg, toward, need) {
    let c = tone.charAt(0) === "#" ? tone : S().c(tone);
    const want = need || 4.5;
    for (let k = 0.15; k <= 1.001 && S().contrast(c, bg) < want; k += 0.15) c = S().mix(tone.charAt(0) === "#" ? tone : S().c(tone), toward, Math.min(1, k));
    return c;
  };
  /** the warning tone: accent2 (measures and warnings, the contract), except in screencast, where accent2 is the
   *  teaching layer's signal and the product's own warning is accent4 (the engine's terminal colours it so) */
  // which accent reads as a warning differs per pack (whiteboard's accent2 is a blue): the one closest to amber, never
  // the success or failure tone; in screencast accent2 is the teaching layer's signal, so the product's accent4
  const hueOf = (hex) => {
    const h = String(hex).replace("#", ""), r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return { h: 0, s: 0 };
    const hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: (hh * 60 + 360) % 360, s: d / (1 - Math.abs(mx + mn - 1) || 1) };
  };
  const warnCache = {};
  DK.warnTok = function () {
    const pk = S().pack || {}, id = pk.id || "";
    if (id === "screencast") return "accent4";
    if (warnCache[id]) return warnCache[id];
    const pal = pk.palette || {}, avoid = [pal.pos, pal.neg].map((x) => String(x || "").toLowerCase());
    const cands = ["accent2", "accent4", "accent", "accent3"].filter((t) => t in pal && !avoid.includes(String(pal[t]).toLowerCase()));
    const dist = (t) => { const q = hueOf(pal[t]); const dh = Math.min(Math.abs(q.h - 38), 360 - Math.abs(q.h - 38)); return dh + (q.s < 0.35 ? 90 : 0); };
    warnCache[id] = cands.sort((a, b) => dist(a) - dist(b))[0] || "accent2";
    return warnCache[id];
  };
  /** tokens for categories (lanes, segments, phases) that look distinct in this pack: packs give the same colour to
   *  two tokens (pos and accent4, neg and accent3), so a list that repeats a hex would give two lanes one colour */
  DK.tones = function (n) {
    const pal = (S().pack || {}).palette || {}, out = [], seen = [];
    const close = (a, b) => { const A = hueOf(a), B = hueOf(b); return Math.min(Math.abs(A.h - B.h), 360 - Math.abs(A.h - B.h)) < 14 && Math.abs(A.s - B.s) < 0.25; };
    for (const t of ["accent", "accent3", "pos", DK.warnTok(), "accent2", "accent4", "neg"]) {
      if (!(t in pal) || out.includes(t)) continue;
      const hex = String(pal[t]).toLowerCase();
      if (seen.some((h) => h === hex || close(h, hex))) continue;
      out.push(t); seen.push(hex);
    }
    out.push("muted");
    return n ? Array.from({ length: n }, (_, i) => out[i % out.length]) : out;
  };
  /** the body of a code surface. scheme: "dark" (the pack's darkest neutral), "light" (surface) or "pack" (surface2).
   *  In the outlined styles (line, sketch) a solid dark block would bury the line work, so every scheme is the pack's. */
  DK.scheme = function (scheme) {
    const outlined = S().outlined && S().outlined();
    const sc = outlined ? "pack" : scheme || "pack";
    const bg = sc === "dark" ? S().c(AK().darkTok()) : sc === "light" ? S().c("surface") : S().c("surface2");
    const textTok = AK().onHex(bg), text = S().c(textTok);
    const muted = DK.legible(S().mix(text, bg, 0.42), bg, text, 3.2);
    const L = (tok) => DK.legible(tok, bg, text);
    return {
      scheme: sc, bg, text, textTok, muted, rule: S().mix(text, bg, 0.82), wash: S().mix(text, bg, 0.92),
      accent: L("accent"), ok: L("pos"), err: L("neg"), warn: L(DK.warnTok()), L,
      band: (tok, k) => S().mix(bg, S().c(tok), k == null ? 0.14 : k),
    };
  };

  // ------------------------------------------------------------------ sizes
  /** the code size: `size` asked, never under the pack's caption floor (20 to 24 px) */
  DK.codeSize = (size) => Math.max(size || 24, ((S().pack.type || {}).caption || [20])[0]);
  DK.codeLH = (size) => Math.ceil(Math.max(size * 1.45, AK().lineH(size, "mono")));
  /** UI sizes from the pack's roles (caption for UI text, label for headings), as the app shells use them */
  DK.ui = function () { const T = AK().theme({}); return { T, Z: AK().sizes(T) }; };
  /** the height of a pane's title bar (the same number size() and build() use) */
  DK.barH = () => Math.max(52, DK.ui().Z.lhS + 18);

  /** how far a word's first glyph reaches left of its origin (a handwriting "j"), in px: left-aligned text is moved that
   *  much right so its drawn box stays inside the box it was given */
  let c2d = null;
  DK.leftHang = function (str, role, size, weight) {
    try {
      if (!c2d) c2d = document.createElement("canvas").getContext("2d");
      const f = S().font(role || "caption"), w = S().loadedWeight ? S().loadedWeight(f.family, +(weight || 400)) : weight || 400;
      c2d.font = `${w} ${size}px "${f.family}"`;
      const m = c2d.measureText(String(str));
      return Math.max(0, Math.ceil((m.actualBoundingBoxLeft || 0) + 0.5));
    } catch (e) { return 0; }
  };

  /** one line of left-aligned UI text whose first glyph may hang left of its origin: when it does, the box hugs the word
   *  and the word is centred in it, so the overhang stays inside the box (the text checks measure the drawn glyphs). The
   *  box starts hang + 3 left of x so the word's origin stays at x: a column of words keeps one left edge whatever their
   *  first letters (it had drifted right by the hang, "Tomas" and "Yuki" sat in from "Mara" in dev_db_table) */
  DK.textL = function (g, str, o) {
    const role = o.role || "caption", size = o.size, wt = o.weight || 400, s = String(str);
    const hang = DK.leftHang(s, role, size, wt) + 1;
    const adv = AK().measure(s, role, size, wt);
    if (hang <= 1 || adv + 2 * hang + 6 > o.w) return AK().T(g, s, o);
    return AK().T(g, s, Object.assign({}, o, { w: adv + 2 * hang + 6, x: (o.x || 0) - hang - 3, align: "center" }));
  };

  // ------------------------------------------------------------------ the tokenizer
  const KW = {
    js: "const let var function return if else for while do switch case break continue new class extends import from export default async await try catch finally throw typeof instanceof in of this null undefined true false yield delete void super static get set",
    py: "def return if elif else for while in not and or import from as class try except finally raise with lambda yield None True False pass break continue async await is global nonlocal assert del",
    go: "func return if else for range package import var const type struct interface map chan go defer select case switch nil true false break continue default fallthrough",
    java: "public private protected class interface extends implements static final void return if else for while do switch case break continue new try catch finally throw throws import package this super null true false int long double float boolean char byte short var record enum abstract synchronized",
    sql: "select from where and or not insert into values update set delete create table alter drop index join left right inner outer full on group by order having limit offset as null is in like between distinct union all case when then else end primary key foreign references default exists asc desc count sum avg min max",
    bash: "if then else elif fi for do done while until case esac function export echo cd sudo local return in exit source set unset readonly",
    yaml: "true false null yes no on off",
    css: "important inherit initial none auto",
  };
  KW.ts = KW.js + " interface type enum implements readonly private public protected declare namespace abstract as keyof never unknown any number string boolean";
  KW.sh = KW.bash;
  const kwSet = {};
  for (const k in KW) kwSet[k] = new Set(KW[k].split(" ").concat(k === "sql" ? KW[k].toUpperCase().split(" ") : []));
  const COMMENT = { js: "\\/\\/.*$", ts: "\\/\\/.*$", go: "\\/\\/.*$", java: "\\/\\/.*$", css: "\\/\\*.*?(\\*\\/|$)", py: "#.*$", yaml: "#.*$", bash: "#.*$", sh: "#.*$", sql: "--.*$", html: "<!--.*?(-->|$)" };
  DK.LANGS = ["js", "ts", "py", "go", "java", "sql", "yaml", "json", "bash", "sh", "html", "css", "text"];
  /** a line into [[text, kind]] runs. kinds: plain, punct, keyword, string, number, comment, fn, type, key, flag, tag, attr */
  DK.tokenize = function (s, lang) {
    s = String(s == null ? "" : s);
    lang = lang === "sh" ? "bash" : lang;
    const out = [], push = (t, k) => { if (t) out.push([t, k]); };
    if (lang === "text" || !lang) { push(s, "plain"); return out; }
    if (lang === "yaml") {
      const m = s.match(/^(\s*(?:-\s+)?)([\w.\/-]+)(:)(\s.*|$)/);
      if (m && !/^\s*#/.test(s)) { push(m[1], "punct"); push(m[2], "key"); push(m[3], "punct"); s = m[4]; }
    }
    if (lang === "html") {
      const re = /(<!--.*?(?:-->|$))|(<\/?)([\w-]+)|([\w-]+)(=)("[^"]*"|'[^']*')|(\/?>)|([^<>\s=]+)|(\s+)|(.)/g;
      let m, inTag = false;
      while ((m = re.exec(s))) {
        if (m[1]) push(m[1], "comment");
        else if (m[2]) { push(m[2], "punct"); push(m[3], "tag"); inTag = true; }
        else if (m[4] && inTag) { push(m[4], "attr"); push(m[5], "punct"); push(m[6], "string"); }
        else if (m[4]) { push(m[4] + m[5] + m[6], "plain"); }
        else if (m[7]) { push(m[7], "punct"); inTag = false; }
        else if (m[8]) push(m[8], inTag ? "attr" : "plain");
        else if (m[9]) push(m[9], "plain");
        else push(m[10], "punct");
      }
      return out;
    }
    if (lang === "css") {
      const re = /(\/\*.*?(?:\*\/|$))|(^\s*[.#]?[\w-]+(?=[^:]*\{))|([\w-]+)(?=\s*:)|("[^"]*"|'[^']*')|(#[0-9a-fA-F]{3,8}\b|-?\d[\d.]*(?:px|em|rem|%|s|ms|vh|vw)?)|([\w-]+)|(\s+)|(.)/g;
      let m;
      while ((m = re.exec(s))) {
        if (m[1]) push(m[1], "comment");
        else if (m[2]) push(m[2], "tag");
        else if (m[3]) push(m[3], "key");
        else if (m[4]) push(m[4], "string");
        else if (m[5]) push(m[5], "number");
        else if (m[6]) push(m[6], kwSet.css.has(m[6]) ? "keyword" : "plain");
        else if (m[7]) push(m[7], "plain");
        else push(m[8], "punct");
      }
      return out;
    }
    const kws = kwSet[lang] || new Set();
    const cm = COMMENT[lang] || "(?!)";
    const re = new RegExp("(" + cm + ")|(\"(?:[^\"\\\\]|\\\\.)*\"?|'(?:[^'\\\\]|\\\\.)*'?|`[^`]*`?)|(\\b0x[0-9a-fA-F]+\\b|\\b\\d[\\d_.]*[a-zA-Z%]*\\b)|(--?[A-Za-z][\\w-]*)|([A-Za-z_$@][\\w$]*)|(\\s+)|(.)", "g");
    let m;
    while ((m = re.exec(s))) {
      if (m[1]) { push(m[1], "comment"); break; }
      else if (m[2]) push(m[2], lang === "json" && /^\s*:/.test(s.slice(re.lastIndex)) ? "key" : "string");
      else if (m[3]) push(m[3], "number");
      else if (m[4]) {
        // a flag in a shell line; elsewhere a minus and a word (a - b, --i)
        if (lang === "bash") push(m[4], "flag");
        else { const k = m[4].match(/^-+/)[0]; push(k, "punct"); re.lastIndex -= m[4].length - k.length; }
      }
      else if (m[5]) {
        const w = m[5], next = s.slice(re.lastIndex);
        push(w, kws.has(w) || (lang === "sql" && kws.has(w.toLowerCase())) ? "keyword"
          : /^\s*\(/.test(next) ? "fn"
          : lang === "json" || lang === "bash" || lang === "sql" ? "plain"
          : /^[A-Z][a-z0-9]/.test(w) ? "type" : "plain");
      }
      else if (m[6]) push(m[6], "plain");
      else push(m[7], "punct");
    }
    return out;
  };
  /** the syntax colours: token kind -> pack token (the hand-off sheet's defaults; `colors` overrides any kind) */
  DK.SYN_DEFAULT = { keyword: "accent", string: "accent4", number: "accent2", comment: "muted", fn: "accent3", type: "ink", punct: "muted",
    key: "accent", flag: "accent3", tag: "accent", attr: "accent3", plain: "ink" };
  /** kind -> computed colour, legible on bg. colors: {kind: token} (unknown tokens are reported and ignored) */
  DK.syntax = function (colors, bg, text) {
    const pal = S().pack.palette, out = {};
    const want = Object.assign({}, DK.SYN_DEFAULT, colors || {});
    for (const [k, tok] of Object.entries(want)) {
      const t = tok in pal ? tok : DK.SYN_DEFAULT[k] || "ink";
      if (!(tok in pal)) Loom.error("component_params", `colors.${k} = "${tok}" is not a style token`);
      out[k] = t === "ink" ? text : t === "muted" ? DK.legible(S().mix(text, bg, 0.42), bg, text, 3.2) : DK.legible(t, bg, text);
      // a default colour that is nearly grey in this pack (corporate-clean's accent3) would read as faded, like
      // punctuation: function names and flags then take the text colour
      if (!(colors && colors[k]) && (k === "fn" || k === "flag" || k === "attr") && hueOf(pal[t] || "#000000").s < 0.3) out[k] = text;
    }
    return out;
  };
  /** a line as [[text, colour]] runs for AK.mono */
  DK.runs = (s, lang, SYN) => DK.tokenize(s, lang).map(([t, k]) => [t, SYN[k] || SYN.plain]);

  // ------------------------------------------------------------------ the window frame
  /** a framed pane with a title bar (three neutral dots and a title), the body below.
   *  o: {title, barH, r, bodyFill (computed), barFill (computed), dots, at, eng: DK.engine(...), name, ctx}
   *  Returns {g, frame, bar, title, body: {x, y, w, h}, end (when the frame is complete), drawn: "kit" | "wb" | "bp"} */
  DK.frame = function (ctx, g, w, h, o) {
    o = o || {};
    const { Z } = DK.ui();
    const barH = o.barH == null ? DK.barH() : o.barH;
    const R = o.r == null ? Math.max(6, Math.min(14, (S().pack.shape || {}).radius || 8) + 2) : o.r;
    const fg = svg("g", { class: "lm-dev-frame" }, g);
    const P = o.at != null && o.at >= 0 ? DK.pen(ctx, o.eng) : null;
    const res = { g: fg, barH, R, body: { x: 0, y: barH, w, h: h - barH }, end: o.at != null && o.at >= 0 ? o.at + 0.3 : -1, drawn: "kit" };
    const outlined = S().outlined && S().outlined();
    if (!P) {
      // the kit draws the frame in the pack's shape language (sketch, line, toon, gloss...), then the body and the bar
      K().rect(fg, 0, 0, w, h, { fill: "surface", r: R, stroke: "line", sw: 1.5, shadow: true });
      // the body follows the frame's rounded bottom corners (a square body poked out of them on a dark terminal)
      if (!outlined) svg("path", { d: `M1 ${barH} L${w - 1} ${barH} L${w - 1} ${h - R} Q${w - 1} ${h - 1} ${w - R} ${h - 1} L${R} ${h - 1} Q1 ${h - 1} 1 ${h - R} Z`, fill: o.bodyFill || S().c("surface") }, fg);
      if (!outlined) svg("path", { d: `M1 ${barH} L1 ${R} Q1 1 ${R} 1 L${w - R} 1 Q${w - 1} 1 ${w - 1} ${R} L${w - 1} ${barH} Z`, fill: o.barFill || S().mix(S().c("surface2"), S().c("field2"), 0.5) }, fg);
      if (!outlined && o.bodyFill) svg("path", { d: `M1 ${h - R} Q1 ${h - 1} ${R} ${h - 1} L${w - R} ${h - 1} Q${w - 1} ${h - 1} ${w - 1} ${h - R} L${w - 1} ${barH} L1 ${barH} Z`, fill: o.bodyFill }, fg);
      if (outlined) K().line(fg, 0, barH, w, barH, { stroke: "line", sw: 1.5 });
      else svg("rect", { x: 1, y: barH - 1, width: w - 2, height: 1.5, fill: S().mix(S().c("surface"), S().c("line"), 0.5) }, fg);
      if (o.dots !== false) [0, 1, 2].forEach((i) => {
        if (outlined) K().disc(fg, 28 + i * 24, barH / 2, 7, { fill: "none", stroke: "muted", sw: 2 });
        else svg("circle", { cx: 28 + i * 24, cy: barH / 2, r: 7, fill: S().mix(S().c("field2"), S().c("line"), 0.4) }, fg);
      });
      if (o.at != null && o.at >= 0) AK().show(fg, o.at, 0.3);
    } else {
      // the engine draws the outline, the bar rule and the dots as marks on its pen; the paper under them shows at once
      const E = o.eng.E, W = P.W;
      svg("rect", { x: 0, y: 0, width: w, height: h, rx: R, fill: o.bodyFill || S().c("surface"), opacity: 0 }, fg);
      AK().show(fg, o.at, 0.2);
      const marks = [].concat(W.roundRect(0, 0, w, h, R), W.line(0, barH, w, barH));
      if (o.dots !== false) [0, 1, 2].forEach((i) => { marks.push(...[].concat(W.circle(28 + i * 24, barH / 2, 6))); });
      const dur = clamp(0.5 + (w + h) / 2600, 0.6, 1.3);
      try { res.end = P.kind === "wb" ? P.B.draw(E, marks, { at: o.at, dur }) : P.D.draw(E, marks, { at: o.at, dur }); res.drawn = P.kind; }
      catch (e) { Loom.warn("dev_engine", `frame not drawn by the engine (${e && e.message})`); }
    }
    if (o.title) {
      const tg = svg("g", {}, g);
      res.title = DK.word(ctx, tg, o.title, { x: 116, y: 0, w: w - 232, h: barH, size: Z.small, weight: 600, color: "muted", align: "center", at: res.end >= 0 ? res.end - 0.1 : -1, eng: o.eng, pen: P, name: (o.name || "pane") + "_title", kind: "label" });
    }
    res.bar = { x: 0, y: 0, w, h: barH };
    return res;
  };

  // ------------------------------------------------------------------ a word a person would write
  /** one line of words at (x, y, w, h). In the whiteboard engine the hand writes it, in the blueprint engine the pen
   *  letters it (each into its own small element, so the board's face rule and the sheet's lettering hold); else the
   *  kit draws it (measured, cut at a word boundary), revealed at `at` (-1: there from the start).
   *  o: {x, y, w, h, size, weight, color (token), fill (computed), align, at, eng, pen, name, kind, role} */
  DK.word = function (ctx, g, str, o) {
    o = o || {};
    const P = o.pen === undefined ? DK.pen(ctx, o.eng) : o.pen;
    if (P && o.eng && o.eng.E && ctx.el) {
      try {
        const E = o.eng.E;
        const ox = (o.ox || 0), oy = (o.oy || 0);
        const role = o.role || "caption";
        // the hand's and the pen's lettering is wider than the face the kit measures: choose a box the engine says fits
        // (as given; wider where the row has room; two lines; both), measured with the engine's own text layout
        let bx = o.x || 0, bw = o.w, bh = o.h, ml = o.maxLines || 1;
        const fits = (w, h, m) => { try { return o.eng.W.text(String(str), { x: 0, y: 0, w, h, role, maxLines: m }).fits; } catch (e) { return true; } };
        const room = o.room == null ? 0 : o.room;   // extra width only where the caller says the row has it
        const tries = [[o.w, o.h, ml], [o.w + room, o.h, ml], [o.w, Math.max(o.h, o.h * 1.9), Math.max(2, ml)], [o.w + room, Math.max(o.h, o.h * 1.9), Math.max(2, ml)],
          [o.w, o.h * (ml + 1) / ml + 4, ml + 1], [o.w, o.h * (ml + 2) / ml + 8, ml + 2]];
        for (const [w, h, m] of tries) { if (fits(w, h, m)) { bw = w; bh = h; ml = m; break; } }
        if (bw > o.w && o.align === "right") bx -= bw - o.w;
        if (bh > o.h + 1) Loom.warn("dev_engine_box", `"${String(str).slice(0, 30)}" is lettered on two lines by the ${o.eng.id} engine (its hand is wider than the box)`);
        const sub = ctx.el(`${E.name}.${o.name || "word"}`, { parent: o.parentG || E.inner, x: ox + bx, y: oy + (o.y || 0), w: bw, h: bh, kind: o.kind || "label" });
        // one hand (one pen): each word starts when the last one ended, never earlier than asked
        const at = Math.max(o.at != null && o.at >= 0 ? o.at : ctx.start || 0, P.free == null ? -1 : P.free + 0.05);
        const opt = { role, align: o.align || "left", valign: o.valign || "middle", maxLines: ml, at, pen: o.tone || "ink" };
        if (o.by != null) opt.by = o.by;
        // a still: written quickly as the beat begins, but at a pace a hand can keep (about 22 characters a second, and
        // never under 0.3 s: the engines' window checks ask 0.08 s x sqrt(strokes) for the hand, 0.06 s for the pen, and
        // a 7-letter word at 0.03 s a letter sat just under, wb_window_tight on "gateway", 2026-10-16)
        else if (!(o.at != null && o.at >= 0)) opt.dur = Math.max(0.3, String(str).length * 0.045);
        if (P.kind === "bp") opt.quick = true;
        const end = P.kind === "wb" ? P.B.write(sub, String(str), opt) : P.D.letter(sub, String(str), opt);
        P.free = Math.max(P.free == null ? -1 : P.free, end);
        return { engine: P.kind, el: sub, end };
      } catch (e) { Loom.warn("dev_engine", `"${String(str).slice(0, 30)}" not written by the engine (${e && e.message}); set with the kit`); }
    }
    const t = o.maxLines > 1
      ? DK.para(g, str, o)
      : AK().T(g, str, { x: o.x, y: o.y, w: o.w, h: o.h, size: o.size, weight: o.weight, color: o.color || "ink", fill: o.fill, align: o.align, role: o.role || "caption" });
    // a word with no room at all is dropped by the kit (never cut to letters): say so, so a lost label is never silent
    if (String(str).trim() && t && !(t.textContent || "").trim()) Loom.warn("dev_word_dropped", `"${String(str).slice(0, 40)}" has no room in its ${Math.round(o.w)} px box and is not drawn (widen the component or shorten it)`);
    if (t && o.at != null && o.at >= 0) AK().show(t, o.at, 0.25);
    return t;
  };

  /** marks drawn on the engine's pen into the component's own element (E-local px): marks(W) returns them. Returns the
   *  time the pen finishes, or null when there is no pen (then the caller draws with the kit) */
  DK.penDraw = function (pen, eng, marks, o) {
    if (!pen || !eng || !eng.E) return null;
    try {
      const list = [].concat(marks(pen.W) || []);
      const opt = Object.assign({}, o);
      if (pen.free != null && opt.at != null) opt.at = Math.max(opt.at, pen.free + 0.05);
      const end = pen.kind === "wb" ? pen.B.draw(eng.E, list, opt) : pen.D.draw(eng.E, list, opt);
      pen.free = Math.max(pen.free == null ? -1 : pen.free, end);
      return end;
    } catch (e) { Loom.warn("dev_engine", `not drawn by the engine (${e && e.message}); drawn with the kit`); return null; }
  };

  /** fade out a word DK.word drew (a kit <text>, or the element the engine wrote it in) at t */
  DK.fadeOut = function (w, t, dur) {
    if (!w) return t;
    const node = w.el ? w.el.inner : w.nodeType ? w : null;
    if (!node) return t;
    Loom.tween(node, { opacity: 1 }, { opacity: 0, duration: dur || 0.2 }, t, DK.meta("state", "dev.word"));
    return t + (dur || 0.2);
  };
  /** a value that changes: the old word leaves and the new one is written (by the engine) or fades in (the kit) at t.
   *  holder: {w} as returned by DK.word; o as for DK.word. Returns the new word. */
  DK.swapWord = function (ctx, g, holder, str, o, t) {
    DK.fadeOut(holder.w, t);
    const nw = DK.word(ctx, g, str, Object.assign({}, o, { at: t + 0.15, name: (o.name || "word") + "_" + Math.round(t * 100) }));
    holder.w = nw;
    return nw;
  };

  /** a clamped paragraph drawn line by line: the lines appKit.clampText chose, each set on its own (one wrap, so the
   *  ellipsised last line can never re-wrap to one line more). Returns a <g> standing for the paragraph. */
  DK.para = function (g, str, o) {
    const role = o.role || "caption", size = o.size || S().size(role, 21), wt = o.weight || 400;
    const c = AK().clampText(String(str), { role, size, w: o.w, maxLines: o.maxLines || 3, weight: wt });
    const pg = Loom.svg("g", {}, g), lh = size * 1.36;
    c.lines.forEach((ln, i) => {
      const t = K().text(pg, ln, { role, size, x: o.x || 0, y: (o.y || 0) + i * lh, w: o.w, h: AK().lineH(size, role, wt), maxLines: 1, valign: "top", align: o.align || "left", weight: wt, color: o.color || "ink" });
      if (o.fill) t.setAttribute("fill", o.fill);
    });
    pg.__h = c.h; pg.__cut = c.cut;
    return pg;
  };

  // ------------------------------------------------------------------ code lines
  /** one code line at (x, y) in a line box lh, coloured by the tokenizer. o: {size, lh, w (cut at a word), lang, SYN,
   *  fill (one colour for the whole line), weight}. Returns AK.mono's result ({t, spans, cols, colX, base, cw}) or null */
  DK.code = function (g, str, o) {
    const s = String(str == null ? "" : str).replace(/\t/g, "    ");
    if (!s.trim()) return null;
    const segs = o.fill ? [[s, o.fill, o.weight]] : DK.runs(s, o.lang || "text", o.SYN);
    return AK().mono(g, segs, { x: o.x || 0, y: o.y || 0, h: o.lh, size: o.size, w: o.w });
  };
  /** wrap a code line into rows of at most `cols` characters, breaking after a space when one is near (indent kept) */
  DK.wrapCols = function (s, cols) {
    s = String(s == null ? "" : s);
    if (cols < 8 || s.length <= cols) return [s];
    const ind = s.match(/^\s*/)[0].slice(0, Math.floor(cols / 3)), out = [];
    let rest = s;
    while (rest.length > cols) {
      let cut = rest.lastIndexOf(" ", cols);
      if (cut < cols * 0.5) cut = cols;
      out.push(rest.slice(0, cut));
      rest = ind + rest.slice(cut).replace(/^\s+/, "");
      if (out.length > 200) break;
    }
    out.push(rest);
    return out;
  };
  /** a line tokenized whole, then wrapped into rows of runs (so a string that wraps keeps its colour on every row):
   *  [[[text, colour], ...], ...]. Rows break where DK.wrapCols breaks; continuation rows keep the line's indent. */
  DK.wrapRuns = function (s, lang, SYN, cols) {
    s = String(s == null ? "" : s).replace(/\t/g, "    ");
    const rows = DK.wrapCols(s, cols);
    const runs = DK.runs(s, lang, SYN);
    if (rows.length === 1) return [runs];
    // the character offsets each row takes from the line (continuation rows add the indent, drop leading spaces)
    const ind = s.match(/^\s*/)[0].slice(0, Math.floor(cols / 3));
    const colourAt = []; for (const [t, c] of runs) for (let i = 0; i < t.length; i++) colourAt.push(c);
    const out = []; let pos = 0;
    rows.forEach((row, k) => {
      const body = k === 0 ? row : row.slice(ind.length);
      while (k > 0 && s[pos] === " ") pos++;
      const segs = k === 0 ? [] : [[ind, SYN.plain]];
      for (let i = 0; i < body.length; i++) {
        const c = colourAt[pos + i] || SYN.plain, last = segs[segs.length - 1];
        if (last && last[1] === c) last[0] += body[i]; else segs.push([body[i], c]);
      }
      pos += body.length;
      out.push(segs.filter((q) => q[0].length));
    });
    return out;
  };
  /** the number of whole characters a mono line holds in w px at this size (a proportional face: a safe estimate) */
  DK.cols = (w, size) => Math.max(4, Math.floor(w / (AK().monoW(size) * (AK().monoProp(size) ? 1.08 : 1))));

  // ------------------------------------------------------------------ motion
  const meta = (kind, name) => ({ kind, beat: Loom.ctxBeat && Loom.ctxBeat.id, name, content: kind !== "gesture" });
  DK.meta = meta;
  /** a group's vertical scroll, moved by whole rows: each call starts from where the last left it */
  const SCR = new WeakMap();
  DK.scroll = function (node, y, t, dur) {
    const a = SCR.has(node) ? SCR.get(node) : 0;
    SCR.set(node, y);
    if (t == null || t < 0) { node.setAttribute("transform", `translate(0 ${f1(-y)})`); return t; }
    Loom.drive((k) => node.setAttribute("transform", `translate(0 ${f1(-(a + (y - a) * k))})`), t, dur == null ? 0.18 : dur, "move", meta("travel", "dev.scroll"));
    return t + (dur == null ? 0.18 : dur);
  };
  DK.scrollY = (node) => (SCR.has(node) ? SCR.get(node) : 0);
  /** a soft bar that fades in (and out at `until`) */
  DK.flash = function (node, t, o) {
    o = o || {};
    Loom.tween(node, { opacity: 0 }, { opacity: o.to == null ? 1 : o.to, duration: o.dur || 0.25, ease: Loom.ease.enter }, t, meta("state", o.name || "dev.mark"));
    if (o.until != null) Loom.tween(node, { opacity: o.to == null ? 1 : o.to }, { opacity: 0, duration: 0.25 }, o.until, meta("state", o.name || "dev.mark"));
    return t + (o.dur || 0.25);
  };
  /** an arc that turns while a job runs (a pure function of time), then hides at `t1` */
  DK.spinner = function (g, cx, cy, r, color, t0, t1) {
    const a = svg("path", { d: "", fill: "none", stroke: color, "stroke-width": Math.max(3, r * 0.28), "stroke-linecap": "round", opacity: 0 }, g);
    const arc = (ang) => { const a0 = ang, a1 = ang + 4.2; return `M${f1(cx + r * Math.cos(a0))} ${f1(cy + r * Math.sin(a0))} A${f1(r)} ${f1(r)} 0 1 1 ${f1(cx + r * Math.cos(a1))} ${f1(cy + r * Math.sin(a1))}`; };
    a.setAttribute("d", arc(-Math.PI / 2));
    const dur = Math.max(0.05, t1 - t0);
    Loom.drive((e, raw) => { a.setAttribute("d", arc(-Math.PI / 2 + raw * dur * 5.5)); a.setAttribute("opacity", raw > 0 && raw < 1 ? 1 : 0); }, t0, dur, "linear", meta("state", "dev.spinner"));
    return a;
  };
  /** the status icon of a job or check: passed, failed, running, pending, skipped, blocked, warning */
  DK.STATE = {
    passed: { icon: "circle-check", tok: "pos" }, success: { icon: "circle-check", tok: "pos" }, ok: { icon: "circle-check", tok: "pos" },
    failed: { icon: "circle-x", tok: "neg" }, error: { icon: "circle-x", tok: "neg" },
    running: { icon: "loader-circle", tok: "accent" }, pending: { icon: "circle-dashed", tok: "muted" },
    skipped: { icon: "circle-slash", tok: "muted" }, blocked: { icon: "circle-minus", tok: "muted" },
    warning: { icon: "triangle-alert", tok: null },
  };
  DK.stateTok = (st) => { const d = DK.STATE[st] || DK.STATE.pending; return d.tok || DK.warnTok(); };
  /** a state icon at (cx, cy) as a group, so it can cross-fade to another */
  DK.stateIcon = function (g, st, cx, cy, size, color) {
    const d = DK.STATE[st] || DK.STATE.pending, gg = svg("g", {}, g);
    K().icon(gg, d.icon, { x: cx, y: cy, size, color: d.tok || DK.warnTok() });
    if (color) for (const n of gg.querySelectorAll("g")) n.setAttribute("stroke", color);
    return gg;
  };
  DK.cross = function (from, to, t, dur) {
    if (from) Loom.tween(from, { opacity: 1 }, { opacity: 0, duration: dur || 0.2 }, t, meta("state", "dev.state"));
    if (to) Loom.tween(to, { opacity: 0 }, { opacity: 1, duration: dur || 0.2, ease: Loom.ease.enter }, t + 0.05, meta("state", "dev.state"));
    return t + (dur || 0.2) + 0.05;
  };
})();
