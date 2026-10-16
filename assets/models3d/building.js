// @model {"id": "building", "pack": "workplace", "what": "an office tower: glass bands of windows that light floor by floor, a canopy over the entrance, a roof plant", "parts": ["tower", "windows", "entrance"], "keys": {"lit": "0..1 the share of windows lit (a fixed scatter, the same every time)", "floors": "set at make: opts.floors (4..14)", "turn": "radians about y"}, "best_for": ["the company or head office", "an organisation as a whole", "working hours and the office day", "physical security"], "not_for": ["a factory or a shop (a place pack fits better)"], "size": [1.3, 2.6, 1.1], "sheet": {"opts": {"floors": 9}, "states": [{"key": "lit", "from": 0, "to": 1, "at": 1.0, "dur": 3.0}], "elevation": 16}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const F = Math.max(4, Math.min(14, opts.floors || 9));
  const W = 1.2, D = 1.0, FH = 0.24, H = F * FH + 0.3;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const shell = K.mat(ctx, THREE, "paper", "plastic", opts, { roughness: 0.6 });

  // the windows: one canvas per facade, redrawn when `lit` changes; the order is a fixed scatter (a hash of the index)
  const cols = 6, rows = F;
  const order = Array.from({ length: cols * rows }, (_, i) => i).sort((a, b) => ((a * 7919) % 101) - ((b * 7919) % 101));
  const rank = new Map(order.map((v, i) => [v, i]));
  const faces = [0, 1].map(() => K.face(ctx, THREE, 600, Math.round(600 * (F * FH) / W)));
  const paint = (lit) => faces.forEach((f, fi) => f.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "casing", opts); g.fillRect(0, 0, w, h);
    const cw = w / cols, rh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const on = rank.get(((r * cols + c) + fi * 13) % (cols * rows)) < lit * cols * rows;
      g.fillStyle = K.hexOf(ctx, on ? "warm" : "casing2", opts); g.globalAlpha = on ? 1 : 0.55;
      K.rr(g, c * cw + cw * 0.12, r * rh + rh * 0.18, cw * 0.76, rh * 0.62, 4); g.fill();
    }
    g.globalAlpha = 1;
  }, Math.round(lit * cols * rows)));
  paint(opts.lit || 0);
  const winMats = faces.map((f) => new THREE.MeshStandardMaterial({ map: f.tex, roughness: 0.35, metalness: 0.2, emissiveMap: f.tex, emissive: K.col(ctx, "paper", opts), emissiveIntensity: 0.35 }));
  const tower = new THREE.Group();
  const core = new THREE.Mesh(new THREE.BoxGeometry(W, F * FH, D), [winMats[1], winMats[1], shell, shell, winMats[0], winMats[0]]);
  core.castShadow = true; core.position.y = 0.18 + F * FH / 2; tower.add(core);
  // floor slabs: thin bands proud of the glass
  for (let i = 0; i <= F; i++) { const s = K.mesh(THREE, new THREE.BoxGeometry(W + 0.04, 0.025, D + 0.04), shell, false); s.position.y = 0.18 + i * FH; tower.add(s); }
  const plinth = K.mesh(THREE, K.rbox(THREE, X, W + 0.18, 0.18, D + 0.18, 0.03, 3), K.mat(ctx, THREE, "paper2", "matte", opts)); plinth.position.y = 0.09; tower.add(plinth);
  const roof = K.mesh(THREE, K.rbox(THREE, X, W * 0.5, 0.14, D * 0.45, 0.02, 3), K.mat(ctx, THREE, "metal", "metal", opts)); roof.position.set(0.15, 0.18 + F * FH + 0.07, -0.1); tower.add(roof);
  pivot.add(tower);
  // the entrance: a canopy and a door in the accent
  const entrance = new THREE.Group();
  const canopy = K.mesh(THREE, K.rbox(THREE, X, 0.56, 0.04, 0.24, 0.01, 2), K.mat(ctx, THREE, "ui", "plastic", opts)); canopy.position.set(0, 0.42, D / 2 + 0.12); entrance.add(canopy);
  const door = K.mesh(THREE, new THREE.BoxGeometry(0.36, 0.24, 0.02), K.mat(ctx, THREE, "casing", "gloss", opts)); door.position.set(0, 0.3, D / 2 + 0.012); entrance.add(door);
  pivot.add(entrance);
  group.add(K.contactShadow(ctx, THREE, W * 2.2, D * 2.2, 0.45));

  return {
    group, size: [W + 0.18, H, D + 0.3], parts: { tower, windows: core, entrance }, keys: ["lit", "floors", "turn"],
    set(key, v) {
      if (key === "lit") paint(K.clamp(v));
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
