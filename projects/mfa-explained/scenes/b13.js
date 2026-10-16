// @design sealed_signer_cutaway: a window opens in a device to show a sealed key that answers a challenge without moving, while everything else travels
/* b13 - The site sends a fresh challenge. Your device signs it. The secret never leaves.
 *
 * Treatments considered:
 *   (A) static composition + signalling: the phone with a key icon and three labels (challenge, signed, stays)
 *       (rejected: "the secret never leaves" is a claim about MOVEMENT; a still cannot show something staying
 *       put while the exchange happens around it).
 *   (B) cut to a full-frame diagram of public-key signing (rejected: crypto vocabulary for a non-technical
 *       audience, and it leaves the bench every run is compared on).
 *   (C) CHOSEN: on the held bench, a cyan challenge chip leaves the door and travels the line to the phone; a
 *       round cutaway opens in the phone on a sealed compartment holding a key; the chip enters the window, a
 *       seal is pressed onto it (the key does not move), and the signed answer travels back; the door opens.
 *       The key is still in its compartment at the end, tagged "stays here".
 * Rules taken (docs/primitives/magnify.md: a cutaway when the inside is the point and the outside stays on screen;
 * TED-Ed conclusions: a cutaway per claim): the cutaway's source is the phone and the window sits inside the
 * phone's rect; the passkey's cyan (accent) enters here and only here (value script), on the chip, then the seal,
 * then the key; no crypto words, no hex.
 * Continuity: holds laptop, phone, line, door, door_plate, run_slot, tally (kept through b11, b12). Creates
 * screen (the real page again) and phone_vault (kept by b14, held by b15). The answer chip ends AT the door.
 */
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, T = Loom.treat;
    const B = ctx.beat.id;
    const mono = S.font("mono").family;
    ctx.held("laptop"); ctx.held("line"); ctx.held("door_plate"); ctx.held("tally");
    const phone = ctx.held("phone"), door = ctx.held("door"), rs = ctx.held("run_slot");

    const tSend = ctx.cue("The site sends a fresh challenge");
    const tSigns = ctx.cue("Your device signs it");
    const tSeal = ctx.cue("signs");
    const tLeave = ctx.cue("The secret never leaves");
    const tNever = ctx.cue("never leaves");

    // the door resets shut while the veil lifts (it was left open for the thief in run three)
    if (door && door.swing && door.isOpen) door.swing(ctx.start + 0.05, false, { dur: 0.4 });

    /* ---------------- the run label and the real page ---------------- */
    if (rs && rs.slot) rs.slot.relabel("A PASSKEY SIGN-IN", tSend);
    const screen = ctx.el("screen", { x: 150, y: 495, w: 410, h: 255, kind: "card", exit: "recede" });
    {
      const g = screen.inner;
      // @form signin_page: a product-neutral sign-in page with an address line, a title and one action button
      kit.rect(g, 0, 0, 410, 255, { fill: "surface", r: 4, shadow: false, crisp: true });
      kit.rect(g, 0, 0, 410, 44, { fill: "surface2", r: 4, shadow: false, crisp: true });
      kit.rect(g, 14, 15, 12, 10, { fill: "muted", r: 2, shadow: false, crisp: true });
      kit.path(g, "M 16.5 15 V 12 A 3.5 3.5 0 0 1 23.5 12 V 15", { stroke: "muted", sw: 2 });
      const addr = "login.yourwork.example";
      const aw = Math.ceil(kit.measure(addr, "mono", 24, 400)) + 4;
      const at = kit.text(g, addr, { role: "label", size: 24, x: 36, y: 4, w: aw, h: 36, valign: "middle", maxLines: 1, color: "muted" });
      at.setAttribute("font-family", mono); at.setAttribute("font-weight", 400);
      kit.text(g, "Sign in", { role: "lead", size: 34, x: 24, y: 52, w: 360, h: 48, maxLines: 1, weight: 700, valign: "middle" });
      screen.page = { button: Loom.ui.button(ctx, g, { x: 24, y: 128, label: "Sign in with a passkey", h: 52, w: 362, fill: "line" }) };
    }
    // swap onto the empty screen: fades in, rising from 18 px (the old page left with run three)
    Loom.tween(screen.inner, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: ctx.style.dur("enter"), ease: Loom.ease.enter }, tSend + 0.15, { kind: "swap", beat: B, name: "screen", content: true });
    screen.revealT = tSend + 0.15; screen.revealKind = "swap";

    /* ---------------- the cutaway: a sealed compartment inside the phone, with its key ---------------- */
    const W = { x: 720, y: 700, r: 72 };
    let keyG = null, compG = null;
    const vault = Loom.magnify.cutaway(ctx, "phone_vault", {
      source: phone, shape: "circle", win: W, t: tSigns, inside: "field2",
      reveal: (g) => {
        // @form sealed_compartment: a small double-walled compartment holding one key that never leaves it
        compG = Loom.svg("g", {}, g);
        kit.rect(compG, 664, 704, 112, 54, { fill: "field", r: 6, stroke: "accent", sw: 2.5, shadow: false, crisp: true });
        kit.rect(compG, 670, 710, 100, 42, { fill: "none", r: 4, stroke: "accent", sw: 1, opacity: 0.6, shadow: false, crisp: true });
        keyG = Loom.svg("g", {}, compG);
        Loom.svg("circle", { cx: 692, cy: 731, r: 10, fill: "none", stroke: S.c("accent"), "stroke-width": 4 }, keyG);
        Loom.svg("path", { d: "M 702 731 H 754 M 744 731 V 741 M 752 731 V 739", fill: "none", stroke: S.c("accent"), "stroke-width": 4, "stroke-linecap": "round" }, keyG);
      },
    });
    vault.E.key = keyG; vault.E.compartment = compG; vault.E.win = W;

    // the key's own address, hung on the compartment like the door's plate
    const tLanded = vault.landed;
    const vtag = T.label(ctx, "vault_tag", { x: 1068, y: 600, text: "login.yourwork.example", tone: "surface", role: "label", to: [778, 668], t: tLanded - 0.1 });
    void vtag;

    /* ---------------- the chips: a challenge in, a signed answer out ---------------- */
    // @form challenge_chip: a small outlined pill holding a row of dots of varying size, named by a word above it
    const mkChip = (name, word, sealed) => {
      const F = kit.fit(word, { role: "label", w: 220, maxLines: 1, weight: 700, size: 24 });
      const pw = 112, ph = 38, lh = Math.ceil(F.height), w = Math.max(pw, Math.ceil(F.width) + 8), h = lh + 6 + ph;
      const E = ctx.el(name, { x: 0, y: 0, w, h, kind: "token", exit: "recede" });
      const lab = Loom.svg("g", {}, E.inner);
      kit.text(lab, word, { role: "label", size: F.size, x: 0, y: 0, w, h: lh, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "accent" });
      const px = (w - pw) / 2, py = lh + 6;
      kit.rect(E.inner, px, py, pw, ph, { fill: "field", r: ph / 2, stroke: "accent", sw: 3, shadow: false, crisp: true });
      const rng = Loom.rng("mfa-b13-dots");
      for (let i = 0; i < 6; i++) Loom.svg("circle", { cx: px + 18 + i * 15.2, cy: py + ph / 2, r: (2.4 + rng() * 3.2).toFixed(2), fill: S.c("accent") }, E.inner);
      let seal = null;
      if (sealed) {
        // @form seal_mark: a round seal pressed onto a chip, its rim and a tick
        seal = Loom.svg("g", {}, E.inner);
        Loom.svg("circle", { cx: px + pw - 4, cy: py + 4, r: 15, fill: S.c("accent"), stroke: S.c("field"), "stroke-width": 3 }, seal);
        Loom.svg("path", { d: `M ${px + pw - 11} ${py + 4} l 5 5 l 9 -10`, fill: "none", stroke: S.c("field"), "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }, seal);
      }
      E.lab = lab; E.seal = seal; E.cw = w; E.cy = py + ph / 2;
      return E;
    };
    const ch = mkChip("challenge_chip", "challenge", false);
    const an = mkChip("answer_chip", "signed", true);
    // one drive per chip moves its pill centre along a path through keyed stops (seek-safe)
    const run = (E, d, keys) => {
      const p = Loom.svg("path", { d, fill: "none", stroke: "none" }, ctx.g);
      const L = p.getTotalLength(), t0 = keys[0][0], t1 = keys[keys.length - 1][0], ease = Loom.ease.editorial;
      Loom.drive((e, raw) => {
        const now = t0 + raw * (t1 - t0);
        let f = keys[keys.length - 1][1];
        for (let i = 0; i < keys.length - 1; i++) {
          const [ta, fa] = keys[i], [tb, fb] = keys[i + 1];
          if (now <= tb) { const u = tb > ta ? Math.max(0, Math.min(1, (now - ta) / (tb - ta))) : 1; f = fa + (fb - fa) * ease(u); break; }
        }
        const pt = p.getPointAtLength(L * f);
        E.mover.setAttribute("transform", `translate(${(pt.x - E.cw / 2).toFixed(2)} ${(pt.y - E.cy).toFixed(2)})`);
      }, t0, Math.max(0.01, t1 - t0), "linear", { kind: "value_travel", beat: B, name: E.name, content: true });
    };
    const fade = (node, a, b, t, dur, name) => Loom.tween(node, { opacity: a }, { opacity: b, duration: dur, ease: b > a ? Loom.ease.enter : Loom.ease.exit }, t, { kind: "recolour", beat: B, name });

    // in: door -> along the line -> waits at the phone -> into the window
    const IN = "M 1440 720 H 880 L 720 676";
    const Lin = 560 + Math.hypot(160, 44);
    const tGo = tSend + 0.7, tAt = tGo + 1.2, tIn0 = Math.max(tSigns + 0.45, tLanded - 0.45), tIn1 = tIn0 + 0.55;
    m.reveal(ch, tSend + 0.45, { dy: 0, dur: 0.25 });
    run(ch, IN, [[tGo, 0], [tAt, 560 / Lin], [tIn0, 560 / Lin], [tIn1, 1]]);
    Loom.sfx("whoosh", tGo);
    m.glow(ch, tAt, { color: "accent", dur: 0.8 });
    fade(ch.lab, 1, 0, tIn0, 0.2, "challenge_chip");            // only the pill fits the window: its word stays outside

    // the seal is pressed on (no overshoot); the challenge becomes the signed answer in the same place
    const tStamp = Math.max(tSeal + 0.2, tIn1 + 0.05);
    m.exit(ch, tStamp, "none");
    fade(ch.inner, 1, 0, tStamp, 0.12, "challenge_chip");
    Loom.set(an.lab, { opacity: 0 }, 0);
    m.reveal(an, tStamp, { dy: 0, dur: 0.12 });
    Loom.tween(an.seal, { opacity: 0, scale: 1.6, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: ctx.style.dur("enter") * 0.7, ease: Loom.ease.enter }, tStamp, { kind: "stamp", beat: B, name: "answer_chip.seal", content: true });
    Loom.sfx("land", tStamp);
    // out: from the window back along the line to the door, where it ends (b14 opens it as a page)
    const OUT = "M 720 676 L 880 720 H 1380";
    const Lout = Math.hypot(160, 44) + 500;
    const tOut0 = Math.max(tLeave, tStamp + 0.6), tOut1 = tOut0 + 1.05;
    run(an, OUT, [[tStamp, 0], [tOut0, 0], [tOut1, 1]]);
    fade(an.lab, 0, 1, tOut0 + 0.3, 0.25, "answer_chip");
    Loom.sfx("whoosh", tOut0);

    /* ---------------- the key stays: tagged, and the door opens for the answer ---------------- */
    if (keyG) {
      const halo = Loom.svg("circle", { cx: 720, cy: 731, r: 46, fill: "none", stroke: S.c("accent"), "stroke-width": 3, opacity: 0 }, vault.inside);
      Loom.drive((e, raw) => { const s = Math.sin(Math.PI * raw); halo.setAttribute("opacity", (0.7 * s).toFixed(3)); halo.setAttribute("r", (40 + 8 * s).toFixed(2)); }, tNever, 0.9, "linear", { kind: "gesture", beat: B, name: "phone_vault.key" });
    }
    const stay = T.label(ctx, "stays_tag", { x: 950, y: 806, text: "stays here", tone: "accent", role: "label", to: [784, 742], t: tNever + 0.05 });
    void stay;
    if (door && door.swing) { door.swing(tOut1 - 0.05, true, { dur: 0.6 }); Loom.sfx("success", tOut1); }
  },
});
