// @model {"id": "monitor", "pack": "devices", "what": "a desktop monitor on a stand: thin bezel, live screen, a round foot", "parts": ["display", "screen", "stand"], "keys": {"screen": "a screen spec (see kit3d drawUI)", "wake": "0..1 screen brightness", "tilt": "-1..1 the display tips back or forward", "turn": "radians about y"}, "best_for": ["a dashboard or report on screen", "an office workstation", "a system alert seen at a desk"], "not_for": ["a phone or a laptop moment (use those models)"], "size": [2.3, 1.9, 0.7], "sheet": {"opts": {"screen": {"kind": "list", "title": "Open tickets", "items": ["Password reset", "VPN access", "New laptop", "Badge not working"]}}, "states": [{"key": "wake", "from": 0, "to": 1, "at": 1.0, "dur": 0.7}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const DW = 2.3, DH = 1.36, DT = 0.07, NECK = 0.42;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);

  // the stand: a round foot (a flattened lathe), a neck, a hinge block
  const foot = K.mesh(THREE, K.lathe(THREE, [[0, 0], [0.34, 0], [0.36, 0.012], [0.35, 0.03], [0.1, 0.045], [0, 0.045]], 64), K.mat(ctx, THREE, "metal", "metal", opts));
  pivot.add(foot);
  const neck = K.mesh(THREE, K.rbox(THREE, X, 0.14, NECK + 0.32, 0.06, 0.025, 4), K.mat(ctx, THREE, "metal", "metal", opts));
  neck.position.set(0, 0.045 + (NECK + 0.32) / 2, -0.12); neck.rotation.x = -0.08; pivot.add(neck);
  const stand = new THREE.Group(); stand.add(foot, neck); pivot.add(stand);

  const tiltG = new THREE.Group(); tiltG.position.set(0, NECK + 0.32, -0.08); pivot.add(tiltG);
  const display = K.mesh(THREE, K.rbox(THREE, X, DW, DH, DT, 0.035, 5), K.mat(ctx, THREE, "casing", "gloss", opts));
  display.position.set(0, DH / 2 - 0.25, 0.05); tiltG.add(display);
  const back = K.mesh(THREE, K.rbox(THREE, X, DW * 0.42, DH * 0.42, 0.05, 0.04, 4), K.mat(ctx, THREE, "casing2", "plastic", opts));
  back.position.set(0, DH / 2 - 0.3, 0.05 - DT / 2 - 0.02); tiltG.add(back);
  const SW = 1920, SH = Math.round(1920 * (DH - 0.08) / (DW - 0.08));
  const scr = K.face(ctx, THREE, SW, SH);
  const draw = (spec) => scr.draw((g, w, h) => K.drawUI(ctx, spec, g, w, h, opts), JSON.stringify(spec || {}));
  draw(opts.screen || { kind: "blank" });
  const screenMat = new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(DW - 0.08, DH - 0.08), screenMat);
  screen.position.set(0, DH / 2 - 0.25, 0.05 + DT / 2 + 0.002); tiltG.add(screen);
  group.add(K.contactShadow(ctx, THREE, 1.6, 1.0, 0.45));

  return {
    group, size: [DW, NECK + 0.32 + DH - 0.25, 0.7], parts: { display, screen, stand }, keys: ["screen", "wake", "tilt", "turn"],
    set(key, v) {
      if (key === "screen") draw(v);
      else if (key === "wake") screenMat.color.setScalar(0.1 + 0.9 * K.clamp(v));
      else if (key === "tilt") tiltG.rotation.x = -0.25 * K.clamp(v, -1, 1);
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
