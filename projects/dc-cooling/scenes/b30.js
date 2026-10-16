// @design route_relit: the opening map returns and its first lane is lit stage by stage, each hand-off named on its word while the camera walks the lane once
/* b30, "Back to one server. Chip, cold plate, rack loop, CDU, facility water, outside."  (station: route)
 *
 * Three treatments considered (lnd-motion-choreography-loop):
 *   A. Lay the six stages out as a row of cards and light them one by one. Rejected: the card row IS the template
 *      look the storyboard upgraded away from, and it throws away the map b03 promised.
 *   B. Cut to the finished, fully lit map and let the narration point at it. Rejected: the payoff is the heat
 *      TRAVELLING the path once in the order the film taught it; a lit map at once has no order to follow.
 *   C. (wins) The b03 map comes back through the same kit part, faint, in the same place; the server settles at the
 *      left; each stage is lit and NAMED on its word, so exactly one owner of the route is blue at a time (guide R1)
 *      and the camera makes one long left-to-right move along the lane (motion is content: the path is the lesson).
 *
 * Kit: Loom.lesson.heat_route (never redrawn). Held to b31 and b32 through ONE full-frame element `route_map` (the
 * camera moves its mover, so everything the part draws moves together). The keep list of b31/b32 also names
 * server_on_map, liquid_lane and stage_labels: they are real elements inside route_map, with the true boxes of what
 * they stand for (the kit draws these pieces itself, so the elements carry no drawing of their own).
 *
 * Kit use: Loom.lesson.heat_route (which embeds Loom.lesson.server_side as its server) is composed below and kept as E.kit.
 *
 * Type: the part draws labels at 30 px; the camera holds 1.45, so they are about 43 px as seen. The long pan leaves the
 * first stages' labels behind at the left edge, so the pan's window is declared as a deliberate crop (data-bleed).
 */
Loom.scene("b30", {
  build(ctx) {
    const { kit, m } = ctx;
    const PX = 100, PY = 120;                         // the part sits where b03 puts it (natural 1720 x 760 on a 1920 frame)

    const tOne = ctx.cue("one server");
    const tChip = ctx.cue("Chip");
    const tPlate = ctx.cue("cold plate");
    const tLoop = ctx.cue("rack loop");
    const tCdu = ctx.cue("CDU");
    const tWater = ctx.cue("facility water");
    const tOut = ctx.cue("outside");
    const L = 0.12;                                   // a hand-off lights just after its word starts

    // ---- the map: one full-frame element so the camera can walk along it (Loom.cam.frame moves its mover)
    const E = ctx.el("route_map", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    // Loom.cam.frame writes the mover with transformOrigin "0 0", which GSAP reads from the content's bbox corner; a
    // frame-sized box (no paint) puts that corner at (0, 0), so the camera maths below is in screen coordinates
    kit.rect(E.inner, 0, 0, 1920, 1080, { fill: "none", shadow: false });
    const route = Loom.lesson.heat_route(ctx, E.inner, { x: PX, y: PY, hide: ["server"] });
    E.kit = route;
    const A = route.anchors;

    // the pieces the storyboard keeps by name, each with the box of what it stands for (screen = element coords)
    // @form named_region_box: an element with the true box of a region that a kit part draws, so a storyboard can keep it by name
    const mkPart = (name, r) => {
      const P = ctx.el(name, { x: r.x, y: r.y, w: r.w, h: r.h, kind: "scenery", parent: E.inner });
      kit.rect(P.inner, 0, 0, r.w, r.h, { fill: "none", shadow: false });
      return P;
    };
    const serverOnMap = mkPart("server_on_map", A.server);
    const liquidLane = mkPart("liquid_lane", { x: PX, y: PY + 53, w: 1720, h: 250 });
    const stageLabels = mkPart("stage_labels", { x: PX, y: PY + 53, w: 1720, h: 54 });

    // ---- camera: zoomed on the server end, then one long pan to the outdoor unit (editorial ease, 5 s)
    const view = (s, cx, cy, t, dur) => Loom.cam.frame(E, { x: cx - 960 / s, y: cy - 540 / s, w: 1920 / s, h: 1080 / s }, t, dur, { margin: 0, cy: 470, name: "route_map.pan" });
    const S0 = 1.45;
    view(S0, 722, 380, ctx.start - 0.1, 0.05);        // the opening frame (no move seen: the element is not shown yet)
    const tPanEnd = view(S0, 1198, 380, tPlate + 0.1, 4.9);
    E.outer.setAttribute("data-bleed", `${(tPlate + 0.1).toFixed(2)}-${ctx.end.toFixed(2)}`);   // the pan walks away from the first stages

    // ---- the map returns, faint, exactly as b03 left it; the server settles at its left end
    m.reveal(E, ctx.start + 0.05, { dy: 0 });
    route.wipeFaint(ctx.start + 0.25, { dur: 1.1 });
    route.reveal("server", tOne, { dy: 24 });
    [serverOnMap, liquidLane, stageLabels].forEach((P) => m.reveal(P, tOne, { dy: 0, dur: 0.05 }));

    // ---- one owner at a time: each stage is lit and named on its word; the last one is named when it is spoken
    const hand = (id, t) => { route.name(id, t + L); Loom.sfx("tick", t + L); };
    hand("chip", tChip);
    hand("cold_plate", tPlate);
    hand("rack_loop", tLoop);
    hand("cdu", tCdu);
    hand("facility_water", tWater);
    hand("outside", tOut);

    // the outdoor unit releases warm air once it is lit (period-locked beads; they continue in b31 and b32)
    route.release(tOut + 0.5, ctx.end);
    void tPanEnd; void kit;
  },
});
