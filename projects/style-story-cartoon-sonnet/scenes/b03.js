// @design reasons_rise_then_fade: three paper thought bubbles rise one by one over a still person, then lose their hold as she straightens
/* Treatments: (A) all three bubbles at once (rejected: no arrival), (B) a column on the wall (rejected: far from
 * Maya), (C) CHOSEN: three bubbles pop beside and above Maya, one per phrase, then dim and fade. */
Loom.scene("b03", {
  build(ctx) {
    const { kit, m } = ctx;
    const tReasons = ctx.cue("ordinary reasons");
    const tWrong = ctx.cue("What if I'm wrong");
    const tCost = ctx.cue("What will it cost me");
    const tBiz = ctx.cue("my business");

    // b03 is a cut from the close shot: the medium set is built fresh
    Loom.lesson.desk_set(ctx, ctx.station.svg, { layer: "back", laptop: "sheet", ring: true, magnifier: false });
    const maya = ctx.character("maya", "maya", { x: 1580, y: 1710, scale: 0.85, pose: "idle", parent: ctx.station.svg });
    Loom.lesson.desk_set(ctx, ctx.station.svg, { layer: "front", laptop: "sheet", ring: true, magnifier: false });

    // Maya: shoulders drop and think on "ordinary reasons", straighten on the last words
    if (maya && typeof maya.pose === "function") {
      maya.pose("think", tReasons, { dur: 0.6 });
      maya.pose("idle", tBiz + 0.4, { dur: 0.6 });
    }
    if (maya && typeof maya.emotion === "function") {
      maya.emotion("concern", tReasons + 0.2);
      maya.emotion("neutral", tBiz + 0.4);
    }

    // the three reasons: bubbles stacked up and to the left of her head, rising one by one
    const specs = [
      { name: "bubble_wrong", text: "What if I'm wrong?", x: 1004, y: 330, t: tWrong, puffs: true },
      { name: "bubble_cost", text: "What will it cost me?", x: 1004, y: 205, t: tCost },
      { name: "bubble_business", text: "Not my business", x: 1004, y: 90, t: tBiz },
    ];
    const ink = ctx.c("ink");
    const els = specs.map((s) => {
      // @form thought_bubble: a paper reason that rises over her and loses its hold
      const E = ctx.el(s.name, { x: s.x, y: s.y, w: 500, h: 150, kind: "bubble", parent: ctx.station.svg });
      kit.rect(E.inner, 0, 0, 420, 100, { fill: "surface", r: 40 });
      if (s.puffs) {
        Loom.svg("circle", { cx: 440, cy: 102, r: 11, fill: ctx.c("surface"), stroke: ink, "stroke-width": 5 }, E.inner);
        Loom.svg("circle", { cx: 462, cy: 126, r: 6, fill: ctx.c("surface"), stroke: ink, "stroke-width": 4 }, E.inner);
      }
      kit.text(E.inner, s.text, { role: "body", size: 34, x: 20, y: 8, w: 380, h: 84, maxLines: 1, align: "center", valign: "middle", color: "ink" });
      m.pop(E, s.t);
      return E;
    });
    els.forEach((E, i) => {
      Loom.tween(E.inner, { opacity: 1 }, { opacity: 0.35 }, tBiz + 0.5, { dur: 0.4, key: "dim" });
      m.exit(E, ctx.end - 0.6 + i * 0.04, "recede");
    });
  },
});
