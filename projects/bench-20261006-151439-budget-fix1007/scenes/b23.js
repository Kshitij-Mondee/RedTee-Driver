// @design blocked_dependencies_into_shared_focus: undisclosed dependencies enter the shared work frame as physical blocker tokens so participants resolve them collaboratively

/*
 * Treatments considered for b23:
 * 1. Static composition with callouts: Present the constraint frame, three approval papers,
 *    and shared goal statically with directional arrows. Rejected because static layouts fail
 *    the animation gate by showing disclosure as an existing state rather than an active transition.
 * 2. Full-room redraw with character dialogue: Redraw Jordan and the colleague at the meeting table
 *    with dialogue bubbles and gestural arm rigs. Rejected because redrawing held room assets
 *    breaks station continuity and hand-drawn limb gestures violate illustrated pack guidelines.
 * 3. CHOSEN: Dynamic process hold on the held meeting table. The constraint frame defines the
 *    active workspace on "ask what constraints emerged". Three individual vendor approval tokens
 *    unmask simultaneously as blocked papers on "three vendor approvals were stuck". They shift
 *    forward together on "collaborative problem solving", the held cast orients toward them on
 *    "Can we solve this together", and the shared goal card settles with an underline on
 *    "Shared goals". Motion conveys the transition from hidden blocker to shared alignment.
 */

Loom.scene("b23", {
  build(ctx) {
    const { kit, m } = ctx;

    // Continuity: reference held elements from preceding beat on meeting_table
    const heldTable = ctx.held("meeting_table");
    const heldCast = ctx.held("cast");
    const heldJordan = ctx.held("jordan") || ctx.held("cast_jordan");
    const heldColleague = ctx.held("colleague") || ctx.held("cast_colleague");
    void heldTable;

    // ---- 1. Scaffold: constraint frame becomes the active work region
    // @form constraint_frame: boundary defining active work area for disclosed constraints
    const frame = ctx.el("constraint_frame", {
      x: 1020,
      y: 200,
      w: 530,
      h: 320,
      kind: "scenery",
      exit: "recede",
    });
    kit.rect(frame.inner, 0, 0, 530, 320, {
      fill: "surface",
      r: 16,
      stroke: "line",
    });
    const fitKicker = kit.fit("Constraints", { role: "caption", w: 200, maxLines: 1 });
    kit.kicker(frame.inner, "Constraints", {
      x: 28,
      y: 22,
      w: 200,
      h: fitKicker.height,
      color: "muted",
    });
    const tFrame = ctx.cue("ask what constraints emerged");
    m.settle(frame, tFrame);
    m.emphasis(frame, tFrame + 0.2);

    // ---- 2. Content: cluster containing the three vendor approval tokens
    // @form vendor_approval_cluster: grouped container uniting three stuck vendor dependencies
    const cluster = ctx.el("vendor_approval_cluster", {
      x: 1040,
      y: 270,
      w: 490,
      h: 190,
      kind: "card",
      exit: "recede",
    });
    kit.rect(cluster.inner, 0, 0, 490, 190, {
      fill: "surface2",
      r: 12,
      stroke: "accent",
    });

    const tStuck = ctx.cue("three vendor approvals were stuck");
    m.unmask(cluster, tStuck, { dir: "ttb" });

    // Three individual approval tokens (data as objects)
    // @form vendor_approval_paper: individual paper token showing blocked vendor dependency
    const fitApp = kit.fit("Vendor approval", { role: "caption", w: 110, maxLines: 2 });

    const app1 = ctx.el("approval_1", {
      x: 1060,
      y: 300,
      w: 130,
      h: 140,
      kind: "card",
      exit: "recede",
    });
    kit.rect(app1.inner, 0, 0, 130, 140, { fill: "surface", r: 8, stroke: "line" });
    kit.icon(app1.inner, "file-text", { x: 49, y: 22, size: 32, color: "ink" });
    kit.text(app1.inner, "Vendor approval", {
      role: "caption",
      x: 10,
      y: 68,
      w: 110,
      h: fitApp.height,
      maxLines: 2,
      align: "center",
      valign: "middle",
      color: "ink",
    });
    m.unmask(app1, tStuck, { dir: "ttb" });

    const app2 = ctx.el("approval_2", {
      x: 1230,
      y: 300,
      w: 130,
      h: 140,
      kind: "card",
      exit: "recede",
    });
    kit.rect(app2.inner, 0, 0, 130, 140, { fill: "surface", r: 8, stroke: "line" });
    kit.icon(app2.inner, "file-text", { x: 49, y: 22, size: 32, color: "ink" });
    kit.text(app2.inner, "Vendor approval", {
      role: "caption",
      x: 10,
      y: 68,
      w: 110,
      h: fitApp.height,
      maxLines: 2,
      align: "center",
      valign: "middle",
      color: "ink",
    });
    m.unmask(app2, tStuck, { dir: "ttb" });

    const app3 = ctx.el("approval_3", {
      x: 1400,
      y: 300,
      w: 130,
      h: 140,
      kind: "card",
      exit: "recede",
    });
    kit.rect(app3.inner, 0, 0, 130, 140, { fill: "surface", r: 8, stroke: "line" });
    kit.icon(app3.inner, "file-text", { x: 49, y: 22, size: 32, color: "ink" });
    kit.text(app3.inner, "Vendor approval", {
      role: "caption",
      x: 10,
      y: 68,
      w: 110,
      h: fitApp.height,
      maxLines: 2,
      align: "center",
      valign: "middle",
      color: "ink",
    });
    m.unmask(app3, tStuck, { dir: "ttb" });

    // ---- 3. Shift to collaborative problem solving: carry papers into discussion region
    const tSolve = ctx.cue("collaborative problem solving");
    Loom.tween(cluster.inner, { y: 0 }, { y: 16, duration: 0.42, ease: Loom.ease.move }, tSolve, {
      kind: "travel",
      beat: ctx.beat.id,
      content: true,
    });
    Loom.tween(app1.inner, { y: 0 }, { y: 16, duration: 0.42, ease: Loom.ease.move }, tSolve, {
      kind: "travel",
      beat: ctx.beat.id,
      content: true,
    });
    Loom.tween(app2.inner, { y: 0 }, { y: 16, duration: 0.42, ease: Loom.ease.move }, tSolve + 0.04, {
      kind: "travel",
      beat: ctx.beat.id,
      content: true,
    });
    Loom.tween(app3.inner, { y: 0 }, { y: 16, duration: 0.42, ease: Loom.ease.move }, tSolve + 0.08, {
      kind: "travel",
      beat: ctx.beat.id,
      content: true,
    });

    // ---- 4. Cast orientation toward the shared work artifact
    const tTogether = ctx.cue("Can we solve this together");
    if (heldJordan && heldJordan.inner) {
      Loom.tween(heldJordan.inner, { rotate: 0 }, { rotate: 3, duration: 0.35, ease: Loom.ease.move }, tTogether, {
        kind: "turn",
        beat: ctx.beat.id,
        content: true,
      });
    }
    if (heldColleague && heldColleague.inner) {
      Loom.tween(heldColleague.inner, { rotate: 0 }, { rotate: -3, duration: 0.35, ease: Loom.ease.move }, tTogether, {
        kind: "turn",
        beat: ctx.beat.id,
        content: true,
      });
    }
    if (heldCast && heldCast.inner) {
      Loom.tween(heldCast.inner, { scale: 1 }, { scale: 1.02, duration: 0.35, ease: Loom.ease.move }, tTogether, {
        kind: "turn",
        beat: ctx.beat.id,
        content: true,
      });
    }

    // ---- 5. Shared goals banner settles and receives underline
    // @form shared_goal_panel: collaborative alignment card turning friction into mutual problem solving
    const sharedGoal = ctx.el("shared_goal", {
      x: 1090,
      y: 590,
      w: 400,
      h: 150,
      kind: "card",
      exit: "recede",
    });
    kit.rect(sharedGoal.inner, 0, 0, 400, 150, {
      fill: "surface",
      r: 14,
      stroke: "line",
    });
    kit.icon(sharedGoal.inner, "target", { x: 36, y: 44, size: 40, color: "accent3" });
    const fitGoal = kit.fit("Shared goals", { role: "lead", w: 270, maxLines: 1 });
    kit.text(sharedGoal.inner, "Shared goals", {
      role: "lead",
      x: 96,
      y: 38,
      w: 270,
      h: fitGoal.height,
      maxLines: 1,
      color: "ink",
      weight: 700,
    });
    const underline = kit.line(
      sharedGoal.inner,
      96,
      38 + fitGoal.height + 8,
      96 + fitGoal.width,
      38 + fitGoal.height + 8,
      { stroke: "accent3", sw: 5 }
    );

    const tGoal = ctx.cue("Shared goals");
    m.settle(sharedGoal, tGoal);
    m.draw(underline, tGoal + 0.15, { dur: 0.35 });
  },
});
