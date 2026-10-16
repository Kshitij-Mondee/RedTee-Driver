// @design even_choice_column: one call scene on the left, three equal peer options in one column on the right
/* Treatments: (A) template 2-col grid (rejected: imbalance), (B) static column with signalling, (C) CHOSEN: tile left, cards slide in on their letters, ring counts down. */
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // @form kicker: Now you
    const k = ctx.el("kicker", { x: 120, y: 110, w: 740, h: 50, kind: "text", exit: "wipe" });
    kit.kicker(k.inner, "Now you", { x: 0, y: 0, w: 740, h: 50, color: "muted" });
    m.reveal(k, ctx.cue("Now you"), { dy: 14 });

    // @form call_tile: video call with empty agenda slot
    const tt = ctx.cue("Dev starts a call without the agenda");
    const T = ctx.el("call_tile", { x: 120, y: 180, w: 740, h: 440, kind: "card", exit: "displace" });
    kit.rect(T.inner, 0, 0, 740, 440, { fill: "surface2", r: 28, stroke: "ink" });
    kit.rect(T.inner, 24, 24, 400, 392, { fill: "field2", r: 18 });
    kit.peep(T.inner, "man", "explaining", { x: 224, y: 250, size: 320, cloth: "muted", skin: 1 });
    // empty agenda slot
    const slot = kit.rect(T.inner, 456, 24, 260, 392, { fill: "none", r: 18, stroke: "muted", sw: 4, dash: "14 10" });
    kit.text(T.inner, "Agenda", { role: "label", x: 466, y: 44, w: 240, h: 56, align: "center", valign: "middle", maxLines: 1, color: "muted", weight: 800 });
    m.pop(T, tt, { overshoot: false });
    m.draw(slot, tt + 0.3);

    // @form question: the accent line
    const q = ctx.el("question", { x: 120, y: 660, w: 740, h: 230, kind: "text", exit: "wipe" });
    kit.text(q.inner, "Dev starts a call without the agenda. Which comment would you give?", { role: "lead", x: 0, y: 0, w: 740, h: 230, maxLines: 4, color: "accent", weight: 800 });
    m.unmask(q, tt + 0.5, { dir: "ltr" });

    // @form option_card: three equal peers
    const opts = [
      ["card_a", "A", "Be more organised", ctx.cue("organised")],
      ["card_b", "B", "Send it the day before", ctx.cue("you skipped the agenda")],
      ["card_c", "C", "Be more prepared", ctx.cue("be more prepared")],
    ];
    opts.forEach(([name, L, txt, t0], i) => {
      const y = 242 + i * 190;
      const E = ctx.el(name, { x: 980, y, w: 820, h: 150, kind: "card", exit: "displace" });
      kit.rect(E.inner, 0, 0, 820, 150, { fill: "surface", r: 24, stroke: "ink" });
      kit.disc(E.inner, 75, 75, 44, { fill: "accent3" });
      kit.text(E.inner, L, { role: "label", x: 31, y: 31, w: 88, h: 88, align: "center", valign: "middle", maxLines: 1, weight: 800, color: S.pickTokenOn("accent3") });
      kit.text(E.inner, txt, { role: "body", x: 150, y: 20, w: 640, h: 110, valign: "middle", maxLines: 2, weight: 700, color: "ink" });
      Loom.tween(E.inner, { x: 140, opacity: 0 }, { x: 0, opacity: 1, duration: ctx.style.dur("enter"), ease: Loom.ease.enter }, t0, { kind: "travel", beat: ctx.beat.id, content: true });
    });

    // @form pause_ring: countdown
    const R = ctx.el("pause_ring", { x: 1160, y: 800, w: 460, h: 100, kind: "instrument", exit: "iris" });
    const ring = kit.path(R.inner, "M 50 8 A 42 42 0 1 1 49.9 8", { fill: "none", stroke: "accent", sw: 8 });
    kit.text(R.inner, "Pause and decide", { role: "label", x: 110, y: 0, w: 350, h: 100, valign: "middle", maxLines: 1, weight: 800, color: "ink" });
    const tr = ctx.cue("be more prepared");
    m.pop(R, tr + 0.6, { overshoot: false });
    const dur = Math.max(2, (ctx.beat.pause_after || 3));
    const len = 264;
    ring.setAttribute("stroke-dasharray", len + " " + len);
    Loom.drive((e, raw) => { ring.setAttribute("stroke-dashoffset", String(len * raw)); }, tr + 1.2, dur, "linear");
  },
});
