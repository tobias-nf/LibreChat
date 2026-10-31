# Initial NEAR AI integration validation

Date: 2026-10-31. Company code checkpoint: `b27d6abc8`. Source revisions are
pinned in [fork-imports.json](fork-imports.json).

## Integration resolutions

- Retained current LibreChat pull-request header support alongside the attestation shield.
- Retained current message-editor host contexts and Jotai behavior while removing
  verification receipts when a user edits a reply.
- Retained newer configuration fields, permission leases, recursion limits and
  upstream error sanitization while adding NEAR AI's verification deadline/errors.
- Kept the retired tokenizer endpoint removed.
- Preserved both `@librechat/code` and the pinned NEAR AI inference SDK in the lockfile.
- Updated the shield style import to `@librechat/chat/components` and replaced
  the removed `SelectDropDown` with the current shared `Dropdown`. Its test still
  verifies selecting a completion disconnects the old frame and sends only the
  selected receipt.
- Corrected a missing space before a YAML comment in the imported branding theme.
- Applied only the theme/welcome to our active config; retained shared-key
  accounting, enabled cost display and existing login behavior. The imported
  internal deployment YAML remains a reference.

## Checks

- Package/frontend build: passed after the compatibility fixes.
- Typechecks: `packages/api`, `packages/data-provider`, and `client` passed.
  The API check needed a 12 GiB Node heap; the first 4 GiB run exhausted its heap.
- API: 231 tests across 10 suites passed, including real MongoDB receipt round trips.
- Legacy routes, imports/provenance and Agent accounting: 293 tests across six
  suites passed.
- Configuration: 575 tests passed.
- Frontend: 293 tests across nine suites passed after adapting the removed
  completion selector to the current shared component.
- Scoped static checks and unused-i18n check passed. Workspace typechecks ran
  separately rather than in the static runner.
- Lighthouse passed with 250 ms per Mongo query: median LCP 3,842 ms (limit
  4,500), CLS 0.0179 (limit 0.1), TBT 91.2 ms (limit 500).
- Live synthetic Qwen request through the imported SDK: HTTP 200, 58 prompt and
  16 completion tokens; a `provider_tee` receipt was verified. No user chat content
  was used for this request.
- Skill frontmatter/scaffold validation passed.

Initial socket-dependent tests needed execution outside the restricted sandbox.
The receipt suite's first download exceeded its hook deadline; the final passing
API run reused the MongoDB binary downloaded by the isolated Lighthouse harness.
These failures did not require weakening application checks or test assertions.

## Runtime and release

The final Docker image built successfully with code checkpoint
`b27d6abc8e2e7de85d8c7a2afdb5cdfdaf6c1aec` in its build metadata. The local stack
is healthy at `http://localhost:3081`, with the company theme, fonts and title.
The previous local image is retained as
`librechat-setup:before-nearai-20261031`; existing data volumes are preserved.

A signed-in browser smoke test created one synthetic chat, which returned `OK`.
The model shield reported verified attestation, the reply shield reported a
model-TEE signature, and PR #3's embedded production Verification Center showed
the ED25519 response signature and hardware evidence as verified. The saved reply
contains a verified `provider_tee` receipt. Four transaction records (Qwen prompt
and completion, Kimi title prompt and completion) are attributed to one signed-in
LibreChat user with their configured prices. No account, credential or data-volume
reset was performed. The synthetic chat remains available as a local smoke example.

Local checks qualify this integration; no independent review or GitHub CI result
is claimed by this record. Downstream main promotion preserves the source merges
and the separate company adaptation commit.

Production hosting, Google Workspace SSO, per-user budget enforcement, external
provider attestation coverage and exhaustive tools/images/files inference remain
outside this integration's validation. Only the tested local instance is updated.

The integrated image's dependency audit reports 13 findings (three low, six
moderate, four high). Dependency advisory triage/remediation is not completed by
this integration and remains a production-release gate. This is the observed
image-build audit, not an independent security review of the imported code.

## Local feature configuration — 2026-10-31

The `codex/pilot-feature-config` working tree was rebuilt and the Compose API
recreated on `librechat-setup:local`. Redis and API health checks pass. SSO is
unchanged and deferred.

- An authenticated request to LibreChat `/api/files/speech/stt` with a synthetic
  WAV recording returned HTTP 200 and the expected transcript: “This is a voice
  input test. Revenue increased by 20%.” It used NEAR's Whisper model. Browser
  microphone hardware capture was not exercised; read-aloud is disabled.
- A real agent chat called `image_gen_oai` with `size: auto`, `quality: auto`.
  The NEAR adapter normalized these values; FLUX returned an image that LibreChat
  saved as a user-owned file. The synthetic green-circle image was visually checked.
  The private `NEAR AI Images` agent remains under the administrator's account.
- A daily schedule fired automatically without Run Now at 11:28:57 Asia/Manila.
  Its saved reply was `SCHEDULE_NEAR_OK`; the schedule recorded one successful run,
  zero failures, advanced its next occurrence, and was then paused. Prompt and
  completion transactions were recorded under the schedule owner's user ID.
- The signed-in standard-user browser showed Scheduled chats and the microphone
  control. Prompts, bookmarks, and the `/ for prompts` hint were absent.
- Focused image compatibility and schedule lifecycle tests: 18 passed. API
  `tsc --noEmit`, scoped ESLint/Prettier, and `git diff --check` passed.
- Lighthouse passed: median LCP 3,665 ms, CLS 0.0179, TBT 54.9 ms. Two browser
  navigation attempts retried before the three successful measurements.

The verification script initially triggered the non-browser violation policy.
Only its four generated ban/cache records and its non-browser counter were removed;
the policy remains enabled. This invalidated the administrator's prior refresh
sessions, so that account may need to sign in again.

Image/transcription monetary charges are not recorded by upstream media tools in
the chat token ledger. Per-user budget enforcement and a qualified code-execution
sandbox remain unfinished. This is local verification, with no CI, independent
review, or production deployment claimed.

## Browser voice-format correction — 2026-10-31

The WAV-only smoke test above missed the microphone recorder's native container.
Synthetic WebM/Opus and MP4/AAC uploads reproduced NEAR's HTTP 400 audio-processing
error. LibreChat's generic toast incorrectly suggested the recording was too short.

`speech.speechTab.speechToText.audioFormat: wav` now opts this installation into
local browser decoding and PCM WAV encoding before upload. The default remains
`native` for other installations. Conversion is covered by tests for PCM headers,
sample interleaving/clipping, decoder cleanup, loading, cancellation/unmount,
failure/retry, and preserving the take identity. The error toast now uses localized
provider-neutral retry guidance without claiming a short recording.

A real Chrome MediaRecorder captured synthetic speech to both WebM and MP4, and
the production conversion helper converted each to WAV. The authenticated LibreChat
speech endpoint returned HTTP 200 with the expected transcript for both. No physical microphone or user
recording was used. The rebuilt local app's speech-config endpoint reports
`audioFormat: wav` and `engineSTT: external`.

The focused client tests passed (28), configuration tests passed (2), and existing
speech-config wiring tests passed (10). Client and data-provider typechecks passed.
Scoped ESLint/Prettier and diff checks passed. Lighthouse passed on rerun after
browser navigation startup failures (`NO_NAVSTART`); no budgets were changed.
The temporary localhost-only synthetic test proxy was stopped after verification.

## Local data-analysis sandbox — 2026-10-31

Code Interpreter v1.10.13 (`2fa9f0d43e8e38b7d6240bc76e2483c6a47c64c7`)
was built natively for ARM64. The separate `librechat-sandbox` Compose project has
eight healthy services, private control/backend/execution networks, no published
ports, and separate Redis and S3-compatible storage. The runner has no host mounts,
no Docker socket, and only the execution network. Its Python and Bash runtimes
execute under the upstream NsJail profile. Dependency versions are locked.

Live evidence:

- Authenticated Python execution produced CSV, XLSX, and PNG outputs. NumPy/pandas
  calculated 370 from the synthetic 100/120/150 dataset; the chart was inspected.
- Sandbox code could not read app/model signing keys from its environment, app paths,
  or the Docker socket. Attempts to connect to the app network, control network, and
  internet were denied. A subsequent job had a fresh workspace.
- The artifact owner downloaded a valid PNG (HTTP 200); a different user got 403.
  An unauthenticated execution got 401. A 1-second test limit killed a 5-second job
  with SIGKILL / “Time limit exceeded”.
- In a signed-in standard-user browser, the **Data analysis** preset read an uploaded
  CSV and created an inline chart plus a 6,775-byte Excel report. Its ZIP structure,
  total cell (370), and embedded Excel chart were checked independently. The actual
  LibreChat download API returned the workbook to its owner (200), and denied another
  user (403). The optional Sandpack spreadsheet preview timed out; download works.
- The initial end-to-end test exposed a missing Bash runtime; the final image includes
  the sandboxed launcher needed by LibreChat's Python/file tools, and the retry passed.
- Compose validation, script syntax, scoped ESLint/Prettier, and diff checks passed.
  Setup was rerun successfully without replacing secrets. Lighthouse passed after
  the config change. No app workspace source code changed for this sandbox setup.

The local Mac mode shares Docker Desktop's Linux VM kernel and needs namespace/mount
capabilities; it is development isolation, not the hardened KVM production boundary.
The [sandbox runbook](../infra/code-sandbox/README.md) specifies LibreChat on Railway
with a separate Linux/KVM execution host, per-user JWT authentication and HTTPS.
No Railway deployment or KVM-host qualification was performed. Those remain required
before production; running the local runner directly in standard Railway containers
is not a supported deployment path.

## Company Google login — 2026-10-31

Created Google Cloud project `nf-librechat-20261031` (number `1026247545893`)
under the `near.foundation` organization (`715804453671`). Google Auth Platform
shows an **Internal** audience. The local Web client authorizes only origin
`http://localhost:3081` and callback `/oauth/google/callback`. Its credentials
are stored in the ignored private `.env`, not in tracked configuration.

`infra/google-login.env` is the shared local/cloud login policy. Password login
(including direct API requests), password registration/reset, and passkeys are
disabled. Google registration is enabled for employees. The shared YAML permits
only Google and the exact `near.foundation` email domain. Existing server-side
social-login validation enforces the allowlist before user lookup as well as
against the resolved user's configuration.

Google's userinfo endpoint verified Tobias's company email, email verification,
and Workspace domain before linking its Google subject to the existing admin
account. The user ID, administrator role, and seven conversations were preserved.
The two prior password sessions were retired; credential-change timestamps and
auth-cache invalidation prevent those old access tokens remaining valid. There
were no Agents API keys to revoke. Bob's synthetic account/data remain intact
but cannot use password login.

After recreating the app, a real Google OAuth flow returned to `/c/new` and
displayed the preserved conversation history. Public config reports Google on,
password login/registration/reset and passkeys off. Direct password login and
registration returned HTTP 403. The configured domain helper accepted company
email (including uppercase) and rejected Gmail, subdomains, lookalike suffixes,
and `near.org`. Existing social-login tests passed (16), domain/email middleware
tests passed (253), and scoped formatting/Compose/diff checks passed. No actual
external-account OAuth attempt was made.
Lighthouse passed with the installed Chrome channel on isolated port 3099
(median LCP approximately 3.5 seconds). Initial attempts found occupied ports
3080/3098 and a missing Playwright Chromium build; existing services were left
running and the final check used `E2E_CHROMIUM_CHANNEL=chrome`.

Railway deployment and its separate cloud OAuth client/callback remain pending
assignment of the temporary Railway hostname. Local and cloud should use the
same policy/YAML with environment-specific URLs, credentials, and databases.

## Isolated Railway deployment — 2026-10-31

Committed the completed local pilot first as `23aeb6d94`, then committed and
pushed Railway packaging/configuration on `codex/pilot-feature-config`. The live
app is pinned to `7bcc634ce2cf55e48bc954bb842cffe2580fed7f`, deployment
`98c67ab4-4884-4970-8792-c0fc8246826b` (**SUCCESS**).

- Project: `125a4dd3-235b-4478-b888-0dfb7444fcee`, **NEAR Foundation LibreChat**,
  in the NEAR Foundation workspace. Production environment:
  `75f9a70b-319f-4e21-832d-685997b3e40b`.
- URL: <https://librechat-production-5b45.up.railway.app>.
- LibreChat, MongoDB, Redis, pgvector, and RAG all report **SUCCESS**, one replica
  each in the Netherlands region. Only LibreChat has a public domain; none of
  the dependencies has a public domain or TCP proxy. Four separate volumes persist
  app files/state and the three databases. Existing Railway projects were not modified.
- The image includes the canonical YAML. Runtime defaults, Google policy, and RAG
  settings are shared tracked files. Cloud data and encryption/session keys are
  separate from local Docker. The local development password override is excluded.
- As explicitly approved, cloud code execution is pending a separate KVM host.
  A startup profile turns the same analysis preset into ordinary **NEAR AI Chat**
  and removes its code capability. Other configuration remains unchanged.
- Created a separate Internal Google Web client for Railway, registered its HTTPS
  origin and `/oauth/google/callback`, stored credentials privately, and verified
  real company Google sign-in into the cloud app. Password login and registration
  each returned HTTP 403. Public `/health` returned 200.
- A real shared-key NEAR chat returned `RAILWAY_NEAR_OK`. That conversation and
  the signed-in session survived the final redeploy. The final default preset then
  returned `RAILWAY_FINAL_OK`; NEAR attestation and signed-reply controls appeared.
  Prompts/bookmarks and code execution controls were absent.
- Configured NEAR `Qwen/Qwen3-Embedding-0.6B` for RAG with authenticated internal
  access. A direct synthetic embedding and local RAG embedding both returned 1024
  dimensions. The local vector table was empty before switching models. Cloud RAG
  initialized successfully, but no cloud end-to-end file-search test is claimed.
- Cloud file upload/persistence verification was blocked by the browser extension's
  file URL permission. Native picker inspection stalled. No account-wide Railway
  SSH key was registered to work around missing CLI SSH access. Volume attachment
  and chat persistence were verified; uploaded file persistence and a restore drill
  remain unverified. Cloud voice/image inference and transaction collection contents
  were not independently retested; their shared configuration remains enabled.
- Shared-config profile assertions, script syntax, formatting, Compose configuration,
  and diff checks passed. Lighthouse passed (median LCP 3531 ms, CLS 0.018, TBT 53 ms).
  No CI or independent review result is claimed.

Deployment IDs and the runbook are in `infra/railway/`. Backup scheduling, restore
qualification, code execution hosting, and end-to-end upload checks remain before
a broad employee rollout.

## Configuration-only model selection — 2026-10-31

The shared YAML now explicitly enables `interface.modelSelect`, exposes `nearai`
through `modelSpecs.addedEndpoints`, and sets `modelSpecs.prioritize: false`.
`models.fetch: false` limits the dropdown to Kimi K2.6, Qwen 3.8 27B, and GLM 5.3
Flash. The existing GLM preset has `softDefault: true` for first-time users; later
model choices take precedence. No application source code changed.

Local Docker was restarted. Its submenu showed exactly three models, and a Qwen
selection survived New Chat. Railway deployment `8898231a-9a06-481a-a16b-707492eb1a27`
at commit `c81589702` reports **SUCCESS**. The live submenu showed the same three
models, and the selected Kimi model survived New Chat and the final redeploy.
YAML/schema/profile assertions and formatting checks passed, as did 17 backend
model-loading tests, 48 frontend default-selection tests, and Lighthouse (median
LCP 3538 ms). Only the isolated LibreChat service was redeployed.
