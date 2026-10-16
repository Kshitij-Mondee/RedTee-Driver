// @design place_witness: one small event staged inside a drawn room, with the room carrying on around it
/* b32 - Ravi, earlier in the week. A dip marks the change of time. Loom.place.meeting is the room: a meeting
 * runs behind a glass wall (grey extras seated at the table, a Loom.array), a calendar with an earlier day marked
 * and a clock that turns hang on the corridor wall, and Ravi stands at a bench with his laptop, between meetings.
 * A delivery notice (a drawn parcel) pops on the screen, his cursor taps it on "clicked", and the screen carries on
 * exactly as before. The place, the camera and Ravi keep running into b33 (the place is held there), so they are built
 * on a context whose clock reaches past this beat. Treatments weighed: (A) a laptop close-up alone (rejected: no
 * "between meetings", no time), (B) a timeline of the week (rejected: the sheet gives no dates), (C) CHOSEN: the room
 * itself, because the click is an event in a busy place and the unchanged screen afterwards is the point.
 */
Loom.scene("b32", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, O = Loom.obj, PL = Loom.place;
    const svg = (...a) => Loom.svg(...a);
    const col = (t) => S.c(t);
    const tint = (t, p) => (p >= 0 ? S.lighten(S.c(t), p) : S.darken(S.c(t), -p));
    const keep = (E) => { E.exit = "none"; return E; };                       // stays while the room it lives in stays
    const flat = (g, x, y, w, h, fill, o) => kit.rect(g, x, y, w, h, Object.assign({ fill, r: 0, flat: true, shadow: false }, o || {}));
    const poly = (g, pts, fill, op) => svg("polygon", { points: pts.map((q) => q.join(",")).join(" "), fill, opacity: op }, g);
    const ctxL = Object.assign({}, ctx, { end: ctx.end + 8 });                // the place, the camera and Ravi run on into b33

    // ---- the words this beat lands on
    const tRavi = ctx.cue("Say this is Ravi"), tName = ctx.cue("Ravi"), tWeek = ctx.cue("earlier in the week");
    const tBack = ctx.cue("Back to back meetings"), tNotice = ctx.cue("a delivery notice");
    const tClick = ctx.cue("clicked"), tBusy = ctx.cue("That happens to busy people");

    // ---- the room: far (wall, screen, window), mid (table, glass, bench, people), near (frame edge, dust)
    const P = PL.meeting(ctxL, "corridor_set", { wall: "surface", floorFill: "field2" });
    const F = P.layers.far.g, M = P.layers.mid.g, N = P.layers.near.g;
    while (N.firstChild) N.removeChild(N.firstChild);                         // our own foreground instead of the stock corner shadows

    // the next meeting's slide replaces the first on the wall screen: back to back
    Loom.array(ctxL, "slide_bars", { x: 760, y: 160, cols: 5, rows: 1, dx: 92, dy: 0, parent: F, kind: "scenery", exit: "none", t: tBack + 1.1, stagger: 0.12,
      draw: (g, i, r, c, rnd) => {
        const h = 90 + Math.round(rnd() * 120);
        if (i === 0) kit.rect(g, -70, -30, 560, 290, { fill: "field2", r: 4, flat: true, shadow: false });
        kit.rect(g, 0, 230 - h, 60, h, { fill: i === 3 ? "accent" : "accent3", r: 4, flat: true, shadow: false });
      } });

    // ---- the meeting behind the glass: grey extras seated at the table, cut at the table's far edge
    const clipId = Loom.uid("clip");
    svg("rect", { x: -300, y: -300, width: 2520, height: 1000 }, svg("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" }, svg("defs", {}, M)));
    const seats = svg("g", { "clip-path": `url(#${clipId})` }, M);
    const poses = ["explain", "idle", "think", "idle", "idle", "present", "idle", "think"];
    const extras = Loom.array(ctxL, "meeting_extras", { x: 130, y: 0, cols: 8, rows: 1, dx: 195, dy: 0, parent: seats, kind: "scenery", exit: "none",
      draw: (g, i, r, c, rnd) => {
        const ex = Loom.rig.place(ctxL, "extra_" + (i + 1), "extra", { x: 0, y: 800, scale: 0.37 + rnd() * 0.03, parent: g, top: i === 4 ? "muted" : "line", exit: "none", flip: rnd() > 0.5 });
        ex.pose(poses[i], ctx.start + 0.1 + rnd() * 0.3, { dur: 0.6 });
        if (i === 0 || i === 3) ex.gesture("beat", tBack, tBack + 2.6);
        if (i === 2) ex.gesture("nod", tBack + 0.8, tBack + 2.2);
      } });
    m.drift(extras, ctx.start, ctx.end + 8, { amp: 3, period: 4 });

    // ---- the glass wall, the corridor pillars, the floor, the bench (one piece of dressing)
    const dress = keep(ctxL.el("corridor_dressing", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", parent: M }));
    const D = dress.inner;
    flat(D, 70, 100, 1490, 750, "field", { opacity: 0.5 });                    // the lit room behind the glass sits back in the dark
    flat(D, 70, 690, 1490, 150, "field2", { opacity: 0.93 });                  // frosted lower panel: the meeting is seen from the shoulders up
    flat(D, 70, 688, 1490, 3, "line", { opacity: 0.5 });
    [[260, 110, 150], [900, 110, 90]].forEach(([x, y, w]) => poly(D, [[x, y], [x + w, y], [x + w - 160, y + 740], [x - 160, y + 740]], col("ink"), 0.045));
    [70, 440, 810, 1180, 1544].forEach((x) => flat(D, x, 96, 16, 770, "surface"));
    flat(D, 60, 90, 1510, 20, "surface");
    flat(D, 60, 836, 1510, 34, "field2");
    flat(D, -400, -200, 470, 1500, "field");                                   // corridor pillars either side
    flat(D, 1560, -200, 800, 1500, "field");
    flat(D, 1556, 100, 4, 780, "line", { opacity: 0.45 });
    flat(D, -400, 870, 2800, 500, "field");                                    // the corridor floor in front of the glass
    flat(D, -400, 868, 2800, 4, "line", { opacity: 0.5 });
    // the key light: a warm shaft from the upper left and a pool on the floor under Ravi and the bench
    poly(D, [[210, -60], [430, -60], [960, 930], [140, 930]], col("accent"), 0.055);
    [[560, 930, 640, 70, 0.07], [560, 930, 440, 46, 0.09], [560, 930, 250, 26, 0.1]].forEach(([cx, cy, rx, ry, op]) => svg("ellipse", { cx, cy, rx, ry, fill: col("accent"), opacity: op }, D));
    // the bench along the glass: a top, a front, a pedestal either end
    svg("ellipse", { cx: 930, cy: 930, rx: 380, ry: 22, fill: col("shadow"), opacity: 0.55 }, D);
    [650, 1190].forEach((x) => flat(D, x, 752, 34, 172, "surface2"));
    flat(D, 600, 722, 660, 14, tint("accent", -0.45), { r: 3 });
    flat(D, 600, 736, 660, 22, tint("accent", -0.7), { r: 3 });
    flat(D, 600, 722, 660, 3, tint("accent", -0.1), { opacity: 0.75 });

    // ---- the calendar (an earlier day, marked, no words) and the clock on the corridor wall
    const cal = keep(O.draw(ctxL, "wall_calendar", "calendar", { x: 1740, y: 330, size: 190, family: "wall", detail: 2, tone: "accent3", parent: M, key: "ravi_cal" }));
    const cw = 190 * 0.86 * 0.8 / 7, calW = 190 * 0.86, calH = 190 * 0.9;
    const cellX = 1740 - calW / 2 + calW * 0.1 + 1 * cw + cw / 2;
    const cellY = 330 - calH / 2 + 190 * 0.04 + calH * 0.2 + 190 * 0.1 + 1 * cw * 0.95 + cw / 2;
    const dayMark = keep(ctxL.el("day_mark", { x: cellX - cw, y: cellY - cw, w: cw * 2, h: cw * 2, kind: "mark", parent: M }));
    kit.disc(dayMark.inner, cw, cw, cw * 0.44, { fill: "accent", flat: true, shadow: false });
    svg("circle", { cx: cw, cy: cw, r: cw * 0.8, fill: "none", stroke: col("accent"), "stroke-width": 3, opacity: 0.55 }, dayMark.inner);
    m.pop(dayMark, tWeek, { overshoot: false });
    const clock = keep(O.draw(ctxL, "wall_clock", "clock", { x: 1740, y: 610, size: 150, family: "wall", detail: 2, tone: "accent4", parent: M, key: "ravi_clock", t0: tBack, t1: tBack + 3.4, turns: 1, state: { time: 9.25 } }));

    // ---- the laptop on the bench: a mail window; the notice will pop into it
    const LX = 700, LY = 392, LW = 470, LH = 330;
    const lap = keep(ctxL.el("laptop", { x: LX, y: LY, w: LW + 60, h: LH, kind: "instrument", parent: M }));
    const L = lap.inner;
    kit.polygon(L, [[-24, LH - 24], [LW + 24, LH - 24], [LW + 6, LH], [-6, LH]], { fill: "surface" });
    kit.rect(L, 0, 0, LW, LH - 24, { fill: "surface2", r: 14, shade: "recipe" });
    flat(L, 16, 16, LW - 32, LH - 56, "surface", { r: 4 });
    flat(L, 16, 16, LW - 32, 36, "surface2");                                  // the top bar and its three dots
    [["neg", 38], ["accent", 56], ["pos", 74]].forEach(([tk, x]) => svg("circle", { cx: x, cy: 34, r: 5.5, fill: col(tk), opacity: 0.85 }, L));
    flat(L, 16, 52, 96, LH - 92, "field2");                                    // the sidebar
    [0, 1, 2, 3].forEach((i) => flat(L, 34, 74 + i * 30, i === 0 ? 62 : 48, 10, i === 0 ? "accent3" : "line", { r: 5, opacity: 0.8 }));
    ["accent3", "accent4", "line", "accent3"].forEach((tk, i) => {              // the inbox rows: a sender dot and two bars each
      kit.disc(L, 146, 82 + i * 44, 12, { fill: tk, flat: true, shadow: false });
      flat(L, 172, 72 + i * 44, 110 + (i % 2) * 36, 10, "muted", { r: 5, opacity: 0.7 });
      flat(L, 172, 90 + i * 44, 200 - (i % 3) * 24, 9, "line", { r: 4.5, opacity: 0.8 });
    });
    const NW = 300, NH = 118, NX = 136, NY = 150;                               // the delivery notice, a card on the screen
    const notice = keep(ctxL.el("notice", { x: LX + NX, y: LY + NY, w: NW, h: NH, kind: "card", parent: M }));
    // @form notification_card: a small card on a screen with a drawn object, two grey lines and a link-shaped pill
    kit.rect(notice.inner, 0, 0, NW, NH, { fill: "ink", r: 12, shade: "recipe" });
    O.shape(notice.inner, "package", 62, 58, 80, { family: "parcel", tone: "accent", detail: 2, shadow: false, key: "notice_parcel" });
    flat(notice.inner, 116, 24, 150, 12, "line", { r: 6, opacity: 0.9 });
    flat(notice.inner, 116, 46, 112, 10, "line", { r: 5, opacity: 0.6 });
    kit.pill(notice.inner, 116, 70, 120, 32, { fill: "accent", flat: true, shadow: false });
    kit.icon(notice.inner, "arrow-right", { x: 176, y: 86, size: 20, color: "onAccent" });
    m.pop(notice, tNotice, { overshoot: false });
    Loom.sfx("pop", tNotice);

    // ---- Ravi: a code rig (sam) at the end of the bench; competent, busy, never foolish
    const ravi = Loom.rig.place(ctxL, "ravi", "sam", { x: 480, y: 925, scale: 0.62, skin: 2, top: "accent3", bottom: "line", shoe: "field", parent: M, exit: "none" });
    ravi.look(0.6, 0.3, tRavi + 0.9);                                         // busy: eyes on the screen
    ravi.look(0.8, 0.45, tNotice);                                            // a glance at what just arrived
    ravi.look(-0.9, -0.15, tBusy);                                             // ...and back toward the meeting
    ravi.gesture("nod", tBusy + 0.1, tBusy + 1.3);
    m.settle(ravi.E, tRavi, { dy: 22 });
    Loom.data.tag(ctx, "tag_ravi", { x: 400, y: 372, text: "RAVI", color: "accent3", textColor: "onAccent", t: tName });

    // ---- the pointer: it comes in, goes to the link, and taps on "clicked"
    const C = Loom.ui.cursor(ctxL, { x: LX + 410, y: LY + 270, name: "cursor" });
    M.appendChild(C.outer); keep(C);
    const tx = LX + NX + 176, ty = LY + NY + 86;
    m.cursorIn(C, tNotice + 0.55);
    m.cursorTo(C, LX + 330, LY + 236, tNotice + 0.62, { dur: 0.5 });
    m.cursorTo(C, tx, ty, tClick - 0.65, { dur: 0.5 });
    m.tap(C, notice, tClick, { x: tx, y: ty, ring: "accent" });
    Loom.data.tag(ctx, "tag_clicked", { x: 1210, y: 536, text: "CLICKED", color: "accent", textColor: "onAccent", t: tClick });

    // ---- ambient: dust in the light, a door frame at the edge of the shot
    Loom.array(ctxL, "dust_motes", { x: 140, y: 120, cols: 9, rows: 4, dx: 150, dy: 190, parent: N, kind: "scenery", exit: "none", seed: "ravi_dust",
      draw: (g, i, r, c, rnd) => { svg("circle", { cx: rnd() * 90, cy: rnd() * 120, r: 1.6 + rnd() * 2.2, fill: col("accent"), opacity: 0.14 + rnd() * 0.2 }, g); } });
    flat(N, -120, -60, 150, 1300, "field", { opacity: 0.9 });
    flat(N, 26, -60, 3, 1300, "line", { opacity: 0.35 });

    Loom.__ravi = { P, ravi, M, F, N, cursor: C, notice, lap: { x: LX, y: LY }, cal, clock };
  },
});
