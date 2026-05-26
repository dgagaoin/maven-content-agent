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

  const portRaw = process.env.PORT;
  const portParsed = portRaw === undefined ? 3001 : Number(portRaw);
  if (!Number.isFinite(portParsed) || portParsed <= 0 || portParsed > 65535) {
    throw new Error(`Invalid PORT: "${portRaw}" — must be a number 1-65535.`);
  }
  const basePort = portParsed;
  const getHealthState = (): HealthState => ({
    drive: drive ? 'ready' : 'disabled',
    llm: llm.name === 'anthropic' ? 'anthropic' : 'mock',
    telegram: config.telegram.mode,
  });

  if (config.telegram.mode === 'webhook') {
    if (!config.telegram.webhookBaseUrl) {
      throw new Error('WEBHOOK_BASE_URL required when TELEGRAM_MODE=webhook');
    }
    // Previously: webhook bound hardcoded :3000 and health bound :(PORT||3001).
    // On Railway PORT=3000 they collided. Now the platform PORT drives the
    // webhook; health takes basePort+1.
    const path = `/telegram/${config.telegram.botToken.split(':')[0]}`;
    log.info('telegram webhook listening', { port: basePort, path });
    startHealthServer({ port: basePort + 1, agent: 'maven', state: getHealthState });
    await bot.launch({
      webhook: { domain: config.telegram.webhookBaseUrl, hookPath: path, port: basePort },
    });
  } else {
    log.info('telegram polling started — talk to the bot in Telegram now');
    startHealthServer({ port: basePort, agent: 'maven', state: getHealthState });
    await bot.launch();
  }

  const shutdown = (sig: string) => async () => {
    log.info('shutdown', { sig });
    try {
      // bot.stop returns a Promise in modern telegraf; cap the wait so SIGTERM
      // can't hang the container indefinitely.
      await Promise.race([
        Promise.resolve(bot.stop(sig)),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
    } catch (e) {
      log.error('shutdown error', { error: (e as Error).message });
    }
    process.exit(0);
  };
  process.once('SIGINT', shutdown('SIGINT'));
  process.once('SIGTERM', shutdown('SIGTERM'));
}

main().catch((e) => {
  log.error('fatal', { error: (e as Error).message, stack: (e as Error).stack });
  process.exit(1);
});
