const frame=document.getElementById('webFrame');let historyStack=[];let historyIndex=-1;let currentTarget='';
function applyTheme(){document.documentElement.setAttribute('data-theme',localStorage.getItem('ug_theme')||'green')}applyTheme();window.addEventListener('storage',e=>{if(e.key==='ug_theme')applyTheme()});
const engines={google:q=>`https://www.google.com/search?q=${encodeURIComponent(q)}`};
function isUrl(v){return /^(https?:\/\/)/i.test(v)||/^[^\s]+\.[^\s]+/.test(v)}
function normalize(v){v=v.trim();if(!v)return '';if(isUrl(v))return /^https?:\/\//i.test(v)?v:`https://${v}`;return engines.google(v)}
async function load(url,push=true){url=normalize(url);if(!url)return;currentTarget=url;try{if(!navigator.serviceWorker.controller)await navigator.serviceWorker.register('../sw.js',{scope:'/'});await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller){navigator.serviceWorker.addEventListener('controllerchange',()=>load(url,false),{once:true});return}if(!window.__uv$config){await new Promise((resolve,reject)=>{const a=document.createElement('script'),b=document.createElement('script');a.src='../uv/uv.bundle.js';b.src='../uv/uv.config.js';b.onload=()=>window.__uv$config?resolve():reject();document.head.append(a,b);})}frame.src=__uv$config.prefix+__uv$config.encodeUrl(url)}catch(e){frame.src=url}if(push){historyStack=historyStack.slice(0,historyIndex+1);historyStack.push(url);historyIndex++}}
function home(){location.href='games.html'}
document.getElementById('backBtn').onclick=()=>{if(historyIndex>0){historyIndex--;load(historyStack[historyIndex],false)}};
document.getElementById('forwardBtn').onclick=()=>{if(historyIndex<historyStack.length-1){historyIndex++;load(historyStack[historyIndex],false)}};
document.getElementById('reloadBtn').onclick=()=>currentTarget&&load(currentTarget,false);
document.getElementById('homeBtn').onclick=home;document.getElementById('fullscreenBtn').onclick=()=>frame.requestFullscreen?.();
load(new URLSearchParams(location.search).get('url')||'https://www.google.com');
