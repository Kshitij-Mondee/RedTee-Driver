/* Loom grid (D-173): the lesson's timing grid in the page.
 *
 * compose builds `manifest.grid` (loom/timing.py): exact sections, a tempo fitted to the narration (each section a whole
 * number of bars), every hit (section, beat, speech, join, cue) and every planned sound. The picture reads the same
 * numbers the mix and the checks read:
 *   Loom.grid.hit(id)            seconds of a named hit ("section:s2", "beat:b07", "join:b07", "cue:b07:the signal")
 *   Loom.grid.hits(kind, beat)   the hits of one kind (optionally one beat), in time order
 *   Loom.grid.bars()             every bar line (s)
 *   Loom.grid.bar(t, dir)        the bar line nearest t (dir 0), the next one at or after t (dir 1), or the last at or
 *                                before t (dir -1)
 *   Loom.grid.onBeat(t, sub)     t snapped to the nearest music beat (sub 2: half beats); t itself without a grid
 * In a scene: ctx.hit(id), ctx.onBeat(t, sub), ctx.bar(t, dir). A build composed before the grid has none: every
 * call then returns its input (or null for hit) and says so once.
 */
// @capability timing_grid | timing | ctx.hit, ctx.bar, ctx.onBeat; Loom.grid | The timing grid | land a motion on the lesson's shared clock: a named hit, a bar line or a music beat the mix also uses (D-173)
(function () {
  "use strict";
  const Loom = window.Loom;
  const G = (Loom.grid = { m: null, byId: {} });
  let warned = false;
  const none = (what) => {
    if (!warned) { warned = true; Loom.warn("grid_missing", `no timing grid in this build (${what}): recompose the lesson`, {}); }
  };
  G.install = function (manifest) {
    G.m = (manifest && manifest.grid) || null;
    G.byId = {};
    ((G.m && G.m.hits) || []).forEach((h) => { G.byId[h.id] = h; });
  };
  G.hit = function (id) {
    if (!G.m) { none("hit " + id); return null; }
    const h = G.byId[String(id)];
    if (!h) { Loom.warn("grid_hit_unknown", `no hit "${id}" in the timing grid`, { id: String(id) }); return null; }
    return h.t;
  };
  G.hits = function (kind, beat) {
    if (!G.m) return [];
    return G.m.hits.filter((h) => (!kind || h.kind === kind) && (!beat || h.beat === beat));
  };
  G.bars = function () { return G.m ? G.m.tempo.bars.slice() : []; };
  G.bar = function (t, dir) {
    const bars = G.m ? G.m.tempo.bars : [];
    if (!bars.length) { none("bar"); return t; }
    if (dir > 0) { for (const b of bars) if (b >= t - 1e-6) return b; return bars[bars.length - 1]; }
    if (dir < 0) { let best = bars[0]; for (const b of bars) if (b <= t + 1e-6) best = b; return best; }
    let best = bars[0];
    for (const b of bars) if (Math.abs(b - t) < Math.abs(best - t)) best = b;
    return best;
  };
  function segAt(t) {
    const segs = (G.m && G.m.tempo.segments) || [];
    for (const s of segs) if (t >= s.t0 - 1e-6 && t < s.t1) return s;
    return segs[segs.length - 1] || null;
  }
  G.onBeat = function (t, sub) {
    const s = G.m ? segAt(t) : null;
    if (!s) { none("onBeat"); return t; }
    const step = (s.t1 - s.t0) / (s.bars * (G.m.tempo.meter || 4) * (sub || 1));
    return s.t0 + Math.round((t - s.t0) / step) * step;
  };
})();
