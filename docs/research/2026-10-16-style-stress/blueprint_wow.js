// @lab {"title": "blueprint WOW: a hero detail on the cyanotype paper (a front extruded into an object, the processor as the one real thing with its shadow, a belt drive and a gear train turning, traced icons)", "styles": ["blueprint"], "fx": {"background": "cyanotype", "vignette": 0.32}, "dur": 31.5, "times": [8.9, 23.4, 30.9], "words": [{"w": "This", "s": 0.4, "e": 0.74}, {"w": "is", "s": 0.8, "e": 1.05}, {"w": "the", "s": 1.11, "e": 1.41}, {"w": "cooling", "s": 1.47, "e": 1.94}, {"w": "drive", "s": 2.0, "e": 2.38}, {"w": "of", "s": 2.44, "e": 2.69}, {"w": "one", "s": 2.75, "e": 3.05}, {"w": "server.", "s": 3.11, "e": 3.54}, {"w": "Its", "s": 5.0, "e": 5.29}, {"w": "chassis", "s": 5.36, "e": 5.83}, {"w": "starts", "s": 5.89, "e": 6.32}, {"w": "as", "s": 6.38, "e": 6.63}, {"w": "a", "s": 6.69, "e": 6.9}, {"w": "flat", "s": 6.96, "e": 7.29}, {"w": "front,", "s": 7.36, "e": 7.74}, {"w": "then", "s": 7.8, "e": 8.14}, {"w": "gains", "s": 8.2, "e": 8.59}, {"w": "its", "s": 8.65, "e": 8.94}, {"w": "depth.", "s": 9.0, "e": 9.39}, {"w": "At", "s": 11.05, "e": 11.3}, {"w": "its", "s": 11.36, "e": 11.65}, {"w": "heart", "s": 11.71, "e": 12.1}, {"w": "sits", "s": 12.16, "e": 12.5}, {"w": "the", "s": 12.56, "e": 12.85}, {"w": "processor,", "s": 12.91, "e": 13.48}, {"w": "the", "s": 13.54, "e": 13.83}, {"w": "hot", "s": 13.89, "e": 14.19}, {"w": "spot.", "s": 14.25, "e": 14.59}, {"w": "A", "s": 16.05, "e": 16.25}, {"w": "motor", "s": 16.31, "e": 16.7}, {"w": "turns", "s": 16.76, "e": 17.14}, {"w": "the", "s": 17.2, "e": 17.5}, {"w": "fan", "s": 17.56, "e": 17.85}, {"w": "through", "s": 17.91, "e": 18.39}, {"w": "a", "s": 18.45, "e": 18.65}, {"w": "belt,", "s": 18.71, "e": 19.05}, {"w": "and", "s": 19.41, "e": 19.71}, {"w": "a", "s": 19.77, "e": 19.97}, {"w": "gear", "s": 20.03, "e": 20.37}, {"w": "train", "s": 20.43, "e": 20.82}, {"w": "steps", "s": 20.88, "e": 21.26}, {"w": "the", "s": 21.32, "e": 21.62}, {"w": "speed", "s": 21.68, "e": 22.06}, {"w": "down.", "s": 22.12, "e": 22.46}, {"w": "Every", "s": 24.32, "e": 24.71}, {"w": "part", "s": 24.77, "e": 25.11}, {"w": "is", "s": 25.17, "e": 25.42}, {"w": "numbered", "s": 25.48, "e": 26.0}, {"w": "and", "s": 26.06, "e": 26.35}, {"w": "measured.", "s": 26.41, "e": 26.93}, {"w": "Heat", "s": 28.39, "e": 28.73}, {"w": "leaves", "s": 28.79, "e": 29.22}, {"w": "at", "s": 29.28, "e": 29.53}, {"w": "the", "s": 29.59, "e": 29.89}, {"w": "rear.", "s": 29.95, "e": 30.29}]}
/* The blueprint WOW pass (2026-10-16): one hero detail moment on the cyanotype paper, built only from the engine.
 * Kshitij: "The cool factor and the wow factor of both hologram and blueprint style feels like it's gone"
 * (docs/research/2026-10-16-wow-hologram-blueprint.md). This sheet shows the new ingredients together:
 * - a flat front drafted, then extruded into an object (D.extrude: lit and shaded faces, hidden back edges);
 * - the one real thing (D.hero): the processor with a volume, a glow and a shadow falling across the board's traces;
 * - two mechanisms that move (D.mechanism): a motor driving the fan on a belt, and a gear train with a chain;
 * - Lucide icons traced in the drafting line (D.icon), balloons, a dimension, notes;
 * - paper that shows through every part while what is behind stays hidden, the bloom on the lines, the glowing nib.
 * Narration timings are estimates. Compare within the style only (D-122). */
Loom.scene("blueprint_wow", {
  build(ctx) {
    const W = ctx.engine, D = W.sheet(ctx);
    const cue = (p, lead) => ctx.cue(p) - (lead == null ? 0.3 : lead);

    // ---- the sheet: one element holds the whole drawing, so the camera can move over it (D.camera)
    const sheet = ctx.el("sheet", { x: 0, y: 0, w: 1920, h: 1080, kind: "card" });
    const el = (name, o) => ctx.el(name, Object.assign({ parent: sheet.inner, exit: "recede" }, o));
    const C = D.camera(sheet);
    C.close({ x: 130, y: 250, w: 760, h: 430 }, 0, { cut: true });          // open close on the chassis
    C.establish(cue("At its heart", 0.8), 1.5);                             // back to the whole sheet for the board
    C.close({ x: 1060, y: 210, w: 760, h: 330 }, cue("gear train", 0.6), { dur: 1.2 });   // in on the gear train
    C.establish(cue("Every part", 0.9), 1.4);                               // and back for the record
    const border = el("sheet_border", { x: 40, y: 28, w: 1840, h: 904, kind: "mark" });
    D.border(border, { at: 0.1, dur: 1.0, cols: 8, rows: 4 });
    const fig = el("fig", { x: 120, y: 74, w: 640, h: 110, kind: "text" });
    D.fig(fig, "Fig. 4", { sub: "Cooling drive, detail", at: 0.4, quick: true, dur: 1.2 });

    // elements bottom to top (what is drawn later in this list sits on top and hides what is under it)
    const board = el("board", { x: 140, y: 640, w: 700, h: 270, kind: "card" });
    const chassis = el("chassis", { x: 140, y: 200, w: 720, h: 440, kind: "card" });
    const chip = el("chip", { x: 140, y: 640, w: 700, h: 270, kind: "card" });
    const beltM = el("belt_drive", { x: 980, y: 520, w: 760, h: 380, kind: "card" });
    const gears = el("gear_train", { x: 980, y: 150, w: 820, h: 380, kind: "card" });
    const notes = el("labels", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    const tags = el("balloons", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });

    // ---- 1. the chassis: its front drafted flat, then it gains its depth (the projection is the camera)
    const face = [[40, 200], [500, 200], [500, 400], [40, 400]];
    let t = D.extrude(chassis, face, { at: cue("chassis"), by: cue("flat front", -0.2), turnAt: cue("gains its depth"), dur: 1.6, ratio: 0.38 });
    // its front: drive bays, vent slots, the power button, traced
    const bays = []; for (let i = 0; i < 4; i++) bays.push(...W.rect(64 + i * 62, 228, 48, 144, { weight: "detail" }));
    const vents = []; for (let i = 0; i < 7; i++) vents.push(...W.line(334, 236 + i * 20, 470, 236 + i * 20, { weight: "thin" }));
    D.draw(chassis, bays.concat(vents), { at: cue("flat front") + 0.1, dur: 1.2, pen: "ink", parallel: true });
    D.icon(chassis, "power", 432, 372, 22, { at: cue("flat front") + 0.4, dur: 0.4, parallel: true, weight: "thin" });
    D.letter(notes, "chassis, 2U", { role: "label", x: 180, y: 620, w: 300, h: 40, at: cue("gains its depth") + 0.4, quick: true });

    // ---- 2. the board, then the one real thing: the processor, with its volume and the shadow on the traces
    const traces = [];
    for (let i = 0; i < 6; i++) traces.push(...W.path([[60, 70 + i * 26], [190, 70 + i * 26], [214, 94 + i * 26], [470, 94 + i * 26]], { weight: "thin" }));
    for (let i = 0; i < 5; i++) traces.push(...W.line(500 + i * 26, 40, 500 + i * 26, 240, { weight: "thin" }));
    D.part(board, { outline: W.rect(30, 20, 640, 236), detail: traces, paper: "field" }, { at: cue("At its heart", 0.9), by: cue("processor", 0.1) });
    const tHero = D.hero(chip, W.roundRect(240, 60, 150, 150, 10), { at: cue("processor", 0.1), by: cue("hot spot", 0.1), tone: "accent", shadow: [20, 26] });
    const pins = []; for (let i = 0; i < 6; i++) pins.push(...W.line(256 + i * 24, 60, 256 + i * 24, 46, { weight: "thin" }), ...W.line(256 + i * 24, 210, 256 + i * 24, 224, { weight: "thin" }));
    D.draw(chip, pins, { at: tHero - 0.2, dur: 0.5, parallel: true });
    D.icon(chip, "cpu", 285, 105, 60, { at: tHero, dur: 0.6, parallel: true });
    D.icon(notes, "thermometer", 846, 730, 44, { at: cue("hot spot", 0.2), dur: 0.5, parallel: true, pen: "accent2" });
    D.letter(notes, "hot spot", { role: "label", x: 892, y: 736, w: 160, h: 40, at: cue("hot spot", 0.1), pen: "accent2", quick: true });

    // ---- 3. the motor drives the fan on a belt (they turn the same way, the fan slower)
    const mB = D.mechanism(beltM, [{ pulley: [110, 220, 40] }, { pulley: [470, 220, 86], link: "belt", icon: "fan" }], { at: cue("A motor", 0.4), by: cue("belt", -0.2), rps: 0.9 });
    D.icon(notes, "zap", 1046, 650, 34, { at: cue("motor", 0.1), dur: 0.4, parallel: true, pen: "accent2" });
    D.letter(notes, "motor", { role: "label", x: 1040, y: 840, w: 140, h: 40, at: mB.t, quick: true });
    D.letter(notes, "fan", { role: "label", x: 1420, y: 840, w: 120, h: 40, at: mB.t + 0.1, quick: true });

    // ---- 4. a gear train steps the speed down, and a chain carries it on
    const mG = D.mechanism(gears, [{ gear: [230, 200, 104, 22] }, { gear: [384.6, 200, 62, 13], link: "mesh" }, { gear: [660, 200, 46, 10], link: "chain" }], { at: cue("gear train", 0.5), by: cue("speed down", -0.3), rps: 0.12 });
    D.letter(notes, "reduction gears", { role: "label", x: 1110, y: 478, w: 300, h: 40, at: mG.t, quick: true });

    // ---- 5. every part numbered and measured
    const tn = cue("numbered", 0.6);
    D.balloon(tags, 1, 930, 250, { to: [760, 330], at: tn, quick: true });
    D.balloon(tags, 2, 470, 600, { to: [520, 700], at: tn + 0.25, quick: true });
    D.balloon(tags, 3, 1230, 868, { to: [1290, 805], at: tn + 0.5, quick: true });
    D.balloon(tags, 4, 1640, 470, { to: [1640, 400], at: tn + 0.75, quick: true });
    D.dim(notes, 1090, 740, 1450, 740, { side: "left", off: 150, value: 360, unit: "mm", at: cue("measured", 0.5), by: cue("measured", -0.4) });

    // ---- 6. heat leaves at the rear: the flow out of the chassis
    D.draw(notes, [].concat(...[350, 410, 470].map((y) => W.arrow(800, y, 930, y - 40, { weight: "detail", head: 13 }))), { at: cue("Heat leaves", 0.2), by: cue("rear", -0.3), pen: "accent" });
    void t;
  },
});
