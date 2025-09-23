#!/usr/bin/env node
import express from 'express';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 4173);
const root = path.resolve(__dirname, '..', 'dist');
const indexFile = path.join(root, 'index.html');

if (!fs.existsSync(indexFile)) {
  console.error('Error: dist/index.html not found. Did the build step run?');
}

// Trust proxy to play nice with Railway
app.set('trust proxy', 1);

// Serve static assets
app.use(express.static(root, {
  extensions: ['html'],
  setHeaders: (res, p) => {
    if (p.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Health
app.get('/__health', (req, res) => {
  res.json({ ok: true, hasDist: fs.existsSync(indexFile), port });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(indexFile);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Express serving dist on http://0.0.0.0:${port}`);
});
