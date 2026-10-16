// @design three_outcomes_side_by_side: the three things from the story in a row, each showing what happens to it
/* b19 - A password can be copied. A code can be passed on. A passkey answers only the real site.
 * Treatments considered: (A) a recap list (rejected: the list comes next, in b20); (B) CHOSEN: the password field, the
 * typed code and the phone with its key in a row; the password's copy slides out of it; the code slides away to a
 * small other screen; the phone gets the stamp of the real address. Each on its words.
 */
Loom.scene("b19", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = Loom.mfa, S = Loom.style, svg = Loom.svg;
    const tCopied = ctx.cue("can be copied");
    const tPassed = ctx.cue("can be passed on");
    const tReal = ctx.cue("only the real site");
    const bg = ctx.el("recap_bg", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: S.c("field") }, bg.inner);
    // 1 the password and its copy
    const field = (nm, x, y, tone) => {
      const E = ctx.el(nm, { x, y, w: 460, h: 110, kind: "object", exit: "recede" });
      svg("rect", { x: 0, y: 0, width: 460, height: 110, rx: 16, fill: S.c("surface"), stroke: S.c(tone || "line"), "stroke-width": 3 }, E.inner);
      for (let i = 0; i < 10; i++) svg("circle", { cx: 46 + i * 38, cy: 55, r: 11, fill: S.c("ink") }, E.inner);
      return E;
    };
    field("recap_pw", 110, 360);
    const cp = field("recap_pw_copy", 110, 360, "neg");
    cp.mover.setAttribute("opacity", 0);
    Loom.set(cp.mover, { opacity: 1 }, tCopied);
    Loom.drive((e) => cp.mover.setAttribute("transform", `translate(${(30 * e).toFixed(1)} ${(150 * e).toFixed(1)})`), tCopied, 0.8, "move",
      { kind: "travel", beat: ctx.beat.id, name: "recap_pw_copy", content: true });
    // 2 the code and where it goes
    M.monitor(ctx, "recap_mon", { x: 1040, y: 560, w: 260, h: 160 });
    const code = M.chip(ctx, "recap_code", "482 913", { size: 44, stroke: "neg", tracking: 3 });
    code.mover.setAttribute("opacity", 1);
    code.mover.setAttribute("transform", `translate(${790} ${380})`);
    const mv = svg("g", {}, code.inner);
    void mv;
    Loom.drive((e) => code.mover.setAttribute("transform", `translate(${(790 + (1170 - 0.6 * code.cw / 2 - 790) * e).toFixed(1)} ${(380 + (640 - 0.6 * code.ch / 2 - 380) * e).toFixed(1)}) scale(${(1 - 0.4 * e).toFixed(3)})`),
      tPassed + 0.05, 0.9, "move", { kind: "travel", beat: ctx.beat.id, name: "recap_code", content: true });
    // 3 the phone with its key, stamped with the real address
    const ph = M.phone(ctx, "recap_phone", { x: 1460, y: 250, w: 260, h: 520, state: "passkey" });
    void ph;
    const st = ctx.el("recap_stamp", { x: 1360, y: 650, w: 460, h: 70, kind: "mark", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 460, height: 70, rx: 10, fill: S.c("surface"), stroke: S.c("accent2"), "stroke-width": 4 }, st.inner);
    kit.text(st.inner, "login.yourwork.example", { role: "label", size: 30, x: 10, y: 0, w: 440, h: 70, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "accent2" });
    m.stamp(st, tReal + 0.1);
    const labels = [["recap_l1", "can be copied", 90, tCopied], ["recap_l2", "can be passed on", 730, tPassed], ["recap_l3", "only the real site", 1330, tReal]];
    for (const [nm, text, x, t] of labels) {
      const L = ctx.el(nm, { x, y: 820, w: 520, h: 60, kind: "label", exit: "recede" });
      kit.text(L.inner, text, { role: "lead", size: 40, x: 0, y: 0, w: 520, h: 60, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
      m.reveal(L, t + 0.05, { dy: 10 });
      Loom.sfx("tick", t + 0.1);
    }
  },
});
