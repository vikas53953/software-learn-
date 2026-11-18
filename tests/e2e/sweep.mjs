// End-to-end sweep against a running build (BASE_URL, default http://localhost:4173).
// Steps through every lesson and checks layout and behaviour in a real browser.
// Set EVIDENCE=<dir> to save screenshots of each lesson's first and last step.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { LESSONS } from '../../src/content/index.js';

// Every step of every lesson must be swept; the count comes from the content itself.
const TOTAL = LESSONS.reduce((n, l) => n + l.steps.length, 0);

const BASE = process.env.BASE_URL || 'http://localhost:4173/';
const EV = process.env.EVIDENCE;
if (EV) mkdirSync(EV, { recursive: true });
const problems = [];
const fail = (m) => problems.push(m);

// SWEEP_PROXY lets a sandboxed machine reach the web fonts through an HTTPS proxy.
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  ...(process.env.SWEEP_PROXY ? { proxy: { server: process.env.SWEEP_PROXY, bypass: 'localhost,127.0.0.1' } } : {}),
});

async function page(viewport, colorScheme = 'light') {
  const ctx = await browser.newContext({ viewport, colorScheme, ignoreHTTPSErrors: !!process.env.SWEEP_PROXY });
  const p = await ctx.newPage();
  // Hold web font files back so diagrams first render with fallback fonts and must re-measure on swap.
  await p.route(/fonts\.gstatic\.com/, async (r) => { await new Promise((ok) => setTimeout(ok, 1500)); await r.continue().catch(() => {}); });
  p.on('pageerror', (e) => fail(`page error: ${e.message}`));
  p.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    if (/fonts\.g(oogleapis|static)/.test(`${m.text()} ${m.location().url}`)) return; // web fonts may be offline
    fail(`console ${m.type()}: ${m.text()}`);
  });
  return p;
}

// Layout checks for the current step, run inside the page.
const layout = () => {
  const out = [];
  // Diagram nodes and the compact map nodes (src/mapscene.js) get the same checks.
  const nodes = [...document.querySelectorAll('.node:not(.is-hidden), .map-node')].map((g) => ({ id: g.dataset.id, r: g.querySelector('.node-body, .map-body').getBoundingClientRect(), g }));
  for (let a = 0; a < nodes.length; a++) for (let c = a + 1; c < nodes.length; c++) {
    const A = nodes[a].r, C = nodes[c].r;
    if (Math.min(A.right, C.right) - Math.max(A.left, C.left) > 2 && Math.min(A.bottom, C.bottom) - Math.max(A.top, C.top) > 2) out.push(`nodes overlap: ${nodes[a].id} / ${nodes[c].id}`);
  }
  for (const n of nodes) n.g.querySelectorAll('.node-label, .node-sub, .m-lbl, .m-sub').forEach((t) => {
    if (t.style.display === 'none') return;
    const tr = t.getBoundingClientRect(), b = n.r;
    if (tr.width && (tr.right > b.right + 1 || tr.left < b.left - 1 || tr.top < b.top - 1 || tr.bottom > b.bottom + 1)) out.push(`text overflows ${n.id}: "${t.textContent}" (text ${tr.left.toFixed(1)}..${tr.right.toFixed(1)}, box ${b.left.toFixed(1)}..${b.right.toFixed(1)}, textLength ${[...t.querySelectorAll('tspan')].map((x) => x.getAttribute('textLength') || '-').join('/')}, measured ${[...t.querySelectorAll('tspan')].map((x) => x.getComputedTextLength().toFixed(1)).join('/')}, font "${getComputedStyle(t).fontFamily}", fonts ${document.fonts.status})`);
  });
  document.querySelectorAll('.edge-label:not(.is-leaving), .map-elbl').forEach((l) => {
    const lr = l.getBoundingClientRect();
    for (const n of nodes) { const R = n.r; if (lr.right > R.left + 2 && lr.left < R.right - 2 && lr.bottom > R.top + 2 && lr.top < R.bottom - 2) out.push(`edge label "${l.textContent}" covers ${n.id}`); }
  });
  const scene = document.querySelector('.lp-scene');
  if (scene?.isConnected) {
    const R = scene.getBoundingClientRect();
    scene.querySelectorAll('text').forEach((t) => { const r = t.getBoundingClientRect(); if (r.width && t.getAttribute('opacity') !== '0' && (r.left < R.left - 1 || r.right > R.right + 1 || r.top < R.top - 1 || r.bottom > R.bottom + 1)) out.push(`scene text outside the diagram: "${t.textContent}"`); });
    // A shape built with a fill or stroke must keep it: overwriting its style attribute wipes var() colours (black boxes, lost outlines).
    scene.querySelectorAll('rect, circle, path, polygon').forEach((s) => {
      if (s.closest('marker, defs')) return;
      const cs = getComputedStyle(s), made = s.dataset.paint || '';
      if (made.includes('f') && cs.fill === 'rgb(0, 0, 0)') out.push(`scene shape lost its fill (${s.tagName} ${s.getAttribute('class') || ''})`);
      if (made.includes('s') && cs.stroke === 'none') out.push(`scene shape lost its outline (${s.tagName} ${s.getAttribute('class') || ''})`);
    });
  }
  const canvas = document.querySelector('.lp-canvas.is-diagram'), svg = canvas?.querySelector('.stage-svg');
  if (svg && svg.getBoundingClientRect().right > canvas.getBoundingClientRect().right + 1) out.push('diagram is wider than its frame (nodes cropped)');
  document.querySelectorAll('.lp-tile b, .lp-tile span').forEach((t) => { if (t.offsetParent && t.scrollWidth > t.clientWidth + 1) out.push(`tile text is clipped: "${t.textContent}"`); });
  if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`page scrolls sideways (${document.documentElement.scrollWidth}px > ${window.innerWidth}px)`);
  return out;
};

// 1. Every step of every lesson, desktop. Steps are opened from the progress bar (checks lock → until answered).
const p = await page({ width: 1440, height: 900 });
await p.goto(BASE);
const hrefs = await p.$$eval('.module li a', (as) => as.map((a) => a.getAttribute('href')));
if (hrefs.length < 16) fail(`expected 16 lessons on the home page, found ${hrefs.length}`);
let steps = 0;
for (const href of hrefs) {
  const slug = href.split('/')[1];
  await p.goto(new URL(href, BASE).href);
  await p.waitForTimeout(150);
  const n = await p.$$eval('.lp-seg', (l) => l.length);
  if (!(await p.isVisible('.lp-defn .big'))) fail(`${slug}: no definition on the lesson's first screen`);
  if (EV) await p.screenshot({ path: `${EV}/${slug}-first.png` });
  for (let i = 0; i < n; i++) {
    const isCheck = await p.$eval(`.lp-seg[data-seg="${i}"]`, (b) => b.classList.contains('check'));
    if (i && !isCheck && !(await p.$eval(`.lp-seg[data-seg="${i - 1}"]`, (b) => b.classList.contains('check')))) await p.keyboard.press('ArrowRight');
    else await p.click(`.lp-seg[data-seg="${i}"]`);
    await p.waitForTimeout(450);
    steps++;
    const hash = await p.evaluate(() => location.hash);
    if (hash !== `#/${slug}/${i + 1}`) fail(`${slug}: step ${i + 1} shows URL ${hash}`);
    for (const x of await p.evaluate(layout)) fail(`${slug} step ${i + 1}: ${x}`);
  }
  if (EV) await p.screenshot({ path: `${EV}/${slug}-last.png` });
}
if (steps !== TOTAL) fail(`expected ${TOTAL} steps, swept ${steps}`);

// 2. Search, theme, drawer, Play, definition, glossary, checks, slider, finish.
await p.goto(BASE + '#/single-responsibility/1');
await p.keyboard.press('Control+k');
await p.keyboard.type('canary');
await p.keyboard.press('Enter');
await p.waitForTimeout(200);
if (!(await p.evaluate(() => location.hash)).startsWith('#/deployment-strategies/')) fail('search for "canary" did not open the deployment lesson');
const before = await p.evaluate(() => document.documentElement.dataset.theme || 'light');
await p.click('[data-action="theme"]');
const after = await p.evaluate(() => document.documentElement.dataset.theme);
if (after === before) fail('theme toggle did not change the theme');
await p.click('[data-action="menu"]');
if (!(await p.isVisible('#drawer'))) fail('course menu did not open');
await p.keyboard.press('Escape');

await p.goto(BASE + '#/test-pyramid/1');
await p.waitForTimeout(300);
await p.click('[data-lp="start-play"]');
await p.waitForTimeout(1500);
if ((await p.getAttribute('.lp-player [data-lp="play"]', 'aria-label')) !== 'Pause') fail('Play the explainer did not start playing');
if (!(await p.evaluate(() => parseFloat(document.querySelector('.lp-scrub i').style.width) > 0))) fail('Play: the progress bar did not move');
if (!(await p.isVisible('.lp-defn-mini'))) fail('definition did not collapse to a strip once the lesson started');
await p.click('.lp-player [data-lp="play"]');
if ((await p.getAttribute('.lp-player [data-lp="play"]', 'aria-label')) !== 'Play') fail('Pause did not stop playing');
await p.click('.lp-card .term-btn');
if (!(await p.isVisible('.lp-pop'))) fail('tapping a glossary word did not show its definition');

await p.goto(BASE + '#/test-pyramid/6');
await p.waitForTimeout(300);
if (!(await p.isDisabled('.lp-card [data-lp="next"]'))) fail('Next is not locked on an unanswered check');
await p.click('.lp-opt[data-opt="0"]'); await p.click('[data-lp="check"]');
await p.waitForTimeout(300);
if (!/applyDiscount|discount math|calculation/.test(await p.textContent('.lp-fb p'))) fail('a wrong answer did not show that option\'s hint');
await p.click('[data-lp="fb"]');
await p.click('.lp-opt[data-opt="1"]'); await p.click('[data-lp="check"]');
await p.waitForTimeout(300);
if ((await p.textContent('.lp-xp')) !== '5') fail(`a right answer after a retry should give 5 XP, got ${await p.textContent('.lp-xp')}`);
await p.click('[data-lp="fb"]');
await p.waitForTimeout(300);
if ((await p.evaluate(() => location.hash)) !== '#/test-pyramid/7') fail('Continue after a right answer did not move on');

await p.goto(BASE + '#/test-pyramid/8');
await p.waitForTimeout(300);
await p.$eval('#lp-range', (r) => { r.dispatchEvent(new Event('pointerdown')); r.value = '60'; r.dispatchEvent(new Event('input')); });
await p.waitForTimeout(200);
if (!/cone/i.test(await p.textContent('.lp-readout .lp-tile[data-k="2"] b'))) fail('slider at 60% did not turn the suite into an ice-cream cone');

await p.goto(BASE + '#/test-pyramid/19');
await p.waitForTimeout(300);
await p.click('.lp-opt[data-opt="1"]'); await p.click('[data-lp="check"]');
await p.click('[data-lp="fb"]');
await p.waitForTimeout(400);
if (!(await p.isVisible('.lp-finish'))) fail('the last check did not lead to the finish card');
// The last step of the TDD lesson, whatever its length; ArrowRight on it finishes the lesson.
await p.goto(BASE + `#/tdd/${LESSONS.find((l) => l.slug === 'tdd').steps.length}`);
await p.waitForTimeout(300);
await p.keyboard.press('ArrowRight');
await p.waitForTimeout(300);
await p.click('.lp-finish a.go');
await p.waitForTimeout(300);
if (!(await p.evaluate(() => location.hash)).startsWith('#/ci-pipeline/1')) fail('the finish card did not open the next lesson');

// 2a. Lesson-specific wording stays in its lesson, and feedback renders markdown (verifier survivors on #4).
{
  const srp = LESSONS.find((l) => l.slug === 'single-responsibility'), mi = srp.steps.findIndex((s) => s.check?.type === 'match');
  const mc = srp.steps[mi].check;
  await p.goto(BASE + `#/single-responsibility/${mi + 1}`); await p.waitForTimeout(300);
  for (const [k, b] of mc.bugs.entries()) await p.click(`.bug[data-bug="${k}"] .lp-bin[data-bin="${(b.a + 1) % mc.bins.length}"]`);
  await p.click('[data-lp="check"]'); await p.waitForTimeout(200);
  if (/smallest thing that has to run/.test(await p.textContent('.lp-fb p'))) fail('a pyramid-only hint shows on the SRP match check');
  const lsp = LESSONS.find((l) => l.slug === 'liskov-substitution'), ci = lsp.steps.findIndex((s) => s.check && /`/.test(s.check.why));
  await p.goto(BASE + `#/liskov-substitution/${ci + 1}`); await p.waitForTimeout(300);
  await p.click(`.lp-opt[data-opt="${lsp.steps[ci].check.ans}"]`); await p.click('[data-lp="check"]'); await p.waitForTimeout(200);
  const fbp = await p.$eval('.lp-fb p', (e) => [e.textContent, e.querySelectorAll('code').length]);
  if (fbp[0].includes('`') || !fbp[1]) fail(`feedback shows raw markdown: "${fbp[0].slice(0, 80)}"`);
  // A wrong prediction shows the option's feedback and then the explanation, with a space between (verifier note on #6).
  const dbl = LESSONS.find((l) => l.slug === 'test-doubles'), pi = dbl.steps.findIndex((s) => s.check?.type === 'predict');
  const pc = dbl.steps[pi].check, wrong = pc.opts.findIndex((_, k) => k !== pc.ans && pc.fb[k]);
  await p.goto(BASE + `#/test-doubles/${pi + 1}`); await p.waitForTimeout(300);
  await p.click(`.lp-opt[data-opt="${wrong}"]`); await p.click('[data-lp="check"]'); await p.waitForTimeout(200);
  const pf = await p.textContent('.lp-fb p');
  if (/[a-z]\.[A-Z]/.test(pf)) fail(`predict feedback runs two sentences together: "${pf.slice(0, 90)}"`);
}

// 2b. Play with Voice on keeps going whether speech ends early, late or never (a browser with no voices never ends it).
for (const mode of ['ends', 'never']) {
  const v = await page({ width: 1440, height: 900 });
  await v.addInitScript((m) => {
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(window, 'speechSynthesis', { value: { cancel() {}, speak(u) { if (m === 'ends') setTimeout(() => u.onend?.(), 300); } } });
  }, mode);
  await v.goto(BASE + '#/test-pyramid/2');
  await v.waitForTimeout(300);
  await v.click('.lp-player [data-lp="voice"]');
  await v.click('.lp-player [data-lp="speed"]'); // 1.5×
  await v.click('.lp-player [data-lp="play"]');
  const moved = await v.waitForFunction(() => location.hash !== '#/test-pyramid/2', null, { timeout: 45000 }).then(() => true, () => false);
  if (!moved) fail(`Play with voice (speech ${mode}) stalled on step 2`);
  await v.context().close();
}

// 3. Phone width, dark theme.
const m = await page({ width: 390, height: 844 }, 'dark');
await m.goto(BASE + '#/test-pyramid/2');
await m.waitForTimeout(400);
if (!(await m.isVisible('.lp-dock'))) fail('phone: bottom dock is not visible');
await m.click('.lp-dnext');
await m.waitForTimeout(500);
if ((await m.evaluate(() => location.hash)) !== '#/test-pyramid/3') fail('phone: Next in the dock did not advance');
const gap = await m.evaluate(() => Math.round(document.querySelector('.lp-card').getBoundingClientRect().top - document.querySelector('.lp-stage').getBoundingClientRect().bottom));
if (gap < 0) fail(`phone: the lesson card is hidden under the diagram (${gap}px)`);
if ((await m.evaluate(() => document.documentElement.scrollWidth)) > 391) fail('phone: page scrolls sideways');
if (EV) await m.screenshot({ path: `${EV}/phone-dark.png` });
await m.goto(BASE);
if ((await m.evaluate(() => document.documentElement.scrollWidth)) > 391) fail('phone: home page scrolls sideways');

// 4. Every step of every lesson on a phone (touch, dark, reduced motion): sideways scroll, cropped diagrams, clipped tiles, scene paint.
const ph = await (await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true, reducedMotion: 'reduce' })).newPage();
// Reduced motion makes each scene draw its end state at once, so colour changes made late in an animation are checked too.
ph.on('pageerror', (e) => fail(`phone page error: ${e.message}`));
let phoneSteps = 0;
for (const href of hrefs) {
  const slug = href.split('/')[1];
  await ph.goto(new URL(href, BASE).href);
  await ph.waitForTimeout(150);
  const n = await ph.$$eval('.lp-seg', (l) => l.length);
  for (let i = 1; i <= n; i++) {
    await ph.goto(new URL(`#/${slug}/${i}`, BASE).href);
    await ph.waitForTimeout(350);
    phoneSteps++;
    if ((await ph.evaluate(() => document.documentElement.scrollWidth)) > 391) fail(`phone ${slug} step ${i}: page scrolls sideways`);
    for (const x of await ph.evaluate(layout)) if (!x.startsWith('page scrolls')) fail(`phone ${slug} step ${i}: ${x}`);
  }
}
if (phoneSteps !== TOTAL) fail(`phone: expected ${TOTAL} steps, swept ${phoneSteps}`);

await browser.close();
console.log(`swept ${hrefs.length} lessons, ${steps} steps`);
if (problems.length) { console.error(problems.map((x) => `✗ ${x}`).join('\n')); process.exit(1); }
console.log('✓ no problems');
