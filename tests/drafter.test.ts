import { describe, it, expect } from 'vitest';
import { MockLLMAdapter } from '../src/llm/mock.js';
import { ContentItem } from '../src/content/schema.js';
import { buildContentItem } from '../src/content/factory.js';

const llm = new MockLLMAdapter();

describe('mock drafter', () => {
  it('returns 3 distinct LinkedIn drafts by default', async () => {
    const drafts = await llm.draft({
      channel: 'linkedin',
      pillar: 'honey_ledger',
      voice: 'danny',
      topic: 'why we built Honey Ledger',
    });
    expect(drafts.length).toBe(3);
    expect(new Set(drafts.map((d) => d.variantNote)).size).toBe(3);
  });

  it('produces a thread when channel=thread', async () => {
    const [draft] = await llm.draft({
      channel: 'thread',
      pillar: 'ai_for_small_law_firms',
      voice: 'danny',
      topic: 'AI for legal admin',
      count: 1,
    });
    expect(draft.body).toMatch(/1\//);
  });

  it('builds a valid ContentItem from a draft', () => {
    const item = buildContentItem({
      pillar: 'founder_journey',
      channel: 'linkedin',
      voice: 'danny',
      audience: 'founders',
      draft: {
        hook: 'Why we formed APIS Legal Technology.',
        body: 'Short founder note.',
        cta: null,
        hashtags: [],
        variantNote: 'Story-led.',
      },
    });
    expect(() => ContentItem.parse(item)).not.toThrow();
    expect(item.id.startsWith('MVN-')).toBe(true);
    expect(item.status).toBe('draft');
  });

  it('generates 5 ideas spread across pillars', async () => {
    const ideas = await llm.generateIdeas({ count: 5 });
    expect(ideas.length).toBe(5);
    expect(new Set(ideas.map((i) => i.pillar)).size).toBeGreaterThan(1);
  });
});
