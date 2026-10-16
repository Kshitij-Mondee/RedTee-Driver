// @design tradeoff_visible: the added major project fills the week and points toward the work that must move
Loom.scene("b12", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw"), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4), writeDur = (text) => DRAW * clamp(text.length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
    const qImpact = ctx.held("q_impact"), qEffort = ctx.held("q_effort"), axisImpact = ctx.held("axis_impact"), axisEffort = ctx.held("axis_effort");
    const cardReply = ctx.held("card_reply"), cardBudget = ctx.held("card_budget"), cardExpenses = ctx.held("card_expenses"), cardDeck = ctx.held("card_deck");
    const dividerV = ctx.held("divider_v"), dividerH = ctx.held("divider_h"), tickReply = ctx.held("tick_reply"), zoneQuick = ctx.held("zone_quick"), moveQuick = ctx.held("move_quick");
    const zoneMajor = ctx.held("zone_major"), moveMajor = ctx.held("move_major"), zoneFill = ctx.held("zone_fill"), moveFill = ctx.held("move_fill"), zoneThankless = ctx.held("zone_thankless"), moveThankless = ctx.held("move_thankless"), laterTag = ctx.held("later_tag");
    const weekStrip = ctx.held("week_strip"), budgetScraps = ctx.held("budget_scraps"), scrapStrikes = ctx.held("scrap_strikes"), budgetBlock = ctx.held("budget_block"), budgetHatch = ctx.held("budget_hatch"), budgetLink = ctx.held("budget_link");
    const dividerBuild = ctx.held("matrix_divider_build"), quickBuild = ctx.held("quick_zone_build"), replyTickBuild = ctx.held("reply_tick_build");
    [qImpact,qEffort,axisImpact,axisEffort,cardReply,cardBudget,cardExpenses,cardDeck,dividerV,dividerH,tickReply,zoneQuick,moveQuick,zoneMajor,moveMajor,zoneFill,moveFill,zoneThankless,moveThankless,laterTag,weekStrip,budgetScraps,scrapStrikes,budgetBlock,budgetHatch,budgetLink,dividerBuild,quickBuild,replyTickBuild].forEach((E) => Loom.tl.set(E.life, { opacity: 1 }, ctx.start));
    const cardNew = ctx.held("card_new"), newNotes = ctx.held("new_notes"), qWhere = ctx.held("q_where"); m.exit(newNotes, ctx.start, "wipe"); m.exit(qWhere, ctx.start, "wipe");
    const tMajor = ctx.cue("Major projects."), tBlock = ctx.cue("She blocks time and asks which task gives way."); m.travel(cardNew, tMajor, { x: -525, y: -70 });
    const secondWeek = Loom.lesson.week_strip(ctx, null, { build: ["second"], names: { second_block: "second_block", second_hatch: "second_hatch", second_label: "second_label" } }); secondWeek.setState("second", tBlock - 0.2);
    const x1 = 755, y1 = 474, x2 = 725, y2 = 600, bend = -40, len = Math.hypot(x2 - x1, y2 - y1), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, cx = mx - ((y2 - y1) / len) * bend, cy = my + ((x2 - x1) / len) * bend, a = Math.atan2(y2 - cy, x2 - cx), hs = 22;
    const h1 = [x2 - hs * Math.cos(a - 0.5), y2 - hs * Math.sin(a - 0.5)], h2 = [x2 - hs * Math.cos(a + 0.5), y2 - hs * Math.sin(a + 0.5)], xs = [x1, cx, x2, h1[0], h2[0]], ys = [y1, cy, y2, h1[1], h2[1]], pad = 12, bx = Math.floor(Math.min(...xs) - pad), by = Math.floor(Math.min(...ys) - pad);
    const arrow = ctx.el("giveway_arrow", { x: bx, y: by, w: Math.ceil(Math.max(...xs) + pad) - bx, h: Math.ceil(Math.max(...ys) + pad) - by, kind: "connector", exit: "recede" }); const X = (v) => (v - bx).toFixed(1), Y = (v) => (v - by).toFixed(1);
    hand(arrow.inner, "M" + X(x1) + " " + Y(y1) + " Q" + X(cx) + " " + Y(cy) + " " + X(x2) + " " + Y(y2)); hand(arrow.inner, "M" + X(h1[0]) + " " + Y(h1[1]) + " L" + X(x2) + " " + Y(y2) + " L" + X(h2[0]) + " " + Y(h2[1])); m.draw(arrow, tBlock + 0.55, { dur: Math.min(0.45, drawDur(len * 1.15)) });
    const givesWay = ctx.el("gives_way", { x: 1270, y: 350, w: 550, h: 200, kind: "text", exit: "wipe" }); kit.text(givesWay.inner, "Which task gives way?", { role: "title", x: 0, y: 0, w: 550, h: 200, maxLines: 2, valign: "middle", color: ctx.c("accent") }); m.unmask(givesWay, tBlock + 0.85, { dir: "ltr", dur: writeDur("Which task gives way?") });
  },
});
