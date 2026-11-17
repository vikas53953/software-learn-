# Load-Bearing

An interactive software engineering course: each concept is an SVG diagram you step through, with narration, live metrics and code beside it. Vite + plain JavaScript, static site on Vercel (project `load-bearing`, production branch `main`).

This repository follows the same shipping pipeline as Stockin. The history of each rule is in `docs/PIPELINE.md`; the stories behind them are in `docs/LEARNINGS.md`.

## How we work

- Verification comes first. A change is done when it has run in a real browser against the built site, not when tests pass.
- One PR is one change with its own evidence. Small and ordered.
- **Auto pipeline (owner's standing go, 2026-11-17, carried over from Stockin).** Every PR goes through the flow without waiting for the owner: an agent that did not write the code verifies it (gates, a live run through the `verify` skill, a diff audit and a content-accuracy read for lesson changes) and posts `PASS`, `PASS+NOTES` or `FAIL` on the PR. A PR with a passing verdict and green CI on the same head is squash-merged bottom-up with a head-SHA guard. A `FAIL` gets at most two fix-forwards, then stops and is reported.
- **Properties are a gate.** Step folding (`resolveStep`), HTML escaping (`esc`, `md`), the code highlighter and edge geometry are covered by property-based tests in `tests/unit/properties.test.js` (fast-check). A change to any of them adds or updates a property. CI also runs the deep profile (`FC_PROFILE=deep`).
- **Mutation-check every test.** Every new or changed test must fail when its fix is reverted, and the verifier injects at least three bugs of its own to find what the tests miss. Survivors are reported in the verdict.
- **The sweep is a gate.** `npm run e2e` steps through every lesson in Chromium and fails on console errors, overlapping nodes, text overflowing a node, edge labels covering nodes, sideways page scroll, and broken keyboard, search, theme, menu or phone navigation.
- **Agent goes first on UAT.** Before asking the owner to try anything, an agent runs the owner's exact steps on the live URL in a real browser (desktop and phone width, light and dark) and reports each step's pass or fail with evidence. The owner's run is the final confirmation, never the first.
- **Evidence or it did not happen.** Every verification saves before and after screenshots, a video of any multi-step browser flow, and raw command output with exit codes, under `/mnt/project-files/load-bearing/evidence/pr-<N>/`, fingerprinted with `.claude/skills/verify/evidence_hash.py`. The verdict lists every file with its hash. A `PASS` without evidence does not merge.
- **Content is checked like code.** Lessons make technical claims. The verifier reads every changed lesson for accuracy; a wrong claim is a `FAIL`, not a note. Illustrative numbers are labelled as illustrative.
- **Pipeline changes are logged** in `docs/PIPELINE.md` (date, rule, why, what it caught). **Lessons are kept** in `docs/LEARNINGS.md`: every owner pushback, verifier FAIL and retro.
- **Never claim a check that has not run.** A PR body or reply describes only checks that have already run; anything else is listed as unverified.
- **Merged is not released.** `main` moves on a passing verdict, but a version tag (`v0.N`) is created only after the owner has used the site and said it works, followed by a short retro.

## Hard rules

- Original content and branding only. Do not copy text, art or layouts from designed-to-scale or any other course.
- No secrets in the repo. The site is static and has no backend.
- Everything that reaches `innerHTML` goes through `esc()` or `md()` in `src/text.js`.
- Lessons live in `src/content/*.js` as data; `npm run check` must pass.

## Commands

```bash
npm ci
npm run gates     # lint, content check, unit + property tests, build
npm run preview & # serves dist/ on :4173
npm run e2e       # browser sweep against BASE_URL (default http://localhost:4173/)
```
