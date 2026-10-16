// @design ask_then_listen_corner: a short private moment where one person asks, the other talks, and a shared note is rewritten together
/* The rewritten line 3 is real text built from the lesson's own words, so the settled card reads as
 * struck-and-replaced with a tick, not a strike-through beside a tick.
 * Layers: corner back < busts < corner front (chair seats hide the bases) < sign, bubbles, label, card. */
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    const L = Loom.lesson, T = Loom.treat;
    const A = L.quiet_corner.anchors;
    const SIZE = 560, Y = 620;
    const tSoon = ctx.cue("Say it soon");
    const tAsk = ctx.cue("Then ask");
    const tSaw = ctx.cue("how they saw it");
    const tListen = ctx.cue("and listen");
    const tStep = ctx.cue("so the next step");
    const tAgreed = ctx.cue("is agreed");
    const INK = ctx.c("ink");

    const back = ctx.el("corner", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    L.quiet_corner(ctx, back.inner, { layer: "back" });
    m.reveal(back, ctx.start + 0.02, { dy: 0 });

    const asha = ctx.el("asha", { x: A.asha.x - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede" });
    const ben = ctx.el("ben", { x: A.ben.x - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede" });
    const fa = {}, fb = {};
    for (const em of ["happy", "explaining"]) {
      fa[em] = kit.peep(asha.inner, "woman", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
    }
    for (const em of ["surprised", "explaining", "happy"]) {
      fb[em] = kit.peep(ben.inner, "man", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    }
    m.reveal(asha, ctx.start + 0.1, { dy: 0 });
    m.reveal(ben, ctx.start + 0.2, { dy: 0 });
    const T0 = ctx.start, T1 = ctx.end, D = Math.max(0.1, T1 - T0);
    const drv = (name, F, fn) => Loom.drive((e, raw) => {
      const want = fn(T0 + raw * D);
      for (const k in F) F[k].style.visibility = k === want ? "visible" : "hidden";
    }, T0, D, "linear", { kind: "character", beat: ctx.beat.id, name, content: true });
    drv("asha", fa, (t) => (t >= tListen ? "happy" : t >= tAsk ? "explaining" : "happy"));
    drv("ben", fb, (t) => (t >= tAgreed ? "happy" : t >= tListen ? "explaining" : "surprised"));

    const front = ctx.el("corner_front", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    L.quiet_corner(ctx, front.inner, { layer: "front" });
    m.reveal(front, ctx.start + 0.02, { dy: 0 });

    const CW = 800, CH = Math.round(CW * 266 / 520);
    const card = ctx.el("small_card", { x: A.card.cx - CW / 2, y: A.card.cy - CH / 2, w: CW, h: CH, kind: "card", exit: "recede" });
    const k = CW / 520;
    const cg = Loom.svg("g", { transform: "scale(" + k + ") translate(-150 -77)" }, card.inner);
    const mc = L.message_card(ctx, cg, { rewrite: "Try a timed agenda." });
    mc.setState("small", ctx.start, 0);
    m.settle(card, ctx.start + 0.3, { dy: 10 });
    mc.setState("strike3", tStep, 0.6);
    mc.setState("rewrite3", tStep + 0.7, 0.9);
    mc.setState("small_agreed", tAgreed, 0.5);

    const SW = 340, SH = 104;
    const sign = ctx.el("soon_sign", { x: A.sign.x - 10, y: A.sign.y, w: SW, h: SH, kind: "card", exit: "recede" });
    const sg = Loom.svg("g", { transform: "rotate(-2 " + SW / 2 + " " + SH / 2 + ")" }, sign.inner);
    Loom.svg("rect", { x: 0, y: 0, width: SW, height: SH, rx: 8, fill: ctx.c("surface"), stroke: INK, "stroke-width": 5 }, sg);
    Loom.svg("rect", { x: SW / 2 - 42, y: -12, width: 84, height: 26, rx: 4, fill: ctx.c("accent4"), opacity: 0.8, stroke: INK, "stroke-width": 3 }, sg);
    kit.text(sg, "Soon, in private", { role: "label", x: 20, y: 14, w: SW - 40, h: SH - 28, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 400 });
    m.drop(sign, tSoon, { dy: -140 });

    const bubble = (name, bx, by, bw, bh, tip, exit) => {
      const E = ctx.el(name, { x: bx, y: by, w: bw, h: bh + 70, kind: "bubble", exit });
      const g = E.inner;
      const mx = Math.min(Math.max(tip[0] - bx, 50), bw - 50);
      Loom.svg("path", { d: "M" + (mx - 28) + " " + (bh - 4) + " L" + (tip[0] - bx) + " " + (tip[1] - by) + " L" + (mx + 22) + " " + (bh - 4) + " Z", fill: ctx.c("surface"), stroke: INK, "stroke-width": 5, "stroke-linejoin": "round" }, g);
      Loom.svg("rect", { x: 0, y: 0, width: bw, height: bh, rx: 44, fill: ctx.c("surface"), stroke: INK, "stroke-width": 5 }, g);
      Loom.svg("line", { x1: mx - 22, y1: bh, x2: mx + 18, y2: bh, stroke: ctx.c("surface"), "stroke-width": 8 }, g);
      return E;
    };
    const ask = bubble("ask_bubble", 450, 230, 220, 150, [470, 440], "none");
    kit.text(ask.inner, "?", { role: "title", x: 20, y: 10, w: 180, h: 130, align: "center", valign: "middle", maxLines: 1, color: "ink" });
    m.pop(ask, tAsk);
    m.exit(ask, tListen, "recede");
    const lab = T.label(ctx, "ask_label", { x: 300, y: 150, text: "Ask how they saw it", to: [560, 240], tone: "accent3", t: tSaw });
    [lab, lab && lab.lead].forEach((E) => { if (E && E.inner) m.exit(E, tListen + 0.6, "recede"); });

    const bb = bubble("ben_bubble", 1200, 270, 290, 150, [1490, 440], "none");
    const wv = Loom.svg("path", { d: "M40 78 q 21 -34 42 0 t 42 0 t 42 0 t 42 0 t 42 0", fill: "none", stroke: INK, "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, bb.inner);
    m.pop(bb, tListen);
    Loom.drive((e, raw) => { wv.setAttribute("stroke-dashoffset", (1 - raw).toFixed(3)); }, tListen + 0.25, 0.9, "linear", { key: "b13wave" });
    m.exit(bb, tStep + 0.3, "recede");
  },
});
