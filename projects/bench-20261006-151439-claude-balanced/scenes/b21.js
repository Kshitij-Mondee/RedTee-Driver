// @design same_room_two_outcomes: one room split in two, the same seating, only the flow differs
/* Treatments: (A) static split with signalling, (B) two cards side by side, (C) CHOSEN: split room draws,
 * left holds smooth, right freezes mid-slide and Priya tilts, then the word lands. Change is the effect. */
Loom.scene("b21", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const PY = 130, PH = 720, PW = 880;
    const LX = 60, RX = 980;
    const tSplit = ctx.cue("Look at the room after the second interruption");
    const tLost = ctx.cue("Priya loses track of Sam's point");
    const tEff = ctx.cue("is the effect");

    function room(name, x, cut) {
      const E = ctx.el(name, { x, y: PY, w: PW, h: PH, kind: "scene", exit: "recede" });
      kit.rect(E.inner, 0, 0, PW, PH, { fill: "surface", r: 24 });
      kit.rect(E.inner, 0, 520, PW, PH - 520, { fill: "field", r: 0 });
      // @form room_screen: the slide screen on the wall
      kit.rect(E.inner, 90, 90, 400, 260, { fill: "field", r: 12 });
      // @form room_table: the shared meeting table
      kit.rect(E.inner, 420, 560, 400, 40, { fill: "muted", r: 10 });
      return E;
    }
    const L = room("left_room_Sam_smooth", LX, false);
    const R = room("right_room_Sam_cut_off", RX, true);

    // slide content: smooth bars on left, cut-off bars on right
    const sl = ctx.el("left_slide", { x: LX + 110, y: PY + 110, w: 360, h: 220, kind: "chart", exit: "recede" });
    [0, 1, 2].forEach(i => kit.rect(sl.inner, 0, i * 70, 360 - i * 50, 44, { fill: "accent4", r: 8 }));
    const sr = ctx.el("right_slide", { x: RX + 110, y: PY + 110, w: 360, h: 220, kind: "chart", exit: "recede" });
    kit.rect(sr.inner, 0, 0, 360, 44, { fill: "accent4", r: 8 });
    kit.rect(sr.inner, 0, 70, 150, 44, { fill: "accent4", r: 8 });

    const div = ctx.el("split_divider", { x: 940, y: PY, w: 40, h: PH, kind: "rule", exit: "wipe" });
    kit.rect(div.inner, 14, 0, 12, PH, { fill: "ink", r: 6 });

    m.settle(div, tSplit + 0.1, { dy: 0 });
    m.settle(L, tSplit + 0.3, { dy: 20 });
    m.settle(sl, tSplit + 0.5, { dy: 20 });
    m.settle(R, tSplit + 0.6, { dy: 20 });
    m.settle(sr, tSplit + 0.8, { dy: 20 });

    // people
    const samL = ctx.character("sam_left", "sam", { x: LX + 600, y: 700, scale: 1.0 });
    samL.pose("present", tSplit + 0.5);
    samL.talk();
    const priL = ctx.character("priya_left", "ava", { x: LX + 250, y: 760, scale: 0.9 });
    priL.emotion("happy", tSplit + 0.8);
    const samR = ctx.character("sam_right", "sam", { x: RX + 600, y: 700, scale: 1.0 });
    samR.pose("present", tSplit + 0.8);
    const priR = ctx.character("priya_right", "ava", { x: RX + 250, y: 760, scale: 0.9 });
    priR.emotion("concerned", tLost);
    priR.pose("shrug", tLost, { dur: 0.6 });
    priR.gesture("shake", tLost + 0.2, tLost + 1.2);
    samR.emotion("surprised", tLost);
    samR.pose("idle", tLost, { dur: 0.3 });

    // cut-off mark on the right slide
    const cut = ctx.el("slide_cut", { x: RX + 110, y: PY + 190, w: 360, h: 140, kind: "mark", exit: "recede" });
    kit.rect(cut.inner, 0, 0, 360, 140, { fill: "surface", r: 8 });
    m.settle(cut, tLost + 0.1, { dy: 0 });

    // the effect word
    const ef = ctx.el("effect_word", { x: RX + 410, y: PY + 340, w: 440, h: 170, kind: "value", exit: "recede" });
    kit.text(ef.inner, "Effect", { role: "display", x: 0, y: 0, w: 440, h: 170, maxLines: 1, align: "center", valign: "middle", color: "accent" });
    m.pop(ef, tEff, { overshoot: true });
  },
});
