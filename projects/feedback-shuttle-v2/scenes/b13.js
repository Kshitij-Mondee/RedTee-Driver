// @design lift_one_and_fill_its_parts: the chosen card steps forward and its three empty slots fill in turn
/* b13 - It is B. Treatments: (A) a verdict banner over the cards (rejected: tells, does not map),
 * (B) arrows from B to three labels (rejected: new words, clutter), (C) CHOSEN: card B lifts with a pos ring
 * and its own three slots tick in on the three spoken parts (shows the answer mapped onto the parts). */
Loom.scene("b13", {
  build(ctx) {
    const { kit } = ctx;
    const K = Loom.lesson.meeting_room.K;
    const num = (v) => Math.round(v * 100) / 100;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // placement matches b12 exactly: answer_cards at scale 0.9, origin (204, 510)
    const S0 = 0.9, ox = 204, oy = 510;
    // held from b12: the laptop (inbox) and its mail row stay as b12 left them; card_b marker is switched off
    const held = {};
    ["card_b", "inbox", "mail_row"].forEach((n) => { try { held[n] = ctx.held(n) || null; } catch (e) { held[n] = null; } });
    const hb = held.card_b;
    if (hb && hb.life) {
      Loom.tween(hb.life, { opacity: 1 }, { opacity: 0, duration: 0.01, ease: Loom.ease.move }, ctx.start, { kind: "exit", beat: ctx.beat.id });
    }

    // 2. b_lift: card B steps forward, a pos ring draws round it
    const EX = 520, EW = 660, EH = 490;   // element box in natural part coords: x 520..1180, y 0..490
    const L = ctx.el("b_lift", { x: ox + EX * S0, y: oy, w: EW * S0, h: EH * S0, kind: "card", exit: "none" });
    const part = Loom.svg("g", { transform: "translate(" + num(-EX * S0) + " 0)" }, L.inner);
    const ans = Loom.lesson.answer_cards(ctx, part, { scale: S0 });
    ans.setState("in_b", ctx.start, { dur: 0.001 });
    const tLift = ctx.cue("It is B");
    ans.setState("lifted_b", tLift);

    // everything drawn by hand is in natural coords, inside a group scaled to match
    const sg = Loom.svg("g", { transform: "scale(" + S0 + ")" }, L.inner);

    // @form pos_ring: a pos outline drawn on round the chosen card
    const RX = 556 - EX, RY = 26, RW = 568, RH = 440;
    const ring = Loom.svg("rect", { x: RX, y: RY, width: RW, height: RH, rx: 26, fill: "none", stroke: ctx.c("pos"), "stroke-width": 9, pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1, "stroke-linecap": "round" }, sg);
    Loom.drive((e) => { ring.setAttribute("stroke-dashoffset", num(1 - clamp(e, 0, 1))); }, tLift + 0.12, 0.55, "move", { key: Loom.uid("b13ring") });

    // 3. b_ticks: the three slots fill one by one, each on its spoken part
    const T = ctx.el("b_ticks", { x: ox + EX * S0, y: oy, w: EW * S0, h: EH * S0, kind: "icon", exit: "none" });
    const tg = Loom.svg("g", { transform: "scale(" + S0 + ")" }, T.inner);
    const S = 1.04, SX = [56, 148, 240];
    const cues = [ctx.cue("What happened"), ctx.cue("what it caused"), ctx.cue("one step")];
    SX.forEach((sx, j) => {
      const cx = 580 + 260 + S * (sx - 260) - EX, cy = 24 + 198 + S * (346 - 198) + 24;
      const g = Loom.svg("g", { opacity: 0, visibility: "hidden" }, tg);
      // @form slot_tick: a filled slot disc with a tick, in the slot colour
      Loom.svg("circle", { cx: cx, cy: cy, r: 28 * S, fill: ctx.c(K.SLOT_LIST[j]), stroke: ctx.c("ink"), "stroke-width": 4 }, g);
      kit.mark(g, "yes", cx, cy, 30 * S);
      Loom.drive((v) => {
        const op = clamp(v * 2.5, 0, 1);
        g.setAttribute("opacity", num(op));
        g.setAttribute("visibility", op > 0.001 ? "inherit" : "hidden");
        g.setAttribute("transform", "translate(" + cx + " " + cy + ") scale(" + num(1 + (1 - v) * 0.7) + ") translate(" + (-cx) + " " + (-cy) + ")");
      }, cues[j], 0.32, "overshoot", { key: Loom.uid("b13tick") });
    });
  },
});
