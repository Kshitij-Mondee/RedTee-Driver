// @design promise_before_proof: a dashed route is traced along the path, then an open lock appears above the point where it will later close
// Treatments: (1) static padlock + label only; (2) route wipes along the path then the lock draws in above the watcher (chosen: orients, then promises); (3) lock travels along the route.
Loom.scene("b03", {
  build(ctx) {
    const M = ctx.m, T = Loom.treat, c = ctx.c;

    const board = ctx.held("board");
    const packet = ctx.held("packet");
    ctx.held("copy");
    ctx.held("label_watcher");

    const tFollow = ctx.cue("Follow this request");
    const tNoise = ctx.cue("turns to noise");

    // pull back to the wide board

    // @form route: dashed accent route along the path, wiped in left to right, under the board cards and the packet
    const rE = ctx.el("route", { x: 580, y: 470, w: 760, h: 20, kind: "connector", exit: "recede" });
    const clipId = "b03-route-clip";
    const defs = Loom.svg("defs", {}, rE.inner);
    const cp = Loom.svg("clipPath", { id: clipId }, defs);
    const cr = Loom.svg("rect", { x: 0, y: 0, width: 0, height: 20 }, cp);
    const rg = Loom.svg("g", { "clip-path": "url(#" + clipId + ")" }, rE.inner);
    Loom.svg("line", { x1: 0, y1: 10, x2: 760, y2: 10, stroke: c("accent"), "stroke-width": 6, "stroke-linecap": "round", "stroke-dasharray": "16 12" }, rg);
    Loom.drive((e, p) => { cr.setAttribute("width", (760 * p).toFixed(1)); }, tFollow, 1.1, "linear", { key: "route_wipe" });
    try { const bo = (board.E || board).outer; if (bo && bo.parentNode && rE.outer.parentNode === bo.parentNode) bo.parentNode.insertBefore(rE.outer, bo); } catch (e) {}
    M.reveal(rE, tFollow);

    // the engine's wide pull shrinks the board a little; lift the two packet cards a touch so their rows stay readable
    let PW = 200; try { const f = ctx.kit.fit("Password: Sunrise42", { role: "caption", weight: 500, maxLines: 1, w: 4000, h: 200 }); if (f && f.width && f.size) PW = Math.max(200, Math.ceil(f.width * 18 / f.size + 28)); } catch (e) { PW = 200; }
    const S = 1.08, X0 = 350 - PW / 2;
    M.travel(packet.E || packet, ctx.start, { x: 1120 - X0 - (S - 1) * PW / 2, y: 54 - (S - 1) * 60, scale: S, dur: 0.5 });
    M.travel(ctx.held("copy").E || ctx.held("copy"), ctx.start, { x: -(S - 1) * PW / 2, y: 190 - (S - 1) * 60, scale: S, dur: 0.5 });

    // the packet pulses once as the route reaches it
    packet.handle.setState("pulse", tFollow + 0.8);

    // @form padlock_open: the open generic padlock above the watcher box, where the payoff will close it
    const pE = ctx.el("padlock", { x: 910, y: 150, w: 100, h: 130, kind: "icon", exit: "recede" });
    const lock = Loom.lesson.padlock(ctx, pE.inner, { open: true });
    M.reveal(pE, tNoise);
    lock.setState("pulse", tNoise + 0.5);

    // @form label_padlock: pill naming the promise
    T.label(ctx, "label_padlock", { x: 1130, y: 215, text: "Padlock", to: [1016, 215], tone: "accent", role: "label", t: tNoise + 0.35, as: "pill" });
  },
});
