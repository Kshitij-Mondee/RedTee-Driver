// T-151 app_calendar: a generic calendar shell, week view (hand-off sheet, Family M). Built on runtime/components/_app_kit.js.
// Extends the calendar.plan template (a static plan of dates) into a working calendar: events placed by time, a booking
// form with the guests' availability, drag to reschedule and invite, as scriptable actions.
Loom.component("app_calendar", {
  version: 1,
  idea: "A calendar at work in week view: days across, hours down, events placed by their times, the guests' free and busy times in a booking form, walked through by a pointer that creates an event, drags one to reschedule it, opens one and invites a colleague.",
  outline: ["window (or the screencast engine's app window)", "toolbar: today, previous and next, the period, a new event button", "optional sidebar of calendars", "week grid: day headers, hour gutter, hour lines, a now line", "event blocks in lanes, coloured by calendar", "booking and event popovers: title, time, place, guests, availability strips", "toast", "pointer"],
  family: "ui",
  tags: ["calendar", "scheduling", "meeting", "booking", "availability", "week view", "invite", "time management", "screencast", "productivity"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-151)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop"],   // a product UI: the styles that show products as screens (D-193)
  params: {
    days: { type: "list", content: true },       // the columns' labels, e.g. ["Mon 14", "Tue 15", ...] (1 to 7)
    hours: { type: "list", content: true },      // the rows' labels from startHour, e.g. ["8:00", "9:00", ...]
    events: { type: "list", content: true },     // [{id, title, day (index), start, end (hours, 9.5 = 9:30), where, tone (token), guests: [names]}]
    startHour: { type: "number", default: 8 },   // the hour the first row stands for
    period: { type: "str" },                     // the toolbar's period, e.g. "October 2026" (none when omitted)
    today: { type: "int" },                      // the index of today's column (marked) (none when omitted)
    now: { type: "number" },                     // the time of the now line on today's column (none when omitted)
    calendars: { type: "list" },                 // a sidebar of calendars [{label, tone}] (none when omitted)
    people: { type: "list" },                    // availability: [{name, busy: [[day, start, end], ...]}]
    clock: { type: "enum", choices: ["24", "12"], default: "24" },
    title: { type: "str" },
    labels: { type: "obj" },                     // the product's words, each optional: {today, newEvent, save, title, guests, where, free, busy, saved, sent, moved}
    state: { type: "enum", choices: ["ready", "loading", "error"], default: "ready" },
    notice: { type: "str" },                     // the error state's words (none when omitted)
    steps: { type: "list", default: [] },        // [{do: "create"|"drag"|"open"|"invite"|"close"|"state", at, ...}]
    theme: { type: "obj", default: {} }, layout: { type: "obj", default: {} },   // layout: {sidebarW, gutterW}
    w: { type: "number", default: 1728 }, h: { type: "number", default: 856 },
    at: { type: "number", default: -1 }, cps: { type: "number", default: 14 },
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["host", "toolbar", "sidebar", "grid", "dayHeads", "events", "nowLine", "popover", "states",
    "create({title, day, start, end, where, guests}, at)", "drag(id, day, start, at)", "open(id, at)", "invite(id, name, at, {send})", "close(at)", "setState(name, at)", "slot(day, hour)"],
  example: 'ctx.use("app_calendar", { days: ["Mon 3", "Tue 4", "Wed 5", "Thu 6", "Fri 7"], hours: ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"], startHour: 9, events: [{ id: "std", title: "Ward handover", day: 0, start: 9, end: 9.5 }], labels: { newEvent: "New event", save: "Save" }, steps: [{ do: "create", event: { title: "Fire safety refresher", day: 2, start: 14, end: 15 }, at: ctx.cue("book the refresher") }] }, { x: 96, y: 78, name: "cal" })',
  size: (p) => ({ w: p.w, h: p.h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, svg = (t, a, q) => Loom.svg(t, a, q);
    const T = AK.theme(p.theme), Z = AK.sizes(T), tones = AK.tones(T), L = p.labels || {}, LY = p.layout || {};
    const H = AK.host(ctx, g, p, { T, Z, title: p.title });
    const B = H.body, BW = B.w, BH = B.h, pad = Z.pad, root = B.g;
    const S0 = p.startHour, nH = p.hours.length, nD = Math.max(1, Math.min(7, p.days.length));
    const fmt = (h) => {
      const hh = Math.floor(h + 1e-6), mm = Math.round((h - hh) * 60);
      if (p.clock === "12") return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${hh < 12 ? "am" : "pm"}`;
      return `${hh}:${String(mm).padStart(2, "0")}`;
    };
    const span = (a, b) => `${fmt(a)} - ${fmt(b)}`;
    AK.box(root, 0, 0, BW, BH, { r: 0, fill: tones.card });

    // ---------------------------------------------------------------- toolbar
    const tbH = Z.ctl + 2 * pad * 0.6, tby = (tbH - Z.ctl) / 2;
    const tb = svg("g", {}, root);
    let bx = pad;
    if (L.today) { const b = AK.button(tb, bx, tby, { label: L.today, T, Z }); bx += b.w + 12; }
    const prevB = AK.button(tb, bx, tby, { icon: "chevron-left", T, Z, kind: "ghost" }); bx += prevB.w + 4;
    const nextB = AK.button(tb, bx, tby, { icon: "chevron-right", T, Z, kind: "ghost" }); bx += nextB.w + 12;
    const newB = AK.button(tb, BW - pad, tby, { label: L.newEvent, icon: "plus", kind: "primary", T, Z, align: "right" });
    if (p.period) AK.T(svg("g", {}, tb), p.period, { role: "label", x: bx, y: 0, w: newB.x - bx - 20, h: tbH, size: Z.head, weight: 700 });
    AK.box(root, 0, tbH, BW, 1.5, { r: 0, fill: tones.hair2 });

    // ---------------------------------------------------------------- sidebar (calendars)
    let GX0 = 0;
    const side = svg("g", {}, root);
    if (p.calendars && p.calendars.length) {
      const SW = Math.round(LY.sidebarW || AK.clamp(BW * 0.16, 230, 300));
      AK.box(side, 0, tbH + 1.5, SW, BH - tbH, { r: 0, fill: tones.side });
      AK.box(side, SW - 1, tbH, 1.5, BH - tbH, { r: 0, fill: tones.hair2 });
      let y = tbH + pad;
      for (const c of p.calendars) {
        if (y + Z.row > BH) break;
        const SD = AK.solid(c.tone || T.accent);
        AK.box(side, pad, y + (Z.row - 24) / 2, 24, 24, { r: 6, fill: SD.fill, stroke: SD.stroke, sw: SD.sw });
        AK.icon(side, "check", pad + 12, y + Z.row / 2, 18, SD.fg);
        AK.T(side, c.label, { x: pad + 38, y, w: SW - pad * 2 - 40, h: Z.row, size: Z.fs });
        y += Z.row;
      }
      GX0 = SW;
    }

    // ---------------------------------------------------------------- the week grid
    const gutW = Math.round(LY.gutterW || Math.max(...p.hours.map((s) => AK.measure(s, "caption", Z.small))) + 28);
    const GX = GX0 + gutW, GW = BW - GX - pad * 0.5, colW = GW / nD;
    const dhH = Math.round(Z.lh + Z.lhS * 0.2 + 20);
    const GT = tbH + 1.5 + dhH, GB = BH - 6, hourH = (GB - GT) / nH;
    const grid = svg("g", {}, root);
    const dayHeads = [];
    for (let d = 0; d < nD; d++) {
      const x = GX + d * colW;
      if (d === p.today) AK.box(grid, x, tbH + 1.5, colW, BH - tbH, { r: 0, fill: tones.hover });
      const isT = d === p.today;
      dayHeads.push(AK.T(grid, p.days[d], { x: x + 10, y: tbH + 1.5, w: colW - 20, h: dhH, size: Z.fs, weight: isT ? 700 : 600, color: isT ? T.accent : "ink", align: "center" }));
      AK.box(grid, x, tbH, 1, BH - tbH, { r: 0, fill: tones.hair });
    }
    AK.box(grid, GX0, GT, BW - GX0, 1.5, { r: 0, fill: tones.hair2 });
    for (let k = 0; k < nH; k++) {
      const y = GT + k * hourH;
      if (k) AK.box(grid, GX, y, GW, 1, { r: 0, fill: tones.hair });
      AK.box(grid, GX, y + hourH / 2, GW, 1, { r: 0, fill: tones.hair, opacity: 0.45 });
      AK.T(grid, p.hours[k], { x: GX0 + 6, y: y - Z.lhS / 2 + (k ? 0 : Z.lhS / 2 + 2), w: gutW - 16, h: Z.lhS, size: Z.small, color: "muted", align: "right" });
    }
    const yOf = (h) => GT + (h - S0) * hourH, xOf = (d) => GX + d * colW;
    const slot = (d, h) => ({ x: xOf(d) + 4, y: yOf(h), w: colW - 8, h: hourH / 2 });

    // ---------------------------------------------------------------- events, in lanes where they overlap
    const evs = p.events.map((e, i) => Object.assign({ id: e.id || "e" + i, tone: e.tone || T.accent, guests: [] }, e));
    for (let d = 0; d < nD; d++) {
      const day = evs.filter((e) => e.day === d).sort((a, b) => a.start - b.start || b.end - a.end);
      let cluster = [], cEnd = -1;
      const flush = () => { const lanes = []; for (const e of cluster) { let l = lanes.findIndex((end) => end <= e.start + 1e-6); if (l < 0) { l = lanes.length; lanes.push(0); } lanes[l] = e.end; e.lane = l; } for (const e of cluster) e.lanes = lanes.length; cluster = []; };
      for (const e of day) { if (e.start >= cEnd - 1e-6 && cluster.length) { flush(); cEnd = -1; } cluster.push(e); cEnd = Math.max(cEnd, e.end); }
      if (cluster.length) flush();
    }
    const evG = svg("g", {}, root);
    function drawEvent(parent, e, o) {
      o = o || {};
      const lanes = e.lanes || 1, lw = (colW - 8) / lanes;
      const x = xOf(e.day) + 4 + (e.lane || 0) * lw, y = yOf(e.start) + 2, w = lw - 4;
      // a short event is drawn tall enough for its title (as calendars do), even past its end
      const h = Math.max(hourH * (e.end - e.start) - 4, e.title ? Z.lh + 14 : 18);
      const eg = svg("g", {}, parent);
      AK.box(eg, x, y, w, h, { r: Math.min(T.radius, 8), fill: o.draft ? tones.card : AK.mix("surface", e.tone, 0.2), stroke: o.draft ? e.tone : null, sw: 2 });
      if (o.draft) eg.firstChild.setAttribute("stroke-dasharray", "8 6");
      AK.box(eg, x, y, 5, h, { r: 2.5, fill: e.tone });
      const lh = Z.lh, fits = (n) => h >= n * lh + 14;
      if (e.title && fits(1)) {
        AK.T(eg, e.title, { x: x + 14, y: y + 6, w: w - 22, h: lh, size: Z.small, weight: 700, whole: true });
        if (fits(2)) AK.T(eg, span(e.start, e.end), { x: x + 14, y: y + 6 + lh, w: w - 22, h: lh, size: Z.small, color: "muted", whole: true });
        if (e.where && fits(3)) AK.T(eg, e.where, { x: x + 14, y: y + 6 + 2 * lh, w: w - 22, h: lh, size: Z.small, color: "muted", whole: true });
      }
      return { g: eg, x, y, w, h, e };
    }
    const events = evs.filter((e) => e.day < nD && e.end > S0 && e.start < S0 + nH).map((e) => drawEvent(evG, e));
    const byId = (k) => events.find((q) => q.e.id === k || events.indexOf(q) === k);
    let nowLine = null;
    if (p.now != null && p.today != null && p.now >= S0 && p.now <= S0 + nH) {
      nowLine = svg("g", {}, root);
      AK.box(nowLine, xOf(p.today), yOf(p.now) - 1, colW, 2.5, { r: 1, fill: "neg" });
      svg("circle", { cx: xOf(p.today), cy: yOf(p.now), r: 6, fill: AK.c("neg") }, nowLine);
    }
    // states: loading (a veil with skeleton blocks) and error (a banner)
    const loadG = svg("g", {}, root);
    AK.box(loadG, GX, GT, GW, GB - GT, { r: 0, fill: tones.card, opacity: 0.85 });
    for (let d = 0; d < nD; d++) AK.box(loadG, xOf(d) + 6, yOf(S0 + 1 + (d % 3)), colW - 12, hourH * 1.2, { r: 8, fill: tones.track });
    const errG = svg("g", {}, root);
    {
      const bw = Math.min(GW * 0.7, 900), bh = p.notice ? AK.paraH(p.notice, { size: Z.fs, w: bw - 90, maxLines: 2 }) + 28 : Z.row;
      AK.box(errG, GX + (GW - bw) / 2, GT + pad, bw, bh, { r: T.radius, fill: tones.negWash, stroke: "neg" });
      AK.icon(errG, "circle-alert", GX + (GW - bw) / 2 + 34, GT + pad + bh / 2, 26, "neg");
      if (p.notice) AK.P(errG, p.notice, { x: GX + (GW - bw) / 2 + 64, y: GT + pad + 14, w: bw - 90, size: Z.fs, maxLines: 2 });
    }
    const states = AK.states({ ready: svg("g", {}, root), loading: loadG, error: errG }, p.state || "ready");

    // ---------------------------------------------------------------- popovers (booking form, event details)
    const over = B.over;
    const PW = Math.round(Math.min(600, BW * 0.36));
    const people = p.people || [];
    const chipH = AK.boxH(Z.small, "caption", 600), fieldH = Math.max(Z.ctl, chipH + 12), titleH = AK.boxH(Z.head, "label", 700, fieldH);
    function popover(o) {
      // o: {anchor rect, title, when, where, guests: [names], placeholders, draft}. Returns its parts.
      const rowsN = 3 + (o.where != null || L.where ? 1 : 0);
      const avail = (o.guests || []).filter((n) => people.find((q) => q.name === n));
      const stripH = Z.lh + 18;
      const ph = pad * 1.4 + titleH - fieldH + rowsN * (fieldH + 12) + (avail.length ? Z.lhS + 8 + avail.length * stripH : 0) + Z.ctl + pad * 1.6 + 16;
      const r = o.anchor;
      let x = r.x + r.w + 16;
      if (x + PW > BW - 8) x = r.x - PW - 16;
      x = AK.clamp(x, 8, BW - PW - 8);
      const y = AK.clamp(r.y - 30, tbH + 8, BH - ph - 8);
      const pg = svg("g", { opacity: 0 }, over), box = svg("g", {}, pg);
      AK.box(box, x, y + 8, PW, ph, { r: T.radius + 4, fill: tones.shadow, opacity: 0.14 });
      AK.box(box, x, y, PW, ph, { r: T.radius + 4, fill: "surface", stroke: tones.hair2 });
      AK.icon(box, "x", x + PW - 30, y + 30, 22, "muted");
      let yy = y + pad * 1.2;
      const fx = x + pad + 40, fw = PW - pad * 2 - 40 - 10;
      // the title: a field (to type into) or the event's title
      const titleF = { x: fx - 6, y: yy, w: fw - 30, h: titleH };
      AK.box(box, x + pad + 6, yy + (titleH - 22) / 2, 22, 22, { r: 6, fill: o.tone || T.accent });
      let titleNode = null;
      if (o.typeTitle) {
        AK.box(box, titleF.x, yy, titleF.w, titleH, { r: Math.min(T.radius, 8), fill: tones.card, stroke: T.accent, sw: 2 });
        if (L.title) titleF.ph = AK.T(box, L.title, { x: fx + 8, y: yy, w: titleF.w - 28, h: titleH, size: Z.fs, color: "muted" });
        titleNode = AK.T(box, o.title || "", { role: "label", x: fx + 8, y: yy, w: titleF.w - 28, h: titleH, size: Z.head, weight: 700 });
      } else titleNode = AK.T(box, o.title || "", { role: "label", x: fx, y: yy, w: fw - 30, h: titleH, size: Z.head, weight: 700 });
      yy += titleH + 12;
      AK.icon(box, "clock", x + pad + 17, yy + fieldH / 2, 22, "muted");
      AK.T(box, o.when, { x: fx, y: yy, w: fw, h: fieldH, size: Z.fs });
      yy += fieldH + 12;
      if (o.where != null || L.where) {
        AK.icon(box, "map-pin", x + pad + 17, yy + fieldH / 2, 22, "muted");
        if (o.where) AK.T(box, o.where, { x: fx, y: yy, w: fw, h: fieldH, size: Z.fs });
        else AK.T(box, L.where, { x: fx, y: yy, w: fw, h: fieldH, size: Z.fs, color: "muted" });
        yy += fieldH + 12;
      }
      // guests: avatars and names, then a field to add one
      AK.icon(box, "users", x + pad + 17, yy + fieldH / 2, 22, "muted");
      const gf = { x: fx - 6, y: yy, w: fw, h: fieldH };
      AK.box(box, gf.x, yy, gf.w, fieldH, { r: Math.min(T.radius, 8), fill: tones.page, stroke: tones.hair2 });
      let gx = fx + 6;
      const chips = [];
      for (const n of o.guests || []) {
        const cw = Math.min(AK.measure(n, "caption", Z.small, 600) + 52, fw - (gx - fx) - 10);
        if (cw < 80) break;
        const cg = svg("g", {}, box);
        AK.box(cg, gx, yy + (fieldH - chipH) / 2, cw, chipH, { r: chipH / 2, fill: tones.sel });
        AK.T(cg, n, { x: gx + 12, y: yy + (fieldH - chipH) / 2, w: cw - 24, h: chipH, size: Z.small, weight: 600 });
        chips.push(cg); gx += cw + 8;
      }
      const gph = !(o.guests || []).length && L.guests ? AK.T(box, L.guests, { x: fx + 8, y: yy, w: fw - 20, h: fieldH, size: Z.fs, color: "muted" }) : null;
      yy += fieldH + 14;
      // availability: one strip a guest across the visible hours, busy blocks shaded, this event's slot outlined
      const strips = [];
      if (avail.length) {
        if (L.busy || L.free) {
          let lx = x + pad;
          for (const [lab, fill] of [[L.free, tones.posWash], [L.busy, tones.track]]) {
            if (!lab) continue;
            AK.box(box, lx, yy + (Z.lhS - 16) / 2, 16, 16, { r: 4, fill });
            AK.T(box, lab, { x: lx + 24, y: yy, w: AK.measure(lab, "caption", Z.small) + 6, h: Z.lhS, size: Z.small, color: "muted" });
            lx += AK.measure(lab, "caption", Z.small) + 50;
          }
          yy += Z.lhS + 8;
        }
        const sx = x + pad + 150, sw = PW - pad * 2 - 150;
        for (const n of avail) {
          const P0 = people.find((q) => q.name === n);
          AK.T(box, n, { x: x + pad, y: yy, w: 140, h: stripH - 8, size: Z.small });
          AK.box(box, sx, yy + 6, sw, stripH - 20, { r: 6, fill: tones.posWash });
          for (const [d, a, b] of P0.busy || []) if (d === o.day) AK.box(box, sx + (AK.clamp(a, S0, S0 + nH) - S0) / nH * sw, yy + 6, (AK.clamp(b, S0, S0 + nH) - AK.clamp(a, S0, S0 + nH)) / nH * sw, stripH - 20, { r: 6, fill: tones.track });
          const ring = AK.box(box, sx + (o.start - S0) / nH * sw - 2, yy + 2, Math.max(8, (o.end - o.start) / nH * sw + 4), stripH - 12, { r: 8, fill: "none", stroke: T.accent, sw: 2.5 });
          strips.push({ name: n, ring });
          yy += stripH;
        }
      }
      const save = AK.button(box, x + PW - pad, y + ph - pad - Z.ctl, { label: L.save, icon: "check", kind: "primary", T, Z, align: "right" });
      return { g: pg, box, x, y, w: PW, h: ph, titleF, titleNode, guestField: gf, guestPh: gph, guestX: gx, chips, strips, save };
    }

    // ---------------------------------------------------------------- actions
    const at0 = (t) => (t == null ? Math.max(H.free + 0.4, p.at >= 0 ? p.at + 0.6 : 0.4) : t);
    let open = null;
    const showPop = (P, t) => {
      if (open) AK.hide(open.g, t, 0.12);
      AK.show(P.g, t + 0.05, 0.2);
      Loom.drive((e) => P.box.setAttribute("transform", `translate(0 ${AK.f1(10 * (1 - e))})`), t + 0.05, 0.22, "enter", AK.meta("reveal", "app.popover"));
      open = P;
    };
    const A = {};
    A.slot = slot;
    A.close = function (at) { const t = at0(at); if (open) { AK.hide(open.g, t, 0.15); open = null; } return t + 0.2; };
    A.create = function (ev, at) {
      ev = Object.assign({ tone: T.accent, end: (ev && ev.start) + 1 }, ev || {});
      const e = { id: ev.id || "new", title: ev.title, day: ev.day, start: ev.start, end: ev.end, where: ev.where, tone: ev.tone, lane: 0, lanes: 1 };
      const tp = H.click(slot(ev.day, ev.start), at0(at), { fx: 0.4 });
      const draft = drawEvent(evG, Object.assign({}, e, { title: "" }), { draft: true });
      draft.g.setAttribute("opacity", 0); AK.show(draft.g, tp + 0.08, 0.15);
      const P = popover({ anchor: draft, typeTitle: true, title: ev.title, when: `${p.days[ev.day]}, ${span(ev.start, ev.end)}`, where: ev.where, guests: ev.guests || [], day: ev.day, start: ev.start, end: ev.end, tone: ev.tone });
      showPop(P, tp + 0.15);
      let t = tp + 0.5;
      if (P.titleF.ph) AK.hide(P.titleF.ph, t, 0.1);
      t = AK.type(P.titleNode, t + 0.05, { cps: p.cps, role: "label", size: Z.head, weight: 700, caret: P.box, color: AK.c(T.accent) });
      const ts = H.click(P.save, t + 0.6 + (ev.guests && ev.guests.length ? 1.0 : 0));
      AK.hide(P.g, ts + 0.12, 0.15); open = null;
      AK.hide(draft.g, ts + 0.15, 0.12);
      const made = drawEvent(evG, e);
      made.g.setAttribute("opacity", 0); AK.show(made.g, ts + 0.2, 0.22);
      events.push(made);
      return L.saved ? H.toast(L.saved, ts + 0.45) : ts + 0.5;
    };
    A.drag = function (k, day, start, at) {
      const E = byId(k);
      if (!E) { Loom.error("component_params", `app_calendar.drag: no event "${k}"`); return at0(at); }
      const dur = E.e.end - E.e.start;
      const grab = { x: E.x + Math.min(E.w * 0.5, 80), y: E.y + Math.min(E.h * 0.4, 24) };
      const dx = xOf(day) + 4 - E.x + (E.e.lane || 0) * 0, dy = yOf(start) + 2 - E.y;
      const D = H.drag(grab, { x: grab.x + dx, y: grab.y + dy }, at0(at));
      // the block lifts and follows the hand, then lands snapped to the slot
      const Gd = E.g;
      AK.fade(Gd, 1, 0.85, D.t0 + 0.05, 0.1);
      const t0 = D.t0 + 0.12, d0 = Math.max(0.05, D.t1 - t0);
      Loom.drive((e, raw) => { const q = D.carry(t0 + raw * d0); Gd.setAttribute("transform", `translate(${AK.f1(q.x - grab.x)} ${AK.f1(q.y - grab.y)})`); }, t0, d0, "linear", AK.meta("travel", "app.drag"));
      // it lands: the block is drawn again in its new slot, with its new times
      AK.hide(Gd, D.t1, 0.08);
      E.e = Object.assign({}, E.e, { day, start, end: start + dur, lane: 0, lanes: 1 });
      const N = drawEvent(evG, E.e);
      N.g.setAttribute("opacity", 0); AK.show(N.g, D.t1, 0.1);
      Object.assign(E, { g: N.g, x: N.x, y: N.y, w: N.w, h: N.h, pop: null });
      return L.moved ? H.toast(L.moved, D.t1 + 0.35) : D.t1 + 0.4;
    };
    function details(E) {
      if (!E.pop) E.pop = popover({ anchor: E, title: E.e.title, when: `${p.days[E.e.day]}, ${span(E.e.start, E.e.end)}`, where: E.e.where, guests: E.e.guests || [], day: E.e.day, start: E.e.start, end: E.e.end, tone: E.e.tone });
      return E.pop;
    }
    A.open = function (k, at) {
      const E = byId(k);
      if (!E) { Loom.error("component_params", `app_calendar.open: no event "${k}"`); return at0(at); }
      const tp = H.click(E, at0(at), { fx: 0.4, fy: 0.3 });
      showPop(details(E), tp + 0.1);
      return tp + 0.45;
    };
    A.invite = function (k, name, at, o) {
      const E = byId(k);
      if (!E) { Loom.error("component_params", `app_calendar.invite: no event "${k}"`); return at0(at); }
      let t = at0(at);
      if (open !== E.pop || !open) t = A.open(k, t) + 0.3;
      const P = details(E), gf = P.guestField;
      const tp = H.click({ x: P.guestX, y: gf.y, w: Math.max(60, gf.x + gf.w - P.guestX), h: gf.h }, t, { fx: 0.2 });
      if (P.guestPh) AK.hide(P.guestPh, tp + 0.1, 0.1);
      const cw = Math.min(AK.measure(name, "caption", Z.small, 600) + 52, gf.x + gf.w - P.guestX - 8);
      const cg = svg("g", {}, P.box);
      const chipBg = AK.box(cg, P.guestX, gf.y + (gf.h - chipH) / 2, cw, chipH, { r: chipH / 2, fill: tones.sel, opacity: 0 });
      const nn = AK.T(cg, name, { x: P.guestX + 12, y: gf.y + (gf.h - chipH) / 2, w: cw - 24, h: chipH, size: Z.small, weight: 600 });
      const te = AK.type(nn, tp + 0.2, { cps: p.cps, size: Z.small, weight: 600, caret: P.box, color: AK.c(T.accent) });
      AK.show(chipBg, te + 0.1, 0.15);
      if (o && o.send === false) return te + 0.3;   // left open: the scene closes it (close) or saves it later
      const ts = H.click(P.save, te + 0.6);
      AK.hide(P.g, ts + 0.12, 0.15); open = null;
      return L.sent ? H.toast(L.sent, ts + 0.4) : ts + 0.45;
    };
    A.setState = function (name, at) { return states.set(name, at0(at)); };
    A.state = A.setState;
    AK.reveal(g, p.at);
    AK.runSteps(A, p.steps, { create: ["event", "at"], drag: ["id", "day", "start", "at"], open: ["id", "at"], invite: ["id", "name", "at", "opts"], close: ["at"], state: ["state", "at"] });
    return Object.assign({ host: H, toolbar: tb, sidebar: side, grid, dayHeads, events, nowLine, popover: () => open, states }, A);
  },
});
