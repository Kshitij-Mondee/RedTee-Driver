// @model {"id": "server_rack", "pack": "datacentre", "what": "a server cabinet (v2): a frame holding a column of servers, each with vents and a status light, a top-of-rack switch, a perforated front door, blanking panels for empty units, two vertical power strips A and B and cable bundles at the open rear; air runs front to back", "parts": ["cabinet", "units", "unit1 to unitN (each unit, from the top)", "leds", "door", "blanking", "switch", "pdus", "cables", "airflow", "recirc"], "keys": {"load": "0..1 how many units are lit and working (bottom up)", "alert": "0..1 one unit's light turns to the alert colour and glows (opts.alertUnit, default 2 from the top)", "slide": "0..1 the alert unit slides out of the rack (the front door swings open first)", "door": "0 the perforated front door closed .. 1 swung open", "blanking": "0 the empty units (opts.empty, indexes from the top) are open gaps .. 1 every gap filled by a blanking panel", "airflow": "0..1 cool air enters at the front, passes through the servers and leaves warm at the back", "recirc": "0..1 the mistake: warm exhaust curls from the back over the top, and through any open gap, into the front", "feed_b": "0..1 the B power strip fails and goes dark; the servers stay lit on the A strip", "t": "seconds; moves the air particles (call every frame with the scene time)", "turn": "radians about y"}, "best_for": ["data centres, servers and backups", "inside a rack: servers, a switch near the top, A and B power at the back, blanking panels", "hot and cold air: front to back airflow, recirculation and why gaps are blanked", "A and B power redundancy", "a system outage or alert", "capacity and load"], "not_for": ["a single laptop or phone (use those models)", "a whole aisle or hall (use a set)"], "size": [1.0, 2.3, 0.95], "sheet": {"opts": {"units": 8, "alertUnit": 3, "empty": [1, 5], "pduLabels": ["A", "B"]}, "mood": "cold_aisle", "elevation": 12, "states": [{"key": "t", "from": 0, "to": 6, "at": 0, "dur": 6}, {"key": "load", "from": 0, "to": 1, "at": 0.1, "dur": 0.8}, {"key": "airflow", "from": 0, "to": 1, "at": 0.8, "dur": 0.5}, {"key": "recirc", "from": 0, "to": 1, "at": 1.8, "dur": 0.5}, {"key": "blanking", "from": 0, "to": 1, "at": 2.7, "dur": 0.6}, {"key": "turn", "from": 0, "to": 2.5, "at": 3.5, "dur": 0.8}, {"key": "feed_b", "from": 0, "to": 1, "at": 4.6, "dur": 0.4}]}}
// v2 keeps v1's keys (load, alert, slide, turn) and opts (units, alertUnit) unchanged. Fronts face +z (the cold aisle);
// exhaust leaves only at the open rear (-z). Words: the strip tags show opts.pduLabels only (none given: blank tags).
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 1.0, H = 2.3, D = 0.92, N = Math.max(3, Math.min(14, opts.units || 8));
  const empty = new Set((opts.empty || []).map(Number).filter((i) => i >= 0 && i < N));
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const shell = K.mat(ctx, THREE, "casing", "plastic", opts, { roughness: 0.55 });
  const box = (w, h, d, x, y, z, m, r = 0.012, parent = pivot) => { const o = K.mesh(THREE, K.rbox(THREE, X, w, h, d, r, 2), m); o.position.set(x, y, z); parent.add(o); return o; };
  const tube = (pts, r, m, parent) => { const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal"); const o = K.mesh(THREE, new THREE.TubeGeometry(c, 48, r, 6, false), m); parent.add(o); return o; };

  // the cabinet: side panels, top, plinth and a rear top rail; the rear is open so the strips and cables show
  const cabinet = new THREE.Group();
  for (const [w, h, d, x, y, z] of [[0.05, H, D, -W / 2 + 0.025, H / 2, 0], [0.05, H, D, W / 2 - 0.025, H / 2, 0], [W, 0.06, D, 0, H - 0.03, 0],
    [W, 0.1, D, 0, 0.05, 0], [W - 0.1, 0.05, 0.05, 0, H - 0.085, -D / 2 + 0.03]]) box(w, h, d, x, y, z, shell, 0.015, cabinet);
  for (const s of [-1, 1]) {                   // feet
    for (const z of [-1, 1]) { const f = K.mesh(THREE, new THREE.CylinderGeometry(0.04, 0.05, 0.04, 16), K.mat(ctx, THREE, "trim", "rubber", opts)); f.position.set(s * (W / 2 - 0.08), -0.0, z * (D / 2 - 0.08)); cabinet.add(f); }
  }
  pivot.add(cabinet);

  // one canvas face for every unit front (vents and a ruled edge) and one for every rear (two power supplies, ports)
  const vf = K.face(ctx, THREE, 800, 120);
  vf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "casing", opts);
    for (let i = 0; i < 26; i++) { K.rr(g, 60 + i * 20, 30, 10, h - 60, 5); g.fill(); }
    K.rr(g, w - 230, 40, 120, h - 80, 10); g.fill();
  });
  const rf = K.face(ctx, THREE, 800, 120);
  rf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "casing", opts);
    for (const x0 of [24, w - 184]) { K.rr(g, x0, 16, 160, h - 32, 8); g.fill(); }
    g.fillStyle = K.hexOf(ctx, "casing2", opts);
    for (const x0 of [24, w - 184]) for (let i = 0; i < 9; i++) { K.rr(g, x0 + 14 + i * 15, 28, 7, h - 56, 3); g.fill(); }
    g.fillStyle = K.hexOf(ctx, "casing", opts);
    for (let i = 0; i < 6; i++) { K.rr(g, 250 + i * 50, 38, 36, 44, 4); g.fill(); }
  });
  const unitH = (H - 0.3) / N, SD = 0.68, units = [], leds = [], uy = (i) => 0.16 + unitH * (N - 1 - i) + unitH / 2;
  const face = new THREE.MeshStandardMaterial({ map: vf.tex, roughness: 0.6, metalness: 0.2 });
  const rear = new THREE.MeshStandardMaterial({ map: rf.tex, roughness: 0.6, metalness: 0.2 });
  const side = K.mat(ctx, THREE, "casing2", "plastic", opts);
  const ledOff = K.col(ctx, "trim", opts), ledOn = K.col(ctx, "ok", opts), ledBad = K.col(ctx, "bad", opts);
  const unitsG = new THREE.Group(); pivot.add(unitsG);
  for (let i = 0; i < N; i++) {
    const u = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, unitH * 0.84, SD), [side, side, side, side, face, rear]);
    b.position.z = D / 2 - 0.06 - SD / 2; b.castShadow = true; u.add(b);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), new THREE.MeshStandardMaterial({ color: ledOff, emissive: ledOff, emissiveIntensity: 0 }));
    led.position.set(W / 2 - 0.16, 0, D / 2 - 0.055); u.add(led);
    const rl = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), led.material); rl.position.set(-0.06, 0, D / 2 - 0.06 - SD - 0.004); u.add(rl);
    u.position.set(0, uy(i), 0.0); u.visible = !empty.has(i);
    unitsG.add(u); units.push(u); leds.push(led);
  }
  const ZB = D / 2 - 0.06 - SD;               // the servers' rear face

  // the top-of-rack switch in the slot above the servers: fans and power supplies face the front (intake), the port
  // cages face the rear where the servers' network ports are (port-side exhaust), so its air also runs front to back
  const swH = 0.07, swD = 0.5, swY = 0.16 + unitH * N + 0.045, swZ = D / 2 - 0.06 - swD / 2;
  const sf = K.face(ctx, THREE, 800, 64), sr = K.face(ctx, THREE, 800, 64);
  sf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "casing", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "casing2", opts);
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(130 + i * 90, h / 2, 24, 0, Math.PI * 2); g.fill(); }
    for (const x0 of [520, 650]) { K.rr(g, x0, 10, 110, h - 20, 6); g.fill(); }
  });
  sr.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "casing", opts);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 24; i++) { K.rr(g, 30 + i * 25, 8 + r * 26, 20, 20, 2); g.fill(); }
    g.fillStyle = K.hexOf(ctx, "ui", opts);
    for (let i = 0; i < 4; i++) { K.rr(g, 650 + (i % 2) * 60, 6 + Math.floor(i / 2) * 27, 50, 24, 3); g.fill(); }
  });
  const sw = new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, swH, swD), [side, side, side, side,
    new THREE.MeshStandardMaterial({ map: sf.tex, roughness: 0.6, metalness: 0.2 }), new THREE.MeshStandardMaterial({ map: sr.tex, roughness: 0.6, metalness: 0.2 })]);
  sw.position.set(0, swY, swZ); sw.castShadow = true; pivot.add(sw);
  const swLed = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), new THREE.MeshStandardMaterial({ color: ledOff, emissive: ledOff, emissiveIntensity: 0 }));
  swLed.position.set(W / 2 - 0.12, swY, D / 2 - 0.055); pivot.add(swLed);

  // the two zero-U power strips at the rear, A on the left and B on the right (seen from the front), each in its own
  // role colour, with outlets facing the rear, a light by each outlet and a feed cord out at the bottom
  const pdus = new THREE.Group(); pivot.add(pdus);
  const PY0 = 0.18, PY1 = 2.14, PL = PY1 - PY0, PZ = -D / 2 + 0.06, labels = opts.pduLabels || [];
  // masks (an emissive map, an alpha map) are not design colours: neutral black and white, as lights use
  const MASK0 = "#" + ctx.neutral(0).getHexString(), MASK1 = "#" + ctx.neutral(1).getHexString();
  const pf = K.face(ctx, THREE, 64, 1024), pe = K.face(ctx, THREE, 64, 1024);
  const outY = []; for (let i = 0; i < N; i++) outY.push(uy(i) + unitH * 0.22, uy(i) - unitH * 0.22);
  const py = (y) => (PY1 - y) / PL * 1024;
  pf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "screen", opts); K.rr(g, 10, 14, 44, 30, 4); g.fill();
    for (const y of outY) { g.fillStyle = K.hexOf(ctx, "casing", opts); K.rr(g, 12, py(y) - 13, 30, 26, 5); g.fill(); g.fillStyle = K.hexOf(ctx, "trim", opts); g.beginPath(); g.arc(52, py(y), 4, 0, Math.PI * 2); g.fill(); }
  });
  pe.draw((g, w, h) => {
    g.fillStyle = MASK0; g.fillRect(0, 0, w, h);
    g.fillStyle = MASK1; K.rr(g, 14, 30, 34 * 0.6, 8, 3); g.fill();
    for (const y of outY) { g.beginPath(); g.arc(52, py(y), 5, 0, Math.PI * 2); g.fill(); }
  });
  const strips = ["ui", "warm"].map((roleName, si) => {
    const x = (si ? 1 : -1) * (W / 2 - 0.085), g = new THREE.Group(); pdus.add(g);
    const roleMat = K.mat(ctx, THREE, roleName, "plastic", opts);
    const body = box(0.064, PL, 0.045, x, PY0 + PL / 2, PZ, roleMat, 0.01, g);
    const fm = new THREE.MeshStandardMaterial({ map: pf.tex, emissiveMap: pe.tex, emissive: K.col(ctx, "ok", opts), emissiveIntensity: 0, roughness: 0.6 });
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.048, PL - 0.03), fm); fp.rotation.y = Math.PI; fp.position.set(x, PY0 + PL / 2, PZ - 0.0235); g.add(fp);
    const tagMat = K.mat(ctx, THREE, roleName, "plastic", opts, { emissive: K.col(ctx, "bad", opts), emissiveIntensity: 0 });
    const tag = box(0.075, 0.1, 0.012, x, PY1 + 0.0, PZ - 0.03, tagMat, 0.006, g);
    if (labels[si]) { const l = K.label(ctx, THREE, labels[si], { h: 0.085, role: "onAccent" }); l.rotation.y = Math.PI; l.position.set(x, PY1, PZ - 0.0375); g.add(l); }
    const cord = tube([[x, PY0 + 0.02, PZ], [x, 0.13, PZ - 0.012], [x, 0.1, PZ - 0.02]], 0.012, roleMat, g);
    return { g, x, body, fm, tagMat, roleMat, cord, roleCol: K.col(ctx, roleName, opts) };
  });

  // cables at the rear: each server's two supplies cord to strip A and strip B, and its network cable joins a bundle
  // that rises to the switch's ports
  const cables = new THREE.Group(); pivot.add(cables);
  let k = 0;
  for (let i = 0; i < N; i++) {
    if (empty.has(i)) continue;
    const y = uy(i), yo = y + unitH * 0.22;
    strips.forEach((s, si) => {
      const sx = si ? 1 : -1, x0 = sx * 0.33;
      tube([[x0, y, ZB], [x0 + sx * 0.02, y, ZB - 0.06], [s.x - sx * 0.03, (y + yo) / 2, PZ - 0.06], [s.x, yo, PZ - 0.06], [s.x, yo, PZ - 0.024]], 0.008, s.roleMat, cables);
    });
    const bx = 0.08 + (k % 5) * 0.014, bz = ZB - 0.06 - (k % 3) * 0.012;
    tube([[0.02 + (k % 4) * 0.04, y, ZB], [bx, y + 0.02, bz], [bx, (y + swY) / 2, bz], [bx, swY - 0.04, bz], [0.02 + (k % 6) * 0.03, swY, swZ - swD / 2]], 0.007, K.mat(ctx, THREE, "ui2", "plastic", opts), cables);
    k++;
  }

  // the perforated front door, hinged on the left; the perforation is an alpha map, so lights and air read through it
  const door = new THREE.Group(); door.position.set(-W / 2 + 0.02, 0, D / 2 + 0.016); pivot.add(door);
  const DW = W - 0.04, DY0 = 0.12, DH = H - 0.17;
  const af = K.face(ctx, THREE, 512, 1024);
  af.draw((g, w, h) => {
    g.fillStyle = MASK1; g.fillRect(0, 0, w, h); g.fillStyle = MASK0;
    const cols = 26, sx = w / cols, sy = sx * 0.87, rows = Math.ceil(h / sy);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { g.beginPath(); g.arc((c + 0.5 + (r % 2) * 0.5) * sx, (r + 0.5) * sy, sx * 0.41, 0, Math.PI * 2); g.fill(); }
  });
  af.tex.colorSpace = THREE.NoColorSpace;
  const dMat = new THREE.MeshStandardMaterial({ color: K.col(ctx, "casing", opts), alphaMap: af.tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.3 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(DW - 0.07, DH - 0.09), dMat); mesh.position.set(DW / 2, DY0 + DH / 2, 0); door.add(mesh);
  for (const [w, h, x, y] of [[0.04, DH, 0.02, DY0 + DH / 2], [0.04, DH, DW - 0.02, DY0 + DH / 2], [DW, 0.05, DW / 2, DY0 + 0.025], [DW, 0.05, DW / 2, DY0 + DH - 0.025]]) box(w, h, 0.022, x, y, 0, shell, 0.006, door);
  box(0.022, 0.2, 0.03, DW - 0.045, DY0 + DH * 0.52, 0.02, K.mat(ctx, THREE, "metal", "metal", opts), 0.008, door);

  // blanking panels: one plain plate per empty unit, flush with the server fronts
  const blank = new THREE.Group(); pivot.add(blank);
  const bMat = K.mat(ctx, THREE, "casing", "matte", opts, { roughness: 0.7 });
  const panels = [...empty].sort((a, b) => a - b).map((i) => { const p = box(W - 0.12, unitH * 0.92, 0.014, 0, uy(i), D / 2 - 0.067, bMat, 0.004, blank); p.visible = false; return p; });

  // air: cool in at the front, through each server and the switch, warm out of the back (heat: colour by distance)
  const lane = (i, j) => (((i * 7919 + j * 104729) % 101) / 101);
  const airPaths = [], ys = [];
  for (let i = 0; i < N; i++) if (!empty.has(i)) ys.push(uy(i));
  ys.push(swY);
  ys.forEach((y, i) => { for (const [j, x] of [[0, -0.22], [1, 0.16]]) { const yy = y + (lane(i, j) - 0.5) * Math.min(unitH, 0.1) * 0.5, xx = x + (lane(j, i) - 0.5) * 0.1; airPaths.push([[xx, yy, D / 2 + 0.5], [xx, yy, D / 2 - 0.06], [xx, yy, ZB], [xx, yy, -D / 2 - 0.5]]); } });
  const air = K.flow(ctx, THREE, { paths: airPaths, count: airPaths.length * 6, size: 0.028, from: "cool", to: "warm", heat: true });
  pivot.add(air.group);
  // the mistake: exhaust curls over the top into the top servers' intakes, and back through each open gap
  const topY = uy(0), topPaths = [-0.26, 0, 0.26].map((x) => [[x, topY, -D / 2 - 0.2], [x, H - 0.05, -D / 2 - 0.3], [x, H + 0.1, -0.15], [x, H + 0.08, D / 2 + 0.22], [x, topY + 0.05, D / 2 + 0.32], [x, topY, D / 2 + 0.03]]);
  const gapPaths = [];
  for (const e of empty) {
    const ye = uy(e), nb = e > 0 && !empty.has(e - 1) ? uy(e - 1) : uy(Math.min(N - 1, e + 1));
    for (const x of [-0.18, 0.2]) gapPaths.push([[x, ye, -D / 2 - 0.3], [x, ye, ZB - 0.02], [x, ye, D / 2 + 0.12], [x, (ye + nb) / 2, D / 2 + 0.3], [x, nb, D / 2 + 0.2], [x, nb, D / 2 - 0.02]]);
  }
  const recTop = K.flow(ctx, THREE, { paths: topPaths, count: 36, size: 0.021, from: "warm" });
  const recGap = K.flow(ctx, THREE, { paths: gapPaths.length ? gapPaths : [[[0, 0, 0], [0, 0, 0]]], count: Math.max(1, gapPaths.length * 7), size: 0.021, from: "warm" });
  const recirc = new THREE.Group(); recirc.add(recTop.group, recGap.group); pivot.add(recirc);
  group.add(K.contactShadow(ctx, THREE, W * 1.8, D * 1.8, 0.5));

  const st = { load: opts.load == null ? 0 : opts.load, alert: 0, slide: 0, door: K.clamp(opts.door || 0), blanking: K.clamp(opts.blanking || 0), airflow: 0, recirc: 0, feed_b: 0, t: 0 };
  const AU = Math.max(0, Math.min(N - 1, (opts.alertUnit == null ? 2 : opts.alertUnit)));
  const deadC = K.col(ctx, "casing2", opts), badC = K.col(ctx, "bad", opts);
  const apply = () => {
    const lit = Math.round(st.load * N);
    leds.forEach((l, i) => {
      const on = (N - 1 - i) < lit;                     // lit from the bottom unit up
      const bad = i === AU && st.alert > 0;
      const c = bad ? ledBad : on ? ledOn : ledOff;
      l.material.color.copy(c); l.material.emissive.copy(c);
      l.material.emissiveIntensity = bad ? 0.6 + 1.6 * st.alert : on ? 0.9 : 0;
      const s = bad ? 1 + 0.6 * st.alert : 1; l.scale.set(s, s, s);
    });
    const sOn = st.load > 0; swLed.material.color.copy(sOn ? ledOn : ledOff); swLed.material.emissive.copy(sOn ? ledOn : ledOff); swLed.material.emissiveIntensity = sOn ? 0.9 : 0;
    units[AU].position.z = 0.42 * K.easeInOut(st.slide);
    door.rotation.y = -1.85 * K.easeInOut(Math.max(st.door, K.clamp(st.slide * 4)));   // a unit slides out only through an open door
    const nP = panels.length;
    panels.forEach((p, i) => { const q = K.spring(K.clamp(st.blanking * (nP * 0.5 + 0.5) - i * 0.5), 0.12); p.visible = q > 0.001; p.scale.set(1, Math.max(0.001, q), 1); });
    air.set(st.t * 0.32, st.airflow);
    recTop.set(st.t * 0.28, st.recirc);
    recGap.set(st.t * 0.3 + 0.37, gapPaths.length ? st.recirc * K.clamp(1 - st.blanking * 1.25) : 0);
    strips.forEach((s, si) => {
      const f = si === 1 ? st.feed_b : 0;
      s.fm.emissiveIntensity = (1 - f) * 1.2;
      s.roleMat.color.copy(s.roleCol).lerp(deadC, f * 0.85);
      s.tagMat.color.copy(s.roleCol).lerp(badC, f); s.tagMat.emissiveIntensity = f * (0.7 + 0.5 * Math.sin(st.t * 7));
    });
  };
  apply();
  return {
    // each unit is also its own part, unit1 at the top (the alert unit is unit<alertUnit + 1>), so a hero can point at one
    group, size: [W, H, 0.95], parts: { cabinet, units: unitsG, leds: leds[0], door, blanking: blank, switch: sw, pdus, cables, airflow: air.group, recirc,
      ...Object.fromEntries(units.map((u, i) => ["unit" + (i + 1), u])) },
    keys: ["load", "alert", "slide", "door", "blanking", "airflow", "recirc", "feed_b", "t", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "t") { st.t = Number(v) || 0; apply(); return; }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
