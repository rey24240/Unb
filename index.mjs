import createServer from '@tomphttp/bare-server-node';
import http from 'http';
import nodeStatic from 'node-static';

const port = process.env.PORT || 8080;

// Utopia-style proxy setup: Bare handles /bare/ and the normal site is static.
const bare = createServer('/bare/');
const serve = new nodeStatic.Server('unb/');
const rootServe = new nodeStatic.Server('./');

const server = http.createServer();

server.on('request', (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
    return;
  }

  // Keep the root entry point and proxy assets available from the project root.
  if (
    req.url === '/' ||
    req.url === '/index.html' ||
    req.url.startsWith('/uv/') ||
    req.url === '/sw.js' ||
    req.url.startsWith('/unb/')
  ) {
    rootServe.serve(req, res);
    return;
  }

  serve.serve(req, res);
});

server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req, socket, head)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

server.listen({ port });

console.log(`Listening on http://localhost:${port}`);
