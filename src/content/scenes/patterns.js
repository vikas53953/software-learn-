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
    // With reduced motion the scene is drawn once; pick a moment that shows the result.
    loop((T0) => {
      const T = k.reduced ? 9.8 : T0;
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
  /** Observer: the outbox. Order and event commit together; a worker publishes later. A crash before "mark sent" means a second delivery. */
  obsOutbox(k) {
    const { mk, tx, loop, seg, lerp, token } = k;
    mk('rect', { x: 10, y: 40, width: 240, height: 150, rx: 12, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-dasharray': '6 4' });
    tx(20, 58, 'one transaction', { class: 's-note s-ink' });
    box(k, 22, 70, 104, 104, 'var(--surface)'); tx(74, 90, 'orders', { class: 's-mono', 'text-anchor': 'middle' });
    box(k, 136, 70, 104, 104, 'var(--surface)'); tx(188, 90, 'outbox', { class: 's-mono', 'text-anchor': 'middle' });
    const rowO = mk('rect', { x: 32, y: 104, width: 84, height: 24, rx: 5, fill: 'var(--ok-soft)', stroke: 'var(--ok)', 'stroke-width': 1.5 });
    const rowOt = tx(74, 121, 'order 42', { class: 's-mono', 'text-anchor': 'middle' });
    const rowE = mk('rect', { x: 146, y: 104, width: 84, height: 24, rx: 5, fill: 'var(--ok-soft)', stroke: 'var(--ok)', 'stroke-width': 1.5 });
    const rowEt = tx(188, 121, 'OrderPlaced', { class: 's-mono', 'text-anchor': 'middle' });
    const sent = tx(188, 152, '', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const commit = tx(130, 210, '', { class: 's-grn', 'text-anchor': 'middle' });
    box(k, 300, 70, 100, 40, 'var(--surface-2)'); tx(350, 95, 'worker', { class: 's-mono', 'text-anchor': 'middle' });
    box(k, 290, 160, 180, 40, 'var(--surface)'); tx(380, 185, 'listeners', { class: 's-mono', 'text-anchor': 'middle' });
    const got = tx(380, 222, '', { class: 's-mono', 'text-anchor': 'middle' });
    const crash = tx(380, 246, '', { class: 's-red', 'text-anchor': 'middle' });
    const verdict = tx(240, 270, '', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const ev = token(56, 'var(--amber)'); ev.set('event');
    // With reduced motion the scene is drawn once; pick a moment that shows the result.
    loop((T0) => {
      const T = k.reduced ? 11.9 : T0;
      const t = T % 12, crashed = t >= 6, u = crashed ? t - 6 : t;
      const rows = seg(u, 0.3, 0.9);
      [rowO, rowOt, rowE, rowEt].forEach((e) => e.setAttribute('opacity', rows));
      commit.textContent = u > 0.9 ? 'COMMIT: both rows or neither' : '';
      // the worker picks the row up, then publishes it
      const a = seg(u, 1.4, 2.2), b = seg(u, 2.4, 3.2), b2 = seg(u, 4.2, 5);
      let x = lerp(160, 322, a), y = lerp(116, 52, a), o = u > 1.4 && u < 3.3 ? 1 : 0;
      if (u >= 2.4) { x = lerp(322, 352, b); y = lerp(52, 140, b); }
      if (crashed && u >= 4.2) { x = lerp(322, 352, b2); y = lerp(52, 140, b2); o = u < 5.1 ? 1 : 0; }
      ev.at(x, y, o);
      const deliveries = (u > 3.2 ? 1 : 0) + (crashed && u > 5 ? 1 : 0);
      got.textContent = deliveries ? `OrderPlaced received: ${deliveries}` : '';
      got.style.fill = deliveries > 1 ? 'var(--bad)' : 'var(--ink)';
      crash.textContent = crashed && u > 3.3 && u < 4.2 ? '✗ crash before "mark sent"' : crashed && u >= 4.2 && u < 5.1 ? 'restart: row still unsent' : '';
      sent.textContent = !crashed && u > 3.6 ? 'sent ✓' : '';
      verdict.textContent = crashed && u > 5.2 ? 'at least once: listeners must handle a repeat' : !crashed && u > 3.6 ? 'nothing lost, even if the app dies after COMMIT' : '';
    });
  },

  /** Observer: an idempotent listener. The same event arrives twice; the second insert conflicts and is skipped. */
  obsIdem(k) {
    const { tx, loop, seg, lerp, token } = k;
    tx(240, 24, 'The same event is delivered twice', { class: 's-cap', 'text-anchor': 'middle' });
    box(k, 170, 90, 130, 56, 'var(--surface)'); tx(235, 114, 'awardPoints()', { class: 's-mono', 'text-anchor': 'middle' }); tx(235, 132, 'listener', { class: 's-note s-ink', 'text-anchor': 'middle' });
    box(k, 340, 70, 130, 96, 'var(--surface)'); tx(405, 90, 'handled_events', { class: 's-mono', 'text-anchor': 'middle' });
    const row = k.mk('rect', { x: 352, y: 104, width: 106, height: 24, rx: 5, fill: 'var(--ok-soft)', stroke: 'var(--ok)', 'stroke-width': 1.5 });
    const rowT = tx(405, 121, 'evt 7f3', { class: 's-mono', 'text-anchor': 'middle' });
    const rowNote = tx(405, 152, '', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const pts = tx(235, 200, '', { class: 's-big', 'text-anchor': 'middle' });
    tx(235, 222, 'loyalty points', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const verdict = tx(240, 272, '', { class: 's-grn', 'text-anchor': 'middle' });
    const a = token(64, 'var(--amber)'); a.set('evt 7f3');
    const b = token(64, 'var(--amber)'); b.set('evt 7f3');
    loop((T) => {
      const p1 = seg(T, 0.4, 1.3), p2 = seg(T, 2.6, 3.5);
      a.at(lerp(10, 170, p1), 118, T < 1.4 ? 1 : 0);
      b.at(lerp(10, 170, p2), 118, T > 2.4 && T < 3.6 ? 1 : 0);
      const first = T > 1.4, second = T > 3.6;
      row.setAttribute('opacity', first ? 1 : 0); rowT.setAttribute('opacity', first ? 1 : 0);
      row.style.fill = second && T < 4.6 ? 'var(--warn-soft)' : 'var(--ok-soft)';
      row.style.stroke = second && T < 4.6 ? 'var(--warn)' : 'var(--ok)';
      rowNote.textContent = second ? 'conflict: skip' : first ? 'inserted' : '';
      pts.textContent = first ? '+10' : '0';
      verdict.textContent = second ? 'delivered twice, awarded once' : '';
      if (T > 5) return false;
    });
  },

  /** Decorator: Express middleware. A request runs down the stack and the response comes back up; rate limiting can stop it early. */
  decMiddleware(k) {
    const { tx, loop, seg, lerp, token } = k;
    const L = ['requestLogger', 'rateLimit', 'authenticate', 'listOrders'];
    L.forEach((n, i) => { box(k, 14 + i * 116, 96, 104, 60, i === 3 ? 'var(--l2)' : 'var(--surface)'); tx(66 + i * 116, 131, n, { class: 's-mono', 'text-anchor': 'middle' }); });
    tx(20, 58, 'request →', { class: 's-note s-ink' });
    tx(460, 206, '← response', { class: 's-note s-ink', 'text-anchor': 'end' });
    const label = tx(240, 30, '', { class: 's-cap', 'text-anchor': 'middle' });
    const res = tx(240, 240, '', { class: 's-mono', 'text-anchor': 'middle' });
    const req = token(48, 'var(--amber)'); req.set('GET');
    // With reduced motion the scene is drawn once; pick a moment that shows the result.
    loop((T0) => {
      const T = k.reduced ? 5.5 : T0;
      const t = T % 12, limited = t >= 6, u = limited ? t - 6 : t;
      label.textContent = limited ? 'Over the limit: 429, auth never runs' : 'Normal request: down the stack and back';
      const deepest = limited ? 1 : 3;
      const go = seg(u, 0.3, 2.3), back = seg(u, 2.8, 4.8);
      const at = (d) => 42 + d * 116;
      if (u < 2.6) { req.set('GET'); req.at(lerp(at(0), at(deepest), go), 76, 1); }
      else { req.set(limited ? '429' : '200'); req.at(lerp(at(deepest), at(0), back), 176, u < 5 ? 1 : 0); }
      res.textContent = u > 4.8 ? (limited ? 'logger still logs the 429' : 'logger records the 200 and the time taken') : '';
      res.style.fill = limited ? 'var(--bad)' : 'var(--ok)';
    });
  },

  /** Decorator vs proxy vs adapter: what each wrapper's outside looks like compared with its inside. */
  decCompare(k) {
    const { tx, loop, seg } = k;
    k.defs();
    const ROWS = [
      ['Decorator', 'RetryingClient', 'HttpClient', 'FetchClient', 'HttpClient', 'adds behaviour'],
      ['Proxy', 'LazyImage', 'Image', 'RealImage', 'Image', 'controls access'],
      ['Adapter', 'StripeAdapter', 'PaymentMethod', 'Stripe SDK', 'charges.create', 'translates'],
    ];
    const parts = ROWS.map(([name, outer, oi, inner, ii, job], r) => {
      const y = 22 + r * 92, same = oi === ii, g = k.mk('g');
      tx(14, y + 14, name, { class: 's-lbl' }, g);
      tx(466, y + 14, job, { class: 's-note s-ink', 'text-anchor': 'end' }, g);
      k.mk('rect', { x: 14, y: y + 24, width: 196, height: 52, rx: 10, fill: 'var(--l1)', stroke: 'var(--ink)', 'stroke-width': 2 }, g);
      tx(112, y + 46, outer, { class: 's-mono', 'text-anchor': 'middle' }, g);
      tx(112, y + 64, `implements ${oi}`, { class: 's-note s-ink', 'text-anchor': 'middle' }, g);
      k.mk('path', { d: `M214,${y + 50} L252,${y + 50}`, stroke: 'var(--ink)', 'stroke-width': 2, 'marker-end': 'url(#arI)' }, g);
      k.mk('rect', { x: 260, y: y + 24, width: 206, height: 52, rx: 10, fill: 'var(--surface-2)', stroke: same ? 'var(--ok)' : 'var(--amber)', 'stroke-width': 2 }, g);
      tx(363, y + 46, inner, { class: 's-mono', 'text-anchor': 'middle' }, g);
      tx(363, y + 64, same ? `same: ${ii}` : `different: ${ii}`, { class: same ? 's-grn' : 's-note s-ink', 'text-anchor': 'middle' }, g);
      return g;
    });
    loop((T) => {
      parts.forEach((g, r) => g.setAttribute('opacity', seg(T, 0.2 + r * 0.6, 0.6 + r * 0.6)));
      if (T > 2.2) return false;
    });
  },

  /** Decorator: the same two wrappers in either order. One call fails twice, then succeeds; count the log lines. */
  decOrder(k) {
    const { mk, tx, loop } = k;
    const COLS = [
      [10, 'Logging outside Retry', ['LoggingClient', 'RetryingClient', 'FetchClient'], false],
      [250, 'Retry outside Logging', ['RetryingClient', 'LoggingClient', 'FetchClient'], true],
    ];
    const TRIES = [[0.6, false], [1.4, false], [2.2, true]];
    const cols = COLS.map(([x0, title, layers, perTry]) => {
      tx(x0 + 110, 22, title, { class: 's-lbl', 'text-anchor': 'middle' });
      layers.forEach((n, i) => {
        mk('rect', { x: x0 + i * 10, y: 34 + i * 38, width: 220 - i * 20, height: 32, rx: 8, fill: n === 'LoggingClient' ? 'var(--amber-soft)' : n === 'FetchClient' ? 'var(--surface-2)' : 'var(--l1)', stroke: 'var(--ink)', 'stroke-width': 1.8 });
        tx(x0 + 110, 55 + i * 38, n, { class: 's-mono', 'text-anchor': 'middle' });
      });
      const tries = TRIES.map(([, ok], i) => {
        const g = mk('g');
        mk('rect', { x: x0 + 4 + i * 72, y: 154, width: 66, height: 24, rx: 12, fill: ok ? 'var(--ok-soft)' : 'var(--bad-soft)', stroke: ok ? 'var(--ok)' : 'var(--bad)', 'stroke-width': 1.5 }, g);
        tx(x0 + 37 + i * 72, 170, `try ${i + 1} ${ok ? '✓' : '✗'}`, { class: 's-mono', 'text-anchor': 'middle' }, g);
        return g;
      });
      const logs = (perTry ? ['GET /prices timeout', 'GET /prices timeout', 'GET /prices 200'] : ['GET /prices 200']).map((t, i) => tx(x0 + 8, 204 + i * 20, t, { class: 's-mono' }));
      const count = tx(x0 + 110, 286, '', { class: perTry ? 's-red' : 's-grn', 'text-anchor': 'middle' });
      return { tries, logs, count, perTry };
    });
    mk('line', { x1: 240, y1: 10, x2: 240, y2: 292, stroke: 'var(--line)', 'stroke-width': 2, 'stroke-dasharray': '4 4' });
    loop((T0) => {
      const T = k.reduced ? 4 : T0 % 7;
      cols.forEach(({ tries, logs, count, perTry }) => {
        tries.forEach((g, i) => g.setAttribute('opacity', T > TRIES[i][0] ? 1 : 0));
        const shown = perTry ? TRIES.filter(([at]) => T > at + 0.2).length : (T > 2.6 ? 1 : 0);
        logs.forEach((l, i) => l.setAttribute('opacity', i < shown ? 1 : 0));
        count.textContent = `log lines: ${shown}`;
      });
    });
  },
};

