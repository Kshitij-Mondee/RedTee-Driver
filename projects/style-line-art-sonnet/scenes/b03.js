// @design one_question_sorts: a single dashed item under a drawn question while its type and place fade back
// Treatments: (1) static doc with signalling, (2) doc with question above, side items fading [chosen], (3) side items sliding out.
Loom.scene("b03", {
  build(ctx) {
    const { kit, m } = ctx;
    const dur = ctx.style.dur;

    // @form file_type_badge: a small outline badge standing for the file type
    const badge = ctx.el("type_badge", { x: 300, y: 540, w: 340, h: 260, kind: "card", exit: "recede" });
    const bp = kit.path(badge.inner, "M20 20 H240 V240 H20 Z", { stroke: ctx.c("ink"), sw: 3, fill: "none" });
    bp.setAttribute && bp.setAttribute("transform", "translate(30,0)");
    const bFold = kit.path(badge.inner, "M210 20 V50 H240", { stroke: ctx.c("ink"), sw: 3, fill: "none" });
    bFold.setAttribute && bFold.setAttribute("transform", "translate(30,0)");
    const bt = kit.text(badge.inner, "File type", { role: "label", x: 50, y: 110, w: 200, h: 60, align: "center", color: "ink" });
    const bl = kit.line(badge.inner, 90, 190, 240, 190, { stroke: ctx.c("muted"), sw: 3 });
    const bl2 = kit.line(badge.inner, 90, 215, 200, 215, { stroke: ctx.c("muted"), sw: 3 });

    // @form folder_outline: a folder outline for where the file is kept
    const folder = ctx.el("folder", { x: 1290, y: 540, w: 340, h: 260, kind: "card", exit: "recede" });
    const fp = kit.path(folder.inner, "M20 60 Q20 40 40 40 H120 L150 70 H300 Q320 70 320 90 V220 Q320 240 300 240 H40 Q20 240 20 220 Z", { stroke: ctx.c("ink"), sw: 3, fill: "none" });
    const ft = kit.text(folder.inner, "Folder", { role: "label", x: 60, y: 130, w: 220, h: 60, align: "center", color: "ink" });

    // doc
    const doc = ctx.el("doc", { x: 780, y: 470, w: 360, h: 420, kind: "card", exit: "recede" });
    const item = Loom.lesson.item(ctx, doc.inner, { variant: "plain", cls: "none", x: 40, y: 20, scale: 1.0 });

    // qmark
    const q = ctx.el("qmark", { x: 872, y: 90, w: 176, h: 330, kind: "icon", exit: "recede" });
    const hm = Loom.lesson.harm_mark(ctx, q.inner, { x: 0, y: 0, scale: 1.1 });

    const t1 = ctx.cue("One question sorts it");
    item.drawIn(t1, 1.0);
    m.draw(bp, t1 + 0.15, { dur: 0.8 });
    m.draw(bFold, t1 + 0.6, { dur: 0.4 });
    m.reveal(bt, t1 + 0.7);
    m.draw(bl, t1 + 0.8, { dur: 0.4 });
    m.draw(bl2, t1 + 0.9, { dur: 0.4 });
    m.draw(fp, t1 + 0.35, { dur: 0.8 });
    m.reveal(ft, t1 + 0.9);

    const t2 = ctx.cue("Who could be harmed if it got out");
    hm.drawOn(t2, 1.0);
    hm.showLabel(t2 + 1.0);
    hm.hoverFor(t2 + 1.0, ctx.end, 6);

    const t3 = ctx.cue("Not the file type");
    Loom.tween(badge.inner, { opacity: 1 }, { opacity: 0.2 }, t3, { dur: 0.6 });
    const t4 = ctx.cue("not the folder");
    Loom.tween(folder.inner, { opacity: 1 }, { opacity: 0.2 }, t4, { dur: 0.6 });
  },
});
