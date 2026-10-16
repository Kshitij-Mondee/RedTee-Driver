// @design named_stops: a quiet model becomes a readable key in travel order
// Treatments: static map with signalling; sequential map pins; travelling marker. Choose sequential pins because naming order is the argument, without adding a second traveller.
Loom.scene("b04", {
  build(ctx) {
    const world=ctx.held("board").handle;
    const B=world.B;
    const order=ctx.cue("Order"), pick=ctx.cue("pick"), pack=ctx.cue("pack"), hub=ctx.cue("hub"), delivery=ctx.cue("delivery route");
    const noteAt=ctx.cue("split or merge");
    const until=ctx.end-ctx.style.dur("enter")-ctx.style.dur("exit");
    // @form station_pins: the five stops named in narration order
    // Engine pins retain screen-space type and avoid their neighbours. The shared
    // pins helper currently has only a single at time, reported to the kit builder.
    B.pin(world.orderPlate,"Order",{at:order,until:until,tok:"accent2",side:"auto"});
    B.pin(world.points.shelf,"Pick",{at:pick,until:until,tok:"line",side:"auto"});
    B.pin(world.points.packing,"Pack",{at:pack,until:until,tok:"line",side:"auto"});
    B.pin(world.hub,"Hub",{at:hub,until:until,tok:"line",side:"auto"});
    B.pin(world.depot,"Delivery route",{at:delivery,until:until,tok:"accent3",side:"auto"});
    // @form simplification_note: a qualification outside the working map
    ctx.kit.fit("A simplified map",{role:"body",w:330,h:48,maxLines:1});
    const note=Loom.treat.panel(ctx,"note",{x:1250,y:770,w:390,h:92,fill:"surface",tone:"line",t:noteAt});
    ctx.kit.text(note.inner,"A simplified map",{x:24,y:22,w:342,h:48,role:"body",color:"ink",maxLines:1});
    ctx.m.exit(note,until,"recede");
  }
});
