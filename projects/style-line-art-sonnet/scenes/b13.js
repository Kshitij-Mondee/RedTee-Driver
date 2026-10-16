// @design same_email_new_path: the opening email redrawn, its attachment outline takes the class colour and the cursor leaves Send for a safer option
Loom.scene("b13", {
  build(ctx, props) {
    const m = ctx.m, kit = ctx.kit;
    // Treatments: (1) static email with a badge, (2) same layout as b01, outline recolours and the cursor takes a new path [chosen], (3) side-by-side before and after.
    const tSo = ctx.cue("So, that email");
    const tConf = ctx.cue("The list is confidential");
    const tNeed = ctx.cue("Does the contractor need it");
    const tChan = ctx.cue("approved, protected channel");
    const tOwner = ctx.cue("ask the list's owner first");

    const SC = 1.15, EX = 310, EY = 60, EW = 1300, EH = 790;
    const D = ctx.el("desk_line", { x: 160, y: EY + 664 * SC - 2, w: 1600, h: 12, kind: "scenery", exit: "recede" });
    // @form desk_line: one long ink line the laptop stands on
    const dl = kit.line(D.inner, 0, 6, 1600, 6, { stroke: ctx.c("ink"), sw: 3 });
    m.draw(dl, tSo, { dur: 0.8 });

    const L = ctx.el("laptop_email", { x: EX, y: EY, w: EW, h: EH, kind: "card", exit: "recede" });
    const h = Loom.lesson.mail(ctx, L.inner, { x: 0, y: 0, scale: SC });
    // @form laptop_email: the b01 laptop and email, same place and size
    const fade = (el, t, dur, a, b) => Loom.drive(e => el.setAttribute("opacity", a + (b - a) * e), t, dur, "move");
    const dp = (p, v) => { v = Math.max(0, Math.min(1, v)); p.setAttribute("stroke-dasharray", v + " 2"); p.setAttribute("stroke-dashoffset", "0"); p.setAttribute("opacity", v <= 0.001 ? 0 : 1); };

    // 1. the b01 layout redraws, cursor still over Send
    fade(h.g.firstChild, tSo, 0.8, 0, 1);
    h.laptop.querySelectorAll("path").forEach((p, i) => {
      if (p.getAttribute("pathLength")) Loom.drive(e => dp(p, e), tSo + i * 0.1, 0.8, "move");
      else Loom.drive(e => p.setAttribute("opacity", e), tSo + i * 0.1, 0.6, "move");
    });
    let k = 0;
    Array.prototype.forEach.call(h.email.children, ch => {
      if (ch === h.underline) { h.underline.setAttribute("opacity", 0); return; }
      fade(ch, tSo + 0.5 + k * 0.08, 0.3, 0, 1); k++;
    });
    h.drawUnderline(tSo + 0.7, 0.5);
    const sendW = document.createElementNS("http://www.w3.org/2000/svg", "g");
    h.send.parentNode.insertBefore(sendW, h.send);
    sendW.appendChild(h.send);
    fade(sendW, tSo + 0.8, 0.3, 0, 1);
    fade(h.attachment, tSo + 0.7, 0.4, 0, 1);
    // cursor starts where b01 left it: just above Send
    h.moveCursor("above_send", ctx.start, 0.01);
    fade(h.cursor, tSo + 0.8, 0.3, 0, 1);

    // 2. the attachment outline redraws in the confidential colour
    h.setClass("confidential", tConf, 0.8);

    // 3. Need it? prints beside the To field
    h.show("need", tNeed, 0.4);

    // 4. Send dims, cursor glides to Approved channel, its padlock row outlines in accent
    h.dimSend(true, tChan, 0.4);
    h.show("channel", tChan, 0.4);
    h.moveCursor("channel", tChan, 0.6);
    h.lightChannel(tChan + 0.5, 0.6);

    // 5. Ask the owner prints under the option
    h.show("owner", tOwner, 0.4);

    // same slow push as b01, gentler
    const px = 1000, py = 470, s = 1.06;
    m.travel(L, ctx.start + 0.2, { x: (1 - s) * (px - EX), y: (1 - s) * (py - EY), scale: s, dur: ctx.end - ctx.start - 0.4 });
    m.travel(D, ctx.start + 0.2, { x: (1 - s) * (px - 160), y: (1 - s) * (py - (EY + 664 * SC - 2)), scale: s, dur: ctx.end - ctx.start - 0.4 });
  }
});
