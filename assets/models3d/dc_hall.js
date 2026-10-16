// @model {"id": "dc_hall", "pack": "datacentre", "set": true, "what": "a data hall for an establishing shot or a fly-through: pairs of rack rows whose fronts face each other across cold aisles (perforated tiles in the cold aisles only on a raised floor), hot aisles behind, ladder cable trays and power busway over every row hung from a ceiling grid, linear lights over the cold aisles, perimeter cooling units on the end wall lined up with the hot aisles, and coolant distribution units on the back wall; walls cut away on the near sides", "parts": ["floor", "rows", "trays", "busway", "ceiling_grid", "lights", "cooling_units", "cdus", "walls"], "keys": {"lights": "0..1 the rows light in order from the front (+z) row: rack lights come on and the light over each cold aisle switches on", "focus": "the index of one row (0 is the front row) that stays bright while the rest dim; -1 for none", "dim": "0..1 how far the other rows dim while a row has focus (default 1)", "t": "seconds; rack lights flicker with activity and the CDUs' coolant moves (call every frame)", "turn": "radians about y"}, "best_for": ["what a data hall is: rows, aisles, trays, cooling", "an establishing shot or a camera travelling down a cold aisle (handle.dolly(u))", "pointing at one row in a hall (focus)", "scale: how many racks a hall holds"], "not_for": ["air paths and containment close up (use dc_aisle_pair)", "inside one rack (use server_rack)", "the site outside (a campus set)"], "size": [12.5, 3.8, 18.3], "sheet": {"opts": {"rows": 6, "racks": 8}, "mood": "machine_night", "elevation": 26, "turn": -0.5, "states": [{"key": "t", "from": 0, "to": 6, "at": 0, "dur": 6}, {"key": "lights", "from": 0, "to": 1, "at": 0.6, "dur": 1.8}, {"key": "focus", "before": -1, "value": 3, "at": 3.0}, {"key": "dim", "from": 0, "to": 1, "at": 3.0, "dur": 0.8}]}}
// The racks here are simplified (one instanced box per row with drawn fronts and backs) so a whole hall renders fast;
// close-ups use dc_aisle_pair or server_rack. Rows pair up: rows 2p and 2p+1 face each other across cold aisle p.
// A dolly: handle.dolly(u) returns {eye, look} ([x, y, z] in the set's own space, before any turn or scale) that travel
// down the middle cold aisle from beyond its open +x end, at eye height. opts: rows (2..8, even), racks (4..14 per row),
// floor "raised" (default, perforated tiles in the cold aisles) | "slab"; cdus (0..3, default 2). No words.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const R = Math.max(2, Math.min(8, Math.round((opts.rows || 6) / 2) * 2)), C = Math.max(4, Math.min(14, opts.racks || 8));
  const raised = opts.floor !== "slab", NCDU = Math.max(0, Math.min(3, opts.cdus == null ? 2 : opts.cdus));
  const RW = 1.0, RD = 0.95, RH = 2.3, CA = 2.0, HA = 1.6, FH = raised ? 0.3 : 0.05, WALL = 3.7, GY = 3.45;
  const P = R / 2, PP = CA + 2 * RD + HA;                         // pairs and their pitch
  const UD = 0.9, GX = 1.2, ENDX = 1.6, BZ = 1.9, FZ1 = 1.7;      // cooling unit depth, gap, +x walkway, back strip, front margin
  const X0 = -(UD + GX + C + ENDX) / 2, xs = X0 + UD + GX, xe = xs + C;
  const span = P * (CA + 2 * RD) + (P - 1) * HA;
  const Z0 = -(BZ + span + HA + FZ1) / 2, zRows0 = Z0 + BZ + HA;   // the back wall and the back of the last row
  const Z1 = Z0 + BZ + HA + span + FZ1, X1 = xe + ENDX;
  const FX = X1 - X0, FZ = Z1 - Z0;
  const dark = K.role(ctx, "screen", opts) === "field";
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const M = (role, kind, extra) => K.mat(ctx, THREE, role, kind, opts, extra);
  const box = (w, h, d, x, y, z, m, parent, r = 0) => { const o = K.mesh(THREE, r > 0 ? K.rbox(THREE, X, w, h, d, r, 2) : new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
  const inst = (geo, m, mats, parent) => { const im = new THREE.InstancedMesh(geo, m, mats.length); mats.forEach((mm, i) => im.setMatrixAt(i, mm)); parent.add(im); return im; };
  const T4 = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(sx, sy, sz));
  const hash = (i, j = 0) => (((i * 7919 + j * 104729 + 13) % 101) / 101);
  const MASK0 = "#" + ctx.neutral(0).getHexString(), MASK1 = "#" + ctx.neutral(1).getHexString();   // emissive masks, not colours

  // rows: z of each row's centre and the way its front faces (front row first: index 0 is nearest +z)
  const rowsZ = [];
  for (let p = 0; p < P; p++) {
    const zc = zRows0 + p * PP + RD + CA / 2;                     // cold aisle p's centre
    rowsZ.push({ z: zc - CA / 2 - RD / 2, face: 1, aisle: p }, { z: zc + CA / 2 + RD / 2, face: -1, aisle: p });
  }
  rowsZ.sort((a, b) => b.z - a.z);
  const aisles = []; for (let p = 0; p < P; p++) aisles.push(zRows0 + p * PP + RD + CA / 2);
  const hotZ = []; for (let p = 0; p <= P; p++) hotZ.push(zRows0 + p * PP - HA / 2);

  // ------------------------------------------------------------------ floor (tile grid; perforated tiles in cold aisles only)
  const floor = new THREE.Group(); pivot.add(floor);
  const PXU = 48, ff = K.face(ctx, THREE, Math.round(FX * PXU), Math.round(FZ * PXU));
  ff.draw((g, w, h) => {
    const px = (x) => (x - X0) * PXU, pz = (z) => (z - Z0) * PXU;
    g.fillStyle = K.hexOf(ctx, dark ? "casing2" : "paper", opts); g.fillRect(0, 0, w, h);
    g.strokeStyle = K.hexOf(ctx, dark ? "casing" : "paper2", opts); g.lineWidth = 2;
    for (let x = xs - Math.floor(xs - X0); x <= X1; x += 1) { g.beginPath(); g.moveTo(px(x), 0); g.lineTo(px(x), h); g.stroke(); }
    for (const zc of aisles) for (let z = zc - Math.floor(zc - Z0); z <= Z1; z += 1) { g.beginPath(); g.moveTo(0, pz(z)); g.lineTo(w, pz(z)); g.stroke(); }
    if (!raised) return;
    for (const zc of aisles) for (let i = 0; i < C; i++) for (const z0 of [zc - 1, zc]) {
      g.fillStyle = K.hexOf(ctx, dark ? "casing" : "paper2", opts); g.fillRect(px(xs + i) + 2, pz(z0) + 2, PXU - 4, PXU - 4);
      g.fillStyle = K.hexOf(ctx, "shadow", opts);
      for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) { g.beginPath(); g.arc(px(xs + i) + 7 + a * 7, pz(z0) + 7 + b * 7, 1.5, 0, Math.PI * 2); g.fill(); }
    }
  });
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(FX, FZ), new THREE.MeshStandardMaterial({ map: ff.tex, roughness: 0.8 }));
  deck.rotation.x = -Math.PI / 2; deck.position.set((X0 + X1) / 2, FH + 0.002, (Z0 + Z1) / 2); floor.add(deck);
  box(FX, FH, FZ, (X0 + X1) / 2, FH / 2, (Z0 + Z1) / 2, M(dark ? "casing" : "paper2", "matte"), floor);

  // ------------------------------------------------------------------ walls: the far two (-x and -z), cut away on the near sides
  const walls = new THREE.Group(); pivot.add(walls);
  const wallM = M(dark ? "surface" : "paper", "matte", { roughness: 0.95 });
  box(0.15, WALL, FZ, X0 - 0.075, WALL / 2, (Z0 + Z1) / 2, wallM, walls);
  box(FX + 0.15, WALL, 0.15, (X0 + X1) / 2 - 0.075, WALL / 2, Z0 - 0.075, wallM, walls);

  // ------------------------------------------------------------------ racks: one instanced box per row with drawn faces
  const rf = K.face(ctx, THREE, 128, 296), re = K.face(ctx, THREE, 128, 296), rb = K.face(ctx, THREE, 128, 296);
  const NU = 12, uy = (i, h) => h * (0.06 + 0.86 * (i + 0.5) / NU);
  rf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "casing", opts); g.fillRect(0, 0, w, h);
    for (let i = 0; i < NU; i++) {
      if (i === 4 || i === 9) continue;                          // empty units, blanked
      const y = uy(i, h);
      g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(10, y - 9, w - 20, 18);
      g.fillStyle = K.hexOf(ctx, "casing", opts); for (let k = 0; k < 9; k++) g.fillRect(16 + k * 8, y - 6, 4, 12);
    }
    g.fillStyle = K.hexOf(ctx, "shadow", opts); g.globalAlpha = 0.35;
    for (let y = 6; y < h; y += 6) for (let x = 6 + (y % 12 ? 3 : 0); x < w; x += 6) g.fillRect(x, y, 2, 2);   // the door's perforation
    g.globalAlpha = 1; g.strokeStyle = K.hexOf(ctx, "casing", opts); g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  });
  re.draw((g, w, h) => {
    g.fillStyle = MASK0; g.fillRect(0, 0, w, h); g.fillStyle = MASK1;
    for (let i = 0; i < NU; i++) { if (i === 4 || i === 9) continue; g.fillRect(w - 30, uy(i, h) - 4, 11, 8); if ((i * 5) % 3 === 0) g.fillRect(16, uy(i, h) - 4, 11, 8); }
  });
  rb.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "shadow", opts); g.globalAlpha = 0.5; g.fillRect(14, 8, w - 28, h - 16); g.globalAlpha = 1;
    g.fillStyle = K.hexOf(ctx, "ui", opts); g.fillRect(7, 20, 5, h - 40);
    g.fillStyle = K.hexOf(ctx, "warm", opts); g.fillRect(w - 12, 20, 5, h - 40);
    g.fillStyle = K.hexOf(ctx, "trim", opts); for (let k = 0; k < 6; k++) g.fillRect(36 + k * 9, 14, 4, h - 28);
  });
  re.tex.colorSpace = THREE.NoColorSpace;
  const rackGeo = new THREE.BoxGeometry(RW - 0.03, RH, RD);
  const okC = K.col(ctx, "ok", opts);
  const rows = new THREE.Group(); pivot.add(rows);
  const rowRec = rowsZ.map((r, ri) => {
    const side = M("casing", "plastic", { roughness: 0.55 });
    const front = new THREE.MeshStandardMaterial({ map: rf.tex, emissiveMap: re.tex, emissive: okC.clone(), emissiveIntensity: 0, roughness: 0.55, metalness: 0.2 });
    const back = new THREE.MeshStandardMaterial({ map: rb.tex, roughness: 0.6 });
    const mats = [side, side, side, side, front, back];
    const ms = []; for (let i = 0; i < C; i++) ms.push(T4(xs + i + 0.5, FH + RH / 2, r.z, r.face > 0 ? 0 : Math.PI));
    const im = inst(rackGeo, mats, ms, rows);
    for (const m of [side, front, back]) m.userData.base = m.color.clone();
    return { ...r, ri, im, mats: [side, front, back], front };
  });

  // ------------------------------------------------------------------ overhead: ceiling grid, trays and busway over every row
  const ceiling_grid = new THREE.Group(), trays = new THREE.Group(), busway = new THREE.Group(), lights = new THREE.Group();
  pivot.add(ceiling_grid, trays, busway, lights);
  const strutM = M("metal", "metal", { roughness: 0.5 });
  const top = FH + RH, yT = top + 0.55, yB = top + 0.3;
  const rods = [], rungs = [];
  for (const r of rowRec) {
    const zt = r.z + r.face * 0.12, zb = r.z - r.face * 0.33;
    box(C + 0.4, 0.06, 0.02, (xs + xe) / 2, yT, zt - 0.2, strutM, trays); box(C + 0.4, 0.06, 0.02, (xs + xe) / 2, yT, zt + 0.2, strutM, trays);
    for (let x = xs - 0.1; x < xe + 0.2; x += 0.3) rungs.push(T4(x, yT - 0.025, zt));
    box(C + 0.2, 0.04, 0.26, (xs + xe) / 2, yT - 0.005, zt, M("trim", "plastic"), trays);
    box(C + 0.2, 0.12, 0.12, (xs + xe) / 2, yB, zb, M("metal", "plastic", { roughness: 0.5 }), busway);
    for (let i = 0; i < C; i += 2) box(0.18, 0.16, 0.14, xs + i + 0.5, yB - 0.13, zb, M("warm", "plastic"), busway);
    for (let x = xs; x <= xe + 0.1; x += C / Math.ceil(C / 3)) { rods.push(T4(x, (yT + WALL) / 2, zt, 0, 1, WALL - yT, 1)); rods.push(T4(x, (yB + WALL) / 2, zb, 0, 1, WALL - yB, 1)); }
  }
  inst(new THREE.BoxGeometry(0.035, 0.012, 0.42), strutM, rungs, trays);
  inst(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), strutM, rods, ceiling_grid);
  // a linear light over each cold aisle (emissive in the neutral light colour, a light not a design colour)
  const lampM = aisles.map(() => new THREE.MeshStandardMaterial({ color: K.col(ctx, "paper", opts), emissive: ctx.neutral(), emissiveIntensity: 0, roughness: 0.4 }));
  aisles.forEach((zc, p) => {
    box(C - 0.6, 0.05, 0.16, (xs + xe) / 2, GY - 0.32, zc, lampM[p], lights);
    for (const x of [xs + 1, xe - 1]) box(0.015, WALL - GY + 0.32, 0.015, x, (WALL + GY - 0.32) / 2, zc, strutM, lights);
  });

  // ------------------------------------------------------------------ perimeter cooling units on the -x wall, one per hot aisle
  const cooling_units = new THREE.Group(); pivot.add(cooling_units);
  const grf = K.face(ctx, THREE, 128, 128);
  grf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "shadow", opts); for (let i = 0; i < 9; i++) { K.rr(g, 6, 6 + i * 13.5, w - 12, 7, 2); g.fill(); } });
  const unitM = M("paper2", "plastic", { roughness: 0.55 }), grM = new THREE.MeshStandardMaterial({ map: grf.tex, roughness: 0.7 });
  const ledM = new THREE.MeshStandardMaterial({ color: okC, emissive: okC, emissiveIntensity: 0.9 });
  for (const z of hotZ) {
    if (z - 0.75 < Z0 + 0.1) continue;
    box(UD, 2.4, 1.4, X0 + UD / 2, FH + 1.2, z, unitM, cooling_units, 0.03);
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.8), grM); gr.rotation.y = Math.PI / 2; gr.position.set(X0 + UD + 0.004, FH + 1.85, z); cooling_units.add(gr);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), ledM); l.position.set(X0 + UD + 0.01, FH + 1.1, z + 0.4); cooling_units.add(l);
  }

  // ------------------------------------------------------------------ coolant distribution units on the back wall (the library's cdu)
  const cdus = new THREE.Group(); pivot.add(cdus);
  const cduH = [];
  for (let i = 0; i < NCDU; i++) {
    const c = await X.model("cdu", { colors: opts.colors });
    const s = 2.2 / c.size[1]; c.group.scale.setScalar(s);
    c.group.position.set(xs + 1.2 + i * 2.2, FH, Z0 + 0.15 + c.size[2] * s / 2); cdus.add(c.group); cduH.push(c);
    c.set("primary", 1); c.set("secondary", 1); c.set("heat", 1);   // a working hall: both loops run
  }
  // their pipes: supply and return rise to a header along the back wall at the grid's height
  if (NCDU) {
    const pipeS = M("cool", "plastic"), pipeR = M("warm", "plastic");
    const cyl = (r, h, x, y, z, m, axis) => { const o = K.mesh(THREE, new THREE.CylinderGeometry(r, r, h, 14), m); if (axis === "x") o.rotation.z = Math.PI / 2; o.position.set(x, y, z); cdus.add(o); return o; };
    for (const [j, m] of [[0, pipeS], [1, pipeR]]) {
      const z = Z0 + 0.2 + j * 0.22, y = GY - 0.12 - j * 0.2;
      cyl(0.06, xe - xs, (xs + xe) / 2, y, z, m, "x");
      for (let i = 0; i < NCDU; i++) cyl(0.05, y - (FH + 2.35), xs + 1.2 + i * 2.2 + (j ? 0.25 : -0.25), (y + FH + 2.35) / 2, z, m);
    }
  }

  // the focus pad: a soft strip in the accent on the floor in front of the focused row (signalling only, no words)
  const padM = new THREE.MeshBasicMaterial({ color: K.col(ctx, "ui", opts), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(C + 0.2, 0.7), padM); pad.rotation.x = -Math.PI / 2; pad.visible = false; pivot.add(pad);

  // ------------------------------------------------------------------ state
  const st = { lights: opts.lights == null ? 0 : K.clamp(opts.lights), focus: opts.focus == null ? -1 : opts.focus, dim: opts.dim == null ? 1 : K.clamp(opts.dim), t: 0 };
  const shadowC = K.col(ctx, "shadow", opts), fieldC = ctx.c("field");
  const apply = () => {
    const fi = Math.round(st.focus), hasF = fi >= 0 && fi < R;
    rowRec.forEach((r) => {
      const k = K.clamp(st.lights * R - r.ri);                  // this row's own switch-on, front row first
      const fd = hasF && r.ri !== fi ? 1 - 0.78 * st.dim : 1;
      const unlit = 0.45 * (1 - k);
      for (const m of r.mats) m.color.copy(m.userData.base).lerp(shadowC, unlit).lerp(fieldC, 1 - fd);   // dimmed rows recede into the field
      const flick = 0.85 + 0.15 * Math.sin(st.t * 5.3 + r.ri * 1.7) * Math.sin(st.t * 2.1 + r.ri);
      r.front.emissiveIntensity = k * 2.4 * flick * (hasF && r.ri !== fi ? 1 - 0.85 * st.dim : 1);
    });
    pad.visible = hasF && st.dim > 0;
    if (hasF) { const r = rowRec[fi]; pad.position.set((xs + xe) / 2, FH + 0.008, r.z + r.face * (RD / 2 + 0.4)); padM.opacity = 0.4 * st.dim; }
    aisles.forEach((zc, p) => {
      const lit = Math.max(...rowRec.filter((r) => r.aisle === p).map((r) => K.clamp(st.lights * R - r.ri)));
      const inFocus = !hasF || rowRec[fi].aisle === p;
      lampM[p].emissiveIntensity = lit * 1.6 * (inFocus ? 1 : 1 - 0.7 * st.dim);
    });
    for (const c of cduH) c.set("t", st.t);
  };
  apply();
  const mid = aisles[Math.floor((P - 1) / 2)];
  return {
    group, size: [FX + 0.15, WALL, FZ + 0.15],
    parts: { floor, rows, trays, busway, ceiling_grid, lights, cooling_units, cdus, walls },
    keys: ["lights", "focus", "dim", "t", "turn"],
    // a camera path down the middle cold aisle, from beyond its open end (u 0) to the cooling wall (u 1)
    dolly(u) { const k = K.clamp(u), x = K.lerp(X1 + 1.5, xs + 0.8, k); return { eye: [x, FH + 1.6, mid], look: [x - 4, FH + 1.2, mid] }; },
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "t") { st.t = Number(v) || 0; apply(); return; }
      if (key === "focus") { st.focus = v == null ? -1 : Number(v); apply(); return; }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
