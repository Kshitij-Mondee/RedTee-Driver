// T-002 dev_code_editor: a code editor pane (hand-off sheet, Family A). Built on _app_kit.js and _dev_kit.js. In the
// screencast style with its engine, the pane IS the engine's code editor (W.app with a "code" region): no second editor
// is drawn. In every other style the pane draws itself, with the dev kit's small tokenizer for syntax colour (no
// library at runtime). In the whiteboard and blueprint styles an animated pane's frame is drawn by the hand or the pen.
Loom.component("dev_code_editor", {
  version: 1,
  idea: "A code editor pane: a tab with the file name and its language, line numbers in a gutter, code in syntax colour, an overview stripe and an optional status line; lines type in on cue, a range can be brought into focus, a span marked with a squiggle and a line replaced.",
  outline: ["pane frame", "tab with the file name and the language label", "line-number gutter", "code lines in syntax colour", "overview stripe at the right", "status line (optional)", "a caret while typing"],
  family: "dev",
  kind: "screen",
  tags: ["code editor", "source code", "syntax highlighting", "programming", "function", "config file", "code review", "bug fix", "yaml", "python"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-002)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint"],
  params: {
    code: { type: "str", content: true },          // the code, lines separated by \n
    file: { type: "str", content: true },          // the file name in the tab
    lang: { type: "enum", choices: ["js", "ts", "py", "go", "java", "sql", "yaml", "json", "bash", "html", "css", "text"], default: "text" },
    langLabel: { type: "str" },                    // the language's name in the tab (the lang id when omitted)
    status: { type: "str" },                       // the status line's words (no status line when omitted)
    w: { type: "number", default: 1200 }, rows: { type: "int", default: 16 },
    startLine: { type: "int", default: 1 },
    at: { type: "number", default: -1 },           // when the pane appears and typing starts; -1: drawn complete and still
    cps: { type: "number", default: 18 },
    typeLines: { type: "list", default: [] },      // 0-based indexes of lines typed on cue (the rest shown at once)
    colors: { type: "obj", default: {} },          // token kind -> colour token (keyword, string, number, comment, fn, type, punct)
    focus: { type: "list", default: [] },          // [first, last] line numbers kept bright, the rest dimmed
    minimap: { type: "bool", default: true },
    steps: { type: "list", default: [] },          // scripted states: [{do: "focus"|"mark"|"replace"|"scrollTo", at, line, to, tone, col0, col1, text}]
    size: { type: "number", default: 24 },
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["frame", "tab", "gutter", "lines[] ({g, tokens[], num, n})", "cursor", "minimap", "status", "app (the engine app, in the screencast style)",
    "focus(a, b, t)", "mark(line, tone, t, {col0, col1})", "replace(line, newText, t)", "scrollTo(line, t)"],
  example: 'ctx.use("dev_code_editor", { file: "rate_limit.go", lang: "go", code: "func allow(key string) bool {\\n  n := hits.Incr(key)\\n  return n <= limit\\n}", focus: [2, 3], at: ctx.cue("the counter") }, { x: 360, y: 180, name: "editor" })',
  size: (p) => {
    const DK = Loom.devKit, AK = Loom.appKit, CS = DK.codeSize(p.size), Z = DK.ui().Z;
    const tabH = AK.boxH(Z.fs, "caption", 600, 52), stH = p.status ? AK.boxH(Z.small, "caption", 400, 40) : 0;
    return { w: p.w, h: tabH + 2 * 12 + Math.max(1, p.rows) * DK.codeLH(CS) + stH };
  },
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const { Z } = DK.ui();
    const CS = DK.codeSize(p.size), LH = DK.codeLH(CS), ROWS = Math.max(1, p.rows | 0), padY = 12, cw = AK.monoW(CS);
    const tabH = AK.boxH(Z.fs, "caption", 600, 52), stH = p.status ? AK.boxH(Z.small, "caption", 400, 40) : 0;
    const W = p.w, H = tabH + 2 * padY + ROWS * LH + stH;
    const code = String(p.code).replace(/\r/g, "").replace(/\t/g, "    ").split("\n");
    const num = (i) => p.startLine + i;
    const animated = p.at != null && p.at >= 0;
    const typed = new Set((p.typeLines || []).map((x) => +x));
    const eng = DK.engine(ctx, g, p);

    // ================================================================ the screencast engine's own editor
    if (eng && eng.id === "screencast" && eng.W.app) {
      const E = eng.E, elang = { py: "python", sh: "bash", js: "js", ts: "ts", yaml: "yaml", json: "json", bash: "bash" }[p.lang] || "text";
      const A = eng.W.app(ctx, E.name + "_app", { chrome: "window", title: p.file, frame: { x: E.x, y: E.y, w: W, h: H },
        content: [{ id: "code", kind: "code", lang: elang, lines: code.map((s, i) => (animated && typed.has(i) ? "" : s)), start: p.startLine, size: CS }] }, { at: animated ? p.at : 0 });
      let t = animated ? p.at + 0.6 : 0;
      if (animated) [...typed].sort((a, b) => a - b).forEach((i) => { if (code[i] != null) t = A.codeType("code", num(i), code[i], { at: t, cps: p.cps, keep: 0 }) + 0.3; });
      if (p.focus && p.focus.length === 2) for (let n = p.focus[0]; n <= p.focus[1]; n++) A.highlight("code", n, { at: animated ? p.at + 0.4 : 0 });
      const markOf = (tone) => (tone === "neg" || tone === "accent3" ? "-" : tone === "pos" || tone === "accent4" ? "+" : "~");
      return {
        app: A, frame: A, lines: code.map((_, i) => `code.line.${num(i)}`),
        focus(a, b, at) { let e = at; for (let n = a; n <= b; n++) e = A.highlight("code", n, { at }); return e; },
        mark(line, tone, at) { return A.codeMark("code", line, markOf(tone), at); },
        replace(line, s, at) { A.codeMark("code", line, "-", at); return A.codeType("code", line, s, { at: at + 0.4, keep: 0, diff: "~" }); },
        scrollTo(line, at) { return A.scrollToLine("code", line, { at }); },
      };
    }

    // ================================================================ the pane drawn by the kit (or by the hand / the pen)
    const SC = DK.scheme("light");
    const SYN = DK.syntax(p.colors, SC.bg, SC.text);
    const F = DK.frame(ctx, g, W, H, { barH: tabH, dots: false, bodyFill: SC.bg, at: p.at, eng, name: "editor" });
    const parts = { frame: F.g, lines: [], cursor: null };
    // the tab: the file name, then its language label in muted
    const tg = svg("g", {}, g);
    const lab = p.langLabel || p.lang;
    const labW = lab && lab !== "text" ? AK.measure(lab, "caption", Z.small, 400) + 16 : 0;
    const nameW = Math.min(AK.measure(p.file, "caption", Z.fs, 600) + 8, W * 0.6);
    const tabW = Math.ceil(nameW + labW + 64);
    AK.icon(tg, "file-code", 30, tabH / 2, 24, "muted");
    const nameT = AK.T(tg, p.file, { x: 50, y: 0, w: nameW, h: tabH, size: Z.fs, weight: 600 });
    if (labW) AK.T(tg, lab, { x: 50 + nameW + 8, y: 0, w: labW, h: tabH, size: Z.small, color: "muted" });
    svg("rect", { x: 14, y: f1(tabH - 4), width: f1(tabW - 14), height: 3, rx: 1.5, fill: S.c("accent") }, tg);
    parts.tab = { g: tg, name: nameT };
    if (animated) AK.show(tg, F.end - 0.1, 0.25);

    // the gutter and the code area (clipped to its rows)
    const digits = String(num(code.length - 1)).length, gutW = Math.ceil(digits * cw + 34), mapW = p.minimap ? 64 : 0;
    const top = tabH + padY, codeX = gutW + 18, codeW = W - codeX - mapW - 18;
    const clipId = Loom.uid ? Loom.uid("edclip") : "edclip" + Loom.hash(p.file);
    const cp = svg("clipPath", { id: clipId }, g);
    svg("rect", { x: 2, y: top - 2, width: W - 4 - mapW, height: ROWS * LH + 4 }, cp);
    const area = svg("g", { "clip-path": `url(#${clipId})` }, g), scr = svg("g", {}, area);
    const gutBg = svg("rect", { x: 2, y: tabH, width: gutW, height: H - tabH - stH - 2, fill: SC.band("line", 0.06) }, g);
    g.insertBefore(gutBg, area);
    parts.gutter = { bg: gutBg };
    const yOf = (i) => top + i * LH;
    const backG = svg("g", {}, scr), textG = svg("g", {}, scr), markG = svg("g", {}, scr);
    const lnC = DK.legible(S.mix(SC.text, SC.bg, 0.5), SC.bg, SC.text, 3.2);
    const lines = code.map((s, i) => {
      const lg = svg("g", {}, textG), y = yOf(i);
      const numT = AK.mono(lg, [[String(num(i)).padStart(digits, " "), lnC]], { x: 14, y, h: LH, size: CS });
      const cg = svg("g", {}, lg);
      const M = DK.code(cg, s, { x: codeX, y, lh: LH, size: CS, lang: p.lang, SYN, w: codeW });
      return { g: lg, code: cg, M, num: numT, n: num(i), i, y, text: s, tokens: M ? M.spans.map((q) => q.node) : [] };
    });
    parts.lines = lines;
    // the overview stripe: a bar a line, as long as the line, the visible window marked
    let viewMark = null;
    if (p.minimap) {
      const mg = svg("g", {}, g), mx = W - mapW - 6, mh = Math.max(1.4, Math.min(3, (ROWS * LH) / Math.max(1, code.length))), step = mh * 1.6;
      svg("rect", { x: mx, y: top, width: mapW, height: ROWS * LH, fill: SC.band("line", 0.05) }, mg);
      const lim = Math.max(1, ...code.map((s) => s.length));
      code.forEach((s, i) => { const ind = s.match(/^\s*/)[0].length; if (s.trim()) svg("rect", { x: f1(mx + 6 + (ind / lim) * (mapW - 12)), y: f1(top + 4 + i * step), width: f1(Math.max(2, ((s.length - ind) / lim) * (mapW - 12))), height: f1(mh), fill: SC.muted, opacity: 0.6 }, mg); });
      viewMark = svg("rect", { x: mx, y: top + 1, width: mapW, height: f1(Math.min(ROWS * LH, Math.min(ROWS, code.length) * step + 6)), fill: S.c("accent"), opacity: 0.12 }, mg);
      viewMark.__step = step;
      parts.minimap = mg;
      if (animated) AK.show(mg, F.end, 0.3);
    }
    // the status line
    if (p.status) {
      const sg = svg("g", {}, g), sy = H - stH;
      svg("rect", { x: 2, y: sy, width: W - 4, height: 1.5, fill: SC.rule }, sg);
      // the status line's items (separated by two or more spaces in the param) set apart, as an editor's status bar
      const items = String(p.status).split(/\s{2,}/).filter(Boolean);
      let sx = 20;
      parts.status = items.map((it) => {
        const iw = Math.min(W - 20 - sx, AK.measure(it, "caption", Z.small, 400) + 6);
        if (iw < 30) return null;
        const t1 = AK.T(sg, it, { x: sx, y: sy, w: iw, h: stH - 2, size: Z.small, color: "muted" });
        sx += iw + 34;
        return t1;
      }).filter(Boolean);
      if (animated) AK.show(sg, F.end, 0.3);
    }

    // ---- scrolling, focus, typing
    const maxOff = Math.max(0, code.length - ROWS);
    let mmK = 0;
    const setScroll = (k, t) => {
      k = Math.max(0, Math.min(maxOff, k));
      DK.scroll(scr, k * LH, t, t == null || t < 0 ? 0 : 0.5);
      if (viewMark) { const st = viewMark.__step, y0 = top + 1 + mmK * st; mmK = k; if (t == null || t < 0) viewMark.setAttribute("y", f1(top + 1 + k * st)); else Loom.tween(viewMark, { y: y0 }, { y: top + 1 + k * st, duration: 0.5 }, t, DK.meta("travel", "editor.minimap")); }
      return t == null || t < 0 ? t : t + 0.5;
    };
    const lineAt = (n) => lines.find((L) => L.n === n);
    const dimLines = (a, b, t) => {
      for (const L of lines) {
        const on = L.n >= a && L.n <= b, to = on ? 1 : 0.32;
        if (t == null || t < 0) L.g.setAttribute("opacity", to);
        else Loom.tween(L.g, { opacity: +(L.g.getAttribute("opacity") || 1) }, { opacity: to, duration: 0.3 }, t, DK.meta("state", "editor.focus"));
        L.g.setAttribute("data-op", to);
      }
    };
    parts.focus = function (a, b, t) {
      dimLines(a, b, t);
      // bring the range into view when it is not
      const ia = lines.findIndex((L) => L.n === a), cur = DK.scrollY(scr) / LH;
      if (ia >= 0 && (ia < cur || ia + (b - a) >= cur + ROWS)) setScroll(ia - 2, t);
      return t == null || t < 0 ? t : t + 0.3;
    };
    if (p.focus && p.focus.length === 2) {
      if (animated) { for (const L of lines) Loom.tween(L.g, { opacity: 1 }, { opacity: 1, duration: 0.01 }, p.at, DK.meta("state", "editor.focus")); parts.focus(p.focus[0], p.focus[1], p.at + 0.5); }
      else parts.focus(p.focus[0], p.focus[1], -1);
    }
    // the caret
    const caret = svg("rect", { x: codeX, y: top, width: 2.5, height: f1(CS * 1.2), fill: SC.text, opacity: 0 }, scr);
    parts.cursor = caret;
    const typeLine = (L, at, cps) => {
      if (!L.M) return at;
      for (const sp of L.M.spans) sp.node.textContent = sp.node.textContent;   // the spans are revealed by the drive
      const n = L.M.cols, dur = Math.max(0.25, n / (cps || p.cps));
      Loom.drive((e, raw) => {
        const now = at + raw * (dur + 0.5), k = Math.max(0, Math.min(n, Math.floor(((now - at) / dur) * n + 1e-6)));
        AK.monoReveal(L.M.spans, raw <= 0 ? 0 : k);
        caret.setAttribute("x", f1(L.M.colX(k)));
        caret.setAttribute("y", f1(L.y + (LH - CS * 1.2) / 2));
        caret.setAttribute("opacity", raw <= 0 || raw >= 1 ? 0 : now <= at + dur || Math.floor((now - at) / 0.53) % 2 === 0 ? 1 : 0);
      }, at, dur + 0.5, "linear", { kind: "typewriter", content: true, beat: Loom.ctxBeat && Loom.ctxBeat.id, name: "editor.type" });
      for (let i = 0; i < n; i += 3) Loom.sfx && Loom.sfx("key", at + (i / n) * dur, { i, g: 0.35 });
      return at + dur;
    };
    if (animated) {
      AK.show(area, F.end - 0.05, 0.25);
      let t = F.end + 0.3;
      [...typed].sort((a, b) => a - b).forEach((i) => {
        const L = lines[i];
        if (!L) return;
        if (i >= DK.scrollY(scr) / LH + ROWS) t = setScroll(i - ROWS + 2, t) + 0.1;
        t = typeLine(L, t) + 0.25;
      });
    } else if (p.focus && p.focus.length === 2) { /* the focus call above scrolled it into view */ }

    // ---- state functions
    parts.mark = function (line, tone, t, span) {
      const L = lineAt(line);
      if (!L) return t;
      const s = L.text, c0 = span && span.col0 != null ? span.col0 : s.match(/^\s*/)[0].length, c1 = span && span.col1 != null ? span.col1 : s.replace(/\s+$/, "").length;
      const x0 = L.M ? L.M.colX(c0) : codeX + c0 * cw, x1 = L.M ? L.M.colX(c1) : codeX + c1 * cw, y = L.y + LH - 5;
      const col = DK.legible(tone && tone in S.pack.palette ? tone : "neg", SC.bg, SC.text);
      let d = `M${f1(x0)} ${f1(y)}`;
      for (let x = x0, k = 0; x < x1; x += 6, k++) d += ` L${f1(Math.min(x1, x + 6))} ${f1(y + (k % 2 ? -3 : 3))}`;
      const sq = svg("path", { d, fill: "none", stroke: col, "stroke-width": 2.4, "stroke-linejoin": "round", opacity: t == null || t < 0 ? 1 : 0 }, markG);
      if (t != null && t >= 0) DK.flash(sq, t, { name: "editor.mark" });
      return t == null || t < 0 ? t : t + 0.25;
    };
    parts.replace = function (line, newText, t) {
      const L = lineAt(line);
      if (!L) return t;
      const s = String(newText).replace(/\t/g, "    ");
      const x0 = L.M ? L.M.colX(L.text.match(/^\s*/)[0].length) : codeX, x1 = L.M ? L.M.colX(L.text.replace(/\s+$/, "").length) : codeX;
      const strike = svg("rect", { x: f1(x0), y: f1(L.y + LH / 2 - 1.5), width: f1(Math.max(4, x1 - x0)), height: 3, fill: DK.legible("accent3", SC.bg, SC.text), opacity: 0 }, markG);
      const band = svg("rect", { x: codeX - 8, y: f1(L.y + 1), width: f1(codeW + 8), height: LH - 2, fill: SC.band("accent3", 0.14), opacity: 0 }, backG);
      Loom.tween(band, { opacity: 0 }, { opacity: 1, duration: 0.2 }, t, DK.meta("state", "editor.replace"));
      Loom.tween(strike, { opacity: 0 }, { opacity: 1, duration: 0.25 }, t, DK.meta("state", "editor.replace"));
      Loom.tween(L.code, { opacity: 1 }, { opacity: 0, duration: 0.2 }, t + 0.55, DK.meta("state", "editor.replace"));
      Loom.tween(strike, { opacity: 1 }, { opacity: 0, duration: 0.2 }, t + 0.55, DK.meta("state", "editor.replace"));
      const ng = svg("g", {}, L.g);
      const M = DK.code(ng, s, { x: codeX, y: L.y, lh: LH, size: CS, lang: p.lang, SYN, w: codeW });
      const NL = { M, y: L.y };
      const end = M ? typeLine(NL, t + 0.75) : t + 0.75;
      Loom.tween(band, { opacity: 1 }, { opacity: 0.55, duration: 0.3 }, end, DK.meta("state", "editor.replace"));
      L.text = s; L.M = M || L.M; L.code = ng;
      return end;
    };
    parts.scrollTo = function (line, t) {
      const i = lines.findIndex((L) => L.n === line);
      return i < 0 ? t : setScroll(i - Math.floor(ROWS / 3), t);
    };
    // ---- scripted steps (the same state functions, from the params)
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "focus") parts.focus(st.line, st.to == null ? st.line : st.to, st.at);
      else if (st.do === "mark") parts.mark(st.line, st.tone, st.at, st.col0 != null ? { col0: st.col0, col1: st.col1 } : null);
      else if (st.do === "replace") parts.replace(st.line, st.text, st.at);
      else if (st.do === "scrollTo") parts.scrollTo(st.line, st.at);
      else Loom.error("component_params", `dev_code_editor: step "${st.do}" is not focus, mark, replace or scrollTo`);
    }
    return parts;
  },
});
