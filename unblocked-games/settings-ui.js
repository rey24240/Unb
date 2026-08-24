(function(){
  const modal=document.getElementById('settingsOverlay');
  const box=modal?.querySelector('.modal');
  const grid=document.getElementById('themeGrid');
  if(!modal||!box||!grid)return;

  box.classList.add('settings-modal');

  const close=box.querySelector('.modal-close');
  const title=box.querySelector('.modal-title');
  title.textContent='Settings';
  const intro=document.createElement('p');
  intro.className='settings-intro';
  intro.textContent='Customize the look and browsing behavior of your game hub.';
  title.after(intro);

  const themeSection=document.createElement('section');
  themeSection.className='settings-section';
  themeSection.innerHTML='<div class="settings-section-title">Accent color</div><div class="settings-section-sub">Choose the color used for buttons, active navigation, and highlights.</div>';
  grid.parentNode.insertBefore(themeSection,grid);
  themeSection.appendChild(grid);

  const proxy=document.createElement('section');
  proxy.className='settings-section';
  proxy.innerHTML=`
    <div class="settings-section-title">Web browsing</div>
    <div class="settings-section-sub">Choose how links are opened from the built-in browser.</div>
    <label class="settings-field"><span>Browser mode</span><select id="proxySelect"><option value="utopia">Utopia / Ultraviolet</option><option value="direct">Direct / No proxy</option></select></label>
    <label class="settings-field"><span>Search engine</span><select id="searchEngineSelect"><option value="google">Google</option><option value="bing">Bing</option><option value="duckduckgo">DuckDuckGo</option><option value="brave">Brave Search</option></select></label>
    <p class="settings-help">Utopia requires the included Node/Bare server. Direct mode is useful for sites that allow normal embedding.</p>
  `;
  box.appendChild(proxy);

  const pref=document.createElement('section');
  pref.className='settings-section';
  pref.innerHTML=`
    <div class="settings-section-title">Preferences</div>
    <label class="settings-check"><input type="checkbox" id="reduceMotion"><span><b>Reduce motion</b><small>Use fewer hover and transition effects.</small></span></label>
    <label class="settings-check"><input type="checkbox" id="compactSidebar"><span><b>Compact sidebar</b><small>Keep navigation narrow on larger screens.</small></span></label>
  `;
  box.appendChild(pref);

  const actions=document.createElement('div');
  actions.className='settings-actions';
  actions.innerHTML='<button type="button" class="settings-save-data" id="settingsSaveData">Save Data</button><button type="button" class="settings-reset" id="settingsReset">Reset settings</button><span id="settingsSaved" class="settings-saved">Saved automatically</span>';
  box.appendChild(actions);

  const proxySelect=proxy.querySelector('#proxySelect');
  const engine=proxy.querySelector('#searchEngineSelect');
  const reduce=box.querySelector('#reduceMotion');
  const compact=box.querySelector('#compactSidebar');

  proxySelect.value=localStorage.getItem('ug_proxy')||'utopia';
  engine.value=localStorage.getItem('ug_search_engine')||'google';
  reduce.checked=localStorage.getItem('ug_reduce_motion')==='1';
  compact.checked=localStorage.getItem('ug_compact_sidebar')==='1';

  async function syncSettings(){
    try{
      if(window.UGAuth?.isLoggedIn?.()){
        await fetch('/api/settings',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({
          theme:document.documentElement.getAttribute('data-theme')||'green',
          proxy:proxySelect.value,
          searchEngine:engine.value,
          reduceMotion:reduce.checked,
          compactSidebar:compact.checked
        })});
      }
    }catch(_){}
  }
  async function loadSyncedSettings(){
    try{
      if(!window.UGAuth?.isLoggedIn?.()) return;
      const r=await fetch('/api/settings',{credentials:'same-origin'});
      if(!r.ok)return;
      const d=await r.json(), x=d.settings||{};
      if(x.theme) document.documentElement.setAttribute('data-theme',x.theme);
      if(x.proxy) proxySelect.value=x.proxy;
      if(x.searchEngine) engine.value=x.searchEngine;
      if(typeof x.reduceMotion==='boolean') reduce.checked=x.reduceMotion;
      if(typeof x.compactSidebar==='boolean') compact.checked=x.compactSidebar;
      localStorage.setItem('ug_theme',x.theme||'green');
      localStorage.setItem('ug_proxy',proxySelect.value);
      localStorage.setItem('ug_search_engine',engine.value);
      localStorage.setItem('ug_reduce_motion',reduce.checked?'1':'0');
      localStorage.setItem('ug_compact_sidebar',compact.checked?'1':'0');
      document.documentElement.classList.toggle('reduce-motion',reduce.checked);
      document.documentElement.classList.toggle('compact-sidebar',compact.checked);
      document.querySelectorAll('.theme-swatch').forEach(el=>el.classList.toggle('selected',el.dataset.theme===document.documentElement.getAttribute('data-theme')));
    }catch(_){}
  }
  function save(){
    localStorage.setItem('ug_proxy',proxySelect.value);
    localStorage.setItem('ug_search_engine',engine.value);
    localStorage.setItem('ug_reduce_motion',reduce.checked?'1':'0');
    localStorage.setItem('ug_compact_sidebar',compact.checked?'1':'0');
    document.documentElement.classList.toggle('reduce-motion',reduce.checked);
    document.documentElement.classList.toggle('compact-sidebar',compact.checked);
    const saved=box.querySelector('#settingsSaved'); saved.textContent='Saved';
    clearTimeout(save.t); save.t=setTimeout(()=>saved.textContent='Saved automatically',900); syncSettings();
  }
  [proxySelect,engine,reduce,compact].forEach(el=>el.addEventListener('change',save));
  document.documentElement.classList.toggle('reduce-motion',reduce.checked);
  document.documentElement.classList.toggle('compact-sidebar',compact.checked);
  setTimeout(loadSyncedSettings,250);
  window.UGSettingsSync=loadSyncedSettings;

  box.querySelector('#settingsSaveData').addEventListener('click',async()=>{
    const saved=box.querySelector('#settingsSaved');
    try{
      if(window.UGAuth?.isLoggedIn?.()){
        save();
        const r=await fetch('/api/save-data',{method:'POST',credentials:'same-origin'});
        if(!r.ok) throw new Error();
        saved.textContent='Data saved';
      }else{
        save();
        saved.textContent='Saved on this device — log in to sync it';
      }
    }catch(_){ saved.textContent='Save failed — try again'; }
    clearTimeout(save.dataTimer); save.dataTimer=setTimeout(()=>saved.textContent='Saved automatically',1600);
  });
    box.querySelector('#settingsReset').addEventListener('click',()=>{
    localStorage.removeItem('ug_theme');localStorage.removeItem('ug_proxy');localStorage.removeItem('ug_search_engine');localStorage.removeItem('ug_reduce_motion');localStorage.removeItem('ug_compact_sidebar');
    document.documentElement.setAttribute('data-theme','green');
    document.querySelectorAll('.theme-swatch').forEach(el=>el.classList.toggle('selected',el.dataset.theme==='green'));
    proxySelect.value='utopia';engine.value='google';reduce.checked=false;compact.checked=false;save();
  });
})();