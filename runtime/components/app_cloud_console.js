// T-157 app_cloud_console: a generic cloud console shell (hand-off sheet, Family M). Built on runtime/components/_app_kit.js.
Loom.component("app_cloud_console", {
  version: 1,
  idea: "A cloud provider's console: services in a sidebar, the project and region, a list of resources with their status, and one resource's detail with its settings, metrics, access roles and logs, walked through by a pointer that creates a resource, scales it, attaches a role and reads its logs.",
  outline: ["window (or the screencast engine's app window)", "sidebar: services", "top bar: project and region", "resource list: name, type, region, status, size; a create button", "resource detail: name and status, tabs for overview, metrics, permissions and logs", "create panel, scale dialog, role form (opened by actions)", "toast", "pointer"],
  family: "ops",
  tags: ["cloud console", "cloud", "virtual machine", "iam", "permissions", "scaling", "logs", "devops", "infrastructure", "aws-like"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-157)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop"],   // a product UI: the styles that show products as screens (D-193)
  params: {
    resources: { type: "list", content: true },  // [{id, name, type, region, status, tone: "pos"|"warn"|"neg", size, instances, detail: [[label, value]],
                                                 // metrics: [{label, unit, labels, values}], roles: [{member, role}], logs: [lines]}]
    nav: { type: "list" },                       // services [{id, label, icon}] (icons alone when no label)
    active: { type: "str" },                     // the active service id
    project: { type: "str" },                    // the project in the top bar
    region: { type: "str" },                     // the region in the top bar
    columns: { type: "list" },                   // the list's header words for name, type, region, status and size (no header row when omitted)
    open: { type: "str" },                       // a resource open in detail at the start (the list when omitted)
    heading: { type: "str" },                    // the list page's heading
    title: { type: "str" },
    labels: { type: "obj" },                     // the product's words, each optional: {create, scale, attach, overview, metrics, permissions, logs, name, type,
                                                 // region, size, member, role, save, instances, provisioning, running, created, scaled, attached}
    state: { type: "enum", choices: ["ready", "loading", "empty", "error"], default: "ready" },
    notice: { type: "str" },
    steps: { type: "list", default: [] },        // [{do: "open"|"back"|"tab"|"create"|"scale"|"attachRole"|"viewLogs"|"state", at, ...}]
    theme: { type: "obj", default: {} }, layout: { type: "obj", default: {} },   // layout: {sidebarW}
    w: { type: "number", default: 1728 }, h: { type: "number", default: 856 },
    at: { type: "number", default: -1 }, cps: { type: "number", default: 14 },
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["host", "sidebar", "topbar", "table", "rows", "details", "states",
    "open(id, at)", "back(at)", "tab(name, at)", "create({name, type, region, size}, at)", "scale(id, n, at)", "attachRole(id, {member, role}, at)", "viewLogs(id, at)", "setState(name, at)"],
  example: 'ctx.use("app_cloud_console", { project: "payments-prod", region: "eu-west", resources: [{ id: "api", name: "payments-api", type: "Container service", status: "Running", tone: "pos", instances: 2, logs: ["GET /health 200"] }], labels: { scale: "Scale", instances: "Instances" }, steps: [{ do: "scale", id: "api", n: 4, at: ctx.cue("scale it to four") }] }, { x: 96, y: 78, name: "console" })',
  size: (p) => ({ w: p.w, h: p.h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, svg = (t, a, q) => Loom.svg(t, a, q);
    const T = AK.theme(p.theme), Z = AK.sizes(T), tones = AK.tones(T), L = p.labels || {}, LY = p.layout || {};
    const H = AK.host(ctx, g, p, { T, Z, title: p.title });
    const B = H.body, BW = B.w, BH = B.h, pad = Z.pad, root = B.g;
    AK.box(root, 0, 0, BW, BH, { r: 0, fill: tones.page });
    const res = p.resources.map((r, i) => Object.assign({ id: r.id || "r" + i }, r));
    const TN = { pos: "pos", neg: "neg", warn: "accent4", info: T.accent };
    const PH = AK.boxH(Z.small, "caption", 600);
    const pill = (gg, x, y, s, tone, align) => AK.pill(gg, x, y, s, { size: Z.small, fill: AK.mix("surface", TN[tone] || "muted", 0.16), color: TN[tone] || "ink", weight: 600, h: PH, align, icon: tone === "warn" ? "loader" : null });

    // ---------------------------------------------------------------- sidebar and top bar
    const SW = Math.round(LY.sidebarW || AK.clamp(BW * 0.15, 220, 290));
    const navs = p.nav || [];
    const side = svg("g", {}, root);
    const topH = Math.round(Math.max(Z.ctl + 22, 64));
    AK.box(side, 0, 0, SW, BH, { r: 0, fill: tones.side });
    AK.box(side, SW - 1, 0, 1.5, BH, { r: 0, fill: tones.hair2 });
    const brand = AK.solid(T.accent);
    AK.box(side, pad, (topH - 40) / 2, 40, 40, { r: 10, fill: brand.fill, stroke: brand.stroke, sw: brand.sw });
    AK.icon(side, "cloud", pad + 20, topH / 2, 24, brand.fg);
    const rowH = AK.boxH(Z.fs, "caption", 600, Math.round(Z.row * 0.92));
    navs.forEach((n, i) => {
      const y = topH + 10 + i * (rowH + 2), on = n.id === p.active;
      if (y + rowH > BH) return;
      if (on) AK.box(side, 10, y, SW - 20, rowH, { r: Math.min(T.radius, 8), fill: tones.sel });
      AK.icon(side, n.icon || "box", 10 + 26, y + rowH / 2, 22, on ? T.accent : "muted");
      if (n.label) AK.T(side, n.label, { x: 10 + 50, y, w: SW - 80, h: rowH, size: Z.fs, weight: on ? 700 : 500, color: on ? T.accent : "ink" });
    });
    const top = svg("g", {}, root);
    AK.box(top, SW, 0, BW - SW, topH, { r: 0, fill: tones.card });
    AK.box(top, SW, topH - 1, BW - SW, 1.5, { r: 0, fill: tones.hair2 });
    let tx = SW + pad;
    for (const [s, ic] of [[p.project, "folder-kanban"], [p.region, "globe"]]) {
      if (!s) continue;
      const c = AK.pill(top, tx, (topH - AK.boxH(Z.fs, "caption", 600)) / 2, s, { size: Z.fs, icon: ic, fill: tones.page, stroke: tones.hair2, weight: 600, color: "ink" });
      tx += c.w + 12;
    }

    // ---------------------------------------------------------------- the list page
    const MX = SW + pad * 1.4, MW = BW - SW - pad * 2.8, y0 = topH + pad;
    const listV = svg("g", {}, root);
    const headH = Math.max(Z.lhB, Z.ctl);
    if (p.heading) AK.T(svg("g", {}, listV), p.heading, { role: "lead", x: MX, y: y0, w: MW * 0.6, h: headH, size: Z.big, weight: 700 });
    const createB = AK.button(listV, MX + MW, y0 + (headH - Z.ctl) / 2, { label: L.create, icon: "plus", kind: "primary", T, Z, align: "right" });
    const tY = y0 + headH + pad, tH = BH - tY - pad;
    AK.box(listV, MX, tY, MW, tH, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
    const fr = [0.3, 0.22, 0.16, 0.18, 0.14], colX = []; let acc = MX + 24;
    fr.forEach((f) => { colX.push(acc); acc += (MW - 48) * f; });
    const colW = fr.map((f) => (MW - 48) * f - 12);
    let ry = tY;
    const thH = AK.boxH(Z.small, "caption", 600, 52);
    if (p.columns && p.columns.length) {
      AK.box(listV, MX + 1, tY + 1, MW - 2, thH, { r: T.radius, fill: tones.page });
      p.columns.slice(0, 5).forEach((c, i) => AK.T(listV, c, { x: colX[i], y: tY, w: colW[i], h: thH, size: Z.small, weight: 600, color: "muted" }));
      ry += thH;
      AK.box(listV, MX, ry, MW, 1.5, { r: 0, fill: tones.hair2 });
    }
    const RH = AK.boxH(Z.fs, "caption", 600, Z.row);
    const rowsG = svg("g", {}, listV);
    const rows = [];
    function drawRow(r, y, parent) {
      const rg = svg("g", {}, parent);
      AK.box(rg, MX + 2, y, MW - 4, RH, { r: 0, fill: tones.card });
      const hov = AK.box(rg, MX + 2, y, MW - 4, RH, { r: 0, fill: tones.hover, opacity: 0 });
      AK.box(rg, MX + 16, y + RH - 1, MW - 32, 1, { r: 0, fill: tones.hair });
      AK.icon(rg, r.icon || "server", colX[0] + 11, y + RH / 2, 22, T.accent);
      AK.T(rg, r.name || "", { x: colX[0] + 32, y, w: colW[0] - 32, h: RH, size: Z.fs, weight: 600, color: T.accent });
      if (r.type) AK.T(rg, r.type, { x: colX[1], y, w: colW[1], h: RH, size: Z.fs });
      if (r.region) AK.T(rg, r.region, { x: colX[2], y, w: colW[2], h: RH, size: Z.fs, color: "muted" });
      const stG = svg("g", {}, rg);
      if (r.status) pill(stG, colX[3], y + (RH - PH) / 2, r.status, r.tone);
      if (r.size) AK.T(rg, r.size, { x: colX[4], y, w: colW[4], h: RH, size: Z.fs, color: "muted" });
      return { g: rg, y, h: RH, r, hov, stG, shift: 0 };
    }
    res.forEach((r) => { const y = ry + rows.length * RH; if (y + RH <= tY + tH - 4) rows.push(drawRow(r, y, rowsG)); });

    // ---------------------------------------------------------------- detail pages (one a resource with detail)
    const roleRH = AK.boxH(Z.fs, "caption", 600, Z.row);
    const TABS = [["overview", "layout-dashboard"], ["metrics", "activity"], ["permissions", "shield-check"], ["logs", "scroll-text"]];
    const details = {};
    function detail(r) {
      if (details[r.id]) return details[r.id];
      const dv = svg("g", { opacity: 0 }, root);
      AK.box(dv, SW, topH, BW - SW, BH - topH, { r: 0, fill: tones.page });
      const backB = AK.button(dv, MX, y0 + (headH - Z.ctl) / 2, { icon: "arrow-left", kind: "ghost", T, Z });
      const nx = backB.x + backB.w + 12;
      const st = svg("g", {}, dv);
      const stP = r.status ? pill(st, MX + MW, y0 + (headH - PH) / 2, r.status, r.tone, "right") : { w: 0 };
      const scaleB = AK.button(dv, MX + MW - stP.w - 16, y0 + (headH - Z.ctl) / 2, { label: L.scale, icon: "scaling", T, Z, align: "right" });
      AK.T(svg("g", {}, dv), r.name || "", { role: "lead", x: nx, y: y0, w: scaleB.x - nx - 16, h: headH, size: Z.big, weight: 700 });
      // tabs
      const tabY = y0 + headH + 10, tabH = AK.boxH(Z.fs, "caption", 600, 50);
      AK.box(dv, MX, tabY + tabH - 1, MW, 1.5, { r: 0, fill: tones.hair2 });
      let tx2 = MX;
      const tabs = {};
      for (const [k, ic] of TABS) {
        const lab = L[k], w = lab ? AK.measure(lab, "caption", Z.fs, 600) + 64 : 56;
        const tg = svg("g", {}, dv), on = svg("g", { opacity: k === "overview" ? 1 : 0 }, tg), off = svg("g", { opacity: k === "overview" ? 0 : 1 }, tg);
        AK.box(on, tx2 + 6, tabY + tabH - 4, w - 12, 4, { r: 2, fill: T.accent });
        AK.icon(on, ic, tx2 + 24, tabY + tabH / 2, 22, T.accent); AK.icon(off, ic, tx2 + 24, tabY + tabH / 2, 22, "muted");
        if (lab) { AK.T(on, lab, { x: tx2 + 44, y: tabY, w: w - 48, h: tabH, size: Z.fs, weight: 600, color: T.accent }); AK.T(off, lab, { x: tx2 + 44, y: tabY, w: w - 48, h: tabH, size: Z.fs, weight: 600, color: "muted" }); }
        tabs[k] = { g: tg, x: tx2, y: tabY, w, h: tabH, on, off };
        tx2 += w + 6;
      }
      const cy = tabY + tabH + pad, ch = BH - cy - pad;
      const panes = {};
      // overview: settings rows and the first metric
      {
        const pg = svg("g", {}, dv), dw = MW * 0.46;
        const rows2 = (r.detail || []).slice();
        if (r.instances != null && L.instances) rows2.unshift([L.instances, String(r.instances)]);
        const drh = AK.boxH(Z.fs, "caption", 600, Z.row - 4);
        const n = Math.min(rows2.length, Math.floor((ch - 20) / drh));
        AK.box(pg, MX, cy, dw, Math.max(drh, n * drh) + 20, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
        const vals = [];
        rows2.slice(0, n).forEach(([k, v], i) => {
          const yy = cy + 10 + i * drh;
          if (i) AK.box(pg, MX + 20, yy, dw - 40, 1, { r: 0, fill: tones.hair });
          AK.T(pg, k, { x: MX + 24, y: yy, w: dw * 0.45 - 24, h: drh, size: Z.small, color: "muted" });
          const vg = svg("g", {}, pg);
          AK.T(vg, v, { x: MX + dw * 0.45, y: yy, w: dw * 0.55 - 24, h: drh, size: Z.fs, weight: 600 });
          vals.push({ g: vg, x: MX + dw * 0.45, y: yy, w: dw * 0.55 - 24, h: drh, k });
        });
        const m = (r.metrics || [])[0];
        let chart = null;
        if (m) {
          const cx2 = MX + dw + pad, cw2 = MW - dw - pad, chh = Math.min(ch, 380);
          AK.box(pg, cx2, cy, cw2, chh, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
          if (m.label) AK.T(pg, m.label, { x: cx2 + 20, y: cy + 12, w: cw2 - 40, h: Z.lh, size: Z.fs, weight: 700 });
          chart = AK.chart(pg, cx2 + 16, cy + 16 + Z.lh, cw2 - 32, chh - 32 - Z.lh, { T, Z, labels: m.labels, series: [{ values: m.values }], unit: m.unit, alt: m.after ? [m.after] : null });
        }
        panes.overview = { g: pg, vals, chart };
      }
      // metrics: up to two charts side by side
      {
        const pg = svg("g", { opacity: 0 }, dv), ms = (r.metrics || []).slice(0, 2), gap = pad, cw3 = (MW - gap * (ms.length - 1)) / Math.max(1, ms.length), chh = Math.min(ch, 420);
        const charts = ms.map((m, i) => {
          const cx3 = MX + i * (cw3 + gap);
          AK.box(pg, cx3, cy, cw3, chh, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
          if (m.label) AK.T(pg, m.label, { x: cx3 + 20, y: cy + 12, w: cw3 - 40, h: Z.lh, size: Z.fs, weight: 700 });
          return AK.chart(pg, cx3 + 16, cy + 16 + Z.lh, cw3 - 32, chh - 32 - Z.lh, { T, Z, labels: m.labels, series: [{ values: m.values, tone: i ? "accent3" : null }], unit: m.unit });
        });
        panes.metrics = { g: pg, charts };
      }
      // permissions: members and roles
      {
        const pg = svg("g", { opacity: 0 }, dv);
        const attachB = AK.button(pg, MX + MW, cy, { label: L.attach, icon: "user-plus", T, Z, align: "right" });
        const ty = cy + Z.ctl + 14;
        AK.box(pg, MX, ty, MW, Math.min(ch - Z.ctl - 14, ((r.roles || []).length + 1) * roleRH + 20), { r: T.radius, fill: tones.card, stroke: tones.hair2 });
        const listG = svg("g", {}, pg), roleRows = [];
        (r.roles || []).forEach((q, i) => {
          const yy = ty + 10 + i * roleRH;
          if (yy + roleRH > BH - pad) return;
          roleRows.push(roleRow(listG, q, yy));
        });
        panes.permissions = { g: pg, attachB, ty, roleRows, listG };
      }
      // logs: a dark log panel; lines appear when the logs are viewed
      {
        const pg = svg("g", { opacity: 0 }, dv), DT = AK.darkTok(), dark = AK.c(DT), on = AK.c(AK.onHex(dark));
        AK.box(pg, MX, cy, MW, ch, { r: T.radius, fill: dark });
        const ms2 = Z.small, lh = AK.lineH(ms2, "mono") + 4, lines = [];
        (r.logs || []).forEach((s0, i) => {
          const yy = cy + 14 + i * lh;
          if (yy + lh > cy + ch - 10) return;
          const fill = /error|fail|denied/i.test(s0) ? AK.mix("neg", "surface", 0.3) : /warn/i.test(s0) ? AK.mix("accent4", "surface", 0.3) : on;
          const lg = svg("g", { opacity: 0 }, pg);
          AK.mono(lg, s0, { x: MX + 22, y: yy, h: lh, size: ms2, fill, w: MW - 44 });
          lines.push(lg);
        });
        panes.logs = { g: pg, lines };
      }
      const D = { g: dv, r, backB, scaleB, tabs, panes, tab: "overview", cy };
      details[r.id] = D;
      return D;
    }
    function roleRow(parent, q, yy) {
      const rg = svg("g", {}, parent);
      if (yy) AK.box(rg, MX + 20, yy, MW - 40, 1, { r: 0, fill: tones.hair });
      AK.avatar(rg, MX + 24 + 18, yy + roleRH / 2, 18, q.member);
      AK.T(rg, q.member || "", { x: MX + 24 + 48, y: yy, w: MW * 0.5 - 80, h: roleRH, size: Z.fs, weight: 600 });
      if (q.role) AK.pill(rg, MX + MW * 0.55, yy + (roleRH - PH) / 2, q.role, { size: Z.small, fill: tones.sel, color: T.accent, weight: 600, h: PH, icon: "key-round" });
      return { g: rg, y: yy, q };
    }
    // states
    const stCover = (gg) => AK.box(gg, SW, topH, BW - SW, BH - topH, { r: 0, fill: tones.page });
    const loadG = svg("g", {}, root); stCover(loadG);
    for (let k = 0; k < 6; k++) AK.box(loadG, MX, y0 + k * (Z.row + 10), MW * (k ? 0.9 - 0.08 * (k % 3) : 0.3), Z.row - 12, { r: 8, fill: tones.track });
    const msg = (gg, icon, tone) => {
      stCover(gg);
      AK.icon(gg, icon, MX + MW / 2, topH + (BH - topH) * 0.38, 60, tone || "muted");
      if (p.notice) AK.P(gg, p.notice, { x: MX + MW * 0.2, y: topH + (BH - topH) * 0.38 + 50, w: MW * 0.6, size: Z.fs, maxLines: 3, color: "muted", align: "center" });
    };
    const emptyG = svg("g", {}, root); msg(emptyG, "server-off");
    const errG = svg("g", {}, root); msg(errG, "cloud-alert", "neg");
    const states = AK.states({ ready: svg("g", {}, root), loading: loadG, empty: emptyG, error: errG }, p.state || "ready");
    // the page showing: the list, or one resource's detail
    let page = "list";
    if (p.open) { const r = res.find((q) => q.id === p.open); if (r) { const D = detail(r); D.g.setAttribute("opacity", 1); listV.setAttribute("opacity", 0); page = r.id; } }

    // ---------------------------------------------------------------- actions
    const at0 = (t) => (t == null ? Math.max(H.free + 0.4, p.at >= 0 ? p.at + 0.6 : 0.4) : t);
    const byId = (id) => res.find((q) => q.id === id);
    const A = {};
    const showPage = (to, t) => {
      const from = page === "list" ? listV : details[page].g, nxt = to === "list" ? listV : details[to].g;
      if (from === nxt) return t;
      AK.hide(from, t, 0.15); AK.show(nxt, t + 0.08, 0.22);
      page = to;
      return t + 0.35;
    };
    A.open = function (id, at) {
      const r = byId(id), t = at0(at);
      if (!r) { Loom.error("component_params", `app_cloud_console.open: no resource "${id}"`); return t; }
      if (page === id) return t;
      if (page !== "list") A.back(t);
      const R = rows.find((q) => q.r.id === id);
      detail(r);
      const tp = R ? H.click({ x: MX + 8, y: R.y + R.shift, w: MW * 0.3, h: RH }, Math.max(t, H.free + 0.3), { fx: 0.5 }) : t;
      return showPage(id, tp + 0.1) + 0.1;
    };
    A.back = function (at) { const t = at0(at); if (page === "list") return t; const tp = H.click(details[page].backB, t); return showPage("list", tp + 0.1); };
    A.tab = function (name, at, id) {
      const t = at0(at), D = details[id || page];
      if (!D || !D.tabs[name] || D.tab === name) return t;
      const tp = H.click(D.tabs[name], t);
      const O = D.tabs[D.tab], N = D.tabs[name];
      AK.hide(O.on, tp + 0.05, 0.12); AK.show(O.off, tp + 0.05, 0.12); AK.show(N.on, tp + 0.05, 0.12); AK.hide(N.off, tp + 0.05, 0.12);
      AK.hide(D.panes[D.tab].g, tp + 0.08, 0.12); AK.show(D.panes[name].g, tp + 0.15, 0.2);
      D.tab = name;
      return tp + 0.4;
    };
    A.create = function (spec, at) {
      spec = spec || {};
      let t = page === "list" ? at0(at) : A.back(at);
      const tp = H.click(createB, t);
      // the create panel slides in from the right
      const PW = Math.round(Math.min(620, MW * 0.48)), PX = BW - PW;
      const pg = svg("g", { opacity: 0 }, B.over), box = svg("g", {}, pg);
      AK.box(box, PX - 8, topH, 8, BH - topH, { r: 0, fill: tones.shadow, opacity: 0.08 });
      AK.box(box, PX, topH, PW, BH - topH, { r: 0, fill: "surface" });
      AK.box(box, PX, topH, 1.5, BH - topH, { r: 0, fill: tones.hair2 });
      if (L.create) AK.T(box, L.create, { role: "label", x: PX + pad * 1.4, y: topH + pad, w: PW - pad * 2.8, h: Z.lhH, size: Z.head, weight: 700 });
      let fy = topH + pad + (L.create ? Z.lhH + pad : 0);
      const fh = AK.boxH(Z.fs, "caption", 400, Z.ctl), labH = Z.lhS + 6, fields = [];
      for (const [k, ic] of [["name", "tag"], ["type", "box"], ["region", "globe"], ["size", "gauge"]]) {
        if (spec[k] == null) continue;
        if (L[k]) AK.T(box, L[k], { x: PX + pad * 1.4, y: fy, w: PW - pad * 2.8, h: labH, size: Z.small, weight: 600, color: "muted" });
        const f = AK.field(box, PX + pad * 1.4, fy + labH, PW - pad * 2.8, fh, { icon: ic, T, Z });
        fields.push([f, spec[k]]);
        fy += labH + fh + 12;
      }
      const saveB = AK.button(box, PX + pad * 1.4, fy + 8, { label: L.save, icon: "check", kind: "primary", T, Z });
      AK.show(pg, tp + 0.1, 0.25);
      Loom.drive((e) => box.setAttribute("transform", `translate(${AK.f1(PW * 0.3 * (1 - e))} 0)`), tp + 0.1, 0.3, "enter", AK.meta("reveal", "app.panel"));
      t = tp + 0.5;
      for (const [f, v] of fields) {
        const tf = H.click(f, t + 0.2, { fx: 0.3 });
        AK.show(f.ring, tf + 0.05, 0.1); AK.hide(f.ring, tf + 0.2 + String(v).length / p.cps + 0.2, 0.1);
        t = AK.type(AK.T(f.g, v, { x: f.tx, y: f.y, w: f.tw, h: f.h, size: Z.fs }), tf + 0.15, { cps: p.cps, size: Z.fs, caret: f.g, color: AK.c(T.accent) });
      }
      const ts = H.click(saveB, t + 0.35);
      AK.hide(pg, ts + 0.15, 0.2);
      // the new resource joins the top of the list, provisioning, then running
      for (const R of rows) { R.shift += RH; AK.shift(R.g, 0, R.shift, ts + 0.25, 0.3); }
      const nr = drawRow({ name: spec.name, type: spec.type, region: spec.region, size: spec.size, status: L.provisioning, tone: "warn", icon: spec.icon }, ry, rowsG);
      nr.g.setAttribute("opacity", 0); AK.show(nr.g, ts + 0.4, 0.25);
      rows.unshift(nr);
      let end = ts + 0.7;
      if (L.running) {
        const sg = svg("g", { opacity: 0 }, nr.g);
        AK.box(sg, colX[3] - 4, ry + 4, colW[3] + 8, RH - 8, { r: 0, fill: tones.card });
        pill(sg, colX[3], ry + (RH - PH) / 2, L.running, "pos");
        AK.hide(nr.stG, ts + 1.6, 0.15); AK.show(sg, ts + 1.65, 0.2);
        end = ts + 1.9;
      }
      return L.created ? H.toast(L.created, end) : end;
    };
    A.scale = function (id, n, at) {
      const r = byId(id);
      let t = A.open(id, at);
      const D = details[id];
      if (!D) return t;
      if (D.tab !== "overview") t = A.tab("overview", t + 0.2);
      const tp = H.click(D.scaleB, t + 0.2);
      // a dialog with a stepper: the count goes up (or down) one press at a time
      const dw = 560, dh = 120 + Z.lhH + Z.ctl * 2, dx = (BW - dw) / 2 + SW / 2, dy = (BH - dh) / 2;
      const dg = svg("g", { opacity: 0 }, B.over);
      AK.box(dg, SW, 0, BW - SW, BH, { r: 0, fill: tones.shadow, opacity: 0.25 });
      AK.box(dg, dx, dy, dw, dh, { r: T.radius + 4, fill: "surface" });
      if (L.scale) AK.T(dg, L.scale, { role: "label", x: dx + 28, y: dy + 22, w: dw - 56, h: Z.lhH, size: Z.head, weight: 700 });
      if (L.instances) AK.T(dg, L.instances, { x: dx + 28, y: dy + 34 + Z.lhH, w: dw - 300, h: Z.ctl, size: Z.fs, color: "muted" });
      const sy = dy + 34 + Z.lhH, sx = dx + dw - 28 - 3 * Z.ctl - 16;
      const minus = AK.button(dg, sx, sy, { icon: "minus", T, Z }), plus = AK.button(dg, sx + 2 * Z.ctl + 16, sy, { icon: "plus", T, Z });
      const from = r.instances == null ? 0 : +r.instances, to = Math.max(0, +n);
      const numG = svg("g", {}, dg);
      const shown = (k) => { const ng = svg("g", { opacity: 0 }, numG); AK.T(ng, String(k), { role: "label", x: sx + Z.ctl + 4, y: sy, w: Z.ctl, h: Z.ctl, size: Z.head, weight: 700, align: "center" }); return ng; };
      let cur = shown(from); cur.setAttribute("opacity", 1);
      const saveB = AK.button(dg, dx + dw - 28, dy + dh - 24 - Z.ctl, { label: L.save, icon: "check", kind: "primary", T, Z, align: "right" });
      AK.show(dg, tp + 0.12, 0.22);
      t = tp + 0.5;
      const btn = to >= from ? plus : minus;
      for (let k = from; k !== to; k += to > from ? 1 : -1) {
        const tk = H.click(btn, t + 0.15, { fx: 0.5 });
        const nx = shown(k + (to > from ? 1 : -1));
        AK.hide(cur, tk + 0.05, 0.08); AK.show(nx, tk + 0.08, 0.1);
        cur = nx; t = tk + 0.25;
      }
      const ts = H.click(saveB, t + 0.3);
      AK.hide(dg, ts + 0.12, 0.2);
      // the overview's instances value and the metric answer
      const iv = D.panes.overview.vals.find((v) => v.k === L.instances);
      if (iv) { const ng = svg("g", { opacity: 0 }, D.panes.overview.g); AK.T(ng, String(to), { x: iv.x, y: iv.y, w: iv.w, h: iv.h, size: Z.fs, weight: 700, color: T.accent }); AK.hide(iv.g, ts + 0.3, 0.12); AK.show(ng, ts + 0.35, 0.2); }
      const m = (r.metrics || [])[0], ch = D.panes.overview.chart;
      if (m && m.after && ch) ch.update(0, m.after, ts + 0.4, 1.0);
      r.instances = to;
      return L.scaled ? H.toast(L.scaled, ts + 0.5) : ts + 0.6;
    };
    A.attachRole = function (id, q, at) {
      q = q || {};
      let t = A.open(id, at);
      const D = details[id];
      if (!D) return t;
      t = A.tab("permissions", t + 0.2);
      const P = D.panes.permissions;
      const tp = H.click(P.attachB, t + 0.2);
      // a new row: the member typed, the role chosen
      const yy = P.ty + 10 + P.roleRows.length * roleRH;
      const fh = AK.boxH(Z.fs, "caption", 400, Z.ctl - 6);
      const fg = svg("g", { opacity: 0 }, P.g);
      const f = AK.field(fg, MX + 24, yy + (roleRH - fh) / 2, MW * 0.45, fh, { icon: "user", T, Z, placeholder: L.member });
      AK.show(fg, tp + 0.1, 0.2);
      const node = AK.T(f.g, q.member || "", { x: f.tx, y: f.y, w: f.tw, h: f.h, size: Z.fs });
      if (f.ph) AK.hide(f.ph, tp + 0.3, 0.1);
      t = AK.type(node, tp + 0.35, { cps: p.cps, size: Z.fs, caret: f.g, color: AK.c(T.accent) });
      const rr = roleRow(P.listG, q, yy);
      rr.g.setAttribute("opacity", 0);
      AK.hide(fg, t + 0.5, 0.15); AK.show(rr.g, t + 0.55, 0.2);
      P.roleRows.push(rr);
      return L.attached ? H.toast(L.attached, t + 0.8) : t + 0.8;
    };
    A.viewLogs = function (id, at) {
      let t = A.open(id, at);
      const D = details[id];
      if (!D) return t;
      t = A.tab("logs", t + 0.2);
      D.panes.logs.lines.forEach((ln, i) => AK.show(ln, t + 0.1 + i * 0.18, 0.08));
      return t + 0.2 + D.panes.logs.lines.length * 0.18;
    };
    // at build, an open resource shows its logs written already
    if (page !== "list") details[page].panes.logs.lines.forEach((ln) => ln.setAttribute("opacity", 1));
    A.setState = function (name, at) { return states.set(name, at0(at)); };
    A.state = A.setState;
    AK.reveal(g, p.at);
    AK.runSteps(A, p.steps, { open: ["id", "at"], back: ["at"], tab: ["name", "at"], create: ["resource", "at"], scale: ["id", "n", "at"], attachRole: ["id", "role", "at"], viewLogs: ["id", "at"], state: ["state", "at"] });
    return Object.assign({ host: H, sidebar: side, topbar: top, table: listV, rows, details, states }, A);
  },
});
