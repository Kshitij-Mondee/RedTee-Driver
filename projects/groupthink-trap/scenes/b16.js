// @design pretend_page_fails_on_shared_board: a held shared surface swaps to an imagined future page where the plan fails, and the last private doubt drops to the table as a note
/* b16 - "Fourth, a premortem. Imagine it has already failed. Why? Out comes the client nobody asked."
 *
 * Treatments considered:
 *  (A) a term card "premortem" with a definition (rejected: the next beat is a quiz on exactly this, and the habit
 *      is clearer done than defined).
 *  (B) static composition + signalling: the premortem page already on the board, the client note ringed (rejected:
 *      the page failing is a sequence the narration walks through word by word).
 *  (C) CHOSEN: the wide frame. The board's slot swaps to an imagined future page (a dotted border: pretend); on "a
 *      premortem" its header "Premortem" is written on; on "already failed" a red cross draws over the small plan on
 *      that page and "it failed." is written beside it; on "Why" the word "why?" follows, the team turns to the board,
 *      then looks down, thinking it through; on "Out comes" the window colleague's folded bubble opens with the sealed
 *      envelope; on "the client nobody asked" it drops to the table and its outline morphs into the note "client".
 *      Four notes now sit in a row.
 *
 * Rules taken (tedEd conclusions s7; style_guide: held_object_one_attribute_swap, morph_chain_in_place,
 * hand_lettered_write_on): the board keeps its place and changes its contents on the spoken word (Loom.slot); words
 * are hand-lettered on as they are said; the failure mark is the doubt colour.
 */
Loom.scene("b16", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (...a) => Loom.svg(...a);
    const f = (v) => Math.round(v * 10) / 10;

    const H = {};
    ["set", "cloud", "board", "clock", "veil", "dana", "p_date", "p_test", "p_support", "p_client",
      "bub_client", "table", "sheet", "obj_date", "note_date", "obj_test", "note_test", "tent_critic",
      "obj_support", "note_support"].forEach((n) => { H[n] = ctx.held(n); });
    const R = (n) => H[n] && H[n].rig;
    const PEOPLE = ["dana", "p_date", "p_test", "p_support", "p_client"];

    const tPre = ctx.cue("a premortem");
    const tFailed = ctx.cue("already failed");
    const tWhy = ctx.cue("Why");
    const tOut = ctx.cue("Out comes");
    const tClient = ctx.cue("the client nobody asked");

    // the board slot lives until the last room beat (b17 swaps it again), so its reading floors are measured to there
    const b17 = ((Loom.manifest && Loom.manifest.beats) || []).find((b) => b.id === "b17");
    const ctxL = Object.assign({}, ctx, { end: b17 ? b17.end : ctx.end + 9 });

    // ---------------- the board slot swaps to the imagined future page ----------------
    // set bible: the board's words area is a Loom.slot (frame "none") at x 330 to 690, y 180 to 390
    const slot = Loom.slot(ctxL, "board_slot", { x: 330, y: 180, w: 360, h: 210, frame: "none", role: "label", exit: "none" });   // hand-lettered: the label role is the pack's hand face
    slot.E.slotApi = slot;
    const parts = {};
    // @form dotted_future_page: a page with a dotted border, the sign of an imagined future, holding a small plan drawing
    const page = (g) => {
      svg("rect", { x: 8, y: 6, width: 344, height: 198, rx: 10, fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 3.4, "stroke-dasharray": "2 10", "stroke-linecap": "round" }, g);
      // the plan, drawn small (the same sheet that lies on the table)
      const pl = svg("g", { transform: "translate(26 92)" }, g);
      svg("path", { d: "M10 2 H92 L102 62 H0 Z", fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 3, "stroke-linejoin": "round" }, pl);
      svg("path", { d: "M10 2 H92 L94 12 H8 Z", fill: S.c("shadow") }, pl);
      [[14, 60, 26], [12, 56, 38], [10, 62, 50]].forEach(([a, b, y]) => svg("path", { d: `M${a} ${y} H${b}`, stroke: S.c("muted"), "stroke-width": 2.6, "stroke-linecap": "round" }, pl));
      svg("rect", { x: 68, y: 24, width: 18, height: 16, rx: 2, fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 2 }, pl);
      // the failure cross over it (drawn on "already failed")
      parts.cross = svg("g", { opacity: 0 }, g);                 // hidden until drawn (round caps show as dots under a dash)
      svg("path", { d: "M20 88 L136 166", fill: "none", stroke: S.c("accent"), "stroke-width": 7, "stroke-linecap": "round" }, parts.cross);
      svg("path", { d: "M134 86 L22 164", fill: "none", stroke: S.c("accent"), "stroke-width": 7, "stroke-linecap": "round" }, parts.cross);
      // the words, each written on its spoken word
      parts.head = svg("g", {}, g);
      kit.text(parts.head, "Premortem", { role: "label", x: 24, y: 18, w: 312, h: 58, align: "left", valign: "middle", maxLines: 1, color: "ink" });
      parts.failed = svg("g", {}, g);
      kit.text(parts.failed, "it failed.", { role: "label", x: 152, y: 88, w: 186, h: 52, align: "left", valign: "middle", maxLines: 1, color: "ink" });
      parts.why = svg("g", {}, g);
      kit.text(parts.why, "why?", { role: "label", x: 152, y: 140, w: 186, h: 52, align: "left", valign: "middle", maxLines: 1, color: "ink" });
    };
    page.floor = 4; page.slotLabel = "Premortem page: it failed. why?";
    slot.show(page, tPre - 0.25, { how: "swap" });
    // a hand-lettered write-on: a clip that opens left to right
    const writeOn = (node, x, y, w, h, t, dur) => {
      const id = Loom.uid("gtw");
      const r = svg("rect", { x, y, width: 0, height: h }, svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, node));
      node.setAttribute("clip-path", `url(#${id})`);
      Loom.tween(r, { attr: { width: 0 } }, { attr: { width: w }, duration: dur, ease: Loom.ease.move }, t, { kind: "unmask", beat: ctx.beat.id, name: "board_slot.words", content: true });
    };
    writeOn(parts.head, 16, 10, 330, 72, tPre + 0.35, 0.6);
    // "Imagine it has already failed": the cross draws (stepped), then "it failed." is written
    Loom.set(parts.cross, { opacity: 1 }, tFailed);
    Loom.stepped.wrap(() => m.draw(parts.cross, tFailed, { dur: 0.42 }), { hz: 8 });
    writeOn(parts.failed, 146, 84, 200, 60, tFailed + 0.3, 0.55);
    // "Why?": the question follows
    writeOn(parts.why, 146, 138, 200, 60, tWhy, 0.4);

    // ---------------- the team: turn to the board on "Why", then look down, thinking it through ----------------
    PEOPLE.forEach((n, i) => {
      const r = R(n); if (!r) return;
      r.look(-1, -0.6, tWhy + 0.17 * Math.min(i, 3));
      r.look(0, 1, tWhy + 0.85);
    });
    if (R("p_client")) R("p_client").look(-0.4, 0.2, tOut);

    // ---------------- the client doubt: bubble opens, the envelope drops and becomes the note ----------------
    doubtToNote({ key: "client", ox: 1480, word: "client", tOpen: tOut, tDrop: tClient + 0.1, tWrite: tClient + 0.95,
      size: 92, draw: drawEnvelope, ang: -1.8, sil: (cx, cy, s) => Loom.treat.rr(cx - 0.5 * s, cy - 0.26 * s, s, 0.64 * s, 0.05 * s) });

    /* ---------------- the doubt-to-note device (as in b13 and b15) ---------------- */
    function doubtToNote(o) {
      const B = H["bub_" + o.key], bb = B && B.bub;
      if (!bb) return;
      const NX = o.ox, NY = 666, W = 170, HH = 100;
      Loom.morph.to(bb.path, bb.D.open, o.tOpen, { dur: 0.6, hz: 8, name: B.name });
      Loom.tween(bb.seam, { opacity: 1 }, { opacity: 0, duration: 0.18, ease: Loom.ease.exit }, o.tOpen, { kind: "exit", beat: ctx.beat.id, name: B.name + ".seam" });
      Loom.tween(bb.crease, { opacity: 1 }, { opacity: 0, duration: 0.18, ease: Loom.ease.exit }, o.tOpen, { kind: "exit", beat: ctx.beat.id, name: B.name + ".crease" });
      // @form object_to_note_card: a named object drops to a surface and its outline morphs into a small card
      const E = ctx.el("obj_" + o.key, { x: NX - W / 2, y: NY - HH / 2, w: W, h: HH, kind: "object", exit: "none", real: "document" });
      const drop = svg("g", {}, E.inner);
      const silP = Loom.morph.path(drop, o.sil(W / 2, HH / 2, o.size), { fill: (o.silFill && o.silFill[0]) || "surface", sw: 3.5 });
      const det = svg("g", {}, drop);
      o.draw(det, W / 2, HH / 2, o.size);
      const dx = o.ox + 30 - NX, dy = 270 - NY;
      const stepE = (base, dur, hz) => Loom.stepped.ease(base, dur, hz);
      Loom.tween(E.inner, { opacity: 0, scale: 0.7, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: stepE(Loom.ease.enter, 0.3, 8) }, o.tOpen + 0.3, { kind: "pop", beat: ctx.beat.id, name: E.name, content: true });
      E.revealT = o.tOpen + 0.3;
      const [tx, ty] = bb.L(o.ox + 24, 372);
      Loom.morph.to(bb.path, `M${f(tx - 2)} ${f(ty)} A2 2 0 1 0 ${f(tx + 2)} ${f(ty)} A2 2 0 1 0 ${f(tx - 2)} ${f(ty)} Z`, o.tDrop, { dur: 0.36, hz: 8, name: B.name });
      Loom.tween(B.inner, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: Loom.ease.exit }, o.tDrop + 0.3, { kind: "exit", beat: ctx.beat.id, name: B.name });
      B.exitT = o.tDrop + 0.3; B.exitKind = "shrink";
      Loom.tween(drop, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.5, ease: stepE(Loom.ease.exit, 0.5, 6) }, o.tDrop, { kind: "travel", beat: ctx.beat.id, name: E.name, content: true });
      Loom.sfx("land", o.tDrop + 0.5, { g: 0.7 });
      const tM = o.tDrop + 0.5, a = (o.ang || 0) * Math.PI / 180, cx = W / 2, cy = HH / 2;
      const pt = (x, y) => `${f(cx + x * Math.cos(a) - y * Math.sin(a))} ${f(cy + x * Math.sin(a) + y * Math.cos(a))}`;
      Loom.morph.to(silP, `M${pt(-75, -38)} L${pt(75, -38)} L${pt(75, 38)} L${pt(-75, 38)} Z`, tM, { dur: 0.8, name: E.name, fill: o.silFill });
      Loom.tween(det, { opacity: 1 }, { opacity: 0, duration: 0.27, ease: Loom.ease.exit }, tM, { kind: "morph", beat: ctx.beat.id, name: E.name + ".detail" });
      // @form tilted_note: a tilted outlined note pinned to a surface, naming one fact
      const tape = svg("g", { transform: `rotate(${f((o.ang || 0) + 4)} ${cx} ${cy - 38})` }, E.inner);
      svg("rect", { x: cx - 26, y: cy - 46, width: 52, height: 16, rx: 2, fill: S.c("accent"), opacity: 0.92 }, tape);
      Loom.tween(tape, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: Loom.ease.enter }, tM + 0.7, { kind: "reveal", beat: ctx.beat.id, name: E.name + ".tape", content: true });
      const N = ctx.el("note_" + o.key, { x: NX - 75, y: NY - 38, w: 150, h: 76, kind: "label", exit: "none" });
      const ng = svg("g", { transform: `rotate(${f(o.ang || 0)} 75 38)` }, N.inner);
      kit.text(ng, o.word, { role: "label", x: 14, y: 12, w: 122, h: 54, align: "center", valign: "middle", maxLines: 1, color: "ink" });
      m.unmask(N, Math.max(o.tWrite, tM + 0.6), { dur: 0.45, content: true });
    }

    // @form sealed_envelope: a closed envelope with a red wax seal on its flap
    function drawEnvelope(g, cx, cy, s) {
      Loom.obj.shape(g, "envelope", cx, cy, s, { family: "flap", tone: "surface2", shadow: false, key: "gt-env" });
      svg("circle", { cx: f(cx), cy: f(cy + s * 0.1), r: f(Math.max(4, s * 0.09)), fill: S.c("accent"), stroke: S.c("ink"), "stroke-width": 1.5 }, g);
    }
  },
});
