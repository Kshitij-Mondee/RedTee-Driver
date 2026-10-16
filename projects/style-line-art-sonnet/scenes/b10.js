// @design sort_and_correct: each grey item falls into the tray of its class and takes that outline colour; the harmless-looking one pauses over the wrong tray, then corrects
// Treatments considered: (1) static sorted trays; (2) drop and recolour with a hover-then-settle for the common wrong guess (chosen); (3) arrows from items to trays.
Loom.scene("b10", {
  build(ctx, props) {
    const { m } = ctx;
    const trays = ctx.held("trays"), adv = ctx.held("job_advert"), org = ctx.held("org_chart"), pay = ctx.held("payroll");
    const tr = trays.handle;
    const IW = 224, IH = 288;
    const SINK = 52;               // item bottom edge when sunk into a tray (tray-local)
    const HOVER = -222;            // org chart bottom edge while it hovers over Public
    const TX = 204, TY = 695, TS = 1.2;
    const sunkTop = TY + TS * (SINK - IH), hoverTop = TY + TS * (HOVER - IH);
    const leftOf = (i) => TX + TS * (tr.drop[i].x - IW / 2);

    const tPub = ctx.cue("Public");
    const tInt = ctx.cue("internal, confidential");
    const tCon = ctx.cue("confidential");
    const tHarm = ctx.cue("looks harmless");
    const tStay = ctx.cue("it stays internal");

    // moves run on each item's life group in tray-local units, relative to where the item rests
    const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
    const restL = { payroll: 420 - IW / 2, job_advert: 670 - IW / 2, org_chart: 920 - IW / 2 }, restT = -40 - IH;
    const goL = (i) => tr.drop[i].x - IW / 2, goSunk = SINK - IH, goHover = HOVER - IH;
    // legs: [start, dur, x, y] in tray-local top-left coordinates; hover adds a small float
    const run = (E, name, legs, hoverFrom, hoverTo) => {
      const t0 = legs[0][0], t1 = legs[legs.length - 1][0] + legs[legs.length - 1][1];
      Loom.drive((e) => {
        const t = t0 + e * (t1 - t0);
        let x = restL[name], y = restT;
        legs.forEach((lg) => { const u = ease((t - lg[0]) / lg[1]); x = x + (lg[2] - x) * u; y = y + (lg[3] - y) * u; });
        if (hoverFrom !== undefined && t > hoverFrom && t < hoverTo) y += 4 * Math.sin(2 * Math.PI * (t - hoverFrom) / 1.6) * Math.min(1, (t - hoverFrom) / 0.3);
        E.life.setAttribute("transform", "translate(" + (x - restL[name]).toFixed(2) + " " + (y - restT).toFixed(2) + ")");
      }, t0, t1 - t0, "linear");
    };
    run(adv, "job_advert", [[tPub, 0.6, goL(0), goSunk]]);
    run(org, "org_chart", [[tInt, 0.4, goL(0), goHover], [tStay, 0.6, goL(1), goSunk]], tInt + 0.4, tStay);
    run(pay, "payroll", [[tCon, 0.6, goL(2), goSunk]]);

    // job advert takes the accent outline
    //
    adv.handle.setClass("public", tPub + 0.45);

    // org chart drifts over Public and hovers (the common wrong guess)
    tr.highlight(0, true, tInt + 0.4);

    // payroll drops into Confidential and takes the accent3 outline
    pay.handle.setClass("confidential", tCon + 0.45);

    // org chart corrects: across to Internal, outline amber
    tr.highlight(0, false, tStay);
    org.handle.setClass("internal", tStay + 0.5);
    tr.highlight(1, true, tStay + 0.6);
  }
});
