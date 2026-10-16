// @lab {"title": "Show it in use: window, typing, tap, toast (runtime/interaction.js)", "styles": ["engineering", "flat-cosmos"], "dur": 7.2, "times": [0.5, 1.3, 2.3, 3.4, 4.3, 4.75, 5.4, 6.6]}
// A lab scene: absolute times, no narration. In a lesson every time below would be ctx.cue("spoken words").
// The words here are demo content for the lab only.
Loom.scene("lab_show_it_in_use", {
  build(ctx) {
    const { kit, m, ui } = ctx;
    // the app, arriving as one object (scaffold first)
    const win = ui.window(ctx, { name: "app", x: 260, y: 170, w: 1400, h: 540, title: "Incident review" });
    const body = win.body;
    const head = kit.text(win.E.inner, "What made this easy to miss?", { role: "lead", x: 60, y: body.y + 40, w: 1000, h: 60, valign: "middle" });
    void head;
    const field = ui.field(ctx, win.E, { x: 60, y: body.y + 150, w: 1280, h: 76, label: "Your question for the review" });
    const approve = ui.button(ctx, win.E, { x: 1340 - 260, y: body.y + 290, h: 72, w: 260, label: "Post question" });
    m.spring(win.E, 0.2, { preset: "gentle", dy: 30, scale: 0.97 });
    // the pointer arrives, travels to the field, and types
    const cur = ui.cursor(ctx, { x: 1500, y: 980 });
    m.cursorIn(cur, 0.9);
    const atField = m.cursorTo(cur, 260 + 60 + 90, 170 + win.bar + 150 + 40, 1.0);
    m.tap(cur, null, atField);
    const typed = m.typeInto(field, "What did the deploy screen show?", atField + 0.15, { cps: 20, hold: 0.6 });
    // then to the button, which responds to the tap
    const btnX = 260 + approve.x + approve.w / 2, btnY = 170 + approve.y + approve.h / 2;
    const atBtn = m.cursorTo(cur, btnX, btnY, typed + 0.1);
    m.tap(cur, approve, atBtn, { x: btnX, y: btnY });
    // the result: a toast springs in, and the one thing that matters gets a single glow
    const toast = ui.toast(ctx, { name: "toast", x: 1920 / 2 - 330, y: 170 + 540 + 40, text: "Question posted to the review", icon: "circle-check" });
    toast.outer.setAttribute("transform", `translate(${(1920 - toast.w) / 2} ${170 + 540 + 40})`);
    m.toastIn(toast, atBtn + 0.3);
    m.glow(toast, atBtn + 0.9, { pad: 10 });
  },
});
