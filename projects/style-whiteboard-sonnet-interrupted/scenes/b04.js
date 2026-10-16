// @design weak_line_circled: a card drawn with only a topic line, the one weak line ringed in the marker colour
/* Treatments: (A) static card with a callout arrow (rejected: no build); (B) card appears whole, circle only
 * (rejected: eye is not led); (C) CHOSEN: checklist, then the card, title written, then circled and named. */
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (s) => DRAW * clamp(String(s).length / 14, 0.45, 1.8);

    // ---- the checklist, top right: Before in ink, the others muted
    const tBefore = ctx.cue("Before");
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "recede" });
    const sl = Loom.lesson.step_list(ctx, steps.inner, { current: 0, name: "steps" });
    sl.draw(tBefore);

    // ---- the invite card, centred left of the checklist (card 900 x 600)
    const CX = 260, CY = 250;
    const tInvite = ctx.cue("Sam's invite says");
    const invite = ctx.el("invite", { x: CX, y: CY, w: 900, h: 600, kind: "card", exit: "recede" });
    const ic = Loom.lesson.invite_card(ctx, invite.inner, { name: "invite" });
    ic.draw(tInvite - 0.2);

    // ---- the title is written on "Pilot update"
    const tTitle = ctx.cue("Pilot update");
    ic.setTitle("Pilot update", tTitle - 0.1);
    const tb = ic.titleBox;

    // ---- the one accent: a marker loop round the title (inside the card, clear of the guest row)
    const tCircle = ctx.cue("That's a subject");
    const rx = tb.w / 2 + 44, ry = 46, k = 0.5523;
    const lcx = tb.x + tb.w / 2, lcy = tb.y + tb.h / 2 + 4;
    const bx = Math.floor(lcx - rx - 12), by = Math.floor(lcy - ry * 1.16 - 12);
    const lx = lcx - bx, ly = lcy - by;
    const loop = `M${lx} ${ly - ry}` +
      ` C${lx + k * rx} ${ly - ry} ${lx + rx} ${ly - k * ry} ${lx + rx} ${ly}` +
      ` C${lx + rx} ${ly + k * ry} ${lx + k * rx} ${ly + ry} ${lx} ${ly + ry}` +
      ` C${lx - k * rx} ${ly + ry} ${lx - rx} ${ly + k * ry} ${lx - rx} ${ly}` +
      ` C${lx - rx} ${ly - k * ry} ${lx - k * rx} ${ly - ry * 1.06} ${lx} ${ly - ry * 1.06}` +
      ` C${lx + rx * 0.2} ${ly - ry * 1.06} ${lx + rx * 0.4} ${ly - ry * 1.12} ${lx + rx * 0.5} ${ly - ry * 1.16}`;
    const circle = ctx.el("subject_circle", { x: CX + bx, y: CY + by, w: Math.ceil(2 * rx + 24), h: Math.ceil(ly + ry + 12), kind: "mark", exit: "recede" });
    kit.sketch(circle.inner, "path", [loop], { fill: "none", stroke: "accent", sw: 5 });
    m.draw(circle, tCircle, { dur: drawDur(2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)) });

    // ---- the muted note beside it, on "not a decision"
    const tNote = ctx.cue("not a decision");
    const nx = CX + Math.ceil(lcx + rx + 40);
    const note = ctx.el("subject_note", { x: nx, y: CY + 134, w: 280, h: 56, kind: "label", exit: "wipe" });
    kit.text(note.inner, "a subject", { role: "label", x: 0, y: 0, w: 280, h: 56, maxLines: 1, valign: "middle", color: "muted" });
    m.unmask(note, tNote, { dur: writeDur("a subject") });
  },
});
