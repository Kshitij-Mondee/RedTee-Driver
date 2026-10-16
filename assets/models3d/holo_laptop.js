// @model {"id": "holo_laptop", "pack": "devices", "what": "a generic 14-inch class laptop built as a hologram hero (T-137): a bottom case on rubber feet with rear exhaust slots and screws, a keyboard deck with its speaker slots, a full key layout (function row, five rows on a 15-unit grid, an inverted-T arrow cluster), a glass trackpad, a hinge barrel, a lid with its display, bezel and camera, and an I/O module of ports on the left side; every part a real, connected piece that explodes along its own axis", "parts": ["base", "keyboard_deck", "keys", "trackpad", "hinge", "lid", "screen", "ports"], "keys": {"lid": "0 closed .. 1 open (110 degrees from closed)", "explode": "0 assembled .. 1 exploded: the base stays as the floor, the deck, the keys and the trackpad rise off it in layers, the ports slide out to the left, the hinge and the lid move back and up and the screen leaves the lid along its face", "turn": "radians about y"}, "explode_note": "explode vectors are in the real laptop's metres (the model is drawn at 5x)", "explode": {"keyboard_deck": [0, 0.018, 0], "keys": [0, 0.042, 0], "trackpad": [0, 0.052, 0.016], "ports": [-0.055, 0.008, 0], "hinge": [0, 0.03, -0.03], "lid": [0, 0.035, -0.058], "screen": [0, 0, 0.04]}, "hero": {"padR": 1.08, "zoom": 0.8, "elevation": 20, "beam": 0.35, "why": "a flat object: a smaller pad and a low beam, so the pad's light does not wash over the deck"}, "best_for": ["endpoint security and device policy (a laptop as the protected asset)", "onboarding IT: what a new starter receives", "remote and hybrid work", "an exploded view of a device's parts (a lid lifts, the screen comes away, the ports slide out)"], "not_for": ["a laptop with a live screen in a desk scene (use laptop)", "a person working at a desk (use a rig or a place)"], "size": [1.56, 1.075, 1.5], "sheet": {"states": [{"key": "lid", "from": 0.08, "to": 1, "at": 0.5, "dur": 1.3}, {"key": "explode", "from": 0, "to": 1, "at": 3.4, "dur": 1.4}], "elevation": 22}}
// Geometry in metres, from the public dimensions of 14-inch class laptops: 312 x 221 mm, a 10.5 mm base (a 6 mm bottom
// case on 1.5 mm feet and a 3 mm deck), a 5.5 mm lid, a 16:10 display. The laptop faces +z; x is across it, the ports
// are on its left (-x). The lid pivots on the hinge axis at the back of the deck. Words: none (no marks, no logo).
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 0.312, D = 0.221, FEET = 0.0015, CASE = 0.006, DECK = 0.003, TOP = FEET + CASE + DECK;
  const LH = 0.212, LT = 0.0055, OPEN = 110 * Math.PI / 180;
  // built in metres and shown at 5x (1.56 units across, as the other devices): the hologram's pad and framing are sized
  // for models of about a unit or more
  const S = 5;
  const group = new THREE.Group(), pivot = new THREE.Group(), body = new THREE.Group(); group.add(pivot); body.scale.setScalar(S); pivot.add(body);
  const shell = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.4 });
  const keyM = K.mat(ctx, THREE, "casing", "plastic", opts), padM = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.22 });
  const bezelM = K.mat(ctx, THREE, "casing", "gloss", opts), glass = K.mat(ctx, THREE, "screen", "glass", opts);
  const rubber = K.mat(ctx, THREE, "trim", "rubber", opts), dark = K.mat(ctx, THREE, "casing2", "plastic", opts), portM = K.mat(ctx, THREE, "metal", "metal", opts);

  // many small boxes as one geometry, so a key field or a row of slots is one mesh with its real edges
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
  // a flat plate in the xz plane from a shape drawn in (x, z), extruded upward by its thickness
  const plate = (shape, thick, bevel) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 10 });
    g.rotateX(Math.PI / 2); g.translate(0, thick, 0); g.computeVertexNormals(); return g;
  };
  const rrect = (w, d, r, cx = 0, cz = 0, path) => {
    const s = path || new THREE.Shape(), x = cx - w / 2, z = cz - d / 2;
    s.moveTo(x + r, z); s.lineTo(x + w - r, z); s.quadraticCurveTo(x + w, z, x + w, z + r); s.lineTo(x + w, z + d - r);
    s.quadraticCurveTo(x + w, z + d, x + w - r, z + d); s.lineTo(x + r, z + d); s.quadraticCurveTo(x, z + d, x, z + d - r);
    s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z); return s;
  };

  // ---- the base: the bottom case on two rubber feet, screws underneath, the exhaust slots in its rear edge
  const base = new THREE.Group(); body.add(base);
  // the bottom case is a tray (a floor and its walls, open at the top as a real one is), so no face sits under the deck
  // and the keys to stack light on them
  const trayS = rrect(W, D, 0.006); trayS.holes.push(rrect(W - 0.004, D - 0.004, 0.0045, 0, 0, new THREE.Path()));
  const walls = K.mesh(THREE, plate(trayS, CASE - 0.0012, 0.0004), shell); walls.position.y = FEET + 0.0012; base.add(walls);
  const trayFloor = K.mesh(THREE, K.rbox(THREE, X, W, 0.0012, D, 0.0006, 2), shell); trayFloor.position.y = FEET + 0.0006; base.add(trayFloor);
  for (const z of [-D * 0.36, D * 0.38]) { const f = K.mesh(THREE, K.rbox(THREE, X, W * 0.78, FEET, 0.008, 0.0007, 2), rubber); f.position.set(0, FEET / 2, z); base.add(f); }
  const screws = [];
  for (const [x, z] of [[-0.14, -0.096], [-0.07, -0.098], [0, -0.098], [0.07, -0.098], [0.14, -0.096], [-0.145, 0.098], [0.145, 0.098], [-0.05, 0.1], [0.05, 0.1]])
    screws.push(new THREE.CylinderGeometry(0.0022, 0.0022, 0.0004, 12).translate(x, FEET - 0.0002, z));
  base.add(K.mesh(THREE, merge(screws), portM, false));
  const slots = [];
  for (let i = 0; i < 18; i++) slots.push(box(0.0075, 0.0022, 0.0012, -0.0935 + i * 0.011, FEET + CASE * 0.5, -D / 2 - 0.0003));
  base.add(K.mesh(THREE, merge(slots), dark, false));
  // the intake under the base: two banks of slots
  const intake = [];
  for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) intake.push(box(0.0018, 0.0003, 0.03, sx * (0.04 + i * 0.0055), FEET - 0.0001, -D * 0.2));
  base.add(K.mesh(THREE, merge(intake), dark, false));

  // ---- the keyboard deck: one plate with the keyboard well and the trackpad opening cut through it, a well floor
  // under the keys, and the speaker slots either side of the keyboard
  const KW = 0.282, KZ0 = -0.094, KZ1 = 0.018, PW = 0.12, PD = 0.074, PZ = 0.066;
  const deckS = rrect(W, D, 0.006);
  deckS.holes.push(rrect(KW, KZ1 - KZ0, 0.0025, 0, (KZ0 + KZ1) / 2, new THREE.Path()));
  deckS.holes.push(rrect(PW + 0.002, PD + 0.002, 0.006, 0, PZ, new THREE.Path()));
  for (const sx of [-1, 1]) deckS.holes.push(rrect(0.0035, 0.1, 0.0017, sx * 0.149, (KZ0 + KZ1) / 2, new THREE.Path()));
  const keyboard_deck = new THREE.Group(); body.add(keyboard_deck);
  const deck = K.mesh(THREE, plate(deckS, DECK - 0.0005, 0.0004), shell); deck.position.y = FEET + CASE; keyboard_deck.add(deck);
  const floor = K.mesh(THREE, box(KW, 0.0008, KZ1 - KZ0, 0, FEET + CASE + 0.0006, (KZ0 + KZ1) / 2), dark, false); keyboard_deck.add(floor);
  for (const sx of [-1, 1]) { const sp = K.mesh(THREE, box(0.0034, 0.0006, 0.099, sx * 0.149, FEET + CASE + 0.0008, (KZ0 + KZ1) / 2), dark, false); keyboard_deck.add(sp); }

  // ---- the keys: a 15-unit grid across the well, the function row at 0.6 units deep, the arrows as an inverted T
  const u = KW / 15, gap = 0.0026, kh = 0.0013, ky = FEET + CASE + 0.0011 + kh / 2;
  const keyGeos = [];
  const key = (x0, w, z0, d) => keyGeos.push(box(w - gap, kh, d - gap, x0 + w / 2, ky, z0 + d / 2));
  const row = (z0, d, widths) => { let x = -KW / 2; for (const w of widths) { if (w > 0) key(x, w * u, z0, d); x += Math.abs(w) * u; } };
  const fnD = 0.6 * u;
  let z = KZ0 + 0.0035;
  { const fw = 15 / 14; row(z, fnD, Array(14).fill(fw)); }
  z += fnD;
  row(z, u, Array(13).fill(1).concat([2]));                             z += u;
  row(z, u, [1.5].concat(Array(12).fill(1), [1.5]));                    z += u;
  row(z, u, [1.75].concat(Array(11).fill(1), [2.25]));                  z += u;
  row(z, u, [2.25].concat(Array(10).fill(1), [2.75]));                  z += u;
  // the bottom row: fn, ctrl, alt, cmd, space, cmd, alt, then the arrows (left, up over down, right)
  row(z, u, [1, 1, 1, 1.25, 5.5, 1.25, 1]);
  { const ax = -KW / 2 + 12 * u; key(ax, u, z + u * 0.5, u * 0.5); key(ax + u, u, z, u * 0.5); key(ax + u, u, z + u * 0.5, u * 0.5); key(ax + 2 * u, u, z + u * 0.5, u * 0.5); }
  const keys = new THREE.Group(); keyboard_deck.add(keys);
  keys.add(K.mesh(THREE, merge(keyGeos), keyM, false));

  // ---- the trackpad: a glass plate set into its opening, flush with the deck
  const trackpad = new THREE.Group(); body.add(trackpad);
  const tp = K.mesh(THREE, K.rbox(THREE, X, PW, 0.0009, PD, 0.0045, 3), padM, false); tp.position.set(0, TOP - 0.0006, PZ); trackpad.add(tp);

  // ---- the hinge: one barrel across the back of the deck, its end caps ringed; the lid turns about its axis
  // the axis sits just above the deck, so the closed lid (its display face down) rests on the keys, not in them
  const HY = TOP + 0.0042, HZ = -D / 2 + 0.0055;
  const hinge = new THREE.Group(); hinge.position.set(0, HY, HZ); body.add(hinge);
  const barrel = K.mesh(THREE, new THREE.CylinderGeometry(0.0046, 0.0046, 0.236, 24, 1), dark); barrel.rotation.z = Math.PI / 2; hinge.add(barrel);
  for (const sx of [-1, 1]) {
    const cap = K.mesh(THREE, new THREE.CylinderGeometry(0.0049, 0.0049, 0.006, 24), portM); cap.rotation.z = Math.PI / 2; cap.position.x = sx * 0.115; hinge.add(cap);
    const ring = K.mesh(THREE, new THREE.TorusGeometry(0.0049, 0.0005, 6, 24), portM, false); ring.rotation.y = Math.PI / 2; ring.position.x = sx * 0.1085; hinge.add(ring);
  }

  // ---- the lid on the hinge axis: its shell (the back faces -z when open), the display unit on its inner face
  const lid = new THREE.Group(); lid.position.set(0, HY, HZ); body.add(lid);
  const lidShell = K.mesh(THREE, K.rbox(THREE, X, W, LH, LT, 0.005, 4), shell); lidShell.position.set(0, LH / 2 + 0.002, -0.0008); lid.add(lidShell);
  const screen = new THREE.Group(); screen.position.set(0, 0, LT / 2 - 0.0008); lid.add(screen);
  const bezel = K.mesh(THREE, K.rbox(THREE, X, W - 0.004, LH - 0.004, 0.0016, 0.004, 3), bezelM, false); bezel.position.set(0, LH / 2 + 0.002, 0.0008); screen.add(bezel);
  const AW = 0.296, AH = AW / 1.6, chin = 0.012;
  // the display's glass is one plane (a see-through box would be four faces of light)
  const panel = K.mesh(THREE, new THREE.PlaneGeometry(AW, AH), glass, false); panel.position.set(0, chin + AH / 2 + 0.002, 0.0018); screen.add(panel);
  const cam = K.mesh(THREE, new THREE.CylinderGeometry(0.0016, 0.0016, 0.0006, 16), dark, false); cam.rotation.x = Math.PI / 2; cam.position.set(0, LH - 0.0045, 0.0018); screen.add(cam);
  const camRing = K.mesh(THREE, new THREE.TorusGeometry(0.0024, 0.00035, 6, 20), portM, false); camRing.position.set(0, LH - 0.0045, 0.0019); screen.add(camRing);

  // ---- the ports: an I/O module along the left edge, its sockets proud of the side by a hair
  // back to front: two small reversible sockets, a display output, a wide rectangular socket, the audio jack
  const ports = new THREE.Group(); body.add(ports);
  const PX = -W / 2, PY = FEET + CASE * 0.55;
  const ioBoard = K.mesh(THREE, box(0.006, 0.0012, 0.12, PX + 0.008, FEET + 0.0018, -0.01), dark, false); ports.add(ioBoard);
  const stadium = (w, h, path) => { const r = h / 2, s = path || new THREE.Shape(); s.moveTo(-w / 2 + r, -r); s.lineTo(w / 2 - r, -r); s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false); s.lineTo(-w / 2 + r, r); s.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false); return s; };
  const socket = (outer, inner, zc, depth) => {
    // a metal shell: the outline with its opening, extruded into the case along +x
    const s = outer(); s.holes.push(inner());
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 });
    g.rotateY(Math.PI / 2); g.translate(PX - 0.0003, PY, zc);
    return g;
  };
  const pg = [];
  for (const zc of [-0.072, -0.058]) pg.push(socket(() => stadium(0.0089, 0.0031), () => stadium(0.0079, 0.0021, new THREE.Path()), zc, 0.008));
  // the display output: a rectangle with its two lower corners cut
  const dpOuter = (path) => { const s = path || new THREE.Shape(), w = 0.0142, h = 0.0047, c = 0.0013; s.moveTo(-w / 2, h / 2); s.lineTo(w / 2, h / 2); s.lineTo(w / 2, -h / 2 + c); s.lineTo(w / 2 - c, -h / 2); s.lineTo(-w / 2 + c, -h / 2); s.lineTo(-w / 2, -h / 2 + c); s.closePath(); return s; };
  const dpInner = () => { const p = new THREE.Path(), w = 0.0128, h = 0.0034, c = 0.0009; p.moveTo(-w / 2, h / 2); p.lineTo(w / 2, h / 2); p.lineTo(w / 2, -h / 2 + c); p.lineTo(w / 2 - c, -h / 2); p.lineTo(-w / 2 + c, -h / 2); p.lineTo(-w / 2, -h / 2 + c); p.closePath(); return p; };
  pg.push(socket(() => dpOuter(), dpInner, -0.036, 0.01));
  const rectS = (w, h, path) => { const s = path || new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath(); return s; };
  pg.push(socket(() => rectS(0.0128, 0.0046), () => rectS(0.0118, 0.0036, new THREE.Path()), -0.012, 0.012));
  const socketTongue = box(0.009, 0.0009, 0.0112, PX + 0.0045, PY + 0.0006, -0.012);
  const circ = (r, path) => { const s = path || new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2, false); return s; };
  pg.push(socket(() => circ(0.0026), () => circ(0.0018, new THREE.Path()), 0.012, 0.012));
  ports.add(K.mesh(THREE, merge(pg.concat([socketTongue])), portM, false));

  group.add(K.contactShadow(ctx, THREE, W * S * 1.5, D * S * 1.7, 0.35));

  // ---- keys: the lid's angle, the explode (each part along its own axis, from where it was built)
  const parts = { base, keyboard_deck, keys, trackpad, hinge, lid, screen, ports };
  // the base stays on the pad as the floor of the view; the layers rise off it (an exploded view never sinks into the
  // projector), the ports slide out to the left, the hinge and the lid move back, the screen leaves the lid
  const OFF = { keyboard_deck: [0, 0.018, 0], keys: [0, 0.042, 0], trackpad: [0, 0.052, 0.016], ports: [-0.055, 0.008, 0], hinge: [0, 0.03, -0.03], lid: [0, 0.035, -0.058], screen: [0, 0, 0.04] };
  const home = {}; for (const k of Object.keys(OFF)) home[k] = parts[k].position.clone();
  const st = { lid: opts.lid == null ? 1 : opts.lid, explode: opts.explode || 0 };
  const apply = () => {
    lid.rotation.x = Math.PI / 2 - K.clamp(st.lid) * OPEN;
    const e = K.clamp(st.explode);
    for (const k of Object.keys(OFF)) { const o = OFF[k]; parts[k].position.set(home[k].x + o[0] * e, home[k].y + o[1] * e, home[k].z + o[2] * e); }
  };
  apply();
  return {
    group, size: [W * S, 0.215 * S, 0.3 * S], parts, keys: ["lid", "explode", "turn"],
    set(k, v) {
      if (k === "turn") { pivot.rotation.y = v; return; }
      if (k === "lid" || k === "explode") { st[k] = Number(v) || 0; apply(); }
    },
  };
}
