// T-154 app_hris: a generic HR system shell (hand-off sheet, Family M). Built on runtime/components/_app_kit.js.
Loom.component("app_hris", {
  version: 1,
  idea: "An HR system an employee and a manager use: the employee's profile with leave balances, a time off request form with past requests, the team's org chart and a manager's approvals queue, walked through by a pointer that requests leave, approves or declines a request and views the team.",
  outline: ["window (or the screencast engine's app window)", "sidebar: the company, navigation to profile, time off, team and approvals", "profile: avatar, name, title, details, leave balances", "time off: a request form, balances, past requests with status", "team: org chart of manager, the employee and peers, and reports", "approvals: pending requests with approve and decline", "toast", "pointer"],
  family: "ui",
  tags: ["hr system", "hris", "time off", "leave request", "annual leave", "approvals", "org chart", "employee profile", "people management", "onboarding"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-154)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop"],   // a product UI: the styles that show products as screens (D-193)
  params: {
    employee: { type: "obj", content: true },    // {name, title, department, location, fields: [[label, value]]}
    nav: { type: "list" },                       // [{id: "profile"|"timeoff"|"team"|"approvals", label, icon}] (the four views, icons only when omitted)
    balances: { type: "list" },                  // [{label, value, unit}] leave balances (value a number to count down)
    requests: { type: "list" },                  // past requests [{type, dates, days, status, tone: "pos"|"neg"|"warn"}]
    team: { type: "obj" },                       // {manager: {name, title}, peers: [{name, title}], reports: [{name, title}]}
    approvals: { type: "list" },                 // pending requests [{name, type, dates, days}]
    company: { type: "str" },                    // the brand at the top of the sidebar (none when omitted)
    view: { type: "enum", choices: ["profile", "timeoff", "team", "approvals"], default: "profile" },
    title: { type: "str" },
    labels: { type: "obj" },                     // the product's words, each optional: {type, from, to, note, submit, days (the unit after a count), approve, decline, approved,
                                                 // declined, pending, sent, decided}
    state: { type: "enum", choices: ["ready", "loading", "error"], default: "ready" },
    notice: { type: "str" },
    steps: { type: "list", default: [] },        // [{do: "go"|"requestLeave"|"approve"|"decline"|"viewTeam"|"state", at, ...}]
    theme: { type: "obj", default: {} }, layout: { type: "obj", default: {} },   // layout: {sidebarW}
    w: { type: "number", default: 1728 }, h: { type: "number", default: 856 },
    at: { type: "number", default: -1 }, cps: { type: "number", default: 14 },
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["host", "sidebar", "navItems", "views", "profile", "balanceCards", "form", "requestRows", "orgNodes", "approvalRows", "states",
    "go(view, at)", "requestLeave({type, from, to, note, days}, at)", "approve(i, at)", "decline(i, at)", "viewTeam(at)", "setState(name, at)"],
  example: 'ctx.use("app_hris", { company: "Harbour Health", employee: { name: "Lena Fischer", title: "Staff nurse", department: "Ward 7" }, balances: [{ label: "Annual leave", value: 18, unit: "days" }], nav: [{ id: "profile", label: "Me" }, { id: "timeoff", label: "Time off" }], labels: { submit: "Send request", type: "Leave type" }, steps: [{ do: "requestLeave", request: { type: "Annual leave", from: "3 Nov", to: "7 Nov", days: 5 }, at: ctx.cue("request the week off") }] }, { x: 96, y: 78, name: "hr" })',
  size: (p) => ({ w: p.w, h: p.h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, svg = (t, a, q) => Loom.svg(t, a, q);
    const T = AK.theme(p.theme), Z = AK.sizes(T), tones = AK.tones(T), L = p.labels || {}, LY = p.layout || {};
    const H = AK.host(ctx, g, p, { T, Z, title: p.title });
    const B = H.body, BW = B.w, BH = B.h, pad = Z.pad, root = B.g;
    const E = p.employee || {};
    AK.box(root, 0, 0, BW, BH, { r: 0, fill: tones.page });
    const VIEWS = ["profile", "timeoff", "team", "approvals"];
    const NAV_ICON = { profile: "user-round", timeoff: "calendar-days", team: "network", approvals: "list-checks" };
    const toneOf = (t) => ({ pos: "pos", neg: "neg", warn: "accent4", info: T.accent })[t] || "muted";
    const PH = AK.boxH(Z.small, "caption", 600);
    const statusPill = (gg, x, y, str, tn, align) => AK.pill(gg, x, y, str, { size: Z.small, fill: AK.mix("surface", tn, 0.16), color: tn === "muted" ? "ink" : tn, weight: 600, h: PH, align });

    // ---------------------------------------------------------------- sidebar
    const SW = Math.round(LY.sidebarW || AK.clamp(BW * 0.16, 240, 300));
    const side = svg("g", {}, root);
    AK.box(side, 0, 0, SW, BH, { r: 0, fill: tones.side });
    AK.box(side, SW - 1, 0, 1.5, BH, { r: 0, fill: tones.hair2 });
    let y = pad;
    if (p.company) {
      const brand = AK.solid(T.accent);
      AK.box(side, pad, y, 44, 44, { r: 10, fill: brand.fill, stroke: brand.stroke, sw: brand.sw });
      AK.icon(side, "building-2", pad + 22, y + 22, 24, brand.fg);
      // the name steps down from the heading to the UI text when its first word would not fit whole (wide label faces)
      const cw0 = SW - 2 * pad - 56, w0 = String(p.company).split(/\s+/)[0];
      const fits = (role, size) => AK.measure(w0 + "…", role, size, 700) <= cw0;
      const [cr, cs] = fits("label", Z.head) ? ["label", Z.head] : fits("caption", Z.fs) ? ["caption", Z.fs] : ["caption", Z.small];
      AK.T(svg("g", {}, side), p.company, { role: cr, x: pad + 56, y, w: cw0, h: 44, size: cs, weight: 700, whole: true });
      y += 44 + pad;
    }
    const navList = (p.nav && p.nav.length ? p.nav : VIEWS.map((id) => ({ id }))).filter((n) => VIEWS.includes(n.id));
    const rowH = AK.boxH(Z.fs, "caption", 600, Z.row);
    let cur = p.view;
    const navItems = {};
    for (const n of navList) {
      const ng = svg("g", {}, side), x = 10, w = SW - 20;
      const sel = AK.box(ng, x, y, w, rowH, { r: Math.min(T.radius, 10), fill: tones.sel, opacity: n.id === cur ? 1 : 0 });
      const icOff = svg("g", { opacity: n.id === cur ? 0 : 1 }, ng), icOn = svg("g", { opacity: n.id === cur ? 1 : 0 }, ng);
      AK.icon(icOff, n.icon || NAV_ICON[n.id], x + 28, y + rowH / 2, 24, "muted");
      AK.icon(icOn, n.icon || NAV_ICON[n.id], x + 28, y + rowH / 2, 24, T.accent);
      let tOff = null, tOn = null;
      if (n.label) {
        tOff = AK.T(ng, n.label, { x: x + 56, y, w: w - 66, h: rowH, size: Z.fs, weight: 600 });
        tOn = AK.T(ng, n.label, { x: x + 56, y, w: w - 66, h: rowH, size: Z.fs, weight: 600, color: T.accent });
        (n.id === cur ? tOff : tOn).setAttribute("opacity", 0);
      }
      navItems[n.id] = { g: ng, x, y, w, h: rowH, sel, on: [sel, icOn, tOn], off: [icOff, tOff], label: n.label };
      y += rowH + 4;
    }

    // ---------------------------------------------------------------- the views
    const MX = SW, MW = BW - SW, cx = MX + pad * 1.6, cw = MW - pad * 3.2;
    const head = (vg, id) => {
      const lab = (navItems[id] || {}).label;
      if (lab) AK.T(svg("g", {}, vg), lab, { role: "lead", x: cx, y: pad, w: cw, h: Z.lhB, size: Z.big, weight: 700 });
      return pad + (lab ? Z.lhB + pad : 0);
    };
    const views = {};
    // profile
    const profV = svg("g", {}, root);
    let balanceCards = [];
    {
      let yy = head(profV, "profile");
      const hcH = Math.max(132, Math.ceil(18 + Z.lhB + Z.lh + (E.location ? Z.lhS : 0) + 22));   // measured: name, title line, place
      AK.box(profV, cx, yy, cw, hcH, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
      const av = AK.avatar(profV, cx + 30 + 44, yy + hcH / 2, 44, E.name);
      const nx = cx + 30 + av.__r * 2 + 24, nw = cw - (nx - cx) - 24;
      AK.T(profV, E.name || "", { role: "lead", x: nx, y: yy + 18, w: nw, h: Z.lhB, size: Z.big, weight: 700 });
      const sub = [E.title, E.department].filter(Boolean).join(", ");
      if (sub) AK.T(profV, sub, { x: nx, y: yy + 18 + Z.lhB, w: nw, h: Z.lh, size: Z.fs, color: "muted" });
      if (E.location) { AK.icon(profV, "map-pin", nx + 11, yy + 18 + Z.lhB + Z.lh + Z.lhS / 2, 20, "muted"); AK.T(profV, E.location, { x: nx + 28, y: yy + 18 + Z.lhB + Z.lh, w: nw - 28, h: Z.lhS, size: Z.small, color: "muted" }); }
      yy += hcH + pad;
      const fields = (E.fields || []);
      const colW = p.balances && p.balances.length ? cw * 0.56 : cw;
      if (fields.length) {
        const fr = Math.max(Z.row, AK.boxH(Z.fs, "caption", 600));
        const n = Math.min(fields.length, Math.floor((BH - yy - pad - 28) / fr));
        AK.box(profV, cx, yy, colW, n * fr + 20, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
        fields.slice(0, n).forEach(([k, v], i) => {
          const fy = yy + 10 + i * fr;
          if (i) AK.box(profV, cx + 20, fy, colW - 40, 1, { r: 0, fill: tones.hair });
          AK.T(profV, k, { x: cx + 24, y: fy, w: colW * 0.4 - 24, h: fr, size: Z.small, color: "muted" });
          AK.T(profV, v, { x: cx + colW * 0.4, y: fy, w: colW * 0.6 - 24, h: fr, size: Z.fs, weight: 600 });
        });
      }
      if (p.balances && p.balances.length) {
        const bx = fields.length ? cx + colW + pad : cx, bw = fields.length ? cw - colW - pad : cw;
        const list = p.balances.slice(0, fields.length ? 4 : 3);
        list.forEach((b, i) => {
          const vh = AK.lineH(Z.big, "lead", 700), bh = Math.round(18 + Z.lhS + vh + 16);
          const by = fields.length ? yy + i * (bh + 12) : yy, bxx = fields.length ? bx : bx + i * ((bw - 32) / list.length + 16), bww = fields.length ? bw : (bw - 32) / list.length;
          if (by + bh > BH - 8) return;
          const bg = svg("g", {}, profV);
          AK.box(bg, bxx, by, bww, bh, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
          AK.T(bg, b.label || "", { x: bxx + 18, y: by + 12, w: bww - 36, h: Z.lhS, size: Z.small, color: "muted" });
          const val = [b.value, b.unit].filter((q) => q != null && q !== "").join(" ");
          AK.T(bg, val, { role: "lead", x: bxx + 18, y: by + 12 + Z.lhS + 4, w: bww - 36, h: vh, size: Z.big, weight: 700 });
        });
      }
    }
    views.profile = profV;
    // time off: the form on the left, balances and past requests on the right
    const toV = svg("g", {}, root);
    const form = { fields: {} };
    const requestRows = [];
    let reqTop = 0, reqX = 0, reqW = 0, reqRowH = 0, reqList = null;
    {
      const y0 = head(toV, "timeoff");
      const fw = Math.round(cw * 0.46), fx = cx;
      const fieldH = AK.boxH(Z.fs, "caption", 400, Z.ctl);
      const labH = Z.lhS + 6;
      const keys = [["type", "tag"], ["from", "calendar"], ["to", "calendar"], ["note", "message-square"]];
      const fh = 24 + keys.length * (labH + fieldH + 14) + Z.ctl + 24;
      AK.box(toV, fx, y0, fw, Math.min(fh, BH - y0 - 8), { r: T.radius, fill: tones.card, stroke: tones.hair2 });
      let fy = y0 + 20;
      for (const [k, ic] of keys) {
        if (L[k]) AK.T(toV, L[k], { x: fx + 24, y: fy, w: fw - 48, h: labH, size: Z.small, weight: 600, color: "muted" });
        const f = AK.field(toV, fx + 24, fy + labH, fw - 48, fieldH, { icon: ic, T, Z });
        form.fields[k] = f;
        fy += labH + fieldH + 14;
      }
      form.submit = AK.button(toV, fx + 24, fy + 4, { label: L.submit, icon: "send", kind: "primary", T, Z });
      // the right column
      const rx = fx + fw + pad * 1.5, rw = cw - fw - pad * 1.5;
      let ry = y0;
      const list = (p.balances || []).slice(0, 2);
      if (list.length) {
        const gap = 14, bw = (rw - gap * (list.length - 1)) / list.length, vh = AK.lineH(Z.big, "lead", 700), bh = Math.round(18 + Z.lhS + vh + 16);
        list.forEach((b, i) => {
          const bx = rx + i * (bw + gap), bg = svg("g", {}, toV);
          AK.box(bg, bx, ry, bw, bh, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
          AK.T(bg, b.label || "", { x: bx + 18, y: ry + 12, w: bw - 36, h: Z.lhS, size: Z.small, color: "muted" });
          const vg = svg("g", {}, bg);
          const val = (v) => [v, b.unit].filter((q) => q != null && q !== "").join(" ");
          AK.T(vg, val(b.value), { role: "lead", x: bx + 18, y: ry + 12 + Z.lhS + 4, w: bw - 36, h: vh, size: Z.big, weight: 700 });
          balanceCards.push({ g: bg, vg, b, x: bx + 18, y: ry + 12 + Z.lhS + 4, w: bw - 36, h: vh, val });
        });
        ry += bh + pad;
      }
      reqRowH = AK.boxH(Z.fs, "caption", 600, Math.round(Z.lh + Z.lhS + 20));
      reqTop = ry; reqX = rx; reqW = rw;
      reqList = svg("g", {}, toV);
      const clipId = Loom.uid ? Loom.uid("hrclip") : "hrclip";
      const cp = svg("clipPath", { id: clipId }, toV); svg("rect", { x: rx, y: ry, width: rw, height: BH - ry - 8 }, cp);
      reqList.setAttribute("clip-path", `url(#${clipId})`);
      (p.requests || []).forEach((r0, i) => {
        const yy = ry + i * (reqRowH + 8);
        if (yy + reqRowH > BH - 8) return;
        requestRows.push(drawReq(reqList, r0, yy));
      });
    }
    function drawReq(parent, r0, yy) {
      const rg = svg("g", {}, parent), inner = svg("g", {}, rg);
      AK.box(inner, reqX, yy, reqW, reqRowH, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
      const tn = toneOf(r0.tone);
      let pw = 0, pill = null;
      if (r0.status) { pill = statusPill(inner, reqX + reqW - 16, yy + (reqRowH - PH) / 2, r0.status, tn, "right"); pw = pill.w + 16; }
      AK.T(inner, r0.type || "", { x: reqX + 18, y: yy + 8, w: reqW - 36 - pw, h: Z.lh, size: Z.fs, weight: 600 });
      const sub = [r0.dates, r0.days != null && L.days ? `${r0.days} ${L.days}` : null].filter(Boolean).join(", ");
      if (sub) AK.T(inner, sub, { x: reqX + 18, y: yy + 8 + Z.lh, w: reqW - 36 - pw, h: Z.lhS, size: Z.small, color: "muted" });
      return { g: rg, inner, y: yy, r: r0, pill, shift: 0 };
    }
    views.timeoff = toV;
    // team: an org chart
    const teamV = svg("g", {}, root);
    const orgNodes = [];
    {
      const y0 = head(teamV, "team"), tm = p.team || {};
      const nw = Math.min(330, (cw - 40) / 4), nh = Math.round(Z.lh + Z.lhS + 34);
      const node = (q, x, yy, me) => {
        const ng = svg("g", {}, teamV);
        AK.box(ng, x, yy, nw, nh, { r: T.radius, fill: me ? tones.sel : tones.card, stroke: me ? T.accent : tones.hair2, sw: me ? 2.5 : 1.5 });
        const av = AK.avatar(ng, x + 18 + 22, yy + nh / 2, 22, q.name);
        const tx = x + 18 + av.__r * 2 + 12;
        AK.T(ng, q.name || "", { x: tx, y: yy + 12, w: nw - (tx - x) - 14, h: Z.lh, size: Z.fs, weight: 700 });
        if (q.title) AK.T(ng, q.title, { x: tx, y: yy + 12 + Z.lh, w: nw - (tx - x) - 14, h: Z.lhS, size: Z.small, color: "muted" });
        const N = { g: ng, x, y: yy, w: nw, h: nh, q, me };
        orgNodes.push(N);
        return N;
      };
      const lines = svg("g", {}, teamV);
      const link = (a, b) => {
        const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, my = (y1 + y2) / 2;
        svg("path", { d: `M${AK.f1(x1)} ${AK.f1(y1)} V${AK.f1(my)} H${AK.f1(x2)} V${AK.f1(y2)}`, fill: "none", stroke: tones.hair2, "stroke-width": 2 }, lines);
      };
      const gapY = Math.max(56, Math.min(90, (BH - y0 - 3 * nh - pad) / 2.2));
      const rowAt = (k) => y0 + 10 + k * (nh + gapY);
      const centreRow = (list, yy) => {
        const n = list.length, gap = 24, tot = n * nw + (n - 1) * gap;
        let x = cx + (cw - tot) / 2;
        return list.map((q) => { const N = node(q, x, yy, q === E || q.me); x += nw + gap; return N; });
      };
      const mgr = tm.manager ? centreRow([tm.manager], rowAt(0))[0] : null;
      const peers = (tm.peers || []).slice(0, 3);
      const row1 = centreRow([Object.assign({ me: true }, { name: E.name, title: E.title })].concat(peers).slice(0, Math.max(1, Math.floor((cw + 24) / (nw + 24)))), rowAt(mgr ? 1 : 0));
      const meN = row1[0];
      if (mgr) row1.forEach((N) => link(mgr, N));
      const reps = (tm.reports || []).slice(0, Math.max(0, Math.floor((cw + 24) / (nw + 24))));
      if (reps.length && rowAt(mgr ? 2 : 1) + nh <= BH - 6) centreRow(reps, rowAt(mgr ? 2 : 1)).forEach((N) => link(meN, N));
      teamV.insertBefore(lines, teamV.firstChild);
      orgNodes.me = meN;
    }
    views.team = teamV;
    // approvals
    const apV = svg("g", {}, root);
    const approvalRows = [];
    {
      const y0 = head(apV, "approvals"), rh = AK.boxH(Z.fs, "caption", 600, Math.round(Z.lh + Z.lhS + 24));
      (p.approvals || []).forEach((a, i) => {
        const yy = y0 + i * (rh + 10);
        if (yy + rh > BH - 8) return;
        const rg = svg("g", {}, apV);
        AK.box(rg, cx, yy, cw, rh, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
        const av = AK.avatar(rg, cx + 20 + 22, yy + rh / 2, 22, a.name);
        const tx = cx + 20 + av.__r * 2 + 14;
        const btnG = svg("g", {}, rg);
        const ok = AK.button(btnG, cx + cw - 18, yy + (rh - Z.ctl) / 2, { label: L.approve, icon: "check", kind: "primary", T, Z, align: "right" });
        const no = AK.button(btnG, ok.x - 10, yy + (rh - Z.ctl) / 2, { label: L.decline, icon: "x", T, Z, align: "right" });
        const tw = no.x - tx - 20;
        AK.T(rg, a.name || "", { x: tx, y: yy + 10, w: tw * 0.45, h: Z.lh, size: Z.fs, weight: 700 });
        if (a.type) AK.T(rg, a.type, { x: tx, y: yy + 10 + Z.lh, w: tw * 0.45, h: Z.lhS, size: Z.small, color: "muted" });
        const meta = [a.dates, a.days != null && L.days ? `${a.days} ${L.days}` : null].filter(Boolean).join(", ");
        if (meta) AK.T(rg, meta, { x: tx + tw * 0.5, y: yy, w: tw * 0.5, h: rh, size: Z.fs });
        const decided = {};
        for (const [k, lab, tn, ic] of [["approved", L.approved, "pos", "circle-check"], ["declined", L.declined, "neg", "circle-x"]]) {
          const dg = svg("g", { opacity: 0 }, rg);
          AK.box(dg, no.x - 4, yy + 4, cx + cw - no.x - 10, rh - 8, { r: T.radius, fill: tones.card });
          const pl = AK.pill(dg, cx + cw - 18, yy + (rh - PH) / 2, lab || "", { size: Z.small, icon: ic, fill: AK.mix("surface", tn, 0.16), color: tn, weight: 600, h: PH, align: "right" });
          void pl;
          decided[k] = dg;
        }
        approvalRows.push({ g: rg, y: yy, h: rh, a, ok, no, btnG, decided });
      });
      if (!approvalRows.length) { AK.icon(apV, "inbox", cx + cw / 2, y0 + 120, 56, "muted"); }
    }
    views.approvals = apV;
    const viewState = AK.states(views, cur);
    // states
    const loadG = svg("g", {}, root);
    AK.box(loadG, MX, 0, MW, BH, { r: 0, fill: tones.page });
    for (let k = 0; k < 5; k++) AK.box(loadG, cx, pad + k * (Z.row + 14), cw * (k ? 0.8 - 0.1 * (k % 3) : 0.35), Z.row - 14, { r: 8, fill: tones.track });
    const errG = svg("g", {}, root);
    {
      AK.box(errG, MX, 0, MW, BH, { r: 0, fill: tones.page });
      const bw = Math.min(cw, 900), bh = p.notice ? AK.paraH(p.notice, { size: Z.fs, w: bw - 90, maxLines: 3 }) + 28 : Z.row;
      AK.box(errG, cx, pad * 2, bw, bh, { r: T.radius, fill: tones.negWash, stroke: "neg" });
      AK.icon(errG, "circle-alert", cx + 34, pad * 2 + bh / 2, 26, "neg");
      if (p.notice) AK.P(errG, p.notice, { x: cx + 64, y: pad * 2 + 14, w: bw - 90, size: Z.fs, maxLines: 3 });
    }
    const states = AK.states({ ready: svg("g", {}, root), loading: loadG, error: errG }, p.state || "ready");

    // ---------------------------------------------------------------- actions
    const at0 = (t) => (t == null ? Math.max(H.free + 0.4, p.at >= 0 ? p.at + 0.6 : 0.4) : t);
    const A = {};
    A.go = function (view, at) {
      const t0 = at0(at);
      if (view === cur) return t0;
      const N = navItems[view];
      const tp = N ? H.click(N, t0) : t0;
      const O = navItems[cur];
      if (O) { O.on.forEach((n) => n && AK.hide(n, tp + 0.05, 0.15)); O.off.forEach((n) => n && AK.show(n, tp + 0.05, 0.15)); }
      if (N) { N.on.forEach((n) => n && AK.show(n, tp + 0.05, 0.15)); N.off.forEach((n) => n && AK.hide(n, tp + 0.05, 0.15)); }
      viewState.set(view, tp + 0.1);
      cur = view;
      return tp + 0.45;
    };
    A.requestLeave = function (rq, at) {
      rq = rq || {};
      let t = A.go("timeoff", at0(at));
      for (const k of ["type", "from", "to", "note"]) {
        if (!rq[k] || !form.fields[k]) continue;
        const f = form.fields[k];
        const tp = H.click(f, t + 0.25, { fx: 0.3 });
        AK.show(f.ring, tp + 0.05, 0.12); AK.hide(f.ring, tp + 0.15 + String(rq[k]).length / p.cps + 0.3, 0.12);
        const node = AK.T(f.g, rq[k], { x: f.tx, y: f.y, w: f.tw, h: f.h, size: Z.fs });
        t = AK.type(node, tp + 0.15, { cps: p.cps, size: Z.fs, caret: f.g, color: AK.c(T.accent) });
      }
      const ts = H.click(form.submit, t + 0.4);
      // the new request lands at the top of the list; the others move down
      const dh = reqRowH + 8;
      for (const R of requestRows) { R.shift += dh; AK.shift(R.g, 0, R.shift, ts + 0.15, 0.3); }
      const nr = drawReq(reqList, { type: rq.type, dates: [rq.from, rq.to].filter(Boolean).join(" - "), days: rq.days, status: L.pending, tone: "warn" }, reqTop);
      nr.g.setAttribute("opacity", 0); AK.show(nr.g, ts + 0.3, 0.25);
      requestRows.unshift(nr);
      // the balance counts down by the days asked
      const BC = balanceCards[0];
      if (BC && typeof BC.b.value === "number" && typeof rq.days === "number") {
        const from = BC.b.value, to = from - rq.days, vg2 = svg("g", { opacity: 0 }, BC.g);
        const node = AK.T(vg2, BC.val(to), { role: "lead", x: BC.x, y: BC.y, w: BC.w, h: BC.h, size: Z.big, weight: 700, color: "accent4" });
        void node;
        AK.hide(BC.vg, ts + 0.45, 0.15); AK.show(vg2, ts + 0.5, 0.2);
        BC.vg = vg2; BC.b = Object.assign({}, BC.b, { value: to });
      }
      return L.sent ? H.toast(L.sent, ts + 0.6) : ts + 0.6;
    };
    function decide(i, how, at) {
      let t = A.go("approvals", at0(at));
      const R = approvalRows[i];
      if (!R) { Loom.error("component_params", `app_hris.${how === "approved" ? "approve" : "decline"}: no pending request ${i}`); return t; }
      const btn = how === "approved" ? R.ok : R.no;
      const tp = H.click(btn, t + 0.3);
      AK.hide(R.btnG, tp + 0.12, 0.12);
      AK.show(R.decided[how], tp + 0.15, 0.2);
      const msg = L.decided;
      return msg ? H.toast(msg, tp + 0.45, { tone: how === "approved" ? "pos" : "neg" }) : tp + 0.45;
    }
    A.approve = (i, at) => decide(i, "approved", at);
    A.decline = (i, at) => decide(i, "declined", at);
    A.viewTeam = function (at) {
      const t = A.go("team", at0(at)), me = orgNodes.me;
      if (me) Loom.drive((e, raw) => me.g.setAttribute("transform", `translate(${AK.f1(me.x + me.w / 2)} ${AK.f1(me.y + me.h / 2)}) scale(${(1 + 0.04 * Math.sin(Math.PI * raw)).toFixed(3)}) translate(${AK.f1(-(me.x + me.w / 2))} ${AK.f1(-(me.y + me.h / 2))})`), t + 0.1, 0.5, "linear", AK.meta("gesture", "app.me"));
      return t + 0.6;
    };
    A.setState = function (name, at) { return states.set(name, at0(at)); };
    A.state = A.setState;
    AK.reveal(g, p.at);
    AK.runSteps(A, p.steps, { go: ["view", "at"], requestLeave: ["request", "at"], approve: ["i", "at"], decline: ["i", "at"], viewTeam: ["at"], state: ["state", "at"] });
    return Object.assign({ host: H, sidebar: side, navItems, views, profile: profV, balanceCards, form, requestRows, orgNodes, approvalRows, states }, A);
  },
});
