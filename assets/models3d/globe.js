// @model {"id": "globe", "pack": "workplace", "what": "a desk globe on a meridian ring and stand: a sphere with a graticule of latitude and longitude, pins that rise at given places", "parts": ["sphere", "ring", "stand", "pins"], "keys": {"spin": "radians the sphere turns about its tilted axis", "pins": "0..1 the pins rise one after another (opts.pins: [[lat, lon], ...])", "turn": "radians about y"}, "best_for": ["global teams and offices", "data crossing borders", "a worldwide rollout", "time zones"], "not_for": ["an exact map or named countries (use a geography scene)"], "size": [1.3, 1.8, 1.0], "sheet": {"opts": {"pins": [[51.5, 0], [40.7, -74], [19, 72.8], [1.3, 103.8]]}, "states": [{"key": "spin", "from": 0, "to": 2.4, "at": 0, "dur": 6}, {"key": "pins", "from": 0, "to": 1, "at": 1.8, "dur": 1.6}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const R = 0.56, TILT = 0.41;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);

  // the sphere: an ocean tone with a graticule drawn on its texture
  const gf = K.face(ctx, THREE, 2048, 1024);
  gf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, opts.ocean || "cool", opts); g.fillRect(0, 0, w, h);
    g.strokeStyle = K.hexOf(ctx, "paper", opts); g.globalAlpha = 0.35; g.lineWidth = 3;
    for (let lat = -60; lat <= 60; lat += 30) { const y = (90 - lat) / 180 * h; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let lon = -180; lon < 180; lon += 30) { const x = (lon + 180) / 360 * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.globalAlpha = 0.6; g.lineWidth = 5; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); g.globalAlpha = 1;
  });
  const sphereMat = new THREE.MeshPhysicalMaterial({ map: gf.tex, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const sphere = K.mesh(THREE, new THREE.SphereGeometry(R, 96, 64), sphereMat);
  // the axis is placed so the meridian ring's foot sits on the post's top
  const axis = new THREE.Group(); axis.position.set(-(R + 0.06) * Math.sin(TILT), 0.46 + (R + 0.06) * Math.cos(TILT), 0); axis.rotation.z = TILT; pivot.add(axis);
  const spinG = new THREE.Group(); spinG.add(sphere); axis.add(spinG);
  // the meridian ring and the stand
  const metal = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.25 });
  const ring = K.mesh(THREE, new THREE.TorusGeometry(R + 0.06, 0.018, 16, 128, Math.PI), metal);
  ring.rotation.z = -Math.PI / 2; ring.rotation.y = Math.PI; axis.add(ring);   // a half ring from pole to pole, on the post's side
  const stand = new THREE.Group();
  const foot = K.mesh(THREE, K.lathe(THREE, [[0, 0], [0.32, 0], [0.33, 0.02], [0.3, 0.06], [0.08, 0.1], [0.05, 0.12], [0, 0.12]], 64), K.mat(ctx, THREE, "casing", "gloss", opts)); stand.add(foot);
  const post = K.mesh(THREE, new THREE.CylinderGeometry(0.025, 0.035, 0.36, 24), metal); post.position.y = 0.28; stand.add(post);
  pivot.add(stand);

  // pins: lat/lon on the sphere, each a stem and a head in the accent; they rise in order
  const pins = new THREE.Group(); spinG.add(pins);
  const pinMat = K.mat(ctx, THREE, opts.pinColour || "bad", "plastic", opts);
  const list = (opts.pins || []).slice(0, 12).map(([lat, lon]) => {
    const p = new THREE.Group();
    const stem = K.mesh(THREE, new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), metal); stem.position.y = 0.06; p.add(stem);
    const headM = K.mesh(THREE, new THREE.SphereGeometry(0.035, 20, 14), pinMat); headM.position.y = 0.13; p.add(headM);
    const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    const v = new THREE.Vector3(-Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
    p.position.copy(v.clone().multiplyScalar(R)); p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    pins.add(p); return p;
  });
  group.add(K.contactShadow(ctx, THREE, 1.2, 1.2, 0.4));

  const setPins = (k) => list.forEach((p, i) => { const n = list.length, q = K.clamp(k * n - i); p.scale.setScalar(K.spring(q, 0.3)); p.visible = q > 0; });
  setPins(opts.pinsShown == null ? 1 : opts.pinsShown);
  return {
    group, size: [1.3, 0.32 + 0.12 + 2 * R + 0.12, 1.0], parts: { sphere, ring, stand, pins }, keys: ["spin", "pins", "turn"],
    set(key, v) {
      if (key === "spin") spinG.rotation.y = v;
      else if (key === "pins") setPins(K.clamp(v));
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
