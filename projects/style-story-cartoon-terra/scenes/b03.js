// @design quiet_reasons_rise: three paper thoughts rise beside a colleague, then fade as she straightens
/*
 * Treatments considered: (A) three floating text lines, rejected because the reasons need to feel like thoughts;
 * (B) a close-up of Maya, rejected because it loses the receipts that motivate her pause;
 * (C) chosen, a medium desk shot where paper thought bubbles rise in a clear staircase beside Maya.
 */
Loom.scene("b03", {
  build(ctx) {
    const { kit, m } = ctx;
    const start = ctx.start;
    const wrongAt = ctx.cue("What if I'm wrong?");
    const costAt = ctx.cue("What will it cost me?");
    const businessAt = ctx.cue("Is it even my business?");

    // The cut begins a fresh desk shot. Named holders are the exact elements b04 takes forward.
    const room = ctx.el("room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const back = Loom.lesson.desk_set(ctx, room.inner, { framing: "medium", layer: "back", prefix: "desk_back_" });
    const maya = ctx.character("maya", "maya", {
      x: back.anchors.maya.x, y: back.anchors.maya.y, scale: back.anchors.maya.scale,
      pose: "idle", skin: 0, cloth: "cloth"
    });
    maya.handle = maya;
    const desk = ctx.el("desk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    Loom.lesson.desk_set(ctx, desk.inner, { framing: "medium", only: ["desk"], prefix: "desk_art_" });
    const receiptArt = Loom.lesson.desk_set(ctx, ctx.station.svg, { framing: "medium", only: ["receipts"], ring: true });
    const receipts = receiptArt.receipts;
    const receiptCircle = receiptArt.ring;
    const laptop = ctx.el("laptop", { x: 0, y: 0, w: 1920, h: 1080, kind: "instrument" });
    Loom.lesson.desk_set(ctx, laptop.inner, { framing: "medium", only: ["laptop"], prefix: "laptop_art_", laptop: "sheet" });
    const phone = ctx.el("phone", { x: 0, y: 0, w: 1920, h: 1080, kind: "instrument" });
    Loom.lesson.desk_set(ctx, phone.inner, { framing: "medium", only: ["phone"], prefix: "phone_art_" });

    // Maya is described by narration, so she reacts without speaking.
    maya.gesture("shrug", ctx.cue("ordinary reasons"), wrongAt - 0.12);
    maya.emotion("focus", wrongAt);
    maya.pose("idle", businessAt, { dur: 0.45 });
    maya.gesture("nod", businessAt + 0.25, businessAt + 0.95);

    // Paper thought bubbles occupy the open wall at left, stepping toward Maya without covering her face.
    const bubble = (name, x, y, w, h, words, t) => {
      // @form paper_thought_bubble: a paper thought held over the desk
      const E = ctx.el(name, { x, y, w, h, kind: "card", exit: "recede" });
      kit.rect(E.inner, 10, 10, w - 20, h - 20, { fill: "surface", r: 28 });
      kit.disc(E.inner, w - 2, h - 4, 13, { fill: "surface" });
      kit.disc(E.inner, w + 32, h + 28, 8, { fill: "surface" });
      kit.disc(E.inner, w + 54, h + 48, 5, { fill: "surface" });
      kit.text(E.inner, words, {
        role: "body", x: 34, y: 34, w: w - 68, h: h - 68,
        align: "center", valign: "middle", maxLines: 2, color: "ink"
      });
      m.pop(E, t);
      return E;
    };

    const bubbleWrong = bubble("bubble_wrong", 790, 154, 450, 174, "What if I'm wrong?", wrongAt);
    const bubbleCost = bubble("bubble_cost", 520, 378, 450, 174, "What will it cost me?", costAt);
    const bubbleBusiness = bubble("bubble_business", 940, 602, 420, 160, "Not my business", businessAt);
    const bubbles = [bubbleWrong, bubbleCost, bubbleBusiness];

    // Their hold loosens as Maya straightens, then the unkept thoughts leave before b04.
    Loom.drive((e) => {
      const opacity = 1 - 0.65 * e;
      bubbles.forEach((E) => { E.inner.style.opacity = opacity; });
    }, businessAt + 0.48, 0.36, "editorial");
    bubbles.forEach((E) => m.exit(E, ctx.speechEnd - 0.42, "recede"));
    m.exit(receiptCircle, ctx.speechEnd - 0.02, "recede");
  },
});
