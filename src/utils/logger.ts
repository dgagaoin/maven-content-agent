type Level = 'debug' | 'info' | 'warn' | 'error';
const order: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
let current: Level = 'info';

export function setLogLevel(level: Level): void {
  current = level;
}

function emit(level: Level, msg: string, meta?: Record<string, unknown>): void {
  if (order[level] < order[current]) return;
  const line = meta ? `[maven] [${level}] ${msg} ${JSON.stringify(meta)}` : `[maven] [${level}] ${msg}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (m: string, meta?: Record<string, unknown>) => emit('debug', m, meta),
  info: (m: string, meta?: Record<string, unknown>) => emit('info', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => emit('warn', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => emit('error', m, meta),
};
