Loom.lesson = Loom.lesson || {};
(function () {
  "use strict";
  var svg = function () { return Loom.svg.apply(null, arguments); };
  var BEAT = function () { return (Loom.ctxBeat && Loom.ctxBeat.id) || "kit"; };
  var XF = 0.18;

  /* tiny helpers shared by every part */
  function fade(node, from, to, t, name) {
    Loom.tween(node, { opacity: from }, { opacity: to, duration: XF, ease: "none" }, t, { kind: "state", beat: BEAT(), name: name || "kit.fade", content: true });
  }
  /* a set of mutually exclusive groups: show one at t (hard cut with a short crossfade) */
  function chooser(groups, first, label) {
    var cur = first;
    Object.keys(groups).forEach(function (k) { groups[k].setAttribute("opacity", k === first ? 1 : 0); });
    return function (name, t) {
      if (!groups[name]) { Loom.error("kit_state", label + ": unknown state " + name); return; }
      if (name === cur) return;
      fade(groups[cur], 1, 0, t, label + ".out");
      fade(groups[name], 0, 1, t, label + ".in");
      cur = name;
    };
  }
  /* a layer that is on or off: used for blue copies that are one clean state */
  function toggler(node, startOn, label) {
    var on = !!startOn;
    node.setAttribute("opacity", on ? 1 : 0);
    return function (v, t) {
      v = !!v;
      if (v === on) return;
      fade(node, on ? 1 : 0, v ? 1 : 0, t, label);
      on = v;
    };
  }
  function txt(ctx, g, s, o) { return ctx.kit.text(g, s, o); }
  /* the root group of a part: drawn at natural size, scaled by opts.w / opts.h (never both distorted) */
  function scaled(parent, nw, nh, opts) {
    opts = opts || {};
    var k = opts.w ? opts.w / nw : (opts.h ? opts.h / nh : (opts.scale || 1));
    var root = svg("g", k === 1 ? {} : { transform: "scale(" + k.toFixed(4) + ")" }, parent);
    return { root: root, k: k };
  }
  var MONO = "JetBrains Mono, ui-monospace, monospace";
  /* a mono line drawn as raw svg text (fixed advance 0.6 em): size is chosen so n glyphs fit w */
  function mono(ctx, g, s, x, y, size, color, weight) {
    var t = svg("text", { x: x, y: y, "font-family": MONO, "font-size": size, "font-weight": weight || 400, fill: ctx.c(color || "ink"), "dominant-baseline": "middle" }, g);
    t.textContent = s;
    return t;
  }

  /* ------------------------------------------------------------------ padlock (2D)
   * anatomy: body (rounded rect + keyhole), shackle (arch). Three variants stacked: open (muted, shackle raised and
   * swung), closed_named (accent), closed_held (ink). Natural size 96 x 96. opts.size scales. */
  function padlockBuild(ctx, g, size) {
    var k = (size || 96) / 96;
    var root = svg("g", { transform: "scale(" + k.toFixed(4) + ")" }, g);
    var groups = {}, shackles = {};
    function variant(name, tone, raised) {
      var v = svg("g", {}, root);
      var sh = svg("g", {}, v);
      svg("path", { d: raised ? "M30 44 V28 C30 12 44 6 56 6 C66 6 72 12 72 22 V26" : "M28 44 V30 C28 14 38 8 48 8 C58 8 68 14 68 30 V44", fill: "none", stroke: ctx.c(tone), "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round" }, sh);
      svg("rect", { x: 14, y: 44, width: 68, height: 46, rx: 10, fill: ctx.c(tone) }, v);
      svg("circle", { cx: 48, cy: 64, r: 6.5, fill: ctx.c("surface") }, v);
      svg("rect", { x: 45, y: 66, width: 6, height: 12, rx: 3, fill: ctx.c("surface") }, v);
      groups[name] = v; shackles[name] = sh;
      return v;
    }
    variant("open", "muted", true);
    variant("closed_named", "accent", false);
    variant("closed_held", "ink", false);
    return { root: root, groups: groups, shackles: shackles };
  }
  Loom.lesson.padlock = function (ctx, parent, opts) {
    opts = opts || {};
    var size = opts.size || opts.w || 96;
    var P = padlockBuild(ctx, parent, size);
    var go = chooser(P.groups, opts.state || "open", "padlock");
    var h = { el: P.root, size: size, w: size, h: size, groups: P.groups, anchors: { centre: { x: size / 2, y: size / 2 } } };
    h.setState = function (name, t) {
      go(name, t || 0);
      if (name === "closed_named" || name === "closed_held") {
        /* the close motion: the shackle drops onto the body as the closed variant arrives */
        var sh = P.shackles[name];
        Loom.tween(sh, { y: -10 }, { y: 0, duration: 0.28, ease: "power2.out" }, t || 0, { kind: "state", beat: BEAT(), name: "padlock.close" });
      }
    };
    return h;
  };

  /* ------------------------------------------------------------------ step_bar
   * three white tiles in a row, 1200 x 90; each tile has layers shown / named / done, plus a hidden state (opacity 0).
   * setState(name, t, i) applies to tile i (1..3) or to all tiles; all_done = every tile done. */
  Loom.lesson.step_bar = function (ctx, parent, opts) {
    opts = opts || {};
    var kit = ctx.kit;
    var W = 1200, H = 90, gap = 30;
    var TW = (W - 2 * gap) / 3;
    var LABELS = ["Prove who", "Agree a key", "Scramble"];
    var S = scaled(parent, W, H, opts), root = S.root;
    var tiles = [];
    LABELS.forEach(function (label, i) {
      var x = i * (TW + gap);
      var tile = svg("g", { transform: "translate(" + x + " 0)" }, root);
      var layers = {};
      function layer(name, cardFill, discFill, numColor, textColor, stroke) {
        var L = svg("g", {}, tile);
        kit.rect(L, 0, 0, TW, H, { fill: cardFill, r: 20, stroke: stroke || "surface2", sw: 2, shadow: name !== "named" });
        kit.disc(L, 48, H / 2, 24, { fill: discFill });
        if (name === "done") { kit.icon(L, "check", { x: 48, y: H / 2, size: 28, color: "onAccent" }); }
        else { txt(ctx, L, String(i + 1), { role: "label", size: 28, x: 24, y: 0, w: 48, h: H, align: "center", valign: "middle", maxLines: 1, weight: 700, color: numColor }); }
        txt(ctx, L, label, { role: "label", size: 30, x: 88, y: 0, w: TW - 104, h: H, valign: "middle", maxLines: 1, weight: 700, color: textColor });
        layers[name] = L;
      }
      layer("shown", "surface", "surface2", "ink", "ink");
      layer("named", "accent", "surface", "accent", "onAccent", "accent");
      layer("done", "surface", "ink", "onAccent", "ink");
      var go = chooser(layers, "shown", "step" + (i + 1));
      tile.setAttribute("opacity", 0);
      tiles.push({ g: tile, layers: layers, go: go, vis: false, state: "hidden" });
    });
    var h = { el: root, k: S.k, w: W * S.k, h: H * S.k, tiles: tiles.map(function (T) { return T.g; }), anchors: {} };
    tiles.forEach(function (T, i) { h.anchors["tile" + (i + 1)] = { x: i * (TW + gap) + TW / 2, y: H / 2 }; });
    function setTile(i, name, t) {
      var T = tiles[i - 1];
      if (!T) return;
      if (name === "hidden") { if (T.vis) fade(T.g, 1, 0, t, "step.hide"); T.vis = false; return; }
      var st = name === "all_done" ? "done" : name;
      if (!T.vis) { fade(T.g, 0, 1, t, "step.show"); T.vis = true; }
      T.go(st, t);
    }
    h.setTile = setTile;
    h.setState = function (name, t, i) {
      if (i) setTile(i, name, t || 0);
      else [1, 2, 3].forEach(function (n) { setTile(n, name, t || 0); });
    };
    return h;
  };

  /* ------------------------------------------------------------------ network_path (stub for the preview of the first three) */
  /* ------------------------------------------------------------------ network_path (760 x 120)
   * a 3 px line at y 60, four round nodes (surface2 discs, 2 px line edge), node1 labelled Shared wifi, and two
   * trip-band layers (ink, accent) that thicken the line for the private trip. at(p) and travel() move tokens. */
  Loom.lesson.network_path = function (ctx, parent, opts) {
    opts = opts || {};
    var kit = ctx.kit;
    var W = 760, H = 120, LY = 60;
    var FR = [0.14, 0.38, 0.62, 0.86];
    var S = scaled(parent, W, H, opts), root = S.root;
    kit.line(root, 0, LY, W, LY, { stroke: "line", sw: 3 });
    var bandInk = svg("rect", { x: 0, y: LY - 8, width: W, height: 16, rx: 8, fill: ctx.c("ink") }, root);
    var bandBlue = svg("rect", { x: 0, y: LY - 8, width: W, height: 16, rx: 8, fill: ctx.c("accent") }, root);
    var nodes = [], anchors = {};
    FR.forEach(function (f, i) {
      var x = f * W;
      var n = svg("circle", { cx: x, cy: LY, r: 19, fill: ctx.c("surface2"), stroke: ctx.c("line"), "stroke-width": 2 }, root);
      nodes.push(n);
      anchors["node" + (i + 1)] = { x: x * S.k, y: LY * S.k };
    });
    var label = txt(ctx, root, "Shared wifi", { role: "label", size: 28, x: FR[0] * W - 110, y: LY + 26, w: 220, h: 36, align: "center", valign: "middle", maxLines: 1, weight: 500, color: "muted" });
    var setInk = toggler(bandInk, false, "path.band_ink"), setBlue = toggler(bandBlue, false, "path.band_blue");
    var h = { el: root, k: S.k, w: W * S.k, h: H * S.k, line: LY * S.k, nodes: nodes, label: label, bandInk: bandInk, bandBlue: bandBlue, anchors: anchors };
    /* a point at position p (0 = the browser end, 1 = the server end), in the parent's coordinates */
    h.at = function (p) { return { x: p * W * S.k, y: LY * S.k }; };
    /* move a ctx.el token along the path from position a to b: the token's own (0,0) must sit at at(a) */
    h.travel = function (E, t, o) {
      o = o || {};
      var a = o.from == null ? 0 : o.from, b = o.to == null ? 1 : o.to;
      ctx.m.travel(E, t, { x: (b - a) * W * S.k, y: 0, dur: o.dur || 1.2 });
    };
    /* plain, or trip_band (tone: ink by default, accent when the narration names it) */
    h.setState = function (name, t, tone) {
      t = t || 0;
      if (name === "trip_band") {
        if (tone === "accent") { setBlue(true, t); setInk(false, t); }
        else { setInk(true, t); setBlue(false, t); }
      } else { setInk(false, t); setBlue(false, t); }
    };
    return h;
  };

  /* ------------------------------------------------------------------ browser_window (520 x 550)
   * title strip (ink, three muted dots), address bar (padlock slot, scheme + host), content area: login form or
   * warning panel. States are three independent switches: address (http, https, lookalike_address) and content
   * (login_form, warning). The padlock slot holds a 44 px padlock (open, muted, until a beat closes it). */
  Loom.lesson.browser_window = function (ctx, parent, opts) {
    opts = opts || {};
    var kit = ctx.kit;
    var W = 520, H = 550, TS = 56, BARY = 56, BARH = 72;
    var S = scaled(parent, W, H, opts), root = S.root;
    var HOST = opts.address || "login.example.com", FAKE = opts.lookalike || "login-example.co";
    kit.rect(root, 0, 0, W, H, { fill: "surface", r: 20, stroke: "surface2", sw: 2, shadow: true });
    svg("path", { d: "M0 20 Q0 0 20 0 H" + (W - 20) + " Q" + W + " 0 " + W + " 20 V" + TS + " H0 Z", fill: ctx.c("ink") }, root);
    [0, 1, 2].forEach(function (i) { svg("circle", { cx: 32 + i * 26, cy: TS / 2, r: 7, fill: ctx.c("muted") }, root); });
    svg("rect", { x: 0, y: BARY, width: W, height: BARH, fill: ctx.c("surface2") }, root);
    var bar = { x: 16, y: BARY + 10, w: W - 32, h: BARH - 20 };
    kit.rect(root, bar.x, bar.y, bar.w, bar.h, { fill: "surface", r: 10, shadow: false });
    /* padlock slot, just left of the address */
    var padG = svg("g", { transform: "translate(" + (bar.x + 12) + " " + (bar.y + (bar.h - 44) / 2) + ")" }, root);
    var padlock = Loom.lesson.padlock(ctx, padG, { size: 44 });
    /* address: one size for every variant, fitted to the longest */
    var ax = bar.x + 12 + 44 + 10, aw = bar.x + bar.w - 12 - ax;
    var fit = kit.fit("https://" + HOST, { role: "label", w: aw, h: bar.h, maxLines: 1, weight: 700 });
    var asz = Math.min(28, fit.size);
    function addr(scheme, host) {
      var g = svg("g", {}, root);
      var F = kit.fit(scheme, { role: "label", size: asz, w: 2000, h: bar.h, maxLines: 1, weight: 500 });
      txt(ctx, g, scheme, { role: "label", size: asz, x: ax, y: bar.y, w: F.width + 4, h: bar.h, valign: "middle", maxLines: 1, weight: 500, color: "muted" });
      txt(ctx, g, host, { role: "label", size: asz, x: ax + F.width, y: bar.y, w: aw - F.width, h: bar.h, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
      return g;
    }
    var addrGroups = { http: addr("http://", HOST), https: addr("https://", HOST), lookalike_address: addr("https://", FAKE) };
    var goAddr = chooser(addrGroups, opts.scheme === "https" ? "https" : "http", "browser.address");
    /* content area */
    var CY = BARY + BARH + 14;
    var form = svg("g", {}, root);
    var PX = 32, FW = W - 64;
    function field(g, y, labelText, value, dots) {
      txt(ctx, g, labelText, { role: "label", size: 28, x: PX, y: y, w: FW, h: 36, valign: "middle", maxLines: 1, weight: 500, color: "muted" });
      kit.rect(g, PX, y + 40, FW, 64, { fill: "field", r: 6, stroke: "surface2", sw: 2, shadow: false });
      if (dots) { for (var i = 0; i < 7; i++) svg("circle", { cx: PX + 28 + i * 26, cy: y + 72, r: 8, fill: ctx.c("ink") }, g); }
      else { mono(ctx, g, value, PX + 20, y + 73, 28, "ink", 400); }
    }
    field(form, CY + 6, "User", "alex", false);
    field(form, CY + 128, "Password", "", true);
    kit.rect(form, PX, CY + 272, FW, 68, { fill: "muted", r: 10, shadow: false });
    txt(ctx, form, "Log in", { role: "label", size: 30, x: PX, y: CY + 272, w: FW, h: 68, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "onAccent" });
    /* warning panel over the content area */
    var warn = svg("g", {}, root);
    var wp = { x: 20, y: CY - 2, w: W - 40, h: H - CY - 22 };
    kit.rect(warn, wp.x, wp.y, wp.w, wp.h, { fill: "surface", r: 14, stroke: "surface2", sw: 2, shadow: true });
    kit.mark(warn, "no", wp.x + wp.w / 2, wp.y + 80, 84);
    txt(ctx, warn, "Warning", { role: "title", size: 60, x: wp.x + 20, y: wp.y + 142, w: wp.w - 40, h: 84, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    txt(ctx, warn, "Name does not match", { role: "body", size: 30, x: wp.x + 20, y: wp.y + 234, w: wp.w - 40, h: 48, align: "center", valign: "middle", maxLines: 1, weight: 500, color: "muted" });
    var goContent = chooser({ login_form: form, warning: warn }, opts.content === "warning" ? "warning" : "login_form", "browser.content");
    var h = { el: root, k: S.k, w: W * S.k, h: H * S.k, form: form, warning: warn, padlock: padlock, addr: addrGroups, anchors: {
      address: { x: ax * S.k, y: (bar.y + bar.h / 2) * S.k, w: aw * S.k, h: bar.h * S.k },
      padlock: { x: (bar.x + 12 + 22) * S.k, y: (bar.y + bar.h / 2) * S.k },
      key_slot: { x: (W - 24) * S.k, y: (H - 24) * S.k },
      packet_out: { x: W * S.k, y: 296 * S.k },
      check_panel: { x: W * S.k, y: (H / 2) * S.k }
    } };
    h.setState = function (name, t) {
      t = t || 0;
      if (name === "http" || name === "https" || name === "lookalike_address") goAddr(name, t);
      else if (name === "login_form" || name === "warning") goContent(name, t);
      else Loom.error("kit_state", "browser_window: unknown state " + name);
    };
    return h;
  };

  /* ------------------------------------------------------------------ server_box (380 x 530)
   * three stacked units (surface, surface2 edge, muted status dots), a name pill hanging below, a data store drum
   * (slate) that can be outlined dashed. States: idle, receiving (top unit lights ink), data_store_outlined. */
  Loom.lesson.server_box = function (ctx, parent, opts) {
    opts = opts || {};
    var kit = ctx.kit;
    var W = 380, H = 530, RX = 40, RW = 300, UH = 88, UG = 12;
    var S = scaled(parent, W, H, opts), root = S.root;
    var units = [];
    for (var i = 0; i < 3; i++) {
      var y = i * (UH + UG);
      var u = svg("g", {}, root);
      kit.rect(u, RX, y, RW, UH, { fill: "surface", r: 14, stroke: "surface2", sw: 3, shadow: true });
      kit.rect(u, RX + 28, y + UH / 2 - 5, 130, 10, { fill: "surface2", r: 5, shadow: false });
      [0, 1].forEach(function (d) { svg("circle", { cx: RX + RW - 36 - d * 28, cy: y + UH / 2, r: 8, fill: ctx.c("muted") }, u); });
      units.push(u);
    }
    /* receiving: the top unit's dots light ink (a copy of the dots drawn over the muted ones) */
    var lit = svg("g", {}, root);
    [0, 1].forEach(function (d) { svg("circle", { cx: RX + RW - 36 - d * 28, cy: UH / 2, r: 8, fill: ctx.c("ink") }, lit); });
    svg("rect", { x: RX + 28, y: UH / 2 - 5, width: 130, height: 10, rx: 5, fill: ctx.c("line") }, lit);
    var setLit = toggler(lit, false, "server.receiving");
    /* name pill on a 2 px muted leader */
    var RB = 3 * UH + 2 * UG;
    kit.line(root, W / 2, RB, W / 2, RB + 30, { stroke: "muted", sw: 2 });
    var pill = svg("g", {}, root);
    kit.rect(pill, 20, RB + 30, W - 40, 60, { fill: "surface", r: 30, stroke: "surface2", sw: 2, shadow: true });
    txt(ctx, pill, "login.example.com", { role: "label", size: 28, x: 36, y: RB + 30, w: W - 72, h: 60, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    /* data store drum */
    var DY = 420, DW = 140, DH = 96, ER = 16, DX = (W - DW) / 2;
    var drum = svg("g", {}, root);
    svg("path", { d: "M" + DX + " " + (DY + ER) + " V" + (DY + DH - ER) + " A" + (DW / 2) + " " + ER + " 0 0 0 " + (DX + DW) + " " + (DY + DH - ER) + " V" + (DY + ER) + " Z", fill: ctx.c("accent3") }, drum);
    svg("ellipse", { cx: W / 2, cy: DY + ER, rx: DW / 2, ry: ER, fill: ctx.c("accent3") }, drum);
    svg("ellipse", { cx: W / 2, cy: DY + ER, rx: DW / 2 - 8, ry: ER - 5, fill: ctx.c("surface2"), opacity: 0.55 }, drum);
    svg("path", { d: "M" + DX + " " + (DY + DH / 2) + " A" + (DW / 2) + " " + ER + " 0 0 0 " + (DX + DW) + " " + (DY + DH / 2), fill: "none", stroke: ctx.c("surface2"), "stroke-width": 3, opacity: 0.6 }, drum);
    /* dashed outline: the same silhouette, a little larger, dashed muted, no fill */
    var out = svg("g", {}, root);
    var P = 10, OX = DX - P, OW = DW + 2 * P, OY = DY - P, OH = DH + 2 * P;
    svg("path", { d: "M" + OX + " " + (OY + ER) + " A" + (OW / 2) + " " + ER + " 0 0 1 " + (OX + OW) + " " + (OY + ER) + " V" + (OY + OH - ER) + " A" + (OW / 2) + " " + ER + " 0 0 1 " + OX + " " + (OY + OH - ER) + " Z", fill: "none", stroke: ctx.c("muted"), "stroke-width": 3, "stroke-dasharray": "10 8", "stroke-linecap": "round", "stroke-linejoin": "round" }, out);
    svg("path", { d: "M" + OX + " " + (OY + ER) + " A" + (OW / 2) + " " + ER + " 0 0 0 " + (OX + OW) + " " + (OY + ER), fill: "none", stroke: ctx.c("muted"), "stroke-width": 3, "stroke-dasharray": "10 8", "stroke-linecap": "round" }, out);
    var setOut = toggler(out, !!opts.outlined, "server.outline");
    var h = { el: root, k: S.k, w: W * S.k, h: H * S.k, units: units, pill: pill, drum: drum, outline: out, anchors: {
      packet_in: { x: RX * S.k, y: (RB / 2) * S.k },
      key_slot: { x: RX * S.k, y: (RB + 40) * S.k },
      data_store: { x: (W / 2) * S.k, y: (DY + DH / 2) * S.k },
      cert_out: { x: RX * S.k, y: (UH / 2) * S.k }
    } };
    h.setState = function (name, t) {
      t = t || 0;
      if (name === "idle") { setLit(false, t); setOut(false, t); }
      else if (name === "receiving") setLit(true, t);
      else if (name === "data_store_outlined") setOut(true, t);
      else Loom.error("kit_state", "server_box: unknown state " + name);
    };
    return h;
  };
  /* seeded scrambled glyph rows: the same text everywhere it is asked for (never Math.random) */
  var GLYPHS = "#%&@$?/<>~^*+=|:;!";
  function scramble(seedName, rows, cols) {
    var rng = Loom.rng(seedName), out = [];
    for (var r = 0; r < rows; r++) {
      var s = "";
      for (var c = 0; c < cols; c++) s += GLYPHS.charAt(Math.floor(rng() * GLYPHS.length));
      out.push(s);
    }
    return out;
  }

  /* ------------------------------------------------------------------ watcher (360 x 440)
   * the passive watcher: an ink disc (centre 180, 400, r 38) with a white Lucide eye, and a panel above it
   * (0..320) titled Watcher with one of three contents: copied, signals, noise. No person, no face. */
  Loom.lesson.watcher = function (ctx, parent, opts) {
    opts = opts || {};
    var kit = ctx.kit;
    var W = 360, H = 440, PH = 320, DCX = 180, DCY = 402, DR = 38;
    var S = scaled(parent, W, H, opts), root = S.root;
    /* panel */
    var panel = svg("g", {}, root);
    kit.rect(panel, 0, 0, W, PH, { fill: "surface", r: 20, stroke: "surface2", sw: 2, shadow: true });
    txt(ctx, panel, "Watcher", { role: "label", size: 30, x: 28, y: 14, w: W - 56, h: 44, valign: "middle", maxLines: 1, weight: 700, color: "muted" });
    var stem = svg("g", {}, root);
    kit.line(stem, DCX, PH, DCX, DCY - DR, { stroke: "muted", sw: 2 });
    var contents = {};
    function foot(g, s) { txt(ctx, g, s, { role: "label", size: 28, x: 24, y: PH - 62, w: W - 48, h: 44, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" }); }
    /* copied: the packet's words, readable */
    var cp = svg("g", {}, panel);
    kit.rect(cp, 24, 66, W - 48, 150, { fill: "field", r: 10, stroke: "surface2", sw: 2, shadow: false });
    txt(ctx, cp, "Login", { role: "label", size: 28, x: 40, y: 72, w: W - 80, h: 42, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    mono(ctx, cp, "user: alex", 40, 138, 26, "ink", 400);
    mono(ctx, cp, "password: harbour", 40, 180, 26, "ink", 400);
    foot(cp, "Plain HTTP: readable");
    contents.copied = cp;
    /* signals: the two recorded chips (slate and amber) and a dashed key slot holding a question mark */
    var sg = svg("g", {}, panel);
    [["accent3", "arrow-right", 40], ["accent2", "arrow-left", 126]].forEach(function (c) {
      kit.rect(sg, c[2], 78, 76, 52, { fill: c[0], r: 10, shadow: false });
      kit.icon(sg, c[1], { x: c[2] + 38, y: 104, size: 30, color: "onAccent" });
    });
    var slot = { x: 218, y: 70, w: 100, h: 144 };
    svg("rect", { x: 219, y: 71, width: 100, height: 66, rx: 10, fill: "none", stroke: ctx.c("muted"), "stroke-width": 3, "stroke-dasharray": "10 8", "stroke-linecap": "round" }, sg);
    var qm = svg("text", { x: 269, y: 106, "font-family": "Space Grotesk, Inter, sans-serif", "font-size": 60, "font-weight": 700, fill: ctx.c("ink"), "text-anchor": "middle", "dominant-baseline": "middle" }, sg);
    qm.textContent = "?";
    foot(sg, "Watcher: no key");
    contents.signals = sg;
    void slot;
    /* noise: a block of scrambled glyphs, muted */
    var nz = svg("g", {}, panel);
    kit.rect(nz, 24, 66, W - 48, 150, { fill: "field", r: 10, stroke: "surface2", sw: 2, shadow: false });
    scramble("watcher-noise", 4, 17).forEach(function (row, i) { mono(ctx, nz, row, 40, 90 + i * 31, 26, "muted", 400); });
    foot(nz, "Watcher: noise");
    contents.noise = nz;
    var goContent = chooser(contents, opts.content || "copied", "watcher.content");
    /* the disc and its eye: open and closed layers */
    var disc = svg("g", {}, root);
    kit.disc(disc, DCX, DCY, DR, { fill: "ink" });
    var eyeOpen = svg("g", {}, disc), eyeShut = svg("g", {}, disc);
    kit.icon(eyeOpen, "eye", { x: DCX, y: DCY, size: 44, color: "onAccent" });
    kit.icon(eyeShut, "eye-off", { x: DCX, y: DCY, size: 44, color: "onAccent" });
    var setOpen = toggler(eyeOpen, true, "watcher.eye_open"), setShut = toggler(eyeShut, false, "watcher.eye_shut");
    var setDisc = toggler(disc, false, "watcher.disc");
    var setPanel = toggler(panel, false, "watcher.panel"), setStem = toggler(stem, false, "watcher.stem");
    var cur = "hidden";
    var h = { el: root, k: S.k, w: W * S.k, h: H * S.k, disc: disc, panel: panel, eyeOpen: eyeOpen, anchors: {
      node: { x: DCX * S.k, y: DCY * S.k },
      panel_top: { x: DCX * S.k, y: 0 },
      panel: { x: 0, y: 0, w: W * S.k, h: PH * S.k }
    } };
    /* the eye pulses once: the disc swells and settles (0.5 s) */
    h.pulse = function (t) {
      Loom.tween(disc, { scale: 1, transformOrigin: DCX + "px " + DCY + "px" }, { scale: 1.18, duration: 0.2, ease: "power2.out" }, t, { kind: "state", beat: BEAT(), name: "watcher.pulse" });
      Loom.tween(disc, { scale: 1.18, transformOrigin: DCX + "px " + DCY + "px" }, { scale: 1, duration: 0.3, ease: "power2.inOut", immediateRender: false }, t + 0.2, { kind: "state", beat: BEAT(), name: "watcher.pulse" });
    };
    h.setEye = function (open, t) { setOpen(open, t || 0); setShut(!open, t || 0); };
    h.setState = function (name, t) {
      t = t || 0;
      if (name === "hidden") { setDisc(false, t); setPanel(false, t); setStem(false, t); }
      else if (name === "eye_open") { setDisc(true, t); setPanel(false, t); setStem(false, t); h.setEye(true, t); }
      else if (name === "eye_closed") { setDisc(true, t); setPanel(false, t); setStem(false, t); h.setEye(false, t); }
      else if (contents[name]) {
        setDisc(true, t); h.setEye(true, t);
        var firstOpen = cur === "hidden" || cur === "eye_open" || cur === "eye_closed";
        if (firstOpen) { setPanel(true, t); setStem(true, t); }
        goContent(name, t);
      } else Loom.error("kit_state", "watcher: unknown state " + name);
      cur = name;
    };
    return h;
  };

  /* ------------------------------------------------------------------ login_packet (324 x 180)
   * a small card (312 x 156 at 6, 18). Content rows (title, user, password) each have a plain layer and a noise
   * layer (plus an altered layer on the last row); a frame layer (the TLS wrap, accent or ink) and a rejected
   * overlay (dim + cross). morph(to, t0, dur) swaps the rows one after another (plain to noise and back). */
  Loom.lesson.login_packet = function (ctx, parent, opts) {
    opts = opts || {};
    var kit = ctx.kit;
    var W = 324, H = 180, CX = 6, CY = 18, CW = 312, CH = 156;
    var S = scaled(parent, W, H, opts), root = S.root;
    var card = svg("g", {}, root);
    kit.rect(card, CX, CY, CW, CH, { fill: "surface", r: 14, stroke: "surface2", sw: 2, shadow: true });
    var noise = scramble("packet-noise", 3, 17), alt = scramble("packet-altered", 3, 17);
    var rows = [];
    var RY = [CY + 36, CY + 88, CY + 126];
    function row(i, plainDraw, noiseStr, altStr) {
      var plain = svg("g", {}, card), nz = svg("g", {}, card), al = svg("g", {}, card);
      plainDraw(plain);
      mono(ctx, nz, noiseStr, CX + 20, RY[i], 24, "muted", 400);
      /* the altered block: a few glyphs swapped and set in ink on a tinted block */
      if (i === 2) {
        mono(ctx, al, noiseStr.slice(0, 6), CX + 20, RY[i], 24, "muted", 400);
        kit.rect(al, CX + 20 + 6 * 14.4 - 3, RY[i] - 17, 6 * 14.4 + 6, 34, { fill: "surface2", r: 6, shadow: false });
        mono(ctx, al, altStr.slice(0, 6), CX + 20 + 6 * 14.4, RY[i], 24, "ink", 700);
        mono(ctx, al, noiseStr.slice(12), CX + 20 + 12 * 14.4, RY[i], 24, "muted", 400);
      } else { mono(ctx, al, noiseStr, CX + 20, RY[i], 24, "muted", 400); }
      rows.push({ go: chooser({ plain: plain, noise: nz, altered: al }, "plain", "packet.row" + i) });
    }
    row(0, function (g) { txt(ctx, g, "Login", { role: "lead", size: 34, x: CX + 20, y: CY + 12, w: CW - 40, h: 48, valign: "middle", maxLines: 1, weight: 700, color: "ink" }); }, noise[0], alt[0]);
    row(1, function (g) { mono(ctx, g, "user: alex", CX + 20, RY[1], 24, "ink", 400); }, noise[1], alt[1]);
    row(2, function (g) { mono(ctx, g, "password: harbour", CX + 20, RY[2], 24, "ink", 400); }, noise[2], alt[2]);
    /* the TLS wrap: a 4 px outline round the card and a TLS tab, in accent (named) or ink (held) */
    function frame(tone) {
      var f = svg("g", {}, root);
      svg("rect", { x: 2, y: 14, width: W - 4, height: H - 18, rx: 18, fill: "none", stroke: ctx.c(tone), "stroke-width": 4 }, f);
      kit.rect(f, 22, 0, 92, 36, { fill: tone, r: 10, shadow: false });
      txt(ctx, f, "TLS", { role: "label", size: 28, x: 22, y: 0, w: 92, h: 36, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "onAccent" });
      return f;
    }
    var wrapBlue = frame("accent"), wrapInk = frame("ink");
    var setWrapBlue = toggler(wrapBlue, false, "packet.wrap_blue"), setWrapInk = toggler(wrapInk, false, "packet.wrap_ink");
    /* rejected: a dimming veil and a cross mark */
    var rej = svg("g", {}, root);
    kit.rect(rej, CX, CY, CW, CH, { fill: "surface", r: 14, shadow: false });
    rej.firstChild && rej.firstChild.setAttribute("opacity", 0.62);
    kit.mark(rej, "no", CX + CW - 38, CY + 38, 52);
    var setRej = toggler(rej, false, "packet.rejected");
    var cur = "plain";
    var h = { el: root, k: S.k, w: W * S.k, h: H * S.k, card: card, rows: rows, anchors: { centre: { x: (W / 2) * S.k, y: (H / 2 + 6) * S.k }, left: { x: 0, y: (H / 2 + 6) * S.k }, right: { x: W * S.k, y: (H / 2 + 6) * S.k } } };
    /* swap the content rows to "plain", "noise" or "altered" one after another from t0 over dur (the scramble) */
    h.morph = function (to, t0, dur) {
      dur = dur == null ? 0.4 : dur;
      rows.forEach(function (r, i) { r.go(to, (t0 || 0) + (rows.length > 1 ? i * dur / (rows.length - 1) : 0)); });
    };
    h.setState = function (name, t) {
      t = t || 0;
      if (name === "plain") { h.morph("plain", t, 0); setWrapBlue(false, t); setWrapInk(false, t); setRej(false, t); }
      else if (name === "wrapped") { h.morph("plain", t, 0); setWrapBlue(true, t); setWrapInk(false, t); setRej(false, t); }
      else if (name === "wrapped_ink") { h.morph("plain", t, 0); setWrapBlue(false, t); setWrapInk(true, t); setRej(false, t); }
      else if (name === "noise") { h.morph("noise", t, 0); setWrapBlue(false, t); setWrapInk(false, t); setRej(false, t); }
      else if (name === "altered") { h.morph("altered", t, 0); setRej(false, t); }
      else if (name === "rejected") { h.morph("altered", t, 0); setRej(true, t); }
      else Loom.error("kit_state", "login_packet: unknown state " + name);
      cur = name;
    };
    return h;
  };
  /* ------------------------------------------------------------------ certificate_card (620 x 420)
   * two forms stacked at the origin: small (300 x 200: seal, site name, three row bars) and in_panel (620 x 420:
   * seal, title login.example.com, rows Issuer / Name / Date with a mark slot each). The Date row is a validity
   * bar with a today marker (no digits). Row highlight (accent label) is one row at a time. */
  Loom.lesson.certificate_card = function (ctx, parent, opts) {
    opts = opts || {};
    var kit = ctx.kit;
    var W = 620, H = 420;
    var S = scaled(parent, W, H, opts), root = S.root;
    var SITE = "login.example.com";
    /* the small form */
    var small = svg("g", {}, root);
    kit.rect(small, 0, 0, 300, 200, { fill: "surface", r: 20, stroke: "surface2", sw: 2, shadow: true });
    kit.disc(small, 54, 50, 26, { fill: "accent3" });
    kit.icon(small, "award", { x: 54, y: 50, size: 30, color: "onAccent" });
    txt(ctx, small, SITE, { role: "label", size: 28, x: 24, y: 88, w: 252, h: 40, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    [[24, 240], [24, 170], [24, 208]].forEach(function (b, i) { kit.rect(small, b[0], 140 + i * 18, b[1], 10, { fill: "surface2", r: 5, shadow: false }); });
    /* the large form */
    var big = svg("g", {}, root);
    kit.rect(big, 0, 0, W, H, { fill: "surface", r: 20, stroke: "surface2", sw: 2, shadow: true });
    kit.disc(big, 62, 54, 28, { fill: "accent3" });
    kit.icon(big, "award", { x: 62, y: 54, size: 32, color: "onAccent" });
    txt(ctx, big, SITE, { role: "lead", size: 40, x: 108, y: 24, w: 480, h: 60, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    kit.line(big, 36, 100, W - 36, 100, { stroke: "surface2", sw: 3 });
    var RH = 96, R0 = 108, VX = 178, VW = 346, MX = 568;
    var names = ["issuer", "name", "date"], labels = ["Issuer", "Name", "Date"];
    var rowEl = {};
    names.forEach(function (n, i) {
      var y = R0 + i * RH, cy = y + RH / 2, g = svg("g", {}, big);
      var muted = svg("g", {}, g), blue = svg("g", {}, g);
      txt(ctx, muted, labels[i], { role: "label", size: 30, x: 36, y: y, w: 132, h: RH, valign: "middle", maxLines: 1, weight: 700, color: "muted" });
      txt(ctx, blue, labels[i], { role: "label", size: 30, x: 36, y: y, w: 132, h: RH, valign: "middle", maxLines: 1, weight: 700, color: "accent" });
      var hl = toggler(blue, false, "cert.hl_" + n);
      var tick = svg("g", {}, g), cross = svg("g", {}, g);
      kit.mark(tick, "yes", MX, cy, 50);
      kit.mark(cross, "no", MX, cy, 50);
      var setTick = toggler(tick, false, "cert.tick_" + n), setCross = toggler(cross, false, "cert.cross_" + n);
      if (i < 2) txt(ctx, g, i === 0 ? "Trusted authority" : SITE, { role: "label", size: 30, x: VX, y: y, w: VW, h: RH, valign: "middle", maxLines: 1, weight: 500, color: "ink" });
      if (i < 2) kit.line(big, 36, y + RH, W - 36, y + RH, { stroke: "surface2", sw: 2 });
      rowEl[n] = { g: g, tick: tick, cross: cross, hl: hl, setTick: setTick, setCross: setCross, cy: cy };
    });
    /* the Date row: validity bar and a today marker that can slide inside it */
    var dc = rowEl.date.cy;
    kit.rect(big, VX, dc - 10, VW, 20, { fill: "surface2", r: 6, shadow: false });
    kit.rect(big, VX + VW * 0.2, dc - 10, VW * 0.62, 20, { fill: "accent3", r: 6, shadow: false });
    var today = svg("g", {}, big);
    kit.line(today, 0, dc - 28, 0, dc + 28, { stroke: "ink", sw: 6 });
    svg("path", { d: "M-10 " + (dc - 40) + " L10 " + (dc - 40) + " L0 " + (dc - 26) + " Z", fill: ctx.c("ink"), "stroke-linejoin": "round" }, today);
    var TX = function (p) { return VX + VW * p; };
    var todayP = opts.today == null ? 0.52 : opts.today;
    today.setAttribute("transform", "translate(" + TX(todayP).toFixed(1) + " 0)");
    var goForm = chooser({ small: small, in_panel: big }, opts.form === "small" ? "small" : "in_panel", "cert.form");
    var h = { el: root, k: S.k, w: W * S.k, h: H * S.k, small: small, big: big, rows: rowEl, today: today, anchors: {
      name_row: { x: 0, y: rowEl.name.cy * S.k }, issuer_row: { x: 0, y: rowEl.issuer.cy * S.k }, date_row: { x: 0, y: rowEl.date.cy * S.k },
      title: { x: 108 * S.k, y: 54 * S.k }, small_size: { w: 300 * S.k, h: 200 * S.k }
    } };
    /* the today marker slides from position a to b (0..1 across the bar, the range is 0.2 to 0.82) */
    h.moveToday = function (t, a, b, dur) {
      Loom.tween(today, { x: TX(a) }, { x: TX(b), duration: dur || 0.8, ease: "power2.inOut" }, t || 0, { kind: "state", beat: BEAT(), name: "cert.today" });
    };
    function highlight(n, t) { names.forEach(function (k) { rowEl[k].hl(k === n, t); }); }
    function mark(n, kind, t) {
      rowEl[n].setTick(kind === "tick", t); rowEl[n].setCross(kind === "cross", t);
      var g = kind === "tick" ? rowEl[n].tick : rowEl[n].cross;
      Loom.tween(g, { scale: 0.5, transformOrigin: MX + "px " + rowEl[n].cy + "px" }, { scale: 1, duration: 0.28, ease: "power2.out" }, t, { kind: "state", beat: BEAT(), name: "cert.pop" });
    }
    h.highlight = highlight; h.mark = mark;
    h.setState = function (name, t) {
      t = t || 0;
      if (name === "small" || name === "in_panel") goForm(name, t);
      else if (name === "row_issuer") highlight("issuer", t);
      else if (name === "row_name") highlight("name", t);
      else if (name === "row_date") highlight("date", t);
      else if (name === "tick_issuer") mark("issuer", "tick", t);
      else if (name === "tick_name") mark("name", "tick", t);
      else if (name === "tick_date") mark("date", "tick", t);
      else if (name === "name_fail") { mark("name", "cross", t); highlight(null, t); }
      else if (name === "all_pass") { names.forEach(function (n) { mark(n, "tick", t); }); highlight(null, t); }
      else Loom.error("kit_state", "certificate_card: unknown state " + name);
    };
    return h;
  };

  /* ------------------------------------------------------------------ key_exchange
   * part "end" (default; opts.side browser or server): one end of the exchange. Browser end: slot at x 0..160, own
   * mark (slate square, circle glyph) at x 176..240 on the path side; server end mirrored: own mark (amber square,
   * triangle glyph) at x 0..64, slot at x 80..240. Natural box 240 x 100, plus 60 px above for the received-signal
   * chip (y -60..0). The key (one notched shape, identical at both ends) is empty, forming (neutral outline),
   * named (accent) or held (ink); it never leaves the slot.
   * part "signal" (opts.side): the travelling chip alone, 80 x 52, slate arrow right (browser) or amber arrow left
   * (server); a beat puts it in its own ctx.el and travels it. */
  function keyShape(ctx, g, tone, stroke) {
    var k = svg("g", {}, g);
    var fill = stroke ? ctx.c("surface2") : ctx.c(tone);
    var sa = stroke ? { stroke: ctx.c("line"), "stroke-width": 3, "stroke-linejoin": "round" } : {};
    function add(tag, a) { var o = {}; Object.keys(a).forEach(function (q) { o[q] = a[q]; }); Object.keys(sa).forEach(function (q) { o[q] = sa[q]; }); o.fill = fill; return svg(tag, o, k); }
    /* bow with a hole, shaft, three notched teeth */
    add("path", { d: "M30 6 A24 24 0 1 0 30 54 A24 24 0 1 0 30 6 Z M30 21 A9 9 0 1 1 30 39 A9 9 0 1 1 30 21 Z", "fill-rule": "evenodd" });
    add("rect", { x: 48, y: 24, width: 70, height: 12, rx: 4 });
    add("rect", { x: 70, y: 34, width: 11, height: 24, rx: 3 });
    add("rect", { x: 87, y: 34, width: 11, height: 14, rx: 3 });
    add("rect", { x: 104, y: 34, width: 11, height: 20, rx: 3 });
    return k;
  }
  Loom.lesson.key_exchange = function (ctx, parent, opts) {
    opts = opts || {};
    var kit = ctx.kit;
    var side = opts.side === "server" ? "server" : "browser";
    var tone = side === "browser" ? "accent3" : "accent2", otherTone = side === "browser" ? "accent2" : "accent3";
    function chip(g, x, y, w, hh, toneT, icon) {
      var c = svg("g", {}, g);
      kit.rect(c, x, y, w, hh, { fill: toneT, r: 10, shadow: false });
      kit.icon(c, icon, { x: x + w / 2, y: y + hh / 2, size: Math.round(hh * 0.58), color: "onAccent" });
      return c;
    }
    if (opts.part === "signal") {
      var Ss = scaled(parent, 80, 52, opts);
      chip(Ss.root, 0, 0, 80, 52, tone, side === "browser" ? "arrow-right" : "arrow-left");
      return { el: Ss.root, k: Ss.k, w: 80 * Ss.k, h: 52 * Ss.k, anchors: { centre: { x: 40 * Ss.k, y: 26 * Ss.k } }, setState: function () {} };
    }
    var W = 240, H = 100;
    var S = scaled(parent, W, H, opts), root = S.root;
    var slotX = side === "browser" ? 0 : 80, markX = side === "browser" ? 176 : 0;
    /* the empty dashed slot */
    var slot = svg("g", {}, root);
    svg("rect", { x: slotX + 1.5, y: 1.5, width: 157, height: 97, rx: 10, fill: "none", stroke: ctx.c("muted"), "stroke-width": 3, "stroke-dasharray": "10 8", "stroke-linecap": "round" }, slot);
    /* the key layers, centred in the slot */
    var kx = slotX + (160 - 118) / 2, ky = 20;
    var kg = svg("g", { transform: "translate(" + kx + " " + ky + ")" }, root);
    var groups = { empty: svg("g", {}, kg), forming: svg("g", {}, kg), named: svg("g", {}, kg), held: svg("g", {}, kg) };
    keyShape(ctx, groups.forming, "surface2", true); keyShape(ctx, groups.named, "accent", false); keyShape(ctx, groups.held, "ink", false);
    var goKey = chooser(groups, opts.key || "empty", "key");
    /* the own mark (stays home) */
    var own = chip(root, markX, 18, 64, 64, tone, side === "browser" ? "circle" : "triangle");
    var setOwn = toggler(own, !!opts.marks, "key.own");
    /* the received signal: the other end's chip, which meets the own mark */
    var recv = chip(root, markX, -60, 80, 52, otherTone, side === "browser" ? "arrow-left" : "arrow-right");
    recv.setAttribute("opacity", 0);
    var cur = "slots_empty";
    var h = { el: root, k: S.k, w: W * S.k, h: H * S.k, slot: slot, key: kg, keyLayers: groups, own: own, recv: recv, side: side, anchors: {
      slot: { x: (slotX + 80) * S.k, y: 50 * S.k }, own: { x: (markX + 32) * S.k, y: 50 * S.k },
      path_side: { x: (side === "browser" ? W : 0) * S.k, y: 50 * S.k }
    } };
    h.setState = function (name, t) {
      t = t || 0;
      if (name === "slots_empty") { goKey("empty", t); setOwn(false, t); }
      else if (name === "own_marks") {
        setOwn(true, t);
        Loom.tween(own, { scale: 0.6, transformOrigin: (markX + 32) + "px 50px" }, { scale: 1, duration: 0.28, ease: "power2.out" }, t, { kind: "state", beat: BEAT(), name: "key.own_pop" });
      } else if (name === "signals_travel") { setOwn(true, t); }
      else if (name === "combine") {
        /* the received signal drops onto the own mark, then the key forms in the slot, blue as it lands */
        setOwn(true, t);
        fade(recv, 0, 1, t, "key.recv_in");
        Loom.tween(recv, { y: 0 }, { y: 58, duration: 0.4, ease: "power2.inOut" }, t, { kind: "state", beat: BEAT(), name: "key.recv_move" });
        fade(recv, 1, 0, t + 0.45, "key.recv_out");
        goKey("named", t + 0.4);
      } else if (name === "key_named") { setOwn(true, t); goKey("named", t); }
      else if (name === "key_held") { setOwn(true, t); goKey("held", t); }
      else Loom.error("kit_state", "key_exchange: unknown state " + name);
      cur = name;
    };
    return h;
  };
})();
