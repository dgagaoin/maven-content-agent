import { ContentItem, type ContentStatus } from '../content/schema.js';
import type { ContentStorage, ContentFilter } from './types.js';
import type { MavenDriveClient } from './drive.js';
import { log } from '../utils/logger.js';

export class MultiContentStorage implements ContentStorage {
  readonly name = 'multi';

  constructor(
    private readonly primary: ContentStorage,
    private readonly drive: MavenDriveClient | null,
  ) {}

  async appendItem(item: ContentItem): Promise<void> {
    // Upload to Drive first so the persisted item already has driveLink set.
    // Previously we appended, then asynchronously updateStatus(...same status...,
    // { driveLink }) — that doubled the jsonl rows and produced a bogus
    // `status.changed` audit event for every new draft.
    let withLink: ContentItem = item;
    if (this.drive) {
      try {
        const file = await this.drive.uploadMarkdown(`${item.id}.md`, itemMarkdown(item));
        if (file.webUrl) {
          withLink = { ...item, driveLink: file.webUrl };
          log.info('drive uploaded', { id: item.id, url: file.webUrl });
        } else {
          log.warn('drive upload returned no webViewLink', { id: item.id });
        }
      } catch (e) {
        log.error('drive upload failed', { id: item.id, error: (e as Error).message });
      }
    }
    await this.primary.appendItem(withLink);
  }

  async getItem(id: string): Promise<ContentItem | null> {
    return this.primary.getItem(id);
  }

  async listItems(filter: ContentFilter): Promise<ContentItem[]> {
    return this.primary.listItems(filter);
  }

  async updateStatus(
    id: string,
    status: ContentStatus,
    actor: 'danny' | 'miriam' | 'maven',
    extras?: Partial<ContentItem>,
  ): Promise<void> {
    await this.primary.updateStatus(id, status, actor, extras);
  }
}

function itemMarkdown(item: ContentItem): string {
  return [
    `# ${item.id}`,
    '',
    `**Status:** ${item.status}  ·  **Voice:** ${item.voice}  ·  **Channel:** ${item.channel}  ·  **Pillar:** ${item.pillar}`,
    `**Audience:** ${item.audience}  ·  **Created:** ${item.createdAt}`,
    '',
    '## Hook',
    item.hook,
    '',
    '## Body',
    item.body,
    '',
    item.cta ? `## CTA\n${item.cta}\n` : '',
    item.hashtags.length ? `## Hashtags\n${item.hashtags.join(' ')}\n` : '',
    '## Variant note',
    item.variantNote,
  ]
    .filter(Boolean)
    .join('\n');
}
