// @design question_over_metadata: one question remains while two irrelevant attributes fade
// Treatments considered: static diagram with signalling; question arriving over a page; travelling page through selectors.
// Chosen: question arriving over a page, since fading the side attributes makes the claim without adding a journey.
Loom.scene("b03", {
  build(ctx, props) {
    const kit = ctx.kit;
    const m = ctx.m;
    const tDoc = ctx.cue("One question sorts it");
    const tQuestion = ctx.cue("Who could be harmed if it got out");
    const tType = ctx.cue("Not the file type");
    const tFolder = ctx.cue("not the folder");
    const drawDur = ctx.style.dur("draw");
    const enterDur = ctx.style.dur("enter");
    const moveDur = ctx.style.dur("move");
    const stagger = ctx.style.dur("stagger");

    // @form dashed_page: the undecided item is the central reference
    const doc = ctx.el("doc", {x:820, y:490, w:280, h:360, kind:"card", exit:"recede"});
    const page = Loom.lesson.item(ctx, doc.inner, {x:0, y:0, variant:"plain", cls:"none", label:false});
    doc.handle = page;
    page.drawIn(tDoc, drawDur);

    // @form metadata_badge: file type is visible but cannot decide the class
    kit.fit("file type", {role:"body", w:208, h:58, maxLines:1});
    const typeBadge = Loom.treat.panel(ctx, "type_badge", {x:460, y:615, w:240, h:90, fill:"field", tone:"muted", t:tDoc + stagger});
    const badgeText = kit.text(typeBadge.inner, "file type", {x:16, y:18, w:208, h:54, role:"body", align:"center", color:"muted", maxLines:1});
    m.reveal(badgeText, tDoc + stagger + enterDur);
    Loom.drive(function(e) { typeBadge.mover.setAttribute("opacity", 1 - 0.8 * e); }, tType, moveDur, "move");

    // @form storage_folder: the storage location is equally secondary
    const folder = Loom.obj.draw(ctx, "folder", "folder", {x:1360, y:675, size:240, tone:"muted", detail:1, family:"tab", state:{open:false}, t:tDoc + 2 * stagger});
    // Keep the stock object geometry, with this film's unfilled monoline finish.
    folder.inner.querySelectorAll("*").forEach(function(p) {
      if (p.hasAttribute("fill")) {
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", ctx.c("muted"));
        p.setAttribute("stroke-width", 3);
      }
    });
    folder.inner.querySelectorAll("ellipse").forEach(function(p) { p.setAttribute("opacity", 0); });
    Loom.drive(function(e) { folder.mover.setAttribute("opacity", 1 - 0.8 * e); }, tFolder, moveDur, "move");

    // @form deciding_question: a single accent above the undecided page
    // harm_label is the kit's Harm? label, kept attached to the question device.
    const qmark = ctx.el("qmark", {x:880, y:145, w:160, h:300, kind:"instrument", exit:"recede"});
    const question = Loom.lesson.harm_mark(ctx, qmark.inner, {x:0, y:0});
    qmark.handle = question;
    question.mark.setAttribute("stroke", ctx.c("accent"));
    question.dot.setAttribute("fill", ctx.c("accent"));
    question.drawOn(tQuestion, drawDur);
    question.showLabel(tQuestion + drawDur, enterDur);
    question.hoverFor(tQuestion + drawDur, ctx.speechEnd, 4);
  }
});
