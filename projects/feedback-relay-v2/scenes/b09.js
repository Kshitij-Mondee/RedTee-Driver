// @design gap_fills_with_effect: the empty slot prints the effect while the speaker's own point breaks off
// Treatments: (1) slot swap + text reveal over two-shot (chosen); (2) static composition with underline only; (3) character close-up fading point.
Loom.scene("b09", { build(ctx, props) {
  const kit = ctx.kit, m = ctx.m;
  const R = ctx.el("meeting_room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  const room = Loom.lesson.meeting_room(ctx, R.inner, {});
  room.setState("replay", null);

  const PS = ctx.el("sam", { x: 0, y: 0, w: 1920, h: 1080, kind: "character", exit: "recede" });
  kit.peep(PS.inner, "man", "neutral", { x: 700, y: 640, size: 560, skin: 2, cloth: "cloth" });
  const PP = ctx.el("priya", { x: 0, y: 0, w: 1920, h: 1080, kind: "character", exit: "recede" });
  kit.peep(PP.inner, "woman", "surprised", { x: 1300, y: 650, size: 520, flip: true, skin: 3, cloth: "cloth2" });
  const TB = ctx.el("table_front", { x: 0, y: 780, w: 1920, h: 300, kind: "scenery", exit: "recede" });
  kit.polygon(TB.inner, [[70, 10], [1850, 10], [1920, 70], [0, 70]], { fill: "surface" });
  kit.rect(TB.inner, -6, 70, 1932, 240, { fill: "field2", r: 0 });
  kit.line(TB.inner, 0, 70, 1920, 70, { stroke: "line", sw: 5 });

  const C = ctx.el("comment_bubble", { x: 480, y: 90, w: 960, h: 320, kind: "bubble", exit: "recede" });
  const cb = Loom.lesson.comment_bubble(ctx, C.inner, { w: 960 });
  cb.setState("gap", null);
  const tE = ctx.cue("Priya could not finish");
  cb.setState("effect", tE);
  m.reveal(cb.slots.effect.text, tE);
  cb.light("effect", tE + 0.2, { dur: 0.7 });

  const HB = ctx.el("priya_half_bubble", { x: 1230, y: 440, w: 300, h: 110, kind: "bubble", exit: "recede" });
  kit.rect(HB.inner, 4, 4, 280, 90, { fill: "surface", r: 40 });
  const dots = [0, 1, 2].map(function (i) { return kit.disc(HB.inner, 70 + i * 60, 49, 12, { fill: "ink" }); });
  const tH = ctx.cue("her point");
  m.pop(HB, tH - 0.3);
  // dots fade one by one while the bubble itself leaves with them, never an empty container
  dots.forEach(function (d, i) { Loom.tween(d, { opacity: 1 }, { opacity: 0 }, tH + 1.0 + i * 0.07, {}); });
  Loom.tween(HB.life, { opacity: 1 }, { opacity: 0 }, tH + 1.0, {});

  const T = ctx.el("effect_tag", { x: 1450, y: 190, w: 240, h: 90, kind: "token", exit: "recede" });
  kit.rect(T.inner, 4, 4, 232, 82, { fill: "field2", r: 18 });
  kit.disc(T.inner, 34, 45, 8, { fill: "ink" });
  kit.text(T.inner, "Effect", { role: "label", x: 56, y: 12, w: 170, h: 66, align: "center", valign: "middle", maxLines: 1, color: "ink" });
  m.drop(T, ctx.cue("what happened"));

  const G = ctx.el("guess_bubble", { x: 600, y: 330, w: 170, h: 130, kind: "bubble", exit: "recede" });
  kit.path(G.inner, "M 20 20 H 150 V 110 H 20 Z", { fill: "surface", stroke: "muted", sw: 4, dash: "10 8" });
  kit.icon(G.inner, "circle-help", { x: 50, y: 30, size: 70, color: "muted" });
  const tG = ctx.cue("not a guess at motives");
  m.pop(G, tG);
  Loom.tween(G.life, { opacity: 1 }, { opacity: 0 }, tG + 0.9, {});
} });
