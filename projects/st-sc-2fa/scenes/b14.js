// @design single_key_reveal: one protected entry opens a collection of separate records
// Treatments considered: static form with a signal; a lock icon opening; a live unlock form changing to a saved list.
// Chosen: live form and page change, because the single entry visibly opens the collection.
Loom.scene("b14", {
  build(ctx) {
    const W = ctx.engine;
    const enter = ctx.cue("The password manager");
    const locked = ctx.cue("an encrypted vault");
    const open = ctx.cue("opened with");
    const master = ctx.cue("one master password");
    // Exit every inherited surface at the chapter handoff, including the browser and phone.
    ["codes_card","vault","it_note","app","chapters","phone","codes"].forEach(name => {
      const E = ctx.held(name);
      if (E) ctx.m.exit(E,enter,"recede");
    });
    // @form manager_window: a persistent generic window with unlock and saved-login pages
    const A = W.app(ctx,"pm",{
      chrome:"window",title:"Password manager",
      frame:{x:96,y:120,w:1728,h:790},sidebarW:260,
      nav:[{id:"vault",label:"Vault",icon:"lock-keyhole"}],active:"vault",
      pages:{
        unlock:{title:"Encrypted vault",content:[
          {id:"unlock",kind:"form",title:"Password manager",fields:[
            {id:"master",label:"Master password",kind:"password",value:""}
          ],actions:[{id:"open",label:"Unlock",kind:"primary"}]}
        ]},
        vault:{title:"Vault",content:[
          {id:"logins",kind:"list",title:"Saved logins",items:[
            {id:"company",title:"Company account",icon:"key-round"},
            {id:"shop",title:"Shop",icon:"key-round"}
          ]}
        ]}
      },start:"unlock"
    },{at:enter,exit:"none"});
    // @form master_field: semantic field anchor retained with the window for the next beat
    const field = ctx.el("master_field",{x:410,y:350,w:1320,h:110,kind:"instrument",exit:"none"});
    field.app = A;
    field.partId = "unlock.master";
    ctx.m.reveal(field,locked);
    A.callout("unlock.master","Master password",{at:open,until:ctx.at(0.86),side:"below"});
    A.type("unlock.master","password",{at:master,click:false});
    A.go("vault",ctx.at(0.90));
    A.pointerOut(ctx.at(0.90));
  }
});
