// @design timed_departure: a waiting lane meets a departure that does not wait
// Treatments: static docks with signalling; a schedule inset; chosen retained night docks and a departing vehicle, because the timed hand-off is the mechanism.
Loom.scene("b14", {
  build(ctx) {
    const linehaul=ctx.cue("line haul"), schedule=ctx.cue("run on a schedule"), overnight=ctx.cue("Often overnight");
    // @form night_dock: a fresh board marks the change in time
    const board=ctx.el("board",{x:96,y:84,w:1728,h:846,kind:"scenery",exit:"none"});
    const world=Loom.lesson.world_board(ctx,board.inner,{state:"night"});
    board.handle=world;
    const B=world.B;
    // A light backing keeps the section chrome readable across the night wash.
    const sectionBacking=ctx.el("section_backing",{x:80,y:32,w:240,h:52,kind:"scenery",exit:"none"});
    ctx.kit.rect(sectionBacking.inner,0,0,240,52,{fill:"surface",r:6});
    world.setState("hubCutaway",ctx.start-2*ctx.style.dur("draw"));
    world.frame("dock",ctx.start,{dur:0.001,zoom:3});
    // @form dock_subject: the tracked parcel is still inside the hub
    const lamp=ctx.el("lamp",{x:96,y:84,w:1728,h:846,kind:"token",exit:"none"});
    lamp.handle=Loom.lesson.lamp(ctx,lamp.inner,{board:world,state:"box",point:[16.2,5.75,0.8],at:ctx.start});
    // @form scheduled_vehicles: three retained vehicles correspond to the display rows
    const trucks=ctx.el("outbound_trucks",{x:96,y:84,w:1728,h:846,kind:"token",exit:"none"});
    trucks.handle={items:world.trucks,world:world};
    B.pin(world.trucks[1],"Linehaul",{at:linehaul,tok:"accent3",side:"auto"});
    // @form departure_rows: one screen is the schedule for the dock
    ctx.kit.fit("run on a schedule",{role:"label",w:400,h:56,maxLines:1});
    const screen=Loom.treat.label(ctx,"departure_screen",{x:1460,y:540,text:"run on a schedule",to:[1420,645],tone:"line",role:"label",t:schedule});
    screen.exit="none";
    screen.handle=world.departureScreen;
    if(world.setDepartureRows) {
      world.setDepartureRows(0,ctx.start);
      world.setDepartureRows(1,schedule);
      world.setDepartureRows(2,schedule+ctx.style.dur("stagger"));
      world.setDepartureRows(3,schedule+2*ctx.style.dur("stagger"));
    } else {
      world.departureScreen.tint(schedule,"pos");
    }
    const road=B.route("on_time_departure",[[12.7,8.1],[12.7,10],[18.3,10]],{tok:"line",width:2,dash:true,at:linehaul});
    world.trucks[0].travel(road,overnight,{dur:3*ctx.style.dur("move")});
    const lane=B.route("lamp_to_dock",[[16.2,5.75,0.8],[16.2,6.9,0.8]],{tok:"line",width:2,at:ctx.start});
    lamp.handle.travel(lane,overnight,{dur:3*ctx.style.dur("move")});
  }
});
