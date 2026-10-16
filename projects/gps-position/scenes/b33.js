// @design noise_on_the_path: two signal paths, one bent by the air and one bounced off a tower, leave the dot ringed by a soft halo
// Treatments: (1) static city with both paths and halo drawn (rejected: the bend and bounce must be seen happening);
// (2) halo first, then the paths (rejected: the halo is the result of the noise);
// (3) city and phone settle, bend travels, bounce travels, halo grows (chosen).
Loom.scene("b33", { build(ctx, props) {
  var kit = ctx.kit, m = ctx.m;
  var tNoise = ctx.cue("Real life adds noise");
  var tBend = ctx.cue("The air slows signals a little");
  var tBounce = ctx.cue("and buildings bounce them");
  var tEst = ctx.cue("the dot is an estimate");
  var span = ctx.end - ctx.start;

  // @form night_city: the night skyline with the air band
  var C = ctx.el("skyline", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  var city = Loom.lesson.night_city(ctx, Loom.svg("g", {}, C.inner), { form: "skyline", lights: "up" });
  city.setState("skyline", ctx.start, { dur: 0.01 });
  m.reveal(C, ctx.start + 0.02, { dur: 0.6 });


  // @form phone: the phone map with the blue dot
  var PS = 0.9, PX = 1380, PY = 140;
  var P = ctx.el("phone", { x: PX, y: PY, w: 380 * PS, h: 760 * PS, kind: "instrument", exit: "recede" });
  var ph = Loom.lesson.phone(ctx, Loom.svg("g", { transform: "scale(" + PS + ")" }, P.inner), { form: "phone" });
  ph.setState("dot", ctx.start, { dur: 0.01 });
  m.settle(P, ctx.start + 0.1, { dur: 0.6 });
  // @form phone_halo: the soft uncertainty halo round the dot
  ph.setState("halo", tEst, { dur: 0.9, size: 150 });

  // @form signal_bend: a gold signal bending crossing the air band
  var S1 = ctx.el("sig_bend", { x: 0, y: 0, w: 1920, h: 1080, kind: "token", exit: "recede" });
  var bend = Loom.lesson.signal(ctx, S1.inner, { from: [300, 50], to: [1385, 470], band: { y0: 210, y1: 350 }, bendDeg: 14 });
  bend.setState("bend", tBend, { dur: 1.6 });
  bend.travel(tBend, 1.6, 1);
  // @form signal_bounce: a gold signal bouncing off the tall tower
  var S2 = ctx.el("sig_bounce", { x: 0, y: 0, w: 1920, h: 1080, kind: "token", exit: "recede" });
  var bounce = Loom.lesson.signal(ctx, S2.inner, { from: [1260, 60], via: [[890, 620]], to: [1385, 760] });
  bounce.setState("bounce", tBounce, { dur: 1.8 });
  bounce.travel(tBounce, 1.8, 1);
  m.reveal(S1, tBend - 0.1, { dur: 0.3 });
  m.reveal(S2, tBounce - 0.1, { dur: 0.3 });
} });
