// @design refuse_and_close: the owner refuses on her device and the other screen reads the refusal
/* b18 - Someone has her password, and wants a tap. She denies it, and shares no code.
 * Treatments considered: (A) a shield over the phone (rejected: a symbol for the tap she makes); (B) CHOSEN: Approve
 * pulses once (the tap they want); her thumb presses Deny; the stacked prompts fall away and the phone goes dark; the
 * other desk's page cuts to Sign-in denied.
 */
Loom.scene("b18", {
  build(ctx) {
    const M = Loom.mfa;
    const H = M.hold(ctx, M.splitNames("_4").concat(["phone_4", "mon_4", "real_page_4", "thief_4", "prompt_stack_1", "prompt_stack_2"]));
    const tWants = ctx.cue("wants a tap");
    const tDeny = ctx.cue("She denies it");
    const tCode = ctx.cue("shares no code");
    const ph = H.phone_4, R = H.real_page_4;
    Loom.tween(ph.approve, { scale: 1, transformOrigin: "50% 50%" }, { scale: 1.08, duration: 0.25, ease: Loom.ease.enter }, tWants + 0.1, { kind: "emphasis", beat: ctx.beat.id, name: "phone_4.approve" });
    Loom.tween(ph.approve, { scale: 1.08, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.3, ease: Loom.ease.exit }, tWants + 0.4, { kind: "emphasis", beat: ctx.beat.id, name: "phone_4.approve" });
    // her thumb on Deny
    Loom.tween(ph.deny, { scale: 1, transformOrigin: "50% 50%" }, { scale: 0.94, duration: 0.1, ease: "power2.out" }, tDeny + 0.1, { kind: "press", beat: ctx.beat.id, name: "phone_4.deny" });
    Loom.tween(ph.deny, { scale: 0.94, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.2, ease: "power2.out" }, tDeny + 0.2, { kind: "press", beat: ctx.beat.id, name: "phone_4.deny" });
    Loom.sfx("click", tDeny + 0.1);
    for (const n of ["prompt_stack_2", "prompt_stack_1"]) Loom.motion.exit(H[n], tDeny + 0.35, "recede");
    ph.state("dark", tDeny + 0.6);
    R.state("denied", tCode + 0.1);
    Loom.sfx("tick", tCode + 0.15);
  },
});
