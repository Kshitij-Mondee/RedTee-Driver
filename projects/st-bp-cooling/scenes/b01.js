// @design quiet_sheet: an empty sheet becomes a place through ordered drafting
Loom.scene("b01", {
  build(ctx, props) {
    /* Three treatments: static section with a cyan signal; camera approach to a drafted section;
       live section drafting with a held note. Choose live drafting: the place is made as it is named. */
    const arrival = Math.max(ctx.start, ctx.cue("Say this is your data hall") - 0.3);
    const rows = ctx.cue("Rows of servers");
    const hum = ctx.cue("a steady hum");
    // @form building_section: the quiet shared architectural reference
    const hall = ctx.el("hall_section", {x:0, y:0, w:1920, h:960, kind:"scenery", exit:"none"});
    const handle = Loom.lesson.hall_section(ctx, hall.inner, {name:"hall_drawing", drafted:false, state:"still", at:arrival});
    hall.handle = handle;
    handle.setState("running", rows);
    handle.highlight(rows, hum);
    // @form sheet_note: a small held identification below the section
    const note = ctx.el("title_note", {x:1260, y:850, w:500, h:60, kind:"text", exit:"none"});
    ctx.kit.fit("data hall, section", {role:"label", w:476, h:48, maxLines:1});
    ctx._coolingSheet.letter(note, "data hall, section", {role:"label", size:24, align:"center", valign:"middle", at:hum - 0.3, by:hum + ctx.style.dur("enter"), quick:true});
  }
});
