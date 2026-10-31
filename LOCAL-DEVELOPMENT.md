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

Open <http://localhost:3081> and register your account. The first registered
account becomes the administrator in this single-tenant setup. Everyone uses one
shared server-side NEAR AI key. Paste it into `.env` in this folder:

```dotenv
NEARAI_API_KEY=your-near-ai-api-key
```

Then load the key by restarting the app:

```sh
docker compose restart api
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
them from YAML. The override asserts `SCHEDULES_SINGLE_PROCESS=true` for this
one-replica local stack; use shared Redis streams before running multiple replicas.

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
