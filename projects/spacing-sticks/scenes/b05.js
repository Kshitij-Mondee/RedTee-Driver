// @design subset_lost_over_time: a set of peer items is shown, time passes on a dial, then a subset fades blank and the survivors are ticked
/* b05 - Ebbinghaus's method as a process: learn the cards, let time pass, test, lose some.
 * Treatments considered: (A) a portrait + text card (rejected: static, and we must not draw a real
 * person's likeness), (B) a timeline of his study (rejected: no dates beyond 1885 in the sheet),
 * (C) CHOSEN: the method itself animated - cards learned, a clock turns, half the cards go blank.
 * Motion is content: the loss over time IS what he measured.
 */
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // ---- left: who and when (frame first, so the viewer knows what they are looking at)
    // @form big_number_stamp: a large display number stamped as the anchor of a point
    const year = ctx.el("year_stamp", { x: 150, y: 250, w: 620, h: 180, kind: "value", exit: "recede" });
    kit.text(year.inner, "1885", { role: "display", x: 0, y: 0, w: 620, h: 180, maxLines: 1, color: "accent2" });
    m.stamp(year, ctx.cue("1885"));

    const name = ctx.el("name_tag", { x: 150, y: 450, w: 640, h: 130, kind: "text", exit: "wipe" });
    kit.text(name.inner, "Hermann Ebbinghaus", { role: "title", x: 0, y: 0, w: 640, h: 130, maxLines: 2, size: 64 });
    m.unmask(name, ctx.cue("Hermann Ebbinghaus") + 0.1);

    const how = ctx.el("method_tag", { x: 150, y: 620, w: 640, h: 60, kind: "text", exit: "sink" });
    kit.text(how.inner, "measured his own memory", { role: "lead", x: 0, y: 0, w: 640, h: 60, maxLines: 1, color: "muted" });
    m.settle(how, ctx.cue("measured this on himself"));

    // ---- right: the notebook (structure before content)
    const NX = 880, NY = 150, NW = 880, NH = 730;
    // @form ring_bound_page: a page card with binding rings and a kicker heading
    const book = ctx.el("notebook", { x: NX, y: NY, w: NW, h: NH, kind: "document", exit: "displace" });
    kit.rect(book.inner, 0, 0, NW, NH, { fill: "surface", r: 28 });
    for (let i = 0; i < 7; i++) kit.disc(book.inner, 0, 90 + i * 90, 13, { fill: "field", flat: true, shadow: false }); // binding rings
    kit.kicker(book.inner, "nonsense syllables", { x: 70, y: 44, w: 520, h: 40 });
    m.settle(book, ctx.cue("measured this on himself") + 0.2, { dy: 40 });

    // the clock that will show time passing
    // @form clock_dial: a dial whose hand sweeps a full turn to show time passing
    const clock = ctx.el("clock", { x: NX + NW - 170, y: NY + 20, w: 120, h: 120, kind: "instrument", exit: "iris" });
    kit.disc(clock.inner, 60, 60, 54, { fill: "field", shadow: false });
    kit.disc(clock.inner, 60, 60, 44, { fill: "ink", flat: true, shadow: false });
    const hand = Loom.svg("line", { x1: 60, y1: 60, x2: 60, y2: 26, stroke: S.c("accent"), "stroke-width": 7, "stroke-linecap": "round" }, clock.inner);
    Loom.svg("circle", { cx: 60, cy: 60, r: 6, fill: S.c("field") }, clock.inner);
    m.pop(clock, ctx.cue("nonsense syllables") + 0.2, { overshoot: false });

    // ---- the syllable cards (peers: one tight stagger, no rank)
    const syl = ["DAX", "BOK", "ZEF", "WUG", "KIP", "LOM", "FEP", "RIZ"];
    const lost = new Set([1, 3, 4, 6]);
    const cols = 4, cw = 170, ch = 150, gx = 32, gy = 40;
    const x0 = NX + (NW - (cols * cw + (cols - 1) * gx)) / 2, y0 = NY + 170;
    const tCards = ctx.cue("nonsense syllables");
    // @form fade_out_card_grid: a peer grid of cards where a subset fades blank to show loss
    const cards = syl.map((s, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const E = ctx.el("card_" + (i + 1), { x: x0 + c * (cw + gx), y: y0 + r * (ch + gy), w: cw, h: ch, kind: "card", exit: "recede" });
      const face = Loom.svg("g", {}, E.inner);
      kit.rect(face, 0, 0, cw, ch, { fill: "accent4", r: 18 });
      const t = kit.text(face, s, { role: "title", x: 0, y: 0, w: cw, h: ch, maxLines: 1, align: "center", valign: "middle", size: 60, color: S.pickTokenOn("accent4") });
      m.pop(E, tCards + i * 0.07, { overshoot: false });
      return { E, face, t };
    });

    // ---- time passes: the clock hand sweeps one full turn (value travel at instrument speed)
    const tTest = ctx.cue("then tested");
    Loom.drive((e) => hand.setAttribute("transform", `rotate(${(e * 360).toFixed(2)} 60 60)`), tTest, 1.3, "editorial", { kind: "value_travel", beat: ctx.beat.id, content: true });

    // ---- the test: half the cards go blank (lost), the kept ones are ticked (the reading, marked on arrival)
    const tKept = ctx.cue("what he kept");
    let k = 0;
    cards.forEach((c, i) => {
      if (lost.has(i)) {
        Loom.tween(c.face, { opacity: 1 }, { opacity: 0.16, duration: 0.5, ease: Loom.ease.exit }, tKept + 0.1 + k * 0.12, { kind: "fade_out", beat: ctx.beat.id, content: true });
        k++;
      } else {
        // @form outcome_tick: a tick or cross mark landing on an item to show its result
        const mk = ctx.el("kept_" + (i + 1), { x: c.E.x + cw - 38, y: c.E.y - 22, w: 56, h: 56, kind: "mark", exit: "recede" });
        kit.mark(mk.inner, "yes", 28, 28, 52);
        m.pop(mk, ctx.cue("over time") + 0.05 * i, { overshoot: false });
      }
    });
  },
});
