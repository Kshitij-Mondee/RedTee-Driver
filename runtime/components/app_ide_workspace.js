// T-162 app_ide_workspace: a generic developer workspace (hand-off sheet, Family M). Built on runtime/components/_app_kit.js.
// In the screencast style with its engine, the editor and the terminal ARE the engine's code and terminal regions
// (W.app with kind "code" and "terminal", the file tree as its nav, one page a file): no second editor is drawn. In every
// other style the workspace draws its own, with a small tokenizer for syntax colour (no library at runtime).
Loom.component("app_ide_workspace", {
  version: 1,
  idea: "A developer's workspace: a file tree, editor tabs, code with syntax colour and line numbers, a terminal and a problems list, a source control panel and a debug toolbar, walked through by a pointer that opens a file, runs a command, steps through code in the debugger and commits a change.",
  outline: ["window (or the screencast engine's app window)", "activity bar: files, search, source control with a count, debug", "side panel: the file tree with change marks (or the source control panel)", "editor tabs", "code editor: line numbers, breakpoints, syntax colour, the current line", "bottom panel: terminal and problems", "status bar: branch and problem counts", "debug toolbar (while debugging)", "pointer"],
  family: "dev",
  tags: ["ide", "code editor", "developer", "terminal", "debugger", "git", "source control", "vs code-like", "programming", "devops"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-162)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop"],   // a product UI: the styles that show products as screens (D-193)
  params: {
    files: { type: "list", content: true },      // [{id, path ("src/api/pay.ts"), lang: js|ts|py|yaml|json|bash|go|sql|text, lines: [code lines], changed: "M"|"A"|"D"}]
    open: { type: "list" },                      // ids of the files open as tabs (the first file when omitted)
    active: { type: "str" },                     // the tab showing (the first open one when omitted)
    terminal: { type: "list" },                  // the terminal's history: [{cmd} | output string | {out, tone: "ok"|"warn"|"error"|"muted"}]
    problems: { type: "list" },                  // [{file, line, text, severity: "error"|"warning"}]
    breakpoints: { type: "list" },               // [{file, line}]
    branch: { type: "str" },                     // the git branch in the status bar
    prompt: { type: "str" },                     // the terminal prompt (a sigil alone when omitted)
    panel: { type: "enum", choices: ["terminal", "problems"], default: "terminal" },
    title: { type: "str" },
    labels: { type: "obj" },                     // the product's words, each optional: {terminal, problems, changes, message, commit, committed}
    state: { type: "enum", choices: ["ready", "loading", "error"], default: "ready" },
    notice: { type: "str" },
    steps: { type: "list", default: [] },        // [{do: "openFile"|"run"|"debug"|"commit"|"state", at, ...}]
    theme: { type: "obj", default: {} }, layout: { type: "obj", default: {} },   // layout: {treeW, panelH}
    w: { type: "number", default: 1728 }, h: { type: "number", default: 856 },
    at: { type: "number", default: -1 }, cps: { type: "number", default: 14 },
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["host", "app (the engine app, in the screencast style)", "activity", "tree", "tabs", "editors", "terminal", "problems", "status", "debugBar", "gitPanel", "states",
    "openFile(id, at)", "run(cmd, output, at)", "debug(lines, at)", "commit(message, at)", "setState(name, at)"],
  example: 'ctx.use("app_ide_workspace", { files: [{ id: "cfg", path: "deploy/values.yaml", lang: "yaml", lines: ["replicas: 2", "image: shop-api:1.4"] }], terminal: [{ cmd: "kubectl get pods" }], branch: "main", steps: [{ do: "run", cmd: "kubectl apply -f deploy/", output: ["deployment configured"], at: ctx.cue("apply the change") }] }, { x: 96, y: 78, name: "ide" })',
  size: (p) => ({ w: p.w, h: p.h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, svg = (t, a, q) => Loom.svg(t, a, q), S = Loom.style;
    const T = AK.theme(p.theme), Z = AK.sizes(T), tones = AK.tones(T), L = p.labels || {}, LY = p.layout || {};
    const files = p.files.map((f, i) => Object.assign({ id: f.id || "f" + i, lang: "text", lines: [] }, f));
    const byId = (id) => files.find((f) => f.id === id);
    const name = (f) => String(f.path || f.id).split("/").pop();
    const openIds = (p.open && p.open.length ? p.open : [files[0].id]).filter((id) => byId(id));
    let active = p.active && openIds.includes(p.active) ? p.active : openIds[0];

    // ================================================================ the screencast engine: its own code and terminal regions
    const eng = p.engine !== "off" && Loom.engines && Loom.engines.current ? Loom.engines.current() : null;
    // the engine's code editor has no loading or error screen, so a workspace that shows one draws itself, in this style too
    const stated = (p.state && p.state !== "ready") || (p.steps || []).some((st) => st && (st.do === "state" || st.do === "setState"));
    if (eng && eng.id === "screencast" && eng.api && eng.api.app && !stated) return engineIDE(eng.api);
    function engineIDE(W) {
      const el = g && g.closest ? g.closest("g.lm-el") : null, E = el && el.__E;
      // the engine ellipsises a label at any letter and lets tabs run past the window, so labels arrive already cut at a
      // word boundary (file names at a separator) to the engine's own widths: sidebar 300, nav row 300 - 28, tab + 36
      const UI = Object.assign({ ui_text: 21, ui_small: 20 }, (S.pack && S.pack.screencast) || {}), SW = 300;
      const tail = (str, size, w) => { const segs = String(str).split("/"); let lab = String(str); for (let k = 1; k < segs.length && AK.measure(lab, "caption", size, 600) > w; k++) lab = "…/" + segs.slice(k).join("/"); return AK.fitWords(lab, "caption", size, 600, w); };
      const nav = [];
      if (p.branch) nav.push({ section: AK.fitWords(p.branch, "caption", UI.ui_small, 600, SW - 60) });
      let lastDir = null;
      files.slice(0, 7).forEach((f) => {
        const dir = String(f.path || "").split("/").slice(0, -1).join("/");
        if (dir && dir !== lastDir) { nav.push({ section: tail(dir, UI.ui_small, SW - 60) }); lastDir = dir; }
        nav.push({ id: f.id, label: AK.fitWords(name(f), "caption", UI.ui_text, 600, SW - 28 - 58 - (f.changed ? 56 : 0) - 4), icon: "file-code", count: f.changed || undefined });
      });
      const tabLab = (id) => AK.fitWords(name(byId(id)), "caption", UI.ui_text, 600, 300);
      // the tabs that fit the editor's width, the showing one always among them
      const tabsFor = (cur) => {
        const room = p.w - SW - 64, list = openIds.concat(openIds.includes(cur) ? [] : [cur]), out = [];
        let used = 0;
        for (const id of list) { const w = AK.measure(tabLab(id), "caption", UI.ui_text, 600) + 44; if (used + w > room) break; out.push(id); used += w; }
        if (!out.includes(cur)) { while (out.length && used + AK.measure(tabLab(cur), "caption", UI.ui_text, 600) + 44 > room) used -= AK.measure(tabLab(out.pop()), "caption", UI.ui_text, 600) + 44; out.push(cur); }
        return out.map((id) => ({ id, label: tabLab(id) }));
      };
      // the problems list's item text width: the list takes 0.38 of the content row (window - sidebar - 64 margins - 22 gap),
      // its text starts 82 in and keeps 24 at the right
      const probTW = (p.w - SW - 64 - 22) * 0.38 - 106 - 4;
      const pages = {}, idx = {};
      files.forEach((f, i) => {
        idx[f.id] = i;
        const content = [{ id: "code_" + i, kind: "code", lang: f.lang, lines: f.lines }];
        const bottom = [{ id: "term_" + i, kind: "terminal", prompt: p.prompt, lines: p.terminal || [], w: (p.problems || []).length ? 0.62 : 1, h: 230 }];
        if ((p.problems || []).length) bottom.push({ id: "prob_" + i, kind: "list", title: L.problems, items: p.problems.slice(0, 3).map((q, k) => ({ id: String(k), title: AK.fitWords(q.text, "caption", UI.ui_text, 600, probTW), sub: AK.fitWords([name(byId(q.file) || {}), q.line != null ? String(q.line) : null].filter(Boolean).join(" "), "caption", 20, 400, probTW), icon: q.severity === "warning" ? "triangle-alert" : "circle-x", tone: q.severity === "warning" ? "warn" : "neg" })), w: 0.38, h: 230 });
        content.push(bottom);
        pages[f.id] = { tabs: { items: tabsFor(f.id), active: f.id }, content };
      });
      const A = W.app(ctx, ((E && E.name) || "ide") + "_app", { chrome: "window", title: p.title, frame: { x: E ? E.x : 0, y: E ? E.y : 0, w: p.w, h: p.h }, nav, active, pages, start: active }, { at: p.at >= 0 ? p.at : 0 });
      let cur = active, shown = false;
      const at0 = (t) => (t == null ? undefined : t);
      const pointer = (t) => { if (!shown) { shown = true; A.pointer(Math.max(0, (t || 0.4) - 1.2)); } };
      const X = {};
      X.openFile = function (id, at) {
        if (!pages[id] || id === cur) return at || 0;
        pointer(at);
        const t = nav.find((n) => n.id === id) ? A.click("nav." + id, { at: at0(at), go: id }) : (A.go(id, at || 0), (at || 0) + 0.4);
        cur = id;
        return t;
      };
      X.run = function (cmd, out, at) {
        pointer(at);
        const t = A.run("term_" + idx[cur], cmd, { at: at0(at), prompt: p.prompt });
        return out && out.length ? A.out("term_" + idx[cur], out, { at: t + 0.15, gap: 0.22 }) : t;
      };
      X.debug = function (lines, at) {
        let t = at == null ? 0.6 : at;
        for (const n of [].concat(lines || [])) { A.highlight("code_" + idx[cur], n, { at: t, until: t + 0.9 }); t += 0.9; }
        return t;
      };
      X.commit = function (message, at) {
        pointer(at);
        let t = A.dialog({ title: L.commit || "", fields: [{ id: "msg", label: L.message || "", kind: "text" }], actions: [{ id: "ok", label: L.commit || "", kind: "primary" }] }, { at: at0(at) });
        t = A.type("dialog.msg", message, { at: t + 0.4 });
        t = A.click("dialog.action.ok", { at: t + 0.5 });
        A.closeDialog(t + 0.1);
        return L.committed ? A.toast(L.committed, { at: t + 0.3 }) : t + 0.3;
      };
      X.setState = (s, at) => at || 0;
      X.state = X.setState;
      AK.runSteps(X, p.steps, { openFile: ["id", "at"], run: ["cmd", "output", "at"], debug: ["lines", "at"], commit: ["message", "at"], state: ["state", "at"] });
      return Object.assign({ app: A }, X);
    }

    // ================================================================ every other style: the workspace draws itself
    const H = AK.host(ctx, g, p, { T, Z, title: p.title });
    const B = H.body, BW = B.w, BH = B.h, pad = Z.pad, root = B.g;
    AK.box(root, 0, 0, BW, BH, { r: 0, fill: tones.card });
    const CS = Z.fs, cw = AK.monoW(CS), LH = Math.round(AK.lineH(CS, "mono") * 1.12);
    // syntax colours from pack tokens (a mix of two where a kind needs its own shade), never literals
    const SYN = { plain: S.c("ink"), punct: S.c("muted"), keyword: S.c(T.accent), string: S.c("pos"), number: S.c("accent4"), comment: AK.mix("muted", "surface", 0.1),
      fn: AK.mix("accent4", "ink", 0.4), type: AK.mix("pos", T.accent, 0.5), key: AK.mix("neg", "ink", 0.35), flag: S.c("accent3"), var: S.c(T.accent) };
    const KW = {
      js: "const let var function return if else for while do switch case break continue new class extends import from export default async await try catch finally throw typeof instanceof in of this null undefined true false",
      py: "def return if elif else for while in not and or import from as class try except finally raise with lambda yield None True False pass break continue async await is",
      go: "func return if else for range package import var const type struct interface map chan go defer select case switch nil true false",
      sql: "select from where and or insert into values update set delete create table join left right inner on group by order having limit as null not",
      bash: "if then else fi for do done while case esac function export echo cd sudo",
    };
    KW.ts = KW.js + " interface type enum implements readonly private public protected";
    const kwSet = {}; for (const k in KW) kwSet[k] = new Set(KW[k].split(" "));
    // a line into [[text, colour]] runs: comments, strings, numbers, keywords, function names, keys
    function tokenize(s, lang) {
      const out = [], push = (t, k) => { if (t) out.push([t, SYN[k] || SYN.plain]); };
      const kws = kwSet[lang === "sh" ? "bash" : lang] || new Set();
      if ((lang === "yaml") && /^\s*[\w.-]+:/.test(s)) { const m = s.match(/^(\s*)([\w.-]+)(:)(.*)$/); push(m[1], "plain"); push(m[2], "key"); push(m[3], "punct"); s = m[4]; }
      // a comment opens with the language's own marker only, so a URL in YAML or a flag in shell stays code
      const cm = { js: "\\/\\/.*$", ts: "\\/\\/.*$", go: "\\/\\/.*$", py: "#.*$", yaml: "#.*$", bash: "#.*$", sh: "#.*$", sql: "--.*$" }[lang] || "(?!)";
      const re = new RegExp("(" + cm + ")|(\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'|`[^`]*`)|(\\b\\d[\\d_.]*\\b)|([A-Za-z_$][\\w$]*)|(\\s+)|(.)", "g");
      let m;
      while ((m = re.exec(s))) {
        if (m[1]) { push(m[1], "comment"); break; }
        else if (m[2]) push(m[2], lang === "json" && /^\s*:/.test(s.slice(re.lastIndex)) ? "key" : "string");
        else if (m[3]) push(m[3], "number");
        else if (m[4]) push(m[4], kws.has(m[4]) ? "keyword" : /^\s*\(/.test(s.slice(re.lastIndex)) ? "fn" : /^[A-Z]/.test(m[4]) && lang !== "text" ? "type" : "plain");
        else if (m[5]) push(m[5], "plain");
        else push(m[6], lang === "bash" && m[6] === "-" ? "flag" : "punct");
      }
      return out;
    }

    // ---------------------------------------------------------------- activity bar, side panel
    const AW = 64, TW = Math.round(LY.treeW || AK.clamp(BW * 0.17, 240, 320)), SBH = AK.boxH(Z.small, "caption", 600, 40);
    const act = svg("g", {}, root);
    AK.box(act, 0, 0, AW, BH - SBH, { r: 0, fill: AK.mix(T.sidebar, "field2", 0.5) });
    const changedN = files.filter((f) => f.changed).length;
    const ACT = [["files", "files"], ["search", "search"], ["git", "git-branch"], ["debug", "bug-play"]];
    const actBtns = {};
    ACT.forEach(([id, ic], i) => {
      const y = 12 + i * 60, bg = svg("g", {}, act);
      const on = AK.box(bg, 0, y, 4, 48, { r: 0, fill: T.accent, opacity: id === "files" ? 1 : 0 });
      AK.icon(bg, ic, AW / 2, y + 24, 26, id === "files" ? "ink" : "muted");
      if (id === "git" && changedN) { const SD = AK.solid(T.accent); svg("circle", Object.assign({ cx: AW / 2 + 14, cy: y + 12, r: 11, fill: S.c(SD.fill) }, SD.stroke ? { stroke: S.c(SD.stroke), "stroke-width": SD.sw } : {}), bg); AK.T(bg, String(changedN), { x: AW / 2 + 3, y: y + 1, w: 22, h: 22, size: Z.small, weight: 700, align: "center", color: SD.fg }); }
      actBtns[id] = { g: bg, x: 0, y, w: AW, h: 48, on };
    });
    const side = svg("g", {}, root);
    AK.box(side, AW, 0, TW, BH - SBH, { r: 0, fill: tones.side });
    AK.box(side, AW + TW - 1, 0, 1.5, BH - SBH, { r: 0, fill: tones.hair2 });
    const treeG = svg("g", {}, side), tree = {};
    const rowH = AK.boxH(Z.fs, "caption", 400, Math.round(LH + 6));
    {
      let y = 10, lastDir = null;
      for (const f of files) {
        // compact folders: one row names the whole folder path, its files sit one step in, so deep paths keep their names
        const parts = String(f.path || f.id).split("/"), dir = parts.slice(0, -1).join("/"), depth = dir ? 1 : 0;
        if (y + rowH > BH - SBH - 6) break;
        if (dir && dir !== lastDir) {
          AK.icon(treeG, "chevron-down", AW + 16 + 8, y + rowH / 2, 16, "muted");
          AK.icon(treeG, "folder-open", AW + 16 + 30, y + rowH / 2, 20, "muted");
          // a long folder path keeps its last segments (the ones nearest its files) behind an ellipsis
          const segs = dir.split("/");
          let lab = dir;
          for (let k = 1; k < segs.length && AK.measure(lab, "caption", Z.fs, 600) > TW - 82; k++) lab = "…/" + segs.slice(k).join("/");
          AK.T(treeG, lab, { x: AW + 16 + 46, y, w: TW - 78, h: rowH, size: Z.fs, weight: 600 });
          y += rowH; lastDir = dir;
          if (y + rowH > BH - SBH - 6) break;
        }
        const x = AW + 16 + 30 + depth * 16, rg = svg("g", {}, treeG);
        const sel = AK.box(rg, AW + 4, y, TW - 8, rowH, { r: 6, fill: tones.sel, opacity: f.id === active ? 1 : 0 });
        AK.icon(rg, "file-code", x, y + rowH / 2, 20, f.id === active ? T.accent : "muted");
        const tone = f.changed === "A" ? "pos" : f.changed === "D" ? "neg" : "accent4";
        const mw = f.changed ? 26 : 0;
        AK.T(rg, name(f), { x: x + 16, y, w: AW + TW - x - 28 - mw, h: rowH, size: Z.fs, color: f.changed ? tone : "ink" });
        if (f.changed) AK.T(rg, f.changed, { x: AW + TW - 32, y, w: 22, h: rowH, size: Z.small, weight: 700, color: tone, align: "center" });
        tree[f.id] = { g: rg, x: AW + 4, y, w: TW - 8, h: rowH, sel };
        y += rowH;
      }
    }

    // ---------------------------------------------------------------- editor: tabs and one editor a file
    const EX = AW + TW, EW = BW - EX;
    const tabH = AK.boxH(Z.fs, "caption", 600, 48);
    const panelH = Math.round(LY.panelH || AK.clamp((BH - SBH) * 0.32, 180, 300));
    const edTop = tabH, edBot = BH - SBH - panelH;
    const tabsG = svg("g", {}, root);
    AK.box(tabsG, EX, 0, EW, tabH, { r: 0, fill: AK.mix(T.card, "field2", 0.4) });
    AK.box(tabsG, EX, tabH - 1, EW, 1.5, { r: 0, fill: tones.hair2 });
    const tabs = {};
    let tabX = EX;
    function addTab(id, t) {
      const f = byId(id), w = Math.min(280, Math.ceil(AK.measure(name(f), "caption", Z.fs, 600) + 70));
      if (tabX + w > BW) return null;
      const tg = svg("g", t == null ? {} : { opacity: 0 }, tabsG);
      const on = svg("g", { opacity: id === active ? 1 : 0 }, tg);
      AK.box(on, tabX, 0, w, tabH, { r: 0, fill: tones.card });
      AK.box(on, tabX, 0, w, 3, { r: 0, fill: T.accent });
      AK.icon(tg, "file-code", tabX + 22, tabH / 2, 18, "muted");
      AK.T(tg, name(f), { x: tabX + 38, y: 0, w: w - 50, h: tabH, size: Z.fs, weight: 600 });
      AK.box(tg, tabX + w - 1, 8, 1, tabH - 16, { r: 0, fill: tones.hair2 });
      tabs[id] = { g: tg, on, x: tabX, y: 0, w, h: tabH };
      tabX += w;
      if (t != null) AK.show(tg, t, 0.15);
      return tabs[id];
    }
    openIds.forEach((id) => addTab(id));
    const bps = p.breakpoints || [];
    const editors = {};
    function editor(f) {
      if (editors[f.id]) return editors[f.id];
      const eg = svg("g", { opacity: f.id === active ? 1 : 0 }, root);
      AK.box(eg, EX, edTop, EW, edBot - edTop, { r: 0, fill: tones.card });
      const n0 = f.lines.length, numW = String(Math.max(1, n0)).length * AK.monoW(Z.small) + 46;
      const gx = EX + numW, cx0 = gx + 18, room = EW - numW - 36;
      const rows = [];
      const fitN = Math.max(1, Math.floor((edBot - edTop - 16) / LH));
      f.lines.slice(0, fitN).forEach((s, i) => {
        const y = edTop + 8 + i * LH, rg = svg("g", {}, eg);
        const hl = AK.box(rg, EX, y, EW, LH, { r: 0, fill: AK.mix(T.card, "accent4", 0.2), opacity: 0 });
        const isBp = bps.some((b) => b.file === f.id && b.line === i + 1);
        if (isBp) svg("circle", { cx: EX + 16, cy: y + LH / 2, r: 7, fill: S.c("neg") }, rg);
        const arrow = svg("g", { opacity: 0 }, rg);
        AK.icon(arrow, "arrow-right", EX + 16, y + LH / 2, 18, "accent4");
        AK.mono(rg, [[String(i + 1), S.c("muted")]], { x: gx - 10 - AK.measure(String(i + 1), "mono", Z.small, 400), y, h: LH, size: Z.small });
        const M = s ? AK.mono(rg, tokenize(String(s), f.lang), { x: cx0, y, h: LH, size: CS, w: room }) : null;
        rows.push({ g: rg, y, hl, arrow, M, n: i + 1 });
      });
      AK.box(eg, gx, edTop, 1, edBot - edTop, { r: 0, fill: tones.hair });
      editors[f.id] = { g: eg, rows, f, cx0 };
      return editors[f.id];
    }
    editor(byId(active));

    // ---------------------------------------------------------------- bottom panel: terminal and problems; status bar
    const panG = svg("g", {}, root);
    AK.box(panG, EX, edBot, EW, panelH, { r: 0, fill: tones.card });
    AK.box(panG, EX, edBot, EW, 1.5, { r: 0, fill: tones.hair2 });
    const ptH = AK.boxH(Z.small, "caption", 600, 40);
    const ptabs = {};
    let px = EX + pad;
    for (const [id, ic] of [["terminal", "square-terminal"], ["problems", "circle-alert"]]) {
      const lab = L[id], cnt = id === "problems" && (p.problems || []).length ? ` ${p.problems.length}` : "";
      const w = lab ? AK.measure(lab + cnt, "caption", Z.small, 600) + 52 : 44;
      const tg = svg("g", {}, panG), on = svg("g", { opacity: id === p.panel ? 1 : 0 }, tg);
      AK.box(on, px + 4, edBot + ptH - 3, w - 8, 3, { r: 1, fill: T.accent });
      AK.icon(tg, ic, px + 18, edBot + ptH / 2, 18, "muted");
      if (lab) AK.T(tg, lab + cnt, { x: px + 34, y: edBot, w: w - 36, h: ptH, size: Z.small, weight: 600, color: "muted" });
      ptabs[id] = { g: tg, on, x: px, y: edBot, w, h: ptH };
      px += w + 8;
    }
    const DT = AK.darkTok(), termBg = AK.c(DT), termInk = AK.c(AK.onHex(termBg));
    const termTone = { ok: AK.mix("pos", "surface", 0.3), warn: AK.mix("accent4", "surface", 0.3), error: AK.mix("neg", "surface", 0.3), muted: AK.mix(AK.onHex(termBg), DT, 0.4) };
    const termG = svg("g", { opacity: p.panel === "terminal" ? 1 : 0 }, panG);
    const tY = edBot + ptH + 4, tH = panelH - ptH - 10;
    AK.box(termG, EX + 10, tY, EW - 20, tH, { r: Math.min(T.radius, 10), fill: termBg });
    const clipId = Loom.uid ? Loom.uid("ideterm") : "ideterm";
    const cp = svg("clipPath", { id: clipId }, termG); svg("rect", { x: EX + 10, y: tY + 8, width: EW - 20, height: tH - 12 }, cp);
    const termBody = svg("g", { "clip-path": `url(#${clipId})` }, termG), termScroll = svg("g", {}, termBody);
    const TS = Z.small, TLH = AK.lineH(TS, "mono") + 4, termRows = Math.max(1, Math.floor((tH - 16) / TLH));
    const prompt = p.prompt == null ? "$" : String(p.prompt);
    const tLines = [];
    const promptSegs = () => [[prompt + " ", AK.mix("pos", "surface", 0.3), 700]];
    function termLine(ln, t) {
      const k = tLines.length, y = tY + 10 + k * TLH, lg = svg("g", t == null ? {} : { opacity: 0 }, termScroll);
      const o = typeof ln === "string" ? { out: ln } : ln || {};
      let M = null;
      if (o.cmd != null) { const pm = AK.mono(lg, promptSegs(), { x: EX + 26, y, h: TLH, size: TS }); M = AK.mono(lg, [[String(o.cmd), termInk]], { x: EX + 26 + pm.w, y, h: TLH, size: TS, w: EW - 60 - pm.w }); }
      else { const tone = o.tone || (/\b(error|failed|denied)\b/i.test(o.out) ? "error" : /\bwarn(ing)?\b/i.test(o.out) ? "warn" : /\b(passed|done|ready|ok)\b/i.test(o.out) ? "ok" : null); M = AK.mono(lg, [[String(o.out), tone ? termTone[tone] : termInk]], { x: EX + 26, y, h: TLH, size: TS, w: EW - 60 }); }
      tLines.push({ g: lg, M, y });
      return { g: lg, M, k };
    }
    const hist = (p.terminal || []).slice(-termRows);
    hist.forEach((ln) => termLine(ln));
    let termShift = 0, gone = 0;
    const follow = (t) => {
      const over = tLines.length - termRows;
      if (over > 0 && over * TLH !== -termShift) { termShift = -over * TLH; AK.shift(termScroll, 0, termShift, t, 0.15); }
      for (; gone < over; gone++) AK.hide(tLines[gone].g, t, 0.1);
    };
    const probG = svg("g", { opacity: p.panel === "problems" ? 1 : 0 }, panG);
    (p.problems || []).forEach((q, i) => {
      const y = tY + i * (Z.lh + 8);
      if (y + Z.lh > edBot + panelH - 6) return;
      AK.icon(probG, q.severity === "warning" ? "triangle-alert" : "circle-x", EX + 30, y + Z.lh / 2, 20, q.severity === "warning" ? "accent4" : "neg");
      const where = [name(byId(q.file) || { id: q.file || "" }), q.line != null ? String(q.line) : null].filter(Boolean).join(" ");
      const ww = where ? AK.measure(where, "caption", Z.small) + 20 : 0;
      AK.T(probG, q.text || "", { x: EX + 50, y, w: EW - 90 - ww, h: Z.lh, size: Z.fs });
      if (where) AK.T(probG, where, { x: EX + EW - 30 - ww, y, w: ww, h: Z.lh, size: Z.small, color: "muted", align: "right" });
    });
    const panes = AK.states({ terminal: termG, problems: probG }, p.panel);
    const status = svg("g", {}, root);
    const SB = AK.solid(T.accent), onA = SB.fg;
    AK.box(status, 0, BH - SBH, BW, SBH, { r: 0, fill: S.outlined() ? tones.side : SB.fill });
    if (S.outlined()) AK.box(status, 0, BH - SBH, BW, 2, { r: 0, fill: T.accent });
    let sx = 16;
    if (p.branch) { AK.icon(status, "git-branch", sx + 10, BH - SBH / 2, 18, onA); AK.T(status, p.branch, { x: sx + 26, y: BH - SBH, w: 300, h: SBH, size: Z.small, weight: 600, color: onA }); sx += AK.measure(p.branch, "caption", Z.small, 600) + 60; }
    const errN = (p.problems || []).filter((q) => q.severity !== "warning").length, warnN = (p.problems || []).length - errN;
    AK.icon(status, "circle-x", sx + 10, BH - SBH / 2, 18, onA); AK.T(status, String(errN), { x: sx + 24, y: BH - SBH, w: 40, h: SBH, size: Z.small, weight: 600, color: onA });
    AK.icon(status, "triangle-alert", sx + 70, BH - SBH / 2, 18, onA); AK.T(status, String(warnN), { x: sx + 84, y: BH - SBH, w: 40, h: SBH, size: Z.small, weight: 600, color: onA });
    // the debug toolbar (hidden until debugging)
    const DBH = Math.max(40, tabH - 8), dbg = svg("g", { opacity: 0 }, B.over), DBW = 6 * 44 + 24, DBX = BW - DBW - 12, DBY = (tabH - DBH) / 2;
    AK.box(dbg, DBX, DBY + 3, DBW, DBH, { r: 10, fill: tones.shadow, opacity: 0.14 });
    AK.box(dbg, DBX, DBY, DBW, DBH, { r: 10, fill: "surface", stroke: tones.hair2 });
    const DBTN = [["grip-vertical", "muted"], ["play", "pos"], ["redo-dot", T.accent], ["arrow-down-to-dot", T.accent], ["rotate-ccw", "pos"], ["square", "neg"]];
    const dbtn = DBTN.map(([ic, tn], i) => { AK.icon(dbg, ic, DBX + 12 + 22 + i * 44, DBY + DBH / 2, 22, tn); return { x: DBX + 12 + i * 44, y: DBY, w: 44, h: DBH }; });
    // the source control panel (shown by commit)
    const gitG = svg("g", { opacity: 0 }, side);
    {
      AK.box(gitG, AW, 0, TW - 1, BH - SBH, { r: 0, fill: tones.side });
      let y = 14;
      if (L.changes) { AK.T(gitG, L.changes, { x: AW + 16, y, w: TW - 32, h: Z.lhS, size: Z.small, weight: 700, color: "muted" }); y += Z.lhS + 8; }
      const fh = AK.boxH(Z.fs, "caption", 400, Z.ctl);
      var gitField = AK.field(gitG, AW + 12, y, TW - 24, fh, { placeholder: L.message, T, Z });
      y += fh + 10;
      var gitBtn = AK.button(gitG, AW + 12, y, { label: L.commit, icon: "check", kind: "primary", T, Z });
      y += Z.ctl + 14;
      var gitList = svg("g", {}, gitG);
      files.filter((f) => f.changed).forEach((f, i) => {
        const yy = y + i * rowH;
        if (yy + rowH > BH - SBH - 6) return;
        const tone = f.changed === "A" ? "pos" : f.changed === "D" ? "neg" : "accent4";
        AK.icon(gitList, "file-code", AW + 28, yy + rowH / 2, 18, "muted");
        AK.T(gitList, name(f), { x: AW + 44, y: yy, w: TW - 90, h: rowH, size: Z.fs });
        AK.T(gitList, f.changed, { x: AW + TW - 36, y: yy, w: 22, h: rowH, size: Z.small, weight: 700, color: tone, align: "center" });
      });
    }
    // states
    const cover = (gg) => AK.box(gg, EX, 0, EW, BH - SBH, { r: 0, fill: tones.card });
    const loadG = svg("g", {}, root); cover(loadG);
    for (let k = 0; k < 10; k++) AK.box(loadG, EX + 70, tabH + 14 + k * LH, (EW - 120) * (0.3 + ((k * 37) % 50) / 100), LH - 12, { r: 6, fill: tones.track });
    const errG = svg("g", {}, root); cover(errG);
    AK.icon(errG, "circle-alert", EX + EW / 2, (BH - SBH) * 0.4, 60, "neg");
    if (p.notice) AK.P(errG, p.notice, { x: EX + EW * 0.2, y: (BH - SBH) * 0.4 + 50, w: EW * 0.6, size: Z.fs, maxLines: 3, color: "muted", align: "center" });
    const states = AK.states({ ready: svg("g", {}, root), loading: loadG, error: errG }, p.state || "ready");

    // ---------------------------------------------------------------- actions
    const at0 = (t) => (t == null ? Math.max(H.free + 0.4, p.at >= 0 ? p.at + 0.6 : 0.4) : t);
    const X = {};
    let sideMode = "files";
    const showSide = (mode, t) => {
      if (mode === sideMode) return t;
      const tp = H.click(actBtns[mode === "git" ? "git" : "files"], t, { fx: 0.5 });
      AK.hide(actBtns[sideMode].on, tp + 0.05, 0.1); AK.show(actBtns[mode].on, tp + 0.05, 0.1);
      if (mode === "git") AK.show(gitG, tp + 0.08, 0.2); else AK.hide(gitG, tp + 0.08, 0.2);
      sideMode = mode;
      return tp + 0.35;
    };
    X.openFile = function (id, at) {
      const f = byId(id);
      if (!f) { Loom.error("component_params", `app_ide_workspace.openFile: no file "${id}"`); return at0(at); }
      let t = showSide("files", at0(at));
      if (id === active) return t;
      const R = tree[id];
      const tp = R ? H.click(R, t, { fx: 0.4 }) : t;
      if (R) { AK.show(R.sel, tp + 0.05, 0.12); if (tree[active]) AK.hide(tree[active].sel, tp + 0.05, 0.12); }
      const Tn = tabs[id] || addTab(id, tp + 0.1);
      if (tabs[active]) AK.hide(tabs[active].on, tp + 0.1, 0.1);
      if (Tn && tabs[id] !== Tn) void 0;
      if (Tn) AK.show(Tn.on, tp + 0.12, 0.12);
      const E0 = editors[active], E1 = editor(f);
      AK.hide(E0.g, tp + 0.1, 0.12); AK.show(E1.g, tp + 0.15, 0.18);
      active = id;
      return tp + 0.45;
    };
    X.run = function (cmd, out, at) {
      let t = at0(at);
      if (panes.get() !== "terminal") { const tp = H.click(ptabs.terminal, t); AK.hide(ptabs.problems.on, tp + 0.05, 0.1); AK.show(ptabs.terminal.on, tp + 0.05, 0.1); panes.set("terminal", tp + 0.1); t = tp + 0.4; }
      else { const tp = H.click({ x: EX + 40, y: tY + 10, w: EW - 80, h: tH - 20 }, t, { fx: 0.5 }); t = tp + 0.2; }
      const L0 = termLine({ cmd }, t);
      follow(t);
      AK.show(L0.g, t, 0.05);
      t = AK.typeMono(L0.M, t + 0.2, { cps: p.cps, caret: L0.g, color: termInk }) + 0.3;
      (out || []).forEach((ln, i) => { const Ln = termLine(ln, t + i * 0.2); follow(t + i * 0.2); AK.show(Ln.g, t + i * 0.2, 0.06); });
      return t + (out || []).length * 0.2 + 0.2;
    };
    X.debug = function (lines, at) {
      let t = at0(at);
      const E0 = editors[active], list = [].concat(lines || []);
      if (!list.length) return t;
      AK.show(dbg, t, 0.2);
      let prev = null;
      list.forEach((n, i) => {
        const R = E0.rows[n - 1];
        if (!R) return;
        if (i) { const tp = H.click(dbtn[2], t, { fx: 0.5 }); t = tp + 0.15; }
        if (prev) { AK.hide(prev.hl, t, 0.12); AK.hide(prev.arrow, t, 0.12); }
        AK.show(R.hl, t + 0.02, 0.15); AK.show(R.arrow, t + 0.02, 0.15);
        prev = R; t += 0.6;
      });
      return t;
    };
    X.commit = function (message, at) {
      let t = showSide("git", at0(at));
      const tp = H.click(gitField, t + 0.2, { fx: 0.3 });
      AK.show(gitField.ring, tp + 0.05, 0.1);
      if (gitField.ph) AK.hide(gitField.ph, tp + 0.2, 0.1);
      const node = AK.T(gitField.g, message, { x: gitField.tx, y: gitField.y, w: gitField.tw, h: gitField.h, size: Z.fs });
      t = AK.type(node, tp + 0.25, { cps: p.cps, size: Z.fs, caret: gitField.g, color: AK.c(T.accent) });
      const tc = H.click(gitBtn, t + 0.4);
      AK.hide(gitField.ring, tc + 0.05, 0.1); AK.hide(node, tc + 0.15, 0.15);
      AK.hide(gitList, tc + 0.2, 0.25);
      return L.committed ? H.toast(L.committed, tc + 0.45) : tc + 0.45;
    };
    X.setState = function (name2, at) { return states.set(name2, at0(at)); };
    X.state = X.setState;
    AK.reveal(g, p.at);
    AK.runSteps(X, p.steps, { openFile: ["id", "at"], run: ["cmd", "output", "at"], debug: ["lines", "at"], commit: ["message", "at"], state: ["state", "at"] });
    return Object.assign({ host: H, activity: act, tree, tabs, editors, terminal: termG, problems: probG, status, debugBar: dbg, gitPanel: gitG, states }, X);
  },
});
