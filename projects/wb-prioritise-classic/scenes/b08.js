// @design matrix_week_block: one solid scheduled block replaces scattered work fragments
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const qImpact = ctx.held("q_impact"), qEffort = ctx.held("q_effort"), axisImpact = ctx.held("axis_impact"), axisEffort = ctx.held("axis_effort"), cardReply = ctx.held("card_reply"), cardBudget = ctx.held("card_budget"), cardExpenses = ctx.held("card_expenses"), cardDeck = ctx.held("card_deck"), dividerV = ctx.held("divider_v"), dividerH = ctx.held("divider_h"), tickReply = ctx.held("tick_reply"), zoneQuick = ctx.held("zone_quick"), moveQuick = ctx.held("move_quick"), dividerBuild = ctx.held("matrix_divider_build"), quickBuild = ctx.held("quick_zone_build"), replyTickBuild = ctx.held("reply_tick_build");
    [qImpact,qEffort,axisImpact,axisEffort,cardReply,cardBudget,cardExpenses,cardDeck,dividerV,dividerH,tickReply,zoneQuick,moveQuick,dividerBuild,quickBuild,replyTickBuild].forEach((E) => Loom.tl.set(E.life, { opacity: 1 }, ctx.start));
    const tMajor = ctx.cue("Major projects: block time for them."), tSwitch = ctx.cue("Switching tasks tends to cost time and accuracy.");
    Loom.lesson.matrix_board.recolor(ctx, zoneQuick, "ink", ctx.start + 0.05);
    const major = Loom.lesson.matrix_board(ctx, null, { build: ["zone_major", "move_major"], names: { zone_major: "zone_major", move_major: "move_major" } });
    Loom.tl.set(major.move_major.mover, { y: 28 }, ctx.start); major.setState("zones", tMajor); major.setState("moves", tMajor + 0.55);
    const week = Loom.lesson.week_strip(ctx, null, { x: 1270, y: 150, build: ["strip", "scraps", "strikes", "budget"], names: { week_days: "week_days", week_strip: "week_strip", budget_scraps: "budget_scraps", scrap_strikes: "scrap_strikes", budget_block: "budget_block", budget_hatch: "budget_hatch", budget_label: "budget_label" } });
    const tStrip = tMajor + 0.45; week.setState("strip", tStrip); week.setState("scraps", tStrip + 0.65); week.setState("strikes", tSwitch); const tBlock = tSwitch + 0.8; week.setState("budget", tBlock);
    const x1=1005,y1=355,x2=1370,y2=312,bend=-56,len=Math.hypot(x2-x1,y2-y1)||1,mx=(x1+x2)/2,my=(y1+y2)/2,cx=mx-((y2-y1)/len)*bend,cy=my+((x2-x1)/len)*bend,a=Math.atan2(y2-cy,x2-cx),hs=22,h1=[x2-hs*Math.cos(a-.5),y2-hs*Math.sin(a-.5)],h2=[x2-hs*Math.cos(a+.5),y2-hs*Math.sin(a+.5)],xs=[x1,cx,x2,h1[0],h2[0]],ys=[y1,cy,y2,h1[1],h2[1]],pad=12,bx=Math.floor(Math.min.apply(null,xs)-pad),by=Math.floor(Math.min.apply(null,ys)-pad);
    const budgetLink=ctx.el("budget_link",{x:bx,y:by,w:Math.ceil(Math.max.apply(null,xs)+pad)-bx,h:Math.ceil(Math.max.apply(null,ys)+pad)-by,kind:"connector",exit:"recede"}),X=(v)=>(v-bx).toFixed(1),Y=(v)=>(v-by).toFixed(1);
    kit.sketch(budgetLink.inner,"path",["M"+X(x1)+" "+Y(y1)+" Q"+X(cx)+" "+Y(cy)+" "+X(x2)+" "+Y(y2)],{fill:"none",stroke:"ink"}); kit.sketch(budgetLink.inner,"path",["M"+X(h1[0])+" "+Y(h1[1])+" L"+X(x2)+" "+Y(y2)+" L"+X(h2[0])+" "+Y(h2[1])],{fill:"none",stroke:"ink"}); m.draw(budgetLink,tBlock+.55,{dur:.4});
  }
});
