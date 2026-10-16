// @design two_items_two_colours: a second item joins the first on one baseline and its outline takes a different colour
// Treatments: (1) static pair with colour contrast; (2) notes draw on, audience row, outline redraw (chosen: the colour change is the class decided); (3) notes slide in from the left.
Loom.scene("b05", {
  build(ctx, props) {
    var kit = ctx.kit;
    var BASE_Y = 720, S = 1.5, PAD = 30;
    var IW = 280 * S, IH = 360 * S;
    var NX = 640, PX = 1208;

    // baseline: held from b04 when it is there, otherwise drawn here at the same place
    var base = null, pr = null, prE = null;
    try { base = ctx.held("baseline"); } catch (e) { base = null; }
    if (!base) {
      var B = ctx.el("baseline", { x: 160, y: BASE_Y - 6, w: 1600, h: 12, kind: "scenery", exit: "none" });
      // @form ink_baseline: the ground line the items stand on
      kit.line(B.inner, 0, 6, 1600, 6, { stroke: "ink", sw: 3 });
    }
    try { prE = ctx.held("press_release"); } catch (e) { prE = null; }
    if (!(prE && prE.inner)) {
      var P = ctx.el("press_release", { x: PX - PAD, y: BASE_Y - IH - PAD, w: IW + 2 * PAD, h: IH + PAD + 4, kind: "card", exit: "recede" });
      // @form public_item: the press release, outline already public blue
      Loom.lesson.item(ctx, P.inner, { variant: "press_release", cls: "public", tick: true, x: PAD, y: PAD, scale: S });
    }

    
    // notes: dashed page draws on the baseline left of the press release
    var N = ctx.el("notes", { x: NX - PAD, y: BASE_Y - IH - PAD, w: IW + 2 * PAD, h: IH + PAD + 0, kind: "card", exit: "none" });
    // @form meeting_notes_item: the team's notes page, grey dashed until Internal
    var notes = Loom.lesson.item(ctx, N.inner, { variant: "meeting_notes", cls: "none", x: PAD, y: PAD, scale: S });
    var tNotes = ctx.cue("Your team's meeting notes");
    notes.drawIn(tNotes, 1.1);
    notes.printRows(tNotes + 0.7, 0.09, 0.35);

    // colleagues: three line heads under the notes
    var RS = 1.1, rowW = 3 * 76 * RS, rowH = 80 * RS;
    var C = ctx.el("colleagues", { x: NX + IW / 2 - rowW / 2 - 20, y: BASE_Y + 34, w: rowW + 40, h: rowH + 56, kind: "icon", exit: "recede" });
    // @form colleague_heads: three plain line heads, the people it is meant for
    var row = Loom.lesson.people_row(ctx, C.inner, { n: 3, x: 20, y: 0, scale: RS });
    var cl = kit.text(C.inner, "Colleagues", { role: "label", x: 0, y: rowH + 12, w: rowW + 40, h: 40, align: "center", valign: "middle", color: "muted" });
    var tCol = ctx.cue("meant for colleagues");
    row.drawIn(tCol, 0.18, 0.5);
    Loom.drive(function (e) { cl.setAttribute("opacity", e); }, tCol + 0.7, 0.4, "enter");

    // Internal: the outline redraws amber
    var tInt = ctx.cue("Internal");
    notes.setClass("internal", tInt, 0.6);
  }
});
