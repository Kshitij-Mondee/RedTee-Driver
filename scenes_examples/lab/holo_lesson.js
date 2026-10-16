// @lab {"title": "hologram ENGINE, a lesson moving between registers: a calm briefing (two cards, a flow), the switch to analysis on the word (the briefing dims, a globe boots, arcs and traffic, a log, a lock), a push through the near layer, then back to briefing with the verdict", "styles": ["hologram"], "dur": 26.0, "times": [2.2, 6.4, 10.6, 13.2, 15.6, 17.4, 21.4, 25.6]}
/* A lesson-like beat in the hologram style (2026-10-16): "A phishing campaign, traced". It opens in the BRIEFING register
 * (one read per card, one flow), switches to ANALYSIS on the word (H.mode: the briefing recedes, the analysis pieces boot),
 * leans in THROUGH the near layer onto the globe, and comes back to briefing for the verdict. The same HUD carries both
 * registers: nothing is redrawn, the registers are modes. Numbers and places are illustrative for the lab. */
Loom.scene("holo_lesson", {
  build(ctx) {
    const W = ctx.engine, H = W.hud(ctx, { name: "hud" });
    H.grid("field_dots", { x: 0, y: 0, w: 1920, h: 1080, kind: "dot", cell: 40, opacity: 0.16, at: 0.1 });

    // ================= briefing: what happened, calmly (the near layer)
    const head = H.title("heading", { x: 120, y: 92, w: 1040, h: 170, kicker: "Phishing, traced", text: "One email, three hundred inboxes", at: 0.3 });
    const sent = H.card("card_sent", { x: 120, y: 300, w: 480, h: 236, depth: "near", kicker: "Emails delivered", value: 312, label: "in 6 minutes, one sender", at: 1.8 });
    const click = H.card("card_click", { x: 640, y: 300, w: 480, h: 236, depth: "near", kicker: "Clicked the link", value: 9, label: "3 typed a password", status: "warn", at: 2.8 });
    const F = H.flow("chain", { x: 120, y: 600, w: 1000, h: 220, depth: "near", at: 4.2, by: 6.6, index: true, steps: [
      { label: "Email" }, { label: "Click" }, { label: "Fake login" }, { label: "Sign-in try" },
    ] });
    F.packet(7.0, { dur: 2.0 });

    // ================= analysis, on the word: the briefing recedes, the globe boots (mid layer)
    H.mode("analysis", 9.4, { keep: [head] });
    const G = H.globe("globe", { cx: 1500, cy: 450, r: 250, at: 9.9, lat: 5, lon: 12, tilt: 28, lon0: 12, spin: 5, spinFrom: 10.0, spinTo: 13.6, register: "analysis",
      points: [
        { id: "hq", lon: -0.1, lat: 51.5, label: "HQ", status: "accent" },
        { id: "s1", lon: 3.4, lat: 6.5, label: "sender", labelSide: "right", status: "warn" },
        { id: "s2", lon: -74.0, lat: 40.7, label: "relay", labelSide: "left", status: "warn" },
      ],
      arcs: [
        { from: "s1", to: "hq", at: 10.8, dur: 0.9, status: "warn", every: 1.6, until: 17.0 },
        { from: "s2", to: "hq", at: 11.4, dur: 0.9, status: "warn", every: 1.9, until: 17.0 },
      ] });
    H.power(G, "up", 9.6);
    const LOG = H.readout("senders", { x: 1180, y: 760, w: 644, h: 168, at: 11.8, tags: true, register: "analysis", rows: [
      ["09:02", "mail from billing-desk", "warn"],
      ["09:04", "same body, new domain", "warn"],
    ] });
    const L = H.lock(G.pointAt("hq", 14.0), { at: 14.0, label: "credentials posted", labelAlign: "right", status: "alert" });

    // ---- lean in THROUGH the briefing (near) onto the globe
    H.through({ to: [1500, 450], scale: 1.45, t0: 14.6, t1: 16.2 });
    LOG.push(["09:07", "relay login blocked", "ok"], 16.4);
    const r2 = G.pointAt("s2", 16.6).rect;   // the globe stopped turning at 13.6
    H.callout("note_relay", { to: [r2.x + r2.w / 2, r2.y + r2.h / 2], from: [r2.x - 70, r2.y + 130], side: "left", text: "relay sign-in refused", status: "ok", depth: "mid", at: 16.6, until: 17.8 });

    // ================= back to briefing: the verdict
    H.pull({ t0: 17.9, t1: 19.4 });
    L.release(19.0);
    H.mode("briefing", 19.4);
    H.power(G, "down", 19.5);
    H.power(LOG, "down", 19.7);
    F.step(3, "ok", 20.6);
    // the verdict as a panel that assembles line by line (brackets, rule, title, then each row with its tick)
    const V = H.panel("verdict", { x: 1220, y: 300, w: 560, h: 330, depth: "near", title: "Containment", at: 20.2, by: 22.4, rows: [
      ["First click", "09:03"],
      ["Domain blocked", "09:17", "ok"],
      ["Passwords reset", "3 of 3", "ok"],
    ] });
    V.mark(2, "ok", 23.6);
    void sent; void click;
  },
});
