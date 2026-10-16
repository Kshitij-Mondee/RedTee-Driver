// @model {"id": "loss_landscape", "pack": "ai_ml", "what": "a loss surface over two weights on a plinth: a smooth lit surface (low is cool, high is warm) with its contour map on the floor, a ball that descends by gradient descent computed from the surface's own slope, and a trail of its steps", "parts": ["plinth", "surface", "contours", "ball", "trail", "axes", "caption"], "keys": {"descend": "0..1 the ball moves along its computed path of steps (each step goes against the slope, scaled by the learning rate)", "contours": "0..1 the contour lines draw on the floor, lowest first (with the steps' shadow)", "lr": "set at make (opts.lr: small | good | large): a slow crawl, a clean descent, or an overshooting zigzag; the rate is derived from the surface's own curvature", "minima": "set at make (opts.minima: 1 | 2): 2 adds a second, shallower valley so a local minimum can be shown", "turn": "radians about y"}, "best_for": ["gradient descent and training as walking downhill", "learning rate too small, right, too large", "local minima"], "not_for": ["exact loss values or a real model's surface (this is a two-weight slice, and the caption should say so)", "accuracy (loss is lower when better; the vertical axis may not be labelled accuracy)"], "size": [2.8, 2.0, 2.8], "sheet": {"opts": {"lr": "large", "minima": 1, "axes": ["weight 1", "weight 2", "loss"], "caption": "A two-weight slice of a far larger space"}, "states": [{"key": "contours", "from": 0, "to": 1, "at": 0.6, "dur": 1.2}, {"key": "descend", "from": 0, "to": 1, "at": 1.6, "dur": 3.6}], "elevation": 30, "mood": "clean_bench"}}
// Accuracy (topic-asset-needs 8.7): the path is gradient descent on the surface's own function f, p <- p - lr * grad f(p),
// with the gradient taken by central differences of the same f that builds the mesh, so steps shrink where the ground
// flattens and overshoot where the rate is too large. The rate is a multiple of 1/L, L the curvature at the bottom of
// the deepest valley (small 0.1/L, good 0.8/L, large 1.75/L), so the three behaviours are the surface's own, not hand-drawn.
// Words: the axis names and the caption come only from opts (opts.axes [w1, w2, loss], opts.caption).

// the surface: u, v in [-1, 1] (two weights); returns the loss
export function lossFn(minima) {
  if (minima === 2) {
    return (u, v) => 0.35 * (u * u + v * v) - 0.95 * Math.exp(-((u - 0.42) ** 2 + (v + 0.38) ** 2) / 0.13)
      - 0.5 * Math.exp(-((u + 0.48) ** 2 + (v - 0.42) ** 2) / 0.09);
  }
  const c = Math.cos(0.55), s = Math.sin(0.55);
  return (u, v) => { const x = (u - 0.12) * c + (v + 0.08) * s, z = -(u - 0.12) * s + (v + 0.08) * c; return 1.5 * x * x + 0.32 * z * z + 0.02 * (u ** 4 + v ** 4); };
}
const EPS = 1e-3;
const grad = (f, u, v) => [(f(u + EPS, v) - f(u - EPS, v)) / (2 * EPS), (f(u, v + EPS) - f(u, v - EPS)) / (2 * EPS)];
// the curvature at the bottom of the deepest valley (the largest Hessian eigenvalue at the lowest grid point): the
// step-size scale of this surface, as in the textbook rule that a rate above 1/L overshoots and above 2/L diverges
function bottomCurvature(f) {
  let best = [0, 0], fb = Infinity; const h = 0.01;
  for (let i = 0; i <= 80; i++) for (let j = 0; j <= 80; j++) { const u = -1 + i / 40, v = -1 + j / 40, z = f(u, v); if (z < fb) { fb = z; best = [u, v]; } }
  const [u, v] = best, f0 = f(u, v);
  const a = (f(u + h, v) - 2 * f0 + f(u - h, v)) / (h * h), d = (f(u, v + h) - 2 * f0 + f(u, v - h)) / (h * h);
  const b = (f(u + h, v + h) - f(u + h, v - h) - f(u - h, v + h) + f(u - h, v - h)) / (4 * h * h);
  return Math.max(1e-6, (a + d) / 2 + Math.sqrt(((a - d) / 2) ** 2 + b * b));
}
export const RATES = { small: 0.1, good: 0.8, large: 1.75 };
// the descent: a list of [u, v] steps from the start, stopping when the step is tiny or after 40 steps
export function descentPath(minima, lr, start) {
  const f = lossFn(minima), eta = (RATES[lr] || RATES.good) / bottomCurvature(f);
  let p = start || (minima === 2 ? [-0.9, 0.86] : [-0.86, 0.78]);
  const out = [p.slice()];
  for (let n = 0; n < 40; n++) {
    const g = grad(f, p[0], p[1]), q = [p[0] - eta * g[0], p[1] - eta * g[1]];
    if (Math.abs(q[0]) > 1 || Math.abs(q[1]) > 1) break;           // left the slice shown: stop at the edge honestly
    out.push(q);
    if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.004) break;
    p = q;
  }
  return { path: out, eta };
}

export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const axes = opts.axes || [];
  if (axes[2] && /accura/i.test(String(axes[2]))) throw new Error("loss_landscape: the vertical axis is loss (lower is better); it may not be labelled accuracy");
  const minima = opts.minima === 2 ? 2 : 1, lr = RATES[opts.lr] ? opts.lr : "good";
  const f = lossFn(minima), { path } = descentPath(minima, lr, opts.start);
  const S = 1.1, PH = 0.16, Y0 = 0.36, HS = 1.15, G = 72;            // half-width, plinth height, surface base, height span, grid
  let fmin = Infinity, fmax = -Infinity;
  for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) { const z = f(-1 + 2 * i / G, -1 + 2 * j / G); fmin = Math.min(fmin, z); fmax = Math.max(fmax, z); }
  const hn = (u, v) => (f(u, v) - fmin) / (fmax - fmin);           // 0 lowest .. 1 highest
  const P = (u, v, lift = 0) => new THREE.Vector3(u * S, Y0 + hn(u, v) * HS + lift, v * S);
  const group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot);
  const dark = K.role(ctx, "ink", opts) === "field", base = dark ? "casing" : "paper";   // a white plinth glares on a dark page

  // plinth, and the floor face that carries the contour map
  const plinth = K.mesh(THREE, K.rbox(THREE, X, 2 * S + 0.3, PH, 2 * S + 0.3, 0.04, 4), K.mat(ctx, THREE, base, "matte", opts)); plinth.position.y = PH / 2; pivot.add(plinth);
  const cf = K.face(ctx, THREE, 1024, 1024);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * S, 2 * S), new THREE.MeshBasicMaterial({ map: cf.tex, transparent: true, toneMapped: false, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = PH + 0.003; pivot.add(floor);
  const NL = 11, CG = 110;
  const grid = []; for (let i = 0; i <= CG; i++) { grid.push([]); for (let j = 0; j <= CG; j++) grid[i].push(hn(-1 + 2 * i / CG, -1 + 2 * j / CG)); }
  const drawFloor = (levels, steps) => cf.draw((g, W) => {
    const c = W / CG, px = (u) => (u + 1) / 2 * W;
    g.lineWidth = 5; g.lineCap = "round";
    for (let l = 0; l < levels; l++) {                                // marching squares, lowest level first
      const iso = (l + 0.5) / NL * 0.9;
      g.strokeStyle = K.temp(ctx, iso / 0.9).getStyle(); g.globalAlpha = 1; g.beginPath();
      for (let i = 0; i < CG; i++) for (let j = 0; j < CG; j++) {
        const a = grid[i][j], b = grid[i + 1][j], d = grid[i][j + 1], e = grid[i + 1][j + 1], pts = [];
        const cross = (p, q, x0, y0, x1, y1) => { if ((p - iso) * (q - iso) < 0) { const k = (iso - p) / (q - p); pts.push([x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]); } };
        cross(a, b, i, j, i + 1, j); cross(b, e, i + 1, j, i + 1, j + 1); cross(e, d, i + 1, j + 1, i, j + 1); cross(d, a, i, j + 1, i, j);
        for (let k = 0; k + 1 < pts.length; k += 2) { g.moveTo(pts[k][0] * c, pts[k][1] * c); g.lineTo(pts[k + 1][0] * c, pts[k + 1][1] * c); }
      }
      g.stroke();
    }
    if (steps > 0) {                                                  // the steps' shadow on the map
      g.globalAlpha = 1; g.strokeStyle = K.hexOf(ctx, "ink", opts); g.fillStyle = g.strokeStyle; g.lineWidth = 5; g.beginPath();
      path.slice(0, steps).forEach(([u, v], i) => (i ? g.lineTo(px(u), px(v)) : g.moveTo(px(u), px(v)))); g.stroke();
      path.slice(0, steps).forEach(([u, v]) => { g.beginPath(); g.arc(px(u), px(v), 9, 0, Math.PI * 2); g.fill(); });
    }
  }, levels * 1000 + steps);

  // the surface: a height field coloured cool (low loss) to warm (high loss), with a light wire grid
  const geo = new THREE.PlaneGeometry(2 * S, 2 * S, G, G); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / S, v = pos.getZ(i) / S, h = hn(u, v); pos.setY(i, Y0 + h * HS);
    const c = K.temp(ctx, Math.pow(h, 0.8)); cols[3 * i] = c.r; cols[3 * i + 1] = c.g; cols[3 * i + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const surface = K.mesh(THREE, geo, K.mat(ctx, THREE, "paper", "matte", opts, { vertexColors: true, side: THREE.DoubleSide, roughness: 0.62, envMapIntensity: 0.45 })); pivot.add(surface);
  const wire = [];
  for (let k = 0; k <= 12; k++) for (let n = 0; n < 48; n++) {
    const a = -1 + 2 * k / 12, b0 = -1 + 2 * n / 48, b1 = -1 + 2 * (n + 1) / 48;
    wire.push(P(a, b0, 0.004), P(a, b1, 0.004), P(b0, a, 0.004), P(b1, a, 0.004));
  }
  const wireMesh = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wire), new THREE.LineBasicMaterial({ color: K.col(ctx, "ink", opts), transparent: true, opacity: 0.2 }));
  pivot.add(wireMesh);

  // axes from the back-left corner: two weights along the floor, loss up; names only from opts.axes
  const axesG = new THREE.Group(); pivot.add(axesG);
  const o = [-S - 0.06, PH, -S - 0.06];
  const ends = [[S + 0.25, PH, -S - 0.06], [-S - 0.06, PH, S + 0.25], [-S - 0.06, Y0 + HS + 0.3, -S - 0.06]];
  ends.forEach((e) => axesG.add(K.arrow3d(ctx, THREE, o, e, { role: "text", r: 0.012, colors: opts.colors })));
  const billboard = (m) => { m.onBeforeRender = (r, s, cam) => { m.parent.getWorldQuaternion(m.quaternion).invert().multiply(cam.quaternion); m.updateMatrix(); m.matrixWorld.multiplyMatrices(m.parent.matrixWorld, m.matrix); }; return m; };
  axes.slice(0, 3).forEach((w, i) => {
    if (!w) return;
    const l = billboard(K.label(ctx, THREE, w, { h: 0.13, colors: opts.colors })); const e = ends[i];
    l.position.set(e[0] + (i === 0 ? 0.05 : 0), e[1] + 0.12, e[2] + (i === 1 ? 0.05 : 0)); axesG.add(l);
  });
  let caption = null;
  if (opts.caption) {                                                 // the caption on the plinth's front
    const W = 2 * S + 0.24, cap = K.face(ctx, THREE, 2048, Math.round(2048 * (PH - 0.04) / W));
    cap.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, base, opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "text", opts); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(K.fitText(g, opts.caption, w * 0.96, (q) => K.font(ctx, "body", q, 600), h * 0.7), w / 2, h / 2 + 2); });
    caption = new THREE.Mesh(new THREE.PlaneGeometry(W, PH - 0.04), new THREE.MeshBasicMaterial({ map: cap.tex, toneMapped: false }));
    caption.position.set(0, PH / 2, S + 0.151); pivot.add(caption);
  }

  // the ball, the trail (a dot per step and a segment between steps), lifted by the ball's radius
  const R = 0.075, pts = path.map(([u, v]) => P(u, v, R));
  const ball = K.mesh(THREE, new THREE.SphereGeometry(R, 32, 24), K.mat(ctx, THREE, "ink", "gloss", opts)); pivot.add(ball);
  const trail = new THREE.Group(); pivot.add(trail);
  const tm = K.mat(ctx, THREE, "ink", "matte", opts), dots = [], segs = [];
  pts.forEach((p, i) => {
    const d = K.mesh(THREE, new THREE.SphereGeometry(0.026, 12, 8), tm, false); d.position.copy(p); trail.add(d); dots.push(d);
    if (i) {
      const a = pts[i - 1], len = a.distanceTo(p), s = K.mesh(THREE, new THREE.CylinderGeometry(0.011, 0.011, 1, 8), tm, false);
      s.position.copy(a).lerp(p, 0.5); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().sub(a).normalize());
      s.userData.len = len; trail.add(s); segs.push(s);
    }
  });
  group.add(K.contactShadow(ctx, THREE, 2 * S + 1, 2 * S + 1, 0.4));

  const st = { descend: K.clamp(opts.descend || 0), contours: K.clamp(opts.contours == null ? 1 : opts.contours) };
  const apply = () => {
    const n = pts.length - 1, x = st.descend * n, i = Math.min(n - 1, Math.floor(x)), k = n ? x - i : 0;
    ball.position.copy(n ? pts[i].clone().lerp(pts[i + 1], K.easeInOut(k)) : pts[0]);
    dots.forEach((d, j) => { d.visible = j <= x + 1e-6; });
    segs.forEach((s, j) => { const r = K.clamp(x - j); s.visible = r > 0; s.scale.set(1, Math.max(1e-3, r * s.userData.len), 1);
      s.position.copy(pts[j]).lerp(pts[j + 1], r / 2); });
    drawFloor(Math.round(st.contours * NL), st.contours > 0 ? Math.floor(x + 1e-6) + 1 : 0);
  };
  apply();
  return {
    group, size: [2 * S + 0.6, Y0 + HS + 0.45, 2 * S + 0.6], parts: { plinth, surface, contours: floor, ball, trail, axes: axesG, caption },
    keys: ["descend", "contours", "lr", "minima", "turn"],
    set(key, v) {
      if (key === "descend") { st.descend = K.clamp(v); apply(); }
      else if (key === "contours") { st.contours = K.clamp(v); apply(); }
      else if (key === "lr" || key === "minima") { /* chosen at make (opts.lr, opts.minima): the path is computed then */ }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
