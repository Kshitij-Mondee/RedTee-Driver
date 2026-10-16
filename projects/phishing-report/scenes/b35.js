// @design split_futures_continued: the waiting half lights; the cause travels and arrives, and the same screen settles
/* b35 - the other path. The right panel (the element "ravi_set", built dim in b34) lights. Ravi taps the report
 * button on his laptop; a speech bubble opens from him and holds what he clicked, shown not written (the notice and a
 * pointer). The report light leaves his desk and travels up the dashed path (m.along) while the path fills behind it;
 * the security lamp comes on as it arrives, in time. His screen settles from the alert colour to a calm handled one
 * (Loom.hold.heat accent2 to pos): relief, not victory. The left panel stays as it was, a little darker.
 * Treatments weighed: (A) a green tick on a card (rejected: states the result without the cause), (B) a counter of
 * warnings (rejected: one person, one report), (C) CHOSEN: the light's journey, because arriving in time is the lesson.
 */
Loom.scene("b35", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (...a) => Loom.svg(...a);
    const col = (t) => S.c(t);
    const keep = (E) => { E.exit = "none"; return E; };
    const flat = (g, x, y, w, h, fill, o) => kit.rect(g, x, y, w, h, Object.assign({ fill, r: 0, flat: true, shadow: false }, o || {}));
    const F = Loom.__ravi && Loom.__ravi.fork;
    if (!F) { Loom.error("b35_needs_b34", "b35 lights the right panel that b34 builds"); return; }
    ["fork_seam", "fork_left", "ravi_set", "tag_deletes", "tag_nothing"].forEach((n) => ctx.held(n));
    const L = F.L, R = F.R;

    // ---- the words this beat lands on
    const tOther = ctx.cue("On the other"), tReports = ctx.cue("he reports it at once"), tSays = ctx.cue("says what he clicked");
    const tWarn = ctx.cue("The warning arrives"), tTime = ctx.cue("in time to limit the harm");

    // ---- the right half lights while the left sinks a little
    Loom.tween(R.dim.inner, { opacity: 0.6 }, { opacity: 0, duration: 1.2, ease: Loom.ease.editorial }, tOther, { kind: "reveal", beat: ctx.beat.id, name: "dim_right", content: true });
    Loom.tween(L.dim.inner, { opacity: 0.28 }, { opacity: 0.5, duration: 1.2, ease: Loom.ease.editorial }, tOther, { kind: "exit", beat: ctx.beat.id, name: "dim_left", content: true });
    R.ravi.look(0.8, 0.4, tOther);

    // ---- he presses the report button: a pointer comes from the notice to the button and taps on "reports it at once"
    const bx = R.LX + 236 + 60, by = R.LY + 150 + 26;
    const C = Loom.ui.cursor(ctx, { x: R.LX + 150, y: R.LY + 150, name: "cursor_report" });
    R.wg.appendChild(C.outer); keep(C);
    m.cursorIn(C, tReports - 0.9);
    m.cursorTo(C, bx, by, tReports - 0.55, { dur: 0.5 });
    m.tap(C, R.btnE, tReports, { x: bx, y: by, ring: "accent3" });
    Loom.data.tag(ctx, "tag_reports", { x: R.xc - 120, y: 800, text: "REPORTS IT AT ONCE", color: "accent3", textColor: "onAccent", t: tReports });

    // ---- a speech bubble opens from him: what he clicked, shown (the notice and a pointer), not written
    // @form picture_bubble: a speech bubble that holds a small drawing and a pointer instead of words
    const SB = ctx.el("says_bubble", { x: R.xc - 480, y: 396, w: 270, h: 200, kind: "bubble" });
    const bw = 230, bh = 140, g = SB.inner;
    kit.polygon(g, [[bw - 70, bh + 4], [bw - 24, bh + 4], [bw + 14, bh + 40]], { fill: "ink" });
    kit.rect(g, 0, 0, bw, bh, { fill: "ink", r: 24, shade: "recipe" });
    flat(g, 22, 26, 118, 88, "surface2", { r: 10 });                            // the notice, small
    flat(g, 36, 40, 40, 34, "accent2", { r: 4 });
    flat(g, 52, 40, 5, 34, "field", { opacity: 0.35 });
    flat(g, 36, 51, 40, 5, "field", { opacity: 0.35 });
    flat(g, 88, 42, 40, 8, "line", { r: 4 });
    flat(g, 88, 58, 28, 7, "line", { r: 3.5, opacity: 0.7 });
    kit.pill(g, 36, 88, 56, 14, { fill: "accent2", flat: true, shadow: false });
    kit.icon(g, "mouse-pointer", { x: 164, y: 92, size: 64, color: "field" });  // the click, as a pointer
    m.iris(SB, tSays);
    Loom.sfx("pop", tSays);
    Loom.data.tag(ctx, "tag_says", { x: R.xc - 140, y: 330, text: "SAYS WHAT HE CLICKED", color: "accent", textColor: "onAccent", t: tSays + 0.15 });

    // ---- the report light leaves his desk and travels the path; the path fills behind it; the lamp comes on as it arrives
    const dur = 1.45, tGo = tWarn;
    const lit = keep(ctx.el("report_path_lit", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", parent: R.wg }));
    const litPath = svg("path", { d: R.pathD, fill: "none", stroke: col("accent"), "stroke-width": 5, "stroke-linecap": "round", opacity: 0.9 }, lit.inner);
    const PLen = litPath.getTotalLength() || 1;
    litPath.setAttribute("stroke-dasharray", `${PLen} ${PLen}`);
    Loom.drive((e) => litPath.setAttribute("stroke-dashoffset", (PLen * (1 - e)).toFixed(2)), tGo, dur, "editorial", { kind: "draw", beat: ctx.beat.id, name: "report_path_lit", content: true });
    m.along(R.lightE, R.path, tGo, { dur });
    Loom.sfx("whoosh", tGo);
    const tArrive = tGo + dur;
    Loom.tween(R.lamp.inner, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: Loom.ease.enter }, tArrive - 0.1, { kind: "reveal", beat: ctx.beat.id, name: "lamp_on_right", content: true });
    Loom.tween(R.roomGlow.inner, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: Loom.ease.enter }, tArrive, { kind: "reveal", beat: ctx.beat.id, name: "security_light_right", content: true });
    Loom.sfx("success", tArrive);
    R.pip.gesture("nod", tArrive + 0.2, tArrive + 1.2);
    R.tess.emotion("surprised", tArrive); R.tess.emotion("neutral", tArrive + 0.9);
    Loom.data.tag(ctx, "tag_arrives", { x: R.xc - 100, y: 142, text: "THE WARNING ARRIVES", color: "pos", textColor: "onAccent", t: tWarn });

    // ---- in time to limit the harm: his screen settles from the alert colour to the calm one
    Loom.hold.heat([R.lap, R.note], tTime, { from: "accent2", to: "pos", dur: 1.4, name: "screen_calm" });
    R.ravi.emotion("happy", tTime + 0.4);
    R.ravi.look(0.2, 0.1, tTime + 0.4);
  },
});
