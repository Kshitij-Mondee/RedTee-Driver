// @model {"id": "generator_set", "pack": "datacentre", "what": "a generic containerised standby generator for outdoors (or its own room): an enclosure with louvres and service doors on a fuel tank base and skid, a radiator grille with its fan at one end, a control panel and a status beacon at the other, a roof silencer and exhaust stack with a rain cap, and an output conduit", "parts": ["enclosure", "fuel_tank", "radiator", "fan", "control_panel", "beacon", "exhaust", "output"], "keys": {"start": "0..1 the engine cranks: the beacon blinks, the rain cap lifts and dark puffs leave the stack", "run": "0..1 the set runs and carries load: the beacon is steady, the fan turns, light exhaust, power pulses leave along the output conduit", "t": "seconds; moves the puffs and pulses and turns the fan (call every frame)", "turn": "radians about y"}, "best_for": ["standby power: the generator starts while the UPS carries the load", "a data centre's power yard", "fuel and runtime"], "not_for": ["the UPS (use ups_cabinet) or the whole chain (use the power_path set)", "a portable generator"], "size": [4.8, 3.7, 1.9], "sheet": {"opts": {}, "mood": "clean_bench", "elevation": 16, "turn": 1.2, "states": [{"key": "t", "from": 0, "to": 6, "at": 0, "dur": 6}, {"key": "start", "from": 0, "to": 1, "at": 1.2, "dur": 0.6}, {"key": "run", "from": 0, "to": 1, "at": 2.9, "dur": 0.8}]}}
// Outdoor equipment: a generator belongs outdoors or in its own room, never inside the data hall. Generic shapes, no
// words, no maker shapes. +x is the radiator end, -x the control end; the long side faces +z.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const L = 4.4, Dp = 1.6, TB = 0.36, HE = 1.75;                  // length, depth, tank height, enclosure height
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const body = new THREE.Group(); pivot.add(body);                  // what shakes slightly when it runs
  const M = (role, kind, extra) => K.mat(ctx, THREE, role, kind, opts, Object.assign({ specularIntensity: 0.35 }, extra || {}));
  const box = (w, h, d, x, y, z, m, parent, r = 0.02) => { const o = K.mesh(THREE, K.rbox(THREE, X, w, h, d, r, 2), m); o.position.set(x, y, z); parent.add(o); return o; };
  const cyl = (r, h, x, y, z, m, parent, axis = "y", seg = 28) => { const o = K.mesh(THREE, new THREE.CylinderGeometry(r, r, h, seg), m); if (axis === "x") o.rotation.z = Math.PI / 2; if (axis === "z") o.rotation.x = Math.PI / 2; o.position.set(x, y, z); parent.add(o); return o; };
  const metal = M("metal", "metal", { roughness: 0.35 }), shell = M("casing", "plastic", { roughness: 0.5 });
  const MASK0 = "#" + ctx.neutral(0).getHexString(), MASK1 = "#" + ctx.neutral(1).getHexString();   // alpha masks, not colours

  // the fuel tank base on a skid, with a fill cap and a level gauge
  const fuel_tank = new THREE.Group(); pivot.add(fuel_tank);
  box(L + 0.2, TB, Dp + 0.1, 0, TB / 2 + 0.06, 0, M("casing2", "plastic", { roughness: 0.6 }), fuel_tank, 0.03);
  for (const z of [-1, 1]) box(L + 0.4, 0.08, 0.12, 0, 0.04, z * (Dp / 2 - 0.1), metal, fuel_tank, 0.01);
  cyl(0.07, 0.08, -L / 2 + 0.35, TB + 0.1, Dp / 2 - 0.05, metal, fuel_tank);
  cyl(0.06, 0.02, L / 2 - 0.5, TB / 2 + 0.06, Dp / 2 + 0.06, M("paper2", "plastic"), fuel_tank, "z");

  // the enclosure: walls with louvres and two service doors, a roof
  const enclosure = new THREE.Group(); body.add(enclosure);
  const Y0 = TB + 0.06, YC = Y0 + HE / 2;
  const RD = 0.26;                                                  // the radiator well's depth at the +x end
  box(L - RD, HE, Dp, -RD / 2, YC, 0, shell, enclosure, 0.04);
  for (const [w, h, d, x, y, z] of [[RD, 0.12, Dp, L / 2 - RD / 2, Y0 + HE - 0.06, 0], [RD, 0.12, Dp, L / 2 - RD / 2, Y0 + 0.06, 0],
    [RD, HE, 0.1, L / 2 - RD / 2, YC, Dp / 2 - 0.05], [RD, HE, 0.1, L / 2 - RD / 2, YC, -Dp / 2 + 0.05]]) box(w, h, d, x, y, z, shell, enclosure, 0.015);
  box(L + 0.08, 0.06, Dp + 0.08, 0, Y0 + HE + 0.03, 0, M("casing", "plastic", { roughness: 0.6 }), enclosure, 0.02);
  const lf = K.face(ctx, THREE, 512, 256);
  lf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "casing", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "shadow", opts); for (let i = 0; i < 9; i++) { K.rr(g, 20, 18 + i * 26, w - 40, 12, 6); g.fill(); } });
  const louvre = new THREE.MeshStandardMaterial({ map: lf.tex, roughness: 0.6 });
  for (const s of [-1, 1]) for (const x of [-0.6, 0.9]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), louvre); p.position.set(x, Y0 + HE - 0.45, s * (Dp / 2 + 0.003)); if (s < 0) p.rotation.y = Math.PI; enclosure.add(p); }
  const doorMat = M("casing", "plastic", { roughness: 0.4 }), handle = M("metal", "metal");
  for (const x of [-0.6, 0.9]) {
    const d = box(0.95, HE - 0.75, 0.025, x, Y0 + (HE - 0.75) / 2 + 0.12, Dp / 2 + 0.012, doorMat, enclosure, 0.01);
    box(0.03, 0.18, 0.04, x + 0.38, Y0 + 0.6, Dp / 2 + 0.03, handle, enclosure, 0.008);
  }

  // the radiator end (+x): a grille (an alpha-mapped mesh) with the fan turning behind it
  const radiator = new THREE.Group(); body.add(radiator);
  const af = K.face(ctx, THREE, 256, 256);
  af.draw((g, w, h) => { g.fillStyle = MASK1; g.fillRect(0, 0, w, h); g.fillStyle = MASK0; for (let i = 0; i < 14; i++) g.fillRect(10, 10 + i * 17.5, w - 20, 10); });
  af.tex.colorSpace = THREE.NoColorSpace;
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(Dp - 0.2, HE - 0.24), new THREE.MeshStandardMaterial({ color: K.col(ctx, "metal", opts), alphaMap: af.tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.5 }));
  grille.rotation.y = Math.PI / 2; grille.position.set(L / 2 + 0.006, YC, 0); radiator.add(grille);
  const recess = new THREE.Mesh(new THREE.PlaneGeometry(Dp - 0.2, HE - 0.24), M("shadow", "matte")); recess.rotation.y = Math.PI / 2; recess.position.set(L / 2 - RD + 0.002, YC, 0); radiator.add(recess);
  const fan = new THREE.Group(); fan.position.set(L / 2 - RD / 2, YC, 0); fan.rotation.y = Math.PI / 2; radiator.add(fan);
  const bladeMat = M("trim", "plastic");
  for (let b = 0; b < 6; b++) { const bl = K.mesh(THREE, K.rbox(THREE, X, 0.14, 0.6, 0.02, 0.01, 2), bladeMat, false); const a = b / 6 * Math.PI * 2; bl.position.set(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0); bl.rotation.set(0, 0.4, a - Math.PI / 2); fan.add(bl); }
  cyl(0.09, 0.06, 0, 0, 0, bladeMat, fan, "z");
  // the control end (-x): a panel box with a window and lights, and the beacon on the roof
  const control_panel = new THREE.Group(); body.add(control_panel);
  box(0.12, 0.7, 0.8, -L / 2 - 0.06, Y0 + 1.05, 0.2, M("casing2", "plastic"), control_panel, 0.015);
  const pf = K.face(ctx, THREE, 240, 210);
  const panelLights = [];
  pf.draw((g, w, h) => K.drawUI(ctx, opts.screen || { kind: "blank" }, g, w, h, opts), JSON.stringify(opts.screen || {}));
  const pscr = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.4), new THREE.MeshBasicMaterial({ map: pf.tex, toneMapped: false })); pscr.rotation.y = -Math.PI / 2; pscr.position.set(-L / 2 - 0.125, Y0 + 1.12, 0.25); control_panel.add(pscr);
  for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), new THREE.MeshStandardMaterial({ color: K.col(ctx, "trim", opts), emissive: K.col(ctx, "ok", opts), emissiveIntensity: 0 })); l.position.set(-L / 2 - 0.125, Y0 + 0.8, 0.05 + i * 0.12); control_panel.add(l); panelLights.push(l); }
  const beaconMat = new THREE.MeshStandardMaterial({ color: K.col(ctx, "trim", opts), emissive: K.col(ctx, "warm", opts), emissiveIntensity: 0, roughness: 0.3 });
  const beacon = K.mesh(THREE, K.lathe(THREE, [[0, 0], [0.08, 0], [0.08, 0.1], [0.06, 0.16], [0, 0.17]], 24), beaconMat); beacon.position.set(-L / 2 + 0.3, Y0 + HE + 0.06, Dp / 2 - 0.25); body.add(beacon);

  // exhaust: a roof silencer, a stack and a rain cap that lifts while gas flows
  const exhaust = new THREE.Group(); body.add(exhaust);
  const SX = -L / 2 + 1.0, ytop = Y0 + HE + 0.06;
  cyl(0.2, 1.4, SX + 0.75, ytop + 0.26, -0.25, metal, exhaust, "x", 28);
  for (const x of [SX + 0.2, SX + 1.3]) box(0.08, 0.2, 0.3, x, ytop + 0.1, -0.25, metal, exhaust, 0.01);
  cyl(0.1, 0.65, SX, ytop + 0.55, -0.25, metal, exhaust);
  const capPivot = new THREE.Group(); capPivot.position.set(SX - 0.1, ytop + 0.88, -0.25); exhaust.add(capPivot);
  const cap = K.mesh(THREE, new THREE.CylinderGeometry(0.12, 0.12, 0.02, 24), metal); cap.position.set(0.1, 0, 0); capPivot.add(cap);
  // puffs rise from the stack (spheres grown with height after flow places them)
  const puffPaths = [0, 1, 2].map((i) => [[SX, ytop + 0.9, -0.25], [SX + 0.04 + i * 0.04, ytop + 1.2, -0.25 - 0.04 * i], [SX + 0.22 + i * 0.08, ytop + 1.5, -0.32 + 0.06 * i]]);
  const puffs = K.flow(ctx, THREE, { paths: puffPaths, count: 15, size: 0.06, from: "trim" });
  body.add(puffs.group);

  // the output conduit from the control end, with power pulses when running
  const output = new THREE.Group(); pivot.add(output);
  const outPts = [[-L / 2 + 0.2, TB + 0.06, -Dp / 2 + 0.2], [-L / 2 - 0.25, 0.12, -Dp / 2 + 0.2], [-L / 2 - 0.5, 0.08, -Dp / 2 - 0.1], [-L / 2 - 0.6, 0.08, -Dp / 2 - 0.6]];
  const oc = new THREE.CatmullRomCurve3(outPts.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.1);
  output.add(K.mesh(THREE, new THREE.TubeGeometry(oc, 30, 0.06, 12, false), M("casing2", "rubber")));
  const pulses = K.flow(ctx, THREE, { paths: [outPts.map(([x, y, z]) => [x, y + 0.075, z])], count: 6, size: 0.045, from: "ui" });
  output.add(pulses.group);
  group.add(K.contactShadow(ctx, THREE, L * 1.4, Dp * 2.0, 0.45));

  const st = { start: 0, run: 0, t: 0 };
  const cOk = K.col(ctx, "ok", opts), cWarm = K.col(ctx, "warm", opts);
  const apply = () => {
    const s = st.start, r = st.run, crank = s * (1 - r);
    const blink = Math.sin(st.t * 12) > 0 ? 1 : 0.15;
    beaconMat.emissive.copy(r > 0.5 ? cOk : cWarm); beaconMat.emissiveIntensity = r > 0.5 ? 1.4 : crank > 0.02 ? 1.6 * blink : 0;
    panelLights.forEach((l, i) => { l.material.emissiveIntensity = (i === 0 ? s : i === 1 ? r : r * blink) > 0.3 ? 1.2 : 0; });
    capPivot.rotation.z = 0.9 * K.clamp(Math.max(s, r) * 1.5) * (0.8 + 0.2 * Math.sin(st.t * 30));
    fan.rotation.z = st.t * 14 * r;
    puffs.set(st.t * (0.5 + r * 0.6), crank > 0.02 ? 1 : 0.4 * r);
    puffs.group.children.forEach((m) => { const k = K.clamp((m.position.y - ytop - 0.9) / 0.6); const sc = (crank > 0.02 ? 1.3 : 0.8) * (1 + 1.3 * k); m.scale.setScalar(sc); });
    pulses.set(st.t * 0.9, r);
    body.position.set(0.004 * r * Math.sin(st.t * 61), 0.003 * (r + crank) * Math.sin(st.t * 47), 0);
  };
  apply();
  return {
    group, size: [L + 0.4, Y0 + HE + 1.5, Dp + 0.3], parts: { enclosure, fuel_tank, radiator, fan, control_panel, beacon, exhaust, output },
    keys: ["start", "run", "t", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "t") { st.t = Number(v) || 0; apply(); return; }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
