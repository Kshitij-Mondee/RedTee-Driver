// @lab {"title": "Set decorations: night window lights, vessel and cells, rack LEDs and cables, wall chart, safety line, object default tones", "styles": ["corporate-clean", "story-cartoon", "glow-flat", "cinematic-noir", "whiteboard"], "dur": 24.0, "times": [2.0, 6.0, 10.0, 14.0, 18.0, 22.0]}
// A lab scene for the places' set decorations and the objects' default tones (L-276, L-286; D-133): every decoration a
// pack's `materials` now names (window_lights, vessel, cells, leds, cables, chart, safety_line) and every Loom.obj kind
// drawn with no tone, four seconds each, so one strip per pack shows whether a set spends an accent the pack's guide
// keeps for something else. Original drawings.
Loom.scene("lab_set_decor", {
  build(ctx) {
    const PL = Loom.place;
    const show = (E, a, b) => { Loom.set(E, { opacity: 0 }, 0); Loom.set(E, { opacity: 1 }, a); if (b < 24) Loom.set(E, { opacity: 0 }, b); };
    show(PL.office(ctx, "office", { look: "flat", night: true }).E.outer, 0, 4);
    show(PL.inside(ctx, "inside", { t0: 4, t1: 8 }).E.outer, 4, 8);
    show(PL.server(ctx, "server", { t0: 8, t1: 12 }).E.outer, 8, 12);
    show(PL.meeting(ctx, "meeting", { night: true }).E.outer, 12, 16);
    show(PL.warehouse(ctx, "warehouse", {}).E.outer, 16, 20);
    const kinds = ["document", "envelope", "calendar", "clock", "phone", "laptop", "folder", "package", "building", "heart", "bulb", "lock"];
    kinds.forEach((k, i) => Loom.obj.draw(ctx, "ob_" + k, k, { x: 200 + (i % 6) * 300, y: 300 + Math.floor(i / 6) * 440, size: 220, t: 20.1 }));
  },
});
