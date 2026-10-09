/* ---------- Games data ----------
  Loaded from miscG.json (edit that file to add/remove games).
   Thumbnails are pulled live from each game's own favicon.
--------------------------------------------------- */
let games = [];

const grid = document.getElementById('grid');
const emptyNote = document.getElementById('emptyNote');

function faviconFor(url){
  try{
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
  }catch(e){
    return '';
  }
}

function populateCategories(){
  const allCats = new Set();
  games.forEach(g => (g.categories || []).forEach(c => allCats.add(c)));
  const cats = ["All", ...Array.from(allCats).sort()];
  categorySelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

const voteStore = new Map();
let votesLoaded = false;

function voteKey(url){ return 'ug_votes_' + encodeURIComponent(url); }
function getVotes(url){
  if(voteStore.has(url)) return voteStore.get(url);
  try{
    const local=JSON.parse(localStorage.getItem(voteKey(url))||'{"likes":0,"dislikes":0,"voters":{}}');
    return local;
  }catch(_){ return {likes:0,dislikes:0,voters:{}}; }
}
function voterKey(){
  const user=window.UGAuth?.getUser?.();
  return user?.username || localStorage.getItem('ug_current_user') || 'device';
}
async function loadServerVotes(){
  try{
    const res=await fetch('/api/votes',{credentials:'same-origin'});
    if(!res.ok) throw new Error();
    const data=await res.json();
    voteStore.clear();
    Object.entries(data.votes||{}).forEach(([url,v])=>voteStore.set(url,{likes:v.likes||0,dislikes:v.dislikes||0,myVote:v.myVote||null}));
    votesLoaded=true; renderGrid();
  }catch(_){ votesLoaded=false; }
}
async function voteGame(url,type){
  const user=window.UGAuth?.getUser?.();
  if(!user || user.local){
    const v=getVotes(url), key=voterKey(), old=v.myVote || v.voters?.[key] || null;
    if(old===type){
      v[type==='like'?'likes':'dislikes']=Math.max(0,v[type==='like'?'likes':'dislikes']-1);
      if(v.voters) delete v.voters[key]; v.myVote=null;
    }else{
      if(old) v[old==='like'?'likes':'dislikes']=Math.max(0,v[old==='like'?'likes':'dislikes']-1);
      v[type==='like'?'likes':'dislikes']++; v.myVote=type; if(v.voters) v.voters[key]=type;
    }
    localStorage.setItem(voteKey(url),JSON.stringify(v)); voteStore.set(url,{likes:v.likes,dislikes:v.dislikes,myVote:v.myVote||null}); renderGrid(); return;
  }
  try{
    const res=await fetch('/api/vote',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,type})});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'Vote failed');
    voteStore.set(url,data.vote); renderGrid();
  }catch(err){ alert(err.message||'Could not save your vote.'); }
}
function cardHTML(g){
  const badgeHtml = g.badge ? `<span class="badge">${g.badge}</span>` : '';
  const img = g.image || g.thumbnail || faviconFor(g.url);
  const category = (g.categories || []).join(', ') || 'Game';
  const description = g.description || `Play ${category.toLowerCase()} game`;
  return `
    <div class="card" data-url="${g.url}" data-name="${g.name}" tabindex="0" role="button" aria-label="Play ${g.name}">
      <div class="thumb">
        ${badgeHtml}
        <img src="${img}" alt="${g.name}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="card-info">
        <div class="name-row">
          <div class="name" title="${g.name}">${g.name}</div>
          <i class="bi bi-three-dots-vertical card-menu" aria-hidden="true"></i>
        </div>
        <div class="description" title="${description}">${description}</div>
      </div>
    </div>
  `;
}

function renderGrid(){
  grid.innerHTML = games.map(cardHTML).join('');
  emptyNote.style.display = games.length === 0 ? 'block' : 'none';
  emptyNote.textContent = 'No games available.';
}

fetch('miscG.json')
  .then(res => res.json())
  .then(data => {
    games = Array.isArray(data) ? data : [];
    renderGrid();
  })
  .catch(() => {
    emptyNote.style.display = 'block';
    emptyNote.textContent = 'Could not load miscG.json.';
  });

window.addEventListener('ug-auth-changed', () => { loadServerVotes(); renderGrid(); });
loadServerVotes();

/* ---------- Open games in a minimal about:blank tab ---------- */
function openCard(card){
  const win=window.open('about:blank','_blank');
  const playerUrl=`/unb/player-file.html?type=game&proxy=false&url=${encodeURIComponent(card.dataset.url)}&title=${encodeURIComponent(card.dataset.name||'Game')}`;
  if(!win){ location.href=playerUrl; return; }
  win.document.open();
  win.document.write(`<!doctype html><html><head><title>${card.dataset.name||'Game'}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,iframe{width:100%;height:100%;margin:0;border:0;display:block;background:#000}</style></head><body><iframe src="${playerUrl}" frameborder="0" allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write; accelerometer; gyroscope; web-share" allowfullscreen referrerpolicy="no-referrer"></iframe></body></html>`);
  win.document.close();
}

grid.addEventListener('click', e => {
  const card=e.target.closest('.card'); if(card) openCard(card);
});
grid.addEventListener('keydown',e=>{const card=e.target.closest('.card');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openCard(card)}});
