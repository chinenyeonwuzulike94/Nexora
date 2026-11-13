import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
// Vercel function instances have a read-only project filesystem. /tmp works for
// demo data during a warm instance; local runs use the project data directory.
const dataDir = process.env.VERCEL ? path.join('/tmp', 'nexora-demo-data') : path.join(root, 'data');
const dbPath = path.join(dataDir, 'nexora.json');
const port = Number(process.env.PORT || 4173);
const movieSeed = [
  { id:'odyssey', title:'The Odyssey', year:2026, rating:'8.9', genre:'Adventure', type:'Movie', platform:'Cinemax', poster:'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', art:'linear-gradient(145deg,#1c3445,#c18957 48%,#090d12)', featured:true, description:'A legendary journey across a world of gods, monsters and impossible choices.' },
  { id:'dune-two', title:'Dune: Part Two', year:2024, rating:'8.6', genre:'Sci-Fi', type:'Movie', platform:'Max', poster:'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', art:'linear-gradient(160deg,#c98139,#1e2940 52%,#0b1220)', description:'Paul Atreides joins the Fremen on a mythic journey toward justice and destiny.' },
  { id:'oppenheimer', title:'Oppenheimer', year:2023, rating:'8.3', genre:'Drama', type:'Movie', platform:'Prime Video', poster:'https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg', art:'linear-gradient(160deg,#e59230,#221717 70%)', description:'The story of the scientist whose work changed the course of history.' },
  { id:'spiderverse', title:'Across the Spider-Verse', year:2023, rating:'8.6', genre:'Animation', type:'Movie', platform:'Netflix', poster:'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', art:'linear-gradient(145deg,#f03e86,#253887 55%,#101222)', description:'Miles Morales swings into a multiverse of heroes and hard choices.' },
  { id:'batman', title:'The Batman', year:2022, rating:'7.8', genre:'Action', type:'Movie', platform:'Max', poster:'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg', art:'linear-gradient(160deg,#91332e,#0c1824 68%)', description:'A young Batman follows a trail of clues through a rain-soaked Gotham.' },
  { id:'moana-two', title:'Moana 2', year:2024, rating:'7.0', genre:'Adventure', type:'Movie', platform:'Disney+', poster:'https://image.tmdb.org/t/p/w500/5aQ5R8n7Y3G0F3Kf7Y2k3j7uPpY.jpg', art:'linear-gradient(160deg,#25a9a6,#f5a957 60%,#073e50)', description:'Moana answers a call from the ocean and sets sail beyond familiar waters.' },
  { id:'the-bear', title:'The Bear', year:2024, rating:'8.7', genre:'Drama', type:'TV Show', platform:'Hulu', poster:'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg', art:'linear-gradient(160deg,#d78b48,#45241b 70%)', description:'A chef returns home to run a family sandwich shop and finds a new team.' },
  { id:'arcane', title:'Arcane', year:2024, rating:'9.0', genre:'Animation', type:'TV Show', platform:'Netflix', poster:'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg', art:'linear-gradient(160deg,#35a1a4,#412246 72%)', description:'Two sisters find themselves on opposite sides of a growing conflict.' },
  { id:'severance', title:'Severance', year:2025, rating:'8.7', genre:'Sci-Fi', type:'TV Show', platform:'Apple TV+', poster:'https://image.tmdb.org/t/p/w500/lFf6LLrQjYldcZItzOkGmMMigP7.jpg', art:'linear-gradient(160deg,#e9efe7,#275951 75%)', description:'Office workers undergo a procedure that divides their work and personal lives.' },
  { id:'wicked', title:'Wicked', year:2024, rating:'7.6', genre:'Fantasy', type:'Movie', platform:'Peacock', poster:'https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg', art:'linear-gradient(160deg,#26a06f,#323d68 70%)', description:'Two unlikely friends discover who they are before the world names them.' },
  { id:'the-menu', title:'The Menu', year:2022, rating:'7.2', genre:'Thriller', type:'Movie', platform:'Hulu', poster:'https://image.tmdb.org/t/p/w500/fPtUgMcLIboqlTlPrq0bQpKK8eq.jpg', art:'linear-gradient(160deg,#b77043,#131a1c 70%)', description:'A couple visits an exclusive restaurant where the evening has a surprising menu.' },
  { id:'inside-out-two', title:'Inside Out 2', year:2024, rating:'7.6', genre:'Family', type:'Movie', platform:'Disney+', poster:'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZVzLvDESb2QY.jpg', art:'linear-gradient(160deg,#ef784e,#7d56be 70%)', description:'Riley navigates new emotions as she grows into a new chapter of life.' }
];
const testimonialSeed = [
  { id:'t1', name:'Amara O.', role:'Film lover', quote:'I used to spend more time looking for a movie than watching one. Nexora makes the good stuff easy to find.', rating:5, initials:'AO', color:'#7c3aed' },
  { id:'t2', name:'Daniel K.', role:'Weekend binge watcher', quote:'The platform filters are the feature I did not know I needed. One quick search and we are already watching.', rating:5, initials:'DK', color:'#ec4899' },
  { id:'t3', name:'Tomi A.', role:'Series enthusiast', quote:'My watchlist finally lives in one place. Discovering something new for movie night feels effortless.', rating:5, initials:'TA', color:'#14877c' }
];
let db;
const sessions = new Map();
async function loadDb(){
  await mkdir(dataDir,{recursive:true});
  try { db=JSON.parse(await readFile(dbPath,'utf8')); }
  catch { db={users:[],watchlists:{},newsletter:[],testimonials:[]}; await saveDb(); }
}
async function saveDb(){ await writeFile(dbPath,JSON.stringify(db,null,2)); }
function send(res,status,body,headers={}){res.writeHead(status,{'content-type':'application/json; charset=utf-8',...headers});res.end(JSON.stringify(body));}
async function bodyJson(req){let raw='';for await(const chunk of req)raw+=chunk;if(raw.length>1_000_000)throw new Error('Request too large');return raw?JSON.parse(raw):{};}
function currentUser(req){const token=(req.headers.cookie||'').match(/nexora_session=([^;]+)/)?.[1];return token?sessions.get(token):null;}
function safeUser(u){return u?{id:u.id,name:u.name,email:u.email}:null;}
function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
export async function handler(req,res){
  const url=new URL(req.url,'http://localhost');let route=decodeURIComponent(url.pathname);
  if(req.method==='GET'&&route==='/api/health')return send(res,200,{ok:true,name:'Nexora API',movies:movieSeed.length});
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
    if(req.method==='GET'&&route==='/api/auth/me')return send(res,200,{user:safeUser(currentUser(req))});
    if(req.method==='POST'&&(route==='/api/auth/register'||route==='/api/auth/login')){
      const b=await bodyJson(req),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');if(!/^\S+@\S+\.\S+$/.test(email)||password.length<8)return send(res,400,{error:'Use a valid email and a password with at least 8 characters.'});
      let user=db.users.find(u=>u.email===email);
      if(route.endsWith('register')){if(user)return send(res,409,{error:'An account with this email already exists.'});const salt=randomBytes(16).toString('hex');user={id:randomBytes(12).toString('hex'),name:String(b.name||email.split('@')[0]).slice(0,60),email,salt,hash:scryptSync(password,salt,64).toString('hex')};db.users.push(user);await saveDb();}
      else if(!user||!timingSafeEqual(Buffer.from(user.hash,'hex'),scryptSync(password,user.salt,64)))return send(res,401,{error:'That email and password combination was not found.'});
      const token=randomBytes(24).toString('hex');sessions.set(token,user);return send(res,200,{user:safeUser(user)},{'set-cookie':`nexora_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`});
    }
    if(req.method==='POST'&&route==='/api/auth/logout'){const token=(req.headers.cookie||'').match(/nexora_session=([^;]+)/)?.[1];if(token)sessions.delete(token);return send(res,200,{ok:true},{'set-cookie':'nexora_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'});}
  }
  if(route==='/api/watchlist'&&req.method==='GET'){const user=currentUser(req),key=user?.id||req.headers['x-demo-user']||'guest';return send(res,200,{ids:db.watchlists[key]||[]});}
  if(route==='/api/watchlist'&&req.method==='POST'){const b=await bodyJson(req),user=currentUser(req),key=user?.id||req.headers['x-demo-user']||'guest';if(!movieSeed.some(m=>m.id===b.id))return send(res,404,{error:'Movie not found.'});db.watchlists[key]=[...new Set([...(db.watchlists[key]||[]),b.id])];await saveDb();return send(res,200,{ids:db.watchlists[key]});}
  if(route.startsWith('/api/watchlist/')&&req.method==='DELETE'){const id=route.split('/').pop(),user=currentUser(req),key=user?.id||req.headers['x-demo-user']||'guest';db.watchlists[key]=(db.watchlists[key]||[]).filter(x=>x!==id);await saveDb();return send(res,200,{ids:db.watchlists[key]});}
  if(route.startsWith('/api/'))return send(res,404,{error:'API route not found.'});
  if(route==='/')route='/index.html';
  if(['/testimonials','/app','/app/','/app/discover','/app/trending','/app/top-rated','/app/genres','/app/platforms','/app/watchlist','/app/account','/signin','/signup'].includes(route)||route.startsWith('/app/movie/'))route='/index.html';
  const file=path.resolve(root,'.'+route);if(!file.startsWith(root+path.sep)||!existsSync(file))return send(res,404,{error:'Not found'});
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-cache'});createReadStream(file).pipe(res);
}
await loadDb();
if (!process.env.VERCEL) {
  http.createServer((req,res)=>handler(req,res).catch(err=>{console.error(err);send(res,500,{error:'Something went wrong. Please try again.'});})).listen(port,()=>console.log(`Nexora is ready at http://localhost:${port}`));
}

