// @design dim_all_but_one: the whole held room recedes a step so the one thing the caution is about stays at full strength, then the camera leans toward it
// Holds the room. A veil of the field colour fades over the room, the people and the notes (it sits in the hi layer, UNDER the
// question bubble, which returns to full strength), a tag names what makes the question work, and the camera pushes slowly toward it.
Loom.scene("b36", {
  build(ctx) {
    const { m } = ctx;
    const svg = Loom.svg;

    const room = ctx.held("room");
    ["maya", "report", "update", "card", "tick_ask", "note_confirm", "nextstep", "nextstep.line1", "nextstep.line2", "nextstep.line3", "thursday", "tag_together", "tag_together.0"].forEach((n) => ctx.held(n));
    const question = ctx.held("question");
    const R = room.__R, hi = R.layers.hi.g;

    const tCaution = ctx.cue("One caution");
    const tReal = ctx.cue("a real one");
    const tPush = ctx.cue("If you already know the answer");
    const tVerdict = ctx.cue("a verdict with a question mark");

    // the dim: not a recolour of a hundred shapes but one veil over everything below the bubble
    // @form dim_veil: a station-wide veil of the field colour that fades up over a held shot, leaving one element above it
    const veil = ctx.el("dim", { x: -700, y: -700, w: 3320, h: 2480, kind: "scenery", parent: hi });
    svg("rect", { x: 0, y: 0, width: 3320, height: 2480, fill: ctx.c("field2") }, veil.inner);
    hi.insertBefore(veil.outer, hi.firstChild);                       // under the question bubble, over the near layer
    Loom.tween(veil.inner, { opacity: 0 }, { opacity: 0.66, duration: ctx.style.dur("enter") * 1.8, ease: Loom.ease.enter }, tCaution, { kind: "dim", beat: ctx.beat.id, name: "dim", content: false });
    // her question stood a step back in b33; for the caution it is the one thing at full strength
    Loom.tween(question.life, { opacity: 0.55 }, { opacity: 1, duration: ctx.style.dur("enter") * 1.4, ease: Loom.ease.enter }, tCaution, { kind: "undim", beat: ctx.beat.id, name: "question", content: false });

    // the tag that names what makes it work
    // @form owner_chip: a solid tag that wipes in against the thing it names
    const tag = Loom.data.tag(ctx, "tag_real", { x: 372, y: 492, text: "a real question", color: "accent", t: tReal });
    hi.appendChild(tag.outer);

    // a slow push toward the bubble, easing out as the beat ends
    Loom.cam.push(R, { to: [290, 120], scale: 1.5, t0: tPush, t1: ctx.end - 0.25 });

    // on the verdict, the one emphasis: the question mark that is only a mark
    m.emphasis(question, tVerdict);
  },
});
