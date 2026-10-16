// @design predict_before_reveal: the action runs up to the moment of truth, a question holds the frame in silence
/* b09 - She types her password, then her code. Does the thief get in? Decide before it plays.
 * Treatments considered: (A) a quiz card over a dimmed frame (rejected: the old deck feel); (B) CHOSEN: Maya types on
 * the look-alike page (the dots, the press, the code from her phone typed in), the frame holds, and a question card
 * settles over the divider with two answers; three seconds of silence.
 */
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = Loom.mfa, S = Loom.style, svg = Loom.svg;
    const H = M.hold(ctx, M.splitNames("_2").concat(["lap_2", "fake_page", "big_addr", "mon_2", "real_page", "thief_2", "phone_2"]));
    const tPw = ctx.cue("She types her password");
    const tCode = ctx.cue("then her code");
    const tAsk = ctx.cue("Does the thief get in");
    const F = H.fake_page, ph = H.phone_2;
    const t1 = F.typePw(tPw + 0.3, 0.08);
    F.press(F.pwBtn, t1 + 0.1);
    F.state("code", t1 + 0.35);
    ph.state("code", tCode);
    ph.buzz(tCode);
    F.typeCode(tCode + 0.5, 0.11);
    // @form question_card: one question over the frame with two answers, held in silence before the reveal
    const q = ctx.el("question_card", { x: 520, y: 640, w: 880, h: 300, kind: "card", exit: "recede" });   // below the screens: it covers no text on them
    svg("rect", { x: 6, y: 12, width: 880, height: 300, rx: 22, fill: S.c("shadow"), opacity: 0.12 }, q.inner);
    svg("rect", { x: 0, y: 0, width: 880, height: 300, rx: 22, fill: S.c("surface"), stroke: S.c("accent"), "stroke-width": 4 }, q.inner);
    kit.text(q.inner, "Does the thief get in?", { role: "title", size: 62, x: 40, y: 34, w: 800, h: 90, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    [["Yes", 170], ["No", 490]].forEach(([w, x]) => {
      svg("rect", { x, y: 160, width: 220, height: 80, rx: 40, fill: S.c("field"), stroke: S.c("accent"), "stroke-width": 3 }, q.inner);
      kit.text(q.inner, w, { role: "lead", size: 40, x, y: 160, w: 220, h: 80, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "accent" });
    });
    m.drop(q, tAsk - 0.05);
    // the big address sits where the card lands: it steps away for the question and returns in b10
    Loom.tween(H.big_addr.mover, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, ease: "none" }, tAsk - 0.1, { kind: "exit", beat: ctx.beat.id, name: "big_addr.away" });
    Loom.sfx("card", tAsk);
  },
});
