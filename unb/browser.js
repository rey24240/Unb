const frame=document.getElementById('webFrame');
const loading=document.getElementById('loading');
let historyStack=[];let historyIndex=-1;let currentTarget='';
function applyTheme(){document.documentElement.setAttribute('data-theme',localStorage.getItem('ug_theme')||'green')}applyTheme();window.addEventListener('storage',e=>{if(e.key==='ug_theme')applyTheme()});
const engines={google:q=>`https://www.google.com/search?q=${encodeURIComponent(q)}`,bing:q=>`https://www.bing.com/search?q=${encodeURIComponent(q)}`,duckduckgo:q=>`https://duckduckgo.com/?q=${encodeURIComponent(q)}`,brave:q=>`https://search.brave.com/search?q=${encodeURIComponent(q)}`};
function selectedEngine(){const key=localStorage.getItem('ug_search_engine')||'google';return engines[key]?key:'google'}
function isUrl(v){return /^(https?:\/\/)/i.test(v)||/^[^\s]+\.[^\s]+/.test(v)}
function normalize(v){v=v.trim();if(!v)return '';if(isUrl(v))return /^https?:\/\//i.test(v)?v:`https://${v}`;return engines[selectedEngine()](v)}
function hideLoading(){if(loading) loading.style.display='none';}
function fallbackToDirect(url){frame.src=url;setTimeout(hideLoading,250);}
async function load(url,push=true){url=normalize(url);if(!url)return;currentTarget=url;try{if('serviceWorker' in navigator && !navigator.serviceWorker.controller){try{await navigator.serviceWorker.register('../sw.js',{scope:'/'});}catch(_){};try{await navigator.serviceWorker.ready;}catch(_){};}if('serviceWorker' in navigator && !navigator.serviceWorker.controller){const timer=setTimeout(()=>fallbackToDirect(url),2000);navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);load(url,false);},{once:true});return;}if(!window.__uv$config){await new Promise((resolve,reject)=>{const a=document.createElement('script'),b=document.createElement('script');a.src='../uv/uv.bundle.js';b.src='../uv/uv.config.js';b.onload=()=>window.__uv$config?resolve():reject(new Error('UV config unavailable'));b.onerror=reject;document.head.append(a,b);})}frame.src=__uv$config.prefix+__uv$config.encodeUrl(url)}catch(e){fallbackToDirect(url)}if(push){historyStack=historyStack.slice(0,historyIndex+1);historyStack.push(url);historyIndex++}}
function home(){location.href='../index.html'}
document.getElementById('backBtn').onclick=()=>{if(historyIndex>0){historyIndex--;load(historyStack[historyIndex],false)}};
document.getElementById('forwardBtn').onclick=()=>{if(historyIndex<historyStack.length-1){historyIndex++;load(historyStack[historyIndex],false)}};
document.getElementById('reloadBtn').onclick=()=>currentTarget&&load(currentTarget,false);
document.getElementById('homeBtn').onclick=home;document.getElementById('fullscreenBtn').onclick=()=>frame.requestFullscreen?.();
frame.addEventListener('load',()=>{hideLoading();}, {once:false});
load(new URLSearchParams(location.search).get('url')||'https://www.google.com');
