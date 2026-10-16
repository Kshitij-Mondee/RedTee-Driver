// @design lit_screen_in_dark_field: a dark city plan fades up, a dark phone settles, its screen lights, one teal dot pulses on it
// Treatments: (1) static composition, phone already lit with dot (rejected: the arrival is the point);
// (2) phone slides in with the dot already on it (rejected: dot must pulse on its word);
// (3) city fades up, phone settles dark, screen lights on "open a map", dot pops on "A blue dot appears" (chosen).
Loom.scene("b01", { build(ctx, props) {
  var m = ctx.m;
  var tNight = ctx.cue("Say it's night");
  var tMap = ctx.cue("you open a map");
  var tDot = ctx.cue("A blue dot appears");

  // ---- city: the night plan, lights low, slow push --------------------------------------------------------
  // @form night_city: the night city from above, lights low
  var C = ctx.el("city", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var cg = Loom.svg("g", {}, C.inner);
  var city = Loom.lesson.night_city(ctx, cg, { form: "plan", lights: "up" });
  city.setState("lights_low", ctx.start, { dur: 0.01 });
  m.reveal(C, ctx.start + 0.05, { dur: 1.6 });
  var span = ctx.end - ctx.start;
  Loom.drive(function (e) {
    var s = 1 + 0.07 * e;
    cg.setAttribute("transform", "translate(" + (960 * (1 - s)).toFixed(2) + " " + (540 * (1 - s)).toFixed(2) + ") scale(" + s.toFixed(4) + ")");
  }, ctx.start, span, "linear");

  // ---- phone: dark, then map, then dot --------------------------------------------------------------------
  // @form phone: a dark phone whose screen lights with the map
  var P = ctx.el("phone", { x: 1180, y: 110, w: 380, h: 760, kind: "instrument", exit: "recede" });
  var phone = Loom.lesson.phone(ctx, P.inner, { form: "phone" });
  phone.setState("dark", ctx.start, { dur: 0.01 });
  m.settle(P, tNight + 0.5, { dur: 0.7 });
  phone.setState("map", tMap, { dur: 0.6 });

  // ---- the dot: the one saturated colour ------------------------------------------------------------------
  // @form phone_dot: the teal dot pulsing into place on the map
  phone.setState("dot", tDot, { dur: 0.6 });
  phone.pulse && phone.pulse(tDot, 1.2);
} });
