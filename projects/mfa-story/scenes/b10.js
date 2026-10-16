// @design relay_across_split: what one side types crosses the divider and lands in the other side's real page
/* b10 - Yes. The fake page passes on what she types, into the real site, while the code still works. The thief is in.
 * Treatments considered: (A) a pipe through the fake page (the old lesson's spliced box; rejected: abstract);
 * (B) CHOSEN: the question lifts; a chip of her password dots crosses the divider into the real page's field, then a
 * chip with her code into its boxes, and the real page on the other desk opens on Welcome, Maya.
 */
Loom.scene("b10", {
  build(ctx) {
    const M = Loom.mfa;
    const H = M.hold(ctx, M.splitNames("_2").concat(["lap_2", "fake_page", "big_addr", "mon_2", "real_page", "thief_2", "phone_2"]));
    const tPass = ctx.cue("passes on what she types");
    const tWorks = ctx.cue("while the code still works");
    const tIn = ctx.cue("The thief is in");
    Loom.tween(H.big_addr.mover, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "none" }, ctx.start + 0.1, { kind: "reveal", beat: ctx.beat.id, name: "big_addr.back" });
    const R = H.real_page, Lx = 70, Ly = 150, Rx = 1030, Ry = 130;
    const c1 = M.chip(ctx, "relay_pw", "••••••••••", { size: 30, stroke: "neg", tracking: 2 });
    const a1 = M.fly(c1, tPass + 0.1, 1.1, [Lx + 400, Ly + 330], [Rx + 64 + 170, Ry + 302 + 31], { lift: 140, keep: 0.05 });
    const t1 = R.typePw(a1 + 0.05, 0.03);
    R.press(R.pwBtn, t1 + 0.15);
    R.state("code", t1 + 0.4);
    const c2 = M.chip(ctx, "relay_code", "482 913", { size: 34, stroke: "neg", tracking: 3 });
    const a2 = M.fly(c2, Math.max(tWorks - 0.2, t1 + 0.6), 1.1, [Lx + 370, Ly + 320], [Rx + 370, Ry + 158 + 161], { lift: 140, keep: 0.05 });
    R.typeCode(a2 + 0.05, 0.05);
    R.state("welcome", Math.max(tIn + 0.1, a2 + 0.5));
    Loom.sfx("error", Math.max(tIn + 0.15, a2 + 0.55));
  },
});
