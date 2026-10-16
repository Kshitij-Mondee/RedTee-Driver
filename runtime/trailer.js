/* Loom trailer (D-49): a 20-35 s course trailer cut from an approved lesson - BRAG's shape
 * (hook -> reveal -> highlights -> payoff -> outro) applied to a lesson, with the lesson's own scenes as
 * the footage ("show the thing") and the lesson's own narration as the voice.
 *
 * How: the lesson builds exactly as it always does (Loom.boot), then a second paused timeline plays an
 * EDIT DECISION LIST over it. At trailer time T the lesson timeline is seeked to the lesson time of the
 * segment playing, so every frame is still a pure function of time. Cards (title, end) and the dips that
 * hide each cut live on an overlay built with the same kit, springs and groups as any scene.
 */
// @capability trailer | tool | py -m loom trailer <id> | Look at the film | a 20 to 35 s course trailer cut from an approved lesson (a cut of the film, not a scene builder)
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const K = () => Loom.kit;
  const M = () => Loom.motion;

  function remapper(TM) {
    const segs = TM.segments;
    return function (t) {
      for (const s of segs) if (t >= s.t0 && t < s.t1) return s.a + (t - s.t0);
      // under a card: hold the lesson at the nearest segment edge (the card covers it)
      let best = segs[0], bt = 1e9;
      for (const s of segs) {
        const d0 = Math.abs(t - s.t0), d1 = Math.abs(t - s.t1);
        if (d0 < bt) { bt = d0; best = { a: s.a, t0: s.t0, edge: s.a }; }
        if (d1 < bt) { bt = d1; best = { a: s.b, t0: s.t1, edge: s.b }; }
      }
      return best.edge;
    };
  }

  function card(root, TM, c) {
    const W = Loom.W, H = Loom.H;
    const g = Loom.svg("g", { class: "lm-trailer-card", opacity: 0 }, root);
    Loom.svg("rect", { x: 0, y: 0, width: W, height: H, fill: S().c("field") }, g);
    // a quiet field of light behind the words: two token-coloured soft discs (no filters, no gradients files)
    Loom.svg("circle", { cx: W * 0.18, cy: H * 0.2, r: 420, fill: S().c("accent"), opacity: 0.06 }, g);
    Loom.svg("circle", { cx: W * 0.86, cy: H * 0.88, r: 520, fill: S().c("accent2"), opacity: 0.05 }, g);
    const t0 = c.t0, t1 = c.t1;
    Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: "none" }, t0, { kind: "card" });
    Loom.tween(g, { opacity: 1 }, { opacity: 0, duration: 0.01, ease: "none", immediateRender: false }, t1, { kind: "card" });
    const els = [];
    const el = (name, x, y, w, h) => { const E = K().element(g, name, { x, y, w, h, kind: "text" }); els.push(E); return E; };
    if (c.kind === "title") {
      const kick = el("kicker", 0, 330, W, 60);
      K().kicker(kick.inner, c.kicker, { x: 0, y: 0, w: W, h: 60, align: "center", valign: "middle", color: "accent" });
      const tt = el("title", 160, 400, W - 320, 280);
      K().text(tt.inner, c.title, { role: "display", x: 0, y: 0, w: W - 320, h: 280, align: "center", valign: "middle", maxLines: 2 });
      const bar = el("bar", W / 2 - 150, 712, 300, 12);
      K().rect(bar.inner, 0, 0, 300, 12, { fill: "accent", r: 6, crisp: true, shadow: false });
      M().reveal(kick, t0 + 0.12, { dy: 10 });
      M().spring(tt, t0 + 0.22, Object.assign({ preset: TM.tone.spring || "snappy", dy: 34, scale: 0.96 }));
      M().grow(bar, t0 + 0.55, { axis: "x", origin: "50% 50%" });
    } else {
      const line = el("line", 160, 300, W - 320, 300);
      K().text(line.inner, c.line, { role: "title", x: 0, y: 0, w: W - 320, h: 300, align: "center", valign: "middle", maxLines: 3 });
      const tt = el("title", 160, 640, W - 320, 70);
      K().text(tt.inner, c.title, { role: "lead", x: 0, y: 0, w: W - 320, h: 70, align: "center", valign: "middle", color: "muted", maxLines: 1 });
      const cw = Math.min(760, Math.ceil(K().measure(c.cta, "label", 34, 700) + 110));
      const cta = el("cta", (W - cw) / 2, 760, cw, 84);
      K().rect(cta.inner, 0, 0, cw, 84, { fill: "accent", r: 42, crisp: true });
      K().text(cta.inner, c.cta, { role: "label", x: 0, y: 0, w: cw, h: 84, align: "center", valign: "middle", weight: 700, color: S().pickTokenOn ? S().pickTokenOn("accent") : "field" });
      M().spring(line, t0 + 0.15, { preset: TM.tone.spring || "snappy", dy: 26 });
      M().reveal(tt, t0 + 0.6, { dy: 10 });
      M().pop(cta, t0 + 1.0);
      M().glow(cta, t0 + 1.35, { pad: 12, dur: 1.1 });
    }
    return g;
  }

  function dips(root, TM) {
    const W = Loom.W, H = Loom.H;
    const tone = TM.tone;
    const r = Loom.svg("rect", { x: 0, y: 0, width: W, height: H, fill: tone.flash ? "#ffffff" : S().c("field"), opacity: 0 }, root);
    const din = tone.dip * 0.45, dout = tone.dip * 0.55;
    TM.cuts.forEach((c, i) => {
      Loom.tween(r, { opacity: 0 }, { opacity: tone.flash ? 0.85 : 1, duration: din, ease: Loom.ease.exit, immediateRender: i === 0 }, Math.max(0, c - din), { kind: "dip" });
      Loom.tween(r, { opacity: tone.flash ? 0.85 : 1 }, { opacity: 0, duration: dout, ease: Loom.ease.enter, immediateRender: false }, c, { kind: "dip" });
    });
    // fade to the field at the very end
    Loom.tween(r, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: Loom.ease.exit, immediateRender: false }, TM.duration - 0.55, { kind: "dip" });
  }

  Loom.trailer = {
    install(TM) {
      const L = Loom.tl;
      const T = gsap.timeline({ paused: true, defaults: { lazy: false } });   // as the lesson's (boot.js, L-289)
      const remap = remapper(TM);
      const proxy = { t: 0 };
      T.fromTo(proxy, { t: 0 }, { t: TM.duration, duration: TM.duration, ease: "none", onUpdate: () => { L.seek(remap(proxy.t), false); } }, 0);
      const host = document.getElementById("lm-root");
      const ov = document.createElementNS(Loom.NS, "svg");
      ov.setAttribute("viewBox", `0 0 ${Loom.W} ${Loom.H}`);
      ov.setAttribute("width", Loom.W); ov.setAttribute("height", Loom.H);
      ov.setAttribute("style", "position:absolute;left:0;top:0;z-index:50;pointer-events:none");
      host.appendChild(ov);
      Loom.ctxScene = null; Loom.ctxBeat = null;
      Loom.tl = T;                       // the overlay's tweens go on the TRAILER timeline
      try {
        for (const c of TM.cards) card(ov, TM, c);
        dips(ov, TM);
      } finally {
        Loom.tl = L;                     // the lesson's clocks keep reading the lesson timeline
      }
      T.set({}, {}, TM.duration);
      Loom.settleOrigins(T);             // the cards' pops take their origins at their own starts (L-289)
      Loom.forwardOnly(T);               // and its seeks (and the lesson's, which boot wrapped) arrive moving forward (L-302)
      T.seek(0);
      window.__timelines = { main: T };
      Loom.report.trailer = { duration: TM.duration, segments: TM.segments.length, cards: TM.cards.length };
      window.__loom_trailer_ready = true;
      return T;
    },
  };
})();
