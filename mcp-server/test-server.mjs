#!/usr/bin/env node

// Simple test to see what the server outputs during initialization
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist/index.js');
console.error('[TEST] Starting server:', serverPath);

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let stdoutData = '';
let stderrData = '';

server.stdout.on('data', (data) => {
  stdoutData += data.toString();
  console.error('[TEST] STDOUT RECEIVED:', JSON.stringify(data.toString()));
});

server.stderr.on('data', (data) => {
  stderrData += data.toString();
  console.error('[TEST] STDERR RECEIVED:', JSON.stringify(data.toString()));
});

server.on('error', (error) => {
  console.error('[TEST] Server error:', error);
});

server.on('exit', (code, signal) => {
  console.error('[TEST] Server exited. Code:', code, 'Signal:', signal);
  console.error('[TEST] Total stdout length:', stdoutData.length);
  console.error('[TEST] Total stderr length:', stderrData.length);
  if (stderrData) {
    console.error('[TEST] STDERR content:', stderrData);
  }
  process.exit(code || 0);
});

// Send initialize message
setTimeout(() => {
  const initMessage = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  }) + '\n';

  console.error('[TEST] Sending initialize message');
  server.stdin.write(initMessage);
}, 100);

// Wait for response
setTimeout(() => {
  console.error('[TEST] Test complete - killing server');
  server.kill();
}, 2000);
