// @design sorted_list_payoff: arrival-order cards travel into a practical first-to-last plan
Loom.scene("b13", {
  build(ctx, props) {
    // Treatments: 1) static sorted list with labels. 2) arrival-order list reorders itself. 3) matrix cards collapse into a list. Choose 2 because the single travel makes the board's decision visible.
    const m = ctx.m;
    const tStart = ctx.speechStart;
    const tNew = ctx.cue("New request? Place it, then sort again.");
    const tSort = ctx.cue("sort again");
    const tQuick = ctx.cue("Tomorrow, start with one quick win.");

    // @form resort_title: callback heading on the first board
    const title = ctx.el("resort_title", { x: 140, y: 108, w: 760, h: 110, kind: "text", exit: "wipe" });
    ctx.kit.text(title.inner, "Place it. Sort again.", { role: "title", size: 72, x: 0, y: 0, w: 760, h: 110, maxLines: 1, valign: "middle", color: "ink" });
    m.unmask(title, tNew, { dir: "ltr", dur: ctx.style.dur("draw") });

    const cards = [
      { key: "deck", name: "row_deck", x: 340, y: 270, moveY: 360, build: ["card", "later"], later: "later" },
      { key: "expenses", name: "row_expenses", x: 340, y: 390, moveY: 120, build: ["card"] },
      { key: "reply", name: "row_reply", x: 340, y: 510, moveY: -240, build: ["card", "box", "tick"], tick: "tick_reply" },
      { key: "budget", name: "row_budget", x: 340, y: 630, moveY: -240, build: ["card"] }
    ];
    const handles = cards.map((card) => Loom.lesson.task_card(ctx, null, {
      key: card.key, name: card.name, x: card.x, y: card.y, boxSide: "left",
      names: { tick: card.tick }, build: card.build
    }));
    handles.forEach((H) => H.setState("card", tStart));

    const reply = handles[2];
    reply.setState("box", tSort + 0.48);
    reply.setState("tick", tSort + 0.60);

    handles.forEach((H, i) => m.travel(H.root, tSort + i * 0.06, { x: 0, y: cards[i].moveY }));
    handles[0].setState("later", tSort + 0.42);

    // @form row_notes: muted scheduling notes beside the sorted rows
    const notes = ctx.el("row_notes", { x: 735, y: 438, w: 230, h: 330, kind: "text", exit: "wipe" });
    ctx.kit.text(notes.inner, "Tue-Wed", { role: "label", size: 30, x: 0, y: 0, w: 230, h: 50, maxLines: 1, valign: "middle", color: "muted" });
    ctx.kit.text(notes.inner, "Fri", { role: "label", size: 30, x: 0, y: 120, w: 230, h: 50, maxLines: 1, valign: "middle", color: "muted" });
    ctx.kit.text(notes.inner, "later", { role: "label", size: 30, x: 0, y: 240, w: 230, h: 50, maxLines: 1, valign: "middle", color: "muted" });
    m.unmask(notes, tSort + 0.36, { dir: "ltr", dur: 0.72 });

    // @form start_line: closing action written below the sorted list
    const start = ctx.el("start_line", { x: 1080, y: 810, w: 680, h: 82, kind: "text", exit: "wipe" });
    ctx.kit.text(start.inner, "Start with a quick win", { role: "lead", size: 44, x: 0, y: 0, w: 680, h: 82, maxLines: 1, valign: "middle", color: "ink" });
    m.unmask(start, tQuick, { dir: "ltr", dur: ctx.style.dur("draw") });

    // @form quickwin_underline: the scene's one accent marker underline
    const underline = ctx.el("quickwin_underline", { x: 1078, y: 892, w: 540, h: 24, kind: "mark", exit: "recede" });
    ctx.kit.sketch(underline.inner, "path", ["M0 16 C155 5, 350 6, 528 13"], { fill: "none", stroke: "accent", sw: 6 });
    m.draw(underline, tQuick + 0.5, { dur: ctx.style.dur("draw") });
  }
});
