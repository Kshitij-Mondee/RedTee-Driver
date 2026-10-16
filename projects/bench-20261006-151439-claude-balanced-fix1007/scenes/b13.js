// @design fade_and_stay: three thought bubbles drift out of a solid frame and fade, the frame stays
// Treatments: (1) static frame with labels signalled; (2) bubbles drift out one by one and fade (chosen: motion shows what the camera cannot keep); (3) bubbles pop and burst.
Loom.scene("b13", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const frame = ctx.held("viewfinder_frame");
    ctx.held("captions");
    const words = [
      { name: "attitude_bubble", label: "Attitude", cue: ctx.cue("dismissive attitude"), x: 560, y: 520, dx: -260, dy: -230 },
      { name: "motive_bubble", label: "Motive", cue: ctx.cue("motive"), x: 900, y: 500, dx: 20, dy: -280 },
      { name: "intent_bubble", label: "Intent", cue: ctx.cue("intent"), x: 1240, y: 520, dx: 300, dy: -230 }
    ];
    ctx.cue("None of them are observations");
    ctx.cue("The camera never records");
    const w = 300, h = 150;
    words.forEach((b, i) => {
      const E = ctx.el(b.name, { x: b.x, y: b.y, w, h, kind: "bubble", exit: "none" });
      // @form thought_bubble: unobservable inner state
      kit.path(E.inner, "M150 8 C230 8 292 40 292 78 C292 116 230 142 150 142 C70 142 8 116 8 78 C8 40 70 8 150 8 Z", { fill: ctx.c("surface"), stroke: ctx.c("ink"), sw: 4 });
      kit.text(E.inner, b.label, { role: "label", x: 20, y: 30, w: 260, h: 90, align: "center", valign: "middle", color: "ink" });
      E.life.style.opacity = 0;
      const t0 = b.cue;
      const dur = ctx.style.dur("enter") || 0.4;
      Loom.tween(E.life, { opacity: 0 }, { opacity: 1 }, t0, { dur });
      m.travel(E, t0, { x: b.x + b.dx, y: b.y + b.dy });
      Loom.tween(E.life, { opacity: 1 }, { opacity: 0 }, t0 + 1.0, { dur: 1.0 });
      E.exit = "none";
    });
  }
});
