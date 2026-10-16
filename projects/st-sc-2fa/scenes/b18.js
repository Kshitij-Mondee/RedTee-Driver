// @design origin_bound_fill: a stored value returns only within its matching address
// Treatments: static paired fields and address signal; travelling stored token; native Save then automatic field fill. Choose native fill because the absence of typing is the claim.
Loom.scene("b18", {
  build(ctx) {
    const site = ctx.held("site");
    const A = ctx.engine.resume(ctx, "site");
    const save = ctx.cue("Save it");
    const fill = ctx.cue("autofill types it for you");
    const address = ctx.cue("only on the address");
    // @form stored_value_return: Save commits the generated account-specific value
    A.click("dialog.action.save", {at:save});
    A.closeDialog(save + ctx.style.dur("enter"));
    A.zoomOut({at:save + ctx.style.dur("move")});
    // Return to the existing sign-in page, then let the manager fill both fields.
    const returnToSignIn = save + ctx.style.dur("move");
    A.go("signin", returnToSignIn);
    A.setValue("login.email", "", returnToSignIn);
    A.setValue("login.password", "", returnToSignIn);
    // @form automatic_fill: simultaneous product values, no pointer movement or keystrokes
    A.setValue("login.email", "Sam", fill);
    A.setValue("login.password", "vQ7!mR2#xL9@tK4%pN6&", fill);
    A.pointerOut(fill);
    // Keep the whole browser below the chapter band instead of cropping into the address.
    ctx.m.travel(site, returnToSignIn, {x:0,y:22,scale:1});
    // @form origin_callout: the address receives the only sustained teaching emphasis
    A.callout("url", "only on the address", {at:address, until:ctx.end, side:"below"});
    site.exit = "recede";
  }
});
