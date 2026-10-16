Loom.lesson = Loom.lesson || {};

// Shared geometry helpers. Each part is local to its parent and never enters itself.
const stScKitNode = function (tag, attrs, parent) { return Loom.svg(tag, attrs, parent); };
const stScKitBox = function (ctx, p, x, y, w, h, r, fill, stroke, extra) {
  return Loom.svg('rect', Object.assign({x:x,y:y,width:w,height:h,rx:r,fill:ctx.c(fill),stroke:stroke ? ctx.c(stroke) : 'none','stroke-width':1.5},extra || {}),p);
};
const stScKitLabel = function (ctx,p,text,x,y,size,color,mono) {
  const n = Loom.svg('text',{x:x,y:y,fill:ctx.c(color || 'ink'),'font-family':mono ? 'JetBrains Mono' : 'Inter','font-size':size,'font-weight':mono ? 600 : 600},p);
  n.textContent=text; return n;
};
const stScKitSwap = function (groups, name, t) {
  Object.keys(groups).forEach(function(k){Loom.tl.set(groups[k],{attr:{opacity:k === name ? 1 : 0}},t);});
};

// QR anatomy: quiet border, three finders, seeded modules. Broken timing structure is intentionally not a payload.
Loom.lesson.qr_code = function (ctx, parent, opts) {
  opts=opts || {}; const s=stScKitNode, b=stScKitBox;
  const side=opts.w || opts.h || 240;
  const root=s('g',{transform:'translate('+(opts.x || 0)+' '+(opts.y || 0)+') scale('+(side/240)+')'},parent);
  b(ctx,root,0,0,240,240,12,'surface','field2');
  const modules=s('g',{},root), random=Loom.rng('st-sc-2fa-illustrative-qr');
  const cell=8, pad=20, n=25;
  function finder(x,y) {
    b(ctx,modules,pad+x*cell,pad+y*cell,56,56,0,'ink');
    b(ctx,modules,pad+(x+1)*cell,pad+(y+1)*cell,40,40,0,'surface');
    b(ctx,modules,pad+(x+2)*cell,pad+(y+2)*cell,24,24,0,'ink');
  }
  for(let y=0;y<n;y++){for(let x=0;x<n;x++){
    const reserved=(x<8&&y<8)||(x>16&&y<8)||(x<8&&y>16);
    const bit=random();
    if(!reserved && x!==8 && y!==8 && bit>0.52){b(ctx,modules,pad+x*cell,pad+y*cell,cell,cell,0,'ink');}
  }}
  finder(0,0); finder(18,0); finder(0,18);
  const states={visible:root};
  function setState(name,t){Loom.tl.set(root,{attr:{opacity:name==='hidden'?0:1}},t);}
  return {root:root,modules:modules,w:side,h:side,states:['visible','hidden'],setState:setState,state:setState,fadeIn:function(t){Loom.tween(root,{attr:{opacity:0}},{attr:{opacity:1},duration:ctx.style.dur('enter')},t);}};
};

// Phone anatomy: fixed slab, inset screen, independent views, teaching tap layer, absence and cross overlays.
Loom.lesson.phone = function (ctx, parent, opts) {
  opts=opts || {}; const s=stScKitNode,b=stScKitBox,l=stScKitLabel;
  const scale=opts.scale || (opts.w ? opts.w/340 : (opts.h ? opts.h/680 : 1));
  const root=s('g',{transform:'translate('+(opts.x || 0)+' '+(opts.y || 0)+') scale('+scale+')'},parent);
  const slide=s('g',{},root), views={}, content=s('g',{},slide);
  const shadow=b(ctx,content,0,12,340,680,28,'shadow',null,{opacity:0.1});
  const body=b(ctx,content,0,0,340,680,28,'surface','line');
  const screen=b(ctx,content,12,44,316,604,18,'surface2','field2');
  b(ctx,content,130,18,80,6,3,'field2'); b(ctx,content,125,662,90,5,3,'line');
  function view(name){return views[name]=s('g',{opacity:0},content);}
  const off=view('off'); b(ctx,off,12,44,316,604,18,'ink');
  const home=view('home'); l(ctx,home,'Authenticator',30,101,30);
  b(ctx,home,30,126,280,1,0,'field2');
  const add=s('g',{},home); b(ctx,add,30,526,280,64,12,'accent');
  const addLabel=l(ctx,add,'Add account',170,567,28,'onAccent'); addLabel.setAttribute('text-anchor','middle');
  const camera=view('camera'); l(ctx,camera,'Authenticator',30,101,30);
  b(ctx,camera,30,154,280,360,12,'surface','field2');
  const qr=Loom.lesson.qr_code(ctx,camera,{x:58,y:214,w:224});
  const brackets=s('path',{d:'M48 244 V204 H88 M252 204 H292 V244 M292 408 V448 H252 M88 448 H48 V408',fill:'none',stroke:ctx.c('accent'),'stroke-width':4,'stroke-linecap':'round'},camera);
  const code=view('code'); l(ctx,code,'Authenticator',30,101,30);
  const row=b(ctx,code,26,154,288,192,16,'surface','field2');
  l(ctx,code,'Company account',44,194,26);
  const digits=l(ctx,code,opts.code || '000000',44,269,48,'accent',true);
  const ringTrack=s('circle',{cx:284,cy:313,r:15,fill:'none',stroke:ctx.c('field2'),'stroke-width':5},code);
  const length=2*Math.PI*15;
  const ring=s('circle',{cx:284,cy:313,r:15,fill:'none',stroke:ctx.c('accent'),'stroke-width':5,'stroke-dasharray':length,'stroke-dashoffset':0,transform:'rotate(-90 284 313)'},code);
  const absence=s('g',{opacity:0},slide);
  b(ctx,absence,0,0,340,680,28,'field2','line',{'fill-opacity':0,'stroke-dasharray':'12 10','stroke-width':2});
  const cross=s('g',{opacity:0},slide);
  s('path',{d:'M48 150 L292 530 M292 150 L48 530',fill:'none',stroke:ctx.c('neg'),'stroke-width':10,'stroke-linecap':'round'},cross);
  const tapLayer=s('g',{},slide);
  function setState(name,t){
    const base=(name==='crossed'||name==='new')?'code':name;
    stScKitSwap(views,base,t);
    Loom.tl.set(content,{attr:{opacity:name==='missing'?0:1}},t);
    Loom.tl.set(absence,{attr:{opacity:name==='missing'?1:0}},t);
    Loom.tl.set(cross,{attr:{opacity:name==='crossed'?1:0}},t);
  }
  const initial=opts.state || 'home';
  Object.keys(views).forEach(function(k){views[k].setAttribute('opacity',k===((initial==='new'||initial==='crossed')?'code':initial)?1:0);});
  content.setAttribute('opacity',initial==='missing'?0:1);absence.setAttribute('opacity',initial==='missing'?1:0);cross.setAttribute('opacity',initial==='crossed'?1:0);
  function setCode(value,t){Loom.tl.set(digits,{textContent:String(value)},t);}
  function countdown(t,phase,nextCode){
    const p=Math.max(0,Math.min(0.999,phase || 0));
    const remaining=30*(1-p);
    Loom.drive(function(e){ring.setAttribute('stroke-dashoffset',length*(p+(1-p)*e));},t,remaining,'linear');
    if(nextCode!==undefined){setCode(nextCode,t+remaining);Loom.tl.set(ring,{attr:{'stroke-dashoffset':0}},t+remaining);Loom.drive(function(e){ring.setAttribute('stroke-dashoffset',length*e);},t+remaining,30,'linear');}
    return t+remaining;
  }
  function tap(name,t){
    if(typeof name==='number'){t=name;name='addAccount';}
    const pulse=s('circle',{cx:170,cy:558,r:16,fill:ctx.c('accent2'),opacity:0},tapLayer);
    const halo=s('circle',{cx:170,cy:558,r:24,fill:'none',stroke:ctx.c('accent2'),'stroke-width':3,opacity:0},tapLayer);
    const d=ctx.style.dur('enter');
    Loom.tween(pulse,{attr:{r:12,opacity:0.22}},{attr:{r:32,opacity:0},duration:d},t);
    Loom.tween(halo,{attr:{r:22,opacity:1}},{attr:{r:52,opacity:0},duration:d},t);
  }
  function slideIn(t,dx){Loom.tween(slide,{attr:{transform:'translate('+(dx===undefined?100:dx)+' 0)',opacity:0}},{attr:{transform:'translate(0 0)',opacity:1},duration:ctx.style.dur('enter')},t);}
  function slideOut(t,dx){Loom.tween(slide,{attr:{transform:'translate(0 0)',opacity:1}},{attr:{transform:'translate('+(dx===undefined?100:dx)+' 0)',opacity:0},duration:ctx.style.dur('exit')},t);}
  return {root:root,slide:slide,body:body,screen:screen,views:views,addAccount:add,buttons:{addAccount:add},code:digits,digits:digits,row:row,ring:ring,ringTrack:ringTrack,viewfinder:brackets,qr:qr,absence:absence,cross:cross,tapLayer:tapLayer,w:340*scale,h:680*scale,states:['off','home','camera','code','missing','crossed','new'],setState:setState,state:setState,tap:tap,setCode:setCode,countdown:countdown,setRingPhase:countdown,slideIn:slideIn,slideOut:slideOut};
};

// Chip anatomy: pill, key and eight separate dots, fracture and stopped outline. Travel belongs to the owning element.
Loom.lesson.password_chip = function (ctx,parent,opts) {
  opts=opts || {}; const s=stScKitNode,b=stScKitBox;
  const scale=opts.scale || (opts.w ? opts.w/260 : (opts.h ? opts.h/56 : 1));
  const root=s('g',{transform:'translate('+(opts.x || 0)+' '+(opts.y || 0)+') scale('+scale+')'},parent);
  const shake=s('g',{},root);
  const pill=b(ctx,shake,0,0,260,56,28,'surface','line');
  const key=s('g',{},shake);
  s('circle',{cx:28,cy:26,r:8,fill:'none',stroke:ctx.c('ink'),'stroke-width':2.5},key);
  s('path',{d:'M35 31 L47 43 M41 37 L46 32 M45 41 L50 36',fill:'none',stroke:ctx.c('ink'),'stroke-width':2.5,'stroke-linecap':'round'},key);
  const dots=[];
  for(let i=0;i<8;i++){dots.push(s('circle',{cx:76+i*22,cy:28,r:5,fill:ctx.c('ink')},shake));}
  const crack=s('path',{d:'M138 2 L127 16 L139 28 L127 41 L137 54',fill:'none',stroke:ctx.c('neg'),'stroke-width':3,opacity:0},shake);
  const stopped=b(ctx,shake,1,1,258,54,27,'surface','neg',{'fill-opacity':0,'stroke-width':3,opacity:0});
  function setState(name,t){
    Loom.tl.set(crack,{attr:{opacity:name==='cracked'||name==='crack'?1:0}},t);
    Loom.tl.set(stopped,{attr:{opacity:name==='stopped'?1:0}},t);
    dots.forEach(function(d){Loom.tl.set(d,{attr:{opacity:name==='empty'?0:1}},t);});
    if(name==='typed'){type(t);}
    if(name==='stopped'){
      Loom.drive(function(e){const dx=Math.sin(e*Math.PI*6)*6*(1-e);shake.setAttribute('transform','translate('+dx+' 0)');},t,ctx.style.dur('move'),'linear');
    }
  }
  function type(t){dots.forEach(function(d,i){Loom.tl.set(d,{attr:{opacity:0}},t);Loom.tl.set(d,{attr:{opacity:1}},t+ctx.style.dur('enter')*(i+1)/8);});}
  function drop(t,dy){Loom.tween(root,{attr:{transform:'translate('+(opts.x||0)+' '+(opts.y||0)+') scale('+scale+')'}},{attr:{transform:'translate('+(opts.x||0)+' '+((opts.y||0)+(dy||100))+') scale('+scale+')'},duration:ctx.style.dur('move')},t);}
  if(opts.state==='empty'){dots.forEach(function(d){d.setAttribute('opacity',0);});}
  if(opts.state==='cracked'){crack.setAttribute('opacity',1);} if(opts.state==='stopped'){stopped.setAttribute('opacity',1);}
  return {root:root,shake:shake,pill:pill,key:key,dots:dots,crack:crack,stopped:stopped,w:260*scale,h:56*scale,states:['masked','empty','typed','cracked','stopped'],setState:setState,state:setState,type:type,drop:drop,along:function(E,path,t,o){ctx.m.along(E,path,t,o);}};
};
