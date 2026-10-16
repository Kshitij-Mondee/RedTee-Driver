// @design draw_then_flag_the_weak_line: a card drawn line by line so the eye lands on its one weak line, flagged by one marker circle and a muted note
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (s) => DRAW * clamp(String(s).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
    // treatments: (A) static card with a label (rejected: no drawing), (B) card fades in whole (rejected), (C) CHOSEN: drawn in speech order, one circle

    // ---- the checklist, top right, drawn on "Before"
    const tBefore = ctx.cue("Before");
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "recede" });
    const sl = Loom.lesson.step_list(ctx, steps.inner, { current: 0, name: "steps" });
    steps.handle = sl;
    sl.draw(tBefore);

    // ---- the invite card, drawn on "Sam's invite says"
    const OX = 200, OY = 250;
    const tInvite = ctx.cue("Sam's invite says");
    const invite = ctx.el("invite", { x: OX, y: OY, w: 1160, h: 600, kind: "card", exit: "recede" });
    const ic = Loom.lesson.invite_card(ctx, invite.inner, { name: "invite" });
    invite.handle = ic;
    ic.draw(tInvite - 0.2);
    const tTitle = ctx.cue("Pilot update");
    ic.setTitle("Pilot update", tTitle);
    const tb = ic.titleBox;

    // ---- "That's a subject": the one accent, a marker loop round the title
    const tCircle = ctx.cue("That's a subject");
    const cx = OX + tb.x + tb.w / 2 + 6, cy = OY + tb.y + tb.h / 2;
    const rx = tb.w / 2 + 44, ry = 46, k = 0.5523;
    const cbx = Math.floor(cx - rx - 12), cby = Math.floor(cy - ry * 1.16 - 12);
    const lx = cx - cbx, ly = cy - cby;
    const loop = `M${lx} ${ly - ry}` +
      ` C${lx + k * rx} ${ly - ry} ${lx + rx} ${ly - k * ry} ${lx + rx} ${ly}` +
      ` C${lx + rx} ${ly + k * ry} ${lx + k * rx} ${ly + ry} ${lx} ${ly + ry}` +
      ` C${lx - k * rx} ${ly + ry} ${lx - rx} ${ly + k * ry} ${lx - rx} ${ly}` +
      ` C${lx - rx} ${ly - k * ry} ${lx - k * rx} ${ly - ry * 1.06} ${lx} ${ly - ry * 1.06}` +
      ` C${lx + rx * 0.2} ${ly - ry * 1.06} ${lx + rx * 0.4} ${ly - ry * 1.1} ${lx + rx * 0.5} ${ly - ry * 1.14}`;
    const circle = ctx.el("subject_circle", { x: cbx, y: cby, w: Math.ceil(2 * rx + 24), h: Math.ceil(2 * ry * 1.16 + 24), kind: "mark", exit: "recede" });
    hand(circle.inner, loop, { stroke: "accent", sw: 5 });
    m.draw(circle, tCircle, { dur: drawDur(2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)) });

    // ---- "not a decision": a muted note beside the circle
    const tNote = ctx.cue("not a decision");
    const nx = Math.round(cx + rx + 28), nw = 260;
    const note = ctx.el("subject_note", { x: nx, y: Math.round(cy - 28), w: nw, h: 56, kind: "label", exit: "wipe" });
    kit.text(note.inner, "a subject", { role: "label", x: 0, y: 0, w: nw, h: 56, maxLines: 1, valign: "middle", color: "muted" });
    m.unmask(note, tNote, { dur: writeDur("a subject") });
  },
});
