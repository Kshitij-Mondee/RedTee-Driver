// @design held_comment_gap: the comment holds its shape and the next part is an empty dashed slot
Loom.scene("b08", { build(ctx, props) {
  const kit = ctx.kit, m = ctx.m;
  const roomE = ctx.el("room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
  const room = Loom.lesson.meeting_room(ctx, roomE.inner, {});
  room.setState("replay", null);

  const sE = ctx.el("Sam", { x: 560, y: 540, w: 360, h: 380, kind: "character", exit: "recede" });
  kit.peep(sE.inner, "man", "neutral", { x: 0, y: 0, size: 360, cloth: "cloth", skin: 2 });
  const pE = ctx.el("Priya", { x: 1200, y: 540, w: 360, h: 380, kind: "character", exit: "recede" });
  kit.peep(pE.inner, "woman", "neutral", { x: 0, y: 0, size: 360, flip: true, cloth: "cloth2", skin: 3 });

  const bE = ctx.el("comment_bubble", { x: 510, y: 240, w: 900, h: 300, kind: "bubble", exit: "recede" });
  const b = Loom.lesson.comment_bubble(ctx, bE.inner, {});
  b.setState("behaviour", null);
  b.slots.behaviour.underline.g.setAttribute("opacity", 0);
  b.setState("gap", null);
  b.gapSlot.setAttribute("opacity", 0);

  const tPush = ctx.cue("Now you");
  m.travel(bE, tPush, { x: -180, y: -120, scale: 1.4, dur: 1.2 });

  const tGap = ctx.cue("still missing");
  Loom.tween(b.gapSlot, { opacity: 0 }, { opacity: 1 }, tGap, { dur: 0.4 });
  const gp = b.gapSlot;
  for (let i = 0; i < 2; i++) {
    const t0 = tGap + 0.5 + i * 1.6;
    Loom.drive((e) => {
      const s = 1 + 0.04 * Math.sin(Math.PI * e);
      gp.setAttribute("transform", "translate(450 144) scale(" + s.toFixed(4) + ") translate(-450 -144)");
    }, t0, 1.6, "linear");
  }

  const tagE = ctx.el("missing_tag", { x: 1080, y: 335, w: 360, h: 130, kind: "card", exit: "recede" });
  const g = tagE.inner;
  kit.polygon(g, [[40, 30], [340, 30], [340, 120], [40, 120], [4, 75]], { fill: "surface", stroke: "ink", sw: 4 });
  kit.disc(g, 40, 75, 8, { fill: "muted" });
  kit.line(g, 40, 75, 120, 4, { stroke: "ink", sw: 3 });
  kit.text(g, "Still missing?", { role: "label", x: 62, y: 38, w: 270, h: 74, align: "center", valign: "middle", maxLines: 1, color: "ink" });
  m.drop(tagE, ctx.cue("missing"), {});
} });
