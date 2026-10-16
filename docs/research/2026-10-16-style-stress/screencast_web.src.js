// @lab {"title": "screencast V2: a captured real web page (our own stand-in site, served locally and captured with tools/page_capture.py) walked through: hover styles, a real input typed into, a checkbox, a press, a smooth scroll, a class toggle, zooms and callouts on its elements", "styles": ["screencast"], "fx": {}, "dur": 24.0, "times": [2.3, 6.6, 10.6, 15.2, 19.6]}
/* The website route of SCREENCAST V2 (2026-10-16). The page is the real thing, captured once (DOM, CSS at the capture
 * width, fonts and images inlined, each element's box): `screencast_web_capture/fieldnote.page.js`, bundled into
 * screencast_web.js by `py tools/page_capture.py bundle`. Every element is a part by selector ("site@#email"); its
 * :hover, :focus and :active styles are the page's own, set on cue. Fieldnote is a stand-in site written for this test. */
Loom.scene("screencast_web", {
  build(ctx) {
    const W = ctx.engine;
    const A = W.app(ctx, "web", {
      chrome: "browser", url: "fieldnote.example.com",
      content: [{ id: "site", kind: "page", page: "fieldnote" }],
    }, { at: 0.2 });
    const CH = A.chapters(["Sign up", "Compare plans"], { at: 0.4, active: 0 });
    A.step("Start a workspace", { at: 0.8, n: 1, of: 2, until: 12.2 });

    // the learner arrives and passes over the menu (the page's own hover underline), then goes to the form
    A.pointer(0.9, { x: 900, y: 700 });
    let t = A.hover("site@#nav-product", { at: 1.3 });
    t = A.hover("site@#nav-pricing", { at: t + 0.15 });
    // the camera frames the form as the pointer reaches the email field; the field takes the page's focus ring
    t = A.type("site@#email", "dana@company.com", { at: Math.max(t + 0.5, 4.4), zoom: true, frame: ["site@#email", "site@#create"], read: "site@#email" });
    t = A.click("site@#updates", { at: t + 1.1 });
    t = A.hover("site@#create", { at: t + 0.4 });
    t = A.click("site@#create", { at: t + 0.5 });
    A.callout("site@#create", "Creates your workspace", { at: t + 0.15, until: t + 2.0, side: "left" });
    A.zoomOut({ at: t + 2.2 });

    // chapter 2: a smooth scroll down to the plans, the billing switch flips (a class the page's CSS answers)
    const T2 = 12.4;
    CH.go(1, T2);
    A.step("Compare yearly prices", { at: T2, n: 2, of: 2, until: 23.6 });
    t = A.scrollTo("site@#pricing", { at: T2 + 0.3, dur: 1.4, pos: 0.02 });
    t = A.click("site@#yearly", { at: t + 0.9, toggle: { target: "site@#plans", cls: "yearly" } });
    t = A.hover("site@#tier-team", { at: t + 0.6 });
    A.zoom(["site@#tier-team"], { at: t + 0.2, margin: 60, scale: 1.6, read: "site@#tier-team" });
    A.callout("site@#tier-team", "6.40 a person a month, yearly", { at: t + 1.2, until: 21.6, side: "below" });
    A.zoomOut({ at: 22.0 });
  },
});
