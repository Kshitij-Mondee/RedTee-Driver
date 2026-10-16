// @design label_slap: a sticky word flies across the room onto one person, who shrinks back as a clear wall rises between them
/* Treatments considered: (A) static two-shot with a caption card "defensive" (rejected: says it, does not show it);
 * (B) split Nina/Theo panels with the tag between (rejected: the room is the station, b07 holds it);
 * (C) CHOSEN: the same room; tag pops by Nina, flies and stamps on Theo's chest, Theo leans back and tilts,
 * a frosted pane rises from the table between them. set, nina and theo are built exactly as in b01 so b07 can hold them. */
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const K = Loom.lesson.meeting_room.K, R = K.ROOM;
    const SIZE = 560;
    const tLabel = ctx.cue("a label");
    const tRamble = ctx.cue("you ramble");
    const tDef = ctx.cue("defensive");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const rnd = (v) => Math.round(v * 100) / 100;
    const outBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
    const inOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    const outCubic = (x) => 1 - Math.pow(1 - x, 3);

    // 1. the set, as in b01 (wall back layer, people, table front layer)
    const set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    Loom.lesson.meeting_room(ctx, set.inner, { layer: "back" });
    const EMOS = ["neutral", "happy", "surprised", "explaining"];
    const nina = ctx.el("nina", { x: R.nina.x - SIZE / 2, y: R.nina.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
    const theo = ctx.el("theo", { x: R.theo.x - SIZE / 2, y: R.theo.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
    const faces = { nina: {}, theo: {} };
    for (const em of EMOS) {
      faces.nina[em] = kit.peep(nina.inner, "woman", em, { x: SIZE / 2, y: SIZE / 2, size: 560, flip: false, cloth: "cloth", skin: 2 });
      faces.theo[em] = kit.peep(theo.inner, "man", em, { x: SIZE / 2, y: SIZE / 2, size: 560, flip: true, cloth: "cloth2", skin: 1 });
    }
    Loom.lesson.meeting_room(ctx, set.inner, { layer: "front" });

    // 2. the wall: screen blank, clock on time, calendar plain
    const scr = ctx.el("wall_screen", { x: R.screen.x, y: R.screen.y, w: R.screen.w, h: R.screen.h, kind: "scenery", exit: "recede" });
    Loom.lesson.wall_screen(ctx, scr.inner, {}).setState("blank", ctx.start);
    const clk = ctx.el("wall_clock", { x: R.clock.x, y: R.clock.y, w: R.clock.w, h: R.clock.h, kind: "scenery", exit: "recede" });
    Loom.lesson.wall_clock(ctx, clk.inner, {}).setState("on_time", ctx.start);
    const cal = ctx.el("wall_calendar", { x: R.calendar.x, y: R.calendar.y, w: R.calendar.w, h: R.calendar.h, kind: "scenery", exit: "recede" });
    Loom.lesson.wall_calendar(ctx, cal.inner, {}).setState("plain", ctx.start);

    // 3. the pane: a thin frosted sheet that rises from behind the table lip, between the two (muted, no accent)
    const PW = 300, PH = 526, PX = 810, PY = 380;
    const pane = ctx.el("pane", { x: PX, y: PY, w: PW, h: PH, kind: "object", exit: "recede" });
    const clipId = Loom.uid("b06clip");
    const cp = Loom.svg("clipPath", { id: clipId }, pane.inner);
    Loom.svg("rect", { x: -10, y: -10, width: PW + 20, height: PH + 10 }, cp);
    const clipG = Loom.svg("g", { "clip-path": "url(#" + clipId + ")" }, pane.inner);
    const paneG = Loom.svg("g", {}, clipG);
    // @form frosted_pane: a clear sheet between two people, a barrier that does not hide faces
    Loom.svg("rect", { x: 6, y: 6, width: PW - 12, height: PH + 40, rx: 22, fill: ctx.c("field"), "fill-opacity": 0.42, stroke: ctx.c("ink"), "stroke-width": 5 }, paneG);
    Loom.svg("polygon", { points: "70,40 120,40 70,420 20,420", fill: ctx.c("surface"), "fill-opacity": 0.6 }, paneG);
    Loom.svg("polygon", { points: "150,40 172,40 122,420 100,420", fill: ctx.c("surface"), "fill-opacity": 0.45 }, paneG);
    const paneAt = (t) => {
      const r = clamp((t - (tDef + 0.15)) / 0.9, 0, 1), e = outCubic(r);
      paneG.setAttribute("transform", "translate(0 " + rnd((1 - e) * (PH + 60)) + ")");
      pane.inner.style.visibility = r > 0.001 ? "visible" : "hidden";
    };
    paneAt(ctx.start);

    // 4. the tag: appears by Nina, flies onto Theo's chest, then rides his lean
    const tag = ctx.el("tag", { x: R.tag.x, y: R.tag.y, w: R.tag.w, h: R.tag.h, kind: "token", exit: "recede" });
    const lt = Loom.lesson.label_tag(ctx, tag.inner, {});
    lt.setState("in_hand", tLabel);
    const tLand = tRamble + 0.42;
    lt.setState("stuck", tLand - 0.05);

    // lean: 0..1, Theo tips back away from Nina on "defensive"
    const lean = (t) => outCubic(clamp((t - tDef) / 0.7, 0, 1));
    const LEAN_DX = 30, LEAN_DEG = 6, PIV = { x: R.theo.x, y: R.theo.y + 240 };
    const HAND = { x: R.tag.x + 140, y: R.tag.y + 60 }, CHEST = { x: R.theo.x - 10, y: 770 };
    const T0 = ctx.start, T1 = ctx.end, DUR = Math.max(0.1, T1 - T0);
    const clk2 = (raw) => T0 + raw * DUR;

    Loom.drive((e, raw) => {
      const t = clk2(raw), l = lean(t), a = LEAN_DEG * l * Math.PI / 180;
      theo.inner.setAttribute("transform", "translate(" + rnd(LEAN_DX * l) + " 0) rotate(" + rnd(LEAN_DEG * l) + " " + SIZE / 2 + " " + (PIV.y - (R.theo.y - SIZE / 2)) + ")");
      paneAt(t);
      // the tag
      let cx, cy, sc = 1, rot = 0, op = 1;
      if (t < tLabel) { op = 0; cx = HAND.x; cy = HAND.y; }
      else if (t < tRamble) {
        const p = clamp((t - tLabel) / 0.4, 0, 1);
        sc = 0.3 + 0.7 * outBack(p); op = clamp(p * 3, 0, 1);
        cx = HAND.x; cy = HAND.y + 5 * Math.sin((t - tLabel) * 3.2);
      } else if (t < tLand) {
        const p = inOut((t - tRamble) / (tLand - tRamble));
        cx = HAND.x + (CHEST.x - HAND.x) * p;
        cy = HAND.y + (CHEST.y - HAND.y) * p - 110 * Math.sin(Math.PI * p);
        sc = 1 + 0.12 * Math.sin(Math.PI * p); rot = -8 * Math.sin(Math.PI * p);
      } else {
        const q = clamp((t - tLand) / 0.25, 0, 1);
        sc = 1 + 0.14 * Math.sin(Math.PI * q) * (1 - q);
        const dx0 = CHEST.x - PIV.x, dy0 = CHEST.y - PIV.y;
        cx = PIV.x + dx0 * Math.cos(a) - dy0 * Math.sin(a) + LEAN_DX * l;
        cy = PIV.y + dx0 * Math.sin(a) + dy0 * Math.cos(a);
        rot = LEAN_DEG * l;
      }
      tag.inner.setAttribute("transform", "translate(" + rnd(cx - R.tag.x) + " " + rnd(cy - R.tag.y) + ") rotate(" + rnd(rot) + " 0 0) translate(0 0) scale(" + rnd(sc) + ")" + " translate(" + rnd(-140 * 0) + " 0)");
      tag.inner.setAttribute("opacity", rnd(op));
      tag.inner.style.visibility = op > 0.001 ? "visible" : "hidden";
    }, T0, DUR, "linear", { key: "b06.stage" });

    // 5. ambient sway
    m.drift(nina, ctx.start, ctx.end, { amp: 4, period: 3 });
    m.drift(theo, ctx.start, ctx.end, { amp: 4, period: 3.4 });

    // 6. faces: one drive per person
    const words = [];
    const ph = ((ctx.beat && ctx.beat.phrases) || [])[1];
    for (const w of (ph && ph.words) || []) words.push(w);
    const flap = (t) => { const w = words.find((x) => t >= x.s && t < x.e); return !!w && Math.floor((t - w.s) / 0.12) % 2 === 0; };
    const faceAt = {
      nina: (t) => (t >= tDef ? "surprised" : (t >= tRamble - 0.1 && t < tRamble + 1.7 ? (flap(t) ? "explaining" : "happy") : t >= tLabel ? "explaining" : "happy")),
      theo: (t) => (t >= tDef ? "explaining" : t >= tLand ? "surprised" : "happy"),
    };
    for (const who of ["nina", "theo"]) {
      const F = faces[who];
      Loom.drive((e, raw) => {
        const want = faceAt[who](clk2(raw));
        for (const em of EMOS) F[em].style.visibility = em === want ? "visible" : "hidden";
      }, T0, DUR, "linear", { kind: "character", beat: ctx.beat.id, name: who, content: true });
    }
  },
});
