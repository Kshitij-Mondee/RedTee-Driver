// @design stops_at_threshold: a building outline draws around a page, the page glides right and halts on the doorway line, a label prints on the wall
// Treatments: (1) static building with label; (2) building draws, page glides and stops at the threshold, label prints, line thickens (chosen: the stop is the rule); (3) page slides through the door and fades.
Loom.scene("b06", {
  build(ctx, props) {
    var DS = 1.2;                    // door scale: 672 high, notes (540 high) sit inside with a margin
    var DX = 560, DY = 720 - 560 * DS;   // door origin on the baseline (y 720)
    var PADX = 40, PADY = 8;

    var notes = ctx.held("notes");
    ctx.held("baseline");

    // building: drawn around the held notes, doorway on the right
    var B = ctx.el("building", { x: DX - PADX, y: DY - PADY, w: 900 * DS + 2 * PADX, h: 560 * DS + PADY + 14, kind: "scenery", exit: "recede" });
    // @form office_building: building front outline, doorway lower right, threshold line
    var door = Loom.lesson.door(ctx, B.inner, { x: PADX, y: PADY, scale: DS });

    // the label prints on the wall inside, left of where the notes stop (the notes cover the wall above the doorway)
    door.stays.setAttribute("transform", "translate(-440 175)");

    var t1 = ctx.cue("Harmless is not the same as approved");
    door.drawIn(t1, 1.3);

    var t2 = ctx.cue("Internal stays inside");
    // notes glide right and stop at the threshold: ease out, no bounce
    ctx.m.travel(notes, t2, { x: 560, y: 0, dur: 1.5 });

    var t3 = ctx.cue("unless its release is approved");
    door.showLabel(t3, 0.5);
    door.thicken(t3 + 0.2, 0.5);
  }
});
