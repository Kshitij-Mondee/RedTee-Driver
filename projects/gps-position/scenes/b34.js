// @design returning_dot_lands: the opening image returns, a pulse tightens onto one dot, then the night widens and warms under slow passing lights
// Treatments: (1) static: skyline, phone, dot, satellites all shown at once (rejected: no payoff);
// (2) cut to a new wide city (rejected: breaks the callback); (3) hold phone, tighten halo onto dot, then warm the city and let small satellites drift over (chosen).
Loom.scene("b34", { build(ctx, props) {
  var m = ctx.m;
  var tEach = ctx.cue("But each time it appears");
  var tSolved = ctx.cue("solved a timing problem");
  var tLands = ctx.cue("the dot lands where you are");
  var ease = function (e) { return e * e * (3 - 2 * e); };

  // ---- held from the beat before (a plain fallback draws them only when the neighbour left none) ---------
  var skyline = ctx.held("skyline");
  var phone = ctx.held("phone");
  var halo = null; // dot and halo are drawn inside b33's phone part, so they are not separate held elements
  var PR = ctx.el("b34_probe", { x: 0, y: 0, w: 380, h: 760, kind: "scenery", exit: "none" });
  var pg = Loom.svg("g", { display: "none" }, PR.inner);
  var probe = Loom.lesson.phone(ctx, pg, { form: "phone" });

  var base = null, ph = null;
  if (!skyline) {
    var B = ctx.el("city_base", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    var bg = Loom.svg("g", {}, B.inner);
    base = Loom.lesson.night_city(ctx, bg, { form: "skyline", lights: "up" });
    base.setState("lights_low", ctx.start, { dur: 0.01 });
  }
  var holder;
  var dotHome = (probe.anchors && probe.anchors.dotHome) || { x: 190, y: 380 };
  if (!phone) {
    var P = ctx.el("phone_fb", { x: 1180, y: 110, w: 380, h: 760, kind: "instrument", exit: "recede" });
    ph = Loom.lesson.phone(ctx, P.inner, { form: "phone" });
    ph.setState("dot", ctx.start, { dur: 0.01 });
    ph.setState("halo", ctx.start + 0.02, { dur: 0.01, size: 90 });
    var hn = ph.halo;
    if (hn && hn.setAttribute) {
      var hx = +(hn.getAttribute("cx") || 0), hy = +(hn.getAttribute("cy") || 0);
      Loom.drive(function (e) {
        var k = e * e * (3 - 2 * e), s = 1 - 0.8 * k;
        hn.setAttribute("transform", "translate(" + (hx * (1 - s)).toFixed(2) + " " + (hy * (1 - s)).toFixed(2) + ") scale(" + s.toFixed(3) + ")");
      }, tSolved, 1.6, "linear");
    }
    ph.pulse && ph.pulse(tEach, 1.2);
    if (ph.anchors && ph.anchors.dotHome) dotHome = ph.anchors.dotHome;
    holder = P.inner;
  } else {
    holder = phone.inner;
    var ks = (phone.w || 380) / 380;
    dotHome = { x: dotHome.x * ks, y: dotHome.y * ks };
  }

  // ---- the dot pulses once more, as in the opening ------------------------------------------------------
  // @form phone_dot: a teal ring pulses out of the dot, and the halo tightens into it
  var ring = Loom.svg("circle", { cx: dotHome.x, cy: dotHome.y, r: 14, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 4, opacity: 0 }, holder);
  var pulse = function (t0, d, a) {
    Loom.drive(function (e) {
      var k = ease(e);
      ring.setAttribute("r", (14 + 46 * k).toFixed(2));
      ring.setAttribute("opacity", (a * (1 - k) * (e > 0 ? 1 : 0)).toFixed(3));
    }, t0, d, "linear");
  };
  pulse(tEach, 1.2, 0.9);
  pulse(tLands, 1.6, 0.7);
  var tight = Loom.svg("circle", { cx: dotHome.x, cy: dotHome.y, r: 60, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 3, opacity: 0 }, holder);
  Loom.drive(function (e) {
    var k = ease(e);
    tight.setAttribute("r", (60 - 48 * k).toFixed(2));
    tight.setAttribute("opacity", (e > 0 ? 0.8 * Math.min(1, (1 - k) * 2) : 0).toFixed(3));
  }, tSolved, 1.6, "linear");
  if (halo) {
    var hc = "translate(" + (halo.w / 2) + " " + (halo.h / 2) + ") scale(";
    Loom.drive(function (e) {
      var k = ease(e), s = 1 - 0.85 * k;
      halo.inner.setAttribute("transform", hc + s.toFixed(3) + ") translate(" + (-halo.w / 2) + " " + (-halo.h / 2) + ")");
      halo.inner.setAttribute("opacity", (1 - 0.8 * k).toFixed(3));
    }, tSolved, 1.6, "linear");
  }

  // ---- the city warms: the same skyline, lights up, around the phone's clear space ------------------------
  // @form night_city: the same skyline, windows lighting
  var W = ctx.el("city_warm", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
  var defs = Loom.svg("defs", {}, W.inner);
  var cp = Loom.svg("clipPath", { id: "b34_clear" }, defs);
  Loom.svg("path", { "clip-rule": "evenodd", "fill-rule": "evenodd", d: "M0 0H1920V1080H0Z M1330 90H1770V860H1330Z" }, cp);
  var wg = Loom.svg("g", { "clip-path": "url(#b34_clear)" }, W.inner);
  var city = Loom.lesson.night_city(ctx, wg, { form: "skyline", lights: "up" });
  city.setState("lights_low", ctx.start, { dur: 0.01 });
  m.reveal(W, tSolved + 0.4, { dur: 0.6 });
  city.setState("lights_up", tLands + 0.4, { dur: 1.8 });

  // ---- satellites: small points drifting over the sky ----------------------------------------------------
  // @form gps_satellite: small satellites passing above, each pulsing once
  var S = ctx.el("sats_pass", { x: 0, y: 60, w: 1920, h: 240, kind: "scenery", exit: "none" });
  var specs = [{ y: 40, x0: 140, x1: 560, s: 0.26, d: 0 }, { y: 130, x0: 700, x1: 1100, s: 0.22, d: 0.5 }, { y: 70, x0: 1500, x1: 1760, s: 0.24, d: 1.0 }];
  specs.forEach(function (sp) {
    var g = Loom.svg("g", { opacity: 0 }, S.inner);
    var sat = Loom.lesson.gps_satellite(ctx, g, { form: "idle" });
    sat.setState && sat.setState("idle", ctx.start, { dur: 0.01 });
    var t0 = tLands + 0.2 + sp.d;
    Loom.drive(function (e) {
      var x = sp.x0 + (sp.x1 - sp.x0) * e;
      var pl = 1 + 0.18 * Math.sin(Math.PI * Math.min(1, Math.max(0, (e - 0.35) / 0.3)));
      var s = sp.s * pl;
      g.setAttribute("transform", "translate(" + (x - 180 * s).toFixed(2) + " " + (sp.y - 110 * s).toFixed(2) + ") scale(" + s.toFixed(4) + ")");
      g.setAttribute("opacity", Math.min(1, e * 6, (1 - e) * 6).toFixed(3));
    }, t0, ctx.end - t0, "linear");
  });
} });
