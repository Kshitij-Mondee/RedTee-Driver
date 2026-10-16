// @design lens_over_lines: a message is rebuilt and a lens passes over each line looking for a flaw; finding none, every line is marked clean
/* b15 - "You may have learned to spot bad spelling": the old rule, tried on Jo's message and failing.
 * Treatments: (A) a typo list crossed out (rejected: tells), (B) a red-pen proofreader character (rejected: a
 * second character, noise), (C) CHOSEN: the search itself. A drawn magnifier passes over the message line by line;
 * it finds nothing, and each line gets a small clean tick. The message is b03's layout (b02's x4) rebuilt with the
 * same formulas, so the viewer recognises it. Every word on it was spoken in b02 or b03.
 * Elements b16 holds by name: message (+ msg_*), tick_*, magnifier (+ tag_bad_spelling), tag_lead,
 * tag_written_perfectly (+ .0).
 */
Loom.scene("b15", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, svg = Loom.svg, tc = (t) => S.c(t);
    const P = Object.assign({ subject_line: "Confirm your password", deadline: "within the hour", body: "or lose access to the shared drive", button: "Act now", tags: ["bad spelling?", "written perfectly"] }, props || {});
    const U = 4;
    const meta = (name, kind) => ({ kind: kind || "fade", beat: ctx.beat.id, name, content: true });
    const lerp = (a, b, e) => a + (b - a) * e;

    // ---- the message: b03's layout, same coordinates, same formulas
    const msg = ctx.el("message", { x: 0, y: 0, w: 1920, h: 1080, kind: "card" });
    const M = msg.inner;
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: tc("surface") }, M);
    svg("rect", { x: 0, y: 0, width: 1920, height: 22 * U, fill: tc("surface2") }, M);
    ["neg", "accent4", "pos"].forEach((tk, i) => svg("circle", { cx: (14 + i * 14) * U, cy: 11 * U, r: 3.5 * U, fill: tc(tk), opacity: 0.85 }, M));
    m.reveal(msg, ctx.start + 0.05, { dy: 0, dur: 0.5 });
    const part = (name, x, y, w, h) => ctx.el(name, { x, y, w, h, kind: "text", exit: "none", parent: M });
    const tL = ctx.start + 0.3;

    const sender = part("msg_sender", 24 * U, 33 * U, 220 * U, 24 * U);       // avatar, name and address bars, the unread dot
    svg("circle", { cx: 6 * U, cy: 11 * U, r: 11 * U, fill: tc("line") }, sender.inner);
    svg("rect", { x: 26 * U, y: 4 * U, width: 96 * U, height: 6 * U, rx: 3 * U, fill: tc("muted"), opacity: 0.8 }, sender.inner);
    svg("rect", { x: 26 * U, y: 16 * U, width: 150 * U, height: 5 * U, rx: 2.5 * U, fill: tc("line"), opacity: 0.8 }, sender.inner);
    svg("circle", { cx: 456 * U, cy: 44 * U, r: 5 * U, fill: tc("accent") }, M);
    m.unmask(sender, tL);

    const roleFor = (px) => (px >= 96 ? "hero" : "title");
    const subjF = kit.fit(P.subject_line, { role: "label", w: 432, maxLines: 1, weight: 700 });
    const subjPx = subjF.size * U, subjH = Math.ceil(subjF.height * U) + 8;
    const subject = part("msg_subject", 24 * U, 64 * U, 432 * U, subjH);
    kit.text(subject.inner, P.subject_line, { role: roleFor(subjPx), size: subjPx, x: 0, y: 0, w: 432 * U, h: subjH, maxLines: 1, weight: 700 });
    m.unmask(subject, tL + 0.1);

    const hrF = kit.fit(P.deadline, { role: "caption", w: 360, maxLines: 1, weight: 700 }), inset = Math.max(8, Math.ceil(0.25 * hrF.size));
    const chipW = (Math.ceil(hrF.width * 1.06) + 2 * inset + 30) * U   /* 6% room: Chrome lays the scaled-up text out wider (check) */, chipH = (Math.ceil(hrF.height) + 2 * inset) * U, hrPx = hrF.size * U;
    const deadline = part("msg_deadline", 24 * U, 111 * U, chipW, chipH);
    kit.rect(deadline.inner, 0, 0, chipW, chipH, { fill: "accent", r: 8 * U, flat: true });
    kit.icon(deadline.inner, "clock", { x: (inset + 10) * U, y: chipH / 2, size: 20 * U, color: "onAccent" });
    kit.text(deadline.inner, P.deadline, { role: roleFor(hrPx), size: hrPx, x: (inset + 28) * U, y: inset * U, w: chipW - (2 * inset + 28) * U, h: chipH - 2 * inset * U, maxLines: 1, weight: 700, color: "onAccent", valign: "middle" });
    m.unmask(deadline, tL + 0.2);

    const bdF = kit.fit(P.body, { role: "caption", w: 432, maxLines: 1 }), bdPx = bdF.size * U, bdH = Math.ceil(bdF.height * U) + 8;
    const body = part("msg_body", 24 * U, 160 * U, 432 * U, bdH);
    kit.text(body.inner, P.body, { role: roleFor(bdPx), size: bdPx, x: 0, y: 0, w: 432 * U, h: bdH, maxLines: 1 });
    m.unmask(body, tL + 0.3);

    const link = part("msg_link", 24 * U, 221 * U, 120 * U, 5 * U);
    svg("rect", { x: 0, y: 0, width: 120 * U, height: 5 * U, rx: 2.5 * U, fill: tc("accent3") }, link.inner);
    m.unmask(link, tL + 0.4);

    const button = part("msg_button", 336 * U, 196 * U, 120 * U, 32 * U);
    kit.rect(button.inner, 0, 0, 120 * U, 32 * U, { fill: "accent", r: 8 * U, flat: true });
    kit.text(button.inner, P.button, { role: "title", size: 72, x: 20, y: 18, w: 120 * U - 40, h: 32 * U - 36, align: "center", valign: "middle", maxLines: 1, weight: 800, color: "onAccent" });
    m.unmask(button, tL + 0.5);
    [sender, subject, deadline, body, link, button].forEach((E) => { E.revealT = E.revealT == null ? tL : E.revealT; });

    // where each lettered line sits on the station, and where it ends
    const rows = {
      subject: { y: 64 * U + subjH / 2, end: 24 * U + subjF.width * U },
      deadline: { y: 111 * U + chipH / 2, end: 24 * U + chipW },
      body: { y: 160 * U + bdH / 2, end: 24 * U + bdF.width * U },
      button: { y: 196 * U + 16 * U, end: 336 * U },
    };

    // ---- the magnifier: a lens and handle (drawn at 1.5x) in one element; the tag rides it in
    const CC = 165, mag = ctx.el("magnifier", { x: 0, y: 0, w: 700, h: 450, kind: "instrument" });
    const mi = svg("g", { transform: "scale(1.5)" }, mag.inner);
    kit.line(mi, 171 - 1, 171 - 1, 255, 255, { stroke: "field", sw: 28 });
    kit.line(mi, 171 - 1, 171 - 1, 255, 255, { stroke: "muted", sw: 18 });
    kit.disc(mi, 262, 262, 16, { fill: "accent4", shade: "recipe" });
    svg("circle", { cx: 110, cy: 110, r: 86, fill: tc("accent3"), opacity: 0.12 }, mi);
    svg("circle", { cx: 110, cy: 110, r: 86, fill: "none", stroke: tc("accent4"), "stroke-width": 14 }, mi);
    svg("circle", { cx: 110, cy: 110, r: 78, fill: "none", stroke: tc("field"), "stroke-width": 3, opacity: 0.8 }, mi);
    svg("path", { d: "M60 86 A56 56 0 0 1 96 54", fill: "none", stroke: tc("ink"), "stroke-width": 6, "stroke-linecap": "round", opacity: 0.55 }, mi);
    const setMag = (x, y, a) => mag.mover.setAttribute("transform", `translate(${(x - CC).toFixed(1)} ${(y - CC).toFixed(1)}) rotate(${a.toFixed(2)} ${CC} ${CC})`);

    const tb = kit.fit(P.tags[0], { role: "label", w: 330, maxLines: 1, weight: 800, tracking: 1 });
    const tbw = Math.round(tb.width * 1.06 + 32), tbh = Math.round(tb.height + 19);
    const rideTag = ctx.el("tag_bad_spelling", { x: 270, y: 20, w: tbw, h: tbh, kind: "label", exit: "none", parent: mag.inner });
    kit.rect(rideTag.inner, 0, 0, tbw, tbh, { fill: "accent3", r: 6, flat: true, crisp: true });
    kit.text(rideTag.inner, P.tags[0], { role: "label", x: 16, y: 0, w: tbw - 30, h: tbh, size: tb.size, maxLines: 1, valign: "middle", weight: 800, tracking: 1, color: "onAccent" });

    // 1. "You may have learned to spot bad spelling": the lens settles in from the right, the tag wipes in on it
    const tIn = ctx.cue("You may have learned");
    const A = [1250, rows.subject.y];
    m.reveal(mag, tIn, { dy: 0, dur: 0.5 });
    Loom.drive((e) => setMag(lerp(2000, A[0], e), lerp(A[1] - 60, A[1], e), lerp(8, 0, e)), tIn, 1.6, "editorial", meta("magnifier", "travel"));
    m.unmask(rideTag, ctx.cue("bad spelling"));

    // 2. "Plenty of old scams were sloppy": one drive, the lens sweeps line by line (serpentine)
    const tSweep = ctx.cue("Plenty of old scams") - 0.4;
    const path = [A, [520, rows.subject.y], [460, rows.deadline.y], [Math.min(rows.deadline.end + 100, 900), rows.deadline.y], [1150, rows.body.y], [520, rows.body.y], [1150, rows.button.y], [1560, rows.button.y]];
    const seg = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1])), total = seg.reduce((a, b) => a + b, 0);
    const along = (u) => {
      let d = u * total, i = 0;
      while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const k = seg[i] ? Math.min(1, d / seg[i]) : 1;
      return [lerp(path[i][0], path[i + 1][0], k), lerp(path[i][1], path[i + 1][1], k)];
    };
    Loom.drive((e) => { const p = along(e); setMag(p[0], p[1], 0); }, tSweep, ctx.cue("sloppy") + 1.0 - tSweep, "editorial", meta("magnifier", "travel"));
    Loom.tween(rideTag.mover, { opacity: 1 }, { opacity: 0, duration: 0.35, ease: Loom.ease.exit }, tSweep - 0.05, meta("tag_bad_spelling"));

    // 3. "This one is written perfectly": each line ticks clean, top to bottom; the tag is set beside the message
    const tTick = ctx.cue("This one is");
    Object.keys(rows).forEach((k, i) => {
      const cx = Math.min(rows[k].end + 70, 1760) + (k === "button" ? -140 : 0);
      const E = ctx.el("tick_" + k, { x: cx - 34, y: rows[k].y - 34, w: 68, h: 68, kind: "mark", exit: "recede" });
      kit.disc(E.inner, 34, 34, 30, { fill: "pos", flat: true });
      kit.path(E.inner, "M20 35 L30 45 L49 23", { stroke: "field", sw: 7 });
      m.pop(E, tTick + i * 0.22, { overshoot: false });
    });
    const tPerf = ctx.cue("written perfectly");
    const tw = kit.fit(P.tags[1], { role: "label", w: 900, maxLines: 1, weight: 800, tracking: 1 });
    const TX = 1200, yTag = 520;                                              // the quiet right side of the deadline row
    const lead = ctx.el("tag_lead", { x: TX - 90, y: yTag - 12, w: 90, h: 24, kind: "connector" });
    kit.line(lead.inner, 0, 12, 90, 12, { stroke: "pos", sw: 4 });
    m.draw(lead, tPerf - 0.1, { dur: 0.4 });
    Loom.data.tag(ctx, "tag_written_perfectly", { x: TX, y: yTag - (tw.height + 19.2) / 2, text: P.tags[1], color: "pos", t: tPerf + 0.1 });
  },
});
