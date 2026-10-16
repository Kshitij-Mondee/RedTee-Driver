// @design character_in_her_week_continued: back in her room, the running character closes her notes and pulls the ideas back
/* b11 - What works is the opposite. Close the notes, and pull the ideas back out. That is retrieval practice.
 * Treatments: (A) a bust with three icons appearing (the old version: nothing is DONE), (B) a definition
 * card (rejected: the term lands better after the learner sees it happen), (C) CHOSEN: the same room as
 * b02. Maya closes her notebook, thinks, and the three ideas come back OUT of her head one by one into the
 * cloud that emptied in b02 (the reverse of the fade); only then is the term named.
 */
Loom.scene("b11", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // the room: the same room in b02, b11 and b22 (the running character's world)
    // @form room_set: floor line, wall window and desk that a character stands in
    const room = ctx.el("room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    kit.rect(room.inner, -40, 900, 2000, 220, { fill: "field2", r: 0, flat: true, shadow: false });
    kit.line(room.inner, -40, 900, 1960, 900, { stroke: "line", sw: 3 });
    const W = [1200, 110, 620, 400];
    const city = ctx.depth("window_city", { dolly: [ctx.start, ctx.end], push: 0.08, drift: 24, focus: 0.3, cx: 1510, cy: 310, clip: [...W, 26], parent: room });
    city.sky("field2", "surface2");
    city.glow(1700, 180, 32, "ink");
    const far = city.layer(0.15), rng = Loom.rng("ss-skyline");
    for (let x = 1180; x < 1840; ) {
      const w = 40 + rng() * 70, h = 80 + rng() * 160;
      Loom.svg("rect", { x, y: 510 - h, width: w, height: h + 60, fill: city.tone("surface", 0.15) }, far);
      for (let wy = 510 - h + 14; wy < 490; wy += 26) for (let wx = x + 8; wx < x + w - 10; wx += 18)
        if (rng() > 0.7) Loom.svg("rect", { x: wx, y: wy, width: 7, height: 10, fill: S.c("accent2"), opacity: 0.6 }, far);
      x += w + 6;
    }
    city.ridge(0.6, [[1160, 530], [1400, 480], [1640, 505], [1860, 470]], "field");
    Loom.svg("rect", { x: W[0], y: W[1], width: W[2], height: W[3], rx: 26, fill: "none", stroke: S.c("surface"), "stroke-width": 14 }, room.inner);
    Loom.svg("line", { x1: W[0] + W[2] / 2, y1: W[1], x2: W[0] + W[2] / 2, y2: W[1] + W[3], stroke: S.c("surface"), "stroke-width": 8 }, room.inner);
    kit.rect(room.inner, 700, 700, 1120, 34, { fill: "surface", r: 10 });
    kit.rect(room.inner, 760, 734, 26, 166, { fill: "surface2", r: 6, shadow: false });
    kit.rect(room.inner, 1754, 734, 26, 166, { fill: "surface2", r: 6, shadow: false });
    
    m.reveal(room, ctx.start + 0.05, { dy: 0 });

    // the notebook on the desk: open, then closed on "Close the notes"
    // @form notebook: an open two-page notebook that can close
    const book = ctx.el("notebook", { x: 1300, y: 580, w: 400, h: 120, kind: "prop", exit: "recede" });
    kit.rect(book.inner, 0, 0, 196, 120, { fill: "surface", r: 8 });
    [24, 52, 80].forEach((y) => kit.line(book.inner, 22, y, 174, y, { stroke: "line", sw: 4 }));
    const right = Loom.svg("g", {}, book.inner);
    kit.rect(right, 204, 0, 196, 120, { fill: "surface", r: 8 });
    [24, 52, 80].forEach((y) => kit.line(right, 226, y, 378, y, { stroke: "line", sw: 4 }));
    const cover = Loom.svg("g", { opacity: 0 }, book.inner);
    kit.rect(cover, 0, 0, 196, 120, { fill: "accent3", r: 8 });
    kit.icon(cover, "book-x", { x: 98, y: 60, size: 56, color: S.pickTokenOn("accent3") });
    m.reveal(book, ctx.start + 0.3, { dy: 10 });
    const tClose = ctx.cue("Close the notes");
    Loom.drive((e) => {
      right.setAttribute("transform", `translate(204 0) scale(${(1 - e).toFixed(3)} 1) translate(-204 0)`);
      cover.setAttribute("opacity", e > 0.95 ? 1 : 0);
    }, tClose, 0.45, "move", { kind: "close", beat: ctx.beat.id, name: "notebook", content: true });
    Loom.sfx("card", tClose + 0.4);

    // Maya, the learner's stand-in (rig "ava"), in a medium shot: big enough that her face carries the moment
    const maya = ctx.character("maya", "ava", { x: 900, y: 1200, scale: 1.25, skin: 1, top: "accent4", bottom: "surface2" });
    maya.look(1, 0.3, ctx.start);
    maya.pose("point", ctx.cue("the opposite"), { dur: 0.5 });
    maya.pose("think", tClose + 0.3, { dur: 0.6 }); maya.emotion("focused", tClose + 0.3);
    maya.look(-0.9, -0.7, tClose + 0.3);

    // her thought cloud: a scalloped cloud with trailing puffs toward her head (900, 388)
    // @form thought_bubble: a scalloped thought cloud with trailing puffs that holds a few items
    const bub = ctx.el("bubble", { x: 60, y: 160, w: 760, h: 520, kind: "bubble", exit: "iris" });
    [[90, 70, 70], [220, 40, 78], [360, 34, 80], [490, 48, 74], [580, 110, 62], [80, 400, 64], [220, 440, 70], [370, 444, 70], [510, 410, 64], [40, 230, 60], [600, 300, 56]]
      .forEach(([cx, cy, r]) => kit.disc(bub.inner, cx, cy, r, { fill: "ink", flat: true, shadow: false }));
    kit.rect(bub.inner, 30, 40, 580, 400, { fill: "ink", r: 90, shadow: false });
    [[676, 312, 18], [720, 282, 11]].forEach(([cx, cy, r]) => kit.disc(bub.inner, cx, cy, r, { fill: "ink", flat: true, shadow: false }));
    m.iris(bub, ctx.cue("pull the ideas") - 0.4);
    const head = { x: 900, y: 388 };
    [["lightbulb", "Idea one", ctx.cue("pull the ideas")], ["target", "Idea two", ctx.cue("ideas back")], ["message-circle", "Idea three", ctx.cue("back out")]].forEach(([icon, label, t], i) => {
      // @form icon_label_card: an icon beside a short label on a filled row
      const E = ctx.el("idea_" + (i + 1), { x: 120, y: 206 + i * 112, w: 480, h: 92, kind: "row", exit: "recede" });
      const fill = ["accent", "accent2", "accent3"][i];
      kit.rect(E.inner, 0, 0, 480, 92, { fill, r: 22 });
      kit.icon(E.inner, icon, { x: 56, y: 46, size: 48, color: S.pickTokenOn(fill) });
      kit.text(E.inner, label, { role: "lead", x: 100, y: 0, w: 360, h: 92, valign: "middle", weight: 800, color: S.pickTokenOn(fill) });
      // it travels out of her head into its place: recall is pulling it OUT
      Loom.tween(E.inner, { opacity: 0, x: head.x - (E.x + 240), y: head.y - (E.y + 46), scale: 0.3, transformOrigin: "50% 50%" },
                 { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.6, ease: Loom.ease.move }, t, { kind: "travel", beat: ctx.beat.id, name: E.name, content: true });
      Loom.sfx("reveal", t + 0.5);
    });
    maya.pose("explain", ctx.cue("pull the ideas"), { dur: 0.5 }); maya.emotion("happy", ctx.cue("back out"));

    // the name for it, after she has done it
    // @form verdict_stamp: a short label stamped as a pill or tilted note, coloured to carry its valence
    const term = ctx.el("term", { x: 1120, y: 770, w: 640, h: 96, kind: "stamp", exit: "recede" });
    kit.pill(term.inner, 0, 0, 640, 96, { fill: "pos" });
    kit.icon(term.inner, "brain", { x: 62, y: 48, size: 48, color: S.pickTokenOn("pos") });
    kit.text(term.inner, "Retrieval practice", { role: "lead", x: 104, y: 0, w: 510, h: 96, maxLines: 1, valign: "middle", weight: 800, color: S.pickTokenOn("pos") });
    const tTerm = ctx.cue("retrieval practice");
    m.stamp(term, tTerm);
    maya.pose("cheer", tTerm + 0.1, { dur: 0.45 });
  },
});
