// @design board_arithmetic: a quantity is worked out on the board the way a person does it by hand, term by term, with a ruled line and one accent underline on the result
// @lab {"title": "whiteboard example: a meeting's cost worked out by hand on the board (term by term, one underline)", "styles": ["whiteboard"], "dur": 18.6, "times": [2.3, 4.7, 7.0, 9.3, 11.6, 14.0, 16.3], "words": [{"w": "Say", "s": 0.4, "e": 0.61}, {"w": "a", "s": 0.65, "e": 0.8}, {"w": "meeting", "s": 0.84, "e": 1.17}, {"w": "takes", "s": 1.21, "e": 1.48}, {"w": "one", "s": 1.52, "e": 1.73}, {"w": "hour", "s": 1.77, "e": 2.01}, {"w": "with", "s": 2.15, "e": 2.39}, {"w": "eight", "s": 2.43, "e": 2.7}, {"w": "people", "s": 2.74, "e": 3.04}, {"w": "in", "s": 3.08, "e": 3.26}, {"w": "the", "s": 3.3, "e": 3.51}, {"w": "room", "s": 3.55, "e": 3.79}, {"w": "On", "s": 4.08, "e": 4.26}, {"w": "the", "s": 4.3, "e": 4.51}, {"w": "calendar", "s": 4.55, "e": 4.91}, {"w": "it", "s": 4.95, "e": 5.13}, {"w": "is", "s": 5.17, "e": 5.35}, {"w": "one", "s": 5.39, "e": 5.6}, {"w": "hour", "s": 5.64, "e": 5.88}, {"w": "In", "s": 6.17, "e": 6.35}, {"w": "work", "s": 6.39, "e": 6.63}, {"w": "it", "s": 6.77, "e": 6.95}, {"w": "is", "s": 6.99, "e": 7.17}, {"w": "eight", "s": 7.21, "e": 7.48}, {"w": "hours", "s": 7.52, "e": 7.79}, {"w": "Hold", "s": 8.08, "e": 8.32}, {"w": "it", "s": 8.36, "e": 8.54}, {"w": "every", "s": 8.58, "e": 8.85}, {"w": "week", "s": 8.89, "e": 9.13}, {"w": "and", "s": 9.27, "e": 9.48}, {"w": "that", "s": 9.52, "e": 9.76}, {"w": "is", "s": 9.8, "e": 9.98}, {"w": "thirty", "s": 10.02, "e": 10.32}, {"w": "two", "s": 10.36, "e": 10.57}, {"w": "hours", "s": 10.61, "e": 10.88}, {"w": "a", "s": 10.92, "e": 11.07}, {"w": "month", "s": 11.11, "e": 11.38}, {"w": "close", "s": 11.52, "e": 11.79}, {"w": "to", "s": 11.83, "e": 12.01}, {"w": "a", "s": 12.05, "e": 12.2}, {"w": "full", "s": 12.24, "e": 12.48}, {"w": "working", "s": 12.52, "e": 12.85}, {"w": "week", "s": 12.89, "e": 13.13}, {"w": "So", "s": 13.42, "e": 13.6}, {"w": "ask", "s": 13.64, "e": 13.85}, {"w": "who", "s": 13.89, "e": 14.1}, {"w": "really", "s": 14.14, "e": 14.44}, {"w": "needs", "s": 14.48, "e": 14.75}, {"w": "to", "s": 14.79, "e": 14.97}, {"w": "be", "s": 15.01, "e": 15.19}, {"w": "there", "s": 15.23, "e": 15.5}, {"w": "before", "s": 15.64, "e": 15.94}, {"w": "you", "s": 15.98, "e": 16.19}, {"w": "send", "s": 16.23, "e": 16.47}, {"w": "the", "s": 16.51, "e": 16.72}, {"w": "invite", "s": 16.76, "e": 17.06}], "_timing": "estimated from the narration at about 180 wpm (no TTS run); a composed lesson uses the real word timings"}
/* Example scene for the WHITEBOARD style (docs/styles/guides/whiteboard.md, section 11). Workplace topic: what a
 * recurring meeting costs in people's time. Written for this narration (one beat, about 14 s; every number is
 * inside the "say" frame and is plain arithmetic on it, so nothing is a claim about the world):
 *
 *   "Say a meeting takes one hour, with eight people in the room. On the calendar it is one hour. In work, it is
 *    eight hours. Hold it every week, and that is thirty two hours a month, close to a full working week. So ask
 *    who really needs to be there, before you send the invite."
 *
 * What it shows:
 *  - board arithmetic: the sum is WRITTEN in the order it is spoken (term, sign, term, result), the ruled line is
 *    drawn before the total, and the total gets the scene's one accent (a marker underline), nothing else does;
 *  - "one thing becomes many": the eight people are pictogram icons (a designed icon family, allowed in diagrams),
 *    drawn one after another by a single m.draw on their element, never improvised figures;
 *  - numbers are set in the display hand (title role, Caveat) so they read as written by the presenter;
 *  - the board keeps everything; the closing question is added in the empty quarter, not over the sum, and a
 *    hand arrow ties it to the people it is about;
 *  - the last reveal lands before 85 % of the speech.
 * Treatments considered: (A) big.number template "32 hours" (rejected: states the result, hides the reasoning
 * the learner should be able to redo), (B) a bar chart of hours (rejected: one quantity, no comparison),
 * (C) CHOSEN: the sum worked on the board.
 */
Loom.scene("style_whiteboard_meeting_cost", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
    const ICON_SW = (size) => 24 * 3.6 / size;               // every icon line = the pack's 3.6 px marker line
    // one written term: its own element, written left to right; returns when the writing ends
    const write = (name, str, box, t, o) => {
      const E = ctx.el(name, { x: box[0], y: box[1], w: box[2], h: box[3], kind: "text", exit: "wipe" });
      kit.text(E.inner, str, Object.assign({ role: "title", x: 0, y: 0, w: box[2], h: box[3], maxLines: 1, valign: "middle" }, o || {}));
      const d = writeDur(str);
      m.unmask(E, t, { dur: d });
      return t + d;
    };

    // ---- the heading, as the speech starts
    write("title", "What one meeting costs", [120, 96, 1100, 116], ctx.speechStart + 0.1);

    // ---- "takes one hour": the clock is drawn, then "1 hour" is written beside it
    const tHour = ctx.cue("takes one hour");
    const clock = ctx.el("clock", { x: 150, y: 290, w: 140, h: 140, kind: "icon", exit: "recede" });
    kit.icon(clock.inner, "clock", { x: 70, y: 70, size: 112, stroke: ICON_SW(112) });
    m.draw(clock, tHour - 0.3, { dur: drawDur(400) });
    write("one_hour", "1 hour", [310, 300, 230, 120], tHour - 0.3 + drawDur(400) * 0.8);

    // ---- "eight people": the sign, then eight pictograms drawn one after another (one element, one draw)
    const tPeople = ctx.cue("eight people");
    write("times_people", "x", [560, 300, 60, 120], tPeople - 0.2);
    const people = ctx.el("people", { x: 630, y: 282, w: 370, h: 176, kind: "icon", exit: "recede" });
    for (let i = 0; i < 8; i++) {
      kit.icon(people.inner, "user", { x: 45 + (i % 4) * 92, y: 44 + Math.floor(i / 4) * 88, size: 70, stroke: ICON_SW(70) });
    }
    m.draw(people, tPeople + 0.05, { dur: DRAW * 1.4 });

    // ---- "eight hours": the result of the first line
    const tEight = ctx.cue("eight hours");
    write("eight_hours", "= 8 hours of work", [1030, 300, 780, 120], tEight);

    // ---- "every week": the next line of the sum, under the result, then the ruled line
    const tWeek = ctx.cue("every week");
    const tRule = write("times_weeks", "x 4 weeks", [1030, 440, 500, 110], tWeek);
    const rule = ctx.el("sum_rule", { x: 1020, y: 560, w: 720, h: 20, kind: "connector", exit: "recede" });
    hand(rule.inner, "M0 10 L710 7");
    m.draw(rule, tRule, { dur: drawDur(710) });

    // ---- "thirty two hours": the total, and the scene's ONE accent: a marker underline drawn under it
    const tTotal = ctx.cue("thirty two hours");
    const tTotalEnd = write("total", "32 hours a month", [1030, 586, 720, 120], tTotal);
    const under = ctx.el("total_underline", { x: 1030, y: 700, w: 700, h: 30, kind: "mark", exit: "recede" });
    hand(under.inner, "M0 18 C 180 8, 420 6, 640 12", { stroke: "accent", sw: 6 });
    m.draw(under, tTotalEnd - 0.1, { dur: drawDur(640) });

    // ---- "full working week": a muted note under the total (secondary: muted, label size)
    const tWeekNote = ctx.cue("full working week");
    write("week_note", "close to a full working week", [1030, 742, 720, 60], tWeekNote, { role: "label", color: "muted" });

    // ---- "who really needs to be there": the question is ADDED in the empty quarter of the board, below the sum
    // and away from it (a question level with the total read as one line with it). On "So ask" a hand arrow comes
    // down from the eight people to where the question will be written, so "who" points at the people it is about;
    // the question follows on its own words (both start before 85 % of the speech)
    // the element's box is the arrow's true bounds (x 556..790, y 470..754 on the station, plus 12 px); the shaft
    // and the open head are drawn in its local coordinates (station minus 544, 458)
    const ask = ctx.el("question_link", { x: 544, y: 458, w: 258, h: 308, kind: "connector", exit: "recede" });
    hand(ask.inner, "M246 12 Q 66 102 31 294");
    hand(ask.inner, "M12 270 L31 296 L52 273");
    m.draw(ask, ctx.cue("So ask"), { dur: drawDur(360) });
    write("question", "Who really needs to be there?", [150, 770, 820, 110], ctx.cue("who really needs to be there"), { w: 790 });   // fitted 30 px inside its element: Caveat overhangs its advance width (text_spill 7 px, A4 proof)
  },
});
