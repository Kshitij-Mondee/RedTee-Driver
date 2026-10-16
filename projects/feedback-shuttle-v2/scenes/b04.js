// @design feeling_then_target: a vague warm cloud on one side, an empty aim point on the other, and a dart that gives the aim point its purpose
/* Treatments considered: (A) static two-up of the two signs with a caption (rejected: nothing turns);
 * (B) bubble morphs into a board (rejected: no morph primitive, and the contrast needs both halves visible);
 * (C) CHOSEN: two halves land in narration order, then the accent dart flies in and stamps the bullseye. */
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const sv = Loom.svg;
    const num = (v) => Math.round(v * 100) / 100;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    // the Feeling half opens the beat on the first words ("That comment"), so the canvas is never blank
    const tFeel = Math.max(0.02, ctx.cue("That comment") - 0.25);
    const tTarg = ctx.cue("not a target");
    const tAct = ctx.cue("names an action");

    const CY = 590;                 // shared centre line of both halves
    const LX = 480, RX = 1370;      // centres of the left and right half objects

    // ---- left: the vague bubble (kit), with the heart badge on its corner ----
    const BW = 700;
    const vague = ctx.el("vague", { x: LX - BW / 2, y: CY - 281, w: BW, h: 420, kind: "bubble", exit: "recede" });
    const cb = Loom.lesson.comment_bubble(ctx, vague.inner, { w: BW });
    cb.setState("vague", tFeel);
    // @form heart_badge: a small warm badge that says the comment felt kind
    const badge = sv("g", { opacity: 0, visibility: "hidden" }, vague.inner);
    Loom.th.iconDisc(ctx, badge, 650, 168, 34, "heart", "accent3", "surface");
    Loom.drive((e) => {
      const v = clamp(e, 0, 1);
      badge.setAttribute("opacity", num(clamp(v * 3, 0, 1)));
      badge.setAttribute("visibility", v > 0.001 ? "inherit" : "hidden");
      badge.setAttribute("transform", "translate(650 168) rotate(" + num((1 - v) * -14) + ") scale(" + num(0.4 + 0.6 * v) + ") translate(-650 -168)");
    }, tFeel + 0.3, 0.4, "overshoot", { key: "b04.badge" });

    // ---- signs: paper with ink outline, hand lettered ----
    function sign(name, word, cx, t, tilt) {
      const SW = 400, SH = 112;
      const E = ctx.el(name, { x: cx - SW / 2, y: 190, w: SW, h: SH, kind: "card", exit: "recede" });
      const g = sv("g", { transform: "rotate(" + tilt + " " + SW / 2 + " " + SH / 2 + ")" }, E.inner);
      kit.rect(g, 0, 0, SW, SH, { fill: "surface", r: 16 });
      kit.text(g, word, { role: "title", weight: 400, x: 24, y: 10, w: SW - 48, h: SH - 20, align: "center", valign: "middle" });
      m.drop(E, t);
      return E;
    }
    sign("feeling_sign", "Feeling", LX, tFeel + 0.05, -2);
    sign("target_sign", "Target", RX, tTarg + 0.15, 2);

    // ---- right: the target board, no dart yet ----
    const D = 480;
    const board = ctx.el("board", { x: RX - D / 2, y: CY - D / 2, w: D, h: D, kind: "object", exit: "recede" });
    const bc = D / 2;
    // @form target_board: concentric rings with an ink outline, an empty aim point
    [[240, "surface"], [192, "field2"], [144, "surface"], [96, "field2"], [48, "muted"]].forEach((r) => kit.disc(board.inner, bc, bc, r[0], { fill: r[1] }));
    m.drop(board, tTarg);

    // ---- the dart: tip at the bullseye, flies in along its own axis and stamps ----
    const DW = 220, DH = 130, TY = 80;   // tip at local (0, TY)
    const dart = ctx.el("dart", { x: RX, y: CY - TY, w: DW, h: DH, kind: "object", exit: "recede" });
    const tilt = sv("g", { transform: "rotate(-14 0 " + TY + ")" }, dart.inner);
    const fly = sv("g", { opacity: 0, visibility: "hidden" }, tilt);
    // @form dart: an accent dart with an ink shaft, stuck in the bullseye
    kit.rect(fly, 26, TY - 6, 130, 12, { fill: "ink", r: 5, flat: true });
    kit.polygon(fly, [[0, TY], [34, TY - 13], [34, TY + 13]], { fill: "muted" });
    kit.polygon(fly, [[120, TY - 4], [200, TY - 34], [220, TY - 28], [172, TY]], { fill: "accent" });
    kit.polygon(fly, [[120, TY + 4], [200, TY + 34], [220, TY + 28], [172, TY]], { fill: "accent" });
    const DX = 440 * Math.cos(14 * Math.PI / 180), DY = -440 * Math.sin(14 * Math.PI / 180);
    const place = (e) => {
      const v = clamp(e, 0, 1);
      fly.setAttribute("opacity", num(clamp(v * 6, 0, 1)));
      fly.setAttribute("visibility", v > 0.001 ? "inherit" : "hidden");
      fly.setAttribute("transform", "translate(" + num((1 - v) * DX) + " " + num((1 - v) * DY) + ")");
    };
    place(0);
    Loom.drive(place, tAct, 0.34, "enter", { key: "b04.dartfly" });
    // stamp: a small overshoot of the whole dart about its tip on landing
    const stamp = sv("g", {}, dart.inner);
    stamp.appendChild(tilt);
    Loom.drive((e) => {
      const s = 1 + 0.12 * Math.sin(e * Math.PI) * (1 - e * 0.5);
      stamp.setAttribute("transform", "translate(0 " + TY + ") scale(" + num(s) + ") translate(0 " + (-TY) + ")");
    }, tAct + 0.34, 0.3, "linear", { key: "b04.dartstamp" });
    // impact ticks round the tip
    const hit = sv("g", { opacity: 0, visibility: "hidden" }, dart.inner);
    [[-40, -26], [-46, 6], [-36, 38]].forEach((p) => kit.line(hit, p[0] + 6, TY + p[1], p[0] - 18, TY + p[1] * 1.5, { stroke: "ink", sw: 5 }));
    Loom.drive((e) => {
      const op = Math.sin(clamp(e, 0, 1) * Math.PI);
      hit.setAttribute("opacity", num(op));
      hit.setAttribute("visibility", op > 0.01 ? "inherit" : "hidden");
    }, tAct + 0.34, 0.6, "linear", { key: "b04.hit" });

    // ---- ambient: a slow sway so the wall never freezes ----
    m.drift(vague, tFeel + 0.8, ctx.end, { amp: 4, period: 3.2 });
    m.drift(board, tTarg + 0.8, ctx.end, { amp: 3, period: 3.6 });
  },
});
