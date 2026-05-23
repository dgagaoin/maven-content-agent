# Maven — Railway deployment

Mirrors the Stella + Moneypenny pattern. ~10 minutes.

## What's already in place

- `railway.json` — NIXPACKS, `npm run build`, `npm start`
- `/health` endpoint on `process.env.PORT`
- TypeScript build verified

## Steps

### 1. GitHub repo

Already created at https://github.com/dgagaoin/maven-content-agent.

### 2. Create the Railway service

1. Open [Railway dashboard](https://railway.app/) → the APIS project where Stella + Moneypenny live.
2. **+ New Service** → **GitHub Repo** → pick `maven-content-agent`.
3. Railway auto-detects `railway.json`.
4. **Root Directory** stays `/` (Maven is the whole repo).

### 3. Environment variables in Railway

Variables tab → Raw Editor → paste:

```
MAVEN_TELEGRAM_BOT_TOKEN=<paste from BotFather>
MAVEN_DRIVE_FOLDER_ID=1rX4cYRchWwwXz1xAsJzpj-XPswU5EnNd
ANTHROPIC_API_KEY=<paste from astraea/.env>
ANTHROPIC_MODEL=claude-sonnet-4-6
ALLOWED_TELEGRAM_IDS=8658744063
TELEGRAM_MODE=polling
ENVIRONMENT=production
LOG_LEVEL=info
```

### 4. `MAVEN_DRIVE_OAUTH_TOKEN`

Locally Maven reads the file at `astraea/credentials/drive_oauth_token.json`. On Railway, paste the JSON contents inline. PowerShell one-liner to get a single-line minified version:

```powershell
(Get-Content C:\Users\dgaga\Projects\astraea\credentials\drive_oauth_token.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress)
```

Copy that output → paste as the value of `MAVEN_DRIVE_OAUTH_TOKEN` in Railway.

### 5. Deploy

Railway auto-deploys on git push. Watch the deploy log for:

```
[maven] starting {"env":"production","mode":"polling"}
[maven] env layers {...}
[maven] drive adapter: ready
[maven] llm adapter: anthropic
[maven] health server listening
[maven] telegram polling started
```

### 6. Verify

In Telegram, message `@MavenAPISBot`:

```
/start
/post_ideas
/draft_linkedin Honey Ledger demo
```

You should get 3 LinkedIn drafts. `/approve <id>` moves one to approved. `/item <id>` shows the full record.

### 7. Same caveats as Stella

- Stop any local `npm run dev` before Railway goes live (409 conflict).
- Miriam-voiced drafts (`v=miriam`) are blocked from approval until Miriam-as-actor is wired in.

## Health check

Once deployed, hit `https://<railway-url>/health` to verify adapters are ready. JSON response includes drive/llm/telegram state.
