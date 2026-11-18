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

## 6. "Not good-looking, no Play button, too basic" (2026-11-18)

**What happened.** The owner looked at v1 and rejected it: plain UI, no Play button, lessons too shallow, no definition up front. He asked for a Duolingo-like explainer with basic and intermediate depth, and for a Fable review before he sees anything.
**Lesson.** Passing gates says nothing about whether the product is good. The look and the teaching depth need their own review, by someone who did not build it, before the owner.
**Rule.** New formats start as a one-lesson mock, get a second-model review (Fable) with must-fixes done, and only then go to the owner. Every lesson opens with a one-sentence definition, has Basics then Intermediate steps, a Play mode, and at least one check.

## 7. Fable's review found what our checks could not (2026-11-18)

**What happened.** Two Fable reviews of the mock found a list of must-fixes. Some were layout (the reading card slid under the sticky diagram on Play and at the finish; terminals clipped), and some were teaching problems: a claim about a `TEN_OFF` code on step 11 was wrong, the CI timing example had to be reworked, and predict questions gave the same feedback for every answer.
**Lesson.** A reviewer reading as a learner catches wrong claims and awkward flow that a layout sweep cannot.
**Rule.** The content-accuracy read covers numbers inside scenes and code, not just prose. Illustrative numbers say so.

## 8. Verifier FAIL on the redesign engine (2026-11-18)

**What happened.** The independent verifier failed PR #3, and Fable's review of the same build found overlapping problems:
- Old lessons scrolled sideways on phones, because a long one-word tile value like `OrderService` could not wrap. Their diagrams were also cropped.
- Two Testing Pyramid diagrams lost their colours partway through an animation. Code replaced an SVG element's whole `style` attribute, which wiped the `var()` colours that `mk()` keeps there.
- With voice on, Play could stall for good.
- The day streak from `localStorage` reached `innerHTML` unescaped.

The sweep passed through all of it. It checked phones on one lesson only and looked at each diagram 450 ms in, before the late colour change.
**Lesson.** A check that samples one lesson or one moment says nothing about the rest. Values from storage count as user input.
**Rule.**
- The sweep covers every step on a phone, with reduced motion so each scene shows its end state.
- Scene code changes colours with `el.style.fill` or `el.style.stroke`, never with `setAttribute('style')`.
- Numbers read from storage are validated before use.
- On phones, old diagram lessons now fit the whole diagram to the width instead of panning (this replaces the panning rule in entry 2 for the new player). Their scenes are rebuilt in the module PRs.


## 9. Module 1 review: tiny phone diagrams, a leaked hint, stale stages (2026-11-18)

**What happened.** Fable and the verifier both reviewed PR #4 (Module 1). The verifier gave a FAIL: the Testing Pyramid's "smallest thing that has to run" hint was hard-coded for every match check, so it showed on the SRP "split or keep together" check; and the "Split safely" terminal had unlabelled numbers. Fable found phone diagram text at 5–6.5 px, raw backticks in feedback and glossary text, and 13 steps whose stage did not change.

**Why.** The node diagram was designed for an 800-wide desktop stage and was only ever shrunk for phones. The hint was written for the first lesson and lived in the player. Feedback text used `textContent`, so markdown showed raw.

**Rule.**
- Lesson-specific wording lives in the lesson (`check.tail`), never in the player.
- Format-2 lessons give their node diagrams a compact `map`; the phone sees roughly 10 px labels.
- Feedback, glossary popups and finish-card terms go through `md()`.
- A step that teaches something new changes the stage: a new scene or at least its own state.

## 10. Commands in lessons are run, not recalled (2026-11-18)

**What happened.** Fix-forward 1 on #4 added `git log -L :price:src/OrderService.ts` to the SRP lesson. The verifier ran it: git has no TypeScript function finder, so it fails on an indented method. The grid also said "+1 file, no edits" while step 7 says the startup file gains a line.

**Rule.** Every command or code sample added to a lesson is run once by the author before the push (the regex range form `-L '/price(/,/^  }/:file'` was checked in a scratch repo). Numbers repeated across steps are checked against each other.

## 11. Run commands against the lesson's own example, and labels must match the claim (2026-11-18)

**What happened.** Fix-forward 2 on #4 still failed: the unanchored `/price(/` matched the `this.price(cart)` call inside `checkout()` before the `price()` method, so `git log -L` followed the wrong code with no error. My scratch repo had `price()` first, so the check passed for the wrong reason. On #5 the decorator scene labelled the outer log line "3 tries", which the outer layer cannot know. On #6 a wrong prediction joined the option's feedback and the explanation with no space.

**Rule.**
- A command in a lesson is tested on a file shaped like the lesson's own code sample, not a convenient one. Regex ranges are anchored (`/^  price(/`).
- Every scene label is read against the step's claim: what can this component actually see?
- The player joins feedback parts with a space; the sweep checks a wrong prediction (`tests/e2e/sweep.mjs` 2a).

## 12. A schema change is only safe if the version you roll back to still works (2026-11-18)

**What happened.** The verifier failed #7: the expand/contract step had v1.6 stop reading and writing `price` in the same release that switched reads, so a rollback to v1.5 (which still reads `price`) would break, while the text said every step was rollback-safe. The rolling-update scene's "health check" label overflowed its 76-unit cell on phones; the sweep only checked text against the whole diagram, not against the box it sits in. Separately, the PR #8 verifier found that tile tone `ok` had no CSS, so tiles marked `ok` rendered neutral.

**Rule.**
- Every schema step names which versions run against it and what each reads and writes; "rollback-safe" is checked against the previous version, not the current one.
- The sweep checks that text in a box or chip fits inside that box (`scene text overflows its box`); scenes choose a reduced-motion frame that shows their busiest state.
- Tile tones `ok` and `good` render the same.
