// @design rerun_one_change: a held exchange re-runs with one change, and its verdict is stamped on the gate and into a running tally
/* b04 - run one: a copied password, replayed from another device, opens the same door.
 *
 * Treatments considered:
 *  (A) static + signalling: the bench with a red "copied" tag on the password. Rejected: the claim is behavioural
 *      (the door cannot tell the copy from you); only watching the same opening happen for the copy shows it.
 *  (B) split screen, you and the thief side by side. Rejected: it breaks the held bench and makes the comparison
 *      a layout instead of a re-run.
 *  (C) CHOSEN: the same bench, one change. The run label and the tally arrive (the comparison device), a
 *      distant laptop fades up in the free zone, a copy of the password travels a second, dashed route into the
 *      same door, and the door opens exactly as in b01. ACCEPTED on the door, then small in tally cell 1.
 *
 * Rules from the references: hold the layout and change its state (TED-Ed); a running comparison that returns
 * with one new result (Kurzgesagt); relabel and stamp in place (slot primitive).
 *
 * Beat sheet:
 *  "Run one"               the door shuts (0.4 s); run_slot settles and 'RUN 1: PASSWORD ONLY' stamps in; the
 *                          tally cells settle as one gesture (0.08 s stagger); the phone dims (password only)
 *  "leaked elsewhere"      thief_laptop fades up at the top (no rise); copy_chip appears on its screen; accent2
 *                          moves to the copy
 *  "A bot replays it"      the dashed route draws from the thief laptop into the door; the copy travels it (1.2 s)
 *  "The door opens"        the door opens exactly as in b01 (door.swing, 0.6 s); the copy goes in; ACCEPTED
 *                          stamps on the door (1.3 to 1, no overshoot), then small into tally cell 1
 *
 * HELD ELEMENT CONTRACT added here (b05 keeps them; later beats hold them by name):
 *  run_slot    : run_slot.slot is the Loom.slot api (show / relabel / recolour). Box x 96 y 96 w 620 h 72, badge.
 *  tally       : tally.cells[i] = {x, y, w, h} in station coords (i = 0..3); tally.verdict(i, word, tone, t)
 *                swaps 'RUN i+1' for the verdict word (stamp, 0.4 s) and returns when it has landed.
 *  thief_laptop: holds the distant laptop AND its dashed route. thief_laptop.routeD is the route (station
 *                coords, screen -> door left edge at (1456, 470)); thief_laptop.screenC = [1100, 168].
 */
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const B = ctx.beat.id;

    // ---------------------------------------------------------------- held from b01 (kept through b02, b03)
    const laptop = ctx.held("laptop"), screen = ctx.held("screen"), phone = ctx.held("phone");
    const line = ctx.held("line"), door = ctx.held("door"), plate = ctx.held("door_plate");
    void laptop; void screen; void line; void plate;

    // ---------------------------------------------------------------- helpers
    const fade = (node, a, b, t, dur, name) => {
      node.__fk = node.__fk || Loom.uid("b04fade");
      return Loom.drive((e) => node.setAttribute("opacity", (a + (b - a) * e).toFixed(3)), t, dur, "enter", { kind: "recolour", beat: (Loom.ctxBeat && Loom.ctxBeat.id) || B, name, key: node.__fk });
    };
    /** a chip like b01's: ink pill (or a threat-outlined copy), an accent2 rim we can light and clear */
    const chip = (name, word, copy) => {
      const F = kit.fit(word, { role: "label", w: 260, maxLines: 1, weight: 700, size: 26 });
      const ch = Math.round(F.height + 2 * 9), cw = Math.ceil(F.width + 2 * 18);
      const E = ctx.el(name, { x: 0, y: 0, w: cw, h: ch, kind: "token", exit: "recede" });
      // @form token_chip: a small labelled chip that travels on a line, carrying one credential
      kit.rect(E.inner, 0, 0, cw, ch, { fill: copy ? "field" : "ink", r: ch / 2, shadow: false, crisp: true, stroke: copy ? "accent3" : undefined, sw: copy ? 3 : undefined });
      kit.text(E.inner, word, { role: "label", size: F.size, x: 18, y: 9, w: cw - 36, h: ch - 18, align: "center", valign: "middle", maxLines: 1, weight: 700, color: copy ? "ink" : "field" });
      E.rim = Loom.svg("rect", { x: -6, y: -6, width: cw + 12, height: ch + 12, rx: ch / 2 + 6, fill: "none", stroke: S.c("accent2"), "stroke-width": 3, opacity: 0 }, E.inner);
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
      return { p, L };
    };

    // ---------------------------------------------------------------- cues
    const tRun = ctx.cue("Run one");
    const tLeak = ctx.cue("leaked elsewhere");
    const tBot = ctx.cue("A bot replays it");
    const tReplay = ctx.cue("replays it");
    const tOpen = ctx.cue("The door opens");

    // ---------------------------------------------------------------- run one: the door shuts, the run label and the tally arrive
    door.swing(tRun, false, { dur: 0.4 });
    const slot = Loom.slot(ctx, "run_slot", { x: 96, y: 96, w: 620, h: 72, frame: "badge", role: "lead", token: "line", pad: 12, align: "left", t: tRun });
    slot.show({ text: "RUN 1: PASSWORD ONLY", weight: 700 }, tRun + 0.15, { how: "stamp" });
    slot.E.slot = slot;

    const TX = 96, TY = 186, TW = 640, TH = 64, gap = 12, cw = (TW - 3 * gap) / 4;
    const tally = ctx.el("tally", { x: TX, y: TY, w: TW, h: TH, kind: "scenery", exit: "recede" });
    tally.cells = [];
    const cellG = [];
    for (let i = 0; i < 4; i++) {
      const x = i * (cw + gap);
      // @form tally_cell: one cell of a running scoreboard, holding a run's name until its verdict is stamped in
      const g = Loom.svg("g", {}, tally.inner);
      kit.rect(g, x, 0, cw, TH, { fill: "surface2", stroke: "line", sw: 2, r: 6, shadow: false, crisp: true });
      const lab = Loom.svg("g", {}, g);
      kit.text(lab, "RUN " + (i + 1), { role: "label", size: 24, x: x + 10, y: 8, w: cw - 20, h: TH - 16, align: "center", valign: "middle", maxLines: 1, color: "muted", weight: 700 });
      const ver = Loom.svg("g", {}, g);
      tally.cells.push({ x: TX + x, y: TY, w: cw, h: TH });
      cellG.push({ g, lab, ver, x });
      Loom.tween(g, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: S.dur("enter"), ease: Loom.ease.enter }, tRun + 0.35 + i * 0.08, { kind: "settle", beat: B, name: "tally" });
    }
    tally.revealT = tRun + 0.35;
    /** swap a cell's run name for its verdict (stamped, no overshoot); returns the landing time */
    tally.verdict = (i, word, tone, t) => {
      const c = cellG[i];
      const vg = Loom.svg("g", {}, c.ver);
      kit.text(vg, word, { role: "label", size: 24, x: c.x + 8, y: 8, w: cw - 16, h: TH - 16, align: "center", valign: "middle", maxLines: 1, color: tone, weight: 700 });
      Loom.svg("rect", { x: c.x, y: 0, width: cw, height: TH, rx: 6, fill: "none", stroke: S.c(tone), "stroke-width": 2.5 }, vg);   // the cell's rule takes the verdict's colour
      Loom.tween(c.lab, { opacity: 1 }, { opacity: 0, duration: 0.18, ease: Loom.ease.exit, immediateRender: false }, t, { kind: "exit", beat: (Loom.ctxBeat && Loom.ctxBeat.id) || B, name: "tally" });
      Loom.tween(vg, { opacity: 0, scale: 1.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.4, ease: Loom.ease.enter }, t + 0.18, { kind: "stamp", beat: (Loom.ctxBeat && Loom.ctxBeat.id) || B, name: "tally", content: true });
      Loom.sfx("land", t + 0.2);
      return t + 0.58;
    };
    phone.dim(tRun + 0.3, true);

    // ---------------------------------------------------------------- it leaked elsewhere: the distant laptop, a copy on its screen
    const thief = ctx.el("thief_laptop", { x: 980, y: 110, w: 490, h: 380, kind: "object", exit: "recede" });
    const routeD = "M 1100 168 V 276 C 1100 420 1290 470 1456 470";
    {
      const g = thief.inner;
      // @form threat_device_outline: a smaller device drawn only as an outline in the threat colour, far from yours
      const lap = Loom.svg("g", {}, g);
      kit.rect(lap, 18, 0, 204, 128, { fill: "field", stroke: "accent3", sw: 3, r: 10, shadow: false });
      kit.rect(lap, 28, 10, 184, 108, { fill: "field2", r: 3, shadow: false, crisp: true });
      kit.path(lap, "M 10 128 H 230 L 240 160 H 0 Z", { fill: "field", stroke: "accent3", sw: 3 });
      Loom.svg("rect", { x: 90, y: 146, width: 60, height: 8, rx: 2, fill: "none", stroke: S.c("accent3"), "stroke-width": 1.5, opacity: 0.7 }, lap);
      // the dashed route, revealed by drawing a solid mask along it (a dashed stroke cannot be drawn by its dash offset)
      const mid = Loom.uid("thiefroute");
      const mask = Loom.svg("mask", { id: mid, maskUnits: "userSpaceOnUse", x: -1000, y: -1000, width: 4000, height: 4000 }, g);
      const localD = "M 120 166 C 120 310 310 360 476 360";   // the visible route, from the laptop deck to the door (local coords)
      const mpath = Loom.svg("path", { d: localD, fill: "none", stroke: S.c("ink"), "stroke-width": 10, "stroke-linecap": "round" }, mask);
      // @form dashed_threat_route: a dashed route in the threat colour from a far device into the gate
      Loom.svg("path", { d: localD, fill: "none", stroke: S.c("accent3"), "stroke-width": 3, "stroke-dasharray": "10 9", mask: `url(#${mid})` }, g);
      thief.routeD = routeD; thief.screenC = [1100, 168]; thief.routeMask = mpath; thief.lap = lap;
      Loom.tween(thief.inner, { opacity: 0 }, { opacity: 1, duration: S.dur("enter") * 1.2, ease: Loom.ease.enter }, tLeak, { kind: "reveal", beat: B, name: "thief_laptop", content: true });
      thief.revealT = tLeak;
      m.draw(mpath, Math.max(tBot, tLeak + 1.0), { dur: 0.75 });
    }
    const copy = chip("copy_chip", "password", true);
    const tCopy = tLeak + 0.45;
    m.reveal(copy, tCopy, { dy: 0, dur: 0.3 });
    fade(copy.rim, 0, 1, tCopy + 0.1, 0.3, "copy_chip");
    Loom.sfx("pop", tCopy);

    // ---------------------------------------------------------------- a bot replays it: the copy travels the route; the door opens for it
    const lenOf = (d) => { const q = Loom.svg("path", { d }, ctx.g); const n = q.getTotalLength(); q.remove(); return n; };
    const Lr = lenOf(routeD), Lfull = Lr + 184;                      // the route, then on into the doorway
    const tGo = Math.max(tReplay, Math.max(tBot, tLeak + 1.0) + 0.55);
    const tArr = tGo + 1.2;
    const tIn = tOpen + 0.2;
    run(copy, routeD + " H 1640", [[tGo, 0], [tArr, (Lr - copy.cw / 2 - 8) / Lfull], [tIn, (Lr - copy.cw / 2 - 8) / Lfull], [tIn + 0.5, (Lr + 160) / Lfull]]);
    Loom.sfx("whoosh", tGo);

    // the door opens for the copy exactly as it opened for you (same hinge, same timing as b01)
    door.swing(tOpen, true, { dur: 0.6 });
    Loom.sfx("success", tOpen + 0.05);
    m.exit(copy, tIn + 0.4, "recede");

    // ACCEPTED on the door (the accent leaves the copy as the verdict lands), then small in tally cell 1
    const tStamp = tOpen + 0.4;
    // @form verdict_stamp: a short label stamped as a pill or tilted note, coloured to carry its valence
    const stamp = Loom.treat.label(ctx, "door_stamp", { as: "stamp", x: 1610, y: 470, text: "Accepted", tone: "neg", role: "lead", rot: -6 });
    m.stamp(stamp, tStamp, { dur: 0.4 });
    fade(copy.rim, 1, 0, tStamp, 0.25, "copy_chip");
    Loom.sfx("land", tStamp + 0.05);
    tally.verdict(0, "ACCEPTED", "neg", tStamp + 0.35);
  },
});
