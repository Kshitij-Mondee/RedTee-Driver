// @model {"id": "shield", "pack": "security", "what": "a solid heraldic shield with a raised rim and an embossed mark (tick, cross or none)", "parts": ["shield", "rim", "mark"], "keys": {"mark": "check | cross | none (the embossed sign)", "glow": "0..1 the face lights in its colour", "crack": "0..1 a crack opens across the face (protection failing)", "turn": "radians about y"}, "best_for": ["protection and security controls", "a defence that holds or fails", "compliance passed or failed"], "not_for": ["a lock or a key moment (use padlock or security_key)"], "size": [1.2, 1.45, 0.3], "sheet": {"opts": {"mark": "check"}, "states": [{"key": "glow", "from": 0, "to": 1, "at": 2.0, "dur": 0.6}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 1.16, H = 1.38;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); pivot.position.y = H / 2 + 0.05; group.add(pivot);
  const shieldShape = (s) => {
    const w = W * s / 2, h = H * s / 2, sh = new THREE.Shape();
    sh.moveTo(0, h); sh.quadraticCurveTo(w * 0.55, h * 0.98, w, h * 0.82); sh.lineTo(w, h * 0.05);
    sh.quadraticCurveTo(w * 0.92, -h * 0.62, 0, -h); sh.quadraticCurveTo(-w * 0.92, -h * 0.62, -w, h * 0.05);
    sh.lineTo(-w, h * 0.82); sh.quadraticCurveTo(-w * 0.55, h * 0.98, 0, h); return sh;
  };
  const tone = opts.colour || "ui";
  const rim = K.mesh(THREE, K.extrude(THREE, shieldShape(1), 0.16, 0.05, 48), K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.28 }));
  pivot.add(rim);
  const faceMat = K.mat(ctx, THREE, tone, "gloss", opts, { emissive: K.col(ctx, tone, opts), emissiveIntensity: 0 });
  const shield = K.mesh(THREE, K.extrude(THREE, shieldShape(0.84), 0.16, 0.04, 48), faceMat);
  shield.position.z = 0.04; pivot.add(shield);

  // the marks: extruded strokes in the paper tone
  const markMat = K.mat(ctx, THREE, "paper", "plastic", opts);
  const stroke = (pts, r) => K.mesh(THREE, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, "catmullrom", 0.01), 48, r, 16, false), markMat);
  const check = new THREE.Group(); check.add(stroke([[-0.24, 0.02], [-0.07, -0.16], [0.27, 0.22]], 0.06));
  const cross = new THREE.Group(); cross.add(stroke([[-0.2, 0.2], [0.2, -0.2]], 0.06), stroke([[0.2, 0.2], [-0.2, -0.2]], 0.06));
  for (const m of [check, cross]) { m.position.set(0, 0.02, 0.17); pivot.add(m); }
  // the crack: a jagged dark line across the face, drawn in by length
  const crackPts = [[-0.05, 0.5], [0.06, 0.3], [-0.04, 0.12], [0.1, -0.06], [-0.02, -0.22], [0.05, -0.42]].map(([x, y]) => new THREE.Vector3(x, y, 0.2));
  const crackGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(crackPts, false, "catmullrom", 0), 64, 0.018, 8, false);
  const crack = new THREE.Mesh(crackGeo, K.mat(ctx, THREE, "casing", "matte", opts)); crack.visible = false; pivot.add(crack);
  const crackCount = crackGeo.index ? crackGeo.index.count : crackGeo.attributes.position.count;
  group.add(K.contactShadow(ctx, THREE, W * 1.4, 0.7, 0.4));

  const setMark = (m) => { check.visible = m === "check"; cross.visible = m === "cross"; };
  setMark(opts.mark || "check");
  return {
    group, size: [W, H + 0.1, 0.3], parts: { shield, rim, mark: check }, keys: ["mark", "glow", "crack", "turn"],
    set(key, v) {
      if (key === "mark") setMark(v);
      else if (key === "glow") faceMat.emissiveIntensity = 0.5 * K.clamp(v);
      else if (key === "crack") { const k = K.clamp(v); crack.visible = k > 0; crackGeo.setDrawRange(0, Math.floor(crackCount * k / 6) * 6); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
