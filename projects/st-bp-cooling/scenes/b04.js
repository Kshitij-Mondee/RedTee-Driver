// @design promise_as_links: an unfilled route becomes a left to right sequence
Loom.scene("b04", {
  build(ctx) {
    // Three treatments: static outlined row with signalling; travelling outline; camera track.
    // Choose travelling outline, the sheet stays still while the route promises a sequence.
    const hall = ctx.held("hall_section");
    const title = ctx.held("title_note");
    const pool = ctx.held("heat_pool");
    const unknown = ctx.held("path_unknown");
    if (unknown) ctx.m.exit(unknown, ctx.start, "recede");
    const tDraw = ctx.cue("follow it out");
    const tLink = ctx.cue("link by link");
    if (title) Loom.tween(title.inner, {y:0}, {y:-110,duration:ctx.style.dur("move")}, ctx.start);
    // @form outlined_route: four links reserve a path for the explanation
    const sheet = ctx.el("heat_chain", {x:0,y:0,w:1920,h:960,kind:"scenery",exit:"recede"});
    const chain = Loom.lesson.heat_chain(ctx, sheet.inner, {name:"promise_links",seven:false,drafted:false});
    sheet.handle = chain;
    chain.setState("outlined", ctx.start);
    chain.layouts[4].cards.forEach((card,i) => {
      const at = tDraw + i * ctx.style.dur("stagger");
      ctx.m.draw(card.el, at, {dur:ctx.style.dur("draw") * 0.65});
      Loom.tl.set(card.label.life, {opacity:0}, ctx.start);
      Loom.tween(card.label.life, {opacity:0}, {opacity:1,duration:ctx.style.dur("enter") * 0.5}, at + ctx.style.dur("draw") * 0.65);
    });
    // One cyan outline passes through the existing cards and rests at the last link.
    const step = ctx.style.dur("move") * 0.45;
    chain.layouts[4].cards.forEach((card,i) => {
      const at = tLink + step * i;
      const end = at + step;
      chain.highlight(i, at, end);
    });
  }
});
