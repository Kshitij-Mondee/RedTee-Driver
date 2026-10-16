// @design delayed_choice: a written challenge grows into three unmarked alternatives
Loom.scene("b18", {build(ctx){
/* Treatments: static choices with signalling; sequential handwriting; diagram branches.
   Choose sequential handwriting so the challenge develops with the spoken prompt. */
const W=ctx.engine, B=W.board(ctx,{marker:true});
const th=ctx.cue("Your turn"), tq=ctx.cue("Say three teammates need to read the budget"), tn=ctx.cue("not change it"), to=ctx.cue("Which setting, and which permission"), tp=ctx.cue("Pause, and decide");
// @form quiz_heading: an invitation rather than a verdict
const head=ctx.el("quiz_head",{x:120,y:110,w:700,h:110,kind:"text",exit:"wipe"});
B.heading(head,"Your turn",{role:"title",at:th,by:tq-ctx.style.dur("stagger"),pen:"ink"});
// @form written_question: scenario followed by the decision
const question=ctx.el("question",{x:120,y:265,w:1650,h:150,kind:"group",exit:"wipe"});
const q1=ctx.el("scenario",{x:0,y:0,w:1070,h:62,kind:"text",exit:"wipe",parent:question.inner});
B.write(q1,"Three teammates need to read the budget,",{role:"lead",size:42,at:tq,by:tn-ctx.style.dur("stagger"),pen:"ink"});
const q2=ctx.el("read_only",{x:1090,y:0,w:510,h:62,kind:"text",exit:"wipe",parent:question.inner});
B.write(q2,"not change it.",{role:"lead",size:42,at:tn,by:to-ctx.style.dur("stagger"),pen:"ink"});
const q3=ctx.el("decision",{x:0,y:82,w:1230,h:62,kind:"text",exit:"wipe",parent:question.inner});
B.write(q3,"Which setting, and which permission?",{role:"lead",size:42,at:to,by:to+(tp-to)*.31,pen:"ink"});
// @form choice_rows: identical unmarked letter rings preserve the decision
const options=ctx.el("options",{x:160,y:480,w:940,h:310,kind:"group",exit:"wipe"});
const rows=[{letter:"A",text:"Anyone with the link, edit"},{letter:"B",text:"People in the company, view"},{letter:"C",text:"Named people, view"}];
let cursor=to+(tp-to)*.31;
rows.forEach(function(r,i){
const a=cursor, z=a+ctx.style.dur("draw")*1.8, y=i*105;
const circle=ctx.el("choice_circle_"+r.letter,{x:0,y:y+3,w:70,h:70,kind:"mark",exit:"recede",parent:options.inner});
let next=B.draw(circle,W.circle(35,35,29),{at:a,by:a+ctx.style.dur("draw")*.16,pen:"ink"});
const words=ctx.el("choice_words_"+r.letter,{x:13,y:y+5,w:910,h:64,kind:"text",exit:"wipe",parent:options.inner});
ctx.kit.fit(r.text,{role:"lead",w:820,h:64,maxLines:1});
cursor=B.write(words,r.letter+"    "+r.text,{role:"lead",size:38,maxLines:1,at:next,by:z,pen:"ink"});
});
// @form pause_clock: the marker circles the time reserved for thinking
const pause=ctx.el("pause_ring",{x:1290,y:460,w:420,h:345,kind:"instrument",exit:"recede"});
cursor=B.draw(pause,W.circle(210,123,100),{at:cursor,by:cursor+ctx.style.dur("draw")*.55,pen:"accent"});
const pausewords=ctx.el("pause_words",{x:10,y:252,w:400,h:72,kind:"text",exit:"wipe",parent:pause.inner});
cursor=B.write(pausewords,"Pause and decide",{role:"lead",size:38,at:cursor,by:cursor+ctx.style.dur("draw")*.6,pen:"ink"});
const hand=ctx.el("clock_hand",{x:105,y:18,w:210,h:210,kind:"mark",exit:"recede",parent:pause.inner});
cursor=B.draw(hand,W.line(105,105,105,24),{at:cursor,by:cursor+ctx.style.dur("draw")*.2,pen:"ink"});
Loom.drive(function(e){hand.inner.setAttribute("transform","rotate("+(e*360)+" 105 105)");},cursor,Math.max(ctx.style.dur("stagger"),ctx.end-cursor),"linear");
}});
