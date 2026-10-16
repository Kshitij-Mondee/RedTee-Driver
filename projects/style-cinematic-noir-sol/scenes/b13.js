// @design daylight_action_row: a hard lit work plane holds three practical objects that become readable in spoken order, then the last object travels outward
// Three treatments: static lit row with signalling; sequential object arrivals; one travelling beam. Choose sequential arrivals because each spoken action gains its own object without camera distraction.
Loom.scene("b13", {
  build(ctx) {
    const {kit, m} = ctx;
    const c = (token) => ctx.c(token);
    const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
    const replace = ctx.cue("replace any work password");
    const mfa = ctx.cue("Turn on MFA");
    const report = ctx.cue("Report odd prompts");
    const send = ctx.cue("straight away");

    // @form morning_room: daylight is a hard plane, not an amber wash
    const room = ctx.el("morning_room", {x:0,y:0,w:1920,h:1080,kind:"scenery",exit:"recede"});
    svg("rect", {x:0,y:0,width:1920,height:1080,fill:Loom.style.mix(c("surface"),c("ink"),0.76)},room.inner);
    svg("polygon", {points:"0,0 720,0 290,340 0,340",fill:c("ink"),opacity:0.65},room.inner);
    svg("path", {d:"M60 0 V250 M290 0 V110",stroke:c("line"),"stroke-width":10,opacity:0.24},room.inner);
    svg("rect", {x:0,y:890,width:1920,height:190,fill:Loom.style.mix(c("surface"),c("ink"),0.55)},room.inner);
    // Shaded ceiling lintel keeps the engine's section label on dark navy throughout.
    svg("rect", {x:0,y:0,width:1920,height:70,fill:c("surface")},room.inner);

    // @form daylight_desk: the desk receives one broad crisp daylight plane
    const desk = ctx.el("morning_desk", {x:120,y:320,w:1680,h:570,kind:"scenery",exit:"recede"});
    svg("polygon", {points:"90,0 1590,0 1680,470 0,470",fill:Loom.style.mix(c("surface"),c("ink"),0.65)},desk.inner);
    svg("polygon", {points:"90,0 1460,0 1300,470 0,470",fill:Loom.style.mix(c("surface"),c("ink"),0.9)},desk.inner);
    svg("rect", {x:0,y:470,width:1680,height:38,fill:c("surface")},desk.inner);
    svg("rect", {x:54,y:508,width:30,height:62,fill:c("surface2")},desk.inner);
    svg("rect", {x:1596,y:508,width:30,height:62,fill:c("surface2")},desk.inner);

    // @form issued_card: a vault issues the fresh neutral card, never the leaked amber card
    const fresh = ctx.el("fresh_card", {x:235,y:452,w:490,h:290,kind:"instrument",exit:"recede"});
    fresh.handle = Loom.lesson.password_vault(ctx,fresh.inner,{x:5,y:0,w:480,state:"closed",seed:"morning_unique"});
    m.settle(fresh,replace);
    fresh.handle.setState("issuing",replace);
    fresh.handle.setState("done",replace+ctx.style.dur("move"));

    // @form second_factor_phone: only the morning phone, no duplicated bedroom furniture
    const phone = ctx.el("phone_mfa", {x:843,y:315,w:234,h:429,kind:"instrument",exit:"recede"});
    phone.handle = Loom.lesson.bedside_phone(ctx,phone.inner,{w:234,stand:false,tilt:0,state:"dark"});
    m.reveal(phone,mfa);
    phone.handle.setState("mfa_on",mfa);

    // @form sent_report: a plain report envelope travels out while its action label stays readable
    const note = ctx.el("action_report", {x:1310,y:502,w:300,h:200,kind:"token",exit:"recede"});
    svg("ellipse", {cx:150,cy:188,rx:125,ry:10,fill:c("shadow"),opacity:0.18},note.inner);
    svg("rect", {x:12,y:12,width:276,height:164,rx:6,fill:c("ink"),stroke:c("accent"),"stroke-width":4},note.inner);
    svg("path", {d:"M14 18 L150 106 L286 18 M14 174 L104 96 M286 174 L196 96",fill:"none",stroke:c("accent"),"stroke-width":3},note.inner);
    m.settle(note,report);
    // Keep the sent report on the desk through the settled action row.

    // @form grounded_action_labels: sharp plain labels on a quiet desk-front band
    const band = ctx.el("labels", {x:160,y:755,w:1600,h:100,kind:"scenery",exit:"wipe"});
    svg("rect",{x:0,y:0,width:1600,height:100,rx:6,fill:c("surface")},band.inner);
    kit.fit("Replace reused passwords",{role:"body",w:520,h:64,maxLines:1,weight:700});
    kit.fit("Turn on MFA",{role:"body",w:400,h:64,maxLines:1,weight:700});
    kit.fit("Report odd prompts",{role:"body",w:440,h:64,maxLines:1,weight:700});
    Loom.treat.label(ctx,"replace_label",{x:480,y:777,text:"Replace reused passwords",tone:"ink",role:"body",as:"underline",t:replace});
    Loom.treat.label(ctx,"mfa_label",{x:960,y:777,text:"Turn on MFA",tone:"ink",role:"body",as:"underline",t:mfa});
    const reportLabel = Loom.treat.label(ctx,"report_label",{x:1460,y:777,text:"Report odd prompts",tone:"accent",role:"body",as:"underline",t:report});
    if (reportLabel.inner) reportLabel.inner.querySelectorAll("text").forEach((text) => text.setAttribute("fill",c("accent")));
  }
});
