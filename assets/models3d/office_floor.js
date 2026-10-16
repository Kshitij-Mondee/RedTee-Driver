// @model {"id": "office_floor", "pack": "workplace", "set": true, "what": "an open-plan office floor: pods of desks back to back (each the library's desk_set: desk, monitor, chair, mug and plant) with low dividers, tall plants, and a glass meeting pod with a round table; no people", "parts": ["floor", "desks", "pods", "plants", "meeting_pod"], "keys": {"lights": "0..1 the rows light in order, front row first (an unlit row is dim and its screens are dark)", "focus": "the index of one desk (row by row from the front, left to right) that stays bright while the rest dim; -1 for none", "dim": "0..1 how far the other desks dim while a desk has focus (default 1)", "away": "0..1 the focus desk is left unattended: its chair pushes out and its screen shows unlocked (opts.unlocked) instead of locked (opts.screen)", "turn": "radians about y"}, "best_for": ["clear desk and screen lock (one desk left unlocked)", "hybrid and office working", "a team, a floor or a department", "day one: where you will sit"], "not_for": ["the people at the desks (composite characters from a kit)", "one workstation close up (use desk_set)", "a meeting (use meeting_room)"], "size": [12.15, 2.0, 9.4], "sheet": {"opts": {"rows": 4, "cols": 3, "focus": 7}, "states": [{"key": "lights", "from": 0, "to": 1, "at": 0.3, "dur": 1.6}, {"key": "dim", "from": 0, "to": 1, "at": 2.3, "dur": 0.8}, {"key": "away", "from": 0, "to": 1, "at": 3.5, "dur": 1.2}], "light": "iso", "turn": 0.6}}
// Desks are numbered row by row from the front (row 0 faces the front, +z; the row behind it faces back, so each pod
// is two rows back to back) and left to right. Screens: opts.screen (the locked screen, default a lock with no words)
// and opts.unlocked (what the unattended desk shows, default neutral bars). Words only from opts.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const R = Math.max(1, Math.min(6, opts.rows || 4)), C = Math.max(1, Math.min(5, opts.cols || 3));
  const CP = 2.55, HALF = 0.6, PP = 4.3, F0 = 0.06;          // column pitch, desk centre from pod spine, pod pitch
  const pods = Math.ceil(R / 2);
  const deskW = C * CP, MPW = 2.9;                            // the desk area's width, the meeting pod's width
  const FW = deskW + MPW + 1.6, FD = pods * PP + 0.8;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const dark = K.role(ctx, "screen", opts) === "field";
  const lockSpec = opts.screen || { kind: "lock" }, openSpec = opts.unlocked || { kind: "blank" };
  const x0 = -FW / 2 + 0.6 + CP / 2;                          // first desk column's centre
  const zFront = FD / 2 - 0.4 - PP / 2;                       // the front pod's spine

  // the floor and, under each row, a carpet strip that lights with its row
  const floorM = K.mat(ctx, THREE, opts.floor || (dark ? "casing2" : "paper2"), "matte", opts);
  const floor = K.mesh(THREE, K.rbox(THREE, X, FW, F0, FD, 0.02, 2), floorM); floor.position.y = F0 / 2; pivot.add(floor);
  const rowZ = (r) => { const p = Math.floor(r / 2); return zFront - p * PP + (r % 2 === 0 ? HALF : -HALF); };
  const carpets = [];
  for (let r = 0; r < R; r++) {
    const m = K.mat(ctx, THREE, dark ? "casing" : "paper", "matte", opts); m.userData.base = m.color.clone();
    const c = K.mesh(THREE, new THREE.BoxGeometry(deskW + 0.2, 0.01, PP / 2 - 0.1), m, false);
    c.position.set(x0 - CP / 2 + deskW / 2, F0 + 0.005, rowZ(r) + (r % 2 === 0 ? 0.55 : -0.55)); pivot.add(c); carpets.push(m);
  }

  // the desks: desk_set instances; each keeps its own materials so a row or a desk can be dimmed alone
  const desks = [], deskG = new THREE.Group(); pivot.add(deskG);
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const d = await X.model("desk_set", { screen: lockSpec, colors: opts.colors });
    d.group.position.set(x0 + c * CP, F0, rowZ(r)); d.group.rotation.y = r % 2 === 0 ? 0 : Math.PI;
    const mats = new Set();
    d.group.traverse((o) => { if (o.isMesh && o.material && !o.material.isMeshBasicMaterial && o.material.color) mats.add(o.material); });
    for (const m of mats) m.userData.base = m.color.clone();
    deskG.add(d.group); desks.push({ d, r, mats: [...mats], spec: null });
  }
  // low dividers on each pod's spine (fabric panels on a metal rail)
  const podG = new THREE.Group(); pivot.add(podG);
  const panelM = K.mat(ctx, THREE, opts.divider || "casing2", "matte", opts, { roughness: 0.95 }); panelM.userData.base = panelM.color.clone();
  const railM = K.mat(ctx, THREE, "metal", "metal", opts);
  for (let p = 0; p < pods; p++) {
    if (2 * p + 1 >= R) continue;                              // a lone last row has no partner and no divider
    const z = zFront - p * PP;
    const panel = K.mesh(THREE, K.rbox(THREE, X, deskW - 0.1, 0.42, 0.05, 0.02, 2), panelM); panel.position.set(x0 - CP / 2 + deskW / 2, F0 + 1.0 + 0.21, z); podG.add(panel);
    const rail = K.mesh(THREE, K.rbox(THREE, X, deskW - 0.1, 0.03, 0.07, 0.01, 2), railM); rail.position.set(x0 - CP / 2 + deskW / 2, F0 + 1.43, z); podG.add(rail);
  }

  // tall floor plants at the ends of the pods
  const plants = new THREE.Group(); pivot.add(plants);
  const potM = K.mat(ctx, THREE, "warm", "matte", opts), leafM = K.mat(ctx, THREE, "ok", "matte", opts);
  const plant = (x, z, s) => {
    const g = new THREE.Group();
    g.add(K.mesh(THREE, K.lathe(THREE, [[0, 0], [0.2, 0], [0.24, 0.5], [0, 0.5]], 24), potM));
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * Math.PI * 2 + s, lf = K.mesh(THREE, new THREE.SphereGeometry(0.17, 12, 9), leafM);
      lf.scale.set(0.45, 1.9, 0.25); lf.position.set(Math.cos(a) * 0.14, 0.95 + (i % 3) * 0.13, Math.sin(a) * 0.14);
      lf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); g.add(lf);
    }
    g.position.set(x, F0, z); plants.add(g);
  };
  plant(-FW / 2 + 0.35, FD / 2 - 0.4, 0.3);
  plant(-FW / 2 + 0.35, -FD / 2 + 0.45, 1.1);
  plant(x0 + deskW - CP / 2 + 0.35, -FD / 2 + 0.45, 2.0);

  // the meeting pod: a glass room on the right with a round table and four chairs
  const mp = new THREE.Group(); pivot.add(mp);
  const mx = FW / 2 - MPW / 2 - 0.3, mz = -FD / 2 + MPW / 2 + 0.4, MH = 1.9;
  const glassM = K.mat(ctx, THREE, "cool", "glass", opts, { opacity: 0.2 });
  const box = (w, h, d, m, x, y, z) => { const o = K.mesh(THREE, K.rbox(THREE, X, w, h, d, 0.01, 2), m); o.position.set(x, y, z); mp.add(o); return o; };
  for (const [w, d, x, z] of [[MPW, 0.03, 0, -MPW / 2], [0.03, MPW, -MPW / 2, 0], [0.03, MPW, MPW / 2, 0], [MPW * 0.55, 0.03, MPW * 0.225, MPW / 2]]) {
    const g = K.mesh(THREE, new THREE.BoxGeometry(w, MH, d), glassM, false); g.position.set(mx + x, F0 + MH / 2, mz + z); mp.add(g);
  }
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [-0.05, 1]]) box(0.06, MH, 0.06, railM, mx + x * MPW / 2, F0 + MH / 2, mz + z * MPW / 2);
  for (const [w, d, x, z] of [[MPW, 0.06, 0, -MPW / 2], [MPW, 0.06, 0, MPW / 2], [0.06, MPW, -MPW / 2, 0], [0.06, MPW, MPW / 2, 0]]) box(w, 0.06, d, railM, mx + x, F0 + MH, mz + z);
  const topM = K.mat(ctx, THREE, "paper", "matte", opts, { roughness: 0.55 });
  const tt = K.mesh(THREE, new THREE.CylinderGeometry(0.62, 0.62, 0.05, 40), topM); tt.position.set(mx, F0 + 0.74, mz); mp.add(tt);
  const tc = K.mesh(THREE, new THREE.CylinderGeometry(0.05, 0.05, 0.7, 12), railM); tc.position.set(mx, F0 + 0.36, mz); mp.add(tc);
  const tb = K.mesh(THREE, new THREE.CylinderGeometry(0.3, 0.32, 0.03, 30), railM); tb.position.set(mx, F0 + 0.015, mz); mp.add(tb);
  const seatM = K.mat(ctx, THREE, "ui2", "plastic", opts, { roughness: 0.6 });
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + Math.PI / 4, cx = mx + Math.cos(a) * 0.95, cz = mz + Math.sin(a) * 0.95;
    const ch = new THREE.Group(); ch.position.set(cx, F0, cz); ch.rotation.y = -a - Math.PI / 2; mp.add(ch);
    const s = K.mesh(THREE, K.rbox(THREE, X, 0.44, 0.07, 0.42, 0.03, 3), seatM); s.position.y = 0.46; ch.add(s);
    const b = K.mesh(THREE, K.rbox(THREE, X, 0.42, 0.42, 0.05, 0.03, 3), seatM); b.position.set(0, 0.74, 0.21); ch.add(b);
    for (const [lx, lz] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) {
      const l = K.mesh(THREE, new THREE.CylinderGeometry(0.015, 0.015, 0.44, 8), railM); l.position.set(lx, 0.22, lz); ch.add(l);
    }
  }

  // the focus pad: a soft panel in the accent under the desk that keeps the light (signalling only, no words)
  const padM = new THREE.MeshBasicMaterial({ color: K.col(ctx, "ui", opts), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const pad = new THREE.Mesh(new THREE.ShapeGeometry(K.roundRect(THREE, CP - 0.15, 2.3, 0.25), 8), padM); pad.rotation.x = -Math.PI / 2; pad.visible = false; pivot.add(pad);

  group.add(K.contactShadow(ctx, THREE, FW * 1.2, FD * 1.2, 0.3));

  const st = { lights: opts.lights == null ? 1 : K.clamp(opts.lights), focus: opts.focus == null ? -1 : opts.focus, dim: opts.dim == null ? 1 : K.clamp(opts.dim), away: 0 };
  const apply = () => {
    const fi = Math.round(st.focus), awayIdx = fi >= 0 && fi < desks.length ? fi : 0;
    const rowK = (r) => K.easeInOut(K.clamp(st.lights * R - r));
    carpets.forEach((m, r) => m.color.copy(m.userData.base).multiplyScalar(0.45 + 0.55 * rowK(r)));
    if (pad) { const e = desks[fi]; pad.visible = !!e && st.dim > 0; if (e) { pad.position.set(e.d.group.position.x, F0 + 0.012, e.d.group.position.z + (e.r % 2 === 0 ? 0.35 : -0.35)); padM.opacity = 0.32 * st.dim; } }
    desks.forEach((e, i) => {
      const kr = rowK(e.r), focused = fi >= 0 && i === fi;
      const fd = fi >= 0 && !focused ? 1 - 0.68 * st.dim : 1;
      const f = (0.2 + 0.8 * kr) * fd;
      for (const m of e.mats) m.color.copy(m.userData.base).multiplyScalar(f);
      const isAway = i === awayIdx && st.away > 0;
      e.d.set("wake", Math.max(kr * (fd < 1 ? 0.45 + 0.55 * fd : 1), isAway ? K.clamp(st.away * 2) : 0));
      e.d.set("chair", i === awayIdx ? st.away : 0);
      const spec = i === awayIdx && st.away >= 0.5 ? openSpec : lockSpec;
      if (spec !== e.spec) { e.d.set("screen", spec); e.spec = spec; }
    });
  };
  apply();
  return {
    group, size: [FW, 2.0, FD], parts: { floor, desks: deskG, pods: podG, plants, meeting_pod: mp },
    keys: ["lights", "focus", "dim", "away", "turn"],
    set(key, v) {
      if (key === "lights" || key === "dim" || key === "away") { st[key] = K.clamp(v); apply(); }
      else if (key === "focus") { st.focus = v == null ? -1 : v; apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
