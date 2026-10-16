// @design same_people_changed_plan: a held room keeps its people exactly as they were while the shared plan changes, refuting the idea that the fix is braver people
/* b17 - "Nobody got braver. The meeting made doubt the expected thing. And the plan gets fixed, before it ships."
 *
 * Treatments considered:
 *  (A) a before/after split, the stamped plan beside the amended one (rejected: a comparison layout breaks the held
 *      room, and the before is already in the viewer's memory from b02 and b07).
 *  (B) static composition + signalling: the finished frame with the amended plan ringed (rejected: "gets fixed" is a
 *      change, and the refutation depends on seeing that the people do NOT change while the plan does).
 *  (C) CHOSEN: the same wide frame. On "Nobody got braver" the premortem page slides off the board and the sentence
 *      is written there; the people keep their postures (no heroic poses, no cheering). On "the expected thing" the
 *      four notes give one stepped settle together and the room's light lifts (the wall veil fades: the value
 *      script's lift). On "the plan gets fixed" the plan sheet grows a second page out from under itself (a morph),
 *      two new ink lines draw on, its small calendar glyph steps one column right (the date moved), and its header
 *      turns ochre. "before it ships": rest on the finished frame, only a boil.
 *
 * Rules taken (tedEd conclusions s7; colour_and_tone: a lift at the close, one accent placed not sized; style_guide:
 * palette_shift_on_held_composition, in_place_model_morph, minimal_face_posture_acting).
 */
Loom.scene("b17", {
  build(ctx) {
    const { m } = ctx;
    const S = Loom.style;
    const svg = (...a) => Loom.svg(...a);

    const H = {};
    const NAMES = ["set", "cloud", "board", "clock", "veil", "dana", "p_date", "p_test", "p_support", "p_client",
      "table", "sheet", "obj_date", "note_date", "obj_test", "note_test", "tent_critic", "obj_support", "note_support",
      "obj_client", "note_client", "board_slot"];
    NAMES.forEach((n) => { H[n] = ctx.held(n); });
    // this is the last room beat: everything held leaves at the chapter cut (L-165: no element is left on "none")
    NAMES.forEach((n) => { if (H[n]) H[n].exit = "recede"; });

    const tBraver = ctx.cue("Nobody got braver");
    const tExpected = ctx.cue("the expected thing");
    const tFixed = ctx.cue("the plan gets fixed");
    const tShips = ctx.cue("before it ships");

    // ---------------- "Nobody got braver": the pretend page slides off; the sentence is written on the board ----------------
    const slot = H.board_slot && H.board_slot.slotApi;
    if (slot) {
      const tc = slot.clear(tBraver, { how: "slide", dir: "left" });
      slot.show({ text: "Nobody got braver", color: "ink", maxLines: 2 }, tc + 0.05, { how: "relabel" });
    }
    // the people keep exactly the postures they had: a small glance up to the board is the only change
    ["p_date", "p_test", "p_support", "p_client"].forEach((n, i) => H[n] && H[n].rig && H[n].rig.look(-0.6, -0.3, tBraver + 0.4 + 0.17 * i));

    // ---------------- "the expected thing": the four notes settle together; the light lifts ----------------
    const NOTES = ["date", "test", "support", "client"];
    NOTES.forEach((k) => {
      // a two-drawing hop: up one drawing, down the next (both elements of a note move as one)
      ["obj_" + k, "note_" + k].forEach((n) => {
        const E = H[n]; if (!E) return;
        Loom.tween(E.life, { y: -9 }, { y: 0, duration: 0.34, ease: Loom.stepped.ease(Loom.ease.enter, 0.34, 6), immediateRender: false }, tExpected, { kind: "settle", beat: ctx.beat.id, name: n, content: true });
      });
    });
    Loom.sfx("reveal", tExpected, { g: 0.5 });
    if (H.veil) Loom.tween(H.veil.inner, { opacity: 1 }, { opacity: 0, duration: 0.9, ease: Loom.ease.move, immediateRender: false }, tExpected + 0.1, { kind: "recolour", beat: ctx.beat.id, name: "veil" });
    // @form window_light_pool: a soft pale wash falling from a window across a wall as the light lifts
    const light = ctx.el("window_light", { x: 980, y: 140, w: 940, h: 640, kind: "scenery", exit: "recede" });
    svg("path", { d: "M460 11 L882 11 L882 400 L180 640 L0 640 Z", fill: S.c("surface"), opacity: 0.22 }, light.inner);
    Loom.tween(light.inner, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: Loom.ease.move }, tExpected + 0.1, { kind: "reveal", beat: ctx.beat.id, name: "window_light" });
    light.revealT = tExpected + 0.1;
    // the light falls on the wall, so it sits behind the people: just above the wall veil in the drawing order
    if (H.veil && H.veil.outer.parentNode) H.veil.outer.parentNode.insertBefore(light.outer, H.veil.outer.nextSibling);

    // ---------------- "the plan gets fixed": the sheet becomes the amended plan ----------------
    const sh = H.sheet;
    if (sh && sh.paper) {
      // @form page_grows_second_page: a lying sheet grows a second page out from under itself
      const p2 = Loom.morph.path(sh.inner, "M200 8 H206 L210 70 H204 Z", { fill: "surface", sw: 4 });
      sh.inner.insertBefore(p2, sh.inner.firstChild);
      Loom.tween(p2, { opacity: 0 }, { opacity: 1, duration: 0.08, ease: Loom.ease.enter }, tFixed, { kind: "reveal", beat: ctx.beat.id, name: "sheet.page2", content: true });
      Loom.morph.to(p2, "M44 -14 H226 L246 62 H24 Z", tFixed, { dur: 0.8, hz: 8, name: "sheet.page2" });
      // two new ink lines, written on
      const lines = svg("g", { opacity: 0 }, sh.inner);         // hidden until written (round caps show as dots under a dash)
      svg("path", { d: "M20 70 H118", fill: "none", stroke: S.c("ink"), "stroke-width": 3.4, "stroke-linecap": "round" }, lines);
      svg("path", { d: "M136 46 H196", fill: "none", stroke: S.c("ink"), "stroke-width": 3.4, "stroke-linecap": "round" }, lines);
      Loom.set(lines, { opacity: 1 }, tFixed + 0.5);
      m.draw(lines, tFixed + 0.5, { dur: 0.6 });
      // the calendar glyph steps one column right: the date moved
      if (sh.cal) Loom.tween(sh.cal, { x: 0 }, { x: 34, duration: 0.5, ease: Loom.stepped.ease(Loom.ease.move, 0.5, 6) }, tFixed + 0.7, { kind: "travel", beat: ctx.beat.id, name: "sheet.date", content: true });
      // the header turns ochre: the plan is the named thing again
      if (sh.head) Loom.tween(sh.head, { attr: { fill: S.c("shadow") } }, { attr: { fill: S.c("accent2") }, duration: 0.5, ease: Loom.ease.move }, tFixed + 0.3, { kind: "recolour", beat: ctx.beat.id, name: "sheet.header", content: true });
      Loom.sfx("success", tFixed + 0.8, { g: 0.5 });
      m.emphasis(sh, tFixed + 1.1, { amount: 0.08 });   // the one emphasis: the amended plan
    }

    // ---------------- "before it ships": rest on the finished frame, the outlines boil ----------------
    if (sh) Loom.stepped.boil(sh, tShips, ctx.end, { amp: 1.0 });
    NOTES.forEach((k) => H["obj_" + k] && Loom.stepped.boil(H["obj_" + k], tShips, ctx.end, { amp: 0.9 }));
  },
});
