// @design doubt_zoom: a steady reading flickers, then the view pushes through it into the thing that feeds it
Loom.scene("b18", {
  build(ctx, props) {
    var names = ["ground", "phone_pt", "sats", "circle_a", "circle_b", "circle_c"];
    var m = ctx.m, H = {};
    names.forEach(function (n) { H[n] = ctx.held(n); });
    var tFlick = ctx.cue("exact time");
    var tZoom = ctx.cue("It doesn't");
    var tPush0 = ctx.speechStart;
    var tFade = tZoom + 0.3, tFadeEnd = tZoom + 0.75;
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

    // @form diagram_push: slow push toward the phone point, then a fast zoom into it
    var pivot = { x: 960, y: 812 };
    names.forEach(function (n) {
      var E = H[n];
      if (!E) return;
      var at = function (k, px, py) { return { x: px - E.x + k * (E.x - pivot.x), y: py - E.y + k * (E.y - pivot.y), scale: k }; };
      var a = at(2.2, 960, 760), b = at(14, 960, 540);
      m.travel(E, tPush0, Object.assign({ dur: tZoom - tPush0 }, a));
      m.travel(E, tZoom, Object.assign({ dur: 0.75 }, b));
    });

    // everything held fades as the zoom lands; the phone point also flickers twice (uncertain)
    names.forEach(function (n) {
      var E = H[n];
      if (!E || n === "phone_pt") return;
      Loom.drive(function (e) { E.life.style.opacity = String(1 - clamp(e, 0, 1)); }, tFade, tFadeEnd - tFade, "linear", { key: "fade_" + n });
    });
    var ptE = H.phone_pt;
    if (ptE) {
      var tEnd = tFadeEnd;
      var dip = function (s, a, d) { var u = (s - a) / d; return (u > 0 && u < 1) ? Math.pow(Math.sin(Math.PI * u), 0.6) : 0; };
      Loom.drive(function (e) {
        var s = tFlick + e * (tEnd - tFlick);
        var op = 1 - 0.9 * Math.max(dip(s, tFlick, 0.32), dip(s, tFlick + 0.5, 0.32));
        if (s > tFade) op = op * (1 - clamp((s - tFade) / (tFadeEnd - tFade), 0, 1));
        ptE.life.style.opacity = String(op);
      }, tFlick, tEnd - tFlick, "linear", { key: "pt_flicker" });
    }

    // @form phone_quartz: the phone with its quartz clock, hand wobbling
    var sc = 1.4, pw = 380 * sc, ph = 560 * sc;
    var PE = ctx.el("phone_clock", { x: 960 - pw / 2, y: 120, w: pw, h: ph, kind: "instrument", exit: "none" });
    var phone = Loom.lesson.phone(ctx, PE.inner, { form: "quartz", w: pw });
    var clock = Loom.lesson.clock_face(ctx, phone.slot, { size: 280, finish: "quartz", speed: 36 });
    clock.g.setAttribute("transform", "translate(190 230) scale(1.3) translate(-140 -140)");
    clock.run(ctx.start, ctx.end);
    clock.setState("off", tZoom + 0.9, { deg: 55, dur: 0.25 });
    Loom.drive(function (e) { PE.life.style.opacity = String(clamp(e, 0, 1)); }, tZoom + 0.15, 0.45, "linear", { key: "phone_in" });
  }
});
