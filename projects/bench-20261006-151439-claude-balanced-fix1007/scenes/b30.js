// @design second_marker_linked: a second marker lands after the first and a thin line joins them
/* Treatments: (A) static calendar with both markers (rejected: no build), (B) text card (rejected: phrase not object),
 * (C) CHOSEN: marker drops, label prints, line draws into it, one pulse. */
Loom.scene("b30", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    let base = null;
    try { base = ctx.held("next_meeting_marker"); } catch (e) { base = null; }
    try { ctx.held("wall_calendar"); } catch (e) {}
    try { ctx.held("action_text"); } catch (e) {}

    // talk-after marker: lands right of the meeting marker
    const mx = 1480, my = 520, mw = 300, mh = 150;
    const tDrop = ctx.cue("agree a way to check back");
    const tLabel = ctx.cue("let's talk after it");
    const tLine = ctx.cue("More likely to be remembered");
    const tPulse = ctx.cue("and noticed");

    // link line first (target drawn later by timing): from request marker to talk marker
    const link = ctx.el("link_line", { x: 1180, y: my + mh / 2 - 6, w: mx - 1180, h: 12, kind: "connector", exit: "recede" });
    const a = kit.arrow(link.inner, 0, 6, mx - 1180 - 8, 6, { color: "ink", width: 4 });
    m.draw(a, tLine, { dur: 0.7 });

    const T = ctx.el("talk_after_marker", { x: mx, y: my, w: mw, h: mh, kind: "token", exit: "recede" });
    // @form calendar_marker: second flag marker
    kit.rect(T.inner, 0, 0, mw, mh, { fill: "accent", r: 24 });
    const lab = ctx.el("talk_after_label", { x: mx + 10, y: my + 10, w: mw - 20, h: mh - 20, kind: "text", exit: "recede" });
    kit.text(lab.inner, "talk after it", { role: "label", x: 0, y: 0, w: mw - 20, h: mh - 20, maxLines: 2, align: "center", valign: "middle", weight: 800, color: S.pickTokenOn("accent") });

    m.drop(T, tDrop, { overshoot: true });
    m.unmask(lab, tLabel, { dir: "ltr" });
    m.emphasis(T, tPulse);
    void base;
  },
});
