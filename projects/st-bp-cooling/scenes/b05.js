// @design inside_to_outside: travelling warmth refutes an apparent source
Loom.scene("b05", { build(ctx) {
  // Three treatments: static section with signalling; section with travelling heat; exploded cabinet.
  // Choose travelling heat because leaving the enclosure is the argument.
  const W=ctx.engine, D=W.sheet(ctx), m=ctx.m;
  const a=ctx.cue("Think of a fridge"), b=ctx.cue("doesn't make cold"), c=ctx.cue("moves heat out"), d=ctx.cue("of the box");
  const draw=ctx.style.dur('draw'), move=ctx.style.dur('move');
  function E(n,x,y,w,h,kind){return ctx.el(n,{x,y,w,h,kind:kind||'scenery',exit:'recede'});}
  // @form section_cabinet: an insulated box with shelves and a closed door
  const fridge=E('fridge',480,160,600,680);
  D.part(fridge,{outline:[].concat(W.rect(0,0,600,640),W.rect(48,40,472,560),W.rect(540,0,60,640)),detail:[].concat(W.line(48,200,520,200),W.line(48,360,520,360),W.line(48,520,520,520),W.line(565,240,565,360),W.line(80,640,80,660),W.line(520,640,520,660)),hatch:W.hatch([[0,0],[48,40],[48,600],[0,640]],{spacing:16})},{at:a-0.15,by:a+draw});
  // @form condenser_coil: the single cyan part carries heat to the room
  const coil=E('back_coil',1120,200,120,560);
  const zig=[]; for(let i=0;i<10;i++){zig.push([i%2?100:20,20+i*52]);}
  D.draw(coil,[].concat(W.line(20,0,20,20),W.path(zig),W.line(100,488,100,540)),{at:a+draw,by:a+draw+move,pen:'accent'});
  // @form figure_register: a technical figure note beneath the object
  const fig=E('fig_label',480,840,440,80,'text');
  D.fig(fig,'FIG. 1',{at:a+draw,by:a+draw+move,quick:true});
  const sub=E('fig_subtitle',480,888,440,40,'text');
  D.letter(sub,'fridge, section',{role:'label',size:28,at:a+draw,by:a+draw+move,quick:true});
  // @form hidden_note: a dashed note rejects making cold
  const no=E('no_cold_note',1280,200,440,120,'text');
  D.draw(no,W.hidden([[0,0],[440,0],[440,120],[0,120],[0,0]]),{at:b,by:b+move,pen:'muted',parallel:true});
  const words=E('no_cold_words',1300,232,400,56,'text');
  D.letter(words,'no cold made',{role:'label',size:28,at:b,by:b+move,quick:true});
  // @form outward_heat: amber waves travel from the compartment through the back coil
  const heat=E('heat_path',720,370,1000,300,'connector');
  D.draw(heat,[].concat(W.arrow(0,50,940,50),W.arrow(0,210,940,210)),{at:c,by:c+move,pen:'accent2',parallel:true});
  for(let i=0;i<3;i++){
    const wave=E('heat_wave_'+i,740,390+i*80,70,60,'token');
    D.draw(wave,W.path([[0,30],[12,12],[24,30],[36,48],[48,30],[60,12]]),{at:c,by:c+move*0.5,pen:'accent2',parallel:true});
    m.reveal(wave,c,{dy:0,dur:move*0.5});
    m.travel(wave,c+move*0.5,{x:850,y:(i-1)*55,dur:draw});
    Loom.tween(wave.inner,{opacity:1},{opacity:0,duration:move},c+move*0.5+draw,{kind:'exit',beat:ctx.beat.id,name:'heat_wave_'+i});
  }
  // @form conclusion_note: the result is lettered clear of the heat route
  const note=E('note_moved',960,840,840,64,'text');
  D.letter(note,'heat moved, not made cold',{role:'label',size:28,at:d,by:d+move*0.5,quick:true});
} });
