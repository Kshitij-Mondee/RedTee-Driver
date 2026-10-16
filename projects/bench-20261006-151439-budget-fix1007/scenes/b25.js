// @design desk_callback_resolution: returning to opening desk to resolve schedule tension with an on-time release and shared collaborative orientation
/*
 * Treatments considered:
 * 1. Treatment A (static scorecard): A static split card comparing delayed vs on-time metrics with green ticks.
 *    Rejected by animation gate: tells rather than shows narrative payoff in the world where friction happened,
 *    and violates the rule against green scoring.
 * 2. Treatment B (abstract metric progress): An abstract timeline bar filling to 100% with trust gauges.
 *    Rejected: invents numerical trust claims and detaches from the opening workplace desk context.
 * 3. Treatment C (CHOSEN callback tableau): Return to the exact opening-desk station, establishing the two-week
 *    time lapse with a calendar leaf, placing the revised release stamped "On time" in the saturated accent,
 *    showing Jordan and the colleague in an open, settled collaborative orientation toward the work, and linking
 *    the deliverable into the resolved schedule.
 */

Loom.scene("b25", {
  build(ctx) {
    const { kit, m } = ctx;

    // @form desk_plane: callback desk surface matching opening geometry
    const desk = ctx.el("desk", { x: 420, y: 640, w: 1080, h: 260, kind: "scenery", exit: "recede" });
    kit.rect(desk.inner, 0, 0, 1080, 260, { fill: "surface2", r: 16 });
    kit.line(desk.inner, 0, 18, 1080, 18, { stroke: "line", sw: 3 });
    m.settle(desk, ctx.speechStart);

    // @form elapsed_time_leaf: calendar leaf establishing elapsed time
    const leaf = ctx.el("elapsed_time_leaf", { x: 740, y: 90, w: 470, h: 100, kind: "card", exit: "recede" });
    kit.rect(leaf.inner, 0, 0, 470, 100, { fill: "surface", r: 12, stroke: "line" });
    kit.rect(leaf.inner, 0, 0, 470, 20, { fill: "surface2", r: 6 });
    kit.disc(leaf.inner, 60, 10, 4, { fill: "muted" });
    kit.disc(leaf.inner, 410, 10, 4, { fill: "muted" });
    const leafText = "Two weeks later";
    kit.fit(leafText, { role: "lead", w: 410, maxLines: 1 });
    kit.text(leaf.inner, leafText, { role: "lead", x: 20, y: 26, w: 430, h: 64, align: "center", valign: "middle", color: "ink" });
    m.reveal(leaf, ctx.cue("Two weeks later"), { dy: -12 });

    // @form on_time_release: deliverable document receiving on-time stamp
    const release = ctx.el("on_time_release", { x: 830, y: 560, w: 320, h: 200, kind: "card", exit: "recede" });
    kit.rect(release.inner, 0, 0, 320, 200, { fill: "surface", r: 10, stroke: "line" });
    const headerFit = kit.fit("Revised release", { role: "label", w: 280, maxLines: 1 });
    kit.text(release.inner, "Revised release", { role: "label", x: 20, y: 16, w: 280, h: 32, color: "muted" });
    kit.line(release.inner, 20, 58, 220, 58, { stroke: "line", sw: 2 });
    kit.line(release.inner, 20, 72, 180, 72, { stroke: "line", sw: 2 });
    m.settle(release, ctx.speechStart + 0.05);

    // Stamp box inside the release document (saturated accent only on accent_on)
    const stamp = Loom.svg("g", { transform: "translate(40, 96)" }, release.inner);
    kit.rect(stamp, 0, 0, 240, 76, { fill: "surface", stroke: "accent", r: 8, sw: 4 });
    const stampText = "On time";
    kit.fit(stampText, { role: "lead", w: 220, maxLines: 1 });
    kit.text(stamp, stampText, { role: "lead", x: 0, y: 0, w: 240, h: 76, align: "center", valign: "middle", color: "accent", weight: 800 });

    const tRelease = ctx.cue("the revised release arrives on time");
    Loom.tween(stamp, { opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1, duration: 0.28, ease: Loom.ease.enter }, tRelease, { kind: "stamp", beat: ctx.beat.id, content: true });
    m.emphasis(release, tRelease);

    // @form resolved_schedule: resolved schedule timeline with milestone blocks
    const sched = ctx.el("resolved_schedule", { x: 1180, y: 180, w: 400, h: 240, kind: "card", exit: "recede" });
    kit.rect(sched.inner, 0, 0, 400, 240, { fill: "surface", r: 12, stroke: "line" });
    kit.fit("Schedule", { role: "label", w: 360, maxLines: 1 });
    kit.text(sched.inner, "Schedule", { role: "label", x: 20, y: 16, w: 360, h: 32, color: "muted" });

    kit.rect(sched.inner, 20, 60, 200, 36, { fill: "surface2", r: 6 });
    kit.fit("Actions", { role: "caption", w: 180, maxLines: 1 });
    kit.text(sched.inner, "Actions", { role: "caption", x: 30, y: 64, w: 180, h: 28, color: "muted" });

    kit.rect(sched.inner, 100, 110, 240, 36, { fill: "surface2", r: 6 });
    kit.fit("Solutions", { role: "caption", w: 220, maxLines: 1 });
    kit.text(sched.inner, "Solutions", { role: "caption", x: 110, y: 114, w: 220, h: 28, color: "muted" });
    m.settle(sched, ctx.speechStart + 0.1);

    // @form schedule_link: connector linking deliverable into resolved schedule
    const link = ctx.el("schedule_link", { x: 990, y: 320, w: 270, h: 250, kind: "connector", exit: "recede" });
    const conn = kit.arrow(link.inner, 0, 240, 250, 20, { stroke: "line", sw: 3 });
    m.draw(conn, ctx.cue("You focused on actions and solutions"), { dur: 0.6 });

    // Adult rigs in collaborative alignment
    const colleague = ctx.character("colleague", "ava", {
      x: 630,
      y: 900,
      scale: 0.9,
      flip: false,
      pose: "idle",
      emotion: "focused",
    });

    const jordan = ctx.character("Jordan", "sam", {
      x: 1375,
      y: 900,
      scale: 0.9,
      flip: true,
      pose: "idle",
      emotion: "focused",
    });

    const tRelationship = ctx.cue("The working relationship remains completely intact");
    jordan.look(-0.4, 0.3, tRelationship);
    jordan.emotion("neutral", tRelationship);
    colleague.look(0.4, 0.3, tRelationship);
    colleague.emotion("neutral", tRelationship);

    // Focal hold through final phrase
    const tHold = ctx.cue("Results improved while trust deepened");
    void tHold;
    void headerFit;
  },
});
