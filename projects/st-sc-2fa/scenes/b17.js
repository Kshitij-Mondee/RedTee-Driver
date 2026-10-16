// @design value_replacement: a reused value gives way to an account-specific generated value
// Treatments considered: static before-and-after with signalling; travelling replacement; native Generate press and immediate field update. Choose native press because it shows the reproducible action.
Loom.scene("b17", {
  build(ctx) {
    const site = ctx.held("site");
    const A = ctx.engine.resume(ctx,"site");
    // Keep the contextual manager control inside the zoomed frame.
    const manager = A.part("tool.manager");
    const managerInset = ctx.group();
    manager.g.parentNode.insertBefore(managerInset, manager.g);
    managerInset.appendChild(manager.g);
    managerInset.setAttribute("transform","translate(-100,2)");
    manager.x -= 100;
    manager.y += 2;
    const open = ctx.cue("open Change password");
    const generate = ctx.cue("click Generate");
    const result = ctx.cue("long, random");
    const unique = ctx.cue("unique to this account");
    // Aim the cursor at empty lower-right button padding, not its label.
    const changeButton = A.part("tool.change");
    A.parts["tool.change.padding"] = {...changeButton,id:"tool.change.padding",x:changeButton.x+changeButton.w-12,y:changeButton.y+changeButton.h-7,w:4,h:4};
    A.click("tool.change.padding",{at:open});
    // @form change_password_form: an account field and manager action within the held application
    const change = Loom.treat.label(ctx,"change",{x:1390,y:68,text:"Change password",tone:"ink",role:"label",t:ctx.start});
    change.handle = A;
    // Plain product panel, deliberately no native dialog or close icon.
    // It belongs to the held site's overlay layer, so Save in b18 can close it.
    const panel = ctx.group();
    A.layers.over.appendChild(panel);
    ctx.kit.rect(panel,570,300,780,370,{fill:"surface",stroke:"field2",r:16});
    ctx.kit.text(panel,"Change password",{role:"body",size:28,x:610,y:332,w:700,h:46,color:"ink"});
    ctx.kit.text(panel,"New password",{role:"label",size:24,x:610,y:404,w:700,h:38,color:"ink"});
    const field = ctx.kit.rect(panel,610,452,700,66,{fill:"surface",stroke:"line",r:10});
    const value = ctx.kit.text(panel,"vQ7!mR2#xL9@tK4%pN6&",{role:"label",size:24,x:628,y:466,w:660,h:40,color:"ink"});
    const gen = ctx.kit.rect(panel,610,558,210,64,{fill:"accent",r:10});
    ctx.kit.text(panel,"Generate",{role:"label",size:24,x:628,y:571,w:174,h:38,color:"onAccent",align:"center"});
    const saveButton = ctx.kit.rect(panel,1100,558,210,64,{fill:"surface",stroke:"line",r:10});
    ctx.kit.text(panel,"Save",{role:"label",size:24,x:1118,y:571,w:174,h:38,color:"ink",align:"center"});
    // Register stable targets for native pointer, camera and next beat's Save.
    A.parts["dialog"] = {id:"dialog",kind:"region",x:570,y:300,w:780,h:370,g:panel};
    A.parts["dialog.new"] = {id:"dialog.new",kind:"region",x:610,y:452,w:700,h:66,g:panel,r:field};
    A.parts["dialog.action.generate"] = {id:"dialog.action.generate",kind:"region",x:610,y:558,w:210,h:64,g:panel,r:gen};
    A.parts["dialog.action.save"] = {id:"dialog.action.save",kind:"region",x:1100,y:558,w:210,h:64,g:panel,r:saveButton};
    Loom.tween(panel,{opacity:0},{opacity:1},open+ctx.style.dur("move"),{dur:ctx.style.dur("enter")});
    Loom.tl.set(value,{opacity:0},ctx.start);
    Loom.tl.set(value,{opacity:1},result);
    const closeNativeDialog = A.closeDialog.bind(A);
    A.closeDialog = function(t) {
      Loom.tl.set(panel,{opacity:0},t);
      return closeNativeDialog(t);
    };
    // End state: site held, generated value visible, dialog.new and Save target live.
    A.zoom("dialog",{at:open+ctx.style.dur("move")+ctx.style.dur("enter"),dur:ctx.style.dur("move"),scale:1.6,read:"dialog.new"});
    // @form generate_press: native pointer and accent2 press ring signal the one action
    const click_ring = ctx.held("click_ring");
    A.click("dialog.action.generate",{at:generate});
    // Illustrative generated value only, not a recommended password to copy.
    // The generated value is revealed atomically above, not typed character by character.
    A.callout("dialog.new","unique to this account",{at:unique,until:ctx.end-ctx.style.dur("move"),side:"below"});
    A.zoomOut({at:ctx.end-ctx.style.dur("move"),dur:ctx.style.dur("move")});
  }
});
