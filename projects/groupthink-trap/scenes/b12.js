// @design held_set_rewind: a held place shown in its last state runs its changes backwards in stepped drawings back to its opening state
/* b12 - "Keep those four doubts in mind. Now, rewind." (about 4.4 s; the torn-paper join brings it in from the left).
 *
 * Treatments considered:
 *  (A) a black card "Rewind" over the naming page (rejected: a word standing in for a picture; the films replay their
 *      own images, and the next five beats need the room in place).
 *  (B) static composition + signalling: the room in its opening state with the four folded bubbles ringed (rejected:
 *      the beat's content IS time running backwards; a still frame cannot say "rewind").
 *  (C) CHOSEN: the room redrawn exactly as b07 left it (arms up, lids pressed flat, the Agreed stamp, Dana standing,
 *      her goal on the board, the sheet drifted), one recall gesture on "four doubts" (a ghost of each object over
 *      its lid, all four at once, 0.5 s), then on "rewind" the clock's hands spin back and the meeting undoes itself
 *      in stepped drawings (hz 8): stamp off, arms down, lids spring back into folded bubbles, the goal un-writes
 *      right to left, the sheet slides back, Dana sits. It ends on the opening state that b13 to b17 hold.
 *
 * Reference rules taken (docs/research/vision/2026-10-05-tedEd-full-conclusions.md s7, style_guide techniques):
 *  a still camera on a moving drawing; hold the layout and change its state; people small and posed; hand-made time
 *  on fours (people stepped at hz 6, the rewind passage at hz 8); colour meanings fixed by the set bible (red = a
 *  doubt, ochre = the plan, teal = a habit).
 *
 * Cross-beat handles (b13 to b17 hold these elements by their set-bible names and change their state):
 *  - each person's rig api is kept on its element (E.rig), and the rig drives run to the last room beat (b17), so a
 *    held person can still be posed later;
 *  - each doubt bubble keeps its morphable outline, seam and crease on its element (E.bub);
 *  - the board's words area is empty at the end of this beat; b16 opens the board slot there.
 */
Loom.scene("b12", {
  build(ctx) {
    // b12 redraws the room on the same station as b01 to b07: hidden until its own torn join, or it would sit on top of
    // the first meeting from frame 0 (the pattern b09 uses)
    Loom.set(ctx.g, { opacity: 0 }, 0); Loom.set(ctx.g, { opacity: 1 }, ctx.start - 0.6);
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (...a) => Loom.svg(...a);
    const f = (v) => Math.round(v * 10) / 10;

    // the room's handles live until the last room beat (b17); after that the chapter cut retires everything
    const b17 = ((Loom.manifest && Loom.manifest.beats) || []).find((b) => b.id === "b17");
    const ROOM_END = b17 ? b17.end + 0.5 : ctx.end + 45;
    const ctxL = Object.assign({}, ctx, { end: ROOM_END });

    // ---------------- times (all from the narration) ----------------
    const tDoubts = ctx.cue("four doubts");
    const tNow = ctx.cue("Now, rewind");
    const tRw = ctx.cue("rewind");

    // ---------------- set bible geometry ----------------
    const PEOPLE = [
      // the cast exactly as b01 (C2 pass: dana, p_date, p_test and p_support had other skin or hair here, so the
      // "same people" of the replay were visibly different people)
      { name: "dana", rig: "tess", x: 560, skin: 1, hair: 1, top: "muted" },
      { name: "p_date", rig: "pip", x: 790, skin: 0, hair: 3, top: "shadow", key: "date" },
      { name: "p_test", rig: "tess", x: 1020, skin: 2, hair: 2, top: "field2", key: "test" },
      { name: "p_support", rig: "pip", x: 1250, skin: 3, hair: 0, top: "surface2", key: "support" },
      { name: "p_client", rig: "tess", x: 1480, skin: 0, hair: 4, top: "muted", key: "client" },
    ];
    const FEET = 760, SCALE = 0.44, STAND = 90;

    // ---------------- the room (scenery): wall, floor, window ----------------
    // set bible: ctx.scenery('room', 'set', {window: true, windowX: 1440, floor: 0.70})
    const room = ctx.scenery("room", "set", { window: true, windowX: 1440, floor: 0.70 });
    // b01's window light on the floor and the sill's shadow (the set bible's one window light)
    svg("path", { d: "M1440 756 L1862 756 L1700 1080 L1180 1080 Z", fill: S.c("surface"), opacity: 0.22 }, room.E.inner);
    svg("rect", { x: 1426, y: 558, width: 450, height: 6, fill: S.c("shadow"), opacity: 0.5 }, room.E.inner);

    // @form window_cloud_drift: one soft cloud drifting slowly inside a window's glass, the room's only ambient loop
    const cloud = ctx.el("cloud", { x: 1440, y: 151, w: 422, h: 389, kind: "scenery", exit: "recede" });
    {
      // b01's outlined puffs in the two upper panes (C2: a soft blob crossed the window bar here)
      const id = Loom.uid("gtcloud"), cdefs = svg("defs", {}, cloud.inner);
      svg("rect", { x: 0, y: 0, width: 208, height: 199 }, svg("clipPath", { id: id + "a" }, cdefs));
      svg("rect", { x: 214, y: 0, width: 208, height: 199 }, svg("clipPath", { id: id + "b" }, cdefs));
      const puff = (g, x, y, sc) => svg("path", { d: `M${x - 60 * sc} ${y + 14 * sc} q-6 ${-26 * sc} ${22 * sc} ${-26 * sc} q${10 * sc} ${-28 * sc} ${40 * sc} ${-20 * sc} q${22 * sc} ${-22 * sc} ${46 * sc} ${-2 * sc} q${28 * sc} ${-2 * sc} ${26 * sc} ${22 * sc} q${4 * sc} ${26 * sc} ${-24 * sc} ${26 * sc} z`, fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 3, "stroke-linejoin": "round" }, g);
      const pa = svg("g", { "clip-path": `url(#${id}a)` }, cloud.inner), pb = svg("g", { "clip-path": `url(#${id}b)` }, cloud.inner);
      puff(pa, 120, 92, 1.0); puff(pa, 300, 140, 0.7); puff(pb, 300, 140, 0.7); puff(pb, 120, 92, 1.0);
      m.drift(cloud, ctx.start, ROOM_END, { amp: 16, period: 4.8 });
    }

    // @form whiteboard_panel: a face-on whiteboard with an inner frame and a marker tray
    const board = ctx.el("board", { x: 300, y: 150, w: 420, h: 300, kind: "scenery", exit: "recede" });
    // b01's board, same pixels (its element box is 10 px up and left of this one, so the drawing is shifted back)
    svg("rect", { x: 4, y: 6, width: 420, height: 270, rx: 4, fill: S.c("shadow"), opacity: 0.35 }, board.inner);
    svg("rect", { x: 0, y: 0, width: 420, height: 270, rx: 4, fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 6, "stroke-linejoin": "round" }, board.inner);
    svg("rect", { x: 12, y: 12, width: 396, height: 246, rx: 2, fill: "none", stroke: S.c("surface2"), "stroke-width": 2 }, board.inner);
    svg("rect", { x: 100, y: 270, width: 220, height: 12, rx: 3, fill: S.c("surface2"), stroke: S.c("ink"), "stroke-width": 3 }, board.inner);
    svg("rect", { x: 130, y: 260, width: 46, height: 10, rx: 4, fill: S.c("muted"), stroke: S.c("ink"), "stroke-width": 2 }, board.inner);
    svg("rect", { x: 190, y: 261, width: 40, height: 9, rx: 4, fill: S.c("field2"), stroke: S.c("ink"), "stroke-width": 2 }, board.inner);

    // Dana's goal on the board, as b03 lettered it (ochre), drawn in the board's words area (x 330 to 690, y 180 to 390)
    const goal = ctx.el("board_goal", { x: 330, y: 180, w: 360, h: 210, kind: "text", exit: "none" });
    const goalG = svg("g", {}, goal.inner);
    // lettered as b03 wrote it (C2: this was the thin hand face, so the goal changed font across the cut)
    kit.text(goalG, "Launch:", { role: "lead", x: 28, y: 8, w: 300, h: 56, align: "left", valign: "middle", maxLines: 1, color: "accent2" });
    kit.text(goalG, "end of quarter", { role: "lead", x: 28, y: 64, w: 310, h: 56, align: "left", valign: "middle", maxLines: 1, color: "accent2" });
    svg("path", { d: "M30 124 q120 6 250 -2", fill: "none", stroke: S.c("accent2"), "stroke-width": 4, "stroke-linecap": "round" }, goalG);
    const goalClipId = Loom.uid("gtgoal");
    const goalClip = svg("rect", { x: 0, y: 0, width: 360, height: 210 }, svg("clipPath", { id: goalClipId, clipPathUnits: "userSpaceOnUse" }, goal.inner));
    goalG.setAttribute("clip-path", `url(#${goalClipId})`);

    // the clock: its hands spin back on "Now, rewind" (stepped, so it reads as drawn time going backwards)
    const clock = Loom.stepped.wrap(() => Loom.obj.draw(ctx, "clock", "clock", {
      x: 1080, y: 180, size: 90, family: "wall", tone: "field2", detail: 2, shadow: false,
      state: { time: 10.75, handTone: "ink" }, t0: tNow + 0.05, t1: tNow + 1.35, turns: -1.25,
    }), { hz: 8 });
    clock.exit = "none";

    // the wall veil: the story's mid band (b10 onward); b17 lifts it for the close
    // @form wall_veil: a faint ink wash over a back wall that sets a scene's light band and lifts later
    const veil = ctx.el("veil", { x: 0, y: 0, w: 1920, h: 756, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 756, fill: S.c("ink"), opacity: 0.06 }, veil.inner);

    // ---------------- the five people, in b07's end state ----------------
    // A raised hand that reads at this scale. The beans' own "wave" and "cheer" poses lift the arm BEHIND the big
    // head (seen in the first strip: no arm visible at 94.2 s), so the vote pose bends the elbow out past the head.
    // Registered as data on the two rigs this lesson casts, under a lesson-scoped name (the rig file is not edited).
    for (const r of ["pip", "tess"]) {
      const d = Loom.rig.defs[r];
      if (d && !d.poses.gt_hand_up) d.poses.gt_hand_up = { upper_l: 10, fore_l: 6, upper_r: -105, fore_r: -60, head: -3 };
    }
    const P = {};
    for (const p of PEOPLE) {
      const standing = p.name === "dana";
      const ch = Loom.stepped.wrap(() => ctxL.character(p.name, p.rig, {
        x: p.x, y: standing ? FEET - STAND : FEET, scale: SCALE, skin: p.skin, hair: p.hair, top: p.top, pose: "gt_hand_up",
      }), { hz: 6 });
      ch.E.rig = ch;
      ch.E.exit = "none";
      P[p.name] = ch;
    }

    // ---------------- the four doubt bubbles, pressed flat into lids ----------------
    // geometry: folded centred (x + 40, 330) about 80 x 60; open centred (x + 30, 270) about 180 x 150; the lid (b07)
    // is the folded outline pressed flat, centred (x + 40, 356), about 104 x 26
    const BUB = {};
    PEOPLE.filter((p) => p.key).forEach((p) => {
      const bx = p.x - 70, by = 185;                     // element origin: holds the open bubble and the tail dots
      // @form folded_doubt_bubble: a small folded wobble bubble with a crease and one thin red seam, two tail dots to the head
      const E = ctx.el("bub_" + p.key, { x: bx, y: by, w: 200, h: 225, kind: "bubble", exit: "none" });
      const L = (X, Y) => [X - bx, Y - by];
      const key = "gt-bub-" + p.key;
      const [fx, fy] = L(p.x + 40 - 40, 330 - 30);
      const [lx, ly] = L(p.x + 40 - 52, 356 - 13);
      const [ox, oy] = L(p.x + 30 - 90, 270 - 75);
      const D = {
        folded: Loom.treat.outline(fx, fy, 80, 60, "organic", key),
        lid: Loom.treat.outline(lx, ly, 104, 26, "organic", key + "-lid"),
        open: Loom.treat.outline(ox, oy, 180, 150, "organic", key + "-open"),
      };
      const seamD = {
        folded: `M${f(fx + 14)} ${f(fy + 47)} Q${f(fx + 40)} ${f(fy + 53)} ${f(fx + 66)} ${f(fy + 46)}`,
        lid: `M${f(lx + 14)} ${f(ly + 14)} Q${f(lx + 52)} ${f(ly + 17)} ${f(lx + 90)} ${f(ly + 13)}`,
      };
      // tail dots, from the bubble down to the head (head top is about y 419 when seated)
      const dots = svg("g", {}, E.inner);
      [[p.x + 24, 380, 6], [p.x + 13, 400, 4]].forEach(([X, Y, r]) => { const [a, b] = L(X, Y); svg("circle", { cx: a, cy: b, r, fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 2.5 }, dots); });
      const path = Loom.morph.path(E.inner, D.lid, { fill: "surface", sw: 3.2 });
      const crease = svg("path", { d: `M${f(fx + 22)} ${f(fy + 14)} Q${f(fx + 38)} ${f(fy + 30)} ${f(fx + 58)} ${f(fy + 36)}`, fill: "none", stroke: S.c("ink"), "stroke-width": 2.4, "stroke-linecap": "round", opacity: 0 }, E.inner);
      const seam = Loom.morph.path(E.inner, seamD.lid, { fill: "none", stroke: "accent", sw: 3.4 });
      seam.setAttribute("stroke-linecap", "round");
      E.bub = { path, seam, crease, dots, D, seamD, owner: p, L };
      BUB[p.key] = E;
    });

    // ---------------- the table, in front of the people ----------------
    // @form perspective_table: a long table top in perspective with a front panel, drawn in front of seated people
    const table = ctx.el("table", { x: 320, y: 640, w: 1400, h: 290, kind: "scenery", exit: "recede" });
    svg("ellipse", { cx: 700, cy: 265, rx: 760, ry: 22, fill: S.c("shadow"), opacity: 0.45 }, table.inner);   // under the legs, as b01
    svg("path", { d: "M0 150 H1400 V200 H0 Z", fill: S.c("shadow"), stroke: S.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, table.inner);
    svg("path", { d: "M100 0 H1300 L1400 150 H0 Z", fill: S.c("surface2"), stroke: S.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, table.inner);
    // b01's legs and wood grain (C2: this table had neither)
    [[52, 200], [1326, 200]].forEach(([x, y]) => table.inner.insertBefore(svg("rect", { x, y, width: 24, height: 62, rx: 3, fill: S.darken(S.c("shadow"), 0.18), stroke: S.c("ink"), "stroke-width": 4 }), table.inner.firstChild.nextSibling));
    { const rg = Loom.rng("table_grain");
      for (let i = 0; i < 9; i++) { const y = 660 + i * 14 + rg() * 6, x0 = 440 + rg() * 500, len = 120 + rg() * 260;
        svg("path", { d: `M${f(x0 - 320)} ${f(y - 640)} q${f(len / 2)} ${f(-3 + rg() * 6)} ${f(len)} 0`, fill: "none", stroke: S.c("shadow"), "stroke-width": 2, opacity: 0.55, "stroke-linecap": "round" }, table.inner); } }

    // ---------------- the plan sheet (drifted to 1065, 750 in b04) and the Agreed stamp ----------------
    // @form plan_sheet_perspective: a sheet lying on a table in perspective, ink lines and a small calendar glyph
    const sheet = ctx.el("sheet", { x: 1065 - 120, y: 750 - 42, w: 240, h: 84, kind: "document", exit: "none" });
    {
      const g = sheet.inner;
      sheet.paper = svg("path", { d: "M26 4 H214 L236 80 H4 Z", fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 4, "stroke-linejoin": "round" }, g);
      // the header strip: ochre only while the plan is the named thing (b17 recolours it)
      sheet.head = svg("path", { d: "M26 4 H214 L218 18 H22 Z", fill: S.c("shadow") }, g);
      [[30, 128, 32], [26, 120, 46], [22, 132, 60]].forEach(([x1, x2, y]) => svg("path", { d: `M${x1} ${y} H${x2}`, stroke: S.c("muted"), "stroke-width": 3, "stroke-linecap": "round" }, g));
      // the small calendar glyph: the plan's date (b17 moves it one column right: the date moved)
      const cal = svg("g", {}, g);
      svg("rect", { x: 146, y: 32, width: 30, height: 26, rx: 3, fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 2.5 }, cal);
      svg("rect", { x: 146, y: 32, width: 30, height: 8, fill: S.c("muted") }, cal);
      sheet.cal = cal;
    }
    // @form verdict_stamp: a short label stamped as a tilted outlined note, coloured to carry its valence
    // the same stamp treatment as b02 and b07, on the sheet (C2: the hand-drawn copy could not fit "Agreed" at the
    // label floor: text_overflow)
    const stamp = Loom.treat.label(ctx, "stamp", { x: 120, y: 42, text: "Agreed", as: "stamp", tone: "accent2", rot: -8, role: "label", parent: sheet.inner });
    stamp.exit = "none";

    // ---------------- "Keep those four doubts in mind": one recall gesture, all four lids at once ----------------
    // a faint ghost of each doubt's object over its lid (the red mark is the only colour in it)
    const GHOST = { date: drawCalendar, test: drawChecklist, support: drawHeadset, client: drawEnvelope };
    PEOPLE.filter((p) => p.key).forEach((p, i) => {
      // @form ghost_glimpse: a faint silhouette of a hidden object shown for a moment over the thing that hides it
      const G = ctx.el("ghost_" + p.key, { x: p.x + 40 - 40, y: 300 - 44, w: 80, h: 80, kind: "icon", exit: "recede" });
      const g = svg("g", {}, G.inner);
      GHOST[p.key](g, 40, 40, 62);
      Loom.tween(G.inner, { opacity: 0, y: 8 }, { opacity: 0.55, y: 0, duration: 0.22, ease: Loom.ease.enter }, tDoubts + i * 0.02, { kind: "reveal", beat: ctx.beat.id, name: G.name, content: true });
      Loom.tween(G.inner, { opacity: 0.55 }, { opacity: 0, duration: 0.24, ease: Loom.ease.exit }, tDoubts + 0.52, { kind: "exit", beat: ctx.beat.id, name: G.name });
      G.exitT = tDoubts + 0.52; G.exitKind = "fade";
    });

    // ---------------- "Now, rewind": the clock spins back and a paper tag names it ----------------
    // the clock spin is scheduled above (t0 = tNow); the tag is neutral paper (rewind is not a habit, not a doubt)
    Loom.treat.label(ctx, "tag_rewind", { x: 1205, y: 182, text: "rewind", tone: "surface", t: tNow + 0.05 });   // its notch touches the clock
    Loom.sfx("whoosh", tRw, { g: 0.6 });

    // ---------------- "rewind": the meeting undoes itself, in stepped drawings (hz 8), about 1.1 s ----------------
    Loom.stepped.wrap(() => {
      // 1. the stamp lifts off the sheet (the last thing that happened goes first)
      Loom.tween(stamp.inner, { y: 0, opacity: 1, rotation: 0, transformOrigin: "50% 50%" }, { y: -70, opacity: 0, rotation: 6, duration: 0.3, ease: Loom.ease.exit }, tRw, { kind: "exit", beat: ctx.beat.id, name: "stamp" });
      stamp.exitT = tRw; stamp.exitKind = "lift";
      // 2. lids spring back into folded bubbles, right to left (the reverse of the vote's order)
      ["client", "support", "test", "date"].forEach((k, i) => {
        const B = BUB[k].bub, t = tRw + 0.1 + i * 0.09;
        Loom.morph.to(B.path, B.D.folded, t, { dur: 0.42, name: "bub_" + k });
        Loom.morph.to(B.seam, B.seamD.folded, t, { dur: 0.42, name: "bub_" + k + ".seam" });
        Loom.tween(B.crease, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: Loom.ease.enter }, t + 0.22, { kind: "reveal", beat: ctx.beat.id, name: "bub_" + k + ".crease" });
      });
      // 3. the sheet slides back to the middle of the table (b04's drift undone)
      m.travel(sheet, tRw + 0.42, { x: 70, y: 0, dur: 0.38 });
      // 4. the goal un-writes, right to left
      Loom.tween(goalClip, { attr: { width: 360 } }, { attr: { width: 0 }, duration: 0.38, ease: Loom.ease.linear }, tRw + 0.5, { kind: "exit", beat: ctx.beat.id, name: "board_goal" });
    }, { hz: 8 });
    // arms come down (the rig steps on its own at hz 6), right to left, Dana last; then Dana sits
    ["p_client", "p_support", "p_test", "p_date", "dana"].forEach((n, i) => P[n].pose("idle", tRw + 0.1 + i * 0.09, { dur: 0.06 }));
    Loom.stepped.wrap(() => m.travel(P.dana.E, tRw + 0.6, { x: 0, y: STAND, dur: 0.33 }), { hz: 8 });
    goal.exitT = tRw + 0.5; goal.exitKind = "unwrite";

    // the held frame boils gently (bubbles only: the outlines that will change state next)
    PEOPLE.filter((p) => p.key).forEach((p) => Loom.stepped.boil(BUB[p.key], ctx.start, tRw - 0.05, { amp: 1.1 }));

    /* ---------------- the doubt objects, small (same drawings as b05 and b13 to b16) ---------------- */
    // @form tearoff_with_question: a tear-off calendar page with one red question mark on its day
    function drawCalendar(g, cx, cy, s) {
      Loom.obj.shape(g, "calendar", cx, cy, s, { family: "tearoff", tone: "muted", shadow: false, key: "gt-cal" });
      const w = s * 0.86, ht = s * 0.9, y = cy - ht / 2 + s * 0.04, hb = ht * 0.24, by = y + hb + s * 0.16, bh = ht * 0.42;
      const qx = cx, qy = by + bh / 2, q = s * 0.12;
      svg("path", { d: `M${f(qx - q * 0.8)} ${f(qy - q * 0.5)} Q${f(qx - q * 0.8)} ${f(qy - q * 1.4)} ${f(qx)} ${f(qy - q * 1.4)} Q${f(qx + q * 0.85)} ${f(qy - q * 1.4)} ${f(qx + q * 0.85)} ${f(qy - q * 0.6)} Q${f(qx + q * 0.85)} ${f(qy - q * 0.05)} ${f(qx)} ${f(qy + q * 0.15)} L${f(qx)} ${f(qy + q * 0.55)}`, fill: "none", stroke: S.c("accent"), "stroke-width": f(Math.max(3, s * 0.05)), "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      svg("circle", { cx: f(qx), cy: f(qy + q * 1.05), r: f(Math.max(2.5, s * 0.03)), fill: S.c("accent") }, g);
      void w;
    }
    // @form half_ticked_checklist: a clipboard with four boxes, two ticked, the two empty ones edged red
    function drawChecklist(g, cx, cy, s) {
      Loom.obj.shape(g, "document", cx, cy, s, { family: "clipboard", tone: "field2", shadow: false, detail: 1, key: "gt-check" });
      const w = s * 0.72, ht = s * 0.94, x = cx - w / 2, y = cy - ht / 2, b = s * 0.11;
      for (let i = 0; i < 4; i++) {
        const yy = y + ht * 0.27 + i * ht * 0.17, done = i < 2;
        svg("rect", { x: f(x + w * 0.14), y: f(yy), width: f(b), height: f(b), rx: 2, fill: "none", stroke: S.c(done ? "ink" : "accent"), "stroke-width": f(Math.max(2, s * 0.025)) }, g);
        svg("path", { d: `M${f(x + w * 0.14 + b * 1.6)} ${f(yy + b * 0.55)} H${f(x + w * 0.86)}`, stroke: S.c("muted"), "stroke-width": f(Math.max(2, s * 0.02)), "stroke-linecap": "round" }, g);
        if (done) svg("path", { d: `M${f(x + w * 0.14 + b * 0.15)} ${f(yy + b * 0.5)} l${f(b * 0.3)} ${f(b * 0.35)} l${f(b * 0.6)} ${f(-b * 0.75)}`, fill: "none", stroke: S.c("ink"), "stroke-width": f(Math.max(2, s * 0.03)), "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      }
    }
    // @form headset_object: a headset drawn as an object (band, two ear cups, a mic boom with a red tip)
    function drawHeadset(g, cx, cy, s) {
      const r = s * 0.34, sw = Math.max(3, s * 0.07);
      svg("path", { d: `M${f(cx - r)} ${f(cy + s * 0.06)} A${f(r)} ${f(r * 1.05)} 0 0 1 ${f(cx + r)} ${f(cy + s * 0.06)}`, fill: "none", stroke: S.c("ink"), "stroke-width": f(sw), "stroke-linecap": "round" }, g);
      [-1, 1].forEach((k) => svg("rect", { x: f(cx + k * r - s * 0.09), y: f(cy - s * 0.02), width: f(s * 0.18), height: f(s * 0.28), rx: f(s * 0.07), fill: S.c("muted"), stroke: S.c("ink"), "stroke-width": f(Math.max(2, s * 0.03)) }, g));
      svg("path", { d: `M${f(cx - r)} ${f(cy + s * 0.24)} Q${f(cx - r * 0.7)} ${f(cy + s * 0.44)} ${f(cx - s * 0.02)} ${f(cy + s * 0.4)}`, fill: "none", stroke: S.c("ink"), "stroke-width": f(Math.max(2, s * 0.035)), "stroke-linecap": "round" }, g);
      svg("circle", { cx: f(cx - s * 0.01), cy: f(cy + s * 0.4), r: f(Math.max(3, s * 0.055)), fill: S.c("accent") }, g);
    }
    // @form sealed_envelope: a closed envelope with a red wax seal on its flap
    function drawEnvelope(g, cx, cy, s) {
      Loom.obj.shape(g, "envelope", cx, cy, s, { family: "flap", tone: "surface2", shadow: false, key: "gt-env" });
      svg("circle", { cx: f(cx), cy: f(cy + s * 0.1), r: f(Math.max(4, s * 0.09)), fill: S.c("accent"), stroke: S.c("ink"), "stroke-width": 1.5 }, g);
    }
  },
});
