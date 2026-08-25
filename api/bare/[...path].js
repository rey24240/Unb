import { createServer } from 'node:http';
import createBareServer from '@tomphttp/bare-server-node';

const bare = createBareServer('/bare/');

function normalizeBareUrl(url = '/api/bare/') {
  return url.replace(/^\/api\/bare(?=\/|\?|$)/, '/bare');
}

const server = createServer((req, res) => {
  const original = req.url;
  req.url = normalizeBareUrl(req.url);
  try {
    if (bare.shouldRoute(req)) return bare.routeRequest(req, res);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Bare route not found');
  } catch (err) {
    console.error('Bare proxy error:', err);
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Proxy error');
    } else res.end();
  } finally {
    req.url = original;
  }
});

server.on('upgrade', (req, socket, head) => {
  req.url = normalizeBareUrl(req.url);
  try {
    if (bare.shouldRoute(req, socket, head)) return bare.routeUpgrade(req, socket, head);
    socket.end();
  } catch (err) {
    console.error('Bare websocket error:', err);
    socket.end();
  }
});

export default server;
