// T-019 ops_cluster_map: a container cluster (hand-off sheet, Family B). Built on _app_kit.js and _dev_kit.js.
// Nodes (machines) as panels with their name and optional CPU and memory bars; pods as small tiles inside, named by
// their service, their state shown by tone AND outline (running solid, pending dashed, failed with a cross,
// terminating faded), never by hue alone; an optional control-plane panel pods are scheduled from. A node can fail,
// its pods rescheduled elsewhere, a service scaled. In the whiteboard and blueprint styles the words are written by the
// engine, inside each pod's own group, so they travel with it.
Loom.component("ops_cluster_map", {
  version: 1,
  idea: "A container cluster: nodes as panels with their name and resource use, pods as small tiles inside them named by service and marked by state (running, pending, failed, terminating), and an optional control plane; pods are scheduled onto nodes, a node fails and its pods are rescheduled, a service scales up or down.",
  outline: ["cluster frame", "control-plane panel at the top (optional)", "node panels in a grid: name, CPU and memory bars", "pod tiles in each node: service name, state by tone and outline"],
  family: "ops",
  tags: ["container platform", "containers", "cluster", "pods", "nodes", "scheduling", "node failure", "scaling", "orchestration", "resilience"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-019)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint", "chalk-lab"],
  params: {
    nodes: { type: "list", content: true },        // [{id, label, cpu? (0 to 1), mem? (0 to 1)}]
    pods: { type: "list", content: true },         // [{id, svc, node, state: running|pending|failed|terminating}]
    controlPlane: { type: "str" },                 // the control plane's name; no panel when omitted
    title: { type: "str" },                        // the cluster's name, on its frame
    w: { type: "number", default: 1600 }, h: { type: "number", default: 800 },
    at: { type: "number", default: -1 },
    steps: { type: "list", default: [] },          // [{do: "schedule", pod: {id, svc, state}, node, at} | {do: "fail", node, at} | {do: "reschedule", map: {podId: nodeId}, at} | {do: "scale", svc, n, at} | {do: "state", pod, state, at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["frame", "control", "nodes{id}", "pods{id}", "schedule(podSpec, nodeId, t)", "fail(nodeId, t)", "reschedule(map, t)", "scale(svc, n, t)", "state(podId, state, t)"],
  example: 'ctx.use("ops_cluster_map", { controlPlane: "control plane", nodes: [{ id: "a", label: "node-a", cpu: 0.4 }, { id: "b", label: "node-b", cpu: 0.7 }], pods: [{ id: "w1", svc: "web", node: "a", state: "running" }, { id: "w2", svc: "web", node: "b", state: "running" }], steps: [{ do: "fail", node: "b", at: ctx.cue("the node dies") }] }, { x: 160, y: 140, name: "cluster" })',
  size: (p) => { const L = Loom.devKit.clusterLayout(p); return { w: p.w, h: L.H }; },
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const { Z } = DK.ui();
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p), pen = DK.pen(ctx, eng);
    const field = S.c("field"), surface = S.c("surface"), ink = S.c("ink");
    const L = DK.clusterLayout(p), engK = L.engK;
    const lh = AK.lineH(Z.fs, "caption", 700), lhS = AK.lineH(Z.small, "caption", 600);
    const W = p.w, H = L.H, pad = L.pad, gap = L.gap;
    const nodes = (p.nodes || []).map((n, i) => Object.assign({ id: "n" + i }, n, { label: String(n.label == null ? n.id : n.label) }));
    const pods = (p.pods || []).map((q, i) => Object.assign({ id: "p" + i, state: "running" }, q, { svc: String(q.svc == null ? "" : q.svc) }));
    const STATES = ["running", "pending", "failed", "terminating"];
    const TOK = { running: "pos", pending: DK.warnTok(), failed: "neg", terminating: "muted" };
    // ---- the frame and the control plane
    const frame = svg("g", {}, g);
    K.rect(frame, 0, 0, W, H, { fill: "none", r: 18, stroke: "line", sw: 2, dash: "10 8" });
    const top = L.top0;
    if (p.title) DK.word(ctx, frame, p.title, { x: 24, y: 10, w: W * 0.5, h: lh, size: Z.fs, weight: 700, color: "muted", at: animated ? p.at : -1, eng, pen, name: "title", kind: "label" });
    let cp = null;
    if (p.controlPlane) {
      const cpH = L.cpH, cg = svg("g", {}, frame), cw = L.cpW, cx = (W - cw) / 2;
      svg("rect", { x: cx, y: top, width: cw, height: cpH, rx: 12, fill: surface }, cg);
      K.rect(cg, cx, top, cw, cpH, { fill: "surface2", r: 12, stroke: "accent", sw: 2 });
      AK.icon(cg, "cpu", cx + 34, top + cpH / 2, 26, "accent");
      DK.word(ctx, cg, p.controlPlane, { x: cx + 58, y: top, w: cw - 70, h: cpH, size: Z.fs, weight: 700, at: animated ? p.at : -1, eng, pen, name: "control", kind: "label" });
      cp = { g: cg, x: cx + cw / 2, y: top + cpH };
    }
    // ---- the node grid (its geometry from the layout, shared with size())
    const { cols, nW, nH2, gy, headH, utilH, tileW, tileH, tg, per, slotsY0 } = L;
    const N = {};
    nodes.forEach((nd, i) => {
      const r = Math.floor(i / cols), c = i % cols, x = pad + c * (nW + gap), y = gy + r * (nH2 + gap);
      const ng = svg("g", {}, g), body = svg("g", {}, ng);
      svg("rect", { x: f1(x), y: f1(y), width: f1(nW), height: f1(nH2), rx: 14, fill: surface }, body);
      K.rect(body, x, y, nW, nH2, { fill: "surface", r: 14, stroke: "line", sw: 1.5, shadow: true });
      AK.icon(body, "server", x + 26, y + headH / 2, 24, "muted");
      const lab = DK.word(ctx, body, nd.label, { x: x + 46, y, w: nW - 60, h: headH, size: Z.fs, weight: 700, at: animated ? p.at + i * 0.05 : -1, eng, pen, name: `node_${nd.id}`, kind: "label" });
      // CPU and memory bars, no words: an icon names each
      const bars = [];
      [["cpu", "cpu"], ["mem", "memory-stick"]].forEach(([k, ic], j) => {
        if (nd[k] == null) return;
        const bx = x + 14 + j * ((nW - 28) / 2), bw = (nW - 28) / 2 - 12, by = y + headH + 4;
        AK.icon(body, ic, bx + 10, by + 8, 18, "muted");
        svg("rect", { x: f1(bx + 24), y: f1(by + 4), width: f1(bw - 24), height: 8, rx: 4, fill: S.mix(S.c("line"), surface, 0.8) }, body);
        const v = Math.max(0, Math.min(1, +nd[k]));
        const fill = svg("rect", { x: f1(bx + 24), y: f1(by + 4), width: f1((bw - 24) * (animated ? 0 : v)), height: 8, rx: 4, fill: DK.legible(v > 0.85 ? "neg" : v > 0.7 ? DK.warnTok() : "accent", surface, ink, 3) }, body);
        if (animated) Loom.drive((e) => fill.setAttribute("width", f1((bw - 24) * v * e)), p.at + 0.4, 0.8, "move", DK.meta("count", "cluster.util"));
        bars.push(fill);
      });
      const dim = svg("rect", { x: f1(x), y: f1(y), width: f1(nW), height: f1(nH2), rx: 14, fill: field, opacity: 0 }, ng);
      N[nd.id] = { id: nd.id, g: ng, body, dim, x, y, w: nW, h: nH2, label: lab, bars, slots: [], down: false };
      if (animated) AK.show(ng, p.at + i * 0.06, 0.3);
    });
    const slotXY = (nd, k) => ({ x: nd.x + 14 + (k % per) * (tileW + tg), y: nd.y + slotsY0 + Math.floor(k / per) * (tileH + tg) });
    const freeSlot = (nd) => { let k = nd.slots.indexOf(null); if (k < 0) k = nd.slots.length; return k; };
    // ---- pods
    const P = {};
    const podLayer = svg("g", {}, g);
    function makePod(spec, nd, k, st, at) {
      const q = slotXY(nd, k), pg = svg("g", { transform: `translate(${f1(q.x)} ${f1(q.y)})` }, podLayer);
      const layers = {};
      for (const s of STATES) {
        const lg = svg("g", { opacity: s === st ? 1 : 0 }, pg), tc = DK.legible(TOK[s], surface, ink, 3);
        svg("rect", { x: 0, y: 0, width: f1(tileW), height: f1(tileH), rx: 7, fill: s === "terminating" ? surface : S.mix(surface, tc, 0.18), stroke: tc, "stroke-width": 2, "stroke-dasharray": s === "pending" || s === "terminating" ? "5 4" : null }, lg);
        if (s === "failed") svg("path", { d: `M${f1(tileW - 16)} 6 l10 10 m0 -10 l-10 10`, stroke: tc, "stroke-width": 2.4, fill: "none", "stroke-linecap": "round" }, lg);
        layers[s] = lg;
      }
      const word = DK.word(ctx, pg, spec.svc, { x: 8, y: 0, w: tileW - (st === "failed" ? 30 : 16), h: tileH, size: Z.small, weight: 600, at: at != null && at >= 0 ? at : -1, eng, pen, parentG: pg, name: `pod_${spec.id}`, kind: "label" });
      const Pd = { id: spec.id, svc: spec.svc, g: pg, layers, state: st, node: nd.id, slot: k, x: q.x, y: q.y, word };
      nd.slots[k] = Pd.id;
      P[spec.id] = Pd;
      return Pd;
    }
    pods.forEach((q, i) => {
      const nd = N[q.node];
      if (!nd) { Loom.error("component_params", `ops_cluster_map: pod "${q.id}" is on an unknown node "${q.node}"`); return; }
      const Pd = makePod(q, nd, freeSlot(nd), STATES.includes(q.state) ? q.state : "running", animated ? p.at + 0.5 + i * 0.03 : -1);
      if (animated) popIn(Pd, p.at + 0.5 + i * 0.03);
    });
    function popIn(Pd, t) {
      Loom.drive((e) => Pd.g.setAttribute("transform", `translate(${f1(Pd.x + tileW / 2 * (1 - e))} ${f1(Pd.y + tileH / 2 * (1 - e))}) scale(${f1(Math.max(0.001, e))})`), t, 0.3, "overshoot", DK.meta("reveal", "cluster.pod"));
    }
    function moveTo(Pd, x, y, t, dur) {
      const a = { x: Pd.x, y: Pd.y };
      Loom.drive((e) => Pd.g.setAttribute("transform", `translate(${f1(a.x + (x - a.x) * e)} ${f1(a.y + (y - a.y) * e)})`), t, dur || 0.7, "move", DK.meta("travel", "cluster.pod"));
      Pd.x = x; Pd.y = y;
      return t + (dur || 0.7);
    }
    const setState = (Pd, s, t) => { if (!Pd || Pd.state === s || !STATES.includes(s)) return t; DK.cross(Pd.layers[Pd.state], Pd.layers[s], t); Pd.state = s; return t + 0.25; };

    // ---- state functions
    const parts = { frame, control: cp && cp.g, nodes: N, pods: P };
    parts.state = (id, s, t) => setState(P[id], s, t);
    parts.schedule = function (spec, nodeId, t) {
      const nd = N[nodeId];
      if (!nd || !spec) return t;
      spec = Object.assign({ id: `pod${Object.keys(P).length}`, state: "running" }, spec, { svc: String(spec.svc || "") });
      const k = freeSlot(nd), dest = slotXY(nd, k);
      const Pd = makePod(spec, nd, k, "pending", t);
      const from = cp ? { x: cp.x - tileW / 2, y: cp.y - tileH - 6 } : { x: W / 2 - tileW / 2, y: 4 };
      Pd.g.setAttribute("transform", `translate(${f1(from.x)} ${f1(from.y)})`);
      Pd.x = from.x; Pd.y = from.y;
      AK.show(Pd.g, t, 0.2);
      const te = moveTo(Pd, dest.x, dest.y, t + 0.1, 0.8);
      setState(Pd, spec.state === "pending" ? "pending" : "running", te + 0.2);
      return te + 0.4;
    };
    parts.fail = function (nodeId, t) {
      const nd = N[nodeId];
      if (!nd || nd.down) return t;
      nd.down = true;
      // one shake, never a loop, then the node dims and its pods fail
      Loom.drive((e, raw) => nd.body.setAttribute("transform", `translate(${f1(Math.sin(raw * Math.PI * 4) * 8 * (1 - raw))} 0)`), t, 0.45, "linear", DK.meta("gesture", "cluster.fail"));
      Loom.tween(nd.dim, { opacity: 0 }, { opacity: 0.55, duration: 0.3 }, t + 0.45, DK.meta("state", "cluster.fail"));
      Object.values(P).filter((Pd) => Pd.node === nodeId).forEach((Pd) => setState(Pd, "failed", t + 0.5));
      return t + 0.8;
    };
    parts.reschedule = function (map, t) {
      let te = t;
      Object.entries(map || {}).forEach(([id, to], i) => {
        const Pd = P[id], nd = N[to];
        if (!Pd || !nd) return;
        const old = N[Pd.node]; if (old) old.slots[Pd.slot] = null;
        const k = freeSlot(nd), q = slotXY(nd, k);
        nd.slots[k] = id; Pd.node = to; Pd.slot = k;
        const ti = t + i * 0.12;
        setState(Pd, "pending", ti);
        te = Math.max(te, moveTo(Pd, q.x, q.y, ti + 0.1, 0.8));
        setState(Pd, "running", ti + 1.1);
      });
      return te + 0.6;
    };
    parts.scale = function (svc, count, t) {
      const live = Object.values(P).filter((Pd) => Pd.svc === svc && Pd.state !== "terminating" && Pd.state !== "failed");
      let te = t;
      if (live.length < count) {
        for (let k = 0; k < count - live.length; k++) {
          const nd = Object.values(N).filter((x) => !x.down).sort((a, b) => a.slots.filter(Boolean).length - b.slots.filter(Boolean).length)[0];
          if (!nd) break;
          te = Math.max(te, parts.schedule({ id: `${svc}-${Object.keys(P).length}`, svc }, nd.id, t + k * 0.25));
        }
      } else {
        live.slice(count).forEach((Pd, k) => {
          const ti = t + k * 0.15;
          setState(Pd, "terminating", ti);
          AK.hide(Pd.g, ti + 0.9, 0.3);
          if (N[Pd.node]) N[Pd.node].slots[Pd.slot] = null;
          te = Math.max(te, ti + 1.2);
        });
      }
      return te;
    };
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "schedule") parts.schedule(st.pod, st.node, st.at);
      else if (st.do === "fail") parts.fail(st.node, st.at);
      else if (st.do === "reschedule") parts.reschedule(st.map, st.at);
      else if (st.do === "scale") parts.scale(st.svc, st.n, st.at);
      else if (st.do === "state") parts.state(st.pod, st.state, st.at);
      else Loom.error("component_params", `ops_cluster_map: step "${st.do}" is not schedule, fail, reschedule, scale or state`);
    }
    return parts;
  },
});

// the map's geometry, shared by size() and build(): the frame hugs its node grid (h is the most it may take), each node
// as tall as the pods it will hold need. It had kept h whatever the content, three nodes floating in a frame twice their
// height (2026-10-16 review).
Loom.devKit.clusterLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, Z = DK.ui().Z;
  let engK = 1;
  try { const e = p.engine !== "off" && Loom.engines && Loom.engines.current && Loom.engines.current(); if (e && e.id === "whiteboard") engK = 1.6; else if (e && e.id === "blueprint") engK = 1.35; } catch (e) { engK = 1; }
  const lh = AK.lineH(Z.fs, "caption", 700), lhS = AK.lineH(Z.small, "caption", 600);
  const W = p.w, Hmax = p.h, pad = 18, gap = 22;
  const nodes = p.nodes || [], pods = (p.pods || []).map((q) => Object.assign({}, q, { svc: String(q.svc == null ? "" : q.svc) }));
  const top0 = p.title ? 10 + lh + 8 : pad;
  const cpH = lh + 26, cpW = p.controlPlane ? Math.min(W - 2 * pad, AK.measure(p.controlPlane, "caption", Z.fs, 700) * engK + 110) : 0;
  const top = top0 + (p.controlPlane ? cpH + gap : 0);
  const n = Math.max(1, nodes.length);
  const cols = n <= 4 ? n : n <= 8 ? Math.ceil(n / 2) : Math.ceil(Math.sqrt(n * 1.6)), rows = Math.ceil(n / cols);
  const nW = (W - 2 * pad - (cols - 1) * gap) / cols, nH = (Hmax - top - pad - (rows - 1) * gap) / rows;
  const headH = lh + 16, hasUtil = nodes.some((q) => q.cpu != null || q.mem != null), utilH = hasUtil ? 26 : 0;
  // pod tiles: as wide as the widest service name, as many a row as fit; the most a node will hold decides the rows
  const extra = (p.steps || []).reduce((a, s) => a + (s && s.do === "scale" ? Math.max(0, +s.n || 0) : s && s.do === "schedule" ? 1 : 0), 0);
  const svcs = pods.map((q) => q.svc).concat((p.steps || []).filter((s) => s && (s.svc || (s.pod && s.pod.svc))).map((s) => String(s.svc || s.pod.svc)));
  const tileW = Math.max(64, Math.min(nW - 2 * pad, Math.max(...svcs.map((s) => AK.measure(s, "caption", Z.small, 600) * engK + 24))));
  const tileH = lhS + 14, tg = 8;
  const per = Math.max(1, Math.floor((nW - 2 * 14 + tg) / (tileW + tg)));
  const slotsY0 = headH + utilH + 10;
  const maxRows = Math.max(1, Math.floor((nH - slotsY0 - 10 + tg) / (tileH + tg)));
  const cap = per * maxRows;
  const ids = nodes.map((nd, i) => (nd.id == null ? "n" + i : nd.id));
  const need = Math.max(...ids.map((id) => pods.filter((q) => q.node === id).length), Math.ceil((pods.length + extra) / n) + (extra ? 1 : 0));
  if (need > cap) Loom.warn("dev_cluster_full", `ops_cluster_map: a node may hold ${need} pods but only ${cap} tiles fit (raise h or w)`);
  const nH2 = Math.min(nH, slotsY0 + Math.ceil(Math.max(1, need) / per) * (tileH + tg) - tg + 16 + 30);
  const gridH = rows * nH2 + (rows - 1) * gap;
  const H = Math.min(Hmax, Math.ceil(top + gridH + pad));
  const gy = top + Math.max(0, (H - top - pad - gridH) / 2);
  return { engK, pad, gap, top0, cpH, cpW, top, cols, rows, nW, nH2, gy, headH, utilH, tileW, tileH, tg, per, slotsY0, cap, need, H };
};
