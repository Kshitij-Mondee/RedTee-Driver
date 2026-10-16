// @lab {"title": "screencast ENGINE, a lesson on one held app shell: tour (regions named, a scroll), a chapter card, walkthrough (an export menu framed by the camera, a time-lapse tag over a progress bar, a toast), then calm again on the next page (a new row named, a callout)", "styles": ["screencast"], "dur": 32.0, "times": [2.6, 5.9, 8.2, 11.6, 13.0, 15.0, 17.4, 21.6, 25.8, 29.6]}
/* A lesson-like run of the screencast engine (2026-10-16): the two registers alternate on ONE app shell, as a 5 to 10
 * minute software lesson does (docs/styles/engines/screencast.md, "plan a software lesson"). Chapter 1 is the tour
 * (whole screen, calm: what the screen shows and why), chapter 2 the walkthrough (zoomed, step-precise: how), chapter 3
 * comes back out to the whole screen to show where the result lives. The wait for the export is cut and the time-lapse
 * tag says how long it really takes (wait time is information, van der Meij 2013). Every word is a lab stand-in. */
Loom.scene("sc_lesson", {
  build(ctx) {
    const W = ctx.engine;
    const months = [
      ["October", "Sales", "48,210", "Final"], ["October", "Support", "12,960", "Final"], ["October", "Operations", "30,405", "Draft"],
      ["September", "Sales", "45,880", "Final"], ["September", "Support", "13,140", "Final"], ["September", "Operations", "29,770", "Final"],
      ["August", "Sales", "44,015", "Final"], ["August", "Support", "12,300", "Final"], ["August", "Operations", "28,940", "Final"], ["July", "Sales", "43,120", "Final"],
    ];
    const A = W.app(ctx, "app", {
      chrome: "window", title: "Insight", brand: "Insight",
      nav: [{ id: "dash", label: "Dashboard", icon: "layout-dashboard" }, { id: "reports", label: "Reports", icon: "chart-column" }, { id: "exports", label: "Exports", icon: "download", count: 2 }],
      active: "reports", search: "Search", user: "JM",
      pages: {
        reports: { title: "Monthly reports", sub: "Spend by team",
          toolbar: [{ id: "filter", label: "Filter", icon: "filter" }, { id: "export", label: "Export", icon: "download", kind: "primary" }],
          content: [
            { id: "kpi", kind: "cards", items: [{ label: "October spend", value: "91,575" }, { label: "Change from September", value: "+2.6%", tone: "pos" }, { label: "Teams reporting", value: "3 of 3" }] },
            { id: "list", kind: "table", columns: [{ label: "Month", w: 1.2, kind: "strong" }, { label: "Team", w: 1.2 }, { label: "Spend", w: 1, align: "right" }, { label: "State", w: 1, kind: "status" }],
              tones: { Final: "pos", Draft: "neutral" }, rows: months },
          ] },
        exports: { title: "Exports", sub: "Files you exported in the last 30 days", content: [
          { id: "files", kind: "list", items: [
            { id: "new", title: "monthly-spend-october.csv", sub: "Spreadsheet, 3 teams", meta: "Just now", icon: "file-spreadsheet", tone: "pos" },
            { id: "sep", title: "monthly-spend-september.csv", sub: "Spreadsheet, 3 teams", meta: "2 Oct", icon: "file-spreadsheet" },
            { id: "aug", title: "monthly-spend-august.pdf", sub: "PDF report", meta: "3 Sep", icon: "file-text" },
          ] },
        ] },
      },
    }, { at: 0.2, build: "regions" });
    const CH = A.chapters(["What it shows", "Export it", "Find the file"], { at: 0.8, active: 0 });

    // ---- chapter 1, the tour: calm, the whole screen, two regions named, one scroll
    A.name("kpi", "This month at a glance", { at: 1.6, n: 1 });
    A.name("list", "One row per team and month", { at: 3.8, n: 2 });
    A.clearNames(5.6);
    A.pointer(5.0, { x: 1300, y: 760 });
    A.move("list.row.4", { at: 5.2 });
    A.scroll("list", 112, { at: 6.0, dur: 1.1 });

    // ---- the signpost
    A.chapterCard("Export a month as a spreadsheet", { at: 7.4, dur: 2.0, kicker: "Chapter 2" });
    CH.go(1, 9.6);

    // ---- chapter 2, the walkthrough: framed, step-precise
    A.step("Open the export menu", { at: 9.8, n: 1, of: 2, until: 12.2 });
    let t = A.click("tool.export", { at: 11.2, zoom: true, frame: ["tool.filter", "tool.export"], menu: [
      { id: "csv", label: "Spreadsheet (CSV)", icon: "file-spreadsheet" }, { id: "pdf", label: "PDF report", icon: "file-text" }, { divider: true }, { id: "sched", label: "Schedule monthly", icon: "calendar" }] });
    A.step("Choose a spreadsheet", { at: 12.3, n: 2, of: 2, until: 17.0 });
    t = A.click("menu.csv", { at: 12.9 });
    A.closeMenu(t);
    // the reaction happens bottom right: the camera follows it, the wait is cut and labelled
    A.toast("Preparing your export", { at: t + 0.4, tone: "info", icon: "hourglass", id: "prep", until: 16.6, sound: false, progress: true });
    A.zoom("prep", { at: t + 0.15, dur: 0.8, margin: 90, scale: 1.35 });   // 1.35: at 1.6 the top edge sliced the KPI cards (the engine now eases it and says so)
    A.progress("prep", { at: t + 1.0, dur: 2.6 });
    A.timelapse({ at: t + 1.0, dur: 2.6, speed: "8x", label: "About 2 min" });
    A.toast("Export ready", { at: 16.7, id: "ready", until: 19.4 });
    A.zoomOut({ at: 18.2 });

    // ---- chapter 3, calm again: where the file lives
    CH.go(2, 19.4);
    t = A.click("nav.exports", { at: 20.4, go: "exports" });
    A.name("files.item.new", "Your file, ready to share", { at: 22.0, n: 1, veil: true });
    A.callout("files.item.sep", "Older exports stay for 30 days", { at: 25.2, until: 29.0, side: "below" });
    A.clearNames(29.4);
  },
});
