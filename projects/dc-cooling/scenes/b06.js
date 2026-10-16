// @design pipe_through_wall: the heat leaves the building along a pipe that crosses the wall; a pulse rides the pipe and the warm air lifts away outside
/* b06 - "The heat rides a water loop, to equipment outside."
 * Station: air_section, held from b05 (the whole picture stays: server, streams, cooling unit). This beat adds, to the
 * right of the unit and in the same world coordinates the final wide shot (b07) uses:
 *   building_wall   the wall in section (slate, rises from the floor)         ground_outside  the floor carrying on outside
 *   water_loop      two pipes (line token, 5 px) from the coil to the outdoor unit, through the wall
 *   warm_pulse      one warm pulse (accent2) riding the outgoing pipe          outdoor_unit  a generic condenser with a fan on top
 *   warm_air        warm beads lifting off the fan into the open air           label_water, label_outside
 * The camera pans right with the pulse (m.travel on the held world, 1.4 s from the first word).
 *
 * Look first: corporate-clean R1 (a route across a place, one carrier per leg): the carrier here is the warm pulse, the
 * only moving thing on the right half until it arrives. Rules taken: pipes in the line token (connectors), the wall in
 * the slate of the kit's own heat_route, labels in the kit pill look.
 *
 * Three treatments considered (animation gate: motion only where the taught thing changes over time):
 *   A. A template flow "unit -> pipe -> outside". Rejected: loses the place the close returns to.
 *   B. Cut to the map (heat_route) to show the leg. Rejected: the beat is only 5 s and the map is the promise (b03) and the
 *      payoff (b30); here the viewer follows the heat in the room it just left.
 *   C. CHOSEN: the pipes draw from the unit toward the wall as the camera starts to pan; a warm pulse rides the outgoing
 *      pipe through the wall; as the pan ends the outdoor unit settles, the pulse arrives, and warm air lifts away.
 *
 * Beat sheet (words from the task's phrase timings; the beat is 5 s, so pan, draw and pulse run together):
 *   "The heat rides"        the cooling unit's accent steps back; the pipes draw (0.9 s); the camera starts its pan (1.4 s)
 *   "rides"                 the wall rises from the floor, the floor carries on outside; the pulse starts along the pipe
 *   "water loop"            the outdoor unit settles as the pan ends; label Water loop on the pipe
 *   "to equipment outside"  the pulse arrives at the outdoor unit; warm air lifts away from its fan
 *   "outside"               label Outside
 */
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const D = (k, f) => S.dur(k) * (f || 1);

    // ---- take over the held picture (b06's keep claims server_side, cooling_unit, return_stream, supply_stream)
    const W = ctx.held("air_world");
    ["room", "cool_stream", "warm_stream", "label_front", "label_back", "coil"].forEach((n) => ctx.held(n));
    const G = W.geo, dc = W.dc, srv = W.srv, P = W.inner;
    const { FLOOR, UX, UY, WX, WW, OX, OW, OY } = G;
    const U = dc.unit;
    const warm = ctx.c("accent2");
    const yOut = UY + 240, yBack = UY + 120;          // the two coil ends on the cabinet's right: out (warm) and return
    const x0 = UX + 156, x1 = OX;                     // pipes run from the coil's right end to the outdoor unit's left face

    // ---- the wall (rises from the floor) and the floor carrying on outside
    // @form wall_in_section: a slim slate slab standing from the floor, the edge between inside and outside
    const wall = ctx.el("building_wall", { x: WX, y: 150, w: WW, h: FLOOR + 26 - 150, kind: "scenery", parent: P, exit: "none" });
    kit.rect(wall.inner, 0, 0, WW, FLOOR + 26 - 150, { fill: "accent3", r: 6, shadow: false });
    const ground = ctx.el("ground_outside", { x: WX + WW, y: FLOOR, w: 620, h: 26, kind: "scenery", parent: P, exit: "none" });
    kit.rect(ground.inner, 0, 0, 620, 26, { fill: "surface2", r: 0, shadow: false });

    // ---- the water loop: two pipes from the coil's ends to the outdoor unit, through the wall
    const wl = dc.layer("water_loop", "connector", { x: x0 - 12, y: yBack - 12, w: x1 - x0 + 24, h: yOut - yBack + 24 });
    const pipeOut = kit.path(wl.g, "M" + x0 + " " + yOut + " H" + x1, { stroke: "line", sw: 5 });
    const pipeBack = kit.path(wl.g, "M" + x0 + " " + yBack + " H" + x1, { stroke: "line", sw: 5 });

    // ---- the outdoor unit: a cabinet with louvres, pipe stubs on its left face and a fan on top
    // @form outdoor_condenser: a tall cabinet with louvre slots and a flat fan on its top, a generic outdoor unit
    const out = ctx.el("outdoor_unit", { x: OX - 12, y: OY - 62, w: OW + 24, h: FLOOR - OY + 62, kind: "instrument", parent: P, exit: "none" });
    const O = Loom.svg("g", { transform: "translate(12 62)" }, out.inner);
    kit.rect(O, 0, 0, OW, FLOOR - OY, { fill: "surface", r: 14 });
    for (let k = 0; k < 6; k++) kit.rect(O, 22, 150 + k * 22, OW - 44, 7, { fill: "surface2", r: 3, shadow: false });
    [yBack, yOut].forEach((y) => kit.rect(O, -10, y - OY - 8, 14, 16, { fill: "muted", r: 3, shadow: false }));
    kit.rect(O, 12, -18, OW - 24, 18, { fill: "surface2", r: 6 });
    [0, 1].forEach((k) => Loom.svg("ellipse", { cx: OW / 2, cy: -30 - k * 3, rx: 58, ry: 7, fill: ctx.c("accent3"), transform: "rotate(" + (k ? 9 : -9) + " " + OW / 2 + " " + (-30 - k * 3) + ")" }, O));
    kit.disc(O, OW / 2, -30, 7, { fill: "muted", shadow: false });

    // ---- the pulse: one warm pill with a short fading tail, riding the outgoing pipe (m.along moves its element)
    // @form travelling_pulse: one coloured pill with a fading tail that rides a path; the carrier of a value
    const pulse = ctx.el("warm_pulse", { x: 0, y: 0, w: 90, h: 16, kind: "token", parent: P, exit: "none" });
    [[8, 0.35, 3.5], [20, 0.55, 5]].forEach(([x, o, r]) => Loom.svg("circle", { cx: x, cy: 8, r, fill: warm, opacity: o }, pulse.inner));
    kit.rect(pulse.inner, 30, 0, 60, 16, { fill: "accent2", r: 8, shadow: false });
    const ruler = Loom.svg("path", { d: "M" + (x0 - 60) + " " + (yOut - 8) + " H" + (x1 + 12 - 60), fill: "none", stroke: "none" }, P);

    // ---- warm air lifting off the fan (beads, three lanes)
    const plumePts = [[[OX + 56, OY - 48], [OX + 118, OY - 188]], [[OX + 84, OY - 48], [OX + 142, OY - 154]], [[OX + 112, OY - 48], [OX + 158, OY - 120]]];
    const plume = dc.layer("warm_air", "token", { x: OX + 36, y: OY - 214, w: 150, h: 190 });
    const plumeS = [
      "M" + (OX + 56) + " " + (OY - 48) + " C" + (OX + 56) + " " + (OY - 104) + " " + (OX + 80) + " " + (OY - 150) + " " + (OX + 118) + " " + (OY - 188),
      "M" + (OX + 84) + " " + (OY - 48) + " C" + (OX + 84) + " " + (OY - 96) + " " + (OX + 108) + " " + (OY - 128) + " " + (OX + 142) + " " + (OY - 154),
      "M" + (OX + 112) + " " + (OY - 48) + " C" + (OX + 112) + " " + (OY - 80) + " " + (OX + 128) + " " + (OY - 102) + " " + (OX + 158) + " " + (OY - 120),
    ].map((d) => dc.stream(plume.g, d, { fill: "accent2", fadeStart: true, fadeEnd: true }));
    void plumePts;

    // ---- labels (the kit's pill look): Water loop on the pipe, Outside under the outdoor unit
    const lWater = dc.label("label_water", "Water loop", WX - 105, yBack - 58, { x: WX - 105, y: yBack }, { size: 28 });
    const lOut = dc.label("label_outside", "Outside", OX + OW / 2, FLOOR + 62, { x: OX + OW / 2, y: FLOOR }, {});

    // ---- times, all from the narration
    const tRides = ctx.cue("The heat rides");
    const tRide = ctx.cue("rides");
    const tWater = ctx.cue("water loop");
    const tEquip = ctx.cue("to equipment outside");
    const tOutWord = ctx.cue("outside");

    // "The heat rides a water loop": the unit's accent steps back; pipes draw from the unit toward the wall as the
    // camera starts its pan with them
    U.ringT.to(0, tRides, 0.4);
    U.uLab.named.to(0, tRides, 0.3);
    m.draw(wl.E, tRides, { dur: D("draw", 1.1), together: true });
    dc.cam({ x: 1170, y: 300, w: 720, h: 600 }, tRides, 1.4, { margin: 40, maxScale: 1.35, cx: 960, cy: 470 });

    // the wall rises, the floor carries on outside, the pulse starts along the pipe
    m.grow(wall, tRide);
    m.unmask(ground, tRide + 0.1, { dur: D("draw", 1.1) });
    m.reveal(pulse, tRides + 0.4, { dy: 0, dur: D("exit", 0.8) });
    const tArrive = m.along(pulse, ruler, tRides + 0.45, { dur: tEquip + 0.1 - (tRides + 0.45), ease: "editorial" });

    // "water loop": the outdoor unit settles as the pan ends; the label sits on the pipe
    m.settle(out, tWater - 0.2, { dy: 24 });
    m.reveal(lWater.E, tWater + 0.1, { dy: 10 });

    // "to equipment outside": the pulse arrives (it fades into the unit), warm air lifts away from the fan
    m.exit(pulse, tArrive - 0.05, "recede");
    plumeS.forEach((s) => s.reveal(tArrive - 0.1, 0.6, "linear"));
    m.reveal(lOut.E, tOutWord + 0.05, { dy: 10 });

    // everything keeps flowing (period-locked): the server, the arcs, the coil, the supply, the plume
    srv.flow(ctx.start, ctx.end, { speed: 120 });
    U.retStreams.forEach((s) => s.flow(ctx.start, ctx.end, { speed: 120 }));
    U.inStreams.forEach((s) => s.flow(ctx.start, ctx.end, { speed: 120 }));
    U.supStreams.forEach((s) => s.flow(ctx.start, ctx.end, { speed: 120 }));
    plumeS.forEach((s) => s.flow(tArrive - 0.1, ctx.end, { speed: 120 }));
    void S;
  },
});
