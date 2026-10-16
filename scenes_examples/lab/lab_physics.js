// @lab {"title": "Loom.physics (Matter.js, baked once, replayed frame-exactly): requests pile into a full queue; a stack of tasks topples when one more lands. Sample words only", "styles": ["corporate-clean", "story-cartoon"], "dur": 7.0, "times": [0.6, 1.6, 2.6, 3.6, 4.8, 6.8]}
// A lab scene for Loom.physics. Left: a queue fills, card by card, and the pile is the picture of the backlog.
// Right: a tidy stack of five tasks; a sixth arrives from the side and the stack topples.
Loom.scene("lab_physics", {
  build(ctx) {
    const { kit } = ctx;
    // left: the queue, drawn as a tray; its walls are the world's walls
    const Q = { x: 120, y: 160, w: 760, h: 760 };
    const tray = ctx.el("queue_tray", { x: Q.x - 14, y: Q.y + 200, w: Q.w + 28, h: Q.h - 186, kind: "set", exit: "none" });
    kit.rect(tray.inner, 0, 0, Q.w + 28, Q.h - 186, { fill: "field2", stroke: "line", r: 18 });
    kit.text(tray.inner, "Requests waiting", { x: 24, y: 14, w: 520, h: 56, role: "label", color: "muted" });
    const q = Loom.physics.world(ctx, "queue", { x: Q.x, y: Q.y, w: Q.w, h: Q.h, t: 0.2, seconds: 6.2, seed: 11 });
    const words = ["Access", "Refund", "Invoice", "Laptop", "Report", "Login", "Update", "Order", "Badge", "Quote", "Leave", "Travel"];
    words.forEach((wd, i) => {
      q.body(`req_${i}`, {
        shape: "rect", w: 200, h: 74, x: 140 + ((i * 197) % 480), y: -60 - (i % 3) * 30, angle: ((i % 5) - 2) * 0.12,
        at: 0.25 + i * 0.32, restitution: 0.1, friction: 0.6, chamfer: 10,
        draw: (g, W, H) => {
          kit.rect(g, 0, 0, W, H, { fill: i === 11 ? "accent" : "surface", stroke: "line", r: 12 });
          kit.text(g, wd, { x: 12, y: 0, w: W - 24, h: H, role: "label", align: "center", valign: "middle", color: i === 11 ? "onAccent" : "ink" });
        },
      });
    });
    q.run();
    // right: a stack that topples
    const S = { x: 1060, y: 220, w: 760, h: 700 };
    const floor = ctx.el("stack_floor", { x: S.x, y: S.y + S.h - 6, w: S.w, h: 12, kind: "set", exit: "none" });
    kit.rect(floor.inner, 0, 0, S.w, 12, { fill: "line", r: 6 });
    const st = Loom.physics.world(ctx, "stack", { x: S.x, y: S.y, w: S.w, h: S.h, t: 2.6, seconds: 4.2, seed: 5, walls: { floor: true, left: false, right: true } });
    for (let i = 0; i < 5; i++) {
      st.body(`task_${i}`, {
        shape: "rect", w: 230, h: 90, x: 380, y: S.h - 45 - i * 91, at: 2.6, friction: 0.7, density: 0.002,
        draw: (g, W, H) => {
          kit.rect(g, 0, 0, W, H, { fill: "surface", stroke: "ink", r: 10 });
          kit.text(g, `Task ${i + 1}`, { x: 10, y: 0, w: W - 20, h: H, role: "label", align: "center", valign: "middle", color: "ink" });
        },
      });
    }
    st.body("one_more", {
      shape: "circle", r: 54, x: -60, y: S.h - 400, vx: 12, vy: -2, at: 3.6, density: 0.02, restitution: 0.2,
      draw: (g, W, H) => {
        kit.disc(g, W / 2, H / 2, W / 2 - 2, { fill: "accent" });
        kit.text(g, "+1", { x: 0, y: 0, w: W, h: H, role: "label", align: "center", valign: "middle", color: "onAccent" });
      },
    });
    st.run();
  },
});
