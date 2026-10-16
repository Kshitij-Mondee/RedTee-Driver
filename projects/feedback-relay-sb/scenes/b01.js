// @design doorway_nod_then_same_slide: a warm nod, a week flips, the same slide is read again
// Treatments: (1) static two-shot with signalling; (2) peep dialogue then title card; (3) chosen: one room, change over time.
Loom.scene("b01", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit;
  const R = ctx.el("meeting_room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  const room = Loom.lesson.meeting_room(ctx, R.inner, { slide: "text_wall", audience: "heads_up", calendarState: "this_week" });
  m.reveal(R, ctx.start + 0.1);

  const T = ctx.el("Theo", { x: 130, y: 570, w: 400, h: 400, kind: "character", exit: "recede", parent: room.theoSlot });
  kit.peep(T.inner, "man", "neutral", { x: 200, y: 0, size: 440, flip: false, cloth: "cloth2", skin: 2 });

  const maya = ctx.character("Maya", "maya", { x: room.anchors.maya.x, y: room.anchors.maya.y, scale: 0.3, skin: 0, top: "cloth", parent: room.mayaSlot, pose: "idle" });

  const B = ctx.el("natural_bubble", { x: 480, y: 380, w: 520, h: 200, kind: "bubble", exit: "shrink" });
  const bub = Loom.lesson.natural_bubble(ctx, B.inner, { state: "spoken" });
  const tb = ctx.cue("you're a natural presenter");
  m.pop(B, tb);
  const tn = ctx.cue("She nods, warm and grateful");
  maya.emotion("happy", tn);
  maya.gesture("nod", tn, tn + 1.4);
  Loom.set(B.outer, { opacity: 0 }, tn + 0.9);

  const pb = room.calendar.pageB;
  pb.setAttribute("opacity", 0);
  const tw = ctx.cue("Next week");
  Loom.set(pb, { opacity: 1 }, tw - 0.01);
  room.calendar.flip(tw);
  const tr = ctx.cue("she reads slides aloud again");
  maya.emotion("neutral", tr);
  maya.pose("explain", tr, { dur: 0.4 });
  maya.look(1, -0.3, tr);
  room.setState("phones_down", tr + 0.3);
} });
