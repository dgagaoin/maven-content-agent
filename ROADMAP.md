# Maven — Roadmap

Build in small, useful phases. Ship MVP-1 before touching MVP-2.

## Phase 0 — Documentation (current)

- [x] README.md
- [x] PROFILE.md
- [x] SPEC.md
- [x] SYSTEM_PROMPT.md
- [x] TOOLS.md
- [x] MEMORY.md
- [x] SECURITY.md
- [x] TELEGRAM_SETUP.md
- [x] ROADMAP.md
- [ ] Danny review + sign-off
- [ ] Miriam sign-off specifically on the `miriam` voice profile and attorney-advertising guardrails

## MVP-1 — Drafting + lifecycle (target: shipped within 2 sessions)

Goal: ask Maven for content, get reviewable drafts, run them through the approval lifecycle, log what gets published.

- [ ] Project scaffold (`package.json`, `tsconfig.json`, `.env.example`, folder layout)
- [ ] Telegraf bot skeleton + allow-list middleware
- [ ] Anthropic adapter + mock adapter (LLM)
- [ ] ContentItem schema + Zod validator
- [ ] Voice profile loader (`/Brand Voice/danny.md`, `miriam.md`, `apis.md`)
- [ ] Honey Ledger capabilities loader (`honey_ledger_capabilities.md`)
- [ ] Pillars config loader
- [ ] Drafters: LinkedIn (3 variants), X thread, email, blog, video script
- [ ] Idea generator (5 ideas per call)
- [ ] Calendar generator (week + month)
- [ ] Lifecycle commands: `/approve`, `/reject`, `/regen`, `/publish`
- [ ] JSONL storage adapter (append-only audit log)
- [ ] Google Sheets storage adapter
- [ ] Google Drive draft writer
- [ ] Notifier (Telegram) — draft review format
- [ ] Recent-hooks cache (in-memory, persisted)
- [ ] Prohibited-phrase post-check filter
- [ ] Hype-vocabulary post-check filter
- [ ] Capabilities-list post-check filter (no fabricated features)
- [ ] Miriam-voice approval-required tag
- [ ] Natural-language router (light keyword match)
- [ ] Unit tests for: drafter schema validation, prohibited-phrase filter, capabilities filter, voice gate, lifecycle transitions
- [ ] README quick-start works end-to-end on a clean machine

**Acceptance:** see `SPEC.md` MVP-1 acceptance criteria.

## MVP-2 — Repurposing engine

Goal: pasted notes (meeting recaps, demo notes, founder reflections) become content idea candidates with source-refs.

- [ ] `/repurpose` command
- [ ] Confidentiality stripper (names, financials, client matter detail, PII)
- [ ] Source-ref tracking back to original notes
- [ ] Multi-channel fanout (one note → 2–5 idea candidates across pillars)
- [ ] Idea quality filter (reject thin / generic ideas)
- [ ] Optional Granola / Fireflies integration to pull meeting notes directly

## MVP-3 — Performance + feedback loop

Goal: published content informs future drafts.

- [ ] `/publish <id> <url>` records the live URL
- [ ] Manual performance logging (`/perf <id> "reach=X, comments=Y, note"`)
- [ ] "What's working" digest (top hooks last 30 days, by pillar)
- [ ] Feedback fragment injected into drafter prompt (`<whats_working>` block)
- [ ] Optional: LinkedIn URL → manual paste of metrics → log normalization

## MVP-4 — Astraea handoff + cross-agent

Goal: Maven plugs into the broader AIOS.

- [ ] Internal HTTP / function-call interface (`getWeekCalendar`, `getApprovedQueue`, `getPublishedSince`)
- [ ] Daily Maven section in Astraea's morning briefing
- [ ] Honey Ledger product milestone → Maven idea-candidate cross-agent event
- [ ] Stella consult-booked → optional anonymized founder-journey idea prompt (high guardrails, never auto-draft)

## Phase 2 — Nice-to-haves

- [ ] Buffer / Typefully / Hypefury bridge (Maven writes; queue holds; human approves and publishes)
- [ ] LinkedIn API integration for scheduled-draft creation (still human-approved per item)
- [ ] Carousel / slide generator for LinkedIn document posts (Maven writes copy; image generation is a separate handoff)
- [ ] Hook A/B variant tester (offline scoring; not live posting)
- [ ] Hashtag / keyword research integration
- [ ] Image prompt generator (handoff: Maven outputs the prompt; Danny generates the image)
- [ ] Newsletter platform bridge (Substack / Beehiiv) — drafts only, no auto-publish
- [ ] Web intake form: "send Maven an idea" — Danny / Miriam can fire ideas from the road
- [ ] Cross-pillar series builder ("a 5-part LinkedIn series on legal billing")
- [ ] Voice-eval harness: blind side-by-side of Maven drafts vs reference posts to tune the voice profile

## Known limitations

- MVP-1 has no publishing capability. By design.
- LLM drafting can drift in voice across long sessions; the voice profile is re-injected each call to mitigate.
- Hashtag suggestions are heuristic, not researched against real-time platform data.
- Performance data is manually logged — no API ingestion until MVP-3+ Phase 2.
- The Honey Ledger capabilities list must be kept in sync with the product. Stale list = either over-claiming or under-claiming.
- Miriam-voiced drafts always require Miriam's manual review; no shortcut.
- The recent-hooks cache only prevents *exact* repetition; subtle angle repetition still needs human eye.

## Decisions deferred

- Whether Maven and Stella share one Google service account or have separate ones (recommend separate)
- **Master bot:** `@AstraeaHQBot` (confirmed). Maven runs as her own bot for MVP; the router work happens later.
- Which scheduling tool (if any) bridges Maven → publishing (Buffer / Typefully / Hypefury / native API)
- Whether MVP-2 ships before MVP-1 hardening (probably no — get a few weeks of drafting first)
- Where the canonical voice profiles live long-term — Drive (current plan, editable by humans) vs in-repo (Git-tracked, code-reviewable). For now: Drive, with Git-tracked seed copies in `/agents/maven/config/voice/`.

## Deferred config artifacts

See `CONFIG_TODO.md`. Maven reminds Danny/Miriam in the daily digest until each artifact is provided. Items: `honey_ledger_capabilities`, `voice_profile_danny`, `voice_profile_miriam` (Miriam approval required), `voice_profile_apis_brand`, `prohibited_phrases_extended`, `pillars_config`.
