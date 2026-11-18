// Animated scenes for Module 4 (Delivery). Each takes the scene toolkit (k) and the step context (ctx).
// Everything stays inside the 480×300 box; colours change only through el.style. Numbers are illustrative.

const box = (k, x, y, w, h, fill, extra = {}, p) => k.mk('rect', { x, y, width: w, height: h, rx: 10, fill, stroke: 'var(--ink)', 'stroke-width': 2, ...extra }, p);
const clamp = (v) => Math.min(1, Math.max(0, v));

export const scenes = {
  /** CI: a branch that lives two weeks drifts far from main; daily merges stay close. */
  ciMerge(k) {
    const { mk, tx, loop } = k;
    const X = (d) => 40 + d * 28; // day d on the time axis
    const lane = (y, title) => {
      tx(14, y - 34, title, { class: 's-lbl' });
      mk('line', { x1: X(0), y1: y, x2: X(14), y2: y, stroke: 'var(--line-strong)', 'stroke-width': 3 });
      tx(X(14) + 6, y + 4, 'main', { class: 's-note s-ink' });
    };
    lane(88, 'One branch, merged after 2 weeks');
    lane(214, 'Small branches, merged daily');
    const mainDots = [88, 214].map((y) => Array.from({ length: 15 }, (_, d) => mk('circle', { cx: X(d), cy: y, r: 4, fill: 'var(--ink)' })));
    const longPath = mk('path', { d: '', fill: 'none', stroke: 'var(--bad)', 'stroke-width': 2.5 });
    const shorts = Array.from({ length: 14 }, (_, d) => mk('path', { d: `M${X(d)},214 Q${X(d) + 14},186 ${X(d + 1)},214`, fill: 'none', stroke: 'var(--ok)', 'stroke-width': 2.5 }));
    const c1 = tx(240, 150, '', { class: 's-red', 'text-anchor': 'middle' });
    const c2 = tx(240, 274, '', { class: 's-grn', 'text-anchor': 'middle' });
    c1.style.fontSize = '13px'; c2.style.fontSize = '13px';
    loop((T) => {
      const day = k.reduced ? 14 : Math.min(14, Math.floor((T % 12) / 0.6));
      mainDots.forEach((row) => row.forEach((c, d) => c.setAttribute('opacity', d <= day ? 1 : 0.15)));
      const end = Math.max(1, day);
      longPath.setAttribute('d', day < 14 ? `M${X(0)},88 C${X(1)},120 ${X(end - 1)},122 ${X(end)},122` : `M${X(0)},88 C${X(1)},122 ${X(12)},124 ${X(13)},122 L${X(14)},88`);
      shorts.forEach((p, d) => p.setAttribute('opacity', d < day ? 1 : 0));
      c1.textContent = day < 14 ? `${day * 3} commits on main to catch up with` : 'merge day: 42 commits apart, conflicts in 9 files';
      c2.textContent = day ? `${day} merges, each one day apart: small or no conflicts` : '';
    });
  },

  /** CI: the same four stages in two orders. Static, so it does not give away the predict. */
  ciOrder(k) {
    const { tx } = k;
    const ST = [['lint', 0.33, 'var(--ok-soft)'], ['unit', 1, 'var(--ok-soft)'], ['integration', 6, 'var(--amber-soft)'], ['E2E', 15, 'var(--bad-soft)']];
    const draw = (y, order, title) => {
      tx(14, y - 12, title, { class: 's-lbl' });
      let x = 14;
      order.forEach((i) => {
        const [n, min, f] = ST[i], w = [58, 72, 128, 182][i]; // widths grow with run time, not to scale
        box(k, x, y, w, 44, f, { rx: 8, 'stroke-width': 1.6 });
        tx(x + w / 2, y + 20, n, { class: 's-mono', 'text-anchor': 'middle' });
        tx(x + w / 2, y + 36, min < 1 ? '20 s' : `${min} min`, { class: 's-note s-ink', 'text-anchor': 'middle' });
        x += w + 4;
      });
    };
    draw(46, [3, 2, 1, 0], 'Pipeline A: slowest first');
    draw(154, [0, 1, 2, 3], 'Pipeline B: cheapest first');
    tx(240, 250, 'Each stops at the first failure.', { class: 's-cap', 'text-anchor': 'middle' });
    tx(240, 276, 'This commit has a lint error.', { class: 's-red', 'text-anchor': 'middle' }).style.fontSize = '13px';
  },

  /** CI: rebuilding per environment can ship bytes nobody tested; one image promoted by digest cannot. */
  ciPromote(k) {
    const { mk, tx, loop } = k;
    k.defs();
    tx(120, 22, 'Build per environment', { class: 's-lbl', 'text-anchor': 'middle' });
    tx(360, 22, 'Build once, promote', { class: 's-lbl', 'text-anchor': 'middle' });
    mk('line', { x1: 240, y1: 10, x2: 240, y2: 268, stroke: 'var(--line)', 'stroke-width': 2, 'stroke-dasharray': '4 4' });
    const env = (x, y, name, digest, tone) => {
      const g = mk('g');
      box(k, x, y, 196, 50, tone, {}, g);
      tx(x + 98, y + 21, name, { class: 's-mono', 'text-anchor': 'middle' }, g);
      tx(x + 98, y + 39, digest, { class: 's-note s-ink', 'text-anchor': 'middle' }, g);
      return g;
    };
    const L = [env(22, 44, 'build #1 → staging', 'sha256:1a2b…  tested ✓', 'var(--surface)'), env(22, 150, 'build #2 → production', 'sha256:7c9d…  never tested', 'var(--bad-soft)')];
    const why = tx(120, 230, 'node:20 base image moved', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const why2 = tx(120, 246, 'between the two builds', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const R = [env(262, 44, 'staging', 'sha256:1a2b…  tested ✓', 'var(--ok-soft)'), env(262, 150, 'production', 'sha256:1a2b…  same bytes', 'var(--ok-soft)')];
    const arrow = mk('path', { d: 'M360,96 L360,144', stroke: 'var(--ink)', 'stroke-width': 2, 'marker-end': 'url(#arI)' });
    const promo = tx(372, 124, 'promote', { class: 's-note s-ink' });
    const note = tx(240, 288, 'same commit, different bytes on the left', { class: 's-red', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 9 : T;
      L[0].setAttribute('opacity', clamp(t / 0.5)); R[0].setAttribute('opacity', clamp(t / 0.5));
      L[1].setAttribute('opacity', clamp((t - 1.4) / 0.5)); why.setAttribute('opacity', clamp((t - 1.8) / 0.5)); why2.setAttribute('opacity', clamp((t - 1.8) / 0.5));
      [arrow, promo].forEach((e) => e.setAttribute('opacity', clamp((t - 2.6) / 0.5)));
      R[1].setAttribute('opacity', clamp((t - 3) / 0.5));
      note.setAttribute('opacity', clamp((t - 4) / 0.5));
      if (t > 4.6) return false;
    });
  },

  /** Deploys: a rolling update replaces instances two at a time, waiting for health checks. */
  depRolling(k) {
    const { mk, tx, loop } = k;
    tx(240, 24, 'Ten instances behind the load balancer', { class: 's-cap', 'text-anchor': 'middle' });
    const cells = Array.from({ length: 10 }, (_, i) => {
      const x = 30 + (i % 5) * 86, y = 52 + Math.floor(i / 5) * 86, g = mk('g');
      const r = box(k, x, y, 76, 66, 'var(--violet-soft)', {}, g);
      const v = tx(x + 38, y + 30, 'v1.4', { class: 's-monob', 'text-anchor': 'middle' }, g);
      const s = tx(x + 38, y + 50, 'serving', { class: 's-note s-ink', 'text-anchor': 'middle' }, g);
      return { r, v, s };
    });
    const status = tx(240, 246, '', { class: 's-mono', 'text-anchor': 'middle' });
    const sub = tx(240, 272, 'v1.4 and v1.5 serve traffic at the same time', { class: 's-note s-ink', 'text-anchor': 'middle' });
    loop((T) => {
      const t = k.reduced ? 7.5 : T % 13; // 5 batches of 2, 1.6 s each, then a pause
      const batch = Math.floor(t / 1.6), phase = (t % 1.6) / 1.6;
      let done = 0;
      cells.forEach(({ r, v, s }, i) => {
        const b = Math.floor(i / 2);
        const st = b < batch ? 'new' : b === batch && batch < 5 ? (phase < 0.5 ? 'starting' : 'health') : 'old';
        if (st === 'new') done++;
        r.style.fill = st === 'new' ? 'var(--ok-soft)' : st === 'old' ? 'var(--violet-soft)' : 'var(--amber-soft)';
        v.textContent = st === 'old' ? 'v1.4' : 'v1.5';
        s.textContent = st === 'new' ? 'serving' : st === 'old' ? 'serving' : st === 'starting' ? 'starting' : 'health check';
      });
      status.textContent = `${done} of 10 on v1.5, no downtime`;
      sub.setAttribute('opacity', done > 0 && done < 10 ? 1 : 0.35);
    });
  },

  /** Deploys: expand, migrate, contract. Rename a column without breaking the version still running. */
  depExpand(k) {
    const { mk, tx, loop } = k;
    const P = [
      ['1. Expand', ['price', 'price_cents  (new)'], 'v1.4 ✓   v1.5 ✓', 'add a column; old code ignores it'],
      ['2. Migrate', ['price', 'price_cents'], 'v1.5 writes both', 'backfill rows'],
      ['3. Contract', ['price  (dropped)', 'price_cents'], 'v1.4 gone first', 'then drop price'],
    ];
    const cols = P.map(([title, rows, who, why], i) => {
      const x = 12 + i * 158, g = mk('g');
      tx(x + 74, 30, title, { class: 's-lbl', 'text-anchor': 'middle' }, g);
      box(k, x, 44, 148, 104, 'var(--surface)', {}, g);
      tx(x + 12, 66, 'products', { class: 's-monob' }, g);
      rows.forEach((r, j) => {
        const t = tx(x + 12, 92 + j * 24, r, { class: 's-mono' }, g);
        if (r.includes('dropped')) { t.style.fill = 'var(--bad)'; t.style.textDecoration = 'line-through'; }
        if (r.includes('new')) t.style.fill = 'var(--ok)';
      });
      tx(x + 74, 178, who, { class: 's-mono', 'text-anchor': 'middle' }, g);
      tx(x + 74, 198, why.split('; ')[0], { class: 's-note s-ink', 'text-anchor': 'middle' }, g);
      if (why.includes('; ')) tx(x + 74, 214, why.split('; ')[1], { class: 's-note s-ink', 'text-anchor': 'middle' }, g);
      return g;
    });
    tx(240, 262, 'Each step is its own deploy.', { class: 's-cap', 'text-anchor': 'middle' });
    tx(240, 284, 'At every moment, both running versions work.', { class: 's-note s-ink', 'text-anchor': 'middle' });
    loop((T) => {
      cols.forEach((g, i) => g.setAttribute('opacity', clamp(((k.reduced ? 9 : T) - i * 1.1) / 0.5)));
      if (T > 3) return false;
    });
  },

  /** Deploys: canary analysis. The canary's error rate is compared with the baseline and aborted past a limit. */
  depCanary(k) {
    const { mk, tx, loop } = k;
    const x0 = 50, x1 = 460, y0 = 230, y1 = 40, MAX = 6; // y axis: error rate 0..6 %
    const Y = (v) => y0 - (v / MAX) * (y0 - y1), Xm = (m) => x0 + (m / 20) * (x1 - x0);
    mk('line', { x1: x0, y1: y0, x2: x1, y2: y0, stroke: 'var(--ink)', 'stroke-width': 1.5 });
    mk('line', { x1: x0, y1: y0, x2: x0, y2: y1, stroke: 'var(--ink)', 'stroke-width': 1.5 });
    [0, 2, 4, 6].forEach((v) => tx(x0 - 8, Y(v) + 4, `${v}%`, { class: 's-note s-ink', 'text-anchor': 'end' }));
    [0, 10, 20].forEach((m) => tx(Xm(m), y0 + 18, `${m} min`, { class: 's-note s-ink', 'text-anchor': 'middle' }));
    mk('line', { x1: x0, y1: Y(1), x2: x1, y2: Y(1), stroke: 'var(--bad)', 'stroke-width': 1.5, 'stroke-dasharray': '6 4' });
    tx(x1, Y(1) - 6, 'abort above 1%', { class: 's-red', 'text-anchor': 'end' });
    const base = Array.from({ length: 21 }, (_, m) => [m, 0.1 + (m % 3) * 0.03]);
    const can = Array.from({ length: 10 }, (_, m) => [m, m < 9 ? 0.12 + (m % 2) * 0.05 : 1.6]);
    const path = (pts) => pts.map(([m, v], i) => `${i ? 'L' : 'M'}${Xm(m)},${Y(v)}`).join(' ');
    const pb = mk('path', { d: '', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 });
    const pc = mk('path', { d: '', fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.5 });
    tx(x0 + 8, 30, 'v1.4 baseline', { class: 's-mono' });
    tx(x0 + 130, 30, 'v1.5 canary (5%)', { class: 's-mono' }).style.fill = 'var(--accent)';
    const verdict = tx(240, 284, '', { class: 's-red', 'text-anchor': 'middle' });
    verdict.style.fontSize = '13px';
    loop((T) => {
      const m = k.reduced ? 20 : Math.min(20, (T % 14) * 2);
      pb.setAttribute('d', path(base.filter(([x]) => x <= m)));
      pc.setAttribute('d', path(can.filter(([x]) => x <= Math.min(m, 9))));
      verdict.textContent = m >= 9 ? 'minute 9: 1.6% > 1%, rollout aborted, traffic back on v1.4' : '';
    });
  },
};
