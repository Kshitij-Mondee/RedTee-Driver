// @design recorded_handover: a travelling role stops at a destination while one instrument cycles through evidence
// Treatments: static destination and signalled evidence; three separate evidence cards; chosen retained journey with one swapping card, because recording belongs to the hand-over.
Loom.scene("b18", {
  build(ctx) {
    const k=ctx.kit;
    const tDoor=ctx.cue("At the door"), tProof=ctx.cue("records proof"), tSign=ctx.cue("A signature"), tPhoto=ctx.cue("a photo"), tScan=ctx.cue("or a scan");
    const board=ctx.held("board"), route=ctx.held("route");
    const world=board.handle, B=world.B;
    world.frame("street",tDoor,{zoom:4.3,dur:ctx.style.dur("move")*3,fly:true});
    // @form final_approach: the retained delivery vehicle stops alongside the destination
    const approach=B.route("door_approach",[[19,4.4],[22.8,4.4],[22.8,3.3],[24,3.3]],{tok:"line",width:2,dash:true,at:tDoor,dur:ctx.style.dur("draw")});
    const van=(route.handle&&route.handle.van)||world.vans[0];
    van.travel(approach,tDoor,{dur:ctx.style.dur("move")*3});
    // @form driver_role: an engine staff pictogram steps from the stopped van to the door
    const driver=ctx.el("driver",{x:800,y:320,w:360,h:480,kind:"character",exit:"recede"});
    const staff=B.put("person",{x:24,y:2.9,z:0.05,s:0.8,tok:"line",at:tProof,enter:"drop"});
    driver.handle=staff;
    staff.move(tProof+ctx.style.dur("enter"),{to:[24,2,0.05],dur:ctx.style.dur("move")});
    staff.exit(ctx.end-ctx.style.dur("exit"),{kind:"sink"});
    // @form evidence_instrument: one handheld card records alternative kinds of proof
    k.fit("Signature",{role:"lead",w:296,h:54,maxLines:1});
    const card=Loom.treat.panel(ctx,"proof_card",{x:200,y:300,w:360,h:350,fill:"surface",tone:"line",as:"card",t:tSign});
    card.exit="recede";
    k.rect(card.inner,24,22,312,6,{fill:"accent",r:1});
    const states=[Loom.svg("g",{},card.inner),Loom.svg("g",{},card.inner),Loom.svg("g",{},card.inner)];
    ["Signature","Photo","Scan"].forEach(function(word,i){
      k.text(states[i],word,{x:32,y:48,w:296,h:54,role:"lead",color:"ink",maxLines:1});
      Loom.tl.set(states[i],{opacity:i===0?1:0},ctx.start);
    });
    k.path(states[0],"M 48 227 C 76 184 86 264 105 215 C 129 167 131 254 158 211 C 168 200 168 235 186 225 L 274 217",{fill:"none",stroke:"line",sw:4});
    k.line(states[0],48,270,310,270,{stroke:"surface2",sw:2});
    k.icon(states[1],"camera",{x:112,y:156,size:136,color:"line"});
    k.rect(states[1],56,128,248,180,{fill:"none",stroke:"line",r:6});
    [0,9,21,28,43,55,62,79,90,104,114,127,140,152,165,177,193,205,218].forEach(function(x,i){k.rect(states[2],64+x,157,i%3===0?6:3,128,{fill:"line"});});
    Loom.tl.set(states[0],{opacity:0},tPhoto);
    Loom.tl.set(states[1],{opacity:1},tPhoto);
    Loom.tl.set(states[1],{opacity:0},tScan);
    Loom.tl.set(states[2],{opacity:1},tScan);
  }
});
