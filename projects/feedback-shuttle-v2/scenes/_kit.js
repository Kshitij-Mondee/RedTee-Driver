(function () {
Loom.lesson = Loom.lesson || {};

// ---- shared constants and helpers (private; the constants are exported on Loom.lesson.meeting_room.K) ----
const K = {
  SLOT: { behaviour: "accent3", effect: "accent4", step: "accent2" },
  SLOT_LIST: ["accent3", "accent4", "accent2"],
  SLOT_NAMES: ["Behaviour", "Effect", "Next step"],
  ROOM: {
    w: 1920, h: 1080, tableTop: 890,
    screen: { x: 60, y: 60, w: 540, h: 320 },
    clock: { x: 630, y: 70, w: 150, h: 150 },
    calendar: { x: 1440, y: 70, w: 380, h: 280 },
    bubble: { x: 610, y: 250, w: 760, h: 400 },
    bubbleTail: { x: 628, y: 690 },
    bubbleSmall: { x: 830, y: 60, scale: 0.5 },
    nina: { x: 360, y: 621, size: 560 },
    theo: { x: 1560, y: 621, size: 560, flip: true },
    tag: { x: 560, y: 560, w: 280, h: 120 }
  }
};
function H(ctx) {
  const sv = Loom.svg, k = ctx.kit, uid = Loom.uid("kc");
  let n = 0;
  const num = function (v) { return Math.round(v * 100) / 100; };
  const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  // visibility on/off: an inactive variant leaves no live text box ("inherit" so a hidden parent still hides it)
  const vis = function (el, on) { el.setAttribute("visibility", on ? "inherit" : "hidden"); };
  function chan(apply, init) {
    const o = { v: init || 0, key: uid + "." + (n++) };
    apply(o.v);
    o.go = function (val, t, dur, ease) {
      const f = o.v; o.v = val;
      Loom.drive(function (e) { apply(f + (val - f) * e); }, t, Math.max(dur == null ? ctx.style.dur("enter") : dur, 0.001), ease || "enter", { key: o.key });
      return o;
    };
    return o;
  }
  function txt(parent, str, o) {
    return k.text(parent, str, Object.assign({ align: "left", valign: "middle", maxLines: 1, color: "ink" }, o));
  }
  function scaleOf(opts, nw) { return opts && opts.w ? opts.w / nw : ((opts && opts.scale) || 1); }
  function dashRect(parent, x, y, w, hh, o) {
    return sv("rect", { x: x, y: y, width: w, height: hh, rx: o.r || 10, fill: "none", stroke: ctx.c(o.stroke || "ink"), "stroke-width": o.sw || 4, "stroke-dasharray": o.dash || "14 10", "stroke-linecap": "round" }, parent);
  }
  function pick(fill) { try { return Loom.style.pickTokenOn(fill) || "ink"; } catch (e) { return "ink"; } }
  return { sv: sv, k: k, num: num, clamp: clamp, vis: vis, chan: chan, txt: txt, dur: ctx.style.dur, scaleOf: scaleOf, dashRect: dashRect, pick: pick, uid: uid };
}

// ---- the meeting room: wall (back layer), table lip + front + nameplates (front layer) ----
// opts.layer: "all" (default), "back" (wall only) or "front" (table and nameplates; place it AFTER the busts)
Loom.lesson.meeting_room = function (ctx, parent, opts) {
  opts = opts || {};
  const R = K.ROOM, h = H(ctx), k = h.k, sv = h.sv;
  const root = sv("g", {}, parent);
  const layer = opts.layer || "all";
  const back = sv("g", {}, root), front = sv("g", {}, root);
  if (layer !== "front") {
    k.rect(back, -20, -20, 1960, R.tableTop + 40, { fill: "surface2", crisp: true, r: 0 });
    k.rect(back, -20, 828, 1960, 80, { fill: "field2", flat: true, r: 0, sw: 3, stroke: "muted" });
  }
  const plates = {};
  if (layer !== "back") {
    k.rect(front, -20, R.tableTop, 1960, 24, { fill: "surface", r: 0, flat: true });
    k.rect(front, -20, R.tableTop + 24, 1960, 1080 - R.tableTop - 4, { fill: "field2", r: 0 });
    [["nina", "Nina", R.nina.x], ["theo", "Theo", R.theo.x]].forEach(function (d) {
      const g = sv("g", {}, front), cx = d[2];
      k.polygon(g, [[cx - 112, R.tableTop + 16], [cx + 112, R.tableTop + 16], [cx + 94, R.tableTop - 56], [cx - 94, R.tableTop - 56]], { fill: "surface" });
      h.txt(g, d[1], { role: "label", weight: 400, x: cx - 70, y: R.tableTop - 46, w: 140, h: 56, align: "center" });
      plates[d[0]] = { g: g, cx: cx, ch: null };
    });
  }
  Object.keys(plates).forEach(function (id) {
    const p = plates[id];
    p.ch = h.chan(function (v) {
      const op = h.clamp(v * 2, 0, 1);
      p.g.setAttribute("opacity", h.num(op));
      h.vis(p.g, op > 0.001);
      p.g.setAttribute("transform", "translate(" + p.cx + " " + (R.tableTop + 16) + ") scale(" + h.num(0.7 + 0.3 * v) + ") translate(" + (-p.cx) + " " + (-(R.tableTop + 16)) + ")");
    }, 0);
  });
  const api = {
    g: root, back: back, front: front, plates: plates, rects: R,
    setState: function (name, t) {
      const on = name === "nameplates" ? 1 : 0, d = h.dur("enter");
      let i = 0;
      Object.keys(plates).forEach(function (id) { plates[id].ch.go(on, t + (on ? 0.1 * i++ : 0), d, "overshoot"); });
      return api;
    }
  };
  return api;
};
Loom.lesson.meeting_room.K = K;

// ---- a round wall clock: hands are a function of minutes (M) ----
Loom.lesson.wall_clock = function (ctx, parent, opts) {
  opts = opts || {};
  const h = H(ctx), k = h.k, sv = h.sv;
  const root = sv("g", { transform: "scale(" + h.num(h.scaleOf(opts, 150)) + ")" }, parent);
  const cx = 75, cy = 75;
  k.disc(root, cx, cy, 70, { fill: "surface" });
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6, r1 = i % 3 === 0 ? 52 : 57, r2 = 63;
    k.line(root, cx + Math.sin(a) * r1, cy - Math.cos(a) * r1, cx + Math.sin(a) * r2, cy - Math.cos(a) * r2, { stroke: "ink", sw: i % 3 === 0 ? 4 : 3 });
  }
  const hour = sv("g", {}, root), min = sv("g", {}, root);
  k.line(hour, cx, cy + 6, cx, cy - 32, { stroke: "ink", sw: 7 });
  k.line(min, cx, cy + 8, cx, cy - 50, { stroke: "ink", sw: 5 });
  sv("circle", { cx: cx, cy: cy, r: 6, fill: ctx.c("ink") }, root);
  const M = { on_time: 590, past_hour: 615, early: 570 };   // minutes on a 12 hour dial: 9:50, 10:15, 9:30
  const ch = h.chan(function (m) {
    hour.setAttribute("transform", "rotate(" + h.num(m * 0.5) + " " + cx + " " + cy + ")");
    min.setAttribute("transform", "rotate(" + h.num(m * 6) + " " + cx + " " + cy + ")");
  }, M.on_time);
  const api = {
    g: root, hour: hour, min: min, hands: ch, minutes: M,
    setMinutes: function (m, t, dur) { ch.go(m, t, dur == null ? 0.25 : dur, "move"); return api; },
    setState: function (name, t) {
      if (M[name] == null) return api;
      ch.go(M[name], t, name === "past_hour" ? 1.8 : 0.6, "move");
      return api;
    }
  };
  return api;
};

// ---- the wall screen with Theo's slide stack ----
Loom.lesson.wall_screen = function (ctx, parent, opts) {
  opts = opts || {};
  const h = H(ctx), k = h.k, sv = h.sv;
  const root = sv("g", { transform: "scale(" + h.num(h.scaleOf(opts, 540)) + ")" }, parent);
  k.rect(root, 0, 0, 540, 320, { fill: "ink", r: 16, flat: true });
  k.rect(root, 14, 14, 512, 292, { fill: "surface", r: 8, flat: true, sw: 3 });
  const TITLES = ["Design", "Hiring", "Vendors", "Timeline", "Budget question"];
  const RH = 60, STEP = 53, ROW0 = 21, CX = 30, CW = 480;
  const rowY = function (r) { return ROW0 + r * STEP; };
  const cards = TITLES.map(function (title, i) {
    const g = sv("g", {}, root), inner = sv("g", {}, g);
    const bud = i === 4;
    k.rect(inner, CX, 0, CW, RH, { fill: bud ? "surface" : "field", r: 8, flat: true, sw: 4 });
    k.rect(inner, CX + 12, 13, 40, 34, { fill: bud ? "accent" : "surface", r: 4, flat: true, sw: 3 });
    let mark = null;
    if (bud) mark = sv("rect", { x: CX - 3, y: -3, width: CW + 6, height: RH + 6, rx: 11, fill: "none", stroke: ctx.c("accent"), "stroke-width": 6, opacity: 0 }, inner);
    h.txt(inner, title, { role: "label", weight: 400, x: CX + 66, y: 8, w: CW - 90, h: 44 });
    const c = { g: g, title: title, mark: mark };
    c.show = h.chan(function (v) {
      const op = h.clamp(v * 1.8, 0, 1);
      g.setAttribute("opacity", h.num(op));
      h.vis(g, op > 0.001);
      inner.setAttribute("transform", "translate(0 " + h.num((v - 1) * -34) + ")");
    }, 0);
    c.pos = h.chan(function (r) { g.setAttribute("transform", "translate(0 " + h.num(rowY(r)) + ")"); }, i);
    c.markCh = mark ? h.chan(function (v) { mark.setAttribute("opacity", h.num(h.clamp(v, 0, 1))); }, 0) : null;
    return c;
  });
  // the Decided stamp: a pos tick stamp on the budget card
  const stamp = sv("g", {}, root), stampIn = sv("g", {}, stamp);
  const SX = 262, SY = -4, SW = 234, SH = 64;
  sv("rect", { x: SX, y: SY, width: SW, height: SH, rx: 10, fill: ctx.c("pos"), stroke: ctx.c("ink"), "stroke-width": 5 }, stampIn);
  k.mark(stampIn, "yes", SX + 34, SY + SH / 2, 28);
  h.txt(stampIn, "Decided", { role: "label", weight: 400, x: SX + 62, y: SY + 10, w: 156, h: 44, align: "center" });
  const stampCh = h.chan(function (v) {
    const op = h.clamp(v * 2.5, 0, 1);
    stamp.setAttribute("opacity", h.num(op));
    h.vis(stamp, op > 0.001);
    stampIn.setAttribute("transform", "translate(" + (SX + SW / 2) + " " + (SY + SH / 2) + ") rotate(-6) scale(" + h.num(1 + (1 - v) * 0.6) + ") translate(" + (-(SX + SW / 2)) + " " + (-(SY + SH / 2)) + ")");
  }, 0);
  function reset(t) { cards.forEach(function (c) { c.show.go(0, t, 0.001); if (c.markCh) c.markCh.go(0, t, 0.001); }); stampCh.go(0, t, 0.001); }
  const api = {
    g: root, cards: cards, stamp: stamp, titles: TITLES,
    // bring one card in on its own cue (0..4: Design, Hiring, Vendors, Timeline, Budget question)
    showCard: function (i, t, o) {
      o = o || {};
      cards[i].show.go(1, t, o.dur == null ? h.dur("enter") : o.dur, "overshoot");
      if (i === 4) cards[4].markCh.go(o.marked === false ? 0 : 1, t + 0.15, 0.3);
      return api;
    },
    stampDecided: function (t) { stampCh.go(1, t, 0.3, "overshoot"); return api; },
    setState: function (name, t, o) {
      o = o || {};
      const d = h.dur("enter");
      reset(t);
      if (name === "blank") return api;
      const gap = o.gap != null ? o.gap : (name === "replay" ? 0.16 : 0.45), t0 = t + 0.02;
      if (name === "budget_first" || name === "decided") {
        stamp.setAttribute("transform", "translate(0 " + h.num(rowY(0)) + ")");
        cards[4].pos.go(0, t, 0.001);
        cards.slice(0, 4).forEach(function (c, i) { c.pos.go(i + 1, t, 0.001); });
        if (name === "budget_first") {
          cards[4].show.go(1, t0, d, "overshoot"); cards[4].markCh.go(1, t0 + 0.15, 0.3);
          cards.slice(0, 4).forEach(function (c, i) { c.show.go(1, t0 + 0.5 + i * gap, d, "overshoot"); });
        } else {
          cards.forEach(function (c) { c.show.go(1, t0, 0.001); });
          cards[4].markCh.go(1, t0, 0.001);
          stampCh.go(1, t0 + 0.2, 0.3, "overshoot");
        }
        return api;
      }
      cards.forEach(function (c, i) { c.pos.go(i, t, 0.001); });
      cards.forEach(function (c, i) {
        c.show.go(1, t0 + i * gap + (i === 4 && name === "replay" ? 0.3 : 0), name === "replay" ? 0.3 : d, "overshoot");
      });
      if (name === "replay") cards[4].markCh.go(1, t0 + 4 * gap + 0.45, 0.3);
      else cards[4].markCh.go(1, t0 + 4 * gap + 0.2, 0.3);
      return api;
    }
  };
  return api;
};

// ---- the wall calendar ----
Loom.lesson.wall_calendar = function (ctx, parent, opts) {
  opts = opts || {};
  const h = H(ctx), k = h.k, sv = h.sv;
  const root = sv("g", { transform: "scale(" + h.num(h.scaleOf(opts, 380)) + ")" }, parent);
  const HY = 52;   // the hinge: bottom of the header
  const page = function (parent2) {
    const g = sv("g", {}, parent2);
    k.rect(g, 0, HY - 4, 380, 280 - HY + 4, { fill: "surface", r: 10, flat: true });
    [["This week", 14], ["Next week", 194]].forEach(function (c) {
      k.rect(g, c[1], HY + 8, 172, 62, { fill: "field", r: 6, flat: true, sw: 3 });
      h.txt(g, c[0], { role: "label", weight: 400, x: c[1] + 10, y: HY + 17, w: 152, h: 44, align: "center" });
      for (let r = 0; r < 3; r++) k.line(g, c[1] + 6, HY + 96 + r * 44, c[1] + 166, HY + 96 + r * 44, { stroke: "muted", sw: 3 });
    });
    return g;
  };
  const under = page(root);                      // the new page beneath (live only once the flip begins)
  const turning = sv("g", {}, root);             // the old page, hinged at the header
  const front = page(turning);
  const backFace = sv("g", { opacity: 0 }, turning);
  k.rect(backFace, 0, HY - 4, 380, 280 - HY + 4, { fill: "field2", r: 10, flat: true });
  k.rect(root, 0, 0, 380, HY, { fill: "accent3", r: 10, flat: true });
  [90, 290].forEach(function (x) { k.disc(root, x, 20, 9, { fill: "ink" }); });
  // tab "A week later" hanging off the bottom edge
  const tab = sv("g", {}, root);
  k.rect(tab, 176, 262, 196, 64, { fill: "surface", r: 8, flat: false });
  h.txt(tab, "A week later", { role: "label", weight: 400, x: 188, y: 272, w: 172, h: 44, align: "center" });
  const tabCh = h.chan(function (v) {
    const op = h.clamp(v * 2, 0, 1);
    tab.setAttribute("opacity", h.num(op));
    h.vis(tab, op > 0.001);
    tab.setAttribute("transform", "translate(0 " + h.num((1 - v) * -24) + ")");
  }, 0);
  const flipCh = h.chan(function (f) {
    const sy = Math.cos(f * Math.PI);
    turning.setAttribute("transform", "translate(0 " + HY + ") scale(1 " + h.num(sy === 0 ? 0.001 : sy) + ") translate(0 " + (-HY) + ")");
    h.vis(under, f > 0.001);        // the new page's words are live only once the flip has begun
    h.vis(front, sy > 0.001);       // the old page's words stop once it has turned edge-on
    front.setAttribute("opacity", sy > 0 ? 1 : 0);
    backFace.setAttribute("opacity", sy > 0 ? 0 : h.num(h.clamp(1 - (f - 0.7) / 0.3, 0, 1)));
  }, 0);
  // the Budget decision card (words: Budget decision), accent on it
  const card = sv("g", {}, root), cardIn = sv("g", {}, card);
  k.rect(cardIn, 0, 0, 164, 124, { fill: "surface", r: 8, flat: true, sw: 4 });
  sv("rect", { x: -3, y: -3, width: 170, height: 130, rx: 11, fill: "none", stroke: ctx.c("accent"), "stroke-width": 6 }, cardIn);
  k.rect(cardIn, 12, 10, 140, 16, { fill: "accent", r: 4, flat: true, sw: 3 });
  h.txt(cardIn, "Budget decision", { role: "label", weight: 400, x: 10, y: 32, w: 144, h: 84, maxLines: 2, align: "center" });
  const cardShow = h.chan(function (v) {
    const op = h.clamp(v * 2, 0, 1);
    card.setAttribute("opacity", h.num(op));
    h.vis(card, op > 0.001);
    cardIn.setAttribute("transform", "translate(82 62) scale(" + h.num(0.55 + 0.45 * v) + ") translate(-82 -62)");
  }, 0);
  const cardCol = h.chan(function (c) { card.setAttribute("transform", "translate(" + h.num(18 + 180 * c) + " " + (HY + 80) + ")"); }, 0);
  const CFG = {
    plain: { flip: 0, tab: 0, card: 0, col: 0 },
    flip: { flip: 1, tab: 1, card: 0, col: 0 },
    budget_card: { flip: 0, tab: 0, card: 1, col: 0 },
    moved: { flip: 0, tab: 0, card: 1, col: 1 }
  };
  const api = {
    g: root, card: card, tab: tab, page: turning,
    setState: function (name, t) {
      const c = CFG[name]; if (!c) return api;
      const d = h.dur("enter");
      flipCh.go(c.flip, t, c.flip > flipCh.v ? 0.9 : 0.001, "move");
      tabCh.go(c.tab, t + (c.tab ? 0.7 : 0), c.tab ? d : 0.001, "overshoot");
      cardCol.go(c.col, t, name === "moved" ? h.dur("move") + 0.2 : 0.001, "move");
      cardShow.go(c.card, t, c.card ? d : 0.001, "overshoot");
      return api;
    }
  };
  return api;
};

// ---- Nina's comment bubble ----
Loom.lesson.comment_bubble = function (ctx, parent, opts) {
  opts = opts || {};
  const R = K.ROOM, h = H(ctx), k = h.k, sv = h.sv;
  const root = sv("g", { transform: "scale(" + h.num(h.scaleOf(opts, 760)) + ")" }, parent);
  const moveG = sv("g", {}, root), ghostG = sv("g", {}, moveG);
  const TX = 18, TY = 440;   // tail tip, toward Nina (screen left)
  function body(parent2, y0, hh) {
    const g = sv("g", {}, parent2);
    k.polygon(g, [[64, y0 + hh - 4], [160, y0 + hh - 4], [TX, TY]], { fill: "surface" });
    k.rect(g, 0, y0, 760, hh, { fill: "surface", r: 28, flat: true });
    sv("rect", { x: 70, y: y0 + hh - 4, width: 84, height: 9, fill: ctx.c("surface") }, g);
    return g;
  }
  // vague: a one line bubble sitting at the foot of the full bubble's footprint
  const vagueG = sv("g", {}, ghostG);
  body(vagueG, 210, 190);
  h.txt(vagueG, "Great job, maybe tighten it up a bit.", { role: "lead", x: 38, y: 226, w: 684, h: 150, maxLines: 2, align: "center", weight: 700 });
  const fullG = sv("g", {}, ghostG);
  body(fullG, 0, 400);
  const TEXTS = ["Tuesday: budget question on the last slide", "Budget decision moved to next week", "Next time: decision first"];
  const CY = [46, 172, 298], CH = 90, TW = 160, TH = 62;
  const pick = h.pick;
  const rows = [0, 1, 2].map(function (i) {
    const y = CY[i], fillTok = K.SLOT_LIST[i];
    const slotG = sv("g", {}, fullG);
    h.dashRect(slotG, 20, y, 720, CH, { r: 12, sw: 4 });
    h.dashRect(slotG, 30, y - 32, TW, TH, { r: 10, sw: 3, stroke: "muted", dash: "10 8" });
    const cid = h.uid + ".c" + i;
    const rowG = sv("g", {}, fullG), cp = sv("clipPath", { id: cid }, rowG);
    const clipRect = sv("rect", { x: 0, y: y - 60, width: 0, height: CH + 80 }, cp);
    const content = sv("g", { "clip-path": "url(#" + cid + ")" }, rowG);
    const cardG = sv("g", {}, content);
    k.rect(cardG, 20, y, 720, CH, { fill: "field", r: 12, flat: true, sw: 4 });
    const lit = sv("rect", { x: 20, y: y, width: 720, height: CH, rx: 12, fill: "none", stroke: ctx.c("accent"), "stroke-width": 8, opacity: 0 }, content);
    h.txt(content, TEXTS[i], { role: "body", weight: 700, x: 38, y: y + 30, w: 690, h: 48 });
    const mkTab = function (fill, label) {
      const g = sv("g", {}, content);
      k.rect(g, 30, y - 32, TW, TH, { fill: fill, r: 10, flat: true, sw: 4 });
      h.txt(g, label, { role: "label", weight: 400, color: pick(fill), x: 42, y: y - 32 + 9, w: TW - 24, h: 44, align: "center" });
      return g;
    };
    const tabSlot = mkTab(fillTok, K.SLOT_NAMES[i]), tabPaper = mkTab("surface", K.SLOT_NAMES[i]), tabLit = mkTab("accent", K.SLOT_NAMES[i]);
    const r = { i: i, slot: slotG, row: rowG, lit: lit, tabs: { slot: tabSlot, paper: tabPaper, accent: tabLit }, st: { paper: 0, lit: 0 } };
    const looks = function () {
      const a = (1 - r.st.paper) * (1 - r.st.lit), b = r.st.paper * (1 - r.st.lit), c = r.st.lit;
      tabSlot.setAttribute("opacity", h.num(a)); h.vis(tabSlot, a > 0.001);
      tabPaper.setAttribute("opacity", h.num(b)); h.vis(tabPaper, b > 0.001);
      tabLit.setAttribute("opacity", h.num(c)); h.vis(tabLit, c > 0.001);
      lit.setAttribute("opacity", h.num(c));
    };
    r.show = h.chan(function (v) {
      clipRect.setAttribute("width", h.num(h.clamp((v - 0.15) / 0.85, 0, 1) * 760));
      rowG.setAttribute("opacity", v > 0.001 ? 1 : 0);
      h.vis(rowG, v > 0.001);
    }, 0);
    r.slotCh = h.chan(function (v) { const op = h.clamp(v, 0, 1); slotG.setAttribute("opacity", h.num(op)); h.vis(slotG, op > 0.001); }, 0);
    r.paperCh = h.chan(function (v) { r.st.paper = h.clamp(v, 0, 1); looks(); }, 0);
    r.litCh = h.chan(function (v) { r.st.lit = h.clamp(v, 0, 1); looks(); }, 0);
    looks();
    return r;
  });
  // the agreed tick on row 3: a pos disc with a tick shape
  const tick = sv("g", {}, fullG), tickIn = sv("g", {}, tick);
  const TKX = 694, TKY = CY[2] + 4;
  sv("circle", { cx: TKX, cy: TKY, r: 30, fill: ctx.c("pos"), stroke: ctx.c("ink"), "stroke-width": 5 }, tickIn);
  k.mark(tickIn, "yes", TKX, TKY, 34);
  const tickCh = h.chan(function (v) {
    const op = h.clamp(v * 2.5, 0, 1);
    tick.setAttribute("opacity", h.num(op));
    h.vis(tick, op > 0.001);
    tickIn.setAttribute("transform", "translate(" + TKX + " " + TKY + ") scale(" + h.num(1 + (1 - v) * 0.7) + ") translate(" + (-TKX) + " " + (-TKY) + ")");
  }, 0);
  // whole-bubble channels
  const vagueCh = h.chan(function (v) { const op = h.clamp(v * 1.6, 0, 1); vagueG.setAttribute("opacity", h.num(op)); h.vis(vagueG, op > 0.001); vagueG.setAttribute("transform", "translate(" + TX + " " + TY + ") scale(" + h.num(0.8 + 0.2 * v) + ") translate(" + (-TX) + " " + (-TY) + ")"); }, 0);
  const fullCh = h.chan(function (v) { const op = h.clamp(v * 1.6, 0, 1); fullG.setAttribute("opacity", h.num(op)); h.vis(fullG, op > 0.001); fullG.setAttribute("transform", "translate(" + TX + " " + TY + ") scale(" + h.num(0.8 + 0.2 * v) + ") translate(" + (-TX) + " " + (-TY) + ")"); }, 0);
  const ghostCh = h.chan(function (v) { ghostG.setAttribute("opacity", h.num(1 - 0.78 * h.clamp(v, 0, 1))); }, 0);
  const sm = Object.assign({}, R.bubbleSmall, opts.small || {});
  const smallCh = h.chan(function (v) {
    const tx = (sm.x - R.bubble.x) * v, ty = (sm.y - R.bubble.y) * v, sc = 1 + (sm.scale - 1) * v;
    moveG.setAttribute("transform", "translate(" + h.num(tx) + " " + h.num(ty) + ") scale(" + h.num(sc) + ")");
  }, 0);
  const pulseCh = h.chan(function () {}, 0);
  const CFG = {
    vague: { vague: 1 }, ghost: { vague: 1, ghost: 1 },
    behaviour: { full: 1, r: [1, 0, 0] },
    slots: { full: 1, r: [1, 0, 0], s: [0, 1, 1] },
    effect: { full: 1, r: [1, 1, 0], s: [0, 0, 1] },
    step: { full: 1, r: [1, 1, 1] },
    agreed: { full: 1, r: [1, 1, 1], tick: 1 },
    lit_1: { full: 1, r: [1, 1, 1], paper: [1, 1, 1], lit: [1, 0, 0] },
    lit_2: { full: 1, r: [1, 1, 1], paper: [1, 1, 1], lit: [0, 1, 0] },
    lit_3: { full: 1, r: [1, 1, 1], paper: [1, 1, 1], lit: [0, 0, 1] },
    small: { full: 1, r: [1, 1, 1], small: 1 }
  };
  const api = {
    g: root, vague: vagueG, full: fullG, rows: rows, tick: tick, slots: [rows[1].slot, rows[2].slot], tabW: TW, rowY: CY, rowH: CH,
    tail: { x: TX, y: TY },
    // pulse the empty slots for `secs` seconds from t (period 1.4 s)
    pulse: function (t, secs) {
      const period = 1.4, n = Math.max(1, Math.round((secs || 6) / period));
      Loom.drive(function (e) {
        const w = 0.5 + 0.5 * Math.sin(e * n * 2 * Math.PI - Math.PI / 2);
        [1, 2].forEach(function (i) { const o = rows[i].slotCh.v; rows[i].slot.setAttribute("opacity", h.num(o * (0.55 + 0.45 * w))); });
      }, t, n * period, "linear", { key: pulseCh.key });
      return api;
    },
    setState: function (name, t, o) {
      const c = CFG[name]; if (!c) return api;
      o = o || {};
      const d = h.dur("enter"), mv = h.dur("move");
      vagueCh.go(c.vague || 0, t, d, c.vague ? "overshoot" : "exit");
      ghostCh.go(c.ghost || 0, t, d);
      fullCh.go(c.full || 0, t, d, c.full ? "overshoot" : "exit");
      rows.forEach(function (r, i) {
        const show = c.r ? c.r[i] : 0;
        r.show.go(show, t + (show && r.show.v !== 1 ? 0.12 : 0), show ? 0.55 : 0.2, "move");
        r.slotCh.go(c.s ? c.s[i] : 0, t + (c.s && c.s[i] ? 0.1 + 0.08 * i : 0), mv);
        r.paperCh.go(c.paper ? c.paper[i] : 0, t, mv);
        r.litCh.go(c.lit ? c.lit[i] : 0, t, mv);
      });
      tickCh.go(c.tick || 0, t + (c.tick ? 0.05 : 0), c.tick ? 0.3 : 0.001, "overshoot");
      smallCh.go(c.small || 0, t, mv + 0.15, "move");
      if (name === "slots" && o.pulse !== 0) api.pulse(t + 0.7, o.pulse || 8);
      return api;
    }
  };
  return api;
};

// ---- the You ramble tag ----
Loom.lesson.label_tag = function (ctx, parent, opts) {
  opts = opts || {};
  const h = H(ctx), k = h.k, sv = h.sv;
  const root = sv("g", { transform: "scale(" + h.num(h.scaleOf(opts, 280)) + ")" }, parent);
  const move = sv("g", {}, root), tag = sv("g", {}, move);
  k.rect(tag, 14, 12, 252, 96, { fill: "surface", r: 10 });
  k.rect(tag, 14, 12, 34, 96, { fill: "accent", r: 10, flat: true });
  sv("circle", { cx: 66, cy: 60, r: 7, fill: ctx.c("field"), stroke: ctx.c("ink"), "stroke-width": 3 }, tag);
  h.txt(tag, "You ramble", { role: "label", weight: 400, x: 82, y: 24, w: 170, h: 72, align: "center" });
  // the lifted corner, bottom right
  const fold = sv("g", { opacity: 0, visibility: "hidden" }, tag);
  k.polygon(fold, [[266, 70], [218, 108], [266, 108]], { fill: "field2" });
  const pose = h.chan(function (v) {   // 0 in hand (tilted), 1 stuck (flat)
    tag.setAttribute("transform", "rotate(" + h.num(-7 + 9 * v) + " 140 60)");
  }, 0);
  const peel = h.chan(function (v) { const op = h.clamp(v * 3, 0, 1); fold.setAttribute("opacity", h.num(op)); h.vis(fold, op > 0.001); }, 0);
  const fall = h.chan(function (v) {
    const op = 1 - h.clamp((v - 0.6) / 0.4, 0, 1);
    move.setAttribute("transform", "translate(" + h.num(v * 40) + " " + h.num(v * v * 420) + ") rotate(" + h.num(v * 34) + " 140 60)");
    move.setAttribute("opacity", h.num(op));
    h.vis(move, op > 0.001);
  }, 0);
  const api = {
    g: root, tag: tag, fold: fold,
    setState: function (name, t) {
      const d = h.dur("enter");
      if (name === "in_hand") { pose.go(0, t, d, "overshoot"); peel.go(0, t, 0.001); fall.go(0, t, 0.001); }
      if (name === "stuck") { pose.go(1, t, 0.18, "overshoot"); peel.go(0, t, 0.001); fall.go(0, t, 0.001); }
      if (name === "peeling") { pose.go(1, t, 0.001); peel.go(1, t, 0.4); fall.go(1, t + 0.5, 0.8, "enter"); }
      return api;
    }
  };
  return api;
};

// ---- three answer cards (1680 x 420), additive states ----
Loom.lesson.answer_cards = function (ctx, parent, opts) {
  opts = opts || {};
  const h = H(ctx), k = h.k, sv = h.sv;
  const root = sv("g", { transform: "scale(" + h.num(opts.scale || 1) + ")" }, parent);
  const CW = 520, CHT = 396, X = [0, 580, 1160], Y0 = 24;
  const LET = ["A", "B", "C"];
  const TXT = ["Be more organised",
    "The report came Friday night, so the team worked the weekend. Could we try a Thursday draft?",
    "The report came Friday night, so the team worked the weekend. Please be more careful."];
  const SX = [56, 148, 240], SY = 346;
  const cards = LET.map(function (L, i) {
    const place = sv("g", { transform: "translate(" + X[i] + " " + Y0 + ")" }, root);
    const mover = sv("g", { opacity: 0, visibility: "hidden" }, place);
    k.rect(mover, 0, 0, CW, CHT, { fill: "surface", r: 14 });
    k.disc(mover, 56, 60, 36, { fill: "field" });
    h.txt(mover, L, { role: "label", weight: 400, x: 32, y: 38, w: 48, h: 44, align: "center" });
    h.txt(mover, TXT[i], { role: "body", weight: 600, x: 28, y: 112, w: 464, h: 196, maxLines: 5, valign: "top" });
    const slots = [0, 1, 2].map(function (j) {
      const g = sv("g", {}, mover), cx = SX[j];
      sv("circle", { cx: cx, cy: SY, r: 28, fill: ctx.c("field"), stroke: ctx.c(K.SLOT_LIST[j]), "stroke-width": 6 }, g);
      const fill = sv("g", { opacity: 0 }, g);
      sv("circle", { cx: cx, cy: SY, r: 28, fill: ctx.c(K.SLOT_LIST[j]), stroke: ctx.c("ink"), "stroke-width": 4 }, fill);
      k.mark(fill, "yes", cx, SY, 30);
      const ch = h.chan(function (v) {
        const op = h.clamp(v * 2.5, 0, 1);
        fill.setAttribute("opacity", h.num(op));
        h.vis(fill, op > 0.001);
        fill.setAttribute("transform", "translate(" + cx + " " + SY + ") scale(" + h.num(1 + (1 - v) * 0.6) + ") translate(" + (-cx) + " " + (-SY) + ")");
      }, 0);
      return { g: g, ch: ch };
    });
    const c = { L: L, place: place, g: mover, slots: slots, inV: 0, liftV: 0 };
    const apply = function () {
      const s = 1 + 0.04 * c.liftV, ty = (1 - c.inV) * 70 - 24 * c.liftV;
      const op = h.clamp(c.inV * 2, 0, 1);
      mover.setAttribute("opacity", h.num(op));
      h.vis(mover, op > 0.001);
      mover.setAttribute("transform", "translate(" + (CW / 2) + " " + (CHT / 2) + ") scale(" + h.num(s) + ") translate(" + (-CW / 2) + " " + (-CHT / 2 - ty / s) + ")");
    };
    c.in = h.chan(function (v) { c.inV = v; apply(); }, 0);
    c.lift = h.chan(function (v) { c.liftV = v; apply(); }, 0);
    apply();
    return c;
  });
  function tagOn(card, label, w) {
    const g = sv("g", { opacity: 0, visibility: "hidden" }, cards[card].g), x = CW - w - 22, y = 24;
    k.rect(g, x, y, w, 62, { fill: "field2", r: 10, flat: true });
    h.txt(g, label, { role: "label", weight: 400, x: x + 10, y: y + 9, w: w - 20, h: 44, align: "center" });
    return { g: g, ch: h.chan(function (v) {
      const op = h.clamp(v * 2.5, 0, 1);
      g.setAttribute("opacity", h.num(op));
      h.vis(g, op > 0.001);
      g.setAttribute("transform", "translate(" + (x + w / 2) + " " + (y + 31) + ") rotate(" + h.num(-5 * v) + ") scale(" + h.num(0.6 + 0.4 * v) + ") translate(" + (-(x + w / 2)) + " " + (-(y + 31)) + ")");
    }, 0) };
  }
  const labelA = tagOn(0, "Label", 136), noStepC = tagOn(2, "No step", 150);
  // the accent circle round C's empty third slot, drawn on
  const ring = sv("circle", { cx: X[2] + SX[2], cy: Y0 + SY, r: 42, fill: "none", stroke: ctx.c("accent"), "stroke-width": 7, pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1, "stroke-linecap": "round", transform: "rotate(-100 " + (X[2] + SX[2]) + " " + (Y0 + SY) + ")" }, root);
  const ringCh = h.chan(function (v) { ring.setAttribute("stroke-dashoffset", h.num(1 - h.clamp(v, 0, 1))); }, 0);
  function ticks(i, n, t, d) { for (let j = 0; j < 3; j++) cards[i].slots[j].ch.go(j < n ? 1 : 0, t + (j < n ? 0.3 * j : 0), d == null ? 0.3 : d, "overshoot"); }
  const api = {
    g: root, cards: cards, ring: ring, labelA: labelA, noStepC: noStepC,
    in: function (i, on, t, dur) { cards[i].in.go(on ? 1 : 0, t, dur == null ? 0.55 : dur, "move"); return api; },
    lift: function (i, on, t, dur) { cards[i].lift.go(on ? 1 : 0, t, dur == null ? 0.4 : dur, "overshoot"); return api; },
    tickRow: function (i, n, t) { ticks(i, n, t); return api; },
    // states are additive: each one only adds its own change; pass {dur: 0.001} to snap
    setState: function (name, t, o) {
      o = o || {};
      const dd = o.dur;
      if (name === "in_a") api.in(0, true, t, dd);
      if (name === "in_b") api.in(1, true, t, dd);
      if (name === "in_c") api.in(2, true, t, dd);
      if (name === "lifted_b") api.lift(1, true, t, dd);
      if (name === "ticks_b") ticks(1, 3, t, dd);
      if (name === "ticks_c") ticks(2, 2, t, dd);
      if (name === "circle_c") ringCh.go(1, t, dd == null ? 0.7 : dd, "move");
      if (name === "label_a") labelA.ch.go(1, t, dd == null ? 0.35 : dd, "overshoot");
      if (name === "no_step_c") noStepC.ch.go(1, t, dd == null ? 0.35 : dd, "overshoot");
      return api;
    }
  };
  return api;
};

// ---- the viewer's desk (1920 x 1080), additive states ----
Loom.lesson.viewer_desk = function (ctx, parent, opts) {
  opts = opts || {};
  const h = H(ctx), k = h.k, sv = h.sv;
  const root = sv("g", { transform: "scale(" + h.num(opts.scale || 1) + ")" }, parent);
  const DT = 800;   // desk top
  // wall and desk
  k.rect(root, -20, -20, 1960, DT + 20, { fill: "surface2", crisp: true, r: 0 });
  k.rect(root, -20, DT, 1960, 26, { fill: "surface", r: 0, flat: true });
  k.rect(root, -20, DT + 26, 1960, 1080 - DT - 6, { fill: "field2", r: 0 });
  // plant
  const plant = sv("g", {}, root);
  [-52, -26, 0, 26, 52].forEach(function (a, i) {
    const g = sv("g", { transform: "rotate(" + a + " 140 724)" }, plant);
    k.rect(g, 140 - 22, 724 - 120 + Math.abs(a) * 0.3, 44, 120 - Math.abs(a) * 0.3, { fill: "muted", r: 22, flat: true, sw: 4 });
  });
  k.polygon(plant, [[80, 722], [200, 722], [188, DT + 2], [92, DT + 2]], { fill: "field" });
  // monitor
  k.rect(root, 580, 800 - 54, 80, 54, { fill: "ink", r: 6, flat: true });
  k.rect(root, 480, DT - 24, 280, 28, { fill: "ink", r: 14, flat: true });
  k.rect(root, 260, 110, 720, 480, { fill: "ink", r: 24, flat: true });
  k.rect(root, 284, 134, 672, 420, { fill: "surface2", r: 10, flat: true, sw: 3 });
  // chat window
  const chat = sv("g", { opacity: 0, visibility: "hidden" }, root), chatIn = sv("g", {}, chat);
  k.rect(chatIn, 284, 134, 672, 56, { fill: "field", r: 10, flat: true, sw: 3 });
  [0, 1, 2].forEach(function (i) { k.disc(chatIn, 316 + i * 34, 162, 9, { fill: "muted", flat: true }); });
  k.disc(chatIn, 340, 276, 32, { fill: "field" });
  k.rect(chatIn, 396, 224, 530, 148, { fill: "surface", r: 22, flat: true, sw: 4 });
  sv("rect", { x: 396, y: 224, width: 530, height: 148, rx: 22, fill: "none", stroke: ctx.c("accent"), "stroke-width": 7 }, chatIn);
  h.txt(chatIn, "Great job! Maybe tighten it up a bit.", { role: "body", weight: 700, x: 420, y: 238, w: 482, h: 120, maxLines: 2, valign: "middle" });
  k.rect(chatIn, 306, 478, 628, 54, { fill: "field", r: 14, flat: true, sw: 3 });
  const chatCh = h.chan(function (v) {
    const op = h.clamp(v * 2, 0, 1);
    chat.setAttribute("opacity", h.num(op));
    h.vis(chat, op > 0.001);
    chatIn.setAttribute("transform", "translate(620 300) scale(" + h.num(0.9 + 0.1 * v) + ") translate(-620 -300)");
  }, 0);
  // mug
  const mug = sv("g", {}, root);
  sv("path", { d: "M1334 730 q44 0 44 28 t-44 28", fill: "none", stroke: ctx.c("ink"), "stroke-width": 8, "stroke-linecap": "round" }, mug);
  k.rect(mug, 1238, 706, 98, 94, { fill: "surface", r: 14 });
  k.rect(mug, 1238, 706, 98, 14, { fill: "field2", r: 6, flat: true, sw: 3 });
  // chair, empty
  const chair = sv("g", {}, root);
  k.line(chair, 1745, 930, 1630, 962, { stroke: "ink", sw: 10 });
  k.line(chair, 1745, 930, 1860, 962, { stroke: "ink", sw: 10 });
  k.disc(chair, 1630, 972, 12, { fill: "ink", flat: true });
  k.disc(chair, 1860, 972, 12, { fill: "ink", flat: true });
  k.rect(chair, 1735, 790, 20, 140, { fill: "ink", r: 6, flat: true, sw: 3 });
  k.rect(chair, 1736, 650, 18, 110, { fill: "ink", r: 6, flat: true, sw: 3 });
  k.rect(chair, 1660, 400, 170, 262, { fill: "muted", r: 54 });
  k.rect(chair, 1630, 744, 230, 58, { fill: "muted", r: 26 });
  // sticky note on the monitor bezel
  const sticky = sv("g", { visibility: "hidden" }, root), stickyIn = sv("g", {}, sticky);
  k.rect(stickyIn, 0, 0, 320, 270, { fill: "surface", r: 8 });
  k.rect(stickyIn, 110, -16, 100, 34, { fill: "field2", r: 6, flat: true, sw: 3 });
  h.txt(stickyIn, "Great job! Maybe tighten it up a bit.", { role: "body", weight: 700, x: 24, y: 44, w: 272, h: 200, maxLines: 5, valign: "top" });
  const strike = sv("path", { d: "M10 112 L82 98 L156 124 L228 96 L312 120", fill: "none", stroke: ctx.c("accent"), "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, stickyIn);
  // the "This week" tab above the sticky
  const wk = sv("g", { opacity: 0, visibility: "hidden" }, stickyIn);
  k.rect(wk, 134, -78, 170, 62, { fill: "field", r: 10, flat: true });
  h.txt(wk, "This week", { role: "label", weight: 400, x: 144, y: -69, w: 150, h: 44, align: "center" });
  const stickyCh = h.chan(function (v) {
    const op = h.clamp(v * 2.5, 0, 1);
    sticky.setAttribute("opacity", h.num(op));
    h.vis(sticky, op > 0.001);
    sticky.setAttribute("transform", "translate(930 112) rotate(" + h.num(3 + (1 - v) * -9) + " 160 135) translate(160 135) scale(" + h.num(1 + (1 - v) * 0.4) + ") translate(-160 -135)");
  }, 0);
  const strikeCh = h.chan(function (v) { strike.setAttribute("stroke-dashoffset", h.num(1 - h.clamp(v, 0, 1))); }, 0);
  const wkCh = h.chan(function (v) {
    const op = h.clamp(v * 2, 0, 1);
    wk.setAttribute("opacity", h.num(op));
    h.vis(wk, op > 0.001);
    wk.setAttribute("transform", "translate(0 " + h.num((1 - v) * 20) + ")");
  }, 0);
  // three empty coloured slots beneath the sticky
  const slotRows = [0, 1, 2].map(function (i) {
    const g = sv("g", { opacity: 0, visibility: "hidden" }, root), y = 408 + i * 92, tok = K.SLOT_LIST[i];
    k.rect(g, 930, y, 176, 64, { fill: tok, r: 12, flat: true, sw: 4 });
    h.txt(g, K.SLOT_NAMES[i], { role: "label", weight: 400, color: h.pick(tok), x: 940, y: y + 9, w: 156, h: 46, align: "center" });
    h.dashRect(g, 1126, y, 480, 64, { r: 12, sw: 5, stroke: tok });
    return { g: g, y: y, ch: h.chan(function (v) {
      const op = h.clamp(v * 2, 0, 1);
      g.setAttribute("opacity", h.num(op));
      h.vis(g, op > 0.001);
      g.setAttribute("transform", "translate(" + h.num((1 - v) * -30) + " 0)");
    }, 0) };
  });
  const api = {
    g: root, chat: chat, sticky: sticky, strike: strike, tab: wk, slotRows: slotRows,
    setState: function (name, t, o) {
      const dd = o && o.dur;
      if (name === "chat") chatCh.go(1, t, dd == null ? 0.4 : dd, "overshoot");
      if (name === "sticky") stickyCh.go(1, t, dd == null ? 0.4 : dd, "overshoot");
      if (name === "crossed") strikeCh.go(1, t, dd == null ? 0.5 : dd, "move");
      if (name === "slots") slotRows.forEach(function (r, i) { r.ch.go(1, t + 0.18 * i, dd == null ? 0.4 : dd, "overshoot"); });
      if (name === "this_week") wkCh.go(1, t, dd == null ? 0.35 : dd, "overshoot");
      return api;
    }
  };
  return api;
};
})();
