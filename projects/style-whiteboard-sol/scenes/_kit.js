// Lesson kit for "Meetings that end with decisions" (whiteboard style).
// Parts: step_list, invite_card, team_table, decision_line. Plus Loom.lesson.cast and Loom.lesson.person (a cast
// peep by name, so a scene can place Sam or Priya alone with the same look as the table).
// Every method takes an ABSOLUTE time t and draws/animates the part's own named elements; the beat decides when.
// All strokes are in their own elements (m.draw only hides path/line/polyline/circle), all words are kit.text in
// their own elements (m.unmask), people are kit.peep busts (m.reveal, dy 0). No accent is used inside a part: the
// scenes add their one accent (circle, underline, '?'); underline(i,t,{tone}) and tick(i,t,{tone}) take a tone.
Loom.lesson = Loom.lesson || {};
(function () {
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  // team_table state that must survive from one beat to the next (a held table): per person the visibility group,
  // its look variants, the current look and whether it has left; per table the bubbles still on the board.
  var REG = {}, REGB = {};

  function tools(ctx) {
    var kit = ctx.kit, m = ctx.m;
    var DRAW = ctx.style.dur("draw");
    var T = {
      kit: kit, m: m,
      drawDur: function (len) { return DRAW * clamp(len / 900, 0.3, 1.4); },
      writeDur: function (str) { return DRAW * clamp(String(str).length / 14, 0.45, 1.8); },
      hand: function (g, d, o) {
        return kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
      },
      el: function (name, parent, x, y, w, h, kind, exit) {
        return ctx.el(name, { x: x, y: y, w: w, h: h, kind: kind || "scenery", exit: exit || "recede", parent: parent });
      },
      words: function (E, str, x, y, w, h, role, o) {
        return kit.text(E.inner, str, Object.assign({ role: role, x: x, y: y, w: w, h: h, maxLines: 1, valign: "middle" }, o || {}));
      },
      // a hand arrow with an open head (guide 11d) in its own element with its true box; x/y are in the parent's space
      arrow: function (name, parent, x1, y1, x2, y2, bend, o) {
        var L = Math.hypot(x2 - x1, y2 - y1) || 1, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        var cx = mx - ((y2 - y1) / L) * bend, cy = my + ((x2 - x1) / L) * bend;
        var a = Math.atan2(y2 - cy, x2 - cx), hs = 22;
        var h1 = [x2 - hs * Math.cos(a - 0.5), y2 - hs * Math.sin(a - 0.5)], h2 = [x2 - hs * Math.cos(a + 0.5), y2 - hs * Math.sin(a + 0.5)];
        var xs = [x1, cx, x2, h1[0], h2[0]], ys = [y1, cy, y2, h1[1], h2[1]], P = 12;
        var bx = Math.floor(Math.min.apply(null, xs) - P), by = Math.floor(Math.min.apply(null, ys) - P);
        var E = T.el(name, parent, bx, by, Math.ceil(Math.max.apply(null, xs) + P) - bx, Math.ceil(Math.max.apply(null, ys) + P) - by, "connector");
        var X = function (v) { return (v - bx).toFixed(1); }, Y = function (v) { return (v - by).toFixed(1); };
        T.hand(E.inner, "M" + X(x1) + " " + Y(y1) + " Q" + X(cx) + " " + Y(cy) + " " + X(x2) + " " + Y(y2), o);
        T.hand(E.inner, "M" + X(h1[0]) + " " + Y(h1[1]) + " L" + X(x2) + " " + Y(y2) + " L" + X(h2[0]) + " " + Y(h2[1]), o);
        return { E: E, len: L * 1.1 };
      },
      // a fade of one element's life group (leave) or of a bare node's opacity
      fadeOut: function (E, t, dur) {
        Loom.tween(E.life, { opacity: 1 }, { opacity: 0 }, t, { dur: dur || ctx.style.dur("exit") });
      },
      crossfade: function (offNode, onNode, t, dur) {
        Loom.tween(offNode, { opacity: 1 }, { opacity: 0 }, t, { dur: dur || 0.3 });
        Loom.tween(onNode, { opacity: 0 }, { opacity: 1 }, t, { dur: dur || 0.3 });
      },
      svgG: function (parent) {
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        parent.appendChild(g);
        return g;
      }
    };
    return T;
  }

  // ------------------------------------------------------------------ the cast (one look each)
  var CAST = {
    Sam: { member: "man", skin: 1, cloth: "accent2" },
    Priya: { member: "elder_woman", skin: 2, cloth: "surface" },
    Dev: { member: "elder_man", skin: 0, cloth: "surface" },
    Lena: { member: "woman", skin: 3, cloth: "surface" }
  };

  // A cast member alone: Loom.lesson.person(ctx, "Sam", "explaining", {x, y, size, name, parent, flip}).
  // x, y = the TOP-LEFT of the element box; the box is round(size*1.07) x size, so the bust's bottom is at y + size
  // (put that ON the desk line). Returns the element (reveal it with m.reveal(E, t, {dy: 0})).
  var person = function (ctx, name, emotion, o) {
    o = o || {};
    var c = CAST[name];
    if (!c) throw new Error("Loom.lesson.person: unknown cast name " + name);
    var size = o.size || 300, w = Math.round(size * 1.07);
    var E = ctx.el(o.name || String(name).toLowerCase(), { x: o.x || 0, y: o.y || 0, w: w, h: size, kind: "character", exit: "recede", parent: o.parent });
    ctx.kit.peep(E.inner, c.member, emotion || "neutral", { x: w / 2, y: size / 2, size: size, cloth: c.cloth, skin: c.skin, flip: !!o.flip });
    return E;
  };
  // exposed on team_table (no extra kit part): Loom.lesson.team_table.cast, Loom.lesson.team_table.person
  var EXPOSE = function (fn) { fn.cast = CAST; fn.person = person; return fn; };

  // ------------------------------------------------------------------ step_list
  // Natural size 380 x 300: three rows of 100: a rough box 56 px (x 10..66) and the word (lead) from x 90.
  // Elements: <p>_box_0..2, <p>_word_0..2 (words hold a muted and an ink copy), <p>_tick_i (when ticked).
  Loom.lesson.step_list = function (ctx, parent, opts) {
    opts = opts || {};
    var T = tools(ctx), m = T.m, p = opts.name || "steps";
    var WORDS = ["Before", "During", "Close"];
    var cur = opts.current == null ? 0 : opts.current;
    var ticked = opts.ticked || [false, false, false];
    var boxes = [], words = [], mut = [], ink = [], ticks = [], tickDone = [];
    function tickPath(i) { return "M19 52 L31 67 L59 26"; }
    function makeTick(i, tone) {
      var E = T.el(p + "_tick_" + i, parent, 0, i * 100, 76, 100, "mark");
      T.hand(E.inner, tickPath(i), { stroke: tone === "pos" ? "pos" : "ink", sw: 5 });
      ticks[i] = E;
      return E;
    }
    for (var i = 0; i < 3; i++) {
      var B = T.el(p + "_box_" + i, parent, 0, i * 100, 76, 100, "row");
      T.kit.sketch(B.inner, "rectangle", [10, 22, 56, 56], { fill: "none" });
      boxes.push(B);
      var W = T.el(p + "_word_" + i, parent, 90, i * 100, 290, 100, "text", "wipe");
      var tm = T.words(W, WORDS[i], 0, 0, 290, 100, "lead", { color: "muted" });
      var ti = T.words(W, WORDS[i], 0, 0, 290, 100, "lead", { color: "ink" });
      tm.setAttribute("opacity", i === cur ? 0 : 1);
      ti.setAttribute("opacity", i === cur ? 1 : 0);
      words.push(W); mut.push(tm); ink.push(ti);
      tickDone.push(!!ticked[i]);
      if (ticked[i]) makeTick(i, "ink");
    }
    var h = {
      el: { boxes: boxes, words: words, ticks: ticks },
      size: { w: 380, h: 300 },
      rows: [0, 1, 2].map(function (k) { return { box: { x: 10, y: k * 100 + 22, w: 56, h: 56 }, word: { x: 90, y: k * 100, w: 290, h: 100 } }; }),
      // boxes first, then the words in order (drawn ticks of a `ticked` list follow their box)
      draw: function (t) {
        var d = T.drawDur(224), end = t;
        for (var k = 0; k < 3; k++) {
          m.draw(boxes[k], t + k * 0.12, { dur: d });
          if (ticks[k]) m.draw(ticks[k], t + k * 0.12 + d, { dur: 0.3 });
        }
        var tw = t + 0.5;
        for (var j = 0; j < 3; j++) {
          m.unmask(words[j], tw, { dur: T.writeDur(WORDS[j]) });
          tw += T.writeDur(WORDS[j]) * 0.75;
        }
        return tw;
      },
      // shown complete from the first frame (a board the camera pans onto): nothing to do, nothing is hidden
      appear: function () { return 0; },
      // a hand tick in box i; tone "pos" only for the Close tick of b13
      tick: function (i2, t, o) {
        o = o || {};
        var E = ticks[i2] && !tickDone[i2] ? ticks[i2] : makeTick(i2, o.tone);
        tickDone[i2] = true;
        m.draw(E, t, { dur: T.drawDur(100) + 0.1 });
        return E;
      },
      // the ink moves to row i (-1: no row in ink): the old word fades muted, the new one fades to ink
      setCurrent: function (i2, t) {
        if (i2 === cur) return;
        if (cur >= 0) T.crossfade(ink[cur], mut[cur], t, 0.3);
        if (i2 >= 0) T.crossfade(mut[i2], ink[i2], t, 0.3);
        cur = i2;
      }
    };
    return h;
  };

  // ------------------------------------------------------------------ decision_line
  // 'Pilot ships in June' | 'Priya' | 'by Friday', ink Patrick Hand. opts.w 1100 (lead) or ~700 (compact, body).
  // Local box w x 150: words y 0..70, underline y 74..98, label y 104..144. Parts' boxes in handle.parts.
  Loom.lesson.decision_line = function (ctx, parent, opts) {
    opts = opts || {};
    var T = tools(ctx), m = T.m, kit = T.kit, p = opts.name || "decision";
    var W = opts.w || 1100;
    var parts = opts.parts || ["Pilot ships in June", "Priya", "by Friday"];
    var role = W >= 900 ? "lead" : "body", fits;
    var roles = role === "lead" ? ["lead", "body", "label"] : ["body", "label"];
    for (var r = 0; r < roles.length; r++) {
      role = roles[r];
      fits = parts.map(function (s) { return kit.fit(s, { role: role, w: 2000, h: 80, maxLines: 1 }); });
      var sum = fits.reduce(function (a, f) { return a + f.width; }, 0);
      if (sum + 2 * 44 <= W) break;
    }
    var sum2 = fits.reduce(function (a, f) { return a + f.width; }, 0);
    var gap = Math.min(150, (W - sum2) / 2);
    var x = Math.max(0, (W - (sum2 + 2 * gap)) / 2);
    var H = 150;
    var line = T.el(p + "_line", parent, 0, 0, W, H, "text");
    var boxes = [], els = [], ul = [], lb = [];
    parts.forEach(function (s, i) {
      var w = Math.ceil(fits[i].width) + 16;
      var E = T.el(p + "_part_" + i, line.inner, Math.round(x), 0, w, 70, "text", "wipe");
      T.words(E, s, 0, 0, w, 70, role, { color: "ink" });
      els.push(E);
      boxes.push({ x: Math.round(x), y: 0, w: Math.ceil(fits[i].width), h: 70 });
      x += fits[i].width + gap;
    });
    return {
      el: { line: line, parts: els, underlines: ul, labels: lb },
      size: { w: W, h: H },
      parts: boxes,
      font: role,
      // the parts written left to right; returns the end time
      write: function (t) {
        var tt = t;
        parts.forEach(function (s, i) {
          m.unmask(els[i], tt, { dur: T.writeDur(s) });
          tt += T.writeDur(s) * 0.85;
        });
        return tt;
      },
      // a hand underline under part i; tone "ink" by default, the scene passes "accent" for its one mark
      underline: function (i, t, o) {
        o = o || {};
        var b = boxes[i], w = b.w + 12;
        var E = T.el(p + "_ul_" + i, line.inner, b.x - 6, 74, w, 26, "mark");
        T.hand(E.inner, "M2 12 C " + (w * 0.3).toFixed(0) + " 6, " + (w * 0.65).toFixed(0) + " 17, " + (w - 2) + " 9", { stroke: o.tone || "ink", sw: 5 });
        m.draw(E, t, { dur: T.drawDur(w * 1.05) });
        ul[i] = E;
        return E;
      },
      // a muted label under part i (What, Who, By when)
      label: function (i, text, t) {
        var b = boxes[i], w = Math.max(b.w + 40, 160);
        var E = T.el(p + "_label_" + i, line.inner, Math.round(b.x + b.w / 2 - w / 2), 104, w, 42, "label", "wipe");
        T.words(E, text, 0, 0, w, 42, "label", { color: "muted", align: "center" });
        m.unmask(E, t, { dur: T.writeDur(text) });
        lb[i] = E;
        return E;
      },
      // shrinks the whole line toward (o.x, o.y) in the parent's space (default its own top left), scale o.scale 0.45
      fold: function (t, o) {
        o = o || {};
        m.travel(line, t, { x: o.x == null ? 0 : o.x, y: o.y == null ? 0 : o.y, scale: o.scale || 0.45 });
        return line;
      }
    };
  };

  // ------------------------------------------------------------------ invite_card
  // Natural size 1160 x 600: the card is 900 x 600 at x 0, the envelope sits to its right (x 995..1155).
  // Header y 28..100 (calendar icon + 'Invite' / 'Agenda'), rule y 114, title line y 128..198, rewrite y 208..324,
  // six guests centred y 430 (x = 110 + 134 i), labels y 482..526. Blank mode: four ruled lines, '?' slot first line.
  Loom.lesson.invite_card = function (ctx, parent, opts) {
    opts = opts || {};
    var T = tools(ctx), m = T.m, kit = T.kit, p = opts.name || "invite";
    var blank = !!opts.blank;
    var HEAD = blank ? "Agenda" : "Invite";
    var GY = 430, GX = function (i) { return 110 + i * 134; };

    var card = T.el(p + "_card", parent, 0, 0, 900, 600, "card");
    kit.sketch(card.inner, "rectangle", [0, 0, 900, 600], { fill: "none" });
    // a hand calendar (own strokes: a Lucide calendar body is a rect, which m.draw cannot hide)
    var cal = T.el(p + "_calendar", parent, 36, 28, 72, 72, "icon");
    kit.sketch(cal.inner, "rectangle", [8, 14, 56, 50], { fill: "none" });
    T.hand(cal.inner, "M8 32 L64 32");
    T.hand(cal.inner, "M22 6 L22 22");
    T.hand(cal.inner, "M50 6 L50 22");
    var head = T.el(p + "_header", parent, 124, 28, 360, 72, "text", "wipe");
    T.words(head, HEAD, 0, 0, 360, 72, "lead", { color: "ink" });
    var rule = T.el(p + "_rule", parent, 24, 104, 852, 20, "scenery");
    T.hand(rule.inner, "M2 10 L850 8");

    var el = { card: card, calendar: cal, header: head, rule: rule, guests: [], labels: [], crosses: [] };
    var h = {
      el: el,
      size: { w: 1160, h: 600 },
      card: { x: 0, y: 0, w: 900, h: 600 },
      titleBox: { x: 40, y: 128, w: 380, h: 70 },
      rewriteBox: { x: 40, y: 208, w: 560, h: 116 },
      guestCentre: function (i) { return { x: GX(i), y: GY }; },
      guestBox: function (i) { return { x: GX(i) - 40, y: GY - 40, w: 80, h: 80 }; },
      envelopeBox: { x: 995, y: 380, w: 160, h: 120 },
      slotBox: { x: 40, y: 124, w: 140, h: 110 },
      lineYs: [232, 322, 412, 502],
      // card outline, calendar, header word, rule; blank mode adds its ruled lines. Returns the end time.
      draw: function (t) {
        m.draw(card, t, { dur: 1.0 });
        m.draw(cal, t + 0.55, { dur: 0.45 });
        m.unmask(head, t + 0.9, { dur: T.writeDur(HEAD) });
        m.draw(rule, t + 1.0, { dur: 0.4 });
        var end = t + 1.4;
        if (blank) {
          var rules = T.el(p + "_lines", parent, 24, 200, 852, 330, "scenery");
          h.lineYs.forEach(function (y) {
            T.hand(rules.inner, "M2 " + (y - 200) + " L850 " + (y - 200 - 3));
          });
          m.draw(rules, t + 1.2, { dur: 0.9 });
          el.lines = rules;
          end = t + 2.1;
        }
        return end;
      },
      // the title line (b04: 'Pilot update'), Patrick Hand lead, written left to right
      setTitle: function (text, t) {
        var f = kit.fit(text, { role: "lead", w: 820, h: 70, maxLines: 1 });
        h.titleBox = { x: 40, y: 128, w: Math.ceil(f.width), h: 70 };
        var E = T.el(p + "_title", parent, 40, 128, Math.ceil(f.width) + 16, 70, "text", "wipe");
        T.words(E, text, 0, 0, Math.ceil(f.width) + 16, 70, "lead", { color: "ink" });
        m.unmask(E, t, { dur: T.writeDur(text) });
        el.title = E;
        return E;
      },
      // an ink strike-through across the title (a correction is struck, never erased)
      strike: function (t) {
        var w = h.titleBox.w + 36;
        var E = T.el(p + "_strike", parent, 22, 150, w, 28, "mark");
        T.hand(E.inner, "M2 16 L" + (w - 2) + " 10", { sw: 4.5 });
        m.draw(E, t, { dur: T.drawDur(w) });
        el.strikeLine = E;
        return E;
      },
      // the replacement in Caveat title size just under the struck line
      rewrite: function (text, t) {
        var f = kit.fit(text, { role: "title", w: 840, h: 116, maxLines: 1 });
        h.rewriteBox = { x: 40, y: 208, w: Math.ceil(f.width), h: 116 };
        var E = T.el(p + "_rewrite", parent, 40, 208, Math.ceil(f.width) + 24, 116, "text", "wipe");
        T.words(E, text, 0, 0, Math.ceil(f.width) + 24, 116, "title", { color: "ink" });
        m.unmask(E, t, { dur: T.writeDur(text) });
        el.rewriteText = E;
        return E;
      },
      // six Lucide user pictograms at marker weight, one after another
      guests: function (t) {
        var d = 0.4;
        for (var i = 0; i < 6; i++) {
          var E = T.el(p + "_guest_" + i, parent, GX(i) - 45, GY - 48, 90, 96, "icon");
          kit.icon(E.inner, "user", { x: 45, y: 48, size: 76, stroke: 24 * 3.6 / 76, color: "ink" });
          m.draw(E, t + i * 0.2, { dur: d });
          el.guests[i] = E;
        }
        return t + 5 * 0.2 + d;
      },
      // a label under pictogram i ('Owner', 'Needed input'); o.tone ink by default
      markGuest: function (i, label, t, o) {
        o = o || {};
        var E = T.el(p + "_guestlabel_" + i, parent, GX(i) - 95, 482, 190, 44, "label", "wipe");
        T.words(E, label, 0, 0, 190, 44, "label", { color: o.tone || "ink", align: "center" });
        m.unmask(E, t, { dur: T.writeDur(label) });
        el.labels[i] = E;
        return E;
      },
      // an ink cross over pictogram i
      crossGuest: function (i, t) {
        var E = T.el(p + "_cross_" + i, parent, GX(i) - 44, GY - 44, 88, 88, "mark");
        T.hand(E.inner, "M12 12 L76 76 M76 12 L12 76", { sw: 4.5 });
        m.draw(E, t, { dur: 0.35 });
        el.crosses[i] = E;
        return E;
      },
      // a hand arrow from the crossed guests to a hand envelope to the right of the card
      envelope: function (t) {
        var A = T.arrow(p + "_envelope_arrow", parent, 838, 440, 982, 440, -10);
        m.draw(A.E, t, { dur: 0.45 });
        var E = T.el(p + "_envelope", parent, 995, 380, 160, 120, "icon");
        kit.sketch(E.inner, "rectangle", [8, 10, 140, 96], { fill: "none" });
        m.draw(E, t + 0.4, { dur: 0.6 });
        var F = T.el(p + "_envelope_flap", parent, 995, 380, 160, 120, "icon");
        T.hand(F.inner, "M8 10 L78 66 L148 10");
        m.draw(F, t + 0.9, { dur: 0.35 });
        el.arrow = A.E; el.envelope = E; el.flap = F;
        return t + 1.25;
      }
    };
    return h;
  };

  // ------------------------------------------------------------------ team_table
  // Natural size 1400 x 700 (put the element at station x 90, y 240 so the table line is at y 760).
  // Table line local y 520 (x 20..1350); chairs and busts centred x = 160 + 340 i (Sam, Priya, Dev, Lena);
  // busts 300 px, box 320 x 300 at y 220..520 (bottom ON the line). Bubbles (300 x 190) above each head, body
  // y 52..182, tail tip y 212. Free air above the busts: local y 0..210 (room for 'Decided?', 'Who?', '?').
  // Front of the table (local y 556..680) is free for written lines: handle.frontBox.
  Loom.lesson.team_table = EXPOSE(function (ctx, parent, opts) {
    opts = opts || {};
    var T = tools(ctx), m = T.m, kit = T.kit, p = opts.name || "team";
    var held = !!opts.held;
    var NAMES = ["Sam", "Priya", "Dev", "Lena"], EMOS = ["neutral", "happy", "explaining"];
    var CX = function (i) { return 160 + i * 340; };
    var TY = 520;
    // own(): a fresh element, or (opts.held) the element a previous beat drew under the same name
    function own(name, x, y, w, hh, kind, exit) {
      if (held) {
        var E0 = null;
        try { E0 = ctx.held(name); } catch (e) { E0 = null; }
        if (E0) return { E: E0, fresh: false };
      }
      return { E: T.el(name, parent, x, y, w, hh, kind, exit), fresh: true };
    }
    // uid: a per-beat tag for the names of things that are never held (bubbles, tags), so no two beats clash
    var uid = (ctx.beat && ctx.beat.id ? String(ctx.beat.id) : "x") + (opts.tag ? "_" + opts.tag : "");
    var tb = own(p + "_table", 0, 500, 1400, 190, "scenery");
    var anyFresh = tb.fresh;
    if (tb.fresh) {
      // table top edge, then the front face: two sides and a bottom edge (the face is free for names and lines)
      T.hand(tb.E.inner, "M20 22 L1350 18");
      T.hand(tb.E.inner, "M36 24 L34 176");
      T.hand(tb.E.inner, "M1334 20 L1336 176");
      T.hand(tb.E.inner, "M34 176 L1336 172");
    }
    if (tb.fresh) REGB[p] = [];
    // personRec: the visibility group (all looks inside) of one person; reused when the element is held
    function personRec(pe, key, c) {
      var inner = pe.E.inner, rec = REG[key];
      var ok = function (r) { return r && r.vis && inner && inner.contains && inner.contains(r.vis); };
      if (!pe.fresh) {
        if (ok(rec)) return rec;
        var ex = inner && inner.querySelector ? inner.querySelector("[data-vis]") : null;
        if (ex) {
          var vs0 = {};
          EMOS.forEach(function (e, q) { vs0[e] = ex.children[q]; });
          REG[key] = { vis: ex, vs: vs0, emo: "neutral", gone: true };
          return REG[key];
        }
      }
      var vis = T.svgG(inner), vs = {};
      vis.setAttribute("data-vis", "1");
      vis.setAttribute("opacity", 0);
      EMOS.forEach(function (e) {
        var g = T.svgG(vis);
        kit.peep(g, c.member, e, { x: 160, y: 150, size: 300, cloth: c.cloth, skin: c.skin });
        g.setAttribute("opacity", e === "neutral" ? 1 : 0);
        vs[e] = g;
      });
      REG[key] = { vis: vis, vs: vs, emo: "neutral", gone: true };
      return REG[key];
    }
    var chairs = [], people = [], recs = [], freshP = [], tags = [], bubbles = [], nb = 0;
    for (var i = 0; i < 4; i++) {
      var ch = own(p + "_chair_" + i, CX(i) - 150, 330, 300, 192, "scenery");
      if (ch.fresh) T.hand(ch.E.inner, "M10 190 L10 44 Q10 10 44 10 L256 10 Q290 10 290 44 L290 190");
      chairs.push(ch.E);
      anyFresh = anyFresh || ch.fresh;
      var pe = own(p + "_person_" + i, CX(i) - 160, 220, 320, 300, "character");
      recs.push(personRec(pe, p + "_person_" + i, CAST[NAMES[i]]));
      freshP.push(pe.fresh);
      people.push(pe.E);
    }
    var h = {
      el: { table: tb.E, chairs: chairs, people: people, tags: tags, bubbles: bubbles },
      size: { w: 1400, h: 700 },
      origin: { x: opts.ox == null ? 90 : opts.ox, y: opts.oy == null ? 240 : opts.oy },
      tableY: TY,
      tableBox: { x: 20, y: 500, w: 1330, h: 190 },
      frontBox: { x: 140, y: 540, w: 1120, h: 130 },
      seat: [0, 1, 2, 3].map(function (k) { return { name: NAMES[k], cx: CX(k), box: { x: CX(k) - 160, y: 220, w: 320, h: 300 }, chair: { x: CX(k) - 150, y: 340, w: 300, h: 180 }, head: { x: CX(k) - 80, y: 220 } }; }),
      bubbleBox: function (k) { return { x: CX(k) - 150, y: 52, w: 300, h: 160 }; },
      // station coordinates of a local point
      station: function (x, y) { return { x: x + h.origin.x, y: y + h.origin.y }; },
      // table line, front edge and legs, then the four chair backs
      // (a held table is already drawn: nothing is redrawn, no time passes)
      draw: function (t) {
        if (!anyFresh) return t;
        if (tb.fresh) m.draw(tb.E, t, { dur: 1.2 });
        chairs.forEach(function (E, k) { if (E !== null && !E.__heldDrawn && tb.fresh) m.draw(E, t + 0.7 + k * 0.12, { dur: 0.5 }); });
        return t + 1.6;
      },
      // the four people fade in, staggered left to right
      // a held person who never left simply stays; one who left (or is new) fades in on the visibility group
      arrive: function (t) {
        var d = ctx.style.dur("enter");
        people.forEach(function (E, k) {
          var r = recs[k], tk = t + k * 0.15;
          if (!r.gone) return;
          if (freshP[k]) m.reveal(E, tk, { dy: 0 });
          else if (E.life) Loom.tween(E.life, { opacity: 0 }, { opacity: 1 }, tk, { dur: d });
          Loom.tween(r.vis, { opacity: 0 }, { opacity: 1 }, tk, { dur: d });
          r.gone = false;
        });
        return t + 3 * 0.15 + d;
      },
      // the four people fade out, leaving the chairs
      leave: function (t) {
        people.forEach(function (E, k) {
          Loom.tween(recs[k].vis, { opacity: 1 }, { opacity: 0 }, t + k * 0.08, { dur: 0.45 });
          recs[k].gone = true;
        });
        return t + 3 * 0.08 + 0.45;
      },
      // the person's look: neutral, happy or explaining (a cross-fade)
      emotion: function (i2, name, t) {
        var r = recs[i2];
        if (!r.vs[name] || r.emo === name) return;
        T.crossfade(r.vs[r.emo], r.vs[name], t, 0.3);
        r.emo = name;
      },
      // a name written on the table front under person i; handle.tagBox(i) gives the tight box for a scene's underline
      nameTag: function (i2, text, t, o) {
        o = o || {};
        var f = kit.fit(text, { role: "label", w: 260, h: 56, maxLines: 1 });
        var E = T.el(p + "_tag_" + uid + "_" + i2, parent, CX(i2) - 130, 530, 260, 56, "label", "wipe");
        T.words(E, text, 0, 0, 260, 56, "label", { color: o.tone || "ink", align: "center" });
        m.unmask(E, t, { dur: T.writeDur(text) });
        tags[i2] = { E: E, box: { x: Math.round(CX(i2) - f.width / 2), y: 530, w: Math.ceil(f.width), h: 56 } };
        return E;
      },
      tagBox: function (i2) { return tags[i2] ? tags[i2].box : { x: CX(i2) - 60, y: 530, w: 120, h: 56 }; },
      // a rough speech bubble above person i: a short text, '?' (written in Caveat), or null for a scribble
      bubble: function (i2, content, t) {
        var n = nb++, sfx = "_" + uid + "_" + i2 + "_" + n;
        var bx = CX(i2) - 150;
        var E = T.el(p + "_bubble" + sfx, parent, bx, 52, 300, 160, "bubble");
        T.hand(E.inner, "M8 6 L292 4 L292 130 L172 131 L150 158 L128 131 L8 132 Z");
        var out = { E: E, words: null };
        if (content == null) {
          var S = T.el(p + "_scribble" + sfx, parent, bx, 52, 300, 140, "bubble");
          T.hand(S.inner, "M40 46 C 62 26, 78 70, 100 46 S 142 26, 164 48 S 212 70, 262 40");
          T.hand(S.inner, "M40 90 C 66 74, 84 108, 108 88 S 160 70, 190 92 S 236 104, 258 82");
          m.draw(E, t, { dur: 0.6 });
          m.draw(S, t + 0.4, { dur: 0.5 });
          out.scribble = S;
        } else {
          var isQ = String(content) === "?";
          // words box 260 x 110 at y 66..176, inside the body (y 56..184), centred vertically (a '?' at the 72 floor fits)
          var W = T.el(p + "_bubble_words" + sfx, parent, bx + 20, 66, 260, 110, "text", "wipe");
          T.words(W, String(content), 0, 0, 260, 110, isQ ? "title" : "label", { maxLines: 2, align: "center", valign: "middle", color: "ink" });
          m.draw(E, t, { dur: 0.6 });
          m.unmask(W, t + 0.45, { dur: T.writeDur(content) });
          out.words = W;
        }
        out.beat = uid;
        out.names = { E: p + "_bubble" + sfx, words: p + "_bubble_words" + sfx, scribble: p + "_scribble" + sfx };
        bubbles.push(out);
        (REGB[p] = REGB[p] || []).push(out);
        return out;
      },
      // the bubbles leave (fade)
      clearBubbles: function (t) {
        // every bubble still on the board, also those an earlier beat drew (taken over by name)
        var list = (REGB[p] || []).slice(), k = 0;
        REGB[p] = [];
        bubbles.length = 0;
        list.forEach(function (b) {
          ["E", "words", "scribble"].forEach(function (key) {
            var E = b[key];
            if (!E) return;
            if (b.beat !== uid) { try { E = ctx.held(b.names[key]) || null; } catch (e) { E = null; } }
            if (E) T.fadeOut(E, t + k * 0.05, 0.3);
          });
          k++;
        });
        return t + 0.4;
      }
    };
    return h;
  });
})();
