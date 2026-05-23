// Maven post-generation safety filter.
// Mirrors Stella's pattern; adds hype-vocabulary and Honey-Ledger-fabrication checks.

import type { Voice } from '../content/schema.js';

export type ProhibitedCategory =
  | 'legal_advice'
  | 'guarantee'
  | 'impersonation'
  | 'hype'
  | 'engagement_bait'
  | 'urgency_manipulation';

export interface ProhibitedHit {
  category: ProhibitedCategory;
  match: string;
}

const LEGAL_ADVICE: RegExp[] = [
  /\bas your attorney\b/i,
  /\bwe represent you\b/i,
  /\battorney[- ]client\b/i,
  /\bthis is legal advice\b/i,
];

const GUARANTEE: RegExp[] = [
  /\bwe guarantee\b/i,
  /\bguaranteed (?:result|outcome|return)\b/i,
  /\byou will win\b/i,
];

const IMPERSONATION: RegExp[] = [
  /\bi['']?m miriam\b/i,
  /\bi['']?m danny\b/i,
];

const HYPE: RegExp[] = [
  /\bgame[- ]chang(?:er|ing)\b/i,
  /\brevolutionar(?:y|ize)\b/i,
  /\b10x\b/i,
  /\b100x\b/i,
  /\bsupercharge\b/i,
  /\bunleash\b/i,
  /\bunlock the power\b/i,
  /\bChatGPT[- ]killer\b/i,
  /\bAI[- ]powered\b/i,
  /\byou won['']?t believe\b/i,
  /\bthis changes everything\b/i,
  /\bmind[- ]blowing\b/i,
  /\bnext[- ]level\b/i,
  /\bbest[- ]in[- ]class\b/i,
  /\bworld[- ]class\b/i,
];

const ENGAGEMENT_BAIT: RegExp[] = [
  /\bcomment below if\b/i,
  /\btap the heart\b/i,
  /\bsmash that like\b/i,
  /\byou['']?ll never guess\b/i,
];

const URGENCY: RegExp[] = [
  /\blimited time\b/i,
  /\blast chance\b/i,
  /\bact now\b/i,
];

export function scan(text: string, voice?: Voice): ProhibitedHit[] {
  const hits: ProhibitedHit[] = [];
  const check = (patterns: RegExp[], category: ProhibitedCategory) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m) hits.push({ category, match: m[0] });
    }
  };
  check(LEGAL_ADVICE, 'legal_advice');
  check(GUARANTEE, 'guarantee');
  check(IMPERSONATION, 'impersonation');
  check(HYPE, 'hype');
  check(ENGAGEMENT_BAIT, 'engagement_bait');
  check(URGENCY, 'urgency_manipulation');
  void voice; // reserved for voice-specific rules later
  return hits;
}

export function isClean(text: string, voice?: Voice): boolean {
  return scan(text, voice).length === 0;
}

// Detects Honey-Ledger feature claims that aren't on the approved CAN list.
// Conservative: only fires when the text mentions a capability verb near "Honey Ledger"
// AND the claim is not substring-matched against the CAN list.
export function honeyLedgerClaimsOutsideList(text: string, canList: string[]): string[] {
  if (!/honey ?ledger/i.test(text)) return [];
  const verbs = /(integrates? with|submits? to|files? with|files? for you|prepares? taxes|gives? legal advice|guarantees|automatically (?:submits?|files?|sends?))/i;
  const matches = [...text.matchAll(new RegExp(verbs, 'gi'))].map((m) => m[0]);
  return matches.filter((m) => !canList.some((c) => c.toLowerCase().includes(m.toLowerCase())));
}
