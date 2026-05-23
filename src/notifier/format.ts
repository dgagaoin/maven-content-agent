import type { ContentItem, IdeaOutput } from '../content/schema.js';

const STATUS_EMOJI: Record<ContentItem['status'], string> = {
  idea: '💡',
  draft: '✏️',
  review: '👀',
  approved: '✅',
  published: '📤',
  archived: '📦',
  rejected: '🗑️',
};

export function formatDraft(item: ContentItem): string {
  const lines: string[] = [];
  lines.push(
    `${STATUS_EMOJI[item.status]} ${item.id}  ·  ${item.channel}  ·  ${item.voice}  ·  ${item.pillar}  ·  status: ${item.status}`,
  );
  lines.push('');
  lines.push('HOOK');
  lines.push(item.hook);
  lines.push('');
  lines.push('BODY');
  lines.push(item.body);
  if (item.cta) {
    lines.push('');
    lines.push('CTA');
    lines.push(item.cta);
  }
  if (item.hashtags.length) {
    lines.push('');
    lines.push(item.hashtags.join(' '));
  }
  lines.push('');
  lines.push('WHY THIS WORKS');
  lines.push(item.variantNote);
  lines.push('');
  lines.push(`[ /approve ${item.id} · /reject ${item.id} <reason> · /regen ${item.id} ]`);
  return lines.join('\n');
}

export function formatDraftCompact(item: ContentItem): string {
  return `${STATUS_EMOJI[item.status]} ${item.id}  ${item.channel}  ${item.voice}  — ${item.hook.slice(0, 80)}${item.hook.length > 80 ? '…' : ''}`;
}

export function formatIdea(idx: number, idea: IdeaOutput): string {
  return [
    `${idx}. [${idea.pillar} · ${idea.channel} · ${idea.voice}]`,
    `   HOOK: ${idea.hook}`,
    `   PREMISE: ${idea.one_line_premise}`,
  ].join('\n');
}
