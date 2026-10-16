// @model {"id": "ups_cabinet", "pack": "datacentre", "what": "a generic UPS row cabinet: a power bay with a display and a power-flow mimic, and a battery bay whose door opens on shelves of battery blocks; an input cable and an output cable on top", "parts": ["cabinet", "power_bay", "mimic", "battery_bay", "door", "batteries", "cables"], "keys": {"door": "0 closed .. 1 the battery bay door swung open", "charge": "0..1 the batteries fill (blocks light from the bottom up and the gauge fills)", "discharge": "0..1 the input goes dark and the batteries carry the load: pulses run from the batteries to the output, the gauge drains", "t": "seconds; moves the power pulses (call every frame)", "turn": "radians about y"}, "best_for": ["how a UPS carries the load the instant the utility fails", "batteries bridging the seconds before a generator takes over", "power redundancy in a data centre"], "not_for": ["a small desktop UPS", "the generator (use generator_set) or the whole chain (use the power_path set)"], "size": [1.9, 2.3, 0.9], "sheet": {"opts": {}, "mood": "clean_bench", "elevation": 12, "turn": 0.9, "states": [{"key": "t", "from": 0, "to": 6, "at": 0, "dur": 6}, {"key": "door", "from": 0, "to": 1, "at": 0.4, "dur": 0.8}, {"key": "charge", "from": 0, "to": 1, "at": 1.1, "dur": 1.4}, {"key": "discharge", "from": 0, "to": 1, "at": 3.4, "dur": 0.5}]}}
// The UPS carries the load instantly: discharge cuts the input and the battery takes over with no gap. Generic shapes,
// no words: the display shows opts.screen (a kit3d drawUI spec) only; the mimic is lines and boxes.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 1.8, H = 2.0, D = 0.85, T = 0.04, BX = 0.0;            // left bay: power (x < 0); right bay: batteries
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const M = (role, kind, extra) => K.mat(ctx, THREE, role, kind, opts, Object.assign({ specularIntensity: 0.35 }, extra || {}));
  const box = (w, h, d, x, y, z, m, parent, r = 0.012) => { const o = K.mesh(THREE, K.rbox(THREE, X, w, h, d, r, 2), m); o.position.set(x, y, z); parent.add(o); return o; };
  const shell = M("casing", "plastic", { roughness: 0.55 }), inner = M("casing2", "matte"), metal = M("metal", "metal", { roughness: 0.35 });

  const cabinet = new THREE.Group(); pivot.add(cabinet);
  for (const [w, h, d, x, y, z, m] of [[W, 0.1, D, 0, 0.05, 0, shell], [T, H, D, -W / 2 + T / 2, H / 2, 0, shell], [T, H, D, W / 2 - T / 2, H / 2, 0, shell],
    [T, H - 0.1, D, BX, H / 2 + 0.05, 0, shell], [W, T, D, 0, H - T / 2, 0, shell], [W - 2 * T, H - 0.1, T, 0, H / 2 + 0.05, -D / 2 + T / 2, inner]]) box(w, h, d, x, y, z, m, cabinet);

  // the power bay front: a panel with the display, the mimic and vents
  const power_bay = new THREE.Group(); pivot.add(power_bay);
  const PW = W / 2 - T * 1.5, PX = -W / 4;
  box(PW, H - 0.12, 0.04, PX, H / 2 + 0.03, D / 2 - 0.02, shell, power_bay);
  const vf = K.face(ctx, THREE, 256, 96);
  vf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "casing", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "shadow", opts); for (let i = 0; i < 12; i++) { K.rr(g, 10 + i * 20, 12, 10, h - 24, 5); g.fill(); } });
  for (const y of [0.3, 0.6]) { const v = new THREE.Mesh(new THREE.PlaneGeometry(PW * 0.8, 0.22), new THREE.MeshStandardMaterial({ map: vf.tex, roughness: 0.6 })); v.position.set(PX, y, D / 2 + 0.002); power_bay.add(v); }
  const sf = K.face(ctx, THREE, 480, 300);
  sf.draw((g, w, h) => K.drawUI(ctx, opts.screen || { kind: "blank" }, g, w, h, opts), JSON.stringify(opts.screen || {}));
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshBasicMaterial({ map: sf.tex, toneMapped: false }));
  display.position.set(PX, 1.68, D / 2 + 0.003); power_bay.add(display);
  // the mimic: input line -> converter box -> output line, with the battery branch below; lit segments follow the state
  const mf = K.face(ctx, THREE, 400, 300);
  const mimic = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), new THREE.MeshBasicMaterial({ map: mf.tex, toneMapped: false }));
  mimic.position.set(PX, 1.2, D / 2 + 0.003); power_bay.add(mimic);
  const drawMimic = (inOn, batOn, outOn, level) => mf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "screen", opts); g.fillRect(0, 0, w, h);
    const seg = (x0, y0, x1, y1, on) => { g.strokeStyle = K.hexOf(ctx, on ? "ok" : "trim", opts); g.lineWidth = on ? 12 : 7; g.lineCap = "round"; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    seg(30, 90, 150, 90, inOn); seg(250, 90, 370, 90, outOn); seg(200, 130, 200, 200, batOn);
    g.fillStyle = K.hexOf(ctx, "paper2", opts); K.rr(g, 150, 50, 100, 80, 10); g.fill();
    g.strokeStyle = K.hexOf(ctx, "text", opts); g.lineWidth = 5; g.beginPath(); g.moveTo(165, 115); g.lineTo(235, 65); g.stroke();
    g.fillStyle = K.hexOf(ctx, "paper2", opts); K.rr(g, 150, 200, 100, 70, 8); g.fill();                 // the battery, with its level
    g.fillStyle = K.hexOf(ctx, level < 0.25 ? "bad" : batOn ? "warm" : "ok", opts); K.rr(g, 158, 208, 84 * K.clamp(level), 54, 6); g.fill();
    g.fillStyle = K.hexOf(ctx, "paper2", opts); K.rr(g, 250, 220, 10, 30, 3); g.fill();
  }, [inOn, batOn, outOn, Math.round(level * 60)].join("|"));

  // the battery bay: shelves of blocks, each with a charge light; the door covers it
  const battery_bay = new THREE.Group(); pivot.add(battery_bay);
  const batteries = new THREE.Group(); battery_bay.add(batteries);
  const SH = 5, NB = 3, BW = (W / 2 - 0.16) / NB, shelfY = (s) => 0.2 + s * 0.34, bx = (i) => BX + 0.08 + BW / 2 + i * BW;
  const blockMat = M("casing2", "plastic", { roughness: 0.6 });
  for (let s = 0; s < SH; s++) {
    box(W / 2 - 0.08, 0.025, D - 0.1, W / 4, shelfY(s) - 0.012, 0, metal, battery_bay, 0.004);
    for (let i = 0; i < NB; i++) {
      box(BW * 0.88, 0.24, D * 0.62, bx(i), shelfY(s) + 0.12, 0.02, blockMat, batteries, 0.015);
      for (const dx of [-0.08, 0.08]) { const tt = K.mesh(THREE, new THREE.CylinderGeometry(0.02, 0.02, 0.03, 10), metal); tt.position.set(bx(i) + dx, shelfY(s) + 0.255, -0.12); batteries.add(tt); }
    }
  }
  const NL = SH * NB, lights = new THREE.InstancedMesh(new THREE.BoxGeometry(BW * 0.6, 0.035, 0.012), new THREE.MeshBasicMaterial({ toneMapped: false }), NL);
  const dm = new THREE.Object3D();
  for (let s = 0; s < SH; s++) for (let i = 0; i < NB; i++) { dm.position.set(bx(i), shelfY(s) + 0.12, 0.02 + D * 0.31 + 0.007); dm.updateMatrix(); lights.setMatrixAt(s * NB + i, dm.matrix); }
  batteries.add(lights);
  const door = new THREE.Group(); door.position.set(W / 2 - 0.02, 0, D / 2 + 0.02); pivot.add(door);
  box(W / 2 - 0.05, H - 0.12, 0.04, -(W / 2 - 0.05) / 2, H / 2 + 0.03, 0, shell, door);
  for (const y of [0.45, 1.0, 1.55]) { const v = new THREE.Mesh(new THREE.PlaneGeometry((W / 2 - 0.05) * 0.7, 0.22), new THREE.MeshStandardMaterial({ map: vf.tex, roughness: 0.6 })); v.position.set(-(W / 2 - 0.05) / 2, y, 0.022); door.add(v); }
  box(0.03, 0.26, 0.04, -(W / 2 - 0.05) + 0.07, 1.0, 0.04, metal, door, 0.01);

  // cables on top: input at the left (utility), output at the right (to the load); pulses run along them
  const cables = new THREE.Group(); pivot.add(cables);
  const tube = (pts, role, r) => { const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.1); const m = K.mesh(THREE, new THREE.TubeGeometry(c, 30, r, 10, false), M(role, "rubber")); cables.add(m); return m; };
  // cables rise a little and run back, as into an overhead tray; a sleeve in the input (ui) or output (ok) role
  const inPts = [[-0.65, H, -0.2], [-0.65, H + 0.2, -0.22], [-0.65, H + 0.26, -0.45], [-0.65, H + 0.26, -0.75]], outPts = [[-0.3, H, -0.2], [-0.3, H + 0.2, -0.22], [-0.3, H + 0.26, -0.45], [-0.3, H + 0.26, -0.75]];
  tube(inPts, "casing", 0.04); tube(outPts, "casing", 0.04);
  for (const [x, role] of [[-0.65, "ui"], [-0.3, "ok"]]) { const sl = K.mesh(THREE, new THREE.CylinderGeometry(0.052, 0.052, 0.1, 16), M(role, "plastic")); sl.position.set(x, H + 0.07, -0.2); cables.add(sl); }
  const bus = box(0.05, 1.75, 0.03, BX + 0.06, 1.05, -0.33, M("warm", "metal", { roughness: 0.4 }), battery_bay, 0.008);
  const pIn = K.flow(ctx, THREE, { paths: [inPts.slice().reverse().map(([x, y, z]) => [x, y + 0.055, z])], count: 4, size: 0.034, from: "ui" });
  const pOut = K.flow(ctx, THREE, { paths: [outPts.map(([x, y, z]) => [x, y + 0.055, z])], count: 4, size: 0.034, from: "ui" });
  const pBat = K.flow(ctx, THREE, { paths: [0, 1, 2, 3, 4].map((s) => [[bx(NB - 1), shelfY(s) + 0.27, -0.3], [BX + 0.06, shelfY(s) + 0.27, -0.3], [BX + 0.06, 1.3, -0.3], [PX, 1.3, -0.3]]), count: 30, size: 0.04, from: "warm" });
  for (const f of [pIn, pOut, pBat]) pivot.add(f.group);
  group.add(K.contactShadow(ctx, THREE, W * 1.4, D * 2.0, 0.45));

  const st = { door: 0, charge: 0, discharge: 0, t: 0 };
  const cOk = K.col(ctx, "ok", opts), cOff = K.col(ctx, "trim", opts), cWarm = K.col(ctx, "warm", opts);
  const apply = () => {
    door.rotation.y = 1.9 * K.easeInOut(st.door);
    const dis = st.discharge, level = st.charge * (1 - 0.55 * dis), lit = Math.round(level * NL);
    for (let k = 0; k < NL; k++) lights.setColorAt(k, k < lit ? (dis > 0.05 ? cWarm : cOk) : cOff);   // bottom shelf first
    lights.instanceColor.needsUpdate = true;
    pIn.set(st.t * 0.6, 1 - dis);
    pOut.set(st.t * 0.6, 1);
    pBat.set(st.t * 0.6, dis);
    drawMimic(dis < 0.5, dis >= 0.5, true, level);
  };
  apply();
  return {
    group, size: [W, H + 0.3, D], parts: { cabinet, power_bay, mimic, battery_bay, door, batteries, cables },
    keys: ["door", "charge", "discharge", "t", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "t") { st.t = Number(v) || 0; apply(); return; }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
