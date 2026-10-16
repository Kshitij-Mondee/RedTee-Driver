// @design guest_row_trimmed_by_need: of six people on a card, one is circled as the owner, one is kept as needed, the rest are crossed and sent to an envelope
/* Treatments considered: (A) a static trimmed row with signalling (rejected: no sense of who is cut), (B) the four
 * others fade out (rejected: a correction is struck, never erased), (C) CHOSEN: circle the owner, label the second,
 * cross the other four and draw a hand arrow to an envelope. The invite and the checklist are HELD from b05. */
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);

    const inviteEl = ctx.held("invite");
    const stepsEl = ctx.held("steps");
    const card = inviteEl.handle;
    const steps = stepsEl.handle;

    // ---- 1. "whoever owns that decision": the ONE accent, a marker loop round the first pictogram, then 'Owner'
    const tOwner = ctx.cue("whoever owns that decision");
    const c = card.guestCentre(0);
    const rx = 58, ry = 54, k = 0.5523, P = 12;
    const lx = rx + P, ly = ry + P + 6;
    const loop = `M${lx} ${ly - ry}` +
      ` C${lx + k * rx} ${ly - ry} ${lx + rx} ${ly - k * ry} ${lx + rx} ${ly}` +
      ` C${lx + rx} ${ly + k * ry} ${lx + k * rx} ${ly + ry} ${lx} ${ly + ry}` +
      ` C${lx - k * rx} ${ly + ry} ${lx - rx} ${ly + k * ry} ${lx - rx} ${ly}` +
      ` C${lx - rx} ${ly - k * ry} ${lx - k * rx} ${ly - ry * 1.06} ${lx} ${ly - ry * 1.06}` +
      ` C${lx + rx * 0.3} ${ly - ry * 1.06} ${lx + rx * 0.5} ${ly - ry * 1.12} ${lx + rx * 0.6} ${ly - ry * 1.18}`;
    const circle = ctx.el("owner_circle", { x: c.x - lx, y: c.y - 2 - ly, w: 2 * lx, h: 2 * ly, kind: "mark", exit: "recede", parent: inviteEl.inner });
    kit.sketch(circle.inner, "path", [loop], { fill: "none", stroke: "accent", sw: 5 });
    m.draw(circle, tOwner, { dur: drawDur(2 * Math.PI * 56) });
    card.markGuest(0, "Owner", tOwner + 0.55);

    // ---- 2. "can't be made without": the second guest is labelled
    const tNeed = ctx.cue("can't be made without");
    card.markGuest(1, "Needed input", tNeed);

    // ---- 3. "Everyone else gets the notes": the other four are crossed, a hand arrow runs to the envelope
    const tElse = ctx.cue("Everyone else gets the notes");
    [2, 3, 4, 5].forEach((i, n) => card.crossGuest(i, tElse + n * 0.1));
    card.envelope(tElse + 0.2);

    // ---- 4. "the notes": Before is ticked in ink
    const tNotes = ctx.cue("the notes");
    steps.tick(0, tNotes);
  },
});
