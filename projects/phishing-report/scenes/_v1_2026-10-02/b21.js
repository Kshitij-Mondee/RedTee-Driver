// @design evidence_board_built_continued: the last sign pins below, then the camera pulls back to the whole board
Loom.scene("b21", {
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
      // b21 ends the board's run: b22 lays its own picture on the field. The board was built with exit "none"
      // (it had to persist through b17..b21), so it is given a real exit here or it stays under b22 (L-165)
      [board, msg, strings, cards, pins, labels, dust, ...Object.values(parts)].forEach((e) => { if (e) e.exit = "recede"; });
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

    if (!hold()) return;
    driftDust(dust, ctx.start, ctx.end);
    msg.exit = "none";                                   // the whole board, message included, stays for the next beat
    const LX = Math.round(GX(96));
    const tField = ctx.cue("Last, what does it want");
    const tLift = ctx.cue("Your password");
    const tFlag = ctx.cue("request sign");
    const tBank = ctx.cue("Banks and other official sources");
    const tEnv = ctx.cue("official sources");
    const tNo = ctx.cue("do not ask");
    const dFlight = 1.0;

    // ---- what it wants: a password box on the message lights ----
    const PF = { x: LX, y: 504, w: 330, h: 36 };
    // @form password_field_box: a masked-dots field with a lock, standing for a request on a message
    const pf = ctx.el("password_field", { x: PF.x, y: PF.y, w: PF.w, h: PF.h, kind: "card", exit: "none", parent: cards.inner });
    kit.rect(pf.inner, 0, 0, PF.w, PF.h, { fill: "field", stroke: "line", sw: 2, r: 5, flat: true, crisp: true });
    kit.icon(pf.inner, "lock", { x: 22, y: 18, size: 20, color: "muted" });
    for (let i = 0; i < 8; i++) kit.disc(pf.inner, 56 + i * 30, 18, 5, { fill: "muted", flat: true, shadow: false });
    m.unmask(pf, tField, { dur: 0.6 });
    m.glow(pf, tField + 0.7, { color: "accent", dur: 1.0 });

    // ---- sign four: the request lifts off, pins below the message, and is flagged ----
    const SL = [740, 650], CWP = 440;
    const src = [PF.x + PF.w / 2, PF.y + PF.h / 2];
    const c3 = card("callout_password", SL[0], SL[1], CWP, CH, "password", FAM.request, "lock");
    const s0 = 0.5;
    appear(c3.E, tLift);
    fly(c3.E, c3.shade, tLift, dFlight, { x: src[0] - s0 * CWP / 2 - SL[0], y: src[1] - s0 * CH / 2 - SL[1], s: s0 }, { x: 0, y: 0, s: 1 }, 60);
    srcMark("src_password", [PF.x + PF.w, src[1]], tLift, FAM.request);
    pin("pin_password", SL[0] + CWP / 2, SL[1] + 14, tLift + dFlight - 0.1, FAM.request);
    string("string_password", [SL[0] + CWP / 2, SL[1] + 14], [PF.x + PF.w, src[1]], tLift + dFlight + 0.1, FAM.request, 0.7);
    flag("flag_request", "request sign", [SL[0] + 30, SL[1] + 8], 612, FAM.request, tFlag);

    // ---- banks do not ask: a bank building grows, a closed envelope beside it is crossed through ----
    const bank = Loom.obj.draw(ctx, "bank_building", "building", { x: 1300, y: 715, size: 150, tone: "accent3", detail: 2, family: "institution", parent: cards.inner });
    bank.exit = "none";
    m.grow(bank, tBank, { axis: "y", dur: 1.0 });
    const env = Loom.obj.draw(ctx, "bank_envelope", "envelope", { x: 1480, y: 715, size: 120, tone: "accent4", state: { open: false }, parent: cards.inner });
    env.exit = "none";
    m.pop(env, tEnv);
    const no = ctx.el("no_sign", { x: 1390, y: 625, w: 180, h: 180, kind: "mark", exit: "none", parent: cards.inner });
    Loom.svg("circle", { cx: 90, cy: 90, r: 78, fill: "none", stroke: S.c("neg"), "stroke-width": 9, "stroke-linecap": "round" }, no.inner);
    Loom.svg("line", { x1: 35, y1: 35, x2: 145, y2: 145, stroke: S.c("neg"), "stroke-width": 9, "stroke-linecap": "round" }, no.inner);
    m.draw(no, tEnv + 0.7, { dur: 0.8 });
    tag("tag_not_email", labels.inner, 1390, 822, "not by email", "neg", tNo, true);

    // ---- the one camera move: pull back to the whole board, three families pinned around one clean message ----
    m.travel(board, tNo, { x: 960 - 0.82 * 960, y: 450 - 0.82 * 440, scale: 0.82, dur: 2.5 });
  },
});
