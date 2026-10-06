/* ---------- Games data ----------
   Loaded from apps.json (edit that file to add/remove apps).
   Thumbnails are pulled live from each game's own favicon.
--------------------------------------------------- */
let apps = [];

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

function cardHTML(g){
  const badgeHtml = g.badge ? `<span class="badge">${g.badge}</span>` : '';
  const img = faviconFor(g.url);
  return `
    <div class="card" data-url="${g.url}" data-name="${g.name}" tabindex="0" role="button" aria-label="Open ${g.name}">
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
  grid.innerHTML = apps.map(cardHTML).join('');
  emptyNote.style.display = apps.length === 0 ? 'block' : 'none';
  emptyNote.textContent = 'No apps available.';
}

fetch('apps.json')
  .then(res => res.json())
  .then(data => {
    apps = Array.isArray(data) ? data : [];
    renderGrid();
  })
  .catch(() => {
    emptyNote.style.display = 'block';
    emptyNote.textContent = 'Could not load apps.json.';
  });


/* ---------- Open apps in the same-origin player so the proxy can control the iframe ---------- */
function openSelectedApp(card){ if(!card)return; location.href=`player.html?type=app&url=${encodeURIComponent(card.dataset.url)}&title=${encodeURIComponent(card.dataset.name)}`; }
grid.addEventListener('click',e=>{ openSelectedApp(e.target.closest('.card')); });
grid.addEventListener('keydown',e=>{const card=e.target.closest('.card');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openSelectedApp(card)}});
