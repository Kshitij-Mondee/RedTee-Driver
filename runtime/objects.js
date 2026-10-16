/* Loom objects (D-83; docs/styles/DISTINCTNESS_PLAN.md step 4): things DRAWN as things, not stock icons.
 *
 * A lesson keeps needing the same objects: a document, an envelope, a calendar, a clock, a phone, a laptop, a
 * folder, a package, a building, a heart, a light bulb, a lock. A stock icon in a disc stood in for all of them,
 * and that was one of the loudest "AI-made" tells (DISTINCTNESS_PLAN.md, critique item 3). Each object here has:
 *   - FAMILIES: two or three different silhouettes (a wall calendar, a tear-off pad, a desk flip). The lesson's
 *     design seed picks one per object, so the same call draws a different object in two lessons;
 *   - the seed's SHAPE LANGUAGE on every box (round, angular, organic, architectural) and the pack's shading;
 *   - DETAIL levels 1 to 3 (silhouette; the parts that make it read; small details); small sizes drop detail,
 *     never legibility;
 *   - STATES where the object changes meaning (an envelope open or closed, a lock open, a bulb on, a clock's
 *     time, a heart that beats between t0 and t1, a document stamped).
 * No object draws a digit or a word of its own: a label is content, so it is passed in (`label`), or there is none.
 *
 *   Loom.obj.draw(ctx, "cal", "calendar", { x, y, size: 220, tone: "accent4", detail: 3, state: { mark: 4 }, t })
 *   Loom.obj.shape(g, "envelope", cx, cy, 160, { state: { open: true } })     // into a group: props, places
 *   Loom.obj.forIcon("mail")  -> "envelope"     // Loom.treat.badge draws the object for a hero-size icon
 * Deterministic: shapes vary only with the seed, the name and the arguments.
 */
// @capability objects | world | Loom.obj.draw(ctx, name, kind, {state, t}), Loom.obj.shape | Objects | a thing the narration names drawn as a thing (document, envelope, calendar, clock, phone, laptop, folder, package, building, heart, bulb, lock) with states
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const T = () => Loom.treat;
  const svg = (...a) => Loom.svg(...a);
  const O = (Loom.obj = {});
  const f = (v) => Math.round(v * 10) / 10;

  O.FAMILIES = {
    document: ["sheet", "clipboard", "stack"],
    envelope: ["flap", "airmail"],
    calendar: ["wall", "tearoff", "desk"],
    clock: ["wall", "alarm", "square"],
    phone: ["slab", "classic"],
    laptop: ["laptop", "monitor"],
    folder: ["tab", "binder"],
    package: ["box", "crate", "parcel"],
    building: ["tower", "house", "institution"],
    heart: ["organ", "symbol"],
    bulb: ["bulb", "spark"],
    lock: ["padlock", "shield"],
  };
  O.KINDS = Object.keys(O.FAMILIES);
  /** Lucide icon names that stand for an object (a hero-size icon becomes the drawn object) */
  O.ICONS = {
    "file-text": "document", file: "document", clipboard: "document", "clipboard-list": "document", "file-check": "document",
    mail: "envelope", inbox: "envelope", send: "envelope",
    calendar: "calendar", "calendar-days": "calendar", "calendar-check": "calendar",
    clock: "clock", timer: "clock", "alarm-clock": "clock", hourglass: "clock",
    smartphone: "phone", phone: "phone", tablet: "phone",
    laptop: "laptop", monitor: "laptop", "monitor-smartphone": "laptop",
    folder: "folder", "folder-open": "folder", archive: "folder",
    package: "package", box: "package", truck: "package",
    building: "building", "building-2": "building", home: "building", landmark: "building", factory: "building",
    heart: "heart", "heart-pulse": "heart", activity: "heart",
    lightbulb: "bulb", sparkles: "bulb",
    lock: "lock", "lock-keyhole": "lock", shield: "lock", "shield-check": "lock", key: "lock",
  };
  O.forIcon = (name) => O.ICONS[name] || null;
  O.family = function (kind, o) {
    const fams = O.FAMILIES[kind];
    if (o && o.family) { if (!fams.includes(o.family)) Loom.error("object_family", `${kind} has no family "${o.family}" (have: ${fams.join(", ")})`); return fams.includes(o.family) ? o.family : fams[0]; }
    const key = T().seedKey();
    return key === "classic" ? fams[0] : fams[Loom.hash(key + "|" + kind) % fams.length];
  };

  /* ---------------- drawing helpers ---------------- */
  function H(g, kind, cx, cy, s, o) {
    // a kind's default tone: the pack's materials.objects[kind] (a palette token), else DEF_TONE (A4 proof 2026-10-08:
    // glow-flat drew every calendar header in its alarm pink)
    const pkObj = ((Loom.style.pack.materials || {}).objects || {})[kind];
    const dflt = pkObj && pkObj in Loom.style.pack.palette ? pkObj : (pkObj && Loom.error("unknown_role_token", `pack materials.objects.${kind} = "${pkObj}" is not a palette token`), DEF_TONE[kind]);
    const lang = T().pick("shape"), tone = T().tk(o.tone || dflt || "accent"), key = (o.key || kind) + ":" + T().seedKey();
    const LD = T().lightDark();
    const h = {
      g, s, cx, cy, lang, tone, key, detail: Math.max(1, Math.min(3, o.detail || (s < 90 ? 1 : 2)) - (s < 70 ? 1 : 0)),
      state: o.state || {}, LD,
      c: (t) => S().c(T().tk(t)), dk: (t, p) => S().darken(S().c(T().tk(t)), p == null ? 0.25 : p), lt: (t, p) => S().lighten(S().c(T().tk(t)), p == null ? 0.3 : p),
      paper: S().mix(LD.light, LD.dark, 0.05), paperDk: S().mix(LD.light, LD.dark, 0.2), inkOnPaper: LD.dark,
      /** a box in the lesson's shape language */
      box(x, y, w, hh, r) {
        if (lang === "angular") { const c = Math.min(r * 1.1, w * 0.2, hh * 0.2); return `M${f(x + c)} ${f(y)} H${f(x + w)} V${f(y + hh - c)} L${f(x + w - c)} ${f(y + hh)} H${f(x)} V${f(y + c)} Z`; }
        if (lang === "organic") return T().outline(x, y, w, hh, "organic", key + ":" + f(x) + "," + f(y));
        return T().rr(x, y, w, hh, lang === "architectural" ? Math.min(r, 3) : r);
      },
      fill(d, tok, bx, op) { return T().body(g, d, tok, bx, op); },
      hexFill(d, hex, op) { return svg("path", Object.assign({ d, fill: hex }, op || {}), g); },
      stroke(d, col, w, op) { return svg("path", Object.assign({ d, fill: "none", stroke: col, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round" }, op || {}), g); },
      dot(x, y, r, col, op) { return svg("circle", Object.assign({ cx: f(x), cy: f(y), r: f(r), fill: col }, op || {}), g); },
    };
    return h;
  }
  const DEF_TONE = { document: "surface", envelope: "accent2", calendar: "accent3", clock: "accent4", phone: "surface2", laptop: "surface2", folder: "accent2",
    package: "accent", building: "accent4", heart: "accent3", bulb: "accent2", lock: "accent" };
  const lines = (h, x, y, w, n, gap, col, wid) => { for (let i = 0; i < n; i++) h.stroke(`M${f(x)} ${f(y + i * gap)} H${f(x + w * (i === n - 1 ? 0.6 : 1))}`, col, wid || Math.max(2, h.s * 0.022)); };

  /* ---------------- the objects ---------------- */
  const D = {};
  D.document = function (h, fam) {
    const { s, cx, cy } = h, w = s * 0.72, ht = s * 0.94, x = cx - w / 2, y = cy - ht / 2, fold = s * 0.16;
    if (fam === "stack") for (let i = 2; i >= 1; i--) h.hexFill(h.box(x + i * s * 0.05, y - i * s * 0.04, w, ht, s * 0.04), S().mix(h.LD.light, h.LD.dark, 0.1 + i * 0.07));
    if (fam === "clipboard") h.fill(h.box(x - s * 0.06, y - s * 0.02, w + s * 0.12, ht + s * 0.08, s * 0.06), h.tone, { x: x - s * 0.06, y: y - s * 0.02, w: w + s * 0.12, h: ht + s * 0.08 });
    const sheet = fam === "sheet" ? `M${f(x)} ${f(y)} H${f(x + w - fold)} L${f(x + w)} ${f(y + fold)} V${f(y + ht)} H${f(x)} Z` : h.box(x + (fam === "clipboard" ? s * 0.02 : 0), y + (fam === "clipboard" ? s * 0.08 : 0), w - (fam === "clipboard" ? s * 0.04 : 0), ht - (fam === "clipboard" ? s * 0.06 : 0), s * 0.03);
    h.hexFill(sheet, h.paper);
    if (fam === "sheet") h.hexFill(`M${f(x + w - fold)} ${f(y)} V${f(y + fold)} H${f(x + w)} Z`, h.paperDk);
    if (fam === "clipboard") { h.fill(h.box(cx - s * 0.16, y - s * 0.06, s * 0.32, s * 0.12, s * 0.03), "surface2", { x: cx - s * 0.16, y: y - s * 0.06, w: s * 0.32, h: s * 0.12 }); }
    const tx = x + w * 0.14, ty = y + ht * (fam === "clipboard" ? 0.26 : 0.18);
    if (h.detail >= 2) { svg("rect", { x: f(tx), y: f(ty - s * 0.03), width: f(w * 0.4), height: f(s * 0.06), rx: 3, fill: h.c(h.tone === "surface" ? "accent" : h.tone) }, h.g); lines(h, tx, ty + s * 0.12, w * 0.72, h.detail >= 3 ? 5 : 3, s * 0.1, h.paperDk); }
    if (h.detail >= 3) h.stroke(`M${f(tx)} ${f(y + ht * 0.88)} q${f(s * 0.06)} ${f(-s * 0.08)} ${f(s * 0.1)} 0 t${f(s * 0.1)} 0 t${f(s * 0.1)} 0`, h.inkOnPaper, Math.max(2, s * 0.016));
    if (h.state.stamped) {
      const sg = svg("g", { transform: `rotate(-12 ${f(x + w * 0.66)} ${f(y + ht * 0.72)})` }, h.g);
      svg("circle", { cx: f(x + w * 0.66), cy: f(y + ht * 0.72), r: f(s * 0.15), fill: "none", stroke: h.c(h.state.stampTone || "neg"), "stroke-width": f(s * 0.025) }, sg);
      svg("circle", { cx: f(x + w * 0.66), cy: f(y + ht * 0.72), r: f(s * 0.11), fill: "none", stroke: h.c(h.state.stampTone || "neg"), "stroke-width": f(s * 0.01) }, sg);
    }
  };
  D.envelope = function (h, fam) {
    const { s, cx, cy } = h, w = s, ht = s * 0.64, x = cx - w / 2, y = cy - ht / 2 + s * 0.06;
    const body = h.box(x, y, w, ht, s * 0.05);
    if (h.state.open) {   // the flap is up and a letter peeks out
      h.hexFill(`M${f(x)} ${f(y)} L${f(cx)} ${f(y - ht * 0.55)} L${f(x + w)} ${f(y)} Z`, h.dk(h.tone, 0.18));
      h.hexFill(T().rr(x + w * 0.1, y - ht * 0.32, w * 0.8, ht * 0.7, s * 0.02), h.paper);
      lines(h, x + w * 0.2, y - ht * 0.18, w * 0.5, 2, s * 0.08, h.paperDk);
    }
    h.fill(body, h.tone, { x, y, w, h: ht });
    if (fam === "airmail") {
      const id = Loom.uid("lmob"), cp = svg("clipPath", { id }, h.g); svg("path", { d: body }, cp);
      const bg = svg("g", { "clip-path": `url(#${id})` }, h.g);
      for (let i = -2; i < 14; i++) svg("path", { d: `M${f(x + i * s * 0.1)} ${f(y)} l${f(s * 0.05)} 0 l${f(-s * 0.05)} ${f(s * 0.06)} l${f(-s * 0.05)} 0 Z`, fill: h.c(i % 2 ? "accent3" : "accent4") }, bg);
      for (let i = -2; i < 14; i++) svg("path", { d: `M${f(x + i * s * 0.1)} ${f(y + ht)} l${f(s * 0.05)} 0 l${f(-s * 0.05)} ${f(-s * 0.06)} l${f(-s * 0.05)} 0 Z`, fill: h.c(i % 2 ? "accent3" : "accent4") }, bg);
    }
    h.stroke(`M${f(x + s * 0.03)} ${f(y + ht - s * 0.03)} L${f(cx)} ${f(y + ht * 0.48)} L${f(x + w - s * 0.03)} ${f(y + ht - s * 0.03)}`, h.dk(h.tone, 0.2), Math.max(2, s * 0.02));
    if (!h.state.open) h.hexFill(`M${f(x + s * 0.02)} ${f(y + s * 0.02)} L${f(cx)} ${f(y + ht * 0.56)} L${f(x + w - s * 0.02)} ${f(y + s * 0.02)} Z`, h.dk(h.tone, 0.1));
    if (h.detail >= 3) {
      svg("rect", { x: f(x + w * 0.76), y: f(y + ht * 0.12), width: f(s * 0.14), height: f(s * 0.16), fill: h.paper, stroke: h.c("accent3"), "stroke-width": 2, "stroke-dasharray": "3 3" }, h.g);
      svg("circle", { cx: f(x + w * 0.7), cy: f(y + ht * 0.3), r: f(s * 0.09), fill: "none", stroke: h.dk(h.tone, 0.35), "stroke-width": 2, opacity: 0.7 }, h.g);
    }
  };
  D.calendar = function (h, fam) {
    const { s, cx, cy } = h;
    if (fam === "desk") {   // a tent-shaped desk flip calendar
      const w = s * 0.9, ht = s * 0.7, x = cx - w / 2, y = cy - ht / 2;
      h.hexFill(`M${f(x + w * 0.08)} ${f(y + ht)} L${f(cx)} ${f(y)} L${f(x + w * 0.92)} ${f(y + ht)} Z`, h.dk("surface", 0.15));
      h.fill(h.box(x, y + ht * 0.05, w, ht * 0.95, s * 0.05), "surface", { x, y: y + ht * 0.05, w, h: ht * 0.95 });
      svg("rect", { x: f(x), y: f(y + ht * 0.05), width: f(w), height: f(ht * 0.26), fill: h.c(h.tone) }, h.g);
      for (let i = 0; i < 5; i++) h.dot(x + w * (0.2 + i * 0.15), y + ht * 0.05, s * 0.025, h.c("ink"));
      if (h.detail >= 2) svg("rect", { x: f(cx - w * 0.22), y: f(y + ht * 0.45), width: f(w * 0.44), height: f(ht * 0.34), rx: 6, fill: h.dk("surface", 0.18) }, h.g);
      return;
    }
    const w = s * 0.86, ht = s * 0.9, x = cx - w / 2, y = cy - ht / 2 + s * 0.04;
    h.hexFill(h.box(x, y, w, ht, s * 0.06), h.paper);
    const hb = fam === "tearoff" ? ht * 0.24 : ht * 0.2;
    const head = svg("path", { d: h.box(x, y, w, hb + s * 0.06, s * 0.06), fill: h.c(h.tone) }, h.g); void head;
    svg("rect", { x: f(x), y: f(y + hb), width: f(w), height: f(s * 0.06), fill: h.paper }, h.g);
    for (let i = 0; i < (fam === "wall" ? 4 : 2); i++) {   // binding rings
      const rx = x + w * (fam === "wall" ? 0.2 + i * 0.2 : 0.3 + i * 0.4);
      svg("rect", { x: f(rx - s * 0.02), y: f(y - s * 0.07), width: f(s * 0.04), height: f(s * 0.14), rx: f(s * 0.02), fill: h.c("ink") }, h.g);
    }
    if (fam === "wall") {
      const gx = x + w * 0.1, gy = y + hb + s * 0.1, cw = w * 0.8 / 7, rows = h.detail >= 3 ? 5 : 4, mark = h.state.mark == null ? -1 : h.state.mark;
      for (let r = 0; r < rows; r++) for (let c = 0; c < 7; c++) {
        const i = r * 7 + c, px = gx + c * cw + cw / 2, py = gy + r * cw * 0.95 + cw / 2;
        if (i === mark) { svg("circle", { cx: f(px), cy: f(py), r: f(cw * 0.42), fill: h.c(h.state.markTone || "accent2") }, h.g); continue; }
        h.dot(px, py, Math.max(2, cw * (h.detail >= 2 ? 0.16 : 0.1)), h.paperDk);
      }
      if (h.state.cross != null) h.stroke(`M${f(gx + (h.state.cross % 7) * cw + cw * 0.15)} ${f(gy + Math.floor(h.state.cross / 7) * cw * 0.95 + cw * 0.15)} l${f(cw * 0.7)} ${f(cw * 0.7)} m0 ${f(-cw * 0.7)} l${f(-cw * 0.7)} ${f(cw * 0.7)}`, h.c("neg"), Math.max(3, s * 0.02));
    } else {   // tear-off: one big day, a curl of the page torn before it
      const bx = x + w * 0.2, by = y + hb + s * 0.16, bw = w * 0.6, bh = ht * 0.42;
      if (h.state.label) Loom.kit.text(h.g, String(h.state.label), { role: "title", x: bx, y: by, w: bw, h: bh, align: "center", valign: "middle", maxLines: 1, color: "ink" }).setAttribute("fill", h.inkOnPaper);
      else svg("rect", { x: f(bx + bw * 0.2), y: f(by + bh * 0.2), width: f(bw * 0.6), height: f(bh * 0.6), rx: 6, fill: h.paperDk }, h.g);
      if (h.detail >= 2) h.hexFill(`M${f(x + w)} ${f(y + ht * 0.72)} Q${f(x + w * 0.86)} ${f(y + ht * 0.8)} ${f(x + w * 0.8)} ${f(y + ht)} L${f(x + w)} ${f(y + ht)} Z`, h.paperDk);
    }
  };
  D.clock = function (h, fam) {
    const { s, cx, cy } = h, r = s * 0.42;
    const hours = h.state.time == null ? 10.15 : h.state.time;
    if (fam === "alarm") {
      [-1, 1].forEach((k) => { h.fill(`M${f(cx + k * r * 0.95)} ${f(cy - r * 0.95)} m${f(-r * 0.32)} 0 a${f(r * 0.32)} ${f(r * 0.32)} 0 0 1 ${f(r * 0.64)} 0 Z`, h.tone, null); h.stroke(`M${f(cx + k * r * 0.6)} ${f(cy + r * 0.8)} l${f(k * r * 0.25)} ${f(r * 0.32)}`, h.c("ink"), s * 0.04); });
    }
    const face = fam === "square" ? h.box(cx - r, cy - r, 2 * r, 2 * r, r * 0.35) : `M${f(cx - r)} ${f(cy)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
    h.fill(face, h.tone, { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r });
    const ri = r * 0.82;
    h.hexFill(fam === "square" ? h.box(cx - ri, cy - ri, 2 * ri, 2 * ri, ri * 0.3) : `M${f(cx - ri)} ${f(cy)} a${f(ri)} ${f(ri)} 0 1 0 ${f(2 * ri)} 0 a${f(ri)} ${f(ri)} 0 1 0 ${f(-2 * ri)} 0 Z`, h.paper);
    const n = h.detail >= 3 ? 12 : h.detail >= 2 ? 4 : 0;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; h.stroke(`M${f(cx + Math.cos(a) * ri * 0.78)} ${f(cy + Math.sin(a) * ri * 0.78)} L${f(cx + Math.cos(a) * ri * 0.92)} ${f(cy + Math.sin(a) * ri * 0.92)}`, h.inkOnPaper, i % 3 === 0 ? s * 0.03 : s * 0.015); }
    const hg = svg("g", {}, h.g), mg = svg("g", {}, h.g);
    const ha = (hours % 12) / 12 * 360, ma = (hours % 1) * 360;
    svg("path", { d: `M${f(cx)} ${f(cy)} L${f(cx)} ${f(cy - ri * 0.5)}`, stroke: h.inkOnPaper, "stroke-width": f(s * 0.045), "stroke-linecap": "round" }, hg).setAttribute("transform", `rotate(${f(ha)} ${f(cx)} ${f(cy)})`);
    svg("path", { d: `M${f(cx)} ${f(cy)} L${f(cx)} ${f(cy - ri * 0.74)}`, stroke: h.c(h.state.handTone || "accent3"), "stroke-width": f(s * 0.028), "stroke-linecap": "round" }, mg).setAttribute("transform", `rotate(${f(ma)} ${f(cx)} ${f(cy)})`);
    h.dot(cx, cy, s * 0.035, h.inkOnPaper);
    h.hands = { hour: hg.firstChild, minute: mg.firstChild, cx, cy, ha, ma };
  };
  D.phone = function (h, fam) {
    const { s, cx, cy } = h, w = s * 0.52, ht = s * 0.96, x = cx - w / 2, y = cy - ht / 2;
    h.fill(h.box(x, y, w, ht, s * 0.09), fam === "classic" ? h.tone : "ink", { x, y, w, h: ht });
    const sx = x + w * 0.08, sy = y + ht * (fam === "classic" ? 0.1 : 0.05), sw = w * 0.84, sh = ht * (fam === "classic" ? 0.74 : 0.9);
    h.hexFill(T().rr(sx, sy, sw, sh, s * 0.05), S().c("field2" in S().pack.palette ? "field2" : "field"));
    if (fam === "slab") svg("rect", { x: f(cx - w * 0.16), y: f(sy + s * 0.02), width: f(w * 0.32), height: f(s * 0.04), rx: f(s * 0.02), fill: S().c("ink") }, h.g);
    else h.dot(cx, y + ht * 0.92, s * 0.035, h.dk(h.tone, 0.3));
    if (h.detail >= 2) [[0.12, 0.5, "surface"], [0.3, 0.62, "accent4"], [0.48, 0.42, "surface"]].slice(0, h.detail >= 3 ? 3 : 2).forEach(([fy, fw, tk], i) =>
      svg("rect", { x: f(i % 2 ? sx + sw * (0.92 - fw) : sx + sw * 0.08), y: f(sy + sh * fy + s * 0.04), width: f(sw * fw), height: f(sh * 0.12), rx: f(sh * 0.05), fill: h.c(tk) }, h.g));
    if (h.state.ping) { h.dot(x + w * 0.92, y + ht * 0.04, s * 0.07, h.c("neg")); h.ping = h.g.lastChild; }
  };
  D.laptop = function (h, fam) {
    const { s, cx, cy } = h;
    if (fam === "monitor") {
      const w = s * 1.0, ht = s * 0.62, x = cx - w / 2, y = cy - s * 0.46;
      h.fill(h.box(cx - s * 0.06, y + ht - 4, s * 0.12, s * 0.22, 2), "surface2", null);
      h.fill(h.box(cx - s * 0.26, y + ht + s * 0.16, s * 0.52, s * 0.07, s * 0.03), "surface2", null);
      h.fill(h.box(x, y, w, ht, s * 0.04), "ink", { x, y, w, h: ht });
      screen(h, x + s * 0.035, y + s * 0.035, w - s * 0.07, ht - s * 0.07);
      return;
    }
    const w = s * 0.9, ht = s * 0.56, x = cx - w / 2, y = cy - s * 0.4;
    // the viewpoint (D-100): a screen faces its user. "viewer" (default) shows the screen; "away" shows the lid's
    // back (the user sits across from the camera); "left" / "right" is the 3/4 profile a wide shot of a desk sees;
    // "top" is a desk seen from above (keys, trackpad, the lid edge-on)
    const face = (h.state.facing || "viewer");
    if (face === "away") {
      h.fill(h.box(x, y, w, ht, s * 0.04), "surface2", { x, y, w, h: ht });
      svg("rect", { x: f(x + w * 0.04), y: f(y + ht * 0.06), width: f(w * 0.92), height: f(ht * 0.1), rx: f(s * 0.02), fill: h.lt("surface2", 0.12), opacity: 0.6 }, h.g);
      h.dot(cx, y + ht * 0.5, s * 0.04, h.dk("surface2", 0.15));
      h.fill(`M${f(x - s * 0.04)} ${f(y + ht)} H${f(x + w + s * 0.04)} L${f(x + w)} ${f(y + ht + s * 0.04)} H${f(x)} Z`, "surface2", { x: x - s * 0.04, y: y + ht, w: w + s * 0.08, h: s * 0.04 });
      return;
    }
    if (face === "top") {   // seen from above (a desk shot): the deck with its keys and trackpad, the open lid a dark band
      const bw = s * 0.92, bd = s * 0.62, bx = cx - bw / 2, by = cy - bd / 2 + s * 0.04;
      h.fill(h.box(bx, by - s * 0.07, bw, s * 0.09, s * 0.02), "ink", { x: bx, y: by - s * 0.07, w: bw, h: s * 0.09 });   // the lid, edge-on
      h.fill(h.box(bx, by, bw, bd, s * 0.04), "surface2", { x: bx, y: by, w: bw, h: bd });
      const kx = bx + bw * 0.07, kw = bw * 0.86, ky = by + bd * 0.08, rows = h.detail >= 2 ? 5 : 3, kh = bd * 0.5 / rows;
      for (let r = 0; r < rows; r++) {
        const n = 12 - (r === rows - 1 ? 4 : 0), gap = kw * 0.012, w1 = (kw - gap * (n - 1)) / n;
        for (let k = 0; k < n; k++) {
          const wide = r === rows - 1 && k === Math.floor(n / 2) ? 4 : 1;   // the space bar
          if (r === rows - 1 && k > Math.floor(n / 2) && k < Math.floor(n / 2) + 4) continue;
          svg("rect", { x: f(kx + k * (w1 + gap)), y: f(ky + r * kh), width: f(w1 * wide + gap * (wide - 1)), height: f(kh * 0.78), rx: f(kh * 0.15), fill: h.dk("surface2", 0.14) }, h.g);
        }
      }
      svg("rect", { x: f(cx - bw * 0.17), y: f(by + bd * 0.66), width: f(bw * 0.34), height: f(bd * 0.26), rx: f(s * 0.02), fill: h.dk("surface2", 0.08) }, h.g);   // trackpad
      return;
    }
    if (face === "left" || face === "right") {
      const dir = face === "right" ? 1 : -1, bx0 = cx - dir * w * 0.45, bx1 = cx + dir * w * 0.45, by = y + ht + s * 0.02;
      // the base in perspective (a thin slab), then the lid leaning back, seen edge-on with the screen a sliver
      h.fill(`M${f(bx0)} ${f(by)} L${f(bx1)} ${f(by - s * 0.06)} L${f(bx1)} ${f(by - s * 0.03)} L${f(bx0)} ${f(by + s * 0.03)} Z`, "surface2", { x: Math.min(bx0, bx1), y: by - s * 0.06, w: w * 0.9, h: s * 0.09 });
      const hx = bx0 + dir * w * 0.02, tx = hx - dir * w * 0.12, topY = by - ht * 0.98;
      h.fill(`M${f(hx)} ${f(by)} L${f(tx)} ${f(topY)} L${f(tx + dir * s * 0.035)} ${f(topY + s * 0.01)} L${f(hx + dir * s * 0.035)} ${f(by - s * 0.005)} Z`, "ink", { x: Math.min(hx, tx), y: topY, w: Math.abs(hx - tx) + s * 0.04, h: by - topY });
      h.hexFill(`M${f(hx + dir * s * 0.035)} ${f(by - s * 0.01)} L${f(tx + dir * s * 0.035)} ${f(topY + s * 0.015)} L${f(tx + dir * s * 0.05)} ${f(topY + s * 0.03)} L${f(hx + dir * s * 0.05)} ${f(by - s * 0.02)} Z`, S().c("field2" in S().pack.palette ? "field2" : "field"), { opacity: 0.8 });
      return;
    }
    h.fill(h.box(x, y, w, ht, s * 0.04), "ink", { x, y, w, h: ht });
    screen(h, x + s * 0.035, y + s * 0.035, w - s * 0.07, ht - s * 0.07);
    h.fill(`M${f(x - s * 0.08)} ${f(y + ht)} H${f(x + w + s * 0.08)} L${f(x + w + s * 0.02)} ${f(y + ht + s * 0.09)} H${f(x - s * 0.02)} Z`, "surface2", { x: x - s * 0.08, y: y + ht, w: w + s * 0.16, h: s * 0.09 });
    svg("rect", { x: f(cx - s * 0.08), y: f(y + ht), width: f(s * 0.16), height: f(s * 0.025), rx: 3, fill: h.dk("surface2", 0.25) }, h.g);
  };
  function screen(h, x, y, w, ht) {
    h.hexFill(T().rr(x, y, w, ht, h.s * 0.015), S().c("field2" in S().pack.palette ? "field2" : "field"));
    if (h.detail < 2) return;
    svg("rect", { x: f(x), y: f(y), width: f(w), height: f(ht * 0.14), fill: h.c("surface") }, h.g);
    [0, 1, 2].forEach((i) => h.dot(x + ht * 0.08 + i * ht * 0.09, y + ht * 0.07, ht * 0.025, h.c(["neg", "accent2", "pos"][i])));
    const k = h.state.screen || "chart";
    if (k === "chart") [0.4, 0.62, 0.5, 0.82].slice(0, h.detail >= 3 ? 4 : 3).forEach((v, i) => svg("rect", { x: f(x + w * (0.14 + i * 0.2)), y: f(y + ht * (0.92 - v * 0.7)), width: f(w * 0.12), height: f(ht * v * 0.7), rx: 3, fill: h.c(i === 3 ? "accent2" : "accent4") }, h.g));
    else lines(h, x + w * 0.1, y + ht * 0.32, w * 0.7, h.detail >= 3 ? 4 : 3, ht * 0.15, h.c("muted"));
  }
  D.folder = function (h, fam) {
    const { s, cx, cy } = h, w = s * 0.96, ht = s * 0.7, x = cx - w / 2, y = cy - ht / 2 + s * 0.06;
    if (fam === "binder") {
      h.fill(h.box(x + w * 0.15, y - s * 0.08, w * 0.7, ht + s * 0.08, s * 0.03), h.tone, { x: x + w * 0.15, y: y - s * 0.08, w: w * 0.7, h: ht + s * 0.08 });
      h.fill(h.box(x + w * 0.15, y - s * 0.08, w * 0.16, ht + s * 0.08, s * 0.03), T().tk("surface2"), null);
      svg("rect", { x: f(x + w * 0.42), y: f(y + ht * 0.2), width: f(w * 0.32), height: f(ht * 0.24), rx: 4, fill: h.paper }, h.g);
      if (h.detail >= 2) [0.25, 0.75].forEach((k) => h.dot(x + w * 0.23, y + ht * k, s * 0.035, h.paper));
      return;
    }
    h.hexFill(h.box(x, y - s * 0.08, w * 0.42, s * 0.16, s * 0.04), h.dk(h.tone, 0.18));
    h.hexFill(h.box(x, y, w, ht, s * 0.05), h.dk(h.tone, 0.18));
    if (h.detail >= 2 || h.state.open) { h.hexFill(T().rr(x + w * 0.08, y - s * 0.02, w * 0.84, ht * 0.6, 4), h.paper); if (h.detail >= 3) h.hexFill(T().rr(x + w * 0.14, y - s * 0.06, w * 0.72, ht * 0.5, 4), h.paperDk); }
    h.fill(h.box(x, y + ht * 0.18, w, ht * 0.82, s * 0.05), h.tone, { x, y: y + ht * 0.18, w, h: ht * 0.82 });
  };
  D.package = function (h, fam) {
    const { s, cx, cy } = h, w = s * 0.86, ht = s * 0.62, x = cx - w / 2, y = cy - ht / 2 + s * 0.1;
    if (fam === "parcel") {
      h.fill(h.box(x, y - s * 0.06, w, ht + s * 0.06, s * 0.05), h.tone, { x, y: y - s * 0.06, w, h: ht + s * 0.06 });
      h.stroke(`M${f(cx)} ${f(y - s * 0.06)} V${f(y + ht)} M${f(x)} ${f(y + ht * 0.45)} H${f(x + w)}`, h.dk(h.tone, 0.35), s * 0.035);
      h.stroke(`M${f(cx)} ${f(y - s * 0.06)} c${f(-s * 0.16)} ${f(-s * 0.16)} ${f(-s * 0.2)} ${f(s * 0.02)} 0 0 c${f(s * 0.16)} ${f(-s * 0.16)} ${f(s * 0.2)} ${f(s * 0.02)} 0 0`, h.dk(h.tone, 0.35), s * 0.03);
      return;
    }
    const top = s * 0.2;
    h.hexFill(`M${f(x)} ${f(y)} L${f(x + w * 0.16)} ${f(y - top)} H${f(x + w * 1.0)} L${f(x + w * 0.84)} ${f(y)} Z`, h.lt(h.tone, 0.15));
    h.fill(h.box(x, y, w * 0.84, ht, fam === "crate" ? 2 : s * 0.02), h.tone, { x, y, w: w * 0.84, h: ht });
    h.hexFill(`M${f(x + w * 0.84)} ${f(y)} L${f(x + w)} ${f(y - top)} V${f(y + ht - top)} L${f(x + w * 0.84)} ${f(y + ht)} Z`, h.dk(h.tone, 0.22));
    if (fam === "crate") { for (let i = 1; i < 4; i++) h.stroke(`M${f(x)} ${f(y + ht * i / 4)} H${f(x + w * 0.84)}`, h.dk(h.tone, 0.3), s * 0.018); h.stroke(`M${f(x)} ${f(y)} L${f(x + w * 0.84)} ${f(y + ht)}`, h.dk(h.tone, 0.3), s * 0.03); }
    else { svg("rect", { x: f(x + w * 0.32), y: f(y), width: f(w * 0.18), height: f(ht * (h.detail >= 2 ? 0.42 : 0.25)), fill: h.lt(h.tone, 0.35), opacity: 0.85 }, h.g); if (h.detail >= 3) svg("rect", { x: f(x + w * 0.52), y: f(y + ht * 0.6), width: f(w * 0.24), height: f(ht * 0.24), rx: 3, fill: h.paper }, h.g); }
  };
  D.building = function (h, fam) {
    const { s, cx, cy } = h;
    if (fam === "house") {
      const w = s * 0.78, ht = s * 0.5, x = cx - w / 2, y = cy - s * 0.06;
      h.fill(`M${f(x - s * 0.08)} ${f(y)} L${f(cx)} ${f(y - s * 0.4)} L${f(x + w + s * 0.08)} ${f(y)} Z`, "accent3", { x: x - s * 0.08, y: y - s * 0.4, w: w + s * 0.16, h: s * 0.4 });
      h.fill(h.box(x, y, w, ht, 3), h.tone, { x, y, w, h: ht });
      h.hexFill(T().rr(cx - s * 0.08, y + ht - s * 0.26, s * 0.16, s * 0.26, s * 0.03), h.dk(h.tone, 0.35));
      if (h.detail >= 2) [-1, 1].forEach((k) => svg("rect", { x: f(cx + k * w * 0.3 - s * 0.07), y: f(y + ht * 0.2), width: f(s * 0.14), height: f(s * 0.12), rx: 3, fill: h.c(h.state.lit ? "accent2" : "field") }, h.g));
      return;
    }
    if (fam === "institution") {
      const w = s * 0.96, x = cx - w / 2, base = cy + s * 0.36, top = cy - s * 0.18;
      h.fill(`M${f(x)} ${f(top)} L${f(cx)} ${f(top - s * 0.24)} L${f(x + w)} ${f(top)} Z`, h.tone, { x, y: top - s * 0.24, w, h: s * 0.24 });
      svg("rect", { x: f(x + s * 0.02), y: f(top), width: f(w - s * 0.04), height: f(s * 0.06), fill: h.dk(h.tone, 0.2) }, h.g);
      const n = h.detail >= 2 ? 5 : 3;
      for (let i = 0; i < n; i++) { const px = x + w * (0.12 + i * 0.76 / (n - 1)); h.fill(T().rr(px - s * 0.035, top + s * 0.06, s * 0.07, base - top - s * 0.12, 2), "surface", null); }
      h.fill(h.box(x - s * 0.02, base - s * 0.06, w + s * 0.04, s * 0.08, 2), h.tone, { x: x - s * 0.02, y: base - s * 0.06, w: w + s * 0.04, h: s * 0.08 });
      return;
    }
    const w = s * 0.52, ht = s * 0.94, x = cx - w / 2, y = cy - ht / 2;
    h.fill(h.box(x, y, w, ht, s * 0.03), h.tone, { x, y, w, h: ht });
    if (h.detail >= 2) h.hexFill(h.box(x + w * 0.62, y - s * 0.06, w * 0.22, s * 0.1, 2), h.dk(h.tone, 0.2));
    const cols = 3, rows = h.detail >= 3 ? 7 : h.detail >= 2 ? 5 : 3, rng = Loom.rng("bld:" + h.key);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) svg("rect", { x: f(x + w * (0.14 + c * 0.26)), y: f(y + ht * (0.08 + r * 0.8 / rows)), width: f(w * 0.18), height: f(ht * 0.5 / rows), rx: 2, fill: h.c(h.state.lit && rng() > 0.4 ? "accent2" : "field") }, h.g);
  };
  D.heart = function (h, fam) {
    const { s, cx, cy } = h, r = s * 0.24, top = cy - s * 0.2;
    const d = `M${f(cx)} ${f(cy + s * 0.42)} C${f(cx - s * 0.6)} ${f(cy + s * 0.02)} ${f(cx - s * 0.52)} ${f(top - r * 1.1)} ${f(cx - s * 0.12)} ${f(top - r * 0.5)} Q${f(cx)} ${f(top - r * 0.2)} ${f(cx)} ${f(top + r * 0.05)} Q${f(cx)} ${f(top - r * 0.2)} ${f(cx + s * 0.12)} ${f(top - r * 0.5)} C${f(cx + s * 0.52)} ${f(top - r * 1.1)} ${f(cx + s * 0.6)} ${f(cy + s * 0.02)} ${f(cx)} ${f(cy + s * 0.42)} Z`;
    if (fam === "organ") {   // a drawn organ: the body, two vessels above, a vein line
      h.fill(T().rr(cx - s * 0.06, cy - s * 0.48, s * 0.12, s * 0.26, s * 0.05), "accent", null);
      h.fill(T().rr(cx + s * 0.08, cy - s * 0.42, s * 0.1, s * 0.2, s * 0.045), "accent4", null);
      h.fill(d, h.tone, { x: cx - s * 0.5, y: cy - s * 0.42, w: s, h: s * 0.84 });
      if (h.detail >= 2) h.stroke(`M${f(cx - s * 0.04)} ${f(top)} q${f(-s * 0.1)} ${f(s * 0.2)} ${f(s * 0.02)} ${f(s * 0.4)}`, h.dk(h.tone, 0.3), s * 0.025);
    } else {
      h.fill(d, h.tone, { x: cx - s * 0.5, y: cy - s * 0.42, w: s, h: s * 0.84 });
      if (h.detail >= 2) svg("ellipse", { cx: f(cx - s * 0.2), cy: f(top - s * 0.02), rx: f(s * 0.08), ry: f(s * 0.04), fill: "#FFFFFF", opacity: 0.4, transform: `rotate(-35 ${f(cx - s * 0.2)} ${f(top - s * 0.02)})` }, h.g);
    }
  };
  D.bulb = function (h, fam) {
    const { s, cx, cy } = h, r = s * 0.3, by = cy - s * 0.08, on = !!h.state.on;
    if (on || fam === "spark") for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42; h.stroke(`M${f(cx + Math.cos(a) * r * 1.3)} ${f(by + Math.sin(a) * r * 1.3)} L${f(cx + Math.cos(a) * r * 1.65)} ${f(by + Math.sin(a) * r * 1.65)}`, h.c(on ? "accent2" : "muted"), s * 0.03); }
    if (on) {   // a soft glow: stacked discs, lightest outside (no filter, so the preview and the render agree)
      const LDk = S().contrast(S().c("field"), "#000000") < 5;   // a dark field: a glow lightens it
      [1.7, 1.45, 1.22].forEach((k, i) => svg("circle", { cx: f(cx), cy: f(by), r: f(r * k), fill: LDk ? S().mix(S().c("field"), h.c("accent2"), 0.12 + i * 0.1) : h.lt("accent2", 0.5 - i * 0.12) }, h.g));
    }
    h.fill(`M${f(cx - r * 0.55)} ${f(by + r * 0.82)} C${f(cx - r * 1.3)} ${f(by + r * 0.2)} ${f(cx - r * 1.1)} ${f(by - r * 1.05)} ${f(cx)} ${f(by - r * 1.05)} C${f(cx + r * 1.1)} ${f(by - r * 1.05)} ${f(cx + r * 1.3)} ${f(by + r * 0.2)} ${f(cx + r * 0.55)} ${f(by + r * 0.82)} Z`, on ? "accent2" : (fam === "spark" ? h.tone : "surface"), { x: cx - r, y: by - r, w: 2 * r, h: 2 * r });
    if (h.detail >= 2) h.stroke(`M${f(cx - r * 0.3)} ${f(by + r * 0.7)} L${f(cx - r * 0.2)} ${f(by)} l${f(r * 0.1)} ${f(-r * 0.15)} l${f(r * 0.1)} ${f(r * 0.15)} l${f(r * 0.1)} ${f(-r * 0.15)} l${f(r * 0.1)} ${f(r * 0.15)} L${f(cx + r * 0.3)} ${f(by + r * 0.7)}`, h.dk(on ? "accent2" : "surface", 0.4), s * 0.018);
    for (let i = 0; i < (h.detail >= 2 ? 3 : 2); i++) h.hexFill(T().rr(cx - r * 0.5, by + r * 0.85 + i * s * 0.06, r, s * 0.05, s * 0.02), i % 2 ? h.dk("surface2", 0.2) : S().c(T().tk("surface2")));
  };
  D.lock = function (h, fam) {
    const { s, cx, cy } = h, open = !!h.state.open;
    if (fam === "shield") {
      const w = s * 0.8, top = cy - s * 0.44;
      h.fill(`M${f(cx)} ${f(top)} L${f(cx + w / 2)} ${f(top + s * 0.12)} V${f(cy + s * 0.02)} C${f(cx + w / 2)} ${f(cy + s * 0.3)} ${f(cx + s * 0.1)} ${f(cy + s * 0.42)} ${f(cx)} ${f(cy + s * 0.48)} C${f(cx - s * 0.1)} ${f(cy + s * 0.42)} ${f(cx - w / 2)} ${f(cy + s * 0.3)} ${f(cx - w / 2)} ${f(cy + s * 0.02)} V${f(top + s * 0.12)} Z`, h.tone, { x: cx - w / 2, y: top, w, h: s * 0.92 });
      h.dot(cx, cy - s * 0.02, s * 0.07, h.dk(h.tone, 0.45)); h.hexFill(`M${f(cx - s * 0.03)} ${f(cy)} h${f(s * 0.06)} l${f(s * 0.02)} ${f(s * 0.16)} h${f(-s * 0.1)} Z`, h.dk(h.tone, 0.45));
      return;
    }
    const w = s * 0.66, ht = s * 0.52, x = cx - w / 2, y = cy - s * 0.06, sr = w * 0.3;
    h.stroke(`M${f(cx - sr)} ${f(y - (open ? s * 0.12 : 0))} V${f(y - s * 0.12 - (open ? s * 0.12 : 0))} a${f(sr)} ${f(sr)} 0 0 1 ${f(2 * sr)} 0 V${f(y - (open ? s * 0.02 : 0))}`, h.c("muted"), s * 0.08);
    h.fill(h.box(x, y, w, ht, s * 0.08), h.tone, { x, y, w, h: ht });
    if (h.detail >= 2) { h.dot(cx, y + ht * 0.4, s * 0.06, h.dk(h.tone, 0.45)); h.hexFill(`M${f(cx - s * 0.025)} ${f(y + ht * 0.42)} h${f(s * 0.05)} l${f(s * 0.02)} ${f(ht * 0.32)} h${f(-s * 0.09)} Z`, h.dk(h.tone, 0.45)); }
  };

  /* ---------------- public ---------------- */
  /** draw an object into a group (props in places, objects inside other builders). Returns the helper (for parts). */
  /** Real sizes (the largest dimension, metres) for the scale check (D-100): step 7 drew a laptop as big as the desk
   *  beside a person. A standing adult is 1.7 m. A shape drawn near people should sit near its real share of a person;
   *  a close-up of an object (the camera on it, no person at that depth) passes `hero: true`. `real` on any element
   *  (ctx.el(name, {real: "laptop"})) puts a hand-drawn object under the same check. */
  O.REAL = { person: 1.7, laptop: 0.36, monitor: 0.6, phone: 0.15, clock: 0.32, calendar: 0.4, document: 0.3, envelope: 0.24,
    folder: 0.33, package: 0.45, bulb: 0.12, lock: 0.1, desk: 1.5, chair: 1.0, door: 2.1, plant: 1.1, shelf: 1.9, whiteboard: 1.8, mug: 0.1 };
  /** the size (px) an object should be beside a person drawn `personPx` tall */
  O.px = function (kind, personPx) { return (O.REAL[kind] || 0.3) / O.REAL.person * personPx; };
  O.record = function (kind, size, o) {
    if (!(kind in O.REAL)) return;
    (Loom.report.objects = Loom.report.objects || []).push({ beat: Loom.ctxBeat && Loom.ctxBeat.id, kind, size: Math.round(size), real_m: O.REAL[kind], hero: !!(o && o.hero), name: (o && (o.key || o.name)) || kind });
  };
  O.shape = function (g, kind, cx, cy, size, o) {
    o = o || {};
    if (!D[kind]) { Loom.error("object_missing", `no object "${kind}" (have: ${O.KINDS.join(", ")})`); return null; }
    if (![cx, cy, size].every(Number.isFinite)) { Loom.error("object_bad_point", `object ${kind}: x, y and size must be numbers`); return null; }
    const fam = O.family(kind, o);
    const sg = svg("g", { "data-object": kind, "data-family": fam }, g);
    const h = H(sg, kind, cx, cy, size, o);
    // a wall item gets a soft cast shadow on the wall plane (down and to the side), never a floor ellipse: step 7's
    // clocks and calendars floated because nothing tied them to the wall
    if (o.shadow === "wall") { /* drawn after the object: a silhouette copy on the wall plane, below */ }
    else if (o.shadow !== false) svg("ellipse", { cx: f(cx), cy: f(cy + size * 0.5), rx: f(size * 0.38), ry: f(size * 0.06), fill: S().c("shadow"), opacity: 0.35 }, sg);
    D[kind](h, fam);
    if (o.shadow === "wall") {   // a silhouette of the drawn object, offset down and to the side, behind it
      const ws = svg("g", { transform: `translate(${f(size * 0.035)} ${f(size * 0.05)})`, opacity: 0.24, "data-shadow": "wall" }, null);
      const col = S().c("shadow");
      const kids = Array.from(sg.childNodes || []);
      if (!kids.length || typeof kids[0].cloneNode !== "function" || typeof ws.querySelectorAll !== "function") {
        // a DOM without cloning (the node SVG preview shim): a soft rounded shadow of the object's size instead
        svg("rect", { x: f(cx - size * 0.42), y: f(cy - size * 0.42), width: f(size * 0.84), height: f(size * 0.84), rx: f(size * 0.2), fill: S().c("shadow") }, ws);
        sg.insertBefore(ws, sg.firstChild);
      } else {
      for (const c of kids) ws.appendChild(c.cloneNode(true));
      ws.querySelectorAll("*").forEach((n) => { for (const k of ["fill", "stroke"]) { const v = n.getAttribute(k); if (v && v !== "none") n.setAttribute(k, col); } });
      ws.querySelectorAll("clipPath,mask,defs,linearGradient,radialGradient,filter").forEach((n) => n.remove());   // ids stay unique
      ws.querySelectorAll("[clip-path],[mask],[filter]").forEach((n) => { n.removeAttribute("clip-path"); n.removeAttribute("mask"); n.removeAttribute("filter"); });
      sg.insertBefore(ws, sg.firstChild);
      }
    }
    O.record(kind === "laptop" && fam === "monitor" ? "monitor" : kind, size, o);
    (Loom.report.treatments = Loom.report.treatments || []).push({ beat: Loom.ctxBeat && Loom.ctxBeat.id, axis: "object", as: kind + "/" + fam, name: o.key || kind, seeded: !!T().seed() });
    h.family = fam;
    return h;
  };
  /** an object as its own element, with the seed's entrance, and the state changes that carry meaning */
  O.draw = function (ctx, name, kind, o) {
    o = o || {};
    const size = o.size || 160, pad = size * 0.4;
    const E = ctx.el(name, { x: o.x - size / 2 - pad, y: o.y - size / 2 - pad, w: size + 2 * pad, h: size + 2 * pad, kind: "object", parent: o.parent });
    const h = O.shape(E.inner, kind, size / 2 + pad, size / 2 + pad, size, Object.assign({}, o, { key: o.key || name }));
    E.object = h;
    if (h && kind === "heart" && o.t0 != null) {   // a heartbeat: two quick pulses per beat period, deterministic
      const period = o.period || 0.85;
      for (let t = o.t0; t < (o.t1 || o.t0 + 4); t += period) {
        Loom.tween(E.life, { scale: 1, transformOrigin: "50% 60%" }, { scale: 1.08, duration: 0.09, ease: "power2.out" }, t, { kind: "ambient", beat: E.beat, name });
        Loom.tween(E.life, { scale: 1.08, transformOrigin: "50% 60%" }, { scale: 1, duration: 0.22, ease: "power2.in" }, t + 0.1, { kind: "ambient", beat: E.beat, name });
      }
    }
    if (h && kind === "clock" && o.t0 != null && h.hands) {   // time passing: the minute hand sweeps, the hour hand follows
      const turns = o.turns || 1;
      const H0 = h.hands, rot = (n, a) => n.setAttribute("transform", `rotate(${f(a)} ${f(H0.cx)} ${f(H0.cy)})`);
      Loom.drive((p) => { rot(H0.minute, H0.ma + 360 * turns * p); rot(H0.hour, H0.ha + 30 * turns * p); }, o.t0, (o.t1 || o.t0 + 3) - o.t0, "linear", { kind: "ambient", beat: E.beat, name });
    }
    if (h && h.ping && o.pingAt != null) Loom.tween(h.ping, { opacity: 0, scale: 0.2, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: (((S().pack && S().pack.motion) || {}).overshoot ? Loom.ease.overshoot : Loom.ease.enter) }, o.pingAt, { kind: "pop", beat: E.beat, name, content: true });
    if (h && h.ping && o.pingAt != null) Loom.set(h.ping, { opacity: 0 }, 0);
    T().enter(E, o.t, "badge", o);
    return E;
  };
})();
