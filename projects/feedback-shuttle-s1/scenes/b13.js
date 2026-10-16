// @design two_people_reply_sequence_payoff: three replies land in turn across the gap between two colleagues, then the listener leans in, relieved
Loom.scene("b13", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const T = Loom.treat;

    const room = ctx.scenery("room", "set", { window: true, windowX: 1530, floor: 0.86 });
    m.reveal(room.E, ctx.start + 0.05, { dy: 0 });

    const SIZE = 400, Y = 800;
    const X = { priya: 480, manager: 1440 };
    const priya = ctx.el("priya_bust", { x: X.priya - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede" });
    const manager = ctx.el("manager_bust", { x: X.manager - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede" });

    const priyaFace = {
      neutral: kit.peep(priya.inner, "woman", "neutral", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 1 }),
      happy: kit.peep(priya.inner, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 1 }),
    };
    const managerFace = {
      neutral: kit.peep(manager.inner, "man", "neutral", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 }),
      explaining: kit.peep(manager.inner, "man", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 }),
    };
    priyaFace.happy.style.visibility = "hidden";
    managerFace.explaining.style.visibility = "hidden";

    m.settle(priya, ctx.start + 0.15, { dy: 30 });
    m.settle(manager, ctx.start + 0.25, { dy: 30 });

    const table = ctx.el("table", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    kit.rect(table.inner, 160, 900, 1600, 40, { fill: "surface", r: 10 });
    kit.rect(table.inner, 210, 940, 1500, 140, { fill: "field2", r: 0 });
    m.reveal(table, ctx.start + 0.05, { dy: 0 });

    const cTries = ctx.cue("Her manager tries it");
    const cLine1 = ctx.cue("the blockers were mixed into the timeline");
    const cLine2 = ctx.cue("I couldn't tell what was blocking us");
    const cLine3 = ctx.cue("What got left out, from your side?");
    const cFinal = ctx.cue("She can finally answer");

    Loom.tl.set(managerFace.neutral, { visibility: "hidden" }, cTries);
    Loom.tl.set(managerFace.explaining, { visibility: "visible" }, cTries);

    const mouth = [X.manager - SIZE * 0.1, Y - SIZE * 0.2];
    T.bubble(ctx, "reply_bubble_1", { x: 730, y: 130, w: 460, text: "When the blockers were mixed into the timeline", tail: mouth, t: cLine1 });
    T.bubble(ctx, "reply_bubble_2", { x: 730, y: 330, w: 460, text: "I couldn't tell what was blocking us", tail: mouth, t: cLine2 });
    T.bubble(ctx, "reply_bubble_3", { x: 710, y: 520, w: 500, text: "What got left out, from your side?", tail: mouth, fill: "accent", t: cLine3 });

    Loom.tl.set(priyaFace.neutral, { visibility: "hidden" }, cFinal);
    Loom.tl.set(priyaFace.happy, { visibility: "visible" }, cFinal);
    Loom.tween(priya.life, { x: 0, y: 0, scale: 1 }, { x: 30, y: -12, scale: 1.08 }, cFinal, { dur: 0.45, ease: "overshoot" });
  },
});
