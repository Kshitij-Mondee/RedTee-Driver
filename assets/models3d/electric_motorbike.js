// @model {"id": "electric_motorbike", "pack": "workplace", "what": "a generic electric motorcycle at real proportions (metres): an aluminium twin-spar frame around a large battery pack whose side cover lifts to show its cell modules (cylindrical cells with busbars), a finned controller under the seat with orange high-voltage cables to a mid-mounted motor (housing, stator teeth wound with copper coils, a rotor with magnets), a toothed belt from the motor pulley to the rear wheel, a swingarm with a coil-over shock, an upside-down fork with triple clamps, 17 inch cast wheels with real tyre sections, twin front and one rear brake disc with calipers, a seat, bars with mirrors, a headlight, a tank cover and a tail", "parts": ["frame", "bodywork", "tank_cover", "battery_pack", "pack_cover", "cells", "controller", "phase_cables", "motor", "motor_cover", "stator", "rotor", "drive", "swingarm", "shock", "rear_wheel", "front_wheel", "fork", "seat", "handlebar", "brake_discs"], "keys": {"spin": "radians the wheels have turned (the motor turns 3.7 times as fast through the belt)", "throttle": "0..1 the right grip twists and the high-voltage cables and the stator coils glow (current flowing)", "open_pack": "0 closed .. 1 the battery's side cover lifts away and its cell modules show", "explode": "0 assembled .. 1 an exploded view: the pack cover off, the tank cover, pack, controller and seat rise, the motor slides out with its cover and rotor drawn off the stator, the belt stands clear, the wheels move apart", "turn": "radians about y"}, "best_for": ["how an electric motorcycle works (pack, controller, motor, belt, wheel)", "battery cells and modules inside an electric vehicle pack", "an electric motor's stator and rotor", "regenerative braking and the energy path (with the hologram's traces)", "an exploded view of a vehicle assembly", "sustainable transport and commuting"], "not_for": ["a pedal bicycle (use bicycle)", "a petrol motorcycle (it has no engine, exhaust or fuel tank)", "a car or a scooter", "a named maker's model (it is generic)", "a person riding (people come from character kits)"], "size": [2.06, 1.17, 0.8], "sheet": {"elevation": 14, "states": [{"key": "spin", "from": 0, "to": 14, "at": 0, "dur": 6}, {"key": "throttle", "from": 0, "to": 1, "at": 0.8, "dur": 0.8}, {"key": "open_pack", "from": 0, "to": 1, "at": 1.8, "dur": 1.0}, {"key": "explode", "from": 0, "to": 1, "at": 3.7, "dur": 1.3}]}}
// Geometry in metres: wheelbase 1.44, 17 inch rims (0.432 m), a 120/70 front tyre and a 180/55 rear (outer radii 0.30
// and 0.315), rake 24 degrees, seat 0.86 high, bars 1.0. The bike faces +x; z is across it and +z is the rider's right,
// where the belt, the throttle and the pack's cover are (a right-side final drive, as on some electric bikes). Words: none.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot);
  const bodyM = K.mat(ctx, THREE, "casing", "gloss", opts), seatM = K.mat(ctx, THREE, "casing", "matte", opts);
  const tyreM = K.mat(ctx, THREE, "casing", "rubber", opts), rimM = K.mat(ctx, THREE, "casing2", "plastic", opts);
  const alu = K.mat(ctx, THREE, "metal", "metal", opts), steel = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.2 });
  const packM = K.mat(ctx, THREE, "casing2", "plastic", opts), coverM = K.mat(ctx, THREE, "casing2", "gloss", opts);
  const cellM = K.mat(ctx, THREE, "cool", "plastic", opts), modM = K.mat(ctx, THREE, "trim", "matte", opts);
  const copper = K.mat(ctx, THREE, "warm", "glow", opts, { metalness: 0.6, roughness: 0.35 });
  const cableM = K.mat(ctx, THREE, "warm", "glow", opts), magM = K.mat(ctx, THREE, "ui", "plastic", opts), magM2 = K.mat(ctx, THREE, "ui2", "plastic", opts);
  const caliperM = K.mat(ctx, THREE, "warm", "plastic", opts), fenderM = K.mat(ctx, THREE, "casing", "gloss", opts, { side: THREE.DoubleSide });
  const lens = K.mat(ctx, THREE, "screen", "glass", opts), lamp = K.mat(ctx, THREE, "bad", "glow", opts), dark = K.mat(ctx, THREE, "trim", "rubber", opts);
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const add = (parent, geo, m, x = 0, y = 0, z = 0) => { const o = K.mesh(THREE, geo, m); o.position.set(x, y, z); parent.add(o); return o; };
  const tubeBetween = (a, b, r, m, parent, seg = 16) => {
    const d = b.clone().sub(a), L = d.length(), o = K.mesh(THREE, new THREE.CylinderGeometry(r, r, L, seg, 1), m);
    o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); parent.add(o); return o;
  };
  // a flat bar (a spar, a swingarm arm) from a to b in the side plane, h tall and t thick, at a's z
  const barBetween = (a, b, h, t, m, parent) => {
    const L = Math.hypot(b.x - a.x, b.y - a.y), o = K.mesh(THREE, K.rbox(THREE, X, L + h * 0.5, h, t, Math.min(h, t) * 0.35, 2), m);
    o.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, a.z); o.rotation.z = Math.atan2(b.y - a.y, b.x - a.x); parent.add(o); return o;
  };
  const curve = (pts, r, m, parent, seg = 40) => { const c = new THREE.CatmullRomCurve3(pts, false, "centripetal"); return add(parent, new THREE.TubeGeometry(c, seg, r, 10, false), m); };
  const poly = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; };
  const circle = (r, x = 0, y = 0, cw = false) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, cw); return p; };
  const lathe = (pts, seg = 64) => { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg); g.rotateX(Math.PI / 2); return g; };
  // many small parts as one mesh (the cells, the busbars): position and normal attributes, indices offset
  const merge = (geos) => {
    let n = 0; for (const g of geos) n += g.attributes.position.count;
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), I = []; let o = 0;
    for (const g of geos) {
      const c = g.attributes.position.count; P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3);
      if (g.index) for (const i of g.index.array) I.push(i + o); else for (let k = 0; k < c; k++) I.push(o + k);
      o += c; g.dispose();
    }
    const m = new THREE.BufferGeometry(); m.setAttribute("position", new THREE.BufferAttribute(P, 3)); m.setAttribute("normal", new THREE.BufferAttribute(N, 3)); m.setIndex(I); return m;
  };
  // a toothed pulley or sprocket outline, with round cut-outs
  const toothed = (n, r0, r1, holes = []) => {
    const s = new THREE.Shape();
    for (let i = 0; i < n * 4; i++) { const a = i / (n * 4) * Math.PI * 2, r = (i % 4 < 2) ? r1 : r0; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) s.moveTo(x, y); else s.lineTo(x, y); }
    s.closePath(); for (const h of holes) s.holes.push(h); return s;
  };
  const RA = V(-0.70, 0.315), FA = V(0.74, 0.30), M = V(-0.08, 0.36), SP = V(-0.16, 0.44);
  const RAKE = 24 * Math.PI / 180, U = V(-Math.sin(RAKE), Math.cos(RAKE)), fk = (s) => FA.clone().addScaledVector(U, s);
  const BELT_Z = 0.17, R_MP = 0.045, R_RP = 0.165, RATIO = R_RP / R_MP;

  // ---------------------------------------------------------------- the frame: twin aluminium spars from the steering
  // head over the pack's top edges to the swingarm pivot plates, a rear subframe under the seat, footpegs
  const frame = new THREE.Group(); pivot.add(frame);
  const htA = fk(0.53).add(V(-0.0274, -0.0122)), htB = fk(0.69).add(V(-0.0274, -0.0122));
  tubeBetween(htA, htB, 0.034, alu, frame, 24);
  for (const s of [-1, 1]) {
    const pts = [V(0.47, 0.84, s * 0.05), V(0.36, 0.805, s * 0.14), V(0.0, 0.77, s * 0.14), V(-0.13, 0.665, s * 0.14), V(-0.16, 0.45, s * 0.14)];
    for (let i = 0; i < pts.length - 1; i++) barBetween(pts[i], pts[i + 1], i === 0 ? 0.08 : 0.075, 0.03, alu, frame);
    add(frame, K.rbox(THREE, X, 0.13, 0.28, 0.032, 0.02), alu, -0.155, 0.53, s * 0.14);
    tubeBetween(V(-0.15, 0.66, s * 0.1), V(-0.72, 0.82, s * 0.075), 0.012, alu, frame);
    tubeBetween(V(-0.18, 0.47, s * 0.1), V(-0.54, 0.795, s * 0.075), 0.011, alu, frame);
    const peg = add(frame, new THREE.CylinderGeometry(0.014, 0.014, 0.09, 12), dark, -0.25, 0.36, s * 0.205); peg.rotation.x = Math.PI / 2;
    tubeBetween(V(-0.19, 0.42, s * 0.15), V(-0.25, 0.36, s * 0.165), 0.012, alu, frame);
  }
  // the steering-head gusset tying the spars to the head tube
  add(frame, K.rbox(THREE, X, 0.1, 0.1, 0.12, 0.02), alu, 0.455, 0.83, 0);

  // ---------------------------------------------------------------- bodywork: the tail and the two fenders; the tank cover
  const bodywork = new THREE.Group(); pivot.add(bodywork);
  add(bodywork, K.extrude(THREE, poly([[-0.3, 0.74], [-0.84, 0.835], [-0.905, 0.87], [-0.86, 0.9], [-0.6, 0.86], [-0.3, 0.8]]), 0.17, 0.018), bodyM);
  add(bodywork, K.rbox(THREE, X, 0.02, 0.03, 0.12, 0.008), lamp, -0.905, 0.875, 0);
  const rearHug = add(bodywork, new THREE.CylinderGeometry(0.345, 0.345, 0.16, 40, 1, true, 150 * Math.PI / 180, 80 * Math.PI / 180), fenderM, RA.x, RA.y, 0); rearHug.rotation.x = Math.PI / 2;
  const tank_cover = new THREE.Group(); pivot.add(tank_cover);
  add(tank_cover, K.extrude(THREE, poly([[0.42, 0.785], [0.405, 0.89], [0.3, 0.935], [0.08, 0.925], [-0.04, 0.875], [-0.075, 0.81], [-0.06, 0.795]]), 0.2, 0.03), bodyM);

  // ---------------------------------------------------------------- the battery pack: a case between the spars, cell
  // modules on its right face (cylindrical cells, busbars across each row), a side cover over them
  const battery_pack = new THREE.Group(); pivot.add(battery_pack);
  const PACK = [[0.07, 0.2], [0.34, 0.2], [0.38, 0.27], [0.42, 0.48], [0.44, 0.7], [0.38, 0.78], [-0.08, 0.8], [-0.13, 0.66], [0.0, 0.53], [0.07, 0.46]];
  add(battery_pack, K.extrude(THREE, poly(PACK), 0.22, 0.008), packM);
  const cells = new THREE.Group(); battery_pack.add(cells);
  const cg = [], bg = [], mg = [], CR = 0.0105, CP = 0.0225, FZ = 0.118;
  const module = (x0, y0) => {          // 5 by 4 cells in a frame, lower-left corner at (x0, y0)
    const w = 5 * CP + 0.012, h = 4 * CP + 0.012;
    for (const [bx, by, bw, bh] of [[x0 + w / 2, y0 + 0.003, w, 0.006], [x0 + w / 2, y0 + h - 0.003, w, 0.006], [x0 + 0.003, y0 + h / 2, 0.006, h], [x0 + w - 0.003, y0 + h / 2, 0.006, h]]) {
      const g = new THREE.BoxGeometry(bw, bh, 0.016); g.translate(bx, by, FZ + 0.008); mg.push(g);
    }
    for (let r = 0; r < 4; r++) {
      const cy = y0 + 0.006 + CP * (r + 0.5);
      for (let c = 0; c < 5; c++) { const g = new THREE.CylinderGeometry(CR, CR, 0.014, 14, 1); g.rotateX(Math.PI / 2); g.translate(x0 + 0.006 + CP * (c + 0.5), cy, FZ + 0.007); cg.push(g); }
      const b = new THREE.BoxGeometry(5 * CP - 0.004, 0.006, 0.0016); b.translate(x0 + w / 2, cy, FZ + 0.0148); bg.push(b);
    }
  };
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) module(-0.01 + i * 0.134, 0.555 + j * 0.107);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) module(0.075 + i * 0.134, 0.205 + j * 0.107);
  add(cells, merge(cg), cellM); add(cells, merge(bg), steel); add(cells, merge(mg), modM);
  // the cover hangs from a hinge along its top edge and swings up and out like a lid (seen edge-on from the side, so the
  // cells it uncovers are never hidden behind it)
  const HY = 0.79, pack_cover = new THREE.Group(); pack_cover.position.set(0, HY, 0.136); battery_pack.add(pack_cover);
  const inset = PACK.map(([x, y]) => [0.15 + (x - 0.15) * 0.985, 0.5 + (y - 0.5) * 0.985]);
  add(pack_cover, K.extrude(THREE, poly(inset), 0.004, 0.002), coverM, 0, -HY, 0);
  for (const [x, y] of inset.filter((_, i) => i % 2 === 0)) { const b = add(pack_cover, new THREE.CylinderGeometry(0.007, 0.007, 0.006, 10), steel, 0.15 + (x - 0.15) * 0.93, 0.5 + (y - 0.5) * 0.93 - HY, 0.004); b.rotation.x = Math.PI / 2; }

  // ---------------------------------------------------------------- the controller (inverter) under the seat: a finned
  // box with its high-voltage cables, two from the pack and three phases down to the motor
  const controller = new THREE.Group(); pivot.add(controller);
  add(controller, K.rbox(THREE, X, 0.22, 0.07, 0.14, 0.012), alu, -0.4, 0.68, 0);
  for (let i = 0; i < 9; i++) add(controller, new THREE.BoxGeometry(0.2, 0.026, 0.004), alu, -0.4, 0.725, -0.056 + i * 0.014);
  for (let i = 0; i < 3; i++) { const g = add(controller, new THREE.CylinderGeometry(0.011, 0.011, 0.02, 10), dark, -0.3, 0.655, 0.03 + i * 0.025); g.rotation.z = Math.PI / 2; }
  const phase_cables = new THREE.Group(); pivot.add(phase_cables);
  for (let i = 0; i < 3; i++) { const z = 0.03 + i * 0.025; curve([V(-0.29, 0.655, z), V(-0.22, 0.6, z + 0.02), V(-0.14, 0.53, z + 0.03), V(-0.09, 0.478, 0.04 + i * 0.02)], 0.0075, cableM, phase_cables); }
  for (const z of [-0.035, 0.0]) curve([V(-0.07, 0.795, z), V(-0.16, 0.8, z), V(-0.26, 0.74, z), V(-0.3, 0.7, z)], 0.009, cableM, phase_cables);

  // ---------------------------------------------------------------- the motor, mid-mounted ahead of the swingarm pivot:
  // a finned housing, a stator of 12 teeth each wound with a copper coil, a rotor with 8 magnets on the output shaft
  const motor = new THREE.Group(); motor.position.copy(M); pivot.add(motor);
  add(motor, lathe([[0.118, -0.1], [0.118, 0.1], [0.1, 0.1], [0.1, -0.1], [0.118, -0.1]]), alu);
  for (let i = 0; i < 5; i++) add(motor, new THREE.TorusGeometry(0.118, 0.004, 6, 56), alu, 0, 0, -0.08 + i * 0.04);
  add(motor, new THREE.CylinderGeometry(0.118, 0.118, 0.012, 48), alu, 0, 0, -0.106).rotation.x = Math.PI / 2;
  const stator = new THREE.Group(); motor.add(stator);
  const NS = 12, hole = new THREE.Path(), pts = [];
  for (let i = 0; i < NS; i++) {
    const c = i / NS * Math.PI * 2;
    for (const [r, da] of [[0.08, -0.1], [0.064, -0.125], [0.064, -0.22], [0.058, -0.22], [0.058, 0.22], [0.064, 0.22], [0.064, 0.125], [0.08, 0.1]]) pts.push([Math.cos(c + da) * r, Math.sin(c + da) * r]);
  }
  pts.reverse().forEach(([x, y], i) => (i ? hole.lineTo(x, y) : hole.moveTo(x, y))); hole.closePath();
  const lam = new THREE.Shape(); lam.absarc(0, 0, 0.099, 0, Math.PI * 2, false); lam.holes.push(hole);
  add(stator, K.extrude(THREE, lam, 0.15, 0.002), steel);
  const coils = [];
  for (let i = 0; i < NS; i++) { const c = i / NS * Math.PI * 2; const o = add(stator, K.rbox(THREE, X, 0.013, 0.027, 0.172, 0.005, 2), copper, Math.cos(c) * 0.0725, Math.sin(c) * 0.0725, 0); o.rotation.z = c; coils.push(o); }
  const rotor = new THREE.Group(); motor.add(rotor);
  add(rotor, new THREE.CylinderGeometry(0.054, 0.054, 0.15, 40), steel).rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const o = add(rotor, new THREE.BoxGeometry(0.006, 0.034, 0.15), i % 2 ? magM : magM2, Math.cos(a) * 0.053, Math.sin(a) * 0.053, 0); o.rotation.z = a; }
  add(rotor, new THREE.CylinderGeometry(0.014, 0.014, 0.33, 16), steel, 0, 0, 0.05).rotation.x = Math.PI / 2;
  const motor_cover = new THREE.Group(); motor.add(motor_cover);
  add(motor_cover, new THREE.CylinderGeometry(0.118, 0.118, 0.012, 48), alu, 0, 0, 0.106).rotation.x = Math.PI / 2;
  add(motor_cover, new THREE.CylinderGeometry(0.04, 0.05, 0.02, 32), alu, 0, 0, 0.12).rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(motor_cover, new THREE.CylinderGeometry(0.006, 0.006, 0.01, 8), steel, Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.115).rotation.x = Math.PI / 2; }

  // ---------------------------------------------------------------- the drive: a toothed motor pulley, the rear
  // pulley on the hub and the belt that wraps both (its runs are the circles' outer tangents)
  const drive = new THREE.Group(); pivot.add(drive);
  const mp = new THREE.Group(); mp.position.set(M.x, M.y, BELT_Z); drive.add(mp);
  add(mp, K.extrude(THREE, toothed(24, R_MP - 0.004, R_MP), 0.032, 0.001), steel);
  const rp = new THREE.Group(); rp.position.set(RA.x, RA.y, BELT_Z); drive.add(rp);
  const cut = []; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3; cut.push(circle(0.04, Math.cos(a) * 0.1, Math.sin(a) * 0.1, true)); }
  cut.push(circle(0.03, 0, 0, true));
  add(rp, K.extrude(THREE, toothed(72, R_RP - 0.004, R_RP, cut), 0.032, 0.001), alu);
  const loop = (r1, r2) => {        // the belt's centre path round the motor pulley (r1) and the rear pulley (r2)
    const dx = RA.x - M.x, dy = RA.y - M.y, D = Math.hypot(dx, dy), phi = Math.atan2(dy, dx), beta = Math.acos((r1 - r2) / D), out = [];
    for (let i = 0; i <= 24; i++) { const a = phi + beta + (2 * Math.PI - 2 * beta) * i / 24; out.push([M.x + Math.cos(a) * r1, M.y + Math.sin(a) * r1]); }
    for (let i = 0; i <= 48; i++) { const a = phi - beta + 2 * beta * i / 48; out.push([RA.x + Math.cos(a) * r2, RA.y + Math.sin(a) * r2]); }
    return out;
  };
  const beltS = poly(loop(R_MP + 0.009, R_RP + 0.009)), beltIn = new THREE.Path();
  loop(R_MP + 0.001, R_RP + 0.001).reverse().forEach(([x, y], i) => (i ? beltIn.lineTo(x, y) : beltIn.moveTo(x, y))); beltS.holes.push(beltIn);
  add(drive, new THREE.ExtrudeGeometry(beltS, { depth: 0.028, bevelEnabled: false, curveSegments: 4 }), dark, 0, 0, BELT_Z - 0.014);

  // ---------------------------------------------------------------- the swingarm (two box-section arms, a brace, the
  // pivot) and the coil-over shock from the brace to the frame
  const swingarm = new THREE.Group(); pivot.add(swingarm);
  for (const s of [-1, 1]) {
    barBetween(V(SP.x, SP.y, s * 0.12), V(RA.x + 0.02, RA.y, s * 0.12), 0.065, 0.03, alu, swingarm);
    add(swingarm, K.rbox(THREE, X, 0.07, 0.05, 0.035, 0.01), alu, RA.x, RA.y, s * 0.12);
  }
  add(swingarm, K.rbox(THREE, X, 0.06, 0.05, 0.24, 0.01), alu, -0.29, 0.41, 0);
  add(swingarm, new THREE.CylinderGeometry(0.024, 0.024, 0.32, 18), steel, SP.x, SP.y, 0).rotation.x = Math.PI / 2;
  const shock = new THREE.Group(); pivot.add(shock);
  const sA = V(-0.3, 0.43), sB = V(-0.2, 0.7), sd = sB.clone().sub(sA), sL = sd.length(), sn = sd.clone().normalize();
  tubeBetween(sA, sA.clone().addScaledVector(sn, sL * 0.55), 0.016, steel, shock);
  tubeBetween(sA.clone().addScaledVector(sn, sL * 0.4), sB, 0.022, alu, shock);
  const hel = []; const side = V(-sn.y, sn.x, 0), zax = V(0, 0, 1);
  for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2 * 9, k = 0.12 + 0.68 * i / 120; hel.push(sA.clone().addScaledVector(sn, sL * k).addScaledVector(side, Math.cos(a) * 0.032).addScaledVector(zax, Math.sin(a) * 0.032)); }
  add(shock, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hel), 360, 0.0055, 6, false), caliperM);

  // ---------------------------------------------------------------- a wheel: a cast rim (barrel, flanges, five split
  // spokes, the hub) and a tyre turned from its real section; the rear carries the pulley's hub carrier
  const wheel = (at, R, w, rear) => {
    const g = new THREE.Group(); g.position.copy(at);
    const spin = new THREE.Group(); g.add(spin);
    const H = R - 0.216, hw = w / 2;
    const sec = [[0, -0.40], [0.25, -0.49], [0.5, -0.5], [0.75, -0.45], [0.9, -0.34], [0.975, -0.19], [1, 0], [0.975, 0.19], [0.9, 0.34], [0.75, 0.45], [0.5, 0.5], [0.25, 0.49], [0, 0.40]];
    const sp = new THREE.SplineCurve(sec.map(([r, y]) => new THREE.Vector2(0.212 + r * (H + 0.004), y * w))).getPoints(40);
    add(spin, lathe(sp.map((p) => [p.x, p.y]), 72), tyreM);
    const rimW = hw * 0.82;
    add(spin, lathe([[0.226, -rimW], [0.226, -rimW + 0.01], [0.214, -rimW + 0.014], [0.214, rimW - 0.014], [0.226, rimW - 0.01], [0.226, rimW], [0.196, rimW], [0.19, 0], [0.196, -rimW], [0.226, -rimW]], 72), rimM);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 + 0.2, P = (r, da = 0) => V(Math.cos(a + da) * r, Math.sin(a + da) * r);
      barBetween(P(0.05), P(0.13), 0.026, 0.024, rimM, spin);
      for (const s of [-1, 1]) barBetween(P(0.125), P(0.2, s * 0.16), 0.018, 0.02, rimM, spin);
    }
    add(spin, new THREE.CylinderGeometry(0.062, 0.062, w * 0.62, 32), rimM).rotation.x = Math.PI / 2;
    add(spin, new THREE.CylinderGeometry(0.016, 0.016, w + 0.12, 14), steel).rotation.x = Math.PI / 2;
    if (rear) add(spin, new THREE.CylinderGeometry(0.07, 0.07, BELT_Z - 0.09, 28), alu, 0, 0, (BELT_Z + 0.09) / 2 - 0.01).rotation.x = Math.PI / 2;
    pivot.add(g);
    return { g, spin };
  };
  const rear = wheel(RA, 0.315, 0.18, true), front = wheel(FA, 0.3, 0.12, false);

  // ---------------------------------------------------------------- brake discs: twin 320 mm front discs inside the fork
  // legs, a 240 mm rear disc on the left; drilled rings on carriers, each with its caliper
  const brake_discs = new THREE.Group(); pivot.add(brake_discs);
  const discAt = (at, r, zs, calA) => {
    const g = new THREE.Group(); g.position.copy(at); brake_discs.add(g);
    const sp = new THREE.Group(); g.add(sp);
    for (const z of zs) {
      const ring = new THREE.Shape(); ring.absarc(0, 0, r, 0, Math.PI * 2, false); ring.holes.push(circle(r - 0.045, 0, 0, true));
      for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2; ring.holes.push(circle(0.0035, Math.cos(a) * (r - 0.022 + (i % 2) * 0.012), Math.sin(a) * (r - 0.022 + (i % 2) * 0.012), true)); }
      add(sp, new THREE.ExtrudeGeometry(ring, { depth: 0.005, bevelEnabled: false, curveSegments: 48 }), steel, 0, 0, z - 0.0025);
      const car = new THREE.Shape(); car.absarc(0, 0, r - 0.043, 0, Math.PI * 2, false); car.holes.push(circle(0.05, 0, 0, true));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; car.holes.push(circle(0.022, Math.cos(a) * (r - 0.08), Math.sin(a) * (r - 0.08), true)); }
      add(sp, new THREE.ExtrudeGeometry(car, { depth: 0.006, bevelEnabled: false, curveSegments: 40 }), alu, 0, 0, z - 0.003);
      const cal = add(g, K.rbox(THREE, X, 0.1, 0.045, 0.04, 0.012), caliperM, Math.cos(calA) * (r - 0.02), Math.sin(calA) * (r - 0.02), z);
      cal.rotation.z = calA + Math.PI / 2;
    }
    return { g, sp };
  };
  const fDisc = discAt(FA, 0.16, [-0.072, 0.072], Math.PI - RAKE - 0.15), rDisc = discAt(RA, 0.12, [-0.115], 0.25 * Math.PI);

  // ---------------------------------------------------------------- the fork: upside-down legs (thick tubes above,
  // stanchions below), two triple clamps, the axle feet, the front fender and the headlight
  const fork = new THREE.Group(); pivot.add(fork);
  for (const s of [-1, 1]) {
    const z = V(0, 0, s * 0.1);
    tubeBetween(fk(0.03).add(z), fk(0.36).add(z), 0.025, steel, fork, 20);
    tubeBetween(fk(0.3).add(z), fk(0.8).add(z), 0.031, alu, fork, 20);
    const foot = add(fork, K.rbox(THREE, X, 0.07, 0.09, 0.04, 0.012), alu, FA.x, FA.y + 0.02, s * 0.1); foot.rotation.z = RAKE;
  }
  for (const sv of [0.53, 0.7]) { const c = add(fork, K.rbox(THREE, X, 0.1, 0.035, 0.27, 0.012), alu, fk(sv).x - 0.02, fk(sv).y - 0.006, 0); c.rotation.z = RAKE; }
  const fFend = add(fork, new THREE.CylinderGeometry(0.33, 0.33, 0.13, 40, 1, true, 105 * Math.PI / 180, 100 * Math.PI / 180), fenderM, FA.x, FA.y, 0); fFend.rotation.x = Math.PI / 2;
  const hl = add(fork, new THREE.CylinderGeometry(0.085, 0.078, 0.075, 40), bodyM, 0.585, 0.83, 0); hl.rotation.z = -Math.PI / 2 + 0.2;
  const hlLens = add(fork, new THREE.CylinderGeometry(0.074, 0.074, 0.01, 40), lens, 0.624, 0.822, 0); hlLens.rotation.z = -Math.PI / 2 + 0.2;
  add(fork, new THREE.CylinderGeometry(0.055, 0.055, 0.004, 32), K.mat(ctx, THREE, "screen", "glow", opts), 0.62, 0.823, 0).rotation.z = -Math.PI / 2 + 0.2;
  tubeBetween(V(0.585, 0.83), fk(0.58).add(V(-0.01, 0)), 0.012, alu, fork);
  const dash = add(fork, K.rbox(THREE, X, 0.03, 0.09, 0.15, 0.01), bodyM, fk(0.75).x + 0.03, fk(0.75).y + 0.02, 0); dash.rotation.z = 0.7;

  // ---------------------------------------------------------------- the seat; the bars with grips (the right one is the
  // throttle), levers and mirrors
  const seat = new THREE.Group(); pivot.add(seat);
  add(seat, K.extrude(THREE, poly([[-0.04, 0.8], [-0.66, 0.845], [-0.69, 0.885], [-0.46, 0.875], [-0.22, 0.86], [-0.08, 0.855], [-0.03, 0.83]]), 0.22, 0.03), seatM);
  const handlebar = new THREE.Group(); pivot.add(handlebar);
  const top = fk(0.72);
  for (const s of [-1, 1]) tubeBetween(top.clone().add(V(0, 0, s * 0.04)), V(top.x - 0.015, 0.995, s * 0.04), 0.014, alu, handlebar);
  curve([V(0.36, 1.03, -0.4), V(0.4, 1.005, -0.22), V(0.415, 0.995, 0), V(0.4, 1.005, 0.22), V(0.36, 1.03, 0.4)], 0.0125, steel, handlebar);
  const grips = {};
  for (const s of [-1, 1]) {
    const gp = new THREE.Group(); gp.position.set(0.37, 1.026, s * 0.335); gp.rotation.y = s * 0.3; handlebar.add(gp);
    add(gp, new THREE.CylinderGeometry(0.017, 0.017, 0.12, 16), dark).rotation.x = Math.PI / 2;
    add(gp, new THREE.BoxGeometry(0.012, 0.012, 0.03), K.mat(ctx, THREE, "ui", "plastic", opts), 0.019, 0, s * -0.03);
    grips[s] = gp;
    const lev = add(handlebar, K.rbox(THREE, X, 0.012, 0.016, 0.16, 0.004), alu, 0.43, 1.0, s * 0.3); lev.rotation.y = -s * 0.35;
    tubeBetween(V(0.405, 1.005, s * 0.22), V(0.39, 1.16, s * 0.31), 0.006, steel, handlebar);
    const mir = add(handlebar, new THREE.CylinderGeometry(0.055, 0.055, 0.018, 28), bodyM, 0.39, 1.17, s * 0.32); mir.rotation.z = Math.PI / 2; mir.scale.set(1, 1, 0.65);
  }

  // ---------------------------------------------------------------- keys
  const st = { spin: 0, throttle: 0, open_pack: 0, explode: 0 };
  const home = new Map();
  const at = (o) => { if (!home.has(o)) home.set(o, o.position.clone()); return home.get(o); };
  const put = (o, dx = 0, dy = 0, dz = 0) => { const h = at(o); o.position.set(h.x + dx, h.y + dy, h.z + dz); };
  [tank_cover, battery_pack, pack_cover, controller, seat, motor, motor_cover, rotor, drive, fork, handlebar, front.g, rear.g, fDisc.g, rDisc.g].forEach(at);
  const apply = () => {
    rear.spin.rotation.z = -st.spin; front.spin.rotation.z = -st.spin; fDisc.sp.rotation.z = -st.spin; rDisc.sp.rotation.z = -st.spin;
    rp.rotation.z = -st.spin; mp.rotation.z = -st.spin * RATIO; rotor.rotation.z = -st.spin * RATIO;
    grips[1].rotation.z = -0.9 * st.throttle;
    const glow = 1.4 * K.clamp(st.throttle);
    cableM.emissiveIntensity = glow; copper.emissiveIntensity = 0.8 * glow;
    const e = K.easeInOut(st.explode), oc = K.easeInOut(Math.max(st.open_pack, K.clamp(st.explode * 3)));
    pack_cover.rotation.x = -1.75 * oc; put(pack_cover, 0, 0, 0.012 * oc);
    put(tank_cover, 0, 0.46 * e);
    put(battery_pack, 0, 0.3 * e);
    put(controller, -0.2 * e, 0.36 * e);
    put(seat, -0.12 * e, 0.42 * e);
    put(motor, 0, -0.03 * e, 0.26 * e); put(motor_cover, 0, 0, 0.22 * e); put(rotor, 0, 0, 0.12 * e);
    put(drive, 0, -0.02 * e, 0.5 * e);
    put(fork, 0.24 * e); put(handlebar, 0.24 * e, 0.1 * e);
    put(front.g, 0.42 * e); put(fDisc.g, 0.42 * e);
    put(rear.g, -0.3 * e); put(rDisc.g, -0.3 * e);
    phase_cables.visible = e < 0.02;
  };
  apply();
  return {
    group, size: [2.06, 1.17, 0.8],
    parts: { frame, bodywork, tank_cover, battery_pack, pack_cover, cells, controller, phase_cables, motor, motor_cover, stator, rotor, drive, swingarm, shock, rear_wheel: rear.g, front_wheel: front.g, fork, seat, handlebar, brake_discs },
    keys: ["spin", "throttle", "open_pack", "explode", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key in st) { st[key] = Number(v) || 0; apply(); }
    },
  };
}
