// @lab {"title": "whiteboard ENGINE: a clean board, two faces (headings in the display face, every other word in the marker hand), nothing crossing a word", "styles": ["whiteboard"], "dur": 23.0, "times": [1.3, 4.0, 8.5, 12.5, 16.5, 22.6], "words": [{"w": "Two", "s": 0.58, "e": 0.87}, {"w": "questions", "s": 0.9, "e": 1.59}, {"w": "sort", "s": 1.65, "e": 2.03}, {"w": "every", "s": 2.09, "e": 2.46}, {"w": "request", "s": 2.52, "e": 3.19}, {"w": "Impact", "s": 3.77, "e": 4.35}, {"w": "runs", "s": 4.41, "e": 4.78}, {"w": "up", "s": 4.84, "e": 5.08}, {"w": "effort", "s": 5.22, "e": 5.8}, {"w": "across", "s": 5.86, "e": 6.52}, {"w": "Quick", "s": 7.25, "e": 7.68}, {"w": "wins", "s": 7.74, "e": 8.27}, {"w": "go", "s": 8.32, "e": 8.55}, {"w": "first", "s": 8.61, "e": 9.13}, {"w": "Major", "s": 9.71, "e": 10.15}, {"w": "projects", "s": 10.21, "e": 10.88}, {"w": "get", "s": 10.93, "e": 11.16}, {"w": "blocked", "s": 11.22, "e": 11.74}, {"w": "time", "s": 11.8, "e": 12.32}, {"w": "Fill-ins", "s": 13.05, "e": 13.78}, {"w": "batch", "s": 13.83, "e": 14.36}, {"w": "Thankless", "s": 17.48, "e": 18.2}, {"w": "tasks", "s": 18.26, "e": 18.64}, {"w": "wait", "s": 18.7, "e": 19.22}], "_timing": "estimated; a composed lesson uses the real word timings"}
/* The whiteboard engine's clean board (2026-10-15, after Kshitij on film A: "There are still overlaps ... the entire
 * canvas looks a lot messy"; then "Two faces"). How a board is drawn with the engine so it reads clean:
 *  - two faces only: the headings in the pack's display face (board.heading), every other word in the marker hand
 *    (board.write); the boxes, axes and dividers drawn by the same hand (board.draw);
 *  - one picture per idea: each zone's move has its Lucide icon, drawn by the hand (W.icon), its word beside it;
 *  - room around every word: a word never sits on a line (labels beside their box, not on its edge; a divider ends
 *    before a heading); the layout check now reports any line through a word;
 *  - few things at once: four headings, four cards and four short actions, nothing else.
 * Compare within the style only (D-122). */
Loom.scene("wb_engine_board", {
  build(ctx) {
    const W = ctx.engine, B = W.board(ctx);
    const T0 = ctx.speechStart + 0.05;

    // ---- the question, as a heading in the display face
    const title = ctx.el("title", { x: 120, y: 70, w: 1100, h: 90, kind: "text", exit: "wipe" });
    let t = B.heading(title, "Two questions sort every request", { role: "title", at: T0, by: ctx.cue("every request") });

    // ---- the axes: the hand draws them; their labels sit clear of the lines
    const axes = ctx.el("axes", { x: 160, y: 190, w: 1300, h: 760, kind: "mark", exit: "recede" });
    t = B.draw(axes, W.arrow(40, 740, 40, 20).concat(W.arrow(40, 740, 1280, 740)), { at: ctx.cue("Impact") - 0.3, by: ctx.cue("across") });
    const ly = ctx.el("label_impact", { x: 40, y: 160, w: 260, h: 50, kind: "label", exit: "wipe" });
    B.write(ly, "impact", { role: "label", at: t });
    const lx = ctx.el("label_effort", { x: 1300, y: 960, w: 220, h: 50, kind: "label", exit: "wipe" });
    B.write(lx, "effort", { role: "label", at: t + 0.5 });

    // ---- the dividers stop short of the headings
    const div = ctx.el("dividers", { x: 200, y: 200, w: 1260, h: 740, kind: "mark", exit: "recede" });
    B.draw(div, W.line(630, 120, 630, 720).concat(W.line(20, 380, 1240, 380)), { at: t + 0.9, dur: 0.6 });

    // ---- four zones: a heading, one card, one action each, placed in the zone's own space
    const zones = [
      { key: "quick", head: "Quick wins", card: "Client reply", act: "do first", icon: "zap", x: 240, y: 230, cue: "Quick", pen: "accent" },
      { key: "major", head: "Major projects", card: "Budget report", act: "block time", icon: "calendar-clock", x: 870, y: 230, cue: "Major" },
      { key: "fill", head: "Fill-ins", card: "Expenses", act: "batch", icon: "layers", x: 240, y: 610, cue: "batch" },
      { key: "thankless", head: "Thankless tasks", card: "Deck redesign", act: "wait", icon: "hourglass", x: 870, y: 610, cue: "Thankless" },
    ];
    for (const z of zones) {
      const tz = ctx.cue(z.cue);
      const h = ctx.el("head_" + z.key, { x: z.x, y: z.y, w: 520, h: 80, kind: "text", exit: "wipe" });
      let tt = B.heading(h, z.head, { role: "lead", size: 56, at: tz - 0.3, by: tz + 0.5, pen: z.pen });
      const c = ctx.el("card_" + z.key, { x: z.x, y: z.y + 100, w: 300, h: 96, kind: "card", exit: "recede" });
      tt = B.draw(c, W.roundRect(0, 0, 300, 96, 12), { at: tt, dur: 0.45 });
      B.write(c, z.card, { role: "body", at: tt, x: 20, y: 18, w: 260, h: 60, align: "center" });
      // one picture per idea: the move's icon (Lucide, drawn by the hand), its word beside it
      const ic = ctx.el("icon_" + z.key, { x: z.x + 325, y: z.y + 112, w: 72, h: 72, kind: "icon", exit: "recede" });
      tt = B.draw(ic, W.icon(z.icon, 0, 0, 72), { at: tz + 0.9, dur: 0.6, pen: z.pen });
      const a = ctx.el("act_" + z.key, { x: z.x + 410, y: z.y + 122, w: 150, h: 50, kind: "label", exit: "wipe" });
      B.write(a, z.act, { role: "label", at: tt, pen: z.pen });
    }
  },
});
