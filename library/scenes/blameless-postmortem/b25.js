// @design owned_progress_rows: held list rows each gain an owner chip and a progress track that fills, ticking when full
/* b25 - a fix is only a fix when someone owns it and it gets done.
 * Treatments considered: (A) owner name badges on each row (rejected: the script names no owner, and
 * inventing names would break grounding), (B) a single progress bar for all three fixes (rejected: it
 * hides that each fix has its own owner and its own finish), (C) CHOSEN: the three held rows stay put;
 * in the free right-hand part of each row an owner chip arrives, then its own track fills and its
 * checkbox ticks the instant the track is full, row by row. Motion is content: owned -> done IS the point.
 */
Loom.scene("b25", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // held rows from b24 (claimed by the storyboard `keep`): read their geometry, do not re-claim
    const rows = [1, 2, 3].map((i) => {
      const claimed = (Loom.ctxScene && Loom.ctxScene.claimedFrom) || [];
      return claimed.find((e) => e.name === "item_" + i) || ctx.held("item_" + i);
    });

    const tOwner = ctx.cue("a named owner");
    const tTrack = ctx.cue("track it to done");
    const fillDur = 0.7, stagger = 0.28, popGap = 0.09;

    const CHIP_W = 176, CHIP_H = 46, GAP = 12, TRACK_H = 26, BOX = 44, BOX_GAP = 16;
    const BH = CHIP_H + GAP + BOX;             // block height (the checkbox row is the taller one)

    rows.forEach((row, i) => {
      if (!row) return;
      // list.steps draws its card across the left 78% of the row: the free part starts at 0.8 * w
      const bx = row.x + 0.8 * row.w;
      const bw = Math.floor(0.2 * row.w);
      const by = row.y + (row.h - BH) / 2;
      const trackW = Math.min(bw - BOX - BOX_GAP, 250);

      // status block: owner chip + empty track + empty checkbox
      const st = ctx.el("status_" + (i + 1), { x: bx, y: by, w: bw, h: BH, kind: "token", exit: "recede" });
      // @form owner_chip: a small pill chip with a person icon and a role word
      kit.pill(st.inner, 0, 0, CHIP_W, CHIP_H, { fill: "surface2" });
      kit.icon(st.inner, "user-round", { x: 28, y: CHIP_H / 2, size: 30, color: "accent2" });
      kit.text(st.inner, "Owner", { role: "label", x: 54, y: 0, w: CHIP_W - 66, h: CHIP_H, maxLines: 1, valign: "middle" });

      const ty = CHIP_H + GAP + (BOX - TRACK_H) / 2;
      // @form progress_track: an empty pill track whose fill grows left to right to show completion
      kit.pill(st.inner, 0, ty, trackW, TRACK_H, { fill: "surface2" });
      const fill = Loom.svg("rect", { x: 3, y: ty + 3, width: 0, height: TRACK_H - 6, rx: (TRACK_H - 6) / 2, fill: S.c("pos") }, st.inner);
      kit.rect(st.inner, trackW + BOX_GAP, CHIP_H + GAP, BOX, BOX, { fill: "surface", r: 8 });

      m.pop(st, tOwner + i * popGap, { overshoot: false });

      // the track fills left to right: value travel from its minimum
      const t0 = tTrack + i * stagger;
      const full = trackW - 6;
      Loom.drive((e) => fill.setAttribute("width", (Math.max(0, full * e)).toFixed(2)), t0, fillDur, "editorial", { kind: "value_travel", beat: ctx.beat.id, name: "status_" + (i + 1), content: true });

      // the checkbox ticks the instant its track is full (the reading, marked when it stops)
      // @form outcome_tick: a tick or cross mark landing on an item to show its result
      const tk = ctx.el("tick_" + (i + 1), { x: bx + trackW + BOX_GAP, y: by + CHIP_H + GAP, w: BOX, h: BOX, kind: "mark", exit: "recede" });
      kit.mark(tk.inner, "yes", BOX / 2, BOX / 2, BOX - 6);
      m.stamp(tk, t0 + fillDur);
    });
  },
});
