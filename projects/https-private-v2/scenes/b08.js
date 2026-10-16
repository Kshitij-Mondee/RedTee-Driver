// @design two_empty_slots: the same empty slot opens at both ends while an open eye sits between them
/* Treatments considered: (1) static composition, both slots and the eye drawn at once with a caption (signalled by
 * nothing, inert); (2) a key flies in from one end (wrong: the key is never drawn before it is agreed, and never on
 * the path); (3) chosen: tile 2 named, then the empty dashed slots open left to right at the two ends, then the label
 * and the eye pulses once on the path (the problem is set in narration order).
 * Cues: Move two -> step tiles; Both ends need -> slots open; same secret -> label; network watching -> eye. */
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t); 
    const svg = (...a) => Loom.svg(...a);

    // the held system: nothing redrawn
    ctx.held("browser");
    ctx.held("server");
    ctx.held("path");
    const WH = ctx.held("watcher");
    const SBH = ctx.held("step_bar");

    const tMove = ctx.cue("Move two");
    const tBoth = ctx.cue("Both ends need");
    const tSecret = ctx.cue("same secret");
    const tWatch = ctx.cue("network watching");

    // step bar: new children on the held bar, tile 1 done, tile 2 named (recolour)
    // @form step_bar: tile 1 shows done, tile 2 takes the name
    // an opaque tile-1 backing first, so the earlier blue tile does not show through the done tile
    const cover = svg("rect", { x: -2, y: -2, width: 388, height: 94, rx: 21, fill: c("surface"), opacity: 0 }, SBH.inner);
    Loom.drive((e) => cover.setAttribute("opacity", Math.max(0, Math.min(1, e)).toFixed(3)), tMove, 0.5, "enter");
    const sb = Loom.lesson.step_bar(ctx, SBH.inner, { origin: [360, 780] });
    sb.setState("done", tMove, 0);
    sb.setState("named", tMove, 1);

    // the two empty key slots, one at the browser and one at the server, opening left to right
    const KS = ctx.el("key_slots", { x: 440, y: 380, w: 1170, h: 330, kind: "icon", exit: "recede" });
    // @form key_slots: empty dashed key-shaped slot at each end
    const kx = Loom.lesson.key_exchange(ctx, KS.inner, { origin: [440, 380] });
    kx.setState("slots_empty", ctx.start);
    // @form slot_marks: accent corner frame round each empty slot, the one named thing
    [[468, 647], [1458, 647]].forEach(([sx, sy]) => {
      svg("rect", { x: sx - 12 - 440, y: sy - 10 - 380, width: 148, height: 62, rx: 14, fill: "none", stroke: c("accent"), "stroke-width": 4 }, KS.inner);
    });
    m.unmask(KS, tBoth, { dir: "ltr", dur: 2.0 });

    // the label, after its shape: Shared key, with a quiet dashed link below the path (not on it)
    const LF = kit.fit("Shared key", { role: "label", w: 2000, h: 40, maxLines: 1, size: 28, weight: 700 });
    const LW = Math.round(LF.width + 56);
    const LX0 = 610, LW2 = 840, LY = 640;
    const LB = ctx.el("shared_key", { x: LX0, y: LY, w: LW2, h: 60, kind: "text", exit: "recede" });
    // @form shared_key_label: a pill naming the slot both ends must fill, with dashed links to each slot
    const mid = LW2 / 2;
    [[8, mid - LW / 2 - 12], [mid + LW / 2 + 12, LW2 - 8]].forEach(([a, b]) => {
      svg("line", { x1: a, y1: 30, x2: b, y2: 30, stroke: c("muted"), "stroke-width": 3, "stroke-dasharray": "8 8", "stroke-linecap": "round" }, LB.inner);
    });
    kit.pill(LB.inner, mid - LW / 2, 4, LW, 52, { fill: "surface", stroke: "line", sw: 2 });
    kit.text(LB.inner, "Shared key", { role: "label", size: 28, x: mid - LW / 2, y: 4, w: LW, h: 52, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    m.reveal(LB, tSecret);

    // the watcher's eye opens once, on node 2 (new children on the held watcher)
    // @form watcher: the ink eye disc on the path, one pulse
    const w = Loom.lesson.watcher(ctx, WH.inner, { origin: [800, 150] });
    w.setState("eye_open", tWatch - 0.2);
    w.pulse(tWatch);
  },
});
