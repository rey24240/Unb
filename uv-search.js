/* Utopia-style Ultraviolet search for the site's main search bar. */
(() => {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchInput');
  if (!form || !input) return;

  function makeTarget(raw) {
    const value = raw.trim();
    if (!value) return null;

    const looksLikeUrl =
      /^https?:\/\//i.test(value) ||
      /^(?:[\w-]+\.)+[\w-]{2,}(?:[/:?#].*)?$/i.test(value);

    if (looksLikeUrl) {
      return /^https?:\/\//i.test(value) ? value : `https://${value}`;
    }

    return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
  }

  async function go(raw) {
    const target = makeTarget(raw);
    if (!target) return;

    try {
      await navigator.serviceWorker.register('/sw.js', {
        scope: __uv$config.prefix
      });
      await navigator.serviceWorker.ready;
      window.location.href = __uv$config.prefix + __uv$config.encodeUrl(target);
    } catch (error) {
      console.error('UV could not start:', error);
      window.location.href = target;
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    go(input.value);
  });
})();
