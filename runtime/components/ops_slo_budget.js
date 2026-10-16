// T-026 ops_slo_budget: an SLO and its error budget (hand-off sheet, Family B). Built on _app_kit.js and _dev_kit.js.
// The target as a big figure over its window, a budget bar that burns down from full as errors spend it, the budget
// left in the lesson's unit, the share used, a burn-rate arrow, and a freeze when the budget is spent (a lock, the
// bar's outline in the failure tone, and the lesson's word for it).
Loom.component("ops_slo_budget", {
  version: 1,
  idea: "An SLO and its error budget: the target as a big figure over its window, a bar of the budget left that burns down as errors spend it, the budget left in time units and the share used, a burn-rate arrow, and a freeze state when the budget is spent.",
  outline: ["panel", "the target, large, with its window under it", "the budget bar: what is left, from full to empty", "budget left in its unit, and the share used", "burn rate with an arrow", "freeze: a lock and the bar outlined in the failure tone"],
  family: "ops",
  kind: "screen",
  tags: ["slo", "error budget", "reliability", "sre", "availability", "burn rate", "release freeze", "sla", "uptime", "service level"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-026)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint"],
  params: {
    target: { type: "str", content: true },        // "99.9%"
    window: { type: "str", content: true },        // "30 days"
    budget: { type: "obj", content: true },        // {total, used} in `unit` (43.2 and 8.6 minutes)
    unit: { type: "str", content: true },          // "min"
    title: { type: "str" },                        // the SLO's name ("Checkout availability")
    rate: { type: "str" },                         // the burn rate as the lesson words it ("burning 2.4x")
    leftLabel: { type: "str" },                    // the budget left: {n} the number, {unit} the unit ("{n} {unit} left"); "{n} {unit}" when omitted
    usedLabel: { type: "str" },                    // the share used: {p} the percent ("{p}% used"); "{p}%" when omitted
    freezeLabel: { type: "str" },                  // the freeze's word ("Release freeze")
    decimals: { type: "int", default: 1 },
    w: { type: "number", default: 1100 },
    at: { type: "number", default: -1 },
    steps: { type: "list", default: [] },          // [{do: "burn", used, at, dur} | {do: "freeze", at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["panel", "target", "window", "bar", "left", "used", "rate", "freeze", "burn(used, t, dur)", "freeze(t)"],
  example: 'ctx.use("ops_slo_budget", { title: "Login availability", target: "99.95%", window: "28 days", budget: { total: 20.2, used: 15.1 }, unit: "min", rate: "burning 3x", at: ctx.cue("most of the budget") }, { x: 410, y: 380, name: "slo" })',
  size: (p) => ({ w: p.w, h: Loom.devKit.sloLayout(p).h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const L = DK.sloLayout(p), Z = L.Z;
    const animated = p.at != null && p.at >= 0;
    const surface = S.c("surface"), ink = S.c("ink");
    const total = Math.max(1e-9, +((p.budget || {}).total || 0));
    let used = Math.max(0, +((p.budget || {}).used || 0));
    const fmt = (v) => (+v).toFixed(p.decimals);
    const fill = (tpl, o) => String(tpl).replace(/\{n\}/g, o.n).replace(/\{unit\}/g, p.unit).replace(/\{p\}/g, o.p);
    const leftStr = (u) => fill(p.leftLabel || "{n} {unit}", { n: fmt(Math.max(0, total - u)), p: "" });
    const usedStr = (u) => fill(p.usedLabel || "{p}%", { p: Math.round((Math.min(u, total) / total) * 100), n: "" });
    const parts = {};
    const root = svg("g", {}, g);
    svg("rect", { x: 0, y: 0, width: p.w, height: L.h, rx: 16, fill: surface }, root);
    K.rect(root, 0, 0, p.w, L.h, { fill: "surface", r: 16, stroke: "line", sw: 1.5, shadow: true });
    parts.panel = root;
    // ---- the target and its window
    if (p.title) parts.title = AK.T(root, p.title, { x: 32, y: 24, w: p.w - 64, h: L.lh, size: Z.fs, weight: 700, color: "muted" });
    parts.target = K.text(root, p.target, { role: L.tRole, x: 32, y: L.tY, w: L.tW, h: L.tH, maxLines: 1, valign: "middle", weight: 700 });
    parts.window = AK.T(root, p.window, { x: 32, y: L.tY + L.tH + 4, w: L.tW, h: L.lh, size: Z.fs, color: "muted" });
    // ---- the bar: the budget left, burning down from full
    const bx = L.bx, by = L.by, bw = L.bw, bh = L.bh;
    const okC = DK.legible("pos", surface, ink, 3), lowC = DK.legible(DK.warnTok(), surface, ink, 3), outC = DK.legible("neg", surface, ink, 3);
    const toneFor = (u) => (u >= total ? outC : u / total >= 0.75 ? lowC : okC);
    svg("rect", { x: bx, y: by, width: bw, height: bh, rx: bh / 2, fill: S.mix(S.c("line"), surface, 0.82) }, root);
    const clipId = Loom.uid ? Loom.uid("sloclip") : "sloclip" + Loom.hash(p.target);
    const cp = svg("clipPath", { id: clipId }, g); svg("rect", { x: bx, y: by, width: bw, height: bh, rx: bh / 2 }, cp);
    const barG = svg("g", { "clip-path": `url(#${clipId})` }, root);
    const bar = svg("rect", { x: bx, y: by, width: f1(bw * Math.max(0, 1 - used / total)), height: bh, fill: toneFor(used) }, barG);
    const outline = svg("rect", { x: bx, y: by, width: bw, height: bh, rx: bh / 2, fill: "none", stroke: outC, "stroke-width": 3, opacity: used >= total ? 1 : 0 }, root);
    // quarter marks under the bar (no words: the share is said by the figure)
    for (let k = 1; k < 4; k++) svg("rect", { x: f1(bx + (bw * k) / 4 - 1), y: by + bh + 6, width: 2, height: 10, fill: S.mix(S.c("line"), surface, 0.4) }, root);
    parts.bar = bar;
    // ---- the figures: budget left (large), the share used, the burn rate
    const leftG = svg("g", {}, root);
    let leftT = AK.T(leftG, leftStr(used), { x: bx, y: L.fy, w: bw * 0.62, h: L.lhB, size: Z.big, weight: 700 });
    let usedT = AK.T(leftG, usedStr(used), { x: bx + bw * 0.62, y: L.fy, w: bw * 0.38, h: L.lhB, size: Z.fs, weight: 600, color: "muted", align: "right" });
    parts.left = leftT; parts.used = usedT;
    if (p.rate) {
      const rg = svg("g", {}, root);
      AK.icon(rg, "trending-up", bx + 14, L.ry + L.lh / 2, 26, "neg");
      parts.rate = AK.T(rg, p.rate, { x: bx + 36, y: L.ry, w: bw - 36, h: L.lh, size: Z.fs, weight: 600, fill: outC });
      parts.rateG = rg;
      if (animated) AK.show(rg, p.at + 1.2, 0.3);
    }
    // ---- the freeze: a lock and the word, over the bar's right end
    const fz = svg("g", { opacity: used >= total ? 1 : 0 }, root);
    if (p.freezeLabel) {
      const fw = AK.measure(p.freezeLabel, "caption", Z.fs, 700) + 64;
      const SD = AK.solid("neg");
      AK.box(fz, bx + bw - fw, L.ty0, fw, L.lh + 14, { r: (L.lh + 14) / 2, fill: S.c(SD.fill), stroke: SD.stroke ? S.c(SD.stroke) : null, sw: SD.sw });
      AK.icon(fz, "lock", bx + bw - fw + 26, L.ty0 + (L.lh + 14) / 2, 22, SD.fg);
      AK.T(fz, p.freezeLabel, { x: bx + bw - fw + 44, y: L.ty0, w: fw - 52, h: L.lh + 14, size: Z.fs, weight: 700, color: SD.fg });
    } else AK.icon(fz, "lock", bx + bw - 16, L.ty0 + (L.lh + 14) / 2, 28, "neg");
    parts.freezeG = fz;

    // ---- state functions
    let frozen = used >= total;
    parts.burn = function (u, t, dur) {
      const a = used, b = Math.max(0, +u), D = dur || 1.2;
      Loom.drive((e) => { const v = a + (b - a) * e; bar.setAttribute("width", f1(bw * Math.max(0, 1 - v / total))); bar.setAttribute("fill", toneFor(v)); }, t, D, "move", DK.meta("count", "slo.burn"));
      // the figures: the old leave, the new arrive when the bar lands
      const nl = AK.T(leftG, leftStr(b), { x: bx, y: L.fy, w: bw * 0.62, h: L.lhB, size: Z.big, weight: 700 });
      const nu = AK.T(leftG, usedStr(b), { x: bx + bw * 0.62, y: L.fy, w: bw * 0.38, h: L.lhB, size: Z.fs, weight: 600, color: "muted", align: "right" });
      DK.cross(leftT, nl, t + D - 0.2); DK.cross(usedT, nu, t + D - 0.2);
      leftT = nl; usedT = nu; parts.left = nl; parts.used = nu;
      used = b;
      if (b >= total && !frozen) parts.freeze(t + D);
      return t + D;
    };
    parts.freeze = function (t) {
      if (frozen) return t;
      frozen = true;
      AK.show(fz, t, 0.3); AK.show(outline, t, 0.3);
      return t + 0.3;
    };
    if (animated) {
      // the bar starts full and burns to what is used
      AK.show(root, p.at, 0.3);
      const u = used; used = 0;
      bar.setAttribute("width", bw); bar.setAttribute("fill", okC);
      if (frozen) { fz.setAttribute("opacity", 0); outline.setAttribute("opacity", 0); frozen = false; }
      const t0 = p.at + 0.5;
      const pre = AK.T(leftG, leftStr(0), { x: bx, y: L.fy, w: bw * 0.62, h: L.lhB, size: Z.big, weight: 700 }), preU = AK.T(leftG, usedStr(0), { x: bx + bw * 0.62, y: L.fy, w: bw * 0.38, h: L.lhB, size: Z.fs, weight: 600, color: "muted", align: "right" });
      DK.cross(null, pre, p.at); DK.cross(null, preU, p.at);
      leftT.setAttribute("opacity", 0); usedT.setAttribute("opacity", 0);
      leftT.remove(); usedT.remove();
      leftT = pre; usedT = preU;
      parts.burn(u, t0, 1.2);
    }
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "burn") parts.burn(st.used, st.at, st.dur);
      else if (st.do === "freeze") parts.freeze(st.at);
      else Loom.error("component_params", `ops_slo_budget: step "${st.do}" is not burn or freeze`);
    }
    return parts;
  },
});

// the panel's geometry, shared by size() and build()
Loom.devKit.sloLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, K = Loom.kit, Z = DK.ui().Z;
  const lh = AK.lineH(Z.fs, "caption", 600), lhB = AK.lineH(Z.big, "caption", 700);
  const top = p.title ? 24 + lh + 10 : 28;
  // the target: as large as its column allows (title role, else lead)
  const tW = Math.min(p.w * 0.36, 420);
  let tRole = "title", F = K.fit(String(p.target), { role: "title", w: tW, maxLines: 1 });
  if (!F.fitted) { tRole = "lead"; F = K.fit(String(p.target), { role: "lead", w: tW, maxLines: 1 }); }
  const tH = Math.ceil(F.height) + 4, tY = top;
  const bx = 32 + tW + 48, bw = p.w - bx - 32, ty0 = top, by = top + lh + 14 + 14, bh = 34;
  const fy = by + bh + 22, ry = fy + lhB + 8;
  const h = Math.max(tY + tH + 4 + lh + 28, (p.rate ? ry + lh : fy + lhB) + 28);
  return { Z, lh, lhB, tRole, tW, tH, tY, bx, bw, by, bh, fy, ry, ty0, h };
};
