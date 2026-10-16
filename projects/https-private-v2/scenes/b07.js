// @design failed_check_warning : one of three checks fails, the checker raises a warning and the carrier stops
/* Three treatments considered: (1) static: a cross and a warning label on the finished checklist; (2) the whole
 * certificate swaps for a warning card; (3) chosen: the held checklist stays, ONE row flips from tick to cross,
 * then the browser's own warning panel covers its content and the waiting packet is stopped and dimmed.
 * Cues: Fail any one -> Name row cross; the browser warns you -> warning panel, stopped packet, tag. */
Loom.scene("b07", {
  build(ctx) {
    const { m, kit } = ctx;
    const svg = (...a) => Loom.svg(...a);
    const tCross = ctx.cue("Fail any one");
    const tWarn = ctx.cue("the browser warns you");

    // held from b06: the system stays exactly as it was, and the checklist with its packet
    const HELD = {};
    ["browser", "path", "server", "watcher", "step_bar", "packet", "tls_wrap", "cert", "check_panel"].forEach((n) => {
      try { HELD[n] = ctx.held(n); } catch (e) { Loom.error("b07_held_probe", n + ": " + e.message); }
    });
    // the waiting packet is replaced by the stopped one, which then moves clear of the certificate
    ["packet", "tls_wrap"].forEach((n) => {
      const H = HELD[n];
      if (H) m.exit(H, tWarn, "recede");
    });

    // @form name_row_flag: a red outline round the one failing row
    const EF = ctx.el("name_flag", { x: 680, y: 394, w: 600, h: 104, kind: "card" });
    svg("rect", { x: 6, y: 6, width: 588, height: 92, rx: 14, fill: "none", stroke: ctx.c("neg"), "stroke-width": 4 }, EF.inner);
    m.reveal(EF, tCross, { dy: 0 });

    // @form name_cross: a cross glyph replaces the tick on the Name row
    const EX = ctx.el("name_cross", { x: 1196, y: 406, w: 80, h: 80, kind: "token" });
    svg("circle", { cx: 40, cy: 40, r: 31, fill: ctx.c("surface") }, EX.inner);
    kit.mark(EX.inner, "no", 40, 40, 52);
    m.pop(EX, tCross);

    // @form browser_warning: the browser window's own warning panel over its content
    const EW = ctx.el("warning", { x: 110, y: 150, w: 520, h: 550, kind: "card" });
    // same panel as the kit's warning state (surface card, neg edge, cross mark, Warning, muted line), laid out in the
    // free left column so the stopped packet can sit across it
    svg("rect", { x: 24, y: 156, width: 472, height: 372, rx: 20, fill: ctx.c("surface"), stroke: ctx.c("neg"), "stroke-width": 3 }, EW.inner);
    kit.mark(EW.inner, "no", 68, 198, 48);
    kit.text(EW.inner, "Warning", { role: "lead", size: 42, x: 104, y: 172, w: 220, h: 52, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    kit.text(EW.inner, "Name does not match", { role: "label", size: 28, x: 44, y: 232, w: 440, h: 40, valign: "middle", maxLines: 1, weight: 500, color: "muted" });
    m.reveal(EW, tWarn, { dy: 0 });

    // @form stopped_packet: the waiting packet, stopped and marked rejected
    const EP = ctx.el("packet_rejected", { x: 170, y: 411, w: 400, h: 270, kind: "token" });
    const dp = svg("defs", {}, EP.inner);
    const cp2 = svg("clipPath", { id: "b07-clip-p" }, dp);
    svg("rect", { x: 0, y: 0, width: 396, height: 270 }, cp2);
    const pg = svg("g", { "clip-path": "url(#b07-clip-p)" }, EP.inner);
    kit.rect(pg, 35, 44, 330, 150, { fill: "surface", r: 14 });
    const pk = Loom.lesson.login_packet(ctx, pg, { origin: [170, 411], x: 0, y: 0 });
    pk.setState("wrapped", ctx.start - 4);
    pk.wrapTone("ink", ctx.start - 4);
    pk.setState("rejected", tWarn);
    m.reveal(EP, tWarn, { dy: 0 });

    // @form warning_tag: the neg tag naming what happened
    const txt = "One fails: warning";
    const f = kit.fit(txt, { role: "label", w: 2000, h: 40, maxLines: 1, size: 28, weight: 700 });
    const tw = Math.min(300, Math.round(f.width + 40));
    const ET = ctx.el("fail_tag", { x: 980 - tw / 2, y: 650, w: tw, h: 56, kind: "bubble" });
    kit.rect(ET.inner, 0, 0, tw, 56, { fill: "neg", r: 10 });
    kit.text(ET.inner, txt, { role: "label", size: 28, x: 0, y: 0, w: tw, h: 56, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "onAccent" });
    m.reveal(ET, tWarn + 0.2, { dy: 0, dur: 0.2 });

    // everything this beat drew leaves just before the join, so nothing lingers over step 2
    const tOut = ctx.end - 0.35;
    [EF, EX, EW, EP, ET].forEach((E) => m.exit(E, tOut, "recede"));
  },
});
