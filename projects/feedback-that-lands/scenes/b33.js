// @design over_shoulder_question_continued: the quiet party answers in a bubble from behind, a note lands on the document, the asker's picture changes
// Holds b32's room. The report leans in and answers in a plain bubble from behind (tail to the head), Maya's question dims a
// step and stays, a small amber note settles onto the update, and Maya's face changes twice: surprise, then realisation.
Loom.scene("b33", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat, S = ctx.style, svg = Loom.svg;

    // everything from b32 is held: no entrance, no exit
    const room = ctx.held("room");
    const rep = ctx.held("report");
    ["update", "card", "tick_ask"].forEach((n) => ctx.held(n));
    const maya = ctx.held("maya").__api;
    const question = ctx.held("question");
    const R = room.__R, hi = R.layers.hi.g, mid = R.layers.mid.g;

    const tAns = ctx.cue("the date was still being confirmed");
    const tNote = ctx.cue("when the update went out");
    const tSurp = ctx.cue("Maya didn't know that");
    const tNow = ctx.cue("Now she does");

    // the report answers, in its own bubble from behind, leaning in a little; her question dims a step and stays
    // @form speech_bubble: a chat bubble carrying one spoken line, typed in on the words
    const answer = T.bubble(ctx, "answer", { x: 1300, y: 590, w: 500, text: "The date was still being confirmed.", tail: [1600, 700], fill: "surface", parent: hi });
    m.reveal(answer, tAns, { content: true });
    m.typewriter(answer.inner.querySelector("text"), tAns, { dur: 1.9 });
    Loom.drive((e) => rep.__post(0.3 + 0.45 * e), tAns - 0.3, 1.2, "editorial", { kind: "posture", beat: ctx.beat.id, name: "report", content: true });
    Loom.tween(question.life, { opacity: 1 }, { opacity: 0.55, duration: ctx.style.dur("enter"), ease: Loom.ease.enter }, tAns, { kind: "dim", beat: ctx.beat.id, name: "question", content: false });

    // the fact that changes the picture: a small note settles onto the update on the table
    // @form tilted_note: a small tilted paper note laid on a document, naming one fact
    const f = kit.fit("still being confirmed", { role: "label", w: 164, maxLines: 2 });
    const NW = 200, NH = Math.ceil(f.height + 2 * 18), cx = 930, cy = 896;
    const note = ctx.el("note_confirm", { x: cx - NW / 2, y: cy - NH / 2, w: NW, h: NH, kind: "card", parent: mid });
    const paper = S.mix(ctx.c("accent2"), ctx.c("surface"), 0.84);
    svg("rect", { x: 5, y: 8, width: NW, height: NH, rx: 6, fill: ctx.c("shadow"), opacity: 0.12 }, note.inner);
    svg("rect", { x: 0, y: 0, width: NW, height: NH, rx: 6, fill: paper, stroke: ctx.c("accent2"), "stroke-width": 1.5 }, note.inner);
    svg("rect", { x: NW / 2 - 34, y: -10, width: 68, height: 20, rx: 3, fill: S.lighten(ctx.c("line"), 0.45), opacity: 0.55 }, note.inner);   // a strip of tape
    kit.text(note.inner, "still being confirmed", { role: "label", x: 18, y: 18, w: NW - 36, h: NH - 36, valign: "middle", align: "center", maxLines: 2, color: "ink" });
    note.outer.setAttribute("transform", `translate(${note.x} ${note.y}) rotate(3 ${NW / 2} ${NH / 2})`);
    m.settle(note, tNote, { content: true });

    // Maya takes it in: surprise on "didn't know", realisation on "now she does"
    maya.emotion("surprise", tSurp);
    maya.gesture("tilt", tSurp, tSurp + 1.3);
    maya.emotion("realisation", tNow);
    maya.gesture("nod", tNow, tNow + 1.1);
  },
});
