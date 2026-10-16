// @design private_trip_pair: a lock closes beside a name, a solid band grows between the ends, and the address and the verified name sit either side of the lock
Loom.scene("b13", {
  build(ctx, props) {
    /* Three treatments: (1) static callout card with a lock between two names, no motion;
       (2) only the bar lock closing, the band growing; (3) chosen: bar lock closes, band grows
       end to end, then a callout pairs address, big lock, verified name with the label. */
    const svg = (...a) => Loom.svg(...a);
    const kit = ctx.kit, c = (t) => ctx.c(t), m = ctx.m;
    ["browser", "server", "path", "watcher", "step_bar", "key_slots", "key_browser", "key_server"].forEach((n) => { if (ctx.has) { /* names are held below */ } ctx.held(n); });

    const ease = (p) => { p = p < 0 ? 0 : p > 1 ? 1 : p; return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
    const tClose = ctx.cue("Now the padlock");
    const tTrip = ctx.cue("a private trip");
    const tSite = ctx.cue("the site named in the address");

    /* ---- padlock: closes in the bar, beside the address (kit padlock, 44 px, in the dashed slot) */
    const PL = { x: 164 - 22, y: 256 - 22 };
    const EP = ctx.el("padlock", { x: PL.x, y: PL.y, w: 44, h: 44, kind: "icon", exit: "none" });
    // @form padlock_closed: the lock that closes beside the address
    const pad = Loom.lesson.padlock(ctx, EP.inner, { size: 44 });
    pad.setState("open", ctx.start);
    m.reveal(EP, ctx.start + 0.05);
    pad.setState("closed_named", tClose);

    /* ---- trip band: a solid band that grows from the browser end to the server end */
    const ET = ctx.el("trip_band", { x: 630, y: 408, w: 800, h: 44, kind: "connector", exit: "none" });
    // @form trip_band: the path becomes one solid private trip
    const band = svg("rect", { x: 0, y: 8, width: 0, height: 28, rx: 14, fill: c("ink"), "fill-opacity": 0.22, stroke: c("ink"), "stroke-width": 4 }, ET.inner);
    const bandRender = (T) => {
      const p = ease((T - tTrip) / 0.9);
      band.setAttribute("width", Math.max(0, 800 * p).toFixed(2));
      band.setAttribute("opacity", p > 0 ? 1 : 0);
    };
    bandRender(ctx.start);
    const o = { t: 0 };
    const D = Math.max(ctx.end - ctx.start + 2, 10);
    Loom.tween(o, { t: 0 }, { t: D, duration: D, ease: "none", onUpdate: () => bandRender(ctx.start + o.t) }, ctx.start, { kind: "state", beat: "b13", name: "trip_band", content: true });
    m.reveal(ET, ctx.start + 0.05);

    /* ---- name pair: address and verified name, the lock between them */
    const CX = 656, CY = 540, CW = 768, CH = 200;
    const EN = ctx.el("name_pair", { x: CX, y: CY, w: CW, h: CH, kind: "card", exit: "recede" });
    const g = EN.inner;
    kit.card(g, 0, 0, CW, CH, { fill: "surface" });
    kit.text(g, "Padlock: private trip, claimed site", { role: "label", size: 36, x: 24, y: 10, w: CW - 48, h: 52, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    const NAME = "login.example.com";
    const fit = kit.fit(NAME, { role: "label", w: 2000, h: 40, maxLines: 1, size: 28, weight: 700 });
    const cw = Math.min(300, Math.ceil(fit.width) + 40), ch = 64;
    const lx = 20, rx = CW - 20 - cw, cy = 114;
    const mid = (lx + cw + rx) / 2;
    const chip = (x, label, tone) => {
      kit.text(g, label, { role: "label", size: 30, x, y: 68, w: cw - 36, h: 38, align: "left", valign: "middle", maxLines: 1, weight: 500, color: "muted" });
      kit.pill(g, x, cy, cw, ch, { fill: "field", stroke: tone, sw: 3 });
      kit.text(g, NAME, { role: "label", size: 28, x: x + 20, y: cy, w: cw - 40, h: ch, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    };
    // @form address_chip: the address as typed
    chip(lx, "Address", "line");
    // @form verified_chip: the name the site proved
    chip(rx, "Verified name", "accent3");
    kit.mark(g, "yes", rx + cw - 18, 88, 32);
    const BIG = 88;
    const bigG = svg("g", { transform: "translate(" + (mid - BIG / 2).toFixed(1) + " " + (cy + ch / 2 - BIG / 2).toFixed(1) + ")" }, g);
    // @form padlock_between: the closed lock between address and verified name
    const bigPad = Loom.lesson.padlock(ctx, bigG, { size: BIG });
    bigPad.setState("open", ctx.start);
    bigPad.setState("closed_named", tSite + 0.3);
    m.settle(EN, tSite);
  },
});
