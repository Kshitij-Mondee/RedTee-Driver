// @design thought_untangles: a tangled feeling straightens into a statable effect clause
/* Treatments: (A) static clause with signalling (rejected: no change shown), (B) text typed in a bubble (rejected: no untangling),
 * (C) CHOSEN: tangled thread wobbles over Priya, straightens and unmasks the clause, then underline. */
Loom.scene("b22", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    try { ctx.held("slot_one_words"); } catch (e) {}

    // Priya, close, left
    const pr = ctx.el("priya", { x: 160, y: 250, w: 520, h: 560, kind: "character", exit: "recede" });
    kit.peep(pr.inner, "woman", "explaining", { x: 0, y: 0, size: 520 });
    m.reveal(pr, ctx.start + 0.1, { dy: 10 });

    // tangled thread over her
    const th = ctx.el("thought_thread", { x: 700, y: 330, w: 300, h: 200, kind: "icon", exit: "recede" });
    const tang = kit.path(th.inner, "M10 100 C80 -20 120 220 170 60 C210 -10 90 150 200 130 C260 110 230 30 290 100", { stroke: "muted", sw: 8, fill: "none" });
    m.draw(tang, ctx.cue("Priya says what she directly felt"), { dur: 1.0 });
    Loom.tween(th.inner, { x: -6 }, { x: 6, duration: 0.18, yoyo: true, repeat: 5, ease: "none" }, ctx.cue("Priya says what she directly felt") + 0.9, { kind: "ambient", beat: ctx.beat.id });

    // effect clause: thread straightens and prints the clause
    const tL = ctx.cue("I lost track of her point");
    const cl = ctx.el("effect_clause", { x: 720, y: 440, w: 1040, h: 150, kind: "text", exit: "recede" });
    kit.rect(cl.inner, 0, 0, 1040, 150, { fill: "surface", r: 24 });
    const t = kit.text(cl.inner, "I lost track of her point", { role: "title", x: 30, y: 12, w: 980, h: 110, maxLines: 1, valign: "middle", weight: 800, color: "accent" });
    m.unmask(cl, tL, { dir: "ltr" });
    const str = ctx.el("thread_straight", { x: 640, y: 515, w: 80, h: 20, kind: "connector", exit: "recede" });
    const ln = kit.line(str.inner, 0, 10, 80, 10, { stroke: "accent", sw: 8 });
    m.draw(ln, tL, { dur: 0.5 });
    Loom.tween(th, { opacity: 1 }, { opacity: 0, duration: 0.4 }, tL, { kind: "fade", beat: ctx.beat.id });

    // settle
    m.settle(cl, ctx.cue("That is honest"));

    // underline
    const ul = ctx.el("clause_underline", { x: 750, y: 596, w: 980, h: 16, kind: "connector", exit: "recede" });
    const u = kit.line(ul.inner, 0, 8, 980, 8, { stroke: "accent", sw: 8 });
    m.draw(u, ctx.cue("hard to dispute"), { dur: 0.7 });
  },
});
