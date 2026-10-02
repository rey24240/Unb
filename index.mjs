import createServer from '@tomphttp/bare-server-node';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { server as wisp, logging } from '@mercuryworkshop/wisp-js/server';
import { scramjetPath } from '@mercuryworkshop/scramjet/path';
import { baremuxPath } from 'bare-mux-fork/node';
import { libcurlPath } from '@mercuryworkshop/libcurl-transport';

const port = process.env.PORT || 8080;
const rootDir = process.cwd();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.js': 'application/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.swf': 'application/x-shockwave-flash',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const bare = createServer('/seal/');
logging.set_level(logging.NONE);
Object.assign(wisp.options, { dns_method: 'resolve', dns_servers: ['1.1.1.3', '1.0.0.3'], dns_result_order: 'ipv4first' });
const server = http.createServer();

function resolveFileFromUrl(url) {
  const cleanUrl = decodeURIComponent((url || '/').split('?')[0].split('#')[0]);

  if (cleanUrl === '/' || cleanUrl === '') return path.join(rootDir, 'index.html');

  const relativePath = cleanUrl.replace(/^\/+/, '');
  const candidate = path.join(rootDir, relativePath);

  if (candidate.startsWith(rootDir)) {
    return candidate;
  }

  return null;
}

function serveStaticFile(req, res) {
  const filePath = resolveFileFromUrl(req.url);

  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      const directoryIndex = path.join(filePath, 'index.html');
      fs.stat(directoryIndex, (dirErr, dirStats) => {
        if (dirErr || !dirStats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not found');
          return;
        }

        sendFile(directoryIndex, req, res);
      });
      return;
    }

    sendFile(filePath, req, res);
  });
}

function sendFile(filePath, req, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  if (req.method === 'HEAD') {
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'max-age=3600',
    });
    res.end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'max-age=3600',
  });

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('Server error');
  });
  stream.pipe(res);
}

function servePackageAsset(req, res, prefix, baseDir) {
  const relative = decodeURIComponent((req.url || '').split('?')[0].slice(prefix.length));
  const target = path.resolve(baseDir, relative);
  const root = path.resolve(baseDir);
  if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403); res.end('Forbidden'); return true; }
  fs.stat(target, (err, stat) => { if (err || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; } sendFile(target, req, res); });
  return true;
}

server.on('request', (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
    return;
  }

  const url = req.url || '/';
  if (url.startsWith('/eggs/')) return servePackageAsset(req, res, '/eggs/', scramjetPath);
  if (url.startsWith('/baremux/')) return servePackageAsset(req, res, '/baremux/', baremuxPath);
  if (url.startsWith('/libcurl/')) return servePackageAsset(req, res, '/libcurl/', libcurlPath);
  if (url.startsWith('/wisp/')) return wisp.routeRequest(req, res);

  if (
    url === '/' ||
    url === '/index.html' ||
    url.startsWith('/uv/') ||
    url === '/sw.js' ||
    url.startsWith('/unb/') ||
    url.startsWith('/js/') ||
    url.startsWith('/assets/') ||
    url.includes('.svg') ||
    url.includes('.png') ||
    url.includes('.jpg') ||
    url.includes('.jpeg') ||
    url.includes('.gif') ||
    url.includes('.webp') ||
    url.includes('.ico') ||
    url.includes('.avif') ||
    url.includes('.js') ||
    url.includes('.css') ||
    url.includes('.json') ||
    url.includes('.swf')
  ) {
    serveStaticFile(req, res);
    return;
  }

  serveStaticFile(req, res);
});

server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req, socket, head)) {
    bare.routeUpgrade(req, socket, head);
  } else if ((req.url || '').startsWith('/wisp/')) {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.end();
  }
});

server.listen({ port });

console.log(`Listening on http://localhost:${port}`);
