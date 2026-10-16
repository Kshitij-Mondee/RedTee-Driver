// @design evidence_then_rule: a lit source line connects to a checked reply, then two durable instructions rest.
// Treatments: static evidence pair with signalling; travelling document; assembling reply and source link. Choose assembling reply plus signal, since the link is the check.
Loom.scene("b22", {
  build(ctx) {
    const k = ctx.kit, m = ctx.m;
    const H = ctx.engine.hud(ctx, {name:"closing_hud"});
    const check = ctx.cue("She checks");
    const match = ctx.cue("against the page");
    const first = ctx.cue("Give it the source");
    const second = ctx.cue("Check what matters");
    // @form source_console: the question and its attached source persist in one console.
    const chat = ctx.held("chat_panel");
    const nameTag = ctx.held("name_tag");
    const questionLine = ctx.held("question_line");
    m.travel(chat, check, {x:-350,y:-47,scale:1});
    chat.handle.setState("checked", match);
    // @form source_page: abstract rules make the source visible without inventing a deadline.
    const page = ctx.held("policy_doc");
    m.travel(page, check, {x:1200,y:-117,scale:1});
    page.handle.setState("line_lit", match);
    // @form checked_reply: a single reply with abstract lines becomes matched.
    const reply = ctx.el("reply_checked", {x:210,y:446,w:360,h:150,kind:"card",exit:"recede"});
    reply.handle = Loom.lesson.reply_card(ctx, reply.inner, {state:"plain"});
    m.assemble(reply, check, {dur:ctx.style.dur("enter")});
    reply.handle.setState("matched", match + ctx.style.dur("draw"));
    // @form source_match: the connector reaches the left socket, never crossing the reply's words.
    H.trace("match_link", {points:[[1566,442],[1260,442],[1260,620],[188,620],[188,521],[228,521]], at:match, dur:ctx.style.dur("draw"), tone:"line", pulse:false});
    // @form pocket_rules: two readable plates, with the caption band left empty.
    const R1 = Loom.treat.panel(ctx,"rules",{x:1100,y:680,w:690,h:90,fill:"surface",tone:"accent",t:first});
    const f1 = k.fit("Give it the source.",{role:"title",w:642,h:66,maxLines:1});
    k.text(R1.inner,"Give it the source.",{x:24,y:12,w:642,h:66,role:"title",size:f1.size,maxLines:1,color:"ink"});
    const R2 = Loom.treat.panel(ctx,"rules_check",{x:1100,y:802,w:690,h:90,fill:"surface",tone:"accent",t:second});
    const f2 = k.fit("Check what matters.",{role:"title",w:642,h:66,maxLines:1});
    k.text(R2.inner,"Check what matters.",{x:24,y:12,w:642,h:66,role:"title",size:f2.size,maxLines:1,color:"ink"});
  }
});
