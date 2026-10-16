// @design relay_under_lens: a lens on a middleman shows each item entering one side and leaving the other while it still works, then the gate opens for someone else
/* b10 - Yes. The fake page passes each one on, while the code is still valid. The door opens, for them.
 *
 * Treatments considered:
 *   (A) a sequence diagram: you -> fake page -> real site, arrows labelled password and code (rejected: the formal
 *       picture after the viewer has already seen the bench; and it cannot show "while it is still valid").
 *   (B) static composition + signalling: the box turns red, a caption "relayed in real time" (rejected: the
 *       relay is a TIMING claim, each item passes through while it still works; a still cannot show "before it
 *       expires").
 *   (C) CHOSEN: the answer, finding first. The fill join opens on the bench with the veil gone; on "Yes" the
 *       frozen chips move again into the look-alike box; on "fake page" the disguise drops (outline to the threat
 *       colour) and a lens opens on the box: the password goes in one side and straight out the other to the
 *       real door; the code does the same with its validity bar visibly not empty. The door opens; the open
 *       route runs from the door back to the box, not to your laptop. ACCEPTED, tally cell 3.
 * Rules taken (docs/primitives/magnify.md: the lens is a LIVE copy, so the chips are seen passing inside it;
 * docs/primitives/material.md: the fill join grows from the box's rect; TED-Ed conclusions: a dark beat for the key
 * mechanism): accent3 is the value-script break, held only by the exposed box and the route; accent2 rides the lens
 * ring, then the validity bar. The bar has no number (no invented expiry time).
 * Continuity: holds laptop, fake_screen, phone, line, door, door_plate, run_slot, tally, lock_know, lock_have,
 * fake_box, pw_token, code_token. Only laptop, phone, line, door, door_plate, run_slot, tally go on to b11.
 */
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, T = Loom.treat;
    const B = ctx.beat.id;
    const H = {};
    for (const n of ["laptop", "fake_screen", "phone", "line", "door", "door_plate", "run_slot", "tally", "lock_know", "lock_have", "fake_box", "pw_token", "code_token"]) H[n] = ctx.held(n);
    const { door, tally, line } = H, box = H.fake_box, pw = H.pw_token, code = H.code_token;

    const tYes = ctx.cue("Yes");
    const tPass = ctx.cue("The fake page passes each one on");
    const tFake = ctx.cue("fake page");
    const tValid = ctx.cue("while the code is still valid");
    const tDoor = ctx.cue("The door opens");
    const tOpens = ctx.cue("opens");
    const tThem = ctx.cue("for them");
    const tCover = ctx.start + 0.1;                      // under the fill join's opaque middle

    /* ---------------- the chips: centre positions, and one keyed run along the relay path each ---------------- */
    const centreOf = (E, fx, fy) => {
      if (E && E.__c) return E.__c;
      if (E && E.__pos && E.cw) return [E.__pos.x + E.cw / 2, E.__pos.y + E.ch / 2];
      return [fx, fy];
    };
    const relay = (E, c0, keys) => {
      if (!E) return;
      const cw = E.cw || E.w, ch = E.ch || E.h;
      const d = `M ${c0[0]} ${c0[1]} L 1000 720 H 1440 L 1600 720`;
      const p = Loom.svg("path", { d, fill: "none", stroke: "none" }, ctx.g);
      const L = p.getTotalLength(), t0 = keys[0][0], t1 = keys[keys.length - 1][0], ease = Loom.ease.editorial;
      const at = (x) => { // fraction of the path at a given x on the straight run
        const lead = Math.hypot(1000 - c0[0], 720 - c0[1]);
        return Math.min(1, (lead + Math.max(0, x - 1000)) / L);
      };
      const ks = keys.map(([t, x]) => [t, x === "start" ? 0 : at(x)]);
      Loom.drive((e, raw) => {
        const now = t0 + raw * (t1 - t0);
        let f = ks[ks.length - 1][1];
        for (let i = 0; i < ks.length - 1; i++) {
          const [ta, fa] = ks[i], [tb, fb] = ks[i + 1];
          if (now <= tb) { const u = tb > ta ? Math.max(0, Math.min(1, (now - ta) / (tb - ta))) : 1; f = fa + (fb - fa) * ease(u); break; }
        }
        const pt = p.getPointAtLength(L * f);
        E.mover.setAttribute("transform", `translate(${(pt.x - cw / 2).toFixed(2)} ${(pt.y - ch / 2).toFixed(2)})`);
      }, t0, Math.max(0.01, t1 - t0), "linear", { kind: "value_travel", beat: B, name: E.name, content: true });
    };
    const pwC = centreOf(pw, 900, 720), codeC = centreOf(code, 950, 720);
    const pwW = (pw && (pw.cw || pw.w)) || 150, codeW = (code && (code.cw || code.w)) || 100;

    // the code's validity bar: a thin bar under the code chip that drains, no number (accent2)
    let bar = null;
    if (code) {
      const cw = code.cw || code.w, ch = code.ch || code.h;
      // @form validity_bar: a thin bar on a token that drains as its time runs out, never shown empty here
      const track = Loom.svg("rect", { x: 6, y: ch + 7, width: cw - 12, height: 7, rx: 3.5, fill: S.c("surface2"), stroke: S.c("line"), "stroke-width": 1, opacity: 0 }, code.inner);
      bar = Loom.svg("rect", { x: 6, y: ch + 7, width: cw - 12, height: 7, rx: 3.5, fill: S.c("accent2"), opacity: 0 }, code.inner);
      Loom.tween([track, bar], { opacity: 0 }, { opacity: 1, duration: 0.2, ease: Loom.ease.enter }, tCover, { kind: "reveal", beat: B, name: "validity_bar", content: true });
      Loom.drive((e) => bar.setAttribute("width", ((cw - 12) * (1 - 0.66 * e)).toFixed(2)), tCover, 85.1 - tCover > 1 ? (tValid + 1.5) - tCover : 5, "linear", { kind: "drain", beat: B, name: "validity_bar", content: true });
    }

    /* ---------------- Yes: the frozen chips move again, into the box's left side ---------------- */
    const tPwIn = tYes + 0.55, tPwOut0 = tPass + 0.9, tPwDoor = tPwOut0 + 1.4;
    relay(pw, pwC, [[tYes, "start"], [tPwIn, 1000 + pwW / 2 + 8], [tPwOut0, 1000 + pwW / 2 + 8], [tPwDoor, 1440 - pwW / 2 - 4], [tDoor + 0.15, 1440 - pwW / 2 - 4], [tDoor + 0.65, 1590]]);
    const tCdIn = tYes + 0.7, tCdOut0 = tValid, tCdDoor = tCdOut0 + 1.4;
    relay(code, codeC, [[tYes + 0.1, "start"], [tCdIn, 1000 + codeW / 2 + 4], [tCdOut0, 1000 + codeW / 2 + 4], [tCdDoor, 1440 - pwW - codeW / 2 - 14], [tDoor + 0.22, 1440 - pwW - codeW / 2 - 14], [tDoor + 0.72, 1580]]);
    Loom.sfx("whoosh", tYes);

    /* ---------------- fake page: the disguise drops, the lens opens on the box ---------------- */
    if (box) Loom.hold.heat([box], tFake, { from: "line", to: "accent3", attr: "stroke", dur: 0.5 });
    const src = (box && box.outer.parentNode) || (pw && pw.outer.parentNode) || null;
    const mg = Loom.magnify(ctx, "relay", { source: src, focus: { x: 1130, y: 720, r: 110 }, at: { x: 1130, y: 290, r: 190 }, ring: "accent2", t: tPass + 0.05, dur: 1.0 });
    Loom.sfx("whoosh", tPwOut0);
    // the password reaches the door: the knowledge lock opens; then the code, while still valid: the other lock
    if (H.lock_know && H.lock_know.open) H.lock_know.open(tPwDoor);
    if (H.lock_have && H.lock_have.open) H.lock_have.open(tCdDoor);
    Loom.sfx("whoosh", tCdOut0);

    /* ---------------- the door opens, for them ---------------- */
    mg.exit(tDoor);
    if (door && door.swing) door.swing(tDoor, true, { dur: 0.6 });
    Loom.sfx("success", tDoor + 0.05);
    if (pw) m.exit(pw, tDoor + 0.6, "recede");
    if (code) m.exit(code, tDoor + 0.7, "recede");
    // @form open_route: a thick threat-coloured line drawn from a gate back to the one it now serves
    const route = ctx.el("open_route", { x: 1270, y: 700, w: 180, h: 40, kind: "connector", exit: "recede" });
    const rp = kit.path(route.inner, "M 176 20 H 6", { stroke: "accent3", sw: 9 });
    m.draw(rp, tOpens + 0.1, { dur: 0.5 });
    route.revealT = tOpens + 0.1;
    // @form verdict_stamp: a tilted, double-ruled verdict word stamped on the thing that was judged
    const st = T.label(ctx, "door_stamp", { x: 1610, y: 780, text: "ACCEPTED", tone: "neg", role: "lead", as: "stamp" });
    m.stamp(st, tThem - 0.1);
    Loom.sfx("land", tThem - 0.1);
    if (tally && tally.verdict) tally.verdict(2, "ACCEPTED", "neg", tThem + 0.25);
    void line;
  },
});
