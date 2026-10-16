/* Loom places and the in-scene camera (D-84; docs/styles/DISTINCTNESS_PLAN.md step 5).
 *
 * Every motion beat should happen SOMEWHERE, not on wallpaper, and an idea should be explored with the camera
 * (push into the part, pan along the process) instead of a cut to a new slide. A place here is built in three
 * depth LAYERS (far, mid, near), drawn in the lesson's shape language with the object grammars as props, so the
 * same office is a different office under another seed. The camera moves the layers at different rates
 * (parallax), so a push reads as moving through a space.
 *
 *   const P = Loom.place.office(ctx, "set", { side: "right", t0: 0, t1: 8 });  // {E, layers, anchors, floorY}
 *   Loom.cam.push(P, { to: P.anchors.screen, scale: 1.6, t0: 2, t1: 4.5 });    // parallax push into a part
 *   Loom.cam.pan(P, { dx: -600, t0: 5, t1: 7 });                                 // along a row or a process
 *   places: office, inside (a body interior), server (a machine room), meeting, warehouse
 * Anchors are frame coordinates of the parts that matter (desk, screen, wall, door...), for characters, labels
 * and the camera. Everything is deterministic: positions and props come from the name, the seed and arguments.
 */
// @capability places_and_camera | world | Loom.place.office, inside, server, meeting, warehouse; Loom.cam.push, pan, pull, frame | Places and the camera | a motion beat that happens somewhere (an office, a server room), explored with an in-scene camera
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const K = () => Loom.kit;
  const T = () => Loom.treat;
  const O = () => Loom.obj;
  const svg = (...a) => Loom.svg(...a);
  const P = (Loom.place = {});
  const C = (Loom.cam = {});
  const f = (v) => Math.round(v * 10) / 10;

  /** a place: one element with three layer groups, each wrapped in a camera group the camera drives */
  function frame(ctx, name, kind, o) {
    const E = ctx.el(name, { x: 0, y: 0, w: o.w || 1920, h: o.h || 1080, kind: "scenery", parent: o.parent });
    const layers = {};
    ["far", "mid", "near"].forEach((nm, i) => {
      const cam = svg("g", { class: "lm-cam", "data-layer": nm }, E.inner);
      layers[nm] = { cam, g: svg("g", {}, cam), depth: [0.35, 0.7, 1.15][i] };
    });
    (Loom.report.treatments = Loom.report.treatments || []).push({ beat: Loom.ctxBeat && Loom.ctxBeat.id, axis: "place", as: kind + "/" + T().pick("shape"), name, seeded: !!T().seed() });
    return { E, layers, anchors: {}, kind, W: o.w || 1920, H: o.h || 1080, cams: [], ctx };
  }
  const box = (x, y, w, h, r, key) => T().outline(x, y, w, h, T().pick("shape"), key, r);
  const fillBox = (g, x, y, w, h, tok, r, key) => T().body(g, box(x, y, w, h, r, key), tok, { x, y, w, h });
  const plain = (g, x, y, w, h, tok, op) => svg("rect", { x: f(x), y: f(y), width: f(w), height: f(h), fill: S().c(tok), opacity: op }, g);

  const OV = 700;   // overscan: backgrounds run past the frame so a pan or a push never shows an edge
  /** what the SEED changes in a place (D-84): the wall tone, the floor's pattern (from the texture axis), the trim
   *  (from the shape language) and, unless the scene says, which side the furniture stands on */
  P.look = function (kind, name, o) {
    const key = T().seedKey(), hsh = Loom.hash(key + "|" + kind + "|" + (o.lookKey || "")) >>> 0;
    const seeded = key !== "classic";
    return {
      wall: o.wall || (seeded ? ["surface2", "field2", "surface"][hsh % 3] : "surface2"),
      floor: o.floorFill || (seeded ? ["field2", "surface", "field"][(hsh >>> 3) % 3] : "field2"),
      pattern: seeded ? ({ none: "none", grain: "speckle", halftone: "dots", hatch: "planks", paper: "tiles" })[T().pick("texture")] : "none",
      side: o.side || (seeded ? ((hsh >>> 6) % 2 ? "left" : "right") : "right"),
      trim: T().pick("shape"),
    };
  };
  function floorPattern(g, W, H, fy, look, name) {
    const col = S().darken(S().c(look.floor), 0.18), lt = S().lighten(S().c(look.floor), 0.08), rng = Loom.rng("floor:" + name);
    if (look.pattern === "planks") for (let y = fy + 30, i = 0; y < H + 40; y += 36 + i * 6, i++) { svg("line", { x1: -OV, y1: f(y), x2: W + OV, y2: f(y), stroke: col, "stroke-width": 2 }, g); for (let x = -OV + (i % 2) * 140; x < W + OV; x += 280) svg("line", { x1: f(x), y1: f(y - 36 - i * 6 + 6), x2: f(x), y2: f(y), stroke: col, "stroke-width": 2 }, g); }
    else if (look.pattern === "tiles") { for (let i = -14; i <= 14; i++) svg("line", { x1: f(W / 2 + i * 90), y1: f(fy), x2: f(W / 2 + i * 300), y2: f(H + 40), stroke: col, "stroke-width": 1.6 }, g); for (let y = fy + 40, k = 1; y < H + 40; y += 30 * k, k += 0.6) svg("line", { x1: -OV, y1: f(y), x2: W + OV, y2: f(y), stroke: col, "stroke-width": 1.6 }, g); }
    else if (look.pattern === "dots") for (let y = fy + 20; y < H + 30; y += 26) for (let x = -OV; x < W + OV; x += 26) svg("circle", { cx: f(x + ((y / 26) % 2) * 13), cy: f(y), r: 2.4, fill: col }, g);
    else if (look.pattern === "speckle") for (let i = 0; i < 520; i++) svg("circle", { cx: f(-200 + rng() * (W + 400)), cy: f(fy + 6 + rng() * (H - fy)), r: f(1 + rng() * 2), fill: rng() > 0.5 ? col : lt }, g);
  }
  function trimOn(g, W, fy, look) {
    if (look.trim === "architectural") { plain(g, -OV, fy - 190, W + 2 * OV, 8, "surface"); for (let x = -OV; x < W + OV; x += 220) svg("rect", { x: f(x + 20), y: f(fy - 170), width: 180, height: 140, fill: "none", stroke: S().c("surface"), "stroke-width": 4 }, g); }
    else if (look.trim === "angular") for (let x = -OV; x < W + OV; x += 160) svg("path", { d: `M${f(x)} ${f(fy - 14)} l80 -60 l80 60`, fill: "none", stroke: S().c("surface"), "stroke-width": 4, opacity: 0.7 }, g);
    else if (look.trim === "organic") for (let x = -OV; x < W + OV; x += 240) svg("path", { d: `M${f(x)} ${f(fy - 60)} q60 -40 120 0 t120 0`, fill: "none", stroke: S().c("surface"), "stroke-width": 5, opacity: 0.7 }, g);
  }
  function wallAndFloor(g, W, H, fy, o, look, name) {
    look = look || { wall: o.wall || "surface2", floor: o.floorFill || "field2", pattern: "none", trim: "round" };
    plain(g, -OV, -OV, W + 2 * OV, fy + OV, look.wall);
    plain(g, -OV, fy, W + 2 * OV, H - fy + OV, look.floor);
    floorPattern(g, W, H, fy, look, name || "floor");
    trimOn(g, W, fy, look);
    svg("rect", { x: -OV, y: f(fy - 14), width: W + 2 * OV, height: 14, fill: S().c("surface") }, g);
    svg("line", { x1: -OV, y1: f(fy), x2: W + OV, y2: f(fy), stroke: S().c("line"), "stroke-width": 2, opacity: 0.6 }, g);
  }
  function windowOn(g, x, y, w, h, key, o) {
    fillBox(g, x - 12, y - 12, w + 24, h + 24, "surface", 10, key + "f");
    plain(g, x, y, w, h, "field");
    const rng = Loom.rng("sky:" + key), lit = S().material("window_lights", "accent2");   // night lights: materials.window_lights, else accent2 as before
    for (let i = 0; i < 6; i++) {   // a skyline through the window
      const bw = w / 6, bh = h * (0.25 + rng() * 0.45);
      plain(g, x + i * bw, y + h - bh, bw - 4, bh, "surface2", 0.9);
      if (o.night) for (let j = 0; j < 3; j++) if (rng() > 0.45) plain(g, x + i * bw + 8 + j * (bw - 16) / 3, y + h - bh + 12 + rng() * (bh - 30), 8, 10, lit, 0.85);
    }
    svg("line", { x1: f(x + w / 2), y1: f(y), x2: f(x + w / 2), y2: f(y + h), stroke: S().c("surface"), "stroke-width": 10 }, g);
  }
  function plant(g, x, floorY, h, key) {
    const rng = Loom.rng("plant:" + key);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.32 + (rng() - 0.5) * 0.2, L = h * (0.55 + rng() * 0.4);
      const ex = x + Math.cos(a) * L, ey = floorY - h * 0.35 + Math.sin(a) * L;
      svg("path", { d: `M${f(x)} ${f(floorY - h * 0.3)} Q${f((x + ex) / 2 + (rng() - 0.5) * 40)} ${f((floorY - h * 0.3 + ey) / 2)} ${f(ex)} ${f(ey)} Q${f((x + ex) / 2 + 24)} ${f((floorY - h * 0.3 + ey) / 2 + 10)} ${f(x)} ${f(floorY - h * 0.3)} Z`, fill: S().material("plant", null) ? (i % 2 ? hexOf(S().material("plant", null)) : S().darken(hexOf(S().material("plant", null)), 0.18)) : S().c(i % 2 ? "pos" : S().pack.palette.accent4 ? "accent4" : "pos"), opacity: 0.9 }, g);
    }
    fillBox(g, x - h * 0.16, floorY - h * 0.32, h * 0.32, h * 0.32, S().material("pot", "accent3"), 8, key + "pot");   // materials.pot (A4 proof)
  }
  function deskAt(g, x, floorY, w, key) {
    const top = floorY - 230, legs = S().darken(S().c("muted"), 0.35);
    svg("rect", { x: f(x + 24), y: f(top + 26), width: 18, height: 204, fill: legs }, g);
    svg("rect", { x: f(x + w - 42), y: f(top + 26), width: 18, height: 204, fill: legs }, g);
    fillBox(g, x + w - 220, top + 30, 170, 130, "surface", 8, key + "drawer");
    svg("rect", { x: f(x + w - 160), y: f(top + 88), width: 50, height: 8, rx: 4, fill: S().c("muted") }, g);
    fillBox(g, x, top, w, 30, "muted", 6, key + "top");
    return top;
  }

  /* ---------------- places ---------------- */
  P.officeFlat = function (ctx, name, o) {   // the first office (D-84), kept as the plain option (D-70)
    o = o || {};
    const R = frame(ctx, name, "office", o), W = R.W, H = R.H, fy = Math.round(H * (o.floor || 0.78)), L = R.layers;
    const look = P.look("office", name, o), right = look.side !== "left", dx = right ? 1060 : 160, dw = 700;
    wallAndFloor(L.far.g, W, H, fy, o, look, name);
    R.look = look;
    if (o.window !== false) windowOn(L.far.g, right ? 180 : 1340, 150, 400, 300, name + "w", o);
    // the wall carries objects that change per seed: a clock and a calendar, a shelf of folders
    O().shape(L.far.g, "clock", right ? 760 : 1160, 230, 120, { key: name + "clk", detail: 2, state: { time: o.time == null ? 9.25 : o.time }, shadow: false });
    O().shape(L.far.g, "calendar", right ? 1500 : 820, 250, 150, { key: name + "cal", detail: 2, state: { mark: o.calendarMark }, shadow: false });
    const sx = right ? 1240 : 380;
    plain(L.far.g, sx, 470, 420, 16, "surface");
    ["folder", "document", "folder"].forEach((k, i) => O().shape(L.far.g, k, sx + 70 + i * 140, 410, 100, { key: name + "sh" + i, detail: 1, shadow: false }));
    const top = deskAt(L.mid.g, dx, fy, dw, name + "desk");
    O().shape(L.mid.g, "laptop", dx + dw * 0.42, top - 70, 190, { key: name + "lap", detail: 3, state: { screen: o.screen || "chart" }, shadow: false });
    O().shape(L.mid.g, "document", dx + dw * 0.82, top - 40, 90, { key: name + "doc", detail: 2, shadow: false });
    plant(L.near.g, right ? 120 : 1800, H + 20, 300, name + "pl");
    R.floorY = fy;
    Object.assign(R.anchors, { desk: [dx + dw / 2, top], screen: [dx + dw * 0.42, top - 110], wall: [right ? 420 : 1500, 320], stand: [right ? dx - 120 : dx + dw + 120, fy],
      calendar: [right ? 1500 : 820, 250], clock: [right ? 760 : 1160, 230], shelf: [sx + 210, 410] });
    return R;
  };

  /* ---------------- the office, rebuilt from references (D-87) ----------------
   * Reference board: docs/references/places/office.md. What was taken (ideas, never drawings):
   *  - a ONE-POINT PERSPECTIVE room: back wall, two side walls and a ceiling receding to one vanishing point, so the
   *    room has depth before anything is in it;
   *  - furniture in 3/4: every desk and cabinet shows its front, its top and the side that faces away from the
   *    vanishing point; drawers have handles; chairs have a seat, a back, a gas lift and a five-star base;
   *  - a value plan: walls light-to-mid, wood mid and warm, chairs and screens dark, so the furniture reads on the walls;
   *  - one light: a window on one side throws pale light shapes on the floor and the back wall;
   *  - detail density: 3 to 6 parts per object (binders of different heights, a plant on the shelf, a clock, papers);
   *  - soft contact shadows under everything that stands on the floor. */
  function quad(g, pts, fill, op) { return svg("path", { d: "M" + pts.map((q) => f(q[0]) + " " + f(q[1])).join(" L") + " Z", fill, opacity: op }, g); }
  const hexOf = (t) => S().c(t);
  const tint = (t, p) => (p >= 0 ? S().lighten(hexOf(t), p) : S().darken(hexOf(t), -p));
  /** a box seen in 3/4 toward the vanishing point: front face, top face, one side face; returns the faces */
  function box3(g, x, y, w, h, d, vp, tone, o) {
    o = o || {};
    const cx = x + w / 2, side = cx < vp[0] ? "right" : "left";
    const ux = (vp[0] - cx), uy = (vp[1] - (y + h / 2)), L = Math.hypot(ux, uy) || 1, k = d / L;
    const dx = ux * k, dy = uy * k;   // the receding edge points to the vanishing point
    const top = [[x, y], [x + w, y], [x + w + dx, y + dy], [x + dx, y + dy]];
    const sx = side === "right" ? x + w : x;
    const sideF = [[sx, y], [sx + dx, y + dy], [sx + dx, y + h + dy], [sx, y + h]];
    if (o.shadow !== false) svg("ellipse", { cx: f(x + w / 2 + dx / 2), cy: f(y + h + 4), rx: f(w * 0.56), ry: f(Math.max(6, d * 0.45)), fill: hexOf("shadow"), opacity: 0.28 }, g);
    // a top is seen only when it is below the eye line (the receding edge then points up, dy < 0)
    quad(g, sideF, tint(tone, -0.18));
    quad(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], hexOf(tone));
    if (dy < 0) quad(g, top, tint(tone, 0.12));
    return { top, side: sideF, front: { x, y, w, h }, dx, dy };
  }
  function drawers(g, x, y, w, h, n, tone) {
    for (let i = 0; i < n; i++) {
      const dy = y + i * (h / n);
      svg("rect", { x: f(x + 6), y: f(dy + 6), width: f(w - 12), height: f(h / n - 10), rx: 3, fill: tint(tone, 0.06), stroke: tint(tone, -0.22), "stroke-width": 2 }, g);
      svg("rect", { x: f(x + w / 2 - 16), y: f(dy + h / n / 2 - 4), width: 32, height: 7, rx: 3.5, fill: tint(tone, -0.35) }, g);
    }
  }
  function chair(g, x, floorY, s, facing, tone) {
    // a task chair: five-star base with casters, gas lift, seat, backrest (facing: 1 = turned right, -1 = left)
    const base = svg("g", {}, g), c = hexOf(tone), dk = tint(tone, -0.3);
    svg("ellipse", { cx: f(x), cy: f(floorY + 2), rx: f(70 * s), ry: f(12 * s), fill: hexOf("shadow"), opacity: 0.28 }, base);
    [-1, -0.45, 0.2, 0.75, 1].forEach((a, i) => {
      const ex = x + a * 62 * s, ey = floorY - (i % 2 ? 4 : 12) * s;
      svg("line", { x1: f(x), y1: f(floorY - 26 * s), x2: f(ex), y2: f(ey), stroke: dk, "stroke-width": f(9 * s), "stroke-linecap": "round" }, base);
      svg("circle", { cx: f(ex), cy: f(ey + 5 * s), r: f(7 * s), fill: tint(tone, -0.45) }, base);
    });
    svg("rect", { x: f(x - 6 * s), y: f(floorY - 112 * s), width: f(12 * s), height: f(88 * s), rx: f(5 * s), fill: tint("muted", -0.3) }, base);
    const sw = 120 * s, sy = floorY - 128 * s;
    svg("path", { d: `M${f(x - sw / 2)} ${f(sy)} Q${f(x)} ${f(sy - 18 * s)} ${f(x + sw / 2)} ${f(sy)} L${f(x + sw / 2 - 6 * s)} ${f(sy + 22 * s)} L${f(x - sw / 2 + 6 * s)} ${f(sy + 22 * s)} Z`, fill: c }, base);
    const bx = x - facing * 44 * s, by = sy - 150 * s;
    svg("rect", { x: f(bx - 8 * s), y: f(by + 120 * s), width: f(16 * s), height: f(36 * s), fill: dk }, base);
    svg("path", { d: T().rr(bx - 52 * s, by, 104 * s, 132 * s, 26 * s), fill: c }, base);
    svg("path", { d: T().rr(bx - 40 * s, by + 14 * s, 80 * s, 70 * s, 18 * s), fill: tint(tone, 0.1) }, base);
    // armrest on the near side
    svg("path", { d: `M${f(x + facing * 48 * s)} ${f(sy + 4 * s)} V${f(sy - 44 * s)} H${f(x + facing * 14 * s)}`, fill: "none", stroke: dk, "stroke-width": f(9 * s), "stroke-linecap": "round", "stroke-linejoin": "round" }, base);
    return base;
  }
  function shelfUnit(g, x, y, w, h, vp, key) {
    const wood = S().material("wood", "accent"), F = box3(g, x, y, w, h, 34, vp, wood);
    const rows = 3, rh = (h - 28) / rows, rng = Loom.rng("shelf:" + key);
    for (let r = 0; r < rows; r++) {
      const ry = y + 14 + r * rh;
      svg("rect", { x: f(x + 14), y: f(ry), width: f(w - 28), height: f(rh - 12), fill: tint(wood, -0.35) }, g);
      // binders and books of different heights and tones; one row holds a plant
      if (r === 1 && rng() > 0.2) { plantPot(g, x + w * 0.72, ry + rh - 12, rh * 0.95, key + "p"); }
      let bx = x + 22; const lim = r === 1 ? x + w * 0.55 : x + w - 22;
      while (bx < lim - 18) {
        // the book tones: the pack's materials.books, else the mixed accents as before (one rng draw either way)
        const BK = S().materialList("books", ["accent4", "accent3", "surface", "accent2", "muted"]);
        const bw = 18 + rng() * 22, bh = (rh - 12) * (0.55 + rng() * 0.4), tone = BK[Math.floor(rng() * BK.length)];
        const lean = rng() > 0.85 ? 8 : 0;
        svg("path", { d: `M${f(bx)} ${f(ry + rh - 12)} L${f(bx + lean)} ${f(ry + rh - 12 - bh)} L${f(bx + lean + bw)} ${f(ry + rh - 12 - bh)} L${f(bx + bw)} ${f(ry + rh - 12)} Z`, fill: hexOf(tone) }, g);
        if (bw > 26) svg("rect", { x: f(bx + bw * 0.25 + lean / 2), y: f(ry + rh - 12 - bh * 0.7), width: f(bw * 0.5), height: f(bh * 0.18), rx: 2, fill: tint(tone, 0.35) }, g);
        bx += bw + 3 + (lean ? 6 : 0);
      }
    }
    return F;
  }
  function plantPot(g, x, baseY, h, key) {
    const rng = Loom.rng("pp:" + key);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.36 + (rng() - 0.5) * 0.2, L = h * (0.5 + rng() * 0.35);
      const sx = x, sy = baseY - h * 0.32, ex = sx + Math.cos(a) * L, ey = sy + Math.sin(a) * L;
      // leaves: the pack's materials.plant (two shades of it), else pos and accent4 as before
      const pl = S().material("plant", null), leaf = pl ? (i % 2 ? hexOf(pl) : S().darken(hexOf(pl), 0.18)) : hexOf(i % 2 ? "pos" : "accent4");
      svg("path", { d: `M${f(sx)} ${f(sy)} Q${f((sx + ex) / 2 - 18)} ${f((sy + ey) / 2)} ${f(ex)} ${f(ey)} Q${f((sx + ex) / 2 + 16)} ${f((sy + ey) / 2 + 4)} ${f(sx)} ${f(sy)} Z`, fill: leaf }, g);
    }
    // the pot: the pack's materials.pot, else accent3 as before (glow-flat's accent3 is the alarm pink, A4 proof 2026-10-08)
    svg("path", { d: `M${f(x - h * 0.2)} ${f(baseY - h * 0.34)} H${f(x + h * 0.2)} L${f(x + h * 0.15)} ${f(baseY)} H${f(x - h * 0.15)} Z`, fill: hexOf(S().material("pot", "accent3")) }, g);
  }
  function deskSet(g, x, floorY, w, vp, key, o) {
    // a desk in 3/4 with a drawer pedestal, a screen or laptop, a keyboard, papers; returns the screen anchor
    const s = o.scale || 1, wood = S().material("wood", "accent"), topY = floorY - 250 * s, k = key;
    const P1 = box3(g, x + w - 230 * s, topY + 34 * s, 210 * s, 216 * s, 46 * s, vp, wood);
    drawers(g, P1.front.x, P1.front.y, P1.front.w, P1.front.h, 3, wood);
    svg("rect", { x: f(x + 26 * s), y: f(topY + 34 * s), width: f(18 * s), height: f(216 * s), fill: tint(wood, -0.25) }, g);
    const D = box3(g, x, topY, w, 34 * s, 74 * s, vp, wood, { shadow: false });
    const tcx = x + w * 0.42 + D.dx * 0.5, tcy = topY + D.dy * 0.5;
    const scr = O().shape(g, "laptop", tcx, tcy - 74 * s, 190 * s, { key: k + "lap", family: o.screenFamily, detail: s > 0.8 ? 3 : 2, state: { screen: o.screen || "chart", facing: o.facing }, shadow: false });
    svg("path", { d: `M${f(tcx - 110 * s)} ${f(tcy + 6 * s)} h${f(150 * s)} l${f(-14 * s)} ${f(14 * s)} h${f(-150 * s)} Z`, fill: tint("ink", -0.15), opacity: 0.85 }, g);   // keyboard
    O().shape(g, "document", x + w * 0.82 + D.dx * 0.4, tcy - 22 * s, 74 * s, { key: k + "doc", detail: 2, shadow: false });
    void scr;
    return { screen: [tcx, tcy - 110 * s], top: [tcx, tcy], seat: [x + w * 0.35, floorY] };
  }
  P.office = function (ctx, name, o) {
    o = o || {};
    if (o.look === "flat") return P.officeFlat(ctx, name, o);
    const R = frame(ctx, name, "office", o), W = R.W, H = R.H, L = R.layers;
    const look = P.look("office", name, o), right = look.side !== "left";
    const vp = [o.vpx || (right ? 880 : 1040), o.vpy || 470];
    const bw = { x0: 400, x1: 1520, y0: 150, y1: 700 };   // the back wall
    const g = L.far.g, OVv = 700;
    // the room shell: ceiling, side walls, floor, back wall (each tone a step apart in value)
    quad(g, [[-OVv, -OVv], [W + OVv, -OVv], [bw.x1 + (bw.x1 - vp[0]) * 0.0, bw.y0], [bw.x0, bw.y0]], tint(look.wall, 0.16));
    quad(g, [[-OVv, -OVv], [bw.x0, bw.y0], [bw.x0, bw.y1], [-OVv, H + OVv]], tint(look.wall, -0.1));
    quad(g, [[W + OVv, -OVv], [bw.x1, bw.y0], [bw.x1, bw.y1], [W + OVv, H + OVv]], tint(look.wall, -0.14));
    quad(g, [[bw.x0, bw.y1], [bw.x1, bw.y1], [W + OVv, H + OVv], [-OVv, H + OVv]], hexOf(look.floor));
    quad(g, [[bw.x0, bw.y0], [bw.x1, bw.y0], [bw.x1, bw.y1], [bw.x0, bw.y1]], hexOf(look.wall));
    // ceiling tile lines converge to the vanishing point
    for (let i = -6; i <= 6; i++) { const bx = bw.x0 + (bw.x1 - bw.x0) * (i + 6) / 12; svg("line", { x1: f(bx), y1: bw.y0, x2: f(vp[0] + (bx - vp[0]) * 4), y2: f(vp[1] + (bw.y0 - vp[1]) * 4), stroke: tint(look.wall, 0.05), "stroke-width": 2 }, g); }
    [0.45, 0.75].forEach((q) => { const yy = bw.y0 - (bw.y0 + OVv) * q * 0.25; svg("line", { x1: -OVv, y1: f(yy - 40 * q), x2: W + OVv, y2: f(yy - 40 * q), stroke: tint(look.wall, 0.05), "stroke-width": 2 }, g); });
    // floor seams converge too; the seed's floor pattern sits on top
    for (let i = -8; i <= 8; i++) { const bx = bw.x0 + (bw.x1 - bw.x0) * (i + 8) / 16; svg("line", { x1: f(bx), y1: bw.y1, x2: f(vp[0] + (bx - vp[0]) * 3.2), y2: f(vp[1] + (bw.y1 - vp[1]) * 3.2), stroke: tint(look.floor, -0.12), "stroke-width": 1.6, opacity: 0.6 }, g); }
    svg("rect", { x: bw.x0, y: f(bw.y1 - 16), width: bw.x1 - bw.x0, height: 16, fill: tint(look.wall, -0.2) }, g);   // skirting
    // the window on one side wall, with its light falling on the floor and the back wall
    const wx = right ? [-OVv * 0.1, bw.x0 - 60] : [bw.x1 + 60, W + OVv * 0.1];
    const wsx = right ? wx[0] : wx[1], wex = right ? wx[1] : wx[0];
    const yAt = (x, y) => vp[1] + (y - vp[1]) * ((x - vp[0]) / ((right ? bw.x0 : bw.x1) - vp[0]));
    const win = [[wsx, yAt(wsx, 230)], [wex, yAt(wex, 230)], [wex, yAt(wex, 560)], [wsx, yAt(wsx, 560)]];
    quad(g, win.map(([x, y], i) => [x + (i === 0 || i === 3 ? -14 : 14) * (right ? 1 : -1), y + (i < 2 ? -14 : 14)]), tint("surface", 0.25));
    quad(g, win, hexOf("field"));
    const rng = Loom.rng("sky:" + name);
    for (let i = 0; i < 5; i++) { const t0 = i / 5, t1 = (i + 0.8) / 5, bh = 0.3 + rng() * 0.45, xa = wsx + (wex - wsx) * t0, xb = wsx + (wex - wsx) * t1; quad(g, [[xa, yAt(xa, 560 - 330 * bh)], [xb, yAt(xb, 560 - 330 * bh)], [xb, yAt(xb, 560)], [xa, yAt(xa, 560)]], tint("surface2", 0.06), 0.9); }
    const mid = (wsx + wex) / 2; svg("line", { x1: f(mid), y1: f(yAt(mid, 230)), x2: f(mid), y2: f(yAt(mid, 560)), stroke: tint("surface", 0.25), "stroke-width": 12 }, g);
    const LT = right ? 1 : -1;
    quad(g, [[wex, yAt(wex, 560)], [wsx, yAt(wsx, 560)], [wsx + LT * 560, H + 80], [wex + LT * 260, bw.y1 + 40]], "#FFFFFF", 0.07);
    quad(g, [[wex + LT * 120, bw.y0 + 120], [wex + LT * 300, bw.y0 + 120], [wex + LT * 420, bw.y1], [wex + LT * 180, bw.y1]], "#FFFFFF", 0.05);
    // the back wall carries a shelf of binders, a clock and a calendar
    // composition (from the board): the tall shelf anchors the side of the back wall nearer the window, the clock and
    // calendar sit in the open wall between, a smaller desk recedes on the far side, the hero desk comes forward
    const shx = right ? 560 : 1060, clk = right ? 1010 : 900, cal = right ? 1220 : 690;
    shelfUnit(g, shx, 320, 300, 380, vp, name + "sh");
    O().shape(g, "clock", clk, 250, 110, { key: name + "clk", detail: 3, state: { time: o.time == null ? 9.25 : o.time }, shadow: "wall" });
    O().shape(g, "calendar", cal, 300, 130, { key: name + "cal", detail: 2, state: { mark: o.calendarMark }, shadow: "wall" });
    // a second desk further back (smaller), its chair, then the hero desk and chair in front
    deskSet(L.mid.g, right ? 1130 : 420, 790, 360, vp, name + "d2", { screen: "text", scale: 0.7 });
    chair(L.mid.g, right ? 1260 : 560, 800, 0.62, right ? -1 : 1, "surface2");
    const dk = deskSet(L.mid.g, right ? 900 : 260, 1000, 760, vp, name + "d1", o);
    chair(L.mid.g, right ? 1040 : 840, 1050, 1.0, right ? -1 : 1, "surface2");
    // near layer: a plant and the edge of a filing cabinet, partly out of frame, darker (depth)
    plantPot(L.near.g, right ? 150 : 1770, H + 30, 420, name + "np");
    svg("ellipse", { cx: right ? 150 : 1770, cy: H + 34, rx: 120, ry: 18, fill: hexOf("shadow"), opacity: 0.3 }, L.near.g);
    R.floorY = 1000; R.look = look; R.vp = vp;
    Object.assign(R.anchors, { desk: dk.top, screen: dk.screen, wall: [clk, 420], stand: [right ? 560 : 1360, 1000],
      calendar: [cal, 300], clock: [clk, 250], shelf: [shx + 150, 420], window: [mid, yAt(mid, 400)] });
    return R;
  };

  P.inside = function (ctx, name, o) {
    o = o || {};
    const R = frame(ctx, name, "inside", o), W = R.W, H = R.H, L = R.layers, rng = Loom.rng("inside:" + name + T().seedKey());
    const G = Loom.glow;
    plain(L.far.g, -OV, -OV, W + 2 * OV, H + 2 * OV, "field");
    for (let i = 0; i < 9; i++) {   // the walls of a living space, in soft organic masses
      const cx = (i % 3) * 760 + rng() * 300, cy = Math.floor(i / 3) * 420 + rng() * 200, r = 260 + rng() * 220;
      svg("path", { d: G.blobPath(cx, cy, r, { lobes: 7, seed: name + i, wobble: 0.2 }), fill: S().c(["surface2", "field2", "surface"][i % 3]), opacity: 0.7 }, L.far.g);
    }
    // a vessel crossing the frame, with cells that travel along it
    // the vessel: the scene's o.vessel, else the pack's materials.vessel, else accent3 as before; its cells: the pack's
    // materials.cells (a list: the first token for most cells, the second for every third), else accent and accent2
    const vy = H * (o.vesselY || 0.55), path = `M-100 ${f(vy + 80)} C 400 ${f(vy - 160)}, 1100 ${f(vy + 220)}, 2020 ${f(vy - 60)}`;
    const vt = o.vessel || S().material("vessel", "accent3"), CL = S().materialList("cells", ["accent", "accent2"]);
    svg("path", { d: path, fill: "none", stroke: S().c(vt), "stroke-width": 190, "stroke-linecap": "round", opacity: 0.55 }, L.mid.g);
    svg("path", { d: path, fill: "none", stroke: S().lighten(S().c(vt), 0.25), "stroke-width": 120, "stroke-linecap": "round", opacity: 0.5 }, L.mid.g);
    const pe = svg("path", { d: path, fill: "none", stroke: "none" }, L.mid.g);
    const n = o.cells || 9, cells = [];
    for (let i = 0; i < n; i++) {
      const cg = svg("g", {}, L.mid.g), r = 22 + rng() * 16, ct = i % 3 ? CL[0] : CL[1 % CL.length];
      T().body(cg, `M${-r} 0 a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`, ct, { x: -r, y: -r, w: 2 * r, h: 2 * r });
      svg("circle", { cx: f(r * 0.15), cy: f(-r * 0.1), r: f(r * 0.32), fill: S().darken(S().c(ct), 0.3) }, cg);
      cells.push({ g: cg, off: i / n, dy: (rng() - 0.5) * 70 });
    }
    const t0 = o.t0 || 0, t1 = o.t1 || (ctx.end || 8), speed = o.speed || 0.08;
    const place = (p) => {
      let len = 2400; try { len = pe.getTotalLength(); } catch (e) { /* the preview has no length: estimate */ }
      for (const c of cells) {
        const q = (c.off + p) % 1;
        let pt = { x: -100 + q * 2120, y: vy + Math.sin(q * 6.283) * 120 };
        try { if (pe.getPointAtLength) { const a = pe.getPointAtLength(q * len); pt = { x: a.x, y: a.y }; } } catch (e) { /* estimate */ }
        c.g.setAttribute("transform", `translate(${f(pt.x)} ${f(pt.y + c.dy)})`);
      }
    };
    place(0);
    Loom.drive((p, raw) => place(raw * speed * (t1 - t0)), t0, Math.max(0.1, t1 - t0), "linear", { kind: "ambient", beat: Loom.ctxBeat && Loom.ctxBeat.id, name });
    // near: dark organic masses at the edges frame the view, like looking through tissue
    [[-60, -40, 340], [W + 40, H + 30, 420], [W + 60, -80, 260]].forEach(([x, y, r], i) =>
      svg("path", { d: G.blobPath(x, y, r, { lobes: 6, seed: name + "n" + i, wobble: 0.22 }), fill: S().darken(S().c("field"), 0.35), opacity: 0.85 }, L.near.g));
    Object.assign(R.anchors, { focus: [W / 2, vy], vessel: [W * 0.55, vy + 40], wall: [W * 0.2, H * 0.25] });
    return R;
  };

  P.server = function (ctx, name, o) {
    o = o || {};
    const R = frame(ctx, name, "server", o), W = R.W, H = R.H, fy = Math.round(H * 0.8), L = R.layers;
    plain(L.far.g, -OV, -OV, W + 2 * OV, fy + OV, "field2");
    plain(L.far.g, -OV, fy, W + 2 * OV, H - fy + OV, "surface2");
    for (let i = -12; i <= 12; i++) svg("line", { x1: f(W / 2 + i * 60), y1: fy, x2: f(W / 2 + i * 260), y2: H, stroke: S().c("line"), "stroke-width": 1.5, opacity: 0.25 }, L.far.g);
    const leds = [];
    // the rack LEDs and the tray's cables: the pack's materials.leds and materials.cables (lists, cycled), else the
    // mixed accents as before
    const LED = S().materialList("leds", ["pos", "accent2", "accent4"]), CB = S().materialList("cables", ["accent", "accent3", "accent4", "line", "accent2"]);
    const rack = (g, x, y, w, h, key, big) => {
      fillBox(g, x, y, w, h, "surface", 8, key);
      const slots = big ? 9 : 7;
      for (let j = 0; j < slots; j++) {
        const sy = y + 20 + j * (h - 40) / slots;
        plain(g, x + 14, sy, w - 28, (h - 40) / slots - 8, "surface2");
        for (let k = 0; k < 3; k++) { const d = svg("circle", { cx: f(x + w - 30 - k * 16), cy: f(sy + ((h - 40) / slots - 8) / 2), r: big ? 4.5 : 3.2, fill: S().c(LED[k % LED.length]) }, g); leds.push(d); }
      }
    };
    for (let i = -2; i < 10; i++) rack(L.far.g, 80 + i * 260, 200, 200, fy - 200, name + "r" + i, false);
    rack(L.mid.g, o.side === "left" ? 140 : 1260, 120, 300, fy - 60, name + "m0", true);
    // cables from a tray above
    plain(L.mid.g, 0, 70, W, 26, "surface");
    for (let i = 0; i < 5; i++) svg("path", { d: `M${f(300 + i * 280)} 96 q 60 ${f(120 + i * 18)} ${f(140)} 0`, fill: "none", stroke: S().c(CB[i % CB.length]), "stroke-width": 7, "stroke-linecap": "round" }, L.mid.g);
    fillBox(L.near.g, o.side === "left" ? 1750 : -120, 0, 300, H, "shadow", 0, name + "edge");
    const t0 = o.t0 || 0, t1 = o.t1 || (ctx.end || 8);
    Loom.drive((p, raw) => {   // LEDs blink on a seeded pattern: a pure function of time
      const tick = Math.floor((t0 + raw * (t1 - t0)) * 4);
      leds.forEach((d, i) => d.setAttribute("opacity", (Loom.hash(name + ":" + i + ":" + tick) % 5) ? 1 : 0.15));
    }, t0, Math.max(0.1, t1 - t0), "linear", { kind: "ambient", beat: Loom.ctxBeat && Loom.ctxBeat.id, name });
    R.floorY = fy;
    Object.assign(R.anchors, { rack: [o.side === "left" ? 290 : 1410, fy / 2], row: [W / 2, fy / 2], stand: [o.side === "left" ? 620 : 1000, fy] });
    return R;
  };

  P.meeting = function (ctx, name, o) {
    o = o || {};
    const R = frame(ctx, name, "meeting", o), W = R.W, H = R.H, fy = Math.round(H * 0.62), L = R.layers;
    const look = P.look("meeting", name, o);
    wallAndFloor(L.far.g, W, H, fy, o, look, name);
    R.look = look;
    fillBox(L.far.g, 660, 110, 600, 340, "ink", 10, name + "scr");
    plain(L.far.g, 680, 130, 560, 300, "field2");
    // the wall chart: the pack's materials.chart (a list: the first token for the bars, the second for the last one),
    // else accent4 bars and an accent2 last bar as before
    const CH = S().materialList("chart", ["accent4", "accent2"]);
    [0.35, 0.55, 0.45, 0.8].forEach((v, i) => fillBox(L.far.g, 740 + i * 120, 410 - v * 240, 70, v * 240, i === 3 ? CH[1 % CH.length] : CH[0], 6, name + "b" + i));
    if (o.window !== false) windowOn(L.far.g, 120, 120, 360, 300, name + "w", o);
    // a table in perspective with chairs and objects on it
    const tt = fy + 110, tb = fy + 300;
    T().body(L.mid.g, `M600 ${tt} H1320 L1560 ${tb} H360 Z`, "surface", { x: 360, y: tt, w: 1200, h: tb - tt });
    svg("rect", { x: 360, y: tb, width: 1200, height: 22, fill: S().darken(S().c("surface"), 0.25) }, L.mid.g);
    [[520, tt - 10], [760, tt - 50], [1160, tt - 50], [1400, tt - 10]].forEach(([x, y], i) => {   // chairs: a back and a seat
      fillBox(L.mid.g, x - 46, y - 150, 92, 120, S().material("chair", "accent"), 22, name + "cb" + i);
      fillBox(L.mid.g, x - 58, y - 40, 116, 34, S().material("chair", "accent"), 14, name + "cs" + i);
    });
    O().shape(L.mid.g, "laptop", 900, tt + 40, 140, { key: name + "lap", detail: 2, shadow: false });
    O().shape(L.mid.g, "document", 1150, tt + 70, 80, { key: name + "d1", detail: 1, shadow: false });
    O().shape(L.mid.g, "document", 700, tt + 80, 80, { key: name + "d2", detail: 1, shadow: false });
    [[300, H + 60], [1640, H + 80]].forEach(([x, y], i) => fillBox(L.near.g, x - 150, y - 360, 300, 380, "shadow", 60, name + "nc" + i));
    R.floorY = fy;
    Object.assign(R.anchors, { screen: [960, 280], table: [960, tt + 60], seatL: [520, tt - 10], seatR: [1400, tt - 10] });
    return R;
  };

  P.warehouse = function (ctx, name, o) {
    o = o || {};
    const R = frame(ctx, name, "warehouse", o), W = R.W, H = R.H, fy = Math.round(H * 0.76), L = R.layers, rng = Loom.rng("wh:" + name);
    const look = P.look("warehouse", name, Object.assign({ wall: T().seed() ? undefined : "field2", floorFill: T().seed() ? undefined : "surface2" }, o));
    wallAndFloor(L.far.g, W, H, fy, o, look, name);
    R.look = look;
    for (let i = -1; i < 6; i++) plain(L.far.g, 160 + i * 440, 40, 300, 80, "field", 0.8);   // high windows
    for (let s = -1; s < 5; s++) {   // tall shelving with packages (past the frame, for a pan)
      const sx = 120 + s * 600, sw = 520;
      plain(L.far.g, sx, 170, 14, fy - 170, "line"); plain(L.far.g, sx + sw, 170, 14, fy - 170, "line");
      for (let r = 0; r < 3; r++) {
        const sy = 300 + r * ((fy - 300) / 3);
        plain(L.far.g, sx, sy, sw + 14, 12, S().material("wood", "accent"));
        for (let b = 0; b < 3; b++) if (rng() > 0.2) O().shape(L.far.g, "package", sx + 90 + b * 170, sy - 50, 110, { key: name + s + r + b, detail: 1, shadow: false });
      }
    }
    const SL = S().material("safety_line", "accent2");   // the safety line's stripes: materials.safety_line, else accent2 as before
    for (let i = -6; i < 22; i++) svg("path", { d: `M${f(i * 130)} ${f(fy + 70)} l60 0 l-30 26 l-60 0 Z`, fill: S().c(i % 2 ? SL : "shadow") }, L.mid.g);   // a safety line
    O().shape(L.mid.g, "package", 1240, fy - 60, 170, { key: name + "p1", detail: 3 });
    O().shape(L.mid.g, "package", 1430, fy - 60, 170, { key: name + "p2", detail: 2 });
    O().shape(L.mid.g, "package", 1335, fy - 210, 160, { key: name + "p3", detail: 2 });
    O().shape(L.near.g, "package", 120, H - 60, 320, { key: name + "near", detail: 2, shadow: false });
    R.floorY = fy;
    Object.assign(R.anchors, { pallet: [1335, fy - 120], shelf: [380, 400], stand: [900, fy] });
    return R;
  };
  P.KINDS = ["office", "inside", "server", "meeting", "warehouse"];

  /* ---------------- the camera inside a scene ----------------
   * ONE driver per place spans the whole beat and computes the camera from the list of moves as a pure function
   * of time, so seeking anywhere gives the same frame and later moves never overwrite earlier ones at load. */
  function camAt(R, t) {
    let st = { s: 1, dx: 0, dy: 0, fx: R.W / 2, fy: R.H / 2 };
    for (const m of R.cams) {
      if (t <= m.t0) break;
      const fin = m.kind === "pan" ? Object.assign({}, st, { dx: st.dx + m.dx, dy: st.dy + m.dy }) : Object.assign({}, st, { fx: m.to[0], fy: m.to[1], s: m.scale });
      if (t >= m.t1) { st = fin; continue; }
      const p = m.ease((t - m.t0) / (m.t1 - m.t0));
      st = { s: st.s + (fin.s - st.s) * p, dx: st.dx + (fin.dx - st.dx) * p, dy: st.dy + (fin.dy - st.dy) * p, fx: st.fx + (fin.fx - st.fx) * p, fy: st.fy + (fin.fy - st.fy) * p };
    }
    return st;
  }
  function applyCam(R, c) {
    for (const nm in R.layers) {
      const Lr = R.layers[nm], k = 1 + (c.s - 1) * Lr.depth;
      Lr.cam.setAttribute("transform", `translate(${f(c.fx + c.dx * Lr.depth)} ${f(c.fy + c.dy * Lr.depth)}) scale(${Math.round(k * 1000) / 1000}) translate(${f(-c.fx)} ${f(-c.fy)})`);
    }
  }
  function rig(R) {
    if (R.rigged) return;
    R.rigged = true;
    const t0 = R.ctx.start || 0, t1 = (R.ctx.end || t0 + 10) + 1.5;
    applyCam(R, camAt(R, t0));
    Loom.drive((p, raw) => applyCam(R, camAt(R, t0 + raw * (t1 - t0))), t0, t1 - t0, "linear", { kind: "ambient", beat: R.E.beat, name: R.E.name + ".camera" });
  }
  function addMove(R, m) {
    if (!(m.t1 > m.t0)) { Loom.error("camera_bad_time", `${R.E.name}: a camera move needs t1 > t0`); return m.t0; }
    const last = R.cams[R.cams.length - 1];
    if (last && m.t0 < last.t1) Loom.warn("camera_overlap", `${R.E.name}: a camera move starts before the previous one ends; they run one after the other`);
    m.ease = Loom.ease[m.easeName] || Loom.ease.move || ((x) => x);
    R.cams.push(m);
    Loom.report.tweens.push({ t0: +m.t0.toFixed(3), t1: +m.t1.toFixed(3), kind: "camera", beat: R.E.beat, name: R.E.name, content: false });
    rig(R);
    return m.t1;
  }
  /** push toward a point: the scale grows to `scale` between t0 and t1; far moves least, near most (parallax) */
  C.push = function (R, o) {
    o = o || {};
    const t0 = o.t0 || 0;
    return addMove(R, { kind: "push", to: o.to || [R.W / 2, R.H / 2], scale: o.scale || 1.5, t0, t1: o.t1 || t0 + 2.5, easeName: o.ease || "editorial" });
  };
  /** pan: the layers slide by (dx, dy), each by its depth (the near layer moves furthest) */
  C.pan = function (R, o) {
    o = o || {};
    const t0 = o.t0 || 0;
    return addMove(R, { kind: "pan", dx: o.dx || 0, dy: o.dy || 0, t0, t1: o.t1 || t0 + 2.5, easeName: o.ease || "editorial" });
  };
  /** back out to the whole place */
  C.pull = function (R, o) { o = o || {}; return C.push(R, Object.assign({}, o, { to: o.to || [R.W / 2, R.H / 2], scale: o.scale || 1 })); };
  C.at = camAt;

  /** Loom.cam.frame(E, rect, t, dur, {margin, ease, name}) -> end time. A camera on ONE element (a desk, a board, a
   *  page) rather than a place: move E's mover so `rect` (E-local coordinates) fills the frame with a margin, from
   *  wherever the last frame() or tween left it (E.__pos {x, y, s}). Chain it across held beats to follow the work
   *  line by line, then frame the whole thing to pull back (D-100: step 7 held one top-down framing for 36 s with
   *  the writing small). rect "all" frames the element's own box. */
  C.frame = function (E, rect, t, dur, o) {
    o = o || {};
    const r = rect === "all" || !rect ? { x: 0, y: 0, w: E.w || 1920, h: E.h || 1080 } : rect;
    const m = o.margin == null ? 60 : o.margin;
    const s = Math.min(o.maxScale || 3, 1920 / (r.w + 2 * m), 1080 / (r.h + 2 * m));
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const to = { x: (o.cx || 960) - s * cx, y: (o.cy || 540) - s * cy, s };
    const cur = E.__pos || { x: 0, y: 0, s: 1 };
    Loom.tween(E.mover, { x: cur.x, y: cur.y, scale: cur.s, transformOrigin: "0 0" }, { x: to.x, y: to.y, scale: to.s, duration: dur, ease: Loom.ease[o.ease || "editorial"] || Loom.ease.editorial },
      t, { kind: "camera", beat: (Loom.ctxBeat && Loom.ctxBeat.id) || E.beat, name: o.name || `${E.name}.frame`, content: false });
    E.__pos = to;
    return t + dur;
  };
})();
