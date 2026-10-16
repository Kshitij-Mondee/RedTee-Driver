// @design light_spreading_door_to_door: a long hall of doors receding from the first open door, light joining floor wedges door by door, a heavier last door tried
/* Treatments: (1) static hall with a caption; (2) camera dolly down the hall; (3) chosen: doors crack in sequence, floor light joins them, term unmasks on the dark upper wall, heavy door rattled. */
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, a, p) => Loom.svg(tag, a, p);
    const mix = (a, b, k) => Loom.style.mix(c(a), c(b), k);

    // ---- hall_set: wall, floor, receding floor lines
    const S = ctx.el("hall_set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    const slope = 0.1136, base = (x) => 890 - slope * (x - 140);
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: c("field") }, S.inner);
    svg("rect", { x: 0, y: 380, width: 1920, height: 520, fill: mix("field", "surface2", 0.35) }, S.inner);
    svg("polygon", { points: `0,${base(0)} 1920,${base(1920)} 1920,1080 0,1080`, fill: mix("field", "surface", 0.55) }, S.inner);
    svg("line", { x1: 0, y1: base(0), x2: 1920, y2: base(1920), stroke: c("line"), "stroke-width": 2, opacity: 0.6 }, S.inner);
    [-200, 300, 800, 1300].forEach((bx) => svg("line", { x1: bx, y1: 1080, x2: 1900, y2: 690, stroke: c("line"), "stroke-width": 1.5, opacity: 0.22 }, S.inner));

    // ---- hall_doors: six doors in a receding row, door 1 already open
    const W = [300, 246, 204, 170, 144, 122], G = [50, 44, 38, 32, 28, 24];
    const OX = 100, OY = 380, EW = 1500, EH = 560;
    const D = ctx.el("hall_doors", { x: OX, y: OY, w: EW, h: EH, kind: "scenery", exit: "none" });
    const xs = [], hs = [], doors = [], cx = [];
    let x = 140;
    W.forEach((w, i) => {
      const h = w * 620 / 400, xc = x + w / 2, b = base(xc);
      xs.push(x); hs.push(h); cx.push(xc);
      const shade = Math.min(0.75, 0.08 + i * 0.12);
      doors.push(Loom.lesson.door(ctx, D.inner, { x: x - OX, y: b - h - OY, w, shade, state: i === 0 ? "cracked" : "shut" }));
      x += w + G[i];
    });

    // ---- spread_light: floor strips joining each door's wedge to the next
    const L = ctx.el("spread_light", { x: OX, y: OY, w: EW, h: EH, kind: "scenery", exit: "recede" });
    const strips = [];
    for (let i = 0; i < 3; i++) {
      const xa = cx[i], xb = cx[i + 1], ya = base(xa) + 12, yb = base(xb) + 12;
      const g = svg("g", { opacity: 0 }, L.inner);
      svg("polygon", { points: `${xa - OX},${ya - OY} ${xb - OX},${yb - OY} ${xb - OX + 26},${yb - OY + 16} ${xa - OX + 36},${ya - OY + 26}`, fill: c("ink"), opacity: 0.2 }, g);
      strips.push(g);
    }

    // ---- heavy_door: the last door, wider, banded
    const hw = 168, hh = hw * 620 / 520, hb = base(x + hw / 2);
    const H = ctx.el("heavy_door", { x: x - 20, y: hb - hh - 20, w: hw + 40, h: hh + 40, kind: "scenery", exit: "none" });
    const hg = svg("g", {}, H.inner);
    const heavy = Loom.lesson.door(ctx, hg, { x: 20, y: 20, w: hw, heavy: true, shade: 0.55, state: "shut" });

    // ---- the beats
    const t1 = ctx.cue("other systems");
    [1, 2, 3].forEach((i, k) => {
      const t = t1 + k * 0.4;
      doors[i].setState("cracked", t);
      Loom.tween(strips[k], { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") }, t + 0.1, { kind: "reveal", beat: ctx.beat.id, name: "spread_light", content: true });
    });

    // term: unmask on the dark upper wall, accent underline
    const tt = ctx.cue("lateral movement");
    const T = ctx.el("term", { x: 140, y: 120, w: 1000, h: 170, kind: "text", exit: "wipe" });
    const tx = kit.text(T.inner, "lateral movement", { role: "title", x: 0, y: 0, w: 1000, h: 110, maxLines: 1, weight: 800, color: "ink" });
    const tw = Math.min(1000, tx.__fit.width);
    kit.rect(T.inner, 0, 128, tw, 8, { fill: "accent" });
    m.unmask(T, tt);

    // heavy door tried: deterministic sine rattle, small push, then refused
    const th = ctx.cue("hunt for more access");
    heavy.setState("refused", th + 0.5);
    const cxh = (hw / 2 + 20), cyh = hh + 20;
    Loom.drive((e, raw) => {
      const decay = 1 - raw, sx = 1 + 0.05 * Math.sin(Math.PI * raw);
      const dx = 5 * decay * Math.sin(raw * 38);
      hg.setAttribute("transform", `translate(${dx + cxh * (1 - sx)} ${cyh * (1 - sx)}) scale(${sx})`);
    }, th, 1.2, "linear");
  },
});
