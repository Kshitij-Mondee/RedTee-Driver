// @design place_push_to_work_continued: the same office held while a character crosses it without stopping
// b05 - Maya walks past the report's desk, says the line in passing, keeps walking.
// Treatments considered: (A) a two-person dialogue template (rejected: it makes the exchange look like a real
// conversation, the opposite of the point), (B) Maya stops at the desk (rejected: she never stops, that is the lesson),
// (C) CHOSEN: Maya crosses behind the cubicle panel with a coffee, her hip-down hidden by it (no walk cycle needed),
// a chat bubble hangs where she said it, the report does not turn round. The camera pulls back to the wide first.
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, D = Loom.data, T = Loom.treat, svg = Loom.svg;

    // ---- hold the whole office from b04 (nothing re-enters, nothing leaves at the join)
    const office = ctx.held("office"), part = ctx.held("partition"), rep = ctx.held("report");
    ["monitor", "update", "calendar", "calendar_days", "dust"].forEach((n) => ctx.held(n));
    const P = office.place, mid = P.layers.mid.g;

    // ---- cues
    const tWalk = ctx.cue("walks past their desk"), tPassing = ctx.cue("in passing");
    const tSay = ctx.cue("That update wasn't great"), tKeeps = ctx.cue("keeps walking");
    const tSayEnd = tSay + 2.0, tOut = ctx.speechEnd + 0.2;

    // ---- the camera eases back from the push to the wide room (finishes inside b04's camera driver window)
    Loom.cam.push(P, { to: [960, 540], scale: 1, t0: ctx.start + 0.1, t1: ctx.start + 1.45 });

    // ---- Maya: coffee in hand, crossing right to left behind the panel; no walk cycle, a step bob carries it
    // @form walker_behind_screen: a character crosses behind a low screen so only the upper body reads, with a step bob
    const maya = ctx.character("maya_walk", "maya", { x: 0, y: 790, scale: 0.42, pose: "coffee", parent: mid });
    mid.insertBefore(maya.E.outer, part.outer);      // behind the panel, so it hides her below the hip
    const X0 = 2150, X1 = -300;
    Loom.tween(maya.E.mover, { x: X0 }, { x: X1, duration: tOut - tWalk, ease: "none" }, tWalk, { kind: "travel", beat: ctx.beat.id, name: "maya_walk", content: true });
    Loom.drive((e, raw) => { const t = tWalk + raw * (tOut - tWalk); maya.E.life.setAttribute("transform", `translate(0 ${(-Math.abs(Math.sin(Math.PI * t / 0.5)) * 6).toFixed(2)})`); }, tWalk, tOut - tWalk, "linear", { kind: "ambient", beat: ctx.beat.id, name: "maya_walk.bob" });
    maya.emotion("neutral", 0);
    maya.talk(tSay, tSayEnd);
    maya.gesture("tilt", tSay + 0.1, tSay + 1.3);
    const xAt = (t) => X0 + (X1 - X0) * (t - tWalk) / (tOut - tWalk);

    // ---- the line, hanging where she said it
    const bub = T.bubble(ctx, "bubble", { x: 1300, y: 142, w: 680, text: "That update wasn't great.", tail: [xAt(tSay) + 70, 150], kind: "speech", tone: "accent4", t: tSay });
    m.exit(bub, tKeeps + 0.7, "recede");

    // ---- the tag on the floor under her path
    D.tag(ctx, "tag_passing", { x: 400, y: 812, text: "In passing", color: "accent", t: tPassing });

    // ---- the report: unchanged, breathing, never turns round
    m.drift(rep, ctx.start, ctx.end, { amp: 1.6, period: 4 });
  },
});
