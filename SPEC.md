# Maven — Specification

## Product goal

A content planning and drafting agent that builds the APIS Legal Technology content engine on top of one founder team. Maven turns ideas, meeting notes, product progress, and founder reflections into reviewable, approval-gated content drafts across LinkedIn, X, blog, email, and short-video script formats.

## Non-goals

- Maven does not publish to any platform directly.
- Maven does not generate images, video, or audio (Phase 2).
- Maven does not run paid ads or A/B tests.
- Maven does not write Miriam-voiced posts without sending them to Miriam for approval.
- Maven does not invent product features that don't exist.

## Content pillars

Every piece of content must map to at least one pillar:

| Pillar | Purpose | Examples |
| --- | --- | --- |
| **1. Legal billing education** | Help attorneys bill better | "5 vague billing entries that get rejected," "How AI can help attorneys write reviewable narratives" |
| **2. AI for small law firms** | Practical AI workflows for solos and small firms | "An intake workflow for a 2-attorney firm," "AI for legal admin, not AI for legal advice" |
| **3. Founder journey** | Danny + Miriam building APIS in public | "Why we formed APIS Legal Technology," "What we learned shipping Honey Ledger MVP" |
| **4. Honey Ledger** | Product education and progress | "Demo: rough notes → billing entry in 12 seconds," "Three billing problems Honey Ledger solves" |
| **5. AI education / consulting** | Workflow audits, training, custom AIOS for small business | "What a workflow audit actually looks at," "AI literacy for small business owners" |

## User flows

### Flow 1 — Generate a content calendar

```
Danny: "Maven, plan next week's content calendar."
   ↓
Maven asks (or assumes): how many posts per channel? any themes? any product milestones?
   ↓
Maven generates a Mon–Fri schedule across LinkedIn / X / Email
   ↓
Each slot = pillar + angle + hook + 1-line description + status: Idea
   ↓
Maven writes the calendar to Sheet "Weekly Calendar" tab and replies in Telegram with the table
```

### Flow 2 — Draft a post

```
Danny: "Maven, draft 3 LinkedIn posts about Honey Ledger."
   ↓
Maven picks 3 distinct angles from pillar 4
   ↓
For each: hook + body + soft CTA + variant note ("why this works")
   ↓
Maven writes drafts to Drive, indexes in "Drafts" tab with status: Draft
   ↓
Telegram reply shows all 3 with /approve <id>, /reject <id>, /regen <id> buttons
```

### Flow 3 — Repurpose meeting notes

```
Danny pastes meeting notes / demo notes / founder reflections
   ↓
Maven extracts content-worthy moments (stripping confidential detail)
   ↓
Maven proposes 2–5 content ideas across pillars and channels
   ↓
Danny picks which to develop → Maven drafts those
   ↓
Logged with source-reference back to the original note
```

### Flow 4 — Approval lifecycle

```
Idea       → in calendar, no draft yet
Draft      → full text exists, awaiting review
Review     → Danny / Miriam editing
Approved   → cleared to post; Maven holds final copy
Published  → human posts manually, marks published, optional URL + date
Archived   → moved to Published Archive after 30 days
```

Each item carries an audit trail of who advanced the status and when.

## Content schema

```ts
type ContentItem = {
  id: string;                      // ULID, e.g. "MVN-01HX..."
  createdAt: string;
  updatedAt: string;
  pillar: Pillar;
  channel: 'linkedin' | 'x' | 'blog' | 'email' | 'video_script' | 'thread';
  audience: 'attorneys' | 'small_business' | 'founders' | 'general';
  voice: 'danny' | 'miriam' | 'apis_brand';
  status: 'idea' | 'draft' | 'review' | 'approved' | 'published' | 'archived' | 'rejected';
  hook: string;                    // first line; the part that does the work
  body: string;                    // full draft
  cta: string | null;              // soft CTA, may be empty
  variantNote: string;             // 1-line "why this works" for the reviewer
  hashtags: string[];
  sourceRef: string | null;        // meeting note id, lead id (PII-stripped), product milestone, or null
  scheduledFor: string | null;     // ISO date if planned for a slot
  publishedAt: string | null;
  publishedUrl: string | null;
  performanceNote: string | null;  // human-logged after publication
  approvedBy: 'danny' | 'miriam' | null;
};

type Pillar =
  | 'legal_billing_education'
  | 'ai_for_small_law_firms'
  | 'founder_journey'
  | 'honey_ledger'
  | 'ai_education_consulting';
```

## Core commands

Telegram (slash):

```
/start                                  Show capabilities
/content_calendar [week|month]          Show / generate calendar
/post_ideas [pillar]                    Generate 5 ideas, optionally filtered by pillar
/draft_linkedin <topic|id>              Generate 3 LinkedIn drafts
/draft_thread <topic|id>                Generate an X/Twitter thread
/draft_email <topic|id>                 Generate a newsletter draft
/video_script <topic|id>                Generate a short-video script (45–90s)
/draft_blog <topic|id>                  Generate a 600–900 word blog draft
/repurpose                              Paste notes — Maven proposes content
/content_backlog                        Show backlog (idea / draft / review)
/approved                               Show approved-and-waiting-to-publish queue
/item <id>                              Show full ContentItem
/approve <id>                           Move to approved (records approver)
/reject <id> <reason>                   Move to rejected
/regen <id> [hint]                      Regenerate this draft
/publish <id> <url>                     Mark published, log URL
/digest                                 Today's content snapshot
/configtodo                             Show pending config artifacts (see CONFIG_TODO.md)
/help
```

Natural language examples (router maps to commands):

```
"Maven, draft 5 LinkedIn posts about Honey Ledger."   → /draft_linkedin + count=5 + topic=honey_ledger
"Maven, turn today's meeting notes into ideas."        → /repurpose
"Maven, plan next week's content calendar."            → /content_calendar week
"Maven, write a founder journey post about forming APIS." → /draft_linkedin + voice=danny + pillar=founder_journey
```

## Output formats

### Draft (LinkedIn example)

```
✏️  MVN-01HX  ·  LinkedIn  ·  Danny  ·  honey_ledger  ·  status: Draft

HOOK
Most attorneys lose 30 minutes a day writing billing entries no one wants to read.

BODY
Vague entries get kicked back. Detailed ones take forever. You end up with notes
like "reviewed file" and "called client" — and a partner asking what you actually did.

We built Honey Ledger because Miriam was tired of this. Rough notes go in;
structured, reviewable billing entries come out. You still review every line —
the AI just stops you from staring at a blank narrative field.

If you're a solo or small-firm attorney and this sounds familiar, I'd love a 15-min look.

CTA  (soft)
DM if you want to see a demo.

WHY THIS WORKS
Concrete pain → concrete product. Co-founder named. Soft CTA. No legal claims.
Founder voice. Under 130 words. First line carries the post.
```

### Calendar (week)

```
📅  Week of May 25 — APIS Content

Mon  LinkedIn   Danny    founder_journey       Why APIS exists
Tue  X thread   Danny    ai_for_small_law      AI for legal admin, not legal advice
Wed  LinkedIn   Miriam   legal_billing_edu     5 entries that get rejected
Thu  Email      APIS     honey_ledger          Demo recap + waitlist signup
Fri  LinkedIn   Danny    honey_ledger          Build-in-public progress note

3 drafts ready · 2 ideas pending · 0 approved waiting
```

## MVP scope

### MVP-1 — Drafting + lifecycle (ship first)
- Project scaffold, Telegram bot, allow-list middleware
- Anthropic adapter + mock adapter
- ContentItem schema + Zod validator
- Drafters: LinkedIn (3 variants), X thread, email, blog, video script
- Idea generator (5 ideas per pillar)
- Calendar generator (week and month)
- Status lifecycle commands (`/approve`, `/reject`, `/regen`, `/publish`)
- Storage: JSONL + Google Sheets + Drive (full text in Drive, metadata in Sheets)
- Prohibited-phrase post-check (legal-advice / hype filter)
- Voice profiles for Danny / Miriam / APIS

### MVP-2 — Repurposing engine
- `/repurpose` paste → 2–5 content ideas
- Source-ref tracking back to original notes
- Confidentiality stripper (names, financials, client matter detail)
- Meeting-recap → multi-channel content fanout

### MVP-3 — Performance + feedback loop
- Manual logging of post URL + perf snapshot
- "What's worked" digest (top hooks, top pillars by reach)
- Feedback hint feeds into the draft prompt for next round

### MVP-4 — Astraea handoff
- Query interface for HQ briefing
- Cross-agent: Honey Ledger milestone → Maven draft proposed
- Cross-agent: Stella consult booked → optional anonymized founder-journey content idea

## Future roadmap

- LinkedIn Scheduled-draft API integration (still human-approved per item)
- Buffer / Hypefury bridge for queue management
- Carousel/slide generator for LinkedIn document posts
- Hook A/B variant tester (offline, no live posting)
- Hashtag/keyword research integration
- Image prompt generator (handoff to Danny's image workflow)
- Newsletter platform bridge (Substack/Beehiiv) — still human-publish

## Data structure on disk

```
/data/maven/
  content.jsonl              # append-only audit log
  drafts/
    MVN-<id>.md              # full draft text
  scripts/
    MVN-<id>.md
  archive/
    MVN-<id>.md              # post-publish snapshot
  config/
    pillars.json
    voice/
      danny.md
      miriam.md
      apis.md
```

## Acceptance criteria for MVP-1

- `/draft_linkedin honey_ledger` returns 3 distinct LinkedIn drafts in under 30 seconds, each ≤ 1,300 chars, each with a hook line and a variant note.
- Each draft passes the prohibited-phrase filter (no hype phrases, no legal-advice phrases, no fabricated Honey Ledger features).
- `/content_calendar week` populates the Weekly Calendar tab with 5 slots, each tagged with pillar, channel, voice, and status.
- `/approve <id>` updates the Sheet row and JSONL.
- `/item <id>` returns the full ContentItem with current status and audit trail.
- No outbound publishing capability exists in code (publishing is human-only).
