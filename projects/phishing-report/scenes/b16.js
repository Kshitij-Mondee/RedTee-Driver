// @design lens_over_lines_continued: the held marks lose their colour as the rule is called unreliable, and three spots on the page glow faintly to say where to look next
/* b16 - "Spelling is no longer a reliable sign". The b15 picture is held and changed, never replaced:
 * the magnifier sets down beside the message, the clean ticks cool from pos to muted (Loom.hold.heat) as the rule
 * is called unreliable, two plain tags are set beside them, and on "Look at what it wants from you" three spots
 * on the message (the deadline, the sender row, the link) glow faintly and breathe once, unlabelled.
 * Geometry is b15's (b03's layout, U = 4); the tags stack in the quiet right side of the deadline row.
 */
Loom.scene("b16", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const P = Object.assign({ tags: ["spelling: no longer reliable", "fools even experts"] }, props || {});
    const U = 4, CC = 165, TX = 1200;
    const meta = (name, kind) => ({ kind: kind || "fade", beat: ctx.beat.id, name, content: true });
    const lerp = (a, b, e) => a + (b - a) * e;

    // everything b15 drew stays exactly where it was (held)
    const keep = ["message", "msg_sender", "msg_subject", "msg_deadline", "msg_body", "msg_link", "msg_button",
      "tick_subject", "tick_deadline", "tick_body", "tick_button", "magnifier", "tag_bad_spelling", "tag_lead", "tag_written_perfectly", "tag_written_perfectly.0"];
    const H = {};
    keep.forEach((n) => { H[n] = ctx.held(n); });

    // 1. the magnifier sets down beside the message (low right, tilted at rest)
    const from = [1560, H.tick_button ? H.tick_button.y + 34 : 848], rest = [1770, 630];
    Loom.drive((e) => H.magnifier.mover.setAttribute("transform", `translate(${lerp(from[0], rest[0], e).toFixed(1)} ${lerp(from[1], rest[1], e).toFixed(1)}) rotate(${lerp(0, -16, e).toFixed(2)}) scale(${lerp(1, 0.55, e).toFixed(3)}) translate(${-CC} ${-CC})`),
      ctx.start + 0.15, 1.5, "editorial", meta("magnifier", "travel"));

    // 2. "Spelling is no longer a reliable sign": the ticks cool from pos to muted and the plain tag is set above the first
    const tNo = ctx.cue("no longer");
    Loom.hold.heat(["tick_subject", "tick_deadline", "tick_body", "tick_button"].map((n) => H[n]), tNo, { from: "pos", to: "muted", dur: 2.0, name: "ticks_cool" });
    const tl = kit.fit(P.tags[0], { role: "label", w: 900, maxLines: 1, weight: 800, tracking: 1 });
    const y1 = 430;
    const lead1 = ctx.el("tag_spelling_lead", { x: TX - 90, y: y1 - 12, w: 90, h: 24, kind: "connector" });
    kit.line(lead1.inner, 0, 12, 90, 12, { stroke: "accent4", sw: 4 });
    m.draw(lead1, tNo, { dur: 0.4 });
    Loom.data.tag(ctx, "tag_spelling_unreliable", { x: TX, y: y1 - (tl.height + 19.2) / 2, text: P.tags[0], color: "accent4", t: tNo + 0.1 });

    // 3. "Some phishing fools even experts": a second plain tag below the first two
    const tf = kit.fit(P.tags[1], { role: "label", w: 900, maxLines: 1, weight: 800, tracking: 1 });
    Loom.data.tag(ctx, "tag_fools_experts", { x: TX, y: 610 - (tf.height + 19.2) / 2, text: P.tags[1], color: "accent3", t: ctx.cue("fools even experts") });

    // 4. "Look at what it wants from you": three faint glows, unlabelled, breathing once on the message
    const tLook = ctx.cue("Look at what it wants");
    const spots = [
      ["glow_deadline", 24 * U - 28, 111 * U - 28, 0, 0],
      ["glow_sender", 24 * U - 28, 33 * U - 28, 560 * 1, 24 * U + 56],
      ["glow_link", 24 * U - 28, 221 * U - 36, 120 * U + 56, 5 * U + 72],
    ];
    const dd = H.msg_deadline;
    spots[0][3] = dd.w + 56; spots[0][4] = dd.h + 56;
    spots.forEach(([name, x, y, w, h], i) => {
      const G = ctx.el(name, { x, y, w, h, kind: "light" });
      kit.rect(G.inner, 0, 0, w, h, { fill: "accent", r: 20, flat: true, crisp: true, opacity: 0.08 });
      for (let k = 0; k < 3; k++) Loom.svg("rect", { x: k * 6, y: k * 6, width: w - k * 12, height: h - k * 12, rx: 20 - k * 3, fill: "none", stroke: Loom.style.c("accent"), "stroke-width": 5 - k, opacity: (0.4 - k * 0.12).toFixed(2) }, G.inner);
      const t0 = tLook + i * 0.3;
      Loom.tween(G.inner, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: Loom.ease.enter }, t0, meta(name));
      G.revealT = t0;
      Loom.hold.breathe(G, t0 + 0.7, ctx.end - 0.25, { amp: 0.018, period: 2.4 });
    });
  },
});
