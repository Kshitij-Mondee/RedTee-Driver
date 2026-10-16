// @lab {"title": "World map: countries fill in (d3 + topojson + world-atlas)", "dur": 5, "libs": ["d3", "topojson"], "times": [0.3, 1.2, 2.2, 3.2, 4.2, 4.9], "params": {"lit": ["Brazil", "India", "Kenya", "Germany", "Japan", "Canada"]}}
// A capability proof for the page kind (D-176): a real equal-earth map, a graticule, and the named countries lit in
// order. Natural Earth via world-atlas (public domain); no network. Drawn on a Canvas 2D: a map is hundreds of
// complex shapes, and a canvas captures about five times faster than the same shapes as SVG.
export async function build(ctx, P) {
  const world = await P.world("countries", "110m");
  const g = P.canvas();
  const proj = d3.geoEqualEarth().fitExtent([[30, 30], [P.w - 30, P.h - 30]], world);
  const path = d3.geoPath(proj, g);
  const grat = d3.geoGraticule10();
  const lit = ctx.params.lit || [];
  const [surface, line, accent] = [ctx.c("surface"), ctx.c("line"), ctx.c("accent")];
  return {
    render(t) {
      g.clearRect(0, 0, P.w, P.h);
      g.globalAlpha = 0.5 * P.seg(t, 0, 0.6);
      g.beginPath(); path(grat); g.strokeStyle = line; g.lineWidth = 1; g.stroke();
      for (const f of world.features) {
        const i = lit.indexOf(f.properties.name);
        const k = i < 0 ? 0 : P.ease.out(P.seg(t, 0.8 + i * 0.6, 1.3 + i * 0.6));
        g.globalAlpha = 0.55 + 0.45 * Math.max(P.seg(t, 0, 0.8), k);
        g.beginPath(); path(f);
        g.fillStyle = k > 0.5 ? accent : surface; g.fill();
        g.strokeStyle = line; g.lineWidth = 0.8; g.stroke();
      }
      g.globalAlpha = 1;
    },
  };
}
