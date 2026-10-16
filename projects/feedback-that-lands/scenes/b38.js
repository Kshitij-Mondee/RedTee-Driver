// @design card_on_desk_filled_in_steps_continued: the pen moves to the next ruled line and writes its prompt
/* b38 - line one: the situation. Holds everything b37 built (the desk, its props, the card, its rules, the
 * header, the pen) and ADDS one thing: the pen travels to line 1, then writes "When and where?" while its tip
 * glides along the words. Nothing is replaced; the card only gets fuller.
 */
Loom.scene("b38", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const meta = (name) => ({ kind: "travel", beat: ctx.beat.id, name, content: false });

    // hold the whole picture from b37 (every element, nested or not, so none of them leaves at the join)
    const HELD = ["desk", "window_light", "laptop", "mug", "notebook", "pcard", "pcard_frame", "pcard_rules", "num_1", "num_2", "num_3", "num_4", "header", "pen"];
    const H = {};
    HELD.forEach((n) => { H[n] = ctx.held(n); });
    const desk = H.desk, pen = H.pen;
    m.drift(H.window_light, ctx.start, ctx.end, { amp: 7, period: 6 });

    // the card's geometry (the same numbers as b37)
    const CX = 620, CY = 96, rowY = [150, 280, 410, 540];
    // the pen: tip is at (pen.x + 8, pen.y + 128) at rest; this moves the tip to a point on the desk
    const penTo = (tx, ty, t, dur, ease) => {
      const cur = pen.__pos || { x: 0, y: 0, s: 1 };
      const to = { x: tx - (pen.x + 8), y: ty - (pen.y + 128), s: 1 };
      Loom.tween(pen.mover, { x: cur.x, y: cur.y, scale: 1, transformOrigin: "0 0" }, { x: to.x, y: to.y, scale: 1, duration: dur, ease: ease || Loom.ease.editorial }, t, meta("pen"));
      pen.__pos = to;
      return t + dur;
    };

    // ---- line 1: the pen goes to the start of the rule, then writes while the tip follows the words
    const x0 = CX + 134, y0 = CY + rowY[0];
    const tMove = ctx.cue("the situation");
    const tWrite = ctx.cue("When was it");
    penTo(x0, y0 + 84, tMove, Math.max(0.9, tWrite - tMove - 0.1));
    // the camera comes in on the card so the writing reads large, then follows it down line by line (b39 to b41)
    // each frame starts just above a written line and is as tall as the screen at its scale, so no line is ever
    // sliced by the frame edge (the rows are 130 px apart; the card is 900 wide)
    Loom.cam.frame(desk, { x: CX, y: CY - 16, w: 900, h: 554 }, tMove, 1.3, { margin: 0 });

    // @form written_line_on_rule: a prompt typed on a ruled line while a pen tip follows it
    const line = ctx.el("line_1", { x: x0 - 4, y: y0 + 16, w: 720, h: 70, kind: "text", exit: "wipe", parent: desk.inner });
    desk.inner.insertBefore(line.outer, pen.outer);
    const tx = kit.text(line.inner, "When and where?", { role: "body", x: 0, y: 0, w: 720, h: 70, maxLines: 1, size: 36, color: "ink", valign: "middle" });
    m.reveal(line, tWrite, { dy: 0, dur: 0.1 });
    const tEnd = m.typewriter(tx, tWrite, { cps: 12 });
    penTo(x0 + tx.__fit.width + 14, y0 + 84, tWrite, tEnd - tWrite, "none");
  },
});
