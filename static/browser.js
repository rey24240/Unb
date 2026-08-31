const frame=document.getElementById('webFrame');
const pageParams=new URLSearchParams(location.search);
const pageTitle=pageParams.get('title');
const pageType=pageParams.get('type')||'browser';
const loadingEl=document.getElementById('loading');
frame.addEventListener('load',()=>loadingEl?.classList.add('hidden'));

if(pageTitle) document.title=pageTitle+' — Game Player';let historyStack=[];let historyIndex=-1;let currentTarget='';window.__currentGameUrl='';
function applyTheme(){document.documentElement.setAttribute('data-theme',localStorage.getItem('ug_theme')||'green')}applyTheme();window.addEventListener('storage',e=>{if(e.key==='ug_theme')applyTheme()});
const engines={google:q=>`https://www.google.com/search?q=${encodeURIComponent(q)}`};
function isUrl(v){return /^(https?:\/\/)/i.test(v)||/^[^\s]+\.[^\s]+/.test(v)}
function normalize(v){v=v.trim();if(!v)return '';if(isUrl(v))return /^https?:\/\//i.test(v)?v:`https://${v}`;return engines.google(v)}
async function load(url,push=true){url=normalize(url);if(!url)return;currentTarget=url;window.__currentGameUrl=url;try{await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller){const key='ug_browser_sw_reload';if(!sessionStorage.getItem(key)){sessionStorage.setItem(key,'1');location.reload();return}throw new Error('Proxy service worker did not take control.')}sessionStorage.removeItem('ug_browser_sw_reload');if(!window.__uv$config){await new Promise((resolve,reject)=>{const a=document.createElement('script'),b=document.createElement('script');a.src='/uv/uv.bundle.js';b.src='/uv/uv.config.js';b.onload=()=>window.__uv$config?resolve():reject();a.onerror=b.onerror=reject;document.head.append(a,b);})}frame.src=__uv$config.prefix+__uv$config.encodeUrl(url)}catch(e){console.error('Proxy load failed',e);frame.src=url}if(push){historyStack=historyStack.slice(0,historyIndex+1);historyStack.push(url);historyIndex++}}
function home(){location.href=pageType==='app'?'/static/apps.html':'/static/site.html'}
document.getElementById('backBtn').onclick=()=>{if(historyIndex>0){historyIndex--;load(historyStack[historyIndex],false)}};
document.getElementById('forwardBtn').onclick=()=>{if(historyIndex<historyStack.length-1){historyIndex++;load(historyStack[historyIndex],false)}};
document.getElementById('reloadBtn').onclick=()=>currentTarget&&load(currentTarget,false);
document.getElementById('homeBtn').onclick=home;document.getElementById('fullscreenBtn').onclick=()=>frame.requestFullscreen?.();
load(pageParams.get('url')||'https://www.google.com');


/* Save-data panel */
const savePanel=document.getElementById('savePanel');
const saveStatus=document.getElementById('saveStatus');
function openSavePanel(){savePanel?.classList.add('open');savePanel?.setAttribute('aria-hidden','false');updateSaveStatus()}
function closeSavePanel(){savePanel?.classList.remove('open');savePanel?.setAttribute('aria-hidden','true')}
function saveAction(name){window.dispatchEvent(new CustomEvent('ug-save-request',{detail:name}))}
function updateSaveStatus(){if(!saveStatus)return;saveStatus.textContent=window.UGGameSave?.has?.()?'A save exists for this game.':'No save found for this game.'}
document.getElementById('saveBtn')?.addEventListener('click',openSavePanel);
document.getElementById('saveClose')?.addEventListener('click',closeSavePanel);
document.getElementById('saveNow')?.addEventListener('click',()=>{saveAction('save');setTimeout(updateSaveStatus,50)});
document.getElementById('loadSave')?.addEventListener('click',()=>saveAction('load'));
document.getElementById('exportSave')?.addEventListener('click',()=>saveAction('download'));
document.getElementById('importSave')?.addEventListener('click',()=>document.getElementById('saveFile')?.click());
document.getElementById('saveFile')?.addEventListener('change',e=>window.UGGameSave?.importFile(e.target.files?.[0]));
document.getElementById('deleteSave')?.addEventListener('click',()=>{if(confirm('Delete the saved data for this game?')){saveAction('delete');setTimeout(updateSaveStatus,50)}});
window.addEventListener('ug-save-toast',e=>{if(saveStatus){saveStatus.textContent=e.detail.message;saveStatus.dataset.type=e.detail.type||'ok'}setTimeout(updateSaveStatus,1800)});

/* ---------- Player vote system ---------- */
(function(){
  const params=new URLSearchParams(location.search), gameUrl=params.get('url')||'';
  const likeBtn=document.getElementById('likeBtn'), dislikeBtn=document.getElementById('dislikeBtn');
  const likeCount=document.getElementById('likeCount'), dislikeCount=document.getElementById('dislikeCount');
  if(!likeBtn||!dislikeBtn||!gameUrl)return;
  const key='ug_votes_'+encodeURIComponent(gameUrl);
  function local(){try{return JSON.parse(localStorage.getItem(key)||'{"likes":0,"dislikes":0,"myVote":null}')}catch(_){return {likes:0,dislikes:0,myVote:null}}}
  function paint(v){likeCount.textContent=v.likes||0;dislikeCount.textContent=v.dislikes||0;likeBtn.classList.toggle('active-like',v.myVote==='like');dislikeBtn.classList.toggle('active-dislike',v.myVote==='dislike')}
  async function load(){try{const r=await fetch('/api/votes',{credentials:'same-origin'});if(!r.ok)throw 0;const d=await r.json();const v=d.votes?.[gameUrl];if(v){paint(v);return}}catch(_){}paint(local())}
  async function vote(type){
    let v=local(),old=v.myVote||null;
    try{
      const r=await fetch('/api/vote',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:gameUrl,type})});
      const d=await r.json();if(r.ok&&d.vote){paint(d.vote);return}
    }catch(_){}
    if(old===type){v[type==='like'?'likes':'dislikes']=Math.max(0,(v[type==='like'?'likes':'dislikes']||0)-1);v.myVote=null}
    else{if(old)v[old==='like'?'likes':'dislikes']=Math.max(0,(v[old==='like'?'likes':'dislikes']||0)-1);v[type==='like'?'likes':'dislikes']=(v[type==='like'?'likes':'dislikes']||0)+1;v.myVote=type}
    localStorage.setItem(key,JSON.stringify(v));paint(v)
  }
  likeBtn.addEventListener('click',()=>vote('like'));dislikeBtn.addEventListener('click',()=>vote('dislike'));load();
})();
