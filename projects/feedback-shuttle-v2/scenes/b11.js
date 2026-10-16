// @design full_structure_lit: the complete three-part comment is the thing, lit one part at a time, with the vague one fading behind it
Loom.scene("b11", {
  build(ctx, props) {
    // Treatments considered: (1) static large comment with signalling (chosen: rows light as said),
    // (2) rows built one by one again (rejected: b10 already built them), (3) zoom on each row (rejected: one frame holds the structure).
    const m = ctx.m, sv = Loom.svg;
    const T_LIT1 = ctx.cue("What he did");
    const T_LIT2 = ctx.cue("what it caused");
    const T_LIT3 = ctx.cue("one step");
    const T_FADE = ctx.cue("still kind");
    const T_CLOCK = ctx.cue("say it soon");

    const FW = 900;                           // the full bubble, large
    const FX = 510, FY = 316;                 // its box
    const GS = 0.8, GW = 760 * GS;            // the ghost, smaller, up and left so its one line peeks out above
    const GX = 380, GY = FY - 147;

    // the ghost, drawn first so it sits under the full bubble
    // @form ghost_vague: the vague comment as a faint ghost
    const GE = ctx.el("ghost", { x: GX, y: GY, w: GW, h: 184, kind: "bubble", exit: "recede" });
    const gwrap = sv("g", {}, GE.inner);
    const gin = sv("g", { transform: "translate(0 " + (-210 * GS) + ")" }, gwrap);
    const ghost = Loom.lesson.comment_bubble(ctx, gin, { w: GW });
    ghost.setState("ghost", ctx.start + 0.05);

    // @form full_comment: the complete three-row comment, large
    // The kit's lit_N states drop the slot colours (paper tabs), so the bubble stays on "step"
    // (Behaviour accent3, Effect accent4, Next step accent2 tabs all the time) and the row being
    // spoken is shown by an outline in that row's own slot colour, drawn here over the row.
    const FE = ctx.el("full", { x: FX, y: FY, w: FW, h: 521, kind: "bubble", exit: "recede" });
    const full = Loom.lesson.comment_bubble(ctx, FE.inner, { w: FW });
    full.setState("step", ctx.start + 0.1);

    const SC = FW / 760;
    const hl = sv("g", { transform: "scale(" + SC + ")" }, FE.inner);
    const SLOTS = ["accent3", "accent4", "accent2"];
    const CY = full.rowY, CH = full.rowH;
    // an open outline round the row that stops at the tab, so the tab (and its words) stay clear
    const outlines = [0, 1, 2].map(function (i) {
      const y0 = CY[i] - 6, y1 = CY[i] + CH + 6, xl = 14, xr = 746, R = 16;
      const d = "M198 " + y0 + " H" + (xr - R) + " Q" + xr + " " + y0 + " " + xr + " " + (y0 + R) +
        " V" + (y1 - R) + " Q" + xr + " " + y1 + " " + (xr - R) + " " + y1 +
        " H" + (xl + R) + " Q" + xl + " " + y1 + " " + xl + " " + (y1 - R) +
        " V" + (y0 + R) + " Q" + xl + " " + y0 + " " + (xl + R) + " " + y0 + " H30";
      return sv("path", { d: d, fill: "none", stroke: ctx.c(SLOTS[i]), "stroke-width": 11, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0, visibility: "hidden" }, hl);
    });
    const D_IN = 0.3, D_OUT = 0.3;
    const cues = [T_LIT1, T_LIT2, T_LIT3];
    const offs = [T_LIT2, T_LIT3, T_FADE];
    outlines.forEach(function (r, i) {
      Loom.drive(function (e) { r.setAttribute("opacity", String(Math.round(e * 100) / 100)); r.setAttribute("visibility", e > 0.001 ? "inherit" : "hidden"); }, cues[i], D_IN, "enter", { key: "b11.lit" + i + ".in" });
      Loom.drive(function (e) { r.setAttribute("opacity", String(Math.round((1 - e) * 100) / 100)); r.setAttribute("visibility", e < 0.999 ? "inherit" : "hidden"); }, offs[i], D_OUT, "exit", { key: "b11.lit" + i + ".out" });
    });

    // the ghost fades further on "still kind"
    Loom.drive(function (e) { gwrap.setAttribute("opacity", String(Math.round((1 - 0.55 * e) * 100) / 100)); }, T_FADE, ctx.style.dur("enter"), "enter", { key: "b11.ghostfade" });

    // @form wall_clock: a small clock beside it, its minute hand ticking
    const CE = ctx.el("clock", { x: 1500, y: 470, w: 150, h: 150, kind: "instrument", exit: "recede" });
    const clock = Loom.lesson.wall_clock(ctx, CE.inner, { w: 150 });
    m.drop(CE, T_CLOCK);
    for (let i = 1; i <= 4; i++) clock.setMinutes(590 + i * 5, T_CLOCK + 0.45 + (i - 1) * 0.4, 0.2);
  }
});
