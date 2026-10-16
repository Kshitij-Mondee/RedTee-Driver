// @design label_received_as_attack: a stamp lands on Dev's chest and his shoulders tense behind a polite smile
/* Treatments: (A) two captions side by side (tells only), (B) static Dev with a tag and arrows,
 * (C) CHOSEN: stamp drops on Dev, shoulders rise, ease, rise again (shows reception). */
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    let dev = null;
    try { dev = ctx.held("dev"); } catch (e) { dev = null; }
    if (!dev) {
      dev = ctx.character("dev", "pip", { x: 960, y: 900, scale: 2.4, emotion: "happy" });
    }
    const E = dev.E || dev;

    // stamp on the chest: a hand-built label, lands with overshoot
    // @form label_stamp: a label about who you are
    const st = ctx.el("label_stamp", { x: 820, y: 520, w: 280, h: 96, kind: "stamp", exit: "recede" });
    kit.pill(st.inner, 0, 0, 280, 96, { fill: "neg" });
    kit.text(st.inner, "Label", { role: "label", x: 0, y: 0, w: 280, h: 96, maxLines: 1, align: "center", valign: "middle", weight: 800, color: S.pickTokenOn("neg") });
    const t1 = ctx.cue("a label about who you are");
    m.pop(st, t1, { overshoot: true });

    // shoulders: tense (rise), ease, tense again, on the narration
    const tAttack = ctx.cue("is often heard as an attack");
    const tNot = ctx.cue("Not always");
    const tBut = ctx.cue("But often");
    const d = ctx.style.dur ? ctx.style.dur("short") : 0.25;
    const tw = (t, y, sc, dur) => Loom.tween(E.life || E.inner, { y: y, scale: sc }, { y: y, scale: sc, duration: dur }, t, { kind: "travel", beat: ctx.beat.id, content: true });
    try {
      tw(tAttack, -26, 1.02, 0.25);
      tw(tNot, -10, 1.0, 0.9);
      tw(tBut, -26, 1.02, 0.4);
    } catch (e) { /* motion unavailable: stamp alone carries the beat */ }
  },
});
