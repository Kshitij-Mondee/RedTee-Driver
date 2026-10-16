// @design distributed_stops: four faults accumulate at distinct physical sites along one retained route
// Treatments: static four-site register with signals; a travelling inspector; four isolated cutaways. Choose the static register with timed signals, preserving one street and its system-level causes.
Loom.scene("b19", {
  build(ctx) {
    const k=ctx.kit, m=ctx.m;
    const board=ctx.held("board"), route=ctx.held("route");
    const world=board.handle, B=world.B;
    const tHome=ctx.cue("nobody is home"), tAddress=ctx.cue("a wrong address"), tVan=ctx.cue("a full van"), tRain=ctx.cue("bad weather");
    world.frame("herStreet",ctx.start,{zoom:4.3,dur:ctx.style.dur("move")});
    // @form loaded_vehicle: a second vehicle exposes the finite parcel space
    const van=B.put("van",{name:"full_van",x:25.1,y:3.3,l:1.5,w:0.65,tok:"accent3",role:"delivery vehicles",at:tVan,enter:"drop"});
    van.cut(tVan+ctx.style.dur("enter"));
    const goods=[];
    for(let i=0;i<3;i++)goods.push(B.put("crate",{name:"van_goods_"+i,x:25.2+i*0.3,y:3.4,z:0.3,s:0.28,h:0.45,tok:"soil",inside:van,at:tVan,enter:"drop"}));
    // @form weather_over_road: suspended cloud and dashed rain identify an environmental obstruction
    const cloud=B.put("cloud",{name:"rain_cloud",x:24,y:4.6,z:2,s:0.6,tok:"steel",at:tRain,enter:"drop",cue:true});
    // @form distinct_hold_sites: four independent markers with separated readable labels
    function mark(name,label,x,y,t){
      const E=ctx.el(name,{x:x,y:y,w:390,h:200,kind:"annotation",exit:"recede"});
      E.handle=Loom.lesson.held_mark(ctx,E.inner,{label:label});
      m.reveal(E,t,{dur:ctx.style.dur("enter")});
      return E;
    }
    mark("nobody_home","Nobody home",650,430,tHome);
    const addressMark=mark("wrong_address","Wrong address",950,490,tAddress);
    addressMark.handle.group.setAttribute("transform","scale(1.08)");
    mark("full_van_mark","Full van",890,710,tVan);
    mark("weather_mark","Bad weather",210,690,tRain);
    // @form mismatched_identity: unlike stripe patterns compare a house plate with the parcel label
    const mismatch=ctx.el("address_mismatch",{x:1390,y:470,w:220,h:155,kind:"annotation",exit:"recede"});
    k.rect(mismatch.inner,6,6,92,62,{fill:"surface",stroke:"line",r:6});
    k.rect(mismatch.inner,120,86,92,62,{fill:"surface",stroke:"line",r:6});
    [0,1,2].forEach(function(i){k.line(mismatch.inner,24+i*22,21,24+i*22,51,{stroke:"line",sw:5});});
    [0,1].forEach(function(i){k.line(mismatch.inner,143+i*38,101,143+i*38,131,{stroke:"line",sw:5});});
    k.line(mismatch.inner,98,64,120,92,{stroke:"line",sw:2});
    m.reveal(mismatch,tAddress,{dur:ctx.style.dur("enter")});
    const rain=ctx.el("rain_lines",{x:575,y:675,w:170,h:120,kind:"annotation",exit:"recede"});
    for(let i=0;i<4;i++){
      const drop=k.path(rain.inner,"M "+(30+i*40)+" 6 l -24 100",{fill:"none",stroke:"steel",sw:3});
      drop.setAttribute("stroke-dasharray","8 10");
    }
    m.reveal(rain,tRain,{dur:ctx.style.dur("enter")});
    van.exit(ctx.end,{kind:"sink"});cloud.exit(ctx.end,{kind:"lift"});goods.forEach(function(g){g.exit(ctx.end,{kind:"sink"});});
  }
});
