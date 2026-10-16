// T-006 dev_ci_pipeline: CI/CD pipeline stages (hand-off sheet, Family A). Built on _app_kit.js and _dev_kit.js.
// Stages are cards joined by arrows, left to right (or top to bottom); each job has a status icon (its shape differs
// per state, never colour alone) and an optional duration. Animated, the pipeline runs: each stage starts, its jobs
// spin with a progress sweep and resolve; a failure stops the flow and the later stages turn to skipped. In the
// whiteboard and blueprint styles the cards and arrows are drawn by the hand or the pen and the words written by it.
Loom.component("dev_ci_pipeline", {
  version: 1,
  idea: "A CI/CD pipeline: stages as cards joined by arrows, each with its jobs, a status icon per job and stage (passed, failed, running, pending, skipped, blocked) and durations; on cue the stages run in order, jobs spin and resolve, and a failed stage stops the flow so the stages after it are skipped.",
  outline: ["stage cards in a row (or a column)", "per stage: the stage name and its overall status icon", "per job: a status icon, the job name, its duration", "arrows between stages", "a progress sweep under a running job", "a token that travels the arrows"],
  family: "dev",
  tags: ["ci", "cd", "pipeline", "build", "deploy", "quality gate", "devops", "release", "shift left", "supply chain"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-006)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint", "chalk-lab"],
  params: {
    stages: { type: "list", content: true },       // [{name, jobs: [{name, state: passed|failed|running|pending|skipped|blocked|warning, dur?}]}]
    w: { type: "number", default: 1600 },
    at: { type: "number", default: -1 },           // when the run starts (every job pending, then each resolves to its state); -1: still
    orientation: { type: "enum", choices: ["h", "v"], default: "h" },
    pace: { type: "number", default: 0.7 },        // seconds a job runs before it resolves, when animated
    steps: { type: "list", default: [] },          // [{do: "run", stage, at} | {do: "set", stage, job, state, at} | {do: "flow", at, dur}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["stages[] ({g, card, name, icon})", "jobs[][] ({g, icon, name, dur, sweep})", "edges[]", "token",
    "run(stageIndex, t)", "set(stageIndex, jobIndex, state, t)", "flow(t, dur)"],
  example: 'ctx.use("dev_ci_pipeline", { stages: [{ name: "Build", jobs: [{ name: "compile", state: "passed", dur: "48s" }] }, { name: "Scan", jobs: [{ name: "dependency audit", state: "failed", dur: "12s" }] }, { name: "Release", jobs: [{ name: "publish", state: "skipped" }] }], at: ctx.cue("the scan fails") }, { x: 260, y: 360, name: "pipeline" })',
  size: (p) => Loom.devKit.ciLayout(p).size,
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const L = DK.ciLayout(p), Z = L.Z;
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p), pen = DK.pen(ctx, eng);
    const outlined = S.outlined();
    const field = S.c("field"), ink = S.c("ink");
    const tone = (st) => DK.legible(DK.stateTok(st), S.c("surface"), ink, 3);
    const parts = { stages: [], jobs: [], edges: [], token: null };
    const cardG = svg("g", {}, g), edgeG = svg("g", {}, g), wordG = svg("g", {}, g);
    const STATES = Object.keys(DK.STATE);
    const finalState = L.stages.map((s) => s.jobs.map((j) => (STATES.includes(j.state) ? j.state : "pending")));
    const nowState = finalState.map((js) => js.map((st) => (animated ? "pending" : st)));
    let t0 = animated ? p.at : -1;

    // ---- cards (the kit, or the engine's pen when animated)
    const penEnd = animated ? DK.penDraw(pen, eng, (W) => L.boxes.flatMap((b) => [].concat(W.roundRect(b.x, b.y, b.w, b.h, 12))), { at: p.at, dur: Math.min(1.6, 0.35 * L.boxes.length + 0.3) }) : null;
    L.boxes.forEach((b, i) => {
      const sg = svg("g", {}, cardG);
      if (penEnd == null) K.rect(sg, b.x, b.y, b.w, b.h, { fill: "surface", r: 12, stroke: "line", sw: 1.5 });
      else svg("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 12, fill: S.c("surface") }, sg);
      if (!outlined) svg("rect", { x: f1(b.x + 1), y: f1(b.y + L.headH), width: f1(b.w - 2), height: 1.5, fill: S.mix(S.c("surface"), S.c("line"), 0.45) }, sg);
      else K.line(sg, b.x, b.y + L.headH, b.x + b.w, b.y + L.headH, { stroke: "line", sw: 1.5 });
      if (animated && penEnd == null) AK.show(sg, p.at + i * 0.08, 0.3);
      parts.stages.push({ g: sg, card: b });
    });
    if (penEnd != null) t0 = penEnd; else if (animated) t0 = p.at + 0.08 * L.boxes.length + 0.3;
    // ---- arrows
    const arrowsAt = animated ? t0 : -1;
    L.edges.forEach((e, i) => {
      const a = K.arrow(edgeG, e.x1, e.y1, e.x2, e.y2, { stroke: "line" });
      parts.edges.push(a);
      if (animated) AK.show(a.g, arrowsAt + i * 0.05, 0.25);
    });
    // ---- stage names, job rows
    L.stages.forEach((s, si) => {
      const b = L.boxes[si], st = parts.stages[si];
      st.name = DK.word(ctx, wordG, s.name, { x: b.x + 18, y: b.y, w: b.w - 18 - 50, h: L.headH, size: Z.fs, weight: 700, at: animated ? t0 + si * 0.06 : -1, eng, pen, name: `stage_${si}`, kind: "label" });
      const ig = svg("g", {}, wordG);
      st.iconG = ig; st.icons = {};
      parts.jobs.push(s.jobs.map((j, ji) => {
        const R = L.jobRect(si, ji), jg = svg("g", {}, wordG);
        const icons = {};
        const cy = R.nameH ? R.y + 6 + R.nameH / 2 : R.y + L.rowH / 2;
        const iconFor = (state) => { if (!icons[state]) { icons[state] = DK.stateIcon(jg, state, R.x + 16, cy, 26); icons[state].setAttribute("opacity", 0); } return icons[state]; };
        iconFor(nowState[si][ji]).setAttribute("opacity", 1);
        const nameT = DK.word(ctx, jg, j.name, { x: R.x + 38, y: R.nameH ? R.y + 6 : R.y, w: R.nameW, h: R.nameH0 || R.nameH || L.rowH, maxLines: R.lines || 1, size: Z.fs, at: animated ? t0 + si * 0.06 + 0.1 : -1, eng, pen, name: `job_${si}_${ji}` });
        const durT = j.dur ? DK.word(ctx, jg, String(j.dur), { x: R.durX, y: R.durY, w: R.durW, h: R.durH, size: Z.small, color: "muted", align: R.durAlign, ...(pen ? { at: animated ? t0 : -1, eng, pen, name: `dur_${si}_${ji}` } : { at: -2, pen: null }) }) : null;
        const sweep = svg("rect", { x: f1(R.x + 4), y: f1(R.y + L.rowH - 4), width: 0, height: 3, rx: 1.5, fill: S.c("accent"), opacity: 0 }, jg);
        if (animated) AK.show(jg, nameT && nameT.end != null ? nameT.end - 0.2 : t0 + si * 0.06 + 0.1, 0.25);
        return { g: jg, icons, iconFor, name: nameT, dur: durT, sweep, R, cy, runEnd: null };
      }));
      const agg = (arr) => (arr.some((x) => x === "failed" || x === "error") ? "failed" : arr.some((x) => x === "running") ? "running" : arr.every((x) => x === "skipped") ? "skipped"
        : arr.every((x) => x === "blocked") ? "blocked" : arr.every((x) => x === "pending") ? "pending" : arr.some((x) => x === "pending" || x === "blocked") ? "running" : arr.some((x) => x === "warning") ? "warning" : "passed");
      st.agg = () => agg(nowState[si]);
      st.iconFor = (state) => { if (!st.icons[state]) { st.icons[state] = DK.stateIcon(ig, state, b.x + b.w - 30, b.y + L.headH / 2, 30); st.icons[state].setAttribute("opacity", 0); } return st.icons[state]; };
      st.shown = st.agg(); st.iconFor(st.shown).setAttribute("opacity", 1);
      if (animated) AK.show(ig, t0 + si * 0.06, 0.25);
    });
    parts.stages.forEach((st) => { st.icon = st.iconG; });

    // ---- state functions
    const running = {};   // "si.ji" -> the time it started running
    const refreshStage = (si, t) => {
      const st = parts.stages[si], a = st.agg();
      if (a === st.shown) return;
      DK.cross(st.iconFor(st.shown), st.iconFor(a), t);
      st.shown = a;
    };
    parts.set = function (si, ji, state, t) {
      const J = (parts.jobs[si] || [])[ji];
      if (!J || !STATES.includes(state)) { Loom.error("component_params", `dev_ci_pipeline: set(${si}, ${ji}, ${state}) names no job or no state (${STATES.join(", ")})`); return t; }
      const was = nowState[si][ji];
      if (was === state) return t;
      const key = si + "." + ji;
      if (was === "running" && running[key] != null) { J.runEnd = t; delete running[key]; }   // the sweep and the arc end here
      if (state === "running") {
        running[key] = t; J.runEnd = Infinity;
        DK.cross(J.iconFor(was), null, t, 0.1);
        // a spinning arc and a progress sweep while it runs: one drive to the end of the beat, shown until the job resolves
        // (runEnd is read when the frame is drawn, so a later set() ends it)
        const ts = t, span = Math.max((ctx.end || 0) - ts, 2), wMax = J.R.w - 8, r = 12, cx = J.R.x + 16, cy = J.cy;
        const arc = svg("path", { d: "", fill: "none", stroke: S.c("accent"), "stroke-width": 3.4, "stroke-linecap": "round", opacity: 0 }, J.g);
        Loom.drive((e, raw) => {
          const now = ts + raw * span, on = raw > 0 && now < J.runEnd;
          const a0 = -Math.PI / 2 + (now - ts) * 5.5, a1 = a0 + 4.2;
          arc.setAttribute("d", `M${f1(cx + r * Math.cos(a0))} ${f1(cy + r * Math.sin(a0))} A${r} ${r} 0 1 1 ${f1(cx + r * Math.cos(a1))} ${f1(cy + r * Math.sin(a1))}`);
          arc.setAttribute("opacity", on ? 1 : 0);
          const dur = isFinite(J.runEnd) ? Math.max(0.2, J.runEnd - ts) : Math.max(2, p.pace * 3);
          J.sweep.setAttribute("width", f1(wMax * Math.min(1, (now - ts) / dur)));
          J.sweep.setAttribute("opacity", on ? 0.8 : 0);
        }, ts, span, "linear", DK.meta("state", "ci.running"));
      }
      else DK.cross(was === "running" ? null : J.iconFor(was), J.iconFor(state), t);
      if (state !== "running" && state !== "pending" && J.dur && !J.dur.engine) AK.show(J.dur, t + 0.1, 0.2);
      nowState[si][ji] = state;
      refreshStage(si, t);
      // a failure stops the flow: the stages after it are skipped
      if (state === "failed") for (let k = si + 1; k < L.stages.length; k++) L.stages[k].jobs.forEach((_, jk) => { if (["pending", "running", "blocked"].includes(nowState[k][jk])) parts.set(k, jk, "skipped", t + 0.35); });
      return t + 0.25;
    };
    parts.run = function (si, t) {
      (parts.jobs[si] || []).forEach((_, ji) => { if (nowState[si][ji] === "pending") parts.set(si, ji, "running", t); });
      return t + 0.1;
    };
    parts.flow = function (t, dur) {
      const tok = parts.token || (parts.token = svg("circle", { r: 9, cx: 0, cy: 0, fill: S.c("accent"), opacity: 0 }, edgeG));
      const segs = L.edges, D = dur || Math.max(0.6, segs.length * 0.45);
      Loom.drive((e, raw) => {
        const u = Math.min(segs.length - 1e-6, raw * segs.length), k = Math.floor(u), f = u - k, s = segs[k];
        if (!s) return;
        tok.setAttribute("cx", f1(s.x1 + (s.x2 - s.x1) * f)); tok.setAttribute("cy", f1(s.y1 + (s.y2 - s.y1) * f));
        tok.setAttribute("opacity", raw > 0 && raw < 1 ? 1 : 0);
      }, t, D, "linear", DK.meta("travel", "ci.token"));
      return t + D;
    };
    // the run, when animated: each stage starts, its jobs run in parallel and resolve in order; a failure stops it
    if (animated) {
      // with the hand or the pen, the run starts once its words are written
      let t = Math.max(t0 + 0.4 + 0.06 * L.stages.length, pen && pen.free != null ? pen.free + 0.3 : -1);
      for (let si = 0; si < L.stages.length; si++) {
        if (nowState[si].every((x) => x === "skipped")) continue;
        const want = finalState[si];
        if (want.every((x) => x === "pending")) break;
        if (si > 0) { parts.flow(t, 0.4); t += 0.4; }
        parts.run(si, t);
        let tj = t + p.pace;
        want.forEach((st, ji) => { if (st !== "running" && st !== "pending" && nowState[si][ji] === "running") { parts.set(si, ji, st, tj); tj += 0.18; } });
        t = tj + 0.15;
        if (want.some((x) => x === "failed" || x === "running" || x === "pending")) break;
      }
    }
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "run") parts.run(st.stage, st.at);
      else if (st.do === "set") parts.set(st.stage, st.job, st.state, st.at);
      else if (st.do === "flow") parts.flow(st.at, st.dur);
      else Loom.error("component_params", `dev_ci_pipeline: step "${st.do}" is not run, set or flow`);
    }
    return parts;
  },
});

// the pipeline's geometry, shared by size() and build()
Loom.devKit.ciLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, Z = DK.ui().Z;
  const stages = (p.stages || []).map((s) => ({ name: String(s.name == null ? "" : s.name), jobs: (s.jobs || []).map((j) => (typeof j === "string" ? { name: j, state: "pending" } : Object.assign({}, j, { name: String(j.name == null ? "" : j.name) }))) }));
  const n = Math.max(1, stages.length), gap = n >= 6 ? 40 : 64, v = p.orientation === "v";
  const headH = AK.boxH(Z.fs, "caption", 700, 56);
  const lh = AK.lineH(Z.fs), lhS = AK.lineH(Z.small);
  const cardW = v ? Math.min(p.w, 900) : Math.max(150, (p.w - (n - 1) * gap) / n);
  const innerW = cardW - 24;
  // a job's duration sits at the right of its row when both fit, else on a second line
  // the whiteboard hand and the blueprint pen letter wider than the face the kit measures: their words get the room
  let engK = 1;
  try { const e = p.engine !== "off" && Loom.engines && Loom.engines.current && Loom.engines.current(); if (e && e.id === "whiteboard") engK = 1.75; else if (e && e.id === "blueprint") engK = 1.4; } catch (e) { engK = 1; }
  const durWOf = (j) => (j.dur ? AK.measure(String(j.dur), "caption", Z.small, 400) * engK + 8 : 0);
  const nameWOf = (j) => AK.measure(j.name, "caption", Z.fs, 400) * engK + 6;
  // a name wider than its card wraps to a second line (cut at a word only past that)
  const nameLines = stages.some((s) => s.jobs.some((j) => 38 + nameWOf(j) > innerW - 4)) ? 2 : 1;
  const two = nameLines > 1 || stages.some((s) => s.jobs.some((j) => j.dur && 38 + nameWOf(j) + 12 + durWOf(j) > innerW));
  const anyDur = stages.some((s) => s.jobs.some((j) => j.dur));
  const rowH = two ? Math.max(nameLines * Math.ceil(Z.fs * 1.36) + (anyDur ? lhS : 0) + 18, 60) : Math.max(lh + 18, 52);
  const maxJobs = Math.max(1, ...stages.map((s) => s.jobs.length));
  const cardH = headH + 10 + maxJobs * rowH + 10;
  const boxes = stages.map((_, i) => (v ? { x: 0, y: i * (headH + 20 + stages[i].jobs.length * rowH + gap), w: cardW, h: headH + 20 + Math.max(1, stages[i].jobs.length) * rowH } : { x: i * (cardW + gap), y: 0, w: cardW, h: cardH }));
  const edges = [];
  for (let i = 1; i < boxes.length; i++) {
    const a = boxes[i - 1], b = boxes[i];
    if (v) edges.push({ x1: a.x + a.w / 2, y1: a.y + a.h + 8, x2: b.x + b.w / 2, y2: b.y - 8 });
    else edges.push({ x1: a.x + a.w + 8, y1: a.y + headH / 2, x2: b.x - 8, y2: b.y + headH / 2 });
  }
  const jobRect = (si, ji) => {
    const b = boxes[si], x = b.x + 12, y = b.y + headH + 10 + ji * rowH, w = b.w - 24;
    const R = { x, y, w, nameW: w - 40, durX: x + 38, durY: y, durW: w - 40, durH: rowH, durAlign: "right" };
    if (two) {
      const nl = 38 + nameWOf(stages[si].jobs[ji]) > w - 4 ? nameLines : 1, nh = nl > 1 ? Math.ceil((nl - 1) * Z.fs * 1.36 + lh) : lh;
      R.nameW = w - 42; R.durY = y + 6 + nh; R.durH = lhS; R.durAlign = "left"; R.durX = x + 38; R.lines = nl; R.nameH0 = nh;
    }
    else { const dj = stages[si].jobs[ji], dw = durWOf(dj); R.nameW = w - 40 - (dw ? dw + 8 : 0); R.durX = x + w - dw - 4; R.durW = dw; }
    if (two) { R.nameH = lh; }   // the icon sits by the first line
    return R;
  };
  const last = boxes[boxes.length - 1] || { x: 0, y: 0, w: cardW, h: cardH };
  return { Z, stages, headH, rowH, two, nameLines, boxes, edges, jobRect, size: { w: v ? cardW : last.x + last.w, h: last.y + last.h } };
};
