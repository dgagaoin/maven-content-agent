# Maven — Tools & Integrations

## External services Maven touches

| Service | Purpose | Phase |
| --- | --- | --- |
| Telegram (Telegraf) | Bot interface for Danny + Miriam | MVP-1 |
| Anthropic API (Claude) | Drafting, ideation, repurposing, planning | MVP-1 |
| Google Sheets | Calendar, backlog, status board, performance log | MVP-1 |
| Google Drive | Full-text drafts, scripts, archive | MVP-1 |
| Local filesystem | JSONL audit log, voice profiles, capabilities list | MVP-1 |
| OpenAI API | Optional alternative LLM | optional |
| LinkedIn (read-only) | Manual URL pasting for performance tracking | MVP-3 (manual only) |
| Buffer / Hypefury / Typefully | Scheduling queue bridge | future |
| Astraea HQ | Reporting / cross-agent events | MVP-4 |

**Maven does not have publishing access to any social platform. Ever.**

## Adapter interfaces

### `StorageAdapter`

```ts
interface StorageAdapter {
  appendItem(item: ContentItem): Promise<void>;
  getItem(id: string): Promise<ContentItem | null>;
  listItems(filter: ContentFilter): Promise<ContentItem[]>;
  updateStatus(id: string, status: ContentItem['status'], actor: 'danny' | 'miriam'): Promise<void>;
  updateBody(id: string, body: string, hook: string): Promise<void>;
  logPublished(id: string, url: string, publishedAt: string): Promise<void>;
  logPerformance(id: string, note: string): Promise<void>;
}
```

Implementations: `jsonl.ts` (always on), `sheets.ts` (Sheets is the human-facing view), `drive.ts` (full draft text).

### `LLMAdapter`

```ts
interface LLMAdapter {
  generateIdeas(input: IdeaRequest): Promise<Idea[]>;
  draft(input: DraftRequest): Promise<Draft[]>;
  repurpose(notes: string): Promise<Idea[]>;
  planCalendar(input: CalendarRequest): Promise<CalendarSlot[]>;
}
```

Implementations: `anthropic.ts` (primary), `openai.ts` (optional), `mock.ts` (deterministic stub for offline dev).

### `NotifierAdapter`

```ts
interface NotifierAdapter {
  sendDraft(item: ContentItem): Promise<void>;
  sendCalendar(slots: CalendarSlot[]): Promise<void>;
  sendDigest(digest: ContentDigest): Promise<void>;
  notifyApprovalNeeded(item: ContentItem): Promise<void>;
}
```

Implementations: `telegram.ts`, `console.ts`, `mock.ts`.

### `VoiceProfile`

A small library, not an LLM adapter:

```ts
type VoiceProfile = {
  id: 'danny' | 'miriam' | 'apis_brand';
  description: string;          // loaded from /data/maven/config/voice/<id>.md
  doPhrases: string[];
  avoidPhrases: string[];
  requiresHumanApproval: boolean;  // miriam: true; others: still gated, but warning level
};
```

Loaded once at startup. Injected into every drafter call.

## Google Workspace setup

- Service account in Google Cloud (can reuse the one Stella uses, or create a Maven-specific one — recommend separate so permissions stay narrow).
- Enable **Sheets API** and **Drive API**.
- Share the Maven calendar Sheet and parent Drive folder with the service-account email.
- Set `MAVEN_CONTENT_CALENDAR_SHEET_ID` and `MAVEN_DRIVE_FOLDER_ID` in `.env`.

Required Sheet tabs (Maven creates them on first run if missing):

```
Weekly Calendar
Monthly Calendar
Content Backlog
Drafts
Approved
Published
Ideas
Hooks
Performance Notes
```

Column order in `Drafts` / `Approved` / `Published` (one header row, frozen):

```
id | createdAt | updatedAt | pillar | channel | audience | voice |
status | hook | scheduledFor | publishedAt | publishedUrl |
approvedBy | sourceRef | driveLink | variantNote | hashtags | performanceNote
```

`Drafts` also includes a `body_preview` column (first 200 chars) so Danny can scan without opening Drive.

## Google Drive layout

```
/APIS Legal Technology/
  /Maven - Content/
    /Content Calendar/
      <weekly snapshots, exported PDF or .md>
    /Draft Posts/
      MVN-<id>.md
    /Approved Posts/
      MVN-<id>.md
    /Video Scripts/
      MVN-<id>.md
    /Newsletter Drafts/
      MVN-<id>.md
    /Repurposed Meeting Notes/
      <source-note id>/<list of MVN- ids derived from it>
    /Brand Voice/
      danny.md
      miriam.md
      apis.md
      honey_ledger_capabilities.md
    /Published Archive/
      <year>/<month>/MVN-<id>.md
```

`/Brand Voice/` is read by Maven at startup. Editing those files updates her voice without code changes.

## Honey Ledger capabilities list

`/data/maven/config/honey_ledger_capabilities.md` is the source-of-truth for what the product can and cannot do. Maven's drafter post-check fails if a draft claims a capability not on this list.

Initial entries (to be confirmed with Danny):

```
CAN
- Turn rough work notes into structured billing entry drafts.
- Surface vague or non-billable language.
- Categorize entries by matter / client.
- Export drafts for human review.

CANNOT (yet)
- Auto-submit to a billing system (humans review and submit).
- Replace attorney judgment on what's billable.
- Integrate with Clio / MyCase / PracticePanther (roadmap).
- Provide legal advice on billing compliance.
```

## Telegram bot

- One bot for Maven in MVP-1 (`@MavenAPISBot` or similar — final name TBD with Danny).
- Long-polling in dev, webhook on Railway in prod.
- `ALLOWED_TELEGRAM_IDS` mandatory.

See `TELEGRAM_SETUP.md`.

## Future integrations

| Integration | Purpose | Notes |
| --- | --- | --- |
| LinkedIn API | Scheduled-draft creation (still human-reviewed) | Requires LinkedIn approval; not until volume justifies it. |
| Buffer / Typefully / Hypefury | Queue bridge | Maven writes drafts; the tool holds them. Publishing still human-triggered. |
| Substack / Beehiiv | Newsletter draft sync | Read-only sync of subscriber count and post URL. Maven never publishes. |
| Image generator (Midjourney, etc.) | Image prompt handoff | Maven outputs an image prompt; Danny generates the image. |
| Honey Ledger product feed | Auto-propose content from product milestones | Phase-2 cross-agent integration. |
| Stella consult-booked events | Optional anonymized founder-journey content prompts | Heavy guardrails; never auto-drafts. |

## Tools Maven will *not* use

- Direct publishing APIs.
- Scrapers / spinners / "AI content at scale" generators.
- Engagement automation (auto-likes, auto-comments, follow/unfollow).
- Anything that requires logging in with Danny's or Miriam's personal social credentials.
- Any tool that touches a prospect or external person without human approval.
