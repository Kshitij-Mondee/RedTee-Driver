// @design habit_checklist_on_object: two plain checks are ticked directly on the marker they inspect, the name read letter by letter, the warning slot shown empty
// Treatments considered: (1) static bar with two ticked captions; (2) camera pushes on the bar, domain highlights letter by letter, an empty warning slot draws, ticks land on each (chosen: the habit is performed on the object); (3) full-width checklist card.
Loom.scene("b17", {
  build(ctx) {
    const { m } = ctx;
    const NS = "http://www.w3.org/2000/svg";
    const mk = (parent, tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      parent.appendChild(n);
      return n;
    };

    // held from b15/b16
    const BE = ctx.held("bar");
    const PE = ctx.held("padlock");

    const tBefore = ctx.cue("Before typing");

    const tName = ctx.cue("domain name closely");
    const tWarn = ctx.cue("look for a warning");
    const tMatters = ctx.cue("name matters more");



    const bar = BE.ui, pad = PE.ui;
    const teal = ctx.c("pos"), ink = ctx.c("ink"), surf = ctx.c("surface");

    // @form pill_exact_domain: white teal-edged pill above the bar
    const pill = (name, text, x, y, w) => {
      const E = ctx.el(name, { x, y, w, h: 64, kind: "label", exit: "recede" });
      mk(E.inner, "rect", { x: 0, y: 0, width: w, height: 64, rx: 32, fill: teal });
      mk(E.inner, "rect", { x: 3, y: 3, width: w - 6, height: 58, rx: 29, fill: surf });
      ctx.kit.text(E.inner, text, { role: "label", x: 28, y: 0, w: w - 56, h: 64, align: "left", valign: "middle", maxLines: 1, color: "ink", weight: 700 });
      return E;
    };
    // @form tick_mark: teal disc with a white check, 56 px
    const tick = (name, cx, cy) => {
      const S = 52;
      const E = ctx.el(name, { x: cx - S / 2, y: cy - S / 2, w: S, h: S, kind: "token", exit: "recede" });
      mk(E.inner, "circle", { cx: S / 2, cy: S / 2, r: S / 2 - 1, fill: teal });
      mk(E.inner, "path", { d: "M14,27 L22,35 L38,17", fill: "none", stroke: surf, "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" });
      return E;
    };

    // domain read letter by letter
    const ch = bar.chars || { x0: 140, cw: 33.6, n: 16 };
    bar.setState("name_highlight", tName, 1.8);
    const domainEnd = 160 + ch.x0 + ch.cw * ch.n;

    const P1 = pill("pill_name", "Exact domain name", 300, 392, 370);
    m.reveal(P1, tName + 0.3);
    const T = Loom.treat;
    const T1 = tick("tick_name", Math.min(domainEnd + 56, 1200), 320); m.pop ? m.pop(T1, tName + 1.7) : m.reveal(T1, tName + 1.7);

    bar.setState("warning_slot_empty", tWarn);
    const P2 = pill("pill_warning", "No warning", 300, 560, 260);
    m.reveal(P2, tWarn + 0.5);
    const T2 = tick("tick_warning", 1236, 500); m.pop ? m.pop(T2, tWarn + 0.9) : m.reveal(T2, tWarn + 0.9);

    // pills and ticks stay held through the settled frame (no exit)

    try { const host = (BE && (BE.g || (BE.inner && BE.inner.parentNode))) || null; if (host && host.setAttribute) host.setAttribute("data-bleed", ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2)); } catch (e) {}

    pad.to("dim", 0.5, tMatters, 0.8);
    bar.setState("pulse", tMatters + 0.2);

    // pills, the dashed warning slot and its tick leave together just before the beat ends
    const tOut = ctx.end - 0.9;
    m.exit(P1, tOut);
    m.exit(P2, tOut);
    m.exit(T2, tOut);
    bar.setState("plain", tOut + 0.2);

  },
});
