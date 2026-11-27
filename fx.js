// fx.js: the gauntlet's electric crackle around the pointer, a violet ripple under every tap
(()=>{const fine=matchMedia('(pointer:fine)').matches,RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const c=document.createElement('canvas');c.id='fx';c.setAttribute('aria-hidden','true');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9';document.body.appendChild(c);const g=c.getContext('2d');
let W=0,H=0;const fit=()=>{W=innerWidth;H=innerHeight;c.width=W;c.height=H;};fit();addEventListener('resize',fit);
const sparks=[],rings=[];let mx=-100,my=-100,moveAt=0,nextSpark=0,last=0,raf=0;
function bolt(x,y,len,a0){const pts=[[x,y]];let a=a0,l=0;while(l<len){const seg=3+Math.random()*4;a+=(Math.random()-.5)*1.4;x+=Math.cos(a)*seg;y+=Math.sin(a)*seg;l+=seg;pts.push([x,y]);}return pts;}
function addSpark(x,y,big){const n=big?6:1+(Math.random()*2|0);for(let i=0;i<n;i++){const a=Math.random()*6.283,r=big?4:9;sparks.push({p:bolt(x+Math.cos(a)*r,y+Math.sin(a)*r,big?18+Math.random()*16:8+Math.random()*10,a),t:0,life:.12+Math.random()*.1});}kick();}
function kick(){if(!raf)raf=requestAnimationFrame(tick);}
function tick(now){raf=0;const dt=Math.min(.05,(now-(last||now))/1000);last=now;g.clearRect(0,0,W,H);let live=false;
  if(fine&&!RM&&mx>0&&now>nextSpark){const recent=now-moveAt<1500;nextSpark=now+(recent?160+Math.random()*420:1800+Math.random()*2200);addSpark(mx,my,false);}
  g.lineCap='round';g.lineJoin='round';
  for(let i=sparks.length;i--;){const s=sparks[i];s.t+=dt;const a=1-s.t/s.life;if(a<=0){sparks.splice(i,1);continue;}live=true;g.strokeStyle=`rgba(180,140,255,${a*.9})`;g.lineWidth=3;g.shadowColor='rgba(180,140,255,.9)';g.shadowBlur=6;g.beginPath();s.p.forEach(([x,y],j)=>j?g.lineTo(x,y):g.moveTo(x,y));g.stroke();g.strokeStyle=`rgba(245,238,255,${a})`;g.lineWidth=1;g.shadowBlur=0;g.stroke();}
  for(let i=rings.length;i--;){const r=rings[i];r.t+=dt;const a=1-r.t/.5;if(a<=0){rings.splice(i,1);continue;}live=true;const rad=6+r.t*90;g.strokeStyle=`rgba(190,150,255,${a*.8})`;g.lineWidth=2;g.beginPath();g.arc(r.x,r.y,rad,0,7);g.stroke();g.strokeStyle=`rgba(240,230,255,${a*.5})`;g.lineWidth=1;g.beginPath();g.arc(r.x,r.y,rad*.6,0,7);g.stroke();}
  if(live||(fine&&!RM&&mx>0&&!document.hidden))raf=requestAnimationFrame(tick);}
if(fine){addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;moveAt=performance.now();kick();},{passive:true});document.addEventListener('mouseleave',()=>{mx=-100});addEventListener('mousedown',e=>addSpark(e.clientX,e.clientY,true));}
addEventListener('touchstart',e=>{for(const t of e.changedTouches){rings.push({x:t.clientX,y:t.clientY,t:0});if(!RM)addSpark(t.clientX,t.clientY,true);}kick();},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick();});
})();
