// @design decision_needed_guest_row: keep the decision owner and needed input, route everyone else to notes
// Treatments considered: (A) redraw the invite as a fresh diagram, rejected because continuity loses the existing card. (B) fade unwanted guests, rejected because the decision needs a clear keep or route distinction. (C) chosen, one accent loop identifies the owner, short labels identify the two keepers, then ink crosses and an envelope route the rest.
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    const steps = ctx.held("steps");
    const invite = ctx.held("invite");
    const tOwner = ctx.cue("Invite whoever owns that decision,");
    const tInput = ctx.cue("and whoever it can't be made without.");
    const tNotes = ctx.cue("Everyone else gets the notes.");

    // The one emphasis mark is local to the held card, so it remains registered with guest zero.
    const ownerCircle = ctx.el("owner_circle", { x: 58, y: 374, w: 104, h: 112, kind: "mark", exit: "recede", parent: invite.inner });
    hand(ownerCircle.inner, "M52 3 C82 3 101 25 101 55 C101 85 80 106 52 106 C22 106 3 84 3 55 C3 25 22 3 52 3 C69 1 83 0 91 6", { stroke: "accent", sw: 5 });
    m.draw(ownerCircle, tOwner - 0.08, { dur: drawDur(310) });
    invite.handle.markGuest(0, "Owner", tOwner + 0.12, { tone: "ink" });

    invite.handle.markGuest(1, "Needed input", tInput - 0.12, { tone: "ink" });

    // Four crossed guests remain visibly part of the original invite, then route to the notes.
    invite.handle.crossGuest(2, tNotes - 0.25);
    invite.handle.crossGuest(3, tNotes - 0.08);
    invite.handle.crossGuest(4, tNotes + 0.09);
    invite.handle.crossGuest(5, tNotes + 0.26);
    invite.handle.envelope(tNotes + 0.42);

    // The existing Before row receives its hand tick before the spoken sentence completes.
    steps.handle.tick(0, tNotes + 0.68, { tone: "ink" });
  },
});
