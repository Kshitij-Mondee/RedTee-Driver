// @design same_scene_resolved: the hook's table returns, the noise leaves, and what remains is a written decision and a ticked box
/* Treatments: (A) static finished table (rejected: no change visible); (B) new table slides in (rejected: not the SAME table);
 * (C) CHOSEN: hold the table, the envelope and bubbles fade, the people turn happy, two lines are written on the table
 * front, then the Close box is ticked in green, the film's only green. */
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const writeDur = (s) => DRAW * clamp(String(s).length / 14, 0.45, 1.8);

    const tSame = ctx.cue("Same team, same hour");   // people turn happy 0.8 s later
    const tDec = ctx.cue("decisions, owners and dates");
    const tSent = ctx.cue("read back and sent");

    // ---- held: the checklist and the table (never redrawn)
    const steps = ctx.held("steps");
    const table = ctx.held("table");
    const team = Loom.lesson.team_table(ctx, table.inner, { name: "team", held: true });

    // ---- 1. "Same team, same hour": the envelope, its note and the bubbles leave; the people turn happy
    ["email", "sent_today", "bubbles"].forEach((n, i) => m.exit(ctx.held(n), tSame + 0.1 + i * 0.1));
    [0, 1, 2, 3].forEach((i) => team.emotion(i, "happy", tSame + 0.8 + i * 0.12));

    // ---- 2. "decisions, owners and dates": two written lines on the table front
    const fb = team.frontBox;
    const list = ctx.el("decision_list", { x: fb.x, y: fb.y, w: fb.w, h: fb.h, kind: "text", exit: "wipe", parent: table.inner });
    const LINES = ["Pilot ships in June, Priya, by Friday", "Parked: side topic, Lena"];
    LINES.forEach((s, i) => {
      const L = ctx.el("decision_list_line_" + i, { x: 0, y: i * 60, w: fb.w, h: 56, kind: "text", exit: "wipe", parent: list.inner });
      kit.text(L.inner, s, { role: "body", x: 0, y: 0, w: fb.w, h: 56, maxLines: 1, valign: "middle", align: "center", color: "ink" });
      m.unmask(L, tDec + i * 1.0, { dur: writeDur(s) });
    });

    // ---- 3. "read back and sent": the Close box ticked in green (pos), the only green of the film
    // ticked in ink, the same hand tick as the Before and During rows (step_list's own tick)
    steps.handle.tick(2, tSent, { tone: "ink" });
  },
});
