Loom.lesson = Loom.lesson || {};
// Marker parts. Anatomy is expressed as engine marks, not software object art.
// Each draw method takes its cue from the caller. No autonomous entrances.
Loom._shareKit = {
  serial: 0,
  poly: function(W, points) {
    let marks=[];
    for(let i=1;i<points.length;i++)marks=marks.concat(W.line(points[i-1][0],points[i-1][1],points[i][0],points[i][1]));
    return marks;
  },
  setup: function (ctx, parent, opts, kind, w, h) {
    const o = opts || {};
    const name = o.name || (kind + "_kit_" + (++Loom._shareKit.serial));
    return {ctx:ctx, parent:parent, o:o, name:name, w:o.w || w, h:o.h || h,
      W:ctx.engine, B:ctx.engine.board(ctx, {marker:o.marker === true}), n:0};
  },
  element: function (a, suffix, x, y, w, h, parent) {
    return a.ctx.el(a.name + "_" + suffix + "_" + (++a.n),
      {x:x,y:y,w:w,h:h,kind:"mark",exit:"recede",parent:parent || a.parent});
  },
  timing: function (a, t, o, pen) {
    const p = {at:t,pen:pen || "ink"};
    if (o && o.by !== undefined) p.by = o.by;
    else if (o && o.dur !== undefined) p.dur = o.dur;
    else p.by = t;
    return p;
  }
};
Loom.lesson.budget_page = function (ctx, parent, opts) {
  // Folded page outline, marker title, three figure scribbles, independent edit stroke.
  const H = Loom._shareKit, a = H.setup(ctx,parent,opts,"budget_page",300,400);
  const w=Math.min(a.w,a.h*.75),h=Math.min(a.h,a.w/.75),W=a.W,B=a.B;
  const outline=H.element(a,"outline",0,0,w,h);
  const title=H.element(a,"title",w*.09,h*.12,w*.82,h*.15);
  const figures=H.element(a,"figures",0,0,w,h);
  const path = function (ps) { return W.path(ps.map(function(p){return [p[0]*w,p[1]*h];})); };
  const outlineMarks=H.poly(W,[[.035,.025],[.79,.025],[.965,.16],[.965,.97],[.035,.97],[.035,.025]].map(function(p){return [p[0]*w,p[1]*h];}))
    .concat(H.poly(W,[[.79*w,.025*h],[.79*w,.16*h],[.965*w,.16*h]]));
  let figureMarks=[];
  [.38,.55,.72].forEach(function(y,i){
    figureMarks=figureMarks.concat(path([[.13,y],[.21,y-.012],[.28,y+.006],[.36,y-.008],[.43,y+.003],[.51,y-.008]]));
    figureMarks=figureMarks.concat(path([[.66,y],[.70,y-.018],[.73,y+.009],[.77,y-.013],[.82,y+.003],[.86,y-.004]]));
  });
  let drawn=false,edit=null;
  const api={w:w,h:h,outline:outline,title:title,figures:figures,editMark:null,
    draw:function(t,o){
      if(drawn)return api;
      drawn=true;
      const end=o && o.by !== undefined ? o.by : t;
      B.draw(outline,outlineMarks,{at:t,by:t+(end-t)*.42,pen:"ink"});
      B.write(title,"Budget draft",{size:Math.min(34,w*.085),at:t+(end-t)*.42,by:t+(end-t)*.72,pen:"ink",maxLines:1});
      B.draw(figures,figureMarks,{at:t+(end-t)*.72,by:end,pen:"ink"});
      return api;
    },
    drawEdit:function(pen,t,o){
      const e=H.element(a,"edit",0,0,w,h,o && o.parent || a.o.editParent);
      B.draw(e,path([[.65,.555],[.76,.525],[.88,.54]]),H.timing(a,t,o,pen || "ink"));
      if(edit)Loom.tl.set(edit.life,{opacity:0},t);
      edit=e;api.editMark=e;return e;
    },
    setState:function(name,t,o){
      api.draw(t,o);
      if(name==="edited") api.drawEdit(o && o.pen || "ink",t,o);
      else if(edit)Loom.tl.set(edit.life,{opacity:0},t);
      return api;
    }
  };
  api.edit={draw:function(pen,t,o){return api.drawEdit(pen,t,o);},get element(){return edit;}};
  return api;
};
Loom.lesson.link_key = function (ctx, parent, opts) {
  // Round bow and hole, continuous shaft with two teeth, separate disabling slash.
  const H=Loom._shareKit,a=H.setup(ctx,parent,opts,"link_key",160,70);
  const w=Math.min(a.w,a.h*160/70),h=Math.min(a.h,a.w*70/160),W=a.W,B=a.B;
  const key=H.element(a,"key",0,0,w,h);
  const path=function(ps){return W.path(ps.map(function(p){return [p[0]*w,p[1]*h];}));};
  const marks=W.ellipse(w*.205,h*.46,w*.18,h*.40)
    .concat(W.ellipse(w*.205,h*.46,w*.073,h*.16))
    .concat(H.poly(W,[[.38,.40],[.95,.40],[.95,.79],[.85,.79],[.85,.58],[.73,.58],[.73,.79],[.63,.79],[.63,.56],[.38,.56]].map(function(p){return [p[0]*w,p[1]*h];})));
  let drawn=false,cross=null;
  const api={w:w,h:h,key:key,crossMark:null,
    draw:function(t,o){if(!drawn){drawn=true;B.draw(key,marks,H.timing(a,t,o,a.o.pen || "ink"));}return api;},
    drawCross:function(pen,t,o){const e=H.element(a,"cross",0,0,w,h,o && o.parent || a.o.crossParent);
      if(cross)Loom.tl.set(cross.life,{opacity:0},t);
      B.draw(e,path([[.28,.94],[.81,.05]]),H.timing(a,t,o,pen || "ink"));cross=e;api.crossMark=e;return e;},
    setState:function(name,t,o){api.draw(t,o);if(name==="crossed")api.drawCross(o && o.pen || "ink",t,o);else if(cross)Loom.tl.set(cross.life,{opacity:0},t);return api;}
  };
  api.cross={draw:function(pen,t,o){return api.drawCross(pen,t,o);},get element(){return cross;}};
  return api;
};
Loom.lesson.access_rings = function (ctx, parent, opts) {
  // Three independent concentric boundaries. Right edge door is a separate element.
  // The recall uses the same proportions with a ninety pixel outer radius.
  const o=opts || {}, H=Loom._shareKit;
  const r=o.radius || (o.w ? Math.min((o.w-20)/2,((o.h || o.w)-20)/2) : 380);
  const a=H.setup(ctx,parent,o,"access_rings",1280,780),W=a.W,B=a.B;
  const cx=o.cx !== undefined ? o.cx : r+10, cy=o.cy !== undefined ? o.cy : r+10;
  const scale=r/380, radii={anyone:r,company:r*250/380,named:r*130/380};
  const names=["anyone","company","named"],labels={anyone:"Anyone with the link",company:"People in the company",named:"Named people"};
  const ringEls={},labelEls={},shown={},hatches=[];
  names.forEach(function(n){ringEls[n]=H.element(a,n,0,0,a.w,a.h);});
  let doorEl=null,doorState="shut";
  const api={w:a.w,h:a.h,cx:cx,cy:cy,center:{x:cx,y:cy},radii:radii,rings:{},elements:ringEls,labels:labelEls,
    showRing:function(n,t,q){
      if(!radii[n])throw new Error("Unknown access ring: "+n);
      if(!shown[n]){shown[n]=true;B.draw(ringEls[n],W.circle(cx,cy,radii[n]),H.timing(a,t,q,q && q.pen || o.pen || "ink"));}
      return ringEls[n];
    },
    label:function(n,t,q){
      if(o.labels===false)return null;
      if(labelEls[n])return labelEls[n];
      const i=names.indexOf(n),x=cx+r+34,y=cy-r+30+i*105;
      const e=H.element(a,"label_"+n,x,y,430,58);
      const lead=H.element(a,"leader_"+n,0,0,a.w,a.h);
      const angle=-.90+i*.28,rad=radii[n];
      B.draw(lead,W.line(cx+Math.cos(angle)*rad+12,cy+Math.sin(angle)*rad,x-14,y+28),H.timing(a,t,q,o.pen || "ink"));
      B.write(e,labels[n],{role:"label",at:t,by:q && q.by !== undefined ? q.by : t+ctx.style.dur("draw"),pen:o.pen || "ink",maxLines:1});
      labelEls[n]=e;return e;
    },
    hatch:function(n,t,q){
      hatches.forEach(function(e){Loom.tl.set(e.life,{opacity:0},t);});
      const e=H.element(a,"hatch_"+n,0,0,a.w,a.h),rad=radii[n]-10,marks=[];
      // Sparse light diagonal hatch, clipped analytically to a circular boundary.
      for(let v=-rad+18;v<rad;v+=Math.max(18,28*scale)){
        const len=Math.sqrt(Math.max(0,rad*rad-v*v));
        const ux=Math.SQRT1_2,uy=-Math.SQRT1_2;
        marks.push.apply(marks,W.line(cx+v*uy-len*ux,cy-v*ux-len*uy,cx+v*uy+len*ux,cy-v*ux+len*uy));
      }
      B.draw(e,marks,H.timing(a,t,q,"muted"));
      e.inner.setAttribute("opacity","0.18");hatches.push(e);return e;
    },
    drawDoor:function(pen,t,q){
      q=q || {};const size=Math.max(20,74*scale),dh=size*1.28;
      const x=cx+radii.named-size*.5,y=cy-dh*.5;
      const e=H.element(a,"door_"+(q.state || doorState),x,y,size,dh,q.parent || o.doorParent);
      const state=q.state || doorState;
      let marks=H.poly(W,[[0,dh],[0,0],[size,0],[size,dh]]);
      if(state==="open")marks=marks.concat(H.poly(W,[[size*.06,dh*.04],[size*.62,dh*.20],[size*.62,dh*1.04],[size*.06,dh*.91],[size*.06,dh*.04]]));
      else marks=marks.concat(H.poly(W,[[size*.08,dh*.06],[size*.90,dh*.06],[size*.90,dh*.98],[size*.08,dh*.98],[size*.08,dh*.06]]));
      marks=marks.concat(W.line(size*(state==="open"?.48:.72),dh*.52,size*(state==="open"?.52:.79),dh*.52));
      if(doorEl)Loom.tl.set(doorEl.life,{opacity:0},t);
      B.draw(e,marks,H.timing(a,t,q,pen || "ink"));doorEl=e;doorState=state;return e;
    },
    setState:function(name,t,q){names.forEach(function(n){api.showRing(n,t,q);});doorState=name==="open"?"open":"shut";api.drawDoor(q && q.pen || o.doorPen || o.pen || "ink",t,Object.assign({},q || {},{state:doorState}));return api;}
  };
  names.forEach(function(n){api.rings[n]={cx:cx,cy:cy,r:radii[n],center:{x:cx,y:cy},element:ringEls[n]};});
  api.door={x:cx+radii.named,y:cy,
    draw:function(pen,t,q){return api.drawDoor(pen,t,q);},
    setState:function(state,t,q){doorState=state;return api.drawDoor(q && q.pen || o.doorPen || "ink",t,Object.assign({},q || {},{state:state}));},
    get element(){return doorEl;}};
  return api;
};
Loom.lesson.name_list = function (ctx, parent, opts) {
  // Rough short card. Each row is a Lucide user plus an unlettered scribble.
  const H=Loom._shareKit,a=H.setup(ctx,parent,opts,"name_list",220,220),W=a.W,B=a.B,w=Math.min(a.w,a.h),h=Math.min(a.w,a.h);
  const card=H.element(a,"card",0,0,w,h),rows=[],checks=[],strikes=[];
  const path=function(ps){return W.path(ps.map(function(p){return [p[0]*w,p[1]*h];}));};
  for(let i=0;i<3;i++){
    const y=h*(.23+i*.27),icon=H.element(a,"user_"+i,w*.11,y-h*.08,w*.18,h*.18);
    const size=Math.min(w*.18,h*.18);
    ctx.kit.icon(icon.inner,"user",{x:size/2,y:size/2,size:size,stroke:24*3.6/size,color:"ink"});
    const line=H.element(a,"row_"+i,0,0,w,h);rows.push({icon:icon,line:line,y:y});
  }
  let drawn=false;
  const api={w:w,h:h,card:card,rows:rows,checks:checks,strikes:strikes,
    draw:function(t,q){if(drawn)return api;drawn=true;
      B.draw(card,W.rect(w*.025,h*.025,w*.95,h*.95),H.timing(a,t,q,"ink"));
      rows.forEach(function(row,i){ctx.m.draw(row.icon,t,{dur:ctx.style.dur("draw")});const y=.23+i*.27;
        B.draw(row.line,path([[.37,y],[.44,y-.01],[.51,y+.008],[.58,y-.009],[.65,y+.004],[.72,y-.005]]),H.timing(a,t,q,"ink"));});return api;},
    check:function(i,t,q){const row=rows[i];if(!row)throw new Error("List row index must be zero, one or two");const e=H.element(a,"check_"+i,0,0,w,h);B.draw(e,W.tick(w*.84,row.y,w*.105),H.timing(a,t,q,q && q.pen || "ink"));checks[i]=e;return e;},
    strike:function(i,t,q){const row=rows[i];if(!row)throw new Error("List row index must be zero, one or two");const e=H.element(a,"strike_"+i,0,0,w,h);B.draw(e,W.line(w*.09,row.y,w*.93,row.y-h*.012),H.timing(a,t,q,q && q.pen || "ink"));strikes[i]=e;return e;},
    setState:function(name,t,q){api.draw(t,q);if(name==="checked")for(let i=0;i<3;i++)api.check(i,t,q);if(name==="struck")api.strike(1,t,q);return api;}
  };return api;
};
