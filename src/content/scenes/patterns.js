// Animated scenes for Module 2 (Design Patterns). Each takes the scene toolkit (k) and the step context (ctx).
// Everything stays inside the 480×300 box; colours change only through el.style.

const box = (k, x, y, w, h, fill, extra = {}) => k.mk('rect', { x, y, width: w, height: h, rx: 10, fill, stroke: 'var(--ink)', 'stroke-width': 2.2, ...extra });

const LISTENERS = [
  { name: 'Receipt email', ms: 120 },
  { name: 'Inventory', ms: 80 },
  { name: 'Analytics', ms: 30000, bad: true },
  { name: 'Loyalty', ms: 60 },
];

export const scenes = {
  /** Observer, synchronous: emit awaits each listener in turn, so one hanging listener holds up checkout. */
  obsSync(k) {
    const { mk, tx, loop, seg } = k;
    tx(240, 26, 'emit() awaits each listener in turn', { class: 's-cap', 'text-anchor': 'middle' });
    box(k, 16, 120, 112, 50, 'var(--surface)');
    tx(72, 142, 'checkout', { class: 's-mono', 'text-anchor': 'middle' });
    const status = tx(72, 160, 'waiting…', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const rows = LISTENERS.map((l, i) => {
      const y = 52 + i * 52;
      const r = box(k, 158, y, 150, 38, 'var(--surface)');
      tx(233, y + 24, l.name, { class: 's-mono', 'text-anchor': 'middle' });
      const t = tx(330, y + 24, '', { class: 's-mono' });
      mk('line', { x1: 128, y1: 145, x2: 158, y2: y + 19, stroke: 'var(--line)', 'stroke-width': 1.5 });
      return { r, t };
    });
    const verdict = tx(240, 284, '', { class: 's-red', 'text-anchor': 'middle' });
    // Wall-clock stand-in: each listener gets 0.7 s of animation; analytics "hangs" for 2.5 s then times out.
    const span = [0.7, 0.7, 2.5, 0.7];
    loop((T) => {
      let t0 = 0.4, failed = false;
      rows.forEach((row, i) => {
        const L = LISTENERS[i], start = t0, end = t0 + span[i];
        const running = !failed && T >= start && T < end, done = !failed && T >= end;
        row.r.style.fill = running ? (L.bad ? 'var(--bad-soft)' : 'var(--l2)') : done && !L.bad ? 'var(--ok-soft)' : done && L.bad ? 'var(--bad-soft)' : 'var(--surface)';
        row.r.style.stroke = done && L.bad ? 'var(--bad)' : 'var(--ink)';
        row.t.textContent = failed ? 'never ran' : running ? (L.bad ? `${Math.round(seg(T, start, end) * 30)} s…` : '…') : done ? (L.bad ? 'timeout' : `${L.ms} ms`) : '';
        row.t.style.fill = failed || (done && L.bad) ? 'var(--bad)' : 'var(--ink)';
        if (done && L.bad) failed = true;
        t0 = end;
      });
      const over = T >= 0.4 + 0.7 + 0.7 + 2.5;
      status.textContent = over ? '✗ failed' : 'waiting…';
      status.style.fill = over ? 'var(--bad)' : 'var(--ink)';
      verdict.textContent = over ? 'checkout fails because analytics hung' : '';
      if (T > 6) return false;
    });
  },

  /** Observer, isolated: emit returns at once; listeners run side by side and one failure stays contained. */
  obsAsync(k) {
    const { mk, tx, loop, seg } = k;
    tx(240, 26, 'emit() hands off and returns', { class: 's-cap', 'text-anchor': 'middle' });
    const co = box(k, 16, 120, 112, 50, 'var(--surface)');
    tx(72, 142, 'checkout', { class: 's-mono', 'text-anchor': 'middle' });
    const status = tx(72, 160, '', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const rows = LISTENERS.map((l, i) => {
      const y = 52 + i * 52;
      const r = box(k, 158, y, 150, 38, 'var(--surface)');
      tx(233, y + 24, l.name, { class: 's-mono', 'text-anchor': 'middle' });
      const bar = mk('rect', { x: 320, y: y + 14, width: 0, height: 10, rx: 5, fill: l.bad ? 'var(--bad)' : 'var(--ok)' });
      const t = tx(320, y + 36, '', { class: 's-note s-ink' });
      mk('line', { x1: 128, y1: 145, x2: 158, y2: y + 19, stroke: 'var(--line)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' });
      return { r, bar, t };
    });
    const verdict = tx(240, 284, '', { class: 's-grn', 'text-anchor': 'middle' });
    loop((T) => {
      const p = seg(T, 0.6, 2.4);
      co.style.fill = T > 0.6 ? 'var(--ok-soft)' : 'var(--surface)';
      status.textContent = T > 0.6 ? '✓ 180 ms' : '';
      status.style.fill = 'var(--ok)';
      rows.forEach((row, i) => {
        const L = LISTENERS[i], frac = L.bad ? Math.min(1, p * 1.1) : Math.min(1, p * (3 - i * 0.4));
        row.bar.setAttribute('width', 140 * frac);
        row.t.textContent = frac >= 1 ? (L.bad ? 'failed, logged' : 'done') : '';
        row.r.style.stroke = frac >= 1 && L.bad ? 'var(--bad)' : 'var(--ink)';
      });
      verdict.textContent = T > 2.6 ? 'customer already has the order page' : '';
      if (T > 3) return false;
    });
  },

  /** Decorator: classes needed for every feature combination, inheritance vs wrappers. */
  decCount(k) {
    const { mk, tx, loop } = k;
    tx(120, 26, 'Inheritance', { class: 's-cap', 'text-anchor': 'middle' });
    tx(368, 26, 'Decorators', { class: 's-cap', 'text-anchor': 'middle' });
    mk('line', { x1: 246, y1: 14, x2: 246, y2: 250, stroke: 'var(--line)', 'stroke-width': 2, 'stroke-dasharray': '4 4' });
    const chips = [];
    for (let i = 0; i < 16; i++) {
      const c = mk('rect', { x: 18 + (i % 4) * 54, y: 46 + Math.floor(i / 4) * 44, width: 46, height: 34, rx: 7, fill: 'var(--l2)', stroke: 'var(--ink)', 'stroke-width': 1.5 });
      chips.push(c);
    }
    const W = ['Fetch', 'Log', 'Retry', 'Cache', 'Auth'];
    const wraps = W.map((n, i) => {
      const r = mk('rect', { x: 300, y: 46 + i * 40, width: 136, height: 32, rx: 7, fill: i === 0 ? 'var(--surface)' : 'var(--l1)', stroke: 'var(--ink)', 'stroke-width': 1.5 });
      const t = tx(368, 67 + i * 40, n, { class: 's-mono', 'text-anchor': 'middle' });
      return [r, t];
    });
    const left = tx(120, 276, '', { class: 's-red', 'text-anchor': 'middle' });
    const right = tx(368, 276, '', { class: 's-grn', 'text-anchor': 'middle' });
    loop((T) => {
      const features = T < 2.6 ? 3 : 4, classes = 2 ** features;
      const shown = Math.min(classes, Math.floor(T / 0.15) + 1);
      chips.forEach((c, i) => c.setAttribute('opacity', i < shown ? 1 : 0));
      wraps.forEach(([r, t], i) => { const on = i <= features; r.setAttribute('opacity', on ? 1 : 0); t.setAttribute('opacity', on ? 1 : 0); });
      left.textContent = `${features} features → ${classes} classes`;
      right.textContent = `${features} features → ${features + 1} classes`;
      if (T > 5) return false;
    });
  },

  /** Decorator: a request travels inward through the wrappers. A cache hit turns back before the network. */
  decOnion(k) {
    const { mk, tx, loop, lerp, seg } = k;
    const L = [['LoggingClient', 'var(--surface)'], ['RetryingClient', 'var(--l1)'], ['CachingClient', 'var(--l2)'], ['FetchClient', 'var(--surface-2)']];
    L.forEach(([n, f], i) => {
      box(k, 20 + i * 44, 50 + i * 30, 440 - i * 88, 210 - i * 60, f);
      tx(32 + i * 44, 70 + i * 30, n, { class: 's-mono' });
    });
    const label = tx(240, 30, '', { class: 's-cap', 'text-anchor': 'middle' });
    const net = tx(240, 194, '', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const d = mk('circle', { r: 8, cx: 0, cy: 0, fill: 'var(--amber)', stroke: 'var(--ink)', 'stroke-width': 1.5 });
    const result = tx(240, 284, '', { class: 's-grn', 'text-anchor': 'middle' });
    // Depths: 0 outside, 1 inside Logging, 2 inside Retry, 3 inside Cache, 4 at the network.
    const xAt = (depth) => 6 + depth * 44 + 14;
    loop((T) => {
      const cyc = 5, n = Math.floor(T / cyc) % 2, p = (T % cyc) / cyc, hit = n === 1;
      const deepest = hit ? 3 : 4;
      const goIn = seg(p, 0.05, 0.45), goOut = seg(p, 0.55, 0.9);
      const depth = p < 0.5 ? goIn * deepest : deepest * (1 - goOut);
      d.setAttribute('cx', lerp(xAt(0), xAt(deepest), depth / deepest));
      d.setAttribute('cy', 165);
      label.textContent = hit ? 'Second call: cache hit' : 'First call: cache miss';
      net.textContent = !hit && p > 0.4 && p < 0.6 ? 'GET /prices → network' : hit && p > 0.4 && p < 0.6 ? 'answered from memory' : '';
      result.textContent = p > 0.9 ? (hit ? '0.3 ms · 0 network calls' : '120 ms · 1 network call') : '';
    });
  },
};
