// @design same_scene_refilled_then_diverging: the emptied scene fills again and each person answers differently
// Treatments: (A) static four bubbles at once (rejected: no mismatch built up); (B) people swap seats (rejected: not the point);
// (C) CHOSEN: the table refills, Sam is tagged with the one accent underline, bubbles arrive one by one with different answers.
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);

    // b01's words and question marks leave first (held elements of the previous beat)
    const tLeave = ctx.start + 0.15;
    ["decided_word", "who_word", "question_marks"].forEach((n, i) => {
      m.exit(ctx.held(n), tLeave + i * 0.1);
    });

    const board = ctx.el("b02_board", { x: 90, y: 240, w: 1400, h: 700, kind: "scenery", exit: "recede" });
    const team = Loom.lesson.team_table(ctx, board.inner, { name: "team", held: true });

    // 1. "Sam's weekly project meeting": the four people fade in again, 'Sam' written, one accent underline
    const tMeet = ctx.cue("Sam's weekly project meeting");
    // the people were faded out through their life group in b01: bring that same opacity back (held, not redrawn)
    team.el.people.forEach((E, k) => {
      Loom.tween(E.life, { opacity: 0 }, { opacity: 1 }, tMeet + k * 0.15, { dur: 0.5 });
    });
    const tTag = tMeet + 0.9;
    team.nameTag(0, "Sam", tTag);
    const tb = team.tagBox(0);
    const ulW = tb.w + 24;
    // @form accent_underline: the one marker colour, on the name that starts the story
    const ul = ctx.el("sam_tag", { x: tb.x - 12, y: tb.y + tb.h + 2, w: ulW, h: 24, kind: "mark", exit: "recede", parent: board.inner });
    kit.sketch(ul.inner, "path", ["M2 12 C " + (ulW * 0.3).toFixed(0) + " 6, " + (ulW * 0.65).toFixed(0) + " 17, " + (ulW - 2) + " 9"], { fill: "none", stroke: "accent", sw: 5 });
    m.draw(ul, tTag + 0.45, { dur: drawDur(ulW * 1.05) });

    // 2. "Ask around after ... remembers it differently": four different bubbles, one after another
    team.bubble(0, "May", ctx.cue("Ask around after"));
    team.bubble(1, "June", ctx.cue("everyone remembers"));
    team.bubble(2, "Who?", ctx.cue("remembers it"));
    team.bubble(3, null, ctx.cue("differently"));
  },
});
