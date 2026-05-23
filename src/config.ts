import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { z } from 'zod';

function loadLayeredEnv(): string[] {
  // Any env var the parent shell set to "" (empty string) should be treated as unset.
  // dotenv.config({override: false}) considers empty strings "already set" and won't
  // populate from .env files — this is the classic shell-inherited-empty-var trap.
  for (const k of Object.keys(process.env)) {
    if (process.env[k] === '') delete process.env[k];
  }
  const loaded: string[] = [];
  const here = path.resolve('.');
  const candidates = [
    path.join(here, '.env'),
    process.env.SHARED_ENV_PATH,
    path.resolve(here, '..', '..', 'astraea', '.env'),
    path.resolve(here, '..', 'moneypenny', '.env'),
  ].filter((p): p is string => Boolean(p));
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p, override: false });
      loaded.push(p);
    }
  }
  return loaded;
}

export const LOADED_ENV_FILES = loadLayeredEnv();

const ConfigSchema = z.object({
  telegram: z.object({
    botToken: z.string().min(1, 'MAVEN_TELEGRAM_BOT_TOKEN required (or fallback TELEGRAM_BOT_TOKEN)'),
    allowedUserIds: z.array(z.number()),
    allowedChatIds: z.array(z.number()),
    mode: z.enum(['polling', 'webhook']).default('polling'),
    webhookBaseUrl: z.string().optional(),
  }),
  anthropic: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('claude-sonnet-4-6'),
  }),
  google: z.object({
    driveFolderId: z.string().optional(),
    calendarSheetId: z.string().optional(),
  }),
  defaultChannels: z.array(z.string()).default(['LinkedIn', 'Website', 'Email']),
  dataDir: z.string().default('./data'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  environment: z.enum(['development', 'production']).default('development'),
  useMockAdapters: z.boolean().default(false),
});

export type Config = z.infer<typeof ConfigSchema>;

function parseIds(raw: string | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const n = Number(s);
      if (!Number.isFinite(n)) throw new Error(`Invalid Telegram ID: ${s}`);
      return n;
    });
}

export function loadConfig(): Config {
  const parsed = ConfigSchema.parse({
    telegram: {
      // Namespaced first so Maven never inherits Astraea's bot token via the
      // layered astraea/.env. Matches Codex's MONEYPENNY_TELEGRAM_BOT_TOKEN pattern.
      botToken: process.env.MAVEN_TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? '',
      allowedUserIds: parseIds(process.env.ALLOWED_TELEGRAM_IDS),
      allowedChatIds: parseIds(process.env.TELEGRAM_ALLOWED_CHAT_IDS),
      mode: process.env.TELEGRAM_MODE,
      webhookBaseUrl: process.env.MAVEN_WEBHOOK_BASE_URL ?? process.env.WEBHOOK_BASE_URL ?? undefined,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || undefined,
      model: process.env.ANTHROPIC_MODEL,
    },
    google: {
      driveFolderId: process.env.MAVEN_DRIVE_FOLDER_ID || undefined,
      calendarSheetId: process.env.MAVEN_CONTENT_CALENDAR_SHEET_ID || undefined,
    },
    defaultChannels: (process.env.MAVEN_DEFAULT_CHANNELS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    dataDir: process.env.DATA_DIR,
    logLevel: process.env.LOG_LEVEL,
    environment: process.env.ENVIRONMENT,
    useMockAdapters: process.env.USE_MOCK_ADAPTERS === 'true',
  });

  if (parsed.environment === 'production' && parsed.telegram.allowedUserIds.length === 0) {
    throw new Error('ALLOWED_TELEGRAM_IDS must be set in production — empty allow-list is a security failure.');
  }
  return parsed;
}
