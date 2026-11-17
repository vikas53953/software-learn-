---
name: verify
description: Drive the built Load-Bearing site in a real browser the way a learner does and capture proof. Use before calling any change done, and when acting as the independent verifier on a PR.
---

# Verify Load-Bearing

The surface is the static site built by `npm run build` and served by `npm run preview` (or the Vercel deployment for UAT). Never call a change done from `npm test` alone.

## Launch

```bash
RUN=$(mktemp -d /tmp/lb-verify-XXXX); mkdir -p "$RUN/evidence"
npm ci && npm run build
npx vite preview --port 4173 --strictPort &   # ready when http://localhost:4173/ returns 200
```

## Gates (save each output with its exit code)

```bash
cmd() { name=$1; shift; { "$@"; echo "exit=$?"; } > "$RUN/evidence/$name.txt" 2>&1; }
cmd lint   npm run lint
cmd check  npm run check
cmd test   npm test
cmd deep   env FC_PROFILE=deep npx vitest run tests/unit/properties.test.js
cmd e2e    env EVIDENCE="$RUN/evidence/sweep" npm run e2e
```

## Live run

Drive the changed flows yourself with Playwright, not only through the sweep:

- **Before and after, always.** Screenshot the page before and after each step that changes what is shown (`<step>-before.png`, `<step>-after.png`).
- **Video for multi-step flows** (`recordVideo` on the context, saved as `<flow>.webm`).
- Cover desktop (1440×900) and phone (390×844), light and dark, for anything visual.
- For a lesson change: step through the whole lesson, read every step's text and code, and check each technical claim. Wrong is a `FAIL`.

## Mutation check

For each new or changed test, revert its fix (or break the code it guards) and show it fails. Then inject at least three bugs of your own choosing in the code the PR touches and record which ones the tests catch. Report survivors.

## Evidence and verdict

Copy `$RUN/evidence/` to `/mnt/project-files/load-bearing/evidence/pr-<N>/`, then:

```bash
python3 .claude/skills/verify/evidence_hash.py <folder> > <folder>/EVIDENCE.sha256
```

The verdict comment is `PASS`, `PASS+NOTES` or `FAIL`, with the head SHA, the gates' key lines, the mutation results and the full `EVIDENCE.sha256` list. A verdict without that list is not a verdict.

## Cleanup

Stop the preview server you started. Keep the evidence.
