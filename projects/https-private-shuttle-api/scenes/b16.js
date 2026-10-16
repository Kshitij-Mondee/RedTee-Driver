// @design limits_beside_meaning: slate 'does not show' labels sit opposite the teal meaning labels on the same marker
// Treatments considered: (1) static slate labels; (2) slate pills build on the phrases, a muted note, then a server inset showing the readable form (chosen); (3) full-width warning card.
// Retired by b17 at its start: label_not_honest, label_not_after, label_note, server_inset (and its child server_packet).
Loom.scene("b16", {
  build(ctx) {
    const { m } = ctx;
    const NS = "http://www.w3.org/2000/svg";
    const mk = (parent, tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      parent.appendChild(n);
      return n;
    };

    // held from b15: take them, never redraw
    ctx.held("bar");
    ctx.held("padlock");
    ctx.held("label_encrypted");
    ctx.held("label_accepted");

    const tHonest = ctx.cue("site is honest");
    const tAfter = ctx.cue("after arrival");

    const slate = ctx.c("ink"), surf = ctx.c("surface");

    // @form label_not_honest: slate-edged white pill, mirrors the teal pills
    const pill = (name, text, x, y, w) => {
      const E = ctx.el(name, { x, y, w, h: 64, kind: "label", exit: "recede" });
      mk(E.inner, "rect", { x: 1, y: 1, width: w - 2, height: 62, rx: 31, fill: surf, stroke: slate, "stroke-opacity": 0.55, "stroke-width": 3 });
      ctx.kit.text(E.inner, text, { role: "label", x: 28, y: 0, w: w - 56, h: 64, align: "left", valign: "middle", maxLines: 1, color: "ink", weight: 700 });
      return E;
    };
    const P1 = pill("label_not_honest", "Not proof of honesty", 1000, 440, 420);
    m.reveal(P1, tHonest);

    // @form label_note: muted body line under the first pill
    const NE = ctx.el("label_note", { x: 1000, y: 522, w: 760, h: 44, kind: "text", exit: "wipe" });
    ctx.kit.text(NE.inner, "Anyone can get a certificate for their own domain", { role: "body", x: 4, y: 0, w: 752, h: 44, align: "left", valign: "middle", maxLines: 1, size: 26, color: "muted", weight: 400 });
    m.reveal(NE, tHonest + 0.9);

    // @form label_not_after: second slate pill
    const P2 = pill("label_not_after", "Not after it arrives", 1000, 590, 400);
    m.reveal(P2, tAfter);

    // @form server_inset: the server end of the path, with the form readable again
    const SE = ctx.el("server_inset", { x: 1340, y: 690, w: 420, h: 210, kind: "scenery", exit: "recede" });
    const sv = Loom.lesson.path_board(ctx, SE.inner, { only: "server", w: 420, startHidden: false });
    SE.ui = sv;
    m.reveal(SE, tAfter + 0.4);

    // @form packet_readable: readable form packet inside the inset (same object as earlier beats)
    const PK = ctx.el("server_packet", { x: 140, y: 52, w: 260, h: 156, kind: "token", exit: "recede", parent: SE.inner });
    const pk = Loom.lesson.packet(ctx, PK.inner, { scale: 1.3 });
    pk.setState("readable", ctx.start);
    m.reveal(PK, tAfter + 0.9);
  },
});
