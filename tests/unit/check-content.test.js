import { describe, it, expect } from 'vitest';
import { checkContent } from '../../scripts/check-content.mjs';
import { LESSONS } from '../../src/content/index.js';

// A tiny valid format-2 lesson; each case breaks one rule and expects exactly that problem.
const step = (o = {}) => ({ lvl: 'basics', label: 'L', title: 'T', say: 'Say.', blocks: [{ p: 'Body.' }], ...o });
const lesson = (steps, o = {}) => ({ slug: 'x', format: 2, definition: { sentence: 'S.' }, metrics: [], learn: [], terms: { ok: ['Ok', 'fine'] }, scenes: { a() {} }, steps, ...o });
const run = (l) => checkContent([l]);

describe('content checker (format 2)', () => {
  it('the real course has no problems', () => { expect(checkContent(LESSONS)).toEqual([]); });
  it('accepts a valid lesson', () => { expect(run(lesson([step(), step({ lvl: 'intermediate', scene: 'a', say: 'Uses [[ok|a term]].' })]))).toEqual([]); });
  it('rejects a basics step after an intermediate one', () => {
    expect(run(lesson([step({ lvl: 'intermediate' }), step()]))).toEqual(['x step 2: basics step after intermediate']);
  });
  it('rejects an unknown glossary term', () => { expect(run(lesson([step({ say: 'See [[nope|this]].' })]))).toEqual(['x step 1: unknown term nope']); });
  it('rejects an unknown scene', () => { expect(run(lesson([step({ scene: 'b' })]))).toEqual(['x step 1: unknown scene b']); });
  it('rejects a bad level and a step with no body or check', () => {
    expect(run(lesson([step({ lvl: 'expert' })]))).toEqual(['x step 1: bad lvl expert']);
    expect(run(lesson([step({ blocks: [] })]))).toEqual(['x step 1: needs blocks or a check']);
  });
  it('rejects a lesson with no definition', () => { expect(run(lesson([step()], { definition: undefined }))).toEqual(['x step 0: format 2 lesson needs definition.sentence']); });
  it('rejects broken checks', () => {
    const choice = { type: 'choice', q: 'Q', ans: 0, why: 'W', opts: [{ t: 'a' }, { t: 'b' }] };
    expect(run(lesson([step({ check: choice })]))).toEqual(['x step 1: option 2 needs a hint']);
    expect(run(lesson([step({ check: { ...choice, ans: 5, opts: [{ t: 'a', hint: 'h' }] } })]))).toEqual(['x step 1: answer out of range']);
    expect(run(lesson([step({ check: { type: 'quiz' } })]))).toEqual(['x step 1: bad check type quiz']);
  });
});
