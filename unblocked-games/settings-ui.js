(function(){
  const modal = document.getElementById('settingsOverlay');
  if(!modal || document.getElementById('proxySettings')) return;
  const box = document.createElement('div');
  box.id = 'proxySettings';
  box.className = 'proxy-settings';
  box.innerHTML = `
    <div class="settings-heading">Web browsing</div>
    <label>Proxy</label>
    <select id="proxySelect">
      <option value="utopia">Utopia • Ultraviolet</option>
      <option value="direct">Direct / No proxy</option>
    </select>
    <label>Search engine</label>
    <select id="searchEngineSelect">
      <option value="google">Google</option>
      <option value="bing">Bing</option>
      <option value="duckduckgo">DuckDuckGo</option>
      <option value="brave">Brave Search</option>
    </select>
    <p class="settings-help">Utopia uses the Ultraviolet proxy. It needs the included Node/Bare server when the site is deployed.</p>
  `;
  const grid = document.getElementById('themeGrid');
  grid.parentNode.insertBefore(box, grid.nextSibling);
  const proxy = document.getElementById('proxySelect');
  const engine = document.getElementById('searchEngineSelect');
  proxy.value = localStorage.getItem('ug_proxy') || 'utopia';
  engine.value = localStorage.getItem('ug_search_engine') || 'google';
  proxy.addEventListener('change',()=>localStorage.setItem('ug_proxy',proxy.value));
  engine.addEventListener('change',()=>localStorage.setItem('ug_search_engine',engine.value));
})();
