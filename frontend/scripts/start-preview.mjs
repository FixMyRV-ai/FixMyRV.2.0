#!/usr/bin/env node
import { spawn } from 'node:child_process';

// Resolve PORT from env; default to 4173 (vite preview default) if missing
const port = process.env.PORT || process.env.VITE_PORT || 4173;

const args = ['preview', '--host', '0.0.0.0', '--port', String(port)];

const child = spawn('vite', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
