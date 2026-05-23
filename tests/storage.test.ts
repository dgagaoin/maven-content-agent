import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { JsonlContentStorage } from '../src/storage/jsonl.js';
import { MockLLMAdapter } from '../src/llm/mock.js';
import { buildContentItem } from '../src/content/factory.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'maven-test-'));
});

describe('JsonlContentStorage', () => {
  it('appends and retrieves a content item', async () => {
    const store = new JsonlContentStorage(tmpDir);
    const llm = new MockLLMAdapter();
    const [draft] = await llm.draft({
      channel: 'linkedin',
      pillar: 'honey_ledger',
      voice: 'danny',
      topic: 'demo',
      count: 1,
    });
    const item = buildContentItem({
      pillar: 'honey_ledger',
      channel: 'linkedin',
      voice: 'danny',
      audience: 'attorneys',
      draft,
    });
    await store.appendItem(item);
    const got = await store.getItem(item.id);
    expect(got?.id).toBe(item.id);
  });

  it('updates status to approved with approver recorded', async () => {
    const store = new JsonlContentStorage(tmpDir);
    const llm = new MockLLMAdapter();
    const [draft] = await llm.draft({
      channel: 'linkedin',
      pillar: 'founder_journey',
      voice: 'danny',
      topic: 'building APIS',
      count: 1,
    });
    const item = buildContentItem({
      pillar: 'founder_journey',
      channel: 'linkedin',
      voice: 'danny',
      audience: 'founders',
      draft,
    });
    await store.appendItem(item);
    await store.updateStatus(item.id, 'approved', 'danny');
    const got = await store.getItem(item.id);
    expect(got?.status).toBe('approved');
    expect(got?.approvedBy).toBe('danny');
  });

  it('filters list by status', async () => {
    const store = new JsonlContentStorage(tmpDir);
    const llm = new MockLLMAdapter();
    const [d1] = await llm.draft({
      channel: 'linkedin',
      pillar: 'honey_ledger',
      voice: 'danny',
      topic: 'a',
      count: 1,
    });
    const [d2] = await llm.draft({
      channel: 'linkedin',
      pillar: 'honey_ledger',
      voice: 'danny',
      topic: 'b',
      count: 1,
    });
    const i1 = buildContentItem({
      pillar: 'honey_ledger',
      channel: 'linkedin',
      voice: 'danny',
      audience: 'attorneys',
      draft: d1,
    });
    const i2 = buildContentItem({
      pillar: 'honey_ledger',
      channel: 'linkedin',
      voice: 'danny',
      audience: 'attorneys',
      draft: d2,
    });
    await store.appendItem(i1);
    await store.appendItem(i2);
    await store.updateStatus(i1.id, 'approved', 'danny');
    expect((await store.listItems({ status: 'approved' })).length).toBe(1);
    expect((await store.listItems({ status: 'draft' })).length).toBe(1);
  });
});
