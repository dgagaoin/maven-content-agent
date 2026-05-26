import Anthropic from '@anthropic-ai/sdk';
import { DraftOutput, IdeaOutput } from '../content/schema.js';
import type { LLMAdapter, DraftRequest, IdeaRequest } from './types.js';
import { buildDrafterSystem, buildDrafterUser, defaultCount } from '../prompts/drafter.js';
import { buildIdeasSystem, IDEAS_USER } from '../prompts/ideas.js';
import { z } from 'zod';

const DraftsResponse = z.object({ drafts: z.array(DraftOutput) });
const IdeasResponse = z.object({ ideas: z.array(IdeaOutput) });

export class AnthropicAdapter implements LLMAdapter {
  readonly name = 'anthropic';
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async draft(req: DraftRequest): Promise<DraftOutput[]> {
    const count = req.count ?? defaultCount(req.channel);
    // Drafts are long. 3 LinkedIn posts at ~1,300 chars each + hooks + variant
    // notes + hashtags + JSON structure easily exceeds 2k tokens. Headroom matters
    // because mid-string truncation breaks JSON parsing.
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      system: buildDrafterSystem({ ...req, count }),
      messages: [{ role: 'user', content: buildDrafterUser(req) }],
    });
    assertNotTruncated(res, 'draft');
    const text = extractText(res);
    const parsed = DraftsResponse.parse(extractJson(text));
    return parsed.drafts;
  }

  async generateIdeas(req: IdeaRequest): Promise<IdeaOutput[]> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: buildIdeasSystem(req),
      messages: [{ role: 'user', content: IDEAS_USER }],
    });
    assertNotTruncated(res, 'ideas');
    const text = extractText(res);
    const parsed = IdeasResponse.parse(extractJson(text));
    return parsed.ideas;
  }
}

function extractText(res: Anthropic.Message): string {
  const block = res.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('No text in LLM response');
  return block.text;
}

function assertNotTruncated(res: Anthropic.Message, op: string): void {
  if (res.stop_reason === 'max_tokens') {
    throw new Error(
      `${op}: LLM hit max_tokens — output was truncated. Try fewer drafts, or raise max_tokens.`,
    );
  }
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  if (start === -1) {
    throw new Error(`LLM did not return JSON: ${text.slice(0, 200)}`);
  }
  // Walk to find the balanced closing brace of the FIRST top-level object.
  // lastIndexOf('}') previously spanned across multiple JSON blobs when the
  // model emitted prose + a second example object.
  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;
  for (let i = start; i < body.length; i++) {
    const ch = body[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) {
    throw new Error(`LLM returned unbalanced JSON: ${text.slice(0, 200)}`);
  }
  const slice = body.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch (firstErr) {
    // One forgiving retry: strip trailing commas (common LLM quirk).
    const repaired = slice.replace(/,(\s*[}\]])/g, '$1');
    try {
      return JSON.parse(repaired);
    } catch {
      throw new Error(
        `LLM returned malformed JSON (${(firstErr as Error).message}). First 300 chars: ${slice.slice(0, 300)}`,
      );
    }
  }
}
