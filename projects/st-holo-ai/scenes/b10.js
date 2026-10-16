// @design ranked_light: unequal lengths make the next choice visible
// Treatments considered: static ranked bars with a single edge signal; rows grown from zero; a rotating score wheel. Chosen: grown rows, because scoring is the change.
Loom.scene("b10", {
  build(ctx) {
    const H = ctx.engine.hud(ctx, {name:"loop_hud"});
    const k = ctx.kit, m = ctx.m;
    const enter = ctx.cue("Now it scores");
    const score = ctx.cue("scores every token it knows");
    const likely = ctx.cue("How likely");
    const noteAt = ctx.cue("come next");
    const geom = {
      reply:{x:160,y:410,w:700,h:220},
      bars:{x:980,y:300,w:760,h:490},
      slot:{x:40,y:85,w:24,h:46},
      baseline:{x1:40,y1:146,x2:660,y2:146}
    };
    // @form empty_slot: the answer has not been written yet
    const R = H.frame("reply_line", {...geom.reply, tone:"line", plate:true, at:enter});
    const reply = R.E;
    reply.handle = R;
    reply.geometry = geom;
    const b = geom.baseline;
    k.line(reply.inner,b.x1,b.y1,b.x2,b.y2,{stroke:ctx.c("line"),sw:2});
    const cursor = k.rect(reply.inner,geom.slot.x,geom.slot.y,geom.slot.w,geom.slot.h,{fill:ctx.c("muted")});
    reply.cursor = cursor;
    H.power(R,"up",enter);
    // @form ranked_candidates: scores are illustrative lengths, never reported measurements
    const B = H.bars("bars", {
      ...geom.bars, rows:[["Expense",0.86,"info"],["Claims",0.56,"info"],["You",0.28,"info"]],
      max:1, labelW:190, valueW:0, rowH:116, barH:32, fill:0.45,
      at:score, by:score + ctx.style.dur("draw")
    });
    B.E.handle = B;
    B.E.geometry = geom;
    B.E.candidates = ["Expense","Claims","You"];
    // H.bars prints values by default. This diagram deliberately shows only rank.
    B.E.inner.querySelectorAll("text").forEach(function(t){
      if (/^[0-9.]+$/.test(t.textContent.trim())) t.setAttribute("display","none");
    });
    // @form score_edge: one emphasis identifies the leading candidate
    const top = B.bar(0);
    m.emphasis(top.E || top,likely);
    // @form illustrative_plate: the ranking is a demonstration, not measured output
    const N = H.frame("illustrative_note",{x:1450,y:814,w:290,h:58,tone:"line",plate:true,at:noteAt});
    k.fit("illustrative",{role:"caption",w:254,h:34,maxLines:1});
    k.text(N.E.inner,"illustrative",{x:18,y:12,w:254,h:34,role:"caption",color:ctx.c("muted"),maxLines:1});
    m.reveal(N.E,noteAt);
  }
});
