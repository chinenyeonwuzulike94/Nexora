import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Vercel function instances have a read-only project filesystem. /tmp works for
// demo data during a warm instance; local runs use the project data directory.
const dataDir = process.env.VERCEL ? path.join('/tmp', 'nexora-demo-data') : path.join(root, 'data');
const dbPath = path.join(dataDir, 'nexora.json');
const port = Number(process.env.PORT || 4173);
const authAttempts = new Map();
const authSql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
let authSchemaPromise;
const movieSeed = [
  { id:'odyssey', title:'The Odyssey', year:2026, rating:'8.9', genre:'Adventure', type:'Movie', platform:'Netflix', poster:'/assets/home-posters/the-odyssey.jpg', art:'linear-gradient(145deg,#1c3445,#c18957 48%,#090d12)', featured:true, description:'A hero. A mission. A journey beyond limits.' },
  { id:'moana', title:'Moana', year:2026, rating:'8.7', genre:'Adventure', type:'Movie', platform:'Disney+', poster:'/assets/home-posters/moana.jpg', art:'linear-gradient(160deg,#25a9a6,#f5a957 60%,#073e50)', description:'A new ocean adventure awaits.' },
  { id:'project-hail-mary', title:'Project Hail Mary', year:2026, rating:'8.8', genre:'Sci-Fi', type:'Movie', platform:'Prime Video', poster:'/assets/home-posters/project-hail-mary.jpg', art:'linear-gradient(160deg,#172a47,#0b1220)', description:'One astronaut. One impossible mission. A journey across the stars.' },
  { id:'the-furious', title:'The Furious', year:2026, rating:'8.2', genre:'Action', type:'Movie', platform:'Netflix', poster:'/assets/home-posters/the-furious.jpg', art:'linear-gradient(160deg,#0b5964,#082033)', description:'A pulse-pounding new action story.' },
  { id:'sheep-detectives', title:'The Sheep Detectives', year:2026, rating:'8.4', genre:'Comedy', type:'Movie', platform:'Hulu', poster:'/assets/home-posters/the-sheep-detectives.jpg', art:'linear-gradient(160deg,#7a9b3a,#293d25)', description:'A mystery unfolds in the most unexpected flock.' },
  { id:'the-colony', title:'The Colony', year:2026, rating:'7.9', genre:'Sci-Fi', type:'Movie', platform:'Prime Video', poster:'https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg', art:'linear-gradient(160deg,#1c3445,#101623)', description:'A story from a world on the edge.' },
  { id:'the-bear', title:'The Bear', year:2024, rating:'8.7', genre:'Drama', type:'TV Show', platform:'Hulu', poster:'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg', art:'linear-gradient(160deg,#d78b48,#45241b 70%)', description:'A chef returns home to run a family sandwich shop and finds a new team.' },
  { id:'arcane', title:'Arcane', year:2024, rating:'9.0', genre:'Animation', type:'TV Show', platform:'Netflix', poster:'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg', art:'linear-gradient(160deg,#35a1a4,#412246 72%)', description:'Two sisters find themselves on opposite sides of a growing conflict.' },
  { id:'severance', title:'Severance', year:2025, rating:'8.7', genre:'Sci-Fi', type:'TV Show', platform:'Prime Video', poster:'https://image.tmdb.org/t/p/w500/lFf6LLrQjYldcZItzOkGmMMigP7.jpg', art:'linear-gradient(160deg,#e9efe7,#275951 75%)', description:'Office workers undergo a procedure that divides their work and personal lives.' },
  { id:'wicked', title:'Wicked', year:2024, rating:'7.6', genre:'Fantasy', type:'Movie', platform:'Hulu', poster:'https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg', art:'linear-gradient(160deg,#26a06f,#323d68 70%)', description:'Two unlikely friends discover who they are before the world names them.' },
  { id:'the-menu', title:'The Menu', year:2022, rating:'7.2', genre:'Thriller', type:'Movie', platform:'Hulu', poster:'https://image.tmdb.org/t/p/w500/fPtUgMcLIboqlTlPrq0bQpKK8eq.jpg', art:'linear-gradient(160deg,#b77043,#131a1c 70%)', description:'A couple visits an exclusive restaurant where the evening has a surprising menu.' },
  { id:'inside-out-two', title:'Inside Out 2', year:2024, rating:'7.6', genre:'Family', type:'Movie', platform:'Disney+', poster:'https://lumiere-a.akamaihd.net/v1/images/harbor_teaser_poster_united_kingdom_dc9a9914.jpeg?region=0%2C0%2C770%2C1100', art:'linear-gradient(160deg,#ef784e,#7d56be 70%)', description:'Riley navigates new emotions as she grows into a new chapter of life.' }
];
const planPreview = [
  { id:'nexora-one', name:'Nexora One', price:'$29.99', amountCents:2999, currency:'USD', period:'month', label:'With ads where offered', features:['Netflix, Prime Video, Disney+ and Hulu','One Nexora plan and one monthly bill','Unified search, recommendations and watchlist'] },
  { id:'nexora-one-premium', name:'Nexora One Premium', price:'$49.99', amountCents:4999, currency:'USD', period:'month', label:'Premium tiers where available', features:['All four platforms in one proposed bundle','Premium playback quality where supported','One Nexora plan and one monthly bill','Unified search, recommendations and watchlist'] }
];
const testimonialSeed = [
  { id:'t1', name:'Amara O.', role:'Film lover', quote:'I used to spend more time looking for a movie than watching one. Nexora makes the good stuff easy to find.', rating:5, initials:'AO', color:'#7c3aed' },
  { id:'t2', name:'Daniel K.', role:'Weekend binge watcher', quote:'The platform filters are the feature I did not know I needed. One quick search and we are already watching.', rating:5, initials:'DK', color:'#ec4899' },
  { id:'t3', name:'Tomi A.', role:'Series enthusiast', quote:'My watchlist finally lives in one place. Discovering something new for movie night feels effortless.', rating:5, initials:'TA', color:'#14877c' }
];
let db;
const sessions = new Map();
async function ensureAuthSchema(){
  if(!authSql)return;
  if(!authSchemaPromise)authSchemaPromise=(async()=>{
    await authSql`CREATE TABLE IF NOT EXISTS nexora_users (id TEXT PRIMARY KEY, name VARCHAR(60) NOT NULL, email TEXT NOT NULL UNIQUE, salt CHAR(32) NOT NULL, hash CHAR(128) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await authSql`CREATE TABLE IF NOT EXISTS nexora_sessions (token_hash CHAR(64) PRIMARY KEY, user_id TEXT NOT NULL REFERENCES nexora_users(id) ON DELETE CASCADE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await authSql`CREATE INDEX IF NOT EXISTS nexora_sessions_expiry_idx ON nexora_sessions (expires_at)`;
  })().catch(err=>{authSchemaPromise=null;throw err});
  return authSchemaPromise;
}
function sessionHash(token){return createHash('sha256').update(token).digest('hex')}
async function loadDb(){
  await mkdir(dataDir,{recursive:true});
  try { db=JSON.parse(await readFile(dbPath,'utf8')); }
  catch { db={users:[],watchlists:{},newsletter:[],testimonials:[]}; await saveDb(); }
}
async function saveDb(){ await writeFile(dbPath,JSON.stringify(db,null,2)); }
function send(res,status,body,headers={}){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin',...headers});res.end(JSON.stringify(body));}
function parseJsonBody(raw){
  if(Buffer.byteLength(raw)>64_000){const e=new Error('Request too large');e.statusCode=413;throw e;}
  if(!raw)return{};
  try{const body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body)){const e=new Error('A JSON object is required.');e.statusCode=400;throw e;}return body;}
  catch(err){if(err.statusCode)throw err;const e=new Error('Invalid JSON request body.');e.statusCode=400;throw e;}
}
async function bodyJson(req){
  // Vercel's Node runtime may parse JSON into req.body before this handler runs.
  // Use that parsed object when available; only read the stream on the local server.
  if(req.body!==undefined&&req.body!==null){
    if(Buffer.isBuffer(req.body))return parseJsonBody(req.body.toString('utf8'));
    if(typeof req.body==='string')return parseJsonBody(req.body);
    if(typeof req.body==='object'&&!Array.isArray(req.body)){
      if(Buffer.byteLength(JSON.stringify(req.body))>64_000){const e=new Error('Request too large');e.statusCode=413;throw e;}
      return req.body;
    }
    const e=new Error('A JSON object is required.');e.statusCode=400;throw e;
  }
  const parts=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>64_000){const e=new Error('Request too large');e.statusCode=413;throw e;}parts.push(chunk);}
  return parseJsonBody(Buffer.concat(parts).toString('utf8'));
}
async function currentUser(req){
  const token=(req.headers.cookie||'').match(/nexora_session=([^;]+)/)?.[1];
  if(!token)return null;
  if(!authSql)return sessions.get(token)||null;
  await ensureAuthSchema();
  const rows=await authSql`SELECT u.id,u.name,u.email FROM nexora_sessions s JOIN nexora_users u ON u.id=s.user_id WHERE s.token_hash=${sessionHash(token)} AND s.expires_at>NOW() LIMIT 1`;
  return rows[0]||null;
}
async function hasAdminRole(req,allowed){const user=await currentUser(req);if(!user)return{user:null,allowed:false};if(!authSql)return{user,allowed:false};const rows=await authSql`SELECT role FROM nexora_admin_roles WHERE user_id=${user.id}`;return{user,allowed:rows.some(row=>allowed.includes(row.role))};}
function sameOriginMutation(req){if(!req.headers.origin)return true;const requestHost=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim().toLowerCase();try{return new URL(req.headers.origin).host.toLowerCase()===requestHost}catch{return false}}
function authRateAllowed(req){const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();const now=Date.now(),recent=(authAttempts.get(ip)||[]).filter(t=>now-t<15*60*1000);if(recent.length>=10){authAttempts.set(ip,recent);return false}recent.push(now);authAttempts.set(ip,recent);if(authAttempts.size>5000){for(const [key,times] of authAttempts)if(!times.some(t=>now-t<15*60*1000))authAttempts.delete(key)}return true}
function safeUser(u){return u?{id:u.id,name:u.name,email:u.email}:null;}
function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
export async function handler(req,res){
  const url=new URL(req.url,'http://localhost');let route=decodeURIComponent(url.pathname);
  if(route==='/api/playback'&&req.method==='GET'){
    const id=url.searchParams.get('id');if(!id||!/^[a-z0-9-]{1,120}$/.test(id))return send(res,400,{error:'A valid content id is required.'});route='/api/content/'+id+'/playback';
  }
  if(route==='/api/admin/content'&&req.method==='POST'){
    const action=url.searchParams.get('action'),id=url.searchParams.get('id');if(['rights','publish'].includes(action)){if(!id||!/^[a-z0-9-]{1,120}$/.test(id))return send(res,400,{error:'A valid content id is required.'});route='/api/admin/content/'+id+'/'+action;}
  }
  // Vercel's raw API function route here matches one segment below /api.
  // Keep auth actions on /api/auth and dispatch the operation by query string.
  if(route==='/api/auth'){
    const action=url.searchParams.get('action');
    if(['me','register','login','logout','forgot-password'].includes(action))route=`/api/auth/${action}`;
  }
  if(!['GET','HEAD','OPTIONS'].includes(req.method)&&!sameOriginMutation(req))return send(res,403,{error:'Cross-origin request denied.'});
  if(req.method==='GET'&&route==='/api/subscription/plans')return send(res,200,{currency:'USD',mode:'preview',checkoutEnabled:false,plans:planPreview,notice:'Proposed demo plans only. Platform access and final pricing require confirmed partner agreements.'});
  if(req.method==='POST'&&route==='/api/subscription/checkout')return send(res,503,{error:'Subscription checkout is not enabled in this preview. No payment details were accepted.'});
    if(route==='/api/admin/content'&&(req.method==='GET'||req.method==='POST')){
    const access=await hasAdminRole(req,req.method==='GET'?['admin','catalog_editor','rights_manager']:['admin','catalog_editor']);if(!access.user)return send(res,401,{error:'Sign in with an administrator account.'});if(!access.allowed)return send(res,403,{error:'You do not have access to content management.'});
    if(req.method==='GET'){const rows=await authSql`SELECT c.id,c.content_type AS "contentType",c.title,c.synopsis,c.release_year AS "releaseYear",c.status,c.created_at AS "createdAt",COALESCE(json_agg(json_build_object('territory',r.territory,'reference',r.license_reference,'status',r.status,'startsAt',r.starts_at,'expiresAt',r.expires_at,'svodAllowed',r.svod_allowed,'avodAllowed',r.avod_allowed)) FILTER (WHERE r.id IS NOT NULL),'[]'::json) AS rights FROM nexora_content c LEFT JOIN nexora_content_rights r ON r.content_id=c.id GROUP BY c.id ORDER BY c.updated_at DESC LIMIT 200`;return send(res,200,{content:rows});}
    const b=await bodyJson(req),title=String(b.title||'').trim(),synopsis=String(b.synopsis||'').trim(),type=String(b.contentType||'').toLowerCase(),year=b.releaseYear==null?null:Number(b.releaseYear);if(title.length<1||title.length>180||synopsis.length>10000||!['movie','series'].includes(type)||year!==null&&(!Number.isInteger(year)||year<1888||year>2200))return send(res,400,{error:'Enter a valid title, content type, synopsis and release year.'});const id=slug(title)+'-'+randomBytes(5).toString('hex');const rows=await authSql`INSERT INTO nexora_content(id,content_type,title,synopsis,release_year,status,created_by) VALUES(${id},${type},${title},${synopsis},${year},'draft',${access.user.id}) RETURNING id,title,content_type AS "contentType",status`;return send(res,201,{content:rows[0]});
  }
  if(route.startsWith('/api/admin/content/')&&route.endsWith('/rights')&&req.method==='POST'){
    const access=await hasAdminRole(req,['admin','rights_manager']);if(!access.user)return send(res,401,{error:'Sign in with a rights manager account.'});if(!access.allowed)return send(res,403,{error:'You do not have access to licensing records.'});const id=route.split('/')[4],b=await bodyJson(req),territory=String(b.territory||'').trim().toUpperCase(),reference=String(b.licenseReference||'').trim(),starts=new Date(b.startsAt),expires=b.expiresAt?new Date(b.expiresAt):null;if(!territory.match(/^[A-Z]{2}$/)||reference.length<1||reference.length>180||Number.isNaN(starts.getTime())||expires&&Number.isNaN(expires.getTime())||expires&&expires<=starts)return send(res,400,{error:'Enter a valid two-letter territory, agreement reference and licence dates.'});const exists=await authSql`SELECT id FROM nexora_content WHERE id=${id} LIMIT 1`;if(!exists.length)return send(res,404,{error:'Content record not found.'});const rid=randomBytes(12).toString('hex');const rows=await authSql`INSERT INTO nexora_content_rights(id,content_id,territory,license_reference,starts_at,expires_at,svod_allowed,avod_allowed,status) VALUES(${rid},${id},${territory},${reference},${starts.toISOString()},${expires?.toISOString()||null},${Boolean(b.svodAllowed)},${Boolean(b.avodAllowed)},'pending') RETURNING id,content_id AS "contentId",territory,status`;return send(res,201,{rights:rows[0]});
  }
  if(route.startsWith('/api/admin/content/')&&route.endsWith('/publish')&&req.method==='POST'){
    const access=await hasAdminRole(req,['admin','catalog_editor']);if(!access.user)return send(res,401,{error:'Sign in with an administrator account.'});if(!access.allowed)return send(res,403,{error:'You do not have publishing access.'});const id=route.split('/')[4];const ready=await authSql`SELECT EXISTS(SELECT 1 FROM nexora_content_rights r WHERE r.content_id=${id} AND r.status='active' AND r.starts_at<=NOW() AND (r.expires_at IS NULL OR r.expires_at>NOW()) AND (r.svod_allowed OR r.avod_allowed)) AS rights_ok, EXISTS(SELECT 1 FROM nexora_playback_assets a WHERE a.content_id=${id} AND a.asset_type IN ('hls','dash','mp4') AND a.status='ready') AS asset_ok`;if(!ready[0]?.rights_ok||!ready[0]?.asset_ok)return send(res,409,{error:'Publishing requires current territory rights and a ready playback asset.'});const rows=await authSql`UPDATE nexora_content SET status='published',updated_at=NOW() WHERE id=${id} RETURNING id,title,status`;return send(res,rows.length?200:404,rows[0]||{error:'Content record not found.'});
  }
  if(req.method==='GET'&&route==='/api/health')return send(res,200,{ok:true,name:'Nexora API',movies:movieSeed.length});
  if(req.method==='GET'&&route.startsWith('/api/content/')&&route.endsWith('/playback')){
    const id=route.split('/')[3],country=String(req.headers['x-vercel-ip-country']||'NG').trim().toUpperCase();if(!/^[A-Z]{2}$/.test(country))return send(res,400,{error:'Territory could not be determined.'});if(!authSql)return send(res,503,{error:'Playback rights are not configured.'});
    const rows=await authSql`SELECT c.id,c.title,r.territory,r.license_reference AS "licenseReference",a.storage_key AS url,a.mime_type AS "mimeType",a.duration_seconds AS "durationSeconds" FROM nexora_content c JOIN nexora_content_rights r ON r.content_id=c.id JOIN nexora_playback_assets a ON a.content_id=c.id WHERE c.id=${id} AND c.status='published' AND r.territory=${country} AND r.status='active' AND r.demo_allowed=TRUE AND r.starts_at<=NOW() AND (r.expires_at IS NULL OR r.expires_at>NOW()) AND a.status='ready' AND a.asset_type IN ('webm','mp4') AND a.storage_key LIKE 'https://download.blender.org/%' ORDER BY CASE WHEN a.asset_type='webm' THEN 0 ELSE 1 END`;
    if(!rows.length)return send(res,403,{error:'This title is not available for playback in your territory.'});return send(res,200,{content:{id:rows[0].id,title:rows[0].title,territory:rows[0].territory,licenseReference:rows[0].licenseReference},assets:rows.map(({url,mimeType,durationSeconds})=>({url,mimeType,durationSeconds}))});
  }
  if(req.method==='GET'&&route==='/api/movies'){
    const q=(url.searchParams.get('q')||'').toLowerCase(), genre=url.searchParams.get('genre'),type=url.searchParams.get('type'),platform=url.searchParams.get('platform'),sort=url.searchParams.get('sort');
    let movies=movieSeed.filter(m=>(!q||`${m.title} ${m.genre} ${m.platform}`.toLowerCase().includes(q))&&(!genre||genre==='All'||m.genre===genre)&&(!type||type==='All'||m.type===type)&&(!platform||m.platform.toLowerCase()===platform.toLowerCase()));
    if(sort==='rating')movies.sort((a,b)=>Number(b.rating)-Number(a.rating));return send(res,200,{movies});
  }
  if(req.method==='GET'&&route.startsWith('/api/movies/')){const movie=movieSeed.find(m=>m.id===route.slice(12)||slug(m.title)===route.slice(12));return send(res,movie?200:404,movie||{error:'Movie not found'});}
  if(req.method==='GET'&&route==='/api/testimonials')return send(res,200,{testimonials:[...testimonialSeed,...db.testimonials.filter(t=>t.status==='approved')]});
  if(req.method==='POST'&&route==='/api/testimonials'){
    const b=await bodyJson(req);if(!b.name||!b.quote)return send(res,400,{error:'Add your name and a short review.'});
    const item={id:randomBytes(8).toString('hex'),name:String(b.name).slice(0,60),role:String(b.role||'Nexora viewer').slice(0,60),quote:String(b.quote).slice(0,400),rating:Math.max(1,Math.min(5,Number(b.rating)||5)),initials:String(b.name).split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase(),color:'#7c3aed',status:'pending',createdAt:new Date().toISOString()};db.testimonials.push(item);await saveDb();return send(res,201,{message:'Thanks for sharing your Nexora story. Your review is awaiting approval.'});
  }
  if(req.method==='POST'&&route==='/api/newsletter'){
    const b=await bodyJson(req);if(!/^\S+@\S+\.\S+$/.test(b.email||''))return send(res,400,{error:'Enter a valid email address.'});
    if(!db.newsletter.some(x=>x.email===b.email.toLowerCase()))db.newsletter.push({email:b.email.toLowerCase(),createdAt:new Date().toISOString()});await saveDb();return send(res,201,{message:'You’re on the list. Watch your inbox for the next movie night pick.'});
  }
  if(route.startsWith('/api/auth/')){
    if(req.method==='GET'&&route==='/api/auth/me'){
      if(process.env.VERCEL&&!authSql)return send(res,503,{error:'Account storage is not configured.'});
      try{await ensureAuthSchema();return send(res,200,{user:safeUser(await currentUser(req))})}
      catch(err){console.error('Nexora auth database failure:',err);return send(res,503,{error:'Sign-in is temporarily unavailable. Please try again shortly.'})}
    }
    if(req.method==='POST'&&route==='/api/auth/forgot-password'){if(!authRateAllowed(req))return send(res,429,{error:'Too many requests. Try again in 15 minutes.'},{'retry-after':'900'});const b=await bodyJson(req),email=String(b.email||'').trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email))return send(res,400,{error:'Enter a valid email address.'});return send(res,503,{error:'Password reset email is not configured yet. Contact support at hello@nexora.app.'});}

    if(req.method==='POST'&&(route==='/api/auth/register'||route==='/api/auth/login')){
      if(!authRateAllowed(req))return send(res,429,{error:'Too many sign-in attempts. Try again in 15 minutes.'},{'retry-after':'900'});
      const b=await bodyJson(req),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||''),registering=route.endsWith('/register');
      if(!/^\S+@\S+\.\S+$/.test(email))return send(res,400,{error:'Enter a valid email address.'});
      if(registering&&!String(b.name||'').trim())return send(res,400,{error:'Enter your name to create an account.'});
      if(registering&&(password.length<8||/^(.)\1+$/.test(password)||/^(password|qwerty|letmein|welcome|123456)/i.test(password)))return send(res,400,{error:'Choose a stronger password: use at least 8 characters and avoid common or repeated patterns.'});
      if(!registering&&!password)return send(res,400,{error:'Enter your password.'});
      if(process.env.VERCEL&&!authSql)return send(res,503,{error:'Account storage is not configured.'});
      try{
        await ensureAuthSchema();
        const rows=authSql?await authSql`SELECT id,name,email,salt,hash FROM nexora_users WHERE email=${email} LIMIT 1`:[db.users.find(u=>u.email===email)].filter(Boolean);
        let user=rows[0]||null;
        if(registering){
          if(user)return send(res,409,{error:'An account with this email already exists.'});
          const salt=randomBytes(16).toString('hex');
          user={id:randomBytes(12).toString('hex'),name:String(b.name||email.split('@')[0]).trim().slice(0,60),email,salt,hash:scryptSync(password,salt,64).toString('hex')};
          if(authSql)await authSql`INSERT INTO nexora_users (id,name,email,salt,hash) VALUES (${user.id},${user.name},${user.email},${user.salt},${user.hash})`;
          else{db.users.push(user);await saveDb()}
        }else{
          const expected=user?Buffer.from(user.hash,'hex'):Buffer.alloc(0);
          const actual=scryptSync(password,user?.salt||'nexora-login-check',64);
          const valid=expected.length===actual.length&&timingSafeEqual(expected,actual);
          if(!user||!valid)return send(res,401,{error:'That email and password combination was not found.'});
        }
        const token=randomBytes(32).toString('hex');
        if(authSql){
          await authSql`DELETE FROM nexora_sessions WHERE expires_at<=NOW()`;
          await authSql`INSERT INTO nexora_sessions (token_hash,user_id,expires_at) VALUES (${sessionHash(token)},${user.id},NOW()+INTERVAL '7 days')`;
        }else sessions.set(token,user);
        const flags=['HttpOnly','SameSite=Lax','Path=/','Max-Age=604800'];if(process.env.VERCEL)flags.push('Secure');
        return send(res,200,{user:safeUser(user)},{'set-cookie':`nexora_session=${token}; ${flags.join('; ')}`});
      }catch(err){
        if(registering&&err?.code==='23505')return send(res,409,{error:'An account with this email already exists.'});
        console.error('Nexora auth database failure:',err);
        return send(res,503,{error:'Sign-in is temporarily unavailable. Please try again shortly.'});
      }
    }
    if(req.method==='POST'&&route==='/api/auth/logout'){
      const token=(req.headers.cookie||'').match(/nexora_session=([^;]+)/)?.[1];
      const flags=['HttpOnly','SameSite=Lax','Path=/','Max-Age=0'];if(process.env.VERCEL)flags.push('Secure');
      try{
        if(token){if(authSql){await ensureAuthSchema();await authSql`DELETE FROM nexora_sessions WHERE token_hash=${sessionHash(token)}`}else sessions.delete(token)}
        return send(res,200,{ok:true},{'set-cookie':`nexora_session=; ${flags.join('; ')}`});
      }catch(err){console.error('Nexora session revoke failed:',err);return send(res,503,{error:'Could not end your session. Please try again.'},{'set-cookie':`nexora_session=; ${flags.join('; ')}`})}
    }
  }
  if(route==='/api/profiles'&&req.method==='GET'){
    const user=await currentUser(req);if(!user)return send(res,401,{error:'Sign in to manage profiles.'});if(!authSql)return send(res,503,{error:'Profile storage is not configured.'});await ensureAuthSchema();
    let profiles=await authSql`SELECT id,name,avatar_url AS "avatarUrl",is_kids AS "isKids" FROM nexora_profiles WHERE user_id=${user.id} ORDER BY created_at ASC`;
    if(!profiles.length){const id=randomBytes(12).toString('hex');await authSql`INSERT INTO nexora_profiles(id,user_id,name) VALUES(${id},${user.id},${user.name})`;profiles=await authSql`SELECT id,name,avatar_url AS "avatarUrl",is_kids AS "isKids" FROM nexora_profiles WHERE user_id=${user.id} ORDER BY created_at ASC`;}
    return send(res,200,{profiles});
  }
  if(route==='/api/profiles'&&req.method==='POST'){
    const user=await currentUser(req);if(!user)return send(res,401,{error:'Sign in to manage profiles.'});if(!authSql)return send(res,503,{error:'Profile storage is not configured.'});const b=await bodyJson(req),name=String(b.name||'').trim();if(!name||name.length>60)return send(res,400,{error:'Profile name must be between 1 and 60 characters.'});await ensureAuthSchema();const rows=await authSql`SELECT COUNT(*)::int AS count FROM nexora_profiles WHERE user_id=${user.id}`;if(rows[0].count>=5)return send(res,400,{error:'An account can have up to five profiles.'});const id=randomBytes(12).toString('hex');await authSql`INSERT INTO nexora_profiles(id,user_id,name,is_kids) VALUES(${id},${user.id},${name},${Boolean(b.isKids)})`;return send(res,201,{profile:{id,name,isKids:Boolean(b.isKids)}});
  }
  if(route==='/api/watchlist'&&req.method==='GET'){
    const user=await currentUser(req),key=user?.id||req.headers['x-demo-user']||'guest';if(user&&authSql){const rows=await authSql`SELECT content_id AS id FROM nexora_watchlists WHERE user_id=${user.id} ORDER BY created_at DESC`;return send(res,200,{ids:rows.map(row=>row.id)});}return send(res,200,{ids:db.watchlists[key]||[]});
  }
  if(route==='/api/watchlist'&&req.method==='POST'){
    const b=await bodyJson(req),user=await currentUser(req),key=user?.id||req.headers['x-demo-user']||'guest',movie=movieSeed.find(m=>m.id===b.id);if(!movie)return send(res,404,{error:'Movie not found.'});
    if(user&&authSql){await authSql`INSERT INTO nexora_content(id,content_type,title,synopsis,release_year,status) VALUES(${movie.id},${movie.type==='TV Show'?'series':'movie'},${movie.title},${movie.description},${movie.year},'draft') ON CONFLICT(id) DO NOTHING`;await authSql`INSERT INTO nexora_watchlists(user_id,content_id) VALUES(${user.id},${movie.id}) ON CONFLICT(user_id,content_id) DO NOTHING`;const rows=await authSql`SELECT content_id AS id FROM nexora_watchlists WHERE user_id=${user.id} ORDER BY created_at DESC`;return send(res,200,{ids:rows.map(row=>row.id)});}
    db.watchlists[key]=[...new Set([...(db.watchlists[key]||[]),movie.id])];await saveDb();return send(res,200,{ids:db.watchlists[key]});
  }
  if(route.startsWith('/api/watchlist/')&&req.method==='DELETE'){
    const id=route.split('/').pop(),user=await currentUser(req),key=user?.id||req.headers['x-demo-user']||'guest';if(user&&authSql){await authSql`DELETE FROM nexora_watchlists WHERE user_id=${user.id} AND content_id=${id}`;const rows=await authSql`SELECT content_id AS id FROM nexora_watchlists WHERE user_id=${user.id} ORDER BY created_at DESC`;return send(res,200,{ids:rows.map(row=>row.id)});}db.watchlists[key]=(db.watchlists[key]||[]).filter(x=>x!==id);await saveDb();return send(res,200,{ids:db.watchlists[key]});
  }
  if(route==='/api/watch-history'&&req.method==='GET'){
    const user=await currentUser(req);if(!user)return send(res,401,{error:'Sign in to view watch history.'});if(!authSql)return send(res,503,{error:'Watch history storage is not configured.'});const rows=await authSql`SELECT content_id AS id,position_seconds AS "positionSeconds",duration_seconds AS "durationSeconds",completed,updated_at AS "updatedAt" FROM nexora_watch_history WHERE user_id=${user.id} ORDER BY updated_at DESC LIMIT 100`;return send(res,200,{history:rows});
  }
  if(route==='/api/watch-history'&&req.method==='POST'){
    const user=await currentUser(req);if(!user)return send(res,401,{error:'Sign in to save watch progress.'});if(!authSql)return send(res,503,{error:'Watch history storage is not configured.'});const b=await bodyJson(req),id=String(b.id||''),movie=movieSeed.find(m=>m.id===id),demo=id==='big-buck-bunny-demo',position=Number(b.positionSeconds),duration=b.durationSeconds==null?null:Number(b.durationSeconds);if((!movie&&!demo)||!Number.isInteger(position)||position<0||position>86400||duration!==null&&(!Number.isInteger(duration)||duration<=0||duration>86400))return send(res,400,{error:'Invalid watch progress.'});
    if(movie)await authSql`INSERT INTO nexora_content(id,content_type,title,synopsis,release_year,status) VALUES(${movie.id},${movie.type==='TV Show'?'series':'movie'},${movie.title},${movie.description},${movie.year},'draft') ON CONFLICT(id) DO NOTHING`;
    if(demo){const allowed=await authSql`SELECT 1 FROM nexora_content c JOIN nexora_content_rights r ON r.content_id=c.id WHERE c.id=${id} AND c.status='published' AND r.territory='NG' AND r.status='active' AND r.demo_allowed=TRUE AND r.starts_at<=NOW() AND (r.expires_at IS NULL OR r.expires_at>NOW()) LIMIT 1`;if(!allowed.length)return send(res,403,{error:'Playback rights are not active.'});}
    await authSql`INSERT INTO nexora_watch_history(user_id,content_id,position_seconds,duration_seconds,completed) VALUES(${user.id},${id},${position},${duration},${Boolean(b.completed)}) ON CONFLICT(user_id,content_id) DO UPDATE SET position_seconds=EXCLUDED.position_seconds,duration_seconds=EXCLUDED.duration_seconds,completed=EXCLUDED.completed,updated_at=NOW()`;return send(res,200,{ok:true});
  }
  if(route.startsWith('/api/'))return send(res,404,{error:'API route not found.'});
  if(route==='/')route='/index.html';
  if(['/testimonials','/app','/app/','/app/discover','/app/trending','/app/top-rated','/app/genres','/app/platforms','/app/watchlist','/app/account','/signin','/signup'].includes(route)||route.startsWith('/app/movie/'))route='/index.html';
  if(!path.extname(route))route='/index.html';
  const file=path.resolve(root,'.'+route);if(!file.startsWith(root+path.sep)||!existsSync(file))return send(res,404,{error:'Not found'});
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-cache'});createReadStream(file).pipe(res);
}
await loadDb();
if (!process.env.VERCEL) {
  http.createServer((req,res)=>handler(req,res).catch(err=>{if([400,413].includes(err.statusCode))return send(res,err.statusCode,{error:err.message});console.error(err);send(res,500,{error:'Something went wrong. Please try again.'});})).listen(port,()=>console.log(`Nexora is ready at http://localhost:${port}`));
}

