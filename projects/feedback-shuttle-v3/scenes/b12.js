// @design verdicts_in_order: three candidate lines are judged one after another on the same desk, the good one stamped and its parts underlined, the hollow one dimmed, the personal one crossed out
/* Treatments considered:
 * (A) static composition with all three verdicts and labels shown at once (rejected: no order, nothing lands on its words);
 * (B) a zoom into option C only (rejected: loses the peers the contrast depends on);
 * (C) CHOSEN: the desk stays exactly as the previous beat left it; verdicts land in the narration's order, C then B then A,
 *     each with its own label, the accent only on C.
 * Continuity: the previous beat's kit instance is not reachable from here, so the same part is rebuilt in the same
 * place and opened in its end state (options, dur 0); identical pixels, so nothing flashes at the join. The pause
 * ring has drained by then, so it stays off.
 */
Loom.scene("b12", {
  build(ctx) {
    const L = Loom.lesson;
    const desk = ctx.el("desk_top", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const hc = L.handover_check(ctx, desk.inner, {});
    if (hc.ring && hc.ring.style) hc.ring.style.display = "none";
    hc.setState("options", ctx.start, 0);

    const tC = ctx.cue("C has the behaviour");
    const tParts = ctx.cue("impact and a next step");
    const tB = ctx.cue("B is polite");
    const tA = ctx.cue("A is about the person");

    hc.setState("c_right", tC, 2.6);
    hc.setState("label_c", tParts, 0.5);
    hc.setState("b_hollow", tB, 0.8);
    hc.setState("label_b", tB + 0.9, 0.5);
    hc.setState("a_wrong", tA, 0.6);
    hc.setState("label_a", tA + 0.7, 0.5);
  },
});
