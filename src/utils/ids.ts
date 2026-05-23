import { ulid } from 'ulid';

export function newContentId(): string {
  return `MVN-${ulid()}`;
}
