// @lab {"title": "screencast ENGINE, the walkthrough register: zoomed, step-precise (a tab click that changes page, a toggle framed by the camera, a dialog, typing with a caret, a keystroke HUD, a toast), then a spotlight freeze on the one result and a callout", "styles": ["screencast"], "dur": 23.0, "times": [1.6, 3.6, 6.7, 8.6, 10.4, 12.9, 16.4, 18.4, 21.2]}
/* The screencast engine's WALKTHROUGH register (2026-10-16): the "how". Each step is announced (the step pill), the
 * pointer travels at a person's pace, the camera frames the control as the pointer arrives so the words read at 32 px
 * or more, the press lands on a still frame with a ring in the signal colour, and the product reacts (a page changes, a
 * toggle slides, a dialog opens, typed characters arrive with a caret, a toast confirms). The camera returns, and the
 * one result is held in a spotlight freeze (everything dims but the result). Every word is a lab stand-in; a lesson's
 * words come from the product's own documentation. Compare within the style only (D-122). */
Loom.scene("sc_walkthrough", {
  build(ctx) {
    const W = ctx.engine;
    const tabs = (active) => ({ items: [{ id: "profile", label: "Profile" }, { id: "security", label: "Security" }, { id: "alerts", label: "Notifications" }], active });
    const A = W.app(ctx, "app", {
      chrome: "browser", url: "workspace.example.com/settings", brand: "Workspace",
      nav: [
        { id: "home", label: "Home", icon: "house" },
        { id: "files", label: "Files", icon: "folder" },
        { id: "people", label: "People", icon: "users" },
        { section: "Account" },
        { id: "settings", label: "Settings", icon: "settings" },
      ],
      active: "settings", search: "Search", user: "AK", actions: [{ id: "help", icon: "circle-help" }],
      pages: {
        profile: { title: "Settings", sub: "Your account", tabs: tabs("profile"), content: [
          { id: "me", kind: "form", title: "Profile", cols: 2, fields: [
            { id: "name", label: "Full name", value: "Asha Kumar" }, { id: "email", label: "Work email", value: "asha.kumar@example.com" },
            { id: "role", label: "Job title", value: "Finance analyst" }, { id: "team", label: "Team", kind: "select", value: "Finance" },
          ] },
        ] },
        security: { title: "Settings", sub: "Your account", tabs: tabs("security"), content: [
          { id: "sec", kind: "settings", title: "Sign-in and security", rows: [
            { id: "twostep", kind: "toggle", label: "Two-step sign-in", desc: "Ask for a code from your phone when you sign in", value: false },
            { id: "phone", kind: "button", label: "Recovery phone", desc: "Not set", button: { label: "Add" } },
            { id: "timeout", kind: "select", label: "Sign out after", desc: "When you are inactive", value: "8 hours" },
            { id: "sessions", kind: "chevron", label: "Active sessions", desc: "3 devices" },
          ] },
        ] },
      },
      start: "profile",
    }, { at: 0 });

    const CH = A.chapters(["Open security", "Turn on two-step", "Confirm"], { at: 0.3, active: 0 });
    A.pointer(0.6, { x: 1300, y: 760 });

    // ---- step 1: the Security tab (the page changes in place)
    A.step("Open the Security tab", { at: 1.0, n: 1, of: 3, until: 4.4 });
    let t = A.click("tab.security", { at: 2.6, go: "security" });

    // ---- step 2: the toggle, framed as the pointer arrives; the product asks for a recovery phone
    CH.go(1, 4.6);
    A.step("Turn on two-step sign-in", { at: 4.6, n: 2, of: 3, until: 12.6 });
    t = A.click("sec.twostep", { at: 6.4, zoom: true });
    t = A.dialog({ title: "Add a recovery phone", text: "We text a code to this number if you lose your phone.",
      fields: [{ id: "phone", label: "Mobile number", placeholder: "Your mobile number" }],
      actions: [{ id: "cancel", label: "Cancel" }, { id: "save", label: "Save phone", kind: "primary" }] }, { at: t + 0.4 });
    A.zoom("dialog", { at: t + 0.3 });
    t = A.type("dialog.phone", "07700 900123", { at: 8.6 });
    A.keys(["Enter"], { at: t + 0.4 });
    t = A.closeDialog(t + 0.9);

    // ---- step 3: back out, the result confirmed, then held in a spotlight freeze
    A.zoomOut({ at: t + 0.1 });
    CH.go(2, 12.6);
    A.step("Check it is on", { at: 12.6, n: 3, of: 3 });
    A.toast("Two-step sign-in is on", { at: 12.0, until: 15.2 });
    A.spotlight("sec.twostep.row", { at: 15.4, dur: 2.4, label: "On for every sign-in" });
    A.callout("sec.timeout.row", "Change this later if you need to", { at: 19.0, until: 22.6, side: "below" });
  },
});
