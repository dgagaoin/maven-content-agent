# Maven — Changelog

All notable changes to this project. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — 2026-05-25 — Debug pass

### Fixed
- **Unhandled errors silently swallowed** (`src/bot/handlers.ts`). Every bot command (`/post_ideas`, `/approve`, `/reject`, `/regen`, `/publish`, `/item`, `/content_backlog`, `/approved`, `/draft_*`, `/video_script`) is now wrapped in a `safeCommand` helper that replies the error message to the user. Previously LLM timeouts, Sheets/Drive failures, and "item not found" errors only hit the Telegraf logger.
- **Invalid `p=/v=/a=` values crashed downstream** (`src/bot/handlers.ts`). `parseDraftArgs` now validates against the zod `PillarEnum` and `AudienceEnum` and surfaces unknown values to the user as `"Argument error: ... unknown pillar 'foo' (use one of: ...)"`. Previously `p=foo` was cast unchecked, then blew up zod parsing in `buildContentItem` with an opaque error.
- **`/content_backlog` could show nothing while backlog existed** (`src/bot/handlers.ts`). The filter now runs BEFORE the limit. Previously `listItems({ limit: 15 })` could return 15 published items and hide all actual `idea/draft/review` items.
- **`/reject` and `/publish` threw "Item not found" with no user feedback** (`src/bot/handlers.ts`). Both now pre-check existence and reply cleanly.
- **Drive upload caused duplicate `content.jsonl` rows + bogus audit events** (`src/storage/multi.ts`). The Drive upload now runs synchronously BEFORE the primary `appendItem`, so the persisted row carries `driveLink` from row one. Previously `appendItem(item)` then async `updateStatus(...same status..., {driveLink})` produced a second jsonl row AND a `status.changed` audit event with no actual status change.
- **Railway PORT collision** (`src/index.ts`). The webhook now binds the platform PORT (instead of hardcoded `3000`) and the health server binds `PORT+1`. Previously both tried to bind 3000 when Railway set `PORT=3000`.
- **PORT not validated** (`src/index.ts`). Non-numeric `PORT` now throws a clear error instead of `Number()`→`NaN` and undefined `http.listen` behavior.
- **Shutdown didn't await `bot.stop`** (`src/index.ts`). SIGTERM now runs `bot.stop(sig)` inside a `Promise.race` with a 5-second cap, then `process.exit(0)`. Prevents in-flight Drive uploads from being killed mid-multipart.
- **JSON extractor spanned multiple blobs** (`src/llm/anthropic.ts`). `extractJson` now walks balanced braces forward from the first `{` to find the end of the first top-level object. Previously `lastIndexOf('}')` could span across prose + an example JSON object the model emitted alongside the real response.

### Performance
- **JSONL store no longer re-reads the whole file per call** (`src/storage/jsonl.ts`). A lazy `Map<id, ContentItem>` index is built once from disk on first access and kept in sync on every write. `getItem` becomes O(1). Single-writer-per-data-dir assumption.
