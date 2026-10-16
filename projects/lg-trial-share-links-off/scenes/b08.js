// @design descending_scope_rule: nested boundaries resolve into a practical minimum
// Three treatments: static diagram with signalling; shrinking boundaries; a descending marker arrow and written rule.
// Chosen: keep the complete diagram still and signal its order before writing the rule.
Loom.scene("b08",{build(ctx,props){
 const W=ctx.engine,B=W.board(ctx),D=ctx.style.dur("draw");
 const ta=ctx.cue("Widest to narrowest"),tr=ctx.cue("Pick the narrowest"),tn=ctx.cue("Your company may set rules");
 ["page","key","crowd","anyone_label","company_ring","company_people","company_label","named_ring","door","list","named_label"].forEach(n=>ctx.held(n));
 const rings=ctx.held("rings");
 // @form neutral_door: the checked opening stays visible without competing with the rule
 const doorInk=ctx.el("door_ink_b08",{x:370,y:110,w:780,h:780,kind:"mark",exit:"recede"});
 rings.handle.door.draw("ink",ctx.start,{state:"shut",parent:doorInk.inner});
 // @form ordered_scope: one downward arrow relates the three existing labels
 const arrow=ctx.el("narrow_arrow",{x:1725,y:195,w:60,h:265,kind:"connector",exit:"recede"});
 B.draw(arrow,W.line(25,10,25,240).concat(W.line(9,221,25,240)).concat(W.line(25,240,41,221)),{at:ta,by:ta+D*.55,pen:"ink"});
 const order=ctx.el("narrow_arrow_words",{x:1190,y:100,w:570,h:60,kind:"text",exit:"wipe"});
 ctx.kit.fit("Widest to narrowest",{role:"body",w:550,h:55,maxLines:1});
 B.write(order,"Widest to narrowest",{role:"body",at:ta+D*.55,by:tr-D*.3,pen:"ink",maxLines:1});
 // @form pocket_rule: the completed boundaries become a choice criterion
 const rule=ctx.el("rule_words",{x:1160,y:690,w:660,h:65,kind:"text",exit:"wipe"});
 ctx.kit.fit("Pick the narrowest that works",{role:"lead",w:640,h:55,maxLines:1});
 B.write(rule,"Pick the narrowest that works",{role:"lead",at:tr,by:tn-D*.5,pen:"ink",maxLines:1});
 // @form single_rule_emphasis: the minimum sufficient scope is the sole accent
 const underline=ctx.el("rule_underline",{x:1170,y:752,w:630,h:22,kind:"mark",exit:"recede"});
 B.draw(underline,W.line(5,9,610,7),{at:tn-D*.5,by:tn,pen:"accent"});
 // @form company_constraint: local guidance remains a separate secondary note
 const note=ctx.el("company_note",{x:1170,y:795,w:630,h:65,kind:"text",exit:"wipe"});
 ctx.kit.fit("Check your company's rules",{role:"label",w:610,h:55,maxLines:1});
 B.write(note,"Check your company's rules",{role:"label",at:tn,by:tn+D*1.6,pen:"muted",maxLines:1});
}});
