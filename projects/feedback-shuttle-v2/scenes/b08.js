// @design two_empty_slots_wait: a calm room holds still while two dashed empty slots pulse and a hand-lettered question mark stamps in beside them
/* Treatments considered: (A) a static two-shot with a caption card and a signalling arrow (rejected: nothing holds the
 * pause); (B) the bubble zooms and the slots fill with placeholders (rejected: the slots must read empty, and the next
 * beat fills them); (C) CHOSEN: the same two-shot, two dashed empty slots unfold under the behaviour row and pulse
 * through the pause, a hand-lettered ? stamps in beside them on "still missing". The room is held from b07; if a held
 * element is missing the scene draws it from the kit exactly as b01 does. */
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const K = Loom.lesson.meeting_room.K, R = K.ROOM;
    const SIZE = 560;
    const num = (v) => Math.round(v * 100) / 100;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const tNow = ctx.cue("Now you");
    const tMiss = ctx.cue("still missing");
    const tryHeld = (n) => { try { return ctx.held(n); } catch (e) { return null; } };

    // 1. the room: held from b07, or drawn as b01 drew it
    const hSet = tryHeld("set"), hNina = tryHeld("nina"), hTheo = tryHeld("theo");
    const hBub = tryHeld("bubble"), hReplay = tryHeld("replay");
    let nina = hNina, theo = hTheo;
    const EMOS = ["neutral", "happy", "surprised", "explaining"];
    const faces = { nina: null, theo: null };
    if (!hSet || !hNina || !hTheo) {
      const set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
      Loom.lesson.meeting_room(ctx, set.inner, { layer: "back" });
      nina = ctx.el("nina", { x: R.nina.x - SIZE / 2, y: R.nina.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
      theo = ctx.el("theo", { x: R.theo.x - SIZE / 2, y: R.theo.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
      faces.nina = {}; faces.theo = {};
      for (const em of EMOS) {
        faces.nina[em] = kit.peep(nina.inner, "woman", em, { x: SIZE / 2, y: SIZE / 2, size: 560, flip: false, cloth: "cloth", skin: 2 });
        faces.theo[em] = kit.peep(theo.inner, "man", em, { x: SIZE / 2, y: SIZE / 2, size: 560, flip: true, cloth: "cloth2", skin: 1 });
      }
      const table = Loom.lesson.meeting_room(ctx, set.inner, { layer: "front" });
      table.setState("nameplates", ctx.start - 3);
      m.drift(nina, ctx.start, ctx.end, { amp: 5, period: 3 });
      m.drift(theo, ctx.start, ctx.end, { amp: 5, period: 3.4 });
    } else {
      // held people: their four faces are the four children, in b01's order
      const grab = (E) => {
        const kids = Array.prototype.slice.call(E.inner.children || []);
        if (kids.length !== 4) return null;
        const o = {}; EMOS.forEach((em, i) => { o[em] = kids[i]; }); return o;
      };
      faces.nina = grab(hNina); faces.theo = grab(hTheo);
    }
    if (!hReplay) {
      const scr = ctx.el("replay", { x: R.screen.x, y: R.screen.y, w: R.screen.w, h: R.screen.h, kind: "scenery", exit: "recede" });
      Loom.lesson.wall_screen(ctx, scr.inner, {}).setState("replay", ctx.start - 6);
    }
    if (!hSet) {
      const clk = ctx.el("wall_clock", { x: R.clock.x, y: R.clock.y, w: R.clock.w, h: R.clock.h, kind: "scenery", exit: "recede" });
      Loom.lesson.wall_clock(ctx, clk.inner, {}).setState("on_time", ctx.start - 3);
      const cal = ctx.el("wall_calendar", { x: R.calendar.x, y: R.calendar.y, w: R.calendar.w, h: R.calendar.h, kind: "scenery", exit: "recede" });
      Loom.lesson.wall_calendar(ctx, cal.inner, {}).setState("plain", ctx.start - 3);
    }
    if (!hBub) {
      const bub = ctx.el("bubble", { x: R.bubble.x, y: R.bubble.y, w: 700, h: 430, kind: "bubble", exit: "recede" });
      Loom.lesson.comment_bubble(ctx, bub.inner, { w: 700 }).setState("behaviour", ctx.start - 3);
    }

    // 2. the slots: rows 2 and 3 of the 700 wide bubble as dashed empty slots, unfolding then pulsing (kit period 1.4 s)
    const SC = 700 / 760, CY = [46, 172, 298], CH = 90, TW = 160, TH = 62;
    const slots = ctx.el("slots", { x: R.bubble.x, y: R.bubble.y, w: 700, h: 430, kind: "bubble", exit: "recede" });
    const sg = Loom.svg("g", { transform: "scale(" + num(SC) + ")" }, slots.inner);
    const dash = (p, x, y, w, h, o) => Loom.svg("rect", { x, y, width: w, height: h, rx: o.r, fill: "none", stroke: ctx.c(o.stroke), "stroke-width": o.sw, "stroke-dasharray": o.dash, "stroke-linecap": "round" }, p);
    const rowsG = [1, 2].map((i) => {
      const y = CY[i], cy = y + CH / 2;
      const outer = Loom.svg("g", { opacity: 0, visibility: "hidden" }, sg);
      const inner = Loom.svg("g", {}, outer);
      Loom.svg("rect", { x: 20, y: y, width: 720, height: CH, rx: 12, fill: ctx.c("field"), opacity: 0.55 }, inner);
      dash(inner, 20, y, 720, CH, { r: 12, sw: 4, stroke: "ink", dash: "14 10" });
      dash(inner, 30, y - 32, TW, TH, { r: 10, sw: 3, stroke: "muted", dash: "10 8" });
      return { outer, inner, cy, i: i - 1 };
    });
    const tEnd = ctx.end;
    const backOut = (u) => { const c = 1.9; const x = u - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
    rowsG.forEach((r) => {
      Loom.drive((e) => {
        const t = tNow + e * (tEnd - tNow);
        const u = clamp((t - tNow - 0.1 * r.i) / 0.5, 0, 1);
        const sy = 0.15 + 0.85 * backOut(u);
        const tp = t - (tNow + 0.8);
        const w = 0.5 + 0.5 * Math.sin(tp / 1.4 * 2 * Math.PI - Math.PI / 2);
        const f = clamp(tp / 0.7, 0, 1);
        const op = clamp(u * 2, 0, 1) * (1 - f * (0.45 - 0.45 * w));
        r.outer.setAttribute("opacity", num(op));
        r.outer.setAttribute("visibility", op > 0.001 ? "inherit" : "hidden");
        r.inner.setAttribute("transform", "translate(0 " + r.cy + ") scale(1 " + num(sy) + ") translate(0 " + (-r.cy) + ")");
      }, tNow, Math.max(0.1, tEnd - tNow), "linear", { key: "b08.slot" + r.i });
    });

    // 3. the hand-lettered question mark: beside the slots, clear of the row text and the bubble's tail
    const qm = ctx.el("question_mark", { x: 1322, y: 430, w: 120, h: 170, kind: "icon", exit: "recede" });
    const qg = Loom.svg("g", { opacity: 0, visibility: "hidden" }, qm.inner);
    const qr = Loom.svg("g", { transform: "rotate(-8 60 85)" }, qg);
    kit.text(qr, "?", { role: "display", x: 0, y: 0, w: 120, h: 170, align: "center", valign: "middle", color: "accent", weight: 400 });
    Loom.drive((e) => {
      const op = clamp(e * 3, 0, 1);
      qg.setAttribute("opacity", num(op));
      qg.setAttribute("visibility", op > 0.001 ? "inherit" : "hidden");
      qg.setAttribute("transform", "translate(60 85) scale(" + num(1.9 - 0.9 * e) + ") translate(-60 -85)");
    }, tMiss, 0.5, "overshoot", { key: "b08.qm" });

    // 4. faces: one drive per person, never neutral
    const faceAt = {
      nina: (t) => (t >= tMiss + 1.6 ? "happy" : "explaining"),
      theo: (t) => (t >= tMiss ? "explaining" : "happy"),
    };
    for (const who of ["nina", "theo"]) {
      const F = faces[who]; if (!F) continue;
      const T0 = ctx.start, T1 = ctx.end;
      Loom.drive((e, raw) => {
        const want = faceAt[who](T0 + raw * (T1 - T0));
        for (const em of EMOS) F[em].style.visibility = em === want ? "visible" : "hidden";
      }, T0, Math.max(0.1, T1 - T0), "linear", { kind: "character", beat: ctx.beat.id, name: who, content: true });
    }
  },
});
