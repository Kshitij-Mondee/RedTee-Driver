// @model {"id": "dc_security_layers", "pack": "datacentre", "set": true, "what": "an isometric cutaway of a data centre's physical security layers, outside in: a perimeter fence with a sliding gate and reader, the building shell with a badge door into the lobby, a mantrap (the library's badge_door pair) into the secure corridor, the data hall with its own badge door, a mesh cage inside the hall, and a locked rack (server_rack) in the cage; every checkpoint has a reader whose light stays on once access is logged", "parts": ["ground", "fence", "gate", "building", "mantrap", "hall", "cage", "rack", "readers", "outlines", "marker", "intruder", "labels"], "keys": {"path": "0..1 a marker travels from outside the gate inwards; each door opens as it arrives and closes behind it (the mantrap's doors one at a time), and each reader logs it", "layer": "index of the layer that is lit (0 fence, 1 building, 2 mantrap, 3 hall, 4 cage, 5 rack; -1 none): its outline and label light", "breach": "0..1 one layer fails (opts.breachLayer, default 0): an intruder marker forces it and is stopped at the next layer, which holds and refuses it", "turn": "radians about y"}, "best_for": ["defence in depth for physical security", "the layers of access into a data centre: perimeter, building, mantrap, hall, cage, rack", "access logged at every layer", "why one failed layer is not a breach of everything"], "not_for": ["tailgating at one door close up (use badge_door)", "a real operator's site layout", "people (the marker is a token, never a person)"], "size": [10.8, 2.2, 9.6], "sheet": {"opts": {"labels": ["Fence", "Building", "Mantrap", "Hall", "Cage", "Rack"], "breachLayer": 1}, "mood": "blueprint_iso", "light": "iso", "turn": 0.9, "states": [{"key": "path", "from": 0, "to": 1, "at": 0.2, "dur": 3.6}, {"key": "layer", "from": -0.49, "to": 5.49, "at": 0.2, "dur": 3.6}, {"key": "breach", "from": 0, "to": 1, "at": 4.0, "dur": 1.5}]}}
// Layers run outside in with independent controls: a reader at every door, a light that stays on once access is
// logged. The marker and the intruder are tokens (a puck), never people. Words only from opts.labels (an array in
// layer order); none given, no plates. opts.breachLayer 0..4 (the next layer always holds).
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const labs = opts.labels || [], BL = Math.max(0, Math.min(4, Math.round(opts.breachLayer || 0)));
  const dark = K.role(ctx, "screen", opts) === "field";
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const M = (role, kind, extra) => K.mat(ctx, THREE, role, kind, opts, Object.assign({ specularIntensity: 0.3 }, extra || {}));
  const box = (w, h, d, x, y, z, m, parent, r = 0) => { const o = K.mesh(THREE, r > 0 ? K.rbox(THREE, X, w, h, d, r, 2) : new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
  const MASK0 = "#" + ctx.neutral(0).getHexString(), MASK1 = "#" + ctx.neutral(1).getHexString();   // alpha masks, not colours
  const cOk = K.col(ctx, "ok", opts), cOff = K.col(ctx, "trim", opts), cBad = K.col(ctx, "bad", opts), cUi = K.col(ctx, "ui", opts);
  const ground = new THREE.Group(), fence = new THREE.Group(), gate = new THREE.Group(), building = new THREE.Group(), mantrap = new THREE.Group();
  const hall = new THREE.Group(), cage = new THREE.Group(), rackG = new THREE.Group(), readers = new THREE.Group(), outlines = new THREE.Group(), labels = new THREE.Group();
  pivot.add(ground, fence, gate, building, mantrap, hall, cage, rackG, readers, outlines, labels);

  // geometry of the layers (x0, x1, z0, z1)
  const FEN = [-5.2, 5.2, -4.4, 4.4], BLD = [-3.9, 3.9, -3.2, 3.2], HAL = [-3.4, 3.4, -2.9, 0.7], CAG = [0.2, 3.0, -2.6, -0.6];
  const SEC = 1.7, xm = -0.85, xPass = xm - 0.15, xGate = 3.0, xEnt = 1.6, xHall = -2.2, xCage = 1.0, xRack = 2.0, zRack = -2.05;

  // ------------------------------------------------------------------ ground: the site, the building slab, the hall floor
  box(11.0, 0.04, 9.8, 0, -0.02, 0, M(dark ? "casing2" : "paper2", "matte"), ground);
  box(BLD[1] - BLD[0], 0.05, BLD[3] - BLD[2], 0, 0.025, 0, M(dark ? "casing" : "paper", "matte"), ground);
  box(HAL[1] - HAL[0] - 0.1, 0.012, HAL[3] - HAL[2] - 0.1, 0, 0.056, (HAL[2] + HAL[3]) / 2, M(dark ? "casing2" : "paper2", "matte"), ground);
  for (const o of ground.children) o.receiveShadow = true;
  const F = 0.05;                                                   // floor top inside the building

  // ------------------------------------------------------------------ the perimeter fence: posts, chain-link mesh, a sliding gate
  const cl = K.face(ctx, THREE, 128, 128);
  cl.draw((g, w, h) => { g.fillStyle = MASK0; g.fillRect(0, 0, w, h); g.strokeStyle = MASK1; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke(); g.strokeRect(0, 0, w, h); });
  cl.tex.colorSpace = THREE.NoColorSpace; cl.tex.wrapS = cl.tex.wrapT = THREE.RepeatWrapping;
  const meshMat = (role, rep) => { const t = cl.tex.clone(); t.needsUpdate = true; t.repeat.set(rep[0], rep[1]); return M(role, "metal", { alphaMap: t, transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 0.5, emissive: cUi.clone(), emissiveIntensity: 0 }); };
  const FH = 1.2, postM = M("metal", "metal", { emissive: cUi.clone(), emissiveIntensity: 0 });
  const fenceMats = [postM];
  const run = (x0, z0, x1, z1, h, role, parent, mats, posts = true) => {
    const L = Math.hypot(x1 - x0, z1 - z0); if (L < 0.05) return;
    const m = meshMat(role, [L * 3.2, h * 3.2]); mats.push(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(L, h), m); p.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2); p.rotation.y = -Math.atan2(z1 - z0, x1 - x0); parent.add(p);
    const rail = K.mesh(THREE, new THREE.CylinderGeometry(0.025, 0.025, L, 8), mats[0]); rail.rotation.z = Math.PI / 2; rail.rotation.y = p.rotation.y; rail.position.set(p.position.x, h, p.position.z); parent.add(rail);
    if (posts) for (let i = 0; i <= Math.ceil(L / 1.3); i++) { const k = i / Math.ceil(L / 1.3); box(0.06, h + 0.06, 0.06, K.lerp(x0, x1, k), (h + 0.06) / 2, K.lerp(z0, z1, k), mats[0], parent); }
  };
  const [fx0, fx1, fz0, fz1] = FEN, GW = 1.4;
  run(fx0, fz0, fx1, fz0, FH, "metal", fence, fenceMats); run(fx0, fz0, fx0, fz1, FH, "metal", fence, fenceMats); run(fx1, fz0, fx1, fz1, FH, "metal", fence, fenceMats);
  run(fx0, fz1, xGate - GW / 2, fz1, FH, "metal", fence, fenceMats); run(xGate + GW / 2, fz1, fx1, fz1, FH, "metal", fence, fenceMats);
  const gateLeaf = new THREE.Group(); gate.add(gateLeaf); gateLeaf.position.set(xGate, 0, fz1 + 0.08);
  run(-GW / 2, 0, GW / 2, 0, FH - 0.1, "metal", gateLeaf, fenceMats, false);
  for (const x of [-GW / 2, GW / 2]) box(0.06, FH - 0.05, 0.06, x, (FH - 0.05) / 2, 0, postM, gateLeaf);
  box(GW, 0.05, 0.05, 0, 0.05, 0, postM, gateLeaf);

  // ------------------------------------------------------------------ the building shell (walls cut low), the lobby and the security wall
  const WH = 0.62, WT = 0.16;
  const bldM = M("muted", "matte", { roughness: 0.9, emissive: cUi.clone(), emissiveIntensity: 0 });
  const wall = (x0, z0, x1, z1, h, m, parent) => { const L = Math.hypot(x1 - x0, z1 - z0); if (L < 0.02) return; const o = box(Math.abs(x1 - x0) + WT, h, Math.abs(z1 - z0) + WT, (x0 + x1) / 2, F + h / 2, (z0 + z1) / 2, m, parent); return o; };
  const [bx0, bx1, bz0, bz1] = BLD;
  wall(bx0, bz0, bx1, bz0, WH, bldM, building); wall(bx0, bz0, bx0, bz1, WH, bldM, building); wall(bx1, bz0, bx1, bz1, WH, bldM, building);
  wall(bx0, bz1, xEnt - 0.42, bz1, WH, bldM, building); wall(xEnt + 0.42, bz1, bx1, bz1, WH, bldM, building);
  wall(bx0, SEC, xm - 0.5, SEC, WH, bldM, building); wall(xm + 0.5, SEC, bx1, SEC, WH, bldM, building);
  // a hinged door leaf (opens inward, -z), hinge on the left jamb
  const doorLeaf = (x, z, w, h, m, parent, mesh) => {
    const hinge = new THREE.Group(); hinge.position.set(x - w / 2 + 0.03, F, z); parent.add(hinge);
    if (mesh) run(0, 0, w - 0.06, 0, h, "metal", hinge, [postM], false);
    else box(w - 0.06, h, 0.05, (w - 0.06) / 2, h / 2, 0, m, hinge, 0.01);
    return hinge;
  };
  const entDoor = doorLeaf(xEnt, bz1, 0.8, WH - 0.04, M("casing2", "plastic"), building);

  // the mantrap: the library's badge_door pair (two interlocked doors around a glass vestibule), its passage on -z
  const mt = await X.model("badge_door", { pair: true, status: "ok", status2: "ok", colors: opts.colors });
  const ms = 0.5; mt.group.scale.setScalar(ms); mt.group.position.set(xm, F - 0.02, SEC + 0.55 * ms); mantrap.add(mt.group);
  const zA = SEC + 0.55 * ms + (0.9 - 0.55) * ms, zB = SEC + 0.55 * ms + (-0.9 - 0.55) * ms;   // its two door walls

  // ------------------------------------------------------------------ the data hall: its own walls and door, rows of racks
  const halM = M("accent3", "matte", { roughness: 0.9, emissive: cUi.clone(), emissiveIntensity: 0 });
  const HH = 0.55, [hx0, hx1, hz0, hz1] = HAL;
  wall(hx0, hz0, hx1, hz0, HH, halM, hall); wall(hx0, hz0, hx0, hz1, HH, halM, hall); wall(hx1, hz0, hx1, hz1, HH, halM, hall);
  wall(hx0, hz1, xHall - 0.38, hz1, HH, halM, hall); wall(xHall + 0.38, hz1, hx1, hz1, HH, halM, hall);
  const hallDoor = doorLeaf(xHall, hz1, 0.76, HH - 0.05, M("casing2", "plastic"), hall);
  const rk = new THREE.BoxGeometry(0.5, 0.95, 0.48), rkM = M("casing", "plastic", { roughness: 0.55 });
  const rows = new THREE.InstancedMesh(rk, rkM, 8), mm = new THREE.Matrix4();
  for (let i = 0; i < 8; i++) { mm.makeTranslation(-2.9 + (i % 4) * 0.56, F + 0.48, i < 4 ? -1.15 : -2.35); rows.setMatrixAt(i, mm); }
  rows.castShadow = true; hall.add(rows);

  // ------------------------------------------------------------------ the cage: mesh walls round part of the hall, a mesh door
  const cagePost = M("metal", "metal", { emissive: cUi.clone(), emissiveIntensity: 0 }), cageMats = [cagePost];
  const CH = 1.45, [cx0, cx1, cz0, cz1] = CAG;
  const crun = (a, b, c, d) => run(a, b, c, d, CH, "metal", cage, cageMats);
  crun(cx0, cz0, cx1, cz0); crun(cx0, cz0, cx0, cz1); crun(cx1, cz0, cx1, cz1); crun(cx0, cz1, xCage - 0.32, cz1); crun(xCage + 0.32, cz1, cx1, cz1);
  cage.children.forEach((o) => { o.position.y += F; });            // the runs were built from y = 0; the cage stands on the slab
  const cageDoor = doorLeaf(xCage, cz1, 0.64, CH - 0.05, null, cage, true);

  // ------------------------------------------------------------------ the locked rack: the library's server_rack, plus neighbours
  const rack = await X.model("server_rack", { units: 6, load: 1, colors: opts.colors });
  const rs = 0.55; rack.group.scale.setScalar(rs); rack.group.position.set(xRack, F, zRack); rackG.add(rack.group);
  for (const dx of [-0.62, 0.62]) box(0.5, 1.2, 0.48, xRack + dx, F + 0.6, zRack, rkM, rackG);

  // ------------------------------------------------------------------ readers at every checkpoint (a light that stays on once logged)
  const readerAt = (x, y, z, ry = 0) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; readers.add(g);
    box(0.14, 0.22, 0.05, 0, 0, 0, M("casing", "plastic"), g, 0.02);
    const lm = new THREE.MeshStandardMaterial({ color: cOff.clone(), emissive: cOff.clone(), emissiveIntensity: 0.2 });
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.02), lm); l.position.set(0, 0.07, 0.03); g.add(l);
    return lm;
  };
  box(0.08, 1.0, 0.08, xGate + GW / 2 + 0.35, 0.5, fz1 + 0.25, postM, readers);
  const rdr = {
    gate: readerAt(xGate + GW / 2 + 0.35, 1.05, fz1 + 0.3),
    ent: readerAt(xEnt + 0.62, F + 0.45, bz1 + WT / 2 + 0.03),
    hall: readerAt(xHall + 0.58, F + 0.4, hz1 + WT / 2 + 0.03),
    cage: readerAt(xCage + 0.5, F + 0.9, cz1 + 0.04),
    rack: readerAt(xRack + 0.33, F + 0.7, zRack + 0.32),
  };

  // ------------------------------------------------------------------ outlines: each layer's zone on the floor, lit when that layer is
  const zones = [FEN, BLD, [xm - 0.55, xm + 0.55, zB - 0.12, zA + 0.12], HAL, CAG, [xRack - 0.38, xRack + 0.38, zRack - 0.38, zRack + 0.38]];
  const zoneM = zones.map(() => new THREE.MeshBasicMaterial({ color: cUi.clone(), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  zones.forEach(([a, b, c, d], i) => {
    const y = i === 0 ? 0.012 : F + 0.02 + i * 0.002, t = 0.09, inset = i < 2 ? 0.2 : 0.12, m = zoneM[i];
    const [x0, x1, z0, z1] = [a + inset, b - inset, c + inset, d - inset];
    for (const [w, dd, x, z] of [[x1 - x0, t, (x0 + x1) / 2, z0], [x1 - x0, t, (x0 + x1) / 2, z1], [t, z1 - z0, x0, (z0 + z1) / 2], [t, z1 - z0, x1, (z0 + z1) / 2]]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(w, 0.01, dd), m); s.position.set(x, y, z); s.renderOrder = 2; outlines.add(s);
    }
  });
  const layerMats = [fenceMats, [bldM], [], [halM], cageMats, []];

  // ------------------------------------------------------------------ labels (opts.labels in layer order), at each layer's front-left corner
  const plateAt = [[fx0 + 0.3, FH + 0.55, fz1], [bx0 + 0.3, WH + 0.55, bz1], [xm - 0.75, 1.75, zA + 0.1], [hx0 + 0.3, HH + 0.55, hz1], [cx0 + 0.3, CH + 0.5, cz1], [xRack, 1.75, zRack + 0.1]];
  const plates = plateAt.map(([x, y, z], i) => {
    if (!labs[i]) return null;
    const mk = (bg, role) => { const l = K.label(ctx, THREE, labs[i], { h: 0.46, bg, role }); l.rotation.y = Math.PI / 4; l.position.set(x, y, z); labels.add(l); return l; };
    return { idle: mk(dark ? "casing" : "paper", "text"), lit: mk("ui", "onAccent"), ok: mk("ok", "onAccent"), bad: mk("bad", "onAccent") };
  });

  // ------------------------------------------------------------------ the marker and the intruder: pucks that travel the route
  const route = [[xGate, 5.7], [xGate, fz1], [xGate, 3.9], [xEnt, 3.9], [xEnt, bz1], [xEnt, 2.55], [xPass, 2.55], [xPass, zA], [xPass, SEC], [xPass, zB], [xPass, 1.05], [xHall, 1.05], [xHall, hz1], [xHall, 0.15], [xCage, 0.15], [xCage, cz1], [xCage, -1.45], [xRack, -1.45], [xRack, zRack + 0.45]];
  const cum = [0]; for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]));
  const LEN = cum[cum.length - 1];
  const at = (s) => { s = K.clamp(s, 0, LEN); let j = 1; while (j < cum.length - 1 && cum[j] < s) j++; const k = (s - cum[j - 1]) / Math.max(1e-6, cum[j] - cum[j - 1]); return [K.lerp(route[j - 1][0], route[j][0], k), K.lerp(route[j - 1][1], route[j][1], k)]; };
  const sOf = (i) => cum[i];
  const CP = { gate: sOf(1), ent: sOf(4), mA: sOf(7), mB: sOf(9), hall: sOf(12), cage: sOf(15), rack: LEN };
  const layerCP = [CP.gate, CP.ent, CP.mA, CP.hall, CP.cage, CP.rack];
  const puck = (role) => {
    const g = new THREE.Group(), m = M(role, "plastic", { emissive: K.col(ctx, role, opts), emissiveIntensity: 0.5 });
    g.add(K.mesh(THREE, new THREE.CylinderGeometry(0.22, 0.25, 0.09, 28), m)); const top = K.mesh(THREE, new THREE.SphereGeometry(0.12, 16, 12), m); top.position.y = 0.14; g.add(top);
    pivot.add(g); g.visible = false; return g;
  };
  const marker = puck("ui"), intruder = puck("bad");

  // ------------------------------------------------------------------ state
  const st = { path: 0, layer: -1, breach: 0 };
  const win = (s, sc, pre, post) => K.clamp((s - (sc - pre)) / 0.15) * (1 - K.clamp((s - (sc + post)) / 0.15));
  const setL = (m, c, glow) => { m.color.copy(c); m.emissive.copy(c); m.emissiveIntensity = glow; };
  const apply = () => {
    const s = st.path * LEN;
    // the intruder: forces layer BL and is stopped short of the next checkpoint
    // it appears just outside the failed layer (the layers before it are not its story) and stops short of the next
    const stop = layerCP[BL + 1] - 0.45, s0 = Math.max(0, layerCP[BL] - 1.3), si = K.lerp(s0, stop, st.breach), br = st.breach > 0.001;
    const forced = br && si > layerCP[BL] - 0.5, held = br && si > stop - 0.05;
    const open = (sc, pre, post, b) => Math.max(win(s, sc, pre, post), forced && b === BL ? 1 : 0);
    gateLeaf.position.x = xGate + GW * 1.02 * K.easeInOut(open(CP.gate, 0.6, 0.3, 0));
    entDoor.rotation.y = 1.3 * K.easeInOut(open(CP.ent, 0.5, 0.25, 1));
    mt.set("tap", K.clamp((s - (CP.mA - 0.55)) / 0.15)); mt.set("open", Math.max(win(s, CP.mA, 0.45, 0.12), forced && BL === 2 ? 1 : 0));
    mt.set("tap2", K.clamp((s - (CP.mB - 0.3)) / 0.15)); mt.set("open2", win(s, CP.mB, 0.18, 0.3));
    hallDoor.rotation.y = 1.3 * K.easeInOut(open(CP.hall, 0.5, 0.25, 3));
    cageDoor.rotation.y = 1.3 * K.easeInOut(open(CP.cage, 0.5, 0.25, 4));
    rack.set("door", K.clamp((s - (CP.rack - 0.25)) / 0.2));
    // readers: idle, then logged (ok) once the marker has passed; the forced one shows the alert role, the holding one refuses
    const rd = [["gate", CP.gate, 0], ["ent", CP.ent, 1], ["hall", CP.hall, 3], ["cage", CP.cage, 4], ["rack", CP.rack - 0.3, 5]];
    for (const [k, sc, li] of rd) {
      const logged = s >= sc - 0.5, isForced = forced && li === BL, refuses = held && li === BL + 1;
      setL(rdr[k], isForced || refuses ? cBad : logged ? cOk : cOff, isForced || refuses ? 1.4 : logged ? 1.0 : 0.15);
    }
    // the lit layer, and the breach colours (the failed layer in the alert role, the next one holding in the ok role)
    const li = Math.round(st.layer);
    zoneM.forEach((m, i) => {
      const lit = i === li, bad = forced && i === BL, hold = held && i === BL + 1;
      m.color.copy(bad ? cBad : hold ? cOk : cUi); m.opacity = bad || hold ? 0.95 : lit ? 0.9 : 0.12;
      for (const wm of layerMats[i]) { wm.emissive.copy(bad ? cBad : hold ? cOk : cUi); wm.emissiveIntensity = bad || hold ? 0.45 : lit ? 0.35 : 0; }
      const p = plates[i]; if (p) { p.bad.visible = bad; p.ok.visible = hold && !bad; p.lit.visible = lit && !bad && !hold; p.idle.visible = !p.lit.visible && !p.ok.visible && !bad; }
    });
    // the tokens
    marker.visible = st.path > 0.001; if (marker.visible) { const [x, z] = at(s); marker.position.set(x, F + 0.04, z); }
    intruder.visible = br; if (br) { const [x, z] = at(si); intruder.position.set(x + 0.12, F + 0.04, z + 0.12); }
  };
  apply();
  return {
    group, size: [10.8, 2.2, 9.6],
    parts: { ground, fence, gate, building, mantrap, hall, cage, rack: rackG, readers, outlines, marker, intruder, labels },
    keys: ["path", "layer", "breach", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "layer") { st.layer = v == null ? -1 : Number(v); apply(); return; }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
