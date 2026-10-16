// @design push_to_one_emitter: the camera pushes in from the whole constellation to one satellite that swells to a close-up; its clock ticks, then signal rings pulse from it and every other satellite
// Treatments considered: (1) static close-up with a tag and rings (rejected: the satellite must grow out of the ring it sits on); (2) cut to a separate satellite scene (rejected: breaks the station); (3) one camera push over the held scene, the satellite swelling in place, a tagged clock, then pulses from all (chosen).
Loom.scene("b06", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var earth = ctx.held("earth"), orbs = ctx.held("orbits"), fill = ctx.held("fill");
  ctx.held("earth_point");

  var tClock = ctx.cue("atomic clocks");
  var tBroad = ctx.cue("each one is broadcasting");

  // ---- geometry: the swarm froze at the end of the previous beat; its screen positions were measured (fixed) ----
  var LIST = [[484, 718], [526, 418], [1436, 162], [1394, 462], [1606, 581], [1303, 838], [314, 299], [617, 42], [400, 603],
    [1520, 277], [531, 1069], [1167, 361], [753, 519], [156, 141], [1367, 72], [1507, 215], [1758, 736], [404, 659], [546, 803]];
  var HERO = 1;
  var hp = { x: LIST[HERO][0], y: LIST[HERO][1] };
  var FALL = hp;

  // ---- camera: one push, the same rect on every held layer and on the new ones --------------------------------
  var Z = 1.5, SCR = { x: 430, y: 440 };
  var rx = FALL.x - SCR.x / Z, ry = FALL.y - SCR.y / Z;
  var tPush = ctx.start + 0.05, dPush = 1.45;
  var frame = function (E) { m.travel(E, tPush, { x: (Z - 1) * E.x - Z * rx, y: (Z - 1) * E.y - Z * ry, scale: Z, dur: dPush }); };

  var S0 = 0.134, S1 = 1.8 / Z;
  var sm = function (v) { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
  var sOf = function (t) { return S0 + (S1 - S0) * sm((t - tPush) / dPush); };

  // ---- broadcast rings (drawn first so the hero sits on top) --------------------------------------------------
  // @form signal_rings: gold rings pulsing out from each satellite
  var B = ctx.el("broadcast", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var bg = Loom.svg("g", {}, B.inner);
  var ringSets = [];
  for (var q = 0; q < LIST.length; q++) {
    var rs = [];
    for (var j = 0; j < 2; j++) rs.push(Loom.svg("circle", { cx: LIST[q][0], cy: LIST[q][1], r: 1, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 3, opacity: 0 }, bg));
    ringSets.push(rs);
  }
  var heroRings = [0, 1, 2].map(function () { return Loom.svg("circle", { cx: 0, cy: 0, r: 1, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 4, opacity: 0 }, bg); });

  // ---- the hero satellite: the kit part, swelling in place ---------------------------------------------------
  // @form gps_satellite: the close-up satellite
  var H = ctx.el("hero_sat", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var hg = Loom.svg("g", {}, H.inner);
  var sat = Loom.lesson.gps_satellite(ctx, hg, {});

  // the clock on its body, its own element so b07 can hold it
  // @form clock_face: the atomic clock on the body
  var C = ctx.el("clock", { x: 0, y: 0, w: 1920, h: 1080, kind: "instrument", exit: "recede" });
  var cg = Loom.svg("g", {}, C.inner);
  var cloc = Loom.svg("g", { transform: "translate(146 72)" }, cg);
  var cacc = Loom.svg("circle", { cx: 34, cy: 34, r: 40, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, opacity: 0 }, cloc);
  var face = Loom.lesson.clock_face(ctx, Loom.svg("g", { transform: "translate(2 2)" }, cloc), { size: 64, finish: "atomic" });
  face.setState("steady", ctx.start, { dur: 0.01 });
  face.run(ctx.start, ctx.end);
  m.reveal(C, tPush + 0.5, { dur: 0.45 });

  [orbs, earth, fill].forEach(frame);
  frame(B); frame(H); frame(C);

  // ---- the tag: screen space once the push has settled, leading to the clock -----------------------------------
  var tTag = Math.max(tClock + 0.2, tPush + dPush - 0.1);
  var cx = SCR.x, cy = SCR.y - 4 * 1.8;
  var tag = Loom.treat.label(ctx, "clock_tag", { x: cx - 150, y: 130, text: "atomic clock", to: [cx, cy - 74], tone: "accent", role: "lead", t: tTag });
  var tagE = tag && (tag.E || tag.el || tag);
  try { if (tagE && tagE.inner) m.exit(tagE, ctx.end - 0.6, "recede"); } catch (err) {}

  // ---- per-frame: hero swells; rings pulse ------------------------------------------------------------------------
  var lineOld = null;
  try { lineOld = fill.inner.firstChild.childNodes[1]; } catch (err) { lineOld = null; }
  var P1 = 1.7, P2 = 1.5;
  var span = ctx.end - ctx.start;
  Loom.drive(function (e) {
    var t = ctx.start + e * span, s = sOf(t);
    if (lineOld) lineOld.setAttribute("opacity", (1 - sm((t - tPush) / 0.6)).toFixed(3));
    var tf = "translate(" + hp.x.toFixed(2) + " " + hp.y.toFixed(2) + ") scale(" + s.toFixed(4) + ") translate(-180 -110)";
    hg.setAttribute("transform", tf); cg.setAttribute("transform", tf);
    var a = sm((t - tClock) / 0.4) * (1 - sm((t - tClock - 1.4) / 0.6) * 0.55);
    cacc.setAttribute("opacity", a.toFixed(3));
    ringSets.forEach(function (rs, idx) {
      for (var j = 0; j < rs.length; j++) {
        var d = (t - tBroad - (idx % 8) * 0.09);
        if (idx === HERO || d < 0) { rs[j].setAttribute("opacity", 0); continue; }
        var ph = ((d / P2) + j * 0.5) % 1;
        rs[j].setAttribute("r", (10 + 80 * ph).toFixed(1));
        rs[j].setAttribute("opacity", (0.85 * (1 - ph)).toFixed(3));
      }
    });
    heroRings.forEach(function (c, j) {
      var d = t - tBroad;
      if (d < 0) { c.setAttribute("opacity", 0); return; }
      var ph = ((d / P1) + j / 3) % 1;
      c.setAttribute("cx", hp.x.toFixed(1)); c.setAttribute("cy", (hp.y + 82 * s).toFixed(1));
      c.setAttribute("r", (20 * s + 220 * s * ph).toFixed(1));
      c.setAttribute("opacity", (0.9 * (1 - ph)).toFixed(3));
    });
  }, ctx.start, span, "linear");
} });
