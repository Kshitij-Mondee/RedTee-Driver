// @design uneasy_to_resolved: a large face turns from a marked paper to meet the viewer, then gives a small nod
/* Treatments: A static close with expression signalling; B zoom the papers up to the face;
   C chosen, a clean close cut within the same office and a quiet pose release plus nod.
   This beat cuts rather than holding the medium geometry; the next beat cuts back. */
Loom.scene("b02", {
  build(ctx) {
    // @form close_office: the same wall and papers frame a reaction-sized face
    const backCtx = Object.create(ctx);
    backCtx.el = (name, opts) => ctx.el("room", opts);
    const back = Loom.lesson.desk_set(backCtx,ctx.g,{framing:"close",layer:"back"});
    const maya = ctx.character("maya","maya",{x:1410,y:2715,scale:1.5,skin:0,top:"cloth",pose:"worried",emotion:"doubt"});
    const front = Loom.lesson.desk_set(ctx,ctx.g,{framing:"close",layer:"front",ring:true,magnifier:false,only:["desk","receipts"]});
    // @form viewer_turn: unease releases into a steady front-facing look and small nod
    maya.emotion("doubt",ctx.cue("Felt that pull"));
    maya.gesture("tilt",ctx.cue("Felt that pull"),ctx.cue("Here's what to do"));
    maya.pose("idle",ctx.cue("Here's what to do"),{dur:ctx.style.dur("move")});
    maya.emotion("focus",ctx.cue("Here's what to do"));
    const nod = ctx.cue("Here's what to do") + ctx.style.dur("move");
    maya.gesture("nod",nod,nod + ctx.style.dur("draw"));
  }
});
