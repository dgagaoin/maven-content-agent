import { ContentItem, type Channel, type Pillar, type Voice, type Audience, type DraftOutput } from './schema.js';
import { newContentId } from '../utils/ids.js';

export function buildContentItem(input: {
  pillar: Pillar;
  channel: Channel;
  voice: Voice;
  audience: Audience;
  draft: DraftOutput;
  sourceRef?: string | null;
}): ContentItem {
  const now = new Date().toISOString();
  return ContentItem.parse({
    id: newContentId(),
    createdAt: now,
    updatedAt: now,
    pillar: input.pillar,
    channel: input.channel,
    audience: input.audience,
    voice: input.voice,
    status: 'draft',
    hook: input.draft.hook,
    body: input.draft.body,
    cta: input.draft.cta,
    variantNote: input.draft.variantNote,
    hashtags: input.draft.hashtags,
    sourceRef: input.sourceRef ?? null,
    scheduledFor: null,
    publishedAt: null,
    publishedUrl: null,
    performanceNote: null,
    approvedBy: null,
    driveLink: null,
  });
}
