// @design character_in_her_week_payoff: the opening room returns with the ideas intact after spaced tests
/* b22 - Remember Maya? After her next workshop, she tests herself three times. Weeks later, she still has it.
 * Treatments: (A) a bust with a calendar (the old version), (B) a success badge (rejected: no proof in the
 * picture), (C) CHOSEN: the payoff echoes the opening (b02): the same room, the same framing and cloud.
 * Three self-tests land on a line with growing gaps (spacing, shown not said; no dates invented), the
 * calendar turns to "Weeks later", and this time the ideas stay bright: the opposite of b02's fade.
 */
Loom.scene("b22", {
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
    const cal = ctx.el("calendar", { x: 1080, y: 550, w: 330, h: 150, kind: "card", exit: "recede" });
    kit.rect(cal.inner, 0, 0, 330, 150, { fill: "surface" });
    kit.rect(cal.inner, 0, 0, 330, 40, { fill: "accent3", r: 12, shadow: false });

    // Maya, the learner's stand-in (rig "ava"), in a medium shot: big enough that her face carries the moment
    const maya = ctx.character("maya", "ava", { x: 900, y: 1200, scale: 1.25, skin: 1, top: "accent4", bottom: "surface2" });
    const tHi = ctx.cue("Remember Maya");
    maya.pose("wave", tHi, { dur: 0.4 }); maya.gesture("wave", tHi + 0.3, tHi + 1.6); maya.emotion("happy", tHi);
    maya.look(0.5, 0.1, tHi);
    const days = [["Next workshop", ctx.cue("After her next workshop")], ["Weeks later", ctx.cue("Weeks later")]].map(([label, at], i) => {
      const t = ctx.el("day_" + (i + 1), { x: 0, y: 40, w: 330, h: 110, kind: "text", parent: cal.inner, exit: "recede" });
      kit.text(t.inner, label, { role: "lead", x: 12, y: 0, w: 306, h: 110, align: "center", valign: "middle", weight: 800 });
      return { t, at };
    });
    m.drop(cal, days[0].at - 0.3);
    m.reveal(days[0].t, days[0].at - 0.15, { dy: 12 }); m.exit(days[0].t, days[1].at - 0.5, "recede"); m.reveal(days[1].t, days[1].at, { dy: 12 });

    // three self-tests on a line, each gap longer than the last: spacing, shown
    // @form spaced_ticks: marks on a timeline whose gaps widen
    const line = ctx.el("test_line", { x: 1080, y: 790, w: 680, h: 90, kind: "axis", exit: "recede" });
    const axis = kit.line(line.inner, 0, 45, 680, 45, { stroke: "line", sw: 4 });
    m.reveal(line, ctx.cue("tests herself") - 0.4, { dy: 0 });
    m.draw(axis, ctx.cue("tests herself") - 0.4, { dur: 0.5 });
    [60, 230, 560].forEach((x, i) => {
      const tk = ctx.el("test_" + (i + 1), { x: 1080 + x - 34, y: 790 + 11, w: 68, h: 68, kind: "mark", exit: "recede" });
      kit.disc(tk.inner, 34, 34, 34, { fill: "pos" });
      kit.icon(tk.inner, "check", { x: 34, y: 34, size: 40, color: S.pickTokenOn("pos") });
      m.pop(tk, ctx.cue("three times") - 0.45 + i * 0.28);
      Loom.sfx("tick", ctx.cue("three times") - 0.3 + i * 0.28);
    });

    // her thought cloud: a scalloped cloud with trailing puffs toward her head (900, 388)
    // @form thought_bubble: a scalloped thought cloud with trailing puffs that holds a few items
    const bub = ctx.el("bubble", { x: 60, y: 160, w: 760, h: 520, kind: "bubble", exit: "iris" });
    [[90, 70, 70], [220, 40, 78], [360, 34, 80], [490, 48, 74], [580, 110, 62], [80, 400, 64], [220, 440, 70], [370, 444, 70], [510, 410, 64], [40, 230, 60], [600, 300, 56]]
      .forEach(([cx, cy, r]) => kit.disc(bub.inner, cx, cy, r, { fill: "ink", flat: true, shadow: false }));
    kit.rect(bub.inner, 30, 40, 580, 400, { fill: "ink", r: 90, shadow: false });
    [[676, 312, 18], [720, 282, 11]].forEach(([cx, cy, r]) => kit.disc(bub.inner, cx, cy, r, { fill: "ink", flat: true, shadow: false }));
    m.iris(bub, ctx.cue("tests herself") - 0.2);
    const ideas = [["lightbulb", "Idea one"], ["target", "Idea two"], ["message-circle", "Idea three"]].map(([icon, label], i) => {
      // @form icon_label_card: an icon beside a short label on a filled row
      const E = ctx.el("idea_" + (i + 1), { x: 120, y: 206 + i * 112, w: 480, h: 92, kind: "row", exit: "recede" });
      const fill = ["accent", "accent2", "accent3"][i];
      kit.rect(E.inner, 0, 0, 480, 92, { fill, r: 22 });
      kit.icon(E.inner, icon, { x: 56, y: 46, size: 48, color: S.pickTokenOn(fill) });
      kit.text(E.inner, label, { role: "lead", x: 100, y: 0, w: 360, h: 92, valign: "middle", weight: 800, color: S.pickTokenOn(fill) });
      m.spring(E, ctx.cue("tests herself") + 0.1 + i * 0.12, { preset: "gentle", dy: 24 });
      return E;
    });
    const tHas = ctx.cue("still has it");
    ideas.forEach((E, i) => m.glow(E, tHas + i * 0.1));
    maya.pose("cheer", tHas - 0.1, { dur: 0.45 }); maya.look(-0.8, -0.5, tHas);
  },
});
