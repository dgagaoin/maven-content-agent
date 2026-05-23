import type { Channel, Pillar, Voice, DraftOutput, IdeaOutput } from '../content/schema.js';

export interface DraftRequest {
  channel: Channel;
  pillar: Pillar;
  voice: Voice;
  topic: string;
  count?: number; // default 3 for short channels, 1 for long form
}

export interface IdeaRequest {
  pillar?: Pillar;
  count?: number; // default 5
}

export interface LLMAdapter {
  name: string;
  draft(req: DraftRequest): Promise<DraftOutput[]>;
  generateIdeas(req: IdeaRequest): Promise<IdeaOutput[]>;
}
