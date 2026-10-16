// @design instrument_on_the_gate: a meter mounted beside the gate fills to a measured reduction; a lens shows the gap that remains
/* b07 - the number on the furniture: Microsoft researchers' 99.22 percent, and why it is not a guarantee.
 *
 * Treatments considered:
 *  (A) a big number card. Rejected: the reference films never put a number in a card; it would leave the bench.
 *  (B) a pie at 99.22. Rejected: the sliver is invisible at any honest size and a pie says "share", not "reduction".
 *  (C) CHOSEN: a slim meter mounted beside the door (instrument law: the track first with the fill at zero, the fill
 *      rises at instrument speed, the stop is marked, the numeral is named last). On "not a guarantee" a lens opens
 *      on the top of the meter, where the unfilled 0.78 of the track is too small to read at its real size.
 *
 * Beat sheet:
 *  "Microsoft researchers"        the track settles beside the door, fill at zero; the owner caption reveals
 *  "a little over 99 percent"     the fill rises to 99.22 of the track; a tick marks the stop; '99.22%' is named
 *  "Their own data"               an accent2 underline draws under the caption
 *  "not a guarantee"              the lens opens on the unfilled sliver; the tag wipes in beside it
 * Grounding F5: Microsoft researchers, their business accounts, risk of compromise cut by 99.22 percent.
 */
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const B = ctx.beat.id;
    for (const n of ["laptop", "screen", "phone", "line", "door", "door_plate", "run_slot", "tally", "lock_know", "lock_have"]) ctx.held(n);

    const tMs = ctx.cue("Microsoft researchers");
    const tNum = ctx.cue("a little over 99 percent");
    const tOwn = ctx.cue("Their own data");
    const tGap = ctx.cue("not a guarantee");

    // ---------------------------------------------------------------- the meter beside the door (x 1792 y 380 w 40 h 460)
    const MX = 1792, MY = 380, MW = 40, MH = 460, READ = 0.9922;
    const meter = ctx.el("meter", { x: MX, y: MY, w: MW, h: MH, kind: "data", exit: "recede" });
    // @form meter_track: a slim vertical instrument track whose fill rises from its base to a measured reading
    kit.rect(meter.inner, 0, 0, MW, MH, { fill: "surface2", stroke: "line", sw: 2, r: 4, shadow: false, crisp: true });
    const fill = Loom.svg("rect", { x: 3, y: MH - 3, width: MW - 6, height: 0, fill: S.c("accent4") }, meter.inner);
    const tick = Loom.svg("line", { x1: -14, y1: MH * (1 - READ), x2: MW + 14, y2: MH * (1 - READ), stroke: S.c("ink"), "stroke-width": 3, opacity: 0 }, meter.inner);
    [0, 0.5, 1].forEach((f) => Loom.svg("line", { x1: -8, y1: MH * (1 - f), x2: 0, y2: MH * (1 - f), stroke: S.c("muted"), "stroke-width": 2 }, meter.inner));
    m.settle(meter, tMs, { dy: 12 });

    // the fill rises from zero at instrument speed and stops at the reading
    const tRise = tNum + 0.1, dRise = 2.2;
    Loom.drive((e) => {
      const hh = (MH - 6) * READ * e;
      fill.setAttribute("height", hh.toFixed(2));
      fill.setAttribute("y", (MH - 3 - hh).toFixed(2));
    }, tRise, dRise, "enter", { kind: "count", beat: B, name: "meter", content: true });
    Loom.tween(tick, { opacity: 0 }, { opacity: 1, duration: 0.15 }, tRise + dRise, { kind: "reveal", beat: B, name: "meter", content: true });
    Loom.sfx("tick", tRise + dRise);

    // ---------------------------------------------------------------- the reading, named last, and its owner
    const reading = ctx.el("reading", { x: 840, y: 430, w: 560, h: 150, kind: "data", exit: "recede" });
    const num = kit.text(reading.inner, "99.22%", { role: "display", x: 0, y: 0, w: 560, h: 150, align: "right", valign: "middle", maxLines: 1, color: "accent2", weight: 700 });
    void num;
    m.reveal(reading, tRise + dRise + 0.1, { dy: 10 });
    const cap = ctx.el("owner_caption", { x: 840, y: 590, w: 560, h: 80, kind: "label", exit: "recede" });
    const capT = kit.text(cap.inner, "Microsoft researchers, their own accounts", { role: "label", x: 0, y: 0, w: 560, h: 44, align: "right", valign: "middle", maxLines: 1, color: "muted" });
    m.reveal(cap, tMs + 0.3, { dy: 6 });
    const cw = capT.__fit ? capT.__fit.width : 520;
    // @form owner_underline: a thin accent line drawn under the name of who measured a number
    const ul = kit.line(cap.inner, 560 - cw, 52, 560, 52, { stroke: "accent2", sw: 3 });
    m.draw(ul, tOwn, { dur: 0.5 });

    // ---------------------------------------------------------------- not a guarantee: the lens on the unfilled sliver
    const gapY = MY + MH * (1 - READ) / 2 + 2;
    const mg = Loom.magnify(ctx, "sliver", { source: meter, focus: { x: MX + MW / 2, y: gapY, r: 16 }, at: { x: 1160, y: 240, r: 150 }, ring: "accent2", t: tGap });
    mg.exit(Math.min(tGap + 1.6, ctx.end - 1.2));   // the lens closes before the next run (b08 does not hold it)
    const tag = Loom.treat.label(ctx, "gap_tag", { x: 860, y: 240, text: "not a guarantee", tone: "surface", role: "label" });
    m.reveal(tag, tGap + 0.9, { dy: 6 });
  },
});
