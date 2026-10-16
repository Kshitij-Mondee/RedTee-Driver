// @design morning_desk_three_actions: a lifted morning plane across a desk; three plain objects arrive in a row, each lit as it is named, the last one settling on the desk
/* Treatments considered: (1) a static lit desk with three labelled objects shown at once (rejected: objects would show before they are named);
 * (2) a single big checklist card (rejected: text over picture, no object);
 * (3) chosen: the desk as a lit plane, three objects arriving on their words, labels on small dark plaques so ink always sits on surface. */
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const sv = (tag, a, p) => Loom.svg(tag, a, p);
    const mix = (a, b, k) => Loom.style.mix(c(a), c(b), k);

    // ---- the morning room: wall, desk top, desk front (scenery, a lifted value band)
    const S = ctx.el("morning_desk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    sv("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: mix("surface", "accent3", 0.42) }, S.inner);
    sv("rect", { x: 0, y: 0, width: 1920, height: 120, fill: c("surface"), opacity: 0.95 }, S.inner);              // a darker header strip so the section tag reads
    sv("rect", { x: 0, y: 470, width: 1920, height: 30, fill: mix("surface", "accent3", 0.3) }, S.inner);          // wall foot
    sv("rect", { x: 0, y: 500, width: 1920, height: 420, fill: mix("surface", "accent4", 0.8) }, S.inner);          // desk top
    sv("rect", { x: 0, y: 500, width: 1920, height: 3, fill: c("ink"), opacity: 0.5 }, S.inner);                      // its lit back edge
    sv("rect", { x: 0, y: 920, width: 1920, height: 160, fill: mix("surface2", "accent4", 0.12) }, S.inner);        // desk front
    sv("rect", { x: 0, y: 920, width: 1920, height: 3, fill: c("ink"), opacity: 0.3 }, S.inner);

    // ---- the morning light: hard slanted planes across wall and desk
    const Lp = ctx.el("morning_light", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const bar = (x0, x1) => sv("polygon", { points: `${x0 + 26},120 ${x1 + 26},120 ${x1 + 460},920 ${x0 + 460},920`, fill: c("ink"), opacity: 0.14 }, Lp.inner);
    bar(260, 640); bar(760, 960); bar(1180, 1330);
    m.drift(Lp, ctx.start, ctx.end, { amp: 10, period: 8 });

    // ---- label helper: a dark plaque, ink (or accent) text on surface
    const label = (name, str, cx, y, tone) => {
      const f = kit.fit(str, { role: "lead", w: 540, h: 60, maxLines: 1 });
      const w = Math.ceil(f.width) + 72, h = 76;
      const E = ctx.el(name, { x: Math.round(cx - w / 2), y, w, h, kind: "card" });
      kit.card(E.inner, 0, 0, w, h, { fill: "surface", r: 12, stroke: tone === "accent" ? "accent" : "line" });
      kit.text(E.inner, str, { role: "lead", x: 36, y: 8, w: Math.ceil(f.width) + 8, h: 60, maxLines: 1, color: tone === "accent" ? "accent" : "ink", weight: 700 });
      return E;
    };
    const LY = 250;

    // ---- 1. the vault issues a fresh card onto the desk
    const VS = 460 / 440;
    const V = ctx.el("password_vault", { x: 70, y: 600, w: 460, h: 280, kind: "instrument" });
    sv("ellipse", { cx: 230, cy: 272, rx: 220, ry: 14, fill: c("shadow"), opacity: 0.4 }, V.inner);
    const vault = Loom.lesson.password_vault(ctx, V.inner, { x: 0, y: 0, w: 460, seed: "vault-1" });
    m.settle(V, ctx.cue("This week"));
    const t1 = ctx.cue("replace any work password");
    vault.setState("issuing", t1);
    vault.setState("closed", t1 + 0.5);
    const cw = 132 * VS;
    const CARD = ctx.el("fresh_card", { x: 0, y: 0, w: Math.round(cw), h: Math.round(cw * 140 / 220), kind: "token" });
    const cg = sv("g", { opacity: 0 }, CARD.inner);
    Loom.lesson.keycard(ctx, cg, { x: 0, y: 0, w: cw, state: "fresh", seed: "vault-1" });
    Loom.tl.set(cg, { opacity: 1 }, t1 + 0.5);
    m.travel(CARD, t1 - 0.3, { x: Math.round(70 + 290 * VS), y: Math.round(600 + 108 * VS), scale: 1, dur: 0.05 });
    m.travel(CARD, t1 + 0.55, { x: 550, y: 690, scale: 240 / cw, dur: 0.9 });
    const L1 = label("label_replace", "Replace reused passwords", 400, LY, "ink");
    m.settle(L1, t1 + 1.0);

    // ---- 2. the phone: MFA on, daylight on its screen
    const PH = ctx.el("phone_mfa", { x: 835, y: 410, w: 250, h: 470, kind: "instrument" });
    sv("ellipse", { cx: 125, cy: 462, rx: 135, ry: 11, fill: c("shadow"), opacity: 0.4 }, PH.inner);
    const phone = Loom.lesson.bedside_phone(ctx, PH.inner, { x: 0, y: 0, w: 250, stand: false, state: "dark" });
    const t2 = ctx.cue("Turn on MFA");
    m.reveal(PH, t2 - 0.2);
    phone.setState("mfa_on", t2 + 0.3);
    const L2 = label("label_mfa", "Turn on MFA", 960, LY, "ink");
    m.settle(L2, t2 + 0.5);

    // ---- 3. the report note settles on the desk under its plaque
    const t3 = ctx.cue("Report odd prompts");
    const N = ctx.el("action_report", { x: 1340, y: 640, w: 320, h: 230, kind: "token" });
    sv("rect", { x: 6, y: 12, width: 320, height: 230, rx: 12, fill: c("shadow"), opacity: 0.35 }, N.inner);
    kit.card(N.inner, 0, 0, 320, 230, { fill: "surface", r: 12, stroke: "accent" });
    sv("rect", { x: 0, y: 0, width: 320, height: 16, rx: 6, fill: c("accent") }, N.inner);
    [[40, 76, 170], [40, 122, 220], [40, 168, 140]].forEach(([x, y, w]) => sv("rect", { x, y, width: w, height: 14, rx: 6, fill: c("muted"), opacity: 0.8 }, N.inner));
    kit.icon(N.inner, "send", { x: 240, y: 40, size: 56, color: "accent" });
    m.reveal(N, t3);
    const L3 = label("label_report", "Report odd prompts", 1500, LY, "accent");
    m.settle(L3, t3 + 0.3);
  },
});
