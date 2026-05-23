import type { Voice } from '../content/schema.js';

export interface VoiceProfile {
  id: Voice;
  description: string;
  doPhrases: string[];
  avoidPhrases: string[];
  /** Miriam-voiced drafts cannot be approved by anyone but Miriam. */
  requiresOwnerApproval: boolean;
}

// Placeholder voice profiles; CONFIG_TODO.md tracks ratification.
// When /Brand Voice/<id>.md files land in Drive, we'll override these.
export const VOICE_PROFILES: Record<Voice, VoiceProfile> = {
  danny: {
    id: 'danny',
    description:
      'First person, practical, build-in-public, ADHD-friendly structure (short paragraphs, lists). Honest about iteration. Curious. Strong opinions, loosely held.',
    doPhrases: ["Here's what we tried.", 'This is rough but useful.', 'Building in public.'],
    avoidPhrases: ['game changer', 'revolutionary', 'unlock the power', 'supercharge'],
    requiresOwnerApproval: false,
  },
  miriam: {
    id: 'miriam',
    description:
      'First person, attorney peer-to-peer, measured, professional. Never gives legal advice. Complies with attorney advertising rules (ABA Model Rule 7.1, CA Rule 7.1). No outcome promises.',
    doPhrases: [
      'Here is a workflow I have actually used in practice.',
      'Most attorneys I know struggle with...',
    ],
    avoidPhrases: ['as your attorney', 'we represent', 'attorney-client', 'guarantee', 'win your case'],
    requiresOwnerApproval: true,
  },
  apis_brand: {
    id: 'apis_brand',
    description:
      'Third person or "we". Educational, system-thinking, builder-led. Less personal anecdote, more frameworks and observations about the legal-tech space.',
    doPhrases: ['Most attorneys lose hours to...', 'Practical AI, not hype AI.', 'Built for attorneys, by a builder + an attorney.'],
    avoidPhrases: ['game changer', 'revolutionary', '10x', 'unlock', 'best-in-class'],
    requiresOwnerApproval: false,
  },
};

// Honey Ledger capabilities — placeholder. CONFIG_TODO tracks the real list.
// Used by safety filter to reject drafts that claim features outside this set.
export const HONEY_LEDGER_CAN: string[] = [
  'turn rough work notes into structured billing entry drafts',
  'surface vague or non-billable language',
  'categorize entries by matter or client',
  'export drafts for human review',
];

export const HONEY_LEDGER_CANNOT: string[] = [
  'auto-submit to a billing system (humans review and submit)',
  'replace attorney judgment on what is billable',
  'integrate with Clio / MyCase / PracticePanther (roadmap)',
  'provide legal advice on billing compliance',
];
