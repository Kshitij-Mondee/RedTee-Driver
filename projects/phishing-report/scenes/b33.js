// @design place_witness_continued: the held room, the camera moves in, and the character's thought is printed as she thinks it
/* b33 - the tempting thought. The room from b32 is held. Ravi pauses (pose think, his eyes drop to the laptop),
 * the camera pushes in on him (Loom.cam.push, the layers move at their depths), a warm key settles on his face, and a
 * thought bubble (Loom.treat.bubble, kind thought, with puffs) opens from him and prints the line as he thinks it:
 * the first half on "I typed nothing", the second on "why tell anyone". Nothing else moves. The bubble is held into b34.
 * Treatments weighed: (A) the line as a caption card (rejected: it is his voice, not ours), (B) an illustrated bust
 * with a bubble (the storyboard's alternative; rejected: we already have him acting in the room), (C) CHOSEN.
 */
Loom.scene("b33", {
  build(ctx) {
    const { m } = ctx;
    const S = Loom.style, T = Loom.treat;
    const svg = (...a) => Loom.svg(...a);
    const R = Loom.__ravi;
    if (!R) { Loom.error("b33_needs_b32", "b33 holds the room that b32 builds"); return; }
    ctx.held("corridor_set");

    const tNothing = ctx.cue("Nothing seemed to happen"), tTyped = ctx.cue("I typed nothing"), tWhy = ctx.cue("why tell anyone");
    const LINE = "I typed nothing, why tell anyone?";

    // ---- Ravi pauses: the think pose, a look down at the laptop, a small frown of attention
    R.ravi.pose("think", tNothing, { dur: 0.8 });
    R.ravi.look(0.25, 0.9, tNothing);
    R.ravi.emotion("focused", tNothing + 0.3);

    // ---- the camera pushes in on Ravi and the screen beside him (parallax: far moves least, near most)
    const push = [560, 620], k = 1.3, t1 = tNothing + 2.4;
    Loom.cam.push(R.P, { to: push, scale: k, t0: tNothing, t1 });
    const cam = Loom.cam.at(R.P, t1 + 0.05);
    const proj = (x, y, d) => { const kk = 1 + (cam.s - 1) * d; return [cam.fx + cam.dx * d + kk * (x - cam.fx), cam.fy + cam.dy * d + kk * (y - cam.fy)]; };
    const head = proj(480, 522, 0.7);                                          // where his head is once the push has settled

    // ---- a warm key settles on him as he thinks: stacked soft rings, no filters
    const glow = ctx.el("key_glow", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    [[330, 0.035], [230, 0.04], [140, 0.05]].forEach(([r, op]) => svg("ellipse", { cx: head[0], cy: head[1] + 40, rx: r, ry: r * 1.25, fill: S.c("accent"), opacity: op }, glow.inner));
    m.reveal(glow, tNothing + 0.9, { dy: 0, dur: 1.4 });

    // ---- the thought bubble: opens from his head, prints the line in two breaths
    const bx = head[0] + 70, by = head[1] - 270;
    // @form thought_bubble_printed: a thought cloud that opens from a head and prints its line in two breaths on the words
    const bub = T.bubble(ctx, "thought_bubble", { x: bx, y: by, w: 560, text: LINE, kind: "thought", as: "cloud", fill: "ink", role: "body", maxLines: 3,
      tail: [head[0] + 10, head[1] - 72], t: tTyped });
    const tx = bub.inner.querySelector("text");
    const spans = Array.from(tx.querySelectorAll("tspan"));
    const full = spans.length ? spans.map((s) => s.textContent) : [tx.textContent];
    const total = full.reduce((a, s) => a + s.length, 0);
    const half = Math.round(total * 0.47);                                     // "I typed nothing," is about the first half
    const tEnd = Math.min(tWhy + 1.3, ctx.speechEnd - 0.1);
    const stops = [[tTyped, 0], [tTyped + 1.0, half], [tWhy, half], [tEnd, total]];
    Loom.drive((e, raw) => {
      const now = tTyped + raw * (tEnd - tTyped);
      let n = 0;
      for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i], b = stops[i + 1];
        if (now >= a[0] && now <= b[0]) n = a[1] + (b[1] - a[1]) * (b[0] > a[0] ? (now - a[0]) / (b[0] - a[0]) : 1);
        else if (now > b[0]) n = b[1];
      }
      n = Math.round(n);
      if (spans.length) spans.forEach((s, i) => { const k0 = Math.max(0, Math.min(full[i].length, n)); s.textContent = full[i].slice(0, k0); n -= full[i].length; });
      else tx.textContent = full[0].slice(0, n);
    }, tTyped, tEnd - tTyped, "linear", { kind: "typewriter", beat: ctx.beat.id, content: true });
    Loom.sfx("tick", tTyped + 0.3);

    Loom.__ravi.bubble = bub;
    Loom.__ravi.head33 = head;
  },
});
