// @design light_past_the_closed_one: light travels along the path past the one grey thing and lights every other option in turn
// Treatments: (A) static lit row with signs only; (B) CHOSEN: the set brightens, the sign lifts, doors light one by one while the line draws past the grey door;
// (C) camera push along the path (rejected: next beat pans back to the desk).
Loom.scene("b10", {
  build(ctx) {
    const { m } = ctx;
    const T = ctx.start;
    const sv = (t, a, p) => Loom.svg(t, a, p);
    const op = (g, v) => g && g.setAttribute("opacity", v);

    // b09's handle is not carried on the held elements, so the kit's own layers are driven through their groups:
    // each switch is a pure function of timeline position (seekable both ways), like the kit's setState.
    const kids = (E) => Array.from(E.inner.children);
    const flip = (t, on, off) => Loom.drive((e) => { if (e >= 0.5) on(); else off(); }, t, 0.02, "linear");

    // the signs, the tag, the fork line and the near kerb stay on screen with their doors: take them so they do not recede at the join
    const HELD = {};
    ["path_line", "manager_sign", "other_sign", "hr_sign", "compliance_sign", "line_sign", "line_tag", "path_fork", "path_kerb"].forEach((n) => { HELD[n] = ctx.held(n); });

    // 1. the set brightens to day: wall and floor swap from the dim fills to the day fills
    // path_set and path_past are sisters of the held path_line under the kit's root: find them there
    const sib = (name) => { const par = HELD.path_line.outer.parentNode; const f = Array.from(par.children).find((c) => c.__E && c.__E.name === name); return f && f.__E; };
    const setK = kids(sib("path_set"));
    flip(T + 0.15,
      () => { op(setK[0], 1); op(setK[1], 0); op(setK[2], 1); op(setK[3], 0); },
      () => { op(setK[0], 0); op(setK[1], 1); op(setK[2], 0); op(setK[3], 1); });

    // 2. the hanging question sign lifts away on its hook
    Loom.hold.lift(ctx, ctx.held("question_sign"), T + 0.1, { dy: -190, dur: 0.7, fade: true });

    // 3. a door lights: closed/grey leaves, the ajar door and its warm spill come in (the sign stays ink; only the line is accent)
    // @form lit_door: a door ajar with warm honey light on the path
    const light = (key, t) => {
      const g = kids(ctx.held("door_" + key)); // spill, closed, grey, ajar
      flip(t,
        () => { op(g[0], 1); op(g[1], 0); op(g[2], 0); op(g[3], 1); },
        () => { op(g[0], 0); op(g[1], 0); op(g[2], 0); op(g[3], 0); });
    };

    // "Another door": the second door opens and the accent line redraws past the grey door
    const tOther = ctx.cue("Another door");
    // (the held door's own state before our time is read from its groups at build: keep whatever b09 left)
    light("other", tOther);
    const past = sib("path_past");
    const pg = kids(past)[0];
    flip(tOther, () => op(pg, 1), () => op(pg, 0));
    m.draw(past, tOther, { dur: 1.7 });

    // the rest light up on their words
    light("hr", ctx.cue("HR"));
    light("compliance", ctx.cue("compliance"));
    light("line", ctx.cue("speak-up line"));
  },
});
