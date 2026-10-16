// @design spliced_middleman: a look-alike of the gate is spliced into the line while the person's actions stay exactly the same
/* b08 - run three: a link opens a page that only looks real; you type exactly as before.
 *
 * Treatments considered:
 *  (A) a warning card "phishing". Rejected: it names the threat instead of showing what changed.
 *  (B) a second, separate bench for the attack. Rejected: the point is that YOUR bench and YOUR actions are the same.
 *  (C) CHOSEN: one change on the held bench. The real page on the laptop is swapped in place for a look-alike, a
 *      grey replica of the door slides down into the middle of the line, and you type the password, then the code,
 *      exactly as in b01. Both chips stop, poised, at the replica's left edge (b09 freezes here; b10 relays them).
 *
 * Beat sheet:
 *  "Run three"                run_slot relabels; lock_know closes again
 *  "Say a link opens a page"  the real page sinks out of the screen rect; the look-alike page settles in its place
 *  "that only looks real"     the replica slides down onto the line (0.6 s, ease out); accent2 on it, then greys
 *  "You type your password"   dots type into Password; the password chip runs from the laptop to the replica
 *  "then your code"           the phone lights; the code types; the code chip rises and follows; both rest
 *
 * HELD ELEMENT CONTRACT (b09 keeps, b10 holds): fake_box at x 980 y 560 w 300 h 320 (its centre is on the line at
 * (1130, 720)); fake_screen in the screen rect; pw_token and code_token chips with cw, ch and __c = their resting
 * centre on the line.
 */
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const B = ctx.beat.id;
    const mono = S.font("mono").family;
    const H = {};
    for (const n of ["laptop", "screen", "phone", "line", "door", "door_plate", "run_slot", "tally", "lock_know", "lock_have"]) H[n] = ctx.held(n);
    const { phone, screen } = H, rs = H.run_slot;

    const fade = (node, a, b, t, dur, name, key) => {
      node.__fk = node.__fk || key || Loom.uid("b08fade");
      return Loom.drive((e) => node.setAttribute("opacity", (a + (b - a) * e).toFixed(3)), t, dur, "enter", { kind: "recolour", beat: (Loom.ctxBeat && Loom.ctxBeat.id) || B, name, key: node.__fk });
    };
    const monoText = (g, str, o) => {
      const w = Math.ceil(kit.measure(str, "mono", o.size, o.weight || 400)) + 4;
      const t = kit.text(g, str, { role: "label", size: o.size, x: o.x, y: o.y, w, h: o.h, align: "left", valign: "middle", maxLines: 1, color: o.color || "ink" });
      t.setAttribute("font-family", mono);
      return t;
    };
    const chip = (name, word) => {
      const F = kit.fit(word, { role: "label", w: 260, maxLines: 1, weight: 700, size: 26 });
      const ch = Math.round(F.height + 2 * 9), cw = Math.ceil(F.width + 2 * 18);
      const E = ctx.el(name, { x: 0, y: 0, w: cw, h: ch, kind: "token", exit: "recede" });
      // @form token_chip: a small labelled chip that travels on a line, carrying one credential
      kit.rect(E.inner, 0, 0, cw, ch, { fill: "ink", r: ch / 2, shadow: false, crisp: true });
      kit.text(E.inner, word, { role: "label", size: F.size, x: 18, y: 9, w: cw - 36, h: ch - 18, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "field" });
      E.cw = cw; E.ch = ch;
      return E;
    };
    const run = (E, pathD, keys) => {
      const p = Loom.svg("path", { d: pathD, fill: "none", stroke: "none" }, ctx.g);
      const L = p.getTotalLength();
      const t0 = keys[0][0], t1 = keys[keys.length - 1][0], ease = Loom.ease.editorial;
      Loom.drive((e, raw) => {
        const now = t0 + raw * (t1 - t0);
        let f = keys[keys.length - 1][1];
        for (let i = 0; i < keys.length - 1; i++) {
          const [ta, fa] = keys[i], [tb, fb] = keys[i + 1];
          if (now <= tb) { const u = tb > ta ? Math.max(0, Math.min(1, (now - ta) / (tb - ta))) : 1; f = fa + (fb - fa) * ease(u); break; }
        }
        const pt = p.getPointAtLength(L * f);
        E.mover.setAttribute("transform", `translate(${(pt.x - E.cw / 2).toFixed(2)} ${(pt.y - E.ch / 2).toFixed(2)})`);
      }, t0, Math.max(0.01, t1 - t0), "linear", { kind: "value_travel", beat: B, name: E.name, content: true });
      return L;
    };

    const tRun = ctx.cue("Run three");
    const tSay = ctx.cue("Say a link opens a page");
    const tReal = ctx.cue("that only looks real");
    const tType = ctx.cue("You type your password");
    const tCode = ctx.cue("then your code");

    // ---------------------------------------------------------------- run three
    if (rs && rs.slot) rs.slot.relabel("RUN 3: A LOOK-ALIKE PAGE", tRun + 0.1);
    if (H.lock_know && H.lock_know.isOpen) H.lock_know.close(tRun + 0.3);

    // ---------------------------------------------------------------- the real page leaves; the look-alike takes its place
    if (screen) m.exit(screen, tSay, "sink");
    const fs = ctx.el("fake_screen", { x: 150, y: 495, w: 410, h: 255, kind: "card", exit: "recede" });
    {
      const g = fs.inner;
      // @form signin_page: a product-neutral sign-in page with an address line, a title, two fields and a button
      kit.rect(g, 0, 0, 410, 255, { fill: "surface", r: 4, shadow: false, crisp: true });
      kit.rect(g, 0, 0, 410, 44, { fill: "surface2", r: 4, shadow: false, crisp: true });
      kit.rect(g, 14, 18, 12, 10, { fill: "muted", r: 2, shadow: false, crisp: true });
      Loom.svg("path", { d: "M 16.5 18 V 15 A 3.5 3.5 0 0 1 23.5 15 V 18", stroke: S.c("muted"), "stroke-width": 2, fill: "none" }, g);
      monoText(g, "login.yourw0rk.example", { x: 36, y: 4, h: 36, size: 24, color: "muted" });
      kit.text(g, "Sign in", { role: "lead", size: 34, x: 24, y: 42, w: 360, h: 48, maxLines: 1, weight: 700, valign: "middle" });
      const f1 = Loom.ui.field(ctx, g, { x: 24, y: 90, w: 362, h: 50, role: "label", pad: 16 });
      const p1 = kit.text(f1.g, "Password", { role: "label", size: 24, x: 40, y: 90, w: 330, h: 50, valign: "middle", maxLines: 1, color: "muted" });
      const f2 = Loom.ui.field(ctx, g, { x: 24, y: 144, w: 362, h: 50, role: "label", pad: 16 });
      const p2 = kit.text(f2.g, "Code from your phone", { role: "label", size: 24, x: 40, y: 144, w: 330, h: 50, valign: "middle", maxLines: 1, color: "muted" });
      Loom.ui.button(ctx, g, { x: 24, y: 200, label: "Continue", h: 48, w: 180, fill: "line" });
      fs.page = { f1, f2, p1, p2 };
    }
    m.settle(fs, tSay + 0.35, { dy: 10 });

    // ---------------------------------------------------------------- the replica slides down onto the line
    const box = ctx.el("fake_box", { x: 958, y: 500, w: 344, h: 380, kind: "object", exit: "recede" });
    {
      const g = Loom.svg("g", { transform: "translate(22 60)" }, box.inner);   // the door body sits at station y 560
      // @form replica_gate: a grey replica of a gate, the same drawing in greys with one character changed on its plate
      kit.rect(g, 0, 0, 300, 320, { fill: "surface", stroke: "line", sw: 3, r: 3, shadow: false });
      Loom.svg("rect", { x: 22, y: 22, width: 256, height: 92, rx: 2, fill: "none", stroke: S.c("line"), "stroke-width": 1.5, opacity: 0.55 }, g);
      Loom.svg("rect", { x: 12, y: 126, width: 276, height: 68, fill: S.c("surface2") }, g);
      Loom.svg("rect", { x: 22, y: 206, width: 256, height: 92, rx: 2, fill: "none", stroke: S.c("line"), "stroke-width": 1.5, opacity: 0.55 }, g);
      Loom.svg("rect", { x: 262, y: 170, width: 9, height: 40, rx: 4.5, fill: S.c("muted") }, g);
      const aw = Math.ceil(kit.measure("login.yourw0rk.example", "mono", 24, 400)) + 4;
      kit.rect(g, 150 - aw / 2 - 12, -58, aw + 24, 46, { fill: "surface2", r: 6, shadow: false, crisp: true });
      monoText(g, "login.yourw0rk.example", { x: 150 - aw / 2, y: -57, h: 44, size: 24, color: "ink" });
      const glow = Loom.svg("rect", { x: -4, y: -4, width: 308, height: 328, rx: 5, fill: "none", stroke: S.c("accent2"), "stroke-width": 4, opacity: 0 }, g);
      box.glow = glow;
    }
    Loom.tween(box.inner, { y: -260, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: Loom.ease.enter }, tReal, { kind: "slide", beat: B, name: "fake_box", content: true });
    box.revealT = tReal;
    fade(box.glow, 0, 1, tReal + 0.4, 0.3, "fake_box");
    fade(box.glow, 1, 0, tType - 0.1, 0.4, "fake_box");
    Loom.sfx("whoosh", tReal);

    // ---------------------------------------------------------------- you type exactly as before; the chips stop at the replica
    const tTyped = m.typeInto(fs.page.f1, "••••••••••", tType, { cps: 20, lead: 0.1, hold: 0.2 });
    fade(fs.page.p1, 1, 0, tType - 0.02, 0.08, "fake_screen");
    const pw = chip("pw_token", "password");
    const code = chip("code_token", "code");
    // there is no room for two chips side by side between the phone's junction and the replica, so the code waits on
    // top of the password, a step up from the line (b10 relays each from its resting centre)
    const pwC = [975 - pw.cw / 2, 720], codeC = [975 - code.cw / 2, 720 - pw.ch - 8];
    pw.__c = pwC; code.__c = codeC;
    const pwD = "M 575 515 H 830 V 720 H 980";
    const pwL = 255 + 205 + 150;
    const tPwGo = Math.max(tTyped, tType + 0.6);
    m.reveal(pw, tPwGo - 0.15, { dy: 0, dur: 0.2 });
    run(pw, pwD, [[tPwGo, 0], [tPwGo + 1.1, (pwL - (980 - pwC[0])) / pwL]]);
    Loom.sfx("whoosh", tPwGo);

    const tLit = phone && phone.light ? phone.light(tCode) : tCode + 0.35;
    m.typeInto(fs.page.f2, "482 913", tCode + 0.2, { cps: 14, lead: 0.05, hold: 0.2 });
    fade(fs.page.p2, 1, 0, tCode + 0.15, 0.08, "fake_screen");
    const codeD = `M 720 700 V 720 H ${pwC[0] - pw.cw / 2 - 16} L ${codeC[0]} ${codeC[1]}`;
    const codeL = 1;
    const tCdGo = Math.max(tLit + 0.1, tCode + 0.5);
    m.reveal(code, tCdGo - 0.2, { dy: 12, dur: 0.3 });
    run(code, codeD, [[tCdGo, 0], [Math.min(ctx.end - 0.3, tCdGo + 1.0), codeL]]);
    Loom.sfx("whoosh", tCdGo);
  },
});
