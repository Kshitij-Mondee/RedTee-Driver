// Maya turnaround from a 3D proxy: every body section, joint and head feature lives in (X,Y,Z) around x=500 and is projected for a yaw θ.
// θ=0 front, 35 three-quarter front (faces screen right), 90 side, 145 three-quarter back, 180 back. Same 1000×2000 grid and height lines as the front.
(function(){
const MS=globalThis.MayaStory,{C,tube,tubeShade,tp,tpS,tpH,fill,line,shade,shape,g,M,P,r1,D2R,lerp,handArt,mouth,eye,brow,EXPR,puffArt,app,mul,rotA,fr}=MS;
const tab=(T,y)=>{if(y<=T[0][0])return T[0][1];for(let i=1;i<T.length;i++)if(y<=T[i][0]){const t=(y-T[i-1][0])/(T[i][0]-T[i-1][0]);return lerp(T[i-1][1],T[i][1],t);}return T[T.length-1][1];};
const HA=[[322,0],[326,30],[334,52],[345,66],[360,78],[380,88],[400,93],[440,96],[480,94],[512,88],[540,74],[560,58],[575,40],[583,22],[587,0]];
const HF=[[322,0],[330,34],[345,60],[365,78],[400,90],[440,93],[480,90],[520,82],[550,72],[570,58],[580,42],[587,0]];
const HB=[[322,0],[330,46],[345,78],[370,100],[400,112],[440,114],[480,104],[520,80],[550,60],[570,44],[587,0]];
const HE=[[440,0],[466,3],[490,13],[508,25],[516,22],[522,6],[530,4],[540,8],[548,6],[556,8],[564,4],[572,2],[580,6],[587,0]];
const EX=2/2.3;
function headPt(phi,y,k){k=k||1;const s=Math.sin(phi),c=Math.cos(phi),a=tab(HA,y),x=a*Math.sign(s)*Math.pow(Math.abs(s),EX);
 let z=c>=0?tab(HF,y)*Math.pow(c,EX):-tab(HB,y)*Math.pow(-c,EX);if(c>0)z+=tab(HE,y)*Math.exp(-Math.pow(x/(y<525?13:20),2));return [x*k,z*k];}
const HL=[[0,386],[40,392],[70,418],[95,448],[115,500],[140,540],[180,552]];
const hairY=phi=>tab(HL,Math.abs(((phi/D2R+540)%360)-180));
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];
 for(const p of pts){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}
 for(const p of pts.slice().reverse()){while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}
 return lo.slice(0,-1).concat(up.slice(0,-1));}
const PD=pts=>'M'+pts.map(P).join('L')+'Z';
const TORSO=[[606,36,26,30],[620,72,40,46],[640,112,52,56],[664,140,58,60],[700,138,64,60],[745,134,72,58],[790,130,74,56],[830,122,62,54],[880,112,54,52],[930,108,52,52],[980,112,54,56],[1033,120,58,62]];
const HEM=[[1031,121,60,64],[1074,122,60,64]],PELVIS=[[1036,122,58,62],[1070,130,60,70],[1105,136,58,74],[1124,128,52,66]],NECK=[[540,32,24,30],[628,38,28,34]];
const J={hip_r:[-63,1105,0],knee_r:[-68,1500,6],ankle_r:[-66,1846,-6],shoulder_r:[-140,684,-4],elbow_r:[-152,950,-12],wrist_r:[-150,1186,4],neck:[0,624,-6],head:[0,578,-4],waist:[0,1000,0],pelvis:[0,1040,0]};
['hip','knee','ankle','shoulder','elbow','wrist'].forEach(k=>{const v=J[k+'_r'];J[k+'_l']=[-v[0],v[1],v[2]];});
function V(th){const c=Math.cos(th*D2R),s=Math.sin(th*D2R);const pr=(X,Y,Z)=>[500+X*c+Z*s,Y],dep=(X,Z)=>-X*s+Z*c;
 const sec=(y,W,zf,zb)=>{const zc=(zf-zb)/2,D=(zf+zb)/2,cx=500+zc*s,h=Math.hypot(W*c,D*s);return [cx-h,cx+h,h];};
 const sweep=(S,col,colS,o)=>{o=o||{};const L=[],R=[];S.forEach(([y,W,zf,zb])=>{const q=sec(y,W,zf,zb);L.push([q[0],y]);R.push([q[1],y]);});
  const Ls=MS.cr(L,4),Rs=MS.cr(R,4),d=M(Ls)+'L'+Rs.slice().reverse().map(P).join('L')+'Z';
  const In=Rs.map((p,i)=>[p[0]-(p[0]-Ls[i][0])*0.24,p[1]]);let out=fill(d,col)+shade(M(Rs)+'L'+In.reverse().map(P).join('L')+'Z',colS);
  out+=o.open?line(M(Ls),6)+line(M(Rs),6)+(o.bottom?line(M([Ls[Ls.length-1],Rs[Rs.length-1]]),5):''):line(d,6);return {svg:out,L:Ls,R:Rs};};
 const limb=(a,b,wa,wb,col,colS,o)=>{o=o||{};const A=pr(...a),B=pr(...b);const t=tube([A,[lerp(A[0],B[0],0.5),lerp(A[1],B[1],0.5)],B],u=>lerp(wa,wb,u),{capStart:o.capS!==false,capEnd:!!o.capE});
  return fill(t.d,col)+tubeShade(t,0.3,colS)+(o.rootLine===false?line(t.sides,6)+(o.capE?line(t.capE,6):''):line(t.d,6));};
 const V3={th,c,s,pr,dep};
 V3.legs=side=>{const sd=side==='r'?-1:1,H=J['hip_'+side],K=J['knee_'+side],A=J['ankle_'+side];
  let thigh=limb(H,K,124,84,C.c3,C.c3S,{rootLine:false}),shin=limb(K,A,84,72,C.c3,C.c3S,{capS:false});
  const hem=limb([A[0],1806,A[2]],[A[0],1840,A[2]],74,74,C.c3,C.c3S,{capS:false});
  const seam=(a,b,r)=>{const X1=a[0]+sd*r,X2=b[0]+sd*r;if(dep(sd*r,0)<=4)return '';return tpS([pr(X1,a[1]+20,a[2]),pr(X2,b[1]-20,b[2])],2.4,'both',C.c3S);};
  thigh+=seam(H,K,58)+tpH([pr(H[0]-sd*30,1180,H[2]+20),pr(K[0]-sd*28,1420,K[2]+20)],4,'both',C.c3H);shin+=seam(K,A,40);
  if(c<-0.3)thigh+=tp([pr(H[0]+sd*-6,1112,-70),pr(H[0]+sd*44,1112,-66),pr(H[0]+sd*42,1168,-64),pr(H[0]+sd*-4,1172,-68)].concat([pr(H[0]+sd*-6,1112,-70)]),2.6,'both');
  const cx=A[0],Pf=[];[[1900,1],[1884,1]].forEach(([y])=>{for(let i=0;i<16;i++){const a=i/16*2*Math.PI;Pf.push([cx+Math.cos(a)*33,y,40+Math.sin(a)*78]);}});
  const Pu=[];for(let i=0;i<12;i++){const a=i/12*2*Math.PI;Pu.push([cx+Math.cos(a)*28,1858,64+Math.sin(a)*44]);Pu.push([cx+Math.cos(a)*27,1834,-12+Math.sin(a)*26]);}
  const prj=q=>pr(q[0],q[1],q[2]);const up=hull(Pf.filter(q=>q[1]===1884).concat(Pu).map(prj)),so=hull(Pf.map(prj));
  let foot=fill(PD(up),C.c2)+line(PD(up),6)+fill(PD(so),C.c2H)+shade(PD(hull(Pf.filter(q=>q[1]===1900).map(prj).concat(Pf.filter(q=>q[1]===1900).map(q=>[prj(q)[0],1894])))),C.c2S)+line(PD(so),5);
  if(c>0.25)[0,1,2].forEach(i=>{const z=50+i*12;foot+=line(M([pr(cx-12,1852-i*2,z),pr(cx+12,1852-i*2,z+2)]),2.4);});
  return {thigh,shin:shin+hem,foot,d:dep(H[0],0)};};
 V3.arm=side=>{const S=J['shoulder_'+side],E=J['elbow_'+side],Wr=J['wrist_'+side],near=dep(S[0],S[2]);
  const up=limb(S,E,62,55,C.c1,C.c1S,{rootLine:false,capE:true}),fore=limb(E,[Wr[0],Wr[1]-36,Wr[2]],56,50,C.c1,C.c1S,{capS:true,rootLine:false});
  const cuffT=tube([pr(Wr[0],Wr[1]-42,Wr[2]),pr(Wr[0],Wr[1],Wr[2])],u=>50-3*u,{});let cuff=fill(cuffT.d,C.c1)+tubeShade(cuffT,0.3,C.c1S);[-12,0,12].forEach(o=>{const q=pr(Wr[0],Wr[1],Wr[2]);cuff+=tp([[q[0]+o,Wr[1]-38],[q[0]+o*0.94,Wr[1]-3]],2.2,'both',C.c1S,'lm-shade');});cuff+=line(cuffT.d,4.5);
  const Sp=pr(...S),delt=fill('M'+(Sp[0]-31)+' '+Sp[1]+'A31 31 0 1 1 '+(Sp[0]+31)+' '+Sp[1]+'A31 31 0 1 1 '+(Sp[0]-31)+' '+Sp[1]+'Z',C.c1)+tp([[Sp[0]+(side==='r'?24:-24)*Math.sign(c||1),Sp[1]-24],[Sp[0],Sp[1]-34],[Sp[0]-(side==='r'?24:-24)*Math.sign(c||1)*1.2,Sp[1]-20],[Sp[0]-(side==='r'?33:-33)*Math.sign(c||1),Sp[1]+6]],6,t=>t<0.7?1:1-(t-0.7)/0.3*0.6);
  const fold=(()=>{const q=pr(...E);return fill('M'+(q[0]-28)+' '+(q[1]-24)+'C'+(q[0]-31)+' '+(q[1]-6)+' '+(q[0]-30)+' '+(q[1]+16)+' '+(q[0]-26)+' '+(q[1]+28)+'L'+(q[0]+26)+' '+(q[1]+28)+'C'+(q[0]+30)+' '+(q[1]+16)+' '+(q[0]+31)+' '+(q[1]-6)+' '+(q[0]+28)+' '+(q[1]-24)+'Z',C.c1)+tp([[q[0]-28,q[1]-24],[q[0]-30.5,q[1]],[q[0]-26,q[1]+28]],5.5,'both')+tp([[q[0]+28,q[1]-24],[q[0]+30.5,q[1]],[q[0]+26,q[1]+28]],5.5,'both')+tp([[q[0]-24,q[1]+30],[q[0],q[1]+36],[q[0]+24,q[1]+30]],3,'both')+tp([[q[0]-16,q[1]-8],[q[0],q[1]-2],[q[0]+14,q[1]-8]],2.4,'both');})();
  const Wp=pr(...Wr),back=Math.abs(th)>100,sx=(side==='r'?(back?-1:1):(back?1:-1))*(Math.abs(Math.sin(th*D2R))>0.3&&Math.abs(Math.sin(th*D2R))<0.95?0.85:1);
  const hand='<g transform="translate('+r1(Wp[0])+' '+r1(Wp[1])+') scale('+r1(sx*1.14*100)/100+' 1.14)">'+handArt('relaxed',{shadeX:sx<0?-1:1}).replace(/<circle id="anchor_grip"[^>]*\/>/,'')+'</g>';
  return {up,delt,fore,fold,hand,cuff,near};};
 V3.torso=()=>{const t=sweep(TORSO,C.c1,C.c1S),hm=sweep(HEM,C.c1,C.c1S);let ribs='';for(let i=0;i<36;i++){const ph=i/36*2*Math.PI,X=Math.sin(ph)*121,Zz=Math.cos(ph)*62;if(dep(X,Zz)<8)continue;const q=pr(X,0,Zz);ribs+=tp([[q[0],1037],[q[0],1070]],2.2,'both',C.c1S,'lm-shade');}
  let folds='';if(c>-0.2){[[[-110,770],[-80,792],[-60,806]],[[110,770],[80,792],[60,806]],[[-80,1006],[-40,1018],[-10,1020]]].forEach(p=>{const q=p.map(([X,y])=>pr(X,y,40));if(dep(p[1][0],40)>0)folds+=tp(q,3,'both');});}
  return t.svg+folds+hm.svg+ribs;};
 V3.pelvis=()=>{let s=sweep(PELVIS,C.c3,C.c3S,{open:true}).svg;if(c>0.3){const q=[pr(0,1078,60),pr(0,1100,60),pr(0,1124,54)];s+=line(M(q),2.6);}return s;};
 V3.neck=()=>sweep(NECK,C.skin,C.skinS,{open:true}).svg+tpS([pr(0,560,30),pr(0,600,30)],8,'both',C.skinD);
 V3.collar=()=>{const top=[],bot=[];for(let i=0;i<=24;i++){const ph=(-90+i*7.5)*D2R-th*D2R;const X=Math.sin(ph)*46,Zz=Math.cos(ph)*36-4;top.push(pr(X,606+(Math.cos(ph)>0?4*Math.cos(ph):0),Zz));bot.push(pr(X*1.06,626+(Math.cos(ph)>0?14*Math.cos(ph):0),Zz*1.06));}
  let s=fill(M(top)+'L'+bot.slice().reverse().map(P).join('L')+'Z',C.c1)+line(M(bot),4)+line(M(top),3.5);
  if(c>0.15){[-1,1].forEach(sd=>{const a=pr(sd*4,622,38),b=pr(sd*34,606,30),d=pr(sd*30,646,44);if(dep(sd*30,40)>-10)s+=shape(PD([a,b,d]),C.c2,3.5);});
   [[-30,1],[30,-1]].forEach(([X0])=>{const pts=[pr(X0,630,44),pr(X0*0.5,720,66),pr(X0*0.1,790,74)];if(dep(X0,44)>-20){const t=tube(pts,9,{});s+=fill(t.d,C.c3H)+line(t.sides,2.5);}});
   const bw=Math.max(6,64*c),b=pr(0,0,78)[0];s+=shape('M'+r1(b-bw/2)+' 804L'+r1(b+bw/2)+' 804L'+r1(b+bw/2)+' 896L'+r1(b-bw/2)+' 896Z',C.white,3.5)+fill('M'+r1(b-bw/2)+' 880L'+r1(b+bw/2)+' 880L'+r1(b+bw/2)+' 896L'+r1(b-bw/2)+' 896Z',C.c1H)+(bw>20?shape('M'+r1(b-bw*0.34)+' 824L'+r1(b)+' 824L'+r1(b)+' 850L'+r1(b-bw*0.34)+' 850Z',C.c2,2):'')+shape('M'+r1(b-8)+' 788L'+r1(b+8)+' 788L'+r1(b+8)+' 806L'+r1(b-8)+' 806Z',C.m,3);}
  return s;};
 V3.head=()=>{const L=[],R=[],Lh=[],Rh=[];for(let y=322;y<=587;y+=3){let mn=1e9,mx=-1e9;for(let i=0;i<96;i++){const q=headPt(i/96*2*Math.PI,y),x=500+q[0]*c+q[1]*s;mn=Math.min(mn,x);mx=Math.max(mx,x);}L.push([mn,y]);R.push([mx,y]);}
  const hd=M(L)+'L'+R.slice().reverse().map(P).join('L')+'Z';const In=R.map((p,i)=>[p[0]-(p[0]-L[i][0])*0.2,p[1]]);
  const fv=-th*D2R,f=ph=>Math.cos(ph-fv),facePt=(X,y)=>{let best=0,bd=1e9;for(let i=-60;i<=60;i++){const ph=i/60*Math.PI/2,q=headPt(ph,y);if(Math.abs(q[0]-X)<bd){bd=Math.abs(q[0]-X);best=ph;}}const q=headPt(best,y);return {x:500+q[0]*c+q[1]*s,ph:best,d:dep(q[0],q[1])};};
  const earF=sd=>{const ph=sd*Math.PI/2,ff=f(ph),q=[sd*97,-8],x=500+q[0]*c+q[1]*s,w=Math.max(5,18*Math.abs(ff)+4);const d='M'+r1(x)+' 450C'+r1(x-w)+' 452 '+r1(x-w)+' 516 '+r1(x)+' 518C'+r1(x+w)+' 516 '+r1(x+w)+' 452 '+r1(x)+' 450Z';
   return {svg:fill(d,C.skin)+(Math.abs(ff)>0.4?tpS([[x-w*0.3,462],[x-w*0.5,484],[x-w*0.2,504]],3,'both'):'')+line(d,4.5),ff,x,hoop:MS.hoop(r1(x+sd*(Math.abs(ff)>0.5?0:4)),529)};};
  const eL=earF(-1),eR=earF(1);
  const vis=[];for(let i=0;i<=36;i++)vis.push(fv-Math.PI/2+i/36*Math.PI);
  const hp=(ph,y)=>{const q=headPt(ph,y,1.04);return [500+q[0]*c+q[1]*s,y];};
  const front=vis.map(ph=>hp(ph,hairY(ph))),e1=vis[vis.length-1],e0=vis[0],upS=[],dnS=[];
  for(let y=hairY(e1);y>=322;y-=6)upS.push(hp(e1,y));for(let y=322;y<=hairY(e0);y+=6)dnS.push(hp(e0,y));
  const cap=M(front)+'L'+upS.map(P).join('L')+'L'+[hp(fv+Math.PI,318)].map(P).join('')+'L'+dnS.map(P).join('L')+'Z';
  let hair=fill(cap,C.hair);const capIn=front.map(p=>p);
  for(let i=2;i<36;i+=3){const ph=vis[i],y0=hairY(ph),pts=[];for(let t=0;t<=1.001;t+=0.2){const q=headPt(ph,lerp(y0,342,t),1.04);if(dep(q[0],q[1])<0)break;pts.push([500+q[0]*c+q[1]*s,lerp(y0,342,t)]);}if(pts.length>2)hair+=tp(pts,2.6,'both',C.hairS,'lm-shade');}
  hair+=shade(M(upS.slice(0,Math.max(2,upS.length)))+'L'+upS.slice().reverse().map(p=>P([p[0]-14,p[1]])).join('L')+'Z',C.hairS)+tp(front,2.6,'both')+line(M(upS.concat(dnS.length?[]:[])),6)+line(cap,6);
  let feat='';const EXd=EXPR.attentive;
  [[-1,459,'l'],[1,541,'r']].forEach(([sd,ex])=>{const F=facePt(sd*41,463),ff=f(F.ph);if(ff<0.18)return;const sx=r1(Math.max(0.2,ff)*100)/100;
   feat+='<g transform="translate('+r1(F.x)+' 0) scale('+sx+' 1) translate('+(-ex)+' 0)">'+brow(ex,463,sd,EXd.brow)+eye(ex,463,sd,EXd.eyes)+'</g>';
   const B=facePt(sd*60,514);if(f(B.ph)>0.2)feat+='<ellipse cx="'+r1(B.x)+'" cy="514" rx="'+r1(21*f(B.ph))+'" ry="10" fill="'+C.blush+'" fill-opacity="0.35"/>';});
  const mf=f(0),Mx=500+(tab(HF,551)+tab(HE,551))*s;
  if(mf>0.3)feat+='<g transform="translate('+r1(Mx)+' 0) scale('+r1(mf*100)/100+' 1) translate(-500 0)">'+mouth(500,551,EXd.mouth).svg+'</g>';
  else if(mf>-0.1){const xf=y=>500+(tab(HF,y)+tab(HE,y))*s*Math.sign(s||1);feat+=tp([[xf(551)-2,551],[xf(551)-14,553]],3,'start');}
  if(c>0.1&&Math.abs(s)>0.15){const sd=Math.sign(s),rid=[];for(let y=476;y<=514;y+=4){const q=headPt(sd*0.12,y);rid.push([500+q[0]*c+q[1]*s,y]);}
   const tip=rid[rid.length-1];feat+=tp(rid,2.6,'both')+tp([[tip[0],tip[1]],[tip[0]-sd*6,tip[1]+8],[tip[0]-sd*16,tip[1]+7]],3.4,'mid')+fill('M'+r1(tip[0]-sd*12)+' 519C'+r1(tip[0]-sd*9)+' 516 '+r1(tip[0]-sd*4)+' 517 '+r1(tip[0]-sd*4)+' 520C'+r1(tip[0]-sd*7)+' 522 '+r1(tip[0]-sd*11)+' 522 '+r1(tip[0]-sd*12)+' 519Z',C.ink)+shade(M([[tip[0]-sd*20,522],[tip[0]-sd*4,530],[tip[0]+sd*2,524]])+'Z',C.skinS);}
  else if(c>0.1){feat+=MS.headPieces(EXd).nose;}
  const puffX=-22*s,scr=MS.shape('M'+r1(456+puffX)+' 330C'+r1(468+puffX)+' 316 '+r1(532+puffX)+' 316 '+r1(544+puffX)+' 330C'+r1(542+puffX)+' 344 '+r1(458+puffX)+' 344 '+r1(456+puffX)+' 330Z',C.c1,3.5);
  const skin=fill(hd,C.skin)+shade(M(R)+'L'+In.slice().reverse().map(P).join('L')+'Z',C.skinS)+line(hd,6);
  const near=[eL,eR].filter(e=>e.ff>0.15),far=[eL,eR].filter(e=>e.ff<=0.15);
  return {puff:puffArt(th),back:th>100,ears_far:far.map(e=>e.svg).join(''),skin,ears_near:near.map(e=>e.svg).join(''),hair,feat,scr,hoops_far:far.map(e=>e.hoop).join(''),hoops_near:near.map(e=>e.hoop).join('')};};
 return V3;}
function viewLayers(th){const V3=V(th),h=V3.head(),lr=V3.legs('r'),ll=V3.legs('l'),ar=V3.arm('r'),al=V3.arm('l');
 const legs=[lr,ll].sort((a,b)=>a.d-b.d),arms=[['r',ar],['l',al]].sort((a,b)=>a[1].near-b[1].near);
 const L=[];const add=(id,link,art,z)=>L.push({id,link,art,z});
 const farArm=arms[0][1].near<-30?arms[0]:null;
 if(farArm){const [s,a]=farArm;add('upper_arm_'+s,'upper_arm_'+s,a.up+a.delt,1);add('forearm_'+s,'forearm_'+s,a.fore,2);add('elbow_fold_'+s,'upper_arm_'+s,a.fold,3);add('hand_'+s,'hand_'+s,a.hand,4);add('cuff_'+s,'forearm_'+s,a.cuff,5);}
 legs.forEach((lg,i)=>{const s=lg===lr?'r':'l';add('foot_'+s,'foot_'+s,lg.foot,10+i*10);add('shin_'+s,'shin_'+s,lg.shin,12+i*10);add('thigh_'+s,'thigh_'+s,lg.thigh,14+i*10);});
 add('pelvis','torso_lower',V3.pelvis(),70);add('torso','torso_upper',V3.torso(),80);add('neck','neck',V3.neck(),90);
 add('hair_back','head',h.puff,h.back?118:100);add('head','head',h.ears_far+h.hoops_far+h.skin+h.ears_near+h.hair,110);add('face','head',h.feat,120);add('scrunchie','head',h.scr,125);add('earrings','head',h.hoops_near,130);
 add('collar','torso_upper',V3.collar(),140);
 arms.filter(a=>a!==farArm).forEach(([s,a],i)=>{const b=160+i*40;add('upper_arm_'+s,'upper_arm_'+s,a.up,b);add('deltoid_'+s,'torso_upper',a.delt,b+5);add('forearm_'+s,'forearm_'+s,a.fore,b+10);add('elbow_fold_'+s,'upper_arm_'+s,a.fold,b+15);add('hand_'+s,'hand_'+s,a.hand,b+20);add('cuff_'+s,'forearm_'+s,a.cuff,b+30);});
 return {layers:L.sort((a,b)=>a.z-b.z),V3};}
function viewSVG(th){return viewLayers(th).layers.map(l=>l.art).join('');}
// 3/4 front rig: projected joints become pivots
const RIG34={};{const V3=V(35),p=k=>V3.pr(...J[k]);Object.assign(RIG34,{root:{p:[0,0]},torso_lower:{u:'root',p:p('pelvis')},thigh_r:{u:'torso_lower',p:p('hip_r')},shin_r:{u:'thigh_r',p:p('knee_r')},foot_r:{u:'shin_r',p:p('ankle_r')},thigh_l:{u:'torso_lower',p:p('hip_l')},shin_l:{u:'thigh_l',p:p('knee_l')},foot_l:{u:'shin_l',p:p('ankle_l')},torso_upper:{u:'torso_lower',p:p('waist')},neck:{u:'torso_upper',p:p('neck')},head:{u:'neck',p:p('head')},upper_arm_r:{u:'torso_upper',p:p('shoulder_r')},forearm_r:{u:'upper_arm_r',p:p('elbow_r')},hand_r:{u:'forearm_r',p:p('wrist_r')},upper_arm_l:{u:'torso_upper',p:p('shoulder_l')},forearm_l:{u:'upper_arm_l',p:p('elbow_l')},hand_l:{u:'forearm_l',p:p('wrist_l')}});}
function fk34(rot,root){const W={root:[1,0,0,1,root[0],root[1]]};const get=n=>{if(W[n])return W[n];const R=RIG34[n];W[n]=mul(get(R.u),rotA(rot[n]||0,R.p[0],R.p[1]));return W[n];};Object.keys(RIG34).forEach(get);return W;}
const L34=viewLayers(35).layers;
const KEYS={walk_contact:{torso_upper:-2,thigh_r:-20,shin_r:4,foot_r:-12,thigh_l:16,shin_l:14,foot_l:22,upper_arm_r:12,forearm_r:-8,upper_arm_l:-14,forearm_l:-16},
 walk_down:{torso_upper:-3,thigh_r:-14,shin_r:16,foot_r:-2,thigh_l:20,shin_l:34,foot_l:26,upper_arm_r:14,forearm_r:-10,upper_arm_l:-16,forearm_l:-20},
 walk_passing:{torso_upper:-1,thigh_r:2,shin_r:2,thigh_l:-10,shin_l:52,foot_l:6,upper_arm_r:2,forearm_r:-6,upper_arm_l:-3,forearm_l:-8},
 walk_up:{torso_upper:-1,thigh_r:12,shin_r:6,foot_r:18,thigh_l:-22,shin_l:12,foot_l:-10,upper_arm_r:-10,forearm_r:-14,upper_arm_l:10,forearm_l:-6}};
const world34=p=>{const W0=fk34(p.rot,[0,0]);const sole=['r','l'].flatMap(s=>{const a=RIG34['foot_'+s].p;return [[a[0]-60,1900],[a[0]+70,1900]].map(q=>app(W0['foot_'+s],q)[1]);});const dy=r1(1900-Math.max(...sole));return {W:fk34(p.rot,[0,dy]),dy};};
const POSES34={};Object.entries(KEYS).forEach(([k,rot],i)=>{POSES34[k]={label:'walk key '+(i+1)+' · '+k.slice(5)+' (3/4 front rig)',rot,world:world34,list:W=>L34.map(l=>[l.id+'_34front',W[l.link]])};});
POSES34.turn_34front={label:'3/4 front, assembled from its rig parts',rot:{},world:world34,list:W=>L34.map(l=>[l.id+'_34front',W[l.link]])};
const NAMES={0:'front',35:'34front',90:'side',145:'34back',180:'back'};
function partDefs(add){
 const pv=link=>link==='torso_lower'?RIG34.torso_lower.p:RIG34[link].p,par={torso_lower:null,torso_upper:'pelvis',neck:'torso',head:'neck'};
 L34.forEach(l=>{const part=l.id,link=l.link;let parent=par[link];if(parent===undefined){parent={thigh_r:'pelvis',thigh_l:'pelvis',shin_r:'thigh_r',shin_l:'thigh_l',foot_r:'shin_r',foot_l:'shin_l',upper_arm_r:'torso',upper_arm_l:'torso',forearm_r:'upper_arm_r',forearm_l:'upper_arm_l',hand_r:'forearm_r',hand_l:'forearm_l'}[link];}
  if(part!==link&&!['pelvis','torso'].includes(part))parent=({head:'neck',torso_upper:'torso',upper_arm_r:'upper_arm_r',upper_arm_l:'upper_arm_l',forearm_r:'forearm_r',forearm_l:'forearm_l'})[link]||parent;
  if(['face','scrunchie','earrings','hair_back'].includes(part))parent='head';if(part==='collar'||part.startsWith('deltoid'))parent='torso';if(part==='head')parent='neck';
  add({id:part+'_34front',part,view:'34front',link,parent,pivot:pv(link),art:l.art,anchors:{},z:l.z,desc:'3/4 front '+part.replace(/_/g,' ')+', projected from the 3D proxy; same rig name and parent as the front.'});});
 [90,145,180].forEach(th=>add({id:'turn_'+NAMES[th],kind:'character',part:'turnaround',variant:NAMES[th],view:NAMES[th],parent:null,pivot:[500,1900],art:viewSVG(th),anchors:{feet:[500,1900]},z:0,desc:'Turnaround '+NAMES[th]+' view, standing neutral, same height lines as the front.'}));}
globalThis.MayaViews={V,viewSVG,viewLayers,RIG34,fk34,POSES34,partDefs,NAMES,J};
})();
