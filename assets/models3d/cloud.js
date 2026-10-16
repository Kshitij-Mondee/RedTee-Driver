// @model {"id": "cloud", "pack": "workplace", "what": "a soft, puffy 3D cloud with an arrow that moves up or down through it (sync, upload, download)", "parts": ["cloud", "arrow"], "keys": {"arrow": "up | down | none", "flow": "0..1 the arrow travels through the cloud once (loop it with a sawtooth of t)", "glow": "0..1 the cloud lights in its colour", "turn": "radians about y"}, "best_for": ["cloud services and storage", "backups and sync", "uploading data out of the company"], "not_for": ["weather"], "size": [1.7, 1.2, 0.6], "sheet": {"opts": {"arrow": "up"}, "states": [{"key": "flow", "from": 0, "to": 1, "at": 1.4, "dur": 1.6}, {"key": "glow", "from": 0, "to": 0.6, "at": 1.4, "dur": 0.6}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); pivot.position.y = 0.62; group.add(pivot);
  const tone = opts.colour || "paper2";
  const mat = K.mat(ctx, THREE, tone, "matte", opts, { emissive: K.col(ctx, opts.glowColour || "cool", opts), emissiveIntensity: 0, roughness: 0.7 });
  // the classic silhouette: a long rounded base and three crowns, the middle one tallest
  const puffs = [[-0.36, 0.04, 0, 0.32], [0.04, 0.2, 0, 0.42], [0.42, 0.02, 0, 0.3], [-0.12, 0.0, 0.1, 0.3], [0.24, -0.02, 0.1, 0.3]];
  const cloud = new THREE.Group();
  for (const [x, y, z, r] of puffs) { const m = K.mesh(THREE, new THREE.SphereGeometry(r, 48, 32), mat); m.position.set(x, y, z); m.scale.z = 0.62; cloud.add(m); }
  const baseShape = K.roundRect(THREE, 1.5, 0.44, 0.22);
  const base = K.mesh(THREE, K.extrude(THREE, baseShape, 0.2, 0.08, 32), mat); base.position.set(0.03, -0.17, 0); cloud.add(base);
  pivot.add(cloud);
  // the arrow: a shaft and a head, in the accent, travelling through the cloud's middle
  const am = K.mat(ctx, THREE, opts.arrowColour || "ui", "plastic", opts);
  const arrow = new THREE.Group();
  const shaft = K.mesh(THREE, K.rbox(THREE, X, 0.12, 0.34, 0.12, 0.05, 4), am); shaft.position.y = -0.1; arrow.add(shaft);
  const head = K.mesh(THREE, new THREE.ConeGeometry(0.17, 0.22, 4), am); head.rotation.y = Math.PI / 4; head.position.y = 0.17; arrow.add(head);
  arrow.position.set(0.04, 0, 0.36); pivot.add(arrow);
  group.add(K.contactShadow(ctx, THREE, 1.9, 0.8, 0.28));

  let dir = opts.arrow || "up";
  const setArrow = (d) => { dir = d; arrow.visible = d !== "none"; arrow.rotation.z = d === "down" ? Math.PI : 0; };
  setArrow(dir);
  const flow = (k) => {
    k = K.clamp(k);
    const y = K.lerp(-0.3, 0.3, K.easeInOut(k)) * (dir === "down" ? -1 : 1);
    arrow.position.y = y; const s = Math.sin(Math.PI * k); arrow.scale.setScalar(0.4 + 0.6 * Math.max(0.15, s));
  };
  flow(opts.flow == null ? 0.5 : opts.flow);
  return {
    group, size: [1.7, 1.2, 0.6], parts: { cloud, arrow }, keys: ["arrow", "flow", "glow", "turn"],
    set(key, v) {
      if (key === "arrow") setArrow(v);
      else if (key === "flow") flow(v);
      else if (key === "glow") mat.emissiveIntensity = 0.35 * K.clamp(v);
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
