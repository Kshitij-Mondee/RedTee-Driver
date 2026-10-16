// @model {"id": "chunk_cabinet", "pack": "ai_ml", "what": "an index cabinet of shallow drawers, each a document chunk with a short label (from opts); pages drop in and become drawers, a query card arrives and a beam sweeps, the caller's top-k drawers slide out in rank order and their cards lift into a stack (into the prompt)", "parts": ["cabinet", "drawers", "labels", "pages", "query_card", "beam", "stack"], "keys": {"index": "0..1 pages drop in and become drawers, one by one (chunking)", "query": "0..1 the query card arrives at the front and a beam sweeps the drawers", "topk": "0..1 the drawers named in opts.topk (indexes, in rank order) slide out in that order; none open without opts.topk", "hand_off": "0..1 a card lifts from each chosen drawer and stacks beside the cabinet, rank 1 at the bottom (into the prompt)", "turn": "radians about y"}, "best_for": ["retrieval-augmented generation: chunk, index, retrieve, hand to the model", "how an assistant finds the right passage in company documents", "search as similarity, then a citation beat"], "not_for": ["how the similarity is computed (use embedding_space)", "a real number of chunks (the drawer count is illustrative)"], "size": [2.9, 1.75, 1.6], "sheet": {"opts": {"labels": ["Leave policy", "Expenses", "Travel", "Security", "Onboarding", "Benefits", "Payroll", "IT help"], "query": "How many leave days?", "topk": [0, 5, 6]}, "states": [{"key": "index", "from": 0, "to": 1, "at": 0.3, "dur": 1.5}, {"key": "query", "from": 0, "to": 1, "at": 1.9, "dur": 1.0}, {"key": "topk", "from": 0, "to": 1, "at": 3.0, "dur": 1.1}, {"key": "hand_off", "from": 0, "to": 1, "at": 4.2, "dur": 1.2}], "elevation": 16, "turn": 0.7, "mood": "clean_bench"}}
// Accuracy (topic-asset-needs 8.9): the chosen drawers are exactly opts.topk, in the caller's rank order, never guessed
// (the lesson's retrieval decides them; similarity, not keyword alone, unless the lesson's system is keyword search);
// the chosen chunks go into the prompt (the stack), and a citation beat should follow, since the model can still
// misread them. The drawer count is illustrative. Words (drawer labels, the query) come only from opts.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const labels = opts.labels || [];
  const N = Math.max(6, Math.min(12, opts.drawers || labels.length || 8)), COLS = N > 8 ? 3 : 2, ROWS = Math.ceil(N / COLS);
  const W = COLS === 3 ? 1.5 : 1.2, H = 1.45, D = 0.9, LEG = 0.12, GAP = 0.035, FR = 0.06;
  const dw = (W - 2 * FR - (COLS - 1) * GAP) / COLS, dh = (H - 2 * FR - (ROWS - 1) * GAP) / ROWS;
  const topk = (opts.topk || []).filter((i) => Number.isInteger(i) && i >= 0 && i < N).filter((i, j, a) => a.indexOf(i) === j);
  const group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot);
  const shell = K.mat(ctx, THREE, "casing", "plastic", opts, { roughness: 0.55 }), paper = K.mat(ctx, THREE, "paper", "paper", opts);

  // the cabinet: back, sides, top, bottom on a plinth with feet; open at the front, dark slots behind the drawers
  const cabinet = new THREE.Group(); pivot.add(cabinet);
  for (const [w, h, d, x, y, z] of [[W, H, 0.04, 0, H / 2, -D / 2 + 0.02], [FR, H, D, -W / 2 + FR / 2, H / 2, 0], [FR, H, D, W / 2 - FR / 2, H / 2, 0],
    [W + 0.04, FR, D + 0.04, 0, H - FR / 2, 0], [W, FR, D, 0, FR / 2, 0]]) {
    const m = K.mesh(THREE, K.rbox(THREE, X, w, h, d, 0.015, 2), shell); m.position.set(x, y + LEG, z); cabinet.add(m);
  }
  const slots = K.mesh(THREE, new THREE.PlaneGeometry(W - 2 * FR, H - 2 * FR), K.mat(ctx, THREE, "casing2", "matte", opts), false);
  slots.position.set(0, LEG + H / 2, -D / 2 + 0.05); cabinet.add(slots);
  for (let r = 1; r < ROWS; r++) for (let c = 0; c < COLS; c++) {                     // the runners between rows
    const m = K.mesh(THREE, new THREE.BoxGeometry(dw, 0.012, D - 0.08), shell); m.position.set(-W / 2 + FR + dw / 2 + c * (dw + GAP), LEG + FR + r * (dh + GAP) - GAP / 2, 0); cabinet.add(m);
  }
  for (const s of [-1, 1]) for (const z of [-1, 1]) {
    const f = K.mesh(THREE, new THREE.CylinderGeometry(0.035, 0.045, LEG, 16), K.mat(ctx, THREE, "metal", "metal", opts)); f.position.set(s * (W / 2 - 0.08), LEG / 2, z * (D / 2 - 0.08)); cabinet.add(f);
  }

  // drawers: a front with a label holder and a pull, a tray behind it holding upright index cards
  const slotPos = (i) => { const r = Math.floor(i / COLS), c = i % COLS; return [-W / 2 + FR + dw / 2 + c * (dw + GAP), LEG + H - FR - dh / 2 - r * (dh + GAP)]; };
  const drawers = [], pages = [], cards = [];
  const drawersG = new THREE.Group(), pagesG = new THREE.Group(), stackG = new THREE.Group(); pivot.add(drawersG, pagesG, stackG);
  const tray = K.mat(ctx, THREE, "paper2", "matte", opts), pull = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.25 });
  const plate = (s, w, h, bg) => {
    const f = K.face(ctx, THREE, 512, Math.round(512 * h / w));
    f.draw((g, cw, ch) => {
      g.fillStyle = K.hexOf(ctx, bg, opts); g.fillRect(0, 0, cw, ch);
      g.strokeStyle = K.hexOf(ctx, "trim", opts); g.lineWidth = ch * 0.07; K.rr(g, ch * 0.06, ch * 0.06, cw - ch * 0.12, ch * 0.88, ch * 0.12); g.stroke();
      if (s) { g.fillStyle = K.hexOf(ctx, "ink", opts); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(K.fitText(g, s, cw * 0.86, (q) => K.font(ctx, "body", q, 700), ch * 0.5), cw / 2, ch / 2 + 2); }
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: f.tex, toneMapped: false }));
  };
  for (let i = 0; i < N; i++) {
    const [x, y] = slotPos(i), dr = new THREE.Group();
    const frontMat = K.mat(ctx, THREE, "paper", "plastic", opts, { emissive: K.col(ctx, "ui", opts), emissiveIntensity: 0 });
    const front = K.mesh(THREE, K.rbox(THREE, X, dw - 0.01, dh - 0.01, 0.04, 0.012, 2), frontMat); front.position.z = D / 2 - 0.02; dr.add(front);
    const lab = plate(labels[i], dw * 0.7, Math.min(dh * 0.36, 0.1), "paper"); lab.position.set(0, dh * 0.14, D / 2 + 0.0015); dr.add(lab);
    const knob = K.mesh(THREE, new THREE.CylinderGeometry(0.018, 0.022, 0.03, 16), pull); knob.rotation.x = Math.PI / 2; knob.position.set(0, -dh * 0.24, D / 2 + 0.015); dr.add(knob);
    for (const [w, h, d, px, py, pz] of [[dw - 0.04, 0.01, D - 0.12, 0, -dh / 2 + 0.03, 0], [0.01, dh * 0.55, D - 0.12, -dw / 2 + 0.025, -dh * 0.2, 0], [0.01, dh * 0.55, D - 0.12, dw / 2 - 0.025, -dh * 0.2, 0], [dw - 0.04, dh * 0.55, 0.01, 0, -dh * 0.2, -D / 2 + 0.07]]) {
      const m = K.mesh(THREE, new THREE.BoxGeometry(w, h, d), tray); m.position.set(px, py, pz); dr.add(m);
    }
    for (let c = 0; c < 4; c++) {                                                         // upright index cards
      const m = K.mesh(THREE, new THREE.BoxGeometry(dw - 0.08, dh * 0.62, 0.006), paper, false); m.position.set(0, -dh / 2 + 0.03 + dh * 0.31, D / 2 - 0.16 - c * 0.12); dr.add(m);
    }
    dr.position.set(x, y, 0); drawersG.add(dr); drawers.push({ dr, frontMat, x, y });
    const pg = K.mesh(THREE, new THREE.BoxGeometry(dw * 0.8, dh * 0.95, 0.008), paper); pagesG.add(pg); pages.push(pg);
  }
  // the chosen cards that travel to the stack: one per top-k drawer, carrying its drawer's label
  topk.forEach((d) => { const c = new THREE.Group(); const body = K.mesh(THREE, K.rbox(THREE, X, 0.5, 0.012, 0.32, 0.004, 1), paper); c.add(body);
    const lab = plate(labels[d], 0.4, 0.09, "paper"); lab.rotation.x = -Math.PI / 2; lab.position.set(0, 0.0075, -0.105); c.add(lab); stackG.add(c); cards.push({ c, d }); });

  // the query card on a small easel at the front left, and the beam that sweeps the fronts
  const qCard = new THREE.Group(); pivot.add(qCard);
  const qf = K.face(ctx, THREE, 640, 400);
  qf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "paper", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, "ui", opts); g.fillRect(0, 0, w, h * 0.12);
    if (opts.query) { g.fillStyle = K.hexOf(ctx, "ink", opts); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(K.fitText(g, opts.query, w * 0.88, (q) => K.font(ctx, "title", q, 700), h * 0.17), w / 2, h * 0.56); }
    else { g.fillStyle = K.hexOf(ctx, "paper2", opts); for (let i = 0; i < 3; i++) { K.rr(g, w * 0.1, h * (0.32 + i * 0.18), w * (0.8 - i * 0.18), h * 0.08, h * 0.04); g.fill(); } }
  });
  const qBody = K.mesh(THREE, K.rbox(THREE, X, 0.62, 0.4, 0.02, 0.01, 2), paper); qCard.add(qBody);
  const qFace = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.375), new THREE.MeshBasicMaterial({ map: qf.tex, toneMapped: false })); qFace.position.z = 0.011; qCard.add(qFace);
  const easel = K.mesh(THREE, new THREE.CylinderGeometry(0.012, 0.012, 0.45, 8), pull); easel.position.set(0, -0.385, -0.03); qCard.add(easel);   // a stand to the floor
  const foot = K.mesh(THREE, new THREE.CylinderGeometry(0.09, 0.1, 0.02, 24), pull); foot.position.set(0, -0.6, -0.03); qCard.add(foot);
  const QX = -W / 2 - 0.42, QZ = D / 2 + 0.25;
  const beamMat = new THREE.MeshBasicMaterial({ color: K.col(ctx, "ui", opts), transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.1, 0.07), beamMat); beam.position.z = D / 2 + 0.03; pivot.add(beam);
  // the prompt tray the chosen chunks land in (only when there is a top-k to receive)
  if (topk.length) { const t = K.mesh(THREE, K.rbox(THREE, X, 0.62, 0.03, 0.4 + 0.11 * topk.length, 0.012, 2), K.mat(ctx, THREE, "ui", "plastic", opts)); t.position.set(W / 2 + 0.45, 0.015, 0.14 + 0.055 * (topk.length - 1)); stackG.add(t); }
  group.add(K.contactShadow(ctx, THREE, W + 2.2, D + 1.4, 0.4));

  const paperC = K.col(ctx, "paper", opts), uiC = K.col(ctx, "ui", opts);
  const st = { index: opts.index == null ? 1 : K.clamp(opts.index), query: 0, topk: 0, hand_off: 0 };
  const apply = () => {
    // index: page i falls from above to its slot and turns into drawer i
    drawers.forEach((o, i) => {
      const k = K.clamp(st.index * (N * 0.25 + 1) - i * 0.25), fall = K.clamp(k / 0.75), swap = K.clamp((k - 0.75) / 0.25), pg = pages[i];
      pg.visible = k > 0 && k < 1; pg.position.set(o.x, o.y + (1 - K.easeInOut(fall)) * (H + 0.6 - o.y + LEG), D / 2 + 0.06);
      pg.rotation.z = (1 - fall) * 0.5 * (i % 2 ? 1 : -1); pg.scale.setScalar(Math.max(1e-3, 1 - 0.2 * swap));
      o.dr.visible = k >= 0.75; o.dr.scale.set(1, Math.max(1e-3, swap), 1);
    });
    // query: the card arrives at the front left, then the beam sweeps top to bottom
    const qa = K.easeOut(K.clamp(st.query / 0.45)), sw = K.clamp((st.query - 0.4) / 0.6);
    qCard.visible = st.query > 0; qCard.position.set(QX - (1 - qa) * 0.9, 0.61, QZ); qCard.rotation.set(0, 0.5 - (1 - qa) * 0.6, 0);
    beam.visible = sw > 0 && sw < 1; beam.position.y = LEG + H - FR - sw * (H - 2 * FR); beamMat.opacity = 0.5 * Math.sin(Math.PI * sw);
    // topk: the caller's drawers slide out in rank order and light; hand_off: their cards lift into the stack
    drawers.forEach((o) => { o.dr.position.z = 0; o.frontMat.emissiveIntensity = 0; o.frontMat.color.copy(paperC); });
    topk.forEach((d, r) => {
      const k = K.easeInOut(K.clamp(st.topk * (topk.length * 0.5 + 0.5) - r * 0.5)), o = drawers[d];
      o.dr.position.z = 0.42 * k; o.frontMat.color.copy(paperC).lerp(uiC, 0.75 * k); o.frontMat.emissiveIntensity = 0.25 * k;
    });
    cards.forEach(({ c, d }, r) => {
      const k = K.clamp(st.hand_off * (cards.length * 0.45 + 0.55) - r * 0.45), e = K.easeInOut(k), o = drawers[d];
      const from = new THREE.Vector3(o.x, o.y + dh * 0.1, o.dr.position.z + D / 2 - 0.16), to = new THREE.Vector3(W / 2 + 0.45, 0.05 + r * 0.02, 0.14 + r * 0.11);   // fanned, so every label shows
      c.visible = k > 0; c.position.copy(from).lerp(to, e); c.position.y += Math.sin(Math.PI * e) * 0.45;
      c.rotation.set((1 - e) * Math.PI / 2, 0, 0);
    });
  };
  apply();
  return {
    group, size: [W + 1.7, H + LEG + 0.18, D + 0.7], parts: { cabinet, drawers: drawersG, labels: drawers[0].dr, pages: pagesG, query_card: qCard, beam, stack: stackG },
    keys: ["index", "query", "topk", "hand_off", "turn"],
    set(key, v) {
      if (key === "index") { st.index = K.clamp(v); apply(); }
      else if (key === "query") { st.query = K.clamp(v); apply(); }
      else if (key === "topk") { st.topk = K.clamp(v); apply(); }
      else if (key === "hand_off") { st.hand_off = K.clamp(v); apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
