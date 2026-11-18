// Animated scenes for "The Testing Pyramid". Each takes the scene toolkit (k) and the step context (ctx):
// ctx.api is filled with hooks the player calls (reveal after a prediction, onSlider for the mix slider);
// ctx.setTile(index, value, tone, sub) updates the stage readout; ctx.setSlider(value) moves the card's slider.

// The pyramid, drawn in a 480×300 box. hw(y) is the half-width at height y.
const hw = (y) => 22 + (143 * (y - 64)) / 198;
const LAY = [
  { top: 199, bot: 262, rows: 2, n: 14, f: 'var(--l1)', name: 'Unit', note: 'many · ms each' },
  { top: 133, bot: 196, rows: 2, n: 6, f: 'var(--l2)', name: 'Integration', note: 'some · 100s of ms' },
  { top: 64, bot: 130, rows: 1, n: 2, f: 'var(--l3)', name: 'End-to-end', note: 'few · seconds' },
];

function pyramid(k, { build = false, labels = true, focus = null, inner = false, cx = 195 } = {}) {
  const { mk, tx, later } = k;
  mk('line', { x1: 8, x2: 472, y1: 265, y2: 265, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' });
  const out = { g: [], bricks: [], shape: [] };
  LAY.forEach((L, li) => {
    const g = mk('g', focus !== null && !focus.includes(li) ? { class: 'ldim' } : {});
    const shape = mk('path', { d: `M${cx - hw(L.bot)},${L.bot} L${cx + hw(L.bot)},${L.bot} L${cx + hw(L.top)},${L.top} L${cx - hw(L.top)},${L.top} Z`, fill: inner ? L.f : 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, g);
    const bricks = []; let n = 0;
    if (!inner) {
      const per = Math.ceil(L.n / L.rows);
      for (let r = 0; r < L.rows; r++) {
        const y0 = L.bot - 5 - (r + 1) * 24 - r * 4, half = hw(y0) - 10, cnt = Math.min(per, L.n - r * per), w = (2 * half - (cnt - 1) * 4) / cnt;
        for (let c = 0; c < cnt; c++) {
          const b = mk('rect', { class: 'brick' + (build ? ' off' : ''), x: cx - half + c * (w + 4), y: y0, width: w, height: 24, rx: 3, fill: L.f, stroke: 'var(--ink)', 'stroke-width': 1.4 }, g);
          if (build) later(() => b.classList.remove('off'), 150 + li * 450 + n * 55);
          bricks.push(b); n++;
        }
      }
    }
    const ym = (L.top + L.bot) / 2;
    if (labels && !inner) {
      mk('line', { x1: cx + hw(ym) + 4, y1: ym, x2: 354, y2: ym, stroke: 'var(--muted)', 'stroke-width': 1.3, 'stroke-dasharray': '3 4' }, g);
      tx(360, ym - 2, L.name, { class: 's-lbl' }, g); tx(360, ym + 14, L.note, { class: 's-note' }, g);
    }
    if (inner) tx(cx, ym + 5, li === 2 ? 'E2E' : L.name, { class: 's-lbl', 'text-anchor': 'middle' }, g);
    out.g.push(g); out.bricks.push(bricks); out.shape.push(shape);
  });
  return out;
}

export const scenes = {
  build(k) {
    const py = pyramid(k, { build: true });
    // after the build, light up each layer in turn, then all three
    k.later(() => k.loop((t) => {
      const on = Math.floor(t / 1.6) % 4;
      py.shape.forEach((sh, li) => sh.setAttribute('stroke-width', on === li ? 4 : 2.2));
      py.g.forEach((g, li) => { g.style.opacity = on === 3 || on === li ? 1 : 0.45; });
    }), 2200);
  },

  finish(k) { pyramid(k, { build: true }); },

  quiz(k) {
    pyramid(k);
    const g = k.mk('g', { class: 'pulse' });
    k.mk('circle', { cx: 440, cy: 38, r: 22, fill: 'var(--amber)', stroke: 'var(--ink)', 'stroke-width': 2.5 }, g);
    k.tx(440, 47, '?', { class: 's-big s-on-amber', 'text-anchor': 'middle' }, g);
  },

  unit(k) {
    const { mk, tx, loop, token, lerp, seg } = k;
    tx(240, 30, 'Call one function. Check the answer.', { class: 's-cap', 'text-anchor': 'middle' });
    ['no database', 'no network', 'no browser'].forEach((t, i) => {
      const x = 95 + i * 145;
      mk('rect', { x: x - 58, y: 246, width: 116, height: 28, rx: 14, class: 's-chip' });
      tx(x, 264, t, { class: 's-note', 'text-anchor': 'middle' });
      mk('line', { x1: x - 44, y1: 260, x2: x + 44, y2: 260, stroke: 'var(--bad)', 'stroke-width': 1.5, opacity: 0.7 });
    });
    const box = mk('rect', { x: 165, y: 104, width: 150, height: 66, rx: 12, fill: 'var(--l1)', stroke: 'var(--ink)', 'stroke-width': 2.4 });
    tx(240, 133, 'applyDiscount', { class: 's-monob', 'text-anchor': 'middle' });
    tx(240, 153, '(cents, code)', { class: 's-note s-ink', 'text-anchor': 'middle' });
    tx(70, 96, 'input', { class: 's-note', 'text-anchor': 'middle' }); tx(398, 96, 'output', { class: 's-note', 'text-anchor': 'middle' });
    const inp = token(118, 'var(--surface)'), out = token(70, 'var(--surface)');
    const res = tx(398, 205, '', { class: 's-grn', 'text-anchor': 'middle' }), lat = tx(398, 222, '', { class: 's-note', 'text-anchor': 'middle' });
    const cases = [['10000, SAVE10', '9000', '✓ expected 9000', '2 ms'], ['10000, NOPE', '10000', '✓ expected 10000', '1 ms']];
    loop((t) => {
      const cyc = 3.6, n = Math.floor(t / cyc) % 2, p = (t % cyc) / cyc, c = cases[n];
      inp.set(c[0]); out.set(c[1]);
      inp.at(lerp(0, 12, seg(p, 0, 0.22)) + lerp(0, 60, seg(p, 0.26, 0.38)), 137, p < 0.26 ? seg(p, 0, 0.12) : 1 - seg(p, 0.26, 0.38));
      box.setAttribute('stroke-width', p > 0.34 && p < 0.5 ? 4 : 2.4);
      out.at(lerp(250, 363, seg(p, 0.46, 0.64)), 137, p < 0.46 ? 0 : seg(p, 0.46, 0.56));
      res.textContent = p > 0.66 ? c[2] : ''; lat.textContent = p > 0.66 ? c[3] : '';
    });
  },

  predict(k, ctx) {
    const { mk, tx, loop } = k;
    tx(240, 30, '1,200 unit tests', { class: 's-cap', 'text-anchor': 'middle' });
    const cells = [];
    for (let r = 0; r < 30; r++) for (let c = 0; c < 40; c++) cells.push(mk('rect', { x: 40 + c * 10, y: 44 + r * 6.8, width: 8, height: 5, rx: 1, class: 's-cell' }));
    const clock = tx(240, 284, '⏱  ?', { class: 's-big', 'text-anchor': 'middle' });
    let done = 0;
    ctx.api.reveal = () => loop((t) => {
      const n = Math.min(1200, Math.floor((t / 2.4) * 1200));
      for (; done < n; done++) cells[done].classList.add('on');
      const secs = (Math.min(t, 2.4) * 1.2).toFixed(1);
      clock.textContent = `⏱  ${secs} s`; ctx.setTile(2, `${secs} s`);
      if (n >= 1200) { ctx.setTile(2, '≈ 2.9 s', 'good'); return false; }
    });
    if (ctx.answered) ctx.api.reveal();
  },

  integration(k) {
    const { mk, tx, loop, token, lerp, seg } = k;
    tx(240, 30, 'Real code + a real, throwaway database', { class: 's-cap', 'text-anchor': 'middle' });
    mk('rect', { x: 20, y: 104, width: 150, height: 74, rx: 12, fill: 'var(--l2)', stroke: 'var(--ink)', 'stroke-width': 2.4 });
    tx(95, 136, 'OrderRepository', { class: 's-monob', 'text-anchor': 'middle' }); tx(95, 156, 'our real code', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const dbx = 400, dw = 60;
    mk('path', { d: `M${dbx - dw},92 L${dbx - dw},182 A${dw},14 0 0 0 ${dbx + dw},182 L${dbx + dw},92`, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.4 });
    mk('ellipse', { cx: dbx, cy: 92, rx: dw, ry: 14, fill: 'var(--surface-2)', stroke: 'var(--ink)', 'stroke-width': 2.4 });
    tx(dbx, 136, 'Postgres', { class: 's-lbl', 'text-anchor': 'middle' }); tx(dbx, 154, 'test container', { class: 's-note', 'text-anchor': 'middle' });
    const flash = mk('ellipse', { cx: dbx, cy: 92, rx: dw - 6, ry: 10, fill: 'var(--l2)', opacity: 0 });
    mk('line', { x1: 176, y1: 141, x2: 334, y2: 141, stroke: 'var(--muted)', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' });
    const pk = token(84, 'var(--surface)');
    const clock = tx(240, 232, '', { class: 's-big', 'text-anchor': 'middle' }); tx(240, 252, 'slowed down so you can watch', { class: 's-note', 'text-anchor': 'middle' });
    const res = tx(240, 284, '', { class: 's-grn', 'text-anchor': 'middle' });
    const msgs = [['INSERT A1', 1], ['row saved', -1], ['SELECT A1', 1], ['A1 · 9000', -1]];
    loop((t) => {
      const p = ((t % 6.4) / 6.4) * 5, m = Math.min(3, Math.floor(p)), q = p - m;
      const [label, dir] = msgs[m]; pk.set(label);
      const x = dir > 0 ? lerp(180, 248, seg(q, 0, 0.8)) : lerp(248, 180, seg(q, 0, 0.8));
      pk.at(x, dir > 0 ? 122 : 162, p >= 4 ? 0 : 1);
      flash.setAttribute('opacity', dir > 0 && q > 0.75 && p < 4 ? 0.9 : 0);
      clock.textContent = `${Math.round((Math.min(p, 4) / 4) * 180)} ms`;
      res.textContent = p >= 4 ? '✓ saved and read back the same order' : '';
    });
  },

  e2e(k) {
    const { mk, tx, loop, lerp, seg } = k;
    const B = { x: 24, y: 14, w: 432, h: 270 };
    mk('rect', { x: B.x, y: B.y, width: B.w, height: B.h, rx: 12, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.4 });
    mk('line', { x1: B.x, y1: 46, x2: B.x + B.w, y2: 46, stroke: 'var(--ink)', 'stroke-width': 2 });
    [0, 1, 2].forEach((i) => mk('circle', { cx: 42 + i * 14, cy: 30, r: 4.5, fill: 'var(--line)' }));
    mk('rect', { x: 92, y: 21, width: 260, height: 18, rx: 9, class: 's-chip' }); tx(104, 34, 'localhost:3000/shop/lamp', { class: 's-note' });
    const clock = tx(440, 35, '0.0 s', { class: 's-monob', 'text-anchor': 'end' });
    mk('path', { d: 'M72,120 L104,120 L114,84 L62,84 Z', fill: 'var(--l3)', stroke: 'var(--ink)', 'stroke-width': 2 });
    mk('line', { x1: 88, y1: 120, x2: 88, y2: 150, stroke: 'var(--ink)', 'stroke-width': 3 });
    mk('rect', { x: 70, y: 150, width: 36, height: 8, rx: 3, fill: 'var(--ink)' });
    tx(140, 96, 'Desk lamp', { class: 's-lbl' });
    const price = tx(140, 122, '$100.00', { class: 's-monob' }), price2 = tx(214, 122, '', { class: 's-grn' });
    const cart = tx(440, 66, 'cart 0', { class: 's-mono', 'text-anchor': 'end' });
    const btn = (x, w, label, fill) => { const r = mk('rect', { x, y: 188, width: w, height: 34, rx: 9, fill, stroke: 'var(--ink)', 'stroke-width': 2 }); tx(x + w / 2, 210, label, { class: 's-mono', 'text-anchor': 'middle' }); return r; };
    const add = btn(52, 112, 'Add to cart', 'var(--l1)');
    mk('rect', { x: 182, y: 188, width: 130, height: 34, rx: 9, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2 }); tx(184, 182, 'Discount code', { class: 's-note' });
    const typed = tx(192, 210, '', { class: 's-mono' });
    const pay = btn(330, 96, 'Pay', 'var(--amber)');
    const thanks = mk('g', { opacity: 0 });
    mk('rect', { x: B.x + 2, y: 48, width: B.w - 4, height: B.h - 36, fill: 'var(--surface)' }, thanks);
    mk('circle', { cx: 240, cy: 140, r: 28, fill: 'var(--ok)' }, thanks);
    mk('path', { d: 'M226,140 l10,10 l18,-20', fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, thanks);
    tx(240, 202, 'Thanks for your order', { class: 's-cap', 'text-anchor': 'middle' }, thanks); tx(240, 224, 'charged $90.00', { class: 's-note', 'text-anchor': 'middle' }, thanks);
    const ripple = mk('circle', { r: 4, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 3, opacity: 0 });
    const cur = mk('path', { d: 'M0,0 L0,18 L5,13 L9,22 L12,21 L8,12 L15,12 Z', fill: 'var(--ink)', stroke: 'var(--surface)', 'stroke-width': 1.2 });
    const P = [[420, 260], [108, 205], [246, 205], [378, 205]];
    const click = (x, y, a) => { ripple.setAttribute('cx', x); ripple.setAttribute('cy', y); ripple.setAttribute('r', 4 + a * 18); ripple.setAttribute('opacity', a > 0 && a < 1 ? 1 - a : 0); };
    loop((t) => {
      const T = t % 8.2;
      let x, y;
      if (T < 1.2) { const p = seg(T, 0.2, 1.1); x = lerp(P[0][0], P[1][0], p); y = lerp(P[0][1], P[1][1], p); }
      else if (T < 2.4) { const p = seg(T, 1.4, 2.3); x = lerp(P[1][0], P[2][0], p); y = lerp(P[1][1], P[2][1], p); }
      else if (T < 4.6) { x = P[2][0]; y = P[2][1]; }
      else { const p = seg(T, 4.6, 5.5); x = lerp(P[2][0], P[3][0], p); y = lerp(P[2][1], P[3][1], p); }
      cur.setAttribute('transform', `translate(${x},${y})`);
      click(P[1][0], P[1][1], T > 1.15 && T < 1.6 ? (T - 1.15) / 0.45 : 0);
      if (T > 5.55 && T < 6) click(P[3][0], P[3][1], (T - 5.55) / 0.45);
      add.setAttribute('stroke-width', T > 1.15 && T < 1.4 ? 3.5 : 2); pay.setAttribute('stroke-width', T > 5.55 && T < 5.8 ? 3.5 : 2);
      cart.textContent = T > 1.2 ? 'cart 1' : 'cart 0';
      typed.textContent = 'SAVE10'.slice(0, Math.max(0, Math.min(6, Math.floor((T - 2.5) / 0.25))));
      const disc = T > 4.2; price.setAttribute('text-decoration', disc ? 'line-through' : 'none'); price.setAttribute('opacity', disc ? 0.5 : 1); price2.textContent = disc ? '$90.00' : '';
      thanks.setAttribute('opacity', T > 6.1 ? 1 : 0);
      clock.textContent = ((Math.min(T, 6.1) * 8.4) / 6.1).toFixed(1) + ' s';
    });
  },

  axis(k) {
    const { mk, tx, loop, lerp, ease, seg } = k;
    pyramid(k, { inner: true, cx: 170 }); k.defs();
    const ar = mk('path', { d: 'M362,250 L362,74', stroke: 'var(--amber)', 'stroke-width': 4, 'stroke-linecap': 'round', 'marker-end': 'url(#arA)', 'stroke-dasharray': 180, 'stroke-dashoffset': 180 });
    const dot = mk('circle', { cx: 362, r: 6, fill: 'var(--amber)', stroke: 'var(--ink)', 'stroke-width': 1.5 });
    [['slower', 80], ['costlier', 96], ['more realistic', 112]].forEach(([t, y]) => tx(374, y, t, { class: 's-mono' }));
    [['faster', 224], ['cheaper', 240], ['more precise', 256]].forEach(([t, y]) => tx(374, y, t, { class: 's-mono' }));
    loop((t) => { ar.setAttribute('stroke-dashoffset', 180 * (1 - seg(t, 0, 1.2))); const p = (t % 3) / 3; dot.setAttribute('cy', lerp(250, 80, ease(p))); dot.setAttribute('r', 4 + 5 * p); });
  },

  mix(k, ctx) {
    const { mk, tx, loop, lerp, seg } = k;
    mk('line', { x1: 20, x2: 460, y1: 238, y2: 238, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' });
    const g = mk('g'), rows = [['E2E', 60, 'var(--l3)'], ['Integ', 120, 'var(--l2)'], ['Unit', 180, 'var(--l1)']];
    const bars = rows.map(([n, y, f]) => { tx(10, y + 30, n, { class: 's-mono' }); return { r: mk('rect', { x: 240, y, width: 0, height: 52, rx: 8, fill: f, stroke: 'var(--ink)', 'stroke-width': 2.2 }, g), c: tx(470, y + 31, '', { class: 's-monob', 'text-anchor': 'end' }) }; });
    const shapeT = tx(240, 278, '', { class: 's-cap', 'text-anchor': 'middle' });
    const setMix = (pc) => {
      const m = mixModel(pc);
      [m.e2e, m.integration, m.unit].forEach((n, i) => { const w = Math.max(6, (n / 750) * 330); bars[i].r.setAttribute('x', 240 - w / 2); bars[i].r.setAttribute('width', w); bars[i].c.textContent = n.toLocaleString('en-US'); });
      g.setAttribute('class', m.shape === 'Ice-cream cone' ? 'wobble' : '');
      shapeT.textContent = `Shape: ${m.shape}`;
      const mins = m.minutes;
      ctx.setTile(0, `${mins < 10 ? mins.toFixed(1) : Math.round(mins)} min`, mins < 12 ? 'good' : mins > 40 ? 'bad' : '', 'one after another');
      ctx.setTile(1, `~${m.flaky < 10 ? m.flaky.toFixed(1) : Math.round(m.flaky)}`, m.flaky < 4 ? 'good' : m.flaky > 10 ? 'bad' : '', 'nothing was wrong');
      ctx.setTile(2, m.shape, m.shape === 'Pyramid' ? 'good' : m.shape === 'Ice-cream cone' ? 'bad' : '');
      ctx.setSlider(pc);
    };
    ctx.api.onSlider = (v) => { ctx.api.touched = true; setMix(v); };
    setMix(10);
    // a one-time demo sweep, until the learner touches the slider
    if (!k.reduced) loop((t) => {
      if (ctx.api.touched) return false;
      const p = t < 1 ? 0 : t < 4 ? seg(t, 1, 4) : t < 5.5 ? 1 : 1 - seg(t, 5.5, 8.5);
      setMix(Math.round(lerp(10, 60, p) / 5) * 5);
      if (t > 8.6) return false;
    });
  },

  cone(k) {
    const { mk, tx } = k;
    const g = mk('g', { class: 'wobble' });
    mk('path', { d: 'M110,95 C110,22 370,22 370,95 Z', fill: 'var(--surface-2)', stroke: 'var(--ink)', 'stroke-width': 2.4 }, g);
    [[150, 64], [196, 50], [252, 46], [300, 56], [330, 78], [172, 84]].forEach(([x, y], i) => mk('rect', { x, y, width: 12, height: 5, rx: 2.5, fill: ['var(--l1)', 'var(--l2)', 'var(--l3)', 'var(--bad)'][i % 4], transform: `rotate(${i * 37} ${x} ${y})` }, g));
    tx(240, 80, 'Manual testing', { class: 's-lbl', 'text-anchor': 'middle' }, g);
    mk('path', { d: 'M110,97 L370,97 L330,160 L150,160 Z', fill: 'var(--l3)', stroke: 'var(--ink)', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, g);
    tx(240, 128, 'E2E · 380', { class: 's-lbl', 'text-anchor': 'middle' }, g); tx(240, 145, 'browser tests', { class: 's-note s-ink', 'text-anchor': 'middle' }, g);
    mk('path', { d: 'M150,162 L330,162 L300,205 L180,205 Z', fill: 'var(--l2)', stroke: 'var(--ink)', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, g);
    tx(240, 189, 'Integration · 40', { class: 's-lbl', 'text-anchor': 'middle' }, g);
    mk('path', { d: 'M180,207 L300,207 L240,288 Z', fill: 'var(--l1)', stroke: 'var(--ink)', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, g);
    tx(240, 232, 'Unit · 60', { class: 's-lbl', 'text-anchor': 'middle' }, g);
    [['top-heavy', 118], ['64 min', 136], ['flaky', 154]].forEach(([t, y]) => tx(386, y, t, { class: 's-red' }));
  },

  push(k) {
    const { mk, tx, loop, seg } = k;
    k.defs();
    const py = pyramid(k, { labels: false });
    const fresh = py.bricks[0][6]; fresh.classList.add('off'); fresh.style.stroke = 'var(--accent)'; fresh.setAttribute('stroke-width', 3);
    const red = mk('path', { d: py.shape[2].getAttribute('d'), fill: 'var(--bad)', opacity: 0 });
    const b1 = mk('g', { opacity: 0 }); mk('rect', { x: 268, y: 26, width: 176, height: 30, rx: 10, fill: 'var(--bad-soft)', stroke: 'var(--bad)', 'stroke-width': 2 }, b1); tx(356, 46, '✗ caught here · 12 s', { class: 's-red', 'text-anchor': 'middle' }, b1);
    const arrow = mk('path', { d: 'M262,96 C430,110 430,210 352,232', fill: 'none', stroke: 'var(--accent)', 'stroke-width': 4, 'stroke-linecap': 'round', 'marker-end': 'url(#arG)', 'stroke-dasharray': 320, 'stroke-dashoffset': 320 });
    const b2 = mk('g', { opacity: 0 }); mk('rect', { x: 262, y: 270, width: 196, height: 26, rx: 10, fill: 'var(--ok-soft)', stroke: 'var(--ok)', 'stroke-width': 2 }, b2); tx(360, 288, '✓ now caught in 2 ms', { class: 's-grn', 'text-anchor': 'middle' }, b2);
    loop((t) => {
      const T = t % 7;
      red.setAttribute('opacity', T < 2.2 ? 0.25 + 0.25 * Math.sin(T * 9) : 0);
      b1.setAttribute('opacity', T > 0.2 && T < 6.6 ? 1 : 0);
      arrow.setAttribute('stroke-dashoffset', 320 * (1 - seg(T, 2, 3.2)));
      fresh.classList.toggle('off', !(T > 3.3 && T < 6.8));
      b2.setAttribute('opacity', T > 3.8 && T < 6.8 ? 1 : 0);
    });
  },

  refactor(k) {
    const { mk, tx, loop, lerp, seg } = k;
    k.defs();
    const before = [380, 40, 60], after = [40, 190, 960], fills = ['var(--l3)', 'var(--l2)', 'var(--l1)'], ys = [78, 138, 198];
    tx(110, 40, 'Before', { class: 's-cap', 'text-anchor': 'middle' }); tx(110, 58, '64 min · ~15 flaky/wk', { class: 's-red', 'text-anchor': 'middle' });
    tx(360, 40, 'After', { class: 's-cap', 'text-anchor': 'middle' }); const aft = tx(360, 58, '8 min · ~2 flaky/wk', { class: 's-grn', 'text-anchor': 'middle' });
    ['E2E', 'Integ', 'Unit'].forEach((n, i) => tx(207, ys[i] + 28, n, { class: 's-note', 'text-anchor': 'middle' }));
    mk('line', { x1: 20, x2: 460, y1: 258, y2: 258, stroke: 'var(--ink)', 'stroke-width': 2 });
    const W = (n) => Math.max(5, (n / 960) * 200);
    const bar = (cx, n, i) => ({ r: mk('rect', { x: cx, y: ys[i], width: 0, height: 46, rx: 7, fill: fills[i], stroke: 'var(--ink)', 'stroke-width': 2 }), c: tx(cx, ys[i] + 28, n.toLocaleString('en-US'), { class: 's-monob' }), cx, n });
    const place = (b, w) => { b.r.setAttribute('x', b.cx - w / 2); b.r.setAttribute('width', w); if (w > 44) { b.c.setAttribute('x', b.cx); b.c.setAttribute('text-anchor', 'middle'); } else { b.c.setAttribute('x', b.cx + w / 2 + 6); b.c.setAttribute('text-anchor', 'start'); } };
    before.map((n, i) => bar(110, n, i)).forEach((b) => place(b, W(b.n)));
    const A = after.map((n, i) => bar(360, n, i));
    const arr = mk('path', { d: 'M200,280 L282,280', stroke: 'var(--accent)', 'stroke-width': 4, 'stroke-linecap': 'round', 'marker-end': 'url(#arG)' }); tx(240, 296, 'push tests down', { class: 's-note', 'text-anchor': 'middle' });
    loop((t) => { const T = t % 7, p = seg(T, 0.6, 2.6); A.forEach((a, i) => { place(a, W(lerp(before[i], after[i], p))); a.c.textContent = Math.round(lerp(before[i], after[i], p)).toLocaleString('en-US'); }); aft.setAttribute('opacity', p >= 1 ? 1 : 0); arr.setAttribute('opacity', T > 0.3 ? 1 : 0); });
  },

  doubles(k) {
    const { mk, tx, loop, seg } = k;
    tx(240, 22, 'In a unit test, Checkout talks to stand-ins', { class: 's-cap', 'text-anchor': 'middle' });
    const ck = mk('rect', { x: 182, y: 118, width: 116, height: 60, rx: 12, fill: 'var(--l1)', stroke: 'var(--ink)', 'stroke-width': 2.4 }); tx(240, 153, 'Checkout', { class: 's-lbl', 'text-anchor': 'middle' });
    const deps = [
      { x: 16, y: 40, real: ['Payments API', 'real money, slow'], dbl: ['MOCK', 'expects 9000'], lx: 156, ly: 70, ex: 182, ey: 132 },
      { x: 16, y: 210, real: ['Postgres', 'real DB, slow'], dbl: ['FAKE', 'orders in memory'], lx: 156, ly: 240, ex: 182, ey: 164 },
      { x: 324, y: 118, real: ['Tax service', 'another team'], dbl: ['STUB', 'rate is always 0'], lx: 324, ly: 148, ex: 298, ey: 148 },
    ];
    deps.forEach((d) => {
      mk('line', { x1: d.lx, y1: d.ly, x2: d.ex, y2: d.ey, stroke: 'var(--muted)', 'stroke-width': 1.6, 'stroke-dasharray': '4 4' });
      d.rg = mk('g'); mk('rect', { x: d.x, y: d.y, width: 140, height: 60, rx: 12, fill: 'var(--surface-2)', stroke: 'var(--muted)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, d.rg);
      tx(d.x + 70, d.y + 27, d.real[0], { class: 's-lbl', 'text-anchor': 'middle' }, d.rg); tx(d.x + 70, d.y + 45, d.real[1], { class: 's-note', 'text-anchor': 'middle' }, d.rg);
      d.dg = mk('g', { opacity: 0 }); mk('rect', { x: d.x, y: d.y, width: 140, height: 60, rx: 12, fill: 'var(--amber-soft)', stroke: 'var(--ink)', 'stroke-width': 2.4 }, d.dg);
      tx(d.x + 70, d.y + 27, d.dbl[0], { class: 's-monob', 'text-anchor': 'middle' }, d.dg); tx(d.x + 70, d.y + 45, d.dbl[1], { class: 's-note s-ink', 'text-anchor': 'middle' }, d.dg);
    });
    const rec = tx(86, 122, '', { class: 's-grn', 'text-anchor': 'middle' });
    loop((t) => {
      const T = t % 8;
      deps.forEach((d, i) => { const v = seg(T, 1 + i * 0.45, 1.6 + i * 0.45) * (1 - seg(T, 7.2, 7.8)); d.rg.setAttribute('opacity', 1 - v); d.rg.setAttribute('transform', `translate(0,${-12 * v})`); d.dg.setAttribute('opacity', v); d.dg.setAttribute('transform', `translate(0,${12 * (1 - v)})`); });
      ck.setAttribute('stroke-width', T > 3.4 && T < 3.8 ? 4 : 2.4);
      rec.textContent = T > 3.8 && T < 7.2 ? '✓ charge(9000) recorded' : '';
    });
  },

  contract(k) {
    const { mk, tx, loop, token, lerp, seg } = k;
    tx(240, 22, 'Shop and Payments, tested separately', { class: 's-cap', 'text-anchor': 'middle' });
    const box = (x, n, s, f) => { mk('rect', { x, y: 112, width: 128, height: 70, rx: 12, fill: f, stroke: 'var(--ink)', 'stroke-width': 2.4 }); tx(x + 64, 142, n, { class: 's-lbl', 'text-anchor': 'middle' }); return tx(x + 64, 162, s, { class: 's-note s-ink', 'text-anchor': 'middle' }); };
    box(16, 'Shop', 'sends amountCents', 'var(--l1)'); const ps = box(336, 'Payments', 'reads amountCents', 'var(--l2)');
    mk('line', { x1: 146, y1: 147, x2: 334, y2: 147, stroke: 'var(--muted)', 'stroke-width': 1.6, 'stroke-dasharray': '4 5' });
    mk('path', { d: 'M194,40 L272,40 L286,54 L286,96 L194,96 Z', fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2 });
    tx(240, 64, 'pact', { class: 's-monob', 'text-anchor': 'middle' }); tx(240, 82, 'the contract', { class: 's-note', 'text-anchor': 'middle' });
    const env = token(152, 'var(--surface)'); env.set('{ amountCents: 9000 }');
    const verdict = tx(240, 222, '', { class: 's-grn', 'text-anchor': 'middle' }), sub = tx(240, 242, '', { class: 's-note', 'text-anchor': 'middle' });
    const stamp = mk('g', { opacity: 0 }); mk('rect', { x: 150, y: 256, width: 180, height: 30, rx: 10, fill: 'var(--bad-soft)', stroke: 'var(--bad)', 'stroke-width': 2 }, stamp); tx(240, 276, 'deploy blocked', { class: 's-red', 'text-anchor': 'middle' }, stamp);
    loop((t) => {
      const T = t % 9, renamed = T > 4.4;
      ps.textContent = renamed ? 'now reads amount' : 'reads amountCents'; ps.setAttribute('class', renamed ? 's-red' : 's-note s-ink');
      const lap = T < 4.4 ? seg(T, 0.4, 2.2) : seg(T, 4.8, 6.6);
      env.at(lerp(150, 182, lap), 147, (T > 0.3 && T < 2.8) || (T > 4.7 && T < 7.2) ? 1 : 0);
      if (T < 2.4) { verdict.textContent = ''; sub.textContent = ''; }
      else if (T < 4.4) { verdict.textContent = '✓ contract replayed: 201 Created'; verdict.setAttribute('class', 's-grn'); sub.textContent = 'Payments CI checks the pact on every build'; }
      else if (T < 6.8) { verdict.textContent = ''; sub.textContent = 'Payments renames the field…'; }
      else { verdict.textContent = '✗ contract replayed: 400 Bad Request'; verdict.setAttribute('class', 's-red'); sub.textContent = 'caught in Payments CI, before deploy'; }
      stamp.setAttribute('opacity', T > 7.2 ? 1 : 0);
    });
  },

  ci(k) {
    const { mk, tx, loop, lerp, seg } = k;
    const st = [['Lint + unit', 'every push', '~1 min'], ['Integration', 'every push', '~4 min'], ['Smoke E2E', 'before merge', '~1.5 min'], ['Full E2E', 'nightly', '~7 min']];
    const fills = ['var(--l1)', 'var(--l2)', 'var(--l3)', 'var(--l3)'];
    mk('rect', { x: 14, y: 30, width: 92, height: 28, rx: 14, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2 }); tx(60, 49, 'git push', { class: 's-mono', 'text-anchor': 'middle' });
    mk('line', { x1: 12, x2: 468, y1: 150, y2: 150, stroke: 'var(--muted)', 'stroke-width': 2, 'stroke-dasharray': '5 5' });
    const boxes = st.map((s, i) => {
      const x = 12 + i * 116, g = mk('g');
      const r = mk('rect', { x, y: 104, width: 108, height: 92, rx: 12, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.2, 'stroke-dasharray': i === 3 ? '6 4' : 'none' }, g);
      tx(x + 54, 130, s[0], { class: 's-lbl', 'text-anchor': 'middle' }, g); tx(x + 54, 150, s[1], { class: 's-note', 'text-anchor': 'middle' }, g); tx(x + 54, 166, s[2], { class: 's-note', 'text-anchor': 'middle' }, g);
      const bar = mk('rect', { x: x + 10, y: 176, width: 0, height: 8, rx: 4, fill: fills[i] }, g);
      const okT = tx(x + 98, 186, '', { class: 's-grn', 'text-anchor': 'end' }, g);
      return { r, bar, okT };
    });
    const dot = mk('circle', { r: 9, fill: 'var(--amber)', stroke: 'var(--ink)', 'stroke-width': 2 });
    tx(240, 236, 'fast, cheap checks first  →  wider, slower checks later', { class: 's-note s-ink', 'text-anchor': 'middle' });
    const moon = tx(240, 268, '', { class: 's-note', 'text-anchor': 'middle' });
    loop((t) => {
      const T = t % 9, cur = Math.min(3, Math.floor(T / 2)), p = (T % 2) / 2;
      boxes.forEach((b, j) => { const done = j < cur || (j === 3 && T > 7.9), now = j === cur && !done; b.bar.setAttribute('width', done ? 72 : now ? 72 * seg(p, 0, 0.9) : 0); b.okT.textContent = done ? '✓' : ''; b.r.style.fill = done ? 'var(--ok-soft)' : 'var(--surface)'; });
      dot.setAttribute('cx', lerp(60, 66 + cur * 116, T < 0.5 ? T * 2 : 1)); dot.setAttribute('cy', T < 0.5 ? lerp(58, 104, T * 2) : 104);
      moon.textContent = cur === 3 ? 'full E2E runs tonight and does not block the merge' : '';
    });
  },

  shapes(k) {
    const { mk, tx } = k;
    // Legend in two rows so the longer labels fit at phone sizes.
    [['var(--l0)', 'static checks', 60, 14], ['var(--l1)', 'unit / detail', 270, 14], ['var(--l2)', 'integration', 60, 36], ['var(--l3)', 'E2E / integrated', 270, 36]].forEach(([f, t, x, y]) => {
      mk('rect', { x, y, width: 12, height: 12, rx: 3, fill: f, stroke: 'var(--ink)', 'stroke-width': 1.5 }); tx(x + 18, y + 10, t, { class: 's-note s-ink' });
    });
    tx(240, 74, 'width = share of tests in each layer', { class: 's-note', 'text-anchor': 'middle' });
    mk('line', { x1: 10, x2: 470, y1: 255, y2: 255, stroke: 'var(--ink)', 'stroke-width': 2 });
    const col = (cx, name, parts) => {
      let y = 252;
      for (const [w, h, f, hex] of parts) {
        y -= h;
        if (hex) mk('path', { d: `M${cx - w / 2 + 14},${y} L${cx + w / 2 - 14},${y} L${cx + w / 2},${y + h / 2} L${cx + w / 2 - 14},${y + h} L${cx - w / 2 + 14},${y + h} L${cx - w / 2},${y + h / 2} Z`, fill: f, stroke: 'var(--ink)', 'stroke-width': 2.2, 'stroke-linejoin': 'round' });
        else mk('rect', { x: cx - w / 2, y, width: w, height: h - 3, rx: 6, fill: f, stroke: 'var(--ink)', 'stroke-width': 2.2 });
      }
      tx(cx, 280, name, { class: 's-lbl', 'text-anchor': 'middle' });
    };
    col(82, 'Pyramid', [[140, 54, 'var(--l1)'], [84, 42, 'var(--l2)'], [36, 34, 'var(--l3)']]);
    col(240, 'Trophy', [[96, 26, 'var(--l0)'], [56, 34, 'var(--l1)'], [140, 62, 'var(--l2)'], [46, 30, 'var(--l3)']]);
    col(398, 'Honeycomb', [[48, 28, 'var(--l1)'], [140, 86, 'var(--l2)', 1], [48, 28, 'var(--l3)']]);
  },

  flaky(k) {
    const { mk, tx, loop } = k;
    tx(240, 34, 'Same code, same test, 20 runs', { class: 's-cap', 'text-anchor': 'middle' });
    const fails = new Set([5, 12, 17]);
    const dots = [...Array(20)].map((_, i) => {
      const x = 60 + (i % 10) * 40, y = 96 + Math.floor(i / 10) * 56;
      const c = mk('circle', { cx: x, cy: y, r: 15, fill: 'var(--surface-2)', stroke: 'var(--line)', 'stroke-width': 2 });
      const s = tx(x, y + 5, '', { class: 's-monob s-white', 'text-anchor': 'middle' });
      tx(x, y + 30, `#${i + 1}`, { class: 's-note', 'text-anchor': 'middle' });
      return { c, s };
    });
    const tally = tx(240, 236, '', { class: 's-big', 'text-anchor': 'middle' }), why = tx(240, 262, '', { class: 's-note s-ink', 'text-anchor': 'middle' });
    loop((t) => {
      const n = Math.min(20, Math.floor((t % 9) / 0.3));
      let p = 0, f = 0;
      dots.forEach((d, i) => {
        const on = i < n, bad = fails.has(i);
        if (on) { if (bad) f++; else p++; }
        d.c.style.fill = on ? (bad ? 'var(--bad)' : 'var(--ok)') : 'var(--surface-2)'; d.c.style.stroke = on ? 'var(--ink)' : 'var(--line)';
        d.s.textContent = on ? (bad ? '✗' : '✓') : '';
      });
      tally.textContent = n ? `${p} passed · ${f} failed` : '';
      why.textContent = n >= 20 ? 'nothing changed between runs, so the test itself is unreliable' : '';
    });
  },
};

/**
 * The "mix your suite" model: 1,000 tests, 200 of them integration; pc% end-to-end, the rest unit.
 * Unit 5 ms, integration 300 ms, end-to-end 10 s each, run one after another.
 * One end-to-end run in 500 and one integration run in 5,000 fail randomly; 20 runs a week.
 */
export function suiteCost(unit, integration, e2e) {
  const seconds = unit * 0.005 + integration * 0.3 + e2e * 10;
  return { minutes: seconds / 60, flaky: (e2e / 500 + integration / 5000) * 20 };
}
export function mixModel(pc) {
  const e2e = pc * 10, integration = 200, unit = 1000 - e2e - integration;
  const shape = e2e < integration ? 'Pyramid' : e2e < unit ? 'Top-heavy' : 'Ice-cream cone';
  return { e2e, integration, unit, ...suiteCost(unit, integration, e2e), shape };
}
