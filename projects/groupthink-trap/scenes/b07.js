// @design stepped_vote_result_continued: the opening vote frame repeated with one variable, each raised hand now also pressing its owner's private doubt shut, and the verdict stamped again
/* b07 - "So nobody says it. Silence starts to look like yes. Hands go up." A cut back to the wide frame of b02: a
 * deliberate repeat (identical_frames_one_variable). This time the viewer knows what is folded above each head.
 * Treatments considered (lnd-motion-choreography-loop):
 *  (A) static + signalling: arms already up, lids already pressed, the stamp present; a highlight on the tag. Rejected:
 *      the repetition IS the point (b02's accumulation, now with its cause visible); it must happen again, step by
 *      step, in the same frame.
 *  (B) a new angle from the doubters' side. Rejected in the storyboard: the rigs are front view only, and a new
 *      framing would break the repeat of b02's composition.
 *  (C) CHOSEN: on "So nobody says it" nothing moves but the window's cloud and breathing (a held breath: the bubbles
 *      stop boiling). On "Silence starts to look like yes" a paper tag "silence = yes" pins to the drifted plan
 *      sheet's edge and is written on (the accent, red: the doubts read as a yes). On "Hands go up" the arms rise one
 *      per drawing exactly as in b02 (Dana first, the last on "up"), and as each colleague's arm rises their folded
 *      bubble presses flat into a closed lid (Loom.morph.to folded to lid, stepped), sealing the doubt. On the last
 *      step the same Agreed stamp from b02 lands on the sheet again: a callback, not a new word.
 * Rules from the references (TED-Ed s7; crayon study: bring an earlier image back changed; style_guide:
 * identical_frames_one_variable, stamp_slam_on_verdict, state_steps_in_place): a still camera; hold the layout and
 * change its state; hand-made time on fours.
 * End state (b12 redraws and rewinds it): arms up, lids, stamp, Dana standing, goal on the board, sheet drifted.
 */
Loom.scene("b07", {
  build(ctx) {
    const { m } = ctx;
    const svg = Loom.svg;
    const STEP = 1 / 6;

    const set = ctx.held("set");
    ["window_cloud", "board", "clock", "table", "board_slot"].forEach((n) => ctx.held(n));
    const sheet = ctx.held("sheet"), stamp = ctx.held("stamp");
    const NAMES = ["dana", "p_date", "p_test", "p_support", "p_client"];
    const P = {}; NAMES.forEach((n) => { P[n] = ctx.held(n).__api; });
    const KEYS = ["date", "test", "support", "client"];
    const B = {}; KEYS.forEach((k) => { B[k] = ctx.held("bub_" + k); });

    const tNobody = ctx.cue("So nobody says it");
    const tSilence = ctx.cue("Silence starts to look like yes");
    const tHands = ctx.cue("Hands go up");
    void tNobody;

    // raised-arm poses that keep the lean towards Dana (b04): the colleagues' lean persists through the vote
    ["pip", "tess"].forEach((r) => {
      const d = Loom.rig.defs[r]; if (!d) return;
      if (!d.poses.hand_mid_lean && d.poses.hand_mid) d.poses.hand_mid_lean = Object.assign({}, d.poses.hand_mid, { torso: -4, head: -1 });
      if (!d.poses.hand_up_lean && d.poses.hand_up) d.poses.hand_up_lean = Object.assign({}, d.poses.hand_up, { torso: -4 });
    });

    /* ---- "So nobody says it": a held breath. The bubbles do not boil until the silence becomes a yes ---- */
    // eyes front, as in b02's frame
    ["p_date", "p_test", "p_support", "p_client"].forEach((n) => P[n].look(0, 0.1, ctx.start));
    P.dana.look(0.4, 0.1, ctx.start);
    KEYS.forEach((k) => Loom.stepped.boil(B[k], tSilence, ctx.end, { hz: 8, amp: 1.1 }));

    /* ---- "Silence starts to look like yes": a paper tag pins to the drifted sheet's right edge ---- */
    // the sheet sits 70 px left of its b01 place (b04): its right corner is at about (1173, 774)
    // @form pinned_paper_tag: a paper tag on a string pinned to one point of an object, its word written on
    const tag = set.__tag(ctx, "tag_silence", { x: 1352, y: 716, text: "silence = yes", to: [1173, 774], color: "accent", t: tSilence });
    tag.exit = "recede";

    /* ---- "Hands go up": one arm per drawing, Dana first, the last on "up"; each colleague's doubt pressed into a lid ---- */
    const ORDER = ["dana", "p_date", "p_test", "p_support", "p_client"];
    ORDER.forEach((n, i) => {
      const t = tHands + i * STEP;
      if (n === "dana") P.dana.drawings(["hand_mid", "hand_up"], t);
      else P[n].drawings(["hand_mid_lean", "hand_up_lean"], t);
      P[n].look(0, -0.2, t);
      if (n === "dana") return;
      const k = n.slice(2), E = B[k], bb = E.__bub, sh = bb.shapes;
      // the folded bubble presses flat into a lid as the arm goes up (one outline morphing, stepped on fours)
      Loom.morph.to(bb.body, sh.lid, t, { dur: 2 * STEP, hz: 6 });
      Loom.morph.to(bb.seam, sh.seamLid, t, { dur: 2 * STEP, hz: 6 });
      Loom.tween(bb.crease, { opacity: 1 }, { opacity: 0, duration: STEP, ease: "none" }, t, { kind: "state", beat: ctx.beat.id, name: E.name + ".crease" });
      // the thought dots go with it: a lid is shut, it no longer trails from the head
      Loom.tween(bb.dots, { opacity: 1 }, { opacity: 0, duration: STEP, ease: "none" }, t + STEP, { kind: "state", beat: ctx.beat.id, name: E.name + ".dots" });
    });

    /* ---- the Agreed stamp lands a second time, on the last step: the SAME stamp object b03 peeled off ---- */
    const tStamp = tHands + 5 * STEP;
    // b03 sent it up and away on its life group (y -70, rotation -14, opacity 0): put it back, then slam it in
    Loom.tween(stamp.life, { y: -70, rotation: -14, opacity: 0, transformOrigin: "20% 80%" }, { y: 0, rotation: 0, opacity: 1, duration: 0.02, ease: "none" }, tStamp - 0.03, { kind: "state", beat: ctx.beat.id, name: "stamp.reset" });
    m.stamp(stamp, tStamp, { dur: 0.35, content: true });
    Loom.sfx("land", tStamp + 0.3);
    // the jolt under the stamp, as in b02 (two drawings)
    Loom.tween(sheet.life, { y: 0 }, { y: 5, duration: STEP, ease: "none" }, tStamp + 0.3, { kind: "gesture", beat: ctx.beat.id, name: "sheet" });
    Loom.tween(sheet.life, { y: 5 }, { y: 0, duration: STEP, ease: "none" }, tStamp + 0.3 + STEP, { kind: "gesture", beat: ctx.beat.id, name: "sheet" });
    void svg;
  },
});
