// T-150 app_chat_workspace: a generic team chat shell (hand-off sheet, Family M). Built on runtime/components/_app_kit.js.
// Extends the existing ui.chat artefact (runtime/ui_artefacts.js: one conversation of bubbles) into a whole workspace:
// channels, threads, mentions, reactions and file cards, with scriptable actions.
Loom.component("app_chat_workspace", {
  version: 1,
  idea: "A team chat workspace: channels and direct messages, a channel's conversation with mentions, reactions, file cards and threads, and a composer, walked through by a pointer that opens a channel, posts, reacts and opens a thread.",
  outline: ["window (or the screencast engine's app window)", "sidebar: workspace name, channel and direct message lists with unread and mention counts", "channel header: name and topic", "messages: avatar, author, time, text with mentions, file card, reactions, thread link", "composer", "thread pane (opened by an action)", "pointer"],
  family: "ui",
  tags: ["chat", "team chat", "messaging", "channels", "threads", "mentions", "reactions", "collaboration", "screencast", "remote work"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-150)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop"],   // a product UI: the styles that show products as screens (D-193)
  params: {
    channels: { type: "list", content: true },   // [{id, label, kind: "channel"|"private"|"dm", unread, mention, topic, messages: [...]}]
                                                 // a message: {id, author, time, text ("@Name" is a mention), file: {name, size, icon},
                                                 // reactions: [{icon, count, mine}], thread: {label, replies: [{author, time, text}]}}
    channel: { type: "str" },                    // the open channel's id (the first when omitted)
    workspace: { type: "str" },                  // the workspace's name at the top of the sidebar (none when omitted)
    me: { type: "str" },                         // the learner's name: the author of posted messages
    title: { type: "str" },
    labels: { type: "obj" },                     // the product's own words, each optional: {channels, dms, composer, thread, search, send}
    state: { type: "enum", choices: ["ready", "loading", "empty", "error"], default: "ready" },
    notice: { type: "str" },                     // the words of the empty or error state (none when omitted)
    steps: { type: "list", default: [] },        // [{do: "openChannel"|"post"|"react"|"thread"|"state", at, ...}]
    theme: { type: "obj", default: {} }, layout: { type: "obj", default: {} },   // layout: {sidebarW, threadW}
    w: { type: "number", default: 1728 }, h: { type: "number", default: 856 },
    at: { type: "number", default: -1 }, cps: { type: "number", default: 14 },
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["host", "sidebar", "channelRows", "views", "messages", "composer", "threadPane", "states",
    "openChannel(id, at)", "post(text, at)", "react(i, icon, at)", "thread(i, at)", "setState(name, at)"],
  example: 'ctx.use("app_chat_workspace", { workspace: "Riverside Clinic", me: "Sam Lee", channels: [{ id: "rota", label: "night-rota", topic: "Shift swaps and cover", messages: [{ author: "Jo Park", time: "18:02", text: "@Sam Lee can you cover Thursday?" }] }], labels: { composer: "Message night-rota" }, steps: [{ do: "post", text: "Yes, I can cover it.", at: ctx.cue("reply in the channel") }] }, { x: 96, y: 78, name: "chat" })',
  size: (p) => ({ w: p.w, h: p.h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, svg = (t, a, q) => Loom.svg(t, a, q);
    const T = AK.theme(Object.assign({ sidebar: "surface2" }, p.theme)), Z = AK.sizes(T), tones = AK.tones(T), L = p.labels || {}, LY = p.layout || {};
    const H = AK.host(ctx, g, p, { T, Z, title: p.title });
    const B = H.body, BW = B.w, BH = B.h, pad = Z.pad, root = B.g;
    const chans = p.channels.map((c, i) => Object.assign({ id: c.id || "c" + i, kind: "channel" }, c));
    const cIdx = (k) => (typeof k === "number" ? k : chans.findIndex((c) => c.id === k));
    let active = p.channel ? Math.max(0, cIdx(p.channel)) : 0;
    AK.box(root, 0, 0, BW, BH, { r: 0, fill: tones.card });

    // ---------------------------------------------------------------- sidebar
    const SW = Math.round(LY.sidebarW || AK.clamp(BW * 0.18, 260, 340));
    const side = svg("g", {}, root);
    AK.box(side, 0, 0, SW, BH, { r: 0, fill: tones.side });
    AK.box(side, SW - 1, 0, 1.5, BH, { r: 0, fill: tones.hair2 });
    let y = pad * 0.6;
    if (p.workspace) {
      AK.T(side, p.workspace, { role: "label", x: pad, y, w: SW - 2 * pad, h: Z.lhH + 10, size: Z.head, weight: 700 });
      y += Z.lhH + 10;
      AK.box(side, 0, y + pad * 0.5, SW, 1.5, { r: 0, fill: tones.hair });
      y += pad;
    }
    const rowH = AK.boxH(Z.fs, "caption", 700, Math.round(Math.max(Z.lh + 14, 46) * T.density)), PH = AK.boxH(Z.small, "caption", 700);
    const groups = [["channels", chans.filter((c) => c.kind !== "dm")], ["dms", chans.filter((c) => c.kind === "dm")]];
    const channelRows = [];
    for (const [key, list] of groups) {
      if (!list.length) continue;
      if (L[key]) { AK.T(side, L[key], { x: pad, y, w: SW - 2 * pad, h: Z.lhS + 6, size: Z.small, weight: 600, color: "muted" }); y += Z.lhS + 8; }
      else y += 8;
      for (const c of list) {
        if (y + rowH > BH - 6) break;
        const i = chans.indexOf(c), x = 8, w = SW - 16, rg = svg("g", {}, side);
        const sel = AK.box(rg, x, y, w, rowH, { r: Math.min(T.radius, 8), fill: tones.sel, opacity: i === active ? 1 : 0 });
        let lx = x + 46;
        if (c.kind === "dm") { const av = AK.avatar(rg, x + 24, y + rowH / 2, 15, c.label); lx = Math.max(lx, x + 24 + av.__r + 10); }
        else AK.icon(rg, c.kind === "private" ? "lock" : "hash", x + 24, y + rowH / 2, 22, i === active ? T.accent : "muted");
        let badgeW = 0, badge = null;
        if (c.mention) {
          const s = String(c.mention);
          badge = AK.pill(rg, x + w - 8, y + (rowH - PH) / 2, s, { size: Z.small, fill: AK.solid("neg").fill, stroke: AK.solid("neg").stroke, sw: AK.solid("neg").sw, color: AK.solid("neg").fg, weight: 700, align: "right", h: PH });
          badgeW = badge.w + 10;
        }
        const bold = !!(c.unread || c.mention) && i !== active;
        const lbB = AK.T(rg, c.label, { x: lx, y, w: w - (lx - x) - badgeW - 6, h: rowH, size: Z.fs, weight: 700, color: i === active ? T.accent : "ink" });
        const lbR = AK.T(rg, c.label, { x: lx, y, w: w - (lx - x) - badgeW - 6, h: rowH, size: Z.fs, weight: 400, color: i === active ? T.accent : "muted" });
        (bold ? lbR : lbB).setAttribute("opacity", 0);
        channelRows[i] = { g: rg, x, y, w, h: rowH, sel, badge, lbB, lbR, bold, c };
        y += rowH + 2;
      }
      y += pad * 0.5;
    }

    // ---------------------------------------------------------------- the channel views (header, messages); one each
    const MX = SW, MW = BW - SW;
    const hdrH = Math.round(Math.max(Z.lhH + Z.lhS + 18, 64));
    const compH = AK.boxH(Z.fs, "caption", 400, Math.round(Z.lh + 30));
    const compY = BH - pad - compH;
    const areaTop = hdrH + 1, areaBot = compY - pad * 0.6;
    // a conversation's geometry for a main-area width (the thread pane narrows it)
    const geo = (mw) => ({ mw, tx: MX + pad + 66, tw: mw - 66 - pad * 2.5 });
    const G0 = geo(MW), tx = G0.tx, tw = G0.tw;
    const mentionStyles = { plain: {}, mention: { weight: 700, color: T.accent, wash: tones.sel } };
    const runsOf = (text) => String(text).split(/(@[\w.-]*\w)/).filter(Boolean).map((s) => ({ text: s, style: /^@/.test(s) ? "mention" : "plain" }));
    // measure, then draw: a message's block height from its parts
    const reactH = PH + 8;
    function measureMsg(m, G) {
      const tw = (G || G0).tw;
      const lines = AK.layoutRuns(runsOf(m.text || ""), { size: Z.fs, w: tw, styles: mentionStyles });
      const nl = Math.min(lines.length, 6);
      let h = Z.lh + nl * Z.lh + 10;
      if (m.file) h += Z.row + 14;
      if (m.reactions && m.reactions.length) h += reactH + 6;
      if (m.thread) h += Z.lh + 6;
      return { lines: lines.slice(0, nl), h: Math.max(h, 56) + pad * 0.6 };
    }
    const clipId = Loom.uid ? Loom.uid("chatclip") : "chatclip";
    const cp = svg("clipPath", { id: clipId }, root);
    svg("rect", { x: MX, y: areaTop, width: MW, height: areaBot - areaTop }, cp);
    function drawReactions(gg, list, x, y0) {
      let rx = x; const pills = [];
      for (const r of list) {
        const pl = AK.pill(gg, rx, y0, String(r.count == null ? 1 : r.count), { size: Z.small, icon: r.icon || "thumbs-up", fill: r.mine ? tones.sel : tones.page, stroke: r.mine ? T.accent : tones.hair2, weight: 600, h: PH, color: "ink" });
        pills.push(Object.assign(pl, { r }));
        rx += pl.w + 8;
      }
      return { pills, x: rx };
    }
    function drawMessage(gg, m, y0, G) {
      G = G || G0;
      const tx = G.tx, tw = G.tw, MW = G.mw;
      const M = measureMsg(m, G), mg = svg("g", {}, gg), body = svg("g", {}, mg);
      const hover = AK.box(body, MX + 8, y0, MW - 16, M.h - 4, { r: Math.min(T.radius, 8), fill: tones.hover, opacity: 0 });
      AK.avatar(body, MX + pad + 26, y0 + 8 + 22, 22, m.author);
      const tmW = m.time ? Math.ceil(AK.measure(m.time, "caption", Z.small) + 4) : 0;
      const auW = Math.min(AK.measure(m.author || "", "caption", Z.fs, 700) + 6, tw - tmW - 16);
      AK.T(body, m.author || "", { x: tx, y: y0 + 6, w: auW, h: Z.lh, size: Z.fs, weight: 700 });
      if (m.time) AK.T(body, m.time, { x: tx + auW + 10, y: y0 + 6, w: tmW, h: Z.lh, size: Z.small, color: "muted" });
      let yy = y0 + 6 + Z.lh;
      const R = AK.drawRuns(body, M.lines, { x: tx, y: yy, size: Z.fs, styles: mentionStyles });
      yy += R.h + 6;
      let file = null;
      if (m.file) {
        const fw = Math.min(tw, 520), fg = svg("g", {}, body);
        AK.box(fg, tx, yy + 4, fw, Z.row, { r: T.radius, fill: tones.page, stroke: tones.hair2 });
        AK.box(fg, tx + 12, yy + 14, Z.row - 20, Z.row - 20, { r: 8, fill: tones.sel });
        AK.icon(fg, m.file.icon || "file-text", tx + 12 + (Z.row - 20) / 2, yy + 4 + Z.row / 2, 24, T.accent);
        const szW = m.file.size ? Math.ceil(AK.measure(m.file.size, "caption", Z.small) + 4) : 0;
        AK.T(fg, m.file.name || "", { x: tx + Z.row, y: yy + 4, w: fw - Z.row - szW - 24, h: Z.row, size: Z.fs, weight: 600 });
        if (m.file.size) AK.T(fg, m.file.size, { x: tx + fw - 14 - szW, y: yy + 4, w: szW, h: Z.row, size: Z.small, color: "muted", align: "right" });
        file = fg; yy += Z.row + 14;
      }
      const rg = svg("g", {}, body);
      let reacts = { pills: [], x: tx };
      if (m.reactions && m.reactions.length) { reacts = drawReactions(rg, m.reactions, tx, yy); yy += reactH + 6; }
      let threadLink = null;
      if (m.thread) {
        threadLink = svg("g", {}, body);
        AK.icon(threadLink, "message-square", tx + 12, yy + Z.lh / 2, 20, T.accent);
        AK.T(threadLink, m.thread.label || "", { x: tx + 32, y: yy, w: tw - 40, h: Z.lh, size: Z.small, weight: 700, color: T.accent });
        threadLink.__r = { x: tx, y: yy, w: Math.min(tw, 60 + AK.measure(m.thread.label || "", "caption", Z.small, 700)), h: Z.lh };
      }
      return { g: mg, body, y: y0, h: M.h, m, hover, reacts, reactY: m.reactions && m.reactions.length ? y0 + M.h - pad * 0.6 - (m.thread ? Z.lh + 6 : 0) - reactH - 6 : null, rg, threadLink, file, shift: 0 };
    }
    function layoutList(area, ms, G) {
      const hs = ms.map((m) => measureMsg(m, G).h);
      let first = ms.length, tot = 0;
      while (first > 0 && tot + hs[first - 1] <= areaBot - areaTop - 8) { first--; tot += hs[first]; }
      let yy = areaBot - tot;
      const list = [];
      for (let k = first; k < ms.length; k++) { list.push(Object.assign(drawMessage(area, ms[k], yy, G), { index: k })); yy += hs[k]; }
      return { list, first };
    }
    const views = chans.map((c, i) => {
      if (i !== active && !c.messages) return null;
      const vg = svg("g", { opacity: i === active ? 1 : 0 }, root);
      // header
      const hg = svg("g", {}, vg);
      AK.icon(hg, c.kind === "dm" ? "at-sign" : c.kind === "private" ? "lock" : "hash", MX + pad + 14, pad * 0.5 + Z.lhH / 2 + 4, 24, "ink");
      AK.T(hg, c.label, { role: "label", x: MX + pad + 36, y: pad * 0.5 + 4, w: MW - 2 * pad - 40, h: Z.lhH, size: Z.head, weight: 700 });
      if (c.topic) AK.T(hg, c.topic, { x: MX + pad, y: pad * 0.5 + 4 + Z.lhH, w: MW - 2 * pad, h: Z.lhS, size: Z.small, color: "muted" });
      AK.box(vg, MX, hdrH, MW, 1.5, { r: 0, fill: tones.hair });
      // messages, bottom-anchored: the latest that fit
      const area = svg("g", { "clip-path": `url(#${clipId})` }, vg);
      const data = (c.messages || []).map((m, k) => Object.assign({ id: m.id || `${c.id}.${k}` }, m, { reactions: (m.reactions || []).map((r) => Object.assign({}, r)) }));
      const L0 = layoutList(area, data, G0);
      return { g: vg, area, msgs: L0.list, hidden: L0.first, c, data };
    });

    // ---------------------------------------------------------------- composer, states, thread pane
    const comp = svg("g", {}, root);
    const compBar = (cg, mw) => {
      AK.box(cg, MX + pad, compY, mw - 2 * pad, compH, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
      AK.icon(cg, "plus", MX + pad + 28, compY + compH / 2, 24, "muted");
      AK.icon(cg, "send-horizontal", MX + mw - pad - compH / 2, compY + compH / 2, 24, T.accent);
      return L.composer ? AK.T(cg, L.composer, { x: MX + pad + 54, y: compY, w: mw - 2 * pad - 54 - compH - 8, h: compH, size: Z.fs, color: "muted" }) : null;
    };
    const compWide = svg("g", {}, comp), compNarrow = svg("g", { opacity: 0 }, comp);
    const compRing = AK.box(comp, MX + pad - 2, compY - 2, MW - 2 * pad + 4, compH + 4, { r: T.radius + 2, fill: "none", stroke: T.accent, sw: 2.5, opacity: 0 });
    const cTx = MX + pad + 54;
    const compPh = compBar(compWide, MW);
    const stG = svg("g", {}, root);
    const centre = (gg, icon, tone) => {
      AK.icon(gg, icon, MX + MW / 2, areaTop + (areaBot - areaTop) * 0.38, 60, tone || "muted");
      if (p.notice) AK.P(gg, p.notice, { x: MX + MW * 0.2, y: areaTop + (areaBot - areaTop) * 0.38 + 50, w: MW * 0.6, size: Z.fs, maxLines: 3, color: "muted" });
    };
    const loadG = svg("g", {}, stG);
    AK.box(loadG, MX, areaTop, MW, areaBot - areaTop, { r: 0, fill: tones.card });
    for (let k = 0; k < 5; k++) {
      const yy = areaTop + pad + k * (Z.lh * 2 + pad * 1.4);
      if (yy + Z.lh * 2 > areaBot) break;
      svg("circle", { cx: MX + pad + 26, cy: yy + 22, r: 22, fill: tones.track }, loadG);
      AK.box(loadG, tx, yy + 4, tw * 0.25, Z.lh - 10, { r: 6, fill: tones.track });
      AK.box(loadG, tx, yy + Z.lh + 4, tw * (0.5 + 0.08 * (k % 3)), Z.lh - 10, { r: 6, fill: tones.track, opacity: 0.7 });
    }
    const emptyG = svg("g", {}, stG); AK.box(emptyG, MX, areaTop, MW, areaBot - areaTop, { r: 0, fill: tones.card }); centre(emptyG, "messages-square");
    const errG = svg("g", {}, stG); AK.box(errG, MX, areaTop, MW, areaBot - areaTop, { r: 0, fill: tones.card }); centre(errG, "wifi-off", "neg");
    const readyG = svg("g", {}, stG);
    const states = AK.states({ ready: readyG, loading: loadG, empty: emptyG, error: errG }, p.state || "ready");

    const TW = Math.round(LY.threadW || AK.clamp(MW * 0.42, 420, 640)), TX = BW - TW;
    const compPhN = compBar(compNarrow, MW - TW);
    const compRingN = AK.box(comp, MX + pad - 2, compY - 2, MW - TW - 2 * pad + 4, compH + 4, { r: T.radius + 2, fill: "none", stroke: T.accent, sw: 2.5, opacity: 0 });
    let narrowed = false;
    const thG = svg("g", { opacity: 0 }, B.over), thBox = svg("g", {}, thG), thViews = [];
    AK.box(thBox, TX, 0, TW, BH, { r: 0, fill: tones.card });
    AK.box(thBox, TX, 0, 1.5, BH, { r: 0, fill: tones.hair2 });
    AK.icon(thBox, "messages-square", TX + pad + 12, hdrH / 2, 24, "ink");
    if (L.thread) AK.T(thBox, L.thread, { role: "label", x: TX + pad + 34, y: (hdrH - Z.lhH) / 2, w: TW - 2 * pad - 80, h: Z.lhH, size: Z.head, weight: 700 });
    AK.icon(thBox, "x", TX + TW - pad - 12, hdrH / 2, 22, "muted");
    AK.box(thBox, TX, hdrH, TW, 1.5, { r: 0, fill: tones.hair });

    // ---------------------------------------------------------------- actions
    const at0 = (t) => (t == null ? Math.max(H.free + 0.4, p.at >= 0 ? p.at + 0.6 : 0.4) : t);
    const V = () => views[active];
    const msgAt = (i) => { const v = V(); return v && v.msgs.find((m) => m.index === i || m.m.id === i); };
    const shiftAbove = (v, k, dh, t) => { for (const m of v.msgs) if (m.index <= k) { m.shift -= dh; AK.shift(m.g, 0, m.shift, t, 0.3); } };
    const A = {};
    A.openChannel = function (k, at) {
      const i = cIdx(k), R = channelRows[i];
      if (!R || !views[i]) { Loom.error("component_params", `app_chat_workspace.openChannel: channel "${k}" has no row or no messages`); return at0(at); }
      const tp = H.click(R, at0(at));
      const P0 = channelRows[active];
      if (P0) { AK.hide(P0.sel, tp + 0.05, 0.15); }
      AK.show(R.sel, tp + 0.05, 0.18);
      if (R.bold) { AK.hide(R.lbB, tp + 0.1, 0.15); AK.show(R.lbR, tp + 0.1, 0.15); R.bold = false; }
      if (R.badge) AK.hide(R.badge.g, tp + 0.1, 0.15);
      if (V()) AK.hide(V().g, tp + 0.08, 0.15);
      AK.show(views[i].g, tp + 0.15, 0.25);
      active = i;
      return tp + 0.45;
    };
    A.post = function (text, at) {
      // the composer as it is now: full width, or beside an open thread
      const mw = narrowed ? MW - TW : MW, G = geo(mw), ring = narrowed ? compRingN : compRing, ph = narrowed ? compPhN : compPh;
      const tw2 = mw - 2 * pad - 54 - compH - 8, send = { x: MX + mw - pad - compH, y: compY, w: compH, h: compH };
      const tp = H.click({ x: cTx, y: compY, w: tw2, h: compH }, at0(at), { fx: 0.3 });
      AK.show(ring, tp + 0.05, 0.15);
      if (ph) AK.hide(ph, tp + 0.25, 0.1);
      // its own group: the composer's hidden rings (wide and narrow) are not the box it sits on
      const tn = AK.T(svg("g", {}, comp), text, { x: cTx, y: compY, w: tw2, h: compH, size: Z.fs });
      const te = AK.type(tn, tp + 0.3, { cps: p.cps, size: Z.fs, caret: comp, color: AK.c(T.accent) });
      const ts = H.click(send, te + 0.4, { fx: 0.5 });
      AK.hide(tn, ts + 0.1, 0.1);
      if (ph) AK.show(ph, ts + 0.2, 0.15);
      AK.hide(ring, ts + 0.3, 0.2);
      const v = V();
      if (!v) return ts + 0.3;
      const m = { author: p.me || "", time: "", text };
      v.data.push(m);
      const nh = measureMsg(m, G).h;
      shiftAbove(v, Infinity, nh, ts + 0.12);
      const nm = drawMessage(v.area, m, areaBot - nh, G);
      nm.g.setAttribute("opacity", 0);
      AK.show(nm.g, ts + 0.25, 0.25);
      Loom.drive((e) => nm.body.setAttribute("transform", `translate(0 ${AK.f1(16 * (1 - e))})`), ts + 0.25, 0.3, "enter", AK.meta("reveal", "app.post"));
      v.msgs.push(Object.assign(nm, { index: v.msgs.length ? v.msgs[v.msgs.length - 1].index + 1 : 0 }));
      Loom.sfx && Loom.sfx("pop", ts + 0.25, { g: 0.3 });
      return ts + 0.6;
    };
    const PICK = ["thumbs-up", "heart", "party-popper", "circle-check", "eye", "laugh"];
    A.react = function (i, icon, at) {
      const M = msgAt(i), v = V();
      if (!M) { Loom.error("component_params", `app_chat_workspace.react: message ${i} is not on screen`); return at0(at); }
      icon = icon || "thumbs-up";
      const t0 = at0(at);
      const yT = M.y + M.shift;
      // hover: the message lights and its toolbar appears at its top right
      const tbx = MX + MW - pad - 120, tby = yT - 6;
      const tb = svg("g", { opacity: 0 }, B.over);
      AK.box(tb, tbx, tby, 104, 48, { r: 10, fill: "surface", stroke: tones.hair2 });
      AK.icon(tb, "smile-plus", tbx + 28, tby + 24, 24, "muted");
      AK.icon(tb, "message-square", tbx + 76, tby + 24, 22, "muted");
      const ta = H.move({ x: MX + MW * 0.45, y: yT + 10, w: 40, h: 30 }, t0 - 0.5);
      AK.show(M.hover, ta, 0.12); AK.show(tb, ta, 0.12);
      const tp = H.click({ x: tbx + 8, y: tby + 4, w: 40, h: 40 }, Math.max(t0, ta + 0.4), { fx: 0.5 });
      // the picker
      const pk = svg("g", { opacity: 0 }, B.over), pw = PICK.length * 52 + 16, px = tbx + 104 - pw, py = tby + 54;
      AK.box(pk, px, py + 4, pw, 64, { r: 12, fill: tones.shadow, opacity: 0.12 });
      AK.box(pk, px, py, pw, 64, { r: 12, fill: "surface", stroke: tones.hair2 });
      const order = [icon].concat(PICK.filter((x) => x !== icon)).slice(0, PICK.length);
      order.forEach((ic, k) => AK.icon(pk, ic, px + 16 + 26 + k * 52, py + 32, 28, k === 0 ? T.accent : "ink"));
      AK.show(pk, tp + 0.12, 0.15);
      const tc = H.click({ x: px + 16, y: py + 6, w: 52, h: 52 }, tp + 0.9, { fx: 0.5 });
      AK.hide(pk, tc + 0.12, 0.15); AK.hide(tb, tc + 0.12, 0.15); AK.hide(M.hover, tc + 0.4, 0.2);
      const dr = M.m.reactions = M.m.reactions || [], dx = dr.find((q) => q.icon === icon);
      if (dx) { if (!dx.mine) dx.count = Number(dx.count == null ? 1 : dx.count) + 1; dx.mine = true; } else dr.push({ icon, count: 1, mine: true });
      const ex = M.reacts.pills.find((q) => q.r.icon === icon);
      if (ex) {
        AK.hide(ex.g, tc + 0.15, 0.1);
        const n = Number(ex.r.count == null ? 1 : ex.r.count) + (ex.r.mine ? 0 : 1);
        const np = AK.pill(M.rg, ex.x, ex.y, String(n), { size: Z.small, icon, fill: tones.sel, stroke: T.accent, weight: 600, h: PH, color: "ink" });
        np.g.setAttribute("opacity", 0); AK.show(np.g, tc + 0.18, 0.15);
      } else {
        const fresh = !M.reacts.pills.length;
        let ry = M.reactY;
        if (fresh) {
          // a first reaction adds a row: this message and those above it move up to make room (the list is bottom-anchored)
          const dh = reactH + 6;
          shiftAbove(v, M.index, dh, tc + 0.12);
          for (const q of v.msgs) if (q.index > M.index) { /* below: unchanged */ }
          ry = M.y + M.h - pad * 0.6 - (M.m.thread ? Z.lh + 6 : 0);
          if (M.threadLink) { AK.shift(M.threadLink, 0, dh, tc + 0.12, 0.3); M.threadLink.__r.y += dh; }
        }
        const np = AK.pill(M.rg, M.reacts.x, ry, "1", { size: Z.small, icon, fill: tones.sel, stroke: T.accent, weight: 600, h: PH, color: "ink" });
        np.g.setAttribute("opacity", 0); AK.show(np.g, tc + 0.3, 0.18);
        M.reacts.pills.push(Object.assign(np, { r: { icon, count: 1, mine: true } })); M.reacts.x += np.w + 8;
      }
      Loom.sfx && Loom.sfx("pop", tc + 0.2, { g: 0.3 });
      return tc + 0.5;
    };
    A.thread = function (i, at) {
      const M = msgAt(i);
      if (!M || !M.threadLink) { Loom.error("component_params", `app_chat_workspace.thread: message ${i} has no thread on screen`); return at0(at); }
      const r = M.threadLink.__r;
      const tp = H.click({ x: r.x, y: r.y + M.shift, w: r.w, h: r.h }, at0(at), { fx: 0.3 });
      // the thread: the parent message, then its replies (the latest that fit)
      const tg = svg("g", {}, thBox);
      let yy = hdrH + pad;
      const one = (m, bold) => {
        const lines = AK.layoutRuns(runsOf(m.text || ""), { size: Z.fs, w: TW - 2 * pad - 66, styles: mentionStyles }).slice(0, bold ? 4 : 3);
        const need = Z.lh + lines.length * Z.lh + pad;
        if (yy + need > BH - pad - compH - 10) return false;
        AK.avatar(tg, TX + pad + 22, yy + 22, 20, m.author);
        const tmW = m.time ? Math.ceil(AK.measure(m.time, "caption", Z.small) + 4) : 0;
        const auW = Math.min(AK.measure(m.author || "", "caption", Z.fs, 700) + 6, TW - 2 * pad - 66 - tmW - 12);
        AK.T(tg, m.author || "", { x: TX + pad + 56, y: yy, w: auW, h: Z.lh, size: Z.fs, weight: 700 });
        if (m.time) AK.T(tg, m.time, { x: TX + pad + 56 + auW + 8, y: yy, w: tmW, h: Z.lh, size: Z.small, color: "muted" });
        AK.drawRuns(tg, lines, { x: TX + pad + 56, y: yy + Z.lh, size: Z.fs, styles: mentionStyles });
        yy += need;
        return true;
      };
      one(M.m, true);
      AK.box(tg, TX + pad, yy - pad * 0.4, TW - 2 * pad, 1.5, { r: 0, fill: tones.hair });
      for (const rp of (M.m.thread.replies || [])) if (!one(rp)) break;
      const rc = svg("g", {}, tg);
      AK.box(rc, TX + pad, BH - pad - compH, TW - 2 * pad, compH, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
      AK.icon(rc, "send-horizontal", TX + TW - pad - compH / 2, BH - pad - compH / 2, 24, T.accent);
      // the conversation reflows beside the thread: redrawn at the narrower width, cross-faded
      const v = V();
      if (v && !v.narrow) {
        const G1 = geo(MW - TW), na = svg("g", { "clip-path": `url(#${clipId})`, opacity: 0 }, v.g);
        v.narrow = layoutList(na, v.data, G1);
        AK.hide(v.area, tp + 0.1, 0.15); AK.show(na, tp + 0.15, 0.2);
        AK.hide(compWide, tp + 0.1, 0.15); AK.show(compNarrow, tp + 0.15, 0.2);
        v.area = na; v.msgs = v.narrow.list;
        narrowed = true;
      }
      thViews.forEach((q) => AK.hide(q, tp + 0.1, 0.1));
      thViews.push(tg);
      if (thViews.length > 1) { tg.setAttribute("opacity", 0); AK.show(tg, tp + 0.15, 0.2); }
      AK.show(thG, tp + 0.1, 0.25);
      Loom.drive((e) => thBox.setAttribute("transform", `translate(${AK.f1(TW * 0.25 * (1 - e))} 0)`), tp + 0.1, 0.32, "enter", AK.meta("reveal", "app.thread"));
      return tp + 0.5;
    };
    A.setState = function (name, at) { return states.set(name, at0(at)); };
    A.state = A.setState;
    AK.reveal(g, p.at);
    AK.runSteps(A, p.steps, { openChannel: ["channel", "at"], post: ["text", "at"], react: ["i", "icon", "at"], thread: ["i", "at"], state: ["state", "at"] });
    return Object.assign({ host: H, sidebar: side, channelRows, views, messages: views[active] ? views[active].msgs : [], composer: comp, threadPane: thG, states }, A);
  },
});
