// Builds maya/*.svg, props/*.svg, manifest.json, index.html and review/maya_joint_overlay.svg. Usage: MayaParts.run(MayaStory, DOMParser, MayaViews)
(function(){
const mul=(A,B)=>[A[0]*B[0]+A[2]*B[1],A[1]*B[0]+A[3]*B[1],A[0]*B[2]+A[2]*B[3],A[1]*B[2]+A[3]*B[3],A[0]*B[4]+A[2]*B[5]+A[4],A[1]*B[4]+A[3]*B[5]+A[5]];
const parseT=t=>{let M=[1,0,0,1,0,0];if(!t)return M;for(const m of t.matchAll(/(\w+)\(([^)]*)\)/g)){const v=m[2].trim().split(/[\s,]+/).map(Number);let T;
 if(m[1]==='translate')T=[1,0,0,1,v[0],v[1]||0];else if(m[1]==='scale')T=[v[0],0,0,v[1]??v[0],0,0];else if(m[1]==='matrix')T=v;
 else if(m[1]==='rotate'){const a=v[0]*Math.PI/180,c=Math.cos(a),s=Math.sin(a),cx=v[1]||0,cy=v[2]||0;T=mul(mul([1,0,0,1,cx,cy],[c,s,-s,c,0,0]),[1,0,0,1,-cx,-cy]);}
 M=mul(M,T);}return M;};
function measurer(DP){return inner=>{const doc=new DP().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+inner+'</svg>','image/svg+xml');
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const add=(M,x,y)=>{const X=M[0]*x+M[2]*y+M[4],Y=M[1]*x+M[3]*y+M[5];x0=Math.min(x0,X);y0=Math.min(y0,Y);x1=Math.max(x1,X);y1=Math.max(y1,Y);};
 const ell=(M,cx,cy,rx,ry)=>{for(let i=0;i<24;i++){const a=i/24*2*Math.PI;add(M,cx+Math.cos(a)*rx,cy+Math.sin(a)*ry);}};
 const walk=(el,M)=>{for(const c of el.children){const N=mul(M,parseT(c.getAttribute('transform'))),tag=c.localName;
  if(tag!=='g'&&c.getAttribute('fill')==='none'&&(!c.getAttribute('stroke')||c.getAttribute('stroke')==='none'))continue;
  if(tag==='g')walk(c,N);
  else if(tag==='path'){const tok=c.getAttribute('d').match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g)||[];let cmd='',buf=[],cx=0,cy=0;
   for(const t of tok){if(/[A-Za-z]/.test(t)){cmd=t;buf=[];continue;}buf.push(+t);
    if(cmd==='A'&&buf.length===7){const [rx,ry,,,,x,y]=buf;if(Math.abs(Math.hypot(x-cx,y-cy)-2*rx)<Math.max(1.5,rx*0.08))ell(N,(x+cx)/2,(y+cy)/2,rx,ry);else{ell(N,cx,cy,rx,ry);ell(N,x,y,rx,ry);}cx=x;cy=y;buf=[];}
    else if(cmd!=='A'&&buf.length===2){add(N,buf[0],buf[1]);cx=buf[0];cy=buf[1];buf=[];}}}
  else if(tag==='circle'||tag==='ellipse'){const r=c.getAttribute('r');ell(N,+c.getAttribute('cx'),+c.getAttribute('cy'),+(r||c.getAttribute('rx')),+(r||c.getAttribute('ry')));}
  else if(tag==='rect'){const x=+c.getAttribute('x'),y=+c.getAttribute('y'),w=+c.getAttribute('width'),h=+c.getAttribute('height');add(N,x,y);add(N,x+w,y+h);add(N,x,y+h);add(N,x+w,y);}}};
 walk(doc.documentElement,[1,0,0,1,0,0]);return {x:x0,y:y0,width:x1-x0,height:y1-y0};};}
const GRID=[[128,'head top'],[463,'eye line'],[587,'chin'],[684,'shoulder'],[1000,'waist'],[1134,'crotch'],[1500,'knee'],[1900,'floor']];
function run(MS,DP,MV){const built=MS.buildParts(measurer(DP)),files=Object.assign({},built.files),by={};built.defs.forEach(d=>by[d.id]=d);
 const B={};let bn=0;const reg=list=>{const k='b'+(bn++);B[k]=list;return k;};
 const RN={rig_neutral:{rot:{},arm:{r:{rot:[4,-10,-8]},l:{rot:[-4,10,8]}},expr:'attentive'}};
 const single=id=>{const d=by[id];return [[d.path,'translate('+d.vb[0]+' '+d.vb[1]+')']];};
 const lines=vb=>GRID.map(([y])=>'<line x1="'+vb[0]+'" x2="'+(vb[0]+vb[2])+'" y1="'+y+'" y2="'+y+'" stroke="#D3CEC4" stroke-width="3"/>').join('');
 const live=(list,vb,cap,extra)=>'<figure class="cell"><svg xmlns="http://www.w3.org/2000/svg" viewBox="'+vb.join(' ')+'" data-build="'+reg(list)+'">'+(extra||'')+'</svg>'+(cap?'<figcaption>'+cap+'</figcaption>':'')+'</figure>';
 const TV=[0,80,1000,1860];
 const turn=[live(MS.placeList('rig_neutral',built,RN),TV,'front · rig neutral',lines(TV)),live(MS.placeList('turn_34front',built,MV.POSES34),TV,'3/4 front · assembled from its rig parts',lines(TV)),
  ...['side','34back','back'].map(v=>live(single('turn_'+v),TV,v.replace('34','3/4 '),lines(TV)))].join('\n');
 const PV=[-250,60,1500,1880],floor='<line x1="-300" y1="1900" x2="1300" y2="1900" stroke="#C9C5BC" stroke-width="3"/>';
 const statics=['stand','point','sit'].map(n=>'<figure class="cell"><svg xmlns="http://www.w3.org/2000/svg" viewBox="'+PV.join(' ')+'" data-pose="'+n+'">'+floor+MS.assemble(n,built)+'</svg><figcaption>'+MS.POSE3[n].label+'</figcaption></figure>').join('\n');
 const others=Object.keys(MS.POSE3).filter(n=>!['stand','point','sit'].includes(n)).map(n=>live(MS.placeList(n,built),PV,MS.POSE3[n].label,floor)).join('\n')+'\n'+Object.keys(MV.POSES34).filter(k=>k.startsWith('walk')).map(k=>live(MS.placeList(k,built,MV.POSES34),PV,MV.POSES34[k].label,floor)).join('\n');
 const headList=k=>['neck','hair_back','head','face_'+k,'earring_l','earring_r'].map(i=>by[i]).sort((a,b)=>a.z-b.z).map(d=>[d.path,'translate('+d.vb[0]+' '+d.vb[1]+')']);
 const exprBig=MS.BIBLE.map((k,i)=>live(headList(k),[360,100,280,520],(i+1)+' · '+k)).join('\n');
 const exprSmall=MS.BIBLE.map((k,i)=>'<figure class="tiny">'+live(headList(k),[380,300,240,320]).replace('<figure class="cell">','').replace('</figure>','')+'<figcaption>'+(i+1)+' '+k+'</figcaption></figure>').join('\n');
 const JV=[160,500,560,760];
 const jointsUp=[0,45,90,135,170].map(a=>live(MS.jointList(a,0,built),JV,'upper_arm_r '+a+'° · forearm 0°')).join('\n');
 const JF=[-120,300,700,700];const jointsFore=[0,60,120,150].map(a=>live(MS.jointList(90,a,built),JF,'upper_arm_r 90° · forearm '+a+'°')).join('\n');
 const onion=(lists,cap,vb)=>{const k=reg(lists.flat().map(x=>x));return '<figure class="cell"><svg xmlns="http://www.w3.org/2000/svg" viewBox="'+(vb||JV).join(' ')+'" data-build="'+k+'" data-onion="1"></svg><figcaption>'+cap+'</figcaption></figure>';};
 const onionUp=onion([0,45,90,135,170].map(a=>MS.jointList(a,0,built)),'overlay · all five shoulder angles');
 const onionFore=onion([0,60,120,150].map(a=>MS.jointList(90,a,built)),'overlay · all four elbow angles',JF);
 const jsv=(list,x,y,cap,vb)=>'<g transform="translate('+x+' '+y+')"><svg viewBox="'+(vb||JV).join(' ')+'" width="560" height="760">'+list.map(([p,tf])=>'<g transform="'+tf+'">'+files[p+'.svg']+'</g>').join('')+'</svg></g>';
 const sheet=[...[0,45,90,135,170].map((a,i)=>jsv(MS.jointList(a,0,built),i*580,0)),...[0,60,120,150].map((a,i)=>jsv(MS.jointList(90,a,built),i*580,800,null,JF))].join('');
 files['review/maya_joint_overlay.svg']='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2900 1560" width="2900" height="1560"><rect width="2900" height="1560" fill="#E1DED7"/>'+sheet+'</svg>';
 const groups=[['Front rig parts',d=>d.view==='front'&&!d.variant&&d.kind!=='prop'&&!['face','mouth'].includes(d.part)||d.id==='mouth'],['Eyes and brows · 5 states each',d=>/^(eye|brow)_/.test(d.part||'')&&d.variant],['Mouths · 9 visemes + 12 expression mouths',d=>d.part==='mouth'&&d.variant],['Expressions as one swap',d=>d.part==='face'&&d.view==='front'],['Hands · 20 per side',d=>/^hand_/.test(d.part||'')&&d.view==='front'],['Shoulder and elbow variants',d=>/^(deltoid|upper_arm|elbow_fold)_/.test(d.part||'')&&d.view==='front'],['Seated variants',d=>d.variant==='seated'],['3/4 front rig parts',d=>d.view==='34front'],['Turnaround views',d=>d.kind==='character'],['Props · base slots',d=>d.kind==='prop']];
 const seen=new Set();const gal=groups.map(([t,f])=>{const ds=built.defs.filter(d=>!seen.has(d.id)&&f(d));ds.forEach(d=>seen.add(d.id));return '<section><div class="eyebrow">'+t.toUpperCase()+'</div><div class="parts">'+ds.map(d=>{const [x,y,w,h]=d.vb,sc=Math.min(150/w,170/h),a=built.manifest.assets.find(z=>z.file===d.path+'.svg');
  return '<figure class="part"><div class="stage"><div class="thumb" style="width:'+Math.round(w*sc)+'px;height:'+Math.round(h*sc)+'px">'+files[d.path+'.svg']+'<span class="pivot" style="left:'+((d.pivot[0]-x)/w*100).toFixed(2)+'%;top:'+((d.pivot[1]-y)/h*100).toFixed(2)+'%"></span></div></div><figcaption><b>'+d.path+'.svg</b><br>parent '+(a.parent||'none')+' · z '+a.z+'<br>pivot '+a.pivot.join(', ')+'</figcaption></figure>';}).join('\n')+'</div></section>';}).join('\n');
 const left=built.defs.filter(d=>!seen.has(d.id)).map(d=>d.path);if(left.length)throw new Error('assets missing from gallery: '+left.join(', '));
 Object.values(B).flat().forEach(([p])=>{if(!files[p+'.svg'])throw new Error('build references missing asset '+p);});
 const css="body{margin:0;background:#EDEBE6;color:#1F1F1F;font-family:'IBM Plex Sans',sans-serif}a{color:#1F1F1F}a:hover{color:#000}main{max-width:1680px;margin:0 auto;padding:40px 48px 80px;display:flex;flex-direction:column;gap:48px}header{border-bottom:2px solid #1F1F1F;padding-bottom:16px;display:flex;flex-direction:column;gap:6px}h1{margin:0;font-size:40px;font-weight:600;letter-spacing:-0.01em}.eyebrow,figcaption{font-family:'IBM Plex Mono',monospace}.eyebrow{font-size:13px;letter-spacing:.08em}.lede{font-size:16px;max-width:820px;text-wrap:pretty}section{display:flex;flex-direction:column;gap:16px}.row{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,var(--w,240px)),1fr))}.cell{margin:0;display:flex;flex-direction:column;background:#FFFFFF}.cell>svg{width:100%;height:auto;display:block}.tiny{margin:0;width:150px;display:flex;flex-direction:column;background:#FFFFFF}.tiny>svg{width:150px;height:200px;display:block}.tinyrow{display:flex;flex-wrap:wrap;gap:8px}.parts{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}.part{margin:0;background:#E1DED7;display:flex;flex-direction:column}.stage{height:194px;display:flex;align-items:center;justify-content:center}.thumb{position:relative;flex:none}.thumb>svg{width:100%;height:100%;display:block}.pivot{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border:2px solid #C8402A;border-radius:50%;box-sizing:border-box}figcaption{font-size:12px;line-height:1.5;padding:10px 12px;background:#FFFFFF;border-top:1px solid #DDD;overflow-wrap:anywhere;text-wrap:pretty}figcaption b{font-weight:500}";
 const js="const NS='http://www.w3.org/2000/svg',B=JSON.parse(document.getElementById('loom-builds').textContent),src={};document.querySelectorAll('.part svg[data-asset]').forEach(s=>src[s.dataset.asset]=s);document.querySelectorAll('svg[data-build]').forEach(sv=>{const on=sv.dataset.onion;B[sv.dataset.build].forEach(([a,t],i)=>{const s=src[a];if(!s)return;const g=document.createElementNS(NS,'g');g.setAttribute('transform',t);if(on)g.setAttribute('opacity','0.42');g.appendChild(s.cloneNode(true));sv.appendChild(g);});});";
 const html='<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Maya v2 · review</title>\n<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet">\n<style>'+css+'</style></head><body><main>\n'
 +'<header><div class="eyebrow">CAST 01 / 08 · STORY TREATMENT · BATCH '+built.manifest.batch+'</div><h1>Maya · model sheet v2</h1><div class="lede">'+built.defs.length+' assets in the shared 1000 × 2000 grid; each file\'s viewBox is a crop of it, so pivots and anchors are grid coordinates. Everything below is assembled from the part markup in the galleries, layered by each asset\'s z. Grey lines are the height lines: head top, eye line, chin, shoulder, waist, crotch, knee, floor.</div></header>\n'
 +'<section><div class="eyebrow">1 · TURNAROUND · FRONT · 3/4 FRONT · SIDE · 3/4 BACK · BACK</div><div class="row" style="--w:220px">'+turn+'</div></section>\n'
 +'<section><div class="eyebrow">2 · STAND · POINT · SIT</div><div class="row" style="--w:300px">'+statics+'</div></section>\n'
 +'<section><div class="eyebrow">3 · ACTED POSES · WALK AS FOUR KEYS ON THE 3/4 RIG</div><div class="row" style="--w:240px">'+others+'</div></section>\n'
 +'<section><div class="eyebrow">4 · EXPRESSIONS · BIBLE ORDER</div><div class="row" style="--w:180px">'+exprBig+'</div><div class="eyebrow">AT 120 PX FACE WIDTH</div><div class="tinyrow">'+exprSmall+'</div></section>\n'
 +'<section><div class="eyebrow">5 · JOINT OVERLAY SHEET · RIGHT ARM · DELTOID OVER THE ARM ROOT, SLEEVE FOLD OVER THE FOREARM ROOT</div><div class="row" style="--w:200px">'+jointsUp+onionUp+'</div><div class="row" style="--w:200px">'+jointsFore+onionFore+'</div></section>\n'
 +gal+'\n</main>\n<script type="application/json" id="loom-manifest">'+JSON.stringify(built.manifest).replace(/</g,'\\u003c')+'</script>\n<script type="application/json" id="loom-builds">'+JSON.stringify(B)+'</script>\n<script>'+js+'</script>\n</body></html>';
 files['manifest.json']=JSON.stringify(built.manifest,null,1);files['index.html']=html;return {files,manifest:built.manifest};}
globalThis.MayaParts={run,measurer};
})();
