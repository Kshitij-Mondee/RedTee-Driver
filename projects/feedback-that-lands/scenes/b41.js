// @design card_on_desk_filled_in_steps_continued: the pen moves to the next ruled line and writes its prompt
/* b41 - line four, in two parts: the question you'll ask, then what you'll agree and when. Holds the desk, the
 * card and lines 1 to 3. The pen drops to line 4 and writes the question; in the short pause after "A real one"
 * it steps down to the second rule and writes the agreement. Then the card holds, complete, in the viewer's own
 * prompts (b44 brings the same four moves back as a list).
 */
Loom.scene("b41", {
  build(ctx) {
    const { kit, m } = ctx;
    const meta = (name) => ({ kind: "travel", beat: ctx.beat.id, name, content: false });

    const HELD = ["desk", "window_light", "laptop", "mug", "notebook", "pcard", "pcard_frame", "pcard_rules", "num_1", "num_2", "num_3", "num_4", "header", "pen", "line_1", "line_2", "line_3"];
    const H = {};
    HELD.forEach((n) => { H[n] = ctx.held(n); });
    const desk = H.desk, pen = H.pen;
    m.drift(H.window_light, ctx.start, ctx.end, { amp: 7, period: 6 });

    const CX = 620, CY = 96, rowY = [150, 280, 410, 540];
    const penTo = (tx, ty, t, dur, ease) => {
      const cur = pen.__pos || { x: 0, y: 0, s: 1 };
      const to = { x: tx - (pen.x + 8), y: ty - (pen.y + 128), s: 1 };
      Loom.tween(pen.mover, { x: cur.x, y: cur.y, scale: 1, transformOrigin: "0 0" }, { x: to.x, y: to.y, scale: 1, duration: dur, ease: ease || Loom.ease.editorial }, t, meta("pen"));
      pen.__pos = to;
      return t + dur;
    };
    // @form written_line_on_rule: a prompt typed on a ruled line while a pen tip follows it
    const write = (name, str, x, y, t, cps) => {
      const line = ctx.el(name, { x: x - 4, y: y + 16, w: 720, h: 70, kind: "text", exit: "wipe", parent: desk.inner });
      desk.inner.insertBefore(line.outer, pen.outer);
      const tx = kit.text(line.inner, str, { role: "body", x: 0, y: 0, w: 720, h: 70, maxLines: 1, size: 36, color: "ink", valign: "middle" });
      m.reveal(line, t, { dy: 0, dur: 0.1 });
      const tEnd = m.typewriter(tx, t, { cps });
      penTo(x + tx.__fit.width + 14, y + 84, t, tEnd - t, "none");
      return tEnd;
    };

    // ---- 4a: the question you'll ask (the first rule of line 4)
    const x0 = CX + 134, y4a = CY + rowY[3], y4b = y4a + 90;
    const tA = ctx.cue("the question you'll ask");
    const tMove = ctx.start + 0.02;
    penTo(x0, y4a + 84, tMove, Math.max(0.6, tA - tMove - 0.1));
    // the camera follows down to line 4, and once the card is complete it pulls back to the whole desk
    Loom.cam.frame(desk, { x: CX, y: CY + rowY[2] - 8, w: 900, h: 617 }, tMove, 1.0, { margin: 0 });
    const endA = write("line_4a", "The question you'll ask", x0, y4a, tA, 12);

    // ---- 4b: what you'll agree, and when (the second rule), the pen steps down after "A real one"
    const tB = ctx.cue("what you'll agree");
    const tStep = Math.max(endA + 0.15, ctx.cue("A real one"));
    penTo(x0, y4b + 84, tStep, Math.max(0.6, tB - tStep - 0.1));
    const endB = write("line_4b", "What you'll agree, and when", x0, y4b, tB, 15);
    Loom.cam.frame(desk, { x: 0, y: 0, w: 1920, h: 1080 }, Math.max(endB + 0.3, ctx.end - 1.7), 1.3, { margin: 0 });
  },
});
