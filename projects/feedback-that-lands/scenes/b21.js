// @design acting_line_effect_on_listener: a speaker's line opens in a bubble while the listener's posture eases, the effect of the move shown on the person
/* b21 - she starts with the situation. Maya's first move: the Situation line on the card ticks, she explains with an
 * open hand, her line types into a chat bubble, and on "picture it straight away" the report's shoulders drop and the
 * head lifts a little. Held by name: room, maya, report, update, card, clock.
 * Treatments considered: (A) the classic dialogue template (kept as the alternative), (B) a quote card (rejected:
 * the line belongs to a person), (C) CHOSEN: acting in the held room, the listener's posture is the teaching.
 */
Loom.scene("b21", {
  build(ctx) {
    const { m } = ctx;
    const S = Loom.style, T = Loom.treat;
    const bid = ctx.beat.id;
    const room = ctx.held("room"), maya = ctx.held("maya"), rep = ctx.held("report"), card = ctx.held("card");
    ctx.held("update"); ctx.held("clock");
    void room;
    const actor = maya.actor;

    // the first move on the card is ticked as it is named
    const tSit = ctx.cue("the situation");
    // @form tick_on_box: a tick drawn into an empty box beside a ruled line, on the word that names the line
    T.mark(ctx, "tick_situation", { x: card.ticks[0][0], y: card.ticks[0][1], size: 42, kind: "yes", t: tSit });

    // Maya explains: the open hand rises with the line, the mouth follows only the quoted words
    const tLine = ctx.cue("The client update this morning");
    const tEnd = ctx.cue("They can picture it straight away");
    actor.pose("explain", tLine - 0.35, { dur: 0.6 });
    actor.emotion("smile", tLine - 0.35);
    actor.hold("hand_r", "open", tLine - 0.35, tEnd);
    actor.talk(tLine, tEnd - 0.1);
    actor.gesture("beat", tLine + 0.5, tEnd - 0.2);
    actor.pose("listen", tEnd, { dur: 0.7 });
    actor.emotion("focus", tEnd);

    // her line opens in a chat bubble beside her, the corner toward her
    T.bubble(ctx, "bubble", { x: 440, y: 262, w: 600, text: "The client update this morning, the one about the change.", tail: [790, 452], kind: "speech", role: "body", t: tLine });

    // the listener: the shoulders drop a few pixels and the head lifts a little, one progress for both
    const P = rep.parts;
    Loom.drive((e) => { P.sh.setAttribute("transform", `translate(0 ${(5 * e).toFixed(2)})`); P.hd.setAttribute("transform", `translate(${(2 * e).toFixed(2)} ${(-3 * e).toFixed(2)})`); }, tEnd, 1.1, "editorial", { kind: "posture", beat: bid, name: "report.eases", content: true });
    void S; void m;
  },
});
