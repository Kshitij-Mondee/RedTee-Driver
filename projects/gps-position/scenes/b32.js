// @design clocks_beside_snapped_diagram: a second fix joins the first in the same picture, two clocks tick in step beside a quiet diagram
// Treatments: (1) static card with both clocks (rejected: arrival should follow the words); (2) clocks pop on "relativity" then tag lands on "left the ground" (chosen); (3) clocks drawn onto the satellite itself (rejected: too small).
Loom.scene("b32", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var names = ["ground", "phone_pt", "sats", "circles", "sat_d", "circle_d", "snap_pt"];
  names.forEach(function (n) { ctx.held(n); });
  var tRel = ctx.cue("set for relativity");
  var tGround = ctx.cue("before they ever left the ground");


  // ---- clock_pair: panel upper right-centre, orbit clock above ground clock, tag below
  var PX = 1160, PY = 280, PW = 300, PH = 540;
  var E = ctx.el("clock_pair", { x: PX, y: PY, w: PW, h: PH, kind: "instrument", exit: "recede" });
  var inner = Loom.svg("g", {}, E.inner);
  Loom.svg("rect", { x: 0, y: 12, width: PW, height: PH - 12, rx: 26, fill: ctx.c("shadow"), opacity: 0.4 }, inner);
  Loom.svg("rect", { x: 0, y: 0, width: PW, height: PH - 12, rx: 26, fill: ctx.c("surface2"), stroke: ctx.c("accent"), "stroke-width": 4 }, inner);
  var CS = 150, cx = PW / 2;
  // @form clock_face: orbit clock on the satellite side, top
  var gTop = Loom.svg("g", { transform: "translate(" + (cx - CS / 2) + " 36)" }, inner);
  var cTop = Loom.lesson.clock_face(ctx, gTop, { size: CS, finish: "atomic", start: 0 });
  // @form clock_face: ground clock, bottom
  var gBot = Loom.svg("g", { transform: "translate(" + (cx - CS / 2) + " 250)" }, inner);
  var cBot = Loom.lesson.clock_face(ctx, gBot, { size: CS, finish: "atomic", start: 0 });
  // the line they share
  var ln = Loom.svg("line", { x1: cx, y1: 36 + CS + 10, x2: cx, y2: 250 - 10, stroke: ctx.c("line"), "stroke-width": 4, "stroke-dasharray": "6 10", opacity: 0.8 }, inner);
  cTop.run(ctx.start, ctx.end); cBot.run(ctx.start, ctx.end);
  cTop.setState("in_step", tRel + 0.5); cBot.setState("in_step", tRel + 0.5);
  // tag
  var fit = kit.fit("clocks corrected", { role: "label", w: PW - 40, h: 60, maxLines: 1, weight: 700 });
  var tagG = Loom.svg("g", { opacity: 0 }, inner);
  var TW = PW - 40, TH = 72, TX = 20, TY = 430;
  kit.pill(tagG, TX, TY, TW, TH, { fill: "accent", r: 36 });
  kit.text(tagG, "clocks corrected", { role: "label", x: TX, y: TY, w: TW, h: TH, align: "center", valign: "middle", color: "onAccent", weight: 700 });
  m.pop(E, tRel, { dur: 0.55 });
  m.settle(tagG, tGround, { dur: 0.5 });
  Loom.tween(tagG, { opacity: 0 }, { opacity: 1 }, tGround, { dur: 0.4 });
} });
