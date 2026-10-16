// @design unguarded_duplicate: a moving readable card branches into an identical retained card while the source continues
Loom.scene("b02", {
  build(ctx) {
    const {kit, m} = ctx;
    // Three treatments: static twins with a leader; moving split with retained copy; full-frame duplication.
    // Choose the moving split: the unobstructed act of copying is the visual argument.
    const tRead = ctx.cue("readable text");
    const tPath = ctx.cue("Anyone on the path");
    const tCopy = ctx.cue("copy it");
    const board = ctx.held("board");
    const packet = ctx.held("packet");
    const labelWatcher = ctx.held("label_watcher");
    // The medium shot deliberately crops the two endpoint cards, not the readable travelling subject.
    board.inner.setAttribute("data-bleed", ctx.start + "-" + ctx.end);
    // Apply this crop window to text at playback so later held-board builds cannot overwrite it.
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
    board.handle.setState("router_highlight", tPath);
    packet.handle.setState("pulse", tRead);
    // @form attached_term: the readable label belongs to the travelling source
    kit.fit("Readable text", {role:"label", w:280, h:56, maxLines:1, weight:700});
    const readable = Loom.treat.label(ctx, "label_readable", {
      x:740, y:345, text:"Readable text", to:[740,420], tone:"surface", role:"label", as:"pill", t:tRead
    });
    // The source approaches the aperture before duplication; each leg is driven once.
    // Travel is an offset from the held element's original box at (250,366).
    m.travel(packet, tPath, {x:610, y:54, dur:ctx.style.dur("move")});
    m.exit(readable, tPath, "recede");
    // @form retained_twin: an exact readable twin drops into the empty tray
    const copy = ctx.el("copy", {x:860, y:420, w:200, h:128, kind:"card", exit:"recede"});
    copy.handle = Loom.lesson.packet(ctx, copy.inner, {});
    copy.handle.setState("copy_readable", tCopy);
    m.reveal(copy, tCopy, {dy:0, dur:ctx.style.dur("exit")});
    m.travel(copy, tCopy, {x:0, y:190, dur:ctx.style.dur("move")});
    m.travel(packet, tCopy, {x:870, y:54, dur:ctx.style.dur("move")});
    // @form tray_label: the retained card is named beside, not over, its identical rows
    kit.fit("Copy", {role:"label", w:140, h:56, maxLines:1, weight:700});
    Loom.treat.label(ctx, "label_copy", {
      x:1170, y:670, text:"Copy", to:[1060,670], tone:"surface", role:"label", as:"pill", t:tCopy
    });
  }
});
