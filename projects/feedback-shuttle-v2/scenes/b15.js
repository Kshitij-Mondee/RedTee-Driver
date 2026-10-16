// @design own_rebuild_open: the viewer's own rebuild, set up and left open on the same desk
// Treatments considered: (1) static desk with all notes at once (rejected: piles up), (2) fly-in cards (rejected: loses the desk), (3) the desk held, one thing lands per cue (chosen).
Loom.scene("b15", {
  build(ctx, props) {
    const E = ctx.el("desk_set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    const desk = Loom.lesson.viewer_desk(ctx, E.inner, {});
    // @form desk_rebuild: sticky lands, tab pops, strike draws, three empty coloured slots pop under it
    const tSticky = ctx.cue("Now yours"), tWeek = ctx.cue("this week"), tCross = ctx.cue("rebuild it"), tSlots = ctx.cue("before you say it");
    // The sticky drops in at its final pose (3 degrees, full size): only its height changes while it
    // lands, so its wrapped lines never rotate or scale mid-drop.
    const stk = desk.sticky;
    Loom.drive(function (e) {
      const op = Math.max(0, Math.min(1, e * 2.5));
      stk.setAttribute("opacity", String(Math.round(op * 100) / 100));
      stk.setAttribute("visibility", op > 0.001 ? "inherit" : "hidden");
      stk.setAttribute("transform", "translate(930 " + (112 + Math.round((1 - e) * -60 * 100) / 100) + ") rotate(3 160 135)");
    }, tSticky, 0.4, "overshoot", { key: "b15.sticky" });
    desk.setState("this_week", tWeek);
    desk.setState("crossed", tCross, { dur: 0.7 });
    desk.setState("slots", tSlots);
    // This beat never shows the monitor chat (the sticky already carries the vague comment),
    // so drop its unused, hidden copy of the same words: it sat under the landing sticky.
    const root = E.inner.node ? E.inner.node() : E.inner;
    const first = root.querySelector("text");
    const chat = first && first.closest("g[visibility='hidden']");
    if (chat && chat.parentNode) chat.parentNode.removeChild(chat);
    // Exactly one live text at any instant: the This week and slot words take no layout box
    // (display none) until their own cue, so they never sit under the landing sticky's words.
    const texts = Array.prototype.slice.call(root.querySelectorAll("text"));
    const later = [[texts[1], tWeek], [texts[2], tSlots], [texts[3], tSlots + 0.18], [texts[4], tSlots + 0.36]];
    later.forEach(function (p, i) {
      const el = p[0];
      if (!el) return;
      el.setAttribute("display", "none");
      Loom.drive(function (e) { el.setAttribute("display", e > 0 ? "inline" : "none"); }, p[1], 0.05, "linear", { key: "b15.txt." + i });
    });
  }
});
