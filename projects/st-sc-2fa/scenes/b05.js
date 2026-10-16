// @design second_screen_proof: a second device supplies the proof that a copied secret cannot supply
// Treatments considered: static paired labels; staged form rows; second-screen arrival.
// Chosen: staged form rows and a second-screen arrival, so the added proof has a visible source.
Loom.scene("b05", {
  build(ctx) {
    const W = ctx.engine;
    const tProof = ctx.cue("adds a second proof");
    const tKnow = ctx.cue("something you know");
    const tHave = ctx.cue("something you have");
    // @form browser_shell: one persistent company account shell
    const A = W.app(ctx, "app", {
      chrome: "browser", url: "Company account", brand: "",
      frame: {x:96,y:150,w:1300,h:720}, sidebarW:210,
      nav: [{id:"security",label:"Security settings",icon:"shield"}], active:"security",
      pages: {
        password: { title:"Two-step sign-in", content:[
          {id:"signin",kind:"form",title:"Company account",fields:[
            {id:"password",label:"Password",kind:"password",value:"password"}
          ]}
        ]},
        proof: { title:"Two-step sign-in", content:[
          {id:"signin",kind:"form",title:"Company account",fields:[
            {id:"password",label:"Password",kind:"password",value:"password"},
            {id:"code",label:"Code",value:""}
          ],actions:[{id:"sign_in",label:"Sign in",kind:"primary"}]}
        ]}
        ,walkthrough: {title:"",content:[]}
      }, start:"password"
    }, {at:ctx.start,exit:"none"});
    A.go("proof",tProof);
    // @form know_annotation: teaching label tied to the password row
    const know = Loom.treat.label(ctx,"know_tag",{
      x:670,y:140,text:"Something you know",to:[805,445],tone:"accent2",role:"label",as:"pill",t:tKnow
    });
    // @form authenticator_phone: the physical source of the additional proof
    const phone = ctx.el("phone",{x:1470,y:170,w:340,h:680,kind:"instrument",exit:"displace"});
    const H = Loom.lesson.phone(ctx,phone.inner,{state:"code",code:"482731"});
    phone.kit = H;
    phone.handle = H;
    ctx.m.reveal(phone,tHave);
    H.slideIn(tHave);
    H.countdown(tHave,0);
    // @form have_annotation: teaching label tied to the second device
    const have = Loom.treat.label(ctx,"have_tag",{
      x:1430,y:140,text:"Something you have",to:[1470,235],tone:"accent2",role:"label",as:"pill",t:tHave
    });
    ctx.m.emphasis(have,tHave);
  }
});
