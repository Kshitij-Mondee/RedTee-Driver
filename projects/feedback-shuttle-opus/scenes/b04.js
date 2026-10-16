// @design feelings_moved_actions_did_not: a close on Leo while two gauges show the gap between what changed and what didn't
// Treatments: (A) one dial only with a before/after swap (rejected: loses the simultaneous contrast);
// (B) bar chart pair (rejected: style calls for paper gauges, not data bars, and this is a feeling not a metric);
// (C) CHOSEN: two round paper gauges side by side, Feelings needle springs down on its cue, Actions needle
// shivers and holds exactly still (the one accent), Leo reacts last. Build order: set, Leo, both dial faces,
// the actions needle (drawn above, same box footprint, so the table front never hides it), the sign.
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;

    // 1. scaffold: the shared office set, Leo's close framing
    const setEl = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    const set = Loom.lesson.desk_set(ctx, setEl.inner, { w: 1920, h: 1080 });
    set.setState("leo_close", ctx.start);
    setEl.ui = set;
    m.reveal(setEl, ctx.start + 0.02, { dy: 0 });

    // Leo: four baked emotions, face(name, t) swaps which shows (b02's makeFace pattern)
    function makeFace(E, member, opts) {
      const emotions = ["neutral", "happy", "surprised", "explaining"];
      const groups = {};
      emotions.forEach((e) => {
        const g = Loom.svg("g", { style: "display:none" }, E.inner);
        kit.peep(g, member, e, opts);
        groups[e] = g;
      });
      Loom.tl.set(groups.neutral, { display: "inline" }, ctx.start);
      function face(name, t) {
        emotions.forEach((e) => {
          Loom.tl.set(groups[e], { display: e === name ? "inline" : "none" }, t);
        });
      }
      return { face };
    }

    // @form leo_close_bust: Leo, neutral then surprised when the fix lands
    const leoEl = ctx.el("leo", {
      x: 1100, y: 120, w: 720, h: 720, kind: "character", exit: "none", parent: set.peepLayer,
    });
    leoEl.ui = makeFace(leoEl, "man", { x: 360, y: 360, size: 720, flip: true, cloth: "cloth2", skin: 1 });
    m.pop(leoEl, ctx.start + 0.05);

    // 2. the two gauges: scene-drawn, above the table, left two thirds, clear of the caption band
    function dialFace(E, label) {
      kit.disc(E.inner, 160, 160, 140, { fill: "surface", stroke: "ink", sw: 6 });
      kit.text(E.inner, label, { role: "label", x: 10, y: 24, w: 300, h: 50, align: "center", valign: "middle", maxLines: 1, color: "ink" });
      kit.disc(E.inner, 160, 160, 12, { fill: "ink" });
    }
    // the needle's rotation must pivot at the dial centre (160,160) in the element's LOCAL
    // space: an outer group translates the origin there (SVG attribute transform, not a CSS
    // transform-origin style, which a tween's own transform write silently overrides), and an
    // inner group at that origin (0,0) is what Loom.tween rotates; the line is drawn 0,0 to
    // 0,-100 (pointing up, length 100, same as before) so rotating the inner group swings it
    // exactly like a real needle stuck in the dial face. Loom.tween rotates by its bounding
    // box's default origin (top-left, near the tip) unless the tween's own to-vars carry a
    // transformOrigin, so every rotation tween below sets transformOrigin: "50% 100%" (the
    // bottom centre of the needle's own box, which is the dial centre, 0,0).
    function needleGroup(E, stroke) {
      const pivot = Loom.svg("g", { transform: "translate(160 160)" }, E.inner);
      const spin = Loom.svg("g", {}, pivot);
      kit.line(spin, 0, 0, 0, -100, { stroke: stroke, sw: 7 });
      return spin;
    }

    // @form feelings_gauge: round paper gauge, its own needle, starts neutral (pointing up)
    const feelingsEl = ctx.el("feelings_dial", { x: 180, y: 420, w: 320, h: 320, kind: "instrument" });
    dialFace(feelingsEl, "Feelings");
    const feelingsNeedle = needleGroup(feelingsEl, "ink");
    m.pop(feelingsEl, ctx.start + 0.12);

    // @form actions_gauge: round paper gauge, label only, its needle is the separate actions_needle el
    const actionsEl = ctx.el("actions_dial", { x: 600, y: 420, w: 320, h: 320, kind: "instrument" });
    dialFace(actionsEl, "Actions");
    m.pop(actionsEl, ctx.start + 0.18);

    // @form actions_needle_mark: the needle that does not move; the scene's one accent
    const actionsNeedleEl = ctx.el("actions_needle", { x: 600, y: 420, w: 320, h: 320, kind: "instrument" });
    const actionsNeedle = needleGroup(actionsNeedleEl, "accent");
    m.pop(actionsNeedleEl, ctx.start + 0.22);

    // @form caption_plaque: the one-line verdict sign, appears once both needles have spoken
    const signEl = ctx.el("caption_sign", { x: 180, y: 230, w: 740, h: 110, kind: "card" });
    kit.rect(signEl.inner, 0, 0, 740, 110, { fill: "surface", stroke: "ink", sw: 5, r: 10 });
    kit.text(signEl.inner, "Feelings changed. Actions didn't.", { role: "lead", x: 24, y: 10, w: 692, h: 90, align: "center", valign: "middle", maxLines: 2, color: "ink" });

    // --- choreography on the words ---
    const t1 = ctx.cue("His feelings changed");
    Loom.tween(feelingsNeedle, { rotation: 0 }, { rotation: -115, duration: 0.5, ease: "overshoot", transformOrigin: "50% 100%" }, t1, { kind: "gesture", beat: "b04", name: "feelings_swing" });

    const t2 = ctx.cue("His actions didn't");
    const sh = 0.1;
    Loom.tween(actionsNeedle, { rotation: 0 }, { rotation: 8, duration: sh, ease: "move", transformOrigin: "50% 100%" }, t2, { kind: "gesture", beat: "b04", name: "actions_shiver_1" });
    Loom.tween(actionsNeedle, { rotation: 8 }, { rotation: -6, duration: sh, ease: "move", transformOrigin: "50% 100%" }, t2 + sh, { kind: "gesture", beat: "b04", name: "actions_shiver_2" });
    Loom.tween(actionsNeedle, { rotation: -6 }, { rotation: 3, duration: sh, ease: "move", transformOrigin: "50% 100%" }, t2 + 2 * sh, { kind: "gesture", beat: "b04", name: "actions_shiver_3" });
    Loom.tween(actionsNeedle, { rotation: 3 }, { rotation: 0, duration: sh, ease: "move", transformOrigin: "50% 100%" }, t2 + 3 * sh, { kind: "gesture", beat: "b04", name: "actions_shiver_4" });

    m.pop(signEl, t2 + 0.7);

    const t3 = ctx.cue("fix that one sentence");
    leoEl.ui.face("surprised", t3);
  },
});
