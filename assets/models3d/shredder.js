// @model {"id": "shredder", "pack": "security", "what": "an office shredder: a bin on casters with a window, a cutting head with a feed slot and a status light; a document feeds into the slot and the shreds fill the bin", "parts": ["bin", "head", "slot", "document", "shreds", "light"], "keys": {"feed": "0..1 the document feeds down into the slot (shreds fall inside while it does)", "fill": "0..1 the pile of shreds rises in the bin (seen through the window); at 1 the light shows the bin is full", "turn": "radians about y"}, "best_for": ["disposing of records safely", "a clean-desk or retention policy", "destroying paper copies of sensitive data"], "not_for": ["deleting digital files (use a UI artefact)", "a confidential waste bin collected by a contractor"], "size": [2.08, 4.97, 1.28], "sheet": {"opts": {"document": {"title": "Payroll March", "lines": 7}, "cut": "cross"}, "states": [{"key": "feed", "from": 0, "to": 1, "at": 1.2, "dur": 2.6}, {"key": "fill", "from": 0.15, "to": 0.75, "at": 1.4, "dur": 3.6}], "elevation": 16}}
// opts.cut: "strip" (long ribbons, the default) or "cross" (short particles). Accuracy: draw cross-cut when the
// lesson's policy asks for it for sensitive records; the model does not decide which cut is adequate.
// opts.document {title, lines}: the sheet's words (none given: a blank page with line bars).
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 2.0, D = 1.2, H = 2.75, HH = 0.4, LIFT = 0.1, WT = 0.05;   // bin, head height, caster lift, wall
  const PW = 1.24, PH = 1.7;                                             // the sheet (A4 in proportion)
  const CROSS = opts.cut === "cross";
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const shell = K.mat(ctx, THREE, opts.colour || "casing", "plastic", opts, { roughness: 0.5 });
  const shellD = K.mat(ctx, THREE, "casing2", "plastic", opts, { roughness: 0.6 });
  const box = (w, h, d, m, x, y, z, r = 0.02) => { const o = K.mesh(THREE, K.rbox(THREE, X, w, h, d, r, 3), m); o.position.set(x, y, z); return o; };

  // the bin: back, sides and a bottom, and a front with a window cut into it
  const bin = new THREE.Group(); bin.position.y = LIFT; pivot.add(bin);
  bin.add(box(W, H, WT, shell, 0, H / 2, -D / 2 + WT / 2));
  for (const s of [-1, 1]) bin.add(box(WT, H, D, shell, s * (W / 2 - WT / 2), H / 2, 0));
  bin.add(box(W, WT, D, shell, 0, WT / 2, 0));
  const WX = 0.72, WY0 = 0.36, WY1 = 2.2;                               // the window: half width, bottom, top
  // the front panel: a rounded outline from the floor of the bin up, with the window as a hole
  const fs2 = new THREE.Shape(); { const x = -W / 2, y = 0, r = 0.04; fs2.moveTo(x + r, y); fs2.lineTo(x + W - r, y); fs2.quadraticCurveTo(x + W, y, x + W, y + r); fs2.lineTo(x + W, y + H - r); fs2.quadraticCurveTo(x + W, y + H, x + W - r, y + H); fs2.lineTo(x + r, y + H); fs2.quadraticCurveTo(x, y + H, x, y + H - r); fs2.lineTo(x, y + r); fs2.quadraticCurveTo(x, y, x + r, y); }
  { const hp = new THREE.Path(), x = -WX, y = WY0, w = 2 * WX, h = WY1 - WY0, r = 0.08; hp.moveTo(x + r, y); hp.lineTo(x + w - r, y); hp.quadraticCurveTo(x + w, y, x + w, y + r); hp.lineTo(x + w, y + h - r); hp.quadraticCurveTo(x + w, y + h, x + w - r, y + h); hp.lineTo(x + r, y + h); hp.quadraticCurveTo(x, y + h, x, y + h - r); hp.lineTo(x, y + r); hp.quadraticCurveTo(x, y, x + r, y); fs2.holes.push(hp); }
  const front = K.mesh(THREE, K.extrude(THREE, fs2, WT * 0.6, 0.012, 16), shell);
  front.position.z = D / 2 - WT * 0.3; bin.add(front);
  const glass = K.mesh(THREE, new THREE.PlaneGeometry(2 * WX + 0.04, WY1 - WY0 + 0.04), K.mat(ctx, THREE, "cool", "glass", opts, { opacity: 0.16 }), false);
  glass.position.set(0, (WY0 + WY1) / 2, D / 2 - WT * 0.5); bin.add(glass);
  // casters
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const c = K.mesh(THREE, new THREE.CylinderGeometry(0.05, 0.05, 0.05, 20), K.mat(ctx, THREE, "trim", "rubber", opts));
    c.rotation.z = Math.PI / 2; c.position.set(sx * (W / 2 - 0.16), 0.05, sz * (D / 2 - 0.16)); pivot.add(c);
    const fork = box(0.07, 0.06, 0.07, shellD, sx * (W / 2 - 0.16), 0.09, sz * (D / 2 - 0.16), 0.01); pivot.add(fork);
  }

  // the head: a lid over the bin with the feed slot across its top, a status light and a rocker switch
  const TOP = LIFT + H;
  const head = new THREE.Group(); head.position.y = TOP; pivot.add(head);
  head.add(box(W + 0.08, HH, D + 0.08, shell, 0, HH / 2, 0, 0.06));
  const slot = K.mesh(THREE, K.rbox(THREE, X, PW + 0.2, 0.02, 0.06, 0.01, 2), K.mat(ctx, THREE, "casing", "matte", opts, { roughness: 1 }), false);
  slot.material.color.multiplyScalar(0.35); slot.position.set(0, HH + 0.002, 0); head.add(slot);
  for (const s of [-1, 1]) head.add(box(PW + 0.3, 0.03, 0.05, shellD, 0, HH + 0.012, s * 0.07, 0.012));   // the throat's lips
  const lightM = new THREE.MeshStandardMaterial({ color: K.col(ctx, "trim", opts), emissive: K.col(ctx, "trim", opts), emissiveIntensity: 0.2, roughness: 0.4 });
  const light = K.mesh(THREE, new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20), lightM, false);
  light.position.set(W / 2 - 0.2, HH + 0.008, D / 2 - 0.16); head.add(light);
  const rocker = box(0.14, 0.04, 0.09, shellD, W / 2 - 0.42, HH + 0.012, D / 2 - 0.16, 0.015); rocker.rotation.x = 0.18; head.add(rocker);

  // the document: a sheet standing in the slot; feeding shortens what shows above the slot from the bottom up
  const Dc = opts.document || {};
  const pf = K.face(ctx, THREE, 744, 1020);
  pf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "paper", opts); g.fillRect(0, 0, w, h);
    let y = 100;
    if (Dc.title) { g.fillStyle = K.hexOf(ctx, "ink", opts); g.textBaseline = "middle"; g.textAlign = "left";
      g.fillText(K.fitText(g, String(Dc.title), w - 120, (q) => K.font(ctx, "title", q, 700), 60), 60, y); y += 90; }
    g.fillStyle = K.hexOf(ctx, "ink", opts); g.globalAlpha = 0.18;
    for (let i = 0; i < (Dc.lines || 7); i++) { K.rr(g, 60, y + i * 70, (w - 120) * [0.95, 0.8, 0.9, 0.6, 0.85, 0.7][i % 6], 28, 14); g.fill(); }
  });
  pf.tex.wrapT = THREE.ClampToEdgeWrapping;
  const docGeo = new THREE.PlaneGeometry(PW, PH); docGeo.translate(0, PH / 2, 0);
  const docMat = new THREE.MeshStandardMaterial({ map: pf.tex, roughness: 0.9, side: THREE.DoubleSide });
  const doc = new THREE.Mesh(docGeo, docMat); doc.position.set(0, TOP + HH + 0.005, 0); doc.castShadow = true; pivot.add(doc);

  // the shreds: one instanced mesh per paper tone; a pile whose pieces show from the bottom up as it fills, and
  // pieces that fall (cross-cut) or ribbons that hang from the cutter (strip-cut) while a sheet feeds
  const hsh = (i, k) => (((i * 7919 + k * 104729) % 1009) / 1009);
  const pieceGeo = CROSS ? new THREE.BoxGeometry(0.075, 0.012, 0.16) : new THREE.BoxGeometry(0.036, 0.01, 0.62);
  const paperA = K.mat(ctx, THREE, "paper", "paper", opts), paperB = K.mat(ctx, THREE, "paper2", "paper", opts);
  const N = CROSS ? 1100 : 420, IX = W / 2 - WT - 0.05, IZ = D / 2 - WT - 0.06, PILE = H * 0.82;
  const piles = [new THREE.InstancedMesh(pieceGeo, paperA, N), new THREE.InstancedMesh(pieceGeo, paperB, N)];
  const order = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < N; i++) {
    const x = (hsh(i, 1) * 2 - 1) * (IX - (CROSS ? 0.08 : 0.3)), z = (hsh(i, 2) * 2 - 1) * (IZ - 0.08);
    const r2 = (x / IX) * (x / IX) * 0.6 + (z / IZ) * (z / IZ) * 0.4;
    const y = WT + 0.01 + (i / N) * PILE * (0.8 + 0.35 * (1 - r2)) + hsh(i, 3) * 0.03;   // a mound, higher in the middle
    order.push({ x, y, z, a: hsh(i, 4) * Math.PI * 2, t: (hsh(i, 5) - 0.5) * (CROSS ? 2.2 : 0.5) });
  }
  order.sort((a, b) => a.y - b.y);
  const counts = [0, 0];
  order.forEach((p, i) => {
    const which = hsh(i, 11) < 0.4 ? 1 : 0, m = piles[which];
    e.set(p.t, p.a, (hsh(i, 6) - 0.5) * (CROSS ? 1.6 : 0.4)); q.setFromEuler(e); v.set(p.x, p.y, p.z);
    m.setMatrixAt(counts[which]++, m4.compose(v, q, one));
  });
  const shreds = new THREE.Group(); shreds.position.y = LIFT; pivot.add(shreds);
  piles.forEach((m, k) => { m.count = 0; m.castShadow = false; m.receiveShadow = true; m.instanceMatrix.needsUpdate = true; m.userData.max = counts[k]; shreds.add(m); });
  // falling or hanging pieces (re-posed from the feed value each time)
  const NF = CROSS ? 60 : 18;
  const fallGeo = CROSS ? pieceGeo : new THREE.BoxGeometry(0.036, 1, 0.008);
  if (!CROSS) fallGeo.translate(0, -0.5, 0);
  const falling = new THREE.InstancedMesh(fallGeo, paperA, NF); falling.count = 0; shreds.add(falling);

  group.add(K.contactShadow(ctx, THREE, W * 1.7, D * 2.2, 0.45));

  const cOk = K.col(ctx, "ok", opts), cIdle = K.col(ctx, "trim", opts), cWarm = K.col(ctx, "warm", opts);
  const st = { feed: 0, fill: opts.fill == null ? 0 : K.clamp(opts.fill) };
  const apply = () => {
    const f = K.clamp(st.feed);
    // the sheet: only the part still above the slot shows (its top), and it is gone once fed
    const left = 1 - K.easeInOut(f);
    doc.visible = left > 0.001; doc.scale.y = Math.max(0.001, left);
    pf.tex.repeat.set(1, left); pf.tex.offset.set(0, 1 - left);
    // the pile
    const k = K.clamp(st.fill);
    piles.forEach((m) => { m.count = Math.round(m.userData.max * k); });
    const pileTop = WT + 0.02 + k * PILE * 1.0;
    // pieces in the air while feeding (none before or after)
    const busy = f > 0 && f < 1;
    falling.count = busy ? NF : 0;
    if (busy) {
      const top = H - 0.04;
      for (let i = 0; i < NF; i++) {
        if (CROSS) {
          const ph = ((f * 9 + i * 0.6180339887) % 1);
          v.set((hsh(i, 7) * 2 - 1) * (PW / 2 - 0.05), K.lerp(top, pileTop, ph * ph), (hsh(i, 8) - 0.5) * 0.3);
          e.set(ph * 6 + i, hsh(i, 9) * 6, ph * 4); q.setFromEuler(e);
          falling.setMatrixAt(i, m4.compose(v, q, one));
        } else {
          // ribbons hang from the cutter, growing while the sheet goes through, never past the pile
          const len = Math.max(0.01, Math.min(top - pileTop - 0.05, PH * 0.75 * K.easeInOut(f)) * (0.85 + 0.15 * hsh(i, 10)));
          v.set(-PW / 2 + 0.04 + i * (PW - 0.08) / (NF - 1), top, 0);
          e.set(0.08 * Math.sin(i * 1.7 + f * 5), 0, 0.05 * Math.sin(i * 2.3)); q.setFromEuler(e);
          falling.setMatrixAt(i, m4.compose(v, q, new THREE.Vector3(1, len, 1)));
        }
      }
      falling.instanceMatrix.needsUpdate = true;
    }
    // the light: running while a sheet feeds, the warm role when the bin is full, idle otherwise
    const full = K.clamp((k - 0.95) / 0.05);
    const c = busy ? cOk : cIdle.clone().lerp(cWarm, full);
    lightM.color.copy(c); lightM.emissive.copy(c); lightM.emissiveIntensity = busy ? 1.2 : 0.2 + 1.2 * full;
  };
  apply();
  return {
    group, size: [W + 0.08, TOP + HH + PH + 0.02, D + 0.08], parts: { bin, head, slot, document: doc, shreds, light }, keys: ["feed", "fill", "turn"],
    set(key, val) {
      if (key === "feed") { st.feed = K.clamp(val); apply(); }
      else if (key === "fill") { st.fill = K.clamp(val); apply(); }
      else if (key === "turn") pivot.rotation.y = val;
    },
  };
}
