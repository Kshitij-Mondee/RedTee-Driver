// @design split_two_desks: the frame cut in two, the same sign-in page on both desks, so the outcome is read on the other screen
/* b02 - the password leaks; someone else types it far away; it opens for them too.
 * Treatments considered: (A) a dashed line from a laptop to a door (rejected: the old lesson's diagram, the viewer has
 * to learn its grammar); (B) a map with a pin far away (rejected: the place does not matter, the screen does);
 * (C) CHOSEN: the split. Left, Maya's laptop at Welcome; right, an ordinary person seen from behind at a monitor on the
 * same sign-in page. The password leaves Maya's side as a chip, labelled leaked from another site, and lands in the
 * other page's field; the dots type; the other page opens on Welcome, Maya.
 * Beat sheet: "leaked from another site" the chip and its tag | "Someone else types it" the dots on the right |
 * "It opens for them too" the right page cuts to Welcome, Maya.
 * HELD by b03-b05: split_bg_1, label_maya_1, portrait_maya_1, label_other_1, lap_1, screen_maya, mon_1, screen_other,
 * thief_1, phone_1.
 */
Loom.scene("b02", {
  build(ctx) {
    const M = Loom.mfa;
    const tLeak = ctx.cue("leaked from another site");
    const tTypes = ctx.cue("Someone else types it");
    const tOpen = ctx.cue("It opens for them too");
    const sp = M.split(ctx, "_1");
    M.laptop(ctx, "lap_1", sp.L);
    const L = M.signin(ctx, "screen_maya", Object.assign({}, sp.L, { state: "welcome" }));
    M.monitor(ctx, "mon_1", sp.R);
    const R = M.signin(ctx, "screen_other", Object.assign({}, sp.R, { state: "password" }));
    M.thief(ctx, "thief_1", { x: 1300, y: 700, scale: 1.35 });
    M.phone(ctx, "phone_1", { x: 70, y: 745, w: 180, h: 360, state: "dark" });
    void L;
    // the password leaves Maya's side and lands in the other page's password field
    const chip = M.chip(ctx, "leak_chip", "••••••••••", { size: 30, stroke: "neg", tracking: 2 });
    const from = [sp.L.x + 420, sp.L.y + 300], to = [sp.R.x + 64 + 170, sp.R.y + 302 + 31];
    const tFly = tLeak + 0.2;
    const land = M.fly(chip, tFly, 1.3, from, to, { lift: 120, keep: 0.1 });
    Loom.data.tag(ctx, "tag_leaked", { x: 440, y: 30, text: "leaked from another site", color: "neg", t: tLeak + 0.1 });
    const tType = Math.max(tTypes + 0.2, land + 0.05);
    const tDone = R.typePw(tType, 0.09);
    R.press(R.pwBtn, tDone + 0.2);
    R.state("welcome", Math.max(tOpen + 0.15, tDone + 0.45));
    Loom.sfx("tick", Math.max(tOpen + 0.2, tDone + 0.5));
  },
});
