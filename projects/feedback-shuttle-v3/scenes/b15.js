// @design blank_card_handover: the notes clear from the desk and an empty four-slot card lands in the centre, each slot lighting as its word is said, then waits to be filled
/* Treatments considered:
 * (A) static composition: the card already on the desk with all four slots lit as a list (rejected: nothing leads the eye, no hand-over);
 * (B) the card fills the frame at once (rejected: hides the desk the viewer knows, jumps from b14);
 * (C) CHOSEN: hold the desk from b14 with no flash, clear the notes, drop the blank card clear of the monitor, light the
 *     slots one by one on their words (one accent at a time), then settle and push in very slowly and hold through the pause.
 */
Loom.scene("b15", {
  build(ctx) {
    const { m } = ctx;
    const L = Loom.lesson;
    const T0 = ctx.start;

    // 1. the desk held from b14: an identical copy at the b14 end state is built over it, then it clears to card_space
    let held = null;
    try { held = ctx.held("desk"); } catch (e) { held = null; }
    const desk = held || ctx.el("desk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const dh = L.desk_set(ctx, desk.inner, {});
    dh.setState("specific_note", T0, 0); // kit bug: opts.state is ignored for non-default states
    dh.setState("card_space", T0 + 0.02, 0.3);
    desk.exit = "recede";
    if (!held) m.reveal(desk, T0 + 0.01, { dy: 0 });

    // 2. the b14 notes retire as the card arrives (only those b14 handed on)
    ["great_bubble", "specific_note", "link"].forEach((n) => {
      let E = null;
      try { E = ctx.held(n); } catch (e) { E = null; }
      if (E) { E.exit = "recede"; try { m.exit(E, T0 + 0.02, "recede"); } catch (e) { /* the join handles it */ } }
    });

    // 3. the blank card, clear of the monitor (x 130..640) and the mug (x 1380, y 626): 720 wide
    const W = 720, H = Math.round(420 * W / 820), CX = 1030, CY = 440;
    const card = ctx.el("blank_card", { x: CX - W / 2, y: CY - H / 2, w: W, h: H, kind: "card", exit: "recede" });
    const pushG = Loom.svg("g", {}, card.inner);
    const mc = L.message_card(ctx, pushG, { w: W, state: "blank_four" });
    const tB = ctx.cue("Behaviour");
    m.drop(card, Math.max(tB, T0 + 0.34));
    mc.setState("light_1", Math.max(tB, T0 + 0.34) + 0.4, 0.3);
    mc.setState("light_2", ctx.cue("impact"), 0.3);
    mc.setState("light_3", ctx.cue("next step"), 0.3);
    mc.setState("light_4", ctx.cue("then ask"), 0.3);
    const tP = ctx.cue("Pick one talk");
    mc.setState("settle_four", tP, 0.5);

    // 4. a slow push toward the card, finished before the pause so the last second is still
    const S = 1.03, pd = Math.max(1, ctx.speechEnd - tP - 0.3);
    Loom.drive((e, raw) => {
      const s = 1 + (S - 1) * raw;
      pushG.setAttribute("transform", "translate(" + W / 2 + " " + H / 2 + ") scale(" + s.toFixed(4) + ") translate(" + (-W / 2) + " " + (-H / 2) + ")");
    }, tP, pd, "move", { key: "b15push" });
  },
});
