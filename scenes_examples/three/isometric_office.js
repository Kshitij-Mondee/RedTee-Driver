// @lab {"title": "Isometric: an orthographic diorama (true isometric angles), soft shadows, pieces rising in on springs, a slow orbit", "dur": 5.0, "times": [0.2, 0.7, 1.2, 1.9, 3.2, 4.8], "params": {}}
// A Loom Three.js scene in the ISOMETRIC register: an orthographic camera at the classic angles (35.26 deg
// down, 45 deg around), a floor tile, and a small system (desks, a server rack, a screen, a person as a
// capsule) built from primitives in the style's tokens. Pieces rise in one by one on a spring; the camera
// orbits a few degrees so the depth reads without breaking the isometric look.
const clamp = (x) => Math.max(0, Math.min(1, x));
function spring(p, bounce) {
  p = clamp(p); const z = Math.max(0.05, 1 - bounce), w = Math.log(1000) / z;
  const f = z >= 1 ? (q) => 1 - Math.exp(-w * q) * (1 + w * q)
    : (q) => { const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * q) * (Math.cos(wd * q) + (z * w / wd) * Math.sin(wd * q)); };
  return f(p) + (1 - f(1)) * p;
}

export function build(ctx, THREE, X) {
  const scene = new THREE.Scene();
  const aspect = X.W / X.H, S = 6.2;
  const camera = new THREE.OrthographicCamera(-S * aspect, S * aspect, S, -S, 0.1, 100);
  X.renderer.shadowMap.enabled = true; X.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  X.renderer.toneMapping = THREE.NoToneMapping;

  const mat = (tok, o) => new THREE.MeshStandardMaterial(Object.assign({ color: ctx.c(tok), roughness: 0.85, metalness: 0.0 }, o || {}));
  const box = (w, h, d, tok) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(tok)); m.castShadow = true; m.receiveShadow = true; return m; };

  // the floor tile and a thin rim: the diorama sits on it like a board game piece
  const floor = box(9, 0.4, 9, "surface"); floor.position.y = -0.2; scene.add(floor);
  const rim = box(9.2, 0.18, 9.2, "surface2"); rim.position.y = -0.46; scene.add(rim);

  const pieces = [];
  const add = (obj, at) => { obj.userData.home = obj.position.y; obj.userData.at = at; pieces.push(obj); scene.add(obj); return obj; };
  // two desks with screens
  for (const [x, z, at] of [[-2.2, 1.6, 0.35], [0.6, 1.6, 0.5]]) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const top = box(2.2, 0.16, 1.2, "field2"); top.position.y = 0.9; g.add(top);
    for (const lx of [-1, 1]) { const leg = box(0.1, 0.9, 1.0, "field2"); leg.position.set(lx * 1.0, 0.45, 0); g.add(leg); }
    const screen = box(1.1, 0.7, 0.08, "ink"); screen.position.set(0, 1.4, -0.35); g.add(screen);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), new THREE.MeshBasicMaterial({ color: ctx.c("accent") }));
    glow.position.set(0, 1.4, -0.305); g.add(glow);
    add(g, at);
  }
  // the server rack, with a status light that blinks (the alert)
  const rack = new THREE.Group(); rack.position.set(2.8, 0, -2.2);
  const body = box(1.3, 3.2, 1.2, "field2"); body.position.y = 1.6; rack.add(body);
  for (let i = 0; i < 5; i++) { const u = box(1.12, 0.36, 0.05, "surface"); u.position.set(0, 0.5 + i * 0.55, 0.62); rack.add(u); }
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshBasicMaterial({ color: ctx.c("accent3") }));
  led.position.set(0.4, 2.7, 0.66); rack.add(led);
  add(rack, 0.7);
  // a person (a capsule and a head): stylised, not a character
  const person = new THREE.Group(); person.position.set(-2.2, 0, 2.8);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 1.2, 20), mat("accent4")); torso.position.y = 0.9; torso.castShadow = true; person.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), mat("muted")); head.position.y = 1.8; head.castShadow = true; person.add(head);
  add(person, 0.9);
  // a plant, for scale and warmth
  const pot = box(0.6, 0.6, 0.6, "accent2"); pot.position.set(-3.5, 0.3, -3.2); add(pot, 1.05);
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 7), mat("accent4")); leaf.position.set(-3.5, 1.2, -3.2); leaf.castShadow = true; add(leaf, 1.1);

  scene.add(new THREE.HemisphereLight(ctx.neutral(), ctx.c("field2"), 1.4));   // a neutral sky fill
  const sun = new THREE.DirectionalLight(ctx.neutral(), 2.4); sun.position.set(6, 10, 4); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); sun.shadow.radius = 4;
  scene.add(sun);

  return {
    scene, camera,
    update(t) {
      // true isometric: 35.264 deg elevation, 45 deg azimuth, plus a slow 8 deg orbit
      const az = (45 - 4 + 8 * clamp(t / 5)) * Math.PI / 180, el = 35.264 * Math.PI / 180, R = 20;
      camera.position.set(R * Math.cos(el) * Math.sin(az), R * Math.sin(el), R * Math.cos(el) * Math.cos(az));
      camera.lookAt(0, 0.8, 0);
      const zoom = 1 + 0.06 * clamp(t / 5); camera.zoom = zoom; camera.updateProjectionMatrix();
      floor.scale.setScalar(0.9 + 0.1 * spring(t / 0.6, 0));
      for (const p of pieces) {
        const k = spring((t - p.userData.at) / 0.7, 0.2);
        p.position.y = p.userData.home + (1 - k) * 3.0; p.visible = t >= p.userData.at - 0.001;
        p.scale.setScalar(0.001 + 0.999 * Math.min(1, k * 1.2));
      }
      led.visible = Math.floor(t * 2.5) % 2 === 0 && t > 1.2;
    },
  };
}
