// @model {"id": "laptop", "pack": "devices", "what": "an open laptop: aluminium base with a keyboard and trackpad, a hinged lid with a live screen", "parts": ["base", "lid", "screen", "keyboard"], "keys": {"lid": "0 closed .. 1 open (about 105 degrees)", "screen": "a screen spec (see kit3d drawUI)", "wake": "0..1 screen brightness", "turn": "radians about y"}, "best_for": ["remote work and devices", "a sign-in page", "an email arriving on a work machine", "opening the laptop to start the day"], "not_for": ["a desk scene with a person (use a rig or a place)"], "size": [1.62, 1.12, 1.12], "sheet": {"opts": {"screen": {"kind": "login", "title": "Sign in to Workspace", "field1": "name@company.com", "field2": "Password", "button": "Continue"}}, "states": [{"key": "lid", "from": 0.05, "to": 1, "at": 0.6, "dur": 1.4}, {"key": "wake", "from": 0, "to": 1, "at": 1.6, "dur": 0.6}], "elevation": 18}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 1.6, D = 1.08, T = 0.05, LH = 1.04, LT = 0.03;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);

  const base = K.mesh(THREE, K.rbox(THREE, X, W, T, D, 0.024, 5), K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.38 }));
  base.position.y = T / 2; pivot.add(base);

  // the keyboard deck: one canvas of keys in the casing tone, set into the base
  const kb = K.face(ctx, THREE, 1400, 560);
  kb.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "metal", opts); g.fillRect(0, 0, w, h);
    const rows = [14, 14, 13, 12, 11], kw = w / 15.2, kh = h / 6.2;
    g.fillStyle = K.hexOf(ctx, "casing", opts);
    rows.forEach((n, r) => {
      const x0 = (w - n * kw) / 2;
      for (let i = 0; i < n; i++) { K.rr(g, x0 + i * kw + kw * 0.07, r * kh * 1.15 + kh * 0.3, kw * 0.86, kh * 0.9, 8); g.fill(); }
    });
    K.rr(g, w * 0.3, 5 * kh * 1.15 + kh * 0.3, w * 0.4, kh * 0.9, 8); g.fill();     // the space bar row
  });
  const keyboard = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, D * 0.42), new THREE.MeshStandardMaterial({ map: kb.tex, roughness: 0.7 }));
  keyboard.rotation.x = -Math.PI / 2; keyboard.position.set(0, T + 0.001, -D * 0.12); pivot.add(keyboard);
  const pad = K.mesh(THREE, K.rbox(THREE, X, W * 0.34, 0.004, D * 0.26, 0.002, 2), K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.2 }), false);
  pad.position.set(0, T + 0.001, D * 0.3); pivot.add(pad);

  // the lid: hinged at the back edge of the base
  const hinge = new THREE.Group(); hinge.position.set(0, T, -D / 2 + 0.02); pivot.add(hinge);
  const lid = K.mesh(THREE, K.rbox(THREE, X, W, LH, LT, 0.03, 5), K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.38 }));
  lid.position.set(0, LH / 2, 0); hinge.add(lid);
  const bezel = K.mesh(THREE, K.rbox(THREE, X, W - 0.03, LH - 0.03, 0.004, 0.02, 3), K.mat(ctx, THREE, "casing", "gloss", opts), false);
  bezel.position.set(0, LH / 2, LT / 2 + 0.001); hinge.add(bezel);
  const SW = 1600, SH = Math.round(1600 * (LH - 0.12) / (W - 0.1));
  const scr = K.face(ctx, THREE, SW, SH);
  const draw = (spec) => scr.draw((g, w, h) => K.drawUI(ctx, spec, g, w, h, opts), JSON.stringify(spec || {}));
  draw(opts.screen || { kind: "blank" });
  const screenMat = new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, LH - 0.12), screenMat);
  screen.position.set(0, LH / 2 + 0.01, LT / 2 + 0.004); hinge.add(screen);
  group.add(K.contactShadow(ctx, THREE, W * 1.6, D * 1.6, 0.4));

  const setLid = (k) => { hinge.rotation.x = (1 - K.clamp(k)) * (Math.PI / 2 - 0.03) - K.clamp(k) * 0.26; };
  setLid(opts.lid == null ? 1 : opts.lid);
  return {
    group, size: [W, LH + T, D + 0.1], parts: { base, lid, screen, keyboard }, keys: ["lid", "screen", "wake", "turn"],
    set(key, v) {
      if (key === "lid") setLid(v);
      else if (key === "screen") draw(v);
      else if (key === "wake") screenMat.color.setScalar(0.1 + 0.9 * K.clamp(v));
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
