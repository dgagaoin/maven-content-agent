import http from 'node:http';
import { log } from './utils/logger.js';

export interface HealthState {
  drive: 'ready' | 'disabled';
  llm: 'anthropic' | 'mock';
  telegram: 'polling' | 'webhook' | 'unknown';
}

interface ServerOpts {
  port: number;
  agent: string;
  state: () => HealthState;
}

export function startHealthServer(opts: ServerOpts): http.Server {
  const { port, agent, state } = opts;
  const bootTime = Date.now();

  const server = http.createServer((req, res) => {
    const path = req.url?.split('?')[0] ?? '/';

    if (path === '/health' || path === '/healthz') {
      const s = state();
      const body = JSON.stringify({
        status: 'ok',
        agent,
        uptimeSec: Math.round((Date.now() - bootTime) / 1000),
        adapters: s,
        ts: new Date().toISOString(),
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(body);
      return;
    }

    if (path === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`${agent} — alive. See /health for diagnostics.\n`);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, '0.0.0.0', () => {
    log.info('health server listening', { port, agent });
  });

  server.on('error', (err) => {
    log.error('health server error', { error: err.message });
  });

  return server;
}
