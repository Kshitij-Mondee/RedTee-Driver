// @design evidence_board_built: a held shot changes in place: the screen peels away to a board and the first sign lifts off the message to be pinned and flagged
Loom.scene("b17", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, T = Loom.treat, bid = ctx.beat.id;
    const q = (v) => (Math.round(v * 100) / 100).toFixed(2);
    const FADE = { quick: 0.2, short: 0.4, mid: 0.8 };
    let board, msg, strings, cards, pins, labels, dust, G, parts = {};

    // ---- the board's shared layout (board coordinates; b17 to b21 all build on these numbers) ----
    // The message (b15's, a full 1920 x 1080 screen) is pinned at 0.4 scale in the middle: 768 x 432 at (576, 120).
    const CW = 420, CH = 110;                           // a word callout card
    const LCX = 100, RCX = 1404, RCW = 416;             // left column x (pressure), right column x and width (mismatch)
    const FAM = { pressure: "accent2", mismatch: "accent3", request: "accent" };
    const PARTS = ["msg_sender", "msg_subject", "msg_deadline", "msg_body", "msg_link", "msg_button"];
    const geom = (e) => {
      const w0 = e.w > 0 ? e.w : 1920, h0 = e.h > 0 ? e.h : 1080, s = Math.min(768 / w0, 432 / h0);
      return { s, w: w0 * s, h: h0 * s, x: 960 - (w0 * s) / 2, y: 120 + (432 - h0 * s) / 2 };
    };
    const GX = (lx) => G.x + lx * G.s, GY = (ly) => G.y + ly * G.s;     // message-local to board coordinates
    const hold = () => {                                // every scene after b17 takes the board, its layers and the message parts as they are
      [board, msg, strings, cards, pins, labels, dust] = ["board", "message", "board_strings", "board_cards", "board_pins", "board_labels", "board_dust"].map((n) => ctx.held(n));
      PARTS.forEach((n) => { parts[n] = ctx.held(n); });
      if (msg) G = geom(msg);
      return !!(board && msg);
    };
    const NAMEX = () => Math.round(GX(200)), NAMEY = () => Math.round(GY(132) - 11);   // the sender name row, lettered on the message
    const ADDRX = () => NAMEX(), ADDRY = () => NAMEY() + 34;                          // the address tile row, just under it

    // ---- motion helpers ----
    // @form lift_off_arc: a piece lifts off its source, arcs across the board and lands, its shadow rising with it
    const fly = (E, shade, t, dur, from, to, lift) => {
      Loom.drive((e) => {
        const up = Math.sin(Math.PI * e);
        const x = from.x + (to.x - from.x) * e, y = from.y + (to.y - from.y) * e - lift * up, s = from.s + (to.s - from.s) * e;
        E.mover.setAttribute("transform", `translate(${q(x)} ${q(y)}) scale(${s.toFixed(4)})`);
        if (shade) shade.setAttribute("transform", `translate(${q(4 + 6 * up)} ${q(6 + 24 * up)})`);
      }, t, dur, "editorial", { kind: "travel", beat: bid, name: E.name, content: true });
    };
    // @form drifting_motes: a few seeded specks of dust drift in the key light, a pure function of the clock
    function dustParams() {
      const r = Loom.rng("phish-board-dust");
      return Array.from({ length: 14 }, () => ({ x0: r() * 1900, y0: 90 + r() * 840, r: 1.6 + r() * 2.6, ph: r() * 6.283, op: 0.25 + r() * 0.35, a: 18 + r() * 30, b: 10 + r() * 24 }));
    }
    const driftDust = (E, t0, t1) => {
      const P = dustParams(), kids = Array.from(E.inner.children);
      Loom.drive((e, raw) => {
        const t = t0 + raw * (t1 - t0);
        P.forEach((p, i) => { if (kids[i]) kids[i].setAttribute("transform", `translate(${q(p.x0 + p.a * Math.sin(t / 7 + p.ph))} ${q(p.y0 + p.b * Math.cos(t / 9 + p.ph))})`); });
      }, t0, t1 - t0, "linear", { kind: "ambient", beat: bid, name: "board_dust" });
    };

    // ---- things pinned to the board ----
    // @form pushpin: a round pin that drops onto a card and holds a string
    const pin = (name, cx, cy, t, fam) => {
      const E = ctx.el(name, { x: cx - 20, y: cy - 20, w: 40, h: 40, kind: "token", exit: "none", parent: pins.inner });
      Loom.svg("ellipse", { cx: 24, cy: 31, rx: 12, ry: 4, fill: S.c("shadow"), opacity: 0.5 }, E.inner);
      kit.disc(E.inner, 20, 20, 11, { fill: fam, shade: "recipe", shadow: false });
      m.drop(E, t);
      return E;
    };
    // @form red_string: a thin string drawn from a pin back to the place the piece came from
    const string = (name, a, b, t, fam, dur) => {
      const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "none", parent: strings.inner });
      const sag = Math.min(70, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.12);
      const p = kit.path(E.inner, `M${a[0]} ${a[1]} C${a[0] + (b[0] - a[0]) * 0.3} ${a[1] + sag} ${a[0] + (b[0] - a[0]) * 0.7} ${b[1] + sag} ${b[0]} ${b[1]}`, { stroke: fam, sw: 3, opacity: 0.85 });
      m.draw(p, t, { dur: dur || 0.8 });
      return E;
    };
    // @form source_ring: a small ring left on the thing a piece was lifted from
    const srcMark = (name, pt, t, fam) => {
      const E = ctx.el(name, { x: pt[0] - 22, y: pt[1] - 22, w: 44, h: 44, kind: "mark", exit: "none", parent: strings.inner });
      Loom.svg("circle", { cx: 22, cy: 22, r: 15, fill: "none", stroke: S.c(fam), "stroke-width": 3 }, E.inner);
      Loom.svg("circle", { cx: 22, cy: 22, r: 5, fill: S.c(fam) }, E.inner);
      m.pop(E, t);
      return E;
    };
    // @form word_callout_card: a pinned card with a family-coloured edge and one short phrase
    const card = (name, x, y, w, h, text, fam, icon) => {
      const E = ctx.el(name, { x, y, w, h, kind: "card", exit: "none", parent: cards.inner });
      const shade = Loom.svg("g", { opacity: 0.55, transform: "translate(4 6)" }, E.inner);
      kit.rect(shade, 0, 0, w, h, { fill: "shadow", r: 6, flat: true, crisp: true });
      kit.rect(E.inner, 0, 0, w, h, { fill: "surface", stroke: fam, sw: 2, r: 6, flat: true, crisp: true });
      kit.rect(E.inner, 0, 0, 10, h, { fill: fam, r: 0, flat: true, crisp: true });
      let tx = 34;
      if (icon) { kit.icon(E.inner, icon, { x: 62, y: h / 2, size: 40, color: fam }); tx = 96; }
      kit.text(E.inner, text, { role: "lead", x: tx, y: 0, w: w - tx - 22, h, valign: "middle", weight: 700, maxLines: 1 });
      return { E, shade };
    };
    // @form wipe_in_tag: a solid tag that wipes in and names the thing beside it
    const tag = (name, parent, x, y, text, color, t, center, maxW) => {
      const pad = 16, f = kit.fit(text, { role: "label", w: (maxW || 600) - pad * 2, maxLines: 1, weight: 800, tracking: 1 });
      const w = Math.ceil(f.width * 1.06 + pad * 2), h = Math.ceil(f.height + pad * 1.2);
      const E = ctx.el(name, { x: center ? x - w / 2 : x, y, w, h, kind: "label", exit: "none", parent });
      kit.rect(E.inner, 0, 0, w, h, { fill: color, r: 6, flat: true, crisp: true });
      kit.text(E.inner, text, { x: pad, y: 0, w: w - pad * 2 + 2, h, role: "label", size: f.size, color: "onAccent", valign: "middle", weight: 800, tracking: 1 });
      m.unmask(E, t, { dur: 0.45 });
      return E;
    };
    // @form family_bracket: a thin bracket that gathers pinned cards into one family
    const bracket = (name, d, fam, t, dur) => {
      const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "none", parent: labels.inner });
      m.draw(kit.path(E.inner, d, { stroke: fam, sw: 4 }), t, { dur });
      return E;
    };
    // @form planted_flag: the lesson's flag label planted on a pinned card, its pole standing on the card
    const flag = (name, text, to, y, fam, t) => {
      const E = T.label(ctx, name, { x: to[0] + 110, y, text, to, tone: fam, t, parent: labels.inner });
      E.exit = "none"; if (E.lead) E.lead.exit = "none";
      return E;
    };
    const appear = (E, t) => m.reveal(E, t, { dy: 0, dur: FADE.quick });
    const fadeOut = (node, t, name, to) => Loom.tween(node, { opacity: 1 }, { opacity: to == null ? 0 : to, duration: FADE.short, ease: Loom.ease.exit }, t, { kind: "fade_out", beat: bid, name, content: true });

    msg = ctx.held("message");
    PARTS.forEach((n) => { parts[n] = ctx.held(n); });
    if (!msg || !parts.msg_deadline) return;
    G = geom(msg);
    msg.exit = "none";                                   // the message stays on the board for the rest of the section
    const tPeel = Math.max(ctx.start + 0.45, ctx.cue("First, what is it pushing you to do?"));
    const tLift = ctx.cue("Within the hour");
    const tFlag = ctx.cue("That pressure is doing the work");
    const tHold = ctx.cue("Its job is to stop you checking");
    const dBoard = 1.0, dShrink = 1.4, dFlight = 1.1;

    // ---- the evidence board: a dark frame, a faint grid, one warm key light; it shows as the message shrinks off it ----
    board = ctx.el("board", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    const bgG = Loom.svg("g", {}, board.inner);
    kit.rect(bgG, -120, -40, 2160, 1170, { fill: "surface", r: 18, flat: true, crisp: true });
    kit.rect(bgG, -92, -12, 2104, 1114, { fill: "field2", stroke: "line", sw: 2, r: 10, flat: true, crisp: true });
    for (let x = -60; x <= 1980; x += 120) kit.line(bgG, x, -12, x, 1102, { stroke: "line", sw: 1.5, opacity: 0.22 });
    for (let y = 0; y <= 1080; y += 120) kit.line(bgG, -92, y, 2012, y, { stroke: "line", sw: 1.5, opacity: 0.22 });
    Loom.glow.glowDisc(bgG, 960, 380, 520, "accent", { rings: 14, spread: 1.9, opacity: 0.035, core: false });
    [[-106, -26], [2026, -26], [-106, 1088], [2026, 1088]].forEach(([sx, sy]) => kit.disc(bgG, sx, sy, 9, { fill: "muted", flat: true, shadow: false }));
    Loom.tween(bgG, { opacity: 0 }, { opacity: 1, duration: dBoard, ease: Loom.ease.editorial }, tPeel + 0.3, { kind: "reveal", beat: bid, name: "board", content: true });

    // the message joins the board's world so one camera carries everything; layers keep a fixed stacking order
    const msgShade = Loom.svg("g", { opacity: 0 }, board.inner);
    kit.rect(msgShade, G.x + 8, G.y + 16, G.w, G.h, { fill: "shadow", r: 6, flat: true, crisp: true, opacity: 0.7 });
    board.inner.appendChild(msg.outer);
    const layer = (name) => ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "group", exit: "none", parent: board.inner });
    strings = layer("board_strings"); cards = layer("board_cards"); pins = layer("board_pins"); labels = layer("board_labels");
    dust = layer("board_dust");
    dustParams().forEach((p) => { const c = kit.disc(dust.inner, 0, 0, p.r, { fill: "accent4", flat: true, shadow: false }); c.setAttribute("opacity", p.op.toFixed(2)); });
    driftDust(dust, ctx.start, ctx.end);

    // ---- the screen's own layers: a lit glow and a bezel inside the frame, peeled past the camera, outer first ----
    const glow = ctx.el("screen_glow", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    for (let i = 0; i < 7; i++) kit.rect(glow.inner, 28 + 10 * i, 28 + 10 * i, 1864 - 20 * i, 1024 - 20 * i, { fill: "none", stroke: "accent3", sw: 12, r: 12, opacity: 0.17 - 0.02 * i });
    const bezel = ctx.el("screen_bezel", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    Loom.svg("path", { d: T.rr(0, 0, 1920, 1080, 0) + T.rr(28, 28, 1864, 1024, 12), "fill-rule": "evenodd", fill: S.c("surface2"), stroke: S.c("line"), "stroke-width": 3 }, bezel.inner);
    kit.disc(bezel.inner, 960, 14, 5, { fill: "muted", flat: true, shadow: false });
    kit.disc(bezel.inner, 960, 1066, 6, { fill: "accent3", flat: true, shadow: false });
    appear(glow, ctx.start); appear(bezel, ctx.start);
    Loom.hold.peel(ctx, [glow, bezel], tPeel, { gap: 0.45, dur: 0.95, scale: 1.9 });

    // ---- the message shrinks to its place on the board and is pinned ----
    m.travel(msg, tPeel + 0.55, { x: G.x - msg.x, y: G.y - msg.y, scale: G.s, dur: dShrink });
    Loom.tween(msgShade, { opacity: 0 }, { opacity: 1, duration: FADE.mid, ease: Loom.ease.enter }, tPeel + 0.55 + dShrink - 0.5, { kind: "reveal", beat: bid, name: "message", content: true });
    pin("pin_message", 960, G.y + 6, tPeel + 0.55 + dShrink - 0.1, "accent");

    // ---- sign one: the deadline lifts off the message as pressure, is pinned left, and is flagged ----
    const dl = parts.msg_deadline;
    const dBox = { x: GX(dl.x), y: GY(dl.y), w: dl.w * G.s, h: dl.h * G.s };       // the deadline chip, where the message pinned it
    const src = [dBox.x + dBox.w / 2, dBox.y + dBox.h / 2];
    const ring = ctx.el("src_deadline_band", { x: dBox.x - 8, y: dBox.y - 8, w: dBox.w + 16, h: dBox.h + 16, kind: "mark", exit: "none", parent: strings.inner });
    kit.rect(ring.inner, 0, 0, dBox.w + 16, dBox.h + 16, { fill: "none", stroke: FAM.pressure, sw: 3, r: 6 });
    m.unmask(ring, tLift, { dur: 0.5 });
    const SL = [LCX, 200];
    const c1 = card("callout_deadline", SL[0], SL[1], CW, CH, "within the hour", FAM.pressure);
    const s0 = 0.5;
    appear(c1.E, tLift + 0.25);
    fly(c1.E, c1.shade, tLift + 0.25, dFlight, { x: src[0] - s0 * CW / 2 - SL[0], y: src[1] - s0 * CH / 2 - SL[1], s: s0 }, { x: 0, y: 0, s: 1 }, 90);
    const tLand = tLift + 0.25 + dFlight;
    srcMark("src_deadline", [dBox.x, src[1]], tLift + 0.25, FAM.pressure);
    pin("pin_deadline", SL[0] + CW / 2, SL[1] + 14, tLand - 0.1, FAM.pressure);
    string("string_deadline", [SL[0] + CW / 2, SL[1] + 14], [dBox.x, src[1]], tLand + 0.1, FAM.pressure, 0.9);

    // ---- the flag labels the family; then the board holds and breathes once ----
    flag("flag_pressure", "pressure", [SL[0] + 30, SL[1] + 8], 150, FAM.pressure, tFlag);
    const tEnd = ctx.end - 0.3;
    Loom.hold.breathe({ mover: board.life, w: 1920, h: 1080, name: "board" }, tHold, tEnd, { amp: 0.012, period: tEnd - tHold });
  },
});
