const frame = document.getElementById('webFrame');
const address = document.getElementById('addressBar');
const loading = document.getElementById('loading');
const menu = document.getElementById('menu');
let historyStack = [];
let historyIndex = -1;
let currentTarget = '';

const engines = {
  google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  bing: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  duckduckgo: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  brave: q => `https://search.brave.com/search?q=${encodeURIComponent(q)}`
};

function isUrl(value){ return /^(https?:\/\/)/i.test(value) || /^[^\s]+\.[^\s]+/.test(value); }
function normalize(value){
  value = value.trim();
  if(!value) return '';
  if(isUrl(value)) return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const engine = localStorage.getItem('ug_search_engine') || 'google';
  return (engines[engine] || engines.google)(value);
}

async function encodeForUV(url){
  return __uv$config.encodeUrl(url);
}

async function load(url, push=true){
  url = normalize(url);
  if(!url) return;
  currentTarget = url;
  address.value = url;
  loading.classList.remove('hidden');
  const proxy = localStorage.getItem('ug_proxy') || 'utopia';
  if(proxy === 'utopia'){
    try{
      await navigator.serviceWorker.register('./sw.js', {scope: __uv$config.prefix});
      await navigator.serviceWorker.ready;
      frame.src = __uv$config.prefix + await encodeForUV(url);
    }catch(err){
      loading.querySelector('span').textContent = 'Utopia proxy could not start. Try Direct in Settings.';
      frame.src = url;
    }
  }else{
    frame.src = url;
  }
  if(push){
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(url);
    historyIndex++;
  }
}

function getInitial(){
  const p = new URLSearchParams(location.search);
  return p.get('url') || 'https://www.google.com';
}

frame.addEventListener('load',()=>{
  loading.classList.add('hidden');
});
document.getElementById('addressForm').addEventListener('submit',e=>{e.preventDefault();load(address.value)});
document.getElementById('backBtn').onclick=()=>{if(historyIndex>0){historyIndex--;load(historyStack[historyIndex],false)}};
document.getElementById('forwardBtn').onclick=()=>{if(historyIndex<historyStack.length-1){historyIndex++;load(historyStack[historyIndex],false)}};
document.getElementById('reloadBtn').onclick=()=>{loading.classList.remove('hidden');frame.src=frame.src};
document.getElementById('fullscreenBtn').onclick=()=>{if(frame.requestFullscreen)frame.requestFullscreen()};
document.getElementById('newTabBtn').onclick=()=>window.open(currentTarget,'_blank','noopener');
document.getElementById('menuBtn').onclick=()=>menu.classList.toggle('open');
document.getElementById('homeBtn').onclick=()=>{location.href='games.html'};
document.getElementById('openBtn').onclick=()=>window.open(currentTarget,'_blank','noopener');
document.getElementById('copyBtn').onclick=async()=>{try{await navigator.clipboard.writeText(currentTarget)}catch(e){}};
document.addEventListener('click',e=>{if(!menu.contains(e.target)&&e.target.id!=='menuBtn')menu.classList.remove('open')});

load(getInitial());
