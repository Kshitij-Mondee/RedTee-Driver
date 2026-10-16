// @lab {"title": "hologram ENGINE, the analysis register: a dense HUD for the moment that needs it (a log that scrolls, a network mesh with traffic, a radial scan, a target lock on one node, an anomaly on the wave, a gauge crossing its limit, a timeline, a push through the depth layers)", "styles": ["hologram"], "dur": 22.0, "times": [2.6, 6.4, 9.9, 11.4, 14.2, 18.4, 21.6]}
/* The hologram engine's ANALYSIS register (2026-10-16): a few beats of a lesson, where the system has to be seen working.
 * General to specific (Grafana): the log and the map first, then the scan finds the odd one, the lock names it, the numbers
 * cross their limits on the word, the camera leans in, then pulls back. Every word is content a lesson would pass in (the
 * times and names here are illustrative). Status is told twice (colour and word); one lock, one flash. */
Loom.scene("holo_analysis", {
  build(ctx) {
    const W = ctx.engine, H = W.hud(ctx, { name: "hud" });

    // ---- the far layer: a still hex field (context, never information)
    H.grid("field_hex", { x: 0, y: 0, w: 1920, h: 1080, kind: "hex", cell: 34, opacity: 0.09, at: 0.1 });

    // ---- the question, small: the analysis register keeps its header out of the way
    H.title("heading", { x: 96, y: 76, w: 1200, h: 120, kicker: "Incident 0412, analysis", text: "Unusual access to the payroll server", role: "lead", at: 0.3 });

    // ---- the log (near): what happened, in order
    const LOG = H.readout("auth_log", { x: 96, y: 214, w: 600, h: 452, depth: "near", title: "Auth log", at: 1.2, rows: [
      ["02:11:04", "vpn login, j.ortiz", "ok"],
      ["02:11:40", "mfa passed", "ok"],
      ["02:13:02", "admin role granted", "warn"],
    ] });

    // ---- the map (mid): where it happened
    const M = H.mesh("net", { x: 740, y: 214, w: 660, h: 452, at: 2.4, nodes: [
      { id: "web", x: 54, y: 220, label: "Internet" },
      { id: "vpn", x: 200, y: 220, label: "VPN" },
      { id: "app", x: 380, y: 90, label: "HR app" },
      { id: "lap", x: 380, y: 350, label: "Laptop" },
      { id: "db", x: 572, y: 220, label: "payroll-db", r: 26, labelBelow: false },
    ], links: [["web", "vpn"], ["vpn", "app"], ["vpn", "lap"], ["app", "db"], ["lap", "db"]],
    traffic: [{ path: ["web", "vpn", "lap", "db"], at: 5.2, dur: 1.4, every: 1.8, until: 9.2 }] });

    // ---- the scan (mid): something answers that should not
    H.scanner("scan", { cx: 1668, cy: 380, r: 150, at: 2.0, label: "Host scan", sweeps: [[3.4, 8.0]], speed: 110, blips: [
      { angle: 50, dist: 0.62, status: "info" }, { angle: 150, dist: 0.4, status: "warn" }, { angle: 255, dist: 0.7, status: "alert" },
    ] });

    // ---- the evidence row (mid): a timeline, the outbound signal, the error rate
    const TL = H.scrubber("timeline", { x: 96, y: 720, w: 600, h: 190, at: 3.0, start: "02:10", end: "02:16",
      events: [{ at: 0.2, label: "vpn login" }, { at: 0.5, label: "admin role", status: "warn" }, { at: 0.72, label: "bulk read", status: "alert" }],
      head: [{ t: 4.0, to: 0.2 }, { t: 7.0, to: 0.5 }, { t: 12.4, to: 0.72 }] });
    H.wave("outbound", { x: 740, y: 720, w: 660, h: 190, at: 3.4, label: "Outbound traffic", freq: 2.2, amp: 0.26, t0: 8.0, t1: 16.6, anomaly: { at: 13.4, dur: 3.2, status: "alert", x: 0.72 } });
    const G = H.gauge("errors", { cx: 1668, cy: 800, r: 82, value: 1.2, max: 10, unit: "%", decimals: 1, warn: 2, alert: 5, label: "Auth errors", at: 4.0 });

    // ---- the lock: the scan found it, the lock names it
    const L = H.lock(M.node("db"), { at: 9.6, label: "anomalous host", labelPos: "below", labelAlign: "right", status: "alert" });

    // ---- lean in THROUGH the near layer (the log and the heading dissolve as the camera passes them) onto the map
    H.through({ to: [1070, 440], scale: 1.55, t0: 10.2, t1: 11.9 });

    // ---- the change, on the word: the read becomes a transfer
    M.set("db", "alert", 12.4);
    M.send(["db", "lap", "vpn", "web"], 13.3, { status: "alert", dur: 1.6 });
    G.set(7.4, 13.4, 1.2);

    // ---- back to the whole: the log has the record, the session goes
    H.pull({ t0: 15.4, t1: 17.0 });
    LOG.push(["02:14:19", "bulk read, 40k rows", "alert"], 17.2);
    LOG.push(["02:14:55", "outbound 1.2 GB", "alert"], 17.9);
    LOG.push(["02:15:10", "session revoked", "ok"], 19.0);
    L.release(19.6);
    M.set("db", "warn", 19.6);

    // ---- a slow 2.5D orbit while the record is read: the layers shift against each other about the map
    H.orbit({ deg: 7, t0: 19.8, t1: 22.0 });
  },
});
