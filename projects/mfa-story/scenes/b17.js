// @design prompts_pile_up: one device receives the same request again and again while the other screen waits for a tap
/* b17 - One last turn. Maya's phone asks: is this you signing in? It is not. Then again, and again.
 * Treatments considered: (A) a bell icon with a count (rejected: a symbol); (B) CHOSEN: the split once more, with
 * Maya's phone large on the left (no laptop: she is not signing in); the other desk waits on Check your phone; the
 * prompt arrives with a buzz, then a second and a third stack above it.
 * HELD by b18: split_bg_4, label_maya_4, portrait_maya_4, label_other_4, phone_4, mon_4, real_page_4, thief_4,
 * prompt_stack_1, prompt_stack_2.
 */
Loom.scene("b17", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = Loom.mfa, S = Loom.style, svg = Loom.svg;
    const tAsks = ctx.cue("is this you signing in");
    const tAgain = ctx.cue("Then again");
    const tAgain2 = ctx.cue("and again");
    const sp = M.split(ctx, "_4", { rightLabel: "Someone else, with her password" });
    const ph = M.phone(ctx, "phone_4", { x: 330, y: 210, w: 320, h: 640, state: "dark" });
    M.monitor(ctx, "mon_4", sp.R);
    const R = M.signin(ctx, "real_page_4", Object.assign({}, sp.R, { state: "wait" }));
    R.waitDots(ctx.start, ctx.end + 7);
    M.thief(ctx, "thief_4", { x: 1300, y: 700, scale: 1.35 });
    ph.state("prompt", tAsks + 0.05);
    ph.buzz(tAsks + 0.05);
    // two more prompts stack above the phone, a little higher each time
    // @form stacked_prompt: a repeated request drawn as one more card on a pile
    [[tAgain, 1], [tAgain2, 2]].forEach(([t, i]) => {
      const E = ctx.el("prompt_stack_" + i, { x: 300 + i * 14, y: 230 - i * 70, w: 380, h: 120, kind: "card", exit: "recede" });
      svg("rect", { x: 4, y: 8, width: 380, height: 120, rx: 18, fill: S.c("shadow"), opacity: 0.14 }, E.inner);
      svg("rect", { x: 0, y: 0, width: 380, height: 120, rx: 18, fill: S.c("surface"), stroke: S.mix(S.c("surface2"), S.c("line"), 0.4), "stroke-width": 2 }, E.inner);
      kit.text(E.inner, "YourWork", { role: "label", size: 24, x: 24, y: 16, w: 330, h: 34, maxLines: 1, weight: 700, color: "muted" });
      kit.text(E.inner, "Is this you signing in?", { role: "label", size: 28, x: 24, y: 52, w: 340, h: 50, maxLines: 1, weight: 700, color: "ink" });
      m.drop(E, t + 0.05);
      ph.buzz(t + 0.05);
    });
  },
});
