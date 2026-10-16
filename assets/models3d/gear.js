// @model {"id": "gear", "pack": "workplace", "what": "a pair of meshing machined gears on a base plate: a large drive gear and a small one, turning together", "parts": ["drive", "follower", "plate"], "keys": {"spin": "radians the drive gear has turned (the follower turns by the tooth ratio)", "jam": "0..1 the follower stops and shakes red (a process breaks)", "turn": "radians about y"}, "best_for": ["a process or a system working", "how parts depend on each other", "automation", "a step that jams the process"], "not_for": ["settings menus (use a UI artefact)"], "size": [1.9, 1.5, 0.5], "sheet": {"opts": {}, "states": [{"key": "spin", "from": 0, "to": 3.2, "at": 0, "dur": 6}], "elevation": 10}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const gearShape = (teeth, rOut, rIn, hole) => {
    const s = new THREE.Shape(), n = teeth * 4;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, ph = i % 4, r = ph === 1 || ph === 2 ? rOut : rIn;
      const x = r * Math.cos(a), y = r * Math.sin(a); i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
    }
    const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h);
    // three lightening holes
    for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3, hh = new THREE.Path(); hh.absarc(Math.cos(a) * rIn * 0.58, Math.sin(a) * rIn * 0.58, rIn * 0.17, 0, Math.PI * 2, true); s.holes.push(hh); }
    return s;
  };
  const T1 = 16, T2 = 10, M = 0.034;             // module: pitch radius = teeth * M
  const r1 = T1 * M, r2 = T2 * M;
  const drive = K.mesh(THREE, K.extrude(THREE, gearShape(T1, r1 + M, r1 - M * 1.2, 0.07), 0.12, 0.015, 8), K.mat(ctx, THREE, opts.colour || "ui", "metal", opts, { roughness: 0.35, metalness: 0.6 }));
  const followerMat = K.mat(ctx, THREE, opts.colour2 || "metal", "metal", opts, { roughness: 0.3, emissive: K.col(ctx, "bad", opts), emissiveIntensity: 0 });
  const follower = K.mesh(THREE, K.extrude(THREE, gearShape(T2, r2 + M, r2 - M * 1.2, 0.05), 0.12, 0.015, 8), followerMat);
  const cy = r1 + M + 0.2;
  const g1 = new THREE.Group(); g1.position.set(-r2 * 0.95, cy, 0); g1.add(drive);
  const g2 = new THREE.Group(); g2.position.set(-r2 * 0.95 + r1 + r2 + M * 0.15, cy + 0.0, 0); g2.add(follower);
  // axles and a back plate
  const axleMat = K.mat(ctx, THREE, "casing", "metal", opts);
  for (const g of [g1, g2]) { const a = K.mesh(THREE, new THREE.CylinderGeometry(0.045, 0.045, 0.3, 24), axleMat); a.rotation.x = Math.PI / 2; a.position.copy(g.position); a.position.z = -0.05; pivot.add(a); }
  const plate = K.mesh(THREE, K.rbox(THREE, X, 1.9, 1.3, 0.06, 0.05, 4), K.mat(ctx, THREE, "paper2", "matte", opts));
  plate.position.set(0.1, cy, -0.2); pivot.add(plate);
  const foot = K.mesh(THREE, K.rbox(THREE, X, 1.9, 0.1, 0.5, 0.03, 3), K.mat(ctx, THREE, "paper2", "matte", opts)); foot.position.set(0.1, 0.05, -0.05); pivot.add(foot);
  const post = K.mesh(THREE, K.rbox(THREE, X, 0.2, cy, 0.08, 0.02, 3), K.mat(ctx, THREE, "paper2", "matte", opts)); post.position.set(0.1, cy / 2, -0.2); pivot.add(post);
  pivot.add(g1, g2);
  group.add(K.contactShadow(ctx, THREE, 2.2, 0.9, 0.35));

  const st = { spin: 0, jam: 0 };
  const apply = () => {
    g1.rotation.z = st.spin * (1 - 0.0 * st.jam);
    const ratio = T1 / T2, phase = Math.PI / T2;
    g2.rotation.z = -st.spin * ratio * (1 - st.jam) + phase + 0.06 * st.jam * Math.sin(st.spin * 40);
    followerMat.emissiveIntensity = 0.7 * st.jam;
  };
  apply();
  return {
    group, size: [1.9, cy + r1 + M + 0.1, 0.5], parts: { drive, follower, plate }, keys: ["spin", "jam", "turn"],
    set(key, v) {
      if (key === "spin") { st.spin = v; apply(); }
      else if (key === "jam") { st.jam = K.clamp(v); apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
