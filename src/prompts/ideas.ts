import { buildPreamble } from './common.js';
import type { IdeaRequest } from '../llm/types.js';

export function buildIdeasSystem(req: IdeaRequest): string {
  return `${buildPreamble('apis_brand')}

You are generating exactly ${req.count ?? 5} distinct content ideas. Vary pillars and channels across the set. No more than two ideas in any one pillar.

${req.pillar ? `Restrict the set to pillar: ${req.pillar}.` : 'Spread across all five pillars.'}

OUTPUT FORMAT — single JSON object with key "ideas" containing an array. Each idea:
{
  "pillar": "<one of the five>",
  "channel": "linkedin|x|blog|email|video_script|thread",
  "voice": "danny|miriam|apis_brand",
  "audience": "attorneys|small_business|founders|general",
  "hook": "<specific angle, not a topic>",
  "one_line_premise": "<what the post argues or teaches>"
}

Return JSON only.`;
}

export const IDEAS_USER = 'Generate the ideas now.';
