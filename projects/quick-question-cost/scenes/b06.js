// @design flicker_is_switching: a held slot hard-swaps between two contents and never holds both, each swap booking one unit in the hidden column of a ledger beside it
/* b06 - "Answering while you write?" The slot flickers between the plan and the question; each flick is a hidden unit.
 *
 * Treatments considered (lnd-motion-choreography-loop, pass A):
 *  (A) static composition + signalling: plan and slip side by side, a "not both" mark between them. Rejected: the
 *      misconception is "both at once"; showing both at once draws the misconception.
 *  (B) Loom.slot swaps (swap/flip). Rejected by the storyboard and on arithmetic: the slot's reading floor (0.8 s per
 *      content plus a 0.4 s exit and a 0.6 s entrance) turns a flicker into three slow swaps; the point is that the
 *      change is abrupt and repeated.
 *  (C) CHOSEN: hard swaps (Loom.set at cue times, no tween) between the held plan page and the question drawn over the
 *      slot rect; each state is held at least 0.45 s (under 3 Hz, motion safety: 3 flicks, about 1 change a second);
 *      each flick stamps one small red unit in row 4. Before that, the ledger catches up with the two terms just
 *      defined (rows 2 and 3) and a faint ghost of the slip prints on the plan (the residue).
 * Converge: the slot never shows both contents; the ledger books each switch as it happens. Not doing: no tweened
 * flip (a tween would show both halves at once). Risk: the catch-up cannot be word-synced (b04 and b05 are templates;
 * the storyboard logs that compromise) and, with 0.28 s between the beat start and the first word, it overlaps
 * "Answering" by about half a second.
 *
 * Holds from b05 (by name): page, line_1 to line_4 (b04's document.page), strip, ledger, visible_units, hidden_units,
 * note, footnote. b07 keeps nothing, so everything here leaves at that join.
 */
Loom.scene("b06", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const T = Loom.treat;
    const P01 = { slip_text: "Quick question?" };
    const SLOT = { x: 200, y: 150, w: 760, h: 780 };
    const SLIP = { w: 420, h: 150 };
    const CELL = 48, GAP = 8, ROW = 120;
    const enter = ctx.style.dur("enter");

    /* ---------------- helpers (the same drawing as b01/b03) ---------------- */
    function wipe(node, box, t, dur) {
      const id = Loom.uid("qqw");
      const defs = Loom.svg("defs", {}, node.parentNode);
      const cp = Loom.svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, defs);
      const r = Loom.svg("rect", { x: box.x - 6, y: box.y - 6, width: 0, height: box.h + 12 }, cp);
      node.setAttribute("clip-path", `url(#${id})`);
      Loom.tween(r, { attr: { width: 0 } }, { attr: { width: box.w + 12 }, duration: dur, ease: Loom.ease.move }, t, { kind: "unmask", beat: ctx.beat.id, content: true });
    }
    function stampIn(node, t, name) {
      Loom.tween(node, { opacity: 0, scale: 1.35, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: enter * 0.7, ease: Loom.ease.enter }, t, { kind: "stamp", beat: ctx.beat.id, name, content: true });
    }
    function drawSlip(g) {
      kit.rect(g, 0, 0, SLIP.w, SLIP.h, { fill: "surface", r: 6 });
      kit.polygon(g, [[SLIP.w - 34, 0], [SLIP.w, 34], [SLIP.w - 34, 34]], { fill: "surface2", flat: true, shadow: false });
      const tx = kit.text(g, P01.slip_text, { role: "body", x: 30, y: 18, w: 300, h: SLIP.h - 36, maxLines: 1, valign: "middle", weight: 700, color: "ink" });
      const ts = tx.lastChild, s = ts.textContent;
      if (s.endsWith("?")) { ts.textContent = s.slice(0, -1); Loom.svg("tspan", { fill: S.c("accent") }, ts, "?"); }
      T.markShape(Loom.svg("g", {}, g), true, 372, SLIP.h / 2, 52, "ink");
    }
    function underlineLabel(g, text, x, y, tone) {
      const G = T.labelGeom(0, 0, text, { as: "underline", role: "label" });
      const cx = x + G.tw / 2 - G.padX / 2, cy = y + G.h / 2;
      const lg = Loom.svg("g", {}, g);
      T.labelShape(lg, cx, cy, text, { as: "underline", role: "label", tone });
      return { g: lg, box: { x: x - 4, y, w: G.tw, h: G.h } };
    }
    function run(parent, row, n, t0, gap, o) {
      const size = (o && o.size) || CELL, y = 10 + row * ROW + (CELL - size) / 2, k0 = (o && o.k0) || 0;
      for (let k = 0; k < n; k++) {
        // the static strength sits on a wrapper so the stamp's opacity tween (0 to 1) cannot override it
        const u = Loom.svg("g", {}, Loom.svg("g", { opacity: (o && o.opacity) || 1 }, parent));
        kit.rect(u, 10 + (k0 + k) * (size + GAP), y, size, size, { fill: "accent", r: Math.max(4, size * 0.12), shadow: false, flat: true });
        stampIn(u, t0 + k * gap, `hidden_units.r${row + 1}.${k}`);
      }
      return 10 + row * ROW + CELL + 6;   // where the run's label goes
    }

    /* ---------------- hold the page and the ledger (the veil recedes; nothing re-enters) ---------------- */
    const held = {};
    for (const n of ["page", "line_1", "line_2", "line_3", "line_4", "strip", "ledger", "visible_units", "hidden_units", "note", "footnote"]) held[n] = ctx.held(n);
    const hid = held.hidden_units, ledger = held.ledger;
    const planParts = ["page", "line_1", "line_2", "line_3", "line_4"].map((n) => held[n]).filter(Boolean);

    /* ---------------- cues ---------------- */
    const tAns = ctx.cue("Answering while you write");
    const tWrite = ctx.cue("while you write");
    const tThat = ctx.cue("That is still switching");
    const tSwitching = ctx.cue("switching");
    const tHidden = ctx.cue("hidden column");

    /* ---------------- catch-up as the page comes forward: rows 2 and 3, and the residue's ghost ---------------- */
    const tc = ctx.start + 0.3;   // after b05's own card has left (its exits run to about the beat start)
    if (hid) {
      const y2 = run(hid.inner, 1, 4, tc, 0.1);                         // resumption lag: the longest run
      const l2 = underlineLabel(hid.inner, props.lag_label, 10, y2, "line");
      wipe(l2.g, l2.box, tc + 0.35, enter * 0.8);
      const y3 = run(hid.inner, 2, 2, tc + 0.3, 0.1, { opacity: 0.5 });   // attention residue: half strength
      const l3 = underlineLabel(hid.inner, props.residue_label, 10, y3, "line");
      wipe(l3.g, l3.box, tc + 0.6, enter * 0.8);
      Loom.sfx("tick", tc + 0.1);
    }
    // @form residue_ghost: a faint copy of the interruption left printed over the work it interrupted
    const gs = 0.8;
    const ghost = ctx.el("ghost", { x: 600, y: 166, w: SLIP.w * gs, h: SLIP.h * gs, kind: "card", exit: "recede" });
    const gg = Loom.svg("g", { transform: `scale(${gs})` }, ghost.inner);
    drawSlip(gg);
    Loom.tween(ghost.inner, { opacity: 0 }, { opacity: 0.15, duration: enter * 1.2, ease: Loom.ease.enter }, tc + 0.4, { kind: "reveal", beat: ctx.beat.id, name: "ghost", content: true });

    /* ---------------- the flick: the question drawn over the slot rect, hard-swapped with the plan ---------------- */
    // @form hard_swap_cover: the alternative content drawn over a held region and toggled with it by hard cuts, never both visible
    const flick = ctx.el("flick", { x: SLOT.x, y: SLOT.y, w: SLOT.w, h: SLOT.h, kind: "card", exit: "recede" });
    const sc = SLOT.w / SLIP.w, sy = (SLOT.h - SLIP.h * sc) / 2;
    drawSlip(Loom.svg("g", { transform: `translate(0 ${sy.toFixed(2)}) scale(${sc.toFixed(4)})` }, flick.inner));
    Loom.set(flick.life, { opacity: 0 }, 0);
    const hold = 0.5;                        // each state at least 0.45 s: under 3 changes a second
    const flicks = [tWrite, tThat, Math.max(tSwitching, tThat + 2 * hold + 0.05)];
    flicks.forEach((t, i) => {
      for (const P of planParts.concat([ghost])) {   // the ghost is printed ON the plan: it goes with it
        Loom.set(P.life, { opacity: 0 }, t);
        Loom.set(P.life, { opacity: 1 }, t + hold);
      }
      Loom.set(flick.life, { opacity: 1 }, t);
      Loom.set(flick.life, { opacity: 0 }, t + hold);
      Loom.sfx("click", t);
      // each switch is booked: one small red unit in row 4, as it happens
      if (hid) run(hid.inner, 3, 1, t + 0.05, 0, { size: 36, k0: i });
    });
    if (hid) {
      const y4 = 10 + 3 * ROW + CELL + 6 - (CELL - 36) / 2;
      const l4 = underlineLabel(hid.inner, props.flick_label, 10, y4, "accent");
      wipe(l4.g, l4.box, flicks[2] + hold + 0.1, enter);
    }
    void tAns;

    /* ---------------- every switch goes in the hidden column: the accent underline under "Hidden" ---------------- */
    if (ledger) {
      const F = kit.fit("Hidden", { role: "title", w: 300, h: 76, maxLines: 1 });
      const ug = Loom.svg("g", {}, ledger.inner);
      kit.rect(ug, 410, 86, F.width, 6, { fill: "accent", r: 3, shadow: false, flat: true });
      Loom.set(ug, { opacity: 0 }, 0);
      Loom.set(ug, { opacity: 1 }, tHidden);
      wipe(ug, { x: 410, y: 80, w: F.width, h: 18 }, tHidden, 0.6);
    }
  },
});
