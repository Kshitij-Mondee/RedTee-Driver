// @model {"id": "tor_switch", "pack": "datacentre", "what": "a generic 1U top-of-rack network switch: two rows of port cages with link lights and a block of larger uplink cages on the port face; two power supplies and a row of fan modules on the other face; rack ears", "parts": ["chassis", "ports", "port_leds", "uplinks", "psus", "fans", "airflow"], "keys": {"links": "0..1 port link lights come on in port order", "traffic": "0..1 linked ports blink in a fixed, deterministic activity pattern (needs t)", "uplink": "0..1 the uplink cages glow", "fail": "index of a port whose light and cage turn to the alert role (-1 for none)", "airflow": "0..1 arrows show intake (cool) and exhaust (warm); the side follows opts.intake", "hot_intake": "0..1 the mistake: the intake arrows turn warm (the switch breathes another device's exhaust)", "t": "seconds; drives the traffic blink (call every frame with the scene time)", "turn": "radians about y"}, "best_for": ["network switching in a rack: servers to the top-of-rack switch", "a link or port failure", "switch airflow direction and why it must match the rack", "uplinks to the spine"], "not_for": ["a network topology of many switches (use ctx.iso boxes and arrows)", "a home router"], "size": [4.4, 0.44, 3.6], "sheet": {"opts": {"intake": "power"}, "mood": "clean_bench", "elevation": 26, "states": [{"key": "t", "from": 0, "to": 6, "at": 0, "dur": 6}, {"key": "links", "from": 0, "to": 1, "at": 0.3, "dur": 1.0}, {"key": "traffic", "from": 0, "to": 1, "at": 1.4, "dur": 0.3}, {"key": "uplink", "from": 0, "to": 1, "at": 1.8, "dur": 0.4}, {"key": "fail", "before": -1, "value": 13, "at": 2.2}, {"key": "airflow", "from": 0, "to": 1, "at": 3.0, "dur": 0.5}, {"key": "turn", "from": 0, "to": 3.0, "at": 3.7, "dur": 1.2}, {"key": "hot_intake", "from": 0, "to": 1, "at": 5.0, "dur": 0.4}]}}
// The port face is +z. opts.intake: "power" (default: air enters through the fans and supplies and leaves through the
// port face, a port-side exhaust switch whose ports face the hot aisle) or "ports" (port-side intake, the opposite).
// Two supplies, one per power feed. No words: the faces carry shapes only.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 4.4, H = 0.44, D = 3.6;
  const NC = Math.max(12, Math.min(24, Math.round((opts.ports || 48) / 2))), NP = NC * 2, NU = Math.max(2, Math.min(8, opts.uplinks || 8));
  const UC = Math.ceil(NU / 2);
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const shell = K.mat(ctx, THREE, "casing", "metal", opts, { roughness: 0.45, metalness: 0.55 });
  const chassis = K.mesh(THREE, K.rbox(THREE, X, W, H, D, 0.02, 3), shell); chassis.position.y = H / 2; pivot.add(chassis);
  for (const s of [-1, 1]) {                    // rack ears at the port face
    const ear = K.mesh(THREE, K.rbox(THREE, X, 0.22, H - 0.02, 0.03, 0.01, 2), shell); ear.position.set(s * (W / 2 + 0.1), H / 2, D / 2 - 0.12); pivot.add(ear);
    for (const y of [0.12, 0.32]) { const h = K.mesh(THREE, new THREE.CylinderGeometry(0.03, 0.03, 0.035, 14), K.mat(ctx, THREE, "casing2", "plastic", opts), false); h.rotation.x = Math.PI / 2; h.position.set(s * (W / 2 + 0.13), y, D / 2 - 0.12); pivot.add(h); }
  }

  // the port face: a canvas of cages (two rows), management ports at the left, larger uplink cages at the right
  const PX = 1100 / W, fy = (y) => (H - y) * PX;               // canvas pixels per unit; y in units from the bottom
  const L = { x0: -W / 2 + 0.42, cw: 0.105, gap: 0.014, rowY: [0.3, 0.14], ch: 0.11 };
  const colX = (c) => L.x0 + Math.floor(c / 6) * 0.05 + c * (L.cw + L.gap) + L.cw / 2;     // cages grouped in sixes
  const upX0 = colX(NC - 1) + L.cw / 2 + 0.1, uw = 0.18, ug = 0.02, upX = (c) => upX0 + c * (uw + ug) + uw / 2;
  const pf = K.face(ctx, THREE, 1100, Math.round(H * PX));
  pf.draw((g, w, h) => {
    const cx = (x) => (x + W / 2) * PX;
    // a dark face in every style (status lights must read on it): the shadow token, cages framed in metal
    g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "shadow", opts); g.globalAlpha = 0.55; g.fillRect(0, 0, w, h); g.globalAlpha = 1;
    const cage = (x, y, cw, ch, frame) => {
      g.fillStyle = K.hexOf(ctx, frame, opts); K.rr(g, cx(x - cw / 2), fy(y + ch / 2), cw * PX, ch * PX, 2); g.fill();
      g.fillStyle = K.hexOf(ctx, "shadow", opts); K.rr(g, cx(x - cw / 2) + 3, fy(y + ch / 2) + 3, cw * PX - 6, ch * PX - 6, 1); g.fill();
      g.fillStyle = K.hexOf(ctx, frame, opts); g.globalAlpha = 0.35; g.fillRect(cx(x - cw / 2) + 6, fy(y + ch / 2) + ch * PX * 0.4, cw * PX - 12, ch * PX * 0.2); g.globalAlpha = 1;
    };
    for (let c = 0; c < NC; c++) for (const y of L.rowY) cage(colX(c), y, L.cw, L.ch, "metal");
    for (let c = 0; c < UC; c++) for (const y of L.rowY) cage(upX(c), y, uw, L.ch * 1.05, "ui");
    for (const [i, x] of [[0, -W / 2 + 0.12], [1, -W / 2 + 0.27]].values()) cage(x, i ? 0.22 : 0.22, 0.1, 0.09, "trim");
  });
  const portFace = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.04, H - 0.04), new THREE.MeshStandardMaterial({ map: pf.tex, roughness: 0.55, metalness: 0.3 }));
  portFace.position.set(0, H / 2, D / 2 + 0.002); pivot.add(portFace);
  const ports = portFace;

  // port lights: one instanced mesh, one light beside each cage (top row above it, bottom row below it)
  const ledGeo = new THREE.BoxGeometry(0.045, 0.028, 0.012);
  const ledMesh = new THREE.InstancedMesh(ledGeo, new THREE.MeshBasicMaterial({ toneMapped: false }), NP);
  const dummy = new THREE.Object3D();
  for (let p = 0; p < NP; p++) {
    const c = Math.floor(p / 2), top = p % 2 === 0;
    dummy.position.set(colX(c) + L.cw * 0.3, top ? L.rowY[0] + L.ch / 2 + 0.03 : L.rowY[1] - L.ch / 2 - 0.03, D / 2 + 0.008); dummy.updateMatrix();
    ledMesh.setMatrixAt(p, dummy.matrix); ledMesh.setColorAt(p, K.col(ctx, "trim", opts));
  }
  pivot.add(ledMesh);
  // the failed port: an outline round its cage in the alert role
  const failRing = new THREE.Mesh(new THREE.RingGeometry(0.068, 0.084, 4, 1), new THREE.MeshBasicMaterial({ color: K.col(ctx, "bad", opts), toneMapped: false }));
  failRing.rotation.z = Math.PI / 4; failRing.scale.set(1.0, 0.92, 1); failRing.visible = false; pivot.add(failRing);
  // uplink glow: a plate per uplink cage that lights in the accent
  const upMat = new THREE.MeshBasicMaterial({ color: K.col(ctx, "ui", opts), transparent: true, opacity: 0, toneMapped: false });
  const uplinks = new THREE.Group(); pivot.add(uplinks);
  for (let c = 0; c < UC; c++) for (const y of L.rowY) { const m = new THREE.Mesh(new THREE.PlaneGeometry(uw * 0.86, L.ch * 0.5), upMat); m.position.set(upX(c), y, D / 2 + 0.006); uplinks.add(m); }

  // the other face (-z): supply A at the left, supply B at the right (seen from the port face), fan modules between
  const rf = K.face(ctx, THREE, 1100, Math.round(H * PX));
  const psuW = 0.62, fanN = 5, fanW = 0.42;
  rf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "casing", opts); g.fillRect(0, 0, w, h);
    const bx = (x0, ww, fill) => { g.fillStyle = K.hexOf(ctx, fill, opts); K.rr(g, x0 * PX, 6, ww * PX, h - 12, 4); g.fill(); };
    for (const x0 of [0.08, W - 0.08 - psuW]) {
      bx(x0, psuW, "casing2"); g.fillStyle = K.hexOf(ctx, "casing", opts);
      for (let i = 0; i < 7; i++) { K.rr(g, (x0 + 0.06 + i * 0.045) * PX, 16, 0.02 * PX, h - 32, 2); g.fill(); }
      g.fillStyle = K.hexOf(ctx, "trim", opts); K.rr(g, (x0 + psuW - 0.17) * PX, h * 0.3, 0.1 * PX, h * 0.4, 3); g.fill();
    }
    const f0 = (W - fanN * fanW - (fanN - 1) * 0.04) / 2;
    for (let i = 0; i < fanN; i++) {
      const x0 = f0 + i * (fanW + 0.04); bx(x0, fanW, "casing2");
      g.strokeStyle = K.hexOf(ctx, "casing", opts); g.lineWidth = 3;
      for (const r of [0.07, 0.13, 0.18]) { g.beginPath(); g.arc((x0 + fanW / 2) * PX, h / 2, r * PX * 0.95, 0, Math.PI * 2); g.stroke(); }
    }
  });
  const rear = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.04, H - 0.04), new THREE.MeshStandardMaterial({ map: rf.tex, roughness: 0.55, metalness: 0.3 }));
  rear.rotation.y = Math.PI; rear.position.set(0, H / 2, -D / 2 - 0.002); pivot.add(rear);
  const psus = new THREE.Group(); pivot.add(psus);
  ["ui", "warm"].forEach((r, i) => {             // supply handles, and a feed stripe in the strip colours (A and B)
    const x = (i ? 1 : -1) * (W / 2 - 0.08 - psuW / 2);
    const hd = K.mesh(THREE, new THREE.TorusGeometry(0.06, 0.014, 8, 16, Math.PI), K.mat(ctx, THREE, "metal", "metal", opts)); hd.rotation.set(0, Math.PI, Math.PI / 2); hd.position.set(x + psuW * 0.3, H / 2, -D / 2 - 0.004); psus.add(hd);
    const tag = K.mesh(THREE, K.rbox(THREE, X, psuW * 0.5, 0.03, 0.01, 0.005, 2), K.mat(ctx, THREE, r, "plastic", opts), false); tag.position.set(x - psuW * 0.12, H - 0.05, -D / 2 - 0.006); psus.add(tag);
  });
  const fans = rear;

  // airflow arrows: three in at the intake face (cool) and three out of the exhaust face (warm)
  const portIntake = opts.intake === "ports";
  const zIn = portIntake ? 1 : -1, airflow = new THREE.Group(); pivot.add(airflow);
  const arrows = [];
  for (const x of [-1.3, 0, 1.3]) {
    const a = K.arrow3d(ctx, THREE, [x, H / 2, zIn * (D / 2 + 0.9)], [x, H / 2, zIn * (D / 2 + 0.12)], { role: "cool", r: 0.04 });
    const b = K.arrow3d(ctx, THREE, [x, H / 2, -zIn * (D / 2 + 0.12)], [x, H / 2, -zIn * (D / 2 + 0.9)], { role: "warm", r: 0.04 });
    airflow.add(a, b); arrows.push([a, "in"], [b, "out"]);
  }
  group.add(K.contactShadow(ctx, THREE, W * 1.4, D * 1.4, 0.45));

  const st = { links: 0, traffic: 0, uplink: 0, fail: -1, airflow: 0, hot_intake: 0, t: 0 };
  const cOk = K.col(ctx, "ok", opts), cOff = K.col(ctx, "trim", opts), cBad = K.col(ctx, "bad", opts), cCool = K.col(ctx, "cool", opts), cWarm = K.col(ctx, "warm", opts);
  const tmp = new THREE.Color();
  const apply = () => {
    const lit = Math.round(st.links * NP), tick = Math.floor(st.t * 9);
    for (let p = 0; p < NP; p++) {
      if (p === st.fail) { ledMesh.setColorAt(p, cBad); continue; }
      if (p >= lit) { ledMesh.setColorAt(p, cOff); continue; }
      const blink = (((p * 7919 + tick * 104729) % 101) / 101) < st.traffic * 0.45;     // a fixed pattern per tick
      ledMesh.setColorAt(p, blink ? tmp.copy(cOk).lerp(cOff, 0.75) : cOk);
    }
    ledMesh.instanceColor.needsUpdate = true;
    const fp = Math.round(st.fail);
    failRing.visible = fp >= 0 && fp < NP;
    if (failRing.visible) { const c = Math.floor(fp / 2); failRing.position.set(colX(c), L.rowY[fp % 2], D / 2 + 0.01); }
    upMat.opacity = 0.95 * st.uplink;
    arrows.forEach(([a, kind]) => {
      const k = K.easeOut(st.airflow); a.visible = k > 0.01; a.scale.setScalar(Math.max(0.001, k));
      if (kind === "in") a.children[0].material.color.copy(cCool).lerp(cWarm, st.hot_intake);
    });
  };
  apply();
  return {
    group, size: [W, H, D], parts: { chassis, ports, port_leds: ledMesh, uplinks, psus, fans, airflow }, keys: ["links", "traffic", "uplink", "fail", "airflow", "hot_intake", "t", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "t") { st.t = Number(v) || 0; apply(); return; }
      if (key === "fail") { st.fail = v == null ? -1 : Math.round(Number(v)); apply(); return; }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
