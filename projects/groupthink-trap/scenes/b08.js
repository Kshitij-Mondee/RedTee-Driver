// @design doubts_come_true_in_place: the same held objects that carried private doubts each take a failure mark, in order, on a dark field
/* b08 - weeks later: every doubt comes true on the SAME objects the viewer saw in the bubbles.
 * Treatments considered:
 *  (A) a timeline arrow "weeks later" with four failure cards (rejected: cards explain, the viewer must RECOGNISE
 *      the objects; and a new layout breaks the recurring token);
 *  (B) static composition: the four objects already marked red, one stamp "it all came true" (rejected: the
 *      consequence is a sequence in time and the order matters: date first, then the other three in seat order);
 *  (C) CHOSEN: the four doubt objects large on a dark ink-paper field (the lesson's one dark break); each changes
 *      state in place on its words: the calendar loses pages and its day is crossed out, the checklist's empty boxes
 *      fill with red crosses, the headset rings, the envelope comes back with a red return arrow.
 * Rules taken from the references (TED-Ed s7, colour_and_tone): a still camera on a moving drawing; hold the layout,
 * change its state; hand-made time on fours (stepped hz 6) and a boiling outline in the hold; one accent (the red
 * failure marks), placed not sized; the objects are paper on dark ink, no other saturated hue.
 * Continuity: the four objects live in ONE motif group 'doubts' at x 270, 730, 1190, 1650 (460 apart), y 520, so b09
 * carries them back at scale 0.5 onto (830, 1060, 1290, 1520; 290). The red marks are inside the motif: they travel.
 * The tag 'launch slips' is a label (words), so it stays here and leaves before the travel.
 */
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (tag, a, p) => Loom.svg(tag, a, p);
    const meta = (name) => ({ kind: "state", beat: ctx.beat.id, name, content: true });
    const stepped = (fn) => Loom.stepped.wrap(fn, { hz: 6 });
    // a round-capped stroke drawn with a dash offset shows a dot before it starts: each drawn mark sits in its own
    // group that is switched on at its draw time (seen on the first snapshot: red dots beside the headset)
    const markG = (parent, t) => { const g = svg("g", {}, parent); Loom.set(g, { opacity: 0 }, 0); Loom.set(g, { opacity: 1 }, t); return g; };

    // ---- the dark ink-paper field (the one dark break). It reaches 480 px left so the travel back to the room
    // (b09, camera passes the gap between the stations) never shows the pale field between the two dark frames.
    // @form ink_paper_field: a dark paper ground with a sparse seeded speckle, for a night or consequence break
    const night = ctx.el("night_field", { x: -480, y: -60, w: 2460, h: 1200, kind: "scenery", exit: "none" });
    kit.rect(night.inner, 0, 0, 2460, 1200, { fill: "ink", r: 0, flat: true, crisp: true });
    const rnd = Loom.rng("b08:paper");
    for (let i = 0; i < 520; i++) {
      svg("circle", { cx: (rnd() * 2460).toFixed(1), cy: (rnd() * 1200).toFixed(1), r: (0.8 + rnd() * 1.8).toFixed(2), fill: S.c("field2"), opacity: (0.05 + rnd() * 0.07).toFixed(3) }, night.inner);
    }
    // two soft lighter washes so the ink reads as paper, not as a screen void
    svg("ellipse", { cx: 1440, cy: 560, rx: 980, ry: 420, fill: S.c("muted"), opacity: 0.10 }, night.inner);
    svg("ellipse", { cx: 1480, cy: 590, rx: 620, ry: 250, fill: S.c("muted"), opacity: 0.08 }, night.inner);

    // ---- the motif: the four doubts, one group, seat order (date, testing, support, client)
    const doubts = ctx.motif("doubts", { x: 0, y: 0, w: 1920, h: 1080 });
    const D = doubts.inner;
    const tLater = Math.max(ctx.cue("later"), ctx.start + 0.55);      // after the torn cover has passed
    const tSlips = ctx.cue("the launch slips");
    const tEvery = ctx.cue("Every one of those doubts");
    const tThose = ctx.cue("those doubts");
    const tTrue = ctx.cue("comes true");

    // 1. the calendar page (the date): a tear-off pad, three pages on top, the first carrying the red question mark
    // @form tearoff_pad_pages: a tear-off pad whose top pages tear away one per step to show time passing
    const cal = svg("g", { "data-part": "obj_date" }, D);
    const CX = 270, CY = 520, SZ = 300;
    Loom.obj.shape(cal, "calendar", CX, CY, SZ, { family: "tearoff", tone: "muted", detail: 2, shadow: false, key: "obj_date" });
    const cw = SZ * 0.86, ch = SZ * 0.9, cx0 = CX - cw / 2, cy0 = CY - ch / 2 + SZ * 0.04;
    const pageTop = cy0 + ch * 0.24 + SZ * 0.06, pageH = cy0 + ch - pageTop;
    const dayBox = { x: cx0 + cw * 0.2, y: cy0 + ch * 0.24 + SZ * 0.16, w: cw * 0.6, h: ch * 0.42 };
    const pages = [];
    for (let i = 0; i < 3; i++) {   // drawn bottom to top: pages[2] is the top page
      const pg = svg("g", {}, cal);
      kit.rect(pg, cx0, pageTop, cw, pageH, { fill: "surface", r: 6, shadow: false });
      svg("line", { x1: cx0 + 10, y1: pageTop + 4, x2: cx0 + cw - 10, y2: pageTop + 4, stroke: S.c("field2"), "stroke-width": 3, "stroke-dasharray": "6 6" }, pg);
      svg("rect", { x: dayBox.x + dayBox.w * 0.2, y: dayBox.y + dayBox.h * 0.2, width: dayBox.w * 0.6, height: dayBox.h * 0.6, rx: 6, fill: S.c("surface2") }, pg);
      pages.push(pg);
    }
    // the question mark: the doubt about the date, on the top page (a drawn mark, not type)
    const qx = dayBox.x + dayBox.w / 2, qy = dayBox.y + dayBox.h * 0.48;
    svg("path", { d: `M${qx - 26} ${qy - 30} q0 -34 28 -34 q30 0 30 28 q0 20 -26 30 q-6 4 -6 18`, fill: "none", stroke: S.c("accent"), "stroke-width": 12, "stroke-linecap": "round", "stroke-linejoin": "round" }, pages[2]);
    svg("circle", { cx: qx, cy: qy + 46, r: 8, fill: S.c("accent") }, pages[2]);
    // the three pages tear off, one per step, each falling away with a small turn (top page first)
    stepped(() => {
      [2, 1, 0].forEach((pi, k) => {
        const t = tLater + k * 0.26, pg = pages[pi], side = k % 2 ? -1 : 1;
        Loom.drive((e) => {
          const ang = side * 22 * e, dy = 520 * e * e, dx = side * 70 * e;
          pg.setAttribute("transform", `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${ang.toFixed(2)} ${CX} ${pageTop})`);
          pg.setAttribute("opacity", Math.max(0, 1 - e * 1.4).toFixed(3));
        }, t, 0.62, "exit", meta("obj_date.page" + (3 - pi)));
      });
    });
    // the day under the pages is crossed out in red on "the launch slips"
    // @form strike_out_stroke: one hand-drawn stroke struck across an item to cancel it
    const crossG = markG(cal, tSlips);
    const crossA = svg("path", { d: `M${dayBox.x + 8} ${dayBox.y + 6} L${dayBox.x + dayBox.w - 8} ${dayBox.y + dayBox.h - 6}`, fill: "none", stroke: S.c("accent"), "stroke-width": 14, "stroke-linecap": "round" }, crossG);
    const crossB = svg("path", { d: `M${dayBox.x + dayBox.w - 10} ${dayBox.y + 8} L${dayBox.x + 10} ${dayBox.y + dayBox.h - 8}`, fill: "none", stroke: S.c("accent"), "stroke-width": 14, "stroke-linecap": "round" }, crossG);
    stepped(() => { m.draw(crossA, tSlips, { dur: 0.33 }); m.draw(crossB, tSlips + 0.33, { dur: 0.33 }); });

    // the paper tag 'launch slips' pins to the calendar and is written on (words: not boiled, not stepped)
    const tag = Loom.gt.tag(ctx, "tag_launch_slips", { x: CX, y: 770, text: "launch slips", role: "lead", t: tSlips + 0.3 });   // measured tag (C2: T.label left 9.0 px, needs 9.2)
    const pin = ctx.el("tag_pin", { x: CX - 9, y: 676, w: 18, h: 60, kind: "label", exit: "recede" });
    svg("line", { x1: 9, y1: 0, x2: 9, y2: 58, stroke: S.c("field2"), "stroke-width": 4, "stroke-linecap": "round" }, pin.inner);
    svg("circle", { cx: 9, cy: 4, r: 8, fill: S.c("field2") }, pin.inner);
    m.pop(pin, tSlips + 0.22, { overshoot: false });
    void tag;

    // 2. the checklist (testing): two boxes ticked, two empty boxes edged red; red crosses fill them, one per step
    // @form checklist_rows: a clipboard of tick rows where the empty rows are the open risk
    const chk = svg("g", { "data-part": "obj_test" }, D);
    Loom.obj.shape(chk, "document", 730, 520, SZ, { family: "clipboard", tone: "field2", detail: 1, shadow: false, key: "obj_test" });
    const rows = [440, 506, 572, 638], bx = 650, bs = 40;
    const empties = [];
    rows.forEach((ry, i) => {
      const done = i < 2;
      svg("rect", { x: bx, y: ry - bs / 2, width: bs, height: bs, rx: 6, fill: S.c("surface"), stroke: S.c(done ? "ink" : "accent"), "stroke-width": done ? 4 : 5 }, chk);
      svg("path", { d: `M${bx + bs + 22} ${ry} H${bx + bs + 22 + (i % 2 ? 92 : 118)}`, fill: "none", stroke: S.c("muted"), "stroke-width": 7, "stroke-linecap": "round" }, chk);
      if (done) svg("path", { d: `M${bx + 8} ${ry + 1} l10 11 l18 -22`, fill: "none", stroke: S.c("ink"), "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" }, chk);
      else empties.push(ry);
    });
    // @form outcome_tick: a tick or cross mark landing on an item to show its result
    stepped(() => {
      empties.forEach((ry, k) => {
        const t = tEvery + k * 0.34, xg = markG(chk, t);
        const a = svg("path", { d: `M${bx + 6} ${ry - bs / 2 + 6} L${bx + bs - 6} ${ry + bs / 2 - 6}`, fill: "none", stroke: S.c("accent"), "stroke-width": 9, "stroke-linecap": "round" }, xg);
        const b = svg("path", { d: `M${bx + bs - 6} ${ry - bs / 2 + 6} L${bx + 6} ${ry + bs / 2 - 6}`, fill: "none", stroke: S.c("accent"), "stroke-width": 9, "stroke-linecap": "round" }, xg);
        m.draw(a, t, { dur: 0.16 }); m.draw(b, t + 0.16, { dur: 0.16 });
      });
    });

    // 3. the headset (support): band, two ear cups, a mic boom with a red tip; it rings, the cups shake
    // @form headset_prop: a headset drawn as an object (band arc, two cups, a boom mic) that can ring
    const hsWrap = svg("g", { "data-part": "obj_support" }, D);
    const hs = svg("g", {}, hsWrap);
    const HX = 1190, HY = 530;
    svg("path", { d: `M${HX - 112} ${HY + 10} A112 112 0 0 1 ${HX + 112} ${HY + 10}`, fill: "none", stroke: S.c("field2"), "stroke-width": 26, "stroke-linecap": "round" }, hs);
    svg("path", { d: `M${HX - 112} ${HY + 10} A112 112 0 0 1 ${HX + 112} ${HY + 10}`, fill: "none", stroke: S.c("surface2"), "stroke-width": 10, "stroke-linecap": "round" }, hs);
    [-1, 1].forEach((sd) => {
      const ex = HX + sd * 118;
      kit.rect(hs, ex - 34, HY - 10, 68, 112, { fill: "surface2", r: 26, shadow: false });
      kit.rect(hs, ex - 22 + sd * -4, HY + 4, 44, 84, { fill: "field2", r: 18, shadow: false, flat: true });
    });
    svg("path", { d: `M${HX - 112} ${HY + 92} q8 58 92 64`, fill: "none", stroke: S.c("surface2"), "stroke-width": 11, "stroke-linecap": "round" }, hs);
    svg("circle", { cx: HX - 14, cy: HY + 156, r: 15, fill: S.c("accent") }, hs);
    // ring lines boil out on both sides, one arc per step, then the two-drawing shake
    const rings = svg("g", {}, hsWrap);
    const arcs = [];
    [0, 1, 2].forEach((i) => [-1, 1].forEach((sd) => {
      const r = 48 + i * 30, cx = HX + sd * 168, cy = HY + 46;
      const a0 = sd > 0 ? -50 : 130, a1 = sd > 0 ? 50 : 230;
      const p = (a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      arcs.push({ i, el: svg("path", { d: `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`, fill: "none", stroke: S.c("accent"), "stroke-width": 8, "stroke-linecap": "round" }, markG(rings, tThose + i * 0.17)) });
    }));
    stepped(() => {
      arcs.forEach((a) => m.draw(a.el, tThose + a.i * 0.17, { dur: 0.17 }));
      const steps = 8;   // two drawings, alternating: the cups shake while it rings
      Loom.drive((e, raw) => {
        const k = Math.min(steps - 1, Math.floor(raw * steps + 1e-4));
        const ang = raw <= 0 || raw >= 1 ? 0 : (k % 2 ? 3.5 : -3.5);
        hs.setAttribute("transform", `rotate(${ang} ${HX} ${HY + 50})`);
      }, tThose + 0.05, 1.33, "linear", Object.assign(meta("obj_support.shake"), { stepped: 6 }));
    });

    // 4. the sealed envelope (client) with its red wax seal; it comes back with a red return arrow drawn round it
    const envWrap = svg("g", { "data-part": "obj_client" }, D);
    const env = svg("g", {}, envWrap);
    Loom.obj.shape(env, "envelope", 1650, 520, SZ, { family: "flap", tone: "surface2", detail: 2, shadow: false, key: "obj_client" });
    const sealY = (520 - SZ * 0.32 + SZ * 0.06) + SZ * 0.64 * 0.56;
    svg("circle", { cx: 1650, cy: sealY, r: 24, fill: S.c("accent") }, env);
    svg("circle", { cx: 1650, cy: sealY, r: 14, fill: "none", stroke: S.darken(S.c("accent"), 0.3), "stroke-width": 3 }, env);
    // @form return_arrow: a curved arrow drawn round an object to say it came back
    // a loop round the envelope: from its right side, up over the top, down its left side, the head pointing back
    // down (an elliptical arc; a straight bend read as a bag handle on the first snapshot)
    const rg = markG(envWrap, tTrue);
    const ERX = 182, ERY = 152, ECX = 1650, ECY = 540, A0 = 18, A1 = 168;   // degrees, measured up from the right
    const ept = (a) => [ECX + ERX * Math.cos(a * Math.PI / 180), ECY - ERY * Math.sin(a * Math.PI / 180)];
    const [ax0, ay0] = ept(A0), [ax1, ay1] = ept(A1);
    const retPath = svg("path", { d: `M${ax0.toFixed(1)} ${ay0.toFixed(1)} A${ERX} ${ERY} 0 0 0 ${ax1.toFixed(1)} ${ay1.toFixed(1)}`, fill: "none", stroke: S.c("accent"), "stroke-width": 9, "stroke-linecap": "round" }, rg);
    const tx = -Math.sin(A1 * Math.PI / 180) * ERX, ty = -Math.cos(A1 * Math.PI / 180) * ERY, tl = Math.hypot(tx, ty);   // tangent at the end
    const ux = tx / tl, uy = ty / tl, hx = ax1 + ux * 22, hy = ay1 + uy * 22;
    const retHead = svg("path", { d: `M${hx.toFixed(1)} ${hy.toFixed(1)} L${(ax1 - uy * 18).toFixed(1)} ${(ay1 + ux * 18).toFixed(1)} L${(ax1 + uy * 18).toFixed(1)} ${(ay1 - ux * 18).toFixed(1)} Z`, fill: S.c("accent") }, rg);
    const ret = { g: rg, path: retPath, head: retHead };
    stepped(() => {
      m.draw(ret, tTrue, { dur: 0.5 });
      Loom.drive((e) => env.setAttribute("transform", `translate(${(46 * Math.sin(Math.PI * e)).toFixed(1)} 0)`), tTrue, 0.5, "move", meta("obj_client.return"));
    });

    // ---- hand-made time: every outline boils from the moment the cover has passed to the end of the beat
    [cal, chk, hsWrap, envWrap].forEach((g, i) => Loom.stepped.boil(g, ctx.start + 0.5, ctx.end, { hz: 8, amp: 1.2, seed: "b08:boil" + i }));
    void tThose;
  },
});
