// @model {"id": "credit_card", "pack": "workplace", "what": "a payment card with no brand: a chip, a contactless mark, grouped number dots (or the digits given), a magnetic stripe on the back", "parts": ["card", "chip"], "keys": {"flip": "0 front .. 1 back", "tap": "0..1 contactless waves pulse out from the card", "frozen": "0..1 the card frosts over in the cool colour (blocked)", "turn": "radians about y"}, "best_for": ["payment fraud and card data", "expenses and corporate cards", "PCI and protecting card numbers"], "not_for": ["a bank's real card (never a brand)"], "size": [1.42, 0.92, 0.1], "sheet": {"opts": {"last4": "4821", "holder": "A. MORGAN"}, "states": [{"key": "tap", "from": 0, "to": 1, "at": 1.6, "dur": 1.2}, {"key": "flip", "from": 0, "to": 1, "at": 3.6, "dur": 1.0}], "elevation": 8}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 1.42, H = 0.9, T = 0.02;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); pivot.position.y = H / 2 + 0.05; group.add(pivot);

  const front = K.face(ctx, THREE, 1420, 900);
  front.draw((g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, K.hexOf(ctx, opts.colour || "ui", opts)); grd.addColorStop(1, K.hexOf(ctx, opts.colour2 || "cool", opts));
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    // the contactless mark: three arcs
    g.strokeStyle = K.hexOf(ctx, "paper", opts); g.lineWidth = 12; g.lineCap = "round";
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(1180, 260, 30 + i * 30, -0.7, 0.7); g.stroke(); }
    // the number: dots in groups of four, then the last four given (never invented)
    g.fillStyle = K.hexOf(ctx, "paper", opts);
    for (let gi = 0; gi < 3; gi++) for (let d = 0; d < 4; d++) { g.beginPath(); g.arc(120 + gi * 300 + d * 52, 600, 15, 0, Math.PI * 2); g.fill(); }
    g.textBaseline = "middle"; g.textAlign = "left";
    if (opts.last4) g.fillText(K.fitText(g, String(opts.last4), 260, (q) => K.font(ctx, "title", q, 700), 76), 1020, 602);
    if (opts.holder) g.fillText(K.fitText(g, String(opts.holder), 800, (q) => K.font(ctx, "body", q, 600), 52), 120, 760);
  });
  const back = K.face(ctx, THREE, 1420, 900);
  back.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, opts.colour2 || "cool", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "casing", opts); g.fillRect(0, 110, w, 170);
    g.fillStyle = K.hexOf(ctx, "paper", opts); K.rr(g, 120, 380, 820, 120, 12); g.fill();
  });
  const edge = K.mat(ctx, THREE, opts.colour || "ui", "plastic", opts);
  const fm = new THREE.MeshPhysicalMaterial({ map: front.tex, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 });
  const bm = new THREE.MeshPhysicalMaterial({ map: back.tex, roughness: 0.35, clearcoat: 0.8 });
  // the card: an extruded rounded rectangle (front cap carries the face map) and a back plane for the back face
  const shape = K.roundRect(THREE, W, H, 0.07);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 16 });
  geo.translate(0, 0, -T / 2);
  // planar UVs for the caps (0..1 across the card)
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / W + 0.5, pos.getY(i) / H + 0.5);
  const card = new THREE.Mesh(geo, [fm, edge]); card.castShadow = true;
  const backPlane = new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), bm);
  { const u2 = backPlane.geometry.attributes.uv, p2 = backPlane.geometry.attributes.position; for (let i = 0; i < u2.count; i++) u2.setXY(i, 0.5 - p2.getX(i) / W, p2.getY(i) / H + 0.5); }
  backPlane.rotation.y = Math.PI; backPlane.position.z = -T / 2 - 0.001;
  const cardG = new THREE.Group(); cardG.add(card, backPlane); pivot.add(cardG);
  // the chip: a metal tile with contact lines
  const chip = K.mesh(THREE, K.rbox(THREE, X, 0.2, 0.15, 0.012, 0.025, 3), K.mat(ctx, THREE, "warm", "metal", opts, { roughness: 0.25 }));
  chip.position.set(-W / 2 + 0.3, 0.06, T / 2 + 0.006); cardG.add(chip);
  // contactless waves and the frost
  const waveMat = new THREE.MeshBasicMaterial({ color: K.col(ctx, "ui", opts), transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide });
  const waves = [0, 1, 2].map((i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.3 + i * 0.16, 0.012, 8, 64, Math.PI * 0.6), waveMat.clone()); m.rotation.z = -Math.PI * 0.3; m.position.set(W / 2 - 0.1, 0.2, 0.02); cardG.add(m); return m; });
  const frost = new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), new THREE.MeshPhysicalMaterial({ color: K.col(ctx, "cool", opts), transparent: true, opacity: 0, roughness: 1 }));
  frost.position.z = T / 2 + 0.014; cardG.add(frost);
  group.add(K.contactShadow(ctx, THREE, W * 1.4, 0.5, 0.35));

  return {
    group, size: [W, H + 0.05, 0.1], parts: { card, chip }, keys: ["flip", "tap", "frozen", "turn"],
    set(key, v) {
      if (key === "flip") cardG.rotation.y = Math.PI * K.easeInOut(K.clamp(v));
      else if (key === "tap") { const k = K.clamp(v); waves.forEach((m, i) => { const q = K.clamp(k * 3 - i * 0.6); m.material.opacity = 0.8 * Math.sin(Math.PI * q); m.scale.setScalar(1 + 0.3 * q); }); }
      else if (key === "frozen") frost.material.opacity = 0.65 * K.clamp(v);
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
