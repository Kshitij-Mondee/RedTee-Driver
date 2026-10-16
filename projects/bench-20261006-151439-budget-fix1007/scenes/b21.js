// @design shared_table_setup: establish two participants across a work table with central document and sequential scaffold
/* Treatments considered:
 * 1. Animated seating entry: Characters walk in and sit down at the table.
 *    Rejected: The beat spec explicitly notes "settled at cut, no invented seated-pose animation",
 *    and the asset note forbids unverified anatomical gestures.
 * 2. Static full overview: Table, schedule, and all four moves visible from frame 0 with static arrows.
 *    Rejected: Fails progressive staging; narration introduces the meeting context, the delayed
 *    schedule, and the four moves sequentially.
 * 3. CHOSEN: Staged neutral-rig seating tableau. Jordan and the colleague are established in
 *    settled neutral postures at the table at the cut. The delayed schedule paper settles into the
 *    shared centre on cue with saturated accent styling. The four unlabelled conversation slots
 *    unmask across the lower table rail on cue, establishing the scaffold without premature labelling.
 */
Loom.scene("b21", {
  build(ctx, props) {
    const { kit, m } = ctx;

    const tSit = ctx.cue("You sit down with Jordan");
    const tTable = ctx.cue("across a shared meeting table");
    const tSchedule = ctx.cue("The project onboarding schedule is delayed again");
    const tMoves = ctx.cue("Step through the four moves");

    // 1. Shared meeting table surface
    // @form meeting_table_surface: shared wooden work surface spanning the meeting area
    const table = ctx.el("meeting_table", {
      x: 220,
      y: 430,
      w: 1480,
      h: 470,
      kind: "scenery",
      exit: "recede",
    });
    kit.rect(table.inner, 0, 0, 1480, 470, {
      fill: "surface2",
      r: 16,
      stroke: "line",
      sw: 4,
    });
    kit.line(table.inner, 30, 20, 1450, 20, { stroke: "shadow", sw: 2 });
    m.settle(table, ctx.start, { dy: 0, dur: 0.01 });

    // 2. Colleague: seated neutral rig on left side of table
    // @form colleague_rig: seated adult dialogue partner
    const colleague = ctx.el("colleague", {
      x: 300,
      y: 270,
      w: 310,
      h: 420,
      kind: "character",
      exit: "recede",
    });
    kit.peep(colleague.inner, "man", "neutral", {
      x: -25,
      y: 20,
      size: 360,
      flip: false,
      cloth: "surface2",
      skin: 0,
    });
    m.settle(colleague, tSit, { dy: 8 });

    // 3. Jordan: seated neutral rig on right side of table, facing inward
    // @form jordan_rig: seated adult dialogue partner facing inward
    const jordan = ctx.el("Jordan", {
      x: 1260,
      y: 270,
      w: 310,
      h: 420,
      kind: "character",
      exit: "recede",
    });
    kit.peep(jordan.inner, "woman", "neutral", {
      x: -25,
      y: 20,
      size: 360,
      flip: true,
      cloth: "muted",
      skin: 1,
    });
    m.settle(jordan, tSit + 0.04, { dy: 8 });

    // 4. Blank habit and calendar planning region beside the schedule
    // @form habit_calendar_scaffold: blank planning surface for habit and calendar checkpoints
    const habitRegion = ctx.el("habit_calendar_region", {
      x: 960,
      y: 460,
      w: 270,
      h: 260,
      kind: "scenery",
      exit: "recede",
    });
    kit.rect(habitRegion.inner, 0, 0, 270, 260, {
      fill: "surface",
      r: 10,
      stroke: "line",
      sw: 2,
    });
    kit.rect(habitRegion.inner, 16, 16, 238, 48, { fill: "surface2", r: 6 });
    kit.line(habitRegion.inner, 26, 40, 244, 40, { stroke: "muted", sw: 2 });
    kit.rect(habitRegion.inner, 16, 80, 238, 160, {
      fill: "field2",
      r: 8,
      stroke: "shadow",
      sw: 1,
    });
    for (let r = 0; r < 3; r++) {
      kit.line(habitRegion.inner, 30, 116 + r * 40, 240, 116 + r * 40, {
        stroke: "surface2",
        sw: 2,
      });
    }
    m.settle(habitRegion, tTable, { dy: 10 });

    // 5. Onboarding schedule: central paper document settling into the shared centre
    // @form onboarding_schedule_doc: delayed deliverable timeline document
    const schedule = ctx.el("onboarding_schedule", {
      x: 470,
      y: 460,
      w: 460,
      h: 260,
      kind: "card",
      exit: "recede",
    });
    kit.rect(schedule.inner, 0, 0, 460, 260, {
      fill: "surface",
      r: 10,
      stroke: "accent",
      sw: 4,
    });
    kit.rect(schedule.inner, 0, 0, 460, 58, { fill: "accent", r: 10 });

    const schedLabel = "Onboarding schedule";
    kit.fit(schedLabel, { role: "lead", w: 420, maxLines: 1 });
    kit.text(schedule.inner, schedLabel, {
      role: "lead",
      x: 20,
      y: 8,
      w: 420,
      h: 42,
      maxLines: 1,
      align: "center",
      valign: "middle",
      weight: 700,
      color: "surface",
    });

    // Milestone progress tracks showing delayed schedule state
    const barData = [
      { y: 78, w: 220, delayed: true },
      { y: 130, w: 290, delayed: true },
      { y: 182, w: 170, delayed: false },
    ];
    barData.forEach((b) => {
      kit.rect(schedule.inner, 24, b.y, 412, 34, { fill: "surface2", r: 6 });
      kit.rect(schedule.inner, 24, b.y, b.w, 34, {
        fill: b.delayed ? "accent" : "muted",
        r: 6,
      });
    });
    kit.icon(schedule.inner, "calendar-clock", {
      x: 396,
      y: 12,
      size: 32,
      color: "surface",
    });

    m.settle(schedule, tSchedule, { dy: 20 });
    m.emphasis(schedule, tSchedule + 0.4);

    // 6. Conversation slots: four unlabelled shallow rail slots as physical scaffold
    // @form conversation_slots_rail: four physical planning slots unmasked across the rail
    const slotsRail = ctx.el("conversation_slots", {
      x: 470,
      y: 770,
      w: 1160,
      h: 100,
      kind: "row",
      exit: "recede",
    });
    kit.rect(slotsRail.inner, 0, 0, 1160, 100, {
      fill: "surface2",
      r: 10,
      stroke: "line",
      sw: 3,
    });

    const slotCount = 4;
    const slotGap = 20;
    const slotPad = 20;
    const totalW = 1160 - 2 * slotPad;
    const slotW = (totalW - (slotCount - 1) * slotGap) / slotCount;
    for (let i = 0; i < slotCount; i++) {
      const sx = slotPad + i * (slotW + slotGap);
      kit.rect(slotsRail.inner, sx, 16, slotW, 68, {
        fill: "surface",
        r: 8,
        stroke: "line",
        sw: 2,
      });
      kit.line(slotsRail.inner, sx + 20, 50, sx + slotW - 20, 50, {
        stroke: "muted",
        sw: 2,
        dash: "4 4",
      });
    }

    m.unmask(slotsRail, tMoves, { dir: "ltr" });
  },
});
