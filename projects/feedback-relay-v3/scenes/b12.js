// @design same_room_changed: the opening frame returns, the vague cloud leaves and a clear voice takes its place
Loom.scene("b12", { build(ctx, props) {
  const kit = ctx.kit, sv = Loom.svg;
  const SIZE = 640, Y = 620;
  // treatments: (1) static bright room, (2) split before/after, (3) chosen: same frame, cloud dissolves, sheet and bubble arrive
  const backEl = ctx.el("meeting_room_back", { x: 0, y: 0, w: 1920, h: 1080, kind: "scene", exit: "none" });
  const roomB = Loom.lesson.meeting_room(ctx, backEl.inner, { layer: "back" });
  const mgr = ctx.el("manager", { x: 480 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
  const dev = ctx.el("dev", { x: 1440 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
  const mg = sv("g", {}, mgr.inner);
  kit.peep(mg, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 1 });
  const dS = kit.peep(dev.inner, "man", "surprised", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 });
  const dX = kit.peep(dev.inner, "man", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 });
  dX.style.visibility = "hidden";
  const frontEl = ctx.el("meeting_room_front", { x: 0, y: 0, w: 1920, h: 1080, kind: "scene", exit: "none" });
  const roomF = Loom.lesson.meeting_room(ctx, frontEl.inner, { layer: "front" });
  const cloudEl = ctx.el("fuzzy_cloud", { x: 1500 - 260, y: 90, w: 520, h: 240, kind: "card", exit: "recede" });
  const cloud = Loom.lesson.fuzzy_cloud(ctx, cloudEl.inner, {});

  const tBack = ctx.cue("Back in the meeting");
  const tParts = ctx.cue("three parts");
  const tView = ctx.cue("he shares a view first");
  const tTerms = ctx.cue("good terms");
  const tChange = ctx.cue("The change was");

  // sheet on the table
  const sheetEl = ctx.el("sheet", { x: 760, y: 760, w: 400, h: 150, kind: "card", exit: "recede" });
  const sheetG = sv("g", { opacity: 0 }, sheetEl.inner);
  Loom.lesson.build_board(ctx, sheetG, { variant: "sheet", w: 400, words: false });
  const lblEl = ctx.el("sheet_label", { x: 760, y: 700, w: 400, h: 56, kind: "label", exit: "recede" });
  const lblG = sv("g", { opacity: 0 }, lblEl.inner);
  kit.text(lblG, "three parts", { role: "label", x: 0, y: 0, w: 400, h: 48, align: "center", valign: "middle", color: "ink", weight: 400, maxLines: 1 });
  sv("line", { x1: 120, y1: 52, x2: 280, y2: 52, stroke: ctx.c("muted"), "stroke-width": 4, "stroke-linecap": "round" }, lblG);

  // Dev's clear bubble
  const bubEl = ctx.el("dev_bubble", { x: 1150, y: 140, w: 350, h: 220, kind: "card", exit: "recede" });
  const bG = sv("g", { opacity: 0 }, bubEl.inner);
  sv("path", { d: "M170 190 L196 216 L215 190 Z", fill: ctx.c("accent"), stroke: ctx.c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, bG);
  kit.rect(bG, 0, 0, 350, 196, { fill: "accent", r: 28 });
  ["three parts", "we lost your view", "share a view first"].forEach(function (s, i) {
    kit.text(bG, s, { role: "label", x: 24, y: 20 + i * 54, w: 302, h: 48, align: "center", valign: "middle", color: "field", weight: 400, maxLines: 1 });
  });

  // note
  const noteEl = ctx.el("good_terms_note", { x: 1190, y: 790, w: 230, h: 90, kind: "card", exit: "recede" });
  const nG = sv("g", { opacity: 0 }, noteEl.inner);
  kit.rect(nG, 0, 0, 230, 90, { fill: "surface", r: 8 });
  kit.text(nG, "good terms", { role: "label", x: 10, y: 10, w: 210, h: 70, align: "center", valign: "middle", color: "ink", weight: 400, maxLines: 1 });

  roomF.dropNameplate(ctx.start + 0.1, 0.5);
  cloud.setState("hanging", ctx.start, { dur: 4, amp: 2 });
  cloud.setState("dissolving", tParts - 0.3, { dur: 0.8 });
  Loom.drive(function (e) {
    sheetG.setAttribute("transform", "translate(0 " + (-120 * (1 - e)).toFixed(1) + ")");
    sheetG.style.opacity = Math.min(1, e * 4).toFixed(2);
  }, tParts, 0.6, "overshoot");
  Loom.drive(function (e) { lblG.style.opacity = e.toFixed(2); }, tParts + 0.5, 0.4, "move");
  Loom.tl.set(dS, { visibility: "hidden" }, tView);
  Loom.tl.set(dX, { visibility: "visible" }, tView);
  Loom.drive(function (e) {
    bG.setAttribute("transform", "translate(196 216) scale(" + Math.max(e, 0.001).toFixed(3) + ") translate(-196 -216)");
    bG.style.opacity = Math.min(1, e * 4).toFixed(2);
  }, tView + 0.1, 0.6, "overshoot");
  Loom.drive(function (e) {
    mg.setAttribute("transform", "rotate(" + (4 * Math.sin(e * Math.PI)).toFixed(2) + " " + SIZE / 2 + " " + SIZE + ")");
  }, tTerms - 0.3, 0.7, "move");
  Loom.drive(function (e) {
    nG.setAttribute("transform", "translate(0 " + (-70 * (1 - e)).toFixed(1) + ")");
    nG.style.opacity = Math.min(1, e * 4).toFixed(2);
  }, tTerms, 0.5, "overshoot");
  roomB.setState("bright", tChange, { dur: 1.2 });
  roomF.setState("bright", tChange, { dur: 1.2 });
} });
