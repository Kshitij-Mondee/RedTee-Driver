// @design three_parts_join: three slots slide together into one sentence while the faded old line stays grey beside it
/* Treatments: (A) static sentence with highlights (rejected: no build), (B) slots fade then sentence appears (rejected: cut),
 * (C) CHOSEN: slots slide together into one panel, one flood of accent; motion is the whole built from parts. */
Loom.scene("b32", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const B = ctx.beat.id;
    const tStart = ctx.cue("Put the three parts together");
    const tB = ctx.cue("Behaviour");
    const tE = ctx.cue("Effect");
    const tR = ctx.cue("Request");
    const tJ = ctx.cue("One sentence");

    // old line, grey and faded (fade_and_stay)
    const OW = 520, OH = 300;
    const old = ctx.el("old_line_faded", { x: 96, y: 330, w: OW, h: OH, kind: "card", exit: "recede" });
    // @form old_line_ghost: grey bars standing for the vague remark
    const og = Loom.svg("g", { opacity: 0.45 }, old.inner);
    kit.rect(og, 0, 0, OW, OH, { fill: "surface2", r: 24 });
    kit.rect(og, 40, 90, 440, 22, { fill: "muted", r: 11 });
    kit.rect(og, 40, 140, 360, 22, { fill: "muted", r: 11 });
    kit.rect(og, 40, 190, 400, 22, { fill: "muted", r: 11 });
    kit.kicker(old.inner, "old line", { x: 40, y: 28, w: 300, h: 40 });
    m.settle(old, tStart, { dy: 0 });

    // three slots on the right, stacked
    const SX = 800, SW = 1024, SH = 100, GAP = 16, SY = 330 + (OH - (3 * SH + 2 * GAP)) / 2;
    const names = [["slot_behaviour", "Behaviour", tB], ["slot_effect", "Effect", tE], ["slot_request", "Request", tR]];
    const slots = names.map(([n, label, tt], i) => {
      const E = ctx.el(n, { x: SX, y: SY + i * (SH + GAP), w: SW, h: SH, kind: "card", exit: "recede" });
      const g = Loom.svg("g", {}, E.inner);
      kit.rect(g, 0, 0, SW, SH, { fill: "surface", r: 22, stroke: "ink" });
      kit.text(g, label, { role: "label", x: 32, y: 10, w: SW - 64, h: SH - 20, maxLines: 1, valign: "middle" });
      m.settle(E, tStart + 0.25 + i * 0.15, { dx: 120, dy: 0 });
      m.emphasis && 0;
      Loom.tween(g, { opacity: 1 }, { opacity: 1, duration: 0.1 }, tt, { kind: "pulse", beat: B, content: true });
      return { E, g };
    });
    slots.forEach((s, i) => {
      const tt = names[i][2];
      Loom.tween(s.g, { scale: 1 }, { scale: 1, duration: 0.1 }, tt, { kind: "pulse", beat: B, content: true });
      m.highlight && 0;
    });

    // the joined sentence
    const JH = 360, JY = 330 + OH / 2 - JH / 2;
    const J = ctx.el("joined_sentence", { x: SX, y: JY, w: SW, h: JH, kind: "card", exit: "recede" });
    const jg = Loom.svg("g", {}, J.inner);
    kit.rect(jg, 0, 0, SW, JH, { fill: "accent", r: 28 });
    const txt = "In today's meeting you interrupted Sam twice while she was presenting. I lost track of her point. Next meeting, please let her finish before you respond, and let's talk after it.";
    kit.text(jg, txt, { role: "body", x: 40, y: 24, w: SW - 80, h: JH - 48, maxLines: 6, valign: "middle", color: S.pickTokenOn("accent") });
    // slots slide together into the sentence, then it floods in
    slots.forEach((s, i) => m.travel(s.E, tJ, { x: SX, y: JY + 20 + i * 10, scale: 1 }));
    slots.forEach((s) => Loom.tween(s.g, { opacity: 1 }, { opacity: 0, duration: 0.35, ease: Loom.ease.exit }, tJ + 0.5, { kind: "fade_out", beat: B, content: true }));
    m.unmask(J, tJ + 0.35, { dir: "ltr" });
    m.emphasis(J, tJ + 0.6);
  },
});
