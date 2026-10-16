// @design evidence_board_built_continued: the link unrolls to where it really goes and lifts to the board as the second family
Loom.scene("b20", {
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
    const pair = ctx.held("address_pair");
    if (!pair) return;
    const AX = ADDRX(), AY = ADDRY();
    const LX = Math.round(GX(96)), LY = Math.round(GY(880) - 14);      // the link row on the pinned message
    const tRel = ctx.start + 0.05;
    const tLink = ctx.cue("Then the link");
    const tFolder = ctx.cue("link");
    const tShort = ctx.cue("shortened");
    const tChain = ctx.cue("hides where it goes");
    const tLiftL = ctx.cue("So you have the mismatch sign");
    const tFlagM = ctx.cue("mismatch sign");
    const tBrM = ctx.cue("not who");
    const tDim = ctx.cue("or where");
    const dFlight = 1.2;

    // ---- the camera eases back to the medium shot while the address pair lifts to the right margin ----
    m.travel(board, tRel, { x: 0, y: 0, scale: 1, dur: 1.3 });
    const sA = RCW / 346;                                   // the address pair as a callout: its plate is 346 wide, drawn 416 wide
    const plateA = Loom.svg("g", {}, pair.inner);
    pair.inner.insertBefore(plateA, pair.inner.firstChild);
    const shadeA = Loom.svg("g", { opacity: 0.55, transform: "translate(4 6)" }, plateA);
    kit.rect(shadeA, -14, -14, 346, 198, { fill: "shadow", r: 6, flat: true, crisp: true });
    kit.rect(plateA, -14, -14, 346, 198, { fill: "surface", stroke: FAM.mismatch, sw: 2, r: 6, flat: true, crisp: true });
    kit.rect(plateA, -14, -14, 8, 198, { fill: FAM.mismatch, r: 0, flat: true, crisp: true });
    Loom.tween(plateA, { opacity: 0 }, { opacity: 1, duration: FADE.short, ease: Loom.ease.enter }, tRel + 0.15, { kind: "reveal", beat: bid, name: "address_pair", content: true });
    const toA = { x: RCX + 14 * sA - AX, y: 200 + 14 * sA - AY, s: sA };
    fly(pair, shadeA, tRel + 0.2, dFlight, { x: 0, y: 0, s: 1 }, toA, 70);
    const edgeA = [Math.round(G.x + G.w), AY + 12];
    srcMark("src_address", edgeA, tRel + 0.2, FAM.mismatch);
    pin("pin_address", RCX + RCW / 2, 214, tRel + 1.3, FAM.mismatch);
    string("string_address", [RCX + RCW / 2, 214], edgeA, tRel + 1.5, FAM.mismatch, 1.0);

    // ---- the link: the short chip on the message lights; the place it claims to go to is drawn beside the message ----
    // @form link_chip_and_chain: a short chip of tiles that unrolls into a long chain ending at an unmarked box
    const slot = ctx.el("link_slot", { x: LX - 12, y: LY - 10, w: 388, h: 48, kind: "mark", exit: "none", parent: cards.inner });
    Loom.svg("rect", { x: 0, y: 0, width: 388, height: 48, rx: 6, fill: "none", stroke: S.c("line"), "stroke-width": 2, "stroke-dasharray": "8 7" }, slot.inner);
    const wrap = ctx.el("callout_link", { x: LX, y: LY, w: 364, h: 28, kind: "card", exit: "none", parent: cards.inner });
    const chip = ctx.el("link_chip", { x: 0, y: 0, w: 106, h: 28, kind: "token", exit: "none", parent: wrap.inner });
    for (let i = 0; i < 5; i++) {
      const g = Loom.svg("g", { transform: `translate(${i * 22} 0)` }, chip.inner);
      kit.rect(g, 0, 0, 18, 28, { fill: "surface2", r: 3, flat: true, crisp: true });
      kit.rect(g, 4, 7 + (i % 3) * 4, 10, 3, { fill: "muted", r: 1.5, flat: true, crisp: true });
      kit.rect(g, 4, 17 - (i % 2) * 3, 7, 3, { fill: "muted", r: 1.5, flat: true, crisp: true });
    }
    Loom.svg("rect", { x: -6, y: -5, width: 118, height: 38, rx: 8, fill: "none", stroke: S.c("line"), "stroke-width": 2 }, chip.inner);
    m.settle(chip, tLink, { dy: 10 });
    Loom.hold.heat([chip], tLink + 0.5, { from: "surface2", to: "accent3", attr: "fill", dur: 0.6 });
    const folder = Loom.obj.draw(ctx, "claimed_folder", "folder", { x: 300, y: 640, size: 130, tone: "accent3", detail: 2, parent: cards.inner });
    folder.exit = "none";
    m.settle(folder, tFolder, { dy: 20 });
    const route = ctx.el("route_claimed", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "none", parent: strings.inner });
    kit.path(route.inner, `M${LX - 10} ${LY + 14}C560 ${LY + 20} 450 ${LY + 120} 370 ${LY + 170}`, { stroke: "muted", sw: 3, dash: "10 9" });
    m.reveal(route, tFolder + 0.5, { dy: 0, dur: FADE.mid });
    const tagD = tag("tag_shared_drive", labels.inner, 300, 718, "shared drive", "accent3", tFolder + 0.6, true);
    const tagS = tag("tag_shortened_link", labels.inner, LX, LY + 40, "shortened link", "accent", tShort, false, 360);

    // ---- it hides where it goes: the chain unrolls left to right and ends at a dark, unmarked box ----
    const chain = ctx.el("link_chain", { x: 122, y: 0, w: 208, h: 28, kind: "token", exit: "none", parent: wrap.inner });
    for (let i = 0; i < 9; i++) {
      const g = Loom.svg("g", { transform: `translate(${i * 22} 0)` }, chain.inner);
      kit.rect(g, 0, 0, 18, 28, { fill: "surface2", r: 3, flat: true, crisp: true });
      kit.rect(g, 4, 6 + ((i * 2) % 4) * 3, 10, 3, { fill: "muted", r: 1.5, flat: true, crisp: true });
      kit.rect(g, 4, 18 - (i % 3) * 3, 7, 3, { fill: "muted", r: 1.5, flat: true, crisp: true });
    }
    kit.line(chain.inner, 196, 14, 208, 14, { stroke: "accent2", sw: 3 });
    m.unmask(chain, tChain, { dur: 1.5 });
    const box = ctx.el("unmarked_box", { x: 328, y: -4, w: 36, h: 36, kind: "object", exit: "none", parent: wrap.inner });
    kit.rect(box.inner, 0, 0, 36, 36, { fill: "shadow", stroke: "accent2", sw: 3, r: 4, flat: true, crisp: true });
    kit.line(box.inner, 4, 11, 32, 11, { stroke: "line", sw: 2 });
    m.pop(box, tChain + 1.2);

    // ---- the mismatch sign: the unrolled link lifts to the right margin under the address, flagged ----
    const plateL = Loom.svg("g", {}, wrap.inner);
    wrap.inner.insertBefore(plateL, wrap.inner.firstChild);
    const shadeL = Loom.svg("g", { opacity: 0.55, transform: "translate(4 6)" }, plateL);
    kit.rect(shadeL, -12, -10, 388, 48, { fill: "shadow", r: 6, flat: true, crisp: true });
    kit.rect(plateL, -12, -10, 388, 48, { fill: "surface", stroke: FAM.mismatch, sw: 2, r: 6, flat: true, crisp: true });
    kit.rect(plateL, -12, -10, 8, 48, { fill: FAM.mismatch, r: 0, flat: true, crisp: true });
    Loom.tween(plateL, { opacity: 0 }, { opacity: 1, duration: FADE.short, ease: Loom.ease.enter }, tLiftL, { kind: "reveal", beat: bid, name: "callout_link", content: true });
    m.reveal(slot, tLiftL, { dy: 0, dur: FADE.mid });
    fadeOut(tagS.life, tLiftL, "tag_shortened_link");
    const sL = RCW / 388;
    const toL = { x: RCX + 12 * sL - LX, y: 480 + 10 * sL - LY, s: sL };
    fly(wrap, shadeL, tLiftL, 1.1, { x: 0, y: 0, s: 1 }, toL, 70);
    const edgeL = [Math.round(G.x + G.w), LY + 14];
    srcMark("src_link", edgeL, tLiftL, FAM.mismatch);
    pin("pin_link", RCX + RCW / 2, 494, tLiftL + 1.0, FAM.mismatch);
    string("string_link", [RCX + RCW / 2, 494], edgeL, tLiftL + 1.2, FAM.mismatch, 0.9);
    flag("flag_mismatch", "mismatch sign", [RCX + 34, 208], 150, FAM.mismatch, tFlagM);
    bracket("bracket_mismatch", `M${RCX - 20} 200H${RCX - 38}V532H${RCX - 20}M${RCX - 38} 366H${RCX - 56}`, FAM.mismatch, tBrM, 1.2);

    // ---- the claimed destination dims: it is not where the link goes ----
    fadeOut(folder.life, tDim, "claimed_folder", 0.28);
    fadeOut(route.inner, tDim, "route_claimed", 0.25);
    fadeOut(tagD.life, tDim, "tag_shared_drive", 0.3);
  },
});
