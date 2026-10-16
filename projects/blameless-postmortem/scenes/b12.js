// @design timeline_scaffold_continued: the held axis fills: one small view settles into each empty frame, each with one telling mark, then a closing row of ticks
/* b12 - "The view from then": the held timeline fills in, one small screen per moment, each showing
 * only what that person could see at the time. No clock times (none are in the script).
 * Treatments considered:
 *  (A) three captions under the markers (rejected: tells the order, shows nothing of the view),
 *  (B) one large screen cross-fading between the three moments (rejected: breaks the timeline; the
 *      three views must sit side by side so b13 can carry hindsight across all of them),
 *  (C) CHOSEN: three sketch screens settle into the three frames b11 left empty, in narration order;
 *      each screen's one telling mark (tick, green dot, bell-off) lands a beat after it settles, and
 *      the three "sense" ticks pop as peers on the closing line. Motion is content: the timeline
 *      filling left to right IS the reconstruction.
 * Elements (all on st_timeline, kept by b13): screen_1, screen_2, screen_3, sense_ticks.
 * The children of sense_ticks are three <g class="sense-tick"> groups (left to right) so b13 can pulse them.
 */
Loom.scene("b12", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const beat = ctx.beat.id;

    // frame geometry, as b11 drew it: 300x200 outlines at y 380, above the markers at x 520 / 960 / 1400
    const FY = 380, FW = 300, FH = 200;
    const FX = [370, 810, 1250];
    const MX = [520, 960, 1400];

    // shared: the window chrome (a sketch window with a title bar), kept clear of the frame's corner eye icon
    function windowChrome(E) {
      kit.rect(E.inner, 26, 26, 256, 112, { fill: "surface", stroke: "ink" });
      kit.line(E.inner, 26, 52, 282, 52, { stroke: "ink", sw: 2.4 });
      for (let i = 0; i < 3; i++) kit.disc(E.inner, 44 + i * 18, 39, 4, { fill: "muted", shadow: false, crisp: true });
    }
    function label(E, str) {
      kit.text(E.inner, str, { role: "label", x: 0, y: 148, w: FW, h: 44, maxLines: 1, align: "center", valign: "middle", color: "ink", size: 30 });
    }
    // a child group that pops a little after its screen has settled (the reading, marked when it stops)
    function later(parent) { return Loom.svg("g", {}, parent); }

    // ---- screen 1: the code review window, with a pass tick ("review passed")
    // @form mini_screen_card: a small sketch screen with window chrome, placeholder lines, a caption and one telling mark
    const s1 = ctx.el("screen_1", { x: FX[0], y: FY, w: FW, h: FH, kind: "card", exit: "recede" });
    windowChrome(s1);
    [[44, 70, 120], [44, 90, 150], [44, 110, 90]].forEach(([x, y, w]) => kit.line(s1.inner, x, y, x + w, y, { stroke: "muted", sw: 5 }));
    // @form outcome_tick: a tick or cross mark landing on an item to show its result
    const pass = later(s1.inner);
    kit.mark(pass, "yes", 238, 98, 50);
    label(s1, "review passed");
    const t1 = ctx.cue("passed code review");
    m.settle(s1, t1, { dy: 22 });
    m.pop(pass, t1 + 0.45, { overshoot: false, content: true });

    // ---- screen 2: the staging dashboard, with a green status dot ("staging green")
    // @form mini_screen_card: a small sketch screen with window chrome, placeholder lines, a caption and one telling mark
    const s2 = ctx.el("screen_2", { x: FX[1], y: FY, w: FW, h: FH, kind: "card", exit: "recede" });
    windowChrome(s2);
    [[52, 30], [90, 52], [128, 40]].forEach(([x, h]) => kit.rect(s2.inner, x, 128 - h, 26, h, { fill: "surface2", stroke: "muted", sw: 2.4 }));
    const dot = later(s2.inner);
    kit.disc(dot, 236, 92, 22, { fill: "pos", shadow: false });
    label(s2, "staging green");
    const t2 = ctx.cue("Staging looked green");
    m.settle(s2, t2, { dy: 22 });
    m.pop(dot, t2 + 0.4, { overshoot: false, content: true });

    // ---- screen 3: a phone with an empty notification area, and the bell switched off ("no alert")
    // @form mini_screen_card: a small sketch screen with window chrome, placeholder lines, a caption and one telling mark
    const s3 = ctx.el("screen_3", { x: FX[2], y: FY, w: FW, h: FH, kind: "card", exit: "recede" });
    kit.rect(s3.inner, 62, 22, 78, 122, { fill: "surface", stroke: "ink" });
    kit.line(s3.inner, 88, 34, 114, 34, { stroke: "muted", sw: 3 });
    kit.path(s3.inner, "M74 50 H128 V90 H74 Z", { stroke: "muted", sw: 2.4, dash: "7 7" });   // the notification area: empty
    kit.line(s3.inner, 90, 130, 112, 130, { stroke: "muted", sw: 3 });
    const bell = later(s3.inner);
    kit.icon(bell, "bell-off", { x: 226, y: 84, size: 76, color: "ink" });
    label(s3, "no alert");
    const t3 = ctx.cue("showed no alert");
    m.settle(s3, t3, { dy: 22 });
    m.pop(bell, t3 + 0.4, { overshoot: false, content: true });

    // ---- the closing line: three small ticks under the markers, peers popping in a tight stagger
    const TX0 = MX[0] - 30, TW = MX[2] - MX[0] + 60;
    // @form outcome_tick: a tick or cross mark landing on an item to show its result
    const ticks = ctx.el("sense_ticks", { x: TX0, y: 670, w: TW, h: 40, kind: "mark", exit: "recede" });
    const tickGroups = MX.map((mx) => {
      const g = Loom.svg("g", { class: "sense-tick" }, ticks.inner);
      kit.mark(g, "yes", mx - TX0, 20, 40);
      return g;
    });
    const t4 = ctx.cue("Each move made sense");
    tickGroups.forEach((g, i) => {
      m.pop(g, t4 + i * 0.1, { overshoot: false, content: true });
    });
    ticks.revealT = t4;
    void S; void beat;
  },
});
