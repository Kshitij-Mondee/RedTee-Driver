// @design route_relit_continued: the same map, the second lane lit beside the first, each stage named on its word while the camera pulls back to the whole map
/* b31, "Or by air, front, back, hot aisle, cooling unit, outside."  (station: route)
 *
 * Three treatments considered:
 *   A. A second, separate map for the air path. Rejected: the point is that BOTH paths end in one place, so they must
 *      share one map and one outdoor unit.
 *   B. Light the whole lower lane at once. Rejected: the narration names five hand-offs in order; the order is the lesson.
 *   C. (wins) The held map, the lower lane lit stage by stage on its words (front, back, hot aisle, cooling unit, then
 *      its water line to the same outdoor unit, which is named again: two lanes, one place). The camera that walked
 *      the liquid lane pulls back to the whole map, so both lanes are in frame as the air lane lights.
 *
 * Held from b30: route_map (the part sits inside it, E.kit is the heat_route handle), server_on_map, liquid_lane and
 * stage_labels (named in this beat's keep). New here: air_lane and air_labels, elements with the boxes of the lower
 * lane and its labels (the kit draws the stages themselves).
 *
 * Kit use: Loom.lesson.heat_route, composed in b30 and held here as E.kit (route.name / route.light for each stage).
 *
 * The pull-back lands on the framing b32 rests on: scale 0.95 (labels stay 28.5 px as seen), the map low in the
 * frame so b32's two lines have a clear band above it.
 */
Loom.scene("b31", {
  build(ctx) {
    const { kit, m } = ctx;
    const PX = 100, PY = 120;

    const tAir = ctx.cue("Or by air");
    const tFront = ctx.cue("front");
    const tBack = ctx.cue("back");
    const tAisle = ctx.cue("hot aisle");
    const tUnit = ctx.cue("cooling unit");
    const tOut = ctx.cue("outside");
    const L = 0.12;

    const E = ctx.held("route_map");
    const route = E.kit;
    const A = route.anchors;

    // @form named_region_box: an element with the true box of a region that a kit part draws, so a storyboard can keep it by name
    const mkPart = (name, r) => {
      const P = ctx.el(name, { x: r.x, y: r.y, w: r.w, h: r.h, kind: "scenery", parent: E.inner });
      kit.rect(P.inner, 0, 0, r.w, r.h, { fill: "none", shadow: false });
      return P;
    };
    const airLane = mkPart("air_lane", { x: PX, y: PY + 380, w: 1720, h: 220 });
    const airLabels = mkPart("air_labels", { x: PX, y: PY + 495, w: 1720, h: 270 });
    m.reveal(airLane, tFront, { dy: 0, dur: 0.05 });
    m.reveal(airLabels, tFront, { dy: 0, dur: 0.05 });

    // ---- camera: pull back from the outdoor end to the whole map (the framing b32 rests on)
    Loom.cam.frame(E, { x: 960 - 960 / 0.95, y: 500 - 540 / 0.95, w: 1920 / 0.95, h: 1080 / 0.95 }, tAir, 1.3, { margin: 0, cy: 559, name: "route_map.pull" });

    // ---- the air lane, stage by stage; each owner is named on its word, the one before it settles
    const hand = (id, t) => { route.name(id, t + L); Loom.sfx("tick", t + L); };
    hand("front", tFront + 0.05);
    hand("back", tBack);
    hand("hot_aisle", tAisle);
    hand("cooling_unit", tUnit);
    // its water line draws to the same outdoor unit, then that unit is named again: both lanes end here
    route.light("air_water", tOut - 0.35);
    hand("outside", tOut + 0.25);

    // the warm air keeps leaving the outdoor unit (continues from b30, in time order)
    route.release(ctx.start, ctx.end);
  },
});
