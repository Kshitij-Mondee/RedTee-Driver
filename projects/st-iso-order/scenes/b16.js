// @design diverted_units: two moving units leave their intended stream and stop separately
// Treatments: static held units with signalling; inset comparison; chosen moving units diverted inside the retained cutaway, because the interruption is the argument.
Loom.scene("b16", {
  build(ctx) {
    const first=ctx.cue("An unreadable label"), second=ctx.cue("a wrong sort"), hold=ctx.cue("hold it up too");
    // @form retained_sorter: the same board moves from the dock to the working lanes
    const board=ctx.held("board"), world=board.handle, B=world.B;
    const lamp=ctx.held("lamp");
    // A light backing keeps the section chrome readable across the night wash.
    const sectionBacking=ctx.el("section_backing",{x:80,y:32,w:240,h:52,kind:"scenery",exit:"none"});
    ctx.kit.rect(sectionBacking.inner,0,0,240,52,{fill:"surface",r:6});
    world.frame("sorter",ctx.start,{dur:1.2,zoom:2.5});
    world.setState("hubCutaway",ctx.start);
    // @form diverted_parcels: neutral parcels take separate grid-aligned lanes and stop
    const ghosts=ctx.el("ghost_boxes",{x:96,y:84,w:1728,h:846,kind:"scenery",exit:"recede"});
    const one=B.put("crate",{name:"unreadable_parcel",x:13.1,y:4.9,z:0.8,s:0.42,h:0.42,tok:"steel",inside:world.hub,at:first,enter:"drop"});
    const two=B.put("crate",{name:"wrong_sort_parcel",x:13.1,y:5.25,z:0.8,s:0.42,h:0.42,tok:"steel",inside:world.hub,at:second,enter:"drop"});
    ghosts.handle={items:[one,two]};
    // A small torn white decal, not a second parcel drawing.
    ctx.kit.polygon(one.g,[[-5,-15],[7,-22],[12,-18],[8,-12],[11,-9],[0,-4],[-2,-10]],{fill:"surface"});
    const side=B.route("unreadable_diversion",[[13.1,4.9,0.8],[14.8,4.9,0.8],[14.8,4.05,0.8]],{tok:"line",width:2,dash:true,at:first});
    const wrong=B.route("wrong_lane",[[13.1,5.25,0.8],[15.9,5.25,0.8],[15.9,5.85,0.8]],{tok:"line",width:2,dash:true,at:second});
    one.travel(side,first,{dur:2*ctx.style.dur("move")});
    two.travel(wrong,second,{dur:2*ctx.style.dur("move")});
    // @form independent_holds: separate pins keep the two causes distinct
    const mark1=ctx.el("held_mark",{x:1020,y:380,w:390,h:200,kind:"instrument",exit:"recede"});
    mark1.handle=Loom.lesson.held_mark(ctx,mark1.inner,{label:false,state:"ring"});
    ctx.m.reveal(mark1,first+2*ctx.style.dur("move"),{dur:ctx.style.dur("enter")});
    const mark2=ctx.el("wrong_sort_mark",{x:963,y:535,w:390,h:200,kind:"instrument",exit:"recede"});
    mark2.handle=Loom.lesson.held_mark(ctx,mark2.inner,{label:false,state:"ring"});
    ctx.m.reveal(mark2,second+2*ctx.style.dur("move"),{dur:ctx.style.dur("enter")});
    const leave=ctx.speechEnd-ctx.style.dur("exit");
    B.pin(one,"Unreadable label",{at:first+2*ctx.style.dur("move"),until:leave,tok:"neg",side:"auto"});
    B.pin(two,"Wrong sort",{at:second+2*ctx.style.dur("move"),until:leave,tok:"neg",side:"auto"});
    world.setState("day",leave);
    one.exit(leave,{kind:"sink"}); two.exit(leave,{kind:"sink"});
    lamp.handle.item.exit(leave,{kind:"sink"});
    ctx.m.exit(lamp,leave);
    ctx.m.exit(mark1,leave); ctx.m.exit(mark2,leave);
    void hold;
  }
});
