// @design internal_door_threshold: an amber outlined note travels to a doorway and stops before crossing
// Treatments considered: 1) static building and note. 2) note travels to a marked threshold. 3) doorway closes over the note. Chosen: the threshold stop, because the stop makes the boundary legible.
Loom.scene("b06", {
  build(ctx, props) {
    var harmlessCue = ctx.cue("Harmless is not the same as approved.");
    var staysCue = ctx.cue("Internal stays inside");
    var approvalCue = ctx.cue("unless its release is approved.");

    // @form baseline: shelf line held unchanged from the preceding comparison
    var baseline = ctx.held("baseline");

    // @form notes: internal meeting notes held for the boundary demonstration
    var notes = ctx.held("notes");

    // @form office_door: building outline enclosing the internal notes
    var door = ctx.el("office_door", { x: 390, y: 170, w: 900, h: 560, kind: "scenery", exit: "recede" });
    var doorHandle = Loom.lesson.door(ctx, door.inner, { x: 0, y: 0, w: 900, h: 560 });
    doorHandle.drawIn(harmlessCue, 1.0);

    ctx.m.travel(notes, staysCue, { x: 480, y: 0, scale: 1, dur: 1.15 });
    doorHandle.showLabel(approvalCue, 0.4);
    doorHandle.thicken(approvalCue, 0.4);
    ctx.m.emphasis(door, approvalCue);
  }
});
