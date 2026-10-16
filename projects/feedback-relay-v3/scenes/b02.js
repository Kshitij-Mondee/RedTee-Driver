// @design promise_on_board_then_open_question: the held room gets two lettered words on the board, then an empty bubble that asks the viewer
Loom.scene("b02", { build(ctx, props) {
  const kit = ctx.kit;
  // treatments: (1) static board + bubble, (2) camera push to board, (3) chosen: held room, two arrivals on words
  const back = ctx.held("meeting_room_back");
  const glow = ctx.held("dev_glow");
  const mgr = ctx.held("manager");
  const dev = ctx.held("dev");
  const front = ctx.held("meeting_room_front");
  const cloud = ctx.held("fuzzy_cloud");

  const tMeet = ctx.cue("Same meeting");
  const tRem = ctx.cue("same remark");
  const tAct = ctx.cue("Dev can act on it");
  const tThink = ctx.cue("Think of your last feedback");
  const tDiff = ctx.cue("anything different");

  // board lettering, wiped on
  const bl = ctx.el("board_lettering", { x: 718, y: 150, w: 484, h: 240, kind: "text", exit: "wipe" });
  const mk = function (word, y, id, t) {
    const cp = Loom.svg("clipPath", { id: id }, bl.inner);
    const r = Loom.svg("rect", { x: 0, y: y - 6, width: 0.01, height: 96 }, cp);
    const g = Loom.svg("g", { "clip-path": "url(#" + id + ")" }, bl.inner);
    // @form board_word: marker lettering on the whiteboard
    kit.text(g, word, { role: "lead", size: 46, x: 0, y: y, w: 484, h: 84, align: "left", valign: "middle", color: "ink", weight: 400, maxLines: 1 });
    Loom.drive(function (e) { r.setAttribute("width", Math.max(0.01, 484 * e).toFixed(1)); }, t, 0.6, "move");
  };
  mk("same meeting", 20, "b02_c1", tMeet);
  mk("same remark", 130, "b02_c2", tRem);

  // Dev nods (gesture only)
  Loom.drive(function (e, raw) {
    dev.inner.setAttribute("transform", "translate(0 " + (14 * Math.sin(raw * Math.PI)).toFixed(2) + ")");
  }, tAct, 0.5, "linear");

  // viewer bubble
  const bub = ctx.el("viewer_bubble", { x: 760, y: 470, w: 400, h: 210, kind: "bubble", exit: "recede" });
  const bg = Loom.svg("g", { opacity: 0 }, bub.inner);
  // @form viewer_bubble: empty speech bubble asking the viewer
  Loom.svg("path", { d: "M60 20 H340 Q380 20 380 60 V130 Q380 170 340 170 H190 L150 205 L158 170 H60 Q20 170 20 130 V60 Q20 20 60 20 Z", fill: ctx.c("surface"), stroke: ctx.c("accent"), "stroke-width": 6, "stroke-linejoin": "round" }, bg);
  Loom.drive(function (e, raw) {
    bg.style.opacity = Math.min(1, raw * 2.5).toFixed(2);
    bg.setAttribute("transform", "translate(0 " + (40 * (1 - e)).toFixed(1) + ")");
  }, tThink, 0.8, "move");
  Loom.drive(function (e, raw) {
    const k = 1 + 0.04 * Math.sin(raw * Math.PI);
    if (raw > 0) bub.inner.setAttribute("transform", "translate(200 105) scale(" + k.toFixed(3) + ") translate(-200 -105)");
  }, tDiff, 1.2, "linear");
} });
