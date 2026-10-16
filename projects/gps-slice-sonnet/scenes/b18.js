// @design hidden_assumption_breaks: a small clock badge appears beside the point, ticks steadily, then its hands jump off and the point flickers while the view pushes in
// Treatments: (1) static badge beside point; (2) badge pops, ticks, hands jump off, point flickers, slow push (chosen: the assumption is shown then broken); (3) split before/after.
Loom.scene("b18", {
  build(ctx) {
    const { m } = ctx;
    const S = (tag, a, p) => Loom.svg(tag, a, p);
    const PHONE = { x: 960, y: 812 };
    const tA = ctx.cue("Because all of this assumed");
    const tB = ctx.cue("knows the exact time");
    const tC = ctx.cue("It doesn't");

    // the push: every piece of the stage scales about the phone point, which stays exactly where it is
    const SC = 1.12;
    const push = (E, t, dur) => {
      Loom.drive((e) => {
        const s = 1 + (SC - 1) * e;
        E.outer.setAttribute("transform", "translate(" + (PHONE.x * (1 - s)).toFixed(2) + " " + (PHONE.y * (1 - s)).toFixed(2) + ") scale(" + s.toFixed(4) + ") translate(" + E.x + " " + E.y + ")");
      }, t, dur, "linear");
    };
    const held = [];
    ["ground", "phone_pt", "sats", "circle_a", "circle_b", "circle_c", "pts", "ground_mark", "space_pt"].forEach((n) => {
      let h = null; try { h = ctx.held(n); } catch (e) { h = null; }
      if (h) held.push(h);
    });

    // phone_clock: the quartz clock badge beside the point
    const SZ = 92;
    const CX = 1090, CY = 736;
    const pc = ctx.el("phone_clock", { x: CX - SZ / 2 - 30, y: CY - SZ / 2 - 30, w: SZ + 60, h: SZ + 60, kind: "instrument", exit: "recede" });
    const holder = S("g", { transform: "translate(30 30)" }, pc.inner);
    const clk = Loom.lesson.clock_face(ctx, holder, { size: SZ, finish: "quartz" });
    const ringA = S("circle", { cx: 30 + SZ / 2, cy: 30 + SZ / 2, r: SZ / 2 + 8, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, opacity: 0 }, pc.inner);
    m.pop(pc, tA);
    clk.run(tA, ctx.end, 2);
    clk.setState("off", tC, { deg: 80 });
    Loom.drive((e) => { ringA.setAttribute("opacity", 0.9 * e); ringA.setAttribute("r", SZ / 2 + 8 + 6 * Math.sin(e * Math.PI)); }, tC, 0.5, "move");

    const tP = ctx.start + 0.1, dP = ctx.end - tP;
    held.forEach((h) => push(h, tP, dP));
    push(pc, tP, dP);

    // the point flickers on "It doesn't"
    const pp = ctx.held("phone_pt");
    Loom.drive((e) => {
      const f = e < 1 ? 1 - 0.65 * Math.abs(Math.sin(e * Math.PI * 4)) * (1 - 0.3 * e) : 1;
      pp.inner.setAttribute("opacity", f.toFixed(3));
    }, tC + 0.1, 1.1, "linear");
  },
});
