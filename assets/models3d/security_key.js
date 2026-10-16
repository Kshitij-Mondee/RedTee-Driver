// @model {"id": "security_key", "pack": "security", "what": "a hardware security key: a small rounded fob with a metal connector, a key ring hole and a touch pad that glows", "parts": ["fob", "connector", "pad"], "keys": {"touch": "0..1 the touch pad lights (the key confirms)", "plug": "0..1 the key moves along its connector axis (into a port off to its left)", "turn": "radians about y"}, "best_for": ["MFA and passkeys", "phishing-resistant sign-in", "something you have"], "not_for": ["a door key (use key)", "a phone code (use phone)"], "size": [1.3, 0.5, 0.16], "sheet": {"opts": {}, "states": [{"key": "touch", "from": 0, "to": 1, "at": 2.4, "dur": 0.4}], "elevation": 24}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const FW = 0.9, FH = 0.4, FD = 0.1;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); pivot.position.y = FH / 2 + 0.03; group.add(pivot);

  // the fob: a rounded slab with a key-ring hole at its tail
  const outline = K.roundRect(THREE, FW, FH, 0.16);
  const ringHole = new THREE.Path(); ringHole.absarc(FW / 2 - 0.13, 0, 0.06, 0, Math.PI * 2, true); outline.holes.push(ringHole);
  const fob = K.mesh(THREE, K.extrude(THREE, outline, FD - 0.04, 0.025, 32), K.mat(ctx, THREE, "casing", "plastic", opts));
  pivot.add(fob);
  // the connector: a thin metal tongue with two contact windows
  const connector = new THREE.Group();
  const tongue = K.mesh(THREE, K.rbox(THREE, X, 0.42, 0.22, 0.03, 0.008, 2), K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.2 }));
  connector.add(tongue);
  for (const y of [-0.05, 0.05]) { const w = K.mesh(THREE, new THREE.BoxGeometry(0.12, 0.05, 0.034), K.mat(ctx, THREE, "casing", "matte", opts), false); w.position.set(-0.1, y, 0); connector.add(w); }
  connector.position.set(-FW / 2 - 0.19, 0, 0); pivot.add(connector);
  // the touch pad: a gold-toned disc that glows when touched
  const padMat = K.mat(ctx, THREE, opts.pad || "warm", "metal", opts, { emissive: K.col(ctx, opts.pad || "warm", opts), emissiveIntensity: 0, roughness: 0.25 });
  const pad = K.mesh(THREE, new THREE.CylinderGeometry(0.1, 0.1, 0.02, 48), padMat);
  pad.rotation.x = Math.PI / 2; pad.position.set(-0.05, 0, FD / 2 + 0.005); pivot.add(pad);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.17, 48), new THREE.MeshBasicMaterial({ color: K.col(ctx, opts.pad || "warm", opts), transparent: true, opacity: 0, toneMapped: false }));
  halo.position.set(-0.05, 0, FD / 2 + 0.012); pivot.add(halo);
  group.add(K.contactShadow(ctx, THREE, 1.7, 0.7, 0.4));

  return {
    group, size: [FW + 0.42, FH + 0.06, FD + 0.06], parts: { fob, connector, pad }, keys: ["touch", "plug", "turn"],
    set(key, v) {
      if (key === "touch") { const k = K.clamp(v); padMat.emissiveIntensity = 1.2 * k; halo.material.opacity = 0.45 * k; halo.scale.setScalar(1 + 0.25 * k); }
      else if (key === "plug") pivot.position.x = -0.5 * K.easeInOut(K.clamp(v));
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
