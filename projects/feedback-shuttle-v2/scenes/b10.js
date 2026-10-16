// @design agreed_step_row: the third slot of the held bubble fills with the step, then a pos tick lands as both faces turn happy
/* Treatments considered: (A) a caption card "Next time: decision first" (rejected: says it, no exchange);
 * (B) CHOSEN: the held room and bubble; the step row writes on into slot 3 on "one concrete step" (same drawing as b09's
 *     effect row, one slot lower), Nina keeps her explaining face while she asks, Theo's face turns warm on "the decision
 *     you need", and a pos tick stamps on the step row on "agree it together" with both faces happy.
 * Static composition with signalling: the accent outline on the step row is the one accent.
 * Held elements keep their place; if one is missing it is drawn here with the same names and literals. */
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;
    const K = Loom.lesson.meeting_room.K, R = K.ROOM;
    const SIZE = R.nina.size;
    const rnd = (v) => Math.round(v * 100) / 100;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // 0. timings, every one a spoken phrase of this beat
    const tStep = ctx.cue("one concrete step");
    const tAsk = ctx.cue("Could you open");
    const tDec = ctx.cue("the decision you need");
    const tAgree = ctx.cue("agree it together");

    // 1. held: the room, both busts, the bubble, the wall pieces (no entrance); drawn here only if missing
    let set = ctx.held("set");
    let nina = ctx.held("nina");
    let theo = ctx.held("theo");
    let bub = ctx.held("bubble");
    ["slots", "effect_row", "budget_card"].forEach((n) => { try { ctx.held(n); } catch (e) { /* keep only */ } });
    if (!set) {
      set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
      Loom.lesson.meeting_room(ctx, set.inner, { layer: "back" });
      nina = ctx.el("nina", { x: R.nina.x - SIZE / 2, y: R.nina.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
      theo = ctx.el("theo", { x: R.theo.x - SIZE / 2, y: R.theo.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
      kit.peep(nina.inner, "woman", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
      kit.peep(theo.inner, "man", "neutral", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
      Loom.lesson.meeting_room(ctx, set.inner, { layer: "front" }).setState("nameplates", ctx.start);
    }
    if (!bub) {
      bub = ctx.el("bubble", { x: R.bubble.x, y: R.bubble.y, w: 700, h: 430, kind: "bubble", exit: "recede" });
      Loom.lesson.comment_bubble(ctx, bub.inner, { w: 700 }).setState("effect", ctx.start);
    }

    // 2. the step row: slot 3 of the bubble, written on left to right on "one concrete step"
    const s = 700 / 760, OX = 14, OY = 260;   // bubble units -> screen, relative to the row's own box
    const L = (v, o) => rnd((v - o) * s);
    const stepEl = ctx.el("step_row", { x: R.bubble.x + OX * s, y: R.bubble.y + OY * s, w: 732 * s, h: 134 * s, kind: "card", exit: "recede" });
    const clipId = Loom.uid("b10stp");
    const cp = Loom.svg("clipPath", { id: clipId }, stepEl.inner);
    const clipRect = Loom.svg("rect", { x: -10, y: -20, width: 0, height: 134 * s + 40 }, cp);
    const content = Loom.svg("g", { "clip-path": "url(#" + clipId + ")" }, stepEl.inner);
    const EY = 298;   // the row's top, as in the kit
    kit.rect(content, L(20, OX), L(EY, OY), rnd(720 * s), rnd(90 * s), { fill: "field", r: 12, flat: true, sw: 4 });
    kit.text(content, "Next time: decision first", { role: "body", weight: 700, x: L(38, OX), y: L(EY + 30, OY), w: rnd(690 * s), h: rnd(48 * s), maxLines: 1, align: "left", valign: "middle", color: "ink" });
    kit.rect(content, L(30, OX), L(EY - 32, OY), rnd(160 * s), rnd(62 * s), { fill: "accent2", r: 10, flat: true, sw: 4 });
    kit.text(content, "Next step", { role: "label", weight: 400, color: "surface", x: L(42, OX), y: L(EY - 32 + 9, OY), w: rnd((160 - 24) * s), h: rnd(44 * s), maxLines: 1, align: "center", valign: "middle" });
    Loom.svg("rect", { x: L(20, OX), y: L(EY, OY), width: rnd(720 * s), height: rnd(90 * s), rx: 12, fill: "none", stroke: ctx.c("accent"), "stroke-width": 8 }, content);
    const writeAt = (v) => {
      clipRect.setAttribute("width", rnd(clamp(v, 0, 1) * (732 * s + 20)));
      content.style.visibility = v > 0.001 ? "visible" : "hidden";
    };
    writeAt(0);
    Loom.drive((e) => writeAt(e), tStep, 0.7, "move", { key: "b10.step_write" });

    // 3. the agreed tick: a pos disc with a tick, stamped on the step row's right end on "agree it together"
    const TK = 72 * s;
    const tickEl = ctx.el("agreed_tick", { x: R.bubble.x + (694 - 36) * s, y: R.bubble.y + (302 - 36) * s, w: TK, h: TK, kind: "card", exit: "recede" });
    Loom.svg("circle", { cx: TK / 2, cy: TK / 2, r: rnd(30 * s), fill: ctx.c("pos"), stroke: ctx.c("ink"), "stroke-width": 5 }, tickEl.inner);
    kit.mark(tickEl.inner, "yes", TK / 2, TK / 2, rnd(34 * s));
    m.stamp(tickEl, tAgree + 0.1);

    // 4. ambient life, continuing the sway
    m.drift(nina, ctx.start, ctx.end, { amp: 5, period: 3 });
    m.drift(theo, ctx.start, ctx.end, { amp: 5, period: 3.4 });

    // 5. faces over the held busts: Nina keeps her explaining face (from b09) and turns happy on the agreement;
    //    Theo turns warm on "the decision you need". ONE drive, a pure function of time.
    const fNinaHappy = kit.peep(nina.inner, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
    const fTheoHappy = kit.peep(theo.inner, "man", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    fNinaHappy.style.visibility = "hidden";
    fTheoHappy.style.visibility = "hidden";
    const T0 = ctx.start, DUR = Math.max(0.1, ctx.end - T0);
    Loom.drive((e, raw) => {
      const now = T0 + raw * DUR;
      fTheoHappy.style.visibility = now >= tDec ? "visible" : "hidden";
      fNinaHappy.style.visibility = now >= tAgree + 0.1 ? "visible" : "hidden";
    }, T0, DUR, "linear", { kind: "character", beat: ctx.beat.id, name: "nina", content: true });
  },
});
