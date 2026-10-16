Loom.lesson = Loom.lesson || {};
(function() {
const HoloKit = {};
function hg(p, tag, attrs) {
  const e = tag ? Loom.svg(tag, attrs || {}, p) : p;
  e.node = e;
  e.attr = function(a) { Object.keys(a).forEach(function(key) { e.setAttribute(key,a[key]); }); return e; };
  e.group = function() { return hg(e,'g',{}); };
  e.circle = function(d) { const c=hg(e,'circle',{r:d/2}); c.center=function(x,y){c.attr({cx:x,cy:y});return c;}; c.fill=function(color){c.attr({fill:color});return c;}; c.stroke=function(o){c.attr({stroke:o.color,'stroke-width':o.width});return c;}; return c; };
  return e;
}
function hk(ctx) {
  const k=Object.create(ctx.kit);
  const tokens=['field','field2','surface','surface2','ink','muted','line','accent','accent2','accent3','accent4','pos','neg','shadow','onAccent'];
  ['rect','line','path','text'].forEach(function(key){k[key]=function(){
    const args=Array.prototype.slice.call(arguments), n=args.length-1;
    if(args[n] && typeof args[n]==='object') {
      const o=Object.assign({},args[n]);
      if(key==='rect' && o.stroke===undefined)o.stroke='none';
      ['fill','stroke','color'].forEach(function(p){const token=tokens.find(function(t){return ctx.c(t)===o[p];});if(token)o[p]=token;});
      args[n]=o;
    }
    return hg(ctx.kit[key].apply(ctx.kit,args));
  };});
  return k;
}
// Shared anatomy: local SVG groups, quiet plates, cyan rim light, crisp words.
// The scene owns element life, camera, H.power and all cue times.
HoloKit.base = function(ctx, parent, opts, w, h) {
  opts = opts || {};
  const g = hg(parent,'g',{});
  const sx = (opts.w || w) / w, sy = (opts.h || h) / h;
  g.attr({transform: 'translate(' + (opts.x || 0) + ',' + (opts.y || 0) + ') scale(' + sx + ',' + sy + ')'});
  return {g:g, w:w, h:h, sx:sx, sy:sy};
};
HoloKit.vis = function(g, visible, t) {
  if (t === undefined) g.attr({opacity:visible ? 1 : 0});
  else Loom.tl.set(g.node, {attr:{opacity:visible ? 1 : 0}}, t);
};
HoloKit.frame = function(ctx, parent, w, h) {
  const k = hk(ctx), g = parent.group();
  k.rect(g, 1, 1, w-2, h-2, {fill:ctx.c('surface'), r:0});
  const rim = k.rect(g, 1, 1, w-2, h-2, {fill:'none', stroke:ctx.c('line'), r:0});
  rim.attr({'stroke-width':1, opacity:0.35});
  const a = Math.min(30, Math.max(14, h*0.12));
  const d = 'M1,'+(a+1)+' V1 H'+(a+1)+' M'+(w-a-1)+',1 H'+(w-1)+' V'+(a+1)+' M'+(w-1)+','+(h-a-1)+' V'+(h-1)+' H'+(w-a-1)+' M'+(a+1)+','+(h-1)+' H1 V'+(h-a-1);
  const halo = k.path(g,d,{fill:'none',stroke:ctx.c('accent')});
  halo.attr({'stroke-width':6,opacity:0.12});
  const brackets = k.path(g,d,{fill:'none',stroke:ctx.c('accent')});
  brackets.attr({'stroke-width':2,'stroke-linecap':'square'});
  return {g:g, rim:rim, brackets:brackets, halo:halo};
};
HoloKit.text = function(ctx, g, str, x,y,w,h,role,size,color) {
  return hg(ctx.kit.text(g,str,{x:x,y:y,w:w,h:h,role:role || 'body',size:size,color:color || 'ink',maxLines:1}));
};

// Chat anatomy: bracketed shell, header, Priya question, two exposed reply wells,
// input rail and attachment. Replies are separate parts, never duplicated here.
Loom.lesson.chat_panel = function(ctx, parent, opts) {
  opts = opts || {};
  const B = HoloKit.base(ctx,parent,opts,900,560), g=B.g, k=hk(ctx);
  const V=HoloKit.vis, T=HoloKit.text;
  const body=g.group(), frame=HoloKit.frame(ctx,body,900,560);
  const header=body.group();
  T(ctx,header,'Company assistant',32,22,760,48,'lead',36);
  k.line(header,32,88,868,88,{stroke:ctx.c('line'),sw:2});
  const questionGroup=body.group(), nameTag=questionGroup.group();
  k.rect(nameTag,32,106,108,48,{fill:ctx.c('surface2'),r:0});
  T(ctx,nameTag,'Priya',44,112,88,36,'caption',24,'muted');
  const question=opts.question || 'When are expense claims due?';
  const questionText=T(ctx,questionGroup,question,32,163,822,55,'body',34);
  const cursor=k.rect(questionGroup,840,178,14,32,{fill:ctx.c('accent'),r:0});
  const typingGroup=body.group();
  T(ctx,typingGroup,'Priya',44,112,88,36,'caption',24,'muted');
  const typed=T(ctx,typingGroup,question,32,163,822,55,'body',34);
  const typingCursor=k.rect(typingGroup,260,178,14,32,{fill:ctx.c('accent'),r:0});
  const wells=body.group();
  k.rect(wells,50,266,360,150,{fill:ctx.c('surface2'),r:0});
  k.rect(wells,490,266,360,150,{fill:ctx.c('surface2'),r:0});
  k.line(wells,50,430,410,430,{stroke:ctx.c('line'),sw:1});
  k.line(wells,490,430,850,430,{stroke:ctx.c('line'),sw:1});
  const input=body.group();
  k.rect(input,32,474,836,58,{fill:ctx.c('surface2'),r:0});
  k.line(input,32,532,868,532,{stroke:ctx.c('line'),sw:2});
  const attachment=body.group();
  k.rect(attachment,48,480,300,48,{fill:ctx.c('surface'),r:0});
  k.line(attachment,48,484,48,524,{stroke:ctx.c('accent'),sw:2});
  T(ctx,attachment,'Expense policy',64,486,268,36,'caption',24);
  const checked=body.group();
  k.rect(checked,772,486,74,36,{fill:ctx.c('surface'),stroke:ctx.c('pos'),r:0});
  T(ctx,checked,'OK',786,486,48,34,'caption',24,'pos');
  const boot=g.group();
  k.line(boot,32,280,868,280,{stroke:ctx.c('accent'),sw:2});
  function state(name,t) {
    V(body,name!=='empty',t); V(boot,name==='empty',t);
    V(questionGroup,name!=='empty' && name!=='typing',t);
    V(typingGroup,name==='typing',t); V(cursor,false,t);
    V(wells,name==='two_replies' || name==='checked',t);
    V(attachment,name==='policy_attached' || name==='checked',t);
    V(checked,name==='checked',t);
    if(name==='typing' && t!==undefined) {
      ctx.m.typewriter(typed,t,{dur:ctx.style.dur('move')});
      Loom.tween(typingCursor.node,{attr:{x:32}},{attr:{x:820}},t,{dur:ctx.style.dur('move'),ease:'linear'});
    }
  }
  state(opts.state || 'empty');
  return {g:g,root:g,frame:frame,body:body,header:header,nameTag:nameTag,question:questionText,questionGroup:questionGroup,typing:typingGroup,cursor:typingCursor,replySlots:[{x:50,y:266,w:360,h:150},{x:490,y:266,w:360,h:150}],inputStrip:{x:32,y:474,w:836,h:58},attachment:attachment,checked:checked,modelRect:{x:560,y:280,w:800,h:450},setState:state,naturalSize:[900,560]};
};

// Reply anatomy: steady cyan rim, plain value or abstract lines, left socket,
// independent linked segment, independent crack, worded success tag.
Loom.lesson.reply_card = function(ctx, parent, opts) {
  opts=opts || {};
  const B=HoloKit.base(ctx,parent,opts,360,150),g=B.g,k=hk(ctx);
  const V=HoloKit.vis,T=HoloKit.text;
  const frame=HoloKit.frame(ctx,g,360,150);
  const value=g.group();
  let text=null;
  if(opts.text) text=T(ctx,value,opts.text,42,40,278,70,'title',56);
  else {
    [220,174,196].forEach(function(w,i){k.line(value,48,54+i*22,48+w,54+i*22,{stroke:ctx.c('ink'),sw:3});});
  }
  const socket=g.circle(18).center(18,75).fill(ctx.c('surface')).stroke({color:ctx.c('accent'),width:2});
  const link=g.group();
  k.line(link,0,75,18,75,{stroke:ctx.c('accent'),sw:2});
  const core=link.circle(6).center(18,75).fill(ctx.c('accent'));
  const crack=g.group();
  const cp=k.path(crack,'M195,1 L180,27 L192,42 L170,69 L181,86 L160,110 L171,132 L161,149',{fill:'none',stroke:ctx.c('line')});
  cp.attr({'stroke-width':2,opacity:0.65});
  const match=g.group();
  k.rect(match,276,12,66,32,{fill:ctx.c('surface'),stroke:ctx.c('pos'),r:0});
  T(ctx,match,'OK',286,12,46,32,'caption',22,'pos');
  const unlinked=g.group();
  k.line(unlinked,0,75,5,75,{stroke:ctx.c('line'),sw:2});
  k.line(unlinked,0,92,7,85,{stroke:ctx.c('line'),sw:2});
  function state(name,t) {
    V(link,name==='linked' || name==='matched',t);
    V(crack,name==='cracked',t); V(match,name==='matched',t);
    V(unlinked,name==='unlinked',t);
  }
  state(opts.state || 'plain');
  return {g:g,root:g,frame:frame,value:value,text:text,socket:socket,socketPoint:{x:18,y:75},link:link,core:core,crack:crack,crackPath:cp,matched:match,setState:state,naturalSize:[360,150]};
};

// Policy anatomy: projected rectangular sheet, title on a clear plate,
// abstract rules with a single matching rule, far duplicate softened by light.
Loom.lesson.policy_doc = function(ctx, parent, opts) {
  opts=opts || {};
  const B=HoloKit.base(ctx,parent,opts,300,400),g=B.g,k=hk(ctx);
  const V=HoloKit.vis,T=HoloKit.text;
  const sheet=g.group();
  k.rect(sheet,1,1,298,398,{fill:ctx.c('surface2'),stroke:ctx.c('line'),r:0});
  const edge=k.line(sheet,1,1,1,399,{stroke:ctx.c('accent'),sw:2});
  const title=T(ctx,sheet,'Expense policy',22,28,258,52,'label',26);
  k.line(sheet,22,96,278,96,{stroke:ctx.c('line'),sw:1});
  const rules=sheet.group();
  const lengths=[242,210,230,184,242,212,228,166];
  const lines=[];
  lengths.forEach(function(w,i){const line=k.line(rules,22,132+i*30,22+w,132+i*30,{stroke:ctx.c('muted'),sw:3}); line.attr({opacity:0.48});lines.push(line);});
  const lit=sheet.group();
  k.rect(lit,14,210,270,24,{fill:ctx.c('surface'),r:0});
  k.line(lit,22,222,206,222,{stroke:ctx.c('accent'),sw:4});
  const pasting=g.group();
  k.line(pasting,1,20,1,380,{stroke:ctx.c('accent'),sw:3});
  k.line(pasting,12,20,12,380,{stroke:ctx.c('accent'),sw:1});
  function state(name,t) {
    V(lit,name==='line_lit',t); V(pasting,name==='pasting',t);
    const a=name==='outside_dim' ? 0.32 : (name==='pasting' ? 0.72 : 1);
    if(t===undefined) sheet.attr({opacity:a}); else Loom.tl.set(sheet.node,{attr:{opacity:a}},t);
    // Far focus affects only abstract marks, never the readable title.
    const blur=name==='outside_dim' ? 'blur(1.4px)' : 'none';
    if(t===undefined) rules.node.style.filter=blur;
    else Loom.tl.set(rules.node,{filter:blur},t);
  }
  state(opts.state || 'inside');
  return {g:g,root:g,sheet:sheet,title:title,rules:rules,lines:lines,edge:edge,matchingLine:lit,matchPoint:{x:206,y:222},setState:state,naturalSize:[300,400]};
};

// Window anatomy: one bracket frame, top label plate, three calm band labels.
// Content groups and rects are empty hosts for the scene's H.tokens and H.arcs.
Loom.lesson.context_window = function(ctx, parent, opts) {
  opts=opts || {};
  const B=HoloKit.base(ctx,parent,opts,1100,560),g=B.g,k=hk(ctx);
  const V=HoloKit.vis,T=HoloKit.text;
  const frame=HoloKit.frame(ctx,g,1100,560);
  const label=g.group();
  k.rect(label,28,0,284,56,{fill:ctx.c('surface'),r:0});
  T(ctx,label,'context window',44,8,252,40,'label',26);
  const bands=g.group();
  const labels={},hosts={},rects={};
  const names=['question','chat so far','reply','document'];
  const keys=['question','chat','reply','document'];
  const ys=[84,206,328,450];
  names.forEach(function(name,i){
    const row=bands.group(),key=keys[i];
    labels[key]=T(ctx,row,name,28,ys[i],200,38,'caption',24,'muted');
    k.line(row,252,ys[i]+47,1064,ys[i]+47,{stroke:ctx.c('line'),sw:1});
    hosts[key]=row.group();
    rects[key]={x:252,y:ys[i]-10,w:812,h:96};
    if(key==='document') {hosts.documentBand=row;}
  });
  const empty=g.group();
  k.line(empty,32,280,1068,280,{stroke:ctx.c('line'),sw:1});
  function state(name,t) {
    V(frame.g,name!=='empty',t); V(label,name!=='empty',t);
    V(bands,name!=='empty',t); V(empty,name==='empty',t);
    V(hosts.documentBand,name==='policy_inside',t);
    if(name!=='empty' && t!==undefined) ctx.m.draw(frame.brackets,t,{dur:ctx.style.dur('draw')});
  }
  state(opts.state || 'empty');
  return {g:g,root:g,frame:frame,label:label,bands:bands,labels:labels,hosts:hosts,rects:rects,questionRect:rects.question,chatRect:rects.chat,replyRect:rects.reply,documentRect:rects.document,setState:state,naturalSize:[1100,560]};
};
})();
