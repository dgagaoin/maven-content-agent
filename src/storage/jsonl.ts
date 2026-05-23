import fs from 'node:fs/promises';
import path from 'node:path';
import { ContentItem, type ContentStatus } from '../content/schema.js';
import type { ContentStorage, ContentFilter } from './types.js';
import { log } from '../utils/logger.js';

export class JsonlContentStorage implements ContentStorage {
  readonly name = 'jsonl';
  private itemsPath: string;
  private auditPath: string;
  private ready: Promise<void>;

  constructor(dataDir: string) {
    const dir = path.resolve(dataDir, 'maven');
    this.itemsPath = path.join(dir, 'content.jsonl');
    this.auditPath = path.join(dir, 'audit.jsonl');
    this.ready = fs.mkdir(dir, { recursive: true }).then(() => undefined);
  }

  private async append(file: string, obj: unknown): Promise<void> {
    await this.ready;
    await fs.appendFile(file, JSON.stringify(obj) + '\n', 'utf8');
  }

  async appendItem(item: ContentItem): Promise<void> {
    await this.append(this.itemsPath, item);
    await this.append(this.auditPath, {
      ts: new Date().toISOString(),
      actor: 'maven',
      action: 'item.created',
      itemId: item.id,
      after: { status: item.status, voice: item.voice, channel: item.channel },
    });
    log.info('item appended', {
      id: item.id,
      voice: item.voice,
      channel: item.channel,
      pillar: item.pillar,
    });
  }

  async getItem(id: string): Promise<ContentItem | null> {
    const snapshots = await this.readAll();
    for (let i = snapshots.length - 1; i >= 0; i--) {
      if (snapshots[i].id === id) return snapshots[i];
    }
    return null;
  }

  async listItems(filter: ContentFilter): Promise<ContentItem[]> {
    const snapshots = await this.readAll();
    const latest = new Map<string, ContentItem>();
    for (const s of snapshots) latest.set(s.id, s);
    let arr = [...latest.values()];
    if (filter.status) arr = arr.filter((i) => i.status === filter.status);
    if (filter.pillar) arr = arr.filter((i) => i.pillar === filter.pillar);
    if (filter.channel) arr = arr.filter((i) => i.channel === filter.channel);
    arr.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (filter.limit) arr = arr.slice(0, filter.limit);
    return arr;
  }

  async updateStatus(
    id: string,
    status: ContentStatus,
    actor: 'danny' | 'miriam' | 'maven',
    extras?: Partial<ContentItem>,
  ): Promise<void> {
    const current = await this.getItem(id);
    if (!current) throw new Error(`Item not found: ${id}`);
    const next: ContentItem = {
      ...current,
      ...extras,
      status,
      updatedAt: new Date().toISOString(),
      approvedBy: status === 'approved' ? (actor === 'maven' ? null : actor) : current.approvedBy,
    };
    await this.append(this.itemsPath, next);
    await this.append(this.auditPath, {
      ts: new Date().toISOString(),
      actor,
      action: 'status.changed',
      itemId: id,
      before: { status: current.status },
      after: { status },
    });
  }

  private async readAll(): Promise<ContentItem[]> {
    await this.ready;
    let raw = '';
    try {
      raw = await fs.readFile(this.itemsPath, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw e;
    }
    const out: ContentItem[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        out.push(ContentItem.parse(JSON.parse(line)));
      } catch (e) {
        log.warn('skipped malformed content.jsonl line', { error: (e as Error).message });
      }
    }
    return out;
  }
}
