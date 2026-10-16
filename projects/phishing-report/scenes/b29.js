// @design relative_bars_inside_caveat: two thin bars grow from one baseline under the held picture, the longer one marked as a relative difference and the caveat tagged on the bars
/* b29 - one aside: in phishing simulations the median click rate for text or voice was 40 percent higher than for
 * email. Simulations, and relative to email.
 * Treatments considered: (A) a big "40%" counter (rejected: it would read as the click rate itself, and the line
 * says simulations and relative); (B) a unit grid of people with 40 more lit (rejected: it implies counts of
 * people that the script does not give); (C) CHOSEN: small and quiet, two thin bars from one baseline as a RELATIVE
 * index (100 and 140, never drawn as numbers), the email bar carried over the second as a dashed guide so the
 * extra length is the 40 percent, the caveat as a tag on the bars. Muted and accent3 only: no red, no alarm.
 * The three channels from b28 stay as the dimmed ground (held as "channels", b30 holds them again).
 */
Loom.scene("b29", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, D = Loom.data, E_ = Loom.ease, beat = ctx.beat.id;
    const DUR = { dim: 0.8, base: 0.5, guide: 0.6, extra: 0.6, out: 0.4 };   // the durations this scene owns (seconds)
    const tagText = (props && props.tag) || "in simulations";
    const bars = (props && props.bars) || [{ label: "email", value: 100 }, { label: "text or voice", value: 140, note: "40% higher than email" }];

    const tSim = ctx.cue("In phishing simulations"), tRate = ctx.cue("the median click rate"), tHigher = ctx.cue("40 percent higher");
    const tThan = ctx.cue("higher than for email"), tRel = ctx.cue("relative to email");

    // ---- the held channels recede into the ground and breathe a little while the aside is made
    const ch = ctx.held("channels");
    if (ch) {
      Loom.tween(ch.life, { opacity: 1 }, { opacity: 0.32, duration: DUR.dim, ease: E_.editorial }, ctx.start + 0.05, { kind: "dim", beat, name: "channels" });
      const b0 = ctx.start + 0.3, b1 = ctx.end - 0.3;
      Loom.hold.breathe(ch, b0, b1, { amp: 0.006, period: (b1 - b0) / 2 });
    }

    // ---- geometry: small, under the phone and the chat
    const X = 640, Y = 720, LW = 250, VW = 90, SPAN = 440, W = LW + SPAN + VW + 20, ROWH = 44, GAP = 26, BH = 22;   // rows are 44 high (the label needs it); the bars are drawn thin inside them
    const maxV = Math.max(...bars.map((b) => b.value));
    const bx = X + LW, w0 = (SPAN * bars[0].value) / maxV, w1 = (SPAN * bars[1].value) / maxV;
    const y0 = Y + (ROWH - BH) / 2, y1 = Y + (ROWH + GAP) + (ROWH - BH) / 2;   // top of each thin bar

    // @form caveat_tag: a small solid tag that says what a number is about, set on the picture it qualifies
    const tg = D.tag(ctx, "sim_tag", { x: 0, y: 0, text: tagText, color: "muted", textColor: "onAccent", t: tSim });
    kit.place(tg, bx, Y - tg.h - 18);

    // the baseline draws first, then the bars grow from it
    const base = ctx.el("bars_baseline", { x: bx - 2, y: Y - 14, w: 4, h: 2 * ROWH + GAP + 28, kind: "connector", exit: "recede" });
    kit.line(base.inner, 2, 0, 2, 2 * ROWH + GAP + 28, { stroke: "muted", sw: 3 });
    m.draw(base, tRate - 0.1, { dur: DUR.base });

    D.barsOn(ctx, "sim_bars", { x: X, y: Y, w: W, labelW: LW, valueW: VW, barH: ROWH, gap: GAP, max: maxV, t: tRate + 0.2,
      bars: [{ label: bars[0].label, value: bars[0].value, color: "muted" }, { label: bars[1].label, value: bars[1].value, color: "accent3" }] });
    // the values are an index, not a rate: barsOn prints a number at each bar end, and no number may be read as a click rate, so those are hidden
    Loom.ctxScene.els.filter((e) => /^sim_bars\.val\d+$/.test(e.name)).forEach((e) => e.outer.setAttribute("display", "none"));
    // thin bars: barsOn draws them as tall as their row, so squash each to half its height, centred in the row
    Loom.ctxScene.els.filter((e) => /^sim_bars\.bar\d+$/.test(e.name)).forEach((e) => e.life.setAttribute("transform", `translate(0 ${(ROWH - BH) / 2}) scale(1 ${BH / ROWH})`));

    // the email bar's length carried over the second bar: what is beyond it is the difference
    const gx = bx + w0;
    const g1 = ctx.el("email_length_guide", { x: gx - 3, y: y0 - 10, w: 6, h: y1 + BH - y0 + 20, kind: "connector", exit: "recede" });
    kit.path(g1.inner, dashed(3, 0, 3, y1 + BH - y0 + 20, 8, 7), { stroke: "ink", sw: 3 });
    m.draw(g1, tHigher, { dur: DUR.guide });
    const extra = ctx.el("extra_length", { x: gx, y: y1, w: w1 - w0, h: BH, kind: "bar", exit: "recede" });
    kit.rect(extra.inner, 0, 0, w1 - w0, BH, { fill: "ink", r: 6, flat: true, opacity: 0.3 });
    m.unmask(extra, tHigher + 0.15, { dur: DUR.extra });

    // the note lands on the second bar
    const note = ctx.el("note_40", { x: bx + w1 + 18, y: y1 + BH / 2 - 34, w: 300, h: 68, kind: "text", exit: "recede" });
    kit.text(note.inner, bars[1].note || "40% higher than email", { role: "label", x: 0, y: 0, w: 300, h: 68, maxLines: 2, valign: "middle", color: "ink" });
    m.settle(note, tThan - 0.2, { dy: 14 });

    // the caveat brightens once while the line repeats it
    m.glow(tg, tRel, { color: "accent3", pad: 8, sw: 5 });

    // ---- leave together: this scene's own layer fades as one; the channels stay for b30
    const tOut = ctx.speechEnd + 0.1;
    Loom.ctxScene.els.forEach((e) => { if (e.scene === Loom.ctxScene && e !== ch) e.exit = "none"; });
    Loom.tween(ctx.g, { opacity: 1 }, { opacity: 0, duration: DUR.out, ease: E_.exit }, tOut, { kind: "exit", beat, name: "b29 layer" });

    // dashed strokes are built from short segments so m.draw can still reveal them along their length
    function dashed(x1, y1, x2, y2, on, off) {
      const L = Math.hypot(x2 - x1, y2 - y1), n = Math.floor(L / (on + off));
      let d = "";
      for (let i = 0; i <= n; i++) {
        const a = (i * (on + off)) / L, b = Math.min(1, (i * (on + off) + on) / L);
        d += `M${(x1 + (x2 - x1) * a).toFixed(1)} ${(y1 + (y2 - y1) * a).toFixed(1)}L${(x1 + (x2 - x1) * b).toFixed(1)} ${(y1 + (y2 - y1) * b).toFixed(1)}`;
      }
      return d;
    }
  },
});
