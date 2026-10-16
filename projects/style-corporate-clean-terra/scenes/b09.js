// @design offline_backup_path: one connected copy inherits a lock while an unplugged copy stays whole
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatment A: a static connected-versus-offline comparison with a colour change.
    // Treatment B: two drives as a compact dashboard of states.
    // Treatment C, chosen: a lock physically follows the connected cable, so connection is the mechanism.
    const tEncrypt = ctx.cue("Ransomware can encrypt");
    const tConnected = ctx.cue("backups that stay connected");
    const tOffline = ctx.cue("keep one offline or disconnected");

    // @form laptop_detail: the source laptop, anchored at the left of the offline detail
    const laptop_d = ctx.el("laptop_d", { x: 230, y: 290, w: 550, h: 332, kind: "instrument", exit: "recede" });
    const laptopH = Loom.lesson.laptop(ctx, laptop_d.inner, { w: 550, state: "on" });

    // @form report_detail: the original Report sits inside the laptop screen
    const report_d = ctx.el("report_d", { x: laptopH.slot.x + 16, y: laptopH.slot.y + 18, w: 143, h: 190, kind: "card", parent: laptop_d, exit: "recede" });
    const reportH = Loom.lesson.report_file(ctx, report_d.inner, { size: 190, state: "whole" });

    // @form connected_cable: the cable is its own true box, kept under the connected drive and token
    const cable = ctx.el("cable", { x: 760, y: 300, w: 700, h: 258, kind: "connector", exit: "recede" });
    // @form connected_drive: the upper drive has a live cable back to the laptop
    const drive_connected = ctx.el("drive_connected", { x: 320, y: 0, w: 380, h: 258, kind: "instrument", parent: cable, exit: "recede" });
    const connectedH = Loom.lesson.ext_drive(ctx, drive_connected.inner, { w: 380, state: "connected", cableTo: { x: -300, y: 216 } });
    // @form connected_copy: the connected backup copy above its drive
    const copy_connected = ctx.el("copy_connected", { x: connectedH.slots[0].x + 4, y: connectedH.slots[0].y, w: 113, h: 150, kind: "card", parent: drive_connected, exit: "recede" });
    const connectedCopyH = Loom.lesson.report_file(ctx, copy_connected.inner, { size: 150, state: "whole", label: false });

    // @form offline_drive: the lower drive is deliberately unplugged
    const drive_offline = ctx.el("drive_offline", { x: 1080, y: 610, w: 380, h: 258, kind: "instrument", exit: "recede" });
    const offlineH = Loom.lesson.ext_drive(ctx, drive_offline.inner, { w: 380, state: "unplugged" });
    // @form offline_copy: the whole copy stays above the unplugged drive
    const copy_offline = ctx.el("copy_offline", { x: offlineH.slots[0].x + 4, y: offlineH.slots[0].y, w: 113, h: 150, kind: "card", parent: drive_offline, exit: "recede" });
    Loom.lesson.report_file(ctx, copy_offline.inner, { size: 150, state: "whole", label: false });

    // @form offline_label: the nearby blue label names the absent connection rather than crossing the cable
    const label_offline = ctx.el("label_offline", { x: 1036, y: 884, w: 468, h: 52, kind: "bubble", exit: "wipe" });
    kit.pill(label_offline.inner, 0, 0, 468, 52, { fill: "accent", shadow: false });
    kit.text(label_offline.inner, "Offline or disconnected", { role: "label", size: 28, x: 20, y: 0, w: 428, h: 52, align: "center", valign: "middle", weight: 700, color: "onAccent" });

    // @form lock_token: the risk token is a real lock, travelling on the live cable into the upper copy
    const lock_token = ctx.el("lock_token", { x: 742, y: 488, w: 72, h: 72, kind: "token", exit: "iris" });
    kit.disc(lock_token.inner, 36, 36, 34, { fill: "accent3" });
    kit.icon(lock_token.inner, "lock", { x: 17, y: 17, size: 38, color: "onAccent" });

    m.reveal(laptop_d, tEncrypt - 0.25, { dy: 12 });
    m.reveal(cable, tEncrypt - 0.18, { dy: 0 });
    m.reveal(drive_offline, tEncrypt - 0.1, { dy: 12 });
    m.reveal(lock_token, tConnected, { dy: 0 });
    m.reveal(label_offline, tOffline, { dy: 8 });

    reportH.setState("locked", tEncrypt, { dur: ctx.style.dur("move") * 0.6 });
    m.along(lock_token, connectedH.cable, tConnected + 0.08, { from: 0, to: 1, dur: 0.9 });
    connectedCopyH.setState("locked", tConnected + 0.82, { dur: ctx.style.dur("move") * 0.6 });
    m.emphasis(copy_connected, tConnected + 0.84);

    // The blue label arrives as the protected copy is named.
  },
});
