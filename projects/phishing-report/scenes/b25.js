// @design known_name_flows_into_message: a familiar name glows, threads run from it out to a small office floor and what it knows flows back into the message, then empty rings ask the viewer to find the signs
/* b25 - "The name is familiar, and that is the point. Targeted phishing uses what it knows about a company and its
 *        people. See if you can find the three signs." (station st_supplier, continues b24; 2.5 s of pause after).
 * Treatments considered:
 *  (A) a caption-style definition card for "targeted phishing" (rejected: words standing in for the thing; the
 *      point is that the sender KNOWS, which is a flow, not a sentence),
 *  (B) a spy-board of photos and string (rejected: fear imagery, not this register),
 *  (C) CHOSEN: the message stays; its sender's name glows (heat ink to accent) and is tagged; a small cutaway of
 *      the office (a seeded array of desks with grey people, three of them known) arrives beside it; thin threads
 *      run from the name out to those three people, and what they know flows back along a second set of threads
 *      into the message as small travelling dots. Then the office steps back, three empty dashed rings are drawn
 *      beside the message and the frame holds still for the pause (a slow breath only).
 * Beat sheet (anchors are spoken words):
 *   "The name is familiar"                       name heats to accent, a halo and an underline, the tag wipes in
 *   "Targeted phishing uses what it knows"       the office cutaway and its desks arrive (centre out); threads draw from the name
 *   "about a company and its people"             a second set of threads draws from the people to the message; dots flow along it
 *   "See if you can find the three signs"        threads and office step back; three dashed rings draw; the tag wipes in
 *   (pause)                                      Loom.hold.breathe on the message only
 * Names: name_glow, familiar_tag, office_panel, office_floor, threads, thread_dot_1..3, pin_ring_1..3, signs_tag
 * (the rings and tags are children of supplier_msg, so b26 to b28 hold them with it).
 */
Loom.scene("b25", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, D = Loom.data, svg = Loom.svg, bid = ctx.beat.id;
    const P = Object.assign({ tags: ["familiar name", "the three signs"] }, props || {});

    // ---- geometry (station coords; the same numbers as b24 and b26)
    const WIN = { x: 170, y: 120, w: 1010, h: 760 };
    const OF = { x: 1262, y: 215, w: 500, h: 340 };                          // the office cutaway
    const CELL = { w: 84, h: 74, dx: 112, dy: 88, px: 36, py: 70 };
    const RING = { x: 1045, r: 28, ys: [182, 327, 481] };                    // window-local: flag centre = line top - 52
    const dEnter = S.dur("enter"), dMove = S.dur("move");
    const tFam = ctx.cue("The name is familiar"), tTarget = ctx.cue("Targeted phishing uses what it knows"), tPeople = ctx.cue("about a company and its people");
    const tSigns = ctx.cue("See if you can find the three signs"), tSignTag = ctx.cue("find the three signs");
    const pin = (E) => { E.exit = "none"; if (E.outer.querySelectorAll) E.outer.querySelectorAll(".lm-el").forEach((n) => { if (n.__E) n.__E.exit = "none"; }); return E; };
    const cub = (p0, c1, c2, p3, u) => { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p3[1]]; };
    const cd = (a, b, c, d) => `M${a[0]} ${a[1]} C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`;

    // ---- held from b24: the room, the screen, the veiled list, the message (with everything inside it) and its avatar
    ["desk_world", "key_light", "mail_window", "inbox", "new_message_row", "inbox_veil", "contact_avatar"].forEach((n) => ctx.held(n));
    ["line_1", "line_2", "attachment_chip"].forEach((n) => ctx.held(n));   // passed on to b26, which works on them (orchestrator fix)
    const msg = ctx.held("supplier_msg"), mi = msg.inner, sName = ctx.held("sender_name");
    const nameNode = sName.inner.querySelector("text"), nameW = nameNode && nameNode.__fit ? nameNode.__fit.width : 430;

    // ---- 1. the familiar name: it heats to the accent, a soft halo rings the avatar, an underline runs under the name, the tag names it
    // @form name_heat_halo: a sender's name recoloured to the accent with a stacked-disc halo round its avatar and an underline, tagged
    Loom.hold.heat([sName], tFam, { from: "ink", to: "accent", dur: 1.2, name: "sender_name" });
    const glow = ctx.el("name_glow", { parent: mi, x: 0, y: 0, w: 0, h: 0, kind: "scenery", exit: "none" });
    [64, 54, 46].forEach((r, i) => svg("circle", { cx: 80, cy: 70, r, fill: S.c("accent"), opacity: 0.07 + i * 0.04 }, glow.inner));
    mi.insertBefore(glow.outer, Array.from(mi.children).find((c) => c !== glow.outer && c.getAttribute && c.getAttribute("class") === "lm-el") || null);   // under the header text and the avatar, over the header band
    kit.rect(glow.inner, 140, 92, nameW, 4, { fill: "accent", r: 2, crisp: true });
    m.reveal(glow, tFam, { dy: 0, dur: dEnter });
    const ftag = D.tag(ctx, "familiar_tag", { x: 352, y: 100, text: P.tags[0], role: "caption", pad: 10, color: "accent", t: tFam + 0.5 });
    mi.appendChild(ftag.outer); pin(ftag);

    // ---- 2. the office: a cutaway panel, a seeded array of desks with grey people, three of them known to the sender
    // @form office_floor_array: a small cutaway of an open office as a seeded grid of desks with grey seated people, a few ringed as known
    const panel = ctx.el("office_panel", { x: OF.x, y: OF.y, w: OF.w, h: OF.h, kind: "scenery", exit: "recede" });
    kit.rect(panel.inner, 0, 0, OF.w, OF.h, { fill: "field2", r: 16, stroke: "line", sw: 2, crisp: true });
    kit.rect(panel.inner, 2, 232, OF.w - 4, OF.h - 234, { fill: "surface2", r: 14, crisp: true, opacity: 0.7 });
    [[34, 16], [OF.w - 134, 16]].forEach(([x, y]) => { kit.rect(panel.inner, x, y, 100, 34, { fill: "accent3", r: 6, crisp: true, opacity: 0.16 }); kit.line(panel.inner, x + 50, y, x + 50, y + 34, { stroke: "line", sw: 2, crisp: true }); });
    m.settle(panel, tTarget, { dy: 24 });
    const KNOWN = { 2: 1, 5: 1, 10: 1 };                                   // desks whose people the sender has learned about
    const office = Loom.array(ctx, "office_floor", { x: OF.x + CELL.px, y: OF.y + CELL.py, w: 4 * CELL.dx, h: 3 * CELL.dy, cols: 4, rows: 3, dx: CELL.dx, dy: CELL.dy, order: "centre", t: tTarget + 0.25, stagger: 0.07, rise: 14, seed: "supplier_office",
      draw: (g, i, r, c, rnd) => {
        const k = KNOWN[i] ? "accent4" : "line";
        kit.disc(g, 42, 14, 9, { fill: k, flat: true, shadow: false });
        kit.rect(g, 27, 25, 30, 26, { fill: k, r: 12, crisp: true, opacity: 0.8 });
        kit.rect(g, 28, 33, 28, 18, { fill: "surface", r: 3, stroke: "line", sw: 2, crisp: true });          // the monitor's back
        kit.rect(g, 4, 46, 76, 22, { fill: "surface", r: 4, stroke: "line", sw: 2, crisp: true });          // the desk
        if (rnd() < 0.6) kit.disc(g, 20 + rnd() * 44, 57, 3, { fill: "accent3", flat: true, shadow: false });
        if (KNOWN[i]) svg("circle", { cx: 42, cy: 14, r: 17, fill: "none", stroke: S.c("accent"), "stroke-width": 3 }, g);
      } });

    // ---- 3. threads: the name reaches out to the three known people, and what they know flows back into the message
    // @form knowledge_threads: thin threads drawn from one source out to several people and back, with small dots travelling toward the target
    const head = (c, r) => [OF.x + CELL.px + c * CELL.dx + 42, OF.y + CELL.py + r * CELL.dy + 14];
    const HEADS = [head(2, 0), head(1, 1), head(2, 2)];
    const S0 = [WIN.x + 140 + nameW + 16, WIN.y + 58];
    const ENDS = [[WIN.x + WIN.w + 2, 245], [WIN.x + WIN.w + 2, 380], [WIN.x + WIN.w + 2, 524]];
    const th = ctx.el("threads", { x: 0, y: 0, w: 0, h: 0, kind: "connector", exit: "recede" });
    const gOut = svg("g", {}, th.inner), gIn = svg("g", {}, th.inner);
    HEADS.forEach((h, i) => {
      const c1 = [S0[0] + 260, S0[1] - 70 + i * 30], c2 = [h[0] - 230, h[1] - 60 + i * 20];
      svg("path", { d: cd(S0, c1, c2, h), fill: "none", stroke: S.c("accent4"), "stroke-width": 3, "stroke-linecap": "round", opacity: 0.9 }, gOut);
    });
    const inPath = HEADS.map((h, i) => [h, [h[0] - 150, h[1] + 20 - i * 10], [ENDS[i][0] + 150, ENDS[i][1] - 10 + i * 8], ENDS[i]]);
    inPath.forEach((q) => svg("path", { d: cd(q[0], q[1], q[2], q[3]), fill: "none", stroke: S.c("accent3"), "stroke-width": 3, "stroke-linecap": "round", opacity: 0.9 }, gIn));
    m.draw(gOut, tTarget + 0.9, { dur: dMove * 2.2 });
    m.draw(gIn, tPeople, { dur: dMove * 2.0 });
    inPath.forEach((q, i) => {
      const dot = ctx.el("thread_dot_" + (i + 1), { x: 0, y: 0, w: 0, h: 0, kind: "token", exit: "recede" });
      kit.disc(dot.inner, 0, 0, 9, { fill: "accent", flat: true, shadow: false });
      const t0 = tPeople + 0.9 + i * 0.35, dd = 2.0;
      Loom.set(dot.inner, { opacity: 0 }, 0);
      Loom.tween(dot.inner, { opacity: 0 }, { opacity: 1, duration: dMove * 0.25 }, t0, { kind: "reveal", beat: bid, name: dot.name, content: true });
      Loom.drive((e) => { const [x, y] = cub(q[0], q[1], q[2], q[3], (e * 2) % 1); dot.mover.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`); }, t0, dd, "linear", { kind: "value_travel", beat: bid, name: dot.name, content: true });
      Loom.tween(dot.inner, { opacity: 1 }, { opacity: 0, duration: dMove * 0.33, immediateRender: false }, t0 + dd - 0.2, { kind: "fade", beat: bid, name: dot.name });
    });

    // ---- 4. the job: threads and office step back, three empty dashed rings are drawn beside the message, the tag names them
    const dBack = dMove;
    [th, panel, office].forEach((E) => Loom.tween(E.life, { opacity: 1 }, { opacity: E === th ? 0 : 0.3, duration: dBack, ease: Loom.ease.exit, immediateRender: false }, tSigns - 0.1, { kind: "dim", beat: bid, name: E.name }));
    // @form dashed_pin_ring: an empty ring made of dashed arcs that draw round, waiting to be filled
    const rings = RING.ys.map((cy, i) => {
      const E = ctx.el("pin_ring_" + (i + 1), { parent: mi, x: RING.x - RING.r - 6, y: cy - RING.r - 6, w: (RING.r + 6) * 2, h: (RING.r + 6) * 2, kind: "token", exit: "none" });
      const c = RING.r + 6;
      for (let k = 0; k < 12; k++) {
        const a0 = (k * 30 - 90) * Math.PI / 180, a1 = (k * 30 - 90 + 19) * Math.PI / 180;
        svg("path", { d: `M${(c + RING.r * Math.cos(a0)).toFixed(1)} ${(c + RING.r * Math.sin(a0)).toFixed(1)} A${RING.r} ${RING.r} 0 0 1 ${(c + RING.r * Math.cos(a1)).toFixed(1)} ${(c + RING.r * Math.sin(a1)).toFixed(1)}`, fill: "none", stroke: S.c("accent"), "stroke-width": 4, "stroke-linecap": "round" }, E.inner);
      }
      m.draw(E, tSigns + i * 0.28, { dur: dMove * 1.5 });
      return E;
    });
    const stag = D.tag(ctx, "signs_tag", { x: RING.x - 16, y: RING.ys[2] + 56, text: P.tags[1], color: "accent", t: tSignTag });
    mi.appendChild(stag.outer); pin(stag);

    // ---- 5. the pause: the frame holds still, the message only breathes
    const tHold = ctx.speechEnd - 0.1, tEnd = ctx.end - 0.3;
    Loom.hold.breathe({ mover: msg.life, w: WIN.w, h: WIN.h, name: "supplier_msg" }, tHold, tEnd, { amp: 0.004, period: tEnd - tHold });
    void rings;
  },
});
