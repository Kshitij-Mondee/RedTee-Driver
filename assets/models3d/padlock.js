// @model {"id": "padlock", "pack": "security", "what": "a padlock: a solid rounded body with a keyhole and a steel shackle that springs open", "parts": ["body", "shackle", "keyhole"], "keys": {"open": "0 locked .. 1 open (the shackle rises and swings)", "glow": "0..1 the body lights in its colour (a state change lands)", "turn": "radians about y"}, "best_for": ["access control and permissions", "encryption and protected data", "an account locked or unlocked", "MFA as the second lock"], "not_for": ["a door or a building's security (use building or a place)"], "size": [0.92, 1.42, 0.4], "sheet": {"opts": {}, "states": [{"key": "open", "from": 0, "to": 1, "at": 2.2, "dur": 0.9}, {"key": "glow", "from": 0, "to": 1, "at": 2.6, "dur": 0.5}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const BW = 0.92, BH = 0.78, BD = 0.36, R = 0.29, LEG = 0.36, TUBE = 0.07;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);

  const bodyMat = K.mat(ctx, THREE, opts.colour || "ui", "gloss", opts, { emissive: K.col(ctx, opts.colour || "ui", opts), emissiveIntensity: 0 });
  const body = K.mesh(THREE, K.extrude(THREE, K.roundRect(THREE, BW, BH, 0.16), BD - 0.08, 0.04, 32), bodyMat);
  body.position.y = BH / 2; pivot.add(body);
  // a metal band around the face, and the keyhole: a disc and a slot in the casing tone
  const disc = new THREE.Shape(); disc.absarc(0, 0, BW * 0.17, 0, Math.PI * 2, false);
  const ring = K.mesh(THREE, K.extrude(THREE, disc, 0.02, 0.01, 48), K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.25 }));
  ring.position.set(0, BH * 0.45, BD / 2 + 0.01); pivot.add(ring);
  // the keyhole: a round head and a tapered slot, cut into the disc (drawn just in front of it)
  const kh = new THREE.Shape(); kh.absarc(0, 0.035, 0.042, -0.25 * Math.PI, 1.25 * Math.PI, false);
  kh.lineTo(-0.034, -0.085); kh.lineTo(0.034, -0.085); kh.closePath();
  const keyhole = K.mesh(THREE, new THREE.ShapeGeometry(kh, 32), K.mat(ctx, THREE, "casing", "matte", opts), false);
  keyhole.position.set(0, BH * 0.45, BD / 2 + 0.046); pivot.add(keyhole);

  // the shackle: a tube along a U (left leg, arc, right leg); its pivot is the left leg, so it swings open
  const pts = [];
  const legBottom = -0.12;   // the legs reach into the body
  for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(-R, legBottom + (LEG - legBottom) * i / 8, 0));
  for (let i = 1; i < 24; i++) { const a = Math.PI - Math.PI * i / 24; pts.push(new THREE.Vector3(R * Math.cos(a), LEG + R * Math.sin(a), 0)); }
  for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(R, LEG - (LEG - legBottom) * i / 8, 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const shackleMesh = K.mesh(THREE, new THREE.TubeGeometry(curve, 96, TUBE, 24, false), K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.22 }));
  shackleMesh.position.x = R;                       // so the group's origin is the left leg
  const shackle = new THREE.Group(); shackle.add(shackleMesh);
  shackle.position.set(-R, BH, 0); pivot.add(shackle);
  group.add(K.contactShadow(ctx, THREE, BW * 2, BD * 4, 0.45));

  const setOpen = (k) => {
    k = K.clamp(k);
    const up = K.easeOut(Math.min(1, k * 1.8)), sw = K.spring(Math.max(0, (k - 0.35) / 0.65), 0.25);
    shackle.position.y = BH + 0.2 * up;
    shackle.rotation.y = -1.0 * sw;
  };
  setOpen(opts.open || 0);
  return {
    group, size: [BW, BH + LEG + R + TUBE, BD + 0.04], parts: { body, shackle, keyhole }, keys: ["open", "glow", "turn"],
    set(key, v) {
      if (key === "open") setOpen(v);
      else if (key === "glow") bodyMat.emissiveIntensity = 0.55 * K.clamp(v);
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
