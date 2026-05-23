import { describe, it, expect } from 'vitest';
import { isClean, scan, honeyLedgerClaimsOutsideList } from '../src/safety/prohibited.js';
import { HONEY_LEDGER_CAN } from '../src/voice/profiles.js';

describe('maven prohibited-phrase filter', () => {
  it('passes a clean LinkedIn draft', () => {
    expect(
      isClean(
        'Most attorneys lose 30 minutes a day writing billing entries. Honey Ledger turns rough notes into structured drafts.',
      ),
    ).toBe(true);
  });

  it('flags hype vocab', () => {
    const hits = scan('Honey Ledger is a game changer that will 10x your firm.');
    expect(hits.some((h) => h.category === 'hype')).toBe(true);
  });

  it('flags guarantee language', () => {
    const hits = scan('We guarantee you will win every billing dispute.');
    expect(hits.some((h) => h.category === 'guarantee')).toBe(true);
  });

  it('flags impersonation', () => {
    expect(scan("Hi, I'm Miriam from APIS.").some((h) => h.category === 'impersonation')).toBe(true);
  });

  it('flags engagement bait', () => {
    expect(
      scan('Comment below if you agree.').some((h) => h.category === 'engagement_bait'),
    ).toBe(true);
  });

  it('flags urgency manipulation', () => {
    expect(scan('Limited time — act now.').some((h) => h.category === 'urgency_manipulation')).toBe(true);
  });

  it('detects Honey Ledger overclaims', () => {
    const hits = honeyLedgerClaimsOutsideList(
      'Honey Ledger integrates with Clio and automatically files your taxes.',
      HONEY_LEDGER_CAN,
    );
    expect(hits.length).toBeGreaterThan(0);
  });

  it('passes when Honey Ledger claims are within approved capabilities', () => {
    const text = 'Honey Ledger helps you turn rough notes into structured drafts you can review.';
    expect(honeyLedgerClaimsOutsideList(text, HONEY_LEDGER_CAN).length).toBe(0);
  });
});
