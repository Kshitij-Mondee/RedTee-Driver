// T-010 dev_http_exchange: an HTTP request and its response (hand-off sheet, Family A). Built on _app_kit.js and
// _dev_kit.js. Two cards joined by an arrow: the request (method badge, URL, headers, body) and the response (status
// badge in its meaning's tone, headers, body). Secret header values are shown as dots until a reveal, for the "do not
// do this" moment. The status meaning is carried by its words and badge shape too, never by hue alone.
Loom.component("dev_http_exchange", {
  version: 1,
  idea: "An HTTP exchange: a request card with its method, URL, headers and body, and a response card with its status code and reason, headers and body, joined by an arrow with an optional latency; secret header values are masked until revealed, and on cue the request travels and the response arrives.",
  outline: ["request card: method badge and URL, header rows, body", "arrow from request to response, latency on it", "response card: status badge with its reason, header rows, body", "masked secret values"],
  family: "dev",
  kind: "screen",
  tags: ["http", "api", "rest", "request", "response", "status code", "headers", "authorization", "rate limit", "cors"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-010)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint"],
  params: {
    request: { type: "obj", content: true },       // {method, url, headers: [[k, v]], body?} (body: text; JSON text is laid out by level)
    response: { type: "obj", content: true },      // {status, reason, headers: [[k, v]], body?}
    latency: { type: "str" },                      // the figure on the arrow, as the lesson words it ("182 ms")
    layout: { type: "enum", choices: ["side", "stack"], default: "side" },
    w: { type: "number", default: 1500 },
    at: { type: "number", default: -1 },           // when the request is sent (the response follows); -1: drawn complete and still
    maskSecrets: { type: "bool", default: true },  // Authorization, Cookie and key or token headers shown as dots
    size: { type: "number", default: 22 },
    steps: { type: "list", default: [] },          // [{do: "send", at} | {do: "mark", key, tone, at} | {do: "reveal", key, at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["req", "res", "arrow", "status", "headers[] ({g, key, side, band, value, mask})", "send(t)", "mark(headerKey, tone, t)", "reveal(headerKey, t)"],
  example: 'ctx.use("dev_http_exchange", { request: { method: "DELETE", url: "/v2/files/8812", headers: [["Authorization", "Bearer 7f3a91c0"]] }, response: { status: 204, reason: "No Content", headers: [["Date", "Tue, 03 Jun"]] }, latency: "64 ms", at: ctx.cue("delete the file") }, { x: 210, y: 260, name: "http" })',
  size: (p) => Loom.devKit.httpLayout(p).size,
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const L = DK.httpLayout(p), Z = L.Z, CS = L.CS, LH = L.LH;
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p), pen = DK.pen(ctx, eng);
    const outlined = S.outlined();
    const SC = DK.scheme("light");
    const keyC = DK.legible("accent", SC.bg, SC.text), valC = SC.text, mutedC = SC.muted;
    const parts = { headers: [], arrow: null, status: null };
    const statusTok = (n) => (n >= 500 ? "neg" : n >= 400 ? DK.warnTok() : n >= 300 ? "accent" : "pos");
    const methodTok = (m) => ({ GET: "accent", POST: "pos", PUT: DK.warnTok(), PATCH: DK.warnTok(), DELETE: "neg" }[String(m).toUpperCase()] || "accent3");

    function card(side, B) {
      const cg = svg("g", {}, g), C = L.cards[side];
      const fr = pen && animated ? DK.penDraw(pen, eng, (W) => W.roundRect(C.x, C.y, C.w, C.h, 14), { at: side === "req" ? p.at : p.at + 0.2, dur: 0.6 }) : null;
      if (fr == null) K.rect(cg, C.x, C.y, C.w, C.h, { fill: "surface", r: 14, stroke: "line", sw: 1.5, shadow: true });
      else svg("rect", { x: C.x, y: C.y, width: C.w, height: C.h, rx: 14, fill: S.c("surface") }, cg);
      // the badge: method, or status and reason
      const isReq = side === "req", tok = isReq ? methodTok(B.method) : statusTok(+B.status);
      const SD = AK.solid(tok);
      const badge = AK.pill(cg, C.x + 20, C.y + 18, isReq ? String(B.method).toUpperCase() : String(B.status), { size: Z.fs, weight: 700, fill: S.c(SD.fill), stroke: SD.stroke ? S.c(SD.stroke) : null, sw: SD.sw, color: SD.fg, r: 8 });
      const tx = C.x + 20 + badge.w + 14, tw = C.x + C.w - tx - 20;
      let headT;
      if (isReq) headT = AK.mono(cg, [[String(B.url), valC, 700]], { x: tx, y: C.y + 18, h: badge.h, size: CS, w: tw });
      else headT = AK.T(cg, String(B.reason || ""), { x: tx, y: C.y + 18, w: tw, h: badge.h, size: Z.fs, weight: 700, color: tok === "pos" ? "ink" : "ink" });
      let y = C.y + 18 + badge.h + 14;
      svg("rect", { x: C.x + 20, y: f1(y - 7), width: C.w - 40, height: 1.5, fill: SC.rule }, cg);
      // headers: key in the accent, value plain (masked when it is a secret)
      const keyW = Math.min(C.w * 0.42, Math.max(...(B.headers || [["", ""]]).map(([k]) => String(k).length + 2)) * AK.monoW(CS));
      (B.headers || []).forEach(([k, v]) => {
        const hg = svg("g", {}, cg);
        const band = svg("rect", { x: C.x + 10, y: f1(y), width: C.w - 20, height: LH, rx: 6, fill: SC.band("accent", 0.18), opacity: 0 }, hg);
        AK.mono(hg, [[String(k) + ":", keyC, 700]], { x: C.x + 22, y, h: LH, size: CS, w: keyW });
        const vx = C.x + 22 + keyW + 10, vw = C.x + C.w - vx - 20;
        const secret = p.maskSecrets && L.isSecret(k);
        const vg = svg("g", { opacity: secret ? 0 : 1 }, hg), mg = svg("g", {}, hg);
        AK.mono(vg, [[String(v), valC]], { x: vx, y, h: LH, size: CS, w: vw });
        if (secret) {
          // a scheme word ("Bearer", "Basic") stays readable; the secret itself is dots
          const m = String(v).match(/^(Bearer|Basic|Token|Digest)\s+/i), lead = m ? m[0] : "";
          const M = lead ? AK.mono(mg, [[lead, valC]], { x: vx, y, h: LH, size: CS }) : null;
          const dx = M ? M.colX(M.cols) : vx, n = 10, cw = AK.monoW(CS);
          for (let i = 0; i < n; i++) svg("circle", { cx: f1(dx + cw * (i + 0.5)), cy: f1(y + LH / 2), r: f1(CS * 0.17), fill: mutedC }, mg);
        }
        parts.headers.push({ g: hg, key: String(k), side, band, value: vg, mask: secret ? mg : null });
        y += LH;
      });
      if (B.body != null && L.bodyLines[side].length) {
        y += 6;
        svg("rect", { x: C.x + 20, y: f1(y), width: C.w - 40, height: f1(L.bodyLines[side].length * LH + 16), rx: 8, fill: SC.band("line", 0.07) }, cg);
        y += 8;
        const SYN = DK.syntax({}, S.c("surface"), SC.text), B0 = L.body[side];
        B0.src.forEach((ln) => DK.wrapRuns(ln, L.bodyLang[side], SYN, B0.cols).forEach((segs) => { if (segs.some((q) => q[0].trim())) AK.mono(cg, segs, { x: C.x + 32, y, h: LH, size: CS }); y += LH; }));
      }
      return { g: cg, badge, head: headT, rect: C };
    }
    const req = card("req", p.request), res = card("res", p.response);
    parts.req = req.g; parts.res = res.g; parts.status = res.badge;

    // the arrow, with the latency figure on its own line above it
    const A = L.arrow, ag = svg("g", {}, g);
    const arrowEnd = pen && animated ? DK.penDraw(pen, eng, (W) => W.arrow(A.x1, A.y1, A.x2, A.y2), { at: p.at + 0.5, dur: 0.4 }) : null;
    const arrow = arrowEnd == null ? K.arrow(ag, A.x1, A.y1, A.x2, A.y2, { stroke: "line" }) : null;
    let lat = null;
    if (p.latency) lat = DK.word(ctx, ag, p.latency, { x: A.lx, y: A.ly, w: A.lw, h: L.lhS, size: Z.small, weight: 600, color: "muted", align: "center", at: -1, pen: null });
    parts.arrow = arrow || ag;
    const tok = svg("circle", { r: 9, cx: f1(A.x1), cy: f1(A.y1), fill: S.c("accent"), opacity: 0 }, ag);

    // ---- state functions
    parts.send = function (t) {
      AK.show(req.g, t, 0.3);
      if (arrow) AK.show(arrow.g, t + 0.3, 0.2);
      Loom.drive((e, raw) => { tok.setAttribute("cx", f1(A.x1 + (A.x2 - A.x1) * e)); tok.setAttribute("cy", f1(A.y1 + (A.y2 - A.y1) * e)); tok.setAttribute("opacity", raw > 0 && raw < 1 ? 1 : 0); }, t + 0.45, 0.6, "move", DK.meta("travel", "http.request"));
      if (lat) AK.show(lat, t + 1.0, 0.25);
      AK.show(res.g, t + 1.1, 0.3);
      Loom.drive((e) => res.badge.g.setAttribute("transform", `translate(${f1((res.badge.x + res.badge.w / 2) * (1 - e))} ${f1((res.badge.y + res.badge.h / 2) * (1 - e))}) scale(${f1(Math.max(0.001, e))})`), t + 1.25, 0.3, "overshoot", DK.meta("reveal", "http.status"));
      return t + 1.6;
    };
    const find = (k) => parts.headers.filter((h) => h.key.toLowerCase() === String(k).toLowerCase());
    parts.mark = function (k, tone, t) {
      for (const h of find(k)) {
        if (tone && tone in S.pack.palette) h.band.setAttribute("fill", SC.band(tone, 0.2));
        if (t == null || t < 0) h.band.setAttribute("opacity", 1); else DK.flash(h.band, t, { name: "http.mark" });
      }
      return t == null || t < 0 ? t : t + 0.25;
    };
    parts.reveal = function (k, t) {
      for (const h of find(k)) if (h.mask) DK.cross(h.mask, h.value, t, 0.25);
      return t + 0.3;
    };
    if (animated) parts.send(p.at);
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "send") parts.send(st.at);
      else if (st.do === "mark") parts.mark(st.key, st.tone, st.at);
      else if (st.do === "reveal") parts.reveal(st.key, st.at);
      else Loom.error("component_params", `dev_http_exchange: step "${st.do}" is not send, mark or reveal`);
    }
    void outlined;
    return parts;
  },
});

// the exchange's geometry, shared by size() and build()
Loom.devKit.httpLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, Z = DK.ui().Z;
  const CS = DK.codeSize(p.size), LH = DK.codeLH(CS), lhS = AK.lineH(Z.small, "caption", 600);
  const side = p.layout !== "stack", gap = side ? 150 : 96;
  const cw = side ? (p.w - gap) / 2 : p.w;
  const badgeH = Math.max(Math.ceil(Loom.kit.vmetrics("caption", Z.fs, 700).ascent + Loom.kit.vmetrics("caption", Z.fs, 700).descent) + 16, AK.lineH(CS, "mono"));
  const bodyOf = (B) => {
    if (!B || B.body == null) return { lines: [], lang: "text" };
    // the body is text as the lesson gives it (an object's keys would be words no param string supplies: the text audit
    // reads values); JSON text is laid out two spaces a level, which adds no words
    let txt = typeof B.body === "object" ? JSON.stringify(B.body) : String(B.body), isObj = false;
    try { const o = JSON.parse(txt); if (o && typeof o === "object") { txt = JSON.stringify(o, null, 2); isObj = true; } } catch (e) { /* plain text */ }
    const cols = DK.cols(cw - 64, CS);
    const src = txt.replace(/\t/g, "  ").split("\n");
    const lines = [].concat(...src.map((ln) => DK.wrapCols(ln, cols)));
    return { lines, src, cols, lang: isObj || /^\s*[[{]/.test(txt) ? "json" : "text" };
  };
  const bq = bodyOf(p.request), bs = bodyOf(p.response);
  const hOf = (B, b) => 18 + badgeH + 14 + ((B && B.headers) || []).length * LH + (b.lines.length ? 6 + 8 + b.lines.length * LH + 8 : 0) + 22;
  const hq = hOf(p.request, bq), hs = hOf(p.response, bs);
  // side by side, each card hugs its own content (top aligned, the arrow at the header's level)
  const cards = side ? { req: { x: 0, y: 0, w: cw, h: hq }, res: { x: cw + gap, y: 0, w: cw, h: hs } }
    : { req: { x: 0, y: 0, w: cw, h: hq }, res: { x: 0, y: hq + gap, w: cw, h: hs } };
  const ay = 18 + badgeH / 2;
  const arrow = side ? { x1: cw + 14, y1: ay, x2: cw + gap - 14, y2: ay, lx: cw + 6, ly: ay - lhS - 10, lw: gap - 12 }
    : { x1: 80, y1: hq + 12, x2: 80, y2: hq + gap - 12, lx: 100, ly: hq + gap / 2 - lhS / 2, lw: 260 };
  const SECRET = /^(authorization|proxy-authorization|cookie|set-cookie)$|(api[-_]?key|token|secret|password)/i;
  const h = side ? Math.max(hq, hs) : hq + gap + hs;
  return { Z, CS, LH, lhS, cards, arrow, bodyLines: { req: bq.lines, res: bs.lines }, body: { req: bq, res: bs }, bodyLang: { req: bq.lang, res: bs.lang },
    isSecret: (k) => SECRET.test(String(k)), size: { w: p.w, h } };
};
