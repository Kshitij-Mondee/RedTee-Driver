// @design signed_answer_roundtrip: a question goes to the device, an answer comes back stamped with where it was asked, the secret never moves
/* b13 - The site asks a fresh question. Her phone signs the answer, stamped with the page's address. The secret never
 * leaves the phone.
 * Treatments considered: (A) a cryptography diagram with keys and locks (rejected: jargon before the picture); (B)
 * CHOSEN: the real sign-in page beside the phone; a small question card travels into the phone; an answer card appears
 * beside the phone, a stamp with the real address lands on it, it travels back and the page opens on Welcome, Maya; on
 * "never leaves the phone" a ring round the key, which has not moved.
 */
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = Loom.mfa, S = Loom.style, svg = Loom.svg;
    const H = M.hold(ctx, ["phone_bg", "phone_big", "key_badge"]);
    const tAsk = ctx.cue("The site asks a fresh question");
    const tSigns = ctx.cue("Her phone signs the answer");
    const tStamp = ctx.cue("stamped with the page's address");
    const tNever = ctx.cue("never leaves the phone");
    const P = M.signin(ctx, "real_page_pk", { x: 980, y: 160, w: 840, h: 520, state: "passkey" });
    m.settle(P, ctx.start + 0.05, { dy: 16 });
    const q = M.chip(ctx, "question_chip", "a fresh question", { size: 30, stroke: "accent" });
    M.fly(q, tAsk + 0.4, 1.2, [980 + 300, 160 + 300], [490, 420], { lift: 120, keep: 0.3 });
    // the answer, signed on the phone, stamped with the real address
    // @form signed_answer: a small card that says it is a signed answer and carries the address it was made for
    const ans = ctx.el("answer_card", { x: 720, y: 730, w: 420, h: 190, kind: "card", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 420, height: 190, rx: 18, fill: S.c("surface"), stroke: S.c("pos"), "stroke-width": 4 }, ans.inner);
    kit.icon(ans.inner, "pen-line", { x: 46, y: 50, size: 40, color: "pos" });
    kit.text(ans.inner, "signed answer", { role: "lead", size: 36, x: 80, y: 20, w: 320, h: 60, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    const stamp = ctx.el("answer_stamp", { x: 24, y: 96, w: 372, h: 70, kind: "mark", exit: "recede", parent: ans.inner });
    svg("rect", { x: 0, y: 0, width: 372, height: 70, rx: 10, fill: "none", stroke: S.c("accent2"), "stroke-width": 4 }, stamp.inner);
    kit.text(stamp.inner, "login.yourwork.example", { role: "label", size: 28, x: 10, y: 0, w: 352, h: 70, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "accent2" });
    m.reveal(ans, tSigns + 0.2, { dy: 12 });
    m.stamp(stamp, tStamp + 0.3);
    Loom.sfx("tick", tStamp + 0.4);
    // the answer goes back to the page; the page opens
    const tBack = tStamp + 1.4;
    Loom.drive((e) => ans.mover.setAttribute("transform", `translate(${(e * 400).toFixed(1)} ${(-e * 300).toFixed(1)}) scale(${(1 - 0.35 * e).toFixed(3)})`),
      tBack, 0.9, "move", { kind: "travel", beat: ctx.beat.id, name: "answer_card", content: true });
    Loom.tween(ans.mover, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "none" }, tBack + 0.9, { kind: "exit", beat: ctx.beat.id, name: "answer_card.land" });
    P.press(P.pkBtn, tBack + 0.9);
    P.state("welcome", tBack + 1.05);
    Loom.sfx("whoosh", tBack);
    M.ring(ctx, "key_ring", { x: 600, y: 150, w: 130, h: 130 }, tNever + 0.05, { tone: "accent2", r: 65, pad: 10 });
    void H;
  },
});
