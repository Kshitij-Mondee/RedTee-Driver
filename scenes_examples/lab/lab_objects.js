// @lab {"title": "Objects: twelve things drawn as things (families follow the seed, detail 1 to 3, states)", "styles": ["glow-flat", "flat-cosmos"], "dur": 6.0, "times": [0.6, 3.2, 5.8], "seeds": [{"name": "classic"}, {"name": "body", "shape": "organic", "label": "tag", "bubble": "wobble", "panel": "glass", "icon": "duotone", "mark": "brush", "texture": "grain", "entrance": "unfold"}, {"name": "rules", "shape": "architectural", "label": "stamp", "bubble": "note", "panel": "paper", "icon": "seal", "mark": "stamp", "texture": "paper", "entrance": "typeset"}, {"name": "tech", "shape": "angular", "label": "flag", "bubble": "chat", "panel": "frame", "icon": "tile", "mark": "box", "texture": "halftone", "entrance": "draw"}]}
// A lab scene for the object grammars (D-83; docs/styles/DISTINCTNESS_PLAN.md step 4). Twelve objects in a grid,
// each in the family the seed picks, at detail 3, with a meaning-carrying state on the right half (open, stamped,
// lit, on, beating, time passing). Rendered per seed, the same call draws different objects. Original drawings.
Loom.scene("lab_objects", {
  build(ctx) {
    const O = Loom.obj;
    const kinds = O.KINDS, cols = 6, cw = 1728 / cols;
    const states = { document: { stamped: true }, envelope: { open: true }, calendar: { mark: 11 }, clock: { time: 3.5 }, phone: { ping: true },
      laptop: { screen: "chart" }, folder: { open: true }, package: {}, building: { lit: true }, heart: {}, bulb: { on: true }, lock: { open: true } };
    kinds.forEach((k, i) => {
      const x = 96 + cw * (i % cols) + cw / 2, y = i < cols ? 300 : 680;
      const E = O.draw(ctx, "o_" + k, k, { x, y, size: 210, detail: 3, state: states[k], t: 0.1 + i * 0.12,
        t0: k === "heart" || k === "clock" ? 1.4 : undefined, t1: 6, pingAt: k === "phone" ? 2.4 : undefined });
      void E;
    });
  },
});
