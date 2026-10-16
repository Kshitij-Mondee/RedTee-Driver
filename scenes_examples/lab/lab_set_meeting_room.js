// @lab {"title": "A library set: the office meeting room (Claude Design, 2.5D lit) with content on its screen, a push and an overlay card", "styles": ["cinematic-dawn"], "dur": 10.0, "times": [0.6, 2.4, 4.2, 5.6, 7.4, 9.6]}
// D-152: the first drawn set from the library on the place camera. The set is loaded by its exact id; its screen slot
// carries real words that ride the far layer with the camera; the camera pushes to the screen and pulls back; an
// overlay card sits in screen space on a solid panel (the room is mid-tone, so words never sit on bare brick).
Loom.scene("lab_set_meeting_room", {
  build(ctx) {
    const { kit, m } = ctx;
    const R = Loom.place.set(ctx, "room", "office/meeting_room");
    if (!R) return;
    // the screen's content: drawn inside the slot (0..w, 0..h), on the screen's own dark face
    const S = R.slot("screen");
    const pad = 34;
    const Sc = ctx.el("screen_content", { x: 0, y: 0, w: S.w, h: S.h, kind: "text", parent: S.g });
    kit.text(Sc.inner, "Feedback that lands", { role: "lead", x: pad, y: pad, w: S.w - 2 * pad, h: 60, weight: 700, color: "onAccent", align: "left", maxLines: 1 });
    ["What happened", "What it caused", "One step"].forEach((line, i) => {
      const L = ctx.el(`screen_line_${i}`, { x: pad, y: 120 + i * 62, w: S.w - 2 * pad, h: 52, kind: "text", parent: S.g });
      kit.rect(L.inner, 0, 14, 10, 24, { fill: "accent", r: 2, shadow: false });
      kit.text(L.inner, line, { role: "body", x: 26, y: 0, w: S.w - 2 * pad - 26, h: 52, color: "onAccent", align: "left", valign: "middle", maxLines: 1 });
      m.reveal(L, 1.6 + i * 0.45, { dy: 10 });
    });
    m.reveal(Sc, 1.0, { dy: 0 });
    // the camera: a slow push to the screen, a hold, then back to the room
    Loom.cam.push(R, { to: R.anchors.screen_centre, scale: 1.7, t0: 3.4, t1: 5.6 });
    Loom.cam.pull(R, { t0: 7.6, t1: 9.4 });
    // an overlay card in screen space, on a solid panel, over the room
    const card = ctx.el("card", { x: 1200, y: 760, w: 640, h: 220, kind: "card" });
    kit.rect(card.inner, 0, 0, 640, 220, { fill: "surface", r: 18 });
    kit.text(card.inner, "Say what happened. Say what it caused. Offer one step.", { role: "lead", x: 36, y: 28, w: 568, h: 164, align: "left", valign: "middle", maxLines: 3 });
    m.reveal(card, 6.0, { dy: 16 });
  },
});
