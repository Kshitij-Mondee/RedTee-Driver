// @design callback_opening_changed: the opening frame returns unchanged in layout but changed in state, what was hidden now lies in the open, and one plain line is written before the frame rests
/* b21 - "Back at Dana's table, the same four doubts are there. This time, on the table. The silence was never
 *        agreement."
 * Treatments considered (lnd-motion-choreography-loop):
 *  (A) a closing card with the sentence over the paper field (rejected: the payoff is the opening PICTURE changed by
 *      what was learned; a card would end on words instead of the room);
 *  (B) replay b01's build (people settle, bubbles pop) then morph the bubbles into notes (rejected: it spends the last
 *      ten seconds on motion the viewer has already seen; the storyboard asks for one settle, one light, one line);
 *  (C) CHOSEN: the zoom lands, through b20's Wednesday block, on a finished picture: b01's locked wide frame, the same
 *      five people, no bubbles; in front of each colleague their note ("the date", "testing", "support", "client")
 *      and the amended plan where the Agreed stamp was. On "the same four doubts are there" the four notes give one
 *      stepped settle, left to right; on "on the table" a soft pool of light opens on the tabletop; on "The silence
 *      was never agreement" the sentence is written on the board in the hand face, every eye goes to it, and the
 *      frame rests: only the window's cloud and a slow boil on the outlines continue into the outro.
 * Colour: the lightest frame of the film (no wall veil, the window light falls on the floor and the table); the four
 * red tape strips and the ochre header of the amended plan are the only saturated marks.
 * Continuity: draws the set bible in 'meet' with Loom.gt.room (b01's exact drawing), switched on as the zoom starts
 * (182.96 s) and faded in over a third of a second over b20's miniature (which still shows b19's end state).
 * Rules taken from the references (TED-Ed s7; colour_and_tone: a lift at the close; crayon study: bring the opening
 * image back at the end; style guide callback_to_opening_image, bookend_returning_set, single_accent_on_muted_field).
 */
Loom.scene("b21", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (tag, a, p) => Loom.svg(tag, a, p);
    const f = (v) => Math.round(v * 10) / 10;
    const STEP = 1 / 6;

    const tBack = ctx.cue("Back at Dana's table");
    const tSame = ctx.cue("the same four doubts are there");
    const tTable = ctx.cue("This time, on the table");
    const tSilence = ctx.cue("The silence was never agreement");
    void tBack;

    // the zoom's window (compose writes it on the scene). This station also holds b19, so the group is hidden until the
    // zoom starts, then fades in over b20's miniature (a small change at a fifth of the size, inside the moving block)
    const jw = (ctx.def && ctx.def.join_window) || [ctx.start - 0.6, ctx.start + 0.65];
    Loom.set(ctx.g, { opacity: 0 }, 0);
    Loom.tween(ctx.g, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: Loom.ease.move, immediateRender: false }, jw[0], { kind: "reveal", beat: ctx.beat.id, name: "b21_room" });

    // ------------------------------------------------------------------ the opening frame (b01's set bible), finished at the zoom
    const R = Loom.gt.room(ctx, { t0: jw[0], t1: ctx.end + 3, from: jw[0], sheet: "amended", sheetX: 1135 });
    const P = R.people;
    Object.values(P).forEach((p) => { p.pose("idle", jw[0]); p.emotion("neutral", jw[0]); });
    // eyes on the notes in front of them while the zoom lands (the opening frame had them on the plan)
    Loom.gt.CAST.forEach((c) => { const dx = Math.max(-1, Math.min(1, (1135 - c.x) / 700)); P[c.name].look(f(c.name === "dana" ? dx : 0), 0.7, jw[0]); });
    // this is the last scene: the room's elements fade with the outro, never before
    [R.set, R.cloud, R.board, R.clock, R.table, R.sheet].forEach((E) => { if (E) E.exit = "recede"; });

    // the window light on the wall (b17's lift, held): the lightest frame of the film
    // @form window_light_pool: a soft pale wash falling from a window across a wall as the light lifts
    const light = ctx.el("window_light", { x: 980, y: 140, w: 940, h: 640, kind: "scenery", exit: "recede" });
    svg("path", { d: "M460 11 L882 11 L882 400 L180 640 L0 640 Z", fill: S.c("surface"), opacity: 0.22 }, light.inner);
    if (R.set.outer.parentNode) R.set.outer.parentNode.insertBefore(light.outer, R.set.outer.nextSibling);

    // ------------------------------------------------------------------ the four notes, on the table in front of their owners
    // Same card as b13 to b16 (150 x 76 at (owner x, 666), the seeded tilt each one landed with, a red tape strip, the
    // word in the hand face).
    // @form tilted_note: a tilted outlined note pinned to a surface, naming one fact
    const NOTES = [["date", 790, "the date", -2.5], ["test", 1020, "testing", 2.2], ["support", 1250, "support", 2.0], ["client", 1480, "client", -1.8]];
    const notes = NOTES.map(([key, x, word, ang], i) => {
      const E = ctx.el("note_" + key, { x: x - 85, y: 666 - 50, w: 170, h: 100, kind: "card", exit: "recede" });
      const cx = 85, cy = 50, a = ang * Math.PI / 180;
      const pt = (px, py) => `${f(cx + px * Math.cos(a) - py * Math.sin(a))} ${f(cy + px * Math.sin(a) + py * Math.cos(a))}`;
      svg("path", { d: `M${pt(-75, -38)} L${pt(75, -38)} L${pt(75, 38)} L${pt(-75, 38)} Z`, fill: S.c("shadow"), opacity: 0.35, transform: "translate(4 5)", class: "lm-shadow" }, E.inner);
      svg("path", { d: `M${pt(-75, -38)} L${pt(75, -38)} L${pt(75, 38)} L${pt(-75, 38)} Z`, fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 3.5, "stroke-linejoin": "round" }, E.inner);
      const ng = svg("g", { transform: `rotate(${f(ang)} ${cx} ${cy})` }, E.inner);
      kit.text(ng, word, { role: "label", x: cx - 61, y: cy - 26, w: 122, h: 54, align: "center", valign: "middle", maxLines: 1, color: "ink" });
      const tape = svg("g", { transform: `rotate(${f(ang + 4)} ${cx} ${cy - 38})` }, E.inner);
      svg("rect", { x: cx - 26, y: cy - 46, width: 52, height: 16, rx: 2, fill: S.c("accent"), opacity: 0.92 }, tape);
      Loom.stepped.on(E, { hz: 6 });
      // "the same four doubts are there": one settle each, in two drawings, left to right
      Loom.tween(E.life, { y: -9 }, { y: 0, duration: 2 * STEP, ease: Loom.stepped.ease(Loom.ease.enter, 2 * STEP, 6), immediateRender: false }, tSame + 0.2 + i * STEP, { kind: "settle", beat: ctx.beat.id, name: E.name, content: true });
      return E;
    });
    Loom.sfx("card", tSame + 0.2, { g: 0.45 });

    // ------------------------------------------------------------------ "This time, on the table": a soft pool of light on the tabletop
    // @form light_pool_on_surface: a soft pale ellipse of light opening on a surface where the point now lies
    const pool = ctx.el("table_light", { x: 520, y: 640, w: 1100, h: 150, kind: "scenery", exit: "recede" });
    svg("ellipse", { cx: 550, cy: 66, rx: 540, ry: 62, fill: S.c("surface"), opacity: 0.5 }, pool.inner);
    svg("ellipse", { cx: 550, cy: 66, rx: 380, ry: 40, fill: S.c("surface"), opacity: 0.4 }, pool.inner);
    // the light sits on the tabletop, under the notes and the plan
    if (R.table.outer.parentNode) R.table.outer.parentNode.insertBefore(pool.outer, R.table.outer.nextSibling);
    Loom.tween(pool.inner, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: Loom.ease.move }, tTable, { kind: "reveal", beat: ctx.beat.id, name: "table_light", content: true });
    pool.revealT = tTable;

    // ------------------------------------------------------------------ "The silence was never agreement": written on the board, then rest
    const slot = Loom.slot(ctx, "board_slot", { x: 330, y: 180, w: 360, h: 210, frame: "none", role: "label", t: false, exit: "recede" });
    // @form board_written_line: a short plain sentence hand-lettered onto a held board on its spoken words
    const line = { text: "The silence was never agreement.", color: "ink", maxLines: 3, role: "label" };
    slot.show(line, tSilence, { how: "relabel" });
    // every eye goes up to the board as it is written, one per drawing; then nothing moves but the cloud and the boil
    ["dana", "p_date", "p_test", "p_support", "p_client"].forEach((n, i) => P[n].look(-0.7 + i * 0.05, -0.35, tSilence + 0.3 + i * STEP));
    // the rest: a slow boil on the outlines of the held picture to the end of the outro (never on the words)
    [R.table, R.board, R.sheet].forEach((E) => E && Loom.stepped.boil(E, tSilence + 1.6, ctx.end + 2, { hz: 8, amp: 0.9 }));
  },
});
