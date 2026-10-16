// @design three_checks_in_turn: one document is read row by row, each row named, matched against what is on screen, then ticked
/* Treatments considered:
 * 1. static certificate with all three ticks already in place and an arrow (rejected: the order of the checks is the idea).
 * 2. rows light one at a time in the spoken order; Name draws a thin line to the address, Date slides its marker; each
 *    row ends in a tick that pops on its word (chosen: sequence plus proof of the match is the whole point).
 * 3. three separate cards, one per check (rejected: the held certificate must stay one document).
 * Layout is shared: browser (110,150), path (650,370), server (1430,170), watcher origin (759,28), cert panel (790,170) w 600.
 * b05 ends on the large certificate (rows blank) and the wait glyph; this beat drives that same held panel.
 */
Loom.scene("b06", {
  build: function (ctx, props) {
    var kit = ctx.kit, m = ctx.m, BID = ctx.beat.id;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }
    function show(node, t, dur) {
      node.setAttribute("opacity", 0);
      Loom.tween(node, { opacity: 0 }, { opacity: 1, duration: dur || 0.25, ease: "none" }, t, meta("b06.show"));
    }

    /* ---- the held stage (drawn only if missing, in the state b05 ends on) ---- */
    var B = take("browser");
    if (!B) {
      B = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card", exit: "none" });
      Loom.lesson.browser_window(ctx, B.inner, { scheme: "http" });
    }
    var S = take("server");
    if (!S) {
      S = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card", exit: "none" });
      Loom.lesson.server_box(ctx, S.inner, {});
    }
    var PA = take("path");
    if (!PA) {
      PA = ctx.el("path", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "none" });
      Loom.lesson.network_path(ctx, PA.inner, {});
    }
    var W = take("watcher");
    if (!W) {
      W = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      Loom.lesson.watcher(ctx, W.inner, { content: "noise" }).setState("eye_closed", 0);
    }
    var SB = take("step_bar");
    if (!SB) {
      SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
      Loom.lesson.step_bar(ctx, SB.inner, {}).setState("shown", 0);
    }
    take("tls_wrap");
    take("check_panel");
    var P = take("packet");
    if (!P) {
      // the wait glyph: a text-free stand-in for the wrapped packet
      P = ctx.el("packet", { x: 630, y: 335, w: 156, h: 90, kind: "token", exit: "none" });
      // @form wait_glyph: three ink bars on a white tile with a dashed outline, no words
      kit.rect(P.inner, 10, 10, 135, 70, { fill: "surface", r: 8, stroke: "accent3", sw: 2, shadow: false });
      [27, 45, 63].forEach(function (yy) {
        Loom.svg("rect", { x: 25, y: yy, width: 105, height: 6, rx: 3, fill: ctx.c("ink"), opacity: 0.45 }, P.inner);
      });
      Loom.svg("rect", { x: 4, y: 4, width: 147, height: 82, rx: 11, fill: "none", stroke: ctx.c("ink"), "stroke-width": 2.5, "stroke-dasharray": "6 5" }, P.inner);
    }

    /* ---- the certificate: the held panel at (790,170), width 600 ---- */
    var K = 600 / 620;
    var C = take("cert");
    if (!C) {
      C = ctx.el("cert", { x: 790, y: 170, w: 600, h: 407, kind: "card", exit: "none" });
      // @form certificate_card: the large certificate, three rows, blank
      Loom.lesson.certificate_card(ctx, C.inner, { w: 600 });
    }
    var CX = 790, CY = 170;

    var tThree = ctx.cue("The browser checks three things");
    var tIssuer = ctx.cue("a trusted authority issued it");
    var tIssued = ctx.cue("issued it");
    var tName = ctx.cue("the name matches");
    var tAddr = ctx.cue("the address");
    var tDate = ctx.cue("it has not expired");
    var tExp = ctx.cue("expired");

    var rowY = { issuer: CY + (108 + 48) * K, name: CY + (108 + 96 + 48) * K, date: CY + (108 + 192 + 48) * K };
    var markX = CX + 568 * K;

    /* ---- find the held card's own row labels (grey and blue copies) and today marker by their content ---- */
    var LBL = {};
    var all = C.inner.querySelectorAll("text");
    var blues = [], greys = [];
    for (var li = 0; li < all.length; li++) {
      var lw = (all[li].textContent || "").replace(/\s+/g, " ").trim();
      if (lw !== "Issuer" && lw !== "Name" && lw !== "Date") continue;
      var anc = all[li], bg = null;
      while (anc && anc !== C.inner) {
        if (anc.getAttribute && anc.getAttribute("opacity") === "0") { bg = anc; break; }
        anc = anc.parentNode;
      }
      if (bg) blues.push({ w: lw.toLowerCase(), g: bg }); else greys.push({ w: lw.toLowerCase(), t: all[li] });
    }
    blues.forEach(function (b) {
      LBL[b.w] = { blue: b.g };
      greys.forEach(function (g) {
        if (g.w !== b.w) return;
        var n = g.t;
        while (n && n.parentNode && n.parentNode !== b.g.parentNode) n = n.parentNode;
        if (n && n.parentNode === b.g.parentNode) LBL[b.w].grey = n;
      });
    });
    /* the row being checked is marked with shapes only (no text copies): a soft tint and a bar at the left edge */
    var HL = ctx.el("row_hi", { x: CX + 6, y: rowY.issuer - 46, w: 588, h: rowY.date - rowY.issuer + 92, kind: "icon", exit: "recede" });
    var hiRows = {};
    ["issuer", "name", "date"].forEach(function (n) {
      var g = Loom.svg("g", {}, HL.inner);
      var yy = rowY[n] - rowY.issuer;
      Loom.svg("rect", { x: 0, y: yy, width: 588, height: 92, rx: 10, fill: ctx.c("accent"), opacity: 0.12 }, g);
      Loom.svg("rect", { x: 0, y: yy + 14, width: 6, height: 64, rx: 3, fill: ctx.c("accent") }, g);
      g.setAttribute("opacity", 0);
      hiRows[n] = g;
    });
    function labelTo(row, t, blue) {
      var g = hiRows[row];
      if (!g) return;
      Loom.tween(g, { opacity: blue ? 0 : 1 }, { opacity: blue ? 1 : 0, duration: 0.01, ease: "none" }, t, meta("b06.hi_" + row + (blue ? "_in" : "_out")));
    }
    var todayG = null, todayX = 0;
    var gs = C.inner.querySelectorAll("g");
    for (var gi = 0; gi < gs.length; gi++) {
      var tr = gs[gi].getAttribute("transform") || "";
      var mm = /^translate\(([\d.]+) 0\)$/.exec(tr);
      if (mm && gs[gi].querySelector("path")) { todayG = gs[gi]; todayX = parseFloat(mm[1]); break; }
    }

    /* ---- empty mark slots appear with "three things" ---- */
    var SL = ctx.el("mark_slots", { x: markX - 36, y: rowY.issuer - 36, w: 72, h: rowY.date - rowY.issuer + 72, kind: "icon", exit: "recede" });
    var rings = {};
    ["issuer", "name", "date"].forEach(function (n, i) {
      var g = Loom.svg("g", {}, SL.inner);
      // @form mark_slot: an empty ring waiting for its tick
      Loom.svg("circle", { cx: 36, cy: rowY[n] - rowY.issuer + 36, r: 22, fill: "none", stroke: ctx.c("line"), "stroke-width": 3 }, g);
      show(g, tThree + 0.1 + i * 0.2, 0.3);
      rings[n] = g;
    });

    /* ---- the three ticks, each its own element ---- */
    var ticks = {};
    ["issuer", "name", "date"].forEach(function (n) {
      var T = ctx.el("tick_" + n, { x: markX - 30, y: rowY[n] - 30, w: 60, h: 60, kind: "icon", exit: "none" });
      // @form tick_row: the pass mark on one certificate row
      kit.mark(T.inner, "yes", 30, 30, 48);
      ticks[n] = T;
    });
    function ringOut(n, t) { Loom.tween(rings[n], { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "none" }, t, meta("b06.ring_out_" + n)); }

    /* 1. issuer */
    labelTo("issuer", tIssuer, true);
    m.pop(ticks.issuer, tIssued + 0.05);
    ringOut("issuer", tIssued + 0.05);

    /* 2. name: label blue, a thin line to the address, the two names ring, tick */
    var asz = Math.min(28, kit.fit("https://login.example.com", { role: "label", w: 410, h: 52, maxLines: 1, weight: 700 }).size);
    var addrW = kit.fit("http://login.example.com", { role: "label", size: asz, w: 2000, h: 52, maxLines: 1, weight: 700 }).width;
    var valW = kit.fit("login.example.com", { role: "label", size: 30 * K, w: 2000, h: 96, maxLines: 1, weight: 500 }).width;
    var LX = 170, LY = 200;
    var NL = ctx.el("name_match", { x: LX, y: LY, w: 700, h: 260, kind: "connector", exit: "recede" });
    var fadeG = Loom.svg("g", {}, NL.inner);
    var addrX = 110 + 82, addrY = 150 + 92;
    var routeX = 787, rowN = rowY.name;
    // @form match_ring: a thin ink ring round the address
    var ringA = Loom.svg("rect", { x: addrX - 10 - LX, y: addrY - 26 - LY, width: addrW + 20, height: 52, rx: 12, fill: "none", stroke: ctx.c("ink"), "stroke-width": 3 }, fadeG);
    // @form match_ring: a thin ink ring round the certificate's name
    var ringN = Loom.svg("rect", { x: CX + 178 * K - 10 - LX, y: rowN - 26 - LY, width: valW + 20, height: 52, rx: 12, fill: "none", stroke: ctx.c("ink"), "stroke-width": 3 }, fadeG);
    // @form match_line: the thin line from the Name row up to the address
    var xe = CX + 2 - LX, x0 = routeX - LX, y0 = rowN - LY, y1 = addrY - LY, x2 = addrX + addrW + 10 - LX;
    var linePath = Loom.svg("path", { d: "M" + xe + " " + y0 + " H" + x0 + " V" + y1 + " H" + x2, fill: "none", stroke: ctx.c("ink"), "stroke-width": 3, "stroke-linejoin": "round" }, fadeG);
    var dot = Loom.svg("circle", { cx: xe, cy: y0, r: 7, fill: ctx.c("ink") }, fadeG);
    var LEN = Math.abs(xe - x0) + Math.abs(y0 - y1) + Math.abs(x0 - x2);
    linePath.setAttribute("stroke-dasharray", LEN + " " + (LEN + 10));
    linePath.setAttribute("stroke-dashoffset", LEN + 4);
    linePath.setAttribute("opacity", 0);
    ringA.setAttribute("opacity", 0); ringN.setAttribute("opacity", 0); dot.setAttribute("opacity", 0);
    labelTo("issuer", tName, false);
    labelTo("name", tName, true);
    show(dot, tName, 0.2);
    show(ringN, tName + 0.1, 0.25);
    var tDraw = tName + 0.25, dDraw = 0.8;
    Loom.drive(function (e, raw) {
      linePath.setAttribute("opacity", raw > 0 ? 1 : 0);
      linePath.setAttribute("stroke-dashoffset", (LEN + 4) * (1 - e));
    }, tDraw, dDraw, "enter");
    show(ringA, tDraw + dDraw - 0.1, 0.25);
    m.pop(ticks.name, tAddr + 0.05);
    ringOut("name", tAddr + 0.05);
    Loom.tween(fadeG, { opacity: 1 }, { opacity: 0, duration: 0.35, ease: "none" }, tDate, meta("b06.match_out"));

    /* 3. date: label blue, the today marker slides inside the bar, tick on "expired" */
    labelTo("name", tDate, false);
    labelTo("date", tDate, true);
    if (todayG) {
      var p0 = (todayX - 178) / 346;
      var p1 = p0 < 0.5 ? 0.62 : 0.4;
      Loom.tween(todayG, { x: todayX }, { x: 178 + 346 * p1, duration: Math.max(0.5, tExp - tDate - 0.3), ease: "power2.inOut" }, tDate + 0.1, meta("b06.today"));
    }
    m.pop(ticks.date, tExp - 0.05);
    ringOut("date", tExp - 0.05);
  }
});
