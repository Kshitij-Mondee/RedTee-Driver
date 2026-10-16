// @design exchange_without_access: two crossing carriers leave copies while a third receptacle stays empty
/* Treatments considered: static lanes with signalling; two straight overlapping carriers; separated travel lanes with a timed copy. Chosen: separated lanes, because exchange and copying are the argument. */
Loom.scene("b07", {
  build(ctx) {
    const {kit, m} = ctx;
    const tEach = ctx.cue("Each side");
    const tValue = ctx.cue("temporary value");
    const tCopy = ctx.cue("copies both");
    const tFail = ctx.cue("cannot practically work out");
    const board = ctx.held("board");
    // The medium path shot deliberately crops endpoint cards, not values or slots.
    // Apply this crop window at playback, after earlier held-board crop drives.
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
    ctx.held("cert");
    ctx.held("label_watcher");
    const slots = ctx.held("key_slots");
    const keyLabel = ctx.held("label_key");
    const keyLead = ctx.held("label_key.lead");
    if (keyLabel) m.exit(keyLabel, tEach, "recede");
    if (keyLead) m.exit(keyLead, tEach, "recede");
    board.handle.setState("band_mid", tEach, ctx.style.dur("move"));
    slots.handle.setState("watcher_shake", tFail);
    // @form temporary_carrier: slate values remain distinct on two travel lanes
    const fit = kit.fit("Temporary value", {role:"label", w:244, h:42, maxLines:1, weight:700});
    const W = 268, H = 56;
    function value(name, x) {
      const E = ctx.el(name, {x:x, y:452, w:W, h:H, kind:"token", exit:"recede"});
      kit.pill(E.inner, 0, 0, W, H, {fill:"accent3", shadow:false});
      kit.text(E.inner, "Temporary value", {role:"label", size:30, weight:700, x:12, y:7, w:244, h:42, maxLines:1, align:"center", valign:"middle", color:"onAccent"});
      m.reveal(E, tEach, {dy:0, dur:ctx.style.dur("enter")});
      return E;
    }
    const a = value("token_a", 506);
    const b = value("token_b", 1146);
    const travelEnd = tCopy + ctx.style.dur("move") * 4;
    const travelDur = travelEnd - tValue;
    // One continuous seekable drive, separate lanes prevent carriers covering each other or the aperture.
    function cross(E, dx, lane) {
      const carrier = Loom.svg("g", {}, E.inner);
      while (E.inner.firstChild !== carrier) carrier.appendChild(E.inner.firstChild);
      Loom.drive((e, raw) => {
        const p = Math.max(0, Math.min(1, raw));
        const q = p*p*(3-2*p);
        const lift = Math.min(1, p*5, (1-p)*5);
        carrier.setAttribute("transform", "translate(" + (dx*q) + " " + (lane*lift) + ")");
      }, tValue, travelDur, "linear");
    }
    cross(a, 640, -72);
    cross(b, -640, 110);
    // @form copied_values: two legible copies stack within the existing tray
    const tray = ctx.el("tray_values", {x:844, y:608, w:232, h:110, kind:"value", exit:"recede"});
    const copyFit = kit.fit("Temporary value", {role:"label", w:212, h:38, maxLines:1, weight:700});
    for (let i=0; i<2; i++) {
      const copy = ctx.el("tray_value_" + i, {x:0, y:i*58, w:232, h:50, kind:"token", parent:tray.inner, exit:"recede"});
      kit.pill(copy.inner, 0, 0, 232, 50, {fill:"accent3", shadow:false});
      kit.text(copy.inner, "Temporary value", {role:"label", size:28, weight:700, x:10, y:6, w:212, h:38, align:"center", valign:"middle", maxLines:1, color:"onAccent"});
      m.reveal(copy, tCopy + i*ctx.style.dur("stagger"), {dy:-10, dur:ctx.style.dur("enter")});
    }
  }
});
