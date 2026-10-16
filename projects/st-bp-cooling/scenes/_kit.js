Loom.lesson = Loom.lesson || {};
/* One shared section geometry. Layers: centre lines, structural outlines, detail,
   state overlays and labels. All geometry and lettering use the blueprint engine. */
const coolingGeometry = {
  rackFronts:[[760,550],[940,550]], rackBacks:[[620,550],[1080,550]],
  coldAisle:[850,580], hotAisles:[[560,550],[1140,550]], tiles:[[800,720],[900,720]],
  ceilingReturn:[[1140,400],[1140,300],[190,300],[190,420]],
  floorPlenum:[[190,710],[190,760],[850,760],[850,720],[850,500]],
  crahTops:[[190,420],[310,420],[430,420]], crahBases:[[190,710],[310,710],[430,710]],
  coilIn:[[140,560],[260,560],[380,560]], coilOut:[[240,560],[360,560],[480,560]],
  supply:[[1650,650],[1650,670],[1370,670],[1370,740],[1370,790],[100,790],[100,560],[140,560]],
  returnPipe:[[240,580],[500,580],[500,820],[1800,820],[1800,540],[1740,540]],
  pumpA:[1370,740], pumpB:[1510,740], tank:[1740,730], chiller:[1640,540],
  riser:[[1740,500],[1820,500],[1820,280],[1640,280],[1640,240]], roofTop:[1580,130]
};
const coolingPart = function(ctx,parent,opts,id) {
  opts=opts||{};
  opts.drafted=opts.drafted!==false;
  const W=ctx.engine, D=ctx._coolingSheet||(ctx._coolingSheet=W.sheet(ctx));
  const name=(opts.name||id)+'_'+(ctx._coolingSerial=(ctx._coolingSerial||0)+1);
  const root=ctx.el(name,{x:0,y:0,w:1920,h:960,parent:parent,kind:'scenery',exit:'none'});
  if(opts.w||opts.h) root.inner.setAttribute('transform','scale('+((opts.w||1920)/1920)+' '+((opts.h||960)/960)+')');
  const at=opts.at===undefined?ctx.start:opts.at;
  const dur=ctx.style.dur('draw');
  const timing={at:at, by:at+dur, parallel:true};
  function drafted(e){if(opts.drafted)e.inner.querySelectorAll('path,line,circle,rect,polyline,polygon').forEach(p=>Loom.tl.set(p,{strokeDasharray:'none',strokeDashoffset:0,opacity:1},at));return e;}
  const nodes={};
  function el(n,x,y,w,h){const e=ctx.el(name+'_'+n,{x:x||0,y:y||0,w:w||1920,h:h||960,parent:root.inner,kind:'mark',exit:'none'});nodes[n]=e;return e;}
  function part(n,layers,tone){const e=el(n);const marks=[].concat(layers.centre||[],layers.outline||[],layers.detail||[],layers.hidden||[],layers.hatch||[]);D.draw(e,marks,Object.assign({},timing,{pen:tone||'ink'}));return drafted(e);}
  function draw(n,marks,tone){const e=el(n);D.draw(e,marks,Object.assign({},timing,{pen:tone||'ink',parallel:true}));return drafted(e);}
  function label(n,text,x,y,w,h,tone){const e=el(n,x,y,w,h);D.letter(e,text,Object.assign({},timing,{role:'label',size:24,align:'center',valign:'middle',quick:true,pen:tone||'ink'}));return drafted(e);}
  function visible(e,on,t){Loom.tl.set(e.inner,{opacity:on?1:0},t===undefined?ctx.start:t);}
  function swap(groups,s,t){Object.keys(groups).forEach(k=>visible(groups[k],k===s,t));}
  function highlight(box,t,end){const e=draw('highlight_'+Object.keys(nodes).length,W.rect(box[0],box[1],box[2],box[3]),'accent');visible(e,false,ctx.start);Loom.tween(e.inner,{opacity:0},{opacity:1,duration:ctx.style.dur('enter')},t);Loom.tween(e.inner,{opacity:1},{opacity:0,duration:ctx.style.dur('exit')},end===undefined?t+dur:end);return e;}
  function rotor(n,cx,cy,r,state){
    const e=el(n,cx,cy,r*2,r*2);D.draw(e,[].concat(W.circle(0,0,r),W.circle(0,0,5),W.line(-r+5,0,r-5,0),W.line(0,-r+5,0,r-5)),Object.assign({},timing,{parallel:true}));
    const events=[{t:ctx.start,s:state||'running'}];
    const span=Math.max(1,ctx.end-ctx.start);
    Loom.drive((p,raw)=>{const now=ctx.start+raw*span;const sorted=events.slice().sort((a,b)=>a.t-b.t);let a=0;sorted.forEach((ev,i)=>{const end=Math.min(now,i+1<sorted.length?sorted[i+1].t:now);if(end>ev.t&&(ev.s==='running'||ev.s==='starting'))a+=(end-ev.t)*(ev.s==='starting'?140:240);});e.inner.setAttribute('transform','rotate('+a+')');},ctx.start,span,'linear');
    return {el:e,setState:function(s,t){events.push({s:s,t:t});}};
  }
  return {ctx:ctx,W:W,D:D,root:root,nodes:nodes,el:el,part:part,draw:draw,label:label,visible:visible,swap:swap,highlight:highlight,rotor:rotor,anchors:coolingGeometry};
};
Loom.lesson.hall_section = function(ctx,parent,opts) {
  opts=opts||{};const H=coolingPart(ctx,parent,opts,'hall_section'),W=H.W;
  let details=[].concat(W.line(120,720,1220,720),W.line(120,800,1220,800));
  const slots=[], racks=[[620,420,140,300],[940,420,140,300]];
  racks.forEach((r,i)=>{for(let j=0;j<6;j++){details=details.concat(W.rect(r[0]+12,r[1]+18+j*44,116,30));slots.push([r[0]+24,r[1]+33+j*44]);}});
  for(let x=775;x<=925;x+=25)details=details.concat(W.line(x,715,x+12,715));
  H.part('structure',{centre:W.centre(120,760,1220,760),outline:[].concat(W.path([[120,720],[120,260],[1220,260],[1220,800],[120,800]]),racks.flatMap(r=>W.rect(r[0],r[1],r[2],r[3]))),detail:details,hidden:W.hidden([[120,320],[1220,320]])});
  const lamps=H.draw('runningSlots',slots.flatMap(p=>W.line(p[0],p[1],p[0]+22,p[1],{weight:'detail'})),'line');
  const dim=H.draw('throttledSlots',slots.filter((p,i)=>i%3===0).flatMap(p=>W.line(p[0],p[1],p[0]+12,p[1],{weight:'thin'})),'muted');
  const panels=H.part('containment',{outline:[].concat(W.rect(760,400,180,20),W.rect(770,420,12,300),W.rect(918,420,12,300)),hidden:W.hidden([[850,420],[850,710]]),paper:false});
  H.visible(lamps,false);H.visible(dim,false);H.visible(panels,false);
  const handle={root:H.root,nodes:H.nodes,racks:racks,anchors:H.anchors,containment:panels,slots:lamps,
    highlight:function(t,end){return H.highlight([610,410,480,320],t,end);},
    setState:function(s,t){t=t===undefined?ctx.start:t;if(s==='contained'){H.visible(panels,true,t);H.visible(lamps,true,t);}else {H.visible(lamps,s==='running',t);H.visible(dim,s==='throttled',t);}}};
  handle.setState(opts.state||'still',ctx.start);return handle;
};
Loom.lesson.crah_row = function(ctx,parent,opts) {
  opts=opts||{};const H=coolingPart(ctx,parent,opts,'crah_row'),W=H.W,units=[];
  [140,260,380].forEach((x,i)=>{
    const box=[x,420,100,290], outlines={};
    H.draw('coil'+i,W.path([[x+12,520],[x+88,535],[x+12,550],[x+88,565],[x+12,580],[x+88,595],[x+12,610]]));
    outlines.running=H.part('unit'+i,{outline:W.rect(...box),paper:false});
    outlines.failed=H.draw('failed'+i,W.rect(...box),'accent3');
    outlines.standby=H.draw('standby'+i,W.hidden([[x,420],[x+100,420],[x+100,710],[x,710],[x,420]]),'accent4');
    outlines.starting=H.draw('starting'+i,[].concat(W.rect(...box),W.path([[x+62,440],[x+72,450],[x+90,430]])),'accent4');
    const fan=H.rotor('fan'+i,x+50,475,30,i===2?'standby':'running');
    H.label('crahLabel'+i,'crah '+(i+1),x-2,655,104,40);
    const unit={box:box,fan:fan,states:outlines,setState:function(s,t){t=t===undefined?ctx.start:t;H.swap(outlines,s,t);fan.setState(s,t);},highlight:function(t,end){return H.highlight(box,t,end);}};
    unit.setState(i===2?'standby':'running',ctx.start);units.push(unit);
  });
  const bracket=H.draw('bracket',[].concat(W.path([[140,740],[140,752],[360,752],[360,740]]),W.path([[380,740],[380,752],[480,752],[480,740]])),'muted');
  const n=H.label('n','N',210,756,80,35),spare=H.label('spare','spare',374,756,115,35,'accent4');[bracket,n,spare].forEach(e=>H.visible(e,false));
  return {root:H.root,nodes:H.nodes,units:units,anchors:H.anchors,setState:function(s,t,index){units[index===undefined?0:index].setState(s,t);},setUnit:function(index,s,t){units[index-1].setState(s,t);},bracket:function(t){[bracket,n,spare].forEach(e=>H.visible(e,true,t));},highlight:function(index,t,end){return units[index-1].highlight(t,end);}};
};
Loom.lesson.water_loop = function(ctx,parent,opts) {
  opts=opts||{};const H=coolingPart(ctx,parent,opts,'water_loop'),W=H.W,A=H.anchors;
  const supply=H.draw('supply',W.path(A.supply),'line'),ret=H.draw('return',W.path(A.returnPipe),'line');
  H.part('plant',{outline:[].concat(W.rect(1300,420,520,400),W.rect(1540,460,200,190),W.rect(1695,680,90,115)),detail:[].concat(W.path([[1370,790],[1370,770]]),W.path([[1510,790],[1510,770]]),W.path([[1370,710],[1370,670],[1650,670],[1650,650]]),W.path([[1510,710],[1510,670]])),paper:false});
  H.draw('branches',[].concat(W.path([[100,560],[100,540],[260,540],[260,560]]),W.path([[260,540],[380,540],[380,560]]),W.path([[360,580],[500,580]]),W.path([[480,580],[500,580]]),W.path([[1510,770],[1510,790],[1370,790]]),W.path([[1650,670],[1740,670],[1740,680]])));
  const riser=H.draw('riser',W.path(A.riser));
  H.label('chillerLabel','chiller',1540,520,200,50);H.label('tankLabel','buffer tank',1610,635,210,35);
  const pumps=[];
  [A.pumpA,A.pumpB].forEach((p,i)=>{
    const states={running:H.draw('pumpRun'+i,W.circle(p[0],p[1],32)),stopped:H.draw('pumpStop'+i,W.circle(p[0],p[1],34),'accent3'),standby:H.draw('pumpStandby'+i,W.hidden([[p[0]-35,p[1]-35],[p[0]+35,p[1]-35],[p[0]+35,p[1]+35],[p[0]-35,p[1]+35],[p[0]-35,p[1]-35]]),'accent4'),starting:H.draw('pumpStart'+i,[].concat(W.circle(p[0],p[1],34),W.path([[p[0]+20,p[1]-35],[p[0]+28,p[1]-27],[p[0]+43,p[1]-45]])),'accent4')};
    const fan=H.rotor('impeller'+i,p[0],p[1],23,i?'standby':'running');
    const pump={fan:fan,states:states,setState:function(s,t){t=t===undefined?ctx.start:t;H.swap(states,s,t);fan.setState(s,t);}};pump.setState(i?'standby':'running',ctx.start);pumps.push(pump);
    H.label('pumpLabel'+i,i?'pump b':'pump a',p[0]-60,800,120,32);
  });
  const level=H.draw('tankLevel',W.line(1703,700,1777,700),'line');
  return {root:H.root,nodes:H.nodes,anchors:A,supply:supply,returnPipe:ret,riser:riser,pumps:pumps,tankLevel:level,setState:function(s,t,index){pumps[index===undefined?0:index].setState(s,t);},setPump:function(id,s,t){pumps[id==='b'||id===2?1:0].setState(s,t);},setLevel:function(value,t,dur){Loom.tween(level.inner,{y:0},{y:Math.max(0,Math.min(1,1-value))*75,duration:dur||ctx.style.dur('count')},t);},highlight:function(part,t,end){const b=part==='tank'?[1690,675,100,125]:part==='chiller'?[1535,455,210,200]:[1300,420,520,400];return H.highlight(b,t,end);}};
};
Loom.lesson.roof_cooler = function(ctx,parent,opts) {
  opts=opts||{};const H=coolingPart(ctx,parent,opts,'roof_cooler'),W=H.W;
  H.part('cooler',{outline:W.rect(1380,160,400,100),detail:[].concat(W.line(1360,280,1800,280),W.line(1420,260,1420,280),W.line(1740,260,1740,280),W.line(1400,190,1760,190)),paper:false});
  const fan=H.rotor('roofFan',1580,135,30,opts.state||'idle');
  H.label('roofLabel','cooling tower or dry cooler',1350,305,460,38);
  const heat=H.draw('roofHeat',[1460,1530,1630,1700].flatMap(x=>W.path([[x,100],[x-9,85],[x+8,70],[x,52]])),'accent2');H.visible(heat,false);
  Loom.drive((p,raw)=>{const phase=(raw*Math.max(1,ctx.end-ctx.start))%1;heat.inner.setAttribute('transform','translate(0 '+(-phase*25)+')');},ctx.start,Math.max(1,ctx.end-ctx.start),'linear');
  const setState=function(s,t){t=t===undefined?ctx.start:t;fan.setState(s,t);H.visible(heat,s==='running',t);if(s==='running')Loom.tween(heat.inner,{y:8,opacity:0.3},{y:-8,opacity:1,duration:ctx.style.dur('move')},t);};setState(opts.state||'idle',ctx.start);
  return {root:H.root,nodes:H.nodes,fan:fan,heat:heat,anchors:H.anchors,setState:setState,highlight:function(t,end){return H.highlight([1370,100,420,170],t,end);}};
};
Loom.lesson.flows = function(ctx,parent,opts) {
  opts=opts||{};const H=coolingPart(ctx,parent,opts,'flows'),W=H.W,flows=[];
  function route(kind,points,config){
    config=config||{};const tone=kind==='warmAir'||kind==='heatMarks'||kind==='waterReturn'?'accent2':'line';
    const id='flow'+flows.length;const marks=[];
    for(let i=1;i<points.length;i++)marks.push(...W.arrow(points[i-1][0],points[i-1][1],points[i][0],points[i][1],{weight:'thin'}));
    const path=H.draw(id,marks,tone);const warmMarks=[];for(let i=Math.max(1,Math.ceil(points.length/2));i<points.length;i++)warmMarks.push(...W.arrow(points[i-1][0],points[i-1][1],points[i][0],points[i][1],{weight:'thin'}));const cool=kind==='colourChange'?H.draw(id+'warm',warmMarks,'accent2'):null;if(cool)H.visible(cool,false);
    const lengths=[],total=points.slice(1).reduce((a,p,i)=>{const d=Math.hypot(p[0]-points[i][0],p[1]-points[i][1]);lengths.push(d);return a+d;},0);
    const tokens=[];for(let i=0;i<5;i++){const e=H.el(id+'mark'+i);H.D.draw(e,W.line(-8,0,8,0),{at:ctx.start,by:ctx.start+ctx.style.dur('enter'),parallel:true,pen:tone});tokens.push(e);}
    const events=[{t:ctx.start,on:config.running!==false}];const span=Math.max(1,ctx.end-ctx.start);let speed=config.speed||90;
    Loom.drive((p,raw)=>{const now=ctx.start+raw*span;let on=false,last=ctx.start;events.slice().sort((a,b)=>a.t-b.t).forEach(e=>{if(e.t<=now){on=e.on;last=e.t;}});const fade=on?1:Math.max(0,1-(now-last)/ctx.style.dur('exit'));
      path.inner.setAttribute('opacity',String(fade*0.5));tokens.forEach((e,i)=>{let d=((now-ctx.start)*speed+i*total/5)%Math.max(1,total),k=0;while(k<lengths.length-1&&d>lengths[k]){d-=lengths[k];k++;}const f=d/Math.max(1,lengths[k]),a=points[k],b=points[k+1];const angle=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;e.inner.setAttribute('transform','translate('+(a[0]+(b[0]-a[0])*f)+' '+(a[1]+(b[1]-a[1])*f)+') rotate('+angle+')');e.inner.setAttribute('opacity',String(fade));if(kind==='colourChange')e.inner.querySelectorAll('path').forEach(n=>n.setAttribute('stroke',ctx.c(k>=Math.floor(lengths.length/2)?'accent2':'line')));});},ctx.start,span,'linear');
    const h={path:path,tokens:tokens,start:function(t){events.push({t:t,on:true});},stop:function(t){events.push({t:t,on:false});},setWarm:function(t){if(cool)H.visible(cool,true,t);}};flows.push(h);return h;
  }
  function heatMarks(region,config){region=region||[650,370,400,80];const result=[];for(let i=0;i<4;i++){const x=region[0]+region[2]*(i+0.5)/4,y=region[1]+region[3];result.push(route('heatMarks',[[x,y],[x-8,y-20],[x+8,y-40],[x,y-65]],config));}return {marks:result,start:function(t){result.forEach(h=>h.start(t));},stop:function(t){result.forEach(h=>h.stop(t));},gather:function(t){result.forEach(h=>H.ctx.m.travel(h.path,t,{x:0,y:-70,dur:ctx.style.dur('move')}));}};}
  const h={root:H.root,nodes:H.nodes,anchors:H.anchors,items:flows,airArrow:function(p,c){return route('airArrow',p,c);},warmAir:function(p,c){return route('warmAir',p,c);},colourChange:function(p,c){return route('colourChange',p,c);},waterMarks:function(p,c){return route(c&&c.warm?'waterReturn':'waterSupply',p,c);},heatMarks:heatMarks,setState:function(s,t){flows.forEach(f=>s==='stopped'?f.stop(t):f.start(t));}};
  if(opts.demo!==false){if(opts.state==='warmAir')h.warmAir(H.anchors.ceilingReturn);else if(opts.state==='water')h.waterMarks(H.anchors.returnPipe,{warm:true});else if(opts.state==='airArrow')h.airArrow(H.anchors.floorPlenum);else heatMarks([620,380,460,100]);}return h;
};
Loom.lesson.heat_chain = function(ctx,parent,opts) {
  opts=opts||{};const H=coolingPart(ctx,parent,opts,'heat_chain'),W=H.W;
  const layouts={};
  [4,7].forEach(count=>{const group=H.el('chain'+count);const labels=count===4?['server','air','water','outdoors']:['server','air','air handler','water','pump','chiller','outdoors'];const cards=[];
    labels.forEach((text,i)=>{const width=count===4?390:228,x=120+i*(count===4?440:244);const e=ctx.el(group.outer.id+'_card'+i,{x:x,y:850,w:width,h:64,parent:group.inner,kind:'card',exit:'none'});H.D.draw(e,W.rect(0,0,width,64),{at:ctx.start,by:ctx.start+ctx.style.dur('draw'),parallel:true});const lab=ctx.el(group.outer.id+'_label'+i,{x:x+8,y:862,w:width-16,h:40,parent:group.inner,kind:'text',exit:'none'});H.D.letter(lab,text,{size:24,role:'label',quick:true,at:ctx.start,by:ctx.start+ctx.style.dur('enter'),parallel:true,align:'center',valign:'middle'});if(i<labels.length-1)H.D.draw(e,W.line(width,32,width+(count===4?50:16),32),{at:ctx.start,by:ctx.start+ctx.style.dur('draw'),parallel:true});if(opts.drafted!==false)e.inner.querySelectorAll('path').forEach(p=>Loom.tl.set(p,{strokeDasharray:'none',strokeDashoffset:0,opacity:1},ctx.start));cards.push({el:e,label:lab,box:[x,850,width,64],text:text});});layouts[count]={el:group,cards:cards};
  });
  H.visible(layouts[4].el,!opts.seven);H.visible(layouts[7].el,!!opts.seven);let count=opts.seven?7:4;
  return {root:H.root,nodes:H.nodes,layouts:layouts,setCount:function(n,t){count=n===7?7:4;H.visible(layouts[4].el,count===4,t);H.visible(layouts[7].el,count===7,t);},setState:function(s,t,index){t=t===undefined?ctx.start:t;const cards=layouts[count].cards;if(s==='active'){const c=typeof index==='string'?cards.find(c=>c.text===index):cards[index||0];if(c)H.highlight(c.box,t,t+ctx.style.dur('draw'));}else cards.forEach(c=>{Loom.tl.set(c.el.inner,{opacity:s==='outlined'?0.4:1},t);Loom.tl.set(c.label.inner,{opacity:s==='outlined'?0.55:1},t);});},highlight:function(index,t,end){return H.highlight(layouts[count].cards[index].box,t,end);}};
};
Loom.lesson.monitor_panel = function(ctx,parent,opts) {
  opts=opts||{};const H=coolingPart(ctx,parent,opts,'monitor_panel'),W=H.W,rows={};
  H.part('screen',{outline:W.rect(520,90,460,150),paper:false});
  ['crah 1','crah 2','crah 3','pump a','pump b'].forEach((s,i)=>{const y=98+i*28;H.label('row'+i,s,550,y,145,26);const ok=H.draw('status'+i,W.circle(535,y+13,4),'line');const alarm=H.draw('alarmMark'+i,W.path([[528,y+6],[542,y+20],[542,y+6],[528,y+20]]),'accent3');const words=H.label('alarmWords'+i,'alarm',745,y,145,27,'accent3');H.visible(alarm,false);H.visible(words,false);rows[s]={ok:ok,alarm:alarm,words:words,y:y+13};});
  function alarm(row,t,to){const r=rows[row];if(!r)return;H.visible(r.ok,false,t);H.visible(r.alarm,true,t);H.visible(r.words,true,t);if(to){const leader=H.draw('leader'+row,W.path([[520,r.y],[495,r.y],[495,to[1]],[to[0],to[1]]]),'accent3');H.visible(leader,false,ctx.start);H.visible(leader,true,t);return leader;}}
  return {root:H.root,nodes:H.nodes,rows:rows,alarm:alarm,setState:function(s,t,row){if(s==='alarm')alarm(row||'crah 1',t);else Object.keys(rows).forEach(k=>{H.visible(rows[k].ok,true,t);H.visible(rows[k].alarm,false,t);H.visible(rows[k].words,false,t);});},leader:function(row,to,t){return alarm(row,t,to);}};
};
Loom.lesson.temp_readout = function(ctx,parent,opts) {
  opts=opts||{};const H=coolingPart(ctx,parent,opts,'temp_readout'),W=H.W;
  H.part('gauge',{outline:[].concat(W.rect(1165,440,24,230),W.circle(1177,680,20)),detail:W.line(1155,615,1200,615),paper:false});
  H.draw('warning',W.line(1155,465,1205,465),'accent2');
  const column=H.draw('column',W.line(1177,655,1177,615,{weight:'outline'}),'accent2');
  let currentLevel=0;
  function level(value,t,dur){t=t===undefined?ctx.start:t;value=Math.max(0,Math.min(1,value));Loom.tween(column.inner,{scaleY:1+currentLevel*3.6,svgOrigin:'1177 655'},{scaleY:1+value*3.6,svgOrigin:'1177 655',duration:dur||ctx.style.dur('count')},t);currentLevel=value;}
  return {root:H.root,nodes:H.nodes,column:column,normal:[1177,615],warning:[1177,465],setLevel:level,setState:function(s,t){level(s==='high'||s==='rising'?1:0,t);}};
};
