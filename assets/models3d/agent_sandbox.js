// @model {"id": "agent_sandbox", "pack": "ai_ml", "what": "an AI agent's sandbox: a glass room on a plinth with a softly lit core on a pedestal (a stand-in for the agent, no robot), a back wall of labelled tool sockets of which only the allowed ones get plugged in, and a gate at the front with a status light that a human approves", "parts": ["plinth", "walls", "core", "sockets", "plugs", "labels", "gate", "gate_light", "beam"], "keys": {"plug": "0..1 the allowed tools (opts.allowed) plug in one by one: a cable runs from the core and its plug seats", "reach": "0..1 a beam from the core tries a socket that is not allowed (opts.reachAt) and bounces off; the socket flashes the alert colour", "approve": "0..1 the gate light turns from waiting to ok, then the gate slides open (a human approved an action)", "seal": "0..1 the glass walls frost over (isolation)", "turn": "radians about y"}, "best_for": ["AI agents and tool permissions: least privilege", "human approval before irreversible actions", "sandboxing and isolation of an agent"], "not_for": ["a chatbot without tools (use a screen or the orb)", "a person or a robot (no characters here)"], "size": [2.2, 1.4, 1.7], "sheet": {"opts": {"tools": ["Search", "Calendar", "Email", "Payments", "Files", "Admin"], "allowed": [0, 1, 4], "reachAt": 3}, "states": [{"key": "plug", "from": 0, "to": 1, "at": 0.5, "dur": 2.0}, {"key": "reach", "from": 0, "to": 1, "at": 2.9, "dur": 1.0}, {"key": "approve", "from": 0, "to": 1, "at": 3.9, "dur": 0.9}, {"key": "seal", "from": 0, "to": 1, "at": 4.9, "dur": 0.6}], "elevation": 18, "turn": 1.2, "mood": "clean_bench"}}
// Accuracy (topic-asset-needs 8.12): least privilege (only the tools the caller allows are plugged in; any other socket
// refuses the reach) and human approval for an irreversible action (the gate), after OWASP's "excessive agency". No
// robot shapes: the agent is a lit core. Tool words come only from opts.tools; with no words a socket's plate is blank.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const tools = (opts.tools || []).slice(0, 8).map((t) => (typeof t === "string" ? { label: t } : t || {}));
  const NS = Math.max(2, Math.min(8, tools.length || opts.sockets || 6));
  const allowed = new Set(opts.allowed || tools.map((t, i) => (t.allowed ? i : -1)).filter((i) => i >= 0));
  const order = [...Array(NS).keys()].filter((i) => allowed.has(i));
  const reachAt = opts.reachAt != null && !allowed.has(opts.reachAt) ? opts.reachAt : [...Array(NS).keys()].find((i) => !allowed.has(i));
  const W = 1.9, D = 1.3, H = 1.15, PH = 0.12, F = 0.025;
  const group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot);
  const dark = K.role(ctx, "ink", opts) === "field";
  const plinth = K.mesh(THREE, K.rbox(THREE, X, W + 0.24, PH, D + 0.24, 0.03, 3), K.mat(ctx, THREE, dark ? "casing2" : "paper", "matte", opts)); plinth.position.y = PH / 2; pivot.add(plinth);
  const room = new THREE.Group(); room.position.y = PH; pivot.add(room);

  // frame: twelve edges in metal; walls: glass on the sides, front and roof, a solid socket wall at the back
  const metal = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.3 });
  const edge = (len, x, y, z, axis) => { const m = K.mesh(THREE, new THREE.BoxGeometry(axis === "x" ? len : F, axis === "y" ? len : F, axis === "z" ? len : F), metal); m.position.set(x, y, z); room.add(m); };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) edge(H, sx * W / 2, H / 2, sz * D / 2, "y");
  for (const y of [0, H]) for (const sz of [-1, 1]) edge(W, 0, y, sz * D / 2, "x");
  for (const y of [0, H]) for (const sx of [-1, 1]) edge(D, sx * W / 2, y, 0, "z");
  const glass = K.mat(ctx, THREE, "paper2", "glass", opts, { side: THREE.DoubleSide, depthWrite: false });
  const frostC = K.col(ctx, "paper", opts), glassC = glass.color.clone();
  const walls = new THREE.Group(); room.add(walls);
  const GW = 0.42, GX = W / 2 - GW / 2 - 0.16;                                    // the gate's width and centre (front right, clear of the core)
  const pane = (w, h, x, y, z, ry, rx = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); p.renderOrder = 1; walls.add(p); return p; };
  pane(D, H, -W / 2, H / 2, 0, Math.PI / 2); pane(D, H, W / 2, H / 2, 0, Math.PI / 2); pane(W, D, 0, H, 0, 0, -Math.PI / 2);
  const gl = GX - GW / 2 + W / 2, gr = W / 2 - GX - GW / 2;
  pane(gl, H, -W / 2 + gl / 2, H / 2, D / 2, 0); pane(gr, H, W / 2 - gr / 2, H / 2, D / 2, 0);
  const back = K.mesh(THREE, K.rbox(THREE, X, W - 0.02, H - 0.02, 0.05, 0.01, 2), K.mat(ctx, THREE, "casing2", "plastic", opts)); back.position.set(0, H / 2, -D / 2 + 0.03); room.add(back);

  // sockets on the back wall, each with a label plate under it
  const COLS = Math.ceil(NS / 2), sockets = [], plugs = [], cables = [];
  const sockPos = (i) => new THREE.Vector3(-W / 2 + (W / COLS) * ((i % COLS) + 0.5), i < COLS ? H * 0.72 : H * 0.36, -D / 2 + 0.056);
  const okC = K.col(ctx, "ok", opts), badC = K.col(ctx, "bad", opts), trimC = K.col(ctx, "trim", opts), uiC = K.col(ctx, "ui", opts);
  const sockG = new THREE.Group(), plugG = new THREE.Group(), labelG = new THREE.Group(); room.add(sockG, plugG, labelG);
  for (let i = 0; i < NS; i++) {
    const p = sockPos(i);
    const ringMat = new THREE.MeshStandardMaterial({ color: trimC.clone(), emissive: trimC.clone(), emissiveIntensity: 0, roughness: 0.4, metalness: 0.3 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 12, 32), ringMat); ring.position.copy(p); sockG.add(ring);
    const hole = K.mesh(THREE, new THREE.CircleGeometry(0.062, 28), K.mat(ctx, THREE, "casing", "matte", opts), false); hole.position.copy(p).add(new THREE.Vector3(0, 0, -0.004)); sockG.add(hole);
    const f = K.face(ctx, THREE, 384, 96), word = tools[i] && tools[i].label;
    f.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "paper", opts); K.rr(g, 0, 0, w, h, h * 0.25); g.fill();
      if (word) { g.fillStyle = K.hexOf(ctx, "ink", opts); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(K.fitText(g, word, w * 0.88, (q) => K.font(ctx, "body", q, 700), h * 0.56), w / 2, h / 2 + 2); } });
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: f.tex, transparent: true, toneMapped: false })); lab.position.copy(p).add(new THREE.Vector3(0, -0.14, 0)); labelG.add(lab);
    sockets.push({ ring, ringMat, p });
  }
  // the core: a softly lit sphere on a slim pedestal, a halo round it
  const CORE = new THREE.Vector3(-0.15, 0.4, 0.12);
  const coreMat = new THREE.MeshStandardMaterial({ color: uiC.clone(), emissive: uiC.clone(), emissiveIntensity: 0.55, roughness: 0.25, metalness: 0.1 });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 4), coreMat); core.position.copy(CORE); room.add(core);
  core.add(new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 20), new THREE.MeshBasicMaterial({ color: uiC, transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false })));
  // a shallow dish the core rests in (a device, not a figure)
  const ped = K.mesh(THREE, K.lathe(THREE, [[0, 0], [0.26, 0], [0.27, 0.03], [0.2, 0.06], [0.08, 0.08], [0.1, 0.2], [0.16, 0.24], [0.14, 0.25], [0, 0.2]], 48), metal);
  ped.position.set(CORE.x, 0, CORE.z); room.add(ped);
  // plugs and cables for the allowed sockets (a sagging curve from the core to the socket)
  for (const i of order) {
    const p = sockets[i].p, a = CORE.clone().add(p.clone().sub(CORE).normalize().multiplyScalar(0.18)), end = p.clone().add(new THREE.Vector3(0, 0, 0.09));
    const mid = a.clone().lerp(end, 0.5).add(new THREE.Vector3(0, -0.18, 0));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, end);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.012, 8, false), K.mat(ctx, THREE, "ui", "plastic", opts)); plugG.add(tube);
    const plug = new THREE.Group(), body = K.mesh(THREE, K.rbox(THREE, X, 0.1, 0.1, 0.09, 0.02, 2), K.mat(ctx, THREE, "ok", "plastic", opts)); plug.add(body);
    plugG.add(plug); cables.push({ tube, total: tube.geometry.index.count }); plugs.push({ plug, i, end });
  }
  // the beam that tries a socket not allowed, and its spark
  const beamMat = new THREE.MeshBasicMaterial({ color: uiC, transparent: true, opacity: 0.85, toneMapped: false });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), beamMat); beam.geometry.translate(0, 0.5, 0); room.add(beam);
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: badC, transparent: true, toneMapped: false, depthWrite: false })); room.add(spark);
  // the gate in the front opening, its light above it
  const gate = new THREE.Group(); room.add(gate);
  const gp = K.mesh(THREE, K.rbox(THREE, X, GW - 0.02, H - 0.08, 0.035, 0.012, 2), K.mat(ctx, THREE, "casing", "plastic", opts)); gp.position.y = (H - 0.08) / 2 + 0.01; gate.add(gp);
  const win = K.mesh(THREE, new THREE.PlaneGeometry(GW - 0.14, H * 0.42), glass, false); win.position.set(0, H * 0.62, 0.019); gate.add(win);
  gate.position.set(GX, 0, D / 2 + 0.03);
  const lightMat = new THREE.MeshStandardMaterial({ color: K.col(ctx, "warm", opts), emissive: K.col(ctx, "warm", opts), emissiveIntensity: 0.8 });
  const gateLight = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), lightMat); gateLight.position.set(GX, H + 0.05, D / 2 + 0.01); room.add(gateLight);
  const lbase = K.mesh(THREE, new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20), metal); lbase.position.set(GX, H + 0.012, D / 2); room.add(lbase);
  group.add(K.contactShadow(ctx, THREE, W + 1, D + 1, 0.4));

  const st = { plug: 0, reach: 0, approve: 0, seal: 0 };
  const warmC = K.col(ctx, "warm", opts);
  const span = (obj, a, b, k) => { const d = b.clone().sub(a); obj.position.copy(a); obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); obj.scale.set(1, Math.max(1e-4, d.length() * k), 1); };
  const apply = () => {
    sockets.forEach((s) => { s.ringMat.color.copy(trimC); s.ringMat.emissive.copy(trimC); s.ringMat.emissiveIntensity = 0; });
    plugs.forEach((o, r) => {
      const k = K.clamp(st.plug * (order.length * 0.7 + 0.3) - r * 0.7), grow = K.clamp(k / 0.75), seat = K.easeInOut(K.clamp((k - 0.7) / 0.3)), c = cables[r];
      c.tube.visible = k > 0; c.tube.geometry.setDrawRange(0, Math.floor(c.total * grow / 6) * 6);
      o.plug.visible = k > 0.7; o.plug.position.copy(o.end).add(new THREE.Vector3(0, 0, 0.12 * (1 - seat)));
      if (seat > 0) { const s = sockets[o.i]; s.ringMat.color.copy(trimC).lerp(okC, seat); s.ringMat.emissive.copy(okC); s.ringMat.emissiveIntensity = 0.6 * seat; }
    });
    const ra = st.reach > 0 && reachAt != null ? sockets[reachAt] : null;
    beam.visible = spark.visible = false;
    if (ra) {
      const out = K.easeOut(K.clamp(st.reach / 0.5)), back = K.easeInOut(K.clamp((st.reach - 0.5) / 0.5)), k = out * (1 - back);
      const from = CORE.clone().add(ra.p.clone().sub(CORE).normalize().multiplyScalar(0.18)), to = ra.p.clone().add(new THREE.Vector3(0, 0, 0.03));
      beam.visible = k > 0.01; span(beam, from, to, 0.97 * k);
      const hit = Math.max(0, 1 - Math.abs(st.reach - 0.5) * 5);
      spark.visible = hit > 0; spark.position.copy(to); spark.scale.setScalar(0.4 + 1.2 * hit); spark.material.opacity = 0.8 * hit;
      const flash = K.clamp(1 - Math.abs(st.reach - 0.55) * 3);
      ra.ringMat.color.copy(trimC).lerp(badC, flash); ra.ringMat.emissive.copy(badC); ra.ringMat.emissiveIntensity = 1.2 * flash;
    }
    const lk = K.clamp(st.approve / 0.35), ok = K.easeInOut(K.clamp((st.approve - 0.3) / 0.7));
    lightMat.color.copy(warmC).lerp(okC, lk); lightMat.emissive.copy(lightMat.color); lightMat.emissiveIntensity = 0.8 + 0.6 * lk;
    gate.position.x = GX - ok * (GW + 0.02);                                    // slides along the front, past the left-hand pane
    gate.position.z = D / 2 + 0.03 + 0.03 * Math.min(1, ok * 6);
    const fr = K.easeInOut(st.seal);
    glass.opacity = 0.32 + 0.58 * fr; glass.color.copy(glassC).lerp(frostC, fr); glass.roughness = 0.05 + 0.75 * fr;
  };
  apply();
  return {
    group, size: [W + 0.3, H + PH + 0.12, D + 0.4], parts: { plinth, walls, core, sockets: sockG, plugs: plugG, labels: labelG, gate, gate_light: gateLight, beam },
    keys: ["plug", "reach", "approve", "seal", "turn"],
    set(key, v) {
      if (key === "plug") { st.plug = K.clamp(v); apply(); }
      else if (key === "reach") { st.reach = K.clamp(v); apply(); }
      else if (key === "approve") { st.approve = K.clamp(v); apply(); }
      else if (key === "seal") { st.seal = K.clamp(v); apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
