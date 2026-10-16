// @design lookalike_with_address: a message, a look-alike page that is the same in every pixel but one word of its address, that word shown large
/* b08 - So the thief changes plan. Maya gets a link to sign in. The page looks exactly like hers. Only the address is
 * different.
 * Treatments considered: (A) a hook on a fishing line (rejected: a pun instead of the thing she sees); (B) two pages
 * side by side, real and fake (rejected: Maya never sees both, the viewer should be fooled with her); (C) CHOSEN: the
 * split again; Maya's laptop shows a message with a Sign in button; the press cuts to a page identical to hers; only
 * the address differs, and on "Only the address is different" its extra word turns red, ringed on the page and
 * repeated large under the laptop. The other desk waits on the real page.
 * HELD by b09-b11: split_bg_2, label_maya_2, portrait_maya_2, label_other_2, lap_2, fake_page, big_addr, mon_2,
 * real_page, thief_2, phone_2.
 */
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = Loom.mfa, S = Loom.style, svg = Loom.svg;
    const tPlan = ctx.cue("So the thief changes plan");
    const tLink = ctx.cue("Maya gets a link to sign in");
    const tLooks = ctx.cue("looks exactly like hers");
    const tAddr = ctx.cue("Only the address is different");
    void tPlan;
    const sp = M.split(ctx, "_2");
    M.laptop(ctx, "lap_2", sp.L);
    const F = M.signin(ctx, "fake_page", Object.assign({}, sp.L, { state: "password", fake: true }));
    M.monitor(ctx, "mon_2", sp.R);
    M.signin(ctx, "real_page", Object.assign({}, sp.R, { state: "password" }));
    M.thief(ctx, "thief_2", { x: 1300, y: 700, scale: 1.35 });
    M.phone(ctx, "phone_2", { x: 70, y: 745, w: 180, h: 360, state: "dark" });
    // the message, over the page until its button is pressed
    // @form message_with_link: a plain message window whose one button is the link
    const msg = ctx.el("message", { x: sp.L.x, y: sp.L.y, w: sp.L.w, h: sp.L.h, kind: "ui", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: sp.L.w, height: sp.L.h, rx: 14, fill: S.c("surface"), stroke: S.mix(S.c("surface2"), S.c("line"), 0.3), "stroke-width": 2 }, msg.inner);
    svg("path", { d: `M0 14 Q0 0 14 0 H${sp.L.w - 14} Q${sp.L.w} 0 ${sp.L.w} 14 V66 H0 Z`, fill: S.c("surface2") }, msg.inner);
    kit.text(msg.inner, "Inbox", { role: "label", size: 26, x: 40, y: 0, w: 300, h: 66, valign: "middle", maxLines: 1, weight: 700, color: "muted" });
    kit.text(msg.inner, "A file was shared with you", { role: "lead", size: 40, x: 64, y: 110, w: sp.L.w - 128, h: 56, maxLines: 1, weight: 700, color: "ink" });
    kit.text(msg.inner, "Sign in to see it.", { role: "body", size: 32, x: 64, y: 180, w: sp.L.w - 128, h: 46, maxLines: 1, color: "muted" });
    const btn = svg("g", {}, msg.inner);
    svg("rect", { x: 64, y: 270, width: 300, height: 66, rx: 12, fill: S.c("accent") }, btn);
    kit.text(btn, "Sign in", { role: "label", size: 28, x: 64, y: 270, w: 300, h: 66, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "onAccent" });
    m.reveal(msg, ctx.start + 0.3, { dy: 14 });   // the screen is never empty: the message is there from the start
    Loom.sfx("card", tLink);
    const tPress = Math.min(tLooks - 0.5, tLink + 1.6);
    F.press(btn, tPress);
    // the look-alike page is not there until the link is followed (it was printing under the message, check 2026-10-06)
    F.outer.style.visibility = "hidden";
    Loom.set(F.outer, { visibility: "inherit" }, tPress + 0.25);
    Loom.tween(msg.mover, { opacity: 1 }, { opacity: 0, duration: 0.16, ease: "none" }, tPress + 0.25, { kind: "state", beat: ctx.beat.id, name: "message.out", content: true });
    // the address: its extra word turns red, ringed on the page, and repeated large under the laptop
    const red = F.addr.seg[1];
    Loom.tween(red.node, { fill: S.c("ink") }, { fill: S.c("neg"), duration: 0.3, ease: "none" }, tAddr + 0.3, { kind: "recolour", beat: ctx.beat.id, name: "fake_page.addr", content: true });
    M.ring(ctx, "addr_ring", { x: sp.L.x + F.addr.x, y: sp.L.y + F.addr.y, w: F.addr.w, h: F.addr.h }, tAddr + 0.3, { tone: "neg", pad: 6, r: 22, sw: 4 });
    // @form big_address: the page's address repeated large, the one different word in red
    const big = ctx.el("big_addr", { x: 300, y: 770, w: 640, h: 70, kind: "label", exit: "recede" });
    let x = 0;
    for (const [i, part] of M.FAKE.entries()) {
      const Fz = kit.fit(part, { role: "lead", size: 40, w: 1000, maxLines: 1, weight: 700 });
      kit.text(big.inner, part, { role: "lead", size: 40, x, y: 0, w: Fz.width + 4, h: 60, valign: "middle", maxLines: 1, weight: 700, color: i === 1 ? "neg" : "ink" });
      if (i === 1) kit.line(big.inner, x, 64, x + Fz.width, 64, { stroke: "neg", sw: 5 });
      x += Fz.width;
    }
    m.reveal(big, tAddr + 0.6, { dy: 10 });
    Loom.sfx("tick", tAddr + 0.6);
  },
});
