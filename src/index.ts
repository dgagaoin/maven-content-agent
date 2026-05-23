import { loadConfig, LOADED_ENV_FILES } from './config.js';
import { log, setLogLevel } from './utils/logger.js';
import { createBot } from './bot/telegram.js';
import { registerHandlers } from './bot/handlers.js';
import { JsonlContentStorage } from './storage/jsonl.js';
import { MavenDriveClient } from './storage/drive.js';
import { MultiContentStorage } from './storage/multi.js';
import { AnthropicAdapter } from './llm/anthropic.js';
import { MockLLMAdapter } from './llm/mock.js';
import type { LLMAdapter } from './llm/types.js';
import { startHealthServer, type HealthState } from './health.js';

async function main(): Promise<void> {
  const config = loadConfig();
  setLogLevel(config.logLevel);
  log.info('starting', { env: config.environment, mode: config.telegram.mode });
  log.info('env layers', { files: LOADED_ENV_FILES.map((f) => f.replace(process.cwd(), '.')) });

  const jsonl = new JsonlContentStorage(config.dataDir);
  const drive = MavenDriveClient.fromEnvironment();
  if (drive) log.info('drive adapter: ready', { folderId: process.env.MAVEN_DRIVE_FOLDER_ID });
  const storage = new MultiContentStorage(jsonl, drive);

  let llm: LLMAdapter;
  if (config.useMockAdapters || !config.anthropic.apiKey) {
    llm = new MockLLMAdapter();
    log.info('llm adapter: mock', { reason: config.anthropic.apiKey ? 'forced' : 'no key' });
  } else {
    llm = new AnthropicAdapter(config.anthropic.apiKey, config.anthropic.model);
    log.info('llm adapter: anthropic', { model: config.anthropic.model });
  }

  const bot = createBot(config);
  registerHandlers(bot, { storage, llm });

  const healthPort = Number(process.env.PORT ?? 3001);
  const getHealthState = (): HealthState => ({
    drive: drive ? 'ready' : 'disabled',
    llm: llm.name === 'anthropic' ? 'anthropic' : 'mock',
    telegram: config.telegram.mode,
  });
  startHealthServer({ port: healthPort, agent: 'maven', state: getHealthState });

  if (config.telegram.mode === 'webhook') {
    if (!config.telegram.webhookBaseUrl) {
      throw new Error('WEBHOOK_BASE_URL required when TELEGRAM_MODE=webhook');
    }
    const path = `/telegram/${config.telegram.botToken.split(':')[0]}`;
    log.info('telegram webhook listening', { path });
    await bot.launch({
      webhook: { domain: config.telegram.webhookBaseUrl, hookPath: path, port: 3000 },
    });
  } else {
    log.info('telegram polling started — talk to the bot in Telegram now');
    await bot.launch();
  }

  const shutdown = (sig: string) => () => {
    log.info('shutdown', { sig });
    bot.stop(sig);
    process.exit(0);
  };
  process.once('SIGINT', shutdown('SIGINT'));
  process.once('SIGTERM', shutdown('SIGTERM'));
}

main().catch((e) => {
  log.error('fatal', { error: (e as Error).message, stack: (e as Error).stack });
  process.exit(1);
});
