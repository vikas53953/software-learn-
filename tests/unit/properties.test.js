// Property-based tests (fast-check). Set FC_PROFILE=deep for more runs.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveStep, edgePath } from '../../src/diagram.js';
import { highlight } from '../../src/highlight.js';
import { esc, md } from '../../src/text.js';

const RUNS = process.env.FC_PROFILE === 'deep' ? 5000 : 300;
const opts = { numRuns: RUNS };

const IDS = ['a', 'b', 'c', 'd', 'e'];
const id = fc.constantFrom(...IDS);
const pair = fc.tuple(id, id);
const step = fc.record({
  add: fc.option(fc.array(id, { maxLength: 3 }), { nil: undefined }),
  remove: fc.option(fc.array(id, { maxLength: 2 }), { nil: undefined }),
  edges: fc.option(fc.array(pair, { maxLength: 3 }), { nil: undefined }),
  flows: fc.option(fc.array(pair, { maxLength: 3 }), { nil: undefined }),
  metrics: fc.option(fc.dictionary(fc.constantFrom('m1', 'm2', 'm3'), fc.string({ maxLength: 4 })), { nil: undefined }),
  set: fc.option(fc.dictionary(id, fc.record({ label: fc.string({ maxLength: 4 }) })), { nil: undefined }),
}, { requiredKeys: [] });
const lessonArb = fc.array(step, { minLength: 1, maxLength: 8 }).map((steps) => ({
  nodes: Object.fromEntries(IDS.map((k, i) => [k, { x: 80 + i * 150, y: 200 }])),
  steps,
}));

/** Straightforward reference model of how steps fold together. */
function model(lesson, i) {
  const shown = new Set(); let edges = [], flows = [], metrics = {}; const set = {};
  for (const s of lesson.steps.slice(0, i + 1)) {
    for (const x of s.add || []) shown.add(x);
    for (const x of s.remove || []) shown.delete(x);
    if (s.edges) edges = s.edges;
    if (s.flows) flows = s.flows;
    Object.assign(metrics, s.metrics || {});
    for (const [k, v] of Object.entries(s.set || {})) set[k] = { ...set[k], ...v };
  }
  return { shown: [...shown].sort(), edges, flows, metrics, set };
}
const view = (r) => ({ shown: [...r.shown].sort(), edges: r.edges, flows: r.flows, metrics: r.metrics, set: r.set });

const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

describe('properties: step folding', () => {
  it('matches the reference model at every step', () => {
    fc.assert(fc.property(lessonArb, (l) => {
      l.steps.forEach((_, i) => expect(view(resolveStep(l, i))).toEqual(model(l, i)));
    }), opts);
  });
  it('a step never depends on later steps (prefix invariance)', () => {
    fc.assert(fc.property(lessonArb, fc.array(step, { minLength: 1, maxLength: 4 }), (l, extra) => {
      const longer = { ...l, steps: [...l.steps, ...extra] };
      l.steps.forEach((_, i) => expect(view(resolveStep(longer, i))).toEqual(view(resolveStep(l, i))));
    }), opts);
  });
  it('is deterministic: resolving twice gives the same state', () => {
    fc.assert(fc.property(lessonArb, (l) => {
      const i = l.steps.length - 1;
      expect(view(resolveStep(l, i))).toEqual(view(resolveStep(l, i)));
    }), opts);
  });
});

describe('properties: text safety', () => {
  it('esc round-trips and leaves no raw markup characters', () => {
    fc.assert(fc.property(fc.string({ unit: 'binary' }), (s) => {
      const e = esc(s);
      expect(e).not.toMatch(/[<>"']/);
      expect(unescape(e)).toBe(s);
    }), opts);
  });
  it('md equals esc for text without markdown markers', () => {
    fc.assert(fc.property(fc.string().filter((s) => !/[`*]/.test(s)), (s) => { expect(md(s)).toBe(esc(s)); }), opts);
  });
  it('md never emits tags other than code and strong', () => {
    fc.assert(fc.property(fc.string(), (s) => {
      const tags = md(s).match(/<\/?[a-z]+/g) || [];
      tags.forEach((t) => expect(['<code', '</code', '<strong', '</strong']).toContain(t));
    }), opts);
  });
});

describe('properties: highlighter', () => {
  const lang = fc.constantFrom('ts', 'js', 'sql', 'yaml', 'text');
  const code = fc.string({ unit: fc.constantFrom(...'abcSELECT const if // -- # \' " ` < > & 0 1 \n x: (){}'.split(' ').flatMap((w) => [w, ' '])), maxLength: 60 });
  it('only adds span tags: stripping them gives back the source', () => {
    fc.assert(fc.property(code, lang, (src, l) => {
      const out = highlight(src, l);
      expect(unescape(out.replace(/<span class="tk-[a-z]">|<\/span>/g, ''))).toBe(src);
    }), opts);
  });
  it('never emits a raw "<" outside its own span tags', () => {
    fc.assert(fc.property(fc.string(), lang, (src, l) => {
      expect(highlight(src, l).replace(/<span class="tk-[a-z]">|<\/span>/g, '')).not.toMatch(/</);
    }), opts);
  });
});

describe('properties: edge geometry', () => {
  const node = fc.record({ x: fc.integer({ min: 0, max: 800 }), y: fc.integer({ min: 0, max: 460 }), w: fc.integer({ min: 40, max: 200 }), h: fc.integer({ min: 30, max: 100 }) });
  const onBoundary = (n, p) => {
    const hw = n.w / 2 + 3, hh = n.h / 2 + 3, dx = Math.abs(p.x - n.x), dy = Math.abs(p.y - n.y);
    return dx <= hw + 0.11 && dy <= hh + 0.11 && (Math.abs(dx - hw) < 0.11 || Math.abs(dy - hh) < 0.11);
  };
  it('straight edges start and end on the two node boundaries', () => {
    fc.assert(fc.property(node, node, (a, b) => {
      fc.pre(Math.abs(a.x - b.x) > (a.w + b.w) / 2 + 8 || Math.abs(a.y - b.y) > (a.h + b.h) / 2 + 8);
      const [, x1, y1, x2, y2] = edgePath(a, b).d.match(/M([-\d.]+),([-\d.]+) L([-\d.]+),([-\d.]+)/).map(Number);
      expect(onBoundary(a, { x: x1, y: y1 })).toBe(true);
      expect(onBoundary(b, { x: x2, y: y2 })).toBe(true);
    }), opts);
  });
});
