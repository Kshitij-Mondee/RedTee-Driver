// @design evidence_board_insert_on_the_words: the held board; the camera pushes in on one line of the message and the comparison is lettered under it
/* b19: "Now slow down. The name says IT support. The address has one letter changed." The camera (the board's own
 * mover) pushes in on the sender row until the address reads large; the one changed letter is marked in the
 * address, and the spelling it should have is set under it with the matching letter marked. b20 pulls back. */
Loom.scene("b19", {
  build(ctx) {
    const U = Loom.ui, K = Loom.kit, S = Loom.style, bid = ctx.beat.id;
    const board = ctx.held("board");
    if (!board || !board.ui) return;
    board.ui.names.forEach((n) => ctx.held(n));
    const { mail } = board.ui;
    const ad = U.phrase(mail, "address", "yourcompeny");
    // the push: scale until the sender row (avatar to the end of the address) fills the width, its left edge kept
    // in frame, the row a little above centre (one progress drives scale and position)
    const role = "label", size = Loom.style.size("label", 24), real = "should be  yourcompany.example";
    const whole = U.at(mail, "address"), fw = K.measure(real, role, size, 600);
    const left = mail.E.x + 24, right = Math.max(whole.x + whole.w, ad.x + fw + 20) + 40;   // the whole address and the row under it
    const Z = Math.min(2.3, 1800 / (right - left)), TX = 60 - Z * left, TY = 470 - Z * ad.cy;
    board.ui.zoom = { Z, TX, TY };
    const cam = (e) => board.mover.setAttribute("transform", `translate(${(TX * e).toFixed(2)} ${(TY * e).toFixed(2)}) scale(${(1 + (Z - 1) * e).toFixed(4)})`);
    board.ui.cam = cam;
    Loom.drive((e) => cam(e), ctx.cue("Now slow down"), 1.4, "editorial", { kind: "camera", beat: bid, name: "board.push", key: "board.camera" });
    // the push crops the page on purpose until b20 has pulled back: declared, so the frame-edge check knows
    const tPush = ctx.cue("Now slow down");
    board.outer.setAttribute("data-bleed", `${tPush.toFixed(2)}-${(ctx.end + 1.4).toFixed(2)}`);
    // "The address has one letter changed": the letter is marked where it is written
    const tOne = ctx.cue("one letter changed");
    U.mark(ctx, mail, "address", "e", tOne, { near: "compeny", tone: "accent3", opacity: 0.8, dur: 0.25 });
    // and the spelling it should have is set under the address, its matching letter marked the same way
    const x0 = ad.x, y0 = ad.y + ad.h + 6;
    const RH = Math.round(size * 1.9);
    const E = ctx.el("expected_row", { x: x0 - 14, y: y0, w: fw + 28, h: RH, kind: "label", parent: board.inner });
    K.rect(E.inner, 0, 0, fw + 28, RH, { fill: "surface2", r: 8, crisp: true, shadow: false });
    const pre = K.measure("should be  yourcomp", role, size, 600), lw = K.measure("a", role, size, 600);
    Loom.svg("rect", { x: 14 + pre - 2, y: (RH - size * 1.14) / 2, width: lw + 4, height: size * 1.14, rx: 4, fill: S.c("accent3"), opacity: 0.8 }, E.inner);
    K.text(E.inner, real, { role, x: 14, y: 0, w: fw + 4, h: RH, size, weight: 600, valign: "middle", maxLines: 1 });
    // the spelling it should have is on screen while the sentence starts, so the eye can compare before the letter is named
    const tAddr = ctx.cue("The address");
    Loom.motion.reveal(E, tAddr, { dy: -6 });
    // the row covers where the time sits on the "to" line: the time steps out while it is there (b20 brings it back)
    if (mail.nodes.time) Loom.tween(mail.nodes.time, { opacity: 1 }, { opacity: 0, duration: 0.25 }, tAddr - 0.1, { kind: "fade_out", beat: bid, name: "message.time", content: true });
    board.ui.names.push("expected_row");
  },
});
