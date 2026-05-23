import type { ContentItem, ContentStatus } from '../content/schema.js';

export interface ContentFilter {
  status?: ContentStatus;
  pillar?: string;
  channel?: string;
  limit?: number;
}

export interface ContentStorage {
  name: string;
  appendItem(item: ContentItem): Promise<void>;
  getItem(id: string): Promise<ContentItem | null>;
  listItems(filter: ContentFilter): Promise<ContentItem[]>;
  updateStatus(
    id: string,
    status: ContentStatus,
    actor: 'danny' | 'miriam' | 'maven',
    extras?: Partial<ContentItem>,
  ): Promise<void>;
}
