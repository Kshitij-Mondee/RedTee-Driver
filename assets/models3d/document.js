// @model {"id": "document", "pack": "workplace", "what": "a printed document standing on its edge, a stack behind it; a stamp lands on it", "parts": ["sheet", "stack", "stamp"], "keys": {"stamp": "0..1 the stamp presses down onto the page (opts.stamp {text, colour: ok|bad})", "pages": "0..1 the pages behind fan out", "turn": "radians about y"}, "best_for": ["a policy or contract", "an approval or rejection", "a report handed over", "evidence in a review"], "not_for": ["reading a long text (put the words on screen as text)"], "size": [1.3, 1.72, 0.3], "sheet": {"opts": {"title": "Expense policy", "lines": 7, "stamp": {"text": "APPROVED", "colour": "ok"}, "pages": 3}, "states": [{"key": "pages", "from": 0, "to": 1, "at": 1.2, "dur": 0.8}, {"key": "stamp", "from": 0, "to": 1, "at": 2.4, "dur": 0.6}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 1.24, H = 1.66, T = 0.012;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);

  const sf = K.face(ctx, THREE, 1000, Math.round(1000 * H / W));
  sf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "paper", opts); g.fillRect(0, 0, w, h);
    let y = 120;
    if (opts.title) { g.fillStyle = K.hexOf(ctx, "ink", opts); g.textBaseline = "middle"; g.font = K.font(ctx, "title", 70, 700);
      g.fillText(K.fitText(g, opts.title, w - 160, (q) => K.font(ctx, "title", q, 700), 70), 80, y); y += 70; }
    g.fillStyle = K.hexOf(ctx, "ui", opts); g.fillRect(80, y, 160, 10); y += 70;
    g.fillStyle = K.hexOf(ctx, "ink", opts); g.globalAlpha = 0.16;
    const n = opts.lines || 8;
    for (let i = 0; i < n; i++) { K.rr(g, 80, y + i * 92, (w - 160) * [0.96, 0.88, 0.92, 0.7, 0.95, 0.82, 0.9, 0.6][i % 8], 34, 17); g.fill(); }
  });
  const sheetMat = new THREE.MeshStandardMaterial({ map: sf.tex, roughness: 0.92 });
  const edge = K.mat(ctx, THREE, "paper2", "paper", opts);
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), [edge, edge, edge, edge, sheetMat, edge]);
  sheet.castShadow = true; sheet.position.y = H / 2; pivot.add(sheet);

  // the pages behind: plain sheets that fan back from the bottom edge
  const stack = new THREE.Group(); pivot.add(stack);
  const pages = [];
  for (let i = 0; i < (opts.pages == null ? 2 : opts.pages); i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), K.mat(ctx, THREE, i % 2 ? "paper" : "paper2", "paper", opts));
    p.castShadow = true; p.geometry.translate(0, H / 2, 0); p.position.z = -0.03 * (i + 1); stack.add(p); pages.push(p);
  }

  // the stamp: a rounded frame with its word (only opts.stamp.text), pressed on at a slight angle
  const S = opts.stamp || null;
  const stamp = new THREE.Group();
  if (S) {
    const tf = K.face(ctx, THREE, 800, 300);
    tf.draw((g, w, h) => {
      const c = K.hexOf(ctx, S.colour || "ok", opts);
      g.strokeStyle = c; g.lineWidth = 22; K.rr(g, 20, 20, w - 40, h - 40, 40); g.stroke();
      g.fillStyle = c; g.textAlign = "center"; g.textBaseline = "middle";
      if (S.text) g.fillText(K.fitText(g, S.text, w - 120, (q) => K.font(ctx, "title", q, 800), 140), w / 2, h / 2 + 6);
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.62, W * 0.62 * 0.375), new THREE.MeshBasicMaterial({ map: tf.tex, transparent: true, toneMapped: false }));
    stamp.add(plane); stamp.position.set(0.08, H * 0.32, T / 2 + 0.003); stamp.rotation.z = 0.16; pivot.add(stamp);
  }
  stamp.visible = false;
  group.add(K.contactShadow(ctx, THREE, W * 1.5, 0.7, 0.4));

  const setPages = (k) => pages.forEach((p, i) => { p.rotation.x = -K.easeOut(k) * 0.06 * (i + 1); });
  setPages(0);
  return {
    group, size: [W, H, 0.3], parts: { sheet, stack, stamp }, keys: ["stamp", "pages", "turn"],
    set(key, v) {
      if (key === "stamp") {
        const k = K.clamp(v); stamp.visible = !!S && k > 0;
        const s = 1 + 0.9 * (1 - K.spring(k, 0.3)); stamp.scale.set(s, s, s);
        stamp.children.forEach((c) => { c.material.opacity = K.clamp(k * 2.5); });
      } else if (key === "pages") setPages(K.clamp(v));
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
