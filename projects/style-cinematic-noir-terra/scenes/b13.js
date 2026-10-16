// @design morning_desk_actions: a hard morning pool reveals three protective desk actions in spoken order
Loom.scene("b13", {
  build(ctx, props) {
    // Treatments considered: a three-bullet checklist, a bright desk still, or a desk where each physical action catches the morning light. Chosen: physical desk actions, because the actions arrive in narration order.
    const c = (token) => ctx.c(token);
    const m = ctx.m;
    const T = Loom.treat;
    const tReplace = ctx.cue("This week, replace any work password used elsewhere.");
    const tMfa = ctx.cue("Turn on MFA.");
    const tReport = ctx.cue("Report odd prompts or breach notices straight away.");

    // @form morning_desk: hard-lit desk plane, the morning station
    const st = ctx.depth("morning_desk", { dolly: [ctx.start, ctx.end], push: 0.035, drift: -18, focus: 0.55, dof: 5, atmosphere: 0.34 });
    const wall = st.layer(0.12);
    Loom.svg("rect", { x: -200, y: -200, width: 2320, height: 1480, fill: Loom.style.mix(c("surface2"), c("ink"), 0.16) }, wall);
    Loom.svg("rect", { x: 1190, y: 80, width: 560, height: 420, fill: c("accent3"), opacity: 0.48 }, wall);
    for (let y = 130; y < 480; y += 34) Loom.svg("rect", { x: 1160, y, width: 650, height: 17, fill: c("shadow"), opacity: 0.35 }, wall);
    const desk = st.layer(0.55);
    Loom.svg("polygon", { points: "180,590 1710,590 1840,900 60,900", fill: c("surface") }, desk);
    Loom.svg("polygon", { points: "250,612 1540,612 1650,816 130,816", fill: Loom.style.mix(c("surface"), c("ink"), 0.20) }, desk);
    Loom.svg("line", { x1: 130, y1: 816, x2: 1650, y2: 816, stroke: c("ink"), "stroke-opacity": 0.32, "stroke-width": 3 }, desk);
    Loom.svg("polygon", { points: "180,900 1710,900 1660,984 220,984", fill: c("surface2") }, desk);
    const light = st.layer(0.56, "screen");
    Loom.svg("polygon", { points: "260,460 880,460 1440,815 290,815", fill: Loom.style.mix(c("surface"), c("ink"), 0.24) }, light);
    Loom.svg("polygon", { points: "390,530 740,530 1080,815 450,815", fill: c("accent3"), opacity: 0.22 }, light);

    // @form vault: password manager produces the fresh card
    const vault = ctx.el("password_vault", { x: 250, y: 484, w: 300, h: 210, kind: "instrument", exit: "recede" });
    const vaultHandle = Loom.lesson.password_vault(ctx, vault.inner, { x: 18, y: 26, w: 270, seed: "b13-vault", state: "closed" });
    const vaultLabel = T.label(ctx, "vault_label", { x: 250, y: 704, text: "password manager", to: [400, 670], tone: "accent4", role: "label", t: tReplace + 0.15 });
    m.settle(vault, tReplace, { from: { y: 32 } });
    vaultHandle.setState("issuing", tReplace + 0.35);
    vaultHandle.setState("done", tReplace + 1.0);

    // @form fresh_card: a unique card rests in the morning light
    const freshCard = ctx.el("fresh_card", { x: 525, y: 555, w: 250, h: 160, kind: "token", exit: "recede" });
    Loom.lesson.keycard(ctx, freshCard.inner, { x: 5, y: 5, w: 240, seed: "b13-fresh", state: "fresh" });
    m.travel(freshCard, tReplace + 0.62, { x: 525, y: 555, scale: 1 });
    const replaceLabel = T.label(ctx, "replace_label", { x: 300, y: 382, text: "replace any work password", to: [300, 560], tone: "ink", role: "label", t: tReplace + 0.85 });

    // @form phone_mfa: phone holds the MFA-on state in daylight
    const phone = ctx.el("phone_mfa", { x: 840, y: 442, w: 200, h: 330, kind: "instrument", exit: "recede" });
    const phoneHandle = Loom.lesson.bedside_phone(ctx, phone.inner, { x: 12, y: 10, w: 176, stand: false, tilt: -6, state: "dark" });
    const mfaLabel = T.label(ctx, "mfa_label", { x: 800, y: 382, text: "Turn on MFA", to: [935, 505], tone: "ink", role: "label", t: tMfa + 0.18 });
    m.settle(phone, tMfa, { from: { y: 24 } });
    phoneHandle.setState("mfa_on", tMfa + 0.1);

    // @form action_report: report note moves toward the security side of the desk
    const report = ctx.el("action_report", { x: 1200, y: 542, w: 340, h: 144, kind: "card", exit: "recede" });
    // @form report_note: a practical report note, headed toward security
    ctx.kit.card(report.inner, 0, 0, 340, 144, { fill: "surface", stroke: "line", r: 6 });
    ctx.kit.icon(report.inner, "send", { x: 278, y: 82, size: 32, color: "accent" });
    const reportLabel = T.label(ctx, "report_label", { x: 1250, y: 382, text: "Report odd prompts", to: [1370, 542], tone: "accent", role: "label", t: tReport + 0.12 });
    m.settle(report, tReport + 0.12, { from: { y: 30 } });
    m.emphasis(report, tReport + 0.62);
    ctx.fxMoment("spotlight", tReport + 0.35, Math.min(ctx.end, tReport + 2.5), [1150, 350, 470, 370]);
  }
});
