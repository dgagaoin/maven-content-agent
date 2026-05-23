import { Telegraf, type Context } from 'telegraf';
import type { Config } from '../config.js';
import { log } from '../utils/logger.js';

export function createBot(config: Config): Telegraf {
  const bot = new Telegraf(config.telegram.botToken);
  bot.use(async (ctx, next) => {
    const allowedUsers = config.telegram.allowedUserIds;
    const allowedChats = config.telegram.allowedChatIds;
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    if (allowedUsers.length === 0 && config.environment === 'development') return next();
    const userOk = userId !== undefined && allowedUsers.includes(userId);
    const chatOk =
      allowedChats.length === 0 ? true : chatId !== undefined && allowedChats.includes(chatId);
    if (!userOk || !chatOk) {
      log.warn('rejected message', { userId, chatId });
      return;
    }
    return next();
  });
  bot.catch((err, ctx: Context) =>
    log.error('telegraf error', { error: (err as Error).message, update: ctx.update.update_id }),
  );
  return bot;
}
