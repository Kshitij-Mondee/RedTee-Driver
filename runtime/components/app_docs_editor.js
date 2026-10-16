// T-152 app_docs_editor: a generic document editor shell (hand-off sheet, Family M). Built on runtime/components/_app_kit.js.
// Extends ui.doc (runtime/ui_artefacts.js: a static page) and the document.page template into a working editor: a
// toolbar, headings, comments in the margin, suggestion mode, version history, with scriptable actions.
Loom.component("app_docs_editor", {
  version: 1,
  idea: "A shared document editor: a page of headings, paragraphs and lists, suggested edits shown inline, comments in the margin, and a version history, walked through by a pointer that types, comments on a phrase, accepts a suggestion and restores an earlier version.",
  outline: ["window (or the screencast engine's app window)", "top bar: document title, collaborators, history, share", "toolbar: undo, redo, text styles, comment, the editing mode", "the page: headings, paragraphs, list items, with inline suggestions (struck and inserted text) and commented phrases", "the margin: comment and suggestion cards beside their lines", "version history panel (opened by an action)", "toast", "pointer"],
  family: "ui",
  tags: ["document", "word processor", "docs", "editor", "track changes", "suggestions", "comments", "version history", "policy", "collaboration"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-152)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop"],   // a product UI: the styles that show products as screens (D-193)
  params: {
    docTitle: { type: "str", content: true },    // the document's name in the top bar
    blocks: { type: "list", content: true },     // [{kind: "h1"|"h2"|"p"|"li"|"quote", text}]
    suggestions: { type: "list" },               // [{id, block, del, ins, after, author}]: del is a phrase of the block to strike, ins the text suggested in
                                                 // its place (or after the phrase `after` when nothing is struck)
    comments: { type: "list" },                  // [{id, block, anchor (a phrase of the block), author, time, text}]
    versions: { type: "list" },                  // the history: [{label, author, time, blocks (that version's blocks, optional)}], newest first
    people: { type: "list" },                    // names of the collaborators shown in the top bar
    mode: { type: "enum", choices: ["editing", "suggesting", "viewing"], default: "editing" },
    me: { type: "str" },                         // the learner's name: the author of new comments
    title: { type: "str" },
    labels: { type: "obj" },                     // the product's words, each optional: {share, editing, suggesting, viewing, history, restore, restored,
                                                 // accept, reject, comment, saved}
    state: { type: "enum", choices: ["ready", "loading", "error"], default: "ready" },
    notice: { type: "str" },
    steps: { type: "list", default: [] },        // [{do: "type"|"comment"|"accept"|"reject"|"restore"|"state", at, ...}]
    theme: { type: "obj", default: {} }, layout: { type: "obj", default: {} },   // layout: {pageW, marginW}
    w: { type: "number", default: 1728 }, h: { type: "number", default: 856 },
    at: { type: "number", default: -1 }, cps: { type: "number", default: 14 },
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["host", "topbar", "toolbar", "page", "blocks", "cards", "historyPanel", "states",
    "type(text, at, {block})", "comment(block, anchor, text, at)", "accept(id, at)", "reject(id, at)", "restore(i, at)", "setState(name, at)"],
  example: 'ctx.use("app_docs_editor", { docTitle: "Visitor policy", blocks: [{ kind: "h1", text: "Visitors" }, { kind: "p", text: "Visitors sign in at reception and wear a badge at all times." }], suggestions: [{ id: "s1", block: 1, del: "at all times", ins: "while on site", author: "Mo Diaz" }], labels: { accept: "Accept" }, steps: [{ do: "accept", id: "s1", at: ctx.cue("accept the change") }] }, { x: 96, y: 78, name: "doc" })',
  size: (p) => ({ w: p.w, h: p.h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, svg = (t, a, q) => Loom.svg(t, a, q);
    const T = AK.theme(p.theme), Z = AK.sizes(T), tones = AK.tones(T), L = p.labels || {}, LY = p.layout || {};
    const H = AK.host(ctx, g, p, { T, Z, title: p.title });
    const B = H.body, BW = B.w, BH = B.h, pad = Z.pad, root = B.g;
    AK.box(root, 0, 0, BW, BH, { r: 0, fill: tones.page });

    // ---------------------------------------------------------------- top bar and toolbar
    const topH = Math.round(Math.max(Z.lhH + 24, Z.ctl + 18));
    const top = svg("g", {}, root);
    AK.box(top, 0, 0, BW, topH, { r: 0, fill: tones.card });
    const brand = AK.solid(T.accent);
    AK.box(top, pad, (topH - 40) / 2, 40, 40, { r: 8, fill: brand.fill, stroke: brand.stroke, sw: brand.sw });
    AK.icon(top, "file-text", pad + 20, topH / 2, 24, brand.fg);
    const shareB = AK.button(top, BW - pad, (topH - Z.ctl) / 2, { label: L.share, icon: "share-2", kind: "primary", T, Z, align: "right" });
    const histB = AK.button(top, shareB.x - 10, (topH - Z.ctl) / 2, { label: L.history, icon: "history", kind: "ghost", T, Z, align: "right" });
    let ax = histB.x - 16;
    for (const n of (p.people || []).slice(0, 4).reverse()) { const av = AK.avatar(top, ax - 20, topH / 2, 20, n); ax -= av.__r * 2 + 4; }
    AK.T(svg("g", {}, top), p.docTitle, { role: "label", x: pad + 56, y: 0, w: Math.max(80, ax - pad - 80), h: topH, size: Z.head, weight: 700 });
    const tbY = topH, tbH = Z.ctl + 12;
    const tbar = svg("g", {}, root);
    AK.box(tbar, 0, tbY, BW, tbH, { r: 0, fill: tones.card });
    AK.box(tbar, 0, tbY, BW, 1.5, { r: 0, fill: tones.hair });
    AK.box(tbar, 0, tbY + tbH - 1, BW, 1.5, { r: 0, fill: tones.hair2 });
    let tx = pad;
    const tool = (icon) => { const b = AK.button(tbar, tx, tbY + 6, { icon, kind: "ghost", T, Z }); tx += b.w + 2; return b; };
    const sep = () => { AK.box(tbar, tx + 6, tbY + 14, 1.5, tbH - 28, { r: 0, fill: tones.hair2 }); tx += 16; };
    tool("undo-2"); tool("redo-2"); sep();
    tool("bold"); tool("italic"); tool("underline"); tool("link"); sep();
    tool("list"); tool("list-ordered"); sep();
    const commentB = tool("message-square-plus");
    const modeIcon = { editing: "pencil", suggesting: "file-pen-line", viewing: "eye" }[p.mode];
    AK.pill(tbar, BW - pad, tbY + (tbH - AK.boxH(Z.small, "caption", 600)) / 2, L[p.mode] || "", { size: Z.small, icon: modeIcon, fill: p.mode === "suggesting" ? tones.posWash : tones.sel, color: p.mode === "suggesting" ? "pos" : T.accent, weight: 600, align: "right" });

    // ---------------------------------------------------------------- the page and its margin
    const cTop = tbY + tbH;
    const MGW = Math.round(LY.marginW || AK.clamp(BW * 0.24, 320, 460));
    const PGW = Math.round(LY.pageW || Math.min(1000, BW - MGW - pad * 5));
    const PX = Math.round(Math.max(pad * 2, (BW - MGW - PGW - 28) / 2)), MX = PX + PGW + 28;
    const pageG = svg("g", {}, root);
    AK.box(pageG, PX, cTop + pad, PGW, BH - cTop - pad, { r: 4, fill: "surface", stroke: tones.hair });   // the page runs on below the window's edge; drawn to it, never past it
    const inX = PX + Math.round(PGW * 0.08), inW = PGW - Math.round(PGW * 0.16), y0 = cTop + pad + Math.round(pad * 2.2), yMax = BH - 8;
    const KIND = {
      h1: { role: "lead", size: Z.big, weight: 700, gap: 0.9 }, h2: { role: "label", size: Z.head, weight: 700, gap: 0.7 },
      p: { role: "caption", size: Z.fs, weight: 400, gap: 0.8 }, li: { role: "caption", size: Z.fs, weight: 400, gap: 0.35, indent: 34 },
      quote: { role: "caption", size: Z.fs, weight: 400, gap: 0.8, indent: 28, color: "muted" },
    };
    const sugs = (p.suggestions || []).map((s, i) => Object.assign({ id: s.id || "s" + i, state: "open" }, s));
    const coms = (p.comments || []).map((c, i) => Object.assign({ id: c.id || "c" + i }, c));
    // a block's runs: plain text cut where a suggestion strikes or inserts, or where a comment anchors
    function runsOf(bi, text, o) {
      o = o || {};
      const marks = [];
      for (const s of sugs) {
        if (s.block !== bi || s.state === "rejected" && !s.del) continue;
        const k = s.del ? text.indexOf(s.del) : s.after ? text.indexOf(s.after) + s.after.length : -1;
        if (k < 0 || (s.del == null && s.after == null)) continue;
        marks.push({ a: k, b: s.del ? k + s.del.length : k, s });
      }
      for (const c of o.anchors || coms.filter((q) => q.block === bi)) {
        const k = c.anchor ? text.indexOf(c.anchor) : -1;
        if (k >= 0 && !marks.some((m) => k < m.b && k + c.anchor.length > m.a)) marks.push({ a: k, b: k + c.anchor.length, c });
      }
      marks.sort((x, y) => x.a - y.a);
      const runs = []; let at = 0;
      for (const m of marks) {
        if (m.a < at) continue;
        if (m.a > at) runs.push({ text: text.slice(at, m.a), style: "plain" });
        if (m.s) {
          const st = m.s.state;
          if (m.b > m.a && st !== "accepted") runs.push({ text: text.slice(m.a, m.b), style: st === "rejected" ? "plain" : "del" });
          const gapBefore = (m.b === m.a && m.a > 0 && !/\s$/.test(text.slice(0, m.a))) || (m.b > m.a && st !== "accepted");
          if (m.s.ins && st !== "rejected") runs.push({ text: (gapBefore ? " " : "") + m.s.ins, style: st === "accepted" ? "plain" : "ins" });
        } else runs.push({ text: text.slice(m.a, m.b), style: "anchor" });
        at = m.b;
      }
      if (at < text.length) runs.push({ text: text.slice(at), style: "plain" });
      // the inserted text joins its neighbour without a doubled or missing space
      return runs.filter((r) => r.text.length);
    }
    const STY = (k) => ({
      plain: { weight: k.weight, color: k.color },
      anchor: { weight: k.weight, color: k.color, wash: tones.warnWash },
      del: { weight: k.weight, color: "neg", strike: AK.c("neg") },
      ins: { weight: k.weight, color: "pos", under: AK.c("pos") },
    });
    function layoutBlock(bi, b, o) {
      const k = KIND[b.kind] || KIND.p, w = inW - (k.indent || 0);
      const lines = AK.layoutRuns(runsOf(bi, b.text || "", o), { role: k.role, size: k.size, w, styles: STY(k) });
      const lh = AK.lineH(k.size, k.role, k.weight);
      return { k, lines, lh, h: lines.length * lh, w };
    }
    function drawBlock(parent, bi, b, y, o) {
      const Lb = layoutBlock(bi, b, o), k = Lb.k, bg = svg("g", {}, parent), under = svg("g", {}, bg);
      const x = inX + (k.indent || 0);
      if (b.kind === "li") svg("circle", { cx: inX + 12, cy: y + Lb.lh / 2, r: 4.5, fill: AK.c("ink") }, bg);
      if (b.kind === "quote") AK.box(bg, inX, y + 2, 4, Lb.h - 4, { r: 2, fill: tones.hair2 });
      const R = AK.drawRuns(bg, Lb.lines, { role: k.role, size: k.size, x, y, lh: Lb.lh, styles: STY(k) });
      return { g: bg, under, R, y, h: Lb.h, gap: Math.round(k.size * k.gap), lay: Lb, x, b, bi, shift: 0 };
    }
    // the blocks that fit on the page, each in its own group (so a later one can move)
    function drawDoc(parent, list, o) {
      const out = []; let y = y0;
      for (let i = 0; i < list.length; i++) {
        const Lb = layoutBlock(o && o.version ? -1 : i, list[i]);
        if (y + Lb.h > yMax) break;
        const D = drawBlock(parent, o && o.version ? -1 : i, list[i], y);
        out.push(D);
        y += D.h + D.gap;
      }
      return { blocks: out, end: y };
    }
    const docG = svg("g", {}, pageG);
    const doc = drawDoc(docG, p.blocks);
    const blocks = doc.blocks;

    // ---------------------------------------------------------------- the margin: comment and suggestion cards
    const cardsG = svg("g", {}, root);
    const cards = [];
    let cardBottom = -1;
    const segY = (bk, style, phrase) => {
      const s = bk.R.segs.find((q) => q.style === style && (!phrase || phrase.includes(q.text) || q.text.includes(phrase)));
      return s ? s.y : bk.y;
    };
    function card(o) {
      // o: {y, author, time, body: [lines {text, style}], actions: [{icon, label, kind}], tone}
      const cw = BW - MX - pad, cx = MX;
      const bodyW = cw - 32;
      let h = 14 + Math.max(Z.lh, 40) + 6;
      const paras = (o.body || []).map((q) => Object.assign({ h: AK.paraH(q.text, { size: Z.small, w: bodyW, maxLines: q.max || 3 }) }, q));
      for (const q of paras) h += q.h + 4;
      if (o.actions && o.actions.length) h += Z.ctl + 10;
      h += 12;
      // beside its line: the free place nearest to it, above or below the cards already there
      const top0 = cTop + 12, free = (y) => y >= top0 && y + h <= BH - 8 && !cards.some((c) => y < c.y + c.h + 12 && y + h + 12 > c.y);
      let y = null;
      for (let d = 0; d < BH; d += 6) { if (free(o.y + d)) { y = o.y + d; break; } if (free(o.y - d)) { y = o.y - d; break; } }
      if (y == null) return null;
      cardBottom = Math.max(cardBottom, y + h);
      const cg = svg("g", {}, cardsG), box = svg("g", {}, cg);
      AK.box(box, cx, y, cw, h, { r: T.radius, fill: "surface", stroke: o.tone ? o.tone : tones.hair2, sw: o.tone ? 2 : 1.5 });
      const av = AK.avatar(box, cx + 16 + 20, y + 14 + 20, 20, o.author);
      const tw = o.time ? Math.ceil(AK.measure(o.time, "caption", Z.small) + 4) : 0;
      const nx = cx + 16 + av.__r * 2 + 10;
      AK.T(box, o.author || "", { x: nx, y: y + 14, w: cw - (nx - cx) - 16 - tw - 6, h: 40, size: Z.small, weight: 700 });
      if (o.time) AK.T(box, o.time, { x: cx + cw - 16 - tw, y: y + 14, w: tw, h: 40, size: Z.small, color: "muted", align: "right" });
      let yy = y + 14 + Math.max(Z.lh, 40) + 6;
      const nodes = [];
      for (const q of paras) {
        const t = AK.P(box, q.text, { x: cx + 16, y: yy, w: bodyW, size: Z.small, maxLines: q.max || 3, color: q.color, weight: q.weight });
        if (q.strike) { const lw = Math.min(bodyW, AK.measure((t.__lines || [q.text])[0], "caption", Z.small)); AK.box(box, cx + 16, yy + q.h * 0.42, lw, 2, { r: 0, fill: "neg" }); }
        nodes.push(t); yy += q.h + 4;
      }
      const btns = [];
      if (o.actions) {
        let bx2 = cx + 16;
        for (const a of o.actions) { const b = AK.button(box, bx2, yy + 2, { label: a.label, icon: a.icon, kind: a.kind || "secondary", T, Z }); btns.push(b); bx2 += b.w + 8; }
      }
      const C = { g: cg, box, x: cx, y, w: cw, h, btns, nodes };
      cards.push(C);
      return C;
    }
    // the open suggestions and comments, by the line they sit on
    const items = [];
    for (const s of sugs) { const bk = blocks.find((q) => q.bi === s.block); if (bk) items.push({ y: segY(bk, s.del ? "del" : "ins", s.del || s.ins), s, bk }); }
    for (const c of coms) { const bk = blocks.find((q) => q.bi === c.block); if (bk) items.push({ y: segY(bk, "anchor", c.anchor), c, bk }); }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) {
      if (it.s) {
        const body = [];
        if (it.s.del) body.push({ text: it.s.del, color: "neg", max: 2, strike: true });
        if (it.s.ins) body.push({ text: it.s.ins, color: "pos", max: 2 });
        it.card = card({ y: it.y - 6, author: it.s.author, body, actions: [{ icon: "check", label: L.accept, kind: "primary" }, { icon: "x", label: L.reject }], tone: "pos" });
        it.s.card = it.card;
      } else {
        it.card = card({ y: it.y - 6, author: it.c.author, time: it.c.time, body: [{ text: it.c.text, max: 4 }], tone: "accent4" });
        it.c.card = it.card;
      }
    }

    // ---------------------------------------------------------------- states, the history panel
    const loadG = svg("g", {}, root);
    AK.box(loadG, PX + 1, cTop + pad + 1, PGW - 2, BH - cTop - pad - 1, { r: 4, fill: "surface" });
    for (let k = 0; k < 9; k++) { const yy = y0 + k * (Z.lh + 14); if (yy > yMax - Z.lh) break; AK.box(loadG, inX, yy, inW * (k === 0 ? 0.5 : 0.7 + 0.25 * ((k * 7) % 3) / 2), Z.lh - 12, { r: 6, fill: tones.track }); }
    const errG = svg("g", {}, root);
    {
      // a status notice in the margin, where the editor shows it, never over the page's words
      const bw = BW - MX - pad, bh = p.notice ? AK.paraH(p.notice, { size: Z.fs, w: bw - 80, maxLines: 4 }) + 28 : Z.row;
      AK.box(errG, MX, cTop + pad, bw, bh, { r: T.radius, fill: tones.negWash, stroke: "neg" });
      AK.icon(errG, "cloud-off", MX + 30, cTop + pad + bh / 2, 26, "neg");
      if (p.notice) AK.P(errG, p.notice, { x: MX + 58, y: cTop + pad + 14, w: bw - 80, size: Z.fs, maxLines: 4 });
    }
    const states = AK.states({ ready: svg("g", {}, root), loading: loadG, error: errG }, p.state || "ready");
    const vers = p.versions || [];
    const VW = Math.round(AK.clamp(BW * 0.28, 380, 520)), VX = BW - VW;
    const hist = svg("g", { opacity: 0 }, B.over), histBox = svg("g", {}, hist);
    AK.box(histBox, VX, cTop, VW, BH - cTop, { r: 0, fill: "surface" });
    AK.box(histBox, VX, cTop, 1.5, BH - cTop, { r: 0, fill: tones.hair2 });
    AK.icon(histBox, "history", VX + pad + 12, cTop + pad + 16, 24, "ink");
    if (L.history) AK.T(histBox, L.history, { role: "label", x: VX + pad + 36, y: cTop + pad, w: VW - 2 * pad - 40, h: 34, size: Z.head, weight: 700 });
    const vRowH = Z.lh + Z.lhS + 22;
    const vRows = vers.map((v, i) => {
      const y = cTop + pad + 50 + i * (vRowH + 4);
      if (y + vRowH > BH - Z.ctl - pad * 2) return null;
      const rg = svg("g", {}, histBox);
      const sel = AK.box(rg, VX + 10, y, VW - 20, vRowH, { r: T.radius, fill: tones.sel, opacity: i === 0 ? 1 : 0 });
      AK.T(rg, v.label || "", { x: VX + pad + 8, y: y + 10, w: VW - 2 * pad - 16, h: Z.lh, size: Z.fs, weight: 600 });
      AK.T(rg, [v.time, v.author].filter(Boolean).join("  "), { x: VX + pad + 8, y: y + 10 + Z.lh, w: VW - 2 * pad - 16, h: Z.lhS, size: Z.small, color: "muted" });
      return { g: rg, sel, x: VX + 10, y, w: VW - 20, h: vRowH };
    });
    const restoreB = AK.button(histBox, VX + VW - pad, BH - pad - Z.ctl, { label: L.restore, icon: "rotate-ccw", kind: "primary", T, Z, align: "right" });

    // ---------------------------------------------------------------- actions
    const at0 = (t) => (t == null ? Math.max(H.free + 0.4, p.at >= 0 ? p.at + 0.6 : 0.4) : t);
    const after = (bk, dh, t) => { for (const q of blocks) if (q.y > bk.y + 1 && q.g) { q.shift += dh; AK.shift(q.g, 0, q.shift, t, 0.3); } };
    const A = {};
    A.type = function (text, at, o) {
      o = o || {};
      const bi = o.block == null ? blocks.length - 1 : o.block;
      const bk = blocks.find((q) => q.bi === bi) || blocks[blocks.length - 1];
      const nb = { kind: o.kind || "p", text };
      const k = KIND[nb.kind] || KIND.p;
      const yN = bk.y + bk.shift + bk.h + bk.gap;
      const lines = AK.layoutRuns([{ text, style: p.mode === "suggesting" ? "ins" : "plain" }], { role: k.role, size: k.size, w: inW - (k.indent || 0), styles: STY(k) });
      const lh = AK.lineH(k.size, k.role, k.weight), nh = lines.length * lh + Math.round(k.size * k.gap);
      const tp = H.click({ x: inX, y: bk.y + bk.shift + bk.h - lh, w: inW, h: lh }, at0(at), { fx: 0.98 });
      after(bk, nh, tp + 0.1);
      const ng = svg("g", {}, docG);
      const style = p.mode === "suggesting" ? "ins" : "plain";
      // one text node per line, typed in order
      const node = Loom.kit.text(ng, lines.map((l) => l.segs.map((s) => s.text).join(" ")).join(" "), { role: k.role, size: k.size, x: inX + (k.indent || 0), y: yN, w: inW - (k.indent || 0) + 4, h: lines.length * lh + 2, maxLines: lines.length, valign: "top", weight: k.weight || 400, color: style === "ins" ? "pos" : "ink" });
      if (nb.kind === "li") svg("circle", { cx: inX + 12, cy: yN + lh / 2, r: 4.5, fill: AK.c("ink") }, ng);
      const end = AK.type(node, tp + 0.35, { cps: p.cps, role: k.role, size: k.size, weight: k.weight, caret: ng, color: AK.c(T.accent) });
      if (style === "ins") {
        const ul = svg("g", {}, ng);
        lines.forEach((l, i) => AK.box(ul, inX + (k.indent || 0), yN + i * lh + lh * 0.82, l.w, 2, { r: 0, fill: "pos" }));
        ul.setAttribute("opacity", 0); AK.show(ul, end, 0.15);
      }
      blocks.push({ g: ng, y: yN, h: lines.length * lh, gap: Math.round(k.size * k.gap), bi: -1, shift: 0, b: nb });
      return L.saved ? H.toast(L.saved, end + 0.5, { icon: "cloud-check" }) : end + 0.3;
    };
    A.comment = function (bi, anchor, text, at) {
      const bk = blocks.find((q) => q.bi === bi);
      if (!bk) { Loom.error("component_params", `app_docs_editor.comment: block ${bi} is not on the page`); return at0(at); }
      // where the phrase sits: the block laid out again with the phrase as an anchor (same widths, same breaks)
      const Lb = layoutBlock(bi, bk.b, { anchors: coms.filter((q) => q.block === bi).concat([{ anchor }]) });
      const segs = [];
      Lb.lines.forEach((ln, i) => ln.segs.forEach((s) => { if (s.style === "anchor" && (anchor.includes(s.text) || s.text.includes(anchor))) segs.push({ x: bk.x + s.x, y: bk.y + i * Lb.lh, w: s.w, h: Lb.lh }); }));
      if (!segs.length) { Loom.error("component_params", `app_docs_editor.comment: "${anchor}" is not in block ${bi}`); return at0(at); }
      const s0 = segs[0], sN = segs[segs.length - 1];
      // the hand selects the phrase (a drag), the selection grows under it
      const D = H.drag({ x: s0.x + 2, y: s0.y + s0.h / 2 + bk.shift }, { x: sN.x + sN.w - 2, y: sN.y + sN.h / 2 + bk.shift }, at0(at));
      const total = segs.reduce((a, s) => a + s.w, 0);
      const washes = segs.map((s) => AK.box(bk.under, s.x - 2, s.y + 3, 0.1, s.h - 6, { r: 3, fill: tones.warnWash }));
      Loom.drive((e) => { let left = e * total; segs.forEach((s, i) => { const w = Math.max(0.1, Math.min(s.w, left)); left -= s.w; washes[i].setAttribute("width", AK.f1(w + 4)); }); }, D.t0 + 0.1, Math.max(0.2, D.t1 - D.t0 - 0.1), "linear", AK.meta("reveal", "app.select"));
      const tc = H.click(commentB, D.t1 + 0.35);
      const C = card({ y: sN.y + bk.shift - 6, author: p.me || "", body: [{ text, max: 4 }], tone: T.accent });
      if (!C) return tc + 0.3;
      C.g.setAttribute("opacity", 0);
      AK.show(C.g, tc + 0.12, 0.2);
      const node = C.nodes[0];
      const te = AK.type(node, tc + 0.45, { cps: p.cps, size: Z.small, caret: C.box, color: AK.c(T.accent) });
      return te + 0.3;
    };
    function resolve(id, how, at) {
      const s = sugs.find((q) => q.id === id || sugs.indexOf(q) === id);
      const bk = s && blocks.find((q) => q.bi === s.block);
      if (!s || !bk || !s.card) { Loom.error("component_params", `app_docs_editor.${how === "accepted" ? "accept" : "reject"}: suggestion "${id}" is not on screen`); return at0(at); }
      const tp = H.click(s.card.btns[how === "accepted" ? 0 : 1], at0(at));
      s.state = how;
      // the block reflows without the struck (or the inserted) words; the blocks below close up or open
      const nb = drawBlock(docG, bk.bi, bk.b, bk.y);
      nb.g.setAttribute("opacity", 0);
      if (bk.shift) { nb.shift = bk.shift; nb.g.setAttribute("transform", `translate(0 ${bk.shift})`); }
      AK.hide(bk.g, tp + 0.12, 0.15); AK.show(nb.g, tp + 0.15, 0.2);
      const dh = nb.h - bk.h;
      if (dh) after(bk, dh, tp + 0.2);
      Object.assign(bk, { g: nb.g, under: nb.under, R: nb.R, h: nb.h, lay: nb.lay });
      AK.hide(s.card.g, tp + 0.1, 0.2);
      return tp + 0.5;
    }
    A.accept = (id, at) => resolve(id, "accepted", at);
    A.reject = (id, at) => resolve(id, "rejected", at);
    A.restore = function (i, at) {
      const r = vRows[i];
      if (!r) { Loom.error("component_params", `app_docs_editor.restore: version ${i} is not listed`); return at0(at); }
      const th = H.click(histB, at0(at));
      AK.show(hist, th + 0.1, 0.25);
      Loom.drive((e) => histBox.setAttribute("transform", `translate(${AK.f1(VW * 0.3 * (1 - e))} 0)`), th + 0.1, 0.3, "enter", AK.meta("reveal", "app.history"));
      const tr = H.click(r, th + 0.9);
      vRows.forEach((q, k) => { if (q && k !== i) AK.hide(q.sel, tr + 0.05, 0.12); });
      AK.show(r.sel, tr + 0.05, 0.15);
      // the page shows that version (its own blocks when given)
      if (vers[i].blocks) {
        const vg = svg("g", { opacity: 0 }, pageG);
        drawDoc(vg, vers[i].blocks, { version: true });
        AK.hide(docG, tr + 0.15, 0.2); AK.hide(cardsG, tr + 0.15, 0.2); AK.show(vg, tr + 0.2, 0.25);
      }
      const tb2 = H.click(restoreB, tr + 1.0);
      AK.hide(hist, tb2 + 0.15, 0.2);
      return L.restored ? H.toast(L.restored, tb2 + 0.4, { icon: "rotate-ccw" }) : tb2 + 0.4;
    };
    A.setState = function (name, at) { return states.set(name, at0(at)); };
    A.state = A.setState;
    AK.reveal(g, p.at);
    AK.runSteps(A, p.steps, { type: ["text", "at", "opts"], comment: ["block", "anchor", "text", "at"], accept: ["id", "at"], reject: ["id", "at"], restore: ["i", "at"], state: ["state", "at"] });
    return Object.assign({ host: H, topbar: top, toolbar: tbar, page: pageG, blocks, cards, historyPanel: hist, states }, A);
  },
});
