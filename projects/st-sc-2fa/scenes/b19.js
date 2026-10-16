// @design mismatch_pair: matching surfaces diverge when the address changes
// Treatments considered: static paired forms with signalling; a full camera push; paired forms with a magnified address inset. Keep both whole windows below the kicker and preserve the readable address comparison.
Loom.scene("b19", {
  build(ctx) {
    const W = ctx.engine, k = ctx.kit, m = ctx.m;
    const arrival = ctx.cue("A look-alike page");
    const warning = ctx.cue("a warning sign");
    // @form comparison_browser: identical sign-in pages differ in their saved-address match
    function spec(url, x) {
      return {chrome:"browser",url,frame:{x,y:220,w:840,h:600},sidebarW:0,
        page:{title:"Company account"},content:[{id:"login",kind:"form",title:"Sign in",fields:[
          {id:"name",label:"Account",value:""},
          {id:"password",label:"Password",kind:"password",value:""}
        ],actions:[{id:"signin",label:"Sign in",kind:"primary"}]}]};
    }
    const real = W.app(ctx,"real",spec("portal.example",96),{at:ctx.start,exit:"displace"});
    const fake = W.app(ctx,"fake",spec("p0rtal.example",984),{at:arrival,exit:"displace"});
    real.setValue("login.name","Sam",arrival);
    real.setValue("login.password","********",arrival);
    // @form url_lenses: enlarged addresses keep the changed character readable without losing the empty form
    const addresses = ctx.el("address_lenses",{x:96,y:112,w:1728,h:84,kind:"text",exit:"recede"});
    k.fit("portal.example",{role:"lead",w:760,h:64,maxLines:1});
    k.text(addresses.inner,"portal.example",{x:24,y:8,w:760,h:64,role:"lead",size:40,color:"ink",maxLines:1});
    k.text(addresses.inner,"p0rtal.example",{x:912,y:8,w:760,h:64,role:"lead",size:40,color:"ink",maxLines:1});
    m.reveal(addresses,arrival);
    // @form mismatch_flag: teaching ring identifies the changed letter, warning points to the empty fields
    const flag = ctx.el("flag",{x:984,y:112,w:840,h:708,kind:"icon",exit:"recede"});
    const ring = k.path(flag.inner,"M 68 12 A 24 28 0 1 1 67.9 12",{fill:"none",stroke:"accent2",sw:4});
    k.icon(flag.inner,"triangle-alert",{x:746,y:450,size:44,color:"accent4"});
    m.reveal(flag,warning);
    // @form qualified_warning: an empty autofill is a clue, never proof
    const note = Loom.treat.panel(ctx,"warning_note",{x:488,y:832,w:944,h:90,fill:"surface",tone:"accent2",t:warning});
    k.fit("Warning sign, not a guarantee",{role:"lead",w:880,h:64,maxLines:1});
    k.text(note.inner,"Warning sign, not a guarantee",{x:24,y:13,w:896,h:64,role:"lead",size:34,color:"ink",maxLines:1});
  }
});
