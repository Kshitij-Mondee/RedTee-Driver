// @model {"id": "phone", "pack": "devices", "what": "a smartphone standing upright: glossy shell, glass face with a live screen, camera bump, side keys", "parts": ["body", "screen", "banner", "camera"], "keys": {"screen": "a screen spec: {kind: blank|notification|code|lock|chat|login|alert|list|custom, ...words}", "wake": "0..1 screen brightness", "notify": "0..1 a banner slides down from the top (opts.notify {title, line})", "turn": "radians about y"}, "best_for": ["MFA codes and push prompts", "a phishing text", "an app notification", "mobile working"], "not_for": ["a person holding a phone (use a rig with a prop)"], "size": [0.78, 1.6, 0.09], "sheet": {"opts": {"screen": {"kind": "code", "title": "Your sign-in code", "code": "482915"}, "notify": {"title": "Sign-in request", "line": "Was this you? Tap to review"}}, "states": [{"key": "notify", "from": 0, "to": 1, "at": 2.6, "dur": 0.8}, {"key": "wake", "from": 0.2, "to": 1, "at": 0.2, "dur": 0.8}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 0.78, H = 1.6, D = 0.085;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); pivot.position.y = H / 2; group.add(pivot);

  const body = K.mesh(THREE, K.rbox(THREE, X, W, H, D, 0.11, 8), K.mat(ctx, THREE, "casing", "gloss", opts));
  pivot.add(body);
  // the glass face: a slightly darker inset that frames the screen (the bezel)
  const bezel = K.mesh(THREE, K.extrude(THREE, K.roundRect(THREE, W - 0.03, H - 0.03, 0.095), 0.004, 0), K.mat(ctx, THREE, "casing", "plastic", opts));
  bezel.position.z = D / 2 + 0.002; pivot.add(bezel);

  const SW = 1080, SH = Math.round(1080 * (H - 0.09) / (W - 0.07));
  const scr = K.face(ctx, THREE, SW, SH);
  const draw = (spec) => scr.draw((g, w, h) => K.drawUI(ctx, spec, g, w, h, opts), JSON.stringify(spec || {}));
  draw(opts.screen || { kind: "blank" });
  const screenMat = new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false });
  const screenGeo = new THREE.ShapeGeometry(K.roundRect(THREE, W - 0.07, H - 0.09, 0.07), 12);
  // ShapeGeometry UVs are in shape units: map them to 0..1
  const uv = screenGeo.attributes.uv, pos = screenGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (W - 0.07) + 0.5, pos.getY(i) / (H - 0.09) + 0.5);
  const screen = new THREE.Mesh(screenGeo, screenMat); screen.position.z = D / 2 + 0.0065; pivot.add(screen);

  // the banner: its own small face, clipped to the screen by sliding under the bezel top
  const bn = K.face(ctx, THREE, 1000, 300);
  const nt = opts.notify || {};
  bn.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "paper", opts); K.rr(g, 0, 0, w, h, 60); g.fill();
    g.fillStyle = K.hexOf(ctx, nt.colour || "ui", opts); K.rr(g, 40, 50, 110, 110, 28); g.fill();
    const F = (r, px, wt) => K.font(ctx, r, px, wt);
    g.fillStyle = K.hexOf(ctx, "ink", opts); g.textBaseline = "middle"; g.textAlign = "left";
    if (nt.title) g.fillText(K.fitText(g, nt.title, w - 230, (q) => F("title", q, 700), 64), 190, 100);
    if (nt.line) g.fillText(K.fitText(g, nt.line, w - 80, (q) => F("body", q, 500), 52), 40, 225);
  });
  const banner = new THREE.Mesh(new THREE.ShapeGeometry(K.roundRect(THREE, W - 0.12, (W - 0.12) * 0.3, 0.04), 8),
    new THREE.MeshBasicMaterial({ map: bn.tex, toneMapped: false, transparent: true }));
  { const g = banner.geometry, u2 = g.attributes.uv, p2 = g.attributes.position, bw = W - 0.12, bh = bw * 0.3;
    for (let i = 0; i < u2.count; i++) u2.setXY(i, p2.getX(i) / bw + 0.5, p2.getY(i) / bh + 0.5); }
  banner.position.set(0, H / 2 - 0.2, D / 2 + 0.009); banner.visible = false; pivot.add(banner);

  // front camera, back camera bump, side keys
  const dot = K.mesh(THREE, new THREE.CircleGeometry(0.014, 20), K.mat(ctx, THREE, "casing", "gloss", opts), false);
  dot.position.set(0, H / 2 - 0.075, D / 2 + 0.0075); pivot.add(dot);
  const camera = new THREE.Group();
  const bump = K.mesh(THREE, K.rbox(THREE, X, 0.3, 0.3, 0.025, 0.07, 6), K.mat(ctx, THREE, "casing2", "gloss", opts));
  camera.add(bump);
  for (const [x, y] of [[-0.07, 0.07], [-0.07, -0.07], [0.07, 0.07]]) {
    const lens = K.mesh(THREE, new THREE.CylinderGeometry(0.045, 0.05, 0.02, 32), K.mat(ctx, THREE, "casing", "metal", opts));
    lens.rotation.x = Math.PI / 2; lens.position.set(x, y, -0.014); camera.add(lens);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.033, 24), K.mat(ctx, THREE, "casing", "gloss", opts));
    glass.position.set(x, y, -0.0245); glass.rotation.y = Math.PI; camera.add(glass);
  }
  camera.position.set(-W / 2 + 0.22, H / 2 - 0.22, -D / 2 - 0.012); pivot.add(camera);
  for (const [y, h] of [[0.32, 0.16], [0.12, 0.1]]) {
    const key = K.mesh(THREE, K.rbox(THREE, X, 0.012, h, 0.03, 0.005, 3), K.mat(ctx, THREE, "metal", "metal", opts));
    key.position.set(W / 2 + 0.004, y, 0); pivot.add(key);
  }
  group.add(K.contactShadow(ctx, THREE, W * 2.2, D * 9 + 0.4, 0.42));

  const state = { wake: 1, notify: 0 };
  return {
    group, size: [W, H, D + 0.03], parts: { body, screen, banner, camera }, keys: ["screen", "wake", "notify", "turn"],
    set(key, v) {
      if (key === "screen") draw(v);
      else if (key === "wake") { state.wake = K.clamp(v); screenMat.color.setScalar(0.12 + 0.88 * state.wake); }
      else if (key === "notify") {
        state.notify = K.clamp(v); const k = K.spring(state.notify, 0.15);
        banner.visible = state.notify > 0; banner.position.y = H / 2 - 0.2 + (1 - k) * 0.3;
        banner.material.opacity = K.clamp(state.notify * 3);
      } else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
