// @lab {"title": "screencast STRESS: a code editor (file tree, tabs, 24 lines, a line typed, a callout, a zoom), a two-window desktop (a terminal streaming a deploy, a dashboard updating, a click), a dense admin console (toggles, a 9-row table, a dialog, numbered steps)", "styles": ["screencast"], "fx": {}, "dur": 38.5, "times": [6.95, 21.45, 35.0], "words": [{"w": "Open", "s": 0.4, "e": 0.74}, {"w": "the", "s": 0.8, "e": 1.08}, {"w": "retry", "s": 1.15, "e": 1.54}, {"w": "policy", "s": 1.6, "e": 2.05}, {"w": "in", "s": 2.11, "e": 2.34}, {"w": "the", "s": 2.4, "e": 2.69}, {"w": "editor.", "s": 2.75, "e": 3.2}, {"w": "Line", "s": 3.4, "e": 3.74}, {"w": "twelve", "s": 3.8, "e": 4.25}, {"w": "sets", "s": 4.31, "e": 4.65}, {"w": "the", "s": 4.71, "e": 5.0}, {"w": "backoff,", "s": 5.05, "e": 5.56}, {"w": "so", "s": 5.8, "e": 6.03}, {"w": "each", "s": 6.09, "e": 6.43}, {"w": "retry", "s": 6.49, "e": 6.88}, {"w": "waits", "s": 6.95, "e": 7.34}, {"w": "longer", "s": 7.4, "e": 7.85}, {"w": "and", "s": 7.91, "e": 8.2}, {"w": "a", "s": 8.26, "e": 8.43}, {"w": "struggling", "s": 8.49, "e": 9.16}, {"w": "service", "s": 9.22, "e": 9.73}, {"w": "gets", "s": 9.79, "e": 10.12}, {"w": "room", "s": 10.19, "e": 10.53}, {"w": "to", "s": 10.59, "e": 10.82}, {"w": "recover.", "s": 10.88, "e": 11.38}, {"w": "Now", "s": 11.8, "e": 12.09}, {"w": "deploy", "s": 12.15, "e": 12.6}, {"w": "it.", "s": 12.66, "e": 12.89}, {"w": "The", "s": 13.0, "e": 13.29}, {"w": "terminal", "s": 13.35, "e": 13.91}, {"w": "streams", "s": 13.96, "e": 14.47}, {"w": "each", "s": 14.53, "e": 14.87}, {"w": "stage,", "s": 14.93, "e": 15.32}, {"w": "while", "s": 15.56, "e": 15.96}, {"w": "the", "s": 16.02, "e": 16.3}, {"w": "dashboard", "s": 16.36, "e": 16.98}, {"w": "tracks", "s": 17.04, "e": 17.49}, {"w": "errors", "s": 17.55, "e": 18.0}, {"w": "in", "s": 18.06, "e": 18.29}, {"w": "every", "s": 18.35, "e": 18.75}, {"w": "region.", "s": 18.8, "e": 19.25}, {"w": "When", "s": 19.7, "e": 20.04}, {"w": "every", "s": 20.1, "e": 20.49}, {"w": "check", "s": 20.55, "e": 20.95}, {"w": "passes,", "s": 21.01, "e": 21.46}, {"w": "promote", "s": 21.7, "e": 22.2}, {"w": "the", "s": 22.26, "e": 22.55}, {"w": "release.", "s": 22.61, "e": 23.11}, {"w": "Last,", "s": 24.6, "e": 24.94}, {"w": "route", "s": 25.18, "e": 25.57}, {"w": "the", "s": 25.63, "e": 25.92}, {"w": "alerts.", "s": 25.98, "e": 26.43}, {"w": "Turn", "s": 26.6, "e": 26.94}, {"w": "on", "s": 27.0, "e": 27.23}, {"w": "paging,", "s": 27.29, "e": 27.74}, {"w": "choose", "s": 27.98, "e": 28.43}, {"w": "the", "s": 28.49, "e": 28.78}, {"w": "services,", "s": 28.83, "e": 29.39}, {"w": "then", "s": 29.63, "e": 29.97}, {"w": "save", "s": 30.03, "e": 30.37}, {"w": "and", "s": 30.43, "e": 30.72}, {"w": "confirm.", "s": 30.78, "e": 31.28}, {"w": "A", "s": 32.2, "e": 32.37}, {"w": "message", "s": 32.43, "e": 32.94}, {"w": "confirms", "s": 33.0, "e": 33.56}, {"w": "who", "s": 33.62, "e": 33.92}, {"w": "will", "s": 33.96, "e": 34.31}, {"w": "be", "s": 34.36, "e": 34.59}, {"w": "paged.", "s": 34.65, "e": 35.05}]}
/* A STRESS TEST of the screencast engine (2026-10-16, docs/research/2026-10-16-style-stress): one scene that asks the
 * style for what a corporate software explainer really shows, built ONLY from the engine's own calls
 * (docs/styles/engines/screencast.md) plus ctx.m.exit to retire a shell between chapters. Three shells in turn:
 *   1. a code editor (the `code` region, added after the first run of this test): a file tree (nav), editor tabs, 24 lines
 *      of YAML in the mono face with syntax colour and line numbers, two lines marked changed, line 12 typed in with a
 *      caret and marked added, the line highlighted, a callout, the camera framing the tree and the code;
 *   2. a desktop of two windows: a dark terminal (`chrome: "terminal"`, a `terminal` region: a command typed, the deploy
 *      streaming in) beside a release dashboard (cards that count to new values, an error-rate `chart` that fills in as
 *      the canary runs, a checks table that updates), the pointer clicking Promote, a toast;
 *   3. an admin console: a settings list of toggles, a 9-row services table with checkboxes, a confirm dialog with a
 *      select, numbered names 1 to 3 for the workflow, a toast.
 * Every word is a lab stand-in for a generic product; no real brand. Compare within the style only (D-122). */
Loom.scene("screencast_stress", {
  build(ctx) {
    const W = ctx.engine;
    const CHAPTERS = ["Edit the policy", "Deploy it", "Route alerts"];

    // =================================================================== 1. the code editor
    const code = [
      "# Retry policy for outbound calls", "service: payments-api", "owner: platform-team", "",
      "retry:", "  enabled: true", "  max_attempts: 5", "  timeout_ms: 2000", "  retry_on: [502, 503, 504]",
      "  idempotent_only: true", "  # wait between attempts", "", "  base_delay_ms: 200", "  max_delay_ms: 8000",
      "  jitter: full", "", "circuit_breaker:", "  failure_threshold: 0.25", "  open_for_s: 30",
      "  half_open_probes: 3", "", "alerts:", "  page_on_call: false", "  channel: \"payments-oncall\"",
    ];
    const ide = W.app(ctx, "ide", {
      // 1460 px wide: framed at 1.3x the whole window fits the frame (1898 px), so nothing runs off its right edge
      chrome: "window", title: "payments-service", brand: "Codepad", sidebarW: 280, frame: { x: 230, y: 78, w: 1460, h: 856 },
      nav: [
        { section: "payments-service" },
        { id: "src", label: "src", icon: "folder" },
        { id: "api", label: "client.ts", icon: "file-code" },
        { id: "retry", label: "retry.yaml", icon: "file-cog" },
        { id: "deploy", label: "deploy.sh", icon: "file-terminal" },
        { id: "tests", label: "tests", icon: "folder" },
        { id: "readme", label: "README.md", icon: "file-text" },
      ],
      active: "api", search: "Go to file", searchKey: "Ctrl P", user: "DV",
      actions: [{ id: "run", icon: "play" }, { id: "branch", icon: "git-branch", badge: true }],
      page: {
        title: "retry.yaml", sub: "config / payments-service / main",
        toolbar: [{ id: "diff", label: "Diff", icon: "git-compare" }, { id: "save", label: "Save", kind: "primary", icon: "save" }],
        tabs: { items: [{ id: "client", label: "client.ts" }, { id: "retry", label: "retry.yaml" }, { id: "deploy", label: "deploy.sh" }], active: "retry" },
      },
      // lines 7 and 8 were changed since the last save (the gutter's accent bar)
      content: [{ id: "code", kind: "code", lang: "yaml", lines: code, diff: { 7: "~", 8: "~" } }],
    }, { at: 0.2, build: "regions" });
    const CH1 = ide.chapters(CHAPTERS, { at: 0.4, active: 0 });

    ide.step("Open the retry policy", { at: ctx.cue("Open the retry"), n: 1, of: 3, until: ctx.cue("Line twelve") });
    ide.pointer(0.6, { x: 1320, y: 720 });
    let t = ide.type("search", "retry", { at: 2.0 });
    ide.keys(["Enter"], { at: t + 0.25 });
    ide.select("nav.retry", t + 0.7);
    // line 12 into view, then the camera frames the file tree, the tabs and the code: 26 px code at 1.3x reads at 34 px
    t = ide.scrollToLine("code", 12, { at: t + 0.9, dur: 0.9, pos: 0.4 });
    const zt = Math.max(t + 0.1, ctx.cue("Line twelve"));
    const tb = ide.rectAt("nav.src", zt), b = ide.rectAt("code.row.18", zt);
    ide.zoom({ x: ide.win.x, y: tb.y - 48, w: ide.win.w, h: b.y + b.h - tb.y + 48 }, { at: zt, scale: 1.3, read: "code" });
    ide.step("Set the backoff on line 12", { at: zt + 0.3, n: 1, of: 3, until: 11.4 });
    ide.highlight("code", 12, { at: zt + 0.9, until: 10.6 });
    ide.move({ x: 1240, y: 800 }, { at: zt + 0.2 });     // the pointer rests aside while the keys type
    // the line is typed in at a person's pace, with a caret, and marked added
    ide.codeType("code", 12, "  backoff: exponential", { at: ctx.cue("backoff") + 0.15, diff: "+" });
    ide.callout("code.line.12", "Each wait doubles, up to 8 s", { at: ctx.cue("so each retry"), until: 9.3, side: "right" });
    ide.keys(["Ctrl", "S"], { at: 9.4, hold: 1.2 });
    ide.zoomOut({ at: 10.7 });

    // =================================================================== 2. the desktop: a terminal (left), the release dashboard (right,
    // drawn last so its teaching layer sits above both windows)
    const T2 = 11.6;
    const term = W.app(ctx, "term", {
      chrome: "terminal", title: "deploy: zsh", frame: { x: 96, y: 78, w: 760, h: 856 },
      content: [{ id: "sh", kind: "terminal", prompt: "~ $", lines: [{ cmd: "git log --oneline -1" }, "a41c2e9 Retry with exponential backoff"] }],
    }, { at: T2 });
    const dash = W.app(ctx, "dash", {
      chrome: "browser", url: "releases.example.com/payments", frame: { x: 876, y: 78, w: 948, h: 856 },
      page: {
        title: "Release 4.18", sub: "payments-api, canary at 10%",
        toolbar: [{ id: "promote", label: "Promote", kind: "primary", icon: "rocket" }],
      },
      content: [
        { id: "kpi", kind: "cards", items: [{ id: "err", label: "Error rate", value: "0.6%", tone: "warn" }, { id: "p95", label: "p95 latency, ms", value: "212" }, { id: "traffic", label: "Traffic", value: "10%" }] },
        [
          { id: "trend", kind: "chart", title: "Error rate, %", w: 1.05, h: 396, type: "line", unit: "%", max: 2, decimals: 1,
            labels: ["10:01", "10:02", "10:03", "10:04", "10:05", "10:06", "10:07", "10:08"],
            series: [{ name: "Canary", values: [0.9, 0.7, null, null, null, null, null, null] }], limit: { value: 1.0, label: "Limit 1.0%" } },
          { id: "checks", kind: "table", title: "Health checks", w: 1, h: 396,
            columns: [{ label: "Region", w: 1, kind: "strong" }, { label: "Errors", w: 1, align: "right" }, { label: "Status", w: 1.1, kind: "status" }],
            tones: { Passed: "pos", Running: "info", Waiting: "neutral" },
            rows: [["eu-west", "0.6%", "Running"], ["us-east", "1.1%", "Running"], ["ap-south", "", "Waiting"], ["sa-east", "", "Waiting"], ["eu-north", "", "Waiting"]] },
        ],
      ],
    }, { at: T2 });
    dash.chapterCard("Deploy the change", { at: T2, dur: 1.5, kicker: "Chapter 2" });
    ctx.m.exit(ide.E, T2 + 0.4);
    const CH2 = dash.chapters(CHAPTERS, { at: T2 + 1.6, active: 1, x: 96 });
    dash.step("Deploy, then promote", { at: ctx.cue("The terminal"), n: 2, of: 3, until: 23.2 });

    // the command is typed, the deploy streams in; the dashboard answers in its own window
    t = term.run("sh", "shipctl deploy payments-api --canary 10", { at: T2 + 1.7, cps: 18 });
    t = term.out("sh", ["Building image payments-api:4.18", "  step 1/4  compile        done", "  step 2/4  unit tests     done",
      "  step 3/4  package        done", "  step 4/4  push image     done", "Rolling out canary at 10%"], { at: t + 0.2, gap: 0.22 });
    t = term.out("sh", ["  eu-west    2/2 pods   ready", "WARN us-east error rate 1.1%, retrying", "  us-east    2/2 pods   ready",
      "  ap-south   2/2 pods   ready", "Watching error rate for 5 min", { out: "  error rate 0.4%, limit 1.0%", tone: "muted" }, "OK canary healthy, ready to promote"], { at: 16.4, gap: 0.42 });
    dash.cell("checks", 0, 2, "Passed", 16.6);
    dash.series("trend", 0, [0.9, 0.7, 0.6, 0.5, null, null, null, null], 16.9, { dur: 0.6 });
    dash.cell("checks", 1, 1, "0.5%", 17.5);
    dash.cell("checks", 1, 2, "Passed", 17.9);
    dash.series("trend", 0, [0.9, 0.7, 0.6, 0.5, 0.5, 0.4, null, null], 18.3, { dur: 0.6 });
    dash.cell("checks", 2, 1, "0.3%", 18.9);
    dash.cell("checks", 2, 2, "Passed", 19.3);
    dash.card("kpi", "err", "0.4%", 19.6, { count: true, tone: "pos", dur: 0.7 });
    dash.cell("checks", 3, 2, "Running", 20.3);
    term.callout(`sh.line.${term.lineCount("sh")}`, "Healthy, safe to promote", { at: 19.6, until: 20.5, side: "above" });
    dash.callout("trend.limit", "Under the 1% limit", { at: 20.6, until: 22.6, side: "above" });

    dash.pointer(18.6, { x: 1500, y: 820 });
    dash.click("tool.promote", { at: ctx.cue("promote") - 0.6 });
    const tp = ctx.cue("promote") - 0.6;
    // the content stops above the toast's corner, and `avoid` keeps it off the chart's axis whatever the layout
    dash.toast("Promoting to 100%", { at: tp + 0.2, tone: "info", icon: "rocket", id: "promo", until: 23.0, progress: true, avoid: ["trend.plot"] });
    dash.progress("promo", { at: tp + 0.6, dur: 2.2 });
    dash.card("kpi", "traffic", "100%", tp + 0.7, { count: true, dur: 2.0 });
    term.run("sh", "shipctl promote payments-api", { at: tp - 0.1, cps: 24, wait: 0.1 });
    term.out("sh", ["Promoting payments-api:4.18 to 100%", "  eu-west    rolling 4/12 pods"], { at: tp + 1.3, gap: 0.4 });

    // =================================================================== 3. the admin console
    const T3 = 23.3;
    const svcs = [
      ["payments-api", "Dana Vale", "12", "Degraded"], ["ledger-sync", "Ravi Iyer", "3", "Healthy"], ["auth-gateway", "Mei Okafor", "0", "Healthy"],
      ["search-index", "Tom Berg", "7", "Muted"], ["notify-worker", "Lena Park", "1", "Healthy"], ["billing-cron", "Sam Diaz", "0", "Healthy"],
      ["report-builder", "Ana Silva", "4", "Degraded"], ["file-store", "Kofi Mensah", "0", "Healthy"], ["web-frontend", "Ivy Moreau", "2", "Healthy"],
    ];
    const adm = W.app(ctx, "adm", {
      chrome: "browser", url: "admin.example.com/alerts/routing", brand: "Corelane",
      nav: [
        { id: "home", label: "Overview", icon: "house" }, { id: "users", label: "Users", icon: "users" }, { id: "teams", label: "Teams", icon: "building" },
        { id: "alerts", label: "Alerts", icon: "bell-ring", count: 4 }, { id: "billing", label: "Billing", icon: "credit-card" },
        { section: "Workspace" }, { id: "audit", label: "Audit log", icon: "scroll-text" }, { id: "settings", label: "Settings", icon: "settings" },
      ],
      active: "alerts", search: "Search settings", searchKey: "Ctrl K", user: "MO", actions: [{ id: "bell", icon: "bell", badge: true }],
      page: {
        title: "Alert routing", sub: "Who is paged when a service degrades",
        toolbar: [{ id: "discard", label: "Discard" }, { id: "save", label: "Save changes", kind: "primary", icon: "check" }],
        tabs: { items: ["Rules", "Schedules", "Integrations", "History"], active: 0 },
      },
      content: [[
        { id: "rules", kind: "settings", title: "Paging", w: 0.95, rows: [
          { id: "paging", kind: "toggle", label: "Page on-call", desc: "When an alert fires", value: false },
          { id: "quiet", kind: "toggle", label: "Quiet hours", desc: "22:00 to 07:00", value: true },
          { id: "sev", kind: "chevron", label: "Minimum severity", desc: "High and above" },
          { id: "esc", kind: "chevron", label: "Escalation", desc: "After 10 min" },
        ] },
        { id: "svc", kind: "table", title: "Services", w: 1.5, check: true,
          columns: [{ label: "Service", w: 1.35, kind: "strong" }, { label: "Owner", w: 1.35, kind: "avatar" }, { label: "Alerts", w: 0.6, align: "right" }, { label: "State", w: 1.05, kind: "status" }],
          tones: { Healthy: "pos", Degraded: "warn", Muted: "neutral" }, rows: svcs },
      ]],
    }, { at: T3 });
    adm.chapterCard("Route alerts to on-call", { at: T3, dur: 1.5, kicker: "Chapter 3" });
    ctx.m.exit(dash.E, T3 + 0.4);
    ctx.m.exit(term.E, T3 + 0.4);
    const CH3 = adm.chapters(CHAPTERS, { at: T3 + 1.6, active: 2 });
    adm.step("Page on-call for two services", { at: ctx.cue("Last route"), n: 3, of: 3, until: 38.2 });

    adm.pointer(25.0, { x: 1200, y: 760 });
    t = adm.click("rules.paging", { at: ctx.cue("Turn on paging") + 0.3, zoom: true });
    adm.zoomOut({ at: t + 0.4 });
    adm.callout("rules.paging.row", "1. Turn on paging", { at: t + 0.6, side: "above" });
    t = adm.click("svc.row.0", { at: Math.max(t + 1.8, ctx.cue("choose the services") + 0.1), react: false });
    adm.check("svc.row.0", true, t);
    t = adm.click("svc.row.6", { at: t + 1.0, react: false });
    adm.check("svc.row.6", true, t);
    adm.callout("svc.row.6", "2. Pick the services", { at: t + 0.2, until: t + 1.5, side: "left" });
    t = adm.click("tool.save", { at: t + 1.0 });
    const td = t + 0.2;
    t = adm.dialog({ title: "Turn on paging?", text: "On-call is paged when payments-api or report-builder degrades.",
      fields: [{ id: "route", label: "Page this rotation", kind: "select", value: "payments-oncall" }],
      actions: [{ id: "cancel", label: "Cancel" }, { id: "confirm", label: "Turn on paging", kind: "primary" }] }, { at: td });
    t = adm.click("dialog.action.confirm", { at: t + 1.1 });
    t = adm.closeDialog(t + 0.1);
    adm.toast("Paging on for 2 services", { at: t + 0.1, until: 38.2 });
    // the recap: the three steps named again together, numbered, over the finished state
    adm.callout("rules.paging.row", "1. Turn on paging", { at: t + 0.4, until: 38.2, side: "above" });
    adm.callout("svc.row.6", "2. Pick the services", { at: t + 0.7, until: 38.2, side: "left" });
    adm.callout("tool.save", "3. Save and confirm", { at: t + 1.0, until: 38.2, side: "below" });
    CH3.go(2, 35.4);
  },
});
