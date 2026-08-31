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
  }catch(e){ return ''; }
}
function appIconData(name){
  const letter=(name||'A').trim().slice(0,1).toUpperCase();
  return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="44" fill="#20252b"/><text x="128" y="165" text-anchor="middle" font-family="Arial,sans-serif" font-size="132" font-weight="700" fill="#9aa5b1">${letter}</text></svg>`);
}

function populateCategories(){
  const allCats = new Set();
  apps.forEach(g => (g.categories || []).forEach(c => allCats.add(c)));
  const cats = ["All", ...Array.from(allCats).sort()];
  categorySelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function cardHTML(g){
  const badgeHtml = g.badge ? `<span class="badge">${g.badge}</span>` : '';
  const img = g.thumbnail || faviconFor(g.url) || appIconData(g.name);
  const initial = g.name.trim().slice(0,1).toUpperCase();
  return `
    <div class="card" data-url="${g.url}" data-name="${g.name}" tabindex="0" role="button" aria-label="Open ${g.name}">
      <div class="thumb">
        ${badgeHtml}
        <div class="app-icon-fallback" aria-hidden="true">${initial}</div>
        <img src="${img}" alt="${g.name}" loading="lazy" onerror="this.onerror=null;this.src=appIconData('${g.name.replace(/'/g,"\\'")}')">
      </div>
      <div class="card-info">
        <div class="name">${g.name}</div>
        <div class="cat">${(g.categories || []).join(', ') || '—'}</div>
      </div>
    </div>
  `;
}

function renderGrid(){
  const query = gameSearch?.value?.trim().toLowerCase() || '';
  const cat = categorySelect.value;
  const filtered = apps.filter(g => {
    const matchesQuery = g.name.toLowerCase().includes(query);
    const matchesCat = cat === 'All' || (g.categories || []).includes(cat);
    return matchesQuery && matchesCat;
  });
  grid.innerHTML = filtered.map(cardHTML).join('');
  emptyNote.style.display = filtered.length === 0 ? 'block' : 'none';
  emptyNote.textContent = 'No apps match that search.';
}

fetch('/static/apps.json')
  .then(res => res.json())
  .then(data => {
    apps = data;
    if(gameSearch) gameSearch.placeholder = `Search through our ${apps.length} apps!`;
    populateCategories();
    categorySelect.value = 'All';
    renderGrid();
  })
  .catch(() => {
    emptyNote.style.display = 'block';
    emptyNote.textContent = 'Apps not found';
  });

gameSearch?.addEventListener('input', renderGrid);
categorySelect.addEventListener('change', renderGrid);

/* ---------- Open apps in the same-origin player so the proxy can control the iframe ---------- */
function openSelectedApp(card){ if(!card)return; location.href=`/static/player.html?type=app&url=${encodeURIComponent(card.dataset.url)}&title=${encodeURIComponent(card.dataset.name)}`; }
grid.addEventListener('click',e=>openSelectedApp(e.target.closest('.card')));
grid.addEventListener('keydown',e=>{const card=e.target.closest('.card');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openSelectedApp(card)}});
