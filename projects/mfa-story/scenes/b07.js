// @design stopped_screen_and_bar: the stopped attempt kept small at one side, the measured risk drawn as two bars beside it
/* b07 - Microsoft researchers checked their own business accounts. MFA cut the risk by a little over 99 percent. Their
 * data, not a guarantee.
 * Treatments considered: (A) a big number card (rejected: the number without its picture); (B) a meter on a door (the
 * old lesson; rejected: the door is gone); (C) CHOSEN: the other desk's screen, small and still on Enter the code,
 * left; right, two plain bars, risk without MFA full, risk with MFA shrinking to a sliver of 0.78 of 100; 99.22% named
 * last, with who measured it; on "not a guarantee" a ring round the sliver that is still there.
 * Grounding F5.
 */
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = Loom.mfa, S = Loom.style, svg = Loom.svg;
    const tMs = ctx.cue("Microsoft researchers");
    const tCut = ctx.cue("MFA cut the risk");
    const tNum = ctx.cue("a little over 99 percent");
    const tNot = ctx.cue("not a guarantee");
    const bg = ctx.el("risk_bg", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: S.c("field") }, bg.inner);
    svg("rect", { x: 0, y: 0, width: 640, height: 1080, fill: S.mix(S.c("field"), S.c("line"), 0.2) }, bg.inner);
    // the stopped screen, small (the whole page scaled, so its words keep their proportions)
    M.monitor(ctx, "mon_small", { x: 80, y: 330, w: 480, h: 300 });
    // @form stopped_screen: the other desk's screen, small, reduced to the one thing it says
    const sm = ctx.el("screen_small", { x: 80, y: 330, w: 480, h: 300, kind: "ui", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 480, height: 300, rx: 8, fill: S.c("surface") }, sm.inner);
    kit.text(sm.inner, "Enter the code", { role: "lead", size: 40, x: 30, y: 40, w: 420, h: 60, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    for (let i = 0; i < 6; i++) svg("rect", { x: 45 + i * 66 + (i >= 3 ? 8 : 0), y: 140, width: 56, height: 66, rx: 8, fill: S.c("field"), stroke: S.c("neg"), "stroke-width": 2 }, sm.inner);
    const car = svg("rect", { x: 62, y: 150, width: 4, height: 46, fill: S.c("accent") }, sm.inner);
    for (let t = ctx.start; t < ctx.end; t += 1) { Loom.set(car, { opacity: 1 }, t); Loom.set(car, { opacity: 0 }, Math.min(t + 0.5, ctx.end)); }
    // the bars
    const BX = 760, BW = 1000, BH = 96;
    const bars = ctx.el("risk_bars", { x: BX, y: 300, w: BW, h: 420, kind: "data", exit: "recede" });
    kit.text(bars.inner, "Without MFA", { role: "label", size: 28, x: 0, y: 0, w: 400, h: 40, maxLines: 1, color: "muted" });
    svg("rect", { x: 0, y: 46, width: BW, height: BH, rx: 10, fill: S.c("neg"), opacity: 0.85 }, bars.inner);
    kit.text(bars.inner, "With MFA", { role: "label", size: 28, x: 0, y: 200, w: 400, h: 40, maxLines: 1, color: "muted" });
    svg("rect", { x: 0, y: 246, width: BW, height: BH, rx: 10, fill: "none", stroke: S.mix(S.c("surface2"), S.c("line"), 0.4), "stroke-width": 2, "stroke-dasharray": "8 8" }, bars.inner);
    const withBar = svg("rect", { x: 0, y: 246, width: BW, height: BH, rx: 10, fill: S.c("neg"), opacity: 0.85 }, bars.inner);
    m.reveal(bars, tMs - 0.1, { dy: 12 });
    const head = ctx.el("risk_head", { x: BX, y: 180, w: BW, h: 60, kind: "title", exit: "recede" });
    kit.text(head.inner, "Risk of an account being taken over", { role: "lead", size: 40, x: 0, y: 0, w: BW, h: 60, maxLines: 1, weight: 700, color: "ink" });
    m.reveal(head, tMs - 0.2, { dy: 8 });
    const R = 0.0078;
    Loom.drive((e) => withBar.setAttribute("width", Math.max(8, BW * (1 - (1 - R) * e)).toFixed(2)), tNum - 0.3, 2.0, "move",
      { kind: "count", beat: ctx.beat.id, name: "risk_bars.with", content: true });
    void tCut;
    // the value, named last, and who measured it
    const val = ctx.el("risk_value", { x: BX, y: 680, w: 880, h: 110, kind: "data", exit: "recede" });
    kit.text(val.inner, "99.22% lower", { role: "title", size: 76, x: 0, y: 0, w: 880, h: 100, maxLines: 1, weight: 700, color: "pos" });
    m.reveal(val, tNum + 1.7, { dy: 10 });
    Loom.sfx("tick", tNum + 1.75);
    const own = ctx.el("risk_owner", { x: BX, y: 800, w: BW, h: 50, kind: "label", exit: "recede" });
    kit.text(own.inner, "Microsoft researchers, their own business accounts, 2023", { role: "label", size: 28, x: 0, y: 0, w: BW, h: 50, maxLines: 1, color: "muted" });
    m.reveal(own, tMs + 0.2, { dy: 6 });
    // not a guarantee: the sliver is still there
    M.ring(ctx, "sliver_ring", { x: BX - 4, y: 300 + 246, w: 30, h: BH }, tNot + 0.1, { tone: "accent2", pad: 10, r: 10 });
    Loom.data.tag(ctx, "tag_not", { x: BX + 70, y: 300 + 246 + 22, text: "not a guarantee", color: "accent2", t: tNot + 0.3 });
  },
});
