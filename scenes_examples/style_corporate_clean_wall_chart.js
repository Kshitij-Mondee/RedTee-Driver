// @design wall_chart_push: a number shown where a team would really see it, on the meeting-room screen; grey context, one blue bar, then the camera walks up to the bar that changed
// @lab {"title": "corporate-clean example: a number on the meeting-room screen (grey context, one blue bar, a push in)", "styles": ["corporate-clean"], "dur": 13.4, "times": [1.7, 3.4, 5.0, 6.7, 8.4, 10.1, 11.7], "words": [{"w": "Say", "s": 0.4, "e": 0.61}, {"w": "your", "s": 0.65, "e": 0.89}, {"w": "team", "s": 0.93, "e": 1.17}, {"w": "tracks", "s": 1.21, "e": 1.51}, {"w": "how", "s": 1.55, "e": 1.76}, {"w": "long", "s": 1.8, "e": 2.04}, {"w": "a", "s": 2.08, "e": 2.23}, {"w": "request", "s": 2.27, "e": 2.6}, {"w": "waits", "s": 2.64, "e": 2.91}, {"w": "For", "s": 3.2, "e": 3.41}, {"w": "most", "s": 3.45, "e": 3.69}, {"w": "of", "s": 3.73, "e": 3.91}, {"w": "the", "s": 3.95, "e": 4.16}, {"w": "year", "s": 4.2, "e": 4.44}, {"w": "it", "s": 4.48, "e": 4.66}, {"w": "hovers", "s": 4.7, "e": 5.0}, {"w": "around", "s": 5.04, "e": 5.34}, {"w": "three", "s": 5.38, "e": 5.65}, {"w": "days", "s": 5.69, "e": 5.93}, {"w": "In", "s": 6.22, "e": 6.4}, {"w": "June", "s": 6.44, "e": 6.68}, {"w": "after", "s": 6.82, "e": 7.09}, {"w": "the", "s": 7.13, "e": 7.34}, {"w": "new", "s": 7.38, "e": 7.59}, {"w": "route", "s": 7.63, "e": 7.9}, {"w": "it", "s": 8.04, "e": 8.22}, {"w": "drops", "s": 8.26, "e": 8.53}, {"w": "to", "s": 8.57, "e": 8.75}, {"w": "under", "s": 8.79, "e": 9.06}, {"w": "one", "s": 9.1, "e": 9.31}, {"w": "That", "s": 9.6, "e": 9.84}, {"w": "drop", "s": 9.88, "e": 10.12}, {"w": "is", "s": 10.16, "e": 10.34}, {"w": "the", "s": 10.38, "e": 10.59}, {"w": "change", "s": 10.63, "e": 10.93}, {"w": "worth", "s": 10.97, "e": 11.24}, {"w": "talking", "s": 11.28, "e": 11.61}, {"w": "about", "s": 11.65, "e": 11.92}], "_timing": "estimated from the narration at about 180 wpm (no TTS run); a composed lesson uses the real word timings"}
/* Style example for corporate-clean (docs/styles/guides/corporate-clean.md, recipe R2). Not a lesson beat: a model
 * of the register for data in this style. Written for this narration (hypothetical, framed with "say", so the
 * numbers need no source; in a real lesson every value comes from the knowledge sheet):
 *   "Say your team tracks how long a request waits. For most of the year it hovers around three days. In June,
 *    after the new route, it drops to under one. That drop is the change worth talking about."
 * What it shows, per the guide:
 *   - data in a PLACE: a wall screen in a meeting room, the table edge in the near ground (s6, s9);
 *   - context in slate (accent3), the one bar the narration names in blue (accent), and nothing else saturated:
 *     grey-and-one-highlight is the data rule of this style (s2, s9);
 *   - only spoken values are on screen: a "3 days" reference line and the June value; months label the axis
 *     directly, no legend (s9);
 *   - a camera move inside the idea instead of a cut: Loom.cam.frame pushes up to the bar that changed (s7);
 *   - type: lead for the chart title, label (28 to 30 px, weight passed explicitly) for axis words; tag text on the
 *     accent is onAccent via
 *     Loom.style.pickTokenOn (s3).
 * Real APIs only: ctx.el, kit.rect, kit.text, kit.line, kit.polygon, m.reveal, m.grow, m.unmask,
 * Loom.cam.frame, Loom.style.pickTokenOn, Loom.sfx (docs/SCENE_API.md; runtime/kit.js, motion.js, places.js).
 */
Loom.scene("style_corporate_clean_wall_chart", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const tSay = ctx.cue("tracks how long a request waits");
    const tHover = ctx.cue("hovers around three days");
    const tDrop = ctx.cue("drops to under one");
    const tTalk = ctx.cue("the change worth talking about");

    // ---- the room: one element, so the camera can walk into it (wall, floor, the screen, the chart, the chairs)
    const room = ctx.el("meeting_room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    kit.rect(room.inner, 0, 0, 1920, 800, { fill: "field2", r: 0, shadow: false, crisp: true });          // wall
    kit.rect(room.inner, 0, 800, 1920, 280, { fill: "surface2", r: 0, shadow: false, crisp: true });      // floor
    kit.line(room.inner, 0, 800, 1920, 800, { stroke: "line", sw: 2 });                                   // skirting
    // the wall screen: an ink bezel, a white panel, a soft offset shadow from the pack (shape.shadow)
    const SX = 360, SY = 100, SW = 1200, SH = 680;
    kit.rect(room.inner, SX, SY, SW, SH, { fill: "ink", r: 14 });
    kit.rect(room.inner, SX + 16, SY + 16, SW - 32, SH - 32, { fill: "surface", r: 6, shadow: false });
    kit.rect(room.inner, SX + SW / 2 - 60, SY + SH, 120, 20, { fill: "ink", r: 4, shadow: false });      // the mount

    // ---- the chart, in the screen's coordinates (room-local)
    const BASE = 700, PER_DAY = 108, X0 = 500, STEP = 170, BW = 100;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const days = [3.1, 2.9, 3.2, 3.0, 2.8, 0.8];          // hypothetical (the narration frames it with "say")
    const title = ctx.el("chart_title", { x: SX + 70, y: SY + 50, w: 900, h: 60, kind: "text", parent: room.inner });
    kit.text(title.inner, "Days a request waits", { role: "lead", x: 0, y: 0, w: 900, h: 60, maxLines: 1, weight: 700, color: "ink" });
    // connectors get true boxes that hug their line (an unmask wipes the element's own box, so a full-frame box made
    // the wipe spend most of its time on empty space)
    const AXW = 5 * STEP + BW + 80;
    const axis = ctx.el("chart_axis", { x: X0 - 40, y: BASE - 4, w: AXW, h: 8, kind: "connector", parent: room.inner });
    kit.line(axis.inner, 0, 4, AXW, 4, { stroke: "line", sw: 3 });
    const bars = days.map((d, i) => {
      const h = d * PER_DAY, x = X0 + i * STEP, last = i === days.length - 1;
      const B = ctx.el(`bar_${months[i].toLowerCase()}`, { x, y: BASE - h, w: BW, h, kind: "bar", parent: room.inner });
      kit.rect(B.inner, 0, 0, BW, h, { fill: last ? "accent" : "accent3", r: 6, shadow: false });
      const L = ctx.el(`month_${months[i].toLowerCase()}`, { x: x - 20, y: BASE + 10, w: BW + 40, h: 44, kind: "text", parent: room.inner });
      kit.text(L.inner, months[i], { role: "label", x: 0, y: 0, w: BW + 40, h: 44, maxLines: 1, align: "center", color: last ? "ink" : "muted", weight: last ? 700 : 500 });
      return { B, L };
    });
    // the reference line the narration speaks ("around three days"), dashed and quiet, labelled on its open side
    const refY = BASE - 3 * PER_DAY;
    const ref = ctx.el("ref_three_days", { x: X0 - 40, y: refY - 4, w: AXW, h: 8, kind: "connector", parent: room.inner });
    kit.line(ref.inner, 0, 4, AXW, 4, { stroke: "muted", sw: 3, dash: "12 10" });
    const refLab = ctx.el("ref_label", { x: X0 + 5 * STEP - 120, y: refY - 52, w: 260, h: 44, kind: "text", parent: room.inner });
    kit.text(refLab.inner, "about 3 days", { role: "label", x: 0, y: 0, w: 260, h: 44, maxLines: 1, align: "right", color: "muted" });

    // the named value: a tag on the June bar, in the accent, text colour picked by contrast
    // @form value_tag_on_bar: the one spoken value, a solid accent tag sitting on its own bar
    const jx = X0 + 5 * STEP + BW / 2, jTop = BASE - days[5] * PER_DAY;
    const tag = ctx.el("tag_june", { x: jx - 110, y: jTop - 74, w: 220, h: 56, kind: "label", parent: room.inner });
    kit.rect(tag.inner, 0, 0, 220, 56, { fill: "accent", r: 10, shadow: false });
    kit.text(tag.inner, "under 1 day", { role: "label", x: 16, y: 0, w: 188, h: 56, maxLines: 1, align: "center", valign: "middle", weight: 700, color: S.pickTokenOn("accent") });

    // ---- near ground: the near edge of the meeting table (we sit at it). Furniture stays in neutrals (surface,
    // surface2, line): no accent on anything that is not the point. A first version put a laptop (surface2) and a
    // sheet (surface) on the table: on a white table they had no value step and read as smudges, so they went.
    const table = ctx.el("table_edge", { x: 0, y: 900, w: 1920, h: 180, kind: "scenery", parent: room.inner });
    kit.polygon(table.inner, [[260, 0], [1660, 0], [1920, 180], [0, 180]], { fill: "surface" });
    kit.line(table.inner, 260, 0, 1660, 0, { stroke: "line", sw: 2 });

    // ---- time: the place first, then the frame of the chart, then the bars as they are spoken
    m.reveal(room, tSay - 0.4, { dy: 0 });
    m.reveal(title, tSay + 0.1, { dy: 8 });
    m.reveal(axis, tSay + 0.2, { dy: 0 });
    bars.slice(0, 5).forEach(({ B, L }, i) => { m.grow(B, tHover + i * 0.08); m.reveal(L, tHover + i * 0.08, { dy: 6 }); });
    m.unmask(ref, tHover + 0.5, { dur: 0.6 });   // a dashed line is WIPED in: m.draw would replace its dash with the draw dash
    m.reveal(refLab, tHover + 0.9, { dy: 6 });
    m.reveal(bars[5].L, tDrop - 0.1, { dy: 6 });
    m.grow(bars[5].B, tDrop);
    m.reveal(tag, tDrop + 0.7, { dy: 8 });
    Loom.sfx("reveal", tDrop + 0.7);
    // the camera walks up to the bar that changed. The rect is chosen so the scale is 1.8 and the left frame edge
    // falls in the empty gap between the Jan and Feb labels (local x 640): no word is cut by the frame (film check),
    // Feb to May stay in frame as the context, and the frame centre sits above the caption band (cy 470).
    Loom.cam.frame(room, { x: 710, y: 300, w: 927, h: 460 }, tTalk, 1.4, { margin: 70, cy: 470 });
  },
});
