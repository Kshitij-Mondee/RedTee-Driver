// Maya — STORY treatment generator. Emits slot-coloured SVG strings.
(function(){
const C={ink:'#101010',skin:'#F2C7A5',skinS:'#D9A784',skinH:'#FBE3CF',skinD:'#C98E70',hair:'#3B2A20',hairS:'#24180F',hairH:'#6A4A36',
iris:'#4A6A8A',pupil:'#1A1A1A',white:'#FFFFFF',lips:'#B8645A',blush:'#E8998A',c1:'#2F4A7A',c1S:'#22365C',c1H:'#4A6AA0',
c2:'#D8D2C4',c2S:'#B8B0A0',c2H:'#F0ECE2',c3:'#5A4636',c3S:'#3E3024',c3H:'#7A6250',m:'#9AA0A6',mS:'#6E747A',mH:'#D0D4D8'};
const D2R=Math.PI/180, r1=n=>Math.round(n*10)/10, P=p=>r1(p[0])+' '+r1(p[1]), lerp=(a,b,t)=>a+(b-a)*t;
const M=a=>'M'+a.map(P).join('L');
const fill=(d,c,op)=>`<path d="${d}" fill="${c}"${op?` fill-opacity="${op}"`:''}/>`;
const line=(d,w,dash)=>`<path class="lm-outline" d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w||3.5}" stroke-linecap="round" stroke-linejoin="round"${dash?` stroke-dasharray="${dash}"`:''}/>`;
const shade=(d,c,op)=>`<path class="lm-shade" d="${d}" fill="${c}"${op?` fill-opacity="${op}"`:''}/>`;
const hi=(d,c)=>`<path class="lm-hi" d="${d}" fill="${c||C.skinH}"/>`;
const shape=(d,c,w)=>fill(d,c)+line(d,w||6);
function fr(i){const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s);}
// mirror absolute path about x=500
function mir(d){let out='',cmd='',k=0;const tok=d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g);
 for(const t of tok){ if(/[A-Za-z]/.test(t)){cmd=t;k=0;out+=t;continue;}
  let v=parseFloat(t);
  if(cmd==='A'){const i=k%7; if(i===4)v=1-v; if(i===5)v=1000-v;}
  else if(cmd==='H'){v=1000-v;} else if(cmd==='h'){v=-v;} else if(cmd==='V'||cmd==='v'){}
  else if(/[MLCQST]/.test(cmd)){ if(k%2===0)v=1000-v; }
  out+=(out.match(/[A-Za-z]$/)?'':' ')+r1(v); k++; }
 return out;}
const mp=pts=>pts.map(p=>[1000-p[0],p[1]]);
function cr(pts,seg){seg=seg||10;const o=[];
 if(pts.length===2){for(let i=0;i<=seg;i++){const t=i/seg;o.push([lerp(pts[0][0],pts[1][0],t),lerp(pts[0][1],pts[1][1],t)]);}return o;}
 for(let i=0;i<pts.length-1;i++){const p1=pts[i],p2=pts[i+1],p0=pts[i-1]||[2*p1[0]-p2[0],2*p1[1]-p2[1]],p3=pts[i+2]||[2*p2[0]-p1[0],2*p2[1]-p1[1]];
  for(let s=0;s<seg;s++){const t=s/seg,t2=t*t,t3=t2*t;const f=k=>0.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);o.push([f(0),f(1)]);}}
 o.push(pts[pts.length-1]);return o;}
function rib(pts,wf,seg){const s=cr(pts,seg),n=s.length,L=[0];for(let i=1;i<n;i++)L.push(L[i-1]+Math.hypot(s[i][0]-s[i-1][0],s[i][1]-s[i-1][1]));const T=L[n-1]||1;
 const left=[],right=[],N=[],W=[];
 for(let i=0;i<n;i++){const a=s[Math.max(0,i-1)],b=s[Math.min(n-1,i+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;const nx=-ty,ny=tx,w=wf(L[i]/T)/2;
  N.push([nx,ny]);W.push(w);left.push([s[i][0]+nx*w,s[i][1]+ny*w]);right.push([s[i][0]-nx*w,s[i][1]-ny*w]);}
 return {s,left,right,N,W};}
const PROF={both:t=>Math.pow(Math.sin(Math.PI*t),0.65),start:t=>0.15+0.85*Math.pow(1-t,0.6),end:t=>0.15+0.85*Math.pow(t,0.6),mid:t=>0.3+0.7*Math.sin(Math.PI*t)};
const tpCls=(c,k)=>{k=k||'lm-outline lm-taper';if(!c||c===C.ink)return 'lm-outline lm-taper';if(/lm-taper/.test(k)&&!/lm-outline/.test(k))k='lm-outline '+k;return k;};
function tp(pts,w,prof,color,cls){const pf=typeof prof==='function'?prof:PROF[prof||'both'];const r=rib(pts,t=>Math.max(0.6,w*pf(t)),pts.length>4?3:5);
 return `<path class="${tpCls(color,cls)}" d="${M(r.left)}L${r.right.slice().reverse().map(P).join('L')}Z" fill="${color||C.ink}"/>`;}
const tpS=(pts,w,prof,c)=>tp(pts,w,prof,c||C.skinD,'lm-shade');
const tpH=(pts,w,prof,c)=>tp(pts,w,prof,c||C.skinH,'lm-hi');
function tube(pts,wf,o){o=o||{};const r=rib(pts,typeof wf==='function'?wf:()=>wf,o.seg||10),n=r.s.length,wS=r.W[0],wE=r.W[n-1],L=r.left,R=r.right;
 let d=M(L)+(o.capEnd?`A${r1(wE)} ${r1(wE)} 0 0 0 ${P(R[n-1])}`:`L${P(R[n-1])}`)+'L'+R.slice().reverse().map(P).join('L');
 const open=d; if(o.capStart)d+=`A${r1(wS)} ${r1(wS)} 0 0 0 ${P(L[0])}`; d+='Z';
 return {d,open,r,n,sides:M(L)+M(R),capE:`M${P(L[n-1])}A${r1(wE)} ${r1(wE)} 0 0 0 ${P(R[n-1])}`,capS:`M${P(R[0])}A${r1(wS)} ${r1(wS)} 0 0 0 ${P(L[0])}`};}
function tubeShade(t,k,color){const r=t.r,n=r.s.length;let sx=0,sy=0;r.N.forEach(N=>{sx+=N[0];sy+=N[1];});const sg=(sx+sy)>0?1:-1;const e=[],inn=[];
 for(let i=0;i<n;i++){const N=r.N[i],w=r.W[i],s=r.s[i];e.push([s[0]+sg*N[0]*w,s[1]+sg*N[1]*w]);const wi=w*(1-2*k);inn.push([s[0]+sg*N[0]*wi,s[1]+sg*N[1]*wi]);}
 return shade(M(e)+'L'+inn.reverse().map(P).join('L')+'Z',color);}
const g=(id,inner,attr)=>`<g id="${id}"${attr||''}>${inner}</g>`;

// ---------------- HEAD ----------------
const BROWS={interested:[[-20,45],[2,53],[24,45]],worried_strong:[[-20,57],[2,51],[24,29]],frown_v:[[-16,21],[2,32],[24,45]],arched_high:[[-20,53],[2,65],[24,53]],skeptic_down:[[-18,27],[2,33],[24,35]],level_up:[[-20,42],[2,49],[24,44]],neutral:[[-20,36],[2,44],[24,37]],soft:[[-20,40],[2,47],[24,39]],raised:[[-20,48],[2,56],[24,46]],frown:[[-16,28],[2,36],[24,40]],
 worried:[[-20,48],[2,47],[24,34]],worried_soft:[[-20,44],[2,45],[24,35]],focus:[[-18,27],[2,33],[24,34]]};
function brow(cx,cy,side,key){const pts=BROWS[key].map(([u,v])=>[cx+side*u,cy-v]);
 const pf=t=>t<0.12?0.6+3.3*t:1-0.72*((t-0.12)/0.88);
 return tp(pts,10,pf,C.hairS,'lm-brow')+tp([[cx-side*14,cy-BROWS[key][0][1]-2],[cx-side*2,cy-BROWS[key][1][1]+1]],2.2,'both',C.hair,'lm-hi');}
function eye(cx,cy,side,st){st=Object.assign({open:1,squint:0,lower:0,cheek:0,look:[0,0]},st||{});const cheek=()=>st.cheek?tpS([[ox+side*5,cy+21],[cx-side*2,cy+15-3*st.cheek],[ix-side*3,cy+19]],1.6+1.2*st.cheek,'both'):'';
 const ox=cx+side*23,ix=cx-side*21,oy=cy-3,iy=cy+1,X=t=>lerp(ox,ix,t),base=t=>lerp(oy,iy,t);
 const N=16,T=[...Array(N+1)].map((_,i)=>i/N);let s='';
 if(st.closed){const k=st.closed==='happy'?-6:3.5;const lid=T.map(t=>[X(t),base(t)+k*Math.sin(Math.PI*t)]);
  s+=tp([[ox+side*6,oy-4+(k<0?6:0)],...lid],6,t=>t<0.1?0.4+6*t:1-0.6*t);
  if(k>0)s+=tpS(T.filter(t=>t>.15&&t<.85).map(t=>[X(t),base(t)-9]),2.4,'both');
  return s+cheek();}
 const hU=15*st.open*(1-0.2*st.squint),hL=10*(1-0.7*st.squint)*(1-0.7*st.lower);
 const up=t=>base(t)-hU*Math.pow(Math.sin(Math.PI*Math.pow(t,1.12)),0.7),lo=t=>base(t)-3.5*st.lower*Math.sin(Math.PI*t)+hL*Math.pow(Math.sin(Math.PI*Math.pow(t,0.82)),0.9);
 const U=T.map(t=>[X(t),up(t)]),Lw=T.map(t=>[X(t),lo(t)]);
 s+=fill(M(U)+'L'+Lw.slice().reverse().map(P).join('L')+'Z',C.white);
 const icx=cx-side*1+st.look[0]*6,icy=cy+1+st.look[1]*3.5,ir=st.open>1.15?10.8:12;
 const tOf=x=>(x-ox)/(ix-ox);
 const clipCircle=(ccx,ccy,r)=>{const tops=[],bots=[];for(let i=0;i<=24;i++){const x=ccx-r+2*r*i/24,dx=x-ccx,h=Math.sqrt(Math.max(0,r*r-dx*dx)),t=tOf(x);if(t<0||t>1)continue;
   const tt=Math.max(ccy-h,up(t)),bb=Math.min(ccy+h,lo(t));if(bb>tt+0.3){tops.push([x,tt]);bots.push([x,bb]);}}
  return tops.length>1?M(tops)+'L'+bots.reverse().map(P).join('L')+'Z':'';};
 const ip=clipCircle(icx,icy,ir);if(ip)s+=fill(ip,C.iris);
 const pp=clipCircle(icx,icy,5.6);if(pp)s+=fill(pp,C.pupil);
 s+=shade(M(U)+'L'+U.slice().reverse().map(p=>{const t=tOf(p[0]);return P([p[0],Math.min(p[1]+3.6*Math.min(1,st.open),lo(t))]);}).join('L')+'Z',C.skinD,0.45);
 const clx=icx-4,cly=icy-5,ct=tOf(clx);if(ct>0&&ct<1&&cly-2.5>up(ct)+0.5)s+=`<circle cx="${r1(clx)}" cy="${r1(cly)}" r="3" fill="${C.white}"/>`;
 s+=tp([[ox+side*7,oy-5],...U.filter((_,i)=>i%2===0)],6.2,t=>t<0.1?0.35+6.5*t:1-0.62*((t-0.1)/0.9));
 s+=tp(T.filter(t=>t>0.04&&t<0.64+0.3*st.lower).map(t=>[X(t),lo(t)+0.5]),2.4+2.2*st.lower,'both');
 s+=tp(T.filter(t=>t>0.14&&t<0.86).map(t=>[X(t),up(t)-6-4*Math.min(1.2,st.open)]),2.4,'both');
 if(st.squint>0.2&&!st.cheek)s+=tpS(T.filter(t=>t>0.2&&t<0.8).map(t=>[X(t),lo(t)+6]),2.6,'both');
 return s+cheek();}
const MO={rest:{w:23,lift:0.8,uT:7.5,lT:11},a_i:{w:22,oT:7,oB:16,tU:5,tongue:6,jaw:10,uT:5.5,lT:8},e:{w:25,lift:2,oT:5,oB:7,tU:5,tL:3.5,jaw:4,uT:5,lT:7.5},
 o:{w:13,round:1,oT:9,oB:12,uT:6.5,lT:8.5,jaw:8},u:{w:10,round:1,oT:2.5,oB:3.5,uT:7.5,lT:9,jaw:2},f_v:{w:21,oT:3.5,oB:0.5,tU:5.5,fv:1,uT:6,lT:7,jaw:1},
 l:{w:20,oT:6,oB:11,tU:5,tongue:9,jaw:6,uT:5.5,lT:8},w_q:{w:8.5,round:1,oT:2,oB:2.5,uT:8,lT:9.5,jaw:1},smile_talk:{w:25,lift:6,oT:4,oB:9,tU:6,jaw:4,uT:5,lT:8}};
function mouth(cx,cy,m){m=Object.assign({w:22,lift:0,asym:0,oT:0,oB:0,uT:6,lT:9,round:0,tU:0,tL:0,tongue:0},m);
 const N=20,T=[...Array(N+1)].map((_,i)=>i/N),yl=cy-m.lift+m.asym,yr=cy-m.lift-m.asym,X=t=>cx-m.w+2*m.w*t;
 const sP=lerp(0.85,0.42,m.round),ln=t=>lerp(yl,yr,t)+m.lift*Math.pow(Math.sin(Math.PI*t),1.3),sv=t=>Math.pow(Math.sin(Math.PI*t),sP);
 const iT=t=>ln(t)-m.oT*sv(t),iB=t=>ln(t)+m.oB*sv(t),bump=(t,c,w)=>Math.exp(-(((t-c)/w)**2));
 const uO=t=>iT(t)-m.uT*Math.pow(Math.sin(Math.PI*t),0.55)+2.2*bump(t,0.5,0.05)-1.1*(bump(t,0.4,0.07)+bump(t,0.6,0.07));
 const lO=t=>iB(t)+m.lT*Math.pow(Math.sin(Math.PI*t),0.7);
 const poly=(fa,fb,ts)=>M(ts.map(t=>[X(t),fa(t)]))+'L'+ts.slice().reverse().map(t=>P([X(t),fb(t)])).join('L')+'Z';
 const open=(m.oT+m.oB)>1.5;let s='';
 const teethU=()=>{const ts=T.filter(t=>t>=0.14&&t<=0.86);return fill(poly(t=>iT(t)-0.4,t=>Math.min(iT(t)+m.tU*Math.pow(Math.sin(Math.PI*t),0.3),m.fv?iT(t)+m.tU:iB(t)),ts),C.white);};
 if(open){s+=fill(poly(iT,iB,T),C.ink);
  if(m.tongue){const ts=T.filter(t=>t>0.22&&t<0.78);s+=fill(poly(t=>Math.max(iT(t)+1,iB(t)-m.tongue*Math.pow(Math.sin(Math.PI*(t-0.22)/0.56),0.7)),iB,ts),C.lips);}
  if(m.tL){const ts=T.filter(t=>t>=0.22&&t<=0.78);s+=fill(poly(t=>Math.max(iB(t)-m.tL*Math.pow(Math.sin(Math.PI*t),0.3),iT(t)),t=>iB(t)+0.4,ts),C.white);}
  if(m.tU&&!m.fv)s+=teethU();}
 const lower=poly(iB,lO,T),upper=poly(uO,iT,T);
 s+=fill(lower,C.lips)+`<ellipse class="lm-hi" cx="${r1(cx-3)}" cy="${r1(lO(0.5)-m.lT*0.42)}" rx="${r1(m.w*0.28)}" ry="2" fill="${C.skinH}" fill-opacity="0.6"/>`;
 if(m.fv)s+=teethU();
 s+=fill(upper,C.lips)+shade(upper,C.skinD,0.35);
 if(open)s+=line(poly(iT,iB,T),3);
 else{s+=tp(T.filter(t=>t>0.02&&t<0.98).map(t=>[X(t),ln(t)]),3.8,'mid');}
 const ck=m.lift>2?-1:(m.lift<-1?1:0);
 if(ck){s+=tp([[X(0)+1,yl],[X(0)-4,yl+ck*4]],2.4,'start')+tp([[X(1)-1,yr],[X(1)+4,yr+ck*4]],2.4,'start');}
 s+=tpS([[cx-9,lO(0.5)+3],[cx,lO(0.5)+4.5],[cx+9,lO(0.5)+3]],3,'both');
 return {svg:s,corner:[X(0),yl],cornerR:[X(1),yr]};}
const EXPR={
 attentive:{eyes:{open:1.05,look:[0.1,0]},brow:'soft',mouth:{w:23,lift:1,uT:7.5,lT:11}},
 neutral:{eyes:{open:0.95},brow:'neutral',mouth:{w:22,lift:0,uT:7,lT:10.5}},
 listening:{eyes:{open:1.08,look:[0.6,0]},brow:'interested',mouth:{w:21,lift:2.6,asym:1.4,uT:6,lT:9}},
 smile:{eyes:{open:0.8,squint:0.45,lower:0.4,cheek:0.8},brow:'soft',mouth:{w:27,lift:8,uT:5,lT:8.5},lines:1},
 laugh:{eyes:{closed:'happy',cheek:1},brow:'raised',mouth:{w:28,lift:9,oT:6,oB:20,tU:6,tongue:7,jaw:14,uT:4.5,lT:8},lines:1,blush:1},
 surprise:{eyes:{open:1.38},brow:'arched_high',mouth:{w:12,round:1,oT:10,oB:15,jaw:12,uT:5.5,lT:8}},
 concern:{eyes:{open:1.06,look:[0,0.15]},brow:'worried_strong',mouth:{w:18,lift:-5.5,uT:6,lT:10.5}},
 doubt:{eyes:{open:1.02},eyesR:{open:0.58,squint:0.5,lower:0.5},brow:'arched_high',browR:'skeptic_down',mouth:{w:20,asym:6,lift:-1,uT:4.5,lT:8}},
 focus:{eyes:{open:0.68,squint:0.3,lower:0.65,look:[0,0.8]},brow:'focus',mouth:{w:14,lift:-1,uT:3.5,lT:6}},
 realisation:{eyes:{open:1.24,look:[0,-0.3]},brow:'raised',mouth:{w:14,round:0.6,oT:4,oB:9,jaw:6,lift:1.5,uT:5.5,lT:8}},
 frustration:{eyes:{open:0.62,squint:0.55,lower:0.4},brow:'frown_v',mouth:{w:26,lift:-4.5,oT:3,oB:4.5,tU:3.5,tL:3.5,jaw:1,uT:4,lT:6}},
 relief:{eyes:{closed:'relaxed'},brow:'worried_soft',mouth:{w:12,round:0.8,oT:2.5,oB:5.5,lift:1.5,jaw:2,uT:5.5,lT:8}},
 pride:{eyes:{open:0.6,squint:0.35,lower:0.5,cheek:0.7,look:[-0.25,0]},brow:'level_up',mouth:{w:24,lift:5.5,asym:4.5,uT:5,lT:8.5},lines:0.8}};
const BIBLE=['neutral','listening','smile','laugh','surprise','concern','doubt','focus','realisation','frustration','relief','pride'];
function puffArt(th){th=th||0;const c=Math.cos(th*D2R),sn=Math.sin(th*D2R),CX=500,CY=236,R=[84,62,74],Z0=-22;
 const P3=(X,Y,Z)=>[CX+X*c+Z*sn,Y,-X*sn+Z*c],cen=P3(0,CY,Z0);
 const CL=[[-150,4,48,1],[-112,38,48,-1],[-62,66,48,1],[2,76,50,-1],[64,62,48,1],[114,34,48,-1],[152,4,48,1],[-36,16,54,-1],[38,20,54,1],[180,40,48,-1],[-88,-26,44,1],[90,-26,44,-1]];
 let s='<ellipse class="lm-shade" cx="'+r1(cen[0])+'" cy="'+(CY+4)+'" rx="'+r1(Math.hypot(R[0]*c,R[2]*sn)+30)+'" ry="'+r1(R[1]+30)+'" fill="'+C.hairS+'"/>';
 const it=CL.map(([az,el,r,dir],i)=>{const a=az*D2R,e=el*D2R,p=P3(R[0]*Math.cos(e)*Math.sin(a),CY-R[1]*Math.sin(e),Z0+R[2]*Math.cos(e)*Math.cos(a));return {x:p[0],y:p[1],d:p[2],r,dir,i};}).sort((u,v)=>u.d-v.d);
 it.forEach(({x,y,d,r,dir,i})=>{const n=7,J=[],K=[];for(let j=0;j<n;j++){const a=(j/n)*2*Math.PI+fr(i*7+j)*0.3;J.push([x+Math.cos(a)*r*0.86,y+Math.sin(a)*r*0.86,a]);}
  for(let j=0;j<n;j++){const a0=J[j][2],a1=j+1<n?J[j+1][2]:J[0][2]+2*Math.PI,a=(a0+a1)/2;K.push([x+Math.cos(a)*r*1.1,y+Math.sin(a)*r*1.1]);}
  let dd='M'+P(J[0]);for(let j=0;j<n;j++)dd+='Q'+P(K[j])+' '+P(J[(j+1)%n]);dd+='Z';s+=fill(dd,C.hair);
  const O=[],I=[];for(let q=0;q<=8;q++){const a=(-0.2+q/8*0.95)*Math.PI;O.push([x+Math.cos(a)*r*0.92,y+Math.sin(a)*r*0.92]);I.push([x-r*0.18+Math.cos(a)*r*0.66,y-r*0.18+Math.sin(a)*r*0.66]);}
  s+=shade(M(O)+'L'+I.reverse().map(P).join('L')+'Z',C.hairS);
  const sp=[];const a0=fr(i+50)*6.28;for(let q=0;q<=10;q++){const t=q/10,a=a0+dir*t*1.7*Math.PI,rr=r*(0.12+0.5*t);sp.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}
  s+=tp(sp,4.2,'end',C.hairS,'lm-shade');
  if((x-cen[0])*0.9+(y-CY)<-26)s+=tpH([[x-r*0.78,y+r*0.02],[x-r*0.58,y-r*0.55],[x-r*0.02,y-r*0.8]],r*0.2,'both',C.hairH);
  s+=line(dd,5);});
 [[-128,46,-1],[112,52,1],[30,84,1]].forEach(([az,el,dir])=>{const a=az*D2R,e=el*D2R,p=P3(R[0]*1.5*Math.cos(e)*Math.sin(a),CY-R[1]*1.62*Math.sin(e),Z0+R[2]*1.5*Math.cos(e)*Math.cos(a));if(p[2]<-30)return;
  const ux=p[0]-cen[0],uy=p[1]-CY,ul=Math.hypot(ux,uy)||1,nx=ux/ul,ny=uy/ul,px=-ny*dir,py=nx*dir;const pts=[];
  for(let q=0;q<=12;q++){const t=q/12,w=11*Math.sin(t*2.6*Math.PI)*t;pts.push([p[0]-nx*8+nx*36*t+px*w,p[1]-ny*8+ny*36*t+py*w]);}
  const tb=tube(pts,u=>7-4.8*u,{capEnd:true,seg:3});s+=fill(tb.d,C.hair)+tubeShade(tb,0.3,C.hairS)+line(tb.open,3);});
 return s;}
function puff(){return puffArt(0);}
function ear(side){const d0='M410 450C396 440 382 452 384 474C386 496 394 514 412 518Z',o0='M410 450C396 440 382 452 384 474C386 496 394 514 412 518',in0='M404 461C396 460 393 471 396 484C398 494 402 500 407 502C403 490 402 474 404 461Z';
 const f=side<0?(x=>x):mir;let s=fill(f(d0),C.skin);if(side>0)s+=shade(mir('M406 452C396 448 388 456 388 472C389 490 396 508 410 515C399 498 396 476 406 452Z'),C.skinS);
 s+=fill(f(in0),C.skinD)+(side<0?tp([[399,459],[392,474],[398,494]],2.5):tp(mp([[399,459],[392,474],[398,494]]),2.5))+line(f(o0),5);return s;}
function hoop(cx,cy){const o=13,i=9.5;return `<path d="M${cx-o} ${cy}A${o} ${o} 0 1 0 ${cx+o} ${cy}A${o} ${o} 0 1 0 ${cx-o} ${cy}ZM${cx-i} ${cy}A${i} ${i} 0 1 0 ${cx+i} ${cy}A${i} ${i} 0 1 0 ${cx-i} ${cy}Z" fill="${C.m}" fill-rule="evenodd"/>`+hi(`M${cx-11} ${cy-5}A12 12 0 0 1 ${cx-4} ${cy-11.5}L${cx-3.5} ${cy-9}A9.6 9.6 0 0 0 ${cx-9} ${cy-4}Z`,C.mH)+`<circle class="lm-outline" cx="${cx}" cy="${cy}" r="${o}" fill="none" stroke="${C.ink}" stroke-width="2.5"/><circle class="lm-outline" cx="${cx}" cy="${cy}" r="${i}" fill="none" stroke="${C.ink}" stroke-width="2"/>`;}
function headPieces(exIn){const ex=Object.assign({},EXPR.attentive,exIn||{});const m=Object.assign({},typeof ex.mouth==='string'?MO[ex.mouth]:ex.mouth);const jd=m.jaw||0;
 const faceD=`M404 440C402 360 440 322 500 322C560 322 598 360 596 440C596 480 590 512 574 ${540+jd*.5}C556 ${566+jd} 528 ${586+jd} 500 ${587+jd}C472 ${586+jd} 444 ${566+jd} 426 ${540+jd*.5}C410 512 404 480 404 440Z`;
 const o={hairBack:puff()};
 o.ears=ear(-1)+ear(1);
 o.skin=(fill(faceD,C.skin)+shade(`M584 420C594 460 592 500 578 ${535+jd*.5}C562 ${562+jd} 536 ${582+jd} 506 ${587+jd}C530 ${574+jd} 552 ${550+jd} 562 ${520+jd*.4}C572 494 578 460 584 420Z`,C.skinS)
  
  +tpH([[419,468],[426,486],[440,497]],5.5)+tpH([[489,574+jd],[500,577+jd]],3)+line(faceD,6));
 const bl=ex.blush?0.5:0.35;
 let face=`<ellipse cx="440" cy="514" rx="21" ry="10" fill="${C.blush}" fill-opacity="0.35"/><ellipse cx="560" cy="514" rx="21" ry="10" fill="${C.blush}" fill-opacity="0.35"/>`;
 if(ex.blush)face+=`<ellipse cx="440" cy="512" rx="14" ry="7" fill="${C.blush}" fill-opacity="0.35"/><ellipse cx="560" cy="512" rx="14" ry="7" fill="${C.blush}" fill-opacity="0.35"/>`;
 o.eyeL=eye(459,463,-1,ex.eyes);o.eyeR=eye(541,463,1,ex.eyesR||ex.eyes);
 o.browL=brow(459,463,-1,ex.brow);o.browR=brow(541,463,1,ex.browR||ex.brow);
 o.nose=(shade('M507 470C512 488 517 502 519 511C514 516 507 517 503 516C508 506 508 488 507 470Z',C.skinS)+shade('M487 522C495 528 505 528 513 522C508 531 492 531 487 522Z',C.skinS)
  +tpH([[498,470],[497,490],[498,506]],4.5)+tp([[508,474],[511,488],[513,500]],2,'both')
  +tp([[488,505],[482,512],[485,519],[491,521]],3.6,'mid')+tp([[512,505],[518,512],[515,519],[509,521]],3.6,'mid')+tp([[495,523],[500,524.5],[505,523]],2.6,'both')
  +fill('M489 518C491 515 496 515 497 518C495 520.5 491 520.5 489 518Z',C.ink)+fill('M511 518C509 515 504 515 503 518C505 520.5 509 520.5 511 518Z',C.ink));
 const mo=mouth(500,551+jd*0.3,m);let jaw=mo.svg;
 if(ex.lines){const c=mo.corner,cR=mo.cornerR;jaw+=tpS([[485,514],[c[0]-8,c[1]-14],[c[0]-6,c[1]+4]],2.6*ex.lines+0.4,'both')+tpS([[515,514],[cR[0]+8,cR[1]-14],[cR[0]+6,cR[1]+4]],2.6*ex.lines+0.4,'both');}
 const capO='M401 446C394 370 432 312 500 310C568 312 606 370 599 446',capI='M599 446C598 425 594 405 586 395C578 388 570 384 560 383C540 379 520 384 500 386C480 384 460 379 440 383C430 384 422 388 414 395C406 405 402 425 401 446';
 const capD=capO+capI.replace('M599 446','')+'Z';
 let hf=fill(capD,C.hair)+shade('M558 326C590 346 606 390 599 446C596 428 590 406 576 390C574 368 570 346 558 326Z',C.hairS);
 [[[446,374],[452,354],[466,340],[484,333]],[[476,368],[480,352],[488,340],[495,333]],[[526,368],[520,352],[512,340],[505,333]],[[556,374],[548,354],[534,340],[517,333]],[[412,424],[416,394],[432,362],[460,340]],[[588,424],[584,394],[568,362],[540,340]],[[428,394],[436,370],[452,350],[474,336]],[[572,394],[564,370],[548,350],[526,336]]]
  .forEach((p,i)=>{hf+=tp(p,i%2?2.6:3.2,'both',C.hairS,'lm-shade');});
 hf+=tpH([[426,384],[444,350],[476,330]],6.5,'both',C.hairH)+tpH([[452,384],[462,356],[484,336]],3,'both',C.hairH);
 hf+=line(capO,6)+line(capI,2.6)+tp([[431,388],[426,394],[428,400]],2,'both',C.hair,'lm-shade')+tp([[569,388],[574,394],[572,400]],2,'both',C.hair,'lm-shade');
 hf+=shape('M456 330C468 316 532 316 544 330C542 344 458 344 456 330Z',C.c1,3.5)+shade('M520 320C532 322 542 326 544 330C543 337 535 340 524 341C528 334 526 326 520 320Z',C.c1S)+tp([[478,322],[480,340]],2,'both')+tp([[522,322],[520,340]],2,'both');
 const tL=tube([[413,386],[404,400],[412,414],[402,428],[409,443],[401,457]],t=>9.5-5*t,{capEnd:true,seg:6}),tR=tube([[587,390],[597,403],[588,417],[598,430],[590,445],[597,458]],t=>9.5-5*t,{capEnd:true,seg:6});
 hf+=fill(tL.d,C.hair)+tpH([[411,392],[406,402]],2.5,'both',C.hairH)+line(tL.open,3)+fill(tR.d,C.hair)+tubeShade(tR,0.3,C.hairS)+line(tR.open,3);
 o.hairFront=hf;o.jaw=jaw;o.blush=face;
 o.earL=hoop(398,529);o.earR=hoop(602,529);return o;}
function headArt(exIn,opt){opt=opt||{};const p=headPieces(exIn);
 return (opt.noHairBack?'':g('hair_back',p.hairBack,' data-pivot="500 330"'))+g('ears',p.ears)+g('head_skin',p.skin)+g('face',p.blush+g('brow_l',p.browL)+g('brow_r',p.browR)+g('eye_l',p.eyeL)+g('eye_r',p.eyeR)+g('nose',p.nose))+g('jaw',p.jaw,' data-pivot="500 548"')+g('hair_front',p.hairFront,' data-pivot="500 380"')+g('earring_l',p.earL,' data-pivot="406 516"')+g('earring_r',p.earR,' data-pivot="594 516"');}
function neckArt(){return fill('M468 545C470 580 467 606 460 626L540 626C533 606 530 580 532 545Z',C.skin)+shade('M515 560C520 585 525 606 535 626L540 626C533 606 530 580 532 545Z',C.skinS)
 +shade('M468 552C485 598 515 598 532 552L533 592C515 610 485 610 467 592Z',C.skinD)+tpS([[474,582],[484,604],[494,624]],2.6,'both')+tpS([[526,582],[516,604],[506,624]],2.6,'both')
 +line('M468 545C470 580 467 606 460 626',5)+line('M532 545C530 580 533 606 540 626',5);}

// ---------------- HANDS (local: wrist 0,0 ; fingers +y ; thumb +x ; back of hand to viewer) ----------------
const FING={index:{k:[15,63],L:[27,19,16],w:14.5},middle:{k:[3,67],L:[30,21,17],w:15},ring:{k:[-9,65],L:[28,19,16],w:14},pinky:{k:[-20,58],L:[21,15,13],w:12.5}};
const THUMB={k:[21,14],L:[28,21,17],w:17};
const Z3=[0,0,0],ext=(a,b)=>[a,b||Z3,Z3],cur=a=>[a,Z3,[100,0,0]];
function chain(F,st){const [a,b,c]=st;let ang=a,cum=0;const base=F.k,pts=[[base[0]-Math.sin(ang*D2R)*12,base[1]-Math.cos(ang*D2R)*12],base];let cu=base,lastF=1,stub=false;
 for(let j=0;j<3;j++){ang+=b[j];cum+=c[j];let f=Math.cos(Math.min(cum,180)*D2R);if(j===0&&f<0.42){f=0.42;stub=true;}else if(f<0.25)break;
  cu=[cu[0]+Math.sin(ang*D2R)*F.L[j]*f,cu[1]+Math.cos(ang*D2R)*F.L[j]*f];pts.push(cu);lastF=f;if(stub)break;}
 return {pts,lastF,stub,tip:cu};}
function crease(p,q,w,col,cls){const dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,h=w*0.32;
 return tp([[p[0]+nx*h,p[1]+ny*h],[p[0]+dx/l*2,p[1]+dy/l*2],[p[0]-nx*h,p[1]-ny*h]],2,'both',col||C.ink,cls);}
function fingerSVG(F,ch,palm){const t=tube(ch.pts,u=>F.w*(1-0.1*u),{capEnd:true,seg:6});let s=fill(t.d,C.skin)+tubeShade(t,0.27,C.skinS)+line(t.open,3.4);const p=ch.pts;
 if(!palm&&!ch.stub&&p.length===5&&ch.lastF>0.55){const a=p[3],b=p[4],n1=[lerp(a[0],b[0],0.32),lerp(a[1],b[1],0.32)],n2=[lerp(a[0],b[0],0.9),lerp(a[1],b[1],0.9)];
  const nt=tube([n1,n2],F.w*0.56,{capStart:true,capEnd:true,seg:4});s+=fill(nt.d,C.skinH)+line(nt.d,2);}
 if(p.length>3)s+=crease(p[2],p[3],F.w,palm?C.skinD:C.ink,palm?'lm-shade':'lm-outline lm-taper');
 if(palm&&p.length>4)s+=crease(p[3],p[4],F.w,C.skinD,'lm-shade');
 if(ch.stub){const a=p[1],b=p[2];s+=tpS([[lerp(a[0],b[0],0.75)-4,lerp(a[1],b[1],0.75)],[lerp(a[0],b[0],0.75)+4,lerp(a[1],b[1],0.75)]],2.4,'both');}
 return s;}
const HP={
 relaxed:{sq:0.6,f:{index:[4,[8,10,8],[16,26,18]],middle:[2,[7,9,7],[20,30,20]],ring:[0,[6,8,6],[22,32,22]],pinky:[-2,[5,7,6],[24,34,22]]},tb:{k:[12,26],L:[22,18,15],w:16},t:[6,[8,10,0],[0,18,12]]},
 open:{f:{index:ext(8),middle:ext(1),ring:ext(-6),pinky:ext(-14)},t:[56,[-6,-6,0],Z3]},
 point:{f:{index:ext(2),middle:cur(-2),ring:cur(-4),pinky:cur(-7)},t:[6,[24,22,0],[20,30,30]]},
 thumb_up:{f:{index:cur(3),middle:cur(0),ring:cur(-3),pinky:cur(-6)},t:[92,[-6,-4,0],Z3]},
 fist:{f:{index:cur(3),middle:cur(0),ring:cur(-3),pinky:cur(-6)},t:[-25,[-10,-5,0],[25,25,0]]},
 pinch:{f:{index:[14,[22,30,22],[22,32,22]],middle:[2,[6,8,8],[42,50,30]],ring:[-4,[4,6,6],[50,50,30]],pinky:[-9,[2,4,4],[55,50,30]]},aim:1},
 holding_phone:{f:{index:cur(3),middle:cur(0),ring:cur(-3),pinky:cur(-6)},wrap:{x0:-36,x1:-8,y0:48,dy:17},t:[10,Z3,Z3],prop:'phone'},
 holding_cup:{f:{index:cur(3),middle:cur(0),ring:cur(-3),pinky:cur(-6)},wrap:{x0:-40,x1:-10,y0:52,dy:16},t:[20,Z3,Z3],prop:'cup'},
 holding_paper:{f:{index:[6,[4,6,6],[20,30,20]],middle:[1,[3,5,5],[24,32,22]],ring:[-4,[2,4,4],[26,32,22]],pinky:[-9,[0,3,3],[28,32,22]]},t:[40,[-14,-12,0],Z3],prop:'paper'},
 holding_pen:{f:{index:[14,[22,30,22],[22,32,22]],middle:[2,[6,8,8],[42,50,30]],ring:[-4,[4,6,6],[50,50,30]],pinky:[-9,[2,4,4],[55,50,30]]},aim:1,prop:'pen'},
 typing:{f:{index:[6,[6,10,8],[30,42,22]],middle:[1,[4,8,6],[32,44,22]],ring:[-4,[2,6,6],[34,44,22]],pinky:[-10,[0,4,4],[36,44,22]]},t:[30,[6,6,0],[25,15,0]]},
 count_1:{f:{index:ext(3),middle:cur(-1),ring:cur(-4),pinky:cur(-7)},t:[-28,[-8,-8,0],[30,30,0]]},
 count_2:{f:{index:ext(9),middle:ext(-3),ring:cur(-4),pinky:cur(-7)},t:[-28,[-8,-8,0],[30,30,0]]},
 count_3:{f:{index:ext(10),middle:ext(1),ring:ext(-7),pinky:cur(-8)},t:[-28,[-8,-8,0],[30,30,0]]},
 count_4:{f:{index:ext(9),middle:ext(1),ring:ext(-6),pinky:ext(-13)},t:[-8,[-30,-20,0],[50,40,30]]},
 count_5:{f:{index:ext(9),middle:ext(1),ring:ext(-7),pinky:ext(-15)},t:[58,[-6,-6,0],Z3]},
 ok:{f:{index:[14,[28,36,32],[30,40,30]],middle:ext(2,[2,2,2]),ring:ext(-5,[0,2,2]),pinky:ext(-12)},aim:1},
 wave:{palm:1,f:{index:ext(12),middle:ext(2),ring:ext(-8),pinky:ext(-18)},t:[62,[-8,-6,0],Z3]},
 palm_up_offer:{palm:1,f:{index:[8,[3,4,3],[6,10,6]],middle:[1,[2,3,3],[6,10,6]],ring:[-5,[1,2,2],[8,12,8]],pinky:[-11,[0,2,2],[10,14,8]]},t:[50,[-4,0,0],Z3]},
 palm_out_stop:{palm:1,f:{index:ext(4),middle:ext(0),ring:ext(-3),pinky:ext(-7)},t:[38,[-4,-4,0],Z3]}};
function propSVG(kind,H,tipI){
 if(kind==='phone')return shape('M-26 18L32 18C37 18 40 21 40 26L40 112C40 117 37 120 32 120L-26 120C-31 120 -34 117 -34 112L-34 26C-34 21 -31 18 -26 18Z',C.m,4)+shade('M22 18L32 18C37 18 40 21 40 26L40 112C40 117 37 120 32 120L22 120Z',C.mS)+`<circle cx="-20" cy="32" r="5" fill="${C.ink}"/><circle cx="-8" cy="32" r="3" fill="${C.ink}"/>`;
 if(kind==='cup')return shape('M-34 30L46 30L38 128C37 134 33 136 28 136L-16 136C-21 136 -25 134 -26 128Z',C.c2,5)+shade('M26 30L46 30L38 128C37 134 33 136 28 136L22 136C28 100 28 60 26 30Z',C.c2S)+shape('M-30 66L42 66L40 98L-28 98Z',C.c3,3)+shape('M-40 20L52 20L52 32L-40 32Z',C.c2H,4)+`<rect id="slot_cup" x="-20" y="72" width="40" height="20" fill="none" stroke="none"/>`;
 if(kind==='paper')return shape('M-36 74L72 62L84 182L-24 194Z',C.white,3.5)+tp([[-10,120],[60,112]],2,'both',C.c2S,'lm-shade')+tp([[-6,140],[70,131]],2,'both',C.c2S,'lm-shade')+tp([[-3,160],[50,154]],2,'both',C.c2S,'lm-shade')+`<rect id="slot_paper" x="-14" y="104" width="96" height="70" fill="none" stroke="none" transform="rotate(-6.5 34 139)"/>`;
 if(kind==='pen'){const T=tipI;const a=[T[0]-30,T[1]-56],b=[T[0]+16,T[1]+30];const t=tube([a,b],9,{capStart:true,capEnd:true,seg:4});return fill(t.d,C.m)+tubeShade(t,0.3,C.mS)+line(t.d,3)+tp([b,[b[0]+5,b[1]+9]],4,'start');}
 return '';}
function handArt(pose,o){o=o||{};const H=HP[pose]||HP.relaxed,palm=!!H.palm,sx=o.shadeX||1,sq=H.sq||1;let fing='',tipI=null;const FG=k=>Object.assign({},FING[k],{k:[FING[k].k[0]*sq,FING[k].k[1]]});
 const order=['pinky','ring','middle','index'];
 order.forEach(k=>{const F=FG(k);const ch=chain(F,H.f[k]||ext(0));if(k==='index')tipI=ch.tip;if(!H.wrap||ch.stub)fing+=fingerSVG(F,ch,palm);});
 const pD='M-23 -6C-25 14 -27 36 -27 52C-26 60 -22 64 -17 66C-8 70 6 72 17 68C23 65 27 58 27 48C27 32 26 14 24 -6Z';
 const flip=d=>d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g,(m,x,y)=>(-parseFloat(x))+' '+y);const sqz=d=>sq===1?d:d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g,(m,x,y)=>r1(parseFloat(x)*(x<0?sq:0.5+0.5*sq))+' '+y);
 const pS='M14 -6L24 -6C26 14 27 32 27 48C27 58 23 65 17 68C19 56 18 40 17 24C16 12 15 4 14 -6Z';
 let pal=fill(sqz(pD),C.skin)+shade(sqz(sx>0?pS:flip(pS)),C.skinS)+line(sqz('M-23 -6C-25 14 -27 36 -27 52C-26 60 -22 64 -17 66'),3.6)+line(sqz('M17 68C23 65 27 58 27 48C27 32 26 14 24 -6'),3.6);
 if(palm)pal+=tpS([[-24,42],[-6,46],[12,42],[22,33]],2.6,'both')+tpS([[24,22],[6,34],[-16,44]],2.4,'both')+tpS([[21,12],[10,30],[12,54]],2.6,'both');
 else Object.keys(FING).forEach(k=>{const F=FG(k);pal+=tp([[F.k[0]-4,F.k[1]-5],[F.k[0],F.k[1]-7],[F.k[0]+4,F.k[1]-5]],1.8,'both');});
 let thumb='';
 if(H.aim){const B=[22,12],T=[tipI[0]+3,tipI[1]+2],dx=T[0]-B[0],dy=T[1]-B[1],l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;
  const tt=tube([[B[0]-dx/l*10,B[1]-dy/l*10],B,[B[0]+dx*0.5-nx*9,B[1]+dy*0.5-ny*9],T],u=>17*(1-0.18*u),{capEnd:true,seg:6});
  thumb=fill(tt.d,C.skin)+tubeShade(tt,0.27,C.skinS)+line(tt.open,4);}
 else{const TH=H.tb?Object.assign({},THUMB,H.tb):THUMB;const ch=chain(TH,H.t);thumb=fingerSVG(TH,ch,palm);}
 let wrap='';
 if(H.wrap){const W=H.wrap;[14.5,15,14,12.5].forEach((w,i)=>{const y=W.y0+i*W.dy;const t=tube([[W.x0,y],[W.x1,y+2]],w,{capEnd:true,seg:4});wrap+=fill(t.d,C.skin)+tubeShade(t,0.27,C.skinS)+line(t.open,4);
   const n1=[W.x1-12,y+1.5],n2=[W.x1-1,y+2];const nt=tube([n1,n2],w*0.56,{capStart:true,capEnd:true,seg:3});wrap+=fill(nt.d,C.skinH)+line(nt.d,2);});}
 const prop=H.prop?g('prop_'+H.prop,propSVG(H.prop,H,tipI)):'';
 const grip=`<circle id="anchor_grip" cx="${H.prop==='pen'?r1(tipI[0]):0}" cy="${H.prop==='pen'?r1(tipI[1]):(pose==='fist'||pose==='thumb_up'?62:(H.prop?70:96))}" r="2" fill="none"/>`;
 if(H.prop==='paper')return fing+pal+prop+thumb+grip;
 if(H.prop==='pen')return fing+pal+prop+thumb+grip;
 if(H.wrap)return pal+fing+thumb+prop+wrap+grip;
 return fing+pal+thumb+grip;}

// ---------------- BODY ----------------
const RIG={root:{p:[0,0]},torso_lower:{u:'root',p:[500,1040]},thigh_r:{u:'torso_lower',p:[437,1105]},shin_r:{u:'thigh_r',p:[432,1500]},foot_r:{u:'shin_r',p:[434,1846]},
 thigh_l:{u:'torso_lower',p:[563,1105]},shin_l:{u:'thigh_l',p:[568,1500]},foot_l:{u:'shin_l',p:[566,1846]},torso_upper:{u:'torso_lower',p:[500,1000]},
 neck:{u:'torso_upper',p:[500,624]},head:{u:'neck',p:[500,578]},upper_arm_r:{u:'torso_upper',p:[360,684]},forearm_r:{u:'upper_arm_r',p:[348,950]},hand_r:{u:'forearm_r',p:[350,1186]},
 upper_arm_l:{u:'torso_upper',p:[640,684]},forearm_l:{u:'upper_arm_l',p:[652,950]},hand_l:{u:'forearm_l',p:[650,1186]}};
const mul=(A,B)=>[A[0]*B[0]+A[2]*B[1],A[1]*B[0]+A[3]*B[1],A[0]*B[2]+A[2]*B[3],A[1]*B[2]+A[3]*B[3],A[0]*B[4]+A[2]*B[5]+A[4],A[1]*B[4]+A[3]*B[5]+A[5]];
const rotA=(a,px,py)=>{const c=Math.cos(a*D2R),s=Math.sin(a*D2R);return [c,s,-s,c,px-c*px+s*py,py-s*px-c*py];};
const app=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
const inv=m=>{const det=m[0]*m[3]-m[1]*m[2];return [m[3]/det,-m[1]/det,-m[2]/det,m[0]/det,(m[2]*m[5]-m[3]*m[4])/det,(m[1]*m[4]-m[0]*m[5])/det];};
function fk(rot,root){const W={root:[1,0,0,1,root[0],root[1]]};const get=n=>{if(W[n])return W[n];const R=RIG[n];W[n]=mul(get(R.u),rotA(rot[n]||0,R.p[0],R.p[1]));return W[n];};Object.keys(RIG).forEach(get);return W;}
const X=(side,pts)=>side==='r'?pts:mp(pts), XD=(side,d)=>side==='r'?d:mir(d);
function thighArt(side){const t=tube(X(side,[[437,1092],[434,1300],[431,1512]]),u=>u<0.18?126-4*u/0.18:122-40*Math.pow((u-0.18)/0.82,0.85),{capStart:true,capEnd:true});
 let s=fill(t.d,C.c3)+tubeShade(t,0.3,C.c3S)+line(t.d,6);
 [[[[490,1150],[472,1176],[460,1212]],3.5],[[[486,1210],[474,1230]],3],[[[396,1462],[408,1474]],3],[[[468,1470],[456,1482]],3],[[[384,1084],[396,1124],[400,1146]],2.6],[[[381,1160],[386,1300],[392,1470]],2.2]]
  .forEach(([p,w])=>{s+=tp(X(side,p),w,'both');});
 s+=tpH(X(side,[[392,1180],[398,1300],[404,1420]]),4,'both',C.c3H);return s;}
function shinArt(side){const t=tube(X(side,[[431,1488],[432,1660],[434,1820]]),u=>u<0.35?82+2*u/0.35:84-14*((u-0.35)/0.65),{capStart:true});
 let s=fill(t.d,C.c3)+tubeShade(t,0.3,C.c3S)+line(t.sides,6);
 const h=tube(X(side,[[434,1806],[434,1838]]),74,{});s+=fill(h.d,C.c3)+tubeShade(h,0.3,C.c3S)+line(h.d,4)+tp(X(side,[[400,1816],[468,1816]]),1.8,'both',C.c3S,'lm-shade');
 [[[408,1772],[422,1786]],[[456,1762],[466,1778]],[[436,1530],[448,1540]]].forEach(p=>{s+=tp(X(side,p),3,'both');});
 s+=tpH(X(side,[[400,1540],[402,1660],[404,1780]]),3.5,'both',C.c3H);return s;}
function footArt(side){const cx=side==='r'?434:566,o=side==='r'?-4:4;
 let s=fill(`M${cx-20} 1826L${cx+20} 1826L${cx+20} 1866L${cx-20} 1866Z`,C.skin)+shade(`M${cx+6} 1826L${cx+20} 1826L${cx+20} 1866L${cx+6} 1866Z`,C.skinS)+line(`M${cx-20} 1826L${cx-20} 1856`,3.5)+line(`M${cx+20} 1826L${cx+20} 1856`,3.5);
 const up=`M${cx-33} 1862C${cx-41} 1871 ${cx-46+o} 1880 ${cx-45+o} 1888L${cx+45+o} 1888C${cx+46+o} 1880 ${cx+40} 1868 ${cx+31} 1860C${cx+18} 1850 ${cx-20} 1850 ${cx-33} 1862Z`;
 const so=`M${cx-48+o} 1885L${cx+48+o} 1885C${cx+50+o} 1891 ${cx+49+o} 1898 ${cx+44+o} 1900L${cx-44+o} 1900C${cx-49+o} 1898 ${cx-50+o} 1891 ${cx-48+o} 1885Z`;
 s+=`<g id="shoe_${side}" transform="translate(${cx} 1900) scale(1.34) translate(${-cx} -1900)">`+fill(up,C.c2)+shade(`M${cx+18} 1855C${cx+34} 1862 ${cx+44+o} 1876 ${cx+45+o} 1888L${cx+28+o} 1888C${cx+30} 1876 ${cx+27} 1864 ${cx+18} 1855Z`,C.c2S)+line(up,6);
 s+=shape(`M${cx-13} 1846L${cx+13} 1846L${cx+14} 1870L${cx-14} 1870Z`,C.c2H,3);
 [1853,1860,1867].forEach(y=>{s+=line(`M${cx-12} ${y}L${cx+12} ${y+2}`,2.4);});s+=line(`M${cx-10} 1853L${cx+10} 1867M${cx+10} 1853L${cx-10} 1867`,2);
 s+=line(`M${cx-37+o} 1879C${cx-15} 1872 ${cx+15} 1872 ${cx+37+o} 1879`,2.4)+fill(so,C.c2H)+shade(`M${cx-48+o} 1894L${cx+49+o} 1894C${cx+49+o} 1897 ${cx+47+o} 1899 ${cx+44+o} 1900L${cx-44+o} 1900C${cx-47+o} 1899 ${cx-49+o} 1897 ${cx-48+o} 1894Z`,C.c2S)+line(so,5)+'</g>';
 return s;}
function pelvisArt(){return fill('M378 1040L622 1040C632 1066 638 1092 636 1116C600 1122 540 1126 500 1134C460 1126 400 1122 364 1116C362 1092 368 1066 378 1040Z',C.c3)
 +shade('M596 1028L628 1028C634 1060 638 1090 636 1116C620 1118 606 1120 596 1121C602 1090 600 1060 596 1028Z',C.c3S)
 +line('M378 1040C368 1066 362 1092 364 1116',6)+line('M622 1040C632 1066 638 1092 636 1116',6)+line('M462 1124C480 1128 492 1131 500 1134C508 1131 520 1128 538 1124',4)
 +line('M500 1076C502 1100 502 1120 500 1134',2.6)+line('M500 1078C514 1080 516 1095 515 1112C514 1122 508 1128 502 1131',2,'5 4')+tp([[470,1112],[490,1126]],2.6,'both')+tp([[532,1110],[512,1126]],2.6,'both');}
function torsoArt(){const d='M462 608C428 620 384 638 350 664C356 694 360 718 362 745C366 800 380 860 390 930C392 970 384 1005 380 1035L620 1035C616 1005 608 970 610 930C620 860 634 800 638 745C640 718 644 694 650 664C616 638 572 620 538 608C525 626 475 626 462 608Z';
 let s=fill(d,C.c1)+shade('M598 648C628 660 646 690 638 745C634 800 620 860 610 930C608 970 616 1005 620 1035L586 1035C580 1000 576 962 584 926C594 870 604 800 600 748C597 705 588 672 598 648Z',C.c1S)
 +shade('M384 1020C450 1012 550 1012 616 1020L620 1035L380 1035Z',C.c1S)+tpH([[414,630],[384,644],[358,662]],5,'both',C.c1H)+tpH([[374,780],[384,860],[394,930]],3.5,'both',C.c1H);
 [[[368,760],[392,778],[404,800]],[[632,760],[608,778],[596,800]],[[412,842],[440,858],[468,862]],[[588,842],[560,858],[540,862]],[[400,1006],[430,1018],[452,1022]],[[470,1004],[500,1018],[522,1014]],[[560,1008],[585,1020],[602,1016]],[[392,940],[410,952]],[[608,940],[592,954]]]
  .forEach((p,i)=>{s+=tp(p,i<4?3.4:3,'both');});
 s+=line(d,6);
 const hem='M380 1031L620 1031C623 1046 623 1060 618 1073C540 1080 460 1080 382 1073C377 1060 377 1046 380 1031Z';
 s+=fill(hem,C.c1)+shade('M584 1031L620 1031C623 1046 623 1060 618 1073C606 1074 596 1075 586 1076C588 1062 588 1046 584 1031Z',C.c1S);
 for(let x=392;x<=608;x+=12)s+=tp([[x,1036],[x,1072]],2.4,'both',C.c1S,'lm-shade');
 s+=line(hem,5);return s;}
const collarBack=()=>fill('M454 594C470 585 530 585 546 594L552 616L448 616Z',C.c2S)+line('M454 594C470 585 530 585 546 594',3);
function collarFront(){let s=fill('M446 608C464 650 536 650 554 608L542 603C528 632 472 632 458 603Z',C.c1)+shade('M520 636C536 630 548 620 554 608L542 603C536 616 528 626 516 632Z',C.c1S)+line('M446 608C464 650 536 650 554 608L542 603C528 632 472 632 458 603Z',4);
 for(let i=1;i<8;i++){const t=i/8,x=lerp(452,548,t),yo=608+38*Math.sin(Math.PI*t),yi=605+24*Math.sin(Math.PI*t);s+=tp([[x,yi+1],[x+(x-500)*0.04,yo-1]],2,'both',C.c1S,'lm-shade');}
 s+=g('lanyard',(()=>{let q='';[[[470,630],[488,720],[497,792]],[[530,630],[512,720],[503,792]]].forEach((p,i)=>{const t=tube(p,9,{});q+=fill(t.d,C.c3H)+(i?tubeShade(t,0.35,C.c3):'')+line(t.sides,2.5);});return q;})());
 const cl='M499 624C488 620 470 608 456 595C455 614 461 638 469 657C480 649 492 638 499 624Z';
 s+=shape(cl,C.c2,3.5)+shape(mir(cl),C.c2,3.5)+shade('M501 624C512 620 530 608 544 595C545 614 539 638 531 657C528 640 516 630 501 624Z',C.c2S)+tp([[462,604],[466,630],[470,650]],2.2,'both',C.c2S,'lm-shade');
 s+=`<circle cx="500" cy="633" r="3.5" fill="${C.c2H}"/><circle class="lm-outline" cx="500" cy="633" r="3.5" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
 return s;}
function badgeArt(){return shape('M492 788L508 788L508 806L492 806Z',C.m,3)+shape('M474 804L526 804C529.3 804 532 806.7 532 810L532 890C532 893.3 529.3 896 526 896L474 896C470.7 896 468 893.3 468 890L468 810C468 806.7 470.7 804 474 804Z',C.white,3.5)
 +fill('M468 880L532 880L532 890C532 893.3 529.3 896 526 896L474 896C470.7 896 468 893.3 468 890Z',C.c1H)+line('M468 880L532 880',2)+line('M488 813L512 813',3)+shape('M478 824L500 824L500 850L478 850Z',C.c2,2)
 +shade('M520 804L526 804C529.3 804 532 806.7 532 810L532 880L520 880Z',C.c2S,0.5)
 +`<rect id="slot_badge_name" x="478" y="857" width="44" height="9" fill="none" stroke="none"/><rect id="slot_badge_role" x="478" y="869" width="30" height="7" fill="none" stroke="none"/><rect id="slot_badge_photo" x="478" y="824" width="22" height="26" fill="none" stroke="none"/><circle id="anchor_badge_clip" cx="500" cy="790" r="2" fill="none"/>`;}
// upper arm is flat at the shoulder; the round cap belongs to the torso side (shoulderArt) so any angle 0-170 reads as one silhouette
function upperArmArt(side){const t=tube(X(side,[[360,684],[353,810],[348,952]]),u=>62-7*u,{capEnd:true});
 let s=fill(t.d,C.c1)+tubeShade(t,0.3,C.c1S)+line(t.sides,6)+tpH(X(side,[[332,710],[328,800],[328,900]]),side==='r'?4:0.1,'both',C.c1H);
 [[[[378,918],[368,930],[362,944]],3.4],[[[377,948],[366,954]],3],[[[381,742],[373,762],[370,790]],3]].forEach(([p,w])=>{s+=tp(X(side,p),w,'both');});return s;}
// Deltoid drawn for one upper-arm angle b (right arm; left is mirrored): one smooth contour from the torso's shoulder line into the arm's outer side.
const DELT_BASES=[0,45,90,135,170];
function deltoidAt(side,b){const P0=[360,684],a=b*D2R,ca=Math.cos(a),sa=Math.sin(a),Rv=v=>[P0[0]+v[0]*ca-v[1]*sa,P0[1]+v[0]*sa+v[1]*ca];
 const T0=[418,625],tg=[-0.876,0.482],Q=Rv([-31,74]),Qin=Rv([31,74]),dir=[-sa,ca],k=Math.max(18,0.5*Math.hypot(T0[0]-Q[0],T0[1]-Q[1]));
 const push=p=>{const dx=p[0]-P0[0],dy=p[1]-P0[1],l=Math.hypot(dx,dy)||1;return [p[0]+dx/l*9,p[1]+dy/l*9];};
 const c1=push([T0[0]+tg[0]*k,T0[1]+tg[1]*k]),c2=push([Q[0]-dir[0]*k,Q[1]-dir[1]*k]);
 const curve='M'+P(T0)+'C'+P(c1)+' '+P(c2)+' '+P(Q);
 const inner=[Qin,Rv([31,-2]),Rv([22,-14]),[386,716],[412,648]];
 const S=d=>side==='r'?d:mir(d);
 let s=fill(S(curve+'L'+inner.map(P).join('L')+'Z'),C.c1);
 if(side==='r')s+=tpH([[T0[0]-14,T0[1]+10],[lerp(c1[0],c2[0],0.5)+8,lerp(c1[1],c2[1],0.5)+6],[Q[0]-dir[0]*k*0.4+ca*10,Q[1]-dir[1]*k*0.4+sa*10]],4.5,'both',C.c1H);
 else s+=shade(S('M'+P(T0)+'C'+P(c1)+' '+P(c2)+' '+P(Q)+'L'+P(Rv([-12,74]))+'C'+P(Rv([-12,10]))+' '+P([T0[0]-30,T0[1]+24])+' '+P([T0[0],T0[1]+12])+'Z'),C.c1S);
 return s+line(S(curve),6);}
function shoulderArt(side){return deltoidAt(side,0);}
function upperArmForeArt(side){const t=tube(X(side,[[360,684],[356,775],[352,860]]),u=>62-3*u,{capEnd:true});
 return fill(t.d,C.c1)+tubeShade(t,0.3,C.c1S)+line(t.sides,6)+line(t.capE,6)+tp(X(side,[[336,830],[352,838],[370,831]]),3,'both')+tp(X(side,[[340,846],[354,852]]),2.4,'both')+tpH(X(side,[[334,700],[332,760]]),side==='r'?3.5:0.1,'both',C.c1H);}
function elbowFoldArt(side){let s=fill(XD(side,'M320 924C314 940 314 962 322 976C336 986 362 986 376 976C384 962 384 940 377 924C360 918 336 918 320 924Z'),C.c1);
 s+=shade(XD(side,'M362 921C372 922 376 923 377 924C384 940 384 962 376 976C370 980 364 982 358 983C366 964 366 940 362 921Z'),C.c1S);
 s+=tp(X(side,[[321,921],[315,942],[316,962],[323,977]]),5.5,'both')+tp(X(side,[[376,921],[383,942],[382,962],[375,977]]),5.5,'both')+tp(X(side,[[325,978],[348,986],[373,978]]),3,'both');
 return s+tp(X(side,[[330,940],[346,948],[362,943]]),2.6,'both')+tp(X(side,[[334,962],[352,968]]),2.2,'both')+tp(X(side,[[340,926],[358,930]]),2,'both',C.c1S,'lm-shade');}
function forearmArt(side){const t=tube(X(side,[[347,946],[346,1050],[350,1150]]),u=>u<0.75?56-3*u/0.75:53-7*((u-0.75)/0.25),{capStart:true});
 let s=fill(t.d,C.c1)+tubeShade(t,0.3,C.c1S)+line(t.sides,6);
 [[[326,1108],[338,1118],[350,1120]],[[372,1100],[364,1114]],[[332,1136],[344,1142]]].forEach(p=>{s+=tp(X(side,p),3,'both');});return s;}
function cuffArt(side){const t=tube(X(side,[[350,1144],[350,1188]]),u=>50-3*u,{});let s=fill(t.d,C.c1)+tubeShade(t,0.3,C.c1S);
 for(let o=-16;o<=16;o+=8){s+=tp(X(side,[[350+o,1148],[350+o*0.94,1185]]),2.2,'both',C.c1S,'lm-shade');}return s+line(t.d,4.5);}
function toteArt(S,Gp,inner){const bx=Gp[0]-34,by=Gp[1]+190;let s='';
 const bag=`M${bx-56} ${by}L${bx+56} ${by}C${bx+60} ${by+60} ${bx+64} ${by+130} ${bx+66} ${by+196}L${bx-66} ${by+196}C${bx-64} ${by+130} ${bx-60} ${by+60} ${bx-56} ${by}Z`;
 s+=fill(bag,C.c2)+shade(`M${bx+30} ${by}L${bx+56} ${by}C${bx+60} ${by+60} ${bx+64} ${by+130} ${bx+66} ${by+196}L${bx+38} ${by+196}C${bx+38} ${by+130} ${bx+36} ${by+60} ${bx+30} ${by}Z`,C.c2S)
  +shade(`M${bx-65} ${by+180}L${bx+65} ${by+180}L${bx+66} ${by+196}L${bx-66} ${by+196}Z`,C.c2S)
  +line(`M${bx-54} ${by+22}L${bx+55} ${by+22}`,2.4)+line(`M${bx-52} ${by+12}L${bx+52} ${by+12}`,2.2,'7 6')+line(`M${bx-62} ${by+184}L${bx+62} ${by+184}`,2.2,'7 6')
  +tp([[bx-20,by+40],[bx-26,by+110],[bx-22,by+170]],3,'both')+tp([[bx+18,by+60],[bx+24,by+140]],3,'both')+tp([[bx-40,by+150],[bx-30,by+178]],2.6,'both')+line(bag,6);
 const strap=(a,b,c,d)=>{const t=tube([a,b,c,d],12,{seg:8});return fill(t.d,C.c3)+tubeShade(t,0.35,C.c3S)+line(t.sides,3);};
 s=strap([S[0]-8,S[1]+2],[S[0]+16,S[1]+120],[bx-40,by-140],[bx-34,by+10])+strap([S[0]+4,S[1]-2],[S[0]+30,S[1]+120],[bx+20,by-130],[bx+34,by+10])+s;
 [-34,34].forEach(o=>{s+=shape(`M${bx+o-9} ${by-2}L${bx+o+9} ${by-2}L${bx+o+9} ${by+24}L${bx+o-9} ${by+24}Z`,C.c3,3)+line(`M${bx+o-6} ${by+2}L${bx+o+6} ${by+20}M${bx+o+6} ${by+2}L${bx+o-6} ${by+20}`,1.8);});
 return s+`<circle id="anchor_tote_handle" cx="${r1(Gp[0])}" cy="${r1(Gp[1])}" r="2" fill="none"/>`;}
const POSES={
 rig_neutral:{rot:{upper_arm_r:4,upper_arm_l:-4,forearm_r:-10,forearm_l:10,hand_r:-8,hand_l:8},hands:{r:'relaxed',l:'relaxed'},expr:'neutral'},
 standing_idle:{rot:{torso_lower:3.5,thigh_r:-4,thigh_l:-8,shin_l:3.5,foot_l:-1.5,torso_upper:-5.5,neck:-1,head:5,upper_arm_r:4.5,forearm_r:-11,hand_r:-8,upper_arm_l:1,forearm_l:8,hand_l:8},hands:{r:'relaxed',l:'relaxed'},expr:'attentive',tote:1},
 waving:{rot:{torso_lower:-1.5,thigh_r:1,thigh_l:-1,shin_r:0,torso_upper:2.5,head:-5,upper_arm_r:26,forearm_r:128,hand_r:-4,upper_arm_l:-1,forearm_l:7,hand_l:6},hands:{r:'wave',l:'relaxed'},expr:'smile'},
 pointing_screen_right:{rot:{torso_lower:-2,thigh_r:2.5,thigh_l:1,shin_l:-2,torso_upper:4,head:-3,upper_arm_l:-58,forearm_l:-40,hand_l:-4,upper_arm_r:2,forearm_r:-9,hand_r:-7},hands:{r:'relaxed',l:'point'},handMirror:{l:false},expr:{eyes:{open:1,look:[1,0]},brow:'soft',mouth:{w:22,lift:3.5,uT:5.5,lT:8.5}}},
 presenting_open_palm:{rot:{torso_lower:1.5,thigh_r:-2.5,thigh_l:-4,shin_l:3,torso_upper:-3.5,head:5,upper_arm_r:22,forearm_r:84,hand_r:-30,upper_arm_l:-1,forearm_l:7,hand_l:6},hands:{r:'palm_up_offer',l:'relaxed'},expr:{eyes:{open:0.92,squint:0.15,look:[-0.8,0]},brow:'soft',mouth:'smile_talk',lines:0.5}}};
function figure(name){const pose=POSES[name],rot=pose.rot;
 let W=fk(rot,[0,0]);const sole=['r','l'].flatMap(s=>{const cx=s==='r'?434:566;return [[cx-45,1900],[cx+45,1900]].map(p=>app(W['foot_'+s],p)[1]);});
 const dy=r1(1900-Math.max(...sole));W=fk(rot,[0,dy]);
 const pv=n=>RIG[n].p.join(' ');
 const G=(n,inner)=>`<g id="${n}" data-pivot="${pv(n)}"${rot[n]?` transform="rotate(${rot[n]} ${pv(n)})"`:''}>${inner}</g>`;
 const handG=(s)=>{const pose=pose_h(s),H=HP[pose],palm=!!(H&&H.palm);let mirror=(s==='l')!==palm;if(pose_m(s)!==undefined)mirror=pose_m(s);
  return G('hand_'+s,`<g transform="translate(${s==='r'?350:650} 1186)${mirror?' scale(-1.14 1.14)':' scale(1.14)'}">${handArt(pose,{shadeX:mirror?-1:1})}</g>`);};
 const pose_h=s=>pose.hands[s],pose_m=s=>pose.handMirror?pose.handMirror[s]:undefined;
 const arm=s=>G('upper_arm_'+s,upperArmArt(s)+G('forearm_'+s,forearmArt(s)+handG(s)+cuffArt(s)));
 const leg=s=>G('thigh_'+s,thighArt(s)+G('shin_'+s,G('foot_'+s,footArt(s))+shinArt(s)));
 let tote='';
 if(pose.tote){const S=app(W.torso_upper,[590,634]);const gp=[S[0]+160,S[1]+180];
  const Mi=inv(W.torso_upper);tote=`<g id="tote" data-pivot="590 634" transform="matrix(${Mi.map(v=>r1(v*1000)/1000).join(' ')})">${toteArt(S,gp)}</g>`;}
 const body=G('torso_lower',leg('r')+leg('l')+pelvisArt()+G('torso_upper',torsoArt()+collarBack()+tote+G('neck',neckArt()+G('head',headArt(typeof pose.expr==='string'?EXPR[pose.expr]:pose.expr)))+collarFront()+g('badge',badgeArt(),' data-pivot="500 790"')+arm('r')+arm('l')));
 const A=(id,p)=>`<circle id="anchor_${id}" cx="${r1(p[0])}" cy="${r1(p[1])}" r="2" fill="none"/>`;
 const grip=s=>{const H=HP[pose.hands[s]];let mirror=(s==='l')!==!!(H&&H.palm);if(pose_m(s)!==undefined)mirror=pose_m(s);const gy=['fist','thumb_up'].includes(pose.hands[s])?62:96;return app(W['hand_'+s],[(s==='r'?350:650),1186+gy]);};
 const anchors=g('anchors',A('feet',[500,1900])+A('foot_r',app(W.foot_r,[434,1900]))+A('foot_l',app(W.foot_l,[566,1900]))+A('grip_r',grip('r'))+A('grip_l',grip('l'))
  +A('head_top',app(W.head,[500,128]))+A('eye_line',app(W.head,[500,463]))+A('mouth',app(W.head,[500,551]))+A('seat',app(W.torso_lower,[500,1110]))+A('chest',app(W.torso_upper,[500,760])));
 return {svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${name==='rig_neutral'||name==='standing_idle'?'0 0 1000 2000':'-300 0 1600 2000'}" width="${name==='rig_neutral'||name==='standing_idle'?1000:1600}" height="2000"><g id="maya_story_${name}" data-character="maya" data-treatment="story" data-view="front"><g id="root" transform="translate(0 ${dy})">${body}</g>${anchors}</g></svg>`,W,dy};}

// ---------------- SHEETS ----------------
function faceKit(){const cells=[];let y=60;
 const cell=(id,x,y,s,crop,inner,ref)=>`<g id="layout_${id}" transform="translate(${x} ${y}) scale(${s}) translate(${-crop[0]} ${-crop[1]})"><rect class="kit_backdrop" x="${crop[0]}" y="${crop[1]}" width="${crop[2]}" height="${crop[3]}" fill="${C.skin}"/>${ref||''}<g id="${id}">${inner}</g></g>`;
 const eyes={open:{open:1},half:{open:0.5},closed:{closed:'relaxed'},wide:{open:1.3},squint:{open:0.7,squint:0.6}};
 Object.entries(eyes).forEach(([k,st],i)=>cells.push(cell('eyes_'+k,60+i*384,y,1.8,[410,410,180,90],eye(459,463,-1,st)+eye(541,463,1,st))));
 y+=230;
 const brows={neutral:['neutral','neutral'],raised:['raised','raised'],frown:['frown','frown'],worried:['worried','worried'],one_up:['raised','neutral']};
 Object.entries(brows).forEach(([k,b],i)=>cells.push(cell('brows_'+k,60+i*384,y,1.8,[410,400,180,100],brow(459,463,-1,b[0])+brow(541,463,1,b[1]),`<g class="kit_ref" opacity="0.35">${eye(459,463,-1,{})+eye(541,463,1,{})}</g>`)));
 y+=250;
 Object.entries(MO).forEach(([k,m],i)=>cells.push(cell('mouth_'+(k==='rest'?'rest_m_b_p':k),40+i*216,y,2.5,[464,522,72,62],mouth(500,551,m).svg)));
 y+=210;
 Object.keys(EXPR).filter(k=>k!=='attentive').forEach((k,i)=>{const cx=60+(i%6)*318,cy=y+Math.floor(i/6)*540;
  cells.push(`<g id="layout_expr_${k}" transform="translate(${cx} ${cy}) scale(1) translate(-370 -120)"><g id="expr_${k}">${neckArt()+headArt(EXPR[k],{noHairBack:1})}</g></g>`);});
 const nF=cells.length-12;return {features:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 780" width="2000" height="780"><g id="maya_story_face_features" data-space="head">${cells.slice(0,nF).join('')}</g></svg>`,expressions:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 780 2000 1100" width="2000" height="1100"><g id="maya_story_face_expressions" data-space="head">${cells.slice(nF).join('')}</g></svg>`};}
const HAND_ROT={relaxed:0,open:180,point:-90,thumb_up:-90,fist:180,pinch:160,holding_phone:180,holding_cup:180,holding_paper:180,holding_pen:165,typing:0,count_1:180,count_2:180,count_3:180,count_4:180,count_5:180,ok:180,wave:180,palm_up_offer:-120,palm_out_stop:180};
function handSheet(side){let s='';const keys=Object.keys(HP);
 [side].forEach((side,si)=>keys.forEach((k,i)=>{const col=i%10,row=Math.floor(i/10),x=100+col*190,y=150+row*270;const H=HP[k];let mirror=(side==='l')!==!!H.palm;
  const rot=side==='l'?-HAND_ROT[k]:HAND_ROT[k];
  s+=`<g id="layout_hand_${side}_${k}" transform="translate(${x} ${y}) rotate(${rot}) translate(0 -60)"><g id="hand_${side}_${k}" data-pivot="0 0"${mirror?' transform="scale(-1 1)"':''}>${handArt(k,{shadeX:mirror?-1:1})}</g></g>`;}));
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 600" width="2000" height="600"><g id="maya_story_hands_${side}" data-space="hand">${s}</g></svg>`;}
function build(){const out={};Object.keys(POSES).forEach(k=>{out['maya_story_pose_'+k+'.svg']=figure(k).svg;});
 const fk=faceKit();out['maya_story_face_features.svg']=fk.features;out['maya_story_face_expressions.svg']=fk.expressions;out['maya_story_hands_r.svg']=handSheet('r');out['maya_story_hands_l.svg']=handSheet('l');return out;}
const CAST={'#F2C7A5':'#9C6644','#D9A784':'#7E4E31','#FBE3CF':'#B98463','#C98E70':'#5F3722','#3B2A20':'#1F1712','#24180F':'#0E0A07','#6A4A36':'#43322A',
 '#4A6A8A':'#4A2E1C','#1A1A1A':'#140C08','#B8645A':'#7C3B33','#E8998A':'#C4705E','#2F4A7A':'#C2913A','#22365C':'#9C7128','#4A6AA0':'#DDB15C',
 '#D8D2C4':'#ECE8DE','#B8B0A0':'#C9C2B2','#F0ECE2':'#FAF8F3','#5A4636':'#6E6A4C','#3E3024':'#545036','#7A6250':'#8B8763','#9AA0A6':'#C8A24C','#6E747A':'#9C7C30','#D0D4D8':'#E9CF7E'};
const recast=svg=>svg.replace(/#[0-9A-F]{6}/g,h=>CAST[h]||h);

// ---------------- PARTS (one file per part; every part lives in the shared 1000×2000 figure grid, viewBox = crop) ----------------
function thighSeatedArt(side){const t=tube(X(side,[[437,1096],[438,1150],[440,1196]]),u=>126-8*u,{capStart:true,capEnd:true});
 return fill(t.d,C.c3)+tubeShade(t,0.3,C.c3S)+line(t.d,6)+tp(X(side,[[392,1126],[436,1140],[478,1132]]),2.6,'both')+tp(X(side,[[470,1198],[456,1214]]),3,'both')+tpH(X(side,[[404,1206],[436,1226],[466,1216]]),5,'both',C.c3H);}
const BS={field2:'#E9E6DF',surface:'#F4F1EA',surface2:'#D9D4C8',muted:'#8E8A80',line:'#5B5850',ink:'#101010'};
function chairArt(){let s='';const back='M352 904C352 884 368 872 390 872L610 872C632 872 648 884 648 904L656 1262C656 1282 642 1294 622 1294L378 1294C358 1294 344 1282 344 1262Z';
 s+=fill(back,BS.surface)+shade('M604 872L610 872C632 872 648 884 648 904L656 1262C656 1282 642 1294 622 1294L612 1294C618 1180 616 1000 604 872Z',BS.surface2)+line(back,6);
 s+=shape('M488 1294L512 1294L512 1396L488 1396Z',BS.muted,4)+shape('M486 1460L514 1460L514 1772L486 1772Z',BS.muted,5)+shade('M502 1462L512 1462L512 1770L502 1770Z',BS.line);
 [[372,1862],[628,1862],[500,1868]].forEach(e=>{const t=tube([[500,1772],e],20,{capStart:true,capEnd:true,seg:4});s+=fill(t.d,BS.muted)+tubeShade(t,0.3,BS.line)+line(t.d,4.5);});
 [[372,1882],[628,1882],[500,1884]].forEach(([x,y])=>{s+='<circle cx="'+x+'" cy="'+y+'" r="16" fill="'+BS.line+'"/><circle class="lm-outline" cx="'+x+'" cy="'+y+'" r="16" fill="none" stroke="'+BS.ink+'" stroke-width="4"/>';});
 const seat='M300 1408C300 1396 312 1388 328 1388L672 1388C688 1388 700 1396 700 1408L704 1446C704 1458 694 1466 680 1466L320 1466C306 1466 296 1458 296 1446Z';
 return s+fill(seat,BS.surface)+shade('M298 1440L702 1440L704 1446C704 1458 694 1466 680 1466L320 1466C306 1466 296 1458 296 1446Z',BS.surface2)+line(seat,6);}
function deskArt(){let s='';[[176,1250],[794,1250]].forEach(([x,y])=>{s+=shape('M'+x+' '+y+'L'+(x+30)+' '+y+'L'+(x+30)+' 1900L'+x+' 1900Z',BS.muted,5)+shade('M'+(x+18)+' '+y+'L'+(x+30)+' '+y+'L'+(x+30)+' 1900L'+(x+18)+' 1900Z',BS.line);});
 s+=shape('M190 1250L810 1250L810 1560L190 1560Z',BS.surface2,5)+shade('M190 1520L810 1520L810 1560L190 1560Z',BS.muted)+line('M210 1276L790 1276',2.2);
 return s+shape('M146 1222L854 1222C860 1222 862 1226 862 1232L862 1246C862 1250 858 1252 854 1252L146 1252C142 1252 138 1250 138 1246L138 1232C138 1226 140 1222 146 1222Z',BS.surface,5)+shade('M140 1240L860 1240L860 1246C860 1250 857 1252 854 1252L146 1252C143 1252 140 1250 140 1246Z',BS.surface2);}
function laptopArt(){return shape('M398 1224L602 1224L594 1078L406 1078Z',BS.surface2,5)+shade('M572 1078L594 1078L602 1224L578 1224Z',BS.muted)+'<circle cx="500" cy="1146" r="11" fill="'+BS.muted+'"/>'+shape('M376 1222L624 1222L630 1232L370 1232Z',BS.muted,4);}
const AN=(n,p)=>'<circle id="anchor_'+n+'" cx="'+r1(p[0])+'" cy="'+r1(p[1])+'" r="2" fill="none"/>';
function handPart(s,pose,mirror){const H=HP[pose],palm=!!H.palm;if(mirror===undefined)mirror=(s==='l')!==palm;const cx=s==='r'?350:650,sx=mirror?-1.14:1.14;
 let art=handArt(pose,{shadeX:mirror?-1:1}),grip=[cx,1186+96*1.14];
 art=art.replace(/<circle id="anchor_grip" cx="([-\d.]+)" cy="([-\d.]+)"[^>]*\/>/,(m,x,y)=>{grip=[cx+sx*parseFloat(x),1186+1.14*parseFloat(y)];return '';});
 return {art:'<g transform="translate('+cx+' 1186) scale('+sx+' 1.14)">'+art+'</g>',grip};}
const Z={chair:0,desk_side:5,thigh_r:10,foot_r:20,shin_r:30,thigh_r_seated:35,thigh_l:40,foot_l:50,shin_l:60,thigh_l_seated:65,pelvis:70,torso:80,tote:85,neck:90,hair_back:100,head:110,face:120,brow_l:120,brow_r:121,eye_l:122,eye_r:123,mouth:124,earring_l:130,earring_r:131,collar:140,badge:150,desk:152,upper_arm_r:160,deltoid_r:165,forearm_r:170,elbow_fold_r:175,hand_r:180,cuff_r:190,upper_arm_l:200,deltoid_l:205,forearm_l:210,elbow_fold_l:215,hand_l:220,cuff_l:230,laptop:240};
const VIS={rest:'MBP',a_i:'AI',e:'E',o:'O',u:'U',f_v:'FV',l:'L',w_q:'WQ',smile_talk:'smile_talk'};
const EYES={open:{open:1},half:{open:0.5},closed:{closed:'relaxed'},wide:{open:1.32},squint:{open:0.7,squint:0.6,lower:0.4}};
const BROWST={neutral:['neutral','neutral'],raised:['raised','raised'],frown:['frown','frown'],worried:['worried','worried'],one_up:['arched_high','skeptic_down']};
const norm=a=>((a%360)+540)%360-180;
function fkO(rot,off,root){const W={root:[1,0,0,1,root[0],root[1]]};const get=n=>{if(W[n])return W[n];const R=RIG[n],o=off[n]||[0,0];W[n]=mul(get(R.u),mul([1,0,0,1,o[0],o[1]],rotA(rot[n]||0,R.p[0],R.p[1])));return W[n];};Object.keys(RIG).forEach(get);return W;}
const FORE_OFF={r:[4,-90],l:[-4,-90]};
function poseOff(P){const off=Object.assign({},P.off||{});['r','l'].forEach(s=>{const A=(P.arm||{})[s];if(A&&A.fore)off['forearm_'+s]=FORE_OFF[s];});return off;}
function solvePose(P){const rot=Object.assign({},P.rot||{}),off=poseOff(P),W0=fkO(rot,off,[0,0]),par=(rot.torso_lower||0)+(rot.torso_upper||0);
 ['r','l'].forEach(s=>{const A=(P.arm||{})[s];if(!A)return;if(A.rot){rot['upper_arm_'+s]=A.rot[0];rot['forearm_'+s]=A.rot[1];rot['hand_'+s]=A.rot[2];return;}
  const S0=RIG['upper_arm_'+s].p,Eo=off['forearm_'+s]||[0,0],E0=[RIG['forearm_'+s].p[0]+Eo[0],RIG['forearm_'+s].p[1]+Eo[1]],H0=[RIG['hand_'+s].p[0]+Eo[0],RIG['hand_'+s].p[1]+Eo[1]],Sp=app(W0.torso_upper,S0);
  const a0u=Math.atan2(E0[1]-S0[1],E0[0]-S0[0]),a0f=Math.atan2(H0[1]-E0[1],H0[0]-E0[0]),L1=Math.hypot(E0[0]-S0[0],E0[1]-S0[1]),L2=Math.hypot(H0[0]-E0[0],H0[1]-E0[1]);
  const T=A.at?app(W0[A.at[0]],A.at[1]):A.to,dx=T[0]-Sp[0],dy=T[1]-Sp[1],dc=Math.min(L1+L2-2,Math.max(Math.abs(L1-L2)+2,Math.hypot(dx,dy)));
  const aa=Math.acos(Math.max(-1,Math.min(1,(L1*L1+dc*dc-L2*L2)/(2*L1*dc)))),bs=Math.atan2(dy,dx),outX=b=>Math.abs(Sp[0]+L1*Math.cos(bs+b*aa)-500),lowY=b=>Sp[1]+L1*Math.sin(bs+b*aa),bend=A.bend==='out'?(outX(1)>outX(-1)?1:-1):(A.bend==='low'||!A.bend?(lowY(1)>lowY(-1)?1:-1):A.bend),A1=bs+bend*aa,El=[Sp[0]+L1*Math.cos(A1),Sp[1]+L1*Math.sin(A1)],A2=Math.atan2(T[1]-El[1],T[0]-El[0]);
  const Ru=(A1-a0u)/D2R,Rf=(A2-a0f)/D2R;rot['upper_arm_'+s]=norm(Ru-par);rot['forearm_'+s]=norm(Rf-Ru);const wl=A.wrist??18,cl=v=>Math.max(-wl,Math.min(wl,v));rot['hand_'+s]=cl(A.hand!=null?norm(A.hand-Rf):(A.hr||0));});
 return rot;}
const SIT={rot:{thigh_r:5,thigh_l:-5,shin_r:4,shin_l:-4,foot_r:-9,foot_l:9},off:{shin_r:[8,-280],shin_l:[-8,-280]}};
const sit=o=>Object.assign({},o,{rot:Object.assign({},SIT.rot,o.rot),off:Object.assign({},SIT.off,o.off),legs:'seated'});
const POSE3={
 stand:{label:'idle · weight on her right leg, left knee eased, hips and shoulders counter-tilted',rot:{torso_lower:4,thigh_r:-6,thigh_l:5,shin_l:-11,foot_l:5,torso_upper:-8,neck:1.5,head:7},off:{shin_l:[0,-8]},arm:{r:{rot:[3,-5,-4]},l:{rot:[-4,18,8]}},hands:{r:'relaxed',l:'relaxed'},expr:'attentive',props:['tote']},
 point:{label:'pointing screen right · lean and weight into the point, eyes on target',rot:{torso_lower:-3,thigh_r:-2,thigh_l:4,shin_r:8,foot_r:-3,torso_upper:6,neck:2,head:4},arm:{l:{to:[1135,600],bend:'out',hr:0},r:{rot:[4,-12,-6]}},hands:{r:'relaxed',l:'point_raised'},expr:'listening'},
 sit:sit({label:'sitting · hands on knees, head tilted',rot:{torso_upper:-1.5,neck:-1,head:5},arm:{r:{rot:[-3,-6,4]},l:{rot:[3,6,-4]}},hands:{r:'relaxed',l:'relaxed'},expr:'attentive',props:['chair']}),
 waving:{label:'waving · weight on her left leg, body leans away from the wave, head tilts in',rot:{torso_lower:-3,thigh_r:-3,thigh_l:4,shin_r:9,foot_r:-3,torso_upper:7,neck:-2,head:-6},arm:{r:{to:[250,470],bend:'out',hand:172},l:{rot:[-2,10,6]}},hands:{r:'wave',l:'relaxed'},expr:'smile'},
 presenting:{label:'presenting · open palm to screen left, counter-lean, weight on right leg',rot:{torso_lower:3,thigh_r:-5,thigh_l:5,shin_l:-10,torso_upper:-7,neck:-2,head:-4},off:{shin_l:[0,-6]},arm:{r:{to:[150,960],bend:'low',hr:12},l:{rot:[-3,14,6]}},hands:{r:'palm_up_offer',l:'relaxed'},expr:'smile'},
 sit_typing:sit({label:'sitting at a desk, typing · head down to the screen',rot:{torso_upper:-1,neck:1,head:3},arm:{r:{to:[455,870],hand:-50},l:{to:[545,870],hand:50}},hands:{r:'typing',l:'typing'},expr:'focus',props:['chair','desk','laptop']}),
 thinking:{label:'thinking · finger to chin, other arm across the waist, weight back',rot:{torso_lower:-3,thigh_r:-3,thigh_l:4,shin_r:9,torso_upper:4,neck:-3,head:-6},arm:{l:{to:[425,935],hand:80},r:{at:['head',[414,708]],hr:0}},hands:{r:'point',l:'relaxed'},expr:'focus'},
 on_phone:{label:'on the phone · head tilts to the call, elbow tucked, free hand on hip',rot:{torso_lower:3,thigh_r:-5,thigh_l:5,shin_l:-10,torso_upper:-6,neck:-3,head:-8},arm:{r:{at:['head',[364,592]],fore:1,hr:-4},l:{to:[642,1020],bend:'out',hand:-50}},hands:{r:'holding_phone',l:'fist'},expr:'listening'},
 shrugging:{label:'shrugging · shoulders up, palms up, head tipped',rot:{torso_lower:2,thigh_r:-4,thigh_l:4,shin_l:-8,torso_upper:-3,neck:-4,head:-9},off:{neck:[0,12]},arm:{r:{to:[150,930],bend:'low',hr:14},l:{to:[850,930],bend:'low',hr:-14}},hands:{r:'palm_up_offer',l:'palm_up_offer'},expr:'doubt'},
 arms_crossed:{label:'arms crossed · weight on her left leg, chin up',rot:{torso_lower:-3,thigh_r:-3,thigh_l:5,shin_r:7,torso_upper:4,neck:-2,head:-3},arm:{r:{to:[588,912],hand:-80},l:{to:[412,890],hand:80}},hands:{r:'fist',l:'fist'},expr:'pride'},
 hand_on_chin:{label:'hand on chin · chin rests on the fist, elbow on the other arm',rot:{torso_lower:2,thigh_r:-4,thigh_l:4,shin_l:-9,torso_upper:-3,neck:2,head:6},arm:{l:{to:[405,968],hand:80},r:{at:['head',[458,664]],fore:1,hr:0}},hands:{r:'fist',l:'relaxed'},expr:'listening'},
 cheering:{label:'cheering · both fists up, chest open, head back',rot:{thigh_r:-4,thigh_l:4,head:-3},arm:{r:{to:[290,330],bend:'out',hand:175},l:{to:[710,330],bend:'out',hand:-175}},hands:{r:'fist',l:'fist'},expr:'laugh'},
 worried:{label:'worried · knees in, hands clasped at the chest, head down',rot:{torso_lower:-2,thigh_r:3,thigh_l:-3,shin_r:-6,shin_l:6,torso_upper:2,neck:3,head:7},off:{neck:[0,10]},arm:{r:{to:[478,830],hand:175},l:{to:[522,840],hand:-175}},hands:{r:'relaxed',l:'relaxed'},expr:'concern'},
 talking_hands:{label:'talking with her hands · palm up and open hand, counter-tilt',rot:{torso_lower:3,thigh_r:-5,thigh_l:5,shin_l:-10,torso_upper:-6,neck:-1,head:-5},arm:{r:{to:[170,960],bend:'low',hr:10},l:{to:[800,860],bend:'low',hr:-12}},hands:{r:'palm_up_offer',l:'open'},expr:'smile'},
 handing_document:{label:'handing a document · reaching to screen left, weight forward',rot:{torso_lower:-2,thigh_r:-2,thigh_l:5,shin_r:8,torso_upper:-6,neck:-2,head:-5},arm:{r:{to:[175,840],bend:'low',hand:85},l:{rot:[-2,10,6]}},hands:{r:'holding_paper',l:'relaxed'},expr:'smile'},
 leaning:{label:'leaning on a desk · hip out, hand planted, other hand on hip',dx:-30,rot:{torso_lower:-6,thigh_r:-8,thigh_l:4,shin_r:6,torso_upper:9,neck:-3,head:-6},arm:{l:{to:[748,1222],hand:-10},r:{to:[352,1030],bend:'out',hand:40}},hands:{r:'fist',l:'open'},expr:'listening',props:[['desk',{at:[470,0],z:5}]]},
 listening_nodding:{label:'listening, nodding · head dipped, hands loosely clasped low',rot:{torso_lower:3,thigh_r:-5,thigh_l:5,shin_l:-10,torso_upper:-5,neck:4,head:8},arm:{r:{to:[470,1120],hand:-30},l:{to:[530,1125],hand:30}},hands:{r:'relaxed',l:'relaxed'},expr:'listening'},
 coffee:{label:'coffee · cup held low at her side, eyes closed, weight on right leg',rot:{torso_lower:3,thigh_r:-5,thigh_l:6,shin_l:-11,torso_upper:-7,neck:1,head:5},off:{shin_l:[0,-6]},arm:{r:{to:[440,1150],hr:18},l:{rot:[-3,12,6]}},hands:{r:'holding_cup',l:'relaxed'},expr:'relief'},
 thumbs_up:{label:'thumbs up · arm out at shoulder height, lean in',rot:{torso_lower:-3,thigh_r:-3,thigh_l:4,shin_r:8,torso_upper:5,neck:-2,head:-5},arm:{r:{to:[425,770],hr:0},l:{rot:[-2,10,6]}},hands:{r:'thumb_up',l:'relaxed'},expr:'smile'}};
function poseWorld(p){const rot=solvePose(p),off=poseOff(p),W0=fkO(rot,off,[0,0]);const sole=['r','l'].flatMap(s=>{const cx=RIG['foot_'+s].p[0];return [[cx-45,1900],[cx+45,1900]].map(q=>app(W0['foot_'+s],q)[1]);});
 const dy=r1(1900-Math.max(...sole));return {W:fkO(rot,off,[p.dx||0,dy]),dy,rot};}
function partDefs(){const hp=headPieces(EXPR.attentive),D=[],Rp=n=>RIG[n].p;const add=o=>{o.z=o.z??Z[o.id]??Z[o.part];o.view=o.view||'front';D.push(o);};
 add({id:'pelvis',link:'torso_lower',parent:null,pivot:Rp('torso_lower'),art:pelvisArt(),anchors:{waist:[500,1000],hip_r:Rp('thigh_r'),hip_l:Rp('thigh_l'),seat:[500,1110]},desc:'Pelvis and chino waistband with fly; root of the rig.'});
 add({id:'torso',link:'torso_upper',parent:'pelvis',pivot:Rp('torso_upper'),art:torsoArt()+collarBack(),anchors:{waist:[500,1000],neck_base:[500,624],shoulder_r:Rp('upper_arm_r'),shoulder_l:Rp('upper_arm_l'),chest:[500,760],badge:[500,790]},desc:'Knit sweater body with ribbed hem and the back of the shirt collar. Draws above the thighs.'});
 add({id:'neck',link:'neck',parent:'torso',pivot:Rp('neck'),art:neckArt(),anchors:{neck_base:[500,624],neck:Rp('head')},desc:'Neck with under-chin shadow.'});
 add({id:'hair_back',link:'head',parent:'head',pivot:[500,330],art:puffArt(0),anchors:{hair:[500,330]},desc:'Curly puff built from 12 directional clumps over a shade layer, top-left highlight band and three loose curls.'});
 add({id:'head',link:'head',parent:'neck',pivot:Rp('head'),art:hp.ears+hp.skin+hp.blush+hp.nose+hp.hairFront,anchors:{neck:Rp('head'),head_top:[500,128],hair:[500,330],brow_l:[457,425],brow_r:[543,425],eye_l:[459,463],eye_r:[541,463],eye_line:[500,463],mouth:[500,551],ear_l:[406,516],ear_r:[594,516]},desc:'Face, ears, nose, blush and front hairline with scrunchie; features mount on its anchors.'});
 [['l',-1,459,457],['r',1,541,543]].forEach(([s,sd,ex,bx])=>{
  add({id:'eye_'+s,link:'head',parent:'head',pivot:[ex,463],art:eye(ex,463,sd,EXPR.attentive.eyes),anchors:{['eye_'+s]:[ex,463]},desc:(s==='l'?'Left':'Right')+' eye (viewer side), attentive rest.'});
  Object.entries(EYES).forEach(([k,st])=>add({id:'eye_'+s+'_'+k,part:'eye_'+s,variant:k,link:'head',parent:'head',pivot:[ex,463],art:eye(ex,463,sd,st),anchors:{['eye_'+s]:[ex,463]},desc:'Eye state '+k+'.'}));
  add({id:'brow_'+s,link:'head',parent:'head',pivot:[bx,425],art:brow(ex,463,sd,'soft'),anchors:{['brow_'+s]:[bx,425]},desc:'Brow, soft rest shape.'});
  Object.entries(BROWST).forEach(([k,pr])=>add({id:'brow_'+s+'_'+k,part:'brow_'+s,variant:k,link:'head',parent:'head',pivot:[bx,425],art:brow(ex,463,sd,pr[s==='l'?0:1]),anchors:{['brow_'+s]:[bx,425]},desc:'Brow state '+k+(k==='one_up'?' (left arches high, right drops skeptical; use as a pair)':'')+'.'}));});
 add({id:'mouth',link:'head',parent:'head',pivot:[500,551],art:hp.jaw,anchors:{mouth:[500,551]},desc:'Closed attentive mouth; default.'});
 Object.keys(MO).forEach(k=>add({id:'mouth_'+VIS[k],part:'mouth',variant:VIS[k],link:'head',parent:'head',pivot:[500,551],art:mouth(500,551,MO[k]).svg,anchors:{mouth:[500,551]},desc:'Lip-sync viseme '+VIS[k]+'.'}));
 BIBLE.forEach(k=>{const ex=EXPR[k],m=Object.assign({},typeof ex.mouth==='string'?MO[ex.mouth]:ex.mouth);const mo=mouth(500,551,m);let j=mo.svg;
  if(ex.lines){const c=mo.corner,cR=mo.cornerR;j+=tpS([[485,514],[c[0]-8,c[1]-14],[c[0]-6,c[1]+4]],2.6*ex.lines+0.4,'both')+tpS([[515,514],[cR[0]+8,cR[1]-14],[cR[0]+6,cR[1]+4]],2.6*ex.lines+0.4,'both');}
  add({id:'mouth_'+k,part:'mouth',variant:k,link:'head',parent:'head',pivot:[500,551],art:j,anchors:{mouth:[500,551]},desc:'Expression mouth '+k+' with its cheek lines.'});
  const p=headPieces(Object.assign({},ex,{mouth:Object.assign({},m,{jaw:0})}));
  add({id:'face_'+k,part:'face',variant:k,link:'head',parent:'head',pivot:[500,463],art:p.blush+g('brow_l',p.browL)+g('brow_r',p.browR)+g('eye_l',p.eyeL)+g('eye_r',p.eyeR)+g('mouth',p.jaw),anchors:{eye_line:[500,463]},desc:'Expression '+k+' as one swap (brows, lids, cheeks, mouth); replaces brow_l, brow_r, eye_l, eye_r and mouth.'});});
 add({id:'earring_l',link:'head',parent:'head',pivot:[406,516],art:hp.earL,anchors:{ear_l:[406,516]},desc:'Left gold hoop; pivot at the lobe for swing.'});
 add({id:'earring_r',link:'head',parent:'head',pivot:[594,516],art:hp.earR,anchors:{ear_r:[594,516]},desc:'Right gold hoop; pivot at the lobe for swing.'});
 add({id:'collar',link:'torso_upper',parent:'torso',pivot:[500,624],art:collarFront(),anchors:{neck_base:[500,624],lanyard:[500,790]},desc:'Sweater neckline, shirt collar points and lanyard; drawn over the neck.'});
 add({id:'badge',link:'torso_upper',parent:'collar',pivot:[500,790],art:badgeArt(),anchors:{},desc:'ID badge with photo, name and role slots; hangs from the lanyard.'});
 ['r','l'].forEach(s=>{const L=s==='l',S=L?'Left':'Right',xx=v=>L?1000-v:v;
  DELT_BASES.forEach(b=>{const ang=L?-b:b;add({id:'deltoid_'+s+(b?'_'+b:''),part:'deltoid_'+s,variant:b?String(b):undefined,link:'torso_upper',parent:'torso',follow:{part:'upper_arm_'+s,ratio:0.5,angle:ang},pivot:Rp('upper_arm_'+s),art:deltoidAt(s,b),anchors:{['shoulder_'+s]:Rp('upper_arm_'+s)},desc:S+' sweater shoulder drawn for an upper-arm angle of '+ang+'°. Owned by the torso; pick the variant nearest the arm angle and turn it by half the difference (follow).'});});
  add({id:'upper_arm_'+s+'_foreshort',part:'upper_arm_'+s,variant:'foreshort',link:'upper_arm_'+s,parent:'torso',pivot:Rp('upper_arm_'+s),art:upperArmForeArt(s),anchors:{['shoulder_'+s]:Rp('upper_arm_'+s),['elbow_'+s]:[xx(352),860]},desc:S+' upper arm foreshortened toward camera (elbow forward), for hand-to-face poses; the forearm mounts at its elbow anchor.'});
  add({id:'elbow_fold_'+s+'_foreshort',part:'elbow_fold_'+s,variant:'foreshort',link:'upper_arm_'+s,parent:'upper_arm_'+s,pivot:[xx(352),860],art:'<g transform="translate('+(L?-4:4)+' -90)">'+elbowFoldArt(s)+'</g>',anchors:{['elbow_'+s]:[xx(352),860]},desc:S+' sleeve fold for the foreshortened elbow.'});
  add({id:'upper_arm_'+s,link:'upper_arm_'+s,parent:'torso',pivot:Rp('upper_arm_'+s),art:upperArmArt(s),anchors:{['shoulder_'+s]:Rp('upper_arm_'+s),['elbow_'+s]:Rp('forearm_'+s)},desc:S+' upper arm; root is a plain rounded cap hidden under the deltoid.'});
  add({id:'elbow_fold_'+s,link:'upper_arm_'+s,parent:'upper_arm_'+s,pivot:Rp('forearm_'+s),art:elbowFoldArt(s),anchors:{['elbow_'+s]:Rp('forearm_'+s)},desc:S+' sleeve fold at the elbow; rides on the upper arm and overlaps the forearm root.'});
  add({id:'forearm_'+s,link:'forearm_'+s,parent:'upper_arm_'+s,pivot:Rp('forearm_'+s),art:forearmArt(s),anchors:{['elbow_'+s]:Rp('forearm_'+s),['wrist_'+s]:Rp('hand_'+s)},desc:S+' forearm, sweater sleeve.'});
  add({id:'cuff_'+s,link:'forearm_'+s,parent:'forearm_'+s,pivot:Rp('hand_'+s),art:cuffArt(s),anchors:{['wrist_'+s]:Rp('hand_'+s)},desc:S+' ribbed cuff; draws above the hand to hide the wrist join.'});
  add({id:'thigh_'+s,link:'thigh_'+s,parent:'pelvis',pivot:Rp('thigh_'+s),art:thighArt(s),anchors:{['hip_'+s]:Rp('thigh_'+s),['knee_'+s]:Rp('shin_'+s)},desc:S+' thigh, chinos, standing length.'});
  add({id:'thigh_'+s+'_seated',part:'thigh_'+s,variant:'seated',link:'thigh_'+s,parent:'pelvis',pivot:Rp('thigh_'+s),art:thighSeatedArt(s),anchors:{['hip_'+s]:Rp('thigh_'+s),['knee_'+s]:[xx(440),1220]},desc:S+' thigh foreshortened for sitting; draws above the shin, which mounts at its knee.'});
  add({id:'shin_'+s,link:'shin_'+s,parent:'thigh_'+s,pivot:Rp('shin_'+s),art:shinArt(s),anchors:{['knee_'+s]:Rp('shin_'+s),['ankle_'+s]:Rp('foot_'+s)},desc:S+' shin with chino hem.'});
  add({id:'foot_'+s,link:'foot_'+s,parent:'shin_'+s,pivot:Rp('foot_'+s),art:footArt(s),anchors:{['ankle_'+s]:Rp('foot_'+s),['floor_'+s]:[Rp('foot_'+s)[0],1900]},desc:S+' ankle and canvas trainer; sole sits on the floor line.'});
  Object.keys(HP).forEach(k=>{const h=handPart(s,k);add({id:'hand_'+s+'_'+k,part:'hand_'+s,variant:k,link:'hand_'+s,parent:'forearm_'+s,pivot:Rp('hand_'+s),art:h.art,anchors:{['wrist_'+s]:Rp('hand_'+s),grip:h.grip},desc:S+' hand, '+k.replace(/_/g,' ')+'.'});});});
 const hpR=handPart('l','point',false);add({id:'hand_l_point_raised',part:'hand_l',variant:'point_raised',link:'hand_l',parent:'forearm_l',pivot:Rp('hand_l'),art:hpR.art,anchors:{wrist_l:Rp('hand_l'),grip:hpR.grip},desc:'Left hand pointing, unmirrored for an arm raised across to screen right.'});
 const IW=poseWorld(POSE3.stand).W,Sh=app(IW.torso_upper,[590,634]);
 add({id:'tote',kind:'prop',character:1,parent:'torso',pivot:Sh,art:toteArt(Sh,[Sh[0]+160,Sh[1]+180]),anchors:{strap:Sh},desc:'Canvas tote with leather straps, hanging from the left shoulder in the idle.'});
 add({id:'chair',kind:'prop',parent:null,pivot:[500,1900],art:chairArt(),anchors:{seat:[500,1390],floor:[500,1900]},desc:'Swivel office chair in base slots; seat anchor meets the pelvis seat anchor when seated.'});
 add({id:'desk',kind:'prop',parent:null,pivot:[500,1900],art:deskArt(),anchors:{desk_top:[500,1222],floor:[500,1900]},desc:'Office desk with modesty panel, base slots.'});
 add({id:'laptop',kind:'prop',parent:null,pivot:[500,1232],art:laptopArt(),anchors:{desk_top:[500,1232]},desc:'Laptop seen from behind the lid, base slots.'});
 if(globalThis.MayaViews)MayaViews.partDefs(add);
 return D;}
function zOrder(p){const leg=s=>['thigh_'+s,'foot_'+s,'shin_'+s],arm=s=>['upper_arm_'+s,'deltoid_'+s,'forearm_'+s,'elbow_fold_'+s,'hand_'+s,'cuff_'+s];
 const face=p.expr&&BIBLE.includes(p.expr)?['face']:['brow_l','brow_r','eye_l','eye_r','mouth'];
 return [...leg('r'),...leg('l'),'pelvis','torso','neck','hair_back','head',...face,'earring_l','earring_r','collar','badge',...arm('r'),...arm('l')];}
function buildParts(measure){const defs=partDefs(),files={},assets=[];
 defs.forEach(d=>{const prop=d.kind==='prop',path=(prop?'props/':'maya/')+d.id;const inner=d.art+Object.entries(d.anchors||{}).map(([n,p])=>AN(n,p)).join('');
  const b=measure(inner),x=Math.floor(b.x-6),y=Math.floor(b.y-6),w=Math.ceil(b.x+b.width+6)-x,h=Math.ceil(b.y+b.height+6)-y,pv=r1(d.pivot[0])+' '+r1(d.pivot[1]);
  const svg='<svg xmlns="http://www.w3.org/2000/svg" data-asset="'+path+'" viewBox="'+x+' '+y+' '+w+' '+h+'" width="'+w+'" height="'+h+'"><g id="'+(prop?'prop_':'maya_')+d.id+'"'+(prop&&!d.character?'':' data-character="maya"')+' data-part="'+(d.part||d.id)+'"'+(d.variant?' data-variant="'+d.variant+'"':'')+(prop?'':' data-view="'+d.view+'"')+(d.parent?' data-parent="'+d.parent+'"':'')+(d.follow?' data-follow="'+d.follow.part+' '+d.follow.ratio+'"':'')+' data-pivot="'+pv+'" data-z="'+d.z+'">'+inner+'</g></svg>';
  files[path+'.svg']=svg;const ids=re=>[...new Set([...svg.matchAll(re)].map(m=>m[1]))];
  const a={file:path+'.svg',kind:d.kind||'character_part'};if(!prop||d.character)a.character='maya';a.part=d.part||d.id;if(d.variant)a.variant=d.variant;if(!prop)a.view=d.view;
  if(d.follow)a.follow=d.follow;Object.assign(a,{parent:d.parent||null,pivot:[r1(d.pivot[0]),r1(d.pivot[1])],z:d.z,slots:ids(/id="(slot_[^"]+)"/g),anchors:ids(/id="(anchor_[^"]+)"/g),description:d.desc});
  assets.push(a);d.path=path;d.vb=[x,y,w,h];});
 return {files,manifest:{batch:'maya_story_parts_v3',assets},defs};}
const TF=(d,M)=>'matrix('+M.map(v=>Math.round(v*10000)/10000).join(' ')+') translate('+d.vb[0]+' '+d.vb[1]+')';
const FM=(d,W,rot)=>d.follow?mul(W[d.link],rotA(d.follow.ratio*(((rot||{})[d.follow.part]||0)-(d.follow.angle||0)),d.pivot[0],d.pivot[1])):W[d.link];
const deltFor=(s,rot)=>{const a=(s==='l'?-1:1)*((rot||{})['upper_arm_'+s]||0);let best=0;DELT_BASES.forEach(b=>{if(Math.abs(b-a)<Math.abs(best-a))best=b;});return 'deltoid_'+s+(best?'_'+best:'');};
function placeList(name,built,POSES_){const p=(POSES_||POSE3)[name],PW=(p.world||poseWorld)(p),W=PW.W,rot=PW.rot,by={};built.defs.forEach(d=>by[d.id]=d);const out=[];
 if(p.list){p.list(W).forEach(([id,M,z])=>{const d=by[id];if(d)out.push([z!=null?Object.assign({},d,{z}):d,M]);});}
 else{const h=p.hands||{},use={hand_r:'hand_r_'+(h.r||'relaxed'),hand_l:'hand_l_'+(h.l||'relaxed'),face:'face_'+p.expr,deltoid_r:deltFor('r',rot),deltoid_l:deltFor('l',rot)};['r','l'].forEach(s=>{if(p.arm&&p.arm[s]&&p.arm[s].fore){use['upper_arm_'+s]='upper_arm_'+s+'_foreshort';use['elbow_fold_'+s]='elbow_fold_'+s+'_foreshort';}});if(p.legs==='seated'){use.thigh_r='thigh_r_seated';use.thigh_l='thigh_l_seated';}
  zOrder(p).forEach(slot=>{const d=by[use[slot]||slot];if(d)out.push([d,FM(d,W,rot)]);});}
 (p.props||[]).forEach(pr=>{const [id,o]=Array.isArray(pr)?pr:[pr,{}];const d=by[id];if(!d)return;const at=o.at||[0,0];out.push([Object.assign({},d,{z:o.z??d.z}),[1,0,0,1,at[0],at[1]]]);});
 out.sort((a,b)=>a[0].z-b[0].z);return out.map(([d,M])=>[d.path,TF(d,M)]);}
function assemble(name,built,P_){return placeList(name,built,P_).map(([path,tf])=>'<g transform="'+tf+'">'+built.files[path+'.svg']+'</g>').join('');}
function jointList(up,fore,built){const by={};built.defs.forEach(d=>by[d.id]=d);const rot={upper_arm_r:up,forearm_r:fore},W=fkO(rot,{},[0,0]);
 return ['torso','upper_arm_r',deltFor('r',rot),'forearm_r','elbow_fold_r','hand_r_relaxed','cuff_r','collar'].map(i=>by[i]).sort((a,b)=>a.z-b.z).map(d=>[d.path,TF(d,FM(d,W,rot))]);}
globalThis.MayaStory={build,figure,recast,CAST,C,RIG,POSES,fk,fkO,app,mul,rotA,inv,headPieces,headArt,eye,brow,mouth,ear,hoop,neckArt,puffArt,buildParts,assemble,placeList,jointList,POSE3,BIBLE,EXPR,MO,HP,handArt,handPart,tube,tubeShade,rib,tp,tpS,tpH,fill,line,shade,shape,hi,g,M,P,r1,cr,X,XD,mir,mp,BS,AN,Z,torsoArt,collarBack,collarFront,badgeArt,pelvisArt,thighArt,shinArt,footArt,upperArmArt,forearmArt,cuffArt,shoulderArt,elbowFoldArt,poseWorld,solvePose,D2R,lerp,fr};
})();
