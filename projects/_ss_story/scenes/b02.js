// @design character_in_her_week: the running character in her own room while a week passes and her ideas fade
/* b02 - Say this is Maya. On Monday she leaves a workshop buzzing with three ideas; by Wednesday one is
 * fuzzy; by Friday most of it has gone quiet.
 * Treatments: (A) a bust with icons (the old hero.character_moment: warm, but she never acts and the week is
 * a label), (B) a forgetting-curve chart (rejected: the curve is b06's job; a person comes first),
 * (C) CHOSEN: Maya, a rigged character in a medium shot in her room (a window on the city behind her), acts
 * the week: buzzing on Monday, puzzled by Wednesday, shrugging by Friday, while the three ideas in her
 * thought cloud lose focus one by one. The room returns in b11 and b22, so the payoff can echo this opening.
 */
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // the room: the same room in b02, b11 and b22 (the running character's world)
    // @form room_set: floor line, wall window and desk that a character stands in
    const room = ctx.el("room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    kit.rect(room.inner, -40, 900, 2000, 220, { fill: "field2", r: 0, flat: true, shadow: false });
    kit.line(room.inner, -40, 900, 1960, 900, { stroke: "line", sw: 3 });
    const W = [1200, 110, 620, 400];
    const city = ctx.depth("window_city", { dolly: [ctx.start, ctx.end], push: 0.08, drift: -30, focus: 0.3, cx: 1510, cy: 310, clip: [...W, 26], parent: room });
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
    kit.rect(room.inner, 1500, 590, 260, 110, { fill: "surface2", r: 10 });
    kit.icon(room.inner, "laptop", { x: 1630, y: 645, size: 74, color: "muted" });
    m.reveal(room, ctx.start + 0.05, { dy: 0 });

    // the wall calendar: the day changes as time passes
    // @form day_card: a wall calendar whose day changes as time passes
    const cal = ctx.el("calendar", { x: 1080, y: 550, w: 300, h: 150, kind: "card", exit: "recede" });
    kit.rect(cal.inner, 0, 0, 300, 150, { fill: "surface" });
    kit.rect(cal.inner, 0, 0, 300, 40, { fill: "accent3", r: 12, shadow: false });

    // Maya, the learner's stand-in (rig "ava"), in a medium shot: big enough that her face carries the moment
    const maya = ctx.character("maya", "ava", { x: 900, y: 1200, scale: 1.25, skin: 1, top: "accent4", bottom: "surface2" });
    maya.pose("present", ctx.cue("this is Maya"), { dur: 0.5 });
    maya.look(0.8, -0.2, ctx.cue("this is Maya"));
    const tag = ctx.el("name_tag", { x: 1010, y: 790, w: 200, h: 68, kind: "label", exit: "recede" });
    kit.pill(tag.inner, 0, 0, 200, 68, { fill: "accent4" });
    kit.text(tag.inner, "Maya", { role: "label", x: 0, y: 0, w: 200, h: 68, align: "center", valign: "middle", weight: 800, color: S.pickTokenOn("accent4") });
    m.spring(tag, ctx.cue("this is Maya") + 0.2, { preset: "gentle", dy: 20 });
    const days = [["Monday", ctx.cue("On Monday")], ["Wednesday", ctx.cue("By Wednesday")], ["Friday", ctx.cue("By Friday")]].map(([label, at], i) => {
      const t = ctx.el("day_" + (i + 1), { x: 0, y: 40, w: 300, h: 110, kind: "text", parent: cal.inner, exit: "recede" });
      kit.text(t.inner, label, { role: "lead", x: 12, y: 0, w: 276, h: 110, align: "center", valign: "middle", weight: 800 });
      return { t, at };
    });
    m.drop(cal, days[0].at - 0.3);
    days.forEach((d, i) => {
      m.reveal(d.t, i === 0 ? d.at - 0.15 : d.at, { dy: 12 });   // the first day arrives with the card
      if (i < days.length - 1) m.exit(d.t, days[i + 1].at - 0.5, "recede");   // gone before the next day arrives (no double exposure)
    });

    // her thought cloud: a scalloped cloud with trailing puffs toward her head (900, 388)
    // @form thought_bubble: a scalloped thought cloud with trailing puffs that holds a few items
    const bub = ctx.el("bubble", { x: 60, y: 160, w: 760, h: 520, kind: "bubble", exit: "iris" });
    [[90, 70, 70], [220, 40, 78], [360, 34, 80], [490, 48, 74], [580, 110, 62], [80, 400, 64], [220, 440, 70], [370, 444, 70], [510, 410, 64], [40, 230, 60], [600, 300, 56]]
      .forEach(([cx, cy, r]) => kit.disc(bub.inner, cx, cy, r, { fill: "ink", flat: true, shadow: false }));
    kit.rect(bub.inner, 30, 40, 580, 400, { fill: "ink", r: 90, shadow: false });
    [[676, 312, 18], [720, 282, 11]].forEach(([cx, cy, r]) => kit.disc(bub.inner, cx, cy, r, { fill: "ink", flat: true, shadow: false }));
    const tIdeas = ctx.cue("buzzing");
    m.iris(bub, tIdeas - 0.35);
    [["lightbulb", "Idea one", ctx.cue("buzzing"), ctx.cue("one has gone fuzzy")], ["target", "Idea two", ctx.cue("three new"), ctx.cue("most of it")],
     ["message-circle", "Idea three", ctx.cue("new ideas"), ctx.cue("gone quiet")]].forEach(([icon, label, tIn, tOut], i) => {
      // @form icon_label_card: an icon beside a short label on a filled row
      const E = ctx.el("idea_" + (i + 1), { x: 120, y: 206 + i * 112, w: 480, h: 92, kind: "row", exit: "recede" });
      const fill = ["accent", "accent2", "accent3"][i];
      kit.rect(E.inner, 0, 0, 480, 92, { fill, r: 22 });
      kit.icon(E.inner, icon, { x: 56, y: 46, size: 48, color: S.pickTokenOn(fill) });
      kit.text(E.inner, label, { role: "lead", x: 100, y: 0, w: 360, h: 92, valign: "middle", weight: 800, color: S.pickTokenOn(fill) });
      m.spring(E, tIn, { preset: "snappy", dy: 30, scale: 0.9 });
      // fading IS the idea: the chip loses opacity and focus (a blur grows) as the week passes
      const f = Loom.svg("filter", { id: Loom.uid("fz"), x: "-20%", y: "-40%", width: "140%", height: "180%" }, E.inner);
      const blur = Loom.svg("feGaussianBlur", { stdDeviation: 0 }, f);
      E.life.setAttribute("filter", `url(#${f.getAttribute("id")})`);
      Loom.drive((e) => { blur.setAttribute("stdDeviation", (e * 7).toFixed(2)); E.life.setAttribute("opacity", (1 - e * 0.8).toFixed(3)); },
                 tOut, 1.1, "exit", { kind: "fade", beat: ctx.beat.id, name: E.name, content: true });
    });

    // Maya acts the week
    maya.pose("cheer", tIdeas - 0.1, { dur: 0.45 }); maya.emotion("happy", tIdeas); maya.look(-0.9, -0.5, tIdeas + 0.3);
    maya.pose("explain", ctx.cue("new ideas") + 0.4, { dur: 0.6 });
    maya.pose("think", ctx.cue("By Wednesday"), { dur: 0.6 }); maya.emotion("concerned", ctx.cue("one has gone fuzzy"));
    maya.pose("shrug", ctx.cue("By Friday"), { dur: 0.5 }); maya.emotion("surprised", ctx.cue("most of it"));
    maya.gesture("shrug", ctx.cue("gone quiet"), ctx.cue("gone quiet") + 1.2);
  },
});
