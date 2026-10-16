// @design request_route_board: a process as a route across a real floor plan; the desk that owns the work is the one blue thing, a finished desk keeps a quiet teal tick
// @lab {"title": "corporate-clean example: an expense request's route across a floor (one owner at a time, one accent)", "styles": ["corporate-clean"], "dur": 12.5, "times": [1.6, 3.1, 4.7, 6.2, 7.8, 9.4, 10.9], "words": [{"w": "Say", "s": 0.4, "e": 0.61}, {"w": "Priya", "s": 0.65, "e": 0.92}, {"w": "sends", "s": 0.96, "e": 1.23}, {"w": "an", "s": 1.27, "e": 1.45}, {"w": "expense", "s": 1.49, "e": 1.82}, {"w": "request", "s": 1.86, "e": 2.19}, {"w": "It", "s": 2.48, "e": 2.66}, {"w": "goes", "s": 2.7, "e": 2.94}, {"w": "to", "s": 2.98, "e": 3.16}, {"w": "finance", "s": 3.2, "e": 3.53}, {"w": "first", "s": 3.57, "e": 3.84}, {"w": "who", "s": 3.98, "e": 4.19}, {"w": "check", "s": 4.23, "e": 4.5}, {"w": "the", "s": 4.54, "e": 4.75}, {"w": "receipt", "s": 4.79, "e": 5.12}, {"w": "Then", "s": 5.41, "e": 5.65}, {"w": "it", "s": 5.69, "e": 5.87}, {"w": "moves", "s": 5.91, "e": 6.18}, {"w": "to", "s": 6.22, "e": 6.4}, {"w": "her", "s": 6.44, "e": 6.65}, {"w": "manager", "s": 6.69, "e": 7.02}, {"w": "who", "s": 7.16, "e": 7.37}, {"w": "approves", "s": 7.41, "e": 7.77}, {"w": "it", "s": 7.81, "e": 7.99}, {"w": "One", "s": 8.28, "e": 8.49}, {"w": "route", "s": 8.53, "e": 8.8}, {"w": "and", "s": 8.94, "e": 9.15}, {"w": "at", "s": 9.19, "e": 9.37}, {"w": "every", "s": 9.41, "e": 9.68}, {"w": "moment", "s": 9.72, "e": 10.02}, {"w": "one", "s": 10.06, "e": 10.27}, {"w": "desk", "s": 10.31, "e": 10.55}, {"w": "owns", "s": 10.59, "e": 10.83}, {"w": "it", "s": 10.87, "e": 11.05}], "_timing": "estimated from the narration at about 180 wpm (no TTS run); a composed lesson uses the real word timings"}
/* Style example for corporate-clean (docs/styles/guides/corporate-clean.md, recipe R1). Not a lesson beat: a model
 * of the register for scene authors and API scene workers. Written for this narration (a hypothetical case, so no
 * facts to ground):
 *   "Say Priya sends an expense request. It goes to finance first, who check the receipt. Then it moves to her
 *    manager, who approves it. One route, and at every moment one desk owns it."
 * What it shows, per the guide:
 *   - a PLACE (an isometric office floor with three desks), not a card of steps (s6, s9);
 *   - one accent, placed: the desk that holds the request sits on a blue floor tile; the tile goes when the request
 *     leaves, so blue always means "who has it now" (s2);
 *   - outcome colour keeps one meaning: pos (teal) only on finished desks and the final state (s2);
 *   - neutrals carry the set: field, surface2 floor, surface desks, ink screens, line route (s2, s5);
 *   - labels sit ON the thing they name, white pills with a leader, label role at 30 px (iso.label sets the role's
 *     top size) (s3, s4);
 *   - motion: the route draws, the request TRAVELS (the change over time is the point), nothing pops or bounces
 *     (s7); every reveal is on its spoken word through ctx.cue.
 * Real APIs only: ctx.iso (iso.tile, iso.box, iso.arrow, iso.label, iso.done), Loom.obj.draw, m.reveal, m.draw,
 * m.grow, m.travel, kit.mark, Loom.data.tag, Loom.tween, Loom.sfx (docs/SCENE_API.md; runtime/iso.js, objects.js,
 * data.js, motion.js, kit.js).
 */
Loom.scene("style_corporate_clean_request_route", {
  build(ctx) {
    const { kit, m } = ctx;
    // ---- times, all from the narration (reveal on the word; nothing after ~85 % of the speech)
    const tSend = ctx.cue("sends an expense request");
    const tFin = ctx.cue("goes to finance first");
    const tCheck = ctx.cue("check the receipt");
    const tMgr = ctx.cue("moves to her manager");
    const tOk = ctx.cue("approves it");

    // ---- the place: one floor, three desks along a route (unit 80 fills about 70 % of the safe area)
    const iso = ctx.iso({ x0: 700, y0: 210, unit: 80 });
    const floor = iso.tile("floor", -1, -0.5, 14, 5.2, { fill: "surface2" });   // its near corner stops above the caption band (y < 930)
    // the desk that owns the request stands on a blue tile; drawn now, shown on its word (tiles sit under the boxes)
    const DESKS = [
      { id: "priya", x: 0, label: "Priya" },
      { id: "finance", x: 5, label: "Finance" },
      { id: "manager", x: 10, label: "Manager" },
    ];
    const own = DESKS.map((d) => iso.tile(`own_${d.id}`, d.x - 0.35, 1.15, 2.9, 1.9, { fill: "accent" }));
    // a desk is a thin top on a drawer pedestal and a side panel (a box that tall reads as a crate, not a desk)
    const desks = DESKS.map((d) => [
      iso.box(`desk_${d.id}_ped`, d.x + 1.5, 1.6, 0, 0.6, 1.0, 0.62, { fill: "surface2" }),
      iso.box(`desk_${d.id}_side`, d.x + 0.05, 1.6, 0, 0.1, 1.0, 0.62, { fill: "surface2" }),
      iso.box(`desk_${d.id}_top`, d.x, 1.5, 0.62, 2.2, 1.2, 0.1, { fill: "surface" }),
    ]);
    const screens = DESKS.map((d) => iso.box(`screen_${d.id}`, d.x + 0.7, 1.55, 0.72, 0.9, 0.1, 0.62, { fill: "ink" }));
    // the route: plain connectors in the line token, ending short of the next desk so no desk hides the head
    const legs = [
      iso.arrow("leg_1", [2.5, 2.1, 0.02], [4.4, 2.1, 0.02], { stroke: "line", sw: 5 }),
      iso.arrow("leg_2", [7.5, 2.1, 0.02], [9.4, 2.1, 0.02], { stroke: "line", sw: 5 }),
    ];
    // labels hang from the top of each screen, so the leader never crosses the drawing
    const LIFT = 70, LZ = 1.34;
    const labels = DESKS.map((d) => iso.label(`label_${d.id}`, d.x + 1.15, 1.6, LZ, d.label, { lift: LIFT }));
    iso.done();

    // ---- build the set first (structure before content), quick and quiet
    m.reveal(floor, tSend - 0.6, { dy: 0 });
    desks.forEach((parts, i) => parts.forEach((D) => m.grow(D, tSend - 0.5 + i * 0.08)));
    screens.forEach((D, i) => m.reveal(D, tSend - 0.3 + i * 0.08, { dy: 0 }));
    labels.forEach((L, i) => m.reveal(L, tSend - 0.2 + i * 0.08, { dy: 8 }));
    own.forEach((T) => Loom.set(T.outer, { opacity: 0 }, 0));

    // ---- the request: a real document, carried desk to desk (screen coordinates from the plane)
    const at = (i) => iso.P(DESKS[i].x + 0.75, 2.35, 0.72);   // on the desk top, in front of the screen
    const [ax, ay] = at(0), [bx, by] = at(1), [cx, cy] = at(2);
    // Two legs = two carriers, one m.travel each. Two travels on ONE element both render their start state at load
    // (m.travel's drive has no key), so the second leg's start (the finance desk) would show from frame 0; seen in
    // the preview of this scene, request "M.travel drive key" in the guide s15.
    // Each carrier's box hugs the document (true boxes: the joins, the camera and the layout checks measure them);
    // the document is centred in it at (ax, ay - 40). Travel moves a carrier relative to where it was placed.
    const CB = 174;
    const leg1 = ctx.el("request_carrier_1", { x: ax - CB / 2, y: ay - 40 - CB / 2, w: CB, h: CB, kind: "token" });
    const leg2 = ctx.el("request_carrier_2", { x: 0, y: 0, w: CB, h: CB, kind: "token", parent: leg1.inner });
    const doc = Loom.obj.draw(ctx, "request_doc", "document", { x: CB / 2, y: CB / 2, size: 96, tone: "surface", detail: 2, parent: leg2.inner });
    // a done desk's tick sits beside its label (same centre line), never on top of it
    const tickAt = (i) => {
      const [px, py] = iso.P(DESKS[i].x + 1.15, 1.6, LZ), size = Loom.style.size("label");
      const w = Math.ceil(kit.measure(DESKS[i].label, "label", size, 700) + 64);
      return { x: px + w / 2 + 14, y: py - LIFT - 30 };
    };
    m.reveal(doc, tSend + 0.1, { dy: 14 });

    // who owns it: one blue tile at a time
    // @form owner_tile: the floor tile under whoever holds the work, the only accent in the frame
    const showOwn = (i, t0, t1) => {
      Loom.tween(own[i].outer, { opacity: 0 }, { opacity: 1, duration: Loom.style.dur("exit") }, t0, { kind: "reveal", name: own[i].name, content: true });
      if (t1 != null) Loom.tween(own[i].outer, { opacity: 1 }, { opacity: 0, duration: Loom.style.dur("exit"), immediateRender: false }, t1, { kind: "exit", name: own[i].name });
    };
    showOwn(0, tSend + 0.1, tFin);

    // leg 1: the route draws ahead of the request, then the request travels it (the motion is the content)
    m.reveal(legs[0], tFin - 0.05, { dy: 0, dur: 0.01 });
    m.draw(legs[0].path, tFin, { dur: 0.6 });
    m.reveal({ inner: legs[0].head }, tFin + 0.5, { dy: 0 });
    m.travel(leg1, tFin + 0.2, { x: bx - ax, y: by - ay, dur: 1.0 });
    showOwn(1, tFin + 1.0, tMgr);
    Loom.sfx("card", tFin + 1.15);

    // finance checks: a short nudge on the document (a gesture, not a new object), then the desk is done
    m.nudge(doc, tCheck, { dy: -10 });
    const tick = (i, name) => {
      const p = tickAt(i), E = ctx.el(name, { x: p.x, y: p.y, w: 60, h: 60, kind: "mark" });
      kit.mark(E.inner, "yes", 30, 30, 56);
      return E;
    };
    const tick0 = tick(0, "done_priya"), tick1 = tick(1, "done_finance");
    m.reveal(tick0, tFin + 0.3, { dy: 6 });
    m.reveal(tick1, tMgr - 0.1, { dy: 6 });

    // leg 2, then the manager approves: the final state is named once, in the outcome colour
    m.reveal(legs[1], tMgr - 0.05, { dy: 0, dur: 0.01 });
    m.draw(legs[1].path, tMgr, { dur: 0.6 });
    m.reveal({ inner: legs[1].head }, tMgr + 0.5, { dy: 0 });
    m.travel(leg2, tMgr + 0.2, { x: cx - bx, y: cy - by, dur: 1.0 });   // relative to leg 1's end
    showOwn(2, tMgr + 1.0, null);
    const tick2 = tick(2, "done_manager");
    m.reveal(tick2, tOk + 0.1, { dy: 6 });
    Loom.data.tag(ctx, "state_approved", { x: cx - 40, y: cy + 150, text: "Approved", color: "pos", t: tOk + 0.25 });
    Loom.sfx("success", tOk + 0.3);

    // "one desk owns it": nothing new arrives; the frame holds on the finished route, the blue tile is the answer
  },
});
