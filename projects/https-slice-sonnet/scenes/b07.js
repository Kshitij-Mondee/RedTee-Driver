// @design two_values_cross_unread: two small values cross a shared path in opposite lanes, a middle observer copies both, yet its own slot stays empty
// Treatments considered: (1) static composition with labelled tokens and tray; (2) tokens crossing on lanes above and below the watcher, copies dropping into the tray (chosen: the copy happening is the point); (3) tokens through the watcher box (rejected: overlap).
Loom.scene("b07", {
  build(ctx, props) {
    const c = ctx.c, m = ctx.m, kit = ctx.kit;
    const sv = (tag, a, p) => Loom.svg(tag, a, p);
    const MONO = "Inter, sans-serif";

    // ---- held things (b06 draws them; be defensive about the slots and the retiring label)
    let slots = null, board = null, keyLabel = null;
    try { board = ctx.held("board"); } catch (e) { board = null; }
    try { slots = ctx.held("key_slots"); } catch (e) { slots = null; }
    if (!slots || !slots.handle) {
      const KE = ctx.el("key_slots", { x: 0, y: 0, w: 1920, h: 1080, kind: "instrument", exit: "none" });
      const kh = Loom.lesson.key_slots(ctx, KE.inner, { which: "all" });
      slots = { handle: kh, E: KE };
    }
    try { keyLabel = ctx.held("label_key"); } catch (e) { keyLabel = null; }

    // ---- measure the token pill (label size floor 18)
    const LABEL = "Temporary value";
    let tw = 15 * 0.6 * 20;
    try { const f = kit.fit(LABEL, { role: "caption", weight: 700, maxLines: 1, w: 4000, h: 200 }); if (f && f.width && f.size) tw = f.width * 20 / f.size; } catch (e) {}
    const PW = Math.ceil(tw + 36), PH = 36;

    function pill(parent, x, y, o) {
      const g = sv("g", {}, parent);
      sv("rect", { x: x, y: y + 5, width: PW, height: PH, rx: 12, fill: c("shadow"), opacity: 0.1 }, g);
      sv("rect", { x: x, y: y, width: PW, height: PH, rx: 12, fill: c("accent3") }, g);
      const t = sv("text", { x: x + PW / 2, y: y + PH / 2 + 6.5, "text-anchor": "middle", "font-family": MONO, "font-size": 20, "font-weight": 700, fill: c("onAccent") }, g);
      t.textContent = LABEL;
      return g;
    }

    // lanes: A above the watcher box (box top y410), B below it (box bottom y550, tray top y590)
    const LANE_A = 360, LANE_B = 552;      // pill top y
    const XL = 686 - PW / 2, XR = 1234 - PW / 2; // pill left x at the browser side / server side
    const SPAN = XR - XL;
    const tokA = ctx.el("token_a", { x: XL, y: LANE_A, w: SPAN + PW, h: PH + 6, kind: "token", exit: "none" });
    const gA = sv("g", { opacity: 0 }, tokA.inner);
    pill(gA, 0, 0);
    const tokB = ctx.el("token_b", { x: XL, y: LANE_B, w: SPAN + PW, h: PH + 6, kind: "token", exit: "none" });
    const gB = sv("g", { opacity: 0 }, tokB.inner);
    pill(gB, SPAN, 0);

    // tray copies: two small value copies inside the tray (x836-1084, y606-724)
    const tray = ctx.el("tray_values", { x: 836, y: 606, w: 248, h: 118, kind: "value", exit: "none" });
    const cx0 = (248 - PW) / 2;
    const cpA = sv("g", { opacity: 0 }, tray.inner), cpB = sv("g", { opacity: 0 }, tray.inner);
    pill(cpA, cx0, 14);
    pill(cpB, cx0, 62);

    // ---- timeline
    const tEach = ctx.cue("Each side");
    const tTemp = ctx.cue("temporary value");
    const tCopy = ctx.cue("copies both");
    const tWork = ctx.cue("cannot practically work out");

    if (keyLabel) m.exit(keyLabel, tEach, "recede");
    const appear = (g, t, x0) => Loom.drive((e) => {
      g.setAttribute("opacity", Math.min(1, e * 2).toFixed(2));
    }, t, 0.35, "enter");
    appear(gA, tEach + 0.45);
    appear(gB, tEach + 0.65);

    const dur = 1.5, tGo = tTemp + 0.5;
    Loom.drive((e) => { gA.setAttribute("transform", "translate(" + (SPAN * e).toFixed(1) + " 0)"); }, tGo, dur, "move");
    Loom.drive((e) => { gB.setAttribute("transform", "translate(" + (-SPAN * e).toFixed(1) + " 0)"); }, tGo, dur, "move");

    // watcher copies each value into the tray
    if (board && board.handle) board.handle.highlight("watcher", 1, tCopy);
    const drop = (g, t) => Loom.drive((e) => {
      g.setAttribute("opacity", Math.min(1, e * 2.2).toFixed(2));
      g.setAttribute("transform", "translate(0 " + (-26 * (1 - e)).toFixed(1) + ")");
    }, t, 0.45, "enter");
    drop(cpA, tCopy);
    drop(cpB, tCopy + 0.55);

    // the watcher's own slot shakes once and stays empty
    slots.handle.setState("watcher_shake", tWork);
  },
});
