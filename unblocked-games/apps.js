/* ---------- Games data ----------
   Loaded from apps.json (edit that file to add/remove apps).
   Thumbnails are pulled live from each game's own favicon.
--------------------------------------------------- */
let apps = [];

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

function cardHTML(g){
  const badgeHtml = g.badge ? `<span class="badge">${g.badge}</span>` : '';
  const img = faviconFor(g.url);
  const favorite = new Set(JSON.parse(localStorage.getItem('ug_favorites') || '[]')).has(g.url);
  return `
    <div class="card" data-url="${g.url}" data-name="${g.name}" tabindex="0" role="button" aria-label="Open ${g.name}">
      <div class="thumb">
        ${badgeHtml}<button class="favorite-btn ${favorite ? 'saved' : ''}" data-favorite="${g.url}" type="button" aria-label="${favorite ? 'Remove from favorites' : 'Add to favorites'}"><i class="bi ${favorite ? 'bi-star-fill' : 'bi-star'}"></i></button>
        <img src="${img}" alt="${g.name}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="card-info">
        <div class="name">${g.name}</div>
        <div class="cat">${(g.categories || []).join(', ') || '—'}</div>
      </div>
    </div>
  `;
}

function renderGrid(){
  const query = gameSearch.value.trim().toLowerCase();
  const filtered = apps.filter(g => g.name.toLowerCase().includes(query));
  grid.innerHTML = filtered.map(cardHTML).join('');
  emptyNote.style.display = filtered.length === 0 ? 'block' : 'none';
  emptyNote.textContent = 'No apps match that search.';
}

fetch('apps.json')
  .then(res => res.json())
  .then(data => {
    apps = data;
    gameSearch.placeholder = `Search through our ${apps.length} apps!`;
    renderGrid();
  })
  .catch(() => {
    emptyNote.style.display = 'block';
    emptyNote.textContent = 'Could not load apps.json.';
  });

gameSearch.addEventListener('input', renderGrid);


/* ---------- Open apps in the same-origin player so the proxy can control the iframe ---------- */
function openSelectedApp(card){ if(!card)return; location.href=`player.html?type=app&url=${encodeURIComponent(card.dataset.url)}&title=${encodeURIComponent(card.dataset.name)}`; }
grid.addEventListener('click',e=>{ const fav=e.target.closest('[data-favorite]'); if(fav){e.preventDefault();e.stopPropagation();const list=new Set(JSON.parse(localStorage.getItem('ug_favorites')||'[]'));const url=fav.dataset.favorite;list.has(url)?list.delete(url):list.add(url);localStorage.setItem('ug_favorites',JSON.stringify([...list]));renderGrid();return;} openSelectedApp(e.target.closest('.card')); });
grid.addEventListener('keydown',e=>{const card=e.target.closest('.card');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openSelectedApp(card)}});
