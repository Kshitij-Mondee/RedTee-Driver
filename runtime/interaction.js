/* Loom simulated interaction (D-46): show the thing IN USE.
 *
 * BRAG's strongest rule, "show the product doing its job, not a slide describing it", becomes a small
 * kit for software and process training: an app window, a field, a button, a toast, and a cursor that
 * moves, hovers, taps and types. Everything is deterministic (the caret blinks on the timeline clock),
 * every word on screen comes from the caller (no sample text), colours are style tokens, and each
 * action writes its own sound event (a tap clicks, typing ticks, a toast chimes in the music's key).
 */
// @capability product_in_use | ui | ui.window, field, button, toast, cursor; m.tap, m.typeInto | Expressive motion | show a product in use: a cursor moves on an arc, taps a button, types into a field
(function () {
  "use strict";
  const Loom = window.Loom;
  const M = Loom.motion;
  const K = () => Loom.kit;
  const S = () => Loom.style;
  const ui = (Loom.ui = {});
  const svg = (t, a, p, x) => Loom.svg(t, a, p, x);

  /** ui.window(ctx, {name, x, y, w, h, title}) -> {E, body: {x, y, w, h}}: an app frame with a title bar. */
  ui.window = function (ctx, o) {
    const E = ctx.el(o.name || "window", { x: o.x, y: o.y, w: o.w, h: o.h, kind: "card", exit: o.exit || "recede" });
    const bar = Math.round(Math.max(52, Math.min(64, o.h * 0.09)));
    K().rect(E.inner, 0, 0, o.w, o.h, { fill: o.fill || "surface", crisp: true });
    K().rect(E.inner, 0, 0, o.w, bar, { fill: "surface2", crisp: true, shadow: false });
    svg("rect", { x: 0, y: bar - 2, width: o.w, height: 2, fill: S().c("line"), opacity: 0.35 }, E.inner);
    ["neg", "accent4", "pos"].forEach((tok, i) => svg("circle", { cx: 26 + i * 24, cy: bar / 2, r: 7, fill: S().c(tok), opacity: 0.9 }, E.inner));
    if (o.title) K().text(E.inner, o.title, { role: "caption", x: 110, y: 0, w: o.w - 220, h: bar, align: "center", valign: "middle", color: "muted" });
    return { E, bar, body: { x: 0, y: bar, w: o.w, h: o.h - bar } };
  };

  /** ui.field(ctx, parent, {x, y, w, h, role, label}) -> a text field ready for m.typeInto. */
  ui.field = function (ctx, parent, o) {
    const g = svg("g", { class: "lm-field" }, (parent && parent.inner) || parent);
    const h = o.h || 64;
    K().rect(g, o.x, o.y, o.w, h, { fill: "field", stroke: "line", sw: 2, r: Math.min(12, h / 4), crisp: true, shadow: false });
    if (o.label) K().text(g, o.label, { role: "caption", x: o.x, y: o.y - 40, w: o.w, h: 36, color: "muted" });
    return { g, x: o.x, y: o.y, w: o.w, h, role: o.role || "body", pad: o.pad || 20 };
  };

  /** ui.button(ctx, parent, {x, y, label, h, fill}) -> {g, bg, w, h}: width measured from its label. */
  ui.button = function (ctx, parent, o) {
    const h = o.h || 64, role = "label";
    const size = Math.max(S().pack.type[role][0], Math.min(S().pack.type[role][1], Math.round(h * 0.42)));
    const w = o.w || Math.ceil(K().measure(o.label, role, size, 700) + h * 0.9);
    const g = svg("g", { class: "lm-button" }, (parent && parent.inner) || parent);
    const fill = o.fill || S().role("button", "accent");
    const bg = K().rect(g, o.x, o.y, w, h, { fill, r: Math.min(S().pack.shape.radius || 12, h / 2), crisp: true });
    K().text(g, o.label, { role, x: o.x, y: o.y, w, h, align: "center", valign: "middle", weight: 700, color: S().pickTokenOn ? S().pickTokenOn(fill) : "field" });
    return { g, bg, x: o.x, y: o.y, w, h, cx: o.x + w / 2, cy: o.y + h / 2 };
  };

  /** ui.toast(ctx, {name, x, y, w, text, icon}) -> element; bring it in with m.toastIn. */
  ui.toast = function (ctx, o) {
    const h = o.h || 84;
    // sized to its words (one line at the label size), so it never wraps or crowds its edge
    const lead = o.icon ? 80 : 32;
    const w = o.w || Math.min(900, Math.ceil(lead + K().measure(o.text, "label", S().pack.type.label[1]) + 48));
    const E = ctx.el(o.name || "toast", { x: o.x, y: o.y, w, h, kind: "card", exit: "sink" });
    K().rect(E.inner, 0, 0, w, h, { fill: o.fill || "surface", crisp: true });
    svg("rect", { x: 0, y: 0, width: 8, height: h, rx: 4, fill: S().c(o.tone || "pos") }, E.inner);
    if (o.icon) K().icon(E.inner, o.icon, { x: 46, y: h / 2, size: 36, color: o.tone || "pos" });   // kit.icon is centre-placed
    K().text(E.inner, o.text, { role: "label", x: o.icon ? 80 : 32, y: 0, w: w - (o.icon ? 104 : 56), h, valign: "middle" });
    return E;
  };

  /** ui.cursor(ctx, {x, y, name}) -> a pointer element in station coords (draw it LAST so it is on top). */
  ui.cursor = function (ctx, o) {
    o = o || {};
    // a pointer is transient: it leaves with its scene unless the next scene holds it (it stayed parked in the
    // corner for four beats of phishing-report with exit "none"; L-172)
    const E = ctx.el(o.name || "cursor", { x: 0, y: 0, w: 40, h: 52, kind: "instrument", exit: o.exit || "recede" });
    const s = o.size || 1;
    const p = "M0 0 L0 38 L10 29 L17 45 L24 42 L17 26 L30 26 Z";
    svg("path", { d: p, transform: `scale(${s})`, fill: S().c("ink"), stroke: S().c("field"), "stroke-width": 2.5, "stroke-linejoin": "round" }, E.inner);
    E.__pos = { x: o.x || 0, y: o.y || 0 };
    E.mover.setAttribute("transform", `translate(${E.__pos.x} ${E.__pos.y})`);
    Loom.set(E.inner, { opacity: 0 }, 0);
    return E;
  };

  /** m.cursorIn(cursor, t): the pointer appears where it is. */
  M.cursorIn = function (C, t) {
    if (C.revealT == null || t < C.revealT) C.revealT = t;
    Loom.tween(C.inner, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: Loom.ease.enter }, t, { kind: "cursor", beat: C.beat, name: C.name });
    return t + 0.18;
  };
  /** m.cursorTo(cursor, x, y, t, {dur, arc}) -> arrival time. Moves on a gentle arc with the move easing;
   *  the duration follows the distance (Fitts-like), so long moves take longer but never drag. */
  M.cursorTo = function (C, x, y, t, o) {
    o = o || {};
    const a = Object.assign({}, C.__pos), b = { x, y };
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const dur = o.dur || Math.min(0.95, 0.32 + dist / 2400);
    const arc = o.arc == null ? 0.12 : o.arc;
    const mx = (a.x + b.x) / 2 - (b.y - a.y) * arc, my = (a.y + b.y) / 2 + (b.x - a.x) * arc;
    Loom.drive((e) => {
      const u = 1 - e;
      const px = u * u * a.x + 2 * u * e * mx + e * e * b.x, py = u * u * a.y + 2 * u * e * my + e * e * b.y;
      C.mover.setAttribute("transform", `translate(${px.toFixed(2)} ${py.toFixed(2)})`);
    }, t, dur, "move", { kind: "cursor", beat: C.beat, name: C.name, content: true });
    C.__pos = b;
    return t + dur;
  };
  /** m.tap(cursor, target, t, {x, y}): the pointer presses, the target responds, a ripple marks the spot,
   *  and a click is heard. target: an element, or a ui.button result. Returns when the response settles. */
  M.tap = function (C, target, t, o) {
    o = o || {};
    const x = o.x != null ? o.x : C.__pos.x, y = o.y != null ? o.y : C.__pos.y;
    // the pointer dips
    Loom.tween(C.inner, { scale: 1, transformOrigin: "0% 0%" }, { scale: 0.86, duration: 0.08, ease: Loom.ease.enter, yoyo: true, repeat: 1 }, t, { kind: "cursor", beat: C.beat, name: C.name });
    // the target responds (a button group or an element)
    if (target) {
      if (target.life) M.press(target, t, o);
      else if (target.g) {
        const g = target.g;
        const ox = target.cx != null ? target.cx : x, oy = target.cy != null ? target.cy : y;
        Loom.drive((e, raw) => {
          const k = raw < 0.3 ? raw / 0.3 : 1 - (raw - 0.3) / 0.7;
          const s = 1 - 0.045 * Math.max(0, Math.min(1, k));
          g.setAttribute("transform", `translate(${ox} ${oy}) scale(${s.toFixed(4)}) translate(${-ox} ${-oy})`);
        }, t, 0.34, "linear", { kind: "gesture", beat: C.beat });
      }
    }
    // ripple at the tap point (in the cursor's parent coords)
    const host = C.outer.parentNode;
    const ring = svg("circle", { cx: x, cy: y, r: 6, fill: "none", stroke: S().c(o.ring || "accent"), "stroke-width": 4, opacity: 0 }, host);
    Loom.drive((e, raw) => {
      ring.setAttribute("r", (6 + 38 * e).toFixed(2));
      ring.setAttribute("opacity", (raw < 0.02 ? 0 : 0.7 * (1 - raw)).toFixed(3));
    }, t, 0.5, "enter", { kind: "gesture", beat: C.beat });
    Loom.sfx("click", t, { g: o.g });
    return t + 0.34;
  };
  /** m.typeInto(field, str, t, {cps, hold}) -> end time. Characters appear at a human pace, the caret
   *  follows the measured text and blinks on the clock when idle; key sounds are thinned (every ~3rd key). */
  M.typeInto = function (F, str, t, o) {
    o = o || {};
    const role = F.role || "body";
    const pad = F.pad || 20;
    const fitW = F.w - pad * 2;
    const tx = K().text(F.g, str, { role, x: F.x + pad, y: F.y, w: fitW, h: F.h, valign: "middle", maxLines: 1 });
    const f = tx.__fit || { size: 32 };
    const size = f.size;
    const spans = Array.from(tx.querySelectorAll("tspan"));
    const full = spans.length ? spans.map((s) => s.textContent) : [tx.textContent];
    const text = full.join(" ");
    const n = text.length;
    const cps = o.cps || 18;
    const dur = Math.max(0.3, n / cps);
    const caretH = size * 1.05;
    const caret = svg("rect", { x: F.x + pad, y: F.y + (F.h - caretH) / 2, width: Math.max(2, size * 0.07), height: caretH, fill: S().c("accent"), opacity: 0 }, F.g);
    const lead = o.lead == null ? 0.5 : o.lead, hold = o.hold == null ? 1.2 : o.hold;
    const t0 = t - lead, total = lead + dur + hold;
    const target = spans[0] || tx;
    Loom.drive((e, raw) => {
      const now = t0 + raw * total;
      const k = Math.max(0, Math.min(n, Math.floor(((now - t) / dur) * n + 1e-6)));
      target.textContent = text.slice(0, k);
      const w = K().measure(text.slice(0, k), role, size);
      caret.setAttribute("x", (F.x + pad + w + 2).toFixed(2));
      const typing = now >= t && now <= t + dur;
      const blinkOn = Math.floor((now - t0) / 0.53) % 2 === 0;
      caret.setAttribute("opacity", raw <= 0 || raw >= 1 ? 0 : typing || blinkOn ? 1 : 0);
    }, t0, total, "linear", { kind: "typewriter", content: true });
    for (let i = 0; i < n; i += 3) if (text[i] !== " ") Loom.sfx("key", t + (i / n) * dur, { i, g: o.g });
    return t + dur;
  };
  /** m.toastIn(toast, t): slides up from below with a spring and chimes (in the music's key). */
  M.toastIn = function (E, t, o) {
    o = o || {};
    const end = M.spring(E, t, { dy: 36, scale: 1, preset: o.preset || "snappy" });
    Loom.sfx("success", t + 0.05, { g: o.g });
    return end;
  };
})();
