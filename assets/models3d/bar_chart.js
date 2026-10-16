// @model {"id": "bar_chart", "pack": "workplace", "what": "a 3D bar chart on a plinth: rounded bars that grow to their values, one highlighted, labels on the plinth's front", "parts": ["plinth", "bars", "labels"], "keys": {"grow": "0..1 the bars rise in order (staggered)", "values": "a list of 0..1 heights (opts.values; the caller scales real numbers)", "highlight": "the index of the bar in the accent (-1 for none)", "turn": "radians about y"}, "best_for": ["a comparison of a few quantities", "growth over time", "a before and after"], "not_for": ["more than 7 bars, or exact values (use a chart template)"], "size": [2.0, 1.9, 0.8], "sheet": {"opts": {"values": [0.32, 0.48, 0.41, 0.66, 0.92], "labels": ["Q1", "Q2", "Q3", "Q4", "Q5"], "highlight": 4}, "states": [{"key": "grow", "from": 0, "to": 1, "at": 0.8, "dur": 1.8}], "elevation": 18}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  let values = (opts.values || [0.4, 0.6, 0.8]).slice(0, 7).map((v) => K.clamp(v));
  const N = values.length, BW = 0.24, GAP = 0.1, PW = N * (BW + GAP) + 0.3, PD = 0.7, HMAX = 1.5;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const plinth = K.mesh(THREE, K.rbox(THREE, X, PW, 0.16, PD, 0.03, 4), K.mat(ctx, THREE, "paper", "matte", opts)); plinth.position.y = 0.08; pivot.add(plinth);
  // labels: one canvas across the plinth's front (words only from opts.labels)
  const labels = opts.labels || [];
  let labelMesh = null;
  if (labels.length) {
    const lf = K.face(ctx, THREE, 1600, Math.round(1600 * 0.14 / PW));
    lf.draw((g, w, h) => {
      g.fillStyle = K.hexOf(ctx, "paper", opts); g.fillRect(0, 0, w, h);
      g.fillStyle = K.hexOf(ctx, "ink", opts); g.textAlign = "center"; g.textBaseline = "middle";
      const slot = w * (BW + GAP) / PW, x0 = w * 0.15 / PW + slot / 2;
      labels.slice(0, N).forEach((s, i) => { if (s) g.fillText(K.fitText(g, s, slot * 0.95, (q) => K.font(ctx, "body", q, 600), h * 0.62), x0 + i * slot + (w * GAP / PW) / 2, h / 2); });
    });
    labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.02, 0.14), new THREE.MeshBasicMaterial({ map: lf.tex, toneMapped: false }));
    labelMesh.position.set(0, 0.08, PD / 2 + 0.002); pivot.add(labelMesh);
  }
  const bars = new THREE.Group(); pivot.add(bars);
  const base = K.mat(ctx, THREE, opts.barColour || "paper2", "plastic", opts), hi = K.mat(ctx, THREE, "ui", "gloss", opts);
  const list = values.map((_, i) => {
    const m = K.mesh(THREE, K.rbox(THREE, X, BW, 1, BW, 0.04, 4), base);
    m.geometry.translate(0, 0.5, 0); m.position.set(-PW / 2 + 0.15 + GAP / 2 + BW / 2 + i * (BW + GAP), 0.16, 0); bars.add(m); return m;
  });
  group.add(K.contactShadow(ctx, THREE, PW * 1.3, PD * 1.8, 0.4));

  const st = { grow: opts.grow == null ? 1 : opts.grow, hl: opts.highlight == null ? -1 : opts.highlight };
  const apply = () => list.forEach((m, i) => {
    const k = K.spring(K.clamp(st.grow * (N * 0.35 + 1) - i * 0.35), 0.12);   // staggered: bar i starts 0.35 later
    m.scale.y = Math.max(0.001, k * Math.max(0.02, values[i]) * HMAX);
    m.material = i === st.hl ? hi : base;
  });
  apply();
  return {
    group, size: [PW, 0.16 + HMAX + 0.1, PD], parts: { plinth, bars, labels: labelMesh }, keys: ["grow", "values", "highlight", "turn"],
    set(key, v) {
      if (key === "grow") { st.grow = K.clamp(v); apply(); }
      else if (key === "values") { values = (v || []).slice(0, N).map((x) => K.clamp(x)); while (values.length < N) values.push(0); apply(); }
      else if (key === "highlight") { st.hl = v; apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
