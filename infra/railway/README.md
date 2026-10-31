# Isolated Railway pilot

The project and service IDs are in `deployment.json`. All operations must use
those explicit IDs; existing Railway projects are outside this deployment's scope.
The app URL is <https://librechat-production-5b45.up.railway.app>.

The same root Dockerfile and `librechat.local.yaml` are used in local Docker and
Railway. The image includes the YAML; local Docker also mounts it for quick edits.
Shared app defaults are in `infra/runtime.env`, Google-only login policy in
`infra/google-login.env`, and NEAR file-search settings in `infra/rag.env`.
The optional `docker-compose.dev-auth.yml` never applies in Railway.

`CODE_EXECUTION_ENABLED=false` is the one intentional cloud feature difference:
`infra/render-config.mjs` removes the analysis preset and code capability from the
same canonical YAML until a separate KVM execution host is available. Local code
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
