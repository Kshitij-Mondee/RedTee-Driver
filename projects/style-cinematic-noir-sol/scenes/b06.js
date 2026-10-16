// @design one_success_after_repetition: the ordinary token turns one receiver and releases a hard wedge of light
Loom.scene("b06",{
 build(ctx){
  const {kit,m}=ctx;
  // Treatments considered: static open receiver with signal; lock turn then hard light; dramatic wide opening. The restrained turn and crack show the consequence without spectacle.
  const wall=ctx.held("door_wall"),work=ctx.held("door_work"),card=ctx.held("keycard"),stream=ctx.held("card_stream");
  // @form slow_attention_push: one mild push keeps the established wall and every travelling child coherent
  Loom.cam.frame(wall,{x:130,y:55,w:1680,h:945},ctx.start,ctx.end-ctx.start,{margin:60,ease:"editorial"});
  const reason=ctx.cue("one reason"), cracked=ctx.cue("password was reused");
  m.travel(card,reason,{x:369,y:58,scale:0.46,dur:ctx.style.dur("move")*0.6});
  work.handle.setState("turning",reason+ctx.style.dur("move")*0.6);
  work.handle.setState("cracked",cracked);
  // @form floor_light_continuation: the kit's open crack casts a matching hard plane farther across the floor
  const spill=ctx.el("spill",{x:1090,y:880,w:316,h:48,kind:"scenery",exit:"recede",parent:wall});
  Loom.svg("polygon",{points:"132,0 316,0 270,48 0,48",fill:Loom.style.mix(ctx.c("surface2"),ctx.c("ink"),0.34)},spill.inner);
  m.reveal(spill,cracked,{dur:ctx.style.dur("move")*0.5});
  // @form consequence_annotation: the danger tag names reuse, with a lead to the successful token
  kit.fit("reused",{role:"body",w:240,h:60,maxLines:1});
  Loom.treat.label(ctx,"reused_tag",{x:990,y:400,text:"reused",to:[1280,602],tone:"neg",role:"body",as:"tag",t:ctx.cue("password was reused")});
 }
});
