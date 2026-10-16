// @design inbox_new_row_turn: a hard cut to a familiar list view, one new row slides in on top, a chapter sting names the turn over it
/* b23 - "A name you know can still be fake." (station st_supplier, first beat, a hard cut = the jolt).
 * Treatments considered:
 *  (A) a big sender-name card with a question mark (rejected: a card stands in for the inbox; the viewer has
 *      just seen Jo's real inbox and the name is not spoken yet),
 *  (B) a close-up of the one new row alone (rejected: loses the inbox, so "one more message among many" is gone),
 *  (C) CHOSEN: the whole mail screen, closer and calmer than the last time; every row is already there, one new
 *      row slides to the top on "the part people miss" with a round avatar and NO name (a monogram drawn as a
 *      shape, not a letter), and the chapter sting sits over the world on "A name you know".
 * Beat sheet (anchors are spoken words):
 *   cut                              the mail screen, rows already in place (they settle in a tight stagger)
 *   "Here is the part people miss"   the new row (and its avatar) slide into the top slot, the list shifts down
 *   "A name you know"                Loom.data.chapter: the world dims, the title prints
 *   "can still be fake"              the sub prints under the title (unmask)
 * Names other beats hold: desk_world, mail_window, inbox, new_message_row, contact_avatar, key_light.
 */
Loom.scene("b23", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, D = Loom.data, svg = Loom.svg, bid = ctx.beat.id;
    const P = Object.assign({ chapter_title: "A name you know", chapter_sub: "can still be fake" }, props || {});

    // ---- geometry (station coords). The mail screen is the one big thing; everything sits inside it.
    const WX = 150, WY = 100, WW = 1620, WH = 800;                       // mail_window
    const LX = 440, LY = 210, LW = 1330, LH = 690, STEP = 92, RH = 84, R0 = 8;   // the list viewport and its row rhythm
    const ROWS = 9, tRow = ctx.cue("Here is the part people miss"), tName = ctx.cue("A name you know"), tSub = ctx.cue("can still be fake");
    const dEnter = S.dur("enter"), dMove = S.dur("move");
    const clipTo = (E, w, h) => {   // a viewport: rows that slide out of it are cut by its edge, not faded
      const id = Loom.uid("lst");
      svg("rect", { x: 0, y: 0, width: w, height: h }, svg("clipPath", { id }, svg("defs", {}, E.outer)));
      E.outer.setAttribute("clip-path", `url(#${id})`);
    };

    // ---- 1. the room: a dark desk wall with one warm key light, drawn far past the frame (a pan may follow later)
    // @form key_light_wall: a dark wall with soft stacked discs of one warm light and a cool spill, no filters
    const world = ctx.el("desk_world", { x: -1700, y: -1000, w: 0, h: 0, kind: "scenery", exit: "none" });
    kit.rect(world.inner, 0, 0, 5600, 3200, { fill: "field", crisp: true });
    [1700, 1350, 1000, 700].forEach((r, i) => svg("circle", { cx: 2000, cy: 1100, r, fill: S.c("accent"), opacity: 0.025 + i * 0.012 }, world.inner));
    [1100, 800, 520].forEach((r, i) => svg("circle", { cx: 3500, cy: 1500, r, fill: S.c("accent3"), opacity: 0.02 + i * 0.01 }, world.inner));
    kit.rect(world.inner, 0, 1930, 5600, 1270, { fill: "field2", crisp: true });   // the desk top, below the screen
    kit.line(world.inner, 0, 1930, 5600, 1930, { stroke: "line", sw: 3, opacity: 0.5, crisp: true });
    m.reveal(world, ctx.start, { dy: 0, dur: 0.25 });

    // ---- 2. the mail screen: title bar, folders, the list header (all text-free: bars and icons, no sample words)
    // @form mail_client_chrome: an app screen of a title bar with a search pill, a folder column with one unread badge and a list header
    const win = ctx.el("mail_window", { x: WX, y: WY, w: WW, h: WH, kind: "scenery", exit: "none" });
    const wi = win.inner;
    kit.rect(wi, 0, 0, WW, WH, { fill: "surface2", r: 16, stroke: "line", sw: 2, crisp: true });
    kit.rect(wi, 0, 0, WW, 56, { fill: "surface", r: 16, crisp: true });
    kit.rect(wi, 0, 40, WW, 16, { fill: "surface", crisp: true });
    [0, 1, 2].forEach((i) => kit.disc(wi, 30 + i * 26, 28, 7, { fill: i ? "line" : "accent4", flat: true, shadow: false }));
    kit.rect(wi, 330, 12, 560, 32, { fill: "field", r: 16, crisp: true });
    kit.icon(wi, "search", { x: 360, y: 28, size: 20, color: "muted" });
    kit.rect(wi, 392, 22, 210, 12, { fill: "line", r: 6, crisp: true });
    kit.icon(wi, "bell", { x: WW - 112, y: 28, size: 24, color: "muted" });
    kit.disc(wi, WW - 52, 28, 17, { fill: "accent3", flat: true, shadow: false });   // Jo
    kit.icon(wi, "user", { x: WW - 52, y: 28, size: 20, color: "onAccent" });
    kit.rect(wi, 0, 56, 270, WH - 56, { fill: "field2", crisp: true });
    const FOLDERS = ["inbox", "star", "send", "file-text", "archive", "trash-2"];
    FOLDERS.forEach((ic, k) => {
      const y = 84 + k * 62;
      if (k === 0) { kit.rect(wi, 14, y, 242, 46, { fill: "surface", r: 10, crisp: true }); kit.rect(wi, 14, y + 9, 5, 28, { fill: "accent", r: 2, crisp: true }); }
      kit.icon(wi, ic, { x: 52, y: y + 23, size: 26, color: k === 0 ? "ink" : "muted" });
      kit.rect(wi, 88, y + 17, k === 0 ? 120 : 70 + (k % 3) * 24, 12, { fill: "line", r: 6, crisp: true, opacity: k === 0 ? 1 : 0.7 });
    });
    kit.disc(wi, 232, 107, 10, { fill: "accent", flat: true, shadow: false });      // the unread badge on the inbox folder (no digit)
    kit.rect(wi, 24, WH - 92, 222, 54, { fill: "accent", r: 14, crisp: true });
    kit.icon(wi, "pencil", { x: 135, y: WH - 65, size: 28, color: "onAccent" });
    kit.rect(wi, 290, 56, WW - 290, 54, { fill: "surface", crisp: true, opacity: 0.55 });
    kit.rect(wi, 312, 70, 26, 26, { fill: "none", r: 6, stroke: "line", sw: 3, crisp: true });
    [0, 1, 2].forEach((i) => kit.rect(wi, 366 + i * 128, 69, 108, 28, { fill: "surface2", r: 14, crisp: true }));
    kit.rect(wi, WW - 230, 77, 190, 12, { fill: "line", r: 6, crisp: true, opacity: 0.7 });
    m.reveal(win, ctx.start, { dy: 0, dur: 0.25 });

    // ---- 3. the inbox: nine rows (the top slot is left for the new row), seeded widths, grey bars for sender and subject
    // @form inbox_row_stack: a stack of mail rows as grey bars (avatar disc, sender, subject, time) standing for a full inbox
    const AV = ["line", "muted", "accent4", "accent3", "line"], SW = [170, 230, 140, 210, 190], BW = [520, 680, 400, 760, 600];
    const inbox = Loom.array(ctx, "inbox", { x: LX, y: LY, w: LW, h: LH, cols: 1, rows: ROWS, dx: 0, dy: STEP, order: "row", t: ctx.start - 0.25, stagger: 0.02, rise: 8, seed: "supplier_inbox",
      draw: (g, i, r, c, rnd) => {
        if (i === 0) return;   // slot 0 belongs to the new message
        const unread = i % 3 === 1, ss = SW[i % 5] * (0.9 + rnd() * 0.2), bs = BW[(i * 2) % 5] * (0.9 + rnd() * 0.2);
        kit.rect(g, 0, R0, LW, RH, { fill: "surface", r: 8, crisp: true, opacity: unread ? 1 : 0.62 });
        if (unread) kit.disc(g, 22, R0 + RH / 2, 6, { fill: "accent3", flat: true, shadow: false });
        kit.disc(g, 70, R0 + RH / 2, 26, { fill: AV[i % 5], flat: true, shadow: false, opacity: 0.5 });
        kit.rect(g, 116, R0 + 22, ss, 15, { fill: unread ? "muted" : "line", r: 7, crisp: true });
        kit.rect(g, 116, R0 + 50, bs, 12, { fill: "line", r: 6, crisp: true, opacity: 0.8 });
        kit.rect(g, LW - 130, R0 + 24, 74, 12, { fill: "line", r: 6, crisp: true, opacity: 0.6 });
        if (i % 2 === 0) kit.icon(g, "paperclip", { x: LW - 70, y: R0 + 54, size: 22, color: "muted" });   // most work mail carries a file
      } });
    clipTo(inbox, LW, LH);

    // ---- 4. the new message: ONE row in the top slot, brighter than its neighbours, an avatar but no name yet
    // @form new_message_row: one highlighted list row with an accent edge, a bright sender bar and a round avatar, sliding into the top slot
    const nrow = ctx.el("new_message_row", { x: LX, y: LY, w: LW, h: LH, kind: "row", exit: "recede" });
    kit.rect(nrow.inner, 0, R0, LW, RH, { fill: "surface", r: 8, crisp: true });
    kit.rect(nrow.inner, 0, R0, 8, RH, { fill: "accent", r: 3, crisp: true });
    kit.rect(nrow.inner, 116, R0 + 21, 250, 17, { fill: "ink", r: 8, crisp: true });
    kit.rect(nrow.inner, 116, R0 + 50, 560, 12, { fill: "muted", r: 6, crisp: true });
    kit.rect(nrow.inner, LW - 130, R0 + 24, 74, 12, { fill: "muted", r: 6, crisp: true });
    clipTo(nrow, LW, LH);
    // the avatar is its own element so it can travel into the message window in b24: a ring and a tail drawn as shapes
    const AR = 26, ax = LX + 70, ay = LY + R0 + RH / 2;
    // @form shape_monogram_avatar: a round avatar disc whose initial is drawn as a ring and a tail, so no name or letter is implied
    const av = ctx.el("contact_avatar", { x: ax - AR, y: ay - AR, w: AR * 2, h: AR * 2, kind: "token", exit: "recede" });
    kit.disc(av.inner, AR, AR, AR, { fill: "accent3", flat: true, shadow: false });
    svg("circle", { cx: AR - 2, cy: AR - 2, r: AR * 0.4, fill: "none", stroke: S.c("field"), "stroke-width": AR * 0.2 }, av.inner);
    svg("line", { x1: AR + AR * 0.04, y1: AR + AR * 0.04, x2: AR + AR * 0.52, y2: AR + AR * 0.52, stroke: S.c("field"), "stroke-width": AR * 0.2, "stroke-linecap": "round" }, av.inner);
    // the slide: the list gives up its top slot (everything shifts down one step) as the new row arrives from above the edge
    const dSlide = dMove * 1.5;
    Loom.tween(inbox.mover, { y: -STEP }, { y: 0, duration: dSlide, ease: Loom.ease.editorial }, tRow + 0.1, { kind: "slide", beat: bid, name: "inbox", content: true });
    Loom.tween(nrow.mover, { y: -STEP }, { y: 0, duration: dSlide, ease: Loom.ease.editorial }, tRow + 0.1, { kind: "slide", beat: bid, name: "new_message_row", content: true });
    Loom.tween(av.mover, { y: -STEP }, { y: 0, duration: dSlide, ease: Loom.ease.editorial }, tRow + 0.1, { kind: "slide", beat: bid, name: "contact_avatar", content: true });
    m.reveal(nrow, tRow + 0.1, { dy: 0, dur: 0.2 });
    m.reveal(av, tRow + 0.1, { dy: 0, dur: 0.2 });

    // ---- 5. the key light over the screen (a wash, drawn last of the world so the rows take it) and a slow lamp breath
    // @form lamp_cone_wash: faint stacked discs of warm light spilling over a screen from an off-frame lamp, breathing slowly
    const lamp = ctx.el("key_light", { x: 0, y: 0, w: 0, h: 0, kind: "scenery", exit: "none" });
    const halo = [1300, 1050, 800, 560, 340].map((r, i) => svg("circle", { cx: 360, cy: 80, r, fill: S.c("accent"), opacity: 0.012 }, lamp.inner));
    Loom.drive((e, raw) => halo.forEach((c, i) => c.setAttribute("opacity", (0.010 + 0.004 * Math.sin(2 * Math.PI * raw + i * 0.5)).toFixed(4))), ctx.start, ctx.end - ctx.start, "linear", { kind: "ambient", beat: bid, name: "key_light" });

    // ---- 6. the chapter sting over the world on "A name you know"; the sub prints on its own words, in the sting's place
    const hold = Math.max(1.8, ctx.end - tName - 0.5);
    D.chapter(ctx, "chapter", { title: P.chapter_title, t: tName, dur: hold });
    const sub = ctx.el("chapter_sub", { x: 210, y: 520, w: 1500, h: 64, kind: "text", exit: "recede" });
    kit.text(sub.inner, P.chapter_sub, { role: "lead", x: 0, y: 0, w: 1500, h: 64, align: "center", color: "accent2", maxLines: 1 });
    m.unmask(sub, tSub, { dur: dEnter * 1.3 });
    const dOut = 0.45;
    Loom.tween(sub.life, { opacity: 1 }, { opacity: 0, duration: dOut, immediateRender: false }, tName + hold - 0.1, { kind: "exit", beat: bid, name: "chapter_sub.out" });
  },
});
