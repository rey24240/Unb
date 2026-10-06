(() => {
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPopover = document.getElementById('settingsPopover');
  const settingsClose = document.getElementById('settingsClose');
  const accentSelect = document.getElementById('accentSelect');
  const saveDataBtn = document.getElementById('saveDataBtn');
  const loadDataBtn = document.getElementById('loadDataBtn');
  const loadDataInput = document.getElementById('loadDataInput');
  const homeSettingsBtn = document.getElementById('homeSettingsBtn');
  const themes = ['green', 'purple', 'blue', 'red', 'amber'];
  const backgroundInput = document.getElementById('backgroundInput');
  const backgroundReset = document.getElementById('backgroundReset');

  let savedTheme = 'blue';
  try { savedTheme = localStorage.getItem('ug_theme') || 'blue'; } catch (_) {}
  if (!themes.includes(savedTheme)) savedTheme = 'blue';

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (accentSelect) accentSelect.value = theme;
  }

  function applyCustomBackground(data) {
    if (data) {
      document.documentElement.style.setProperty('--custom-bg-image', `url("${data}")`);
      document.body.classList.add('has-custom-background');
    } else {
      document.documentElement.style.removeProperty('--custom-bg-image');
      document.body.classList.remove('has-custom-background');
    }
  }

  applyTheme(savedTheme);
  try { applyCustomBackground(localStorage.getItem('ug_custom_background')); } catch (_) {}

  if (accentSelect) {
    accentSelect.addEventListener('change', () => {
      applyTheme(accentSelect.value);
      try { localStorage.setItem('ug_theme', accentSelect.value); } catch (_) {}
      savedTheme = accentSelect.value;
    });
  }

  if (backgroundInput) {
    backgroundInput.addEventListener('change', () => {
      const file = backgroundInput.files && backgroundInput.files[0];
      if (!file) return;
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        alert('Choose a PNG, JPG, or WebP image.');
        backgroundInput.value = '';
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        alert('Please choose an image under 3 MB.');
        backgroundInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          localStorage.setItem('ug_custom_background', reader.result);
          applyCustomBackground(reader.result);
        } catch (_) {
          alert('This image is too large for browser storage. Try a smaller image.');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (backgroundReset) {
    backgroundReset.addEventListener('click', () => {
      try { localStorage.removeItem('ug_custom_background'); } catch (_) {}
      applyCustomBackground(null);
      if (backgroundInput) backgroundInput.value = '';
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', event => {
      event.stopPropagation();
      settingsPopover.hidden = !settingsPopover.hidden;
    });
  }

  if (settingsClose) {
    settingsClose.addEventListener('click', () => { settingsPopover.hidden = true; });
  }

  if (homeSettingsBtn) {
    homeSettingsBtn.addEventListener('click', () => {
      settingsPopover.hidden = true;
      location.href = '/index.html?page=games';
    });
  }

  document.addEventListener('click', event => {
    if (!settingsPopover.hidden && !settingsPopover.contains(event.target) && !settingsBtn.contains(event.target)) {
      settingsPopover.hidden = true;
    }
  });

  function collectSaveData() {
    return {
      format: 'unblocked-games-save',
      version: 1,
      savedAt: new Date().toISOString(),
      favorites: [],
      settings: { theme: savedTheme }
    };
  }

  if (saveDataBtn) {
    saveDataBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(collectSaveData(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'unblocked-games-data.json';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  if (loadDataBtn) {
    loadDataBtn.addEventListener('click', () => loadDataInput.click());
  }

  if (loadDataInput) {
    loadDataInput.addEventListener('change', async () => {
      const file = loadDataInput.files && loadDataInput.files[0];
      loadDataInput.value = '';
      if (!file) return;

      try {
        const data = JSON.parse(await file.text());
        if (!data || data.format !== 'unblocked-games-save' || data.version !== 1) throw Error('This is not a valid site save file.');
        const importedTheme = data.settings && data.settings.theme;
        if (importedTheme && !themes.includes(importedTheme)) throw Error('Invalid theme.');
        if (importedTheme) {
          localStorage.setItem('ug_theme', importedTheme);
          applyTheme(importedTheme);
          savedTheme = importedTheme;
        }
        alert('Settings imported successfully.');
      } catch (error) {
        alert(error.message || 'Could not import that file.');
      }
    });
  }
})();
