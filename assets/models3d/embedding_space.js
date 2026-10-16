// @model {"id": "embedding_space", "pack": "ai_ml", "what": "an embedding space: a faint box with three unlabelled axes holding a point cloud that settles into clusters (words beside them from opts), a query point whose k nearest neighbours light and link, and two analogy arrows between real points", "parts": ["box", "points", "cluster_labels", "query_point", "neighbour_links", "offset_arrows", "caption"], "keys": {"scatter": "0 points spread at random .. 1 points settle into their clusters", "query": "0..1 the query point arrives and its k nearest neighbours (opts.k, by distance on the shown positions) light and link", "offset": "0..1 two analogy arrows draw between the point pairs in opts.offset (approximately, never exactly, parallel)", "spin": "radians the cloud turns inside the frame", "turn": "radians about y"}, "best_for": ["embeddings: closeness means similar meaning", "semantic search and retrieval (nearest neighbours)", "clusters of similar items", "the word-vector analogy beat"], "not_for": ["exact coordinates or a real model's space (this is a 3D projection of hundreds or thousands of dimensions; the caption should say so)"], "size": [2.1, 2.05, 2.1], "sheet": {"opts": {"clusters": ["animals", "vehicles", "fruit"], "per": 12, "k": 4, "query": 0, "seed": 7, "offset": [{"from": [1, 6], "to": [2, 0]}, {"from": [1, 11], "to": [2, 8]}], "caption": "A 3D projection of a space with hundreds of dimensions"}, "states": [{"key": "scatter", "from": 0, "to": 1, "at": 0.6, "dur": 1.4}, {"key": "query", "from": 0, "to": 1, "at": 2.3, "dur": 1.2}, {"key": "offset", "from": 0, "to": 1, "at": 3.9, "dur": 1.0}], "elevation": 18, "mood": "latent_space"}}
// Accuracy (topic-asset-needs 8.8): the lit neighbours are the k nearest to the query by Euclidean distance computed on
// the positions shown at that moment (recomputed in every set), so they are really the nearest; the analogy arrows join
// real points, so they are as parallel as the points make them and never forced; positions come from a seeded
// generator (opts.seed), so the same seed gives the same cloud. Cluster words, the query word, arrow-end words and the
// caption come only from opts.

// a small seeded generator (mulberry32): deterministic, no Math.random
function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 1831565813) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const nearest = (q, list, k) => list.map((p, i) => [Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z), i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, k).map((e) => e[1]);
// the cloud's layout as plain numbers (testable without a renderer): cluster centres, each point's home and random
// start, and the query's home; everything from the seeded generator, in box units (half-size B)
export function layout(opts, B) {
  const nC = Math.max(1, Math.min(5, (opts.clusters || []).length || opts.groups || 3)), per = Math.max(3, Math.min(20, opts.per || 12));
  const R = rng(opts.seed == null ? 1 : opts.seed), gauss = () => (R() + R() + R() - 1.5) / 1.5;
  const centres = [], pts = [];
  for (let c = 0; c < nC; c++) {
    const a = (c / nC) * Math.PI * 2 + (R() - 0.5) * 0.5;
    centres.push([Math.cos(a) * B * 0.56, (c % 2 ? -1 : 1) * B * (0.18 + 0.2 * R()), Math.sin(a) * B * 0.56]);
  }
  for (let c = 0; c < nC; c++) for (let i = 0; i < per; i++) {
    const home = centres[c].map((v) => v + gauss() * B * 0.3);
    const start = [0, 0, 0].map(() => (R() * 2 - 1) * B * 0.88);
    pts.push({ c, i, home, start, lag: R() * 0.3 });
  }
  const qc = Math.max(0, Math.min(nC - 1, opts.query || 0)), q = centres[qc], n = Math.hypot(q[0], q[2]) || 1;
  // the query sits just inward of its cluster (towards the box centre), so its links read and it stays inside the box
  const qHome = opts.queryAt ? opts.queryAt.map((v) => v * B) : [q[0] - q[0] / n * B * 0.4, q[1] + B * 0.08, q[2] - q[2] / n * B * 0.4];
  return { nC, per, centres, pts, qHome };
}

export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const B = 0.85, PH = 0.12, BY = PH + B;                                       // box half-size, box centre height (on a thin base)
  const cl = (opts.clusters || []).map((c) => (typeof c === "string" ? { label: c } : c || {}));
  const L0 = layout(opts, B), nC = L0.nC, kN = Math.max(1, Math.min(10, opts.k || 4));
  const group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot);
  const dark = K.role(ctx, "ink", opts) === "field";

  // a thin base (the caption's home) and the faint box with three unlabelled axes
  const base = K.mesh(THREE, K.rbox(THREE, X, 2 * B + 0.2, PH, 2 * B + 0.2, 0.03, 3), K.mat(ctx, THREE, dark ? "casing2" : "paper", "matte", opts)); base.position.y = PH / 2; pivot.add(base);
  const cloud = new THREE.Group(); cloud.position.y = BY; pivot.add(cloud);
  const box = new THREE.Group(); cloud.add(box);
  box.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2 * B, 2 * B, 2 * B)), new THREE.LineBasicMaterial({ color: K.col(ctx, "line", opts), transparent: true, opacity: 0.55 })));
  const glass = K.mat(ctx, THREE, "paper2", "matte", opts, { transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
  for (const [ry, rx, x, y, z] of [[0, 0, 0, 0, -B], [Math.PI / 2, 0, -B, 0, 0], [0, -Math.PI / 2, 0, -B + 0.006, 0]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2 * B, 2 * B), glass); p.rotation.set(rx, ry, 0); p.position.set(x, y, z); box.add(p);
  }
  const o = [-B, -B, -B];
  for (const e of [[B + 0.12, -B, -B], [-B, B + 0.12, -B], [-B, -B, B + 0.12]]) box.add(K.arrow3d(ctx, THREE, o, e, { role: "text", r: 0.01, colors: opts.colors }));

  // cluster centres spread around the box, points around them; and a seeded random start for every point
  const roles = ["ui", "cool", "accent3", "accent2", "line"];
  const centres = L0.centres.map((c) => new THREE.Vector3(...c));
  const pts = [], geo = new THREE.SphereGeometry(0.04, 20, 14);
  for (const q of L0.pts) {
    const home = new THREE.Vector3(...q.home), start = new THREE.Vector3(...q.start), c = q.c, i = q.i, lag = q.lag;
    const base = K.col(ctx, roles[c % roles.length], opts);
    const m = K.mesh(THREE, geo, new THREE.MeshStandardMaterial({ color: base.clone(), emissive: base.clone(), emissiveIntensity: 0.35, roughness: 0.4 }), false);
    cloud.add(m); pts.push({ m, c, i, home, start, base, lag });
  }
  const billboard = (m) => { m.onBeforeRender = (r, s, cam) => { m.parent.getWorldQuaternion(m.quaternion).invert().multiply(cam.quaternion); m.updateMatrix(); m.matrixWorld.multiplyMatrices(m.parent.matrixWorld, m.matrix); }; return m; };
  const word = (s, h, role) => { const l = billboard(K.label(ctx, THREE, s, { h, role, colors: opts.colors })); l.material.opacity = 0; cloud.add(l); return l; };
  const labels = cl.slice(0, nC).map((c, i) => (c.label ? word(c.label, 0.15, roles[i % roles.length]) : null));
  const labelsG = labels.find(Boolean) || null;   // the parts handle: the first cluster word (all of them live in the cloud)

  // the query: placed near cluster opts.query (or at opts.queryAt [x, y, z] in -1..1 of the box)
  const qHome = new THREE.Vector3(...L0.qHome);
  const warm = K.col(ctx, "warm", opts);
  const query = K.mesh(THREE, new THREE.SphereGeometry(0.075, 28, 20), new THREE.MeshStandardMaterial({ color: warm, emissive: warm, emissiveIntensity: 0.8, roughness: 0.3 }), false); cloud.add(query);
  query.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 28, 20), new THREE.MeshBasicMaterial({ color: warm, transparent: true, opacity: 0.14, depthWrite: false, toneMapped: false })));
  const qLabel = opts.queryLabel ? word(opts.queryLabel, 0.13, "warm") : null;
  const linkMat = new THREE.MeshBasicMaterial({ color: warm, transparent: true, opacity: 0.85, toneMapped: false });
  const links = new THREE.Group(); cloud.add(links);
  const rod = (r, m) => { const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10), m); g.geometry.translate(0, 0.5, 0); return g; };
  const linkList = Array.from({ length: kN }, () => { const l = rod(0.011, linkMat); links.add(l); return l; });
  const span = (obj, a, b, k) => { const d = b.clone().sub(a), L = d.length(); obj.position.copy(a); obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); obj.scale.set(1, Math.max(1e-4, L * k), 1); return L; };

  // analogy arrows between real points: opts.offset [{from: [cluster, i], to: [cluster, i], labels: [a, b]}]
  const ref = (r) => pts.find((p) => p.c === r[0] && p.i === r[1]);
  const offs = (opts.offset || []).slice(0, 2).map((o) => ({ a: ref(o.from || []), b: ref(o.to || []), labels: o.labels || [] })).filter((o) => o.a && o.b);
  const arrowMat = K.mat(ctx, THREE, "text", "plastic", opts), arrows = new THREE.Group(); cloud.add(arrows);
  offs.forEach((o) => {
    o.shaft = rod(0.011, arrowMat); o.head = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 16), arrowMat); arrows.add(o.shaft, o.head);
    o.words = o.labels.map((s) => (s ? word(s, 0.11, "text") : null));
  });
  let caption = null;
  if (opts.caption) {
    const W = 2 * B + 0.16, cap = K.face(ctx, THREE, 2048, Math.round(2048 * 0.09 / W));
    cap.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, dark ? "casing2" : "paper", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "text", opts); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(K.fitText(g, opts.caption, w * 0.96, (q) => K.font(ctx, "body", q, 600), h * 0.72), w / 2, h / 2 + 2); });
    caption = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.09), new THREE.MeshBasicMaterial({ map: cap.tex, toneMapped: false }));
    caption.position.set(0, PH / 2, B + 0.101); pivot.add(caption);
  }
  group.add(K.contactShadow(ctx, THREE, 2 * B + 0.9, 2 * B + 0.9, 0.35));

  const st = { scatter: opts.scatter == null ? 1 : K.clamp(opts.scatter), query: 0, offset: 0, spin: 0 };
  const apply = () => {
    cloud.rotation.y = st.spin;
    pts.forEach((p) => { const k = K.easeInOut(K.clamp((st.scatter - p.lag) / 0.7)); p.m.position.copy(p.start).lerp(p.home, k); });
    const lk = K.clamp((st.scatter - 0.6) / 0.4);
    labels.forEach((l, c) => { if (!l) return; l.material.opacity = lk; l.visible = lk > 0; l.position.copy(centres[c]).add(new THREE.Vector3(0, B * 0.36, 0)); });
    // the query drops in, then its nearest neighbours (on the positions shown now) light and link
    const qa = K.easeOut(K.clamp(st.query / 0.4)), ql = K.clamp((st.query - 0.4) / 0.6);
    query.visible = st.query > 0; query.position.copy(qHome).add(new THREE.Vector3(0, (1 - qa) * 0.7, 0)); query.scale.setScalar(Math.max(1e-3, qa));
    if (qLabel) { qLabel.visible = st.query > 0; qLabel.material.opacity = qa; qLabel.position.copy(query.position).add(new THREE.Vector3(0, 0.16, 0)); }
    const nn = st.query > 0 ? nearest(query.position, pts.map((p) => p.m.position), kN) : [];
    pts.forEach((p, i) => { const on = nn.includes(i) ? ql : 0; p.m.material.color.copy(p.base).lerp(warm, on); p.m.material.emissive.copy(p.m.material.color); p.m.material.emissiveIntensity = 0.35 + 0.45 * on; p.m.scale.setScalar(1 + 0.35 * on); });
    linkList.forEach((l, j) => { l.visible = ql > 0 && j < nn.length; if (l.visible) span(l, query.position, pts[nn[j]].m.position, K.easeOut(K.clamp(ql * 1.6 - j * 0.15))); });
    offs.forEach((o, j) => {
      const k = K.easeInOut(K.clamp(st.offset * 1.4 - j * 0.4)), a = o.a.m.position, b = o.b.m.position;
      const L = a.distanceTo(b), d = b.clone().sub(a).normalize(), hl = 0.08, sk = Math.max(1e-4, (L - 0.06 - hl) * k);
      o.shaft.visible = o.head.visible = k > 0;
      span(o.shaft, a.clone().addScaledVector(d, 0.03), b, 1); o.shaft.scale.y = sk;
      o.head.position.copy(a).addScaledVector(d, 0.03 + sk + hl / 2); o.head.quaternion.copy(o.shaft.quaternion);
      o.words.forEach((w, e) => { if (!w) return; w.visible = k > 0; w.material.opacity = k; w.position.copy(e ? b : a).add(new THREE.Vector3(0, -0.12, 0)); });
    });
  };
  apply();
  return {
    group, size: [2 * B + 0.4, 2 * B + 0.35, 2 * B + 0.4], parts: { box, points: cloud, cluster_labels: labelsG, query_point: query, neighbour_links: links, offset_arrows: arrows, caption },
    keys: ["scatter", "query", "offset", "spin", "turn"],
    set(key, v) {
      if (key === "scatter") { st.scatter = K.clamp(v); apply(); }
      else if (key === "query") { st.query = K.clamp(v); apply(); }
      else if (key === "offset") { st.offset = K.clamp(v); apply(); }
      else if (key === "spin") { st.spin = v; apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
