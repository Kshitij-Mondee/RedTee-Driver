// @design cutaway_leak_loop: a cutaway where a stream slips through a gap and re-enters the intake, the term landing on the stream
/* b14, recirculation. "Warm air finds the gap, slips through to the front, and the servers breathe it again. That is
 * recirculation." Corporate-clean (guide s5, s7, s9): flat fills, one offset shadow, cool = accent4, warm = accent2.
 *
 * Three treatments considered:
 *   A. the whole rack stays still and a warm arrow is drawn through the gap (a diagram of a path, nothing travels);
 *   B. a hard cut to a zoomed gap with only the leak (loses the servers that breathe it in: the point of the beat);
 *   C. (chosen) the kit rack in side section on a quiet cold-aisle / hot-aisle ground. A slow camera push to the
 *      gap, and the warm stream GROWS through it (a clip front that follows the stream, back to front, then down the
 *      curl) while its beads flow, so the viewer watches the leak travel; the intake of the servers below tints warm on
 *      "breathe it again"; the term settles on the curl last.
 * Why C: recirculation is air moving where it should not (the animation gate: motion is the content here). The
 * rack, its streams and the slot come from the kit (never redrawn); the world (aisle washes, floor, perforated plate)
 * and the term label are this beat's own.
 */
Loom.scene("b14", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;

    // ---- times, all from the narration
    const tFind = ctx.cue("Warm air finds the gap");
    const tSlip = ctx.cue("slips through to the front");
    const tBreathe = ctx.cue("the servers breathe it again");
    const tTerm = ctx.cue("That is recirculation");

    // ---- the place: one element, so the camera carries the world, the rack and the term together
    const PX = 659, PY = 60;                       // where the kit rack (natural 700 x 860) sits in the frame
    const E = ctx.el("rack_section", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    // @form aisle_wash: a faint tint on each side of a cutaway marks the cold side and the hot side, no words
    kit.rect(E.inner, 0, 0, PX + 350, 1080, { fill: "accent4", opacity: 0.08, r: 0, shadow: false });
    kit.rect(E.inner, PX + 350, 0, 1920 - (PX + 350), 1080, { fill: "accent2", opacity: 0.05, r: 0, shadow: false });
    // the floor the rack stands on, with a perforated plate under the cold side
    kit.rect(E.inner, 0, PY + 826, 1920, 1080 - (PY + 826), { fill: "surface2", r: 0, shadow: false });
    kit.line(E.inner, 0, PY + 826, 1920, PY + 826, { stroke: "line", sw: 3, opacity: 0.6 });
    kit.rect(E.inner, PX + 6, PY + 826, 336, 16, { fill: "surface", r: 4, shadow: false });
    for (let i = 0; i < 9; i++) kit.rect(E.inner, PX + 28 + i * 34, PY + 828, 8, 12, { fill: "surface2", r: 2, shadow: false });

    // ---- the rack: the kit's side section, state gap (slot third from the top, the same slot as b13 and b15)
    const rack = Loom.lesson.rack(ctx, E.inner, { x: PX, y: PY, view: "side", state: "gap" });
    m.reveal(E, ctx.start + 0.05, { dy: 0 });
    rack.flow(ctx.start + 0.1, ctx.end - 0.2);

    // ---- the leak: the kit's stream, grown along its own path by a clip that follows it (back, through the gap, then
    // out of the front and down the curl). The beads inside keep flowing; the clip only decides how far the stream has got.
    const lk = rack.streams.leak;
    const dLeak = lk.ruler.getAttribute("d"), Ltot = lk.ruler.getTotalLength();
    const straight = rack.anchors.leakStart.x - rack.anchors.frontX;          // back edge to the front edge, along the slot
    const fS = Math.min(0.95, straight / Ltot);
    const leakG = rack.piece("leak");
    // a soft warm halo under the beads: the one thing the narration is naming (accent_on leak_stream) without a third hue
    const halo = Loom.svg("path", { d: dLeak, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 34, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.18 }, null);
    leakG.insertBefore(halo, leakG.firstChild);
    const defs = Loom.svg("defs", {}, rack.root);
    const clipId = Loom.uid("b14clip");
    const clip = Loom.svg("clipPath", { id: clipId }, defs);
    const poly = Loom.svg("polygon", { points: "" }, clip);
    const HW = 34;
    const tangent = (s) => {
      const a = lk.ruler.getPointAtLength(Math.max(0, s - 1)), b = lk.ruler.getPointAtLength(Math.min(Ltot, s + 1));
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      return [dx / d, dy / d];
    };
    const clipTo = (f) => {
      const len = Math.max(0.5, f * Ltot), n = Math.max(2, Math.ceil(len / 5));
      const L = [], R = [];
      for (let i = 0; i <= n; i++) {
        const s = len * i / n, p = lk.ruler.getPointAtLength(s), [tx, ty] = tangent(s);
        L.push([p.x - ty * HW, p.y + tx * HW]); R.push([p.x + ty * HW, p.y - tx * HW]);
      }
      if (f >= 0.999) {   // the tip and its head are inside the clip once the stream has arrived
        const p = lk.ruler.getPointAtLength(Ltot), [tx, ty] = tangent(Ltot);
        L.push([p.x - ty * HW + tx * 14, p.y + tx * HW + ty * 14]); R.push([p.x + ty * HW + tx * 14, p.y - tx * HW + ty * 14]);
      }
      poly.setAttribute("points", L.concat(R.reverse()).map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" "));
    };
    leakG.setAttribute("clip-path", "url(#" + clipId + ")");
    clipTo(0);
    const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const seg = (t, a, b, f0, f1) => (t <= a ? f0 : t >= b ? f1 : f0 + (f1 - f0) * eio((t - a) / (b - a)));
    const a0 = tFind + 0.4, a1 = tSlip - 0.1, b0 = tSlip + 0.05, b1 = tSlip + 1.55;
    Loom.drive((e, raw) => {
      const t = a0 + raw * (b1 - a0);
      clipTo(t < b0 ? seg(t, a0, a1, 0, fS) : seg(t, b0, b1, fS, 1));
    }, a0, b1 - a0, "linear", { kind: "draw", name: "leak_stream", content: true });
    rack.reveal("leak", a0 - 0.1, { dy: 0, dur: 0.15 });
    rack.leakFlow(a0, ctx.end - 0.2);

    // ---- the camera: a slow push toward the gap while the warm air finds it (guide s7: 1.2 to 1.6 s, editorial ease)
    Loom.cam.frame(E, { x: 560, y: 200, w: 800, h: 500 }, tFind, 1.3, { margin: 60, maxScale: 1.25, cx: 960, cy: 500 });

    // ---- "the servers breathe it again": the intake of the two servers just below the gap goes warm
    rack.tintIntake(1, tBreathe, 1.2);

    // ---- the term settles on the curling stream: an underline label (the seed's flag would stand over the servers)
    const ap = rack.anchors, apex = [ap.leakEnd.x - 36, (ap.slotCenterY + ap.leakEnd.y) / 2];   // the outermost point of the curl
    const G = T.labelGeom(0, 0, "Recirculation", { as: "underline", role: "label" });
    const lx = apex[0] - 60 - G.tw / 2, ly = apex[1] - (G.h / 2 - 5.5);
    T.label(ctx, "label_recirculation", { x: lx, y: ly, text: "Recirculation", to: apex, tone: "accent2", as: "underline", role: "label", t: tTerm, parent: E.inner });
  },
});
