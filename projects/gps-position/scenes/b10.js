// @design pulse_in_flight_with_speed_tag: a wavefront keeps travelling a steady line, gold streaks behind it, its speed written beside it
// Treatments: (1) static composition: pulse mid-route with a speed card (rejected: speed must be read off the moving thing);
// (2) pulse speeds up with a number counting beside it (rejected: the count is not in the script); (3) one steady, rigid travel, streaks behind and the tag riding beside it (chosen).
Loom.scene("b10", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var ground = ctx.held("ground"), pt = ctx.held("phone_pt"), sats = ctx.held("sats");
  var pulse = ctx.held("pulse"), stamp = ctx.held("stamp");

  var tRadio = ctx.cue("It's a radio wave");
  var tSpeed = ctx.cue("about 300,000 kilometres a second");

  // the route b09 started: from satellite A's dish to just above the phone point; b09 left the pulse a third of the way (F = 0.34)
  var A = { x: 430, y: 230 };
  var P0 = { x: A.x, y: A.y + 100 * 170 / 360 }, PT = { x: 960, y: 812 - 22 };
  var dx = PT.x - P0.x, dy = PT.y - P0.y, L = Math.hypot(dx, dy);
  var u = { x: dx / L, y: dy / L }, n = { x: u.y, y: -u.x };            // n: up and to the right of the travel
  var F0 = 0.34, F1 = 0.67;
  var W = { x: P0.x + dx * F0, y: P0.y + dy * F0 };                     // the wavefront where b09 left it
  var mv = { x: dx * (F1 - F0), y: dy * (F1 - F0) };                    // how far this beat carries it
  var dur = ctx.end - ctx.start;

  // ---- the held pulse and its stamp chip travel on, one steady linear run to the join -------------------------------
  [pulse, stamp].forEach(function (E) { m.travel(E, ctx.start, { x: dx * F1, y: dy * F1, dur: dur, ease: "linear" }); });
  var go = function (E) { m.travel(E, ctx.start, { x: mv.x, y: mv.y, dur: dur, ease: "linear" }); };

  // ---- gold streaks behind the wavefront ---------------------------------------------------------------------
  // @form speed_streaks: three gold lines trailing the wavefront
  var S = ctx.el("streaks", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var defs = Loom.svg("defs", {}, S.inner);
  [[-20, 150], [0, 230], [20, 150]].forEach(function (s, i) {
    var x2 = W.x - u.x * 26 + n.x * s[0], y2 = W.y - u.y * 26 + n.y * s[0];
    var x1 = x2 - u.x * s[1], y1 = y2 - u.y * s[1];
    var gid = "b10sk" + i, gr = Loom.svg("linearGradient", { id: gid, gradientUnits: "userSpaceOnUse", x1: x1, y1: y1, x2: x2, y2: y2 }, defs);
    Loom.svg("stop", { offset: 0, "stop-color": ctx.c("accent2"), "stop-opacity": 0 }, gr);
    Loom.svg("stop", { offset: 1, "stop-color": ctx.c("accent2"), "stop-opacity": 0.95 }, gr);
    Loom.svg("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: "url(#" + gid + ")", "stroke-width": 6, "stroke-linecap": "round" }, S.inner);
  });
  m.reveal(S, tRadio, { dur: 0.5 });
  go(S);

  // ---- the speed tag rides beside the pulse ----------------------------------------------------------------------
  // @form speed_tag: the speed written on the moving thing
  var T = ctx.el("tag_speed", { x: 0, y: 0, w: 1920, h: 1080, kind: "text", exit: "recede" });
  var tx = W.x + 84, ty = W.y - 96, tw = 380, th = 48;
  Loom.svg("line", { x1: W.x + n.x * 34, y1: W.y + n.y * 34, x2: tx - 8, y2: ty + th / 2 + 6, stroke: ctx.c("accent"), "stroke-width": 3, "stroke-linecap": "round" }, T.inner);
  kit.text(T.inner, "about 300,000 km/s", { role: "label", x: tx, y: ty, w: tw, h: th, align: "left", valign: "middle", color: "accent", weight: 800 });
  m.pop(T, tSpeed, {});
  go(T);
} });
