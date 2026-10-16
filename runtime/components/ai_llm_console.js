// T-037 ai_llm_console: an LLM conversation as a developer sees it (hand-off sheet, Family C). Built on _app_kit.js and
// _dev_kit.js. Extends `ui.chat` and RedTee `explain.chat_exchange` (chat apps) with the developer's view: role-labelled
// blocks (system, user, assistant, tool), prompts in the mono face and answers in the body face, tool calls with their
// arguments and result, the answer streaming in on cue, and a footer with the tokens in and out and the stop reason.
Loom.component("ai_llm_console", {
  version: 1,
  idea: "An LLM console: role-labelled blocks for the system prompt, the user, the assistant and tools, prompts in mono and answers in the body face, tool calls with their arguments and result, the assistant's answer streaming in, a footer with tokens in and out and the stop reason, and spans that can be redacted.",
  outline: ["window frame with a title", "turns: a role chip at the left, the turn's text at the right (mono for system and user, body face for the assistant)", "tool blocks: the call with its arguments, then its result", "footer: tokens in and out, the stop reason"],
  family: "ai",
  kind: "screen",
  tags: ["llm", "chat completion", "system prompt", "roles", "streaming", "tool call", "function calling", "token usage", "api console", "prompt engineering"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-037)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint"],
  params: {
    turns: { type: "list", content: true },        // [{role: system|user|assistant|tool, text, tool?: {name, args, result}}] (args and result as text: JSON text is shown as it is)
    usage: { type: "obj" },                        // {in, out} token counts (content when given)
    stop: { type: "str" },                         // the stop reason ("end_turn")
    title: { type: "str" },
    w: { type: "number", default: 1300 }, rows: { type: "int", default: 16 },
    at: { type: "number", default: -1 },
    cps: { type: "number", default: 40 },          // streaming speed of the assistant's text
    steps: { type: "list", default: [] },          // [{do: "stream", i, at} | {do: "add", turn, at} | {do: "focus", i, at} | {do: "redact", i, spans: [text], at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["frame", "turns[] ({g, chip, lines, y, h})", "usage", "stream(i, t)", "add(turn, t)", "focus(i, t)", "redact(i, spans, t)"],
  example: 'ctx.use("ai_llm_console", { turns: [{ role: "system", text: "Answer from the handbook only." }, { role: "user", text: "How many leave days do I get?" }, { role: "assistant", text: "You get 25 days a year, plus public holidays." }], usage: { in: 412, out: 18 }, stop: "end_turn", at: ctx.cue("the model answers") }, { x: 310, y: 120, name: "console" })',
  size: (p) => { const DK = Loom.devKit; return { w: p.w, h: DK.barH() + Math.max(1, p.rows) * DK.codeLH(DK.codeSize(22)) + 24 + DK.consoleFootH(p) }; },
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const { Z } = DK.ui();
    const CS = DK.codeSize(22), LH = DK.codeLH(CS), ROWS = Math.max(1, p.rows | 0), cw = AK.monoW(CS);
    const barH = DK.barH(), footH = DK.consoleFootH(p), W = p.w, H = barH + ROWS * LH + 24 + footH;
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p);
    const SC = DK.scheme("light"), surface = S.c("surface"), ink = S.c("ink");
    const F = DK.frame(ctx, g, W, H, { title: p.title, bodyFill: SC.bg, at: p.at, eng, name: "console" });
    const ROLE = { system: "muted", user: "accent", assistant: "pos", tool: "accent3" };
    const turns0 = (p.turns || []).map((t0) => Object.assign({ role: "user" }, t0, { text: String(t0.text == null ? "" : t0.text) }));
    const roleW = Math.max(110, ...turns0.map((t0) => AK.measure(String(t0.role), "caption", Z.small, 700) + 34), ...(p.steps || []).filter((s) => s && s.do === "add" && s.turn).map((s) => AK.measure(String(s.turn.role), "caption", Z.small, 700) + 34));
    const padX = 22, tx = padX + roleW + 16, tw = W - tx - padX;
    const top = barH + 12, viewH = ROWS * LH;
    const clipId = Loom.uid ? Loom.uid("llmclip") : "llmclip";
    const cp = svg("clipPath", { id: clipId }, g);
    svg("rect", { x: 2, y: top - 4, width: W - 4, height: viewH + 8 }, cp);
    const area = svg("g", { "clip-path": `url(#${clipId})` }, g), scr = svg("g", {}, area);
    const parts = { frame: F.g, turns: [] };
    const sysSYN = DK.syntax({}, SC.bg, SC.text);
    const bodyLH = Math.ceil(Math.max(Z.fs * 1.42, AK.lineH(Z.fs)));
    let y = top;
    // one turn: its chip, its lines (mono or body), a tool block; returns the turn's record
    function drawTurn(T0, at) {
      const tg = svg("g", {}, scr), y0 = y, tok = ROLE[T0.role] || "muted";
      const chip = AK.pill(tg, padX, y0 + 2, String(T0.role), { size: Z.small, weight: 700, fill: S.mix(surface, S.c(tok), 0.16), stroke: DK.legible(tok, surface, ink, 3), sw: 1.5, color: "ink", r: 8 });
      const lines = [];
      let yy = y0 + 4;
      if (T0.text) {
        if (T0.role === "assistant") {
          const Fz = K.fit(T0.text, { role: "caption", size: Z.fs, w: tw, h: 1e5, maxLines: 999 });
          Fz.lines.forEach((ln) => { const t1 = AK.T(tg, ln, { x: tx, y: yy, w: tw + 4, h: bodyLH, size: Z.fs }); lines.push({ node: t1, text: ln, y: yy, mono: false }); yy += bodyLH; });
        } else {
          const cols = DK.cols(tw, CS);
          String(T0.text).split("\n").forEach((para) => DK.wrapCols(para, cols).forEach((ln) => {
            const M = ln.trim() ? AK.mono(tg, [[ln, T0.role === "system" ? SC.muted : SC.text]], { x: tx, y: yy, h: LH, size: CS }) : null;
            lines.push({ node: M && M.t, M, text: ln, y: yy, mono: true }); yy += LH;
          }));
        }
      }
      let toolG = null;
      if (T0.tool) {
        // the call: name(args) in mono, then the result under a rule, in a bordered block
        const tb = T0.tool, cols = DK.cols(tw - 60, CS);
        const callRows = DK.wrapCols(`${tb.name || ""}(${tb.args == null ? "" : typeof tb.args === "string" ? tb.args : JSON.stringify(tb.args)})`, cols);
        const resRows = tb.result == null ? [] : [].concat(...String(typeof tb.result === "string" ? tb.result : JSON.stringify(tb.result)).split("\n").map((r) => DK.wrapCols(r, cols)));
        const bh = 16 + (callRows.length + resRows.length) * LH + (resRows.length ? 14 : 0) + 8;
        yy += lines.length ? 8 : 0;
        toolG = svg("g", {}, tg);
        svg("rect", { x: tx, y: f1(yy), width: tw, height: f1(bh), rx: 10, fill: SC.band("accent3", 0.08) }, toolG);
        K.rect(toolG, tx, yy, tw, bh, { fill: "none", r: 10, stroke: "line", sw: 1.5 });
        AK.icon(toolG, "wrench", tx + 24, yy + 8 + LH / 2, 22, "accent3");
        let ry = yy + 8;
        callRows.forEach((r) => { DK.code(toolG, r, { x: tx + 48, y: ry, lh: LH, size: CS, lang: "js", SYN: sysSYN }); ry += LH; });
        if (resRows.length) {
          svg("rect", { x: tx + 16, y: f1(ry + 6), width: tw - 32, height: 1.5, fill: SC.rule }, toolG);
          ry += 14;
          AK.icon(toolG, "corner-down-right", tx + 24, ry + LH / 2, 20, "muted");
          resRows.forEach((r) => { DK.code(toolG, r, { x: tx + 48, y: ry, lh: LH, size: CS, lang: "json", SYN: sysSYN }); ry += LH; });
        }
        yy += bh;
      }
      const h = Math.max(chip.h + 6, yy - y0) + 14;
      y = y0 + h;
      const R = { g: tg, chip, lines, tool: toolG, y: y0, h, role: T0.role, text: T0.text };
      if (at != null && at >= 0) AK.show(tg, at, 0.25);
      return R;
    }
    // keep the newest in view: the body scrolls (whole rows) when a turn's bottom passes the view
    // the scroll lands on a line's top (or a turn's), so no half row shows at the top of the view
    // (10 px above a turn's or a line's top: the band that hides what scrolled past the edge is 8 px deep, and had cut
    // the top off a chip that landed right at the edge, 2026-10-16 review)
    const tops = () => [].concat(...parts.turns.map((R) => [R.y - 10].concat(R.lines.map((ln) => ln.y - 10)))).sort((a, b) => a - b);
    // where to scroll to show `need` more: a turn's top when one is within three rows (no orphan line of a turn whose
    // chip has gone shows at the top), else the nearest line's top
    const landOn = (need) => {
      const turnT = parts.turns.map((R) => R.y - 10 - top).filter((s0) => s0 >= need - 0.5 && s0 - need <= 3 * LH);
      if (turnT.length) return Math.min(...turnT);
      const cand = tops().map((yt) => yt - top).filter((s0) => s0 >= need - 0.5);
      return cand.length ? Math.min(...cand) : need;
    };
    const follow = (bottom, t) => {
      const need = bottom - (top + viewH);
      if (need - DK.scrollY(scr) <= 0.5) return;
      const s1 = landOn(need);
      DK.scroll(scr, s1, t, 0.3);
      hideChips(s1, t);
    };
    // a turn whose top has scrolled out of view loses its chip (else its foot shows as a sliver at the top)
    const hideChips = (s1, t) => parts.turns.forEach((R) => {
      if (R.chipGone || R.y - top >= s1 - 0.5) return;
      R.chipGone = true;
      if (t == null || t < 0) R.chip.g.setAttribute("opacity", 0); else Loom.tween(R.chip.g, { opacity: 1 }, { opacity: 0, duration: 0.2 }, t, DK.meta("state", "console.chip"));
    });
    const streamTurn = (R, t, cps) => {
      // the answer appears character by character, its lines in order; the view follows each new line
      let te = t;
      R.lines.forEach((ln) => {
        const n = ln.text.length, dur = Math.max(0.12, n / (cps || p.cps)), t0 = te;
        const node = ln.mono ? null : ln.node.querySelector("tspan") || ln.node;
        if (node) Loom.drive((e, raw) => { node.textContent = raw <= 0 ? "" : ln.text.slice(0, Math.round(n * e)); }, t0, dur, "linear", { kind: "typewriter", content: true, beat: Loom.ctxBeat && Loom.ctxBeat.id, name: "console.stream" });
        else if (ln.M) AK.typeMono(ln.M, t0, { cps: cps || p.cps });
        follow(ln.y + (ln.mono ? LH : bodyLH), t0);
        te = t0 + dur;
      });
      if (R.tool) { AK.show(R.tool, te + 0.1, 0.25); follow(R.y + R.h, te + 0.1); te += 0.4; }
      return te;
    };
    // ---- the turns, still or played in order
    let t = animated ? F.end + 0.2 : -1;
    turns0.forEach((T0, i) => {
      const R = drawTurn(T0, animated ? t : -1);
      parts.turns.push(R);
      if (animated) {
        follow(R.y + Math.min(R.h, LH * 2), t);
        if (T0.role === "assistant") { if (R.tool) R.tool.setAttribute("opacity", 0); t = streamTurn(R, t + 0.2) + 0.3; }
        else { if (R.tool) { R.tool.setAttribute("opacity", 0); AK.show(R.tool, t + 0.3, 0.25); } follow(R.y + R.h, t + 0.3); t += 0.5; }
      }
    });
    if (!animated && y > top + viewH) { const s1 = landOn(y - top - viewH); DK.scroll(scr, s1, -1); hideChips(s1, -1); }
    // a thin band of the body's colour at the top of the view: what has scrolled past its edge (a chip's foot, a
    // descender) does not show as a sliver
    if (y > top + viewH) svg("rect", { x: 2, y: top - 4, width: W - 4, height: 12, fill: SC.bg }, area);
    // ---- the footer: tokens in and out, the stop reason
    const fg = svg("g", {}, g), fy = H - footH;
    svg("rect", { x: 2, y: fy, width: W - 4, height: 1.5, fill: SC.rule }, fg);
    let fx = padX;
    if (p.usage) {
      [["arrow-down-to-line", p.usage.in], ["arrow-up-from-line", p.usage.out]].forEach(([ic, v]) => {
        if (v == null) return;
        AK.icon(fg, ic, fx + 12, fy + footH / 2, 22, "muted");
        const s0 = Number(v).toLocaleString("en-US"), sw = AK.measure(s0, "caption", Z.fs, 600) + 10;
        AK.T(fg, s0, { x: fx + 30, y: fy, w: sw, h: footH, size: Z.fs, weight: 600, color: "muted" });
        fx += 30 + sw + 28;
      });
    }
    if (p.stop) AK.pill(fg, W - padX, fy + (footH - 40) / 2, p.stop, { size: Z.small, weight: 600, icon: "square", fill: S.c("surface2"), color: "ink", align: "right" });
    parts.usage = fg;
    if (animated) AK.show(fg, Math.max(t, F.end), 0.3);
    // ---- state functions
    parts.stream = function (i, at) { const R = parts.turns[i]; if (!R) return at; return streamTurn(R, at); };
    parts.add = function (T0, at) {
      T0 = Object.assign({ role: "assistant" }, T0, { text: String(T0.text == null ? "" : T0.text) });
      const R = drawTurn(T0, at);
      parts.turns.push(R);
      follow(R.y + Math.min(R.h, LH * 2), at);
      if (T0.role === "assistant") { if (R.tool) R.tool.setAttribute("opacity", 0); return streamTurn(R, at + 0.2); }
      follow(R.y + R.h, at + 0.3);
      return at + 0.5;
    };
    parts.focus = function (i, at) {
      parts.turns.forEach((R, k) => Loom.tween(R.g, { opacity: 1 }, { opacity: k === i ? 1 : 0.35, duration: 0.3 }, at, DK.meta("state", "console.focus")));
      return at + 0.3;
    };
    parts.redact = function (i, spans, at) {
      // each span of the turn's text is covered by a block (the words under it fade), for a personal-data lesson
      const R = parts.turns[i];
      if (!R) return at;
      const rg = svg("g", {}, R.g);
      let k = 0;
      for (const sp of [].concat(spans || [])) {
        for (const ln of R.lines) {
          const j = ln.text.indexOf(String(sp));
          if (j < 0) continue;
          const pre = ln.text.slice(0, j), x0 = ln.mono ? tx + j * cw : tx + AK.measure(pre, "caption", Z.fs, 400), x1 = ln.mono ? tx + (j + String(sp).length) * cw : tx + AK.measure(pre + sp, "caption", Z.fs, 400);
          const hh = ln.mono ? LH : bodyLH;
          const blk = svg("rect", { x: f1(x0 - 2), y: f1(ln.y + hh * 0.18), width: f1(x1 - x0 + 4), height: f1(hh * 0.64), rx: 4, fill: ink, opacity: 0 }, rg);
          if (at == null || at < 0) blk.setAttribute("opacity", 1); else Loom.tween(blk, { opacity: 0 }, { opacity: 1, duration: 0.25 }, at + 0.1 * k, DK.meta("state", "console.redact"));
          k++;
        }
      }
      return at + 0.1 * k + 0.25;
    };
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "stream") parts.stream(st.i, st.at);
      else if (st.do === "add") parts.add(st.turn, st.at);
      else if (st.do === "focus") parts.focus(st.i, st.at);
      else if (st.do === "redact") parts.redact(st.i, st.spans, st.at);
      else Loom.error("component_params", `ai_llm_console: step "${st.do}" is not stream, add, focus or redact`);
    }
    return parts;
  },
});

// the footer's height (no footer without usage or a stop reason)
Loom.devKit.consoleFootH = (p) => (p.usage || p.stop ? Math.max(56, Loom.appKit.lineH(Loom.devKit.ui().Z.fs) + 20) : 0);
