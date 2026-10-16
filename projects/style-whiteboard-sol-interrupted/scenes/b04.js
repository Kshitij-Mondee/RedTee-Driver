// @design weak_line_signalled: a drawn container accumulates its short line, then one marker loop distinguishes the line from the purpose it lacks
/* Treatments: static card with signalling; sequential card and checklist drawn in speech order; a magnified title. Chosen: sequential drawing followed by static signalling, preserving the card for its correction. */
Loom.scene("b04", {
  build(ctx) {
    const {kit, m} = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
    const drawDur = len => DRAW * clamp(len/900,0.3,1.4);
    const writeDur = str => DRAW * clamp(str.length/14,0.45,1.8);
    // @form corner_checklist: persistent reference for the current move
    const steps = ctx.el("steps", {x:1420,y:96,w:380,h:300,kind:"instrument",exit:"recede"});
    steps.handle = Loom.lesson.step_list(ctx, steps.inner, {name:"steps",current:0});
    steps.handle.draw(ctx.cue("Before"));
    // @form invitation_container: scaffold first, with room reserved for later guests and envelope
    const IX=340, IY=270;
    const invite = ctx.el("invite", {x:IX,y:IY,w:1160,h:600,kind:"card",exit:"recede"});
    invite.handle = Loom.lesson.invite_card(ctx, invite.inner, {name:"invite"});
    invite.handle.draw(ctx.cue("Sam's invite says"));
    invite.handle.setTitle("Pilot update", ctx.cue("Pilot update"));
    const b = invite.handle.titleBox;
    // @form subject_loop: the one coloured marker hugs the measured title
    const rx=b.w/2+24, ry=44, cx=IX+b.x+b.w/2, cy=IY+b.y+b.h/2;
    const P=12, bx=cx-rx-P, by=cy-ry*1.16-P;
    const lx=cx-bx, ly=cy-by, k=0.5523;
    const loop=`M${lx} ${ly-ry}`+
      ` C${lx+k*rx} ${ly-ry} ${lx+rx} ${ly-k*ry} ${lx+rx} ${ly}`+
      ` C${lx+rx} ${ly+k*ry} ${lx+k*rx} ${ly+ry} ${lx} ${ly+ry}`+
      ` C${lx-k*rx} ${ly+ry} ${lx-rx} ${ly+k*ry} ${lx-rx} ${ly}`+
      ` C${lx-rx} ${ly-k*ry} ${lx-k*rx} ${ly-ry*1.06} ${lx} ${ly-ry*1.06}`+
      ` C${lx+rx*.2} ${ly-ry*1.06} ${lx+rx*.4} ${ly-ry*1.12} ${lx+rx*.5} ${ly-ry*1.16}`;
    const circle=ctx.el("subject_circle", {x:bx,y:by,w:2*rx+2*P,h:2*ry+ry*.16+2*P,kind:"mark",exit:"recede"});
    kit.sketch(circle.inner,"path",[loop],{fill:"none",stroke:"accent",sw:5});
    m.draw(circle,ctx.cue("That's a subject"),{dur:drawDur(2*Math.PI*Math.sqrt((rx*rx+ry*ry)/2))});
    // @form subject_annotation: a secondary note beside the marked line
    const text="a subject";
    const fit=kit.fit(text,{role:"label",w:240,h:60,maxLines:1});
    const note=ctx.el("subject_note", {x:IX+b.x+b.w+52,y:cy-30,w:Math.ceil(fit.width)+24,h:60,kind:"label",exit:"wipe"});
    kit.text(note.inner,text,{role:"label",x:12,y:0,w:Math.ceil(fit.width),h:60,maxLines:1,valign:"middle",color:"muted"});
    m.unmask(note,ctx.cue("not a decision"),{dur:writeDur(text)});
  }
});
