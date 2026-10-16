// @design point_at_cause: two rings point at the thing that felt safe and the act that gave it away
/* b11 - The code felt like hers alone. But anything you type, a fake page can ask for.
 * Treatments considered: (A) a slogan card (rejected: words in place of the picture); (B) CHOSEN: the picture holds; a
 * ring round the code on her phone (hers alone), then a ring round the code she typed into the look-alike page, with
 * the words anything you type.
 */
Loom.scene("b11", {
  build(ctx) {
    const M = Loom.mfa;
    M.hold(ctx, M.splitNames("_2").concat(["lap_2", "fake_page", "big_addr", "mon_2", "real_page", "thief_2", "phone_2"]));
    const tAlone = ctx.cue("hers alone");
    const tType = ctx.cue("anything you type");
    M.ring(ctx, "ring_phone", { x: 70, y: 745, w: 180, h: 300 }, tAlone + 0.05, { tone: "accent", r: 30 });
    M.ring(ctx, "ring_typed", { x: 70 + 64, y: 150 + 158 + 122, w: 620, h: 78 }, tType + 0.05, { tone: "neg", pad: 14 });
    Loom.data.tag(ctx, "tag_type", { x: 520, y: 30, text: "anything you type", color: "neg", t: tType + 0.4 });
  },
});
