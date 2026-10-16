// @design narrowed_choice: a correct alternative remains while wider alternatives are marked aside
Loom.scene("b19",{build(ctx){
/* Treatments: static verdict with signal; progressive correction on the held board; new comparison.
   Choose progressive correction because the wider alternative fails under a forward. */
const W=ctx.engine,B=W.board(ctx,{marker:true});
const ta=ctx.cue("Named people, with view"),tb=ctx.cue("The company setting sounds close"),tf=ctx.cue("But one forward opens it to everyone signed in"),th=ctx.cue("Named people holds it to three");
const head=ctx.held("quiz_head"),question=ctx.held("question"),options=ctx.held("options"),pause=ctx.held("pause_ring");
ctx.m.exit(pause,ctx.start,"recede");
// @form answer_loop: ink ring and tick select the narrowest workable option
const answer=ctx.el("answer_ring",{x:100,y:640,w:1090,h:180,kind:"mark",exit:"recede"});
B.draw(answer,W.ellipse(520,90,510,85).concat(W.tick(1050,90,52)),{at:ta,by:tb-ctx.style.dur("stagger"),pen:"ink"});
// @form rejected_choices: short crosses sit left of the letter circles, clear of all words
const strikes=ctx.el("strikes",{x:100,y:490,w:36,h:160,kind:"mark",exit:"recede"});
const sa=ctx.el("strike_a",{x:0,y:0,w:36,h:52,kind:"mark",exit:"recede",parent:strikes.inner});
B.draw(sa,W.line(4,15,28,39).concat(W.line(4,39,28,15)),{at:tb,by:tb+ctx.style.dur("draw")*.5,pen:"muted"});
// @form forwarding_note: a leader links the company row to its wider reach
const note=ctx.el("forward_note",{x:1120,y:535,w:640,h:210,kind:"group",exit:"wipe"});
const pointer=ctx.el("company_pointer",{x:0,y:0,w:100,h:68,kind:"connector",exit:"recede",parent:note.inner});
B.draw(pointer,W.arrow(90,25,8,60,{bend:0}),{at:tb+ctx.style.dur("draw")*.6,by:tf-ctx.style.dur("stagger"),pen:"ink"});
const nw=ctx.el("forward_words",{x:100,y:0,w:525,h:180,kind:"text",exit:"wipe",parent:note.inner});
let done=B.write(nw,"a forward reaches everyone signed in",{role:"lead",size:38,maxLines:3,at:tf,by:th-ctx.style.dur("draw")*.5,pen:"muted"});
const sb=ctx.el("strike_b",{x:0,y:105,w:36,h:52,kind:"mark",exit:"recede",parent:strikes.inner});
done=B.draw(sb,W.line(4,15,28,39).concat(W.line(4,39,28,15)),{at:done,by:th-ctx.style.dur("stagger"),pen:"muted"});
// @form final_rule: the selected row becomes a compact practical rule
const line=ctx.el("holds_line",{x:260,y:820,w:1290,h:70,kind:"text",exit:"wipe"});
ctx.kit.fit("Named people holds it to three",{role:"lead",w:1290,h:70,maxLines:1});
done=B.write(line,"Named people holds it to three",{role:"lead",size:44,maxLines:1,at:Math.max(th,done),by:ctx.speechEnd-ctx.style.dur("draw")*.35,pen:"ink"});
// @form held_emphasis: only the final commitment receives colour
const underline=ctx.el("holds_underline",{x:620,y:892,w:730,h:24,kind:"mark",exit:"recede"});
B.draw(underline,W.underline(8,655,10),{at:done,by:ctx.speechEnd,pen:"accent",sound:true});
}});
