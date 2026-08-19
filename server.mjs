import createBareServer from '@tomphttp/bare-server-node';
import http from 'http';
import nodeStatic from 'node-static';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;

const bare = createBareServer('/bare/');
const serve = new nodeStatic.Server(__dirname);
const server = http.createServer();

server.on('request', (req, res) => {
  if (bare.shouldRoute(req)) bare.routeRequest(req, res);
  else serve.serve(req, res);
});

server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req, socket, head)) bare.routeUpgrade(req, socket, head);
  else socket.end();
});

server.listen(port, () => {
  console.log(`Unblocked Games running on http://localhost:${port}`);
});
