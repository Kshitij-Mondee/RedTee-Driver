// @design protected_route: one coloured page travels through a protected handoff, a lock and two disposal modes
// Treatments considered: static signalled route; staggered route with life windows; four simultaneous stations. Chosen staggered route to keep only the spoken step prominent.
Loom.scene("b08", {
  build(ctx, props) {
    const {kit,m} = ctx;
    const T = Loom.treat;
    const named = ctx.cue("named people who need it");
    const protectedAt = ctx.cue("approved, protected channels");
    const stored = ctx.cue("stored with access limited");
    const shredded = ctx.cue("shredded");
    const deleted = ctx.cue("securely deleted");
    // @form warm_sheet: continue the same confidential station ground
    const field = ctx.el("vault_field_b08",{x:0,y:0,w:1920,h:1080,kind:"scenery",exit:"recede"});
    kit.rect(field.inner,0,0,1920,1080,{fill:"field2",r:0});
    const list = ctx.held("customer_list");
    list.outer.parentNode.insertBefore(field.outer,list.outer);
    list.exit = "recede";
    list.handle.setState("confidential",ctx.start);
    // @form named_recipient: the cast member is the one person at the route's destination
    const recipient = ctx.character("Recipient","pip",{x:1340,y:760,scale:0.75,skin:0,top:"muted",bottom:"muted"});
    m.reveal(recipient.E,named,{dur:ctx.style.dur("enter")});
    recipient.look(-1,0,protectedAt);
    const recipientTag = T.label(ctx,"recipient_tag",{x:1270,y:810,text:"Recipient",to:[1340,760],tone:"ink",role:"label",t:named});
    const needTag = T.label(ctx,"need_label",{x:1460,y:260,text:"Named people who need it",to:[1460,420],tone:"ink",role:"label",t:named});
    // @form protected_channel: a padlocked line connects the classified page to its recipient
    const channel = ctx.el("channel",{x:510,y:450,w:684,h:108,kind:"connector",exit:"recede"});
    const ch = Loom.lesson.handling(ctx,channel.inner,{x:6,y:6,scale:1.2,only:"channel"});
    ch.channel.drawIn(protectedAt,ctx.style.dur("draw"));
    ch.channel.travel(protectedAt + ctx.style.dur("draw"),ctx.style.dur("draw"));
    const channelTag = T.label(ctx,"channel_label",{x:700,y:610,text:"Approved channels",to:[852,504],tone:"ink",role:"label",t:protectedAt});
    // The route clears as storage is introduced; no five-prop display.
    [recipient.E,recipientTag,needTag,channel,channelTag].forEach(E => m.exit(E,stored,"recede"));
    // @form locked_storage: the original held list slides behind the folder face
    const folder = ctx.el("folder",{x:620,y:470,w:417,h:336,kind:"card",exit:"recede"});
    const f = Loom.lesson.handling(ctx,folder.inner,{x:6,y:6,scale:1.35,only:"folder"});
    m.draw(folder,stored,{dur:ctx.style.dur("enter")});
    m.travel(list,stored,{x:-70,y:20,scale:0.8,dur:ctx.style.dur("move")});
    f.folder.close(stored + ctx.style.dur("move"),ctx.style.dur("move"));
    const folderTag = T.label(ctx,"folder_label",{x:670,y:830,text:"Limited access",to:[830,795],tone:"ink",role:"label",t:stored});
    // @form paper_disposal: the paper copy feeds into a shredder and becomes strips
    const shredder = ctx.el("shredder",{x:1200,y:330,w:372,h:480,kind:"instrument",exit:"recede"});
    const s = Loom.lesson.handling(ctx,shredder.inner,{x:6,y:6,scale:1.2,only:"shredder"});
    m.draw(shredder,shredded,{dur:ctx.style.dur("enter")});
    s.shredder.feed(shredded,ctx.style.dur("draw"));
    s.shredder.shred(shredded + ctx.style.dur("enter"),ctx.style.dur("enter"));
    // @form digital_disposal: the electronic file erases, leaves a ghost, then disappears
    // The solid icon is established with the disposal stage before its deletion cue.
    const file = ctx.el("file_icon",{x:1650,y:490,w:168,h:207,kind:"icon",exit:"recede"});
    const d = Loom.lesson.handling(ctx,file.inner,{x:6,y:6,scale:1.3,only:"file"});
    m.reveal(file,shredded,{dur:ctx.style.dur("enter")});
    d.file.erase(deleted,ctx.style.dur("enter"));
    d.file.gone(deleted + ctx.style.dur("enter"),ctx.style.dur("exit"));
    const disposalTag = T.label(ctx,"disposal_label",{x:1280,y:850,text:"Shred or delete",to:[1386,804],tone:"ink",role:"label",t:shredded});
    [folder,folderTag,list].forEach(E => m.exit(E,shredded,"recede"));
  }
});
