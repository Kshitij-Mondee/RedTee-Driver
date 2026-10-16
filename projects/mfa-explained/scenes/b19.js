// @design held_frame_returns_changed_continued: the practice answer acted on the held frame, then a callback ghost names what the prompt really is
/* b19 - Refuse it. It is run three, asking you to finish their sign-in.
 *
 * Treatments considered:
 *   (A) a rule card "Deny prompts you did not start" over the dimmed bench (rejected: b21 states the rule as a
 *       list; here the viewer should SEE the right action and its result, on the held frame).
 *   (B) static composition: the stack already gone, DENIED on the phone, the ghost and the tally ring together
 *       (rejected: two different claims, the action and the callback, would land at once).
 *   (C) CHOSEN: the action, then the callback. "Refuse it": Deny is pressed on the top card, the stack folds
 *       into it and DENIED lands where the buttons were. "It is run three": the look-alike box from run three
 *       fades in as a dashed ghost on the line and tally cell 3 rings. The last words hold the finished frame.
 * Rules: one accent (accent2) Deny -> tally cell 3; DENIED in pos (the thief is stopped), the ghost in accent3
 * (threat), half strength; nothing arrives during "asking you to finish their sign-in" (a finished frame).
 * Continuity: holds everything from b18. Phone stays at its bench rect (b20's fill grows from it). Prompts,
 * thief laptop, its line, the copy and the ghost retire under b20's fill.
 */
Loom.scene("b19", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, T = Loom.treat;
    for (const n of ["laptop", "phone", "line", "door", "door_plate", "run_slot", "thief_laptop", "copy_chip", "prompt_tail"]) ctx.held(n);
    const tally = ctx.held("tally");
    const p1 = ctx.held("prompt_1"), p2 = ctx.held("prompt_2"), p3 = ctx.held("prompt_3");

    /* ---------------- Refuse it: Deny is pressed, the stack folds, DENIED lands ---------------- */
    const tRefuse = ctx.cue("Refuse it");
    const deny = p3 && p3.deny;
    const bx = p3 ? p3.cx0 : 608, by = p3 ? p3.cy0 : 282;
    if (deny) {
      // accent2 on Deny for the instruction, then off once it is pressed
      // @form focus_outline: a thin accent outline that marks the control the narration names, then lets go
      const ring = Loom.svg("rect", { x: deny.x - 5, y: deny.y - 5, width: deny.w + 10, height: deny.h + 10, rx: 8, fill: "none", stroke: S.c("accent2"), "stroke-width": 3, opacity: 0 }, p3.inner);
      Loom.tween(ring, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: Loom.ease.enter }, tRefuse - 0.05, { kind: "reveal", beat: ctx.beat.id, name: "deny_focus" });
      Loom.tween(ring, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: Loom.ease.exit }, tRefuse + 0.75, { kind: "exit", beat: ctx.beat.id, name: "deny_focus" });
      // the press: an unseen pointer (no hands, no cursor: it is your thumb on your phone) taps Deny
      const finger = Loom.ui.cursor(ctx, { name: "tap_point", x: bx + deny.cx, y: by + deny.cy, exit: "recede" });
      m.tap(finger, deny, tRefuse + 0.3, { x: bx + deny.cx, y: by + deny.cy, ring: "accent2" });
    }
    // the two cards underneath slide under the top one (ease in-out, 0.4 s): one request left
    const tFold = tRefuse + 0.7;
    if (p1) m.travel(p1, tFold, { x: 48, y: -48, dur: 0.4 });
    if (p2) m.travel(p2, tFold + 0.04, { x: 24, y: -24, dur: 0.4 });
    // the buttons give way to the verdict
    if (deny && p3.approve) {
      for (const b of [deny.g, p3.approve.g]) Loom.tween(b, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: Loom.ease.exit }, tFold + 0.2, { kind: "exit", beat: ctx.beat.id, name: "prompt_buttons" });
    }
    const stampCx = bx + (p3 ? p3.deny.x + (p3.approve.x + p3.approve.w - p3.deny.x) / 2 : 220);
    const stampCy = by + (p3 ? p3.deny.cy : 160);
    // @form verdict_stamp: a tilted, double-ruled verdict word stamped where the choice was made
    const stamp = T.label(ctx, "prompt_stamp", { x: stampCx, y: stampCy, text: "DENIED", tone: "pos", role: "label", as: "stamp" });
    m.stamp(stamp, tFold + 0.45);
    Loom.sfx("land", tFold + 0.45);

    /* ---------------- It is run three: the look-alike box's ghost on the line, tally cell 3 rings ---------------- */
    const tRun3 = ctx.cue("It is run three");
    // @form ghost_outline: a dashed, half-strength outline of something from an earlier run, at its old place
    const ghost = ctx.el("fake_box_ghost", { x: 980, y: 560, w: 300, h: 320, kind: "object", exit: "recede" });
    kit.rect(ghost.inner, 0, 0, 300, 320, { fill: "none", r: 4, stroke: "accent3", sw: 3, opacity: 0.55 });
    ghost.inner.querySelectorAll("rect").forEach((r) => r.setAttribute("stroke-dasharray", "12 10"));
    kit.rect(ghost.inner, 26, 150, 248, 60, { fill: "none", r: 3, stroke: "accent3", sw: 2, opacity: 0.4 });
    ghost.inner.querySelectorAll("rect").forEach((r) => r.setAttribute("stroke-dasharray", "12 10"));
    Loom.tween(ghost.inner, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") * 1.4, ease: Loom.ease.enter }, tRun3, { kind: "reveal", beat: ctx.beat.id, name: "fake_box_ghost", content: true });
    ghost.revealT = tRun3; ghost.revealKind = "reveal";

    const cell = (tally && tally.cells && tally.cells[2]) || { x: 420, y: 186, w: 154, h: 64 };
    // @form cell_ring: an accent ring drawn around one cell of a held table to call it back
    const ringE = ctx.el("tally_ring", { x: cell.x - 8, y: cell.y - 8, w: cell.w + 16, h: cell.h + 16, kind: "connector", exit: "recede" });
    const rr = kit.path(ringE.inner, `M8 4 H${cell.w + 8} Q${cell.w + 12} 4 ${cell.w + 12} 8 V${cell.h + 8} Q${cell.w + 12} ${cell.h + 12} ${cell.w + 8} ${cell.h + 12} H8 Q4 ${cell.h + 12} 4 ${cell.h + 8} V8 Q4 4 8 4 Z`, { stroke: "accent2", sw: 4 });
    m.draw(rr, tRun3 + 0.35, { dur: 0.6 });
    ringE.revealT = tRun3 + 0.35; ringE.revealKind = "draw";
    // the last words ("asking you to finish their sign-in") add nothing: the frame holds, the door stays shut
  },
});
