// @design attention_converges: a group of figures turn one by one to face a single focus while dashed sight lines converge on it
/* b02 - the post-mortem opens: the meeting room from above; every head turns to the engineer.
 *
 * Treatments considered:
 *  (A) static room with heads already turned (rejected: loses the turn, which IS the hook);
 *  (B) speech bubbles / pointing fingers (rejected: invents dialogue the script does not say, and
 *      says "blame" out loud where the narration wants the viewer to feel it);
 *  (C) CHOSEN: plan-view room, the heads swing one by one onto the engineer, then dashed sight lines
 *      converge and the frame freezes. The room's attention moving onto one person is the content.
 *
 * Deviation from the brief, on purpose: the heads start facing the pinned incident note on the
 * whiteboard (not the table centre). Facing the table centre, the top-right head would turn only ~1
 * degree, so the "swing" would not exist for it. Looking at the board first also gives the turn a
 * cause (the note) and lets b28 answer it by turning the same heads back to the board.
 *
 * Room geometry is SHARED with b28 (walls x 100-1860, y 90-900, door gap x 300-420; oval table at
 * (800,500) 760x300; heads at the six seats; whiteboard x 1440-1840, y 180-780). Do not change it here
 * without changing b28.
 */
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    const f = (v) => Math.round(v * 10) / 10;

    // ---------------------------------------------------------------- geometry (shared with b28)
    const ROOM = { x0: 100, y0: 90, x1: 1860, y1: 900, gapA: 300, gapB: 420 };
    const TABLE = { cx: 800, cy: 500, rx: 380, ry: 150 };
    const BOARD = { x: 1440, y: 180, w: 400, h: 600 };
    const NOTE_AT = { x: 1470, y: 220, scale: 0.6 };
    const NOTE_CENTRE = { x: NOTE_AT.x + 480 * NOTE_AT.scale / 2, y: NOTE_AT.y + 100 * NOTE_AT.scale / 2 };
    const ENG = { x: 470, y: 660 };
    const HEAD_R = 44, RING_R = 62;
    // the five peers, listed clockwise from the top-left head (this is also the turning order)
    const PEERS = [
      { name: "head_top_left", x: 480, y: 330, bend: 0 },
      { name: "head_top", x: 800, y: 300, bend: 0 },
      { name: "head_top_right", x: 1120, y: 330, bend: 0 },
      { name: "head_bottom_right", x: 1120, y: 670, bend: 90 }, // its line arcs over the table, clear of the bottom head
      { name: "head_bottom", x: 800, y: 700, bend: 0 },
    ];

    // ---------------------------------------------------------------- timing (all from speech + style)
    const tRoom = ctx.cue("Next morning");            // the room starts to be drawn
    const tOpen = ctx.cue("the post-mortem opens");   // the heads arrive as peers
    const tTurn = ctx.cue("head in the room");        // the first head begins to turn
    const tLines = ctx.cue("turns to the engineer");  // sight lines converge as the last head locks on
    const tCap = ctx.cue("the engineer");             // caption settles
    const turnDur = ctx.style.dur("move") * 1.25;     // ~0.45 s per turn
    const turnGap = ctx.style.dur("stagger") * 3.3;   // ~0.3 s between heads
    const popGap = ctx.style.dur("stagger") * 0.66;   // tight stagger for peers arriving
    const drawDur = ctx.style.dur("draw");

    // ---------------------------------------------------------------- the note (motif from b01)
    // It leaves with the camera and lands pinned on the board just as the board finishes drawing.
    const note = ctx.adopt("incident_note");
    const tBoard = tRoom + 0.25;
    const tLand = tBoard + drawDur * 0.6 + 0.02;
    if (note) ctx.travelTo(note, NOTE_AT, ctx.start - 0.5, tLand - (ctx.start - 0.5));

    // ---------------------------------------------------------------- room: walls (scaffold first)
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
    }
    m.draw(room, tRoom, { dur: drawDur });

    // ---------------------------------------------------------------- table
    const table = ctx.el("table", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    {
      const ell = (rx, ry) => `M${TABLE.cx - rx} ${TABLE.cy} A${rx} ${ry} 0 1 0 ${TABLE.cx + rx} ${TABLE.cy} A${rx} ${ry} 0 1 0 ${TABLE.cx - rx} ${TABLE.cy} Z`;
      const top = Loom.svg("g", { opacity: 0.3 }, table.inner);           // hachure tone, kept quiet
      kit.sketch(top, "path", [ell(TABLE.rx - 12, TABLE.ry - 12)], { fill: "muted", sw: 2 });
      const rim = Loom.svg("g", {}, table.inner);
      kit.sketch(rim, "path", [ell(TABLE.rx, TABLE.ry)], { fill: "none", sw: 5 });
    }
    m.draw(table, tRoom + 0.15, { dur: drawDur * 0.9 });

    // ---------------------------------------------------------------- whiteboard (face-on, right wall)
    // @form whiteboard_panel: a face-on whiteboard with an inner frame and a marker tray
    const board = ctx.el("board", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    {
      const g = Loom.svg("g", {}, board.inner);
      kit.sketch(g, "rectangle", [BOARD.x, BOARD.y, BOARD.w, BOARD.h], { fill: "surface", sw: 6 });
      kit.sketch(g, "rectangle", [BOARD.x + 14, BOARD.y + 14, BOARD.w - 28, BOARD.h - 28], { fill: "none", stroke: "muted", sw: 2 });
      kit.line(g, BOARD.x + 60, BOARD.y + BOARD.h + 14, BOARD.x + BOARD.w - 60, BOARD.y + BOARD.h + 14, { sw: 5 }); // marker tray
    }
    m.draw(board, tBoard, { dur: drawDur * 0.6 });

    // ---------------------------------------------------------------- people (top-down heads)
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

    // @form turning_head: a top-down head with shoulders and a nose tick that rotates to face a target
    const heads = PEERS.map((P, i) => {
      const E = ctx.el(P.name, { x: P.x - 80, y: P.y - 80, w: 160, h: 160, kind: "character", exit: "recede" });
      const rot = person(E, 80, 80, { x: TABLE.cx, y: TABLE.cy });
      const a0 = facing(P, NOTE_CENTRE);        // looking at the note on the board
      const a1 = a0 + wrap180(facing(P, ENG) - a0); // shortest way round onto the engineer
      rot.setAttribute("transform", `rotate(${f(a0)} 80 80)`);
      m.pop(E, tOpen + i * popGap, { overshoot: false });
      Loom.drive((e) => rot.setAttribute("transform", `rotate(${(a0 + (a1 - a0) * e).toFixed(2)} 80 80)`),
        tTurn + i * turnGap, turnDur, "editorial", { kind: "value_travel", beat: ctx.beat.id, name: P.name, content: true });
      return { P, E };
    });

    // ---------------------------------------------------------------- the engineer (does not turn: looks at the table)
    const eng = ctx.el("engineer", { x: ENG.x - 120, y: ENG.y - 90, w: 240, h: 210, kind: "character", exit: "recede" });
    {
      const rot = person(eng, 120, 90, { x: TABLE.cx, y: TABLE.cy });
      rot.setAttribute("transform", `rotate(${f(facing(ENG, { x: TABLE.cx, y: TABLE.cy }))} 120 90)`);
      kit.sketch(Loom.svg("g", {}, eng.inner), "circle", [120, 90, RING_R * 2], { fill: "none", stroke: "accent2", sw: 5 });
      kit.text(eng.inner, "engineer", { role: "label", x: 20, y: 156, w: 200, h: 48, maxLines: 1, align: "center", color: "ink" });
    }
    m.pop(eng, tOpen + PEERS.length * popGap, { overshoot: false });

    // ---------------------------------------------------------------- sight lines (dashed, head to engineer)
    // @form gaze_lines: dashed lines converging from several heads onto one focus
    const sight = ctx.el("sight_lines", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });
    const lines = heads.map(({ P }) => {
      const dx = ENG.x - P.x, dy = ENG.y - P.y, L = Math.hypot(dx, dy), d = { x: dx / L, y: dy / L };
      const mid = { x: (P.x + ENG.x) / 2, y: (P.y + ENG.y) / 2 };
      const C = { x: mid.x - d.y * P.bend, y: mid.y + d.x * P.bend };
      const un = (a, b) => { const l = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }; };
      const uS = un(P, C), uT = un(ENG, C);
      const S0 = { x: P.x + uS.x * (HEAD_R + 18), y: P.y + uS.y * (HEAD_R + 18) };
      const T0 = { x: ENG.x + uT.x * (RING_R + 10), y: ENG.y + uT.y * (RING_R + 10) };
      const N = 160, pts = [], cum = [0];
      for (let k = 0; k <= N; k++) {
        const t = k / N, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
        pts.push({ x: a * S0.x + b * C.x + c * T0.x, y: a * S0.y + b * C.y + c * T0.y });
        if (k) cum.push(cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
      }
      const total = cum[N];
      const at = (s) => { // point at arc length s
        let lo = 0, hi = N;
        while (hi - lo > 1) { const mid2 = (lo + hi) >> 1; if (cum[mid2] < s) lo = mid2; else hi = mid2; }
        const span = cum[hi] - cum[lo] || 1, q = (s - cum[lo]) / span;
        return { x: pts[lo].x + (pts[hi].x - pts[lo].x) * q, y: pts[lo].y + (pts[hi].y - pts[lo].y) * q };
      };
      const DASH = 16, PERIOD = 28, segs = [];
      const g = Loom.svg("g", {}, sight.inner);
      for (let s0 = 0; s0 < total - 6; s0 += PERIOD) {
        const s1 = Math.min(s0 + DASH, total);
        let dd = "";
        for (let q = 0; q <= 3; q++) { const p = at(s0 + (s1 - s0) * q / 3); dd += (q ? "L" : "M") + f(p.x) + " " + f(p.y) + " "; }
        const seg = kit.path(g, dd, { stroke: "accent", sw: 3.4 });
        seg.setAttribute("opacity", "0");
        segs.push({ seg, s0 });
      }
      return { total, segs };
    });
    sight.revealT = tLines; sight.revealKind = "draw";
    Loom.drive((e) => {
      for (const ln of lines) {
        const reach = e * ln.total;   // every line reaches the engineer at the same moment
        for (const sg of ln.segs) sg.seg.setAttribute("opacity", Math.max(0, Math.min(1, (reach - sg.s0) / 16)).toFixed(2));
      }
    }, tLines, drawDur * 0.8, "move", { kind: "draw", beat: ctx.beat.id, name: "sight_lines", content: true });

    // ---------------------------------------------------------------- caption (last; then the frame holds)
    const cap = ctx.el("caption", { x: 680, y: 815, w: 600, h: 56, kind: "text", exit: "wipe" });
    kit.kicker(cap.inner, "Every head turns", { x: 0, y: 0, w: 600, h: 56, align: "center", color: "ink" });
    m.settle(cap, tCap, { dy: 14 });
  },
});
