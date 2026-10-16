// @design retrieve_from_slot: a location becomes a walk and a lift
// Treatments: static aisle with signalling; inset-only location; chosen walk and lift on a cutaway, since motion defines the operation.
Loom.scene("b10", {
  build(ctx) {
    const scan=ctx.cue("shows the lamp's shelf"), walk=ctx.cue("walks over"), lift=ctx.cue("lifts it"), picking=ctx.cue("That is picking");
    // @form cutaway_aisle: a fresh detail register inside the warehouse
    const board=ctx.el("board",{x:96,y:84,w:1728,h:846,kind:"scenery",exit:"none"});
    const world=Loom.lesson.world_board(ctx,board.inner,{}); board.handle=world;
    const B=world.B;
    world.setState("cutaway",ctx.start-2*ctx.style.dur("draw"));
    world.frame("warehouseAisle",ctx.start,{dur:0.001,zoom:4.5});
    // @form shelf_subject: the single reserved subject rests on the shelf deck
    const lamp=ctx.el("lamp",{x:96,y:84,w:1728,h:846,kind:"token",exit:"none"});
    lamp.handle=Loom.lesson.lamp(ctx,lamp.inner,{board:world,state:"lamp",point:world.anchors.shelf,at:ctx.start});
    // @form aisle_role: staff walks one grid axis, with no held marker
    const picker=ctx.el("picker",{x:96,y:84,w:1728,h:846,kind:"character",exit:"none"});
    picker.handle=B.put("person",{x:9.6,y:8.35,z:0.18,s:0.85,tok:"line",inside:world.warehouse,at:ctx.cue("picker's"),enter:"drop"});
    picker.handle.move(walk,{to:[7.1,8.35,0.18],dur:lift-walk});
    lamp.handle.item.move(lift,{to:[7,7.6,1.8],dur:ctx.style.dur("move")});
    // @form scanner_detail: the scanner's live circular location view
    const inset=ctx.el("scanner_inset",{x:1370,y:180,w:320,h:320,kind:"instrument",exit:"iris"});
    inset.handle=B.inset("scanner_inset",{of:lamp.handle.item,centre:[1430,270],r:135,zoom:6,at:scan,until:walk});
    // @form operation_pin: name the completed action, clear of the staff role
    ctx.kit.fit("Picking",{role:"label",w:180,h:54,maxLines:1});
    Loom.treat.label(ctx,"picking_pin",{x:1060,y:370,text:"Picking",to:[930,540],tone:"line",role:"label",t:picking});
  }
});
