// @design road_return: a question crosses the model and lands beside the recipient's desk
Loom.scene("b02", {
  build(ctx) {
    // Treatments: static desk with a signalling card; cut from street to desk;
    // chosen: one retained board and a camera flight, so the question crosses the same system.
    const board = ctx.held('board');
    const world = board.handle;
    const B = world.B;
    const tAsk = ctx.cue("She asks you");
    const tQuestion = ctx.cue("where it is");
    const tLook = ctx.cue("Where would you look");
    world.frame('office', tAsk, {dur:1.8, fly:true});
    // @form incoming_question: the incoming thread stays beside, not over, the desk
    const card = ctx.el('chat_card', {x:1250, y:240, w:510, h:138, kind:'card', exit:'recede'});
    card.handle = Loom.lesson.chat_card(ctx, card.inner, {state:'question'});
    // Fit this question-only instance without altering the later reply instances.
    card.handle.group.querySelector('rect').setAttribute('height', 138);
    ctx.m.reveal(card, tQuestion, {dur:ctx.style.dur('enter')});
    world.setState('grey', tLook);
    B.focus([world.office, world.desk, world.orderPlate], tLook);
    // Leave the one board in office framing, with office furniture in focus.
    // b03 restores day before widening. The question card recedes at this join.
  }
});
