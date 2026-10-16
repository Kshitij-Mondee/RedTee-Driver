// @design divergent_recollections: one shared setting refills, then four incompatible responses accumulate
/* Treatments: A static table with simultaneous response signalling; B isolated response cards;
 * C chosen, retain the setting and draw responses sequentially so mismatch accumulates.
 * Cue map: Sam's weekly project meeting -> arrivals and name; Ask around after -> bubbles;
 * remembers it differently -> settled hold. No ambient motion on a whiteboard.
 */
Loom.scene("b02", {
  build(ctx, props) {
    const {kit, m} = ctx;
    const table = ctx.held("table");
    const team = Loom.lesson.team_table(ctx, table.inner, {name:"team", held:true, ox:90, oy:240});
    table.handle = team;
    table.exit = "recede";
    m.exit(ctx.held("decided_word"), ctx.start, "wipe");
    m.exit(ctx.held("who_word"), ctx.start, "wipe");
    m.exit(ctx.held("question_marks"), ctx.start, "recede");

    // @form named_host: identify the recurring colleague without adding a heading
    const tSam = ctx.cue("Sam's weekly project meeting");
    team.arrive(tSam);
    team.nameTag(0, "Sam", tSam);
    const b = team.tagBox(0);
    // @form host_underline: the sole accent identifies the meeting's host
    const samTag = ctx.el("sam_tag", {x:b.x-8, y:b.y+b.h-4, w:b.w+16, h:24, kind:"mark", exit:"recede", parent:table.inner});
    kit.sketch(samTag.inner, "path", [`M6 12 Q${(b.w+16)/2} 6 ${b.w+10} 12`], {fill:"none", stroke:"accent", sw:5});
    m.draw(samTag, tSam + ctx.style.dur("draw")*0.45, {dur:ctx.style.dur("draw")*0.3});

    // @form divergent_bubbles: four distinct responses belong to the same meeting
    const tAsk = ctx.cue("Ask around after");
    const gap = ctx.style.dur("draw")*0.6;
    team.bubble(0, "May", tAsk);
    team.bubble(1, "June", tAsk+gap);
    team.bubble(2, "?", tAsk+gap*2);
    team.bubble(3, null, tAsk+gap*3);
    const tRest = ctx.cue("remembers it differently");
    // The completed responses hold through tRest and the cut to the presenter.
  }
});
