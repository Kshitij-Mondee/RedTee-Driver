Loom.lesson = Loom.lesson || {};
// Shared flat-card furniture. All state changes are discrete timeline sets.
Loom.lesson['_group'] = function(parent) { const g=Loom.svg('g',{},parent); g.group=function(){return Loom.lesson._group(g);}; g.opacity=function(v){g.setAttribute('opacity',v);}; g.scale=function(x,y){g.setAttribute('transform','scale('+x+' '+y+')');}; return g; };
Loom.lesson['_show'] = function(groups, name, t) { Object.keys(groups).forEach(function(k) { Loom.tl.set(groups[k], {opacity: k === name ? 1 : 0}, t); }); };
Loom.lesson['_text'] = function(ctx,g,s,x,y,w,h,role) { return ctx.kit.text(g,s,{x:x,y:y,w:w,h:h,role:role || 'label',color:'ink',maxLines:1}); };
Loom.lesson.world_board = function(ctx,parent,opts) {
  opts = opts || {}; const W=ctx.engine;
  if(opts.hold) { const held=W.board(ctx,{hold:'world'}); return held.lessonWorld; }
  // One retained board: road, halls with interior rooms, vehicles, street, overlay furniture.
  const B=W.board(ctx,{name:'world',parent:parent,size:[27,15],unit:38,centre:[864,430],headroom:3,enter:'none',lattice:'dots',strata:[{tok:'surface2',h:0.14},{tok:'soil',h:0.22},{tok:'steel',h:0.18}]});
  const items={};
  function put(id,kind,o) { o.name=id; o.enter='none'; items[id]=B.put(kind,o); return items[id]; }
  const office=put('office','building',{x:1,y:10,w:2.5,d:2,floors:2,fh:1.2,tok:'accent2',role:'offices'});
   const desk=put('desk','desk',{x:1,y:12.5,w:1.8,d:1,screen:'glass',tok:'wood'});
  const orderPlate=put('orderPlate','plate',{x:3.2,y:12,w:1.5,d:1.3,h:0.12,tok:'accent2',top:'surface',dashed:true});
  const warehouse=put('warehouse','building',{x:6,y:7,w:5,d:3.6,floors:1,fh:2.5,tok:'concrete',facade:'hall',doors:2,windows:false,rooms:function(f,add){add('shelf',{x:0.4,y:0.4,l:3.8,d:0.6,h:1.9,levels:3,goods:'accent4'});add('shelf',{x:0.4,y:2.4,l:2.5,d:0.6,h:1.9,levels:3,goods:'accent4'});add('desk',{x:3.5,y:2.1,w:1,d:1,screen:false,tok:'wood'});add('conveyor',{x:3.5,y:0.6,l:1.6,w:0.65,tok:'steel'});}});
  const hub=put('hub','building',{x:12.5,y:3.5,w:5,d:3.6,floors:1,fh:2.7,tok:'concrete',facade:'hall',doors:3,windows:false,rooms:function(f,add){add('conveyor',{x:0.4,y:1.3,l:2,w:0.6,tok:'steel'}); for(let i=0;i<3;i++)add('conveyor',{x:2.7,y:0.45+i*0.9,l:1.7,w:0.5,tok:'steel'});add('box',{x:1.1,y:1.08,z:0.15,w:0.16,d:0.13,h:1.45,tok:'steel'});add('box',{x:1.1,y:1.96,z:0.15,w:0.16,d:0.13,h:1.45,tok:'steel'});add('box',{x:1.1,y:1.08,z:1.6,w:0.16,d:1.01,h:0.16,tok:'steel'});}});
  const dock=put('dock','slab',{x:12.5,y:7.2,w:5,d:0.8,h:0.2,tok:'concrete'});
  const trucks=[]; for(let i=0;i<3;i++)trucks.push(put('truck'+i,'truck',{x:12.7+i*1.6,y:8.1,l:1.6,w:0.7,dir:'+y',tok:'accent3',role:'delivery vehicles'}));
  const departureScreen=put('departureScreen','screen',{x:17.8,y:6.7,w:1.5,h:1.4,d:0.2,tok:'steel',panels:[{show:'rows',values:[1,1,1],tok:'glass',hi:-1,hiTok:'pos'}]});
  const depot=put('depot','building',{x:19,y:1.7,w:2.6,d:2.2,floors:1,fh:1.8,tok:'concrete',facade:'hall',doors:2,windows:false});
  const vans=[put('van0','van',{x:19,y:4.4,l:1.5,w:0.65,tok:'accent3',role:'delivery vehicles'}),put('van1','van',{x:20.8,y:4.4,l:1.5,w:0.65,tok:'accent3',role:'delivery vehicles'})];
  const houses=[];for(let i=0;i<3;i++)houses.push(put('house'+i,'building',{x:23+i*1.1,y:0.5,w:0.9,d:1.4,floors:1,fh:1.3,tok:'surface',roof:'steel',windows:true}));
  for(let i=0;i<3;i++)put('tree'+i,'tree',{x:23+i*1.1,y:4.6,s:0.65,tok:'leaf'});
  const points={office:[4,13,0.15],warehouseDoor:[6.5,11.3,0.15],aisle:[8,8.8,0.3],shelf:[7,7.6,1.3],packing:[10.1,9.3,0.9],hubRoad:[12.7,10,0.15],sorter:[14,5.1,0.8],dock:[15.4,7.6,0.3],depot:[20,5.7,0.15],street:[24,3.3,0.15],doorstep:[24.5,2.2,0.12]};
  const roadPoints=[[4,13],[6.5,13],[6.5,11.3],[12,11.3],[12,10],[18.3,10],[18.3,5.7],[22.8,5.7],[22.8,3.3],[25.5,3.3]];
  const roads=[]; for(let i=1;i<roadPoints.length;i++){const a=roadPoints[i-1],b=roadPoints[i]; roads.push(B.put('road',{x:Math.min(a[0],b[0]),y:Math.min(a[1],b[1]),len:Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]),w:0.65,dir:a[0]===b[0]?'+y':'+x',tok:'road',marks:true}));} const road=B.route('main_road',roadPoints,{tok:'road',width:2});
  const dotted=B.route('scan_road',roadPoints.map(function(p){return [p[0],p[1],0.04];}),{tok:'line',width:4,dash:true,arrow:false});
  const routes={road:road,dotted:dotted,orderToWarehouse:B.route('order_to_pick',[[4,13],[6.5,13],[6.5,11.3]],{tok:'line',width:2,dash:true}),warehouseToHub:B.route('pack_to_hub',[[10.5,11.3],[12,11.3],[12,10],[14,10]],{tok:'line',width:2,dash:true}),hubToStreet:B.route('hub_to_street',[[15.4,10],[18.3,10],[18.3,5.7],[22.8,5.7],[22.8,3.3],[24,3.3]],{tok:'line',width:2,dash:true})};
  const framings={wide:'all',office:[office,desk,orderPlate],warehouseDoor:warehouse,warehouseAisle:B.worldRect([6,7,0,11,10.6,2.5]),packingBench:B.worldRect([9,8,0,11,10.6,2]),hubRoad:[hub,dock],sorter:hub,dock:[dock,trucks[1],departureScreen],depot:[depot,vans[0]],street:houses,herStreet:houses};
  // Dark ground wash, lit facade decals and switchable departure rows.
  const nightBack=Loom.svg('rect',{x:0,y:0,width:1920,height:1080,fill:ctx.c('line'),opacity:0},B.root); B.root.insertBefore(nightBack,B.root.firstChild);
  const nightGround=Loom.svg('polygon',{points:[[0,0],[27,0],[27,15],[0,15]].map(function(p){return B.P(p[0],p[1],0.03).join(',');}).join(' '),fill:ctx.c('road'),opacity:0},B.Ldecal);
  const lights=[];
  function windowDecal(it,x,y,z,w,h){const gp=Loom.lesson._group(it.a);ctx.kit.polygon(gp,[[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]].map(function(p){return B.P(p[0],p[1],p[2]);}),{fill:'surface'});gp.opacity(0);lights.push(gp);}
  for(let f=0;f<2;f++)for(let j=0;j<3;j++)windowDecal(office,-1.05+j*0.75,1.01,0.48+f*1.2,0.43,0.5);
  houses.forEach(function(it){windowDecal(it,-0.3,0.71,0.5,0.24,0.36);});
  const departureRows=[];
  for(let i=0;i<3;i++){const gp=Loom.lesson._group(departureScreen.a);ctx.kit.polygon(gp,[[-0.265,0.121,0.9933-i*0.2933],[0.5,0.121,0.9933-i*0.2933],[0.5,0.121,1.14-i*0.2933],[-0.265,0.121,1.14-i*0.2933]].map(function(p){return B.P(p[0],p[1],p[2]);}),{fill:'pos'});gp.opacity(0);departureRows.push(gp);}
  const stationPins=[],states=[];const renderWorld=B.render;B.render=function(t){renderWorld(t);stationPins.forEach(function(p){if(p.until!==undefined)p.el.outer.setAttribute('display',t>=p.until?'none':'inline');});};
  function isGrey(t){let n='day';states.forEach(function(e){if(e.t<=t)n=e.n;});return n==='grey';}
  function endPin(p,t){p.until=t;if(p.el){p.el.exitT=t;Loom.tl.set(p.el.inner,{opacity:0},t);}}
  function restore(it,t){const dur=ctx.style.dur('move');Loom.drive(function(e,p){Object.keys(it.variants).forEach(function(k){it.variants[k].groups.filter(function(gp){return gp.pr.skin;}).forEach(function(gp){const out=gp.pr.out||[0,0,1],q=B.P(out[0]*0.9*(1-e),out[1]*0.9*(1-e),out[2]*0.9*(1-e)),q0=B.P(0,0,0);gp.g.setAttribute('transform',p>=1?'':'translate('+(q[0]-q0[0])+' '+(q[1]-q0[1])+')');gp.g.setAttribute('display','inline');gp.g.setAttribute('opacity',e);});});(it.rims||[]).forEach(function(r){r.node.setAttribute('opacity',1-e);if(r.hatch)r.hatch.setAttribute('opacity',1-e);});},t,dur,'editorial',{kind:'move',name:it.id+'.restore',content:true});}
  
  const h={board:B,B:B,items:items,office:office,desk:desk,orderPlate:orderPlate,warehouse:warehouse,hub:hub,dock:dock,departureScreen:departureScreen,trucks:trucks,depot:depot,vans:vans,houses:houses,points:points,anchors:points,routes:routes,framings:framings,w:1728,h:846};
  h.frame=function(name,t,o){B.camera(t,framings[name]||'all',Object.assign({zoom:name==='wide'?1:1.8,dur:ctx.style.dur('move')},o||{}));};
  h.setState=function(name,t){
    if(name==='cutaway'){warehouse.cut(t);return;}if(name==='hubCutaway'){hub.cut(t);return;}if(name==='uncut'){restore(warehouse,t);restore(hub,t);return;}
    states.push({n:name,t:t});states.sort(function(a,b){return a.t-b.t;});
    roads.forEach(function(r){Loom.tl.set(r.g,{opacity:name==='grey'?0:1},t);});
    Loom.tl.set(road.g,{opacity:name==='grey'?0:1},t);
    if(name==='grey'){dotted.draw(t,t+ctx.style.dur('draw'));Loom.tl.set(dotted.g,{opacity:1},t);B.focus([],t);stationPins.forEach(function(p){Array.from(p.el.inner.querySelectorAll('rect')).forEach(function(r){if(Number(r.getAttribute('width'))===6)Loom.tl.set(r,{fill:ctx.c('line')},t);});});}
    else {B.unfocus(t);office.tint(t,name==='night'?'road':'accent2');[warehouse,hub,depot].forEach(function(it){it.tint(t,name==='night'?'road':'concrete');});}
    Loom.tl.set(nightBack,{opacity:name==='night'?0.96:0},t);Loom.tl.set(nightGround,{opacity:name==='night'?0.85:0},t);lights.forEach(function(gp){Loom.tl.set(gp,{opacity:name==='night'?1:0},t);});
  };
  h.setDepartureRows=function(litRows,t){const on=Array.isArray(litRows)?litRows:[0,1,2].slice(0,Math.max(0,Number(litRows)||0));departureRows.forEach(function(gp,i){Loom.tl.set(gp,{opacity:on.indexOf(i)>=0?1:0},t);});};
  h.pins=function(t,until,o){if(until&&typeof until==='object'){o=until;until=o.until;}o=o||{};const gap=o.stagger===true?ctx.style.dur('stagger'):(Number(o.stagger)||0);const made=[['Order',orderPlate,'accent2'],['Pick',points.shelf,'line'],['Pack',points.packing,'line'],['Hub',hub,'line'],['Delivery route',depot,'accent3']].map(function(a,i){const p=B.pin(a[1],a[0],{at:t+i*gap,until:until,tok:isGrey(t)?'line':a[2],side:'auto',follow:true});stationPins.push(p);return p;});made.end=function(at){made.forEach(function(p){endPin(p,at);});};return made;};
  h.clearPins=function(t){stationPins.forEach(function(p){endPin(p,t);});};
  h.doorstep=function(t,until){const r=B.route('empty_doorstep',[[24.1,2.1],[24.9,2.1],[24.9,2.7],[24.1,2.7],[24.1,2.1]],{tok:'line',width:2,dash:true,arrow:false,at:t});if(until!==undefined)Loom.tl.set(r.g,{opacity:0},until);return r;};
  h.legend=function(E,t){return B.legend(E,[['accent2','Offices / digital'],['accent3','Delivery vehicles'],['accent4','Parcels']],{at:t});};
  if(B.el&&B.el.outer) { const wrap=Loom.svg('g',{transform:'scale('+((opts.w||1728)/1728)+' '+((opts.h||846)/846)+')'},parent);wrap.appendChild(B.root); } B.lessonWorld=h;
  if(opts.state)h.setState(opts.state,ctx.start); if(opts.framing)h.frame(opts.framing,ctx.start,{dur:0}); return h;
};
Loom.lesson.lamp = function(ctx,parent,opts) {
  opts=opts||{}; // A lesson-specific lamp silhouette, flat card, and three-tone labelled parcel.
  const g=Loom.lesson._group(parent), k=ctx.kit, groups={card:g.group(),lamp:g.group(),box:g.group()};
  k.polygon(groups.card,[[45,130],[140,75],[210,115],[115,170]],{fill:'accent'});
  k.line(groups.card,89,126,151,91,{stroke:'surface',sw:5});k.line(groups.card,107,138,169,103,{stroke:'surface',sw:5});
  k.polygon(groups.box,[[60,100],[130,60],[205,103],[135,144]],{fill:'accent'});k.polygon(groups.box,[[60,100],[135,144],[135,223],[60,180]],{fill:'accent'});k.polygon(groups.box,[[135,144],[205,103],[205,182],[135,223]],{fill:'accent'});
  // The white label is a separate decal handle below, so it can be stamped or hidden.
  k.polygon(groups.lamp,[[75,197],[130,166],[176,193],[121,224]],{fill:'accent'});k.line(groups.lamp,125,194,125,105,{stroke:'accent',sw:13});k.polygon(groups.lamp,[[70,110],[91,56],[150,56],[178,110],[125,137]],{fill:'accent'});
  const ring=k.path(g,'M 38 194 A 100 45 0 1 0 230 194 A 100 45 0 1 0 38 194',{fill:'none',stroke:'accent',sw:3});
  const flatPin=g.group();k.line(flatPin,226,188,255,160,{stroke:'line',sw:2});k.rect(flatPin,225,108,115,60,{fill:'surface',stroke:'line',r:6});Loom.lesson._text(ctx,flatPin,'Lamp',239,116,88,44);
  Object.keys(groups).forEach(function(n){groups[n].opacity(n===(opts.state||'card')?1:0);});
  const handle={group:g,groups:groups,ring:ring,w:340,h:250,setState:function(n,t){Loom.lesson._show(groups,n,t);},travel:function(route,t,o){if(handle.item)handle.item.travel(route,t,o);else if(opts.board){const B=opts.board.board||opts.board;handle.item=B.put('crate',{route:route,tok:'accent',subject:true,s:0.65,at:t});B.track(handle.item,{at:t,label:'Lamp'});handle.item.travel(route,t,o||{});}}};
  const labelDecal=Loom.lesson._group(groups.box);k.polygon(labelDecal,[[145,154],[192,127],[192,159],[145,186]],{fill:'surface'});
  const barcode=labelDecal.group();for(let i=0;i<5;i++)k.line(barcode,151+i*7,157-i*4,151+i*7,174-i*4,{stroke:'line',sw:2});
  handle.label=labelDecal;handle.setLabel=function(text,t){Loom.tl.set(labelDecal,{opacity:text===false?0:1},t);if(typeof text==='string')Loom.drive(function(){labelDecal.setAttribute('aria-label',text);},t,ctx.style.dur('enter'),'linear',{kind:'reveal',name:'lamp.label',content:false});};
  handle.clearTracking=function(t){Loom.tl.set(ring,{opacity:0},t);Loom.tl.set(flatPin,{opacity:0},t);};
  if(opts.board){
    const B=opts.board.board||opts.board,p=opts.point||[4,13,0.2],at=opts.at===undefined?ctx.start:opts.at;
    const item=B.put('crate',{x:p[0],y:p[1],z:p[2]||0,tok:'accent',subject:true,s:0.65,h:0.65,at:at,cue:false,inside:opts.inside});handle.item=item;g.opacity(0);
    // Engine geometry is projected about B.P(0,0,0), not SVG (0,0). Keep artwork inside the entrance and movement carrier.
    const visual=Loom.lesson._group(item.a),q=B.P(0,0,0);groups.card.setAttribute('transform','translate(0 95)');visual.setAttribute('transform','translate('+q[0]+' '+q[1]+') scale(0.24) translate(-125 -224)');
    visual.appendChild(groups.card);visual.appendChild(groups.lamp);visual.appendChild(groups.box);
    function hideCarrier(){Object.keys(item.variants).forEach(function(k){item.variants[k].g.setAttribute('visibility','hidden');});}
    hideCarrier();let tracking=null,trackingUntil=opts.until===undefined?Infinity:opts.until;const render=B.render;B.render=function(t){render(t);hideCarrier();if(tracking){tracking.ring.setAttribute('display',t>=trackingUntil?'none':'inline');if(tracking.pin)tracking.pin.el.outer.setAttribute('display',t>=trackingUntil?'none':'inline');}};
    handle.visual=visual;
    tracking=B.track(item,{at:at,until:opts.until,label:'Lamp'});handle.tracking=tracking;
    handle.clearTracking=function(t){trackingUntil=Math.min(trackingUntil,t);B.rings.filter(function(r){return r.item===item;}).forEach(function(r){r.until=t;});Loom.tl.set(tracking.ring,{opacity:0},t);if(tracking.pin){tracking.pin.until=t;tracking.pin.el.exitT=t;Loom.tl.set(tracking.pin.el.inner,{opacity:0},t);}};
    const exit=item.exit;item.exit=function(t,o){handle.clearTracking(t);return exit.call(item,t,o);};
    handle.travel=function(r,t,o){item.travel(r,t,Object.assign({face:false},o||{}));};
  } else {if(opts.w||opts.h)g.scale((opts.w||340)/340,(opts.h||250)/250,0,0);}return handle;
};
Loom.lesson.phone_card = function(ctx,parent,opts) {
  opts=opts||{};const g=Loom.lesson._group(parent),k=ctx.kit;
  // Phone card anatomy: white frame, product page, scan rows, stopped trail, final reply.
  k.rect(g,0,0,430,560,{fill:'surface',stroke:'surface2',r:10}); const groups={page:g.group(),trail:g.group(),reply:g.group()};
  const thumbnail=groups.page.group();k.rect(thumbnail,38,30,354,175,{fill:'field',r:6});
  // Lucide uses centre coordinates for x/y in this kit. Centre the silhouette in its inset.
  k.icon(thumbnail,'lamp-desk',{x:215,y:118,size:105,color:'accent'});
  const button=k.rect(groups.page,38,245,354,62,{fill:'accent2',r:6});
  k.text(groups.page,'Order',{x:55,y:255,w:320,h:42,align:'center',role:'label',color:'onAccent'});
  const promise=groups.page.group();Loom.lesson._text(ctx,promise,'Arrives tomorrow',38,331,355,50);
  const labels=['Confirmed','Dispatched','At hub','Out for delivery','Delivered'],rows=[];
  labels.forEach(function(s,i){const r=groups.trail.group();k.disc(r,40,59+i*79,6,{fill:'accent2'});Loom.lesson._text(ctx,r,s,64,39+i*79,332,42);rows.push(r);});
  const gap=groups.trail.group();Loom.lesson._text(ctx,gap,'?',64,441,300,55,'lead');gap.opacity(0);
  Loom.lesson._text(ctx,groups.reply,'Where is my order?',28,35,374,75);
  k.rect(groups.reply,22,146,386,270,{fill:'field2',r:10});
  k.text(groups.reply,'Most likely at the hub, waiting for the next truck',{x:42,y:172,w:345,h:210,role:'label',color:'ink',maxLines:5});
  Object.keys(groups).forEach(function(n){groups[n].opacity(n===(opts.state||'page')?1:0);});
  const h={group:g,groups:groups,rows:rows,gap:gap,button:button,promise:promise,w:430,h:560,setState:function(n,t){Loom.lesson._show(groups,n,t);},setTrail:function(n,t,question){rows.forEach(function(r,i){Loom.tl.set(r,{opacity:i<n?1:0},t);});Loom.tl.set(gap,{opacity:question?1:0},t);},addStatus:function(n,t){Loom.tl.set(rows[n-1],{opacity:1},t);}};
  if(opts.w||opts.h)g.scale((opts.w||430)/430,(opts.h||560)/560,0,0);return h;
};
Loom.lesson.chat_card = function(ctx,parent,opts) {
  opts=opts||{};const g=Loom.lesson._group(parent),k=ctx.kit,rows=[];
  // Incoming question and a four-step reply. Numbered chips are instructional order, not data.
  k.rect(g,0,0,510,500,{fill:'surface',stroke:'surface2',r:10});
  k.rect(g,22,24,466,90,{fill:'field2',r:10});Loom.lesson._text(ctx,g,'Where is my order?',42,45,426,49);
  ['Last status','Station','Usual hold-up','Expectation'].forEach(function(s,i){const r=g.group();k.rect(r,32,149+i*77,42,42,{fill:'accent2',r:5});k.text(r,String(i+1),{x:32,y:151+i*77,w:42,h:38,role:'label',align:'center',color:'onAccent'});Loom.lesson._text(ctx,r,s,92,148+i*77,380,46);rows.push(r);r.opacity(opts.state==='question'?0:1);});
  return {group:g,rows:rows,w:510,h:500,setState:function(n,t){const count=n==='question'?0:n==='reply'?4:Number(n.replace('step',''));rows.forEach(function(r,i){Loom.tl.set(r,{opacity:i<count?1:0},t);});},setLines:function(n,t){rows.forEach(function(r,i){Loom.tl.set(r,{opacity:i<n?1:0},t);});}};
};
Loom.lesson.held_mark = function(ctx,parent,opts) {
  opts=opts||{};const g=Loom.lesson._group(parent),k=ctx.kit;
  // Ground ring, pause glyph, optional short pin. Each instance owns its own groups and timeline.
  const ring=k.path(g,'M 20 140 A 100 42 0 1 0 220 140 A 100 42 0 1 0 20 140',{fill:'none',stroke:'neg',sw:4});
  k.rect(g,99,103,9,30,{fill:'neg',r:1});k.rect(g,120,103,9,30,{fill:'neg',r:1});
  const label=opts.label||'Held',labelW=Math.max(192,String(label).length*18+12),pinW=labelW+28;
  const pin=g.group();k.line(pin,212,120,241,71,{stroke:'line',sw:2});k.rect(pin,161,24,pinW,48,{fill:'surface',stroke:'line',r:6});Loom.lesson._text(ctx,pin,label,175,28,labelW,40);
  if(opts.label===false||opts.state==='ring')pin.opacity(0);
  return {group:g,ring:ring,pin:pin,w:Math.max(390,161+pinW+9),h:200,setState:function(n,t){Loom.tl.set(pin,{opacity:n==='ring'?0:1},t);}};
};
