// @design held_rerun_one_change: the same held schematic re-runs with one change, a lens on the detail that decides it, and the verdict stamped into a running tally
/* b15 - Run four, same fake page. Your passkey will not answer a look-alike. Nothing to type, nothing to pass on.
 *
 * Treatments considered:
 *   (A) side-by-side cards "login.yourwork.example" vs "login.yourw0rk.example" over the dimmed bench (rejected:
 *       it states the rule and drops the run; the payoff is that run four is run three with one change).
 *   (B) static composition: the box spliced, DENIED already stamped, the two addresses shown (rejected: the
 *       refusal is an ABSENCE, the answer that formed in b13 does not form; only re-running the same request and
 *       showing nothing travel back shows an absence).
 *   (C) CHOSEN: run three re-run exactly: the look-alike box slides into the line, the look-alike page swaps onto
 *       the laptop (a passkey button, no fields). The box sends a request to the phone; the key's own address and
 *       the address the request carries are hung one above the other, and a lens opens on the one character that
 *       differs. The key goes dark, no answer forms; the form has nothing to type into; the onward line to the
 *       real door stays empty. DENIED on the box and in tally cell 4.
 * Rules taken (docs/primitives/magnify.md: a lens on the detail that decides the run, a live copy; Kurzgesagt study:
 * a running comparison that returns with one new result): accent2 marks the mismatched character, then the
 * empty form, then the empty onward line; threat stays out of this run (the box is grey and disguised); the
 * passkey's cyan goes dark when it refuses.
 * Continuity: holds laptop, phone, line, door, door_plate, run_slot, tally, phone_vault and screen (screen retires
 * in the swap). Everything leaves before the chapter cut to b16 (exits are set to recede here).
 */
Loom.scene("b15", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, T = Loom.treat;
    const B = ctx.beat.id;
    const mono = S.font("mono").family;
    const held = {};
    for (const n of ["laptop", "phone", "line", "door", "door_plate", "run_slot", "tally", "phone_vault", "screen"]) held[n] = ctx.held(n);
    const { door, tally, screen } = held;
    const vault = held.phone_vault, rs = held.run_slot;

    const tRun = ctx.cue("Run four");
    const tSame = ctx.cue("same fake page");
    const tPass = ctx.cue("Your passkey will not answer a look-alike");
    const tKey = ctx.cue("passkey");
    const tNot = ctx.cue("not answer");
    const tLook = ctx.cue("look-alike");
    const tType = ctx.cue("Nothing to type");
    const tOn = ctx.cue("nothing to pass on");

    /* ---------------- run four: the label, the door shut, the box splices into the line ---------------- */
    if (rs && rs.slot) rs.slot.relabel("RUN 4: A PASSKEY", tRun);
    if (door && door.swing && door.isOpen) door.swing(tRun + 0.05, false, { dur: 0.4 });
    // @form lookalike_door_box: a replica of the site's door with a near-identical address plate, spliced into a line
    const box = ctx.el("fake_box", { x: 980, y: 560, w: 300, h: 320, kind: "object", exit: "recede" });
    {
      const g = box.inner;
      kit.rect(g, 0, 0, 300, 320, { fill: "surface", stroke: "line", sw: 3, r: 3, shadow: false });
      kit.rect(g, 14, 150, 272, 70, { fill: "surface2", r: 2, shadow: false, crisp: true });
      kit.text(g, "login.yourw0rk.example", { role: "caption", x: 10, y: 14, w: 280, h: 30, maxLines: 1, align: "center", color: "muted" });
    }
    Loom.tween(box.inner, { opacity: 0, y: -90 }, { opacity: 1, y: 0, duration: 0.6, ease: Loom.ease.enter }, tRun + 0.35, { kind: "slide", beat: B, name: "fake_box", content: true });
    box.revealT = tRun + 0.35; box.revealKind = "slide";

    /* ---------------- same fake page: the look-alike page swaps in, a passkey button, no fields ---------------- */
    if (screen) m.exit(screen, tSame, "recede");
    const fs = ctx.el("fake_screen", { x: 150, y: 495, w: 410, h: 255, kind: "card", exit: "recede" });
    let formBox = null;
    {
      const g = fs.inner;
      kit.rect(g, 0, 0, 410, 255, { fill: "surface", r: 4, shadow: false, crisp: true });
      kit.rect(g, 0, 0, 410, 44, { fill: "surface2", r: 4, shadow: false, crisp: true });
      kit.rect(g, 14, 15, 12, 10, { fill: "muted", r: 2, shadow: false, crisp: true });
      kit.path(g, "M 16.5 15 V 12 A 3.5 3.5 0 0 1 23.5 12 V 15", { stroke: "muted", sw: 2 });
      const addr = "login.yourw0rk.example";
      const aw = Math.ceil(kit.measure(addr, "mono", 24, 400)) + 4;
      const at = kit.text(g, addr, { role: "label", size: 24, x: 36, y: 4, w: aw, h: 36, valign: "middle", maxLines: 1, color: "muted" });
      at.setAttribute("font-family", mono); at.setAttribute("font-weight", 400);
      kit.text(g, "Sign in", { role: "lead", size: 34, x: 24, y: 52, w: 360, h: 48, maxLines: 1, weight: 700, valign: "middle" });
      Loom.ui.button(ctx, g, { x: 24, y: 128, label: "Sign in with a passkey", h: 52, w: 362, fill: "line" });
      formBox = { x: 18, y: 190, w: 374, h: 52 };   // where a field would be: empty
    }
    Loom.tween(fs.inner, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: ctx.style.dur("enter"), ease: Loom.ease.enter }, tSame + 0.3, { kind: "swap", beat: B, name: "fake_screen", content: true });
    fs.revealT = tSame + 0.3; fs.revealKind = "swap";

    /* ---------------- the request, and the two addresses one above the other ---------------- */
    // the comparison lives in one element so the lens can show both lines in its live copy
    const cmp = ctx.el("address_check", { x: 0, y: 0, w: 1000, h: 520, kind: "group", exit: "recede" });
    const keyText = "login.yourwork.example", askText = "login.yourw0rk.example";
    const kcx = 772, kcy = 318;
    const G = T.labelGeom(kcx, kcy, keyText, { as: "tag", role: "label" });
    const glyphX = G.x + G.h / 2 + G.padX, size = G.F.size;
    const ktag = T.label(ctx, "vault_tag", { x: kcx, y: kcy, text: keyText, tone: "surface", role: "label", as: "tag", to: [706, 632], t: tKey, parent: cmp.inner });
    void ktag;
    const ay = kcy + 52;
    // @form address_line: an address in label type, set directly under another so the two compare letter by letter
    const ask = ctx.el("request_address", { x: glyphX - 120, y: ay - 26, w: 120 + Math.ceil(kit.measure(askText, "label", size, 700)) + 8, h: 52, kind: "label", exit: "recede", parent: cmp.inner });
    kit.text(ask.inner, "asked by", { role: "caption", x: 0, y: 0, w: 108, h: 52, align: "right", valign: "middle", maxLines: 1, color: "muted" });
    kit.text(ask.inner, askText, { role: "label", size, x: 120, y: 0, w: ask.w - 120, h: 52, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    const zx = glyphX + kit.measure("login.yourw", "label", size, 700), zw = kit.measure("0", "label", size, 700);
    // the mark on the one character that differs (drawn in the comparison so the lens sees it land)
    const mark = Loom.svg("rect", { x: zx - ask.x - 4, y: 6, width: zw + 8, height: 40, rx: 4, fill: "none", stroke: S.c("accent2"), "stroke-width": 3, opacity: 0 }, ask.inner);

    // @form challenge_chip: a small outlined pill holding a row of dots, here in the look-alike's grey
    const rq = ctx.el("request_chip", { x: 0, y: 0, w: 96, h: 36, kind: "token", exit: "recede" });
    kit.rect(rq.inner, 0, 0, 96, 36, { fill: "field", r: 18, stroke: "muted", sw: 3, shadow: false, crisp: true });
    const rng = Loom.rng("mfa-b15-dots");
    for (let i = 0; i < 5; i++) Loom.svg("circle", { cx: 18 + i * 15, cy: 18, r: (2.4 + rng() * 3).toFixed(2), fill: S.c("muted") }, rq.inner);
    const rp = Loom.svg("path", { d: "M 935 720 H 880 L 840 704", fill: "none", stroke: "none" }, ctx.g);
    const tGo = tPass, tAt = tGo + 0.8, RL = rp.getTotalLength();
    m.reveal(rq, tGo - 0.1, { dy: 0, dur: 0.2 });
    Loom.drive((e) => { const p = rp.getPointAtLength(RL * e); rq.mover.setAttribute("transform", `translate(${(p.x - 48).toFixed(2)} ${(p.y - 18).toFixed(2)})`); }, tGo, 0.8, "editorial", { kind: "value_travel", beat: B, name: "request_chip", content: true });
    Loom.sfx("whoosh", tGo);
    // the address it carries is read out above, joined to it by a dashed lead
    const lead = ctx.el("request_lead", { x: 0, y: 0, w: 0, h: 0, kind: "connector", exit: "recede" });
    const lp = kit.path(lead.inner, `M 842 684 C 842 560 ${(ask.x + ask.w - 30).toFixed(1)} 470 ${(ask.x + ask.w - 30).toFixed(1)} ${ay + 28}`, { stroke: "muted", sw: 2.5, dash: "3 8" });
    m.draw(lp, tAt, { dur: 0.4 });
    lead.revealT = tAt;
    Loom.tween(ask.inner, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: ctx.style.dur("enter"), ease: Loom.ease.enter }, tAt + 0.1, { kind: "reveal", beat: B, name: "request_address", content: true });
    ask.revealT = tAt + 0.1; ask.revealKind = "reveal";
    cmp.revealT = tKey;

    // the lens on the differing character: both lines inside it, the 0 marked as it lands
    const mg = Loom.magnify(ctx, "address", { source: cmp, focus: { x: zx + zw / 2, y: (kcy + ay) / 2, r: 54 }, at: { x: 1130, y: 290, r: 170 }, ring: "accent2", t: Math.max(tNot, tAt + 0.3), dur: 0.9 });
    const tMark = Math.max(tLook, mg.landed);
    Loom.tween(mark, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: Loom.ease.enter }, tMark, { kind: "reveal", beat: B, name: "mismatch_mark", content: true });
    // the key stays dark: no answer forms
    if (vault && vault.key) Loom.hold.heat([vault.key], tMark + 0.25, { from: "accent", to: "line", attr: "stroke", dur: 0.5 });
    if (vault && vault.compartment) Loom.hold.heat([vault.compartment], tMark + 0.25, { from: "accent", to: "line", attr: "stroke", dur: 0.5 });

    /* ---------------- nothing to type: the lens closes, the empty form is marked ---------------- */
    mg.exit(tType);
    // @form empty_slot_outline: a thin dashed accent outline around a place where something would be, and is not
    const empty = Loom.svg("rect", { x: formBox.x, y: formBox.y, width: formBox.w, height: formBox.h, rx: 4, fill: "none", stroke: S.c("accent2"), "stroke-width": 2.5, "stroke-dasharray": "8 7", opacity: 0 }, fs.inner);
    Loom.tween(empty, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: Loom.ease.enter }, tType + 0.35, { kind: "reveal", beat: B, name: "empty_form", content: true });
    Loom.tween(mark, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: Loom.ease.exit }, tType + 0.35, { kind: "exit", beat: B, name: "mismatch_mark" });

    /* ---------------- nothing to pass on: the onward line stays empty, DENIED ---------------- */
    const onward = ctx.el("onward_stub", { x: 1280, y: 700, w: 160, h: 40, kind: "connector", exit: "recede" });
    const op = kit.path(onward.inner, "M 4 20 H 156", { stroke: "accent2", sw: 4, dash: "10 9" });
    m.draw(op, tOn, { dur: 0.45 });
    onward.revealT = tOn;
    Loom.tween(empty, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: Loom.ease.exit }, tOn, { kind: "exit", beat: B, name: "empty_form" });
    // @form verdict_stamp: a tilted, double-ruled verdict word stamped on the thing that was judged
    const st = T.label(ctx, "door_stamp", { x: 1130, y: 780, text: "DENIED", tone: "pos", role: "lead", as: "stamp" });
    const tSt = tOn + 0.5;
    m.stamp(st, tSt);
    Loom.sfx("land", tSt);
    if (tally && tally.verdict) tally.verdict(3, "DENIED", "pos", tSt + 0.35);

    // everything leaves before the chapter cut to b16
    for (const E of Object.values(held)) if (E && (E.exit === "none" || E.exit == null)) E.exit = "recede";
  },
});
