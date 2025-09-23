#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT || 4173);
const root = path.resolve(__dirname, '..', 'dist');
const indexFile = path.join(root, 'index.html');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Ensure dist exists
if (!fs.existsSync(indexFile)) {
  console.error('Error: dist/index.html not found. Did the build step run?');
}

const server = http.createServer((req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURI(requestUrl.pathname);

    // Health endpoint to debug deploy state
    if (pathname === '/__health') {
      const hasIndex = fs.existsSync(indexFile);
      const payload = JSON.stringify({ ok: true, hasDist: hasIndex, port });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(payload);
    }

    // Normalize and prevent path traversal
    const resolvedPath = path.normalize(path.join(root, pathname));
    if (!resolvedPath.startsWith(root)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('Forbidden');
    }

    const hasExt = path.extname(pathname) !== '';

    if (!hasExt || pathname.endsWith('/')) {
      // Route navigation -> serve SPA index
      fs.readFile(indexFile, (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          return res.end('Internal Server Error');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(data);
      });
      return;
    }

    // Static asset request
    fs.readFile(resolvedPath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Not Found');
      }
      const ext = path.extname(resolvedPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      return res.end(data);
    });
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    return res.end('Internal Server Error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving dist on http://0.0.0.0:${port}`);
});
