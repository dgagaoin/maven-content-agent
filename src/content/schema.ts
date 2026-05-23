import { z } from 'zod';

export const Pillar = z.enum([
  'legal_billing_education',
  'ai_for_small_law_firms',
  'founder_journey',
  'honey_ledger',
  'ai_education_consulting',
]);
export type Pillar = z.infer<typeof Pillar>;

export const Channel = z.enum(['linkedin', 'x', 'blog', 'email', 'video_script', 'thread']);
export type Channel = z.infer<typeof Channel>;

export const Voice = z.enum(['danny', 'miriam', 'apis_brand']);
export type Voice = z.infer<typeof Voice>;

export const Audience = z.enum(['attorneys', 'small_business', 'founders', 'general']);
export type Audience = z.infer<typeof Audience>;

export const ContentStatus = z.enum([
  'idea',
  'draft',
  'review',
  'approved',
  'published',
  'archived',
  'rejected',
]);
export type ContentStatus = z.infer<typeof ContentStatus>;

export const ContentItem = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  pillar: Pillar,
  channel: Channel,
  audience: Audience,
  voice: Voice,
  status: ContentStatus,
  hook: z.string(),
  body: z.string(),
  cta: z.string().nullable(),
  variantNote: z.string(),
  hashtags: z.array(z.string()),
  sourceRef: z.string().nullable(),
  scheduledFor: z.string().nullable(),
  publishedAt: z.string().nullable(),
  publishedUrl: z.string().nullable(),
  performanceNote: z.string().nullable(),
  approvedBy: z.enum(['danny', 'miriam']).nullable(),
  driveLink: z.string().nullable(),
});
export type ContentItem = z.infer<typeof ContentItem>;

// LLM returns drafts in this shape; we fill the rest server-side.
export const DraftOutput = z.object({
  hook: z.string(),
  body: z.string(),
  cta: z.string().nullable(),
  hashtags: z.array(z.string()),
  variantNote: z.string(),
});
export type DraftOutput = z.infer<typeof DraftOutput>;

export const IdeaOutput = z.object({
  pillar: Pillar,
  channel: Channel,
  voice: Voice,
  audience: Audience,
  hook: z.string(),
  one_line_premise: z.string(),
});
export type IdeaOutput = z.infer<typeof IdeaOutput>;
