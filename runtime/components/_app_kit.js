/* Loom app kit: the shared parts of the screencast app shells (Family M, hand-off sheet T-149 to T-162).
 *
 * Not a component: the helpers the app_* components share, loaded before them (files starting with "_" load first).
 * It solves, once, what every shell needs:
 *   - a theme: which pack token plays each product role (accent, sidebar, page, card), a radius, a density and a text
 *     scale (reference fidelity: a shell can sit close to a product's arrangement without its marks);
 *   - UI text at video sizes in the pack's own roles (caption for UI text, label for headings), measured, never below
 *     the role's floor; one line truncates at a WORD boundary with an ellipsis (a cut word would be a word no param
 *     supplied), several lines clamp the same way;
 *   - rich runs (a mention, a suggestion's insert and delete, a comment's anchor) laid out word by word;
 *   - the host: the window and its pointer. In the screencast style with its engine (runtime/engines/screencast.js)
 *     the window, the pointer, the camera and the teaching layer are the engine's (W.app) and the shell draws its body
 *     inside the app; in every other style (and in the library sheet, which loads no engine) the shell draws its own
 *     window and its own pointer;
 *   - motion as pure functions of time: the pointer's path, typing, fades, slides and state switches are drives and
 *     tweens on the lesson's timeline, never timers.
 * Colours are pack tokens (mixes of tokens for washes and hairlines), fonts are pack roles. No words of its own: every
 * word drawn is passed in by the shell, which takes it from its params.
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const K = () => Loom.kit;
  const svg = (t, a, p) => Loom.svg(t, a, p);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const minjerk = (u) => { u = clamp(u, 0, 1); return u * u * u * (10 - 15 * u + 6 * u * u); };
  const AK = (Loom.appKit = {});
  AK.clamp = clamp; AK.f1 = f1; AK.minjerk = minjerk;

  // ------------------------------------------------------------------ theme, tones, sizes
  const ROLE_TOKENS = { accent: "accent", sidebar: "surface", page: "surface2", card: "surface" };
  /** theme: {accent, sidebar, page, card (tokens), radius, density (0.85 to 1.3), text (1 to 1.4)} */
  AK.theme = function (th) {
    th = th || {};
    const pal = S().pack.palette, T = {};
    for (const [k, d] of Object.entries(ROLE_TOKENS)) {
      const v = th[k] == null ? d : th[k];
      if (!(v in pal)) { Loom.error("component_params", `app theme.${k} = "${v}" is not a style token`); T[k] = d; } else T[k] = v;
    }
    const sh = S().pack.shape || {};
    T.radius = clamp(th.radius == null ? Math.min(12, Math.max(4, sh.radius || 8)) : +th.radius, 0, 24);
    T.density = clamp(th.density == null ? 1 : +th.density, 0.85, 1.3);
    T.scale = clamp(th.text == null ? 1 : +th.text, 1, 1.4);
    return T;
  };
  AK.c = (tok) => S().c(tok);
  AK.mix = (a, b, p) => S().mix(S().c(a), S().c(b), p);
  AK.tones = function (T) {
    return {
      page: S().c(T.page), side: S().c(T.sidebar), card: S().c(T.card), accent: S().c(T.accent),
      hair: AK.mix(T.card, "line", 0.3), hair2: AK.mix(T.card, "line", 0.55), sel: AK.mix(T.card, T.accent, 0.13),
      hover: AK.mix(T.card, T.accent, 0.06), wash: AK.mix(T.card, T.accent, 0.22), track: AK.mix(T.card, "line", 0.4),
      chrome: AK.mix("surface2", "field2", 0.5), dot: AK.mix("field2", "line", 0.4), shadow: S().c("shadow" in S().pack.palette ? "shadow" : "ink"),
      warnWash: AK.mix(T.card, "accent4", 0.18), negWash: AK.mix(T.card, "neg", 0.14), posWash: AK.mix(T.card, "pos", 0.16),
    };
  };
  /** the line box a role really needs at a size (the face's own ascent and descent can exceed 1.36 em) */
  AK.lineH = function (size, role, weight) {
    const v = K().vmetrics(role || "caption", size, weight);
    return Math.ceil(Math.max(size * 1.36, v.ascent + v.descent)) + 1;
  };
  /** relative luminance of a computed colour (WCAG) */
  AK.lum = function (hex) {
    const h = String(hex).replace(/^#/, ""), v = h.length === 3 ? h.split("").map((c) => c + c) : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)];
    const [r, g, b] = (h.length === 3 ? v : v).map((x) => { const c = parseInt(x, 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  /** the darkest of the pack's neutral tokens (a video player, a dark panel), whatever the pack */
  AK.darkTok = function () {
    const pal = S().pack.palette;
    return ["shadow", "ink", "field", "field2", "surface", "surface2"].filter((t) => t in pal).sort((a, b) => AK.lum(pal[a]) - AK.lum(pal[b]))[0];
  };
  /** the pack token that reads best on a computed colour */
  AK.onHex = function (hex) {
    const pal = S().pack.palette;
    return ["ink", "field", "surface", "onAccent"].filter((t) => t in pal).sort((a, b) => S().contrast(hex, pal[b]) - S().contrast(hex, pal[a]))[0];
  };
  /** the token that reads best on a SOLID fill this kit drew. Loom.style.pickTokenOn answers "ink" in outlined styles
   * (it expects a sparse sketch fill), which is wrong on a solid status bar or badge: white on bright cyan in hologram. */
  AK.on = (tok) => AK.onHex(S().c(tok));
  /** a solid mark (status bar, badge, brand tile, avatar) and the colour of what sits on it. In the outlined styles
   * (line, sketch: hologram, blueprint, line-art, whiteboard) kit text turns knockout colours back to ink, so a solid
   * accent there would carry light ink on a light fill: the mark is drawn as line art instead, its glyphs in the accent. */
  AK.solid = (tok) => (S().outlined() ? { fill: "surface", stroke: tok, sw: 2, fg: tok } : { fill: tok, stroke: null, sw: 0, fg: AK.on(tok) });
  /** sizes from the pack's roles: UI text (caption), small text (the caption floor), headings (label), titles (lead) */
  AK.sizes = function (T) {
    const ty = S().pack.type, cap = ty.caption || [20, 24], lab = ty.label || [24, 30], lead = ty.lead || [32, 40];
    const fs = clamp(Math.round(21 * T.scale), cap[0], cap[1]);
    const small = cap[0];
    const head = clamp(Math.round(24 * T.scale), lab[0], lab[1]);
    const big = clamp(Math.round(32 * T.scale), lead[0], lead[1]);
    const lh = AK.lineH(fs), lhS = AK.lineH(small), lhH = AK.lineH(head, "label", 700), lhB = AK.lineH(big, "lead", 700);
    const d = T.density;
    return { fs, small, head, big, lh, lhS, lhH, lhB, pad: Math.round(18 * d), gap: Math.round(12 * d), row: Math.round(Math.max(lh + 22, 54) * d),
      ctl: AK.boxH(fs, "caption", 600, Math.round(Math.max(lh + 18, 46) * d)), r: T.radius };
  };
  AK.measure = (str, role, size, weight) => K().measure(String(str), role || "caption", size, weight);

  // ------------------------------------------------------------------ text
  /** str cut at a word boundary (with an ellipsis) to fit w at this size; a first word wider than w keeps its letters
   *  that fit (rare: give the box room) */
  AK.fitWordsOrNull = function (str, role, size, weight, w) {
    str = String(str == null ? "" : str);
    if (AK.measure(str, role, size, weight) <= w) return str;
    const words = str.split(/\s+/).filter(Boolean);
    for (let n = words.length - 1; n >= 1; n--) {
      const s = words.slice(0, n).join(" ").replace(/[,;:.\-]+$/, "") + "…";
      if (AK.measure(s, role, size, weight) <= w) return s;
    }
    // one long token (a file name, an address): cut at a separator so every piece left is a whole word
    const w0 = words[0], seps = [];
    for (let i = 1; i < w0.length; i++) if (/[_\-./@]/.test(w0[i])) seps.push(i);
    for (let k = seps.length - 1; k >= 0; k--) { const s = w0.slice(0, seps[k]) + "…"; if (AK.measure(s, role, size, weight) <= w) return s; }
    // no whole word fits: say so (AK.T shrinks the size a little or draws nothing). A word cut to its first letters is a
    // word no param supplied: batch-01's app_email drew "Escalatio..." in the hologram pack on Windows (2026-10-16)
    return null;
  };
  /** fitWordsOrNull for callers that need a string: an empty one when no whole word fits (never a word cut to letters) */
  AK.fitWords = function (str, role, size, weight, w) { const s = AK.fitWordsOrNull(str, role, size, weight, w); return s == null ? "" : s; };
  /** the height a one-line box needs so its words keep the inset the checks ask (max(6, 0.2 x size) above and below) */
  AK.boxH = function (size, role, weight, minH) {
    const v = K().vmetrics(role || "caption", size, weight || 400);
    return Math.max(minH || 0, Math.ceil(v.ascent + v.descent + 2 * Math.max(7, 0.22 * size)));
  };
  /** one line of UI text, measured, truncated at a word boundary. o: {x, y, w, h, size, role, weight, color (token),
   *  fill (a computed colour, set after), align, valign}. Returns the <text> (t.__cut when it was truncated). */
  AK.T = function (g, str, o) {
    o = o || {};
    const role = o.role || "caption", w = Math.max(10, o.w || 400);
    let size = o.size || S().size(role, 21);
    o = Object.assign({}, o, { weight: o.weight || 400 });
    let s = AK.fitWordsOrNull(str, role, size, o.weight, w - 2);
    // the first word alone does not fit: a size or two smaller (never under the pack's floor for the role), else nothing
    const floor = Math.max(20, ((S().pack.type || {})[role] || [20])[0]);
    for (const k of [0.92, 0.85]) {
      if (s != null || size * k < floor) break;
      const s2 = AK.fitWordsOrNull(str, role, size * k, o.weight, w - 2);
      if (s2 != null) { s = s2; size = size * k; }
    }
    // still nothing fits: `whole` callers get null as before; the rest an empty line (the node stays for their states)
    if (s == null) { if (o.whole) return null; s = ""; }
    // whole: draw nothing rather than a word cut to its first letters (a narrow box)
    if (o.whole && s !== String(str) && !/\s/.test(s) && s.replace("…", "").length < String(str).split(/\s+/)[0].length) return null;
    const h = Math.max(o.h || 0, AK.lineH(size, role, o.weight));
    const y = o.h && o.h < h ? (o.y || 0) - (h - o.h) / 2 : o.y || 0;
    const t = K().text(g, s, { role, size, x: o.x || 0, y, w, h, maxLines: 1, valign: o.valign || "middle", align: o.align || "left", weight: o.weight, color: o.color || "ink" });
    if (o.fill) t.setAttribute("fill", o.fill);
    t.__cut = s !== String(str);
    t.__w = AK.measure(s, role, size, o.weight);
    return t;
  };
  /** several lines, clamped to maxLines at a word boundary: {text, lines, h, cut} (measure, then draw) */
  AK.clampText = function (str, o) {
    const role = o.role || "caption", size = o.size, w = o.w, maxLines = o.maxLines || 3, wt = o.weight || 400;
    str = String(str == null ? "" : str);
    const F = K().fit(str, { role, size, w, h: 1e5, maxLines: 999, weight: wt });
    let text = str, lines = F.lines, cut = false;
    if (F.lines.length > maxLines) {
      cut = true;
      lines = F.lines.slice(0, maxLines);
      let last = lines[maxLines - 1].split(" ");
      while (last.length > 1 && AK.measure(last.join(" ") + "…", role, size, wt) > w) last.pop();
      lines[maxLines - 1] = last.join(" ").replace(/[,;:.\-]+$/, "") + "…";
      text = lines.join(" ");
    }
    const n = Math.max(1, lines.length);
    const lh = size * 1.36, v = K().vmetrics(role, size, wt);
    const h = Math.ceil((n - 1) * lh + Math.max(lh, v.ascent + v.descent)) + 2;
    return { text, lines, h, cut, n };
  };
  /** a clamped paragraph at (x, y), top aligned; returns the <text> with __h (its height) */
  AK.P = function (g, str, o) {
    const role = o.role || "caption", size = o.size || S().size(role, 21);
    const c = AK.clampText(str, { role, size, w: o.w, maxLines: o.maxLines || 3, weight: o.weight });
    const t = K().text(g, c.text, { role, size, x: o.x || 0, y: o.y || 0, w: o.w, h: c.h, maxLines: c.n, valign: "top", align: o.align || "left", weight: o.weight || 400, color: o.color || "ink" });
    if (o.fill) t.setAttribute("fill", o.fill);
    t.__h = c.h; t.__cut = c.cut; t.__lines = c.lines;
    return t;
  };
  AK.paraH = (str, o) => AK.clampText(str, Object.assign({ role: "caption" }, o)).h;

  // ------------------------------------------------------------------ rich runs (mentions, inserts, deletes, anchors)
  /** runs: [{text, style}] -> lines of segments laid out greedily in w: [{segs: [{text, style, x, w}], w}]
   *  styles: {name: {weight}} (only the weight changes a width) */
  AK.layoutRuns = function (runs, o) {
    const role = o.role || "caption", size = o.size, w = o.w, styles = o.styles || {};
    const words = [];
    let carry = false;   // a run that ends in a space leaves it to the next run's first word
    for (const r of runs) {
      const parts = String(r.text).split(/(\s+)/);
      let lead = carry || /^\s/.test(r.text);
      carry = /\s$/.test(r.text);
      for (const p of parts) {
        if (!p) continue;
        if (/^\s+$/.test(p)) { lead = true; continue; }
        words.push({ text: p, style: r.style || "plain", space: lead && words.length > 0 });
        lead = false;
      }
    }
    const wt = (st) => (styles[st] || {}).weight || 400;
    const sp = (st) => AK.measure(" ", role, size, wt(st));
    const lines = []; let cur = [], cx = 0;
    for (const wd of words) {
      const ww = AK.measure(wd.text, role, size, wt(wd.style));
      const gap = cur.length && wd.space ? sp(wd.style) : 0;
      if (cur.length && cx + gap + ww > w) { lines.push(cur); cur = []; cx = 0; }
      const g2 = cur.length && wd.space ? sp(wd.style) : 0;
      cur.push({ text: wd.text, style: wd.style, x: cx + g2, w: ww, space: g2 > 0 });
      cx += g2 + ww;
    }
    if (cur.length) lines.push(cur);
    // merge neighbours of one style into a segment (one text node each)
    return lines.map((ln) => {
      const segs = [];
      for (const wd of ln) {
        const last = segs[segs.length - 1];
        if (last && last.style === wd.style) { last.text += (wd.space ? " " : "") + wd.text; last.w = wd.x + wd.w - last.x; }
        else segs.push({ text: wd.text, style: wd.style, x: wd.x, w: wd.w });
      }
      const lw = ln.length ? ln[ln.length - 1].x + ln[ln.length - 1].w : 0;
      return { segs, w: lw };
    });
  };
  /** draws laid-out runs at (x, y); washes and marks go in their own group under the words (so a wash is never taken for
   *  the card a word sits on). styles: {name: {weight, color (token), fill (computed colour), wash (computed colour),
   *  strike (computed colour), under (computed colour)}}. Returns {g, segs: [{node, x, y, w, h, style, text}], h} */
  AK.drawRuns = function (g, lines, o) {
    const role = o.role || "caption", size = o.size, styles = o.styles || {}, lh = o.lh || AK.lineH(size, role);
    const root = svg("g", {}, g), under = svg("g", {}, root), words = svg("g", {}, root), over = svg("g", {}, root);
    const out = [];
    lines.forEach((ln, i) => {
      const y = (o.y || 0) + i * lh;
      for (const sg of ln.segs) {
        const st = styles[sg.style] || {}, x = (o.x || 0) + sg.x;
        if (st.wash) svg("rect", { x: f1(x - 3), y: f1(y + 2), width: f1(sg.w + 6), height: f1(lh - 4), rx: 4, fill: st.wash }, under);
        const t = K().text(words, sg.text, { role, size, x, y, w: sg.w + 4, h: lh, maxLines: 1, valign: "middle", weight: st.weight || 400, color: st.color || "ink" });
        if (st.fill) t.setAttribute("fill", st.fill);
        const v = K().vmetrics(role, size, st.weight), base = y + (lh - (v.ascent + v.descent)) / 2 + v.ascent;
        if (st.strike) svg("rect", { x: f1(x), y: f1(base - v.ascent * 0.32), width: f1(sg.w), height: 2.2, fill: st.strike }, over);
        if (st.under) svg("rect", { x: f1(x), y: f1(base + 3), width: f1(sg.w), height: 2.2, fill: st.under }, over);
        out.push({ node: t, x, y, w: sg.w, h: lh, style: sg.style, text: sg.text });
      }
    });
    return { g: root, segs: out, h: lines.length * lh };
  };

  // ------------------------------------------------------------------ shapes
  /** a raw rect in tokens or computed colours (fill/stroke: a token name or a computed colour from AK.mix/AK.tones) */
  const col = (v) => (v == null || v === "none" ? "none" : v.charAt(0) === "#" || v.startsWith("rgb") ? v : S().c(v));
  AK.col = col;
  AK.box = function (g, x, y, w, h, o) {
    o = o || {};
    return svg("rect", { x: f1(x), y: f1(y), width: f1(Math.max(0, w)), height: f1(Math.max(0, h)), rx: o.r == null ? 8 : o.r,
      fill: col(o.fill), stroke: o.stroke ? col(o.stroke) : "none", "stroke-width": o.stroke ? o.sw || 1.5 : 0, opacity: o.opacity }, g);
  };
  AK.icon = function (g, name, cx, cy, size, tok, fill) {
    const ic = K().icon(g, name, { x: cx, y: cy, size: size || 24, color: tok || "muted" });
    if (fill && ic) ic.setAttribute("stroke", fill);
    return ic;
  };
  /** initials of a name (the first letters of its first two words) */
  AK.initials = (name) => String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
  const AV_TONES = ["accent", "accent3", "accent4", "pos", "neg"];
  AK.avatarTone = function (name) {
    const list = S().roleList ? S().roleList("avatar", AV_TONES) : AV_TONES;
    return list[Loom.hash(String(name || "")) % list.length];
  };
  /** a round avatar with initials (two letters: never a word) */
  AK.avatar = function (g, cx, cy, r, name, tone) {
    const tn = tone || AK.avatarTone(name), gg = svg("g", {}, g);
    const ini = AK.initials(name).slice(0, 2);
    const sz = clamp(Math.round(r * 0.85), S().pack.type.caption[0], 40);
    // never below the caption floor: a small avatar grows to hold its initials
    if (ini) r = Math.max(r, (AK.measure(ini, "caption", sz, 700) + 12) / 2, AK.lineH(sz, "caption", 700) / 2);
    const SD = AK.solid(tn);
    svg("circle", Object.assign({ cx: f1(cx), cy: f1(cy), r: f1(r), fill: S().c(SD.fill) }, SD.stroke ? { stroke: S().c(SD.stroke), "stroke-width": SD.sw } : {}), gg);
    if (ini) {
      K().text(gg, ini, { role: "caption", size: sz, x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, maxLines: 1, valign: "middle", align: "center", weight: 700, color: SD.fg });
    }
    gg.__r = r;
    return gg;
  };
  /** a pill sized to its words: {g, w, h}. o: {size, fill (computed or token), color (token), icon, weight, padX, h} */
  AK.pill = function (g, x, y, str, o) {
    o = o || {};
    const size = o.size || S().size("caption", 20), role = "caption";
    const v = K().vmetrics(role, size, o.weight);
    const h = Math.max(o.h || 0, Math.ceil(v.ascent + v.descent) + 16);
    void v;
    const pad = o.padX == null ? 12 : o.padX, icW = o.icon ? size + 6 : 0;
    const tw = str != null && str !== "" ? AK.measure(str, role, size, o.weight) : 0;
    const w = Math.ceil(tw + 2 * pad + icW + (tw ? 4 : 0));
    const gg = svg("g", {}, g);
    const x0 = o.align === "right" ? x - w : x;
    AK.box(gg, x0, y, w, h, { r: o.r == null ? h / 2 : o.r, fill: o.fill || "surface2", stroke: o.stroke, sw: o.sw });
    if (o.icon) AK.icon(gg, o.icon, x0 + pad + size / 2, y + h / 2, size, o.color || "ink", o.iconFill);
    let t = null;
    if (tw) t = K().text(gg, str, { role, size, x: x0 + pad + icW, y, w: tw + 4, h, maxLines: 1, valign: "middle", weight: o.weight, color: o.color || "ink" });
    if (t && o.textFill) t.setAttribute("fill", o.textFill);
    return { g: gg, x: x0, y, w, h, text: t };
  };
  /** a button sized to its label (or a square icon button with no label): {g, x, y, w, h, cx, cy}
   *  o: {label, icon, kind: primary|secondary|ghost|danger, h, size, T (theme), align: "right" (x is the right edge)} */
  AK.button = function (g, x, y, o) {
    const T = o.T || AK.theme(), Z = o.Z || AK.sizes(T), tones = AK.tones(T), kind = o.kind || "secondary";
    const size = o.size || Z.fs, h = AK.boxH(size, "caption", 600, o.h || Z.ctl), lab = o.label != null && o.label !== "" ? String(o.label) : "";
    const icW = o.icon ? 30 : 0, tw = lab ? AK.measure(lab, "caption", size, 600) : 0;
    const w = lab ? Math.ceil(tw + (o.icon ? 68 : 40)) : h;
    const x0 = o.align === "right" ? x - w : x;
    const gg = svg("g", {}, g);
    const fill = kind === "primary" ? T.accent : kind === "danger" ? "neg" : kind === "ghost" ? "none" : tones.card;
    const outlined = S().outlined();
    AK.box(gg, x0, y, w, h, { r: Math.min(T.radius, h / 2), fill: outlined && kind !== "ghost" ? tones.card : fill, stroke: kind === "secondary" ? tones.hair2 : outlined && kind !== "ghost" ? fill : null, sw: outlined ? 2.5 : 1.5 });
    const fg = outlined ? (kind === "primary" ? T.accent : kind === "danger" ? "neg" : "ink") : kind === "primary" || kind === "danger" ? Loom.style.pickTokenOn(kind === "danger" ? "neg" : T.accent) : kind === "ghost" ? T.accent : "ink";
    if (o.icon) AK.icon(gg, o.icon, lab ? x0 + 18 + 12 : x0 + w / 2, y + h / 2, Math.round(size * 1.05), fg);
    let t = null;
    if (lab) t = K().text(gg, lab, { role: "caption", size, x: x0 + (o.icon ? 18 + icW + 2 : 18), y, w: tw + 4, h, maxLines: 1, valign: "middle", weight: 600, color: fg });
    void icW;
    return { g: gg, x: x0, y, w, h, cx: x0 + w / 2, cy: y + h / 2, text: t };
  };
  /** a text field: {g, x, y, w, h, value: text|null, ph: text|null}; o: {value, placeholder, icon, size, T, Z} */
  AK.field = function (g, x, y, w, h, o) {
    const T = o.T, Z = o.Z, tones = AK.tones(T), gg = svg("g", {}, g);
    AK.box(gg, x, y, w, h, { r: Math.min(T.radius, h / 2), fill: o.fill || tones.card, stroke: tones.hair2, sw: 1.5 });
    const ring = AK.box(gg, x - 2, y - 2, w + 4, h + 4, { r: Math.min(T.radius, h / 2) + 2, fill: "none", stroke: T.accent, sw: 2.5, opacity: 0 });
    let tx = x + 16;
    if (o.icon) { AK.icon(gg, o.icon, x + 16 + 11, y + h / 2, 22, "muted"); tx = x + 50; }
    const tw = w - (tx - x) - 14;
    const val = o.value ? AK.T(gg, o.value, { x: tx, y, w: tw, h, size: o.size || Z.fs }) : null;
    const ph = !o.value && o.placeholder ? AK.T(gg, o.placeholder, { x: tx, y, w: tw, h, size: o.size || Z.fs, color: "muted" }) : null;
    return { g: gg, x, y, w, h, tx, tw, value: val, ph, ring };
  };

  // ------------------------------------------------------------------ motion helpers (pure functions of time)
  const meta = (kind, name) => ({ kind, beat: Loom.ctxBeat && Loom.ctxBeat.id, name, content: kind !== "gesture" });
  AK.meta = meta;
  /** fade a node between opacities */
  AK.fade = function (node, from, to, t, dur) {
    if (!node) return t;
    Loom.tween(node, { opacity: from }, { opacity: to, duration: dur == null ? 0.2 : dur, ease: Loom.ease.enter }, t, meta(to > from ? "reveal" : "state", "app"));
    return t + (dur == null ? 0.2 : dur);
  };
  AK.show = (node, t, dur) => AK.fade(node, 0, 1, t, dur);
  AK.hide = (node, t, dur) => AK.fade(node, 1, 0, t, dur);
  /** a group's offset over time: each call moves it from where the previous call left it */
  const OFF = new WeakMap();
  AK.shift = function (node, dx, dy, t, dur, ease) {
    const a = OFF.get(node) || { x: 0, y: 0 }, b = { x: dx, y: dy };
    OFF.set(node, b);
    const e = ease || "move";
    Loom.drive((k) => node.setAttribute("transform", `translate(${f1(a.x + (b.x - a.x) * k)} ${f1(a.y + (b.y - a.y) * k)})`), t, dur == null ? 0.35 : dur, e, meta("travel", "app"));
    return t + (dur == null ? 0.35 : dur);
  };
  /** record where a group already is (after a drive moved it), so the next AK.shift starts from there */
  AK.setShift = function (node, dx, dy) { OFF.set(node, { x: dx, y: dy }); };
  /** a set of alternative layers (a state machine): only one shown at a time. set(name, t) cross-fades. */
  AK.states = function (layers, initial) {
    const cur = { name: initial };
    for (const [k, n] of Object.entries(layers)) if (n) n.setAttribute("opacity", k === initial ? 1 : 0);
    return {
      layers, get: () => cur.name,
      set(name, t, dur) {
        if (!(name in layers)) throw new Error(`app state "${name}" is not one of ${Object.keys(layers).join(", ")}`);
        if (name === cur.name) return t;
        AK.fade(layers[cur.name], 1, 0, t, dur == null ? 0.18 : dur);
        AK.fade(layers[name], 0, 1, t + 0.05, dur == null ? 0.22 : dur);
        cur.name = name;
        return t + 0.3;
      },
    };
  };
  /** typing into a drawn <text> (one or more tspans, one a line): empty until `at`, characters land at cps, a caret
   *  follows. o: {cps, role, size, weight, caret: parent group, color (computed caret colour), align}. Returns the end. */
  AK.type = function (node, at, o) {
    o = o || {};
    const role = o.role || "caption", size = o.size, wt = o.weight || 400;
    const spans = Array.from(node.querySelectorAll("tspan"));
    const lines = spans.length ? spans.map((s) => s.textContent) : [node.textContent];
    const total = lines.reduce((a, s) => a + s.length, 0) + Math.max(0, lines.length - 1);
    const cps = o.cps || 14, dur = Math.max(0.3, total / cps);
    const caretH = size * 1.15;
    const caret = o.caret ? svg("rect", { x: 0, y: 0, width: 2.5, height: f1(caretH), fill: o.color || S().c("accent"), opacity: 0 }, o.caret) : null;
    const xs = spans.map((s) => +s.getAttribute("x")), ys = spans.map((s) => +s.getAttribute("y"));
    const v = K().vmetrics(role, size, wt);
    Loom.drive((e, raw) => {
      const now = at + raw * (dur + 0.6);
      let k = clamp(Math.floor(((now - at) / dur) * total + 1e-6), 0, total);
      let li = 0, shown = "";
      for (let i = 0; i < lines.length; i++) {
        const n = lines[i].length;
        const s = lines[i].slice(0, Math.max(0, k));
        (spans[i] || node).textContent = s;
        if (k > 0 || i === 0) { li = i; shown = s; }
        k -= n + 1;
      }
      if (caret) {
        const cx = (xs[li] || 0) + AK.measure(shown, role, size, wt) + 2, cy = (ys[li] || 0) - v.ascent + (v.ascent + v.descent - caretH) / 2;
        caret.setAttribute("x", f1(cx)); caret.setAttribute("y", f1(cy));
        const typing = now >= at && now <= at + dur;
        caret.setAttribute("opacity", raw <= 0 || raw >= 1 ? 0 : typing || Math.floor((now - at) / 0.5) % 2 === 0 ? 1 : 0);
      }
    }, at, dur + 0.6, "linear", { kind: "typewriter", content: true, beat: Loom.ctxBeat && Loom.ctxBeat.id });
    for (let i = 0; i < total; i += 3) Loom.sfx && Loom.sfx("key", at + (i / total) * dur, { i, g: 0.4 });
    return at + dur;
  };

  // ------------------------------------------------------------------ the host: the window, the pointer, toasts
  /** host(ctx, g, p, {title, name}): draws the window (or asks the screencast engine for it) and returns
   *  {body: {g, over, w, h}, engine: A | null, click(rect, at, o), move(rect, at), pointerIn(at), toast(text, at, o), free}
   *  rects are in BODY coordinates. Times are absolute seconds. */
  AK.host = function (ctx, g, p, o) {
    o = o || {};
    const T = o.T, tones = AK.tones(T), Z = o.Z;
    const eng = p.engine !== "off" && Loom.engines && Loom.engines.current ? Loom.engines.current() : null;
    if (eng && eng.id === "screencast" && eng.api && eng.api.app) return engineHost(ctx, g, p, o, eng.api, T, Z, tones);
    const H = { T, Z, tones, engine: null, free: -1 };
    const R = Math.max(T.radius, 8) + 4;
    // the window: the pack's shape language for the frame, a quiet bar with three dots and the window's title
    const frame = svg("g", { class: "lm-app-frame" }, g);
    K().rect(frame, 0, 0, p.w, p.h, { fill: "surface", r: R, stroke: "line", sw: 1.5, shadow: true });
    const barH = o.barH || Math.max(52, Z.lhS + 18);
    const bar = svg("g", {}, frame);
    svg("path", { d: `M0 ${barH} L0 ${R} Q0 0 ${R} 0 L${p.w - R} 0 Q${p.w} 0 ${p.w} ${R} L${p.w} ${barH} Z`, fill: tones.chrome }, bar);
    svg("rect", { x: 0, y: barH - 1, width: p.w, height: 1.5, fill: tones.hair2 }, bar);
    [0, 1, 2].forEach((i) => svg("circle", { cx: 28 + i * 24, cy: barH / 2, r: 7, fill: tones.dot }, bar));
    if (o.title) AK.T(bar, o.title, { x: 120, y: 0, w: p.w - 240, h: barH, size: Z.small, weight: 600, color: "muted", align: "center" });
    const bodyH = p.h - barH;
    const clipId = Loom.uid ? Loom.uid("appclip") : "appclip";
    const cp = svg("clipPath", { id: clipId }, g);
    svg("path", { d: `M0 ${barH} L${p.w} ${barH} L${p.w} ${p.h - R} Q${p.w} ${p.h} ${p.w - R} ${p.h} L${R} ${p.h} Q0 ${p.h} 0 ${p.h - R} Z` }, cp);
    const bodyOuter = svg("g", { "clip-path": `url(#${clipId})` }, g);
    const bg = svg("g", { transform: `translate(0 ${barH})` }, bodyOuter);
    const over = svg("g", { transform: `translate(0 ${barH})` }, g);
    const ptrG = svg("g", { transform: `translate(0 ${barH})` }, g);
    H.body = { g: bg, over, w: p.w, h: bodyH, x: 0, y: barH };
    H.frame = { barH, R };
    // ---- the pointer: the learner's hand, on a slight arc at minimum-jerk speed, a dip and a ring on each press
    const P = { segs: [], pos: { x: p.w * 0.7, y: bodyH * 0.6 }, shown: null };
    const pg = svg("g", { opacity: 0 }, ptrG), arrow = svg("g", {}, pg);
    const AR = "M0 0 L0 36 L9 28 L15.5 43 L22 40.2 L15.6 25.6 L27.5 25.6 Z";
    svg("path", { d: AR, transform: "translate(2.5 3)", fill: tones.shadow, opacity: 0.22 }, arrow);
    svg("path", { d: AR, fill: S().c("ink"), stroke: S().c("surface"), "stroke-width": 2.6, "stroke-linejoin": "round" }, arrow);
    function posAt(t) {
      let pos = P.segs.length ? P.segs[0].a : P.pos;
      for (const s of P.segs) {
        if (t < s.t0) break;
        if (t >= s.t1) { pos = s.b; continue; }
        const u = minjerk((t - s.t0) / (s.t1 - s.t0)), arc = Math.sin(Math.PI * u) * s.bow;
        pos = { x: s.a.x + (s.b.x - s.a.x) * u - (s.b.y - s.a.y) * arc, y: s.a.y + (s.b.y - s.a.y) * u + (s.b.x - s.a.x) * arc };
        break;
      }
      return pos;
    }
    const place = (t) => { const q = posAt(t); pg.setAttribute("transform", `translate(${f1(q.x)} ${f1(q.y)})`); };
    H.pointerIn = function (at) {
      if (P.shown != null) return at;
      P.shown = at;
      place(at);
      AK.show(pg, at, 0.18);
      H.free = Math.max(H.free, at + 0.2);
      return at + 0.2;
    };
    // move to a point (body coords), arriving at `arrive` (or as soon as the hand is free); returns the arrival
    H.moveTo = function (x, y, arrive) {
      const a = Object.assign({}, P.segs.length ? P.segs[P.segs.length - 1].b : P.pos), b = { x, y };
      const d = Math.hypot(b.x - a.x, b.y - a.y), dur = clamp(0.42 + d / 1500, 0.5, 1.3);
      if (P.shown == null) H.pointerIn(Math.max(0, arrive - dur - 0.3));
      let t0 = arrive - dur;
      if (t0 < H.free) t0 = H.free;
      const seg = { t0, t1: t0 + dur, a, b, bow: 0.06 * ((P.segs.length % 2) ? -1 : 1) };
      P.segs.push(seg);
      Loom.drive((e, raw) => place(t0 + raw * dur), t0, dur, "linear", { kind: "cursor", beat: Loom.ctxBeat && Loom.ctxBeat.id, name: "app.pointer", content: true });
      H.free = seg.t1;
      return seg.t1;
    };
    H.press = function (x, y, t) {
      Loom.drive((e, raw) => { const k = raw < 0.5 ? raw * 2 : 2 - raw * 2; arrow.setAttribute("transform", `scale(${(1 - 0.12 * k).toFixed(3)})`); }, t, 0.16, "linear", meta("gesture", "app.press"));
      const ring = svg("circle", { cx: f1(x), cy: f1(y), r: 8, fill: "none", stroke: S().c("accent2"), "stroke-width": 4, opacity: 0 }, over);
      Loom.drive((e, raw) => { ring.setAttribute("r", f1(8 + 28 * e)); ring.setAttribute("opacity", raw > 0 && raw < 1 ? (0.9 * (1 - raw)).toFixed(3) : 0); }, t, 0.5, "enter", meta("gesture", "app.ring"));
      Loom.sfx && Loom.sfx("click", t, { g: 0.5 });
    };
    /** click a rect {x, y, w, h} (body coords) pressing at `at`; returns the press time (the reaction is the caller's) */
    H.click = function (r, at, co) {
      co = co || {};
      const x = r.x + (co.fx == null ? Math.min(r.w / 2, 60) : co.fx * r.w), y = r.y + (co.fy == null ? 0.5 : co.fy) * r.h;
      const arr = H.moveTo(x, y, at - 0.3);
      const tp = Math.max(at, arr + 0.24);
      H.press(x, y, tp);
      H.free = tp + 0.15;
      return tp;
    };
    H.move = function (r, at) { return H.moveTo(r.x + Math.min(r.w / 2, 60), r.y + r.h / 2, at); };
    /** a drag: press on `from`, carry to `to` (body points), release; returns {t0 (press), t1 (release)} */
    H.drag = function (from, to, at) {
      const tp = H.click({ x: from.x - 1, y: from.y - 1, w: 2, h: 2 }, at, { fx: 0.5, fy: 0.5 });
      const d = Math.hypot(to.x - from.x, to.y - from.y), dur = clamp(0.6 + d / 1200, 0.7, 1.6);
      const seg = { t0: tp + 0.12, t1: tp + 0.12 + dur, a: { x: from.x, y: from.y }, b: { x: to.x, y: to.y }, bow: 0.03 };
      P.segs.push(seg);
      Loom.drive((e, raw) => place(seg.t0 + raw * dur), seg.t0, dur, "linear", { kind: "cursor", beat: Loom.ctxBeat && Loom.ctxBeat.id, name: "app.pointer", content: true });
      H.free = seg.t1 + 0.15;
      return { t0: tp, t1: seg.t1, carry: (t) => posAt(t) };
    };
    H.posAt = posAt;
    /** the product's toast: bottom right of the body. o: {tone, icon, until} */
    H.toast = function (str, at, to) {
      to = to || {};
      const tn = to.tone || "pos", size = Z.fs, ic = to.icon || (tn === "neg" ? "circle-alert" : "circle-check");
      const tw = Math.min(AK.measure(str, "caption", size, 600), p.w * 0.45), h = Math.max(72, Z.lh + 34), w = Math.ceil(tw + 120);
      const x = p.w - w - 32, y = bodyH - h - 28;
      const tg = svg("g", { opacity: 0 }, over), box = svg("g", {}, tg);
      AK.box(box, x, y + 6, w, h, { r: 14, fill: tones.shadow, opacity: 0.12 });
      AK.box(box, x, y, w, h, { r: 14, fill: "surface", stroke: tones.hair2 });
      AK.box(box, x, y, 8, h, { r: 4, fill: tn });
      AK.icon(box, ic, x + 44, y + h / 2, 30, tn);
      AK.T(box, str, { x: x + 76, y, w: w - 100, h, size, weight: 600 });
      AK.show(tg, at, 0.28);
      Loom.drive((e) => box.setAttribute("transform", `translate(0 ${f1(18 * (1 - e))})`), at, 0.28, "enter", meta("reveal", "app.toast"));
      if (to.until !== false) AK.hide(tg, to.until || at + 3, 0.25);
      Loom.sfx && Loom.sfx(tn === "neg" ? "error" : "success", at + 0.05, { g: 0.35 });
      return at + 0.3;
    };
    return H;
  };

  // the screencast engine's host: the window, the pointer, the camera, toasts and the teaching layer are the engine's
  function engineHost(ctx, g, p, o, W, T, Z, tones) {
    const el = g && g.closest ? g.closest("g.lm-el") : null, E = el && el.__E;
    const ox = E ? E.x : 0, oy = E ? E.y : 0;
    const name = ((E && E.name) || o.name || "app") + "_app";
    const A = W.app(ctx, name, { chrome: "window", title: o.title || undefined, frame: { x: ox, y: oy, w: p.w, h: p.h }, content: [] }, { at: p.at >= 0 ? p.at : 0, exit: o.exit });
    const M = A.main;
    const bg = svg("g", { transform: `translate(${f1(M.x)} ${f1(M.y)})` }, A.layers.content);
    const over = svg("g", { transform: `translate(${f1(M.x)} ${f1(M.y)})` }, A.layers.over);
    const H = { T, Z, tones, engine: A, free: -1, body: { g: bg, over, w: M.w, h: M.h, x: M.x, y: M.y } };
    let nPart = 0;
    // a rect of the body as an engine part (the engine's pointer, camera and checks address parts by id)
    const toApp = (r) => {
      const id = r.id ? `${name}.${r.id}` : `${name}.at${++nPart}`;
      if (!A.parts[id]) A.reg({ id, kind: "button", x: r.x + M.x, y: r.y + M.y, w: Math.max(2, r.w || 2), h: Math.max(2, r.h || 2), g: A.layers.over, nofx: true });
      return id;
    };
    let shown = false;
    H.pointerIn = function (at) { if (!shown) { shown = true; A.pointer(Math.max(0, at)); } return at + 0.2; };
    H.click = function (r, at, co) {
      co = co || {};
      H.pointerIn(at - 1.2);
      const id = toApp(r);
      const end = A.click(id, { at, zoom: !!co.zoom, react: false, dx: co.fx == null ? Math.min(r.w / 2, 60) : co.fx * r.w, dy: (co.fy == null ? 0.5 : co.fy) * r.h });
      H.free = end;
      return Math.max(at, end - 0.22);
    };
    H.move = function (r, at) { H.pointerIn(at - 1.2); return A.move(toApp(r), { arrive: at, dx: Math.min(r.w / 2, 60), dy: r.h / 2 }); };
    H.moveTo = function (x, y, at) { H.pointerIn(at - 1.2); return A.move({ x: x + M.x, y: y + M.y }, { arrive: at }); };
    H.drag = function (from, to, at) {
      const tp = H.click({ x: from.x - 1, y: from.y - 1, w: 2, h: 2 }, at, { fx: 0.5, fy: 0.5 });
      const t1 = A.move({ x: to.x + M.x, y: to.y + M.y }, { at: tp + 0.12 });
      H.free = t1 + 0.15;
      return { t0: tp, t1, carry: (t) => { const q = A.pointerAt ? A.pointerAt(t) : null; return q && q.p ? { x: q.p.x - M.x, y: q.p.y - M.y } : { x: from.x + (to.x - from.x) * clamp((t - tp - 0.12) / Math.max(0.01, t1 - tp - 0.12), 0, 1), y: from.y + (to.y - from.y) * clamp((t - tp - 0.12) / Math.max(0.01, t1 - tp - 0.12), 0, 1) }; } };
    };
    H.posAt = null;
    H.toast = function (str, at, to) { to = to || {}; return A.toast(str, { at, tone: to.tone, icon: to.icon, until: to.until }); };
    return H;
  }

  // ------------------------------------------------------------------ mono text (batch 02: logs, code, a terminal)
  // Packs have no "mono" type role, so code is drawn as the screencast engine draws it: the pack's mono face
  // (Loom.style.font("mono")), each run of non-space characters at its own column (indentation kept), measured with the
  // face's real advance, and reported to Loom.report.texts so the vocabulary audit reads it like any other words.
  AK.monoW = (size) => K().measure("0000000000", "mono", size, 400) / 10;
  AK.monoFam = () => ((S().font && S().font("mono")) || {}).family || "monospace";
  /** true when the pack's mono role is a proportional face (a pack with no mono face, e.g. isometric, maps it to its body
   *  face): then a line flows as text, its indentation kept, instead of sitting on columns */
  AK.monoProp = (size) => Math.abs(K().measure("iiiiiiiiii", "mono", size, 400) - K().measure("MMMMMMMMMM", "mono", size, 400)) > 1;
  /** one line of code at (x, y) top, in a line box h: segs [[text, fill (computed), weight]] or a string with o.fill.
   *  o.w cuts the line at a word boundary to fit. Returns {t, spans, cols, w} */
  AK.mono = function (g, segs, o) {
    o = o || {};
    const size = o.size || 22, h = o.h || AK.lineH(size, "mono"), cw = AK.monoW(size);
    if (typeof segs === "string") segs = [[segs, o.fill || S().c("ink"), o.weight]];
    let str = segs.map((q) => q[0]).join("");
    if (o.w && str.replace(/\s+$/, "").length * cw > o.w) {
      const cut = AK.fitWords(str.replace(/\s+$/, ""), "mono", size, 400, o.w);
      const keep = cut.replace(/…$/, "").length;
      let left = keep; segs = segs.map(([t0, f, wt]) => { const t1 = t0.slice(0, Math.max(0, left)); left -= t0.length; return [t1, f, wt]; }).filter((q) => q[0].length);
      if (cut.endsWith("…")) segs.push(["…", segs.length ? segs[segs.length - 1][1] : o.fill, 400]);
      str = segs.map((q) => q[0]).join("");
    }
    const v = K().vmetrics("mono", size, 400), base = (o.y || 0) + (h - (v.ascent + v.descent)) / 2 + v.ascent;
    if (AK.monoProp(size)) {
      // a proportional face: the indentation as space widths, then the runs flow (spaces kept), measured as drawn
      const lead = str.match(/^\s*/)[0].length, sp = K().measure("a a", "mono", size, 400) - K().measure("aa", "mono", size, 400);
      const x0 = (o.x || 0) + lead * sp, body = str.slice(lead);
      const t = svg("text", { x: f1(x0), y: f1(base), "font-family": AK.monoFam(), "font-size": size, "font-weight": 400, style: "white-space:pre" }, g);
      const spans = []; let col = 0;
      for (const [s0, fill, wt] of segs) {
        const a = Math.max(0, lead - col), piece = s0.slice(a);
        if (piece) { const node = svg("tspan", { fill: fill || S().c("ink"), "font-weight": wt }, t); node.textContent = piece; spans.push({ node, col: col + a, s: piece, wt: wt || 400 }); }
        col += s0.length;
      }
      // each run measured at its own weight (a bold prompt is wider than the same letters at 400)
      const upTo = (k) => spans.reduce((a, sp1) => a + (k > sp1.col ? K().measure(sp1.s.slice(0, k - sp1.col), "mono", size, sp1.wt) : 0), 0);
      const w = lead * sp + upTo(col);
      if (str.trim()) Loom.report.texts.push({ beat: Loom.ctxBeat && Loom.ctxBeat.id, role: "mono", size, lines: 1, text: str.slice(0, 400), w, h, floor: size, box: { x: o.x || 0, y: o.y || 0, w: o.w || w, h } });
      const colX = (k) => x0 + upTo(k);
      return { t, spans, cols: col, w, base, cw, size, colX };
    }
    const t = svg("text", { x: f1(o.x || 0), y: f1(base), "font-family": AK.monoFam(), "font-size": size, "font-weight": 400 }, g);
    const spans = []; let col = 0;
    for (const [s0, fill, wt] of segs) {
      const re = /\S+/g; let m;
      while ((m = re.exec(s0))) {
        const node = svg("tspan", { x: f1((o.x || 0) + (col + m.index) * cw), fill: fill || S().c("ink"), "font-weight": wt }, t);
        node.textContent = m[0];
        spans.push({ node, col: col + m.index, s: m[0] });
      }
      col += s0.length;
    }
    if (str.trim()) Loom.report.texts.push({ beat: Loom.ctxBeat && Loom.ctxBeat.id, role: "mono", size, lines: 1, text: str.slice(0, 400), w: col * cw, h, floor: size, box: { x: o.x || 0, y: o.y || 0, w: o.w || col * cw, h } });
    return { t, spans, cols: col, w: col * cw, base, cw, size, colX: (k) => (o.x || 0) + k * cw };
  };
  AK.monoReveal = (spans, k) => { for (const sp of spans) sp.node.textContent = sp.s.slice(0, Math.max(0, k - sp.col)); };
  /** typing into a mono line made by AK.mono: empty until `at`, characters at cps, a block caret. Returns the end. */
  AK.typeMono = function (M, at, o) {
    o = o || {};
    const n = M.cols, cps = o.cps || 14, dur = Math.max(0.25, n / cps), x0 = M.colX(0);
    const caret = o.caret ? svg("rect", { x: f1(x0), y: f1(M.base - M.size * 0.82), width: f1(M.cw), height: f1(M.size * 1.02), fill: o.color || S().c("ink"), opacity: 0 }, o.caret) : null;
    Loom.drive((e, raw) => {
      const now = at + raw * (dur + 0.4), k = clamp(Math.floor(((now - at) / dur) * n + 1e-6), 0, n);
      AK.monoReveal(M.spans, k);
      if (caret) { caret.setAttribute("x", f1(M.colX(k))); caret.setAttribute("opacity", raw <= 0 || raw >= 1 ? 0 : now <= at + dur || Math.floor((now - at) / 0.5) % 2 === 0 ? 0.85 : 0); }
    }, at, dur + 0.4, "linear", { kind: "typewriter", content: true, beat: Loom.ctxBeat && Loom.ctxBeat.id });
    for (let i = 0; i < n; i += 3) Loom.sfx && Loom.sfx("key", at + (i / n) * dur, { i, g: 0.35 });
    return at + dur;
  };

  // ------------------------------------------------------------------ a chart (batch 02: the cloud console's metrics, analytics)
  /** a line or bar chart on a quiet grid of round steps, drawn from values (null: no point); the values can change on the
   *  timeline (update), a pure function of time. o: {type: "line"|"bar", labels, series: [{name, values, tone}], unit, min,
   *  max, decimals, T, Z, legend}. Returns {g, plot: {x, y, w, h}, col(i), update(si, values, t, dur), set(all, t, dur)} */
  AK.chart = function (g, x, y, w, h, o) {
    const T = o.T, Z = o.Z, tones = AK.tones(T), cg = svg("g", {}, g);
    const labels = o.labels || [], series = (o.series || []).map((q) => (Array.isArray(q) ? { values: q } : q));
    const n = Math.max(1, labels.length, ...series.map((q) => (q.values || []).length));
    const all = series.flatMap((q) => q.values || []).concat(...(o.alt || [])).filter((v) => v != null);
    const nice = (v) => { if (!(v > 0)) return 1; const p10 = Math.pow(10, Math.floor(Math.log10(v))); for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p10 >= v - 1e-9) return m * p10; return 10 * p10; };
    const min = o.min || 0, max = o.max != null ? o.max : nice(Math.max(0, ...all) * 1.12);
    const span = (max - min) || 1, p10 = Math.pow(10, Math.floor(Math.log10(span / 5)));
    const step = [1, 2, 2.5, 5, 10, 20, 25, 50].map((m) => m * p10).find((st) => span / st <= 5 + 1e-9) || span / 4;
    const ticks = []; for (let v = min; v <= max + step * 1e-6; v += step) ticks.push(+v.toFixed(10));
    const dec = o.decimals != null ? o.decimals : (String(+step.toFixed(10)).split(".")[1] || "").length;
    const fmt = (v) => `${(+v).toFixed(dec)}${o.unit || ""}`;
    const sz = Z.small, lh = Z.lhS;
    const ylw = Math.max(...ticks.map((v) => AK.measure(fmt(v), "caption", sz))) + 12;
    const legendH = series.length > 1 || o.legend ? lh + 8 : 0;
    const px = x + ylw + 8, py = y + legendH + lh / 2, pw = w - ylw - 16, ph = h - legendH - lh / 2 - lh - 8;
    const Y = (v) => py + ph - (clamp(v, min, max) - min) / ((max - min) || 1) * ph, X = (i) => px + (i + 0.5) * pw / n;
    ticks.forEach((v) => {
      svg("rect", { x: f1(px), y: f1(Y(v) - 0.5), width: f1(pw), height: 1, fill: v === min ? tones.hair2 : tones.hair }, cg);
      K().text(cg, fmt(v), { role: "caption", size: sz, x: x, y: Y(v) - lh / 2, w: ylw, h: lh, maxLines: 1, valign: "middle", align: "right", color: "muted", weight: 400 });
    });
    const lw = Math.max(1, ...labels.map((l) => AK.measure(String(l), "caption", sz))) + 14, every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(pw / lw))));
    labels.forEach((l, i) => { if (i % every === 0) K().text(cg, String(l), { role: "caption", size: sz, x: X(i) - Math.max(lw, pw / n) / 2, y: py + ph + 6, w: Math.max(lw, pw / n), h: lh, maxLines: 1, valign: "middle", align: "center", color: "muted", weight: 400 }); });
    const TN = [T.accent, "accent3", "pos", "accent4"];
    const S0 = series.map((q, si) => ({ tone: AK.c(q.tone || TN[si % TN.length]), name: q.name, cur: Array.from({ length: n }, (_, i) => ((q.values || [])[i] == null ? null : +(q.values || [])[i])) }));
    if (legendH) {
      let lx = x + w;
      S0.slice().reverse().forEach((q) => {
        if (!q.name) return;
        const tw = AK.measure(q.name, "caption", sz) + 6; lx -= tw;
        K().text(cg, q.name, { role: "caption", size: sz, x: lx, y, w: tw, h: lh, maxLines: 1, valign: "middle", color: "muted", weight: 400 });
        lx -= 24; svg("rect", { x: f1(lx), y: f1(y + lh / 2 - 7), width: 14, height: 14, rx: 3, fill: q.tone }, cg); lx -= 18;
      });
    }
    const type = o.type || "line", sg = svg("g", {}, cg), base = Y(min);
    S0.forEach((q, si) => {
      const g1 = svg("g", {}, sg);
      if (type === "bar") {
        const slot = pw / n, bw = (slot * 0.62) / S0.length;
        q.nodes = q.cur.map((_, i) => svg("rect", { x: f1(X(i) - slot * 0.31 + si * bw), y: f1(base), width: f1(Math.max(1, bw - 4)), height: 0.01, rx: Math.min(4, bw / 4), fill: q.tone }, g1));
      } else {
        q.area = S0.length === 1 ? svg("path", { d: "", fill: Loom.style.mix(q.tone, AK.c("surface"), 0.84) }, g1) : null;
        q.line = svg("path", { d: "", fill: "none", stroke: q.tone, "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" }, g1);
        q.dots = q.cur.map(() => svg("circle", { r: 5.5, fill: q.tone, stroke: AK.c("surface"), "stroke-width": 2, opacity: 0 }, g1));
      }
    });
    function draw(si, v) {
      const q = S0[si];
      if (type === "bar") { q.nodes.forEach((nd, i) => { const yy = v[i] == null ? base : Y(v[i]); nd.setAttribute("y", f1(yy)); nd.setAttribute("height", f1(Math.max(0.01, base - yy))); }); return; }
      let d = "", first = -1, last = -1;
      v.forEach((qv, i) => { if (qv == null) return; d += (d && last === i - 1 ? " L" : d ? " M" : "M") + `${f1(X(i))} ${f1(Y(qv))}`; if (first < 0) first = i; last = i; });
      q.line.setAttribute("d", d);
      if (q.area) q.area.setAttribute("d", first >= 0 && last > first ? `M${f1(X(first))} ${f1(base)} L` + d.replace(/^M/, "").replace(/ M/g, " L") + ` L${f1(X(last))} ${f1(base)} Z` : "");
      q.dots.forEach((nd, i) => { nd.setAttribute("opacity", v[i] == null ? 0 : 1); if (v[i] != null) { nd.setAttribute("cx", f1(X(i))); nd.setAttribute("cy", f1(Y(v[i]))); } });
    }
    S0.forEach((q, si) => draw(si, q.cur));
    const C = { g: cg, plot: { x: px, y: py, w: pw, h: ph }, n, X, Y, series: S0, type };
    C.col = (i) => ({ x: X(i) - pw / n / 2, y: py, w: pw / n, h: ph });
    C.bar = (si, i) => { const q = S0[si], v = q.cur[i] == null ? min : q.cur[i], slot = pw / n, bw = (slot * 0.62) / S0.length; return { x: X(i) - slot * 0.31 + si * bw, y: Y(v), w: bw - 4, h: Math.max(4, base - Y(v)) }; };
    /** series si moves to new values over dur (null stays null) */
    C.update = function (si, values, t, dur) {
      const q = S0[si]; if (!q) return t;
      const a = q.cur.slice(), b = Array.from({ length: n }, (_, i) => (values[i] == null ? null : +values[i]));
      Loom.drive((e) => draw(si, a.map((av, i) => (av == null || b[i] == null ? b[i] : av + (b[i] - av) * e))), t, dur == null ? 0.6 : dur, "move", meta("count", "app.chart"));
      q.cur = b;
      return t + (dur == null ? 0.6 : dur);
    };
    C.set = (list, t, dur) => { let e = t; (list || []).forEach((q, si) => { e = Math.max(e, C.update(si, Array.isArray(q) ? q : q.values || [], t, dur)); }); return e; };
    return C;
  };

  // ------------------------------------------------------------------ the shell's frame: reveal, steps, parts
  /** the shell appears at `at` (or is drawn complete and still at -1) */
  AK.reveal = function (g, at) { if (at != null && at >= 0) AK.show(g, at, 0.4); };
  /** run a list of scripted steps [{do, at, ...args}] against the shell's actions; returns the last end time */
  AK.runSteps = function (actions, steps, argsOf) {
    let end = 0;
    for (const s of steps || []) {
      const fn = actions[s.do];
      if (typeof fn !== "function") { Loom.error("component_params", `app step "${s.do}" is not an action (have: ${Object.keys(argsOf).join(", ")})`); continue; }
      const args = (argsOf[s.do] || []).map((k) => (k === "at" ? (s.at == null ? end + 0.4 : s.at) : s[k]));
      end = Math.max(end, fn.apply(null, args) || 0);
    }
    return end;
  };
})();
