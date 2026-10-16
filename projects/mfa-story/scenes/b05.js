// @design attempt_stops_at_wall: the same attempt runs again and stops at a step only the owner can pass
/* b05 - The thief tries again. The password works. Then, enter the code. The code is on Maya's phone. They stop.
 * Treatments considered: (A) a lock icon closing (rejected: a symbol instead of the thing); (B) CHOSEN: the veil lifts;
 * the other page goes back to the password, the dots type, it cuts to Enter the code with empty boxes and a blinking
 * caret; across the divider Maya's phone lights with a code she did not ask for; on "They stop" a red outline closes
 * round the empty boxes.
 */
Loom.scene("b05", {
  build(ctx) {
    const M = Loom.mfa;
    const H = M.hold(ctx, M.splitNames("_1").concat(["lap_1", "screen_maya", "mon_1", "screen_other", "thief_1", "phone_1", "veil_right"]));
    const tTries = ctx.cue("The thief tries again");
    const tWorks = ctx.cue("The password works");
    const tPhone = ctx.cue("The code is on Maya's phone");
    const tStop = ctx.cue("They stop");
    H.veil_right.off(tTries - 0.1);
    const R = H.screen_other, ph = H.phone_1;
    R.state("password", tTries + 0.2);
    R.clearPw(tTries + 0.2);
    const tDone = R.typePw(tTries + 0.5, 0.08);
    R.press(R.pwBtn, Math.max(tDone + 0.1, tWorks + 0.2));
    R.state("code", Math.max(tDone + 0.35, tWorks + 0.6));
    R.codeWait(Math.max(tDone + 0.6, tWorks + 0.9), ctx.end);
    ph.state("dark", tTries);
    ph.state("code", tPhone + 0.1);
    ph.buzz(tPhone + 0.1);
    M.ring(ctx, "stop_ring", { x: 1030 + 64, y: 130 + 66 + 92 + 122, w: 620, h: 78 }, tStop + 0.05, { tone: "neg", pad: 14 });
    Loom.sfx("error", tStop + 0.1);
  },
});
