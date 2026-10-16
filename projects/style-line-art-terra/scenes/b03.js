// @design harm_question_sort: one hovering question disqualifies two nearby filing cues
// Treatments considered: 1) static document with a question mark and dimmed cues. 2) document as a measuring instrument. 3) a folder maze. Chosen: static composition with signalling, because fading the cues states they do not decide.
Loom.scene("b03", {
  build(ctx) {
    const K = ctx.kit;
    const M = ctx.m;
    const T = Loom.treat;
    const one = ctx.cue("One question sorts it.");
    const harm = ctx.cue("Who could be harmed if it got out?");
    const noType = ctx.cue("Not the file type");
    const noFolder = ctx.cue("not the folder");

    // @form plain_document: the unclassified item awaiting one deciding question
    const doc = ctx.el("doc", { x: 820, y: 435, w: 280, h: 360, kind: "instrument", exit: "recede" });
    const page = Loom.lesson.item(ctx, doc.inner, { x: 0, y: 0, w: 280, h: 360, variant: "plain", cls: "none", label: false, tick: false });
    page.drawIn(one, 0.9);

    // @form file_type_badge: a small filing cue that is not the deciding test
    const typeBadge = T.label(ctx, "type_badge", { x: 500, y: 590, text: "file type", tone: "muted", role: "label", t: one + 0.18 });
    Loom.tween(typeBadge.life, { opacity: 1 }, { opacity: 0.2 }, noType, { dur: 0.4, ease: "editorial" });

    // @form folder_outline: a filing location that is not the deciding test
    const folder = Loom.obj.draw(ctx, "folder", "folder", { x: 1260, y: 515, size: 210, tone: "muted", detail: 1, family: "tab", state: {}, t: one + 0.34 });
    Loom.tween(folder.life, { opacity: 1 }, { opacity: 0.2 }, noFolder, { dur: 0.4, ease: "editorial" });

    // @form harm_question_mark: the line question that chooses the class
    const qmark = ctx.el("qmark", { x: 880, y: 110, w: 160, h: 300, kind: "icon", exit: "recede" });
    const mark = Loom.lesson.harm_mark(ctx, qmark.inner, { x: 0, y: 0, w: 160, h: 300, label: true });
    mark.drawOn(harm, 1.0);
    mark.showLabel(harm + 0.76);
    mark.hoverFor(harm + 1.0, ctx.speechEnd, 5);
  },
});
