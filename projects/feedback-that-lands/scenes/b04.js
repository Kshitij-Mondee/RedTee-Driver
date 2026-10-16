// @design place_push_to_work: a lived-in place with the lead character in front, a calendar that turns, and a slow push from her to the work
// b04 - Maya, her report and the client update that went out unclear.
// Treatments considered: (A) Maya + a document card (rejected: a card stands in for the thing), (B) a split
// calendar/inbox graphic (rejected: no place, no people), (C) CHOSEN: the open-plan office, Maya in the foreground,
// the report seen from behind at the next desk, the update on their monitor, a wall calendar that fills with
// crossed days, then one push toward the work. Time passing is content; the push carries the eye from her to it.
// The geometry of the report's desk is shared with b05 (held) and b06 (zoom lands on rect [1060,300,640,360]).
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, D = Loom.data, svg = Loom.svg;
    const tc = (tok) => S.c(tok);
    const meta = (kind, name) => ({ kind, beat: ctx.beat.id, name, content: true });

    // ---- cues (every reveal rides a spoken phrase)
    const tMaya = ctx.cue("this is Maya"), tManager = ctx.cue("a manager");
    const tDays = ctx.cue("A few days ago"), tReport = ctx.cue("her report");
    const tUpdate = ctx.cue("sent a client update"), tTag = ctx.cue("client update"), tUnclear = ctx.cue("It went out");

    const tHeld = ctx.end + 10.07;                   // b05 holds this picture to here; the ambient life runs on through it

    // ---- the place: an open-plan office, window side left, in the lesson's seed
    const P = Loom.place.office(ctx, "office", { side: "right" });
    P.E.place = P;                                   // b05 takes the same place (and its camera) over
    const far = P.layers.far.g, mid = P.layers.mid.g;
    // quiet colour: the furniture is washed back so the person in front of it leads (chair kept apart: the report sits behind it)
    const kids = Array.from(mid.childNodes), chair = kids.pop();
    const quiet = svg("g", { opacity: 0.58 }, mid);
    kids.forEach((k) => quiet.appendChild(k));
    mid.insertBefore(quiet, chair);
    const before = (E) => { mid.insertBefore(E.outer, chair); return E; };

    // @form cubicle_panel: a low fabric screen between aisle and desks that hides a walker below the hip
    const part = ctx.el("partition", { x: -400, y: 446, w: 2800, h: 344, kind: "scenery", parent: mid });
    mid.insertBefore(part.outer, quiet);
    svg("rect", { x: 0, y: 0, width: 2800, height: 344, fill: S.mix(tc("surface2"), tc("line"), 0.18) }, part.inner);
    svg("rect", { x: 0, y: 0, width: 2800, height: 14, fill: tc("line"), opacity: 0.55 }, part.inner);
    for (let i = 0; i < 28; i++) svg("rect", { x: 100 * i, y: 14, width: 3, height: 330, fill: tc("line"), opacity: 0.14 }, part.inner);
    svg("rect", { x: 0, y: 318, width: 2800, height: 26, fill: tc("shadow"), opacity: 0.1 }, part.inner);

    // ---- the calendar on the open wall: days are crossed off one by one (no digits)
    // @form wall_calendar_crosses: a wall calendar whose days are struck through as time passes
    const cal = Loom.obj.draw(ctx, "calendar", "calendar", { x: 1236, y: 290, size: 190, family: "wall", tone: "muted", detail: 2, parent: far });
    const cw = 190 * 0.86 * 0.8 / 7, gx = 1236 - 190 * 0.86 / 2 + 190 * 0.86 * 0.1, gy = 290 - 190 * 0.9 / 2 + 190 * 0.04 + 190 * 0.9 * 0.2 + 19;
    const days = ctx.el("calendar_days", { x: gx, y: gy, w: cw * 7, h: cw * 4, kind: "mark", parent: far });
    const crossPaths = [9, 10, 11].map((cell) => {
      const r = Math.floor(cell / 7), c = cell % 7, cx = c * cw + cw / 2, cy = r * cw * 0.95 + cw / 2, d = cw * 0.3;
      return kit.path(days.inner, `M${cx - d} ${cy - d} L${cx + d} ${cy + d} M${cx + d} ${cy - d} L${cx - d} ${cy + d}`, { stroke: "neg", sw: 4 });
    });
    crossPaths.forEach((p, i) => m.draw(p, tDays + 0.35 + i * 0.62, { dur: 0.5 }));

    // ---- the update, on the report's monitor (drawn in the mid layer, in front of the second desk's laptop)
    const MX = 1100, MY = 520, MW = 300, MH = 169;
    const mon = before(ctx.el("monitor", { x: MX - 10, y: MY - 10, w: MW + 20, h: MH + 56, kind: "instrument", parent: mid }));
    svg("rect", { x: 102, y: MH + 10, width: 96, height: 16, fill: tc("line") }, mon.inner);
    svg("ellipse", { cx: 150, cy: MH + 44, rx: 70, ry: 9, fill: tc("shadow"), opacity: 0.22 }, mon.inner);
    svg("path", { d: `M110 ${MH + 56} h${80} l-8 -${22} h-64 Z`, fill: tc("muted") }, mon.inner);
    svg("rect", { x: 10, y: 10, width: MW, height: MH, rx: 10, fill: tc("ink") }, mon.inner);
    svg("rect", { x: 18, y: 18, width: MW - 16, height: MH - 16, rx: 5, fill: tc("surface") }, mon.inner);

    // the document: title bar, grey bars; the fourth bar is the line that will go soft
    // @form document_window_bars: a document window drawn as a title bar and grey text bars, no words
    const upd = before(ctx.el("update", { x: MX + 14, y: MY + 14, w: MW - 28, h: MH - 28, kind: "document", parent: mid }));
    const UW = MW - 28;
    svg("rect", { x: 0, y: 0, width: UW, height: 30, rx: 4, fill: tc("surface2") }, upd.inner);
    [0, 1, 2].forEach((i) => svg("circle", { cx: 14 + i * 16, cy: 15, r: 4.5, fill: tc(i === 0 ? "neg" : "line"), opacity: i === 0 ? 0.7 : 0.6 }, upd.inner));
    svg("rect", { x: UW / 2 - 34, y: 11, width: 68, height: 8, rx: 4, fill: tc("line"), opacity: 0.55 }, upd.inner);
    const widths = [0.92, 0.78, 0.86, 0.7, 0.84, 0.46], bars = [];
    widths.forEach((wf, i) => {
      const y = 48 + i * 17, w = (UW - 28) * wf;
      bars.push(kit.path(upd.inner, `M14 ${y} H${14 + w}`, { stroke: i === 3 ? "muted" : "line", sw: 8, opacity: i === 3 ? 0.9 : 0.6 }));
    });
    bars.forEach((b, i) => m.draw(b, tUpdate + 0.1 + i * 0.28, { dur: 0.42 }));
    // the soft line: the same bar breaks into an uneven smudge (nothing else changes)
    const smudge = svg("g", { opacity: 0 }, upd.inner), sw = (UW - 28) * widths[3], rng = Loom.rng("b04:smudge");
    for (let k = 0; k < 5; k++) svg("rect", { x: 14 + rng() * 18, y: 48 + 3 * 17 - 4 + (rng() - 0.5) * 9, width: sw * (0.4 + rng() * 0.5), height: 8 + rng() * 5, rx: 5, fill: tc("muted"), opacity: 0.2 + rng() * 0.12 }, smudge);
    Loom.tween(smudge, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") * 1.8, ease: Loom.ease.move }, tUnclear, meta("fade_in", "update.smudge"));
    Loom.tween(bars[3], { opacity: 0.9 }, { opacity: 0.12, duration: ctx.style.dur("enter") * 1.6, ease: Loom.ease.move }, tUnclear, meta("fade_out", "update.line"));
    const caret = svg("rect", { x: 16, y: 48 + 5 * 17 - 6, width: 3, height: 14, fill: tc("accent") }, upd.inner);   // idle caret, period-locked
    Loom.drive((e, raw) => caret.setAttribute("opacity", Math.floor(raw * (tHeld - tUpdate - 1.8) / 0.5) % 2 ? 0 : 1), tUpdate + 1.8, tHeld - tUpdate - 1.8, "linear", { kind: "ambient", beat: ctx.beat.id, name: "update.caret" });

    // ---- the report: seen from behind, seated at the desk, turned a little toward the screen
    // @form figure_from_behind: an unnamed person drawn from behind in muted tokens (back of head, neck, shoulders)
    const rep = before(ctx.el("report", { x: 930, y: 590, w: 250, h: 320, kind: "character", parent: mid }));
    const skin = S.mix(S.pack.characters.skin[1], S.c("field"), 0.35);
    svg("path", { d: "M8 196 C8 128 40 108 86 100 L154 100 C204 108 232 128 232 196 L216 320 L24 320 Z", fill: tc("line") }, rep.inner);
    svg("path", { d: "M30 150 C46 120 80 110 120 110 C160 110 194 120 210 150 C190 128 160 122 120 122 C80 122 50 128 30 150 Z", fill: tc("surface2"), opacity: 0.55 }, rep.inner);
    svg("path", { d: "M120 112 V320", stroke: tc("muted"), "stroke-width": 3, opacity: 0.35 }, rep.inner);
    svg("rect", { x: 100, y: 78, width: 40, height: 34, rx: 10, fill: skin }, rep.inner);
    svg("ellipse", { cx: 120, cy: 42, rx: 46, ry: 54, fill: tc("muted") }, rep.inner);
    svg("path", { d: "M156 30 Q172 52 158 78 Q166 52 156 30 Z", fill: skin }, rep.inner);
    svg("path", { d: "M84 74 Q120 94 156 74 Q150 96 120 98 Q90 96 84 74 Z", fill: tc("ink"), opacity: 0.35 }, rep.inner);
    m.drift(rep, tReport, ctx.end, { amp: 1.6, period: 4 });

    // ---- Maya, in front of her bookshelf; she is calm, nods once, and tightens a little at the end
    const maya = ctx.character("maya", "maya", { x: 600, y: 1000, scale: 0.45, pose: "neutral", parent: mid });
    maya.emotion("neutral", 0);
    maya.gesture("nod", tMaya + 0.15, tMaya + 1.3);
    maya.pose("idle", tManager, { dur: 0.7 });
    maya.emotion("concern", tUnclear + 0.3);

    // ---- tags: names on the two things the lesson is about
    const tagMaya = D.tag(ctx, "tag_maya", { x: 742, y: 438, text: "Maya", color: "accent", t: tMaya });
    m.exit(tagMaya, tDays - 0.1, "wipe");
    const tagUpd = D.tag(ctx, "tag_update", { x: MX, y: MY - 72, text: "Client update", color: "accent", t: tTag });
    mid.appendChild(tagUpd.outer);                    // rides the same layer as the monitor, so the push carries it

    // ---- ambient: dust turning in the window light (period-locked drift)
    // @form window_dust: slow motes drifting up through a shaft of window light
    const dust = ctx.el("dust", { x: 60, y: 240, w: 420, h: 560, kind: "scenery", parent: far });
    const motes = Array.from({ length: 14 }, (_, i) => ({ x: 20 + (Loom.hash("d" + i) % 380), y: Loom.hash("e" + i) % 520, r: 1.8 + (i % 3) * 0.9, ph: i / 14, el: svg("circle", { r: 1.8 + (i % 3) * 0.9, fill: tc("surface"), opacity: 0.8 }, dust.inner) }));
    Loom.drive((e, raw) => motes.forEach((o) => { const q = (raw * 5 + o.ph) % 1; o.el.setAttribute("cx", (o.x + 14 * Math.sin(6.283 * (raw * 5 + o.ph))).toFixed(1)); o.el.setAttribute("cy", (o.y - 90 * q).toFixed(1)); o.el.setAttribute("opacity", (0.75 * Math.sin(3.1416 * q)).toFixed(2)); }), ctx.start, tHeld - ctx.start, "linear", { kind: "ambient", beat: ctx.beat.id, name: "dust" });

    // ---- the one camera move: from the wide room toward the report's desk (parallax through the layers)
    Loom.cam.push(P, { to: [1250, 600], scale: 1.28, t0: tReport, t1: tReport + 2.3 });
  },
});
