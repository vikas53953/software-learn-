// Example-based tests for the pure parts of the app.
import { describe, it, expect } from 'vitest';
import { resolveStep, edgePath } from '../../src/diagram.js';
import { highlight } from '../../src/highlight.js';
import { esc, md } from '../../src/text.js';

const lesson = {
  nodes: { a: { x: 100, y: 100 }, b: { x: 400, y: 100 }, c: { x: 400, y: 300 } },
  steps: [
    { add: ['a', 'b'], edges: [['a', 'b']], flows: [['a', 'b']], metrics: { m: '1' }, set: { a: { sub: 'x' } }, state: { a: 'hl' } },
    { add: ['c'], metrics: { n: '2' } },
    { remove: ['a'], edges: [], set: { a: { label: 'A' } } },
  ],
};

describe('resolveStep', () => {
  it('accumulates shown nodes across steps', () => {
    expect([...resolveStep(lesson, 1).shown].sort()).toEqual(['a', 'b', 'c']);
    expect([...resolveStep(lesson, 2).shown].sort()).toEqual(['b', 'c']);
  });
  it('inherits edges and flows until a step replaces them', () => {
    expect(resolveStep(lesson, 1).edges).toEqual([['a', 'b']]);
    expect(resolveStep(lesson, 1).flows).toEqual([['a', 'b']]);
    expect(resolveStep(lesson, 2).edges).toEqual([]);
  });
  it('merges metrics and per-node overrides', () => {
    expect(resolveStep(lesson, 1).metrics).toEqual({ m: '1', n: '2' });
    expect(resolveStep(lesson, 2).set.a).toEqual({ sub: 'x', label: 'A' });
  });
  it('does not inherit node state', () => {
    expect(resolveStep(lesson, 0).state).toEqual({ a: 'hl' });
    expect(resolveStep(lesson, 1).state).toEqual({});
  });
});

describe('edgePath', () => {
  it('starts and ends on the node edges, not the centres', () => {
    const { d } = edgePath({ x: 100, y: 100, w: 100, h: 50 }, { x: 400, y: 100, w: 100, h: 50 });
    expect(d).toBe('M153.0,100.0 L347.0,100.0');
  });
});

describe('text helpers', () => {
  it('escapes HTML', () => {
    expect(esc('<img src=x onerror="a()">')).toBe('&lt;img src=x onerror=&quot;a()&quot;&gt;');
  });
  it('renders code and bold after escaping', () => {
    expect(md('use `a<b` and **this**')).toBe('use <code>a&lt;b</code> and <strong>this</strong>');
  });
});

describe('highlight', () => {
  it('marks keywords, strings and comments', () => {
    const out = highlight("const s = 'x'; // note", 'ts');
    expect(out).toContain('<span class="tk-k">const</span>');
    expect(out).toContain('<span class="tk-s">\'x\'</span>');
    expect(out).toContain('<span class="tk-c">// note</span>');
  });
  it('escapes markup inside code', () => {
    expect(highlight('a < b && c > d', 'ts')).not.toMatch(/<(?!\/?span)/);
  });
  it('treats SQL keywords case-insensitively', () => {
    expect(highlight('SELECT 1', 'sql')).toContain('<span class="tk-k">SELECT</span>');
  });
});
