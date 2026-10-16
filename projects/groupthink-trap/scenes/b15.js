// @design role_object_changes_posture: an object naming a role lands in front of one person, their posture changes and nothing else, then their private doubt drops to the table as a note
/* b15 - "Third, one person is named the critic. Objecting is a job, not a risk. Out comes the support worry."
 *
 * Treatments considered:
 *  (A) a definition card "devil's advocate" (rejected: a term card where the lesson needs the habit in use, and the
 *      script never says that term).
 *  (B) static composition + signalling: the tent card already in place, the support note circled (rejected: the
 *      claim is that a job changes what speaking costs, which is a change: posture first, then the doubt).
 *  (C) CHOSEN: the medium frame on the right half of the table. A teal tent card drops in front of the support
 *      colleague with a paper tap and "A named critic" is written on it; on "a job, not a risk" that colleague
 *      straightens in two drawings and nothing else changes (same person, same nerves, now with a job); on "Out
 *      comes" their folded bubble morphs open with the headset in it; on "support worry" the headset drops to the
 *      table in three drawings, the bubble shrinks away, and the headset's band outline morphs into the note
 *      "support".
 *
 * Rules taken (tedEd conclusions s7; style_guide: minimal_face_posture_acting, morph_chain_in_place,
 * label_on_object_with_its_word): emotion is posture, not faces; the habit's word lives on the object that does it.
 * Framing note: the medium frame starts at x 760, so "the date" note (x 715 to 865) is cut by the frame's left
 * edge in this beat; that crop is declared on it (data-bleed) rather than moving a held note.
 */
Loom.scene("b15", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (...a) => Loom.svg(...a);
    const f = (v) => Math.round(v * 10) / 10;

    const H = {};
    ["set", "cloud", "board", "clock", "veil", "dana", "p_date", "p_test", "p_support", "p_client",
      "bub_support", "bub_client", "table", "sheet", "obj_date", "note_date", "obj_test", "note_test"].forEach((n) => { H[n] = ctx.held(n); });
    const R = (n) => H[n] && H[n].rig;
    // the medium frame's left edge cuts the first note: a deliberate, declared crop for this beat only
    ["obj_date", "note_date"].forEach((n) => H[n] && H[n].outer.setAttribute("data-bleed", `${f(ctx.start)}-${f(ctx.end)}`));

    const tCritic = ctx.cue("one person is named the critic");
    const tJob = ctx.cue("a job, not a risk");
    const tOut = ctx.cue("Out comes the support worry");
    const tWorry = ctx.cue("support worry");

    for (const r of ["pip", "tess"]) {
      const d = Loom.rig.defs[r];
      if (d && !d.poses.gt_hunch) d.poses.gt_hunch = { upper_l: 2, fore_l: 14, upper_r: -2, fore_r: -14, torso: 4, head: 13 };
      if (d && !d.poses.gt_tall_half) d.poses.gt_tall_half = { upper_l: 8, fore_l: 8, upper_r: -8, fore_r: -8, torso: 1, head: 4 };
      if (d && !d.poses.gt_tall) d.poses.gt_tall = { upper_l: 12, fore_l: 6, upper_r: -12, fore_r: -6, torso: 0, head: -1 };
    }
    const sup = R("p_support");
    // at the cut the support colleague sits a little hunched (the nerves the replay keeps)
    if (sup) {
      sup.pose("gt_hunch", ctx.start, { dur: 0.05 }); sup.look(0, 0.6, ctx.start);
      m.travel(H.p_support, ctx.start, { x: 0, y: 10, dur: 0.04 });   // sunk a little in the chair (hidden by the cut)
    }

    // ---------------- the tent card, in front of the support colleague, standing on the table's back edge ----------------
    // @form tent_card_role: a folded tent card standing on a table, lettered with a role, in the habit colour
    const TX = 1250, TBASE = 626, TW = 236, TH = 62;
    const tent = ctx.el("tent_critic", { x: TX - TW / 2 - 8, y: TBASE - TH - 14, w: TW + 16, h: TH + 18, kind: "card", exit: "none" });
    {
      const g = tent.inner, x0 = 8, y0 = 14;
      svg("path", { d: `M${x0 + 10} ${y0 - 8} H${x0 + TW - 10} L${x0 + TW} ${y0} H${x0} Z`, fill: S.darken(S.c("accent3"), 0.22), stroke: S.c("ink"), "stroke-width": 3.5, "stroke-linejoin": "round" }, g);
      svg("path", { d: `M${x0} ${y0} H${x0 + TW} L${x0 + TW - 6} ${y0 + TH} H${x0 + 6} Z`, fill: S.c("accent3"), stroke: S.c("ink"), "stroke-width": 4, "stroke-linejoin": "round" }, g);
      svg("ellipse", { cx: x0 + TW / 2, cy: y0 + TH + 2, rx: TW / 2, ry: 4, fill: S.c("shadow"), opacity: 0.5 }, g);
      const word = svg("g", {}, g);
      const tt = kit.text(word, "A named critic", { role: "label", x: x0 + 14, y: y0 + 7, w: TW - 28, h: TH - 14, align: "center", valign: "middle", maxLines: 1, color: "ink" });
      tt.setAttribute("fill", S.c(S.pickTokenOn("accent3")));
      // the drop: two held drawings and a paper tap; then the lettering is written on
      Loom.tween(tent.inner, { opacity: 0, y: -70 }, { opacity: 1, y: 0, duration: 0.34, ease: Loom.stepped.ease(Loom.ease.exit, 0.34, 6) }, tCritic + 0.1, { kind: "drop", beat: ctx.beat.id, name: tent.name, content: true });
      tent.revealT = tCritic + 0.1;
      Loom.sfx("land", tCritic + 0.44, { g: 0.6 });
      const id = Loom.uid("gttent");
      const cr = svg("rect", { x: x0, y: 0, width: 0, height: TH + 20 }, svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, g));
      word.setAttribute("clip-path", `url(#${id})`);
      Loom.tween(cr, { attr: { width: 0 } }, { attr: { width: TW }, duration: 0.6, ease: Loom.ease.move }, tCritic + 0.55, { kind: "unmask", beat: ctx.beat.id, name: tent.name + ".word", content: true });
    }
    // the others glance at the tent card, one per step, then back
    [["p_test", 1, 0.4], ["p_client", -1, 0.4]].forEach(([n, dx, dy], i) => { if (R(n)) { R(n).look(dx, dy, tCritic + 0.5 + i * 0.17); R(n).look(0, 0.3, tJob + 0.4); } });

    // ---------------- "a job, not a risk": the colleague straightens in two drawings; nothing else changes ----------------
    if (sup) {
      sup.pose("gt_tall_half", tJob, { dur: 0.05 });
      sup.pose("gt_tall", tJob + 0.17, { dur: 0.05 });
      sup.look(0, 0, tJob);
      Loom.stepped.wrap(() => m.travel(H.p_support, tJob, { x: 0, y: -8, dur: 0.34 }), { hz: 6 });
    }

    // ---------------- the support worry: bubble opens, the headset drops, its band becomes the note ----------------
    doubtToNote({ key: "support", ox: 1250, word: "support", tOpen: tOut, tDrop: tWorry + 0.05, tWrite: tWorry + 0.9,
      size: 92, draw: drawHeadset, ang: 2.0, silFill: ["ink", "surface"],
      sil: (cx, cy, s) => { const r = s * 0.34, ro = r + s * 0.05, ri = r - s * 0.05, y0 = cy + s * 0.06;
        return `M${f(cx - ro)} ${f(y0)} A${f(ro)} ${f(ro * 1.05)} 0 0 1 ${f(cx + ro)} ${f(y0)} L${f(cx + ri)} ${f(y0)} A${f(ri)} ${f(ri * 1.05)} 0 0 0 ${f(cx - ri)} ${f(y0)} Z`; } });
    if (H.bub_client) Loom.stepped.boil(H.bub_client, ctx.start, ctx.end, { amp: 1.0 });

    /* ---------------- the doubt-to-note device (as in b13 and b16) ---------------- */
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

    // @form headset_object: a headset drawn as an object (band, two ear cups, a mic boom with a red tip)
    function drawHeadset(g, cx, cy, s) {
      const r = s * 0.34, sw = Math.max(3, s * 0.07);
      svg("path", { d: `M${f(cx - r)} ${f(cy + s * 0.06)} A${f(r)} ${f(r * 1.05)} 0 0 1 ${f(cx + r)} ${f(cy + s * 0.06)}`, fill: "none", stroke: S.c("ink"), "stroke-width": f(sw), "stroke-linecap": "round" }, g);
      [-1, 1].forEach((k) => svg("rect", { x: f(cx + k * r - s * 0.09), y: f(cy - s * 0.02), width: f(s * 0.18), height: f(s * 0.28), rx: f(s * 0.07), fill: S.c("muted"), stroke: S.c("ink"), "stroke-width": f(Math.max(2, s * 0.03)) }, g));
      svg("path", { d: `M${f(cx - r)} ${f(cy + s * 0.24)} Q${f(cx - r * 0.7)} ${f(cy + s * 0.44)} ${f(cx - s * 0.02)} ${f(cy + s * 0.4)}`, fill: "none", stroke: S.c("ink"), "stroke-width": f(Math.max(2, s * 0.035)), "stroke-linecap": "round" }, g);
      svg("circle", { cx: f(cx - s * 0.01), cy: f(cy + s * 0.4), r: f(Math.max(3, s * 0.055)), fill: S.c("accent") }, g);
    }
  },
});
