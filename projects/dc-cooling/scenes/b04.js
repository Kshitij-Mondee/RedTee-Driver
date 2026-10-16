// @design analogy_then_section: a familiar object shows the behaviour first (a laptop's warm puff), then the same behaviour in the formal side view with the air coloured by temperature
/* b04 - "Like a laptop, it breathes. Cool air in at the front. Warm air out the back."
 * Station: air_section. First of four beats (b04 to b07) that build ONE held picture: air_world, a 1920 x 1080 element
 * holding the room, the server, the cooling unit, the water loop, the wall and the outdoor unit in the frame coordinates
 * of the final wide shot (b07). Each beat adds to it and the camera (m.travel on air_world, chained across the held
 * beats) frames the part the narration is on: b04 laptop, then server; b05 server and unit; b06 unit, wall, outdoor unit;
 * b07 the whole route. Held elements are claimed again in every later beat with ctx.held.
 *
 * Look first: the kit's own heat_route (b03, b30) draws the same server, unit and outdoor fan, so this section keeps its
 * language (white pill labels with a muted leader, tone bars, field2 room, slate wall). Rules taken from corporate-clean
 * R1: one named thing at a time, neutral furniture, the temperature code is the only colour here (no accent in this beat,
 * the storyboard says "no blue in this frame").
 *
 * Three treatments considered (animation gate: motion only where the taught thing changes over time):
 *   A. The 3D laptop clip (the storyboard's alternative). Rejected: it can show the analogy but not the front-to-back air
 *      the next two sentences state.
 *   B. A still side view of the server with two arrows. Rejected: the colour change along the stream IS the lesson, and a
 *      still arrow cannot show cool turning warm.
 *   C. CHOSEN: a small laptop on a table gives one warm puff on "Like a laptop"; on "it breathes" the camera pushes right
 *      and the server settles in side view; the cool beads wipe in from the front on "Cool air in", the warm half wipes in
 *      past the heatsink on "Warm air out", each label on its own word. Only the air moves.
 *
 * Beat sheet (words from the task's phrase timings):
 *   "Like a laptop"             the table and laptop settle in the left third
 *   "laptop"                    one soft warm puff leaves the laptop's side vent and drifts
 *   "it breathes"               camera pushes right to the server (1.0 s); the laptop retires (0.3 s); the server settles
 *   "Cool air in at the front"  the cool beads wipe in from the front and run into the chassis; beads flow from here on
 *   "front"                     label Front: cool in
 *   "Warm air out the back"     the warm half wipes in past the heatsink, the chip warms
 *   "back"                      label Back: warm out
 */
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const D = (k, f) => Loom.style.dur(k) * (f || 1);   // style durations, scaled
    // where things sit in world coordinates (the frame coordinates of b07's final wide shot); b05 to b07 read W.geo
    const SX = 170, SY = 330, FLOOR = 800;
    const GEO = {
      SX, SY, FLOOR,
      LY: [SY + 122, SY + 186, SY + 250],            // the three air lanes of the server part (top to bottom)
      UX: 1190, UY: 400, UW: 200, UH: 400,           // the cooling unit (floor standing)
      WX: 1614, WW: 28,                              // the building wall
      OX: 1712, OW: 160, OY: 500,                    // the outdoor unit
    };

    // ---- the held world: everything b04 to b07 draws lives in it, so the camera is one move on one element
    const W = ctx.el("air_world", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    W.geo = GEO;
    const P = W.inner;

    // ---- the room: a pale panel and a floor strip, as wide as the section needs (the laptop is left of the server)
    const RX = -780, RY = 140, RW = GEO.WX - RX;
    const room = ctx.el("room", { x: RX, y: RY, w: RW, h: FLOOR + 26 - RY, kind: "scenery", parent: P, exit: "none" });
    kit.rect(room.inner, 0, 0, RW, FLOOR - RY, { fill: "field2", r: 0, shadow: false, opacity: 0.6 });
    kit.rect(room.inner, 0, FLOOR - RY, RW, 26, { fill: "surface2", r: 0, shadow: false });

    // ---- the analogy: a small table, a laptop on it, one puff from its side vent (all neutral, the puff warm)
    const TX = -380, TY = 635;
    // @form table_on_floor: a thin top on two legs standing on the floor line
    const desk = ctx.el("desk", { x: TX, y: TY, w: 380, h: FLOOR - TY, kind: "scenery", parent: P, exit: "none" });
    kit.rect(desk.inner, 0, 0, 380, 20, { fill: "surface", r: 6 });
    [30, 350].forEach((x) => kit.rect(desk.inner, x - 8, 20, 16, FLOOR - TY - 20, { fill: "accent3", r: 3, shadow: false }));
    const laptop = Loom.obj.draw(ctx, "laptop", "laptop", { x: -190, y: 560, size: 300, family: "laptop", detail: 1, shadow: false, parent: P });
    laptop.exit = "none";
    // @form exhaust_puff: a few soft discs growing along a short diagonal, one gust of warm air leaving a vent
    const puff = ctx.el("laptop_puff", { x: -60, y: 480, w: 150, h: 140, kind: "token", parent: P, exit: "none" });
    [[22, 118, 13, 0.55], [50, 92, 19, 0.42], [86, 62, 26, 0.3]].forEach(([x, y, r, o]) =>
      Loom.svg("circle", { cx: x, cy: y, r, fill: ctx.c("accent2"), opacity: o }, puff.inner));

    // ---- the server in side view (kit part, air state), its own wrapper elements for the named streams and labels
    const SE = ctx.el("server_side", { x: SX, y: SY, w: 900, h: FLOOR - SY, kind: "instrument", parent: P, exit: "none" });
    // @form stand_legs: two legs under a flat object, standing on the floor line
    [480 - SX, 600 - SX].forEach((x) => kit.rect(SE.inner, x - 13, 300, 26, FLOOR - SY - 300, { fill: "accent3", r: 4, shadow: false }));
    const srv = Loom.lesson.server_side(ctx, SE.inner, { hide: ["intake", "exhaust"], labels: { air: false } });   // the "Still needs air" pill is b24's word, not this beat's
    SE.kit = srv;
    W.srv = srv;

    // the two stream pieces and the two labels are the kit's own groups; each moves into a wrapper element that has its
    // true box, keeping its natural coordinates (a translate undoes the wrapper's offset)
    const adopt = (name, kind, piece, bx) => {
      const E = ctx.el(name, { x: SX + bx.x, y: SY + bx.y, w: bx.w, h: bx.h, kind, parent: P, exit: "none" });
      Loom.svg("g", { transform: "translate(" + (-bx.x) + " " + (-bx.y) + ")" }, E.inner).appendChild(srv.piece(piece));
      return E;
    };
    const pbox = (pl, tx, ty) => {
      const x0 = Math.min(pl.x, tx - 8), y0 = Math.min(pl.y, ty - 8), x1 = Math.max(pl.x + pl.w, tx + 8), y1 = Math.max(pl.y + pl.h + 12, ty + 8);
      return { x: Math.floor(x0), y: Math.floor(y0), w: Math.ceil(x1 - x0), h: Math.ceil(y1 - y0) };
    };
    const coolS = adopt("cool_stream", "token", "intake", { x: 0, y: 104, w: 450, h: 164 });
    const warmS = adopt("warm_stream", "token", "exhaust", { x: 450, y: 104, w: 450, h: 164 });
    const labF = adopt("label_front", "label", "label_front", pbox(srv.pills.front, 100, 280));
    const labB = adopt("label_back", "label", "label_back", pbox(srv.pills.back, 800, 280));

    // ---- the camera: the held world starts framed on the laptop (left third), then pushes right to the server.
    // The camera is m.travel on the world (it writes the matrix from one progress value, so the world's own (0, 0) lands
    // at (x, y) scaled about that point). Loom.cam.frame tweens with transformOrigin "0 0", which on an SVG group is the
    // top-left of its CONTENT's box (here the room, x = -780), and shifted the whole picture by 0.2 to 0.35 of that.
    // W.cam(rect, t, dur, {margin, maxScale, cx, cy}) frames a rect of world coordinates; later beats reuse it.
    W.cam = (rect, t, dur, o) => {
      o = o || {};
      const mg = o.margin || 0, s = Math.min(o.maxScale || 3, 1920 / (rect.w + 2 * mg), 1080 / (rect.h + 2 * mg));
      return m.travel(W, t, { x: (o.cx || 960) - s * (rect.x + rect.w / 2), y: (o.cy || 540) - s * (rect.y + rect.h / 2), scale: s, dur });
    };
    const S0 = 1.2, CX0 = 77, CY0 = 560;
    W.__pos = { x: 960 - S0 * CX0, y: 500 - S0 * CY0, s: S0 };
    W.mover.setAttribute("transform", "translate(" + W.__pos.x + " " + W.__pos.y + ") scale(" + S0 + ")");

    // ---- times, all from the narration
    const tLap = ctx.cue("Like a laptop");
    const tPuff = ctx.cue("laptop") + 0.1;
    const tBreath = ctx.cue("it breathes");
    const tCool = ctx.cue("Cool air in at the front");
    const tFront = ctx.cue("front");
    const tWarm = ctx.cue("Warm air out the back");
    const tBack = ctx.cue("back");

    // "Like a laptop": the table and laptop settle; a puff leaves the side vent and drifts up and away
    m.settle(desk, tLap, { dy: 20 });
    m.settle(laptop, tLap + 0.08, { dy: 20 });
    m.reveal(puff, tPuff, { dy: 0, dur: D("enter", 0.6) });
    Loom.tween(puff.life, { x: 0, y: 0 }, { x: 46, y: -54, duration: D("draw", 1.4), ease: Loom.ease.move }, tPuff, { kind: "ambient", beat: puff.beat, name: "laptop_puff" });
    m.exit(puff, tPuff + 0.85, "recede");

    // "it breathes": the camera pushes right to the server; the laptop and its table retire as the view leaves them
    W.cam({ x: SX, y: 330, w: 900, h: 400 }, tBreath, 1.0, { maxScale: 1.35, cx: 960, cy: 500 });
    m.exit(laptop, tBreath + 0.3, "recede");
    m.exit(desk, tBreath + 0.3, "recede");
    m.settle(SE, tBreath + 0.4, { dy: 20 });

    // "Cool air in at the front": the cool beads wipe in from the front, then everything flows (period-locked)
    srv.reveal("intake", tCool, { dur: 0.05 });
    m.unmask(coolS, tCool, { dur: D("draw", 1.4) });
    srv.flow(tCool, ctx.end, { speed: 120 });
    srv.reveal("label_front", tFront, { dy: 10 });

    // "Warm air out the back": the warm half wipes in past the heatsink; the chip warms; the label follows on "back"
    srv.reveal("exhaust", tWarm, { dur: 0.05 });
    m.unmask(warmS, tWarm, { dur: D("draw", 1.4) });
    srv.chipHeat(1, tWarm, 0.9);
    srv.reveal("label_back", tBack, { dy: 10 });
    void labF; void labB;
  },
});
