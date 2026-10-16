// @design one_side_acts: the other side of the split steps back while one side shows a step
/* b04 - So Maya adds a second step: a code from her phone.
 * Treatments considered: (A) a phone icon beside a password icon (rejected: icons for things we can show working);
 * (B) CHOSEN: the other desk steps back under a veil; Maya's page returns to the password (already typed), the button
 * is pressed, it cuts to Enter the code; her phone lights with 482 913 and buzzes; the digits type in; Welcome.
 */
Loom.scene("b04", {
  build(ctx) {
    const M = Loom.mfa;
    const H = M.hold(ctx, M.splitNames("_1").concat(["lap_1", "screen_maya", "mon_1", "screen_other", "thief_1", "phone_1"]));
    const tStep = ctx.cue("adds a second step");
    const tCode = ctx.cue("a code from her phone");
    const veil = M.veil(ctx, "veil_right", "R");
    veil.on(tStep - 0.1);
    const L = H.screen_maya, ph = H.phone_1;
    L.state("password", tStep + 0.05);
    L.press(L.pwBtn, tStep + 0.5);
    L.state("code", tStep + 0.75);
    ph.state("code", tCode + 0.05);
    ph.buzz(tCode + 0.05);
    const tEnd = L.typeCode(tCode + 0.6, 0.12);
    L.state("welcome", Math.min(ctx.end - 0.15, tEnd + 0.3));
  },
});
