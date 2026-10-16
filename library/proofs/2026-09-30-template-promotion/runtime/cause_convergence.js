/* Promoted from the beat design `cause_convergence` (bespoke scene b20 of blameless-postmortem).
 * Several separate conditions each arrive and draw an arrow into ONE outcome, so the outcome reads as their
 * joint result. All words come in through props: the template owns no sample text.
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const H = Loom.th;

  /* ======================= cause.converge ======================= */
  Loom.template("cause.converge", {
    doc: "Several separate conditions that TOGETHER produce one outcome (2-5 causes, one effect): a fall from a wet floor, no sign and poor light; a lost account from slow support, a price rise and a missing feature; a late launch from unclear scope and a single reviewer. Use it to show that no single cause is to blame, or to replace a lone culprit with the full set. The outcome card sits at the centre; each condition lands on its spoken words and draws an arrow INTO the outcome; an optional summary pill names that they combined, and an optional final pulse fires all arrows once. Not for a chain where one cause leads to the next (use process.flow) and not for one centre radiating outward (use hero.hub).",
    job: ["relate", "refute"], register: "productive", motion_is: "content",
    promoted_from_design: "cause_convergence",
    props: {
      outcome: { type: "str", required: true, max_words: 6 }, say_outcome: { type: "anchor", required: true },
      conditions: { type: "list", min: 2, max: 5, required: true, of: {
        label: { type: "str", required: true, max_words: 6 }, say: { type: "anchor", required: true }, icon: { type: "icon" } } },
      summary: { type: "str", max_words: 6 }, say_summary: { type: "anchor", requires: "summary" },
      say_emphasis: { type: "anchor" },
      accent: { type: "token", default: "accent" },
    },
    example: {
      outcome: "The slip and fall", say_outcome: "The fall",
      conditions: [
        { label: "Wet floor", say: "floor was wet", icon: "droplets" },
        { label: "No warning sign", say: "no warning sign", icon: "triangle-alert" },
        { label: "Failed corridor light", say: "light had failed", icon: "lightbulb-off" },
      ],
      summary: "Together, not alone", say_summary: "Together",
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box; const S = Loom.style;
      const n = p.conditions.length;
      const cx = B.x + B.w / 2, cy = B.y + B.h / 2;          // the block is centred in the safe box
      const OW = 520, OH = 230;                                // outcome card (3 lines of lead type hold a 6-word outcome)
      const NW = 510, NH = 200;                                // condition card (3 lines of lead type in a 370px column hold a 6-word label)
      const dx = 600;                                          // horizontal reach of the side/corner slots
      const top = cy - 285, bot = cy + 285;
      // slots in reading order (clockwise from the top left), so screen order follows narration order
      const SLOTS = {
        2: [[cx - dx, cy], [cx + dx, cy]],
        3: [[cx - dx, cy - 280], [cx + dx, cy], [cx - dx, cy + 280]],
        4: [[cx - dx, top], [cx + dx, top], [cx + dx, bot], [cx - dx, bot]],
        5: [[cx - dx, top], [cx, cy - 320], [cx + dx, top], [cx + dx, bot], [cx - dx, bot]],
      };
      const slots = SLOTS[n];

      // ---- times first: the outcome exists before any arrow draws into it (narration order)
      const tOut = H.when(ctx, p.say_outcome, 0.02, "outcome");
      const times = p.conditions.map((c, i) => H.when(ctx, c.say, 0.15 + (0.6 * i) / n, "condition " + (i + 1)));
      H.ordered(ctx, [tOut].concat(times), "convergence");
      const tSum = p.summary ? H.when(ctx, p.say_summary, 0.85, "summary") : 0;
      const tEmph = p.say_emphasis ? ctx.cue(p.say_emphasis) : 0;

      // where the segment between two centres leaves a rectangle (half sizes hw, hh), pushed out by pad
      const edge = (x, y, hw, hh, ex, ey, pad) => {
        const L = Math.hypot(ex, ey), ux = ex / L, uy = ey / L;
        const tx = ux ? (hw + pad) / Math.abs(ux) : Infinity, ty = uy ? (hh + pad) / Math.abs(uy) : Infinity;
        const t = Math.min(tx, ty);
        return { x: x + ux * t, y: y + uy * t };
      };

      // ---- arrows first, so they sit on a layer UNDER the cards (edge to edge, drawn into the outcome)
      const arrows = p.conditions.map((c, i) => {
        const [sx, sy] = slots[i];
        const s = edge(sx, sy, NW / 2, NH / 2, cx - sx, cy - sy, 8);
        const e = edge(cx, cy, OW / 2, OH / 2, sx - cx, sy - cy, 14);
        const bx = Math.min(s.x, e.x) - 30, by = Math.min(s.y, e.y) - 30;
        const bw = Math.abs(s.x - e.x) + 60, bh = Math.abs(s.y - e.y) + 60;
        const A = ctx.el("arrow_" + (i + 1), { x: bx, y: by, w: bw, h: bh, kind: "connector", exit: "recede" });
        const ar = kit.arrow(A.inner, s.x - bx, s.y - by, e.x - bx, e.y - by, { stroke: "ink", sw: 6, head: 28 });
        return { A, ar };
      });

      // ---- the outcome at the centre
      const fillTok = p.accent || "accent";
      const O = ctx.el("outcome", { x: cx - OW / 2, y: cy - OH / 2, w: OW, h: OH, kind: "node", exit: "recede" });
      kit.rect(O.inner, 0, 0, OW, OH, { fill: "surface", r: 22, crisp: true });
      kit.rect(O.inner, 0, 0, OW, OH, { fill: fillTok, r: 22 });
      kit.text(O.inner, p.outcome, { role: "lead", x: 24, y: 10, w: OW - 48, h: OH - 20, maxLines: 3, align: "center", valign: "middle", weight: 800, color: S.pickTokenOn(fillTok) });
      m.settle(O, tOut);

      // ---- the conditions: each lands on its words, then its arrow draws INTO the outcome
      const drawEnds = [];
      p.conditions.forEach((c, i) => {
        const [sx, sy] = slots[i];
        const t = times[i];
        const N = ctx.el("condition_" + (i + 1), { x: sx - NW / 2, y: sy - NH / 2, w: NW, h: NH, kind: "node", exit: "recede" });
        kit.rect(N.inner, 0, 0, NW, NH, { fill: "surface", r: 18, crisp: true });      // solid backing: nothing shows through
        kit.rect(N.inner, 0, 0, NW, NH, { fill: "none", r: 18 });                       // outline
        H.iconDisc(ctx, N.inner, 22 + 38, NH / 2, 38, c.icon || "circle-alert", "accent2", "ink");
        kit.text(N.inner, c.label, { role: "lead", x: 116, y: 10, w: NW - 116 - 24, h: NH - 20, maxLines: 3, align: "left", valign: "middle", weight: 700 });
        m.settle(N, t);
        const a = arrows[i];
        const tDraw = Math.max(t + 0.4, tOut + 0.4), dDraw = S.dur("draw") * 0.8;
        a.A.revealT = tDraw; a.A.revealKind = "draw";
        m.draw(a.ar, tDraw, { dur: dDraw });
        drawEnds.push(tDraw + dDraw);
      });
      H.lateCheck(ctx, times[n - 1], "last condition");

      // ---- the aggregate comes last: a pill under the outcome naming that they combined
      if (p.summary) {
        const PW = 580, PH = 124;
        const sm = ctx.el("summary", { x: cx - PW / 2, y: cy + OH / 2 + 36, w: PW, h: PH, kind: "stamp", exit: "recede" });
        kit.rect(sm.inner, 0, 0, PW, PH, { fill: "accent2", r: 30 });
        kit.text(sm.inner, p.summary, { role: "lead", x: 24, y: 6, w: PW - 48, h: PH - 12, maxLines: 2, align: "center", valign: "middle", weight: 800, color: S.pickTokenOn("accent2") });
        const ts = Math.max(tSum, times[n - 1] + 0.5);
        m.stamp(sm, ts); H.lateCheck(ctx, ts, "summary");
      }

      // ---- the one emphasis: all arrows pulse once, together (peers, simultaneous)
      if (p.say_emphasis) {
        const tp = Math.max(tEmph, Math.max.apply(null, drawEnds));
        arrows.forEach((a) => {
          Loom.tween(a.ar.path, { strokeWidth: 6 }, { strokeWidth: 11, duration: S.dur("enter") * 0.5, ease: Loom.ease.enter, yoyo: true, repeat: 1 }, tp, { kind: "emphasis", beat: ctx.beat.id, name: a.A.name });
          Loom.tween(a.ar.head, { scale: 1, transformOrigin: "50% 50%" }, { scale: 1.35, duration: S.dur("enter") * 0.5, ease: Loom.ease.enter, yoyo: true, repeat: 1 }, tp, { kind: "emphasis", beat: ctx.beat.id, name: a.A.name });
        });
      }
    },
  });
})();
