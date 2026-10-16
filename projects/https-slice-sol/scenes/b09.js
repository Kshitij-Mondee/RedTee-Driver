// @design checks_link: a recalled approval grows and connects to the object it validates
Loom.scene("b09", {
  build(ctx, props) {
    /* Three treatments: static badge with a signalled leader; a drawn connection with sequential ticks; a travelling seal. Choose the drawn connection because the relationship is the change. The storyboard camera handles the continuous push. */
    const {kit, m} = ctx;
    const tChecks = ctx.cue("Those checks");
    const tTrusted = ctx.cue("key is trusted");
    const tRecall = ctx.cue("Name them");
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const slots = ctx.held("key_slots");
    const values = ctx.held("tray_values");
    // The close recall shot deliberately crops the retained tray and distant board context.
    [board, values, ctx.held("token_a"), ctx.held("token_b"), ctx.held("label_watcher")].forEach(E => {
      if (E) E.inner.setAttribute("data-bleed", ctx.start + "-" + ctx.end);
    });
    // Held kit handles, never copies. Enlarge now, recall the ticks only on the prompt.
    const same = ctx.held("label_same");
    const sameLeaders = ctx.held("same_key_leaders");
    if (same) m.exit(same, tChecks, "recede");
    if (sameLeaders) m.exit(sameLeaders, tChecks, "recede");
    // b04's travel and b06's life offset already place the badge at (130,110).
    if (cert && cert.handle) cert.handle.to("big", 1, tChecks, ctx.style.dur("enter"));
    if (slots && slots.handle) slots.handle.pulse("browser", tTrusted);
    if (cert && cert.handle) cert.handle.relight(tRecall, ctx.style.dur("move"));

    // @form recalled_connection: route outside the browser card, then into the key slot
    const connector = ctx.el("connector", {x:328,y:208,w:314,h:274,kind:"connector",exit:"recede"});
    const line = kit.path(connector.inner, "M2 2 H286 V272 H274", {fill:"none",stroke:"line",sw:2});
    m.draw(line, tChecks, {dur:ctx.style.dur("draw")});

    // @form recalled_checks: adjacent pill avoids the held browser's address and login rows
    kit.fit("Three checks", {role:"label",w:230,h:60,maxLines:1,weight:700});
    Loom.treat.label(ctx, "label_checks", {x:450,y:155,text:"Three checks",role:"label",tone:"ink",as:"pill",t:tRecall});
    // All four required held names continue unchanged through the recall pause.
  }
});
