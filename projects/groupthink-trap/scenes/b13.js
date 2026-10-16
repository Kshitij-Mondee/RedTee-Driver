// @design doubt_drops_to_note: a held room changes one variable (a habit on a tag), and a private doubt drops from its bubble to the table, its outline becoming a note card with one word
/* b13 - "Same people. First, Dana speaks last. With nothing to follow, the fast yes asks about the date."
 *
 * Treatments considered:
 *  (A) a list card "Habit 1: leader speaks last" (rejected: a slide where the story has a room; the films change one
 *      variable inside the same frame).
 *  (B) static composition + signalling: the room with the tag and the note already in place, the note ringed
 *      (rejected: the habit is a change in time: the leader's silence leaves a space, then the doubt crosses).
 *  (C) CHOSEN: the medium frame of b03/b04 with one variable changed. Everyone turns to Dana on "Same people"; on
 *      "Dana speaks last" she leans back in two drawings and a teal tag "Leader speaks last" is written onto the
 *      blank board's corner; on "nothing to follow" the colleagues look at each other, one per step; on "the fast
 *      yes" his folded bubble morphs open with the calendar page in it; on "asks" the page drops to the table in
 *      three drawings and the bubble shrinks away; as it lands its outline morphs into a note card, and "the date"
 *      is written on it.
 *
 * Rules taken (tedEd conclusions s7; style_guide: identical_frames_one_variable, morph_chain_in_place,
 * object_becomes_next_frame, label_on_object_with_its_word): one variable changes in a held frame; the object
 * becomes the next thing (outline morph, detail fading in the first third); the word lives on the object.
 */
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (...a) => Loom.svg(...a);
    const f = (v) => Math.round(v * 10) / 10;

    // ---------------- hold the room (b12 left it in the opening state) ----------------
    const H = {};
    ["set", "cloud", "board", "clock", "veil", "dana", "p_date", "p_test", "p_support", "p_client",
      "bub_date", "bub_test", "bub_support", "bub_client", "table", "sheet"].forEach((n) => { H[n] = ctx.held(n); });
    const R = (n) => H[n] && H[n].rig;

    // ---------------- times ----------------
    const tSame = ctx.cue("Same people");
    const tLast = ctx.cue("Dana speaks last");
    const tFollow = ctx.cue("nothing to follow");
    const tYes = ctx.cue("the fast yes");
    const tAsks = ctx.cue("asks about the date");
    const tDate = ctx.cue("the date");

    // poses this lesson needs that the bean rigs do not ship: sitting back with the hands folded, in two drawings (data on the rigs, a
    // lesson-scoped name; the rig file is not edited)
    for (const r of ["pip", "tess"]) {
      const d = Loom.rig.defs[r];
      if (d && !d.poses.gt_lean_half) d.poses.gt_lean_half = { upper_l: 16, fore_l: 50, upper_r: -16, fore_r: -50, torso: 3, head: 4 };
      if (d && !d.poses.gt_lean_back) d.poses.gt_lean_back = { upper_l: 28, fore_l: 96, upper_r: -28, fore_r: -96, torso: 5, head: 8 };
    }
    // a pose change as held drawings: each key lands almost at once and holds (hand-made time on fours)
    const steps = (rig, poses, t, gap) => poses.forEach((p, i) => rig.pose(p, t + i * (gap || 0.17), { dur: 0.05 }));

    // ---------------- "Same people": every face turns to the leader, waiting for her lead ----------------
    ["p_date", "p_test", "p_support", "p_client"].forEach((n, i) => R(n) && R(n).look(-1, 0, tSame + 0.17 * i));

    // ---------------- "Dana speaks last": she leans back; the habit is written on the board's corner ----------------
    const dana = R("dana");
    if (dana) { steps(dana, ["gt_lean_half", "gt_lean_back"], tLast); dana.look(0, 0.4, tLast); }
    // @form habit_tag: a teal paper tag lettered with a habit, pinned on the thing that does it
    Loom.gt.tag(ctx, "tag_speak_last", { x: 535, y: 250, text: "Leader speaks last", fill: "accent3", t: tLast + 0.2 });   // measured tag (C2: T.label left 7.5 px, needs 7.6)

    // ---------------- "With nothing to follow": the colleagues look at each other, one per step ----------------
    const looks = [["p_date", 1, 0], ["p_test", -1, 0], ["p_support", -1, 0], ["p_client", -1, 0.1]];
    looks.forEach(([n, dx, dy], i) => R(n) && R(n).look(dx, dy, tFollow + 0.17 * i));
    // and back towards the table as the fast yes speaks
    if (R("p_date")) R("p_date").look(0, 0.5, tAsks);

    // ---------------- the date doubt: bubble opens, the page drops, its outline becomes the note ----------------
    doubtToNote({ key: "date", ox: 790, word: "the date", tOpen: tYes, tDrop: tAsks + 0.1, tWrite: tDate + 0.3,
      size: 92, draw: drawCalendar, sil: (cx, cy, s) => Loom.treat.rr(cx - 0.43 * s, cy - 0.41 * s, 0.86 * s, 0.9 * s, 0.06 * s), ang: -2.5 });

    // the three folded bubbles still waiting boil gently while the frame holds
    ["bub_test", "bub_support", "bub_client"].forEach((n) => H[n] && Loom.stepped.boil(H[n], ctx.start, ctx.end, { amp: 1.0 }));

    /* ---------------- the doubt-to-note device (same code in b15 and b16; b14 arrives by a card) ---------------- */
    function doubtToNote(o) {
      const B = H["bub_" + o.key], bb = B && B.bub;
      if (!bb) return;
      const NX = o.ox, NY = 666, W = 170, HH = 100;            // note slot (owner x, 666), card about 150 x 76
      // 1. the folded bubble opens: one outline morphing, stepped on eights; the crease and the seam fold away
      Loom.morph.to(bb.path, bb.D.open, o.tOpen, { dur: 0.6, hz: 8, name: B.name });
      Loom.tween(bb.seam, { opacity: 1 }, { opacity: 0, duration: 0.18, ease: Loom.ease.exit }, o.tOpen, { kind: "exit", beat: ctx.beat.id, name: B.name + ".seam" });
      Loom.tween(bb.crease, { opacity: 1 }, { opacity: 0, duration: 0.18, ease: Loom.ease.exit }, o.tOpen, { kind: "exit", beat: ctx.beat.id, name: B.name + ".crease" });
      // 2. the object, as an element at the note slot whose drawing starts inside the open bubble
      // @form object_to_note_card: a named object drops to a surface and its outline morphs into a small card
      const E = ctx.el("obj_" + o.key, { x: NX - W / 2, y: NY - HH / 2, w: W, h: HH, kind: "object", exit: "none", real: "document" });
      const drop = svg("g", {}, E.inner);
      const silP = Loom.morph.path(drop, o.sil(W / 2, HH / 2, o.size), { fill: "surface", sw: 3.5 });
      const det = svg("g", {}, drop);
      o.draw(det, W / 2, HH / 2, o.size);
      const dx = o.ox + 30 - NX, dy = 270 - NY;                // the open bubble's centre, relative to the slot
      const stepE = (base, dur, hz) => Loom.stepped.ease(base, dur, hz);
      Loom.tween(E.inner, { opacity: 0, scale: 0.7, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: stepE(Loom.ease.enter, 0.3, 8) }, o.tOpen + 0.3, { kind: "pop", beat: ctx.beat.id, name: E.name, content: true });
      E.revealT = o.tOpen + 0.3;
      // 3. the bubble lets go: it shrinks to a point by its tail and is gone (the doubt has left the head)
      const [tx, ty] = bb.L(o.ox + 24, 372);
      const tiny = `M${f(tx - 2)} ${f(ty)} A2 2 0 1 0 ${f(tx + 2)} ${f(ty)} A2 2 0 1 0 ${f(tx - 2)} ${f(ty)} Z`;
      Loom.morph.to(bb.path, tiny, o.tDrop, { dur: 0.36, hz: 8, name: B.name });
      Loom.tween(B.inner, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: Loom.ease.exit }, o.tDrop + 0.3, { kind: "exit", beat: ctx.beat.id, name: B.name });
      B.exitT = o.tDrop + 0.3; B.exitKind = "shrink";
      // 4. the drop: three held drawings down to the table
      Loom.tween(drop, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.5, ease: stepE(Loom.ease.exit, 0.5, 6) }, o.tDrop, { kind: "travel", beat: ctx.beat.id, name: E.name, content: true });
      Loom.sfx("land", o.tDrop + 0.5, { g: 0.7 });
      // 5. as it lands, its outline morphs into the note card; the object's inner detail fades in the first third
      const tM = o.tDrop + 0.5, a = (o.ang || 0) * Math.PI / 180, cx = W / 2, cy = HH / 2;
      const pt = (x, y) => `${f(cx + x * Math.cos(a) - y * Math.sin(a))} ${f(cy + x * Math.sin(a) + y * Math.cos(a))}`;
      const noteD = `M${pt(-75, -38)} L${pt(75, -38)} L${pt(75, 38)} L${pt(-75, 38)} Z`;
      Loom.morph.to(silP, noteD, tM, { dur: 0.8, name: E.name });
      Loom.tween(det, { opacity: 1 }, { opacity: 0, duration: 0.27, ease: Loom.ease.exit }, tM, { kind: "morph", beat: ctx.beat.id, name: E.name + ".detail" });
      // the red tape strip that pins the note (the doubt's colour), slapped on as the card settles
      // @form tilted_note: a tilted outlined note pinned to a surface, naming one fact
      const tape = svg("g", { transform: `rotate(${f((o.ang || 0) + 4)} ${cx} ${cy - 38})` }, E.inner);
      svg("rect", { x: cx - 26, y: cy - 46, width: 52, height: 16, rx: 2, fill: S.c("accent"), opacity: 0.92 }, tape);
      Loom.tween(tape, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: Loom.ease.enter }, tM + 0.7, { kind: "reveal", beat: ctx.beat.id, name: E.name + ".tape", content: true });
      // 6. the word, lettered on the card on its spoken word
      const N = ctx.el("note_" + o.key, { x: NX - 75, y: NY - 38, w: 150, h: 76, kind: "label", exit: "none" });
      const ng = svg("g", { transform: `rotate(${f(o.ang || 0)} 75 38)` }, N.inner);
      kit.text(ng, o.word, { role: "label", x: 14, y: 12, w: 122, h: 54, align: "center", valign: "middle", maxLines: 1, color: "ink" });
      m.unmask(N, Math.max(o.tWrite, tM + 0.6), { dur: 0.45, content: true });
    }

    // @form tearoff_with_question: a tear-off calendar page with one red question mark on its day
    function drawCalendar(g, cx, cy, s) {
      Loom.obj.shape(g, "calendar", cx, cy, s, { family: "tearoff", tone: "muted", shadow: false, key: "gt-cal" });
      const ht = s * 0.9, y = cy - ht / 2 + s * 0.04, hb = ht * 0.24, by = y + hb + s * 0.16, bh = ht * 0.42;
      const qx = cx, qy = by + bh / 2, q = s * 0.12;
      svg("path", { d: `M${f(qx - q * 0.8)} ${f(qy - q * 0.5)} Q${f(qx - q * 0.8)} ${f(qy - q * 1.4)} ${f(qx)} ${f(qy - q * 1.4)} Q${f(qx + q * 0.85)} ${f(qy - q * 1.4)} ${f(qx + q * 0.85)} ${f(qy - q * 0.6)} Q${f(qx + q * 0.85)} ${f(qy - q * 0.05)} ${f(qx)} ${f(qy + q * 0.15)} L${f(qx)} ${f(qy + q * 0.55)}`, fill: "none", stroke: S.c("accent"), "stroke-width": f(Math.max(3, s * 0.05)), "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      svg("circle", { cx: f(qx), cy: f(qy + q * 1.05), r: f(Math.max(2.5, s * 0.03)), fill: S.c("accent") }, g);
    }
  },
});
