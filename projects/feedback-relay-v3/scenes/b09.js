// @design turn_passes_between_two_seated: a calm room with three lettered cues, then a question bubble shrinks as the other speaker's bubble opens
Loom.scene("b09", { build(ctx, props) {
  const kit = ctx.kit, c = ctx.c;
  const tCalm = ctx.cue("calm");
  const tPriv = ctx.cue("private");
  const tSoon = ctx.cue("soon after");
  const tAsk = ctx.cue("Then ask how");
  const tCtx = ctx.cue("He may know");
  const tPulse = ctx.cue("Soon, private, ask first");
  const tFirst = ctx.cue("ask first");
  const sv = (tag, a, p) => Loom.svg(tag, a, p);

  const setBack = ctx.el("coffee_back", { x: 0, y: 0, w: 1920, h: 1080, kind: "set", exit: "none" });
  const cc = Loom.lesson.coffee_corner(ctx, setBack.inner, { layer: "back" });

  const SIZE = 600, Y = 620;
  const mgr = ctx.el("manager", { x: 520 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
  const dev = ctx.el("dev", { x: 1400 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
  const mH = kit.peep(mgr.inner, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 1 });
  const mE = kit.peep(mgr.inner, "woman", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 1 });
  const dH = kit.peep(dev.inner, "man", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 });
  const dE = kit.peep(dev.inner, "man", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 });
  mE.style.opacity = 0; dE.style.opacity = 0;
  Loom.tl.set(mH, { opacity: 0 }, tAsk); Loom.tl.set(mE, { opacity: 1 }, tAsk);
  Loom.tl.set(mE, { opacity: 0 }, tCtx); Loom.tl.set(mH, { opacity: 1 }, tCtx);
  Loom.tl.set(dH, { opacity: 0 }, tCtx); Loom.tl.set(dE, { opacity: 1 }, tCtx);

  const setFront = ctx.el("coffee_front", { x: 0, y: 0, w: 1920, h: 1080, kind: "set", exit: "none" });
  Loom.lesson.coffee_corner(ctx, setFront.inner, { layer: "front" });

  const pop = (g, t, dur, ox, oy) => Loom.drive((e, raw) => {
    g.style.opacity = Math.min(1, raw * 4).toFixed(2);
    const k = Math.max(e, 0.001);
    g.setAttribute("transform", "translate(" + ox + " " + oy + ") scale(" + k.toFixed(3) + ") translate(" + (-ox) + " " + (-oy) + ")");
  }, t, dur, "overshoot");
  const drop = (g, t, dur) => Loom.drive((e, raw) => {
    g.style.opacity = Math.min(1, raw * 4).toFixed(2);
    g.setAttribute("transform", "translate(0 " + (-80 * (1 - e)).toFixed(1) + ")");
  }, t, dur, "overshoot");
  const pulse = (el, t, cx, cy) => Loom.drive((e, raw) => {
    const k = 1 + 0.06 * Math.sin(raw * Math.PI);
    el.setAttribute("transform", "translate(" + cx + " " + cy + ") scale(" + k.toFixed(3) + ") translate(" + (-cx) + " " + (-cy) + ")");
  }, t, 0.25, "linear");

  const pen = ctx.el("pennant_calm", { x: 860, y: 250, w: 200, h: 130, kind: "sign", exit: "recede" });
  const pg = sv("g", { opacity: 0 }, pen.inner);
  const pp = sv("g", {}, pg);
  // @form pennant: hanging pennant with the word calm
  sv("path", { d: "M10 12 H190 V84 L100 124 L10 84 Z", fill: c("accent3"), stroke: c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, pp);
  kit.text(pp, "calm", { role: "label", x: 24, y: 20, w: 152, h: 56, align: "center", valign: "middle", color: "ink", weight: 400, size: 30, maxLines: 1 });
  drop(pg, tCalm, 0.6);
  cc.hook.g.style.opacity = 0;
  Loom.tl.set(cc.hook.g, { opacity: 1 }, tCalm);

  const sg = ctx.el("door_sign", { x: 1630, y: 490, w: 180, h: 80, kind: "sign", exit: "recede" });
  const sgg = sv("g", { opacity: 0 }, sg.inner);
  const sgp = sv("g", {}, sgg);
  // @form door_sign: sign hung on the closed door
  kit.rect(sgp, 4, 4, 172, 68, { fill: "surface", r: 8 });
  kit.text(sgp, "private", { role: "label", x: 10, y: 10, w: 160, h: 56, align: "center", valign: "middle", color: "ink", weight: 400, size: 34, maxLines: 1 });
  drop(sgg, tPriv, 0.5);

  cc.tickClock(tSoon, 0.3);
  const tg = ctx.el("clock_tag", { x: 150, y: 280, w: 200, h: 70, kind: "sign", exit: "recede" });
  const tgg = sv("g", { opacity: 0 }, tg.inner);
  const tgp = sv("g", {}, tgg);
  // @form clock_tag: tag hanging by the clock
  kit.rect(tgp, 4, 4, 192, 60, { fill: "surface", r: 8 });
  kit.text(tgp, "soon after", { role: "label", x: 10, y: 8, w: 180, h: 52, align: "center", valign: "middle", color: "ink", weight: 400, size: 32, maxLines: 1 });
  drop(tgg, tSoon + 0.3, 0.5);

  const mb = ctx.el("manager_bubble", { x: 620, y: 170, w: 240, h: 200, kind: "bubble", exit: "recede" });
  const mbg = sv("g", { opacity: 0 }, mb.inner);
  const mbp = sv("g", {}, mbg);
  // @form manager_bubble: question bubble from the manager
  sv("path", { d: "M40 10 H200 Q230 10 230 40 V110 Q230 140 200 140 H90 L20 185 L50 140 H40 Q10 140 10 110 V40 Q10 10 40 10 Z", fill: c("surface"), stroke: c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, mbp);
  kit.text(mbp, "?", { role: "lead", x: 60, y: 24, w: 120, h: 100, align: "center", valign: "middle", color: "ink", weight: 400, size: 70, maxLines: 1 });
  pop(mbg, tAsk, 0.5, 20, 185);
  Loom.drive((e) => {
    const k = 1 - 0.4 * e;
    mbp.setAttribute("transform", "translate(20 185) scale(" + k.toFixed(3) + ") translate(-20 -185)");
  }, tCtx, 0.8, "move");
  const lb = ctx.el("ask_first_label", { x: 670, y: 352, w: 220, h: 60, kind: "text", exit: "wipe" });
  const lbg = sv("g", { opacity: 0 }, lb.inner);
  kit.text(lbg, "ask first", { role: "label", x: 0, y: 0, w: 240, h: 50, align: "left", valign: "middle", color: "ink", weight: 400, size: 34, maxLines: 1 });
  const ul = sv("line", { x1: 0, y1: 52, x2: 130, y2: 52, stroke: c("muted"), "stroke-width": 4, "stroke-linecap": "round" }, lbg);
  Loom.drive((e, raw) => { lbg.style.opacity = Math.min(1, raw * 3).toFixed(2); }, tFirst, 0.4, "move");
  Loom.drive((e) => { ul.setAttribute("transform", "translate(0 0) scale(" + Math.max(e, 0.001).toFixed(3) + " 1)"); }, tFirst + 0.3, 0.4, "move");

  const db = ctx.el("dev_bubble", { x: 1080, y: 250, w: 280, h: 230, kind: "bubble", exit: "recede" });
  const dbg = sv("g", { opacity: 0 }, db.inner);
  // @form dev_bubble: Dev's reply bubble with the word context
  sv("path", { d: "M40 10 H240 Q270 10 270 40 V140 Q270 170 240 170 H230 L262 215 L190 170 H40 Q10 170 10 140 V40 Q10 10 40 10 Z", fill: c("surface"), stroke: c("accent"), "stroke-width": 7, "stroke-linejoin": "round" }, dbg);
  kit.text(dbg, "context", { role: "label", x: 24, y: 40, w: 232, h: 90, align: "center", valign: "middle", color: "ink", weight: 400, size: 46, maxLines: 1 });
  pop(dbg, tCtx + 0.1, 0.8, 262, 215);

  pulse(pp, tPulse, 100, 60);
  pulse(sgp, tPulse + 0.4, 90, 40);
  pulse(tgp, tPulse + 0.8, 100, 34);
} });
