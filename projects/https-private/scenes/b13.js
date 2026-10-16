// @design lock_closes_on_a_named_trip: a small lock drops shut beside a name, the route becomes one solid band, and the name is shown twice side by side
/* Treatments considered:
 * 1. static composition: padlock, band and name card already shown with an arrow (rejected: the closing and the band growing ARE the meaning).
 * 2. a big padlock in the middle of the stage (rejected: the lock belongs beside the address in the bar; the stage is held).
 * 3. chosen: the bar's padlock closes (one blue, one soft ring), the path thickens to an ink band end to end, and a
 *    pair card shows the address next to the verified name with an ink lock between them.
 * Layout shared with b01: browser (110,150), path (650,370), server (1430,170), watcher (759,28), step bar (360,780).
 */
Loom.scene("b13", {
  build: function (ctx, props) {
    var kit = ctx.kit, m = ctx.m, BID = ctx.beat.id, svg = Loom.svg;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }
    var T0 = ctx.start - 1;      // settled-before-the-beat time for redrawn held parts

    /* ---- the held stage: taken, or redrawn settled from frame 0 ---- */
    var B = take("browser");
    if (!B) {
      B = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card", exit: "none" });
      // @form browser_window: the https form
      Loom.lesson.browser_window(ctx, B.inner, { scheme: "https" });
    }
    var S = take("server");
    if (!S) {
      S = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card", exit: "none" });
      // @form server_box: idle rack
      Loom.lesson.server_box(ctx, S.inner, {});
    }
    var PA = take("path");
    if (!PA) {
      PA = ctx.el("path", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "none" });
      // @form network_path: the plain path
      Loom.lesson.network_path(ctx, PA.inner, {});
    }
    var WA = take("watcher");
    if (!WA) {
      WA = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      // @form watcher: noise panel
      var hw = Loom.lesson.watcher(ctx, WA.inner, { content: "noise" });
      hw.setState("noise", T0);
    }
    var SB = take("step_bar");
    var heldBar = !!SB;
    if (!SB) {
      SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
    }
    // the three tiles all done: a done copy over the held bar fades in as the beat opens (identical when it was done already)
    var oldKids = heldBar ? Array.prototype.slice.call(SB.inner.children) : [];
    var doneG = svg("g", {}, SB.inner);
    // @form step_bar: all three tiles done, ink tick discs
    var hsb = Loom.lesson.step_bar(ctx, doneG, {});
    hsb.setState("all_done", T0);
    if (heldBar) {
      doneG.setAttribute("opacity", 0);
      // a quick swap (the old tiles out as the done tiles in), so the same words never sit twice for long
      Loom.tween(doneG, { opacity: 0 }, { opacity: 1, duration: 0.08, ease: "none" }, ctx.start + 0.05, meta("steps.done"));
      oldKids.forEach(function (k) {
        Loom.tween(k, { opacity: 1 }, { opacity: 0, duration: 0.08, ease: "none" }, ctx.start + 0.05, meta("steps.old"));
      });
    }
    var KB = take("key_browser");
    if (!KB) {
      KB = ctx.el("key_browser", { x: 420, y: 612, w: 200, h: 83, kind: "token", exit: "none" });
      // @form key_exchange: the browser end, key held (ink)
      Loom.lesson.key_exchange(ctx, KB.inner, { side: "browser", w: 200, marks: true, key: "held" });
    }
    var KS = take("key_server");
    if (!KS) {
      KS = ctx.el("key_server", { x: 1262, y: 712, w: 160, h: 67, kind: "token", exit: "none" });
      // @form key_exchange: the server end, key held (ink)
      Loom.lesson.key_exchange(ctx, KS.inner, { side: "server", w: 160, marks: true, key: "held" });
    }

    /* ---- the clock, from the words ---- */
    var tClose = ctx.cue("Now the padlock");
    var tTrip = ctx.cue("a private trip");
    var tName = ctx.cue("the site named in the address");
    var tHeld = ctx.end - 0.45;

    /* ---- 1. the padlock closes beside the address (the bar replica carries it) ---- */
    var P = ctx.el("padlock", { x: 126, y: 216, w: 56, h: 52, kind: "icon", exit: "none" });
    // only the lock patch: the held bar keeps the address text, so no text sits twice
    kit.rect(P.inner, 0, 0, 56, 52, { fill: "surface", r: 10, shadow: false });
    // @form padlock_ring: one soft accent ring pulse round the closing lock
    var ringG = svg("g", { transform: "translate(34 26)" }, P.inner);
    var ring = svg("circle", { cx: 0, cy: 0, r: 30, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4, opacity: 0 }, ringG);
    var padPos = svg("g", { transform: "translate(12 4)" }, P.inner);
    var padBump = svg("g", {}, padPos);
    // @form padlock: open, then closed named, then closed held
    var pad = Loom.lesson.padlock(ctx, padBump, { size: 44 });
    pad.setState("closed_named", tClose);
    Loom.tween(padBump, { scale: 1, transformOrigin: "22px 22px" }, { scale: 1.3, duration: 0.18, ease: "power2.out" }, tClose, meta("padlock.bump"));
    Loom.tween(padBump, { scale: 1.3, transformOrigin: "22px 22px" }, { scale: 1, duration: 0.4, ease: "power2.inOut", immediateRender: false }, tClose + 0.18, meta("padlock.bump"));
    Loom.drive(function (e, raw) {
      ring.setAttribute("opacity", raw > 0 && e < 1 ? 0.65 * (1 - e) : 0);
      ring.setAttribute("transform", "scale(" + (0.9 + 0.8 * e).toFixed(3) + ")");
    }, tClose + 0.05, 0.9, "enter");
    pad.setState("closed_held", tHeld);

    /* ---- 2. the path becomes one solid ink band between the ends ---- */
    var TB = ctx.el("trip_band", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "none" });
    var nx2 = 0.38 * 760;
    // @form trip_band: a solid ink band either side of the watcher's disc
    svg("rect", { x: 0, y: 52, width: nx2 - 38, height: 16, rx: 8, fill: ctx.c("ink") }, TB.inner);
    svg("rect", { x: nx2 + 38, y: 52, width: 760 - nx2 - 38, height: 16, rx: 8, fill: ctx.c("ink") }, TB.inner);
    [0.14, 0.62, 0.86].forEach(function (f) {
      svg("circle", { cx: f * 760, cy: 60, r: 19, fill: ctx.c("surface2"), stroke: ctx.c("line"), "stroke-width": 2 }, TB.inner);
    });
    m.unmask(TB, tTrip, { dir: "ltr", dur: 1.0 });

    /* ---- 3. the name pair: the address beside the verified name, a lock between ---- */
    var NP = ctx.el("name_pair", { x: 640, y: 140, w: 780, h: 200, kind: "card", exit: "recede" });
    kit.rect(NP.inner, 0, 0, 780, 200, { fill: "surface", r: 20, stroke: "surface2", sw: 2, shadow: true });
    kit.text(NP.inner, "Padlock: private trip, claimed site", { role: "label", size: 30, x: 24, y: 12, w: 732, h: 48, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    var nF = kit.fit("login.example.com", { role: "label", size: 28, w: 2000, h: 60, maxLines: 1, weight: 700 }).width;
    var Lw = Math.ceil(nF) + 36, Rw = Math.ceil(nF) + 36 + 40, LK = 52, GAP = 14;
    var total = Lw + GAP + LK + GAP + Rw;
    var x0 = (780 - total) / 2, ry = 68, rh = 64;
    // the address chip (left)
    kit.rect(NP.inner, x0, ry, Lw, rh, { fill: "surface2", r: 14, shadow: false });
    kit.text(NP.inner, "login.example.com", { role: "label", size: 28, x: x0 + 18, y: ry, w: Lw - 36 + 4, h: rh, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    kit.text(NP.inner, "Address", { role: "label", size: 28, x: x0, y: ry + rh + 6, w: Lw, h: 40, align: "center", valign: "middle", maxLines: 1, weight: 500, color: "muted" });
    // the lock between them, ink
    var lkG = svg("g", { transform: "translate(" + (x0 + Lw + GAP + 2) + " " + (ry + (rh - 48) / 2) + ")" }, NP.inner);
    // @form padlock_between: an ink lock between the address and the name
    Loom.lesson.padlock(ctx, lkG, { size: 48, state: "closed_held" });
    // the verified name chip (right), fades in just after
    var chipG = svg("g", {}, NP.inner);
    var rx0 = x0 + Lw + GAP + LK + GAP;
    void rx0;
    // @form name_chip: the verified name, ink outline, ink tick
    kit.rect(chipG, rx0, ry, Rw, rh, { fill: "surface", r: 14, stroke: "ink", sw: 3, shadow: false });
    kit.disc(chipG, rx0 + 36, ry + rh / 2, 15, { fill: "ink" });
    kit.icon(chipG, "check", { x: rx0 + 36, y: ry + rh / 2, size: 18, color: "onAccent" });
    kit.text(chipG, "login.example.com", { role: "label", size: 28, x: rx0 + 60, y: ry, w: Rw - 72 + 8, h: rh, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    kit.text(chipG, "Name", { role: "label", size: 28, x: rx0, y: ry + rh + 6, w: Rw, h: 40, align: "center", valign: "middle", maxLines: 1, weight: 500, color: "muted" });
    chipG.setAttribute("opacity", 0);
    m.settle(NP, tName);
    Loom.tween(chipG, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, tName + 0.3, meta("chip.in"));
  }
});
