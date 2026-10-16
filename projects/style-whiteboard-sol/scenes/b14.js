// @design blank_slot_handoff: an empty ruled frame gains one coloured prompt, then a written pocket rule rests beneath it
/* Treatments: A, static card with a signalled slot; B, card travelling toward viewer;
   C, chosen, marker outline followed by one prompt and phrasewise writing.
   C preserves the shared board grammar without decorative movement. */
Loom.scene("b14", {
  build(ctx, props) {
    const {kit, m} = ctx;
    const draw = ctx.style.dur("draw");
    const tAgenda = ctx.cue("Before your next meeting");
    const tQuestion = ctx.cue("as a question");
    const tName = ctx.cue("Name it");
    const tSteer = ctx.cue("steer it");
    const tBack = Math.min(ctx.cue("read it back"), ctx.at(0.84));
    // @form empty_ruled_card: a familiar artefact is now the viewer's blank agenda
    const agenda = ctx.el("agenda", {x:510, y:140, w:900, h:600, kind:"card", exit:"recede"});
    const card = Loom.lesson.invite_card(ctx, agenda.inner, {name:"learner_agenda", blank:true});
    card.draw(tAgenda);
    // @form coloured_question_slot: the only marker colour invites a decision question
    const slot = card.slotBox;
    const q = ctx.el("first_line_q", {x:slot.x, y:slot.y, w:slot.w, h:slot.h, parent:agenda.inner, kind:"mark", exit:"recede"});
    kit.fit("?", {role:"title", w:slot.w-24, h:slot.h-16, maxLines:1});
    kit.text(q.inner, "?", {role:"title", x:12, y:8, w:slot.w-24, h:slot.h-16, maxLines:1, color:"accent", valign:"middle"});
    m.unmask(q, tQuestion, {dur:draw*0.45});
    // @form written_pocket_rule: three short clauses appear in spoken order, without a container
    const words = ["Name it,", "steer it,", "read it back"];
    const fits = words.map(function(s){return kit.fit(s, {role:"title", w:1800, h:104, maxLines:1});});
    const widths = fits.map(function(f){return Math.ceil(f.width)+48;});
    const total = widths.reduce(function(a,b){return a+b;},0)+32;
    const rule = ctx.el("rule", {x:(1920-total)/2, y:776, w:total, h:120, kind:"text", exit:"wipe"});
    const times = [tName,tSteer,tBack];
    let x = 0;
    words.forEach(function(s,i){
      const E = ctx.el("rule_clause_"+i, {parent:rule.inner, x:x, y:0, w:widths[i], h:120, kind:"text", exit:"wipe"});
      kit.text(E.inner, s, {role:"title", x:16, y:8, w:widths[i]-32, h:104, maxLines:1, valign:"middle", color:"ink"});
      m.unmask(E,times[i],{dur:draw*Math.min(1.2,Math.max(0.45,s.length/14))});
      x += widths[i]+16;
    });
  }
});
