# ADR-0001: One company fork with LibreChat and NEAR AI sources

Date: 2026-10-31 · Status: Accepted

## Context

NEAR Foundation wants a self-hosted LibreChat with its own branding and future
improvements, while retaining original LibreChat updates and NEAR AI's verified
inference features. NEAR AI is a sister company. Its product changes and its
internal branding live on different branches; some desired features remain open PRs.

## Decision

Maintain one company fork, currently `tobias-nf/LibreChat`. Its `main` is the
combined company version. Use `origin` for that fork, `nearai` for
`nearai/LibreChat`, and `upstream` for `LibreChat-AI/LibreChat`. Their remote
tracking branches preserve each source; our `main` is not an upstream mirror.

Make imports on temporary `codex/` integration branches based on company `main`.
Merge upstream histories, resolve overlapping behavior deliberately, validate the
combined result, then fast-forward company `main` and push normally. Keep source
imports and company adaptations in separate commits. Never force-push `main`.

Accept NEAR AI's merged changes and submitted, non-draft feature PRs intended for
its product. Exclude arbitrary feature branches, WIP and abandoned changes unless
the user selects them explicitly. PR #2 is an explicit exception: the user chose
its internal branding as our starting point despite its closed/draft status.
PR #3 is selected before merge. Record exact source revisions in
`docs/fork-imports.json`; a PR number alone is not a reproducible version.

Use PR #2's theme, fonts and NEAR assets with NEAR Foundation wording. Preserve
our local shared-key provider, per-user accounting, data and login behavior.
Keep NEAR AI's own restricted deployment YAML as a reference, not our active config.

## Consequences

One tested branch contains the complete product. Original LibreChat fixes can
arrive independently of NEAR AI's release cadence. Shared history makes subsequent
merges easier to trace, but does not guarantee conflict-free updates, particularly
when an imported PR is later rewritten or squash-merged. Open PRs require local
validation; upstream review claims do not qualify our combined version.

A second permanent company branch or repository would duplicate release state.
We instead isolate changes in commits and company-owned configuration. Hosting,
Google Workspace SSO, budget amounts, and production deployment remain separate work.

## Evidence and implementation

- [Workflow](../fork-workflow.md), [source revisions](../fork-imports.json)
- [NEAR AI baseline #1](https://github.com/nearai/LibreChat/pull/1)
- [Branding #2](https://github.com/nearai/LibreChat/pull/2)
- [Verification UI #3](https://github.com/nearai/LibreChat/pull/3)
