// @design sequential_validation: three approvals accumulate on one held document
// Treatments considered: static row signalling; sequential row stamps; detached checklist.
// Choose sequential row stamps because their order is the content, not decoration.
Loom.scene("b05", {
  build(ctx) {
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    ctx.held("label_watcher");
    const tRows = ctx.cue("checks three things");
    const tSigner = ctx.cue("signer trusted");
    const tName = ctx.cue("name matches");
    const tDates = ctx.cue("in date");
    if (!cert || !cert.handle || !board || !board.handle) return;
    cert.handle.to("rowHL", 0.55, tRows, ctx.style.dur("enter"));
    cert.handle.setState("tick_signer", tSigner, ctx.style.dur("move"));
    cert.handle.setState("tick_name", tName, ctx.style.dur("move"));
    cert.handle.setState("tick_dates", tDates, ctx.style.dur("move"));
    // The close certificate shot deliberately crops the held endpoint cards.
    board.inner.setAttribute("data-bleed", ctx.start + "-" + ctx.end);
    // Apply this crop window at playback so later held-board builds cannot overwrite it.
    const croppedWords = Array.from(board.inner.querySelectorAll("text"));
    let laterBleeds;
    Loom.drive((e, raw) => {
      if (!laterBleeds) laterBleeds = croppedWords.map(node => node.getAttribute("data-bleed"));
      croppedWords.forEach((node, i) => {
        const window = raw > 0 && raw < 1 ? ctx.start + "-" + ctx.end : laterBleeds[i];
        if (window) node.setAttribute("data-bleed", window);
        else node.removeAttribute("data-bleed");
      });
    }, ctx.start, ctx.end - ctx.start, "linear");
    ctx.m.travel(cert, ctx.cue("The browser"), {x:-220,y:100,dur:ctx.style.dur("move")});
    board.handle.highlight("browser", 1, tName);
    board.handle.highlight("browser", 0, tDates);
    // @form approval_pills: each outcome sits beside its corresponding row
    function label(name, text, y, t) {
      ctx.kit.fit(text, {role:"label",w:260,h:44,maxLines:1,weight:700});
      return Loom.treat.label(ctx, name, {x:900,y:220+y,text:text,to:[760,220+y],tone:"pos",role:"label",as:"pill",t:t});
    }
    label("label_signer", "Signer trusted", 245, tSigner);
    label("label_name", "Name matches", 89, tName);
    label("label_date", "In date", 193, tDates);
  }
});
