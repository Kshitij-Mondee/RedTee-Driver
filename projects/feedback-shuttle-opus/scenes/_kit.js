// scenes/_kit.js
// The office kit shared by every bespoke beat of this lesson (story-cartoon style).
// Parts: desk_set, week_planner, leo_laptop_message, speech_bubble, name_tag, marks_rail
// (the six the storyboard declares), plus mark_card, call_card, tue_pin: per-element
// parts a beat creates as its OWN ctx.el so each can be held and recovered independently
// via ctx.held(name).ui across continue joins (see the api note below).
//
// CONTRACT every part obeys: a part draws ONLY into the `parent` it is given (an
// element's E.inner from ctx.el), never into the station svg directly, and never
// chooses when it appears (the beat does, via ctx.el's exit/entry and setState(name,t)).
// People are never drawn here: kit.peep busts are placed by the beats.
//
// All state changes are time-gated (seek-safe on held elements): every setState branch
// drives its look only via Loom.tl.set(...) / Loom.tween(...) at the given t, never by
// mutating a shared DOM node's attribute or style directly at build time.
Loom.lesson = Loom.lesson || {};

function _scaled(parent, w, h, natW, natH) {
  var sx = (w || natW) / natW, sy = (h || natH) / natH;
  return Loom.svg("g", { transform: "scale(" + sx + " " + sy + ")" }, parent);
}
function _ellipseLen(rx, ry) {
  var h = Math.pow((rx - ry) / (rx + ry), 2);
  return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}
function _bid(ctx) { return (ctx.beat && ctx.beat.id) || "kit"; }
function _guard(ctx, parent, id) {
  if (ctx.station && parent === ctx.station.svg) {
    Loom.error("kit_misuse", id + ": draws only into an element's inner. Call " +
      "ctx.el(\"name\", {x,y,w,h,kind}) and pass E.inner as parent, never ctx.station.svg.");
  }
}
function _dur(ctx, k, f) { try { var v = ctx.style.dur(k); return v || f; } catch (e) { return f; } }

// ---------------------------------------------------------------- desk_set
// Call inside: const E = ctx.el("set", {x:0,y:0,w:1920,h:1080,kind:"scenery"});
// const set = Loom.lesson.desk_set(ctx, E.inner, {w:1920,h:1080});
// Parent the people els to set.peepLayer (not elsewhere) so the table front hides
// their lower half. setState is a pure toggle at absolute time t: safe to call from
// a later beat that holds this element (ctx.held("set").ui.setState(...)).
Loom.lesson.desk_set = function (ctx, parent, opts) {
  opts = opts || {};
  _guard(ctx, parent, "desk_set");
  var NW = 1920, NH = 1080;
  var root = _scaled(parent, opts.w, opts.h, NW, NH);

  var wall = Loom.svg("g", {}, root);
  ctx.kit.rect(wall, 0, 0, NW, NH, { fill: "surface2", crisp: true });

  var win = Loom.svg("g", {}, wall);
  ctx.kit.rect(win, 1540, 150, 260, 300, { fill: "surface", r: 6 });
  ctx.kit.line(win, 1670, 150, 1670, 450, { stroke: "muted", sw: 3 });
  ctx.kit.line(win, 1540, 300, 1800, 300, { stroke: "muted", sw: 3 });

  var peepLayer = Loom.svg("g", {}, root);

  var twoShot = Loom.svg("g", {}, root);
  ctx.kit.rect(twoShot, 0, 880, NW, NH - 880, { fill: "field2" });

  var leoClose = Loom.svg("g", { style: "display:none" }, root);
  ctx.kit.rect(leoClose, 0, 760, NW, NH - 760, { fill: "field2" });
  ctx.kit.rect(leoClose, 1280, 742, 160, 34, { fill: "surface2", r: 6 });

  var names = Loom.svg("g", { style: "display:none" }, root);
  function nameplate(g, cx, text) {
    var w = 140, h = 64, x = cx - w / 2, y = 880 - h + 10;
    var d = "M" + x + " " + (y + h) + " L" + x + " " + (y + 16) + " L" + (x + 24) + " " + y +
      " L" + (x + w - 24) + " " + y + " L" + (x + w) + " " + (y + 16) + " L" + (x + w) + " " + (y + h) + " Z";
    ctx.kit.path(g, d, { fill: "surface", stroke: "ink", sw: 5 });
    ctx.kit.text(g, text, { role: "label", x: x, y: y + 12, w: w, h: h - 18, align: "center", valign: "middle", maxLines: 1, color: "ink" });
  }
  nameplate(names, 560, "You");
  nameplate(names, 1360, "Leo");

  function setState(name, t) {
    if (name === "two_shot") {
      Loom.tl.set(twoShot, { display: "inline" }, t);
      Loom.tl.set(leoClose, { display: "none" }, t);
    } else if (name === "leo_close") {
      Loom.tl.set(leoClose, { display: "inline" }, t);
      Loom.tl.set(twoShot, { display: "none" }, t);
    } else if (name === "nameplates") {
      Loom.tl.set(names, { display: "inline" }, t);
    } else {
      Loom.error("kit_state", "desk_set: unknown state " + name);
    }
  }
  setState("two_shot", 0);

  return {
    peepLayer: peepLayer,
    anchors: {
      you: { x: 560, y: 620, size: 600 },
      leo: { x: 1360, y: 620, size: 600 },
      tableTopY: 880,
      leoCloseTableTopY: 760,
      leoLaptopEdge: { x: 1360, y: 742 }
    },
    setState: setState
  };
};

// ---------------------------------------------------------------- week_planner
// Call inside: const E = ctx.el("planner", {x,y,w:700,h:325,kind:"card"});
// const planner = Loom.lesson.week_planner(ctx, E.inner, {w:700,h:325});
// Natural size 560x260; place at 560x260 or larger (about 700x325 reads well) so
// every label clears the style's 30px floor. planner.slots(x,y,w,h) (same x,y,w,h as
// the el) returns GLOBAL points {thu, tue, nextWeekTab} for positioning the separate
// call_card and tue_pin elements on this planner.
// The due-Thursday ring is drawn as TWO stacked paths (dueInk, dueAcc, same geometry):
// whichever colour is current is shown and driven on the timeline; the other stays
// display:none. This keeps the ring's colour and its draw-on offset time-gated, so a
// later beat holding this same planner element sees the colour and progress that ITS
// own setState call asked for, never whichever call happened to run last at build time.
Loom.lesson.week_planner = function (ctx, parent, opts) {
  opts = opts || {};
  _guard(ctx, parent, "week_planner");
  var NW = 560, NH = 260;
  var root = _scaled(parent, opts.w, opts.h, NW, NH);
  var kit = ctx.kit;
  var meta = function (name) { return { kind: "ui", beat: _bid(ctx), name: name }; };
  var dur = function (k, f) { return _dur(ctx, k, f); };

  kit.rect(root, 0, 0, NW, NH, { fill: "surface", r: 10 });
  kit.rect(root, 0, 0, NW, 36, { fill: "accent3", crisp: true, r: 10 });

  var days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  var colW = NW / 5;
  var centers = days.map(function (d, i) { return colW * (i + 0.5); });
  for (var i = 1; i < 5; i++) {
    kit.line(root, colW * i, 40, colW * i, NH - 4, { stroke: "muted", sw: 2 });
  }
  days.forEach(function (d, i) {
    kit.text(root, d, { role: "label", x: colW * i + 2, y: 40, w: colW - 4, h: 44, align: "center", valign: "middle", maxLines: 1, color: "ink" });
  });

  var thuCx = centers[3], tueCx = centers[1];

  var reportNote = Loom.svg("g", {}, root);
  kit.rect(reportNote, thuCx - 65, 102, 130, 44, { fill: "field", r: 6 });
  kit.text(reportNote, "Report", { role: "label", x: thuCx - 65, y: 102, w: 130, h: 44, align: "center", valign: "middle", maxLines: 1, color: "ink" });

  var rx = 60, ry = 34, dueCy = 122;
  var dd = "M" + (thuCx - rx) + " " + dueCy + " a " + rx + " " + ry + " 0 1 0 " + (2 * rx) + " 0 a " + rx + " " + ry + " 0 1 0 " + (-2 * rx) + " 0";
  var dueLen = _ellipseLen(rx, ry);
  var dueAcc = kit.path(root, dd, { stroke: "accent", sw: 5 });
  dueAcc.style.strokeDasharray = String(dueLen);
  dueAcc.style.strokeDashoffset = String(dueLen);
  dueAcc.style.display = "none";
  var dueInk = kit.path(root, dd, { stroke: "ink", sw: 5 });
  dueInk.style.strokeDasharray = String(dueLen);
  dueInk.style.strokeDashoffset = String(dueLen);
  dueInk.style.display = "none";

  var tickGrp = Loom.svg("g", { style: "display:none" }, root);
  kit.mark(tickGrp, "yes", thuCx + 66, dueCy - 18, 18);

  // the "Next week" tab: static planner furniture, ABOVE where a moved call_card
  // lands (item 4 fix), never overlapped by it. Same h as the Report note (both
  // tested to clear the label floor).
  var tabX = 290, tabW = 260, tabY = 164, tabH = 44;
  var nextWeekTab = Loom.svg("g", {}, root);
  kit.rect(nextWeekTab, tabX, tabY, tabW, tabH, { fill: "field", stroke: "muted", r: 8 });
  kit.text(nextWeekTab, "Next week", { role: "label", x: tabX, y: tabY, w: tabW, h: tabH, align: "center", valign: "middle", maxLines: 1, color: "muted" });

  var landingY = 234;
  var tueMsgCx = tueCx + 40, tueMsgCy = landingY - 40;
  var tueMsg = Loom.svg("g", { style: "display:none" }, root);
  kit.disc(tueMsg, tueMsgCx, tueMsgCy, 17, { fill: "accent" });
  var tueIconTok = "ink";
  try { if (Loom.style && Loom.style.pickTokenOn) tueIconTok = Loom.style.pickTokenOn("accent") || "ink"; } catch (e) {}
  kit.icon(tueMsg, "mail", { x: tueMsgCx, y: tueMsgCy, size: 18, color: tueIconTok });

  var tabBlank = Loom.svg("g", {}, root);
  var tabLater = Loom.svg("g", { style: "display:none;opacity:0" }, root);
  kit.text(tabLater, "Two weeks later", { role: "label", x: NW - 280, y: 2, w: 276, h: 44, align: "right", valign: "middle", maxLines: 1, color: "ink" });

  function setState(name, t, o) {
    o = o || {};
    if (name === "due_thu" || name === "due_thu_settled") {
      var tok = (o.accent === false) ? "ink" : "accent";
      var active = tok === "accent" ? dueAcc : dueInk;
      var other = tok === "accent" ? dueInk : dueAcc;
      Loom.tl.set(other, { display: "none" }, t);
      Loom.tl.set(active, { display: "inline" }, t);
      if (name === "due_thu_settled") {
        Loom.tl.set(active, { strokeDashoffset: 0 }, t);
      } else {
        Loom.tl.set(active, { strokeDashoffset: dueLen }, t);
        Loom.tween(active, { strokeDashoffset: dueLen }, { strokeDashoffset: 0, duration: dur("draw", 0.8), ease: "linear" }, t, meta(name));
      }
    } else if (name === "thu_tick" || name === "thu_tick_settled") {
      Loom.tl.set(tickGrp, { display: "inline" }, t);
    } else if (name === "flip") {
      var d2 = dur("move", 0.34);
      Loom.tween(root, { skewX: 0 }, { skewX: -3, duration: d2 / 2, ease: "move" }, t, meta("flip"));
      Loom.tween(root, { skewX: -3 }, { skewX: 0, duration: d2 / 2, ease: "move" }, t + d2 / 2, meta("flip"));
      Loom.tween(root, { skewX: 0 }, { skewX: -3, duration: d2 / 2, ease: "move" }, t + d2, meta("flip"));
      Loom.tween(root, { skewX: -3 }, { skewX: 0, duration: d2 / 2, ease: "move" }, t + 1.5 * d2, meta("flip"));
      var tHide = t + 2 * d2;
      Loom.tl.set(dueAcc, { display: "none", strokeDashoffset: dueLen }, tHide);
      Loom.tl.set(dueInk, { display: "none", strokeDashoffset: dueLen }, tHide);
      Loom.tl.set(tickGrp, { display: "none" }, tHide);
      Loom.tl.set(tueMsg, { display: "none" }, tHide);
      Loom.tl.set(tabBlank, { opacity: 0 }, tHide);
      Loom.tl.set(tabLater, { display: "inline", opacity: 1 }, tHide);
    } else if (name === "flip_settled") {
      Loom.tl.set(dueAcc, { display: "none", strokeDashoffset: dueLen }, t);
      Loom.tl.set(dueInk, { display: "none", strokeDashoffset: dueLen }, t);
      Loom.tl.set(tickGrp, { display: "none" }, t);
      Loom.tl.set(tueMsg, { display: "none" }, t);
      Loom.tl.set(tabBlank, { opacity: 0 }, t);
      Loom.tl.set(tabLater, { display: "inline", opacity: 1 }, t);
    } else if (name === "tue_message" || name === "tue_message_settled") {
      Loom.tl.set(tueMsg, { display: "inline" }, t);
      if (name === "tue_message_settled") {
        Loom.tl.set(tueMsg, { opacity: 1, scale: 1, y: 0 }, t);
      } else {
        Loom.tween(tueMsg, { y: -30, opacity: 0, scale: 0.6 }, { y: 0, opacity: 1, scale: 1, duration: dur("enter", 0.42), ease: "overshoot" }, t, meta(name));
      }
    } else if (name === "call_card" || name === "call_moved" || name === "tue_pin") {
      // kept so a storyboard-declared call on the PLANNER itself does not error;
      // the actual card/pin now live in the separate call_card and tue_pin parts.
    } else {
      Loom.error("kit_state", "week_planner: unknown state " + name);
    }
  }

  function slots(x, y, w, h) {
    x = x || 0; y = y || 0; w = w || NW; h = h || NH;
    var sx = w / NW, sy = h / NH;
    function pt(lx, ly) { return { x: x + lx * sx, y: y + ly * sy }; }
    return {
      thu: pt(thuCx, landingY),
      tue: pt(tueCx, landingY),
      nextWeekTab: pt(tabX + tabW / 2, landingY)
    };
  }

  return {
    dayCenters: { Mon: centers[0], Tue: centers[1], Wed: centers[2], Thu: centers[3], Fri: centers[4] },
    slots: slots,
    setState: setState
  };
};

// ---------------------------------------------------------------- leo_laptop_message
Loom.lesson.leo_laptop_message = function (ctx, parent, opts) {
  opts = opts || {};
  _guard(ctx, parent, "leo_laptop_message");
  var NW = 420, NH = 300;
  var root = _scaled(parent, opts.w, opts.h, NW, NH);
  var kit = ctx.kit;
  var meta = function (n) { return { kind: "object", beat: _bid(ctx), name: n }; };
  var dur = function (k, f) { return _dur(ctx, k, f); };

  kit.rect(root, 60, 222, 300, 30, { fill: "field2" });
  kit.rect(root, 18, 8, 384, 224, { fill: "ink", r: 16 });
  var screen = Loom.svg("g", {}, root);
  kit.rect(screen, 34, 22, 352, 196, { fill: "surface2", r: 6, flat: true });

  var msgThu = Loom.svg("g", { style: "display:none" }, screen);
  var msgTue = Loom.svg("g", { style: "display:none" }, screen);
  function chatCard(g, text) {
    kit.rect(g, 46, 34, 328, 170, { fill: "surface", r: 10 });
    kit.text(g, text, { role: "body", x: 64, y: 48, w: 292, h: 142, align: "left", valign: "middle", maxLines: 4, color: "ink" });
  }
  chatCard(msgThu, "Report due today will be late.");
  chatCard(msgTue, "Heads up: Thursday's report is slipping.");

  function setState(name, t) {
    if (name === "idle") {
      Loom.tl.set(msgThu, { display: "none" }, t);
      Loom.tl.set(msgTue, { display: "none" }, t);
    } else if (name === "message_thu" || name === "message_tue") {
      var g = name === "message_thu" ? msgThu : msgTue;
      var other = name === "message_thu" ? msgTue : msgThu;
      Loom.tl.set(other, { display: "none" }, t);
      Loom.tl.set(g, { display: "inline" }, t);
      Loom.tween(g, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: dur("enter", 0.42), ease: "overshoot" }, t, meta(name));
    } else {
      Loom.error("kit_state", "leo_laptop_message: unknown state " + name);
    }
  }
  setState("idle", 0);

  // sendTo: a floating paper copy of the real message, sized to fit both of this
  // lesson's messages (two lines, no overflow), travelling to a LOCAL point.
  function sendTo(text, point, t) {
    var cx = 210, cy = 120, boxW = 300, boxH = 110;
    var copy = Loom.svg("g", {}, root);
    kit.rect(copy, cx - boxW / 2, cy - boxH / 2, boxW, boxH, { fill: "surface", r: 10 });
    kit.text(copy, text, { role: "label", x: cx - boxW / 2 + 12, y: cy - boxH / 2 + 10, w: boxW - 24, h: boxH - 20, align: "center", valign: "middle", maxLines: 2, color: "ink" });
    var d = dur("move", 0.34) + 0.3;
    Loom.tl.set(copy, { x: 0, y: 0, opacity: 1 }, t);
    Loom.tween(copy, { x: 0, y: 0, opacity: 1 }, { x: point.x - cx, y: point.y - cy, opacity: 0, duration: d, ease: "move" }, t, meta("send"));
    return t + d;
  }

  return { screen: screen, setState: setState, sendTo: sendTo };
};

// ---------------------------------------------------------------- speech_bubble
Loom.lesson.speech_bubble = function (ctx, parent, opts) {
  opts = opts || {};
  _guard(ctx, parent, "speech_bubble");
  var NW = 520, NH = 160;
  var root = _scaled(parent, opts.w, opts.h, NW, NH);
  var kit = ctx.kit;
  var meta = function (n) { return { kind: "bubble", beat: _bid(ctx), name: n }; };
  var dur = function (k, f) { return _dur(ctx, k, f); };
  var tone = opts.tone || "you";
  var fill = tone === "you" ? "accent3" : "surface";
  var tailSide = opts.tailSide || "left";

  var body = Loom.svg("g", { style: "opacity:0" }, root);
  kit.rect(body, 0, 0, NW, NH - 26, { fill: fill, r: 14 });
  var tailX = tailSide === "left" ? 60 : NW - 60;
  var tip = tailSide === "left" ? tailX - 30 : tailX + 30;
  kit.path(body, "M" + (tailX - 20) + " " + (NH - 26) + " L" + tip + " " + NH + " L" + (tailX + 20) + " " + (NH - 26) + " Z", { fill: fill, stroke: "ink", sw: 5 });
  var textEl = kit.text(body, opts.text || "", { role: "body", x: 30, y: 14, w: NW - 60, h: NH - 56, align: "center", valign: "middle", maxLines: 2, color: "ink" });

  function setState(name, t) {
    if (name === "in") {
      Loom.tween(body, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: dur("enter", 0.42), ease: "overshoot" }, t, meta("in"));
    } else if (name === "out") {
      Loom.tween(body, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.6, duration: dur("exit", 0.26), ease: "exit" }, t, meta("out"));
    } else {
      Loom.error("kit_state", "speech_bubble: unknown state " + name);
    }
  }

  return { body: body, text: textEl, setState: setState };
};

// ---------------------------------------------------------------- name_tag
Loom.lesson.name_tag = function (ctx, parent, opts) {
  opts = opts || {};
  _guard(ctx, parent, "name_tag");
  var NW = 260, NH = 150;
  var root = _scaled(parent, opts.w, opts.h, NW, NH);
  var kit = ctx.kit;
  var meta = function (n) { return { kind: "token", beat: _bid(ctx), name: n }; };
  var dur = function (k, f) { return _dur(ctx, k, f); };

  var tagRoot = Loom.svg("g", {}, root);
  kit.rect(tagRoot, 0, 0, NW, NH, { fill: "surface", r: 10 });
  kit.rect(tagRoot, 0, 0, NW, 36, { fill: "muted", crisp: true, r: 10 });
  kit.text(tagRoot, "Proactive", { role: "label", x: 10, y: 48, w: NW - 20, h: NH - 56, align: "center", valign: "middle", maxLines: 1, color: "ink" });

  function setState(name, t) {
    if (name === "in_bubble") {
      Loom.tween(tagRoot, { scale: 1 }, { scale: 0.55, duration: dur("enter", 0.42), ease: "enter" }, t, meta("in_bubble"));
    } else if (name === "stuck") {
      Loom.tween(tagRoot, { scale: 0.55, rotation: 0 }, { scale: 1, rotation: -6, duration: dur("enter", 0.42), ease: "overshoot" }, t, meta("stuck"));
    } else if (name === "peeling") {
      Loom.tween(tagRoot, { rotation: -6 }, { rotation: 10, duration: 0.18, ease: "enter" }, t, meta("peel_lift"));
      Loom.tween(tagRoot, { y: 0, opacity: 1, rotation: 10 }, { y: 220, opacity: 0, rotation: 40, duration: dur("exit", 0.26) + 0.3, ease: "exit" }, t + 0.18, meta("peel_fall"));
    } else {
      Loom.error("kit_state", "name_tag: unknown state " + name);
    }
  }

  return { root: tagRoot, setState: setState };
};

// ---------------------------------------------------------------- marks_rail
// Thin shelf only now: each card is its own mark_card element (so b08-b11 can hold
// mark_1/2/3 separately). rail.slots(x,y,w,h) (same x,y,w,h as the rail's own el)
// returns the three GLOBAL boxes to place mark_1, mark_2, mark_3 els on.
Loom.lesson.marks_rail = function (ctx, parent, opts) {
  opts = opts || {};
  _guard(ctx, parent, "marks_rail");
  var NW = 1000, NH = 120;
  var root = _scaled(parent, opts.w, opts.h, NW, NH);
  var kit = ctx.kit;

  kit.rect(root, 0, NH - 10, NW, 6, { fill: "field2", r: 3 });

  var known = ["empty", "one", "two", "three", "lit_1", "lit_2", "lit_3", "shown"];
  function setState(name, t) {
    // the rail itself has no moving parts now; kept tolerant of the old per-card
    // state names so nothing crashes if a beat still names them on the rail.
    if (known.indexOf(name) === -1) {
      Loom.error("kit_state", "marks_rail: unknown state " + name);
    }
  }
  setState("shown", 0);

  function slots(x, y, w, h) {
    x = x || 0; y = y || 0; w = w || NW; h = h || NH;
    var sx = w / NW, sy = h / NH;
    var cw = 300 * sx, ch = 110 * sy;
    function box(cx) { return { x: x + cx * sx - cw / 2, y: y, w: cw, h: ch, cx: x + cx * sx, cy: y + ch / 2 }; }
    return { mark_1: box(150), mark_2: box(500), mark_3: box(850) };
  }

  return { cardCenters: { 1: 150, 2: 500, 3: 850 }, slots: slots, setState: setState };
};

// ---------------------------------------------------------------- mark_card
// One rail card as its own element: const E = ctx.el("mark_1", {x,y,w:300,h:120,kind:"card"});
// const m1 = Loom.lesson.mark_card(ctx, E.inner, {i:1, w:300, h:120}); E.ui = m1;
// The card's outline is drawn as TWO stacked rects (ink below, accent on top): "lit"
// shows the accent rect, every other state hides it, both switched via Loom.tl.set at
// t so a later beat holding this same card element gets exactly the outline ITS OWN
// setState call asked for.
Loom.lesson.mark_card = function (ctx, parent, opts) {
  opts = opts || {};
  _guard(ctx, parent, "mark_card");
  var NW = 300, NH = 120;
  var root = _scaled(parent, opts.w, opts.h, NW, NH);
  var kit = ctx.kit;
  var meta = function (n) { return { kind: "card", beat: _bid(ctx), name: n }; };
  var dur = function (k, f) { return _dur(ctx, k, f); };
  var labels = { 1: "1 What he did", 2: "2 What it caused", 3: "3 Ask" };
  var text = labels[opts.i] || labels[1];

  var g = Loom.svg("g", { style: "opacity:0" }, root);
  var rectEl = kit.rect(g, 0, 5, NW, 110, { fill: "surface", stroke: "ink", sw: 4, r: 10 });
  var rectAccent = kit.rect(g, 0, 5, NW, 110, { fill: "surface", stroke: "accent", sw: 4, r: 10 });
  rectAccent.style.display = "none";
  kit.text(g, text, { role: "label", x: 10, y: 20, w: NW - 20, h: 80, align: "center", valign: "middle", maxLines: 2, color: "ink" });

  function setState(name, t) {
    if (name === "drop") {
      Loom.tl.set(g, { opacity: 0, y: -40, scale: 1 }, t);
      Loom.tl.set(rectAccent, { display: "none" }, t);
      Loom.tween(g, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: dur("enter", 0.42), ease: "overshoot" }, t, meta("drop"));
    } else if (name === "plain") {
      Loom.tl.set(g, { opacity: 1 }, t);
      Loom.tl.set(rectAccent, { display: "none" }, t);
      Loom.tween(g, { scale: 1.08 }, { scale: 1, duration: dur("move", 0.34), ease: "move" }, t, meta("plain"));
    } else if (name === "lit") {
      Loom.tl.set(g, { opacity: 1 }, t);
      Loom.tl.set(rectAccent, { display: "inline" }, t);
      Loom.tween(g, { scale: 1 }, { scale: 1.08, duration: dur("move", 0.34), ease: "move" }, t, meta("lit"));
    } else if (name === "settled") {
      Loom.tl.set(g, { opacity: 1, y: 0, scale: 1 }, t);
      Loom.tl.set(rectAccent, { display: "none" }, t);
    } else {
      Loom.error("kit_state", "mark_card: unknown state " + name);
    }
  }

  return { root: g, setState: setState };
};

// ---------------------------------------------------------------- call_card
// const E = ctx.el("call_card", {x,y,w:200,h:70,kind:"card"});
// const cc = Loom.lesson.call_card(ctx, E.inner, {w:200,h:70}); E.ui = cc;
// Position (the Thu slot, then tween E.mover.x to the nextWeekTab slot from
// planner.slots(...)) is the BEAT's job; this part only draws the look.
Loom.lesson.call_card = function (ctx, parent, opts) {
  opts = opts || {};
  _guard(ctx, parent, "call_card");
  var NW = 200, NH = 70;
  var root = _scaled(parent, opts.w, opts.h, NW, NH);
  var kit = ctx.kit;
  var meta = function (n) { return { kind: "card", beat: _bid(ctx), name: n }; };
  var dur = function (k, f) { return _dur(ctx, k, f); };

  var g = Loom.svg("g", { style: "opacity:0" }, root);
  kit.rect(g, 0, 4, NW, NH - 8, { fill: "surface", stroke: "muted", r: 8 });
  kit.text(g, "Client call", { role: "label", x: 6, y: 4, w: NW - 12, h: NH - 8, align: "center", valign: "middle", maxLines: 1, color: "ink" });

  function setState(name, t) {
    if (name === "in") {
      Loom.tl.set(g, { display: "inline" }, t);
      Loom.tween(g, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: dur("enter", 0.42), ease: "overshoot" }, t, meta("in"));
    } else if (name === "moved") {
      Loom.tl.set(g, { opacity: 1 }, t);
      Loom.tween(g, { scale: 1.1 }, { scale: 1, duration: dur("move", 0.2), ease: "move" }, t, meta("moved"));
    } else if (name === "settled_moved") {
      Loom.tl.set(g, { display: "inline", opacity: 1, scale: 1 }, t);
    } else if (name === "out") {
      Loom.tween(g, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.6, duration: dur("exit", 0.26), ease: "exit" }, t, meta("out"));
    } else {
      Loom.error("kit_state", "call_card: unknown state " + name);
    }
  }

  return { root: g, setState: setState };
};

// ---------------------------------------------------------------- tue_pin
// const E = ctx.el("tue_pin", {x,y,w:160,h:160,kind:"token"});
// const pin = Loom.lesson.tue_pin(ctx, E.inner, {w:160,h:160}); E.ui = pin;
Loom.lesson.tue_pin = function (ctx, parent, opts) {
  opts = opts || {};
  _guard(ctx, parent, "tue_pin");
  var NW = 160, NH = 160;
  var root = _scaled(parent, opts.w, opts.h, NW, NH);
  var kit = ctx.kit;
  var meta = function (n) { return { kind: "token", beat: _bid(ctx), name: n }; };
  var dur = function (k, f) { return _dur(ctx, k, f); };

  var g = Loom.svg("g", { style: "opacity:0" }, root);
  kit.disc(g, 80, 50, 18, { fill: "accent3" });
  kit.icon(g, "map-pin", { x: 80, y: 50, size: 22, color: "ink" });
  if (opts.label) {
    var labelEl = Loom.svg("g", {}, g);
    kit.text(labelEl, String(opts.label), { role: "label", x: 0, y: 78, w: NW, h: 76, align: "center", valign: "top", maxLines: 3, color: "ink" });
  }

  function setState(name, t) {
    var mdur = dur("move", 0.2);
    if (name === "drop") {
      Loom.tl.set(g, { display: "inline" }, t);
      Loom.tween(g, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: dur("enter", 0.42), ease: "overshoot" }, t, meta("drop"));
    } else if (name === "settled") {
      Loom.tl.set(g, { display: "inline", opacity: 1, y: 0 }, t);
    } else if (name === "pulse") {
      Loom.tween(g, { scale: 1 }, { scale: 1.2, duration: mdur, ease: "overshoot" }, t, meta("pulse_up"));
      Loom.tween(g, { scale: 1.2 }, { scale: 1, duration: mdur, ease: "move" }, t + mdur, meta("pulse_down"));
    } else {
      Loom.error("kit_state", "tue_pin: unknown state " + name);
    }
  }

  return { root: g, setState: setState };
};
