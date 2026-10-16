// @design held_frame_returns_changed: the establishing schematic returns at the same coordinates with one state changed, and a stack that grows on the spoken repetition carries the warning sign
/* b18 - Last, a prompt you did not start. Say it comes again, and again. Someone may have your password.
 *
 * Treatments considered:
 *   (A) a phone screen close-up with a notification list growing (rejected: cuts away from the bench the
 *       whole lesson re-runs; the callback to run one needs the thief's line in the same frame).
 *   (B) static composition: three prompt cards already stacked, a caption "repeated prompts" (rejected: the
 *       warning sign IS repetition over time, "again, and again"; a still stack says "many", not "again").
 *   (C) CHOSEN: the bench returns by camera at its b01 coordinates, laptop CLOSED (you are not signing in);
 *       notification cards slide up out of the phone one per spoken "again", stacking; then the distant laptop
 *       from run one fades up and its copied password travels the dashed line to the door.
 * Rules taken (lnd-visual-storyteller s2, payoff: the establishing framing returns, changed; docs/references/ui:
 * real, product-neutral words in a notification): a returning place does not re-enter under a camera move, so the
 * bench, slot and tally are set before the camera arrives; the one accent (accent2) moves laptop -> top card ->
 * copied password; threat colour (accent3) only on the thief's laptop, its line and the copy.
 * Continuity: rebuilds laptop, phone, line, door, door_plate, run_slot, tally under the b01/b04 names and boxes
 * (b19 holds them, b20 to b22 keep them). Creates prompt_1..3, thief_laptop, thief_line, copy_chip (held by b19).
 */
Loom.scene("b18", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, T = Loom.treat;
    const tPre = ctx.start - 1.0;                       // before the camera leaves the study wall (not on camera)
    const set = (E) => { m.reveal(E, tPre, { dur: 0.01, dy: 0 }); return E; };

    /* ---------------- the bench, rebuilt at its b01 coordinates and drawing, already in place ---------------- */
    // (the drawing follows b01 line for line, so the return reads as the same place; only the laptop is shut)
    const fade = (node, a, b, t, dur, name, key) => {
      node.__fk = node.__fk || key || Loom.uid("b18fade");
      return Loom.drive((e) => node.setAttribute("opacity", (a + (b - a) * e).toFixed(3)), t, dur, "enter", { kind: "recolour", beat: ctx.beat.id, name, key: node.__fk });
    };
    const laptop = set(ctx.el("laptop", { x: 120, y: 470, w: 470, h: 410, kind: "object", real: "laptop", exit: "recede" }));
    let lid;
    {
      const g = laptop.inner;
      // @form laptop_shut: the bench laptop with its lid closed flat on the deck, so nobody is signing in on it
      kit.path(g, "M 0 378 H 470 L 466 390 H 4 Z", { fill: "surface", stroke: "line", sw: 2 });   // front edge, as in b01
      kit.path(g, "M 8 340 H 462 L 470 378 H 0 Z", { fill: "surface2", stroke: "line", sw: 3 });  // the deck, seen under the lid
      lid = kit.path(g, "M 14 318 H 456 L 464 366 H 6 Z", { fill: "surface", stroke: "accent2", sw: 3 });   // the lid, shut
      Loom.svg("circle", { cx: 235, cy: 342, r: 4, fill: S.c("line") }, g);
      kit.line(g, -20, 410, 490, 410, { stroke: "line", sw: 2 });   // the bench surface under it
    }
    laptop.lid = lid;

    const phone = set(ctx.el("phone", { x: 630, y: 540, w: 180, h: 340, kind: "object", real: "phone", exit: "recede" }));
    {
      const g = phone.inner;
      kit.rect(g, 0, 0, 180, 340, { fill: "surface2", stroke: "line", sw: 3, r: 26, shadow: false });
      kit.rect(g, 11, 11, 158, 318, { fill: "field", r: 17, shadow: false, crisp: true });
      Loom.svg("rect", { x: 70, y: 20, width: 40, height: 7, rx: 3.5, fill: S.c("line"), opacity: 0.8 }, g);
      const lit = Loom.svg("g", { opacity: 0 }, g);
      kit.rect(lit, 11, 11, 158, 318, { fill: "surface", r: 17, shadow: false, crisp: true });
      phone.lit = lit; phone.__lit = false; phone.__dim = false;
      phone.light = (t) => { fade(lit, 0, 1, t, 0.35, "phone", "phone.lit"); phone.__lit = true; return t + 0.35; };
      phone.dark = (t) => { fade(lit, 1, 0, t, 0.3, "phone", "phone.lit"); phone.__lit = false; return t + 0.3; };
      phone.dim = (t, on) => { const a = on ? 1 : 0.4, b = on ? 0.4 : 1; fade(phone.life, a, b, t, 0.4, "phone", "phone.dim"); phone.__dim = !!on; return t + 0.4; };
      kit.line(g, -20, 340, 200, 340, { stroke: "line", sw: 2 });
    }

    const door = set(ctx.el("door", { x: 1460, y: 330, w: 300, h: 550, kind: "object", real: "door", exit: "recede" }));
    {
      const g = door.inner;
      const inside = Loom.svg("g", {}, g);
      kit.rect(inside, 12, 12, 276, 538, { fill: "shadow", r: 2, shadow: false, crisp: true });
      const glow = Loom.svg("rect", { x: 12, y: 12, width: 276, height: 538, fill: S.c("accent2"), opacity: 0 }, inside);
      const leaf = Loom.svg("g", {}, g);
      kit.rect(leaf, 14, 14, 272, 536, { fill: "surface", stroke: "line", sw: 2, r: 2, shadow: false });
      Loom.svg("rect", { x: 40, y: 40, width: 220, height: 170, rx: 2, fill: "none", stroke: S.c("line"), "stroke-width": 1.5, opacity: 0.55 }, leaf);
      Loom.svg("rect", { x: 40, y: 360, width: 220, height: 160, rx: 2, fill: "none", stroke: S.c("line"), "stroke-width": 1.5, opacity: 0.55 }, leaf);
      Loom.svg("rect", { x: 14, y: 230, width: 272, height: 100, fill: S.c("surface2") }, leaf);
      kit.line(leaf, 14, 230, 286, 230, { stroke: "line", sw: 1.5 });
      kit.line(leaf, 14, 330, 286, 330, { stroke: "line", sw: 1.5 });
      Loom.svg("rect", { x: 258, y: 350, width: 9, height: 44, rx: 4.5, fill: S.c("muted") }, leaf);
      [60, 480].forEach((y) => Loom.svg("rect", { x: 8, y, width: 10, height: 30, rx: 2, fill: S.c("line") }, g));
      const rim = Loom.svg("rect", { x: 2, y: 2, width: 296, height: 548, rx: 3, fill: "none", stroke: S.c("line"), "stroke-width": 4 }, g);
      kit.line(g, -30, 550, 330, 550, { stroke: "line", sw: 2 });
      door.leaf = leaf; door.rim = rim; door.glow = glow;
      door.band = { x: 1474, y: 560, w: 272, h: 100 };
      door.isOpen = false;
      const lineCol = S.c("line"), posCol = S.c("pos");
      door.swing = (t, open, o) => {
        o = o || {};
        const dur = o.dur || 0.6, from = door.isOpen ? 1 : 0, to = open ? 1 : 0;
        Loom.drive((e) => {
          const k = from + (to - from) * e;
          leaf.setAttribute("transform", `translate(14 0) scale(${(1 - 0.84 * k).toFixed(4)} 1) translate(-14 0)`);
          leaf.setAttribute("opacity", (1 - 0.15 * k).toFixed(3));
          rim.setAttribute("stroke", S.mix(lineCol, posCol, k));
        }, t, dur, open ? "enter" : "move", { kind: "state", beat: Loom.ctxBeat && Loom.ctxBeat.id, name: "door", key: "door.leaf.b18", content: true });
        door.isOpen = !!open;
        return t + dur;
      };
    }
    set(T.label(ctx, "door_plate", { x: 1610, y: 278, text: "login.yourwork.example", tone: "surface", role: "label" }));

    // the line: the phone's feeder and the run to the door; the laptop's leg is not drawn (its lid is shut)
    const line = set(ctx.el("line", { x: 560, y: 500, w: 900, h: 240, kind: "scenery", exit: "recede" }));
    {
      const g = Loom.svg("g", { transform: "translate(-560 -500)" }, line.inner);
      const mainD = "M 830 720 H 1440";
      const main = Loom.svg("path", { d: mainD, fill: "none", stroke: S.c("line"), "stroke-width": 3, "stroke-linejoin": "round" }, g);
      const feed = Loom.svg("path", { d: "M 810 720 H 830", fill: "none", stroke: S.c("line"), "stroke-width": 3 }, g);
      const ticks = Loom.svg("g", {}, g);
      for (let x = 900; x <= 1380; x += 80) Loom.svg("path", { d: `M ${x - 5} 711 L ${x + 4} 720 L ${x - 5} 729`, fill: "none", stroke: S.c("muted"), "stroke-width": 2, opacity: 0.6 }, ticks);
      const dot = Loom.svg("circle", { cx: 830, cy: 720, r: 6, fill: S.c("line") }, g);
      line.main = main; line.mainD = mainD; line.port = [830, 720]; line.join = [830, 720]; line.end = [1440, 720];
      line.ticks = ticks; line.dot = dot; line.feed = feed;
    }

    // the run label, rebuilt in its slot exactly as b04 drew it, and the tally with all four verdicts in place
    const slot = Loom.slot(ctx, "run_slot", { x: 96, y: 96, w: 620, h: 72, frame: "badge", role: "lead", token: "line", pad: 12, align: "left", t: false });
    slot.show({ text: "A PROMPT YOU DID NOT START", weight: 700 }, tPre - 0.6, { how: "swap" });
    slot.E.slot = slot;
    set(slot.E);

    const TX = 96, TY = 186, TW = 640, TH = 64, tgap = 12, tcw = (TW - 3 * tgap) / 4;
    const tally = set(ctx.el("tally", { x: TX, y: TY, w: TW, h: TH, kind: "scenery", exit: "recede" }));
    const verdicts = [["ACCEPTED", "neg"], ["DENIED", "pos"], ["ACCEPTED", "neg"], ["DENIED", "pos"]];
    tally.cells = [];
    verdicts.forEach(([v, tone], i) => {
      const x = i * (tcw + tgap);
      // @form tally_cell: one cell of a running scoreboard, holding a run's verdict in the verdict's colour
      kit.rect(tally.inner, x, 0, tcw, TH, { fill: "surface2", stroke: "line", sw: 2, r: 6, shadow: false, crisp: true });
      kit.text(tally.inner, v, { role: "label", size: 24, x: x + 8, y: 8, w: tcw - 16, h: TH - 16, align: "center", valign: "middle", maxLines: 1, color: tone, weight: 700 });
      Loom.svg("rect", { x, y: 0, width: tcw, height: TH, rx: 6, fill: "none", stroke: S.c(tone), "stroke-width": 2.5 }, tally.inner);
      tally.cells.push({ x: TX + x, y: TY, w: tcw, h: TH });
    });

    /* ---------------- prompts stack above the phone, one per spoken repetition ---------------- */
    const CW = 440, inset = 22;
    const fT = kit.fit("Sign-in request", { role: "label", w: CW - 2 * inset, maxLines: 1, weight: 700 });
    const fQ = kit.fit("Is this you signing in?", { role: "body", w: CW - 2 * inset, maxLines: 1 });
    const BH = 52, gap = 10;
    const CH = Math.ceil(inset + fT.height + gap + fQ.height + 16 + BH + inset);
    const stackX = 530, stackY = 520 - CH - 6;         // the bottom card sits just above the phone (top 540)
    const card = (i, t, hot) => {
      const x = stackX + i * 24, y = stackY - i * 24;
      // @form notification_card: a system prompt card with a title, one question and two buttons, a tail to its device
      const E = ctx.el("prompt_" + (i + 1), { x, y, w: CW, h: CH + 26, kind: "card", exit: "recede" });
      const frame = kit.rect(E.inner, 0, 0, CW, CH, { fill: "surface", r: 6, stroke: hot ? "accent2" : "line", sw: hot ? 3 : 2 });
      kit.text(E.inner, "Sign-in request", { role: "label", x: inset, y: inset, w: CW - 2 * inset, h: fT.height, maxLines: 1, weight: 700, color: "muted" });
      kit.text(E.inner, "Is this you signing in?", { role: "body", x: inset, y: inset + fT.height + gap, w: CW - 2 * inset, h: fQ.height, maxLines: 1 });
      const by = CH - inset - BH, bw = (CW - 2 * inset - 14) / 2;
      const deny = Loom.ui.button(ctx, E.inner, { x: inset, y: by, w: bw, h: BH, label: "Deny", fill: "surface2" });
      const approve = Loom.ui.button(ctx, E.inner, { x: inset + bw + 14, y: by, w: bw, h: BH, label: "Approve", fill: "surface2" });
      E.frame = frame; E.deny = deny; E.approve = approve; E.cx0 = x; E.cy0 = y;
      // slides up out of the phone, eased out (0.5 s)
      Loom.tween(E.inner, { opacity: 0, y: 90 }, { opacity: 1, y: 0, duration: 0.5, ease: Loom.ease.enter }, t, { kind: "slide", beat: ctx.beat.id, name: E.name, content: true });
      E.revealT = t; E.revealKind = "slide";
      Loom.sfx("card", t);
      return E;
    };
    const tP1 = ctx.cue("a prompt you did not start");
    const tP2 = ctx.cue("Say it comes again");
    const tP3 = ctx.cue("and again");
    // one tail from the stack to the phone: the prompts come from the phone, wherever the stack is
    const tail = ctx.el("prompt_tail", { x: 712, y: stackY + CH, w: 16, h: 540 - stackY - CH, kind: "connector", exit: "recede" });
    const tp = kit.path(tail.inner, `M 8 ${540 - stackY - CH} V 2`, { stroke: "line", sw: 3, dash: "3 8" });
    m.draw(tp, tP1, { dur: 0.3 });
    tail.revealT = tP1;
    if (phone.light) phone.light(tP1 - 0.1);
    const p1 = card(0, tP1, false);
    const p2 = card(1, tP2, false);
    const p3 = card(2, tP3, true);
    // accent2 leaves the closed laptop as the first prompt arrives, and lands on the top card with the third
    Loom.hold.heat([lid], tP1, { from: "accent2", to: "line", dur: 0.3, attr: "stroke" });

    /* ---------------- someone may have your password: run one's thief returns (drawn as in b04) ---------------- */
    const tThief = ctx.cue("Someone may have your password");
    const thief = ctx.el("thief_laptop", { x: 980, y: 110, w: 490, h: 380, kind: "object", exit: "recede" });
    const routeD = "M 1100 168 V 276 C 1100 420 1290 470 1456 470";
    let mpath;
    {
      const g = thief.inner;
      // @form threat_device_outline: a smaller device drawn only as an outline in the threat colour, far from yours
      const lap = Loom.svg("g", {}, g);
      kit.rect(lap, 18, 0, 204, 128, { fill: "field", stroke: "accent3", sw: 3, r: 10, shadow: false });
      kit.rect(lap, 28, 10, 184, 108, { fill: "field2", r: 3, shadow: false, crisp: true });
      kit.path(lap, "M 10 128 H 230 L 240 160 H 0 Z", { fill: "field", stroke: "accent3", sw: 3 });
      Loom.svg("rect", { x: 90, y: 146, width: 60, height: 8, rx: 2, fill: "none", stroke: S.c("accent3"), "stroke-width": 1.5, opacity: 0.7 }, lap);
      const mid = Loom.uid("b18route");
      const mask = Loom.svg("mask", { id: mid, maskUnits: "userSpaceOnUse", x: -1000, y: -1000, width: 4000, height: 4000 }, g);
      const localD = "M 120 166 C 120 310 310 360 476 360";
      mpath = Loom.svg("path", { d: localD, fill: "none", stroke: S.c("ink"), "stroke-width": 10, "stroke-linecap": "round" }, mask);
      // @form dashed_threat_route: a dashed route in the threat colour from a far device into the gate
      Loom.svg("path", { d: localD, fill: "none", stroke: S.c("accent3"), "stroke-width": 3, "stroke-dasharray": "10 9", mask: `url(#${mid})` }, g);
      thief.routeD = routeD; thief.screenC = [1100, 168]; thief.routeMask = mpath; thief.lap = lap;
      Loom.tween(thief.inner, { opacity: 0 }, { opacity: 1, duration: S.dur("enter") * 1.2, ease: Loom.ease.enter }, tThief, { kind: "reveal", beat: ctx.beat.id, name: "thief_laptop", content: true });
      thief.revealT = tThief;
      m.draw(mpath, tThief + 0.45, { dur: 0.6 });
    }
    // the copy, drawn like b04's chip (threat outline), travels the same route to the door
    const F = kit.fit("password", { role: "label", w: 260, maxLines: 1, weight: 700, size: 26 });
    const chh = Math.round(F.height + 18), chw = Math.ceil(F.width + 36);
    const chip = ctx.el("copy_chip", { x: 0, y: 0, w: chw, h: chh, kind: "token", exit: "recede" });
    kit.rect(chip.inner, 0, 0, chw, chh, { fill: "field", r: chh / 2, shadow: false, crisp: true, stroke: "accent3", sw: 3 });
    kit.text(chip.inner, "password", { role: "label", size: F.size, x: 18, y: 9, w: chw - 36, h: chh - 18, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    chip.rim = Loom.svg("rect", { x: -6, y: -6, width: chw + 12, height: chh + 12, rx: chh / 2 + 6, fill: "none", stroke: S.c("accent2"), "stroke-width": 3, opacity: 0 }, chip.inner);
    chip.cw = chw; chip.ch = chh;
    const rp = Loom.svg("path", { d: routeD, fill: "none", stroke: "none" }, ctx.g);
    const RL = rp.getTotalLength(), stop = (RL - chw / 2 - 8) / RL;
    const place = (f) => { const p = rp.getPointAtLength(RL * f); chip.mover.setAttribute("transform", `translate(${(p.x - chw / 2).toFixed(2)} ${(p.y - chh / 2).toFixed(2)})`); };
    const tCopy = tThief + 0.3, tGo = tThief + 1.0;
    m.reveal(chip, tCopy, { dy: 0, dur: 0.3 });
    // accent2 leaves the top card and rides the copy
    Loom.hold.heat([p3.frame], tCopy, { from: "accent2", to: "line", dur: 0.3, attr: "stroke" });
    Loom.tween(chip.rim, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: Loom.ease.enter }, tCopy + 0.1, { kind: "recolour", beat: ctx.beat.id, name: "copy_chip" });
    Loom.drive((e) => place(stop * e), tGo, 1.2, "editorial", { kind: "value_travel", beat: ctx.beat.id, name: "copy_chip", content: true });
    Loom.sfx("whoosh", tGo);
    void p1; void p2;
  },
});
