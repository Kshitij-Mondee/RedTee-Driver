// @design stopped_perimeter: an enclosing outline lets a travelling outline reach its boundary but not cross it
// Treatments considered: static boundary with signalling; page passing through a gate; enclosure drawing then a stopped glide.
// Choose enclosure then stopped glide because the arrested movement is the rule.
Loom.scene("b06", {
  build(ctx) {
    const enclosure = ctx.cue("Harmless is not the same as approved");
    const glide = ctx.cue("Internal stays inside");
    const condition = ctx.cue("unless its release is approved");
    // @form floor_reference: the existing floor remains fixed through the enclosure draw
    const baseline = ctx.held("baseline");
    // @form retained_outline: the existing page retains its classification without an approval mark
    const notes = ctx.held("notes");
    // @form enclosing_boundary: the roof and walls surround the retained page with an open right edge
    const building = ctx.el("building", {x:376, y:200, w:948, h:560, kind:"scenery", exit:"recede"});
    building.handle = Loom.lesson.door(ctx, building.inner, {x:24, y:0, scale:1});
    building.handle.drawIn(enclosure, ctx.style.dur("draw"));
    ctx.m.travel(notes, glide, {x:488, y:0, scale:1, dur:ctx.style.dur("draw")});
    building.handle.showLabel(condition, ctx.style.dur("enter"));
    building.handle.thicken(condition, ctx.style.dur("move"));
  }
});
