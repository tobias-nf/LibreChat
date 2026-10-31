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
