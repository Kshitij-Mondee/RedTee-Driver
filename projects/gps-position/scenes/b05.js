// @design numbers_on_things: the figures sit as small pills on the swarm, the height line and the loop they measure
// Treatments considered: (1) static composition, three tags at once (rejected: numbers must arrive with the words);
// (2) card list at the side (rejected: the numbers must sit on what they measure); (3) swarm travels, tags land on swarm, radius line and period arc (chosen).
Loom.scene("b05", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var hOrb = ctx.held("orbits"), hSats = ctx.held("sats"), hEarth = ctx.held("earth"), hPt = ctx.held("earth_point");

  var pos = hOrb.__pos || null, sc = pos ? pos.s : 1;
  var k = sc * hOrb.w / 1600;
  var bx = hOrb.x + (pos ? pos.x : 0), by = hOrb.y + (pos ? pos.y : 0);

  var tAbout = ctx.cue("About 24 GPS satellites");
  var tDesign = ctx.cue("by design");
  var tRad = ctx.cue("Each about 20,200");
  var tHeight = ctx.cue("kilometres up");
  var tPer = ctx.cue("circling every 12 hours");
  var span = ctx.end - ctx.start;

  m.exit(hSats, ctx.start + 0.05, "recede");

  // @form orbit_rings: the swarm travelling its rings, radius line and period arc
  var F = ctx.el("fill", { x: bx, y: by, w: 1600 * k, h: 1000 * k, kind: "scenery", exit: "recede" });
  var fg = Loom.svg("g", { transform: "scale(" + k + ")" }, F.inner);
  var rings = Loom.lesson.orbit_rings(ctx, fg, { layer: "all", satSize: 34, omega: 0.18 });
  rings.setState("filled", ctx.start, { dur: 0.01 });
  rings.run(ctx.start, ctx.end);
  // choose a satellite that stays on screen, clear of Earth's disc and of the count tag
  var best = null, bestS = -1e9;
  for (var ri = 0; ri < 8; ri++) for (var ii = 0; ii < 8; ii++) {
    var s = 1e9, ok = true, dSum = 0, dN = 0;
    for (var tt = tHeight - 0.3; tt <= ctx.end; tt += 0.25) {
      var q;
      try { q = rings.satPos(ri, ii, tt); } catch (e) { q = null; }
      if (!q || !isFinite(q.x) || !isFinite(q.y)) { ok = false; break; }
      var sx = bx + k * q.x, sy = by + k * q.y;
      var dE = Math.sqrt((q.x - 800) * (q.x - 800) + (q.y - 500) * (q.y - 500));
      var dTag = Math.sqrt((sx - 1500) * (sx - 1500) + (sy - 200) * (sy - 200));
      dSum += dE; dN++;
      s = Math.min(s, sx - 330, 1590 - sx, sy - 190, 760 - sy, (dE - 290) * 2, dTag - 260);
    }
    s = Math.min(s, 120) + (dN ? dSum / dN : 0) * 0.6;
    if (ok && s > bestS) { bestS = s; best = [ri, ii]; }
  }
  best = best || [0, 0];
  var SP = function (t) { var q = rings.satPos(best[0], best[1], t); return { x: q.x, y: q.y }; };
  var unit = function (q) { var dx = q.x - 800, dy = q.y - 500, d = Math.sqrt(dx * dx + dy * dy) || 1; return { x: dx / d, y: dy / d, d: d }; };
  var lineG = Loom.svg("g", {}, fg);
  var radLine = Loom.svg("line", { stroke: ctx.c("accent"), "stroke-width": 7, "stroke-linecap": "round", opacity: 0 }, lineG);
  var arcPath = Loom.svg("path", { fill: "none", stroke: ctx.c("accent"), "stroke-width": 9, "stroke-linecap": "round", opacity: 0 }, lineG);

  var P = function (a) { return { x: bx + k * a.x, y: by + k * a.y }; };

  var hx = function (c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; };
  var cInk = hx(ctx.c("ink")), cAcc = hx(ctx.c("accent"));
  var mix = function (a, b, v) { return "rgb(" + [0, 1, 2].map(function (j) { return Math.round(a[j] + (b[j] - a[j]) * v); }).join(",") + ")"; };
  var ramp = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v); };
  var tags = [];
  var makeTag = function (name, str, cx, cy, tOn, tOff) {
    var f = kit.fit(str, { role: "label", w: 420, h: 60, maxLines: 1, weight: 700 });
    var w = Math.ceil(f.width) + 56, h = 64;
    // @form tag_pill: a small tag sitting on the thing it measures
    var E = ctx.el(name, { x: cx - w / 2, y: cy - h / 2, w: w, h: h, kind: "token", exit: "recede" });
    var inner = Loom.svg("g", {}, E.inner);
    kit.pill(inner, 0, 0, w, h, { fill: "surface", r: 32, shadow: true });
    var ring = Loom.svg("rect", { x: 0, y: 0, width: w, height: h, rx: 32, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4, opacity: 0 }, inner);
    var word = kit.text(inner, str, { role: "label", x: 28, y: 0, w: w - 56, h: h, align: "center", valign: "middle", color: "ink", weight: 700, maxLines: 1 });
    var T = { E: E, ring: ring, word: word, cx: cx, cy: cy, w: w, h: h, on: tOn, off: tOff, inner: inner };
    tags.push(T);
    return T;
  };
  var tagCount = makeTag("tag_count", "about 24 by design", 1500, 200, tDesign, tDesign + 2.4);
  var rMid = function (t) { var q = SP(Math.max(t, tHeight)), u = unit(q), r0 = 224, m0 = (r0 + u.d) / 2; return P({ x: 800 + u.x * m0, y: 500 + u.y * m0 }); };
  var pOut = function (t) { var q = SP(t), u = unit(q); return P({ x: q.x + u.x * 10 + u.y * 45, y: q.y + u.y * 10 - u.x * 45 }); };
  var a0 = rMid(tHeight), a1 = pOut(tPer + 0.5);
  var tagRad = makeTag("tag_radius", "about 20,200 km", a0.x, a0.y, tHeight, tHeight + 2.6);
  var tagPer = makeTag("tag_period", "about 12 h per orbit", a1.x, a1.y, tPer + 0.5, ctx.end + 5);
  tagRad.follow = rMid;
  tagPer.follow = function (t) { return pOut(Math.max(t, tPer + 0.5)); };

  m.settle(tagCount.E, tDesign, { dy: 24 });
  m.pop(tagRad.E, tHeight);
  m.pop(tagPer.E, tPer + 0.5);

  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    tags.forEach(function (T) {
      var tg0 = Math.max(t, tHeight), qq = SP(tg0), uu = unit(qq), gr = ramp(t, tHeight - 0.05, 0.6);
      radLine.setAttribute("opacity", t < tHeight - 0.05 ? 0 : 1);
      radLine.setAttribute("x1", 800 + uu.x * 224); radLine.setAttribute("y1", 500 + uu.y * 224);
      radLine.setAttribute("x2", 800 + uu.x * (224 + (uu.d - 224) * gr)); radLine.setAttribute("y2", 500 + uu.y * (224 + (uu.d - 224) * gr));
      if (t < tPer) arcPath.setAttribute("opacity", 0);
      if (t >= tPer) {
        var dd = "", n = Math.max(2, Math.ceil((t - tPer) / 0.1));
        for (var z = 0; z <= n; z++) { var pq = SP(tPer + (t - tPer) * z / n); dd += (z ? "L" : "M") + pq.x.toFixed(1) + " " + pq.y.toFixed(1); }
        arcPath.setAttribute("d", dd); arcPath.setAttribute("opacity", 1);
      }
      var acc = ramp(t, T.on, 0.25) * (1 - ramp(t, T.off, 0.4));
      T.ring.setAttribute("opacity", acc.toFixed(3));
      T.word.setAttribute("fill", mix(cInk, cAcc, acc));
      if (T.follow) {
        var p = T.follow(Math.max(T.on, t));
        T.inner.setAttribute("transform", "translate(" + (p.x - T.cx).toFixed(2) + " " + (p.y - T.cy).toFixed(2) + ")");
      }
    });
  }, ctx.start, span, "linear");
} });
