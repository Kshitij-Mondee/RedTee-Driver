// @design tempting_cause_retracted: one tempting cause is drawn as an arrow into an outcome, judged too thin, then un-drawn, leaving dashed question slots where the real causes will land
/* b19 - "Stop at the engineer": the start of the system diagram. The failed checkout sits at the
 * centre, the engineer to its left, and one tempting arrow between them labelled "human error".
 * The arrow is drawn, found wanting, then retracted; three dashed question marks are left behind
 * where the real causes will land.
 * Treatments considered:
 *  (A) static card with "human error" crossed out (rejected: strikes the words, but does not show
 *      what a single arrow leaves out),
 *  (B) the arrow turns red and is stamped "insufficient" (rejected: hands down a verdict, and the
 *      argument here is the erasure itself),
 *  (C) CHOSEN: draw the arrow from the checkout into the engineer, dim it, then un-draw it back to
 *      its source while the engineer sinks; the emptiness that remains is filled by the probes.
 *      Motion is content: removing the arrow on screen IS the refutation.
 * Elements (all on st_system):
 *   failed_checkout  x 810, y 390, 300 x 260   (kept by b20; centre 960,520; left edge 810)
 *   engineer         x 220, y 380, 280 x 340   (frame 280 x 280 at the top, label beneath)
 *   blame_arrow      x 500, y 380, 310 x 200   (arrow at local y 140 = station y 520)
 *   note             x 515, y 690, 280 x 64
 *   probes           x 0,   y 0,   1920 x 1080 (kept by b20; three child groups, drawn in STATION
 *                    coordinates, in order: (430,250), (430,770), (1540,520); ring r 48)
 */
Loom.scene("b19", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const beat = ctx.beat.id;

    // ---- timing: every reveal rides a spoken word
    const tStop = ctx.cue("Stop at the engineer");
    const tEng = ctx.cue("the engineer");
    const tErr = ctx.cue("human error");
    const tLittle = ctx.cue("explains little");
    const tKeep = ctx.cue("Keep asking");
    const tCond = ctx.cue("conditions appear");

    const meta = (E, kind) => ({ kind, beat, name: E.name, content: true });
    const label = (parent, str, o) => kit.text(parent, str, Object.assign({ role: "label", maxLines: 1, align: "center", valign: "middle" }, o));

    // ---- geometry (station coordinates)
    const CK = { x: 810, y: 390, w: 300, h: 260 };            // failed checkout, centre (960,520)
    const EN = { x: 220, y: 380, w: 280, h: 340, frame: 280 };  // engineer
    const AR = { x: 500, y: 380, w: 310, h: 200 };            // blame arrow element
    const AY = 140;                                            // arrow row, local (= station y 520)
    const ARROW_FROM = CK.x - AR.x - 6;                         // checkout's left edge, 6 px clear (local x 304)
    const ARROW_TO = 8;                                         // engineer's right edge is at local x 0

    // =====================================================================================
    // blame_arrow: created first so it paints UNDER the two nodes (paint order is not reveal order)
    // =====================================================================================
    // @form arrow_into_target: an arrow drawn from a source into a target, its head landing as the stroke arrives
    const arrow = ctx.el("blame_arrow", { x: AR.x, y: AR.y, w: AR.w, h: AR.h, kind: "connector", exit: "sink" });
    const dim = Loom.svg("g", {}, arrow.inner); // wrapper: the 40% dim lives here, never on the drawn nodes
    const a = kit.arrow(dim, ARROW_FROM, AY, ARROW_TO, AY, { stroke: "ink", sw: 8, head: 34 });
    const shaftLen = Math.hypot(ARROW_FROM - ARROW_TO, 0) - 34 * 0.6; // K.arrow stops the shaft short of the tip
    const HIDE = shaftLen + 8;                                          // offset that hides even the round cap
    a.path.setAttribute("stroke-dasharray", `${shaftLen} ${shaftLen + 40}`);

    const lab = Loom.svg("g", {}, arrow.inner); // label group, unmasked with the draw
    kit.text(lab, "human error", { role: "lead", x: 0, y: 30, w: AR.w, h: 80, maxLines: 1, align: "center", valign: "bottom", color: "ink" });
    const cid = Loom.uid("lbl");
    const cp = Loom.svg("clipPath", { id: cid, clipPathUnits: "userSpaceOnUse" }, arrow.outer);
    const clipR = Loom.svg("rect", { x: -8, y: 0, width: 0, height: AR.h }, cp);
    lab.setAttribute("clip-path", `url(#${cid})`);

    // =====================================================================================
    // failed_checkout: the node everything points at; it must exist before anything points at it
    // =====================================================================================
    // @form icon_label_card: a rounded card pairing an icon with a short label naming one item
    const ck = ctx.el("failed_checkout", { x: CK.x, y: CK.y, w: CK.w, h: CK.h, kind: "node", exit: "recede" });
    kit.rect(ck.inner, 0, 0, CK.w, CK.h, { fill: "surface", stroke: "neg" });
    kit.icon(ck.inner, "shopping-cart", { x: 138, y: 92, size: 124, color: "ink", stroke: 1.5 });
    label(ck.inner, "Checkout failed", { role: "lead", x: 10, y: 170, w: CK.w - 20, h: 70, color: "ink" });
    // @form outcome_tick: a tick or cross mark landing on an item to show its result
    const cross = Loom.svg("g", {}, ck.inner); // the failure mark lands a beat after the card has settled
    kit.mark(cross, "no", 232, 44, 64);
    m.settle(ck, tStop, { dy: 26 });
    m.pop(cross, tStop + 0.5, { overshoot: false, content: true });

    // =====================================================================================
    // engineer: small head-and-shoulders in a sketch frame, so the arrow meets an edge
    // =====================================================================================
    // @form framed_person_portrait: a sketch-framed person portrait with a name label beneath
    const en = ctx.el("engineer", { x: EN.x, y: EN.y, w: EN.w, h: EN.h, kind: "character", exit: "sink" });
    const enBody = Loom.svg("g", {}, en.inner); // wrapper: the sink lives here, so the engine's own exit cannot flash it back
    kit.rect(enBody, 0, 0, EN.frame, EN.frame, { fill: "surface2", stroke: "surface2" });
    kit.peep(enBody, "woman", "neutral", { x: EN.frame / 2, y: EN.frame / 2, size: EN.frame, cloth: "accent2" });
    kit.rect(enBody, 0, 0, EN.frame, EN.frame, { fill: "none", stroke: "ink" });
    label(enBody, "engineer", { x: 0, y: EN.frame + 12, w: EN.w, h: 48, color: "ink" });
    m.settle(en, tEng, { dy: 26 });

    // =====================================================================================
    // note: muted, under the arrow
    // =====================================================================================
    const note = ctx.el("note", { x: 515, y: 690, w: 280, h: 64, kind: "text", exit: "sink" });
    const noteBody = Loom.svg("g", {}, note.inner);
    kit.text(noteBody, "explains little", { role: "lead", x: 0, y: 0, w: 280, h: 64, maxLines: 1, align: "center", valign: "middle", color: "muted" });

    // =====================================================================================
    // probes: three dashed question marks, peers, one group (kept by b20)
    // =====================================================================================
    // @form unknown_ring: a dashed ring with a question mark marking something not yet known
    const probes = ctx.el("probes", { x: 0, y: 0, w: 1920, h: 1080, kind: "token", exit: "recede" });
    const PR = 48;
    const spots = [[430, 250], [430, 770], [1540, 520]];
    const probeGroups = spots.map(([cx, cy]) => {
      const g = Loom.svg("g", { class: "probe" }, probes.inner);
      const d = `M${cx - PR} ${cy} a${PR} ${PR} 0 1 0 ${2 * PR} 0 a${PR} ${PR} 0 1 0 ${-2 * PR} 0`;
      kit.path(g, d, { stroke: "muted", sw: 4, dash: "10 12" });
      kit.text(g, "?", { role: "title", x: cx - 50, y: cy - 50, w: 100, h: 100, maxLines: 1, align: "center", valign: "middle", size: 84, color: "accent2" });
      return g;
    });

    // =====================================================================================
    // the beat sheet, on the clock
    // =====================================================================================

    // 1. "human error": the arrow draws from the checkout INTO the engineer; the head lands as the stroke arrives
    const drawDur = ctx.style.dur("draw");
    const micro = ctx.style.dur("exit") * 0.4;   // the arrowhead's quick land / lift
    const dimDur = ctx.style.dur("move");
    arrow.revealT = tErr; arrow.revealKind = "draw";
    Loom.tween(a.path, { strokeDashoffset: HIDE, opacity: 1 }, { strokeDashoffset: 0, duration: drawDur, ease: Loom.ease.move }, tErr, meta(arrow, "draw"));
    Loom.tween(a.head, { opacity: 0 }, { opacity: 1, duration: micro, ease: Loom.ease.enter }, tErr + drawDur * 0.8, meta(arrow, "draw"));
    // its label unmasks with it (printed, left to right)
    const unmaskDur = ctx.style.dur("enter") * 1.5;
    Loom.tween(clipR, { attr: { width: 0 } }, { attr: { width: AR.w + 16 }, duration: unmaskDur, ease: Loom.ease.move }, tErr, meta(arrow, "unmask"));

    // 2. "explains little": the note settles; the arrow dims to 40% (on the wrapper, not the drawn nodes)
    m.settle(note, tLittle, { dy: 20 });
    Loom.tween(dim, { opacity: 1 }, { opacity: 0.4, duration: dimDur, ease: Loom.ease.move }, tLittle, meta(arrow, "dim"));
    Loom.tween(lab, { opacity: 1 }, { opacity: 0.6, duration: dimDur, ease: Loom.ease.move }, tLittle, meta(arrow, "dim"));

    // 3. "Keep asking": the arrow un-draws back to its source; the engineer and the note sink out
    const undoDur = ctx.style.dur("exit") * 2;
    Loom.tween(a.head, { opacity: 1 }, { opacity: 0, duration: micro, ease: Loom.ease.exit }, tKeep, meta(arrow, "undo"));
    Loom.tween(a.path, { strokeDashoffset: 0, opacity: 1 }, { strokeDashoffset: HIDE, duration: undoDur, ease: Loom.ease.editorial }, tKeep + 0.04, meta(arrow, "undo"));
    // the label is erased toward the source too (left edge sweeps right), never a bare fade
    Loom.tween(clipR, { attr: { x: -8, width: AR.w + 16 } }, { attr: { x: AR.w + 8, width: 0 }, duration: undoDur * 0.8, ease: Loom.ease.exit }, tKeep, meta(arrow, "undo"));
    const sinkDur = ctx.style.dur("exit");
    Loom.tween(noteBody, { opacity: 1, y: 0 }, { opacity: 0, y: 40, duration: sinkDur, ease: Loom.ease.exit }, tKeep + 0.06, meta(note, "sink"));
    Loom.tween(enBody, { opacity: 1, y: 0 }, { opacity: 0, y: 40, duration: sinkDur, ease: Loom.ease.exit }, tKeep + 0.16, meta(en, "sink"));

    // 4. "conditions appear": the probes pop in as peers, tight stagger (no rank implied)
    probes.revealT = tCond; probes.revealKind = "pop";
    probeGroups.forEach((g, i) => m.pop(g, tCond + i * 0.07, { content: true }));
  },
});
