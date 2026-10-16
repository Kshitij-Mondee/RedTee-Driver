// @lab {"title": "Vendor art (D-88): free, licence-checked objects (Microsoft Fluent Emoji Flat, MIT) in a place, as made and mapped to the style", "styles": ["glow-flat", "flat-cosmos"], "dur": 4.0, "times": [3.6]}
// A lab scene for Loom.art. Top: the rebuilt office (D-87) with Fluent objects on the desk and the shelf, as made
// (colors: "keep"). Bottom strip: the same twelve objects as made, then mapped to the style's tokens ("auto"), so a
// person can choose per lesson. Reference board: docs/references/places/office.md.
Loom.scene("lab_vendor_art", {
  build(ctx) {
    const A = Loom.art;
    const P = Loom.place.office(ctx, "office", { side: "right" });
    A.shape(P.layers.mid.g, "fluent:potted-plant", 1560, 880, 150, {});
    A.shape(P.layers.mid.g, "fluent:hot-beverage", 1080, 730, 70, {});
    A.shape(P.layers.far.g, "fluent:books", 730, 290, 90, {});
    const names = ["fluent:spiral-calendar", "fluent:light-bulb", "fluent:envelope", "fluent:file-folder", "fluent:alarm-clock", "fluent:locked", "fluent:desktop-computer", "fluent:clipboard", "fluent:anatomical-heart", "fluent:brain", "fluent:package", "fluent:briefcase"];
    const strip = ctx.el("strip", { x: 0, y: 0, w: 1920, h: 1080, kind: "group" });
    Loom.kit.rect(strip.inner, 60, 820, 1800, 230, { fill: "field2", r: 18, flat: true });
    names.forEach((nm, i) => {
      A.shape(strip.inner, nm, 140 + i * 140, 880, 84, { colors: "keep" });
      A.shape(strip.inner, nm, 140 + i * 140, 990, 84, { colors: "auto" });
    });
  },
});
