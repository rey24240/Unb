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

function cardHTML(g){
  const badgeHtml = g.badge ? `<span class="badge">${g.badge}</span>` : '';
  const img = faviconFor(g.url);
  return `
    <div class="card" data-url="${g.url}" data-name="${g.name}">
      <div class="thumb">
        ${badgeHtml}
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
grid.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if(!card) return;
  const others = games.filter(g => g.url !== card.dataset.url);
  const currentUser = localStorage.getItem('ug_current_user');
  openAboutBlank(card.dataset.url, card.dataset.name, others, currentUser);
});
