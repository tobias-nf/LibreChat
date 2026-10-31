# Local LibreChat

This folder is the root of the `tobias-nf/LibreChat` fork. `origin` points to
the fork and `upstream` to `LibreChat-AI/LibreChat`. The initial checkout is
upstream `main` at `94d3d12bd5a1f18c1129fcb6f1d7deac063a1f67` (v0.8.9-rc1).
Company `main` combines original LibreChat, selected NEAR AI improvements and
our customization. `nearai` points to `nearai/LibreChat`. See the
[fork workflow](docs/fork-workflow.md) and [decision](docs/decisions/0001-company-fork.md).
The local instance uses PR #2's theme and fonts with `NEAR Foundation AI` as its
application title and welcome text. The app logo and icons use the supplied
`NEAR_token.svg` artwork: a black NEAR mark on green (`#00EC97`). The exact source
is tracked as `client/public/assets/logo.svg`. Regenerate its PNG icons with
`node scripts/brand-icons.mjs`, then rebuild the app image.

## Start and use

Docker Desktop must be running. From this folder:

```sh
python3 scripts/setup-local.py
docker compose up -d --build
```

Open <http://localhost:3081> and sign in with your `near.foundation` Google account.
Configure Google login as described below before starting a fresh installation.
The first registered account becomes the administrator in this single-tenant setup. Everyone uses one
shared server-side NEAR AI key. Paste it into `.env` in this folder:

```dotenv
NEARAI_API_KEY=your-near-ai-api-key
```

Then load the key by restarting the app:

```sh
docker compose up -d --no-build api
```

Select the `nearai` / `NEAR AI Cloud` provider. Users do not need to enter their own
provider keys. The real shared key stays in the ignored, private `.env` file.
LibreChat records each model usage transaction against the signed-in LibreChat
user, so token usage and estimated costs remain attributable per user even though
NEAR AI bills the shared key. Each person must use their own LibreChat account.

Token transactions and the chat's cost display are enabled. The local YAML
contains NEAR AI's published input/output/cache-read rates and context windows
for the models in its catalog. `addParams.streamUsage: true` requests the provider's
streamed token totals, so accounting and the chat cost panel use reported usage
instead of falling back to counts of visible response text. Refresh rates when prices or the
catalog change:

```sh
python3 scripts/sync-nearai-pricing.py
docker compose restart api
```

Rates are a catalog snapshot, not a live billing feed. Balance enforcement is
still off; no per-user allowance has been selected yet.

The tracked `docker-compose.override.yml` builds the app from this checkout,
binds the web port to localhost, gives containers unique names, and uses the
`librechat-setup` Compose project. The existing LibreChat on port 3080 has its
own containers and data. Local secrets are generated in the ignored `.env`
with permissions `0600`; keep that file private and preserve its encryption keys.
The optional admin panel is behind the `admin` profile and needs its own session
secret in `.env` before use.

## Company Google login

Google Cloud project `nf-librechat-20261031` (`NEAR Foundation LibreChat`) belongs
to the `near.foundation` organization. Configure its OAuth audience as **Internal**.
Use a Web application client with origin `http://localhost:3081` and redirect URI
`http://localhost:3081/oauth/google/callback`. Only basic identity scopes
(`openid`, `email`, `profile`) are needed; login grants no Gmail or Drive access.
Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the ignored `.env` file.

The shared `infra/google-login.env` disables password login, direct API password
login, password registration/reset, and passkeys. Docker applies these values
over `.env`. Google registration remains enabled so employees can join through
Google. `registration.allowedDomains: [near.foundation]` in `librechat.local.yaml`
also restricts existing Google users at sign-in. No other email domains or
subdomains are allowed. Disabling a login button alone is insufficient.

Use the same policy values and YAML in Railway. Create a separate Web client for
the cloud environment when its temporary Railway address is assigned; its origin
is that HTTPS address and its redirect is `<origin>/oauth/google/callback`.
Set `DOMAIN_CLIENT` and `DOMAIN_SERVER` to the environment's origin. Inject client
credentials as Railway secrets, keeping local and cloud databases separate.

Existing password accounts are preserved but cannot sign in after the switch.
LibreChat does not automatically link an existing password account to Google;
an account migration is required to retain its conversations and role. Changing
login settings does not itself revoke existing sessions or Agents API keys.
For this installation, Tobias's administrator account was linked using Google's
verified company email and Workspace identity. Its ID and seven conversations
were retained. Both prior password sessions were retired, credentials stamped,
and auth caches invalidated. There were no existing Agents API keys.

Docker's automatic address pools were full on this machine, so the project uses
the verified free subnet `10.254.243.0/24`. Set `LOCAL_DOCKER_SUBNET` in `.env`
to another free private subnet if your network layout changes.

## Customize and rebuild

Edit the React app in `client/`, shared UI in `packages/client/`, backend
behavior in `packages/api/`, and backend wiring in `api/`. Follow `AGENTS.md`.
Apply source changes with:

```sh
docker compose up -d --build api
```

This rebuilds the image; source changes are not hot-reloaded. For YAML settings,
edit the tracked `librechat.local.yaml`, which is mounted read-only at
`/app/librechat.yaml`, and run `docker compose restart api`. Use
`librechat.example.yaml` as a reference. Keep credentials in `.env` and reference
them from YAML. The local stack includes private Redis with append-only persistence,
Redis streams, and a MongoDB agent checkpointer. `SCHEDULES_SINGLE_PROCESS=true`
describes this one-replica pilot; review scheduler ownership before scaling it.

## Pilot features

- Prompts and bookmarks are disabled for both user and administrator roles.
- Voice input uses NEAR AI `openai/whisper-large-v3` through LibreChat's external
  speech-to-text endpoint. `speech.speechTab.speechToText.audioFormat: wav` converts
  browser recordings locally to PCM WAV before uploading: NEAR rejected native WebM
  and MP4 recordings in verification. Other installations default to `native`.
  Use the microphone button and grant the browser microphone
  access when prompted. Replies are not read aloud.
- Image generation uses NEAR AI `black-forest-labs/FLUX.2-klein-4B`. In Agent Builder,
  choose a NEAR AI chat model and add **OpenAI Image Tools** (the upstream tool name;
  its configured backend is NEAR). A small provider adapter maps OpenAI's `auto`
  size/quality defaults to NEAR's accepted `1024x1024` / `standard` values.
- Scheduled chats are enabled: up to 10 per user, at least 60 minutes apart,
  two concurrent fires, and automatic disabling after five failures. Choose a saved
  agent in Scheduled chats. The app must remain running for scheduled execution.
- Remote Agents API access and the background-tool capability are enabled; users
  still need their own authorized agents and API credentials. No persistent API key
  was minted by this setup.
- Company SSO remains deferred.

Chat token transactions remain attributable per user. Upstream image and speech
tools do not currently record media charges in the same per-user transaction ledger;
do not interpret the chat's cost total as the full shared-key bill. Balance enforcement
also remains off. Check NEAR billing for media charges.

Code execution now uses the separate local [analysis sandbox](infra/code-sandbox/README.md).
Select **Data analysis** and upload a CSV or spreadsheet. The Docker runner has no app
secrets or host mounts, and jobs have resource limits and denied network access.
The local NsJail mode is for development; hardened KVM workers need a suitable Linux
host. The runbook explains the Railway-app/external-worker deployment path.
Interactive artifact previews still need a separate privacy/availability review:
the spreadsheet's Sandpack preview timed out locally, while its authenticated file
download and generated workbook content passed verification.

## Inspect and stop

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose down
```

Stopping preserves local data. MongoDB uses a project-scoped Docker volume
(avoiding macOS bind-mount index errors), Meilisearch uses
`meili_data_v1.35.1/`, uploads/images/logs use their ignored folders, and
PostgreSQL plus app credential data use project-scoped Docker volumes.
`docker compose down -v` deletes named volumes; use it only for an intentional reset.

## Upstream updates and deployment

Follow [the fork workflow](docs/fork-workflow.md) to import original LibreChat
updates and NEAR AI main/PR revisions on an integration branch before promoting
company `main`. Use the `$librechat-sync` Codex skill for this workflow. Commit
company adaptations separately; never add `.env` or runtime data.

This is a local development stack. Choose the hosting target and configure
production authentication, HTTPS, secret storage, backups, and provider credentials
before deploying to company infrastructure.

The initial upstream image build reported five dependency audit findings (four
high and one moderate). Review and address those before a production deployment;
the local setup keeps upstream dependency versions intact.
