// @lab {"title": "screencast ENGINE, the tour register: one generic app on screen whole, its regions named one at a time (each earlier name shrinks to its number), then the learner's pointer arrives", "styles": ["screencast"], "dur": 19.0, "times": [1.0, 3.2, 5.6, 8.0, 10.4, 12.8, 15.6, 18.4]}
/* The screencast engine's TOUR register (2026-10-16): calm, the whole screen, for orientation and the "why". A tour
 * names the regions a lesson will use (Plaisant and Shneiderman 2005: "starting with a tour of main screen components
 * orients and introduces the vocabulary"), one region per sentence, in the signal colour so no name is mistaken for the
 * product. Each new name shrinks the one before to its number, so the map stays and the eye goes to the new region.
 * The walkthrough register (sc_walkthrough) does the "how". Every word below is a lab stand-in; a lesson's words come
 * from the product's own documentation. Compare within the style only (D-122). */
Loom.scene("sc_tour", {
  build(ctx) {
    const W = ctx.engine;
    const A = W.app(ctx, "app", {
      chrome: "browser", url: "expenses.example.com/reports", brand: "Expenses",
      nav: [
        { id: "home", label: "Home", icon: "house" },
        { id: "reports", label: "Reports", icon: "file-text", count: 3 },
        { id: "cards", label: "Cards", icon: "credit-card" },
        { id: "approvals", label: "Approvals", icon: "circle-check" },
        { section: "Account" },
        { id: "settings", label: "Settings", icon: "settings" },
      ],
      active: "reports", search: "Search reports", searchKey: "Ctrl K", user: "AK",
      actions: [{ id: "help", icon: "circle-help" }, { id: "alerts", icon: "bell", badge: true }],
      page: {
        title: "Reports", sub: "Expense reports for this quarter",
        toolbar: [{ id: "export", label: "Export", icon: "download" }, { id: "new", label: "New report", kind: "primary", icon: "plus" }],
        tabs: { items: ["All", "Drafts", "Submitted", "Approved"], active: 0 },
      },
      content: [
        { id: "totals", kind: "cards", items: [
          { label: "Submitted", value: "3", icon: "send" },
          { label: "Awaiting approval", value: "2", tone: "warn", icon: "hourglass" },
          { label: "Paid this quarter", value: "1,284.50", tone: "pos", icon: "circle-check" },
        ] },
        { id: "list", kind: "table",
          columns: [{ label: "Report", w: 2.3, kind: "strong" }, { label: "Submitted", w: 1, kind: "muted" }, { label: "Amount", w: 1, align: "right" }, { label: "Status", w: 1.1, kind: "status" }],
          tones: { Approved: "pos", Pending: "warn", Draft: "neutral", Returned: "neg" },
          rows: [
            ["Client visit, Leeds", "12 Sep", "342.80", "Approved"],
            ["Team offsite catering", "18 Sep", "615.00", "Pending"],
            ["Conference travel", "24 Sep", "326.70", "Pending"],
            ["Software licence", "02 Oct", "89.00", "Returned"],
            ["Train to Bristol", "", "54.20", "Draft"],
          ] },
      ],
    }, { at: 0.2, build: "regions" });

    const CH = A.chapters(["Find your way", "Submit a report", "Track approval"], { at: 0.8, active: 0 });

    // the tour: one region a sentence, in reading order (where you go, how you find, what you have, what you do)
    A.name("nav.reports", "Where your reports live", { at: 2.0, n: 1, pad: 4 });
    A.name("search", "Search any report", { at: 4.4, n: 2 });
    A.name("totals", "Your totals", { at: 6.8, n: 3 });
    A.name("list", "Every report and its status", { at: 9.2, n: 4 });
    A.name("tool.new", "Start a new one here", { at: 11.6, n: 5 });
    A.clearNames(14.2);

    // the learner's pointer arrives and rests on the thing the next chapter starts with
    A.pointer(14.6, { x: 1180, y: 700 });
    A.hover("tool.new", { at: 15.2, tip: "Create an expense report", until: 18.6 });
    CH.go(1, 17.4);
  },
});
