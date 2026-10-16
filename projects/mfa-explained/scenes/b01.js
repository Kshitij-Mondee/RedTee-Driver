// @design exchange_bench: two ends joined by one line; what one end sends travels the line and a gate on the far end opens for it
/* b01 - the hook: the plain sign-in, run once, on the bench the whole lesson re-runs.
 *
 * Treatments considered (lnd-motion-choreography-loop, pass A):
 *  (A) static composition + signalling: the bench drawn, three labels lit in turn (password, code, in). Rejected:
 *      the lesson's object is an exchange over time; a lit label says "this exists", not "this travelled".
 *  (B) a flow chart of the sign-in (boxes and arrows). Rejected: it is the formal picture before the everyday
 *      one, and it cannot be re-run with one change, which is what every later run needs.
 *  (C) CHOSEN: the bench as a drawn world (laptop with a real sign-in page, phone, one line, the site as a
 *      door), the exchange performed on it: type, press, the password chip travels, the code chip follows,
 *      the door opens. Still camera, moving drawing. This first run is the baseline the other runs compare to.
 *
 * Rules taken from the references (design.references):
 *  - TED-Ed conclusions: hold one layout and change its state on the spoken word; never rebuild it.
 *  - Lucas's Lab: build on one board with small additions; the everyday thing before the formal picture.
 *  - UI reference board: every word on the page is real and product-neutral (no vendor colour, logo, layout).
 *  - dark-technical: thin precise strokes, greys for structure, ONE warm accent (accent2) on what is named now.
 *
 * Beat sheet (cues are words of this beat):
 *  0.00  bench present from frame 0 (laptop, page, phone, door, plate) and settles; the line draws laptop -> door
 *  "type your password"  dots type into the Password field (18 cps); Continue is pressed
 *  "password"            pw_chip leaves the laptop port, travels the line to the door (1.2 s); accent2 rides it
 *  "asks for a code"     a pulse returns along the line to the phone; the phone lights with 482 913
 *  "code from your phone" code_chip rises from the phone onto the line and follows (1.2 s); accent2 moves to it
 *  "You are in"          the leaf swings open on its hinge (0.6 s, ease out); a thin pos rim lights the frame;
 *                        the chips settle into the doorway and fade; the accent leaves
 *
 * HELD ELEMENT CONTRACT (later beats hold these by name; methods schedule state changes at absolute times):
 *  laptop  : the device body (no methods).
 *  screen  : the sign-in page in the screen rect x 150 y 495 w 410 h 255. screen.page = {field, button}.
 *  phone   : phone.light(t) shows '482 913' on its screen; phone.dark(t) turns it off; phone.dim(t, on) fades the
 *            whole phone to muted (on=true) or back (on=false). phone.codeText is the digits' <text>.
 *  line    : line.main is the path laptop port -> door (station coords), line.mainD its d, line.port = [575, 515]
 *            (laptop port), line.join = [830, 720] (where the phone joins), line.end = [1440, 720].
 *  door    : door.swing(t, open, {dur}) opens or shuts the leaf on its hinge (keyed drive "door.leaf"; the rim
 *            recolours to pos when open). door.isOpen is the state after the last scheduled swing.
 *            door.band = {x: 1474, y: 560, w: 272, h: 100} the lock band in station coords.
 *  door_plate: the tag 'login.yourwork.example' above the door.
 * The door ends OPEN; b04 shuts it on "Run one".
 */
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const B = ctx.beat.id;
    const mono = S.font("mono").family;

    // ---------------------------------------------------------------- helpers
    /** a text in the mono face: fitted at a fixed size in a box measured for the mono glyphs */
    const monoText = (g, str, o) => {
      const w = Math.ceil(kit.measure(str, "mono", o.size, o.weight || 400)) + 4;
      const x = o.align === "center" ? o.cx - w / 2 : o.align === "right" ? o.rx - w : o.x;
      const t = kit.text(g, str, { role: o.role || "label", size: o.size, x, y: o.y, w, h: o.h, align: "left", valign: "middle", maxLines: 1, color: o.color || "ink", weight: o.weight });
      t.setAttribute("font-family", mono);
      t.setAttribute("font-weight", o.weight || 400);
      return t;
    };
    /** a chip: an ink pill with a word, an accent2 rim we can light and clear. Drawn in local 0..w, 0..h. */
    const chip = (name, word) => {
      const F = kit.fit(word, { role: "label", w: 260, maxLines: 1, weight: 700, size: 26 });
      const ch = Math.round(F.height + 2 * 9), cw = Math.ceil(F.width + 2 * 18);
      const E = ctx.el(name, { x: 0, y: 0, w: cw, h: ch, kind: "token", exit: "recede" });
      // @form token_chip: a small labelled chip that travels on a line, carrying one credential
      kit.rect(E.inner, 0, 0, cw, ch, { fill: "ink", r: ch / 2, shadow: false, crisp: true });
      kit.text(E.inner, word, { role: "label", size: F.size, x: 18, y: 9, w: cw - 36, h: ch - 18, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "field" });
      const rim = Loom.svg("rect", { x: -5, y: -5, width: cw + 10, height: ch + 10, rx: ch / 2 + 5, fill: "none", stroke: S.c("accent2"), "stroke-width": 3, opacity: 0 }, E.inner);
      E.rim = rim; E.cw = cw; E.ch = ch;
      return E;
    };
    /** move an element's centre along a path through keyed stops: keys = [[t, frac], ...]; eased between stops.
     *  ONE drive for the whole run, so seeking in any order gives the same frame. */
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
      return p;
    };
    // opacity drives on one node share a key, so only the first renders its start state at load (the next one's
    // start state is the previous one's end state: frames are the same whatever order they are seeked in)
    const fade = (node, a, b, t, dur, name, key) => {
      node.__fk = node.__fk || key || Loom.uid("b01fade");
      return Loom.drive((e) => node.setAttribute("opacity", (a + (b - a) * e).toFixed(3)), t, dur, "enter", { kind: "recolour", beat: (Loom.ctxBeat && Loom.ctxBeat.id) || B, name, key: node.__fk });
    };

    // ---------------------------------------------------------------- cues
    const tType = ctx.cue("type your password");
    const tPw = ctx.cue("password");
    const tAsk = ctx.cue("asks for a code");
    const tCode = ctx.cue("code from your phone");
    const tIn = ctx.cue("You are in");
    const t0 = ctx.start;

    // ---------------------------------------------------------------- laptop (x 120 y 470 w 470 h 410)
    const laptop = ctx.el("laptop", { x: 120, y: 470, w: 470, h: 410, kind: "object", real: "laptop", exit: "recede" });
    {
      const g = laptop.inner;
      // @form laptop_schematic: a front-facing laptop drawn in thin grey strokes, its deck in shallow perspective
      // lid (bezel) around the screen rect (screen at local 30, 25, 410 x 255)
      kit.rect(g, 15, 12, 440, 280, { fill: "surface2", stroke: "line", sw: 3, r: 14, shadow: false });
      kit.rect(g, 30, 25, 410, 255, { fill: "field", r: 4, shadow: false, crisp: true });
      Loom.svg("circle", { cx: 235, cy: 18.5, r: 2.6, fill: S.c("muted") }, g);
      // deck in shallow perspective: back edge at the hinge, front edge wider and lower
      kit.path(g, "M 8 292 H 462 L 470 378 H 0 Z", { fill: "surface2", stroke: "line", sw: 3 });
      kit.path(g, "M 0 378 H 470 L 466 390 H 4 Z", { fill: "surface", stroke: "line", sw: 2 });
      for (let r = 0; r < 4; r++) {   // key rows, faint
        const y = 302 + r * 13, inset = 30 - r * 3;
        for (let k = 0; k < 13; k++) {
          const kw = (410 + (30 - inset) * 2 - 12 * 6) / 13;
          Loom.svg("rect", { x: (inset + k * (kw + 6)).toFixed(1), y, width: kw.toFixed(1), height: 8, rx: 2, fill: S.c("line"), opacity: 0.32 }, g);
        }
      }
      Loom.svg("rect", { x: 190, y: 356, width: 90, height: 16, rx: 3, fill: "none", stroke: S.c("line"), "stroke-width": 1.5, opacity: 0.6 }, g);
      kit.line(g, -20, 410, 490, 410, { stroke: "line", sw: 2 });   // the bench surface under it
    }

    // ---------------------------------------------------------------- screen: the sign-in page (x 150 y 495 w 410 h 255)
    const screen = ctx.el("screen", { x: 150, y: 495, w: 410, h: 255, kind: "card", exit: "recede" });
    {
      const g = screen.inner;
      // @form signin_page: a product-neutral sign-in page with an address line, a title, one field and a button
      kit.rect(g, 0, 0, 410, 255, { fill: "surface", r: 4, shadow: false, crisp: true });
      kit.rect(g, 0, 0, 410, 44, { fill: "surface2", r: 4, shadow: false, crisp: true });
      // the address line: a small padlock, then the address in mono
      kit.rect(g, 14, 18, 12, 10, { fill: "muted", r: 2, shadow: false, crisp: true });
      Loom.svg("path", { d: "M 16.5 18 V 15 A 3.5 3.5 0 0 1 23.5 15 V 18", stroke: S.c("muted"), "stroke-width": 2, fill: "none" }, g);
      monoText(g, "login.yourwork.example", { x: 36, y: 4, h: 36, size: 24, color: "muted" });
      kit.text(g, "Sign in", { role: "lead", size: 34, x: 24, y: 50, w: 360, h: 48, maxLines: 1, weight: 700, valign: "middle" });
      const field = Loom.ui.field(ctx, g, { x: 24, y: 104, w: 362, h: 50, role: "label", pad: 16 });
      const ph = kit.text(field.g, "Password", { role: "label", size: 24, x: 40, y: 104, w: 330, h: 50, valign: "middle", maxLines: 1, color: "muted" });
      const btn = Loom.ui.button(ctx, g, { x: 24, y: 172, label: "Continue", h: 48, fill: "line" });
      screen.page = { field, button: btn, placeholder: ph };
    }

    // ---------------------------------------------------------------- phone (x 630 y 540 w 180 h 340)
    const phone = ctx.el("phone", { x: 630, y: 540, w: 180, h: 340, kind: "object", real: "phone", exit: "recede" });
    {
      const g = phone.inner;
      // @form phone_schematic: an upright phone slab in thin grey strokes whose dark screen can light with a code
      kit.rect(g, 0, 0, 180, 340, { fill: "surface2", stroke: "line", sw: 3, r: 26, shadow: false });
      kit.rect(g, 11, 11, 158, 318, { fill: "field", r: 17, shadow: false, crisp: true });
      Loom.svg("rect", { x: 70, y: 20, width: 40, height: 7, rx: 3.5, fill: S.c("line"), opacity: 0.8 }, g);
      const lit = Loom.svg("g", { opacity: 0 }, g);
      kit.rect(lit, 11, 11, 158, 318, { fill: "surface", r: 17, shadow: false, crisp: true });
      kit.text(lit, "Your code", { role: "label", size: 24, x: 22, y: 118, w: 136, h: 34, align: "center", valign: "middle", maxLines: 1, color: "muted" });
      const code = monoText(lit, "482 913", { align: "center", cx: 90, y: 156, h: 50, size: 30, role: "label", weight: 700, color: "ink" });
      phone.lit = lit; phone.codeText = code;
      phone.__lit = false; phone.__dim = false;
      phone.light = (t) => { fade(lit, 0, 1, t, 0.35, "phone", "phone.lit"); phone.__lit = true; return t + 0.35; };
      phone.dark = (t) => { fade(lit, 1, 0, t, 0.3, "phone", "phone.lit"); phone.__lit = false; return t + 0.3; };
      phone.dim = (t, on) => { const a = on ? 1 : 0.4, b = on ? 0.4 : 1; fade(phone.life, a, b, t, 0.4, "phone", "phone.dim"); phone.__dim = !!on; return t + 0.4; };
      kit.line(g, -20, 340, 200, 340, { stroke: "line", sw: 2 });
    }

    // ---------------------------------------------------------------- door (x 1460 y 330 w 300 h 550) and its plate
    const door = ctx.el("door", { x: 1460, y: 330, w: 300, h: 550, kind: "object", real: "door", exit: "recede" });
    {
      const g = door.inner;
      // @form hinged_door: a door in thin strokes whose leaf swings open on its hinge to show a lit doorway
      const inside = Loom.svg("g", {}, g);
      kit.rect(inside, 12, 12, 276, 538, { fill: "shadow", r: 2, shadow: false, crisp: true });
      const lit = Loom.svg("rect", { x: 12, y: 12, width: 276, height: 538, fill: S.c("ink"), opacity: 0 }, inside);     // light through the doorway
      const glow = Loom.svg("rect", { x: 12, y: 12, width: 276, height: 538, fill: S.c("accent2"), opacity: 0 }, inside); // the accent, while it opens
      // the leaf, hinged on its left edge (x 14)
      const leaf = Loom.svg("g", {}, g);
      kit.rect(leaf, 14, 14, 272, 536, { fill: "surface", stroke: "line", sw: 2, r: 2, shadow: false });
      Loom.svg("rect", { x: 40, y: 40, width: 220, height: 170, rx: 2, fill: "none", stroke: S.c("line"), "stroke-width": 1.5, opacity: 0.55 }, leaf);
      Loom.svg("rect", { x: 40, y: 360, width: 220, height: 160, rx: 2, fill: "none", stroke: S.c("line"), "stroke-width": 1.5, opacity: 0.55 }, leaf);
      // the lock band (station y 560 to 660)
      Loom.svg("rect", { x: 14, y: 230, width: 272, height: 100, fill: S.c("surface2") }, leaf);
      kit.line(leaf, 14, 230, 286, 230, { stroke: "line", sw: 1.5 });
      kit.line(leaf, 14, 330, 286, 330, { stroke: "line", sw: 1.5 });
      Loom.svg("rect", { x: 258, y: 350, width: 9, height: 44, rx: 4.5, fill: S.c("muted") }, leaf);   // handle
      // hinges
      [60, 480].forEach((y) => Loom.svg("rect", { x: 8, y, width: 10, height: 30, rx: 2, fill: S.c("line") }, g));
      // the frame (its rim recolours to pos while the door is open)
      const rim = Loom.svg("rect", { x: 2, y: 2, width: 296, height: 548, rx: 3, fill: "none", stroke: S.c("line"), "stroke-width": 4 }, g);
      kit.line(g, -30, 550, 330, 550, { stroke: "line", sw: 2 });
      door.leaf = leaf; door.rim = rim; door.glow = glow; door.lit = lit;
      door.band = { x: 1474, y: 560, w: 272, h: 100 };
      door.isOpen = false;
      const lineCol = S.c("line"), posCol = S.c("pos");
      const mixHex = (a, b, e) => S.mix ? S.mix(a, b, e) : (e < 0.5 ? a : b);
      door.swing = (t, open, o) => {
        o = o || {};
        const dur = o.dur || 0.6;
        const from = door.isOpen ? 1 : 0, to = open ? 1 : 0;
        Loom.drive((e) => {
          const k = from + (to - from) * e;
          // the leaf turns toward the viewer: it narrows about the hinge and its free edge reads nearer
          leaf.setAttribute("transform", `translate(14 0) scale(${(1 - 0.84 * k).toFixed(4)} 1) translate(-14 0)`);
          leaf.setAttribute("opacity", (1 - 0.15 * k).toFixed(3));
          rim.setAttribute("stroke", mixHex(lineCol, posCol, k));
          lit.setAttribute("opacity", (0.09 * k).toFixed(3));
        }, t, dur, open ? "enter" : "move", { kind: "state", beat: Loom.ctxBeat && Loom.ctxBeat.id, name: "door", key: "door.leaf", content: true });
        door.isOpen = !!open;
        return t + dur;
      };
    }
    // @form name_plate_tag: a tag hung above a thing, naming it by its address
    const plate = Loom.treat.label(ctx, "door_plate", { x: 1610, y: 278, text: "login.yourwork.example", tone: "surface", role: "label" });
    void plate;

    // ---------------------------------------------------------------- the line (laptop port -> door), with the phone's feeder
    const line = ctx.el("line", { x: 560, y: 500, w: 900, h: 240, kind: "scenery", exit: "recede" });
    const mainD = "M 575 515 H 830 V 720 H 1440";
    {
      const g = Loom.svg("g", { transform: "translate(-560 -500)" }, line.inner);   // draw in station coords
      // @form route_line_ticks: a thin route line with small direction ticks and a junction dot
      const main = Loom.svg("path", { d: mainD, fill: "none", stroke: S.c("line"), "stroke-width": 3, "stroke-linejoin": "round" }, g);
      const feed = Loom.svg("path", { d: "M 810 720 H 830", fill: "none", stroke: S.c("line"), "stroke-width": 3 }, g);
      const ticks = Loom.svg("g", { opacity: 0 }, g);
      for (let x = 900; x <= 1380; x += 80) Loom.svg("path", { d: `M ${x - 5} 711 L ${x + 4} 720 L ${x - 5} 729`, fill: "none", stroke: S.c("muted"), "stroke-width": 2, opacity: 0.6 }, ticks);
      const dot = Loom.svg("circle", { cx: 830, cy: 720, r: 6, fill: S.c("line"), opacity: 0 }, g);
      Loom.svg("circle", { cx: 575, cy: 515, r: 5, fill: S.c("line") }, g);   // the laptop's port
      line.main = main; line.mainD = mainD; line.port = [575, 515]; line.join = [830, 720]; line.end = [1440, 720];
      line.ticks = ticks; line.dot = dot; line.feed = feed;
      const tLine = t0 + 0.35;
      m.draw(main, tLine, { dur: 0.85 });
      m.draw(feed, tLine + 0.45, { dur: 0.2 });
      fade(dot, 0, 1, tLine + 0.45, 0.2, "line");
      fade(ticks, 0, 1, tLine + 0.75, 0.4, "line");
      line.revealT = tLine;
    }

    // ---------------------------------------------------------------- composed from frame 0: the structure settles
    [laptop, screen, phone, door].forEach((E, i) => {
      Loom.tween(E.inner, { y: 10 }, { y: 0, duration: 0.6, ease: Loom.ease.enter }, t0 + i * 0.05, { kind: "settle", beat: B, name: E.name });
      E.revealT = t0;
    });

    // ---------------------------------------------------------------- type, press
    const tTyped = m.typeInto(screen.page.field, "••••••••••", tType, { cps: 20, lead: 0.15, hold: 0.3 });
    fade(screen.page.placeholder, 1, 0, tType - 0.02, 0.08, "screen");
    const tPress = Math.max(tTyped + 0.12, tPw - 0.3);
    {
      const b = screen.page.button;
      Loom.drive((e, raw) => {
        const k = raw < 0.3 ? raw / 0.3 : 1 - (raw - 0.3) / 0.7;
        const s = 1 - 0.05 * Math.max(0, Math.min(1, k));
        b.g.setAttribute("transform", `translate(${b.cx} ${b.cy}) scale(${s.toFixed(4)}) translate(${-b.cx} ${-b.cy})`);
      }, tPress, 0.34, "linear", { kind: "gesture", beat: B, name: "screen" });
      Loom.sfx("click", tPress);
    }

    // ---------------------------------------------------------------- the password travels
    const pw = chip("pw_chip", "password");
    const tDep = Math.max(tPress + 0.2, tPw);
    // stops along the run (mainD continued into the doorway: 255 + 205 + 810 = 1270 px); the chip waits with its
    // nose at the door, then goes in when the door opens
    const Lp = 255 + 205 + 810;
    const fAtX = (x) => (255 + 205 + (x - 830)) / Lp;          // a point on the long straight run, by its x
    const pwRest = fAtX(1440 - pw.cw / 2 - 6);
    const tArr = tDep + 1.2;
    const tInto = tIn + 0.15;
    m.reveal(pw, tDep - 0.18, { dy: 0, dur: 0.2 });
    run(pw, mainD + " H 1640", [[tDep, 0], [tArr, pwRest], [tInto, pwRest], [tInto + 0.5, fAtX(1620)]]);
    fade(pw.rim, 0, 1, tDep, 0.25, "pw_chip");
    Loom.sfx("whoosh", tDep);

    // ---------------------------------------------------------------- the site asks: a pulse back to the phone, the phone lights
    const pulse = ctx.el("ask_pulse", { x: 0, y: 0, w: 16, h: 16, kind: "token", exit: "recede" });
    Loom.svg("circle", { cx: 8, cy: 8, r: 7, fill: S.c("muted") }, pulse.inner);
    pulse.cw = 16; pulse.ch = 16;
    const tPulse = Math.max(tAsk, tArr + 0.05);
    m.reveal(pulse, tPulse, { dy: 0, dur: 0.12 });
    run(pulse, "M 1440 720 H 810", [[tPulse, 0], [tPulse + 0.6, 1]]);
    m.exit(pulse, tPulse + 0.62, "recede");
    const tLit = phone.light(tPulse + 0.62);
    Loom.sfx("tick", tPulse + 0.62);

    // ---------------------------------------------------------------- the code rises from the phone and follows
    const code = chip("code_chip", "code");
    const tCodeDep = Math.max(tCode, tLit + 0.1);
    const codeD = "M 720 700 V 720 H 1640";
    const codeLen = 20 + (1640 - 720);
    const codeRest = (20 + (1440 - pw.cw - 18 - code.cw / 2 - 720)) / codeLen;
    m.reveal(code, tCodeDep - 0.2, { dy: 12, dur: 0.3 });
    run(code, codeD, [[tCodeDep, 0], [tCodeDep + 1.2, codeRest], [tInto + 0.08, codeRest], [tInto + 0.58, (20 + (1630 - 720)) / codeLen]]);
    fade(pw.rim, 1, 0, tCodeDep, 0.25, "pw_chip");
    fade(code.rim, 0, 1, tCodeDep, 0.25, "code_chip");
    Loom.sfx("whoosh", tCodeDep);

    // ---------------------------------------------------------------- you are in: the door opens, the chips go in and fade
    door.swing(tIn, true, { dur: 0.6 });
    fade(door.glow, 0, 0.14, tIn, 0.45, "door", "door.glow");
    fade(door.glow, 0.14, 0, tInto + 0.6, 0.45, "door", "door.glow");   // the accent leaves; the doorway stays lit
    fade(code.rim, 1, 0, tIn, 0.25, "code_chip");
    Loom.sfx("success", tIn + 0.05);
    m.exit(pw, tInto + 0.35, "recede");
    m.exit(code, tInto + 0.45, "recede");
    phone.dark(tInto + 0.5);
    void tTyped;
  },
});
