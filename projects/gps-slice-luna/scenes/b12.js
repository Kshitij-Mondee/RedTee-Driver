// @design b12: operations resolve a measured interval into range
Loom.scene("b12", {
  build(ctx) {
    // Three treatments considered:
    // A static ledger with three signalled rows.
    // A subtraction expression that types in, then gives way to a range line.
    // Chosen: the phone readout lights each spoken operation, with the stamped time physically joining its row.
    const rows = ctx.el("rows", { x: 1300, y: 520, w: 500, h: 262, kind: "card" });
    // @form phone_readout: the timer and three operation rows
    const panel = Loom.lesson.phone(ctx, rows.inner, {
      form: "readout",
      rows: ["arrival", "sending", "x speed of light"],
      timer: true,
      fmt: function () { return "0.07"; },
      unit: "s"
    });

    const arrival = ctx.cue("Your phone takes the arrival time,");
    const sending = ctx.cue("subtracts the sending time,");
    const multiply = ctx.cue("and multiplies by the speed of light.");

    panel.setState("readout_rows", arrival, { row: 0 });
    panel.lightRow(0, sending, false);
    panel.setState("readout_rows", sending, { row: 1 });
    panel.lightRow(1, multiply, false);
    panel.setState("readout_rows", multiply, { row: 2 });

    panel.rows.forEach(function (row) {
      row.t1.setAttribute("font-size", 29);
      row.t2.setAttribute("font-size", 29);
    });

    const chip = ctx.held("stamp");
    // The held clock chip is nested in the pulse, whose settled origin is (760, 612).
    // Place it at the left edge of the sending row so the panel cannot cover it.
    if (chip) ctx.m.travel(chip, sending, { x: 524, y: 60, scale: 0.72 });

    // @form product_line: a light path from the readout toward satellite A
    const link = ctx.el("product_line", { x: 430, y: 230, w: 1070, h: 300, kind: "connector" });
    const stroke = ctx.kit.path(link.inner, "M1070 290 L0 0", {
      fill: "none", stroke: "accent2", sw: 3, opacity: 0.72
    });
    ctx.m.draw(stroke, multiply, { dur: 0.9 });

    const timer = ctx.held("timer");
    const readoutLink = ctx.held("readout_link");
    if (timer) ctx.m.exit(timer, ctx.speechEnd);
    if (readoutLink) ctx.m.exit(readoutLink, ctx.speechEnd);
    if (chip) ctx.m.exit(chip, ctx.speechEnd);
  }
});
