// @lab {"title": "whiteboard ENGINE (D-179): the same handover, every mark and word drawn by the engine", "styles": ["whiteboard"], "dur": 16.2, "times": [2.0, 4.0, 6.1, 8.1, 10.1, 12.1, 14.2], "words": [{"w": "Say", "s": 0.4, "e": 0.61}, {"w": "you", "s": 0.65, "e": 0.86}, {"w": "hand", "s": 0.9, "e": 1.14}, {"w": "over", "s": 1.18, "e": 1.42}, {"w": "an", "s": 1.46, "e": 1.64}, {"w": "open", "s": 1.68, "e": 1.92}, {"w": "ticket", "s": 1.96, "e": 2.26}, {"w": "at", "s": 2.3, "e": 2.48}, {"w": "six", "s": 2.52, "e": 2.73}, {"w": "Write", "s": 3.02, "e": 3.29}, {"w": "what", "s": 3.33, "e": 3.57}, {"w": "is", "s": 3.61, "e": 3.79}, {"w": "done", "s": 3.83, "e": 4.07}, {"w": "Then", "s": 4.36, "e": 4.6}, {"w": "what", "s": 4.64, "e": 4.88}, {"w": "is", "s": 4.92, "e": 5.1}, {"w": "still", "s": 5.14, "e": 5.41}, {"w": "open", "s": 5.45, "e": 5.69}, {"w": "Then", "s": 5.98, "e": 6.22}, {"w": "who", "s": 6.26, "e": 6.47}, {"w": "owns", "s": 6.51, "e": 6.75}, {"w": "it", "s": 6.79, "e": 6.97}, {"w": "now", "s": 7.01, "e": 7.22}, {"w": "That", "s": 7.51, "e": 7.75}, {"w": "last", "s": 7.79, "e": 8.03}, {"w": "line", "s": 8.07, "e": 8.31}, {"w": "is", "s": 8.35, "e": 8.53}, {"w": "the", "s": 8.57, "e": 8.78}, {"w": "one", "s": 8.82, "e": 9.03}, {"w": "people", "s": 9.07, "e": 9.37}, {"w": "skip", "s": 9.41, "e": 9.65}, {"w": "so", "s": 9.79, "e": 9.97}, {"w": "circle", "s": 10.01, "e": 10.31}, {"w": "it", "s": 10.35, "e": 10.53}, {"w": "Now", "s": 10.82, "e": 11.03}, {"w": "the", "s": 11.07, "e": 11.28}, {"w": "handover", "s": 11.32, "e": 11.68}, {"w": "holds", "s": 11.72, "e": 11.99}, {"w": "overnight", "s": 12.03, "e": 12.42}, {"w": "and", "s": 12.56, "e": 12.77}, {"w": "nobody", "s": 12.81, "e": 13.11}, {"w": "has", "s": 13.15, "e": 13.36}, {"w": "to", "s": 13.4, "e": 13.58}, {"w": "guess", "s": 13.62, "e": 13.89}, {"w": "in", "s": 13.93, "e": 14.11}, {"w": "the", "s": 14.15, "e": 14.36}, {"w": "morning", "s": 14.4, "e": 14.73}], "_timing": "estimated from the narration at about 180 wpm (no TTS run); a composed lesson uses the real word timings"}
/* The whiteboard engine's lab scene (D-179): the shift handover of style_whiteboard_handover.js drawn through
 * ctx.engine, same narration, same layout, so the two are compared within the style (D-122). Every line, box, arrow
 * and word is written by the marker in speech order; the words finish on their spoken cue. */
Loom.scene("wb_engine_handover", {
  build(ctx) {
    const { kit, m } = ctx;
    const W = ctx.engine, B = W.board(ctx);

    // ---- 1. the title, written as the speech starts
    const T0 = ctx.speechStart + 0.1;
    const title = ctx.el("title", { x: 120, y: 96, w: 1100, h: 116, kind: "text", exit: "wipe" });
    let t = B.write(title, "A handover that holds", { role: "title", at: T0, by: ctx.cue("open ticket") - 0.5 });
    const ul = ctx.el("title_rule", { x: 120, y: 214, w: 640, h: 16, kind: "mark", exit: "recede" });
    t = B.draw(ul, W.underline(0, 620, 6), { at: t + 0.05, pen: "accent" });

    // ---- 2. the person: a designed bust over a drawn desk line
    const desk = ctx.el("desk", { x: 110, y: 560, w: 420, h: 20, kind: "scenery", exit: "recede" });
    B.draw(desk, W.line(0, 10, 420, 8), { at: t + 0.05 });   // after the title: one hand, in drawing order
    const person = ctx.el("person", { x: 140, y: 230, w: 360, h: 340, kind: "character", exit: "recede" });
    kit.peep(person.inner, "woman", "explaining", { x: 180, y: 170, size: 340 });
    m.reveal(person, T0 + 0.45, { dy: 0 });

    // ---- 3. "an open ticket": box, then its words
    const tTicket = ctx.cue("open ticket");
    const ticket = ctx.el("ticket", { x: 140, y: 650, w: 380, h: 150, kind: "card", exit: "recede" });
    t = B.draw(ticket, W.roundRect(0, 0, 380, 150, 16), { at: tTicket - 0.35, by: tTicket + 0.3 });
    const tw = ctx.el("ticket_words", { x: 170, y: 672, w: 320, h: 106, kind: "text", exit: "wipe" });
    B.write(tw, "Open at 6 pm", { role: "lead", at: t, by: ctx.cue("six") + 0.5 });

    // ---- 4. three lines, each on its words: arrow from the ticket, the box, the words
    const rows = [
      { key: "done", text: "What is done", y: 290, t: ctx.cue("what is done"), tick: true },
      { key: "open", text: "What is still open", y: 465, t: ctx.cue("still open") },
      { key: "owner", text: "Who owns it now", y: 640, t: ctx.cue("who owns it now") },
    ];
    const RX = 790, RH = 130, BOX = 76;
    rows.forEach((r) => {
      const ax0 = 530, ay0 = 725, ax1 = RX - 18, ay1 = r.y + RH / 2;
      const link = ctx.el("link_" + r.key, { x: ax0 - 12, y: Math.min(ay0, ay1) - 40, w: ax1 - ax0 + 24, h: Math.abs(ay1 - ay0) + 80, kind: "connector", exit: "recede" });
      const lx = (v) => v - (ax0 - 12), ly = (v) => v - (Math.min(ay0, ay1) - 40);
      let tt = B.draw(link, W.arrow(lx(ax0), ly(ay0), lx(ax1), ly(ay1), { bend: r.key === "open" ? 0 : (r.key === "done" ? -40 : 30) }), { at: r.t - 0.4, dur: 0.4 });
      const row = ctx.el("row_" + r.key, { x: RX, y: r.y, w: BOX + 20, h: RH, kind: "row", exit: "recede" });
      tt = B.draw(row, W.rect(0, (RH - BOX) / 2, BOX, BOX).concat(r.tick ? W.tick(16, RH / 2 + 2, 46) : []), { at: tt, dur: r.tick ? 0.5 : 0.35 });
      const words = ctx.el("row_" + r.key + "_words", { x: RX + 112, y: r.y + 24, w: 588, h: 84, kind: "text", exit: "wipe" });
      B.write(words, r.text, { role: "lead", at: tt });
    });

    // ---- 5. a quiet note under the third line, in the muted pen
    const note = ctx.el("skip_note", { x: RX + 112, y: 800, w: 520, h: 56, kind: "label", exit: "wipe" });
    B.write(note, "the line people skip", { role: "label", at: ctx.cue("people skip"), pen: "muted" });

    // ---- 6. "circle it": the one accent of the scene
    const cx = RX + 330, cy = 640 + RH / 2;
    const circle = ctx.el("owner_circle", { x: cx - 420, y: cy - 120, w: 840, h: 240, kind: "mark", exit: "recede" });
    B.draw(circle, W.ellipse(420, 120, 400, 92), { at: ctx.cue("circle it"), pen: "accent", sound: true });

    // ---- 7. "holds overnight": an arrow out of the circle, then the words
    const tH = ctx.cue("holds overnight");
    const out = ctx.el("holds_link", { x: cx + 400, y: 470, w: 330, h: 260, kind: "connector", exit: "recede" });
    const t7 = B.draw(out, W.arrow(10, 230, 300, 40, { bend: -30 }), { at: tH - 0.4, dur: 0.4 });
    const holds = ctx.el("holds_words", { x: 1520, y: 380, w: 300, h: 70, kind: "text", exit: "wipe" });
    B.write(holds, "Holds overnight", { role: "lead", at: t7, align: "center" });
  },
});
