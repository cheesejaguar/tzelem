---
description: Commit, push current branch, open PR into staging with gh, then watch CI and iterate until green
argument-hint: [commit message]
allowed-tools: Bash(git *), Bash(gh *), Bash(jq *)
# Optionally pin a model for this automation:
# model: claude-3-7-sonnet-20250219
---

You are a precise release assistant. Execute the steps below to ship the current branch into `staging`. If a step fails, stop, show the exact command output, and ask me how to proceed.

> Requirements:
> - Git CLI configured for this repo
> - GitHub CLI (`gh`) authenticated (`gh auth status`)
> - Repo has a `staging` branch on origin

## 0) Identify repo & branch
- Current branch: !`git branch --show-current`
- Repo (owner/name): !`gh repo view --json nameWithOwner -q .nameWithOwner`

If the current branch is `staging`, STOP and ask me to switch to a feature branch.

## 1) Stage and commit changes
- Stage all changes: !`git add -A`
- Commit (use provided message or a fallback):
  !`(git diff --cached --quiet && echo "No staged changes; skipping commit") || git commit -m "${ARGUMENTS:-"chore: ship to staging via Claude Code"}"`

## 2) Push branch to origin
- Ensure upstream and push: !`git push -u origin "$(git branch --show-current)"`

## 3) Open PR into staging with GitHub CLI
- Create (or reuse) PR into `staging`:
  !`gh pr view --base staging --head "$(git branch --show-current)" >/dev/null 2>&1 || gh pr create --base staging --head "$(git branch --show-current)" --title "${ARGUMENTS:-"Ship to staging"}" --body "Automated PR opened by Claude Code command."`
- PR URL: !`gh pr view --json url -q .url`

## 4) Monitor CI checks for this PR
- Find latest workflow run for this branch:
  !`RUN_ID=$(gh run list --branch "$(git branch --show-current)" --limit 1 --json databaseId -q '.[0].databaseId'); echo "$RUN_ID"`
- If no run yet, wait briefly and re-check once:
  !`if [ -z "$RUN_ID" ]; then sleep 5; RUN_ID=$(gh run list --branch "$(git branch --show-current)" --limit 1 --json databaseId -q '.[0].databaseId'); echo "$RUN_ID"; fi`

- Watch the run until it finishes (exits non-zero on failure):
  !`[ -n "$RUN_ID" ] && gh run watch "$RUN_ID" --exit-status || echo "No workflow run detected for this branch yet."`

## 5) If checks FAIL, diagnose and propose fixes
- If the previous step failed, fetch failing job summary and logs:
  !`if [ -n "$RUN_ID" ]; then gh run view "$RUN_ID" --json conclusion,jobs -q '.'; fi`
  !`if [ -n "$RUN_ID" ]; then gh run view "$RUN_ID" --log-failed; fi`

Using the logs above, analyze the failures and propose concrete fixes (file/line, exact patches). Limit suggestions to minimal changes needed to make CI green.

## 6) Apply fixes, commit, push, and re-run
When I say “apply fix <n>”, generate the precise patch/diff, then:
- Write the patch (unified diff) and explain each hunk.
- After my confirmation, run:
  - Stage: !`git add -A`
  - Commit: !`git commit -m "fix: address failing tests/CI"`
  - Push: !`git push`
  - Re-watch the latest run for this branch:
    !`RUN_ID=$(gh run list --branch "$(git branch --show-current)" --limit 1 --json databaseId -q '.[0].databaseId'); if [ -n "$RUN_ID" ]; then gh run watch "$RUN_ID" --exit-status; fi`

Stop once all checks pass. Report final PR URL and status.