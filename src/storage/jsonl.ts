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
  // Lazily-built latest-state index. Once loaded, mutations to disk and to the
  // map happen together so we don't re-parse content.jsonl on every read.
  // Assumes single-writer (one Maven process per data dir).
  private index: Map<string, ContentItem> | null = null;
  private indexLoad: Promise<void> | null = null;

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

  private async ensureIndex(): Promise<Map<string, ContentItem>> {
    if (this.index) return this.index;
    if (!this.indexLoad) {
      this.indexLoad = (async () => {
        await this.ready;
        const map = new Map<string, ContentItem>();
        let raw = '';
        try {
          raw = await fs.readFile(this.itemsPath, 'utf8');
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
        }
        for (const line of raw.split('\n')) {
          if (!line.trim()) continue;
          try {
            const item = ContentItem.parse(JSON.parse(line));
            // Later rows overwrite earlier ones — latest-state semantics.
            map.set(item.id, item);
          } catch (e) {
            log.warn('skipped malformed content.jsonl line', { error: (e as Error).message });
          }
        }
        this.index = map;
      })();
    }
    await this.indexLoad;
    return this.index!;
  }

  async appendItem(item: ContentItem): Promise<void> {
    const idx = await this.ensureIndex();
    await this.append(this.itemsPath, item);
    idx.set(item.id, item);
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
    const idx = await this.ensureIndex();
    return idx.get(id) ?? null;
  }

  async listItems(filter: ContentFilter): Promise<ContentItem[]> {
    const idx = await this.ensureIndex();
    let arr = [...idx.values()];
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
    const idx = await this.ensureIndex();
    const current = idx.get(id);
    if (!current) throw new Error(`Item not found: ${id}`);
    const next: ContentItem = {
      ...current,
      ...extras,
      status,
      updatedAt: new Date().toISOString(),
      approvedBy: status === 'approved' ? (actor === 'maven' ? null : actor) : current.approvedBy,
    };
    await this.append(this.itemsPath, next);
    idx.set(id, next);
    await this.append(this.auditPath, {
      ts: new Date().toISOString(),
      actor,
      action: 'status.changed',
      itemId: id,
      before: { status: current.status },
      after: { status },
    });
  }
}
