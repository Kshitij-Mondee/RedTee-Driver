// @design three_checks_in_turn: one record is read row by row, each row lit while named and sealed with a tick
// Treatments considered: (1) static card with three ticks already placed, (2) rows lit one at a time with a tick on each spoken word (chosen: the sequence is the idea), (3) a checklist beside the card (rejected: duplicates the card).
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    // held stage, shared with the beats before and after
    ["browser", "server", "path", "watcher", "step_bar", "packet", "tls_wrap", "cert", "check_panel"].forEach((n) => ctx.held(n));

    const tThree = ctx.cue("checks three things");
    const tIssRow = ctx.cue("a trusted authority");
    const tIssTick = ctx.cue("issued it");
    const tNameRow = ctx.cue("the name matches");
    const tNameTick = ctx.cue("the address");
    const tDateRow = ctx.cue("and it has not");
    const tDateTick = ctx.cue("expired");

    // the large certificate, same place and size as the held card; its rows light and tick here
    // @form cert_rows: the large certificate with its three check rows
    const CE = ctx.el("cert_rows", { x: 600, y: 170, w: 700, h: 440, kind: "card" });
    // an opaque plate under the card: the path and the quiet watcher stay behind it while the rows are read
    const plate = Loom.svg("rect", { x: 70, y: 10, width: 620, height: 420, rx: 20, fill: ctx.c("field") }, CE.inner);
    Loom.tween(plate, { opacity: 0 }, { opacity: 1, duration: 0.5 }, ctx.start, { kind: "reveal", name: "cert_plate", content: true });
    const card = Loom.lesson.certificate_card(ctx, CE.inner, { origin: [600, 170] });

    // three small ticks, one per row, each a pop on its own word (the card's own tick fades in beneath)
    const ROWY = [356, 446, 536];
    const mkTick = (name, y) => {
      // @form tick_row: a teal tick that lands at the end of a row
      const E = ctx.el(name, { x: 1206, y: y - 30, w: 60, h: 60, kind: "mark" });
      kit.mark(E.inner, "yes", 30, 30, 52);
      return E;
    };
    const raise = (E) => { const p = E.outer.parentNode; if (p) p.appendChild(E.outer); };
    raise(CE);
    const tIss = mkTick("tick_issuer", ROWY[0]);
    const tName = mkTick("tick_name", ROWY[1]);
    const tDate = mkTick("tick_date", ROWY[2]);
    [tIss, tName, tDate].forEach((E) => Loom.set(E.outer, { opacity: 0 }, 0));

    // a bracket that says "three": it draws down the right of the rows as the three things are named
    // @form rows_bracket: a thin bracket gathering the three rows
    const BR = ctx.el("rows_bracket", { x: 1300, y: 316, w: 30, h: 250, kind: "connector" });
    const bp = Loom.svg("path", { d: "M4 4 H22 V246 H4", fill: "none", stroke: ctx.c("muted"), "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, BR.inner);
    m.draw(bp, tThree, { dur: 0.8 });

    // row by row: lit while spoken (accent), then the tick
    card.setState("row_issuer", tIssRow);
    card.setState("tick_issuer", tIssTick);
    m.pop(tIss, tIssTick);

    card.setState("row_name", tNameRow);
    card.setState("tick_name", tNameTick);
    m.pop(tName, tNameTick);

    card.setState("row_date", tDateRow);
    card.setState("tick_date", tDateTick);
    m.pop(tDate, tDateTick);
  },
});
