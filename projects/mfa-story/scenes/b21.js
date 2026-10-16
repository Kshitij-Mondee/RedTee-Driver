// @design payoff_back_in_place: the opening shot returns, now handled, with the one line the lesson leaves
/* b21 - With a passkey, Maya has nothing to hand over.
 * Treatments considered: (A) a closing title card (rejected: the lesson ends where it began, in her office); (B)
 * CHOSEN: the office again; her screen shows Sign in with a passkey, she signs in, Welcome, Maya; she smiles; the line
 * nothing to hand over sets large under her screen.
 */
Loom.scene("b21", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = Loom.mfa, S = Loom.style, svg = Loom.svg;
    const tWith = ctx.cue("With a passkey");
    const tHand = ctx.cue("nothing to hand over");
    const O = M.officeShot(ctx, "_end", { state: "passkey" });
    O.si.press(O.si.pkBtn, tWith + 0.3);
    O.si.state("welcome", tWith + 0.6);
    O.maya.emotion("smile", tWith + 0.7);
    const ln = ctx.el("closing_line", { x: 990, y: 750, w: 880, h: 140, kind: "title", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 880, height: 140, rx: 22, fill: S.c("surface"), opacity: 0.94 }, ln.inner);
    kit.text(ln.inner, "Nothing to hand over", { role: "title", size: 72, x: 24, y: 14, w: 832, h: 96, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    kit.line(ln.inner, 320, 118, 560, 118, { stroke: "accent", sw: 6 });
    m.reveal(ln, tHand + 0.05, { dy: 12 });
  },
});
