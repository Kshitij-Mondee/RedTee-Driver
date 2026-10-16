/* b10 - familiar is not recall. The notes page (kept from b08) gets covered; the thought bubble
 * reaches for the three lines and finds question marks.
 * Treatments: (A) two labels side by side (rejected: tells, does not show), (B) a gauge falling
 * (rejected: we just used a gauge in b09), (C) CHOSEN: perform the test on screen - cover, try, fail.
 */
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const page = ctx.held ? null : null; // the page is kept by the storyboard (keep: ["page", ...]); we draw over it

    // 1. the verdict on the page: "Familiar" (true, and beside the point)
    const fam = ctx.el("familiar_tag", { x: 590, y: 46, w: 330, h: 84, kind: "stamp", exit: "recede" });
    kit.pill(fam.inner, 0, 0, 330, 84, { fill: "pos" });
    kit.icon(fam.inner, "eye", { x: 52, y: 42, size: 40, color: S.pickTokenOn("pos") });
    kit.text(fam.inner, "Familiar", { role: "lead", x: 86, y: 0, w: 220, h: 84, maxLines: 1, valign: "middle", weight: 800, color: S.pickTokenOn("pos") });
    m.stamp(fam, ctx.cue("familiar is not the same"));

    // 2. the bubble opens on the right: trying to recall
    const bub = ctx.el("recall_bubble", { x: 1080, y: 180, w: 700, h: 560, kind: "bubble", exit: "iris" });
    kit.rect(bub.inner, 0, 0, 700, 520, { fill: "ink", r: 60, shadow: false });
    kit.polygon(bub.inner, [[120, 510], [40, 600], [220, 510]], { fill: "ink" });
    kit.kicker(bub.inner, "from memory", { x: 60, y: 44, w: 580, h: 36, color: "surface" });
    m.iris(bub, ctx.cue("recall it") - 0.2);

    // three empty slots where the three lines should come back
    const slots = [0, 1, 2].map((i) => {
      const E = ctx.el("slot_" + (i + 1), { x: 1140, y: 290 + i * 130, w: 580, h: 100, kind: "row", exit: "recede" });
      kit.rect(E.inner, 0, 0, 580, 100, { fill: "surface2", r: 20, shadow: false });
      m.reveal(E, ctx.cue("recall it") + 0.25 + i * 0.08, { dy: 10 });
      return E;
    });

    // 3. close the notes: a cover slides across the page (the page is at x 200..960, y 150..930)
    const cover = ctx.el("cover", { x: 180, y: 130, w: 800, h: 820, kind: "cover", exit: "displace" });
    kit.rect(cover.inner, 0, 0, 800, 820, { fill: "surface", r: 22 });
    kit.icon(cover.inner, "book-x", { x: 400, y: 380, size: 150, color: "muted" });
    kit.text(cover.inner, "Notes closed", { role: "lead", x: 0, y: 490, w: 800, h: 60, maxLines: 1, align: "center", color: "muted", weight: 800 });
    const tClose = ctx.cue("Close the notes");
    Loom.tween(cover.inner, { x: -1100, opacity: 1 }, { x: 0, opacity: 1, duration: 0.55, ease: Loom.ease.move }, tClose, { kind: "travel", beat: ctx.beat.id, content: true });

    // 4. it is gone: each slot shows a question mark (peers), then the verdict
    const tGone = ctx.cue("it is gone");
    slots.forEach((E, i) => {
      const q = ctx.el("question_" + (i + 1), { x: E.x + 240, y: E.y, w: 100, h: 100, kind: "text", exit: "recede" });
      kit.text(q.inner, "?", { role: "title", x: 0, y: 0, w: 100, h: 100, maxLines: 1, align: "center", valign: "middle", color: "neg", size: 80 });
      m.pop(q, tGone - 0.25 + i * 0.08, { overshoot: false });
    });
    const rec = ctx.el("recall_tag", { x: 1200, y: 780, w: 460, h: 84, kind: "stamp", exit: "recede" });
    kit.pill(rec.inner, 0, 0, 460, 84, { fill: "neg" });
    kit.text(rec.inner, "Recall: nothing", { role: "lead", x: 0, y: 0, w: 460, h: 84, maxLines: 1, align: "center", valign: "middle", weight: 800, color: S.pickTokenOn("neg") });
    m.stamp(rec, tGone + 0.35);
    void page;
  },
});
