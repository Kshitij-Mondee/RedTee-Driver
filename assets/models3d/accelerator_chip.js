// @model {"id": "accelerator_chip", "pack": "datacentre", "what": "one generic accelerator package close up: a board, a package substrate, a large central die with a grid of cores, memory stacks beside the die on the same substrate, and a liquid cold plate with an inlet and an outlet hose that lowers onto it", "parts": ["board", "substrate", "die", "memory_stacks", "cores", "cold_plate", "inlet", "outlet"], "keys": {"cores": "0..1 the die's core grid lights all at once (parallel); opts.serial: true lights the cores one after another instead (a CPU contrast)", "memory": "0..1 pulses travel between the memory stacks and the die (needs t)", "plate": "0 the cold plate lifted .. 1 seated on the die and stacks", "flow": "0..1 coolant moves from the inlet through the plate to the outlet, cool turning warm (needs t)", "cutaway": "0..1 the plate's lid fades to show its inner channels", "t": "seconds; moves the memory pulses and the coolant (call every frame)", "turn": "radians about y"}, "best_for": ["why accelerators: many small cores working in parallel", "fast memory stacked beside the die", "direct-to-chip liquid cooling: a cold plate takes the heat into the fluid"], "not_for": ["a whole server (use gpu_server)", "a consumer graphics card (never)"], "size": [3.6, 2.3, 3.4], "sheet": {"opts": {"stacks": 6}, "mood": "clean_bench", "elevation": 34, "states": [{"key": "t", "from": 0, "to": 6, "at": 0, "dur": 6}, {"key": "cores", "from": 0, "to": 1, "at": 0.6, "dur": 0.5}, {"key": "memory", "from": 0, "to": 1, "at": 1.1, "dur": 0.4}, {"key": "plate", "from": 0, "to": 1, "at": 2.0, "dur": 1.0}, {"key": "flow", "from": 0, "to": 1, "at": 3.1, "dur": 0.4}, {"key": "cutaway", "from": 0, "to": 1, "at": 3.9, "dur": 0.6}]}}
// Generic: no part numbers, no maker shapes. The memory stacks sit on the package beside the die (opts.stacks, an even
// number 4 to 8, half on each side). The supply hose is the cool role, the return hose the warm role.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const BW = 3.6, BD = 3.0, BT = 0.1, SW = 2.2, SD = 1.8, ST = 0.08, DW = 0.9, DD = 1.15, DT = 0.1;
  const NS = Math.max(4, Math.min(8, Math.round((opts.stacks || 6) / 2) * 2)), per = NS / 2;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const box = (w, h, d, x, y, z, m, r = 0.01, parent = pivot) => { const o = K.mesh(THREE, K.rbox(THREE, X, w, h, d, r, 2), m); o.position.set(x, y, z); parent.add(o); return o; };
  const soft = (role, kind, extra) => K.mat(ctx, THREE, role, kind, opts, Object.assign({ specularIntensity: 0.3 }, extra || {}));

  // the board: a dark plate with traces, and a ring of small parts round the package
  const bf = K.face(ctx, THREE, 720, 600);
  bf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h);
    g.strokeStyle = K.hexOf(ctx, "metal", opts); g.globalAlpha = 0.35; g.lineWidth = 2;
    for (let i = 0; i < 22; i++) {
      const s = ((i * 7919) % 101) / 101, y = 20 + i * 26, x0 = s < 0.5 ? 0 : w;
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 === 0 ? 110 + s * 60 : w - 110 - s * 60, y); g.lineTo(x0 === 0 ? 150 + s * 60 : w - 150 - s * 60, y + 30); g.stroke();
    }
    g.globalAlpha = 1;
  });
  const board = K.mesh(THREE, K.rbox(THREE, X, BW, BT, BD, 0.02, 2), new THREE.MeshPhysicalMaterial({ map: bf.tex, roughness: 0.8, specularIntensity: 0.3 }));
  board.position.y = BT / 2; pivot.add(board);
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.05, 0.05), soft("trim", "plastic"), 40);
  const dm = new THREE.Object3D();
  for (let i = 0; i < 40; i++) {
    const side = i % 4, k = Math.floor(i / 4) / 10 - 0.45, o = 0.12 + (((i * 104729) % 7) / 7) * 0.1;
    const x = side < 2 ? k * SW : (side === 2 ? -1 : 1) * (SW / 2 + o), z = side < 2 ? (side ? 1 : -1) * (SD / 2 + o) : k * SD;
    dm.position.set(x, BT + 0.025, z); dm.rotation.y = side < 2 ? 0 : Math.PI / 2; dm.updateMatrix(); caps.setMatrixAt(i, dm.matrix);
  }
  pivot.add(caps);

  // the package: substrate, the die in the middle, memory stacks beside it (layered slices on their sides)
  const substrate = box(SW, ST, SD, 0, BT + ST / 2, 0, soft("paper2", "matte"), 0.015);
  const y0 = BT + ST;
  const die = box(DW, DT, DD, 0, y0 + DT / 2, 0, soft("casing", "metal", { roughness: 0.25, metalness: 0.6 }), 0.006);
  const lf = K.face(ctx, THREE, 64, 64);
  lf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "metal", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "casing", opts); for (let i = 0; i < 8; i++) g.fillRect(0, i * 8 + 5, w, 2); });
  const stackSide = new THREE.MeshStandardMaterial({ map: lf.tex, roughness: 0.4, metalness: 0.4 }), stackTop = soft("metal", "metal", { roughness: 0.3 });
  const memory_stacks = new THREE.Group(); pivot.add(memory_stacks);
  const MW = 0.34, MD = Math.min(0.36, (DD - 0.06 * (per - 1)) / per), MT = DT, stacks = [];
  for (let s = 0; s < 2; s++) for (let i = 0; i < per; i++) {
    const x = (s ? 1 : -1) * (DW / 2 + 0.1 + MW / 2), z = (i - (per - 1) / 2) * (MD + 0.06);
    const m = new THREE.Mesh(new THREE.BoxGeometry(MW, MT, MD), [stackSide, stackSide, stackTop, stackSide, stackSide, stackSide]);
    m.position.set(x, y0 + MT / 2, z); m.castShadow = true; memory_stacks.add(m); stacks.push([x, z, s]);
  }

  // the cores: an instanced grid on the die's top face
  const CR = 12, CC = 9, NCore = CR * CC;
  const coreMesh = new THREE.InstancedMesh(new THREE.BoxGeometry((DW - 0.08) / CC * 0.8, 0.008, (DD - 0.08) / CR * 0.8), new THREE.MeshBasicMaterial({ toneMapped: false }), NCore);
  for (let r = 0; r < CR; r++) for (let c = 0; c < CC; c++) {
    dm.rotation.set(0, 0, 0); dm.position.set(-DW / 2 + 0.04 + (c + 0.5) * (DW - 0.08) / CC, y0 + DT + 0.004, -DD / 2 + 0.04 + (r + 0.5) * (DD - 0.08) / CR);
    dm.updateMatrix(); coreMesh.setMatrixAt(r * CC + c, dm.matrix);
  }
  pivot.add(coreMesh);
  const cores = coreMesh;

  // memory traffic: pulses run both ways between each stack and the die's edge
  const memPaths = [];
  stacks.forEach(([x, z, s]) => { const a = [x, y0 + MT + 0.03, z], b = [(s ? 1 : -1) * (DW / 2 - 0.05), y0 + DT + 0.03, z * 0.8]; memPaths.push([a, b], [b, a]); });
  const mem = K.flow(ctx, THREE, { paths: memPaths, count: memPaths.length * 3, size: 0.028, from: "ui2" });
  pivot.add(mem.group);

  // the cold plate: base, walls, serpentine fins inside, a lid that fades for the cutaway, inlet and outlet barbs,
  // and translucent hoses (supply in the cool role, return in the warm role) so the coolant shows
  const PW = SW - 0.2, PD = SD - 0.1, PT = 0.26, plate = new THREE.Group(); pivot.add(plate);
  const cu = soft("metal", "metal", { roughness: 0.35 });
  box(PW, 0.05, PD, 0, 0.025, 0, cu, 0.01, plate);
  for (const [w, d, x, z] of [[PW, 0.05, 0, -PD / 2 + 0.025], [PW, 0.05, 0, PD / 2 - 0.025], [0.05, PD, -PW / 2 + 0.025, 0], [0.05, PD, PW / 2 - 0.025, 0]]) box(w, PT - 0.05, d, x, 0.05 + (PT - 0.05) / 2, z, cu, 0.006, plate);
  const rowsZ = [-0.6, -0.3, 0, 0.3, 0.6].map((z) => z * PD / 1.6), xL = -PW / 2 + 0.2, xR = PW / 2 - 0.2;
  const finMat = soft("trim", "metal", { roughness: 0.4 });
  for (let i = 0; i < rowsZ.length - 1; i++) {                      // walls between rows, open at alternate ends
    const z = (rowsZ[i] + rowsZ[i + 1]) / 2, gapLeft = i % 2 === 1, x0 = gapLeft ? xL - 0.05 : -PW / 2 + 0.05, x1 = gapLeft ? PW / 2 - 0.05 : xR + 0.05;
    box(x1 - x0, PT - 0.08, 0.03, (x0 + x1) / 2, 0.05 + (PT - 0.08) / 2, z, finMat, 0.004, plate);
  }
  const lidMat = soft("metal", "metal", { roughness: 0.3, transparent: true, opacity: 1 });
  const lid = box(PW, 0.04, PD, 0, PT + 0.02, 0, lidMat, 0.01, plate);
  const top = PT + 0.04, inP = [xL, rowsZ[0]], outP = [xR, rowsZ[rowsZ.length - 1]];
  const barb = (p) => { const b = K.mesh(THREE, new THREE.CylinderGeometry(0.07, 0.08, 0.12, 20), cu); b.position.set(p[0], top + 0.06, p[1]); plate.add(b); return b; };
  const inlet = barb(inP), outlet = barb(outP);
  const hoseIn = [[inP[0], top + 0.1, inP[1]], [inP[0], top + 0.42, inP[1] - 0.08], [inP[0] - 0.05, top + 0.5, inP[1] - 0.5], [inP[0] - 0.1, top + 0.5, -BD / 2 - 0.15]];
  const hoseOut = [[outP[0], top + 0.1, outP[1]], [outP[0], top + 0.5, outP[1] - 0.1], [outP[0] + 0.05, top + 0.62, 0], [outP[0] + 0.1, top + 0.62, -BD / 2 - 0.15]];
  const hose = (pts, role) => {
    const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal");
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.06, 14, false), K.mat(ctx, THREE, role, "glass", opts, { opacity: 0.38, depthWrite: false }));
    m.renderOrder = 3; plate.add(m); return m;
  };
  hose(hoseIn, "cool"); hose(hoseOut, "warm");
  const cold_plate = plate;
  // the coolant path: down the supply hose, through the serpentine, up the return hose
  const serp = []; rowsZ.forEach((z, i) => { const a = i % 2 === 0 ? xL : xR, b = i % 2 === 0 ? xR : xL; serp.push([a, 0.15, z], [b, 0.15, z]); });
  const coolPath = [...hoseIn.slice().reverse(), [inP[0], 0.15, inP[1]], ...serp, [outP[0], 0.15, outP[1]], ...hoseOut];
  const coolant = K.flow(ctx, THREE, { paths: [coolPath, coolPath.map((p) => [p[0] + 0.02, p[1], p[2] + 0.02])], count: 70, size: 0.035, from: "cool", to: "warm", heat: true });
  coolant.group.children.forEach((m) => { m.renderOrder = 4; });
  plate.add(coolant.group);
  group.add(K.contactShadow(ctx, THREE, BW * 1.3, BD * 1.3, 0.4));

  const st = { cores: 0, memory: 0, plate: 0, flow: 0, cutaway: 0, t: 0 };
  const serial = !!opts.serial, cOn = K.col(ctx, "ui", opts), cOff = K.col(ctx, "casing2", opts), tmp = new THREE.Color();
  const apply = () => {
    for (let i = 0; i < NCore; i++) {
      const k = serial ? K.clamp(st.cores * NCore - i) : st.cores;   // serial: one after another, in order
      coreMesh.setColorAt(i, tmp.copy(cOff).lerp(cOn, k));
    }
    coreMesh.instanceColor.needsUpdate = true;
    mem.set(st.t * 0.9, st.memory);
    const p = K.easeInOut(st.plate);
    plate.position.y = y0 + MT + (1 - p) * 1.5;
    lidMat.opacity = 1 - 0.88 * st.cutaway; lidMat.depthWrite = st.cutaway < 0.01; lid.visible = st.cutaway < 0.999;
    coolant.set(st.t * 0.16, st.flow);
  };
  apply();
  return {
    group, size: [BW, 2.3, BD + 0.4], parts: { board, substrate, die, memory_stacks, cores, cold_plate, inlet, outlet },
    keys: ["cores", "memory", "plate", "flow", "cutaway", "t", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "t") { st.t = Number(v) || 0; apply(); return; }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
