// @design missed_connection: a departing carrier leaves one arriving unit behind
// Treatments: static lone box with signalling; schedule inset; chosen retained dock and departing truck, since the missed hand-off must be seen.
Loom.scene("b15", {
  build(ctx) {
    const miss=ctx.cue("misses its truck"), wait=ctx.cue("waits for the next"), still=ctx.cue("Nobody was careless");
    // @form retained_night_dock: the same night dock holds the hand-off
    const board=ctx.held("board"), world=board.handle, B=world.B;
    // A light backing keeps the section chrome readable across the night wash.
    const sectionBacking=ctx.el("section_backing",{x:80,y:32,w:240,h:52,kind:"scenery",exit:"none"});
    ctx.kit.rect(sectionBacking.inner,0,0,240,52,{fill:"surface",r:6});
    const lamp=ctx.held("lamp"), parcel=lamp.handle;
    const trucks=ctx.held("outbound_trucks");
    const screen=ctx.held("departure_screen");
    trucks.exit="recede"; screen.exit="recede";
    ctx.m.exit(screen,wait,"recede");
    // @form late_arrival: the subject reaches the edge without boarding
    const approach=B.route("late_dock_approach",[[16.2,6.9,0.8],[16.2,7.2,0.8]],{tok:"line",width:2,at:ctx.start});
    parcel.setState("box",ctx.start);
    parcel.travel(approach,miss,{dur:ctx.style.dur("move")});
    parcel.item.move(miss+ctx.style.dur("move"),{to:[16.2,7.2,0.2],dur:ctx.style.dur("move")});
    // @form missed_carrier: the departing vehicle visibly separates from the waiting parcel
    const away=B.route("missed_truck_departure",[[15.9,8.1],[15.9,11.7]],{tok:"line",width:2,dash:true,at:miss});
    trucks.handle.items[2].travel(away,wait,{dur:3*ctx.style.dur("move")});
    if(world.setDepartureRows) world.setDepartureRows(2,wait);
    B.pin(world.departureScreen,"Next departure",{at:wait,tok:"pos",side:"auto",until:ctx.end});
    // @form held_spot: a pause belongs to the waiting parcel, not a worker
    const mark=ctx.el("held_mark",{x:979,y:573,w:390,h:200,kind:"instrument",exit:"recede"});
    mark.handle=Loom.lesson.held_mark(ctx,mark.inner,{label:false,state:"ring"});
    ctx.m.reveal(mark,wait,{dur:ctx.style.dur("enter")});
    // On the final phrase the board, parcel and departing lane are held still.
    void still;
  }
});
