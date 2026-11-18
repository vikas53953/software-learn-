// Toolkit for hand-made animated scenes (one function per lesson step).
// Scenes draw into a 480×300 SVG. Text is set with textContent only, never innerHTML.

const NS = 'http://www.w3.org/2000/svg';

export const lerp = (a, b, p) => a + (b - a) * Math.max(0, Math.min(1, p));
export const ease = (p) => { p = Math.max(0, Math.min(1, p)); return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; };
/** Eased 0..1 progress of t between a and b. */
export const seg = (t, a, b) => ease((t - a) / (b - a));

export function createScene(svg) {
  let timers = [], raf = 0;
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Values that use CSS variables go into style, because SVG presentation attributes do not resolve var().
  const mk = (tag, a = {}, p = svg) => {
    const e = document.createElementNS(NS, tag);
    let st = '';
    for (const k in a) {
      const v = a[k];
      if (typeof v === 'string' && v.includes('var(')) st += `${k}:${v};`;
      else e.setAttribute(k, v);
    }
    if (st) e.setAttribute('style', st);
    // Records which paints the shape was made with, so the sweep can spot one that was later wiped.
    const paint = (a.fill && a.fill !== 'none' ? 'f' : '') + (a.stroke && a.stroke !== 'none' ? 's' : '');
    if (paint && tag !== 'text') e.dataset.paint = paint;
    // Change colours later with e.style.fill / e.style.stroke, never setAttribute('style'), which drops the rest.
    p.appendChild(e);
    return e;
  };
  const tx = (x, y, s, a = {}, p = svg) => { const e = mk('text', { x, y, ...a }, p); e.textContent = s; return e; };
  const later = (fn, ms) => timers.push(setTimeout(fn, reduced ? 0 : ms));
  /** Runs fn(seconds) every frame until it returns false. One loop per scene. */
  const loop = (fn) => {
    cancelAnimationFrame(raf);
    if (reduced) { fn(1e4); return; }
    const t0 = performance.now();
    const f = (now) => { if (fn(Math.max(0, now - t0) / 1000) === false) return; raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
  };
  const clear = () => { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf); svg.replaceChildren(); };
  const defs = () => {
    const d = mk('defs');
    for (const [id, c] of [['arA', 'var(--amber)'], ['arG', 'var(--accent)'], ['arI', 'var(--ink)']]) {
      const m = mk('marker', { id, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d);
      mk('path', { d: 'M0,0 L10,5 L0,10 z', fill: c }, m);
    }
  };
  /** A labelled chip that can move around: at(x, y, opacity), set(text). */
  const token = (w, fill, p = svg) => {
    const g = mk('g', {}, p);
    mk('rect', { x: 0, y: -13, width: w, height: 26, rx: 8, fill, stroke: 'var(--ink)', 'stroke-width': 1.8 }, g);
    const t = tx(w / 2, 4.5, '', { class: 's-mono', 'text-anchor': 'middle' }, g);
    return {
      g,
      at(x, y, o = 1) { g.setAttribute('transform', `translate(${x},${y})`); g.setAttribute('opacity', o); },
      set(s) { t.textContent = s; },
    };
  };
  return { mk, tx, later, loop, clear, defs, token, reduced, lerp, ease, seg };
}
