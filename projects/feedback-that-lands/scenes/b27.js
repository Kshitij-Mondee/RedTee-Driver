// @design posture_transform_continued: a held room in which the listener's body visibly changes from braced to leaning in
// b27 holds b26's room. The one change that carries the point is the report's posture, driven by ONE progress.
Loom.scene("b27", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat, D = Loom.data, C = Loom.cam, S = ctx.style;
    const svg = Loom.svg, f = (v) => Math.round(v * 10) / 10;
    const tStill = ctx.cue("No verdict in any of it");
    const tLook = ctx.cue("look at the report");
    const tListen = ctx.cue("Listening");
    const tDefence = ctx.cue("lining up a defence");

    // everything in the room is held: it does not enter again
    const room = ctx.held("room"), mayaE = ctx.held("maya"), rep = ctx.held("report");
    ["update", "card", "reply", "reply_q", "daytile", "tick_impact"].forEach((n) => ctx.held(n));
    const R = room && room.__R, maya = mayaE && mayaE.actor;
    if (!R || !maya || !rep) return;

    // Maya goes still and listens: no verdict, nothing to add
    maya.pose("listen", tStill, { dur: 0.6 });
    maya.emotion("listening", tStill);

    // the camera turns its attention to the report's shoulder (the place's own driver carries it)
    C.push(R, { to: [1560, 880], scale: 1.4, t0: tLook, t1: tLook + 1.7 });

    // the posture transform: braced (0) to leaning in (1), one progress drives shoulders, head and torso
    const u0 = 0.25;
    Loom.drive((e) => rep.post(u0 + (1 - u0) * e), tListen, 2.0, "editorial", { kind: "posture", beat: ctx.beat.id, name: "report", content: true });

    // the name for what is drawn, riding in the near layer beside the head
    const near = R.layers.near.g;
    const inNear = Object.assign({}, ctx, { el: (n, o) => ctx.el(n, Object.assign({ parent: near }, o)) });
    const lw = ctx.kit.fit("Listening", { role: "label", w: 900, maxLines: 1, weight: 800, tracking: 1 }).width * 1.06 + 24;
    D.tag(inNear, "tag_listening", { text: "Listening", x: 1500 - lw, y: 878, pad: 12, t: tListen + 0.25 });

    // @form empty_thought_outline: a faint dashed thought outline with trailing puffs that stays empty, naming what is not being thought
    const et = ctx.el("empty_thought", { x: 1450, y: 560, w: 300, h: 200, kind: "bubble", parent: near });
    const cx = 150, cy = 90;
    [[cx - 4, 152, 9], [cx - 2, 166, 7], [cx, 178, 5]].forEach(([x, y, r]) => svg("circle", { cx: x, cy: y, r, fill: "none", stroke: S.c("line"), "stroke-width": 2.5, "stroke-dasharray": "5 4", opacity: 0.8 }, et.inner));
    svg("ellipse", { cx, cy, rx: 128, ry: 52, fill: S.c("surface"), opacity: 0.45 }, et.inner);
    svg("ellipse", { cx, cy, rx: 128, ry: 52, fill: "none", stroke: S.c("line"), "stroke-width": 3, "stroke-dasharray": "12 9", opacity: 0.85 }, et.inner);
    m.reveal(et, tDefence, { dy: 10, dur: 0.7, content: true });
    m.drift(et, tDefence + 0.7, ctx.end, { amp: 3, period: 3 });
  },
});
