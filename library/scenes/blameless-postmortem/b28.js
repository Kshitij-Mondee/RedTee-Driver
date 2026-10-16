// @design attention_converges: a group of figures turn one by one to face a single focus while dashed sight lines converge on it
/* b28 - the payoff: the same room, later. Every head swings from the engineer to the whiteboard, where
 * each of the three conditions now carries an owned fix.
 *
 * Treatments considered:
 *  (A) a static board of three owned fixes over a still room (rejected: the payoff is attention moving
 *      somewhere new; a still would lose the turn that answers the hook);
 *  (B) a cross-fade from b02's frame to a new room (rejected: a dissolve says "time passed", not "the
 *      same people, looking somewhere else"; and the engine forbids a crossfade under a move);
 *  (C) CHOSEN: redraw b02's room (same walls, door gap, table, heads, order and turn timing), hold b02's
 *      frozen end state for a breath (every head on the engineer), then run b02's gesture in reverse: the
 *      same heads, the same clockwise order, the same stagger and turn time, now swinging onto the board.
 *      The board fills top-down with three owned, ticked fixes.
 * Deliberately not doing: owner names or dates (the script gives none), a second emphasis (the turn is
 * the one), any motion after the last tick.
 *
 * Revision (reviewer: payoff content was the smallest thing on screen, 21 elements, six crossing lines):
 *  - the whiteboard is 620 px wide (was 400) and the table, heads and engineer sit 150 px further left so
 *    the fixes read at body size (label 40 px) with legible owner chips;
 *  - the six dashed sight lines are gone: the noses show the turn, and only the two heads nearest the
 *    board draw one thin dashed line each, converging on the board, which fades out once the heads have
 *    turned (so nothing crosses and nothing stays behind to compete with the fixes);
 *  - elements folded: the five peers are one group, each row carries its own owner chip, the three ticks
 *    are one group (21 elements -> 12).
 * Continuity note: walls, door gap and table size are b02's; the table, heads and board are shifted or
 * widened as above, which is a deliberate departure from b02's exact geometry.
 */
Loom.scene("b28", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const f = (v) => Math.round(v * 10) / 10;

    // ---------------------------------------------------------------- geometry
    const ROOM = { x0: 100, y0: 90, x1: 1860, y1: 900, gapA: 300, gapB: 420 };
    const DX = -150;                                       // the table and everyone at it shift left
    const TABLE = { cx: 800 + DX, cy: 500, rx: 380, ry: 150 };
    const BOARD = { x: 1220, y: 180, w: 620, h: 600 };     // widened from 400 so the fixes read at body size
    const NOTE_AT = { x: 1250, y: 210, w: 380, h: 64 };
    const ENG = { x: 470 + DX, y: 660 };
    const HEAD_R = 44, RING_R = 62;
    // the five peers, clockwise from the top-left head (this is also the turning order, as in b02)
    const PEERS = [
      { name: "head_top_left", x: 480 + DX, y: 330 },
      { name: "head_top", x: 800 + DX, y: 300 },
      { name: "head_top_right", x: 1120 + DX, y: 330 },
      { name: "head_bottom_right", x: 1120 + DX, y: 670 },
      { name: "head_bottom", x: 800 + DX, y: 700 },
    ];
    // everyone looks at the same spot on the board's left edge
    const TARGET = { x: BOARD.x - 6, y: 480 };
    const FAN = ["head_top_right", "head_bottom_right"];   // only the heads nearest the board get a line
    // the fixes, one per condition (icons as b12, b20, b23), each with an owner chip and a tick
    const FIXES = [
      { key: "test", icon: "flask-conical", label: "checkout test" },
      { key: "staging", icon: "sliders-horizontal", label: "staging setting" },
      { key: "alert", icon: "bell-off", label: "alert to on-call" },
    ];
    const RX = 1250, RW = 560, RH = 154, RY0 = 284, RGAP = 6;   // rows 146 -> 154 (gap 8 -> 6, top 292 -> 284) so the owner chip fits inside its row
    // measure, then draw: the chip is sized from its "Owner" label (inset >= max(6, 0.2 x size) + 4 px slack)
    const ownFit = kit.fit("Owner", { role: "label", w: 146, maxLines: 1, weight: 700, size: 30 });
    const ownNeed = Math.max(6, 0.2 * ownFit.size);
    const CHIP = { x: 22, y: 86, w: Math.max(210, Math.ceil(54 + ownFit.width + ownNeed + 8)), h: Math.ceil(ownFit.height + 2 * ownNeed + 4) };

    // ---------------------------------------------------------------- timing (speech + style only)
    const tRoom = ctx.cue("Same room", 0.25);          // the walls lead the words a little: canvas leads content
    const tPeers = ctx.cue("Same engineer");           // the peers arrive, already facing b02's end state
    const tEng = ctx.cue("engineer");                  // the engineer and the ring settle on the name
    const tTurn = ctx.cue("every head");               // the first head begins to turn
    const tRows = ctx.cue("each fix");                 // the board fills, top-down
    const tCap = ctx.cue("fix has");                   // the caption settles
    const tOwn = ctx.cue("an owner");                  // ticks, together
    const turnDur = S.dur("move") * 1.25;              // same as b02 (~0.45 s per turn)
    const turnGap = S.dur("stagger") * 3.3;            // same as b02 (~0.3 s between heads)
    const drawDur = S.dur("draw");
    const tLines = tTurn + 3 * turnGap + turnDur - 0.1;   // as the second right-hand head locks on
    const dLines = drawDur * 0.7;
    const tFade = tLines + dLines + 0.1;

    // ---------------------------------------------------------------- room: walls + table (scaffold first)
    const room = ctx.el("room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    {
      const g = Loom.svg("g", {}, room.inner);
      const w = { sw: 7 };
      kit.line(g, ROOM.x0, ROOM.y0, ROOM.x1, ROOM.y0, w);
      kit.line(g, ROOM.x0, ROOM.y0, ROOM.x0, ROOM.y1, w);
      kit.line(g, ROOM.x1, ROOM.y0, ROOM.x1, ROOM.y1, w);
      kit.line(g, ROOM.x0, ROOM.y1, ROOM.gapA, ROOM.y1, w);
      kit.line(g, ROOM.gapB, ROOM.y1, ROOM.x1, ROOM.y1, w);
      kit.line(g, ROOM.gapA, ROOM.y1 - 12, ROOM.gapA, ROOM.y1 + 12, w);   // door jambs
      kit.line(g, ROOM.gapB, ROOM.y1 - 12, ROOM.gapB, ROOM.y1 + 12, w);
      const ell = (rx, ry) => `M${TABLE.cx - rx} ${TABLE.cy} A${rx} ${ry} 0 1 0 ${TABLE.cx + rx} ${TABLE.cy} A${rx} ${ry} 0 1 0 ${TABLE.cx - rx} ${TABLE.cy} Z`;
      const top = Loom.svg("g", { opacity: 0.3 }, room.inner);           // hachure tone, kept quiet
      kit.sketch(top, "path", [ell(TABLE.rx - 12, TABLE.ry - 12)], { fill: "muted", sw: 2 });
      const rim = Loom.svg("g", {}, room.inner);
      kit.sketch(rim, "path", [ell(TABLE.rx, TABLE.ry)], { fill: "none", sw: 5 });
    }
    m.draw(room, tRoom, { dur: drawDur * 0.7 });

    // ---------------------------------------------------------------- whiteboard (face-on, right wall), drawn last
    const tBoard = tRoom + 0.2;
    const dBoard = drawDur * 0.6;
    // @form whiteboard_panel: a face-on whiteboard with an inner frame and a marker tray
    const board = ctx.el("board", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    {
      const g = Loom.svg("g", {}, board.inner);
      kit.sketch(g, "rectangle", [BOARD.x, BOARD.y, BOARD.w, BOARD.h], { fill: "surface", sw: 6 });
      kit.sketch(g, "rectangle", [BOARD.x + 14, BOARD.y + 14, BOARD.w - 28, BOARD.h - 28], { fill: "none", stroke: "muted", sw: 2 });
      kit.line(g, BOARD.x + 60, BOARD.y + BOARD.h + 14, BOARD.x + BOARD.w - 60, BOARD.y + BOARD.h + 14, { sw: 5 }); // marker tray
    }
    m.draw(board, tBoard, { dur: dBoard });

    // ---------------------------------------------------------------- the incident note, as b02 left it
    // @form tilted_note: a tilted outlined note pinned to a surface, naming one fact
    const note = ctx.el("incident_note", { x: NOTE_AT.x, y: NOTE_AT.y, w: NOTE_AT.w, h: NOTE_AT.h, kind: "token", exit: "recede" });
    {
      const ng = Loom.svg("g", { transform: `rotate(-2.5 ${NOTE_AT.w / 2} ${NOTE_AT.h / 2})` }, note.inner);
      Loom.svg("rect", { x: 0, y: 0, width: NOTE_AT.w, height: NOTE_AT.h, rx: 8, fill: S.c("surface") }, ng);
      kit.rect(ng, 0, 0, NOTE_AT.w, NOTE_AT.h, { fill: "none", stroke: "neg", sw: 3.5, r: 8 });
      kit.icon(ng, "shopping-cart", { x: 36, y: NOTE_AT.h / 2, size: 38, color: "neg" });
      kit.text(ng, "Orders stopped", { role: "label", x: 66, y: 0, w: NOTE_AT.w - 66 - 12, h: NOTE_AT.h, maxLines: 1, valign: "middle", weight: 800 });
    }
    m.reveal(note, tBoard + dBoard * 0.7, { dy: 10 });

    // ---------------------------------------------------------------- people (top-down heads), b02's drawing
    // A person: shoulders (fixed, the seat) + a rotating head (hair disc with a nose tick).
    // The head's nose points along +x at rotation 0; rotate(a lx ly) turns it about its OWN centre.
    function person(E, lx, ly, seatToward) {
      const dx = seatToward.x - (E.x + lx), dy = seatToward.y - (E.y + ly), L = Math.hypot(dx, dy) || 1;
      const u = { x: dx / L, y: dy / L }, v = { x: -u.y, y: u.x };
      const p0 = { x: lx - 62 * v.x - 10 * u.x, y: ly - 62 * v.y - 10 * u.y };
      const p1 = { x: lx + 62 * v.x - 10 * u.x, y: ly + 62 * v.y - 10 * u.y };
      const c = { x: lx - 80 * u.x, y: ly - 80 * u.y };
      kit.sketch(Loom.svg("g", {}, E.inner), "path", [`M${f(p0.x)} ${f(p0.y)} Q${f(c.x)} ${f(c.y)} ${f(p1.x)} ${f(p1.y)}`], { fill: "none", sw: 5 });
      const rot = Loom.svg("g", {}, E.inner);
      kit.disc(rot, lx, ly, HEAD_R, { fill: "ink" });
      kit.path(rot, `M${lx + HEAD_R - 4} ${ly} L${lx + HEAD_R + 14} ${ly}`, { stroke: "ink", sw: 7 });
      return rot;
    }
    const facing = (from, to) => Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
    const wrap180 = (a) => { while (a > 180) a -= 360; while (a <= -180) a += 360; return a; };

    const turners = [];   // {rot, cx, cy, a0, a1, name}
    // the five peers are ONE group (local coords = station coords), arriving together
    // @form turning_head: a top-down head with shoulders and a nose tick that rotates to face a target
    const peers = ctx.el("heads", { x: 0, y: 0, w: 1920, h: 1080, kind: "character", exit: "recede" });
    PEERS.forEach((P) => {
      const rot = person(peers, P.x, P.y, { x: TABLE.cx, y: TABLE.cy });
      const a0 = facing(P, ENG);                         // b02's frozen end state: on the engineer
      const a1 = a0 + wrap180(facing(P, TARGET) - a0);   // the short way round onto the board
      rot.setAttribute("transform", `rotate(${f(a0)} ${P.x} ${P.y})`);
      turners.push({ rot, cx: P.x, cy: P.y, a0, a1, name: P.name });
    });
    m.reveal(peers, tPeers, { dy: 0 });

    // ---------------------------------------------------------------- the engineer: ring, label, and (last) a turn
    const eng = ctx.el("engineer", { x: ENG.x - 120, y: ENG.y - 90, w: 240, h: 210, kind: "character", exit: "recede" });
    {
      const rot = person(eng, 120, 90, { x: TABLE.cx, y: TABLE.cy });
      const a0 = facing(ENG, { x: TABLE.cx, y: TABLE.cy });   // as b02: looking at the table
      const a1 = a0 + wrap180(facing(ENG, TARGET) - a0);
      rot.setAttribute("transform", `rotate(${f(a0)} 120 90)`);
      kit.sketch(Loom.svg("g", {}, eng.inner), "circle", [120, 90, RING_R * 2], { fill: "none", stroke: "accent2", sw: 5 });
      kit.text(eng.inner, "engineer", { role: "label", x: 20, y: 156, w: 200, h: 48, maxLines: 1, align: "center", color: "ink" });
      turners.push({ rot, cx: 120, cy: 90, a0, a1, name: "engineer" });
    }
    m.settle(eng, tEng, { dy: 18 });

    // ---------------------------------------------------------------- the turn: b02's gesture, reversed in meaning
    turners.forEach((T, k) => {
      Loom.drive((e) => T.rot.setAttribute("transform", `rotate(${(T.a0 + (T.a1 - T.a0) * e).toFixed(2)} ${T.cx} ${T.cy})`),
        tTurn + k * turnGap, turnDur, "editorial", { kind: "value_travel", beat: ctx.beat.id, name: T.name, content: true });
    });

    // ---------------------------------------------------------------- gaze: two thin dashed lines from the nearest heads, then gone
    // @form gaze_lines: dashed lines converging from several heads onto one focus
    const sight = ctx.el("gaze", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });
    const fade = Loom.svg("g", {}, sight.inner);
    const lines = PEERS.filter((P) => FAN.indexOf(P.name) >= 0).map((P) => {
      const d = Math.hypot(TARGET.x - P.x, TARGET.y - P.y);
      const u = { x: (TARGET.x - P.x) / d, y: (TARGET.y - P.y) / d };
      const s0 = HEAD_R + 20, total = d - s0;
      const DASH = 16, PERIOD = 28, segs = [];
      for (let o = 0; o < total - 6; o += PERIOD) {
        const o1 = Math.min(o + DASH, total);
        const a = { x: P.x + u.x * (s0 + o), y: P.y + u.y * (s0 + o) }, b = { x: P.x + u.x * (s0 + o1), y: P.y + u.y * (s0 + o1) };
        const seg = kit.path(fade, `M${f(a.x)} ${f(a.y)} L${f(b.x)} ${f(b.y)}`, { stroke: "accent", sw: 3.4 });
        seg.setAttribute("opacity", "0");
        segs.push({ seg, s0: o });
      }
      return { total, segs };
    });
    sight.revealT = tLines; sight.revealKind = "draw";
    Loom.drive((e) => {
      for (const ln of lines) {
        const reach = e * ln.total;   // both lines reach the board at the same moment
        for (const sg of ln.segs) sg.seg.setAttribute("opacity", Math.max(0, Math.min(1, (reach - sg.s0) / 16)).toFixed(2));
      }
    }, tLines, dLines, "move", { kind: "draw", beat: ctx.beat.id, name: "gaze", content: true });
    // once the heads have turned the lines fade, leaving the board alone for the fixes
    Loom.drive((e) => fade.setAttribute("opacity", (1 - e).toFixed(2)), tFade, 0.4, "exit", { kind: "fade", beat: ctx.beat.id, name: "gaze_fade", content: true });

    // ---------------------------------------------------------------- the board fills: three fixes, top-down
    const rowY = (i) => RY0 + i * (RH + RGAP);
    FIXES.forEach((F, i) => {
      // @form icon_label_card: a rounded card pairing an icon with a short label naming one item
      const R = ctx.el("board_fix_" + F.key, { x: RX, y: rowY(i), w: RW, h: RH, kind: "card", exit: "recede" });
      kit.rect(R.inner, 0, 0, RW, RH, { fill: "surface", r: 12, crisp: true });     // solid backing
      kit.rect(R.inner, 0, 0, RW, RH, { fill: "none", r: 12, sw: 3 });               // sketched outline
      Loom.th.iconDisc(ctx, R.inner, 54, 46, 32, F.icon, "accent2", "ink");
      kit.text(R.inner, F.label, { role: "body", x: 108, y: 6, w: RW - 108 - 16, h: 80, maxLines: 1, valign: "middle", weight: 700, size: 40 });
      // @form owner_chip: a small pill chip with a person icon and a role word
      // owner chip lives on its row
      kit.rect(R.inner, CHIP.x, CHIP.y, CHIP.w, CHIP.h, { fill: "surface2", r: CHIP.h / 2, sw: 2.6 });
      kit.icon(R.inner, "user-round", { x: CHIP.x + 28, y: CHIP.y + CHIP.h / 2, size: 28, color: "ink" });
      kit.text(R.inner, "Owner", { role: "label", x: CHIP.x + 54, y: CHIP.y, w: 146, h: CHIP.h, maxLines: 1, valign: "middle", weight: 700, size: ownFit.size });
      m.unmask(R, tRows + i * S.dur("stagger") * 1.3, { dur: S.dur("enter") * 0.9 });
    });

    // ---------------------------------------------------------------- caption (kicker, centred inside the room)
    const cap = ctx.el("caption", { x: 350, y: 815, w: 600, h: 56, kind: "text", exit: "wipe" });
    kit.kicker(cap.inner, "Each fix, an owner", { x: 0, y: 0, w: 600, h: 56, align: "center", color: "ink" });
    m.settle(cap, tCap, { dy: 14 });

    // ---------------------------------------------------------------- ticks: one group of peers, on the word "owner"
    // @form outcome_tick: a tick or cross mark landing on an item to show its result
    const ticks = ctx.el("fix_ticks", { x: RX, y: RY0, w: RW, h: 3 * RH + 2 * RGAP, kind: "mark", exit: "recede" });
    FIXES.forEach((F, i) => kit.mark(ticks.inner, "yes", RW - 52, i * (RH + RGAP) + CHIP.y + CHIP.h / 2, 52));
    m.settle(ticks, tOwn, { dy: 8 });
  },
});
