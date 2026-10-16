// @design misconception_breaks_into_path: the expected idea is shown and struck, then the separate pieces light as one continuous path
/* b07 - "So the goal is not a cold room. Cooling is a path. Cool in at the front, warm out the back."
 * Station: air_section, held from b06; the last frame of the air section. The camera pulls back to the whole route (the
 * frame coordinates the world was drawn in: scale 1, shifted up 45 px so the route sits clear of the caption band), so
 * server, cooling unit, water loop, wall and outdoor unit are all in view. Then:
 *   cold_room_tag   a small card in the room's top left: a snowflake icon (struck through) and "Not a cold room"
 *   path_line       ONE accent line over the whole route, server to outside, with its label "A path"
 *   label_front, label_back   the server's own face labels return (the kit's pills, hidden since b05)
 *
 * Look first: lnd-explainer-craft s1.13 (expected, then actual: strike it and keep it visible) and corporate-clean R3
 * (move the accent, do not dim the rest): the accent is spent once, on the path line; the temperature streams step back
 * to 35 % while it draws, so the frame keeps at most two saturated families (blue plus the dimmed warm and cool).
 *
 * Three treatments considered (animation gate: motion only where the taught thing changes over time):
 *   A. A myth/fact compare card. Rejected: the picture IS the argument; a card would take the route off screen.
 *   B. Freeze the picture and fade the tag in; the line is a static overlay. Rejected: the misconception breaking is a
 *      change over time, so the line has to DRAW the connection piece by piece.
 *   C. CHOSEN: pull back; settle the tag and strike its snowflake on "not a cold room"; on "Cooling is a path" the accent
 *      line draws left to right over everything while the tag dims and the streams step back; the face labels return on
 *      their words and the frame rests.
 *
 * Beat sheet (words from the task's phrase timings):
 *   "So the goal is not a cold room"   camera pulls back (1.4 s); the tag settles; its snowflake is struck on "cold room"
 *   "Cooling is a path"                the line draws server to outside (1.2 s); label A path settles; tag and streams dim
 *   "Cool in at the front"             Front: cool in returns on the server
 *   "warm out the back"                Back: warm out returns; the frame rests
 */
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const D = (k, f) => S.dur(k) * (f || 1);

    // ---- take over the held picture (b07's keep claims server_side, cooling_unit, return_stream, supply_stream,
    // water_loop, building_wall and outdoor_unit)
    const W = ctx.held("air_world");
    const H = {};
    ["room", "cool_stream", "warm_stream", "label_front", "label_back", "coil", "ground_outside", "warm_air"].forEach((n) => { H[n] = ctx.held(n); });
    const G = W.geo, dc = W.dc, srv = W.srv, P = W.inner;
    const { SX, LY, UX, UY, UW, WX, OX, OW, OY } = G;
    const U = dc.unit;
    W.exit = "recede";                                   // the last beat of the section: the whole picture leaves with the cut

    // ---- the cold-room tag: a small card, a struck snowflake and the words (all neutral)
    // @form struck_icon_tag: a small card pairing an icon struck through with the short claim it cancels
    const TAGW = 450, TAGH = 100;
    const tag = ctx.el("cold_room_tag", { x: 128, y: 196, w: TAGW, h: TAGH, kind: "card", parent: P, exit: "none" });
    kit.rect(tag.inner, 0, 0, TAGW, TAGH, { fill: "surface", r: 20 });
    kit.icon(tag.inner, "snowflake", { x: 58, y: 50, size: 56, color: "muted" });
    kit.text(tag.inner, "Not a cold room", { role: "label", size: 30, weight: 700, x: 106, y: 0, w: TAGW - 106 - 28, h: TAGH, valign: "middle", maxLines: 1, color: "ink" });
    // @form strike_out_stroke: one stroke struck across an item to cancel it
    const strike = kit.path(tag.inner, "M26 78 L90 22", { stroke: "ink", sw: 6 });

    // ---- the path line: one accent line over the whole route, server front to the open air above the outdoor unit
    const xMid = UX + UW / 2, xRise = SX + 980, yTop = 300, yOutPipe = UY + 240;
    const pts = [[SX + 6, LY[1]], [xRise, LY[1]], [xRise, yTop], [xMid, yTop], [xMid, yOutPipe], [OX + OW / 2, yOutPipe], [OX + OW / 2, OY - 74]];
    const lineL = dc.layer("path_line", "connector", { x: SX - 10, y: yTop - 14, w: OX + OW / 2 + 14 - (SX - 10), h: yOutPipe + 14 - (yTop - 14) });
    const lineD = dc.rounded(pts, 22);
    const linePath = kit.path(lineL.g, lineD, { stroke: "accent", sw: 10 });
    // the arrow head at the end of the line (m.draw lands a head given as {g, path, head})
    const tip = pts[pts.length - 1], hs = 24;
    const head = Loom.svg("polygon", { points: tip[0] + "," + (tip[1] - 6) + " " + (tip[0] - hs * 0.62) + "," + (tip[1] + hs - 6) + " " + (tip[0] + hs * 0.62) + "," + (tip[1] + hs - 6), fill: ctx.c("accent") }, lineL.g);
    head.setAttribute("transform", "rotate(0 " + tip[0] + " " + tip[1] + ")");
    // the label hangs from the top of the arc
    const lPath = dc.label("label_path", "A path", (xRise + xMid) / 2, yTop - 92, { x: (xRise + xMid) / 2, y: yTop }, {});

    // ---- times, all from the narration
    const tGoal = ctx.cue("So the goal is not a cold room");
    const tTag = ctx.cue("goal is not");
    const tCold = ctx.cue("cold room");
    const tPath = ctx.cue("Cooling is a path");
    const tPathWord = ctx.cue("a path");
    const tFront = ctx.cue("Cool in at the front");
    const tBack = ctx.cue("warm out the back");

    // "So the goal is not a cold room": the camera pulls back to the whole route; the tag settles; the snowflake is struck
    dc.cam({ x: 0, y: 45, w: 1920, h: 1080 }, tGoal, 1.4, { margin: 0, cx: 960, cy: 540 });
    m.settle(tag, tTag, { dy: 20 });
    m.draw(strike, tCold, { dur: D("exit", 1.3) });

    // "Cooling is a path": one line traces the route left to right; its label settles; the tag and the streams step back
    m.draw({ g: lineL.g, path: linePath, head }, tPath, { dur: D("draw", 1.5), headAt: 0.95 });
    m.reveal(lPath.E, tPathWord, { dy: 10 });
    const dim = (E, t) => Loom.tween(E.life, { opacity: 1 }, { opacity: 0.35, duration: D("enter"), ease: Loom.ease.move }, t, { kind: "ambient", beat: E.beat, name: E.name });
    Loom.tween(tag.life, { opacity: 1 }, { opacity: 0.5, duration: D("enter"), ease: Loom.ease.move }, tPath, { kind: "ambient", beat: tag.beat, name: tag.name });
    [H.cool_stream, H.warm_stream, U.ret, U.sup, H.warm_air].forEach((E) => { if (E) dim(E, tPath); });

    // the face labels return on their words (the kit's own pills, hidden since b05)
    srv.reveal("label_front", tFront, { dy: 10 });
    srv.reveal("label_back", tBack, { dy: 10 });

    // the picture rests, with everything still flowing (period-locked)
    srv.flow(ctx.start, ctx.end, { speed: 120 });
    U.retStreams.forEach((s) => s.flow(ctx.start, ctx.end, { speed: 120 }));
    U.inStreams.forEach((s) => s.flow(ctx.start, ctx.end, { speed: 120 }));
    U.supStreams.forEach((s) => s.flow(ctx.start, ctx.end, { speed: 120 }));
    void S; void WX; void OY;
  },
});
