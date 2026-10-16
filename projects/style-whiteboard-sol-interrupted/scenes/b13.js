// @design shared_surface_resolved: the same gathering holds a durable outcome, one completion mark closes the loop
// Treatments: static written outcome with signalling; replacement before/after panels; chosen held gathering with expressions changing and writing accumulating, because continuity carries the contrast.
Loom.scene("b13", {
  build(ctx) {
    const {kit, m} = ctx;
    const tSame = ctx.cue("Same team, same hour");
    const tDecision = ctx.cue("decisions, owners and dates");
    const tClose = ctx.cue("read back and sent");
    const writeDur = str => ctx.style.dur("draw") * Math.max(0.45, Math.min(1.8, str.length / 14));

    // @form resolved_gathering: the existing cast remains seated at the existing surface
    const table = ctx.held("table");
    const steps = ctx.held("steps");
    const team = table.handle;
    const checklist = steps.handle;
    table.exit = "recede";
    steps.exit = "recede";
    ["email", "sent_today", "bubbles"].forEach(name => {
      const E = ctx.held(name);
      E.exit = "recede";
      Loom.tween(E.life, {opacity:1}, {opacity:0}, tSame, {dur:ctx.style.dur("exit")});
    });
    for (let i = 0; i < 4; i++) team.emotion(i, "happy", tSame);

    // @form durable_outcome: two written lines occupy the free front of the held surface
    const front = team.frontBox;
    const decisionList = ctx.el("decision_list", {x:front.x,y:front.y,w:front.w,h:front.h,parent:table.inner,kind:"text",exit:"wipe"});
    const lines = ["Pilot ships in June, Priya, by Friday", "Parked: side topic, Lena"];
    lines.forEach((text, i) => {
      const fit = kit.fit(text, {role:"lead",w:front.w-24,h:48,maxLines:1});
      const E = ctx.el("decision_list_row_" + i, {x:12,y:6+i*58,w:front.w-24,h:48,parent:decisionList.inner,kind:"text",exit:"wipe"});
      kit.text(E.inner, text, {role:"lead",x:10,y:0,w:front.w-44,h:48,maxLines:1,color:i === 0 ? "ink" : "muted",valign:"middle"});
      m.unmask(E, tDecision + i * ctx.style.dur("move"), {dir:"ltr",dur:writeDur(text)});
    });

    // @form completion_signal: the sole green mark completes the third box
    const closeTick = checklist.tick(2, tClose, {tone:"pos"});
    closeTick.exit = "recede";
    // The kit owns the tick drawing; close_tick is its semantic payoff role, not a second drawn mark.
  }
});
