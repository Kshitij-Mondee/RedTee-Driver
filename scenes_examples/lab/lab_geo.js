// @lab {"title": "Real geography (D-90, CINEMA_PLAN B4): Natural Earth 1:110m (public domain), a map that floods country by country and a globe that turns with an arc", "styles": ["glow-flat", "editorial-paper"], "dur": 6.0, "times": [1.0, 3.0, 5.6]}
// Loom.geo.map: equirectangular, graticule, countries flooding in order. Loom.geo.globe: orthographic, far side
// culled, spinning, with a great-circle arc travelling between two real cities.
Loom.scene("lab_geo", {
  build(ctx) {
    const G = Loom.geo;
    G.map(ctx, "map", { x: 60, y: 160, w: 1000, bounds: [-180, -60, 180, 84], graticule: 30,
      flood: [{ c: "IDN", color: "neg", t: 0.6 }, { c: "AUS", color: "accent4", t: 1.4 }, { c: "India", color: "accent", t: 2.2 }, { c: "China", color: "accent", t: 2.8 }] });
    G.globe(ctx, "globe", { cx: 1480, cy: 520, r: 330, lon0: 60, lat0: 15, spin: 6,
      flood: [{ c: "IDN", color: "neg", t: 0.8 }], arcs: [{ from: G.city("London"), to: G.city("Singapore"), t: 1.6, dur: 2.4, color: "accent4" }] });
  },
});
