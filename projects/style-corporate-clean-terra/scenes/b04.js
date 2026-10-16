// @design one_copy_four_losses: four distinct failure signals land around one report and each demonstrates the same loss
Loom.scene("b04", {
  keep: ["laptop", "report_main", "rail"],
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments considered: four static warnings, four chips orbiting the device, or one active chip at a time. Chosen: one active chip at a time, so every cause points to the same single-copy outcome.
    const tDrive = ctx.cue("A dead drive is one way to lose it.");
    const tStolen = ctx.cue("A stolen laptop.");
    const tDelete = ctx.cue("A wrong delete.");
    const tRansom = ctx.cue("Ransomware.");

    // @form reset_laptop: the held laptop returns to its usable state before the four tests
    const laptop = ctx.held("laptop");
    // @form reset_report: the held Report refills before each failure can take it away
    const report = ctx.held("report_main");
    // @form rule_rail_home: the held rule rail recedes to its bottom home while remaining unlit
    const rail = ctx.held("rail");
    laptop.handle.setState("on", ctx.start + 0.08, { dur: ctx.style.dur("move") });
    report.handle.setState("restored", ctx.start + 0.14, { dur: ctx.style.dur("move") });
    rail.handle.setAll("unlit", ctx.start + 0.12, { stagger: 0.06, dur: ctx.style.dur("move") });
    m.travel(rail, ctx.start + 0.10, { x: -370, y: 320, scale: 0.65, dur: 0.72 });

    const chip = (name, x, y, label, icon, t, next, locked) => {
      // @form failure_chip: a compact white pill names each cause
      const E = ctx.el(name, { x, y, w: 360, h: 72, kind: "token", exit: "recede" });
      kit.pill(E.inner, 0, 0, 360, 72, { fill: "surface", stroke: "surface2", sw: 2, shadow: true });
      kit.icon(E.inner, icon, { x: 22, y: 20, size: 32, color: "ink" });
      kit.text(E.inner, label, { role: "label", x: 68, y: 0, w: 268, h: 72, valign: "middle", color: "ink", weight: 700 });
      // @form active_failure_mark: the blue icon disc is the one active failure at a time
      const active = ctx.el(`${name}_active`, { x: name === "chip_ransom" ? x : x + 10, y: y + 10, w: 52, h: 52, kind: "mark", exit: "recede" });
      kit.disc(active.inner, 26, 26, 26, { fill: "accent" });
      kit.icon(active.inner, icon, { x: 10, y: 10, size: 32, color: "onAccent" });
      m.settle(E, t, { dy: 18, dur: ctx.style.dur("enter") });
      m.pop(active, t + 0.04);
      if (next != null) m.exit(active, next - 0.12, "recede");
      report.handle.setState(locked ? "locked" : "empty", t + 0.15, { dur: ctx.style.dur("move") * 0.55 });
      if (!locked) report.handle.setState("whole", next - 0.28, { dur: ctx.style.dur("move") * 0.55 });
      return E;
    };

    // @form chip_drive: the drive cause lands beside the laptop's upper left
    chip("chip_drive", 110, 310, "Drive failure", "hard-drive", tDrive, tStolen, false);
    // @form chip_stolen: the theft cause lands at the right of the laptop
    chip("chip_stolen", 1120, 350, "Lost or stolen", "map-pin-off", tStolen, tDelete, false);
    // @form chip_deleted: the deletion cause lands below the laptop at left
    chip("chip_deleted", 120, 590, "Deleted by mistake", "trash-2", tDelete, tRansom, false);
    // @form chip_ransom: the locked final cause lands beside the lower right of the laptop
    chip("chip_ransom", 1120, 520, "Ransomware", "lock", tRansom, null, true);
  },
});
