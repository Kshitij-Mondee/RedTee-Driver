// @design stepped_lateral_placement: travel a commitment anchor into a calendar leaf while the source holds
/* Treatments considered:
 * 1. Static composition with signalling: The habit card and next-week calendar slot sit side by side from the start, and an accent glow pulses on the next-week leaf when checkpoints are spoken. (Rejected: static composition fails the animation gate because motion is content; without visible stepped travel, the visual does not demonstrate relative-time placement as an active commitment).
 * 2. Continuous tween with bezier connector: The tab smoothly drifts across the space while drawing an elastic connecting curve into the calendar leaf. (Rejected: smooth continuous motion implies an unspoken continuous timeline or delivery duration, contradicting the habit rail device requirement for stepped-time relative calendar placement).
 * 3. CHOSEN: Stepped lateral placement with ink-drawn verification mark. The held habit stays firmly in place as an anchor reference. On cue "Agree on explicit follow-up checkpoints next week", the commitment tab steps laterally into the next-week calendar leaf using stepped time (D-114). On cue "replacement behaviours in practice", the calendar checkpoint receives an ink-drawn verification mark. This communicates relative-time placement without inventing calendar dates.
 */
Loom.scene("b14", {
  build(ctx) {
    const { kit, m } = ctx;

    // ---- Scenery and held continuity: planning surface and calendar row
    let base = ctx.held("planning_base");
    if (!base) {
      base = ctx.el("planning_base", { x: 120, y: 120, w: 1680, h: 800, kind: "scenery", exit: "none" });
      kit.rect(base.inner, 0, 0, 1680, 800, { fill: "surface", r: 16, stroke: "line" });
    }

    let calRow = ctx.held("calendar_row");
    if (!calRow) {
      calRow = ctx.el("calendar_row", { x: 160, y: 480, w: 1600, h: 410, kind: "scenery", exit: "none" });
      kit.rect(calRow.inner, 0, 0, 1600, 410, { fill: "surface2", r: 12, stroke: "line" });
    }

    let earlyFlag = ctx.held("early_flag");
    if (!earlyFlag) {
      earlyFlag = ctx.el("early_flag", { x: 220, y: 530, w: 200, h: 70, kind: "badge", exit: "none" });
      kit.pill(earlyFlag.inner, 0, 0, 200, 70, { fill: "field2" });
      kit.text(earlyFlag.inner, "Anchor", { role: "caption", x: 16, y: 16, w: 168, h: 38, maxLines: 1, align: "center", valign: "middle", color: "muted" });
    }

    // ---- 1. Reference: Held habit slip remains in place on the planning rail
    let habit = ctx.held("held_habit");
    if (!habit) {
      habit = ctx.el("held_habit", { x: 1030, y: 570, w: 270, h: 140, kind: "card", exit: "none" });
      kit.rect(habit.inner, 0, 0, 270, 140, { fill: "surface", r: 10, stroke: "line" });
      kit.kicker(habit.inner, "Agreed habit", { x: 16, y: 16, w: 238, h: 32, color: "ink" });
      kit.text(habit.inner, "Anchor", { role: "lead", x: 16, y: 56, w: 238, h: 56, maxLines: 1, color: "ink", weight: 700 });
    }

    // ---- 2. Incoming: Verification label above the calendar leaf
    // @form verification_label: section header tag for follow-up checkpoints
    const verifEl = ctx.el("verification_label", { x: 1290, y: 540, w: 430, h: 70, kind: "text", exit: "recede" });
    const fitVerif = kit.fit("Follow-up checkpoints", { role: "lead", w: 410, maxLines: 1 });
    kit.text(verifEl.inner, "Follow-up checkpoints", {
      role: "lead",
      x: 0,
      y: 12,
      w: 430,
      h: fitVerif.height || 46,
      maxLines: 1,
      color: "ink",
      weight: 700,
    });

    // ---- 3. Incoming: Next-week checkpoint calendar leaf (accent_on target)
    // @form next_week_checkpoint: calendar leaf card with accent header and verification slot
    const calLeaf = ctx.el("next_week_checkpoint", { x: 1290, y: 620, w: 430, h: 250, kind: "card", exit: "recede" });
    kit.rect(calLeaf.inner, 0, 0, 430, 250, { fill: "surface", r: 12, stroke: "line" });
    kit.rect(calLeaf.inner, 0, 0, 430, 60, { fill: "accent", r: 12 });
    kit.rect(calLeaf.inner, 0, 46, 430, 14, { fill: "accent" });
    kit.line(calLeaf.inner, 0, 60, 430, 60, { stroke: "line", sw: 3 });

    const fitNextWeek = kit.fit("Next week", { role: "lead", w: 380, maxLines: 1 });
    kit.text(calLeaf.inner, "Next week", {
      role: "lead",
      x: 24,
      y: 10,
      w: 380,
      h: fitNextWeek.height || 40,
      maxLines: 1,
      color: "surface",
      weight: 800,
    });

    kit.rect(calLeaf.inner, 24, 80, 382, 146, { fill: "surface2", r: 8, stroke: "line" });
    kit.text(calLeaf.inner, "Evaluate replacement behaviours", {
      role: "caption",
      x: 36,
      y: 92,
      w: 358,
      h: 26,
      maxLines: 1,
      color: "muted",
      weight: 600,
    });

    kit.rect(calLeaf.inner, 240, 136, 60, 60, { fill: "surface", r: 8, stroke: "line" });
    const tickPath = kit.path(calLeaf.inner, "M 252 168 L 266 182 L 288 150", {
      stroke: "ink",
      sw: 5,
      fill: "none",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });

    // ---- 4. Incoming: Commitment tab that travels from habit edge into calendar leaf
    // @form commitment_tab: stepped-time anchor slip traveling from habit to calendar leaf
    const tab = ctx.el("commitment_tab", { x: 1170, y: 610, w: 100, h: 80, kind: "card", exit: "recede" });
    kit.rect(tab.inner, 0, 0, 100, 80, { fill: "accent3", r: 8, stroke: "line" });
    kit.icon(tab.inner, "bookmark", { x: 30, y: 20, size: 40, color: "surface" });

    // Stepped time constraint (D-114) for hand-drawn discrete calendar placement
    if (Loom.stepped && Loom.stepped.on) {
      Loom.stepped.on(tab.mover, { hz: 6 });
    }

    // ---- Cues and Choreography
    const tCheckpoints = ctx.cue("Agree on explicit follow-up checkpoints next week");
    m.reveal(verifEl, tCheckpoints, { dy: -10 });
    m.settle(calLeaf, tCheckpoints);
    m.travel(tab, tCheckpoints + 0.15, { x: 1338, y: 746 });

    const tPractice = ctx.cue("replacement behaviours in practice");
    m.draw(tickPath, tPractice, { dur: 0.5 });
  },
});
