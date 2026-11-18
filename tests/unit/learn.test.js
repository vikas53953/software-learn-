// Example tests for the lesson logic and the Testing Pyramid's numbers.
import { describe, it, expect } from 'vitest';
import { grade, xpFor, nextStreak, stepBlocks, readoutFor, stepDuration } from '../../src/learn.js';
import { mixModel, suiteCost } from '../../src/content/scenes/pyramid.js';
import { pyramid } from '../../src/content/testing-pyramid.js';

describe('grading', () => {
  const choice = { type: 'choice', ans: 1, opts: [{ t: 'a', hint: 'not a' }, { t: 'b' }, { t: 'c', hint: 'not c' }], why: 'b' };
  it('gives the hint of the option picked', () => {
    expect(grade(choice, 0)).toEqual({ ok: false, wrong: [0], hint: 'not a' });
    expect(grade(choice, 2).hint).toBe('not c');
    expect(grade(choice, 1)).toEqual({ ok: true, wrong: [], hint: '' });
  });
  it('gives per-option feedback on a prediction', () => {
    const p = { type: 'predict', ans: 0, opts: [{}, {}, {}], fb: ['', 'high', 'way high'] };
    expect(grade(p, 2)).toEqual({ ok: true, right: false, wrong: [2], hint: 'way high' });
  });
  it('joins the hints of every misplaced bug', () => {
    const m = { type: 'match', bins: ['u', 'i', 'e'], bugs: [{ a: 0, hint: 'h0' }, { a: 1, hint: 'h1' }, { a: 2, hint: 'h2' }] };
    expect(grade(m, [0, 2, 1])).toEqual({ ok: false, wrong: [1, 2], hint: 'h1 h2' });
  });
  it('scores XP: 15 first try, 5 after a retry, 10 or 5 for a prediction', () => {
    expect(xpFor(choice, 1, true)).toBe(15);
    expect(xpFor(choice, 2, true)).toBe(5);
    expect(xpFor({ type: 'predict' }, 1, true)).toBe(10);
    expect(xpFor({ type: 'predict' }, 1, false)).toBe(5);
  });
});

describe('streak', () => {
  it('keeps, grows and resets', () => {
    expect(nextStreak({ day: 'Tue', n: 3 }, 'Tue', 'Mon')).toEqual({ day: 'Tue', n: 3 });
    expect(nextStreak({ day: 'Mon', n: 3 }, 'Tue', 'Mon')).toEqual({ day: 'Tue', n: 4 });
    expect(nextStreak({ day: 'Sat', n: 3 }, 'Tue', 'Mon')).toEqual({ day: 'Tue', n: 1 });
    expect(nextStreak(null, 'Tue', 'Mon')).toEqual({ day: 'Tue', n: 1 });
  });
});

describe('old-format steps', () => {
  it('turn body, code, callout and changes into blocks in reading order', () => {
    const s = { body: ['a', 'b'], code: { lang: 'ts', src: 'x' }, callout: { type: 'key', text: 'c' }, changes: [['+', 'd']] };
    expect(stepBlocks(s)).toEqual([{ p: 'a' }, { p: 'b' }, { code: 'x', lang: 'ts' }, { callout: 'key', text: 'c' }, { changes: [['+', 'd']] }]);
  });
  it('show their metrics as readout tiles', () => {
    const l = { metrics: [{ key: 't', label: 'Time' }, { key: 'x', label: 'X' }] };
    expect(readoutFor(l, {}, { t: '5 s' })).toEqual({ tiles: [{ k: 'Time', v: '5 s' }, { k: 'X', v: '—' }] });
    expect(readoutFor(l, { check: {} }, {})).toEqual({ note: 'Your turn. Answer in the card.' });
  });
  it('get a Play time within bounds', () => {
    expect(stepDuration({})).toBe(7000);
    expect(stepDuration({ say: 'word '.repeat(1000) })).toBe(60000);
  });
});

describe('Testing Pyramid numbers match its own model', () => {
  it('the cone team (60/40/380) is ~64 min and ~15 flaky fails a week', () => {
    const c = suiteCost(60, 40, 380);
    expect(Math.round(c.minutes)).toBe(64);
    expect(Math.round(c.flaky)).toBe(15);
  });
  it('after the refactor (960/190/40) it is ~8 min and ~2 a week', () => {
    const c = suiteCost(960, 190, 40);
    expect(Math.round(c.minutes)).toBe(8);
    expect(Math.round(c.flaky)).toBe(2);
  });
  it('the slider calls 10% a pyramid and 60% an ice-cream cone', () => {
    expect(mixModel(10).shape).toBe('Pyramid');
    expect(mixModel(30).shape).toBe('Top-heavy');
    expect(mixModel(60).shape).toBe('Ice-cream cone');
    expect(mixModel(10).unit + mixModel(10).integration + mixModel(10).e2e).toBe(1000);
  });
  it('the lesson text quotes those same numbers', () => {
    const txt = JSON.stringify(pyramid.steps);
    expect(txt).toContain('64 → 8 min');
    expect(txt).toContain('~15 → ~2');
    expect(txt).toContain('480 → 1,190');
  });
});
