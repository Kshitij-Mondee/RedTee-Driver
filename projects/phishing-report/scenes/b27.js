// @design route_around_the_source: a separate path is drawn from the organisation's own records to the destination, going around the message that made the ask
/* b27 - check it by a route you find yourself, not the number or link in the message. Then report it.
 * Treatments considered: (A) the message stays centred and a card of "official channels" slides in beside it
 * (rejected: words stand in for the route); (B) a map with two roads, one crossed out (rejected: it leaves the
 * message behind instead of showing the message as the thing we do not use); (C) CHOSEN: the one camera move the
 * storyboard asks for, a pan right that also eases wide. The mail screen and the held message slide left, and the
 * dark wall that b23 drew past the frame is there to the right: the company's records (a filing cabinet and a
 * binder) and, further right, the supplier's building, both standing on the desk's far edge. A route draws from
 * the records to the building without touching the message; the link and the number in the message's own foot
 * (msg_link, msg_number, drawn in b24) are struck through; the report button in the message's toolbar presses.
 * The pan is one transform shared by every scene group of this station (the world pans as one picture), so b28
 * can pick the message up exactly where this scene leaves it (st.__panEnd).
 */
Loom.scene("b27", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, st = ctx.station, rec = Loom.ctxScene, D = Loom.data;
    const DUR = { pan: 2.4, out: 0.4, fade: 0.3, draw: 1.3, wall: 1.0, strike: 0.5 };   // the durations this scene owns (seconds)
    const tags = (props && props.tags) || [];
    const tagRoute = tags[0] || "a route you find yourself";
    const tagReport = tags[1] || "then report it";

    // ---- hold everything the previous scene still shows: the room, the mail screen, the message with all it carries
    const prev = Loom.world.sceneRecs[rec.index - 1];
    const held = {};
    if (prev) prev.els.forEach((e) => { if (e && !e.motif && !held[e.name]) held[e.name] = ctx.held(e.name); });
    const msg = held["supplier_msg"], mw = held["mail_window"], dw = held["desk_world"];
    const M = msg && msg.w > 200 && msg.h > 150 ? { x: msg.x, y: msg.y, w: msg.w, h: msg.h } : { x: 170, y: 120, w: 1010, h: 760 };
    // b24's link and number are children of the message: look inside it (earlier acts of the lesson also have a "msg_link")
    const find = (n) => (msg ? Array.from(msg.inner.querySelectorAll(".lm-el")).map((x) => x.__E).find((e) => e && e.name === n) : null) || null;

    // ---- the world to the right of the mail screen, in station coordinates (the pan carries all of it)
    const mailR = mw && mw.w > 0 ? mw.x + mw.w : M.x + M.w + 590;
    const gy = (dw ? dw.y + 1930 : M.y + M.h + 50) - 4;       // the desk's far edge, where the records and the building stand
    const recX = mailR + 60, recW = 290, bSize = 250, bX = recX + 580;
    const extL = Math.min(M.x, mw ? mw.x : M.x) - 10, extR = bX + 180, extW = extR - extL;
    const Mc = M.y + M.h / 2;

    // ---- the one camera move: a pan right, easing wide so message, records and building share the frame
    const sW = 1728 / extW, sH = (922 - Mc) / (gy + 70 - Mc);
    const s1 = Math.max(0.6, Math.min(1, sW, sH));
    const tx1 = 96 + (1728 - s1 * extW) / 2 - s1 * extL, ty1 = Mc * (1 - s1);
    st.__panEnd = { s: s1, tx: tx1, ty: ty1 };
    const groups = Array.from(st.svg.children).filter((n) => n.getAttribute && n.getAttribute("class") === "lm-scene");
    const tPan = ctx.cue("If it might be genuine");
    // written as a plain transform on each group (origin 0,0), so the map is exact whatever each group contains
    Loom.drive((e) => {
      const a = `translate(${(tx1 * e).toFixed(2)} ${(ty1 * e).toFixed(2)}) scale(${(1 + (s1 - 1) * e).toFixed(4)})`;
      groups.forEach((g) => g.setAttribute("transform", a));
    }, tPan, DUR.pan, "editorial", { kind: "camera_pan", beat: ctx.beat.id, content: true });
    const tRoute = ctx.cue("by a route you find yourself"), tFind = ctx.cue("find yourself");
    const tNum = ctx.cue("the number"), tLinkIn = ctx.cue("link in");
    const tRep = ctx.cue("Then report it");

    // ---- the stops: a dashed stroke struck across the link and the number the message already carries (b24)
    // @form strike_out_stroke: one dashed stroke struck across an item to cancel it
    const strike = (name, src, fb, t) => {
      let bb = null;
      try { bb = src && src.inner.getBBox(); } catch (e) { bb = null; }
      const w = (bb && bb.width > 20 ? bb.width : fb.w) + 24, h = 72;
      const x0 = M.x + (src ? src.x : fb.x) - 12, y0 = M.y + (src ? src.y : fb.y) - 12;
      const E = ctx.el(name, { x: x0, y: y0, w, h, kind: "mark", exit: "none" });
      kit.path(E.inner, dashed(0, h - 6, w, 6, 22, 12), { stroke: "accent2", sw: 8 });
      m.draw(E, t, { dur: DUR.strike });
      return E;
    };
    strike("stop_number", find("msg_number"), { x: 500, y: 704, w: 290 }, tNum);
    strike("stop_link", find("msg_link"), { x: 50, y: 704, w: 390 }, tLinkIn);

    // ---- the report button in the message's own toolbar, and its tag
    // @form press_button: a button that presses down and springs back at the word that names the action
    const bh = 60, bsize = Math.max(S.pack.type.label[0], Math.min(S.pack.type.label[1], Math.round(bh * 0.42)));
    const bw = Math.ceil(kit.measure("Report", "label", bsize, 700) + bh * 0.9);
    const rb = ctx.el("report_button", { x: M.x + M.w - 40 - bw, y: M.y + 16, w: bw, h: bh, kind: "card", exit: "none" });
    Loom.ui.button(ctx, rb, { x: 0, y: 0, label: "Report", h: bh, w: bw, fill: "accent" });
    m.pop(rb, tRep, { overshoot: false });
    m.press(rb, tRep + 0.6);
    Loom.sfx("click", tRep + 0.6);
    const tg2 = D.tag(ctx, "report_tag", { x: 0, y: 0, text: tagReport, role: "lead", color: "accent", textColor: "onAccent", t: tRep + 0.15 });
    tg2.exit = "none";
    kit.place(tg2, M.x + M.w + 24, M.y + 16 + (bh - tg2.h) / 2);

    // ---- the separate route: skyline behind, the records, the supplier's building
    const sky = Loom.array(ctx, "skyline", { x: recX + 40, y: gy - 230, cols: 8, rows: 1, dx: 84, w: 672, h: 230, order: "centre", t: tRoute, stagger: 0.07,
      draw: (g, i, r, c, rnd) => {
        const h = 80 + rnd() * 140;
        kit.rect(g, 0, 230 - h, 60, h, { fill: "surface2", r: 3, flat: true });
        for (let k = 0; k < 3; k++) for (let j = 0; j < Math.floor(h / 44); j++) if (rnd() > 0.45) kit.rect(g, 9 + k * 16, 230 - h + 12 + j * 40, 8, 13, { fill: "line", r: 1, flat: true });
      } });
    sky.life.setAttribute("opacity", "0.55");
    sky.exit = "none";

    // @form filing_records: a cabinet of drawers with a binder beside it, the organisation's own records
    const R = ctx.el("records", { x: recX, y: gy - 270, w: recW, h: 270, kind: "scenery", exit: "none" });
    kit.rect(R.inner, 0, 20, 140, 250, { fill: "surface", r: 8, shade: "recipe" });
    kit.rect(R.inner, 22, 6, 96, 20, { fill: "ink", r: 2, flat: true });
    for (let i = 0; i < 3; i++) {
      const y = 32 + i * 76;
      kit.rect(R.inner, 10, y, 120, 66, { fill: "surface2", r: 5, flat: true });
      kit.rect(R.inner, 46, y + 12, 48, 14, { fill: "line", r: 3, flat: true });
      kit.rect(R.inner, 52, y + 40, 36, 8, { fill: "accent4", r: 4, flat: true });
    }
    m.settle(R, tRoute + 0.05, { dy: 30 });
    Loom.obj.draw(ctx, "records_binder", "folder", { x: 218, y: 270 - 62, size: 150, family: "binder", tone: "accent3", detail: 3, t: tRoute + 0.3, parent: R.inner }).exit = "none";

    const B = Loom.obj.draw(ctx, "supplier_building", "building", { x: bX, y: gy - 0.47 * bSize, size: bSize, family: "tower", tone: "accent4", detail: 3, t: tRoute + 0.5 });
    B.exit = "none";
    const nm = ctx.el("supplier_name", { x: bX - 190, y: gy + 14, w: 380, h: 52, kind: "text", exit: "none" });
    kit.text(nm.inner, "Quillmoor Supplies", { role: "lead", x: 0, y: 0, w: 380, h: 52, align: "center", color: "muted", maxLines: 1 });
    m.reveal(nm, tRoute + 0.9, { dy: 8 });

    // the route itself: from the records to the building, touching nothing the message owns
    const ax = recX + recW + 8, bx = bX - 96, rw = bx - ax;
    const route = ctx.el("route", { x: ax, y: gy - 215, w: rw, h: 130, kind: "connector", exit: "none" });
    const arr = kit.arrow(route.inner, 0, 110, rw, 110, { bend: -80, stroke: "accent3", sw: 7 });
    m.draw(arr, tRoute + 0.7, { dur: DUR.draw });
    const dot = ctx.el("route_dot", { x: 0, y: 0, w: 24, h: 24, kind: "token", parent: route.inner, exit: "none" });
    kit.disc(dot.inner, 0, 0, 12, { fill: "ink", flat: true, shadow: false });
    const tDot = tRoute + 2.2;
    m.pop(dot, tDot - 0.2, { overshoot: false });
    m.along(dot, arr.path, tDot, { dur: DUR.draw });
    Loom.tween(dot.inner, { opacity: 1 }, { opacity: 0, duration: DUR.fade, ease: Loom.ease.exit, immediateRender: false }, tDot + DUR.draw, { kind: "exit", beat: ctx.beat.id, name: "route_dot" });
    // an arrival ping at the foot of the building when the dot gets there
    const ping = ctx.el("arrival_ping", { x: bX - 130, y: gy - 20, w: 260, h: 40, kind: "mark", exit: "none" });
    const ring = Loom.svg("ellipse", { cx: 130, cy: 20, rx: 10, ry: 4, fill: "none", stroke: S.c("accent3"), "stroke-width": 4, opacity: 0 }, ping.inner);
    Loom.drive((e) => { ring.setAttribute("rx", (10 + 110 * e).toFixed(1)); ring.setAttribute("ry", (4 + 14 * e).toFixed(1)); ring.setAttribute("opacity", (0.7 * Math.sin(Math.PI * e)).toFixed(3)); }, tDot + DUR.draw - 0.1, 1.0, "enter", { kind: "ambient", beat: ctx.beat.id, name: "arrival_ping" });

    // the tag names the route, centred over its arc (two short lines so it stays clear of the records and the building)
    const words = tagRoute.split(" "), half = Math.ceil(words.length / 2);
    const tg1 = D.tag(ctx, "route_tag", { x: 0, y: 0, lines: [words.slice(0, half).join(" "), words.slice(half).join(" ")], role: "lead", color: "accent3", textColor: "onAccent", t: tFind });
    tg1.exit = "none";
    kit.place(tg1, ax + rw / 2 - tg1.w / 2 - 14, gy - 270 - tg1.h);

    // ---- leave together: one quiet fade of this scene's own layer and of the room and screen that were held, instead of
    // the engine's long staggered exit cascade. The message (with everything inside it) and its avatar stay: b28 takes them.
    const tOut = ctx.speechEnd + 0.12;
    Object.keys(held).forEach((n) => {
      const h = held[n];
      if (!h || n === "supplier_msg") return;
      h.exit = "none";
      const inside = msg && msg.inner.contains(h.outer) && h !== msg;
      if (!inside && n !== "contact_avatar") Loom.tween(h.outer, { opacity: 1 }, { opacity: 0, duration: DUR.out, ease: Loom.ease.exit }, tOut, { kind: "exit", beat: ctx.beat.id, name: n });
    });
    rec.els.forEach((e) => { if (e.scene === rec) e.exit = "none"; });
    Loom.tween(ctx.g, { opacity: 1 }, { opacity: 0, duration: DUR.out, ease: Loom.ease.exit }, tOut, { kind: "exit", beat: ctx.beat.id, name: "b27 layer" });

    // dashed strokes are built from short segments so m.draw can still reveal them along their length
    function dashed(x1, y1, x2, y2, on, off) {
      const L = Math.hypot(x2 - x1, y2 - y1), n = Math.floor(L / (on + off));
      let d = "";
      for (let i = 0; i <= n; i++) {
        const a = (i * (on + off)) / L, b = Math.min(1, (i * (on + off) + on) / L);
        d += `M${(x1 + (x2 - x1) * a).toFixed(1)} ${(y1 + (y2 - y1) * a).toFixed(1)}L${(x1 + (x2 - x1) * b).toFixed(1)} ${(y1 + (y2 - y1) * b).toFixed(1)}`;
      }
      return d;
    }
  },
});
