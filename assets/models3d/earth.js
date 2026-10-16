// @model {"id": "earth", "pack": "workplace", "what": "the Earth as a sphere with its real coastlines (Natural Earth 1:110m, given in the context or opts.rings), a graticule every 30 degrees, an atmosphere shell, pins at given places (each its own part, pin0, pin1, ...) and great-circle arcs between them that draw on", "parts": ["sphere", "coast", "graticule", "atmosphere", "pins", "arcs"], "keys": {"spin": "radians the Earth has turned about its axis", "arcs": "0..1 the arcs draw on, one after another", "pins": "0..1 the pins rise one after another", "turn": "radians about y"}, "best_for": ["where in the world: regions, offices, data centres", "traffic or data between places", "a global rollout or an incident across regions"], "not_for": ["a desk globe on a stand (use globe)", "a flat map (use a geography scene)"], "size": [1.1, 1.15, 1.1], "sheet": {"opts": {"pins": [[50.1, 8.7], [38.9, -77.5], [19.1, 72.8], [1.35, 103.8]], "arcs": [[0, 1], [0, 2], [2, 3]]}, "states": [{"key": "spin", "from": 0, "to": 2.4, "at": 0, "dur": 6}, {"key": "pins", "from": 0, "to": 1, "at": 0.8, "dur": 1}, {"key": "arcs", "from": 0, "to": 1, "at": 1.8, "dur": 2}]}}
// The sphere stands on y = 0 (its centre at y = 0.6). The coastlines come from ctx.geo (the bridge passes the Natural
// Earth data when a hero asks for it, params.geo) or opts.rings; without them the sphere shows its graticule only.
// opts: {pins: [[lat, lon], ...], arcs: [[from, to], ...] (pin indexes), tilt (radians, default 0.41), lift (arc height)}.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const R = 0.5, C = new THREE.Vector3(0, 0.6, 0), TILT = opts.tilt == null ? 0.41 : opts.tilt;
  const group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot);
  const axis = new THREE.Group(); axis.position.copy(C); axis.rotation.z = TILT; pivot.add(axis);
  const earth = new THREE.Group(); axis.add(earth);
  const P = (lat, lon, r = R) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return new THREE.Vector3(Math.cos(a) * Math.sin(b) * r, Math.sin(a) * r, Math.cos(a) * Math.cos(b) * r); };
  const lineMat = (tok, k) => new THREE.LineBasicMaterial({ color: K.col(ctx, tok, opts).clone().multiplyScalar(k || 1) });

  const sphere = K.mesh(THREE, new THREE.SphereGeometry(R, 72, 48), K.mat(ctx, THREE, "cool", "matte", opts)); earth.add(sphere);
  // the coastlines: each Natural Earth ring as a closed line just above the surface
  const geo = opts.rings ? { rings: opts.rings, scale: opts.scale || 1 } : ctx.geo;
  const coast = new THREE.Group(); earth.add(coast);
  if (geo && geo.rings) {
    const pos = [];
    for (const [, flat] of geo.rings) {
      for (let i = 0; i + 3 < flat.length; i += 2) {
        const a = P(flat[i + 1] / geo.scale, flat[i] / geo.scale, R * 1.004), b = P(flat[i + 3] / geo.scale, flat[i + 2] / geo.scale, R * 1.004);
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    coast.add(new THREE.LineSegments(g, lineMat("ink")));
  }
  // the graticule every 30 degrees
  const grat = new THREE.Group(); earth.add(grat);
  {
    const pos = [];
    for (let lat = -60; lat <= 60; lat += 30) for (let i = 0; i < 96; i++) { const a = P(lat, i / 96 * 360, R * 1.002), b = P(lat, (i + 1) / 96 * 360, R * 1.002); pos.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    for (let lon = 0; lon < 360; lon += 30) for (let i = 0; i < 48; i++) { const a = P(-90 + i / 48 * 180, lon, R * 1.002), b = P(-90 + (i + 1) / 48 * 180, lon, R * 1.002); pos.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    grat.add(new THREE.LineSegments(g, lineMat("line", 0.6)));
  }
  // the atmosphere: a thin shell a little outside the surface (a hologram lights its rim)
  const atmo = K.mesh(THREE, new THREE.SphereGeometry(R * 1.06, 64, 40), K.mat(ctx, THREE, "cool", "glass", opts)); axis.add(atmo);
  // pins: a short stalk and a ring at each place; each pin its own part so a datum can point at it
  const pinsG = new THREE.Group(); earth.add(pinsG);
  const pins = (opts.pins || []).map(([lat, lon], i) => {
    const pg = new THREE.Group(), n = P(lat, lon, 1).normalize();
    pg.position.copy(P(lat, lon, R)); pg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    const stalk = K.mesh(THREE, new THREE.CylinderGeometry(0.004, 0.004, 0.06, 8), K.mat(ctx, THREE, "warm", "glow", opts)); stalk.position.y = 0.03; pg.add(stalk);
    const ring = K.mesh(THREE, new THREE.TorusGeometry(0.018, 0.003, 6, 24), K.mat(ctx, THREE, "warm", "glow", opts)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.062; pg.add(ring);
    pinsG.add(pg); pg.name = "pin" + i;
    return pg;
  });
  // arcs: great circles lifted off the surface, drawn on by the "arcs" key
  const arcsG = new THREE.Group(); earth.add(arcsG);
  const arcs = (opts.arcs || []).filter(([a, b]) => opts.pins && opts.pins[a] && opts.pins[b]).map(([a, b]) => {
    const A = P(...opts.pins[a], 1).normalize(), B = P(...opts.pins[b], 1).normalize(), om = Math.acos(Math.max(-1, Math.min(1, A.dot(B)))), N = 64, pos = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, s = Math.sin(om) || 1, v = A.clone().multiplyScalar(Math.sin((1 - u) * om) / s).add(B.clone().multiplyScalar(Math.sin(u * om) / s));
      v.multiplyScalar(R * (1.01 + (opts.lift == null ? 0.22 : opts.lift) * Math.sin(Math.PI * u) * om / Math.PI)); pos.push(v.x, v.y, v.z);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const ln = new THREE.Line(g, lineMat("warm")); arcsG.add(ln);
    return { ln, n: N + 1 };
  });
  const st = { spin: 0, arcs: 0, pins: 1 };
  const apply = () => {
    earth.rotation.y = st.spin;
    const nA = arcs.length;
    arcs.forEach((a, i) => { const k = K.clamp(st.arcs * nA - i); a.ln.geometry.setDrawRange(0, Math.max(0, Math.round(k * a.n))); a.ln.visible = k > 0; });
    const nP = pins.length;
    pins.forEach((p, i) => { const k = K.clamp(st.pins * nP - i); p.scale.setScalar(Math.max(0.001, K.easeOut(k))); p.visible = k > 0.001; });
  };
  apply();
  const parts = { sphere, coast, graticule: grat, atmosphere: atmo, pins: pinsG, arcs: arcsG };
  pins.forEach((p, i) => { parts["pin" + i] = p; });
  return {
    group, size: [1.1, 1.15, 1.1], parts,
    keys: ["spin", "arcs", "pins", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key in st) { st[key] = key === "spin" ? Number(v) || 0 : K.clamp(v); apply(); }
    },
  };
}
