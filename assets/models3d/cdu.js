// @model {"id": "cdu", "pack": "datacentre", "what": "a generic coolant distribution unit: a floor-standing cabinet whose door (with a control display) opens on a reservoir, two pumps, a filter, valves and a plate heat exchanger; two separate loops, the facility (primary) loop on the right and the technology (secondary) loop to the racks on the left, meet only across the exchanger plates; four pipe ends on top", "parts": ["cabinet", "door", "display", "pumps", "heat_exchanger", "reservoir", "filter", "valves", "pipes_primary", "pipes_secondary"], "keys": {"door": "0 closed .. 1 swung open", "primary": "0..1 facility water flows in, through the exchanger and back out (needs t)", "secondary": "0..1 coolant flows from the racks' return through the reservoir, a pump, the exchanger and the filter, back to the racks (needs t)", "heat": "0..1 the secondary return warms in colour and heat crosses the exchanger plates into the primary", "pump_swap": "0..1 pump A stops and pump B takes over (redundancy)", "t": "seconds; moves the coolant and spins the pumps (call every frame)", "turn": "radians about y"}, "best_for": ["liquid cooling: how heat leaves the racks' coolant loop for facility water", "two loops that never mix (a heat exchanger between them)", "pump redundancy"], "not_for": ["the cold plate on a chip (use accelerator_chip)", "a room air conditioner"], "size": [1.4, 2.6, 1.2], "sheet": {"opts": {}, "mood": "clean_bench", "elevation": 14, "turn": 0.7, "states": [{"key": "t", "from": 0, "to": 6, "at": 0, "dur": 6}, {"key": "door", "from": 0, "to": 1, "at": 0.5, "dur": 0.8}, {"key": "secondary", "from": 0, "to": 1, "at": 1.3, "dur": 0.4}, {"key": "primary", "from": 0, "to": 1, "at": 1.6, "dur": 0.4}, {"key": "heat", "from": 0, "to": 1, "at": 2.3, "dur": 0.8}, {"key": "pump_swap", "from": 0, "to": 1, "at": 4.0, "dur": 0.6}]}}
// Supply is the cool role and return the warm role on every pipe; the pipes are translucent so the coolant shows. The
// loops share no pipe: heat crosses only through the exchanger plates. Words: opts.screen (a kit3d drawUI spec) on the
// display, and opts.labels {primary_supply, primary_return, secondary_supply, secondary_return} on the pipe ends.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 1.4, H = 2.3, D = 1.2, T = 0.04;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const M = (role, kind, extra) => K.mat(ctx, THREE, role, kind, opts, Object.assign({ specularIntensity: 0.35 }, extra || {}));
  const box = (w, h, d, x, y, z, m, parent, r = 0.012) => { const o = K.mesh(THREE, K.rbox(THREE, X, w, h, d, r, 2), m); o.position.set(x, y, z); parent.add(o); return o; };
  const cyl = (r, h, x, y, z, m, parent, axis = "y", seg = 24) => { const o = K.mesh(THREE, new THREE.CylinderGeometry(r, r, h, seg), m); if (axis === "z") o.rotation.x = Math.PI / 2; if (axis === "x") o.rotation.z = Math.PI / 2; o.position.set(x, y, z); parent.add(o); return o; };
  const shell = M("casing", "plastic", { roughness: 0.55 }), inner = M("casing2", "matte"), metal = M("metal", "metal", { roughness: 0.35 });

  // the cabinet: base, sides, top, back (open at the front behind the door)
  const cabinet = new THREE.Group(); pivot.add(cabinet);
  for (const [w, h, d, x, y, z, m] of [[W, 0.1, D, 0, 0.05, 0, shell], [T, H, D, -W / 2 + T / 2, H / 2, 0, shell], [T, H, D, W / 2 - T / 2, H / 2, 0, shell],
    [W, T, D, 0, H - T / 2, 0, shell], [W - 2 * T, H - 0.1, T, 0, H / 2 + 0.05, -D / 2 + T / 2, inner]]) box(w, h, d, x, y, z, m, cabinet);

  // the door, hinged on the left, with vents and the control display
  const door = new THREE.Group(); door.position.set(-W / 2 + 0.02, 0, D / 2 + 0.02); pivot.add(door);
  box(W - 0.04, H - 0.12, 0.04, (W - 0.04) / 2, H / 2 + 0.03, 0, shell, door);
  const vf = K.face(ctx, THREE, 256, 128);
  vf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "casing", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "shadow", opts); for (let i = 0; i < 10; i++) { K.rr(g, 14 + i * 24, 14, 12, h - 28, 6); g.fill(); } });
  for (const y of [0.45, 0.85]) { const v = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshStandardMaterial({ map: vf.tex, roughness: 0.6 })); v.position.set((W - 0.04) / 2, y, 0.022); door.add(v); }
  const sf = K.face(ctx, THREE, 600, 420);
  sf.draw((g, w, h) => K.drawUI(ctx, opts.screen || { kind: "blank" }, g, w, h, opts), JSON.stringify(opts.screen || {}));
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshBasicMaterial({ map: sf.tex, toneMapped: false }));
  display.position.set((W - 0.04) / 2 + 0.1, 1.75, 0.023); door.add(display);
  box(0.03, 0.26, 0.04, W - 0.12, 1.2, 0.04, metal, door, 0.01);

  // parts inside: reservoir (left, secondary side), filter, two pumps at the bottom, the plate exchanger in the middle
  const reservoir = cyl(0.15, 0.8, -0.42, 1.45, -0.1, M("paper2", "plastic"), pivot, "y", 32);
  for (const y of [1.05, 1.85]) cyl(0.16, 0.04, -0.42, y, -0.1, metal, pivot);
  const filter = cyl(0.075, 0.3, -0.42, 0.72, 0.22, M("trim", "plastic"), pivot, "y", 24);
  const pumps = new THREE.Group(); pivot.add(pumps);
  const pumpX = [-0.32, 0.3], rotors = [], pumpLeds = [], motorMats = [];
  pumpX.forEach((x) => {
    box(0.42, 0.04, 0.5, x, 0.12, 0.05, metal, pumps, 0.01);
    const motorMat = M("ui2", "plastic"); motorMats.push(motorMat);
    cyl(0.12, 0.3, x, 0.3, -0.05, motorMat, pumps, "z", 28);                       // motor (its colour dims when stopped)
    cyl(0.16, 0.1, x, 0.3, 0.16, metal, pumps, "z", 32);                           // volute
    const rot = new THREE.Group(); rot.position.set(x, 0.3, 0.215); pumps.add(rot); rotors.push(rot);
    for (let b = 0; b < 4; b++) { const bl = K.mesh(THREE, K.rbox(THREE, X, 0.04, 0.2, 0.012, 0.005, 2), M("casing", "plastic"), false); bl.rotation.z = b * Math.PI / 4 * 2; rot.add(bl); }
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 10), new THREE.MeshStandardMaterial({ color: K.col(ctx, "trim", opts), emissive: K.col(ctx, "ok", opts), emissiveIntensity: 0 }));
    led.position.set(x + 0.15, 0.45, 0.1); pumps.add(led); pumpLeds.push(led);
  });
  const heat_exchanger = new THREE.Group(); pivot.add(heat_exchanger);
  const HX0 = -0.12, HX1 = 0.32, HY0 = 0.8, HY1 = 1.75, HZ = 0.05, NPL = 16;
  for (const x of [HX0, HX1]) box(0.04, HY1 - HY0 + 0.1, 0.56, x, (HY0 + HY1) / 2, HZ, metal, heat_exchanger, 0.01);
  const plates = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, HY1 - HY0 - 0.04, 0.48), M("paper", "metal", { roughness: 0.3 }), NPL);
  const dm = new THREE.Object3D();
  for (let i = 0; i < NPL; i++) { dm.position.set(HX0 + 0.03 + i * (HX1 - HX0 - 0.06) / (NPL - 1), (HY0 + HY1) / 2, HZ); dm.updateMatrix(); plates.setMatrixAt(i, dm.matrix); }
  heat_exchanger.add(plates);
  for (const y of [HY0 + 0.03, HY1 - 0.03]) for (const z of [HZ - 0.2, HZ + 0.2]) cyl(0.012, HX1 - HX0 + 0.1, (HX0 + HX1) / 2, y, z, metal, heat_exchanger, "x", 10);

  // the loops: translucent pipes, each segment in its role (supply cool, return warm); the routes are the flow paths
  const pipes_primary = new THREE.Group(), pipes_secondary = new THREE.Group(), valves = new THREE.Group(); pivot.add(pipes_primary, pipes_secondary, valves);
  const glass = (role) => K.mat(ctx, THREE, role, "glass", opts, { opacity: 0.5, depthWrite: false });
  const pipe = (pts, role, parent, r = 0.035) => {
    const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.02);
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, pts.length * 14, r, 12, false), glass(role)); m.renderOrder = 3; parent.add(m); return m;
  };
  const TOP = H + 0.3, ZT = -0.32;
  // primary: facility supply in at the top right (cool), up through the exchanger's right side, out at the top (warm)
  const pIn = [[0.34, TOP, ZT], [0.34, 2.0, ZT], [0.52, 1.9, -0.05], [0.52, HY0 + 0.05, HZ + 0.12], [HX1 + 0.02, HY0 + 0.05, HZ + 0.12]];
  const pX = [[HX1 + 0.02, HY0 + 0.05, HZ + 0.12], [HX1 - 0.08, (HY0 + HY1) / 2, HZ], [HX1 + 0.02, HY1 - 0.05, HZ + 0.12]];
  const pOut = [[HX1 + 0.02, HY1 - 0.05, HZ + 0.12], [0.6, HY1 - 0.05, HZ + 0.12], [0.6, 2.0, -0.1], [0.58, 2.05, ZT], [0.58, TOP, ZT]];
  pipe(pIn, "cool", pipes_primary); pipe(pOut, "warm", pipes_primary);
  // secondary: the racks' return in at the top left (warm), reservoir, either pump, into the exchanger's left side,
  // out cooled through the filter and up to the racks' supply (cool)
  const sIn = [[-0.56, TOP, ZT], [-0.56, 2.0, ZT], [-0.42, 1.95, -0.1], [-0.42, 1.85, -0.1]];
  const sRes = [[-0.42, 1.85, -0.1], [-0.42, 1.05, -0.1]];
  const sToPump = (x) => [[-0.42, 1.05, -0.1], [-0.42, 0.95, -0.3], [x, 0.62, -0.3], [x, 0.3, -0.25]];
  const sPump = (x) => [[x, 0.3, -0.25], [x, 0.3, 0.2]];
  const sFromPump = (x) => [[x, 0.3, 0.2], [x, 0.3, 0.32], [x, 0.58, 0.36], [-0.25, 0.62, 0.36], [-0.25, HY1 - 0.05, HZ + 0.14], [HX0 - 0.02, HY1 - 0.05, HZ + 0.14]];
  const sX = [[HX0 - 0.02, HY1 - 0.05, HZ + 0.14], [HX0 + 0.08, (HY0 + HY1) / 2, HZ], [HX0 - 0.02, HY0 + 0.05, HZ + 0.14]];
  const sOut = [[HX0 - 0.02, HY0 + 0.05, HZ + 0.14], [-0.3, HY0 + 0.05, 0.22], [-0.42, 0.88, 0.22], [-0.42, 0.56, 0.22], [-0.56, 0.5, 0.22], [-0.57, 1.0, 0.1], [-0.57, 2.0, -0.05], [-0.3, 2.06, ZT], [-0.3, TOP, ZT]];
  pipe(sIn, "warm", pipes_secondary); pipe(sToPump(pumpX[0]), "warm", pipes_secondary); pipe(sToPump(pumpX[1]), "warm", pipes_secondary);
  pumpX.forEach((x) => pipe(sFromPump(x), "warm", pipes_secondary)); pipe(sOut, "cool", pipes_secondary);
  // pipe ends on top: flanges in their roles, and the caller's words on plates
  const ends = [[-0.56, "warm", "secondary_return"], [-0.3, "cool", "secondary_supply"], [0.34, "cool", "primary_supply"], [0.58, "warm", "primary_return"]];
  const labels = opts.labels || {};
  ends.forEach(([x, role, k]) => {
    cyl(0.06, 0.05, x, TOP, ZT, M(role, "plastic"), valves); cyl(0.05, 0.12, x, H + 0.06, ZT, metal, valves);
    if (labels[k]) { const l = K.label(ctx, THREE, labels[k], { h: 0.09, bg: role, role: "onAccent" }); l.position.set(x, TOP + 0.13, ZT); valves.add(l); }
  });
  for (const [x, y, z, a] of [[0.6, 1.9, -0.06, 0], [-0.42, 0.9, -0.26, 0], [-0.25, 1.2, 0.36, 1]]) {   // handwheel valves
    const v = K.mesh(THREE, new THREE.TorusGeometry(0.06, 0.014, 8, 20), M("trim", "plastic")); v.position.set(x, y, z + 0.06); v.rotation.y = a * Math.PI / 2; valves.add(v);
  }

  // the flows: primary (cool in, warm out), secondary through pump A or B (warm in, cool out), heat across the plates
  const prim = K.flow(ctx, THREE, { paths: [[...pIn, ...pX.slice(1), ...pOut.slice(1)]], count: 26, size: 0.03, from: "cool", to: "warm", heat: true });
  const secPath = (x) => [...sIn, ...sRes.slice(1), ...sToPump(x).slice(1), ...sPump(x).slice(1), ...sFromPump(x).slice(1), ...sX.slice(1), ...sOut.slice(1)];
  const secA = K.flow(ctx, THREE, { paths: [secPath(pumpX[0])], count: 40, size: 0.03, from: "warm", to: "cool", heat: true });
  const secB = K.flow(ctx, THREE, { paths: [secPath(pumpX[1])], count: 40, size: 0.03, from: "warm", to: "cool", heat: true });
  const crossPaths = []; for (let i = 0; i < 6; i++) { const y = HY0 + 0.15 + i * (HY1 - HY0 - 0.3) / 5, z = HZ - 0.15 + (i % 3) * 0.15; crossPaths.push([[HX0 + 0.02, y, z], [HX1 - 0.02, y + 0.03, z]]); }
  const cross = K.flow(ctx, THREE, { paths: crossPaths, count: 18, size: 0.026, from: "warm" });
  for (const f of [prim, secA, secB, cross]) { f.group.children.forEach((m) => { m.renderOrder = 4; }); pivot.add(f.group); }
  group.add(K.contactShadow(ctx, THREE, W * 1.6, D * 1.6, 0.45));

  const st = { door: 0, primary: 0, secondary: 0, heat: 0, pump_swap: 0, t: 0 };
  const cCool = K.col(ctx, "cool", opts), cRun = K.col(ctx, "ui2", opts), cDead = K.col(ctx, "casing2", opts);
  const cooled = (f, heat) => f.group.children.forEach((m) => m.material.color.lerp(cCool, 1 - heat));
  const apply = () => {
    door.rotation.y = -1.9 * K.easeInOut(st.door);
    const s = K.easeInOut(st.pump_swap);
    prim.set(st.t * 0.12, st.primary); cooled(prim, st.heat);
    secA.set(st.t * 0.08, st.secondary * (1 - s)); cooled(secA, st.heat);
    secB.set(st.t * 0.08 + 0.5, st.secondary * s); cooled(secB, st.heat);
    cross.set(st.t * 0.5, st.heat * Math.min(st.primary, st.secondary));
    const run = [st.secondary * (1 - s), st.secondary * s];
    rotors.forEach((r, i) => { r.rotation.z = st.t * 11 * (i ? s : 1 - s); });
    pumpLeds.forEach((l, i) => { l.material.emissiveIntensity = run[i] > 0.05 ? 1.2 : 0; });
    motorMats.forEach((m, i) => { m.color.copy(cDead).lerp(cRun, K.clamp(run[i] * 1.5 + (st.secondary > 0 ? 0 : 1))); });
  };
  apply();
  return {
    group, size: [W, H + 0.3, D], parts: { cabinet, door, display, pumps, heat_exchanger, reservoir, filter, valves, pipes_primary, pipes_secondary },
    keys: ["door", "primary", "secondary", "heat", "pump_swap", "t", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "t") { st.t = Number(v) || 0; apply(); return; }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
