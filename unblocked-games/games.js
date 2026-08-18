/* ---------- Games data ----------
   Loaded from games.json (edit that file to add/remove games).
   Thumbnails are pulled live from each game's own favicon.
--------------------------------------------------- */
let games = [];

const grid = document.getElementById('grid');
const emptyNote = document.getElementById('emptyNote');
const gameSearch = document.getElementById('gameSearch');
const categorySelect = document.getElementById('categorySelect');

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

function voteKey(url){ return 'ug_votes_' + encodeURIComponent(url); }
function getVotes(url){
  try{ return JSON.parse(localStorage.getItem(voteKey(url)) || '{"likes":0,"dislikes":0,"voters":{}}'); }
  catch(e){ return {likes:0,dislikes:0,voters:{}}; }
}
function voterKey(){ return localStorage.getItem('ug_current_user') || 'device'; }
function voteGame(url, type){
  const v=getVotes(url), key=voterKey(), old=v.voters[key];
  if(old===type){
    v[type==='like'?'likes':'dislikes']=Math.max(0,v[type==='like'?'likes':'dislikes']-1);
    delete v.voters[key];
  }else{
    if(old) v[old==='like'?'likes':'dislikes']=Math.max(0,v[old==='like'?'likes':'dislikes']-1);
    v[type==='like'?'likes':'dislikes']++;
    v.voters[key]=type;
  }
  localStorage.setItem(voteKey(url), JSON.stringify(v));
  renderGrid();
}

function cardHTML(g){
  const badgeHtml = g.badge ? `<span class="badge">${g.badge}</span>` : '';
  const img = g.thumbnail || faviconFor(g.url);
  const category = (g.categories || []).join(', ') || 'Game';
  const description = g.description || `Play ${category.toLowerCase()} game`;
  const v=getVotes(g.url), who=v.voters[voterKey()];
  return `
    <div class="card" data-url="${g.url}" data-name="${g.name}" tabindex="0" role="button" aria-label="Play ${g.name}">
      <div class="thumb">
        ${badgeHtml}
        <img src="${img}" alt="${g.name}" loading="lazy" onerror="this.style.display='none'">
        <div class="thumb-overlay"><i class="bi bi-play-fill"></i></div>
      </div>
      <div class="card-info">
        <div class="name-row">
          <div class="name" title="${g.name}">${g.name}</div>
          <i class="bi bi-three-dots-vertical card-menu" aria-hidden="true"></i>
        </div>
        <div class="description" title="${description}">${description}</div>
        <div class="card-meta">
          <button class="vote-card ${who==='like'?'active-like':''}" data-vote="like" title="Like"><i class="bi bi-hand-thumbs-up-fill"></i><span>${v.likes}</span></button>
          <button class="vote-card ${who==='dislike'?'active-dislike':''}" data-vote="dislike" title="Dislike"><i class="bi bi-hand-thumbs-down-fill"></i><span>${v.dislikes}</span></button>
        </div>
      </div>
    </div>
  `;
}

function renderGrid(){
  const query = gameSearch.value.trim().toLowerCase();
  const cat = categorySelect.value;
  const filtered = games.filter(g => {
    const matchesQuery = g.name.toLowerCase().includes(query);
    const matchesCat = cat === 'All' || (g.categories || []).includes(cat);
    return matchesQuery && matchesCat;
  });
  grid.innerHTML = filtered.map(cardHTML).join('');
  emptyNote.style.display = filtered.length === 0 ? 'block' : 'none';
  emptyNote.textContent = 'No games match that search.';
}

fetch('games.json')
  .then(res => res.json())
  .then(data => {
    games = data;
    gameSearch.placeholder = `Search through our ${games.length} games!`;
    populateCategories();
    categorySelect.value = 'All';
    renderGrid();
  })
  .catch(() => {
    emptyNote.style.display = 'block';
    emptyNote.textContent = 'Could not load games.json.';
  });

gameSearch.addEventListener('input', renderGrid);
categorySelect.addEventListener('change', renderGrid);

/* ---------- Open games via the shared about:blank popup (frame.js) ---------- */
function openCard(card){
  const others = games.filter(g => g.url !== card.dataset.url);
  const currentUser = localStorage.getItem('ug_current_user');
  openAboutBlank(card.dataset.url, card.dataset.name, others, currentUser);
}

grid.addEventListener('click', e => {
  const vote = e.target.closest('.vote-card');
  if(vote){
    e.preventDefault();
    e.stopPropagation();
    const card = vote.closest('.card');
    voteGame(card.dataset.url, vote.dataset.vote);
    return;
  }
  const card = e.target.closest('.card');
  if(!card) return;
  openCard(card);
});

grid.addEventListener('keydown', e => {
  const card = e.target.closest('.card');
  if(!card || (e.key !== 'Enter' && e.key !== ' ')) return;
  e.preventDefault();
  openCard(card);
});
