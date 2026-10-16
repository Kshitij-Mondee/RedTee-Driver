// @design line_art_class_contrast: two document outlines share one baseline while outline colour carries access
// Treatments considered: 1) static two-page comparison with colour signalling. 2) notes slides across from press release. 3) pages stack into a folder. Chosen: static comparison, because the two outline colours are the lesson.
Loom.scene("b05", {
  build(ctx, props) {
    var notesCue = ctx.cue("Your team's meeting notes?");
    var colleaguesCue = ctx.cue("meant for colleagues");
    var internalCue = ctx.cue("Internal.");

    // @form baseline: shelf line held unchanged from b04
    var baseline = ctx.held("baseline");

    // @form public_press_release: approved public document held from b04
    var press = ctx.held("press_release");

    // @form notes: meeting-notes document awaiting its internal class
    var notes = ctx.el("notes", { x: 540, y: 370, w: 280, h: 360, kind: "card", exit: "none" });
    var notesHandle = Loom.lesson.item(ctx, notes.inner, { x: 0, y: 0, w: 280, h: 360, variant: "meeting_notes", cls: "none", tick: false });
    notesHandle.drawIn(notesCue, 0.9);

    // @form colleagues: three colleagues represented by simple line heads
    var colleagues = ctx.el("colleagues", { x: 568, y: 786, w: 228, h: 80, kind: "icon", exit: "recede" });
    var colleagueHandle = Loom.lesson.people_row(ctx, colleagues.inner, { x: 0, y: 0, w: 228, h: 80, n: 3, color: "muted" });
    colleagueHandle.drawIn(colleaguesCue, 0.15, 0.45);

    notesHandle.setClass("internal", internalCue, 0.6);
    ctx.m.emphasis(notes, internalCue);
  }
});
