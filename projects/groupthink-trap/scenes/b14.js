// @design cards_written_and_turned_at_once: everyone writes on a card at the same moment and all cards turn together, one card's content becoming a note on the table
/* b14 - "Second, everyone writes a view first. Before anyone talks. Out comes, testing isn't done."
 *
 * Treatments considered:
 *  (A) a numbered habit card "2. Write first" over the room (rejected: a slide; the habit is a timing claim that
 *      only a picture of time can make).
 *  (B) static composition + signalling: five cards face up on the table, the checklist card ringed (rejected: it
 *      shows the result, not the claim that everyone writes AT THE SAME MOMENT, so nobody follows anybody).
 *  (C) CHOSEN: the wide frame. Five blank cards slide out as one gesture and a teal tag "Write before you talk" is
 *      written on the table's front edge; on "Before anyone talks" all five look down together and pencil
 *      scribbles boil on all five cards at once; on "Out comes" all five cards turn over together (stepped); four
 *      show a written view, the testing colleague's shows the half-ticked checklist; on "testing" that card's outline
 *      morphs into the note "testing" beside "the date", the other four slide back, and the testing colleague's
 *      folded bubble shrinks to a point and is gone.
 *
 * Rules taken (tedEd conclusions s7; style_guide: state_steps_in_place, morph_chain_in_place, text_on_paper_backing):
 * the simultaneous flip IS the habit (F14), so every card moves on the same frame; the reveal is the one thing that
 * differs; text sits on paper.
 */
Loom.scene("b14", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (...a) => Loom.svg(...a);
    const f = (v) => Math.round(v * 10) / 10;

    // ---------------- hold the room and the first note ----------------
    const H = {};
    ["set", "cloud", "board", "clock", "veil", "dana", "p_date", "p_test", "p_support", "p_client",
      "bub_test", "bub_support", "bub_client", "table", "sheet", "obj_date", "note_date"].forEach((n) => { H[n] = ctx.held(n); });
    const R = (n) => H[n] && H[n].rig;
    const PEOPLE = ["dana", "p_date", "p_test", "p_support", "p_client"];

    // ---------------- times ----------------
    const tWrite = ctx.cue("everyone writes a view first");
    const tTalks = ctx.cue("Before anyone talks");
    const tOut = ctx.cue("Out comes");
    const tTest = ctx.cue("testing isn't done");

    for (const r of ["pip", "tess"]) {
      const d = Loom.rig.defs[r];
      if (d && !d.poses.gt_write) d.poses.gt_write = { upper_l: 22, fore_l: 74, upper_r: -22, fore_r: -74, torso: -2, head: -5 };
    }

    // ---------------- five cards, one in front of each person (clear of the note and the sheet) ----------------
    const CARDS = [
      { who: "dana", name: "card_dana", x: 560 },
      { who: "p_date", name: "card_date", x: 790 },
      { who: "p_test", name: "obj_test", x: 950, test: true },
      { who: "p_support", name: "card_support", x: 1320 },
      { who: "p_client", name: "card_client", x: 1480 },
    ];
    const CY = 738, CW = 120, CH = 70;
    const NX = 1020, NY = 666;                              // the testing note's slot (owner x, 666)
    const rng = Loom.rng("gt-b14-scribble");
    const scribble = (g, x0, y0, w, n, col, sw) => {
      for (let i = 0; i < n; i++) {
        let d = `M${f(x0)} ${f(y0 + i * 14)}`;
        const len = w * (i === n - 1 ? 0.55 : 0.9);
        for (let x = 8; x <= len; x += 8) d += ` L${f(x0 + x)} ${f(y0 + i * 14 + (rng() - 0.5) * 6)}`;
        svg("path", { d, fill: "none", stroke: S.c(col), "stroke-width": sw, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      }
    };
    const stepE = (base, dur, hz) => Loom.stepped.ease(base, dur, hz);
    const cards = CARDS.map((c, i) => {
      // the testing card lives at the note slot so its outline can become the note in place; its drawing starts at its card spot
      const ex = c.test ? NX - 85 : c.x - 70, ey = c.test ? NY - 50 : CY - 45;
      // @form index_card_turned: a small paper card that is written on, then turned over together with its peers
      const E = ctx.el(c.name, { x: ex, y: ey, w: c.test ? 170 : 140, h: c.test ? 100 : 90, kind: "card", exit: "recede", real: "document" });
      const ox = c.test ? (c.x - NX) : 0, oy = c.test ? (CY - NY) : 0;
      const lx = (c.test ? 85 : 70), ly = (c.test ? 50 : 45);      // the card's centre in local coords at rest
      const pos = svg("g", {}, E.inner);                             // carries the testing card from its spot to the slot
      const flip = svg("g", {}, pos);
      const sil = Loom.morph.path(flip, Loom.treat.rr(lx - CW / 2, ly - CH / 2, CW, CH, 6), { fill: "surface", sw: 3.5 });
      const faceA = svg("g", {}, flip);                              // the side being written (pencil, muted)
      const pencil = svg("g", { opacity: 0 }, faceA);             // hidden until the writing (round caps show as dots otherwise)
      scribble(pencil, lx - CW / 2 + 16, ly - 16, CW - 32, 3, "muted", 3);
      const faceB = svg("g", { opacity: 0 }, flip);                  // the turned side: the view as written
      if (c.test) drawChecklistCard(faceB, lx, ly);
      else scribble(faceB, lx - CW / 2 + 16, ly - 16, CW - 32, 3, "ink", 3.6);
      if (c.test) Loom.set(pos, { x: ox, y: oy }, 0);
      // 1. slide out onto the table as one gesture (tight stagger)
      Loom.tween(E.inner, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: S.dur("enter"), ease: stepE(Loom.ease.enter, S.dur("enter"), 8) }, tWrite + i * 0.08, { kind: "settle", beat: ctx.beat.id, name: c.name, content: true });
      E.revealT = tWrite + i * 0.08;
      // 2. the writing: every card's pencil lines draw at the same moment
      Loom.set(pencil, { opacity: 1 }, tTalks + 0.1);
      m.draw(pencil, tTalks + 0.1, { dur: 0.9, together: true });
      Loom.stepped.boil(E, tTalks + 0.1, tOut, { amp: 1.2 });
      // 3. all five turn over together (stepped on twelves: four held drawings each way)
      Loom.tween(flip, { scaleX: 1, transformOrigin: "50% 50%" }, { scaleX: 0, duration: 0.18, ease: stepE(Loom.ease.exit, 0.18, 12) }, tOut, { kind: "flip", beat: ctx.beat.id, name: c.name, content: true });
      Loom.set(faceA, { opacity: 0 }, tOut + 0.18);
      Loom.set(faceB, { opacity: 1 }, tOut + 0.18);
      Loom.tween(flip, { scaleX: 0, transformOrigin: "50% 50%" }, { scaleX: 1, duration: 0.22, ease: stepE(Loom.ease.enter, 0.22, 12) }, tOut + 0.18, { kind: "flip", beat: ctx.beat.id, name: c.name, content: true });
      return { c, E, pos, flip, sil, faceB, lx, ly };
    });
    Loom.sfx("card", tOut, { g: 0.7 });

    // the habit, on the thing that does it: a teal tag on the table's front edge
    Loom.gt.tag(ctx, "tag_write_first", { x: 1020, y: 815, text: "Write before you talk", fill: "accent3", t: tWrite + 0.5 });   // measured tag (C2: T.label left 7.5 px, needs 7.6)

    // ---------------- the people: heads down together, then up to the cards ----------------
    PEOPLE.forEach((n) => {
      const r = R(n); if (!r) return;
      r.pose("gt_write", tTalks, { dur: 0.05 });
      r.look(0, 1, tTalks);
      r.pose(n === "dana" ? "gt_lean_back" : "idle", tOut - 0.1, { dur: 0.05 });
    });
    // on "testing" every eye goes to the testing card
    [["dana", 1, 0.5], ["p_date", 1, 0.5], ["p_test", 0, 0.8], ["p_support", -1, 0.5], ["p_client", -1, 0.4]].forEach(([n, dx, dy]) => R(n) && R(n).look(dx, dy, tTest + 0.1));

    // ---------------- "testing isn't done": the checklist card becomes the note; the rest slide back ----------------
    const T = cards.find((k) => k.c.test);
    const tM = tTest + 0.05, a = 2.2 * Math.PI / 180, cx = T.lx, cy = T.ly;
    const pt = (x, y) => `${f(cx + x * Math.cos(a) - y * Math.sin(a))} ${f(cy + x * Math.sin(a) + y * Math.cos(a))}`;
    Loom.tween(T.pos, { x: T.c.x - NX, y: CY - NY }, { x: 0, y: 0, duration: 0.5, ease: stepE(Loom.ease.move, 0.5, 6) }, tM, { kind: "travel", beat: ctx.beat.id, name: T.c.name, content: true });
    Loom.morph.to(T.sil, `M${pt(-75, -38)} L${pt(75, -38)} L${pt(75, 38)} L${pt(-75, 38)} Z`, tM, { dur: 0.8, name: T.c.name });
    Loom.tween(T.faceB, { opacity: 1 }, { opacity: 0, duration: 0.27, ease: Loom.ease.exit, immediateRender: false }, tM, { kind: "morph", beat: ctx.beat.id, name: T.c.name + ".detail" });
    const tape = svg("g", { transform: `rotate(6.2 ${cx} ${cy - 38})` }, T.E.inner);
    svg("rect", { x: cx - 26, y: cy - 46, width: 52, height: 16, rx: 2, fill: S.c("accent"), opacity: 0.92 }, tape);
    Loom.tween(tape, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: Loom.ease.enter }, tM + 0.75, { kind: "reveal", beat: ctx.beat.id, name: "obj_test.tape", content: true });
    T.E.exit = "none";
    const N = ctx.el("note_test", { x: NX - 75, y: NY - 38, w: 150, h: 76, kind: "label", exit: "none" });
    const ng = svg("g", { transform: "rotate(2.2 75 38)" }, N.inner);
    kit.text(ng, "testing", { role: "label", x: 14, y: 12, w: 122, h: 54, align: "center", valign: "middle", maxLines: 1, color: "ink" });
    m.unmask(N, tM + 0.7, { dur: 0.45, content: true });
    // the other four cards slide back off the table (they were the method, not the point)
    cards.filter((k) => !k.c.test).forEach((k, i) => {
      Loom.tween(k.E.inner, { opacity: 1, y: 0 }, { opacity: 0, y: 30, duration: S.dur("exit"), ease: Loom.ease.exit }, tM + 0.2 + i * 0.05, { kind: "exit", beat: ctx.beat.id, name: k.c.name });
      k.E.exitT = tM + 0.2 + i * 0.05; k.E.exitKind = "slide";
    });
    // the testing colleague's folded bubble shrinks to a point and is gone
    const B = H.bub_test, bb = B && B.bub;
    if (bb) {
      const [tx, ty] = bb.L(1020 + 24, 372);
      Loom.morph.to(bb.path, `M${f(tx - 2)} ${f(ty)} A2 2 0 1 0 ${f(tx + 2)} ${f(ty)} A2 2 0 1 0 ${f(tx - 2)} ${f(ty)} Z`, tM + 0.1, { dur: 0.36, hz: 8, name: B.name });
      Loom.tween(bb.seam, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: Loom.ease.exit }, tM + 0.1, { kind: "exit", beat: ctx.beat.id, name: B.name + ".seam" });
      Loom.tween(bb.crease, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: Loom.ease.exit }, tM + 0.1, { kind: "exit", beat: ctx.beat.id, name: B.name + ".crease" });
      Loom.tween(B.inner, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: Loom.ease.exit }, tM + 0.4, { kind: "exit", beat: ctx.beat.id, name: B.name });
      B.exitT = tM + 0.4; B.exitKind = "shrink";
    }
    // the bubbles still waiting boil gently
    ["bub_support", "bub_client"].forEach((n) => H[n] && Loom.stepped.boil(H[n], ctx.start, ctx.end, { amp: 1.0 }));

    // @form half_ticked_checklist: a card with four boxes, two ticked, the two empty ones edged red
    function drawChecklistCard(g, x, y) {
      const b = 11, x0 = x - CW / 2 + 16;
      for (let i = 0; i < 4; i++) {
        const yy = y - CH / 2 + 9 + i * 14.5, done = i < 2;
        svg("rect", { x: x0, y: f(yy), width: b, height: b, rx: 2, fill: "none", stroke: S.c(done ? "ink" : "accent"), "stroke-width": 2.4 }, g);
        svg("path", { d: `M${x0 + 20} ${f(yy + 6)} H${x0 + CW - 34}`, stroke: S.c("muted"), "stroke-width": 2.6, "stroke-linecap": "round" }, g);
        if (done) svg("path", { d: `M${x0 + 2} ${f(yy + 5)} l3.5 4 l6 -8`, fill: "none", stroke: S.c("ink"), "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      }
    }
  },
});
