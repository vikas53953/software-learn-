# Pipeline improvements

How Load-Bearing is built and checked, one rule at a time. The rules come from Stockin's pipeline (owner's request, 2026-11-17) and are adapted to a static site. Every row says when a rule was added, why, and what it has caught. Add a row whenever the pipeline changes, in the same PR as the change. The stories are in [LEARNINGS.md](LEARNINGS.md).

## The flow today

1. Write the change on a branch with its tests. Changes to step folding, escaping, the highlighter or edge geometry also get a property.
2. Gates: eslint, the content checker, vitest (unit + properties, plus the deep profile in CI), the build, and the Playwright sweep of every step.
3. The author runs it in a real browser and records before/after evidence.
4. An agent that did not write the code verifies it: gates, its own live run with screenshots and video, a diff audit, an accuracy read of changed lessons, and a mutation check. It posts `PASS`, `PASS+NOTES` or `FAIL` with the head SHA and the hash of every evidence file.
5. Passing verdict + green CI on the same head: squash-merge with a head-SHA guard. `FAIL`: at most two fix-forwards, then stop and report.
6. Before the owner tries anything, an agent runs the owner's steps on the live URL first and reports pass/fail with evidence.
7. The owner's run is the final confirmation. Only then a `v0.N` tag and a retro.

## Log

| # | Date | Rule | Why it was added | What it caught |
|---|---|---|---|---|
| 1 | 2026-11-17 | Adopt Stockin's pipeline: independent verifier, evidence with hashes, squash-merge on PASS + green CI, two fix-forwards, merged is not released (#2) | Owner asked for the same pipeline as Stockin | In verification |
| 2 | 2026-11-17 | Playwright sweep of every step is a CI gate (overlaps, text overflow, edge labels over nodes, sideways scroll, navigation, search, theme, phone nav) (#2) | Screenshots during the first build only covered a few steps | Before it was a gate, the same checks run by hand on #1 found 13 layout problems in 7 steps (label over node, two overlapping boxes); that run's output was not saved, so the count is unverified |
| 3 | 2026-11-17 | Property tests (fast-check) for step folding, escaping, the highlighter and edge geometry (#2) | Hand-written examples only test the cases we thought of | Writing them found that a property returning `expect(...)` from an arrow body fails under vitest 5; all properties use block bodies |
| 4 | 2026-11-17 | Content accuracy is part of the verdict; illustrative numbers must be labelled (#2) | Lessons make technical claims that tests cannot check | In verification |
| 5 | 2026-11-17 | `evidence_hash.py` hashes subfolders too, listed by relative path (#2) | Verifier FAIL on #2: sweep screenshots in `evidence/sweep/` were never hashed | Found by the verifier |
| 6 | 2026-11-17 | Escaping properties use markup-heavy strings; folding properties cover zones and per-step state; bent-edge and label-midpoint properties; `fit()` has example tests (#2) | Verifier mutation run: 9 of 16 injected bugs survived the unit tests | Author's re-run of 10 mutations: all caught (not saved as evidence). Second verifier: 10 of 14 caught; survivors were the highlighter's `>` and escaped quotes (properties added in fix-forward 2), and `refit()` and the tag escape (DOM code with no unit tests) |
| 7 | 2026-11-17 | The sweep holds web fonts back for 1.5 s and only ignores console errors from the font hosts (#2) | Font timing was a suspected cause of a CI-only overflow, and a blanket filter would hide a missing local asset | Ruled font timing out: CI reported identical numbers with the delay |
| 8 | 2026-11-17 | Rewrite the PR body after every fix-forward, listing checks only for the current head (#2) | Second verifier FAIL on #2: the body still described the first head and repeated a false "no behaviour change" | Found by the verifier |
| 9 | 2026-11-18 | A new design or lesson format is mocked first and reviewed by a second model (Fable) before the owner sees it; each module PR of the rebuild gets a Fable review as well as the verifier (redesign PR 1) | Owner pushback: v1 was plain and too basic, and he asked that Claude and Fable both review before he does | Two Fable reviews of the mock found must-fixes (card hidden under the stage, clipped terminals, a wrong `TEN_OFF` claim, CI timing example, per-option predict feedback, phone speed control and more), all fixed before the owner saw it |
| 10 | 2026-11-18 | Content checker validates format-2 lessons: level order (no basics after intermediate), caption, blocks or check per step, scene exists, glossary terms known, checks well formed (redesign PR 1) | New lesson format has more structure that a typo can break silently | In verification |
| 11 | 2026-11-18 | Lesson logic (step duration, grading, XP, streak, word count) is covered by properties; `md()` glossary buttons get escaping properties (redesign PR 1) | Grading and the `[[term|words]]` markup are new code that reaches the learner and `innerHTML` | CI deep profile found that an unclosed `[[` before a real term swallowed it into one button; labels may no longer contain `[`, with an example test |
| 12 | 2026-11-18 | The sweep checks that every scene's text stays inside its diagram, and drives Play/Pause, definition, glossary, a wrong-then-right check, the slider and the finish card (redesign PR 1) | Animated scenes can slide text out of view, which a static overlap check misses | Caught an input chip that started off-screen at x = -120 on Testing Pyramid step 2; it now starts inside and fades in |
