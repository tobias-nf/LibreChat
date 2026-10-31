---
name: librechat-sync
description: Integrate original LibreChat releases and NEAR AI main or submitted PRs into the NEAR Foundation LibreChat fork, preserving company branding, configuration and tested main. Use for this fork's update and import workflow.
---

# LibreChat company fork updates

Read `docs/fork-workflow.md`, `docs/fork-imports.json` and `AGENTS.md` in the owning
checkout. The accepted decision is `docs/decisions/0001-company-fork.md`.
Confirm repository identity and remote URLs before fetching or writing.

## Source policy

- `origin` is the company fork, currently `tobias-nf/LibreChat`. Its `main` is the
  complete tested company version, not a mirror of either source.
- `upstream` is `LibreChat-AI/LibreChat`; `nearai` is `nearai/LibreChat`.
- Take NEAR AI main and submitted, non-draft product PRs. Exclude random branches,
  draft/WIP and abandoned work unless explicitly selected. Branding PR #2 is an
  approved exception even though closed/draft; verification PR #3 is selected.
- Scope an update to the requested source set. Do not infer authorization for
  production rollout, external messages, or changes to the source repositories.

## Integrate reproducibly

Inspect branch, worktree and remotes. Preserve local work separately before
integration; use a named commit or isolated worktree, never destructive cleanup.
Fetch only relevant refs with `--no-tags`. Inspect each PR's current state, head,
base, changed files and review threads; record the exact imported SHA.

Create a temporary `codex/` integration branch from company main. Merge source
history with separate merge commits and put company adaptations in subsequent
commits. Review conflicts by behavior: retain newer upstream protections and
features while adding NEAR AI functionality. Do not resurrect retired code merely
to make a conflict disappear. Record deliberate resolutions and test them.

Use `docs/fork-imports.json` to avoid reimporting already included PRs. If an open
PR was rewritten, compare old and new patches, fetch the new head to a distinct
ref, and reconcile deliberately; do not force-update company main. Later squash
merges can have different IDs for already imported content.

## Company invariants

Preserve the shared NEAR AI key reference, per-user transactions and prices,
credential encryption keys, local data and localhost-only stack isolation.
Secrets stay in ignored `.env`. Keep `librechat.local.yaml` as the active company
config. Imported `nearai/deploy/nearai-internal.yaml` is a reference; its login
domain, disabled features and Railway targets are not company defaults. Company
branding is separately maintained in config, title/manifest and assets.

## Validate and promote

Run the checks in the workflow and owning `AGENTS.md`: package/frontend builds,
focused NEAR AI and conflict regression tests, affected workspace typechecks,
scoped formatting/lint, config validation and Lighthouse. Smoke-test login,
persisted chats, verification and accounting when credentials are available.
Never treat earlier upstream review or a test at an old PR head as our validation.

Update the import ledger and `docs/fork-validation.md` with source SHAs, conflict
resolutions, results and unverified behavior. Promote only a passing combined
revision using a fast-forward into company main and a normal push, when that
promotion is within the user's task. If main advanced, integrate and revalidate.
Keep a previously tested image/revision available for local rollback; preserve
volumes. Do not conflate updating Git with deploying production.
