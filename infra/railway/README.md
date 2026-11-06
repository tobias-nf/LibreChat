# Isolated Railway pilot

The project and service IDs are in `deployment.json`. All operations must use
those explicit IDs; existing Railway projects are outside this deployment's scope.
The app URL is <https://librechat-production-5b45.up.railway.app>.

The same root Dockerfile and `librechat.local.yaml` are used in local Docker and
Railway. The image includes the YAML; local Docker also mounts it for quick edits.
Shared app defaults are in `infra/runtime.env`, Google-only login policy in
`infra/google-login.env`, and NEAR file-search settings in `infra/rag.env`.
The optional `docker-compose.dev-auth.yml` never applies in Railway.

The model selector offers DeepSeek V4.1 Flash 1017, Qwen 3.8 27B, and GLM 5.3
Flash under `nearai`. Catalog fetching is disabled so the picker uses the three
model IDs in `endpoints.custom[].models.default`. GLM 5.3 Flash is the initial
chat default and generates conversation titles. `modelSpecs.prioritize: false`
preserves a user's model choice.

LibreChat calls `https://cloud-api.near.ai/v1` directly with the NEAR AI Cloud
API key stored in the Railway service variable `NEARAI_API_KEY`.

The Railway service also sets `ANTHROPIC_MODELS` to Claude Opus 5.5, Sonnet 5.5,
and Haiku 5.5. To enable the native Anthropic endpoint, add `ANTHROPIC_API_KEY`
under **LibreChat → Variables** in the Railway pilot and deploy the variable
change with the source revision that adds `anthropic` to `modelSpecs.addedEndpoints`.
Keep the key in Railway. After the deployment is healthy, sign in as a pilot user,
select each model, and send a short test prompt. Confirm the NEAR AI models still
appear and the first-chat preset still uses NEAR AI.

## Pilot connectors

The cloud config renderer loads the remote servers in `mcp.yaml` when their
provider's OAuth client ID and secret are present in Railway. Each tester signs in
to their own account from **Attach and tools → MCP Servers**. The Google Workspace
client is separate from the Google sign-in client.

1. In the Google Cloud project, enable the Gmail, Calendar, Drive, and Sheets APIs
   and their MCP services. Google Workspace MCP requires Developer Preview access.
   Create an Internal Web OAuth client and select **Use this client for an
   AI-powered agent**. Register a callback at `<origin>/api/mcp/<server>/oauth/callback`
   for each of `google-gmail`, `google-calendar`, `google-drive`, and `google-sheets`.
   Declare the Google OAuth scopes from `mcp.yaml` in Google Auth Platform.
2. In the NEAR Foundation Slack workspace, use an internal app with the Slack MCP
   server enabled. Register `<origin>/api/mcp/slack/oauth/callback` and add user
   scopes `search:read.public` and `channels:history`.
3. Put `MCP_GOOGLE_CLIENT_ID`, `MCP_GOOGLE_CLIENT_SECRET`, `MCP_SLACK_CLIENT_ID`,
   and `MCP_SLACK_CLIENT_SECRET` in **LibreChat → Variables** on Railway. Deploy
   the variable changes. A provider appears when both of its variables are set.

For acceptance, use a disposable spreadsheet and two pilot accounts. Find the
sheet with Drive, read a range with Sheets, approve a single-cell update, and read
it back. Decline a second update and confirm the cell stays the same. Repeat with
an account that has view-only access and then with an account without access.
Check Gmail and Calendar reads and Slack public-channel search with the same
per-user sign-in flow. Verify a reconnect after access is revoked.

## Deployment details

`CODE_EXECUTION_ENABLED=false` is the one intentional cloud feature difference:
`infra/render-config.mjs` turns the analysis preset into ordinary NEAR AI chat and
removes the code capability from the same canonical YAML until a separate KVM execution host is available. Local code
execution remains enabled. Do not point the cloud app at a developer's laptop.

The single-replica app stores uploads, generated images, deployment skills, logs,
and temporary credential state under its `/app/data` volume. The entrypoint sets
volume ownership and drops privileges to `node` before starting the app. MongoDB,
Redis, pgvector, and RAG communicate over Railway's private network. Only the app
has a public domain. Dependency images are pinned to the local image digests.
Local and cloud databases and encryption/session keys are separate.

`node infra/railway/configure.mjs` prints only variable names. `--apply` sends
configuration through stdin to the explicit isolated project. Cloud keys are
generated once in ignored `infra/railway/secrets/runtime.json` (mode 0600).
Preserve this file for recovery; never commit or log it. The shared NEAR key is
read from private `.env`. Cloud Google client credentials belong in `runtime.json`
as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; the local client stays in `.env`.

The Google app remains Internal in project `nf-librechat-20261031`. The cloud Web
client uses the app origin above and `<origin>/oauth/google/callback`. LibreChat
enforces the exact `near.foundation` email allowlist on the server and disables
password login, including direct API requests. Use only basic identity scopes.

Before deploying an update, commit and push the fork branch. The Railway service
is pinned to an exact commit, so pushes alone do not deploy. Update its source
commit deliberately, then verify that deployment's status is `SUCCESS` and check
`/health`, Google sign-in, chat, file persistence, and usage recording. A redeploy
can briefly interrupt the pilot because persistent volumes allow one replica.
Volume backups and a restore drill remain required before a broad rollout.
