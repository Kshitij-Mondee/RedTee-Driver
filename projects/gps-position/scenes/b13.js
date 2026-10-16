// @design struck_direction: a straight length is drawn and labelled, then the direction offered beside it is crossed out
// Treatments considered: (1) static composition, line + tag + crossed arrow all shown (rejected: the strike must follow the words);
// (2) arrow slides along the line (rejected: implies direction is known); (3) line draws, tag lands, arrow pops beside the point, strike crosses it, arrow fades (chosen).
Loom.scene("b13", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var ground = ctx.held("ground"), phonePt = ctx.held("phone_pt"), sats = ctx.held("sats");

  var tLine = ctx.cue("That gives a distance");
  var tDir = ctx.cue("Not a direction");
  var tOnly = ctx.cue("only a distance");

  var A = [430, 230], P = [960, 812];

  // ---- range line A to the phone point, tag distance at its middle ----------------------------------------------
  // @form range_line: a straight length from satellite to phone
  var R = ctx.el("range_line", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var rc = Loom.lesson.range_circles(ctx, R.inner, { point: P, show: [] });
  rc.setState("range_line", tLine, { id: "A", dur: 0.9 });
  var mid = { x: (A[0] + P[0]) / 2, y: (A[1] + P[1]) / 2 };
  try { var rm = rc.anchors && rc.anchors.rangeMid; var mm = typeof rm === "function" ? rm("A") : rm; if (mm && mm.x !== undefined) mid = mm; } catch (e) {}

  // @form distance_tag: a label sitting on the middle of the line
  var tagW = 200, tagH = 60;
  var T = ctx.el("distance_tag", { x: mid.x - tagW / 2, y: mid.y - tagH / 2, w: tagW, h: tagH, kind: "token", exit: "recede" });
  var tg = Loom.svg("g", { opacity: 0 }, T.inner);
  kit.pill(tg, 0, 0, tagW, tagH, { fill: "surface", r: 30, shadow: true, stroke: "accent" });
  kit.text(tg, "distance", { role: "label", x: 0, y: 0, w: tagW, h: tagH, align: "center", valign: "middle", color: "ink", weight: 700 });
  m.pop(T, tLine + 0.75, { dur: 0.4 });
  Loom.tween(tg, { opacity: 0 }, { opacity: 1 }, tLine + 0.75, { dur: 0.3 });

  // ---- direction arrow offered beside the point, along the line's own direction ---------------------------------
  var ux = (A[0] - P[0]), uy = (A[1] - P[1]), L = Math.hypot(ux, uy); ux /= L; uy /= L;
  var nx = -uy, ny = ux;                          // normal to the line (pointing right / up)
  if (nx < 0) { nx = -nx; ny = -ny; }
  var sx = P[0] + nx * 95, sy = P[1] + ny * 95;   // start beside the point
  var ex = sx + ux * 230, ey = sy + uy * 230;
  // @form dir_arrow: a direction arrow that is offered, then struck out
  var D = ctx.el("dir_arrow", { x: 760, y: 560, w: 440, h: 300, kind: "icon", exit: "recede" });
  var dg = Loom.svg("g", { transform: "translate(" + (-760) + " " + (-560) + ")" }, D.inner);
  var arr = kit.arrow(dg, sx, sy, ex, ey, { stroke: "ink" });
  try { arr.path.setAttribute("stroke-width", 8); } catch (e) {}
  m.draw(arr, tDir + 0.05, { dur: 0.5 });
  // strike across the middle of the arrow, neg
  var cx = (sx + ex) / 2, cy = (sy + ey) / 2;
  var strike = kit.line(dg, cx - nx * 62, cy - ny * 62, cx + nx * 62, cy + ny * 62, { stroke: "neg", sw: 10 });
  strike.setAttribute("stroke-linecap", "round");
  m.draw(strike, tOnly + 0.05, { dur: 0.4 });
  m.exit(D, ctx.speechEnd - 0.7, "recede");
} });
