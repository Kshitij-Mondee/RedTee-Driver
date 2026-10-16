// @design three_failure_tiles: one copied token branches, is captured, then joins a moving inventory
// Treatments considered: static signalled triptych; one page replaced three times; three live miniature scenes. Choose live scenes because each failure must happen.
Loom.scene("b04", {
  build(ctx) {
    const k = ctx.kit, m = ctx.m;
    const cardsAt = ctx.cue("fails three ways");
    const reuseAt = ctx.cue("Reuse");
    const openAt = ctx.cue("opens every account");
    const phishAt = ctx.cue("Phishing");
    const collectAt = ctx.cue("collects it");
    const listsAt = ctx.cue("Leaked lists");
    const triedAt = ctx.cue("get tried everywhere");
    const work = ctx.held("work"), toggles = ctx.held("toggles");
    // Preserve b03's chapter-band clearance while the held windows leave.
    if (work) {
      m.travel(work, ctx.start, {x:0,y:100,scale:1});
      m.exit(work, ctx.start, "recede");
    }
    if (toggles) {
      m.travel(toggles, ctx.start, {x:0,y:100,scale:1});
      m.exit(toggles, ctx.start, "recede");
    }
    const xs = [132, 700, 1268];
    // @form miniature_triptych: neutral desk tiles give each failure a concrete scene
    const tiles = xs.map((x,i) => Loom.treat.panel(ctx, ["tile_reuse","tile_phish","tile_lists"][i], {x, y:260, w:520, h:540, fill:"surface", tone:"line", t:cardsAt + i * ctx.style.dur("stagger")}));
    const cues = [reuseAt, phishAt, listsAt];
    const labels = ["Reuse", "Phishing", "Leaked lists"];
    tiles.forEach((P,i) => {
      const L = ctx.el("failure_title_"+i,{x:xs[i]+32,y:290,w:456,h:64,kind:"text",exit:"wipe"});
      k.fit(labels[i],{role:"lead",w:456,h:64,maxLines:1});
      k.text(L.inner,labels[i],{x:0,y:0,w:456,h:64,role:"lead",weight:700,color:"ink"});
      m.reveal(L,cues[i]);
      m.exit(L,ctx.speechEnd,"recede");
      const H = ctx.el("tile_lit_"+i,{x:xs[i],y:260,w:520,h:540,kind:"scenery",exit:"recede"});
      k.rect(H.inner,3,3,514,534,{fill:"none",stroke:"accent2",r:12});
      m.reveal(H,cues[i]);
      if(i<2) m.exit(H,cues[i+1],"recede");
    });
    // @form one_key_many_accounts: the same kit chip fans into three opening sign-in windows
    const chip = ctx.el("chip",{x:262,y:405,w:260,h:56,kind:"token",exit:"recede"});
    chip.kit = Loom.lesson.password_chip(ctx,chip.inner,{state:"masked"});
    m.reveal(chip,reuseAt);
    for(let i=0;i<3;i++) {
      const bx = 172+i*152;
      const B = ctx.el("reuse_signin_"+i,{x:bx,y:580,w:136,h:150,kind:"instrument",exit:"recede"});
      k.rect(B.inner,0,0,136,150,{fill:"surface2",stroke:"line",r:10});
      k.line(B.inner,0,28,136,28,{stroke:"field2",sw:2});
      k.rect(B.inner,20,102,96,22,{fill:"surface",stroke:"line",r:5});
      m.reveal(B,reuseAt);
      const A=ctx.el("reuse_branch_"+i,{x:bx+68,y:477,w:Math.abs(392-bx-68)+8,h:95,kind:"connector",exit:"recede"});
      const dx=392-(bx+68);
      const arrow=k.arrow(A.inner,dx,0,0,95,{stroke:"line"});
      m.draw(arrow,openAt+i*ctx.style.dur("stagger"));
      const closed=ctx.el("reuse_closed_"+i,{x:bx+45,y:626,w:48,h:48,kind:"icon",exit:"recede"});
      k.icon(closed.inner,"lock-keyhole",{x:0,y:0,size:48,color:"muted"});
      m.reveal(closed,reuseAt);
      m.exit(closed,openAt+i*ctx.style.dur("stagger"),"recede");
      const opened=ctx.el("reuse_open_"+i,{x:bx+45,y:626,w:48,h:48,kind:"icon",exit:"recede"});
      k.icon(opened.inner,"lock-keyhole-open",{x:0,y:0,size:48,color:"pos"});
      m.reveal(opened,openAt+i*ctx.style.dur("stagger"));
    }
    // @form page_collects_password: a look-alike form sends its masked entry into a net
    const page=ctx.el("phish_page",{x:754,y:390,w:412,h:210,kind:"instrument",exit:"recede"});
    k.rect(page.inner,0,0,412,210,{fill:"surface2",stroke:"line",r:10});
    k.line(page.inner,0,34,412,34,{stroke:"field2",sw:2});
    k.rect(page.inner,54,82,304,54,{fill:"surface",stroke:"line",r:8});
    k.rect(page.inner,125,158,162,28,{fill:"field2",r:6});
    m.reveal(page,phishAt);
    const net=ctx.el("phish_net",{x:842,y:651,w:240,h:102,kind:"instrument",exit:"recede"});
    k.path(net.inner,"M 0 0 L 35 94 L 205 94 L 240 0 Z",{fill:"surface2",stroke:"line",sw:3});
    for(let i=1;i<6;i++) k.line(net.inner,40*i,0,35+28*i,94,{stroke:"line",sw:2});
    k.line(net.inner,12,30,228,30,{stroke:"line",sw:2});
    k.line(net.inner,24,62,216,62,{stroke:"line",sw:2});
    m.reveal(net,collectAt);
    for(let i=0;i<8;i++) {
      const D=ctx.el("captured_dot_"+i,{x:838+i*30,y:493,w:12,h:12,kind:"token",exit:"recede"});
      k.disc(D.inner,6,6,6,{fill:"ink"});
      m.reveal(D,phishAt+i*ctx.style.dur("stagger"));
      m.exit(D,collectAt+i*ctx.style.dur("stagger"),"sink");
      const caught=ctx.el("net_dot_"+i,{x:884+i*20,y:690+(i%2)*22,w:12,h:12,kind:"token",exit:"recede"});
      k.disc(caught.inner,6,6,6,{fill:"ink"});
      m.reveal(caught,collectAt+ctx.style.dur("move")+i*ctx.style.dur("stagger"));
    }
    // @form moving_masked_inventory: a clipped mono list moves through a long leaked sheet
    const sheet=ctx.el("leaked_sheet",{x:1330,y:390,w:396,h:358,kind:"instrument",exit:"recede"});
    k.rect(sheet.inner,0,0,396,358,{fill:"surface2",stroke:"line",r:10});
    const defs=Loom.svg('defs',{},sheet.inner);
    const mask=Loom.svg('clipPath',{id:'b04-list-clip'},defs);
    Loom.svg('rect',{x:16,y:16,width:364,height:326},mask);
    const viewport=Loom.svg('g',{'clip-path':'url(#b04-list-clip)'},sheet.inner);
    const rows=Loom.svg('g',{},viewport);
    for(let i=0;i<10;i++) {
      const y=i*54;
      k.line(rows,28,y+46,342,y+46,{stroke:"field2",sw:2});
      for(let j=0;j<8;j++) k.disc(rows,38+j*20,y+25,4,{fill:"ink"});
    }
    m.reveal(sheet,listsAt);
    Loom.drive(function(e){rows.setAttribute('transform','translate(0 '+(16-162*e)+')');},triedAt,ctx.style.dur("draw"),'move');
    // Finish the canvas exit before the next application's browser chrome arrives.
    // Panels remain behind their mini-scenes through the canvas join.
  }
});
