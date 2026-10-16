// @design detail_callout_sheet: one part of a drawing circled and drawn again larger beside it, as a drafting sheet does ("DETAIL A"), with the sheet's title block
// @lab {"title": "blueprint example: a detail callout (circle, leader, enlarged view) and a title block", "styles": ["blueprint"], "dur": 16.0, "fx": {}, "times": [2.2, 5.0, 8.0, 10.6, 13.2, 15.6], "words": [{"w": "Here", "s": 0.5, "e": 0.9}, {"w": "is", "s": 0.94, "e": 1.28}, {"w": "the", "s": 1.32, "e": 1.69}, {"w": "whole", "s": 1.73, "e": 2.16}, {"w": "service", "s": 2.2, "e": 2.69}, {"w": "Look", "s": 3.03, "e": 3.43}, {"w": "closer", "s": 3.47, "e": 3.93}, {"w": "at", "s": 3.97, "e": 4.31}, {"w": "the", "s": 4.35, "e": 4.72}, {"w": "queue", "s": 4.76, "e": 5.19}, {"w": "in", "s": 5.23, "e": 5.57}, {"w": "front", "s": 5.61, "e": 6.04}, {"w": "of", "s": 6.08, "e": 6.42}, {"w": "it", "s": 6.46, "e": 6.8}, {"w": "Each", "s": 7.14, "e": 7.54}, {"w": "request", "s": 7.58, "e": 8.07}, {"w": "waits", "s": 8.11, "e": 8.54}, {"w": "its", "s": 8.58, "e": 8.95}, {"w": "turn", "s": 8.99, "e": 9.39}, {"w": "here", "s": 9.43, "e": 9.83}, {"w": "and", "s": 10.17, "e": 10.54}, {"w": "when", "s": 10.58, "e": 10.98}, {"w": "the", "s": 11.02, "e": 11.39}, {"w": "queue", "s": 11.43, "e": 11.86}, {"w": "is", "s": 11.9, "e": 12.24}, {"w": "full", "s": 12.28, "e": 12.68}, {"w": "new", "s": 13.02, "e": 13.39}, {"w": "requests", "s": 13.43, "e": 13.95}, {"w": "are", "s": 13.99, "e": 14.36}, {"w": "turned", "s": 14.4, "e": 14.86}, {"w": "away", "s": 14.9, "e": 15.3}], "_timing": "estimated from the narration at about 180 wpm (no TTS run); a composed lesson uses the real word timings"}
/* Style example for blueprint (docs/styles/guides/blueprint.md, recipe R2). Not a lesson beat. Narration (hypothetical,
 * nothing to ground): "Here is the whole service. Look closer at the queue in front of it. Each request waits its turn
 * here, and when the queue is full, new requests are turned away."
 * What it shows, per the guide:
 *   - the detail callout: a narrow circle on the part, a leader to an enlarged view with its own frame and a mono
 *     "DETAIL A" note, so a close look never loses the whole (s4, s6);
 *   - centre lines (chain dashes) only where they mean "the axis of this part" (s4);
 *   - the title block: bottom right, above the caption band, small mono text, drawn once, kept (s6);
 *   - amber only for the measure (the queue's size), coral only for the refused request (s2).
 * Real APIs only: ctx.el, kit.rect, kit.text, kit.line, kit.disc, kit.arrow, m.draw, m.reveal, Loom.svg, Loom.tween,
 * Loom.treat.label, ctx.cue.
 */
Loom.scene("style_blueprint_detail_callout", {
  build(ctx) {
    const { kit, m } = ctx;
    const tWhole = ctx.cue("the whole service");
    const tCloser = ctx.cue("Look closer at the queue");
    const tWait = ctx.cue("waits its turn");
    const tFull = ctx.cue("the queue is full");
    const tAway = ctx.cue("turned away");
    const draw = ctx.style.dur("draw");
    const show = (E, t) => m.reveal(E, t, { dy: 0, dur: 0.01 });
    const fade = (n, t, name, d) => Loom.tween(n, { opacity: 0 }, { opacity: 1, duration: d || 0.3 }, t, { kind: "reveal", beat: ctx.beat.id, name });

    // the whole: a service box with a queue in front of it (five slots), drawn wide
    const svc = ctx.el("service", { x: 200, y: 330, w: 520, h: 300, kind: "card" });
    m.draw(kit.rect(svc.inner, 0, 0, 520, 300, { fill: "surface", r: 4 }), tWhole - 0.4, { dur: draw });
    const svcName = kit.text(svc.inner, "orders service", { role: "label", x: 20, y: 236, w: 480, h: 48, align: "center", valign: "middle", maxLines: 1 });
    fade(svcName, tWhole + 0.5, "service");
    const slots = [];
    for (let i = 0; i < 5; i++) slots.push(kit.rect(svc.inner, 60 + i * 84, 110, 64, 64, { fill: "surface2", r: 2 }));
    slots.forEach((r, i) => m.draw(r, tWhole + 0.2 + i * 0.08, { dur: 0.6 }));
    // its centre line: a chain line through the queue's axis
    const cl = kit.line(svc.inner, 30, 142, 490, 142, { stroke: "muted", sw: 1.25, dash: "26 7 5 7" });
    m.draw(cl, tWhole + 0.6, { dur: 0.8 });
    show(svc, tWhole - 0.4);

    // the callout: a narrow circle on the queue, a leader to the enlarged view
    const call = ctx.el("callout_a", { x: 230, y: 380, w: 460, h: 140, kind: "mark" });
    const ring = Loom.svg("ellipse", { cx: 230, cy: 70, rx: 228, ry: 68, fill: "none", stroke: Loom.style.c("accent"), "stroke-width": 1.5 }, call.inner);
    m.draw(ring, tCloser, { dur: 0.7 });
    show(call, tCloser);
    const lead = ctx.el("callout_a_leader", { x: 680, y: 260, w: 330, h: 200, kind: "connector" });
    m.draw(kit.line(lead.inner, 10, 190, 320, 20, { stroke: "accent", sw: 1.25 }), tCloser + 0.4, { dur: 0.5 });
    show(lead, tCloser + 0.4);

    // the enlarged view: its own frame, the slots drawn again three times as large, a DETAIL A note
    const det = ctx.el("detail_a", { x: 1000, y: 150, w: 720, h: 380, kind: "card" });
    m.draw(kit.rect(det.inner, 0, 0, 720, 380, { fill: "surface", r: 4 }), tCloser + 0.7, { dur: draw });
    const big = [];
    for (let i = 0; i < 5; i++) big.push(kit.rect(det.inner, 40 + i * 132, 120, 112, 112, { fill: "surface2", r: 3 }));
    big.forEach((r, i) => m.draw(r, tCloser + 1.0 + i * 0.07, { dur: 0.6 }));
    const note = kit.text(det.inner, "DETAIL A  (x3)", { role: "label", x: 24, y: 18, w: 400, h: 44, maxLines: 1, color: "accent" });
    fade(note, tCloser + 1.2, "detail_a");
    show(det, tCloser + 0.7);

    // waiting requests fill the slots one by one (amber tokens), the size as a dimension under them
    const fill = big.map((_, i) => { const d = kit.disc(det.inner, 96 + i * 132, 176, 30, { fill: "accent2" }); Loom.set(d, { opacity: 0 }, 0); return d; });
    fill.forEach((d, i) => fade(d, tWait + i * 0.35, "detail_a", 0.25));
    const dimE = ctx.el("dim_queue", { x: 1040, y: 392, w: 640, h: 96, kind: "label" });   // under the slots, inside the detail frame
    [kit.line(dimE.inner, 0, 0, 0, 48, { stroke: "muted", sw: 1.25 }), kit.line(dimE.inner, 640, 0, 640, 48, { stroke: "muted", sw: 1.25 }),
     kit.line(dimE.inner, 0, 36, 640, 36, { stroke: "muted", sw: 1.25 })].forEach((L, i) => m.draw(L, tFull - 0.3 + i * 0.05, { dur: 0.5 }));
    const size = kit.text(dimE.inner, "5 slots", { role: "label", x: 240, y: 46, w: 160, h: 40, align: "center", valign: "middle", maxLines: 1, color: "accent2" });
    fade(size, tFull + 0.2, "dim_queue");
    show(dimE, tFull - 0.3);

    // the sixth request is refused: a coral token stops at the frame and a note says so
    const late = ctx.el("request_refused", { x: 1750, y: 236, w: 60, h: 60, kind: "token" });
    kit.disc(late.inner, 30, 30, 26, { fill: "accent3" });
    m.reveal(late, tAway - 0.5, { dy: 0 });
    Loom.treat.label(ctx, "note_refused", { x: 1640, y: 640, text: "refused", to: [1780, 300], tone: "accent3", t: tAway });

    // the title block: bottom right, above the caption band, drawn once and kept
    const tb = ctx.el("title_block", { x: 1360, y: 760, w: 440, h: 150, kind: "panel" });
    m.draw(kit.rect(tb.inner, 0, 0, 440, 150, { fill: "surface", r: 0 }), tWhole - 0.6, { dur: draw });
    m.draw(kit.line(tb.inner, 0, 64, 440, 64, { stroke: "line", sw: 1.25 }), tWhole - 0.3, { dur: 0.4 });
    m.draw(kit.line(tb.inner, 260, 64, 260, 150, { stroke: "line", sw: 1.25 }), tWhole - 0.2, { dur: 0.4 });
    const tt = kit.text(tb.inner, "QUEUE BEFORE A SERVICE", { role: "label", x: 18, y: 10, w: 404, h: 46, valign: "middle", maxLines: 1 });
    const t1 = kit.text(tb.inner, "SHEET 2 OF 4", { role: "caption", x: 18, y: 76, w: 230, h: 60, valign: "middle", maxLines: 1, color: "muted" });
    const t2 = kit.text(tb.inner, "SCALE 1:1", { role: "caption", x: 276, y: 76, w: 150, h: 60, valign: "middle", maxLines: 1, color: "muted" });
    [tt, t1, t2].forEach((n, i) => fade(n, tWhole + i * 0.1, "title_block"));
    show(tb, tWhole - 0.6);
  },
});
