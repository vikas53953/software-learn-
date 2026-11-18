// Animated scenes for Module 1 (Design Principles). Each takes the scene toolkit (k) and the step context (ctx).
// All drawing stays inside the 480×300 box; labels are short so they still fit when phones enlarge .s-note.

const box = (k, x, y, w, h, fill, extra = {}) => k.mk('rect', { x, y, width: w, height: h, rx: 10, fill, stroke: 'var(--ink)', 'stroke-width': 2.2, ...extra });
const dot = (k, fill) => k.mk('circle', { r: 6, cx: -20, cy: -20, fill, stroke: 'var(--ink)', 'stroke-width': 1.5 });

// Four teams, one schedule of commits (seconds into a 12 s cycle). Used by both SRP scenes so the counts compare.
const TEAMS = [
  { name: 'Finance', file: 'Pricing.ts', x: 66, times: [0.6, 3.6, 6.9, 9.8] },
  { name: 'Marketing', file: 'Receipt.ts', x: 182, times: [1.0, 5.1, 9.6] },
  { name: 'DBA', file: 'Repo.ts', x: 298, times: [3.9, 7.2] },
  { name: 'Security', file: 'Validate.ts', x: 414, times: [2.2, 6.8, 10.4] },
];
const CYCLE = 12, TRAVEL = 0.9;
const ARRIVALS = TEAMS.flatMap((tm, ti) => tm.times.map((s) => ({ ti, s, at: s + TRAVEL }))).sort((a, b) => a.at - b.at);
// Two commits to the same file landing less than 0.6 s apart stand for two open pull requests touching the same lines.
const CLASH = ARRIVALS.filter((a, i) => i > 0 && a.at - ARRIVALS[i - 1].at < 0.6).map((a) => a.at);

function teamsRow(k) {
  TEAMS.forEach((tm) => {
    k.mk('rect', { x: tm.x - 50, y: 20, width: 100, height: 30, rx: 15, class: 's-chip' });
    k.tx(tm.x, 40, tm.name, { class: 's-lbl', 'text-anchor': 'middle' });
  });
}

export const scenes = {
  /** SRP, before: every team's commits land in one file and collide. */
  srpBlob(k) {
    const { tx, loop, lerp, seg } = k;
    teamsRow(k);
    const file = box(k, 150, 132, 180, 60, 'var(--surface)');
    tx(240, 160, 'OrderService.ts', { class: 's-monob', 'text-anchor': 'middle' });
    tx(240, 178, '820 lines', { class: 's-note', 'text-anchor': 'middle' });
    const warn = tx(240, 222, '', { class: 's-red', 'text-anchor': 'middle' });
    const count = tx(240, 270, '', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const dots = TEAMS.map(() => dot(k, 'var(--amber)'));
    loop((T) => {
      const t = T % CYCLE, laps = Math.floor(T / CYCLE);
      TEAMS.forEach((tm, ti) => {
        const s = tm.times.find((x) => t >= x && t < x + TRAVEL);
        const d = dots[ti];
        if (s === undefined) { d.setAttribute('cx', -20); return; }
        const p = seg(t, s, s + TRAVEL);
        d.setAttribute('cx', lerp(tm.x, 240, p)); d.setAttribute('cy', lerp(56, 150, p));
      });
      const clash = CLASH.some((c) => t >= c && t < c + 1.4);
      file.style.fill = clash ? 'var(--bad-soft)' : 'var(--surface)';
      file.style.stroke = clash ? 'var(--bad)' : 'var(--ink)';
      warn.textContent = clash ? '✗ merge conflict' : '';
      const n = laps * CLASH.length + CLASH.filter((c) => t >= c).length;
      count.textContent = `conflicts so far: ${n}`;
    });
  },

  /** SRP, after: each team commits to its own file; a thin flow on top calls them. */
  srpSplit(k) {
    const { mk, tx, loop, lerp, seg } = k;
    teamsRow(k);
    const files = TEAMS.map((tm) => {
      const r = box(k, tm.x - 52, 112, 104, 44, 'var(--l1)');
      tx(tm.x, 139, tm.file, { class: 's-mono', 'text-anchor': 'middle' });
      mk('line', { x1: tm.x, y1: 156, x2: 240, y2: 214, stroke: 'var(--line)', 'stroke-width': 2 });
      return r;
    });
    box(k, 170, 214, 140, 36, 'var(--surface)');
    tx(240, 237, 'CheckoutFlow', { class: 's-mono', 'text-anchor': 'middle' });
    tx(240, 278, 'conflicts so far: 0', { class: 's-grn', 'text-anchor': 'middle' });
    const dots = TEAMS.map(() => dot(k, 'var(--amber)'));
    loop((T) => {
      const t = T % CYCLE;
      TEAMS.forEach((tm, ti) => {
        const s = tm.times.find((x) => t >= x && t < x + TRAVEL);
        const hit = tm.times.some((x) => t >= x + TRAVEL && t < x + TRAVEL + 0.6);
        files[ti].style.stroke = hit ? 'var(--ok)' : 'var(--ink)';
        const d = dots[ti];
        if (s === undefined) { d.setAttribute('cx', -20); return; }
        d.setAttribute('cx', tm.x); d.setAttribute('cy', lerp(56, 118, seg(t, s, s + TRAVEL)));
      });
    });
  },

  /** OCP, before: each new payment method edits the switch and puts every old case back under test. */
  ocpSwitch(k) {
    const { mk, tx, loop } = k;
    const code = box(k, 30, 40, 250, 200, 'var(--code-bg)');
    tx(155, 30, 'PaymentProcessor.ts', { class: 's-mono', 'text-anchor': 'middle' });
    // SVG collapses leading spaces, so indentation is an x offset.
    const L = ['switch (method) {', "case 'card':", "case 'transfer':", "case 'wallet':", "case 'crypto':", '}'];
    const lines = L.map((s, i) => tx(i === 0 || i === L.length - 1 ? 46 : 66, 70 + i * 26, s, { class: 's-mono', fill: 'var(--code-ink)' }));
    tx(380, 30, 'needs retesting', { class: 's-note', 'text-anchor': 'middle' });
    const names = ['card', 'transfer', 'wallet', 'crypto'];
    const badges = names.map((n, i) => {
      const r = mk('rect', { x: 318, y: 50 + i * 44, width: 124, height: 32, rx: 8, class: 's-chip' });
      const t = tx(380, 70 + i * 44, n, { class: 's-mono', 'text-anchor': 'middle' });
      return { r, t };
    });
    const note = tx(155, 272, '', { class: 's-red', 'text-anchor': 'middle' });
    loop((T) => {
      const n = T < 1.5 ? 2 : T < 4.5 ? 3 : 4; // how many cases exist now
      const editing = (T >= 1.5 && T < 3) || (T >= 4.5 && T < 6);
      lines.forEach((l, i) => {
        const caseIdx = i - 1;
        const shown = i === 0 || i === L.length - 1 || caseIdx < n;
        l.setAttribute('opacity', shown ? 1 : 0);
        l.style.fill = caseIdx === n - 1 && editing ? 'var(--amber)' : 'var(--code-ink)';
      });
      lines[L.length - 1].setAttribute('y', 70 + (n + 1) * 26);
      code.style.stroke = editing ? 'var(--bad)' : 'var(--ink)';
      badges.forEach((b, i) => {
        const on = i < n;
        b.r.setAttribute('opacity', on ? 1 : 0); b.t.setAttribute('opacity', on ? 1 : 0);
        b.r.style.fill = on && n > 2 ? 'var(--bad-soft)' : 'var(--surface-2)';
        b.r.style.stroke = on && n > 2 ? 'var(--bad)' : 'var(--line)';
      });
      note.textContent = n > 2 ? `edited again · ${n} paths to retest` : '';
      if (T > 6.5) return false;
    });
  },

  /** OCP, after: the processor talks to an interface; a new method is a new class that plugs in. */
  ocpPlug(k) {
    const { mk, tx, loop, lerp, seg } = k;
    box(k, 40, 30, 190, 44, 'var(--surface)');
    tx(135, 57, 'PaymentProcessor', { class: 's-mono', 'text-anchor': 'middle' });
    mk('line', { x1: 135, y1: 74, x2: 135, y2: 118, stroke: 'var(--ink)', 'stroke-width': 2 });
    box(k, 40, 118, 190, 52, 'var(--l2)', { 'stroke-dasharray': '6 4' });
    tx(135, 142, 'PaymentMethod', { class: 's-monob', 'text-anchor': 'middle' });
    tx(135, 160, 'interface', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const rows = [['CardPayment', 70], ['BankTransfer', 144], ['WalletPayment', 218]];
    const plugs = rows.map(([name, y], i) => {
      const g = mk('g');
      mk('rect', { x: 0, y: -20, width: 168, height: 40, rx: 10, fill: i === 2 ? 'var(--l1)' : 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2 }, g);
      tx(84, 5, name, { class: 's-mono', 'text-anchor': 'middle' }, g);
      const wire = mk('path', { d: `M290,${y} C260,${y} 260,144 232,144`, fill: 'none', stroke: i === 2 ? 'var(--ok)' : 'var(--line)', 'stroke-width': 2, 'stroke-dasharray': '5 4' });
      return { g, y, wire };
    });
    const tag = tx(374, 272, '', { class: 's-grn', 'text-anchor': 'middle' });
    const untouched = tx(135, 210, 'untouched', { class: 's-note', 'text-anchor': 'middle' });
    loop((T) => {
      plugs.forEach((p, i) => {
        const x = i < 2 ? 290 : lerp(312, 290, seg(T, 1, 2.4));
        p.g.setAttribute('transform', `translate(${x},${p.y})`);
        p.g.setAttribute('opacity', i < 2 ? 1 : seg(T, 0.8, 1.4));
        p.wire.setAttribute('opacity', i < 2 ? 1 : seg(T, 2.3, 2.8));
      });
      untouched.setAttribute('opacity', seg(T, 2.6, 3.2));
      tag.textContent = T > 2.8 ? '+1 new file · 0 edits' : '';
      if (T > 3.5) return false;
    });
  },

  /** LSP: the same call, three implementations. One of them breaks the promise. */
  lspSwap(k) {
    const { mk, tx, loop } = k;
    k.defs();
    box(k, 20, 112, 130, 56, 'var(--surface)');
    tx(85, 137, 'BackupJob', { class: 's-mono', 'text-anchor': 'middle' });
    tx(85, 155, 'store.write()', { class: 's-note s-ink', 'text-anchor': 'middle' });
    mk('path', { d: 'M152,140 L222,140', stroke: 'var(--ink)', 'stroke-width': 2.4, 'marker-end': 'url(#arI)' });
    const slot = box(k, 232, 108, 170, 64, 'var(--surface)');
    const name = tx(317, 137, '', { class: 's-monob', 'text-anchor': 'middle' });
    const res = tx(317, 158, '', { class: 's-note s-ink', 'text-anchor': 'middle' });
    tx(240, 30, 'Same call. Swap the store underneath.', { class: 's-cap', 'text-anchor': 'middle' });
    const IMPL = [['LocalDisk', '✓ stored', true], ['CloudBucket', '✓ stored', true], ['ReadOnlyMirror', '✗ throws', false]];
    const log = IMPL.map((_, i) => tx(240, 214 + i * 24, '', { class: 's-mono', 'text-anchor': 'middle' }));
    loop((T) => {
      const step = Math.min(2, Math.floor(T / 2.2)), [n, r, ok] = IMPL[step];
      name.textContent = n; res.textContent = r;
      slot.style.fill = ok ? 'var(--ok-soft)' : 'var(--bad-soft)';
      slot.style.stroke = ok ? 'var(--ok)' : 'var(--bad)';
      log.forEach((l, i) => {
        if (i > step) { l.textContent = ''; return; }
        l.textContent = `${IMPL[i][0]}: ${IMPL[i][1]}`;
        l.style.fill = IMPL[i][2] ? 'var(--ok)' : 'var(--bad)';
      });
      if (T > 5.2) return false;
    });
  },

  /** DIP: the import arrow flips. Calls still go down at run time; source dependencies now point up. */
  dipFlip(k) {
    const { mk, tx, loop, seg } = k;
    k.defs();
    mk('rect', { x: 10, y: 14, width: 460, height: 118, rx: 14, fill: 'var(--l1)', opacity: 0.35 });
    mk('rect', { x: 10, y: 160, width: 460, height: 118, rx: 14, fill: 'var(--line)', opacity: 0.35 });
    tx(24, 34, 'POLICY · rules', { class: 's-note s-ink' });
    tx(24, 180, 'DETAILS · database', { class: 's-note s-ink' });
    box(k, 40, 58, 170, 48, 'var(--surface)');
    tx(125, 87, 'InvoiceService', { class: 's-mono', 'text-anchor': 'middle' });
    box(k, 40, 206, 170, 48, 'var(--surface)');
    tx(125, 235, 'PostgresRepo', { class: 's-mono', 'text-anchor': 'middle' });
    const ifc = box(k, 270, 58, 170, 48, 'var(--l2)', { 'stroke-dasharray': '6 4' });
    const ifcT = tx(355, 87, 'InvoiceRepo', { class: 's-mono', 'text-anchor': 'middle' });
    const down = mk('path', { d: 'M125,108 L125,198', stroke: 'var(--bad)', 'stroke-width': 3, 'marker-end': 'url(#arA)' });
    const downT = tx(134, 156, 'imports', { class: 's-red' });
    const need = mk('path', { d: 'M212,82 L262,82', stroke: 'var(--ink)', 'stroke-width': 2.4, 'marker-end': 'url(#arI)' });
    const up = mk('path', { d: 'M212,230 C300,230 355,190 355,114', fill: 'none', stroke: 'var(--accent)', 'stroke-width': 3, 'marker-end': 'url(#arG)' });
    const upT = tx(228, 262, 'implements', { class: 's-grn' });
    loop((T) => {
      const p = seg(T, 2, 3.4);
      down.setAttribute('opacity', 1 - p); downT.setAttribute('opacity', 1 - p);
      [ifc, ifcT, need].forEach((e) => e.setAttribute('opacity', seg(T, 1.6, 2.4)));
      up.setAttribute('opacity', p); upT.setAttribute('opacity', p);
      if (T > 3.8) return false;
    });
  },
};
