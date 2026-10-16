// @design label_becomes_mark: the name tag peels away and the first mark takes its place
// Treatments: (A) tag simply vanishes and the card appears (rejected: no physical replacement,
// the design's own point); (B) tag and mark cross-fade in place (rejected: two things changing at
// once, no clear reading order); (C) CHOSEN: the tag peels off Leo on its own word and falls, THEN
// mark 1 drops onto the table edge on the next line, so the viewer reads one swap, in order.
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const EMOTIONS = ["neutral", "happy", "surprised", "explaining"];

    // a peep with all four kit emotions pre-drawn; face(name, t) shows exactly one
    function makeFace(parent, member, size, skin, cloth, flip) {
      const groups = {};
      EMOTIONS.forEach((e) => {
        const g = Loom.svg("g", { style: "display:none" }, parent);
        kit.peep(g, member, e, { x: size / 2, y: size / 2, size, flip, cloth, skin });
        groups[e] = g;
      });
      function face(name, t) {
        EMOTIONS.forEach((e) => {
          Loom.tl.set(groups[e], { display: e === name ? "inline" : "none" }, t);
        });
      }
      return face;
    }

    // 1. scaffold: the shared desk set, two-shot, no nameplates
    const setEl = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    const set = Loom.lesson.desk_set(ctx, setEl.inner, { w: 1920, h: 1080 });
    set.setState("two_shot", ctx.start);
    setEl.ui = set;
    m.reveal(setEl, ctx.start + 0.02, { dy: 0 });

    const A = set.anchors;

    // @form you_bust: You, steady, watching Leo take it in
    const youEl = ctx.el("you", {
      x: A.you.x - A.you.size / 2, y: A.you.y - A.you.size / 2,
      w: A.you.size, h: A.you.size, kind: "character", exit: "none", parent: set.peepLayer,
    });
    const youFace = makeFace(youEl.inner, "woman", A.you.size, 3, "cloth", false);
    youFace("neutral", ctx.start);
    youEl.ui = { face: youFace };
    m.pop(youEl, ctx.start + 0.05);
    m.drift(youEl, ctx.start + 0.3, ctx.end, { amp: 3, period: 3.0 });

    // @form leo_bust: Leo, neutral then explaining as he leans in
    const leoEl = ctx.el("leo", {
      x: A.leo.x - A.leo.size / 2, y: A.leo.y - A.leo.size / 2,
      w: A.leo.size, h: A.leo.size, kind: "character", exit: "none", parent: set.peepLayer,
    });
    const leoFace = makeFace(leoEl.inner, "man", A.leo.size, 1, "cloth2", true);
    leoFace("neutral", ctx.start);
    leoEl.ui = { face: leoFace };
    m.pop(leoEl, ctx.start + 0.1);
    m.drift(leoEl, ctx.start + 0.3, ctx.end, { amp: 3, period: 3.2 });

    // 2. the planner: reference above, Thursday already circled in ink from frame one
    const plannerEl = ctx.el("planner", { x: 640, y: 20, w: 640, h: 297, kind: "card", exit: "none" });
    const planner = Loom.lesson.week_planner(ctx, plannerEl.inner, { w: 640, h: 297 });
    planner.setState("due_thu_settled", ctx.start, { accent: false });
    plannerEl.ui = planner;
    m.reveal(plannerEl, ctx.start + 0.15, { dy: -10 });

    // 3. the marks rail shelf, and its first slot
    const railEl = ctx.el("rail", { x: 460, y: 760, w: 1000, h: 120, kind: "card", exit: "none" });
    const rail = Loom.lesson.marks_rail(ctx, railEl.inner, { w: 1000, h: 120 });
    railEl.ui = rail;
    m.reveal(railEl, ctx.start + 0.1, { dy: 0 });

    const slot1 = rail.slots(460, 760, 1000, 120).mark_1;
    const mark1El = ctx.el("mark_1", { x: slot1.x, y: slot1.y, w: slot1.w, h: slot1.h, kind: "card", exit: "none" });
    const mark1 = Loom.lesson.mark_card(ctx, mark1El.inner, { i: 1, w: slot1.w, h: slot1.h });
    mark1El.ui = mark1;

    // 4. the name tag: already stuck on Leo's chest when the beat opens.
    // Leo el is 1060,320,600x600; his chin sits around y 700, so the tag's box is
    // placed to rest at chest height (box y 750-870, centre y 810, within the
    // 760-820 chest band), well below the chin and just above the table edge (880).
    const tagEl = ctx.el("name_tag", { x: 1226, y: 750, w: 208, h: 120, kind: "token" });
    const tag = Loom.lesson.name_tag(ctx, tagEl.inner, { w: 208, h: 120 });
    Loom.tl.set(tag.root, { scale: 1, rotation: -6, opacity: 1 }, ctx.start);
    tagEl.ui = tag;

    // --- choreography on the words ---
    const t1 = ctx.cue("start with what you saw");
    tag.setState("peeling", t1);

    const t2 = ctx.cue("You told me on Thursday");
    mark1.setState("drop", t2);
    mark1.setState("lit", t2 + 0.5);

    const t3 = ctx.cue("the due day");
    planner.setState("thu_tick", t3);

    const t4 = ctx.cue("An action, not a character");
    leoFace("explaining", t4);
    Loom.tween(leoEl.mover, { x: 0 }, { x: -30, duration: 0.3, ease: "move" }, t4, { kind: "gesture", beat: "b07", name: "leo_lean_in" });
  },
});
