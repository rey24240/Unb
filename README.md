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


Persistence: accounts, long-lived login sessions, votes, and comments are stored in `data/data.json` and restored when the Node server restarts. Comments are no longer capped at 200. Keep the `data/` directory on persistent storage/backups if you want the data to survive redeployments or container replacement.

## Save Data
The Settings panel includes a **Save Data** button. When logged in, it explicitly flushes the persistent server database and syncs the user's theme/browser preferences to their account. Account sessions, votes, comments, and synced settings are stored under `data/data.json` and survive normal server restarts. Keep the `data/` directory on persistent storage and back it up when deploying.
