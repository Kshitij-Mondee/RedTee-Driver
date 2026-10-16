Loom.lesson = Loom.lesson || {};
// Feedback lesson kit: meeting_room, fuzzy_cloud, build_board, coffee_corner.
// Parts draw only. Beats place people (kit.peep) between the "back" and "front" layers of a set.
(function () {
  const sv = (tag, attrs, parent) => Loom.svg(tag, attrs || {}, parent);
  const grp = (parent, attrs) => sv("g", attrs, parent);
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, v) => a + (b - a) * v;
  const seg = (e, a, b) => clamp((e - a) / (b - a));
  const n2 = (v) => Math.round(v * 100) / 100;
  const D = (ctx, key, fallback) => {
    try {
      const v = ctx.style && ctx.style.dur ? ctx.style.dur(key) : null;
      return (typeof v === "number" && v > 0) ? v : fallback;
    } catch (e) { return fallback; }
  };
  const drv = (fn, t, dur, ease) => Loom.drive(fn, t, dur, ease || "move");
  // an ink-outlined path in a token fill
  const inkPath = (ctx, parent, d, fill, o) => {
    o = o || {};
    const a = { d: d, fill: ctx.c(fill || "none"), stroke: ctx.c(o.stroke || "ink"), "stroke-width": o.sw || 5, "stroke-linejoin": "round", "stroke-linecap": "round" };
    if (o.op !== undefined) a.opacity = o.op;
    return sv("path", a, parent);
  };
  const seq = { n: 0 };


  // ------------------------------------------------------------------ meeting_room
  // Anatomy. layer "back": wall, floor, skirting, window, whiteboard + tray, two chair backs, light overlays.
  // layer "front": table top and front, nameplate slot with the 'Dev' nameplate, light overlays.
  // layer "all" (default) draws back then front. Beats that put people in place the part twice:
  // back before the busts, front after them (the table hides where the busts end).
  Loom.lesson.meeting_room = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = ctx.c;
    const layer = opts.layer || "all";
    const s = opts.w ? opts.w / 1920 : 1;
    const root = grp(parent, s !== 1 ? { transform: "scale(" + n2(s) + ")" } : {});
    const h = { root: root, boardRect: { x: 688, y: 120, w: 544, h: 306 }, boardSurface: { x: 702, y: 134, w: 516, h: 278 }, tableTop: 900, devPlateX: 1440 };
    const ov = {};
    if (layer !== "front") {
      const back = grp(root); h.back = back;
      kit.rect(back, 0, 0, 1920, 806, { fill: "surface2", crisp: true });
      kit.rect(back, 0, 806, 1920, 140, { fill: "field2", crisp: true });
      // skirting
      kit.rect(back, -10, 770, 1940, 36, { fill: "field", flat: true, sw: 4 });
      // window far left
      const win = grp(back); h.window = win;
      kit.rect(win, 96, 520, 228, 22, { fill: "surface", r: 6, flat: true, sw: 4 });
      kit.rect(win, 110, 150, 200, 370, { fill: "surface", r: 8, flat: true });
      kit.rect(win, 128, 168, 164, 334, { fill: "field", r: 4, flat: true, sw: 3 });
      sv("line", { x1: 210, y1: 168, x2: 210, y2: 502, stroke: c("ink"), "stroke-width": 4 }, win);
      sv("line", { x1: 128, y1: 335, x2: 292, y2: 335, stroke: c("ink"), "stroke-width": 4 }, win);
      sv("line", { x1: 148, y1: 300, x2: 190, y2: 200, stroke: c("surface"), "stroke-width": 9, "stroke-linecap": "round" }, win);
      sv("line", { x1: 232, y1: 470, x2: 270, y2: 380, stroke: c("surface"), "stroke-width": 9, "stroke-linecap": "round" }, win);
      // chair backs (muted), behind where the busts sit
      h.chairL = kit.rect(back, 280, 440, 400, 520, { fill: "field2", r: 90 });
      h.chairR = kit.rect(back, 1240, 440, 400, 520, { fill: "field2", r: 90 });
      // whiteboard: aluminium frame, white surface, marker tray with three markers
      const bd = grp(back); h.board = bd;
      kit.rect(bd, 800, 424, 320, 18, { fill: "field2", r: 6, flat: true, sw: 4 });
      kit.rect(bd, 688, 120, 544, 306, { fill: "field2", r: 10, flat: true });
      kit.rect(bd, 702, 134, 516, 278, { fill: "surface", r: 4, flat: true, sw: 3 });
      [[850, "ink"], [920, "muted"], [990, "accent3"]].forEach(function (m) {
        kit.rect(bd, m[0], 414, 58, 12, { fill: m[1], r: 5, flat: true, sw: 3 });
      });
      // light: dark and light overlays and two window beams
      const sun = grp(back, { opacity: 0 }); ov.sunB = sun;
      inkPath(ctx, sun, "M310 200 L310 300 L640 640 L640 500 Z", "surface", { stroke: "surface", sw: 1, op: 0.55 });
      inkPath(ctx, sun, "M310 360 L310 470 L560 760 L560 640 Z", "surface", { stroke: "surface", sw: 1, op: 0.55 });
      ov.darkB = sv("rect", { x: 0, y: 0, width: 1920, height: 946, fill: c("ink"), opacity: 0 }, back);
      ov.lightB = sv("rect", { x: 0, y: 0, width: 1920, height: 946, fill: c("surface"), opacity: 0 }, back);
    }
    if (layer !== "back") {
      const front = grp(root); h.front = front;
      kit.rect(front, -20, 900, 1960, 52, { fill: "surface", flat: true });
      kit.rect(front, -20, 952, 1960, 150, { fill: "field2", flat: true });
      // nameplate slot (a groove) and the nameplate itself
      kit.rect(front, 1340, 938, 200, 9, { fill: "muted", r: 4, crisp: true });
      const np = grp(front); h.nameplate = np;
      inkPath(ctx, np, "M1350 950 L1374 904 L1506 904 L1530 950 Z", "field2", { sw: 4 });
      kit.text(np, "Dev", { role: "label", x: 1380, y: 906, w: 120, h: 42, align: "center", valign: "middle", color: "ink", weight: 400, size: 30, maxLines: 1 });
      ov.darkF = sv("rect", { x: -20, y: 900, width: 1960, height: 190, fill: c("ink"), opacity: 0 }, front);
      ov.lightF = sv("rect", { x: -20, y: 900, width: 1960, height: 190, fill: c("surface"), opacity: 0 }, front);
    }
    // states: plain, dim, bright (levels: dark, light, beams)
    const LV = { plain: [0, 0, 0], dim: [0.14, 0, 0], bright: [0, 0.26, 1] };
    let cur = "plain";
    h.setState = function (name, t, o) {
      const to = LV[name]; if (!to) return;
      const from = LV[cur]; cur = name;
      const dur = (o && o.dur) || D(ctx, "move", 0.8);
      drv(function (e) {
        const v = function (i) { return lerp(from[i], to[i], e); };
        if (ov.darkB) ov.darkB.style.opacity = n2(v(0));
        if (ov.darkF) ov.darkF.style.opacity = n2(v(0));
        if (ov.lightB) ov.lightB.style.opacity = n2(v(1));
        if (ov.lightF) ov.lightF.style.opacity = n2(v(1));
        if (ov.sunB) ov.sunB.style.opacity = n2(v(2));
      }, t, dur, "move");
    };
    // the Dev nameplate drops onto the table edge (pure function of t)
    h.dropNameplate = function (t, dur) {
      if (!h.nameplate) return;
      drv(function (e, raw) {
        h.nameplate.setAttribute("transform", "translate(0 " + n2(-60 * (1 - e)) + ")");
        h.nameplate.style.opacity = n2(seg(raw, 0, 0.35));
      }, t, dur || 0.5, "overshoot");
    };
    return h;
  };

  // ------------------------------------------------------------------ fuzzy_cloud
  // Anatomy: root > drop > drift > dissolve > morph > scale > (body, text). A bar (morph target) sits in root.
  // States: drop_in, hanging (slow 2 px drift), dissolving, morph_to_line. Each state owns one channel,
  // so they chain: drop_in, then hanging, then dissolving (or morph_to_line).
  Loom.lesson.fuzzy_cloud = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = ctx.c;
    const W = 520, H = 240, s = opts.w ? opts.w / W : 1;
    const root = grp(parent);
    const gDrop = grp(root), gDrift = grp(gDrop), gDis = grp(gDrift), gMorph = grp(gDis);
    const gS = grp(gMorph, { transform: "scale(" + n2(s) + ")" });
    const body = grp(gS), txt = grp(gS);
    const cloudPath = function (cx, cy, rx, ry, N) {
      const pts = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2, j = 1 + 0.07 * Math.sin(i * 2.1 + 0.7);
        pts.push([cx + rx * j * Math.cos(a), cy + ry * j * Math.sin(a)]);
      }
      let d = "M" + n2(pts[0][0]) + " " + n2(pts[0][1]);
      for (let i = 0; i < N; i++) {
        const q = pts[(i + 1) % N], p = pts[i];
        const r = Math.hypot(q[0] - p[0], q[1] - p[1]) * (0.58 + 0.06 * Math.sin(i * 1.9));
        d += " A" + n2(r) + " " + n2(r) + " 0 0 1 " + n2(q[0]) + " " + n2(q[1]);
      }
      return d + " Z";
    };
    // soft edge: a bigger, fainter cloud behind
    inkPath(ctx, body, cloudPath(260, 120, 205, 76, 10), "muted", { stroke: "muted", sw: 14, op: 0.16 });
    // opaque base then the muted grey body with its outline
    inkPath(ctx, body, cloudPath(260, 120, 190, 70, 10), "field", { stroke: "line", sw: 4 });
    inkPath(ctx, body, cloudPath(260, 120, 190, 70, 10), "muted", { stroke: "line", sw: 4, op: 0.3 });
    // faint inner softness: smaller clouds stacked, nearly transparent
    inkPath(ctx, body, cloudPath(250, 132, 150, 48, 8), "muted", { stroke: "muted", sw: 1, op: 0.1 });
    inkPath(ctx, body, cloudPath(268, 112, 110, 34, 7), "field", { stroke: "field", sw: 1, op: 0.35 });
    const t1 = kit.text(txt, "be a bit more", { role: "label", x: 100, y: 74, w: 320, h: 48, align: "center", valign: "middle", color: "ink", weight: 400, size: 38, maxLines: 1 });
    const t2 = kit.text(txt, "engaged", { role: "label", x: 100, y: 124, w: 320, h: 48, align: "center", valign: "middle", color: "ink", weight: 400, size: 38, maxLines: 1 });
    const ew = (t2.__fit && t2.__fit.width) ? t2.__fit.width : 150;
    const h = { root: root, text: txt, body: body, w: W * s, h: H * s };
    // bounding box of the word 'engaged', in the parent's coordinates (for a brush circle)
    h.engaged = { x: (260 - ew / 2 - 10) * s, y: 126 * s, w: (ew + 20) * s, h: 44 * s };
    // morph target: a horizontal bar, placed by setState("morph_to_line", t, {to: {x, y, w, h}})
    h.bar = sv("rect", { x: 0, y: 0, width: 10, height: 10, rx: 6, fill: c("muted"), opacity: 0 }, root);
    const dd = function (k, f) { return D(ctx, k, f); };
    h.setState = function (name, t, o) {
      o = o || {};
      if (name === "drop_in") {
        drv(function (e, raw) {
          gDrop.setAttribute("transform", "translate(0 " + n2(-70 * (1 - e)) + ")");
          gDrop.style.opacity = n2(seg(raw, 0, 0.4));
        }, t, o.dur || 0.7, "overshoot");
      } else if (name === "hanging") {
        const dur = o.dur || 6, amp = o.amp || 2, cyc = Math.max(1, Math.round(dur / 4));
        drv(function (e, raw) {
          gDrift.setAttribute("transform", "translate(" + n2(amp * 0.5 * Math.sin(raw * cyc * Math.PI * 2 + 1)) + " " + n2(amp * Math.sin(raw * cyc * Math.PI * 2)) + ")");
        }, t, dur, "linear");
      } else if (name === "dissolving") {
        const cx = 260 * s, cy = 120 * s;
        drv(function (e) {
          const k = 1 + 0.18 * e;
          gDis.setAttribute("transform", "translate(" + n2(cx) + " " + n2(cy) + ") scale(" + n2(k) + ") translate(" + n2(-cx) + " " + n2(-cy) + ")");
          gDis.style.opacity = n2(1 - e);
        }, t, o.dur || 0.8, "move");
      } else if (name === "morph_to_line") {
        const to = o.to || { x: 0, y: 0, w: 420, h: 14 };
        h.bar.setAttribute("x", n2(to.x)); h.bar.setAttribute("y", n2(to.y));
        h.bar.setAttribute("width", n2(to.w)); h.bar.setAttribute("height", n2(to.h));
        const cx0 = 260 * s, cy0 = 120 * s, cxT = to.x + to.w / 2, cyT = to.y + to.h / 2;
        const sx = to.w / (400 * s), sy = Math.max(to.h / (160 * s), 0.05);
        drv(function (e) {
          const k = lerp(1, sx, e), j = lerp(1, sy, e);
          gMorph.setAttribute("transform", "translate(" + n2(lerp(cx0, cxT, e)) + " " + n2(lerp(cy0, cyT, e)) + ") scale(" + n2(k) + " " + n2(j) + ") translate(" + n2(-cx0) + " " + n2(-cy0) + ")");
          txt.style.opacity = n2(1 - seg(e, 0, 0.35));
          body.style.opacity = n2(1 - seg(e, 0.55, 1));
          h.bar.style.opacity = n2(seg(e, 0.35, 0.8) * (1 - seg(e, 0.88, 1)));
        }, t, o.dur || 0.9, "move");
      }
    };
    return h;
  };

  // ------------------------------------------------------------------ build_board
  // Anatomy. variant "board" (1500x716): white board, three ruled slots (y 136, 336, 536), each slot a group:
  //   icon (camera / empty chair / speech bubble, duotone accent2 + muted twin), text (accent + muted twin, clipped
  //   for a wipe), label (underline label: ink text + muted twin, underline), rule.
  // Board parts start hidden (icon, text clip, label, underline) so show(i, part, t) reveals each on its own cue;
  // setState("lineN") snapshots slots fully written (rules always visible).
  // variant "sheet" (900x250): the same on a paper sheet at a slight angle, everything visible.
  const ROWS = [
    { icon: "camera", text: "one-word answers on vendors", label: "observed behaviour" },
    { icon: "chair", text: "we lost your view", label: "effect" },
    { icon: "bubble", text: "share a view first", label: "next step" }
  ];
  Loom.lesson.build_board = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = ctx.c;
    const sheet = opts.variant === "sheet";
    const words = opts.words !== false;
    const NW = sheet ? 900 : 1500, NH = sheet ? 250 : 716;
    const s = opts.w ? opts.w / NW : 1;
    const root = grp(parent, s !== 1 ? { transform: "scale(" + n2(s) + ")" } : {});
    const uid = "bb" + (seq.n++);
    const defs = sv("defs", {}, root);
    const paper = sheet ? grp(root, { transform: "rotate(-2.5 450 125)" }) : root;
    if (sheet) {
      inkPath(ctx, paper, "M20 18 H860 V190 L828 232 H20 Z", "surface", { sw: 5 });
      inkPath(ctx, paper, "M860 190 L828 232 L828 190 Z", "field2", { sw: 4 });
    } else {
      kit.rect(paper, 0, 0, 1500, 716, { fill: "surface", r: 14, flat: true });
    }
    const G = sheet && !words
      ? { cy: [54, 124, 194], ix: 64, isc: 0.86, tx: 104, tw: 400, th: 50, ty: -30, rx0: 130, rx1: 820, ry: 30, lx: 524, lw: 340, lh: 46, ly: -26, uy: 12, tsz: 32, tr: "label", lsz: 30, lr: "label", sw: 4 }
      : sheet
      ? { cy: [54, 124, 194], ix: 66, isc: 0.52, tx: 104, tw: 400, th: 50, ty: -30, rx0: 104, rx1: 504, ry: 22, lx: 524, lw: 340, lh: 46, ly: -26, uy: 12, tsz: 32, tr: "label", lsz: 30, lr: "label", sw: 2.5 }
      : { cy: [136, 336, 536], ix: 120, isc: 1, tx: 215, tw: 870, th: 96, ty: -64, rx0: 215, rx1: 1085, ry: 40, lx: 1115, lw: 360, lh: 44, ly: -34, uy: 16, tsz: 72, tr: "title", lsz: 38, lr: "label", sw: 3 };
    const drawIcon = function (g, kind, tone) {
      const f = tone;
      if (kind === "camera") {
        inkPath(ctx, g, "M-20 -24 L-12 -38 H12 L20 -24 Z", f, { sw: 4 });
        kit.rect(g, -46, -26, 92, 62, { fill: f, r: 10, flat: true, sw: 4 });
        sv("circle", { cx: 0, cy: 5, r: 20, fill: c("field"), stroke: c("ink"), "stroke-width": 4 }, g);
        sv("circle", { cx: 0, cy: 5, r: 8, fill: c("ink") }, g);
        kit.rect(g, 28, -18, 12, 8, { fill: "field", r: 3, flat: true, sw: 3 });
      } else if (kind === "chair") {
        sv("line", { x1: -26, y1: 22, x2: -30, y2: 50, stroke: c("ink"), "stroke-width": 5, "stroke-linecap": "round" }, g);
        sv("line", { x1: 26, y1: 22, x2: 30, y2: 50, stroke: c("ink"), "stroke-width": 5, "stroke-linecap": "round" }, g);
        kit.rect(g, -24, -48, 48, 58, { fill: f, r: 10, flat: true, sw: 4 });
        kit.rect(g, -36, 6, 72, 18, { fill: f, r: 7, flat: true, sw: 4 });
      } else {
        inkPath(ctx, g, "M-14 20 L-28 46 L6 20 Z", f, { sw: 4 });
        kit.rect(g, -46, -34, 92, 58, { fill: f, r: 16, flat: true, sw: 4 });
        [-24, 0, 24].forEach(function (dx) { sv("circle", { cx: dx, cy: -5, r: 5, fill: c("field") }, g); });
      }
    };
    const slots = [];
    ROWS.forEach(function (row, i) {
      const cy = G.cy[i];
      const sl = { i: i, dimmed: false };
      sl.rect = { x: G.rx0 * s, y: (cy + G.ty) * s, w: (G.rx1 - G.rx0) * s, h: G.th * s, ruleY: (cy + G.ry) * s };
      // the ruled line is always there (the empty slot)
      sv("line", { x1: G.rx0, y1: cy + G.ry, x2: G.rx1, y2: cy + G.ry, stroke: c("muted"), "stroke-width": G.sw, "stroke-linecap": "round" }, paper);
      sl.g = grp(paper);
      if (!sheet) sl.g.style.opacity = 0;
      // icon
      sl.icon = grp(sl.g, sheet ? {} : { opacity: 0 });
      const ic = grp(sl.icon, { transform: "translate(" + G.ix + " " + (cy - 4) + ") scale(" + G.isc + ")" });
      sl.iconOn = grp(ic); drawIcon(sl.iconOn, row.icon, "accent2");
      if (!sheet) { sl.iconOff = grp(ic, { opacity: 0 }); drawIcon(sl.iconOff, row.icon, "muted"); }
      if (words) {
        // text, clipped for a left-to-right wipe
        const cid = uid + "_c" + i;
        const cp = sv("clipPath", { id: cid }, defs);
        sl.clip = sv("rect", { x: G.tx - 6, y: cy - 90, width: sheet ? (G.tw + 12) : 0.01, height: 150 }, cp);
        sl.text = grp(sl.g, { "clip-path": "url(#" + cid + ")" });
        const topt = { role: G.tr, x: G.tx, y: cy + G.ty, w: G.tw, h: G.th, align: "left", valign: "middle", weight: 400, size: G.tsz, maxLines: 1 };
        sl.textOn = kit.text(sl.text, row.text, Object.assign({ color: sheet ? "ink" : "accent" }, topt));
        if (!sheet) { sl.textOff = kit.text(sl.text, row.text, Object.assign({ color: "muted" }, topt)); sl.textOff.style.opacity = 0; }
        // underline label: words, then the underline
        sl.label = grp(sl.g, sheet ? {} : { opacity: 0 });
        const lopt = { role: G.lr, x: G.lx - 12, y: cy + G.ly, w: G.lw + 12, h: G.lh, align: "center", valign: "middle", weight: 400, size: G.lsz, maxLines: 1 };
        sl.labelOn = kit.text(sl.label, row.label, Object.assign({ color: sheet ? "muted" : "ink" }, lopt));
        if (!sheet) { sl.labelOff = kit.text(sl.label, row.label, Object.assign({ color: "muted" }, lopt)); sl.labelOff.style.opacity = 0; }
        const lw = (sl.labelOn.__fit && sl.labelOn.__fit.width) ? sl.labelOn.__fit.width : 200;
        sl.ux = G.lx - 12 + (G.lw + 12) / 2 - (lw + 6) / 2; sl.uy = cy + G.uy;
        sl.underline = sv("line", { x1: sl.ux, y1: cy + G.uy + 12, x2: sl.ux + lw + 6, y2: cy + G.uy + 12, stroke: c("muted"), "stroke-width": sheet ? 3 : 4, "stroke-linecap": "round" }, sl.g);
        if (!sheet) sl.underline.setAttribute("transform", "translate(" + n2(sl.ux) + " 0) scale(0.001 1) translate(" + n2(-sl.ux) + " 0)");
        sl.labelW = lw;
      }
      slots.push(sl);
    });
    const h = { root: root, slots: slots, w: NW * s, h: NH * s, variant: sheet ? "sheet" : "board" };
    // rect of a slot's line, in the parent's coordinates: the morph target for the cloud
    h.slotRect = function (i) { return slots[i].rect; };
    const showSlot = function (i, t) { if (!sheet) Loom.tl.set(slots[i].g, { opacity: 1 }, t); };
    // part reveals: icon "pop", text "write" (wipe), label "label" (words then underline)
    h.show = function (i, part, t, dur) {
      const sl = slots[i]; if (!sl) return; showSlot(i, t);
      if (part === "icon") {
        drv(function (e, raw) {
          sl.icon.setAttribute("transform", "translate(" + G.ix + " " + (G.cy[i] - 4) + ") scale(" + n2(Math.max(e, 0.001)) + ") translate(" + (-G.ix) + " " + (-(G.cy[i] - 4)) + ")");
          sl.icon.style.opacity = n2(seg(raw, 0, 0.3));
        }, t, dur || 0.4, "overshoot");
      } else if (part === "text" && sl.clip) {
        drv(function (e) { sl.clip.setAttribute("width", n2(Math.max(0.01, (G.tw + 12) * e))); }, t, dur || 1.0, "move");
      } else if (part === "label" && sl.label) {
        const d1 = (dur || 0.6) * 0.55, d2 = (dur || 0.6) * 0.45;
        drv(function (e, raw) {
          sl.label.setAttribute("transform", "translate(0 " + n2(-16 * (1 - e)) + ")");
          sl.label.style.opacity = n2(seg(raw, 0, 0.5));
        }, t, d1, "overshoot");
        drv(function (e) {
          sl.underline.setAttribute("transform", "translate(" + n2(sl.ux) + " 0) scale(" + n2(Math.max(e, 0.001)) + " 1) translate(" + n2(-sl.ux) + " 0)");
        }, t + d1, d2, "move");
      }
    };
    // a slot fully written in one frame (icon, text, label, underline all in place)
    const fillSlot = function (i, t) {
      const sl = slots[i]; if (!sl || sheet) return;
      Loom.tl.set(sl.g, { opacity: 1 }, t);
      drv(function () {
        sl.icon.setAttribute("transform", "");
        sl.icon.style.opacity = 1;
        if (sl.clip) sl.clip.setAttribute("width", G.tw + 12);
        if (sl.label) { sl.label.setAttribute("transform", ""); sl.label.style.opacity = 1; }
        if (sl.underline) sl.underline.setAttribute("transform", "");
      }, t, 0.01, "linear");
    };
    // a slot emptied again (rule only)
    const clearSlot = function (i, t) {
      const sl = slots[i]; if (!sl || sheet) return;
      Loom.tl.set(sl.g, { opacity: 0 }, t);
      drv(function () {
        sl.icon.style.opacity = 0;
        if (sl.clip) sl.clip.setAttribute("width", 0.01);
        if (sl.label) sl.label.style.opacity = 0;
        if (sl.underline) sl.underline.setAttribute("transform", "translate(" + n2(sl.ux) + " 0) scale(0.001 1) translate(" + n2(-sl.ux) + " 0)");
      }, t, 0.01, "linear");
    };
    // dim a slot (accent to muted) or bring it back
    const dimSlot = function (i, to, t, dur) {
      const sl = slots[i]; if (!sl || sheet || sl.dimmed === to) return; sl.dimmed = to;
      drv(function (e) {
        const k = to ? e : 1 - e;
        if (sl.textOn) { sl.textOn.style.opacity = n2(1 - k); sl.textOff.style.opacity = n2(k); sl.labelOn.style.opacity = n2(1 - k); sl.labelOff.style.opacity = n2(k); }
        sl.iconOn.style.opacity = n2(1 - k); sl.iconOff.style.opacity = n2(k);
      }, t, dur || 0.5, "move");
    };
    h.dim = function (i, t, dur) { dimSlot(i, true, t, dur); };
    h.undim = function (i, t, dur) { dimSlot(i, false, t, dur); };
    // snapshots (written in full): empty (rules only), line1..line3 (newest accent, earlier muted), sheet (all three, none accent).
    // To WRITE the next line live (b05, b06): setState("line1", t0) then h.dim(0, ...) and h.show(1, ...) on the cues.
    const ORDER = { empty: 0, line1: 1, line2: 2, line3: 3, sheet: 4 };
    h.setState = function (name, t, o) {
      const n = ORDER[name]; if (n === undefined || sheet) return;
      const dur = (o && o.dur) || 0.5;
      slots.forEach(function (sl, i) {
        if (n === 4 || i < n) fillSlot(i, t); else clearSlot(i, t);
        dimSlot(i, n === 4 ? true : (n > 0 && i < n - 1), t, (o && o.dur) || 0.01);
      });
    };
    return h;
  };

  // ------------------------------------------------------------------ coffee_corner
  // Anatomy. layer "back": wall, tiled lower wall, round clock (upper left, minute hand ticks), closed door with a
  // frosted pane (right), pennant hook, two stool tops. layer "front": counter (top y 900), cabinet fronts,
  // coffee machine, two mugs, light overlay none (state 'day' only).
  Loom.lesson.coffee_corner = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = ctx.c;
    const layer = opts.layer || "all";
    const s = opts.w ? opts.w / 1920 : 1;
    const root = grp(parent, s !== 1 ? { transform: "scale(" + n2(s) + ")" } : {});
    const h = { root: root, counterTop: 900 };
    const line = function (p, x1, y1, x2, y2, tok, sw, op) {
      const a = { x1: x1, y1: y1, x2: x2, y2: y2, stroke: c(tok), "stroke-width": sw, "stroke-linecap": "round" };
      if (op !== undefined) a.opacity = op;
      return sv("line", a, p);
    };
    if (layer !== "front") {
      const back = grp(root); h.back = back;
      kit.rect(back, 0, 0, 1920, 910, { fill: "surface2", crisp: true });
      // tiled lower wall
      kit.rect(back, 0, 640, 1920, 280, { fill: "field2", crisp: true });
      line(back, 0, 640, 1920, 640, "muted", 3, 0.7);
      [727, 814].forEach(function (y) { line(back, 0, y, 1920, y, "muted", 2, 0.28); });
      for (let r = 0; r < 3; r++) {
        for (let x = (r % 2) * 60; x < 1920; x += 120) line(back, x, 640 + r * 87, x, 727 + r * 87, "muted", 2, 0.28);
      }
      // stool tops behind the busts
      [520, 1400].forEach(function (x) {
        sv("ellipse", { cx: x, cy: 876, rx: 150, ry: 22, fill: c("muted"), stroke: c("ink"), "stroke-width": 5 }, back);
      });
      // round wall clock, upper left
      const ck = grp(back); h.clock = { g: ck, cx: 250, cy: 190, r: 72 };
      sv("circle", { cx: 250, cy: 190, r: 72, fill: c("surface"), stroke: c("ink"), "stroke-width": 5 }, ck);
      for (let k = 0; k < 12; k++) {
        const a = k * Math.PI / 6, big = k % 3 === 0, r1 = big ? 50 : 56;
        line(ck, 250 + 64 * Math.sin(a), 190 - 64 * Math.cos(a), 250 + r1 * Math.sin(a), 190 - r1 * Math.cos(a), "ink", big ? 4 : 3);
      }
      const hr = grp(ck, { transform: "rotate(-62 250 190)" });
      line(hr, 250, 190, 250, 154, "ink", 6);
      const mn = grp(ck, { transform: "rotate(40 250 190)" });
      line(mn, 250, 190, 250, 138, "ink", 4);
      h.clock.hour = hr; h.clock.minute = mn;
      sv("circle", { cx: 250, cy: 190, r: 6, fill: c("ink") }, ck);
      // closed door with a frosted pane (right)
      const dr = grp(back); h.door = { g: dr, x: 1610, y: 230, w: 220, h: 670, pane: { x: 1646, y: 268, w: 148, h: 200 } };
      kit.rect(dr, 1610, 230, 220, 670, { fill: "field2", r: 6, flat: true });
      kit.rect(dr, 1640, 640, 160, 220, { fill: "none", r: 6, flat: true, sw: 3 });
      kit.rect(dr, 1646, 268, 148, 200, { fill: "field", r: 8, flat: true, sw: 4 });
      const cid = "cc" + (seq.n++);
      const cp = sv("clipPath", { id: cid }, dr);
      sv("rect", { x: 1646, y: 268, width: 148, height: 200 }, cp);
      const fr = grp(dr, { "clip-path": "url(#" + cid + ")" });
      for (let k = -4; k < 6; k++) line(fr, 1646 + k * 34, 468, 1646 + k * 34 + 120, 268, "muted", 3, 0.3);
      sv("circle", { cx: 1654, cy: 600, r: 12, fill: c("accent2"), stroke: c("ink"), "stroke-width": 4 }, dr);
      // pennant hook above the counter
      const hk = grp(back); h.hook = { g: hk, x: 960, y: 236 };
      sv("circle", { cx: 960, cy: 236, r: 11, fill: c("surface"), stroke: c("ink"), "stroke-width": 4 }, hk);
      inkPath(ctx, hk, "M960 240 Q960 262 944 262", "none", { sw: 5 });
    }
    if (layer !== "back") {
      const front = grp(root); h.front = front;
      // coffee machine at the left end
      const cm = grp(front); h.machine = cm;
      kit.rect(cm, 100, 760, 150, 170, { fill: "muted", r: 12 });
      kit.rect(cm, 118, 782, 114, 54, { fill: "surface", r: 8, flat: true, sw: 4 });
      kit.rect(cm, 138, 862, 74, 12, { fill: "ink", r: 5, crisp: true });
      // counter
      kit.rect(front, -20, 900, 1960, 48, { fill: "surface", flat: true });
      kit.rect(front, -20, 948, 1960, 150, { fill: "field2", flat: true });
      for (let k = 1; k < 6; k++) line(front, k * 320, 952, k * 320, 1090, "muted", 3);
      [160, 480, 800, 1120, 1440, 1760].forEach(function (x) { kit.rect(front, x - 20, 968, 40, 10, { fill: "ink", r: 5, crisp: true }); });
      // two mugs on the counter
      const mug = function (x, hx) {
        const m = grp(front);
        sv("path", { d: "M" + (x + hx * 32) + " 888 Q" + (x + hx * 62) + " 888 " + (x + hx * 62) + " 908 Q" + (x + hx * 62) + " 928 " + (x + hx * 32) + " 926", fill: "none", stroke: c("ink"), "stroke-width": 6, "stroke-linecap": "round" }, m);
        kit.rect(m, x - 32, 868, 64, 66, { fill: "surface", r: 12 });
        sv("ellipse", { cx: x, cy: 870, rx: 32, ry: 8, fill: c("ink") }, m);
        return m;
      };
      h.mugL = mug(690, 1); h.mugR = mug(1230, -1);
    }
    h.tickClock = function (t, dur) {
      if (!h.clock) return;
      const cx = h.clock.cx, cy = h.clock.cy;
      drv(function (e) { h.clock.minute.setAttribute("transform", "rotate(" + n2(40 + 30 * e) + " " + cx + " " + cy + ")"); }, t, dur || 0.3, "overshoot");
    };
    h.setState = function () {};
    return h;
  };
})();
