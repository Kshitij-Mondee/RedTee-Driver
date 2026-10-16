// @design callback_annotate_same_object_continued: the cursor leaves the link for the report control, the message folds into a ticked row, the room settles
Loom.scene("b41", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, svg = Loom.svg;
    const f = (v) => Math.round(v * 10) / 10;
    const tags = (props.tags && props.tags.length ? props.tags : ["does not click", "reports it"]).map((s) => String(s).toUpperCase());

    // ---------------------------------------------------------------- hold the callback picture from b40, by name
    const H = {};
    ["office_set", "screen_glow", "jo", "hero_laptop", "bg_extra_1", "bg_extra_2", "veil", "message", "cursor"].forEach((n) => { H[n] = ctx.held(n); });
    const layers = {}, depth = { far: 0.35, mid: 0, near: 0.6 };
    Array.from(H.office_set.inner.children).forEach((c) => { const nm = c.getAttribute("data-layer"); if (nm) layers[nm] = { cam: c, g: c.firstChild, depth: depth[nm] }; });
    // the place's camera, rebuilt over the held layers with b40's push replayed as already done
    const R = { E: H.office_set, W: 1920, H: 1080, layers, cams: [], ctx };
    R.cams.push({ kind: "push", to: [1420, 565], scale: 1.6, t0: ctx.start - 6, t1: ctx.start - 4.5, ease: Loom.ease.editorial });
    const MID = layers.mid.g, cur = H.cursor, msg = H.message, veil = H.veil;

    const tNo = ctx.cue("does not click"), tRep = ctx.cue("reports it"), tFold = ctx.cue("with the company's report button"), tOn = ctx.cue("The afternoon carries on");
    const mt = (n) => ({ kind: "gesture", beat: ctx.beat.id, name: n, content: true });
    const fade = (E, t, d, n) => Loom.tween(E.inner, { opacity: 1 }, { opacity: 0, duration: d, ease: Loom.ease.exit }, t, mt(n));

    // ---------------------------------------------------------------- Jo does not click: the cursor leaves the link
    // @form control_chip_tapped: a small labelled control the pointer travels to and taps, with a tag naming each act
    const ctl = ctx.el("report_control", { x: 1230, y: 196, w: 200, h: 60, kind: "instrument" });
    kit.rect(ctl.inner, 0, 0, 200, 60, { fill: "accent", r: 8, flat: true });
    kit.icon(ctl.inner, "flag", { x: 36, y: 30, size: 30, color: S.pickTokenOn("accent") });
    kit.text(ctl.inner, "Report", { role: "label", x: 66, y: 0, w: 120, h: 60, valign: "middle", weight: 700, color: S.pickTokenOn("accent"), maxLines: 1 });
    m.unmask(ctl, tNo + 0.1, { dur: 0.5 });
    const tArrive = m.cursorTo(cur, 1296, 236, tNo);
    const tg1 = Loom.data.tag(ctx, "tag_no_click", { x: 836, y: 754, text: tags[0], color: "accent3", t: tNo + 0.05 });

    // ---------------------------------------------------------------- Jo reports it: the tap, and its tag
    m.tap(cur, ctl, Math.max(tRep, tArrive + 0.12), { ring: "accent" });
    const tg2 = Loom.data.tag(ctx, "tag_reports", { x: 1230, y: 282, text: tags[1], color: "pos", t: tRep + 0.1 });

    // ---------------------------------------------------------------- the message folds into its row, which takes a tick
    const row = ctx.el("message_row", { x: 380, y: 470, w: 1160, h: 84, kind: "card" });
    kit.rect(row.inner, 0, 0, 1160, 84, { fill: "surface2", r: 8, flat: true });
    kit.disc(row.inner, 48, 42, 22, { fill: "accent3", flat: true });
    kit.rect(row.inner, 92, 20, 300, 16, { fill: "muted", r: 8, flat: true, crisp: true });
    kit.rect(row.inner, 92, 48, 560, 14, { fill: "line", r: 7, flat: true, crisp: true });
    Loom.tween(row.inner, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: Loom.ease.enter }, tFold + 0.55, mt("row.in"));
    // the window squashes toward the row's height about its own middle while its contents, the control and the tags fade
    const k = 84 / 826;
    Loom.tween(msg.mover, { scaleY: 1, y: 0 }, { scaleY: k, y: (1 - k) * 413, duration: 0.85, ease: Loom.ease.editorial }, tFold, mt("message.fold"));
    Loom.tween(msg.inner, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: Loom.ease.exit }, tFold + 0.2, mt("message.fade"));
    fade(ctl, tFold, 0.4, "report_control.out"); fade(tg1, tFold, 0.4, "tag_no_click.out"); fade(tg2, tFold, 0.4, "tag_reports.out");
    Loom.treat.mark(ctx, "handled_tick", { x: 1160 - 70, y: 42, size: 64, tone: "pos", kind: "yes", t: tFold + 1.05, parent: row.inner });

    // ---------------------------------------------------------------- the afternoon carries on: the one camera move, the room settles
    // the row (with its tick) settles back into the laptop screen while the veil lifts and the camera pulls back
    const s = 480 / 1160;
    Loom.tween(row.mover, { x: 0, y: 0, scale: 1, transformOrigin: "0 0" }, { x: 1180 - 380, y: 565 - 42 * s - 470, scale: s, duration: 1.3, ease: Loom.ease.editorial }, tOn, mt("row.home"));
    Loom.tween(veil.inner, { opacity: 1 }, { opacity: 0, duration: 1.5, ease: Loom.ease.editorial }, tOn, mt("veil.lift"));
    Loom.cam.pull(R, { t0: tOn, t1: tOn + 2.0 });
    Loom.hold.heat(H.office_set.inner.querySelector(".lm-winlight"), tOn, { from: "accent3", to: "accent", dur: 2.4, name: "window_light" });
    // Jo settles back a little in her chair (the held figure turns a little about her hips; no new pose is needed)
    Loom.tween(H.jo.mover, { rotation: 0, y: 0, transformOrigin: "50% 62%" }, { rotation: 2.4, y: 6, duration: 1.8, ease: Loom.ease.editorial }, tOn, mt("jo.settle"));

    // an extra crosses the room with a coffee: walking from before the veil lifts, so it is mid-room as the room appears
    const w0 = ctx.start + 4.4, w1 = ctx.end + 0.5, x0 = 2300, dxw = -2500, sc = 0.44, y0 = 1062;
    const walker = ctx.character("walker", "extra", { x: x0, y: y0, scale: sc, flip: true, parent: MID, pose: "present" });
    walker.walk(w0, w1, dxw, 1.8);
    // the coffee rides the raised hand: forward kinematics of the bean rig's right arm in pose "present", plus the
    // walk cycle's arm swing and torso sway, mirrored, carried along at the walk's pace
    const rot = (p, c, a) => { const r = a * Math.PI / 180, co = Math.cos(r), sn = Math.sin(r); return [c[0] + (p[0] - c[0]) * co - (p[1] - c[1]) * sn, c[1] + (p[0] - c[0]) * sn + (p[1] - c[1]) * co]; };
    const mug = ctx.el("coffee_mug", { x: 0, y: 0, w: 60, h: 80, kind: "token", parent: MID });
    kit.rect(mug.inner, -14, -30, 28, 32, { fill: "ink", r: 4, flat: true, crisp: true });
    svg("path", { d: "M14 -24 q14 2 12 12 q-2 8 -12 8", fill: "none", stroke: S.c("ink"), "stroke-width": 4, "stroke-linecap": "round" }, mug.inner);
    svg("path", { d: "M-6 -38 q-6 -8 0 -14 M6 -38 q-6 -8 0 -14", fill: "none", stroke: S.c("muted"), "stroke-width": 3, "stroke-linecap": "round", opacity: 0.7 }, mug.inner);
    Loom.drive((e, raw) => {
      const t = w0 + raw * (w1 - w0), u = raw, ph = (t - w0) * 2 * Math.PI * 1.8;
      let p = rot([268, 612], [264, 520], -55);
      p = rot(p, [252, 430], -60 - 16 * Math.sin(ph));
      p = rot(p, [200, 640], -4 + 1.5 * Math.sin(2 * ph));
      const bob = -Math.abs(Math.sin(ph)) * 8;
      mug.mover.setAttribute("transform", `translate(${f(x0 - 200 * sc + (400 - p[0]) * sc + dxw * u)} ${f(y0 - 900 * sc + (p[1] + bob) * sc + 4)})`);
    }, w0, w1 - w0, "linear", { kind: "ambient", beat: ctx.beat.id, name: "coffee_mug" });
  },
});
