// @design a_full_table_of_talk_emptied_leaving_two_accent_questions_over_the_empty_seats
/* THREE TREATMENTS CONSIDERED (method step 1)
 *  (A) STATIC with signalling: the table, chairs, cast and two scribble bubbles all present from frame 0, then
 *      only the ink words and the accent marks revealed. Rejected: the hook IS the change from a full table to an
 *      empty one; a static board cannot say "everyone leaves", and the emptiness would carry no weight.
 *  (B) Two boards: a full-table card, a hard cut to an empty-table card, then the words. Rejected: this style
 *      accumulates on one board and never erases (guide s6), and a cut throws away the chairs as the evidence
 *      that people were here.
 *  (C) CHOSEN, one board drawn as it is spoken: kit team_table draws the table line and the four chair backs on
 *      "An hour of good discussion", the cast fades in and two scribble bubbles appear (talk with no words in
 *      it); on "everyone leaves" the bubbles and the people fade and the chairs stay empty; "Decided?" and
 *      "Who?" are written in ink above the empty table on their own words; the one accent lands last, two large
 *      question marks over the two middle empty seats, on "Nobody can say".
 * Motion gate: the movement (people leaving, marks landing over the empty seats) IS the argument.
 * Accent budget: ink for everything, muted nowhere, ONE marker colour (accent) on the two question marks only
 * (storyboard accent_on: question_marks). Sam's accent2 cloth is the kit's cast look, not a second emphasis.
 * Continuity: the `table` element holds the kit part with opts.name "team", so the element names b02 takes with
 * team_table {held:true} (team_table, team_chair_0..3, team_person_0..3) exist here and stay alive to the end of
 * the beat; `table` exits "none" because b02 keeps it. The words and the marks get real exits (wipe, recede).
 */
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");                                        // whiteboard: 0.9 s
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);

    // ---- 1. the meeting table: kit part team_table, composed, never redrawn by hand ------------------------
    // Natural 1400 x 700 at station x 90 y 240 (the kit's own placement): table line at station y 762, busts
    // 300 px standing ON it (y 460..760), chair backs y 570..760, seats centred at station x 250 / 590 / 930 /
    // 1270. The air above the busts (station y 240..460) holds the bubbles now and stays free for the marks.
    const table = ctx.el("table", { x: 90, y: 240, w: 1400, h: 700, kind: "scenery", exit: "none" });
    const TT = Loom.lesson.team_table(ctx, table.inner, { name: "team", ox: 90, oy: 240 });
    const SEAT = [250, 590, 930, 1270];        // station x of Sam, Priya, Dev, Lena

    const tTalk = ctx.cue("An hour of good discussion");
    TT.draw(tTalk);                            // table line, apron and legs, then the four chair backs (1.6 s)
    TT.arrive(tTalk + 0.45);                   // the cast fades in, staggered left to right (no slide: peeps fade)
    TT.emotion(0, "explaining", tTalk + 0.85);
    TT.emotion(1, "happy", tTalk + 1.0);
    TT.emotion(2, "explaining", tTalk + 1.15);
    TT.bubble(0, null, tTalk + 0.9);           // @form scribble_bubble_sam: an hour of talk, no words in it
    TT.bubble(2, null, tTalk + 1.25);          // @form scribble_bubble_dev: the second voice, same scribble

    // ---- 2. "Then everyone leaves": the talk goes first, then the people; the chairs stay ------------------
    const tLeave = ctx.cue("everyone leaves");
    TT.clearBubbles(tLeave);                   // the scribbles fade (nothing is erased, it just goes)
    TT.leave(tLeave + 0.15);                   // the four busts fade out, leaving four empty chairs

    // ---- 3. the two ink questions, each written ON its own words, above the emptied table ------------------
    // Caveat title (a closing question, guide s3); measured with kit.fit, inset 0.2 x size, box = the true
    // bounds of the words. Both are anchored by their top edge so neither can drift under the chrome at y 44.
    const wordEl = (name, str, cx, top) => {
      const f = kit.fit(str, { role: "title", w: 800, h: 240, maxLines: 1 });
      const pad = Math.max(8, Math.round(f.size * 0.2));
      const w = Math.ceil(f.width) + 2 * pad, h = Math.ceil(f.height) + 2 * pad;
      const E = ctx.el(name, { x: Math.round(cx - w / 2), y: top, w, h, kind: "text", exit: "wipe" });
      kit.text(E.inner, str, { role: "title", x: 0, y: 0, w, h, maxLines: 1, align: "center", valign: "middle", color: "ink" });
      return E;
    };
    const tDecided = ctx.cue("What was decided");
    const decided = wordEl("decided_word", "Decided?", 430, 108);     // @form written_question_left: what
    m.unmask(decided, tDecided - 0.1, { dur: writeDur("Decided?") });
    const tWho = ctx.cue("Who does what");
    const who = wordEl("who_word", "Who?", 1150, 108);                // @form written_question_right: who
    m.unmask(who, tWho - 0.1, { dur: writeDur("Who?") });

    // ---- 4. "Nobody can say": the ONE accent, two large question marks over the two middle empty seats -----
    // Display size (120..180) so they read as the facilitator's hand, in accent, the only saturated colour on
    // the board. One element, one left-to-right wipe: the first mark is written, then the second.
    const tSay = ctx.cue("Nobody can say");
    const fq = kit.fit("?", { role: "display", w: 400, h: 320, maxLines: 1 });
    const qpad = Math.max(12, Math.round(fq.size * 0.2));
    const qw = Math.ceil(fq.width) + 2 * qpad, qh = Math.ceil(fq.height) + 2 * qpad;
    const qcx = [SEAT[1], SEAT[2]];                                   // over Priya's and Dev's empty chairs
    const qx = Math.round(qcx[0] - qw / 2), qy = 330;                 // bottom edge qy + qh stays above 570
    const qW = Math.round(qcx[1] + qw / 2) - qx;                      // the true bounds of both marks
    const marks = ctx.el("question_marks", { x: qx, y: qy, w: qW, h: qh, kind: "mark", exit: "recede" });
    qcx.forEach((cx) => {                                             // @form accent_question_mark: one large accent question over an empty seat
      kit.text(marks.inner, "?", {
        role: "display", x: Math.round(cx - qw / 2) - qx, y: 0, w: qw, h: qh,
        maxLines: 1, align: "center", valign: "middle", color: "accent"
      });
    });
    m.unmask(marks, tSay - 0.2, { dur: 0.95 });                       // last reveal at about 79 % of the speech
  },
});
