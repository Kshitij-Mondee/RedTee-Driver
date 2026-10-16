// @lab {"title": "Story set: a room that fills the frame, outlined people, the number on a prop, a black turn card", "styles": ["story-cartoon", "corporate-clean"], "dur": 7.0, "times": [0.6, 1.6, 2.6, 3.6, 4.8, 6.4], "words": [{"w": "Every", "s": 1.0, "e": 1.3}, {"w": "refund", "s": 1.32, "e": 1.7}, {"w": "over", "s": 1.72, "e": 1.9}, {"w": "five", "s": 1.92, "e": 2.15}, {"w": "hundred", "s": 2.17, "e": 2.5}, {"w": "gets", "s": 2.52, "e": 2.7}, {"w": "a", "s": 2.72, "e": 2.78}, {"w": "second", "s": 2.8, "e": 3.1}, {"w": "check", "s": 3.12, "e": 3.5}]}
// A lab scene for the story-cartoon register (docs/research/2026-10-01-visual-study.md): the beat happens in a
// PLACE. The set fills the frame; the rule is written on a sign in the room, not floated beside it; the cast is
// two outlined people; the turn lands on a black card. Absolute times.
Loom.scene("lab_story_set", {
  build(ctx) {
    const { m } = ctx;
    const room = ctx.scenery("room", "set", { window: true, windowX: 110, shelf: true, shelfX: 1240, floorFill: "shadow" });
    Loom.scenery.desk(room.E.inner, 1300, room.floorY + 40, 560, { monitor: true });
    // the number lives on a prop: a notice pinned to the wall
    const notice = ctx.el("notice", { x: 640, y: 120, w: 500, h: 230, kind: "card" });
    Loom.scenery.sign(notice.inner, 0, 0, 500, 230, "REFUNDS OVER $500: SECOND CHECK", { fill: "surface", role: "lead" });
    m.stamp(notice, 1.9);
    // the cast: Pip by the desk explains, Tess walks in and points at the notice
    const pip = ctx.character("pip", "pip", { x: 1130, y: 1170, scale: 0.98, skin: 1, top: "accent3" });
    pip.pose("explain", 0.9, { dur: 0.4 }); pip.talk(1.0, 3.5); pip.gesture("beat", 1.1, 3.0);
    const tess = ctx.character("tess", "tess", { x: -160, y: 1190, scale: 1.02, skin: 2, top: "accent" });
    tess.walk(0.2, 1.6, 620, 1.5); tess.pose("point", 2.4, { dur: 0.4 }); tess.look(1, -0.6, 2.4); tess.emotion("focused", 2.4);
    pip.emotion("happy", 3.6); pip.pose("present", 3.6, { dur: 0.4 });
    // the turn: one short line on the darkest ground
    ctx.narrationCard("turn", "But on Friday, nobody checked.", 5.0);
  },
});
