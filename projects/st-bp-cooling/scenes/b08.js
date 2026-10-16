// @design rising_supply: a low route rises into the passage defined by inward faces
// Treatments: static arrows with signalling; travelling floor-to-passage marks; camera tracking the route. Choose travelling marks, the route itself is the argument.
Loom.scene("b08", {
  build(ctx) {
    const W=ctx.engine, D=W.sheet(ctx);
    const tFloor=ctx.cue("cool air rises through the floor");
    const tAisle=ctx.cue("the aisle the fronts share");
    const tLabel=ctx.cue("the cold aisle");
    const hall=ctx.held("hall_section");
    ctx.held("crah_row");
    ctx.held("water_loop");
    ctx.held("roof_cooler");
    ctx.held("heat_chain");
    const fronts=ctx.held("rack_fronts");
    ctx.held("rack_backs");
    ctx.held("aisle_marks");
    // The prior cyan orientation signal yields to the air route and its name.
    Array.from(fronts.inner.children).forEach(node=>Loom.tween(node,{opacity:1},{opacity:0,duration:ctx.style.dur("exit")},tFloor));
    // @form rising_route: narrow line-tone marks connect the cabinet bases to the perforated floor
    const supply=ctx.el("air_supply",{x:0,y:0,w:1920,h:960,kind:"connector",exit:"none"});
    const flows=Loom.lesson.flows(ctx,supply.inner,{name:"supply_routes",demo:false,at:tFloor,drafted:false});
    supply.handle=flows;
    const floor=flows.airArrow([[190,710],[190,760],[850,760],[850,720],[850,660]],{running:true});
    const second=flows.airArrow([[310,710],[310,760]],{running:true});
    const left=flows.airArrow([[800,720],[800,580]],{running:true});
    const right=flows.airArrow([[900,720],[900,580]],{running:true});
    function arrive(route,t) {
      [route.path].concat(route.tokens).forEach(E=>ctx.m.reveal(E,t,{dy:0,dur:ctx.style.dur("enter")}));
    }
    arrive(floor,tFloor); arrive(second,tFloor);
    arrive(left,tAisle); arrive(right,tAisle);
    // @form aisle_name: the term sits above the arrowheads, inside the common passage
    ctx.kit.fit("cold aisle",{role:"label",w:160,h:48,maxLines:1});
    const label=ctx.el("label_cold_aisle",{x:770,y:510,w:160,h:48,kind:"text",exit:"none"});
    D.letter(label,"cold aisle",{role:"label",size:24,align:"center",valign:"middle",at:tLabel,by:tLabel+ctx.style.dur("enter"),quick:true,pen:"accent"});
  }
});
