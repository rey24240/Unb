# Utopia-style custom search

This version uses the same basic UV architecture as Utopia:
- `uv/` contains the Ultraviolet client, handler, config and service worker.
- `sw.js` starts UV in the browser.
- `server.js` serves the site and the `/bare/` endpoint.
- `uv-search.js` sends plain searches to Google and opens them through `/service/`.

## Run
Node.js 18+:
```bash
npm install
npm start
```
Then open `http://localhost:8080`.

## Hosting
UV needs a server-side Bare endpoint. GitHub Pages is static-only, so it cannot run `/bare/`. Deploy this folder to a Node-capable host to use the proxied search. The search falls back to the direct target if the UV service worker cannot start.
