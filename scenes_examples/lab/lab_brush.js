// @lab {"title": "Loom.brush (p5.brush standalone, painted once, revealed in drawing order): pencil boxes, marker arrows, a watercolour wash on the step that matters, hatching on the risk. Sample words only", "styles": ["whiteboard", "editorial-paper", "story-cartoon"], "dur": 6.0, "times": [0.7, 1.6, 2.6, 3.6, 4.6, 5.8]}
// A lab scene for Loom.brush. The marks are painted by p5.brush when the scene is built; the timeline only wipes
// them in, in the order a hand would draw them. Words stay SVG text (kit.text), so they stay sharp and checked.
Loom.scene("lab_brush", {
  build(ctx) {
    const { kit } = ctx;
    const ink = ctx.c("ink"), acc = ctx.c("accent"), acc2 = ctx.c("accent2"), muted = ctx.c("muted");
    const X = 140, Y = 200, W = 1640, H = 640;
    const boxes = [[60, 200], [620, 200], [1180, 200]];
    Loom.brush.paint(ctx, "flow_marks", { x: X, y: Y, w: W, h: H, seed: 21, scale: 4.5, layers: [
      { at: 0.3, dur: 0.8, dir: "right", draw: (b) => { b.set("2B", ink, 1.3); b.noFill(); b.rect(boxes[0][0], boxes[0][1], 400, 220); } },
      { at: 1.0, dur: 0.6, dir: "right", draw: (b) => { b.set("marker", muted, 1.2); b.line(475, 310, 600, 310); b.line(570, 290, 600, 310); b.line(570, 330, 600, 310); } },
      { at: 1.5, reveal: "fade", dur: 0.7, draw: (b) => { b.fill(acc2, 120); b.fillBleed(0.12); b.noStroke(); b.rect(boxes[1][0] - 10, boxes[1][1] - 10, 420, 240); } },
      { at: 1.6, dur: 0.8, dir: "right", draw: (b) => { b.set("2B", ink, 1.3); b.noFill(); b.rect(boxes[1][0], boxes[1][1], 400, 220); } },
      { at: 2.5, dur: 0.6, dir: "right", draw: (b) => { b.set("marker", muted, 1.2); b.line(1035, 310, 1160, 310); b.line(1130, 290, 1160, 310); b.line(1130, 330, 1160, 310); } },
      { at: 3.0, dur: 0.8, dir: "right", draw: (b) => { b.set("2B", ink, 1.3); b.noFill(); b.rect(boxes[2][0], boxes[2][1], 400, 220); } },
      { at: 3.9, dur: 0.9, dir: "down", draw: (b) => { b.set("charcoal", acc, 1); b.noFill(); b.hatch(9, 0.7); b.circle(1380, 530, 80); b.noHatch(); } },
      { at: 4.8, dur: 0.6, dir: "right", draw: (b) => { b.set("pen", acc, 1.6); b.line(700, 450, 1040, 450); } },
    ] });
    const label = (name, txt, bx, by, t, w) => {
      const E = ctx.el(name, { x: X + bx + 24, y: Y + by + 70, w: w || 352, h: 80, kind: "label", exit: "recede" });
      kit.text(E.inner, txt, { x: 0, y: 0, w: w || 352, h: 80, role: "lead", align: "center", valign: "middle", color: "ink" });
      Loom.motion.reveal(E, t, { dy: 6 });
    };
    label("l_ask", "Ask", boxes[0][0], boxes[0][1], 0.9);
    label("l_check", "Check the facts", boxes[1][0], boxes[1][1], 2.2);
    label("l_act", "Act", boxes[2][0], boxes[2][1], 3.6);
    const risk = ctx.el("l_risk", { x: X + 1210, y: Y + 620, w: 340, h: 60, kind: "label", exit: "recede" });
    kit.text(risk.inner, "the risky step", { x: 0, y: 0, w: 340, h: 60, role: "label", color: "muted" });
    Loom.motion.reveal(risk, 4.5, { dy: 6 });
    const under = ctx.el("l_under", { x: X + 640, y: Y + 470, w: 460, h: 60, kind: "label", exit: "recede" });
    kit.text(under.inner, "the step that matters", { x: 0, y: 0, w: 460, h: 60, role: "label", align: "center", color: "muted" });
    Loom.motion.reveal(under, 5.2, { dy: 6 });
  },
});
