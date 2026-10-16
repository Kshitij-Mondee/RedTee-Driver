// @model {"id": "badge_door", "pack": "security", "what": "a security door in a metal frame set in a wall, a badge reader beside it with a status light, and a marked one-person zone on the floor; opts.pair builds a two-door mantrap (a glass vestibule) whose second door cannot open while the first is open", "parts": ["frame", "door", "reader", "reader_light", "floor_line", "shadow", "door2", "reader2", "interlock"], "keys": {"tap": "0..1 the reader light turns to the result (opts.status ok | bad, default ok)", "open": "0..1 the (first) door swings inward", "tailgate": "0..1 a second person's shadow crosses the floor line behind; the reader and the line turn to the alert role (the tailgater is only ever a shadow)", "tap2": "0..1 (pair) the inner reader light turns to opts.status2 (default ok)", "open2": "0..1 (pair) the second door swings, but only while the first is shut: it stays closed while the first is open, and the interlock lamp shows the alert role", "turn": "radians about y"}, "best_for": ["tailgating and piggybacking", "one badge, one person", "physical access control", "a mantrap or airlock entrance (opts.pair)", "data-centre security layers"], "not_for": ["the person badging in (composite a character from a kit)", "a building's outside (use building)"], "size": [3.0, 2.7, 2.6], "sheet": {"opts": {"status": "ok"}, "states": [{"key": "tap", "from": 0, "to": 1, "at": 1.0, "dur": 0.4}, {"key": "open", "from": 0, "to": 1, "at": 1.6, "dur": 1.0}, {"key": "tailgate", "from": 0, "to": 1, "at": 2.6, "dur": 2.2}], "elevation": 22}}
// The pair (mantrap): keys open/open2 and tap/tap2. A mantrap admits one authenticated person at a time through two
// interlocking doors; the interlock is built in, so a lesson cannot show both doors open by mistake: open2 is
// multiplied out while the first door is open (the first door has priority).
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const PAIR = !!opts.pair;
  const DW = 1.0, DH = 2.2, WH = 2.7, WT = 0.16, F0 = 0.05;      // door opening, wall height and thickness, floor top
  const FW = PAIR ? 2.4 : 3.0, VD = 1.8;                          // floor width; the vestibule's depth (pair)
  const FZ0 = PAIR ? -VD / 2 - 0.8 : -0.8, FZ1 = PAIR ? VD / 2 + 1.9 : 2.1;   // floor from back to front
  const FD = FZ1 - FZ0;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const root = new THREE.Group(); root.position.z = -(FZ0 + FZ1) / 2; pivot.add(root);   // centred on z

  const dark = K.role(ctx, "screen", opts) === "field";          // a light floor on a light page, a lit shell tone on a dark one
  const wallM = K.mat(ctx, THREE, opts.wall || (dark ? "paper2" : "paper"), "matte", opts, { roughness: 0.9 });
  const frameM = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.35 });
  const doorM = K.mat(ctx, THREE, opts.door || "casing2", "plastic", opts, { roughness: 0.55 });
  const floorM = K.mat(ctx, THREE, opts.floor || (dark ? "casing" : "paper2"), "matte", opts);
  const box = (w, h, d, m, x, y, z, r = 0.01) => { const o = K.mesh(THREE, r > 0 ? K.rbox(THREE, X, w, h, d, r, 2) : new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };

  const floor = box(FW, F0, FD, floorM, 0, F0 / 2, (FZ0 + FZ1) / 2, 0.012); root.add(floor);

  // one door wall: stubs and a header round the opening, a metal frame, a door hinged on its left jamb that swings
  // inward (towards -z), a lever handle both sides, a narrow vision panel; a reader on the wall right of the door
  const ox = -0.3;                                                // the opening's centre in x
  const buildWall = (z, width) => {
    const g = new THREE.Group(); g.position.z = z;
    const left = ox - DW / 2 + width / 2, right = width / 2 - (ox + DW / 2);
    g.add(box(left, WH, WT, wallM, -width / 2 + left / 2, F0 + WH / 2, 0, 0));      // square pieces, so no seams show
    g.add(box(right, WH, WT, wallM, width / 2 - right / 2, F0 + WH / 2, 0, 0));
    g.add(box(DW, WH - DH, WT, wallM, ox, F0 + DH + (WH - DH) / 2, 0, 0));
    const frame = new THREE.Group();
    for (const s of [-1, 1]) frame.add(box(0.07, DH, WT + 0.05, frameM, ox + s * (DW / 2 - 0.035), F0 + DH / 2, 0, 0.012));
    frame.add(box(DW, 0.07, WT + 0.05, frameM, ox, F0 + DH - 0.035, 0, 0.012));
    g.add(frame);
    const hinge = new THREE.Group(); hinge.position.set(ox - DW / 2 + 0.07, F0, -WT / 2 + 0.04); g.add(hinge);
    const leaf = new THREE.Group(); hinge.add(leaf);
    const LW = DW - 0.15, LH = DH - 0.09;
    leaf.add(box(LW, LH, 0.05, doorM, LW / 2, LH / 2 + 0.01, 0, 0.012));
    const vis = K.mesh(THREE, new THREE.BoxGeometry(0.16, 0.7, 0.056), K.mat(ctx, THREE, "cool", "glass", opts, { opacity: 0.45 }));
    vis.position.set(LW - 0.24, 1.45, 0); leaf.add(vis);
    for (const s of [-1, 1]) {                                    // lever handles on both faces
      const rose = K.mesh(THREE, new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20), frameM); rose.rotation.x = Math.PI / 2;
      rose.position.set(LW - 0.1, 1.0, s * 0.035); leaf.add(rose);
      const lever = box(0.17, 0.03, 0.03, frameM, LW - 0.17, 1.0, s * 0.06, 0.012); leaf.add(lever);
    }
    // the reader: a slim plate with a contactless mark (arcs, no words) and a light bar on top
    const reader = new THREE.Group(); reader.position.set(ox + DW / 2 + 0.32, F0 + 1.15, WT / 2 + 0.022); g.add(reader);
    reader.add(box(0.17, 0.27, 0.04, K.mat(ctx, THREE, "casing", "gloss", opts), 0, 0, 0, 0.02));
    const rf = K.face(ctx, THREE, 256, 256);
    rf.draw((c, w, h) => {
      c.strokeStyle = K.hexOf(ctx, "trim", opts); c.lineCap = "round"; c.lineWidth = 14;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(w * 0.3, h / 2, 40 + i * 34, -0.7, 0.7); c.stroke(); }
    });
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshBasicMaterial({ map: rf.tex, transparent: true }));
    mark.position.set(0, -0.03, 0.021); reader.add(mark);
    const lightM = new THREE.MeshStandardMaterial({ color: K.col(ctx, "trim", opts), emissive: K.col(ctx, "trim", opts), emissiveIntensity: 0.2, roughness: 0.4 });
    const light = K.mesh(THREE, K.rbox(THREE, X, 0.13, 0.036, 0.014, 0.014, 2), lightM, false);
    light.position.set(0, 0.095, 0.022); reader.add(light);
    return { g, hinge, leaf, frame, reader, light, lightM };
  };

  const A = buildWall(PAIR ? VD / 2 : 0, PAIR ? FW - 0.5 : FW);
  root.add(A.g);
  let B = null, lamp = null, lampM = null;
  const zoneZ0 = PAIR ? -VD / 2 + WT / 2 + 0.12 : WT / 2 + 0.12, zoneZ1 = PAIR ? VD / 2 - WT / 2 - 0.12 : WT / 2 + 1.05;
  if (PAIR) {
    B = buildWall(-VD / 2, FW - 0.5); root.add(B.g);
    // glass side walls with metal posts make the vestibule, so both doors and the zone inside stay visible
    const glassM = K.mat(ctx, THREE, "cool", "glass", opts, { opacity: 0.22 });
    for (const s of [-1, 1]) {
      const x = s * ((FW - 0.5) / 2 - 0.03);
      const pane = K.mesh(THREE, new THREE.BoxGeometry(0.03, WH - 0.1, VD - WT), glassM, false); pane.position.set(x, F0 + (WH - 0.1) / 2, 0); root.add(pane);
      for (const z of [-1, 0, 1]) root.add(box(0.06, WH, 0.06, frameM, x, F0 + WH / 2, z * (VD / 2 - WT / 2 - 0.03), 0.012));
      root.add(box(0.06, 0.06, VD, frameM, x, F0 + WH - 0.03, 0, 0.012));
    }
    // the interlock lamp over the second door, inside: it shows the alert role while the first door is open
    lampM = new THREE.MeshStandardMaterial({ color: K.col(ctx, "ok", opts), emissive: K.col(ctx, "ok", opts), emissiveIntensity: 0.6, roughness: 0.4 });
    lamp = K.mesh(THREE, new THREE.SphereGeometry(0.06, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), lampM, false);
    lamp.rotation.x = Math.PI / 2; lamp.position.set(ox, F0 + DH + 0.2, -VD / 2 + WT / 2 + 0.005); root.add(lamp);
    const base = box(0.16, 0.16, 0.02, K.mat(ctx, THREE, "casing", "plastic", opts), ox, F0 + DH + 0.2, -VD / 2 + WT / 2 + 0.005, 0.02); root.add(base);
  }

  // the floor line: the one-person zone, outlined on the floor (in the vestibule for a pair, before the door otherwise)
  const lineM = new THREE.MeshStandardMaterial({ color: K.col(ctx, "warm", opts), emissive: K.col(ctx, "warm", opts), emissiveIntensity: 0.15, roughness: 0.7 });
  const floorLine = new THREE.Group();
  const zx0 = ox - DW / 2 - 0.05, zx1 = ox + DW / 2 + 0.05, LT = 0.045;
  const strip = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.006, d), lineM); m.position.set(x, F0 + 0.003, z); m.receiveShadow = true; floorLine.add(m); };
  strip(zx1 - zx0, LT, (zx0 + zx1) / 2, zoneZ0); strip(zx1 - zx0, LT, (zx0 + zx1) / 2, zoneZ1);
  strip(LT, zoneZ1 - zoneZ0, zx0, (zoneZ0 + zoneZ1) / 2); strip(LT, zoneZ1 - zoneZ0, zx1, (zoneZ0 + zoneZ1) / 2);
  root.add(floorLine);

  // the tailgater: only a shadow on the floor (a soft body and head cast long, in the style's shadow token)
  const sf = K.face(ctx, THREE, 576, 192);
  sf.draw((c, w, h) => {
    // seen from above and cast long: two legs from the feet, a torso to the shoulders, a gap, the head
    c.filter = "blur(7px)"; c.fillStyle = K.hexOf(ctx, "shadow", opts);
    const m = h / 2;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(40, m + s * 8); c.lineTo(250, m + s * 6); c.lineTo(250, m + s * 34); c.lineTo(40, m + s * 30); c.closePath(); c.fill(); }
    c.beginPath(); c.moveTo(235, m - 36); c.quadraticCurveTo(360, m - 58, 430, m - 50); c.quadraticCurveTo(452, m, 430, m + 50);
    c.quadraticCurveTo(360, m + 58, 235, m + 36); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(500, m, 40, 34, 0, 0, Math.PI * 2); c.fill();
  });
  const SL = 1.25;
  const shadowM = new THREE.MeshBasicMaterial({ map: sf.tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const sPlane = new THREE.Mesh(new THREE.PlaneGeometry(SL, SL * 192 / 576), shadowM);
  sPlane.rotation.x = -Math.PI / 2; sPlane.position.set(SL / 2 - 0.08, 0, 0); sPlane.renderOrder = 1;
  const shadow = new THREE.Group(); shadow.add(sPlane); shadow.rotation.y = -1.93; shadow.position.y = F0 + 0.006; root.add(shadow);   // cast towards the front left, as if lit through the doorway
  // the path: from outside on the right, across the line into the zone, then up to the doorway as far as it is open
  const zc = (zoneZ0 + zoneZ1) / 2;
  const P0 = PAIR ? [ox + 0.15, FZ1 - 1.25] : [ox + 1.6, zc - 0.1], P1 = PAIR ? [ox + 0.15, VD / 2 + 0.25] : [ox + 0.15, zc], P2 = PAIR ? [ox + 0.1, zc - 0.1] : [ox + 0.1, zoneZ0 + 0.25];

  group.add(K.contactShadow(ctx, THREE, FW * 1.25, FD * 1.15, 0.35));

  const cOk = K.col(ctx, "ok", opts), cBad = K.col(ctx, "bad", opts), cIdle = K.col(ctx, "trim", opts), cWarm = K.col(ctx, "warm", opts);
  const st = { tap: 0, open: 0, tailgate: 0, tap2: 0, open2: 0 };
  const res = (s) => (s === "bad" ? cBad : cOk);
  const setLight = (m, c, glow) => { m.color.copy(c); m.emissive.copy(c); m.emissiveIntensity = glow; };
  const apply = () => {
    const s1 = K.clamp(st.open / 0.06);
    const e2 = PAIR ? st.open2 * (1 - s1) : 0;                   // the interlock: door 2 is held shut while door 1 is open
    const e1 = PAIR ? st.open * (1 - K.clamp(e2 / 0.06)) : st.open;
    A.hinge.rotation.y = 1.2 * K.easeInOut(e1);       // about 70 degrees, so the open leaf still shows
    if (B) B.hinge.rotation.y = 1.2 * K.easeInOut(e2);
    const tg = K.clamp(st.tailgate);
    // reader 1: idle, then the result, then the alert while a second person follows
    const k1 = K.easeOut(st.tap), base1 = cIdle.clone().lerp(res(opts.status), k1);
    const alarm = K.clamp(tg * 4), pulse = 0.5 + 0.5 * Math.cos(tg * Math.PI * 10);
    setLight(A.lightM, base1.clone().lerp(cBad, alarm), 0.2 + 1.2 * k1 * (1 - alarm) + alarm * (0.8 + 0.9 * pulse));
    lineM.color.copy(cWarm.clone().lerp(cBad, alarm)); lineM.emissive.copy(lineM.color); lineM.emissiveIntensity = 0.15 + 0.6 * alarm;
    if (B) {
      const k2 = K.easeOut(st.tap2);
      setLight(B.lightM, cIdle.clone().lerp(res(opts.status2), k2), 0.2 + 1.2 * k2);
      const refused = K.clamp(st.open2 * 3) * s1;               // asked to open while the first door is open
      setLight(lampM, cOk.clone().lerp(cBad, s1), 0.6 + 0.5 * s1 + 0.8 * refused);
    }
    // the shadow: fades in outside, crosses the line, then follows through the door only as far as it is open
    const a = K.easeInOut(K.clamp(tg / 0.7)), b = K.easeInOut(K.clamp((tg - 0.7) / 0.3)) * (PAIR ? K.easeInOut(e1) : 1);
    const x = a < 1 ? K.lerp(P0[0], P1[0], a) : K.lerp(P1[0], P2[0], b), z = a < 1 ? K.lerp(P0[1], P1[1], a) : K.lerp(P1[1], P2[1], b);
    shadow.position.x = x; shadow.position.z = z;
    shadowM.opacity = 0.5 * K.clamp(tg * 6); shadow.visible = tg > 0;
  };
  apply();
  return {
    group, size: [FW, WH + F0, FD],
    parts: { frame: A.frame, door: A.leaf, reader: A.reader, reader_light: A.light, floor_line: floorLine, shadow,
      door2: B ? B.leaf : null, reader2: B ? B.reader : null, interlock: lamp },
    keys: ["tap", "open", "tailgate", "tap2", "open2", "turn"],
    set(key, v) {
      if (key === "tap" || key === "open" || key === "tailgate" || key === "tap2" || key === "open2") { st[key] = K.clamp(v); apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
