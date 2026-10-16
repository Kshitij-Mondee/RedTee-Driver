// @design defined_on_object: a generic marker is defined by two plain labels attached to the very marker they describe
// Treatments considered: (1) static bar with two captions; (2) bar draws, marker pulses, labels attach on their phrases (chosen: meaning sits on the object); (3) full-width text card.
Loom.scene("b15", {
  build(ctx) {
    const { m } = ctx;
    const NS = "http://www.w3.org/2000/svg";
    const mk = (parent, tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      parent.appendChild(n);
      return n;
    };

    const tMeans = ctx.cue("The padlock means");
    const tEnc = ctx.cue("encrypted");
    const tCert = ctx.cue("certificate accepted");

    // @form address_bar: a wide generic address bar, plain, with the domain
    const BE = ctx.el("bar", { x: 160, y: 260, w: 1600, h: 120, kind: "scenery", exit: "recede" });
    const bar = Loom.lesson.address_bar(ctx, BE.inner, { domain: "accounts.example", startHidden: true });
    BE.ui = bar;
    const t0 = Math.max(ctx.start + 0.1, tMeans - 0.1);
    m.reveal(BE, t0);

    // @form padlock: small closed generic padlock in the bar slot, pulses once
    const PE = ctx.el("padlock", { x: 206, y: 294, w: 48, h: 52, kind: "token", exit: "recede" });
    const pad = Loom.lesson.padlock(ctx, PE.inner, { h: 48 });
    PE.ui = pad;
    pad.setState("closed", ctx.start);
    m.reveal(PE, t0 + 0.4);
    pad.setState("pulse", tMeans + 0.5);

    const teal = ctx.c("pos"), ink = ctx.c("ink"), surf = ctx.c("surface");

    // pill: white, teal edge, 30 px text, left edge on the column x160
    const pill = (name, text, y, w) => {
      const E = ctx.el(name, { x: 160, y, w, h: 64, kind: "label", exit: "recede" });
      mk(E.inner, "rect", { x: 1, y: 1, width: w - 2, height: 62, rx: 31, fill: surf, stroke: teal, "stroke-width": 2 });
      const tx = ctx.kit.text(E.inner, text, { role: "label", x: 28, y: 0, w: w - 56, h: 64, align: "left", valign: "middle", maxLines: 1, color: "ink", weight: 700 });
      return E;
    };
    const line = (name, x, y, w, h, d, dot) => {
      const E = ctx.el(name, { x, y, w, h, kind: "scenery", exit: "recede" });
      mk(E.inner, "path", { d, fill: "none", stroke: teal, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" });
      mk(E.inner, "circle", { cx: dot[0], cy: dot[1], r: 5, fill: teal });
      return E;
    };

    // @form label_encrypted: teal-edged pill, leader straight up to the padlock
    const L1 = line("lead_encrypted", 226, 346, 8, 94, "M4,94 L4,6", [4, 6]);
    const P1 = pill("label_encrypted", "Encrypted", 440, 222);
    m.reveal(L1, tEnc);
    m.reveal(P1, tEnc + 0.25);

    // @form label_accepted: second pill; its leader goes round the left so it never crosses a word
    const L2 = line("lead_accepted", 126, 318, 90, 274, "M34,272 L6,272 L6,6 L80,6", [80, 6]);
    const P2 = pill("label_accepted", "Certificate accepted for this domain", 560, 604);
    m.reveal(L2, tCert);
    m.reveal(P2, tCert + 0.25);
    bar.setState("underline", tCert + 0.3);
  },
});
