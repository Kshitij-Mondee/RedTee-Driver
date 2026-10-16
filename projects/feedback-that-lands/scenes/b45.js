// @design two_scenes_compared_one_greys: two framed rooms side by side; one drains of colour, the other keeps it and is tagged
/* b45 - the payoff, held still. Two framed panels, left first: the office walkway (the report from behind at a
 * far desk, the calendar with three days crossed, the update on their screen) and the meeting room (Maya seated
 * across the table, the report from behind in the foreground, the Thursday note on Maya's side). Treatments
 * considered: (A) two title cards "verdict" / "conversation" (rejected: words standing in for the pictures),
 * (B) a before/after slider (rejected: they are two different moments, not one thing changing), (C) CHOSEN:
 * two small rooms drawn with the same place builders as the earlier scenes, compared at rest; the only change is
 * the colour draining from the first (Loom.hold.heat on the update, a muted wash over the room) while the
 * second keeps its colour, then a slow push into the note that carries the agreement.
 * The rooms use Loom.place.office("walkway") and Loom.place.meeting("room"): the same names the earlier scenes use,
 * so the geometry and the seeded look match them.
 */
Loom.scene("b45", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = Loom.svg;
    const O = Loom.obj;
    const meta = (kind, name) => ({ kind, beat: ctx.beat.id, name, content: true });

    // ---- layout: two panels of one size, a thin rule between them, the rooms drawn at half size inside
    const PW = 810, PH = 630, PY = 150, PXL = 96, PXR = 1014, SC = 0.5;
    const TX = PW / 2 - 960 * SC, TY = PH / 2 - 600 * SC;               // place point (960, 600) lands on the panel centre
    const toStation = (px, py, panelX) => [panelX + px * SC + TX, PY + py * SC + TY];   // a place point -> station coords

    // @form framed_panel: a bordered panel holding a small scene, drawn first so the viewer sees the two slots
    const frames = [["frame_left", PXL], ["frame_right", PXR]].map(([nm, px], i) => {
      const E = ctx.el(nm, { x: px, y: PY, w: PW, h: PH, kind: "card", exit: "recede" });
      kit.rect(E.inner, 0, 0, PW, PH, { fill: "field2", r: 14, shadow: false });
      kit.rect(E.inner, 0, 0, PW, PH, { fill: "none", stroke: "line", sw: 3, r: 14, shadow: false });
      m.reveal(E, ctx.speechStart + 0.05 + i * 0.2, { dy: 10 });
      return E;
    });
    const div = ctx.el("divider", { x: 960 - 2, y: PY, w: 4, h: PH, kind: "connector", exit: "recede" });
    kit.line(div.inner, 2, 0, 2, PH, { stroke: "line", sw: 3 });
    m.draw(div, ctx.speechStart + 0.35, { dur: 0.8 });

    const tAssemble = ctx.cue("two conversations");
    const clipped = (E, id) => {   // a static clip to the panel, inside the element (assemble's clip sits on E.life)
      const defs = svg("defs", {}, E.inner), cp = svg("clipPath", { id }, defs);
      svg("rect", { x: 0, y: 0, width: PW, height: PH, rx: 14 }, cp);
      return svg("g", { "clip-path": `url(#${id})` }, E.inner);
    };

    // ================= LEFT: the office walkway, days late =================
    const roomL = ctx.el("room_left", { x: PXL, y: PY, w: PW, h: PH, kind: "scenery", exit: "recede" });
    const gL = clipped(roomL, "b45clipL");
    const WL = Loom.place.office(ctx, "walkway", { parent: gL });
    WL.E.outer.setAttribute("transform", `translate(${TX} ${TY}) scale(${SC})`);
    const mid = WL.layers.mid.g, right = WL.look.side !== "left";
    // the report at the far desk, seen from behind: back of the head, neck, shoulders and a jacket, no face
    // @form seated_back_view: a person seen from behind (hair, neck, shoulders) at a desk, no face, in muted tones
    const cx = right ? 1287 : 533, by = 800 - 128 * 0.62 - 150 * 0.62;
    const skin = S.mix(S.c("accent2"), S.c("surface"), 0.62), hair = S.darken(S.c("muted"), 0.5), jacket = S.c("line");
    svg("rect", { x: cx - 8, y: by - 16, width: 16, height: 18, rx: 6, fill: skin }, mid);
    svg("path", { d: `M${cx - 50} ${by + 22} Q${cx - 50} ${by - 8} ${cx - 22} ${by - 13} H${cx + 22} Q${cx + 50} ${by - 8} ${cx + 50} ${by + 22} Z`, fill: jacket }, mid);
    svg("circle", { cx, cy: by - 32, r: 21, fill: skin }, mid);
    svg("path", { d: `M${cx - 21} ${by - 32} A21 21 0 0 1 ${cx + 21} ${by - 32} Q${cx + 14} ${by - 20} ${cx} ${by - 18} Q${cx - 14} ${by - 20} ${cx - 21} ${by - 32} Z`, fill: hair }, mid);
    svg("path", { d: `M${cx - 21} ${by - 32} A21 21 0 0 0 ${cx + 21} ${by - 32} Q${cx + 12} ${by - 12} ${cx} ${by - 10} Q${cx - 12} ${by - 12} ${cx - 21} ${by - 32} Z`, fill: hair }, mid);
    // the update on their screen (bars in ink, which the grey drains), found from the far desk's geometry
    const vp = [right ? 880 : 1040, 470], dkx = right ? 1130 : 420, dkw = 360, ds = 0.7, topY = 790 - 250 * ds;
    const ux = vp[0] - (dkx + dkw / 2), uy = vp[1] - (topY + 17 * ds), kk = 74 * ds / Math.hypot(ux, uy);
    const scrX = dkx + dkw * 0.42 + ux * kk * 0.5, scrY = topY + uy * kk * 0.5 - 74 * ds - 0.12 * 190 * ds;
    const bars = svg("g", {}, mid);
    [[64, 0], [52, 11], [58, 22]].forEach(([w, dy]) => svg("rect", { x: scrX - 34, y: scrY - 12 + dy, width: w, height: 7, rx: 3, fill: S.c("ink") }, bars));
    // the calendar with three days crossed, drawn over the wall one (same place, a little larger)
    // @form crossed_day_calendar: a wall calendar whose passed days carry a cross
    const calX = right ? 1220 : 690, calY = 300, cs = 156;
    const cal = svg("g", {}, WL.layers.far.g);
    svg("rect", { x: calX - cs * 0.46, y: calY - cs * 0.46, width: cs * 0.92, height: cs * 0.92, rx: 7, fill: S.c("surface") }, cal);
    svg("rect", { x: calX - cs * 0.46, y: calY - cs * 0.46, width: cs * 0.92, height: cs * 0.22, rx: 7, fill: S.c("accent3") }, cal);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
      const px = calX - cs * 0.36 + c * cs * 0.145, py = calY - cs * 0.14 + r * cs * 0.15, i = r * 6 + c;
      if (i >= 6 && i <= 8) {
        svg("path", { d: `M${px - 8} ${py - 8} l16 16 m0 -16 l-16 16`, fill: "none", stroke: S.c("neg"), "stroke-width": 3.5, "stroke-linecap": "round" }, cal);
      } else svg("circle", { cx: px, cy: py, r: 3.2, fill: S.c("line"), opacity: 0.8 }, cal);
    }

    // ================= RIGHT: the meeting room, that afternoon =================
    const roomR = ctx.el("room_right", { x: PXR, y: PY, w: PW, h: PH, kind: "scenery", exit: "recede" });
    const gR = clipped(roomR, "b45clipR");
    const WR = Loom.place.meeting(ctx, "room", { parent: gR });
    WR.E.outer.setAttribute("transform", `translate(${TX} ${TY}) scale(${SC})`);
    const midR = WR.layers.mid.g, fy = 670, tt = fy + 110, tb = fy + 300;
    // Maya, seated across the table from the report; the table is drawn again over her legs, then its props
    const maya = ctx.character("maya", "maya", { x: 760, y: 935, scale: 0.45, pose: "sit", parent: midR });
    maya.emotion("listening", ctx.speechStart);
    maya.gesture("nod", ctx.cue("that afternoon"), ctx.cue("that afternoon") + 1.1);
    maya.emotion("smile", ctx.cue("Thursday"));
    Loom.treat.body(midR, `M600 ${tt} H1320 L1560 ${tb} H360 Z`, "surface", { x: 360, y: tt, w: 1200, h: tb - tt });
    svg("rect", { x: 360, y: tb, width: 1200, height: 22, fill: S.darken(S.c("surface"), 0.25) }, midR);
    O.shape(midR, "laptop", 900, tt + 40, 140, { key: "roomlap", detail: 2, shadow: false });
    O.shape(midR, "document", 1150, tt + 70, 80, { key: "roomd1", detail: 1, shadow: false });
    // the Thursday note on Maya's side of the table
    // @form paper_note_on_surface: a small tilted note with a few lines, lying on a table
    const note = svg("g", { transform: `rotate(-4 700 ${tt + 74})` }, midR);
    svg("rect", { x: 628, y: tt + 26, width: 150, height: 112, rx: 4, fill: S.c("shadow"), opacity: 0.16 }, note);
    svg("rect", { x: 624, y: tt + 20, width: 150, height: 112, rx: 4, fill: S.mix(S.c("accent2"), S.c("surface"), 0.8) }, note);
    svg("rect", { x: 624, y: tt + 20, width: 150, height: 18, rx: 4, fill: S.mix(S.c("accent2"), S.c("surface"), 0.55) }, note);
    [52, 74, 96].forEach((y, i) => svg("rect", { x: 642, y: tt + y, width: 112 - i * 22, height: 6, rx: 3, fill: S.c("muted"), opacity: 0.7 }, note));
    // the report in the foreground, from behind, lower in the frame than Maya
    const rx = 1290, ry = 985;
    svg("path", { d: `M${rx - 150} ${ry + 330} Q${rx - 150} ${ry + 70} ${rx - 70} ${ry + 46} H${rx + 70} Q${rx + 150} ${ry + 70} ${rx + 150} ${ry + 330} Z`, fill: jacket }, midR);
    svg("rect", { x: rx - 22, y: ry + 8, width: 44, height: 50, rx: 16, fill: skin }, midR);
    svg("circle", { cx: rx, cy: ry - 30, r: 56, fill: skin }, midR);
    svg("path", { d: `M${rx - 56} ${ry - 30} A56 56 0 0 1 ${rx + 56} ${ry - 30} Q${rx + 36} ${ry + 8} ${rx} ${ry + 12} Q${rx - 36} ${ry + 8} ${rx - 56} ${ry - 30} Z`, fill: hair }, midR);

    // ================= timing =================
    // both panels assemble, left first
    m.assemble(roomL, tAssemble);
    m.assemble(roomR, tAssemble + 0.4);
    // "One was a verdict": the left room drains of colour; the update fades with it
    const tVerdict = ctx.cue("One was a verdict"), dGrey = S.dur("enter") * 3;
    const grey = ctx.el("grey_left", { x: PXL, y: PY, w: PW, h: PH, kind: "scenery", exit: "recede" });
    const wash = svg("rect", { x: 0, y: 0, width: PW, height: PH, rx: 14, fill: S.c("muted"), opacity: 0 }, grey.inner);
    const lift = svg("rect", { x: 0, y: 0, width: PW, height: PH, rx: 14, fill: S.c("field"), opacity: 0 }, grey.inner);
    Loom.tween(wash, { opacity: 0 }, { opacity: 0.58, duration: dGrey, ease: Loom.ease.editorial }, tVerdict, meta("heat", "grey_left"));
    Loom.tween(lift, { opacity: 0 }, { opacity: 0.16, duration: dGrey, ease: Loom.ease.editorial }, tVerdict, meta("heat", "grey_left.lift"));
    Loom.hold.heat([bars], tVerdict, { from: "ink", to: "field2", dur: dGrey });
    // the tags name what is drawn
    const [cx0, cy0] = toStation(calX, calY, PXL);
    Loom.data.tag(ctx, "tag_late", { x: cx0 - 68, y: cy0 + 56, text: "days late", color: "muted", t: ctx.cue("days late") });
    Loom.data.tag(ctx, "tag_afternoon", { x: PXR + 28, y: PY + 28, text: "that afternoon", color: "accent4", t: ctx.cue("that afternoon") });
    const [nx, ny] = toStation(700, tt + 76, PXR);
    Loom.data.tag(ctx, "tag_thursday", { x: nx - 56, y: ny + 56, text: "Thursday", color: "accent", t: ctx.cue("Thursday") });
    // a slow push into the note (the point stays put, the room grows around it)
    Loom.cam.push(WR, { to: [700, tt + 76], scale: 1.3, t0: ctx.cue("It ended with"), t1: ctx.end - 0.2 });
  },
});
