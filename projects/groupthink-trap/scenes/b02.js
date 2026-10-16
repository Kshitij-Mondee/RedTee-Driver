// @design stepped_vote_result: the decision shown first as a result, a stamp slamming on the plan, then every hand rising one drawing at a time over the unopened doubts
/* b02 - the vote, result first. Same locked wide frame as b01; everything is held.
 * Treatments considered:
 *  (A) static + signalling: arms already up, the stamp present, a highlight on the seams. Rejected: the vote is a
 *      sequence in time (each hand after the last) and b03 has to run it backwards, so it must be seen happening.
 *  (B) a cut to a close-up of the sheet for the stamp, then back out for the hands. Rejected: b07 repeats THIS frame
 *      as a callback; a second framing here would break the "identical frames, one variable" repeat.
 *  (C) CHOSEN: result first on the held wide frame: the stamp slams on "Agreed", the sheet jolts in two drawings and its
 *      header turns ochre on "The plan passes", the arms rise one per drawing step (Dana first, the last on "up"),
 *      the shut bubbles shiver twice on the question and the wall dims a touch on "what stops it".
 * Beat sheet: Agreed -> stamp (0.35 s, from 1.3x) | plan passes -> sheet jolt (2 drawings), header ochre |
 * Every hand goes up -> five arm poses, one per 1/6 s, the last landing on "up" | How do smart people -> bubble
 * shiver (2 drawings) | what stops it -> wall veil to 12 % over 0.8 s. Only the stamp, the header and the four seams
 * carry colour (accent_on: the stamp).
 */
Loom.scene("b02", {
  build(ctx) {
    const { m } = ctx;
    const svg = Loom.svg, T = Loom.treat, S = ctx.style;
    const STEP = 1 / 6;

    // everything from b01 is held (no entrance, no exit)
    const set = ctx.held("set");
    ["window_cloud", "board", "clock", "table"].forEach((n) => ctx.held(n));
    const NAMES = ["dana", "p_date", "p_test", "p_support", "p_client"];
    const people = NAMES.map((n) => ctx.held(n).__api);
    const sheet = ctx.held("sheet");
    const BUBS = ["bub_date", "bub_test", "bub_support", "bub_client"].map((n) => ctx.held(n));

    const tAgreed = ctx.cue("Agreed");
    const tPasses = ctx.cue("The plan passes");
    const tUp = ctx.cue("up");
    const tHow = ctx.cue("How do smart people do that");
    const tStops = ctx.cue("what stops it");

    // the held bubbles keep boiling through the beat (a held frame is never frozen)
    BUBS.forEach((E) => Loom.stepped.boil(E, ctx.start, ctx.end, { hz: 8, amp: 1.1 }));

    /* ---- "Agreed": the stamp slams onto the plan sheet ---- */
    // drawn INTO the sheet (parent), so it rides every later move of the sheet (b04's drift) and is the same object
    // that b03 peels off and b07 stamps again
    // @form verdict_stamp: a short verdict stamped as a tilted rubber-stamp mark, coloured to carry its valence
    const stamp = T.label(ctx, "stamp", { x: 125, y: 47, text: "Agreed", as: "stamp", tone: "accent2", rot: -8, role: "label", parent: sheet.inner });
    stamp.exit = "recede";
    m.stamp(stamp, tAgreed, { dur: 0.35, content: true });
    Loom.sfx("land", tAgreed + 0.3);

    /* ---- "The plan passes": a two-drawing jolt under the stamp; the plan is the named thing: header goes ochre ---- */
    Loom.stepped.on(sheet, { hz: 6 });
    Loom.tween(sheet.life, { y: 0 }, { y: 5, duration: STEP, ease: "none" }, tAgreed + 0.32, { kind: "gesture", beat: ctx.beat.id, name: "sheet" });
    Loom.tween(sheet.life, { y: 5 }, { y: 0, duration: STEP, ease: "none" }, tAgreed + 0.32 + STEP, { kind: "gesture", beat: ctx.beat.id, name: "sheet" });
    const header = sheet.__sheet.header, h0 = ctx.c("field2"), h1 = ctx.c("accent2");
    Loom.drive((e) => header.setAttribute("fill", S.mix(h0, h1, e)), tPasses, 2 * STEP, "linear", { kind: "recolour", beat: ctx.beat.id, name: "sheet.header", content: true, key: "sheet.header" });

    /* ---- "Every hand goes up": one arm per drawing step, Dana first, the last on "up" ---- */
    // a raised-arm pose ("hand_up", set up in b01; no wave gesture), held between steps: the rig drive is on fours
    // two drawings per arm (half way, up), people one step apart: the last arm lands on "up"
    const t0 = tUp - 5 * STEP;
    people.forEach((p, i) => { p.drawings(["hand_mid", "hand_up"], t0 + i * STEP); p.look(0, -0.2, t0 + i * STEP); });

    /* ---- "How do smart people do that?": the shut bubbles shiver twice, still shut ---- */
    BUBS.forEach((E, i) => {
      const t = tHow + 0.3 + i * 0.04;
      Loom.tween(E.inner, { x: 0 }, { x: 4, duration: STEP, ease: "none" }, t, { kind: "gesture", beat: ctx.beat.id, name: E.name });
      Loom.tween(E.inner, { x: 4 }, { x: -3, duration: STEP, ease: "none" }, t + STEP, { kind: "gesture", beat: ctx.beat.id, name: E.name });
      Loom.tween(E.inner, { x: -3 }, { x: 0, duration: STEP, ease: "none" }, t + 2 * STEP, { kind: "gesture", beat: ctx.beat.id, name: E.name });
    });

    /* ---- "And what stops it?": the wall dims a touch; stamp and seams keep their colour ---- */
    // the veil lives INSIDE the set (behind board, people, table and bubbles): only the wall and floor dim
    // @form wall_veil: a dark veil laid over the back wall only, so the props in front keep their colour
    const veil = ctx.el("wall_veil", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede", parent: set.inner });
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: ctx.c("ink") }, veil.inner);
    Loom.tween(veil.life, { opacity: 0 }, { opacity: 0.12, duration: 0.8, ease: Loom.ease.editorial }, tStops, { kind: "fade", beat: ctx.beat.id, name: "wall_veil" });
  },
});
