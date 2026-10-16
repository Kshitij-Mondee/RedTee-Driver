// @design many_to_one_step: a long list collapses to a single line that slides into the third slot while two colleagues lean in to agree
// Treatments: (A) list collapses into slot (chosen); (B) physics jar tipping items; (C) static comment with three slots and two people, signalling by underline only.
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = (el, o, t) => Loom.tl.set(el, { opacity: o }, t);

    const roomE = ctx.el("meeting_room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const room = Loom.lesson.meeting_room(ctx, roomE.inner, {});
    room.setState("replay", null);

    function person(name, member, skin, cloth, cx, flip) {
      const E = ctx.el(name, { x: cx - 260, y: 330, w: 520, h: 480, kind: "character", exit: "recede" });
      const faces = {};
      ["neutral", "explaining", "happy"].forEach(function (em) {
        const g = Loom.svg("g", {}, E.inner);
        kit.peep(g, member, em, { x: 260, y: 230, size: 480, flip: flip, cloth: cloth, skin: skin });
        g.setAttribute("opacity", em === "neutral" ? 1 : 0);
        faces[em] = g;
      });
      return { E: E, faces: faces, cx: cx };
    }
    const mgr = person("Manager", "elder_woman", 0, "accent3", 640, false);
    const sam = person("Sam", "man", 2, "cloth", 1220, true);

    const bE = ctx.el("comment_bubble", { x: 300, y: 90, w: 1000, h: 333, kind: "bubble", exit: "recede" });
    const bub = Loom.lesson.comment_bubble(ctx, bE.inner, { w: 1000 });
    bub.setState("effect", null);
    const sc = 1000 / 900;
    const slotY = 180 * sc;
    const tOpen = ctx.cue("One small step");
    bub.setState("step_open", tOpen);
    Loom.tween(bub.slots.step.fill, { opacity: 0 }, { opacity: 1 }, tOpen, { dur: 0.42 });

    const lines = ["Listen more", "Talk less", "Take notes", "Ask first", "Wait", "Summarise"];
    const lE = ctx.el("long_list", { x: 1400, y: 90, w: 400, h: 440, kind: "card", exit: "recede" });
    kit.rect(lE.inner, 0, 0, 400, 440, { fill: "surface", r: 14, stroke: "ink" });
    const rows = [];
    lines.forEach(function (w, i) {
      const g = Loom.svg("g", {}, lE.inner);
      kit.line(g, 28, 62 + i * 66, 372, 62 + i * 66, { stroke: "line", sw: 3 });
      kit.text(g, w, { role: "body", x: 36, y: 10 + i * 66, w: 330, h: 50, maxLines: 1, align: "left", valign: "middle", color: "ink" });
      rows.push(g);
    });
    const tList = ctx.cue("beats a long list");
    m.drop(lE, Math.max(ctx.start + 0.05, tList - 0.4));
    rows.slice(0, 5).forEach(function (g, i) {
      Loom.tween(g, { opacity: 1 }, { opacity: 0 }, tList + 0.6 + i * 0.07, { dur: 0.25 });
    });

    const sE = ctx.el("step_line", { x: 1400, y: 570, w: 400, h: 70, kind: "label", exit: "recede" });
    sE.inner.setAttribute("opacity", 0);
    kit.rect(sE.inner, 0, 0, 400, 70, { fill: "accent4", r: 16 });
    const sTxt = Loom.svg("g", { transform: "scale(" + sc + ")" }, sE.inner);
    kit.text(sTxt, "One small step", { role: "body", x: 20, y: 2, w: 320, h: 56, maxLines: 1, align: "left", valign: "middle", color: "ink" });
    const ul = kit.line(sE.inner, 24, 62, 250, 62, { stroke: "accent", sw: 4 });
    const tSlide = tList + 1.2;
    T(sE.inner, 1, tSlide - 0.05);
    m.reveal(sE, tSlide - 0.05, { dy: 0 });
    m.travel(sE, tSlide, { x: 300 + 28 * sc - 1400, y: 90 + slotY - 4 - 570 + 3, scale: 1 });
    m.draw(ul, tSlide + 0.35, { dur: 0.5 });
    Loom.tween(lE.inner, { opacity: 1 }, { opacity: 0 }, tSlide, { dur: 0.3 });

    const hold = Loom.svg("g", {}, bE.inner);
    hold.setAttribute("opacity", 0);
    const sx = 28 * sc, sw = 844 * sc, sh = 56 * sc;
    const hy = slotY - 4, hh = sh + 8;
    kit.rect(hold, sx, hy, sw, hh, { fill: "accent4", r: 16, shadow: false, crisp: true, flat: true });
    const hTxt = Loom.svg("g", { transform: "scale(" + sc + ")" }, hold);
    kit.text(hTxt, "One small step", { role: "body", x: 46, y: 180, w: 808, h: 56, maxLines: 1, align: "left", valign: "middle", color: "ink" });
    kit.line(hold, sx + 24, hy + hh - 8, sx + 250, hy + hh - 8, { stroke: "accent", sw: 4 });
    T(hold, 1, tSlide + 0.9);
    T(sE.inner, 0, tSlide + 0.9);

    const tAsk = ctx.cue("Ask how Sam saw it");
    T(mgr.faces.neutral, 0, tAsk); T(mgr.faces.explaining, 1, tAsk);
    const tSaw = ctx.cue("saw it");
    T(sam.faces.neutral, 0, tSaw); T(sam.faces.explaining, 1, tSaw);
    const tAgree = ctx.cue("then agree it");
    T(mgr.faces.explaining, 0, tAgree); T(mgr.faces.happy, 1, tAgree);
    T(sam.faces.explaining, 0, tAgree); T(sam.faces.happy, 1, tAgree);
    m.travel(sam.E, tAgree, { x: -40, y: 0, scale: 1 });
    m.travel(mgr.E, tAgree, { x: 40, y: 0, scale: 1 });
  },
});
