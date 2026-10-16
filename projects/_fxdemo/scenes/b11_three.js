// @lab {"title": "Three.js: a device turns in on a spring, its screen drawn from the style; lit by a room environment", "dur": 4.0, "times": [0.2, 0.6, 1.0, 1.6, 2.6, 3.8], "params": {"title": "Review passed", "line": "Staging looked green"}}
// A Loom Three.js scene. Every colour is ctx.c("token"); every time is a function of t (in a lesson,
// ctx.cue("spoken words")). No Math.random, Date or timers: a frame is a pure function of t.
const clamp = (x) => Math.max(0, Math.min(1, x));
function spring(p, bounce) {             // the same closed-form spring as Loom.spring
  p = clamp(p); const z = Math.max(0.05, 1 - bounce), w = Math.log(1000) / z;
  const f = z >= 1 ? (q) => 1 - Math.exp(-w * q) * (1 + w * q)
    : (q) => { const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * q) * (Math.cos(wd * q) + (z * w / wd) * Math.sin(wd * q)); };
  return f(p) + (1 - f(1)) * p;
}

export function build(ctx, THREE, X) {
  const scene = new THREE.Scene();
  scene.environment = X.env;
  const camera = new THREE.PerspectiveCamera(30, X.W / X.H, 0.1, 100);
  camera.position.set(0, 0.25, 10.6); camera.lookAt(0, 0, 0);

  // the screen is a canvas texture drawn from tokens and params (no text is invented here)
  const cv = document.createElement("canvas"); cv.width = 720; cv.height = 1440;
  const g = cv.getContext("2d");
  const hex = (t) => ctx.hex(t);
  g.fillStyle = hex("surface"); g.fillRect(0, 0, 720, 1440);
  g.fillStyle = hex("field2"); g.fillRect(0, 0, 720, 170);
  g.fillStyle = hex("accent"); g.beginPath(); g.roundRect(60, 560, 600, 190, 34); g.fill();
  g.fillStyle = hex("field"); g.font = `700 64px "${ctx.font("title")}"`; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(String(ctx.params.title || ""), 360, 655);
  g.fillStyle = hex("ink"); g.font = `600 46px "${ctx.font("body")}"`; g.fillText(String(ctx.params.line || ""), 360, 860);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;

  const body = new THREE.Mesh(new X.RoundedBoxGeometry(2.2, 4.4, 0.24, 8, 0.28),
    new THREE.MeshPhysicalMaterial({ color: ctx.c("field2"), metalness: 0.6, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 }));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 4.0), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.z = 0.125;
  const device = new THREE.Group(); device.add(body, screen); scene.add(device);

  // a soft contact shadow: a radial gradient on a plane under the device
  const sc = document.createElement("canvas"); sc.width = sc.height = 256;
  const sg = sc.getContext("2d"); const rg = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, "rgba(0,0,0,0.55)"); rg.addColorStop(1, "rgba(0,0,0,0)"); sg.fillStyle = rg; sg.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.55; scene.add(shadow);

  const key = new THREE.DirectionalLight(ctx.c("ink"), 1.4); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(ctx.c("accent4"), 1.2); rim.position.set(-4, 2, -3); scene.add(rim);

  return {
    scene, camera,
    update(t) {
      const k = spring((t - 0.1) / 1.4, 0.15);           // arrive
      device.rotation.y = (1 - k) * -1.9 + 0.32 * Math.sin(t * 0.55) - 0.18;
      device.rotation.x = 0.06 * Math.sin(t * 0.4);
      device.position.y = (1 - k) * -1.2 + 0.06 * Math.sin(t * 1.1);
      const s = 0.82 + 0.18 * k; device.scale.set(s, s, s);
      shadow.material.opacity = 0.2 + 0.8 * k;
    },
  };
}
