// @design pulse_in_flight: the one pulse keeps travelling down its line, streaks trail the wavefront, a speed tag rides beside it
Loom.scene("b10", {
  build(ctx, props) {
    var m = ctx.m, kit = ctx.kit;
    // Treatments: (1) static tag fixed in the sky (rejected: the speed is not read off the thing), (2) tag riding beside the pulse with streaks behind (chosen), (3) a ruler of tick marks under the path (rejected: adds numbers).
    var PULSE_START = 0.33;   // where b09 ended
    var PULSE_END = 0.62;     // where this beat ends; b11 continues from here
    var START = [430, 305], END = [960, 812];
    var DX = END[0] - START[0], DY = END[1] - START[1], LEN = Math.hypot(DX, DY);
    var ux = DX / LEN, uy = DY / LEN, px = uy, py = -ux; // travel direction; perpendicular (up and right)

    var tRadio = ctx.cue("It's a radio wave");
    var tSpeed = ctx.cue("300,000 kilometres a second");
    var tEnd = ctx.speechEnd;

    // ---- held: everything b08/b09 drew stays exactly as it is
    var gH = ctx.held("ground"), pH = ctx.held("phone_pt"), sH = ctx.held("sats");
    var pulse = ctx.held("pulse"), stamp = ctx.held("stamp");
    var tr = function (t) { return Math.max(0, Math.min(1, (t - tRadio) / (tEnd - tRadio))); };
    var prog = function (t) { return PULSE_START + (PULSE_END - PULSE_START) * tr(t); };
    var headAt = function (p) { return [START[0] + DX * p, START[1] + DY * p]; };
    if (pulse && pulse.handle) pulse.handle.travel(tRadio, tEnd - tRadio, PULSE_END);
    if (stamp && stamp.handle) stamp.handle.travel(tRadio, tEnd - tRadio, PULSE_END);

    // ---- streaks: gold lines trailing the wavefront
    var SK = ctx.el("streaks", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });
    // @form speed_streaks: thin parallel lines behind a moving wavefront
    var offs = [-40, -20, 0, 20, 40], lens = [80, 130, 180, 130, 80];
    var lines = offs.map(function (o, i) {
      return Loom.svg("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: ctx.c("accent2"), "stroke-width": i === 2 ? 5 : 4, "stroke-linecap": "round", opacity: 0 }, SK.inner);
    });
    Loom.drive(function (e) {
      var t = tRadio + e * (tEnd - tRadio), p = prog(t), h = headAt(p);
      lines.forEach(function (ln, i) {
        var grow = Math.min(1, e * 6), L = lens[i] * grow;
        var bx = h[0] + px * offs[i] - ux * 26, by = h[1] + py * offs[i] - uy * 26; // start just behind the wavefront
        ln.setAttribute("x1", bx.toFixed(1)); ln.setAttribute("y1", by.toFixed(1));
        ln.setAttribute("x2", (bx - ux * L).toFixed(1)); ln.setAttribute("y2", (by - uy * L).toFixed(1));
        ln.setAttribute("opacity", (e > 0 ? (0.75 - 0.1 * Math.abs(offs[i]) / 20) : 0).toFixed(2));
      });
    }, tRadio, tEnd - tRadio, "linear");

    // ---- tag_speed: pops beside the pulse on the spoken number and rides with it
    var WORDS = "about 300,000 km/s";
    var f = kit.fit(WORDS, { role: "body", w: 520, h: 64, maxLines: 1, weight: 700 });
    var padX = 26, padY = 14;
    var TW = Math.ceil(f.width) + 2 * padX, TH = Math.ceil(f.height) + 2 * padY;
    var TG = ctx.el("tag_speed", { x: 0, y: 0, w: 1920, h: 1080, kind: "value", exit: "recede" });
    var tg = Loom.svg("g", { opacity: 0 }, TG.inner);
    var OFFX = 120, OFFY = -48 - TH / 2; // box top-left relative to the wavefront point (right and above, clear of the arc)
    Loom.svg("line", { x1: 56, y1: -30, x2: OFFX, y2: OFFY + TH / 2, stroke: ctx.c("accent"), "stroke-width": 4, "stroke-linecap": "round" }, tg);
    Loom.svg("rect", { x: OFFX, y: OFFY + 10, width: TW, height: TH, rx: TH / 2, fill: ctx.c("shadow"), opacity: 0.4 }, tg);
    Loom.svg("rect", { x: OFFX, y: OFFY, width: TW, height: TH, rx: TH / 2, fill: ctx.c("accent") }, tg);
    kit.text(tg, WORDS, { role: "body", x: OFFX + padX, y: OFFY + padY, w: TW - 2 * padX, h: TH - 2 * padY, align: "center", valign: "middle", maxLines: 1, color: "onAccent", weight: 700 });
    Loom.drive(function (e) {
      var t = tSpeed + e * (tEnd - tSpeed), h = headAt(prog(t));
      var s = e <= 0 ? 0.001 : Math.min(1, e * 8);
      var k = s < 1 ? 0.6 + 0.4 * s + 0.12 * Math.sin(s * Math.PI) : 1;
      tg.setAttribute("transform", "translate(" + h[0].toFixed(1) + " " + h[1].toFixed(1) + ") scale(" + k.toFixed(3) + ")");
      tg.setAttribute("opacity", (e <= 0 ? 0 : Math.min(1, e * 10)).toFixed(2));
    }, tSpeed, tEnd - tSpeed, "linear");
  }
});
