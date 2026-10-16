// @model {"id": "key", "pack": "security", "what": "a classic door key: a round bow with a hole, a shank and a cut bit, in brushed metal", "parts": ["key"], "keys": {"insert": "0..1 the key slides forward along its shank (into a lock off to its left)", "twist": "0..1 the key turns a quarter about its shank", "glow": "0..1 the key lights in the warm colour", "turn": "radians about y"}, "best_for": ["access and who holds the keys", "passwords as keys", "least privilege"], "not_for": ["a hardware security key (use security_key)"], "size": [1.5, 0.6, 0.12], "sheet": {"opts": {}, "states": [{"key": "twist", "from": 0, "to": 1, "at": 2.6, "dur": 0.7}], "elevation": 18}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); pivot.position.y = 0.32; group.add(pivot);
  // built from three solids in one metal: a bow (a ring with its hole), a shank, and a cut bit near the tip
  const BR = 0.25, BX = 0.46;
  const mat = K.mat(ctx, THREE, opts.colour || "warm", "metal", opts, { roughness: 0.3, emissive: K.col(ctx, opts.colour || "warm", opts), emissiveIntensity: 0 });
  const bowS = new THREE.Shape(); bowS.absarc(0, 0, BR, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0.05, 0, 0.09, 0, Math.PI * 2, true); bowS.holes.push(hole);
  const bow = K.mesh(THREE, K.extrude(THREE, bowS, 0.06, 0.018, 48), mat); bow.position.x = BX;
  const shank = K.mesh(THREE, K.extrude(THREE, K.roundRect(THREE, 1.0, 0.1, 0.04), 0.05, 0.012, 8), mat); shank.position.x = -0.22;
  const bitS = new THREE.Shape();
  bitS.moveTo(0, 0); bitS.lineTo(0.3, 0); bitS.lineTo(0.3, -0.13); bitS.lineTo(0.22, -0.13); bitS.lineTo(0.22, -0.08); bitS.lineTo(0.14, -0.08);
  bitS.lineTo(0.14, -0.16); bitS.lineTo(0.06, -0.16); bitS.lineTo(0.06, -0.1); bitS.lineTo(0, -0.1); bitS.lineTo(0, 0);
  const bit = K.mesh(THREE, K.extrude(THREE, bitS, 0.05, 0.01, 4), mat); bit.position.set(-0.66, -0.03, 0);
  const collar = K.mesh(THREE, K.extrude(THREE, K.roundRect(THREE, 0.08, 0.2, 0.03), 0.07, 0.015, 8), mat); collar.position.x = BX - BR - 0.02;
  const keyMesh = new THREE.Group(); keyMesh.add(bow, shank, bit, collar);
  const keyG = new THREE.Group(); keyG.add(keyMesh); pivot.add(keyG);
  group.add(K.contactShadow(ctx, THREE, 1.6, 0.5, 0.35));
  return {
    group, size: [1.5, 0.62, 0.12], parts: { key: keyMesh }, keys: ["insert", "twist", "glow", "turn"],
    set(key, v) {
      if (key === "insert") keyG.position.x = -0.5 * K.easeInOut(K.clamp(v));
      else if (key === "twist") keyG.rotation.x = (Math.PI / 2) * K.easeInOut(K.clamp(v));
      else if (key === "glow") mat.emissiveIntensity = 0.45 * K.clamp(v);
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
