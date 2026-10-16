// @design checklist_closure: three commitments resolve into a still completed list
// Treatments considered: a static list with signalling; sequential checklist marks; a travelling card. Choose sequential marks because completion is the argument, then hold still.
Loom.scene("b25", {
  build(ctx) {
    const kit = ctx.kit;
    const app = ctx.held("app");
    const phone = ctx.held("phone");
    const t1 = ctx.cue("Turn it on today");
    const t2 = ctx.cue("store your backup codes");
    const t3 = ctx.cue("swap one reused password");
    // @form checklist: a calm recap card over the held application
    const P = Loom.treat.panel(ctx, "checklist", {
      x: 360, y: 290, w: 1000, h: 442,
      as: "card", fill: "surface", tone: "line", t: ctx.start
    });
    P.exit = "none";
    const rows = [
      { name: "turn_on", text: "Turn on two-step sign-in", y: 48, t: t1 },
      { name: "backup_codes", text: "Store backup codes", y: 176, t: t2 },
      { name: "swap_password", text: "Swap one reused password", y: 304, t: t3 }
    ];
    rows.forEach((r) => {
      // @form checklist_row: one readable commitment beside its completion mark
      const E = ctx.el("checklist_" + r.name, {
        x: 484, y: 290 + r.y, w: 824, h: 72, kind: "text", exit: "none"
      });
      kit.fit(r.text, { role: "lead", w: 784, h: 56, maxLines: 1 });
      kit.text(E.inner, r.text, {
        x: 20, y: 8, w: 784, h: 56, role: "lead", color: "ink", weight: 600, maxLines: 1
      });
      ctx.m.reveal(E, r.t);
    });
    // @form ticks: product-success marks arrive on the three spoken commitments
    const tick1 = Loom.treat.mark(ctx, "ticks_turn_on", { x: 400, y: 374, size: 56, kind: "yes", on: P, t: t1 });
    const tick2 = Loom.treat.mark(ctx, "ticks_backup_codes", { x: 400, y: 502, size: 56, kind: "yes", on: P, t: t2 });
    const tick3 = Loom.treat.mark(ctx, "ticks_swap_password", { x: 400, y: 630, size: 56, kind: "yes", on: P, t: t3 });
    tick1.exit = "none";
    tick2.exit = "none";
    tick3.exit = "none";
    // The completed composition stays still through the closing rest. No ambient motion.
  }
});
