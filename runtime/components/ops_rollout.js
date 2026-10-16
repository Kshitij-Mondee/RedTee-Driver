// T-020 ops_rollout: a deployment rollout, rolling, blue-green or canary (hand-off sheet, Family B). Built on
// _app_kit.js and _dev_kit.js. Traffic is a stream of dots from a router to the instances, a pure function of time:
// each dot's trip is decided when it leaves the router from the split at that moment (a seeded draw), so a change of
// split re-routes the stream over 0.6 s. The split's figure, the versions' names and instance health (an outline and a
// cross, never colour alone) carry the state. A still shows one step, the dots frozen mid-flight.
Loom.component("ops_rollout", {
  version: 1,
  idea: "A deployment rollout: traffic as a stream of dots from a router to instances of the old and the new version, the split as a percentage, instances that switch over step by step (rolling), all at once (blue-green) or as a growing share (canary), an instance that turns unhealthy, and a rollback.",
  outline: ["router at the left", "instance groups at the right: the old version and the new (rolling: one row whose instances change version)", "traffic dots flowing on curves from the router to the instances", "the split as a percentage, the new version named under it", "unhealthy instances: an outline and a cross"],
  family: "ops",
  tags: ["deployment", "rollout", "canary", "blue green", "rolling update", "release", "rollback", "traffic split", "progressive delivery", "devops"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-020)",
  // an explainer diagram: the explaining styles and the drawing styles; not a product screen (D-193)
  styles: ["corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint", "chalk-lab"],
  params: {
    strategy: { type: "enum", choices: ["rolling", "bluegreen", "canary"], default: "canary" },
    versions: { type: "list", content: true },     // [old, new] as the lesson names them ("v1.4", "v1.5")
    steps: { type: "list", content: true },        // the new version's share at each step, in percent (canary 5, 25, 100; blue-green 100)
    router: { type: "str" },                       // the router's name ("load balancer")
    instances: { type: "int", default: 6 },
    show: { type: "int", default: -1 },            // the step a still shows (-1: the last)
    every: { type: "number", default: 1.6 },       // seconds between steps when it plays
    w: { type: "number", default: 1500 },
    at: { type: "number", default: -1 },
    script: { type: "list", default: [] },         // [{do: "step", i, at} | {do: "health", i, state: "healthy"|"unhealthy", at} | {do: "rollback", at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["router", "groups[]", "instances[]", "split", "dots", "step(i, t)", "rollback(t)", "health(i, state, t)"],
  example: 'ctx.use("ops_rollout", { strategy: "canary", versions: ["v3.1", "v3.2"], steps: [10, 50, 100], router: "gateway", at: ctx.cue("ten percent first") }, { x: 210, y: 300, name: "rollout" })',
  size: (p) => ({ w: p.w, h: Loom.devKit.rolloutLayout(p).h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const L = DK.rolloutLayout(p), Z = L.Z;
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p), pen = DK.pen(ctx, eng);
    const surface = S.c("surface"), ink = S.c("ink");
    const oldC = DK.legible("accent", surface, ink, 3), newC = DK.legible("pos", surface, ink, 3), badC = DK.legible("neg", surface, ink, 3);
    const vers = (p.versions || []).map(String), steps = (p.steps || []).map((v) => Math.max(0, Math.min(100, +v)));
    const parts = { groups: [], instances: [] };
    const rolling = p.strategy === "rolling";
    const nI = Math.max(1, p.instances | 0);
    // ---- the router
    const rg = svg("g", {}, g), R = L.router;
    svg("rect", { x: R.x, y: R.y, width: R.w, height: R.h, rx: 14, fill: surface }, rg);
    K.rect(rg, R.x, R.y, R.w, R.h, { fill: "surface", r: 14, stroke: "line", sw: 2 });
    // the router's name under its icon, on two lines when one would cut it (blueprint's pen had cut "traffic router")
    const rnH = L.routerLines * L.lhS;
    AK.icon(rg, "split", R.x + R.w / 2, R.y + (p.router ? (R.h - rnH - 10) / 2 : R.h / 2), 40, "ink");
    if (p.router) DK.word(ctx, rg, p.router, { x: R.x + 8, y: R.y + R.h - rnH - 12, w: R.w - 16, h: rnH, size: Z.small, weight: 600, maxLines: L.routerLines, align: "center", at: animated ? p.at : -1, eng, pen, name: "router", kind: "label" });
    parts.router = rg;
    // ---- groups and instances
    const inst = [];   // {x, y, w, h, group: 0 old | 1 new, ver: 0 | 1, healthy, g, layers}
    const mkInst = (x, y, gi, ver) => {
      const ig = svg("g", {}, g), layers = {};
      for (const [k, c] of [["v0", oldC], ["v1", newC], ["idle", S.mix(S.c("line"), surface, 0.45)]]) {
        const lg = svg("g", { opacity: 0 }, ig);
        svg("rect", { x, y, width: L.iw, height: L.ih, rx: 10, fill: k === "idle" ? surface : S.mix(surface, c, 0.16), stroke: c, "stroke-width": 2.5, "stroke-dasharray": k === "idle" ? "6 5" : null }, lg);
        AK.icon(lg, "server", x + L.iw / 2, y + (rolling ? L.ih / 2 - 12 : L.ih / 2), 30, k === "idle" ? "muted" : k === "v0" ? "accent" : "pos");
        if (rolling && k !== "idle") DK.word(ctx, lg, vers[k === "v1" ? 1 : 0] || "", { x: x + 6, y: y + L.ih - L.lhS - 8, w: L.iw - 12, h: L.lhS, size: Z.small, weight: 600, align: "center", at: -1, eng, pen, parentG: lg, name: `inst_${inst.length}_${k}`, kind: "label" });
        layers[k] = lg;
      }
      const bad = svg("g", { opacity: 0 }, ig);
      svg("rect", { x: x - 3, y: y - 3, width: L.iw + 6, height: L.ih + 6, rx: 12, fill: "none", stroke: badC, "stroke-width": 3.5 }, bad);
      svg("path", { d: `M${f1(x + L.iw - 22)} ${f1(y + 8)} l14 14 m0 -14 l-14 14`, stroke: badC, "stroke-width": 3.5, fill: "none", "stroke-linecap": "round" }, bad);
      const I = { x, y, w: L.iw, h: L.ih, group: gi, ver, healthy: true, g: ig, layers, bad, shown: null };
      inst.push(I);
      return I;
    };
    if (rolling) {
      L.rows[0].forEach((q) => mkInst(q.x, q.y, 0, 0));
      if (vers.length) parts.groups.push({ label: null });
    } else {
      L.rows.forEach((row, gi) => {
        const gg = svg("g", {}, g), q0 = row[0];
        const gw = DK.word(ctx, gg, vers[gi] || "", { x: q0.x, y: gi ? q0.y + L.ih + 6 : q0.y - L.lh - 6, w: L.rowW, h: L.lh, size: Z.fs, weight: 700, fill: gi ? newC : oldC, color: "ink", at: animated ? p.at : -1, eng, pen, name: `group_${gi}`, kind: "label" });
        row.forEach((q) => mkInst(q.x, q.y, gi, gi));
        parts.groups.push({ g: gg, label: gw });
      });
    }
    parts.instances = inst;

    // ---- the split over time: a schedule of shares of the new version, each change eased over 0.6 s
    const sched = [];   // {t, to}
    let share0 = 0;
    const shareAt = (t) => { let s = share0; for (const e of sched) { if (t <= e.t) break; const k = Math.min(1, (t - e.t) / 0.6); s = s + (e.to - s) * k; } return s; };
    // which instances take traffic at a share: canary and rolling use as many new ones as the share asks
    const stateAt = (t) => {
      const s = shareAt(t);
      return inst.map((I, i) => {
        if (rolling) { const nNew = Math.round(s * nI + 1e-6); return { v: i < nNew ? 1 : 0, on: true }; }
        if (I.group === 0) return { v: 0, on: s < 0.999 };
        if (p.strategy === "bluegreen") return { v: 1, on: s > 0.001 };
        const k = inst.filter((J) => J.group === 1).indexOf(I), nNew = Math.max(s > 0.001 ? 1 : 0, Math.ceil(s * nI - 1e-6));
        return { v: 1, on: k < nNew };
      });
    };
    // the instance's look follows the schedule: one drive over the play span sets which layer shows
    const health = [];   // {t, i, ok}
    const okAt = (i, t) => { let ok = true; for (const h of health) if (h.i === i && h.t <= t) ok = h.ok; return ok; };
    const paint = (t) => {
      const st = stateAt(t);
      inst.forEach((I, i) => {
        const want = !st[i].on ? "idle" : st[i].v ? "v1" : "v0";
        for (const k in I.layers) I.layers[k].setAttribute("opacity", k === want ? 1 : 0);
        I.bad.setAttribute("opacity", okAt(i, t) ? 0 : 1);
      });
    };
    // ---- the split figure, by the router's path to the new version
    const figG = svg("g", {}, g);
    const fig = { w: null };
    const figO = { x: L.fig.x, y: L.fig.y, w: L.fig.w, h: L.lhB, size: Z.big, weight: 700, fill: newC, color: "ink", eng, pen, name: "split", kind: "label" };
    const pct = (s) => `${Math.round(s * 100)}%`;
    // under the figure, the version it is the share of, in the same tone (a bare "0%" did not say of what)
    if (vers[1]) DK.word(ctx, figG, vers[1], { x: L.fig.x, y: L.fig.y + L.lhB, w: Math.max(L.fig.w, L.rows[0][0].x - 30), h: L.lhS, size: Z.small, weight: 600, fill: newC, color: "ink", at: animated ? p.at + 0.3 : -1, eng, pen, name: "split_of", kind: "label" });
    // ---- the dots: N on a cycle of PER seconds, each trip decided when it leaves the router
    const N = 22, PER = 1.7;
    const dotsG = svg("g", {}, g);
    const dots = Array.from({ length: N }, () => svg("circle", { r: 7, cx: 0, cy: 0, fill: oldC, opacity: 0 }, dotsG));
    const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
    // a dot's path: out of the router into the corridor beside the rows, along it, then into its instance (never across
    // another instance)
    const route = (I) => {
      const x0 = R.x + R.w + 6, y0 = R.y + R.h / 2, cy = L.corridor, xr = L.rows[0][0].x - 30, ix = I.x + I.w / 2;
      const iy = cy < I.y ? I.y - 4 : I.y + I.h + 4;
      const segs = [[x0, y0, xr, cy], [xr, cy, ix, cy], [ix, cy, ix, iy]].map(([a, b, c, d]) => ({ a, b, c, d, len: Math.hypot(c - a, d - b) }));
      return { segs, len: segs.reduce((q, z) => q + z.len, 0) };
    };
    const curve = (I, u) => {
      const Rt = route(I);
      let d = u * Rt.len;
      for (const z of Rt.segs) {
        if (d <= z.len || z === Rt.segs[Rt.segs.length - 1]) {
          const k = z.len ? Math.min(1, d / z.len) : 1;
          // the first leg eases out of the router (a smooth step across, a straight run along)
          const kk = z === Rt.segs[0] ? k : k;
          return { x: z.a + (z.c - z.a) * kk, y: z.b + (z.d - z.b) * (z === Rt.segs[0] ? k * k * (3 - 2 * k) : k) };
        }
        d -= z.len;
      }
      return { x: I.x, y: I.y };
    };
    const flow = (now) => {
      dots.forEach((d, k) => {
        const ph = (now / PER + k / N), cyc = Math.floor(ph), u = ph - cyc, tLeave = (cyc - k / N) * PER;
        const st = stateAt(tLeave), s = shareAt(tLeave);
        const wantNew = rnd(k, cyc) < s;
        let pool = inst.map((I, i) => ({ I, i })).filter(({ i }) => st[i].on && (rolling ? st[i].v === (wantNew ? 1 : 0) : inst[i].group === (wantNew ? 1 : 0)) && okAt(i, tLeave));
        if (!pool.length) pool = inst.map((I, i) => ({ I, i })).filter(({ i }) => st[i].on && okAt(i, tLeave));
        if (!pool.length) { d.setAttribute("opacity", 0); return; }
        const { I, i } = pool[Math.floor(rnd(k + 7, cyc + 3) * pool.length)];
        const q = curve(I, u);
        d.setAttribute("cx", f1(q.x)); d.setAttribute("cy", f1(q.y));
        d.setAttribute("fill", (rolling ? st[i].v : I.group) ? newC : oldC);
        d.setAttribute("opacity", u < 0.06 ? u / 0.06 : u > 0.94 ? (1 - u) / 0.06 : 1);
      });
    };
    parts.dots = dotsG;

    // ---- state functions
    let cur = 0;
    parts.step = function (i, t) {
      if (steps[i] == null) return t;
      sched.push({ t, to: steps[i] / 100 }); sched.sort((a, b) => a.t - b.t);
      fig.w = DK.swapWord(ctx, figG, fig, pct(steps[i] / 100), figO, t);
      cur = i;
      return t + 0.6;
    };
    parts.rollback = function (t) {
      sched.push({ t, to: 0 }); sched.sort((a, b) => a.t - b.t);
      fig.w = DK.swapWord(ctx, figG, fig, pct(0), figO, t);
      return t + 0.6;
    };
    parts.health = function (i, state, t) {
      // i: the i-th instance of the new version (rolling: of the row)
      const list = rolling ? inst : inst.filter((I) => I.group === 1), I = list[i];
      if (!I) return t;
      health.push({ t, i: inst.indexOf(I), ok: state !== "unhealthy" && state !== "failed" });
      health.sort((a, b) => a.t - b.t);
      return t + 0.3;
    };
    parts.split = figG;

    // ---- still or playing
    if (!animated) {
      const k = p.show >= 0 && p.show < steps.length ? p.show : steps.length - 1;
      share0 = k >= 0 ? steps[k] / 100 : 0;
      fig.w = DK.word(ctx, figG, pct(share0), Object.assign({}, figO, { at: -1 }));
    } else {
      fig.w = DK.word(ctx, figG, pct(0), Object.assign({}, figO, { at: p.at + 0.3 }));
      steps.forEach((_, i) => parts.step(i, p.at + 0.8 + i * p.every));
      AK.show(rg, p.at, 0.3);
    }
    for (const st of p.script || []) {
      if (!st || st.at == null) continue;
      if (st.do === "step") parts.step(st.i, st.at);
      else if (st.do === "health") parts.health(st.i, st.state, st.at);
      else if (st.do === "rollback") parts.rollback(st.at);
      else Loom.error("component_params", `ops_rollout: script "${st.do}" is not step, health or rollback`);
    }
    // one drive paints the instances and moves the dots, from the start of the beat (or `at`) to its end
    const tS = animated ? p.at : Math.max(0, ctx.start || 0), tE = Math.max(ctx.end || 0, tS + 2, ...sched.map((e) => e.t + 2), ...health.map((e) => e.t + 2));
    if (animated) {
      Loom.drive((e, raw) => { const now = tS + raw * (tE - tS); paint(now); if (raw > 0) flow(now - tS); else dots.forEach((d) => d.setAttribute("opacity", 0)); }, tS, tE - tS, "linear", DK.meta("travel", "rollout.traffic"));
      for (const I of inst) AK.show(I.g, p.at + 0.2, 0.3);
    } else {
      // a still: the instances at the shown step, the dots frozen mid-flight
      paint(0); flow(PER * 0.37);
      if (health.length) { const tH = Math.max(...health.map((h) => h.t)) + 0.01; paint(tH); }
    }
    return parts;
  },
});

// the rollout's geometry, shared by size() and build()
Loom.devKit.rolloutLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, Z = DK.ui().Z;
  const lh = AK.lineH(Z.fs, "caption", 700), lhS = AK.lineH(Z.small, "caption", 600), lhB = AK.lineH(Z.big, "caption", 700);
  const n = Math.max(1, p.instances | 0), rolling = p.strategy === "rolling";
  let engK = 1;
  try { const e = p.engine !== "off" && Loom.engines && Loom.engines.current && Loom.engines.current(); if (e && e.id === "whiteboard") engK = 1.6; else if (e && e.id === "blueprint") engK = 1.35; } catch (e) { engK = 1; }
  const rw = 170, rh = 150;
  const routerLines = p.router && AK.measure(String(p.router), "caption", Z.small, 600) * engK > rw - 24 ? 2 : 1;
  const x0 = rw + 240, rowW = p.w - x0 - 10, gap = 16;
  const iw = Math.max(70, Math.min(150, (rowW - (n - 1) * gap) / n)), ih = rolling ? 110 : 88;
  // two rows with a corridor between them for the traffic (rolling: one row, the corridor under it)
  const rowsN = rolling ? 1 : 2, rowGap = 70;
  const top = (rolling ? 10 : lh + 12);
  const rows = Array.from({ length: rowsN }, (_, r) => Array.from({ length: n }, (_, i) => ({ x: x0 + i * (iw + gap), y: top + r * (ih + rowGap) })));
  const corridor = rolling ? top + ih + 34 : top + ih + rowGap / 2;
  const bodyH = rolling ? corridor + 24 : top + 2 * ih + rowGap + lh + 12;
  const router = { x: 0, y: Math.max(0, corridor - rh / 2), w: rw, h: rh };
  const fig = { x: 0, y: router.y + rh + 12, w: rw + 60 };
  const h = Math.max(bodyH, fig.y + lhB + (p.versions && p.versions[1] != null ? lhS : 0)) + 10;
  return { Z, lh, lhS, lhB, iw, ih, rows, rowW, router, fig, corridor, h, routerLines };
};
