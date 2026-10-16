// @design rerun_one_change_continued: the same replay runs again with one change, a second lock it has nothing for, and stops
/* b06 - run two: the same copied password, a second lock, the code on YOUR phone, the replay stops.
 *
 * Treatments considered:
 *  (A) a definition card "two factors" over the bench. Rejected: b05 already named it; this beat must SHOW it work.
 *  (B) split the door into two doors. Rejected: it breaks the held bench and the one-change comparison.
 *  (C) CHOSEN: the same bench, the same dashed route, the same copy at the same speed as run one; one change: the
 *      door now carries two lock plates. The copy opens the first and has nothing for the second; the code lights on
 *      your phone, an empty dashed phone sits by the thief's laptop; the copy is pushed back; DENIED.
 *
 * Beat sheet:
 *  "Run two"                    run_slot relabels; the door shuts (it ended open in b04); two lock plates settle
 *  "same copied password"       a copy appears on the thief's screen and travels the dashed route (as in b04);
 *                               lock_know opens on arrival (shackle lifts, plate rule to pos)
 *  "The code is on your phone"  the phone undims and lights 482 913; accent2 rings the code
 *  "not theirs"                 a dashed, empty phone outline draws beside the thief's laptop
 *  "The replay stops"           the copy is pushed back 60 px and dims; DENIED stamps on the door; tally cell 2
 *
 * HELD ELEMENT CONTRACT added here (b07, b08 hold them; b10 calls open()):
 *  lock_know, lock_have: lock plates on the door's lock band. E.open(t) lifts the shackle and turns the plate's rule
 *  to pos; E.close(t) reverses it. E.isOpen is the state after the last scheduled change.
 */
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const B = ctx.beat.id;

    // ---------------------------------------------------------------- held
    const H = {};
    for (const n of ["laptop", "screen", "phone", "line", "door", "door_plate", "run_slot", "tally", "thief_laptop"]) H[n] = ctx.held(n);
    const { phone, door, tally } = H, thief = H.thief_laptop, rs = H.run_slot;

    // ---------------------------------------------------------------- helpers
    const fade = (node, a, b, t, dur, name, key) => {
      node.__fk = node.__fk || key || Loom.uid("b06fade");
      return Loom.drive((e) => node.setAttribute("opacity", (a + (b - a) * e).toFixed(3)), t, dur, "enter", { kind: "recolour", beat: (Loom.ctxBeat && Loom.ctxBeat.id) || B, name, key: node.__fk });
    };
    const chip = (name, word) => {
      const F = kit.fit(word, { role: "label", w: 260, maxLines: 1, weight: 700, size: 26 });
      const ch = Math.round(F.height + 2 * 9), cw = Math.ceil(F.width + 2 * 18);
      const E = ctx.el(name, { x: 0, y: 0, w: cw, h: ch, kind: "token", exit: "recede" });
      // @form token_chip: a small labelled chip that travels on a line, carrying one credential
      kit.rect(E.inner, 0, 0, cw, ch, { fill: "field", r: ch / 2, shadow: false, crisp: true, stroke: "accent3", sw: 3 });
      kit.text(E.inner, word, { role: "label", size: F.size, x: 18, y: 9, w: cw - 36, h: ch - 18, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
      E.cw = cw; E.ch = ch;
      return E;
    };
    const run = (E, pathD, keys) => {
      const p = Loom.svg("path", { d: pathD, fill: "none", stroke: "none" }, ctx.g);
      const L = p.getTotalLength();
      const t0 = keys[0][0], t1 = keys[keys.length - 1][0];
      const ease = Loom.ease.editorial;
      Loom.drive((e, raw) => {
        const now = t0 + raw * (t1 - t0);
        let f = keys[keys.length - 1][1];
        for (let i = 0; i < keys.length - 1; i++) {
          const [ta, fa] = keys[i], [tb, fb] = keys[i + 1];
          if (now <= tb) { const u = tb > ta ? Math.max(0, Math.min(1, (now - ta) / (tb - ta))) : 1; f = fa + (fb - fa) * ease(u); break; }
        }
        const pt = p.getPointAtLength(L * f);
        E.mover.setAttribute("transform", `translate(${(pt.x - E.cw / 2).toFixed(2)} ${(pt.y - E.ch / 2).toFixed(2)})`);
      }, t0, Math.max(0.01, t1 - t0), "linear", { kind: "value_travel", beat: B, name: E.name, content: true });
      return L;
    };

    // ---------------------------------------------------------------- cues
    const tRun = ctx.cue("Run two");
    const tSame = ctx.cue("same copied password");
    const tCode = ctx.cue("The code is on your phone");
    const tNot = ctx.cue("not theirs");
    const tStop = ctx.cue("The replay stops");

    // ---------------------------------------------------------------- run two: relabel, the door shuts, two locks
    if (rs && rs.slot) rs.slot.relabel("RUN 2: PLUS A CODE", tRun + 0.1);
    if (door && door.isOpen) door.swing(tRun, false, { dur: 0.4 });
    const band = (door && door.band) || { x: 1474, y: 560, w: 272, h: 100 };
    const makeLock = (name, label, i) => {
      const w = 130, h = 88, x = band.x + 4 + i * (w + 4), y = band.y + 6;
      const E = ctx.el(name, { x, y, w, h, kind: "object", exit: "recede" });
      // @form lock_plate: a plate with a padlock whose shackle lifts when the right proof arrives, labelled with that proof
      const plate = Loom.svg("rect", { x: 0, y: 0, width: w, height: h, rx: 6, fill: S.c("surface"), stroke: S.c("line"), "stroke-width": 2.5 }, E.inner);
      const shackle = Loom.svg("path", { d: `M ${w / 2 - 11} 30 V 20 A 11 11 0 0 1 ${w / 2 + 11} 20 V 30`, fill: "none", stroke: S.c("muted"), "stroke-width": 4, "stroke-linecap": "round" }, E.inner);
      kit.rect(E.inner, w / 2 - 17, 28, 34, 22, { fill: "muted", r: 4, shadow: false, crisp: true });
      kit.text(E.inner, label, { role: "label", size: 24, x: 6, y: 48, w: w - 12, h: 38, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 700 });
      E.isOpen = false;
      const lineC = S.c("line"), posC = S.c("pos");
      const mix = (a, b, e) => (S.mix ? S.mix(a, b, e) : (e < 0.5 ? a : b));
      const state = (t, open) => {
        const from = E.isOpen ? 1 : 0, to = open ? 1 : 0;
        Loom.drive((e) => {
          const k = from + (to - from) * e;
          shackle.setAttribute("transform", `translate(0 ${(-9 * k).toFixed(2)})`);
          plate.setAttribute("stroke", mix(lineC, posC, k));
        }, t, 0.35, "enter", { kind: "state", beat: (Loom.ctxBeat && Loom.ctxBeat.id) || B, name, key: name + ".state", content: true });
        E.isOpen = !!open;
        return t + 0.35;
      };
      E.open = (t) => state(t, true);
      E.close = (t) => state(t, false);
      m.settle(E, tRun + 0.4 + i * 0.15, { dy: 14 });
      return E;
    };
    const lockKnow = makeLock("lock_know", "password", 0);
    const lockHave = makeLock("lock_have", "code", 1);
    void lockHave;

    // ---------------------------------------------------------------- the same copy, the same route, the same speed as b04
    const copy = chip("copy_chip", "password");
    const routeD = (thief && thief.routeD) || "M 1100 168 V 276 C 1100 420 1290 470 1456 470";
    const tGo = tSame + 0.5;
    m.reveal(copy, tSame + 0.05, { dy: 0, dur: 0.3 });
    const Lr = (() => { const q = Loom.svg("path", { d: routeD }, ctx.g); const n = q.getTotalLength(); q.remove(); return n; })();
    const fRest = 1 - (copy.cw / 2 + 8) / Lr, fBack = 1 - (copy.cw / 2 + 68) / Lr;
    run(copy, routeD, [[tGo, 0], [tGo + 1.2, fRest], [tStop + 0.15, fRest], [tStop + 0.75, fBack]]);
    Loom.sfx("whoosh", tGo);
    lockKnow.open(tGo + 1.25);
    Loom.sfx("tick", tGo + 1.3);

    // ---------------------------------------------------------------- the code is on YOUR phone
    if (phone && phone.dim) phone.dim(tCode - 0.1, false);
    const tLit = phone && phone.light ? phone.light(tCode + 0.15) : tCode + 0.5;
    const ring = Loom.svg("rect", { x: 648, y: 688, width: 144, height: 66, rx: 10, fill: "none", stroke: S.c("accent2"), "stroke-width": 3, opacity: 0 }, ctx.g);
    fade(ring, 0, 1, tLit, 0.3, "phone_ring");
    fade(ring, 1, 0, tStop, 0.3, "phone_ring");

    // ---------------------------------------------------------------- not theirs: an empty phone by the thief's laptop
    const empty = ctx.el("empty_phone", { x: 1250, y: 120, w: 76, h: 140, kind: "object", exit: "recede" });
    // @form empty_outline: a dashed outline of a thing that is missing, drawn where it would have to be
    const ep = kit.path(empty.inner, "M 14 0 H 62 Q 76 0 76 14 V 126 Q 76 140 62 140 H 14 Q 0 140 0 126 V 14 Q 0 0 14 0 Z", { stroke: "accent3", sw: 3 });
    ep.setAttribute("stroke-dasharray", "8 7");
    m.draw(ep, tNot, { dur: 0.6 });
    empty.revealT = tNot;

    // ---------------------------------------------------------------- the replay stops: pushed back, dimmed, DENIED
    fade(copy.inner, 1, 0.4, tStop + 0.2, 0.5, "copy_chip");
    const tStamp = tStop + 0.5;
    // @form verdict_stamp: a short label stamped as a pill or tilted note, coloured to carry its valence
    const stamp = Loom.treat.label(ctx, "door_stamp", { as: "stamp", x: 1610, y: 470, text: "Denied", tone: "pos", role: "lead", rot: -6 });
    m.stamp(stamp, tStamp, { dur: 0.4 });
    Loom.sfx("error", tStamp + 0.05);
    if (tally && tally.verdict) tally.verdict(1, "DENIED", "pos", tStamp + 0.35);
    if (phone && phone.dark) phone.dark(ctx.end - 0.4);
  },
});
