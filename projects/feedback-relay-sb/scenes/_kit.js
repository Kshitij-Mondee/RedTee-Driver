Loom.lesson = Loom.lesson || {};

/* Kit for the feedback lesson (story-cartoon). Parts: meeting_room, wall_calendar, natural_bubble, comment_board, comment_tiles.
 * A part draws into `parent` at natural size (opts.w / opts.h / opts.scale scale it, opts.x / opts.y offset it) and returns a handle.
 * Nothing here reveals itself: the beat decides when. State changes are discrete swaps (Loom.set) or short drives, pure in time. */
(function () {
  const sv = (tag, attrs, p) => Loom.svg(tag, attrs, p);

  function begin(ctx, parent, NW, NH, opts, def) {
    opts = opts || {};
    const nm = opts.name || def;
    const sc = opts.scale || (opts.w ? opts.w / NW : opts.h ? opts.h / NH : 1);
    const root = sv("g", { transform: "translate(" + (opts.x || 0) + " " + (opts.y || 0) + ") scale(" + sc + ")" }, parent);
    return { opts, nm, root, sc };
  }
  const meta = (ctx, name) => ({ kind: "reveal", beat: ctx.beat && ctx.beat.id, name, content: true });
  const D = (ctx, key, fb) => { try { const v = ctx.style.dur(key); return typeof v === "number" && v > 0 ? v : fb; } catch (e) { return fb; } };
  const setOp = (g, v, t) => Loom.set(g, { opacity: v }, t);
  // a set of groups of which exactly one shows; returns (key, t) => swap
  function axis(map, init) {
    Object.keys(map).forEach((k) => { map[k].setAttribute("opacity", k === init ? 1 : 0); setOp(map[k], k === init ? 1 : 0, 0); });
    return (key, t) => Object.keys(map).forEach((k) => setOp(map[k], k === key ? 1 : 0, t));
  }
  function dashRect(p, x, y, w, h, tone, sw) {
    return sv("rect", { x, y, width: w, height: h, rx: 10, fill: "none", stroke: tone, "stroke-width": sw || 4, "stroke-dasharray": "16 11", "stroke-linecap": "round" }, p);
  }
  function stamp(ctx, g, cx, cy, w, h, text, tone, rot) {
    const kit = ctx.kit;
    const s = sv("g", { transform: "translate(" + cx + " " + cy + ") rotate(" + (rot == null ? -4 : rot) + ")" }, g);
    kit.rect(s, -w / 2, -h / 2, w, h, { fill: "surface", r: 8, flat: true, stroke: tone === "muted" ? "muted" : "ink" });
    kit.text(s, text, { role: "label", x: -w / 2 + 8, y: -h / 2, w: w - 16, h: h, maxLines: 1, align: "center", valign: "middle", color: tone === "muted" ? "muted" : "ink" });
    return s;
  }
  // a left-to-right wipe of a group through a clip rect (ids are unique per part name)
  function wiper(ctx, g, id, x, y, w, h, nm) {
    const cp = sv("clipPath", { id }, g.parentNode || g);
    const r = sv("rect", { x, y, width: w, height: h }, cp);
    g.setAttribute("clip-path", "url(#" + id + ")");
    return {
      rect: r,
      run: (t, dur) => {
        setOp(g, 1, t);
        Loom.drive((e) => r.setAttribute("width", (w * Math.max(0, Math.min(1, e))).toFixed(1)), t, dur, "editorial", meta(ctx, nm));
      },
    };
  }

  /* ---------------------------------------------------------------- wall_calendar (220 x 260)
   * anatomy: paper, accent3 header band, two rings on top, muted pins, two pages stacked (This week on top, Next week under).
   * the top page flips over the ring: stepped, four steps. states: this_week, next_week. */
  Loom.lesson.wall_calendar = function (ctx, parent, opts) {
    const kit = ctx.kit;
    const B = begin(ctx, parent, 220, 260, opts, "wall_calendar");
    const root = B.root, W = 220;
    kit.rect(root, 0, 14, W, 246, { fill: "surface", r: 10 });
    kit.rect(root, 0, 14, W, 66, { fill: "accent3", r: 10, crisp: true });
    kit.rect(root, 0, 50, W, 30, { fill: "accent3", r: 0, crisp: true });
    kit.line(root, 0, 80, W, 80, { stroke: "ink", sw: 4 });
    [60, 160].forEach((x) => { sv("ellipse", { cx: x, cy: 16, rx: 9, ry: 16, fill: "none", stroke: ctx.c("ink"), "stroke-width": 5 }, root); });
    kit.disc(root, 18, 36, 7, { fill: "muted", flat: true });
    kit.disc(root, 202, 36, 7, { fill: "muted", flat: true });
    const mkPage = (label) => {
      const g = sv("g", {}, root);
      kit.rect(g, 10, 88, 200, 160, { fill: "surface", r: 6, flat: true, stroke: "ink" });
      kit.text(g, label, { role: "label", x: 20, y: 98, w: 180, h: 60, maxLines: 1, align: "center", valign: "middle", color: "ink", weight: 400 });
      [178, 204, 230].forEach((y) => kit.line(g, 28, y, 192, y, { stroke: "muted", sw: 2 }));
      return g;
    };
    const pageB = mkPage("Next week");
    const pageA = mkPage("This week");
    const steps = [1, 0.62, 0.22, 0];
    const apply = (s) => {
      pageA.setAttribute("transform", "translate(0 88) scale(1 " + Math.max(s, 0.001) + ") translate(0 -88)");
      pageA.setAttribute("opacity", s <= 0.01 ? 0 : 1);
    };
    const init = (B.opts.state || "this_week") === "next_week" ? 0 : 1;
    apply(init);
    const flip = (t, dir) => {
      const seq = dir === "back" ? steps.slice().reverse() : steps;
      Loom.drive((e) => apply(seq[Math.min(3, Math.floor(Math.max(0, e) * 4))] * (e >= 1 ? 1 : 1) * (e >= 1 ? (dir === "back" ? 1 : 0) / Math.max(seq[3], 1e-9) * seq[3] : 1)), t, D(ctx, "move", 0.34), "linear", meta(ctx, B.nm + "_flip"));
    };
    return {
      g: root, pageA, pageB, natural: [220, 260],
      flip: (t) => flip(t, "fwd"),
      setState: (name, t) => flip(t, name === "this_week" ? "back" : "fwd"),
    };
  };

  /* ---------------------------------------------------------------- natural_bubble (520 x 200)
   * anatomy: spoken = chat bubble (surface, ink outline, tail down-right toward Maya) with a muted heart and 'Natural presenter';
   * held = only a muted heart centred; small_grey = the bubble at 40 %, grey, no tail. All three exist as groups; a state shows one. */
  Loom.lesson.natural_bubble = function (ctx, parent, opts) {
    const kit = ctx.kit;
    const B = begin(ctx, parent, 520, 200, opts, "natural_bubble");
    const root = B.root;
    const heart = (g, cx, cy, size, fill, stroke) => {
      const k = size / 40;
      return sv("path", { d: "M0,14 C-22,-2 -22,-22 -8,-22 C-2,-22 0,-17 0,-14 C0,-17 2,-22 8,-22 C22,-22 22,-2 0,14 Z", transform: "translate(" + cx + " " + cy + ") scale(" + k + ")", fill: ctx.c(fill), stroke: ctx.c(stroke), "stroke-width": 3 / k, "stroke-linejoin": "round" }, g);
    };
    const spoken = sv("g", {}, root);
    sv("path", { d: "M380,150 L440,196 L452,150 Z", fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, spoken);
    kit.rect(spoken, 0, 0, 520, 160, { fill: "surface", r: 40, flat: true });
    kit.rect(spoken, 384, 150, 62, 14, { fill: "surface", r: 0, crisp: true });
    const hs = heart(spoken, 66, 80, 56, "muted", "ink");
    kit.text(spoken, "Natural presenter", { role: "body", x: 112, y: 20, w: 380, h: 120, maxLines: 2, align: "left", valign: "middle", color: "ink" });
    const held = sv("g", {}, root);
    const hh = heart(held, 260, 100, 96, "muted", "ink");
    const grey = sv("g", { transform: "translate(260 100) scale(0.4) translate(-260 -80)" }, root);
    kit.rect(grey, 0, 0, 520, 160, { fill: "field2", r: 40, flat: true, stroke: "muted" });
    heart(grey, 66, 80, 56, "muted", "muted");
    kit.text(grey, "Natural presenter", { role: "body", x: 112, y: 20, w: 380, h: 120, maxLines: 2, align: "left", valign: "middle", color: "muted" });
    const sw = axis({ spoken, held, small_grey: grey }, B.opts.state || "spoken");
    return { g: root, spoken, held, small_grey: grey, heart: hs, heartHeld: hh, natural: [520, 200], setState: (name, t) => sw(name, t) };
  };

  /* ---------------------------------------------------------------- comment_tiles (1500 x 220)
   * three tiles 440 x 170 at x 0 / 500 / 1000 (the board slots' pitch), each with a tilted stamp at its lower right.
   * per tile states: empty, muted, accent. whole-part state joined: three tiles edge to edge in one chat bubble, stamps underneath.
   * opts.parents = [g0, g1, g2] builds each single tile (with its stamp) into its own group at local (0,0) so the beat can wrap it in an element. */
  Loom.lesson.comment_tiles = function (ctx, parent, opts) {
    const kit = ctx.kit;
    const B = begin(ctx, parent, 1500, 220, opts, "comment_tiles");
    const root = B.root, nm = B.nm, o = B.opts;
    const TEXT = o.texts || ["Read the slides aloud", "Room looked at phones", "Open with one decision"];
    const STAMP = o.stamps || ["Observed action", "Effect", "Next step"];
    const tilesG = sv("g", {}, root);
    const tiles = [];
    for (let i = 0; i < 3; i++) {
      const tp = o.parents && o.parents[i];
      const g = tp ? sv("g", {}, tp) : sv("g", { transform: "translate(" + i * 500 + " 0)" }, tilesG);
      const empty = sv("g", {}, g); dashRect(empty, 0, 0, 440, 170, ctx.c("muted"), 4);
      const muted = sv("g", {}, g);
      kit.rect(muted, 0, 0, 440, 170, { fill: "field2", r: 10 });
      kit.text(muted, TEXT[i], { role: "body", x: 24, y: 12, w: 392, h: 120, maxLines: 2, align: "left", valign: "middle", color: "ink" });
      const accent = sv("g", {}, g);
      kit.rect(accent, 0, 0, 440, 170, { fill: "accent", r: 10 });
      kit.text(accent, TEXT[i], { role: "body", x: 24, y: 12, w: 392, h: 120, maxLines: 2, align: "left", valign: "middle", color: "field" });
      const stInk = sv("g", {}, g); stamp(ctx, stInk, 300, 176, 230, 52, STAMP[i], "ink", -4);
      const stMuted = sv("g", {}, g); stamp(ctx, stMuted, 300, 176, 230, 52, STAMP[i], "muted", -4);
      const wipe = wiper(ctx, accent, nm + "_wipe" + i, 0, 0, 440, 170, nm + "_wipe" + i);
      const T = { g, empty, muted, accent, stampInk: stInk, stampMuted: stMuted, wipe };
      T.set = (st, t) => {
        setOp(empty, st === "empty" ? 1 : 0, t);
        setOp(muted, st === "muted" || st === "accent" ? 1 : 0, t);
        setOp(accent, st === "accent" ? 1 : 0, t);
        setOp(stInk, st === "empty" ? 0 : 1, t);
        setOp(stMuted, st === "empty" ? 1 : 0, t);
      };
      tiles.push(T);
    }
    // joined: one chat bubble, tiles locked edge to edge (inner 1320 wide), stamps underneath in order
    const jG = sv("g", {}, root);
    sv("path", { d: "M1410,60 L1480,98 L1410,112 Z", fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, jG);
    const outline = kit.rect(jG, 20, 0, 1400, 150, { fill: "surface", r: 36, flat: true });
    kit.rect(jG, 1404, 64, 20, 44, { fill: "surface", r: 0, crisp: true });
    const jt = [];
    for (let i = 0; i < 3; i++) {
      const x = 60 + i * 440;
      kit.rect(jG, x, 10, 440, 130, { fill: "field2", r: 0, crisp: true });
      kit.text(jG, TEXT[i], { role: "body", x: x + 20, y: 10, w: 400, h: 130, maxLines: 2, align: "center", valign: "middle", color: "ink" });
      const ag = sv("g", {}, jG);
      kit.rect(ag, x, 10, 440, 130, { fill: "accent", r: 0, crisp: true });
      kit.text(ag, TEXT[i], { role: "body", x: x + 20, y: 10, w: 400, h: 130, maxLines: 2, align: "center", valign: "middle", color: "field" });
      ag.setAttribute("opacity", 0);
      jt.push({ accent: ag, wipe: wiper(ctx, ag, nm + "_jwipe" + i, x, 10, 440, 130, nm + "_jwipe" + i) });
      if (i > 0) kit.line(jG, x, 24, x, 126, { stroke: "muted", sw: 2, crisp: true });
    }
    const jStamps = [];
    for (let i = 0; i < 3; i++) jStamps.push(stamp(ctx, jG, 60 + i * 440 + 220, 188, 230, 52, STAMP[i], "ink", i === 1 ? 3 : -3));
    const st0 = o.states || (o.state ? [o.state, o.state, o.state] : ["muted", "muted", "muted"]);
    const joinedInit = st0[0] === "joined";
    tiles.forEach((T, i) => { const s = joinedInit ? "muted" : st0[i]; T.set(s, 0); if (s === "accent") T.accent.removeAttribute("clip-path"); });
    tilesG.setAttribute("opacity", joinedInit ? 0 : 1); setOp(tilesG, joinedInit ? 0 : 1, 0);
    jG.setAttribute("opacity", joinedInit ? 1 : 0); setOp(jG, joinedInit ? 1 : 0, 0);
    const setState = (name, t, oo) => {
      if (name === "joined") { setOp(tilesG, 0, t); setOp(jG, 1, t); return; }
      setOp(tilesG, 1, t); setOp(jG, 0, t);
      const idx = oo && oo.tile != null ? [oo.tile] : name === "accent" ? [0] : [0, 1, 2];
      idx.forEach((i) => tiles[i].set(name, t));
    };
    return {
      g: root, tiles, joined: jG, joinedOutline: outline, joinedTiles: jt, joinedStamps: jStamps, natural: [1500, 220],
      setState, setTile: (i, st, t) => tiles[i].set(st, t),
      wipeAccent: (i, t, dur) => { tiles[i].set("accent", t); tiles[i].wipe.run(t, dur || D(ctx, "move", 0.34)); },
      floodJoined: (i, t, dur) => jt[i].wipe.run(t, dur || D(ctx, "move", 0.34)),
      setJoinedAccent: (on, t) => jt.forEach((j) => { j.accent.removeAttribute("clip-path"); setOp(j.accent, on ? 1 : 0, t); }),
    };
  };

  /* ---------------------------------------------------------------- comment_board (1600 x 760)
   * board (surface, ink outline, muted tray) with three dashed slots 440 x 170 at x 80 / 580 / 1080, y 250. Tiles (comment_tiles) go at x 80, y 250.
   * a side window sits OUTSIDE the left edge (x -500 to -20, y 190, 480 x 360): windowInner box {x 14, y 14, w 452, h 332} takes a meeting_room.
   * draft: a paper card 1200 wide (x 200, y 60) titled 'One comment' with three empty slots 340 x 160 at x 250 / 650 / 1050, y 260 and a cursor in slot 1. */
  Loom.lesson.comment_board = function (ctx, parent, opts) {
    const kit = ctx.kit;
    const B = begin(ctx, parent, 1600, 760, opts, "comment_board");
    const root = B.root, nm = B.nm, o = B.opts;
    const boardG = sv("g", {}, root);
    kit.rect(boardG, 0, 0, 1600, 700, { fill: "surface", r: 10 });
    kit.rect(boardG, 560, 700, 480, 28, { fill: "muted", r: 6, flat: true });
    const slotsG = sv("g", {}, boardG);
    const slots = [80, 580, 1080].map((x) => ({ x, y: 250, w: 440, h: 170, g: dashRect(slotsG, x, 250, 440, 170, ctx.c("muted"), 4) }));
    // draft card
    const draftG = sv("g", {}, root);
    kit.rect(draftG, 200, 60, 1200, 540, { fill: "surface", r: 10 });
    kit.text(draftG, "One comment", { role: "title", x: 250, y: 90, w: 1100, h: 110, maxLines: 1, align: "left", valign: "middle", color: "ink" });
    const draftSlots = [250, 650, 1050].map((x) => ({ x, y: 260, w: 340, h: 160, g: dashRect(draftG, x, 260, 340, 160, ctx.c("muted"), 4) }));
    const cursor = sv("rect", { x: 274, y: 316, width: 5, height: 56, rx: 2, fill: ctx.c(o.cursorTone || "ink") }, draftG);
    // side window: hinge on the board's left edge (x -20)
    const winG = sv("g", {}, root);
    const winBody = sv("g", {}, winG);
    kit.rect(winBody, 0, 0, 480, 360, { fill: "surface", r: 10 });
    const innerId = nm + "_winclip";
    const cp = sv("clipPath", { id: innerId }, winBody);
    sv("rect", { x: 14, y: 14, width: 452, height: 332 }, cp);
    const windowInner = sv("g", { "clip-path": "url(#" + innerId + ")" }, winBody);
    const applyWin = (s) => {
      winG.setAttribute("transform", "translate(-20 190) scale(" + Math.max(s, 0.001) + " 1) translate(-480 0)");
      winG.setAttribute("opacity", s <= 0.01 ? 0 : 1);
    };
    applyWin(o.state === "side_window_open" ? 1 : 0);
    const win = (open, t, dur) => Loom.drive((e) => applyWin(open ? e : 1 - e), t, dur || D(ctx, "enter", 0.42), "editorial", meta(ctx, nm + (open ? "_open" : "_close")));
    const bd = axis({ empty_slots: boardG, draft: draftG }, o.state === "draft" ? "draft" : "empty_slots");
    slotsG.setAttribute("opacity", o.state === "filled" ? 0 : 1);
    const setState = (name, t, dur) => {
      if (name === "side_window_open") return win(true, t, dur);
      if (name === "side_window_closed") return win(false, t, dur);
      if (name === "draft") { bd("draft", t); setOp(winG, 0, t); return; }
      bd("empty_slots", t);
      setOp(slotsG, name === "filled" ? 0 : 1, t);
    };
    // cursor blink at 1 Hz between t0 and t1 (finite toggles, no loops)
    const blink = (t0, t1) => { for (let k = 0, t = t0; t < t1 && k < 200; k++, t += 0.5) setOp(cursor, k % 2 === 0 ? 1 : 0, t); };
    return {
      g: root, board: boardG, slots, slotsG, draft: draftG, draftSlots, cursor, sideWindow: winG, windowInner,
      windowBox: { x: 14, y: 14, w: 452, h: 332 }, natural: [1600, 760],
      tileOrigin: { x: 80, y: 250 }, setState, blink, openWindow: (t, d) => win(true, t, d), closeWindow: (t, d) => win(false, t, d),
    };
  };

  /* ---------------------------------------------------------------- meeting_room (1920 x 1080)
   * layers, back to front: room set (surface2 wall, field2 floor) > bright wash > projector screen (right, x 1400-1820, y 120-420)
   * with two slides > wall calendar slot (x 870, y 70) > back audience row (2) + back table > front audience row (3) + front table >
   * theoSlot (a group: put Theo's bust element here) > Theo's table edge (front left) > mayaSlot (put Maya here) > a low lectern.
   * anchors give the beat's placements: theo {x 330, y 620, size 640}, maya {x 1300, y 870, scale 0.3}. */
  Loom.lesson.meeting_room = function (ctx, parent, opts) {
    const kit = ctx.kit;
    const B = begin(ctx, parent, 1920, 1080, opts, "meeting_room");
    const root = B.root, nm = B.nm, o = B.opts;
    const room = ctx.scenery("room", nm + "_set", { wall: "surface2", floorFill: "field2", floor: 0.8, window: false });
    root.appendChild(room.E.outer);
    const floorY = room.floorY || 864;
    const gBack = sv("g", {}, root);
    const brightG = sv("g", { opacity: 0 }, gBack);
    kit.rect(brightG, 0, 0, 1920, floorY, { fill: "surface", flat: true, crisp: true });
    setOp(brightG, o.bright ? 0.35 : 0, 0); brightG.setAttribute("opacity", o.bright ? 0.35 : 0);
    // projector screen on the right wall
    const sx = 1400, sy = 120, sw = 420, sh = 300;
    kit.rect(gBack, sx - 8, sy - 26, sw + 16, 22, { fill: "muted", r: 6, flat: true });
    kit.rect(gBack, sx, sy, sw, sh, { fill: "surface", r: 6 });
    const textWall = sv("g", {}, gBack);
    const rnd = Loom.rng(nm + "_slide");
    for (let i = 0; i < 9; i++) {
      const y = sy + 36 + i * 28, len = i === 0 ? 200 : 220 + Math.floor(rnd() * 130), x0 = sx + 24;
      let d = "M" + x0 + "," + y;
      for (let x = 14; x <= len; x += 14) d += " L" + (x0 + x) + "," + (y + (rnd() * 6 - 3)).toFixed(1);
      kit.path(textWall, d, { stroke: "muted", sw: i === 0 ? 6 : 3, fill: "none" });
    }
    const decision = sv("g", {}, gBack);
    kit.text(decision, "Decision", { role: "title", x: sx + 20, y: sy + 40, w: sw - 40, h: sh - 80, maxLines: 1, align: "center", valign: "middle", color: o.decisionTone || "accent" });
    const slideSw = axis({ text_wall: textWall, decision }, o.slide === "decision" ? "decision" : "text_wall");
    // wall calendar slot
    const calG = sv("g", { transform: "translate(870 70)" }, gBack);
    const calendar = o.calendar === false ? null : Loom.lesson.wall_calendar(ctx, calG, { name: nm + "_cal", state: o.calendarState });
    // audience: five seated extras (standing rigs behind tables), two rows
    const rows = [
      { feetY: 740, tableTop: 630, xs: [875, 1045] },
      { feetY: 840, tableTop: 740, xs: [790, 960, 1130] },
    ];
    const extras = [], phones = [];
    const aud = sv("g", {}, root);
    rows.forEach((r, ri) => {
      const rg = sv("g", {}, aud);
      const pg = sv("g", {}, aud);
      const pend = [];
      r.xs.forEach((cx, i) => {
        const res = ctx.crowd(nm + "_ex" + ri + i, { x: cx, y: r.feetY, w: 1, count: 1, rows: 1, scale: o.extraScale || 0.34, tone: "muted", parent: rg });
        [].concat(res || []).forEach((p) => extras.push(p));
        const ph = sv("g", { transform: "translate(" + (cx + 28) + " " + (r.tableTop - 30) + ") rotate(-12)" }, pg);
        sv("rect", { x: -14, y: -26, width: 28, height: 52, rx: 6, fill: ctx.c("surface2"), stroke: ctx.c("ink"), "stroke-width": 3 }, ph);
        phones.push(ph);
      });
      // the table in front of this row hides the standing rig's lower body
      const tg = sv("g", {}, aud);
      kit.rect(tg, 700, r.tableTop, 560, 22, { fill: "muted", r: 6, flat: true });
      kit.rect(tg, 712, r.tableTop + 22, 536, floorY + 36 - (r.tableTop + 22), { fill: "field2", r: 0 });
      aud.appendChild(pg);
    });
    const downInit = o.audience === "phones_down";
    phones.forEach((p) => { p.setAttribute("opacity", downInit ? 1 : 0); setOp(p, downInit ? 1 : 0, 0); });
    extras.forEach((p) => { if (downInit && p.pose) p.pose("think", 0, { dur: 0.01 }); });
    // Theo's slot and table edge (front left), then Maya's slot and a low lectern
    const theoSlot = sv("g", {}, root);
    const tbl = sv("g", {}, root);
    kit.rect(tbl, -40, 780, 740, 26, { fill: "muted", r: 8, flat: true });
    kit.rect(tbl, -40, 806, 740, 300, { fill: "field2", r: 0 });
    const mayaSlot = sv("g", {}, root);
    const lect = sv("g", {}, root);
    if (o.lectern !== false) {
      kit.rect(lect, 1200, 800, 200, 22, { fill: "muted", r: 6, flat: true });
      kit.rect(lect, 1212, 822, 176, 120, { fill: "field2", r: 0 });
    }
    const stagger = (ctx.style && ctx.style.motion && ctx.style.motion.stagger) || 0.07;
    const setState = (name, t) => {
      if (name === "slide_text_wall") return slideSw("text_wall", t);
      if (name === "slide_decision") return slideSw("decision", t);
      if (name === "bright") return setOp(brightG, 0.35, t);
      if (name === "not_bright") return setOp(brightG, 0, t);
      if (name === "phones_down" || name === "heads_up") {
        const down = name === "phones_down";
        extras.forEach((p, i) => { if (p && p.pose) p.pose(down ? "think" : "idle", t + i * stagger, { dur: 0.35 }); });
        phones.forEach((p, i) => setOp(p, down ? 1 : 0, t + i * stagger + (down ? 0.2 : 0)));
      }
    };
    return {
      g: root, room, floorY, theoSlot, mayaSlot, extras, phones, slides: { text_wall: textWall, decision }, calendar, calendarSlot: calG,
      screen: { x: sx, y: sy, w: sw, h: sh }, tableEdge: tbl, bright: brightG, natural: [1920, 1080],
      anchors: { theo: { x: 330, y: 620, size: 640 }, maya: { x: 1300, y: floorY + 6, scale: 0.3 }, calendar: { x: 870, y: 70, w: 220, h: 260 }, screen: { x: sx, y: sy, w: sw, h: sh } },
      setState,
    };
  };
})();
