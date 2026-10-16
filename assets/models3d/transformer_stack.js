// @model {"id": "transformer_stack", "pack": "ai_ml", "what": "a decoder-only transformer as a tower of identical blocks (each an attention slab and a feed-forward slab) on an embedding base, with a residual rail up its side; token tiles rise block by block, one block opens to show its causal attention pattern, and a row of probability bars grows on top with the highest lit", "parts": ["embed_base", "blocks", "residual_rail", "output_bars", "token_tiles", "attention_map"], "keys": {"pass": "0..1 the token tiles rise into the base and then block by block (each block lights as they pass)", "open": "0..1 block opts.focus slides apart: the blocks above lift and its feed-forward slab rises off the attention slab, showing which earlier tokens each token looks at", "predict": "0..1 the output bars grow (a spread over the vocabulary, opts.probs) and the highest one lights", "turn": "radians about y"}, "best_for": ["how a large language model predicts the next token", "layers of attention and feed-forward", "why the output is a probability spread, not one fixed word"], "not_for": ["the original encoder-decoder translation design (this is decoder-only)", "real layer counts or sizes (blocks are illustrative)"], "size": [1.8, 2.82, 1.5], "sheet": {"opts": {"blocks": 4, "focus": 1, "tokens": ["The", "cat", "sat", "on"], "probs": [0.08, 0.05, 0.46, 0.12, 0.04, 0.15, 0.06, 0.04], "outLabels": ["a", "my", "the", "it", "to", "his", "one", "her"]}, "states": [{"key": "pass", "from": 0, "to": 1, "at": 0.5, "dur": 1.9}, {"key": "open", "from": 0, "to": 1, "at": 2.6, "dur": 0.9}, {"key": "predict", "from": 0, "to": 1, "at": 4.4, "dur": 1.0}], "elevation": 14, "turn": 1.2, "mood": "clean_bench"}}
// Accuracy (topic-asset-needs 8.11): decoder-only (no encoder tower); every block is the same shape; the attention map is
// causal (a token looks only at itself and earlier tokens: the upper triangle is empty); the output is a spread of bars,
// one per vocabulary entry given, and the lit bar is the highest value the caller gave (opts.probs), never chosen here.
// Token words, output words and slab names come only from opts (tokens, outLabels, slabLabels).
const hash = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const N = Math.max(2, Math.min(8, opts.blocks || 4)), FOCUS = Math.max(0, Math.min(N - 1, opts.focus == null ? Math.floor(N / 2) : opts.focus));
  const tokens = (opts.tokens || []).slice(0, 6), T = tokens.length || 4;
  const probs = (opts.probs && opts.probs.length ? opts.probs : Array.from({ length: 8 }, (_, i) => 0.1 + 0.9 * hash(i + 11) ** 2)).slice(0, 12).map((p) => Math.max(0, +p || 0));
  const M = probs.length, pmax = Math.max(1e-6, ...probs), top = probs.indexOf(Math.max(...probs));
  const TW = 1.3, TD = 0.8, SH = 0.14, SG = 0.03, BG = 0.07, BH = 2 * SH + SG, EH = 0.18, OPEN = 0.5;
  const group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot);
  const dark = K.role(ctx, "ink", opts) === "field";
  const baseRole = dark ? "casing" : "casing2";

  // the embedding base, wider than the tower
  const embed = K.mesh(THREE, K.rbox(THREE, X, TW + 0.24, EH, TD + 0.24, 0.03, 3), K.mat(ctx, THREE, baseRole, "plastic", opts)); embed.position.y = EH / 2; pivot.add(embed);

  // blocks: an attention slab (accent) under a feed-forward slab, small spacers beneath; identical for every block
  const attnMat = () => K.mat(ctx, THREE, "ui", "plastic", opts, { emissive: K.col(ctx, "ui", opts), emissiveIntensity: 0 });
  const ffMat = () => K.mat(ctx, THREE, "paper", "plastic", opts, { emissive: K.col(ctx, "ui", opts), emissiveIntensity: 0 });
  const spacer = K.mat(ctx, THREE, "metal", "metal", opts);
  const blocks = [], blocksG = new THREE.Group(); pivot.add(blocksG);
  const slabFace = (words, role) => {
    if (!words) return null;
    const f = K.face(ctx, THREE, 1024, Math.round(1024 * (SH - 0.03) / (TW - 0.1)));
    f.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, role === "ui" ? "screen" : "ink", opts); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(K.fitText(g, words, w * 0.9, (q) => K.font(ctx, "body", q, 700), h * 0.62), w / 2, h / 2 + 2); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(TW - 0.1, SH - 0.03), new THREE.MeshBasicMaterial({ map: f.tex, transparent: true, toneMapped: false })); m.position.z = TD / 2 + 0.002; return m;
  };
  const sl = opts.slabLabels || [];
  for (let b = 0; b < N; b++) {
    const blk = new THREE.Group(), am = attnMat(), fm = ffMat();
    const attn = K.mesh(THREE, K.rbox(THREE, X, TW, SH, TD, 0.025, 3), am); attn.position.y = SH / 2; blk.add(attn);
    const ffG = new THREE.Group(); ffG.position.y = SH + SG; blk.add(ffG);
    const ff = K.mesh(THREE, K.rbox(THREE, X, TW, SH, TD, 0.025, 3), fm); ff.position.y = SH / 2; ffG.add(ff);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const s1 = K.mesh(THREE, new THREE.CylinderGeometry(0.025, 0.025, BG, 10), spacer); s1.position.set(x * (TW / 2 - 0.1), -BG / 2, z * (TD / 2 - 0.1)); blk.add(s1);
      const s2 = K.mesh(THREE, new THREE.CylinderGeometry(0.02, 0.02, SG, 10), spacer); s2.position.set(x * (TW / 2 - 0.1), -SG / 2, z * (TD / 2 - 0.1)); ffG.add(s2);
    }
    if (b === FOCUS) { const a = slabFace(sl[0], "ui"); if (a) { a.position.y = SH / 2; blk.add(a); } const f = slabFace(sl[1], "paper"); if (f) { f.position.y = SH / 2; ffG.add(f); } }
    blk.position.y = EH + BG + b * (BH + BG); blocksG.add(blk); blocks.push({ blk, ffG, am, fm, y: blk.position.y });
  }
  // the causal attention map on the focus block's attention slab (seen when it opens): row i attends to columns 0..i
  const mapF = K.face(ctx, THREE, 512, 512);
  mapF.draw((g, w) => {
    const n = T, pad = w * 0.08, c = (w - 2 * pad) / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.globalAlpha = 1; g.strokeStyle = K.hexOf(ctx, "screen", opts); g.lineWidth = 4; K.rr(g, pad + j * c + 4, pad + i * c + 4, c - 8, c - 8, 8); g.stroke();
      if (j <= i) { const wgt = 0.25 + 0.75 * hash(i * 31 + j * 7 + 1) * (j === i ? 1 : 0.8); g.globalAlpha = wgt; g.fillStyle = K.hexOf(ctx, "screen", opts); g.fill(); }
    }
  });
  const attnMap = new THREE.Mesh(new THREE.PlaneGeometry(TD * 0.8, TD * 0.8), new THREE.MeshBasicMaterial({ map: mapF.tex, transparent: true, toneMapped: false }));
  attnMap.rotation.x = -Math.PI / 2; attnMap.position.y = SH + 0.002; blocks[FOCUS].blk.add(attnMap);

  // the residual rail: a rod up the left side with an arm into every slab
  const rail = new THREE.Group(); pivot.add(rail);
  const railMat = K.mat(ctx, THREE, "cool", "plastic", opts);   // warm is kept for the chosen token
  const topY = EH + N * (BH + BG);
  const rod = K.mesh(THREE, new THREE.CylinderGeometry(0.028, 0.028, 1, 12), railMat); rod.geometry.translate(0, 0.5, 0); rod.position.set(-TW / 2 - 0.16, EH / 2, 0); rail.add(rod);
  const arms = [];
  for (let b = 0; b < N; b++) for (const s of [0, 1]) {
    const a = K.mesh(THREE, new THREE.CylinderGeometry(0.014, 0.014, 0.16, 8), railMat); a.rotation.z = Math.PI / 2; rail.add(a); arms.push({ a, b, s });
  }

  // output bars on a tray on top, and words under them (opts.outLabels)
  const out = new THREE.Group(); pivot.add(out);
  const tray = K.mesh(THREE, K.rbox(THREE, X, TW, 0.05, TD * 0.6, 0.015, 2), K.mat(ctx, THREE, baseRole, "plastic", opts)); tray.position.y = 0.025; out.add(tray);
  const bw = (TW - 0.12) / M, barBase = K.mat(ctx, THREE, "paper2", "plastic", opts), barTop = K.mat(ctx, THREE, "warm", "gloss", opts, { emissive: K.col(ctx, "warm", opts), emissiveIntensity: 0 });
  const bars = probs.map((p, i) => { const m = K.mesh(THREE, K.rbox(THREE, X, bw * 0.72, 1, bw * 0.72, 0.01, 2), i === top ? barTop : barBase); m.geometry.translate(0, 0.5, 0); m.position.set(-TW / 2 + 0.06 + bw / 2 + i * bw, 0.05, 0); out.add(m); return m; });
  if ((opts.outLabels || []).length) {
    const lf = K.face(ctx, THREE, 1600, Math.round(1600 * 0.05 / TW));
    lf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, baseRole, opts); g.fillRect(0, 0, w, h); g.textAlign = "center"; g.textBaseline = "middle";
      opts.outLabels.slice(0, M).forEach((s, i) => { if (!s) return; g.fillStyle = K.hexOf(ctx, i === top ? "warm" : "text", opts); g.fillText(K.fitText(g, s, w / M * 0.92, (q) => K.font(ctx, "body", q, 700), h * 0.78), w * (0.06 + bw / 2 + i * bw) / TW, h / 2 + 1); }); });
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(TW, 0.05), new THREE.MeshBasicMaterial({ map: lf.tex, toneMapped: false })); lm.position.set(0, 0.025, TD * 0.3 + 0.002); out.add(lm);
  }

  // token tiles: a row in front; each carries its word (opts.tokens) or stays blank
  const tilesG = new THREE.Group(); pivot.add(tilesG);
  const tileW = Math.min(0.26, (TW - 0.1) / T - 0.04), tiles = [];
  for (let i = 0; i < T; i++) {
    const t = new THREE.Group(), body = K.mesh(THREE, K.rbox(THREE, X, tileW, 0.13, 0.05, 0.015, 2), K.mat(ctx, THREE, "paper", "plastic", opts)); t.add(body);
    if (tokens[i]) { const f = K.face(ctx, THREE, 256, 128); f.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "ink", opts); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(K.fitText(g, tokens[i], w * 0.88, (q) => K.font(ctx, "body", q, 700), h * 0.5), w / 2, h / 2 + 2); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(tileW * 0.94, 0.12), new THREE.MeshBasicMaterial({ map: f.tex, transparent: true, toneMapped: false })); m.position.z = 0.026; t.add(m); }
    t.position.x = -((T - 1) / 2) * (tileW + 0.04) + i * (tileW + 0.04); tilesG.add(t); tiles.push(t);
  }
  group.add(K.contactShadow(ctx, THREE, TW + 1.2, TD + 1.2, 0.45));

  const st = { pass: 0, open: 0, predict: 0 };
  const levels = [0.07, EH / 2].concat(blocks.map((b) => b.y + BH / 2));                    // floor, base, each block's middle
  const apply = () => {
    const o = K.easeInOut(st.open) * OPEN;
    blocks.forEach((b, i) => { b.blk.position.y = b.y + (i > FOCUS ? o : 0); b.ffG.position.y = SH + SG + (i === FOCUS ? o * 0.7 : 0); });
    const lift = (i) => (i > FOCUS ? o : 0) + (i === FOCUS ? o * 0.7 : 0);
    attnMap.visible = st.open > 0.02;
    const topNow = topY + o;
    rod.scale.y = topNow - EH / 2;
    arms.forEach(({ a, b, s }) => { a.position.set(-TW / 2 - 0.08, blocks[b].y + (b > FOCUS ? o : 0) + (s ? SH + SG + SH / 2 + (b === FOCUS ? o * 0.7 : 0) : SH / 2), 0); });
    out.position.y = topNow;
    // tiles step up level by level, dwelling at each, in front of the tower
    const x = st.pass * (levels.length - 1), s = Math.min(levels.length - 2, Math.floor(x)), f = K.easeInOut(K.clamp((x - s) / 0.6));
    const lv = (k) => levels[k] + (k >= 2 ? lift(k - 2) : 0);
    tilesG.position.set(0, lv(s) + (lv(s + 1) - lv(s)) * f, TD / 2 + 0.2);
    blocks.forEach((b, i) => { const near = Math.max(0, 1 - Math.abs(x - (i + 2)) * 1.4) ; b.am.emissiveIntensity = 0.5 * near; b.fm.emissiveIntensity = 0.3 * near; });
    bars.forEach((m, i) => { const k = K.spring(K.clamp(st.predict * (M * 0.12 + 1) - i * 0.12), 0.1); m.scale.y = Math.max(0.001, k * 0.55 * probs[i] / pmax); });
    barTop.emissiveIntensity = 0.6 * K.clamp((st.predict - 0.7) / 0.3);
  };
  apply();
  return {
    group, size: [TW + 0.5, topY + OPEN + 0.62, TD + 0.7], parts: { embed_base: embed, blocks: blocksG, residual_rail: rail, output_bars: out, token_tiles: tilesG, attention_map: attnMap },
    keys: ["pass", "open", "predict", "turn"],
    set(key, v) {
      if (key === "pass") { st.pass = K.clamp(v); apply(); }
      else if (key === "open") { st.open = K.clamp(v); apply(); }
      else if (key === "predict") { st.predict = K.clamp(v); apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
