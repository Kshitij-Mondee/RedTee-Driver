// @design key_inside_device: a secret shown as a key that settles inside the device that keeps it, and the ways the device is opened
/* b12 - Now give Maya a passkey. It lives on her phone, unlocked by fingerprint, face or PIN.
 * Treatments considered: (A) a definition card (rejected); (B) a vault icon (rejected: a symbol for the phone she is
 * holding); (C) CHOSEN: her phone, large; a key settles into it behind the glass; its screen lights with Use your
 * passkey; the three ways she opens her phone appear beside it as plain tiles.
 * HELD by b13: phone_big, key_badge, phone_bg.
 */
Loom.scene("b12", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = Loom.mfa, S = Loom.style, svg = Loom.svg;
    const tGive = ctx.cue("give Maya a passkey");
    const tLives = ctx.cue("It lives on her phone");
    const tOpen = ctx.cue("fingerprint, face or PIN");
    const bg = ctx.el("phone_bg", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: S.c("field") }, bg.inner);
    svg("rect", { x: 0, y: 760, width: 1920, height: 320, fill: S.mix(S.c("field"), S.c("accent2"), 0.1) }, bg.inner);
    const ph = M.phone(ctx, "phone_big", { x: 300, y: 130, w: 380, h: 760, state: "dark" });
    m.settle(ph, ctx.start + 0.1, { dy: 20 });
    // @form key_badge: a key in a round badge sitting on a device, the secret it holds
    const kb = ctx.el("key_badge", { x: 600, y: 150, w: 130, h: 130, kind: "object", exit: "recede" });
    svg("circle", { cx: 65, cy: 65, r: 62, fill: S.c("surface"), stroke: S.c("accent2"), "stroke-width": 5 }, kb.inner);
    kit.icon(kb.inner, "key-round", { x: 65, y: 65, size: 70, color: "accent2" });
    m.drop(kb, tGive + 0.1);
    Loom.sfx("card", tGive + 0.2);
    Loom.data.tag(ctx, "tag_passkey", { x: 760, y: 190, text: "passkey", color: "accent2", t: tGive + 0.5 });
    ph.state("passkey", tLives + 0.1);
    // the three ways she opens her phone
    const ways = [["way_finger", "fingerprint", "fingerprint"], ["way_face", "scan-face", "face"], ["way_pin", "rectangle-ellipsis", "PIN"]];
    ways.forEach(([nm, icon, word], i) => {
      const E = ctx.el(nm, { x: 900 + i * 320, y: 430, w: 280, h: 300, kind: "card", exit: "recede" });
      svg("rect", { x: 0, y: 0, width: 280, height: 300, rx: 24, fill: S.c("surface"), stroke: S.mix(S.c("surface2"), S.c("line"), 0.4), "stroke-width": 2 }, E.inner);
      kit.icon(E.inner, icon, { x: 140, y: 120, size: 120, color: "accent" });
      kit.text(E.inner, word, { role: "lead", size: 40, x: 0, y: 210, w: 280, h: 60, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
      m.reveal(E, tOpen + i * 0.35, { dy: 16 });
    });
    Loom.sfx("tick", tOpen + 0.1);
  },
});
