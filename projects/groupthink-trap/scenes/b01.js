// @design held_room_private_doubts: a locked wide room of small seated people, each private doubt a folded bubble only the viewer sees, arriving one per step over a silent table
/* b01 - the hook. Five people meet round one table; four of them carry a folded doubt; nobody says so.
 * Treatments considered (lnd-motion-choreography-loop, pass A):
 *  (A) static composition + signalling: the full room at rest, the four seams pulsing on "doubts". Rejected: the
 *      hook IS a change in time (doubts appearing where nothing is said); a pulse on a still frame hides the order.
 *  (B) a push-in from the window across the table, bubbles appearing as the camera passes. Rejected: the seed's
 *      camera habit is "cut" and the set bible locks the room; a move would make b07's callback frame unmatched.
 *  (C) CHOSEN: the locked wide tableau built from the set bible, present at frame 0 with no entrance; people settle
 *      on fours (two drawings each), the plan sheet gets its paper tag, then the four folded doubts pop one per step,
 *      and the bubbles boil through the held silence. Reduced motion still teaches: four folded bubbles over four
 *      heads, none over the leader.
 * Rules taken from the references (TED-Ed conclusions s7, style_guide wobbly-outline family, places/office.md):
 *  a still camera on a moving drawing; people small, posed, dot eyes; labels on paper tags; one window light;
 *  hand-made time on fours; colour withheld except the accent (the four thin red seams).
 * The set bible lives here: every later room beat (b02 to b07) holds these elements by name. Shapes the later beats
 * morph to (open bubble, lid) are computed once here and kept on the elements (E.__bub, E.__sheet, E.__api).
 *
 * Loom.gt (below, defined at load, before any scene builds): the set bible as code, shared by the beats that REDRAW
 * the room on another station or after a dark break (b09, b19, the b20 miniature, b21), and the measured paper tag.
 * Added in the scenes-C2 pass (2026-10-06): b09, b12 and b19 had each redrawn the room by hand and drifted from
 * this frame (other skin and hair on the same people, a legless table, another clock and cloud).
 */
(function () {
  const svg = (t, a, p) => Loom.svg(t, a, p);
  const f1 = (v) => Math.round(v * 10) / 10;
  const G = (Loom.gt = Loom.gt || {});
  // the cast, exactly as b01 draws it (set bible: quiet tops, accents reserved)
  G.CAST = [
    { name: "dana", rig: "tess", x: 560, skin: 1, hair: 1, top: "muted" },
    { name: "p_date", rig: "pip", x: 790, skin: 0, hair: 3, top: "shadow" },
    { name: "p_test", rig: "tess", x: 1020, skin: 2, hair: 2, top: "field2" },
    { name: "p_support", rig: "pip", x: 1250, skin: 3, hair: 0, top: "surface2" },
    { name: "p_client", rig: "tess", x: 1480, skin: 0, hair: 4, top: "muted" },
  ];

  // A paper tag sized from kit.fit with a measured inset (T.label's tag leaves 7.5 to 9 px where the inset check
  // needs 7.6 to 9.2 px at the top of a role's range). o: {x, y, text, role, fill, edge, color, side, to, t, parent}.
  // `to` (a pin point) is optional: without it there is no string.
  // @form pinned_paper_tag: a paper tag on a string pinned to one point of an object, its word written on
  G.tag = function (cx, name, o) {
    const K = cx.kit, M = cx.m, role = o.role || "label";
    const F = K.fit(o.text, { role, w: o.maxW || 520, maxLines: 1 });
    const ins = Math.max(12, Math.round(F.size * 0.32)), notch = Math.round((F.height + 2 * ins) * 0.42);
    const w = Math.ceil(F.width + 2 * ins + notch), h = Math.ceil(F.height + 2 * ins);
    const left = o.side !== "right";   // the notch (and its string) faces the pin
    const E = cx.el(name, { x: o.x - w / 2, y: o.y - h / 2, w, h, kind: "tag", exit: "recede", parent: o.parent });
    const nx = left ? 0 : w, sx = left ? 1 : -1;
    const d = `M${nx} ${h / 2} L${nx + sx * notch} 0 H${left ? w - 6 : 6} Q${left ? w : 0} 0 ${left ? w : 0} 6 V${h - 6} Q${left ? w : 0} ${h} ${left ? w - 6 : 6} ${h} H${nx + sx * notch} Z`;
    svg("path", { d, fill: cx.c("shadow"), opacity: 0.35, transform: "translate(4 5)", class: "lm-shadow" }, E.inner);
    svg("path", { d, fill: cx.c(o.fill || "surface"), stroke: cx.c(o.edge || "ink"), "stroke-width": 3, "stroke-linejoin": "round" }, E.inner);
    const hx = nx + sx * notch * 0.62;
    svg("circle", { cx: hx, cy: h / 2, r: 4.5, fill: cx.c("field"), stroke: cx.c("ink"), "stroke-width": 2 }, E.inner);
    const tw = svg("g", {}, E.inner);
    K.text(tw, o.text, { role, x: left ? notch + ins : ins, y: ins, w: F.width + 2, h: F.height, align: "left", valign: "middle", maxLines: 1, color: o.color || "ink" });
    let str = null, pin = null;
    if (o.to) {
      // the string: from the tag's hole to the pin, sagging, drawn first
      const L = cx.el(name + ".lead", { x: 0, y: 0, w: 0, h: 0, kind: "connector", exit: "recede", parent: o.parent });
      const ax = E.x + hx, ay = E.y + h / 2, [px, py] = o.to;
      str = svg("path", { d: `M${f1(px)} ${f1(py)} Q${f1((px + ax) / 2)} ${f1(Math.max(py, ay) + 26)} ${f1(ax)} ${f1(ay)}`, fill: "none", stroke: cx.c("ink"), "stroke-width": 2.5, "stroke-linecap": "round" }, L.inner);
      pin = svg("circle", { cx: px, cy: py, r: 5, fill: cx.c("ink") }, L.inner);
      E.lead = L;
    }
    E.__text = tw;
    if (o.t != null) {
      const t0 = o.t, tLand = str ? t0 + 0.2 : t0;
      if (str) {
        Loom.tween(pin, { opacity: 0 }, { opacity: 1, duration: 0.1 }, t0, { kind: "reveal", beat: cx.beat.id, name: name + ".lead" });
        M.draw(str, t0, { dur: 0.3 });
      }
      M.settle(E, tLand, { dy: 10, content: true });
      // written on: the word unmasks left to right after the tag has landed (never stepped: it is read)
      const id = Loom.uid("gttag"), cp = svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, svg("defs", {}, E.inner));
      const r = svg("rect", { x: 0, y: 0, width: 0, height: h }, cp);
      tw.setAttribute("clip-path", `url(#${id})`);
      Loom.tween(r, { attr: { width: 0 } }, { attr: { width: w }, duration: Math.max(0.35, o.text.length * 0.05), ease: Loom.ease.move }, tLand + 0.2, { kind: "reveal", beat: cx.beat.id, name, content: true, nostep: true });
    }
    return E;
  };

  // The room, drawn exactly as b01 draws it. o: {pre, parent, t0, t1 (cloud drift window), from, until (rig drive
  // window), standing: [names], sheet: null | "plain" | "amended", sheetX}. Returns {set, cloud, board, clock,
  // people: {name: rig api}, table, sheet}. The cloud's phase is a function of absolute time, so every copy agrees.
  G.room = function (ctx, o) {
    o = o || {};
    const pre = o.pre || "", parent = o.parent, S = ctx.style;
    const el = (n, a) => ctx.el(n, parent ? Object.assign({}, a, { parent }) : a);
    const sctx = Object.create(ctx);
    sctx.el = el;
    if (o.from != null) sctx.start = o.from;
    if (o.until != null) sctx.end = o.until;
    const room = Loom.scenery.room(sctx, pre + "set", { window: true, windowX: 1440, floor: 0.70 });
    const set = room.E;
    set.exit = "none";
    svg("path", { d: "M1440 756 L1862 756 L1700 1080 L1180 1080 Z", fill: ctx.c("surface"), opacity: 0.22 }, set.inner);
    svg("rect", { x: 1426, y: 558, width: 450, height: 6, fill: ctx.c("shadow"), opacity: 0.5 }, set.inner);
    // the cloud in the window glass (the one ambient loop, period 4.8 s)
    const cloud = el(pre + "window_cloud", { x: 1440, y: 151, w: 422, h: 389, kind: "scenery", exit: "none" });
    {
      const cid = Loom.uid("gtwin"), cdefs = svg("defs", {}, cloud.inner);
      const puff = (g, x, y, s) => {
        const d = `M${x - 60 * s} ${y + 14 * s} q-6 ${-26 * s} ${22 * s} ${-26 * s} q${10 * s} ${-28 * s} ${40 * s} ${-20 * s} q${22 * s} ${-22 * s} ${46 * s} ${-2 * s} q${28 * s} ${-2 * s} ${26 * s} ${22 * s} q${4 * s} ${26 * s} ${-24 * s} ${26 * s} z`;
        svg("path", { d, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 3, "stroke-linejoin": "round" }, g);
      };
      svg("rect", { x: 0, y: 0, width: 208, height: 199 }, svg("clipPath", { id: cid + "a" }, cdefs));
      svg("rect", { x: 214, y: 0, width: 208, height: 199 }, svg("clipPath", { id: cid + "b" }, cdefs));
      const d1 = svg("g", {}, svg("g", { "clip-path": `url(#${cid}a)` }, cloud.inner));
      const d2 = svg("g", {}, svg("g", { "clip-path": `url(#${cid}b)` }, cloud.inner));
      puff(d1, 120, 92, 1.0); puff(d1, 300, 140, 0.7);
      puff(d2, 300, 140, 0.7); puff(d2, 120, 92, 1.0);
      if (o.t1 > o.t0) {
        const P = 4.8, n = Math.max(1, Math.round((o.t1 - o.t0) / P)), span = n * P;
        Loom.drive((e, raw) => {
          const a = 2 * Math.PI * (o.t0 + raw * span) / P;
          const tr = `translate(${f1(Math.sin(a) * 34)} ${f1(Math.sin(a * 0.5) * 4)})`;
          d1.setAttribute("transform", tr); d2.setAttribute("transform", tr);
        }, o.t0, span, "linear", { kind: "ambient", beat: ctx.beat.id, name: pre + "window_cloud" });
      }
    }
    // the board (writing area x 330..690, y 180..390)
    // @form whiteboard_panel: a face-on whiteboard with an inner frame and a marker tray
    const board = el(pre + "board", { x: 290, y: 140, w: 440, h: 310, kind: "scenery", exit: "none" });
    svg("rect", { x: 14, y: 16, width: 420, height: 270, rx: 4, fill: ctx.c("shadow"), opacity: 0.35 }, board.inner);
    svg("rect", { x: 10, y: 10, width: 420, height: 270, rx: 4, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 6, "stroke-linejoin": "round" }, board.inner);
    svg("rect", { x: 22, y: 22, width: 396, height: 246, rx: 2, fill: "none", stroke: ctx.c("surface2"), "stroke-width": 2 }, board.inner);
    svg("rect", { x: 110, y: 280, width: 220, height: 12, rx: 3, fill: ctx.c("surface2"), stroke: ctx.c("ink"), "stroke-width": 3 }, board.inner);
    svg("rect", { x: 140, y: 270, width: 46, height: 10, rx: 4, fill: ctx.c("muted"), stroke: ctx.c("ink"), "stroke-width": 2 }, board.inner);
    svg("rect", { x: 200, y: 271, width: 40, height: 9, rx: 4, fill: ctx.c("field2"), stroke: ctx.c("ink"), "stroke-width": 2 }, board.inner);
    const clock = Loom.obj.draw(sctx, pre + "clock", "clock", { x: 1080, y: 180, size: 90, family: "wall", shadow: false, tone: "field2", detail: 2, state: { time: 10.25, handTone: "ink" }, parent });
    clock.exit = "none";
    // the people (seated: the table hides them below the hips); standing = raised 90 px
    const people = {};
    G.CAST.forEach((p) => {
      const up = (o.standing || []).includes(p.name);
      const api = Loom.rig.place(sctx, pre + p.name, p.rig, { x: p.x, y: up ? 670 : 760, scale: 0.44, skin: p.skin, hair: p.hair, top: p.top, bottom: "field2", pose: "idle", parent });
      Loom.stepped.on(api.E, { hz: 6 });
      people[p.name] = api;
    });
    // the table, in front of the people
    // @form perspective_table: a long table top in simple perspective with a front panel, legs and a floor shadow
    const table = el(pre + "table", { x: 300, y: 630, w: 1440, h: 300, kind: "scenery", exit: "none" });
    {
      const g = table.inner, ox = 300, oy = 630, P = (x, y) => `${x - ox} ${y - oy}`;
      svg("ellipse", { cx: 1020 - ox, cy: 905 - oy, rx: 760, ry: 22, fill: ctx.c("shadow"), opacity: 0.45 }, g);
      [[372, 840], [1646, 840]].forEach(([x, y]) => svg("rect", { x: x - ox, y: y - oy, width: 24, height: 62, rx: 3, fill: S.darken(ctx.c("shadow"), 0.18), stroke: ctx.c("ink"), "stroke-width": 4 }, g));
      svg("path", { d: `M${P(320, 790)} L${P(1720, 790)} L${P(1720, 840)} L${P(320, 840)} Z`, fill: ctx.c("shadow"), stroke: ctx.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, g);
      svg("path", { d: `M${P(420, 640)} L${P(1620, 640)} L${P(1720, 790)} L${P(320, 790)} Z`, fill: ctx.c("surface2"), stroke: ctx.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, g);
      const rg = Loom.rng("table_grain");
      for (let i = 0; i < 9; i++) {
        const y = 660 + i * 14 + rg() * 6, x0 = 440 + rg() * 500, len = 120 + rg() * 260;
        svg("path", { d: `M${P(x0, y)} q${f1(len / 2)} ${f1(-3 + rg() * 6)} ${f1(len)} 0`, fill: "none", stroke: ctx.c("shadow"), "stroke-width": 2, opacity: 0.55, "stroke-linecap": "round" }, g);
      }
    }
    // the plan sheet lying on the table (b01's drawing); "amended" is b17's end state: a second page out from under
    // it, two new ink lines, the date glyph one column right, the header ochre
    let sheet = null;
    if (o.sheet) {
      const SX = o.sheetX || 1135, SY = 750, am = o.sheet === "amended";
      sheet = el(pre + "sheet", { x: SX - 125, y: SY - 60, w: 270, h: 105, kind: "document", exit: "none" });
      const g = sheet.inner, cx = 125, cy = 60;
      const quad = (dx, dy) => `M${cx - 100 + dx} ${cy - 34 + dy} L${cx + 100 + dx} ${cy - 34 + dy} L${cx + 116 + dx} ${cy + 36 + dy} L${cx - 116 + dx} ${cy + 36 + dy} Z`;
      svg("path", { d: quad(0, 0), fill: ctx.c("shadow"), opacity: 0.4, transform: "translate(5 5)" }, g);
      if (am) svg("path", { d: quad(18, -14), fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 3.5, "stroke-linejoin": "round" }, g);
      svg("path", { d: quad(0, 0), fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 3.5, "stroke-linejoin": "round" }, g);
      svg("path", { d: `M${cx - 96} ${cy - 30} L${cx + 96} ${cy - 30} L${cx + 99} ${cy - 18} L${cx - 99} ${cy - 18} Z`, fill: ctx.c(am ? "accent2" : "field2") }, g);
      for (let i = 0; i < 3; i++) {
        const y = cy - 6 + i * 13, half = 92 + i * 4;
        svg("line", { x1: cx - half, y1: y, x2: cx - half + (i === 2 ? 110 : 150), y2: y, stroke: ctx.c("muted"), "stroke-width": 2.5, "stroke-linecap": "round" }, g);
      }
      if (am) {
        svg("path", { d: `M${cx - 104} ${cy + 27} H${cx - 10}`, fill: "none", stroke: ctx.c("ink"), "stroke-width": 3.4, "stroke-linecap": "round" }, g);
        svg("path", { d: `M${cx + 8} ${cy + 3} H${cx + 52}`, fill: "none", stroke: ctx.c("ink"), "stroke-width": 3.4, "stroke-linecap": "round" }, g);
      }
      const gx = cx + (am ? 72 : 62);
      svg("rect", { x: gx, y: cy - 10, width: 30, height: 28, rx: 3, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 2.5 }, g);
      svg("rect", { x: gx, y: cy - 10, width: 30, height: 8, fill: ctx.c("muted") }, g);
    }
    return { set, cloud, board, clock, people, table, sheet };
  };

  // b19's upright card (moved here so b20's miniature draws the very same card)
  // @form note_card_upright: a small card turned up on a table, two scribbled lines and an optional red mark
  G.cardUp = function (ctx, g, cx, cy, marked) {
    ctx.kit.rect(g, cx - 62, cy - 44, 124, 88, { fill: "surface", r: 6, stroke: "ink", sw: 4, shadow: false });
    svg("path", { d: `M${cx - 44} ${cy - 16} q10 -8 20 0 t20 0 t20 0 t18 0`, fill: "none", stroke: ctx.c("muted"), "stroke-width": 4, "stroke-linecap": "round" }, g);
    svg("path", { d: `M${cx - 44} ${cy + 8} q10 -8 20 0 t20 0 t16 0`, fill: "none", stroke: ctx.c("muted"), "stroke-width": 4, "stroke-linecap": "round" }, g);
    if (marked) {   // the small red mark: this card carries a doubt
      svg("path", { d: `M${cx + 40} ${cy - 24} V${cy + 6}`, fill: "none", stroke: ctx.c("accent"), "stroke-width": 7, "stroke-linecap": "round" }, g);
      svg("circle", { cx: cx + 40, cy: cy + 22, r: 5, fill: ctx.c("accent") }, g);
    }
  };
})();

Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = ctx.style, svg = Loom.svg, T = Loom.treat;
    const f1 = (v) => Math.round(v * 10) / 10;

    // the room's state is held until the end of b07 (the last beat of the first meeting): the rigs, the cloud and the
    // seams live that long. Read from the manifest, so a re-timed narration moves it too.
    const beats = (Loom.manifest && Loom.manifest.beats) || [];
    const last = beats.find((b) => b.id === "b07");
    const roomEnd = last ? last.end : ctx.end + 50;

    const tMeet = ctx.cue("five smart people meet");
    const tPlan = ctx.cue("one plan");
    const tDoubt = ctx.cue("Each one doubts it");
    const tNobody = ctx.cue("Nobody says so");
    const STEP = 1 / 6;   // one drawing on fours

    /* ---------------- the set (present at frame 0, no entrance) ---------------- */
    const room = ctx.scenery("room", "set", { window: true, windowX: 1440, floor: 0.70 });
    const set = room.E;
    // one window light: a pale parallelogram thrown on the floor, left of the window
    svg("path", { d: "M1440 756 L1862 756 L1700 1080 L1180 1080 Z", fill: ctx.c("surface"), opacity: 0.22 }, set.inner);
    // skirting shadow under the window sill so the window sits in the wall
    svg("rect", { x: 1426, y: 558, width: 450, height: 6, fill: ctx.c("shadow"), opacity: 0.5 }, set.inner);

    // the cloud in the window glass: the one ambient loop (period 4.8 s, period-locked to the room's window)
    // @form window_cloud_drift: a soft cloud drifting slowly inside a clipped window pane, the room's ambient loop
    const cloud = ctx.el("window_cloud", { x: 1440, y: 151, w: 422, h: 389, kind: "scenery", exit: "none" });
    const cid = Loom.uid("gtwin");
    const cdefs = svg("defs", {}, cloud.inner);
    svg("rect", { x: 0, y: 0, width: 211 - 3, height: 202 - 3 }, svg("clipPath", { id: cid + "a" }, cdefs));
    const pane = svg("g", { "clip-path": `url(#${cid}a)` }, cloud.inner);
    const drift = svg("g", {}, pane);
    const puff = (g, x, y, s) => {
      const d = `M${x - 60 * s} ${y + 14 * s} q-6 ${-26 * s} ${22 * s} ${-26 * s} q${10 * s} ${-28 * s} ${40 * s} ${-20 * s} q${22 * s} ${-22 * s} ${46 * s} ${-2 * s} q${28 * s} ${-2 * s} ${26 * s} ${22 * s} q${4 * s} ${26 * s} ${-24 * s} ${26 * s} z`;
      svg("path", { d, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 3, "stroke-linejoin": "round" }, g);
    };
    puff(drift, 120, 92, 1.0);
    puff(drift, 300, 140, 0.7);
    // the lower panes see the same sky
    svg("rect", { x: 211 + 3, y: 0, width: 211 - 3, height: 202 - 3 }, svg("clipPath", { id: cid + "b" }, cdefs));
    const pane2 = svg("g", { "clip-path": `url(#${cid}b)` }, cloud.inner);
    const drift2 = svg("g", {}, pane2);
    puff(drift2, 300, 140, 0.7);
    puff(drift2, 120, 92, 1.0);
    {
      const span = roomEnd - ctx.start, P = 4.8, n = Math.max(1, Math.round(span / P));
      Loom.drive((e, raw) => {
        const a = 2 * Math.PI * raw * n;
        const dx = f1(Math.sin(a) * 34), dy = f1(Math.sin(a * 0.5) * 4);
        drift.setAttribute("transform", `translate(${dx} ${dy})`);
        drift2.setAttribute("transform", `translate(${dx} ${dy})`);
      }, ctx.start, span, "linear", { kind: "ambient", beat: ctx.beat.id, name: "window_cloud" });
    }

    // the board: surface, ink frame, pen tray. Its writing area becomes a Loom.slot in b03.
    // @form whiteboard_panel: a face-on whiteboard with an inner frame and a marker tray
    const board = ctx.el("board", { x: 290, y: 140, w: 440, h: 310, kind: "scenery", exit: "none" });
    svg("rect", { x: 14, y: 16, width: 420, height: 270, rx: 4, fill: ctx.c("shadow"), opacity: 0.35 }, board.inner);   // wall shadow
    svg("rect", { x: 10, y: 10, width: 420, height: 270, rx: 4, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 6, "stroke-linejoin": "round" }, board.inner);
    svg("rect", { x: 22, y: 22, width: 396, height: 246, rx: 2, fill: "none", stroke: ctx.c("surface2"), "stroke-width": 2 }, board.inner);
    svg("rect", { x: 110, y: 280, width: 220, height: 12, rx: 3, fill: ctx.c("surface2"), stroke: ctx.c("ink"), "stroke-width": 3 }, board.inner);
    svg("rect", { x: 140, y: 270, width: 46, height: 10, rx: 4, fill: ctx.c("muted"), stroke: ctx.c("ink"), "stroke-width": 2 }, board.inner);
    svg("rect", { x: 200, y: 271, width: 40, height: 9, rx: 4, fill: ctx.c("field2"), stroke: ctx.c("ink"), "stroke-width": 2 }, board.inner);

    // the wall clock (Loom.obj): its hands are kept (E.object.hands) so b03 can tick the minute hand back
    // @form clock_dial: a wall clock whose hands can be moved to show time passing or rewinding
    const clock = Loom.obj.draw(ctx, "clock", "clock", { x: 1080, y: 180, size: 90, family: "wall", shadow: false, tone: "field2", detail: 2, state: { time: 10.25, handTone: "ink" } });
    clock.exit = "none";

    /* ---------------- the people (seated: the table hides them below the hips) ---------------- */
    // One rig drive per person runs to the end of b07 (rig.js drives its character from ctx.start to ctx.end + 1.5),
    // so the later room beats key poses on the same people through E.__api (poses are keyed as drawings, see below).
    const long = Object.create(ctx);
    long.end = roomEnd;
    const CAST = [
      { name: "dana", rig: "tess", x: 560, skin: 1, hair: 1, top: "muted" },
      { name: "p_date", rig: "pip", x: 790, skin: 0, hair: 3, top: "shadow" },
      { name: "p_test", rig: "tess", x: 1020, skin: 2, hair: 2, top: "field2" },
      { name: "p_support", rig: "pip", x: 1250, skin: 3, hair: 0, top: "surface2" },
      { name: "p_client", rig: "tess", x: 1480, skin: 0, hair: 4, top: "muted" },
    ];
    const SHEET = { x: 1135, y: 750 };
    // A lesson-local pose for the vote: one hand up BESIDE the head (the rig's "wave" pose puts the forearm straight
    // up behind the head, where the head hides it, seen in the b02 frames). Same part names as the rig's own poses.
    ["pip", "tess"].forEach((r) => { const d = Loom.rig.defs[r]; if (d && !d.poses.hand_up) d.poses.hand_up = { upper_l: 10, fore_l: 6, upper_r: -100, fore_r: -80, head: 2 };
      if (d && !d.poses.hand_mid) d.poses.hand_mid = { upper_l: 10, fore_l: 6, upper_r: -62, fore_r: -60, head: 1 };
      if (d && !d.poses.hand_low) d.poses.hand_low = { upper_l: 10, fore_l: 6, upper_r: -30, fore_r: -24 }; });
    // rig.js drives a character from the RAW timeline progress, so Loom.stepped cannot quantise its poses (seen: the
    // wrap stepped nothing). Hand-made pose time is therefore keyed as drawings: each pose is a near-instant key, one
    // per 1/6 s step, held in between. api.drawings(["hand_mid", "hand_up"], t) is that, for every later room beat.
    const drawings = (api) => (names, t, step) => names.forEach((n, i) => api.pose(n, t + i * (step || STEP), { dur: 0.02 }));
    const people = {};
    {
      CAST.forEach((p) => {
        const api = Loom.rig.place(long, p.name, p.rig, { x: p.x, y: 760, scale: 0.44, skin: p.skin, hair: p.hair, top: p.top, bottom: "field2", pose: "idle" });
        api.E.exit = "recede";
        api.E.__api = api;
        api.drawings = drawings(api);
        people[p.name] = api;
      });
    }
    CAST.forEach((p, i) => {
      const a = people[p.name];
      Loom.stepped.on(a.E, { hz: 6 });
      // they settle into their seats left to right, 0.12 s apart, in two drawings
      m.settle(a.E, tMeet + i * 0.12, { dy: 22, dur: 2 * STEP, content: true });
      // eyes on the plan sheet while they sit down
      const dx = Math.max(-1, Math.min(1, (SHEET.x - p.x) / 700)), dy = 0.7;
      a.look(f1(dx), dy, tMeet + i * 0.12);
    });

    /* ---------------- the table, in front of the people ---------------- */
    // @form perspective_table: a long table top in simple perspective with a front panel, legs and a floor shadow
    const table = ctx.el("table", { x: 300, y: 630, w: 1440, h: 300, kind: "scenery", exit: "none" });
    {
      const g = table.inner, ox = 300, oy = 630, P = (x, y) => `${x - ox} ${y - oy}`;
      svg("ellipse", { cx: 1020 - ox, cy: 905 - oy, rx: 760, ry: 22, fill: ctx.c("shadow"), opacity: 0.45 }, g);
      [[372, 840], [1646, 840]].forEach(([x, y]) => svg("rect", { x: x - ox, y: y - oy, width: 24, height: 62, rx: 3, fill: S.darken(ctx.c("shadow"), 0.18), stroke: ctx.c("ink"), "stroke-width": 4 }, g));
      svg("path", { d: `M${P(320, 790)} L${P(1720, 790)} L${P(1720, 840)} L${P(320, 840)} Z`, fill: ctx.c("shadow"), stroke: ctx.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, g);
      svg("path", { d: `M${P(420, 640)} L${P(1620, 640)} L${P(1720, 790)} L${P(320, 790)} Z`, fill: ctx.c("surface2"), stroke: ctx.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, g);
      // a few grain strokes so the top reads as wood, not as more wall
      const rg = Loom.rng("table_grain");
      for (let i = 0; i < 9; i++) {
        const y = 660 + i * 14 + rg() * 6, x0 = 440 + rg() * 500, len = 120 + rg() * 260;
        svg("path", { d: `M${P(x0, y)} q${f1(len / 2)} ${f1(-3 + rg() * 6)} ${f1(len)} 0`, fill: "none", stroke: ctx.c("shadow"), "stroke-width": 2, opacity: 0.55, "stroke-linecap": "round" }, g);
      }
    }

    /* ---------------- the plan sheet, lying on the table ---------------- */
    // @form plan_sheet_flat: a paper sheet lying on a table in perspective, with ruled lines, a header strip and a small calendar glyph
    const sheet = ctx.el("sheet", { x: SHEET.x - 125, y: SHEET.y - 45, w: 250, h: 90, kind: "document", exit: "none" });
    {
      const g = sheet.inner, cx = 125, cy = 45;
      const quad = `M${cx - 100} ${cy - 34} L${cx + 100} ${cy - 34} L${cx + 116} ${cy + 36} L${cx - 116} ${cy + 36} Z`;
      svg("path", { d: quad, fill: ctx.c("shadow"), opacity: 0.4, transform: "translate(5 5)" }, g);
      svg("path", { d: quad, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 3.5, "stroke-linejoin": "round" }, g);
      // the header strip: neutral now; it turns ochre only while the plan is the named thing (b02)
      const header = svg("path", { d: `M${cx - 96} ${cy - 30} L${cx + 96} ${cy - 30} L${cx + 99} ${cy - 18} L${cx - 99} ${cy - 18} Z`, fill: ctx.c("field2") }, g);
      for (let i = 0; i < 3; i++) {
        const y = cy - 6 + i * 13, half = 92 + i * 4;
        svg("line", { x1: cx - half, y1: y, x2: cx - half + (i === 2 ? 110 : 150), y2: y, stroke: ctx.c("muted"), "stroke-width": 2.5, "stroke-linecap": "round" }, g);
      }
      // a small calendar glyph at the right: the date the plan names
      svg("rect", { x: cx + 62, y: cy - 10, width: 30, height: 28, rx: 3, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 2.5 }, g);
      svg("rect", { x: cx + 62, y: cy - 10, width: 30, height: 8, fill: ctx.c("muted") }, g);
      sheet.__sheet = { header };
    }

    /* ---------------- the four folded doubts (never over Dana) ---------------- */
    // A wobble outline sampled at the SAME angles for every state, so folded -> open -> folded -> lid is one path
    // morphing (Loom.morph.to), never a cross-fade.
    const wob = (cx, cy, w, h, seed, jit, p) => {
      const rng = Loom.rng("gt_bub:" + seed), n = 12, pts = [];
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const k = 1 + (rng() - 0.5) * jit;
        pts.push([cx + (w / 2) * Math.sign(c) * Math.pow(Math.abs(c), 2 / p) * k, cy + (h / 2) * Math.sign(s) * Math.pow(Math.abs(s), 2 / p) * k]);
      }
      let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
        d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
      }
      return d + " Z";
    };
    const BUBS = [
      { name: "bub_date", owner: "p_date", x: 790 },
      { name: "bub_test", owner: "p_test", x: 1020 },
      { name: "bub_support", owner: "p_support", x: 1250 },
      { name: "bub_client", owner: "p_client", x: 1480 },
    ];
    // element box: wide enough for the open bubble (b05) so the boil filter and the checks see its true extent
    const BX = -95, BY = 205, BW = 230, BH = 215;
    BUBS.forEach((b, i) => {
      // @form folded_doubt_bubble: a small folded thought bubble with a crease and one red seam, two tail dots to the head
      const E = ctx.el(b.name, { x: b.x + BX, y: BY, w: BW, h: BH, kind: "bubble", exit: "recede" });
      const L = (x, y) => [x - (b.x + BX), y - BY];   // station -> element-local
      const [fx, fy] = L(b.x + 40, 330), [ox, oy] = L(b.x + 30, 288), [lx, ly] = L(b.x + 40, 374);
      const shapes = {
        folded: wob(fx, fy, 86, 58, b.name + ":f", 0.10, 3),
        open: wob(ox, oy, 174, 140, b.name + ":o", 0.07, 4),
        lid: wob(lx, ly, 108, 26, b.name + ":l", 0.03, 7),
        seamFolded: `M${f1(fx - 28)} ${f1(fy + 15)} Q${f1(fx)} ${f1(fy + 22)} ${f1(fx + 28)} ${f1(fy + 15)}`,
        seamOpen: `M${f1(ox - 20)} ${f1(oy + 66)} Q${f1(ox)} ${f1(oy + 68)} ${f1(ox + 20)} ${f1(oy + 66)}`,
        seamLid: `M${f1(lx - 40)} ${f1(ly + 1)} Q${f1(lx)} ${f1(ly + 4)} ${f1(lx + 40)} ${f1(ly + 1)}`,
        crease: `M${f1(fx - 36)} ${f1(fy + 1)} Q${f1(fx)} ${f1(fy - 8)} ${f1(fx + 36)} ${f1(fy + 1)}`,
      };
      // two tail dots down to the head (the bubble belongs to that person)
      const dots = svg("g", {}, E.inner);
      const [d1x, d1y] = L(b.x + 26, 376), [d2x, d2y] = L(b.x + 14, 398);
      svg("circle", { cx: d1x, cy: d1y, r: 7, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 3 }, dots);
      svg("circle", { cx: d2x, cy: d2y, r: 4.5, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 2.5 }, dots);
      const body = svg("path", { d: shapes.folded, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 4, "stroke-linejoin": "round" }, E.inner);
      const crease = svg("path", { d: shapes.crease, fill: "none", stroke: ctx.c("ink"), "stroke-width": 2.6, "stroke-linecap": "round" }, E.inner);
      const seam = svg("path", { d: shapes.seamFolded, fill: "none", stroke: ctx.c("accent"), "stroke-width": 3.6, "stroke-linecap": "round" }, E.inner);
      E.__bub = { body, crease, seam, dots, shapes, owner: b.owner, ox: b.x };
      Loom.stepped.on(E, { hz: 6 });
      // they pop left to right, one per drawing step (a small overshoot: small accents only)
      m.pop(E, tDoubt + i * STEP, { dur: 2 * STEP, content: true });
      // from "Nobody says so" the outlines boil, so the held tableau is never frozen
      Loom.stepped.boil(E, tNobody, ctx.end, { hz: 8, amp: 1.1 });
    });

    /* ---------------- the plan gets its tag ---------------- */
    // A paper tag on a string, pinned to a point, its word written on. Drawn here (not T.label) because T.label's tag
    // at the label role's top size leaves 7.5 px where the layout check needs 7.6 (probe: tight_inset "one plan"); this
    // one is sized from kit.fit with a measured inset. Kept on the set (set.__tag) for the later room beats' tags.
    // (the same drawing as Loom.gt.tag above, kept here unchanged so b01 to b07's frames do not move)
    set.__tag = function (cx, name, o) {
      const K = cx.kit, M = cx.m, role = o.role || "label";
      const F = K.fit(o.text, { role, w: o.maxW || 420, maxLines: 1 });
      const ins = Math.max(12, Math.round(F.size * 0.32)), notch = Math.round((F.height + 2 * ins) * 0.42);
      const w = Math.ceil(F.width + 2 * ins + notch), h = Math.ceil(F.height + 2 * ins);
      const left = o.side !== "right";   // the notch (and its string) faces the pin
      const E = cx.el(name, { x: o.x - w / 2, y: o.y - h / 2, w, h, kind: "tag", exit: "recede", parent: o.parent });
      const nx = left ? 0 : w, sx = left ? 1 : -1;
      const d = `M${nx} ${h / 2} L${nx + sx * notch} 0 H${left ? w - 6 : 6} Q${left ? w : 0} 0 ${left ? w : 0} 6 V${h - 6} Q${left ? w : 0} ${h} ${left ? w - 6 : 6} ${h} H${nx + sx * notch} Z`;
      svg("path", { d, fill: cx.c("shadow"), opacity: 0.35, transform: "translate(4 5)" }, E.inner);
      svg("path", { d, fill: cx.c(o.fill || "surface"), stroke: cx.c(o.edge || "ink"), "stroke-width": 3, "stroke-linejoin": "round" }, E.inner);
      const hx = nx + sx * notch * 0.62;
      svg("circle", { cx: hx, cy: h / 2, r: 4.5, fill: cx.c("field"), stroke: cx.c("ink"), "stroke-width": 2 }, E.inner);
      const tw = svg("g", {}, E.inner);
      K.text(tw, o.text, { role, x: left ? notch + ins : ins, y: ins, w: F.width + 2, h: F.height, align: "left", valign: "middle", maxLines: 1, color: o.color || "ink" });
      // the string: from the tag's hole to the pin, sagging, drawn first
      const L = cx.el(name + ".lead", { x: 0, y: 0, w: 0, h: 0, kind: "connector", exit: "recede", parent: o.parent });
      const ax = E.x + hx, ay = E.y + h / 2, [px, py] = o.to;
      const str = svg("path", { d: `M${f1(px)} ${f1(py)} Q${f1((px + ax) / 2)} ${f1(Math.max(py, ay) + 26)} ${f1(ax)} ${f1(ay)}`, fill: "none", stroke: cx.c("ink"), "stroke-width": 2.5, "stroke-linecap": "round" }, L.inner);
      const pin = svg("circle", { cx: px, cy: py, r: 5, fill: cx.c("ink") }, L.inner);
      E.lead = L; E.__text = tw;
      if (o.t != null) {
        Loom.tween(pin, { opacity: 0 }, { opacity: 1, duration: 0.1 }, o.t, { kind: "reveal", beat: cx.beat.id, name: name + ".lead" });
        M.draw(str, o.t, { dur: 0.3 });
        M.settle(E, o.t + 0.2, { dy: 10, content: true });
        // written on: the word unmasks left to right after the tag has landed (never stepped: it is read)
        const id = Loom.uid("gttag"), cp = svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, svg("defs", {}, E.inner));
        const r = svg("rect", { x: 0, y: 0, width: 0, height: h }, cp);
        tw.setAttribute("clip-path", `url(#${id})`);
        Loom.tween(r, { attr: { width: 0 } }, { attr: { width: w }, duration: Math.max(0.35, o.text.length * 0.05), ease: Loom.ease.move }, o.t + 0.4, { kind: "reveal", beat: cx.beat.id, name, content: true, nostep: true });
      }
      return E;
    };
    set.__tag(ctx, "tag_plan", { x: 1388, y: 716, text: "one plan", to: [SHEET.x + 108, SHEET.y + 24], t: tPlan });

    /* ---------------- "Nobody says so": every gaze back to the front ---------------- */
    CAST.forEach((p, i) => people[p.name].look(0, 0.05, tNobody + i * STEP));
  },
});
