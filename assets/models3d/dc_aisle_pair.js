// @model {"id": "dc_aisle_pair", "pack": "datacentre", "set": true, "what": "a hot and cold aisle pair: two rows of server racks (the library's server_rack) whose fronts face each other across a cold aisle, with a hot aisle behind each row, cooling units at the row ends, ladder cable trays on the rack tops, and supply from a raised floor with perforated tiles in the cold aisle only, from an overhead duct, or from a fan wall; cold or hot aisle containment", "parts": ["rows", "floor", "tiles", "cooling_units", "containment", "cable_trays", "supply", "return_path", "mixing", "thermal"], "keys": {"airflow": "0..1 cool air leaves the cooling units, enters the cold aisle (up through the perforated tiles, down from the duct, or across from the fan wall), passes through the racks front to back, and the warm exhaust travels back along the hot aisle to the cooling units", "containment": "0..1 the contained aisle closes: roof panels drop in, then the end doors slide shut (opts.mode cold: the cold aisle; hot: each hot aisle, which then runs straight into its cooling unit); a closed containment stops the mixing", "mixing": "0..1 the mistake: no blanking panels, warm exhaust spills over the rack tops, through the open gaps and round the row ends into the rack fronts (scaled down as the containment closes)", "thermal": "0..1 a temperature view: the aisles fill with a cool to warm volume (the cold aisle warms at the top while there is mixing)", "t": "seconds; moves every air particle and is forwarded to the racks (call every frame with the scene time)", "turn": "radians about y"}, "best_for": ["hot and cold aisles: why rack fronts face each other", "containment (cold or hot) and what it stops", "raised floor and perforated tiles, overhead or wall supply", "recirculation and blanking panels", "data-centre cooling and efficiency"], "not_for": ["inside one rack (use server_rack)", "a whole hall establishing shot (use dc_hall)", "liquid cooling loops (use cdu)"], "size": [7.7, 3.4, 7.2], "sheet": {"opts": {"racks": 5, "mode": "cold", "supply": "floor", "labels": {"cold": "Cold aisle", "hot": "Hot aisle"}}, "mood": "cold_aisle", "elevation": 30, "turn": -0.6, "states": [{"key": "t", "from": 0, "to": 6, "at": 0, "dur": 6}, {"key": "airflow", "from": 0, "to": 1, "at": 0.6, "dur": 0.6}, {"key": "mixing", "from": 0, "to": 1, "at": 1.8, "dur": 0.5}, {"key": "containment", "from": 0, "to": 1, "at": 2.9, "dur": 1.1}, {"key": "thermal", "from": 0, "to": 1, "at": 4.7, "dur": 0.6}]}}
// Layout: the rows run along x; the cold aisle is centred on z = 0 with the -z row facing +z and the +z row facing -z
// (fronts face each other), so each row's back faces its own hot aisle. The cooling units stand at the -x end of the hot
// aisles (opts.supply floor | overhead) or as one fan wall across the -x end (opts.supply wall); return air always goes
// back to them. Perforated tiles exist only in the cold aisle (floor supply). Words: opts.labels {cold, hot} as floor
// plates, opts.pduLabels forwarded to the racks; nothing else. opts.racks (3..6 per row), opts.mode cold | hot.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const NR = Math.max(3, Math.min(6, opts.racks || 5));
  const mode = opts.mode === "hot" ? "hot" : "cold", supply = ["overhead", "wall"].includes(opts.supply) ? opts.supply : "floor";
  const RW = 1.0, RD = 0.95, RH = 2.3, CA = 2.0, HA = 1.6;           // rack (as server_rack), cold and hot aisle widths
  const FH = supply === "floor" ? 0.45 : 0.06;                      // raised floor deck or slab top
  const UD = 0.9, G = 0.8, END = 1.0;                               // cooling unit depth, gap to the row, margin past the row
  const xs = -(NR + END - G - UD) / 2, xe = xs + NR * RW;           // the rows' ends
  const xu = xs - G - UD / 2, xuF = xs - G;                         // cooling unit centre and its face (+x)
  const zr = CA / 2 + RD / 2, zIn = CA / 2 + RD, zOut = zIn + HA, zH = zIn + HA / 2;
  const X0 = xu - UD / 2 - 0.05, X1 = xe + END, Z0 = -zOut - 0.05, Z1 = zOut + 0.05;
  const FX = X1 - X0, FZ = Z1 - Z0, cx = (X0 + X1) / 2;
  const top = FH + RH;
  const dark = K.role(ctx, "screen", opts) === "field";
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const M = (role, kind, extra) => K.mat(ctx, THREE, role, kind, opts, extra);
  const box = (w, h, d, x, y, z, m, parent, r = 0.012) => { const o = K.mesh(THREE, r > 0 ? K.rbox(THREE, X, w, h, d, r, 2) : new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
  const hash = (i, j = 0) => (((i * 7919 + j * 104729 + 13) % 101) / 101);

  // ------------------------------------------------------------------ floor: a raised deck on pedestals, or a slab
  const floor = new THREE.Group(); pivot.add(floor);
  const PXU = 96, ff = K.face(ctx, THREE, Math.round(FX * PXU), Math.round(FZ * PXU));
  const perf = (x0, z0, x1, z1) => x0 >= xs - 1e-6 && x1 <= xe + 1e-6 && z0 >= -CA / 2 - 1e-6 && z1 <= CA / 2 + 1e-6;
  ff.draw((g, w, h) => {
    const px = (x) => (x - X0) * PXU, pz = (z) => (z - Z0) * PXU;
    g.fillStyle = K.hexOf(ctx, dark ? "casing2" : "paper", opts); g.fillRect(0, 0, w, h);
    // one tile per rack width; tile lines aligned with the racks
    g.strokeStyle = K.hexOf(ctx, dark ? "casing" : "paper2", opts); g.lineWidth = 3;
    for (let x = xs - Math.ceil(xs - X0); x <= X1; x += 1) { g.beginPath(); g.moveTo(px(x), 0); g.lineTo(px(x), h); g.stroke(); }
    for (let z = -Math.ceil(-Z0); z <= Z1; z += 1) { g.beginPath(); g.moveTo(0, pz(z)); g.lineTo(w, pz(z)); g.stroke(); }
    if (supply !== "floor") return;
    // perforated tiles: the cold aisle only (never the hot aisle)
    for (let i = 0; i < NR; i++) for (const z0 of [-1, 0]) {
      const x0 = xs + i, x1 = x0 + 1, z1 = z0 + 1;
      if (!perf(x0, z0, x1, z1)) continue;
      g.fillStyle = K.hexOf(ctx, dark ? "casing" : "paper2", opts); g.fillRect(px(x0) + 4, pz(z0) + 4, PXU - 8, PXU - 8);
      g.fillStyle = K.hexOf(ctx, "shadow", opts);
      for (let a = 0; a < 9; a++) for (let b = 0; b < 9; b++) { g.beginPath(); g.arc(px(x0) + 12 + a * 9, pz(z0) + 12 + b * 9, 2.6, 0, Math.PI * 2); g.fill(); }
    }
  });
  const deckM = new THREE.MeshStandardMaterial({ map: ff.tex, roughness: 0.8, metalness: 0.05 });
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(FX, FZ), deckM); deck.rotation.x = -Math.PI / 2; deck.position.set(cx, FH + 0.002, 0); deck.receiveShadow = true; floor.add(deck);
  const edgeM = M(dark ? "casing" : "paper2", "matte");
  if (supply === "floor") {
    box(FX, 0.05, FZ, cx, FH - 0.025, 0, edgeM, floor, 0);                       // the deck plate
    box(FX, 0.04, FZ, cx, 0.02, 0, M(dark ? "casing" : "paper2", "matte"), floor, 0);   // the slab under the plenum
    const nx = Math.floor(FX) + 1, nz = Math.floor(FZ) + 1;
    const ped = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.05, FH - 0.09, 10), M("metal", "metal"), nx * nz);
    const mm = new THREE.Matrix4(); let k = 0;
    for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { mm.makeTranslation(X0 + 0.05 + a * (FX - 0.1) / (nx - 1), 0.04 + (FH - 0.09) / 2, Z0 + 0.05 + b * (FZ - 0.1) / (nz - 1)); ped.setMatrixAt(k++, mm); }
    floor.add(ped);
  } else {
    box(FX, FH, FZ, cx, FH / 2 - 0.001, 0, edgeM, floor, 0);
  }
  const tiles = deck;

  // ------------------------------------------------------------------ the two rows of racks (fronts face the cold aisle)
  const rows = new THREE.Group(); pivot.add(rows);
  const racks = [];
  for (const side of [-1, 1]) for (let i = 0; i < NR; i++) {
    const k = racks.length;
    const r = await X.model("server_rack", { units: 8, empty: [2 + ((k * 3) % 5)], load: 1, blanking: 1, pduLabels: opts.pduLabels, colors: opts.colors });
    r.group.position.set(xs + i + 0.5, FH, side * zr);
    r.group.rotation.y = side < 0 ? 0 : Math.PI;                    // the -z row faces +z, the +z row faces -z
    rows.add(r.group); racks.push(r);
  }

  // ------------------------------------------------------------------ cable trays: ladder trays on brackets on the rack tops
  const cable_trays = new THREE.Group(); pivot.add(cable_trays);
  const trayM = M("metal", "metal", { roughness: 0.45 }), cabM = M("trim", "plastic"), cabM2 = M("ui2", "plastic");
  for (const side of [-1, 1]) {
    const z = side * (zIn - 0.3), y = top + 0.32, L = NR + 0.2, x = (xs + xe) / 2;
    for (const dz of [-0.16, 0.16]) box(L, 0.07, 0.02, x, y, z + dz, trayM, cable_trays, 0);
    const rung = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.02, 0.32), trayM, Math.round(L / 0.25));
    const mm = new THREE.Matrix4(); for (let i = 0; i < rung.count; i++) { mm.makeTranslation(xs - 0.1 + 0.12 + i * 0.25, y - 0.03, z); rung.setMatrixAt(i, mm); }
    cable_trays.add(rung);
    for (let i = 0; i <= NR; i += 1) { const bx = Math.min(xe - 0.15, Math.max(xs + 0.15, xs + i)); box(0.04, 0.3, 0.04, bx, top + 0.15, z, trayM, cable_trays, 0); }
    box(L - 0.1, 0.06, 0.12, x, y - 0.0, z - 0.06, cabM, cable_trays, 0.02);
    box(L - 0.1, 0.04, 0.06, x, y - 0.01, z + 0.08, cabM2, cable_trays, 0.02);
  }

  // ------------------------------------------------------------------ cooling units
  const cooling_units = new THREE.Group(); pivot.add(cooling_units);
  const unitM = M(dark ? "paper2" : "paper2", "plastic", { roughness: 0.55 });
  const grf = K.face(ctx, THREE, 256, 256);
  grf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "shadow", opts);
    for (let i = 0; i < 14; i++) { K.rr(g, 10, 10 + i * 17.5, w - 20, 9, 3); g.fill(); }
  });
  const grilleM = new THREE.MeshStandardMaterial({ map: grf.tex, roughness: 0.7 });
  const scf = K.face(ctx, THREE, 240, 160);
  scf.draw((g, w, h) => K.drawUI(ctx, opts.screen || { kind: "blank" }, g, w, h, opts), JSON.stringify(opts.screen || {}));
  const scrM = new THREE.MeshBasicMaterial({ map: scf.tex, toneMapped: false });
  const ledM = new THREE.MeshStandardMaterial({ color: K.col(ctx, "ok", opts), emissive: K.col(ctx, "ok", opts), emissiveIntensity: 0.9 });
  const grille = (w, h, x, y, z, parent) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), grilleM); p.rotation.y = Math.PI / 2; p.position.set(x, y, z); parent.add(p); return p; };
  const UH = 2.4;
  const units = [];
  if (supply === "wall") {
    // a fan wall across the -x end: supply fans facing the cold aisle low down, return grilles above the hot aisles
    const WH = RH + 0.75, wz = FZ - 0.1;
    box(UD, WH, wz, xu, FH + WH / 2, 0, unitM, cooling_units, 0.02);
    const fanf = K.face(ctx, THREE, 256, 256);
    fanf.draw((g, w, h) => {
      g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h);
      for (const [ax, ay] of [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]]) {
        g.fillStyle = K.hexOf(ctx, "shadow", opts); g.beginPath(); g.arc(ax * w, ay * h, w * 0.21, 0, Math.PI * 2); g.fill();
        g.strokeStyle = K.hexOf(ctx, "metal", opts); g.lineWidth = 4;
        for (let r = 1; r <= 3; r++) { g.beginPath(); g.arc(ax * w, ay * h, w * 0.07 * r, 0, Math.PI * 2); g.stroke(); }
      }
    });
    const fanM = new THREE.MeshStandardMaterial({ map: fanf.tex, roughness: 0.7 });
    for (const z of [-0.5, 0.5]) for (const y of [0.55, 1.6]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), fanM); p.rotation.y = Math.PI / 2; p.position.set(xuF + 0.004, FH + y, z); cooling_units.add(p); }
    for (const s of [-1, 1]) grille(HA - 0.2, 0.9, xuF + 0.004, top - 0.05, s * zH, cooling_units);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.28), scrM); sc.rotation.y = Math.PI / 2; sc.position.set(xuF + 0.004, FH + 1.6, -1.45); cooling_units.add(sc);
    units.push({ x: xu, z: 0 });
  } else {
    for (const s of [-1, 1]) {
      const z = s * zH;
      box(UD, UH, HA - 0.04, xu, FH + UH / 2, z, unitM, cooling_units, 0.03);
      grille(HA - 0.3, 0.85, xuF + 0.004, FH + UH - 0.55, z, cooling_units);                 // the return grille faces the hot aisle
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.24), scrM); sc.rotation.y = Math.PI / 2; sc.position.set(xuF + 0.004, FH + 1.15, z - s * 0.3); cooling_units.add(sc);
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), ledM); led.position.set(xuF + 0.01, FH + 1.15, z + s * 0.1); cooling_units.add(led);
      if (supply === "floor") box(UD - 0.1, 0.06, HA - 0.2, xu, FH - 0.02, z, M("shadow", "matte"), cooling_units, 0);   // discharge into the plenum
      units.push({ x: xu, z });
    }
  }

  // ------------------------------------------------------------------ overhead supply duct (opts.supply overhead)
  const supplyG = new THREE.Group(); pivot.add(supplyG);
  const yD = top + 0.85;
  if (supply === "overhead") {
    const dM = M("metal", "matte", { roughness: 0.6, metalness: 0.3 });
    for (const s of [-1, 1]) {
      box(0.5, yD - (FH + UH), 0.5, xu, (yD + FH + UH) / 2, s * zH, dM, supplyG, 0.01);
      box(0.5, 0.4, zH + 0.25, xu, yD, s * zH / 2, dM, supplyG, 0.01);
    }
    box(xe - 0.2 - (xu - 0.25), 0.4, 0.5, (xe - 0.2 + xu - 0.25) / 2, yD, 0, dM, supplyG, 0.01);
    for (let i = 0; i < NR; i++) box(0.4, 0.04, 0.4, xs + i + 0.5, yD - 0.22, 0, grilleM, supplyG, 0);
  }

  // ------------------------------------------------------------------ containment (cold aisle or each hot aisle)
  const containment = new THREE.Group(); pivot.add(containment);
  const glassM = M(mode === "cold" ? "cool" : "warm", "glass", { opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const frameM = M("metal", "metal", { roughness: 0.4 });
  const roofs = [], doors = [];
  const panel = (w, h, d, x, y, z, order) => {
    const g = new THREE.Group(); g.position.set(x, y, z);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassM));
    const fw = 0.035, ed = [];
    if (h < 0.1) { ed.push([w, fw, fw, 0, 0, -d / 2], [w, fw, fw, 0, 0, d / 2], [fw, fw, d, -w / 2, 0, 0], [fw, fw, d, w / 2, 0, 0]); }
    else { ed.push([w, fw, fw, 0, h / 2, 0], [w, fw, fw, 0, -h / 2, 0], [fw, h, fw, -w / 2, 0, 0], [fw, h, fw, w / 2, 0, 0]); }
    for (const [a, b, c, ex, ey, ez] of ed) { const e = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), frameM); e.position.set(ex, ey, ez); g.add(e); }
    g.userData.home = [x, y, z]; g.userData.order = order; containment.add(g); return g;
  };
  // a sliding door of two leaves across an aisle end (x fixed), z from za to zb
  // opens: where each leaf's centre parks when open (over a row end, never out into the room)
  const door = (x, za, zb, opens) => {
    const w = (zb - za) / 2, d = new THREE.Group(); containment.add(d);
    const lo = Math.min(za, ...opens.map((o) => o - w / 2)), hi = Math.max(zb, ...opens.map((o) => o + w / 2));
    const hdr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, hi - lo), frameM); hdr.position.set(x, top - 0.04, (lo + hi) / 2); d.add(hdr);
    const leaves = [0, 1].map((j) => {
      const l = new THREE.Group(); d.add(l);
      const gl = new THREE.Mesh(new THREE.BoxGeometry(0.02, RH - 0.14, w - 0.02), glassM); gl.position.y = FH + (RH - 0.14) / 2 + 0.02; l.add(gl);
      for (const [a, b, c, ey, ez] of [[0.04, RH - 0.14, 0.04, FH + (RH - 0.14) / 2 + 0.02, -w / 2 + 0.02], [0.04, RH - 0.14, 0.04, FH + (RH - 0.14) / 2 + 0.02, w / 2 - 0.02], [0.04, 0.04, w, FH + 0.04, 0]]) { const e = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), frameM); e.position.set(0, ey, ez); l.add(e); }
      l.userData.closed = za + w / 2 + j * w; l.userData.open = opens[j]; l.position.x = x + (j ? 0.03 : -0.03);
      return l;
    });
    doors.push({ d, leaves });
  };
  if (mode === "cold") {
    const xa = supply === "wall" ? xuF : xs;
    const segs = Math.round(xe - xa);
    for (let i = 0; i < segs; i++) { const sx = (xe - xa) / segs; roofs.push(panel(sx, 0.02, CA + 0.1, xe - (i + 0.5) * sx, top + 0.02, 0, i / segs)); }
    if (supply === "wall") for (const s of [-1, 1]) roofs.push(panel(G, RH, 0.02, xs - G / 2, FH + RH / 2, s * CA / 2, 0.9));
    const op = [-CA / 2 - CA / 4 + 0.08, CA / 2 + CA / 4 - 0.08];          // each leaf parks over its row's end rack
    door(xe + 0.05, -CA / 2, CA / 2, op);
    if (supply !== "wall") door(xs - 0.05, -CA / 2, CA / 2, op);
  } else {
    for (const s of [-1, 1]) {
      const segs = Math.round(xe - xuF);
      for (let i = 0; i < segs; i++) { const sx = (xe - xuF) / segs; roofs.push(panel(sx, 0.02, HA + 0.1, xe - (i + 0.5) * sx, top + 0.02, s * zH, i / segs)); }
      roofs.push(panel(xe - xuF, RH, 0.02, (xe + xuF) / 2, FH + RH / 2, s * (zOut - 0.01), 0.5));       // the outer partition
      roofs.push(panel(G, RH, 0.02, xs - G / 2, FH + RH / 2, s * zIn, 0.9));                          // beside the row's end
      const w = HA / 2, park = s * (zIn - w / 2 + 0.04);                   // both leaves park over the row's end rack
      door(xe + 0.05, s > 0 ? zIn : -zOut, s > 0 ? zOut : -zIn, [park, park]);
    }
  }

  // ------------------------------------------------------------------ aisle labels (words only from opts.labels)
  const labs = opts.labels || {};
  const plate = (text, x, z) => {
    if (!text) return;
    const l = K.label(ctx, THREE, text, { h: 0.34, bg: dark ? "casing" : "paper", role: "text" });
    // flat on the floor, reading from the +x end (the view down the aisle)
    l.rotation.order = "YXZ"; l.rotation.set(-Math.PI / 2, Math.PI / 2, 0); l.position.set(x, FH + 0.012, z); pivot.add(l);
  };
  plate(labs.cold, xe - 0.6, 0);
  for (const s of [-1, 1]) plate(labs.hot, xe - 0.6, s * zH);

  // ------------------------------------------------------------------ air: supply, return, mixing (pure functions of t)
  const lanes = [];
  for (const s of [-1, 1]) for (let i = 0; i < NR; i++) lanes.push({ s, x: xs + i + 0.5, yh: 0.35 + 1.75 * hash(i, s + 3) });
  const front = (s) => s * (CA / 2 - 0.25);                         // just in front of a row's intake, inside the cold aisle
  const supPaths = lanes.map(({ s, x, yh }, j) => {
    const dx = (hash(j, 7) - 0.5) * 0.4, xx = x + dx, y = FH + yh, u = units[s < 0 ? 0 : units.length - 1];
    if (supply === "floor") {
      // the visible part: up through a perforated tile and into the rack fronts (the plenum run is a second flow)
      const zt = s * (0.25 + 0.5 * hash(j, 9));
      return [[xx, FH - 0.12, zt], [xx, FH + 0.25 + yh * 0.5, zt * 0.9], [xx, y, front(s)]];
    }
    if (supply === "overhead") return [[u.x, FH + 1.2, u.z], [u.x, yD, u.z], [u.x, yD, 0], [xx, yD, 0], [xx, yD - 0.3, 0], [xx, Math.max(y + 0.3, top - 0.3), s * 0.25], [xx, y, front(s)]];
    const z0 = s * (0.15 + 0.6 * hash(j, 5));
    return [[xuF, y, z0], [xs - 0.2, y, z0 * 0.8], [xx - 0.4, y, z0 * 0.7], [xx, y, front(s)]];
  });
  const supplyF = K.flow(ctx, THREE, { paths: supPaths, count: supPaths.length * 5, size: 0.055, from: "cool" });
  supplyG.add(supplyF.group);
  // under the floor: from each cooling unit's discharge along the plenum to the cold aisle tiles (seen at the open edges)
  const plenPaths = supply === "floor" ? lanes.map(({ s, x }, j) => { const u = units[s < 0 ? 0 : 1], zt = s * (0.25 + 0.5 * hash(j, 9)); return [[u.x, FH + 1.4, u.z], [u.x, FH * 0.45, u.z], [xuF + 0.4, FH * 0.45, (u.z + zt) / 2], [xs, FH * 0.45, zt], [x, FH * 0.45, zt], [x, FH - 0.12, zt]]; }) : [];
  const plenF = plenPaths.length ? K.flow(ctx, THREE, { paths: plenPaths, count: plenPaths.length * 2, size: 0.05, from: "cool" }) : { group: new THREE.Group(), set() {} };
  supplyG.add(plenF.group);
  // the perforated tiles breathe: a cool tint over the cold aisle tiles while air comes up through them
  const tint = new THREE.Mesh(new THREE.PlaneGeometry(xe - xs - 0.06, CA - 0.06), new THREE.MeshBasicMaterial({ color: K.col(ctx, "cool", opts), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  tint.rotation.x = -Math.PI / 2; tint.position.set((xs + xe) / 2, FH + 0.006, 0); tint.visible = supply === "floor"; supplyG.add(tint);
  // return: from each rack's back, rising in the hot aisle, back along it to the cooling unit's return grille
  const yR = mode === "hot" || supply === "wall" ? top - 0.35 : top - 0.25;
  const retPaths = lanes.map(({ s, x, yh }, j) => {
    const z1 = s * (zIn + 0.35), zm = s * (zIn + 0.45 + 0.6 * hash(j, 11)), u = units[s < 0 ? 0 : units.length - 1];
    const gz = supply === "wall" ? s * zH : u.z;
    return [[x, FH + yh, z1], [x + 0.15, FH + yh + 0.4, zm], [x - 0.3, yR, zm], [xuF + 0.5, yR, zm], [xuF + 0.05, top - 0.1, gz + (zm - s * zH) * 0.5], [xu, top - 0.1, gz]];
  });
  const retF = K.flow(ctx, THREE, { paths: retPaths, count: retPaths.length * 4, size: 0.055, from: "warm" });
  const return_path = new THREE.Group(); return_path.add(retF.group); pivot.add(return_path);
  // mixing: exhaust round the +x row ends into the end racks' fronts (the racks' own recirc shows the over-the-top curl)
  const mixPaths = [];
  for (const s of [-1, 1]) for (let j = 0; j < 4; j++) {
    const y = FH + 0.5 + 1.5 * hash(j, s + 5);
    mixPaths.push([[xe - 0.6, y, s * (zIn + 0.4)], [xe + 0.25, y + 0.1, s * (zIn + 0.2)], [xe + 0.55, y, s * zr], [xe + 0.3, y - 0.05, s * (CA / 2 - 0.1)], [xe - 0.2 - 0.3 * j, y - 0.1, s * (CA / 2 - 0.2)], [xe - 0.5 - 0.3 * j, y - 0.1, s * (CA / 2 - 0.02)]]);
  }
  const mixF = K.flow(ctx, THREE, { paths: mixPaths, count: 32, size: 0.055, from: "warm" });
  const mixing = new THREE.Group(); mixing.add(mixF.group); pivot.add(mixing);

  // ------------------------------------------------------------------ thermal view: translucent temperature volumes
  const thermal = new THREE.Group(); pivot.add(thermal);
  const vol = (x0, x1, z0, z1, h) => {
    const geo = new THREE.BoxGeometry(x1 - x0, h, z1 - z0, 6, 8, 1);
    geo.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
    m.position.set((x0 + x1) / 2, FH + h / 2 + 0.005, (z0 + z1) / 2); m.renderOrder = 1; thermal.add(m); return m;
  };
  const coldV = vol(xs + 0.02, xe - 0.02, -CA / 2 + 0.06, CA / 2 - 0.06, RH - 0.02);
  const hotV = [-1, 1].map((s) => vol(xs + 0.02, xe - 0.02, s > 0 ? zIn + 0.06 : -zOut + 0.06, s > 0 ? zOut - 0.06 : -zIn - 0.06, RH - 0.02));
  const paint = (m, fn) => {
    const p = m.geometry.attributes.position, c = m.geometry.attributes.color, h = m.geometry.parameters.height, w = m.geometry.parameters.width;
    for (let i = 0; i < p.count; i++) { const col = K.temp(ctx, fn(p.getY(i) / h + 0.5, p.getX(i) / w + 0.5)); c.setXYZ(i, col.r, col.g, col.b); }
    c.needsUpdate = true;
  };

  // ------------------------------------------------------------------ state
  const st = { airflow: 0, containment: 0, mixing: 0, thermal: 0, t: 0 };
  const apply = () => {
    const c = st.containment, mix = st.mixing * (1 - K.clamp(c * 1.25));
    // containment: roof panels and partitions drop in (in order), then the doors slide shut
    const cr = K.clamp(c / 0.65), cd = K.easeInOut(K.clamp((c - 0.5) / 0.5));
    containment.visible = c > 0.001;
    roofs.forEach((p) => {
      const q = K.spring(K.clamp(cr * 1.6 - p.userData.order * 0.6), 0.1);
      const [x, y, z] = p.userData.home; p.position.set(x, y + (1 - q) * 1.4, z); p.visible = q > 0.01; p.scale.setScalar(0.85 + 0.15 * K.clamp(q));
    });
    doors.forEach(({ d, leaves }) => { d.visible = c > 0.3; leaves.forEach((l) => { l.position.z = K.lerp(l.userData.open, l.userData.closed, cd); }); });
    // the racks: their own air front to back, their gaps unblanked and their exhaust curling over while mixing
    for (const r of racks) for (const [k, v] of [["t", st.t], ["airflow", st.airflow], ["recirc", mix], ["blanking", 1 - mix]]) {
      if (r.last === undefined) r.last = {};
      if (r.last[k] !== v) { r.last[k] = v; r.set(k, v); }       // a child repaints only when its value changed
    }
    supplyF.set(st.t * (supply === "floor" ? 0.3 : 0.16), st.airflow);
    plenF.set(st.t * 0.12, st.airflow);
    tint.material.opacity = 0.22 * st.airflow;
    retF.set(st.t * 0.15 + 0.3, st.airflow);
    mixF.set(st.t * 0.22, mix);
    // thermal view
    const th = st.thermal;
    thermal.visible = th > 0.001;
    if (thermal.visible) {
      paint(coldV, (v, u) => K.clamp(0.04 + mix * (0.75 * v * v + 0.25 * u * v)));
      hotV.forEach((m) => paint(m, (v) => 0.75 + 0.25 * v));
      coldV.material.opacity = 0.34 * th; hotV.forEach((m) => { m.material.opacity = 0.22 * th; });
    }
  };
  apply();
  const H = Math.max(top + 0.45, supply === "overhead" ? yD + 0.25 : 0, supply === "wall" ? FH + RH + 0.75 : 0);
  return {
    group, size: [FX, H, FZ],
    parts: { rows, floor, tiles, cooling_units, containment, cable_trays, supply: supplyG, return_path, mixing, thermal },
    keys: ["airflow", "containment", "mixing", "thermal", "t", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "t") { st.t = Number(v) || 0; apply(); return; }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
