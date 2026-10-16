Loom.lesson = Loom.lesson || {};

// Lesson kit: meeting_room, comment_bubble, wall_calendar (story-cartoon, tokens only, no people).
// Shared helpers. A part draws, it never reveals itself: the beat decides when it appears.
(function () {
  const sv = (tag, attrs, p) => Loom.svg(tag, attrs, p);
  const grp = (p, attrs) => sv("g", attrs || {}, p);

  // discrete swap: t == null sets the build state directly, otherwise a timeline set at t
  const setOp = (el, o, t) => {
    if (t == null) el.setAttribute("opacity", o);
    else Loom.tl.set(el, { opacity: o }, t);
  };
  const dur = (ctx, k, f) => {
    try { const v = ctx.style.dur(k); return typeof v === "number" ? v : f; } catch (e) { return f; }
  };
  const rootFor = (parent, opts, NW, NH) => {
    opts = opts || {};
    let s = 1;
    if (opts.w && opts.h) s = Math.min(opts.w / NW, opts.h / NH);
    else if (opts.w) s = opts.w / NW;
    else if (opts.h) s = opts.h / NH;
    const ox = opts.x || 0, oy = opts.y || 0;
    return grp(parent, { transform: "translate(" + ox + " " + oy + ") scale(" + s + ")" });
  };
  const rr = (x, y, w, h, r) =>
    "M " + (x + r) + " " + y + " H " + (x + w - r) + " Q " + (x + w) + " " + y + " " + (x + w) + " " + (y + r) +
    " V " + (y + h - r) + " Q " + (x + w) + " " + (y + h) + " " + (x + w - r) + " " + (y + h) +
    " H " + (x + r) + " Q " + x + " " + (y + h) + " " + x + " " + (y + h - r) +
    " V " + (y + r) + " Q " + x + " " + y + " " + (x + r) + " " + y + " Z";

  // ---------------------------------------------------------------------------------------------
  // meeting_room, natural 1920 x 1080
  // Anatomy, back to front: wall (surface2) with dado band, window, door, calendar mount (nail only;
  // the wall_calendar part hangs at anchors.calendar), floor (field), chairs (muted; tidy and askew
  // drawings swapped by state), long table (surface top, field2 near face), a veil (colour held back).
  // States: emptying (chairs askew, veil), week_later, replay (chairs tidy, veil), next_week_full
  // (veil lifts over 0.6 s to full colour).
  // Named people are NOT drawn here: the scene places peep busts above the table edge (table top y 790).
  // ---------------------------------------------------------------------------------------------
  Loom.lesson.meeting_room = function (ctx, parent, opts) {
    const kit = ctx.kit;
    const W = 1920, H = 1080;
    const root = rootFor(parent, opts, W, H);
    const flat = { r: 0, shadow: false, crisp: true };

    // wall, dado band, floor
    kit.rect(root, 0, 0, W, 730, Object.assign({ fill: "surface2" }, flat));
    kit.rect(root, 0, 560, W, 170, Object.assign({ fill: "field2" }, flat));
    kit.line(root, 0, 560, W, 560, { stroke: "line", sw: 3 });
    kit.rect(root, 0, 730, W, 350, Object.assign({ fill: "field" }, flat));
    kit.line(root, 0, 730, W, 730, { stroke: "line", sw: 4 });
    [300, 640, 980, 1320, 1660].forEach(function (x, i) {
      kit.line(root, x, 734, x - 90 - i * 10, 1080, { stroke: "field2", sw: 3 });
    });

    // window (between the two people, above the heads)
    const win = grp(root);
    kit.rect(win, 1010, 130, 320, 270, { fill: "surface", r: 10, flat: true });
    kit.rect(win, 1030, 150, 280, 230, { fill: "field", r: 4, shadow: false, flat: true });
    kit.line(win, 1170, 150, 1170, 380, { stroke: "ink", sw: 4 });
    kit.line(win, 1030, 265, 1310, 265, { stroke: "ink", sw: 4 });
    kit.rect(win, 996, 400, 348, 22, { fill: "field2", r: 6, flat: true });

    // door, right
    const door = grp(root);
    kit.rect(door, 1640, 210, 170, 520, { fill: "field2", r: 8, flat: true });
    kit.rect(door, 1664, 240, 122, 200, { fill: "surface2", r: 6, shadow: false, flat: true });
    kit.rect(door, 1664, 470, 122, 230, { fill: "surface2", r: 6, shadow: false, flat: true });
    kit.disc(door, 1664 + 0, 590, 0.1, { fill: "accent2" });
    kit.disc(door, 1676, 590, 9, { fill: "accent2" });

    // calendar mount on the left wall (the nail); the wall_calendar part hangs from it
    kit.disc(root, 206, 112, 7, { fill: "muted" });

    // chairs: backs only, in muted. Tidy and askew drawings.
    const chairX = [230, 610, 1000, 1200, 1560];
    const tilt = [-9, 6, -6, 9, -7];
    const shift = [-22, 18, -14, 20, -10];
    const chairs = grp(root);
    const tidy = grp(chairs);
    const askew = grp(chairs);
    chairX.forEach(function (x, i) {
      const a = grp(tidy);
      kit.rect(a, x - 75, 570, 150, 230, { fill: "muted", r: 28 });
      kit.line(a, x - 38, 618, x + 38, 618, { stroke: "ink", sw: 4 });
      const b = grp(askew, { transform: "translate(" + shift[i] + " 0) rotate(" + tilt[i] + " " + x + " 800)" });
      kit.rect(b, x - 75, 570, 150, 230, { fill: "muted", r: 28 });
      kit.line(b, x - 38, 618, x + 38, 618, { stroke: "ink", sw: 4 });
    });

    // the long table: surface top, field2 near face
    const table = grp(root);
    kit.polygon(table, [[70, 790], [1850, 790], [1920, 850], [0, 850]], { fill: "surface" });
    kit.rect(table, -6, 850, W + 12, 240, { fill: "field2", r: 0 });
    kit.line(table, 0, 850, W, 850, { stroke: "line", sw: 5 });

    // the veil: the room is slightly held back until next_week_full
    const veil = kit.rect(root, 0, 0, W, H, Object.assign({ fill: "field" }, flat));
    const VEIL = { emptying: 0.22, week_later: 0.22, replay: 0.2, next_week_full: 0 };
    const ASK = { emptying: 1, week_later: 0, replay: 0, next_week_full: 0 };

    function apply(name, t) {
      if (!(name in VEIL)) throw new Error("meeting_room: unknown state " + name);
      setOp(askew, ASK[name], t);
      setOp(tidy, 1 - ASK[name], t);
      if (name === "next_week_full" && t != null) {
        // colour lift: stepped to the same veil value first, then one eased drive to full colour
        const d = 0.6;
        Loom.drive(function (e) { veil.setAttribute("opacity", (0.2 * (1 - e)).toFixed(3)); }, t, d, "editorial", { key: "meeting_room_veil" });
      } else {
        setOp(veil, VEIL[name], t);
      }
    }
    apply("emptying", null);

    return {
      root: root, veil: veil, window: win, door: door, table: table, chairs: { tidy: tidy, askew: askew },
      anchors: {
        calendar: { x: 96, y: 124, w: 220, h: 240 },
        door: { x: 1640, y: 210, w: 170, h: 520 },
        window: { x: 1010, y: 130, w: 320, h: 270 },
        tableTop: { y: 790 },
        seatL: { x: 820, y: 640 },
        seatR: { x: 1380, y: 650 },
      },
      setState: apply,
    };
  };

  // ---------------------------------------------------------------------------------------------
  // comment_bubble, natural 900 x 300
  // Anatomy: chat bubble (surface, ink outline, soft tail bottom left); a vague line (muted, centred);
  // a ghost line at 15 % along the top band (the previous wording); three rows each with a tint pill,
  // a text and an accent underline: behaviour (accent3), effect (field2), step (accent4); a dashed gap
  // slot in row 2; a grey veil.
  // States: vague, grey, ghost, behaviour, gap, effect, step_open, complete.
  // ---------------------------------------------------------------------------------------------
  Loom.lesson.comment_bubble = function (ctx, parent, opts) {
    const kit = ctx.kit, m = ctx.m;
    const NW = 900, NH = 300;
    const root = rootFor(parent, opts, NW, NH);
    const flat = { r: 0, shadow: false, crisp: true };
    const VAGUE = "Great energy in there today";
    const WORDS = {
      behaviour: "In that meeting, you spoke over Priya",
      effect: "Priya could not finish her point",
      step: "Next time, could you let her finish first?",
    };

    // body, then tail, then a seam cover so the outline runs into the tail
    const body = grp(root);
    kit.rect(body, 4, 4, 892, 248, { fill: "surface", r: 34, flat: true });
    kit.path(body, "M 96 250 C 94 278 80 292 52 298 C 104 298 154 280 178 250 Z", { fill: "surface", stroke: "ink", sw: 5 });
    kit.rect(body, 101, 247, 72, 8, { fill: "surface", r: 0, shadow: false, crisp: true, flat: true });

    // grey veil (inside the outline)
    const veil = grp(root);
    kit.rect(veil, 8, 8, 884, 240, { fill: "field2", r: 30, shadow: false, crisp: true, flat: true });

    // vague wording
    const vague = grp(root);
    const vagueText = kit.text(vague, VAGUE, { role: "body", x: 48, y: 60, w: 804, h: 132, align: "center", valign: "middle", maxLines: 2, color: "muted" });

    // ghost: the previous wording, 15 % along the top band
    const ghost = grp(root);
    kit.text(ghost, VAGUE, { role: "caption", x: 40, y: 14, w: 820, h: 34, align: "left", valign: "middle", maxLines: 1, color: "ink" });

    // rows
    const RY = { behaviour: 52, effect: 116, step: 180 };
    const TINT = { behaviour: "accent3", effect: "field2", step: "accent4" };
    const slots = {};
    const mkSlot = function (key, withText) {
      const y = RY[key];
      const g = grp(root);
      const fill = grp(g);
      kit.rect(fill, 28, y, 844, 56, { fill: TINT[key], r: 16, shadow: false, crisp: true, flat: true });
      const textG = grp(g);
      const text = kit.text(textG, WORDS[key], { role: "body", x: 46, y: y, w: 808, h: 56, align: "left", valign: "middle", maxLines: 1, color: "ink" });
      const uw = Math.min(808, Math.ceil((text.__fit && text.__fit.width) || 500));
      const ug = grp(root, { opacity: 0 });
      const uline = kit.line(ug, 46, y + 49, 46 + uw, y + 49, { stroke: "accent", sw: 5 });
      slots[key] = { g: g, fill: fill, textG: textG, text: text, underline: { g: ug, line: uline }, rect: { x: 28, y: y, w: 844, h: 56 } };
    };
    mkSlot("behaviour"); mkSlot("effect"); mkSlot("step");

    // dashed gap slot, row 2 (revealed by opacity, never drawn)
    const gap = grp(root);
    kit.path(gap, rr(28, RY.effect, 844, 56, 16), { fill: "none", stroke: "muted", sw: 4, dash: "14 10" });

    // state table: 1 = visible
    const ST = {
      vague:     { vague: 1, veil: 0, ghost: 0, b: 0, e: 0, sFill: 0, sText: 0, gap: 0, ub: 0, ue: 0 },
      grey:      { vague: 1, veil: 0.65, ghost: 0, b: 0, e: 0, sFill: 0, sText: 0, gap: 0, ub: 0, ue: 0 },
      ghost:     { vague: 0, veil: 0, ghost: 0.15, b: 0, e: 0, sFill: 0, sText: 0, gap: 0, ub: 0, ue: 0 },
      behaviour: { vague: 0, veil: 0, ghost: 0.15, b: 1, e: 0, sFill: 0, sText: 0, gap: 0, ub: 1, ue: 0 },
      gap:       { vague: 0, veil: 0, ghost: 0.15, b: 1, e: 0, sFill: 0, sText: 0, gap: 1, ub: 0, ue: 0 },
      effect:    { vague: 0, veil: 0, ghost: 0.15, b: 1, e: 1, sFill: 0, sText: 0, gap: 0, ub: 0, ue: 1 },
      step_open: { vague: 0, veil: 0, ghost: 0.15, b: 1, e: 1, sFill: 1, sText: 0, gap: 0, ub: 0, ue: 0 },
      complete:  { vague: 0, veil: 0, ghost: 0.15, b: 1, e: 1, sFill: 1, sText: 1, gap: 0, ub: 0, ue: 0 },
    };
    function apply(name, t) {
      const s = ST[name];
      if (!s) throw new Error("comment_bubble: unknown state " + name);
      setOp(vague, s.vague, t);
      setOp(veil, s.veil, t);
      setOp(ghost, s.ghost, t);
      setOp(slots.behaviour.g, s.b, t);
      setOp(slots.effect.g, s.e, t);
      setOp(slots.step.fill, s.sFill, t);
      setOp(slots.step.textG, s.sText, t);
      setOp(slots.step.g, s.sFill, t);
      setOp(gap, s.gap, t);
      setOp(slots.behaviour.underline.g, s.ub, t);
      setOp(slots.effect.underline.g, s.ue, t);
    }
    apply("vague", null);
    // underline for the step slot is hidden at build; slots' text groups start as set above
    slots.step.fill.setAttribute("opacity", 0);
    slots.step.textG.setAttribute("opacity", 0);
    slots.step.g.setAttribute("opacity", 0);

    // light a slot: its accent underline draws (the newest part carries it; settled parts keep the tint)
    function light(key, t, o) {
      const u = slots[key].underline;
      setOp(u.g, 1, t);
      m.draw(u.line, t, { dur: (o && o.dur) || dur(ctx, "draw", 0.8) });
      if (o && o.settleAt != null) setOp(u.g, 0, o.settleAt);
    }

    return {
      root: root, body: body, vague: vague, vagueText: vagueText, ghost: ghost, veil: veil, gapSlot: gap,
      slots: slots, underline: { behaviour: slots.behaviour.underline, effect: slots.effect.underline, step: slots.step.underline },
      setState: apply, light: light,
      tail: { x: 52, y: 298 },
    };
  };

  // ---------------------------------------------------------------------------------------------
  // wall_calendar, natural 220 x 240
  // Anatomy: stack edge, two drawn pages (this week, next week) swapped in one step (no tween), accent3
  // header band (74 high) with hand-lettered words centred well inside it, a grid of empty day cells
  // with the current week row tinted, two ring pins. States: this_week, next_week.
  // ---------------------------------------------------------------------------------------------
  Loom.lesson.wall_calendar = function (ctx, parent, opts) {
    const kit = ctx.kit;
    const NW = 220, NH = 240;
    const root = rootFor(parent, opts, NW, NH);
    kit.rect(root, 7, 9, 212, 228, { fill: "field2", r: 10, flat: true });

    const BAND = 74, GY = 84, ROW = 33;
    const mkPage = function (label, row, dogEar) {
      const g = grp(root);
      kit.rect(g, 0, 0, 212, 232, { fill: "surface", r: 10, shadow: false, crisp: true, flat: true });
      kit.rect(g, 14, GY + row * ROW, 184, ROW, { fill: "field2", r: 4, shadow: false, crisp: true, flat: true });
      for (let i = 0; i <= 4; i++) kit.line(g, 14, GY + i * ROW, 198, GY + i * ROW, { stroke: "muted", sw: 2 });
      for (let j = 0; j <= 7; j++) kit.line(g, 14 + j * (184 / 7), GY, 14 + j * (184 / 7), GY + 4 * ROW, { stroke: "muted", sw: 2 });
      kit.path(g, "M 0 " + BAND + " V 10 Q 0 0 10 0 H 202 Q 212 0 212 10 V " + BAND + " Z", { fill: "accent3", stroke: "none", sw: 0 });
      kit.line(g, 0, BAND, 212, BAND, { stroke: "ink", sw: 4 });
      const txt = kit.text(g, label, { role: "label", x: 16, y: 10, w: 180, h: 54, align: "center", valign: "middle", maxLines: 1, weight: 400, color: "ink" });
      if (dogEar) kit.polygon(g, [[176, 232], [212, 196], [176, 196]], { fill: "field2" });
      kit.path(g, rr(0, 0, 212, 232, 10), { fill: "none", stroke: "ink", sw: 5 });
      return { g: g, text: txt };
    };
    const A = mkPage("This week", 1, false);
    const B = mkPage("Next week", 2, true);
    // ring pins stay over both pages
    kit.disc(root, 56, 8, 9, { fill: "muted" });
    kit.disc(root, 156, 8, 9, { fill: "muted" });

    function apply(name, t) {
      if (name !== "this_week" && name !== "next_week") throw new Error("wall_calendar: unknown state " + name);
      const next = name === "next_week";
      setOp(A.g, next ? 0 : 1, t);
      setOp(B.g, next ? 1 : 0, t);
    }
    apply("this_week", null);
    B.g.setAttribute("opacity", 0);

    return { root: root, pages: { thisWeek: A.g, nextWeek: B.g }, labels: { thisWeek: A.text, nextWeek: B.text }, setState: apply };
  };
})();
