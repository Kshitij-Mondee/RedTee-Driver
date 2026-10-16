"""Write the two lab scenes of the screenshot rebuild (2026-10-16): the same shell spec, once in the screencast pack's own
look (before) and once with the theme and layout tools/screenshot_theme.py proposed from tallyroom.png (after).
    py docs/research/2026-10-16-style-stress/screencast_rebuild/make_scenes.py
then render both with the lab and compare them with tallyroom.png (compare.py)."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
prop = json.loads((HERE / "tallyroom.theme.json").read_text(encoding="utf-8"))

SRC = r'''// @lab {"title": "screencast V2: a desktop app rebuilt from a screenshot (TITLE)", "styles": ["screencast"], "fx": {}, "dur": 9.0, "times": [3.0, 6.2]}
/* The screenshot route of SCREENCAST V2 (2026-10-16): Tallyroom is a stand-in desktop app we wrote
 * (screencast_desktop_site/), screenshotted with tools/page_capture.py --shot-only. tools/screenshot_theme.py read the
 * PNG and proposed the theme and layout below; the words are the screenshot's. Written by
 * screencast_rebuild/make_scenes.py: edit that, not this. */
Loom.scene("SCENE", {
  build(ctx) {
    const W = ctx.engine;
    const A = W.app(ctx, "app", {
      chrome: "window", title: "Tallyroom", brand: "Tallyroom",THEME
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
'''
theme = prop["theme"]
layout = {k: v for k, v in prop["layout"].items() if k in ("sidebarW", "topbarH")}
after = SRC.replace("TITLE", "after: themed from the screenshot").replace("SCENE", "screencast_rebuild").replace(
    "THEME", "\n      // proposed by tools/screenshot_theme.py from screencast_rebuild/tallyroom.png\n      theme: " + json.dumps(theme) + ",\n      layout: " + json.dumps(layout) + ",")
before = SRC.replace("TITLE", "before: the pack's own look").replace("SCENE", "screencast_rebuild_default").replace("THEME", "")
(OUT / "screencast_rebuild.js").write_text(after, encoding="utf-8")
(OUT / "screencast_rebuild_default.js").write_text(before, encoding="utf-8")
print("wrote", OUT / "screencast_rebuild.js", OUT / "screencast_rebuild_default.js")
