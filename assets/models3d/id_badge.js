// @model {"id": "id_badge", "pack": "security", "what": "a staff ID badge on a lanyard clip: a card with a header band, a portrait silhouette, a name and a role", "parts": ["card", "clip", "strap"], "keys": {"flip": "0 front .. 1 back (the back shows a scan strip)", "swing": "-1..1 the card swings on its clip", "valid": "0..1 a tick badge appears in the ok colour (opts.status: ok|bad)", "turn": "radians about y"}, "best_for": ["identity and access", "a new joiner's first day", "tailgating and building security", "who is allowed in"], "not_for": ["a person (use a rig or a character kit)"], "size": [0.9, 1.75, 0.1], "sheet": {"opts": {"name": "Alex Morgan", "role": "Finance", "org": "Head office", "status": "ok"}, "states": [{"key": "valid", "from": 0, "to": 1, "at": 2.2, "dur": 0.5}, {"key": "swing", "from": 0.6, "to": 0, "at": 0.2, "dur": 2.0}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const CW = 0.86, CH = 1.24, CT = 0.02;
  const group = new THREE.Group();
  const hang = new THREE.Group(); hang.position.y = CH + 0.42; group.add(hang);   // the swing pivot: the clip's top

  const ff = K.face(ctx, THREE, 860, 1240);
  ff.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "paper", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "ui", opts); g.fillRect(0, 0, w, 240);
    g.fillStyle = K.hexOf(ctx, "paper", opts); K.rr(g, w / 2 - 70, 70, 140, 28, 14); g.fill();      // the slot
    g.textAlign = "center"; g.textBaseline = "middle";
    if (opts.org) { g.fillText(K.fitText(g, opts.org, w - 120, (q) => K.font(ctx, "title", q, 700), 56), w / 2, 170); }
    // the portrait: a framed silhouette (a sign of a person, never a person)
    g.fillStyle = K.hexOf(ctx, "paper2", opts); K.rr(g, w / 2 - 190, 300, 380, 420, 30); g.fill();
    g.fillStyle = K.hexOf(ctx, "trim", opts); g.globalAlpha = 0.55;
    g.beginPath(); g.arc(w / 2, 450, 80, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(w / 2, 690, 150, 120, 0, Math.PI, 0); g.fill(); g.globalAlpha = 1;
    g.fillStyle = K.hexOf(ctx, "ink", opts);
    if (opts.name) g.fillText(K.fitText(g, opts.name, w - 100, (q) => K.font(ctx, "title", q, 700), 76), w / 2, 830);
    g.fillStyle = K.hexOf(ctx, "trim", opts);
    if (opts.role) g.fillText(K.fitText(g, opts.role, w - 100, (q) => K.font(ctx, "body", q, 500), 54), w / 2, 920);
    g.fillStyle = K.hexOf(ctx, "paper2", opts); K.rr(g, 80, 1040, w - 160, 90, 14); g.fill();      // a barcode band
    g.fillStyle = K.hexOf(ctx, "ink", opts); g.globalAlpha = 0.5;
    for (let i = 0; i < 46; i++) { const bw = [3, 6, 2, 9, 4][i % 5]; g.fillRect(100 + i * 14.5, 1052, bw, 66); }
    g.globalAlpha = 1;
  });
  const bf = K.face(ctx, THREE, 860, 1240);
  bf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "paper2", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "casing", opts); g.fillRect(0, 520, w, 150);          // the scan strip
    g.fillStyle = K.hexOf(ctx, "paper", opts); K.rr(g, w / 2 - 70, 70, 140, 28, 14); g.fill();
  });
  const edge = K.mat(ctx, THREE, "paper2", "plastic", opts);
  const front = new THREE.MeshPhysicalMaterial({ map: ff.tex, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const backM = new THREE.MeshPhysicalMaterial({ map: bf.tex, roughness: 0.35, clearcoat: 0.6 });
  const card = new THREE.Mesh(new THREE.BoxGeometry(CW, CH, CT), [edge, edge, edge, edge, front, backM]);
  card.castShadow = true;
  const cardG = new THREE.Group(); cardG.add(card); card.position.y = -CH / 2 - 0.12;
  // the clip and the strap
  const clip = K.mesh(THREE, K.rbox(THREE, X, 0.16, 0.22, 0.05, 0.02, 3), K.mat(ctx, THREE, "metal", "metal", opts));
  clip.position.y = -0.06; cardG.add(clip);
  const strap = K.mesh(THREE, new THREE.BoxGeometry(0.12, 0.42, 0.012), K.mat(ctx, THREE, opts.strap || "ui", "matte", opts));
  strap.position.y = 0.2; cardG.add(strap);
  // the status mark: a round badge with a tick or a cross, on the card's corner
  const sf = K.face(ctx, THREE, 256, 256);
  const ok = (opts.status || "ok") === "ok";
  sf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, ok ? "ok" : "bad", opts); g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fill();
    g.strokeStyle = K.hexOf(ctx, "paper", opts); g.lineWidth = 26; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath();
    if (ok) { g.moveTo(70, 132); g.lineTo(112, 172); g.lineTo(186, 92); } else { g.moveTo(84, 84); g.lineTo(172, 172); g.moveTo(172, 84); g.lineTo(84, 172); }
    g.stroke();
  });
  const mark = new THREE.Mesh(new THREE.CircleGeometry(0.13, 40), new THREE.MeshBasicMaterial({ map: sf.tex, transparent: true, toneMapped: false }));
  mark.position.set(0.21, -0.12 - CH * 0.27, CT / 2 + 0.004); mark.visible = false; cardG.add(mark);
  hang.add(cardG);
  group.add(K.contactShadow(ctx, THREE, CW * 1.6, 0.5, 0.3));

  return {
    group, size: [CW, CH + 0.42 + 0.12, 0.1], parts: { card, clip, strap }, keys: ["flip", "swing", "valid", "turn"],
    set(key, v) {
      if (key === "flip") card.rotation.y = Math.PI * K.easeInOut(K.clamp(v));
      else if (key === "swing") cardG.rotation.z = 0.3 * K.clamp(v, -1, 1);
      else if (key === "valid") { const k = K.clamp(v); mark.visible = k > 0; mark.scale.setScalar(K.spring(k, 0.35)); }
      else if (key === "turn") hang.rotation.y = v;
    },
  };
}
