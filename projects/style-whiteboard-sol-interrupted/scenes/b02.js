// @design divergent_recollections: one shared setting gains four incompatible answers in sequence
/* Treatments: A static four-answer composition with a single signalling underline;
   B four replacement boards; C chosen, retain the scaffold and draw answers in sequence.
   C makes the mismatch visible without losing the shared setting. */
Loom.scene("b02", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const table = ctx.held("table");
    // @form shared_scaffold: retain the line and chairs without drawing them again
    const team = Loom.lesson.team_table(ctx, table.inner, { name: "team", held: true, ox: 90, oy: 240 });
    table.handle = team;
    const tMeeting = ctx.cue("Sam's weekly project meeting");
    const tAsk = ctx.cue("Ask around after");
    const tRest = ctx.cue("remembers it differently");
    // The previous board's questions leave before the returning people arrive.
    m.exit(ctx.held("decided_word"), ctx.start, "recede");
    m.exit(ctx.held("who_word"), ctx.start, "recede");
    m.exit(ctx.held("question_marks"), ctx.start, "recede");
    // KIT workaround: arrive() reveals mover, but leave() faded life. Restore held life groups, not copied people.
    team.el.people.forEach((personEl, i) => {
      Loom.tween(personEl.life, { opacity: 0 }, { opacity: 1 }, tMeeting + i * ctx.style.dur("enter") * 0.3, { dur: ctx.style.dur("enter") });
    });
    // @form named_runner: identify the person whose shared setting is being revisited
    team.nameTag(0, "Sam", tMeeting);
    const b = team.tagBox(0);
    const samTag = ctx.el("sam_tag", { x: b.x - 8, y: b.y + 47, w: b.w + 16, h: 24, kind: "mark", exit: "recede", parent: table.inner });
    kit.sketch(samTag.inner, "path", [`M6 12 C ${Math.round((b.w + 16) * 0.3)} 8, ${Math.round((b.w + 16) * 0.65)} 15, ${b.w + 10} 10`], { fill: "none", stroke: "accent", sw: 5 });
    m.draw(samTag, tMeeting + ctx.style.dur("draw") * 0.45, { dur: ctx.style.dur("draw") * 0.3 });
    // @form incompatible_answers: outline then words, four different memories of one event
    team.bubble(0, "May", tAsk);
    team.bubble(1, "June", tAsk + ctx.style.dur("enter") * 1.1);
    // KIT workaround: bubble('?') uses a 64px words box below the Caveat floor. Keep its outline and provide 110px for text.
    const tQuestion = tAsk + ctx.style.dur("enter") * 2.2;
    const qb = team.bubbleBox(2);
    const questionBubble = ctx.el("team_bubble_2", { x: qb.x, y: qb.y, w: 300, h: 160, kind: "bubble", exit: "recede", parent: table.inner });
    kit.sketch(questionBubble.inner, "path", ["M8 6 L292 4 L292 130 L172 131 L150 158 L128 131 L8 132 Z"], { fill: "none", stroke: "ink" });
    const questionWords = ctx.el("team_bubble_words_2", { x: qb.x + 20, y: qb.y + 10, w: 260, h: 110, kind: "text", exit: "wipe", parent: table.inner });
    kit.fit("?", { role: "title", w: 220, h: 110, maxLines: 1 });
    kit.text(questionWords.inner, "?", { role: "title", x: 20, y: 0, w: 220, h: 110, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    m.draw(questionBubble, tQuestion, { dur: ctx.style.dur("draw") * 2 / 3 });
    m.unmask(questionWords, tQuestion + ctx.style.dur("draw") * 0.5, { dur: ctx.style.dur("draw") * 0.45 });
    team.bubble(3, null, tAsk + ctx.style.dur("enter") * 3.3);
    // The board rests on the mismatch at tRest; no late emphasis or reveal.
  }
});
