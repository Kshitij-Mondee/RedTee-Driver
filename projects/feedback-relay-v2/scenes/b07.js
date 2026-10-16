// @design label_to_behaviour: a label peels off a person and the comment swaps word by word into what he did
// Treatments: (1) static two-shot with underline only; (2) comment swaps in place while tag falls (chosen); (3) sticky note rewrite (brush alt).
Loom.scene("b07", {
  build(ctx, props) {
    const kit = ctx.kit, m = ctx.m;
    const room = ctx.el("meeting_room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const R = Loom.lesson.meeting_room(ctx, room.inner, {});
    R.setState("replay", null);

    const samE = ctx.el("Sam", { x: 420, y: 360, w: 560, h: 440, kind: "character" });
    kit.peep(samE.inner, "man", "neutral", { x: 280, y: 360, size: 560, skin: 2, cloth: "cloth" });
    const priE = ctx.el("Priya", { x: 1040, y: 380, w: 520, h: 420, kind: "character" });
    const pN = Loom.svg("g", {}, priE.inner), pS = Loom.svg("g", { opacity: 0 }, priE.inner);
    kit.peep(pN, "woman", "neutral", { x: 260, y: 340, size: 520, flip: true, skin: 3, cloth: "cloth2" });
    kit.peep(pS, "woman", "surprised", { x: 260, y: 340, size: 520, flip: true, skin: 3, cloth: "cloth2" });

    const pbE = ctx.el("priya_bubble", { x: 1150, y: 450, w: 300, h: 110, kind: "bubble" });
    kit.rect(pbE.inner, 4, 4, 292, 90, { fill: "surface", r: 30, flat: true });
    const pbOk = Loom.svg("g", {}, pbE.inner), pbBrk = Loom.svg("g", { opacity: 0 }, pbE.inner);
    kit.line(pbOk, 40, 36, 260, 36, { stroke: "muted", sw: 8 });
    kit.line(pbOk, 40, 66, 200, 66, { stroke: "muted", sw: 8 });
    kit.line(pbBrk, 40, 36, 130, 36, { stroke: "muted", sw: 8 });
    kit.line(pbBrk, 190, 36, 260, 36, { stroke: "neg", sw: 8, dash: "6 14" });
    kit.line(pbBrk, 40, 66, 90, 66, { stroke: "muted", sw: 8 });
    const sbE = ctx.el("sam_bubble", { x: 560, y: 450, w: 300, h: 110, kind: "bubble" });
    kit.rect(sbE.inner, 4, 4, 292, 90, { fill: "accent3", r: 30, stroke: "ink", sw: 4 });
    kit.line(sbE.inner, 40, 36, 260, 36, { stroke: "ink", sw: 8 });
    kit.line(sbE.inner, 40, 66, 230, 66, { stroke: "ink", sw: 8 });

    const cE = ctx.el("comment_bubble", { x: 480, y: 90, w: 960, h: 320, kind: "bubble", exit: "none" });
    const C = Loom.lesson.comment_bubble(ctx, cE.inner, { x: 0, y: 0, w: 960 });

    const tE = ctx.el("label_tag", { x: 330, y: 600, w: 240, h: 80, kind: "icon", exit: "recede" });
    const tg = Loom.svg("g", {}, tE.inner);
    kit.rect(tg, 4, 4, 232, 70, { fill: "surface", r: 12, stroke: "ink", sw: 4 });
    kit.text(tg, "Dominating", { role: "label", x: 14, y: 10, w: 212, h: 58, align: "center", valign: "middle", maxLines: 1, color: "ink" });

    const bE = ctx.el("behaviour_tag", { x: 1330, y: 125, w: 300, h: 100, kind: "icon", exit: "none" });
    kit.path(bE.inner, "M 4 50 L 40 6 H 290 V 94 H 40 Z", { fill: "accent3", stroke: "ink", sw: 4 });
    kit.disc(bE.inner, 40, 50, 8, { fill: "surface" });
    kit.text(bE.inner, "A behaviour", { role: "label", x: 58, y: 14, w: 224, h: 72, align: "center", valign: "middle", maxLines: 1, color: "ink" });

    const kE = ctx.el("connector", { x: 900, y: 385, w: 260, h: 80, kind: "connector", exit: "recede" });
    const arr = kit.arrow(kE.inner, 20, 6, 200, 72, { stroke: "accent" });

    const tPeel = ctx.cue("say what he did");
    Loom.drive(function (e) {
      tg.setAttribute("transform", "translate(" + (e * 30) + " " + (e * e * 500) + ") rotate(" + (e * 40) + " 120 40)");
    }, tPeel, 0.5, "enter");
    Loom.tl.set(tg, { opacity: 0 }, tPeel + 0.5);

    const t1 = ctx.cue("In that meeting");
    C.setState("ghost", t1);
    C.setState("behaviour", t1 + 0.35);
    m.reveal(C.slots.behaviour.text, t1 + 0.35, {});
    Loom.tl.set(C.slots.behaviour.underline.g, { opacity: 0 }, t1 + 0.37);

    const t2 = ctx.cue("spoke over Priya");
    C.light("behaviour", t2, { dur: 0.8 });
    m.travel(sbE, t2 + 0.4, { x: 420, y: 0 });

    const t3 = ctx.cue("mid-point");
    Loom.tl.set(pN, { opacity: 0 }, t3);
    Loom.tl.set(pS, { opacity: 1 }, t3);
    Loom.tl.set(pbOk, { opacity: 0 }, t3);
    Loom.tl.set(pbBrk, { opacity: 1 }, t3);

    const t4 = ctx.cue("You could have heard it");
    m.draw(arr, t4, { dur: 0.8, headAt: 0.9 });

    const t5 = ctx.cue("That is a behaviour");
    m.drop(bE, t5, {});
  }
});
