// @design pull_back_into_own_schedule: the story's room shrinks into one slot of the viewer's own week, one slot is chosen and the practice is pinned on it
/* b20 - "One said doubt can make the next easier. So pick one decision this week. Choose a habit before it starts.
 *        If you run it, speak last."
 * Treatments considered (lnd-motion-choreography-loop):
 *  (A) a checklist card "this week: 1. pick a decision 2. choose a habit 3. speak last" (rejected: a tip list; the
 *      transfer is a change of SCALE, from Dana's table to the viewer's own week, and a list cannot show it);
 *  (B) cut to an empty planner, then draw the room into one slot (rejected: a cut loses the link; the room must BE
 *      one of the viewer's meetings, so the camera has to carry it out);
 *  (C) CHOSEN: the camera join pulls out of b19's room (2.4 s, editorial ease) and the room becomes the lifted
 *      Wednesday block of a paper wall planner, Monday to Friday, other blocks blank (no names, no times, nothing
 *      invented). The planner and the miniature room are drawn with no entrance and switched on just before the pull,
 *      so nothing pops when b19's own drawing switches off. On "pick one decision this week" a paper tag hangs from
 *      the block's corner and is written on; on "Choose a habit" four small habit objects (the same things as sec2:
 *      a blank board, a written card, the critic's tent card, the dotted premortem page; no words) fan out under the
 *      block, one per drawing; on "If you run it" a teal tag "speak last" pins onto the block's edge and the other
 *      three settle back, leaving the board.
 * Beat sheet: join (171.5 to 173.9) | "pick one decision" tag + write-on | "Choose a habit" 4 pops on sixes |
 *   "If you run it" teal tag, the three others settle back | rest; the blocks and the mug's steam boil.
 * Stress test: the speak-last tag must be read before the zoom (annotations leave at the end of speech, 182.96 s), so
 *   it lands on "If you run it" and its word is written by "speak last" (about 1.3 s readable). The Wednesday block
 *   keeps its frame and miniature room to the end: b21 zooms back in through it.
 * Rules taken from the references (TED-Ed s7; style guide pull_back_scale_reveal, frame_within_frame,
 * label_on_object_with_its_word): a still camera on a moving drawing; the join comes from the material in the frame
 * (the room itself); hand-made time on sixes for objects, never on words.
 */
Loom.scene("b20", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (tag, a, p) => Loom.svg(tag, a, p);
    const STEP = 1 / 6;

    const tPick = ctx.cue("pick one decision this week");
    const tChoose = ctx.cue("Choose a habit before it starts");
    const tRun = ctx.cue("If you run it");
    const tLast = ctx.cue("speak last");
    // the camera join's window (compose writes it on the scene); the planner must be complete before it starts
    const jw = (ctx.def && ctx.def.join_window) || [ctx.start - 0.45, ctx.start + 1.95];
    const tOn = jw[0] - 0.1;
    // the week station sits UNDER b19's room (the room is nested in it): switched on just before the pull
    Loom.set(ctx.g, { opacity: 0 }, 0);
    Loom.set(ctx.g, { opacity: 1 }, tOn);

    // ------------------------------------------------------------------ the wall and the desk edge
    // @form wall_and_desk_edge: a plain wall with the near edge of a desk along the bottom, a mug and a pen on it
    const wall = ctx.el("wall", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: S.c("surface2") }, wall.inner);
    svg("rect", { x: 0, y: 952, width: 1920, height: 128, fill: S.c("field2") }, wall.inner);
    svg("path", { d: "M0 952 H1920", stroke: S.c("ink"), "stroke-width": 5 }, wall.inner);
    // a pen and a mug on the desk (far props); the mug's steam is the ambient loop
    svg("rect", { x: 210, y: 978, width: 150, height: 14, rx: 7, fill: S.c("muted"), stroke: S.c("ink"), "stroke-width": 3, transform: "rotate(-6 285 985)" }, wall.inner);
    const mug = ctx.el("mug", { x: 1690, y: 880, w: 140, h: 150, kind: "prop", exit: "none" });
    {
      const g = mug.inner;
      svg("path", { d: "M96 96 q34 0 34 26 q0 26 -34 24", fill: "none", stroke: S.c("ink"), "stroke-width": 7, "stroke-linecap": "round" }, g);
      svg("path", { d: "M20 86 H100 L94 148 Q60 156 26 148 Z", fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, g);
      svg("ellipse", { cx: 60, cy: 86, rx: 40, ry: 8, fill: S.c("muted"), stroke: S.c("ink"), "stroke-width": 4 }, g);
      const steam = svg("g", {}, g);
      [[44, 70], [70, 62]].forEach(([x, y]) => svg("path", { d: `M${x} ${y} q-10 -14 0 -26 q10 -12 0 -26`, fill: "none", stroke: S.c("muted"), "stroke-width": 4, "stroke-linecap": "round" }, steam));
      Loom.stepped.boil(mug, tOn, ctx.end + 1.5, { hz: 8, amp: 1.4 });
    }

    // ------------------------------------------------------------------ the planner: Monday to Friday, blank blocks
    // Five columns centred on the Wednesday block (760..1160): centres 272, 616, 960, 1304, 1648, 344 apart.
    const CX = [272, 616, 960, 1304, 1648], CW = 344;
    // @form wall_planner_week: a paper week planner on a wall, ring binding, one column per day, faint hour lines
    const planner = ctx.el("planner", { x: 80, y: 56, w: 1760, h: 880, kind: "scenery", exit: "none" });
    {
      const g = planner.inner, ox = 80, oy = 56;
      svg("rect", { x: 10, y: 14, width: 1760, height: 870, rx: 10, fill: S.c("shadow"), opacity: 0.35 }, g);
      svg("rect", { x: 0, y: 0, width: 1760, height: 870, rx: 10, fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 6 }, g);
      svg("rect", { x: 3, y: 3, width: 1754, height: 46, fill: S.c("muted") }, g);
      svg("path", { d: "M0 50 H1760", stroke: S.c("ink"), "stroke-width": 4 }, g);
      for (let i = 0; i < 14; i++) {   // the ring binding
        const x = 80 + i * 124;
        svg("ellipse", { cx: x, cy: 4, rx: 9, ry: 20, fill: "none", stroke: S.c("ink"), "stroke-width": 5 }, g);
      }
      // faint hour lines (no times: nothing is invented)
      for (let y = 200; y <= 860; y += 66) svg("path", { d: `M24 ${y - oy} H1736`, stroke: S.c("surface2"), "stroke-width": 2 }, g);
      // column rules and the header rule
      CX.slice(1).forEach((c) => svg("path", { d: `M${c - CW / 2 - ox} 60 V856`, stroke: S.c("surface2"), "stroke-width": 3 }, g));
      svg("path", { d: `M24 ${178 - oy} H1736`, stroke: S.c("ink"), "stroke-width": 3 }, g);
    }
    // the day names (the only words on the planner)
    const days = ctx.el("day_names", { x: 100, y: 116, w: 1720, h: 56, kind: "text", exit: "none" });
    ["Mon", "Tue", "Wed", "Thu", "Fri"].forEach((d, i) => kit.text(days.inner, d, { role: "label", x: CX[i] - 100 - 120, y: 0, w: 240, h: 56, align: "center", valign: "middle", maxLines: 1, color: i === 2 ? "ink" : "muted" }));
    // blank meeting blocks: no names, no times
    // @form blank_meeting_block: a blank rounded block in a planner column standing for one meeting
    const BLOCKS = [[0, 236, 330], [0, 470, 590], [0, 724, 800], [1, 236, 336], [1, 520, 600], [2, 228, 318],
      [3, 236, 352], [3, 520, 612], [4, 262, 398], [4, 556, 636], [4, 744, 832]];
    const blocks = ctx.el("blocks", { x: 80, y: 220, w: 1760, h: 620, kind: "scenery", exit: "none" });
    BLOCKS.forEach(([c, y0, y1], i) => {
      const x = CX[c] - CW / 2 + 16 - 80;
      svg("rect", { x, y: y0 - 220, width: CW - 32, height: y1 - y0, rx: 10, fill: S.c(i % 2 ? "field2" : "surface2"), stroke: S.c("ink"), "stroke-width": 3 }, blocks.inner);
      svg("path", { d: `M${x + 18} ${y0 - 220 + 22} H${x + 18 + 70}`, stroke: S.c("muted"), "stroke-width": 4, "stroke-linecap": "round" }, blocks.inner);
    });
    Loom.stepped.boil(blocks, jw[1], ctx.end + 1.5, { hz: 8, amp: 0.9 });

    // ------------------------------------------------------------------ the Wednesday block: b19's room in miniature
    // Station 'meet' is nested here (rect 760, 420, 400, 225; scale 0.2083). The miniature copies b19's end state
    // (Dana standing at a clear board, five cards up, four red marks), drawn by the same Loom.gt code, so when b19's
    // drawing switches off after the pull nothing moves.
    const BX = 760, BY = 420, BW = 400, BH = 225, k = BW / 1920;
    // @form lifted_slot_frame: one slot of a schedule lifted above its neighbours, framed, holding a picture
    const wed = ctx.el("wed_block", { x: BX - 16, y: BY - 16, w: BW + 44, h: BH + 46, kind: "scenery", exit: "none" });
    svg("rect", { x: 30, y: 34, width: BW, height: BH, rx: 4, fill: S.c("shadow"), opacity: 0.45 }, wed.inner);
    const cid = Loom.uid("gtwed");
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080 }, svg("clipPath", { id: cid }, svg("defs", {}, wed.inner)));
    const mini = svg("g", { transform: `translate(16 16) scale(${k.toFixed(6)})`, "clip-path": `url(#${cid})` }, wed.inner);
    const MR = Loom.gt.room(ctx, { pre: "mini_", parent: mini, t0: tOn, t1: ctx.end + 1.5, from: tOn, standing: ["dana"] });
    Object.values(MR.people).forEach((p) => { p.pose("idle", tOn); p.emotion("neutral", tOn); p.look(0, -0.1, tOn); });
    const cards = ctx.el("mini_cards", { x: 0, y: 0, w: 1920, h: 1080, kind: "prop", exit: "none", parent: mini });
    [[560, false], [790, true], [1020, true], [1250, true], [1480, true]].forEach(([x, mk]) => Loom.gt.cardUp(ctx, cards.inner, x, 652, mk));
    svg("rect", { x: 16, y: 16, width: BW, height: BH, rx: 3, fill: "none", stroke: S.c("ink"), "stroke-width": 6 }, wed.inner);

    // ------------------------------------------------------------------ "So pick one decision this week": a tag hangs from the block's corner
    const tagOne = Loom.gt.tag(ctx, "tag_one_decision", { x: 930, y: 364, text: "one decision this week", side: "right", to: [1150, 428], t: tPick });
    void tagOne;

    // ------------------------------------------------------------------ "Choose a habit before it starts": four habit objects fan out
    const HAB = [
      { name: "habit_board", x: 744, y: 762 },     // speak last: the board it was written on
      { name: "habit_card", x: 886, y: 806 },      // write first: a written card
      { name: "habit_tent", x: 1036, y: 806 },     // a named critic: the tent card
      { name: "habit_page", x: 1178, y: 762 },     // a premortem: the dotted pretend page
    ];
    const draw = {
      // @form mini_whiteboard: a small face-on whiteboard with a tray, no words
      habit_board(g) {
        svg("rect", { x: 6, y: 8, width: 84, height: 58, rx: 3, fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 4 }, g);
        svg("rect", { x: 28, y: 66, width: 40, height: 6, rx: 2, fill: S.c("surface2"), stroke: S.c("ink"), "stroke-width": 2.5 }, g);
      },
      // @form note_card_upright: a small card turned up on a table, two scribbled lines and an optional red mark
      habit_card(g) {
        svg("rect", { x: 8, y: 12, width: 80, height: 56, rx: 4, fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 4 }, g);
        svg("path", { d: "M20 32 q6 -6 12 0 t12 0 t12 0 t12 0", fill: "none", stroke: S.c("muted"), "stroke-width": 3.5, "stroke-linecap": "round" }, g);
        svg("path", { d: "M20 48 q6 -6 12 0 t12 0 t12 0", fill: "none", stroke: S.c("muted"), "stroke-width": 3.5, "stroke-linecap": "round" }, g);
      },
      // @form tent_card_role: a folded tent card standing on a table, lettered with a role, in the habit colour
      habit_tent(g) {
        svg("path", { d: "M14 24 H82 L88 30 H8 Z", fill: S.darken(S.c("accent3"), 0.22), stroke: S.c("ink"), "stroke-width": 3 }, g);
        svg("path", { d: "M8 30 H88 L84 64 H12 Z", fill: S.c("accent3"), stroke: S.c("ink"), "stroke-width": 3.5, "stroke-linejoin": "round" }, g);
      },
      // @form dotted_pretend_page: a page with a dotted border standing for an imagined future
      habit_page(g) {
        svg("rect", { x: 18, y: 4, width: 60, height: 74, rx: 3, fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 3.5 }, g);
        svg("rect", { x: 26, y: 12, width: 44, height: 58, fill: "none", stroke: S.c("muted"), "stroke-width": 3, "stroke-dasharray": "3 6", "stroke-linecap": "round" }, g);
      },
    };
    const habits = HAB.map((h, i) => {
      // drawn on a 96 x 80 grid and shown at 1.3x (they read at the wide frame)
      const E = ctx.el(h.name, { x: h.x - 63, y: h.y - 52, w: 126, h: 106, kind: "prop", exit: "recede" });
      const g = svg("g", { transform: "scale(1.3)" }, E.inner);
      svg("ellipse", { cx: 48, cy: 76, rx: 36, ry: 4, fill: S.c("shadow"), opacity: 0.45 }, g);
      draw[h.name](g);
      Loom.stepped.on(E, { hz: 6 });
      // they come out from under the block, one per drawing (pop: small accents only)
      m.pop(E, tChoose + 0.1 + i * STEP, { dur: 2 * STEP, content: true });
      return E;
    });
    Loom.sfx("card", tChoose + 0.1, { g: 0.5 });

    // ------------------------------------------------------------------ "If you run it, speak last": the habit pinned on the block
    // the accent_on: the teal tag on the block's edge (the board stays out, the other three settle back)
    Loom.gt.tag(ctx, "tag_speak_last", { x: 1236, y: 556, text: "speak last", fill: "accent3", role: "lead", t: tRun });
    habits.slice(1).forEach((E, i) => {
      Loom.tween(E.life, { opacity: 1, y: 0 }, { opacity: 0.3, y: -14, duration: 0.34, ease: Loom.stepped.ease(Loom.ease.move, 0.34, 6), immediateRender: false }, tLast + i * 0.06, { kind: "state", beat: ctx.beat.id, name: E.name, content: true });
    });
    Loom.sfx("land", tRun + 0.2, { g: 0.5 });
  },
});
