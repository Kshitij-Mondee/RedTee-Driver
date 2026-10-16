// @design two_homes_one_fault: a second kind of home takes the copies, so a fault on one leaves the other whole
// Treatments considered: (1) static pair with labels, (2) copies travel into a second home then a fault is shown on one, (3) tile-led. Chose 2: the travel and the fault are the idea.
Loom.scene("b06", { build(ctx, props) {
  const m = ctx.m, kit = ctx.kit, c = ctx.c;
  const tEnter = ctx.cue("Two: two kinds of storage");
  const tLap = ctx.cue("the laptop");
  const tDrive = ctx.cue("an external drive");
  const tFault = ctx.cue("One fault");
  const tBoth = ctx.cue("unlikely to take both");
  const tBack = Math.max(tBoth + 0.9, ctx.speechEnd - 0.9);

  const laptop = ctx.held("laptop");
  const rep = ctx.held("report_main");
  const rail = ctx.held("rail");

  // copies: held from b05; if absent, draw them at the row right of the laptop
  function copyOf(name, i) {
    let E = null;
    try { E = ctx.held(name); } catch (e) { E = null; }
    if (E && E.outer) return { E: E, w: E.w, h: E.h };
    const size = 160, W = Math.round(size * 0.75);
    const N = ctx.el(name, { x: 900 + i * (W + 24), y: 330, w: W, h: size, kind: "card", exit: "none" });
    N.handle = Loom.lesson.report_file(ctx, N.inner, { size: size });
    return { E: N, w: W, h: size };
  }
  const ca = copyOf("copy_a", 0), cb = copyOf("copy_b", 1);

  // desk line under the laptop and on to the right
  const deskY = 629;
  const DL = ctx.el("desk_line", { x: 200, y: deskY - 4, w: 1240, h: 8, kind: "scenery", exit: "none" });
  const dl = kit.line(DL.inner, 0, 4, 1240, 4, { stroke: "line", sw: 4 });
  m.draw(DL, tLap, { dur: ctx.style.dur("draw") });

  // label Laptop
  const LL = ctx.el("label_laptop", { x: 400, y: 648, w: 300, h: 44, kind: "text", exit: "none" });
  kit.text(LL.inner, "Laptop", { role: "label", size: 28, x: 0, y: 0, w: 300, h: 44, align: "center", valign: "middle", weight: 700, color: "muted" });
  m.unmask(LL, tLap + 0.25, { dir: "ltr" });

  // external drive settles on the desk line
  const DR = ctx.el("ext_drive", { x: 960, y: 366, w: 380, h: 258, kind: "instrument", exit: "none" });
  DR.handle = Loom.lesson.ext_drive(ctx, DR.inner, {});
  m.settle(DR, tDrive);

  const LD = ctx.el("label_drive", { x: 1000, y: 648, w: 300, h: 44, kind: "text", exit: "none" });
  kit.text(LD.inner, "External drive", { role: "label", size: 28, x: 0, y: 0, w: 300, h: 44, align: "center", valign: "middle", weight: 700, color: "muted" });
  m.unmask(LD, tDrive + 0.3, { dir: "ltr" });

  // copies travel into the drive's two slots
  const slots = DR.handle.slots;
  [ca, cb].forEach((cp, i) => {
    const sl = slots[i];
    const sc = sl.h / cp.h;
    const tx = 960 + sl.x + (sl.w - cp.w * sc) / 2, ty = 366 + sl.y;
    m.travel(cp.E, tDrive + 0.3 + i * 0.35, { x: tx - cp.E.x, y: ty - cp.E.y, scale: sc });
  });

  // rail: tile 3 settles accent -> ink; tile 2 named with its label
  const rh = rail.handle;
  if (rh) {
    rh.setState(0, "lit", tEnter + 0.1);
    rh.setState(1, "named", tBoth);
    const tl = rh.tiles && rh.tiles[1];
    if (tl) {
      if (tl.labelG && tl.labelG.childNodes.length) {
        // enlarge the rail's own label about its top centre so it reads at the 26px floor once the rail is scaled
        tl.labelG.setAttribute("transform", "translate(" + (tl.w / 2) + " " + (tl.h + 12) + ") scale(1.55) translate(" + (-tl.w / 2) + " " + (-(tl.h + 12)) + ")");
        rh.showLabel(1, tBoth + 0.1);
      }
      else {
        const lg = Loom.svg("g", { opacity: 0 }, tl.g);
        kit.text(lg, "2 kinds of storage", { role: "label", size: 30, x: -80, y: tl.h + 12, w: tl.w + 160, h: 42, align: "center", valign: "top", maxLines: 1, weight: 700, color: "muted" });
        // rail is drawn scaled down, so scale the label up about its top centre to read at the 26px floor
        lg.setAttribute("transform", "translate(" + (tl.w / 2) + " " + (tl.h + 12) + ") scale(1.5) translate(" + (-tl.w / 2) + " " + (-(tl.h + 12)) + ")");
        Loom.drive(function (e, raw) { lg.setAttribute("opacity", String(Math.max(0, Math.min(1, raw)))); }, tBoth + 0.1, 0.4, "linear", { key: "b06_tile2_label" });
      }
    }
  }

  // one fault: laptop fails and its copy empties; drive copies stay whole
  laptop.handle.setState("failed", tFault);
  rep.handle.setState("empty", tFault);
  // the laptop comes back and the Report refills
  laptop.handle.setState("on", tBack);
  rep.handle.setState("restored", tBack + 0.1);
} });
