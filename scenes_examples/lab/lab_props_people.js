// @lab {"title": "Props and people: the office with its user, the laptop's viewpoint (viewer, away, side), wall items on the wall, the pack's extras", "styles": ["corporate-clean", "story-cartoon"], "dur": 9.0, "times": [1.0, 3.0, 5.0, 7.0, 8.6]}
// A lab scene for viewpoint, scale and figure style (D-100). Step 7's office had a laptop as big as the desk facing
// the viewer, clocks floating on the wall, and grey beans as colleagues in a corporate register (frame audit kinds
// B and C). Here: the place's own desk and screen at real scale beside a person; three laptops showing the three
// viewpoints at a size the scale table gives for a person of the drawn height; the crowd from the pack's extras.
// Original content.
Loom.scene("lab_props_people", {
  build(ctx) {
    const PL = Loom.place, O = Loom.obj, M = Loom.motion;
    const off = PL.office(ctx, "office", { side: "right", facing: "viewer" });
    M.reveal(off.E, 0.1, { dy: 0 });
    // a person standing at the hero desk, at the scale the desk implies (a 0.75 m desk top is 250 px here)
    const pxPerM = 250 / 0.75, personPx = 1.7 * pxPerM;
    const jo = ctx.character("jo", "ava", { x: off.anchors.stand[0], y: off.floorY, scale: personPx / 900, skin: 1, top: "accent" });
    M.reveal(jo.E, 0.5);
    // the three viewpoints, shown large to judge the drawing (a close-up, so hero: true keeps the scale check quiet);
    // in the room the hero desk's own laptop is at the scale table's size for Jo
    const lap = 2.4 * O.px("laptop", personPx);
    [["viewer", 520], ["away", 960], ["left", 1400]].forEach(([facing, x], i) => {
      const E = ctx.el("lap_" + facing, { x: x - 170, y: 690, w: 340, h: 300, kind: "object" });
      Loom.kit.rect(E.inner, 20, 210, 300, 70, { fill: "surface", r: 10, crisp: true });
      O.shape(E.inner, "laptop", 170, 210 - lap * 0.36, lap / 0.9, { key: "lap" + i, detail: 3, hero: true, state: { facing, screen: "text" }, shadow: false });
      Loom.kit.text(E.inner, facing, { role: "label", x: 20, y: 222, w: 300, h: 46, align: "center", valign: "middle" });
      M.reveal(E, 2.6 + i * 0.5);
      M.exit(E, 6.2, "recede");
    });
    // background people, as the pack says an extra is drawn
    ctx.crowd("crowd", { y: 712, x: 1100, w: 360, count: 3, rows: 1, scale: 0.36, parent: off.layers.far.g }).forEach((c, i) => M.reveal(c.E, 6.8 + i * 0.15));
  },
});
