// @design held_floor_plan_continued: the held plan rests while the question is asked on it; the pause is a bar that fills
/* b09 (station floor_plan, continue): "Which row breathes the warmest air? Decide before I run it." (3 s of silence)
 *
 * Three treatments considered:
 *   A. A quiz slide (question, four options). Takes the rows away at the exact moment the viewer has to look at them
 *      and decide (storyboard upgrade_reason): rejected.
 *   B. The plan holds still; the rows get their numbers 1 to 4 (front to back) and a question card is pinned to the
 *      right of the plan. A thin bar under the question fills through the scripted silence, and nothing else moves.
 *   C. A pointer sweeps the rows asking "this one?". Motion that suggests an answer the narration has not given.
 *   B wins (intent: rest): this is the one beat of the section where nothing may change except the clock.
 *
 * The plan is the held element from b08 (never redrawn, so no new Loom.lesson.floor_plan call): `ctx.held("floor_plan").kit` is the kit handle, so the
 * numbers are the kit's own `showNumbers`. `row_numbers` is the named box that hugs the discs (the storyboard keeps it
 * for b10 and b11). The pause bar fills linearly from the end of the last spoken word to the end of the beat.
 */
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;
    const OX = 210, OY = 107;
    const FADE = ctx.style.dur("enter");              // the pack's entrance time

    // ---- times, all from the narration
    const tWhich = ctx.cue("Which row");
    const tBreathes = ctx.cue("breathes the warmest air");
    const tDecide = ctx.cue("Decide before I run it");

    // ---- the held plan: no new drawing, only its numbers
    const E = ctx.held("floor_plan");
    const plan = E.kit;
    plan.showNumbers(tWhich, { stagger: 0.15 });                       // 1 to 4, bottom (front) to top (back)

    // the box that hugs the number discs (part x 380..432, y 48..696)
    const numsBox = ctx.el("row_numbers", { x: OX + 380, y: OY + 48, w: 52, h: 648, kind: "scenery" });
    m.reveal(numsBox, tWhich, { dy: 0, dur: 0.5 });

    // ---- the question card, pinned right of the rows inside the room (x 1316..1656 of the frame)
    // @form question_card_pause: a question pinned to the thing it is about, with a bar that fills through the silence
    const q = "Which row runs warmest?";
    const CW = 340, PAD = 32;
    const f = kit.fit(q, { role: "lead", w: CW - 2 * PAD, maxLines: 2, weight: 700 });
    const barY = 24 + f.height + 30, BAR_H = 12;
    const CH = barY + BAR_H + 30;
    const CX = 1316, CY = Math.round(OY + 400 - CH / 2);                // centred on the room's middle
    const P = T.panel(ctx, "question_card", { x: CX, y: CY, w: CW, h: CH, as: "card", tone: "accent" });
    const qt = kit.text(P.inner, q, { role: "lead", x: PAD, y: 24, w: CW - 2 * PAD, h: f.height + 4, maxLines: 2, weight: 700, color: "accent" });
    // the pause bar: a track that arrives with the card's second phrase, and a fill that runs through the silence
    const track = kit.rect(P.inner, PAD, barY, CW - 2 * PAD, BAR_H, { fill: "surface2", r: BAR_H / 2, shadow: false });
    const fill = Loom.svg("rect", { x: PAD, y: barY, width: 0.01, height: BAR_H, rx: BAR_H / 2, fill: ctx.c("accent") }, P.inner);
    const barW = CW - 2 * PAD;
    Loom.set(track, { opacity: 0 }, 0);
    Loom.set(fill, { opacity: 0 }, 0);

    m.settle(P, tBreathes, { dy: 14 });
    Loom.tween(track, { opacity: 0 }, { opacity: 1, duration: FADE }, tDecide, { kind: "reveal", name: "pause_bar", content: true });
    Loom.tween(fill, { opacity: 0 }, { opacity: 1, duration: FADE / 2 }, ctx.speechEnd, { kind: "reveal", name: "pause_bar.fill", content: true });
    const t0 = ctx.speechEnd, t1 = ctx.end - 0.32;                  // full just before the card leaves (the join retires it at about end - 0.25)
    Loom.drive((e) => { fill.setAttribute("width", Math.max(0.01, barW * e).toFixed(2)); }, t0, t1 - t0, "linear",
      { kind: "count", name: "pause_bar", content: true });
  },
});
