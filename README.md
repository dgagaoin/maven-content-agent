# Maven — Social Media & Content Planning Agent

Maven is the content brain for **APIS Legal Technology**. She plans content calendars, drafts posts, repurposes meeting notes and product milestones, and keeps Danny and Miriam's voice consistent across channels — without ever publishing publicly without human approval.

She is one of four specialist agents that plug into Astraea / Estrella (company HQ):

```
Astraea (HQ) → Moneypenny (finance) | Stella (reception) | Maven (content) | Honey Ledger (product)
```

## What Maven does

- Builds weekly and monthly content calendars across LinkedIn, X/Twitter, blog, email
- Drafts posts in the founders' voice (educational, practical, founder-led)
- Suggests content themes from APIS's five pillars (see SPEC)
- Repurposes meeting notes, demo recordings, and product updates into drafts
- Manages an `Idea → Draft → Review → Approved → Published → Archived` lifecycle
- Tracks performance notes (manually logged) and uses them to refine future drafts
- Surfaces a daily "what's queued" digest in Telegram

## What Maven does not do

- Publish to any external platform without explicit human approval per post
- Make unsupported legal claims or imply legal outcomes
- Use Miriam's attorney status in misleading ways
- Overpromise AI capabilities or fabricate Honey Ledger features
- Share confidential client, caller, or business-financial information
- Lift caller content from Stella's leads
- Sound like generic AI hype

See `SECURITY.md` for the full guardrail list.

## Stack

- **Runtime:** Node.js 20+, TypeScript
- **Bot framework:** Telegraf (matches `ai-council-bot` + Stella)
- **Storage:** Google Sheets (calendar + backlog) + Google Drive (drafts, scripts, archive)
- **LLM:** Anthropic (Claude) primary, OpenAI optional
- **Image / video:** out of scope for MVP — Maven drafts copy; humans handle assets

## Repo layout (planned)

```
/agents/maven/
  README.md
  PROFILE.md
  SPEC.md
  SYSTEM_PROMPT.md
  TOOLS.md
  MEMORY.md
  SECURITY.md
  TELEGRAM_SETUP.md
  ROADMAP.md
  src/
    index.ts
    bot/
      handlers.ts            # /content_calendar, /draft_linkedin, etc.
      router.ts
    content/
      schema.ts              # ContentItem, Calendar, Pillar types
      pillars.ts              # five content pillars
      generators/
        linkedin.ts
        x.ts
        blog.ts
        email.ts
        videoScript.ts
      repurpose.ts            # notes → drafts
      calendar.ts             # weekly/monthly planning
    voice/
      brand.ts                # voice guidelines + checks
      founderVoice.ts         # Danny vs Miriam vs APIS voice profiles
    storage/
      sheets.ts
      drive.ts
      jsonl.ts
    prompts/
      drafter.ts
      planner.ts
      repurposer.ts
    utils/
      hashtags.ts
      hooks.ts
  tests/
  .env.example
  package.json
  tsconfig.json
```

## Quick start (once implemented)

```bash
cd agents/maven
npm install
cp .env.example .env
# fill TELEGRAM_BOT_TOKEN, ANTHROPIC_API_KEY, MAVEN_CONTENT_CALENDAR_SHEET_ID
npm run dev
```

Without Google credentials, Maven runs in mock-storage mode (local JSONL) so Danny can test drafting offline.

## Required environment variables

See `.env.example` and `TELEGRAM_SETUP.md`. Core set:

```
TELEGRAM_BOT_TOKEN=
ALLOWED_TELEGRAM_IDS=
TELEGRAM_ALLOWED_CHAT_IDS=
TELEGRAM_MODE=polling
WEBHOOK_BASE_URL=
ANTHROPIC_API_KEY=
GOOGLE_SERVICE_ACCOUNT_JSON=
MAVEN_CONTENT_CALENDAR_SHEET_ID=
MAVEN_DRIVE_FOLDER_ID=
MAVEN_DEFAULT_CHANNELS=LinkedIn,Website,Email
LOG_LEVEL=info
ENVIRONMENT=development
```

## Status

Documentation phase. No code yet. See `ROADMAP.md` for build order.
