// @design row_opens_into_message: a held list row is tapped and grows into a full message window that is then read line by line
/* b24 - "Say your usual supplier, Quillmoor Supplies, writes. Please pay today's invoice, to our new bank details.
 *        Plus an attachment nobody expected." (station st_supplier, continues b23).
 * Treatments considered:
 *  (A) the message as a flat card that fades in over the inbox (rejected: nothing says it IS the new row; the
 *      viewer has to take it on trust that this is the familiar sender),
 *  (B) a cursor-less zoom into the row (rejected: the push is the engine's shot move, a second zoom would fight it),
 *  (C) CHOSEN: Jo's pointer taps the new row, the row GROWS into the window (scale from the row's own rect), the
 *      round avatar travels from the row into the header, the name prints beside it, the two lines print as they
 *      are said, and the attachment settles at the bottom with its tag. The list is veiled, not removed.
 * Everything that belongs to the message is a CHILD of `supplier_msg` (exit: "none"), so b25 to b28 hold ONE
 * element and the lines, chip, tag, link and number come with it.
 * Beat sheet (anchors are spoken words):
 *   "Say your usual supplier"           the pointer taps the row; the window grows from it; the list is veiled
 *   "Quillmoor Supplies"                the sender name prints beside the travelled avatar
 *   "Please pay today's invoice"        line_1 prints
 *   "to our new bank details"           line_2 prints
 *   "Plus an attachment"                the chip settles at the bottom
 *   "nobody expected"                   the tag wipes in under the chip
 * Names: supplier_msg (+ children sender_name, sender_meta, line_1, line_2, attachment_chip, attachment_tag,
 * msg_link, msg_number), inbox_veil; held from b23: desk_world, key_light, mail_window, inbox, new_message_row, contact_avatar.
 */
Loom.scene("b24", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, D = Loom.data, O = Loom.obj, svg = Loom.svg, bid = ctx.beat.id;
    const P = Object.assign({ sender: "Quillmoor Supplies", lines: ["Please pay today's invoice", "to our new bank details"], tag: "attachment nobody expected" }, props || {});

    // ---- geometry (station coords; the same numbers as b23, b25 and b26)
    const WX = 150, WY = 100, WW = 1620, WH = 800;                              // mail_window
    const ROW = { x: 440, y: 218, w: 1330, h: 84 };                               // the new row's rect
    const WIN = { x: 170, y: 120, w: 1010, h: 760 };                              // supplier_msg
    const AVC = { x: 80, y: 70, r: 38 };                                          // the avatar in the header (window-local)
    const dEnter = S.dur("enter"), dMove = S.dur("move"), dGrow = dMove * 1.7;
    const tSay = ctx.cue("Say your usual supplier"), tName = ctx.cue("Quillmoor Supplies"), tL1 = ctx.cue("Please pay today's invoice"), tL2 = ctx.cue("to our new bank details");
    const tChip = ctx.cue("Plus an attachment"), tTag = ctx.cue("nobody expected");
    const pin = (E) => { E.exit = "none"; if (E.outer.querySelectorAll) E.outer.querySelectorAll(".lm-el").forEach((n) => { if (n.__E) n.__E.exit = "none"; }); return E; };

    // ---- held from b23: the room, the screen, the list, the row, the avatar
    ["desk_world", "key_light", "mail_window", "inbox", "new_message_row"].forEach((n) => ctx.held(n));
    const av = ctx.held("contact_avatar");

    // ---- 1. Jo's pointer comes in, crosses to the new row and taps it (the click is what opens the message)
    // @form pointer_taps_row: a pointer glides to a list row and taps it, the row presses and a ripple marks the spot
    const cur = Loom.ui.cursor(ctx, { x: 1330, y: 560, name: "inbox_cursor" });
    cur.w = 0; cur.h = 0;   // its box is not a placement (the pointer moves on its mover), so it must not steer the push pivot
    const tIn = ctx.start + 0.12;
    m.cursorIn(cur, tIn);
    const tArrive = m.cursorTo(cur, 1010, ROW.y + ROW.h / 2 + 10, tIn + 0.2);
    const tOpen = Math.max(tArrive + 0.06, tSay);
    m.tap(cur, null, tOpen, { x: 1010, y: ROW.y + ROW.h / 2 + 10 });
    Loom.tween(cur.inner, { opacity: 1 }, { opacity: 0, duration: dMove * 0.7, immediateRender: false }, tOpen + 1.0, { kind: "exit", beat: bid, name: "inbox_cursor.out" });

    // ---- 2. the list steps back: a veil over the screen, between the list and the window (which is drawn next)
    const veil = ctx.el("inbox_veil", { x: WX, y: WY, w: WW, h: WH, kind: "scenery", exit: "none" });
    kit.rect(veil.inner, 0, 0, WW, WH, { fill: "field", r: 16, crisp: true });
    Loom.tween(veil.life, { opacity: 0 }, { opacity: 0.66, duration: dMove, ease: Loom.ease.enter }, tOpen + 0.25, { kind: "dim", beat: bid, name: "inbox_veil", content: true });

    // ---- 3. the message window: a frame that GROWS from the row's rect; its contents are children, hidden until their words
    // @form row_grows_into_window: a window frame scaled up out of the list row it belongs to, its contents printing after it has grown
    const msg = ctx.el("supplier_msg", { x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, kind: "card", exit: "recede" });
    const mi = msg.inner;
    kit.rect(mi, 0, 0, WIN.w, WIN.h, { fill: "surface", r: 16, stroke: "line", sw: 2, crisp: true });
    kit.rect(mi, 0, 0, WIN.w, 148, { fill: "surface2", r: 16, crisp: true });
    kit.rect(mi, 0, 100, WIN.w, 48, { fill: "surface2", crisp: true });
    kit.line(mi, 0, 148, WIN.w, 148, { stroke: "line", sw: 2, crisp: true });
    Loom.tween(msg.mover, { x: ROW.x - WIN.x, y: ROW.y - WIN.y, scaleX: ROW.w / WIN.w, scaleY: ROW.h / WIN.h, transformOrigin: "0 0" }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: dGrow, ease: Loom.ease.editorial }, tOpen + 0.1, { kind: "grow", beat: bid, name: "supplier_msg", content: true });
    m.reveal(msg, tOpen + 0.1, { dy: 0, dur: 0.12 });

    // the avatar travels from its row into the header (the same disc, bigger), above the window
    const sc = AVC.r / 26, dx = WIN.x + AVC.x - av.x - sc * 26, dy = WIN.y + AVC.y - av.y - sc * 26;
    m.travel(av, tOpen + 0.1, { x: dx, y: dy, scale: sc, dur: dGrow, content: true });

    // ---- 4. the sender: the name prints beside the avatar on its words; a quiet "to" bar and two small actions follow
    // @form sender_block: the sender's name in bold with a muted address bar beneath and two small action icons at the far edge
    const sName = ctx.el("sender_name", { parent: mi, x: 140, y: 28, w: 760, h: 64, kind: "text", exit: "none" });
    kit.text(sName.inner, P.sender, { role: "lead", x: 0, y: 0, w: 760, h: 64, weight: 700, maxLines: 1 });
    m.unmask(sName, tName, { dur: dEnter * 1.6 });
    const sMeta = ctx.el("sender_meta", { parent: mi, x: 140, y: 100, w: WIN.w - 180, h: 30, kind: "group", exit: "none" });
    kit.rect(sMeta.inner, 0, 8, 190, 12, { fill: "line", r: 6, crisp: true });
    kit.icon(sMeta.inner, "reply", { x: WIN.w - 240, y: 14, size: 28, color: "muted" });
    kit.icon(sMeta.inner, "more-horizontal", { x: WIN.w - 190, y: 14, size: 28, color: "muted" });
    m.reveal(sMeta, tName + 0.5, { dy: 6 });

    // ---- 5. the two lines, printed as they are said (the message is read at the speed of the voice)
    // @form message_line_printed: one line of a message body that prints left to right on the words it carries
    const mkLine = (name, text, y, t) => {
      const E = ctx.el(name, { parent: mi, x: 50, y, w: 910, h: 64, kind: "text", exit: "none" });
      kit.text(E.inner, text, { role: "lead", x: 0, y: 0, w: 910, h: 64, weight: 500, maxLines: 1 });
      m.unmask(E, t, { dur: dEnter * 2.0 });
      return E;
    };
    mkLine("line_1", P.lines[0], 228, tL1);
    mkLine("line_2", P.lines[1], 373, tL2);

    // ---- 6. the attachment: a document object in a chip, settled at the bottom, its tag wiping in under it
    // @form attachment_chip: a file chip of a drawn document, a name bar and a paperclip, standing for an attachment
    const chip = ctx.el("attachment_chip", { parent: mi, x: 50, y: 533, w: 430, h: 90, kind: "card", exit: "none" });
    kit.rect(chip.inner, 0, 0, 430, 90, { fill: "surface2", r: 10, stroke: "line", sw: 2, crisp: true });
    O.shape(chip.inner, "document", 52, 45, 62, { detail: 2, key: "att_chip", shadow: false });
    kit.rect(chip.inner, 104, 27, 220, 14, { fill: "muted", r: 7, crisp: true });
    kit.rect(chip.inner, 104, 53, 130, 12, { fill: "line", r: 6, crisp: true });
    kit.icon(chip.inner, "paperclip", { x: 390, y: 45, size: 34, color: "ink" });
    m.settle(chip, tChip, { dy: 22 });
    const tag = D.tag(ctx, "attachment_tag", { x: 50, y: 634, text: P.tag, color: "accent4", t: tTag });
    mi.appendChild(tag.outer); pin(tag);

    // ---- 7. a signature block under it: a link and a phone number, drawn quietly (b27 puts its stops on these two)
    // @form signature_contact_chips: two quiet contact chips, a link and a phone number, drawn as an icon and a bar with no words
    const sigs = [["msg_link", "link", 50, 420, 320], ["msg_number", "phone", 500, 330, 220]];
    sigs.forEach(([nm, ic, x, w, bw], i) => {
      const E = ctx.el(nm, { parent: mi, x, y: 704, w, h: 48, kind: "token", exit: "none" });
      kit.icon(E.inner, ic, { x: 24, y: 24, size: 28, color: "muted" });
      kit.rect(E.inner, 56, 17, bw, 14, { fill: "line", r: 7, crisp: true });
      m.reveal(E, tName + 0.7 + i * 0.12, { dy: 6 });
    });

    // ---- 8. the avatar stays on top of the window it travelled into (z-order is draw order)
    ctx.g.appendChild(av.outer);
    ctx.g.appendChild(cur.outer);
  },
});
