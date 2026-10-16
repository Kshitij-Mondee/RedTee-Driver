// T-159 app_project_board: a generic project tracker shell (hand-off sheet, Family M). Built on runtime/components/_app_kit.js.
// Extends section 7's biz_kanban (T-081: a board of columns, WIP limits and cards) into the tracker a team works in: a
// backlog list, the board, an issue's detail with sub-tasks, and the actions create, drag, assign and close.
Loom.component("app_project_board", {
  version: 1,
  idea: "A project tracker a team works in: a board of columns with work-in-progress limits and issue cards, a backlog list, and an issue's detail with its assignee and sub-tasks, walked through by a pointer that creates an issue, drags a card to another column, assigns it and closes it.",
  outline: ["window (or the screencast engine's app window)", "top bar: project name, board and backlog tabs, a create button", "board: columns with names and counts against their limits; cards with key, type, title, priority, points and assignee", "backlog: one row an issue with its status", "issue detail drawer: key, title, status, assignee, sub-tasks, description", "toast", "pointer"],
  family: "biz",
  tags: ["project tracker", "kanban", "scrum", "backlog", "issue tracker", "agile", "sprint", "work in progress", "jira-like", "task board"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-159)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop"],   // a product UI: the styles that show products as screens (D-193)
  params: {
    project: { type: "str", content: true },     // the project's name
    columns: { type: "list", content: true },    // [{id, name, wip}] left to right
    issues: { type: "list", content: true },     // [{id, key, title, col, type: "story"|"bug"|"task", priority: "high"|"medium"|"low", points,
                                                 // assignee, subtasks: [{title, done}], description}]
    people: { type: "list" },                    // names offered when assigning
    doneCol: { type: "str" },                    // the column an issue closes into (the last when omitted)
    view: { type: "enum", choices: ["board", "backlog"], default: "board" },
    title: { type: "str" },
    labels: { type: "obj" },                     // the product's words, each optional: {board, backlog, create, close, assignee, subtasks, unassigned,
                                                 // created, closed}
    state: { type: "enum", choices: ["ready", "loading", "empty", "error"], default: "ready" },
    notice: { type: "str" },
    steps: { type: "list", default: [] },        // [{do: "create"|"drag"|"open"|"assign"|"close"|"closePanel"|"show"|"state", at, ...}]
    theme: { type: "obj", default: {} }, layout: { type: "obj", default: {} },   // layout: {drawerW}
    w: { type: "number", default: 1728 }, h: { type: "number", default: 856 },
    at: { type: "number", default: -1 }, cps: { type: "number", default: 14 },
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["host", "topbar", "tabs", "columns", "cards", "backlogRows", "drawer", "states",
    "create({title, type, col}, at)", "drag(id, col, at)", "open(id, at)", "assign(id, name, at)", "close(id, at)", "closePanel(at)", "show(view, at)", "setState(name, at)"],
  example: 'ctx.use("app_project_board", { project: "Website relaunch", columns: [{ id: "todo", name: "To do" }, { id: "doing", name: "In progress", wip: 2 }, { id: "done", name: "Done" }], issues: [{ id: "w1", key: "WEB-12", title: "Write the cookie banner copy", col: "todo", type: "task" }], steps: [{ do: "drag", id: "w1", col: "doing", at: ctx.cue("pick it up") }] }, { x: 96, y: 78, name: "board" })',
  size: (p) => ({ w: p.w, h: p.h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, svg = (t, a, q) => Loom.svg(t, a, q);
    const T = AK.theme(p.theme), Z = AK.sizes(T), tones = AK.tones(T), L = p.labels || {}, LY = p.layout || {};
    const H = AK.host(ctx, g, p, { T, Z, title: p.title });
    const B = H.body, BW = B.w, BH = B.h, pad = Z.pad, root = B.g;
    AK.box(root, 0, 0, BW, BH, { r: 0, fill: tones.page });
    const cols = p.columns.map((c, i) => Object.assign({ id: c.id || "c" + i }, c));
    const colIdx = (k) => cols.findIndex((c) => c.id === k);
    const doneCol = p.doneCol && colIdx(p.doneCol) >= 0 ? p.doneCol : cols[cols.length - 1].id;
    const TYPE = { story: ["bookmark", "pos"], bug: ["bug", "neg"], task: ["square-check", T.accent] };
    const PRIO = { high: ["chevrons-up", "neg"], medium: ["equal", "accent4"], low: ["chevrons-down", "muted"] };
    const PH = AK.boxH(Z.small, "caption", 600);

    // ---------------------------------------------------------------- top bar
    const topH = Math.round(Math.max(Z.lhB + 20, Z.ctl + 24));
    const top = svg("g", {}, root);
    AK.box(top, 0, 0, BW, topH, { r: 0, fill: tones.card });
    AK.box(top, 0, topH - 1, BW, 1.5, { r: 0, fill: tones.hair2 });
    const brand = AK.solid(T.accent);
    AK.box(top, pad, (topH - 40) / 2, 40, 40, { r: 10, fill: brand.fill, stroke: brand.stroke, sw: brand.sw });
    AK.icon(top, "kanban", pad + 20, topH / 2, 24, brand.fg);
    const createB = AK.button(top, BW - pad, (topH - Z.ctl) / 2, { label: L.create, icon: "plus", kind: "primary", T, Z, align: "right" });
    let tx = pad + 56;
    const tabs = {};
    const tabW = (s) => Math.ceil(AK.measure(s, "caption", Z.fs, 600) + 40);
    const tabsList = [["board", L.board, "columns-3"], ["backlog", L.backlog, "list"]];
    const titleW = Math.min(AK.measure(p.project, "label", Z.head, 700) + 10, BW * 0.36);
    AK.T(svg("g", {}, top), p.project, { role: "label", x: tx, y: 0, w: titleW, h: topH, size: Z.head, weight: 700 });
    tx += titleW + pad * 1.5;
    for (const [id, lab, ic] of tabsList) {
      const w = lab ? tabW(lab) + 30 : 56, tg = svg("g", {}, top);
      const on = svg("g", { opacity: id === p.view ? 1 : 0 }, tg), off = svg("g", { opacity: id === p.view ? 0 : 1 }, tg);
      AK.box(on, tx, topH - 5, w, 4, { r: 2, fill: T.accent });
      AK.icon(on, ic, tx + 22, topH / 2, 22, T.accent); AK.icon(off, ic, tx + 22, topH / 2, 22, "muted");
      if (lab) { AK.T(on, lab, { x: tx + 40, y: 0, w: w - 44, h: topH, size: Z.fs, weight: 600, color: T.accent }); AK.T(off, lab, { x: tx + 40, y: 0, w: w - 44, h: topH, size: Z.fs, weight: 600, color: "muted" }); }
      tabs[id] = { g: tg, x: tx, y: 0, w, h: topH, on, off };
      tx += w + 8;
    }

    // ---------------------------------------------------------------- the board
    const boardG = svg("g", {}, root);
    const gap = 16, colTop = topH + pad, colX0 = pad, colsW = BW - 2 * pad;
    const cw = (colsW - gap * (cols.length - 1)) / cols.length;
    const headH = AK.boxH(Z.fs, "caption", 700, Z.row);
    const cardW = cw - 20;
    const issues = p.issues.map((q, i) => Object.assign({ id: q.id || "i" + i }, q));
    // measure, then draw: a card's height from its title
    const cardH = (q) => {
      const th = AK.paraH(q.title || "", { size: Z.fs, w: cardW - 32, maxLines: 2 });
      const foot = q.priority || q.points != null || q.assignee ? 8 + PH : 0;   // no footer row when it would be empty
      return Math.ceil(14 + Z.lhS + 4 + th + foot + 14);
    };
    const colOf = {}; cols.forEach((c) => (colOf[c.id] = []));
    const cards = {};
    const areaTop = colTop + headH + 8, areaBot = BH - 8;
    const clipId = Loom.uid ? Loom.uid("pbclip") : "pbclip";
    const cp = svg("clipPath", { id: clipId }, boardG);
    svg("rect", { x: 0, y: areaTop - 4, width: BW, height: areaBot - areaTop + 4 }, cp);
    const colHeads = [];
    cols.forEach((c, i) => {
      const x = colX0 + i * (cw + gap);
      AK.box(boardG, x, colTop, cw, BH - colTop - 4, { r: T.radius, fill: AK.mix(T.page, "line", 0.08) });
      colHeads.push({ x, y: colTop, w: cw, h: headH, c, g: svg("g", {}, boardG) });
    });
    const cardsG = svg("g", { "clip-path": `url(#${clipId})` }, boardG);
    function drawCard(q, x, y) {
      const h = cardH(q), cg = svg("g", {}, cardsG), body = svg("g", {}, cg);
      AK.box(body, x, y, cardW, h, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
      const [tic, ttn] = TYPE[q.type] || TYPE.task;
      AK.icon(body, tic, x + 16 + 10, y + 14 + Z.lhS / 2, 20, ttn);
      if (q.key) AK.T(body, q.key, { x: x + 44, y: y + 14, w: cardW - 60 - 30, h: Z.lhS, size: Z.small, color: "muted", weight: 600 });
      const doneMark = svg("g", { opacity: 0 }, body);
      AK.icon(doneMark, "circle-check", x + cardW - 26, y + 14 + Z.lhS / 2, 22, "pos");
      const tt = AK.P(body, q.title || "", { x: x + 16, y: y + 14 + Z.lhS + 4, w: cardW - 32, size: Z.fs, maxLines: 2 });
      const fy = y + h - 14 - PH;
      let fx = x + 16;
      if (q.priority && PRIO[q.priority]) { AK.icon(body, PRIO[q.priority][0], fx + 11, fy + PH / 2, 22, PRIO[q.priority][1]); fx += 30; }
      if (q.points != null) { const pl = AK.pill(body, fx, fy, String(q.points), { size: Z.small, fill: tones.track, weight: 600, h: PH }); fx += pl.w + 8; }
      const avG = svg("g", {}, body);
      if (q.assignee) AK.avatar(avG, x + cardW - 16 - 18, fy + PH / 2, 18, q.assignee);
      void tt;
      return { g: cg, body, x, y, w: cardW, h, q, doneMark, avG, ox: x, oy: y };
    }
    // where every card sits: stacked in its column in order
    const place = (c, k) => {
      const i = colIdx(c), list = colOf[c];
      let y = areaTop;
      for (let j = 0; j < k; j++) y += list[j].h + 10;
      return { x: colX0 + i * (cw + gap) + 10, y };
    };
    issues.forEach((q) => {
      if (!(q.col in colOf)) { Loom.error("component_params", `app_project_board: issue "${q.id}" is in unknown column "${q.col}"`); return; }
      const pos = place(q.col, colOf[q.col].length), h = cardH(q);
      if (pos.y + h > areaBot) { colOf[q.col].push({ h, hidden: true, q }); return; }
      const C = drawCard(q, pos.x, pos.y);
      C.col = q.col; cards[q.id] = C; colOf[q.col].push(C);
    });
    // column heads: name and count (against the limit); over the limit it warns
    function drawHead(H0, n, t) {
      const c = H0.c, hg = svg("g", t == null ? {} : { opacity: 0 }, H0.g), over = c.wip != null && n > c.wip;
      const cnt = c.wip != null ? `${n} / ${c.wip}` : String(n);
      const pl = AK.pill(hg, H0.x + H0.w - 12, H0.y + (headH - PH) / 2, cnt, { size: Z.small, fill: over ? tones.warnWash : tones.track, color: over ? "accent4" : "ink", weight: 700, h: PH, align: "right", icon: over ? "triangle-alert" : null });
      AK.T(hg, c.name || "", { x: H0.x + 16, y: H0.y, w: H0.w - 32 - pl.w, h: headH, size: Z.fs, weight: 700 });
      if (t != null) { if (H0.cur) AK.hide(H0.cur, t, 0.12); AK.show(hg, t + 0.05, 0.15); }
      H0.cur = hg; H0.n = n;
    }
    colHeads.forEach((H0, i) => drawHead(H0, colOf[cols[i].id].length, null));
    function reflow(t) {
      for (const c of cols) colOf[c.id].forEach((C, k) => {
        if (C.hidden) return;
        const pos = place(c.id, k), dx = pos.x - C.ox, dy = pos.y - C.oy;
        if (C.x !== pos.x || C.y !== pos.y) { AK.shift(C.g, dx, dy, t, 0.4); C.x = pos.x; C.y = pos.y; }
      });
      colHeads.forEach((H0, i) => { const n = colOf[cols[i].id].length; if (n !== H0.n) drawHead(H0, n, t + 0.2); });
    }

    // ---------------------------------------------------------------- the backlog
    const backG = svg("g", { opacity: p.view === "backlog" ? 1 : 0 }, root);
    if (p.view === "backlog") boardG.setAttribute("opacity", 0);
    const backlogRows = [];
    {
      const rh = AK.boxH(Z.fs, "caption", 600, Z.row), x = pad, w = BW - 2 * pad;
      AK.box(backG, 0, topH, BW, BH - topH, { r: 0, fill: tones.page });
      issues.forEach((q, i) => {
        const y = topH + pad + i * (rh + 6);
        if (y + rh > BH - 8) return;
        const rg = svg("g", {}, backG);
        AK.box(rg, x, y, w, rh, { r: T.radius, fill: tones.card, stroke: tones.hair });
        const [tic, ttn] = TYPE[q.type] || TYPE.task;
        AK.icon(rg, tic, x + 28, y + rh / 2, 22, ttn);
        const kw = q.key ? Math.ceil(AK.measure(q.key, "caption", Z.small, 600) + 16) : 0;
        if (q.key) AK.T(rg, q.key, { x: x + 52, y, w: kw, h: rh, size: Z.small, weight: 600, color: "muted" });
        const c = cols[colIdx(q.col)];
        const st = c ? AK.pill(rg, x + w - 70, y + (rh - PH) / 2, c.name, { size: Z.small, fill: q.col === doneCol ? tones.posWash : tones.track, color: q.col === doneCol ? "pos" : "ink", weight: 600, h: PH, align: "right" }) : { w: 0 };
        if (q.assignee) AK.avatar(rg, x + w - 34, y + rh / 2, 18, q.assignee);
        if (q.points != null) AK.T(rg, String(q.points), { x: x + w - 70 - st.w - 70, y, w: 50, h: rh, size: Z.small, color: "muted", align: "right" });
        AK.T(rg, q.title || "", { x: x + 52 + kw + 8, y, w: w - (52 + kw + 8) - 70 - st.w - 90, h: rh, size: Z.fs });
        backlogRows.push({ g: rg, x, y, w, h: rh, q });
      });
    }
    const viewState = AK.states({ board: boardG, backlog: backG }, p.view);

    // ---------------------------------------------------------------- the issue drawer
    const DW = Math.round(LY.drawerW || AK.clamp(BW * 0.34, 440, 620)), DX = BW - DW;
    const drawers = {};
    const drawerG = svg("g", {}, B.over);
    function drawer(C) {
      if (drawers[C.q.id]) return drawers[C.q.id];
      const q = C.q, dg = svg("g", { opacity: 0 }, drawerG), box = svg("g", {}, dg);
      AK.box(box, DX - 8, topH, 8, BH - topH, { r: 0, fill: tones.shadow, opacity: 0.08 });
      AK.box(box, DX, topH, DW, BH - topH, { r: 0, fill: "surface" });
      AK.box(box, DX, topH, 1.5, BH - topH, { r: 0, fill: tones.hair2 });
      const x = DX + pad * 1.4, w = DW - pad * 2.8;
      let y = topH + pad;
      const [tic, ttn] = TYPE[q.type] || TYPE.task;
      AK.icon(box, tic, x + 10, y + Z.lhS / 2, 20, ttn);
      if (q.key) AK.T(box, q.key, { x: x + 28, y, w: w - 80, h: Z.lhS, size: Z.small, weight: 600, color: "muted" });
      AK.icon(box, "x", x + w - 12, y + Z.lhS / 2, 22, "muted");
      y += Z.lhS + 8;
      const tt = AK.P(box, q.title || "", { role: "label", x, y, w, size: Z.head, maxLines: 3, weight: 700 });
      y += tt.__h + pad * 0.7;
      // status and the close action
      const c = cols[colIdx(C.col)];
      const stG = svg("g", {}, box);
      AK.pill(stG, x, y + (Z.ctl - PH) / 2, c ? c.name : "", { size: Z.small, fill: tones.track, weight: 600, h: PH });
      const closeB = AK.button(box, x + w, y, { label: L.close, icon: "circle-check", kind: "primary", T, Z, align: "right" });
      y += Z.ctl + pad;
      // the assignee
      if (L.assignee) AK.T(box, L.assignee, { x, y, w, h: Z.lhS, size: Z.small, weight: 600, color: "muted" });
      y += L.assignee ? Z.lhS + 4 : 0;
      const asH = AK.boxH(Z.fs, "caption", 600, Z.ctl);
      const asR = { x, y, w: Math.min(w, 360), h: asH };
      AK.box(box, asR.x, asR.y, asR.w, asR.h, { r: Math.min(T.radius, 8), fill: tones.page, stroke: tones.hair2 });
      const asNow = svg("g", {}, box);
      if (q.assignee) { AK.avatar(asNow, x + 26, y + asH / 2, 16, q.assignee); AK.T(asNow, q.assignee, { x: x + 52, y, w: asR.w - 64, h: asH, size: Z.fs, weight: 600 }); }
      else { AK.icon(asNow, "user-round-plus", x + 26, y + asH / 2, 22, "muted"); if (L.unassigned) AK.T(asNow, L.unassigned, { x: x + 52, y, w: asR.w - 64, h: asH, size: Z.fs, color: "muted" }); }
      y += asH + pad;
      // sub-tasks
      const subs = q.subtasks || [];
      if (subs.length) {
        if (L.subtasks) { AK.T(box, L.subtasks, { x, y, w, h: Z.lhS, size: Z.small, weight: 600, color: "muted" }); y += Z.lhS + 6; }
        const sr = AK.boxH(Z.fs, "caption", 400, Z.lh + 14);
        for (const s of subs) {
          if (y + sr > BH - pad * 2 - Z.lh) break;
          AK.box(box, x, y + (sr - 24) / 2, 24, 24, { r: 6, fill: s.done ? AK.solid("pos").fill : "none", stroke: s.done ? "pos" : tones.hair2, sw: 2 });
          if (s.done) AK.icon(box, "check", x + 12, y + sr / 2, 18, AK.solid("pos").fg);
          AK.T(box, s.title || "", { x: x + 36, y, w: w - 36, h: sr, size: Z.fs, color: s.done ? "muted" : "ink" });
          y += sr;
        }
        y += pad * 0.6;
      }
      if (q.description && y + Z.lh < BH - pad) {
        const room = Math.max(1, Math.floor((BH - pad - y) / (Z.fs * 1.36)));
        AK.P(box, q.description, { x, y, w, size: Z.fs, maxLines: Math.min(room, 6), color: "muted" });
      }
      const D = { g: dg, box, closeB, asR, asNow, stG, open: false };
      drawers[q.id] = D;
      return D;
    }
    let openD = null;
    // states
    const stCover = (gg) => AK.box(gg, 0, topH, BW, BH - topH, { r: 0, fill: tones.page });
    const loadG = svg("g", {}, root); stCover(loadG);
    cols.forEach((c, i) => { const x = colX0 + i * (cw + gap); AK.box(loadG, x, colTop, cw, headH, { r: T.radius, fill: tones.track }); for (let k = 0; k < 3 - (i % 2); k++) AK.box(loadG, x + 10, areaTop + k * 130, cardW, 116, { r: T.radius, fill: tones.track, opacity: 0.7 }); });
    const msg = (gg, icon, tone) => {
      stCover(gg);
      AK.icon(gg, icon, BW / 2, topH + (BH - topH) * 0.38, 60, tone || "muted");
      if (p.notice) AK.P(gg, p.notice, { x: BW * 0.25, y: topH + (BH - topH) * 0.38 + 50, w: BW * 0.5, size: Z.fs, maxLines: 3, color: "muted", align: "center" });
    };
    const emptyG = svg("g", {}, root); msg(emptyG, "clipboard-list");
    const errG = svg("g", {}, root); msg(errG, "circle-alert", "neg");
    const states = AK.states({ ready: svg("g", {}, root), loading: loadG, empty: emptyG, error: errG }, p.state || "ready");

    // ---------------------------------------------------------------- actions
    const at0 = (t) => (t == null ? Math.max(H.free + 0.4, p.at >= 0 ? p.at + 0.6 : 0.4) : t);
    const A = {};
    let view = p.view;
    A.show = function (v, at) {
      const t0 = at0(at);
      if (v === view || !tabs[v]) return t0;
      const tp = H.click(tabs[v], t0);
      AK.hide(tabs[view].on, tp + 0.05, 0.15); AK.show(tabs[view].off, tp + 0.05, 0.15);
      AK.show(tabs[v].on, tp + 0.05, 0.15); AK.hide(tabs[v].off, tp + 0.05, 0.15);
      viewState.set(v, tp + 0.1); view = v;
      return tp + 0.45;
    };
    const ensureBoard = (t) => (view === "board" ? t : A.show("board", t) + 0.2);
    A.create = function (q, at) {
      q = Object.assign({ type: "task" }, q || {});
      q.id = q.id || "new" + Object.keys(cards).length;
      const col = q.col && colOf[q.col] ? q.col : cols[0].id;
      let t = ensureBoard(at0(at));
      const tp = H.click(createB, t);
      // the new card opens at the top of its column, the others move down, the title is typed in
      colOf[col].unshift(null);
      const pos = place(col, 0);
      colOf[col].shift();
      const C = drawCard(Object.assign({}, q, { title: q.title }), pos.x, pos.y);
      C.col = col; cards[q.id] = C;
      C.g.setAttribute("opacity", 0);
      colOf[col].unshift(C);
      reflow(tp + 0.1);
      AK.show(C.g, tp + 0.2, 0.2);
      const node = C.body.querySelectorAll("text")[q.key ? 1 : 0];
      t = node ? AK.type(node, tp + 0.45, { cps: p.cps, size: Z.fs, caret: C.body, color: AK.c(T.accent) }) : tp + 0.5;
      return L.created ? H.toast(L.created, t + 0.4) : t + 0.4;
    };
    function moveTo(C, col, t, drag) {
      const from = colOf[C.col];
      from.splice(from.indexOf(C), 1);
      colOf[col].push(C);
      C.col = col;
      if (drag) {
        const pos = place(col, colOf[col].length - 1), grab = { x: C.x + C.w * 0.4, y: C.y + 22 };
        const D = H.drag(grab, { x: pos.x + C.w * 0.4, y: pos.y + 22 }, t);
        const t0 = D.t0 + 0.12, d0 = Math.max(0.05, D.t1 - t0), sx = C.x - C.ox, sy = C.y - C.oy;
        cardsG.appendChild(C.g);   // lifted above the others
        Loom.drive((e, raw) => { const q = D.carry(t0 + raw * d0); C.g.setAttribute("transform", `translate(${AK.f1(sx + q.x - grab.x)} ${AK.f1(sy + q.y - grab.y)})`); }, t0, d0, "linear", AK.meta("travel", "app.drag"));
        C.x = pos.x; C.y = pos.y;
        AK.setShift(C.g, pos.x - C.ox, pos.y - C.oy);   // the carry ends on the slot
        reflow(D.t1 + 0.05);
        return D.t1 + 0.3;
      }
      reflow(t);
      return t + 0.5;
    }
    A.drag = function (id, col, at) {
      const C = cards[id];
      if (!C || !colOf[col]) { Loom.error("component_params", `app_project_board.drag: unknown issue "${id}" or column "${col}"`); return at0(at); }
      return moveTo(C, col, ensureBoard(at0(at)), true);
    };
    A.open = function (id, at) {
      const C = cards[id];
      if (!C) { Loom.error("component_params", `app_project_board.open: unknown issue "${id}"`); return at0(at); }
      const t = ensureBoard(at0(at));
      const D = drawer(C);
      if (openD === D) return t;
      const tp = H.click({ x: C.x, y: C.y, w: C.w, h: C.h }, t, { fx: 0.5, fy: 0.45 });
      if (openD) AK.hide(openD.g, tp + 0.05, 0.12);
      AK.show(D.g, tp + 0.1, 0.22);
      Loom.drive((e) => D.box.setAttribute("transform", `translate(${AK.f1(DW * 0.3 * (1 - e))} 0)`), tp + 0.1, 0.3, "enter", AK.meta("reveal", "app.drawer"));
      openD = D;
      return tp + 0.45;
    };
    A.closePanel = function (at) { const t = at0(at); if (openD) { AK.hide(openD.g, t, 0.18); openD = null; } return t + 0.2; };
    A.assign = function (id, name, at) {
      let t = A.open(id, at);
      const C = cards[id], D = drawers[id];
      if (!C || !D) return t;
      const tp = H.click(D.asR, t + 0.2, { fx: 0.3 });
      // a menu of people, the chosen one taken
      const ppl = (p.people || []).slice(0, 5);
      const k = Math.max(0, ppl.indexOf(name)), list = ppl.length ? ppl : [name];
      const ih = AK.boxH(Z.fs, "caption", 600, Z.ctl), mw = D.asR.w, mh = list.length * ih + 12;
      const mg = svg("g", { opacity: 0 }, D.box);
      AK.box(mg, D.asR.x, D.asR.y + D.asR.h + 4 + 6, mw, mh, { r: T.radius, fill: tones.shadow, opacity: 0.12 });
      AK.box(mg, D.asR.x, D.asR.y + D.asR.h + 4, mw, mh, { r: T.radius, fill: "surface", stroke: tones.hair2 });
      list.forEach((n, i) => {
        const iy = D.asR.y + D.asR.h + 10 + i * ih;
        AK.avatar(mg, D.asR.x + 26, iy + ih / 2, 16, n);
        AK.T(mg, n, { x: D.asR.x + 52, y: iy, w: mw - 64, h: ih, size: Z.fs });
      });
      AK.show(mg, tp + 0.1, 0.15);
      const tc = H.click({ x: D.asR.x + 8, y: D.asR.y + D.asR.h + 10 + (list.indexOf(name) >= 0 ? list.indexOf(name) : k) * ih, w: mw - 16, h: ih }, tp + 0.8, { fx: 0.3 });
      AK.hide(mg, tc + 0.1, 0.12);
      const now = svg("g", { opacity: 0 }, D.box);
      AK.box(now, D.asR.x + 2, D.asR.y + 2, D.asR.w - 4, D.asR.h - 4, { r: Math.min(T.radius, 8), fill: tones.page });
      AK.avatar(now, D.asR.x + 26, D.asR.y + D.asR.h / 2, 16, name);
      AK.T(now, name, { x: D.asR.x + 52, y: D.asR.y, w: D.asR.w - 64, h: D.asR.h, size: Z.fs, weight: 600 });
      AK.hide(D.asNow, tc + 0.12, 0.1); AK.show(now, tc + 0.15, 0.15);
      // and on the card
      const av = svg("g", { opacity: 0 }, C.body);
      AK.avatar(av, C.ox + C.w - 16 - 18, C.oy + C.h - 14 - PH / 2, 18, name);
      if (C.q.assignee) AK.hide(C.avG, tc + 0.15, 0.1);
      AK.show(av, tc + 0.2, 0.2);
      return tc + 0.5;
    };
    A.close = function (id, at) {
      let t = A.open(id, at);
      const C = cards[id], D = drawers[id];
      if (!C || !D) return t;
      const tp = H.click(D.closeB, t + 0.3);
      AK.hide(D.g, tp + 0.2, 0.18); openD = null;
      AK.show(C.doneMark, tp + 0.3, 0.2);
      t = moveTo(C, doneCol, tp + 0.4, false);
      return L.closed ? H.toast(L.closed, t + 0.1) : t + 0.1;
    };
    A.setState = function (name, at) { return states.set(name, at0(at)); };
    A.state = A.setState;
    AK.reveal(g, p.at);
    AK.runSteps(A, p.steps, { create: ["issue", "at"], drag: ["id", "col", "at"], open: ["id", "at"], assign: ["id", "name", "at"], close: ["id", "at"], closePanel: ["at"], show: ["view", "at"], state: ["state", "at"] });
    return Object.assign({ host: H, topbar: top, tabs, columns: colHeads, cards, backlogRows, drawer: () => openD, states }, A);
  },
});
