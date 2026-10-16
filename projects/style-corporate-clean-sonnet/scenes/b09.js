// @design spread_along_link: damage travels along a live connection; the unconnected copy is untouched
// Treatments considered: (1) static side-by-side with a legend, (2) the laptop and two drives with the damage walking the cable (chosen: the mechanism is the link), (3) a before/after split.
Loom.scene("b09", {
  build(ctx, props) {
    const kit = ctx.kit, m = ctx.m, c = ctx.c, L = Loom.lesson;
    const t0 = ctx.start;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const sm = (p) => p * p * (3 - 2 * p);
    const hexRGB = (s) => {
      s = String(s).trim();
      let r = /^#([0-9a-f]{6})$/i.exec(s);
      if (r) { const n = parseInt(r[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
      r = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i.exec(s);
      return r ? [+r[1], +r[2], +r[3]] : null;
    };
    const mix = (a, b, p) => {
      const A = hexRGB(a), B = hexRGB(b);
      if (!A || !B) return p < 0.5 ? a : b;
      const q = (i) => Math.round(A[i] + (B[i] - A[i]) * p);
      return "rgb(" + q(0) + "," + q(1) + "," + q(2) + ")";
    };
    const setFill = (el, col) => { el.setAttribute("fill", col); if (el.style) el.style.fill = col; };

    // ---- layout (station 1920x1080; bottom 150 px kept clear)
    const LAP = { x: 130, y: 360, w: 460 };
    const lapSize = L.laptop.size({ w: LAP.w });
    const DRV = { x: 900, w: 380, yUp: 160, yLo: 570 };
    const drvSize = L.ext_drive.size({ w: DRV.w });

    // desk lines (scenery, behind everything)
    const deskBox = { x: 100, y: DRV.yUp + drvSize.h, w: 1200, h: 420 };
    const D = ctx.el("desk_lines", { x: deskBox.x, y: deskBox.y, w: deskBox.w, h: deskBox.h, kind: "scenery" });
    const deskYs = [DRV.yUp + drvSize.h + 8, LAP.y + lapSize.h + 6, DRV.yLo + drvSize.h + 8];
    kit.line(D.inner, 780, deskYs[0] - deskBox.y, 1200, deskYs[0] - deskBox.y, { stroke: "line", sw: 3 });
    kit.line(D.inner, 0, deskYs[1] - deskBox.y, 520, deskYs[1] - deskBox.y, { stroke: "line", sw: 3 });
    kit.line(D.inner, 780, deskYs[2] - deskBox.y, 1200, deskYs[2] - deskBox.y, { stroke: "line", sw: 3 });
    m.reveal(D, t0 + 0.05);

    // laptop + its Report
    const LE = ctx.el("laptop_d", { x: LAP.x, y: LAP.y, w: lapSize.w, h: lapSize.h, kind: "instrument" });
    const lap = L.laptop(ctx, LE.inner, { w: LAP.w });
    m.reveal(LE, t0 + 0.1);
    const RE = ctx.el("report_d", { parent: LE, x: lap.slot.x, y: lap.slot.y, w: Math.round(lap.slot.h * 0.75), h: lap.slot.h, kind: "card" });
    const rep = L.report_file(ctx, RE.inner, { size: lap.slot.h });
    m.reveal(RE, t0 + 0.2);

    // upper drive: connected by a cable to the laptop's side
    const lapSide = { x: LAP.x + 610 * lap.scale, y: LAP.y + 190 * lap.scale };
    const port = { x: DRV.x, y: DRV.yUp + 216 };
    const cableTo = { x: lapSide.x - DRV.x, y: lapSide.y - DRV.yUp };
    const UE = ctx.el("drive_connected", { x: DRV.x, y: DRV.yUp, w: drvSize.w, h: drvSize.h, kind: "instrument" });
    const up = L.ext_drive(ctx, UE.inner, { w: DRV.w, state: "idle", cableTo: cableTo });
    m.reveal(UE, t0 + 0.15);
    const UC = ctx.el("copy_connected", { parent: UE, x: up.slots[0].x, y: up.slots[0].y, w: Math.round(up.slots[0].h * 0.75), h: up.slots[0].h, kind: "card" });
    const copyUp = L.report_file(ctx, UC.inner, { size: up.slots[0].h });
    m.reveal(UC, t0 + 0.25);
    up.setState("connected", t0 + 0.3, { dur: 0.7 });

    // lower drive: no cable
    const OE = ctx.el("drive_offline", { x: DRV.x, y: DRV.yLo, w: drvSize.w, h: drvSize.h, kind: "instrument" });
    const lo = L.ext_drive(ctx, OE.inner, { w: DRV.w, state: "unplugged" });
    m.reveal(OE, t0 + 0.2);
    const OC = ctx.el("copy_offline", { parent: OE, x: lo.slots[0].x, y: lo.slots[0].y, w: Math.round(lo.slots[0].h * 0.75), h: lo.slots[0].h, kind: "card" });
    const copyLo = L.report_file(ctx, OC.inner, { size: lo.slots[0].h });
    m.reveal(OC, t0 + 0.3);

    // labels (pills): Connected (static), Offline or disconnected (takes the accent)
    const pillLabel = (name, text, y, x) => {
      const f = kit.fit(text, { role: "label", w: 480, h: 44, maxLines: 1, weight: 700 });
      const pw = Math.round(f.width + 64);
      const E = ctx.el(name, { x: x, y: y, w: pw, h: 52, kind: "text" });
      const bg = Loom.svg("rect", { x: 0, y: 0, width: pw, height: 52, rx: 26, fill: c("surface2") }, E.inner);
      const tx = kit.text(E.inner, text, { role: "label", size: 28, x: 0, y: 0, w: pw, h: 52, align: "center", valign: "middle", weight: 700, color: "muted" });
      return { E: E, bg: bg, tx: tx, w: pw };
    };
    const lx = DRV.x + DRV.w + 48;
    const lc = pillLabel("label_connected", "Connected", DRV.yUp + 170 + 44 - 26, lx);
    m.reveal(lc.E, t0 + 0.4);
    const lb = pillLabel("label_offline", "Offline or disconnected", DRV.yLo + 170 + 44 - 26, lx);
    m.reveal(lb.E, t0 + 0.45);

    // lock token: travels the cable's own curve from the laptop to the drive port
    const TB = { x: 540, y: 300, w: 400, h: 260 };
    const TE = ctx.el("lock_token", { x: TB.x, y: TB.y, w: TB.w, h: TB.h, kind: "token" });
    const tg = Loom.svg("g", { opacity: 0 }, TE.inner);
    const R = 30;
    Loom.svg("circle", { cx: 0, cy: 0, r: R + 5, fill: c("surface") }, tg);
    Loom.svg("circle", { cx: 0, cy: 0, r: R, fill: c("accent3") }, tg);
    kit.icon(tg, "lock", { x: -18, y: -18, size: 36, color: "onAccent" });
    // the cable is M port C (mx,port.y) (mx,to.y) to, with mx midway (kit ext_drive)
    const P0 = port, P3 = lapSide, mxs = (P0.x + P3.x) / 2;
    const bz = (u) => {
      const a = (1 - u) * (1 - u) * (1 - u), b = 3 * (1 - u) * (1 - u) * u, cc = 3 * (1 - u) * u * u, d = u * u * u;
      return { x: a * P0.x + b * mxs + cc * mxs + d * P3.x, y: a * P0.y + b * P0.y + cc * P3.y + d * P3.y };
    };

    // ---- the story on the words
    const tEnc = ctx.cue("Ransomware can encrypt");
    rep.setState("locked", tEnc);

    const tTok = ctx.cue("stay connected");
    const tDur = 1.3;
    Loom.drive((e, raw) => {
      const p = clamp(raw, 0, 1), u = 1 - sm(p);
      const pt = bz(u);
      const a = clamp(p / 0.08, 0, 1) * (1 - clamp((p - 0.9) / 0.1, 0, 1));
      const s = 0.6 + 0.4 * a;
      tg.setAttribute("transform", "translate(" + (pt.x - TB.x) + " " + (pt.y - TB.y) + ") scale(" + s + ")");
      tg.setAttribute("opacity", a);
    }, tTok, tDur, "linear", { key: "lock_token_path" });
    copyUp.setState("locked", tTok + tDur - 0.1);

    const tOff = ctx.cue("keep one offline");
    const cMut = c("muted"), cSur = c("surface2"), cAcc = c("accent"), cOn = c("onAccent");
    Loom.drive((e, raw) => {
      const p = sm(clamp(raw, 0, 1));
      setFill(lb.bg, mix(cSur, cAcc, p));
      setFill(lb.tx, mix(cMut, cOn, p));
    }, tOff, 0.5, "linear", { key: "label_offline_accent" });
    m.emphasis(lb.E, tOff + 0.1);

    // outcome tick on the untouched copy
    const KE = ctx.el("offline_ok", { x: DRV.x + 170, y: DRV.yLo + 6, w: 56, h: 56, kind: "icon" });
    const kg = Loom.svg("g", {}, KE.inner);
    kit.mark(kg, "yes", 28, 28, 44);
    m.pop(KE, tOff + 0.35);
  },
});
