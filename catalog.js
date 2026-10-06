(() => {
  const requestedPage = new URLSearchParams(location.search).get('page');
  const PAGE = requestedPage === 'apps' || location.pathname.endsWith('/apps.html') ? 'apps' : 'games';
  const state = { games: [], apps: [] };
  const pageTransition = document.getElementById('pageTransition');
  const grid = document.getElementById('grid');
  const categorySelect = document.getElementById('categorySelect');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const eyebrow = document.getElementById('eyebrow');

  document.querySelectorAll('.content-tab').forEach(link => {
    link.addEventListener('click', event => {
      const target = new URL(link.href, location.href);
      if (target.href === location.href) return;
      event.preventDefault();
      pageTransition.classList.add('show');
      window.setTimeout(() => location.href = target.href, 180);
    });
  });

  function escapeHTML(value = '') {
    return String(value).replace(/[&<>\'\"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));
  }

  function faviconFor(url) {
    try {
      return `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(new URL(url, location.href).hostname)}`;
    } catch (_) {
      return '';
    }
  }

  function populateCategories() {
    const categories = new Set();
    state[PAGE].forEach(item => (item.categories || []).forEach(category => categories.add(category)));
    categorySelect.innerHTML = '<option value="All">All categories</option>' +
      [...categories].sort((a, b) => a.localeCompare(b)).map(category =>
        `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
      ).join('');
  }

  function cardHTML(item) {
    const url = escapeHTML(item.url || '');
    const name = escapeHTML(item.name || 'Untitled');
    const image = escapeHTML(item.image || item.thumbnail || faviconFor(item.url));
    const fallback = escapeHTML(faviconFor(item.url));
    const categories = (item.categories || []).map(escapeHTML).join(' • ') || (PAGE === 'apps' ? 'App' : 'Game');
    return `<article class="game-card" data-url="${url}" data-name="${name}" tabindex="0" role="button"><div class="card-image"><img src="${image}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'"><div class="play-overlay"><i class="bi bi-play-fill"></i></div></div><div class="card-body"><h2>${name}</h2><p>${categories}</p></div></article>`;
  }

  function render() {
    const items = state[PAGE];
    const category = categorySelect.value;
    const filtered = items.filter(item => category === 'All' || (item.categories || []).includes(category));
    grid.innerHTML = filtered.map(cardHTML).join('');
    resultCount.textContent = filtered.length;
    emptyState.hidden = filtered.length !== 0;
    document.getElementById('catalogHeading').textContent = PAGE === 'apps' ? 'All Apps' : 'All Games';
    document.getElementById('resultLabel').textContent = PAGE === 'apps' ? 'Browse the full app library' : 'Browse the full game library';
    eyebrow.textContent = PAGE.toUpperCase();
    pageTitle.textContent = PAGE === 'apps' ? 'Browse Apps' : 'Browse Games';
    pageSubtitle.textContent = PAGE === 'apps' ? 'Open apps through the site player.' : 'Choose a game to start playing.';
    document.getElementById('gamesTab').classList.toggle('active', PAGE === 'games');
    document.getElementById('appsTab').classList.toggle('active', PAGE === 'apps');
  }

  function openItem(card) {
    const type = PAGE === 'apps' ? 'app' : 'game';
    const query = `type=${type}&file=${encodeURIComponent(card.dataset.url)}&title=${encodeURIComponent(card.dataset.name || 'Game')}`;
    const modal = document.getElementById('gameModal');
    const frame = document.getElementById('gameModalFrame');
    document.getElementById('gameModalTitle').textContent = card.dataset.name || 'Playing game';
    frame.src = `/unb/player-file.html?${query}`;
    modal.hidden = false;
    document.body.classList.add('game-modal-open');
    document.getElementById('gameClose').focus();
  }

  const gameModal = document.getElementById('gameModal');
  const gameFrame = document.getElementById('gameModalFrame');

  function closeGameModal() {
    gameModal.hidden = true;
    gameFrame.src = 'about:blank';
    document.body.classList.remove('game-modal-open');
  }

  document.getElementById('gameClose').addEventListener('click', closeGameModal);
  gameModal.addEventListener('click', event => { if (event.target === gameModal) closeGameModal(); });
  document.getElementById('gameFullscreen').addEventListener('click', () => {
    if (gameFrame.requestFullscreen) gameFrame.requestFullscreen().catch(() => {});
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !gameModal.hidden) closeGameModal(); });

  categorySelect.addEventListener('change', render);
  grid.addEventListener('click', event => {
    const card = event.target.closest('.game-card');
    if (card) openItem(card);
  });
  grid.addEventListener('keydown', event => {
    const card = event.target.closest('.game-card');
    if (card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openItem(card);
    }
  });

  const assetDirectory = location.pathname.startsWith('/unb/') ? './' : './unb/';
  fetch(`${assetDirectory}${PAGE === 'apps' ? 'apps.json' : 'miscG.json'}`)
    .then(response => response.ok ? response.json() : Promise.reject(new Error('Library request failed')))
    .then(data => {
      state[PAGE] = Array.isArray(data) ? data : [];
      populateCategories();
      render();
    })
    .catch(() => {
      grid.innerHTML = '';
      emptyState.hidden = false;
      emptyState.innerHTML = '<i class="bi bi-exclamation-circle"></i><h2>Could not load library</h2><p>Please refresh the page.</p>';
    });
})();
