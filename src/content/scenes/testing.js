// Animated scenes for Module 3 (Test Doubles, TDD). Each takes the scene toolkit (k) and the step context (ctx).
// Everything stays inside the 480×300 box; colours change only through el.style.

const box = (k, x, y, w, h, fill, extra = {}, p) => k.mk('rect', { x, y, width: w, height: h, rx: 10, fill, stroke: 'var(--ink)', 'stroke-width': 2.2, ...extra }, p);
const chip = (k, x, y, ok) => {
  const c = k.mk('circle', { cx: x, cy: y, r: 8, fill: ok === null ? 'var(--surface-3)' : ok ? 'var(--ok)' : 'var(--bad)', stroke: 'var(--ink)', 'stroke-width': 1.2 });
  const t = k.tx(x, y + 3.5, ok === null ? '' : ok ? '✓' : '✗', { class: 's-white', 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700 });
  return [c, t];
};

/** Lines of code with their leading spaces turned into an x offset, because SVG collapses spaces. */
function code(k, x, y, lines, p) {
  return lines.map((ln, i) => {
    const pad = ln.length - ln.trimStart().length;
    return k.tx(x + pad * 6.6, y + i * 17, ln.trimStart(), { class: 's-code' }, p);
  });
}

// Five runs of the same "real collaborators" test. Illustrative outcomes.
const RUNS = [
  [true, '3.6 s', ''], [true, '3.9 s', ''], [false, '30 s', 'captcha timed out'], [true, '3.7 s', ''], [false, '3.8 s', 'trial date off by a day'],
];

export const scenes = {
  /** Doubles: the same test, run five times against real systems, sometimes fails for reasons unrelated to the code. */
  dblFlaky(k) {
    const { tx, loop, seg } = k;
    tx(240, 24, 'Same code, same test, five runs', { class: 's-cap', 'text-anchor': 'middle' });
    const rows = RUNS.map(([ok, ms, why], i) => {
      const y = 50 + i * 42, g = k.mk('g');
      box(k, 20, y, 440, 34, 'var(--surface)', { rx: 8 }, g);
      tx(36, y + 22, `run ${i + 1}`, { class: 's-mono' }, g);
      const c = k.mk('circle', { cx: 110, cy: y + 17, r: 9, fill: ok ? 'var(--ok)' : 'var(--bad)', stroke: 'var(--ink)', 'stroke-width': 1.2 }, g);
      tx(110, y + 21, ok ? '✓' : '✗', { class: 's-white', 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700 }, g);
      tx(136, y + 22, ms, { class: 's-mono' }, g);
      tx(200, y + 22, why, { class: 's-red' }, g);
      return { g, c };
    });
    const verdict = tx(240, 284, '2 of 5 red, and the code never changed', { class: 's-red', 'text-anchor': 'middle' });
    loop((T) => {
      rows.forEach(({ g }, i) => g.setAttribute('opacity', seg(T, 0.3 + i * 0.5, 0.6 + i * 0.5)));
      verdict.setAttribute('opacity', seg(T, 2.9, 3.3));
      if (T > 3.4) return false;
    });
  },

  /** Doubles: queries come in (stub or fake them), commands go out (spy on or mock them). */
  dblInOut(k) {
    const { mk, tx, loop } = k;
    k.defs();
    box(k, 170, 112, 140, 56, 'var(--l2)');
    tx(240, 137, 'SignupService', { class: 's-mono', 'text-anchor': 'middle' });
    tx(240, 155, 'your code', { class: 's-note s-ink', 'text-anchor': 'middle' });
    tx(80, 30, 'QUERIES: it asks', { class: 's-lbl', 'text-anchor': 'middle' });
    tx(400, 30, 'COMMANDS: it tells', { class: 's-lbl', 'text-anchor': 'middle' });
    const IN = [['clock.now()', 'stub'], ['captcha.verify()', 'stub'], ['users.find()', 'fake']];
    const ins = IN.map(([n, d], i) => {
      const y = 56 + i * 76;
      box(k, 14, y, 132, 46, 'var(--amber-soft)');
      tx(80, y + 20, n, { class: 's-mono', 'text-anchor': 'middle' });
      tx(80, y + 37, d, { class: 's-note s-ink', 'text-anchor': 'middle' });
      mk('path', { d: `M148,${y + 23} L166,${140 + (i - 1) * 12}`, stroke: 'var(--ink)', 'stroke-width': 1.6, 'marker-end': 'url(#arI)' });
      return mk('circle', { r: 5, cx: 148, cy: y + 23, fill: 'var(--amber)', stroke: 'var(--ink)', 'stroke-width': 1 });
    });
    box(k, 334, 110, 132, 60, 'var(--violet-soft)');
    tx(400, 134, 'mailer.send()', { class: 's-mono', 'text-anchor': 'middle' });
    tx(400, 152, 'spy or mock', { class: 's-note s-ink', 'text-anchor': 'middle' });
    mk('path', { d: 'M312,140 L330,140', stroke: 'var(--ink)', 'stroke-width': 1.6, 'marker-end': 'url(#arI)' });
    const out = mk('circle', { r: 5, cx: 312, cy: 140, fill: 'var(--accent)', stroke: 'var(--ink)', 'stroke-width': 1 });
    tx(80, 286, 'check the result', { class: 's-note s-ink', 'text-anchor': 'middle' });
    tx(400, 286, 'check the call', { class: 's-note s-ink', 'text-anchor': 'middle' });
    loop((T) => {
      const t = T % 3;
      ins.forEach((c, i) => {
        const p = Math.min(1, Math.max(0, (t - i * 0.25) / 0.9)), y0 = 56 + i * 76 + 23, y1 = 140 + (i - 1) * 12;
        c.setAttribute('cx', 148 + 18 * p); c.setAttribute('cy', y0 + (y1 - y0) * p); c.setAttribute('opacity', p > 0 && p < 1 ? 1 : 0);
      });
      const q = Math.min(1, Math.max(0, (t - 1.4) / 0.6));
      out.setAttribute('cx', 312 + 18 * q); out.setAttribute('opacity', q > 0 && q < 1 ? 1 : 0);
    });
  },

  /** Doubles: a test that mocks every internal call goes red on a refactor that changes no behaviour. */
  dblOverMock(k) {
    const { tx, loop } = k;
    tx(120, 24, 'Mocks the edges', { class: 's-lbl', 'text-anchor': 'middle' });
    tx(360, 24, 'Mocks every class', { class: 's-lbl', 'text-anchor': 'middle' });
    k.mk('line', { x1: 240, y1: 12, x2: 240, y2: 250, stroke: 'var(--line)', 'stroke-width': 2, 'stroke-dasharray': '4 4' });
    const banner = tx(240, 280, '', { class: 's-cap', 'text-anchor': 'middle' });
    const side = (x0) => {
      const a = box(k, x0 + 10, 50, 200, 40, 'var(--surface)'); tx(x0 + 110, 75, 'signUp()', { class: 's-mono', 'text-anchor': 'middle' });
      const b = box(k, x0 + 10, 110, 96, 40, 'var(--surface)'); const bt = tx(x0 + 58, 135, 'Validator', { class: 's-mono', 'text-anchor': 'middle' });
      const c = box(k, x0 + 114, 110, 96, 40, 'var(--surface)'); tx(x0 + 162, 135, 'Pricing', { class: 's-mono', 'text-anchor': 'middle' });
      const d = box(k, x0 + 10, 170, 200, 40, 'var(--amber-soft)'); tx(x0 + 110, 195, 'mailer (double)', { class: 's-mono', 'text-anchor': 'middle' });
      const res = tx(x0 + 110, 236, '', { class: 's-mono', 'text-anchor': 'middle' });
      return { a, b, bt, c, d, res };
    };
    const L = side(0), R = side(240);
    [R.b, R.c].forEach((r) => { r.style.fill = 'var(--amber-soft)'; });
    loop((T) => {
      const t = k.reduced ? 6 : T % 8, refactored = t > 3.5; // reduced motion: show the result
      for (const S of [L, R]) S.bt.textContent = refactored ? 'Rules' : 'Validator';
      L.res.textContent = '12 tests ✓'; L.res.style.fill = 'var(--ok)';
      R.res.textContent = refactored ? '9 of 12 tests ✗' : '12 tests ✓'; R.res.style.fill = refactored ? 'var(--bad)' : 'var(--ok)';
      R.b.style.stroke = refactored ? 'var(--bad)' : 'var(--ink)';
      banner.textContent = refactored ? 'Validator renamed to Rules. Behaviour unchanged.' : 'Before the refactor';
    });
  },

  /** Doubles: wrap the vendor SDK in your own interface; mock yours, integration-test the adapter against the vendor's sandbox. */
  dblOwn(k) {
    const { mk, tx, loop } = k;
    k.defs();
    const B = [[16, 'checkout.ts', 'your code', 'var(--l2)'], [176, 'PaymentGateway', 'your interface', 'var(--violet-soft)'], [336, 'Stripe SDK', 'not yours', 'var(--surface-3)']];
    B.forEach(([x, a, b, f]) => { box(k, x, 110, 128, 52, f); tx(x + 64, 133, a, { class: 's-mono', 'text-anchor': 'middle' }); tx(x + 64, 151, b, { class: 's-note s-ink', 'text-anchor': 'middle' }); });
    mk('path', { d: 'M146,136 L170,136', stroke: 'var(--ink)', 'stroke-width': 2, 'marker-end': 'url(#arI)' });
    mk('path', { d: 'M306,136 L330,136', stroke: 'var(--ink)', 'stroke-width': 2, 'marker-end': 'url(#arI)' });
    tx(318, 100, 'adapter', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const u = mk('g');
    mk('rect', { x: 16, y: 34, width: 288, height: 44, rx: 10, fill: 'var(--ok-soft)', stroke: 'var(--ok)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, u);
    tx(160, 54, 'unit tests mock PaymentGateway', { class: 's-mono', 'text-anchor': 'middle' }, u);
    tx(160, 70, 'fast, run on every save', { class: 's-note s-ink', 'text-anchor': 'middle' }, u);
    const it = mk('g');
    mk('rect', { x: 176, y: 196, width: 288, height: 44, rx: 10, fill: 'var(--amber-soft)', stroke: 'var(--amber)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, it);
    tx(320, 216, 'a few adapter tests vs the sandbox', { class: 's-mono', 'text-anchor': 'middle' }, it);
    tx(320, 232, 'slow, run in CI', { class: 's-note s-ink', 'text-anchor': 'middle' }, it);
    const note = tx(240, 284, 'never mock Stripe itself: you would be testing your guess about it', { class: 's-red', 'text-anchor': 'middle' });
    loop((T) => {
      u.setAttribute('opacity', Math.min(1, T / 0.6));
      it.setAttribute('opacity', Math.min(1, Math.max(0, (T - 0.9) / 0.6)));
      note.setAttribute('opacity', Math.min(1, Math.max(0, (T - 1.8) / 0.6)));
      if (T > 2.5) return false;
    });
  },

  /** Doubles: one contract suite runs against the fake and the real repository; a drifting fake is caught. */
  dblContract(k) {
    const { tx, loop } = k;
    tx(240, 24, 'One suite, two implementations', { class: 's-cap', 'text-anchor': 'middle' });
    const TESTS = ['saves and finds', 'rejects duplicates', 'ignores email case'];
    const cols = [['InMemoryUsers', 'fake', 70], ['PostgresUsers', 'real', 310]];
    const marks = cols.map(([n, s, x]) => {
      box(k, x - 50, 44, 200, 40, s === 'fake' ? 'var(--amber-soft)' : 'var(--surface-3)');
      tx(x + 50, 62, n, { class: 's-mono', 'text-anchor': 'middle' }); tx(x + 50, 77, s, { class: 's-note s-ink', 'text-anchor': 'middle' });
      return TESTS.map((t, i) => {
        tx(x - 44, 118 + i * 40, t, { class: 's-note s-ink' });
        return chip(k, x + 140, 114 + i * 40, null);
      });
    });
    const verdict = tx(240, 270, '', { class: 's-cap', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 7 : T % 8, drift = t > 4; // reduced motion: show the caught drift
      marks.forEach((col, c) => col.forEach(([ci, ti], i) => {
        const shown = (drift ? t - 4 : t) > 0.5 + i * 0.5;
        const ok = !(drift && c === 0 && i === 2);
        ci.style.fill = !shown ? 'var(--surface-3)' : ok ? 'var(--ok)' : 'var(--bad)';
        ti.textContent = shown ? (ok ? '✓' : '✗') : '';
      }));
      verdict.textContent = drift ? (t > 6 ? 'the fake drifted (case-sensitive), and the suite caught it' : 'later: Postgres gets a case-insensitive unique index') : (t > 2 ? 'fake and real agree' : '');
      verdict.style.fill = drift && t > 6 ? 'var(--bad)' : 'var(--ink)';
    });
  },

  /** TDD: the red, green, refactor loop. */
  tddLoop(k) {
    const { mk, tx, loop } = k;
    const P = [['RED', 'a failing test', 'var(--bad)', 'var(--bad-soft)', 240, 60], ['GREEN', 'simplest code', 'var(--ok)', 'var(--ok-soft)', 368, 214], ['REFACTOR', 'clean, stay green', 'var(--accent)', 'var(--accent-soft)', 112, 214]];
    mk('circle', { cx: 240, cy: 160, r: 92, fill: 'none', stroke: 'var(--line-strong)', 'stroke-width': 2, 'stroke-dasharray': '6 5' });
    const nodes = P.map(([n, d, c, f, x, y]) => {
      const r = mk('rect', { x: x - 80, y: y - 28, width: 160, height: 56, rx: 28, fill: f, stroke: c, 'stroke-width': 2.4 });
      tx(x, y - 4, n, { class: 's-monob', 'text-anchor': 'middle' });
      tx(x, y + 14, d, { class: 's-note s-ink', 'text-anchor': 'middle' });
      return r;
    });
    const dot = mk('circle', { r: 8, cx: 240, cy: 68, fill: 'var(--amber)', stroke: 'var(--ink)', 'stroke-width': 1.5 });
    tx(240, 165, 'minutes per lap', { class: 's-note s-ink', 'text-anchor': 'middle' });
    loop((T) => {
      const t = (T % 6) / 6, a = -Math.PI / 2 + t * 2 * Math.PI;
      dot.setAttribute('cx', 240 + 92 * Math.cos(a)); dot.setAttribute('cy', 160 + 92 * Math.sin(a));
      const at = Math.floor(t * 3);
      nodes.forEach((r, i) => r.setAttribute('stroke-width', i === at ? 4 : 2.4));
    });
  },

  /** TDD: a board driven by the step's data: the phase, the tests and their state, and the code so far. */
  tddBoard(k, ctx) {
    const { mk, tx, loop } = k;
    const b = ctx.step.board;
    const PH = [['red', 'RED', 'var(--bad)', 'var(--bad-soft)'], ['green', 'GREEN', 'var(--ok)', 'var(--ok-soft)'], ['refactor', 'REFACTOR', 'var(--accent)', 'var(--accent-soft)']];
    PH.forEach(([id, n, c, f], i) => {
      const on = b.phase === id;
      mk('rect', { x: 96 + i * 100, y: 8, width: 90, height: 26, rx: 13, fill: on ? f : 'var(--surface-2)', stroke: on ? c : 'var(--line)', 'stroke-width': on ? 2.4 : 1.2 });
      tx(141 + i * 100, 25, n, { class: 's-mono', 'text-anchor': 'middle', ...(on ? {} : { opacity: 0.5 }) });
    });
    tx(14, 58, 'slugify.test.ts', { class: 's-lbl' });
    const rows = b.tests.map(([name, state], i) => {
      const y = 70 + i * 40;
      box(k, 10, y, 196, 32, 'var(--surface)', { rx: 8, 'stroke-width': 1.6 });
      tx(20, y + 20, name, { class: 's-note s-ink' });
      return [state, chip(k, 190, y + 16, null)];
    });
    tx(222, 58, 'slugify.ts', { class: 's-lbl' });
    mk('rect', { x: 216, y: 66, width: 256, height: 166, rx: 10, fill: 'var(--code-bg)', stroke: 'var(--ink)', 'stroke-width': 2 });
    code(k, 228, 88, b.code);
    const fails = b.tests.filter(([, s]) => s === 'red').length;
    const status = tx(240, 270, '', { class: fails ? 's-red' : 's-grn', 'text-anchor': 'middle' });
    if (b.note) tx(240, 290, b.note, { class: 's-note s-ink', 'text-anchor': 'middle' });
    loop((T) => {
      rows.forEach(([state, [c, t]], i) => {
        const run = T > 0.4 + i * 0.35;
        const ok = state === 'green';
        c.style.fill = run ? (ok ? 'var(--ok)' : 'var(--bad)') : 'var(--surface-3)';
        t.textContent = run ? (ok ? '✓' : '✗') : '';
      });
      if (T > 0.6 + b.tests.length * 0.35) status.textContent = fails ? `${fails} failed, ${b.tests.length - fails} passed` : `${b.tests.length} passed`;
      if (T > 1 + b.tests.length * 0.35) return false;
    });
  },

  /** TDD: where test-first fits well, and where to spike first. */
  tddFit(k) {
    const { tx, loop } = k;
    tx(120, 26, 'Test first', { class: 's-lbl', 'text-anchor': 'middle' });
    tx(360, 26, 'Spike first, then test', { class: 's-lbl', 'text-anchor': 'middle' });
    const A = ['business rules', 'parsing and formatting', 'a bug you can reproduce', 'a clear API contract'];
    const B = ['UI still being explored', 'an unfamiliar library', 'a speed experiment', 'a throwaway prototype'];
    const all = [];
    A.forEach((t, i) => all.push(box(k, 14, 44 + i * 52, 212, 40, 'var(--ok-soft)'), tx(120, 69 + i * 52, t, { class: 's-mono', 'text-anchor': 'middle' })));
    B.forEach((t, i) => all.push(box(k, 254, 44 + i * 52, 212, 40, 'var(--amber-soft)'), tx(360, 69 + i * 52, t, { class: 's-mono', 'text-anchor': 'middle' })));
    const n = tx(240, 278, 'a spike is code you throw away once you have learned', { class: 's-note s-ink', 'text-anchor': 'middle' });
    loop((T) => {
      all.forEach((e, i) => e.setAttribute('opacity', Math.min(1, Math.max(0, (T - Math.floor(i / 2) * 0.18) / 0.4))));
      n.setAttribute('opacity', Math.min(1, Math.max(0, (T - 1.6) / 0.4)));
      if (T > 2.1) return false;
    });
  },

  /** TDD: classicist (inside-out, real objects) vs mockist (outside-in, doubles for collaborators). */
  tddSchools(k) {
    const { mk, tx, loop } = k;
    k.defs();
    tx(120, 24, 'Inside-out (classicist)', { class: 's-lbl', 'text-anchor': 'middle' });
    tx(360, 24, 'Outside-in (mockist)', { class: 's-lbl', 'text-anchor': 'middle' });
    mk('line', { x1: 240, y1: 12, x2: 240, y2: 262, stroke: 'var(--line)', 'stroke-width': 2, 'stroke-dasharray': '4 4' });
    const L = ['slugify()', 'PostService', 'POST /posts'], R = ['POST /posts', 'PostService', 'slugify()'];
    const draw = (x0, list, dbl) => list.map((n, i) => {
      const y = 50 + i * 72, g = mk('g');
      box(k, x0 + 30, y, 180, 44, dbl && i > 0 ? 'var(--amber-soft)' : 'var(--surface)', {}, g);
      tx(x0 + 120, y + 20, n, { class: 's-mono', 'text-anchor': 'middle' }, g);
      tx(x0 + 120, y + 36, dbl && i > 0 ? 'starts as a double' : `test ${i + 1}`, { class: 's-note s-ink', 'text-anchor': 'middle' }, g);
      if (i < 2) mk('path', { d: `M${x0 + 120},${y + 46} L${x0 + 120},${y + 66}`, stroke: 'var(--ink)', 'stroke-width': 1.8, 'marker-end': 'url(#arI)' }, g);
      return g;
    });
    const a = draw(0, L, false), b = draw(240, R, true);
    tx(120, 280, 'build up from the core', { class: 's-note s-ink', 'text-anchor': 'middle' });
    tx(360, 280, 'start at the request', { class: 's-note s-ink', 'text-anchor': 'middle' });
    loop((T) => {
      [...a, ...b].forEach((g, i) => g.setAttribute('opacity', Math.min(1, Math.max(0, (T - (i % 3) * 0.5) / 0.4))));
      if (T > 1.6) return false;
    });
  },
};
