// @design timeline_scaffold: an axis of order is drawn first, markers pop as the stroke passes them, then empty dashed frames print above for the views to come
/* b11 - "Step two, you rebuild the night in order, as each person saw it then."
 * The empty timeline board that b12 fills and b13 argues against.
 *
 * Treatments considered:
 *  (A) static composition + signalling: the whole board printed at once (rejected: the ORDER of
 *      events is the claim, and a board that appears whole asserts no order at all);
 *  (B) a row of three cards sliding in left to right (rejected: cards with no axis are a list, not a
 *      night; the spine has to exist first - lnd-motion-fit s9.3, timeline);
 *  (C) CHOSEN: the spine is drawn left to right across the narrated phrase "rebuild the night in
 *      order"; each moment marker pops at the instant the stroke's head passes its x (timed from the
 *      draw itself, by inverting the draw's easing); only then do the three empty "as they saw it"
 *      screens print top-down above them. Quiet frame first: the ground rule keeps its place as a
 *      slim header, and the step tag drops onto it.
 *
 * Continuity: b12 and b13 hold rule_header, step_tag, spine, markers, frames, caption. Everything
 * that must survive is inside those six elements (no other element names are created), and the
 * frames are left EMPTY inside (a plain pale plate, dashed outline, eye badge) for b12's screens.
 * Free space kept for b13: top-right (x 1400-1760, y 200-360) and the right end of the spine.
 */
Loom.scene("b11", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const bid = ctx.beat.id;

    // ---- geometry (station coords, 1920 x 1080)
    const SPINE_Y = 640;
    const SPINE_X0 = 250, SPINE_X1 = 1720;            // stroke start (right of the moon) and arrow tip
    const MARK_X = [520, 960, 1400];
    const FRAME_W = 300, FRAME_H = 200, FRAME_Y = 380;

    // ---- cues (only words the narrator actually says in this beat)
    const tStep = ctx.cue("Step two");
    const tTwo = ctx.cue("two");
    const tRebuild = ctx.cue("rebuild the night");
    const tOrder = ctx.cue("in order");
    const tAs = ctx.cue("as each");
    const tPerson = ctx.cue("person");

    // small deterministic hand-wobble helpers (seeded, so every render is identical)
    const f1 = (v) => v.toFixed(1);
    function smoothPath(pts) {                         // Catmull-Rom through pts -> cubic bezier path
      let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
      }
      return d;
    }
    function wobbleRect(x, y, w, h, r, rng, j) {
      const q = () => (rng() - 0.5) * 2 * j;
      return `M${f1(x + r + q())} ${f1(y + q())} L${f1(x + w - r + q())} ${f1(y + q())} Q${f1(x + w + q())} ${f1(y + q())} ${f1(x + w + q())} ${f1(y + r + q())}` +
        ` L${f1(x + w + q())} ${f1(y + h - r + q())} Q${f1(x + w + q())} ${f1(y + h + q())} ${f1(x + w - r + q())} ${f1(y + h + q())}` +
        ` L${f1(x + r + q())} ${f1(y + h + q())} Q${f1(x + q())} ${f1(y + h + q())} ${f1(x + q())} ${f1(y + h - r + q())}` +
        ` L${f1(x + q())} ${f1(y + r + q())} Q${f1(x + q())} ${f1(y + q())} ${f1(x + r + q())} ${f1(y + q())} Z`;
    }

    // =====================================================================================
    // 1. FRAME: the ground rule stays visible as a slim header; the step tag drops onto it.
    // =====================================================================================
    // @form header_bar: a slim outlined bar holding a standing rule as a persistent header
    const hdr = ctx.el("rule_header", { x: 160, y: 96, w: 1600, h: 70, kind: "text", exit: "wipe" });
    kit.rect(hdr.inner, 0, 0, 1600, 70, { fill: "field2", stroke: "muted", r: 14 });
    kit.text(hdr.inner, "To learn and fix the system, not to blame", { role: "label", x: 0, y: 0, w: 1600, h: 70, maxLines: 1, align: "center", valign: "middle", color: "muted" });
    m.reveal(hdr, tStep, { dy: 10 });

    const tag = ctx.el("step_tag", { x: 160, y: 196, w: 420, h: 48, kind: "text", exit: "recede" });
    kit.kicker(tag.inner, "Step two", { x: 0, y: 0, w: 420, h: 48 });
    m.drop(tag, tTwo);

    // =====================================================================================
    // 2. SPINE (scaffold): the stroke IS the order of events. Drawn left to right across the
    //    phrase "rebuild the night in order"; the moon pops as the stroke starts.
    // =====================================================================================
    // @form timeline_spine: a hand-wobbled arrow line drawn left to right as an axis of order
    const spine = ctx.el("spine", { x: 160, y: SPINE_Y - 50, w: 1600, h: 100, kind: "connector", exit: "recede" });
    const lx = (x) => x - 160, ly = SPINE_Y - (SPINE_Y - 50);   // station x -> element-local x; spine centre y -> 50
    const rngS = Loom.rng("b11:spine");
    const pts = [];
    const nSeg = 8;
    for (let i = 0; i <= nSeg; i++) {
      const x = SPINE_X0 + ((SPINE_X1 - 24 - SPINE_X0) * i) / nSeg;
      pts.push([lx(x), ly + (i === 0 || i === nSeg ? 0 : (rngS() - 0.5) * 5)]);
    }
    const line = kit.path(spine.inner, smoothPath(pts), { stroke: "ink", sw: 5 });
    const LEN = line.getTotalLength() || 1;
    line.setAttribute("stroke-dasharray", `${LEN} ${LEN * 2}`);
    line.setAttribute("stroke-dashoffset", LEN);

    // arrowhead: an open chevron at the right tip, drawn as the stroke's head arrives
    const tipX = lx(SPINE_X1);
    const chev = kit.path(spine.inner, `M${f1(tipX - 30)} ${ly - 20} L${f1(tipX)} ${ly + 1} L${f1(tipX - 28)} ${ly + 22}`, { stroke: "ink", sw: 5 });
    const CLEN = chev.getTotalLength() || 1;
    chev.setAttribute("stroke-dasharray", `${CLEN} ${CLEN * 2}`);
    chev.setAttribute("stroke-dashoffset", CLEN);
    chev.setAttribute("opacity", 0);

    // the moon at the left end (the night begins here)
    const moon = Loom.svg("g", {}, spine.inner);
    kit.icon(moon, "moon", { x: lx(200), y: ly, size: 76, color: "ink" });
    m.pop(moon, tRebuild);

    // draw timing: starts just after the moon lands, lands its arrow with the phrase "in order"
    const easeD = Loom.bezier(0.35, 0.0, 0.5, 1);
    const tDraw0 = tRebuild + 0.14;
    const tDraw1 = tOrder + 0.5;
    const dDraw = tDraw1 - tDraw0;
    Loom.drive((e) => {
      line.setAttribute("stroke-dashoffset", (LEN * (1 - e)).toFixed(2));
      const c = Math.max(0, Math.min(1, (e - 0.94) / 0.06));
      chev.setAttribute("opacity", c > 0.001 ? 1 : 0);
      chev.setAttribute("stroke-dashoffset", (CLEN * (1 - c)).toFixed(2));
    }, tDraw0, dDraw, easeD, { kind: "draw", beat: bid, name: "spine", content: true });
    spine.revealT = tRebuild; spine.revealKind = "draw";

    // the time at which the stroke's head reaches station-x (inverts the draw's own easing)
    const headAt = (x) => {
      const frac = Math.max(0, Math.min(1, (x - SPINE_X0) / (SPINE_X1 - 24 - SPINE_X0)));
      let lo = 0, hi = 1;
      for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (easeD(mid) < frac) lo = mid; else hi = mid; }
      return tDraw0 + ((lo + hi) / 2) * dDraw;
    };

    // =====================================================================================
    // 3. MARKERS (peers, one element): each tick pops the moment the stroke's head passes it.
    // =====================================================================================
    // @form timeline_marker: a tick with a disc marking one moment, popping as the spine passes
    const mk = ctx.el("markers", { x: 490, y: SPINE_Y - 40, w: 940, h: 80, kind: "node", exit: "recede" });
    MARK_X.forEach((x, i) => {
      const g = Loom.svg("g", {}, mk.inner);
      const cx = x - 490, cy = 40;
      kit.line(g, cx, cy - 24, cx, cy + 24, { stroke: "ink", sw: 4 });
      kit.disc(g, cx, cy, 17, { fill: "accent2" });
      m.pop(g, headAt(x) - 0.02, { overshoot: false, dur: 0.32 });
    });
    mk.revealT = headAt(MARK_X[0]) - 0.02; mk.revealKind = "pop";

    // =====================================================================================
    // 4. FRAMES (container, left EMPTY for b12): three small-screen outlines, one per moment,
    //    unmasked top-down, left to right, 0.12 s apart, with an eye badge (what they SAW).
    // =====================================================================================
    const FX = MARK_X.map((x) => x - FRAME_W / 2);        // 370, 810, 1250
    // @form empty_frame: an empty dashed frame waiting for content
    const frames = ctx.el("frames", { x: FX[0], y: FRAME_Y, w: FX[2] + FRAME_W - FX[0], h: 250, kind: "card", exit: "displace" });
    const defs = Loom.svg("defs", {}, frames.inner);
    FX.forEach((fx, i) => {
      const x0 = fx - FX[0];
      const g = Loom.svg("g", {}, frames.inner);
      const rngF = Loom.rng("b11:frame:" + i);
      // pale plate + dashed muted outline (empty inside)
      kit.rect(g, x0, 0, FRAME_W, FRAME_H, { fill: "surface", r: 14, crisp: true });
      const outline = kit.path(g, wobbleRect(x0, 0, FRAME_W, FRAME_H, 14, rngF, 1.6), { stroke: "muted", sw: 3, dash: "14 10" });
      void outline;
      // a dashed leader down to its moment (the marker already exists, so this draws INTO it)
      kit.line(g, x0 + FRAME_W / 2, FRAME_H + 4, x0 + FRAME_W / 2, 236, { stroke: "muted", sw: 3, dash: "6 8", crisp: true });
      // the eye badge on the top-left corner
      kit.disc(g, x0 + 6, 6, 25, { fill: "surface" });
      kit.icon(g, "eye", { x: x0 + 6, y: 6, size: 34, color: "ink" });

      // per-frame unmask (top-down): a clip that opens from the top
      const id = Loom.uid("clip");
      const cp = Loom.svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, defs);
      const box = { x: x0 - 30, y: -30, w: FRAME_W + 60, h: 290 };
      const r = Loom.svg("rect", { x: box.x, y: box.y, width: box.w, height: box.h }, cp);
      g.setAttribute("clip-path", `url(#${id})`);
      Loom.tween(r, { attr: { height: 0 } }, { attr: { height: box.h }, duration: S.dur("enter") * 1.5, ease: Loom.ease.move },
        tAs + i * 0.12, { kind: "unmask", beat: bid, name: "frames", content: false });
    });
    frames.revealT = tAs; frames.revealKind = "unmask";

    // =====================================================================================
    // 5. CAPTION: names what the frames are for, settling once the frames are printing.
    // =====================================================================================
    const cap = ctx.el("caption", { x: 160, y: 760, w: 1600, h: 60, kind: "text", exit: "sink" });
    kit.text(cap.inner, "as they saw it then", { role: "label", x: 0, y: 0, w: 1600, h: 60, maxLines: 1, align: "center", valign: "middle", color: "muted" });
    m.settle(cap, tPerson, { dy: 16 });
  },
});
