// @design cursor_settles_then_freeze: inside a screen, a pointer drifts to one target and settles; the whole frame then freezes and grades down
/* b03 - inside Jo's message: the button says act now, her cursor is already on the link, and the frame stops.
 *
 * Treatments considered:
 *  (A) a UI mock with a click animation (rejected: the lesson's point is that she has NOT clicked, the pointer
 *      resting on the link is the whole moment);
 *  (B) a close-up of Jo's face with the link in a bubble (rejected: the choice is on the screen, not on her face);
 *  (C) CHOSEN: we are inside the message (st_msg, the laptop screen b02 pushed into). The same layout as b02, drawn
 *      x4: subject, deadline, body, grey bars, the link, a button that says Act now. The pointer drifts across the
 *      body on a gentle arc and settles on the link; everything else holds still. In the silence after the line the
 *      frame freezes mid-motion (breathing stops) and a field wash grades it down to sit behind b04.
 *
 * Layout is b02's, x4 (screen units 480 x 270 -> station 1920 x 1080). Named for the scenes that hold it:
 *   "message"  the whole window (b04 holds it, b05 shrinks it into an inbox row); message.wash is the grade-down
 *              rect inside it (an element property, so b05 can lift the dim as the message becomes a row).
 */
Loom.scene("b03", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, svg = Loom.svg, tc = (t) => S.c(t);
    const U = 4;
    const meta = (kind, name, content) => ({ kind, beat: ctx.beat.id, name, content: !!content });

    // ---- cues
    const tAct = ctx.cue("Act now"), tSays = ctx.cue("it says"), tCur = ctx.cue("Jo's cursor");
    const tLinkW = ctx.cue("the link"), tHere = ctx.cue("You have been here too");
    const tSwap = ctx.start + 0.25;                                  // b02's pull has met this window by now; a short crossfade
    const tArrive = tLinkW + 0.15, tFreeze = tHere;
    const tGrade = ctx.speechEnd + 0.15;

    // ---- the message window: b02's layout x4 (opaque, so the floor screen behind it never shows through)
    const msg = ctx.el("message", { x: 0, y: 0, w: 1920, h: 1080, kind: "card" });
    const M = msg.inner;
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: tc("surface") }, M);
    svg("rect", { x: 0, y: 0, width: 1920, height: 22 * U, fill: tc("surface2") }, M);
    ["neg", "accent4", "pos"].forEach((tk, i) => svg("circle", { cx: (14 + i * 14) * U, cy: 11 * U, r: 3.5 * U, fill: tc(tk), opacity: 0.85 }, M));
    svg("circle", { cx: 30 * U, cy: 44 * U, r: 11 * U, fill: tc("line") }, M);
    svg("rect", { x: 50 * U, y: 37 * U, width: 96 * U, height: 6 * U, rx: 3 * U, fill: tc("muted"), opacity: 0.8 }, M);
    svg("rect", { x: 50 * U, y: 49 * U, width: 150 * U, height: 5 * U, rx: 2.5 * U, fill: tc("line"), opacity: 0.8 }, M);
    svg("circle", { cx: 456 * U, cy: 44 * U, r: 5 * U, fill: tc("accent") }, M);
    // the body as grey line bars (no invented words)
    [[198, 280], [210, 190]].forEach(([y, w]) => svg("rect", { x: 24 * U, y: y * U, width: w * U, height: 6 * U, rx: 3 * U, fill: tc("line"), opacity: 0.7 }, M));

    // the three lettered lines, sized from b02's measured sizes x4 (type roles keep the floors)
    const roleFor = (px) => (px >= 96 ? "hero" : "title");
    const subjF = kit.fit("Confirm your password", { role: "label", w: 432, maxLines: 1, weight: 700 });
    const subjPx = subjF.size * U;
    kit.text(M, "Confirm your password", { role: roleFor(subjPx), size: subjPx, x: 24 * U, y: 64 * U, w: 432 * U, h: Math.ceil(subjF.height * U) + 8, maxLines: 1, weight: 700 });
    const hrF = kit.fit("within the hour", { role: "caption", w: 360, maxLines: 1, weight: 700 }), inset = Math.max(8, Math.ceil(0.25 * hrF.size));
    const chipW = (Math.ceil(hrF.width * 1.06) + 2 * inset + 30) * U   /* 6% room: Chrome lays the scaled-up text out wider (check) */, chipH = (Math.ceil(hrF.height) + 2 * inset) * U, hrPx = hrF.size * U;
    kit.rect(M, 24 * U, 111 * U, chipW, chipH, { fill: "accent", r: 8 * U, flat: true });
    kit.icon(M, "clock", { x: (24 + inset + 10) * U, y: 111 * U + chipH / 2, size: 20 * U, color: "onAccent" });
    kit.text(M, "within the hour", { role: roleFor(hrPx), size: hrPx, x: (24 + inset + 28) * U, y: 111 * U + inset * U, w: chipW - (2 * inset + 28) * U, h: chipH - 2 * inset * U, maxLines: 1, weight: 700, color: "onAccent", valign: "middle" });
    const bdF = kit.fit("or lose access to the shared drive", { role: "caption", w: 432, maxLines: 1 }), bdPx = bdF.size * U;
    kit.text(M, "or lose access to the shared drive", { role: roleFor(bdPx), size: bdPx, x: 24 * U, y: 160 * U, w: 432 * U, h: Math.ceil(bdF.height * U) + 8, maxLines: 1 });

    // the link (a bar, as in b02) and its hover glow; the button silhouette
    const linkGlow = svg("rect", { x: 24 * U - 14, y: 221 * U - 22, width: 120 * U + 28, height: 5 * U + 44, rx: 18, fill: tc("accent3"), opacity: 0 }, M);
    svg("rect", { x: 24 * U, y: 221 * U, width: 120 * U, height: 5 * U, rx: 2.5 * U, fill: tc("accent3") }, M);
    const btn = svg("rect", { x: 336 * U, y: 196 * U, width: 120 * U, height: 32 * U, rx: 8 * U, fill: tc("line"), opacity: 0.55 }, M);
    Loom.tween(M, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: Loom.ease.enter }, tSwap, meta("reveal", "message", true));

    // ---- "Act now": the button lights and its words print (no tag beyond the label itself)
    // @form button_lights_with_label: a muted silhouette button that takes the accent colour as its label prints
    const lit = ctx.el("act_now_button", { x: 336 * U, y: 196 * U, w: 120 * U, h: 32 * U, kind: "card", parent: M });
    kit.rect(lit.inner, 0, 0, 120 * U, 32 * U, { fill: "accent", r: 8 * U, flat: true });
    kit.text(lit.inner, "Act now", { role: "title", size: 72, x: 20, y: 18, w: 120 * U - 40, h: 32 * U - 36, align: "center", valign: "middle", maxLines: 1, weight: 800, color: "onAccent" });
    m.unmask(lit, tAct, { dur: 0.55, content: true });
    Loom.tween(btn, { opacity: 0.55 }, { opacity: 0, duration: 0.3 }, tAct, meta("heat", "act_now_button.base", true));
    const wash = svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: tc("field"), opacity: 0 }, M);   // the grade-down lives inside the message, above the button
    msg.wash = wash;

    // ---- the cursor: drifts in across the body on a gentle arc and settles on the link
    // @form pointer_settles_on_target: a pointer travels in two eased legs and rests on the thing the sentence names
    const cur = Loom.ui.cursor(ctx, { name: "cursor", x: 1500, y: 330, size: 3 });
    m.cursorIn(cur, tCur);
    const legA = 0.95, aAt = tCur + 0.1;
    m.cursorTo(cur, 1020, 600, aAt, { dur: legA, arc: 0.1 });
    m.cursorTo(cur, 300, 892, aAt + legA, { dur: Math.max(0.5, tArrive - (aAt + legA)), arc: 0.12 });
    Loom.tween(linkGlow, { opacity: 0 }, { opacity: 0.3, duration: 0.35 }, tArrive, meta("heat", "link.hover", true));

    // ---- the tag on the link: wipes in beside it, where the caption band does not reach
    const tagLink = Loom.data.tag(ctx, "tag_link", { x: 680, y: 852, text: "The link", role: "lead", color: "accent3", textColor: "onAccent", t: tArrive });
    void tagLink; void tSays;

    // ---- ambient life until the freeze: the window breathes (period-locked, ends on a whole number of periods)
    const bT0 = tSwap + 0.3, nP = Math.max(1, Math.round((tFreeze - bT0) / 3.5));
    Loom.hold.breathe(msg, bT0, tFreeze, { amp: 0.004, period: (tFreeze - bT0) / nP });

    // ---- the freeze, then the grade-down through the silence (about 45 percent left under the field)
    Loom.tween(wash, { opacity: 0 }, { opacity: 0.55, duration: 1.3, ease: Loom.ease.editorial }, tGrade, meta("grade", "message.wash", true));
  },
});
