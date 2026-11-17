// A small keyed SVG scene renderer. A lesson declares nodes and zones once; each step
// describes what is visible, which edges exist, which packets flow and how nodes look.
import { ICONS } from './icons.js';

const NS = 'http://www.w3.org/2000/svg';
export const VIEW = { w: 800, h: 460 };
const DEFAULT = { w: 148, h: 56 };

const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
};

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fold steps 0..i into the full visual state for step i. */
export function resolveStep(lesson, i) {
  const shown = new Set(lesson.start || []);
  const set = {};
  let edges = [], zones = [], flows = [], metrics = {};
  for (let k = 0; k <= i; k++) {
    const s = lesson.steps[k];
    (s.add || []).forEach((id) => shown.add(id));
    (s.remove || []).forEach((id) => shown.delete(id));
    if (s.set) for (const [id, v] of Object.entries(s.set)) set[id] = { ...(set[id] || {}), ...v };
    if (s.edges !== undefined) edges = s.edges;
    if (s.zones !== undefined) zones = s.zones;
    if (s.flows !== undefined) flows = s.flows;
    else if (k === i && k > 0 && s.keepFlows === false) flows = [];
    if (s.metrics) metrics = { ...metrics, ...s.metrics };
  }
  const cur = lesson.steps[i];
  return { shown, set, edges, zones, flows, metrics, state: cur.state || {} };
}

/** Point where the ray from a node's centre towards (tx,ty) leaves its rectangle. */
export function exitPoint(n, tx, ty, pad = 3) {
  const w = (n.w || DEFAULT.w) / 2 + pad, h = (n.h || DEFAULT.h) / 2 + pad;
  const dx = tx - n.x, dy = ty - n.y;
  if (dx === 0 && dy === 0) return { x: n.x, y: n.y };
  const s = Math.min(dx !== 0 ? w / Math.abs(dx) : Infinity, dy !== 0 ? h / Math.abs(dy) : Infinity);
  return { x: n.x + dx * s, y: n.y + dy * s };
}

export function edgePath(a, b, bend = 0) {
  if (!bend) {
    const p = exitPoint(a, b.x, b.y), q = exitPoint(b, a.x, a.y);
    return { d: `M${p.x.toFixed(1)},${p.y.toFixed(1)} L${q.x.toFixed(1)},${q.y.toFixed(1)}`, mid: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 } };
  }
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend, cy = my + (dx / len) * bend;
  const p = exitPoint(a, cx, cy), q = exitPoint(b, cx, cy);
  const mid = { x: 0.25 * p.x + 0.5 * cx + 0.25 * q.x, y: 0.25 * p.y + 0.5 * cy + 0.25 * q.y };
  return { d: `M${p.x.toFixed(1)},${p.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}`, mid };
}

const wrapLines = (text) => String(text ?? '').split('\n');

export class Diagram {
  constructor(host) {
    this.host = host;
    this.svg = el('svg', { class: 'stage-svg', viewBox: `0 0 ${VIEW.w} ${VIEW.h}`, role: 'img', preserveAspectRatio: 'xMidYMid meet' });
    this.title = el('title', {}, this.svg);
    const defs = el('defs', {}, this.svg);
    for (const tone of ['base', 'accent', 'warn', 'bad', 'ok', 'muted']) {
      const m = el('marker', { id: `arrow-${tone}`, viewBox: '0 0 10 10', refX: '8.5', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M1,1 L9,5 L1,9 z', class: `arrowhead tone-${tone}` }, m);
    }
    const glow = el('filter', { id: 'glow', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
    el('feGaussianBlur', { stdDeviation: '5', result: 'b' }, glow);
    const merge = el('feMerge', {}, glow);
    el('feMergeNode', { in: 'b' }, merge);
    el('feMergeNode', { in: 'SourceGraphic' }, merge);

    this.gZones = el('g', { class: 'zones' }, this.svg);
    this.gEdges = el('g', { class: 'edges' }, this.svg);
    this.gNodes = el('g', { class: 'nodes' }, this.svg);
    this.gFlows = el('g', { class: 'flows' }, this.svg);
    this.gLabels = el('g', { class: 'edge-labels' }, this.svg);
    host.appendChild(this.svg);

    this.lesson = null;
    this.nodeEls = new Map();
    this.zoneEls = new Map();
    this.edgeEls = new Map();
    this.flowDots = [];
    this.paused = false;
    this.clock = 0;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.svg.remove();
  }

  setPaused(p) { this.paused = p; }

  replay() {
    this.clock = 0;
    this.svg.classList.remove('replaying');
    void this.svg.getBoundingClientRect();
    this.svg.classList.add('replaying');
  }

  loadLesson(lesson) {
    this.lesson = lesson;
    for (const g of [this.gZones, this.gEdges, this.gNodes, this.gFlows, this.gLabels]) g.replaceChildren();
    this.nodeEls.clear(); this.zoneEls.clear(); this.edgeEls.clear(); this.flowDots = [];

    for (const [id, z] of Object.entries(lesson.zones || {})) {
      const g = el('g', { class: `zone tone-${z.tone || 'base'} is-hidden` }, this.gZones);
      el('rect', { x: z.x, y: z.y, width: z.w, height: z.h, rx: 14 }, g);
      const t = el('text', { x: z.x + 12, y: z.y + 18, class: 'zone-label' }, g);
      t.textContent = z.label;
      this.zoneEls.set(id, g);
    }

    for (const [id, n] of Object.entries(lesson.nodes)) {
      const w = n.w || DEFAULT.w, h = n.h || DEFAULT.h;
      const outer = el('g', { class: 'node-pos', transform: `translate(${n.x},${n.y})` }, this.gNodes);
      const g = el('g', { class: `node kind-${n.kind || 'svc'} is-hidden`, 'data-id': id }, outer);
      const r = n.kind === 'actor' ? h / 2 : n.kind === 'note' ? 6 : 11;
      el('rect', { class: 'node-shadow', x: -w / 2 + 3, y: -h / 2 + 4, width: w, height: h, rx: r }, g);
      el('rect', { class: 'node-body', x: -w / 2, y: -h / 2, width: w, height: h, rx: r }, g);
      const hasIcon = n.icon !== false && n.kind !== 'note';
      let tx = -w / 2 + 14;
      if (hasIcon) {
        const box = el('g', { class: 'node-icon', transform: `translate(${-w / 2 + 10},${-12})` }, g);
        el('rect', { x: 0, y: 0, width: 24, height: 24, rx: 6, class: 'node-icon-bg' }, box);
        const ig = el('g', { transform: 'translate(3,3) scale(0.75)', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, box);
        ig.innerHTML = ICONS[n.icon || 'box'] || ICONS.box;
        tx = -w / 2 + 42;
      }
      const label = el('text', { class: 'node-label', x: tx, y: n.sub ? -3 : 5 }, g);
      const sub = el('text', { class: 'node-sub', x: tx, y: 13 }, g);
      const badge = el('g', { class: 'node-badge is-hidden', transform: `translate(${w / 2 - 4},${-h / 2 + 2})` }, g);
      el('rect', { x: -14, y: -11, width: 28, height: 20, rx: 10 }, badge);
      const bt = el('text', { x: 0, y: 3.5, 'text-anchor': 'middle' }, badge);
      this.nodeEls.set(id, { outer, g, label, sub, badge, bt, spec: n, tx });
    }
  }

  setText(textEl, value, x, firstDy) {
    textEl.replaceChildren();
    wrapLines(value).forEach((line, idx) => {
      const t = el('tspan', { x, dy: idx === 0 ? firstDy || 0 : 13 }, textEl);
      t.textContent = line;
    });
  }

  /** Shrink a text element horizontally if it would overflow its node. */
  fit(textEl, room) {
    let w;
    try { w = textEl.getBBox().width; } catch { return; }
    try { w = textEl.getBBox().width; } catch { return; }
    if (w > room && w > 0) {
      const k = Math.max(0.6, room / w), x = +textEl.querySelector('tspan')?.getAttribute('x') || 0;
      textEl.setAttribute('transform', `translate(${x * (1 - k)},0) scale(${k},1)`);
    }
  }

  render(lesson, stepIndex) {
    if (this.lesson !== lesson) this.loadLesson(lesson);
    const st = resolveStep(lesson, stepIndex);
    const step = lesson.steps[stepIndex];
    this.title.textContent = `${lesson.title}, step ${stepIndex + 1}: ${step.title}`;

    for (const [id, g] of this.zoneEls) g.classList.toggle('is-hidden', !st.zones.includes(id));

    for (const [id, n] of this.nodeEls) {
      const ov = { ...n.spec, ...(st.set[id] || {}) };
      const hidden = !st.shown.has(id);
      n.g.setAttribute('class', `node kind-${n.spec.kind || 'svc'}${hidden ? ' is-hidden' : ''}${st.state[id] ? ' is-' + st.state[id] : ''}`);
      const lines = wrapLines(ov.label).length;
      const subLines = ov.sub ? wrapLines(ov.sub).length : 0;
      const totalH = lines * 14 + subLines * 13;
      const top = -totalH / 2 + 10;
      this.setText(n.label, ov.label, n.tx);
      n.label.setAttribute('y', top);
      if (ov.sub) { this.setText(n.sub, ov.sub, n.tx); n.sub.setAttribute('y', top + lines * 14 + 1); n.sub.style.display = ''; }
      else n.sub.style.display = 'none';
      const room = (n.spec.w || DEFAULT.w) / 2 - n.tx - 10;
      this.fit(n.label, room); if (ov.sub) this.fit(n.sub, room);
      if (ov.badge !== undefined && ov.badge !== null && ov.badge !== '') {
        n.bt.textContent = ov.badge;
        n.badge.setAttribute('class', `node-badge tone-${ov.badgeTone || 'accent'}`);
      } else n.badge.setAttribute('class', 'node-badge is-hidden');
    }

    // Edges, keyed by from>to so unchanged edges stay put between steps.
    const want = new Map();
    for (const [a, b, o = {}] of st.edges) want.set(`${a}>${b}`, { a, b, o });
    for (const [key, rec] of this.edgeEls) {
      if (!want.has(key)) {
        this.edgeEls.delete(key);
        rec.path.classList.add('is-leaving'); rec.lab?.classList.add('is-leaving');
        setTimeout(() => { rec.path.remove(); rec.lab?.remove(); }, 260);
      }
    }
    for (const [key, { a, b, o }] of want) {
      const na = lesson.nodes[a], nb = lesson.nodes[b];
      if (!na || !nb) { console.warn('edge to unknown node', key); continue; }
      const { d, mid } = edgePath(na, nb, o.bend);
      const tone = o.tone || 'base';
      let rec = this.edgeEls.get(key);
      if (!rec) {
        rec = { path: el('path', { class: 'edge is-entering' }, this.gEdges) };
        requestAnimationFrame(() => requestAnimationFrame(() => rec.path.classList.remove('is-entering')));
        this.edgeEls.set(key, rec);
      }
      rec.path.setAttribute('d', d);
      rec.path.setAttribute('class', `edge tone-${tone}${o.dash ? ' is-dash' : ''}${o.thick ? ' is-thick' : ''}`);
      if (o.noArrow) { rec.path.removeAttribute('marker-end'); rec.path.removeAttribute('marker-start'); }
      else {
        rec.path.setAttribute('marker-end', `url(#arrow-${tone})`);
        if (o.both) rec.path.setAttribute('marker-start', `url(#arrow-${tone})`); else rec.path.removeAttribute('marker-start');
      }
      if (o.label) {
        if (!rec.lab) rec.lab = el('text', { class: 'edge-label', 'text-anchor': 'middle' }, this.gLabels);
        rec.lab.setAttribute('x', mid.x + (o.lx || 0));
        rec.lab.setAttribute('y', mid.y + (o.ly ?? -6));
        rec.lab.setAttribute('class', `edge-label tone-${tone}`);
        rec.lab.textContent = o.label;
      } else if (rec.lab) { rec.lab.remove(); rec.lab = null; }
    }

    // Flows: packets travelling along a (possibly invisible) path.
    this.gFlows.replaceChildren();
    this.flowDots = [];
    for (const [a, b, o = {}] of st.flows) {
      const na = lesson.nodes[a], nb = lesson.nodes[b];
      if (!na || !nb) continue;
      const { d } = edgePath(na, nb, o.bend);
      const path = el('path', { d, class: 'flow-track' }, this.gFlows);
      const len = path.getTotalLength();
      const n = o.n || 2;
      for (let k = 0; k < n; k++) {
        const dot = el('circle', { r: o.r || 5, class: `packet tone-${o.tone || 'accent'}` }, this.gFlows);
        this.flowDots.push({ dot, path, len, dur: o.dur || 1.8, phase: k / n + (o.delay || 0), stall: o.stall });
      }
    }
    this.placeDots();
  }

  placeDots() {
    const still = reducedMotion();
    for (const f of this.flowDots) {
      let t = still ? f.phase % 1 : (this.clock / f.dur + f.phase) % 1;
      if (f.stall !== undefined) t = Math.min(t * 1.6, f.stall); // packets pile up at a point (blocked)
      const p = f.path.getPointAtLength(t * f.len);
      f.dot.setAttribute('cx', p.x.toFixed(1));
      f.dot.setAttribute('cy', p.y.toFixed(1));
      const fade = still ? 1 : Math.min(1, t * 8, (1 - t) * 8);
      f.dot.setAttribute('opacity', f.stall !== undefined ? 1 : fade.toFixed(2));
    }
  }

  tick = (now) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused && !document.hidden) this.clock += dt;
    if (this.flowDots.length) this.placeDots();
    this.raf = requestAnimationFrame(this.tick);
  };
}
