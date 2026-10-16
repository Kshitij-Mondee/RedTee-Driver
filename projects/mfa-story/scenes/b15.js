// @design three_bars_one_order: three plain bars rising one per phrase, the strongest drawn full and named in words
/* b15 - Google saw the same order on its own accounts. Against targeted attacks, a texted code blocked 76 percent. A
 * phone prompt, 90. Security keys alone: no one fell.
 * Treatments considered: (A) a table (rejected: three numbers want lengths); (B) a ladder (rejected: one more metaphor);
 * (C) CHOSEN: three vertical bars on a light field, rising one per phrase, the third drawn full with the words no one
 * fell instead of a number; who measured it under the title. Grounding F6, F7, F8.
 * HELD by b16: google_bg, google_title, bars_g.
 */
Loom.scene("b15", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, svg = Loom.svg;
    const tSaw = ctx.cue("Google saw the same order");
    const t76 = ctx.cue("76 percent");
    const t90 = ctx.cue("A phone prompt, 90");
    const tKeys = ctx.cue("no one fell");
    const bg = ctx.el("google_bg", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: S.c("field") }, bg.inner);
    const tt = ctx.el("google_title", { x: 140, y: 70, w: 1640, h: 150, kind: "title", exit: "recede" });
    kit.text(tt.inner, "Targeted attacks blocked", { role: "title", size: 72, x: 0, y: 0, w: 1640, h: 96, maxLines: 1, weight: 700, color: "ink" });
    kit.text(tt.inner, "Google study with NYU and UC San Diego, on Google's own accounts", { role: "label", size: 28, x: 0, y: 100, w: 1640, h: 44, maxLines: 1, color: "muted" });
    m.reveal(tt, tSaw + 0.05, { dy: 10 });
    // @form value_bars: plain vertical bars on one baseline, each named under it and valued over it
    const BASE = 760, TOP = 330, BW = 260;
    const bars = ctx.el("bars_g", { x: 0, y: 0, w: 1920, h: 1080, kind: "data", exit: "recede" });
    kit.line(bars.inner, 320, BASE, 1600, BASE, { stroke: "line", sw: 3 });
    const spec = [["texted code", 0.76, "76%", t76, "accent"], ["phone prompt", 0.90, "90%", t90, "accent"], ["security keys only", 1.0, "no one fell", tKeys, "pos"]];
    spec.forEach(([name, v, label, t, tone], i) => {
      const x = 400 + i * 430, h = (BASE - TOP) * v;
      const r = svg("rect", { x, y: BASE, width: BW, height: 0, rx: 10, fill: S.c(tone) }, bars.inner);
      Loom.drive((e) => { r.setAttribute("y", (BASE - h * e).toFixed(1)); r.setAttribute("height", (h * e).toFixed(1)); }, t - 0.1, 1.0, "move",
        { kind: "count", beat: ctx.beat.id, name: "bars_g." + i, content: true });
      const lab = ctx.el("bar_name_" + i, { x: x - 60, y: BASE + 12, w: BW + 120, h: 50, kind: "label", exit: "recede" });
      kit.text(lab.inner, name, { role: "label", size: 30, x: 0, y: 0, w: BW + 120, h: 50, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
      m.reveal(lab, t - 0.1, { dy: 6 });
      const val = ctx.el("bar_val_" + i, { x: x - 60, y: BASE - h - 78, w: BW + 120, h: 66, kind: "data", exit: "recede" });
      kit.text(val.inner, label, { role: "lead", size: i === 2 ? 38 : 42, x: 0, y: 0, w: BW + 120, h: 66, align: "center", valign: "middle", maxLines: 1, weight: 700, color: tone === "pos" ? "pos" : "ink" });
      m.reveal(val, t + 0.85, { dy: 8 });
      Loom.sfx("tick", t + 0.9);
    });
  },
});
