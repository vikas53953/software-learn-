// Animated scenes for Module 5 (Concurrency). Each takes the scene toolkit (k) and the step context (ctx).
// Everything stays inside the 480×300 box; colours change only through el.style. Numbers are illustrative.

const box = (k, x, y, w, h, fill, extra = {}, p) => k.mk('rect', { x, y, width: w, height: h, rx: 10, fill, stroke: 'var(--ink)', 'stroke-width': 2, ...extra }, p);
const clamp = (v) => Math.min(1, Math.max(0, v));
const chip = (k, x, y, w, text, fill, p) => {
  const g = k.mk('g', {}, p);
  k.mk('rect', { x, y, width: w, height: 26, rx: 13, fill, stroke: 'var(--ink)', 'stroke-width': 1.4 }, g);
  k.tx(x + w / 2, y + 17, text, { class: 's-mono', 'text-anchor': 'middle' }, g);
  return g;
};

// Race: what each request does, in time order. [ms, lane, text, tone]
const RACE = [[0, 0, 'SELECT → null', 'warn'], [1, 1, 'SELECT → null', 'warn'], [3, 0, "UPDATE 'asha'", 'bad'], [4, 1, "UPDATE 'ben'", 'bad'], [6, 0, 'email: you got 14C', 'bad'], [7, 1, 'email: you got 14C', 'bad']];

export const scenes = {
  /** Race: two requests interleave their read, write and email; the second write overwrites the first. */
  raceTimeline(k) {
    const { mk, tx, loop } = k;
    tx(14, 26, 'Request A (Asha)', { class: 's-lbl' });
    tx(14, 136, 'Request B (Ben)', { class: 's-lbl' });
    [56, 166].forEach((y) => mk('line', { x1: 14, y1: y + 13, x2: 466, y2: y + 13, stroke: 'var(--line-strong)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
    const items = RACE.map(([ms, lane, t, tone]) => chip(k, 14 + ms * 40, lane ? 166 : 56, Math.min(150, t.length * 7.6 + 16), t, tone === 'warn' ? 'var(--amber-soft)' : 'var(--bad-soft)'));
    const ms = tx(466, 26, '', { class: 's-mono', 'text-anchor': 'end' });
    const row = tx(240, 252, '', { class: 's-cap', 'text-anchor': 'middle' });
    const why = tx(240, 278, '', { class: 's-red', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 99 : (T % 11) * 1.4; // 1.4 "ms" per second of animation
      items.forEach((g, i) => g.setAttribute('opacity', t >= RACE[i][0] ? 1 : 0));
      ms.textContent = `t = ${Math.min(7, Math.floor(t))} ms`;
      row.textContent = t >= 4 ? "seats row 14C: holder = 'ben'" : t >= 3 ? "seats row 14C: holder = 'asha'" : 'seats row 14C: holder = null';
      why.textContent = t >= 7 ? 'two confirmation emails, one seat' : t >= 1 ? 'both checks passed before either write' : '';
    });
  },

  /** Race: sequential tests never see it; concurrent load does. Revealed after the prediction. */
  raceStress(k, ctx) {
    const { mk, tx, loop } = k;
    const lane = (y, title) => { tx(14, y - 10, title, { class: 's-lbl' }); return Array.from({ length: 50 }, (_, i) => mk('rect', { x: 14 + (i % 25) * 18, y: y + Math.floor(i / 25) * 18, width: 14, height: 14, rx: 3, fill: 'var(--surface-3)' })); };
    const seq = lane(40, 'Test suite: one booking at a time');
    const par = lane(150, 'Launch day: 50 bookings at once');
    const r1 = tx(240, 94, '', { class: 's-grn', 'text-anchor': 'middle' });
    const r2 = tx(240, 204, '', { class: 's-red', 'text-anchor': 'middle' });
    const cap = tx(240, 262, 'Same code. Guess first, then watch.', { class: 's-cap', 'text-anchor': 'middle' });
    const BAD = new Set([3, 8, 9, 17, 22, 30, 31, 41]); // illustrative
    ctx.api.reveal = () => loop((T) => {
      const n = k.reduced ? 50 : Math.min(50, Math.floor(T * 25));
      seq.forEach((c, i) => { c.style.fill = i < n ? 'var(--ok)' : 'var(--surface-3)'; });
      par.forEach((c, i) => { c.style.fill = T > 0.6 || k.reduced ? (BAD.has(i) ? 'var(--bad)' : 'var(--ok)') : 'var(--surface-3)'; });
      if (n >= 50) { r1.textContent = '0 double bookings, every run'; r2.textContent = '8 double bookings (illustrative)'; cap.textContent = 'The bug needs overlap, and tests rarely overlap.'; return false; }
    });
    if (ctx.answered) ctx.api.reveal();
  },

  /** Race: what each isolation level does with the two bookings (PostgreSQL). */
  raceIso(k) {
    const { tx, loop } = k;
    const R = [
      ['READ COMMITTED', 'the default', "B's UPDATE waits, then overwrites", 'var(--bad-soft)'],
      ['REPEATABLE READ', '', 'B fails: could not serialize access', 'var(--amber-soft)'],
      ['SERIALIZABLE', '', 'one fails with a serialization error', 'var(--amber-soft)'],
    ];
    tx(240, 24, 'Both requests in a transaction, same code', { class: 's-cap', 'text-anchor': 'middle' });
    const rows = R.map(([lvl, sub, out, f], i) => {
      const y = 44 + i * 70, g = k.mk('g');
      box(k, 14, y, 160, 56, 'var(--surface)', {}, g);
      tx(94, y + 25, lvl, { class: 's-mono', 'text-anchor': 'middle' }, g);
      if (sub) tx(94, y + 43, sub, { class: 's-note s-ink', 'text-anchor': 'middle' }, g);
      box(k, 186, y, 280, 56, f, {}, g);
      tx(326, y + 33, out, { class: 's-mono', 'text-anchor': 'middle' }, g);
      return g;
    });
    const n = tx(240, 278, 'Stricter levels fail loudly, so you can retry.', { class: 's-note s-ink', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 9 : T;
      rows.forEach((g, i) => g.setAttribute('opacity', clamp((t - i * 0.6) / 0.4)));
      n.setAttribute('opacity', clamp((t - 2) / 0.4));
      if (t > 2.5) return false;
    });
  },

  /** Deadlock: the wait-for graph closes into a cycle, and the four conditions light up. */
  dlGraph(k) {
    const { mk, tx, loop } = k;
    k.defs();
    const node = (x, y, t, s) => { box(k, x - 60, y - 26, 120, 52, 'var(--bad-soft)'); tx(x, y - 2, t, { class: 's-monob', 'text-anchor': 'middle' }); tx(x, y + 16, s, { class: 's-note s-ink', 'text-anchor': 'middle' }); };
    node(90, 70, 'Transfer 1', 'holds 7'); node(90, 230, 'Transfer 2', 'holds 9');
    const e1 = mk('path', { d: 'M120,96 C170,130 170,170 120,204', fill: 'none', stroke: 'var(--bad)', 'stroke-width': 2.5, 'marker-end': 'url(#arI)' });
    const e2 = mk('path', { d: 'M60,204 C10,170 10,130 60,96', fill: 'none', stroke: 'var(--bad)', 'stroke-width': 2.5, 'marker-end': 'url(#arI)' });
    const l1 = tx(90, 148, 'each waits', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const l2 = tx(90, 164, 'for the other', { class: 's-note s-ink', 'text-anchor': 'middle' });
    tx(232, 30, 'A deadlock needs all four:', { class: 's-lbl' });
    const C = ['mutual exclusion', 'hold and wait', 'no preemption', 'circular wait'];
    const cs = C.map((c, i) => chip(k, 232, 46 + i * 44, 234, c, 'var(--surface-2)'));
    const cap = tx(240, 278, 'Break any one, and it cannot happen.', { class: 's-cap', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 9 : T;
      [e1, l1].forEach((e) => e.setAttribute('opacity', clamp((t - 0.3) / 0.4)));
      [e2, l2].forEach((e) => e.setAttribute('opacity', clamp((t - 0.9) / 0.4)));
      cs.forEach((g, i) => { g.setAttribute('opacity', clamp((t - 1.5 - i * 0.4) / 0.3)); g.firstChild.style.fill = i === 3 ? 'var(--bad-soft)' : 'var(--amber-soft)'; });
      cap.setAttribute('opacity', clamp((t - 3.4) / 0.4));
      if (t > 4) return false;
    });
  },

  /** Deadlock: the database notices the cycle, aborts one transaction, and the retry succeeds. */
  dlDetect(k) {
    const { mk, tx, loop } = k;
    const X = (s) => 110 + s * 140; // seconds on the time axis
    tx(14, 74, 'Transfer 1', { class: 's-lbl' }); tx(14, 164, 'Transfer 2', { class: 's-lbl' });
    mk('line', { x1: X(0), y1: 236, x2: X(2.5), y2: 236, stroke: 'var(--ink)', 'stroke-width': 1.5 });
    [0, 1, 2].forEach((s) => tx(X(s), 254, `${s} s`, { class: 's-note s-ink', 'text-anchor': 'middle' }));
    const bar = (y, s0, s1, f, t) => { const g = mk('g'); mk('rect', { x: X(s0), y, width: X(s1) - X(s0), height: 30, rx: 6, fill: f, stroke: 'var(--ink)', 'stroke-width': 1.2 }, g); tx((X(s0) + X(s1)) / 2, y + 20, t, { class: 's-mono', 'text-anchor': 'middle' }, g); return [g, s0]; };
    const bars = [
      bar(54, 0, 1, 'var(--amber-soft)', 'waits for 9'), bar(144, 0, 1, 'var(--amber-soft)', 'waits for 7'),
      bar(144, 1, 1.25, 'var(--bad)', ''), bar(54, 1.05, 1.5, 'var(--ok-soft)', 'done'),
      bar(144, 1.6, 2.3, 'var(--ok-soft)', 'retry: done'),
    ];
    const err = tx(X(1) + 6, 196, 'deadlock detected: aborted', { class: 's-red' });
    const cap = tx(240, 284, 'Postgres checks after deadlock_timeout (1 s by default)', { class: 's-note s-ink', 'text-anchor': 'middle' });
    loop((T) => {
      const s = k.reduced ? 9 : (T % 7) * 0.6;
      bars.forEach(([g, s0]) => g.setAttribute('opacity', s >= s0 ? 1 : 0));
      err.setAttribute('opacity', s >= 1 ? 1 : 0);
      cap.setAttribute('opacity', s >= 1 ? 1 : 0.4);
    });
  },

  /** Event loop: a board driven by the step's `ev` data (stack, timers, queues, console). */
  elState(k, ctx) {
    const { tx, loop } = k;
    const ev = ctx.step.ev || {};
    const panel = (x, y, w, h, title, items, fill, hl) => {
      box(k, x, y, w, h, hl ? 'var(--amber-soft)' : 'var(--surface)', { 'stroke-width': hl ? 2.6 : 1.8 });
      tx(x + 10, y + 20, title, { class: 's-lbl' });
      return (items || []).map((t, i) => chip(k, x + 10 + i * 74, y + h - 36, 66, t, fill));
    };
    const all = [
      ...panel(14, 14, 150, 200, 'Call stack', [], '', ev.hl === 'stack'),
      ...panel(178, 14, 288, 62, 'Timers and I/O', ev.apis, 'var(--surface-2)', ev.hl === 'apis'),
      ...panel(178, 90, 288, 62, 'Microtask queue', ev.micro, 'var(--violet-soft)', ev.hl === 'micro'),
      ...panel(178, 166, 288, 62, 'Task queue', ev.macro, 'var(--accent-soft)', ev.hl === 'macro'),
    ];
    (ev.stack || []).forEach((t, i) => all.push(chip(k, 24, 178 - i * 34, 130, t, 'var(--l2)')));
    box(k, 14, 240, 452, 46, 'var(--code-bg)');
    tx(28, 268, 'console:', { class: 's-code' });
    const out = tx(104, 268, '', { class: 's-code' });
    out.style.fontSize = '15px';
    loop((T) => {
      const t = k.reduced ? 9 : T;
      all.forEach((g, i) => g.setAttribute('opacity', clamp((t - 0.2 - i * 0.15) / 0.3)));
      const full = ev.out || '', prev = ev.prev || '';
      out.textContent = t > 0.6 ? full : prev;
      if (t > 1.5) return false;
    });
  },

  /** Event loop: one 2-second synchronous job delays every request queued behind it. */
  elBlock(k) {
    const { mk, tx, loop } = k;
    const X = (ms) => 40 + ms * 0.15; // 0..2400 ms
    tx(14, 24, 'One Node.js process, requests over time', { class: 's-lbl' });
    mk('line', { x1: X(0), y1: 218, x2: X(2400), y2: 218, stroke: 'var(--ink)', 'stroke-width': 1.5 });
    [0, 1000, 2000].forEach((m) => tx(X(m), 236, `${m / 1000} s`, { class: 's-note s-ink', 'text-anchor': 'middle' }));
    mk('rect', { x: X(100), y: 40, width: X(2100) - X(100), height: 34, rx: 6, fill: 'none', stroke: 'var(--bad)', 'stroke-width': 1.2, 'stroke-dasharray': '4 4' });
    const hog = mk('rect', { x: X(100), y: 40, width: 0, height: 34, rx: 6, fill: 'var(--bad-soft)', stroke: 'var(--bad)', 'stroke-width': 1.6 });
    tx(X(100) + 8, 62, 'hash a 50 MB upload (sync, 2 s)', { class: 's-mono' });
    const reqs = [300, 600, 900, 1300, 1700].map((a, i) => {
      const y = 92 + i * 24, g = mk('g');
      mk('circle', { cx: X(a), cy: y, r: 5, fill: 'var(--accent)' }, g);
      const w = mk('line', { x1: X(a), y1: y, x2: X(a), y2: y, stroke: 'var(--bad)', 'stroke-width': 3 }, g);
      const t = tx(X(2120) + 8, y + 4, '', { class: 's-red' }, g);
      return { g, a, w, t, y };
    });
    const cap = tx(240, 270, '', { class: 's-cap', 'text-anchor': 'middle' });
    loop((T) => {
      const ms = k.reduced ? 2400 : Math.min(2400, (T % 8) * 500);
      hog.setAttribute('width', Math.max(0, X(Math.min(ms, 2100)) - X(100)));
      reqs.forEach(({ g, a, w, t }) => {
        g.setAttribute('opacity', ms >= a ? 1 : 0);
        w.setAttribute('x2', X(Math.min(Math.max(ms, a), 2100)));
        t.textContent = ms >= 2100 ? `+${2100 - a} ms` : '';
      });
      cap.textContent = ms >= 2100 ? 'Each quick request waited for the slow one.' : 'The stack never empties, so nothing else runs.';
    });
  },

  /** Event loop: the same job on a worker thread; the main thread keeps serving. */
  elOffload(k) {
    const { mk, tx, loop } = k;
    k.defs();
    box(k, 14, 40, 452, 70, 'var(--ok-soft)');
    tx(26, 62, 'Main thread: event loop', { class: 's-lbl' });
    box(k, 14, 170, 452, 60, 'var(--violet-soft)');
    tx(26, 192, 'Worker thread', { class: 's-lbl' });
    const job = mk('rect', { x: 120, y: 202, width: 0, height: 20, rx: 5, fill: 'var(--violet)', opacity: 0.6 });
    mk('path', { d: 'M110,112 L110,166', stroke: 'var(--ink)', 'stroke-width': 1.8, 'marker-end': 'url(#arI)' });
    tx(118, 144, 'postMessage(file)', { class: 's-note s-ink' });
    const back = mk('path', { d: 'M440,168 L440,114', stroke: 'var(--ink)', 'stroke-width': 1.8, 'marker-end': 'url(#arI)' });
    const backT = tx(432, 144, 'result', { class: 's-note s-ink', 'text-anchor': 'end' });
    const dots = Array.from({ length: 14 }, (_, i) => mk('circle', { cx: 40 + i * 30, cy: 90, r: 6, fill: 'var(--accent)' }));
    const cap = tx(240, 274, 'Requests keep flowing while the hash runs elsewhere.', { class: 's-cap', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 9 : T % 6;
      job.setAttribute('width', 320 * clamp(t / 4));
      [back, backT].forEach((e) => e.setAttribute('opacity', t >= 4 ? 1 : 0));
      dots.forEach((d, i) => d.setAttribute('opacity', t >= i * 0.3 ? 1 : 0));
      cap.setAttribute('opacity', clamp((t - 1) / 0.5));
    });
  },
};
