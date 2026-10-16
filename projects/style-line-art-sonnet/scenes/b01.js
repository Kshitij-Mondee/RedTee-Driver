// @design pause_before_commit: an ink-line laptop email whose cursor glides to the commit button and stops, one slow push in
Loom.scene("b01", {
  build(ctx, props) {
    const m = ctx.m, kit = ctx.kit;
    // Treatments: (1) static email + callout arrow, (2) lines draw on, cursor glides and stops, slow push in [chosen], (3) cursor only on empty sheet.
    const tSay = ctx.cue("Say your cursor is on Send");
    const tAtt = ctx.cue("A customer list is attached");
    const tWho = ctx.cue("contractor who started this week");
    const tPause = ctx.cue("You pause");

    const SC = 1.15, EX = 310, EY = 60, EW = 1300, EH = 790;
    // desk line the laptop stands on (the sheet's ink baseline)
    const D = ctx.el("desk_line", { x: 160, y: EY + 664 * SC - 2, w: 1600, h: 12, kind: "scenery", exit: "recede" });
    // @form desk_line: one long ink line the laptop stands on
    const dl = kit.line(D.inner, 0, 6, 1600, 6, { stroke: ctx.c("ink"), sw: 3 });
    m.draw(dl, tSay, { dur: 0.8 });

    const L = ctx.el("laptop_email", { x: EX, y: EY, w: EW, h: EH, kind: "card", exit: "recede" });
    const h = Loom.lesson.mail(ctx, L.inner, { x: 0, y: 0, scale: SC });
    // @form laptop_email: monoline laptop with the email, attachment and Send
    const fade = (el, t, dur, a, b) => Loom.drive(e => el.setAttribute("opacity", a + (b - a) * e), t, dur, "move");
    const dp = (p, v) => { v = Math.max(0, Math.min(1, v)); p.setAttribute("stroke-dasharray", v + " 2"); p.setAttribute("stroke-dashoffset", "0"); p.setAttribute("opacity", v <= 0.001 ? 0 : 1); };

    // 1. laptop lines draw on (screen underlay fades in with them)
    fade(h.g.firstChild, tSay, 0.8, 0, 1);
    const t1 = tSay;
    h.laptop.querySelectorAll("path").forEach((p, i) => {
      if (p.getAttribute("pathLength")) Loom.drive(e => dp(p, e), t1 + i * 0.12, 0.9, "move");
      else Loom.drive(e => p.setAttribute("opacity", e), t1 + i * 0.12, 0.6, "move");
    });
    // email fields print in order (underline and attachment come on their own words)
    let k = 0;
    Array.prototype.forEach.call(h.email.children, ch => {
      if (ch === h.underline) { h.underline.setAttribute("opacity", 0); return; }
      fade(ch, t1 + 0.7 + k * 0.1, 0.35, 0, 1); k++;
    });
    fade(h.send, t1 + 1.1, 0.4, 0, 1);
    // attachment: grey dashed chip draws in on its words
    fade(h.attachment, tAtt, 0.6, 0, 1);
    // underline on To
    h.drawUnderline(tWho, 1.0);

    // cursor: appears, glides to just above Send, stops
    const cs = h.cursor.querySelector("path");
    cs.setAttribute("stroke", ctx.c("accent"));
    cs.setAttribute("stroke-width", 4);
    fade(h.cursor, t1 + 0.8, 0.3, 0, 1);
    h.moveCursor("above_send", t1 + 1.0, 1.6);
    // the pause: an accent ring marks the held cursor
    const tp = h.targets.above_send;
    const r = 36, cx = tp[0] + 12, cy = tp[1] + 16;
    const ring = kit.path(h.g, "M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 0 " + (2 * r) + " 0a" + r + " " + r + " 0 1 0 " + (-2 * r) + " 0", { stroke: ctx.c("accent"), sw: 3, fill: "none" });
    // @form pause_ring: a single accent ring around the held cursor
    m.draw(ring, tPause, { dur: 0.6 });

    // slow push in toward Send
    const px = 1000, py = 470, s = 1.1;
    m.travel(L, ctx.start + 0.2, { x: (1 - s) * (px - EX), y: (1 - s) * (py - EY), scale: s, dur: ctx.end - ctx.start - 0.4 });
    m.travel(D, ctx.start + 0.2, { x: (1 - s) * (px - 160), y: (1 - s) * (py - (EY + 664 * SC - 2)), scale: s, dur: ctx.end - ctx.start - 0.4 });
  }
});
