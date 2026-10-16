/* Loom UI artefacts (D-100): the real thing a workplace lesson is about, drawn faithfully.
 *
 * Built from a reference board (docs/references/ui/mail-chat-doc.md: the reading pane, inbox list and chat
 * layouts that mail and chat clients share), not from memory: the step 7 email was grey bars where the sender,
 * address and body should be (L-172). Product-neutral on purpose: no vendor logo, colour or trade dress, so a
 * lesson never imitates a real brand; the client's own brand comes in through the pack and brand tokens.
 *
 *   const A = Loom.ui.mail(ctx, "msg", {x, y, w, h, subject, from: {name, address}, to, time, banner, paragraphs,
 *                                       link: {text, href}, button: {label}, attachment: {name, size}, report: true})
 *   const L = Loom.ui.inbox(ctx, "inbox", {x, y, w, h, rows: [{from, subject, preview, time, unread, attachment}]})
 *   const C = Loom.ui.chat(ctx, "chat", {x, y, w, h, title, messages: [{side: "them"|"me", name, text, time}]})
 *   const D = Loom.ui.doc(ctx, "doc", {x, y, w, h, title, meta, paragraphs})
 *
 * Every artefact returns {E, parts}: `parts[key]` = {x, y, w, h} in the artefact's local coordinates, so tags,
 * strings and highlights attach to the real sender, address, link, button or paragraph (ui.at(A, key) gives
 * station coordinates). `display` (default 1) is the scale the artefact will be SEEN at: type grows by 1/display
 * so it still reads on screen (the film check measures it). Reveal with ui.build(A, t, {order, gap}) or reveal
 * parts yourself (A.nodes[key]). Every word comes from the caller: there is no sample text.
 */
// @capability ui_artefacts | ui | Loom.ui.mail, inbox, chat, doc; ui.build, mark, card, wire | UI artefacts | the real thing a workplace lesson is about (an email, an inbox, a chat, a page), every word real
(function () {
  "use strict";
  const Loom = window.Loom;
  const K = () => Loom.kit;
  const S = () => Loom.style;
  const ui = (Loom.ui = Loom.ui || {});
  const svg = (t, a, p, x) => Loom.svg(t, a, p, x);
  const fit = (str, role, size, w, lines, weight) => K().fit(str, { role, size, w, maxLines: lines || 1, weight });

  // screen sizes at display 1 (1080p), never below the film check's floor (26 px warn)
  const SZ = { title: 46, subject: 44, name: 34, body: 32, meta: 27, chip: 27, small: 26 };
  // each size lives in a pack type role, so a pack's type range still governs it (a size outside the role's range is clamped)
  const ROLE = { title: "lead", subject: "lead", name: "lead", body: "body", meta: "label", chip: "label", small: "label" };
  const sz = (o, k) => S().size(ROLE[k], Math.round(SZ[k] / Math.max(0.35, Math.min(1, o.display || 1))));

  function initials(name) {   // "Dana Okafor" -> DO; "IT support" -> I (a team name, as mail clients show it)
    const w = String(name || "?").trim().split(/\s+/), last = w.length > 1 ? w[w.length - 1] : "";
    return ((w[0] || "?")[0] + (last && /^[A-Z]/.test(last) ? last[0] : "")).toUpperCase();
  }
  function toneOf(name) {   // deterministic avatar tone from the name (no randomness, rule 3)
    let h = 0; for (const c of String(name || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    // the pack's roles.avatar (A4 proof 2026-10-08: a sender hashed onto the accent put amber or orange on an avatar,
    // which noir and glow-flat keep for the move), else the four accents as before
    const T = S().roleList("avatar", ["accent", "accent3", "accent4", "accent2"]);
    return T[h % T.length];
  }
  function avatar(g, cx, cy, r, name, toneIn) {
    const tone = toneIn || toneOf(name);   // a sender's own tone (from.tone), else the name's (noir asked, 2026-10-08)
    K().disc(g, cx, cy, r, { fill: tone, shadow: false });
    K().text(g, initials(name), { role: "label", x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, align: "center", valign: "middle", weight: 700, size: S().size("label", Math.round(r * 0.8)), color: onTok(tone) });
  }
  function onTok(fill) {   // the TOKEN (not a hex) that reads best on a fill, so kit.text keeps tokens (S.on returns a hex)
    const P = S().pack.palette, f = S().c(fill); let best = "ink", bc = 0;
    for (const t of ["ink", "field", "onAccent"]) if (t in P) { const c = S().contrast(f, P[t]); if (c > bc) { bc = c; best = t; } }
    return best;
  }
  /** draw the artefact's background at its final height: the given h, or the content's own (it hugs, so there is
   *  never an empty lower half), and keep the element's declared box truthful */
  function hug(E, bg, W, H, o, r) {
    H = Math.ceil(H);
    K().rect(bg, 0, 0, W, H, { fill: o.fill || "surface", r, crisp: true });
    E.h = H; E.outer.setAttribute("data-h", H);
    return H;
  }
  /** remember how a text part was set, so ui.phrase can find a phrase inside it (for a highlight or a lead line) */
  function words(A, key, str, role, size, weight, x, y, w, maxLines) {
    const F = K().fit(str, { role, size, w, maxLines: maxLines || 1, weight });
    (A.text = A.text || {})[key] = { str, role, size: F.size, weight, x, y, w, F };
  }
  function part(A, key, x, y, w, h, node) { A.parts[key] = { x, y, w, h }; if (node) A.nodes[key] = node; if (!A.order.includes(key)) A.order.push(key); }
  function group(A, key, parent) { const g = svg("g", { class: "lm-ui-part", "data-part": key }, parent || A.E.inner); A.nodes[key] = g; return g; }

  /* ---------------- mail: a reading pane ---------------- */
  ui.mail = function (ctx, name, o) {
    o = o || {};
    const W = o.w || 1500, pad = Math.round(W * 0.04);
    let H = o.h || 0;
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w: W, h: H || 860, kind: "document", exit: o.exit || "recede", parent: o.parent });
    const A = { E, parts: {}, nodes: {}, kind: "mail", order: [] }; E.ui = A;   // a later beat that holds E finds A here
    const bg = svg("g", { class: "lm-ui-bg" }, E.inner);
    let y = 0;
    // toolbar: the actions a reading pane offers (reply, forward, delete, flag), plus the report control if asked
    const tb = Math.round(sz(o, "meta") * 2.3);
    const gT = group(A, "toolbar");
    svg("rect", { x: 0, y: tb - 2, width: W, height: 2, fill: S().c("line"), opacity: 0.3 }, gT);
    ["reply", "reply-all", "forward", "trash-2", "flag"].forEach((ic, i) => K().icon(gT, ic, { x: pad + 16 + i * tb * 1.1, y: tb / 2, size: tb * 0.46, color: "muted" }));
    part(A, "toolbar", 0, 0, W, tb, gT);
    if (o.report) {
      const lab = typeof o.report === "string" ? o.report : "Report";
      const bw = Math.ceil(K().measure(lab, "label", sz(o, "chip"), 700) + tb * 1.45);
      const gR = group(A, "report");
      K().rect(gR, W - pad - bw, tb * 0.08, bw, tb * 0.84, { fill: "accent", r: tb * 0.42, crisp: true, shadow: false });
      K().icon(gR, "flag", { x: W - pad - bw + tb * 0.42, y: tb / 2, size: tb * 0.34, color: onTok("accent") });
      K().text(gR, lab, { role: "label", x: W - pad - bw + tb * 0.7, y: tb * 0.08, w: bw - tb * 1.0, h: tb * 0.84, valign: "middle", weight: 700, size: sz(o, "chip"), color: onTok("accent") });
      part(A, "report", W - pad - bw, tb * 0.08, bw, tb * 0.84, gR);
    }
    y = tb + Math.round(pad * 0.5);
    if (o.banner) {
      const bh = Math.round(sz(o, "meta") * 2.1), tone = o.banner.tone || "accent4";
      const gB = group(A, "banner");
      svg("rect", { x: pad, y, width: W - 2 * pad, height: bh, rx: 10, fill: S().c(tone), opacity: 0.16 }, gB);
      svg("rect", { x: pad, y, width: 6, height: bh, rx: 3, fill: S().c(tone) }, gB);
      K().icon(gB, o.banner.icon || "alert-triangle", { x: pad + 36, y: y + bh / 2, size: bh * 0.46, color: tone });
      K().text(gB, o.banner.text, { role: "label", x: pad + 64, y, w: W - 2 * pad - 80, h: bh, valign: "middle", size: sz(o, "meta"), color: "ink" });
      part(A, "banner", pad, y, W - 2 * pad, bh, gB);
      y += bh + Math.round(pad * 0.45);
    }
    if (o.subject) {
      const f = fit(o.subject, "lead", sz(o, "subject"), W - 2 * pad, 2, 700);
      const gS = group(A, "subject");
      K().text(gS, o.subject, { role: "lead", x: pad, y, w: W - 2 * pad, h: f.height + 6, maxLines: 2, size: sz(o, "subject"), weight: 700 });
      words(A, "subject", o.subject, "lead", sz(o, "subject"), 700, pad, y, W - 2 * pad, 2);
      part(A, "subject", pad, y, Math.min(W - 2 * pad, f.width + 8), f.height, gS);
      y += f.height + Math.round(pad * 0.55);
    }
    // sender row: avatar, display name, <address>, "to" line, time on the right
    const from = o.from || {};
    const ar = Math.round(sz(o, "name") * 1.05);
    const gF = group(A, "sender");
    avatar(gF, pad + ar, y + ar, ar, from.name, from.tone);
    const nx = pad + 2 * ar + Math.round(ar * 0.6);
    const nSize = sz(o, "name"), mSize = sz(o, "meta");
    const nW = Math.ceil(K().measure(from.name || "", "lead", nSize, 700));
    K().text(gF, from.name || "", { role: "lead", x: nx, y: y + ar * 0.1, w: nW + 10, h: nSize * 1.6, size: nSize, weight: 700 });
    words(A, "sender", from.name || "", "lead", nSize, 700, nx, y + ar * 0.1, nW + 10, 1);
    part(A, "sender", nx, y + ar * 0.1, nW, nSize * 1.25, gF);
    if (from.address) {
      const gA = group(A, "address");
      // measured at the weight it is DRAWN (it draws at the role's default weight): measuring at 400 put marks off
      // their words (style guides s15, font weight clamp; 2026-10-08)
      const aw = Math.ceil(K().measure(`<${from.address}>`, "label", mSize));
      K().text(gA, `<${from.address}>`, { role: "label", x: nx + nW + 14, y: y + ar * 0.1 + (nSize - mSize) * 0.6, w: aw + 10, h: mSize * 1.3, size: mSize, color: "muted" });
      words(A, "address", `<${from.address}>`, "label", mSize, undefined, nx + nW + 14, y + ar * 0.1 + (nSize - mSize) * 0.6, aw + 10, 1);
      part(A, "address", nx + nW + 14, y + ar * 0.1 + (nSize - mSize) * 0.6, aw, mSize * 1.25, gA);
    }
    if (o.to) {
      const gTo = group(A, "to");
      K().text(gTo, `to ${o.to}`, { role: "label", x: nx, y: y + ar * 0.1 + nSize * 1.35, w: W * 0.5, h: mSize * 1.3, size: mSize, color: "muted" });
      part(A, "to", nx, y + ar * 0.1 + nSize * 1.35, W * 0.4, mSize * 1.25, gTo);
    }
    if (o.time) {
      const gTi = group(A, "time");
      const tw = Math.ceil(K().measure(o.time, "label", mSize));
      // the time sits at the right of the sender row; when a long address would reach it, it drops to the "to" row
      const aEnd = A.parts.address ? A.parts.address.x + A.parts.address.w : nx + nW;
      const ty = aEnd + 28 > W - pad - tw ? y + ar * 0.1 + nSize * 1.35 : y + ar * 0.1;
      K().text(gTi, o.time, { role: "label", x: W - pad - tw - 12, y: ty, w: tw + 12, h: mSize * 1.3, size: mSize, color: "muted", align: "right" });
      part(A, "time", W - pad - tw, ty, tw, mSize * 1.25, gTi);
    }
    y += 2 * ar + Math.round(pad * 0.6);
    // body: real paragraphs, then the link, the button and the attachment
    const bSize = sz(o, "body");
    (o.paragraphs || []).forEach((para, i) => {
      const f = fit(para, "body", bSize, W - 2 * pad, 4);
      const gP = group(A, "body_" + i);
      K().text(gP, para, { role: "body", x: pad, y, w: W - 2 * pad, h: f.height + 6, maxLines: 4, size: bSize });
      words(A, "body_" + i, para, "body", bSize, undefined, pad, y, W - 2 * pad, 4);
      part(A, "body_" + i, pad, y, Math.min(W - 2 * pad, f.width + 6), f.height, gP);
      y += f.height + Math.round(bSize * 0.7);
    });
    if (o.link) {
      const gL = group(A, "link");
      const lw = Math.ceil(K().measure(o.link.text, "body", bSize)), lt = o.link.tone || S().role("link", "accent");
      K().text(gL, o.link.text, { role: "body", x: pad, y, w: lw + 10, h: bSize * 1.3, size: bSize, color: lt });
      words(A, "link", o.link.text, "body", bSize, undefined, pad, y, lw + 10, 1);
      svg("rect", { x: pad, y: y + bSize * 1.12, width: lw, height: 2, fill: S().c(lt) }, gL);
      part(A, "link", pad, y, lw, bSize * 1.25, gL);
      if (o.link.href) {   // where it really goes: shown when the lesson hovers the link (ui.hoverLink)
        A.href = o.link.href;
      }
      y += bSize * 1.25 + Math.round(bSize * 0.8);
    }
    if (o.button) {
      const gBt = group(A, "button");
      const bh = Math.round(bSize * 2), bw = Math.ceil(K().measure(o.button.label, "label", bSize, 700) + bh * 1.4);
      const bf = o.button.fill || S().role("button", "accent");
      K().rect(gBt, pad, y, bw, bh, { fill: bf, r: 10, crisp: true, shadow: false });
      K().text(gBt, o.button.label, { role: "label", x: pad, y, w: bw, h: bh, align: "center", valign: "middle", weight: 700, size: bSize, color: onTok(bf) });
      part(A, "button", pad, y, bw, bh, gBt);
      y += bh + Math.round(bSize * 0.8);
    }
    if (o.attachment) {
      const gAt = group(A, "attachment");
      const ah = Math.round(sz(o, "chip") * 2.4), label = o.attachment.name + (o.attachment.size ? `  ${o.attachment.size}` : "");
      const aw = Math.ceil(K().measure(label, "label", sz(o, "chip"), 600) + ah * 1.5);
      K().rect(gAt, pad, y, aw, ah, { fill: "surface2", stroke: "line", sw: 2, r: 12, crisp: true, shadow: false });
      K().icon(gAt, "paperclip", { x: pad + ah * 0.5, y: y + ah / 2, size: ah * 0.42, color: "muted" });
      K().text(gAt, label, { role: "label", x: pad + ah * 0.95, y, w: aw - ah, h: ah, valign: "middle", size: sz(o, "chip"), weight: 600 });
      part(A, "attachment", pad, y, aw, ah, gAt);
      y += ah;
    }
    y += Math.round(pad * 0.8);
    A.contentH = y;
    if (H && y > H + 4) Loom.warn("ui_overflow", `${name}: the mail needs ${Math.round(y)} px but has ${H}; give it more height or fewer paragraphs`);
    H = hug(E, bg, W, H || y, o, 18);
    return A;
  };

  /* ---------------- inbox: the message list ---------------- */
  ui.inbox = function (ctx, name, o) {
    o = o || {};
    const W = o.w || 1500, rows = o.rows || [], pad = Math.round(W * 0.03);
    const rh = Math.round(sz(o, "body") * 3.1), H = o.h || rows.length * rh + 20;
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w: W, h: H, kind: "document", exit: o.exit || "recede", parent: o.parent });
    const A = { E, parts: {}, nodes: {}, kind: "inbox", order: [] }; E.ui = A;
    K().rect(E.inner, 0, 0, W, H, { fill: o.fill || "surface", r: 18, crisp: true });
    rows.forEach((r, i) => {
      const y = 10 + i * rh, g = group(A, "row_" + i);
      if (i) svg("rect", { x: pad, y, width: W - 2 * pad, height: 2, fill: S().c("line"), opacity: 0.25 }, g);
      if (r.unread) svg("circle", { cx: pad * 0.55, cy: y + rh / 2, r: 7, fill: S().c("accent") }, g);
      const ar = rh * 0.3; avatar(g, pad + ar, y + rh / 2, ar, r.from);
      const x0 = pad + 2 * ar + 24, nS = sz(o, "body"), mS = sz(o, "meta");
      const tw = Math.ceil(K().measure(r.time || "", "label", mS));
      K().text(g, r.from || "", { role: "body", x: x0, y: y + rh * 0.12, w: W * 0.3, h: nS * 1.3, size: nS, weight: r.unread ? 800 : 500 });
      K().text(g, r.subject || "", { role: "body", x: x0 + W * 0.3, y: y + rh * 0.12, w: W - x0 - W * 0.3 - tw - pad - 20, h: nS * 1.3, size: nS, weight: r.unread ? 700 : 400 });
      if (r.preview) K().text(g, r.preview, { role: "label", x: x0 + W * 0.3, y: y + rh * 0.12 + nS * 1.35, w: W - x0 - W * 0.3 - tw - pad - 20, h: mS * 1.3, size: mS, color: "muted" });
      if (r.attachment) K().icon(g, "paperclip", { x: W - pad - tw - 40, y: y + rh / 2, size: mS, color: "muted" });
      K().text(g, r.time || "", { role: "label", x: W - pad - tw, y: y + rh * 0.12, w: tw + 4, h: mS * 1.3, size: mS, color: "muted", align: "right" });
      part(A, "row_" + i, 0, y, W, rh, g);
    });
    return A;
  };

  /* ---------------- chat: a thread ---------------- */
  ui.chat = function (ctx, name, o) {
    o = o || {};
    const W = o.w || 1100, pad = Math.round(W * 0.05);
    let H = o.h || 0;
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w: W, h: H || 860, kind: "document", exit: o.exit || "recede", parent: o.parent });
    const A = { E, parts: {}, nodes: {}, kind: "chat", order: [] }; E.ui = A;
    const bg = svg("g", { class: "lm-ui-bg" }, E.inner);
    const hb = Math.round(sz(o, "name") * 2.4);
    const gH = group(A, "header");
    svg("rect", { x: 0, y: hb - 2, width: W, height: 2, fill: S().c("line"), opacity: 0.3 }, gH);
    if (o.title) { avatar(gH, pad + hb * 0.3, hb / 2, hb * 0.3, o.title); K().text(gH, o.title, { role: "lead", x: pad + hb * 0.75, y: 0, w: W - 2 * pad, h: hb, valign: "middle", size: sz(o, "name"), weight: 700 }); }
    part(A, "header", 0, 0, W, hb, gH);
    let y = hb + pad * 0.6;
    const bS = sz(o, "body"), maxW = W * 0.72;
    (o.messages || []).forEach((m, i) => {
      const f = fit(m.text, "body", bS, maxW - 48, 4);
      const bw = Math.min(maxW, f.width + 48), bh = f.height + 34, me = m.side === "me";
      const x = me ? W - pad - bw : pad, g = group(A, "msg_" + i);
      if (m.name && !me) { K().text(g, m.name, { role: "label", x, y, w: maxW, h: sz(o, "meta") * 1.3, size: sz(o, "meta"), color: "muted" }); y += sz(o, "meta") * 1.4; }
      const meT = S().role("me_bubble", "accent");
      K().rect(g, x, y, bw, bh, { fill: me ? meT : "surface2", r: 22, crisp: true, shadow: false });
      K().text(g, m.text, { role: "body", x: x + 24, y: y + 17, w: bw - 48, h: f.height + 4, maxLines: 4, size: bS, color: me ? (onTok(meT)) : "ink" });
      part(A, "msg_" + i, x, y, bw, bh, g);
      y += bh + (m.time ? 0 : bS * 0.6);
      if (m.time) { K().text(g, m.time, { role: "label", x: me ? W - pad - 200 : pad, y: y + 6, w: 200, h: sz(o, "small") * 1.3, size: sz(o, "small"), color: "muted", align: me ? "right" : "left" }); y += sz(o, "small") * 1.6 + bS * 0.3; }
    });
    y += Math.round(pad * 0.4);
    A.contentH = y;
    if (H && y > H + 4) Loom.warn("ui_overflow", `${name}: the chat needs ${Math.round(y)} px but has ${H}`);
    H = hug(E, bg, W, H || y, o, 22);
    return A;
  };

  /* ---------------- doc: a page with real words ---------------- */
  ui.doc = function (ctx, name, o) {
    o = o || {};
    const W = o.w || 1200, pad = Math.round(W * 0.07);
    let H = o.h || 0;
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w: W, h: H || 900, kind: "document", exit: o.exit || "recede", parent: o.parent });
    const A = { E, parts: {}, nodes: {}, kind: "doc", order: [] }; E.ui = A;
    const bg = svg("g", { class: "lm-ui-bg" }, E.inner);
    let y = pad * 0.8;
    if (o.title) {
      const f = fit(o.title, "lead", sz(o, "title"), W - 2 * pad, 2, 700); const g = group(A, "title");
      K().text(g, o.title, { role: "lead", x: pad, y, w: W - 2 * pad, h: f.height + 6, maxLines: 2, size: sz(o, "title"), weight: 700 });
      part(A, "title", pad, y, f.width, f.height, g); y += f.height + pad * 0.25;
    }
    if (o.meta) { const g = group(A, "meta"); K().text(g, o.meta, { role: "label", x: pad, y, w: W - 2 * pad, h: sz(o, "meta") * 1.3, size: sz(o, "meta"), color: "muted" }); part(A, "meta", pad, y, W - 2 * pad, sz(o, "meta") * 1.3, g); y += sz(o, "meta") * 1.3 + pad * 0.4; }
    (o.paragraphs || []).forEach((para, i) => {
      const f = fit(para, "body", sz(o, "body"), W - 2 * pad, 6); const g = group(A, "para_" + i);
      K().text(g, para, { role: "body", x: pad, y, w: W - 2 * pad, h: f.height + 6, maxLines: 6, size: sz(o, "body") });
      part(A, "para_" + i, pad, y, Math.min(W - 2 * pad, f.width + 6), f.height, g); y += f.height + sz(o, "body") * 0.8;
    });
    y += Math.round(pad * 0.5);
    A.contentH = y;
    if (H && y > H + 4) Loom.warn("ui_overflow", `${name}: the page needs ${Math.round(y)} px but has ${H}`);
    H = hug(E, bg, W, H || y, o, 8);
    return A;
  };

  /** where a phrase sits inside a text part, in the artefact's parent coordinates: {x, y, w, h, cx, cy}.
   *  Reads the same line breaks kit.text used, so a highlight or a lead line lands on the words themselves. */
  ui.phrase = function (A, key, phrase, near) {   // near: a longer run of words that contains the phrase, to pick one occurrence (a single letter)
    const T = (A.text || {})[key];
    if (!T) { Loom.error("ui_phrase_part", `${A.E.name}: no text part '${key}' (have ${Object.keys(A.text || {}).join(", ")})`); return ui.at(A, key); }
    const L = T.F.lines, lh = T.F.size * T.F.lh;
    for (let i = 0; i < L.length; i++) {
      const n0 = near ? L[i].indexOf(near) : 0;
      if (n0 < 0) continue;
      const k = L[i].indexOf(phrase, n0);
      if (k < 0 || (near && k >= n0 + near.length)) continue;
      const x0 = K().measure(L[i].slice(0, k), T.role, T.F.size, T.weight), w = K().measure(phrase, T.role, T.F.size, T.weight);
      const x = A.E.x + T.x + x0, y = A.E.y + T.y + i * lh;
      return { x, y, w, h: lh, cx: x + w / 2, cy: y + lh / 2, line: i };
    }
    Loom.error("ui_phrase_missing", `${A.E.name}.${key}: "${phrase}" is not on one line of "${T.str.slice(0, 60)}" (pick words that do not wrap)`);
    return ui.at(A, key);
  };

  /** ui.mark(ctx, A, key, phrase, t, {tone, dur}) -> rect: a marker sweep behind a phrase (left to right), drawn
   *  inside the part, so it moves and leaves with it. The one emphasis that says "this words, here". */
  ui.mark = function (ctx, A, key, phrase, t, o) {
    o = o || {};
    const r = ui.phrase(A, key, phrase, o.near), g = A.nodes[key];
    if (!g) return r;
    const px = r.x - A.E.x - 6, py = r.y - A.E.y + r.h * 0.08;
    const m = svg("rect", { x: px, y: py, width: r.w + 12, height: r.h * 0.84, rx: 6, fill: S().c(o.tone || S().role("ui_mark", "accent2")), opacity: o.opacity || 0.32 }, null);
    g.insertBefore(m, g.firstChild);
    Loom.tween(m, { attr: { width: 0 } }, { attr: { width: r.w + 12 }, duration: o.dur || 0.45, ease: Loom.ease.enter }, t, { kind: "draw", beat: ctx.beat.id, name: `${A.E.name}.${key}.mark`, content: true });
    return r;
  };

  /** ui.card(ctx, name, {x, y, w, title, tone, icon, rows, parent}) -> card: a pinned evidence card, a family
   *  colour and title, and `rows` slots filled on cue with card.add(i, key, value, t). The box is sized for all its
   *  rows from the start, so adding a row never moves anything. card.port(i) is where a lead line meets row i. */
  ui.card = function (ctx, name, o) {
    o = o || {};
    const W = o.w || 600, n = o.rows || 2, tone = o.tone || "accent", rS = S().size("body", 32), kS = S().size("label", 24);
    const head = Math.round(S().size("label", 28) * 2), rowH = Math.round(rS * 1.4 + kS * 1.45 + 14), H = head + n * rowH + 12;
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w: W, h: H, kind: "card", exit: o.exit || "recede", parent: o.parent });
    K().rect(E.inner, 0, 0, W, H, { fill: o.fill || "surface", r: 14, crisp: true });
    svg("rect", { x: 0, y: 0, width: 10, height: H, rx: 4, fill: S().c(tone) }, E.inner);
    const hg = svg("g", {}, E.inner);
    let tx = 34;
    if (o.icon) { K().icon(hg, o.icon, { x: 50, y: head / 2 + 4, size: head * 0.5, color: tone }); tx = 84; }
    K().text(hg, String(o.title || "").toUpperCase(), { role: "label", x: tx, y: 4, w: W - tx - 24, h: head, valign: "middle", weight: 800, size: S().size("label", 28), color: tone, tracking: 2 });
    svg("rect", { x: 24, y: head, width: W - 48, height: 2, fill: S().c("line"), opacity: 0.35 }, E.inner);
    const C = { E, tone, rows: [], head, rowH, W, H };
    C.port = (i) => ({ x: E.x, y: E.y + head + i * rowH + rowH / 2 });
    C.add = function (i, key, value, t) {
      const g = svg("g", { class: "lm-ui-row", "data-row": i }, E.inner), y = head + 10 + i * rowH;
      if (key) K().text(g, key, { role: "label", x: 34, y, w: W - 60, h: kS * 1.45, size: kS, color: "muted", maxLines: 1 });
      K().text(g, value, { role: "body", x: 34, y: y + (key ? kS * 1.45 : 0), w: W - 60, h: rS * 1.4 + 4, size: rS, weight: 700, maxLines: 1 });
      Loom.tween(g, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.35, ease: Loom.ease.enter }, t, { kind: "reveal", beat: ctx.beat.id, name: `${name}.row${i}`, content: true });
      C.rows[i] = g;
      return t + 0.35;
    };
    E.ui = C;
    return C;
  };

  /** ui.wire(ctx, name, from, to, t, {tone, parent, bend, hold}) -> E: a thin lead from a phrase to its card, drawn on
   *  cue, a dot at each end. It is its own element, so give it the same exit as the card it serves. */
  ui.wire = function (ctx, name, a, b, t, o) {
    o = o || {};
    const tone = o.tone || "accent";
    const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: o.exit || "recede", parent: o.parent });
    const mx = (a.x + b.x) / 2, bend = o.bend == null ? 0 : o.bend;
    const p = K().path(E.inner, `M${a.x} ${a.y} C${mx} ${a.y + bend} ${mx} ${b.y - bend} ${b.x} ${b.y}`, { stroke: tone, sw: 3 });
    const d0 = svg("circle", { cx: a.x, cy: a.y, r: 6, fill: S().c(tone) }, E.inner), d1 = svg("circle", { cx: b.x, cy: b.y, r: 6, fill: S().c(tone) }, E.inner);
    Loom.motion.reveal(E, t, { dy: 0, dur: 0.1 });
    Loom.tween([d0], { opacity: 0 }, { opacity: 1, duration: 0.15 }, t, { kind: "reveal", beat: ctx.beat.id, name: name + ".from", content: true });
    Loom.motion.draw(p, t + 0.05, { dur: o.dur || 0.6 });
    Loom.tween([d1], { opacity: 0 }, { opacity: 1, duration: 0.15 }, t + 0.05 + (o.dur || 0.6), { kind: "reveal", beat: ctx.beat.id, name: name + ".to", content: true });
    // o.hold: the lead has done its job once the eye has followed it; it leaves, so leads never pile into a tangle
    if (o.hold != null) Loom.motion.exit(E, t + 0.05 + (o.dur || 0.6) + o.hold, "recede");
    return E;
  };

  /** a part's rect in the artefact's parent (station) coordinates, for tags, strings and highlights */
  ui.at = function (A, key) {
    const p = A.parts[key]; if (!p) { Loom.error("ui_part_missing", `${A.E.name}: no part '${key}' (have ${Object.keys(A.parts).join(", ")})`); return { x: 0, y: 0, w: 0, h: 0 }; }
    return { x: A.E.x + p.x, y: A.E.y + p.y, w: p.w, h: p.h, cx: A.E.x + p.x + p.w / 2, cy: A.E.y + p.y + p.h / 2 };
  };

  /** build the artefact in reading order from t (the frame, then its parts), or reveal the whole at once */
  ui.build = function (ctx, A, t, o) {
    o = o || {};
    Loom.motion.reveal(A.E, t, { dy: 0, dur: 0.35 });
    const order = o.order || A.order, gap = o.gap == null ? 0.12 : o.gap;
    if (o.whole) return t + 0.35;
    order.forEach((k, i) => {
      const n = A.nodes[k]; if (!n) return;
      Loom.tween(n, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: Loom.ease.enter }, t + 0.05 + i * gap, { kind: "reveal", beat: ctx.beat.id, name: `${A.E.name}.${k}`, content: true });
    });
    return t + 0.05 + order.length * gap + 0.3;
  };
})();
