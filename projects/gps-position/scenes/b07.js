// @design tagged_pulse: one pulse leaves a source and carries two labelled tags on its wavefront
// Treatments: (1) static composition, both chips already on a line (rejected: chips must arrive on their words);
// (2) two pulses, one per tag (rejected: one idea, one signal); (3) one pulse, chips ride it in order (chosen).
Loom.scene("b07", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  // held from b06: the camera stays where b06 left it; this beat only adds the pulse, drawn in screen space
  ["earth", "earth_point", "orbits", "sats", "hero_sat", "clock"].forEach(function (n) { ctx.held(n); });
  // measured on b06's last frame: the hero satellite's dish, and the teal point on Earth
  var from = { x: 425, y: 580 }, to = { x: 1152, y: 369 };

  var tPulse = ctx.cue("Every signal says two things");
  var tWhere = ctx.cue("Here is where I am");
  var tWhen = ctx.cue("exactly when I sent this");

  var P = ctx.el("pulse", { x: 0, y: 0, w: 1920, h: 1080, kind: "token", exit: "recede" });
  // @form signal_pulse_tagged: one pulse with a position pin and a time stamp riding its wavefront
  var sig = Loom.lesson.signal(ctx, P.inner, { from: [from.x, from.y], to: [to.x, to.y], pinText: "where I am", stampText: "when I sent this", chipSide: -1 });
  // the kit sizes each chip from an estimate that runs about 1px short of the real text; widen the pill on both sides so the label keeps a 6px+ inset
  sig.chips.forEach(function (c) {
    [].forEach.call(c.g.querySelectorAll("rect"), function (r) { r.setAttribute("x", String(parseFloat(r.getAttribute("x") || 0) - 14)); r.setAttribute("width", String(parseFloat(r.getAttribute("width")) + 38)); r.setAttribute("y", String(parseFloat(r.getAttribute("y")) - 8)); r.setAttribute("height", String(parseFloat(r.getAttribute("height")) + 16)); });
  });
  var tEnd = ctx.speechEnd - 0.1;
  sig.setState("pulse", tPulse);                    // the bare pulse, no chips yet
  sig.travel(tPulse, tEnd - tPulse, 1);            // leaves the satellite and reaches Earth by the last word
  sig.hold("c0", tWhere, true);                    // the position pin chip pops onto the wavefront
  sig.hold("c1", tWhen, true);                     // the time stamp chip joins it
  sig.absorb(tEnd, ctx.end - tEnd - 0.05);
  // each chip reads in accent only while its own words are spoken
  var ramp = function (t, t0, d) { var v = (t - t0) / d; return v < 0 ? 0 : v > 1 ? 1 : v; };
  var spoken = [[tWhere, tWhen - 0.1], [tWhen, ctx.speechEnd]];
  var span = ctx.end - ctx.start;
  Loom.drive(function (e) {
    var t = ctx.start + e * span;
    sig.chips.forEach(function (c, i) {
      var a = ramp(t, spoken[i][0], 0.2) * (1 - ramp(t, spoken[i][1], 0.25));
      c.ta.setAttribute("opacity", a.toFixed(3));
      c.tx.setAttribute("opacity", (1 - a).toFixed(3));
    });
  }, ctx.start, span, "linear");
} });
