// T-001 dev_terminal: a terminal session (hand-off sheet, Family A). Built on _app_kit.js (mono text, motion) and
// _dev_kit.js (the frame, legible tones, the engines). In the screencast style with its engine, the terminal IS the
// engine's terminal window (W.app with chrome "terminal" and a terminal region): no second terminal is drawn. In the
// whiteboard and blueprint styles, an animated terminal's frame is drawn by the hand or drafted by the pen; the code
// stays in the mono face. Everywhere else the kit draws it in the pack's shape language.
Loom.component("dev_terminal", {
  version: 1,
  idea: "A terminal session: a window with a title bar, commands typed after a prompt on cue and their output printed under them, errors and successes in their own tones, a block cursor, and lines that scroll when the window is full.",
  outline: ["window frame", "title bar with three neutral dots and a title", "body of mono lines (commands after a prompt, output, errors, warnings, comments)", "a block cursor"],
  family: "dev",
  kind: "screen",
  tags: ["terminal", "shell", "command line", "cli", "console", "bash", "git", "deployment", "devops", "kubectl"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-001)",
  // a terminal is a product screen: the styles that show software as screens, plus the technical drawing styles that
  // draw one in their own medium (D-193); hologram, isometric and the cinematic styles show the same subject their own way
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint"],
  params: {
    lines: { type: "list", content: true },        // [{kind: "cmd"|"out"|"err"|"ok"|"warn"|"comment", text, at?}]
    title: { type: "str", content: true },
    prompt: { type: "str", default: "$" },
    cwd: { type: "str" },                          // shown before the prompt, muted
    w: { type: "number", default: 1100 }, rows: { type: "int", default: 12 },
    at: { type: "number", default: -1 },           // when the first line starts (seconds); -1: drawn complete and still
    cps: { type: "number", default: 22 },          // typing speed of cmd lines; output lines appear whole, 0.08 s apart
    scheme: { type: "enum", choices: ["dark", "light", "pack"], default: "dark" },
    accent: { type: "token", default: "accent" },  // the prompt's tone
    highlight: { type: "list", default: [] },      // line indexes with a soft bar behind them
    wrap: { type: "enum", choices: ["wrap", "cut"], default: "wrap" },
    size: { type: "number", default: 24 },         // the mono size (never under the pack's caption floor)
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: { header: "redraw the title bar: (g, p, ctx) => void (the bar's box is 0, 0, w, barH)" },
  parts: ["frame", "bar", "title", "body", "lines[]", "cursor", "app (the engine app, in the screencast style)",
    "type(i, t)", "addLine({kind, text}, t)", "mark(i, tone, t)", "clear(t)"],
  example: 'ctx.use("dev_terminal", { title: "release", cwd: "~/shop", lines: [{ kind: "cmd", text: "npm run build" }, { kind: "out", text: "built in 4.2s" }, { kind: "ok", text: "3 bundles written" }], at: ctx.cue("build it") }, { x: 410, y: 210, name: "term" })',
  size: (p) => {
    const DK = Loom.devKit, CS = DK.codeSize(p.size);
    return { w: p.w, h: DK.barH() + 2 * 14 + Math.max(1, p.rows) * DK.codeLH(CS) };
  },
  build(ctx, g, p, slots) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const CS = DK.codeSize(p.size), LH = DK.codeLH(CS), ROWS = Math.max(1, p.rows | 0), padX = 24, padY = 14;
    const barH = DK.barH(), W = p.w, H = barH + 2 * padY + ROWS * LH;
    const KINDS = ["cmd", "out", "err", "ok", "warn", "comment"];
    const lines0 = (p.lines || []).map((ln, i) => {
      const L = typeof ln === "string" ? { kind: "out", text: ln } : Object.assign({}, ln);
      if (!KINDS.includes(L.kind)) { Loom.error("component_params", `dev_terminal: lines[${i}].kind "${L.kind}" is not one of ${KINDS.join(", ")}`); L.kind = "out"; }
      L.text = String(L.text == null ? "" : L.text);
      return L;
    });
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p);

    // ================================================================ the screencast engine's own terminal
    if (eng && eng.id === "screencast" && eng.W.app) return engineTerminal(eng);
    function engineTerminal(e) {
      const E = e.E, prompt = (p.cwd ? p.cwd + " " : "") + p.prompt;
      const tone = { out: "plain", err: "error", ok: "ok", warn: "warn", comment: "muted" };
      const asLine = (L) => (L.kind === "cmd" ? { cmd: L.text } : { out: L.text, tone: tone[L.kind] });
      const A = e.W.app(ctx, E.name + "_app", { chrome: "terminal", title: p.title, frame: { x: E.x, y: E.y, w: W, h: H },
        content: [{ id: "sh", kind: "terminal", prompt, lines: animated ? [] : lines0.map(asLine), size: CS }] }, { at: animated ? p.at : 0 });
      let t = animated ? p.at + 0.4 : -1, n = animated ? 0 : lines0.length;
      const nums = lines0.map((_, i) => i + 1);
      const run = (L, at) => {
        n += 1;
        if (L.kind === "cmd") return A.run("sh", L.text, { at, cps: p.cps, prompt });
        return A.out("sh", [asLine(L)], { at, gap: 0.08 }) + 0.08;
      };
      if (animated) lines0.forEach((L, i) => { t = run(L, L.at != null ? Math.max(L.at, t) : t); nums[i] = n; });
      (p.highlight || []).forEach((i) => { if (nums[i] != null) A.highlight("sh", nums[i], { at: animated ? p.at + 0.4 : 0 }); });
      return {
        app: A, frame: A, lines: nums.map((k) => `sh.line.${k}`),
        type(i, at) { const L = lines0[i]; if (!L) return at; const end = run(L, at); nums[i] = n; return end; },
        addLine(L, at) { L = typeof L === "string" ? { kind: "out", text: L } : L; const end = run({ kind: L.kind || "out", text: String(L.text) }, at); lines0.push(L); nums.push(n); return end; },
        mark(i, tn, at) { return nums[i] != null ? A.highlight("sh", nums[i], { at }) : at; },
        clear(at) { Loom.warn("dev_terminal_clear", "the screencast engine's terminal keeps its history: clear() is not drawn in this style"); return at; },
      };
    }

    // ================================================================ the terminal drawn by the kit (or by the hand / the pen)
    const SC = DK.scheme(p.scheme);
    const promptC = SC.L(p.accent);
    const kindC = { cmd: SC.text, out: SC.text, err: SC.err, ok: SC.ok, warn: SC.warn, comment: SC.muted };
    const F = DK.frame(ctx, g, W, H, { title: slots.header ? null : p.title, bodyFill: SC.bg, at: p.at, eng, name: "term" });
    if (slots.header) { const hg = svg("g", {}, g); slots.header(hg, Object.assign({ barH }, p), ctx); }
    const body = { x: 0, y: barH, w: W, h: H - barH };
    const clipId = Loom.uid ? Loom.uid("termclip") : "termclip" + Loom.hash(String(p.title));
    const cp = svg("clipPath", { id: clipId }, g);
    svg("rect", { x: 2, y: barH + padY - 2, width: W - 4, height: ROWS * LH + 4 }, cp);
    const bodyG = svg("g", { "clip-path": `url(#${clipId})` }, g);
    const scr = svg("g", {}, bodyG);                 // scrolls by whole rows
    const backG = svg("g", {}, scr), textG = svg("g", {}, scr);
    const cols = DK.cols(W - 2 * padX, CS), cw = AK.monoW(CS);
    const rowY = (r) => barH + padY + r * LH;
    const parts = { frame: F.g, bar: F.bar, title: F.title || null, body: bodyG, lines: [], cursor: null };

    // a line's rows: [{segs, typed}] where segs are [[text, colour]]; a cmd keeps its prompt apart from the typed command
    function rowsOf(L) {
      const pre = L.kind === "cmd" ? [p.cwd ? [p.cwd + " ", SC.muted] : null, [p.prompt + " ", promptC, 700]].filter(Boolean) : [];
      const preLen = pre.reduce((a, q) => a + q[0].length, 0);
      const text = L.text.replace(/\t/g, "    ");
      const room = Math.max(4, cols - preLen);
      let chunks = p.wrap === "cut" ? [text] : DK.wrapCols(text, room);
      if (p.wrap !== "cut" && chunks.length > 1) {
        // continuation rows of a command sit under the command, not under the prompt
        const first = chunks[0], restAll = text.slice(first.length).replace(/^\s+/, "");
        chunks = [first].concat(restAll ? DK.wrapCols(restAll, room) : []);
      }
      return chunks.map((c, k) => ({ pre: k === 0 ? pre : [], preLen, text: c, colour: kindC[L.kind] }));
    }
    let nextRow = 0;
    const cur = { pos: [] };   // the cursor's schedule: [{t, x, y, typing: [t0, t1]}]
    function drawLine(L, appearAt, typeAt) {
      const rows = rowsOf(L), r0 = nextRow, lg = svg("g", {}, textG), bg = svg("g", { opacity: 0 }, backG);
      svg("rect", { x: 8, y: f1(rowY(r0) + 1), width: W - 16, height: f1(rows.length * LH - 2), rx: 4, fill: SC.band("accent", 0.2) }, bg);
      const Ms = [];
      rows.forEach((R, k) => {
        const y = rowY(r0 + k);
        const x0 = padX + R.preLen * cw * (AK.monoProp(CS) ? 1.04 : 1);
        const P = R.pre.length ? AK.mono(lg, R.pre, { x: padX, y, h: LH, size: CS }) : null;
        const cutW = p.wrap === "cut" ? W - x0 - padX : null;
        const M = R.text.trim() ? AK.mono(lg, [[R.text, R.colour, L.kind === "err" ? 700 : 400]], { x: k === 0 && R.pre.length ? (P ? P.colX(P.cols) : x0) : padX + (L.kind === "cmd" ? R.preLen * cw : 0), y, h: LH, size: CS, w: cutW }) : null;
        Ms.push({ P, M, y });
      });
      nextRow += rows.length;
      const line = { g: lg, back: bg, rows: rows.length, r0, kind: L.kind, text: L.text, Ms };
      // when it appears: whole (output) or typed (a command), scrolled into view first
      if (appearAt != null && appearAt >= 0) {
        const over = r0 + rows.length - ROWS;
        if (over > DK.scrollY(scr) / LH) DK.scroll(scr, over * LH, appearAt - 0.12, 0.12);
        if (L.kind === "cmd") {
          for (const q of Ms) if (q.P) AK.show(q.P.t, appearAt, 0.01);
          let t = (typeAt != null ? typeAt : appearAt) + 0.12;
          const t0 = t;
          Ms.forEach((q) => { if (q.M) { t = AK.typeMono(q.M, t, { cps: p.cps }); cur.pos.push({ t: t0, until: t, M: q.M, y: q.y }); } });
          if (!Ms.some((q) => q.M)) cur.pos.push({ t: t0, until: t0, x: Ms[0].P ? Ms[0].P.colX(Ms[0].P.cols) : padX, y: Ms[0].y });
          line.end = t;
        } else {
          AK.show(lg, appearAt, 0.06);
          line.end = appearAt + 0.08;
        }
        cur.pos.push({ t: line.end, until: line.end, x: padX, y: rowY(nextRow), afterRow: nextRow });
      } else line.end = -1;
      return line;
    }

    // ---- the lines: drawn complete (still), or scheduled from `at`
    let t = animated ? Math.max(p.at, F.end) + 0.1 : -1;
    lines0.forEach((L) => {
      const ap = animated ? (L.at != null ? Math.max(L.at, t) : t) : -1;
      const line = drawLine(L, ap);
      parts.lines.push(line);
      if (animated) t = line.end + (L.kind === "cmd" ? 0.3 : 0.08 - 0.08);
    });
    if (!animated && nextRow > ROWS) DK.scroll(scr, (nextRow - ROWS) * LH, -1);
    (p.highlight || []).forEach((i) => { const ln = parts.lines[i]; if (ln) { if (animated) DK.flash(ln.back, Math.max(0, ln.end), { name: "term.mark" }); else ln.back.setAttribute("opacity", 1); } });

    // ---- the block cursor: after the last character typed; blinking (0.53 s on, 0.53 s off) when idle, steady while typing
    const cg = svg("g", {}, scr);
    const cursor = svg("rect", { x: padX, y: 0, width: f1(cw), height: f1(CS * 1.08), rx: 1.5, fill: SC.text, opacity: 0 }, cg);
    parts.cursor = cursor;
    const lastXY = () => {
      const ln = parts.lines[parts.lines.length - 1];
      if (!ln) return { x: padX, y: rowY(0) };
      const q = ln.Ms[ln.Ms.length - 1];
      if (ln.kind === "cmd" && q) return { x: q.M ? q.M.colX(q.M.cols) + cw * 0.4 : q.P ? q.P.colX(q.P.cols) : padX, y: q.y };
      return { x: padX, y: rowY(nextRow) };
    };
    const placeCursor = (x, y) => { cursor.setAttribute("x", f1(x)); cursor.setAttribute("y", f1(y + (LH - CS * 1.08) / 2)); };
    if (!animated) {
      const q = lastXY();
      // a still terminal: a steady cursor where the next character would go, when that row is in view
      const lastCmd = parts.lines.length && parts.lines[parts.lines.length - 1].kind === "cmd";
      if (lastCmd || nextRow < ROWS) { placeCursor(q.x, q.y); cursor.setAttribute("opacity", 0.85); }
    } else {
      const t0 = Math.max(p.at, F.end), tEnd = Math.max(ctx.end || 0, t + 1);
      const pick = (now) => {
        let s = null;
        for (const e of cur.pos) if (e.t <= now) s = e;
        return s;
      };
      Loom.drive((e, raw) => {
        const now = t0 + raw * (tEnd - t0), s = pick(now);
        if (!s || raw <= 0) { cursor.setAttribute("opacity", 0); return; }
        let x = s.x, y = s.y, typing = false;
        if (s.M) {
          const k = Math.max(0, Math.min(s.M.cols, Math.round(((now - s.t) / Math.max(0.01, s.until - s.t)) * s.M.cols)));
          x = s.M.colX(now >= s.until ? s.M.cols : k) + (now >= s.until ? cw * 0.4 : 0); typing = now < s.until;
        }
        placeCursor(x, y);
        // idle on a row that has scrolled out of view or not yet into it: hidden
        const vis = (y - barH - padY) / LH - DK.scrollY(scr) / LH;
        const on = typing || Math.floor((now - s.until) / 0.53) % 2 === 0;
        cursor.setAttribute("opacity", vis >= -0.2 && vis < ROWS - 0.2 && on ? 0.85 : 0);
      }, t0, tEnd - t0, "linear", { kind: "cursor", beat: Loom.ctxBeat && Loom.ctxBeat.id, name: "term.cursor", content: true });
    }

    // ---- state functions
    parts.type = function (i, at) {
      const ln = parts.lines[i];
      if (!ln) return at;
      let te = at + 0.12;
      Loom.tween(ln.g, { opacity: 0 }, { opacity: 1, duration: 0.01 }, at, DK.meta("reveal", "term.type"));
      ln.Ms.forEach((q) => { if (q.M) { const t1 = AK.typeMono(q.M, te, { cps: p.cps }); cur.pos.push({ t: te, until: t1, M: q.M, y: q.y }); te = t1; } });
      cur.pos.push({ t: te, until: te, x: padX, y: rowY(ln.r0 + ln.rows) });
      cur.pos.sort((a, b) => a.t - b.t);
      return te;
    };
    parts.addLine = function (L, at) {
      L = typeof L === "string" ? { kind: "out", text: L } : Object.assign({ kind: "out" }, L, { text: String(L.text == null ? "" : L.text) });
      const ln = drawLine(L, at);
      parts.lines.push(ln);
      cur.pos.sort((a, b) => a.t - b.t);
      return ln.end;
    };
    parts.mark = function (i, tone, at) {
      const ln = parts.lines[i];
      if (!ln) return at;
      const rect = ln.back.firstChild;
      if (tone && tone in S.pack.palette) rect.setAttribute("fill", SC.band(tone, 0.22));
      if (at == null || at < 0) { ln.back.setAttribute("opacity", 1); return at; }
      return DK.flash(ln.back, at, { name: "term.mark" });
    };
    parts.clear = function (at) {
      for (const ln of parts.lines) { Loom.tween(ln.g, { opacity: 1 }, { opacity: 0, duration: 0.15 }, at, DK.meta("state", "term.clear")); Loom.tween(ln.back, { opacity: +ln.back.getAttribute("opacity") || 0 }, { opacity: 0, duration: 0.15 }, at, DK.meta("state", "term.clear")); }
      // the next line starts at the top again, under a fresh scroll
      const keep = nextRow;
      nextRow = Math.ceil(keep / ROWS) * ROWS + ROWS;
      const base = nextRow;
      DK.scroll(scr, base * LH, at + 0.16, 0.01);
      cur.pos.push({ t: at + 0.17, until: at + 0.17, x: padX, y: rowY(base) });
      return at + 0.2;
    };
    return parts;
  },
});
