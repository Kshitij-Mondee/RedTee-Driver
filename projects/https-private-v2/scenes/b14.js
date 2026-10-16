// @design padlock_not_verdict: the closed lock stays shut on a look-alike name; the private trip is highlighted, what lies beyond it is dashed as not covered
// Treatments considered: (1) static composition with a callout per fact, (2) overlays on the held system that swap, recolour and unmask in narration order (chosen), (3) a split comparison of two windows.
Loom.scene("b14", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const svg = (...a) => Loom.svg(...a);
    const c = (t) => ctx.c(t);
    const T = Loom.treat;

    // held: the system, never redrawn
    ["browser", "server", "path", "watcher", "step_bar", "key_slots", "key_browser", "key_server", "padlock", "trip_band"].forEach((n) => ctx.held(n));
    const tripEl = ctx.held("trip_band");

    const tVerdict = ctx.cue("not a verdict on the site");
    const tBad = ctx.cue("a bad actor can get a certificate");
    const tTrip = ctx.cue("It covers the trip");
    const tData = ctx.cue("not what the site does with your data");

    // 1. verdict tag above the browser, over the padlock
    T.label(ctx, "verdict_tag", { x: 300, y: 114, text: "Not a verdict on the site", tone: "ink", role: "label", as: "pill", t: tVerdict });

    // 2. the address swaps to the look-alike; the padlock element is untouched (stays closed)
    const sch = kit.fit("https://", { role: "label", w: 2000, h: 40, maxLines: 1, size: 28, weight: 500 });
    const lx = 110 + 88 + Math.round(sch.width), lw = 110 + 496 - lx;
    const L = ctx.el("lookalike", { x: lx, y: 228, w: lw, h: 56, kind: "card" }); // @form lookalike_address: address host swaps
    svg("rect", { x: 0, y: 0, width: lw, height: 56, rx: 6, fill: c("field") }, L.inner);
    kit.text(L.inner, "login-example.co", { role: "label", size: 28, x: 8, y: 0, w: lw - 16, h: 52, align: "left", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    svg("rect", { x: 8, y: 47, width: lw - 24, height: 3, rx: 1.5, fill: c("neg") }, L.inner);
    m.reveal(L, tBad);

    // 3. the trip band turns blue, label on it
    // the held ink band recolours to blue (hold and transform)
    Loom.hold.heat([tripEl.inner], tTrip, { from: "ink", to: "accent", dur: 0.6 });
    Loom.hold.heat([tripEl.inner], tTrip, { from: "ink", to: "accent", dur: 0.6, attr: "stroke" });
    T.label(ctx, "covers_tag", { x: 1100, y: 508, text: "Covers the trip only", tone: "accent", role: "label", as: "pill", t: tTrip + 0.3 });

    // 4. the data store: dashed, outside the band
    const D = ctx.el("data_store", { x: 1640, y: 598, w: 168, h: 112, kind: "card" }); // @form data_store_outlined: not covered
    svg("rect", { x: 4, y: 4, width: 160, height: 104, rx: 12, fill: c("surface") }, D.inner);
    const dsx = 1652 - 1640, dsy = 606 - 598, dw = 140, dh = 92, ry = 16;
    const dp = "M" + dsx + " " + (dsy + ry) + " V" + (dsy + dh - ry) + " A" + dw / 2 + " " + ry + " 0 0 0 " + (dsx + dw) + " " + (dsy + dh - ry) + " V" + (dsy + ry);
    svg("path", { d: dp, fill: "none", stroke: c("muted"), "stroke-width": 3, "stroke-dasharray": "10 8", "stroke-linecap": "round" }, D.inner);
    svg("ellipse", { cx: dsx + dw / 2, cy: dsy + ry, rx: dw / 2, ry, fill: "none", stroke: c("muted"), "stroke-width": 3, "stroke-dasharray": "10 8" }, D.inner);
    m.unmask(D, tData, { dir: "ttb" });
  },
});
