// @design cause_convergence: several conditions land over their open slots and each draws an arrow into one failure
/* b20 - one cause becomes several. Continues b19's system station: the failed checkout (centre) and
 * the three probe marks are KEPT. Three conditions land over the probes, each grows an arrow into the
 * failure, and the single blame arrow that used to point at a person is now three arrows converging.
 *
 * Treatments considered:
 *  (A) a static list of three causes (rejected: a list has no "combining", and the viewer would not
 *      see the arrow that used to point at a person become several),
 *  (B) the three causes as a chain, one leading to the next (rejected: the sheet says they are
 *      independent conditions, a chain would invent a causal order that is not in the source),
 *  (C) CHOSEN: convergence. Each condition settles at its probe (the '?' shrinks away as the
 *      answer lands), then its arrow draws INTO the checkout. Motion is content: causes combining.
 *
 * Beat sheet (anchors are narration words; delays are offsets from the cue):
 *   "no automated test"                  node 1 settles (+0.00), probe 1 shrinks (+0.15), arrow 1 draws (+0.40)
 *   "lacked production's payment setting" same for node 2
 *   "failed-order alert"                same for node 3
 *   "Several conditions"                 label stamps after a short hold (+0.25)
 *   "Do not stop at the first"           all three arrows pulse once, together (the ONE emphasis)
 */
Loom.scene("b20", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // ---- geometry (station coords). The checkout is held from b19: node centred (960,520), ~300x260.
    const CK = { cx: 960, cy: 520, hw: 150, hh: 130 };
    const NW = 432, NH = 240;                       // condition node size (enlarged 20% for legibility; b23, b24, b28 should match)
    const GAP_NODE = 8, GAP_CK = 14;                // breathing room at each end of an arrow

    const conds = [
      { key: "test",    cx: 430,  cy: 250, icon: "flask-conical",      label: "no checkout test",        t: ctx.cue("no automated test") },
      { key: "staging", cx: 430,  cy: 770, icon: "sliders-horizontal", label: "staging setting differs", t: ctx.cue("lacked production's payment setting") },
      { key: "alert",   cx: 1540, cy: 520, icon: "bell-off",           label: "unwatched alert",         t: ctx.cue("failed-order alert") },
    ];

    // where the segment centre->centre leaves a rectangle (half sizes hw, hh), pushed out by pad
    const edge = (cx, cy, hw, hh, dx, dy, pad) => {
      const L = Math.hypot(dx, dy);
      const ux = dx / L, uy = dy / L;
      const tx = ux ? (hw + pad) / Math.abs(ux) : Infinity, ty = uy ? (hh + pad) / Math.abs(uy) : Infinity;
      const t = Math.min(tx, ty);
      return { x: cx + ux * t, y: cy + uy * t };
    };

    // ---- the probes (held from b19): find their three marks so each can shrink as its node lands
    const rec = Loom.ctxScene;
    const probes = ((rec && rec.claimedFrom) || []).find((e) => e.name === "probes") || null;
    let probeMarks = [];
    if (probes) {
      let kids = Array.from(probes.inner.children);
      while (kids.length === 1 && kids[0].children && kids[0].children.length > 1 && kids[0].tagName !== "text") kids = Array.from(kids[0].children);
      kids = kids.filter((k) => k.tagName !== "defs");
      if (kids.length === 3) {
        // assign each mark to the nearest condition centre (fall back to document order)
        const centres = kids.map((k) => {
          try {
            const bb = k.getBBox(), mtx = probes.inner.getCTM().inverse().multiply(k.getCTM());
            const pt = new DOMPoint(bb.x + bb.width / 2, bb.y + bb.height / 2).matrixTransform(mtx);
            return { x: pt.x + probes.x, y: pt.y + probes.y };
          } catch (e) { return null; }
        });
        const used = new Set();
        probeMarks = conds.map((c, i) => {
          let best = -1, bd = Infinity;
          centres.forEach((p, j) => { if (!p || used.has(j)) return; const d = Math.hypot(p.x - c.cx, p.y - c.cy); if (d < bd) { bd = d; best = j; } });
          if (best < 0 || bd > 160) best = kids.findIndex((_, j) => !used.has(j) && (!centres[j] || j === i));
          if (best < 0) best = i;
          used.add(best);
          return kids[best];
        });
      } else Loom.warn("b20_probe_marks", `probes has ${kids.length} marks, expected 3: the nodes cover them instead`);
    }

    // ---- arrows FIRST so they sit on a layer under the nodes (edge to edge, drawn into the checkout)
    const arrows = conds.map((c) => {
      const s = edge(c.cx, c.cy, NW / 2, NH / 2, CK.cx - c.cx, CK.cy - c.cy, GAP_NODE);
      const e = edge(CK.cx, CK.cy, CK.hw, CK.hh, c.cx - CK.cx, c.cy - CK.cy, GAP_CK);
      const bx = Math.min(s.x, e.x) - 30, by = Math.min(s.y, e.y) - 30;
      const bw = Math.abs(s.x - e.x) + 60, bh = Math.abs(s.y - e.y) + 60;
      // @form arrow_into_target: an arrow drawn from a source into a target, its head landing as the stroke arrives
      const A = ctx.el("arrow_" + c.key, { x: bx, y: by, w: bw, h: bh, kind: "connector", exit: "recede" });
      const ar = kit.arrow(A.inner, s.x - bx, s.y - by, e.x - bx, e.y - by, { stroke: "ink", sw: 6, head: 28 });
      return { A, ar, len: Math.hypot(s.x - e.x, s.y - e.y) };
    });

    // ---- the three conditions: settle over their probe, then the arrow draws INTO the checkout
    const SW = 6;
    conds.forEach((c, i) => {
      const t = c.t;                                   // literal cue resolved in the table above
      // @form icon_label_card: a rounded card pairing an icon with a short label naming one item
      const N = ctx.el("cond_" + c.key, { x: c.cx - NW / 2, y: c.cy - NH / 2, w: NW, h: NH, kind: "node", exit: "recede" });
      kit.rect(N.inner, 0, 0, NW, NH, { fill: "surface", r: 18, crisp: true });          // solid backing: the probe never shows through
      kit.rect(N.inner, 0, 0, NW, NH, { fill: "none", r: 18 });                           // sketched outline
      Loom.th.iconDisc(ctx, N.inner, NW / 2, 66, 46, c.icon, "accent2", "ink");
      kit.text(N.inner, c.label, { role: "lead", size: 30, x: 16, y: 124, w: NW - 32, h: 108, maxLines: 2, align: "center", valign: "middle", weight: 700 });
      m.settle(N, t + 0.2);                              // lands just after the "?" has started to fade: never both at full strength

      // the probe answers itself: its '?' shrinks away as the condition lands
      if (probeMarks[i]) {
        Loom.tween(probeMarks[i], { scale: 1, opacity: 1, transformOrigin: "50% 50%" },
          { scale: 0, opacity: 0, duration: S.dur("exit"), ease: Loom.ease.exit }, t, { kind: "probe_resolve", beat: ctx.beat.id, name: "probes", content: true });
      }

      // the arrow draws from the condition INTO the checkout; the head appears as the stroke arrives
      const a = arrows[i];
      const tDraw = t + 0.5, dDraw = S.dur("draw") * 0.8;
      a.A.revealT = tDraw; a.A.revealKind = "draw";
      m.draw(a.ar.path, tDraw, { dur: dDraw });
      Loom.tween(a.ar.head, { opacity: 0 }, { opacity: 1, duration: S.dur("exit") * 0.4, ease: Loom.ease.enter }, tDraw + dDraw - 0.08, { kind: "arrowhead", beat: ctx.beat.id, name: a.A.name, content: true });
    });

    // ---- "several conditions": stamped under the checkout after a short hold (the aggregate comes last)
    // @form summary_tag: a pill naming what a group of items adds up to
    const sev = ctx.el("several", { x: 960 - 220, y: 740, w: 440, h: 84, kind: "stamp", exit: "recede" });
    kit.pill(sev.inner, 0, 0, 440, 84, { fill: "accent" });
    kit.text(sev.inner, "several conditions", { role: "lead", x: 0, y: 0, w: 440, h: 84, maxLines: 1, align: "center", valign: "middle", weight: 800, color: S.pickTokenOn("accent") });
    m.stamp(sev, ctx.cue("Several conditions") + 0.25);

    // ---- the one emphasis: all three arrows pulse once, together (peers, simultaneous)
    const tPulse = ctx.cue("Do not stop at the first");
    arrows.forEach((a) => {
      Loom.tween(a.ar.path, { strokeWidth: SW }, { strokeWidth: SW * 1.9, duration: S.dur("enter") * 0.5, ease: Loom.ease.enter, yoyo: true, repeat: 1 }, tPulse, { kind: "emphasis", beat: ctx.beat.id, name: a.A.name });
      Loom.tween(a.ar.head, { scale: 1, transformOrigin: "50% 50%" }, { scale: 1.35, duration: S.dur("enter") * 0.5, ease: Loom.ease.enter, yoyo: true, repeat: 1 }, tPulse, { kind: "emphasis", beat: ctx.beat.id, name: a.A.name });
    });
  },
});
