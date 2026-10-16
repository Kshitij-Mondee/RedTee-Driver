// @design evidence_board_real_message: one real, readable message on the left; evidence cards on the right that fill on cue, each joined by a lead to the words it came from
/* b17 to b21 (the golden segment, D-100; the 2026-10-02 version is in scenes/_v1_2026-10-02/).
 * Step 7 shrank the message to the middle of a dark board and printed grey bars where its words should be (frame
 * audit, phishing b17 to b21). Here the message is drawn with Loom.ui.mail at reading size and stays there. Each
 * sign is marked ON the message's own words (ui.mark), and a lead (ui.wire) carries it to a card in its family
 * (ui.card): pressure (b17, b18), mismatch (b19, b20), request (b21). b19 pushes in on the address; b20 pulls back.
 * The message is the one b03 and b15 showed: "Confirm your password", "within the hour", "or lose access to the
 * shared drive", "Act now", from "IT support". The names, address and link are made up (reserved .example names).
 * Every later beat holds the board and all its parts by the names in board.ui.names.
 */
Loom.scene("b17", {
  build(ctx) {
    const U = Loom.ui, M = Loom.motion, bid = ctx.beat.id;
    const board = ctx.el("board", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const mail = U.mail(ctx, "message", {
      parent: board.inner, x: 80, y: 130, w: 1060, display: 0.85, report: true,
      subject: "Confirm your password",
      from: { name: "IT support", address: "it-support@yourcompeny.example" }, to: "you", time: "Today",
      paragraphs: ["We are moving the shared drive.", "Confirm your password within the hour, or lose access to the shared drive."],
      link: { text: "lnk.example/shared-drv" },
      button: { label: "Act now" },
    });
    // the three family cards share one column; each is made in the beat that first names its family (a card made
    // early would show empty from the start). Later beats call board.ui.card(ctx, family) with THEIR ctx.
    const FAM = { pressure: [84, "Pressure", "accent2", "timer"], mismatch: [362, "Mismatch", "accent3", "link-2-off"], request: [640, "Request", "accent", "key-round"] };
    const card = (cx, fam) => { const [y, title, tone, icon] = FAM[fam]; return U.card(cx, "card_" + fam, { parent: board.inner, x: 1210, y, w: 640, title, tone, icon, rows: 2 }); };
    const C = { pressure: card(ctx, "pressure") };
    board.ui = { mail, cards: C, card, edge: (rr) => ({ x: mail.E.x + mail.E.w, y: rr.cy }), names: ["message", "card_pressure"] };

    // the message builds in reading order, quickly: it was already on screen in b15 and b16
    M.reveal(board, ctx.start, { dy: 0, dur: 0.2 });
    U.build(ctx, mail, ctx.start + 0.05, { gap: 0.06 });

    // "First, what is it pushing you to do?": the pressure card arrives empty, ready to be filled
    const tAsk = ctx.cue("pushing you");
    M.reveal(C.pressure.E, tAsk, { dy: 12 });
    // "Within the hour, or lose access": marked on the message's own words, then carried to the card
    const tHour = ctx.cue("Within the hour");
    const r = U.mark(ctx, mail, "body_1", "within the hour", tHour, { tone: "accent2" });
    // a lead starts at the message's edge, level with the marked words, never across the words after them
    const edge = (rr) => ({ x: mail.E.x + mail.E.w, y: rr.cy });
    const w = U.wire(ctx, "wire_deadline", edge(r), C.pressure.port(0), tHour + 0.4, { tone: "accent2", parent: board.inner, hold: 1.6 });
    C.pressure.add(0, "deadline", "within the hour, or lose access", tHour + 1.0);
    // "That pressure is doing the work. Its job is to stop you checking.": the call to act is the pressure's tool
    const tJob = ctx.cue("stop you checking");
    U.mark(ctx, mail, "body_1", "or lose access", ctx.cue("pressure is doing"), { tone: "accent2", opacity: 0.2 });
    const btn = U.at(mail, "button");
    const ring = ctx.el("ring_button", { x: btn.x - 10, y: btn.y - 10, w: btn.w + 20, h: btn.h + 20, kind: "mark", parent: board.inner });
    Loom.svg("rect", { x: 3, y: 3, width: btn.w + 14, height: btn.h + 14, rx: 14, fill: "none", stroke: Loom.style.c("accent2"), "stroke-width": 4 }, ring.inner);
    M.reveal(ring, tJob, { dy: 0, dur: 0.3 });
    board.ui.names.push("ring_button");
    void w;
  },
});
