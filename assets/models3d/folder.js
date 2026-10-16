// @model {"id": "folder", "pack": "workplace", "what": "a card file folder standing up: a back with a tab, papers inside, a front flap that opens; a label on the tab", "parts": ["back", "front", "papers"], "keys": {"open": "0 closed .. 1 the front flap folds down", "papers": "0..1 the papers rise out", "turn": "radians about y"}, "best_for": ["files, records and data kept", "a case or a project file", "what to keep and what to delete"], "not_for": ["a computer folder in a UI (use a UI artefact)"], "size": [1.5, 1.4, 0.4], "sheet": {"opts": {"label": "HR records", "papers": 3}, "states": [{"key": "open", "from": 0, "to": 1, "at": 1.4, "dur": 0.9}, {"key": "papers", "from": 0, "to": 1, "at": 2.3, "dur": 1.0}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 1.4, H = 1.0, T = 0.016;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const card = K.mat(ctx, THREE, opts.colour || "warm", "paper", opts, { side: THREE.DoubleSide });
  const card2 = K.mat(ctx, THREE, opts.colour || "warm", "paper", opts, { side: THREE.DoubleSide, color: K.col(ctx, opts.colour || "warm", opts).clone().multiplyScalar(0.86) });

  // the back with its tab on top left
  const bs = new THREE.Shape();
  bs.moveTo(-W / 2, 0); bs.lineTo(W / 2, 0); bs.lineTo(W / 2, H); bs.lineTo(-W / 2 + 0.56, H); bs.lineTo(-W / 2 + 0.5, H + 0.14);
  bs.lineTo(-W / 2 + 0.06, H + 0.14); bs.lineTo(-W / 2, H + 0.08); bs.lineTo(-W / 2, 0);
  const back = K.mesh(THREE, K.extrude(THREE, bs, T, 0.004, 4), card2); back.position.z = -0.06; pivot.add(back);
  // the label on the tab (words only from opts.label)
  if (opts.label) {
    const lf = K.face(ctx, THREE, 512, 120);
    lf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "paper", opts); K.rr(g, 0, 0, w, h, 16); g.fill(); g.fillStyle = K.hexOf(ctx, "ink", opts); g.textBaseline = "middle"; g.textAlign = "center";
      g.fillText(K.fitText(g, opts.label, w - 40, (q) => K.font(ctx, "title", q, 700), 64), w / 2, h / 2 + 2); });
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.094), new THREE.MeshBasicMaterial({ map: lf.tex, transparent: true, toneMapped: false }));
    lm.position.set(-W / 2 + 0.28, H + 0.065, -0.06 + T / 2 + 0.006); pivot.add(lm);
  }
  // the papers, slightly fanned
  const papers = new THREE.Group(); pivot.add(papers);
  const n = Math.max(1, Math.min(5, opts.papers || 3)), sheets = [];
  for (let i = 0; i < n; i++) {
    const pf = K.face(ctx, THREE, 600, 420);
    pf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "paper", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "ink", opts); g.globalAlpha = 0.16;
      for (let r = 0; r < 6; r++) { K.rr(g, 50, 60 + r * 52, (w - 100) * [0.9, 0.75, 0.85, 0.6, 0.8, 0.7][(r + i) % 6], 18, 9); g.fill(); } });
    const p = new THREE.Mesh(new THREE.BoxGeometry(W - 0.16, H - 0.12, 0.004), [K.mat(ctx, THREE, "paper2", "paper", opts), K.mat(ctx, THREE, "paper2", "paper", opts), K.mat(ctx, THREE, "paper2", "paper", opts), K.mat(ctx, THREE, "paper2", "paper", opts),
      new THREE.MeshStandardMaterial({ map: pf.tex, roughness: 0.9 }), K.mat(ctx, THREE, "paper", "paper", opts)]);
    p.castShadow = true; p.userData.home = new THREE.Vector3((i - (n - 1) / 2) * 0.05, (H - 0.12) / 2 + 0.04 + i * 0.02, -0.04 + i * 0.012);
    p.position.copy(p.userData.home); p.rotation.z = (i - (n - 1) / 2) * 0.03; papers.add(p); sheets.push(p);
  }
  // the front flap, hinged along the bottom edge
  const front = K.mesh(THREE, K.extrude(THREE, K.roundRect(THREE, W, H * 0.9, 0.02), T, 0.004, 4), card);
  front.geometry.translate(0, H * 0.45, 0);
  const hinge = new THREE.Group(); hinge.position.set(0, 0, 0.012); hinge.add(front); pivot.add(hinge);
  group.add(K.contactShadow(ctx, THREE, W * 1.5, 0.9, 0.4));

  const st = { open: 0, papers: 0 };
  const apply = () => {
    hinge.rotation.x = K.easeInOut(st.open) * 1.2;
    sheets.forEach((p, i) => { const q = K.clamp(st.papers * (n * 0.4 + 1) - i * 0.4); p.position.y = p.userData.home.y + K.spring(q, 0.15) * (0.45 + 0.08 * i) * Math.min(1, st.open * 1.4); });
  };
  apply();
  return {
    group, size: [W, H + 0.14 + 0.5, 0.4], parts: { back, front, papers }, keys: ["open", "papers", "turn"],
    set(key, v) {
      if (key === "open") { st.open = K.clamp(v); apply(); }
      else if (key === "papers") { st.papers = K.clamp(v); apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
