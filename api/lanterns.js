// Visitor lanterns API for lotusclan2026 (Vercel Node function).
// Storage: Upstash Redis over REST. Set KV_REST_API_URL and KV_REST_API_TOKEN (what Vercel's Upstash/KV
// integration provides) in the project's environment variables. Without them the API answers with
// storage:false and the page keeps lanterns in the visitor's own browser.
// Keeper actions need KEEPER_KEY set; the keeper opens the site as /#keeper=<that key> to see hide buttons.
const URL_=process.env.KV_REST_API_URL,TOKEN=process.env.KV_REST_API_TOKEN,KEEPER=process.env.KEEPER_KEY||'';
const MAX_TEXT=80,MAX_NAME=20,PER_MIN=1,PER_DAY=20,KEEP=200;

async function redis(...cmd){const r=await fetch(URL_,{method:'POST',headers:{authorization:`Bearer ${TOKEN}`,'content-type':'application/json'},body:JSON.stringify(cmd)});if(!r.ok)throw new Error('redis '+r.status);return (await r.json()).result;}
function clean(s,max){return String(s||'').normalize('NFKC').replace(/<[^>]*>/g,'').replace(/https?:\/\/\S+|www\.\S+|\S+\.(com|net|org|io|ly|gg|xyz)\b\S*/gi,'').replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g,'').replace(/\s+/g,' ').trim().slice(0,max);}
async function ipHash(req){const ip=(req.headers['x-forwarded-for']||'').split(',')[0].trim()||'0';const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip+(process.env.SALT||'lotus')));return Array.from(new Uint8Array(buf)).slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join('');}
function send(res,code,body){res.statusCode=code;res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');res.end(JSON.stringify(body));}
async function readBody(req){return new Promise(r=>{let d='';req.on('data',c=>{d+=c;if(d.length>4096)req.destroy();});req.on('end',()=>r(d));});}

module.exports=async(req,res)=>{
  if(!URL_||!TOKEN){return send(res,200,{storage:false,lanterns:[]});}
  try{
    if(req.method==='GET'){const raw=await redis('LRANGE','lanterns',-KEEP,-1);const lanterns=raw.map(s=>{try{return JSON.parse(s)}catch(e){return null}}).filter(l=>l&&!l.hidden).map(({id,text,name,ts})=>({id,text,name,ts}));return send(res,200,{storage:true,lanterns});}
    if(req.method==='POST'){let b={};try{b=JSON.parse(await readBody(req)||'{}')}catch(e){}
      const text=clean(b.text,MAX_TEXT),name=clean(b.name,MAX_NAME);if(text.length<2)return send(res,400,{error:'Write a few words first.'});
      const h=await ipHash(req);const m=await redis('INCR',`rl:m:${h}`);if(m===1)await redis('EXPIRE',`rl:m:${h}`,60);if(m>PER_MIN)return send(res,429,{error:'One lantern a minute. Let the last one rise.'});
      const d=await redis('INCR',`rl:d:${h}`);if(d===1)await redis('EXPIRE',`rl:d:${h}`,86400);if(d>PER_DAY)return send(res,429,{error:'That is a lot of lanterns for one night. Come back tomorrow.'});
      const lantern={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),text,name,ts:Date.now()};
      await redis('RPUSH','lanterns',JSON.stringify(lantern));await redis('LTRIM','lanterns',-KEEP*2,-1);return send(res,200,{lantern});}
    if(req.method==='DELETE'){if(!KEEPER||req.headers['x-keeper']!==KEEPER)return send(res,403,{error:'Keeper only.'});
      const id=new URL(req.url,'http://x').searchParams.get('id')||'';const raw=await redis('LRANGE','lanterns',0,-1);
      for(const s of raw){let l=null;try{l=JSON.parse(s)}catch(e){}if(l&&l.id===id){await redis('LREM','lanterns',1,s);l.hidden=true;await redis('RPUSH','lanterns:hidden',JSON.stringify(l));return send(res,200,{ok:true});}}
      return send(res,404,{error:'No such lantern.'});}
    res.setHeader('allow','GET, POST, DELETE');return send(res,405,{error:'Method not allowed.'});
  }catch(e){return send(res,500,{error:'The village storage is unreachable right now.'});}
};
