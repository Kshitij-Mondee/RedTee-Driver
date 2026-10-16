// @design one_thing_four_threats: the same single object is emptied by four different causes, each a chip that lands and takes the accent
// Treatments: (1) static grid of four chips with the Report beside (rejected: no cause and effect); (2) chips fly into the Report (crosses laptop);
// (3) chosen: chips land one per spoken item in the empty right half, the Report flicks empty then whole after each, locked on the last.
Loom.scene("b04", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const c = ctx.c;
    const L = Loom.lesson;

    // ---- held from b02/b03, same boxes (fallbacks draw at the shared coordinates)
    const LAP = { x: 240, y: 250, w: 620 };
    const lapSize = L.laptop.size({ w: LAP.w });
    let lapE = ctx.held("laptop"), lapH;
    if (lapE) { lapH = lapE.handle; }
    else {
      lapE = ctx.el("laptop", { x: LAP.x, y: LAP.y, w: lapSize.w, h: lapSize.h, kind: "instrument", exit: "none" });
      lapH = L.laptop(ctx, lapE.inner, { w: LAP.w, state: "failed" });
    }
    const slot = lapH.slot;
    let repE = ctx.held("report_main"), repH;
    if (repE) { repH = repE.handle; }
    else {
      const rs = L.report_file.size({ size: slot.h });
      repE = ctx.el("report_main", { x: LAP.x + slot.x, y: LAP.y + slot.y, w: rs.w, h: rs.h, kind: "card", exit: "none" });
      repH = L.report_file(ctx, repE.inner, { size: slot.h, state: "empty" });
    }
    const RAILPOS = { x: 872, y: 422 };
    const railSize = L.rule_rail.size({ size: "large", labels: false });
    let railE = ctx.held("rail"), railH;
    if (railE) { railH = railE.handle; }
    else {
      railE = ctx.el("rail", { x: RAILPOS.x, y: RAILPOS.y, w: railSize.w, h: railSize.h, kind: "instrument", exit: "none" });
      railH = L.rule_rail(ctx, railE.inner, { size: "large", labels: false });
    }

    // ---- first second: rail goes home along the bottom, laptop back on, Report refilled
    const S = 0.55;
    const t0 = ctx.start + 0.1;
    m.travel(railE, t0, { x: Math.round(960 - railSize.w * S / 2) - RAILPOS.x, y: 772 - RAILPOS.y, scale: S });
    lapH.setState("on", t0);
    repH.setState("restored", t0 + 0.2);

    // ---- chips
    const CH = { w: 380, h: 76 };
    const specs = [
      { name: "chip_drive", text: "Drive failure", icon: "hard-drive", x: 960, y: 360, cue: ctx.cue("A dead drive") },
      { name: "chip_stolen", text: "Lost or stolen", icon: "map-pin-off", x: 1380, y: 360, cue: ctx.cue("A stolen laptop") },
      { name: "chip_deleted", text: "Deleted by mistake", icon: "trash-2", x: 960, y: 500, cue: ctx.cue("A wrong delete") },
      { name: "chip_ransom", text: "Ransomware", icon: "lock", x: 1380, y: 500, cue: ctx.cue("Ransomware") },
    ];
    const chips = specs.map((s) => {
      const E = ctx.el(s.name, { x: s.x, y: s.y, w: CH.w, h: CH.h, kind: "token", exit: "recede" });
      kit.pill(E.inner, 0, 0, CH.w, CH.h, { fill: "surface", stroke: "line", r: CH.h / 2, shadow: true });
      const acc = kit.pill(E.inner, 0, 0, CH.w, CH.h, { fill: "accent", stroke: "accent", r: CH.h / 2 });
      acc.setAttribute("opacity", 0);
      const ic = kit.icon(E.inner, s.icon, { x: 44, y: CH.h / 2, size: 36, color: "ink" });
      const tx = kit.text(E.inner, s.text, { role: "label", size: 28, x: 78, y: 0, w: CH.w - 78 - 24, h: CH.h, valign: "middle", align: "left", color: "ink", weight: 600 });
      const parts = [ic, tx];
      return { s, E, acc, parts };
    });
    const recolour = (ch, from, to, t, dur) => {
      Loom.tween(ch.parts[1], { fill: c(from) }, { fill: c(to) }, t, { dur });
      const kids = ch.parts[0].querySelectorAll ? Array.from(ch.parts[0].querySelectorAll("*")) : [];
      kids.forEach((k) => Loom.tween(k, { stroke: c(from) }, { stroke: c(to) }, t, { dur }));
    };

    chips.forEach((ch, i) => {
      const t = ch.s.cue;
      m.settle(ch.E, t);
      Loom.tween(ch.acc, { opacity: 0 }, { opacity: 1 }, t, { dur: 0.25 });
      recolour(ch, "ink", "onAccent", t, 0.25);
      const last = i === chips.length - 1;
      if (!last) {
        const tn = chips[i + 1].s.cue;
        Loom.tween(ch.acc, { opacity: 1 }, { opacity: 0 }, tn, { dur: 0.3 });
        recolour(ch, "onAccent", "ink", tn, 0.3);
        repH.setState("empty", t + 0.1);
        repH.setState("restored", Math.min(t + 1.2, tn - 0.3));
      } else {
        repH.setState("locked", t + 0.1);
      }
    });
  },
});
