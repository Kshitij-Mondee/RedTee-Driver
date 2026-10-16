// @model {"id": "tablet", "pack": "devices", "what": "a tablet in a slim case standing on its long edge (opts.portrait stands it upright): glass face with a live screen, a case lip round the glass, a camera in the case's corner cut-out", "parts": ["body", "screen", "banner", "camera", "case"], "keys": {"screen": "a screen spec: {kind: blank|notification|code|lock|chat|login|alert|list|diff|terminal|link_hover|prompt|custom, ...words} (the same as phone)", "wake": "0..1 screen brightness", "notify": "0..1 a banner slides down from the top (opts.notify {title, line})", "turn": "radians about y"}, "best_for": ["a dashboard, a form or a document read on a tablet", "field and frontline work", "a sign-in or approval prompt on a larger screen", "swapping in for the phone when the screen needs room"], "not_for": ["a person holding a tablet (use a rig with a prop)", "a laptop or desk moment (use laptop or desk_set)"], "size": [2.52, 1.8, 0.13], "sheet": {"opts": {"screen": {"kind": "list", "title": "Approvals waiting", "items": ["Travel request", "Expense claim", "Access to finance share"]}, "notify": {"title": "Sign-in request", "line": "Was this you? Tap to review"}}, "states": [{"key": "wake", "from": 0.2, "to": 1, "at": 0.2, "dur": 0.8}, {"key": "notify", "from": 0, "to": 1, "at": 2.6, "dur": 0.8}]}}
// The screen interface is the phone's on purpose (screen, wake, notify, turn; the same banner face and the same
// spring), so a scene can swap X.model("phone") for X.model("tablet") and change nothing else.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const L = 2.44, S = 1.72, D = 0.07, BZ = 0.08;              // long side, short side, body depth, bezel
  const W = opts.portrait ? S : L, H = opts.portrait ? L : S;
  const CW = W + 0.08, CH = H + 0.08, CD = D + 0.05;          // the case's outside
  const group = new THREE.Group();
  const pivot = new THREE.Group(); pivot.position.y = CH / 2; group.add(pivot);

  // the glass body: a glossy slab whose front is the bezel round the screen
  const body = K.mesh(THREE, K.rbox(THREE, X, W, H, D, 0.1, 8), K.mat(ctx, THREE, "casing", "gloss", opts));
  pivot.add(body);
  // the slim case: a ring that wraps the edges with a thin lip over the glass rim, and a back shell
  const caseMat = K.mat(ctx, THREE, opts.case || "casing2", "plastic", opts, { roughness: 0.62 });
  const ringShape = K.roundRect(THREE, CW - 0.016, CH - 0.016, 0.15);
  ringShape.holes.push(K.roundRect(THREE, W - 0.03, H - 0.03, 0.09));
  const ring = K.mesh(THREE, K.extrude(THREE, ringShape, D + 0.012, 0.008, 20), caseMat);
  ring.position.z = 0.0; pivot.add(ring);
  const shell = K.mesh(THREE, K.rbox(THREE, X, CW, CH, 0.024, 0.012, 4), caseMat);
  shell.position.z = -D / 2 - 0.012; pivot.add(shell);
  const kase = new THREE.Group(); kase.add(ring, shell); pivot.add(kase);
  // the case covers the keys with raised bumps: power on the top edge, volume on the right edge
  const keyMat = K.mat(ctx, THREE, opts.case || "casing2", "plastic", opts, { roughness: 0.5 });
  const pk = K.mesh(THREE, K.rbox(THREE, X, 0.2, 0.016, 0.034, 0.007, 3), keyMat);
  pk.position.set(W / 2 - 0.4, CH / 2 + 0.002, 0); kase.add(pk);
  for (const y of [0.34, 0.12]) {
    const vk = K.mesh(THREE, K.rbox(THREE, X, 0.016, 0.16, 0.034, 0.007, 3), keyMat);
    vk.position.set(CW / 2 + 0.002, H / 2 - 0.2 - y * 0.8, 0); kase.add(vk);
  }

  const SWd = W - 2 * BZ, SHd = H - 2 * BZ;
  const SW = 1600, SH = Math.round(1600 * SHd / SWd);
  const scr = K.face(ctx, THREE, SW, SH);
  const draw = (spec) => scr.draw((g, w, h) => K.drawUI(ctx, spec, g, w, h, opts), JSON.stringify(spec || {}));
  draw(opts.screen || { kind: "blank" });
  const screenMat = new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false });
  const screenGeo = new THREE.ShapeGeometry(K.roundRect(THREE, SWd, SHd, 0.05), 12);
  const uv = screenGeo.attributes.uv, pos = screenGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / SWd + 0.5, pos.getY(i) / SHd + 0.5);
  const screen = new THREE.Mesh(screenGeo, screenMat); screen.position.z = D / 2 + 0.0065; pivot.add(screen);

  // the banner: the phone's own face (1000 x 300) and spring, sized for a tablet's top centre
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
  const bw = Math.min(SWd - 0.1, 1.15), bh = bw * 0.3;
  const banner = new THREE.Mesh(new THREE.ShapeGeometry(K.roundRect(THREE, bw, bh, 0.05), 8),
    new THREE.MeshBasicMaterial({ map: bn.tex, toneMapped: false, transparent: true }));
  { const g = banner.geometry, u2 = g.attributes.uv, p2 = g.attributes.position;
    for (let i = 0; i < u2.count; i++) u2.setXY(i, p2.getX(i) / bw + 0.5, p2.getY(i) / bh + 0.5); }
  const by = SHd / 2 - 0.07 - bh / 2;
  banner.position.set(0, by, D / 2 + 0.009); banner.visible = false; pivot.add(banner);

  // front camera on the top bezel; the back camera sits in a cut-out at the case's corner
  const dot = K.mesh(THREE, new THREE.CircleGeometry(0.016, 20), K.mat(ctx, THREE, "casing", "gloss", opts), false);
  dot.position.set(0, H / 2 - BZ / 2, D / 2 + 0.0075); pivot.add(dot);
  const camera = new THREE.Group();
  const cut = K.mesh(THREE, K.rbox(THREE, X, 0.3, 0.3, 0.012, 0.08, 4), K.mat(ctx, THREE, "casing", "plastic", opts));
  camera.add(cut);
  const bump = K.mesh(THREE, K.rbox(THREE, X, 0.24, 0.24, 0.02, 0.06, 5), K.mat(ctx, THREE, "casing", "gloss", opts));
  bump.position.z = -0.01; camera.add(bump);
  for (const [x, y] of [[-0.055, 0.0], [0.055, 0.0]]) {
    const lens = K.mesh(THREE, new THREE.CylinderGeometry(0.038, 0.042, 0.016, 32), K.mat(ctx, THREE, "metal", "metal", opts));
    lens.rotation.x = Math.PI / 2; lens.position.set(x, y, -0.024); camera.add(lens);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.027, 24), K.mat(ctx, THREE, "casing", "gloss", opts));
    glass.position.set(x, y, -0.0325); glass.rotation.y = Math.PI; camera.add(glass);
  }
  camera.position.set(-W / 2 + 0.24, H / 2 - 0.24, -D / 2 - 0.026); pivot.add(camera);
  group.add(K.contactShadow(ctx, THREE, CW * 1.6, CD * 9 + 0.4, 0.42));

  const state = { wake: 1, notify: 0 };
  return {
    group, size: [CW, CH, CD + 0.03], parts: { body, screen, banner, camera, case: kase }, keys: ["screen", "wake", "notify", "turn"],
    set(key, v) {
      if (key === "screen") draw(v);
      else if (key === "wake") { state.wake = K.clamp(v); screenMat.color.setScalar(0.12 + 0.88 * state.wake); }
      else if (key === "notify") {
        state.notify = K.clamp(v); const k = K.spring(state.notify, 0.15);
        banner.visible = state.notify > 0; banner.position.y = by + (1 - k) * 0.3;
        banner.material.opacity = K.clamp(state.notify * 3);
      } else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
