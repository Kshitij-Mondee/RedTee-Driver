// @design selective_row_continued: keep two members legible, cross the rest, and route them to a written follow-up
/* Treatments: A static row with signalling; B remove unused members; C chosen, accumulated labels and crosses with a drawn route. C preserves the prior board and makes selection visible. */
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const stepsE = ctx.held("steps");
    const inviteE = ctx.held("invite");
    const steps = stepsE.handle;
    const invite = inviteE.handle;
    const ownerAt = ctx.cue("whoever owns that decision");
    const inputAt = ctx.cue("can't be made without");
    const othersAt = ctx.cue("Everyone else gets the notes");
    const notesAt = ctx.cue("the notes");
    const DRAW = ctx.style.dur("draw");
    // Held kit handles remain owned by the accumulated invite board.

    // @form owner_circle: the single marker emphasis follows the existing pictogram's measured centre
    const c = invite.guestCentre(0);
    const b = invite.guestBox(0);
    const rx = b.w / 2 + 12, ry = b.h / 2 + 12;
    const P = 12;
    const circle = ctx.el("owner_circle", {
      x: c.x - rx - P, y: c.y - ry - P,
      w: rx * 2 + P * 2, h: ry * 2 + P * 2,
      parent: inviteE.inner, kind: "mark", exit: "recede"
    });
    const x = rx + P, y = ry + P, k = 0.5523;
    const loop = `M${x} ${y-ry}` +
      ` C${x+k*rx} ${y-ry} ${x+rx} ${y-k*ry} ${x+rx} ${y}` +
      ` C${x+rx} ${y+k*ry} ${x+k*rx} ${y+ry} ${x} ${y+ry}` +
      ` C${x-k*rx} ${y+ry} ${x-rx} ${y+k*ry} ${x-rx} ${y}` +
      ` C${x-rx} ${y-k*ry} ${x-k*rx} ${y-ry} ${x} ${y-ry}`;
    kit.sketch(circle.inner, "path", [loop], {fill:"none",stroke:"accent",sw:5});
    m.draw(circle, ownerAt, {dur: DRAW * Math.max(0.3, Math.min(1.4, 2*Math.PI*rx/900))});
    invite.markGuest(0, "Owner", ownerAt, {tone:"ink"});

    // @form needed_input: the second retained member is labelled, without spending another colour
    invite.markGuest(1, "Needed input", inputAt, {tone:"ink"});

    // @form notes_route: crosses accumulate rather than erase, then a hand arrow carries the alternative
    for (let i = 2; i < 6; i++) {
      invite.crossGuest(i, othersAt + (i-2)*ctx.style.dur("stagger"));
    }
    invite.envelope(othersAt);
    // @form before_tick: the completed move is acknowledged in the checklist's existing box
    steps.tick(0, notesAt, {tone:"ink"});
  }
});
