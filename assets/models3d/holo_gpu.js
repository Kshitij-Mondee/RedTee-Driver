// @model {"id": "holo_gpu", "pack": "ai_ml", "what": "a generic dual-slot, triple-fan graphics card built as a hologram hero (T-138), standing on its edge connector: a shroud with three fan openings, three fans of eleven swept blades, a heatsink of three fin stacks with heat pipes bending over its top edge, the board (gold edge fingers with their key notch, the GPU package, eight memory chips, a row of power stages), two 8-pin power connectors on its top edge, the I/O bracket with four display outputs (three of one socket shape, one of a wider shape) and vent slots, and a backplate; every part a real, connected piece that explodes along the card's thickness", "parts": ["shroud", "fans", "heatsink", "pcb", "power", "bracket", "backplate"], "keys": {"spin": "radians the fans have turned", "explode": "0 assembled .. 1 exploded: the backplate moves back, the heatsink, the shroud and the fans come forward in layers, the power connectors rise and the bracket slides off the end", "turn": "radians about y"}, "explode_note": "explode vectors are in the real card's metres (the model is drawn at 5x)", "explode": {"backplate": [0, 0, -0.04], "heatsink": [0, 0, 0.032], "shroud": [0, 0, 0.064], "fans": [0, 0, 0.09], "power": [0, 0.03, 0], "bracket": [-0.045, 0, 0]}, "hero": {"zoom": 0.78, "elevation": 14, "yaw": -0.45, "why": "a long, thin object: the pad fits its length; a low elevation keeps the fans and the top edge's heat pipes in view"}, "best_for": ["AI compute: what one accelerator card is", "the cost and power of training (the card, its power connectors, its cooling)", "an exploded view of how a card is cooled (fans, fin stacks, heat pipes)", "hardware and data-centre explainers at the scale of one card"], "not_for": ["a whole AI server of eight accelerators (use gpu_server)", "a chip close up (use accelerator_chip)"], "size": [1.55, 0.675, 0.3], "sheet": {"states": [{"key": "spin", "from": 0, "to": 9, "at": 0, "dur": 6}, {"key": "explode", "from": 0, "to": 1, "at": 3.2, "dur": 1.4}], "elevation": 14}}
// Geometry in metres, from the public dimensions of dual-slot, triple-fan cards: a 305 mm cooler on a 270 mm board,
// 126 mm tall over its fingers, 50 mm thick (2.5 slots); 90 mm fans. The card stands on its edge connector: x is its
// length (the bracket at -x), y is up, the fans face +z, the backplate faces -z. Words: none (no marks, no logo).
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const S = 5;
  const L = 0.305, PL = 0.27, X0 = -L / 2, FH = 0.0085, PT = FH + 0.111, CY = 0.0715, Z1 = 0.0455;
  const group = new THREE.Group(), pivot = new THREE.Group(), body = new THREE.Group(); group.add(pivot); body.scale.setScalar(S); pivot.add(body);
  const shellM = K.mat(ctx, THREE, "casing", "gloss", opts), fanM = K.mat(ctx, THREE, "casing2", "plastic", opts);
  const finM = K.mat(ctx, THREE, "metal", "metal", opts), pipeM = K.mat(ctx, THREE, "warm", "metal", opts, { roughness: 0.3 });
  const boardM = K.mat(ctx, THREE, "casing2", "matte", opts), chipM = K.mat(ctx, THREE, "casing", "plastic", opts);
  const goldM = K.mat(ctx, THREE, "warm", "metal", opts, { roughness: 0.25 }), plateM = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.45 });
  const connM = K.mat(ctx, THREE, "casing", "plastic", opts), darkM = K.mat(ctx, THREE, "trim", "rubber", opts);

  const merge = (geos) => {
    const gs = geos.map((g) => (g.index ? g.toNonIndexed() : g));
    let n = 0; for (const g of gs) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    let o = 0;
    for (const g of gs) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    return out;
  };
  const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  const cyl = (r, len, x, y, z, seg = 16) => new THREE.CylinderGeometry(r, r, len, seg).rotateX(Math.PI / 2).translate(x, y, z);
  // a flat shape drawn in (x, y), extruded along +z from z0 by its depth
  const slab = (shape, depth, z0, bevel = 0) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 40 });
    g.translate(0, 0, z0); g.computeVertexNormals(); return g;
  };
  const rect = (x0, y0, x1, y1, path) => { const s = path || new THREE.Shape(); s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.closePath(); return s; };
  const disc = (cx, cy, r, path) => { const s = path || new THREE.Shape(); s.absarc(cx, cy, r, 0, Math.PI * 2, false); return s; };
  const FAN = [X0 + 0.0595, X0 + 0.1555, X0 + 0.2515], FR = 0.0435;

  // ---- the board: its outline with the edge-connector tab and the key notch, the GPU package, memory, power stages,
  // the gold fingers, and the display connectors behind the bracket
  const pcb = new THREE.Group(); body.add(pcb);
  const F0 = X0 + 0.041, F1 = F0 + 0.089, NOTCH = F0 + 0.0117;
  const pcbS = new THREE.Shape();
  pcbS.moveTo(X0, FH); pcbS.lineTo(F0 - 0.002, FH); pcbS.lineTo(F0, FH - 0.002); pcbS.lineTo(F0, 0);
  pcbS.lineTo(NOTCH - 0.00095, 0); pcbS.lineTo(NOTCH - 0.00095, 0.004); pcbS.lineTo(NOTCH + 0.00095, 0.004); pcbS.lineTo(NOTCH + 0.00095, 0);
  pcbS.lineTo(F1, 0); pcbS.lineTo(F1, FH - 0.002); pcbS.lineTo(F1 + 0.002, FH); pcbS.lineTo(X0 + PL, FH); pcbS.lineTo(X0 + PL, PT); pcbS.lineTo(X0, PT); pcbS.closePath();
  pcb.add(K.mesh(THREE, slab(pcbS, 0.0016, -0.0008), boardM));
  const gx = X0 + 0.118, gy = 0.064;
  const comp = [box(0.045, 0.045, 0.0016, gx, gy, 0.0016), box(0.026, 0.026, 0.0009, gx, gy, 0.0028)];
  for (const [dx, dy] of [[-0.036, 0.016], [-0.036, -0.016], [0.036, 0.016], [0.036, -0.016], [-0.012, 0.037], [0.012, 0.037], [-0.012, -0.037], [0.012, -0.037]])
    comp.push(box(Math.abs(dx) > 0.02 ? 0.012 : 0.014, Math.abs(dx) > 0.02 ? 0.014 : 0.012, 0.0012, gx + dx, gy + dy, 0.0014));
  for (let i = 0; i < 9; i++) comp.push(box(0.0072, 0.0072, 0.0045, X0 + 0.178 + (i % 3) * 0.0105, 0.03 + Math.floor(i / 3) * 0.0105, 0.003));
  for (let i = 0; i < 9; i++) comp.push(cyl(0.0026, 0.006, X0 + 0.212, 0.026 + i * 0.0072, 0.0038, 12));
  pcb.add(K.mesh(THREE, merge(comp), chipM, false));
  const fingers = [];
  for (let i = 0; i < 42; i++) { const x = F0 + 0.0012 + i * 0.00211; if (Math.abs(x - NOTCH) > 0.0016) for (const z of [0.00085, -0.00085]) fingers.push(box(0.0012, 0.0062, 0.0001, x, 0.0036, z)); }
  pcb.add(K.mesh(THREE, merge(fingers), goldM, false));
  // the display connectors behind the bracket: three of one socket shape and one of a wider shape, soldered at the
  // board's end (generic outlines, no standard's mark)
  const dpS = (w, h, c, path) => { const s = path || new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2 - c); s.lineTo(w / 2 - c, h / 2); s.lineTo(-w / 2, h / 2); s.closePath(); return s; };
  const hdS = (w, h, c, path) => { const s = path || new THREE.Shape(); s.moveTo(-w / 2, h / 2); s.lineTo(w / 2, h / 2); s.lineTo(w / 2, -h / 2 + c); s.lineTo(w / 2 - c, -h / 2); s.lineTo(-w / 2 + c, -h / 2); s.lineTo(-w / 2, -h / 2 + c); s.closePath(); return s; };
  const PORTS = [[0.031, "dp"], [0.052, "dp"], [0.073, "dp"], [0.095, "hd"]], PZ = 0.0095;
  const shells = [];
  for (const [py, kind] of PORTS) {
    // a port's metal shell, seen end-on in the bracket, as a tube along +x: drawn in (z, y) then turned onto the x axis
    const out = kind === "dp" ? dpS(0.0166, 0.0049, 0.0016) : hdS(0.0154, 0.0059, 0.0015);
    out.holes.push(kind === "dp" ? dpS(0.0152, 0.0035, 0.0012, new THREE.Path()) : hdS(0.014, 0.0045, 0.0011, new THREE.Path()));
    const g = new THREE.ExtrudeGeometry(out, { depth: 0.014, bevelEnabled: false });
    g.rotateY(-Math.PI / 2); g.rotateX(0); g.translate(X0 + 0.0135, py, PZ);
    shells.push(g);
  }
  pcb.add(K.mesh(THREE, merge(shells), finM, false));

  // ---- the heatsink: three fin stacks across the length (plates in the y-z plane), the GPU's base plate, heat pipes
  // through the stacks that bend over the top edge where they show
  const heatsink = new THREE.Group(); body.add(heatsink);
  const fins = [], STACKS = [[X0 + 0.012, X0 + 0.105], [X0 + 0.112, X0 + 0.205], [X0 + 0.212, X0 + L - 0.004]];
  for (const [a, b] of STACKS) for (let x = a; x <= b + 1e-6; x += 0.0042) fins.push(box(0.0004, 0.104, 0.0175, x, FH + 0.058, 0.0175));
  heatsink.add(K.mesh(THREE, merge(fins), finM, false));
  heatsink.add(K.mesh(THREE, box(0.062, 0.058, 0.004, gx, gy, 0.0055), pipeM));
  for (let i = 0; i < 4; i++) {
    const z = 0.011 + i * 0.0045, xa = gx - 0.022 + i * 0.012, xb = X0 + 0.18 + i * 0.012, top = PT + 0.003 + i * 0.0009;
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xa, gy - 0.018, z * 0.6 + 0.003), new THREE.Vector3(xa, PT - 0.012, z), new THREE.Vector3(xa + 0.008, top, z),
      new THREE.Vector3(xb - 0.008, top, z), new THREE.Vector3(xb, PT - 0.012, z), new THREE.Vector3(xb, 0.03, z),
    ], false, "centripetal", 0.5);
    heatsink.add(K.mesh(THREE, new THREE.TubeGeometry(c, 90, 0.003, 12, false), pipeM, false));
  }

  // ---- the shroud: a front plate with the three fan openings, its two end caps and its top rail (the bottom edge stays
  // open to the fins, as it is), two raised ribs between the fans
  const shroud = new THREE.Group(); body.add(shroud);
  const SY0 = FH + 0.004, SY1 = PT + 0.0115;
  const front = rect(X0 + 0.002, SY0, X0 + L, SY1);
  for (const fx of FAN) front.holes.push(disc(fx, CY, FR + 0.0012, new THREE.Path()));
  shroud.add(K.mesh(THREE, slab(front, 0.003, Z1 - 0.003, 0.0006), shellM));
  for (const x of [X0 + 0.004, X0 + L - 0.002]) shroud.add(K.mesh(THREE, box(0.004, SY1 - SY0, Z1 - 0.009, x, (SY0 + SY1) / 2, 0.0045 + (Z1 - 0.009) / 2), shellM));
  // the top rail at the two ends only: between them the heat pipes bend over the fins in the open, and the power
  // connectors come up through the gap
  const PX = X0 + 0.245;
  for (const [a, b] of [[X0 + 0.004, X0 + 0.06], [X0 + L - 0.032, X0 + L - 0.002]]) shroud.add(K.mesh(THREE, box(b - a, 0.003, Z1 - 0.012, (a + b) / 2, SY1 - 0.0015, 0.006 + (Z1 - 0.012) / 2), shellM));
  const ribs = [];
  for (const x of [(FAN[0] + FAN[1]) / 2, (FAN[1] + FAN[2]) / 2]) for (const s of [-1, 1]) ribs.push(box(0.003, 0.03, 0.0012, x + s * 0.0035, CY + s * 0.034, Z1 + 0.0004));
  shroud.add(K.mesh(THREE, merge(ribs), shellM, false));
  for (const fx of FAN) { const ring = K.mesh(THREE, new THREE.TorusGeometry(FR + 0.0016, 0.0011, 8, 72), shellM, false); ring.position.set(fx, CY, Z1 + 0.0002); shroud.add(ring); }

  // ---- the fans: each a hub and eleven swept, pitched blades, turning about z
  const fans = new THREE.Group(); body.add(fans);
  const bladeShape = (() => {
    // one blade in polar terms: from the hub (r0) to the tip (r1), its leading edge swept forward, wider at the tip
    const r0 = 0.0175, r1 = FR - 0.0012, N = 8, lead = [], trail = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, r = r0 + (r1 - r0) * u, a = 0.55 * Math.pow(u, 1.25), w = 0.36 + 0.16 * u;
      lead.push([Math.cos(a) * r, Math.sin(a) * r]); trail.push([Math.cos(a - w) * r, Math.sin(a - w) * r]);
    }
    const s = new THREE.Shape(); s.moveTo(...lead[0]); for (const p of lead.slice(1)) s.lineTo(...p);
    for (const p of trail.reverse()) s.lineTo(...p); s.closePath(); return s;
  })();
  const spinners = [];
  for (const fx of FAN) {
    const fan = new THREE.Group(); fan.position.set(fx, CY, Z1 - 0.0105); fans.add(fan);
    const spin = new THREE.Group(); fan.add(spin); spinners.push(spin);
    spin.add(K.mesh(THREE, new THREE.CylinderGeometry(0.0168, 0.0168, 0.0075, 40).rotateX(Math.PI / 2), fanM, false));
    const cap = K.mesh(THREE, new THREE.CylinderGeometry(0.0115, 0.0115, 0.0008, 40).rotateX(Math.PI / 2), shellM, false); cap.position.z = 0.0042; spin.add(cap);
    const bl = [];
    for (let i = 0; i < 11; i++) {
      const g = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.0007, bevelEnabled: false, curveSegments: 4 });
      g.translate(0, 0, -0.00035);
      // the pitch: the blade turns about its own radial line, then takes its place round the hub
      g.rotateX(0.42); g.rotateZ(i / 11 * Math.PI * 2); bl.push(g);
    }
    spin.add(K.mesh(THREE, merge(bl), fanM, false));
    // the fan's own rim (a fan module is a ring with its blades inside it, so an exploded fan still reads as a fan)
    const rim = K.mesh(THREE, new THREE.TorusGeometry(FR - 0.0004, 0.001, 8, 72), fanM, false); fan.add(rim);
    const rimBand = K.mesh(THREE, new THREE.CylinderGeometry(FR - 0.0004, FR - 0.0004, 0.006, 72, 1, true).rotateX(Math.PI / 2), fanM, false); fan.add(rimBand);
    // the motor strut behind the hub: three arms to the frame ring
    const st = [];
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.5; st.push(new THREE.BoxGeometry(FR - 0.016, 0.0026, 0.0016).translate((FR - 0.016) / 2 + 0.016, 0, 0).rotateZ(a).translate(0, 0, -0.0055)); }
    fan.add(K.mesh(THREE, merge(st), fanM, false));
  }

  // ---- the power connectors: two 8-pin housings on the board's top edge, their pin openings facing up, a latch each
  const power = new THREE.Group(); body.add(power);
  const pw = [];
  for (const dx of [-0.0118, 0.0118]) {
    const cx = PX + dx;
    pw.push(box(0.0215, 0.0135, 0.0098, cx, PT + 0.0058, 0.0062));
    pw.push(box(0.006, 0.0026, 0.0028, cx, PT + 0.0136, 0.0062 + 0.0062));
  }
  power.add(K.mesh(THREE, merge(pw), connM));
  const pins = [];
  for (const dx of [-0.0118, 0.0118]) for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) pins.push(box(0.0036, 0.0006, 0.0036, PX + dx - 0.0063 + i * 0.0042, PT + 0.0126, 0.0062 - 0.0021 + j * 0.0042));
  power.add(K.mesh(THREE, merge(pins), darkM, false));

  // ---- the bracket at the I/O end: a plate in the y-z plane with the four port openings and vent slots, its top tab
  // bent outward with the screw slot, its tongue down beside the fingers
  const bracket = new THREE.Group(); body.add(bracket);
  const bS = new THREE.Shape(), BZ0 = -0.0035, BZ1 = 0.0405, BY1 = 0.121;
  bS.moveTo(BZ0, 0.006); bS.lineTo(BZ0 + 0.004, 0); bS.lineTo(BZ0 + 0.008, 0); bS.lineTo(BZ0 + 0.008, 0.006); bS.lineTo(BZ1, 0.006); bS.lineTo(BZ1, BY1); bS.lineTo(BZ0, BY1); bS.closePath();
  for (const [py, kind] of PORTS) {
    const hole = kind === "dp" ? dpS(0.0172, 0.0055, 0.0018, new THREE.Path()) : hdS(0.016, 0.0065, 0.0016, new THREE.Path());
    // the shape is drawn in (z, y): the holes are moved to the port's place on the plate
    const pts = hole.getPoints(); const p = new THREE.Path(); pts.forEach((q, k) => (k ? p.lineTo(q.x + PZ, q.y + py) : p.moveTo(q.x + PZ, q.y + py))); p.closePath();
    bS.holes.push(p);
  }
  for (let i = 0; i < 6; i++) bS.holes.push(rect(0.024 + 0.0021 * 0, 0.02 + i * 0.0155, 0.035, 0.0305 + i * 0.0155, new THREE.Path()));
  const bg = new THREE.ExtrudeGeometry(bS, { depth: 0.001, bevelEnabled: false });
  bg.rotateY(-Math.PI / 2); bg.translate(X0 - 0.0005, 0, 0);
  bracket.add(K.mesh(THREE, bg, plateM));
  const tab = new THREE.Shape(); tab.moveTo(0, BZ0); tab.lineTo(0.011, BZ0); tab.lineTo(0.011, 0.013); tab.lineTo(0.0075, 0.013); tab.lineTo(0.0075, 0.021); tab.lineTo(0.011, 0.021); tab.lineTo(0.011, BZ1); tab.lineTo(0, BZ1); tab.closePath();
  const tg = new THREE.ExtrudeGeometry(tab, { depth: 0.001, bevelEnabled: false });
  tg.rotateX(Math.PI / 2); tg.translate(X0 - 0.0115, BY1 + 0.001, 0);
  bracket.add(K.mesh(THREE, tg, plateM));

  // ---- the backplate: a plate on the back of the board, open where the cooler runs past the board's end, its screws
  const backplate = new THREE.Group(); body.add(backplate);
  const bp = rect(X0 + 0.002, FH + 0.003, X0 + PL, PT);
  bp.holes.push(rect(X0 + 0.236, FH + 0.02, X0 + 0.262, PT - 0.02, new THREE.Path()));
  backplate.add(K.mesh(THREE, slab(bp, 0.0016, -0.0062, 0.0003), plateM));
  const scr = [];
  for (const [dx, dy] of [[-0.03, -0.03], [0.03, -0.03], [-0.03, 0.03], [0.03, 0.03]]) scr.push(cyl(0.0024, 0.0012, gx + dx, gy + dy, -0.0066, 14));
  for (const [x, y] of [[X0 + 0.02, FH + 0.012], [X0 + 0.02, PT - 0.008], [X0 + 0.17, PT - 0.008], [X0 + 0.255, FH + 0.012], [X0 + 0.255, PT - 0.008]]) scr.push(cyl(0.0018, 0.001, x, y, -0.0066, 12));
  backplate.add(K.mesh(THREE, merge(scr), finM, false));

  group.add(K.contactShadow(ctx, THREE, L * S * 1.25, 0.08 * S * 1.6, 0.35));

  const parts = { shroud, fans, heatsink, pcb, power, bracket, backplate };
  const OFF = { backplate: [0, 0, -0.04], heatsink: [0, 0, 0.032], shroud: [0, 0, 0.064], fans: [0, 0, 0.09], power: [0, 0.03, 0], bracket: [-0.045, 0, 0] };
  const home = {}; for (const k of Object.keys(OFF)) home[k] = parts[k].position.clone();
  const st = { spin: 0, explode: opts.explode || 0 };
  const apply = () => {
    spinners.forEach((s, i) => { s.rotation.z = -st.spin * (1 + i * 0.03); });
    const e = K.clamp(st.explode);
    for (const k of Object.keys(OFF)) { const o = OFF[k]; parts[k].position.set(home[k].x + o[0] * e, home[k].y + o[1] * e, home[k].z + o[2] * e); }
  };
  apply();
  return {
    group, size: [L * S + 0.03, (PT + 0.016) * S, 0.06 * S], parts, keys: ["spin", "explode", "turn"],
    set(k, v) {
      if (k === "turn") { pivot.rotation.y = v; return; }
      if (k === "spin" || k === "explode") { st[k] = Number(v) || 0; apply(); }
    },
  };
}
