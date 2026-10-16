// @design held_overview_choice: a wide finished frame of many open doors, two numbered tags on the two places it could have stopped, a question left on dark field with a quiet draining bar
// Treatments considered: (1) static composition with tags only; (2) dolly out then tags wipe in, question and pause bar last (chosen: the pull back shows "many doors", the tags are the choice); (3) spotlight dims everything but the first door (rejected: hides the many doors).
Loom.scene("b09", {
  build(ctx, props) {
    const c = (t) => ctx.c(t);
    const kit = ctx.kit, m = ctx.m;
    const sv = (t, a, p) => Loom.svg(t, a, p);

    // ---- the hall (own elements: nothing to take from the previous beat on screen)
    const cam = ctx.el("hall_cam", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });

    // hall_set: back wall, floor, ceiling lines (a quiet perspective), drawn wider than the frame for the dolly
    const SET = ctx.el("hall_set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede", parent: cam.inner });
    {
      const g = SET.inner;
      sv("rect", { x: -400, y: -400, width: 2720, height: 1060, fill: c("field2") }, g);            // wall
      sv("rect", { x: -400, y: 640, width: 2720, height: 900, fill: c("field") }, g);                // floor
      sv("rect", { x: -400, y: 760, width: 2720, height: 4, fill: c("shadow"), opacity: 0.8 }, g);
      const vp = { x: 1780, y: 520 };
      for (let i = 0; i < 6; i++) {                                                                   // floor lines to the vanishing point
        const x0 = -400 + i * 560;
        sv("line", { x1: x0, y1: 1200, x2: vp.x, y2: vp.y, stroke: c("line"), "stroke-width": 2, opacity: 0.16 }, g);
      }
      sv("line", { x1: -400, y1: -300, x2: vp.x, y2: vp.y - 40, stroke: c("line"), "stroke-width": 2, opacity: 0.16 }, g);   // ceiling line
      sv("line", { x1: -400, y1: 700, x2: vp.x, y2: vp.y, stroke: c("line"), "stroke-width": 2, opacity: 0.2 }, g);          // skirting
    }

    // hall_doors: five open doors receding (the first is the login), the wedge of light of each on its own floor
    const rows = [
      { s: 0.8, x: 250, fy: 760, shade: 0 },
      { s: 0.625, x: 606, fy: 708, shade: 0.1 },
      { s: 0.5, x: 892, fy: 670, shade: 0.2 },
      { s: 0.4, x: 1128, fy: 640, shade: 0.3 },
      { s: 0.325, x: 1324, fy: 622, shade: 0.4 },
    ];
    const bx = 250, by = 315;
    const DR = ctx.el("hall_doors", { x: bx, y: by, w: 1204, h: 496, kind: "scenery", exit: "recede", parent: cam.inner });
    const doors = rows.map((r) => Loom.lesson.door(ctx, DR.inner, { x: r.x - bx, y: r.fy - 556 * r.s - by, scale: r.s, shade: r.shade, state: "cracked" }));
    const HV = ctx.el("heavy_door", { x: 1490, y: 445, w: 156, h: 186, kind: "scenery", exit: "recede", parent: cam.inner });
    Loom.lesson.door(ctx, HV.inner, { x: 0, y: 0, scale: 0.3, heavy: true, shade: 0.3, state: "cracked" });

    // dolly out: from a close frame on the first doors to the whole hall (on "many doors" it is on its way)
    const tMany = ctx.cue("many doors");
    Loom.cam.frame(cam, { x: 180, y: 250, w: 1200, h: 675 }, ctx.start, 0.05, { margin: 0 });
    Loom.cam.frame(cam, { x: 0, y: 0, w: 1920, h: 1080 }, tMany - 1.1, 2.6, { margin: 0 });

    // ---- tag 1 on the first door, lead to its lock
    const tLogin = ctx.cue("which habit");
    const mkTag = (name, x, y, text, fillTok, t) => {
      const f = kit.fit(text, { role: "body", w: 760, h: 60, maxLines: 1, weight: 700 });
      const w = Math.ceil(f.width) + 40, h = 60;
      const T = ctx.el(name, { x, y, w, h, kind: "card", exit: "wipe" });
      sv("rect", { x: 0, y: 0, width: w, height: h, rx: 6, fill: c(fillTok) }, T.inner);
      kit.text(T.inner, text, { role: "body", x: 20, y: 8, w: w - 40, h: 44, maxLines: 1, weight: 700, color: "onAccent" });
      m.unmask(T, t);
      return T;
    };
    const tag1 = mkTag("mark_login", 250, 835, "1  Leaked password at the login", "accent", tLogin);
    const lock1 = { x: 250 + doors[0].lockAt.x, y: by + (760 - 556 * 0.8 - by) + doors[0].lockAt.y };
    Loom.ui.wire(ctx, "lead_login", { x: lock1.x, y: 835 }, { x: lock1.x, y: lock1.y }, tLogin + 0.25, { tone: "accent" });

    // ---- tag 2 beside it, then the question and the quiet pause bar
    const tDoor = ctx.cue("which door");
    const tag2 = mkTag("mark_wrong_person", 880, 835, "2  Correct password, wrong person", "accent4", tDoor);
    const lock2 = { x: 606 + doors[1].lockAt.x, y: (708 - 556 * 0.625) + doors[1].lockAt.y };
    Loom.ui.wire(ctx, "lead_wrong_person", { x: 930, y: 835 }, { x: 852, y: 660 }, tDoor + 0.25, { tone: "accent4" });

    const Q = ctx.el("question", { x: 250, y: 110, w: 1300, h: 100, kind: "text", exit: "wipe" });
    kit.text(Q.inner, "Which habit shuts which door?", { role: "title", x: 0, y: 0, w: 1300, h: 100, maxLines: 1, weight: 700, color: "ink" });
    m.unmask(Q, tDoor + 0.15);

    const PB = ctx.el("pause_bar", { x: 250, y: 232, w: 640, h: 8, kind: "instrument", exit: "recede" });
    sv("rect", { x: 0, y: 0, width: 640, height: 8, rx: 4, fill: c("line"), opacity: 0.35 }, PB.inner);
    const fill = sv("rect", { x: 0, y: 0, width: 640, height: 8, rx: 4, fill: c("accent4") }, PB.inner);
    m.reveal(PB, ctx.speechEnd - 0.1);
    Loom.drive((e) => { fill.setAttribute("width", String(Math.max(0.01, 640 * (1 - e)))); }, ctx.speechEnd, Math.max(0.5, ctx.end - ctx.speechEnd - 0.1), "linear", { key: "pause_run" });
  },
});
