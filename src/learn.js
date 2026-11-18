// Pure lesson logic used by the player: timing, grading, streaks and readouts.
// No DOM here, so every rule is covered by unit and property tests.

/** Words in a string, ignoring markup characters used by md(). */
export const wordCount = (t) => String(t ?? '').replace(/[`*[\]|]/g, ' ').split(/\s+/).filter(Boolean).length;

/** All readable text in a step's blocks (paragraphs, lists, tables, callouts). */
export function stepText(step) {
  const out = [];
  for (const b of stepBlocks(step)) {
    if (b.p) out.push(b.p);
    if (b.ul) out.push(...b.ul);
    if (b.ol) out.push(...b.ol);
    if (b.callout) out.push(b.text);
    if (b.table) out.push(...b.table.head, ...b.table.rows.flat());
  }
  return out.join(' ');
}

/**
 * How long Play mode stays on a step, in ms: the caption read aloud (2.6 words/s)
 * plus skimming the card (9 words/s) plus 3 s, clamped to 7–60 s, divided by speed.
 */
export function stepDuration(step, speed = 1) {
  const secs = wordCount(step.say) / 2.6 + wordCount(stepText(step)) / 9 + 3;
  return (Math.min(60, Math.max(7, secs)) * 1000) / (speed > 0 ? speed : 1);
}

/**
 * Old-format steps (body / code / callout / changes) and new-format steps (blocks)
 * both become one list of blocks, in reading order.
 */
export function stepBlocks(step) {
  if (step.blocks) return step.blocks;
  const out = (step.body || []).map((p) => ({ p }));
  if (step.code) out.push({ code: step.code.src, lang: step.code.lang });
  if (step.callout) out.push({ callout: step.callout.type, text: step.callout.text });
  if (step.changes) out.push({ changes: step.changes });
  return out;
}

/**
 * Grades an answer.
 * choice / predict: answer is an option index. match: answer is an array of bin indexes, one per bug.
 * Returns { ok, wrong: indexes that are wrong, hint } . A predict is never "not ok": any guess moves on.
 */
export function grade(check, answer) {
  if (check.type === 'match') {
    const wrong = check.bugs.map((b, k) => (answer?.[k] === b.a ? -1 : k)).filter((k) => k >= 0);
    return { ok: wrong.length === 0, wrong, hint: wrong.map((k) => check.bugs[k].hint).join(' ') };
  }
  const right = answer === check.ans;
  if (check.type === 'predict') return { ok: true, right, wrong: right ? [] : [answer], hint: check.fb?.[answer] || '' };
  return { ok: right, wrong: right ? [] : [answer], hint: right ? '' : (check.opts[answer]?.hint || '') };
}

/** XP for an answer: 15 first try, 5 after a retry; a prediction earns 10 if right, else 5. */
export function xpFor(check, tries, right) {
  if (check.type === 'predict') return right ? 10 : 5;
  return tries === 1 ? 15 : 5;
}

/** Day streak: same day keeps it, the day after adds one, any gap resets to 1. */
export function nextStreak(prev, today, yesterday) {
  if (prev && prev.day === today) return { day: today, n: prev.n };
  if (prev && prev.day === yesterday) return { day: today, n: prev.n + 1 };
  return { day: today, n: 1 };
}

/**
 * What the stage readout shows for a step: the step's own `read`, or, for diagram
 * lessons, the lesson's metrics as tiles with the values resolved for this step.
 */
export function readoutFor(lesson, step, metrics = {}) {
  if (step.read) return step.read;
  if (step.check) return { note: 'Your turn. Answer in the card.' };
  if (lesson.metrics?.length) return { tiles: lesson.metrics.map((m) => ({ k: m.label, v: metrics[m.key] ?? '—' })) };
  return { note: '' };
}
