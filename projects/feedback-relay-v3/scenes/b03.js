// @design label_marked_then_empty_day: a vague word is ringed and named an impression, then Dev's question mark turns into an empty day he cannot fill
Loom.scene("b03", { build(ctx, props) {
  const kit = ctx.kit;
  // treatments: (1) static ring + label, (2) black turn card, (3) chosen: dim room, brush ring, thought turning to empty Tuesday
  const H = function (n) { try { return ctx.held(n); } catch (e) { return null; } };
  const bl = H("board_lettering");
  const vb = H("viewer_bubble");
  const SIZE = 640, Y = 620;
  const backEl = ctx.el("b03_room_back", { x: 0, y: 0, w: 1920, h: 1080, kind: "scene", exit: "none" });
  const room = Loom.lesson.meeting_room(ctx, backEl.inner, { layer: "back" });
  const mgr = ctx.el("b03_manager", { x: 480 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
  kit.peep(mgr.inner, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 1 });
  const dev = ctx.el("b03_dev", { x: 1440 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
  const dH = kit.peep(dev.inner, "man", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 });
  const frontEl = ctx.el("b03_room_front", { x: 0, y: 0, w: 1920, h: 1080, kind: "scene", exit: "none" });
  const fr = Loom.lesson.meeting_room(ctx, frontEl.inner, { layer: "front" });
  const cloudEl = ctx.el("b03_cloud", { x: 1240, y: 90, w: 520, h: 240, kind: "card", exit: "none" });
  const cloud = Loom.lesson.fuzzy_cloud(ctx, cloudEl.inner, {});
  cloud.setState("drop_in", ctx.start, { dur: 0.05 });
  cloud.setState("hanging", ctx.start + 0.1, { dur: 16, amp: 2 });
  const tSlip = ctx.cue("Here is where people slip");
  const tEng = ctx.cue("Engaged");
  const tImp = ctx.cue("an impression");
  const tHow = ctx.cue("how he came across");
  const tWhat = ctx.cue("what to do");
  const tTue = ctx.cue("Tuesday");

  // board lettering wipes off, empty bubble leaves
  if (bl) {
    const cp = Loom.svg("clipPath", { id: "b03_wipe" }, bl.inner);
    const r = Loom.svg("rect", { x: 0, y: 0, width: 484, height: 240 }, cp);
    bl.inner.setAttribute("clip-path", "url(#b03_wipe)");
    Loom.drive(function (e) { r.setAttribute("x", (484 * e).toFixed(1)); r.setAttribute("width", Math.max(0.01, 484 * (1 - e)).toFixed(1)); }, tSlip, 0.5, "move");
  }
  if (vb) {
    Loom.drive(function (e) { vb.inner.style.opacity = (1 - e).toFixed(2); }, tSlip + 0.1, 0.5, "move");
  }

  // dim one step
  room.setState("dim", tSlip + 0.5, { dur: 0.8 });
  fr.setState("dim", tSlip + 0.5, { dur: 0.8 });

  // Dev surprised on 'how he came across'
  if (dev) {
    const sp = kit.peep(dev.inner, "man", "surprised", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 });
    sp.style.visibility = "hidden";
    Loom.tl.set(sp, { visibility: "visible" }, tHow);
    Loom.tl.set(dH, { visibility: "hidden" }, tHow);
  }

  // brush ring round 'engaged' (cloud sits at x 1240, y 90)
  // @form ring: brush circle round the vague word
  Loom.brush.paint(ctx, "engaged_ring", { x: 1395, y: 210, w: 210, h: 68, seed: 5, layers: [{ at: tEng, reveal: "wipe", dir: "right", dur: 0.7, draw: function (b, W, Hh) { b.set("2B", ctx.c("ink"), 2.2); b.noFill(); const pts = []; for (let i = 0; i <= 34; i++) { const a = -2.2 + i * 0.2; pts.push([W / 2 + (W / 2 - 14) * Math.cos(a) * (1 + i * 0.002), Hh / 2 + (Hh / 2 - 8) * Math.sin(a)]); } b.polygon(pts); } }] });

  // label under the cloud
  const lab = ctx.el("impression_label", { x: 1360, y: 306, w: 280, h: 70, kind: "label", exit: "recede" });
  const lg = Loom.svg("g", { opacity: 0 }, lab.inner);
  // @form impression_label: underline label under the cloud
  kit.text(lg, "an impression", { role: "label", x: 0, y: 0, w: 280, h: 50, align: "center", valign: "middle", color: "ink", weight: 400, maxLines: 1 });
  const ul = Loom.svg("line", { x1: 20, y1: 58, x2: 260, y2: 58, stroke: ctx.c("muted"), "stroke-width": 4, "stroke-linecap": "round" }, lab.inner);
  Loom.drive(function (e) {
    lg.style.opacity = Math.min(1, e * 2).toFixed(2);
    lg.setAttribute("transform", "translate(0 " + (-16 * (1 - e)).toFixed(1) + ")");
  }, tImp, 0.4, "overshoot");
  Loom.drive(function (e) {
    ul.setAttribute("transform", "translate(20 0) scale(" + Math.max(e, 0.001).toFixed(3) + " 1) translate(-20 0)");
  }, tImp + 0.4, 0.4, "move");
  ul.setAttribute("transform", "translate(20 0) scale(0.001 1) translate(-20 0)");

  // Dev's thought bubble
  const tb = ctx.el("thought_bubble", { x: 900, y: 430, w: 340, h: 260, kind: "bubble", exit: "recede" });
  const bg = Loom.svg("g", { opacity: 0 }, tb.inner);
  // @form thought_bubble: Dev's thought, a question then an empty day
  Loom.svg("path", { d: "M50 10 H290 Q330 10 330 50 V160 Q330 200 290 200 H50 Q10 200 10 160 V50 Q10 10 50 10 Z", fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, bg);
  Loom.svg("circle", { cx: 302, cy: 226, r: 11, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 4 }, bg);
  Loom.svg("circle", { cx: 328, cy: 246, r: 6, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 4 }, bg);
  const q = Loom.svg("g", {}, bg);
  kit.text(q, "?", { role: "title", size: 90, x: 100, y: 25, w: 140, h: 160, align: "center", valign: "middle", color: "muted", weight: 400, maxLines: 1 });
  const cal = Loom.svg("g", { opacity: 0 }, bg);
  // @form tuesday_square: empty calendar day headed Tuesday
  kit.rect(cal, 70, 28, 200, 150, { fill: "field", r: 8, sw: 4 });
  [[70, 128, 270, 128], [170, 78, 170, 178]].forEach(function (l) {
    Loom.svg("line", { x1: l[0], y1: l[1], x2: l[2], y2: l[3], stroke: ctx.c("muted"), "stroke-width": 2, opacity: 0.35 }, cal);
  });
  const hd = Loom.svg("g", { opacity: 0 }, cal);
  kit.rect(hd, 70, 28, 200, 50, { fill: "accent", r: 8, sw: 4 });
  kit.text(hd, "Tuesday", { role: "label", x: 70, y: 28, w: 200, h: 50, align: "center", valign: "middle", color: "field", weight: 400, maxLines: 1 });
  Loom.drive(function (e, raw) {
    bg.style.opacity = Math.min(1, raw * 2.5).toFixed(2);
    bg.setAttribute("transform", "translate(0 " + (30 * (1 - e)).toFixed(1) + ")");
  }, tHow + 0.3, 0.6, "overshoot");
  Loom.drive(function (e, raw) {
    q.style.opacity = (1 - raw).toFixed(2);
    cal.style.opacity = raw.toFixed(2);
  }, tWhat, 0.3, "move");
  Loom.drive(function (e, raw) {
    hd.style.opacity = Math.min(1, raw * 4).toFixed(2);
    const k = 1 + 0.0 + (1 - e) * 0.5;
    hd.setAttribute("transform", "translate(170 53) scale(" + k.toFixed(3) + ") translate(-170 -53)");
  }, tTue, 0.35, "overshoot");
} });
