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
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: buildDrafterSystem({ ...req, count }),
      messages: [{ role: 'user', content: buildDrafterUser(req) }],
    });
    const text = extractText(res);
    const parsed = DraftsResponse.parse(extractJson(text));
    return parsed.drafts;
  }

  async generateIdeas(req: IdeaRequest): Promise<IdeaOutput[]> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      system: buildIdeasSystem(req),
      messages: [{ role: 'user', content: IDEAS_USER }],
    });
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

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`LLM did not return JSON: ${text.slice(0, 200)}`);
  }
  return JSON.parse(body.slice(start, end + 1));
}
