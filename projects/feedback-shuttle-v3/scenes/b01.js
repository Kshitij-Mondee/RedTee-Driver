// @design vague_nod_two_shot: a light, friendly line is said across a table and answered with a nod; both people look at ease
/* Treatments considered:
 * (A) a static two-shot with the bubble already up and a caption-like signal (rejected: no moment, the nod has no cause);
 * (B) a close two-shot of the bubble only (rejected: loses the room and the two people the lesson keeps returning to);
 * (C) CHOSEN: the room just before the meeting's end mark, two muted extras (seated, as in b02) get up and leave behind the table,
 *     Asha's bubble pops with the vague line, Ben answers with a happy face and a small double nod. The card is the one accent.
 * Layers: set (whole room, table included) < extras (chairs + muted people clipped above the table edge) < busts < card.
 * The bubble element is named "card_b01": the plain name "card" is used by the message card of b07 to b10, and a repeated
 * name drew this vague bubble over b07's card.
 */
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const L = Loom.lesson;
    const A = L.meeting_room.anchors;

    // 1. the set: the whole room in one element, held by the next beat
    const set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    L.meeting_room(ctx, set.inner, { layer: "all", state: "two_shot" });
    m.reveal(set, ctx.start + 0.02, { dy: 0 });

    // 2. the wall clock, just before its end mark
    const clock = ctx.el("clock", { x: A.clock.x, y: A.clock.y, w: 180, h: 180, kind: "instrument", exit: "none" });
    L.wall_clock(ctx, clock.inner, { state: "on_time" });
    m.settle(clock, ctx.start + 0.12, { dy: 12 });

    // 3. two muted extras, drawn as in b02: chairs from a clipped copy of the room, people (ctx.crowd, tone muted)
    //    clipped at the table edge and around the mug so the table stays in front. They slide out sideways, then the chairs fade.
    const extras = ctx.el("extras", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const defs = Loom.svg("defs", {}, extras.inner);
    const cp = Loom.svg("clipPath", { id: "b01chairs" }, defs);
    [[686, 686, 168, 211.5], [1066, 686, 168, 211.5]].forEach((r) => Loom.svg("rect", { x: r[0], y: r[1], width: r[2], height: r[3] }, cp));
    const cp2 = Loom.svg("clipPath", { id: "b01people" }, defs);
    Loom.svg("path", { d: "M0 0H1920V897.5H0Z M1004 846H1094V897.5H1004Z", "clip-rule": "evenodd" }, cp2);
    const chairG = Loom.svg("g", { "clip-path": "url(#b01chairs)" }, extras.inner);
    const chairs = L.meeting_room(ctx, chairG, { layer: "back" });
    chairs.setState("extras_space", ctx.start, 0);
    const crowdClip = Loom.svg("g", { "clip-path": "url(#b01people)" }, extras.inner);
    const gA = Loom.svg("g", {}, crowdClip);
    const gB = Loom.svg("g", {}, crowdClip);
    ctx.crowd("extras_left", { x: 800, y: 1115, w: 1, count: 1, rows: 1, scale: 0.65, tone: "muted", parent: gA });
    ctx.crowd("extras_right", { x: 1120, y: 1115, w: 1, count: 1, rows: 1, scale: 0.65, tone: "muted", parent: gB });
    m.reveal(extras, ctx.start + 0.05, { dy: 0 });
    const tOut0 = ctx.cue("Say a colleague's meeting");
    const tOut1 = ctx.cue("ran long again") + 0.5;
    const outDur = Math.max(0.5, tOut1 - tOut0);
    Loom.drive((e, raw) => {
      const p = raw * raw;
      gA.setAttribute("transform", "translate(" + (-1100 * p).toFixed(1) + " 0)");
      gB.setAttribute("transform", "translate(" + (1100 * p).toFixed(1) + " 0)");
    }, tOut0, outDur, "linear", { kind: "scenery", beat: ctx.beat.id, name: "extras", content: true });
    Loom.drive((e, raw) => { chairG.setAttribute("opacity", (1 - raw).toFixed(3)); }, tOut1, 0.5, "linear", { kind: "scenery", beat: ctx.beat.id, name: "extras", content: true });

    // 4. the two people, one look each (CAST); the table hides their bases, so they arrive without a vertical drop
    const SIZE = 560, Y = 620;
    const asha = ctx.el("asha", { x: 380 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const ben = ctx.el("ben", { x: 1540 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const EMOS = ["neutral", "explaining", "happy"];
    const fa = {}, fb = {};
    for (const em of EMOS) {
      fa[em] = kit.peep(asha.inner, "woman", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
      fb[em] = kit.peep(ben.inner, "man", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
      fa[em].style.visibility = em === "neutral" ? "visible" : "hidden";
      fb[em].style.visibility = em === "neutral" ? "visible" : "hidden";
    }
    m.reveal(asha, ctx.start + 0.1, { dy: 0 });
    m.reveal(ben, ctx.start + 0.2, { dy: 0 });

    // 5. faces: one drive per person, a pure function of time (no closed-eyes neutral held past 4 s)
    const tLong = ctx.cue("ran long again"), tLight = ctx.cue("You keep it light"), tNod = ctx.cue("They nod");
    const ashaFace = (t) => (t >= tLight ? "happy" : t >= tLong + 0.7 ? "explaining" : "neutral");
    const benFace = (t) => (t >= tNod ? "happy" : t >= tLong ? "explaining" : "neutral");
    const T0 = ctx.start, T1 = ctx.end, D = Math.max(0.1, T1 - T0);
    [["asha", fa, ashaFace], ["ben", fb, benFace]].forEach(([who, F, fn]) => {
      Loom.drive((e, raw) => {
        const want = fn(T0 + raw * D);
        for (const em of EMOS) F[em].style.visibility = em === want ? "visible" : "hidden";
      }, T0, D, "linear", { kind: "character", beat: ctx.beat.id, name: who, content: true });
    });

    // 6. Ben's small double nod on "They nod": the head dips twice, the base stays on the table edge
    const nodDur = 0.9;
    Loom.drive((e, raw) => {
      const s = 1 - 0.04 * Math.abs(Math.sin(raw * Math.PI * 2));
      ben.inner.setAttribute("transform", "translate(0 " + SIZE + ") scale(1 " + s.toFixed(4) + ") translate(0 " + (-SIZE) + ")");
    }, tNod + 0.1, nodDur, "linear", { key: "b01nod", kind: "character", beat: ctx.beat.id, name: "ben", content: true });

    // 7. Asha's bubble: the one accent, pops with overshoot on its words
    const card = ctx.el("card_b01", { x: A.card.cx - 410, y: A.card.cy - 210, w: 820, h: 420, kind: "bubble", exit: "recede" });
    const mc = L.message_card(ctx, card.inner, {});
    mc.setState("vague", ctx.start, 0);
    m.pop(card, ctx.cue("Maybe tighten it up"));
  },
});
