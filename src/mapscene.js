// Draws a lesson's node diagram as a compact 480×300 scene, so it stays readable on a phone.
// The lesson keeps its usual step data (add/remove/set/edges/flows/state/zones); `lesson.map`
// only gives each node and zone a place in the small canvas: nodes { id: [x, y, w] },
// zones { id: [x, y, w, h, 'b'?] } ('b' puts the zone's label at its bottom edge). Geometry comes from diagram.js (covered by properties).
import { resolveStep, edgePath } from './diagram.js';

const H = 34, HS = 44, LINE = 14;
const KIND = {
  iface: ['var(--violet-soft)', 'var(--violet)'], note: ['var(--surface-2)', 'var(--line-strong)'],
  test: ['var(--accent-soft)', 'var(--accent)'], store: ['var(--surface-3)', 'var(--ink)'],
};
const STATE = {
  hl: ['var(--amber-soft)', 'var(--amber)'], ok: ['var(--ok-soft)', 'var(--ok)'],
  bad: ['var(--bad-soft)', 'var(--bad)'], warn: ['var(--warn-soft)', 'var(--warn)'],
};
const EDGE = { base: 'var(--ink)', accent: 'var(--accent)', ok: 'var(--ok)', bad: 'var(--bad)', warn: 'var(--amber)', muted: 'var(--line-strong)' };

/** Box for node id at step state r: centre, size and text after `set` overrides. */
export function mapBox(lesson, r, id) {
  const [x, y, w] = lesson.map.nodes[id];
  const n = { ...lesson.nodes[id], ...(r.set[id] || {}) };
  const lines = String(n.label ?? '').split('\n');
  const h = (n.sub ? HS : H) + (lines.length - 1) * LINE;
  return { x, y, w, h, n, lines };
}

export function drawMap(k, lesson, i) {
  const { mk, tx, loop, seg } = k;
  const r = resolveStep(lesson, i), step = lesson.steps[i];
  const fresh = new Set(i > 0 ? step.add || [] : []);
  const d = mk('defs');
  for (const [tone, c] of Object.entries(EDGE)) {
    const m = mk('marker', { id: `mp-${tone}`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, d);
    mk('path', { d: 'M1,1 L9,5 L1,9 z', fill: c }, m);
  }
  for (const z of r.zones) {
    const [x, y, w, h, pos] = lesson.map.zones[z], Z = lesson.zones[z];
    mk('rect', { class: 'map-zone', x, y, width: w, height: h, rx: 12, fill: Z.tone === 'accent' ? 'var(--accent-soft)' : 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
    tx(x + 10, pos === 'b' ? y + h - 8 : y + 16, Z.label, { class: 'm-zone' });
  }
  const box = (id) => mapBox(lesson, r, id);
  const gEdges = mk('g'), gNodes = mk('g'), gLabels = mk('g'), gDots = mk('g');
  const paths = new Map();
  const pathFor = (a, b, o = {}) => edgePath(box(a), box(b), (o.bend || 0) * 0.6);
  for (const [a, b, o = {}] of r.edges) {
    const tone = o.tone || 'base', { d: pd, mid } = pathFor(a, b, o);
    const p = mk('path', { class: 'map-edge', d: pd, fill: 'none', stroke: EDGE[tone], 'stroke-width': 1.8, 'marker-end': `url(#mp-${tone})`, ...(o.dash ? { 'stroke-dasharray': '5 4' } : {}) }, gEdges);
    paths.set(`${a}>${b}`, p);
    if (o.label) {
      const g = mk('g', { class: 'map-elbl' }, gLabels);
      const w = o.label.length * 5.9 + 10;
      mk('rect', { x: mid.x - w / 2, y: mid.y - 8, width: w, height: 16, rx: 8, fill: 'var(--surface)', stroke: EDGE[tone], 'stroke-width': 1 }, g);
      tx(mid.x, mid.y + 3.5, o.label, { class: 'm-elbl', 'text-anchor': 'middle' }, g);
    }
  }
  const fades = [];
  for (const id of Object.keys(lesson.nodes)) {
    if (!r.shown.has(id)) continue;
    const { x, y, w, h, n, lines } = box(id), st = r.state[id] || '';
    const [fill, stroke] = STATE[st] || KIND[n.kind] || ['var(--surface)', 'var(--ink)'];
    const g = mk('g', { class: 'map-node', 'data-id': id, opacity: st === 'dim' ? 0.35 : 1 }, gNodes);
    const rx = n.kind === 'actor' ? h / 2 : n.kind === 'note' ? 4 : 8;
    mk('rect', { class: 'map-body', x: x - w / 2, y: y - h / 2, width: w, height: h, rx, fill, stroke, 'stroke-width': 2, ...(n.kind === 'note' ? { 'stroke-dasharray': '4 3' } : {}) }, g);
    const top = y - h / 2 + 15 + (n.sub ? 0 : 6);
    lines.forEach((t, j) => tx(x, top + j * LINE, t, { class: 'm-lbl', 'text-anchor': 'middle' }, g));
    if (n.sub) tx(x, top + lines.length * LINE + 1, n.sub, { class: 'm-sub', 'text-anchor': 'middle' }, g);
    if (fresh.has(id)) { g.setAttribute('opacity', 0); fades.push([g, st === 'dim' ? 0.35 : 1]); }
  }
  const dots = [];
  for (const [a, b, o = {}] of r.flows) {
    let p = paths.get(`${a}>${b}`);
    if (!p) p = mk('path', { d: pathFor(a, b, o).d, fill: 'none', stroke: 'none' }, gEdges);
    const n = o.n || 1;
    for (let j = 0; j < n; j++) dots.push({ p, j, n, dur: o.dur || 1.6, delay: o.delay || 0, c: mk('circle', { r: 5, cx: -20, cy: -20, fill: EDGE[o.tone] || 'var(--amber)', stroke: 'var(--ink)', 'stroke-width': 1.2 }, gDots) });
  }
  if (!fades.length && !dots.length) return;
  loop((T) => {
    fades.forEach(([g, o]) => g.setAttribute('opacity', o * seg(T, 0, 0.45)));
    for (const f of dots) {
      if (T < f.delay) continue;
      const L = f.p.getTotalLength(), q = (((T - f.delay) / f.dur + f.j / f.n) % 1) * L, pt = f.p.getPointAtLength(q);
      f.c.setAttribute('cx', pt.x); f.c.setAttribute('cy', pt.y);
    }
    if (!dots.length && T > 0.5) return false;
  });
}
