Loom.lesson = Loom.lesson || {};
// story-cartoon kit: desk_set, question_pad, door_path.
// Anatomy and layers are described in each part's header comment. All coordinates are station coordinates (1920 x 1080).
(function () {
  const sv = (t, a, p) => Loom.svg(t, a, p);
  const pts = (a) => a.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const show = (g, on, o) => g.setAttribute("opacity", on ? (o == null ? 1 : o) : 0);

  // discrete states as a pure function of timeline position: each setState key flips on at its time (a short drive),
  // the visible state is the last key that is on, else the initial one. Seeking either way gives the same picture.
  function makeStates() {
    const chans = {};
    return {
      chan(name, init, apply) { chans[name] = { keys: [], init, apply }; apply(init); },
      set(name, state, t) {
        const c = chans[name];
        if (!c) return;
        const k = { t, state, on: false };
        c.keys.push(k);
        c.keys.sort((a, b) => a.t - b.t);
        Loom.drive((e) => {
          const on = e >= 0.5;
          if (k.on === on) return;
          k.on = on;
          let s = c.init;
          for (const q of c.keys) if (q.on) s = q.state;
          c.apply(s);
        }, t, 0.02, "linear");
      },
    };
  }

  function ringD(cx, cy, rx, ry) {
    const n = 40, a0 = -2.2, turn = 6.2832 * 1.06, p = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, a = a0 + turn * u, k = 1 + 0.06 * u + 0.02 * Math.sin(u * 9);
      p.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]);
    }
    return "M" + p.map((q) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join(" L");
  }

  // ---------------------------------------------------------------------------------------------
  // desk_set. Layers: "back" = wall + window (element room); "front" = desk (element desk) + items.
  // Items: laptop (states sheet / mail / closed, + sent tick), receipts (receipt_a, receipt_b, ring receipt_circle),
  // phone, magnifier. opts: framing "medium"|"close", layer "all"|"back"|"front", only [names], prefix, total,
  // laptop, ring (false = none), magnifier (false = absent), x, y, w.
  // ---------------------------------------------------------------------------------------------
  Loom.lesson.desk_set = function (ctx, parent, opts) {
    opts = opts || {};
    const K = ctx.kit, C = ctx.c, S = makeStates();
    const close = opts.framing === "close";
    const layer = opts.layer || "all";
    const only = opts.only ? new Set(opts.only) : null;
    const want = (n, lay) => (only ? only.has(n) : layer === "all" || layer === lay);
    const pre = opts.prefix || "";
    const total = opts.total || "$86.40";
    const sc = opts.w ? opts.w / 1920 : 1;
    const root = sv("g", { transform: "translate(" + (opts.x || 0) + " " + (opts.y || 0) + ") scale(" + sc + ")" }, parent);
    const D = close ? { top: 1000, edge: 1075, bottom: 1200 } : { top: 800, edge: 905, bottom: 1110 };
    // medium coordinates -> this framing (items and wall are scaled in close; the desk slab is not)
    const wallT = close ? "translate(-402 -135) scale(1.45)" : "";
    const itemT = close ? "translate(-261.5 -246) scale(1.45)" : "";
    const itemPt = (x, y) => (close ? [1.45 * x - 261.5, 1.45 * y - 246] : [x, y]);
    const H = { root, framing: close ? "close" : "medium" };
    H.anchors = {
      maya: close ? { x: 1580, y: 2715, scale: 1.5 } : { x: 1580, y: 1710, scale: 0.85 },
      desk_top: D.top,
      phone: (function () { const p = itemPt(995, 862); return { x: p[0], y: p[1] }; })(),
      receipt_total_b: (function () { const p = itemPt(820, 726); return { x: p[0], y: p[1] }; })(),
      pad: { x: 1075, y: 540 },
      wall_left: close ? { x: 60, y: 120, w: 520, h: 420 } : { x: 90, y: 130, w: 400, h: 360 },
    };
    const ink = C("ink");

    // ---- wall + window
    if (want("wall", "back")) {
      const g = sv("g", wallT ? { transform: wallT } : {}, root);
      const room = ctx.el(pre + "room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", parent: g });
      const r = room.inner;
      sv("rect", { x: -500, y: -400, width: 2900, height: 1700, fill: C("surface2") }, r);
      K.rect(r, 590, 130, 400, 340, { fill: "field2", r: 8 });
      sv("rect", { x: 608, y: 148, width: 364, height: 304, fill: C("surface") }, r);
      [[620, 330, 70, 122], [700, 300, 90, 152], [800, 350, 60, 102], [870, 320, 90, 132]].forEach((b) => sv("rect", { x: b[0], y: b[1], width: b[2], height: b[3], fill: C("field2") }, r));
      sv("line", { x1: 790, y1: 148, x2: 790, y2: 452, stroke: ink, "stroke-width": 5 }, r);
      sv("line", { x1: 608, y1: 300, x2: 972, y2: 300, stroke: ink, "stroke-width": 5 }, r);
      K.rect(r, 572, 466, 436, 22, { fill: "surface", r: 6 });
      H.room = room;
    }

    // ---- desk (front) + items
    if (want("desk", "front")) {
      const desk = ctx.el(pre + "desk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", parent: root });
      K.rect(desk.inner, -60, D.top, 2040, D.edge - D.top, { fill: "surface", r: 0 });
      K.rect(desk.inner, -60, D.edge, 2040, D.bottom - D.edge, { fill: "field2", r: 0 });
      H.desk = desk;
    }
    const items = sv("g", itemT ? { transform: itemT } : {}, root);

    // receipts: container + two receipts + the ring on the second
    if (want("receipts", "front")) {
      const rc = ctx.el(pre + "receipts", { x: 470, y: 600, w: 460, h: 290, kind: "card", parent: items });
      H.receipts = rc;
      const mk = (name, x, rot, isB) => {
        const e = ctx.el(pre + name, { x: x, y: 10, w: 215, h: 270, kind: "card", parent: rc.inner });
        const g = sv("g", { transform: "rotate(" + rot + " 107 135)" }, e.inner);
        K.rect(g, 0, 0, 215, 270, { fill: "surface", r: 6 });
        K.text(g, "Harbour Grill", { role: "label", x: 8, y: 8, w: 199, h: 48, align: "center", valign: "middle", maxLines: 1, color: "ink" });
        K.text(g, "Team dinner", { role: "caption", size: 24, x: 14, y: 54, w: 187, h: 32, align: "center", valign: "middle", maxLines: 1, color: "ink" });
        K.line(g, 16, 96, 199, 96, { stroke: "muted", sw: 3 });
        K.text(g, "Total", { role: "caption", x: 22, y: 108, w: 64, h: 36, align: "center", valign: "middle", maxLines: 1, color: "ink" });
        K.text(g, total, { role: "label", x: 84, y: 102, w: 118, h: 48, align: "right", valign: "middle", maxLines: 1, color: "ink" });
        [[170, 150], [192, 120], [214, 142], [236, 100]].forEach((l) => K.line(g, 24, l[0], 24 + l[1], l[0], { stroke: "muted", sw: 4 }));
        if (isB) {
          const ring = ctx.el(pre + "receipt_circle", { x: 0, y: 0, w: 215, h: 270, kind: "connector", parent: g });
          const grp = sv("g", {}, ring.inner);
          sv("path", { d: ringD(110, 126, 98, 30), fill: "none", stroke: C("accent"), "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, grp);
          H.ring = ring;
          S.chan("ring", opts.ring === false ? "none" : "drawn", (s) => show(grp, s === "drawn"));
        }
        return e;
      };
      H.receiptA = mk("receipt_a", 0, 0, false);
      H.receiptB = mk("receipt_b", 227, 0, true);
    }

    // laptop
    if (want("laptop", "front")) {
      const lp = ctx.el(pre + "laptop", { x: 70, y: 630, w: 370, h: 270, kind: "instrument", parent: items });
      H.laptop = lp;
      const L = lp.inner;
      const open = sv("g", {}, L), closed = sv("g", {}, L);
      K.rect(open, 0, 0, 350, 232, { fill: "ink", r: 12, flat: true });
      sv("rect", { x: 14, y: 14, width: 322, height: 196, rx: 4, fill: C("surface") }, open);
      const sheet = sv("g", {}, open), mail = sv("g", {}, open), sent = sv("g", {}, open);
      // expense sheet: two rows of the same dinner, the second banded
      K.text(sheet, "Expenses", { role: "caption", x: 34, y: 22, w: 200, h: 30, align: "left", valign: "middle", maxLines: 1, color: "ink" });
      K.line(sheet, 24, 58, 326, 58, { stroke: "muted", sw: 3 });
      sv("rect", { x: 22, y: 98, width: 306, height: 52, rx: 4, fill: C("field2") }, sheet);
      [[60, 0], [110, 1]].forEach((r) => {
        K.text(sheet, "Team dinner", { role: "caption", x: 30, y: r[0], w: 164, h: 34, align: "center", valign: "middle", maxLines: 1, color: "ink" });
        K.text(sheet, total, { role: "caption", x: 204, y: r[0], w: 112, h: 34, align: "right", valign: "middle", maxLines: 1, color: "ink" });
      });
      [[160, 190], [184, 140]].forEach((l) => K.line(sheet, 30, l[0], 30 + l[1], l[0], { stroke: "muted", sw: 4 }));
      // mail compose
      K.text(mail, "To: Compliance", { role: "caption", x: 34, y: 22, w: 284, h: 32, align: "center", valign: "middle", maxLines: 1, color: "ink" });
      K.line(mail, 24, 58, 326, 58, { stroke: "muted", sw: 3 });
      K.text(mail, "Subject: A duplicate expense claim", { role: "caption", x: 34, y: 64, w: 284, h: 62, align: "left", valign: "top", maxLines: 2, color: "ink" });
      K.line(mail, 24, 132, 326, 132, { stroke: "muted", sw: 3 });
      [[154, 250], [176, 280], [198, 160]].forEach((l) => K.line(mail, 30, l[0], 30 + l[1], l[0], { stroke: "muted", sw: 4 }));
      K.text(sent, "Sent", { role: "caption", x: 250, y: 170, w: 70, h: 30, align: "left", valign: "middle", maxLines: 1, color: "ink" });
      K.mark(sent, "yes", 236, 185, 26);
      sv("polygon", { points: pts([[-20, 236], [370, 236], [350, 264], [0, 264]]), fill: C("surface2"), stroke: ink, "stroke-width": 5, "stroke-linejoin": "round" }, open);
      K.rect(closed, -10, 216, 370, 48, { fill: "surface2", r: 8 });
      K.line(closed, 6, 234, 344, 234, { stroke: "ink", sw: 3 });
      S.chan("laptop", opts.laptop || "sheet", (s) => { show(open, s !== "closed"); show(closed, s === "closed"); show(sheet, s === "sheet"); show(mail, s === "mail" || s === "sent"); });
      S.chan("sent", "off", (s) => show(sent, s === "on"));
    }

    // phone, lying on the desk
    if (want("phone", "front")) {
      const ph = ctx.el(pre + "phone", { x: 945, y: 836, w: 100, h: 58, kind: "instrument", parent: items });
      H.phone = ph;
      const g = sv("g", { transform: "rotate(-6 50 29)" }, ph.inner);
      K.rect(g, 0, 0, 100, 56, { fill: "ink", r: 10, flat: true });
      sv("rect", { x: 7, y: 7, width: 86, height: 42, rx: 5, fill: C("surface2") }, g);
      K.line(g, 18, 22, 62, 22, { stroke: "muted", sw: 4 });
      K.line(g, 18, 34, 48, 34, { stroke: "muted", sw: 4 });
    }

    // magnifier, lying across the receipts' lower edge
    if (want("magnifier", "front")) {
      const mg = ctx.el(pre + "magnifier", { x: 640, y: 815, w: 170, h: 90, kind: "instrument", parent: items });
      H.magnifier = mg;
      const g = sv("g", {}, mg.inner);
      sv("line", { x1: 70, y1: 60, x2: 152, y2: 80, stroke: ink, "stroke-width": 18, "stroke-linecap": "round" }, g);
      sv("line", { x1: 70, y1: 60, x2: 152, y2: 80, stroke: C("shadow"), "stroke-width": 8, "stroke-linecap": "round" }, g);
      sv("circle", { cx: 46, cy: 40, r: 34, fill: C("surface"), "fill-opacity": 0.7, stroke: ink, "stroke-width": 7 }, g);
      sv("path", { d: "M24 30 A 24 24 0 0 1 40 18", fill: "none", stroke: C("field"), "stroke-width": 5, "stroke-linecap": "round" }, g);
      S.chan("magnifier", opts.magnifier === false ? "absent" : "lying", (s) => show(g, s === "lying"));
    }

    const map = {
      laptop_sheet: ["laptop", "sheet"], laptop_mail: ["laptop", "mail"], laptop_closed: ["laptop", "closed"],
      sent_on: ["sent", "on"], sent_off: ["sent", "off"], ring_none: ["ring", "none"], ring_drawn: ["ring", "drawn"],
      magnifier_lying: ["magnifier", "lying"], magnifier_absent: ["magnifier", "absent"],
    };
    H.setState = (name, t) => { const m = map[name]; if (m) S.set(m[0], m[1], t); };
    return H;
  };

  // ---------------------------------------------------------------------------------------------
  // question_pad: element pad (with pad_heading, pad_line1..3) lying on the desk, and element pad_ticks (pad_tick1..3)
  // as its own element, built only with opts.ticks true or only:["ticks"]. opts: x, y (default 1030, 540), only, ticks.
  // states: line1_hidden | line1_written | line1_ticked (and line2, line3).
  // ---------------------------------------------------------------------------------------------
  Loom.lesson.question_pad = function (ctx, parent, opts) {
    opts = opts || {};
    const K = ctx.kit, C = ctx.c, S = makeStates();
    const X = opts.x == null ? 20 : opts.x, Y = opts.y == null ? 20 : opts.y; // on the desk: x 1075, y 540 (desk_set anchors.pad)
    const only = opts.only ? new Set(opts.only) : null;
    const wantPad = !only || only.has("pad"), wantTicks = only ? only.has("ticks") : opts.ticks === true;
    const H = { lines: [], ticks: [] };
    const ink = C("ink");
    const words = ["Breaks a rule?", "Harms someone?", "Fine in public?"];
    const rowY = (i) => 98 + i * 76;
    if (wantPad) {
      const pad = ctx.el("pad", { x: X, y: Y, w: 340, h: 340, kind: "card", parent: parent });
      H.pad = pad;
      sv("polygon", { points: pts([[14, 0], [326, 0], [340, 340], [0, 340]]), fill: C("surface"), stroke: ink, "stroke-width": 5, "stroke-linejoin": "round" }, pad.inner);
      sv("rect", { x: 14, y: 0, width: 312, height: 28, fill: C("field2"), stroke: ink, "stroke-width": 5, "stroke-linejoin": "round" }, pad.inner);
      for (let i = 0; i < 8; i++) sv("circle", { cx: 40 + i * 38, cy: 14, r: 5, fill: ink }, pad.inner);
      const hd = ctx.el("pad_heading", { x: 24, y: 40, w: 292, h: 48, kind: "text", parent: pad.inner });
      K.text(hd.inner, "Three questions", { role: "label", x: 0, y: 0, w: 292, h: 48, align: "left", valign: "middle", maxLines: 1, color: "accent" });
      H.heading = hd;
      for (let i = 0; i < 3; i++) {
        K.line(pad.inner, 24, rowY(i) + 54, 316, rowY(i) + 54, { stroke: "muted", sw: 2 });
        const ln = ctx.el("pad_line" + (i + 1), { x: 24, y: rowY(i), w: 250, h: 50, kind: "text", parent: pad.inner });
        const g = sv("g", {}, ln.inner);
        K.text(g, words[i], { role: "body", size: 32, x: 0, y: 0, w: 250, h: 50, align: "left", valign: "middle", maxLines: 1, color: "ink" });
        H.lines.push(ln);
        S.chan("line" + (i + 1), opts["line" + (i + 1)] || "written", (s) => show(g, s !== "hidden"));
      }
    }
    if (wantTicks) {
      const tk = ctx.el("pad_ticks", { x: X + 282, y: Y + rowY(0), w: 46, h: 210, kind: "icon", parent: parent });
      H.padTicks = tk;
      for (let i = 0; i < 3; i++) {
        const t = ctx.el("pad_tick" + (i + 1), { x: 0, y: i * 76, w: 46, h: 46, kind: "icon", parent: tk.inner });
        const g = sv("g", {}, t.inner);
        K.mark(g, "yes", 23, 23, 40);
        H.ticks.push(t);
        S.chan("tick" + (i + 1), "off", (s) => show(g, s === "on"));
      }
    }
    H.setState = (name, t) => {
      const m = /^line([123])_(hidden|written|ticked)$/.exec(name);
      if (!m) return;
      S.set("line" + m[1], m[2] === "hidden" ? "hidden" : "written", t);
      S.set("tick" + m[1], m[2] === "ticked" ? "on" : "off", t);
    };
    return H;
  };

  // ---------------------------------------------------------------------------------------------
  // door_path: wall + floor (path_set), paper path (path_line), ink line to the fork (path_fork), accent line past the
  // grey door (path_past), five doors with signs, the kerb in front (path_kerb, layer "front").
  // Doors: keys manager, other, hr, compliance, line; elements door_<key> via DOORS names, signs manager_sign ... line_sign,
  // line_tag. opts: layer, dim, doors (one state or {key: state}), lines ("none"|"fork"|"past"), x, y, w.
  // ---------------------------------------------------------------------------------------------
  Loom.lesson.door_path = function (ctx, parent, opts) {
    opts = opts || {};
    const K = ctx.kit, C = ctx.c, S = makeStates();
    const layer = opts.layer || "all";
    const sc = opts.w ? opts.w / 1920 : 1;
    const root = sv("g", { transform: "translate(" + (opts.x || 0) + " " + (opts.y || 0) + ") scale(" + sc + ")" }, parent);
    const ink = C("ink");
    const BASE = (x) => 820 - (130 * x) / 1920;
    const FORK = 620;
    const H = { root, doors: {}, signs: {} };
    H.anchors = {
      maya: { x: 330, y: 940, scale: 0.46 },
      fork: { x: FORK, y: BASE(FORK) + 120 },
      hook: { x: FORK, y: 140 },
      path_start: { x: 150, y: BASE(150) + 120 },
    };
    const line = (parent2, a, b, o) => sv("line", Object.assign({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: ink, "stroke-width": 5, "stroke-linecap": "round" }, o || {}), parent2);

    if (layer !== "front") {
      // ---- set: wall, floor, skirting, desk corner, hook
      const set = ctx.el("path_set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", parent: root });
      const s = set.inner;
      const wallPts = [[-400, -300], [2320, -300], [2320, BASE(2320)], [-400, BASE(-400)]];
      const floorPts = [[-400, BASE(-400)], [2320, BASE(2320)], [2320, 1300], [-400, 1300]];
      const wDay = sv("polygon", { points: pts(wallPts), fill: C("surface2") }, s);
      const wDim = sv("polygon", { points: pts(wallPts), fill: C("muted") }, s);
      const fDay = sv("polygon", { points: pts(floorPts), fill: C("field2") }, s);
      const fDim = sv("polygon", { points: pts(floorPts), fill: C("shadow") }, s);
      line(s, [-400, BASE(-400)], [2320, BASE(2320)], { "stroke-width": 5 });
      // desk corner at the left edge (the tie to desk_set)
      K.rect(s, -90, 560, 220, 40, { fill: "surface", r: 0 });
      K.rect(s, -90, 600, 220, 290, { fill: "field2", r: 0 });
      // hook above the fork
      K.rect(s, FORK - 22, 70, 44, 16, { fill: "muted", r: 4, flat: true });
      sv("path", { d: "M" + FORK + " 86 L" + FORK + " 124 A 15 15 0 1 1 " + (FORK - 15) + " 139", fill: "none", stroke: ink, "stroke-width": 6, "stroke-linecap": "round" }, s);
      S.chan("dim", opts.dim ? "dim" : "day", (v) => { show(wDay, v === "day"); show(wDim, v === "dim"); show(fDay, v === "day"); show(fDim, v === "dim"); });
      H.set = set;

      // ---- the paper path
      const bk = (x) => BASE(x) + 55, fr = (x) => BASE(x) + 185;
      const pl = ctx.el("path_line", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", parent: root });
      sv("polygon", { points: pts([[-60, bk(-60)], [2000, bk(2000)], [2000, fr(2000)], [-60, fr(-60)]]), fill: C("surface"), stroke: ink, "stroke-width": 5, "stroke-linejoin": "round" }, pl.inner);
      H.path = pl;
      const BC = (x) => BASE(x) + 120;
      const pf = ctx.el("path_fork", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", parent: root });
      const gF = sv("g", {}, pf.inner);
      sv("path", { d: "M30 " + BC(30) + " L" + FORK + " " + BC(FORK), fill: "none", stroke: ink, "stroke-width": 7, "stroke-linecap": "round" }, gF);
      H.fork = pf;
      const pp = ctx.el("path_past", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", parent: root });
      const gP = sv("g", {}, pp.inner);
      const cxs = [730, 960, 1190, 1420, 1650];
      let d = "M" + FORK + " " + BC(FORK) + " L1830 " + BC(1830);
      cxs.slice(1).forEach((cx) => { d += " M" + cx + " " + BC(cx) + " L" + cx + " " + (BASE(cx) + 62); });
      sv("path", { d: d, fill: "none", stroke: C("accent"), "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, gP);
      H.past = pp;
      S.chan("lines", opts.lines || "all", (v) => { show(gF, v !== "none"); show(gP, v === "past" || v === "all"); });

      // ---- doors and signs
      const KEYS = [
        { key: "manager", door: "door_manager", sign: "manager_sign", word: "Manager" },
        { key: "other", door: "door_other", sign: "other_sign", word: "Another manager" },
        { key: "hr", door: "door_hr", sign: "hr_sign", word: "HR" },
        { key: "compliance", door: "door_compliance", sign: "compliance_sign", word: "Compliance" },
        { key: "line", door: "door_line", sign: "line_sign", word: "Speak-up line" },
      ];
      const init = (k) => (typeof opts.doors === "string" ? opts.doors : (opts.doors && opts.doors[k]) || "signed");
      KEYS.forEach((D, i) => {
        const cx = cxs[i], wi = 180 - 4 * i, hi = 350 - 14 * i, base = BASE(cx) + 4, top = base - hi;
        const de = ctx.el(D.door, { x: cx - wi / 2, y: top, w: wi, h: hi, kind: "scenery", parent: root });
        const g = de.inner;
        const spill = sv("g", {}, g), closed = sv("g", {}, g), grey = sv("g", {}, g), ajar = sv("g", {}, g);
        sv("polygon", { points: pts([[4, hi], [wi - 4, hi], [wi + 50, hi + 140], [-46, hi + 140]]), fill: C("caption_active"), opacity: 0.5 }, spill);
        const frame = (gg) => K.rect(gg, -9, -9, wi + 18, hi + 9, { fill: "field2", r: 4 });
        const panels = (gg, tok) => {
          sv("rect", { x: 18, y: 22, width: wi - 36, height: hi * 0.36, rx: 4, fill: "none", stroke: C(tok), "stroke-width": 3 }, gg);
          sv("rect", { x: 18, y: hi * 0.5, width: wi - 36, height: hi * 0.38, rx: 4, fill: "none", stroke: C(tok), "stroke-width": 3 }, gg);
        };
        frame(closed);
        K.rect(closed, 0, 0, wi, hi, { fill: "surface", r: 6 });
        panels(closed, "line");
        sv("circle", { cx: wi - 20, cy: hi * 0.52, r: 7, fill: C("accent2"), stroke: ink, "stroke-width": 3 }, closed);
        frame(grey);
        K.rect(grey, 0, 0, wi, hi, { fill: "muted", r: 6 });
        panels(grey, "surface");
        sv("circle", { cx: wi - 20, cy: hi * 0.52, r: 7, fill: C("shadow"), stroke: ink, "stroke-width": 3 }, grey);
        frame(ajar);
        sv("rect", { x: 0, y: 0, width: wi, height: hi, fill: C("caption_active"), stroke: ink, "stroke-width": 5 }, ajar);
        sv("polygon", { points: pts([[0, 0], [wi * 0.4, 12], [wi * 0.4, hi - 10], [0, hi]]), fill: C("surface"), stroke: ink, "stroke-width": 5, "stroke-linejoin": "round" }, ajar);
        sv("circle", { cx: wi * 0.32, cy: hi * 0.52, r: 5, fill: C("accent2"), stroke: ink, "stroke-width": 3 }, ajar);
        H.doors[D.key] = de;

        const se = ctx.el(D.sign, { x: cx - 111, y: top - 128, w: 222, h: 52, kind: "card", parent: root });
        const sg = sv("g", {}, se.inner);
        K.rect(sg, 0, 0, 222, 52, { fill: "surface", r: 8 });
        const tInk = sv("g", {}, sg), tAcc = sv("g", {}, sg), cross = sv("g", {}, se.inner);
        K.text(tInk, D.word, { role: "label", x: 8, y: 4, w: 206, h: 44, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 400 });
        K.text(tAcc, D.word, { role: "label", x: 8, y: 4, w: 206, h: 44, align: "center", valign: "middle", maxLines: 1, color: "accent", weight: 400 });
        K.mark(cross, "no", 206, 8, 28);
        H.signs[D.key] = se;
        let tagG = null;
        if (D.key === "line") {
          const te = ctx.el("line_tag", { x: cx - 250, y: top - 62, w: 380, h: 48, kind: "card", parent: root });
          line(te.inner, [250, -14], [250, 0], { "stroke-width": 3 });
          tagG = sv("g", {}, te.inner);
          K.rect(tagG, 0, 0, 380, 48, { fill: "surface", r: 8 });
          K.text(tagG, "anonymous where offered", { role: "label", x: 8, y: 0, w: 364, h: 44, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 400 });
          H.tag = te;
        }
        S.chan(D.key, init(D.key), (v) => {
          show(spill, v === "lit"); show(closed, v === "standing" || v === "signed"); show(grey, v === "greyed"); show(ajar, v === "lit");
          const sOn = v === "signed" || v === "greyed" || v === "lit";
          show(sg, sOn, v === "greyed" ? 0.4 : 1); show(cross, v === "greyed");
          if (tagG) show(tagG, sOn);
        });
        S.chan(D.key + "_tone", "ink", (v) => { show(tInk, v !== "accent"); show(tAcc, v === "accent"); });
      });
    }
    if (layer !== "back") {
      const bf = (x) => BASE(x) + 185;
      const kb = ctx.el("path_kerb", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", parent: root });
      sv("polygon", { points: pts([[-60, bf(-60)], [2000, bf(2000)], [2000, bf(2000) + 36], [-60, bf(-60) + 36]]), fill: C("shadow"), stroke: ink, "stroke-width": 5, "stroke-linejoin": "round" }, kb.inner);
      H.kerb = kb;
    }
    H.setState = (name, t) => {
      if (name === "dim" || name === "day") return S.set("dim", name, t);
      if (/^lines_(none|fork|past)$/.test(name)) return S.set("lines", name.slice(6), t);
      const m = /^(manager|other|hr|compliance|line):(hidden|standing|signed|greyed|lit|accent|ink)$/.exec(name);
      if (!m) return;
      if (m[2] === "accent" || m[2] === "ink") S.set(m[1] + "_tone", m[2], t);
      else S.set(m[1], m[2], t);
    };
    return H;
  };
})();
