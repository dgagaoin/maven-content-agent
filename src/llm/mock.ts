import type { LLMAdapter, DraftRequest, IdeaRequest } from './types.js';
import type { DraftOutput, IdeaOutput } from '../content/schema.js';

export class MockLLMAdapter implements LLMAdapter {
  readonly name = 'mock';

  async draft(req: DraftRequest): Promise<DraftOutput[]> {
    const count = req.count ?? 3;
    const topic = req.topic.trim();
    const variants: DraftOutput[] = [];
    for (let i = 0; i < count; i++) {
      variants.push(buildVariant(i, req, topic));
    }
    return variants;
  }

  async generateIdeas(req: IdeaRequest): Promise<IdeaOutput[]> {
    const count = req.count ?? 5;
    const pillars = [
      'legal_billing_education',
      'ai_for_small_law_firms',
      'founder_journey',
      'honey_ledger',
      'ai_education_consulting',
    ] as const;
    const channels = ['linkedin', 'x', 'thread', 'email', 'blog'] as const;
    const out: IdeaOutput[] = [];
    for (let i = 0; i < count; i++) {
      const p = req.pillar ?? pillars[i % pillars.length];
      out.push({
        pillar: p,
        channel: channels[i % channels.length],
        voice: i === 0 ? 'danny' : i === 1 ? 'apis_brand' : 'danny',
        audience: p === 'legal_billing_education' ? 'attorneys' : 'general',
        hook: `Angle #${i + 1} for ${p.replace(/_/g, ' ')}`,
        one_line_premise: `Teach one concrete thing about ${p.replace(/_/g, ' ')}, with a real example.`,
      });
    }
    return out;
  }
}

function buildVariant(i: number, req: DraftRequest, topic: string): DraftOutput {
  const angles = [
    { tag: 'Short & warm', note: 'Concrete pain → concrete next step. Soft CTA. Under 130 words.' },
    { tag: 'Story-led', note: 'Opens with a small founder anecdote, lands on a teaching beat.' },
    { tag: 'Contrarian-but-fair', note: 'Pushes against a common assumption. Backs it with one real example.' },
  ];
  const a = angles[i % angles.length];

  if (req.channel === 'linkedin') {
    const hook = `Most ${req.pillar === 'honey_ledger' ? 'attorneys lose 30 minutes a day writing billing entries no one wants to read.' : 'small firms are using AI for the wrong thing.'}`;
    const body = `${hook}\n\nQuick take on ${topic}: small workflow improvements compound. We built ${req.pillar === 'honey_ledger' ? 'Honey Ledger' : 'a workflow audit'} because the boring parts of legal work eat the most hours.\n\nIf you've felt this — DM and I'll walk you through what we tried.`;
    return {
      hook,
      body,
      cta: req.voice === 'miriam' ? null : 'DM if you want to see what we built.',
      hashtags: ['#legaltech', '#smalllaw'],
      variantNote: `${a.tag}. ${a.note}`,
    };
  }
  if (req.channel === 'thread' || req.channel === 'x') {
    const tweets = [
      `1/ ${topic} — quick thread on what we tried.`,
      `2/ Most attorneys skip this step. Here is why that costs them hours.`,
      `3/ The fix is small. Real example below.`,
      `4/ This is what we built at APIS Legal Technology. Soft ask: reply if you'd want a look.`,
    ];
    return {
      hook: tweets[0],
      body: tweets.join('\n\n'),
      cta: null,
      hashtags: [],
      variantNote: `${a.tag}. ${a.note}`,
    };
  }
  // Default fallback for blog / email / video_script
  return {
    hook: `On ${topic}`,
    body: `Draft on ${topic} — ${a.tag.toLowerCase()}. (Mock content; swap in real LLM with ANTHROPIC_API_KEY.)`,
    cta: null,
    hashtags: [],
    variantNote: `${a.tag}. ${a.note}`,
  };
}
