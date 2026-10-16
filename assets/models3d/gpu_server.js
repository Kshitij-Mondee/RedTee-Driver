// @model {"id": "gpu_server", "pack": "datacentre", "what": "a generic 8-accelerator AI server lying flat with its lid removable: a front fan wall, eight identical accelerator modules in two rows of four on one baseboard linked all-to-all through a row of switch chips, a CPU board with two sockets and memory on a shelf at the rear, power supplies and a network card bay; air-cooled (tall finned heatsinks, many fans) or liquid-cooled (flat cold plates on supply and return manifolds, fewer fans, a shorter chassis)", "parts": ["chassis", "lid", "fan_wall", "accelerator_tray", "switch_chips", "cpu_board", "psus", "nic_bay", "heatsinks", "cold_plates", "manifold", "airflow", "coolant"], "keys": {"lid": "0 on .. 1 lifted away", "explode": "0 assembled .. 1 the power supplies and the CPU board rise off the accelerator tray (the lid lifts first)", "load": "0..1 the accelerators glow in the warm role, one after another", "airflow": "0..1 cool air enters through the front fans, passes the heatsinks and leaves warm at the back", "flow": "0..1 (liquid form) coolant runs from the rear supply through each cold plate to the rear return, cool turning warm", "fail": "index 0..7 of a module that turns to the alert role (-1 for none)", "t": "seconds; moves the air and coolant and spins the fans (call every frame)", "turn": "radians about y"}, "best_for": ["what is inside an AI training server", "eight accelerators on one baseboard linked through switch chips", "air versus liquid cooling of accelerators (opts.cooling)", "one failed accelerator in a server"], "not_for": ["consumer graphics cards with fans and display outputs (never)", "a single chip close up (use accelerator_chip)", "a whole rack (use server_rack)"], "size": [4.8, 1.9, 7.6], "sheet": {"opts": {"cooling": "air"}, "mood": "clean_bench", "elevation": 32, "states": [{"key": "t", "from": 0, "to": 6, "at": 0, "dur": 6}, {"key": "lid", "from": 0, "to": 1, "at": 0.5, "dur": 0.8}, {"key": "load", "from": 0, "to": 1, "at": 1.4, "dur": 0.9}, {"key": "airflow", "from": 0, "to": 1, "at": 2.2, "dur": 0.4}, {"key": "fail", "before": -1, "value": 5, "at": 3.0}, {"key": "explode", "from": 0, "to": 1, "at": 3.9, "dur": 1.0}]}}
// The front (+z) is the intake: air always runs front to back. The eight modules are identical and sit on one
// baseboard; the traces drawn from every module to every switch chip are the all-to-all links. No maker shapes, no
// words. opts.cooling: "air" (default) | "liquid". Supply is the cool role and return the warm role.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const liquid = opts.cooling === "liquid";
  const W = 4.4, D = 7.6, HC = liquid ? 1.3 : 1.9, YS = 0.72, T = 0.05;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const M = (role, kind, extra) => K.mat(ctx, THREE, role, kind, opts, Object.assign({ specularIntensity: 0.35 }, extra || {}));
  const box = (w, h, d, x, y, z, m, parent, r = 0.01) => { const o = K.mesh(THREE, K.rbox(THREE, X, w, h, d, r, 2), m); o.position.set(x, y, z); parent.add(o); return o; };
  const shell = M("casing", "metal", { roughness: 0.45, metalness: 0.5 }), metal = M("metal", "metal", { roughness: 0.35 }), trim = M("trim", "plastic");
  const dm = new THREE.Object3D();

  // chassis: a pan, two side walls, a rear panel with supply and port faces, rack ears at the front
  const chassis = new THREE.Group(); pivot.add(chassis);
  box(W, T, D, 0, T / 2, 0, shell, chassis);
  for (const s of [-1, 1]) {
    box(T, HC, D, s * (W / 2 - T / 2), HC / 2, 0, shell, chassis);
    box(0.2, HC * 0.9, 0.04, s * (W / 2 + 0.1), HC * 0.48, D / 2 - 0.05, shell, chassis);
  }
  const rf = K.face(ctx, THREE, 880, Math.round(880 * HC / W));
  rf.draw((g, w, h) => {
    const u = w / W, py = (y) => h - y * u;
    g.fillStyle = K.hexOf(ctx, "casing", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "shadow", opts);
    for (let i = 0; i < 4; i++) { K.rr(g, (0.3 + i * 0.85) * u, py(0.55), 0.7 * u, 0.42 * u, 4); g.fill(); }        // supply faces
    for (let i = 0; i < 8; i++) { K.rr(g, (0.3 + i * 0.48) * u, py(YS + 0.5), 0.36 * u, 0.22 * u, 3); g.fill(); }  // network ports
    g.fillStyle = K.hexOf(ctx, "metal", opts);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { K.rr(g, (0.34 + i * 0.48 + j * 0.15) * u, py(YS + 0.44), 0.12 * u, 0.1 * u, 2); g.fill(); }
  });
  const rear = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * T, HC, T), [shell, shell, shell, shell, shell, new THREE.MeshStandardMaterial({ map: rf.tex, roughness: 0.5, metalness: 0.3 })]);
  rear.position.set(0, HC / 2, -D / 2 + T / 2); chassis.add(rear);

  // fan wall just behind the front: two rows of five (air) or one row of five (liquid), blades spin with t
  const fan_wall = new THREE.Group(); pivot.add(fan_wall);
  const fanRows = liquid ? 1 : 2, fanN = 5, FS = Math.min(0.8, (HC - 0.2) / fanRows), FZ = D / 2 - 0.3, blades = [];
  const fanFrame = M("casing2", "plastic"), bladeMat = M("casing", "plastic"), ringMat = M("metal", "metal");
  for (let r = 0; r < fanRows; r++) for (let i = 0; i < fanN; i++) {
    const x = (i - (fanN - 1) / 2) * (W - 0.2) / fanN, y = 0.1 + FS / 2 + r * FS;
    box(FS * 0.96, FS * 0.96, 0.32, x, y, FZ, fanFrame, fan_wall, 0.04);
    const ring = K.mesh(THREE, new THREE.TorusGeometry(FS * 0.4, 0.02, 8, 32), ringMat); ring.position.set(x, y, FZ + 0.17); fan_wall.add(ring);
    const rot = new THREE.Group(); rot.position.set(x, y, FZ + 0.165); fan_wall.add(rot); blades.push(rot);
    const hub = K.mesh(THREE, new THREE.CylinderGeometry(FS * 0.12, FS * 0.12, 0.05, 20), bladeMat); hub.rotation.x = Math.PI / 2; rot.add(hub);
    for (let b = 0; b < 5; b++) { const bl = K.mesh(THREE, K.rbox(THREE, X, FS * 0.12, FS * 0.34, 0.012, 0.005, 2), bladeMat, false); const a = b / 5 * Math.PI * 2; bl.position.set(Math.cos(a) * FS * 0.2, Math.sin(a) * FS * 0.2, 0); bl.rotation.set(0.35, 0, a - Math.PI / 2); rot.add(bl); }
  }

  // the accelerator tray: one baseboard, eight identical modules (two rows of four), a row of switch chips between
  const accelerator_tray = new THREE.Group(); pivot.add(accelerator_tray);
  const PITCH = 1.0, MW = 0.86, MD = 1.0, rowZ = [2.0, -0.1], swZ = 0.95, NSW = 4, BZ0 = 2.65, BZ1 = -0.75;
  const modX = (i) => (i % 4 - 1.5) * PITCH, modZ = (i) => rowZ[Math.floor(i / 4)], swX = (j) => (j - (NSW - 1) / 2) * 0.95;
  const bbf = K.face(ctx, THREE, 800, Math.round(800 * (BZ0 - BZ1) / (W - 0.2)));
  bbf.draw((g, w, h) => {
    const u = w / (W - 0.2), px = (x) => (x + (W - 0.2) / 2) * u, pz = (z) => (BZ0 - z) * u;
    g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h);
    g.strokeStyle = K.hexOf(ctx, "ui2", opts); g.globalAlpha = 0.55; g.lineWidth = 3;
    for (let i = 0; i < 8; i++) for (let j = 0; j < NSW; j++) {                  // all-to-all: every module to every switch chip
      g.beginPath(); g.moveTo(px(modX(i)), pz(modZ(i) + (i < 4 ? -MD / 2 : MD / 2))); g.lineTo(px(swX(j)), pz(swZ)); g.stroke();
    }
    g.globalAlpha = 1;
  });
  const baseboard = box(W - 0.2, 0.05, BZ0 - BZ1, 0, T + 0.025, (BZ0 + BZ1) / 2, new THREE.MeshPhysicalMaterial({ map: bbf.tex, roughness: 0.8, specularIntensity: 0.3 }), accelerator_tray, 0.005);
  const YB = T + 0.05;
  const glowMats = [], heatsinks = new THREE.Group(), cold_plates = new THREE.Group(), modules = [];
  accelerator_tray.add(heatsinks, cold_plates);
  const HS = HC - YB - 0.22;                       // heatsink height (air)
  const nFin = 14, finMat = new THREE.MeshPhysicalMaterial({ roughness: 0.4, metalness: 0.55, specularIntensity: 0.35 }), fins = liquid ? null : new THREE.InstancedMesh(new THREE.BoxGeometry(0.016, HS - 0.12, MD * 0.94), finMat, 8 * nFin);
  for (let i = 0; i < 8; i++) {
    const x = modX(i), z = modZ(i), mod = new THREE.Group(); accelerator_tray.add(mod); modules.push(mod);
    box(MW, 0.04, MD, x, YB + 0.02, z, trim, mod, 0.006);                                     // module board
    const gm = M("metal", liquid ? "metal" : "matte", { emissive: K.col(ctx, "warm", opts), emissiveIntensity: 0 }); glowMats.push(gm);
    if (!liquid) {
      box(MW * 0.94, 0.1, MD * 0.94, x, YB + 0.09, z, gm, heatsinks, 0.008);                   // heatsink base
      for (let f = 0; f < nFin; f++) { dm.position.set(x - MW * 0.44 + (f + 0.5) * MW * 0.88 / nFin, YB + 0.14 + (HS - 0.12) / 2, z); dm.updateMatrix(); fins.setMatrixAt(i * nFin + f, dm.matrix); }
      box(MW * 0.94, 0.05, 0.05, x, YB + HS + 0.02, z + MD * 0.47 - 0.025, gm, heatsinks, 0.006);   // a lip on the fins' front edge (glows with load)
    } else {
      box(MW * 0.82, 0.12, MD * 0.8, x, YB + 0.1, z, metal, cold_plates, 0.02);                // cold plate
      box(MW * 0.6, 0.012, MD * 0.55, x, YB + 0.166, z, gm, cold_plates, 0.004);              // its top (glows with load)
      for (const dz of [0.25, -0.25]) { const c = K.mesh(THREE, new THREE.CylinderGeometry(0.045, 0.05, 0.12, 14), metal); c.position.set(x + 0.28, YB + 0.21, z + dz); cold_plates.add(c); }
    }
  }
  if (fins) heatsinks.add(fins);
  const switch_chips = new THREE.Group(); accelerator_tray.add(switch_chips);
  for (let j = 0; j < NSW; j++) {
    box(0.42, 0.04, 0.42, swX(j), YB + 0.02, swZ, trim, switch_chips, 0.006);
    box(0.36, liquid ? 0.12 : 0.3, 0.36, swX(j), YB + 0.04 + (liquid ? 0.06 : 0.15), swZ, metal, switch_chips, 0.01);
  }

  // power supplies at the lower rear, the CPU board on a shelf above them, network cards at its rear edge
  const psus = new THREE.Group(); pivot.add(psus);
  for (let i = 0; i < 4; i++) box(0.72, 0.42, 2.4, -W / 2 + 0.3 + 0.35 + i * 0.85, T + 0.22, -D / 2 + 0.06 + 1.2, M("casing2", "plastic"), psus, 0.02);
  const cpu_board = new THREE.Group(); pivot.add(cpu_board);
  const CZ0 = -0.85, CZ1 = -D / 2 + 0.07, CZ = (CZ0 + CZ1) / 2;
  box(W - 0.12, 0.04, CZ0 - CZ1, 0, YS, CZ, M("casing2", "matte"), cpu_board, 0.005);
  box(W - 0.4, 0.03, CZ0 - CZ1 - 0.3, 0, YS + 0.035, CZ + 0.05, M("paper2", "matte"), cpu_board, 0.005);
  const dimms = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.32, 1.0), M("casing", "plastic"), 32);
  let di = 0;
  for (const sx of [-1, 1]) {
    const cx = sx * 1.05, cz = CZ + 0.35;
    box(0.75, 0.05, 0.75, cx, YS + 0.07, cz, trim, cpu_board, 0.01);                            // socket
    for (let f = 0; f < 9; f++) box(0.025, 0.36, 0.62, cx - 0.28 + f * 0.07, YS + 0.28, cz, metal, cpu_board, 0.004);
    for (const side of [-1, 1]) for (let k = 0; k < 8; k++) { dm.position.set(cx + side * (0.5 + k * 0.06), YS + 0.21, cz); dm.updateMatrix(); dimms.setMatrixAt(di++, dm.matrix); }
  }
  cpu_board.add(dimms);
  const nic_bay = new THREE.Group(); cpu_board.add(nic_bay);
  for (let i = 0; i < 8; i++) box(0.05, 0.34, 0.7, -W / 2 + 0.42 + i * 0.48, YS + 0.24, -D / 2 + 0.45, M("casing2", "plastic", { roughness: 0.7 }), nic_bay, 0.005);

  // liquid: supply and return manifolds along the right wall, a branch to every cold plate (translucent, so the
  // coolant shows); the coolant paths follow the same routes
  const manifold = new THREE.Group(); pivot.add(manifold);
  const coolPaths = [];
  let coolant = null;
  if (liquid) {
    const glass = (role) => K.mat(ctx, THREE, role, "glass", opts, { opacity: 0.45, depthWrite: false });
    const tube = (pts, role, r) => { const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.05); const m = new THREE.Mesh(new THREE.TubeGeometry(c, Math.max(12, pts.length * 10), r, 10, false), glass(role)); m.renderOrder = 3; manifold.add(m); };
    const xs = W / 2 - 0.22, xr = W / 2 - 0.42, ys = YB + 0.42, yr = YB + 0.52, zEnd = -D / 2 - 0.25;
    tube([[xs, ys, zEnd], [xs, ys, rowZ[0] + 0.62]], "cool", 0.06); tube([[xr, yr, zEnd], [xr, yr, rowZ[0] - 0.62]], "warm", 0.06);
    for (let i = 0; i < 8; i++) {
      const x = modX(i), z = modZ(i), zf = z + 0.62, zb = z - 0.62;
      const sup = [[xs, ys, zf], [x + 0.28, ys, zf], [x + 0.28, YB + 0.3, z + 0.25]], ret = [[x + 0.28, YB + 0.3, z - 0.25], [x + 0.28, yr, zb], [xr, yr, zb]];
      tube(sup, "cool", 0.035); tube(ret, "warm", 0.035);
      coolPaths.push([[xs, ys, zEnd], ...sup, [x, YB + 0.12, z + 0.2], [x, YB + 0.12, z - 0.2], ...ret, [xr, yr, zEnd]]);
    }
    for (const [x, y, role] of [[xs, ys, "cool"], [xr, yr, "warm"]]) { const q = K.mesh(THREE, new THREE.CylinderGeometry(0.1, 0.1, 0.16, 18), M(role, "plastic")); q.rotation.x = Math.PI / 2; q.position.set(x, y, -D / 2 - 0.08); manifold.add(q); }
    coolant = K.flow(ctx, THREE, { paths: coolPaths, count: coolPaths.length * 9, size: 0.04, from: "cool", to: "warm", heat: true });
    coolant.group.children.forEach((m) => { m.renderOrder = 4; }); pivot.add(coolant.group);
  }

  // air: in through the fans at the front, across the tray (and over the CPU board), out of the rear warm
  const airPaths = [];
  for (const x of [-1.5, -0.5, 0.5, 1.5]) for (const y of liquid ? [0.45] : [0.5, 1.15]) airPaths.push([[x, y, D / 2 + 0.9], [x, y, D / 2 - 0.2], [x, y, -0.9], [x, Math.min(y, YS - 0.15), -1.3], [x, Math.min(y, YS - 0.15), -D / 2], [x, Math.min(y, YS - 0.15), -D / 2 - 0.9]]);
  for (const x of [-1.0, 1.0]) airPaths.push([[x, YS + 0.45, D / 2 + 0.9], [x, YS + 0.45, -D / 2 - 0.9]]);
  const air = K.flow(ctx, THREE, { paths: airPaths, count: airPaths.length * 9, size: 0.07, from: "cool", to: "warm", heat: true });
  pivot.add(air.group);

  // the lid
  const lidMat = M("casing", "metal", { roughness: 0.45, metalness: 0.5, transparent: true, opacity: 1 });
  const lid = box(W, 0.04, D, 0, HC + 0.02, 0, lidMat, pivot, 0.01);
  group.add(K.contactShadow(ctx, THREE, W * 1.5, D * 1.25, 0.45));

  const st = { lid: 0, explode: 0, load: 0, airflow: 0, flow: 0, fail: -1, t: 0 };
  const cWarm = K.col(ctx, "warm", opts), cBad = K.col(ctx, "bad", opts), cMetal = K.col(ctx, "metal", opts), cFin = K.col(ctx, "paper", opts), tmp = new THREE.Color();
  const apply = () => {
    const lk = K.easeInOut(Math.max(st.lid, K.clamp(st.explode * 3)));
    lid.position.set(0, HC + 0.02 + lk * 2.6, -lk * 2.5); lid.rotation.x = -0.25 * lk;
    lidMat.opacity = 1 - K.clamp((lk - 0.55) / 0.45); lidMat.depthWrite = lk < 0.5; lid.visible = lk < 0.999;
    const e = K.easeInOut(st.explode);
    psus.position.y = 1.5 * e; cpu_board.position.y = 2.9 * e;
    glowMats.forEach((gm, i) => {
      const k = K.clamp(st.load * 8 - i * 0.9), bad = i === st.fail;
      gm.color.copy(cMetal).lerp(bad ? cBad : cWarm, bad ? 1 : k); gm.emissive.copy(bad ? cBad : cWarm);
      gm.emissiveIntensity = bad ? 0.9 + 0.5 * Math.sin(st.t * 7) : 0.75 * k;
    });
    if (fins) {
      for (let i = 0; i < 8; i++) { const k = K.clamp(st.load * 8 - i * 0.9), bad = i === st.fail; tmp.copy(cFin).lerp(bad ? cBad : cWarm, bad ? 1 : k * 0.85); for (let f = 0; f < nFin; f++) fins.setColorAt(i * nFin + f, tmp); }
      fins.instanceColor.needsUpdate = true;
    }
    blades.forEach((b, i) => { b.rotation.z = st.t * 9 + i * 0.7; });
    air.set(st.t * 0.22, st.airflow);
    if (coolant) coolant.set(st.t * 0.13, st.flow);
  };
  apply();
  return {
    group, size: [W + 0.4, HC, D], parts: { chassis, lid, fan_wall, accelerator_tray, switch_chips, cpu_board, psus, nic_bay, heatsinks, cold_plates, manifold, airflow: air.group, coolant: coolant ? coolant.group : null },
    keys: ["lid", "explode", "load", "airflow", "flow", "fail", "t", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "t") { st.t = Number(v) || 0; apply(); return; }
      if (key === "fail") { st.fail = v == null ? -1 : Math.round(Number(v)); apply(); return; }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
