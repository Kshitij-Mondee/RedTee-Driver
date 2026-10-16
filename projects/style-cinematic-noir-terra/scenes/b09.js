// @design two_stopping_points_in_open_hall: a pulled-back hall of opened doors becomes a calm choice frame, with two numbered marks locating the two moments that could stop the chain
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
    // Treatment A: text-only question. Treatment B: locked-door replay. Treatment C, chosen: the finished hall holds while two quiet marks locate the decision points.
    // @form hall_architecture: dark converging walls and floor lines
    const hall = ctx.el("hall_set", { x: 0, y: 0, w: 1920, h: 930, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 930, fill: c("field") }, hall.inner);
    svg("polygon", { points: "0,650 1920,650 1920,930 0,930", fill: c("surface2") }, hall.inner);
    svg("path", { d: "M0 650 L960 370 L1920 650", fill: "none", stroke: c("line"), "stroke-width": 3, opacity: 0.42 }, hall.inner);
    svg("path", { d: "M0 930 L960 370 L1920 930", fill: "none", stroke: c("line"), "stroke-width": 2, opacity: 0.26 }, hall.inner);
    // @form open_door_row: a receding row of cracked doors
    const doors = ctx.el("hall_doors", { x: 100, y: 162, w: 1430, h: 670, kind: "instrument", exit: "recede" });
    [[0, 248, 360, 0.05], [300, 206, 300, 0.18], [560, 170, 245, 0.32], [780, 140, 200, 0.46]].forEach(([x, y, w, shade]) => {
      Loom.lesson.door(ctx, doors.inner, { x, y, w, shade, state: "cracked" });
    });
    // @form heavy_final_door: the refused banded door at the hall end
    const heavy = ctx.el("heavy_door", { x: 1260, y: 190, w: 520, h: 620, kind: "instrument", exit: "recede" });
    Loom.lesson.door(ctx, heavy.inner, { x: 0, y: 0, w: 500, heavy: true, shade: 0.32, state: "refused" });
    m.drift(hall, ctx.start, ctx.end, { amp: 16, period: ctx.end - ctx.start });
    const tMany = ctx.cue("many doors");
    // @form first_stopping_point_tag: numbered mark leading to the first lock
    const first = ctx.el("mark_login", { x: 118, y: 250, w: 110, h: 110, kind: "badge", exit: "wipe" });
    kit.disc(first.inner, 48, 48, 43, { fill: "accent" });
    kit.text(first.inner, "1", { role: "lead", x: 29, y: 24, w: 38, h: 48, maxLines: 1, color: "onAccent", weight: 700, align: "center" });
    kit.path(first.inner, "M88 48 L190 48 L230 94", { stroke: "accent", sw: 3 });
    m.unmask(first, ctx.cue("which habit"));
    // @form second_stopping_point_tag: numbered mark leading to the next door
    const second = ctx.el("mark_wrong_person", { x: 610, y: 328, w: 110, h: 110, kind: "badge", exit: "wipe" });
    kit.disc(second.inner, 48, 48, 43, { fill: "accent4" });
    kit.text(second.inner, "2", { role: "lead", x: 29, y: 24, w: 38, h: 48, maxLines: 1, color: "onAccent", weight: 700, align: "center" });
    kit.path(second.inner, "M88 48 L154 48 L188 82", { stroke: "accent4", sw: 3 });
    m.unmask(second, ctx.cue("which door"));
    // @form choice_question: narration-led choice prompt on dark field
    const question = ctx.el("question", { x: 960, y: 88, w: 790, h: 165, kind: "text", exit: "wipe" });
    kit.text(question.inner, "So which habit shuts which door?", { role: "title", x: 0, y: 0, w: 790, h: 150, maxLines: 2, color: "ink", weight: 800 });
    m.settle(question, ctx.cue("which door"));
    // @form quiet_pause_bar: measured hold after the question
    const bar = ctx.el("pause_bar", { x: 1010, y: 280, w: 610, h: 18, kind: "value", exit: "collapse" });
    kit.rect(bar.inner, 0, 0, 610, 6, { fill: "line", r: 3 });
    const fill = kit.rect(bar.inner, 0, 0, 610, 6, { fill: "accent4", r: 3 });
    m.grow(fill, ctx.cue("which door") + 0.45, { axis: "x", dur: 1.75 });
  },
});
