// @design glyph_row_compare: the camera pushes close on a row of grey blocks and a matching row slides in beneath; one pair lights
Loom.scene("b19", {
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

    if (!hold()) return;
    driftDust(dust, ctx.start, ctx.end);
    const tPush = ctx.cue("Now slow down");
    const tTiles = ctx.cue("The name says IT support");
    const tReal = ctx.cue("The address");
    const tOdd = ctx.cue("one letter");
    const dPush = 2.5;
    const AX = ADDRX(), AY = ADDRY();

    // ---- the one camera move: push close on the address under the sender name ----
    const PS = 3.3;
    m.travel(board, tPush, { x: 960 - PS * (AX + 151), y: 450 - PS * (AY + 83), scale: PS, dur: dPush });

    // ---- the address as a row of grey glyph blocks (no readable domain), settling under the name ----
    // @form glyph_tile_row: a row of grey glyph blocks standing for a string of characters, with no readable text
    const GL = (g, k, x, y) => {
      const P = (d) => kit.path(g, d, { stroke: "muted", sw: 6 });
      if (k === 0) P(`M${x} ${y - 12}V${y + 12}`);
      else if (k === 1) P(`M${x - 8} ${y}a8 8 0 1 0 16 0a8 8 0 1 0 -16 0`);
      else if (k === 2) P(`M${x - 8} ${y + 12}V${y - 6}M${x - 8} ${y - 2}Q${x} ${y - 14} ${x + 8} ${y - 2}V${y + 12}`);
      else if (k === 3) P(`M${x - 8} ${y - 9}L${x + 8} ${y + 9}M${x + 8} ${y - 9}L${x - 8} ${y + 9}`);
      else if (k === 4) P(`M${x - 7} ${y - 12}V${y + 12}H${x + 9}`);
      else if (k === 5) P(`M${x} ${y - 3}V${y + 12}M${x} ${y - 12}v0.1`);
      else if (k === 6) P(`M${x} ${y - 12}V${y + 12}M${x - 7} ${y - 12}H${x + 7}M${x - 7} ${y + 12}H${x + 7}`);
      else P(`M${x - 9} ${y - 11}L${x} ${y + 12}L${x + 9} ${y - 11}`);
    };
    const KINDS = (() => { const r = Loom.rng("phish-address"); return Array.from({ length: 12 }, () => [1, 2, 3, 4, 5, 7][Math.floor(r() * 6)]); })();
    const ODD = 7;                                        // the one tile that differs: a plain bar against a bar with serifs
    const tile = (g, i, row) => {
      kit.rect(g, 0, 0, 16, 24, { fill: row === "top" ? "surface2" : "surface", r: 3, flat: true, crisp: true });
      GL(Loom.svg("g", { transform: "translate(8 12) scale(0.5)" }, g), i === ODD ? (row === "top" ? 0 : 6) : KINDS[i], 0, 0);
    };
    const pair = ctx.el("address_pair", { x: AX, y: AY, w: 302, h: 166, kind: "card", exit: "none", parent: cards.inner });
    let oddTop = null;
    Loom.array(ctx, "address_row", { x: 0, y: 0, cols: 12, rows: 1, dx: 20, dy: 0, w: 236, h: 24, kind: "group", exit: "none", parent: pair.inner, order: "centre", t: tTiles, stagger: 0.07,
      draw: (g, i) => { tile(g, i, "top"); if (i === ODD) oddTop = g; } });

    // ---- the real spelling slides in beneath on its own plate; the one odd pair lights in accent ----
    const real = ctx.el("real_spelling", { x: -8, y: 32, w: 252, h: 72, kind: "card", exit: "none", parent: pair.inner });
    kit.rect(real.inner, 0, 0, 252, 72, { fill: "field", stroke: "accent3", sw: 2, r: 4, flat: true, crisp: true });
    kit.text(real.inner, "REAL SPELLING", { role: "label", size: 24, x: 10, y: 6, w: 232, h: 34, weight: 700, color: "accent3", maxLines: 1, valign: "middle" });
    let oddReal = null;
    for (let i = 0; i < 12; i++) {
      const g = Loom.svg("g", { transform: `translate(${8 + i * 20} 42)` }, real.inner);
      tile(g, i, "real");
      if (i === ODD) oddReal = g;
    }
    m.converge(real, tReal, { dist: 90, dur: 0.7 });
    Loom.hold.heat([oddTop], tOdd, { from: "surface2", to: "accent", attr: "fill", dur: 0.7 });
    Loom.hold.heat([oddReal], tOdd, { from: "surface", to: "accent", attr: "fill", dur: 0.7 });
    Loom.hold.heat([oddTop, oddReal], tOdd, { from: "muted", to: "field", attr: "stroke", dur: 0.7 });

    // ---- the tag points at the lit pair ----
    const odx = ODD * 20 + 8;
    const ld = ctx.el("lead_one_letter", { x: odx - 8, y: 98, w: 16, h: 18, kind: "connector", exit: "none", parent: pair.inner });
    m.draw(kit.line(ld.inner, 8, 16, 8, 2, { stroke: "accent", sw: 3 }), tOdd + 0.2, { dur: 0.3 });
    tag("tag_one_letter", pair.inner, 0, 114, "one letter changed", "accent", tOdd + 0.25, false, 360);
  },
});
