/* ---------- Games data ---------- */
let games = [];
const grid = document.getElementById('grid');
const emptyNote = document.getElementById('emptyNote');
const gameSearch = document.getElementById('gameSearch');
const categorySelect = document.getElementById('categorySelect');
const allGamesTab = document.getElementById('allGamesTab');
const favoriteGamesTab = document.getElementById('favoriteGamesTab');
const favoriteCount = document.getElementById('favoriteCount');
let favoritesOnly = false;

function assetUrl(path){ return path ? (path.startsWith('/') || /^https?:\/\//i.test(path) ? path : '/unblocked-games/' + path.replace(/^\.\//,'')) : ''; }
function faviconFor(url){ try { return `https://www.google.com/s2/favicons?sz=128&domain=${new URL(url).hostname}`; } catch(e){ return ''; } }
function favoriteSet(){ try{return new Set(JSON.parse(localStorage.getItem('ug_favorites')||'[]'));}catch(_){return new Set();} }
function saveFavorites(set){localStorage.setItem('ug_favorites',JSON.stringify([...set]));}
function isFavorite(url){return favoriteSet().has(url)}
function toggleFavorite(url){const set=favoriteSet();set.has(url)?set.delete(url):set.add(url);saveFavorites(set);updateFavoriteUI();renderGrid();}
function updateFavoriteUI(){
  const n=favoriteSet().size;
  if(favoriteCount) favoriteCount.textContent=n;
  allGamesTab?.classList.toggle('active',!favoritesOnly); favoriteGamesTab?.classList.toggle('active',favoritesOnly);
  allGamesTab?.setAttribute('aria-selected',String(!favoritesOnly)); favoriteGamesTab?.setAttribute('aria-selected',String(favoritesOnly));
}
function populateCategories(){
  const allCats=new Set(); games.forEach(g=>(g.categories||[]).forEach(c=>allCats.add(c)));
  categorySelect.innerHTML=['All',...Array.from(allCats).sort()].map(c=>`<option value="${c}">${c==='All'?'All Categories':c}</option>`).join('');
}

const voteStore=new Map();
function voteKey(url){return 'ug_votes_'+encodeURIComponent(url)}
function getVotes(url){
  if(voteStore.has(url)) return voteStore.get(url);
  try{return JSON.parse(localStorage.getItem(voteKey(url))||'{"likes":0,"dislikes":0,"voters":{}}')}catch(_){return {likes:0,dislikes:0,voters:{}}}
}
function voterKey(){const user=window.UGAuth?.getUser?.();return user?.username||localStorage.getItem('ug_current_user')||'device'}
async function loadServerVotes(){
  try{const res=await fetch('/api/votes',{credentials:'same-origin'});if(!res.ok)throw new Error();const data=await res.json();voteStore.clear();Object.entries(data.votes||{}).forEach(([url,v])=>voteStore.set(url,{likes:v.likes||0,dislikes:v.dislikes||0,myVote:v.myVote||null}));renderGrid();}catch(_){}
}
async function voteGame(url,type){
  const user=window.UGAuth?.getUser?.();
  if(!user||user.local){
    const v=getVotes(url),key=voterKey(),old=v.myVote||v.voters?.[key]||null;
    if(old===type){v[type==='like'?'likes':'dislikes']=Math.max(0,v[type==='like'?'likes':'dislikes']-1);if(v.voters)delete v.voters[key];v.myVote=null;}
    else{if(old)v[old==='like'?'likes':'dislikes']=Math.max(0,v[old==='like'?'likes':'dislikes']-1);v[type==='like'?'likes':'dislikes']++;v.myVote=type;if(v.voters)v.voters[key]=type;}
    localStorage.setItem(voteKey(url),JSON.stringify(v));voteStore.set(url,v);renderGrid();return;
  }
  try{const res=await fetch('/api/vote',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,type})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Vote failed');voteStore.set(url,data.vote);renderGrid();}catch(err){alert(err.message||'Could not save your vote.');}
}
function cardHTML(g){
  const img=assetUrl(g.thumbnail)||faviconFor(g.url), v=getVotes(g.url), who=v.myVote||v.voters?.[voterKey()]||null;
  const fav=isFavorite(g.url);
  return `<div class="card" data-url="${g.url}" data-name="${g.name}" tabindex="0" role="button" aria-label="Play ${g.name}">
    <div class="thumb">
      <img src="${img}" alt="${g.name}" loading="lazy" onerror="this.style.display='none'">
      ${g.badge?`<span class="badge">${g.badge}</span>`:''}
      <button class="favorite-card ${fav?'active':''}" data-favorite="1" title="${fav?'Remove from favorites':'Add to favorites'}" aria-label="${fav?'Remove from favorites':'Add to favorites'}"><i class="bi ${fav?'bi-heart-fill':'bi-heart'}"></i></button>
      <div class="thumb-overlay"><span>${g.name}</span><i class="bi bi-play-fill"></i></div>
    </div>
    <div class="card-info">
      <div class="name-row"><div class="name" title="${g.name}">${g.name}</div><i class="bi bi-three-dots-vertical card-menu" aria-hidden="true"></i></div>
      <div class="description" title="${g.description||''}">${g.description||'Play now'}</div>
      <div class="card-meta">
        <button class="vote-card ${who==='like'?'active-like':''}" data-vote="like" title="Like"><i class="bi bi-hand-thumbs-up-fill"></i><span>${v.likes||0}</span></button>
        <button class="vote-card ${who==='dislike'?'active-dislike':''}" data-vote="dislike" title="Dislike"><i class="bi bi-hand-thumbs-down-fill"></i><span>${v.dislikes||0}</span></button>
      </div>
    </div>
  </div>`;
}
function renderGrid(){
  const q=gameSearch?.value?.trim().toLowerCase()||'',cat=categorySelect?.value||'All',favs=favoriteSet();
  const filtered=games.filter(g=>g.name.toLowerCase().includes(q)&&(cat==='All'||(g.categories||[]).includes(cat))&&(!favoritesOnly||favs.has(g.url)));
  grid.innerHTML=filtered.map(cardHTML).join('');emptyNote.style.display=filtered.length?'none':'block';emptyNote.textContent=favoritesOnly?'You have no favorite games yet.':'No games match that search.';
  updateFavoriteUI();
}

fetch('/unblocked-games/games.json').then(r=>r.json()).then(data=>{games=data;if(gameSearch) gameSearch.placeholder=`Search through our ${games.length} games!`;populateCategories();renderGrid();}).catch(()=>{emptyNote.style.display='block';emptyNote.textContent='Could not load games.json.';});
allGamesTab?.addEventListener('click',()=>{favoritesOnly=false;renderGrid()});
favoriteGamesTab?.addEventListener('click',()=>{favoritesOnly=true;renderGrid()});
gameSearch?.addEventListener('input',renderGrid);categorySelect?.addEventListener('change',renderGrid);
window.addEventListener('ug-auth-changed',()=>{loadServerVotes();renderGrid()});
loadServerVotes();
function openCard(card){location.href=`/player?type=game&url=${encodeURIComponent(card.dataset.url)}&title=${encodeURIComponent(card.dataset.name)}`}
grid.addEventListener('click',e=>{
  const fav=e.target.closest('[data-favorite]'); if(fav){e.preventDefault();e.stopPropagation();toggleFavorite(fav.closest('.card').dataset.url);return;}
  const vote=e.target.closest('.vote-card'); if(vote){e.preventDefault();e.stopPropagation();voteGame(vote.closest('.card').dataset.url,vote.dataset.vote);return;}
  const card=e.target.closest('.card');if(card)openCard(card);
});
grid.addEventListener('keydown',e=>{const card=e.target.closest('.card');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openCard(card)}});
