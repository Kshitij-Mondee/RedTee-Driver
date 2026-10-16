// @design nothing_to_relay: the same trap, but the device checks the address and gives the page nothing; the other screen waits
/* b14 - Same fake page. This time there is nothing to type. Her phone sees the wrong address, and stays silent. The
 * thief has nothing to pass on.
 * Treatments considered: (A) a red cross over the fake page (rejected: says blocked without showing why); (B) CHOSEN:
 * the split again; the look-alike page now shows only Sign in with a passkey; Maya presses it; the address repeats
 * large under the laptop with its extra word in red; a dashed line from her phone to that word ends in a small cross
 * and the phone stays dark; the other desk waits on Check your phone with nothing arriving.
 */
Loom.scene("b14", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = Loom.mfa, S = Loom.style, svg = Loom.svg;
    const tSame = ctx.cue("Same fake page");
    const tNothing = ctx.cue("nothing to type");
    const tWrong = ctx.cue("the wrong address");
    const tSilent = ctx.cue("stays silent");
    const tPass = ctx.cue("nothing to pass on");
    void tSame;
    const sp = M.split(ctx, "_3");
    M.laptop(ctx, "lap_3", sp.L);
    const F = M.signin(ctx, "fake_page_pk", Object.assign({}, sp.L, { state: "passkey", fake: true, markFake: true, waitText: "Waiting" }));
    M.monitor(ctx, "mon_3", sp.R);
    const R = M.signin(ctx, "real_page_wait", Object.assign({}, sp.R, { state: "wait" }));
    R.waitDots(ctx.start, ctx.end);
    M.thief(ctx, "thief_3", { x: 1300, y: 700, scale: 1.35 });
    const ph = M.phone(ctx, "phone_3", { x: 70, y: 745, w: 180, h: 360, state: "dark" });
    void ph;
    F.press(F.pkBtn, tNothing + 0.2);
    F.state("wait", tNothing + 0.45);
    F.waitDots(tNothing + 0.45, ctx.end);
    M.ring(ctx, "addr_ring_3", { x: sp.L.x + F.addr.x, y: sp.L.y + F.addr.y, w: F.addr.w, h: F.addr.h }, tWrong, { tone: "neg", pad: 6, r: 22, sw: 4 });
    const big = ctx.el("big_addr_3", { x: 300, y: 770, w: 640, h: 70, kind: "label", exit: "recede" });
    let x = 0, mid = 0;
    for (const [i, part] of M.FAKE.entries()) {
      const Fz = kit.fit(part, { role: "lead", size: 40, w: 1000, maxLines: 1, weight: 700 });
      kit.text(big.inner, part, { role: "lead", size: 40, x, y: 0, w: Fz.width + 4, h: 60, valign: "middle", maxLines: 1, weight: 700, color: i === 1 ? "neg" : "ink" });
      if (i === 1) { kit.line(big.inner, x, 64, x + Fz.width, 64, { stroke: "neg", sw: 5 }); mid = x + Fz.width / 2; }
      x += Fz.width;
    }
    m.reveal(big, tWrong + 0.2, { dy: 10 });
    // the phone reads the address and says nothing: a dashed look that ends in a small cross
    // @form check_line: a dashed line from a device to what it checks, ending in a tick or a cross
    const chk = ctx.el("check_line", { x: 0, y: 0, w: 1, h: 1, kind: "connector", exit: "recede" });
    const ln = kit.path(chk.inner, `M256 900 C 300 900 ${300 + mid - 80} 900 ${300 + mid - 26} 896`, { stroke: "muted", sw: 3 });
    ln.setAttribute("stroke-dasharray", "6 8");
    Loom.motion.draw(ln, tSilent - 0.2, { dur: 0.6 });
    const cx = ctx.el("check_cross", { x: 300 + mid - 20, y: 876, w: 40, h: 40, kind: "mark", exit: "recede" });
    kit.path(cx.inner, "M6 6 L34 34 M34 6 L6 34", { stroke: "neg", sw: 6 });
    m.pop(cx, tSilent + 0.4);
    Loom.sfx("error", tSilent + 0.45);
    M.ring(ctx, "wait_ring", { x: sp.R.x + 64, y: sp.R.y + 158 + 20, w: sp.R.w - 128, h: 240 }, tPass + 0.1, { tone: "muted", pad: 10 });
  },
});
