# Unblocked Games — Utopia browsing/search integration

This build adds a Utopia-style browser page with an iframe and browser toolbar, plus persistent proxy/search-engine settings.

## Features
- Games and Apps search bars: press Enter or the globe button to open `browser.html`.
- Browser toolbar: back, reload, forward, address/search, open in new tab, fullscreen, and menu.
- Proxy setting: **Utopia • Ultraviolet** or **Direct / No proxy**.
- Search engine setting: Google, Bing, DuckDuckGo, or Brave Search.
- Settings are stored in `localStorage` and apply across the site.

## Important deployment note
Ultraviolet's browser-side service worker is included, but Utopia's proxy requires a Bare server. GitHub Pages alone cannot provide `/bare/` routing. Deploy this folder with the included Node server on a Node-capable host.

Run:

```bash
npm install
npm start
```

The server listens on `PORT` when supplied, otherwise `8080`.
