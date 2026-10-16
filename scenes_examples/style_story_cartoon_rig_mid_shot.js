// @design rig_mid_shot_number_on_notice: the running character in her own room turns to the wall notice that carries the rule's number
// @lab {"title": "story-cartoon mid shot: Maya (designed rig) in her room presents the notice that carries the number", "styles": ["story-cartoon"], "dur": 7.0, "times": [0.4, 1.5, 2.6, 3.6, 4.8, 6.4], "words": [{"w": "Maya", "s": 0.5, "e": 0.85}, {"w": "checks", "s": 0.88, "e": 1.2}, {"w": "the", "s": 1.22, "e": 1.3}, {"w": "notice.", "s": 1.32, "e": 1.8}, {"w": "Any", "s": 2.2, "e": 2.4}, {"w": "refund", "s": 2.42, "e": 2.8}, {"w": "over", "s": 2.82, "e": 3.0}, {"w": "five", "s": 3.02, "e": 3.3}, {"w": "hundred", "s": 3.32, "e": 3.7}, {"w": "needs", "s": 3.72, "e": 3.95}, {"w": "a", "s": 3.97, "e": 4.02}, {"w": "second", "s": 4.04, "e": 4.4}, {"w": "check.", "s": 4.42, "e": 4.9}]}
/* Style example for story-cartoon (docs/styles/guides/story-cartoon.md, recipe R1). Hypothetical content.
 * One person, a designed rig placed by id ("maya", assets/rigs/maya.json, a Claude Design delivery), in a medium
 * shot inside a place:
 *  - shot size: a medium shot; the frame cuts her upper thigh 105 px below the hip joint (feet below the frame),
 *    never at a joint (knee, hip, neck); her head top sits inside the safe area and her face is about 160 px brow to
 *    chin (189 rig units in assets/rigs/maya.json x scale 0.85; about 150 px on the round 2 no-browser preview);
 *  - she stands on the right third and turns to the notice on the left third: the picture reads left to right,
 *    person then rule, and her open hand points the viewer at the number;
 *  - the notice is a prop on the wall (kit-drawn, so it carries the pack's toon outline); its number is the
 *    largest type in the frame and the ONE accent; the words around it are ink;
 *  - the set uses no accent anywhere else (no monitor in accent, no coloured books), so the number wins;
 *  - no tangents: the window, the desk and the notice stay clear of her outline, and the floor line sits 73 px
 *    below her hip joint (the first version put the skirting at y 954 to 972, along her sweater hem);
 *  - she acts on the words: a head tilt on "checks", present on "notice", focus on the number, a nod on "second
 *    check". Her mouth stays shut: the narration describes her, it is not her line (mouths move only on a
 *    character's own words, guide s8).
 * Treatments considered: (A) a bust in a disc beside a rule card (the avatar template: rejected, two thirds empty
 * frame in the bench videos); (B) the rule on a floating card beside her (rejected: the number would float);
 * (C) CHOSEN: her room, the notice on its wall, her hand offering it.
 */
Loom.scene("style_story_cartoon_rig_mid_shot", {
  build(ctx) {
    const { kit, m } = ctx;

    // 1. the place: her room, the floor line low. Her hip joint is at y 975 (feet at 1710 minus 1905 x 0.85 = top 91;
    //    pelvis pivot 1040 x 0.85 + 91), so floor 0.9 (y 972) ran through her hips: a tangent. Floor 0.97 puts the line
    //    at y 1048, in the caption band, 73 px below the hips (computed from the rig's pivots; check on the Chrome strip)
    const room = ctx.scenery("room", "set", { window: true, windowX: 1530, floor: 0.97 });
    Loom.scenery.desk(room.E.inner, 1440, room.floorY + 40, 480, {});   // a desk behind her, clear of her outline
    m.reveal(room.E, ctx.start + 0.05, { dy: 0 });

    // 2. the notice that carries the number: label above, the number big, the condition below
    const notice = ctx.el("notice", { x: 150, y: 150, w: 640, h: 460, kind: "card", exit: "recede" });
    kit.rect(notice.inner, 0, 0, 640, 460, { fill: "surface", r: 8 });
    kit.disc(notice.inner, 320, 22, 12, { fill: "muted" });   // the pin
    kit.text(notice.inner, "Refunds over", { role: "lead", x: 40, y: 50, w: 560, h: 70, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    const num = ctx.el("notice_number", { x: 40, y: 130, w: 560, h: 190, kind: "value", parent: notice.inner, exit: "recede" });
    kit.text(num.inner, "$500", { role: "display", x: 0, y: 0, w: 560, h: 190, maxLines: 1, align: "center", valign: "middle", color: "accent" });
    const cond = ctx.el("notice_rule", { x: 40, y: 330, w: 560, h: 90, kind: "text", parent: notice.inner, exit: "recede" });
    kit.text(cond.inner, "need a second check", { role: "lead", x: 0, y: 0, w: 560, h: 90, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    m.drop(notice, Math.max(ctx.start + 0.05, ctx.cue("the notice") - 0.2));   // never before the beat (bad_time)
    m.stamp(num, ctx.cue("five hundred"));
    m.reveal(cond, ctx.cue("second check"), { dy: 10 });

    // 3. the person: a designed rig by id (never figures from primitives). Feet at y 1710, far below the frame: the
    //    frame cuts her mid-thigh, and her face is about 160 px brow to chin, big enough for the expression to read
    // y 1665: the frame cuts mid-thigh, more than 80 px below the hip (guide s13 item 8; at 1710 it cut just under the hip, A4 proof)
    const maya = ctx.character("maya", "maya", { x: 1230, y: 1665, scale: 0.85, pose: "idle" });
    maya.gesture("tilt", ctx.cue("Maya checks"), ctx.cue("the notice") + 0.4);   // she reads; no talk: it is not her line
    maya.pose("present", ctx.cue("the notice"), { dur: 0.6 });
    maya.hold("hand_r", "palm_up_offer", ctx.cue("the notice"), ctx.cue("second check") + 0.6);
    maya.emotion("focus", ctx.cue("five hundred"));
    maya.gesture("nod", ctx.cue("second check"), ctx.cue("second check") + 1.0);
    maya.emotion("smile", ctx.cue("second check") + 0.4);
  },
});
