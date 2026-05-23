# Maven — Memory

## What Maven may remember

### Persistent (long-lived)
- ContentItems in Sheets / JSONL / Drive (idea, draft, approved, published, archived).
- Voice profiles for Danny / Miriam / APIS brand (loaded from `/Brand Voice/`).
- Content pillars and the angles already used per pillar (to avoid repetition).
- Honey Ledger capabilities list (what the product can / cannot claim).
- Performance notes (manually logged): which hooks landed, which pillars resonated.
- Static business context: APIS Legal Technology mission, founder bios, product summary.
- Maven's own profile and system prompt (loaded from `PROFILE.md` + `SYSTEM_PROMPT.md`).

### Session-scoped
- Conversational context during a drafting cycle (topic, channel, count, voice, recent feedback).
- A "recent posts" cache (last 30 days) used to prevent angle repetition.

### Audit / replay
- Append-only JSONL of every ContentItem state change and every draft generation.
- Telegram message IDs for traceability.

## What Maven must not remember or store

- **Caller content from Stella.** Maven has no read access to Stella's leads, transcripts, or summaries by default.
- **Client matter detail.** Anything that would identify a specific client matter or its facts.
- **Internal financials from Moneypenny.** Revenue numbers, owner pay, tax reserves — out of scope.
- **Unreleased product timelines** unless explicitly approved for public communication.
- **Personal data of any non-founder individual** — no names, contact info, or quotes without explicit per-item approval.
- **PII of any kind** in drafts or in the calendar.

## Memory tiers

```
Tier 0 — Static context (loaded at startup)
  /agents/maven/PROFILE.md
  /agents/maven/SYSTEM_PROMPT.md
  /Brand Voice/danny.md
  /Brand Voice/miriam.md
  /Brand Voice/apis.md
  /Brand Voice/honey_ledger_capabilities.md
  /agents/maven/config/pillars.json

Tier 1 — Persistent content state (read/write at runtime)
  Google Sheet (calendar / backlog / status board)
  Google Drive (full draft text)
  /data/maven/content.jsonl

Tier 2 — Session memory
  Current drafting cycle scratchpad
  Recent-posts cache (last 30 days, hooks + pillars only)

Tier 3 — Audit log (write-only)
  /data/maven/audit.jsonl
  Every state transition, every draft generation, every publication log
```

## How memory is updated

- **On new idea / draft** → JSONL append → Sheet row upsert → Drive write (full body).
- **On status change** (`/approve`, `/reject`, `/publish`) → JSONL append (with actor) → Sheet update.
- **On regeneration** → new JSONL line with `parentId` linking to the previous draft; previous draft retained.
- **On performance log** → JSONL append → Sheet `Performance Notes` tab update; feedback hint added to a small "what's working" prompt fragment used by the drafter.
- **On voice profile edit** (the human edits `/Brand Voice/*.md`) → next startup picks up changes; restart documented.

Maven never silently mutates a draft. If she regenerates, the new draft has a new id; the old draft is preserved in the audit log.

## Shared memory vs Maven-specific memory

### Shared with Astraea (read-only from Maven's side, query interface)
- Aggregate counts: ideas, drafts, approved-waiting, published-this-week.
- Calendar for the upcoming week.
- A "what's worked" summary (top performing hooks, last 30 days).

### Shared with Stella
- **Default: nothing.** No caller content flows into Maven.
- Exception: if a human explicitly takes a caller's permission to use a testimonial, Danny or Miriam manually creates an idea referencing it; Stella's data is not auto-pulled.

### Shared with Moneypenny
- Nothing. Financial state stays in Moneypenny's systems.

### Shared with Honey Ledger (the product)
- **From Honey Ledger → Maven (read-only):** announcement-ready milestones (e.g., "MVP shipped to first pilot," "demo recording available"). Phase-2 integration.
- **From Maven → Honey Ledger:** none.

### Maven-only
- All draft text, including regenerated variants.
- Voice profiles and pillar configuration.
- Recent-posts cache.
- Performance notes.

## Forgetting / retention

- Drafts that never reach `approved` are retained for 90 days, then archived to `/Published Archive/rejected/`.
- Approved drafts retained indefinitely (small data, high reuse value).
- Published items retained indefinitely; full text moved to `Published Archive` after 30 days.
- Performance notes retained indefinitely.
- Source-reference links to meeting notes retained as long as the source note exists.

## Memory loaded into every LLM call

A trimmed context block, not the full content history:

```
<maven_context>
  <business>APIS Legal Technology — see PROFILE.md preamble.</business>
  <voice_active>{danny | miriam | apis_brand}</voice_active>
  <voice_profile>{relevant voice profile content}</voice_profile>
  <pillars>{five-pillar list with one-line description each}</pillars>
  <honey_ledger_capabilities>{from honey_ledger_capabilities.md — CAN list and CANNOT list}</honey_ledger_capabilities>
  <recent_hooks_30d>{20 most recent hooks across all drafts, to avoid repetition}</recent_hooks_30d>
  <whats_working>{2–3 lines of performance hints, if any}</whats_working>
  <prohibited>No legal advice. No hype vocabulary. No fabricated features. No PII.</prohibited>
</maven_context>
```

Token budget for context: ≤ 3,000 tokens. The recent-hooks cache and whats-working block are trimmed first when over budget.
