import type { Telegraf } from 'telegraf';
import type { ContentStorage } from '../storage/types.js';
import type { LLMAdapter } from '../llm/types.js';
import {
  type Channel,
  type Pillar,
  type Voice,
  type Audience,
} from '../content/schema.js';
import { buildContentItem } from '../content/factory.js';
import { scan, honeyLedgerClaimsOutsideList } from '../safety/prohibited.js';
import { HONEY_LEDGER_CAN, VOICE_PROFILES } from '../voice/profiles.js';
import { formatDraft, formatDraftCompact, formatIdea } from '../notifier/format.js';
import { log } from '../utils/logger.js';

export interface HandlersDeps {
  storage: ContentStorage;
  llm: LLMAdapter;
}

const HELP_TEXT = [
  'Maven — content & social media agent for APIS Legal Technology.',
  '',
  'Drafts on demand. Nothing publishes without your approval.',
  '',
  'Commands:',
  '/post_ideas [pillar]               5 content ideas',
  '/draft_linkedin <topic>            3 LinkedIn drafts',
  '/draft_thread <topic>              X thread draft',
  '/draft_email <topic>               Email newsletter draft',
  '/draft_blog <topic>                Blog draft',
  '/video_script <topic>              45–90s video script',
  '/content_backlog                   Items in idea/draft/review',
  '/approved                          Approved, awaiting publish',
  '/item <id>                         Full content item',
  '/approve <id>                      Mark approved (records you)',
  '/reject <id> <reason>              Reject',
  '/regen <id>                        Regenerate this draft',
  '/publish <id> <url>                Mark published',
  '/configtodo                        Pending config artifacts',
  '/help',
  '',
  'Default voice: danny. Pass v=miriam or v=apis to override.',
  'Default pillar: honey_ledger. Pass p=founder_journey etc. to override.',
].join('\n');

interface ParsedArgs {
  topic: string;
  voice: Voice;
  pillar: Pillar;
  audience: Audience;
}

function parseDraftArgs(raw: string): ParsedArgs {
  const tokens = raw.split(/\s+/).filter(Boolean);
  let voice: Voice = 'danny';
  let pillar: Pillar = 'honey_ledger';
  let audience: Audience = 'attorneys';
  const topicTokens: string[] = [];
  for (const t of tokens) {
    if (t.startsWith('v=')) {
      const v = t.slice(2).toLowerCase();
      if (v === 'miriam') voice = 'miriam';
      else if (v === 'apis' || v === 'apis_brand') voice = 'apis_brand';
      else voice = 'danny';
    } else if (t.startsWith('p=')) {
      pillar = (t.slice(2) as Pillar) || pillar;
    } else if (t.startsWith('a=')) {
      audience = (t.slice(2) as Audience) || audience;
    } else {
      topicTokens.push(t);
    }
  }
  return { topic: topicTokens.join(' ') || 'Honey Ledger demo', voice, pillar, audience };
}

async function generateDrafts(
  ctx: { reply: (s: string) => Promise<unknown> },
  channel: Channel,
  rawArgs: string,
  deps: HandlersDeps,
): Promise<void> {
  const { topic, voice, pillar, audience } = parseDraftArgs(rawArgs);
  await ctx.reply(`Drafting ${channel} (${voice} · ${pillar}) on "${topic}"…`);
  let drafts;
  try {
    drafts = await deps.llm.draft({ channel, voice, pillar, topic });
  } catch (e) {
    log.error('draft failed', { error: (e as Error).message });
    await ctx.reply(`Drafting failed: ${(e as Error).message}`);
    return;
  }

  const accepted: string[] = [];
  const blocked: { i: number; reason: string }[] = [];

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const fullText = `${d.hook}\n${d.body}\n${d.cta ?? ''}`;
    const hits = scan(fullText, voice);
    const honeyHits = honeyLedgerClaimsOutsideList(fullText, HONEY_LEDGER_CAN);
    if (hits.length || honeyHits.length) {
      blocked.push({
        i,
        reason: [
          hits.map((h) => `${h.category}:"${h.match}"`).join(', '),
          honeyHits.length ? `honey_ledger_overclaim:${honeyHits.join('|')}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
      });
      continue;
    }
    const item = buildContentItem({ pillar, channel, voice, audience, draft: d });
    await deps.storage.appendItem(item);
    accepted.push(formatDraft(item));
  }

  const vp = VOICE_PROFILES[voice];
  const miriamNote =
    vp.requiresOwnerApproval && accepted.length
      ? '\n\n⚠️ Miriam-voiced — requires Miriam\'s approval before publishing.'
      : '';

  if (accepted.length) {
    // Telegram caps a single message at 4096 chars. Three full LinkedIn drafts
    // joined together blow past that and Telegram silently 400s the whole reply.
    // Send each draft as its own message instead. If any single draft is still
    // too long, chunk it.
    await ctx.reply(`✏️ ${accepted.length} draft${accepted.length === 1 ? '' : 's'} ready (saved to Drive + backlog):`);
    for (let i = 0; i < accepted.length; i++) {
      await replyChunked(ctx, accepted[i]);
    }
    if (miriamNote) await ctx.reply(miriamNote.trim());
  }
  if (blocked.length) {
    await ctx.reply(
      `⚠️ ${blocked.length} draft(s) blocked by safety filter:\n` +
        blocked.map((b) => `  • #${b.i + 1}: ${b.reason}`).join('\n'),
    );
  }
  if (!accepted.length && !blocked.length) {
    await ctx.reply('LLM returned no drafts.');
  }
}

/**
 * Telegram allows up to 4096 chars per message. Split safely on paragraph
 * boundaries when possible, hard-split otherwise.
 */
async function replyChunked(
  ctx: { reply: (msg: string) => Promise<unknown> },
  text: string,
  maxChars = 3900,
): Promise<void> {
  if (text.length <= maxChars) {
    await ctx.reply(text);
    return;
  }
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      await ctx.reply(remaining);
      return;
    }
    // Prefer paragraph break, then line break, then hard cut.
    const slice = remaining.slice(0, maxChars);
    let cut = slice.lastIndexOf('\n\n');
    if (cut < maxChars / 2) cut = slice.lastIndexOf('\n');
    if (cut < maxChars / 2) cut = maxChars;
    await ctx.reply(remaining.slice(0, cut));
    remaining = remaining.slice(cut).replace(/^\n+/, '');
  }
}

export function registerHandlers(bot: Telegraf, deps: HandlersDeps): void {
  const { storage, llm } = deps;

  bot.command('start', (ctx) => ctx.reply(HELP_TEXT));
  bot.command('help', (ctx) => ctx.reply(HELP_TEXT));

  bot.command('draft_linkedin', (ctx) =>
    generateDrafts(ctx, 'linkedin', ctx.message.text.replace(/^\/\S+\s*/, ''), deps),
  );
  bot.command('draft_thread', (ctx) =>
    generateDrafts(ctx, 'thread', ctx.message.text.replace(/^\/\S+\s*/, ''), deps),
  );
  bot.command('draft_email', (ctx) =>
    generateDrafts(ctx, 'email', ctx.message.text.replace(/^\/\S+\s*/, ''), deps),
  );
  bot.command('draft_blog', (ctx) =>
    generateDrafts(ctx, 'blog', ctx.message.text.replace(/^\/\S+\s*/, ''), deps),
  );
  bot.command('video_script', (ctx) =>
    generateDrafts(ctx, 'video_script', ctx.message.text.replace(/^\/\S+\s*/, ''), deps),
  );

  bot.command('post_ideas', async (ctx) => {
    const arg = ctx.message.text.split(/\s+/)[1];
    const ideas = await llm.generateIdeas(
      arg ? { pillar: arg as Pillar, count: 5 } : { count: 5 },
    );
    await ctx.reply(ideas.map((idea, i) => formatIdea(i + 1, idea)).join('\n\n'));
  });

  bot.command('content_backlog', async (ctx) => {
    const items = await storage.listItems({ limit: 15 });
    const open = items.filter((i) => ['idea', 'draft', 'review'].includes(i.status));
    if (!open.length) return ctx.reply('Backlog is empty.');
    await ctx.reply(open.map(formatDraftCompact).join('\n'));
  });

  bot.command('approved', async (ctx) => {
    const items = await storage.listItems({ status: 'approved' });
    if (!items.length) return ctx.reply('Nothing approved-waiting.');
    await ctx.reply(items.map(formatDraftCompact).join('\n'));
  });

  bot.command('item', async (ctx) => {
    const id = ctx.message.text.split(/\s+/)[1]?.toUpperCase();
    if (!id) return ctx.reply('Usage: /item <id>');
    const item = await storage.getItem(id);
    if (!item) return ctx.reply(`Not found: ${id}`);
    await ctx.reply(formatDraft(item));
  });

  bot.command('approve', async (ctx) => {
    const id = ctx.message.text.split(/\s+/)[1]?.toUpperCase();
    if (!id) return ctx.reply('Usage: /approve <id>');
    const item = await storage.getItem(id);
    if (!item) return ctx.reply(`Not found: ${id}`);
    const vp = VOICE_PROFILES[item.voice];
    const actor = pickActor();
    if (vp.requiresOwnerApproval && actor !== 'miriam') {
      return ctx.reply(
        `Cannot approve: ${item.voice}-voiced drafts must be approved by Miriam. Current actor: ${actor}.`,
      );
    }
    await storage.updateStatus(id, 'approved', actor);
    await ctx.reply(`✅ Approved ${id} (by ${actor}).`);
  });

  bot.command('reject', async (ctx) => {
    const parts = ctx.message.text.split(/\s+/);
    const id = parts[1]?.toUpperCase();
    const reason = parts.slice(2).join(' ');
    if (!id) return ctx.reply('Usage: /reject <id> <reason>');
    await storage.updateStatus(id, 'rejected', pickActor(), { performanceNote: reason || null });
    await ctx.reply(`🗑️ Rejected ${id}.`);
  });

  bot.command('regen', async (ctx) => {
    const id = ctx.message.text.split(/\s+/)[1]?.toUpperCase();
    if (!id) return ctx.reply('Usage: /regen <id>');
    const prior = await storage.getItem(id);
    if (!prior) return ctx.reply(`Not found: ${id}`);
    await ctx.reply(`Regenerating ${prior.channel} (${prior.voice})…`);
    const fresh = await llm.draft({
      channel: prior.channel,
      voice: prior.voice,
      pillar: prior.pillar,
      topic: prior.hook,
      count: 1,
    });
    if (!fresh.length) return ctx.reply('LLM returned nothing.');
    const item = buildContentItem({
      pillar: prior.pillar,
      channel: prior.channel,
      voice: prior.voice,
      audience: prior.audience,
      draft: fresh[0],
      sourceRef: prior.id,
    });
    await storage.appendItem(item);
    await ctx.reply(formatDraft(item));
  });

  bot.command('publish', async (ctx) => {
    const parts = ctx.message.text.split(/\s+/);
    const id = parts[1]?.toUpperCase();
    const url = parts[2];
    if (!id || !url) return ctx.reply('Usage: /publish <id> <url>');
    await storage.updateStatus(id, 'published', pickActor(), {
      publishedAt: new Date().toISOString(),
      publishedUrl: url,
    });
    await ctx.reply(`📤 Published ${id} → ${url}`);
  });

  bot.command('configtodo', (ctx) => {
    ctx.reply(
      'Pending config artifacts (agents/maven/CONFIG_TODO.md):\n' +
        '  • honey_ledger_capabilities — placeholder CAN/CANNOT list in voice/profiles.ts\n' +
        '  • voice_profile_danny       — inline in voice/profiles.ts\n' +
        '  • voice_profile_miriam      — BLOCKING for miriam voice (needs Miriam sign-off)\n' +
        '  • voice_profile_apis_brand  — inline in voice/profiles.ts\n' +
        '  • prohibited_phrases        — using hard-coded baseline\n' +
        '  • pillars_config            — using SPEC.md defaults',
    );
  });
}

function pickActor(): 'danny' | 'miriam' | 'maven' {
  // TODO: map Telegram user IDs → person. For MVP-1, mark approvals as 'danny' so
  // Miriam-voice approval gate is enforced (only she can clear those).
  return 'danny';
}
