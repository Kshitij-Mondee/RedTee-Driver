// @design rack_section_swap_flood: the same cutaway changes state, its parts swap one by one and the warm band floods wide
/* b18, AI servers. "Now swap in AI servers. The rack draws far more power, so far more heat." A cut back to the rack in
 * side section (b14's place and position, a medium shot instead of the close push). The gap is fixed (blanking panel
 * in); the seven servers swap, top to bottom, for taller AI servers with warm accelerator blocks; the power feed at the
 * back thickens; the warm exhaust band swells to several times its width and floods past the rack into the hot aisle.
 * No figures: the width of the warm band is the quantity (guide: data as an object, never a number).
 *
 * Three treatments considered:
 *   A. a bar chart of power per rack (a number the sheet does not carry, and a chart where a picture is the point);
 *   B. a side-by-side of one old rack and one AI rack (two racks to read, and the "same rack, changed" is lost);
 *   C. (chosen) the same rack changes in place: servers swap on "swap in AI servers", the feed thickens on "far more
 *      power", the band floods on "far more heat". Motion is the content: more power in, more heat out, seen as width.
 * The rack and its states come from the kit (never redrawn); the kit's own band stops at the rack's back, so the flood
 * into the hot aisle and the tag are this beat's own, and the blanking panel is faded by a wrapper because the kit
 * only drops it inside setState (which would also start the band before the words).
 */
Loom.scene("b18", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;

    const tSwap = ctx.cue("Now swap in AI servers");
    const tPower = ctx.cue("The rack draws far more power");
    const tHeat = ctx.cue("so far more heat");

    // ---- the place: the same world as b14 (washes, floor, the rack at the same spot), one element
    const PX = 659, PY = 60;
    const E = ctx.el("rack_section", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    kit.rect(E.inner, 0, 0, PX + 350, 1080, { fill: "accent4", opacity: 0.08, r: 0, shadow: false });
    kit.rect(E.inner, PX + 350, 0, 1920 - (PX + 350), 1080, { fill: "accent2", opacity: 0.05, r: 0, shadow: false });
    kit.rect(E.inner, 0, PY + 826, 1920, 1080 - (PY + 826), { fill: "surface2", r: 0, shadow: false });
    kit.line(E.inner, 0, PY + 826, 1920, PY + 826, { stroke: "line", sw: 3, opacity: 0.6 });
    kit.rect(E.inner, PX + 6, PY + 826, 336, 16, { fill: "surface", r: 4, shadow: false });
    for (let i = 0; i < 9; i++) kit.rect(E.inner, PX + 28 + i * 34, PY + 828, 8, 12, { fill: "surface2", r: 2, shadow: false });

    // @form heat_flood: a warm field grows out of the back of an object and spreads across the space behind it
    // ---- the flood: the warm band continues past the rack's back into the hot aisle (behind the rack, so its streams stay on top)
    const FX0 = PX + 680, FW = 1920 - FX0, FH = 744;                       // from where the kit's widest band ends to the frame edge
    const flood = ctx.el("heat_band", { x: FX0, y: PY + 58, w: FW, h: FH, kind: "scenery", parent: E.inner });
    const gid = Loom.uid("b18flood");
    const lg = Loom.svg("linearGradient", { id: gid, x1: "0", y1: "0", x2: "1", y2: "0" }, Loom.svg("defs", {}, flood.inner));
    Loom.svg("stop", { offset: "0", "stop-color": ctx.c("accent2"), "stop-opacity": 0.26 }, lg);
    Loom.svg("stop", { offset: "1", "stop-color": ctx.c("accent2"), "stop-opacity": 0.06 }, lg);
    Loom.svg("rect", { x: 0, y: 0, width: FW, height: FH, fill: "url(#" + gid + ")" }, flood.inner);

    // ---- the rack: the kit's side section, starting blanked (the gap fixed in b15), swapped by hand on the words
    const rack = Loom.lesson.rack(ctx, E.inner, { x: PX, y: PY, view: "side", state: "blanked" });
    m.reveal(E, ctx.start + 0.05, { dy: 0 });
    rack.flow(ctx.start + 0.1, ctx.end - 0.2);

    // the panel and its dashed outline leave as the server that replaces that row swaps in (own wrapper, own tween)
    const wrap = Loom.svg("g", {}, rack.root);
    wrap.appendChild(rack.nodes.outline);
    wrap.appendChild(rack.nodes.panel);
    Loom.tween(wrap, { opacity: 1 }, { opacity: 0, duration: Loom.style.dur("exit"), immediateRender: false }, tSwap + 0.45, { kind: "exit", name: "blanking_panel", content: true });

    // ---- "Now swap in AI servers": top to bottom, 0.22 s apart, accelerators warm
    for (let k = 0; k < rack.K; k++) rack.swapAI(k, tSwap + 0.22 * k, { dur: 0.4 });

    // ---- "The rack draws far more power": the feed at the back thickens
    rack.powerFeed(1, tPower, 0.6);

    // ---- "so far more heat": the kit's band swells and the flood follows it out into the hot aisle
    rack.heatBand(1, tHeat, 0.9);
    m.grow(flood, tHeat + 0.2, { axis: "x", origin: "0% 50%", dur: 1.0 });

    // ---- the tag, planted in the flood on "far more heat" (the seed's flag; its pole stands on the point)
    const TXT = "Far more heat per rack";
    const G = T.labelGeom(0, 0, TXT, { as: "flag", role: "label", maxW: 560 });
    const toPt = [1380, 590];
    T.label(ctx, "tag_heat", { x: toPt[0] + G.tw / 2, y: toPt[1] - 62 - G.h / 2, text: TXT, to: toPt, tone: "ink", as: "flag", role: "label", maxW: 560, t: tHeat + 0.45, parent: E.inner });
  },
});
