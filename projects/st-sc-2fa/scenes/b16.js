// @design offer_to_record: an accepted offer becomes a durable entry
Loom.scene("b16", {
  build(ctx, props) {
    /* Three treatments: static form and highlighted Save; a drop-down offer becomes an entry; a close camera follows every field.
       Choose the offer becoming an entry. Sign-in remains familiar context, Save is the one emphasis. */
    const W = ctx.engine;
    const sign = ctx.cue("Sign in to a site as usual");
    const offer = ctx.cue("When the manager offers");
    const save = ctx.cue("click Save");
    // @form familiar_signin: a neutral browser carries the login into account settings
    const A = W.app(ctx, "site", {
      chrome:"browser", url:"portal.example",
      frame:{x:96,y:124,w:1728,h:810},
      pages:{
        signin:{title:"Sign in",content:[{id:"login",kind:"form",cols:1,fields:[
          {id:"email",label:"Email",value:"Sam"},
          {id:"password",label:"Password",kind:"password",value:""}
        ],actions:[{id:"signin",label:"Sign in",kind:"primary"}]}]},
        account:{title:"Account",toolbar:[{id:"manager",label:"Password manager"},{id:"change",label:"Change",kind:"ghost"}],content:[
          {id:"account",kind:"detail",title:"Account",rows:[["Email","Sam"],["Password","********"]]}
        ]}
      },start:"signin"
    },{at:ctx.start,exit:"none"});
    A.pointer(sign,{x:1100,y:620});
    A.type("login.password","********",{at:sign,click:false});
    A.click("login.action.signin",{at:ctx.at(0.35),go:"account"});
    // @form manager_offer: the manager owns this confirmation, not the site
    A.menu("tool.manager",[{id:"address",label:"portal.example"},{id:"save",label:"Save"}],{at:offer,w:420});
    A.click("menu.save",{at:save});
    A.closeMenu(save+ctx.style.dur("move"));
    // Named prompt carries the saved vault entry and the dialog owner across the join.
    const manager = A.part("tool.manager");
    const prompt = ctx.el("prompt",{x:manager.x+manager.w-580,y:manager.y+manager.h+12,w:580,h:156,kind:"card",exit:"recede"});
    prompt.app = A;
    ctx.kit.rect(prompt.inner,0,0,580,156,{fill:"surface",stroke:"line",r:12,shadow:true});
    ctx.kit.fit("Password manager",{role:"body",w:516,h:44,maxLines:1});
    ctx.kit.text(prompt.inner,"Password manager",{role:"body",x:32,y:20,w:516,h:44,color:"ink"});
    ctx.kit.icon(prompt.inner,"check",{x:32,y:92,size:28,color:"pos"});
    ctx.kit.text(prompt.inner,"portal.example",{role:"lead",x:80,y:80,w:468,h:52,color:"ink"});
    ctx.m.reveal(prompt,save+ctx.style.dur("move"));
    // @form acceptance_ring: one teaching halo names the accepted action
    const target=A.part("menu.save");
    const ring=ctx.el("click_ring",{x:target.x+target.w/2-36,y:target.y+target.h/2-36,w:72,h:72,kind:"icon",exit:"iris"});
    // The app engine draws the visible press ring on the transformed menu item.
    // This named anchor is its continuity receipt, not a second painted ring.
    ring.outer.parentNode.setAttribute("data-bleed", offer+"-"+ctx.end);
    ctx.m.reveal(ring,save);
    ctx.m.exit(ring,save+ctx.style.dur("enter"),"iris");
  }
});
