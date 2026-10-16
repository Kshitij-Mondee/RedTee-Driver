// @design paired_outlines: neighbouring outlines retain different colours after a shared reference decides them
// Treatments considered: static pair with signalling; travelling pages; staged outline draw.
// Choose staged outline draw: the reference stays fixed while classification changes one perimeter.
Loom.scene("b05", {
  build(ctx) {
    const arrival = ctx.cue("Your team's meeting notes");
    const audience = ctx.cue("meant for colleagues");
    const decision = ctx.cue("Internal");
    // @form shared_reference: preserve the shelf line without adding a duplicate
    const baseline = ctx.held("baseline");
    // Held b04 line occupies x=120..1800 at y=760; notes lands on that same edge.
    // @form prior_example: preserve the public page as the comparison
    const press = ctx.held("press_release");
    if (press) press.exit = "recede";
    // @form classified_page: a single page whose perimeter becomes its class
    const notes = ctx.el("notes", {x:520, y:436, w:252, h:324, kind:"node", exit:"none"});
    notes.handle = Loom.lesson.item(ctx, notes.inner, {x:0, y:0, scale:0.9, variant:"meeting_notes", cls:"none"});
    notes.handle.drawIn(arrival, ctx.style.dur("draw"));
    notes.handle.setState("internal", decision);
    // @form intended_audience: the colleagues sit beneath the page, clear of its label
    const colleagues = ctx.el("colleagues", {x:532, y:800, w:228, h:80, kind:"icon", exit:"recede"});
    colleagues.handle = Loom.lesson.people_row(ctx, colleagues.inner, {x:0, y:0, n:3, scale:1, color:"ink"});
    colleagues.handle.drawIn(audience);
  }
});
