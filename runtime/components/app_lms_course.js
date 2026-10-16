// T-153 app_lms_course: a generic learning platform shell (hand-off sheet, Family M). Built on runtime/components/_app_kit.js.
// Extends the quiz.question and quiz.answer templates (a quiz on a slide) into the platform a learner uses: the course
// outline, a lesson player, a quiz, progress and a certificate, with scriptable actions.
Loom.component("app_lms_course", {
  version: 1,
  idea: "An online course on a learning platform: the outline of modules and lessons with what is done, a lesson player, a quiz with feedback, the learner's progress and a certificate, walked through by a pointer that starts a lesson, answers, submits and completes the course.",
  outline: ["window (or the screencast engine's app window)", "outline sidebar: course title, progress bar, modules and lessons with done, current and kind marks", "lesson header: title and kind", "lesson player: picture area, play button, scrubber and times; mark complete and next buttons", "quiz: question, options, submit, feedback", "certificate", "toast", "pointer"],
  family: "ui",
  tags: ["learning platform", "lms", "e-learning", "course", "lesson", "quiz", "progress", "certificate", "compliance training", "onboarding"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-153)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop"],   // a product UI: the styles that show products as screens (D-193)
  params: {
    course: { type: "str", content: true },      // the course's title
    modules: { type: "list", content: true },    // [{title, lessons: [{id, title, kind: "video"|"reading"|"quiz", duration, done}]}]
    lesson: { type: "str" },                     // the open lesson's id (the first not done when omitted)
    player: { type: "obj" },                     // the player's times: {duration: "6:30", at: "0:00"} (none when omitted); {caption} a line under the picture
    quiz: { type: "obj" },                       // {question, options: [str], correct (index), right (feedback), wrong (feedback)}
    progress: { type: "obj" },                   // {value (0 to 1), label, after (the label once a lesson is completed)}
    certificate: { type: "obj" },                // {title, name, course, date}
    view: { type: "enum", choices: ["lesson", "quiz", "certificate"], default: "lesson" },
    title: { type: "str" },
    labels: { type: "obj" },                     // the product's words, each optional: {complete, next, submit, download, completed}
    state: { type: "enum", choices: ["ready", "loading", "error"], default: "ready" },
    notice: { type: "str" },
    steps: { type: "list", default: [] },        // [{do: "start"|"play"|"answer"|"submit"|"complete"|"state", at, ...}]
    theme: { type: "obj", default: {} }, layout: { type: "obj", default: {} },   // layout: {sidebarW}
    w: { type: "number", default: 1728 }, h: { type: "number", default: 856 },
    at: { type: "number", default: -1 }, cps: { type: "number", default: 14 },
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["host", "outline", "lessonRows", "progressBar", "header", "player", "quizView", "options", "feedback", "certificate", "states",
    "start(id, at)", "play(at, {dur, to})", "answer(i, at)", "submit(at)", "complete(at)", "setState(name, at)"],
  example: 'ctx.use("app_lms_course", { course: "Food safety basics", modules: [{ title: "Module 1", lessons: [{ id: "l1", title: "Washing hands", kind: "video", duration: "3 min", done: true }, { id: "q1", title: "Check your understanding", kind: "quiz" }] }], quiz: { question: "How long should you wash your hands?", options: ["5 seconds", "20 seconds"], correct: 1, right: "Correct: at least 20 seconds." }, labels: { submit: "Submit" }, steps: [{ do: "start", id: "q1", at: ctx.cue("take the quiz") }, { do: "answer", i: 1 }, { do: "submit" }] }, { x: 96, y: 78, name: "lms" })',
  size: (p) => ({ w: p.w, h: p.h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, svg = (t, a, q) => Loom.svg(t, a, q);
    const T = AK.theme(p.theme), Z = AK.sizes(T), tones = AK.tones(T), L = p.labels || {}, LY = p.layout || {};
    const H = AK.host(ctx, g, p, { T, Z, title: p.title });
    const B = H.body, BW = B.w, BH = B.h, pad = Z.pad, root = B.g;
    AK.box(root, 0, 0, BW, BH, { r: 0, fill: tones.page });
    const all = [];
    p.modules.forEach((m, mi) => (m.lessons || []).forEach((l, li) => all.push(Object.assign({ id: l.id || `l${mi}.${li}`, kind: "video", mi }, l))));
    const KIND_ICON = { video: "circle-play", reading: "file-text", quiz: "list-checks" };
    let cur = p.lesson ? all.findIndex((l) => l.id === p.lesson) : all.findIndex((l) => !l.done);
    if (cur < 0) cur = 0;

    // ---------------------------------------------------------------- outline
    const SW = Math.round(LY.sidebarW || AK.clamp(BW * 0.25, 340, 460));
    const side = svg("g", {}, root);
    AK.box(side, 0, 0, SW, BH, { r: 0, fill: tones.side });
    AK.box(side, SW - 1, 0, 1.5, BH, { r: 0, fill: tones.hair2 });
    let y = pad;
    const ct = AK.P(side, p.course, { role: "label", x: pad, y, w: SW - 2 * pad, size: Z.head, maxLines: 2, weight: 700 });
    y += ct.__h + pad * 0.6;
    let progressBar = null;
    if (p.progress) {
      const bw = SW - 2 * pad, v = AK.clamp(+p.progress.value || 0, 0, 1);
      AK.box(side, pad, y, bw, 10, { r: 5, fill: tones.track });
      const fill = AK.box(side, pad, y, Math.max(0.1, bw * v), 10, { r: 5, fill: "pos" });
      y += 18;
      let lab = null, labAfter = null;
      if (p.progress.label) lab = AK.T(side, p.progress.label, { x: pad, y, w: bw, h: Z.lhS, size: Z.small, color: "muted" });
      if (p.progress.after) { labAfter = AK.T(side, p.progress.after, { x: pad, y, w: bw, h: Z.lhS, size: Z.small, color: "muted" }); labAfter.setAttribute("opacity", 0); }
      y += Z.lhS + 6;
      progressBar = { fill, w: bw, v, lab, labAfter };
    }
    AK.box(side, 0, y + 4, SW, 1.5, { r: 0, fill: tones.hair });
    y += pad;
    const rowH = AK.boxH(Z.fs, "caption", 600, Math.round(Math.max(Z.lh + 18, 50) * T.density));
    const lessonRows = [];
    let lastM = -1;
    for (let k = 0; k < all.length; k++) {
      const l = all[k];
      if (l.mi !== lastM) {
        if (y + Z.lhS + 8 + rowH > BH - 6) break;
        lastM = l.mi;
        AK.T(side, p.modules[l.mi].title || "", { x: pad, y, w: SW - 2 * pad, h: Z.lhS + 6, size: Z.small, weight: 700, color: "muted" });
        y += Z.lhS + 10;
      }
      if (y + rowH > BH - 6) break;
      const rg = svg("g", {}, side), x = 8, w = SW - 16;
      const sel = AK.box(rg, x, y, w, rowH, { r: Math.min(T.radius, 10), fill: tones.sel, opacity: k === cur ? 1 : 0 });
      const icTodo = svg("g", { opacity: l.done ? 0 : 1 }, rg), icDone = svg("g", { opacity: l.done ? 1 : 0 }, rg);
      AK.icon(icTodo, KIND_ICON[l.kind] || "circle", x + 26, y + rowH / 2, 24, "muted");
      AK.icon(icDone, "circle-check", x + 26, y + rowH / 2, 24, "pos");
      const dW = l.duration ? Math.ceil(AK.measure(l.duration, "caption", Z.small) + 4) : 0;
      if (l.duration) AK.T(rg, l.duration, { x: x + w - 12 - dW, y, w: dW, h: rowH, size: Z.small, color: "muted", align: "right" });
      const tOff = AK.T(rg, l.title, { x: x + 50, y, w: w - 62 - (dW ? dW + 10 : 0), h: rowH, size: Z.fs, weight: 400, color: "ink" });
      const tOn = AK.T(rg, l.title, { x: x + 50, y, w: w - 62 - (dW ? dW + 10 : 0), h: rowH, size: Z.fs, weight: 700, color: T.accent });
      const icOn = svg("g", { opacity: k === cur && !l.done ? 1 : 0 }, rg);
      AK.icon(icOn, KIND_ICON[l.kind] || "circle", x + 26, y + rowH / 2, 24, T.accent);
      (k === cur ? tOff : tOn).setAttribute("opacity", 0);
      lessonRows[k] = { g: rg, x, y, w, h: rowH, sel, icTodo, icDone, icOn, tOff, tOn, l };
      y += rowH + 2;
    }

    // ---------------------------------------------------------------- the main area: header and three views
    const MX = SW, MW = BW - SW, cx = MX + pad * 2, cw = MW - pad * 4;
    const hdrH = Math.round(Z.lhB + pad * 1.4);
    const heads = all.map((l, k) => {
      const hg = svg("g", { opacity: k === cur ? 1 : 0 }, root);
      const kw = AK.measure(l.duration || "", "caption", Z.small) + 70;
      AK.icon(hg, KIND_ICON[l.kind] || "circle", cx + 14, pad * 0.7 + Z.lhB / 2, 28, T.accent);
      AK.T(hg, l.title, { role: "lead", x: cx + 40, y: pad * 0.7, w: cw - 40 - (l.duration ? kw : 0), h: Z.lhB, size: Z.big, weight: 700 });
      if (l.duration) AK.pill(hg, cx + cw, pad * 0.7 + (Z.lhB - AK.boxH(Z.small, "caption", 600)) / 2, l.duration, { size: Z.small, icon: "clock", fill: tones.card, stroke: tones.hair2, align: "right", weight: 600 });
      return hg;
    });
    AK.box(root, MX, hdrH, MW, 1.5, { r: 0, fill: tones.hair });
    const vTop = hdrH + pad, vBot = BH - pad;
    // lesson view: the player
    const lessonV = svg("g", {}, root);
    const btnRowH = Z.ctl + pad;
    const capH = p.player && p.player.caption ? Z.lh + 10 : 0;
    const plH0 = vBot - vTop - btnRowH - capH, plW = Math.min(cw, Math.round(plH0 * 16 / 9)), plH = Math.round(plW * 9 / 16);
    const plX = cx + (cw - plW) / 2, plY = vTop;
    const ctrlH = Math.round(Z.lh + 26);
    const playerG = svg("g", {}, lessonV);
    // the player is dark in every pack: the darkest neutral token, its controls in whatever reads best on it
    const DT = AK.darkTok(), dark = AK.c(DT), screen = AK.mix(DT, T.accent, 0.22);
    AK.box(playerG, plX, plY, plW, plH, { r: T.radius, fill: dark });
    AK.box(playerG, plX, plY, plW, plH - ctrlH, { r: T.radius, fill: screen });
    const onDarkTok = AK.onHex(dark), onDark = AK.c(onDarkTok);
    const bigPlay = svg("g", {}, playerG);
    svg("circle", { cx: plX + plW / 2, cy: plY + (plH - ctrlH) / 2, r: 46, fill: AK.c("surface"), opacity: 0.92 }, bigPlay);
    AK.icon(bigPlay, "play", plX + plW / 2 + 4, plY + (plH - ctrlH) / 2, 40, T.accent);
    const cy = plY + plH - ctrlH / 2;
    const icPlay = svg("g", {}, playerG), icPause = svg("g", { opacity: 0 }, playerG);
    AK.icon(icPlay, "play", plX + 30, cy, 24, "ink", onDark);
    AK.icon(icPause, "pause", plX + 30, cy, 24, "ink", onDark);
    const tW = p.player && p.player.duration ? Math.ceil(AK.measure(`${p.player.duration} / ${p.player.duration}`, "caption", Z.small) + 8) : 0;
    const trX = plX + 60, trW = plW - 60 - 24 - (tW ? tW + 16 : 0);
    AK.box(playerG, trX, cy - 4, trW, 8, { r: 4, fill: onDark, opacity: 0.35 });
    const trFill = AK.box(playerG, trX, cy - 4, 0.1, 8, { r: 4, fill: T.accent });
    const knob = svg("circle", { cx: trX, cy, r: 9, fill: AK.c("surface") }, playerG);
    let timeNode = null;
    const parseT = (s) => { const m = String(s || "").match(/^(\d+):(\d{2})$/); return m ? +m[1] * 60 + +m[2] : null; };
    const fmtT = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
    const durS = p.player ? parseT(p.player.duration) : null;
    if (tW) {
      timeNode = AK.T(playerG, `${p.player.at || "0:00"} / ${p.player.duration}`, { x: plX + plW - 20 - tW, y: cy - Z.lh / 2, w: tW, h: Z.lh, size: Z.small, color: "ink", fill: onDark, align: "right" });
    }
    if (capH) AK.T(lessonV, p.player.caption, { x: plX, y: plY + plH + 6, w: plW, h: Z.lh, size: Z.fs, color: "muted" });
    const bY = plY + plH + capH + pad * 0.7;
    const nextB = L.next ? AK.button(lessonV, plX + plW, bY, { label: L.next, icon: "arrow-right", T, Z, align: "right" }) : null;
    const compB = AK.button(lessonV, nextB ? nextB.x - 12 : plX + plW, bY, { label: L.complete, icon: "circle-check", kind: "primary", T, Z, align: "right" });
    const doneChip = L.completed ? AK.pill(lessonV, plX, bY + (Z.ctl - AK.boxH(Z.small, "caption", 600)) / 2, L.completed, { size: Z.small, icon: "circle-check", fill: tones.posWash, color: "pos", weight: 600 }) : null;
    if (doneChip) doneChip.g.setAttribute("opacity", 0);
    // quiz view
    const quizV = svg("g", { opacity: 0 }, root);
    const Q = p.quiz || null;
    const options = [];
    let fbRight = null, fbWrong = null, submitB = null;
    if (Q) {
      let qy = vTop + pad * 0.5;
      const qt = AK.P(quizV, Q.question || "", { role: "lead", x: cx, y: qy, w: Math.min(cw, 1100), size: Z.big, maxLines: 3, weight: 700 });
      qy += qt.__h + pad;
      const ow = Math.min(cw, 1000);
      const fbH = Math.max(Q.right ? AK.paraH(Q.right, { size: Z.fs, w: ow - 90, maxLines: 3 }) : 0, Q.wrong ? AK.paraH(Q.wrong, { size: Z.fs, w: ow - 90, maxLines: 3 }) : 0) + 28;
      const room = vBot - qy - Z.ctl - pad * 1.5 - ((Q.right || Q.wrong) ? fbH + pad : 0);
      (Q.options || []).forEach((o, i) => {
        const oh = AK.paraH(o, { size: Z.fs, w: ow - 90, maxLines: 2 }) + 24;
        if (qy + oh > vTop + pad * 0.5 + qt.__h + pad + room) return;
        const og = svg("g", {}, quizV);
        const base = AK.box(og, cx, qy, ow, oh, { r: T.radius, fill: "surface", stroke: tones.hair2 });
        const selR = AK.box(og, cx, qy, ow, oh, { r: T.radius, fill: tones.sel, stroke: T.accent, sw: 2, opacity: 0 });
        const okR = AK.box(og, cx, qy, ow, oh, { r: T.radius, fill: tones.posWash, stroke: "pos", sw: 2, opacity: 0 });
        const badR = AK.box(og, cx, qy, ow, oh, { r: T.radius, fill: tones.negWash, stroke: "neg", sw: 2, opacity: 0 });
        svg("circle", { cx: cx + 34, cy: qy + oh / 2, r: 12, fill: "none", stroke: AK.c("muted"), "stroke-width": 2 }, og);
        const dot = svg("circle", { cx: cx + 34, cy: qy + oh / 2, r: 6.5, fill: AK.c(T.accent), opacity: 0 }, og);
        AK.P(og, o, { x: cx + 64, y: qy + 12, w: ow - 90, size: Z.fs, maxLines: 2 });
        const tick = svg("g", { opacity: 0 }, og); AK.icon(tick, "circle-check", cx + ow - 30, qy + oh / 2, 26, "pos");
        const cross = svg("g", { opacity: 0 }, og); AK.icon(cross, "circle-x", cx + ow - 30, qy + oh / 2, 26, "neg");
        options.push({ g: og, x: cx, y: qy, w: ow, h: oh, selR, okR, badR, dot, tick, cross, base });
        qy += oh + 10;
      });
      submitB = AK.button(quizV, cx, qy + pad * 0.4, { label: L.submit, icon: "send", kind: "primary", T, Z });
      const fy = submitB.y + submitB.h + pad;
      const fb = (txt, ok) => {
        const fg = svg("g", { opacity: 0 }, quizV);
        AK.box(fg, cx, fy, ow, fbH, { r: T.radius, fill: ok ? tones.posWash : tones.negWash, stroke: ok ? "pos" : "neg" });
        AK.icon(fg, ok ? "circle-check" : "circle-alert", cx + 34, fy + fbH / 2, 28, ok ? "pos" : "neg");
        AK.P(fg, txt, { x: cx + 64, y: fy + 14, w: ow - 90, size: Z.fs, maxLines: 3 });
        return fg;
      };
      if (Q.right) fbRight = fb(Q.right, true);
      if (Q.wrong) fbWrong = fb(Q.wrong, false);
    }
    // certificate view
    const certV = svg("g", { opacity: 0 }, root);
    const C = p.certificate || null;
    if (C) {
      const cwC = Math.min(cw, 1000), chC = Math.min(vBot - vTop, 600), xC = cx + (cw - cwC) / 2, yC = vTop + (vBot - vTop - chC) / 2;
      AK.box(certV, xC, yC, cwC, chC, { r: T.radius, fill: "surface", stroke: T.accent, sw: 3 });
      AK.box(certV, xC + 14, yC + 14, cwC - 28, chC - 28, { r: Math.max(0, T.radius - 6), fill: "none", stroke: tones.hair2, sw: 1.5 });
      let yy = yC + 40;
      AK.icon(certV, "award", xC + cwC / 2, yy + 34, 64, "accent4");
      yy += 84;
      const ccw = cwC - 140, ccx = xC + 70;
      if (C.title) { AK.T(certV, C.title, { role: "label", x: ccx, y: yy, w: ccw, h: Z.lhH, size: Z.head, weight: 600, color: "muted", align: "center" }); yy += Z.lhH + 14; }
      if (C.name) { const nh = AK.lineH(S0(), "title", 700); AK.T(certV, C.name, { role: "title", x: ccx, y: yy, w: ccw, h: nh, size: S0(), weight: 700, align: "center" }); yy += nh + 10; }
      if (C.course) { const t = AK.P(certV, C.course, { role: "lead", x: ccx, y: yy, w: ccw, size: Z.big, maxLines: 2, weight: 600, align: "center" }); yy += t.__h + 10; }
      if (C.date) AK.T(certV, C.date, { x: ccx, y: yC + chC - 40 - Z.lh, w: ccw, h: Z.lh, size: Z.fs, color: "muted", align: "center" });
    }
    function S0() { const r = Loom.style.pack.type.title || [56, 80]; return r[0]; }
    // states
    const loadG = svg("g", {}, root);
    AK.box(loadG, MX, 0, MW, BH, { r: 0, fill: tones.page });
    AK.box(loadG, plX, plY, plW, plH, { r: T.radius, fill: tones.track });
    AK.box(loadG, cx, pad, cw * 0.5, Z.lhB - 10, { r: 8, fill: tones.track });
    const errG = svg("g", {}, root);
    {
      AK.box(errG, MX, 0, MW, BH, { r: 0, fill: tones.page });
      const bw = Math.min(cw, 900), bh = p.notice ? AK.paraH(p.notice, { size: Z.fs, w: bw - 90, maxLines: 3 }) + 28 : Z.row;
      AK.box(errG, cx + (cw - bw) / 2, BH * 0.35, bw, bh, { r: T.radius, fill: tones.negWash, stroke: "neg" });
      AK.icon(errG, "circle-alert", cx + (cw - bw) / 2 + 34, BH * 0.35 + bh / 2, 26, "neg");
      if (p.notice) AK.P(errG, p.notice, { x: cx + (cw - bw) / 2 + 64, y: BH * 0.35 + 14, w: bw - 90, size: Z.fs, maxLines: 3 });
    }
    const states = AK.states({ ready: svg("g", {}, root), loading: loadG, error: errG }, p.state || "ready");
    const views = AK.states({ lesson: lessonV, quiz: quizV, certificate: certV }, p.view === "quiz" && Q ? "quiz" : p.view === "certificate" && C ? "certificate" : "lesson");

    // ---------------------------------------------------------------- actions
    const at0 = (t) => (t == null ? Math.max(H.free + 0.4, p.at >= 0 ? p.at + 0.6 : 0.4) : t);
    const A = {};
    let chosen = -1, played = 0;
    A.start = function (id, at) {
      const k = all.findIndex((l) => l.id === id), R = lessonRows[k];
      if (!R) { Loom.error("component_params", `app_lms_course.start: lesson "${id}" is not in the outline on screen`); return at0(at); }
      const tp = H.click(R, at0(at));
      const P0 = lessonRows[cur];
      if (P0) { AK.hide(P0.sel, tp + 0.05, 0.15); AK.hide(P0.tOn, tp + 0.05, 0.15); AK.show(P0.tOff, tp + 0.05, 0.15); if (!P0.l.done) AK.hide(P0.icOn, tp + 0.05, 0.15); }
      AK.show(R.sel, tp + 0.05, 0.18); AK.hide(R.tOff, tp + 0.05, 0.15); AK.show(R.tOn, tp + 0.05, 0.18); if (!R.l.done) AK.show(R.icOn, tp + 0.05, 0.18);
      AK.hide(heads[cur], tp + 0.08, 0.15); AK.show(heads[k], tp + 0.15, 0.2);
      cur = k;
      views.set(all[k].kind === "quiz" && Q ? "quiz" : "lesson", tp + 0.1);
      return tp + 0.45;
    };
    A.play = function (at, o) {
      o = o || {};
      const tp = H.click({ x: plX + plW / 2 - 46, y: plY + (plH - ctrlH) / 2 - 46, w: 92, h: 92 }, at0(at), { fx: 0.5 });
      AK.hide(bigPlay, tp + 0.08, 0.2); AK.hide(icPlay, tp + 0.08, 0.1); AK.show(icPause, tp + 0.08, 0.1);
      // the scrubber moves (a time-lapse of watching): to `to` (a share of the lesson) over `dur` seconds
      const to = AK.clamp(o.to == null ? 0.4 : o.to, 0, 1), dur = o.dur || 2, from = played;
      Loom.drive((e) => {
        const v = from + (to - from) * e;
        trFill.setAttribute("width", AK.f1(Math.max(0.1, trW * v))); knob.setAttribute("cx", AK.f1(trX + trW * v));
        if (timeNode && durS != null) { const sp = timeNode.querySelector("tspan") || timeNode; sp.textContent = `${fmtT(durS * v)} / ${p.player.duration}`; }
      }, tp + 0.2, dur, "linear", AK.meta("count", "app.player"));
      played = to;
      return tp + 0.2 + dur;
    };
    A.answer = function (i, at) {
      const O = options[i];
      if (!O) { Loom.error("component_params", `app_lms_course.answer: no option ${i}`); return at0(at); }
      if (views.get() !== "quiz") Loom.warn("component_params", "app_lms_course.answer: the quiz is not showing (start the quiz lesson first)");
      const tp = H.click(O, at0(at), { fx: 0.06 });
      if (chosen >= 0) { AK.hide(options[chosen].selR, tp + 0.05, 0.12); AK.hide(options[chosen].dot, tp + 0.05, 0.12); }
      AK.show(O.selR, tp + 0.05, 0.15); AK.show(O.dot, tp + 0.05, 0.15);
      chosen = i;
      return tp + 0.35;
    };
    A.submit = function (at) {
      if (!submitB) return at0(at);
      const tp = H.click(submitB, at0(at));
      const ok = Q.correct === chosen;
      const C0 = options[Q.correct], M0 = options[chosen];
      if (M0 && !ok) { AK.hide(M0.selR, tp + 0.15, 0.1); AK.show(M0.badR, tp + 0.15, 0.2); AK.show(M0.cross, tp + 0.2, 0.2); }
      if (C0) { if (ok) AK.hide(C0.selR, tp + 0.15, 0.1); AK.show(C0.okR, tp + 0.15, 0.2); AK.show(C0.tick, tp + 0.2, 0.2); }
      const fb = ok ? fbRight : fbWrong;
      if (fb) AK.show(fb, tp + 0.3, 0.25);
      Loom.sfx && Loom.sfx(ok ? "success" : "error", tp + 0.25, { g: 0.35 });
      return tp + 0.7;
    };
    A.complete = function (at) {
      const t0 = at0(at);
      const tp = views.get() === "lesson" ? H.click(compB, t0) : t0;
      const R = lessonRows[cur];
      if (R && !R.l.done) { AK.hide(R.icTodo, tp + 0.1, 0.15); if (R.icOn.getAttribute("opacity") !== "0" || R === lessonRows[cur]) AK.hide(R.icOn, tp + 0.1, 0.15); R.l.done = true; AK.show(R.icDone, tp + 0.15, 0.2); Loom.drive((e, raw) => R.icDone.setAttribute("transform", `translate(${AK.f1(R.x + 26)} ${AK.f1(R.y + R.h / 2)}) scale(${(1 + 0.3 * Math.sin(Math.PI * raw)).toFixed(3)}) translate(${AK.f1(-(R.x + 26))} ${AK.f1(-(R.y + R.h / 2))})`), tp + 0.15, 0.35, "linear", AK.meta("gesture", "app.done")); }
      if (doneChip && views.get() === "lesson") AK.show(doneChip.g, tp + 0.15, 0.2);
      let t = tp + 0.5;
      if (progressBar) {
        const PB = progressBar, from = PB.v, to = Math.min(1, from + 1 / Math.max(1, all.length));
        Loom.drive((e) => PB.fill.setAttribute("width", AK.f1(Math.max(0.1, PB.w * (from + (to - from) * e)))), tp + 0.2, 0.6, "move", AK.meta("count", "app.progress"));
        if (PB.lab && PB.labAfter) { AK.hide(PB.lab, tp + 0.4, 0.15); AK.show(PB.labAfter, tp + 0.45, 0.2); }
        PB.v = to;
        t = tp + 0.85;
        if (to >= 0.999 && C) { AK.hide(heads[cur], t, 0.15); views.set("certificate", t); Loom.sfx && Loom.sfx("success", t + 0.1, { g: 0.4 }); t += 0.5; }
      }
      return t;
    };
    A.setState = function (name, at) { return states.set(name, at0(at)); };
    A.state = A.setState;
    AK.reveal(g, p.at);
    AK.runSteps(A, p.steps, { start: ["id", "at"], play: ["at", "opts"], answer: ["i", "at"], submit: ["at"], complete: ["at"], state: ["state", "at"] });
    return Object.assign({ host: H, outline: side, lessonRows, progressBar, header: heads, player: playerG, quizView: quizV, options, feedback: { right: fbRight, wrong: fbWrong }, certificate: certV, states }, A);
  },
});
