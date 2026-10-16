Loom.lesson = Loom.lesson || {};

/* wb-prioritise kit: task_card, matrix_board, week_strip. Whiteboard style: rough marker line, ink, muted, one accent, pos for ticks.
 * Every state is its own element (ctx.el), built only when asked (opts.build). Words are m.unmask, strokes are m.draw,
 * a hatch is faded in after its outline (recipe 11c). No weights, no fills, no shadows, no people. */
(function () {
  const L = Loom.lesson;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const PAD = 10;

  function measure(ctx, str, role, size) {
    const r = ctx.kit.fit(str, { role: role, w: 2400, h: 300, maxLines: 1, size: size });
    const s = r.size || size;
    return { w: r.width * size / s, h: r.height * size / s };
  }
  function mkEl(ctx, parent, name, x, y, w, h, kind, exit) {
    const o = { x: x, y: y, w: Math.ceil(w), h: Math.ceil(h), kind: kind || "card", exit: exit || "recede" };
    if (parent) o.parent = parent;
    return ctx.el(name, o);
  }
  function hand(ctx, g, d, o) {
    return ctx.kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
  }
  function rough(ctx, g, x, y, w, h, o) {
    return ctx.kit.sketch(g, "rectangle", [x, y, w, h], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
  }
  function drawDur(ctx, len) { return ctx.style.dur("draw") * clamp(len / 900, 0.3, 1.4); }
  function writeDur(ctx, str) { return ctx.style.dur("draw") * clamp(String(str).length / 14, 0.45, 1.8); }
  function textIn(ctx, g, str, role, size, x, y, w, h, color, align) {
    const t = ctx.kit.text(g, str, { role: role, size: size, x: x, y: y, w: w, h: h, align: align || "left", valign: "middle", maxLines: 1, color: color || "ink" });
    return t;
  }
  function halo(ctx, t) {
    t.setAttribute("stroke", ctx.c("field"));
    t.setAttribute("stroke-width", "7");
    t.setAttribute("stroke-linejoin", "round");
    t.setAttribute("paint-order", "stroke");
  }
  // an open two-stroke hand arrow: element box and local path strings
  function handArrow(x1, y1, x2, y2, bend) {
    const Ln = Math.hypot(x2 - x1, y2 - y1) || 1, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const cx = mx - ((y2 - y1) / Ln) * bend, cy = my + ((x2 - x1) / Ln) * bend;
    const a = Math.atan2(y2 - cy, x2 - cx), hs = 22;
    const h1 = [x2 - hs * Math.cos(a - 0.5), y2 - hs * Math.sin(a - 0.5)];
    const h2 = [x2 - hs * Math.cos(a + 0.5), y2 - hs * Math.sin(a + 0.5)];
    const xs = [x1, cx, x2, h1[0], h2[0]], ys = [y1, cy, y2, h1[1], h2[1]];
    const bx = Math.floor(Math.min.apply(null, xs) - 12), by = Math.floor(Math.min.apply(null, ys) - 12);
    const X = (v) => (v - bx).toFixed(1), Y = (v) => (v - by).toFixed(1);
    return {
      x: bx, y: by, w: Math.ceil(Math.max.apply(null, xs) + 12) - bx, h: Math.ceil(Math.max.apply(null, ys) + 12) - by, len: Ln * 1.1,
      shaft: "M" + X(x1) + " " + Y(y1) + " Q" + X(cx) + " " + Y(cy) + " " + X(x2) + " " + Y(y2),
      head: "M" + X(h1[0]) + " " + Y(h1[1]) + " L" + X(x2) + " " + Y(y2) + " L" + X(h2[0]) + " " + Y(h2[1]),
    };
  }

  /* ------------------------------------------------------------------ task_card
   * anatomy: root element (the whole card, travel THIS) holding named children:
   *   outline (rough rect, m.draw)  words (m.unmask)  urgent (tag, m.unmask)  box (empty tick box, m.draw)
   *   tick (pos hand tick, m.draw)  later (muted tag, m.unmask)
   * opts: key ("reply"|"budget"|"expenses"|"deck"|"new") or text; x, y = card outline top-left in parent coords;
   *   name (root, default "card_"+key); names {outline, words, urgent, box, tick, later};
   *   build (default ["card"]; add "urgent","box","tick","later"); boxSide "left"|"right"; laterBox token (default muted); w min width. */
  const CARD_TEXT = { deck: "Deck redesign", expenses: "Expenses", reply: "Client reply", budget: "Budget report", "new": "New analysis by Friday" };
  const CH = 84, BOX = 44, INSET = 20, TAGH = 54;

  function cardGeom(ctx, o) {
    const text = o.text || CARD_TEXT[o.key] || String(o.key);
    const tw = measure(ctx, text, "lead", 38);
    const cw = Math.ceil(Math.max(o.w || 0, 240, tw.w + 2 * INSET));
    const uw = Math.ceil(measure(ctx, "urgent", "label", 28).w + 40);
    const lw = Math.ceil(measure(ctx, "later", "label", 28).w + 40);
    const side = o.boxSide || "left";
    const boxX = side === "left" ? -(BOX + 20) : cw + 20;
    const tagX = cw + 16 + (side === "right" && (o.build || []).indexOf("box") >= 0 ? BOX + 20 : 0);
    const R = {
      text: text, tw: tw, w: cw, h: CH,
      card: { x: 0, y: 0, w: cw, h: CH },
      words: { x: (cw - Math.ceil(tw.w) - 8) / 2, y: (CH - Math.ceil(tw.h) - 4) / 2, w: Math.ceil(tw.w) + 8, h: Math.ceil(tw.h) + 4 },
      box: { x: boxX, y: (CH - BOX) / 2, w: BOX, h: BOX },
      tick: { x: boxX + 6, y: (CH - BOX) / 2 - 8, w: BOX + 10, h: BOX + 8 },
      urgent: { x: tagX, y: (CH - TAGH) / 2, w: uw, h: TAGH },
      later: { x: tagX, y: (CH - TAGH) / 2, w: lw, h: TAGH },
    };
    return R;
  }
  function union(rs) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    rs.forEach((r) => { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function drawTag(ctx, g, r, word, wordTok, boxTok) {
    rough(ctx, g, PAD, PAD, r.w, r.h, { stroke: boxTok });
    textIn(ctx, g, word, "label", 28, PAD + 10, PAD + 8, r.w - 20, r.h - 16, wordTok, "center");
  }

  Loom.lesson.task_card = function (ctx, parent, opts) {
    opts = opts || {};
    if (opts.w != null && !opts.__sub) {   // the kit preview cell (w, h given): show a few cards in the cell
      const P = [["reply", 100, 30, ["card", "urgent", "box", "tick"], "left", null], ["deck", 100, 150, ["card", "box", "later"], "left", "accent"], ["new", 100, 270, ["card", "urgent"], "left", null], ["budget", 520, 30, ["card", "box", "tick", "later"], "right", null]];
      let first = null;
      P.forEach((p) => { const h = Loom.lesson.task_card(ctx, parent, { key: p[0], x: p[1], y: p[2], build: p[3], boxSide: p[4], laterBox: p[5] || undefined, __sub: true }); first = first || h; });
      return first;
    }
    const m = ctx.m, key = opts.key || "reply";
    const build = opts.build || ["card"];
    const G = cardGeom(ctx, Object.assign({}, opts, { build: build }));
    const base = opts.name || ("card_" + key);
    const N = Object.assign({ outline: base + "_outline", words: base + "_words", urgent: base + "_urgent", box: base + "_box", tick: base + "_tick", later: base + "_later" }, opts.names || {});
    const has = (s) => build.indexOf(s) >= 0;
    const cardBox = { x: G.card.x - PAD, y: G.card.y - PAD, w: G.card.w + 2 * PAD, h: G.card.h + 2 * PAD };
    const parts = [cardBox];
    const tagBox = (r) => ({ x: r.x - PAD, y: r.y - PAD, w: r.w + 2 * PAD, h: r.h + 2 * PAD });
    if (has("urgent")) parts.push(tagBox(G.urgent));
    if (has("later")) parts.push(tagBox(G.later));
    if (has("box")) parts.push(tagBox(G.box));
    if (has("tick")) parts.push(tagBox(G.tick));
    const U = union(parts);
    const X0 = opts.x || 0, Y0 = opts.y || 0;
    const root = mkEl(ctx, parent, base, X0 + U.x, Y0 + U.y, U.w, U.h, "card", opts.exit || "recede");
    const H = { E: root, root: root, w: G.w, h: G.h, text: G.text, geom: G, states: ["card", "urgent", "box", "tick", "later"] };
    // child element at a card-relative rect (padded by PAD), local to the root
    const child = (name, r, kind, exit) => mkEl(ctx, root.inner, name, r.x - PAD - U.x, r.y - PAD - U.y, r.w + 2 * PAD, r.h + 2 * PAD, kind, exit);

    H.outline = child(N.outline, G.card, "card");
    rough(ctx, H.outline.inner, PAD, PAD, G.card.w, G.card.h);
    H.card = H.outline;
    // words: its own box, sized to its text
    H.words = mkEl(ctx, root.inner, N.words, G.words.x - U.x, G.words.y - U.y, G.words.w, G.words.h, "text", "wipe");
    textIn(ctx, H.words.inner, G.text, "lead", 38, 0, 0, G.words.w, G.words.h, "ink", "center");
    if (has("urgent")) {
      H.urgent = child(N.urgent, G.urgent, "label");
      drawTag(ctx, H.urgent.inner, G.urgent, "urgent", "ink", "ink");
    }
    if (has("box")) {
      H.box = child(N.box, G.box, "icon");
      rough(ctx, H.box.inner, PAD, PAD, BOX, BOX);
    }
    if (has("tick")) {
      H.tick = child(N.tick, G.tick, "icon");
      const bx = PAD + 6, by = PAD + 8;   // box origin inside the tick element
      hand(ctx, H.tick.inner, "M" + (bx + 4) + " " + (by + 26) + " L" + (bx + 17) + " " + (by + 40) + " L" + (bx + 48) + " " + (by + 2), { stroke: "pos" });
    }
    if (has("later")) {
      H.later = child(N.later, G.later, "label");
      drawTag(ctx, H.later.inner, G.later, "later", "muted", opts.laterBox || "muted");
    }
    // where the card sits and where its parts land, in the parent's coordinates
    H.at = {
      card: { x: X0, y: Y0, w: G.w, h: G.h },
      box: { x: X0 + G.box.x, y: Y0 + G.box.y, w: BOX, h: BOX },
      tag: { x: X0 + G.urgent.x, y: Y0 + G.urgent.y, w: G.urgent.w, h: TAGH },
    };
    // m.travel(root, t, H.pos(X, Y)) puts the CARD outline's top-left at (X, Y)
    H.pos = (X, Y) => ({ x: X + U.x, y: Y + U.y });
    H.setState = function (name, t) {
      if (name === "card") { m.draw(H.outline, t, { dur: drawDur(ctx, 2 * (G.w + G.h)) }); m.unmask(H.words, t + 0.35, { dir: "ltr", dur: writeDur(ctx, G.text) }); }
      else if (name === "urgent" && H.urgent) m.unmask(H.urgent, t, { dir: "ltr", dur: 0.4 });
      else if (name === "later" && H.later) m.unmask(H.later, t, { dir: "ltr", dur: 0.4 });
      else if (name === "box" && H.box) m.draw(H.box, t, { dur: 0.3 });
      else if (name === "tick" && H.tick) m.draw(H.tick, t, { dur: 0.3 });
    };
    return H;
  };
  L.task_card.text = CARD_TEXT;
  L.task_card.geom = function (ctx, o) { return cardGeom(ctx, o); };
  // one element holding several urgent tags (b02's urgent_tags): cards [{key|text, x, y (card top-left), w?}]
  L.task_card.urgentTags = function (ctx, parent, opts) {
    opts = opts || {};
    const gs = (opts.cards || []).map((c) => ({ c: c, g: cardGeom(ctx, c) }));
    const rs = gs.map((q) => ({ x: q.c.x + q.g.urgent.x - PAD, y: q.c.y + q.g.urgent.y - PAD, w: q.g.urgent.w + 2 * PAD, h: q.g.urgent.h + 2 * PAD }));
    const U = union(rs);
    const E = mkEl(ctx, parent, opts.name || "urgent_tags", U.x, U.y, U.w, U.h, "label", "recede");
    gs.forEach((q) => {
      rough(ctx, E.inner, q.c.x + q.g.urgent.x - U.x, q.c.y + q.g.urgent.y - U.y, q.g.urgent.w, q.g.urgent.h);
      textIn(ctx, E.inner, "urgent", "label", 28, q.c.x + q.g.urgent.x - U.x + 10, q.c.y + q.g.urgent.y - U.y + 8, q.g.urgent.w - 20, q.g.urgent.h - 16, "ink", "center");
    });
    return { E: E, setState: function (n, t) { if (n === "urgent") ctx.m.unmask(E, t, { dir: "ltr", dur: 0.6 }); } };
  };

  /* ------------------------------------------------------------------ matrix_board
   * station coordinates (opts.ox, opts.oy shift everything, default 0). Elements, each built only if in opts.build
   * (default all): axis_impact axis_effort divider_v divider_h zone_quick zone_major zone_fill zone_thankless
   * move_quick move_major move_fill move_thankless. Groups: "axes", "dividers", "zones", "moves".
   * opts.colors {quick, major, fill, thankless}: "ink" (default) or "accent". opts.names overrides element names. */
  const MX = {
    slots: { TL: { x: 250, y: 260 }, TR: { x: 745, y: 260 }, BL: { x: 250, y: 610 }, BR: { x: 745, y: 610 }, TR2: { x: 745, y: 380 } },
    zones: {
      quick: { text: "Quick wins", move: "Do first", right: 685, top: 170 },
      major: { text: "Major projects", move: "Block time", right: 1180, top: 170 },
      fill: { text: "Fill-ins", move: "Batch", right: 685, top: 515 },
      thankless: { text: "Thankless tasks", move: "Decline or park", right: 1180, top: 515 },
    },
    question: { impact: { x: 120, y: 90, w: 300, h: 80 }, effort: { x: 1000, y: 862, w: 200, h: 66 } },
  };
  Loom.lesson.matrix_board = function (ctx, parent, opts) {
    opts = opts || {};
    if (opts.w != null && !opts.__sub) {   // the kit preview cell: draw the whole board at half size
      const g = Loom.svg("g", { transform: "translate(-70 -50) scale(0.46)" }, parent);
      const S = MX.slots, tc = Loom.lesson.task_card;
      tc(ctx, g, { key: "reply", x: S.TL.x, y: S.TL.y, build: ["card", "box", "tick"], boxSide: "right", __sub: true });
      tc(ctx, g, { key: "budget", x: S.TR.x, y: S.TR.y, build: ["card"], __sub: true });
      tc(ctx, g, { key: "new", x: S.TR2.x, y: S.TR2.y, build: ["card"], __sub: true });
      tc(ctx, g, { key: "expenses", x: S.BL.x, y: S.BL.y, build: ["card"], __sub: true });
      tc(ctx, g, { key: "deck", x: S.BR.x, y: S.BR.y, build: ["card", "later"], laterBox: "accent", __sub: true });
      return Loom.lesson.matrix_board(ctx, g, { __sub: true });
    }
    const m = ctx.m, ox = opts.ox || 0, oy = opts.oy || 0;
    let build = opts.build || ["all"];
    const expand = { all: ["axes", "dividers", "zones", "moves"], axes: ["axis_impact", "axis_effort"], dividers: ["divider_v", "divider_h"],
      zones: ["zone_quick", "zone_major", "zone_fill", "zone_thankless"], moves: ["move_quick", "move_major", "move_fill", "move_thankless"] };
    let flat = [];
    const add = (s) => { if (expand[s]) expand[s].forEach(add); else flat.push(s); };
    build.forEach(add);
    const has = (s) => flat.indexOf(s) >= 0;
    const N = (k) => (opts.names && opts.names[k]) || k;
    const H = { slots: {}, states: ["axes", "dividers", "zones", "moves"] };
    Object.keys(MX.slots).forEach((k) => { H.slots[k] = { x: MX.slots[k].x + ox, y: MX.slots[k].y + oy }; });

    const axis = (key, x1, y1, x2, y2, bend) => {
      if (!has(key)) return;
      const A = handArrow(x1 + ox, y1 + oy, x2 + ox, y2 + oy, bend);
      const E = mkEl(ctx, parent, N(key), A.x, A.y, A.w, A.h, "connector", "recede");
      hand(ctx, E.inner, A.shaft); hand(ctx, E.inner, A.head);
      E.len = A.len; H[key] = E;
    };
    axis("axis_impact", 200, 860, 200, 170, 6);
    axis("axis_effort", 200, 860, 1190, 860, -6);

    const divider = (key, d, x, y, w, h) => {
      if (!has(key)) return;
      const E = mkEl(ctx, parent, N(key), x + ox, y + oy, w, h, "connector", "recede");
      hand(ctx, E.inner, d, { stroke: "muted" });
      H[key] = E;
    };
    divider("divider_v", "M" + (PAD + 4) + " " + (PAD) + " Q" + (PAD + 8) + " 340 " + (PAD + 4) + " 668", 681, 172, 30, 688);
    divider("divider_h", "M" + PAD + " " + (PAD + 4) + " Q490 " + (PAD) + " 968 " + (PAD + 4), 210, 501, 988, 30);

    Object.keys(MX.zones).forEach((zk) => {
      const Z = MX.zones[zk];
      const nm = measure(ctx, Z.text, "title", 72), mv = measure(ctx, Z.move, "label", 30);
      const nw = Math.ceil(nm.w) + 24, nh = Math.ceil(nm.h) + 6;
      const mw = Math.ceil(mv.w) + 16, mh = Math.ceil(mv.h) + 4;
      const nx = Z.right - Math.ceil(nm.w), ny = Z.top;
      if (has("zone_" + zk)) {
        const E = mkEl(ctx, parent, N("zone_" + zk), nx + ox, ny + oy, nw, nh, "text", "wipe");
        const accent = (opts.colors && opts.colors[zk]) === "accent";
        // two copies of the words, one ink and one accent; recolor() swaps which is seen
        const a = textIn(ctx, E.inner, Z.text, "title", 72, 0, 0, nw, nh, "ink", "left");
        const b = textIn(ctx, E.inner, Z.text, "title", 72, 0, 0, nw, nh, "accent", "left");
        a.setAttribute("data-tone", "ink"); b.setAttribute("data-tone", "accent");
        (accent ? a : b).setAttribute("opacity", "0");
        H["zone_" + zk] = E;
      }
      if (has("move_" + zk)) {
        const E = mkEl(ctx, parent, N("move_" + zk), Z.right - Math.ceil(mv.w) + ox, ny + nh - 18 + oy, mw, mh, "text", "wipe");
        textIn(ctx, E.inner, Z.move, "label", 30, 0, 0, mw, mh, "muted", "left");
        H["move_" + zk] = E;
      }
    });
    // swap a zone name's colour at time t ("ink" or "accent"); E is the zone element (also a held one)
    H.recolor = function (zk, tone, t) { L.matrix_board.recolor(ctx, H["zone_" + zk], tone, t); };
    H.setState = function (name, t) {
      if (name === "axes") { ["axis_impact", "axis_effort"].forEach((k, i) => H[k] && m.draw(H[k], t + i * 0.5, { dur: drawDur(ctx, H[k].len) })); }
      else if (name === "dividers") { ["divider_v", "divider_h"].forEach((k, i) => H[k] && m.draw(H[k], t + i * 0.3, { dur: drawDur(ctx, 700) })); }
      else if (name === "zones") { ["quick", "major", "fill", "thankless"].forEach((k, i) => H["zone_" + k] && m.unmask(H["zone_" + k], t + i * 0.3, { dir: "ltr", dur: 0.6 })); }
      else if (name === "moves") { ["quick", "major", "fill", "thankless"].forEach((k, i) => H["move_" + k] && m.unmask(H["move_" + k], t + i * 0.3, { dir: "ltr", dur: 0.4 })); }
    };
    return H;
  };
  L.matrix_board.geom = MX;
  L.matrix_board.recolor = function (ctx, E, tone, t) {
    if (!E || !E.inner || !Loom.tl || !Loom.tl.set) return;
    ["ink", "accent"].forEach((k) => {
      const n = E.inner.querySelector('[data-tone="' + k + '"]');
      if (n) Loom.tl.set(n, { opacity: k === tone ? 1 : 0 }, t);
    });
  };
  // the two question labels b04 writes ('Impact?' and 'Effort?'): Caveat title, an element each, ink or accent
  L.matrix_board.question = function (ctx, parent, opts) {
    opts = opts || {};
    const which = opts.which || "impact", Q = MX.question[which];
    const str = opts.text || (which === "impact" ? "Impact?" : "Effort?");
    const E = mkEl(ctx, parent, opts.name || ("q_" + which), Q.x + (opts.ox || 0), Q.y + (opts.oy || 0), Q.w, Q.h, "text", "wipe");
    textIn(ctx, E.inner, str, "title", 72, 0, 0, Q.w, Q.h, opts.color || "ink", "left");
    return { E: E, rect: Q };
  };

  /* ------------------------------------------------------------------ week_strip
   * right column, origin (opts.x, opts.y) default (1270, 150), 520 wide, 180 tall. Elements (opts.build, default all):
   *   week_days (names, m.unmask)  week_strip (cells, m.draw)  budget_scraps (3 muted boxes + 'budget', m.unmask)
   *   scrap_strikes (m.draw)  budget_block (accent outline, m.draw) budget_hatch (m.reveal after) budget_label (m.unmask)
   *   second_block, second_hatch, second_label (over Thu and Fri; opts.secondColor default "ink"). */
  Loom.lesson.week_strip = function (ctx, parent, opts) {
    opts = opts || {};
    const pv = opts.w != null && !opts.__sub;   // the kit preview cell: draw it at the cell's corner
    const m = ctx.m, X = opts.x == null ? (pv ? 40 : 1270) : opts.x, Y = opts.y == null ? (pv ? 30 : 150) : opts.y;
    const build = opts.build || ["all"];
    const all = ["days", "strip", "scraps", "strikes", "budget", "second"];
    const flat = build.indexOf("all") >= 0 ? all : build;
    const has = (s) => flat.indexOf(s) >= 0;
    const N = (k) => (opts.names && opts.names[k]) || k;
    const CW = 104, TOP = 46, CHT = 134;
    const H = { states: all, cell: (i) => ({ x: X + i * CW, y: Y + TOP, w: CW, h: CHT }) };
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    if (has("days")) {
      const E = mkEl(ctx, parent, N("week_days"), X, Y, 5 * CW, 44, "text", "wipe");
      days.forEach((d, i) => textIn(ctx, E.inner, d, "label", 28, i * CW + 4, 2, CW - 8, 38, "ink", "center"));
      H.days = E;
    }
    if (has("strip")) {
      const E = mkEl(ctx, parent, N("week_strip"), X - PAD, Y + TOP - PAD, 5 * CW + 2 * PAD, CHT + 2 * PAD, "card", "recede");
      rough(ctx, E.inner, PAD, PAD, 5 * CW, CHT);
      for (let i = 1; i < 5; i++) hand(ctx, E.inner, "M" + (PAD + i * CW) + " " + PAD + " L" + (PAD + i * CW + 1) + " " + (PAD + CHT));
      H.strip = E;
    }
    const sw = Math.ceil(measure(ctx, "budget", "label", 28).w + 26), sh = 50;
    const scrapAt = [{ c: 0, dx: 2, dy: 44 }, { c: 3, dx: 1, dy: 2 }, { c: 4, dx: 2, dy: 80 }].map((s) => ({ x: s.c * CW + s.dx, y: TOP + s.dy }));
    const lo = Math.min.apply(null, scrapAt.map((s) => s.y)), hi = Math.max.apply(null, scrapAt.map((s) => s.y));
    if (has("scraps")) {
      const E = mkEl(ctx, parent, N("budget_scraps"), X + scrapAt[0].x - PAD, Y + lo - PAD, scrapAt[2].x + sw - scrapAt[0].x + 2 * PAD, hi - lo + sh + 2 * PAD, "card", "recede");
      scrapAt.forEach((s) => {
        const lx = s.x - scrapAt[0].x + PAD, ly = s.y - lo + PAD;
        rough(ctx, E.inner, lx, ly, sw, sh, { stroke: "muted" });
        textIn(ctx, E.inner, "budget", "label", 28, lx + 2, ly + 2, sw - 4, sh - 4, "muted", "center");
      });
      H.scraps = E;
    }
    if (has("strikes")) {
      const E = mkEl(ctx, parent, N("scrap_strikes"), X + scrapAt[0].x - PAD - 4, Y + lo - PAD - 4, scrapAt[2].x + sw - scrapAt[0].x + 2 * PAD + 8, hi - lo + sh + 2 * PAD + 8, "connector", "recede");
      scrapAt.forEach((s) => {
        const lx = s.x - scrapAt[0].x + PAD + 4, ly = s.y - lo + PAD + 4;
        hand(ctx, E.inner, "M" + (lx - 4) + " " + (ly + sh * 0.7) + " L" + (lx + sw + 4) + " " + (ly + sh * 0.3));
      });
      H.strikes = E;
    }
    const block = (key, c0, label, tone) => {
      const bx = c0 * CW + 6, by = TOP + 8, bw = 2 * CW - 12, bh = CHT - 16;
      const mk = (nm, fill) => {
        const E = mkEl(ctx, parent, N(nm), X + bx - PAD, Y + by - PAD, bw + 2 * PAD, bh + 2 * PAD, "card", "recede");
        rough(ctx, E.inner, PAD, PAD, bw, bh, { stroke: tone, fill: fill });
        return E;
      };
      H[key] = mk(key + "_block", "none");
      H[key + "_hatch"] = mk(key + "_hatch", tone === "ink" ? "muted" : tone);
      const lw = bw - 12, lh = bh - 6;
      const E = mkEl(ctx, parent, N(key + "_label"), X + bx + 6, Y + by + 3, lw, lh, "text", "wipe");
      const t = ctx.kit.text(E.inner, label, { role: "lead", size: 38, x: 0, y: 0, w: lw, h: lh, align: "center", valign: "middle", maxLines: 2, color: "ink" });
      halo(ctx, t);
      H[key + "_label"] = E;
    };
    if (has("budget")) { block("budget", 1, "Budget report", opts.budgetColor || "accent"); H.budget_block = H.budget; }
    if (has("second")) { block("second", 3, "New analysis", opts.secondColor || "ink"); H.second_block = H.second; }
    H.setState = function (name, t) {
      if (name === "strip") { H.days && m.unmask(H.days, t, { dir: "ltr", dur: 0.5 }); H.strip && m.draw(H.strip, t + 0.1, { dur: drawDur(ctx, 1300) }); }
      else if (name === "scraps") H.scraps && m.unmask(H.scraps, t, { dir: "ltr", dur: 0.9 });
      else if (name === "strikes") H.strikes && m.draw(H.strikes, t, { dur: 0.6 });
      else if (name === "budget" || name === "second") {
        const d = drawDur(ctx, 600);
        H[name] && m.draw(H[name], t, { dur: d });
        H[name + "_hatch"] && m.reveal(H[name + "_hatch"], t + d, { dy: 0 });
        H[name + "_label"] && m.unmask(H[name + "_label"], t + d, { dir: "ltr", dur: 0.5 });
      }
    };
    return H;
  };
})();
