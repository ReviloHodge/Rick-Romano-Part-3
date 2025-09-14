type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function ts() {
  return new Date().toISOString();
}

function base(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  const payload = { level, t: ts(), msg, ...(meta || {}) };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => base('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => base('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => base('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => base('error', msg, meta),
};

