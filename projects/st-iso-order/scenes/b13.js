// @design converging_routes: several carriers converge before one marked unit branches into a lane
// Treatments: static hub with signalling; parallel arrival cards; chosen retained road journey then cutaway, because convergence and branching are the argument.
Loom.scene("b13", {
  build(ctx) {
    const next=ctx.cue("Next, a hub"), meet=ctx.cue("many places meet"), scan=ctx.cue("Scanners read the label"), sort=ctx.cue("sort by destination");
    const board=ctx.held("board"), lamp=ctx.held("lamp");
    const world=board.handle, B=world.B, subject=lamp.handle.item;
    // @form subject_carrier: the same marked box rides a teal road carrier
    const carriers=ctx.el("hub_trucks",{x:96,y:84,w:1728,h:846,kind:"scenery",exit:"recede"});
    const truck=B.put("truck",{name:"lamp_carrier",x:10.5,y:11.3,l:1.6,w:0.7,tok:"accent3",at:next,enter:"drop"});
    carriers.handle=truck;
    world.setState("day",next);
    subject.move(next,{to:[10.5,11.3,0.8],dur:ctx.style.dur("move")});
    const roadStart=next+ctx.style.dur("move");
    truck.travel(world.routes.warehouseToHub,roadStart,{dur:2.2});
    const cargoRoad=B.route("lamp_road_load",[[10.5,11.3,0.8],[12,11.3,0.8],[12,10,0.8],[14,10,0.8]],{tok:"line",width:1,dash:true,at:next});
    lamp.handle.travel(cargoRoad,roadStart,{dur:2.2});
    world.frame("hubRoad",next,{zoom:3.1,dur:2.2,fly:true});
    // @form converging_loads: other delivery carriers arrive with amber parcels
    const arrivalA=B.route("hub_arrival_a",[[18.3,10],[15.8,10],[15.8,8.1]],{tok:"line",width:1,dash:true,at:next});
    const arrivalB=B.route("hub_arrival_b",[[12,11.3],[12,9.3],[12.7,9.3],[12.7,8.1]],{tok:"line",width:1,dash:true,at:next});
    const a=B.put("truck",{name:"hub_inbound_a",route:arrivalA,l:1.4,w:0.65,tok:"accent3",at:meet-1.2});
    const b=B.put("truck",{name:"hub_inbound_b",route:arrivalB,l:1.4,w:0.65,tok:"accent3",at:meet-1.2});
    a.travel(arrivalA,meet-1.0,{dur:1.2});
    b.travel(arrivalB,meet-1.0,{dur:1.2});
    const parcelA=B.put("crate",{name:"hub_amber_a",x:15.9,y:7.6,z:0.25,s:0.38,h:0.38,tok:"accent4",at:meet+0.2});
    const parcelB=B.put("crate",{name:"hub_amber_b",x:13,y:7.6,z:0.25,s:0.38,h:0.38,tok:"accent4",at:meet+0.35});
    // @form sorter_cutaway: the retained hall reveals its scanner and three outbound belts
    ctx.kit.fit("Hub",{role:"label",w:174,h:40,maxLines:1});
    const scanner=Loom.treat.label(ctx,"scanner_arch",{x:1320,y:230,text:"Hub",to:[1290,340],tone:"line",role:"label",t:sort});
    scanner.handle=world.hub;
    world.frame("sorter",scan-0.5,{zoom:4.3,dur:1.2});
    world.setState("hubCutaway",scan);
    // Wait at the road-side door until the cutaway has opened, then enter at belt height.
    const intake=B.route("lamp_hub_intake",[[14,10,0.8],[14,8.1,0.8],[14,7.05,0.8],[13.2,7.05,0.8],[13.2,5.1,0.8],[14.1,5.1,0.8]],{tok:"line",width:1,at:scan+0.7});
    lamp.handle.travel(intake,scan+0.7,{dur:0.6,face:false});
    const flash=B.put("slab",{name:"label_scan_flash",x:13.65,y:4.7,z:1.5,w:0.12,d:0.75,h:0.03,tok:"glass",at:scan+1.0,enter:"rise",inside:world.hub});
    flash.exit(scan+1.45,{kind:"sink"});
    // @form chosen_lane: a single branch takes the marked parcel to its outbound dock
    const lane=B.route("lamp_sorted_lane",[[14.1,5.1,0.8],[15.5,5.1,0.8],[15.5,5.75,0.8],[16.6,5.75,0.8]],{tok:"line",width:1,at:sort});
    lamp.handle.travel(lane,sort,{dur:ctx.style.dur("move")*2});
    // The fixed Hub plate stays clear of the tracked parcel and caption band.
    void parcelA; void parcelB;
  }
});
