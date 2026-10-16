// @design blank_prompt_card: an empty form whose first line waits for a question, with the rule written beneath it
// Treatments: (1) static card + rule signalled by accent; (2) card drawn then '?' then rule phrase by phrase (chosen: matches speech); (3) camera push onto the line.
Loom.scene("b14", {
  build(ctx, props) {
    var kit = ctx.kit, m = ctx.m;

    // the learner's blank agenda: kit invite_card in blank mode
    var A = ctx.el("agenda", { x: 510, y: 130, w: 900, h: 600, kind: "card", exit: "wipe" });
    var card = Loom.lesson.invite_card(ctx, A.inner, { blank: true, name: "agenda_part" });
    var tCard = ctx.cue("Before your next meeting");
    card.draw(tCard);

    // the one accent: a large '?' on the first line
    var sb = card.slotBox;
    var Q = ctx.el("first_line_q", { x: sb.x, y: sb.y, w: sb.w, h: sb.h, kind: "mark", exit: "wipe", parent: A.inner });
    // @form accent_question_mark: the first line waits for a question
    kit.sketch(Q.inner, "path", ["M30 28 C28 8, 90 6, 92 32 C94 52, 64 56, 62 76"], { fill: "none", stroke: "accent", sw: 9 });
    kit.sketch(Q.inner, "path", ["M62 94 L63 95"], { fill: "none", stroke: "accent", sw: 11 });
    m.draw(Q, ctx.cue("as a question"), { dur: 0.8 });

    // the rule under the card, written phrase by phrase in Caveat
    var parts = ["Name it,", "steer it,", "read it back."];
    var full = kit.fit("Name it, steer it, read it back.", { role: "title", w: 1500, h: 120, maxLines: 1 });
    var size = full.size;
    var fits = parts.map(function (s) { return kit.fit(s, { role: "title", w: 1500, h: 120, maxLines: 1, size: size }); });
    var gap = 28;
    var total = fits.reduce(function (a, f) { return a + Math.ceil(f.width) + 16; }, 0) + gap * 2;
    var RW = Math.min(1500, Math.ceil(total));
    var R = ctx.el("rule", { x: Math.round((1920 - RW) / 2), y: 780, w: RW, h: 120, kind: "text", exit: "wipe" });
    var cues = [ctx.cue("Name it"), ctx.cue("steer it"), ctx.cue("read it back")];
    var x = 0;
    parts.forEach(function (s, i) {
      var w = Math.ceil(fits[i].width) + 16;
      var P = ctx.el("rule_" + i, { x: x, y: 0, w: w, h: 120, kind: "text", exit: "wipe", parent: R.inner });
      kit.text(P.inner, s, { role: "title", x: 0, y: 0, w: w, h: 120, maxLines: 1, valign: "middle", color: "ink", size: size });
      m.unmask(P, cues[i], { dur: 0.9 });
      x += w + gap;
    });
  }
});
