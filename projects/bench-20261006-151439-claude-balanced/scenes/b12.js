// @design camera_feed_record: a corner camera whose viewfinder shows only who spoke, what, when and to whom
/* Treatments: (A) static frame with captions (rejected: no push), (B) camera zoom morph (no primitive),
 * (C) CHOSEN: black card clears, camera pops in corner, viewfinder frame grows in, captions print on their words. */
Loom.scene("b12", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const tCam = ctx.cue("a camera");
    const tSaid = ctx.cue("what was said");
    const tWhen = ctx.cue("when");
    const tWhom = ctx.cue("and to whom");

    // black narration card, clears as the camera appears
    const card = ctx.el("black_narration_card", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    kit.rect(card.inner, 0, 0, 1920, 1080, { fill: "ink", r: 0, shadow: false });
    kit.text(card.inner, "Picture a camera in that meeting room.", { role: "title", x: 260, y: 380, w: 1400, h: 240, maxLines: 2, align: "center", valign: "middle", color: "surface" });
    Loom.tween(card.inner, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: Loom.ease.move }, tCam + 0.9, { kind: "travel", beat: ctx.beat.id, content: true });

    // viewfinder frame (the accent)
    const frame = ctx.el("viewfinder_frame", { x: 200, y: 190, w: 1520, h: 690, kind: "scenery", exit: "recede" });
    kit.rect(frame.inner, 0, 0, 1520, 690, { fill: "ink", r: 14, shadow: false, stroke: "accent" });
    // @form speaker_listener: two people in the feed
    kit.peep(frame.inner, "woman", "explaining", { x: 120, y: 90, size: 330 });
    kit.peep(frame.inner, "man", "neutral", { x: 1000, y: 90, size: 330, flip: true });
    m.reveal(frame, tCam + 1.0, { dy: 0 });

    // corner camera
    const cam = ctx.el("corner_camera", { x: 1500, y: 40, w: 300, h: 140, kind: "icon", exit: "recede" });
    kit.rect(cam.inner, 0, 20, 240, 100, { fill: "surface2", r: 16 });
    kit.disc(cam.inner, 255, 70, 40, { fill: "accent" });
    kit.icon(cam.inner, "video", { x: 120, y: 70, size: 64, color: "ink" });
    m.pop(cam, tCam + 0.6);

    // what was said
    const said = ctx.el("caption_what_was_said", { x: 300, y: 740, w: 800, h: 90, kind: "card", exit: "recede" });
    kit.pill(said.inner, 0, 0, 800, 90, { fill: "surface" });
    kit.text(said.inner, "what was said", { role: "label", x: 30, y: 0, w: 740, h: 90, maxLines: 1, valign: "middle", color: "ink" });
    m.reveal(said, tSaid, { dy: 0 });

    // when
    const when = ctx.el("caption_when", { x: 1380, y: 225, w: 260, h: 80, kind: "stamp", exit: "recede" });
    kit.pill(when.inner, 0, 0, 260, 80, { fill: "accent" });
    kit.text(when.inner, "when", { role: "label", x: 0, y: 0, w: 260, h: 80, maxLines: 1, align: "center", valign: "middle", weight: 800, color: S.pickTokenOn("accent") });
    m.pop(when, tWhen);

    // to whom
    const whom = ctx.el("caption_to_whom", { x: 640, y: 420, w: 640, h: 200, kind: "connector", exit: "recede" });
    const a = kit.arrow(whom.inner, 20, 150, 620, 150, { stroke: "surface" });
    kit.text(whom.inner, "to whom", { role: "label", x: 120, y: 20, w: 400, h: 70, maxLines: 1, align: "center", valign: "middle", color: "surface" });
    m.draw(a, tWhom);
  },
});
