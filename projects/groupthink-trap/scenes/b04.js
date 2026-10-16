// @design fast_yes_tilts_room: one early yes is spoken aloud, then the whole held tableau (the shared object and every posture) drifts one step at a time towards the leader
/* b04 - the fast yes. Same medium frame as b03 (continue: everything is held, nothing re-enters).
 * Treatments considered (lnd-motion-choreography-loop):
 *  (A) static + signalling: the bubble already open, the people already leaning, a highlight on the bubble. Rejected:
 *      the lesson here is ORDER (one early yes, THEN the room follows); a still frame shows the result, not the drift.
 *  (B) cut to a close two-shot of Dana and the fast yes for the line, then back to the medium for the drift. Rejected:
 *      the storyboard keeps b03 and b04 on one framing (continue), and a cut would hide the table tilting as a whole.
 *  (C) CHOSEN: on the held medium frame the fast yes leans in (explain pose, two drawings) on "agrees", his speech
 *      bubble (the seed's wobble, ochre: it is the plan's colour, the decision being made) opens on "Great"; Dana
 *      gives one nod. On "The room now has a direction" the plan sheet slides about 70 px towards the board in two
 *      stepped moves, and on "a direction" the other three lean a few degrees towards Dana, one per drawing, with
 *      their eyes on her. Nobody else speaks.
 * Rules from the references (TED-Ed s7, style_guide wobbly-outline family): a still camera on a moving drawing; hold the
 * layout and change its state; emotion from posture, not faces; hand-made time on fours (stepped hz 6).
 * Continuity: the bubble is not held by b05 (cut), so it leaves before the cut. The lean poses and the sheet's drifted
 * place are carried by the held rigs and the held sheet into b05 to b07. Dana's name tag is held here and leaves at
 * the cut to b05 (she is out of the close frame, and b07's wide repeat of b02 has no tag).
 */
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;
    const STEP = 1 / 6;   // one drawing on fours

    // everything from b03 is held (no entrance, no exit)
    const set = ctx.held("set");
    ["window_cloud", "board", "clock", "table", "board_slot", "tag_dana", "tag_dana.lead", "stamp"].forEach((n) => ctx.held(n));
    const sheet = ctx.held("sheet");
    const NAMES = ["dana", "p_date", "p_test", "p_support", "p_client"];
    const P = {}; NAMES.forEach((n) => { P[n] = ctx.held(n).__api; });
    const BUBS = ["bub_date", "bub_test", "bub_support", "bub_client"].map((n) => ctx.held(n));
    void set;

    const tAgrees = ctx.cue("agrees");
    const tGreat = ctx.cue("Great");
    const tDo = ctx.cue("do it");
    const tRoom = ctx.cue("The room now has");
    const tHas = ctx.cue("has a direction");
    const tDir = ctx.cue("a direction");

    // the held bubbles keep boiling (a held frame is never frozen)
    BUBS.forEach((E) => Loom.stepped.boil(E, ctx.start, ctx.end, { hz: 8, amp: 1.1 }));

    // lesson-local lean poses: the rig's own poses plus a few degrees of torso towards Dana (screen left = negative)
    ["pip", "tess"].forEach((r) => {
      const d = Loom.rig.defs[r]; if (!d) return;
      if (!d.poses.lean) d.poses.lean = Object.assign({}, d.poses.idle, { torso: -4, head: -2 });
      if (!d.poses.explain_lean) d.poses.explain_lean = Object.assign({}, d.poses.explain, { torso: -6, head: -3 });
    });

    /* ---- "One colleague agrees, fast": the fast yes leans in, two drawings, eyes on Dana ---- */
    P.p_date.drawings(["explain", "explain_lean"], tAgrees);
    P.p_date.look(-1, -0.45, tAgrees);
    P.p_date.emotion("happy", tAgrees + STEP);
    // the others glance at him, one per drawing (who said that?)
    ["p_test", "p_support", "p_client"].forEach((n, i) => P[n].look(-1, 0.05, tAgrees + 0.35 + i * STEP));

    /* ---- "Great, let's do it": his speech bubble opens (the seed's wobble), its words lettered in ---- */
    // Measure, then place: the only free wall is the band between the board's frame and the clock, above the folded
    // doubts. The bubble's tail drops from its lower left onto the side of his head, clear of his own doubt bubble.
    const text = "Great, let's do it.";
    const pad = Math.max(26, (ctx.style.pack.type.body || [30])[0] * 0.9);
    let F = kit.fit(text, { role: "body", w: 330 - 2 * pad, maxLines: 1 });
    let lines = 1;
    if (!F.fitted) { F = kit.fit(text, { role: "body", w: 330 - 2 * pad, maxLines: 2 }); lines = 2; }
    const bw = Math.max(F.width + 2 * pad, 160), bh = F.height + 2 * pad;
    const BX0 = 676, BOTTOM = 290;   // left edge clear of the board text, bottom clear of the folded doubts (y ~301)
    // Engine workaround (reported, not fixed here): kit.text's inset check takes the bubble's paper-texture group
    // (class lm-texture, random strokes clipped to the outline, so its bbox is smaller than the outline) as the text's
    // container and fails a well-padded bubble (-9.3 px on the first probe). For this one call the texture group is
    // also marked lm-shadow, which the check already skips; the texture itself is drawn unchanged.
    const tex0 = T.texture;
    T.texture = function () { const g = tex0.apply(this, arguments); if (g && g.classList) g.classList.add("lm-shadow"); return g; };
    let bub;
    try {
      bub = T.bubble(ctx, "bubble_yes", { x: BX0 + bw / 2, y: BOTTOM - bh / 2, w: bw, text, tail: [756, 410], kind: "speech", role: "body", maxLines: lines, fill: "accent2", t: tGreat });
    } finally { T.texture = tex0; }
    bub.exit = "recede";
    Loom.sfx("pop", tGreat + 0.05);
    // Dana answers with one nod (a gesture, not a line)
    P.dana.gesture("nod", tDo, tDo + 0.9);

    /* ---- "The room now has a direction": the plan sheet slides towards the board in two stepped moves ---- */
    // ONE drive for both moves: two m.travel calls each render their start state at load, so the second one's start
    // (-35) showed before the first move had happened (seen at 26.0 s on the first snapshot). Each move is two
    // drawings (a half step, then the rest), held in between; the stamp rides inside the sheet.
    // @form stepped_slide: an object slides along the table in held drawings rather than a smooth glide
    const moves = [[tRoom, -35], [tHas, -70]];
    const T0 = tRoom, DUR = tHas + 2 * STEP - tRoom;
    Loom.drive((e, raw) => {
      const t = T0 + raw * DUR;
      let x = 0, prev = 0;
      for (const [tm, to] of moves) {
        const k = t <= tm + 1e-3 ? 0 : t < tm + STEP ? 0.5 : 1;   // two drawings per move (raw 0 is the rest state)
        x = k > 0 ? prev + (to - prev) * k : x;
        if (k < 1) break;
        prev = to;
      }
      sheet.mover.setAttribute("transform", `translate(${x} 0) scale(1)`);
    }, T0, DUR, "linear", { kind: "travel", beat: ctx.beat.id, name: "sheet.slide", content: true, nostep: true });
    sheet.__pos = { x: -70, y: 0, s: 1 };

    /* ---- "a direction": the other three lean towards Dana, one per drawing, eyes on her ---- */
    ["p_test", "p_support", "p_client"].forEach((n, i) => {
      P[n].pose("lean", tDir + i * STEP, { dur: 0.02 });
      P[n].look(-1, -0.45, tDir + i * STEP);
    });
  },
});
