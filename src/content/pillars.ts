import type { Pillar } from './schema.js';

export const PILLAR_DESCRIPTIONS: Record<Pillar, string> = {
  legal_billing_education: 'Help attorneys bill better. Concrete, practical, no legal advice.',
  ai_for_small_law_firms: 'Practical AI workflows for solos and small firms. AI for admin, not legal advice.',
  founder_journey: 'Danny + Miriam building APIS Legal Technology in public. Honest, energetic, grounded.',
  honey_ledger: 'Product education and progress. Stick to capabilities on the approved list.',
  ai_education_consulting: 'Workflow audits, training, custom AIOS for small business. Practical and educational.',
};

export function pillarSummary(): string {
  return (Object.entries(PILLAR_DESCRIPTIONS) as [Pillar, string][])
    .map(([p, d]) => `- ${p}: ${d}`)
    .join('\n');
}
