// @design moment_a_nice_line_lands: a manager leans to a colleague, a vague compliment drops in over him, he beams and nods while another gathers half-written notes
// Treatments: (A) static three-person composition with bubble; (B) close on Sam only; (C) CHOSEN: wide room, lean, drop, beam, nod.
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const tImagine = ctx.cue("Imagine"), tMgr = ctx.cue("a manager tells Sam"), tGreat = ctx.cue("great energy in there today"), tBeam = ctx.cue("Sam beams"), tNod = ctx.cue("and nods");

    const roomE = ctx.el("meeting_room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const room = Loom.lesson.meeting_room(ctx, roomE.inner, {});
    room.setState("emptying", null);
    m.reveal(roomE, ctx.start + 0.05, { dy: 0 });

    const mk = (name, x, y, size) => ctx.el(name, { x: x - size / 2, y: y - size / 2, w: size, h: size, kind: "character", exit: "recede" });
    const mgrE = mk("Manager", 420, 640, 520), samE = mk("Sam", 820, 640, 560), priE = mk("Priya", 1380, 650, 520);
    const mgrG = Loom.svg("g", {}, mgrE.inner), samG = Loom.svg("g", {}, samE.inner), priG = Loom.svg("g", {}, priE.inner);
    const mgr = kit.peep(mgrG, "elder_woman", "neutral", { x: 260, y: 260, size: 520, flip: false, cloth: "accent3", skin: 0 });
    const samN = kit.peep(samG, "man", "neutral", { x: 280, y: 280, size: 560, flip: false, cloth: "cloth", skin: 2 });
    let samH = null;
    try { samH = kit.peep(samG, "man", "happy", { x: 280, y: 280, size: 560, flip: false, cloth: "cloth", skin: 2 }); samH.style.visibility = "hidden"; } catch (e) { samH = null; }
    const pri = kit.peep(priG, "woman", "neutral", { x: 260, y: 260, size: 520, flip: true, cloth: "cloth2", skin: 3 });
    m.settle(mgrE, ctx.start + 0.1, { dy: 30 });
    m.settle(samE, ctx.start + 0.2, { dy: 30 });
    m.settle(priE, ctx.start + 0.3, { dy: 30 });

    const tabE = ctx.el("table_front", { x: 0, y: 790, w: 1920, h: 290, kind: "scenery", exit: "recede" });
    kit.polygon(tabE.inner, [[70, 0], [1850, 0], [1920, 60], [0, 60]], { fill: "surface" });
    kit.rect(tabE.inner, -6, 60, 1932, 240, { fill: "field2", r: 0 });
    kit.line(tabE.inner, 0, 60, 1920, 60, { stroke: "line", sw: 5 });

    // Priya's notepad on the table: three lines written, rest empty
    const padE = ctx.el("notepad", { x: 1560, y: 770, w: 220, h: 150, kind: "prop", exit: "recede" });
    kit.rect(padE.inner, 0, 0, 220, 150, { fill: "surface", r: 8 });
    for (let i = 0; i < 5; i++) kit.line(padE.inner, 22, 30 + i * 25, i < 3 ? 190 - i * 20 : 198, 30 + i * 25, { stroke: i < 3 ? "ink" : "line", sw: i < 3 ? 4 : 2 });
    m.reveal(padE, ctx.start + 0.4, { dy: 0 });

    Loom.drive((e) => { mgrG.setAttribute("transform", "translate(" + (e * 35).toFixed(1) + " " + (e * 12).toFixed(1) + ") rotate(" + (e * 6).toFixed(2) + " 260 520)"); }, tMgr, 0.34, "editorial", { key: "mgr_lean" });

    const bubE = ctx.el("comment_bubble", { x: 560, y: 110, w: 860, h: 230, kind: "bubble", exit: "recede" });
    const bub = Loom.lesson.comment_bubble(ctx, bubE.inner, { w: 860, h: 230 });
    bub.setState("vague", null);
    m.reveal(bubE, tGreat, { dy: -90 });

    if (samH) Loom.drive((e, raw) => {
      const on = raw >= 0.5;
      samH.style.visibility = on ? "visible" : "hidden"; samN.style.visibility = on ? "hidden" : "visible";
    }, tBeam, 0.2, "linear", { kind: "character", name: "Sam_face", content: true });
    Loom.drive((e) => { samG.setAttribute("transform", "translate(0 " + (Math.sin(e * Math.PI * 4) * 12).toFixed(1) + ")"); }, tNod, 0.6, "linear", { key: "sam_nod" });
    Loom.drive((e) => { priG.setAttribute("transform", "rotate(" + (-Math.sin(e * Math.PI) * 4).toFixed(2) + " 260 520) translate(0 " + (Math.sin(e * Math.PI) * 8).toFixed(1) + ")"); }, tNod, 0.8, "linear", { key: "pri_glance" });
  },
});
