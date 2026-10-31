# Updating the company LibreChat fork

Company `main` in `tobias-nf/LibreChat` contains the tested combination of original
LibreChat, selected NEAR AI changes and company customization. See
[ADR-0001](decisions/0001-company-fork.md) for the accepted policy and
[fork-imports.json](fork-imports.json) for imported revisions.

| Remote | Repository | Role |
| --- | --- | --- |
| `origin` | `tobias-nf/LibreChat` | Company `main` and integration branches |
| `nearai` | `nearai/LibreChat` | Product main and selected PR heads |
| `upstream` | `LibreChat-AI/LibreChat` | Original releases and independent fixes |

## Import an update

Check `git status`, current branch and remotes first. Preserve local changes in a
separate commit or isolated worktree. Do not reset, clean, or use a bare stash pop.

```sh
git fetch --no-tags origin main
git fetch --no-tags upstream main
git fetch --no-tags nearai main
git switch -c codex/sync-nearai-YYYYMMDD main
```

Compare divergence, source commits and touched files before merging. Fetch each
selected PR to a remote tracking ref and record its exact head:

```sh
gh api repos/nearai/LibreChat/pulls/3 \
  --jq '{number,state,draft,head:.head.sha,base:.base.sha}'
git fetch --no-tags nearai refs/pull/3/head:refs/remotes/nearai/pr/3
git rev-parse nearai/pr/3
```

Use source SHAs from the inspected metadata for `git merge --no-ff <sha>`, with
one merge per source main or PR. Preserve both source histories. Keep company
fixes in subsequent commits rather than editing imported history. If a selected
PR was force-pushed, compare it with the recorded imported SHA; fetch the new
head into a distinct dated ref rather than blindly replacing the old one.

Take NEAR AI's merged changes and submitted non-draft feature PRs. A PR is eligible
before it merges, but its existence alone does not authorize deployment. Do not
take random branches, WIP, or abandoned work. PR #2 is explicitly approved as our
branding base despite its closed/draft status. Other exceptions need a user choice.

If a PR later merges or is rewritten, check ancestry and tree changes before
importing it again. A squash merge may have new commit IDs for already imported
content. Do not automatically cherry-pick every commit again.

## Preserve company behavior

- `librechat.local.yaml` owns our active theme, welcome text, shared-key endpoint,
  transaction recording and published model rates.
- `docker-compose.override.yml` owns the isolated local stack, production
  Verification Center URL and company application title.
- The theme/fonts originated in PR #2; the welcome/title and supplied green NEAR
  logo are company adaptations. Preserve `client/public/assets/logo.svg` during
  imports and regenerate its PNG derivatives with `node scripts/brand-icons.mjs`.
  Keep logo, icons, theme and font changes in separate company commits.
- `nearai/deploy/nearai-internal.yaml` is the imported reference, not our active
  config. Do not copy its `near.ai` login restriction or disabled features into
  our deployment implicitly. Google Workspace SSO is not configured by this import.
- Keep `.env`, credentials and runtime data out of Git. Preserve credential
  encryption keys and existing Docker volumes. Never run `down -v` during updates.

## Validate and promote

Build the packages and frontend; run focused NEAR AI API, frontend and legacy
route/import tests. Include affected upstream regressions where conflicts were
resolved. Run workspace typechecks, scoped import sorting/lint, config schema
validation and `npm run lighthouse` as required by `AGENTS.md`. Validate local
login, persisted chats, verification reports and shared-key usage accounting.
Record which checks passed and any limitations in the import receipt.

Only promote a passing combined revision:

```sh
git push -u origin codex/sync-nearai-YYYYMMDD
git switch main
git merge --ff-only codex/sync-nearai-YYYYMMDD
git push origin main
```

Our downstream PRs target our `main`. Contributions back to original LibreChat
normally target its `dev`, as described in `AGENTS.md`. If company `main` moved
during validation, integrate the new commits and recheck; do not force-push it.
Build the local container with `docker compose up -d --build api` when local
runtime updates are authorized. Production rollout is a separate operation.

The reusable Codex skill is `.agents/skills/librechat-sync/SKILL.md`.
