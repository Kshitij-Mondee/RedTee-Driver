// @design one_becomes_many_then_few: a single item joins a full list (many), a fan of generic items spreads and folds away, and what is left is a few empty slots
/* b05 - the message becomes one row of an ordinary inbox; ten tips fan out and fold away; four slots open.
 *
 * Treatments considered:
 *  (A) a stat card, "10 tips" struck through (rejected: the script has no such number, and a card is not a place);
 *  (B) three stacked cards sliding in (rejected: no scale, nothing to fold away);
 *  (C) CHOSEN: hold and transform on st_msg. The held message shrinks until it is one row of a full inbox
 *      (Loom.array of 14 rows, seeded bars, no words); a fan of ten blank tip cards spreads over the inbox and
 *      folds into one thin stack that slides off; a chapter sting ("Four moves") dims the inbox and one empty
 *      frame draws in with four open slots. One becomes many, many becomes few, both named by the narration.
 *
 * Continuity: "inbox" (text-free rows, 14, row 6 is the message's own row) is what b06 keeps as its backdrop; the
 * message ends squashed onto that row's rect (x 210, y 408, 1500 x 48) and fades into the identical drawn row.
 */
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, svg = Loom.svg, tc = (t) => S.c(t);
    const meta = (kind, name, content) => ({ kind, beat: ctx.beat.id, name, content: !!content });

    // ---- cues
    const tGlance = ctx.cue("You already glance"), tSender = ctx.cue("sender and subject"), tSubject = ctx.cue("subject");
    const tTips = ctx.cue("not ten more tips"), tFour = ctx.cue("Just four moves"), tHurry = ctx.cue("for the message that says hurry");

    // ---- hold the dimmed message from b03/b04
    const msg = ctx.held("message");
    const ROW = { x: 210, y0: 60, w: 1500, h: 48, pitch: 58, n: 14, mine: 6 };
    const rowY = ROW.y0 + ROW.mine * ROW.pitch, cy = rowY + ROW.h / 2;

    // ---- 1. the message shrinks to a window among its inbox, the dim lifts
    const sA = 0.3, wx = 960 - 1920 * sA / 2, wy = cy - 1080 * sA / 2;
    Loom.tween(msg.mover, { x: 0, y: 0, scaleX: 1, scaleY: 1, transformOrigin: "0 0" }, { x: wx, y: wy, scaleX: sA, scaleY: sA, duration: 1.1, ease: Loom.ease.editorial }, tGlance, meta("travel", "message", true));
    if (msg.wash) Loom.tween(msg.wash, { opacity: 0.55 }, { opacity: 0, duration: 1.1, ease: Loom.ease.editorial }, tGlance, meta("grade", "message.wash", true));

    // ---- the inbox: 14 rows arrive around it from the centre out (Loom.array), grey sender and subject bars, no words
    // @form inbox_row_array: a full list of seeded rows (unread dot, sender bar, subject bar, time bar) as the ordinary background of a day
    const chrome = ctx.el("inbox_chrome", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: tc("field2") }, chrome.inner);
    svg("rect", { x: ROW.x, y: 16, width: 620, height: 28, rx: 14, fill: tc("surface2") }, chrome.inner);
    [0, 1, 2, 3, 4].forEach((i) => svg("rect", { x: 36, y: 80 + i * 64, width: 100 + (i % 3) * 18, height: 10, rx: 5, fill: tc("line"), opacity: i === 0 ? 0.9 : 0.5 }, chrome.inner));
    m.reveal(chrome, ctx.start + 0.05, { dy: 0 });
    const inbox = Loom.array(ctx, "inbox", { x: ROW.x, y: ROW.y0, cols: 1, rows: ROW.n, dx: 0, dy: ROW.pitch, w: ROW.w, h: ROW.n * ROW.pitch, seed: "b05:inbox", order: "centre", t: tSender, stagger: 0.05, rise: 10,
      draw: (g, i, r, c, rnd) => {
        const mine = r === ROW.mine, unread = mine || rnd() < 0.4;
        svg("rect", { x: 0, y: 0, width: ROW.w, height: ROW.h, rx: 8, fill: tc(mine ? "surface" : "surface2") }, g);
        svg("circle", { cx: 28, cy: ROW.h / 2, r: 6, fill: tc(unread ? "accent" : "line"), opacity: unread ? 1 : 0.5 }, g);
        svg("rect", { x: 60, y: ROW.h / 2 - 4.5, width: 110 + Math.round(rnd() * 90), height: 9, rx: 4.5, fill: tc("muted"), opacity: unread ? 0.9 : 0.55 }, g);
        svg("rect", { x: 330, y: ROW.h / 2 - 4.5, width: 420 + Math.round(rnd() * 560), height: 9, rx: 4.5, fill: tc("line"), opacity: unread ? 0.9 : 0.5 }, g);
        svg("rect", { x: ROW.w - 110, y: ROW.h / 2 - 4.5, width: 70, height: 9, rx: 4.5, fill: tc("line"), opacity: 0.4 }, g);
      } });
    // insert into the message's own parent (a held element can live in another group than this scene's new ones)
    msg.outer.parentNode.insertBefore(chrome.outer, msg.outer);
    msg.outer.parentNode.insertBefore(inbox.outer, msg.outer);       // rows sit behind the shrinking message

    // ---- the message folds onto its own row: a squash to the row's rect while its content gives way to the identical drawn row
    Loom.tween(msg.mover, { x: wx, y: wy, scaleX: sA, scaleY: sA, transformOrigin: "0 0" }, { x: ROW.x, y: rowY, scaleX: ROW.w / 1920, scaleY: ROW.h / 1080, duration: 0.85, ease: Loom.ease.editorial }, tSubject, meta("travel", "message", true));
    Loom.tween(msg.inner, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: Loom.ease.exit }, tSubject + 0.45, meta("exit", "message.content", true));

    // ---- 2. ten blank tips fan out over the inbox on "not ten more tips", fold into a stack, slide off
    // @form fan_of_cards: items spread from one pivot in a seeded arc, then fold back to a stack and leave
    const PIV = [960, 1010], N = 10, rot = [];
    const fan = Loom.array(ctx, "tip_fan", { x: PIV[0], y: PIV[1], cols: N, rows: 1, dx: 0, dy: 0, w: 10, h: 10, seed: "b05:tips", order: "centre", t: tTips, stagger: 0.04, rise: 0,
      draw: (g, i, r, c, rnd) => {
        const a = -54 + c * 12 + (rnd() - 0.5) * 3, G = svg("g", {}, g);
        svg("rect", { x: -125, y: -340, width: 250, height: 340, rx: 14, fill: tc("surface"), stroke: tc("line"), "stroke-width": 3 }, G);
        [0.7, 0.55, 0.62].forEach((f, k) => svg("rect", { x: -95, y: -300 + k * 34, width: 190 * f, height: 8, rx: 4, fill: tc("muted"), opacity: 0.45 }, G));
        rot.push({ G, a, c });
      } });
    rot.forEach(({ G, a, c }) => {
      Loom.tween(G, { rotation: 0, transformOrigin: "0px 0px" }, { rotation: a, duration: 0.6, ease: Loom.ease.enter }, tTips + c * 0.03, meta("fan", "tip_fan." + c, true));
      Loom.tween(G, { rotation: a, transformOrigin: "0px 0px" }, { rotation: c * 0.8 - 3.6, duration: 0.35, ease: Loom.ease.editorial, immediateRender: false }, tTips + 0.85 + (N - c) * 0.012, meta("fold", "tip_fan." + c, true));
    });
    m.travel(fan, tTips + 1.3, { x: 1700, y: 0, dur: 0.42 });
    const tagTips = Loom.data.tag(ctx, "tag_tips", { x: 640, y: 590, text: "Not ten more tips", role: "lead", color: "accent2", textColor: "onAccent", t: tTips + 0.2 });
    m.exit(tagTips, tTips + 0.85, "wipe");

    // ---- 3. the chapter sting dims the inbox; then one empty frame with four open slots draws in
    Loom.data.chapter(ctx, "chapter_four", { title: "Four moves", t: tFour, top: 120, dur: ctx.speechEnd - tFour + 0.3 });
    // @form frame_with_open_slots: an empty frame whose slots are drawn as outlines one after another, waiting to be filled
    const FW = 1400, FH = 360, SW = 310, GAP = 30, M0 = (FW - (4 * SW + 3 * GAP)) / 2;
    const fr = ctx.el("four_slots", { x: 260, y: 500, w: FW, h: FH, kind: "scenery" });
    const rr = (x, y, w, h, r) => `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
    const framePath = kit.path(fr.inner, rr(0, 0, FW, FH, 24), { stroke: "line", sw: 5 });
    const slotPaths = [0, 1, 2, 3].map((i) => kit.path(fr.inner, rr(M0 + i * (SW + GAP), 40, SW, FH - 80, 16), { stroke: "accent", sw: 4 }));
    m.draw(framePath, tHurry, { dur: 0.7 });
    slotPaths.forEach((p, i) => m.draw(p, tHurry + 0.5 + i * 0.3, { dur: 0.5 }));
  },
});
