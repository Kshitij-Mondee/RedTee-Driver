// @design expanding_secret: a compact entry grows while its consequence stays visible
// Treatments: static field with a signal; expanding typed entry; separate comparison cards.
// Choose the typed entry: its length changing is the advice, inside the held application.
Loom.scene("b15", {
  build(ctx) {
    const A = ctx.engine.resume(ctx, "pm");
    const t = ctx.cue("a long passphrase");
    const field = "unlock.master";
    A.go("unlock", ctx.start);
    A.setValue(field, "", ctx.start);
    A.type(field, "long passphrase you'll remember", {at: t + ctx.style.dur("move"), click: false});
    // @form strength: the teaching signal grows with the longer masked entry
    const strength = ctx.el("strength", {x:410,y:600,w:900,h:18,kind:"instrument",exit:"collapse"});
    ctx.kit.rect(strength.inner,0,0,900,18,{fill:"field2",r:9});
    const fill = ctx.kit.rect(strength.inner,0,0,900,18,{fill:"accent2",r:9});
    ctx.m.grow(fill,t + ctx.style.dur("move"),{axis:"x",dur:3 * ctx.style.dur("draw")});
    A.callout(field, "Usually can't be recovered", {at: ctx.cue("It usually"), until: ctx.end, side: "below"});
  }
});
