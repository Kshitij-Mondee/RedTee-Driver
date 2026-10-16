// @design failed_check_answer: the name row fails in red, the safe choice lights and the others dim, then the gap that remains is shown as a question over the far end
// Treatments considered: (1) static recap with ticks; (2) cross, ring, flicker, question rises on the card just seen (chosen); (3) full-screen warning page.
Loom.scene("b14", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat;
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, parent) => {
      const n = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach((k) => n.setAttribute(k, attrs[k]));
      if (parent) parent.appendChild(n);
      return n;
    };
    // teal: the colour the kit's own ticks already use, read from the held cert
    let teal = ctx.c("ink");
    Array.from(ctx.held("cert").inner.querySelectorAll("*")).forEach((n) => {
      const v = (n.getAttribute("fill") || "").trim();
      const mm = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(v);
      if (!mm) return;
      const r = parseInt(mm[1], 16), g = parseInt(mm[2], 16), b = parseInt(mm[3], 16);
      if (g > 90 && b > 90 && r < 50 && Math.abs(g - b) < 30) teal = v;
    });

    const slate = ctx.c("ink");

    const CE0 = ctx.held("cert");
    const tDefault = ctx.cue("By default");
    const tWarn = ctx.cue("warns you and stops");
    const tScr = ctx.cue("Scrambling alone");
    const tWho = ctx.cue("who is there");

    const B = ctx.held("board");
    const CE = ctx.held("cert");
    const OL = ctx.held("option_load");
    const OW = ctx.held("option_warn");
    const OP = ctx.held("option_plain");
    const PB = ctx.held("pause_bar");

    // pause bar retires at the start
    m.exit(PB, ctx.start + 0.1, "recede");
    Loom.drive((e, raw) => { PB.inner.style.opacity = 1 - raw; }, ctx.start + 0.1, 0.35, "exit");

    // the name row fails
    if (CE && CE.ui) CE.ui.setState("name_red", tDefault);

    // ring and tick on Warn and stop
    const RG = ctx.el("warn_ring", { x: 740, y: 750, w: 440, h: 170, kind: "scenery", exit: "recede" });
    const ring = mk("rect", { x: 6, y: 6, width: 428, height: 158, rx: 24, fill: "none", stroke: teal, "stroke-width": 8, pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 1 }, RG.inner);
    Loom.drive((e, raw) => { ring.setAttribute("stroke-dashoffset", 1 - raw); }, tWarn, 0.7, "enter");
    const TK = ctx.el("warn_tick", { x: 1120, y: 726, w: 76, h: 76, kind: "icon", exit: "recede" });
    mk("circle", { cx: 38, cy: 38, r: 34, fill: teal }, TK.inner);
    mk("path", { d: "M22 39 L34 51 L55 26", fill: "none", stroke: ctx.c("surface"), "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" }, TK.inner);
    m.pop ? m.pop(TK, tWarn + 0.55) : m.reveal(TK, tWarn + 0.55);

    // the other two options dim
    [OL, OP].forEach((E) => {
      if (!E) return;
      Loom.drive((e, raw) => { E.inner.style.opacity = 1 - 0.62 * raw; }, tWarn + 0.2, 0.6, "move");
    });

    // scrambled pattern flickers along the path, then is gone
    const SC = ctx.el("scramble", { x: 1130, y: 450, w: 190, h: 60, kind: "token", exit: "recede" });
    for (let i = 0; i < 6; i++) {
      mk("rect", { x: 6 + i * 30, y: 10, width: 22, height: 40, rx: 5, fill: slate, opacity: 0.8 }, SC.inner);
    }
    SC.inner.style.opacity = 0;
    const pat = [1, 0.2, 1, 0.1, 1, 0.5, 0.9, 0];
    Loom.drive((e, raw) => {
      const k = Math.min(pat.length - 1, Math.floor(raw * pat.length));
      SC.inner.style.opacity = raw <= 0 || raw >= 1 ? 0 : pat[k];
    }, tScr, 1.0, "linear");

    // question mark rises above the server card
    const QM = ctx.el("question_mark", { x: 1490, y: 85, w: 160, h: 130, kind: "icon", exit: "recede" });
    const q = mk("text", { x: 80, y: 65, "text-anchor": "middle", "dominant-baseline": "central", "font-family": (function () { const kt = ctx.held("board").inner.querySelector("text"); return (kt && kt.getAttribute("font-family")) || "sans-serif"; })(), "font-size": 150, "font-weight": 800, fill: slate, opacity: 0.8 }, QM.inner);
    q.textContent = "?";
    m.reveal(QM, tWho - 0.2);

    T.label(ctx, "label_who", { x: 1392, y: 745, text: "Who is at the other end?", to: [1400, 706], tone: "neutral", t: tWho + 0.35 });
  },
});
