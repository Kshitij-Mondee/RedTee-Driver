// @design two_names_one_moment: the same overrun is named twice, once pinned on the person and once as what the clock shows, and the listener's face answers each differently
/* Treatments considered:
 * (A) a static split with both labels already placed (rejected: the two reactions are the argument and need an order);
 * (B) two separate close-ups (rejected: it must be the same room and the same moment);
 * (C) CHOSEN: hold the room, clock and both people from b04; a tag flies onto Ben and he bristles, the label sits by it,
 *     a cross lands and the tag peels away; then the clock's arc lights in the accent, Ben turns to it, a label and a tick
 *     sit under the clock. The clock arc is the one accent.
 * Layers: set < clock < busts < tag < labels. Held elements are claimed, hidden and redrawn in b04's end state. */
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const L = Loom.lesson, A = L.meeting_room.anchors, T = Loom.treat;
    const SIZE = 560, Y = 620;
    const tTag = ctx.cue("You're disorganised");
    const tPerson = ctx.cue("about the person");
    const tWorst = ctx.cue("work worst");
    const tOver = ctx.cue("We ran twenty minutes over");
    const tSaw = ctx.cue("what you saw");
    const redo = (name, spec) => {
      const h = ctx.held(name);
      if (h && h.outer) h.outer.style.display = "none";
      return ctx.el(name, spec);
    };
    // b04's bubble and tag are retired (the bubble element in b04 is named "card_b04")
    ["card_b04", "nod_tag"].forEach((n) => { const h = ctx.held(n); if (h && h.outer) h.outer.style.display = "none"; });

    // 1. the room and the clock, as b04 left them
    const set = redo("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    L.meeting_room(ctx, set.inner, { layer: "all", state: "two_shot" });
    const clockE = redo("clock", { x: A.clock.x, y: A.clock.y, w: 180, h: 180, kind: "instrument", exit: "none" });
    const clk = L.wall_clock(ctx, clockE.inner, { w: 180, state: "on_time" });
    clk.setState("on_time", ctx.start, 0);
    clk.setState("overrun_arc", tOver, 1.0);

    // 2. the people: Asha happy throughout; Ben happy, then surprised on the tag, then explaining on the clock
    const asha = redo("asha", { x: A.asha.x - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const ben = redo("ben", { x: A.ben.x - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    kit.peep(asha.inner, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
    const fb = {};
    ["happy", "surprised", "explaining"].forEach((k) => {
      fb[k] = kit.peep(ben.inner, "man", k, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    });
    const tHit = tTag + 0.9;
    const T0 = ctx.start, T1 = ctx.end, D = Math.max(0.1, T1 - T0);
    Loom.drive((e, raw) => {
      const t = T0 + raw * D;
      const want = t >= tOver + 0.3 ? "explaining" : (t >= tHit ? "surprised" : "happy");
      for (const k in fb) fb[k].style.visibility = k === want ? "visible" : "hidden";
    }, T0, D, "linear", { kind: "character", beat: ctx.beat.id, name: "ben", content: true });
    // a small recoil when the tag hits
    Loom.drive((e, raw) => {
      const r = -4 * Math.sin(raw * Math.PI) * (1 - raw);
      ben.inner.setAttribute("transform", "rotate(" + r.toFixed(2) + " " + (SIZE / 2) + " " + SIZE + ")");
    }, tHit, 0.5, "linear", { key: "b05recoil", kind: "character", beat: ctx.beat.id, name: "ben", content: true });

    // 3. the tag flies from Asha to Ben's chest, sticks, takes the cross, peels away
    const TW = 280, TH = 105, TX = A.ben.x - TW / 2, TY = 786;
    const tag = ctx.el("tag", { x: TX, y: TY, w: TW, h: TH, kind: "card", exit: "recede" });
    const wrap = Loom.svg("g", {}, tag.inner);
    const lt = L.label_tag(ctx, wrap, { w: TW });
    lt.setState("in_hand", ctx.start, 0);
    m.reveal(tag, tTag - 0.1, { dy: 0 });
    const FX = 720 - TX, FY = 600 - TY;
    Loom.drive((e, raw) => {
      const p = raw, q = p * p * (3 - 2 * p);
      const dx = FX * (1 - q), dy = FY * (1 - q) - 150 * Math.sin(Math.PI * p);
      wrap.setAttribute("transform", "translate(" + dx.toFixed(2) + " " + dy.toFixed(2) + ")");
    }, tTag, 0.9, "linear", { key: "b05fly", kind: "card", beat: ctx.beat.id, name: "tag", content: true });
    lt.setState("stuck", tTag + 0.7, 0.3);
    lt.setState("crossed", tWorst, 0.5);
    lt.setState("peeling", tWorst + 0.9, 0.7);

    // 4. labels
    const pl = T.label(ctx, "person_label", { x: 1130, y: 760, text: "About the person", to: [TX, TY + TH / 2], tone: "neg", t: tPerson });
    const sl = T.label(ctx, "seen_label", { x: 1600, y: 310, text: "What you saw: Ran twenty minutes over", tone: "accent", t: tSaw });
    const pk = T.mark(ctx, "tick", { x: 1290, y: 322, size: 56, kind: "yes", t: tSaw + 0.5 });
    // the person label and its leader leave with the tag, once it has peeled away
    if (pl) m.exit(pl, tWorst + 1.5, "recede");
    [sl, pk].forEach((e) => { if (e && ctx.end) m.exit(e, ctx.end - 0.4, "recede"); });
  },
});
