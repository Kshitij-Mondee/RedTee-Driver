// @design excluded_vector: a measured length remains while an attempted bearing is cancelled
// Treatments: static signalled length; arrow cancellation; paired distance and bearing panels. Choose cancellation because removing direction is the visual argument.
Loom.scene("b13", {
  build(ctx) {
    const distance = ctx.cue("That gives a distance");
    const ground = ctx.held("ground");
    const point = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const denied = ctx.cue("Not a direction");
    const only = ctx.cue("only a distance");
    const draw = ctx.style.dur("draw"), enter = ctx.style.dur("enter");
    // @form measured_span: the ranging kit owns the length from the established broadcaster to the point
    const range = ctx.el("range_line", {x:0,y:0,w:1920,h:1080,kind:"connector",exit:"none"});
    const h = Loom.lesson.range_circles(ctx,range.inner,{});
    range.handle = h;
    h.setState("range_line",distance,{dur:draw});
    ctx.m.reveal(range,distance,{dur:enter});
    // @form length_tag: one measured word names the span after the line appears
    ctx.kit.fit("distance",{role:"label",w:180,h:50,maxLines:1});
    const tag = Loom.treat.label(ctx,"range_tag",{x:695,y:521,text:"distance",role:"label",tone:"muted",t:distance+draw});
    range.followers = [tag];
    // @form attempted_bearing: a neutral arrow points back toward the established source
    const dir = ctx.el("dir_arrow",{x:815,y:647,w:164,h:184,kind:"connector",exit:"recede"});
    const arrow = ctx.kit.arrow(dir.inner,145,165,23,31,{stroke:"muted"});
    ctx.m.draw(arrow,denied,{dur:ctx.style.dur("move")});
    // @form rejected_bearing: the error mark cancels only the directional claim
    const strike = Loom.treat.mark(ctx,"direction_cancel",{x:899,y:745,size:66,kind:"no",t:denied+enter});
    ctx.m.exit(dir,only,"recede");
    ctx.m.exit(strike,only,"recede");
  }
});
