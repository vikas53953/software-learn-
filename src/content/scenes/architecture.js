// Animated scenes for Module 6 (Architecture). Each takes the scene toolkit (k) and the step context (ctx).
// Everything stays inside the 480×300 box; colours change only through el.style. Numbers are illustrative.

const box = (k, x, y, w, h, fill, extra = {}, p) => k.mk('rect', { x, y, width: w, height: h, rx: 10, fill, stroke: 'var(--ink)', 'stroke-width': 2, ...extra }, p);
const clamp = (v) => Math.min(1, Math.max(0, v));
const chip = (k, x, y, w, text, fill, p, cls = 's-mono') => {
  const g = k.mk('g', {}, p);
  k.mk('rect', { x, y, width: w, height: 26, rx: 13, fill, stroke: 'var(--ink)', 'stroke-width': 1.4 }, g);
  k.tx(x + w / 2, y + 17, text, { class: cls, 'text-anchor': 'middle' }, g);
  return g;
};
const arrow = (k, d, color = 'var(--ink)', extra = {}) => k.mk('path', { d, fill: 'none', stroke: color, 'stroke-width': 2, 'marker-end': 'url(#arI)', ...extra });

// Hexagonal: a codebase where the payment SDK is imported all over. [folder, files, indexes that import the SDK]
const FILES = [
  ['routes/', ['checkout.ts', 'refunds.ts', 'account.ts', 'search.ts', 'health.ts'], [0, 1]],
  ['services/', ['OrderSvc.ts', 'RefundSvc.ts', 'CartSvc.ts', 'emails.ts', 'stock.ts'], [0, 1, 3]],
  ['pricing/', ['discounts.ts', 'tax.ts', 'money.ts', 'coupons.ts', 'shipping.ts'], [0, 1, 2]],
  ['db/', ['orders.ts', 'payments.ts', 'users.ts', 'products.ts', 'migrate.ts'], [0, 1]],
];

export const scenes = {
  /** Hexagonal: which files change when the payment SDK changes (predict, then reveal). */
  hexRipple(k, ctx) {
    const { mk, tx, loop } = k;
    tx(14, 22, 'The shop\'s codebase', { class: 's-lbl' });
    const hits = [];
    FILES.forEach(([dir, files, bad], c) => {
      const x = 14 + c * 116;
      tx(x, 48, dir, { class: 's-monob' });
      files.forEach((f, r) => {
        const rect = mk('rect', { x, y: 58 + r * 34, width: 108, height: 26, rx: 6, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 1.2 });
        tx(x + 8, 75 + r * 34, f, { class: 's-note s-ink' });
        if (bad.includes(r)) hits.push(rect);
      });
    });
    const cap = tx(240, 262, 'Guess first, then watch.', { class: 's-cap', 'text-anchor': 'middle' });
    const note = tx(240, 284, '', { class: 's-red', 'text-anchor': 'middle' });
    ctx.api.reveal = () => loop((T) => {
      const n = k.reduced ? hits.length : Math.min(hits.length, Math.floor(T * 4));
      hits.forEach((r, i) => { r.style.fill = i < n ? 'var(--bad-soft)' : 'var(--surface-2)'; r.style.stroke = i < n ? 'var(--bad)' : 'var(--line-strong)'; });
      if (n >= hits.length) {
        cap.textContent = 'Red files import the SDK. Pricing changes too.';
        note.textContent = `${hits.length} files in 4 folders (illustrative)`;
        return false;
      }
    });
    if (ctx.answered) ctx.api.reveal();
  },

  /** Hexagonal: at run time calls flow outward; in the source code every import points inward. */
  hexArrows(k) {
    const { mk, tx, loop } = k;
    k.defs();
    tx(14, 24, 'At run time, calls flow out', { class: 's-lbl' });
    const C = ['PlaceOrder', 'Payments port', 'PayCoPayments', 'PayCo API'];
    C.forEach((t, i) => {
      box(k, 10 + i * 118, 40, 104, 34, i === 0 ? 'var(--accent-soft)' : i === 1 ? 'var(--violet-soft)' : 'var(--surface-2)', { 'stroke-width': 1.6 });
      tx(62 + i * 118, 62, t, { class: 's-mono', 'text-anchor': 'middle' });
      if (i < 3) arrow(k, `M${114 + i * 118},57 L${126 + i * 118},57`);
    });
    const dot = mk('circle', { cx: 62, cy: 90, r: 5, fill: 'var(--accent)' });

    tx(14, 128, 'In source code, imports point in', { class: 's-lbl' });
    const B = [[10, 'REST controller', '→ PlaceOrder', 'var(--surface-2)'], [180, 'core', 'imports none', 'var(--ok-soft)'], [350, 'PayCoPayments', '→ Payments', 'var(--surface-2)']];
    B.forEach(([x, t, s, f]) => {
      box(k, x, 146, 120, 54, f, { 'stroke-width': 1.8 });
      tx(x + 60, 168, t, { class: 's-mono', 'text-anchor': 'middle' });
      tx(x + 60, 188, s, { class: 's-note s-ink', 'text-anchor': 'middle' });
    });
    const imp = [arrow(k, 'M132,173 L176,173', 'var(--ok)', { 'stroke-width': 2.6 }), arrow(k, 'M348,173 L304,173', 'var(--ok)', { 'stroke-width': 2.6 })];
    const cap = tx(240, 252, 'Calls go out; dependencies point in.', { class: 's-cap', 'text-anchor': 'middle' });
    const sub = tx(240, 276, 'Only the adapter knows the vendor exists.', { class: 's-grn', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 9 : T % 6;
      dot.setAttribute('cx', 62 + clamp(t / 2.4) * 354);
      dot.setAttribute('opacity', t < 2.6 ? 1 : 0);
      imp.forEach((a, i) => a.setAttribute('opacity', clamp((t - 2.6 - i * 0.4) / 0.4)));
      [cap, sub].forEach((e) => e.setAttribute('opacity', clamp((t - 3.6) / 0.4)));
    });
  },

  /** Hexagonal: the same order in three shapes, with adapters translating at each edge. */
  hexMapping(k) {
    const { mk, tx, loop } = k;
    k.defs();
    const COLS = [
      ['HTTP body', 'driving adapter', ['{"items":[', ' {"sku":"B1",', '  "qty":2}],', ' "card":"tok_9"}']],
      ['Order', 'core', ['Order {', ' lines: Line[]', ' total(): Money', ' canRefund()', '}']],
      ['orders row', 'driven adapter', ['orders', ' id uuid', ' total_cents int', ' status text']],
    ];
    const gs = COLS.map(([title, sub, lines], i) => {
      const x = 10 + i * 160, g = mk('g');
      tx(x, 22, title, { class: 's-lbl' }, g);
      tx(x, 38, sub, { class: 's-note' }, g);
      box(k, x, 46, 140, 120, 'var(--code-bg)', { 'stroke-width': 1.6 }, g);
      lines.forEach((l, r) => tx(x + 10, 68 + r * 20, l, { class: 's-code', style: 'white-space: pre' }, g));
      return g;
    });
    const maps = [arrow(k, 'M151,106 L169,106'), arrow(k, 'M311,106 L329,106')];
    const good = chip(k, 10, 190, 220, 'core never sees HTTP or SQL', 'var(--ok-soft)', undefined, 's-note s-ink');
    const cost = chip(k, 250, 190, 220, 'cost: extra types + mapping', 'var(--amber-soft)', undefined, 's-note s-ink');
    const cap = tx(240, 262, 'Every edge translates. The core only sees Order.', { class: 's-cap', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 9 : T;
      gs.forEach((g, i) => g.setAttribute('opacity', clamp((t - i * 0.7) / 0.4)));
      maps.forEach((m, i) => m.setAttribute('opacity', clamp((t - 0.5 - i * 0.7) / 0.3)));
      good.setAttribute('opacity', clamp((t - 2.2) / 0.4));
      cost.setAttribute('opacity', clamp((t - 2.8) / 0.4));
      cap.setAttribute('opacity', clamp((t - 3.4) / 0.4));
      if (t > 4) return false;
    });
  },

  /** Services: six teams share one weekly release; one failing test holds every change. */
  svcTrain(k) {
    const { mk, tx, loop } = k;
    const T6 = ['Catalog · new filters', 'Orders · gift notes', 'Accounts · 2FA', 'Search · synonyms', 'Payments · VAT fix', 'Emails · new layout'];
    tx(14, 22, 'Changes waiting for the weekly release', { class: 's-lbl' });
    const rows = T6.map((t, i) => {
      const y = 36 + i * 36;
      const line = mk('path', { d: `M214,${y + 13} C260,${y + 13} 260,140 300,140`, fill: 'none', stroke: 'var(--line-strong)', 'stroke-width': 1.6 });
      const g = chip(k, 14, y, 200, t, 'var(--surface-2)');
      return { g, line };
    });
    box(k, 300, 108, 166, 64, 'var(--surface)');
    tx(383, 132, 'release 42', { class: 's-monob', 'text-anchor': 'middle' });
    const st = tx(383, 156, 'collecting…', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const cap = tx(240, 270, '', { class: 's-cap', 'text-anchor': 'middle' });
    const sub = tx(240, 292, '', { class: 's-red', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 9 : T % 8;
      rows.forEach(({ g, line }, i) => { const o = clamp((t - i * 0.3) / 0.3); g.setAttribute('opacity', o); line.setAttribute('opacity', o); });
      const failed = t > 2.6;
      rows[0].g.firstChild.style.fill = failed ? 'var(--bad-soft)' : 'var(--surface-2)';
      rows[4].g.firstChild.style.fill = failed ? 'var(--amber-soft)' : 'var(--surface-2)';
      st.textContent = failed ? 'blocked: Catalog red' : 'collecting…';
      st.setAttribute('class', failed ? 's-red' : 's-note s-ink');
      cap.textContent = failed ? 'One failing test holds every team\'s change.' : '';
      sub.textContent = t > 3.6 ? 'The VAT fix is due today. It waits anyway.' : '';
    });
  },

  /** Services: the strangler fig. Routes move one by one from the monolith module to the new service. */
  svcStrangler(k) {
    const { mk, tx, loop } = k;
    const R = ['/payments/charge', '/payments/refund', '/payments/history', '/payments/hooks'];
    box(k, 10, 110, 90, 60, 'var(--surface-2)');
    tx(55, 145, 'Router', { class: 's-monob', 'text-anchor': 'middle' });
    box(k, 330, 30, 140, 96, 'var(--surface)');
    tx(400, 52, 'Monolith', { class: 's-monob', 'text-anchor': 'middle' });
    tx(344, 76, 'payments module', { class: 's-note s-ink' });
    mk('rect', { x: 344, y: 86, width: 112, height: 14, rx: 4, fill: 'var(--surface-3)' });
    const bar = mk('rect', { x: 344, y: 86, width: 112, height: 14, rx: 4, fill: 'var(--amber)' });
    const gone = tx(400, 116, '', { class: 's-grn', 'text-anchor': 'middle' });
    box(k, 330, 160, 140, 96, 'var(--ok-soft)');
    tx(400, 184, 'Payments svc', { class: 's-monob', 'text-anchor': 'middle' });
    tx(400, 204, 'own deploy, own DB', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const moved = tx(400, 236, '', { class: 's-mono', 'text-anchor': 'middle' });
    const routes = R.map((r, i) => {
      const y = 36 + i * 62;
      mk('path', { d: `M100,140 C116,140 112,${y + 13} 128,${y + 13}`, fill: 'none', stroke: 'var(--line-strong)', 'stroke-width': 1.6 });
      const line = mk('path', { d: '', fill: 'none', 'stroke-width': 2 });
      const g = chip(k, 128, y, 160, r, 'var(--surface-2)');
      return { g, line, y };
    });
    const cap = tx(240, 288, 'Move one route at a time. Each move can be rolled back.', { class: 's-cap', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 99 : T % 9;
      const n = Math.min(4, Math.floor(t / 1.6)); // routes moved so far
      routes.forEach(({ g, line, y }, i) => {
        const on = i < n;
        line.setAttribute('d', on ? `M288,${y + 13} C310,${y + 13} 310,208 330,208` : `M288,${y + 13} C310,${y + 13} 310,78 330,78`);
        line.style.stroke = on ? 'var(--ok)' : 'var(--amber)';
        g.firstChild.style.fill = on ? 'var(--ok-soft)' : 'var(--surface-2)';
      });
      bar.setAttribute('width', 112 * (1 - n / 4));
      moved.textContent = `${n} of 4 routes`;
      gone.textContent = n === 4 ? 'old code deleted' : '';
      cap.setAttribute('opacity', n >= 1 ? 1 : 0.3);
    });
  },

  /** Services: what can happen to one network call. The timeout is the one you cannot read. */
  svcOutcomes(k, ctx) {
    const { mk, tx, loop } = k;
    tx(14, 22, 'Orders', { class: 's-lbl' });
    tx(466, 22, 'Payments', { class: 's-lbl', 'text-anchor': 'end' });
    mk('line', { x1: 96, y1: 34, x2: 96, y2: 262, stroke: 'var(--line-strong)', 'stroke-width': 2 });
    mk('line', { x1: 384, y1: 34, x2: 384, y2: 262, stroke: 'var(--line-strong)', 'stroke-width': 2 });
    const ROWS = [
      ['success', '200 OK', 'charged', 'ok', 1],
      ['declined', '402', 'refused', 'warn', 1],
      ['slow', '200 after 2 s', 'charged', 'warn', 3],
      ['timeout', '? no answer', 'charged', 'bad', 0],
    ];
    const C = { ok: 'var(--ok)', warn: 'var(--amber)', bad: 'var(--bad)' };
    const rows = ROWS.map(([name, resp, side, tone, speed], i) => {
      const y = 56 + i * 56;
      tx(14, y + 4, name, { class: 's-monob' });
      const req = mk('line', { x1: 96, y1: y - 8, x2: 96, y2: y - 8, stroke: 'var(--ink)', 'stroke-width': 2 });
      const res = mk('line', { x1: 384, y1: y + 10, x2: 384, y2: y + 10, stroke: C[tone], 'stroke-width': 2.4, 'stroke-dasharray': tone === 'bad' ? '5 4' : '' });
      const sideT = tx(392, y + 4, side, { class: 's-note s-ink' });
      const respT = tx(240, y + 26, resp, { class: tone === 'ok' ? 's-grn' : 's-red', 'text-anchor': 'middle' });
      return { req, res, sideT, respT, speed, tone, y };
    });
    const cap = tx(240, 288, 'A timeout tells you nothing about what happened.', { class: 's-cap', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 9 : T % 7;
      rows.forEach(({ req, res, sideT, respT, speed, tone }) => {
        const a = clamp(t / 1.2);
        req.setAttribute('x2', 96 + a * 288);
        sideT.setAttribute('opacity', a >= 1 ? 1 : 0);
        const b = tone === 'bad' ? Math.min(0.45, clamp((t - 1.3) / 1.2)) : clamp((t - 1.3 - (speed - 1)) / 1.2);
        res.setAttribute('x2', 384 - b * 288);
        respT.setAttribute('opacity', tone === 'bad' ? (t > 3.5 ? 1 : 0) : b >= 1 ? 1 : 0);
      });
      cap.setAttribute('opacity', t > 3.8 ? 1 : 0.15);
    });
    void ctx;
  },

  /** Services: the transactional outbox. Order and event commit together; a relay publishes the event. */
  svcOutbox(k) {
    const { mk, tx, loop } = k;
    k.defs();
    box(k, 10, 34, 200, 156, 'var(--surface)');
    tx(22, 56, 'one DB transaction', { class: 's-note s-ink' });
    const r1 = chip(k, 24, 76, 172, 'INSERT orders row', 'var(--surface-2)');
    const r2 = chip(k, 24, 124, 172, 'INSERT outbox row', 'var(--surface-2)');
    const commit = tx(110, 178, '', { class: 's-grn', 'text-anchor': 'middle' });
    box(k, 236, 118, 80, 40, 'var(--violet-soft)', { 'stroke-width': 1.6 });
    tx(276, 143, 'relay', { class: 's-mono', 'text-anchor': 'middle' });
    box(k, 340, 34, 130, 44, 'var(--surface-2)', { 'stroke-width': 1.6 });
    tx(405, 61, 'message queue', { class: 's-mono', 'text-anchor': 'middle' });
    box(k, 340, 150, 130, 60, 'var(--ok-soft)', { 'stroke-width': 1.6 });
    tx(405, 174, 'Payments svc', { class: 's-mono', 'text-anchor': 'middle' });
    const done = tx(405, 196, '', { class: 's-note s-ink', 'text-anchor': 'middle' });
    arrow(k, 'M196,137 L232,137');
    arrow(k, 'M316,128 C330,110 330,90 352,80');
    arrow(k, 'M405,78 L405,146');
    const P = [[196, 137], [236, 137], [276, 120], [340, 70], [405, 78], [405, 150]];
    const dot = mk('circle', { r: 6, fill: 'var(--accent)' });
    const cap = tx(240, 254, 'Both rows commit together, or neither does.', { class: 's-cap', 'text-anchor': 'middle' });
    const sub = tx(240, 280, 'Delivery is at least once: the consumer must be idempotent.', { class: 's-red', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 9 : T % 8;
      const both = t > 0.8;
      [r1, r2].forEach((g, i) => { g.setAttribute('opacity', clamp((t - i * 0.3) / 0.3)); g.firstChild.style.fill = both ? 'var(--ok-soft)' : 'var(--surface-2)'; });
      commit.textContent = both ? 'COMMIT' : '';
      const p = clamp((t - 1.4) / 2.6) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(p)), f = p - i;
      dot.setAttribute('cx', P[i][0] + (P[i + 1][0] - P[i][0]) * f);
      dot.setAttribute('cy', P[i][1] + (P[i + 1][1] - P[i][1]) * f);
      dot.setAttribute('opacity', t > 1.4 && t < 4.2 ? 1 : 0);
      done.textContent = t >= 4 ? 'event → charge' : '';
      cap.setAttribute('opacity', clamp((t - 0.8) / 0.4));
      sub.setAttribute('opacity', clamp((t - 4.2) / 0.4));
    });
  },
};
