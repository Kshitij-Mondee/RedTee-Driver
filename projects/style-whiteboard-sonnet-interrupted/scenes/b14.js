// @design blank_page_waits: a blank ruled card hands its first line to the viewer, who writes one question; a hand-lettered three-part rule sits under it
// Treatments considered: (1) static card + rule with signalling, (2) card drawn, '?' written, rule phrase by phrase (chosen: narration order), (3) card slides in with the rule on a banner.
Loom.scene("b14", {
  build(ctx, props) {
    const { kit, m } = ctx;

    // the learner's blank agenda: card 900 wide centred on the 1920 board (element is 1160 wide incl. envelope space, unused)
    const A = ctx.el("agenda", { x: 510, y: 120, w: 1160, h: 600, kind: "card", exit: "recede" });
    const card = Loom.lesson.invite_card(ctx, A.inner, { blank: true, name: "agenda_card" });
    card.draw(ctx.cue("Before your next meeting"));

    // the one accent: a large '?' written on the first line slot
    const sb = card.slotBox;
    
    const Q = ctx.el("first_line_q", { x: sb.x, y: sb.y - 8, w: sb.w, h: sb.h + 24, kind: "text", exit: "wipe", parent: A.inner });
    // @form accent_question_mark: the question the first line waits for
    kit.text(Q.inner, "?", { role: "hero", x: 0, y: 0, w: sb.w, h: sb.h + 24, maxLines: 1, valign: "middle", color: "accent" });
    m.unmask(Q, ctx.cue("as a question"), { dur: 0.7 });

    // the rule, Caveat, centred under the card, one element per phrase
    const parts = [
      { s: "Name it,", cue: ctx.cue("Name it") },
      { s: "steer it,", cue: ctx.cue("steer it") },
      { s: "read it back", cue: ctx.cue("read it back") }
    ];
    const GAP = 28;
    parts.forEach(p => { p.f = kit.fit(p.s, { role: "title", w: 1700, h: 120, maxLines: 1 }); p.w = Math.ceil(p.f.width) + 24; });
    const total = parts.reduce((a, p) => a + p.w, 0) + GAP * (parts.length - 1);
    let x = Math.round((1920 - total) / 2);
    parts.forEach((p, i) => {
      const E = ctx.el("rule_" + i, { x: x, y: 770, w: p.w, h: 116, kind: "text", exit: "wipe" });
      kit.text(E.inner, p.s, { role: "title", x: 0, y: 0, w: p.w, h: 116, maxLines: 1, valign: "middle", color: "ink" });
      m.unmask(E, p.cue, { dur: ctx.style.dur("draw") * 0.7 });
      x += p.w + GAP;
    });
  }
});
