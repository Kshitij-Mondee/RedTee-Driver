// @design one_table_four_answers: a held table refills with four people, four speech bubbles above them disagree, one accent underline under a single name
/* Beat b02 (hook, station "table", join in: continue, keeps the table from b01).
 *
 * Treatments considered:
 *  (A) STATIC with signalling: the four people already seated from frame 0, four bubbles drawn at once and each one
 *      lit in turn as the voice reaches it (rejected: the mismatch IS the stagger, and a board that lights items in
 *      turn reads as a slide, not as a facilitator drawing);
 *  (B) a camera move along the row of faces, one bubble at a time (rejected: the point is four answers seen in ONE
 *      wide frame at the same moment, and the storyboard asks for a wide shot that holds them all);
 *  (C) CHOSEN: the table held from b01 refills as the sentence starts, one name is written on the table front and
 *      underlined in the beat's single accent, then four bubbles arrive one after another on "Ask around after" and
 *      the board rests on four different answers while the sentence finishes.
 *
 * Whiteboard rules kept: ink everywhere, ONE accent (the underline under "Sam", accent_on sam_tag), muted nowhere
 * else needed; strokes drawn on (m.draw), words written left to right (m.unmask, inside the kit part), people only
 * from the kit's Open Peeps busts (never shapes, never redrawn here: opts.held takes b01's); the last new stroke
 * lands before 85% of the speech so the board is at rest for "remembers it differently".
 */
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");                                   // the pack's base draw time (whiteboard: 0.9 s)
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);   // longer strokes take longer, within limits
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    // ---- 0. the table is b01's and is HELD. team_table with opts.held takes the table line, the four chair backs
    // and the four people from the previous beat through ctx.held, so nothing here is drawn twice. This element
    // carries only what b02 adds (the name tag, the accent, the four bubbles), in the kit's natural 1400 x 700
    // space at the station position the kit asks for (x 90, y 240: the table line lands on y 760).
    const OX = 90, OY = 240;
    // @form one_table_four_answers: the marks this beat adds on the held table's board space
    const marks = ctx.el("bubbles", { x: OX, y: OY, w: 1400, h: 700, kind: "scenery", exit: "recede" });
    const team = Loom.lesson.team_table(ctx, marks.inner, { held: true, name: "team", ox: OX, oy: OY });

    // ---- 1. "Say it's Sam's weekly project meeting": the table fills again as the sentence starts
    const tFill = ctx.speechStart + 0.05;
    team.arrive(tFill);                                            // the four people fade in, staggered left to right
    team.emotion(0, "explaining", tFill + 0.55);                   // Sam runs it

    // ---- 2. the name written on the table front, then the beat's ONE accent under it
    const tName = ctx.cue("weekly project meeting");
    team.nameTag(0, "Sam", tName);                                 // kit words, written left to right
    const tb = team.tagBox(0);                                     // the tight box of what was just written
    const ulW = tb.w + 20;
    // @form one_table_four_answers: the single accent mark, a hand underline under the one name
    const ul = ctx.el("sam_tag", { x: tb.x - 10, y: tb.y + 46, w: ulW, h: 22, kind: "mark", exit: "recede", parent: marks });
    hand(ul.inner, "M3 13 C " + (ulW * 0.35).toFixed(0) + " 5, " + (ulW * 0.7).toFixed(0) + " 17, " + (ulW - 3) + " 9", { stroke: "accent", sw: 5 });
    m.draw(ul, tName + 0.42, { dur: drawDur(ulW) });

    // ---- 3. "Ask around after": a bubble above each person, one after another (May, June, ?, a scribble)
    const tAsk = ctx.cue("Ask around after");
    const answers = ["May", "June", "?", null];
    answers.forEach((a, i) => { team.bubble(i, a, tAsk + i * 0.72); });

    // ---- 4. "remembers it differently": nothing new, the board rests on four different answers
    const tDiff = ctx.cue("remembers it differently");
    team.emotion(1, "explaining", tDiff);
    team.emotion(2, "explaining", tDiff + 0.12);
    team.emotion(3, "explaining", tDiff + 0.24);
  },
});
