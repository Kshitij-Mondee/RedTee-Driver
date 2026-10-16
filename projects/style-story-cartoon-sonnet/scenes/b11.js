// @design callback_bookend_calm_note: the opening shot returns with the same desk and person, but the pull is gone: a note is sent and a rule is stuck on the wall
Loom.scene("b11", {
  build(ctx) {
    const { kit, m } = ctx;
    const set = Loom.lesson.desk_set;
    // Treatments: (A) static desk, note already on wall; (B) CHOSEN: bookend with the note landing and writing in on the words; (C) close-up on the laptop only.
    const holder = ctx.el("desk_shot", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const back = set(ctx, holder.inner, { framing: "medium", layer: "back", ring: false, magnifier: false });
    const A = back.anchors;
    const maya = ctx.character("maya", "maya", { x: A.maya.x, y: A.maya.y, scale: A.maya.scale, pose: "idle", emotion: "relief", parent: holder.inner });
    const front = set(ctx, holder.inner, { framing: "medium", layer: "front", ring: false, magnifier: false, laptop: "sheet" });

    // sticky note on the free wall: three words in accent, written in on the spoken words
    const W = A.wall_left;
    const nw = 400, nh = 330;
    const note = ctx.el("pocket_rule", { x: W.x, y: W.y + 20, w: nw, h: nh, kind: "card", exit: "recede" });
    const ng = note.inner;
    kit.rect(ng, 0, 0, nw, nh, { fill: "surface", r: 6 });
    kit.rect(ng, 0, 0, nw, 34, { fill: "field2", r: 6 });
    const words = ["Notice.", "Weigh.", "Speak up."];
    const wel = words.map((w, i) => {
      const e = ctx.el("pocket_rule_" + (i + 1), { x: 6, y: 40 + i * 94, w: nw - 12, h: 100, kind: "text", parent: ng });
      kit.text(e.inner, w, { role: "title", x: 16, y: 0, w: nw - 28, h: 100, align: "left", valign: "middle", maxLines: 1, color: "accent" });
      return e;
    });

    // the beat
    maya.emotion("relief", ctx.cue("Back at her desk"));
    maya.gesture("nod", ctx.cue("Back at her desk") + 0.3, ctx.cue("Back at her desk") + 1.1);
    front.setState("laptop_mail", ctx.cue("sends a calm note"));
    front.setState("sent_on", ctx.cue("calm note") + 0.5);
    m.drop(note, ctx.cue("Notice it") - 0.1);
    m.unmask(wel[0], ctx.cue("Notice it") + 0.2, { dir: "ltr" });
    m.unmask(wel[1], ctx.cue("Weigh it"), { dir: "ltr" });
    m.unmask(wel[2], ctx.cue("Speak up"), { dir: "ltr" });
    front.setState("laptop_closed", ctx.cue("Honesty, not proof"));
    maya.emotion("smile", ctx.cue("Honesty, not proof"));
    maya.gesture("nod", ctx.cue("Honesty, not proof") + 0.3, ctx.cue("Honesty, not proof") + 1.2);
  },
});
