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
  it('rejects a map that is missing a node or zone, or puts one outside 480×300', () => {
    const nodes = { a: { x: 100, y: 100, label: 'A' }, b: { x: 200, y: 100, label: 'B', sub: 's' } };
    const zones = { z: { x: 10, y: 10, w: 100, h: 100, label: 'Z' } };
    const ok = { nodes: { a: [60, 40, 100], b: [200, 40, 100] }, zones: { z: [0, 0, 480, 300] } };
    expect(run(lesson([step()], { nodes, zones, map: ok }))).toEqual([]);
    expect(run(lesson([step()], { nodes, zones, map: { ...ok, nodes: { a: ok.nodes.a } } }))).toEqual(['x step 0: map has no place for node b']);
    expect(run(lesson([step()], { nodes, zones, map: { ...ok, nodes: { ...ok.nodes, a: [440, 40, 100] } } }))).toEqual(['x step 0: map node a outside 480×300']);
    // b has a sub-label, so it is 44 tall: y 280 reaches 302.
    expect(run(lesson([step()], { nodes, zones, map: { ...ok, nodes: { ...ok.nodes, b: [200, 280, 100] } } }))).toEqual(['x step 0: map node b outside 480×300']);
    expect(run(lesson([step()], { nodes, zones, map: { ...ok, zones: {} } }))).toEqual(['x step 0: map has no place for zone z']);
    expect(run(lesson([step()], { nodes, zones, map: { ...ok, zones: { z: [0, 0, 481, 300] } } }))).toEqual(['x step 0: map zone z outside 480×300']);
  });
});
