// @model {"id": "clock", "pack": "workplace", "what": "a round desk clock on two feet: a rim, a face with hour marks (no numbers), hour and minute hands, a red seconds hand", "parts": ["rim", "face", "hands"], "keys": {"time": "hours as a number (9.5 = half past nine); the hands follow", "rush": "0..1 the rim glows in the alert colour (a deadline)", "turn": "radians about y"}, "best_for": ["deadlines and time pressure", "time saved or lost", "working hours", "spacing and timing"], "not_for": ["a calendar or a date (use a UI artefact)"], "size": [1.2, 1.3, 0.4], "sheet": {"opts": {}, "states": [{"key": "time", "from": 9, "to": 11.5, "at": 0, "dur": 6}, {"key": "rush", "from": 0, "to": 1, "at": 3.6, "dur": 0.8}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const R = 0.52;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); pivot.position.y = R + 0.14; group.add(pivot);
  const rimMat = K.mat(ctx, THREE, opts.colour || "casing", "gloss", opts, { emissive: K.col(ctx, "bad", opts), emissiveIntensity: 0 });
  const rim = K.mesh(THREE, new THREE.TorusGeometry(R, 0.07, 24, 96), rimMat); pivot.add(rim);
  const backD = K.mesh(THREE, new THREE.CylinderGeometry(R, R, 0.14, 96), rimMat); backD.rotation.x = Math.PI / 2; backD.position.z = -0.06; pivot.add(backD);
  // the face: hour marks drawn from tokens, no numbers
  const ff = K.face(ctx, THREE, 1024, 1024);
  ff.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "paper", opts); g.beginPath(); g.arc(512, 512, 512, 0, Math.PI * 2); g.fill();
    g.strokeStyle = K.hexOf(ctx, "ink", opts); g.lineCap = "round";
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * Math.PI * 2, big = i % 5 === 0, r1 = big ? 400 : 440, r2 = 470;
      g.lineWidth = big ? 22 : 7; g.beginPath(); g.moveTo(512 + r1 * Math.sin(a), 512 - r1 * Math.cos(a)); g.lineTo(512 + r2 * Math.sin(a), 512 - r2 * Math.cos(a)); g.stroke();
    }
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 96), new THREE.MeshStandardMaterial({ map: ff.tex, roughness: 0.8 }));
  face.position.z = 0.012; pivot.add(face);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(R - 0.01, 96), K.mat(ctx, THREE, "paper", "glass", opts, { opacity: 0.12 }));
  glass.position.z = 0.09; pivot.add(glass);
  // hands: each a slim box whose pivot is the centre
  const hand = (len, wid, tok, z) => { const g = new THREE.Group(); const m = K.mesh(THREE, K.rbox(THREE, X, wid, len, 0.012, wid / 2.2, 2), K.mat(ctx, THREE, tok, "plastic", opts), false); m.position.y = len / 2 - 0.05; g.add(m); g.position.z = z; pivot.add(g); return g; };
  const hourH = hand(0.3, 0.05, "ink", 0.03), minH = hand(0.43, 0.034, "ink", 0.045), secH = hand(0.45, 0.012, "bad", 0.06);
  const cap = K.mesh(THREE, new THREE.CylinderGeometry(0.035, 0.035, 0.03, 24), K.mat(ctx, THREE, "bad", "plastic", opts)); cap.rotation.x = Math.PI / 2; cap.position.z = 0.07; pivot.add(cap);
  // feet
  for (const s of [-1, 1]) { const f = K.mesh(THREE, new THREE.SphereGeometry(0.07, 24, 16), K.mat(ctx, THREE, "metal", "metal", opts)); f.position.set(s * 0.3, 0.06, -0.04); f.scale.y = 0.8; group.add(f); }
  group.add(K.contactShadow(ctx, THREE, 1.2, 0.6, 0.4));

  const setTime = (hrs) => {
    const m = (hrs % 1) * 60;
    hourH.rotation.z = -((hrs % 12) / 12) * Math.PI * 2;
    minH.rotation.z = -(m / 60) * Math.PI * 2;
    secH.rotation.z = -((m * 60) % 60) / 60 * Math.PI * 2;
  };
  setTime(opts.time == null ? 10.1 : opts.time);
  return {
    group, size: [2 * R + 0.14, 2 * R + 0.28, 0.4], parts: { rim, face, hands: minH }, keys: ["time", "rush", "turn"],
    set(key, v) {
      if (key === "time") setTime(v);
      else if (key === "rush") rimMat.emissiveIntensity = 0.6 * K.clamp(v);
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
