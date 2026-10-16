/* Hologram engine (2026-10-16): a calm operations HUD projected in light, for corporate lessons (security operations, AI
 * systems, data and analytics, digital twins and monitoring, network and cloud operations, future-of-work briefings).
 *
 * Learned from lemo-opuscar's hologram-hud style (depth layers, dark plates under words, a target lock that snaps, rolling
 * values, power-down) and from the practice of film UI and real operations screens (docs/research/2026-10-16-style-
 * hologram.md): every screen has one read (Coleran), every word is a story point (Hansen), nothing moves that carries no
 * information (Noessel's "fuigetry"), colour only for the abnormal (high-performance HMI), severity told twice (SOC
 * practice), at most three flashes in any second (WCAG 2.3.1). Rebuilt for Loom, nothing copied.
 *
 *   const W = ctx.engine, H = W.hud(ctx);                       // once per scene: layers, camera, one clock, the flash ledger
 *   H.title("head", { x: 120, y: 96, w: 1100, h: 150, kicker: "Incident 0412", text: "Who touched the payroll server?", at: 0.4 });
 *   const P = H.panel("signals", { x: 120, y: 300, w: 620, h: 420, title: "Signals",
 *                                  rows: [["Failed logins", "312"], ["New admin", "1", "warn"]], at: ctx.cue("signals") });
 *   const M = H.mesh("net", { x: 820, y: 280, w: 980, h: 520, depth: "mid", nodes: [...], links: [...], at: 3.0 });
 *   const L = H.lock(M.node("db"), { at: ctx.cue("the database"), label: "payroll-db", tone: "alert" });
 *   H.push({ to: [1310, 540], scale: 1.4, t0: 9.0, t1: 10.6 });      // the place camera, with parallax by depth
 *
 * Every piece is an element made with ctx.el inside one of the HUD's three depth layers (far, mid, near), so held parts,
 * joins, the camera, the layout checks and restyles keep working. Words are kit.text on a dark plate (real metrics, read by
 * the checks). Colours are pack tokens; status names map to them: info = accent (cyan), warn = accent2 (amber), alert =
 * accent3 (red), ok = accent4 (green), idle = muted. Every continuous motion (a scroll, a sweep, a spin, traffic, a wave, a
 * lock closing, the camera's orbit) is a pure function of time inside a window, computed by ONE clock for the page.
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const K = () => Loom.kit;
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
  const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const outCubic = (u) => { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); };
  const inOut = (u) => { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };

  // ---------------------------------------------------------------- configuration from the pack (data, not code)
  const DEF = {
    glow: true, halo: 0.22, halo_width: 3.2, blur: 2.4, flash_per_second: 3,
    depth: { far: { z: 0.35, line: 0.5, plate: 0.55, stroke: 0.8 }, mid: { z: 0.7, line: 0.8, plate: 0.8, stroke: 1.0 }, near: { z: 1.15, line: 1.0, plate: 0.92, stroke: 1.2 } },
  };
  const cfg = () => {
    const p = (S().pack && S().pack.hologram) || {};
    return Object.assign({}, DEF, p, { depth: Object.assign({}, DEF.depth, p.depth || {}) });
  };
  const baseStroke = () => ((S().pack && S().pack.shape && S().pack.shape.stroke) || 2);

  // ---------------------------------------------------------------- status: a tone and its word (severity told twice)
  const STATUS = { info: "accent", warn: "accent2", alert: "accent3", ok: "accent4", idle: "muted", crit: "accent3" };
  const WORD = { info: "INFO", warn: "WARN", alert: "ALERT", ok: "OK", idle: "IDLE", crit: "CRITICAL" };
  const tok = (t) => (t && STATUS[t]) || t || "accent";
  const col = (t) => S().c(tok(t));
  const wordOf = (t) => WORD[t] || null;
  // a tag slot wide enough for its word at the caption's largest size with its tracking
  const tagSlot = (word) => Math.max(116, K().measure(String(word), "caption", 24, 700, "0.08em") + 64);
  // the gap between a value and its unit: a space ("0.41 s", "1.8 k/s"), none before %, degrees or a per-unit ("5.8%", "12/m")
  const unitSep = (unit, sep) => (sep != null ? sep : !unit || /^[%°/]/.test(unit) ? "" : " ");

  // ---------------------------------------------------------------- one clock for the page (every continuous piece)
  // Each updater is a pure function of t. One Loom.clock callback walks them; an updater remembers what it last wrote and
  // skips the DOM when nothing changed, so a resting HUD costs nothing per frame.
  const UP = [];
  let clockOn = false;
  function onClock(fn) {
    UP.push(fn);
    if (clockOn) return;
    clockOn = true;
    const run = (t) => { for (const f of UP) f(t); };
    if (Loom.clock) Loom.clock(run);
    else {                                           // no film clock (an old build): one long drive runs it
      const proxy = { v: 0 };
      Loom.tween(proxy, { v: 0 }, { v: 1, duration: 3600, ease: "none", onUpdate() { run(proxy.v * 3600); } }, 0, { kind: "performer", name: "holo_clock", content: false });
    }
  }
  // what a clock-driven motion did, for the report (the checks read report.tweens for motion and holds)
  const note = (t0, t1, kind, name, content) => Loom.report.tweens.push({ t0: +(+t0).toFixed(3), t1: +(+t1).toFixed(3), kind, beat: Loom.ctxBeat && Loom.ctxBeat.id, name, content: !!content });
  const setA = (n, k, v) => { if (n.__hv === undefined) n.__hv = {}; if (n.__hv[k] !== v) { n.__hv[k] = v; n.setAttribute(k, v); } };

  // ---------------------------------------------------------------- the flash ledger (WCAG 2.3.1), one for the film
  const FLASHES = [];
  function flashSlot(t, what) {
    const max = Math.max(1, cfg().flash_per_second | 0);
    let u = t, moved = false;
    for (let k = 0; k < 200; k++) {
      const n = FLASHES.filter((f) => f >= u - 1.001 && f <= u + 1.001).length;   // any closed 1 s window that holds u
      if (n < max) break;
      u += 0.1; moved = true;
    }
    if (moved) Loom.warn("holo_flash_rate", `${what}: a flash at ${t.toFixed(2)}s would make more than ${max} in one second; moved to ${u.toFixed(2)}s (WCAG 2.3.1)`);
    FLASHES.push(u); FLASHES.sort((a, b) => a - b);
    return u;
  }

  // ---------------------------------------------------------------- drawing helpers
  const tspanOf = (t) => Array.from(t.childNodes || t.children || []).find((n) => n.tagName === "tspan") || t;
  const dpath = (pts, closed) => "M" + pts.map((p) => f1(p[0]) + "," + f1(p[1])).join(" L") + (closed ? " Z" : "");
  const plen = (pts, closed) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (closed && pts.length > 1) L += Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]); return L; };
  const brackets = (x, y, w, h, c) => [
    [[x, y + c], [x, y], [x + c, y]], [[x + w - c, y], [x + w, y], [x + w, y + c]],
    [[x + w, y + h - c], [x + w, y + h], [x + w - c, y + h]], [[x + c, y + h], [x, y + h], [x, y + h - c]]];

  // ---------------------------------------------------------------- the hero models (2026-10-16, the wow pass)
  // CAD-like wireframes built from rings, boxes with face grids, tubes and longitudinal lines, every part connected.
  // Model units: the object stands on y = 0, y up, z toward the viewer. A model is a list of parts {id, label, ex, s}:
  // ex is the part's exploded-view offset (at explode 1), s the flat list of segments [x1, y1, z1, x2, y2, z2, ...].
  // Pure data from code: no randomness, so every frame is the same function of time.
  function Mdl() {
    const parts = [];
    let cur = null;
    const A = {
      parts,
      part(id, label, ex) { cur = { id, label: label || id, ex: ex || [0, 0, 0], s: [] }; parts.push(cur); return A; },
      seg(a, b) { cur.s.push(a[0], a[1], a[2], b[0], b[1], b[2]); return A; },
      poly(pts, closed) { for (let i = 1; i < pts.length; i++) A.seg(pts[i - 1], pts[i]); if (closed && pts.length > 2) A.seg(pts[pts.length - 1], pts[0]); return A; },
      // a box with its 12 edges and grid lines on its faces (div: [nx, ny, nz] lines across each axis)
      box(x0, y0, z0, x1, y1, z1, div) {
        const [nx, ny, nz] = div || [0, 0, 0], X = [x0, x1], Y = [y0, y1], Z = [z0, z1];
        for (const y of Y) for (const z of Z) A.seg([x0, y, z], [x1, y, z]);
        for (const x of X) for (const z of Z) A.seg([x, y0, z], [x, y1, z]);
        for (const x of X) for (const y of Y) A.seg([x, y, z0], [x, y, z1]);
        const L = (a, b, k, n) => a + (b - a) * k / (n + 1);
        for (let i = 1; i <= nx; i++) { const x = L(x0, x1, i, nx); for (const z of Z) A.seg([x, y0, z], [x, y1, z]); for (const y of Y) A.seg([x, y, z0], [x, y, z1]); }
        for (let i = 1; i <= ny; i++) { const y = L(y0, y1, i, ny); for (const z of Z) A.seg([x0, y, z], [x1, y, z]); for (const x of X) A.seg([x, y, z0], [x, y, z1]); }
        for (let i = 1; i <= nz; i++) { const z = L(z0, z1, i, nz); for (const y of Y) A.seg([x0, y, z], [x1, y, z]); for (const x of X) A.seg([x, y0, z], [x, y1, z]); }
        return A;
      },
      // a circle of radius r about centre c, in the plane normal to axis ("x" | "y" | "z")
      ring(c, r, axis, n, a0, a1) {
        n = n || 32; a0 = a0 || 0; a1 = a1 == null ? TAU : a1;
        const pts = [];
        for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, u = Math.cos(a) * r, v = Math.sin(a) * r; pts.push(axis === "x" ? [c[0], c[1] + u, c[2] + v] : axis === "z" ? [c[0] + u, c[1] + v, c[2]] : [c[0] + u, c[1], c[2] + v]); }
        return A.poly(pts);
      },
      // a cylinder along an axis from c (length h): rings along it and longitudinal lines between them
      cyl(c, r, h, axis, rings, lines, n) {
        rings = Math.max(2, rings || 2); lines = lines || 8;
        const at = (k) => (axis === "x" ? [c[0] + h * k, c[1], c[2]] : axis === "z" ? [c[0], c[1], c[2] + h * k] : [c[0], c[1] + h * k, c[2]]);
        for (let i = 0; i < rings; i++) A.ring(at(i / (rings - 1)), r, axis, n || 28);
        for (let j = 0; j < lines; j++) {
          const a = j / lines * TAU, u = Math.cos(a) * r, v = Math.sin(a) * r, p0 = at(0), p1 = at(1);
          const off = (p) => (axis === "x" ? [p[0], p[1] + u, p[2] + v] : axis === "z" ? [p[0] + u, p[1] + v, p[2]] : [p[0] + u, p[1], p[2] + v]);
          A.seg(off(p0), off(p1));
        }
        return A;
      },
      sphere(c, r, nlat, nlon) {
        for (let i = 1; i < nlat; i++) { const la = -Math.PI / 2 + i * Math.PI / nlat; A.ring([c[0], c[1] + Math.sin(la) * r, c[2]], Math.cos(la) * r, "y", 28); }
        for (let j = 0; j < nlon; j++) {
          const lo = j * Math.PI / nlon, pts = [];
          for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; pts.push([c[0] + Math.cos(a) * r * Math.cos(lo), c[1] + Math.sin(a) * r, c[2] + Math.cos(a) * r * Math.sin(lo)]); }
          A.poly(pts);
        }
        return A;
      },
      // a tube of radius r along a path of points: a ring at each point (normal to the path) and lines along it
      tube(path, r, sides) {
        sides = sides || 8;
        const frames = path.map((p, i) => {
          const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
          let t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const L = Math.hypot(...t) || 1; t = t.map((x) => x / L);
          const up = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
          let u = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]; const Lu = Math.hypot(...u) || 1; u = u.map((x) => x / Lu);
          const v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]];
          return Array.from({ length: sides }, (_, k) => { const q = k / sides * TAU, cq = Math.cos(q) * r, sq = Math.sin(q) * r; return [p[0] + u[0] * cq + v[0] * sq, p[1] + u[1] * cq + v[1] * sq, p[2] + u[2] * cq + v[2] * sq]; });
        });
        for (const F of frames) A.poly(F, true);
        for (let k = 0; k < sides; k++) for (let i = 1; i < frames.length; i++) A.seg(frames[i - 1][k], frames[i][k]);
        return A;
      },
    };
    return A;
  }
  const MODELS = {
    // a server rack: cabinet with vented sides and rails, a power unit, six servers with drive bays, a switch, fans on top
    rack() {
      const m = Mdl(), W = 0.42, D = 0.55;
      m.part("cabinet", "Cabinet").box(-W, 0, -D, W, 2.0, D, [1, 9, 2]).box(-W - 0.02, 0, -D - 0.02, W + 0.02, 0.08, D + 0.02, [0, 0, 0]);
      for (const x of [-W + 0.04, W - 0.04]) m.seg([x, 0.08, D - 0.03], [x, 1.98, D - 0.03]);
      for (const [x, z] of [[-W + 0.06, -D + 0.06], [W - 0.06, -D + 0.06], [-W + 0.06, D - 0.06], [W - 0.06, D - 0.06]]) m.ring([x, 0.0, z], 0.035, "x", 12);
      m.part("psu", "Power unit", [0, 0, 0.36]).box(-W + 0.05, 0.11, -D + 0.04, W - 0.05, 0.26, D - 0.02, [3, 1, 2]);
      for (let i = 0; i < 4; i++) m.ring([-0.18 + i * 0.12, 0.185, D - 0.02], 0.035, "z", 12);
      for (let k = 0; k < 6; k++) {
        const y0 = 0.3 + k * 0.215, y1 = y0 + 0.17;
        m.part("srv" + (k + 1), "Server " + (k + 1), [0, (k - 2.5) * 0.05, 0.42 + 0.11 * k]).box(-W + 0.04, y0, -D + 0.04, W - 0.04, y1, D - 0.01, [4, 1, 3]);
        const bw = (2 * W - 0.24) / 5;
        for (let b = 0; b < 5; b++) { const x0 = -W + 0.07 + b * (bw + 0.02); m.poly([[x0, y0 + 0.03, D - 0.01], [x0 + bw, y0 + 0.03, D - 0.01], [x0 + bw, y1 - 0.03, D - 0.01], [x0, y1 - 0.03, D - 0.01]], true); }
        m.ring([W - 0.09, (y0 + y1) / 2, D - 0.01], 0.018, "z", 8);
      }
      m.part("switch", "Network switch", [0, 0.22, 0.5]).box(-W + 0.04, 1.62, -D + 0.04, W - 0.04, 1.75, D - 0.01, [6, 0, 2]);
      for (let i = 0; i < 9; i++) { const x = -W + 0.08 + i * 0.075; m.poly([[x, 1.65, D - 0.01], [x + 0.05, 1.65, D - 0.01], [x + 0.05, 1.71, D - 0.01], [x, 1.71, D - 0.01]], true); }
      m.part("fans", "Cooling fans", [0, 0.5, 0]).box(-W + 0.03, 1.8, -D + 0.03, W - 0.03, 1.9, D - 0.03, [0, 0, 0]);
      for (const z of [-0.28, 0, 0.28]) { m.ring([0, 1.9, z], 0.12, "y", 24).ring([0, 1.9, z], 0.04, "y", 12); for (let b = 0; b < 6; b++) { const a = b / 6 * TAU; m.seg([Math.cos(a) * 0.04, 1.9, z + Math.sin(a) * 0.04], [Math.cos(a + 0.5) * 0.12, 1.9, z + Math.sin(a + 0.5) * 0.12]); } }
      return m.parts;
    },
    // a microchip: substrate with a grid, gull-wing pins on four sides, the die with four cores, a lid
    chip() {
      const m = Mdl();
      m.part("substrate", "Substrate").box(-1, 0, -1, 1, 0.08, 1, [9, 0, 9]);
      m.part("pins", "Pins", [0, -0.35, 0]);
      for (let k = 0; k < 12; k++) {
        const u = -0.88 + k * 0.16;
        m.poly([[u, 0.04, -1], [u, 0.04, -1.1], [u, -0.08, -1.18]]).poly([[u, 0.04, 1], [u, 0.04, 1.1], [u, -0.08, 1.18]])
          .poly([[-1, 0.04, u], [-1.1, 0.04, u], [-1.18, -0.08, u]]).poly([[1, 0.04, u], [1.1, 0.04, u], [1.18, -0.08, u]]);
      }
      m.part("die", "Silicon die", [0, 0.4, 0]).box(-0.55, 0.08, -0.55, 0.55, 0.18, 0.55, [7, 0, 7]);
      m.part("cores", "Cores", [0, 0.62, 0]);
      for (const [x, z] of [[-0.27, -0.27], [0.27, -0.27], [-0.27, 0.27], [0.27, 0.27]]) m.box(x - 0.2, 0.18, z - 0.2, x + 0.2, 0.26, z + 0.2, [2, 0, 2]);
      m.part("lid", "Heat spreader", [0, 1.0, 0]).box(-0.72, 0.3, -0.72, 0.72, 0.38, 0.72, [3, 0, 3]);
      return m.parts;
    },
    // a drone: body, four tubular arms, motors and rotors, a camera gimbal and landing skids
    drone() {
      const m = Mdl();
      m.part("body", "Body").box(-0.32, 0.3, -0.48, 0.32, 0.5, 0.48, [2, 1, 3]).ring([0, 0.5, 0], 0.22, "y", 24).ring([0, 0.56, 0], 0.16, "y", 24);
      m.part("arms", "Arms");
      for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.tube([[sx * 0.3, 0.42, sz * 0.4], [sx * 0.75, 0.46, sz * 0.8], [sx * 1.15, 0.5, sz * 1.15]], 0.045, 6);
      m.part("rotors", "Rotors", [0, 0.45, 0]);
      for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const c = [sx * 1.15, 0.5, sz * 1.15];
        m.cyl(c, 0.07, 0.12, "y", 2, 8).ring([c[0], 0.66, c[2]], 0.48, "y", 36).ring([c[0], 0.66, c[2]], 0.44, "y", 36);
        for (let b = 0; b < 2; b++) { const a = b * Math.PI + sx * 0.4; m.seg([c[0] + Math.cos(a) * 0.05, 0.64, c[2] + Math.sin(a) * 0.05], [c[0] + Math.cos(a) * 0.42, 0.64, c[2] + Math.sin(a) * 0.42]); }
      }
      m.part("camera", "Camera", [0, -0.35, 0.2]).sphere([0, 0.18, 0.3], 0.12, 5, 4).ring([0, 0.18, 0.3], 0.16, "x", 24);
      m.part("skids", "Landing gear", [0, -0.25, 0]);
      for (const sx of [-1, 1]) { m.seg([sx * 0.4, 0, -0.5], [sx * 0.4, 0, 0.5]).seg([sx * 0.4, 0, -0.3], [sx * 0.25, 0.3, -0.3]).seg([sx * 0.4, 0, 0.3], [sx * 0.25, 0.3, 0.3]); }
      return m.parts;
    },
    // a data-centre block: a hall with a dense facade, rows of racks inside, rooftop units, cooling towers, a generator
    datacentre() {
      const m = Mdl();
      m.part("hall", "Data hall").box(-1.3, 0, -0.75, 1.3, 0.75, 0.75, [13, 3, 6]);
      m.part("racks", "Rack rows", [0, 0, 1.25]);
      for (let r = 0; r < 4; r++) { const z = -0.5 + r * 0.33; m.box(-1.1, 0, z - 0.06, 1.1, 0.5, z + 0.06, [10, 1, 0]); }
      m.part("roof", "Rooftop plant", [0, 0.7, 0]);
      for (let k = 0; k < 3; k++) { const x = -0.8 + k * 0.8; m.box(x - 0.28, 0.75, -0.35, x + 0.28, 0.92, 0.35, [2, 0, 2]).ring([x, 0.92, -0.15], 0.11, "y", 20).ring([x, 0.92, 0.15], 0.11, "y", 20); }
      m.part("cooling", "Cooling towers", [0.7, 0, 0]);
      for (const z of [-0.35, 0.35]) m.cyl([1.75, 0, z], 0.28, 0.9, "y", 6, 16);
      m.part("power", "Generator", [-0.7, 0, 0]).box(-2.0, 0, -0.4, -1.5, 0.45, 0.4, [3, 2, 3]).cyl([-1.75, 0.45, 0], 0.06, 0.3, "y", 2, 6);
      return m.parts;
    },
    // a padlock: a body with a face grid and keyhole, a tubular shackle, the lock cylinder
    lock() {
      const m = Mdl();
      m.part("body", "Lock body").box(-0.62, 0, -0.26, 0.62, 1.0, 0.26, [6, 5, 2]).ring([0, 0.5, 0.26], 0.12, "z", 20).seg([0, 0.42, 0.26], [0, 0.22, 0.26]);
      const path = [[-0.4, 0.92, 0]]; for (let i = 0; i <= 14; i++) { const a = Math.PI - i / 14 * Math.PI; path.push([Math.cos(a) * 0.4, 1.3 + Math.sin(a) * 0.4, 0]); } path.push([0.4, 0.92, 0]);
      m.part("shackle", "Shackle", [0, 0.55, 0]).tube(path, 0.075, 8);
      m.part("cylinder", "Key cylinder", [0, 0, 0.6]).cyl([0, 0.5, 0.0], 0.12, 0.3, "z", 4, 10);
      return m.parts;
    },
    // a phone: frame, a screen grid, the board, the battery, the camera
    phone() {
      const m = Mdl();
      m.part("frame", "Frame").box(-0.45, 0, -0.05, 0.45, 1.9, 0.05, [0, 0, 0]).ring([0, 1.82, 0.05], 0.03, "z", 10);
      m.part("screen", "Screen", [0, 0, 0.45]).box(-0.4, 0.08, 0.06, 0.4, 1.76, 0.07, [7, 14, 0]);
      m.part("board", "Logic board", [0, 0, -0.4]).box(-0.38, 1.1, -0.03, 0.38, 1.75, 0.02, [4, 3, 0]);
      m.part("battery", "Battery", [0, 0, -0.75]).box(-0.36, 0.15, -0.035, 0.36, 1.0, 0.015, [0, 4, 0]);
      m.part("camera", "Camera", [0, 0.15, -1.0]).cyl([-0.28, 1.72, -0.05], 0.07, -0.04, "z", 3, 8).cyl([-0.12, 1.72, -0.05], 0.07, -0.04, "z", 3, 8);
      return m.parts;
    },
  };

  function hud(ctx, opts) {
    opts = opts || {};
    const C = cfg(), beat = ctx.beat, H = { ctx, mode: "briefing" };
    const meta = (name, kind) => ({ kind: kind || "reveal", beat: beat.id, name, content: true });
    // loops (a sweep, a spin, repeating traffic, a running signal) are windows; more than two at once is noise
    const LOOPS = [];
    const loop = (t0, t1, what) => {
      LOOPS.push([t0, t1, what]);
      const at = (tt) => LOOPS.filter(([a, b]) => tt >= a && tt < b);
      const peak = LOOPS.reduce((m, [a]) => Math.max(m, at(a).length), 0);
      if (peak > 2 && !H.__loopWarned) {
        H.__loopWarned = true;
        const tt = LOOPS.map(([a]) => a).find((a) => at(a).length > 2);
        Loom.warn("holo_loops", `${beat.id}: ${at(tt).length} loops run at once at ${tt.toFixed(2)}s (${at(tt).map((l) => l[2]).join(", ")}); keep two at most`);
      }
    };
    const T0 = (o, d) => (o && o.at != null ? o.at : d != null ? d : ctx.speechStart);

    // ---- people: the style has no designed hologram character kit yet (guide s8). A full-colour rig placed in a HUD
    // breaks the look, so it is named, not hidden: holo_character_kit. A rig made for this style declares
    // styles: ["hologram"] (or look: "hologram") in its definition and passes. People are never drawn in engine code.
    if (typeof ctx.character === "function" && !ctx.__holoCast) {
      const place = ctx.character;
      ctx.__holoCast = true;
      ctx.character = function (nm, rigId) {
        const def = Loom.rig && Loom.rig.defs ? Loom.rig.defs[rigId] : null;
        const ok = def && ((Array.isArray(def.styles) && def.styles.indexOf("hologram") >= 0) || def.look === "hologram");
        if (def && !ok) Loom.warn("holo_character_kit", `${beat.id}: "${nm}" is the full-colour rig "${rigId}" in a hologram scene; the style has no designed hologram character kit yet (docs/styles/guides/hologram.md s8): commission one (Claude Design, skills/lnd/lnd-character-design) or leave the person out`);
        return place.apply(ctx, arguments);
      };
    }

    // ---- the stage: one element, three depth layers, each in a camera group the place camera drives (Loom.cam)
    const E0 = ctx.el(opts.name || "hud", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", parent: opts.parent, exit: opts.exit || "recede" });
    const defs = svg("defs", {}, E0.inner);
    const blurId = "lmholo_blur_" + beat.id + "_" + (opts.name || "hud");
    if (C.glow && C.blur > 0) {
      const fl = svg("filter", { id: blurId, x: "-10%", y: "-10%", width: "120%", height: "120%" }, defs);
      svg("feGaussianBlur", { stdDeviation: C.blur }, fl);
    }
    const layers = {};
    for (const nm of ["far", "mid", "near"]) {
      const cam = svg("g", { class: "lm-cam lm-holo-layer", "data-layer": nm }, E0.inner);
      const orb = svg("g", { class: "lm-holo-orbit" }, cam);
      layers[nm] = { cam, orb, g: svg("g", {}, orb), depth: C.depth[nm].z, look: C.depth[nm] };
    }
    const R = { E: E0, layers, anchors: {}, kind: "hud", W: 1920, H: 1080, cams: [], ctx };
    H.place = R;                                    // Loom.cam.push / pan / pull take it, like a place
    E0.revealT = T0(opts, ctx.start); E0.revealKind = "draw";
    const layerOf = (d) => layers[d] || layers[(typeof d === "number" ? (d < 0.5 ? "far" : d < 0.95 ? "mid" : "near") : "mid")];
    H.layer = (d) => layerOf(d).g;

    // ---- an element of the HUD, in its depth layer
    function piece(name, box, kind, o) {
      const L = layerOf(o.depth || "mid");
      const E = ctx.el(name, { x: box.x, y: box.y, w: box.w, h: box.h, kind, parent: L.g, exit: o.exit || (kind === "text" ? "wipe" : "recede"), overlaps: o.overlaps });
      E.__holo = { depth: o.depth || "mid", look: L.look, kind };
      PIECES.push(E);
      E.pwr = svg("g", { class: "lm-holo-power" }, E.inner);      // power up and down write here only
      E.body = svg("g", { class: "lm-holo-body" }, E.pwr);        // mode dims and state tweens act here
      if (o.register) E.__holo.register = o.register;
      if (o.register === "briefing" || o.register === "analysis") (H.reg[o.register] = H.reg[o.register] || []).push(E);
      return E;
    }
    H.reg = {};
    const PIECES = [];
    // ---- the briefing layout rule: a briefing composition sits centred in the band between the top safe line (84)
    // and the caption band (930), not crowded at the top with the lower third empty. H.vcenter(h) gives the top of a
    // block h tall centred in that band; holo_top_heavy warns when a briefing composition, at its fullest, ends above
    // 72 % of the frame with its middle well above the band's middle (checked once, on the first frame)
    const BAND = [84, 930];
    H.vcenter = (hh, vo) => { vo = vo || {}; const a = vo.top == null ? BAND[0] : vo.top, b = vo.bottom == null ? BAND[1] : vo.bottom; return Math.round(a + Math.max(0, (b - a - hh) / 2)); };
    const modeAt = (tt) => { let m = "briefing"; for (const x of modes) if (x.at <= tt) m = x.m; return m; };
    function balanceCheck() {
      // the fullest moments: just before a section powers down (the first exit of a cascade), a register switch, the end
      const ends = new Set([ctx.end - 0.01]);
      const ex = PIECES.map((E) => E.exitT).filter((x) => x != null).sort((a, b) => a - b);
      ex.forEach((x, i) => { if (i === 0 || x - ex[i - 1] > 1.0) ends.add(x - 0.01); });
      for (const x of modes) ends.add(x.at - 0.01);
      for (const tt of Array.from(ends).sort((a, b) => a - b)) {
        if (modeAt(tt) !== "briefing") continue;
        const live = PIECES.filter((E) => E.__holo.kind !== "scenery" && E.__holo.kind !== "mark" && E.__holo.depth !== "far" && E.revealT != null && E.revealT <= tt && (E.exitT == null || E.exitT > tt));
        if (live.length < 2) continue;
        const y0 = Math.min(...live.map((E) => E.y)), y1 = Math.max(...live.map((E) => E.y + E.h)), mid = (y0 + y1) / 2;
        if (y1 < 1080 * 0.72 && mid < (BAND[0] + BAND[1]) / 2 - 0.08 * (BAND[1] - BAND[0])) {
          Loom.warn("holo_top_heavy", `${beat.id}: the briefing composition at ${tt.toFixed(2)}s spans y ${Math.round(y0)} to ${Math.round(y1)}, so the lower third is empty; centre it above the caption band (H.vcenter(${Math.round(y1 - y0)}) = ${H.vcenter(y1 - y0)})`);
          return;
        }
      }
    }
    const reveal = (E, t) => { if (E.revealT == null || t < E.revealT) { E.revealT = t; E.revealKind = "draw"; } };
    const sw = (E, k) => (baseStroke() * (k || 1) * E.__holo.look.stroke).toFixed(2);
    const lineOp = (E, k) => clamp((k == null ? 1 : k) * E.__holo.look.line, 0, 1).toFixed(3);

    // a stroke that draws on (dash offset), with its halo under it (the enhancement: a soft wide stroke, blurred only
    // where filters render; the line reads without it)
    function stroke(E, parent, pts, t, dur, o) {
      o = o || {};
      const c = col(o.tone || "accent"), d = dpath(pts, o.closed), L = Math.max(1, plen(pts, o.closed)), w = o.w || sw(E, o.weight);
      // the glow: two soft passes under the line (a wide faint one and a narrow brighter one, the narrow one blurred where
      // filters render), so a stroke reads as light; the line reads without them
      let halo = null, halo2 = null;
      if (C.glow && o.halo !== false) {
        halo2 = svg("path", { d, fill: "none", stroke: c, "stroke-width": (+w + C.halo_width * 5).toFixed(2), "stroke-linecap": "round", "stroke-linejoin": "round",
          opacity: 0, class: "lm-holo-halo" }, parent);
        halo = svg("path", { d, fill: "none", stroke: c, "stroke-width": (+w + C.halo_width * 2).toFixed(2), "stroke-linecap": "round", "stroke-linejoin": "round",
          opacity: 0, filter: C.blur > 0 ? `url(#${blurId})` : null, class: "lm-holo-halo" }, parent);
      }
      const p = svg("path", { d, fill: "none", stroke: c, "stroke-width": w, "stroke-linecap": o.cap || "square", "stroke-linejoin": "miter",
        opacity: o.op != null ? o.op : lineOp(E), "stroke-dasharray": o.dash || `${L.toFixed(1)} ${(L + 8).toFixed(1)}`, "stroke-dashoffset": o.dash ? 0 : L.toFixed(1) }, parent);
      const nm = E.name + (o.part ? "." + o.part : ""), op = +(o.op != null ? o.op : lineOp(E));
      // hidden until it starts (a zero-length dash still paints its line cap as a dot), then drawn along its length
      Loom.tween(p, { opacity: 0 }, { opacity: op, duration: o.dash ? dur : 0.01, ease: "none" }, t, meta(nm, "draw"));
      if (!o.dash) Loom.tween(p, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: dur, ease: "none" }, t, meta(nm, "draw"));
      if (halo) Loom.tween(halo, { opacity: 0 }, { opacity: +(C.halo * E.__holo.look.line).toFixed(3), duration: dur * 0.8 + 0.1 }, t + dur * 0.2, meta(nm, "draw"));
      if (halo2) Loom.tween(halo2, { opacity: 0 }, { opacity: +(C.halo * 0.35 * E.__holo.look.line).toFixed(3), duration: dur * 0.8 + 0.1 }, t + dur * 0.2, meta(nm, "draw"));
      reveal(E, t);
      return { p, halo, end: t + dur };
    }
    const fadeIn = (n, t, dur, to, name) => Loom.tween(n, { opacity: 0 }, { opacity: to == null ? 1 : to, duration: dur || 0.25 }, t, meta(name || "holo", "reveal"));
    // a dark plate: words always sit on one (text never on lines or the grid)
    const plate = (E, parent, x, y, w, h, o) => svg("rect", { x: f1(x), y: f1(y), width: f1(w), height: f1(h), fill: S().c((o && o.fill) || "surface"),
      opacity: (o && o.opacity != null ? o.opacity : E.__holo.look.plate).toFixed(3), stroke: "none" }, parent);
    // words: kit.text (real metrics, checked), revealed with a short type-on (a block cursor runs across the line)
    function words(E, parent, str, box, t, o) {
      o = o || {};
      const g = svg("g", { opacity: 0 }, parent);
      const tx = K().text(g, String(str), Object.assign({ role: o.role || "label", x: box.x, y: box.y, w: box.w, h: box.h, maxLines: o.maxLines || 1,
        align: o.align || "left", valign: o.valign || "middle", color: tok(o.tone || "ink"), weight: o.weight, tracking: o.tracking }, {}));
      const fit = tx.__fit || { x: box.x, y: box.y, width: box.w, height: box.h, size: 24 };
      const dur = o.dur != null ? o.dur : clamp(0.12 + String(str).length * 0.012, 0.15, 0.55);
      if (o.cursor !== false && dur > 0.12) {
        // type-on: the line brightens as a block cursor runs across it, then the cursor goes (no clip path, no mask)
        Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: dur, ease: "none" }, t, meta(E.name, "reveal"));
        // a thin caret, not a block: a block sat over the letters it had just passed in a still frame (2026-10-16)
        const cw = Math.max(2, fit.size * 0.08), cur = svg("rect", { x: f1(fit.x), y: f1(fit.y + fit.height * 0.12), width: f1(cw), height: f1(fit.height * 0.76), fill: col(o.cursorTone || "accent"), opacity: 0 }, parent);
        Loom.drive((e, raw) => {
          setA(cur, "opacity", raw > 0 && raw < 1 ? "0.8" : "0");
          setA(cur, "x", f1(fit.x + fit.width * e));
        }, t, dur, "linear", { kind: "reveal", beat: beat.id, name: E.name + ".type", content: true });
      } else Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: Math.max(0.06, dur) }, t, meta(E.name, "reveal"));
      reveal(E, t);
      return { g, text: tx, fit, end: t + dur };
    }

    // ================================================================ PIECES

    // ---- frame: corner brackets round a box (they draw out from each corner), a faint hairline, a plate. The base of
    // every panel. Returns {E, t, box (the content area), focus(t), dim(t), status(tone, t)}
    H.frame = function (name, o) {
      o = o || {};
      const E = piece(name, o, o.kind || "card", o), t = T0(o), w = o.w, h = o.h, g = svg("g", {}, E.body);
      const c = o.corner || clamp(Math.min(w, h) * 0.12, 14, 34);
      let end = t;
      if (o.plate !== false) { const pl = plate(E, g, 0, 0, w, h); fadeIn(pl, t + 0.12, 0.3, +pl.getAttribute("opacity"), name); pl.setAttribute("opacity", 0); E.plate = pl; }
      if (o.hairline !== false) { const r = stroke(E, g, [[0, 0], [w, 0], [w, h], [0, h]], t + 0.1, 0.45, { closed: true, w: Math.max(1, baseStroke() * 0.5).toFixed(2), op: lineOp(E, 0.35), tone: o.tone || "line", halo: false, part: "hair" }); end = Math.max(end, r.end); }
      E.brackets = [];
      for (const b of brackets(0, 0, w, h, c)) {
        // each corner draws from the corner point out along both arms
        const r1 = stroke(E, g, [b[1], b[0]], t, 0.28, { tone: o.tone || "accent", weight: 1.15, part: "corner" });
        const r2 = stroke(E, g, [b[1], b[2]], t, 0.28, { tone: o.tone || "accent", weight: 1.15, part: "corner", halo: false });
        E.brackets.push(r1.p, r2.p); end = Math.max(end, r2.end);
      }
      const Hd = { E, t: end, box: { x: 0, y: 0, w, h }, g };
      Hd.status = function (tone, when) {                // the brackets take a status colour (one change, held)
        for (const p of E.brackets) Loom.set(p, { attr: { stroke: col(tone) } }, when);
        return when;
      };
      Hd.dim = (when, to) => { Loom.tween(E.body, { opacity: 1 }, { opacity: to == null ? 0.35 : to, duration: 0.4 }, when, meta(name, "state")); return when + 0.4; };
      Hd.undim = (when) => { Loom.tween(E.body, { opacity: 0.35 }, { opacity: 1, duration: 0.4 }, when, meta(name, "state")); return when + 0.4; };
      E.handle = E.handle || Hd;
      return Hd;
    };

    // ---- a title: a kicker (mono, caps, tracked) on a short rule, then the line in the display face. Briefing furniture
    H.title = function (name, o) {
      o = o || {};
      const E = piece(name, o, "text", Object.assign({ depth: "near" }, o)), t = T0(o), g = svg("g", {}, E.body);
      let y = 0, end = t;
      if (o.kicker) {
        const r = stroke(E, g, [[0, 18], [44, 18]], t, 0.25, { tone: o.tone || "accent", part: "rule" });
        // v2: caps false keeps the kicker in sentence case, untracked (mono caps everywhere is a tell, hologram-v2 s3)
        const k = o.caps === false ? words(E, g, String(o.kicker), { x: 60, y: 0, w: o.w - 60, h: 36 }, r.end, { role: "caption", tone: o.tone || "accent" })
          : words(E, g, String(o.kicker).toUpperCase(), { x: 60, y: 0, w: o.w - 60, h: 36 }, r.end, { role: "caption", tone: o.tone || "accent", tracking: "0.12em" });
        end = k.end; y = 46;
      }
      const ttl = words(E, g, o.text, { x: 0, y, w: o.w, h: o.h - y }, end + 0.05, { role: o.role || "title", tone: "ink", maxLines: o.maxLines || 2, valign: "top", cursor: false, dur: 0.3 });
      return { E, t: ttl.end + 0.3, text: ttl.text };
    };

    // ---- a panel that assembles line by line: brackets, then the top rule draws, the title types on, then each row
    // arrives with its tick (key on the left, value on the right, a status tag when given). rows: strings or
    // [key, value, status]. Returns {E, t, set(i, value, t, status), mark(i, status, t), row(i)}
    H.panel = function (name, o) {
      o = o || {};
      const t = T0(o), F = H.frame(name, Object.assign({}, o, { hairline: o.hairline })), E = F.E, w = o.w, h = o.h, g = svg("g", {}, E.body);
      const pad = o.pad || 26, rh = o.rowH || 54;
      let y = pad, cur = F.t - 0.12;
      if (o.title) {
        const tt = words(E, g, String(o.title).toUpperCase(), { x: pad, y: y - 6, w: w - 2 * pad, h: 44 }, cur, { role: "label", tone: o.tone || "accent", tracking: "0.08em", weight: 700 });
        const r = stroke(E, g, [[pad, y + 46], [w - pad, y + 46]], cur + 0.05, 0.4, { tone: o.tone || "accent", weight: 0.6, op: lineOp(E, 0.7), halo: false, part: "rule" });
        cur = Math.max(tt.end, r.end) - 0.15; y += 62;
      }
      const rows = (o.rows || []).map((r) => (Array.isArray(r) ? r : [r]));
      const gap = o.by != null && rows.length ? clamp((o.by - cur) / rows.length, 0.08, 0.6) : (o.stagger || 0.16);
      const R_ = [];
      // a tag's slot: room for its word at the caption's largest size with tracking; o.tagRoom reserves one in every row
      // (true: room for "ALERT"; a word: room for that word), so a later set() or mark() with a status has a place to say it
      const roomW = o.tagRoom ? tagSlot(typeof o.tagRoom === "string" ? o.tagRoom : "ALERT") : 0;
      const inner = w - 2 * pad - 16, vrole = o.valueRole || "label", krole = o.role || "label";
      rows.forEach((r, i) => {
        const ry = y + i * rh, rt = cur + i * gap, rg = svg("g", {}, g);
        const bar = svg("rect", { x: pad - 12, y: f1(ry + 6), width: f1(w - 2 * pad + 24), height: f1(rh - 12), fill: col(r[2] || "accent"), opacity: 0 }, rg);
        stroke(E, rg, [[pad, ry + rh / 2 - 9], [pad, ry + rh / 2 + 9]], rt, 0.1, { tone: r[2] && r[2] !== "info" ? r[2] : "line", weight: 1.2, halo: false, part: "tick" });
        const hasV = r[1] != null && r[1] !== "";
        const w0 = r[2] && wordOf(r[2]) && o.tags !== false ? wordOf(r[2]) : null;
        const tagW = o.tags === false ? 0 : Math.max(roomW, w0 ? tagSlot(w0) : 0);
        // the value gets the room its words need (measured), the key the rest; o.valueW reserves more for a later set()
        const vNeed = hasV ? Math.max(o.valueW || 0, K().measure(String(r[1]), vrole, 30, 700) * 1.1 + 18) : 0;
        const kw = hasV ? Math.max(inner * 0.35, inner - tagW - vNeed) : inner - tagW;
        const kt = words(E, rg, r[0], { x: pad + 16, y: ry, w: kw, h: rh }, rt + 0.04, { role: krole, tone: hasV ? "muted" : "ink", maxLines: 1, cursor: false, dur: 0.12 });
        let vt = null;
        const vbox = { x: pad + 16 + kw, y: ry, w: w - 2 * pad - 16 - kw - tagW, h: rh };
        if (hasV) vt = words(E, rg, r[1], vbox, rt + 0.1, { role: vrole, tone: r[2] && r[2] !== "info" ? r[2] : "ink", align: "right", weight: 700, dur: 0.18 });
        let tag = null;
        if (w0) tag = H.tag(E, rg, w - pad - tagW + 12, ry + (rh - 42) / 2, r[2], rt + 0.16, { h: 42, w: tagW - 12 });
        R_.push({ g: rg, bar, key: kt, keyStr: String(r[0]), kw, hasV, valStr: hasV ? String(r[1]) : "", value: vt, tag, word: w0, tagW, y: ry,
          vbox: hasV ? vbox : { x: w / 2, y: ry, w: w / 2 - pad - tagW, h: rh } });
      });
      const end = cur + Math.max(0, rows.length - 1) * gap + 0.3;
      const Hd = Object.assign({}, F, { E, t: end, rows: R_, rowH: rh, contentY: y });
      const rowOf = (i) => { const r = R_[i]; if (!r) throw new Error(`${beat.id}: panel "${name}" has no row ${i}`); return r; };
      // a row with no room for a tag makes room on the word: the key (and the value) move left and type on again
      const makeRoom = (r, tw, when) => {
        if (r.tagW >= tw) return false;
        const vNeed = r.hasV ? K().measure(r.valStr, vrole, 30, 700) * 1.1 + 18 : 0;
        const kw = Math.min(r.kw, r.hasV ? Math.max(inner * 0.3, inner - tw - vNeed) : inner - tw);
        if (kw < r.kw - 0.5) {
          Loom.tween(r.key.g, { opacity: 1 }, { opacity: 0, duration: 0.12 }, when, meta(name, "state"));
          r.key = words(E, r.g, r.keyStr, { x: pad + 16, y: r.y, w: kw, h: rh }, when + 0.12, { role: krole, tone: r.hasV ? "muted" : "ink", maxLines: 1, cursor: false, dur: 0.12 });
          r.kw = kw;
        }
        r.tagW = tw;
        r.vbox = r.hasV ? { x: pad + 16 + kw, y: r.y, w: inner - kw - tw, h: rh } : { x: w / 2, y: r.y, w: w / 2 - pad - tw, h: rh };
        return true;
      };
      const typeValue = (r, when, status) => {
        if (r.value) Loom.tween(r.value.g, { opacity: 1 }, { opacity: 0, duration: 0.15 }, when, meta(name, "state"));
        r.value = words(E, r.g, r.valStr, r.vbox, when + 0.15, { role: vrole, tone: status && status !== "info" ? status : "ink", align: "right", weight: 700, dur: 0.2 });
      };
      // the status word in the row's tag slot (severity told twice): the old tag goes, the new one comes; "info" clears it
      const sayStatus = (r, status, when, word) => {
        if (o.tags === false) return false;
        const wd = word === false ? null : (word || (status && status !== "info" ? wordOf(status) || String(status).toUpperCase() : null));
        if (r.tag && r.word === wd) return false;
        if (r.tag) Loom.tween(r.tag.g, { opacity: 1 }, { opacity: 0, duration: 0.12 }, when, meta(name, "state"));
        r.tag = null; r.word = null;
        if (!wd) return false;
        const moved = makeRoom(r, tagSlot(wd), when);
        r.tag = H.tag(E, r.g, w - pad - r.tagW + 12, r.y + (rh - 42) / 2, status, when + 0.14, { h: 42, w: r.tagW - 12, word: wd });
        r.word = wd;
        return moved;
      };
      // a value changes on the word: the old value goes, the new one types on in its status colour, and a status
      // shows its WORD in the row's tag (WARN, ALERT, OK), never the colour alone
      Hd.set = function (i, value, when, status, so) {
        const r = rowOf(i);
        r.valStr = String(value); r.hasV = true;
        if (status) sayStatus(r, status, when, so && so.word);
        typeValue(r, when, status);
        if (status) lightRow(r, status, when);
        return when + 0.35;
      };
      // a row lit in a status colour (a faint bar behind it) with its word in the tag; mo: a number (the bar's
      // opacity, as before) or {to, word}: word false keeps the colour only, a string says another word ("PICKED")
      const lightRow = (r, status, when, to) => {
        Loom.set(r.bar, { attr: { fill: col(status) } }, when);   // the colour changes at that time, so a row can be marked twice
        Loom.tween(r.bar, { opacity: 0 }, { opacity: to == null ? 0.14 : to, duration: 0.3 }, when, meta(name, "state"));
      };
      Hd.mark = function (i, status, when, mo) {
        const r = rowOf(i), mo_ = typeof mo === "number" ? { to: mo } : (mo || {});
        lightRow(r, status, when, mo_.to);
        if (sayStatus(r, status, when, mo_.word) && r.value) typeValue(r, when, status);   // the value moved left to make room
        return when + 0.3;
      };
      Hd.row = (i) => R_[i];
      E.handle = Hd;
      return Hd;
    };

    // ---- bars: a ranking or a set of probabilities as FILLED bars with a glowing leading edge, the label on the left,
    // the value outside the bar on the right (so a small value always reads), a hairline track for the scale, and a
    // minimum visible length (a 1 % bar is a stub, never a sliver). Bars grow from zero as their row arrives and move to
    // new values on the word. rows: [label, value, status]. Returns {E, t, set(i, v, t, dur), mark(i, status, t, {word}),
    // bar(i)}
    H.bars = function (name, o) {
      o = o || {};
      const F = H.frame(name, o), E = F.E, w = o.w, h = o.h, g = svg("g", {}, E.body);
      const pad = o.pad || 26, rh = o.rowH || 54;
      let y = pad, cur = F.t - 0.12;
      if (o.title) {
        const tt = words(E, g, String(o.title).toUpperCase(), { x: pad, y: y - 6, w: w - 2 * pad, h: 44 }, cur, { role: "label", tone: o.tone || "accent", tracking: "0.08em", weight: 700 });
        const r = stroke(E, g, [[pad, y + 46], [w - pad, y + 46]], cur + 0.05, 0.4, { tone: o.tone || "accent", weight: 0.6, op: lineOp(E, 0.7), halo: false, part: "rule" });
        cur = Math.max(tt.end, r.end) - 0.15; y += 62;
      }
      const rows = (o.rows || []).map((r) => (Array.isArray(r) ? r : [r.label, r.value, r.status]));
      const vals = rows.map((r) => +r[1] || 0);
      const max = o.max != null ? o.max : Math.max(1e-9, ...vals);
      const unit = o.unit || "", sep = unitSep(unit, o.unitSep);
      const fmt = (v) => Number(v).toFixed(o.decimals || 0) + (unit ? sep + unit : "");
      const lrole = o.role || "label", vrole = o.valueRole || "label";
      const labelW = o.labelW || Math.min((w - 2 * pad) * 0.42, Math.max(60, ...rows.map((r) => K().measure(String(r[0]), lrole, 30))) + 16);
      const valueW = o.valueW || Math.ceil(Math.max(...rows.map((r) => K().measure(fmt(+r[1] || 0), vrole, 30, 700)), K().measure(fmt(max), vrole, 30, 700)) * 1.1 + 12);
      const bx0 = pad + 16 + labelW + 12, L = Math.max(40, w - pad - valueW - 18 - bx0);
      const bh = clamp(o.barH || Math.round(rh * 0.46), 14, rh - 14), minLen = o.minLen == null ? 12 : o.minLen;
      const gap = o.by != null && rows.length ? clamp((o.by - cur) / rows.length, 0.08, 0.6) : (o.stagger || 0.16);
      const grow = o.growDur || 0.6, R_ = [];
      rows.forEach((r, i) => {
        const ry = y + i * rh, rt = cur + i * gap, rg = svg("g", {}, g), st = r[2], tone = st || o.barTone || "accent";
        const hi = svg("rect", { x: pad - 12, y: f1(ry + 6), width: f1(w - 2 * pad + 24), height: f1(rh - 12), fill: col(tone), opacity: 0 }, rg);
        stroke(E, rg, [[pad, ry + rh / 2 - 9], [pad, ry + rh / 2 + 9]], rt, 0.1, { tone: st && st !== "info" ? st : "line", weight: 1.2, halo: false, part: "tick" });
        words(E, rg, r[0], { x: pad + 16, y: ry, w: labelW, h: rh }, rt + 0.04, { role: lrole, tone: o.labelTone || "ink", maxLines: 1, cursor: false, dur: 0.12 });
        const by_ = ry + (rh - bh) / 2;
        const track = svg("rect", { x: f1(bx0), y: f1(by_), width: f1(L), height: f1(bh), fill: "none", stroke: col("line"), "stroke-width": 1, opacity: 0 }, rg);
        fadeIn(track, rt, 0.2, +lineOp(E, 0.3), name);
        const bg = svg("g", { opacity: 0 }, rg);
        const halo = C.glow ? svg("rect", { x: f1(bx0), y: f1(by_), width: 0, height: f1(bh), fill: "none", stroke: col(tone), "stroke-width": (1.4 + C.halo_width * 2).toFixed(2),
          opacity: C.halo, filter: C.blur > 0 ? `url(#${blurId})` : null, class: "lm-holo-halo" }, bg) : null;
        const fill = svg("rect", { x: f1(bx0), y: f1(by_), width: 0, height: f1(bh), fill: col(tone), "fill-opacity": o.fill == null ? 0.45 : o.fill, stroke: col(tone), "stroke-width": 1.4 }, bg);
        const edge = svg("rect", { x: f1(bx0), y: f1(by_ - 3), width: 3, height: f1(bh + 6), fill: col(tone) }, bg);
        const vt = words(E, rg, fmt(vals[i]), { x: w - pad - valueW, y: ry, w: valueW, h: rh }, rt + 0.1, { role: vrole, tone: st && st !== "info" ? st : "ink", align: "right", weight: 700, cursor: false, dur: 0.1 });
        const tg = svg("g", {}, rg);                     // a status tag rides beside the bar's end (or inside a long bar)
        const at = rt + 0.15;
        R_.push({ g: rg, hi, bg, fill, halo, edge, value: vt, node: tspanOf(vt.text), tg, tag: null, tagW: 0, by: by_, y: ry, at,
          keys: [{ t: at, v: 0, d: 0 }, { t: at, v: vals[i], d: grow }] });
        note(at, at + grow, "count", name, true);
        reveal(E, rt);
      });
      const valAt = (keys, tt) => { let v = keys[0].v; for (let i = 1; i < keys.length; i++) { const k = keys[i]; if (tt <= k.t) break; v = lerp(v, k.v, k.d ? inOut((tt - k.t) / k.d) : 1); } return v; };
      const lenOf = (v) => (v > 0 ? Math.max(minLen, clamp(v / max, 0, 1) * L) : 0);
      onClock((tt) => {
        for (const r of R_) {
          const v = valAt(r.keys, tt), len = lenOf(v);
          setA(r.bg, "opacity", tt >= r.at ? "1" : "0");
          setA(r.fill, "width", f1(len)); if (r.halo) setA(r.halo, "width", f1(len));
          setA(r.edge, "x", f1(bx0 + Math.max(0, len - 3))); setA(r.edge, "opacity", len > 0 ? "1" : "0");
          const s = fmt(v); if (r.node.textContent !== s) r.node.textContent = s;
          if (r.tag) {                                   // after the bar's end when the track has room, else inside its start
            const after = bx0 + len + 10, x = after + r.tagW <= bx0 + L + 2 ? after : bx0 + 8;
            setA(r.tg, "transform", `translate(${f1(x)} 0)`);
          }
        }
      });
      const Hd = Object.assign({}, F, { E, t: cur + Math.max(0, rows.length - 1) * gap + grow + 0.2, rows: R_, max, track: { x: bx0, w: L } });
      const rowOf = (i) => { const r = R_[i]; if (!r) throw new Error(`${beat.id}: bars "${name}" has no row ${i}`); return r; };
      // a bar moves to a new value on the word (and its value counts with it)
      Hd.set = function (i, v, when, dur) {
        const r = rowOf(i), d = dur || 0.8;
        r.keys.push({ t: when, v: +v || 0, d }); r.keys.sort((a, b) => a.t - b.t);
        note(when, when + d, "count", name, true);
        return when + d;
      };
      // a bar takes a status: bar, edge and value recolour, the row lights, and the WORD shows in a tag beside the bar
      // (never the colour alone). mo: {word: "PICKED" | false, to}
      Hd.mark = function (i, status, when, mo) {
        const r = rowOf(i); mo = typeof mo === "number" ? { to: mo } : (mo || {});
        const c = col(status);
        Loom.set(r.fill, { attr: { fill: c, stroke: c } }, when); Loom.set(r.edge, { attr: { fill: c } }, when);
        if (r.halo) Loom.set(r.halo, { attr: { stroke: c } }, when);
        Loom.set(r.value.text, { attr: { fill: S().c(tok(status === "info" ? "ink" : status)) } }, when);
        Loom.set(r.hi, { attr: { fill: c } }, when);
        Loom.tween(r.hi, { opacity: 0 }, { opacity: mo.to == null ? 0.12 : mo.to, duration: 0.3 }, when, meta(name, "state"));
        const wd = mo.word === false ? null : (mo.word || (status !== "info" ? wordOf(status) || String(status).toUpperCase() : null));
        if (r.tag) Loom.tween(r.tag.g, { opacity: 1 }, { opacity: 0, duration: 0.12 }, when, meta(name, "state"));
        r.tag = null;
        if (wd) {
          const tw = K().measure(wd, "caption", 24, 700, "0.08em") + 52;
          r.tag = H.tag(E, r.tg, 0, r.y + (rh - 42) / 2, status, when + 0.12, { h: 42, w: tw, word: wd });
          r.tagW = r.tag.w;
          const vEnd = valAt(r.keys, 1e9), len = lenOf(vEnd);
          if (bx0 + len + 10 + r.tagW > bx0 + L + 2 && len < r.tagW + 16)
            Loom.warn("holo_bar_tag_room", `${beat.id}: bars "${name}" row ${i}: no room for the "${wd}" tag beside or inside its bar; widen the piece or shorten the word`);
        }
        return when + 0.3;
      };
      Hd.bar = (i) => { const r = rowOf(i); return { rect: { x: o.x + bx0, y: o.y + r.by, w: lenOf(valAt(r.keys, 1e9)), h: bh }, depth: E.__holo.depth, name: name + "_" + i }; };
      E.handle = Hd;
      return Hd;
    };

    // ---- a status tag: the word AND its colour (severity told twice), an outlined pill on a dark fill
    H.tag = function (E, parent, x, y, status, when, o) {
      o = o || {};
      const word = o.word || wordOf(status) || String(status).toUpperCase(), h = Math.max(42, o.h || 42);
      // room for the word at the role's largest size with its tracking, and 18 px either side (the layout check wants 6 px
      // between words and their shape; Chrome measured 3.5 px with the old 12 px inset and the tracking, 2026-10-16)
      const w = Math.max(o.w || 0, K().measure(word, "caption", 24, 700, "0.08em") + 52, 92);
      const g = svg("g", { opacity: 0 }, parent);
      svg("rect", { x: f1(x), y: f1(y), width: f1(w), height: f1(h), rx: 3, fill: S().c("field"), stroke: col(status), "stroke-width": 1.5 }, g);
      // at the caption floor (22 px): the check measures the inset on all four sides, and at 26 px the font box left 3.5 px above and
      // below in a 42 px tag (Chrome, 2026-10-16)
      K().text(g, word, { role: "caption", size: 22, x: x + 18, y, w: w - 36, h, align: "center", valign: "middle", maxLines: 1, color: tok(status), weight: 700, tracking: "0.08em" });
      Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.18 }, when, meta(E.name, "reveal"));
      return { g, w, h, end: when + 0.18 };
    };

    // ---- a briefing data card: a kicker, one large value (counts up, or rolls when `roll`), its unit, a one-line label.
    // One read: the value is the biggest thing on it.
    H.card = function (name, o) {
      o = o || {};
      const t = T0(o), F = H.frame(name, Object.assign({ register: "briefing" }, o)), E = F.E, w = o.w, h = o.h, g = svg("g", {}, E.body), pad = o.pad || 28;
      let y = pad - 4, cur = F.t - 0.1;
      if (o.kicker) { const k = words(E, g, String(o.kicker).toUpperCase(), { x: pad, y, w: w - 2 * pad, h: 36 }, cur, { role: "caption", tone: "muted", tracking: "0.1em" }); cur = k.end; y += 44; }
      const out = { E, t: cur, F };
      if (o.value != null) {
        const vh = Math.min(140, h - y - pad - (o.label ? 50 : 0));
        const unitW = o.unit ? Math.min(w * 0.4, K().measure(String(o.unit), "lead", 34) + 16) : 0;
        const vbox = { x: pad, y, w: w - 2 * pad - unitW, h: vh };
        const fmt = (v) => (typeof o.value === "number" ? Number(v).toFixed(o.decimals || 0) : String(v));
        const vw = words(E, g, fmt(o.value), vbox, cur, { role: o.valueRole || (vh >= 118 ? "hero" : vh >= 84 ? "title" : "lead"), tone: o.tone ? o.tone : "ink", weight: 700, cursor: false, dur: 0.15 });
        out.value = vw;
        if (o.unit) words(E, g, o.unit, { x: vw.fit.x + vw.fit.width + 12, y: y + vh * 0.38, w: unitW, h: vh * 0.5 }, cur + 0.1, { role: "lead", tone: "muted", cursor: false, dur: 0.12 });
        if (typeof o.value === "number" && o.count !== false) {          // the value counts to itself (or rolls) on its reveal
          const node = tspanOf(vw.text);
          const from = o.from != null ? o.from : 0, dur = o.countDur || (S().dur ? S().dur("count") : 1.0);
          Loom.drive((e, raw) => {
            const v = raw <= 0 ? from : lerp(from, o.value, e);
            node.textContent = o.roll && raw < 1 ? rollStr(fmt(o.value), raw) : fmt(v);
          }, cur, dur, "move", { kind: "count", beat: beat.id, name: name + ".value", content: true, key: "holocount:" + name });
          cur += dur;
        }
        y += vh + 6;
      }
      if (o.label) { const lb = words(E, g, o.label, { x: pad, y, w: w - 2 * pad, h: h - y - pad + 8 }, cur, { role: "label", tone: "muted", maxLines: o.labelLines || 2, valign: "top", cursor: false, dur: 0.15 }); cur = lb.end; }
      if (o.status) { const tg = H.tag(E, g, w - pad - 110, pad - 6, o.status, cur, { w: 110 }); cur = tg.end; }
      out.t = cur;
      out.status = (st, when) => { F.status(st, when); return H.tag(E, g, w - pad - 110, pad - 6, st, when, { w: 110 }).end; };
      E.handle = out;
      return out;
    };
    // rolling digits: characters settle right to left (mono digits, so nothing jitters); used only on reveals
    const GLY = "0123456789";
    function rollStr(final, p) {
      const n = final.length, settled = Math.floor(p * (n + 2));
      let s = "";
      for (let i = 0; i < n; i++) {
        const ch = final[i];
        if (n - 1 - i < settled || !/[0-9]/.test(ch)) s += ch;
        else s += GLY[(Loom.hash(final + i + Math.floor(p * 24)) >>> 0) % 10];
      }
      return s;
    }

    // ---- a readout: a log of rows with a time, the text and a status tag, scrolling up as rows arrive (a pure function of
    // time: the window shows `visible` rows). Returns {E, t, push(row, t), mark(i, status, t)}; a row is
    // {time, text, status} or [time, text, status]
    H.readout = function (name, o) {
      o = o || {};
      const t = T0(o), F = H.frame(name, o), E = F.E, w = o.w, h = o.h, pad = o.pad || 22, g = svg("g", {}, E.body);
      let top = pad, cur = F.t - 0.1;
      if (o.title) {
        const tt = words(E, g, String(o.title).toUpperCase(), { x: pad, y: top - 6, w: w - 2 * pad, h: 44 }, cur, { role: "label", tone: o.tone || "accent", tracking: "0.08em", weight: 700 });
        stroke(E, g, [[pad, top + 46], [w - pad, top + 46]], cur + 0.05, 0.4, { tone: o.tone || "accent", weight: 0.6, op: lineOp(E, 0.7), halo: false, part: "rule" });
        cur = tt.end; top += 62;
      }
      const rh = o.rowH || 52, n = o.visible || Math.max(1, Math.floor((h - top - pad + 6) / rh));
      const timeW = o.timeW == null ? Math.ceil(K().measure("00:00:00", "caption", 22) * 1.12 + 22) : o.timeW, tagW = o.tags === false ? 0 : 112;
      const rows = [];
      const norm = (r) => (Array.isArray(r) ? { time: r[0], text: r[1], status: r[2] } : r);
      const addRow = (r, when, pushed) => {
        r = norm(r);
        const i = rows.length, slot = Math.min(i, n - 1), ry = top + slot * rh;
        const rg = svg("g", {}, g);
        const bar = svg("rect", { x: pad - 8, y: f1(ry + 2), width: f1(w - 2 * pad + 16), height: f1(rh - 4), fill: col(r.status || "accent"), opacity: 0 }, rg);
        const inner = svg("g", { opacity: 0 }, rg);
        if (r.time != null && timeW) K().text(inner, String(r.time), { role: "caption", size: 22, x: pad, y: ry, w: timeW - 14, h: rh, valign: "middle", maxLines: 1, color: "muted" });
        K().text(inner, String(r.text), { role: "label", x: pad + timeW, y: ry, w: w - 2 * pad - timeW - tagW - 8, h: rh, valign: "middle", maxLines: 1, color: "ink" });
        let tg = null;
        if (r.status && tagW) tg = H.tag(E, inner, w - pad - tagW + 8, ry + (rh - 42) / 2, r.status, 0, { h: 42, w: tagW - 8 });
        if (tg) tg.g.setAttribute("opacity", 1);
        rows.push({ g: rg, inner, bar, at: when, pushed, slot, status: r.status });
        reveal(E, when);
        return i;
      };
      (o.rows || []).forEach((r, i) => addRow(r, cur + i * (o.stagger || 0.1), false));
      const pushes = [];                               // times rows arrive after the first fill
      const SCR = o.scroll || 0.35;
      // how many rows are in at time t (fractional while one slides in)
      const countAt = (tt) => {
        let c = 0;
        for (const r of rows) {
          if (!r.pushed) c += tt >= r.at ? 1 : 0;
          else c += smooth((tt - r.at) / SCR);
        }
        return c;
      };
      onClock((tt) => {
        const c = countAt(tt), s = Math.max(0, c - n);
        rows.forEach((r, i) => {
          const pos = i - s;                           // the row's slot now (0 at the top)
          let a;
          if (!r.pushed) a = tt >= r.at ? smooth((tt - r.at) / 0.18) : 0;
          else a = smooth((tt - r.at) / SCR);
          if (pos < 0) a *= clamp(1 + pos * 1.6, 0, 1);         // leaving at the top
          if (pos > n - 1) a *= clamp(n - pos, 0, 1);           // still sliding in at the bottom
          setA(r.inner, "opacity", a.toFixed(3));
          setA(r.g, "transform", `translate(0 ${f1((pos - r.slot) * rh)})`);
        });
      });
      const Hd = Object.assign({}, F, { E, t: cur + rows.length * (o.stagger || 0.1) + 0.2, visible: n, rowH: rh });
      Hd.push = function (r, when) { const i = addRow(r, when, true); pushes.push(when); note(when, when + SCR, "scroll", name, true); return i; };
      Hd.mark = function (i, status, when) {
        const r = rows[i]; if (!r) throw new Error(`${beat.id}: readout "${name}" has no row ${i}`);
        Loom.set(r.bar, { attr: { fill: col(status) } }, when);   // the colour changes at that time, so a row can be marked twice
        Loom.tween(r.bar, { opacity: 0 }, { opacity: 0.16, duration: 0.25 }, when, meta(name, "state"));
        return when + 0.25;
      };
      E.handle = Hd;
      return Hd;
    };

    // ---- a radial scanner: rings, ticks and cross hairs; a sweep that turns only inside its windows (at most 120 degrees a
    // second, so it reads as a search, not a spinner); blips appear when the sweep first passes them and then hold.
    // o: {cx, cy, r, at, sweeps: [[t0, t1]], speed, blips: [{angle, dist, status, at, label, labelSide}]}; a blip's label
    // is a word on a plate on the blip's outward side (or labelSide), lit with the blip
    H.scanner = function (name, o) {
      o = o || {};
      const r = o.r || 220, lh = o.label ? 58 : 0, t = T0(o);
      // blip labels (a word on a plate beside the blip, on its outward side) may reach past the rings: the element's box
      // grows to hold them, so the layout checks see them
      const bgeo = (o.blips || []).map((b) => {
        const a = (b.angle == null ? 0 : b.angle) * DEG - Math.PI / 2, d = clamp(b.dist == null ? 0.6 : b.dist, 0.05, 0.95);
        const x = Math.cos(a) * r * d, y = Math.sin(a) * r * d;
        let lab = null;
        if (b.label) {
          const lw = Math.max(70, K().measure(String(b.label), "caption", 22) + 34), right = b.labelSide ? b.labelSide !== "left" : Math.cos(a) >= -0.05;
          lab = { x: right ? x + 20 : x - 20 - lw, y: y - 21, w: lw, h: 42 };
        }
        return { a, d, x, y, lab };
      });
      let x0 = -r, y0 = -r, x1 = r, y1 = r;
      for (const q of bgeo) if (q.lab) { x0 = Math.min(x0, q.lab.x); y0 = Math.min(y0, q.lab.y); x1 = Math.max(x1, q.lab.x + q.lab.w); y1 = Math.max(y1, q.lab.y + q.lab.h); }
      y1 = Math.max(y1, r + lh);
      const box = { x: o.cx + x0, y: o.cy + y0, w: x1 - x0, h: y1 - y0 };
      const E = piece(name, box, "instrument", o), g = svg("g", {}, E.body), cx = -x0, cy = -y0;
      const pl = svg("circle", { cx, cy, r: r, fill: S().c("surface"), opacity: 0 }, g); fadeIn(pl, t, 0.3, E.__holo.look.plate * 0.6, name);
      if (o.label) words(E, g, String(o.label).toUpperCase(), { x: cx - r, y: cy + r + 14, w: 2 * r, h: 40 }, t + 0.5, { role: "caption", tone: "muted", align: "center", tracking: "0.1em" });
      const ring = (rr, k, d) => { const pts = []; for (let i = 0; i <= 96; i++) { const a = -Math.PI / 2 + i / 96 * TAU; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return stroke(E, g, pts, t + d, 0.5, { tone: k, weight: rr === r ? 1 : 0.55, op: lineOp(E, rr === r ? 1 : 0.5), halo: rr === r, part: "ring" }); };
      ring(r, "accent", 0); ring(r * 0.66, "line", 0.1); ring(r * 0.33, "line", 0.2);
      stroke(E, g, [[cx - r, cy], [cx + r, cy]], t + 0.3, 0.3, { tone: "line", weight: 0.5, op: lineOp(E, 0.45), halo: false, part: "cross" });
      stroke(E, g, [[cx, cy - r], [cx, cy + r]], t + 0.3, 0.3, { tone: "line", weight: 0.5, op: lineOp(E, 0.45), halo: false, part: "cross" });
      const tk = svg("g", { opacity: 0 }, g);
      for (let i = 0; i < 72; i++) { const a = i / 72 * TAU, l = i % 6 === 0 ? 14 : 6; svg("line", { x1: f1(cx + Math.cos(a) * r), y1: f1(cy + Math.sin(a) * r), x2: f1(cx + Math.cos(a) * (r - l)), y2: f1(cy + Math.sin(a) * (r - l)), stroke: col("line"), "stroke-width": 1.2 }, tk); }
      fadeIn(tk, t + 0.45, 0.3, +lineOp(E, 0.6), name);
      // the sweep: a beam and a short trail of fading spokes (no gradient, no filter: it reads in any renderer)
      const sweep = svg("g", { opacity: 0 }, g);
      const TR = 14;
      for (let i = TR; i >= 0; i--) {
        const a = -i * 2.2 * DEG;
        svg("line", { x1: cx, y1: cy, x2: f1(cx + Math.cos(a) * r * 0.98), y2: f1(cy + Math.sin(a) * r * 0.98), stroke: col("accent"), "stroke-width": i === 0 ? 2.4 : 3.4, opacity: i === 0 ? 0.95 : (0.22 * (1 - i / (TR + 1))).toFixed(3) }, sweep);
      }
      const speed = clamp(o.speed || 90, 10, 120) * DEG;     // radians a second
      const wins = (o.sweeps || []).map((w) => [w[0], w[1]]).sort((a, b) => a[0] - b[0]);
      const angAt = (tt) => {                                 // the sweep's angle: it turns only inside windows
        let a = -Math.PI / 2;
        for (const [a0, a1] of wins) { if (tt <= a0) break; a += (Math.min(tt, a1) - a0) * speed; }
        return a;
      };
      const inWin = (tt) => wins.some(([a0, a1]) => tt >= a0 && tt <= a1 + 0.25);
      for (const [a0, a1] of wins) { note(a0, a1, "scan", name, true); loop(a0, a1, name + " sweep"); }
      // blips: they light when the sweep first passes their angle after their own time (or at that time, with no sweep)
      const blips = (o.blips || []).map((b, k) => {
        const { a, lab } = bgeo[k], bx = cx + bgeo[k].x, by = cy + bgeo[k].y, bg = svg("g", { opacity: 0 }, g);
        svg("circle", { cx: f1(bx), cy: f1(by), r: 13, fill: "none", stroke: col(b.status || "accent"), "stroke-width": 1.6 }, bg);
        svg("circle", { cx: f1(bx), cy: f1(by), r: 5.5, fill: col(b.status || "accent") }, bg);
        if (lab) {                                      // the blip's label: a word on a plate, lit with the blip
          const lx = cx + lab.x, ly = cy + lab.y;
          svg("rect", { x: f1(lx), y: f1(ly), width: f1(lab.w), height: lab.h, fill: S().c("field"), opacity: 0.92, stroke: col(b.status || "accent"), "stroke-width": 1, "stroke-opacity": 0.6 }, bg);
          K().text(bg, String(b.label), { role: "caption", size: 22, x: lx + 12, y: ly, w: lab.w - 24, h: lab.h, valign: "middle", maxLines: 1, color: b.status && b.status !== "info" && b.status !== "accent" ? tok(b.status) : "ink" });
        }
        // when: the first sweep crossing of the blip's angle at or after b.at
        let when = b.at != null ? b.at : t;
        if (wins.length) {
          const norm = (x) => ((x % TAU) + TAU) % TAU;
          for (let tt = Math.max(when, wins[0][0]); tt < wins[wins.length - 1][1]; tt += 0.02) {
            if (!inWin(tt)) continue;
            if (Math.abs(norm(angAt(tt)) - norm(a)) < speed * 0.025) { when = tt; break; }
          }
        }
        Loom.tween(bg, { opacity: 0 }, { opacity: 1, duration: 0.15 }, when, meta(name, "reveal"));
        return { g: bg, x: bx + box.x, y: by + box.y, when, status: b.status };
      });
      onClock((tt) => {
        const on = inWin(tt) && tt >= t + 0.4;
        setA(sweep, "opacity", on ? "1" : "0");
        if (on) setA(sweep, "transform", `rotate(${(angAt(tt) / DEG).toFixed(2)} ${cx} ${cy})`);
      });
      const Hd = { E, t: t + 0.8, blips, center: [o.cx, o.cy], r };
      E.handle = Hd;
      return Hd;
    };

    // ---- target lock: four brackets that start large, turned and faint, and close on a target in 0.35 s, then one
    // budgeted flash; a tag names it. target: an element (E), a handle with .E, a mesh node, or a rect {x, y, w, h}.
    // Returns {E, t, release(t)}
    H.lock = function (target, o) {
      o = o || {};
      let rect = null, depth = o.depth;
      if (target && (target.E || target.inner)) { const T = target.E || target; rect = { x: T.x, y: T.y, w: T.w, h: T.h }; depth = depth || (T.__holo && T.__holo.depth); }
      else if (target && target.rect) { rect = target.rect; depth = depth || target.depth; }
      else rect = target;
      if (!rect) throw new Error(`${beat.id}: H.lock needs an element, a handle or a rect`);
      const pad = o.pad == null ? 12 : o.pad, x = rect.x - pad, y = rect.y - pad, w = rect.w + 2 * pad, h = rect.h + 2 * pad;
      const tagH = 42, name = o.name || "lock_" + (target.name || (target.E && target.E.name) || "rect");
      const E = piece(name, { x, y, w, h }, "mark", Object.assign({}, o, { depth: depth || "near" })), t = T0(o), dur = o.dur || 0.35;
      const g = svg("g", { opacity: 0 }, E.body), c = clamp(Math.min(w, h) * 0.22, 12, 30), tone = o.status || o.tone || "accent";
      const ps = [];
      for (const b of brackets(0, 0, w, h, c)) {
        if (C.glow) ps.push(svg("path", { d: dpath(b), fill: "none", stroke: col(tone), "stroke-width": (baseStroke() * 1.4 + C.halo_width * 2).toFixed(2), opacity: C.halo, filter: C.blur > 0 ? `url(#${blurId})` : null, class: "lm-holo-halo" }, g));
        ps.push(svg("path", { d: dpath(b), fill: "none", stroke: col(tone), "stroke-width": (baseStroke() * 1.4).toFixed(2), "stroke-linecap": "square" }, g));
      }
      const fl = flashSlot(t + dur, `${beat.id} lock ${name}`);
      const cx = w / 2, cy = h / 2, rel = { at: null };
      onClock((tt) => {
        if (tt < t) { setA(g, "opacity", "0"); return; }
        const p = outCubic((tt - t) / dur), k = lerp(1.6, 1, p), rot = lerp(45, 0, p);
        let a = lerp(0.3, 1, p);
        const fk = tt >= fl && tt < fl + 0.14 ? 1 - Math.abs((tt - fl) / 0.07 - 1) : 0;   // one flash: up and back in 0.14 s
        let sc = k;
        if (rel.at != null && tt >= rel.at) { const q = smooth((tt - rel.at) / 0.3); a *= 1 - q; sc *= 1 + 0.12 * q; }
        setA(g, "opacity", clamp(a, 0, 1).toFixed(3));
        setA(g, "transform", `translate(${f1(cx)} ${f1(cy)}) rotate(${rot.toFixed(2)}) scale(${(sc * (1 + 0.04 * fk)).toFixed(4)}) translate(${f1(-cx)} ${f1(-cy)})`);
        for (const p_ of ps) if (!p_.classList || !p_.getAttribute("class")) setA(p_, "stroke-width", (baseStroke() * (1.4 + 1.2 * fk)).toFixed(2));
      });
      note(t, t + dur, "lock", name, true);
      reveal(E, t);
      let end = fl + 0.14;
      if (o.label) {
        const ltxt = o.caps === false ? String(o.label) : String(o.label).toUpperCase();
        const lw = Math.max(160, K().measure(ltxt, "caption", 24, 700, "0.08em") + 40), lx = o.labelAlign === "right" ? w - lw : 0;
        const tg = svg("g", {}, E.body);
        // where the tag goes: above (default when there is room) or below, aligned to the left or right bracket
        const pos = o.labelPos || (y - tagH - 8 >= 20 ? "above" : "below");
        const ty = pos === "above" ? -tagH - 8 : h + 8;
        svg("rect", { x: f1(lx), y: ty, width: f1(lw), height: tagH, fill: S().c("field"), opacity: 0.92, stroke: col(tone), "stroke-width": 1.4 }, tg);
        const lb = words(E, tg, ltxt, { x: lx + 12, y: ty, w: lw - 24, h: tagH }, end, { role: "caption", tone, weight: 700, tracking: "0.08em" });
        tg.setAttribute("opacity", 0); Loom.tween(tg, { opacity: 0 }, { opacity: 1, duration: 0.12 }, end, meta(name, "reveal"));
        E.tagGroup = tg; end = lb.end;
      }
      if (o.sound && Loom.sfx) Loom.sfx("tick", t + dur, { g: 0.3 });
      const Hd = { E, t: end, rect };
      Hd.release = function (when) { rel.at = when; if (E.tagGroup) Loom.tween(E.tagGroup, { opacity: 1 }, { opacity: 0, duration: 0.2 }, when, meta(name, "exit")); note(when, when + 0.3, "lock", name, false); return when + 0.3; };
      E.handle = Hd;
      return Hd;
    };

    // ---- a wireframe globe: latitude and longitude lines in orthographic projection (front bright, back faint and
    // dashed), points on it, great-circle arcs that draw on with a lift, and traffic along them. It turns only inside
    // [spinFrom, spinTo] (o.spin degrees a second). o: {cx, cy, r, lat, lon, tilt, lon0, spin, spinFrom, spinTo,
    // points: [{id, lon, lat, label, status}], arcs: [{from, to, at, dur, status, lift, every, until}], at}
    H.globe = function (name, o) {
      o = o || {};
      const r = o.r || 240, box = { x: o.cx - r, y: o.cy - r, w: 2 * r, h: 2 * r }, t = T0(o);
      const E = piece(name, box, "instrument", o), g = svg("g", {}, E.body), cx = r, cy = r;
      const tilt = (o.tilt == null ? 18 : o.tilt) * DEG, lon0 = (o.lon0 || 0) * DEG, spin = (o.spin || 0) * DEG;
      const s0 = o.spinFrom == null ? t : o.spinFrom, s1 = o.spinTo == null ? (spin ? ctx.end : t) : o.spinTo;
      if (spin) { note(s0, s1, "spin", name, false); loop(s0, s1, name + " spin"); }
      const rotAt = (tt) => lon0 + spin * (clamp(tt, s0, s1) - s0);
      // a point (lon, lat) in radians -> [x, y, z] with z > 0 facing the viewer
      const proj = (lon, lat, rot, rr) => {
        const R_ = rr || r, l = lon + rot, x = Math.cos(lat) * Math.sin(l), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(l);
        const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
        return [cx + x * R_, cy - y2 * R_, z2];
      };
      const pl = svg("circle", { cx: r, cy: r, r: r, fill: S().c("surface"), opacity: 0 }, g); fadeIn(pl, t, 0.3, E.__holo.look.plate * 0.55, name);
      const rimPts = []; for (let i = 0; i <= 120; i++) { const a = -Math.PI / 2 + i / 120 * TAU; rimPts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
      stroke(E, g, rimPts, t, 0.6, { tone: "accent", part: "rim" });
      const nLat = o.lat || 5, nLon = o.lon || 12, lines = [];
      for (let i = 1; i <= nLat; i++) { const la = -Math.PI / 2 + i * Math.PI / (nLat + 1); lines.push({ kind: "lat", la }); }
      for (let j = 0; j < nLon; j++) lines.push({ kind: "lon", lo: j * TAU / nLon });
      const back = svg("path", { d: "", fill: "none", stroke: col("line"), "stroke-width": 1, "stroke-dasharray": "3 6", opacity: 0 }, g);
      const front = svg("path", { d: "", fill: "none", stroke: col("accent"), "stroke-width": (baseStroke() * 0.6 * E.__holo.look.stroke).toFixed(2), opacity: 0 }, g);
      fadeIn(back, t + 0.4, 0.5, +lineOp(E, 0.28), name);
      fadeIn(front, t + 0.3, 0.6, +lineOp(E, 0.7), name);
      const SAMP = 64;
      const meshD = (rot) => {
        let df = "", db = "";
        for (const L of lines) {
          let prev = null;
          for (let k = 0; k <= SAMP; k++) {
            const u = k / SAMP, P = L.kind === "lat" ? proj(u * TAU, L.la, rot) : proj(L.lo, -Math.PI / 2 + u * Math.PI, rot);
            const fr = P[2] >= 0, seg = `${f1(P[0])},${f1(P[1])}`;
            if (prev === null || prev !== fr) { if (fr) df += ` M${seg}`; else db += ` M${seg}`; }
            else { if (fr) df += ` L${seg}`; else db += ` L${seg}`; }
            prev = fr;
          }
        }
        return [df.trim(), db.trim()];
      };
      // land: a faint outline of the coastlines (Natural Earth 1:110m, runtime/geo.js's data), front side only, so the
      // points sit somewhere real. It needs the geography in the build (Loom.assets.geo: today a scene that names
      // Loom.geo gets it); o.land false leaves it out, o.land true asks for it and warns when it is missing
      const geo = (Loom.assets || {}).geo;
      let land = null, landD = null;
      if (o.land !== false && geo && geo.rings) {
        const rings = geo.__holoRings || (geo.__holoRings = geo.rings.map(([, flat]) => { const P = []; for (let i = 0; i < flat.length; i += 2) P.push([flat[i] / geo.scale * DEG, flat[i + 1] / geo.scale * DEG]); return P; }));
        land = svg("path", { d: "", fill: "none", stroke: col(o.landTone || "line"), "stroke-width": 1.3, "stroke-linejoin": "round", opacity: 0 }, g);
        fadeIn(land, t + 0.5, 0.6, +lineOp(E, o.landOpacity == null ? 0.6 : o.landOpacity), name);
        landD = (rot) => {
          let d = "";
          for (const P of rings) {
            let on = false;
            for (let k = 0; k <= P.length; k++) {
              const q = P[k % P.length], s_ = proj(q[0], q[1], rot);
              if (s_[2] < 0) { on = false; continue; }
              d += (on ? " L" : " M") + f1(s_[0]) + "," + f1(s_[1]); on = true;
            }
          }
          return d.trim();
        };
      } else if (o.land === true) Loom.warn("holo_globe_no_land", `${beat.id}: globe "${name}" asks for land but the build has no geography (Loom.assets.geo); a scene that uses Loom.geo (for example Loom.geo.city) gets it`);
      // arcs and their traffic draw in a layer UNDER the points and their labels, so a label always reads
      const ga = svg("g", { class: "lm-holo-arcs" }, g), gpt = svg("g", { class: "lm-holo-points" }, g);
      // points: each label goes on the point's inward side at rest (where the spin stops: over the disc, not out into the
      // pieces beside the globe), unless labelSide says;
      // labels that would overlap are stacked apart with a short leader (o.labels: "fixed" keeps them at their points)
      const restRot = lon0 + spin * Math.max(0, s1 - s0);
      const pts = {}, placed = [];
      const labelled = (o.points || []).filter((p) => p.label);
      if (labelled.length > 3) Loom.warn("holo_globe_dense", `${beat.id}: globe "${name}" labels ${labelled.length} points; the guide's limit is 3 (label the points the narration names; the labels were stacked around the rim)`);
      const plan = labelled.map((p) => {
        const P = proj((p.lon || 0) * DEG, (p.lat || 0) * DEG, restRot), lw = Math.max(70, K().measure(String(p.label), "caption", 22) + 34);
        const side = p.labelSide || (P[0] >= cx ? "left" : "right"), lx = side === "left" ? -lw - 16 : 16;   // inward: over the disc, clear of neighbours
        return { p, P, lw, lx, dy: 0, front: P[2] >= 0 };
      }).sort((a, b) => a.P[1] - b.P[1]);
      if (o.labels !== "fixed") {
        for (const q of plan) {
          if (!q.front) continue;
          const X0 = q.P[0] + q.lx, X1 = X0 + q.lw;
          for (let k = 0; k < 12; k++) {
            const Y0 = q.P[1] - 21 + q.dy;
            const hit = placed.find((b) => X0 < b.x1 + 6 && X1 > b.x0 - 6 && Y0 < b.y1 + 6 && Y0 + 42 > b.y0 - 6);
            if (!hit) break;
            q.dy = hit.y1 + 6 - (q.P[1] - 21);
          }
          placed.push({ x0: X0, x1: X1, y0: q.P[1] - 21 + q.dy, y1: q.P[1] + 21 + q.dy });
        }
      }
      const planOf = {}; for (const q of plan) planOf[q.p.id] = q;
      for (const p of o.points || []) {
        const pg = svg("g", { opacity: 0 }, gpt);
        const ring = svg("circle", { cx: 0, cy: 0, r: 10, fill: "none", stroke: col(p.status || "accent"), "stroke-width": 1.6 }, pg);
        svg("circle", { cx: 0, cy: 0, r: 4.5, fill: col(p.status || "accent") }, pg);
        let lab = null;
        if (p.label) {                                  // a label on a plate beside the point; it rides with it
          const q = planOf[p.id], lx = q.lx, dy = q.dy;
          lab = { x: lx, y: -21 + dy, w: q.lw, h: 42 };
          if (Math.abs(dy) > 2) svg("path", { d: `M${lx > 0 ? 10 : -10},0 L${f1(lx > 0 ? lx : lx + q.lw)},${f1(dy)}`, fill: "none", stroke: col(p.status || "accent"), "stroke-width": 1.2, opacity: 0.8 }, pg);
          svg("rect", { x: f1(lx), y: f1(-21 + dy), width: f1(q.lw), height: 42, fill: S().c("field"), opacity: 0.92 }, pg);
          K().text(pg, String(p.label), { role: "caption", size: 22, x: lx + 12, y: -21 + dy, w: q.lw - 24, h: 42, valign: "middle", maxLines: 1, color: "ink" });
        }
        pts[p.id] = { p, g: pg, ring, lab, lon: (p.lon || 0) * DEG, lat: (p.lat || 0) * DEG, at: p.at != null ? p.at : t + 0.7 };
      }
      const arcs = (o.arcs || []).map((a, i) => {
        const A = pts[a.from], B = pts[a.to];
        if (!A || !B) throw new Error(`${beat.id}: globe "${name}" arc ${i} names an unknown point`);
        const halo = C.glow ? svg("path", { d: "", fill: "none", stroke: col(a.status || "accent2"), "stroke-width": (2.2 + C.halo_width * 2).toFixed(2), "stroke-linecap": "round", opacity: 0, filter: C.blur > 0 ? `url(#${blurId})` : null, class: "lm-holo-halo" }, ga) : null;
        const path = svg("path", { d: "", fill: "none", stroke: col(a.status || "accent2"), "stroke-width": 2.2, "stroke-linecap": "round", opacity: 0 }, ga);
        const pk = svg("circle", { cx: 0, cy: 0, r: 5, fill: col("ink"), opacity: 0 }, ga);
        const at_ = a.at != null ? a.at : t + 1 + i * 0.4, dur = a.dur || 0.9;
        note(at_, at_ + dur, "draw", name + ".arc", true);
        if (a.every) { note(at_ + dur, a.until || ctx.end, "traffic", name + ".arc", false); if (i === 0) loop(at_ + dur, a.until || ctx.end, name + " traffic"); }
        return { a, A, B, path, halo, pk, at: at_, dur, every: a.every || 0, until: a.until == null ? ctx.end : a.until, lift: a.lift == null ? 0.18 : a.lift };
      });
      const v3 = (lon, lat) => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
      const slerp = (P, Q, u) => {
        const d = clamp(P[0] * Q[0] + P[1] * Q[1] + P[2] * Q[2], -1, 1), om = Math.acos(d);
        if (om < 1e-4) return P.slice();
        const s = Math.sin(om), a = Math.sin((1 - u) * om) / s, b = Math.sin(u * om) / s;
        return [P[0] * a + Q[0] * b, P[1] * a + Q[1] * b, P[2] * a + Q[2] * b];
      };
      const proj3 = (v, rot, lift) => {                 // a unit vector (in the globe's own frame) -> screen, lifted off the surface
        const lon = Math.atan2(v[0], v[2]), lat = Math.asin(clamp(v[1], -1, 1));
        return proj(lon, lat, rot, r * (1 + lift));
      };
      let lastRot = null;
      onClock((tt) => {
        const rot = rotAt(tt);
        if (rot !== lastRot) { const [df, db] = meshD(rot); setA(front, "d", df || "M0,0"); setA(back, "d", db || "M0,0"); if (land) setA(land, "d", landD(rot) || "M0,0"); lastRot = rot; }
        for (const id in pts) {
          const q = pts[id], P = proj(q.lon, q.lat, rot), vis = tt >= q.at ? smooth((tt - q.at) / 0.25) : 0;
          setA(q.g, "transform", `translate(${f1(P[0])} ${f1(P[1])})`);
          setA(q.g, "opacity", (vis * (P[2] >= 0 ? 1 : 0.25)).toFixed(3));
          q.x = box.x + P[0]; q.y = box.y + P[1];
        }
        for (const A_ of arcs) {
          if (tt < A_.at) { setA(A_.path, "opacity", "0"); if (A_.halo) setA(A_.halo, "opacity", "0"); setA(A_.pk, "opacity", "0"); continue; }
          const P = v3(A_.A.lon, A_.A.lat), Q = v3(A_.B.lon, A_.B.lat), upto = smooth((tt - A_.at) / A_.dur), N = 40;
          let d = "", vis = 0;
          for (let k = 0; k <= N; k++) {
            const u = k / N * upto, s = proj3(slerp(P, Q, u), rot, A_.lift * Math.sin(Math.PI * u));
            d += (k ? " L" : "M") + f1(s[0]) + "," + f1(s[1]); vis += s[2] >= -0.15 ? 1 : 0;
          }
          const op = vis / (N + 1) > 0.5 ? 1 : 0.35;
          setA(A_.path, "d", d); setA(A_.path, "opacity", (0.95 * op).toFixed(3));
          if (A_.halo) { setA(A_.halo, "d", d); setA(A_.halo, "opacity", (C.halo * op).toFixed(3)); }
          // traffic: a packet runs the arc every `every` seconds inside [at + dur, until]
          if (A_.every && tt >= A_.at + A_.dur && tt <= A_.until) {
            const ph = ((tt - A_.at - A_.dur) % A_.every) / A_.every, u = smooth(Math.min(1, ph * 1.25));
            const s = proj3(slerp(P, Q, u), rot, A_.lift * Math.sin(Math.PI * u));
            setA(A_.pk, "cx", f1(s[0])); setA(A_.pk, "cy", f1(s[1])); setA(A_.pk, "opacity", ph < 0.8 && s[2] >= -0.15 ? "0.95" : "0");
          } else setA(A_.pk, "opacity", "0");
        }
      });
      const Hd = { E, t: t + 0.9, point: (id) => pts[id], arcs };
      // a point as a lock target at a time (the globe may be turning: stop the spin before locking on)
      Hd.pointAt = function (id, when, size) {
        const q = pts[id]; if (!q) throw new Error(`${beat.id}: globe "${name}" has no point ${id}`);
        const P = proj(q.lon, q.lat, rotAt(when)), s_ = size || 34;
        if (spin && when < s1) Loom.warn("holo_lock_moving", `${beat.id}: a lock on "${id}" while globe "${name}" still turns (it spins until ${s1.toFixed(2)}s)`);
        return { rect: { x: box.x + P[0] - s_ / 2, y: box.y + P[1] - s_ / 2, w: s_, h: s_ }, depth: E.__holo.depth, name: name + "_" + id };
      };
      // a point takes a status (its ring and dot recolour, once)
      Hd.status = function (id, st, when) { const q = pts[id]; if (!q) throw new Error(`${beat.id}: globe "${name}" has no point ${id}`); for (const n of q.g.childNodes) Loom.set(n, { attr: n.getAttribute("fill") === "none" ? { stroke: col(st) } : { fill: col(st) } }, when); return when; };
      E.handle = Hd;
      return Hd;
    };

    // ---- a network mesh: nodes (hexagons with a label on a plate), links that draw on in order, packets along paths
    // (traffic), and states on the word. o: {x, y, w, h, nodes: [{id, x, y, label, status, r}], links: [[a, b], ...],
    // traffic: [{path: [ids], at, dur, status, every, until}], at}. Returns {E, t, node(id), set(id, status, t), link(a, b),
    // send(path, t, {dur, status})}
    H.mesh = function (name, o) {
      o = o || {};
      const E = piece(name, o, "instrument", o), t = T0(o), g = svg("g", {}, E.body), gl = svg("g", {}, g), ge = svg("g", { class: "lm-holo-emph" }, g), gn = svg("g", {}, g), gp = svg("g", {}, g);
      const N = {}, hex = (x, y, rr) => { const p = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } return p; };
      (o.nodes || []).forEach((n, i) => { N[n.id] = Object.assign({ i, r: n.r || 22 }, n); });
      // reveal order: nodes left to right, each link after both its ends
      const order = Object.values(N).sort((a, b) => a.x - b.x || a.y - b.y);
      const span = o.by != null ? Math.max(0.4, o.by - t) : Math.min(1.6, 0.2 + order.length * 0.12);
      order.forEach((n, k) => { n.at = t + span * 0.6 * (k / Math.max(1, order.length - 1)); });
      for (const n of order) {
        const ng = svg("g", {}, gn); n.g = ng;
        n.plateEl = svg("polygon", { points: hex(n.x, n.y, n.r).map((p) => f1(p[0]) + "," + f1(p[1])).join(" "), fill: S().c("surface"), opacity: 0 }, ng);
        fadeIn(n.plateEl, n.at, 0.2, 1, name);
        const hs = stroke(E, ng, hex(n.x, n.y, n.r), n.at, 0.3, { closed: true, tone: n.status || "accent", part: "node" });
        n.edge = hs.p; n.edgeHalo = hs.halo;
        n.core = svg("circle", { cx: f1(n.x), cy: f1(n.y), r: f1(n.r * 0.28), fill: col(n.status || "accent"), opacity: 0 }, ng);
        fadeIn(n.core, n.at + 0.2, 0.2, 0.9, name);
        if (n.label) {
          const lw = Math.max(80, K().measure(String(n.label), "caption", 22) + 34), ly = n.labelBelow === false ? n.y - n.r - 46 : n.y + n.r + 10;
          const lx = clamp(n.x - lw / 2, 0, o.w - lw), lg = svg("g", {}, ng);
          svg("rect", { x: f1(lx), y: f1(ly), width: f1(lw), height: 36, fill: S().c("field"), opacity: 0.88 }, lg);
          n.labelText = words(E, lg, n.label, { x: lx + 12, y: ly, w: lw - 24, h: 36 }, n.at + 0.2, { role: "caption", tone: "ink", align: "center", cursor: false, dur: 0.12 });
          lg.setAttribute("opacity", 0); fadeIn(lg, n.at + 0.2, 0.15, 1, name);
        }
      }
      const LK = {};
      (o.links || []).forEach(([a, b, st], k) => {
        const A = N[a], B = N[b];
        if (!A || !B) throw new Error(`${beat.id}: mesh "${name}" link ${k} names an unknown node`);
        const L = Math.hypot(B.x - A.x, B.y - A.y) || 1, ux = (B.x - A.x) / L, uy = (B.y - A.y) / L;
        const p0 = [A.x + ux * A.r, A.y + uy * A.r], p1 = [B.x - ux * B.r, B.y - uy * B.r];
        const when = Math.max(A.at, B.at) + 0.15;
        const s = stroke(E, gl, [p0, p1], when, clamp(L / 1400, 0.15, 0.5), { tone: st || "line", weight: 0.75, op: lineOp(E, 0.75), halo: false, part: "link" });
        LK[a + ">" + b] = LK[b + ">" + a] = { p: s.p, A, B, p0, p1, key: a + ">" + b, op: +lineOp(E, 0.75), on: false, dim: false };
      });
      const sends = [];
      const pathPts = (ids) => ids.map((id) => { if (!N[id]) throw new Error(`${beat.id}: mesh "${name}" path names an unknown node ${id}`); return [N[id].x, N[id].y]; });
      function send(ids, when, so) {
        so = so || {};
        const P = pathPts(ids); let Ltot = 0; const cum = [0];
        for (let i = 1; i < P.length; i++) { Ltot += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); cum.push(Ltot); }
        const pk = svg("g", { opacity: 0 }, gp);
        svg("circle", { cx: 0, cy: 0, r: 11, fill: col(so.status || "accent"), opacity: 0.22 }, pk);
        svg("circle", { cx: 0, cy: 0, r: 5.5, fill: col(so.status === "info" || !so.status ? "ink" : so.status) }, pk);
        const dur = so.dur || clamp(Ltot / 700, 0.6, 2.4);
        sends.push({ P, cum, Ltot, pk, at: when, dur, every: so.every || 0, until: so.until == null ? when + dur : so.until });
        note(when, so.every ? (so.until || ctx.end) : when + dur, "traffic", name, true);
        if (so.every) loop(when, so.until || ctx.end, name + " traffic");
        return when + dur;
      }
      (o.traffic || []).forEach((tr) => send(tr.path, tr.at != null ? tr.at : t + span + 0.3, tr));
      onClock((tt) => {
        for (const s of sends) {
          let ph = -1;
          if (tt >= s.at && tt <= s.until + s.dur) {
            if (s.every) { const k = Math.floor((tt - s.at) / s.every); const st = s.at + k * s.every; if (st <= s.until) ph = (tt - st) / s.dur; }
            else ph = (tt - s.at) / s.dur;
          }
          if (!(ph >= 0 && ph <= 1)) { setA(s.pk, "opacity", "0"); continue; }
          const d = inOut(ph) * s.Ltot; let i = 1; while (i < s.cum.length - 1 && s.cum[i] < d) i++;
          const u = (d - s.cum[i - 1]) / ((s.cum[i] - s.cum[i - 1]) || 1), x = lerp(s.P[i - 1][0], s.P[i][0], u), y = lerp(s.P[i - 1][1], s.P[i][1], u);
          setA(s.pk, "transform", `translate(${f1(x)} ${f1(y)})`);
          setA(s.pk, "opacity", (ph < 0.08 ? ph / 0.08 : ph > 0.92 ? (1 - ph) / 0.08 : 1).toFixed(3));
        }
      });
      const Hd = { E, t: t + span + 0.4, nodes: N };
      // a node as a lock target (its rect in the HUD's coordinates)
      Hd.node = (id) => { const n = N[id]; if (!n) throw new Error(`${beat.id}: mesh "${name}" has no node ${id}`); return { rect: { x: o.x + n.x - n.r, y: o.y + n.y - n.r, w: 2 * n.r, h: 2 * n.r }, depth: E.__holo.depth, name: name + "_" + id }; };
      Hd.set = function (id, st, when) {
        const n = N[id]; if (!n) throw new Error(`${beat.id}: mesh "${name}" has no node ${id}`);
        Loom.set(n.edge, { attr: { stroke: col(st) } }, when); Loom.set(n.core, { attr: { fill: col(st) } }, when);
        if (n.edgeHalo) Loom.set(n.edgeHalo, { attr: { stroke: col(st) } }, when);
        return when;
      };
      Hd.link = (a, b) => LK[a + ">" + b];
      // a link takes a status. A status other than line or idle EMPHASISES it (so one link stands out among fifty): a
      // heavier stroke (lo.weight, default 2.6 x a link) with a glow, drawn above the other links; lo.dim fades every
      // other link to that opacity on the same word; lo.emphasis false is the colour change alone. A later call with
      // "line" or "idle" takes the emphasis away (and lifts the dim).
      Hd.linkStatus = function (a, b, st, when, lo) {
        lo = lo || {};
        const l = LK[a + ">" + b]; if (!l) throw new Error(`${beat.id}: mesh "${name}" has no link ${a}-${b}`);
        Loom.set(l.p, { attr: { stroke: col(st) } }, when);
        const emph = lo.emphasis !== false && st && st !== "line" && st !== "idle";
        if (emph && !l.em) {
          const d = dpath([l.p0, l.p1]), k = lo.weight || 2.6, wv = (baseStroke() * 0.75 * E.__holo.look.stroke * k).toFixed(2);
          l.em = {
            halo: C.glow ? svg("path", { d, fill: "none", stroke: col(st), "stroke-width": (+wv + C.halo_width * 2.6).toFixed(2), "stroke-linecap": "round", opacity: 0, filter: C.blur > 0 ? `url(#${blurId})` : null, class: "lm-holo-halo" }, ge) : null,
            line: svg("path", { d, fill: "none", stroke: col(st), "stroke-width": wv, "stroke-linecap": "round", opacity: 0 }, ge),
          };
        }
        if (l.em) {
          for (const n of [l.em.line, l.em.halo]) if (n) Loom.set(n, { attr: { stroke: col(st) } }, when);
          if (emph !== l.on) {
            const up = emph, haloTo = Math.min(1, C.halo * 2.2);
            Loom.tween(l.em.line, { opacity: up ? 0 : 1 }, { opacity: up ? 1 : 0, duration: 0.3 }, when, meta(name, "state"));
            if (l.em.halo) Loom.tween(l.em.halo, { opacity: up ? 0 : haloTo }, { opacity: up ? haloTo : 0, duration: 0.3 }, when, meta(name, "state"));
            l.on = emph;
          }
        }
        const dimTo = lo.dim;
        const seen = new Set();
        for (const k in LK) {
          const m = LK[k];
          if (seen.has(m) || m === l) continue;
          seen.add(m);
          if (emph && dimTo != null && !m.dim && !m.on) { Loom.tween(m.p, { opacity: m.op }, { opacity: dimTo, duration: 0.4 }, when, meta(name, "state")); m.dim = dimTo; }
          else if (!emph && m.dim !== false && !Object.values(LK).some((z) => z !== l && z.on)) { Loom.tween(m.p, { opacity: m.dim }, { opacity: m.op, duration: 0.4 }, when, meta(name, "state")); m.dim = false; }
        }
        return when + 0.3;
      };
      Hd.send = send;
      E.handle = Hd;
      return Hd;
    };

    // ---- a waveform: a signal that runs right to left inside [t0, t1] (still outside it), a baseline with ticks, and an
    // anomaly window where the signal spikes and turns a status colour. o: {x, y, w, h, at, t0, t1, freq, amp, seed,
    // speed, anomaly: {at, dur, status, x: 0..1}, label}
    H.wave = function (name, o) {
      o = o || {};
      const F = H.frame(name, Object.assign({ kind: "instrument" }, o)), E = F.E, t = T0(o), w = o.w, h = o.h, g = svg("g", {}, E.body), pad = o.pad || 22;
      let top = pad;
      if (o.label) { words(E, g, String(o.label).toUpperCase(), { x: pad, y: top - 6, w: w - 2 * pad, h: 40 }, F.t - 0.1, { role: "caption", tone: "muted", tracking: "0.1em" }); top += 40; }
      const x0 = pad, x1 = w - pad, ym = top + (h - top - pad) / 2, A = (o.amp == null ? 0.32 : o.amp) * (h - top - pad);
      stroke(E, g, [[x0, ym], [x1, ym]], t + 0.2, 0.4, { tone: "line", weight: 0.5, op: lineOp(E, 0.4), halo: false, part: "base" });
      const tg = svg("g", { opacity: 0 }, g);
      for (let i = 0; i <= 12; i++) { const x = lerp(x0, x1, i / 12); svg("line", { x1: f1(x), y1: f1(ym - 6), x2: f1(x), y2: f1(ym + 6), stroke: col("line"), "stroke-width": 1 }, tg); }
      fadeIn(tg, t + 0.3, 0.3, +lineOp(E, 0.5), name);
      const rng = Loom.rng("holowave:" + (o.seed || name)), comps = [0, 1, 2].map((k) => ({ f: (o.freq || 3) * (1 + k * 1.7 + rng() * 0.5), a: [1, 0.45, 0.22][k], ph: rng() * TAU }));
      const NS = 140, speed = o.speed == null ? 0.6 : o.speed, w0 = o.t0 == null ? t : o.t0, w1 = o.t1 == null ? ctx.end : o.t1;
      note(w0, w1, "signal", name, false); loop(w0, w1, name + " signal");
      const sig = svg("path", { d: "", fill: "none", stroke: col("accent"), "stroke-width": (baseStroke() * 0.9).toFixed(2), "stroke-linejoin": "round", opacity: 0 }, g);
      const hot = svg("path", { d: "", fill: "none", stroke: col((o.anomaly && o.anomaly.status) || "accent2"), "stroke-width": (baseStroke() * 1.2).toFixed(2), "stroke-linejoin": "round", opacity: 0 }, g);
      const halo = C.glow ? svg("path", { d: "", fill: "none", stroke: col("accent"), "stroke-width": (baseStroke() + C.halo_width * 2).toFixed(2), opacity: 0, filter: C.blur > 0 ? `url(#${blurId})` : null, class: "lm-holo-halo" }, g) : null;
      if (halo) g.insertBefore(halo, sig);
      fadeIn(sig, t + 0.3, 0.4, 0.95, name); if (halo) fadeIn(halo, t + 0.4, 0.4, C.halo, name);
      const an = o.anomaly;
      if (an) note(an.at, an.at + (an.dur || 1.5), "anomaly", name, true);
      let last = null;
      onClock((tt) => {
        const ph = (clamp(tt, w0, w1) - w0) * speed;
        const sp = an && tt >= an.at ? smooth((tt - an.at) / 0.4) * (1 - smooth((tt - an.at - (an.dur || 1.5)) / 0.6)) : 0;
        const key = ph.toFixed(4) + ":" + sp.toFixed(3);
        if (key === last) return;
        last = key;
        let d = "", dh = "";
        const ax = an ? (an.x == null ? 0.7 : an.x) : 0;
        for (let i = 0; i <= NS; i++) {
          const u = i / NS, x = lerp(x0, x1, u);
          let v = 0; for (const c of comps) v += c.a * Math.sin(c.f * (u * TAU) + c.ph + ph * c.f);
          const bump = sp * Math.exp(-Math.pow((u - ax) / 0.035, 2)) * 2.2 * Math.sin(u * 180);
          const y = ym - (v / 1.67 + bump) * A;
          d += (i ? " L" : "M") + f1(x) + "," + f1(y);
          if (an && Math.abs(u - ax) < 0.09) dh += (dh ? " L" : "M") + f1(x) + "," + f1(y);
        }
        setA(sig, "d", d); if (halo) setA(halo, "d", d); setA(hot, "d", dh || "M0,0");
        setA(hot, "opacity", clamp(sp * 1.5, 0, 1).toFixed(3));      // the status colour lasts as long as the anomaly
      });
      const Hd = Object.assign({}, F, { E, t: t + 0.7 });
      E.handle = Hd;
      return Hd;
    };

    // ---- a grid layer: hex or dot cells as ONE pattern (not one node per cell), still. A far-layer texture for the
    // analysis register, or the floor of a twin. o: {x, y, w, h, kind: "hex" | "dot", cell, opacity, at, depth}
    H.grid = function (name, o) {
      o = o || {};
      const E = piece(name, o, "scenery", Object.assign({ depth: "far" }, o)), t = T0(o), cell = o.cell || (o.kind === "dot" ? 32 : 36);
      const id = "lmholo_pat_" + beat.id + "_" + name, pd = svg("defs", {}, E.body);
      let pat;
      if (o.kind === "dot") {
        pat = svg("pattern", { id, x: 0, y: 0, width: cell, height: cell, patternUnits: "userSpaceOnUse" }, pd);
        svg("circle", { cx: cell / 2, cy: cell / 2, r: 1.8, fill: col("line") }, pat);
      } else {
        const s = cell, hh = s * Math.sqrt(3);
        pat = svg("pattern", { id, x: 0, y: 0, width: f1(s * 3), height: f1(hh), patternUnits: "userSpaceOnUse" }, pd);
        const hx = (x, y) => { const p = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.push([x + Math.cos(a) * s, y + Math.sin(a) * s]); } return dpath(p, true); };
        svg("path", { d: hx(0, 0) + " " + hx(s * 1.5, hh / 2) + " " + hx(s * 3, 0) + " " + hx(0, hh) + " " + hx(s * 3, hh), fill: "none", stroke: col("line"), "stroke-width": 1 }, pat);
      }
      const rect = svg("rect", { x: 0, y: 0, width: o.w, height: o.h, fill: `url(#${id})`, opacity: 0 }, E.body);
      fadeIn(rect, t, 0.6, o.opacity == null ? 0.18 : o.opacity, name);
      reveal(E, t);
      return { E, t: t + 0.6 };
    };

    // ---- a timeline scrubber: a track with ticks, events as diamonds with their labels (alternating above and below),
    // and a playhead that moves on the word. o: {x, y, w, h, start, end (labels), events: [{at: 0..1, label, status}],
    // head: [{t, to: 0..1}], at}. Events light when the head first passes them (or in order on reveal with no head).
    H.scrubber = function (name, o) {
      o = o || {};
      const E = piece(name, o, "instrument", o), t = T0(o), g = svg("g", {}, E.body), w = o.w, h = o.h, pad = 20;
      const ty = h / 2, x0 = pad, x1 = w - pad, X = (u) => lerp(x0, x1, clamp(u, 0, 1));
      const tr = stroke(E, g, [[x0, ty], [x1, ty]], t, 0.6, { tone: "accent", weight: 0.8, part: "track" });
      const tk = svg("g", { opacity: 0 }, g);
      for (let i = 0; i <= 24; i++) { const x = X(i / 24), l = i % 6 === 0 ? 12 : 6; svg("line", { x1: f1(x), y1: f1(ty - l), x2: f1(x), y2: f1(ty + l), stroke: col("line"), "stroke-width": 1.2 }, tk); }
      fadeIn(tk, t + 0.3, 0.3, +lineOp(E, 0.7), name);
      if (o.start) words(E, g, o.start, { x: x0, y: ty + 18, w: 220, h: 34 }, tr.end, { role: "caption", tone: "muted", cursor: false });
      if (o.end) words(E, g, o.end, { x: x1 - 220, y: ty + 18, w: 220, h: 34 }, tr.end, { role: "caption", tone: "muted", align: "right", cursor: false });
      const keys = (o.head || []).slice().sort((a, b) => a.t - b.t), hdur = o.headDur || 0.9;
      const headAt = (tt) => { let u = keys.length ? 0 : 1, prevT = -1e9; for (const k of keys) { if (tt <= k.t) break; const p = inOut((tt - k.t) / Math.min(hdur, Math.max(0.2, k.t - prevT))); u = lerp(u, k.to, clamp(p, 0, 1)); prevT = k.t; } return u; };
      const evs = (o.events || []).map((ev, i) => {
        const x = X(ev.at), up = i % 2 === 0, eg = svg("g", { opacity: 0 }, g);
        const d = 9, st = ev.status || "accent";
        svg("polygon", { points: `${f1(x)},${f1(ty - d)} ${f1(x + d)},${f1(ty)} ${f1(x)},${f1(ty + d)} ${f1(x - d)},${f1(ty)}`, fill: S().c("field"), stroke: col(st), "stroke-width": 1.8 }, eg);
        svg("line", { x1: f1(x), y1: f1(up ? ty - d : ty + d), x2: f1(x), y2: f1(up ? ty - 40 : ty + 40), stroke: col(st), "stroke-width": 1, opacity: 0.7 }, eg);
        const lw = Math.max(100, K().measure(String(ev.label), "caption", 22) + 34), lx = clamp(x - lw / 2, 0, w - lw), ly = up ? ty - 40 - 42 : ty + 40;
        svg("rect", { x: f1(lx), y: f1(ly), width: f1(lw), height: 42, fill: S().c("surface"), opacity: 0.92 }, eg);
        K().text(eg, String(ev.label), { role: "caption", x: lx + 13, y: ly, w: lw - 26, h: 42, align: "center", valign: "middle", maxLines: 1, color: tok(st === "accent" ? "ink" : st) });
        // when: the head first reaches it, else in order after the track
        let when = tr.end + 0.12 * i;
        if (keys.length) { for (let tt = t; tt < keys[keys.length - 1].t + hdur + 0.05; tt += 0.02) if (headAt(tt) >= ev.at - 1e-3) { when = tt; break; } }
        if (ev.when != null) when = ev.when;
        Loom.tween(eg, { opacity: 0 }, { opacity: 1, duration: 0.2 }, when, meta(name, "reveal"));
        return { g: eg, x, when };
      });
      let head = null;
      if (keys.length) {
        head = svg("g", { opacity: 0 }, g);
        svg("line", { x1: 0, y1: f1(ty - 30), x2: 0, y2: f1(ty + 30), stroke: col("ink"), "stroke-width": 2 }, head);
        svg("polygon", { points: `-8,${f1(ty - 38)} 8,${f1(ty - 38)} 0,${f1(ty - 28)}`, fill: col("ink") }, head);
        fadeIn(head, tr.end, 0.2, 1, name);
        for (const k of keys) note(k.t, k.t + hdur, "move", name + ".head", true);
        onClock((tt) => setA(head, "transform", `translate(${f1(X(headAt(tt)))} 0)`));
      }
      reveal(E, t);
      const Hd = { E, t: tr.end + 0.2, events: evs, x: (u) => o.x + X(u), y: o.y + ty };
      E.handle = Hd;
      return Hd;
    };

    // ---- a gauge: a ring (or a 270 degree arc) with its value in the centre and a label under it; the colour follows
    // thresholds (warn, alert), so a value crossing a limit turns amber or red without a second call (high-performance
    // HMI: colour only when abnormal). Presets RED and USE name the classic monitoring numbers.
    // o: {cx, cy, r, value, max, unit, label, warn, alert, kind: "ring" | "arc", decimals, at, invert}
    H.gauge = function (name, o) {
      o = o || {};
      const r = o.r || 110, lab = o.label ? 46 : 0, box = { x: o.cx - r - 8, y: o.cy - r - 8, w: 2 * r + 16, h: 2 * r + 16 + lab }, t = T0(o);
      const E = piece(name, box, "instrument", o), g = svg("g", {}, E.body), cx = r + 8, cy = r + 8, max = o.max || 100;
      const arc = o.kind === "ring" ? 360 : 270, a0 = o.kind === "ring" ? -90 : 135;
      const pts = (u, rr) => { const n = Math.max(2, Math.ceil(arc * u / 3)), P = []; for (let i = 0; i <= n; i++) { const a = (a0 + arc * u * i / n) * DEG; P.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return P; };
      const pl = svg("circle", { cx, cy, r: r - 2, fill: S().c("surface"), opacity: 0 }, g); fadeIn(pl, t, 0.3, E.__holo.look.plate * 0.7, name);
      stroke(E, g, pts(1, r), t, 0.5, { tone: "line", w: 8, op: lineOp(E, 0.22), halo: false, cap: "butt", part: "track" });
      const tkg = svg("g", { opacity: 0 }, g);
      for (let i = 0; i <= 10; i++) { const a = (a0 + arc * i / 10) * DEG; svg("line", { x1: f1(cx + Math.cos(a) * (r + 7)), y1: f1(cy + Math.sin(a) * (r + 7)), x2: f1(cx + Math.cos(a) * (r + 13)), y2: f1(cy + Math.sin(a) * (r + 13)), stroke: col("line"), "stroke-width": 1.2 }, tkg); }
      fadeIn(tkg, t + 0.2, 0.3, +lineOp(E, 0.6), name);
      const val = svg("path", { d: "", fill: "none", stroke: col("accent"), "stroke-width": 8, "stroke-linecap": "butt", opacity: 0 }, g);
      fadeIn(val, t + 0.3, 0.1, 1, name);
      const toneOf = (v) => { const inv = !!o.invert; if (o.alert != null && (inv ? v <= o.alert : v >= o.alert)) return "alert"; if (o.warn != null && (inv ? v <= o.warn : v >= o.warn)) return "warn"; return o.okTone || "accent"; };
      const fmt = (v) => Number(v).toFixed(o.decimals || 0);
      // the unit: on a small gauge (r under 100) it sits UNDER the value, smaller and muted ("0.41" over "s", "1234" over
      // "/s"), so the two never run together; "%" stays beside it ("5.8%"); on a large gauge it follows with a space
      // ("210 ms"). o.unitPos "below" | "inline" and o.unitSep override
      const unit = o.unit || "", below = !!unit && (o.unitPos ? o.unitPos === "below" : r < 100 && !/^[%°]/.test(unit));
      const tail = unit && !below ? unitSep(unit, o.unitSep) + unit : "";
      const numG = svg("g", {}, g);
      const vbox = below ? { x: cx - r * 0.72, y: cy - r * 0.62, w: r * 1.44, h: Math.max(46, r * 0.68) } : { x: cx - r * 0.72, y: cy - r * 0.42, w: r * 1.44, h: r * 0.84 };
      const nt = words(E, numG, fmt(o.value || 0) + tail, vbox, t + 0.3, { role: o.valueRole || (r >= 140 ? "title" : "lead"), tone: "ink", align: "center", weight: 700, cursor: false, dur: 0.1 });
      if (below) words(E, numG, unit, { x: cx - r * 0.55, y: vbox.y + vbox.h + 2, w: r * 1.1, h: 32 }, t + 0.35, { role: "caption", tone: "muted", align: "center", cursor: false, dur: 0.1 });
      const node = tspanOf(nt.text);
      if (o.label) words(E, g, o.label, { x: 0, y: 2 * r + 20, w: 2 * r + 16, h: 40 }, t + 0.35, { role: "caption", tone: "muted", align: "center", cursor: false, dur: 0.12 });
      const keys = [{ t: t + 0.3, v: o.from != null ? o.from : 0, d: 0 }, { t: t + 0.3, v: o.value || 0, d: o.countDur || 1.0 }];
      const valAt = (tt) => { let v = keys[0].v; for (let i = 1; i < keys.length; i++) { const k = keys[i]; if (tt <= k.t) break; v = lerp(v, k.v, k.d ? inOut((tt - k.t) / k.d) : 1); } return v; };
      onClock((tt) => {
        const v = valAt(tt), u = clamp(v / max, 0, 1);
        setA(val, "d", u > 0.002 ? dpath(pts(u, r)) : "M0,0");
        const c = col(toneOf(v));
        setA(val, "stroke", c);
        node.textContent = fmt(v) + tail;
        setA(nt.text, "fill", S().c(tok(toneOf(v) === (o.okTone || "accent") ? "ink" : toneOf(v))));
      });
      note(t + 0.3, t + 0.3 + (o.countDur || 1.0), "count", name, true);
      reveal(E, t);
      const Hd = { E, t: t + 1.3 };
      Hd.set = function (v, when, dur) { keys.push({ t: when, v, d: dur || 1.0 }); keys.sort((a, b) => a.t - b.t); note(when, when + (dur || 1.0), "count", name, true); return when + (dur || 1.0); };
      E.handle = Hd;
      return Hd;
    };
    // the monitoring presets: RED for a service (rate, errors, duration), USE for a machine (utilisation, saturation, errors)
    H.gauges = function (name, o) {
      o = o || {};
      const set = o.preset === "USE" ? [["Utilisation", "%", 100, 80, 95], ["Saturation", "", 10, 4, 8], ["Errors", "/m", 50, 5, 20]]
        : [["Rate", "/s", 2000, null, null], ["Errors", "%", 10, 1, 5], ["Duration", "ms", 1000, 300, 600]];
      const vals = o.values || [], r = o.r || 92, gap = o.gap || 56, out = [];
      // per gauge: decimals, units and maxima may be lists (one each), or one value for all three
      const each = (v, i) => (Array.isArray(v) ? v[i] : v);
      set.forEach(([lab, unit, max, warn, alert], i) => {
        out.push(H.gauge(name + "_" + i, { cx: o.x + r + 8 + i * (2 * r + 16 + gap), cy: o.y + r + 8, r, value: vals[i] || 0,
          max: each(o.max, i) != null ? each(o.max, i) : max, unit: each(o.units, i) != null ? each(o.units, i) : unit, label: (o.labels && o.labels[i]) || lab,
          warn, alert, at: T0(o) + i * 0.15, depth: o.depth, decimals: each(o.decimals, i), unitPos: o.unitPos, unitSep: o.unitSep }));
      });
      return out;
    };

    // ---- a callout: a ring on the target, a leader (diagonal, then a shoulder), a plate with the words. The leader always
    // ends ON the thing it names. o: {to: [x, y] (the target), at: time, from: [x, y] (the plate's anchor), text, status,
    // side: "right" | "left", w}
    H.callout = function (name, o) {
      o = o || {};
      const [tx, ty] = o.to, [ax, ay] = o.from || [tx + 160, ty - 120], side = o.side || (ax >= tx ? "right" : "left");
      const fit = K().fit(String(o.text), { role: o.role || "label", w: o.w || 360, maxLines: o.maxLines || 2 });
      const pw = Math.ceil(fit.width) + 36, ph = Math.ceil(fit.height) + 22, sh = 40;
      const ex = side === "right" ? ax + sh : ax - sh, px = side === "right" ? ex : ex - pw, py = ay - ph / 2;
      const bx0 = Math.min(tx - 14, ax, px) - 4, by0 = Math.min(ty - 14, py) - 4, bx1 = Math.max(tx + 14, ax, px + pw) + 4, by1 = Math.max(ty + 14, py + ph) + 4;
      const E = piece(name, { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 }, "label", Object.assign({ depth: "near" }, o)), t = T0(o), g = svg("g", {}, E.body);
      const L = (x, y) => [x - bx0, y - by0], st = o.status || "accent";
      const ringPts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; ringPts.push(L(tx + Math.cos(a) * 10, ty + Math.sin(a) * 10)); }
      const r1 = stroke(E, g, ringPts, t, 0.18, { tone: st, part: "ring" });
      const L0 = Math.hypot(ax - tx, ay - ty) || 1, sx = tx + (ax - tx) / L0 * 10, sy = ty + (ay - ty) / L0 * 10;
      const r2 = stroke(E, g, [L(sx, sy), L(ax, ay), L(ex, ay)], r1.end, 0.3, { tone: st, weight: 0.7, part: "leader" });
      const pg = svg("g", {}, g);
      const pr = svg("rect", { x: f1(px - bx0), y: f1(py - by0), width: f1(pw), height: f1(ph), fill: S().c("surface"), opacity: 0 }, pg);
      fadeIn(pr, r2.end, 0.15, 0.94, name);
      stroke(E, pg, [L(px, py), L(px, py + ph)], r2.end, 0.12, { tone: st, weight: 1.2, halo: false, part: "edge" });
      const wd = words(E, pg, o.text, { x: px - bx0 + 18, y: py - by0 + 11, w: pw - 36, h: ph - 22 }, r2.end + 0.05, { role: o.role || "label", tone: o.textTone || "ink", maxLines: o.maxLines || 2, valign: "middle", dur: 0.25 });
      const Hd = { E, t: wd.end };
      // the callout leaves when the narration moves on (annotations never pile up)
      Hd.off = (when) => { Loom.tween(E.body, { opacity: 1 }, { opacity: 0, duration: 0.3 }, when, meta(name, "exit")); return when + 0.3; };
      if (o.until != null) Hd.off(o.until);
      E.handle = Hd;
      return Hd;
    };

    // ---- a flow: the briefing diagram. Steps in a row (or a column), each a small framed node with a label and an
    // optional sub-line, joined by links that draw on; a packet can travel the flow; a step takes a status on the word.
    // o: {x, y, w, h, steps: [{label, sub, status}], dir: "row" | "col" | "right" | "left" | "down" | "up", at}. Returns {E, t, step(i, status, t),
    // packet(t, {dur, status, from, to}), box(i)}
    H.flow = function (name, o) {
      o = o || {};
      const E = piece(name, o, "card", Object.assign({ register: "briefing" }, o)), t = T0(o), g = svg("g", {}, E.body), gl = svg("g", {}, g), gs = svg("g", {}, g);
      // dir: the way the flow points. "right" (or "row", the default) and "down" (or "col") lay the steps in reading
      // order; "left" and "up" put the first step at the right or the bottom, so the arrows point the way the data moves
      const D = o.dir === "col" ? "down" : (o.dir == null || o.dir === "row") ? "right" : o.dir;
      if (!["right", "left", "down", "up"].includes(D)) throw new Error(`${beat.id}: flow "${name}" dir must be row, col, right, left, down or up (got ${o.dir})`);
      const n = (o.steps || []).length, row = D === "right" || D === "left", rev = D === "left" || D === "up", gap = o.gap || 70;
      const bw = row ? (o.w - gap * (n - 1)) / n : o.w, bh = row ? o.h : (o.h - gap * (n - 1)) / n;
      const B = [], each = o.by != null ? clamp((o.by - t) / Math.max(1, n), 0.25, 0.9) : 0.45;
      (o.steps || []).forEach((s, i) => {
        const slot = rev ? n - 1 - i : i, x = row ? slot * (bw + gap) : 0, y = row ? 0 : slot * (bh + gap), st = t + i * each, sg = svg("g", {}, gs);
        const pl = plate(E, sg, x, y, bw, bh); pl.setAttribute("opacity", 0); fadeIn(pl, st + 0.08, 0.25, E.__holo.look.plate, name);
        const c = clamp(Math.min(bw, bh) * 0.16, 12, 26), bp = [];
        for (const b of brackets(x, y, bw, bh, c)) bp.push(stroke(E, sg, b, st, 0.25, { tone: s.status || "accent", weight: 1.1, part: "step" }).p);
        stroke(E, sg, [[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]], st + 0.05, 0.35, { closed: true, w: 1, op: lineOp(E, 0.3), tone: "line", halo: false, part: "hair" });
        const ip = 20;
        if (o.index !== false) words(E, sg, String(i + 1).padStart(2, "0"), { x: x + ip, y: y + 12, w: 80, h: 32 }, st + 0.15, { role: "caption", tone: "accent", cursor: false, dur: 0.08 });
        const lt = s.sub ? bh * 0.42 : bh - 2 * ip - 30;
        const lab = words(E, sg, s.label, { x: x + ip, y: y + 44, w: bw - 2 * ip, h: Math.max(40, lt) }, st + 0.2, { role: o.role || "lead", tone: "ink", maxLines: 2, valign: s.sub ? "top" : "middle", dur: 0.25 });
        if (s.sub) words(E, sg, s.sub, { x: x + ip, y: y + 44 + lt, w: bw - 2 * ip, h: bh - 44 - lt - 14 }, lab.end, { role: "label", tone: "muted", maxLines: 2, valign: "top", cursor: false, dur: 0.15 });
        const busy = svg("rect", { x: f1(x), y: f1(y), width: f1(bw), height: f1(bh), fill: col("accent"), opacity: 0 }, sg);
        sg.insertBefore(busy, sg.childNodes[1] || null);
        B.push({ x, y, w: bw, h: bh, brackets: bp, at: st, busy });
        if (i > 0) {
          const a = B[i - 1];
          // from the previous step's facing edge to this step's, the head at this step (the direction of the flow)
          const fw = row ? (x > a.x ? 1 : -1) : (y > a.y ? 1 : -1);
          const p0 = row ? [fw > 0 ? a.x + a.w + 8 : a.x - 8, a.y + a.h / 2] : [a.x + a.w / 2, fw > 0 ? a.y + a.h + 8 : a.y - 8];
          const p1 = row ? [fw > 0 ? x - 8 : x + bw + 8, y + bh / 2] : [x + bw / 2, fw > 0 ? y - 8 : y + bh + 8];
          const ln = stroke(E, gl, [p0, p1], st - 0.05, 0.25, { tone: "line", weight: 0.8, part: "link", halo: false });
          const ux = row ? fw : 0, uy = row ? 0 : fw, hx = p1[0] - ux * 12, hy = p1[1] - uy * 12;
          const hd = `${f1(p1[0])},${f1(p1[1])} ${f1(hx - uy * 7)},${f1(hy + ux * 7)} ${f1(hx + uy * 7)},${f1(hy - ux * 7)}`;
          const head = svg("polygon", { points: hd, fill: col("line"), opacity: 0 }, gl);
          fadeIn(head, ln.end - 0.03, 0.05, 1, name);
        }
      });
      const pk = svg("g", { opacity: 0 }, g);
      svg("circle", { cx: 0, cy: 0, r: 12, fill: col("accent"), opacity: 0.25 }, pk);
      svg("circle", { cx: 0, cy: 0, r: 6, fill: col("ink") }, pk);
      const trips = [];
      // the packet is seen only in the gaps between steps (never over a step's words); while it is inside a step, that
      // step's plate takes a faint cyan tint, as if it were working on it
      onClock((tt) => {
        let on = false;
        const busyK = B.map(() => 0);
        for (const tr of trips) {
          if (tt < tr.at || tt > tr.at + tr.dur) continue;
          const u = (tt - tr.at) / tr.dur, a = B[tr.from], b = B[tr.to];
          const c = row ? lerp(a.x + a.w / 2, b.x + b.w / 2, u) : lerp(a.y + a.h / 2, b.y + b.h / 2, u);
          B.forEach((q, i) => {
            const lo = row ? q.x : q.y, hi = lo + (row ? q.w : q.h);
            if (c >= lo && c <= hi) busyK[i] = Math.max(busyK[i], Math.sin(Math.PI * (c - lo) / (hi - lo)));
          });
          const inBox = B.some((q) => (row ? c >= q.x - 6 && c <= q.x + q.w + 6 : c >= q.y - 6 && c <= q.y + q.h + 6));
          if (!inBox) { setA(pk, "transform", row ? `translate(${f1(c)} ${f1(a.y + a.h / 2)})` : `translate(${f1(a.x + a.w / 2)} ${f1(c)})`); on = true; }
        }
        setA(pk, "opacity", on ? "1" : "0");
        B.forEach((q, i) => setA(q.busy, "opacity", (0.09 * busyK[i]).toFixed(3)));
      });
      const Hd = { E, t: t + n * each + 0.3, boxes: B };
      // a step takes a status: its brackets recolour AND its word shows in a tag at the step's top right (so a status is
      // never colour alone); so: {word: "APPROVES" | false}
      Hd.step = function (i, st, when, so) {
        so = so || {};
        const q = B[i]; if (!q) throw new Error(`${beat.id}: flow "${name}" has no step ${i}`);
        for (const p of q.brackets) Loom.set(p, { attr: { stroke: col(st) } }, when);
        if (q.tag) { Loom.tween(q.tag.g, { opacity: 1 }, { opacity: 0, duration: 0.12 }, when, meta(name, "state")); q.tag = null; }
        const wd = so.word === false ? null : (so.word || (st && st !== "info" ? wordOf(st) || String(st).toUpperCase() : null));
        if (wd) {
          const tw = Math.max(92, K().measure(wd, "caption", 24, 700, "0.08em") + 52), th = 42;
          q.tag = H.tag(E, gs, q.x + q.w - tw - 14, q.y + 12, st, when + 0.1, { h: th, w: tw, word: wd });
        }
        return when;
      };
      Hd.packet = function (when, po) { po = po || {}; const tr = { at: when, dur: po.dur || 0.6 * n, from: po.from || 0, to: po.to == null ? n - 1 : po.to }; trips.push(tr); note(when, when + tr.dur, "travel", name, true); return when + tr.dur; };
      Hd.box = (i) => ({ rect: { x: o.x + B[i].x, y: o.y + B[i].y, w: B[i].w, h: B[i].h }, depth: E.__holo.depth, name: name + "_" + i });
      E.handle = Hd;
      return Hd;
    };

    // ================================================================ THE HERO MOMENT (2026-10-16, the wow pass)
    // One or two a lesson: a glowing wireframe object scanned onto a projector pad, on a dark stage, with HUD chrome at
    // the frame's edges and small amber data plates. The briefing register stays calm; these are for the analysis
    // register's showcase beats. No word ever sits inside a glow: words are on plates beside the object.

    // two soft passes of light under a set of strokes (the additive glow): returns [wide, narrow] paths
    const glowPair = (parent, tone, k) => {
      const gg = svg("g", { class: "lm-holo-glow", style: "mix-blend-mode:screen" }, parent);
      const wide = svg("path", { d: "", fill: "none", stroke: col(tone), "stroke-width": 13, "stroke-linecap": "round", opacity: (0.05 * (k || 1)).toFixed(3) }, gg);
      const narrow = svg("path", { d: "", fill: "none", stroke: col(tone), "stroke-width": 5, "stroke-linecap": "round", opacity: (0.13 * (k || 1)).toFixed(3) }, gg);
      return [wide, narrow, gg];
    };

    // ---- a hero object: a 3D wireframe in true perspective, drawn by the engine from a CAD-like model (MODELS: rack,
    // chip, drone, datacentre, lock, phone). It is built by a scan plane that rises through it, turns on a turntable
    // only inside its window, fogs with depth (far lines fainter), lights the active part hot (near-white), and
    // explodes its parts along their axes. o: {cx, cy (where its base centre lands), size (px of its largest extent),
    // model, at, pitch (deg, camera above), dist, yaw (deg), spin (deg/s), spinFrom, spinTo, build: {at, dur} | false,
    // explode: [{t, to: 0..1, dur}], hot: [{part, t0, t1}], tone, lift}. Returns {E, t, part(id, t), anchor(id, t),
    // explode(to, t, dur), turn(deg, t, dur), hot(part, t0, t1), parts}
    H.object = function (name, o) {
      o = o || {};
      const make = MODELS[o.model];
      if (!make) throw new Error(`${beat.id}: H.object "${name}" has no model "${o.model}" (have: ${Object.keys(MODELS).join(", ")})`);
      const parts = make(), t = T0(o), tone = o.tone || "accent";
      let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
      for (const P of parts) for (let i = 0; i < P.s.length; i += 3) {
        x0 = Math.min(x0, P.s[i]); x1 = Math.max(x1, P.s[i]); y0 = Math.min(y0, P.s[i + 1]); y1 = Math.max(y1, P.s[i + 1]); z0 = Math.min(z0, P.s[i + 2]); z1 = Math.max(z1, P.s[i + 2]);
      }
      const ext = Math.max(x1 - x0, y1 - y0, z1 - z0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2, mz = (z0 + z1) / 2;
      const size = o.size || 460, kpx = size / ext, pitch = (o.pitch == null ? 18 : o.pitch) * DEG, cp = Math.cos(pitch), sp = Math.sin(pitch);
      const dist = (o.dist == null ? 3.4 : o.dist) * ext, f = kpx * dist, cx = o.cx, yb = y0 - my;
      const cyc = o.cy + f * yb * cp / (dist - yb * sp);           // the pivot's screen y, so the base centre lands on o.cy
      // timelines, each a pure function of time
      const spin = (o.spin || 0) * DEG, s0 = o.spinFrom == null ? t : o.spinFrom, s1 = o.spinTo == null ? (spin ? ctx.end : t) : o.spinTo;
      if (spin) { note(s0, s1, "spin", name, false); loop(s0, s1, name + " turntable"); }
      const turns = [], exKeys = [{ t: -1, to: 0, dur: 0 }].concat((o.explode || []).map((k) => ({ t: k.t, to: k.to == null ? 1 : k.to, dur: k.dur || 1.2 })));
      const hots = (o.hot || []).map((h) => ({ part: h.part, t0: h.t0, t1: h.t1 == null ? 1e9 : h.t1 }));
      const yawAt = (tt) => { let a = (o.yaw || -30) * DEG + spin * (clamp(tt, s0, s1) - s0); for (const m of turns) a += m.deg * inOut((tt - m.t) / m.dur); return a; };
      const exAt = (tt) => { let v = 0; for (const k of exKeys.slice().sort((a, b) => a.t - b.t)) { if (tt <= k.t) break; v = lerp(v, k.to, k.dur ? inOut((tt - k.t) / k.dur) : 1); } return v; };
      const B = o.build === false ? null : Object.assign({ at: t, dur: 2.6 }, o.build || {});
      if (B) note(B.at, B.at + B.dur, "scan", name, true);
      const scanAt = (tt) => (!B ? Infinity : tt < B.at ? -Infinity : tt >= B.at + B.dur ? Infinity : lerp(y0 - 0.02, y1 + 0.02, smooth((tt - B.at) / B.dur)));
      const exMax = Math.max(0, ...exKeys.map((k) => k.to), o.explodeMax || 0);
      // the projection: model point -> [screen x, screen y, depth toward the viewer] (HUD coordinates)
      const projector = (yaw) => { const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw); return (x, y, z) => {
        x -= mx; y -= my; z -= mz; const xr = x * cy_ + z * sy_, zr = -x * sy_ + z * cy_, yv = y * cp - zr * sp, zv = y * sp + zr * cp, zc = dist - zv;
        return [cx + f * xr / zc, cyc - f * yv / zc, zv]; }; };
      // the element's box: everything it can draw, at every turn and up to its widest explode
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      for (let a = 0; a < 12; a++) {
        const P = projector(a / 12 * TAU);
        for (const Q of parts) for (const e of [0, exMax]) for (let i = 0; i < Q.s.length; i += 3) {
          const p = P(Q.s[i] + Q.ex[0] * e, Q.s[i + 1] + Q.ex[1] * e, Q.s[i + 2] + Q.ex[2] * e);
          bx0 = Math.min(bx0, p[0]); bx1 = Math.max(bx1, p[0]); by0 = Math.min(by0, p[1]); by1 = Math.max(by1, p[1]);
        }
      }
      const box = { x: Math.floor(bx0 - 20), y: Math.floor(by0 - 20), w: Math.ceil(bx1 - bx0 + 40), h: Math.ceil(by1 - by0 + 40) };
      const E = piece(name, box, "instrument", o), g = svg("g", {}, E.body);
      // the radial lift behind the hero (light, not a panel: no words ever sit on it)
      if (o.lift !== false) {
        const gid = "lmholo_lift_" + beat.id + "_" + name, defs_ = svg("defs", {}, g);
        const rg = svg("radialGradient", { id: gid, cx: f1(cx - box.x), cy: f1((cyc + o.cy) / 2 - box.y), r: f1(size * 0.95), gradientUnits: "userSpaceOnUse" }, defs_);
        svg("stop", { offset: "0", "stop-color": col(tone), "stop-opacity": 0.16 }, rg);
        svg("stop", { offset: "0.55", "stop-color": col(tone), "stop-opacity": 0.05 }, rg);
        svg("stop", { offset: "1", "stop-color": col(tone), "stop-opacity": 0 }, rg);
        const lc = svg("circle", { cx: f1(cx - box.x), cy: f1((cyc + o.cy) / 2 - box.y), r: f1(size * 0.95), fill: `url(#${gid})`, opacity: 0 }, g);
        fadeIn(lc, t, 0.8, 1, name);
      }
      // per part: two glow passes and three fog bands (near, mid, far); far drawn first
      const FOG = [{ op: 0.95, w: 1.5 }, { op: 0.6, w: 1.2 }, { op: 0.26, w: 1.0 }];
      const PS = parts.map((Q) => {
        const pg = svg("g", { "data-part": Q.id }, g);
        const [gw, gn] = glowPair(pg, tone);
        const core = [2, 1, 0].map((b) => svg("path", { d: "", fill: "none", stroke: col(tone), "stroke-width": FOG[b].w, "stroke-linecap": "round", opacity: FOG[b].op, "data-band": b }, pg)).reverse();
        return { Q, gw, gn, core };
      });
      // the scan plane: an ellipse at the scan height, a faint fill, and the hot edge where the plane cuts the model
      const sg = svg("g", { opacity: 0 }, g);
      const [pgw, pgn] = glowPair(sg, tone, 1.6);
      const pfill = svg("path", { d: "", fill: col(tone), opacity: 0.07, stroke: "none" }, sg);
      const pring = svg("path", { d: "", fill: "none", stroke: col(tone), "stroke-width": 2, opacity: 0.95 }, sg);
      const hotEdge = svg("path", { d: "", fill: "none", stroke: col("ink"), "stroke-width": 2, "stroke-linecap": "round", opacity: 0.95 }, g);
      const rx = (x1 - x0) * 0.7 + 0.05, rz = (z1 - z0) * 0.7 + 0.05;
      let last = null;
      onClock((tt) => {
        const yaw = yawAt(tt), ek = exAt(tt), hs = scanAt(tt);
        const hotNow = hots.filter((h) => tt >= h.t0 && tt < h.t1).map((h) => h.part).join(",");
        const key = yaw.toFixed(5) + "|" + ek.toFixed(4) + "|" + (isFinite(hs) ? hs.toFixed(4) : hs) + "|" + hotNow;
        if (key === last) return;
        last = key;
        const P = projector(yaw), R = ext / 2, bxx = box.x, byy = box.y;
        const pt = (p) => f1(p[0] - bxx) + "," + f1(p[1] - byy);
        let dh = "";
        for (const S of PS) {
          const Q = S.Q, ox = Q.ex[0] * ek, oy = Q.ex[1] * ek, oz = Q.ex[2] * ek, s = Q.s, d = ["", "", ""];
          for (let i = 0; i < s.length; i += 6) {
            let ax = s[i], ay = s[i + 1], az = s[i + 2], cx_ = s[i + 3], cy_ = s[i + 4], cz_ = s[i + 5];
            if (hs !== Infinity) {
              if (hs === -Infinity) continue;
              const ia = ay <= hs, ib = cy_ <= hs;
              if (!ia && !ib) continue;
              if (ia !== ib) {
                const u = (hs - ay) / ((cy_ - ay) || 1e-9);
                const qx = lerp(ax, cx_, u), qy = hs, qz = lerp(az, cz_, u);
                if (ia) { cx_ = qx; cy_ = qy; cz_ = qz; } else { ax = qx; ay = qy; az = qz; }
              }
            }
            const pa = P(ax + ox, ay + oy, az + oz), pb = P(cx_ + ox, cy_ + oy, cz_ + oz), zm = (pa[2] + pb[2]) / 2 / R;
            const seg = "M" + pt(pa) + " L" + pt(pb);
            d[zm > 0.12 ? 0 : zm > -0.4 ? 1 : 2] += seg;
            // the hot edge: only the stretch just under the scan plane glows near-white
            if (hs !== Infinity && Math.max(ay, cy_) > hs - 0.06) {
              const lo = hs - 0.06;
              let hax = ax, hay = ay, haz = az, hbx = cx_, hby = cy_, hbz = cz_;
              if (hay < lo) { const u = (lo - hay) / ((hby - hay) || 1e-9); hax = lerp(hax, hbx, u); haz = lerp(haz, hbz, u); hay = lo; }
              else if (hby < lo) { const u = (lo - hby) / ((hay - hby) || 1e-9); hbx = lerp(hbx, hax, u); hbz = lerp(hbz, haz, u); hby = lo; }
              dh += "M" + pt(P(hax + ox, hay + oy, haz + oz)) + " L" + pt(P(hbx + ox, hby + oy, hbz + oz));
            }
          }
          const hot = hotNow && ("," + hotNow + ",").indexOf("," + Q.id + ",") >= 0;
          S.core.forEach((p, b) => { setA(p, "d", d[b] || "M0,0"); setA(p, "stroke", col(hot ? "ink" : tone)); setA(p, "stroke-width", (FOG[b].w * (hot ? 1.35 : 1)).toFixed(2)); });
          setA(S.gw, "d", (d[0] + d[1]) || "M0,0"); setA(S.gn, "d", (d[0] + d[1]) || "M0,0");
          setA(S.gn, "opacity", hot ? "0.26" : "0.13"); setA(S.gw, "opacity", hot ? "0.1" : "0.05");
        }
        setA(hotEdge, "d", dh || "M0,0");
        // the scan plane while it rises; it fades out over 0.4 s at the top
        const scanning = B && tt >= B.at && tt < B.at + B.dur + 0.4;
        if (scanning) {
          const h_ = Math.min(hs === Infinity ? y1 + 0.02 : hs, y1 + 0.02), ring = [];
          for (let k = 0; k <= 48; k++) { const a = k / 48 * TAU; ring.push(P(mx + Math.cos(a) * rx, h_, mz + Math.sin(a) * rz)); }
          const rd = "M" + ring.map(pt).join(" L") + " Z";
          setA(pring, "d", rd); setA(pfill, "d", rd); setA(pgw, "d", rd); setA(pgn, "d", rd);
          setA(sg, "opacity", (tt < B.at + B.dur ? 1 : 1 - (tt - B.at - B.dur) / 0.4).toFixed(3));
        } else setA(sg, "opacity", "0");
      });
      reveal(E, B ? B.at : t);
      const Hd = { E, t: B ? B.at + B.dur : t + 0.3, parts: parts.map((Q) => Q.id) };
      const partOf = (id) => { const Q = parts.find((q) => q.id === id); if (!Q) throw new Error(`${beat.id}: object "${name}" has no part "${id}" (have: ${Hd.parts.join(", ")})`); return Q; };
      // a part's screen box at a time, as a lock target (stop the turntable before locking on)
      Hd.part = function (id, when) {
        const Q = partOf(id), P = projector(yawAt(when)), e = exAt(when);
        if (spin && when < s1) Loom.warn("holo_lock_moving", `${beat.id}: a target on "${id}" while object "${name}" still turns (it spins until ${s1.toFixed(2)}s)`);
        let a0 = 1e9, b0 = 1e9, a1 = -1e9, b1 = -1e9;
        for (let i = 0; i < Q.s.length; i += 3) { const p = P(Q.s[i] + Q.ex[0] * e, Q.s[i + 1] + Q.ex[1] * e, Q.s[i + 2] + Q.ex[2] * e); a0 = Math.min(a0, p[0]); a1 = Math.max(a1, p[0]); b0 = Math.min(b0, p[1]); b1 = Math.max(b1, p[1]); }
        return { rect: { x: a0, y: b0, w: a1 - a0, h: b1 - b0 }, depth: E.__holo.depth, name: name + "_" + id };
      };
      Hd.anchor = (id, when) => { const r = Hd.part(id, when).rect; return [r.x + r.w / 2, r.y + r.h / 2]; };
      Hd.explode = function (to, when, dur) {
        if ((to || 0) > exMax + 1e-6) Loom.warn("holo_object_box", `${beat.id}: object "${name}" explodes to ${to} after it was built for ${exMax}; give explodeMax (or the explode list) up front so its box holds it`);
        exKeys.push({ t: when, to, dur: dur || 1.2 }); note(when, when + (dur || 1.2), "move", name, true); return when + (dur || 1.2);
      };
      Hd.turn = function (deg, when, dur) { turns.push({ deg: deg * DEG, t: when, dur: dur || 1.6 }); note(when, when + (dur || 1.6), "move", name, true); return when + (dur || 1.6); };
      Hd.hot = function (id, t0, t1) { partOf(id); hots.push({ part: id, t0, t1: t1 == null ? 1e9 : t1 }); return t0; };
      Hd.yawAt = yawAt;
      E.handle = Hd;
      return Hd;
    };

    // ---- a projector pad in perspective: a base glow, a bright ring with two glow passes, a dashed ring and ticks that
    // turn slowly inside their window, faint beams falling from above and dust motes drifting up through them (seeded,
    // a pure function of time). o: {cx, cy, r, ratio (the ellipse's height to width), beam (px above), beams, motes,
    // spin (deg/s), spinFrom, spinTo, seed, at}
    H.pad = function (name, o) {
      o = o || {};
      const r = o.r || 340, q = o.ratio || 0.27, hgt = o.beam == null ? 560 : o.beam, t = T0(o), tone = o.tone || "accent";
      const box = { x: o.cx - r - 30, y: o.cy - hgt, w: 2 * r + 60, h: hgt + r * q * 1.2 + 40 };
      const E = piece(name, box, "scenery", Object.assign({ depth: "mid" }, o)), g = svg("g", {}, E.body), X = r + 30, Y = hgt;
      const rng = Loom.rng("holopad:" + (o.seed || name)), defs_ = svg("defs", {}, g), gid = "lmholo_beam_" + beat.id + "_" + name;
      const lg = svg("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs_);
      svg("stop", { offset: "0", "stop-color": col(tone), "stop-opacity": 0 }, lg);
      svg("stop", { offset: "1", "stop-color": col(tone), "stop-opacity": 0.11 }, lg);
      const nb = o.beams == null ? 5 : o.beams, bg = svg("g", { opacity: 0, style: "mix-blend-mode:screen" }, g);
      for (let i = 0; i < nb; i++) {
        const u = nb === 1 ? 0 : (i / (nb - 1)) * 2 - 1, xb = X + u * r * 0.62, wt = 6 + rng() * 10, wb = r * (0.22 + rng() * 0.14);
        svg("polygon", { points: `${f1(xb - wt / 2)},0 ${f1(xb + wt / 2)},0 ${f1(xb + wb / 2)},${f1(Y)} ${f1(xb - wb / 2)},${f1(Y)}`, fill: `url(#${gid})` }, bg);
      }
      fadeIn(bg, t + 0.5, 1.0, 1, name);
      const ell = (rr, extra) => svg("ellipse", Object.assign({ cx: f1(X), cy: f1(Y), rx: f1(rr), ry: f1(rr * q), fill: "none" }, extra), g);
      const disc = ell(r, { fill: col(tone), opacity: 0 }); fadeIn(disc, t, 0.5, 0.07, name);
      for (const [k, d] of [[0.42, 0.1], [0.66, 0.15]]) { const e = ell(r * k, { stroke: col("line"), "stroke-width": 1, opacity: 0 }); fadeIn(e, t + d, 0.4, 0.4, name); }
      const gw = ell(r, { stroke: col(tone), "stroke-width": 14, opacity: 0, style: "mix-blend-mode:screen" }); fadeIn(gw, t + 0.2, 0.5, 0.06, name);
      const gn = ell(r, { stroke: col(tone), "stroke-width": 6, opacity: 0, style: "mix-blend-mode:screen" }); fadeIn(gn, t + 0.2, 0.5, 0.16, name);
      const rim = ell(r, { stroke: col(tone), "stroke-width": 2.4, opacity: 0 }); fadeIn(rim, t + 0.2, 0.4, 1, name);
      const per = Math.PI * (3 * (r * 0.86 + r * 0.86 * q) - Math.sqrt((3 * r * 0.86 + r * 0.86 * q) * (r * 0.86 + 3 * r * 0.86 * q)));
      const dash = ell(r * 0.86, { stroke: col(tone), "stroke-width": 1.6, "stroke-dasharray": "22 14", opacity: 0 }); fadeIn(dash, t + 0.35, 0.4, 0.75, name);
      const ticks = svg("path", { d: "", fill: "none", stroke: col(tone), "stroke-width": 1.4, opacity: 0 }, g); fadeIn(ticks, t + 0.4, 0.4, 0.7, name);
      const spin = o.spin == null ? 6 : o.spin, s0 = o.spinFrom == null ? t : o.spinFrom, s1 = o.spinTo == null ? ctx.end : o.spinTo;
      if (spin) { note(s0, s1, "spin", name, false); loop(s0, s1, name + " pad"); }
      const nm = o.motes == null ? 36 : o.motes, motes = [];
      for (let i = 0; i < nm; i++) {
        const c = svg("circle", { cx: 0, cy: 0, r: f1(0.9 + rng() * 1.5), fill: col("ink"), opacity: 0 }, g);
        motes.push({ c, x: X + (rng() * 2 - 1) * r * 0.66, y0: rng() * Y, sp: 10 + rng() * 22, a: 0.25 + rng() * 0.45 });
      }
      let lastK = null;
      onClock((tt) => {
        const rot = spin * (clamp(tt, s0, s1) - s0) * DEG, k = rot.toFixed(4);
        if (k !== lastK) {
          lastK = k;
          setA(dash, "stroke-dashoffset", f1(-rot / TAU * per));
          let d = "";
          for (let i = 0; i < 72; i++) { const a = i / 72 * TAU + rot, L = i % 6 === 0 ? 0.1 : 0.05, ca = Math.cos(a), sa = Math.sin(a); d += `M${f1(X + ca * r * 1.04)},${f1(Y + sa * r * 1.04 * q)} L${f1(X + ca * r * (1.04 + L))},${f1(Y + sa * r * (1.04 + L) * q)}`; }
          setA(ticks, "d", d);
        }
        const on = tt >= t + 0.8 && tt <= s1, life = clamp((tt - t - 0.8) / 0.8, 0, 1);
        for (const m of motes) {
          if (!on) { setA(m.c, "opacity", "0"); continue; }
          const y = Y - ((m.y0 + m.sp * (clamp(tt, s0, s1) - s0)) % Y), fade = Math.sin(Math.PI * clamp(y / Y, 0, 1));
          setA(m.c, "cx", f1(m.x)); setA(m.c, "cy", f1(y)); setA(m.c, "opacity", (m.a * fade * life).toFixed(3));
        }
      });
      reveal(E, t);
      const Hd = { E, t: t + 0.9, centre: [o.cx, o.cy], r };
      E.handle = Hd;
      return Hd;
    };

    // ---- the stage for a hero moment: the field taken near-black (a wash over the grid), a radial lift at the focus and
    // a strong vignette. In the far layer, under every piece; it is analysis furniture (H.mode dims it in briefing).
    // o: {focus: [x, y], lift (0..1), vignette (0..1), dark (0..1), at}
    H.stage = function (name, o) {
      o = o || {};
      const E = piece(name, { x: 0, y: 0, w: 1920, h: 1080 }, "scenery", Object.assign({ depth: "far", register: "analysis" }, o)), t = T0(o), g = svg("g", { opacity: 0 }, E.body);
      const [fx, fy] = o.focus || [960, 520], defs_ = svg("defs", {}, g), id = "lmholo_stage_" + beat.id + "_" + name;
      const lg = svg("radialGradient", { id: id + "_l", cx: fx, cy: fy, r: 700, gradientUnits: "userSpaceOnUse" }, defs_);
      svg("stop", { offset: "0", "stop-color": col("accent"), "stop-opacity": 0.2 * (o.lift == null ? 1 : o.lift) }, lg);
      svg("stop", { offset: "1", "stop-color": col("accent"), "stop-opacity": 0 }, lg);
      const vg = svg("radialGradient", { id: id + "_v", cx: 960, cy: 540, r: 1150, gradientUnits: "userSpaceOnUse" }, defs_);
      svg("stop", { offset: "0.42", "stop-color": S().c("shadow"), "stop-opacity": 0 }, vg);
      svg("stop", { offset: "1", "stop-color": S().c("shadow"), "stop-opacity": o.vignette == null ? 0.92 : o.vignette }, vg);
      svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: S().c("shadow"), opacity: o.dark == null ? 0.5 : o.dark }, g);
      svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: `url(#${id}_l)` }, g);
      svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: `url(#${id}_v)` }, g);
      fadeIn(g, t, 0.8, 1, name);
      reveal(E, t);
      E.handle = { E, t: t + 0.8 };
      return E.handle;
    };

    // ---- HUD chrome at the frame's edges: corner brackets, rulers along the top and the left, and small mono status
    // text in the corners (the author's words: a system name, a mode, a time) in the near layer, so it parallaxes a
    // little with the camera. bind: an H.object handle, for a live view readout (AZ, EL and the scan's progress, true
    // numbers, never decoration). o: {tl, tr, bl, br, bind, inset, rulers, at}. Above the caption band (930)
    H.chrome = function (name, o) {
      o = o || {};
      const t = T0(o), ins = o.inset || 44, arm = 64, bot = 916, out = [];
      const corner = (k, x, y, sx, sy, text, live) => {
        const tw = text ? Math.ceil(K().measure(String(text), "caption", 22, 400, "0.16em")) + 8 : 0, w = Math.max(arm, tw + 22) + 4, h = arm + 4;
        const bxx = sx > 0 ? x : x - w, byy = sy > 0 ? y : y - h;
        const E = piece(name + "_" + k, { x: bxx, y: byy, w, h }, "label", Object.assign({ depth: "near" }, o)), gg = svg("g", {}, E.body);
        const L = (px, py) => [px - bxx, py - byy];
        stroke(E, gg, [L(x + sx * arm, y), L(x, y), L(x, y + sy * arm)], t + 0.05 * out.length, 0.35, { tone: "accent", weight: 0.8, halo: false, part: "corner" });
        if (text) {
          const ty = sy > 0 ? y + 14 : y - 14 - 34, tx = sx > 0 ? x + 18 : x - 18 - tw;
          const wd = words(E, gg, String(text), { x: tx - bxx, y: ty - byy, w: tw, h: 34 }, t + 0.3, { role: "caption", size: 22, tone: k === "br" && live ? "accent" : "muted", tracking: "0.16em", cursor: false, dur: 0.2 });
          if (live) E.__live = tspanOf(wd.text);
        }
        reveal(E, t); out.push(E);
        return E;
      };
      const live = o.bind && o.bind.yawAt;
      const fmtLive = (tt) => { const a = (((o.bind.yawAt(tt) / DEG) % 360) + 360) % 360; return `AZ ${String(Math.round(a)).padStart(3, "0")}°  EL ${String(Math.round(o.pitch == null ? 18 : o.pitch)).padStart(2, "0")}°`; };
      corner("tl", ins, ins, 1, 1, o.tl ? String(o.tl).toUpperCase() : null);
      corner("tr", 1920 - ins, ins, -1, 1, o.tr ? String(o.tr).toUpperCase() : null);
      corner("bl", ins, bot, 1, -1, o.bl ? String(o.bl).toUpperCase() : null);
      const br = corner("br", 1920 - ins, bot, -1, -1, live ? fmtLive(ctx.end) : o.br ? String(o.br).toUpperCase() : null, live);
      if (live && br.__live) { const node = br.__live; let lastS = null; onClock((tt) => { const s_ = fmtLive(tt); if (s_ !== lastS) { lastS = s_; node.textContent = s_; } }); }
      if (o.rulers !== false) {
        const top = piece(name + "_ruler_t", { x: 240, y: ins - 6, w: 1440, h: 22 }, "scenery", Object.assign({ depth: "near" }, o));
        let d = ""; for (let x = 0; x <= 1440; x += 24) d += `M${x},6 L${x},${x % 240 === 0 ? 20 : 12}`;
        const p1 = svg("path", { d, fill: "none", stroke: col("line"), "stroke-width": 1, opacity: 0 }, top.body); fadeIn(p1, t + 0.2, 0.5, +lineOp(top, 0.6), name);
        const left = piece(name + "_ruler_l", { x: ins - 6, y: 170, w: 22, h: 660 }, "scenery", Object.assign({ depth: "near" }, o));
        d = ""; for (let y = 0; y <= 660; y += 24) d += `M6,${y} L${y % 240 === 0 ? 20 : 12},${y}`;
        const p2 = svg("path", { d, fill: "none", stroke: col("line"), "stroke-width": 1, opacity: 0 }, left.body); fadeIn(p2, t + 0.25, 0.5, +lineOp(left, 0.6), name);
        reveal(top, t); reveal(left, t); out.push(top, left);
      }
      return { E: out[0], t: t + 0.6, parts: out };
    };

    // ---- a datum: the analysis register's small data plate. A label in small tracked mono caps, the value in amber
    // (rolling digits on its reveal) with its unit, on a dark plate with a 1 px border and corner ticks; a leader runs
    // to the thing it measures (to: [x, y], e.g. OBJ.anchor("psu", t)). o: {x, y, w, label, value, unit, decimals,
    // roll, tone, to, at}. Returns {E, t, set(v, t)}
    H.datum = function (name, o) {
      o = o || {};
      const t = T0(o), w = o.w || 300, h = 100, tone = o.tone || "warn", px = o.x, py = o.y;
      let bx0 = px, by0 = py, bx1 = px + w, by1 = py + h;
      if (o.to) { bx0 = Math.min(bx0, o.to[0] - 12); by0 = Math.min(by0, o.to[1] - 12); bx1 = Math.max(bx1, o.to[0] + 12); by1 = Math.max(by1, o.to[1] + 12); }
      const E = piece(name, { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 }, "label", Object.assign({ depth: "near" }, o)), g = svg("g", {}, E.body);
      const L = (x, y) => [x - bx0, y - by0], lx = px - bx0, ly = py - by0;
      if (o.to) {                                     // the leader first, so the plate sits over its end
        const [tx, ty] = o.to, ex_ = tx < px ? px : tx > px + w ? px + w : tx, ey = ty < py ? py : ty > py + h ? py + h : py + h / 2;
        const ringPts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; ringPts.push(L(tx + Math.cos(a) * 7, ty + Math.sin(a) * 7)); }
        const r1 = stroke(E, g, ringPts, t, 0.15, { tone, halo: false, part: "ring" });
        const dx = ex_ - tx, dy = ey - ty, dl = Math.hypot(dx, dy) || 1;
        stroke(E, g, [L(tx + dx / dl * 7, ty + dy / dl * 7), L(ex_, ey)], r1.end, 0.3, { tone, weight: 0.6, halo: false, part: "leader" });
      }
      const pl = svg("rect", { x: f1(lx), y: f1(ly), width: w, height: h, fill: S().c("field"), stroke: col("line"), "stroke-width": 1, "stroke-opacity": 0.7, opacity: 0 }, g);
      fadeIn(pl, t + 0.2, 0.2, 0.92, name);
      for (const b of brackets(lx, ly, w, h, 9)) stroke(E, g, b, t + 0.2, 0.18, { tone: "accent", weight: 0.8, halo: false, part: "tick" });
      words(E, g, String(o.label || "").toUpperCase(), { x: lx + 16, y: ly + 8, w: w - 32, h: 34 }, t + 0.3, { role: "caption", size: 22, tone: "muted", tracking: "0.16em", cursor: false, dur: 0.15 });
      const dec = o.decimals || 0, fmt = (v) => (typeof v === "number" ? v.toFixed(dec) : String(v));
      const uW = o.unit ? Math.ceil(K().measure(String(o.unit), "caption", 22)) + 10 : 0;
      let vw = null;
      const typeVal = (v, when) => {
        if (vw) Loom.tween(vw.g, { opacity: 1 }, { opacity: 0, duration: 0.12 }, when, meta(name, "state"));
        vw = words(E, g, fmt(v), { x: lx + 16, y: ly + 44, w: w - 32 - uW, h: 46 }, when + (vw ? 0.12 : 0), { role: "label", tone, weight: 700, cursor: false, dur: 0.1 });
        if (o.roll !== false && typeof v === "number") {
          const node = tspanOf(vw.text), fin = fmt(v);
          Loom.drive((e, raw) => { node.textContent = raw < 1 ? rollStr(fin, raw) : fin; }, when + 0.05, 0.7, "linear", { kind: "count", beat: beat.id, name: name + ".value", content: true, key: "holodatum:" + name + ":" + when });
        }
        return vw;
      };
      const v0 = typeVal(o.value, t + 0.4);
      if (o.unit) words(E, g, String(o.unit), { x: v0.fit.x + v0.fit.width + 8, y: ly + 52, w: uW + 6, h: 34 }, t + 0.5, { role: "caption", size: 22, tone: "muted", cursor: false, dur: 0.1 });
      reveal(E, t);
      const Hd = { E, t: t + 1.2 };
      Hd.set = (v, when) => { typeVal(v, when); return when + 0.8; };
      E.handle = Hd;
      return Hd;
    };

    // ================================================================ HOLOGRAM V2 (2026-10-16): light, not a dashboard
    // Kshitij, 2026-10-16: "everything feels very basic and AI like. Not something a real hologram would look like."
    // Principles: docs/research/2026-10-16-hologram-v2.md s4. Complex objects are true 3D heroes (H.hero3d, WebGL);
    // diagrams and readings stay SVG, pushed: translucent planes in slight perspective at different depths, light that
    // blooms from bright edges (halation) with a slight fringe, a fine scan texture, depth of field on far layers, a
    // typographic hierarchy (one large reading, small sentence-case labels, dim micro detail), no brackets on every box.
    // No word is ever inside a filter: the filters sit on line art only; words are drawn in their own groups.
    const lightDefs = svg("defs", {}, E0.inner), LID = "lmholo2_" + beat.id + "_" + (opts.name || "hud");
    {
      const hal = svg("filter", { id: LID + "_hal", x: "-30%", y: "-30%", width: "160%", height: "160%", "color-interpolation-filters": "sRGB" }, lightDefs);
      svg("feGaussianBlur", { in: "SourceGraphic", stdDeviation: 3.2, result: "b" }, hal);
      const ct = svg("feComponentTransfer", { in: "b", result: "b2" }, hal); svg("feFuncA", { type: "linear", slope: 1.5 }, ct);
      // the fringe: the red a little left, the blue a little right, screened over the line
      svg("feColorMatrix", { in: "SourceGraphic", type: "matrix", values: "1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0", result: "r" }, hal);
      svg("feOffset", { in: "r", dx: -1.3, dy: 0, result: "ro" }, hal);
      svg("feColorMatrix", { in: "SourceGraphic", type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0.55 0", result: "bl" }, hal);
      svg("feOffset", { in: "bl", dx: 1.3, dy: 0, result: "bo" }, hal);
      const mg = svg("feMerge", {}, hal);
      for (const n of ["b2", "ro", "bo", "SourceGraphic"]) svg("feMergeNode", { in: n }, mg);
      const dof = svg("filter", { id: LID + "_dof", x: "-5%", y: "-5%", width: "110%", height: "110%" }, lightDefs);
      svg("feGaussianBlur", { stdDeviation: 1.5 }, dof);
      const pat = svg("pattern", { id: LID + "_scan", x: 0, y: 0, width: 4, height: 4, patternUnits: "userSpaceOnUse" }, lightDefs);
      svg("rect", { x: 0, y: 0, width: 4, height: 1, fill: col("accent"), opacity: 0.09 }, pat);
    }
    const HAL = `url(#${LID}_hal)`, DOF = `url(#${LID}_dof)`, SCAN = `url(#${LID}_scan)`;
    H.light = { halation: HAL, dof: DOF, scan: SCAN };

    // ---- a 3D hero behind the HUD: the WebGL clip (runtime/three/presets/holo_hero.js, rendered by the bridge and given
    // as Loom.assets.hero3d[name]: {src, rect, dur, size, anchors}) as a footage layer at the back of the mid layer, so
    // the stage is under it and every panel over it; it lays on the field as light (alpha from brightness). Its named
    // parts are targets: part(id, t) for H.lock, anchor(id, t) for a reading's leader. o: {rect, at, asset}
    H.hero3d = function (name, o) {
      o = o || {};
      // a lesson's heroes are keyed "<beat>:<name>" (compose), the lab's by name; t0 is the timeline time of the clip's 0
      const AS = (Loom.assets || {}).hero3d || {}, A = AS[beat.id + ":" + (o.asset || name)] || AS[o.asset || name], t = T0(o, ctx.start);
      const rect = o.rect || (A && A.rect) || [410, 90, 1100, 900];
      const Hd = { E: null, t: t + 0.3, rect, asset: A || null, parts: A && A.anchors && A.anchors.length ? Object.keys(A.anchors[0][1]) : [] };
      if (!A) {
        Loom.error("holo_hero_missing", `${beat.id}: hero "${name}" has no rendered clip: declare it in the scene's hero3d and render it with the bridge (three_bridge.hero_lab_strip in the lab; a lesson's storyboard in compose)`);
      } else if (Loom.footage) {
        const E = Loom.footage(ctx, "hero3d_" + name, { src: A.src, x: rect[0], y: rect[1], w: rect[2], h: rect[3], trim: [0, A.dur], at: A.t0 || 0, fit: "contain", reveal: t });
        if (E && E.outer) { const L = layers[o.depth || "mid"].g; L.insertBefore(E.outer, L.firstChild); }
        Hd.E = E;
      }
      const k = A ? Math.min(rect[2] / A.size[0], rect[3] / A.size[1]) : 1, ox = A ? rect[0] + (rect[2] - A.size[0] * k) / 2 : rect[0], oy = A ? rect[1] + (rect[3] - A.size[1] * k) / 2 : rect[1];
      const boxAt = (id, when_) => {
        const S_ = (A && A.anchors) || [], when = when_ - ((A && A.t0) || 0);
        if (!S_.length) throw new Error(`${beat.id}: hero "${name}" has no anchors (render it through the bridge)`);
        let i = 0; while (i < S_.length - 1 && S_[i + 1][0] <= when) i++;
        const a = S_[i][1][id], b = S_[Math.min(S_.length - 1, i + 1)][1][id];
        if (!a) throw new Error(`${beat.id}: hero "${name}" has no part "${id}" (have: ${Object.keys(S_[0][1]).join(", ")})`);
        const span = (S_[Math.min(S_.length - 1, i + 1)][0] - S_[i][0]) || 1, u = b ? clamp((when - S_[i][0]) / span, 0, 1) : 0;
        const v = a.map((q, j) => (b ? lerp(q, b[j], u) : q));
        return { x: ox + v[0] * k, y: oy + v[1] * k, w: v[2] * k, h: v[3] * k };
      };
      Hd.part = (id, when) => ({ rect: boxAt(id, when), depth: o.depth || "mid", name: name + "_" + id });
      Hd.anchor = (id, when, at) => { const r = boxAt(id, when), [fx, fy] = at || [0.5, 0.5]; return [r.x + r.w * fx, r.y + r.h * fy]; };
      return Hd;
    };

    // ---- a plane: a translucent sheet of light in slight perspective, at a depth. Its plate is faint, one edge is lit
    // (where the light catches it) and blooms, a fine scan texture runs across it, the far layer is out of focus. No
    // corner brackets. o: {x, y, w, h, top (0..0.35: how much the top edge narrows), side (-0.3..0.3: the left or right
    // edge shortens), lit: "top" | "bottom" | "left" | "right", fill, tone, label, depth, blur, at}. Returns {E, t,
    // box (the inner rect for words), quad}
    H.plane = function (name, o) {
      o = o || {};
      const E = piece(name, o, "card", o), t = T0(o), w = o.w, h = o.h, g = svg("g", {}, E.body);
      const tp = clamp(o.top || 0, 0, 0.35) * w, sd = clamp(o.side || 0, -0.3, 0.3) * h;
      const Q = [[tp, sd > 0 ? 0 : 0], [w - tp, sd > 0 ? sd / 2 : 0], [w, sd > 0 ? h - sd / 2 : h], [0, sd < 0 ? h + sd / 2 : h]];
      if (sd < 0) { Q[0][1] = -sd / 2; }
      const pts = Q.map((p) => f1(p[0]) + "," + f1(p[1])).join(" "), tone = o.tone || "accent";
      const plateEl = svg("polygon", { points: pts, fill: S().c("surface"), opacity: 0 }, g); fadeIn(plateEl, t, 0.4, o.fill == null ? 0.34 * E.__holo.look.plate : o.fill, name);
      const gid = LID + "_pl_" + name, lit = o.lit || "top", gd = svg("defs", {}, g);
      const dir = { top: [0, 0, 0, 1], bottom: [0, 1, 0, 0], left: [0, 0, 1, 0], right: [1, 0, 0, 0] }[lit] || [0, 0, 0, 1];
      const lgr = svg("linearGradient", { id: gid, x1: dir[0], y1: dir[1], x2: dir[2], y2: dir[3] }, gd);
      svg("stop", { offset: "0", "stop-color": col(tone), "stop-opacity": 0.16 }, lgr); svg("stop", { offset: "0.55", "stop-color": col(tone), "stop-opacity": 0 }, lgr);
      const wash = svg("polygon", { points: pts, fill: `url(#${gid})`, opacity: 0 }, g); fadeIn(wash, t + 0.1, 0.5, 1, name);
      if (o.scan !== false) { const sc = svg("polygon", { points: pts, fill: SCAN, opacity: 0 }, g); fadeIn(sc, t + 0.2, 0.5, 1, name); }
      const outline = svg("polygon", { points: pts, fill: "none", stroke: col("line"), "stroke-width": 1, opacity: 0 }, g); fadeIn(outline, t + 0.1, 0.4, 0.32, name);
      const edgeOf = { top: [Q[0], Q[1]], bottom: [Q[3], Q[2]], left: [Q[0], Q[3]], right: [Q[1], Q[2]] }[lit] || [Q[0], Q[1]];
      const eg = svg("g", { filter: HAL }, g);
      stroke(E, eg, edgeOf, t + 0.15, 0.5, { tone, weight: 0.9, halo: false, part: "edge" });
      if (o.blur != null ? o.blur : (o.depth === "far")) g.setAttribute("filter", DOF);   // out of focus: the sheet, never its words
      const ins = 22, box = { x: o.x + Math.max(tp, 0) + ins, y: o.y + Math.max(0, Math.abs(sd) / 2) + ins, w: w - 2 * tp - 2 * ins, h: h - Math.abs(sd) - 2 * ins };
      if (o.label) words(E, svg("g", {}, E.body), String(o.label), { x: Math.max(tp, 0) + ins, y: Math.max(0, Math.abs(sd) / 2) + 8, w: Math.min(420, w - 2 * tp - 2 * ins), h: 34 }, t + 0.3, { role: "caption", tone: "line", cursor: false, dur: 0.15 });
      reveal(E, t);
      E.handle = { E, t: t + 0.6, box, quad: Q.map((p) => [o.x + p[0], o.y + p[1]]) };
      return E.handle;
    };

    // ---- a reading: the typographic unit of v2. A small sentence-case label, the value large in the display face with
    // its unit small beside it, and dim micro lines under it (an index, a precision, a time, a source), with an
    // optional leader (an elbow and a tick) to the thing it measures. The value rolls on its reveal. o: {x, y, w,
    // label, value, unit, decimals, micro: [str], size: "hero" | "major" | "minor", tone, align, to: [x, y], plate, at}.
    // Returns {E, t, set(v, t)}
    H.reading = function (name, o) {
      o = o || {};
      const t = T0(o), size = o.size || "major", vr = { hero: ["hero", 124], major: ["title", 80], minor: ["lead", 50] }[size] || ["title", 80];
      const w = o.w || 360, micro = o.micro || [], mh = micro.length * 32, tone = o.tone || "ink", right = o.align === "right";
      const LH = o.label ? Math.ceil(K().fit(String(o.label), { role: "caption", w, maxLines: 2 }).height) + 6 : 0, h = LH + vr[1] + 6 + mh;
      let x0 = o.x, y0 = o.y, x1 = o.x + w, y1 = o.y + h;
      if (o.to) { x0 = Math.min(x0, o.to[0] - 8); y0 = Math.min(y0, o.to[1] - 8); x1 = Math.max(x1, o.to[0] + 8); y1 = Math.max(y1, o.to[1] + 8); }
      const E = piece(name, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, "label", Object.assign({ depth: "near" }, o)), g = svg("g", {}, E.body);
      const lx = o.x - x0, ly = o.y - y0;
      if (o.to) {                                       // the leader: from the block's side to the thing, an elbow, a tick
        const [tx, ty] = o.to, sx = tx < o.x ? lx - 10 : lx + w + 10, sy = ly + LH + vr[1] * 0.5, ex = tx - x0, ey = ty - y0, mx = sx + (ex - sx) * 0.35;
        const lg = svg("g", { filter: HAL }, g);
        stroke(E, lg, [[sx, sy], [mx, sy], [ex, ey]], t, 0.4, { tone: tone === "ink" ? "accent" : tone, weight: 0.55, halo: false, part: "leader" });
        stroke(E, lg, [[ex - 6, ey], [ex + 6, ey]], t + 0.35, 0.1, { tone: tone === "ink" ? "accent" : tone, weight: 0.9, halo: false, part: "tick" });
        stroke(E, lg, [[ex, ey - 6], [ex, ey + 6]], t + 0.35, 0.1, { tone: tone === "ink" ? "accent" : tone, weight: 0.9, halo: false, part: "tick" });
      }
      if (o.plate) { const pl = plate(E, g, lx - 14, ly - 8, w + 28, h + 16, { opacity: 0.55 }); pl.setAttribute("opacity", 0); fadeIn(pl, t, 0.3, 0.55, name); }
      const al = right ? "right" : "left";
      if (o.label) words(E, g, String(o.label), { x: lx, y: ly, w, h: LH }, t + 0.1, { role: "caption", tone: "muted", align: al, maxLines: 2, valign: "top", cursor: false, dur: 0.15 });
      const dec = o.decimals || 0, fmt = (v) => (typeof v === "number" ? v.toFixed(dec) : String(v));
      const uW = o.unit ? Math.ceil(K().measure(String(o.unit), "lead", 40)) + 16 : 0;
      let vw = null, uw = null;
      const typeVal = (v, when) => {
        if (vw) Loom.tween(vw.g, { opacity: 1 }, { opacity: 0, duration: 0.12 }, when, meta(name, "state"));
        vw = words(E, g, fmt(v), { x: lx + (right ? uW : 0), y: ly + LH, w: w - uW, h: vr[1] }, when + (vw ? 0.12 : 0), { role: vr[0], tone, align: al, weight: 700, cursor: false, dur: 0.1 });
        if (o.roll !== false && typeof v === "number") {
          const node = tspanOf(vw.text), fin = fmt(v);
          Loom.drive((e, raw) => { node.textContent = raw < 1 ? rollStr(fin, raw) : fin; }, when + 0.05, 0.6, "linear", { kind: "count", beat: beat.id, name: name + ".value", content: true, key: "holoread:" + name + ":" + when });
        }
        return vw;
      };
      const v0 = typeVal(o.value, t + 0.2);
      if (o.unit) {
        const ux = right ? lx + w - v0.fit.width - uW : v0.fit.x + v0.fit.width + 10;
        uw = words(E, g, String(o.unit), { x: ux, y: ly + LH + vr[1] - 50, w: uW, h: 46 }, t + 0.3, { role: "lead", tone: "muted", cursor: false, dur: 0.1 });
      }
      micro.forEach((m, i) => words(E, g, String(m), { x: lx, y: ly + LH + vr[1] + 6 + i * 32, w, h: 30 }, t + 0.35 + i * 0.05, { role: "caption", tone: "line", align: al, cursor: false, dur: 0.12 }));
      reveal(E, t);
      const Hd = { E, t: t + 0.9 };
      Hd.set = (v, when) => { typeVal(v, when); return when + 0.7; };
      void uw;
      E.handle = Hd;
      return Hd;
    };

    // ---- a token ribbon: text pieces as a model reads them, on a baseline, each with its index under it (t1, t2 ...),
    // arriving left to right; the focus token is lit (its underline blooms). o: {x, y, w, tokens, focus, gap, at, by}.
    // Returns {E, t, top(i) (the point an arc leaves from), box(i), focus(i, t)}
    H.tokens = function (name, o) {
      o = o || {};
      const t = T0(o), toks = (o.tokens || []).map(String), gap = o.gap || 30, role = o.role || "label", sz = 30;
      const ws = toks.map((s) => Math.max(36, K().measure(s, role, sz) + 8)), total = ws.reduce((a, b) => a + b, 0) + gap * Math.max(0, toks.length - 1);
      const w = Math.max(o.w || total, total), h = 112, E = piece(name, { x: o.x, y: o.y, w, h }, "label", Object.assign({ depth: "near" }, o)), g = svg("g", {}, E.body);
      const each = o.by != null && toks.length ? clamp((o.by - t) / toks.length, 0.05, 0.4) : 0.12;
      let x = (w - total) / 2;
      const B = toks.map((s, i) => {
        const bx = x, bw = ws[i], at = t + i * each, foc = i === o.focus;
        words(E, g, s, { x: bx, y: 0, w: bw, h: 48 }, at, { role, tone: foc ? "ink" : "muted", align: "center", weight: foc ? 700 : 400, cursor: false, dur: 0.1 });
        const ul = svg("g", foc ? { filter: HAL } : {}, g);
        stroke(E, ul, [[bx + 2, 56], [bx + bw - 2, 56]], at + 0.05, 0.15, { tone: foc ? "accent" : "line", weight: foc ? 1.1 : 0.5, op: foc ? 1 : lineOp(E, 0.5), halo: false, part: "underline" });
        words(E, g, "t" + (i + 1), { x: bx, y: 64, w: bw, h: 30 }, at + 0.1, { role: "caption", tone: "line", align: "center", cursor: false, dur: 0.08 });
        x += bw + gap;
        return { x: o.x + bx, w: bw, at };
      });
      reveal(E, t);
      const Hd = { E, t: t + toks.length * each + 0.2, tokens: toks };
      Hd.top = (i) => [B[i].x + B[i].w / 2, o.y - 6];
      Hd.box = (i) => ({ rect: { x: B[i].x, y: o.y, w: B[i].w, h: 60 }, depth: E.__holo.depth, name: name + "_" + i });
      E.handle = Hd;
      return Hd;
    };

    // ---- weighted arcs: relations with a strength (attention between tokens, dependencies, flows), as curves that rise
    // between points, their width and light by weight; the strong ones bloom. A weight is written at a strong arc's apex
    // (words never in the bloom). o: {points: {id: [x, y]}, links: [{from, to, w}], at, by, tone, label (min weight to
    // label, default 0.3), lift}. Coordinates are the HUD's.
    H.arcs = function (name, o) {
      o = o || {};
      const t = T0(o), P_ = o.points || {}, L_ = (o.links || []).filter((l) => P_[l.from] && P_[l.to]);
      const lift = o.lift == null ? 0.42 : o.lift;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const geo = L_.map((l) => {
        const a = P_[l.from], b = P_[l.to], d = Math.abs(b[0] - a[0]), ht = Math.max(30, d * lift), my = Math.min(a[1], b[1]) - ht;
        x0 = Math.min(x0, a[0], b[0]); x1 = Math.max(x1, a[0], b[0]); y0 = Math.min(y0, my - 40); y1 = Math.max(y1, a[1], b[1]);
        return { l, a, b, my };
      });
      const box = { x: x0 - 10, y: y0 - 10, w: x1 - x0 + 20, h: y1 - y0 + 20 };
      const E = piece(name, box, "instrument", o), g = svg("g", {}, E.body), gw = svg("g", {}, g), gs = svg("g", { filter: HAL }, g), gt = svg("g", {}, g);
      const order = geo.slice().sort((p, q) => p.l.w - q.l.w), span = o.by != null ? Math.max(0.4, o.by - t) : 0.9;
      order.forEach((G, k) => {
        const { l, a, b, my } = G, w = clamp(l.w, 0, 1), strong = w >= (o.strong == null ? 0.5 : o.strong);
        const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40, x = lerp(a[0], b[0], u), y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * my + u * u * b[1]; pts.push([x - box.x, y - box.y]); }
        const at = t + span * (k / Math.max(1, order.length));
        stroke(E, strong ? gs : gw, pts, at, 0.45, { tone: strong ? (o.tone || "accent") : "line", w: (0.7 + 5.5 * w).toFixed(2), op: (0.16 + 0.84 * Math.sqrt(w)).toFixed(3), halo: false, cap: "round", part: "arc" });
        if (w >= (o.label == null ? 0.3 : o.label)) {
          const mx = (a[0] + b[0]) / 2 - box.x, myy = (a[1] + b[1]) / 4 + my / 2 - box.y;
          // the weight sits just above its arc's apex on a dark plate, so a crossing arc never runs through the number
          const lg = svg("g", {}, gt);
          const pl = svg("rect", { x: f1(mx - 38), y: f1(myy - 44), width: 76, height: 34, fill: S().c("field"), opacity: 0 }, lg);
          fadeIn(pl, at + 0.38, 0.12, 0.88, name);
          words(E, lg, w.toFixed(2), { x: mx - 30, y: myy - 44, w: 60, h: 34 }, at + 0.4, { role: "caption", tone: strong ? "ink" : "muted", align: "center", cursor: false, dur: 0.1 });
        }
      });
      reveal(E, t);
      E.handle = { E, t: t + span + 0.5 };
      return E.handle;
    };

    // ---- a trace: the path a value takes (a token's state rising through the layers to the output, a request through a
    // system), a lit line that draws on and blooms, with one pulse that travels it, and an optional small label on a
    // dark plate beside one of its points. o: {points: [[x, y], ...], at, dur, tone, pulse (s), label: {at: i, text, side}}
    H.trace = function (name, o) {
      o = o || {};
      const t = T0(o), pts0 = o.points || [], dur = o.dur || 1.0, lb = o.label || null;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [x, y] of pts0) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      let lr = null;
      if (lb) { const q = pts0[clamp(lb.at | 0, 0, pts0.length - 1)], lw = Math.max(80, K().measure(String(lb.text), "caption", 22) + 30); lr = { x: lb.side === "left" ? q[0] - lw - 16 : q[0] + 16, y: q[1] - 21, w: lw, h: 42 }; x0 = Math.min(x0, lr.x); x1 = Math.max(x1, lr.x + lw); y0 = Math.min(y0, lr.y); y1 = Math.max(y1, lr.y + 42); }
      const box = { x: x0 - 12, y: y0 - 12, w: x1 - x0 + 24, h: y1 - y0 + 24 };
      const E = piece(name, box, "instrument", o), g = svg("g", {}, E.body), gl = svg("g", { filter: HAL }, g);
      const pts = pts0.map(([x, y]) => [x - box.x, y - box.y]), tone = o.tone || "accent";
      stroke(E, gl, pts, t, dur, { tone, weight: 1.0, halo: false, cap: "round", part: "trace" });
      // one pulse along it after it has drawn: a bright dot that runs the path once (a pure function of time)
      const pd = o.pulse == null ? 1.0 : o.pulse, pk = svg("circle", { cx: 0, cy: 0, r: 5, fill: S().c("ink"), opacity: 0 }, gl);
      const L_ = [0]; for (let i = 1; i < pts.length; i++) L_.push(L_[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      if (pd > 0) {
        note(t + dur, t + dur + pd, "travel", name, true);
        onClock((tt) => {
          const u = (tt - t - dur) / pd;
          if (!(u >= 0 && u <= 1)) { setA(pk, "opacity", "0"); return; }
          const d = inOut(u) * L_[L_.length - 1]; let i = 1; while (i < L_.length - 1 && L_[i] < d) i++;
          const k = (d - L_[i - 1]) / ((L_[i] - L_[i - 1]) || 1);
          setA(pk, "cx", f1(lerp(pts[i - 1][0], pts[i][0], k))); setA(pk, "cy", f1(lerp(pts[i - 1][1], pts[i][1], k)));
          setA(pk, "opacity", (u < 0.1 ? u / 0.1 : u > 0.9 ? (1 - u) / 0.1 : 1).toFixed(3));
        });
      }
      if (lr) {
        const lg = svg("g", {}, g);
        const pl = svg("rect", { x: f1(lr.x - box.x), y: f1(lr.y - box.y), width: f1(lr.w), height: 42, fill: S().c("field"), opacity: 0 }, lg);
        fadeIn(pl, t + dur * 0.6, 0.2, 0.85, name);
        words(E, lg, String(lb.text), { x: lr.x - box.x + 14, y: lr.y - box.y, w: lr.w - 28, h: 42 }, t + dur * 0.6 + 0.05, { role: "caption", tone: "muted", cursor: false, dur: 0.15 });
      }
      reveal(E, t);
      E.handle = { E, t: t + dur + pd };
      return E.handle;
    };

    // ---- a distribution: what comes next, as rows of a label, a hairline track with a light bar and the probability
    // at the precision it has (0.618), the picked row lit and blooming, with a dim note under it. o: {x, y, w, title,
    // rows: [[label, p]], pick, decimals, note, at, by}. Returns {E, t, pick(i, t)}
    H.dist = function (name, o) {
      o = o || {};
      const t = T0(o), rows = o.rows || [], w = o.w || 520, rh = o.rowH || 62, top = o.title ? 48 : 0, h = top + rows.length * rh + (o.note ? 40 : 0) + 8;
      const E = piece(name, { x: o.x, y: o.y, w, h }, "instrument", Object.assign({ depth: "near" }, o)), g = svg("g", {}, E.body);
      if (o.title) words(E, g, String(o.title), { x: 0, y: 0, w, h: 34 }, t, { role: "caption", tone: "muted", cursor: false, dur: 0.15 });
      const dec = o.decimals == null ? 3 : o.decimals, max = Math.max(1e-9, ...rows.map((r) => +r[1] || 0));
      const lw = Math.min(w * 0.34, Math.max(...rows.map((r) => K().measure(String(r[0]), "label", 30))) + 18), vw = K().measure((0).toFixed(dec), "label", 30) * 1.1 + 18;
      const tx0 = lw + 10, tw = w - lw - vw - 26, each = o.by != null && rows.length ? clamp((o.by - t) / rows.length, 0.06, 0.4) : 0.12;
      const R_ = rows.map((r, i) => {
        const y = top + i * rh, at = t + 0.1 + i * each, p = +r[1] || 0, len = Math.max(4, p / max * tw);
        const lab = words(E, g, String(r[0]), { x: 0, y, w: lw, h: 44 }, at, { role: "label", tone: "muted", cursor: false, dur: 0.1 });
        svg("rect", { x: f1(tx0), y: f1(y + 21), width: f1(tw), height: 1, fill: col("line"), opacity: 0.35 }, g);
        const bar = svg("g", {}, g);
        const fill = svg("rect", { x: f1(tx0), y: f1(y + 15), width: f1(len), height: 13, fill: col("accent"), opacity: 0 }, bar);
        Loom.tween(fill, { opacity: 0 }, { opacity: 0.42, duration: 0.3 }, at + 0.05, meta(name, "reveal"));
        const val = words(E, g, p.toFixed(dec), { x: w - vw, y, w: vw, h: 44 }, at + 0.08, { role: "label", tone: "muted", align: "right", weight: 700, cursor: false, dur: 0.1 });
        return { y, fill, bar, lab, val, len };
      });
      const Hd = { E, t: t + 0.1 + rows.length * each + 0.3 };
      // the pick: the row's bar becomes light (bright, blooming), its words ink, and the note appears under it
      Hd.pick = function (i, when) {
        const r = R_[i]; if (!r) throw new Error(`${beat.id}: dist "${name}" has no row ${i}`);
        const hot = svg("g", { filter: HAL, opacity: 0 }, g);
        svg("rect", { x: f1(tx0), y: f1(r.y + 15), width: f1(r.len), height: 13, fill: col("accent"), opacity: 0.95 }, hot);
        svg("rect", { x: f1(tx0 + r.len - 2), y: f1(r.y + 9), width: 3, height: 25, fill: col("ink") }, hot);
        Loom.tween(hot, { opacity: 0 }, { opacity: 1, duration: 0.25 }, when, meta(name, "state"));
        for (const tx of [r.lab.text, r.val.text]) Loom.set(tx, { attr: { fill: S().c("ink") } }, when);
        if (o.note) words(E, g, String(o.note), { x: 0, y: top + rows.length * rh + 2, w, h: 32 }, when + 0.2, { role: "caption", tone: "line", cursor: false, dur: 0.12 });
        return when + 0.3;
      };
      if (o.pick != null) Hd.pick(o.pick, o.pickAt != null ? o.pickAt : Hd.t);
      reveal(E, t);
      E.handle = Hd;
      return Hd;
    };

    // ================================================================ power, flashes, modes, camera

    // ---- boot-up and power-down for any HUD element (or a handle): up = a bright line opens into the panel; down = the
    // panel collapses to a line, the line to a point, then it is gone. A section's ending.
    H.power = function (target, dir, when, o) {
      o = o || {};
      const E = target.E || target, w = E.w, h = E.h, node = E.pwr || E.inner;
      const line = svg("rect", { x: 0, y: f1(h / 2 - 1.5), width: f1(w), height: 3, fill: col("accent"), opacity: 0 }, E.inner);
      const xf = (sx, sy) => `translate(${f1(w / 2)} ${f1(h / 2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${f1(-w / 2)} ${f1(-h / 2)})`;
      const up = dir === "up", dur = up ? 0.55 : 0.6;
      // up: a bright line opens from the centre (0 to 0.3), then the panel opens from the line (0.3 to 1)
      // down: the panel closes to the line (0 to 0.45), the line shrinks to a point and goes (0.45 to 1)
      Loom.drive((e, raw) => {
        const u = clamp(raw, 0, 1);
        if (up) {
          const a = smooth(u / 0.3), b = outCubic((u - 0.3) / 0.7);
          setA(line, "opacity", (u <= 0 || u >= 1 ? 0 : 0.9 * a * (1 - b * b)).toFixed(3));
          setA(line, "transform", xf(Math.max(0.002, a), 1));
          setA(node, "transform", u >= 1 ? "" : xf(1, Math.max(0.01, b)));
          setA(node, "opacity", (u <= 0.3 ? 0 : clamp(b * 1.4, 0, 1)).toFixed(3));
        } else {
          const a = smooth(u / 0.45), b = smooth((u - 0.45) / 0.55);
          setA(node, "transform", u <= 0 ? "" : xf(1, Math.max(0.01, 1 - a)));
          setA(node, "opacity", (u <= 0 ? 1 : u >= 0.45 ? 0 : 1 - 0.4 * a).toFixed(3));
          setA(line, "opacity", (u < 0.4 || u >= 1 ? 0 : 0.9 * (1 - b)).toFixed(3));
          setA(line, "transform", xf(Math.max(0.002, 1 - b), 1));
        }
      }, when, dur, "linear", { kind: up ? "reveal" : "exit", beat: beat.id, name: E.name + ".power", content: true, key: "holopower:" + E.name });
      if (up) reveal(E, when); else { E.exitT = when; E.exitKind = "power"; }
      return when + dur;
    };

    // ---- one flash on an element's lines (an outline lift for 0.14 s), budgeted to three a second for the film
    H.flash = function (target, when) {
      const E = target.E || target, at = flashSlot(when, `${beat.id} flash ${E.name}`);
      const ring = svg("rect", { x: -6, y: -6, width: f1(E.w + 12), height: f1(E.h + 12), fill: "none", stroke: col("ink"), "stroke-width": 2, opacity: 0 }, E.inner);
      Loom.tween(ring, { opacity: 0 }, { opacity: 0.85, duration: 0.07 }, at, meta(E.name, "state"));
      Loom.tween(ring, { opacity: 0.85 }, { opacity: 0, duration: 0.07 }, at + 0.07, meta(E.name, "state"));
      return at + 0.14;
    };

    // ---- the register: "analysis" raises the far layer and dims the briefing pieces (to `dim`), "briefing" restores.
    // One call on a cue, like a suit switching modes; nothing is redrawn.
    const modes = [];
    H.mode = function (m, when, o) {
      o = o || {};
      const keep = new Set((o.keep || []).map((h) => (h.E || h)));
      const dimTo = o.dim == null ? 0.3 : o.dim, dur = o.dur || 0.6;
      const brief = (H.reg.briefing || []).filter((E) => !keep.has(E)), ana = H.reg.analysis || [];
      const prev = modes.length ? modes[modes.length - 1].m : "briefing";
      if (prev === m) return when;
      for (const E of brief) Loom.tween(E.body, { opacity: m === "analysis" ? 1 : dimTo }, { opacity: m === "analysis" ? dimTo : 1, duration: dur }, when, meta(E.name, "state"));
      for (const E of ana) Loom.tween(E.body, { opacity: m === "analysis" ? 0.4 : 1 }, { opacity: m === "analysis" ? 1 : 0.4, duration: dur }, when, meta(E.name, "state"));
      modes.push({ m, at: when, dur });
      H.mode_ = m;
      return when + dur;
    };

    // ---- the camera: the place camera (Loom.cam) on the HUD's layers, plus what a HUD adds: pushing THROUGH the near
    // layer (it fades as it passes the viewer) and a 2.5D orbit (layers shift against each other about the mid layer and
    // narrow a little, as if the rig turned), at most 10 degrees, eased, one move at a time.
    // a lean-in crops what is beside the subject on purpose: the HUD declares the camera's window as a bleed (the film
    // check's declared exemption, SCENE_API "Film checks"), from the first move until the frame is whole again
    const bleed = () => {
      if (!R.cams.length) return;
      const t0 = R.cams[0].t0, lastWhole = R.cams.filter((m) => m.kind === "push" && m.scale === 1 && m.to[0] === 960 && m.to[1] === 540).pop();
      const t1 = lastWhole ? lastWhole.t1 : Math.max(ctx.end, R.cams[R.cams.length - 1].t1);
      E0.outer.setAttribute("data-bleed", `${t0.toFixed(2)}-${t1.toFixed(2)}`);
    };
    const camMove = (fn) => (o) => { const end = fn(R, o); bleed(); return end; };
    H.push = camMove((R_, o) => Loom.cam.push(R_, o));
    H.pan = camMove((R_, o) => Loom.cam.pan(R_, o));
    H.pull = camMove((R_, o) => Loom.cam.pull(R_, Object.assign({ to: [960, 540], scale: 1 }, o || {})));
    // push THROUGH: the near layer (its words included) dissolves as the camera passes it, so a lean-in never parks a
    // cut-off panel in front of the subject
    H.through = camMove((R_, o) => { o = Object.assign({ scale: 1.6 }, o || {}); R_.through = true; return Loom.cam.push(R_, o); });
    const orbits = [];
    H.orbit = function (o) {
      o = o || {};
      const t0 = o.t0, t1 = o.t1 || t0 + 2.2, deg = clamp(o.deg == null ? 8 : o.deg, -10, 10);
      if (Math.abs(o.deg || 0) > 10) Loom.warn("holo_orbit_clamped", `${beat.id}: an orbit of ${o.deg} degrees was clamped to 10 (motion sensitivity, WCAG 2.3.3)`);
      if (!(t1 - t0 >= 1.2)) Loom.warn("holo_camera_fast", `${beat.id}: an orbit in ${(t1 - t0).toFixed(2)}s; camera moves take 1.2s or more`);
      orbits.push({ t0, t1, deg }); orbits.sort((a, b) => a.t0 - b.t0);
      note(t0, t1, "camera", (opts.name || "hud") + ".orbit", false);
      return t1;
    };
    let balanced = false;
    const orbitAt = (tt) => { let a = 0; for (const m of orbits) { if (tt <= m.t0) break; a = lerp(a, m.deg, inOut((tt - m.t0) / (m.t1 - m.t0))); } return a; };
    onClock((tt) => {
      if (!balanced) { balanced = true; if (opts.balance !== false) balanceCheck(); }
      const th = orbitAt(tt) * DEG, cam = Loom.cam && Loom.cam.at && R.cams.length ? Loom.cam.at(R, tt) : { s: 1 };
      for (const nm in layers) {
        const Lr = layers[nm], dz = Lr.depth - layers.mid.depth;
        const dx = -Math.sin(th) * 1100 * dz, sx = 1 - (1 - Math.cos(th)) * (0.6 + Lr.depth * 0.4);
        setA(Lr.orb, "transform", th ? `translate(${f1(960 + dx)} 0) scale(${sx.toFixed(4)} 1) translate(-960 0)` : "");
        let op = 1;
        // the near layer is gone before the push crops it: a title cut mid-word at the frame edge read as an error
        // (holo_lesson at 15.6 s, 2026-10-16), so it fades over the first tenth of the scale and comes back the same way
        if (R.through && nm === "near") { const k = 1 + (cam.s - 1) * Lr.depth; op = 1 - smooth((k - 1.01) / 0.09); }
        setA(Lr.orb, "opacity", op.toFixed(3));
      }
    });
    // what this beat draws, for the audit (D-194): holograms (light objects) or console UI (panels and plates). Kshitij:
    // "The hologram style needs the holograms more than anything ... there has to be lesser normal corporate UI"
    const U = ((Loom.report.holoUse = Loom.report.holoUse || {})[beat.id] = Loom.report.holoUse[beat.id] || { holo: [], ui: [], heroes: [] });
    for (const k of Object.keys(H)) {
      const f = H[k];
      if (typeof f !== "function" || !(HOLO_CALLS.has(k) || UI_CALLS.has(k))) continue;
      H[k] = function () {
        (HOLO_CALLS.has(k) ? U.holo : U.ui).push(k);
        if (k === "hero3d") U.heroes.push({ name: arguments[0], asset: !!(((Loom.assets || {}).hero3d || {})[beat.id + ":" + ((arguments[1] || {}).asset || arguments[0])]) });
        return f.apply(this, arguments);
      };
    }
    return H;
  }

  // the light objects that ARE the style (the subject made of light) and the console furniture around them
  const HOLO_CALLS = new Set(["hero3d", "object", "globe", "mesh", "plane", "orbit", "trace", "arcs", "wave", "scanner", "flow", "tokens", "dist"]);
  const UI_CALLS = new Set(["panel", "card", "readout", "gauge", "gauges", "bars", "datum", "callout", "tag", "title"]);
  const HOLO_SHARE = 0.75;   // of a hologram lesson's bespoke beats, at least this share show a hologram
  /** the engine audit (boot, after every scene): every declared hero placed and rendered, a hero beat drawing a hologram,
   *  and holograms, not console UI, carrying the lesson. Errors, sent to each beat's author. */
  function audit(manifest) {
    const use = Loom.report.holoUse || {}, beats = (manifest.scenes || []).filter((s) => s.kind === "bespoke" && s.beat);
    if (!beats.length) return;
    const uiOnly = [];
    for (const s of beats) {
      const u = use[s.beat] || { holo: [], ui: [], heroes: [] };
      for (const name of Object.keys(s.hero3d || {})) {
        const h = u.heroes.find((q) => q.name === name);
        if (!h) Loom.error("holo_hero_unplaced", `${s.beat}: the storyboard's hero "${name}" is rendered but the scene never places it: call H.hero3d("${name}", ...) in ${s.beat}`, { beat: s.beat });
      }
      const d = s.design && typeof s.design === "object" ? s.design : {};
      if (d.hero && !u.holo.length) Loom.error("holo_hero_not_drawn", `${s.beat}: design.hero says "${String(d.hero).slice(0, 60)}" but the scene draws no hologram (H.object, H.plane, H.globe, H.mesh, H.trace, H.hero3d ...)`, { beat: s.beat });
      if (!u.holo.length) uiOnly.push(s.beat);
    }
    const share = 1 - uiOnly.length / beats.length;
    if (beats.length >= 4 && share < HOLO_SHARE)
      Loom.error("holo_ui_heavy", `${uiOnly.length} of ${beats.length} hologram beats show no hologram, only console UI or kit shapes (${uiOnly.join(", ")}): ` +
        `the style is the subject made of light; give each of them a hologram (a hero, an object, a plane in depth, a globe, a mesh, a trace) and keep panels the minority`, { beat: uiOnly[0] });
  }


  // ---------------------------------------------------------------- the template skin (D-198)
  // A catalog template on the console is projected as light, never a slide restyled cyan (the essence's first avoid):
  // a card is a plane (a dark plate under its words, a faint hairline, corner brackets and one hot edge) that a scan band
  // builds top to bottom; a disc is a reticle; a row is a readout on the console itself (no box); a band is a rule in its
  // status colour; a bar is a column of light; words type on with a caret; lines draw on with their glow. The console has
  // no performer, so each part comes on its own word. Only the part being spoken has the hot edge: when the next sibling
  // arrives the last one steps back to idle (the system reports one thing at a time). A word marked when spoken gets the
  // lock's brackets.
  const SK_PLAIN = new Set(["surface", "surface2", "field", "field2", "line", "shadow", "none", "ink", "muted"]);
  const skColoured = (t) => !!t && typeof t === "string" && !SK_PLAIN.has(t) && !t.startsWith("#");
  const toneOf = (t) => (t === "pos" ? "accent4" : t === "neg" ? "accent3" : skColoured(t) ? t : "accent");
  function skinOf() {
    const slot = (S, p) => { const g = svg("g", { "data-skin": "slot" }, p); return g; };
    function add(S, p, part) {
      const E = S.owner(p);
      if (!E) return null;
      part.g = slot(S, p);
      return S.add(E, part);
    }
    function box(S, p, x, y, w, h, o, r) {
      o = o || {};
      const E = S.owner(p);
      if (!E || (o.fill === "none" && !o.stroke)) return S.baseK.rect(p, x, y, w, h, o);
      const fill = o.fill || "surface", thin = Math.min(w, h), long = Math.max(w, h);
      if (thin <= 14 || (thin <= 40 && long >= thin * 3)) {        // a rule of light (a desk top, a progress bar, a strip)
        const yy = thin <= 14 ? y + h / 2 : y + h;
        add(S, p, { kind: "line", pts: h <= w ? [[x, yy], [x + w, yy]] : [[x + w / 2, y], [x + w / 2, y + h]], tone: skColoured(fill) ? toneOf(fill) : "line", op: skColoured(fill) ? 0.9 : 0.45 });
        return slot(S, p);
      }
      const band = y <= 1 && h <= 140 && E.w && w >= E.w * 0.8 && h < (E.h || 1e9) * 0.5;
      if (band) {                                                   // a header band: a status rule under the header
        add(S, p, { kind: "line", pts: [[x, y + h], [x + w, y + h]], tone: skColoured(fill) ? toneOf(fill) : "accent", op: 0.9 });
        (S.data.band = S.data.band || new Set()).add(E);
        return slot(S, p);
      }
      if (["row", "structure", "instrument"].includes(E.kind)) return slot(S, p);   // a readout on the console itself
      if (E.kind === "bar") { add(S, p, { kind: "bar", x, y, w, h, tone: toneOf(fill) }); return slot(S, p); }
      add(S, p, { kind: "plane", x, y, w, h, tone: skColoured(fill) ? toneOf(fill) : "accent", plane: true });
      return slot(S, p);
    }
    return {
      version: "1",
      summary: "a template projected as light on the console: planes built by a scan (plate, hairline, brackets, one hot edge), reticles, readouts without boxes, status rules, columns of light, words typed on, the spoken part locked",
      refuse: ["scenario.dialogue", "calendar.plan"],
      classic: ["peep", "sketch"],
      kit: {
        rect: (S, p, x, y, w, h, o) => box(S, p, x, y, w, h, o),
        card: (S, p, x, y, w, h, o) => box(S, p, x, y, w, h, Object.assign({ fill: "surface" }, o)),
        pill: (S, p, x, y, w, h, o) => box(S, p, x, y, w, h, o, h / 2),
        disc(S, p, cx, cy, r, o) {
          o = o || {};
          if (!S.owner(p)) return S.baseK.disc(p, cx, cy, r, o);
          const tone = toneOf(o.fill);
          if (r <= 14) add(S, p, { kind: "dot", cx, cy, r: Math.max(4, r * 0.55), tone });
          else add(S, p, { kind: "ring", cx, cy, r, tone });
          return slot(S, p);
        },
        line(S, p, x1, y1, x2, y2, o) {
          o = o || {};
          if (!S.owner(p)) return S.baseK.line(p, x1, y1, x2, y2, o);
          add(S, p, { kind: "line", pts: [[x1, y1], [x2, y2]], tone: o.stroke === "line" || !o.stroke ? "line" : toneOf(o.stroke), op: o.stroke === "line" || !o.stroke ? 0.55 : 0.9, dash: o.dash ? "6 10" : null });
          return slot(S, p);
        },
        arrow(S, p, x1, y1, x2, y2, o) {
          o = o || {};
          const E = S.owner(p);
          if (!E) return S.baseK.arrow(p, x1, y1, x2, y2, o);
          const a = Math.atan2(y2 - y1, x2 - x1), hl = 16;
          add(S, p, { kind: "line", pts: [[x1, y1], [x2, y2]], tone: "accent", op: 0.8 });
          add(S, p, { kind: "line", pts: [[x2 + Math.cos(a + 2.6) * hl, y2 + Math.sin(a + 2.6) * hl], [x2, y2], [x2 + Math.cos(a - 2.6) * hl, y2 + Math.sin(a - 2.6) * hl]], tone: "accent", op: 0.9 });
          const g = slot(S, p);
          return { g, path: g, head: g, __skinE: E };
        },
        path(S, p, d, o) {
          o = o || {};
          const el = S.baseK.path(p, d, o), E = S.owner(p);
          if (!E || !o.stroke || o.stroke === "none") return el;
          el.setAttribute("opacity", 0); el.setAttribute("data-skin", "ghost");
          let L = 0; try { L = el.getTotalLength(); } catch (e) { L = 0; }
          const pts = [];
          for (let i = 0, n = Math.max(2, Math.ceil(L / 6)); i <= n; i++) { const q = el.getPointAtLength(L * i / n); pts.push([q.x, q.y]); }
          if (pts.length > 1) add(S, p, { kind: "line", pts, tone: o.stroke === "line" ? "line" : toneOf(o.stroke), op: o.stroke === "line" ? 0.55 : 0.9, dash: o.dash ? "4 10" : null });
          return el;
        },
        polygon(S, p, pts, o) {
          o = o || {};
          if (!S.owner(p) || !pts || pts.length < 2) return S.baseK.polygon(p, pts, o);
          const P = pts.map((q) => (Array.isArray(q) ? q : [q.x, q.y]));
          add(S, p, { kind: "line", pts: P.concat([P[0]]), tone: toneOf(o.fill), op: 0.8 });
          return slot(S, p);
        },
        icon(S, p, name, o) {
          o = o || {};
          if (!S.owner(p)) return S.baseK.icon(p, name, o);
          const g = S.baseK.icon(p, name, Object.assign({}, o, { color: o.color && skColoured(o.color) ? o.color : "accent" }));
          g.setAttribute("data-skin", "glyph");
          add(S, p, { kind: "glyph", node: g });
          return g;
        },
        mark(S, p, kind, cx, cy, size, o) {
          if (!S.owner(p)) return S.baseK.mark(p, kind, cx, cy, size, o);
          const s = size || 56;
          if (kind === "yes") add(S, p, { kind: "line", pts: [[cx - s * 0.3, cy], [cx - s * 0.08, cy + s * 0.24], [cx + s * 0.32, cy - s * 0.24]], tone: "accent4", op: 1 });
          else { add(S, p, { kind: "line", pts: [[cx - s * 0.26, cy - s * 0.26], [cx + s * 0.26, cy + s * 0.26]], tone: "accent3", op: 1 }); add(S, p, { kind: "line", pts: [[cx + s * 0.26, cy - s * 0.26], [cx - s * 0.26, cy + s * 0.26]], tone: "accent3", op: 1 }); }
          return slot(S, p);
        },
        text(S, p, str, o) {
          o = o || {};
          const tn = S.baseK.text(p, str, Object.assign({}, o, { color: o.color && ["field", "onAccent"].includes(o.color) ? "ink" : o.color }));
          if (S.owner(p)) { tn.setAttribute("data-skin", "words"); S.add(S.owner(p), { kind: "words", node: tn, len: String(str).length }); }
          return tn;
        },
        kicker(S, p, str, o) {
          const tn = S.baseK.kicker(p, str, Object.assign({}, o || {}, { color: (o && o.color) || "accent" }));
          if (S.owner(p)) tn.setAttribute("data-skin", "words");
          if (S.owner(p)) S.add(S.owner(p), { kind: "words", node: tn, len: String(str).length });
          return tn;
        },
      },
      // the lock: four brackets close on the spoken words and stay
      emphasis(S, textEl, t, o) {
        const f = textEl && textEl.__fit, E = S.owner(textEl);
        if (!f || !E) return S.baseM.highlight(textEl, t, o);
        if (S.data.band && S.data.band.has(E)) return null;
        S.item(E, t - 0.05, [{ kind: "lock", parent: textEl.parentNode, box: [f.x - 14, f.y - 8, (o.w || f.width) + 28, f.height + 16] }], "emphasis");
        return null;
      },
      perform(S, items) {
        const ctx = S.ctx, C = cfg(), beat = ctx.beat;
        const meta = (E, k) => ({ kind: k || "draw", beat: beat.id, name: E.name, content: true });
        const sw = () => baseStroke();
        let blurId = null;
        if (C.glow && C.blur > 0) {
          blurId = "lmholo_skin_" + beat.id;
          let root = ctx.g; while (root.ownerSVGElement) root = root.ownerSVGElement;
          if (!root.querySelector("#" + blurId)) { const fl = svg("filter", { id: blurId, x: "-10%", y: "-10%", width: "120%", height: "120%" }, svg("defs", {}, root)); svg("feGaussianBlur", { stdDeviation: C.blur }, fl); }
        }
        const line = (E, g, pts, t, dur, o) => {
          const c = col(o.tone), d = dpath(pts, o.closed), L = Math.max(1, plen(pts, o.closed)), w = o.w || sw();
          if (C.glow && o.halo !== false) {
            const h = svg("path", { d, fill: "none", stroke: c, "stroke-width": (+w + C.halo_width * 2).toFixed(2), "stroke-linecap": "round", opacity: 0, filter: blurId ? `url(#${blurId})` : null }, g);
            Loom.tween(h, { opacity: 0 }, { opacity: +(C.halo * (o.op == null ? 1 : o.op)).toFixed(3), duration: dur * 0.8 + 0.1 }, t + dur * 0.2, meta(E));
          }
          const p = svg("path", { d, fill: "none", stroke: c, "stroke-width": w, "stroke-linecap": "square", opacity: 0,
            "stroke-dasharray": o.dash || `${L.toFixed(1)} ${(L + 8).toFixed(1)}`, "stroke-dashoffset": o.dash ? 0 : L.toFixed(1) }, g);
          Loom.tween(p, { opacity: 0 }, { opacity: o.op == null ? 0.9 : o.op, duration: o.dash ? dur : 0.01, ease: "none" }, t, meta(E));
          if (!o.dash) Loom.tween(p, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: dur, ease: "none" }, t, meta(E));
          return p;
        };
        const hot = new Map();          // an element kind -> its last plane's hot edge (stepped back when a sibling arrives)
        for (const it of items) {
          const E = it.E, t = Math.max(it.t, ctx.start || 0, 0);
          const hasPlane = it.parts.some((q) => q.plane);
          let k = 0, end = t;
          if (hasPlane) {                               // the scan band builds the plane: a clip opens top to bottom under a bright line
            const b = { x: 0, y: 0, w: E.w || 0, h: E.h || 0 };
            if (!(b.w > 0 && b.h > 0)) { try { const bb = E.inner.getBBox(); b.x = bb.x; b.y = bb.y; b.w = bb.width; b.h = bb.height; } catch (e) { /* unmeasured */ } }
            const id = Loom.uid("lmholoscan"), pad = 10;
            const cp = svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, svg("defs", {}, E.outer));
            const r = svg("rect", { x: f1(b.x - pad), y: f1(b.y - pad), width: f1(b.w + 2 * pad), height: 0 }, cp);
            E.life.setAttribute("clip-path", `url(#${id})`);
            const dur = clamp(0.25 + b.h / 1600, 0.3, 0.6);
            Loom.tween(r, { attr: { height: 0 } }, { attr: { height: b.h + 2 * pad }, duration: dur, ease: Loom.ease.enter }, t, meta(E, "scan"));
            const band = svg("rect", { x: f1(b.x - 4), y: f1(b.y), width: f1(b.w + 8), height: 2.4, fill: col("accent"), opacity: 0, "data-skin": "scan" }, E.inner);
            Loom.drive((e, raw) => { band.setAttribute("y", f1(b.y + b.h * e)); band.setAttribute("opacity", raw > 0 && raw < 1 ? (0.85 * (1 - raw * 0.6)).toFixed(3) : "0"); }, t, dur, "enter", { kind: "scan", beat: beat.id, name: E.name + ".scan", content: false });
            end = t + dur;
          }
          for (const q of it.parts) {
            const tq = t + 0.05 + 0.05 * k++;
            if (q.kind === "plane") {
              const g = q.g, c = clamp(Math.min(q.w, q.h) * 0.12, 12, 30);
              const pl = svg("rect", { x: f1(q.x), y: f1(q.y), width: f1(q.w), height: f1(q.h), fill: S_().c("surface"), opacity: 0, stroke: "none" }, g);
              Loom.tween(pl, { opacity: 0 }, { opacity: 0.82, duration: 0.3 }, tq, meta(E, "reveal"));
              line(E, g, [[q.x, q.y], [q.x + q.w, q.y], [q.x + q.w, q.y + q.h], [q.x, q.y + q.h]], tq + 0.05, 0.4, { closed: true, tone: "line", op: 0.35, halo: false, w: Math.max(1, sw() * 0.5) });
              for (const bk of brackets(q.x, q.y, q.w, q.h, c)) line(E, g, bk, tq, 0.25, { tone: q.tone, op: 1, w: (sw() * 1.15).toFixed(2) });
              // the hot edge: the top edge in the plane's tone, bright while this is the part being spoken
              const he = line(E, g, [[q.x + c + 6, q.y], [q.x + q.w - c - 6, q.y]], tq + 0.1, 0.3, { tone: q.tone, op: 0.95, w: (sw() * 1.3).toFixed(2) });
              const prev = hot.get(E.kind);
              if (prev && prev.E !== E) Loom.tween(prev.he, { opacity: 0.95 }, { opacity: 0.25, duration: 0.4 }, tq, meta(prev.E, "state"));
              hot.set(E.kind, { E, he });
            } else if (q.kind === "line") line(E, q.g, q.pts, tq, clamp(plen(q.pts) / 1800, 0.18, 0.6), { tone: q.tone, op: q.op, dash: q.dash });
            else if (q.kind === "ring") {
              const g = q.g, pts = [];
              for (let i = 0; i <= 48; i++) { const a = -Math.PI / 2 + i / 48 * Math.PI * 2; pts.push([q.cx + Math.cos(a) * q.r, q.cy + Math.sin(a) * q.r]); }
              const pl = svg("circle", { cx: f1(q.cx), cy: f1(q.cy), r: f1(q.r), fill: S_().c("surface"), opacity: 0 }, g);
              Loom.tween(pl, { opacity: 0 }, { opacity: 0.8, duration: 0.25 }, tq, meta(E, "reveal"));
              line(E, g, pts, tq, 0.35, { tone: q.tone, op: 0.95 });
              for (const a of [0, 90, 180, 270]) {      // the reticle's four ticks
                const ra = a * Math.PI / 180, r0 = q.r + 4, r1 = q.r + 12;
                line(E, g, [[q.cx + Math.cos(ra) * r0, q.cy + Math.sin(ra) * r0], [q.cx + Math.cos(ra) * r1, q.cy + Math.sin(ra) * r1]], tq + 0.3, 0.12, { tone: q.tone, op: 0.9, halo: false });
              }
            } else if (q.kind === "dot") {
              const d = svg("rect", { x: f1(q.cx - q.r), y: f1(q.cy - q.r), width: f1(2 * q.r), height: f1(2 * q.r), fill: col(q.tone), opacity: 0, transform: `rotate(45 ${f1(q.cx)} ${f1(q.cy)})` }, q.g);
              Loom.tween(d, { opacity: 0 }, { opacity: 1, duration: 0.15 }, tq, meta(E, "reveal"));
            } else if (q.kind === "bar") {
              const g = q.g, top = svg("g", {}, g);
              const body = svg("rect", { x: f1(q.x), y: f1(q.y), width: f1(q.w), height: f1(q.h), fill: col(q.tone), opacity: 0.22 }, top);
              line(E, top, [[q.x, q.y], [q.x + q.w, q.y]], tq, 0.01, { tone: q.tone, op: 1, w: (sw() * 1.5).toFixed(2) });
              line(E, top, [[q.x, q.y + q.h], [q.x, q.y], [q.x + q.w, q.y], [q.x + q.w, q.y + q.h]], tq, 0.01, { tone: q.tone, op: 0.6, halo: false, w: Math.max(1, sw() * 0.6) });
              void body;
              Loom.tween(top, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.7, ease: Loom.ease.enter }, tq, meta(E, "grow"));
            } else if (q.kind === "words" || q.kind === "glyph") {
              const n = q.node, dur = q.kind === "glyph" ? 0.25 : clamp(0.12 + q.len * 0.012, 0.15, 0.55);
              // hidden from load even when the template tweened this node first (recap colours its label: a later tween
              // would not render its start state, and the label showed before its word)
              Loom.tween(n, { opacity: 0 }, { opacity: 1, duration: dur, ease: "none", immediateRender: true }, tq + (hasPlane ? 0.15 : 0), meta(E, "reveal"));
              if (q.kind === "words" && n.__fit && dur > 0.12) {
                const f = n.__fit, cw = Math.max(2, f.size * 0.08);
                const cur = svg("rect", { x: f1(f.x), y: f1(f.y + f.height * 0.12), width: f1(cw), height: f1(f.height * 0.76), fill: col("accent"), opacity: 0, "data-skin": "caret" }, n.parentNode);
                Loom.drive((e, raw) => { cur.setAttribute("opacity", raw > 0 && raw < 1 ? "0.8" : "0"); cur.setAttribute("x", f1(f.x + f.width * e)); }, tq + (hasPlane ? 0.15 : 0), dur, "linear", { kind: "reveal", beat: beat.id, name: E.name + ".type", content: true });
              }
              end = Math.max(end, tq + dur);
            } else if (q.kind === "lock") {
              const [x, y, w, h] = q.box, c = clamp(Math.min(w, h) * 0.3, 10, 22), g = svg("g", { "data-skin": "lock" }, q.parent);
              for (const bk of brackets(x, y, w, h, c)) line(E, g, bk, tq, 0.01, { tone: "accent2", op: 1, w: (sw() * 1.2).toFixed(2) });
              const cx = x + w / 2, cy = y + h / 2;
              Loom.tween(g, { scale: 1.25, transformOrigin: `${f1(cx)}px ${f1(cy)}px` }, { scale: 1, duration: 0.22, ease: Loom.ease.enter }, tq, meta(E, "lock"));
            }
          }
          if (E.revealT == null || t < E.revealT) { E.revealT = t; E.revealKind = "draw"; }
          it.at = t; it.by = Math.max(end, t + 0.3); it.made = "projected";
        }
      },
    };
  }
  const S_ = () => Loom.style;
  if (Loom.skins) Loom.skins.define("hologram", skinOf());

  Loom.engines.define("hologram", {
    version: "1",
    summary: "a calm operations HUD in light, with a hero moment (a 3D wireframe object in true perspective, scanned onto a projector pad on a dark stage, with HUD chrome and amber data plates): depth layers (far, mid, near) on the place camera with push-through and a 2.5D orbit; frames with corner brackets; panels that assemble rule by rule; briefing cards, a flow diagram that points the way the data moves and filled bars for rankings and odds; readouts that scroll; a radial scanner; target locks that close on any element; a wireframe globe with arcs and traffic; a network mesh with packets; a waveform with an anomaly; hex and dot grids; a timeline scrubber; gauges with thresholds (RED and USE); callouts; boot-up and power-down; status told twice; one clock; a WCAG flash ledger",
    api: { hud, audit },
  });
})();
