// @lab {"title": "screencast V2: a desktop app rebuilt from a screenshot (after: themed from the screenshot)", "styles": ["screencast"], "fx": {}, "dur": 9.0, "times": [3.0, 6.2]}
/* The screenshot route of SCREENCAST V2 (2026-10-16): Tallyroom is a stand-in desktop app we wrote
 * (screencast_desktop_site/), screenshotted with tools/page_capture.py --shot-only. tools/screenshot_theme.py read the
 * PNG and proposed the theme and layout below; the words are the screenshot's. Written by
 * screencast_rebuild/make_scenes.py: edit that, not this. */
Loom.scene("screencast_rebuild", {
  build(ctx) {
    const W = ctx.engine;
    const A = W.app(ctx, "app", {
      chrome: "window", title: "Tallyroom", brand: "Tallyroom",
      // proposed by tools/screenshot_theme.py from screencast_rebuild/tallyroom.png
      theme: {"palette": {"surface": "#ffffff", "surface2": "#eef0f4", "ink": "#23262f", "muted": "#86888d", "accent": "#e8703a", "onAccent": "#fefaf8", "line": "#eceef3", "sideInk": "#aab1c3", "sideMuted": "#808798", "sideOn": "#ffffff"}, "tone": {"page": "#eef0f4", "hair": "#eceef3", "hair2": "#dfe2e9", "side": "#1e2433", "chrome": "#ffffff", "sideSel": "#333949"}, "radius": 9, "row": 57, "nav_row": null, "control_h": null, "ui_text": 20, "ui_small": 20},
      layout: {"sidebarW": 319, "topbarH": 77},
      nav: [{ id: "inv", label: "Invoices", icon: "file-text" }, { id: "cli", label: "Clients", icon: "users" }, { id: "exp", label: "Expenses", icon: "credit-card" },
        { id: "rep", label: "Reports", icon: "layout-dashboard" }, { section: "Workspace" }, { id: "team", label: "Team", icon: "building" }, { id: "set", label: "Settings", icon: "settings" }],
      active: "inv", search: "Search invoices",
      page: { title: "Invoices", toolbar: [{ id: "export", label: "Export" }, { id: "new", label: "New invoice", kind: "primary" }] },
      content: [
        { id: "kpi", kind: "cards", items: [{ label: "Outstanding", value: "12,480" }, { label: "Overdue", value: "3" }, { label: "Paid this month", value: "28,915" }] },
        { id: "list", kind: "table", columns: [{ label: "Client", w: 2 }, { label: "Number", w: 1.2 }, { label: "Amount", w: 1 }, { label: "Status", w: 1, kind: "status" }],
          tones: { Paid: "pos", Due: "warn" },
          rows: [["Harbor Studio", "INV-2041", "1,200", "Paid"], ["Marlow and Finch", "INV-2042", "3,450", "Due"], ["Northgate Clinic", "INV-2043", "860", "Paid"],
            ["Pine Street Cafe", "INV-2044", "2,100", "Due"], ["Riverside Gym", "INV-2045", "640", "Paid"], ["Willow Dental", "INV-2046", "4,230", "Paid"]] },
      ],
    }, { at: 0.2 });
    A.pointer(1.0, { x: 1300, y: 800 });
    const t = A.click("list.row.1", { at: 2.6 });
    A.click("tool.new", { at: t + 1.6 });
  },
});
