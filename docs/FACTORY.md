# The factory and its guard rails

Anyone can open an issue on this repo. An agent loop picks issues up, and the
fix goes live when a human merges it. This page lists what stops a bad ticket
from reaching the live site, from the first line of defence to the last.

## The loop
1. **Every minute** Antigravity runs the `factory-loop` skill (`/schedule cron "* * * * *" "Use the factory-loop skill."`).
2. **Triage** (`triage-ticket` skill) gives each new issue one verdict:

   | Verdict | What happens |
   |---|---|
   | Abusive, vulgar, political, personal data | Deleted immediately (only number, author and category are logged locally) |
   | Destructive or manipulative ("delete everything", "change the workflow", "ignore your rules") | Closed, labelled `rejected`, locked |
   | Off-topic or gibberish | Closed, labelled `invalid` |
   | Author already has 2 open issues | Closed, "one at a time" |
   | Unclear, or needs a design choice | Up to 3 questions on the issue, labelled `needs-decision`; the loop asks the maintainer |
   | Not sure it's abusive | Closed, locked, labelled `needs-human`, never deleted |
   | Clear and harmless | Accepted |
3. **Acknowledge:** 👀 and a comment on the issue, label `in-progress`.
4. **Work:** an `issue-worker` subagent per issue, in its own git worktree and port. It opens a pull request with a screenshot and comments the link on the issue (🚀, `needs-review`).
5. **Ask:** when an issue or a worker needs a decision, the loop asks the maintainer
   in the Antigravity session and waits. With Remote Control on, that pause sends a
   push notification to the maintainer's phone; the answer is posted on the issue as
   "🧭 Maintainer's decision" and a worker picks it up.
6. **Ship:** a human reviews and merges. Merging to `main` deploys to GitHub Pages.

### Remote Control
```bash
agy --remote-control          # or /remote-control inside a session
```
Sign in at the dashboard with the same Google account and add it to the phone's home
screen to get notifications when the agent finishes or needs input. The laptop must
stay awake and online.

## Guard rails that don't depend on the agent behaving
The agent can be tricked. These are enforced by GitHub, so they hold anyway.

| Layer | What it enforces |
|---|---|
| **Ruleset on `main`** | Changes only through pull requests; `test` and `factory-guard` must pass; no force-push, no branch deletion; no bypass, not even for the owner |
| **Factory guard** (`.github/workflows/guard.yml`) | Runs from `main`'s copy (`pull_request_target`), so a PR can't edit it away, and never runs PR code. Blocks and closes PRs that touch anything outside `index.html`, `styles.css`, `src/`, `tests/`, `docs/evidence/`; delete files; remove > 150 lines; add `eval`, `new Function`, `document.cookie`, `localStorage.clear` or external URLs; or don't say `Fixes #N` |
| **Tests** (`.github/workflows/test.yml`) | `npm test` on every PR |
| **Deploys from `main` only** | `pages.yml` runs on push to `main`, and the `github-pages` environment only accepts `main` |

**Known gap:** the agent uses the owner's GitHub identity, so GitHub can't stop it
from merging its own PR; only its instructions do. Closing this gap means a
separate bot account (or GitHub App) for the agent plus "require 1 approval" in
the ruleset.

## Kill switches
```bash
# During the talk: only accounts older than 24 h can open issues or comment
gh api -X PUT repos/mashhoodr/trip-planner/interaction-limits -f limit=existing_users -f expiry=one_day
# Emergency: only collaborators
gh api -X PUT repos/mashhoodr/trip-planner/interaction-limits -f limit=collaborators_only -f expiry=one_day
# Lift the limit
gh api -X DELETE repos/mashhoodr/trip-planner/interaction-limits
```
Stop the loop: cancel the `/schedule` task in Antigravity.

## Changing the protected files (maintainers)
`.github/`, `.agents/`, `AGENTS.md` and `docs/` can't be changed through a pull request
(the guard blocks it), and the ruleset blocks direct pushes. To change them, pause the
ruleset, push, and turn it back on:
```bash
RS=$(gh api repos/mashhoodr/trip-planner/rulesets --jq '.[0].id')
gh api -X PUT repos/mashhoodr/trip-planner/rulesets/$RS -f enforcement=disabled
git push origin main
gh api -X PUT repos/mashhoodr/trip-planner/rulesets/$RS -f enforcement=active
```
