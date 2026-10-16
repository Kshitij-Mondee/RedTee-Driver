// @design strike_and_replace: a held word is struck out and fades while a better line writes in where it was, inside a quiet thought
// b24 holds b23's "term" (the word Careless). A thought forms around it, a single stroke strikes it, and the
// describing line types in where the word stood. Maya, small at the right, is the one thinking it.
Loom.scene("b24", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat, S = ctx.style;
    const svg = Loom.svg, f = (v) => Math.round(v * 10) / 10;
    const tForm = ctx.cue("So she rewrites it");
    const tStrike = ctx.cue("rewrites it");
    const tA = ctx.cue("The update didn't say");
    const tB = ctx.cue("when the change takes effect");
    const tReal = ctx.cue("takes effect");

    const term = ctx.held("term");
    if (!term) return;
    // b23 built the term inside a block that it shifted to centre it: read that shift so we draw in the same frame
    const blk = term.outer.parentNode;
    const tr = (blk.getAttribute("transform") || "").match(/translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/);
    const sx = tr ? +tr[1] : 0, sy = tr ? +tr[2] : 0;
    const tn0 = term.inner.querySelector("text"), tsp = tn0 && tn0.querySelector("tspan");
    const size = tn0 ? +tn0.getAttribute("font-size") || 88 : 88;
    const base = tsp && tsp.getAttribute("y") ? +tsp.getAttribute("y") : size * 0.85;
    const word = kit.fit("Careless", { role: "title", w: 1488, h: 120, maxLines: 1 });
    const wordW = kit.measure ? kit.measure("Careless", "title", size) : word.width;

    // ---------- a soft pool of light behind Maya, under the thought chain ----------
    const MX = 1400, FEET = 1142;
    const pool = ctx.el("pool", { x: MX - 330, y: 300, w: 660, h: 660, kind: "scenery" });
    svg("circle", { cx: 330, cy: 330, r: 320, fill: S.c("field2"), opacity: 0.7 }, pool.inner);
    svg("circle", { cx: 330, cy: 330, r: 210, fill: S.c("surface"), opacity: 0.45 }, pool.inner);
    blk.parentNode.insertBefore(pool.outer, blk);

    // ---------- Maya, small at the right, thinking ----------
    const maya = ctx.character("maya", "maya", { x: MX, y: FEET, scale: 0.42, pose: "chin", emotion: "thinking" });
    m.reveal(maya.E, ctx.start + 0.1, { dy: 14, dur: 0.6, content: true });
    maya.emotion("thinking", ctx.start);
    maya.emotion("realisation", tReal + 0.9);
    maya.gesture("nod", tReal + 0.9, tReal + 1.9);

    // ---------- the thought: a chat-style thought sized to the new line, formed around the held word ----------
    const line = "The update didn't say when the change takes effect.";
    const role = "lead", W = 900;
    const pad = Math.max(26, S.pack.type[role][0] * 0.9) + 22;
    const F = kit.fit(line, { role, w: W - 2 * pad, maxLines: 2 });
    const bw = Math.max(F.width + 2 * pad, 160);
    const termCx = term.x + (F.height > 0 ? 0 : 0), termTop = term.y;
    const cy = termTop + word.height / 2;                       // the thought's middle sits on the word's middle
    const bx = term.x - pad + bw / 2;                           // its text starts where the word starts
    // @form speech_bubble: a rounded bubble with a tail carrying one spoken or recalled line
    const bub = T.bubble(ctx, "thought", { parent: blk, x: bx, y: cy, w: W, text: line, kind: "thought", fill: "surface", role, align: "left", maxLines: 2, tail: [MX - 62 - sx, 520 - sy], t: tForm });
    blk.insertBefore(bub.outer, term.outer);                    // the word stays on top of the thought
    void termCx;

    // the line writes in where the word was, along the two phrases (a pure function of time)
    const tn = bub.inner.querySelector("text"), spans = Array.from(tn.querySelectorAll("tspan")), full = spans.map((s) => s.textContent);
    const total = full.reduce((a, s) => a + s.length, 0);
    const N1 = Math.round(total * line.indexOf("when") / line.length);
    const dA = 1.5, dB = 1.35, tEnd = tB + dB;
    Loom.drive((e, raw) => {
      const t = tA + raw * (tEnd - tA), cl = (v) => Math.max(0, Math.min(1, v));
      const n = Math.round(t < tB ? N1 * cl((t - tA) / dA) : N1 + (total - N1) * cl((t - tB) / dB));
      let k = n;
      spans.forEach((s, i) => { const c = Math.max(0, Math.min(full[i].length, k)); s.textContent = full[i].slice(0, c); k -= full[i].length; });
    }, tA, tEnd - tA, "linear", { kind: "typewriter", beat: ctx.beat.id, name: "newline", content: true });
    m.drift(bub, tForm + 0.8, ctx.end, { amp: 3, period: 3 });

    // ---------- the strike: one ink stroke through the word, then both fade ----------
    const strike = ctx.el("strike", { parent: blk, x: term.x, y: term.y, w: wordW + 24, h: 120, kind: "shape", exit: "recede" });
    // @form strike_out_stroke: one hand-drawn stroke struck across an item to cancel it
    const yb = base - size * 0.3;
    svg("path", { d: `M-10 ${f(yb + 5)} Q${f(wordW * 0.5)} ${f(yb - 7)} ${f(wordW + 12)} ${f(yb - 3)}`, fill: "none", stroke: S.c("ink"), "stroke-width": 6, "stroke-linecap": "round" }, strike.inner);
    m.draw(strike, tStrike, { dur: 0.45, content: true });
    Loom.hold.heat(term, tStrike + 0.35, { from: "accent2", to: "surface", dur: 0.9, name: "term" });
    Loom.tween(strike.mover, { opacity: 1 }, { opacity: 0, duration: 0.8, ease: Loom.ease.exit }, tStrike + 0.7, { kind: "fade", beat: ctx.beat.id, name: "strike", content: true });
    // the cooled word must leave too: heated to the surface colour it stayed ON TOP of the new line and ate its
    // letters ("upda e", "change takes effect" half gone; seen on the sheet, missed by the checks; L-165)
    Loom.tween(term.mover, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: Loom.ease.exit }, tStrike + 1.0, { kind: "fade", beat: ctx.beat.id, name: "term" });
  },
});
