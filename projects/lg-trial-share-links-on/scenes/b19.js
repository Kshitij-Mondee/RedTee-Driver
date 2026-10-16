// @design narrow_choice_confirmed: a marked choice links a small group to its bounded permission
// Treatments: static signalling; replace choices with verdict; annotate held choices. Choose annotation to preserve the decision and explain the tempting alternative.
Loom.scene('b19',{build(ctx){
 const W=ctx.engine,B=W.board(ctx,{marker:false}),d=ctx.style.dur('draw');
 ['turn_head','budget_mini','team','view_marks','question','options'].forEach(n=>ctx.held(n));
 const a=ctx.cue('Named people, with view'),c=ctx.cue('The company setting sounds close'),f=ctx.cue('one forward opens it to everyone signed in'),n=ctx.cue('Named people holds it to three');
 // @form chosen_option: an ink tick states the verdict and one accent loop focuses the third row
 const A=ctx.el('answer_ring',{x:735,y:605,w:660,h:112,kind:'mark',exit:'recede'});
 B.draw(A,W.line(34,45,45,59).concat(W.line(45,59,63,29)),{at:a,by:a+d*.35,pen:'ink'});
 const loop=W.line(40,11,605,10).concat(W.line(605,10,638,30),W.line(638,30,636,78),W.line(636,78,608,98),W.line(608,98,29,95),W.line(29,95,12,75),W.line(12,75,14,33),W.line(14,33,40,11));
 B.draw(A,loop,{at:a+d*.35,by:a+d*1.1,pen:'accent'});
 // @form excluded_option: a quiet cross beside the box rejects the overbroad editing choice
 const S=ctx.el('wrong_strike',{x:710,y:410,w:32,h:38,kind:'mark',exit:'recede'});
 B.draw(S,W.line(7,8,25,30).concat(W.line(25,8,7,30)),{at:a+d*1.1,by:a+d*1.5,pen:'muted'});
 // @form company_explanation: route from the tempting row into a separate note below
 const C=ctx.el('company_note',{x:795,y:515,w:920,h:385,kind:'connector',exit:'recede'});
 const arrow=W.line(650,25,700,25).concat(W.line(700,25,700,225),W.arrow(700,225,650,225));
 B.draw(C,arrow,{at:c,by:c+d*.9,pen:'muted'});
 ctx.kit.fit('Company: a forward reaches',{role:'body',w:810,h:60,maxLines:1});
 B.write(C,'Company: a forward reaches',{x:35,y:257,w:810,h:60,role:'body',maxLines:1,at:f,by:f+d*1.8,pen:'muted'});
 B.write(C,'everyone signed in',{x:35,y:318,w:810,h:60,role:'body',maxLines:1,at:f+d*1.8,by:n-d*.1,pen:'muted'});
 // @form bounded_team: a bracket groups the three holders and leads into their selected row
 const H=ctx.el('hold_bracket',{x:228,y:636,w:510,h:115,kind:'connector',exit:'recede'});
 const bracket=W.line(9,10,9,45).concat(W.line(9,45,212,45),W.line(212,45,212,10),W.line(212,45,280,45),W.arrow(280,45,497,24));
 B.draw(H,bracket,{at:n,by:n+d*1.3,pen:'ink'});
}});
