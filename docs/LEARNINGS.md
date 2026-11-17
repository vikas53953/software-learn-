# Learnings

Every owner pushback, verifier FAIL and retro adds an entry: what happened, the lesson, the rule, and what it has caught since.

## 1. The cloud network blocked the reference site (2026-11-17)

**What happened.** The REA tool was installed to tear down designed-to-scale.vercel.app over CDP, but the cloud container's proxy refuses `*.vercel.app`, so it could not attach. The teardown was done through the browser on the owner's computer instead.
**Lesson.** Check reachability of the target first and say plainly which tool produced which finding.
**Rule.** Reports name the method actually used, not the one planned.

## 2. Phone diagrams were unreadable (2026-11-17)

**What happened.** At 390 px the 800-unit diagram scaled to 44%, so node labels were about 6 px tall. Found only by looking at a phone screenshot.
**Lesson.** A layout that passes at desktop can still fail at phone width.
**Rule.** Diagrams pan sideways on phones. The sweep checks phone navigation, the Next button and sideways scroll at 390×844 in dark mode on one lesson (not every step); the verifier's live run covers phone width in dark mode.

## 3. A branch was pushed empty (2026-11-17)

**What happened.** The copy step used `rsync`, which is not installed in the container. The command failed but the commit and push ran anyway, so the PR branch first went up with no changes.
**Lesson.** Chained shell steps must stop on the first failure.
**Rule.** Use `set -e` (or `&&`) for multi-step shell commands, and check `git show --stat` before pushing.

## 4. "Follow the stocksena pipeline" (2026-11-17)

**What happened.** No project called stocksena was found; the closest match was Stockin, whose pipeline was adopted, and the owner was told about the assumption.
**Lesson.** When a name does not match, pick the closest reading, say so, and continue.

## 5. CI-only text overflow, and a lint fix that changed behaviour (2026-11-17)

**What happened.** The sweep passed locally but failed on GitHub's runner: "notify(customer, msg)" on dependency-inversion step 6 overflowed its node. Diagnostics showed the runner's Chromium measured the line at about 125 units but drew it at about 142, so the scale computed from the measurement was wrong. Refitting after fonts load did not help (same numbers in CI). Separately, an earlier "lint only" edit to `fit()` had dropped the line that resets a previous squeeze, and the PR said there was no behaviour change. The independent verifier caught the second problem; no test did.
**Lesson.** A layout computed from a text measurement depends on the machine's fonts. And a "no behaviour change" claim needs a test that would fail if it were false.
**Rule.** Squeeze text with SVG `textLength`, so the browser draws it at the exact width, whatever font it uses. `fit()` has unit tests for squeezing and for dropping an old squeeze. Before writing "no behaviour change", run the tests against the change reverted.
