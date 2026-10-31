# Initial NEAR AI integration validation

Date: 2026-10-31. Source revisions are pinned in [fork-imports.json](fork-imports.json).

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
- Frontend: initial run passed 292/293; the completion selector failed because
  upstream had removed its component. After adapting the component, its full
  23-test signature suite passed. A consolidated rerun is recorded below.
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

Docker rebuild, runtime smoke checks and promotion are being completed on the
integration branch. The previous local image is retained as
`librechat-setup:before-nearai-20261031`; existing data volumes are preserved.

Production hosting, Google Workspace SSO, per-user budget enforcement, external
provider attestation coverage and exhaustive tools/images/files inference remain
outside this integration's validation. Only the tested local instance is updated.
