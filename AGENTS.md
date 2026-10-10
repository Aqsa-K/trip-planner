# Agent guide: trip-planner

A one-page trip budget planner. Plain HTML, CSS and ES modules: no build step, no dependencies.

## Layout
- `index.html`, `styles.css`: the page (mobile first, test at 360 px wide)
- `src/trip.js`: pure logic (days, totals, currency, stops). Put new logic here so it can be tested.
- `src/rates.js`: exchange-rate client and a mocked rate service
- `src/user.js`: anonymous per-browser user id; `?user=u-1234` in the URL overrides it
- `src/app.js`: rendering and event handlers
- `tests/`: `node:test` unit tests

## Commands
- Test: `npm test`
- Run locally: `npm start`, then open http://localhost:4173 (add `?user=u-1234` to act as a given user)

## Working on an issue
1. Reproduce it first. If the report has an error ref or user id, open the app with `?user=<id>`.
2. Write a failing test in `tests/` that captures the bug, then fix it, then run `npm test`.
3. Keep the change small and focused on the issue. Don't reformat unrelated code.
4. Open a pull request that says `Fixes #<issue>`. Merging to `main` deploys to GitHub Pages.
5. If the issue is unclear, ask a question on the issue instead of guessing.
