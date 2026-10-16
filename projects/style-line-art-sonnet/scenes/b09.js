// @design three_to_sort: three grey dashed items wait above three coloured trays while a ring counts the learner's turn
// Treatments considered: (1) static row of items over trays with a caption; (2) items drop one by one then a ring sweeps (chosen: the pause is the learner's turn); (3) items on a conveyor.
Loom.scene("b09", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = 0.8;           // item scale inside the tray's local space
    const TS = 1.2;           // tray scale on screen
    const TX = 204, TY = 695;
    const REST = -40;         // item bottom edge when resting above a tray (tray-local)
    const IW = 280 * S, IH = 360 * S;

    // @form tray_row: three open trays in class colours across the bottom
    const T = ctx.el("trays", { x: TX, y: TY, w: 1260 * TS, h: 196 * TS, kind: "instrument", exit: "none" });
    const tr = Loom.lesson.trays(ctx, T.inner, { x: 0, y: 0, scale: TS });
    T.handle = tr;
    tr.drawIn(ctx.cue("Try three"), 0.25, 0.8);

    // row order gives no answer: payroll, job advert, org chart
    const slots = { payroll: 420, job_advert: 670, org_chart: 920 };
    const cues = { job_advert: ctx.cue("A posted job advert"), org_chart: ctx.cue("The org chart"), payroll: ctx.cue("The payroll file") };
    const make = (name) => {
      // @form dashed_item: an unclassified document, grey dashed outline
      const E = ctx.el(name, { parent: tr.mid, x: slots[name] - IW / 2, y: REST - IH, w: IW, h: IH, kind: "card", exit: "none" });
      const h = Loom.lesson.item(ctx, E.inner, { variant: name, scale: S });
      E.handle = h;
      h.drawIn(cues[name], 0.7);
      m.drop(E, cues[name], { dy: -90, dur: 0.55 });
      return E;
    };
    // creation order = depth order: the item that moves last in front
    make("payroll");
    make("job_advert");
    make("org_chart");

    // @form pause_ring: a small ring that sweeps once through the silent pause
    const R = 44, cx = 1008, cy = 180;
    const P = ctx.el("pause_ring", { x: cx - R - 6, y: cy - R - 6, w: 2 * R + 12, h: 2 * R + 12, kind: "instrument", exit: "recede" });
    const circ = "M" + (R + 6) + " 6a" + R + " " + R + " 0 1 1 0 " + (2 * R) + "a" + R + " " + R + " 0 1 1 0 " + (-2 * R);
    const RG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    P.inner.appendChild(RG);
    const track = kit.path(RG, circ, { stroke: "line", sw: 3, fill: "none" });
    track.setAttribute("stroke-opacity", 0.6);
    const arc = kit.path(RG, circ, { stroke: "accent", sw: 5, fill: "none" });
    arc.setAttribute("pathLength", "1");
    const t0 = ctx.speechEnd + 0.1, t1 = ctx.end - 0.1;
    arc.setAttribute("stroke-dasharray", "0 2");
    RG.setAttribute("opacity", 0);
    Loom.drive((e) => {
      RG.setAttribute("opacity", e > 0 ? 1 : 0);
      arc.setAttribute("stroke-dasharray", e + " 2");
    }, t0, t1 - t0, "linear");
  }
});
