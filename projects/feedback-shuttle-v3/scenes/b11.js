// @design stopping_check_peers: a gap in a handed-over note is shown, then three equal answers arrive side by side and the room goes still
/* Treatments considered:
 * (A) a static composition: note left, question above, three cards, all up at once with a caption arrow (rejected: no cause, an arrow would favour a card);
 * (B) cards fly in from different sides (rejected: arrival order and direction would rank them);
 * (C) CHOSEN: the note lands, its dashed gap pulses in the accent, the question writes in, A B C arrive in one even column with a tight stagger,
 *     the accent leaves the gap, then the frame holds still while the pause ring drains.
 * Fix: the named boxes the next beat holds each carry their own clipped view of the same kit part, so each paints
 * its real pixels (note, question, three cards) instead of being empty boxes over a single full-frame element.
 */
Loom.scene("b11", {
  build(ctx) {
    const { m } = ctx;
    const L = Loom.lesson;

    const tNote = ctx.cue("Say a handover note");
    const tPulse = ctx.cue("left out a client deadline");
    const tOpts = ctx.cue("Which line");
    const tPause = ctx.speechEnd - 0.2;

    const drive = (hc) => {
      hc.setState("note", tNote);
      hc.setState("note_pulse", tPulse);
      hc.setState("options", tOpts);
      hc.setState("pause", tPause, 3);
    };

    // the whole check is one kit part on a full-frame element (desk top, note, question, cards, ring)
    const desk = ctx.el("desk_top", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    drive(L.handover_check(ctx, desk.inner, {}));
    m.reveal(desk, ctx.start + 0.02, { dy: 0 });

    // named boxes the next beat holds: each shows its own clipped view of the same part, in place
    let n = 0;
    const box = (name, b, kind) => {
      const e = ctx.el(name, { x: b.x, y: b.y, w: b.w, h: b.h, kind: kind, exit: "none" });
      const id = "b11clip" + (++n);
      const defs = Loom.svg("defs", {}, e.inner);
      const cp = Loom.svg("clipPath", { id: id }, defs);
      Loom.svg("rect", { x: 0, y: 0, width: b.w, height: b.h }, cp);
      const wrap = Loom.svg("g", { "clip-path": "url(#" + id + ")" }, e.inner);
      const shift = Loom.svg("g", { transform: "translate(" + (-b.x) + " " + (-b.y) + ")" }, wrap);
      drive(L.handover_check(ctx, shift, {}));
      m.reveal(e, ctx.start + 0.02, { dy: 0 });
      return e;
    };
    box("handover_note", { x: 110, y: 290, w: 600, h: 420 }, "prop");
    box("question", { x: 840, y: 100, w: 780, h: 84 }, "label");
    [214, 446, 678].forEach((y, i) => box("option_" + "abc"[i], { x: 840, y: y, w: 780, h: 156 }, "label"));
  },
});
