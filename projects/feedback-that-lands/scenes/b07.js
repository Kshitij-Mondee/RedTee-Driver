// @design hold_on_unchanged_artifact: the camera holds on a document that did not change and settles on the one soft line
// b07 - Inside the monitor: the client update, untouched.
// Treatments considered: (A) before/after documents side by side (rejected: there is no "after", that is the point),
// (B) a red highlight on the weak line (rejected: it would be the feedback the lesson says was never given),
// (C) CHOSEN: the same document window as b04 to b06, nothing in it moves, the window breathes while the narration is
// fair to the verdict, a gentle push settles on the soft line, and one tag says what changed. The hold IS the argument.
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, D = Loom.data, svg = Loom.svg;
    const tc = (tok) => S.c(tok);
    const tLook = ctx.cue("look at the update"), tChanged = ctx.cue("has changed");

    const world = svg("g", {}, ctx.g);               // one wrapper so the push carries the whole screen

    // ---- inside the monitor: the bezel around a quiet desktop, a taskbar and a few files (no words)
    // @form screen_interior: the inside of a monitor, bezel at the edges, a calm desktop with a taskbar and file icons
    const scr = ctx.el("screen", { parent: world, x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    svg("rect", { x: -80, y: -80, width: 2080, height: 1240, fill: tc("ink") }, scr.inner);
    svg("rect", { x: 40, y: 36, width: 1840, height: 1008, rx: 14, fill: tc("field2") }, scr.inner);
    svg("rect", { x: 40, y: 976, width: 1840, height: 68, fill: tc("surface2") }, scr.inner);
    svg("rect", { x: 40, y: 974, width: 1840, height: 2, fill: tc("line"), opacity: 0.35 }, scr.inner);
    [0, 1, 2, 3].forEach((i) => svg("rect", { x: 70 + i * 72, y: 996, width: 44, height: 28, rx: 7, fill: tc(i === 1 ? "accent" : "line"), opacity: i === 1 ? 0.7 : 0.4 }, scr.inner));
    [0, 1, 2].forEach((i) => Loom.obj.shape(scr.inner, i === 1 ? "folder" : "document", 1790, 150 + i * 150, 92, { key: "b07desk" + i, detail: 1, shadow: false }));

    // ---- the document window (same title bar, bars and soft line as the monitor in b04 to b06)
    const W = ui_window();
    function ui_window() { return Loom.ui.window(ctx, { name: "window", x: 300, y: 100, w: 1320, h: 700, title: "Update" }); }
    world.appendChild(W.E.outer);
    const body = W.body, bx = 80, bw = 1320 - 160, gap = 74, y0 = body.y + 62;
    const widths = [0.92, 0.78, 0.86, 0.7, 0.84, 0.46, 0.62];
    // @form document_window_bars: a document window drawn as a title bar and grey text bars, no words
    widths.forEach((wf, i) => {
      const y = y0 + i * gap;
      if (i === 3) {                                  // the soft line: an uneven smudge, the same one as before
        const rng = Loom.rng("b07:smudge");
        for (let k = 0; k < 6; k++) svg("rect", { x: bx + rng() * 36, y: y - 12 + (rng() - 0.5) * 18, width: bw * wf * (0.4 + rng() * 0.5), height: 22 + rng() * 12, rx: 12, fill: tc("muted"), opacity: 0.2 + rng() * 0.12 }, W.E.inner);
      } else kit.path(W.E.inner, `M${bx} ${y} H${bx + bw * wf}`, { stroke: "line", sw: 22, opacity: 0.6 });
    });
    const softY = W.E.y + y0 + 3 * gap, softEnd = W.E.x + bx + bw * widths[3];
    const caret = svg("rect", { x: bx + bw * widths[3] + 14, y: y0 + 3 * gap - 18, width: 5, height: 36, fill: tc("accent") }, W.E.inner);   // idle caret, period-locked
    Loom.drive((e, raw) => caret.setAttribute("opacity", Math.floor(raw * (ctx.end - ctx.start) / 0.5) % 2 ? 0 : 1), ctx.start, ctx.end - ctx.start, "linear", { kind: "ambient", beat: ctx.beat.id, name: "update.caret" });
    Loom.hold.breathe(W.E, ctx.start + 0.2, tLook, { amp: 0.012, period: 4 });   // it holds, and breathes, while the narration is fair

    // ---- the tag that names what changed, beside the soft line
    // @form side_tag: a solid tag that wipes in beside the thing it names
    const tag = D.tag(ctx, "tag_nothing", { x: softEnd + 90, y: softY - 28, text: "Nothing changed", color: "accent", t: tChanged });
    world.appendChild(tag.outer);

    // ---- the one camera move: a gentle push onto the soft line
    Loom.drive((e) => { const s = 1 + 0.2 * e, fx = 880, fy = softY; world.setAttribute("transform", `translate(${fx} ${fy}) scale(${s.toFixed(4)}) translate(${-fx} ${-fy})`); }, tLook, 2.2, "editorial", { kind: "camera", beat: ctx.beat.id, name: "screen.push", content: true });
  },
});
