// @design handling_route: confidential outline moves through four controlled endpoints
// Treatments considered: a single route map, a checklist of controls, or a two-row handling route. Chosen: two-row route, so each control has room to read.
Loom.scene("b08", {
  build(ctx, props) {
    const tPeople = ctx.cue("named people who need it");
    const tChannel = ctx.cue("approved, protected channels");
    const tStore = ctx.cue("stored with access limited");
    const tShred = ctx.cue("shredded");
    const tDelete = ctx.cue("securely deleted when done");
    const T = Loom.treat;

    // @form customer_list: confidential document at the route origin
    const source = ctx.el("list_origin", { x: 132, y: 344, w: 168, h: 216, kind: "instrument", exit: "wipe" });
    const list = Loom.lesson.item(ctx, source.inner, { x: 14, y: 12, w: 140, h: 180, variant: "customer_list", cls: "confidential", tick: true });
    list.drawIn(ctx.speechStart, 0.7);

    // @form recipient: named recipient at the protected route endpoint
    const recipient = ctx.el("recipient", { x: 1390, y: 300, w: 270, h: 320, kind: "character", exit: "recede" });
    const pip = ctx.character("Recipient", "pip", { x: 132, y: 330, scale: 0.70, parent: recipient.inner, pose: "present" });
    pip.pose("present", tPeople, { dur: ctx.style.dur("enter") });
    pip.talk(tPeople, tChannel);
    recipient.inner.setAttribute("opacity", 0);
    Loom.drive(function(e) { recipient.inner.setAttribute("opacity", e); }, tPeople, 0.45, "enter");
    // @form recipient_label: label attached to the named recipient
    T.label(ctx, "recipient_label", { x: 800, y: 330, text: "Named people who need it", to: [1120, 400], tone: "accent3", role: "label", t: tPeople });

    // @form protected_channel: lock-marked channel from list to recipient
    const channelE = ctx.el("protected_channel", { x: 332, y: 180, w: 1000, h: 128, kind: "connector", exit: "wipe" });
    const channel = Loom.lesson.handling(ctx, channelE.inner, { x: 28, y: 28, w: 920, only: "channel" });
    channel.g.setAttribute("opacity", 0);
    Loom.drive(function(e) { channel.g.setAttribute("opacity", e); }, tChannel, 0.2, "enter");
    channel.channel.drawIn(tChannel, 0.8);
    channel.channel.travel(tChannel + 0.82, 1.0);
    // @form channel_label: label attached to locked channel
    T.label(ctx, "channel_label", { x: 660, y: 120, text: "Approved channels", to: [830, 182], tone: "accent", role: "label", t: tChannel });

    // @form limited_access: locked folder receives a confidential list
    const folderE = ctx.el("limited_access_folder", { x: 120, y: 630, w: 360, h: 260, kind: "instrument", exit: "sink" });
    const folder = Loom.lesson.handling(ctx, folderE.inner, { x: 30, y: 10, w: 300, only: "folder" });
    const storedList = Loom.lesson.item(ctx, folder.folder.mid, { x: 72, y: 16, w: 156, h: 200, variant: "customer_list", cls: "confidential", tick: true });
    folder.g.setAttribute("opacity", 0);
    storedList.g.setAttribute("opacity", 0);
    Loom.drive(function(e) { folder.g.setAttribute("opacity", e); storedList.g.setAttribute("opacity", e); }, tStore, 0.35, "enter");
    folder.folder.close(tStore + 0.8, 0.4);
    Loom.drive(function(e) { source.inner.setAttribute("opacity", 1 - e); }, tStore, 0.55, "move");
    // @form access_label: label attached to locked folder
    T.label(ctx, "access_label", { x: 180, y: 848, text: "Limited access", to: [300, 790], tone: "accent3", role: "label", t: tStore });

    // @form shredder: paper copy feeds into shredding slot
    const shredE = ctx.el("shredder", { x: 850, y: 490, w: 300, h: 390, kind: "instrument", exit: "sink" });
    const shredder = Loom.lesson.handling(ctx, shredE.inner, { x: 0, y: 0, w: 300, only: "shredder" });
    shredder.g.setAttribute("opacity", 0);
    Loom.drive(function(e) { shredder.g.setAttribute("opacity", e); }, tShred, 0.25, "enter");
    shredder.shredder.feed(tShred + 0.25, 0.9);
    shredder.shredder.shred(tShred + 1.0, 0.45);

    // @form file_delete: file turns to dashed ghost and disappears
    const fileE = ctx.el("file_delete", { x: 1400, y: 610, w: 150, h: 190, kind: "icon", exit: "iris" });
    const file = Loom.lesson.handling(ctx, fileE.inner, { x: 15, y: 15, w: 120, only: "file" });
    file.g.setAttribute("opacity", 0);
    Loom.drive(function(e) { file.g.setAttribute("opacity", e); }, tDelete - 0.25, 0.25, "enter");
    file.file.erase(tDelete + 0.1, 0.6);
    file.file.gone(tDelete + 0.8, 0.35);
    // @form disposal_label: label linking shred and delete endpoints
    T.label(ctx, "disposal_label", { x: 1090, y: 860, text: "Shred or delete", to: [1010, 780], tone: "accent3", role: "label", t: tShred });
  },
});
