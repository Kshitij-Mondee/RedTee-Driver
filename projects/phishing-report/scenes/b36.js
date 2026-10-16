// @design split_resolves: one half folds away to the seam and the other widens into the whole frame, the day carrying on
/* b36 - the split resolves. The left half collapses toward the seam (its clip closes on x = 960) while the right half
 * widens into the whole frame (its clip opens to 0..1920 and the world slides left by half a panel, so the glass wall,
 * the windows and the rest of the meeting come into view). Ravi, calm, at his bench: two grey extras walk past behind the
 * glass on "People who fear blame stop reporting", the meeting behind them resumes, and two tags are set quietly beside
 * him on "no panic" and "tell the team". The right half is the element "ravi_set" (text-free); b37 keeps it.
 * Treatments weighed: (A) a cut to a plain desk (rejected: no sense that this was the future that continued),
 * (B) a green tick over the right half (rejected: relief, not a prize), (C) CHOSEN: ordinary life resuming around him.
 */
Loom.scene("b36", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const F = Loom.__ravi && Loom.__ravi.fork;
    if (!F) { Loom.error("b36_needs_b35", "b36 resolves the fork that b34 and b35 build"); return; }
    const held = ["fork_seam", "fork_left", "ravi_set", "tag_deletes", "tag_nothing", "tag_reports", "tag_says", "tag_arrives", "says_bubble"];
    const E = {};
    held.forEach((n) => { E[n] = ctx.held(n); });
    const L = F.L, R = F.R;

    // ---- the words this beat lands on
    const tFold = ctx.cue("Blaming people for clicks"), tFear = ctx.cue("People who fear blame"), tPanic = ctx.cue("no panic"), tTell = ctx.cue("Tell the team");
    const fade = (name, t, d) => { if (E[name]) Loom.tween(E[name].mover, { opacity: 1 }, { opacity: 0, duration: d || 0.5, ease: Loom.ease.exit, immediateRender: false }, t, { kind: "exit", beat: ctx.beat.id, name }); };

    // ---- the left half folds away toward the seam; what belonged to the two futures leaves with it
    Loom.tween(L.clip, { attr: { x: 0, width: 960 } }, { attr: { x: 960, width: 0 }, duration: 1.1, ease: Loom.ease.editorial, immediateRender: false }, tFold, { kind: "collapse", beat: ctx.beat.id, name: "fork_left", content: true });
    ["tag_deletes", "tag_nothing"].forEach((n) => fade(n, tFold, 0.45));
    ["tag_reports", "tag_says", "tag_arrives", "says_bubble"].forEach((n) => fade(n, tFold, 0.5));
    fade("fork_seam", tFold + 0.3, 0.5);
    Loom.sfx("whoosh", tFold + 0.1);

    // ---- the right half widens into the whole frame: the clip opens, the world slides left half a panel
    Loom.tween(R.clip, { attr: { x: 960, width: 960 } }, { attr: { x: 0, width: 1920 }, duration: 1.2, ease: Loom.ease.editorial, immediateRender: false }, tFold, { kind: "reveal", beat: ctx.beat.id, name: "ravi_set", content: true });
    Loom.tween(R.wg, { x: 0 }, { x: -480, duration: 1.2, ease: Loom.ease.editorial }, tFold, { kind: "travel", beat: ctx.beat.id, name: "ravi_set", content: true });

    // ---- the day carries on: two grey extras walk past behind the glass (behind the seated ones), the meeting resumes
    // @form passers_by: grey background figures that walk across behind glass while the main action holds
    const walk = (nm, x, flip, t0, dx, top) => {
      const w = Loom.rig.place(ctx, nm, "extra", { x, y: 686, scale: 0.3, parent: R.wg, top, flip });
      R.wg.insertBefore(w.E.outer, R.seats);
      w.pose("idle", ctx.start, { dur: 0.01 });
      w.walk(t0, t0 + 3.4, dx, 1.7);
      return w;
    };
    walk("passer_a", 540, false, tFear - 0.2, 760, "line");
    walk("passer_b", 2300, true, tFear + 0.5, -720, "muted");
    R.exApis.forEach((ex, i) => { const t = tFear + 0.4 + (i % 4) * 0.35; ex.gesture(i % 2 ? "beat" : "nod", t, t + 1.5); });

    // ---- Ravi, calm: a glance at the meeting behind him, then to us; a nod on "no panic"
    R.ravi.look(-0.7, -0.1, tFear);
    R.ravi.look(0.1, 0.05, tPanic - 0.2);
    R.ravi.emotion("happy", tPanic);
    R.ravi.gesture("nod", tPanic, tPanic + 1.2);
    R.ravi.gesture("nod", tTell, tTell + 1.0);

    // ---- two tags, set quietly beside him
    Loom.data.tag(ctx, "tag_no_panic", { x: 250, y: 500, text: "NO PANIC", color: "pos", textColor: "onAccent", t: tPanic });
    Loom.data.tag(ctx, "tag_tell", { x: 250, y: 574, text: "TELL THE TEAM", color: "accent", textColor: "onAccent", t: tTell });
  },
});
