// @model {"id": "meeting_room", "pack": "workplace", "set": true, "what": "a small meeting room diorama (two walls cut away): a table with six chairs and no people, a wall screen, a whiteboard, a wall clock on a shelf, a door", "parts": ["room", "table", "chairs", "screen", "whiteboard", "clock", "door"], "keys": {"lights": "0 lights off (the room dims; a lit screen stays bright) .. 1 on", "screen": "the wall screen's spec (see kit3d drawUI)", "wake": "0..1 the wall screen's brightness", "board": "0..1 the whiteboard's marks write in, line by line (opts.board: a list of lines; none given: blank marks)", "time": "the clock's hours as a number (9.5 = half past nine)", "door": "0 shut .. 1 swung open into the room", "turn": "radians about y (about -0.8 shows both walls from the open corner)"}, "best_for": ["meetings: agenda, time box, an owner for each action", "a presentation or a review on the wall screen", "collaboration and decisions", "booking and using shared rooms"], "not_for": ["the people in the meeting (composite characters from a kit)", "an open-plan floor (use office_floor)"], "size": [5.2, 2.8, 4.2], "sheet": {"opts": {"screen": {"kind": "list", "title": "Agenda", "items": ["Decisions needed", "Actions and owners", "Next review date"]}, "board": ["Owner for each action", "Due dates agreed", "Notes shared after"]}, "states": [{"key": "lights", "from": 0.15, "to": 1, "at": 0.5, "dur": 0.9}, {"key": "board", "from": 0, "to": 1, "at": 1.6, "dur": 2.0}, {"key": "time", "from": 9.0, "to": 9.75, "at": 0, "dur": 6}, {"key": "door", "from": 0, "to": 1, "at": 3.8, "dur": 1.0}], "elevation": 30, "turn": 0.5}}
// A set: its natural front is +z with the cut-away walls at the back (-z) and left (-x), so a turn of about -0.8 shows
// the room from its open corner. Words only from opts (screen spec, board lines); without them, neutral marks.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const RW = 5.2, RD = 4.2, WH = 2.7, WT = 0.12, F0 = 0.06;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const dark = K.role(ctx, "screen", opts) === "field";
  // lights: every lit-by-the-room material is kept with its base colour and dimmed together
  const dimmable = [];
  const M = (role, kind, extra) => { const m = K.mat(ctx, THREE, role, kind, opts, extra); m.userData.base = m.color.clone(); dimmable.push(m); return m; };
  const box = (w, h, d, m, x, y, z, r = 0.01) => { const o = K.mesh(THREE, r > 0 ? K.rbox(THREE, X, w, h, d, r, 2) : new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };

  const room = new THREE.Group(); pivot.add(room);
  const wallM = M(opts.wall || (dark ? "casing" : "paper"), "matte", { roughness: 0.92 });
  const floorM = M(opts.floor || (dark ? "casing2" : "paper2"), "matte");
  const metal = M("metal", "metal", { roughness: 0.35 });
  room.add(box(RW, F0, RD, floorM, 0, F0 / 2, 0, 0.012));
  // the back wall has a door opening at the right: built from pieces round it
  const DX = 1.95, DWd = 0.92, DHt = 2.1;
  const bz = -RD / 2 + WT / 2;
  const leftW = DX - DWd / 2 + RW / 2, rightW = RW / 2 - (DX + DWd / 2);
  room.add(box(leftW, WH, WT, wallM, -RW / 2 + leftW / 2, F0 + WH / 2, bz, 0));
  room.add(box(rightW, WH, WT, wallM, RW / 2 - rightW / 2, F0 + WH / 2, bz, 0));
  room.add(box(DWd, WH - DHt, WT, wallM, DX, F0 + DHt + (WH - DHt) / 2, bz, 0));
  room.add(box(WT, WH, RD - WT, wallM, -RW / 2 + WT / 2, F0 + WH / 2, WT / 2, 0));
  // skirting along both walls
  const skirt = M("casing2", "plastic");
  room.add(box(leftW, 0.08, 0.02, skirt, -RW / 2 + leftW / 2, F0 + 0.04, bz + WT / 2 + 0.01, 0));
  room.add(box(0.02, 0.08, RD - WT, skirt, -RW / 2 + WT + 0.01, F0 + 0.04, WT / 2, 0));

  // the door: frame and a leaf hinged on its right jamb, swinging into the room
  const doorM = M(opts.door || "casing2", "plastic", { roughness: 0.55 });
  for (const s of [-1, 1]) room.add(box(0.06, DHt, WT + 0.04, metal, DX + s * (DWd / 2 - 0.03), F0 + DHt / 2, bz, 0.01));
  room.add(box(DWd, 0.06, WT + 0.04, metal, DX, F0 + DHt - 0.03, bz, 0.01));
  const hinge = new THREE.Group(); hinge.position.set(DX + DWd / 2 - 0.06, F0, bz + WT / 2 - 0.03); room.add(hinge);
  const LW = DWd - 0.12;
  const leaf = box(LW, DHt - 0.07, 0.045, doorM, -LW / 2, (DHt - 0.07) / 2 + 0.005, 0, 0.01); hinge.add(leaf);
  const vis = K.mesh(THREE, new THREE.BoxGeometry(0.14, 0.75, 0.05), K.mat(ctx, THREE, "cool", "glass", opts, { opacity: 0.45 }), false);
  vis.position.set(-LW + 0.2, 1.35, 0); hinge.add(vis);
  for (const s of [-1, 1]) { const lv = box(0.15, 0.028, 0.028, metal, -LW + 0.14, 1.0, s * 0.045, 0.01); hinge.add(lv); }

  // the table: a long top on two slab legs, its long side towards the screen wall
  const TX = 0.25, TZ = 0.35, TL = 2.6, TWd = 1.2, TH = 0.75;
  const table = new THREE.Group(); room.add(table);
  table.add(box(TWd, 0.05, TL, M(opts.top || "paper", "matte", { roughness: 0.55 }), TX, F0 + TH - 0.025, TZ, 0.02));
  for (const s of [-1, 1]) table.add(box(TWd * 0.7, TH - 0.05, 0.06, metal, TX, F0 + (TH - 0.05) / 2, TZ + s * (TL / 2 - 0.35), 0.01));
  // a shared cable box in the middle of the table
  table.add(box(0.36, 0.03, 0.14, M("casing", "plastic"), TX, F0 + TH + 0.012, TZ - 0.2, 0.01));

  // chairs: three each side, facing the table (no people)
  const chairM = M(opts.chair || "casing2", "plastic", { roughness: 0.65 }), wheelM = M("casing", "rubber");
  const chairs = new THREE.Group(); room.add(chairs);
  const chair = (x, z, ry) => {
    const c = new THREE.Group();
    c.add(box(0.46, 0.07, 0.44, chairM, 0, 0.46, 0, 0.03));
    const back = box(0.44, 0.48, 0.05, chairM, 0, 0.78, 0.22, 0.03); back.rotation.x = -0.1; c.add(back);
    const col = K.mesh(THREE, new THREE.CylinderGeometry(0.025, 0.025, 0.36, 12), metal); col.position.y = 0.25; c.add(col);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2, arm = box(0.24, 0.03, 0.04, metal, Math.cos(a) * 0.12, 0.06, Math.sin(a) * 0.12, 0.01); arm.rotation.y = -a; c.add(arm);
      const w = K.mesh(THREE, new THREE.SphereGeometry(0.026, 10, 8), wheelM); w.position.set(Math.cos(a) * 0.23, 0.026, Math.sin(a) * 0.23); c.add(w);
    }
    c.position.set(x, F0, z); c.rotation.y = ry; chairs.add(c); return c;
  };
  for (const s of [-1, 1]) for (const k of [-1, 0, 1]) chair(TX + s * (TWd / 2 + 0.22), TZ + k * 0.82 + 0.15, -s * Math.PI / 2);   // each chair faces the table

  // the wall screen on the back wall, over the table's end
  const SWd = 1.76, SHd = 1.0, SY = F0 + 1.55;
  const disp = box(SWd + 0.06, SHd + 0.06, 0.05, M("casing", "gloss"), TX, SY, bz + WT / 2 + 0.03, 0.02); room.add(disp);
  const sf = K.face(ctx, THREE, 1600, Math.round(1600 * SHd / SWd));
  const drawScreen = (spec) => sf.draw((g, w, h) => K.drawUI(ctx, spec, g, w, h, opts), JSON.stringify(spec || {}));
  drawScreen(opts.screen || { kind: "blank" });
  const screenMat = new THREE.MeshBasicMaterial({ map: sf.tex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SWd, SHd), screenMat); screen.position.set(TX, SY, bz + WT / 2 + 0.056); room.add(screen);

  // the whiteboard on the left wall: a frame, a white face drawn from opts.board (or blank marks), a pen tray
  const BW = 1.9, BH = 1.1, BY = F0 + 1.45, BZ = TZ - 0.1, bx = -RW / 2 + WT;
  const whiteboard = new THREE.Group(); room.add(whiteboard);
  whiteboard.add(box(0.03, BH + 0.06, BW + 0.06, metal, bx + 0.015, BY, BZ, 0.01));
  const lines = Array.isArray(opts.board) ? opts.board.slice(0, 6) : [];
  const bf = K.face(ctx, THREE, 1400, Math.round(1400 * BH / BW));
  const drawBoard = (k) => bf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "paper", opts); g.fillRect(0, 0, w, h);
    const n = lines.length || 4, rowH = h / (n + 1.2);
    for (let i = 0; i < n; i++) {
      const kk = K.clamp(k * n - i); if (kk <= 0) break;
      const y = rowH * (i + 0.9);
      g.save(); g.beginPath(); g.rect(0, 0, 70 + (w - 120) * kk, h); g.clip();
      g.strokeStyle = g.fillStyle = K.hexOf(ctx, "ink", opts);   // marker on the board: the ink printed on paper
      if (i === 0) { g.fillStyle = K.hexOf(ctx, "ui", opts); g.fillRect(80, y + 52, Math.min(w - 200, 620), 10); g.fillStyle = K.hexOf(ctx, "ink", opts); }
      if (lines.length) {
        g.textBaseline = "middle"; g.textAlign = "left";
        g.fillText(K.fitText(g, String(lines[i]), w - 160, (q) => K.font(ctx, i === 0 ? "title" : "body", q, 700), i === 0 ? 100 : 88), 80, y);
      } else {
        // blank marks: a wavy hand line per row (no words), deterministic
        g.lineWidth = 12; g.lineCap = "round"; g.beginPath();
        const L = (w - 200) * [0.7, 0.85, 0.55, 0.75][i % 4];
        for (let x = 0; x <= L; x += 8) { const yy = y + Math.sin(x * 0.045 + i * 1.3) * 10 + Math.sin(x * 0.011 + i) * 6; if (x === 0) g.moveTo(80 + x, yy); else g.lineTo(80 + x, yy); }
        g.stroke();
      }
      g.restore();
    }
  }, Math.round(k * 200));
  const boardMat = new THREE.MeshStandardMaterial({ map: bf.tex, roughness: 0.35 }); boardMat.userData.base = boardMat.color.clone(); dimmable.push(boardMat);
  const boardFace = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), boardMat);
  boardFace.rotation.y = Math.PI / 2; boardFace.position.set(bx + 0.032, BY, BZ); whiteboard.add(boardFace);
  whiteboard.add(box(0.1, 0.03, BW * 0.9, metal, bx + 0.06, BY - BH / 2 - 0.03, BZ, 0.01));
  for (const [i, r] of [[0, "ui"], [1, "bad"]]) { const pen = K.mesh(THREE, new THREE.CylinderGeometry(0.014, 0.014, 0.16, 12), M(r, "plastic")); pen.rotation.x = Math.PI / 2; pen.position.set(bx + 0.06, BY - BH / 2 - 0.0, BZ - 0.4 + i * 0.12); whiteboard.add(pen); }

  // the clock: the library's clock model standing on a small wall shelf, left of the screen
  const shelfY = F0 + 1.58, CX = -1.45;
  room.add(box(0.5, 0.035, 0.22, M("casing2", "plastic"), CX, shelfY, bz + WT / 2 + 0.11, 0.01));
  const clock = await X.model("clock", { colors: opts.colors });
  K.fitHeight(clock, 0.42); clock.group.position.set(CX, shelfY + 0.018, bz + WT / 2 + 0.12); room.add(clock.group);
  clock.group.traverse((o) => { if (o.material && !o.material.isMeshBasicMaterial && o.material.color && !o.material.userData.base) { o.material.userData.base = o.material.color.clone(); dimmable.push(o.material); } });

  // a plant in the back corner
  const pot = K.mesh(THREE, K.lathe(THREE, [[0, 0], [0.16, 0], [0.2, 0.42], [0, 0.42]], 28), M("warm", "matte"));
  pot.position.set(-RW / 2 + 0.4, F0, -RD / 2 + 0.4); room.add(pot);
  const leafM = M("ok", "matte");
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2, lf = K.mesh(THREE, new THREE.SphereGeometry(0.14, 14, 10), leafM);
    lf.scale.set(0.45, 1.6, 0.25); lf.position.set(-RW / 2 + 0.4 + Math.cos(a) * 0.11, F0 + 0.7 + (i % 3) * 0.08, -RD / 2 + 0.4 + Math.sin(a) * 0.11);
    lf.rotation.set(Math.sin(a) * 0.55, a, Math.cos(a) * 0.55); room.add(lf);
  }

  group.add(K.contactShadow(ctx, THREE, RW * 1.25, RD * 1.25, 0.35));

  const st = { lights: opts.lights == null ? 1 : K.clamp(opts.lights), board: opts.boardShown == null ? 1 : K.clamp(opts.boardShown), door: 0 };
  const applyLights = () => {
    const f = 0.3 + 0.7 * K.easeInOut(st.lights);
    for (const m of dimmable) m.color.copy(m.userData.base).multiplyScalar(f);
  };
  applyLights(); drawBoard(st.board);
  clock.set("time", opts.time == null ? 9.0 : opts.time);
  return {
    group, size: [RW, WH + F0, RD], parts: { room, table, chairs, screen, whiteboard, clock: clock.group, door: leaf },
    keys: ["lights", "screen", "wake", "board", "time", "door", "turn"],
    set(key, v) {
      if (key === "lights") { st.lights = K.clamp(v); applyLights(); }
      else if (key === "screen") drawScreen(v);
      else if (key === "wake") screenMat.color.setScalar(0.1 + 0.9 * K.clamp(v));
      else if (key === "board") { st.board = K.clamp(v); drawBoard(st.board); }
      else if (key === "time") clock.set("time", v);
      else if (key === "door") { st.door = K.clamp(v); hinge.rotation.y = 1.3 * K.easeInOut(st.door); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
