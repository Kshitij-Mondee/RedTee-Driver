// @design assembled_reply: a question gains one actionable row at a time beside its workplace
// Treatments: static checklist with signalling; four separate cards; chosen, one thread accumulates rows as the reply is built.
Loom.scene("b23", {
  build(ctx) {
    const tRead=ctx.cue("read the last status");
    const tStation=ctx.cue("Name the station");
    const tHold=ctx.cue("usual hold-up");
    const tExpectation=ctx.cue("set the expectation");
    // @form office_return: a fresh colour board establishes the colleague's workplace after the cut
    const board=ctx.el("board",{x:96,y:84,w:1728,h:846,kind:"scenery",exit:"none"});
    const world=Loom.lesson.world_board(ctx,board.inner,{state:"day"});
    board.handle=world;
    world.setState("day",ctx.start);
    world.frame("office",ctx.start,{dur:0.001});
    // @form assembled_thread: the question stays above the reply while each numbered step arrives on its words
    const card=ctx.el("chat_card",{x:1250,y:240,w:510,h:500,kind:"card",exit:"recede"});
    const thread=Loom.lesson.chat_card(ctx,card.inner,{state:"question"});
    card.handle=thread;
    ctx.m.reveal(card,tRead,{dur:ctx.style.dur("enter")});
    thread.setLines(1,tRead);
    thread.setLines(2,tStation);
    thread.setLines(3,tHold);
    thread.setLines(4,tExpectation);
  }
});
