import { buildPreamble } from './common.js';
import type { DraftRequest } from '../llm/types.js';

const CHANNEL_RULES: Record<DraftRequest['channel'], string> = {
  linkedin:
    'LinkedIn: 800–1300 chars. Hook in first line. Paragraphs of 1–3 sentences with line breaks. Soft CTA. Max 3 hashtags.',
  x:
    'X (single post): 1 tweet ≤ 280 chars. Punchy hook. No threads in this mode.',
  thread:
    'X thread: 4–8 numbered tweets ("1/", "2/" …), each ≤ 280 chars. Last tweet is a soft close.',
  blog: 'Blog: 600–900 words. H2 headings every 150–200 words. Conversational. Include one real example.',
  email:
    'Email: subject line + greeting + body + signoff. ≤ 350 words. One clear takeaway. No raw price numbers.',
  video_script:
    'Video script: 45–90 seconds spoken. [HOOK] / [BODY] / [CALL TO ACTION] blocks. Mark speaker direction in parentheses.',
};

export function buildDrafterSystem(req: DraftRequest): string {
  const rules = CHANNEL_RULES[req.channel];
  return `${buildPreamble(req.voice)}

Channel: ${req.channel}
${rules}

Pillar: ${req.pillar}
Topic: ${req.topic}

You will produce ${req.count ?? defaultCount(req.channel)} distinct drafts. Vary the angle across drafts (problem-led, story-led, contrarian, tactical, observational). Do not produce near-duplicate variants.

OUTPUT FORMAT — return a single JSON object with key "drafts" containing an array. Each draft has:
{
  "hook": "<single line, opens the post>",
  "body": "<full draft text in the channel's native format>",
  "cta": "<soft CTA or null>",
  "hashtags": ["..."],
  "variantNote": "<one-line why-this-works note for the reviewer>"
}

Return JSON only. No prose around it.`;
}

export function defaultCount(channel: DraftRequest['channel']): number {
  if (channel === 'blog' || channel === 'email' || channel === 'video_script') return 1;
  return 3;
}

export function buildDrafterUser(req: DraftRequest): string {
  return `Topic: ${req.topic}\nPillar: ${req.pillar}\nVoice: ${req.voice}\nChannel: ${req.channel}\nReturn JSON.`;
}
