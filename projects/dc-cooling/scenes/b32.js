// @design route_rule_rest: the finished map holds as the rule is printed over it, and two closed marks settle on the places where the leaks were
/* b32, "Keep the heat moving out. Stop it leaking back."  (station: route; intent: rest)
 *
 * Three treatments considered:
 *   A. A title card with the two lines. Rejected (storyboard upgrade_reason): it would hide the finished map the
 *      whole film promised in b03.
 *   B. The lines printed ON the map, in the empty band between the lanes. Rejected: that band is 810 px wide, and a
 *      title-role line of this length does not fit it at 60 px, and it would sit among the streams.
 *   C. (wins) The map holds exactly where b31 left it (scale 0.95, low in the frame) with a clear band above it; the
 *      two lines print there, in the title role, one on each phrase; with the second line two small closed marks
 *      settle at the two leak points the film showed. Then the frame rests: it finished building, so nothing else moves
 *      except the warm air that leaves the outdoor unit, which IS the first line.
 *
 * Held: route_map (E.kit is the heat_route handle), server_on_map, liquid_lane, stage_labels, air_lane, air_labels.
 * Kit use: Loom.lesson.heat_route, composed in b30 and held here as E.kit (settle, release).
 * Marks (no words, each a small chip on the place it closes): a blanking plate at the server's front, a closed door on
 * the hot aisle, each with a tick.
 */
Loom.scene("b32", {
  build(ctx) {
    const { kit, m } = ctx;
    const PX = 100, PY = 120;

    const tOut = ctx.cue("Keep the heat moving out");
    const tBack = ctx.cue("Stop it leaking back");

    const E = ctx.held("route_map");
    const route = E.kit;

    // the last hand-off (the outdoor unit named in b31) settles: the finished map has no owner
    route.settle("outside", ctx.start + 0.1);
    route.release(ctx.start, ctx.end);

    // ---- the rule, above the map, one line on each phrase (screen coordinates, outside the map element)
    const W = 1500, H = 84;   // the title face is about 1.3 x its size from ascent to descent: 60 px needs ~78
    const line = (name, text, y, color, t) => {
      const P = ctx.el(name, { x: (1920 - W) / 2, y, w: W, h: H, kind: "text" });
      kit.text(P.inner, text, { role: "title", x: 0, y: 0, w: W, h: H, align: "center", valign: "middle", maxLines: 1, weight: 700, color });
      m.unmask(P, t, { dur: 0.6 });
      return P;
    };
    // @form rule_line: a short line printed in the title role over a finished picture
    line("rule_out", "Keep the heat moving out", 32, "ink", tOut);
    line("rule_back", "Stop it leaking back", 32 + H + 2, "accent", tBack);

    // ---- the two closed marks, on the places the film showed leaking
    const CHIP = 104;
    // marks live in the map's own coordinates (so they keep their place on the map): natural -> element coordinates
    const place = (nx, ny) => ({ x: PX + nx, y: PY + ny });
    const mkMark = (name, p, drawIcon, t) => {
      const P = ctx.el(name, { x: p.x - CHIP / 2, y: p.y - CHIP / 2, w: CHIP, h: CHIP, kind: "mark", parent: E.inner });
      kit.rect(P.inner, 0, 0, CHIP, CHIP, { fill: "surface", r: 14, stroke: "surface2", sw: 2 });
      drawIcon(P.inner);
      kit.mark(P.inner, "yes", CHIP - 10, 16, 42);
      m.pop(P, t, { dur: 0.4 });
      return P;
    };
    // server's front: a blanking plate (a flat plate with its four screws) sitting in the slot
    mkMark("closed_mark_front", place(14, 244), (g) => {
      kit.rect(g, 14, 40, 76, 30, { fill: "accent3", r: 6, shadow: false });
      [[24, 49], [80, 49], [24, 61], [80, 61]].forEach((q) => kit.disc(g, q[0], q[1], 3.5, { fill: "surface", shadow: false }));
    }, tBack + 0.45);
    // hot aisle: a closed door
    mkMark("closed_mark_door", place(740, 428), (g) => {
      kit.icon(g, "door-closed", { x: 22, y: 28, size: 60, color: "ink" });
    }, tBack + 0.75);
  },
});
