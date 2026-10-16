// @design leader_speaks_first: the result rewinds to the start of the meeting, then the leader stands and her goal is written on the shared board before anyone else speaks
/* b03 - Meet Dana. Medium frame on Dana, the board and the sheet (a cut on the same station: everything is held).
 * Treatments considered:
 *  (A) static + signalling: Dana already standing, the goal already on the board, a name tag. Rejected: the order is
 *      the lesson (F8, the leader's view arrives first), and the vote must visibly run back to the start.
 *  (B) Dana's goal as a speech bubble. Rejected: the set bible puts the team's shared surface on the board (a slot),
 *      and a bubble would read as one more private thought; the board is public.
 *  (C) CHOSEN: the stepped rewind on "Meet Dana" (stamp peels up and away, arms come down in three drawings, the
 *      clock's minute hand ticks back), the paper tag "Dana" pins at her shoulder, she stands in two drawings and opens
 *      to the room (present pose, never pointing) with her eyes on the board, and the goal is lettered onto the board
 *      in ochre as she says it, "Launch:" then "end of quarter". The colleagues' eyes go to the board one per step.
 * Accent: Dana's goal (accent2). The four seams stay red (the doubts are still there).
 */
Loom.scene("b03", {
  build(ctx) {
    const { m } = ctx;
    const svg = Loom.svg, S = ctx.style;
    const STEP = 1 / 6;

    const set = ctx.held("set");
    ["window_cloud", "table"].forEach((n) => ctx.held(n));
    const board = ctx.held("board"), clock = ctx.held("clock"), sheet = ctx.held("sheet"), stamp = ctx.held("stamp");
    const NAMES = ["dana", "p_date", "p_test", "p_support", "p_client"];
    const P = {}; NAMES.forEach((n) => { P[n] = ctx.held(n).__api; });
    const BUBS = ["bub_date", "bub_test", "bub_support", "bub_client"].map((n) => ctx.held(n));
    void board;

    const tMeet = ctx.cue("Meet Dana");
    const tName = ctx.cue("Dana");
    const tRuns = ctx.cue("She runs the team");
    const tLaunch = ctx.cue("launch");
    const tEnd = ctx.cue("end of the quarter");

    BUBS.forEach((E) => Loom.stepped.boil(E, ctx.start, ctx.end, { hz: 8, amp: 1.1 }));

    /* ---- "Meet Dana": the meeting rewinds to its start, in drawings ---- */
    // the stamp peels off and leaves upward (three drawings), the header goes back to plain paper
    Loom.stepped.on(stamp, { hz: 6 });
    Loom.tween(stamp.life, { y: 0, rotation: 0, opacity: 1, transformOrigin: "20% 80%" }, { y: -70, rotation: -14, opacity: 0, duration: 3 * STEP, ease: Loom.ease.exit }, tMeet, { kind: "exit", beat: ctx.beat.id, name: "stamp" });
    const header = sheet.__sheet.header;
    Loom.drive((e) => header.setAttribute("fill", S.mix(ctx.c("accent2"), ctx.c("field2"), e)), tMeet, 2 * STEP, Loom.stepped.ease("linear", 2 * STEP, 6), { kind: "recolour", beat: ctx.beat.id, name: "sheet.header", key: "sheet.header" });
    // arms down in three drawings, everyone together (a rewind is one gesture, not a vote)
    NAMES.forEach((n) => P[n].drawings(["hand_mid", "hand_low", "idle"], tMeet + 0.05));
    // the clock's minute hand ticks back a quarter turn in three drawings
    const H = clock.object && clock.object.hands;
    if (H) {
      const rot = (a) => H.minute.setAttribute("transform", `rotate(${a.toFixed(1)} ${H.cx} ${H.cy})`);
      Loom.drive((e) => rot(H.ma - 90 * e), tMeet, 3 * STEP, Loom.stepped.ease("move", 3 * STEP, 6), { kind: "value_travel", beat: ctx.beat.id, name: "clock.minute", content: true });
    }

    /* ---- "Dana": a paper tag pins beside her shoulder, written on; it rides with her when she stands ---- */
    const dana = ctx.held("dana");
    // local coords of Dana's element (rig scale 0.44, 176 x 396 box, shoulder at about (60, 186))
    const tag = set.__tag(ctx, "tag_dana", { x: -96, y: 214, text: "Dana", to: [62, 196], t: tName, parent: dana.inner });
    tag.exit = "recede";

    /* ---- "She runs the team": she stands in two drawings and opens to the room ---- */
    m.travel(dana, tRuns + 0.2, { y: -90, dur: 2 * STEP });
    P.dana.drawings(["explain", "present"], tRuns + 0.2);
    P.dana.look(-0.7, -0.9, tRuns + 0.2 + 2 * STEP);
    P.dana.emotion("happy", tRuns + 0.2);

    /* ---- "launch by the end of the quarter": her goal is lettered onto the board ---- */
    // the board's writing area is a Loom.slot (frame none): every change of words on it is a show on the spoken word
    // @form board_goal_lines: two hand-lettered lines written onto a held board, the second after the first
    const slot = Loom.slot(ctx, "board_slot", { x: 330, y: 180, w: 360, h: 210, frame: "none", role: "lead", t: false, exit: "recede" });
    const lines = [];
    const goal = (g, box) => {
      const K = ctx.kit;
      const a = K.text(g, "Launch:", { role: "lead", x: box.x + 28, y: box.y + 8, w: 300, h: 56, align: "left", valign: "middle", maxLines: 1, color: "accent2" });
      const b = K.text(g, "end of quarter", { role: "lead", x: box.x + 28, y: box.y + 64, w: 310, h: 56, align: "left", valign: "middle", maxLines: 1, color: "accent2" });
      // a hand-drawn underline under the deadline, drawn as the last word lands
      const u = svg("path", { d: `M${box.x + 30} ${box.y + 124} q120 6 250 -2`, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 4, "stroke-linecap": "round" }, g);
      lines.push(a, b, u);
    };
    goal.slotLabel = "Launch: end of quarter";
    goal.floor = 1.5;
    slot.show(goal, tLaunch, { how: "relabel" });
    // inside the slot's own write-on, each line is written on its own words (never stepped: it is read)
    const writeOn = (node, t, dur) => {
      const id = Loom.uid("gtw"), cp = svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, svg("defs", {}, node.parentNode));
      const r = svg("rect", { x: -10, y: -40, width: 0, height: 300 }, cp);   // slot-local coordinates
      node.setAttribute("clip-path", `url(#${id})`);
      Loom.tween(r, { attr: { width: 0 } }, { attr: { width: 380 }, duration: dur, ease: Loom.ease.move }, t, { kind: "reveal", beat: ctx.beat.id, name: "board_slot", content: true, nostep: true });
    };
    if (lines.length === 3) {
      writeOn(lines[0], tLaunch, 0.45);
      writeOn(lines[1], tEnd, 0.7);
      ctx.m.draw(lines[2], tEnd + 0.6, { dur: 0.35 });
    }

    /* ---- "end of the quarter": the colleagues' eyes go to the board, one per step ---- */
    ["p_date", "p_test", "p_support", "p_client"].forEach((n, i) => P[n].look(-1, -0.7, tEnd + 0.15 + i * STEP));
  },
});
