// @model {"id": "ci_conveyor", "pack": "devs", "set": true, "what": "a delivery pipeline as a conveyor: changes ride the belt as labelled crates through a row of labelled stations, each with a status lamp and a gate that lifts when its check passes; a failing crate is pushed off onto a return chute while the line keeps running", "parts": ["belt", "stations", "gates", "lamps", "crates", "chute", "arm"], "keys": {"run": "0..1 the lead crate travels and each station checks it in turn (results from opts.results), up to its first failing or waiting station, or to the end", "reject": "0..1 at a failing station a side arm pushes the crate onto the return chute, and the next crate moves up (the line does not stop)", "approve": "0..1 at a waiting station (a human approval): its lamp turns ok, its gate lifts and the crate rolls on through the rest", "turn": "radians about y"}, "best_for": ["CI/CD: build, tests, review, scan, approval, deploy", "AI review as one check among several, never the last word", "the ML lifecycle (train, evaluate, deploy, monitor)", "quality gates in any process"], "not_for": ["a single test result (use a terminal screen)", "branching or parallel pipelines (use a process diagram)"], "size": [11.07, 2.38, 3.0], "sheet": {"opts": {"stations": ["Build", "Tests", "AI review", "Security scan", "Human approval", "Deploy"], "results": ["pass", "pass", "pass", "pass", "wait", "pass"], "ai": 2, "crates": ["Change 101", "Change 102", "Change 103"]}, "states": [{"key": "run", "from": 0, "to": 1, "at": 0.3, "dur": 3.7}, {"key": "approve", "from": 0, "to": 1, "at": 4.1, "dur": 1.4}], "elevation": 26, "turn": 0.4}}
// opts: stations [labels] (the count; none given: opts.count blank plates, default 5), results [pass | fail | wait per
// station, default pass] for the lead crate, crates [labels] (default 3 blank crates), ai (the index of the AI review
// station) and human (the index of the human approval; default the first "wait"). Accuracy, enforced here: the AI
// review station may not be the last station (it is never the final gate on its own), and when a human approval is
// named it must come after the AI review. A failed check stops that crate only: the belt keeps moving and the next
// crate moves up once the failed one is pushed off.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const labels = Array.isArray(opts.stations) ? opts.stations.slice(0, 7) : null;
  const N = labels ? Math.max(1, labels.length) : Math.max(1, Math.min(7, opts.count || 5));
  const results = Array.from({ length: N }, (_, j) => ((opts.results || [])[j] || "pass"));
  const AI = opts.ai == null ? -1 : opts.ai;
  let HUMAN = opts.human == null ? results.indexOf("wait") : opts.human;
  if (AI >= 0 && AI >= N - 1) throw new Error("ci_conveyor: the AI review station (opts.ai) cannot be the last station; it is never the final gate on its own");
  if (AI >= 0 && HUMAN >= 0 && HUMAN < AI) throw new Error("ci_conveyor: the human approval (opts.human) must come after the AI review (opts.ai)");
  if (HUMAN >= 0 && results[HUMAN] === "pass") results[HUMAN] = "wait";
  const crateLabels = Array.isArray(opts.crates) ? opts.crates.slice(0, 5) : [];
  const NC = Math.max(1, crateLabels.length || opts.crateCount || 3);

  const BY = 0.72, BZ = 0.9, CS = 0.5, QS = 0.66, P = 1.38, CK = 0.9;   // belt top, belt width, crate, queue gap, pitch, check time
  const qFront = 0;                                            // layout in x first, centred afterwards
  const xGate = (j) => qFront + 1.05 + j * P, xCheck = (j) => xGate(j) - 0.52;
  const xStart = qFront - (NC - 1) * QS - 0.55, xEnd = xGate(N - 1) + 1.05, xDel = xEnd - 0.4;
  const L = xEnd - xStart, cx = (xStart + xEnd) / 2;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const root = new THREE.Group(); root.position.x = -cx; pivot.add(root);
  const metal = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.35 });
  const box = (w, h, d, m, x, y, z, r = 0.015, parent = root) => { const o = K.mesh(THREE, K.rbox(THREE, X, w, h, d, r, 2), m); o.position.set(x, y, z); parent.add(o); return o; };

  // the belt: slats drawn on a canvas that scrolls, side rails, legs and end rollers
  const belt = new THREE.Group(); root.add(belt);
  const bf = K.face(ctx, THREE, 256, 128);
  bf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "casing", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "casing2", opts); g.globalAlpha = 0.5; for (let i = 0; i < 4; i++) g.fillRect(i * 64 + 2, 0, 10, h); });
  bf.tex.wrapS = THREE.RepeatWrapping; bf.tex.repeat.set(L / 0.7, 1);
  const beltTop = new THREE.Mesh(new THREE.PlaneGeometry(L, BZ), new THREE.MeshStandardMaterial({ map: bf.tex, roughness: 0.8 }));
  beltTop.rotation.x = -Math.PI / 2; beltTop.position.set(cx, BY + 0.001, 0); beltTop.receiveShadow = true; belt.add(beltTop);
  box(L, 0.12, BZ - 0.02, K.mat(ctx, THREE, "casing", "plastic", opts), cx, BY - 0.065, 0, 0.02, belt);
  for (const s of [-1, 1]) box(L + 0.1, 0.09, 0.05, metal, cx, BY + 0.02, s * (BZ / 2 + 0.03), 0.015, belt);
  for (const x of [xStart, xEnd]) { const r = K.mesh(THREE, new THREE.CylinderGeometry(0.08, 0.08, BZ + 0.02, 24), metal); r.rotation.x = Math.PI / 2; r.position.set(x, BY - 0.06, 0); belt.add(r); }
  const nLeg = Math.max(2, Math.round(L / 1.6) + 1);
  for (let i = 0; i < nLeg; i++) for (const s of [-1, 1]) box(0.06, BY - 0.12, 0.06, metal, xStart + 0.2 + i * (L - 0.4) / (nLeg - 1), (BY - 0.12) / 2, s * (BZ / 2 - 0.05), 0.01, belt);

  // stations: a gantry over the belt (the AI review and the human approval take their own colours), a sign facing
  // the front with the station's label, a lamp on the beam, and a gate (a striped barrier) that lifts
  const gf = K.face(ctx, THREE, 256, 192);
  gf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "warm", opts);
    for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(i * 48, h); g.lineTo(i * 48 + 24, h); g.lineTo(i * 48 + 24 + h * 0.6, 0); g.lineTo(i * 48 + h * 0.6, 0); g.closePath(); g.fill(); } });
  const gateMat = new THREE.MeshStandardMaterial({ map: gf.tex, roughness: 0.6 });
  // the AI review's colour: a role that stays apart from the ok lamp and from the human gate's warm in both tones
  const AIC = opts.aiColour || (K.role(ctx, "screen", opts) === "field" ? "ui2" : "ui");
  const stations = new THREE.Group(), gates = [], lamps = [], GH = 0.56, GY = BY + 0.03 + GH / 2, TOPY = 1.78;
  root.add(stations);
  for (let j = 0; j < N; j++) {
    const x = xGate(j), st = new THREE.Group(); stations.add(st);
    const postM = j === AI ? K.mat(ctx, THREE, AIC, "plastic", opts) : j === HUMAN ? K.mat(ctx, THREE, "warm", "plastic", opts) : metal;
    for (const s of [-1, 1]) box(0.08, TOPY - 0.0, 0.08, postM, x, TOPY / 2, s * (BZ / 2 + 0.1), 0.015, st);
    box(0.12, 0.1, BZ + 0.34, postM, x, TOPY, 0, 0.02, st);
    // the sign: words only from opts.stations (a blank plate otherwise)
    const sf = K.face(ctx, THREE, 640, 150), txt = labels ? labels[j] : "";
    sf.draw((g, w, h) => {
      g.fillStyle = K.hexOf(ctx, "paper", opts); K.rr(g, 0, 0, w, h, 26); g.fill();
      g.fillStyle = K.hexOf(ctx, j === AI ? AIC : j === HUMAN ? "warm" : "trim", opts); K.rr(g, 0, 0, 22, h, 11); g.fill();
      if (txt) { g.fillStyle = K.hexOf(ctx, "ink", opts); g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(K.fitText(g, String(txt), w - 70, (q) => K.font(ctx, "title", q, 700), 76), w / 2 + 8, h / 2 + 3); }
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 1.12 * 150 / 640), new THREE.MeshBasicMaterial({ map: sf.tex, toneMapped: false, side: THREE.DoubleSide }));
    sign.position.set(x, TOPY + 0.26, BZ / 2 + 0.17); st.add(sign);
    box(0.04, 0.2, 0.04, postM, x, TOPY + 0.08, BZ / 2 + 0.12, 0.01, st);
    const lm = new THREE.MeshStandardMaterial({ color: K.col(ctx, "trim", opts), emissive: K.col(ctx, "trim", opts), emissiveIntensity: 0.15, roughness: 0.4 });
    // the lamp: a round light on top of the sign, centred on its own gantry
    const lamp = K.mesh(THREE, new THREE.SphereGeometry(0.1, 24, 16), lm, false);
    lamp.scale.z = 0.6; lamp.position.set(x, TOPY + 0.26 + 0.24, BZ / 2 + 0.17); st.add(lamp); lamps.push(lm);
    const gate = K.mesh(THREE, K.rbox(THREE, X, 0.04, GH, BZ - 0.06, 0.015, 2), gateMat);
    gate.position.set(x, GY, 0); st.add(gate); gates.push(gate);
  }

  // the return chute and the push arm, at the first failing station (only when there is one)
  const FAIL = results.indexOf("fail");
  let chute = null, arm = null, plate = null, rod = null;
  const CZ0 = BZ / 2 + 0.06, CZ1 = BZ / 2 + 1.15, CY1 = 0.24;
  const slope = Math.atan2(BY - CY1, CZ1 - CZ0);
  if (FAIL >= 0) {
    const x = xCheck(FAIL);
    chute = new THREE.Group(); root.add(chute);
    const len = Math.hypot(CZ1 - CZ0, BY - CY1), tray = new THREE.Group();
    tray.position.set(x, (BY + CY1) / 2 - 0.03, (CZ0 + CZ1) / 2); tray.rotation.x = slope; chute.add(tray);
    box(0.78, 0.03, len, K.mat(ctx, THREE, "casing2", "plastic", opts), 0, 0, 0, 0.012, tray);
    for (const s of [-1, 1]) box(0.03, 0.12, len, metal, s * 0.4, 0.05, 0, 0.01, tray);
    box(0.84, 0.13, 0.03, K.mat(ctx, THREE, "bad", "plastic", opts), 0, 0.05, len / 2, 0.01, tray);   // the alert lip at its foot
    for (const s of [-1, 1]) box(0.04, CY1 + 0.02, 0.04, metal, x + s * 0.36, (CY1 + 0.02) / 2, CZ1 - 0.05, 0.01);
    arm = new THREE.Group(); arm.position.set(x, BY + CS * 0.45, -BZ / 2 - 0.42); root.add(arm);
    box(0.2, 0.2, 0.34, K.mat(ctx, THREE, "casing", "plastic", opts), 0, 0, -0.08, 0.03, arm);
    box(0.06, BY + CS * 0.45 - 0.1, 0.06, metal, 0, -(BY + CS * 0.45) / 2 + 0.05, -0.08, 0.01, arm);
    rod = K.mesh(THREE, new THREE.CylinderGeometry(0.03, 0.03, 1, 12), metal); rod.rotation.x = Math.PI / 2; arm.add(rod);
    plate = box(0.42, 0.34, 0.04, K.mat(ctx, THREE, "bad", "plastic", opts), 0, 0, 0.12, 0.012, arm);
  }

  // the crates: the lead crate (index 0) carries the accent band; words only from opts.crates
  const crates = [], crateG = new THREE.Group(); root.add(crateG);
  const crateM = K.mat(ctx, THREE, opts.crateColour || "paper2", "matte", opts, { roughness: 0.75 });
  for (let i = 0; i < NC; i++) {
    const c = new THREE.Group(); crateG.add(c);
    box(CS, CS * 0.8, CS, crateM, 0, 0, 0, 0.03, c);
    box(CS + 0.01, 0.06, CS + 0.01, K.mat(ctx, THREE, i === 0 ? "ui" : "trim", "plastic", opts), 0, CS * 0.22, 0, 0.01, c);
    const t = crateLabels[i];
    if (t) {
      const cf = K.face(ctx, THREE, 400, 170);
      cf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "paper", opts); K.rr(g, 0, 0, w, h, 18); g.fill();
        g.fillStyle = K.hexOf(ctx, "ink", opts); g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(K.fitText(g, String(t), w - 30, (q) => K.font(ctx, "title", q, 700), 64), w / 2, h / 2 + 3); });
      const lb = new THREE.Mesh(new THREE.PlaneGeometry(CS * 0.92, CS * 0.92 * 170 / 400), new THREE.MeshBasicMaterial({ map: cf.tex, toneMapped: false }));
      lb.position.set(0, -0.04, CS / 2 + 0.004); c.add(lb);
      const lt = lb.clone(); lt.rotation.x = -Math.PI / 2; lt.position.set(0, CS * 0.4 + 0.004, 0.03); c.add(lt);
    }
    crates.push(c);
  }

  group.add(K.contactShadow(ctx, THREE, L * 1.15, 3.2, 0.3));

  // the schedule: segments from a station and a position, until a failing or waiting station (or the end)
  const schedule = (from, x0) => {
    const segs = []; let t = 0, x = x0, block = -1;
    for (let j = from; j < N; j++) {
      const xc = xCheck(j);
      if (xc > x) { segs.push({ k: "move", t0: t, t1: t + (xc - x), x0: x, x1: xc }); t += xc - x; x = xc; }
      segs.push({ k: "check", j, t0: t, t1: t + CK }); t += CK;
      if (results[j] !== "pass") { block = j; break; }
    }
    if (block < 0) { segs.push({ k: "move", t0: t, t1: t + (xDel - x), x0: x, x1: xDel }); t += xDel - x; }
    return { segs, T: t, block, x0 };
  };
  const A = schedule(0, qFront);
  const B = A.block >= 0 && results[A.block] === "wait" ? schedule(A.block + 1, xCheck(A.block)) : null;
  const evalSched = (S, u, cp) => {
    let x = S.x0;
    for (const s of S.segs) {
      if (s.k === "move") { if (u >= s.t1) x = s.x1; else if (u > s.t0) x = K.lerp(s.x0, s.x1, K.easeInOut((u - s.t0) / (s.t1 - s.t0))); else { x = s.x0; break; } }
      else { cp[s.j] = K.clamp((u - s.t0) / (s.t1 - s.t0)); if (u < s.t1) break; }
    }
    return x;
  };

  const cOk = K.col(ctx, "ok", opts), cBad = K.col(ctx, "bad", opts), cIdle = K.col(ctx, "trim", opts), cWarm = K.col(ctx, "warm", opts), cUi = K.col(ctx, "ui", opts);
  const stt = { run: 0, reject: 0, approve: 0 };
  const apply = () => {
    const cp = new Array(N).fill(0);
    let x = evalSched(A, stt.run * A.T, cp);
    const ap = K.clamp(stt.approve), lift2 = K.easeInOut(K.clamp(ap / 0.35));
    const atWait = B && cp[A.block] >= 1;
    if (atWait) x = evalSched(B, K.clamp((ap - 0.35) / 0.65) * B.T, cp);
    // lamps and gates
    for (let j = 0; j < N; j++) {
      const c = cp[j], r = results[j], lm = lamps[j];
      let col = cIdle, glow = 0.15, lift = 0;
      if (c > 0 && c < 1) { col = cUi; glow = 0.6 + 0.6 * (0.5 + 0.5 * Math.cos(c * Math.PI * 6)); }
      else if (c >= 1) {
        if (r === "pass") { col = cOk; glow = 1.0; }
        else if (r === "fail") { col = cBad; glow = 1.3; }
        else { col = cWarm.clone().lerp(cOk, j === A.block ? lift2 : 0); glow = 1.1; lift = j === A.block ? lift2 : 0; }
      }
      if (r === "pass") lift = K.easeInOut(K.clamp((c - 0.6) / 0.4));
      lm.color.copy(col); lm.emissive.copy(col); lm.emissiveIntensity = glow;
      gates[j].position.y = GY + 0.62 * lift;
    }
    // the lead crate, and the reject when it is held at a failing station
    const lead = crates[0], failHeld = FAIL >= 0 && A.block === FAIL ? K.clamp((cp[FAIL] - 0.9) * 10) : 0;
    const kr = K.clamp(stt.reject) * failHeld;
    const push = K.easeInOut(K.clamp(kr / 0.45)), slide = K.easeInOut(K.clamp((kr - 0.45) / 0.55));
    const yTop = BY + CS * 0.4;
    lead.position.set(x, yTop, 0); lead.rotation.set(0, 0, 0);
    if (kr > 0) {
      const zEdge = CZ0 + CS * 0.35;
      lead.position.z = push * zEdge;
      if (slide > 0) {
        const d = slide * (Math.hypot(CZ1 - CZ0, BY - CY1) - CS * 0.6);
        lead.position.z = zEdge + Math.cos(slope) * d; lead.position.y = yTop - Math.sin(slope) * d;
        lead.rotation.x = slope * K.clamp(slide * 4);
      }
    }
    if (arm) {
      const ext = push * (1 - K.easeInOut(K.clamp((kr - 0.6) / 0.4)));
      const reach = 0.42 - BZ / 2 + CS / 2 + 0.3;          // from the housing to past the belt's far edge
      const pz = 0.12 + ext * (reach + CZ0);
      plate.position.z = pz; rod.scale.y = Math.max(0.05, pz); rod.position.z = pz / 2;
    }
    // the queue: the next crates move up one place once the lead leaves the line (pushed off, or delivered)
    const delivered = A.block < 0 ? K.clamp((x - (xDel - 0.6)) / 0.6) : B && B.block < 0 ? K.clamp((x - (xDel - 0.6)) / 0.6) : 0;
    const shift = Math.max(K.easeInOut(kr), delivered);
    for (let i = 1; i < NC; i++) crates[i].position.set(qFront - i * QS + shift * QS, yTop, 0);
    // the belt keeps running whatever happens to one crate
    bf.tex.offset.x = -(stt.run * A.T + stt.reject * 1.2 + stt.approve * (B ? B.T : 0)) / 0.7;
  };
  apply();
  return {
    group, size: [L + 0.2, TOPY + 0.6, BZ + 2.1], parts: { belt, stations, gates: gates[0] ? gates[0].parent : null, lamps: stations, crates: crateG, chute, arm },
    keys: ["run", "reject", "approve", "turn"],
    set(key, v) {
      if (key === "run" || key === "reject" || key === "approve") { stt[key] = K.clamp(v); apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
