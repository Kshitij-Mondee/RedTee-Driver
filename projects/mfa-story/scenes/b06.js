// @design three_proofs_on_a_desk: the kinds of proof drawn as the real things on the owner's desk, each named as it is said
/* b06 - That is MFA, multi-factor authentication. Two kinds of proof: something you know, something you have, or
 * something you are.
 * Treatments considered: (A) a definition card with three bullets (rejected: the old lesson's deck); (B) three icons in
 * a row (rejected: icons where the story already has the real things); (C) CHOSEN: Maya's desk, close: her password
 * field with its dots, her phone with the code, her fingertip on a reader; each lifts and takes its label on its words.
 */
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = Loom.mfa, S = Loom.style, svg = Loom.svg;
    const tMfa = ctx.cue("That is MFA");
    const tKnow = ctx.cue("something you know");
    const tHave = ctx.cue("something you have");
    const tAre = ctx.cue("something you are");
    const bg = ctx.el("desk_close", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: S.c("field") }, bg.inner);
    svg("rect", { x: 0, y: 620, width: 1920, height: 460, fill: S.mix(S.c("field"), S.c("accent2"), 0.1) }, bg.inner);
    // the title, top left: the name and its long form
    const tt = ctx.el("mfa_title", { x: 140, y: 70, w: 1640, h: 150, kind: "title", exit: "recede" });
    kit.text(tt.inner, "MFA", { role: "title", size: 84, x: 0, y: 0, w: 300, h: 100, maxLines: 1, weight: 700, color: "accent" });
    kit.text(tt.inner, "multi-factor authentication", { role: "lead", size: 40, x: 260, y: 22, w: 1200, h: 60, maxLines: 1, color: "ink" });
    m.reveal(tt, tMfa + 0.05, { dy: 10 });
    // 1 know: the password field, large
    // @form proof_object: one real thing standing for a kind of proof, lifted when named, its kind written under it
    const pw = ctx.el("proof_know", { x: 140, y: 420, w: 520, h: 130, kind: "object", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 520, height: 130, rx: 18, fill: S.c("surface"), stroke: S.mix(S.c("surface2"), S.c("line"), 0.45), "stroke-width": 3 }, pw.inner);
    kit.text(pw.inner, "Password", { role: "label", size: 26, x: 30, y: 14, w: 300, h: 34, maxLines: 1, color: "muted" });
    for (let i = 0; i < 10; i++) svg("circle", { cx: 50 + i * 42, cy: 88, r: 12, fill: S.c("ink") }, pw.inner);
    // 2 have: the phone with the code
    const ph = M.phone(ctx, "proof_have", { x: 820, y: 280, w: 280, h: 560, state: "code" });
    // 3 are: a fingertip on a reader
    const fp = ctx.el("proof_are", { x: 1300, y: 330, w: 440, h: 420, kind: "object", exit: "recede" });
    svg("circle", { cx: 220, cy: 200, r: 170, fill: S.c("surface"), stroke: S.mix(S.c("surface2"), S.c("line"), 0.45), "stroke-width": 3 }, fp.inner);
    kit.icon(fp.inner, "fingerprint", { x: 220, y: 200, size: 210, color: "accent" });
    const labels = [["label_know", "something you know", 140, 520, tKnow, pw], ["label_have", "something you have", 700, 520, tHave, ph], ["label_are", "something you are", 1260, 520, tAre, fp]];
    for (const [nm, text, x, w, t, obj] of labels) {
      const L = ctx.el(nm, { x, y: 870, w, h: 60, kind: "label", exit: "recede" });
      kit.text(L.inner, text, { role: "lead", size: 40, x: 0, y: 0, w, h: 60, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
      m.reveal(L, t + 0.05, { dy: 10 });
      m.settle(obj, t - 0.2, { dy: 24 });
      Loom.sfx("tick", t + 0.1);
    }
  },
});
