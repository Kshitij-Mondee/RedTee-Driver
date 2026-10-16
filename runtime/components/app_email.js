// T-149 app_email: a generic email client shell (hand-off sheet, Family M). Built on runtime/components/_app_kit.js.
Loom.component("app_email", {
  version: 1,
  idea: "An email client at work: folders, a thread list with unread and flagged mail, the open message in a reading pane, and a compose window, walked through by a pointer that opens, replies, flags, moves and searches.",
  outline: ["window (or the screencast engine's app window)", "folder sidebar with a compose button and counts", "thread list with a search field: unread dot, sender, time, subject, preview, flag and attachment marks", "reading pane: toolbar, subject, sender, recipients, body, attachment", "compose window and reply box (opened by actions)", "toast", "pointer"],
  family: "ui",
  tags: ["email", "mail client", "inbox", "phishing", "reply", "compose", "screencast", "software training", "outlook-like", "communication"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-149)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop"],   // a product UI: the styles that show products as screens (D-193)
  params: {
    folders: { type: "list", content: true },    // [{id, label, icon, count}] in sidebar order
    messages: { type: "list", content: true },   // [{id, from, address, to, time, subject, preview, body: [paragraphs] | str, unread, flagged, attach: {name, size}}]
    folder: { type: "str" },                     // the active folder id (the first when omitted)
    open: { type: "str" },                       // the id of the message open in the reading pane (none when omitted)
    title: { type: "str" },                      // the window title (none when omitted)
    user: { type: "str" },                       // the signed-in person's name (an avatar with initials at the sidebar foot)
    labels: { type: "obj" },                     // the product's own words for its chrome, each optional (icons alone when absent):
                                                 // {compose, search, reply, forward, send, sent, to, subject, empty, error, noResults, moved}
    state: { type: "enum", choices: ["ready", "loading", "empty", "error"], default: "ready" },
    steps: { type: "list", default: [] },        // a scripted walkthrough: [{do: "open"|"reply"|"flag"|"move"|"search"|"compose"|"state", at, ...}]
    theme: { type: "obj", default: {} },         // {accent, sidebar, page, card (tokens), radius, density, text}
    layout: { type: "obj", default: {} },        // {sidebarW, listW}
    w: { type: "number", default: 1728 }, h: { type: "number", default: 856 },
    at: { type: "number", default: -1 },         // when the shell appears; -1 = drawn complete and still
    cps: { type: "number", default: 14 },        // typing speed, characters a second (the screencast pace)
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["host", "sidebar", "folders", "list", "rows", "searchBox", "pane", "panes", "toolbar", "replyBox", "composeWindow", "states",
    "open(i, at)", "reply(text, at, {send})", "flag(i, at)", "move(i, folderId, at)", "search(query, at)", "compose({to, subject, body, send}, at)", "setState(name, at)"],
  example: 'ctx.use("app_email", { title: "Mail", folders: [{ id: "in", label: "Inbox", icon: "inbox", count: 3 }, { id: "fin", label: "Finance", icon: "folder" }], messages: [{ id: "m1", from: "Payroll Team", time: "09:12", subject: "Your payslip is ready", preview: "Sign in to view your March payslip", unread: true }], labels: { search: "Search mail", reply: "Reply" }, steps: [{ do: "open", i: 0, at: ctx.cue("open the message") }] }, { x: 96, y: 78, name: "mail" })',
  size: (p) => ({ w: p.w, h: p.h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, svg = (t, a, q) => Loom.svg(t, a, q);
    const T = AK.theme(p.theme), Z = AK.sizes(T), tones = AK.tones(T), L = p.labels || {}, LY = p.layout || {};
    const H = AK.host(ctx, g, p, { T, Z, title: p.title });
    const B = H.body, BW = B.w, BH = B.h, pad = Z.pad;
    const msgs = p.messages.map((m, i) => Object.assign({ id: m.id || "m" + i }, m));
    const idx = (k) => (typeof k === "number" ? k : msgs.findIndex((m) => m.id === k));
    const fIdx = (k) => (typeof k === "number" ? k : p.folders.findIndex((f) => f.id === k));
    const root = B.g;
    AK.box(root, 0, 0, BW, BH, { r: 0, fill: tones.page });

    // ---------------------------------------------------------------- sidebar: compose, folders, the person
    const SW = Math.round(LY.sidebarW || AK.clamp(BW * 0.17, 240, 330));
    const side = svg("g", { class: "app-sidebar" }, root);
    AK.box(side, 0, 0, SW, BH, { r: 0, fill: tones.side });
    AK.box(side, SW - 1, 0, 1.5, BH, { r: 0, fill: tones.hair2 });
    const cb = AK.button(side, pad, pad, { label: L.compose, icon: "pen-line", kind: "primary", T, Z, h: Z.ctl });
    const folderTop = pad + Z.ctl + pad;
    const activeF = p.folder ? fIdx(p.folder) : 0;
    const PH = AK.boxH(Z.small, "caption", 600);
    const folders = p.folders.map((f, i) => {
      const y = folderTop + i * (Z.row + 4), x = 10, w = SW - 20, h = Z.row;
      const fg = svg("g", {}, side);
      const sel = AK.box(fg, x, y, w, h, { r: Math.min(T.radius, 10), fill: tones.sel, opacity: i === activeF ? 1 : 0 });
      const flash = AK.box(fg, x, y, w, h, { r: Math.min(T.radius, 10), fill: tones.wash, opacity: 0 });
      AK.icon(fg, f.icon || "folder", x + 28, y + h / 2, 24, i === activeF ? T.accent : "muted");
      let cw = 0, countNodes = [];
      const countW = (n) => Math.ceil(AK.measure(String(n), "caption", Z.small, 600) + 24);
      if (f.count != null) {
        cw = Math.max(countW(f.count), countW(Number(f.count) + 1));
        const cg = svg("g", {}, fg);
        countNodes.push(AK.pill(cg, x + w - 10, y + (h - PH) / 2, String(f.count), { size: Z.small, fill: tones.track, weight: 600, align: "right", h: PH }).g);
      }
      AK.T(fg, f.label, { x: x + 56, y, w: w - 66 - (cw ? cw + 10 : 0), h, size: Z.fs, weight: 600, color: i === activeF ? T.accent : "ink" });
      return { g: fg, x, y, w, h, sel, flash, f, count: f.count, countNodes, countW: cw };
    });
    if (p.user) {
      const uy = BH - Z.row - pad / 2;
      AK.box(side, 0, uy - pad / 2, SW, 1.5, { r: 0, fill: tones.hair });
      AK.avatar(side, pad + 22, uy + Z.row / 2, 22, p.user);
      AK.T(side, p.user, { x: pad + 56, y: uy, w: SW - pad - 66, h: Z.row, size: Z.fs, weight: 600 });
    }

    // ---------------------------------------------------------------- the list: search, heading, rows
    const LX = SW, LW = Math.round(LY.listW || AK.clamp(BW * 0.33, 400, 640));
    const list = svg("g", { class: "app-list" }, root);
    AK.box(list, LX, 0, LW, BH, { r: 0, fill: tones.card });
    AK.box(list, LX + LW - 1, 0, 1.5, BH, { r: 0, fill: tones.hair2 });
    const sH = Z.ctl, sY = pad, sX = LX + pad, sW = LW - 2 * pad;
    const sf = AK.field(list, sX, sY, sW, sH, { placeholder: L.search, icon: "search", T, Z });
    const headY = sY + sH + pad * 0.6;
    const headH = Z.lhH + 6;
    const folderName = p.folders[activeF] ? p.folders[activeF].label : "";
    if (folderName) AK.T(list, folderName, { role: "label", x: LX + pad, y: headY, w: LW - 2 * pad, h: headH, size: Z.head, weight: 700 });
    const listTop = headY + headH + 6;
    AK.box(list, LX, listTop - 1, LW, 1.5, { r: 0, fill: tones.hair });
    const RH = Math.round(2 * pad * 0.75 + Z.lh * 2 + Z.lhS + 4);
    const fitRows = Math.max(1, Math.floor((BH - listTop) / RH));
    const listG = svg("g", {}, list), rowsG = svg("g", {}, listG);
    const tx0 = LX + 38, txW = LW - 38 - pad;
    const rows = msgs.slice(0, fitRows).map((m, i) => {
      const y = listTop + i * RH, rg = svg("g", {}, rowsG), body = svg("g", {}, rg);
      AK.box(body, LX, y, LW, RH, { r: 0, fill: tones.card });
      const sel = AK.box(body, LX + 4, y + 4, LW - 8, RH - 8, { r: Math.min(T.radius, 10), fill: tones.sel, opacity: 0 });
      const bar = AK.box(body, LX, y + 10, 4, RH - 20, { r: 2, fill: T.accent, opacity: 0 });
      AK.box(body, LX + pad, y + RH - 1, LW - 2 * pad, 1, { r: 0, fill: tones.hair });
      const dot = svg("circle", { cx: LX + 20, cy: y + pad * 0.75 + Z.lh / 2, r: 6, fill: AK.c(T.accent), opacity: m.unread ? 1 : 0 }, body);
      const ty = y + pad * 0.75;
      const timeW = m.time ? Math.ceil(AK.measure(m.time, "caption", Z.small) + 4) : 0;
      if (m.time) AK.T(body, m.time, { x: LX + LW - pad - timeW, y: ty, w: timeW, h: Z.lh, size: Z.small, color: "muted", align: "right" });
      const fromW = txW - timeW - 12;
      const fromB = AK.T(body, m.from, { x: tx0, y: ty, w: fromW, h: Z.lh, size: Z.fs, weight: 700 });
      const fromR = AK.T(body, m.from, { x: tx0, y: ty, w: fromW, h: Z.lh, size: Z.fs, weight: 400 });
      const marks = (m.attach ? 34 : 0) + 34;
      const subB = AK.T(body, m.subject || "", { x: tx0, y: ty + Z.lh, w: txW - marks, h: Z.lh, size: Z.fs, weight: 600 });
      const subR = AK.T(body, m.subject || "", { x: tx0, y: ty + Z.lh, w: txW - marks, h: Z.lh, size: Z.fs, weight: 400 });
      (m.unread ? fromR : fromB).setAttribute("opacity", 0);
      (m.unread ? subR : subB).setAttribute("opacity", 0);
      if (m.preview) AK.T(body, m.preview, { x: tx0, y: ty + 2 * Z.lh, w: txW, h: Z.lhS, size: Z.small, color: "muted" });
      const flagG = svg("g", { opacity: m.flagged ? 1 : 0 }, body);
      AK.icon(flagG, "flag", LX + LW - pad - 14, ty + Z.lh * 1.5, 22, "neg");
      if (m.attach) AK.icon(body, "paperclip", LX + LW - pad - 48, ty + Z.lh * 1.5, 22, "muted");
      return { g: rg, body, y, h: RH, m, sel, bar, dot, fromB, fromR, subB, subR, flagG, unread: !!m.unread, flagged: !!m.flagged, slot: i, gone: false };
    });
    const more = msgs.length - rows.length;
    // the list's other states: loading (skeleton rows), empty, error, no results
    const skel = svg("g", {}, list);
    for (let i = 0; i < fitRows; i++) {
      const y = listTop + i * RH + pad * 0.75;
      AK.box(skel, tx0, y + 4, txW * 0.45, Z.lh - 10, { r: 6, fill: tones.track });
      AK.box(skel, tx0, y + Z.lh + 4, txW * 0.8, Z.lh - 10, { r: 6, fill: tones.track, opacity: 0.8 });
      AK.box(skel, tx0, y + 2 * Z.lh + 2, txW * 0.65, Z.lhS - 10, { r: 6, fill: tones.track, opacity: 0.6 });
    }
    const centreMsg = (gg, icon, str, tone) => {
      const cy = listTop + (BH - listTop) * 0.36;
      AK.icon(gg, icon, LX + LW / 2, cy, 56, tone || "muted");
      if (str) AK.P(gg, str, { x: LX + pad * 2, y: cy + 48, w: LW - pad * 4, size: Z.fs, maxLines: 3, color: "muted" });
    };
    const emptyG = svg("g", {}, list); centreMsg(emptyG, "inbox", L.empty);
    const errG = svg("g", {}, list);
    {
      const bh = L.error ? AK.paraH(L.error, { size: Z.fs, w: LW - 2 * pad - 80, maxLines: 3 }) + 28 : Z.row;
      AK.box(errG, LX + pad, listTop + pad, LW - 2 * pad, bh, { r: T.radius, fill: tones.negWash, stroke: "neg", sw: 1.5 });
      AK.icon(errG, "circle-alert", LX + pad + 32, listTop + pad + bh / 2, 26, "neg");
      if (L.error) AK.P(errG, L.error, { x: LX + pad + 60, y: listTop + pad + 14, w: LW - 2 * pad - 80, size: Z.fs, maxLines: 3 });
    }
    const noRes = svg("g", { opacity: 0 }, list); centreMsg(noRes, "search-x", L.noResults);
    const states = AK.states({ ready: listG, loading: skel, empty: emptyG, error: errG }, p.state || "ready");

    // ---------------------------------------------------------------- the reading pane
    const PX = LX + LW, PW = BW - PX;
    const pane = svg("g", { class: "app-pane" }, root);
    AK.box(pane, PX, 0, PW, BH, { r: 0, fill: tones.card });
    const tbH = Z.ctl + 2 * pad * 0.6;
    const tb = svg("g", {}, pane);
    let bx = PX + pad;
    const replyB = AK.button(tb, bx, (tbH - Z.ctl) / 2, { label: L.reply, icon: "reply", T, Z }); bx += replyB.w + 10;
    const fwdB = AK.button(tb, bx, (tbH - Z.ctl) / 2, { label: L.forward, icon: "forward", T, Z }); bx += fwdB.w + 10;
    const archB = AK.button(tb, PX + PW - pad, (tbH - Z.ctl) / 2, { icon: "archive", T, Z, align: "right" });
    const flagB = AK.button(tb, archB.x - 10, (tbH - Z.ctl) / 2, { icon: "flag", T, Z, align: "right" });
    AK.box(pane, PX, tbH, PW, 1.5, { r: 0, fill: tones.hair });
    const cX = PX + pad * 1.6, cW = PW - pad * 3.2, cTop = tbH + pad;
    const nothing = svg("g", {}, pane);
    AK.icon(nothing, "mail-open", PX + PW / 2, tbH + (BH - tbH) * 0.42, 72, "muted");
    const panes = msgs.map((m) => {
      const pg = svg("g", { opacity: 0 }, pane);
      let y = cTop;
      const subj = AK.P(pg, m.subject || "", { role: "label", x: cX, y, w: cW, size: Z.head, maxLines: 2, weight: 700 });
      y += subj.__h + pad * 0.8;
      AK.avatar(pg, cX + 26, y + 26, 26, m.from);
      const timeW = m.time ? Math.ceil(AK.measure(m.time, "caption", Z.small) + 4) : 0;
      if (m.time) AK.T(pg, m.time, { x: cX + cW - timeW, y, w: timeW, h: Z.lh, size: Z.small, color: "muted", align: "right" });
      AK.T(pg, m.from, { x: cX + 66, y, w: cW - 66 - timeW - 12, h: Z.lh, size: Z.fs, weight: 700 });
      let ly = y + Z.lh;
      if (m.address) { AK.T(pg, m.address, { x: cX + 66, y: ly, w: cW - 66, h: Z.lhS, size: Z.small, color: "muted" }); ly += Z.lhS; }
      if (m.to) { AK.T(pg, m.to, { x: cX + 66, y: ly, w: cW - 66, h: Z.lhS, size: Z.small, color: "muted" }); ly += Z.lhS; }
      y = Math.max(y + 56, ly) + pad;
      AK.box(pg, cX, y, cW, 1.5, { r: 0, fill: tones.hair });
      y += pad;
      const attH = m.attach ? Z.row + 12 : 0;
      const bottom = BH - pad - attH;
      const paras = Array.isArray(m.body) ? m.body : m.body ? [m.body] : m.preview ? [m.preview] : [];
      for (const para of paras) {
        const room = Math.floor((bottom - y) / (Z.fs * 1.36));
        if (room < 1) break;
        const t = AK.P(pg, para, { x: cX, y, w: Math.min(cW, 980), size: Z.fs, maxLines: Math.min(room, 8) });
        y += t.__h + pad * 0.7;
      }
      if (m.attach) {
        const ag = svg("g", {}, pg), aw = Math.min(cW, 460), ay = BH - pad - Z.row;
        AK.box(ag, cX, ay, aw, Z.row, { r: T.radius, fill: tones.page, stroke: tones.hair2 });
        AK.icon(ag, "file-text", cX + 32, ay + Z.row / 2, 26, T.accent);
        const szW = m.attach.size ? Math.ceil(AK.measure(m.attach.size, "caption", Z.small) + 4) : 0;
        AK.T(ag, m.attach.name || "", { x: cX + 60, y: ay, w: aw - 80 - szW - 10, h: Z.row, size: Z.fs, weight: 600 });
        if (m.attach.size) AK.T(ag, m.attach.size, { x: cX + aw - 16 - szW, y: ay, w: szW, h: Z.row, size: Z.small, color: "muted", align: "right" });
      }
      return pg;
    });
    let openI = p.open != null ? idx(p.open) : -1;
    if (openI >= 0 && panes[openI]) { panes[openI].setAttribute("opacity", 1); nothing.setAttribute("opacity", 0); }
    if (openI >= 0 && rows[openI]) { rows[openI].sel.setAttribute("opacity", 1); rows[openI].bar.setAttribute("opacity", 1); }

    // ---------------------------------------------------------------- the reply box and the compose window (closed)
    const over = B.over;
    const replyG = svg("g", { opacity: 0 }, over);
    const rbH = Math.round(Z.lh * 4 + Z.ctl + pad * 3), rbY = BH - rbH - pad, rbX = PX + pad, rbW = PW - 2 * pad;
    AK.box(replyG, rbX, rbY + 6, rbW, rbH, { r: T.radius + 2, fill: tones.shadow, opacity: 0.1 });
    AK.box(replyG, rbX, rbY, rbW, rbH, { r: T.radius + 2, fill: "surface", stroke: T.accent, sw: 2 });
    const rText = svg("g", {}, replyG);
    const rSend = AK.button(replyG, rbX + rbW - pad, rbY + rbH - pad - Z.ctl, { label: L.send, icon: "send", kind: "primary", T, Z, align: "right" });
    const cmpW = Math.round(Math.min(780, BW * 0.45)), cmpX = BW - cmpW - pad * 1.5;
    const cmpBarH = Z.lh + 24, cmpRow = Z.ctl + 8;
    const cmpH = Math.round(cmpBarH + 2 * cmpRow + Z.lh * 5 + Z.ctl + pad * 3), cmpY = BH - cmpH;
    const compG = svg("g", { opacity: 0 }, over), compBox = svg("g", {}, compG);
    AK.box(compBox, cmpX - 6, cmpY - 6, cmpW + 12, cmpH + 6, { r: T.radius + 6, fill: tones.shadow, opacity: 0.12 });
    AK.box(compBox, cmpX, cmpY, cmpW, cmpH + T.radius, { r: T.radius + 2, fill: "surface", stroke: tones.hair2 });
    AK.box(compBox, cmpX, cmpY, cmpW, cmpBarH, { r: T.radius + 2, fill: tones.chrome });
    AK.icon(compBox, "pen-line", cmpX + 30, cmpY + cmpBarH / 2, 22, "muted");
    if (L.compose) AK.T(compBox, L.compose, { x: cmpX + 54, y: cmpY, w: cmpW - 110, h: cmpBarH, size: Z.fs, weight: 600 });
    AK.icon(compBox, "x", cmpX + cmpW - 30, cmpY + cmpBarH / 2, 22, "muted");
    const cTo = { y: cmpY + cmpBarH + 4, label: L.to, icon: "user" }, cSub = { y: cmpY + cmpBarH + 4 + cmpRow, label: L.subject, icon: "type" };
    for (const f of [cTo, cSub]) {
      AK.box(compBox, cmpX + pad, f.y + cmpRow - 1, cmpW - 2 * pad, 1.5, { r: 0, fill: tones.hair });
      f.ph = f.label ? AK.T(compBox, f.label, { x: cmpX + pad, y: f.y, w: cmpW - 2 * pad, h: cmpRow, size: Z.fs, color: "muted" }) : AK.icon(compBox, f.icon, cmpX + pad + 12, f.y + cmpRow / 2, 22, "muted");
    }
    const cBodyY = cmpY + cmpBarH + 4 + 2 * cmpRow + pad * 0.6;
    const cSend = AK.button(compBox, cmpX + pad, cmpY + cmpH - pad - Z.ctl, { label: L.send, icon: "send", kind: "primary", T, Z });

    // ---------------------------------------------------------------- actions
    const at0 = (t) => (t == null ? Math.max(H.free + 0.4, p.at >= 0 ? p.at + 0.6 : 0.4) : t);
    const rowRect = (r, t) => ({ x: LX + 8, y: r.y + (r.shift || 0) + 6, w: LW - 16, h: RH - 12 });
    let selRow = openI >= 0 ? rows[openI] : null;
    function select(r, t) {
      if (selRow === r) return;
      if (selRow) { AK.hide(selRow.sel, t, 0.15); AK.hide(selRow.bar, t, 0.15); }
      if (r) { AK.show(r.sel, t, 0.18); AK.show(r.bar, t, 0.18); }
      selRow = r;
    }
    function markRead(r, t) {
      if (!r.unread) return;
      r.unread = false;
      AK.hide(r.dot, t, 0.2); AK.hide(r.fromB, t, 0.2); AK.show(r.fromR, t, 0.2); AK.hide(r.subB, t, 0.2); AK.show(r.subR, t, 0.2);
    }
    function showPane(i, t) {
      const prev = openI >= 0 ? panes[openI] : nothing;
      const next = i >= 0 ? panes[i] : nothing;
      if (prev === next) return t;
      AK.hide(prev, t, 0.15);
      AK.show(next, t + 0.08, 0.25);
      Loom.drive((e) => next.setAttribute("transform", `translate(0 ${AK.f1(14 * (1 - e))})`), t + 0.08, 0.25, "enter", AK.meta("reveal", "app.pane"));
      openI = i;
      return t + 0.35;
    }
    const A = {};
    A.open = function (k, at) {
      const i = idx(k), r = rows[i];
      if (!r) { Loom.error("component_params", `app_email.open: no visible message "${k}"`); return at0(at); }
      const tp = H.click(rowRect(r), at0(at));
      select(r, tp + 0.05); markRead(r, tp + 0.1);
      return showPane(i, tp + 0.12);
    };
    A.reply = function (text, at, o) {
      o = o || {};
      const tp = H.click({ x: replyB.x, y: replyB.y, w: replyB.w, h: replyB.h }, at0(at));
      AK.show(replyG, tp + 0.12, 0.25);
      while (rText.firstChild) rText.removeChild(rText.firstChild);
      const node = AK.P(rText, text, { x: rbX + pad, y: rbY + pad, w: rbW - 2 * pad, size: Z.fs, maxLines: 4 });
      let t = AK.type(node, tp + 0.5, { cps: p.cps, size: Z.fs, caret: rText, color: AK.c(T.accent) });
      if (o.send) {
        const ts = H.click({ x: rSend.x, y: rSend.y, w: rSend.w, h: rSend.h }, t + 0.5);
        AK.hide(replyG, ts + 0.15, 0.2);
        t = L.sent ? H.toast(L.sent, ts + 0.35) : ts + 0.35;
      }
      return t;
    };
    A.flag = function (k, at) {
      const r = rows[idx(k)];
      if (!r) return at0(at);
      const tp = H.click({ x: LX + LW - pad - 30, y: r.y + (r.shift || 0) + pad * 0.75 + Z.lh, w: 32, h: Z.lh }, at0(at), { fx: 0.5 });
      r.flagged = !r.flagged;
      AK.fade(r.flagG, r.flagged ? 0 : 1, r.flagged ? 1 : 0, tp + 0.08, 0.18);
      Loom.drive((e, raw) => r.flagG.setAttribute("transform", `translate(${AK.f1(LX + LW - pad - 14)} ${AK.f1(r.y + pad * 0.75 + Z.lh * 1.5)}) scale(${(1 + 0.25 * Math.sin(Math.PI * raw)).toFixed(3)}) translate(${AK.f1(-(LX + LW - pad - 14))} ${AK.f1(-(r.y + pad * 0.75 + Z.lh * 1.5))})`), tp + 0.08, 0.3, "linear", AK.meta("gesture", "app.flag"));
      return tp + 0.4;
    };
    function reflow(t) {
      // the rows left close up, in order
      let slot = 0;
      for (const r of rows) {
        if (r.gone) continue;
        const dy = (slot - r.slot) * RH;
        if ((r.shift || 0) !== dy) { AK.shift(r.g, 0, dy, t, 0.32); r.shift = dy; }
        slot++;
      }
    }
    A.move = function (k, fk, at) {
      const r = rows[idx(k)], F = folders[fIdx(fk)];
      if (!r || !F) { Loom.error("component_params", `app_email.move: unknown message "${k}" or folder "${fk}"`); return at0(at); }
      const from = { x: LX + LW * 0.4, y: r.y + (r.shift || 0) + RH / 2 }, to = { x: F.x + F.w * 0.55, y: F.y + F.h / 2 };
      const D = H.drag(from, to, at0(at));
      // the ghost: the message's sender and subject on a card under the pointer
      const gw = Math.min(LW * 0.8, 520), gh = Z.lh * 2 + 20, gg = svg("g", { opacity: 0 }, over), gb = svg("g", {}, gg);
      AK.box(gb, 0, 6, gw, gh, { r: T.radius, fill: tones.shadow, opacity: 0.14 });
      AK.box(gb, 0, 0, gw, gh, { r: T.radius, fill: "surface", stroke: T.accent, sw: 2 });
      AK.T(gb, r.m.from, { x: 16, y: 10, w: gw - 32, h: Z.lh, size: Z.fs, weight: 700 });
      AK.T(gb, r.m.subject || "", { x: 16, y: 10 + Z.lh, w: gw - 32, h: Z.lh, size: Z.fs });
      AK.show(gg, D.t0 + 0.1, 0.15);
      const t0 = D.t0 + 0.1, dur = D.t1 - t0;
      Loom.drive((e, raw) => { const q = D.carry(t0 + raw * dur); gb.setAttribute("transform", `translate(${AK.f1(q.x + 18)} ${AK.f1(q.y + 10)})`); }, t0, dur, "linear", AK.meta("travel", "app.ghost"));
      AK.fade(r.body, 1, 0.35, D.t0 + 0.1, 0.2);
      AK.show(F.flash, D.t1 - 0.3, 0.2); AK.hide(F.flash, D.t1 + 0.35, 0.3);
      AK.hide(gg, D.t1 + 0.05, 0.18);
      AK.fade(r.body, 0.35, 0, D.t1 + 0.05, 0.15);
      r.gone = true;
      if (selRow === r) { select(null, D.t1); showPane(-1, D.t1 + 0.1); }
      reflow(D.t1 + 0.2);
      if (F.count != null && F.countNodes.length) {
        const n = Number(F.count) + 1;
        if (!isNaN(n)) {
          AK.hide(F.countNodes[0], D.t1 + 0.1, 0.15);
          const ng = AK.pill(F.g, F.x + F.w - 10, F.y + (F.h - PH) / 2, String(n), { size: Z.small, fill: tones.wash, weight: 600, align: "right", h: PH }).g;
          ng.setAttribute("opacity", 0);
          AK.show(ng, D.t1 + 0.2, 0.2);
          F.countNodes.unshift(ng); F.count = n;
        }
      }
      let t = D.t1 + 0.6;
      if (L.moved) t = H.toast(L.moved, D.t1 + 0.4);
      return t;
    };
    A.search = function (query, at) {
      const tp = H.click({ x: sX, y: sY, w: sW, h: sH }, at0(at));
      AK.show(sf.ring, tp + 0.05, 0.15);
      if (sf.ph) AK.hide(sf.ph, tp + 0.3, 0.1);
      const qt = AK.T(list, query, { x: sf.tx, y: sY, w: sf.tw, h: sH, size: Z.fs });
      const tEnd = AK.type(qt, tp + 0.35, { cps: p.cps, size: Z.fs, caret: list, color: AK.c(T.accent) });
      const q = String(query).toLowerCase();
      const hit = (r) => [r.m.from, r.m.subject, r.m.preview, r.m.address].some((s) => s && String(s).toLowerCase().includes(q));
      const t = tEnd + 0.35;
      let any = false;
      for (const r of rows) {
        if (r.gone) continue;
        if (!hit(r)) { AK.hide(r.g, t, 0.2); r.gone = true; if (selRow === r) select(null, t); } else any = true;
      }
      reflow(t + 0.15);
      if (!any) AK.show(noRes, t + 0.2, 0.25);
      return t + 0.5;
    };
    A.compose = function (msg, at) {
      msg = msg || {};
      const tp = H.click({ x: cb.x, y: cb.y, w: cb.w, h: cb.h }, at0(at));
      AK.show(compG, tp + 0.12, 0.25);
      Loom.drive((e) => compBox.setAttribute("transform", `translate(0 ${AK.f1(60 * (1 - e))})`), tp + 0.12, 0.3, "enter", AK.meta("reveal", "app.compose"));
      let t = tp + 0.6;
      const fields = [[cTo, msg.to], [cSub, msg.subject]];
      for (const [f, v] of fields) {
        if (!v) continue;
        const tf = H.click({ x: cmpX + pad, y: f.y, w: cmpW - 2 * pad, h: cmpRow }, t + 0.2, { fx: 0.3 });
        if (f.ph) AK.hide(f.ph, tf + 0.1, 0.1);
        const node = AK.T(compBox, v, { x: cmpX + pad, y: f.y, w: cmpW - 2 * pad, h: cmpRow, size: Z.fs, weight: f === cSub ? 600 : 400 });
        t = AK.type(node, tf + 0.2, { cps: p.cps, size: Z.fs, weight: f === cSub ? 600 : 400, caret: compBox, color: AK.c(T.accent) });
      }
      if (msg.body) {
        const tb2 = H.click({ x: cmpX + pad, y: cBodyY, w: cmpW - 2 * pad, h: Z.lh * 2 }, t + 0.3, { fx: 0.3 });
        const node = AK.P(compBox, msg.body, { x: cmpX + pad, y: cBodyY, w: cmpW - 2 * pad, size: Z.fs, maxLines: 5 });
        t = AK.type(node, tb2 + 0.2, { cps: p.cps, size: Z.fs, caret: compBox, color: AK.c(T.accent) });
      }
      if (msg.send) {
        const ts = H.click({ x: cSend.x, y: cSend.y, w: cSend.w, h: cSend.h }, t + 0.5);
        AK.hide(compG, ts + 0.15, 0.25);
        t = L.sent ? H.toast(L.sent, ts + 0.4) : ts + 0.4;
      }
      return t;
    };
    A.setState = function (name, at) { return states.set(name, at0(at)); };
    A.state = A.setState;
    AK.reveal(g, p.at);
    AK.runSteps(A, p.steps, { open: ["i", "at"], reply: ["text", "at", "opts"], flag: ["i", "at"], move: ["i", "folder", "at"], search: ["query", "at"], compose: ["message", "at"], state: ["state", "at"] });
    return Object.assign({ host: H, sidebar: side, folders, list, rows, more, searchBox: sf, pane, panes, toolbar: tb, replyBox: replyG, composeWindow: compG, states }, A);
  },
});
