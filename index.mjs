import createServer from '@tomphttp/bare-server-node';
import http from 'http';
import nodeStatic from 'node-static';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const port = process.env.PORT || 8080;
const DATA_DIR = path.resolve('./data');
const DATA_FILE = path.join(DATA_DIR,'data.json');
fs.mkdirSync(DATA_DIR,{recursive:true});
const bare = createServer('/bare/');
const serve = new nodeStatic.Server('static/');
const rootServe = new nodeStatic.Server('./');
const sessions = new Map();
let db=loadData();
function restoreSessions(){
  for(const [token,session] of Object.entries(db.sessions||{})){
    if(session && session.username && db.users[session.username]) sessions.set(token,session);
  }
}
restoreSessions();

function loadData(){
  try{
    const d=JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));
    d.users ||= {}; d.votes ||= {}; d.comments ||= {}; d.sessions ||= {};
    return d;
  }catch(_){return {users:{},votes:{},comments:{},sessions:{}}}
}
function saveData(){
  const tmp=DATA_FILE+'.tmp';
  fs.writeFileSync(tmp,JSON.stringify(db,null,2));
  fs.renameSync(tmp,DATA_FILE);
}
function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){
  const hash=crypto.scryptSync(password,salt,64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password,stored){
  const [salt,hash]=String(stored).split(':');
  if(!salt||!hash)return false;
  const candidate=crypto.scryptSync(password,salt,64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate,'hex'),Buffer.from(hash,'hex'));
}
function parseCookies(req){
  return Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{
    const i=x.indexOf('='); return [x.slice(0,i),decodeURIComponent(x.slice(i+1))];
  }));
}
function getSession(req){
  const token=parseCookies(req).ug_session;
  if(!token) return null;
  const session=sessions.get(token);
  if(!session || !db.users[session.username]) return null;
  return session;
}
function send(res,status,data,extra={}){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});
  res.end(JSON.stringify(data));
}
function body(req){
  return new Promise((resolve,reject)=>{
    let raw=''; req.on('data',c=>{raw+=c;if(raw.length>1e6)req.destroy()});
    req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch(e){reject(e)}});
    req.on('error',reject);
  });
}
function validUsername(u){return typeof u==='string'&&/^[a-zA-Z0-9_.-]{3,24}$/.test(u)}
function validUrl(u){try{const x=new URL(u);return /^https?:$/.test(x.protocol)&&u.length<=2000}catch(_){return false}}

async function api(req,res){
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(!url.pathname.startsWith('/api/')) return false;

  if(req.method==='GET' && url.pathname==='/api/me'){
    const s=getSession(req); return send(res,200,{user:s?{username:s.username}:null}),true;
  }
  if(req.method==='POST' && (url.pathname==='/api/signup'||url.pathname==='/api/login')){
    let b; try{b=await body(req)}catch(_){send(res,400,{error:'Invalid request.'});return true}
    const username=String(b.username||'').trim(), password=String(b.password||'');
    if(!validUsername(username)){send(res,400,{error:'Invalid username.'});return true}
    if(url.pathname==='/api/signup'){
      if(password.length<8){send(res,400,{error:'Password must be at least 8 characters.'});return true}
      if(db.users[username]){send(res,409,{error:'That username is already taken.'});return true}
      db.users[username]={password:hashPassword(password),createdAt:new Date().toISOString()};
      saveData();
    }else if(!db.users[username] || !verifyPassword(password,db.users[username].password)){
      send(res,401,{error:'Incorrect username or password.'});return true;
    }
    const token=crypto.randomBytes(32).toString('hex');
    const session={username,createdAt:Date.now()};
    sessions.set(token,session);
    db.sessions[token]=session;
    saveData();
    // Long-lived persistent login. The browser keeps the cookie for 10 years,
    // and the server restores the session from data/sessions after restarts.
    return send(res,200,{user:{username}},{'Set-Cookie':`ug_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=315360000`}),true;
  }
  if(req.method==='POST' && url.pathname==='/api/logout'){
    const cookies=parseCookies(req);
    if(cookies.ug_session){ sessions.delete(cookies.ug_session); delete db.sessions[cookies.ug_session]; saveData(); }
    return send(res,200,{ok:true},{'Set-Cookie':'ug_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'}),true;
  }
  if(req.method==='GET' && url.pathname==='/api/comments') {
    const game=String(url.searchParams.get('url')||'');
    if(!validUrl(game)){send(res,400,{error:'Invalid game URL.'});return true}
    const comments=(db.comments[game]||[]).map(c=>({id:c.id,author:c.author,text:c.text,date:c.date}));
    return send(res,200,{comments}),true;
  }
  if(req.method==='POST' && url.pathname==='/api/comments'){
    const session=getSession(req);
    if(!session){send(res,401,{error:'Log in to comment.'});return true}
    let b; try{b=await body(req)}catch(_){send(res,400,{error:'Invalid request.'});return true}
    const game=String(b.url||''), text=String(b.text||'').trim();
    if(!validUrl(game)||!text||text.length>2000){send(res,400,{error:'Invalid comment.'});return true}
    const list=db.comments[game] ||= [];
    const comment={id:crypto.randomBytes(12).toString('hex'),author:session.username,text,date:new Date().toISOString()};
    list.push(comment);
    saveData();
    return send(res,201,{comment}),true;
  }
  if(req.method==='GET' && url.pathname==='/api/settings'){
    const session=getSession(req);
    if(!session){send(res,401,{error:'Log in to sync settings.'});return true}
    return send(res,200,{settings:db.users[session.username]?.settings||{}}),true;
  }
  if(req.method==='POST' && url.pathname==='/api/settings'){
    const session=getSession(req);
    if(!session){send(res,401,{error:'Log in to sync settings.'});return true}
    let b; try{b=await body(req)}catch(_){send(res,400,{error:'Invalid request.'});return true}
    const allowed=['theme','proxy','searchEngine','reduceMotion','compactSidebar'];
    const clean={};
    for(const key of allowed){
      if(Object.prototype.hasOwnProperty.call(b,key)) clean[key]=b[key];
    }
    db.users[session.username].settings={...(db.users[session.username].settings||{}),...clean,updatedAt:new Date().toISOString()};
    saveData();
    return send(res,200,{ok:true,settings:db.users[session.username].settings}),true;
  }
  if(req.method==='POST' && url.pathname==='/api/save-data'){
    const session=getSession(req);
    if(!session){send(res,401,{error:'Log in to save data.'});return true}
    saveData();
    const stamp=new Date().toISOString();
    return send(res,200,{ok:true,savedAt:stamp}),true;
  }
  if(req.method==='GET' && url.pathname==='/api/votes'){
    const session=getSession(req), votes={};
    for(const [game,v] of Object.entries(db.votes)){
      votes[game]={likes:v.likes||0,dislikes:v.dislikes||0,myVote:session?.username ? (v.voters?.[session.username]||null) : null};
    }
    return send(res,200,{votes}),true;
  }
  if(req.method==='POST' && url.pathname==='/api/vote'){
    const session=getSession(req); if(!session){send(res,401,{error:'Log in to vote on games.'});return true}
    let b; try{b=await body(req)}catch(_){send(res,400,{error:'Invalid request.'});return true}
    const game=String(b.url||''), type=String(b.type||'');
    if(!validUrl(game)||!['like','dislike'].includes(type)){send(res,400,{error:'Invalid vote.'});return true}
    const v=db.votes[game] ||= {likes:0,dislikes:0,voters:{}};
    const old=v.voters[session.username]||null;
    if(old===type){
      v[type==='like'?'likes':'dislikes']=Math.max(0,v[type==='like'?'likes':'dislikes']-1);
      delete v.voters[session.username];
    }else{
      if(old)v[old==='like'?'likes':'dislikes']=Math.max(0,v[old==='like'?'likes':'dislikes']-1);
      v[type==='like'?'likes':'dislikes']++;v.voters[session.username]=type;
    }
    saveData();
    return send(res,200,{vote:{likes:v.likes,dislikes:v.dislikes,myVote:v.voters[session.username]||null}}),true;
  }
  send(res,404,{error:'API route not found.'}); return true;
}

const server=http.createServer(async(req,res)=>{
  try{
    if(await api(req,res)) return;
    if(bare.shouldRoute(req)) return bare.routeRequest(req,res);
    if(req.url.startsWith('/uv/') || req.url==='/sw.js') return rootServe.serve(req,res);
    serve.serve(req,res);
  }catch(err){
    if(!res.headersSent) send(res,500,{error:'Server error.'});
    else res.end();
  }
});
server.on('upgrade',(req,socket,head)=>{
  if(bare.shouldRoute(req,socket,head)) bare.routeUpgrade(req,socket,head);
  else socket.end();
});
server.listen({port});
console.log(`Listening on http://localhost:${port}`);
