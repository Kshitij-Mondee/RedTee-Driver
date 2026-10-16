// T-024 ops_alert_card: an alert or page notification (hand-off sheet, Family B). Built on _app_kit.js and _dev_kit.js.
// A severity badge in its tone (SEV1 to SEV4, P1 to P4: the number picks the tone, the badge's words are the lesson's),
// the title, the service and the time it fired, and its state (firing, acknowledged, resolved) shown by icon and edge
// bar, with the product's own word for it when the lesson gives one. It can sit on a pile of earlier alerts.
Loom.component("ops_alert_card", {
  version: 1,
  idea: "An alert or page notification card: a severity badge, the alert's title, the service and the time it fired, and its state (firing, acknowledged, resolved) by icon and edge bar; it can sit on a pile of earlier alerts, be acknowledged, resolved, or escalated with a second card sliding in under it.",
  outline: ["card on an optional pile of cards", "severity badge at the top left", "state icon (and the state's word) at the top right", "the alert's title", "service and time fired", "edge bar in the state's tone"],
  family: "ops",
  kind: "screen",
  tags: ["alert", "page", "on-call", "incident", "severity", "notification", "pager", "alert fatigue", "sev1", "monitoring"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-024)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint"],
  params: {
    severity: { type: "str", content: true },      // "SEV1", "P2" ... (its first digit picks the tone: 1 neg, 2 warning, 3 accent, 4 muted)
    title: { type: "str", content: true },
    service: { type: "str", content: true },
    time: { type: "str", content: true },
    state: { type: "enum", choices: ["firing", "acked", "resolved"], default: "firing" },
    stateLabels: { type: "obj" },                  // the product's words for the states: {firing, acked, resolved}
    escalation: { type: "obj" },                   // the card escalate() slides in: {severity, title, service, time}
    pile: { type: "int", default: 0 },             // earlier alerts stacked behind it (0 to 4)
    w: { type: "number", default: 700 },
    at: { type: "number", default: -1 },
    steps: { type: "list", default: [] },          // [{do: "ack" | "resolve" | "escalate", at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["card", "badge", "title", "meta", "state", "pileG", "second", "ack(t)", "resolve(t)", "escalate(t)"],
  example: 'ctx.use("ops_alert_card", { severity: "SEV2", title: "Payment webhooks failing for 12 minutes", service: "payments-api", time: "03:14", pile: 2, at: ctx.cue("the page goes out") }, { x: 610, y: 300, name: "page" })',
  size: (p) => { const L = Loom.devKit.alertLayout(p); return { w: p.w + L.pileX, h: L.h + L.pileY + (p.escalation ? L.h2 + 18 : 0) }; },
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const L = DK.alertLayout(p), Z = L.Z;
    const animated = p.at != null && p.at >= 0;
    const surface = S.c("surface"), ink = S.c("ink");
    const sevTok = (sev) => { const m = String(sev).match(/\d/); const n = m ? +m[0] : 3; return n <= 1 ? "neg" : n === 2 ? DK.warnTok() : n === 3 ? "accent" : "muted"; };
    const STATE = { firing: { icon: "bell-ring", tok: null }, acked: { icon: "user-check", tok: "accent" }, resolved: { icon: "circle-check", tok: "pos" } };
    const parts = { second: null };
    const root = svg("g", {}, g);
    // the pile: earlier alerts behind, offset down and right, quieter each step
    const pileG = svg("g", {}, root);
    for (let k = L.pile; k >= 1; k--) K.rect(pileG, k * 10, k * 10, p.w, L.h, { fill: "surface2", r: 14, stroke: "line", sw: 1.2, shadow: false, opacity: 1 - k * 0.12 });
    parts.pileG = pileG;

    function card(gg, A, h, firstState) {
      const tn = sevTok(A.severity), cg = svg("g", {}, gg);
      // an opaque backing: in the sketch and line styles a card's fill is hatched or empty, and the pile would show through
      svg("rect", { x: 0, y: 0, width: p.w, height: h, rx: 14, fill: surface }, cg);
      K.rect(cg, 0, 0, p.w, h, { fill: "surface", r: 14, stroke: "line", sw: 1.5, shadow: true });
      const bar = {};
      for (const s of Object.keys(STATE)) bar[s] = svg("rect", { x: 1.5, y: 14, width: 7, height: h - 28, rx: 3.5, fill: DK.legible(STATE[s].tok || tn, surface, ink, 3), opacity: s === firstState ? 1 : 0 }, cg);
      const SD = AK.solid(tn);
      const badge = AK.pill(cg, 24, 20, String(A.severity), { size: Z.fs, weight: 700, fill: S.c(SD.fill), stroke: SD.stroke ? S.c(SD.stroke) : null, sw: SD.sw, color: SD.fg, r: 8 });
      // the state: an icon, and the word when the lesson gives it
      const stG = {};
      const SL = p.stateLabels || {};
      for (const s of Object.keys(STATE)) {
        const sg = svg("g", { opacity: s === firstState ? 1 : 0 }, cg), tok = STATE[s].tok || tn;
        AK.icon(sg, STATE[s].icon, p.w - 36, 20 + badge.h / 2, 28, tok);
        if (SL[s]) AK.T(sg, SL[s], { x: p.w - 60 - L.slW, y: 20, w: L.slW, h: badge.h, size: Z.small, weight: 600, align: "right", fill: DK.legible(tok, surface, ink) });
        stG[s] = sg;
      }
      const tt = DK.para(cg, String(A.title), { x: 24, y: 20 + badge.h + 12, w: p.w - 48, size: L.tSize, weight: 700, maxLines: L.titleLines, role: "caption" });
      const my = 20 + badge.h + 12 + L.titleH(A.title) + 8, M = L.metaOf(A);
      AK.icon(cg, "server", 36, my + L.lhS / 2, 22, "muted");
      const svc = AK.T(cg, String(A.service), { x: 54, y: my, w: M.svcW, h: L.lhS, size: Z.small, weight: 600, color: "muted" });
      // the time follows the service on its line, or takes the next line when the two do not fit side by side
      const tx = M.wrap ? 54 : 54 + M.svcW + 44, ty = M.wrap ? my + L.lhS + 6 : my;
      AK.icon(cg, "clock", tx - 18, ty + L.lhS / 2, 22, "muted");
      const tm = AK.T(cg, String(A.time), { x: tx, y: ty, w: p.w - tx - 24, h: L.lhS, size: Z.small, color: "muted" });
      return { g: cg, bar, badge, stG, title: tt, meta: { service: svc, time: tm }, state: firstState };
    }
    const C = card(root, p, L.h, p.state);
    Object.assign(parts, { card: C.g, badge: C.badge, title: C.title, meta: C.meta, state: C.stG });
    if (animated) {
      AK.show(root, p.at, 0.25);
      Loom.drive((e) => C.g.setAttribute("transform", `translate(${f1(40 * (1 - e))} 0)`), p.at, 0.35, "enter", DK.meta("reveal", "alert.in"));
      if (p.state === "firing") Loom.drive((e, raw) => { const k = Math.sin(raw * Math.PI * 3); C.badge.g.setAttribute("transform", `translate(${f1(C.badge.x + C.badge.w / 2)} ${f1(C.badge.y + C.badge.h / 2)}) scale(${f1(1 + 0.08 * Math.max(0, k))}) translate(${f1(-C.badge.x - C.badge.w / 2)} ${f1(-C.badge.y - C.badge.h / 2)})`); }, p.at + 0.35, 0.6, "linear", DK.meta("gesture", "alert.pulse"));
    }
    const to = (Cd, s, t) => {
      if (Cd.state === s) return t;
      DK.cross(Cd.bar[Cd.state], Cd.bar[s], t); DK.cross(Cd.stG[Cd.state], Cd.stG[s], t);
      if (s === "resolved") Loom.tween(Cd.title, { opacity: 1 }, { opacity: 0.6, duration: 0.3 }, t, DK.meta("state", "alert.resolved"));
      Cd.state = s;
      return t + 0.3;
    };
    parts.ack = (t) => to(C, "acked", t);
    parts.resolve = (t) => to(C, "resolved", t);
    parts.escalate = function (t) {
      // the badge pulses once and the next card slides in under it
      Loom.drive((e, raw) => { const k = Math.sin(raw * Math.PI); C.badge.g.setAttribute("transform", `translate(${f1(C.badge.x + C.badge.w / 2)} ${f1(C.badge.y + C.badge.h / 2)}) scale(${f1(1 + 0.12 * k)}) translate(${f1(-C.badge.x - C.badge.w / 2)} ${f1(-C.badge.y - C.badge.h / 2)})`); }, t, 0.4, "linear", DK.meta("gesture", "alert.escalate"));
      if (!p.escalation) { Loom.warn("dev_alert_escalation", "ops_alert_card: escalate() has no escalation card to show (give `escalation`)"); return t + 0.4; }
      const y2 = L.h + L.pileY + 18;
      const sg = svg("g", { transform: `translate(0 ${f1(y2)})` }, g);
      const C2 = card(sg, p.escalation, L.h2, "firing");
      parts.second = C2.g;
      AK.show(sg, t + 0.3, 0.25);
      Loom.drive((e) => sg.setAttribute("transform", `translate(0 ${f1(y2 - 40 * (1 - e))})`), t + 0.3, 0.4, "enter", DK.meta("reveal", "alert.second"));
      return t + 0.8;
    };
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "ack") parts.ack(st.at);
      else if (st.do === "resolve") parts.resolve(st.at);
      else if (st.do === "escalate") parts.escalate(st.at);
      else Loom.error("component_params", `ops_alert_card: step "${st.do}" is not ack, resolve or escalate`);
    }
    return parts;
  },
});

// the card's geometry, shared by size() and build()
Loom.devKit.alertLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, Z = DK.ui().Z;
  const badgeH = Math.ceil(Loom.kit.vmetrics("caption", Z.fs, 700).ascent + Loom.kit.vmetrics("caption", Z.fs, 700).descent) + 16;
  const lhS = AK.lineH(Z.small, "caption", 600), tSize = Math.max(Z.fs, Math.min(Z.head, 26));
  // the title wraps to three lines before it is cut (two had cut the alert's consequence off a long title)
  const titleLines = 3;
  const titleH = (s) => AK.clampText(String(s), { role: "caption", size: tSize, w: p.w - 48, maxLines: titleLines, weight: 700 }).h;
  const metaOf = (A) => {
    const svcW = Math.min(p.w - 54 - 24, AK.measure(String(A.service), "caption", Z.small, 600) + 8);
    const tW = AK.measure(String(A.time), "caption", Z.small, 400) + 8;
    return { svcW, wrap: 54 + svcW + 44 + tW > p.w - 24 };
  };
  const hOf = (A) => 20 + badgeH + 12 + titleH(A.title) + 8 + lhS + (metaOf(A).wrap ? lhS + 6 : 0) + 20;
  const SL = p.stateLabels || {};
  const slW = Math.max(0, ...Object.values(SL).map((s) => AK.measure(String(s), "caption", Z.small, 600) + 8));
  const pile = Math.max(0, Math.min(4, p.pile | 0));
  return { Z, badgeH, lhS, tSize, titleH, titleLines, metaOf, h: hOf(p), h2: p.escalation ? hOf(p.escalation) : 0, slW, pile, pileX: pile * 10, pileY: pile * 10 };
};
