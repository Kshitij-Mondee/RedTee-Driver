// T-004 dev_git_graph: a branch and commit graph (hand-off sheet, Family A). Built on _app_kit.js and _dev_kit.js.
// Each branch has its own lane with its label in a column at the left (never on a line); commits are dots in order,
// merges are curves between lanes, tags are small flags under their commit, HEAD is a ring with a pointer. In the
// whiteboard and blueprint styles the words are written by the hand or lettered by the pen (the board's face rule).
Loom.component("dev_git_graph", {
  version: 1,
  idea: "A branch and commit graph: one lane per branch with its name at the left, commits as dots in the order they were made, lines from each commit to its parents (curves where branches fork and merge), tags as small flags and a ring for where HEAD points; commits pop in on cue, a merge draws itself and HEAD travels.",
  outline: ["branch labels in a column at the left", "a faint guide per lane", "edges from parent to child (straight on a lane, curved between lanes)", "commit dots with short labels above", "tag flags under their commits", "HEAD ring and pointer"],
  family: "dev",
  tags: ["git", "branch", "merge", "commit graph", "rebase", "release branch", "hotfix", "trunk based development", "version control", "gitflow"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-004)",
  // a diagram: the screen styles and the drawing styles that teach with boxes and lines (D-193)
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint", "chalk-lab"],
  params: {
    branches: { type: "list", content: true },     // [{id, label, tone?}]
    commits: { type: "list", content: true },      // [{id, branch, parents: [ids], label?, tag?}], in the order they were made
    head: { type: "str" },                         // the commit HEAD points at
    headLabel: { type: "str" },                    // the pointer's word (none when omitted)
    w: { type: "number", default: 1500 },
    at: { type: "number", default: -1 },           // when the commits start popping in; -1: drawn complete and still
    stepX: { type: "number", default: 110 },       // the gap between commits (tightened to fit w)
    gap: { type: "number", default: 0.25 },        // seconds between commits when they pop in
    steps: { type: "list", default: [] },          // [{do: "commit", id, branch, parents, label, tag, at} | {do: "merge", from, into, id, label, at} | {do: "moveHead", id, at} | {do: "focus", branch, at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["lanes{id}", "commits{id}", "edges[]", "labels{id}", "tags{id}", "head", "commit(spec, t)", "merge(fromBranch, intoBranch, t)", "moveHead(id, t)", "focus(branchId, t)"],
  example: 'ctx.use("dev_git_graph", { branches: [{ id: "main", label: "main" }, { id: "fix", label: "hotfix/login" }], commits: [{ id: "a", branch: "main", parents: [] }, { id: "b", branch: "fix", parents: ["a"], label: "fix" }, { id: "c", branch: "main", parents: ["a", "b"], tag: "v2.0.1" }], head: "c", at: ctx.cue("merged back") }, { x: 210, y: 300, name: "graph" })',
  size: (p) => Loom.devKit.gitLayout(p).size,
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const L = DK.gitLayout(p), Z = L.Z;
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p), pen = DK.pen(ctx, eng);
    const outlined = S.outlined();
    const TONES = DK.tones();
    const field = S.c("field");
    const laneTok = {}, laneCol = {};
    L.branches.forEach((b, i) => { const t = b.tone && b.tone in S.pack.palette ? b.tone : TONES[i % TONES.length]; laneTok[b.id] = t; laneCol[b.id] = DK.legible(t, field, S.c("ink"), 3); });
    const parts = { lanes: {}, commits: {}, edges: [], labels: {}, tags: {}, head: null };
    const guideG = svg("g", {}, g), edgeG = svg("g", {}, g), dotG = svg("g", {}, g), wordG = svg("g", {}, g), headG = svg("g", {}, g);
    const r = L.r;
    // lanes and their labels
    L.branches.forEach((b) => {
      const y = L.laneY[b.id];
      const lg = svg("g", {}, guideG);
      K.line(lg, L.x0 - 18, y, p.w - 8, y, { stroke: "line", sw: 1.5, dash: "4 8", opacity: 0.45, crisp: true });
      parts.lanes[b.id] = lg;
      svg("rect", { x: 0, y: f1(y - 16), width: 6, height: 32, rx: 3, fill: laneCol[b.id] }, lg);
      parts.labels[b.id] = DK.word(ctx, wordG, b.label, { x: 16, y: y - L.lh / 2, w: L.labelW, h: L.lh, size: Z.fs, weight: 700, color: "ink", at: animated ? p.at : -1, eng, pen, name: `lane_${b.id}`, kind: "label" });
    });
    // edges and dots, in commit order
    const pos = (c) => ({ x: L.colX(c.col), y: L.laneY[c.branch] });
    const edgePath = (a, b) => (Math.abs(a.y - b.y) < 1 ? `M${f1(a.x + r)} ${f1(a.y)} L${f1(b.x - r)} ${f1(b.y)}`
      : `M${f1(a.x)} ${f1(a.y + (b.y > a.y ? r : -r))} C${f1(a.x)} ${f1(a.y + (b.y - a.y) * 0.75)} ${f1(a.x + (b.x - a.x) * 0.25)} ${f1(b.y)} ${f1(b.x - r)} ${f1(b.y)}`);
    const byId = {};
    function drawCommit(c, t) {
      byId[c.id] = c;
      const P = pos(c), col = laneCol[c.branch];
      const es = [];
      for (const pid of c.parents || []) {
        const pc = byId[pid];
        if (!pc) { Loom.error("component_params", `dev_git_graph: commit "${c.id}" names a parent "${pid}" that comes later or does not exist`); continue; }
        const A = pos(pc);
        // a fork takes the child's lane colour, a merge the colour of the lane it comes from
        const ecol = pc.branch === c.branch ? col : (c.parents.indexOf(pid) > 0 ? laneCol[pc.branch] : col);
        const e = svg("path", { d: edgePath(A, P), fill: "none", stroke: ecol, "stroke-width": 4, "stroke-linecap": "round" }, edgeG);
        if (t != null && t >= 0) {
          const len = e.getTotalLength ? e.getTotalLength() : 200;
          e.setAttribute("stroke-dasharray", `${f1(len)} ${f1(len + 10)}`);
          Loom.tween(e, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.3, ease: Loom.ease.move }, t - 0.3, DK.meta("draw", "git.edge"));
        }
        const E = { path: e, from: pid, to: c.id };
        parts.edges.push(E); es.push(E);
      }
      const dg = svg("g", {}, dotG);
      if (outlined) K.disc(dg, P.x, P.y, r, { fill: "none", stroke: laneTok[c.branch], sw: 4 });
      else { svg("circle", { cx: f1(P.x), cy: f1(P.y), r: r, fill: col }, dg); svg("circle", { cx: f1(P.x), cy: f1(P.y), r: r * 0.42, fill: S.c("surface") }, dg); }
      if ((c.parents || []).length > 1) svg("circle", { cx: f1(P.x), cy: f1(P.y), r: r + 6, fill: "none", stroke: col, "stroke-width": 2 }, dg);
      const C = { g: dg, x: P.x, y: P.y, id: c.id, branch: c.branch, edges: es };
      if (c.label && L.fitsLabel(c.label)) C.label = DK.word(ctx, wordG, c.label, { x: P.x - L.step / 2 + 2, y: P.y - r - 8 - L.lhS, w: L.step - 4, h: L.lhS, size: Z.small, color: "muted", align: "center", at: t, eng, pen, name: `commit_${c.id}`, kind: "label" });
      else if (c.label) Loom.warn("dev_git_label", `dev_git_graph: the label "${c.label}" of commit "${c.id}" is wider than the ${Math.round(L.step)} px between commits, so it is not drawn (widen w or shorten it)`);
      if (c.tag) {
        const tw = AK.measure(c.tag, "caption", Z.small, 600) + 44, th = L.pillH, ty = P.y + r + 10;
        const tg = svg("g", {}, wordG);
        svg("line", { x1: f1(P.x), y1: f1(P.y + r), x2: f1(P.x), y2: f1(ty), stroke: S.c("muted"), "stroke-width": 2 }, tg);
        if (pen) {
          // with the hand or the pen: the flag's outline in the pack's shape language, its word written by the engine
          const tw2 = AK.measure(c.tag, "caption", Z.small, 600) * L.engK + 20;
          K.rect(tg, P.x - 14, ty, tw2 + 44, th, { fill: "surface", r: th / 2, stroke: laneTok[c.branch], sw: 2 });
          AK.icon(tg, "tag", P.x + 2, ty + th / 2, Z.small, "ink");
          DK.word(ctx, wordG, c.tag, { x: P.x + 22, y: ty, w: tw2, h: th, size: Z.small, at: t, eng, pen, name: `tag_${c.id}`, kind: "label" });
        } else AK.pill(tg, P.x - 14, ty, c.tag, { size: Z.small, weight: 600, icon: "tag", fill: outlined ? "surface" : S.mix(S.c("surface"), col, 0.16), stroke: col, sw: 1.5, color: "ink" });
        C.tag = tg; parts.tags[c.id] = tg;
        if (t != null && t >= 0) AK.show(tg, t + 0.15, 0.25);
        void tw;
      }
      if (t != null && t >= 0) {
        Loom.drive((e) => dg.setAttribute("transform", `translate(${f1(P.x * (1 - e))} ${f1(P.y * (1 - e))}) scale(${f1(Math.max(0.001, e))})`), t, 0.28, "overshoot", DK.meta("reveal", "git.commit"));
      }
      parts.commits[c.id] = C;
      return C;
    }
    let t = animated ? p.at + 0.2 : -1;
    L.commits.forEach((c) => { drawCommit(c, animated ? t : -1); if (animated) t += p.gap; });
    let nextCol = L.commits.length;

    // HEAD: a ring around its commit and a pointer above (with its word only when the lesson gives one)
    const ring = svg("circle", { cx: 0, cy: 0, r: r + 11, fill: "none", stroke: S.c("ink"), "stroke-width": 3, "stroke-dasharray": "6 5" }, headG);
    // the pointer stands above the commit's own label, never on it
    const hp = svg("g", {}, headG);
    const ptr = svg("path", { d: `M0 ${-r - 16} l-9 -14 h18 Z`, fill: S.c("ink") }, hp);
    let headWord = null;
    // with the hand or the pen the word is written inside the pointer's own group, so it travels with HEAD
    if (p.headLabel) headWord = DK.word(ctx, hp, p.headLabel, { x: -90, y: -r - 30 - L.lhS - 2, w: 180, h: L.lhS, size: Z.small, weight: 700, align: "center", at: animated ? p.at : -1, eng, pen, parentG: hp, name: "head_label", kind: "label" });
    const lift = (C) => (C && C.label ? -(L.lhS + 8) : 0);
    const placeHead = (x, y, dy) => { headG.setAttribute("transform", `translate(${f1(x)} ${f1(y)})`); hp.setAttribute("transform", `translate(0 ${f1(dy)})`); };
    void ptr;
    parts.head = { g: headG, ring, label: headWord };
    const headAt = (id) => parts.commits[id];
    let cur = p.head && headAt(p.head);
    if (!cur) headG.setAttribute("opacity", 0);
    else {
      placeHead(cur.x, cur.y, lift(cur));
      if (animated) AK.show(headG, t + 0.1, 0.3);
    }

    // ---- state functions
    parts.commit = function (spec, at) {
      if (!spec || !spec.branch || !(spec.branch in L.laneY)) { Loom.error("component_params", `dev_git_graph: commit() needs a known branch (got ${spec && spec.branch})`); return at; }
      const branchCommits = Object.values(byId).filter((c) => c.branch === spec.branch);
      const c = Object.assign({ parents: branchCommits.length ? [branchCommits[branchCommits.length - 1].id] : [] }, spec, { col: nextCol++ });
      if (L.colX(c.col) > p.w - 10) Loom.warn("dev_git_wide", `dev_git_graph: commit "${c.id}" lands past the graph's width ${p.w} (widen w)`);
      drawCommit(c, at);
      return at + 0.3;
    };
    parts.merge = function (from, into, at, spec) {
      const last = (b) => { const cs = Object.values(byId).filter((c) => c.branch === b); return cs[cs.length - 1]; };
      const a = last(into), b = last(from);
      if (!a || !b) { Loom.error("component_params", `dev_git_graph: merge(${from}, ${into}) needs commits on both branches`); return at; }
      return parts.commit(Object.assign({ id: `merge_${from}_${into}_${nextCol}`, branch: into, parents: [a.id, b.id] }, spec || {}, { branch: into, parents: [a.id, b.id] }), at);
    };
    parts.moveHead = function (id, at) {
      const to = headAt(id);
      if (!to) return at;
      if (!cur) { placeHead(to.x, to.y, lift(to)); AK.show(headG, at, 0.3); cur = to; return at + 0.3; }
      const a = cur, la = lift(a), lb = lift(to);
      Loom.drive((e) => placeHead(a.x + (to.x - a.x) * e, a.y + (to.y - a.y) * e, la + (lb - la) * e), at, 0.6, "move", DK.meta("travel", "git.head"));
      cur = to;
      return at + 0.6;
    };
    parts.focus = function (branchId, at) {
      const dimOf = (b) => (b === branchId ? 1 : 0.28);
      const set = (node, op) => { if (at == null || at < 0) node.setAttribute("opacity", op); else Loom.tween(node, { opacity: 1 }, { opacity: op, duration: 0.3 }, at, DK.meta("state", "git.focus")); };
      for (const [b, lg] of Object.entries(parts.lanes)) set(lg, dimOf(b));
      for (const C of Object.values(parts.commits)) { set(C.g, dimOf(C.branch)); for (const E of C.edges) set(E.path, Math.max(dimOf(C.branch), dimOf(byId[E.from].branch)) === 1 && C.branch === branchId ? 1 : dimOf(C.branch)); if (C.tag) set(C.tag, dimOf(C.branch)); }
      return at == null || at < 0 ? at : at + 0.3;
    };
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "commit") parts.commit(st, st.at);
      else if (st.do === "merge") parts.merge(st.from, st.into, st.at, { id: st.id, label: st.label, tag: st.tag });
      else if (st.do === "moveHead") parts.moveHead(st.id, st.at);
      else if (st.do === "focus") parts.focus(st.branch, st.at);
      else Loom.error("component_params", `dev_git_graph: step "${st.do}" is not commit, merge, moveHead or focus`);
    }
    return parts;
  },
});

// the graph's geometry, shared by size() and build(): label column, lanes, columns (on the dev kit, so both see it)
Loom.devKit.gitLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, Z = DK.ui().Z;
  const branches = (p.branches || []).map((b, i) => (typeof b === "string" ? { id: b, label: b } : Object.assign({ id: "b" + i }, b, { label: String(b.label == null ? b.id : b.label) })));
  const known = new Set(branches.map((b) => b.id));
  const commits = (p.commits || []).map((c, i) => Object.assign({}, c, { id: String(c.id == null ? "c" + i : c.id), parents: (c.parents || []).map(String), col: i }));
  for (const c of commits) if (!known.has(c.branch)) Loom.error("component_params", `dev_git_graph: commit "${c.id}" is on an unknown branch "${c.branch}"`);
  const extra = (p.steps || []).filter((s) => s && (s.do === "commit" || s.do === "merge")).length;
  const lh = AK.lineH(Z.fs, "caption", 700), lhS = AK.lineH(Z.small, "caption", 400), r = 13;
  const pillH = Math.ceil(Loom.kit.vmetrics("caption", Z.small, 600).ascent + Loom.kit.vmetrics("caption", Z.small, 600).descent) + 16;
  const hasLabels = commits.some((c) => c.label) || (p.steps || []).some((s) => s && s.label);
  const hasTags = commits.some((c) => c.tag) || (p.steps || []).some((s) => s && s.tag);
  // the whiteboard hand and the blueprint pen letter wider than the face the kit measures: their labels get the room
  let engK = 1;
  try { const e = p.engine !== "off" && Loom.engines && Loom.engines.current && Loom.engines.current(); if (e && e.id === "whiteboard") engK = 1.75; else if (e && e.id === "blueprint") engK = 1.4; } catch (e) { engK = 1; }
  const labelW = Math.min(p.w * 0.34, Math.max(80, ...branches.map((b) => AK.measure(b.label, "caption", Z.fs, 700) * engK + 6)));
  const x0 = 16 + labelW + 40 + r;
  const n = Math.max(1, commits.length + extra);
  const step = Math.max(34, Math.min(p.stepX, (p.w - x0 - r - 16) / Math.max(1, n - 1)));
  const above = (hasLabels ? lhS + 8 : 0) + r + 8, below = r + 10 + (hasTags ? pillH + 8 : 8);
  const laneH = Math.max(lh + 16, above + below);
  const top = (hasLabels ? lhS + 8 : 0) + r + 34 + (p.headLabel ? lhS + 4 : 0) + 4;
  const laneY = {};
  branches.forEach((b, i) => { laneY[b.id] = top + i * laneH; });
  const h = top + Math.max(0, branches.length - 1) * laneH + below + 6;
  return { Z, branches, commits, lh, lhS, r, pillH, labelW, x0, step, laneH, laneY, colX: (k) => x0 + k * step,
    engK, fitsLabel: (s) => AK.measure(String(s), "caption", Z.small, 400) * engK + 8 <= step - 4, size: { w: p.w, h } };
};
