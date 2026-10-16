// @design same_ink_log: a lit table of identical rows where the one that matters looks exactly like the rest; a faint warm mark crosses it and fades, nothing alarms
/* Treatments: (1) static table, one row ringed (alarm, rejected); (2) rows build, the odd one sweeps with an amber wash and fades (chosen: sameness is the point);
 * (3) camera push into one row (too much motion for a rest beat). */
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, a, p) => Loom.svg(tag, a, p);

    // ---- the dark room: scenery, behind everything
    const R = ctx.el("security_desk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const I = R.inner;
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: c("field") }, I);
    svg("rect", { x: 0, y: 0, width: 1920, height: 760, fill: c("field2"), opacity: 0.55 }, I);          // back wall, a step lighter than the floor
    // desk top: a dark plane the monitor stands on
    svg("rect", { x: 0, y: 770, width: 1920, height: 310, fill: c("surface"), opacity: 0.9 }, I);
    svg("rect", { x: 0, y: 770, width: 1920, height: 3, fill: c("ink"), opacity: 0.22 }, I);              // lit front edge of the desk
    svg("rect", { x: 0, y: 773, width: 1920, height: 307, fill: c("shadow"), opacity: 0.35 }, I);
    // monitor stand
    svg("rect", { x: 880, y: 730, width: 160, height: 44, fill: c("surface2") }, I);
    svg("rect", { x: 780, y: 760, width: 360, height: 20, rx: 8, fill: c("surface2") }, I);

    // ---- the monitor: bezel and the lit plane
    const PX = 340, PY = 110, PW = 1240, PH = 610;
    const P = ctx.el("log_pane", { x: PX - 24, y: PY - 24, w: PW + 48, h: PH + 48, kind: "card", exit: "displace" });
    const PI = P.inner;
    svg("rect", { x: 0, y: 0, width: PW + 48, height: PH + 48, rx: 18, fill: c("surface2") }, PI);        // bezel
    svg("rect", { x: 24, y: 24, width: PW, height: PH, rx: 6, fill: c("surface") }, PI);                  // the lit plane
    svg("rect", { x: 24, y: 24, width: PW, height: 4, fill: c("ink"), opacity: 0.35 }, PI);
    // table geometry (local to the pane element)
    const L = 24 + 48, TW = PW - 96;
    const colX = [L, L + 360, L + 700], colW = [320, 300, 400];
    kit.text(PI, "Sign-in log", { role: "title", x: L, y: 54, w: 900, h: 90, maxLines: 1, weight: 700, align: "left" });
    const hy = 158;
    ["Time", "User", "Status"].forEach((h, i) => kit.text(PI, h, { role: "body", x: colX[i], y: hy, w: colW[i], h: 44, maxLines: 1, color: "muted", align: "left" }));
    kit.line(PI, L, hy + 54, L + TW, hy + 54, { stroke: "line", sw: 2 });
    m.settle(P, ctx.start + 0.15);

    // ---- rows (each its own element, same ink)
    const rows = [["08:57", "row_0857"], ["12:14", "row_1214"], ["17:40", "row_1740"], ["02:00", "row_0200"]];
    const RH = 86, RY0 = hy + 66;
    const tRows = ctx.cue("looks like Dana");
    let mark = null;
    rows.forEach(([time, name], i) => {
      const E = ctx.el(name, { x: L, y: RY0 + i * RH, w: TW, h: RH, kind: "text", exit: "displace", parent: P });
      const ri = E.inner;
      if (name === "row_0200") {
        mark = svg("rect", { x: 0, y: 6, width: 0, height: RH - 12, fill: c("accent"), opacity: 0 }, ri);   // the faint mark, drawn under the words
      }
      // the same ink in every row
      kit.text(ri, time, { role: "body", x: colX[0] - L, y: 12, w: colW[0], h: 56, maxLines: 1, align: "left" });
      kit.text(ri, "dana", { role: "body", x: colX[1] - L, y: 12, w: colW[1], h: 56, maxLines: 1, align: "left" });
      kit.text(ri, "success", { role: "body", x: colX[2] - L, y: 12, w: colW[2], h: 56, maxLines: 1, align: "left" });
      if (i < rows.length - 1) kit.line(ri, 0, RH - 1, TW, RH - 1, { stroke: "line", sw: 1 });
      m.reveal(E, tRows + i * 0.32);
    });

    // ---- the faint mark sweeps across the 02:00 row and fades; no alert
    const tMark = ctx.cue("harder to notice");
    const TWd = TW;
    Loom.drive((e) => {
      mark.setAttribute("width", String(Math.max(0, TWd * Math.min(1, e / 0.6))));
      const a = e < 0.6 ? 0.26 * (e / 0.6) : 0.26 * (1 - (e - 0.6) / 0.4);
      mark.setAttribute("opacity", String(Math.max(0, a)));
    }, tMark, 1.8, "editorial");
  },
});
