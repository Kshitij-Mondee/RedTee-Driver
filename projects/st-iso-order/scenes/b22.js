// @design located_pause: a single destination regains colour as the view closes on two waiting places
// Treatments: static wide map with signalling; separate answer card; chosen camera approach to a retained station, because the answer is a place.
Loom.scene("b22", {
  build(ctx) {
    const hub=ctx.cue("the hub first"), wait=ctx.cue("waiting there"), miss=ctx.cue("missed its truck"), label=ctx.cue("could not be read");
    // @form retained_station: context stays grey while one station becomes the answer
    const board=ctx.held("board"), world=board.handle, B=world.B;
    const pins=ctx.held("station_pins");
    board.exit="recede"; pins.exit="recede";
    world.setState("day",hub);
    B.focus([world.hub,world.dock,world.departureScreen].concat(world.trucks),hub);
    const glide=hub+ctx.style.dur("move")+ctx.style.dur("exit");
    world.clearPins(glide-ctx.style.dur("exit"));
    ctx.m.exit(pins,hub+ctx.style.dur("move"),"recede");
    world.frame("dock",glide,{zoom:2.3,dur:1.8,fly:true});
    world.trucks.forEach(function(truck){truck.exit(hub,{kind:"sink"});});
    // @form dock_subject: a labelled box remains at the hand-off
    const lamp=ctx.el("lamp",{x:96,y:84,w:1728,h:846,kind:"token",exit:"recede"});
    lamp.handle=Loom.lesson.lamp(ctx,lamp.inner,{state:"box",board:world,point:[14.8,7.3,0.3],at:wait,until:ctx.end});
    B.focus([world.hub,world.dock,world.departureScreen,lamp.handle.item].concat(world.trucks),wait);
    lamp.handle.setState("box",wait);
    // @form empty_dock_pause: the missed hand-off belongs to the empty door
    const missed=ctx.el("held_mark",{x:960,y:500,w:430,h:200,kind:"instrument",exit:"recede"});
    missed.handle=Loom.lesson.held_mark(ctx,missed.inner,{label:"Missed truck",state:"label"});
    ctx.m.reveal(missed,miss,{dur:ctx.style.dur("enter")});
    // @form side_lane_pause: the label's hold is marked at the box
    ctx.m.exit(missed,label,"recede");
    lamp.handle.clearTracking(label);
    const unreadable=ctx.el("label_hold",{x:860,y:410,w:480,h:200,kind:"instrument",exit:"recede"});
    unreadable.handle=Loom.lesson.held_mark(ctx,unreadable.inner,{label:"Unreadable label",state:"label"});
    ctx.m.reveal(unreadable,label,{dur:ctx.style.dur("enter")});
  }
});
