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
      const t = T % CYCLE;
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
      // One 12 s loop stands for one week, so the count restarts each loop and matches the "~5/wk" tile.
      count.textContent = `conflicts this week: ${CLASH.filter((c) => t >= c).length}`;
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
    tx(240, 278, 'conflicts this week: 0', { class: 's-grn', 'text-anchor': 'middle' });
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
    tx(456, 180, 'DETAILS · database', { class: 's-note s-ink', 'text-anchor': 'end' });
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
    // At run time the call still goes down to Postgres, through the interface.
    const call = mk('path', { d: 'M80,108 L80,198', stroke: 'var(--amber)', 'stroke-width': 2.4, 'stroke-dasharray': '5 4', 'marker-end': 'url(#arA)' });
    const callT = tx(88, 160, 'run-time call', { class: 's-note s-ink' });
    loop((T) => {
      [call, callT].forEach((e) => e.setAttribute('opacity', seg(T, 4, 4.6)));
      const p = seg(T, 2, 3.4);
      down.setAttribute('opacity', 1 - p); downT.setAttribute('opacity', 1 - p);
      [ifc, ifcT, need].forEach((e) => e.setAttribute('opacity', seg(T, 1.6, 2.4)));
      up.setAttribute('opacity', p); upT.setAttribute('opacity', p);
      if (T > 4.8) return false;
    });
  },
  /** SRP: six months of commits on OrderService. Each team's commits land in one column, so the columns are the seams. */
  srpSeams(k) {
    const { mk, tx, loop, seg } = k;
    const COLS = [['price()', 'var(--l3)'], ['validate()', 'var(--l2)'], ['save()', 'var(--l1)'], ['receipt()', 'var(--violet-soft)']];
    // [author, column touched]; one row per commit, oldest first. Illustrative history.
    const ROWS = [['Priya', 0], ['Tom', 3], ['Sam', 1], ['Priya', 0], ['Ana', 2], ['Tom', 3], ['Priya', 0], ['Sam', 1]];
    tx(240, 22, 'Commits to OrderService.ts, by function', { class: 's-cap', 'text-anchor': 'middle' });
    const x0 = 112, cw = 88, y0 = 52, rh = 24;
    COLS.forEach(([n], c) => tx(x0 + c * cw + cw / 2, 46, n, { class: 's-mono', 'text-anchor': 'middle' }));
    const cells = ROWS.map(([who, col], r) => {
      const y = y0 + r * rh;
      const t = tx(16, y + 16, who, { class: 's-note s-ink' });
      const row = COLS.map(([, f], c) => mk('rect', { x: x0 + c * cw + 4, y: y + 3, width: cw - 8, height: rh - 6, rx: 5, fill: c === col ? f : 'var(--surface-2)', stroke: c === col ? 'var(--ink)' : 'var(--line)', 'stroke-width': c === col ? 1.6 : 1 }));
      return [t, row];
    });
    const seams = [1, 2, 3].map((c) => mk('line', { x1: x0 + c * cw, y1: y0, x2: x0 + c * cw, y2: y0 + ROWS.length * rh, stroke: 'var(--bad)', 'stroke-width': 2.4, 'stroke-dasharray': '6 4' }));
    const note = tx(240, 286, 'no commit crosses a line: cut there', { class: 's-red', 'text-anchor': 'middle' });
    loop((T) => {
      cells.forEach(([t, row], r) => { const o = seg(T, 0.3 + r * 0.35, 0.6 + r * 0.35); t.setAttribute('opacity', o); row.forEach((c) => c.setAttribute('opacity', o)); });
      const s2 = seg(T, 3.6, 4.2);
      seams.forEach((l) => l.setAttribute('opacity', s2)); note.setAttribute('opacity', s2);
      if (T > 4.4) return false;
    });
  },

  /** OCP: the expression problem. Adding a type vs adding an operation, with classes and with a union + switch. */
  ocpGrid(k) {
    const { mk, tx, loop } = k;
    const OPS = ['pay', 'refund', 'receipt'], TYPES = ['Card', 'Bank'];
    const grid = (gx, title) => {
      tx(gx + 142, 22, title, { class: 's-lbl', 'text-anchor': 'middle' });
      const cell = (r, c) => mk('rect', { x: gx + 52 + c * 46, y: 66 + r * 30, width: 42, height: 24, rx: 5, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 1.2 });
      const heads = [...OPS, 'audit'].map((o, c) => tx(gx + 73 + c * 46, c % 2 ? 58 : 44, o, { class: 's-mono', 'text-anchor': 'middle' }));
      const rows = [...TYPES, 'Wallet'].map((t, r) => tx(gx + 46, 83 + r * 30, t, { class: 's-mono', 'text-anchor': 'end' }));
      const cells = [0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => cell(r, c)));
      const cap = tx(gx + 142, 176, '', { class: 's-mono', 'text-anchor': 'middle' });
      return { rows, cells, cap, audit: heads[3] };
    };
    const L = grid(2, 'Classes'), R = grid(242, 'Union + switch');
    const phase = tx(240, 222, '', { class: 's-cap', 'text-anchor': 'middle' });
    const verdict = tx(240, 250, '', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const paint = (c, on, good) => { c.style.fill = on ? (good ? 'var(--ok-soft)' : 'var(--bad-soft)') : 'var(--surface-2)'; c.style.stroke = on ? (good ? 'var(--ok)' : 'var(--bad)') : 'var(--line-strong)'; };
    loop((T) => {
      const addType = T % 10 < 5;
      for (const [G, typeGood] of [[L, true], [R, false]]) {
        G.cells.forEach((row, r) => row.forEach((c, j) => {
          const shown = addType ? j < 3 : r < 2;
          c.setAttribute('opacity', shown ? 1 : 0);
          const fresh = addType ? r === 2 : j === 3;
          paint(c, shown && fresh, addType ? typeGood : !typeGood);
        }));
        G.rows[2].setAttribute('opacity', addType ? 1 : 0); G.audit.setAttribute('opacity', addType ? 0 : 1);
        G.cap.textContent = addType ? (typeGood ? '+1 file, 1 register line' : '3 switches edited') : (typeGood ? 'interface + 2 classes' : '+1 new function');
        G.cap.style.fill = (addType ? typeGood : !typeGood) ? 'var(--ok)' : 'var(--bad)';
      }
      phase.textContent = addType ? 'New payment type: Wallet' : 'New operation: audit';
      verdict.textContent = addType ? 'classes win when types keep arriving' : 'a union wins when operations keep arriving';
    });
  },

  /** LSP: the same three lines run against a Rectangle and a Square. */
  lspSquare(k) {
    const { mk, tx, loop, seg, lerp } = k;
    const U = 20;
    tx(240, 22, 's.setWidth(5); s.setHeight(4); expect(s.area()).toBe(20)', { class: 's-mono', 'text-anchor': 'middle' });
    const panel = (cx, name) => {
      tx(cx, 50, name, { class: 's-lbl', 'text-anchor': 'middle' });
      const r = mk('rect', { x: cx - 50, y: 70, width: 60, height: 60, fill: 'var(--l2)', stroke: 'var(--ink)', 'stroke-width': 2 });
      const dims = tx(cx, 250, '', { class: 's-mono', 'text-anchor': 'middle' });
      const res = tx(cx, 274, '', { class: 's-grn', 'text-anchor': 'middle' });
      return { cx, r, dims, res };
    };
    const A = panel(130, 'Rectangle'), B = panel(350, 'Square extends Rectangle');
    const size = (P, w, h) => { P.r.setAttribute('x', P.cx - (w * U) / 2); P.r.setAttribute('width', w * U); P.r.setAttribute('height', h * U); P.dims.textContent = `${Math.round(w)} × ${Math.round(h)}`; };
    loop((T) => {
      const t = T % 7, p1 = seg(t, 0.5, 1.5), p2 = seg(t, 2, 3);
      size(A, lerp(3, 5, p1), lerp(3, 4, p2));
      const sq = t < 2 ? lerp(3, 5, p1) : lerp(5, 4, p2);
      size(B, sq, sq);
      const done = t > 3.4;
      A.res.textContent = done ? 'area 20 ✓' : ''; B.res.textContent = done ? 'area 16 ✗ expected 20' : '';
      B.res.style.fill = 'var(--bad)'; B.r.style.stroke = done ? 'var(--bad)' : 'var(--ink)'; B.r.style.fill = done ? 'var(--bad-soft)' : 'var(--l2)';
    });
  },
};
