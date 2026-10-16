// @design route_of_a_protected_item: the item travels left to right through its handling stops, each stop said as it is reached
// Treatments: (1) one static diagram; (2) route drawn stop by stop (chosen); (3) the list alone moving through zones.
Loom.scene("b08", {
  build(ctx) {
    const { m, kit } = ctx;
    const tint = ctx.held("vault_tint");
    const L = ctx.held("customer_list");
    L.exit = "recede";
    const LX = 470, LY = 130; // where b07 left the list; travel is an offset from here

    function label(name, str, x, y, w) {
      const E = ctx.el(name, { x, y, w, h: 44, kind: "text" });
      kit.text(E.inner, str, { role: "label", x: 0, y: 0, w, h: 44, align: "center", valign: "middle", color: "ink" });
      return E;
    }

    // the list shrinks to the left as the route starts
    m.travel(L, ctx.cue("So it goes"), { x: 110 - LX, y: 120 - LY, scale: 0.4 });

    // @form recipient: the one named person (pip rig) with a name tag
    const rc = ctx.character("Recipient", "pip", { x: 1400, y: 420, scale: 0.42, skin: 2, top: "accent" });
    const tNamed = ctx.cue("named people");
    m.pop(rc.E, tNamed);
    const tag = ctx.el("name_tag", { x: 1316, y: 430, w: 168, h: 48, kind: "card" });
    kit.rect(tag.inner, 0, 0, 168, 48, { fill: "surface", stroke: "accent", r: 16 });
    kit.text(tag.inner, "Recipient", { role: "label", x: 10, y: 4, w: 148, h: 40, align: "center", valign: "middle", color: "ink" });
    m.reveal(tag, tNamed + 0.5);
    const lblR = label("label_recipient", "Named people who need it", 1160, 490, 480);
    m.reveal(lblR, tNamed + 0.3);

    // @form channel: one protected line from the list to the recipient, a copy travels it
    const tChan = ctx.cue("approved, protected channels");
    const C = ctx.el("channel", { x: 380, y: 201, w: 784, h: 112, kind: "connector" });
    const ch = Loom.lesson.handling(ctx, C.inner, { only: "channel", scale: 1.4, x: 0, y: 0 });
    ch.channel.drawIn(tChan, 1.0);
    ch.channel.travel(tChan + 1.1, 1.0);
    const lblC = label("label_channel", "Approved channels", 572, 304, 400);
    m.reveal(lblC, tChan + 0.6);

    // @form folder: limited access, the list slides in and the lock closes
    const tStore = ctx.cue("It is stored");
    const tAccess = ctx.cue("access limited");
    const F = ctx.el("folder", { x: 140, y: 580, w: 300, h: 240, kind: "node" });
    const fo = Loom.lesson.handling(ctx, F.inner, { only: "folder", scale: 1, x: 0, y: 0 });
    m.reveal(F, tStore);
    m.travel(L, tAccess - 0.5, { x: 210 - LX, y: 560 - LY, scale: 0.3 });
    Loom.drive(function (e) { L.inner.setAttribute("opacity", Math.max(0, Math.min(1, 1 - (e - 0.55) / 0.45))); }, tAccess - 0.5, 0.9, "move");
    fo.folder.close(tAccess + 0.6, 0.4);
    const lblF = label("label_folder", "Limited access", 130, 832, 320);
    m.reveal(lblF, tAccess);

    // @form shredder: a paper copy feeds in and leaves as strips
    const tShred = ctx.cue("and shredded");
    const S = ctx.el("shredder", { x: 820, y: 550, w: 240, h: 312, kind: "node" });
    const sh = Loom.lesson.handling(ctx, S.inner, { only: "shredder", scale: 0.8, x: 0, y: 0 });
    m.reveal(S, tShred);
    sh.shredder.feed(tShred + 0.5, 0.9);
    sh.shredder.shred(tShred + 1.3, 0.5);

    // @form file_icon: a file that erases to a ghost, then gone
    const tDel = ctx.cue("securely deleted");
    const I = ctx.el("file_icon", { x: 1380, y: 650, w: 144, h: 180, kind: "icon" });
    const fi = Loom.lesson.handling(ctx, I.inner, { only: "file", scale: 1.2, x: 0, y: 0 });
    m.reveal(I, tShred + 0.8);
    fi.file.erase(tDel + 0.3, 0.6);
    fi.file.gone(tDel + 1.0, 0.4);
    const lblS = label("label_shred", "Shred or delete", 800, 878, 600);
    m.reveal(lblS, tShred + 0.3);
  },
});
