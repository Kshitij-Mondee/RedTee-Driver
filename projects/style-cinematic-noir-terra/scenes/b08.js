// @design spreading_light_through_receding_doors: a dark hall reveals the reach of one access as doors crack open in a line, ending at a resistant heavy door
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
    // Treatment A: a static row of doors with labels. Treatment B: a tracked keycard. Treatment C, chosen: light spreads from door to door and makes lateral reach visible.
    const hall = ctx.el("hall_set", { x: 0, y: 0, w: 1920, h: 930, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 930, fill: c("field") }, hall.inner);
    svg("polygon", { points: "0,650 1920,650 1920,930 0,930", fill: c("surface2") }, hall.inner);
    svg("path", { d: "M0 650 L960 370 L1920 650", fill: "none", stroke: c("line"), "stroke-width": 3, opacity: 0.42 }, hall.inner);
    svg("path", { d: "M0 930 L960 370 L1920 930", fill: "none", stroke: c("line"), "stroke-width": 2, opacity: 0.26 }, hall.inner);
    svg("path", { d: "M120 930 L960 370 L1800 930", fill: "none", stroke: c("line"), "stroke-width": 2, opacity: 0.22 }, hall.inner);
    const doors = ctx.el("hall_doors", { x: 120, y: 160, w: 1430, h: 670, kind: "instrument", exit: "recede" });
    const specs = [
      [0, 248, 360, 0.05], [300, 206, 300, 0.18], [560, 170, 245, 0.32], [780, 140, 200, 0.46]
    ];
    const handles = specs.map(([x, y, w, shade], i) => Loom.lesson.door(ctx, doors.inner, { x, y, w, shade, state: i === 0 ? "cracked" : "shut" }));
    handles.slice(1).forEach((h, i) => h.setState("turning", ctx.cue("other systems") + i * 0.42));
    handles.slice(1).forEach((h, i) => h.setState("cracked", ctx.cue("other systems") + 0.22 + i * 0.42));
    const heavy = ctx.el("heavy_door", { x: 1260, y: 190, w: 520, h: 620, kind: "instrument", exit: "recede" });
    const heavyHandle = Loom.lesson.door(ctx, heavy.inner, { x: 0, y: 0, w: 500, heavy: true, shade: 0.32, state: "shut" });
    const hunt = ctx.cue("hunt for more access");
    heavyHandle.setState("turning", hunt);
    heavyHandle.setState("refused", hunt + 0.58);
    m.travel(heavy, hunt, { x: 1232, y: 180, scale: 1.06 });
    const term = ctx.el("term", { x: 170, y: 90, w: 870, h: 130, kind: "text", exit: "wipe" });
    const termText = kit.text(term.inner, "lateral movement", { role: "title", x: 0, y: 0, w: 870, h: 108, maxLines: 1, color: "ink", weight: 800 });
    kit.rect(term.inner, 0, 116, termText.__fit.width, 6, { fill: "accent", r: 3 });
    m.unmask(term, ctx.cue("lateral movement"));
    const spread = ctx.el("spread_light", { x: 175, y: 850, w: 1050, h: 60, kind: "connector", exit: "recede" });
    const line = kit.path(spread.inner, "M0 22 L960 22", { stroke: "accent", sw: 4, opacity: 0.7 });
    m.draw(line, ctx.cue("other systems"), { dur: 1.45, headAt: 0.92, headDur: 0.2 });
  },
});
