# Maven — Telegram Setup

Walk through this once when it's time to issue Maven's bot token. Mirrors the `ai-council-bot` / Stella pattern.

## 1. Create the bot

1. Open Telegram and search for **@BotFather**.
2. Send `/newbot`.
3. Choose a display name. Suggested: `Maven — APIS Content`.
4. Choose a username ending in `bot`. Suggested: `MavenAPISBot` (BotFather will tell you if taken).
5. BotFather replies with a token in the form `123456789:AA...`. **This is the bot token.** Treat it like a password.

## 2. Configure the bot

In the same BotFather chat:

```
/setdescription
@MavenAPISBot
Content planning and drafting agent for APIS Legal Technology. Drafts go through human approval before publishing.

/setabouttext
@MavenAPISBot
Maven — internal content agent for APIS Legal Technology.

/setcommands
@MavenAPISBot
start - Show capabilities
content_calendar - Show or generate calendar
post_ideas - Generate content ideas
draft_linkedin - Generate LinkedIn drafts
draft_thread - Generate an X thread
draft_email - Generate a newsletter draft
draft_blog - Generate a blog draft
video_script - Generate a short-video script
repurpose - Turn pasted notes into ideas
content_backlog - Show backlog
approved - Show approved-waiting-to-publish queue
item - Show a specific item
approve - Approve a draft
reject - Reject a draft
regen - Regenerate a draft
publish - Mark published with URL
digest - Today's snapshot
help - Help

/setprivacy
@MavenAPISBot
Disable        # so the bot can read all group messages, not just commands
```

> `setprivacy: Disable` is fine because Maven lives in a private group chat with Danny + Miriam. If she's ever added to a wider chat, flip back.

## 3. Get your Telegram user IDs

Both Danny and Miriam need IDs in `ALLOWED_TELEGRAM_USER_IDS`.

1. Open Telegram and search **@userinfobot**. Tap **Start**. Copy your numeric ID.
2. Repeat for Miriam. Comma-separated list.

If Maven lives in a group chat, grab the **chat ID**:
- Add @RawDataBot or @JsonDumpBot to the group, send any message, copy the negative-prefixed chat ID (e.g. `-100123456789`), remove the helper.
- Add to `TELEGRAM_ALLOWED_CHAT_IDS`.

## 4. Local `.env`

Create `agents/maven/.env` (gitignored):

```
TELEGRAM_BOT_TOKEN=123456789:AA...
ALLOWED_TELEGRAM_IDS=12345678,87654321
TELEGRAM_ALLOWED_CHAT_IDS=-1001234567890
TELEGRAM_MODE=polling
WEBHOOK_BASE_URL=

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# OR
GOOGLE_SERVICE_ACCOUNT_PATH=./credentials/maven-sa.json

MAVEN_CONTENT_CALENDAR_SHEET_ID=
MAVEN_DRIVE_FOLDER_ID=
MAVEN_DEFAULT_CHANNELS=LinkedIn,Website,Email

LOG_LEVEL=info
ENVIRONMENT=development
USE_MOCK_ADAPTERS=false
```

Commit `agents/maven/.env.example` with the same keys and empty values. **Never commit the real `.env`.**

## 5. Test locally

```bash
cd agents/maven
npm install
cp .env.example .env   # then fill in
npm run dev
```

Expected console output:

```
[maven] starting in development mode
[maven] voice profiles loaded: danny, miriam, apis_brand
[maven] pillars loaded: 5
[maven] honey_ledger capabilities loaded: 4 CAN, 4 CANNOT
[maven] storage adapters: jsonl, sheets, drive
[maven] llm adapter: anthropic
[maven] allowed user ids: 12345678, 87654321
[maven] telegram bot ready as @MavenAPISBot
```

In Telegram, message the bot:

```
/start
```

Then:

```
/post_ideas honey_ledger
```

Maven should return 5 ideas across channels and voices. Then:

```
/draft_linkedin honey_ledger
```

She should return 3 distinct LinkedIn drafts.

## 6. Deploy (Railway)

1. Create a Railway project (or new service in an existing one).
2. Link the repo / `agents/maven` subfolder.
3. Add all env vars from `.env`.
4. Mount a persistent volume at `/data` for JSONL + cache.
5. Deploy. Verify Telegram bot responds.
6. `BOT_MODE=production`. Long-polling is fine at this scale.

## 7. Rotate / revoke

- BotFather → `/token` → choose bot → `Revoke current token` for a new one.
- Update `TELEGRAM_BOT_TOKEN` in `.env` and Railway.
- Service-account JSON: regenerate in Google Cloud → IAM → Service Accounts → keys.

## 8. Single-bot router (future)

Spec proposes one master `@AstraeaHQBot` that routes to Moneypenny / Stella / Maven. For MVP, Maven runs as her own bot. When the router is built, Maven's bot becomes optional and the router talks to her via internal HTTP or pubsub.

## 9. Common issues

- **`401 Unauthorized`** — bad token. Re-check `.env`.
- **Bot doesn't reply in a group** — `/setprivacy` is `Enable`; switch to `Disable`.
- **`PERMISSION_DENIED` from Sheets/Drive** — service-account email is not shared on the resource. Share with Editor.
- **Empty `ALLOWED_TELEGRAM_USER_IDS`** in prod — bot refuses every message.
- **`BLOCKED` tag on every draft** — the prohibited-phrase filter is firing. Check the offending phrase in the Telegram reply; either rephrase the request, edit the blocklist, or update the voice profile.
- **Drafts feel same-y** — the recent-hooks cache may be empty (after restart). Generate more, or paste a specific angle hint.

## 10. Bot persona note

When users `/start` Maven, she introduces herself with a one-paragraph self-description so it's clear she does not publish anything autonomously and that every draft goes through review. Reduces the chance someone thinks they're talking to a posting bot.
