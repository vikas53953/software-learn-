// End-to-end sweep against a running build (BASE_URL, default http://localhost:4173).
// Steps through every lesson and checks layout and behaviour in a real browser.
// Set EVIDENCE=<dir> to save screenshots of each lesson's first and last step.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

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
    if (/fonts\.g(oogleapis|static)|Failed to load resource/.test(m.text())) return; // fonts may be offline in CI
    fail(`console ${m.type()}: ${m.text()}`);
  });
  return p;
}

// Layout checks for the current step, run inside the page.
const layout = () => {
  const out = [];
  const nodes = [...document.querySelectorAll('.node:not(.is-hidden)')].map((g) => ({ id: g.dataset.id, r: g.querySelector('.node-body').getBoundingClientRect(), g }));
  for (let a = 0; a < nodes.length; a++) for (let c = a + 1; c < nodes.length; c++) {
    const A = nodes[a].r, C = nodes[c].r;
    if (Math.min(A.right, C.right) - Math.max(A.left, C.left) > 2 && Math.min(A.bottom, C.bottom) - Math.max(A.top, C.top) > 2) out.push(`nodes overlap: ${nodes[a].id} / ${nodes[c].id}`);
  }
  for (const n of nodes) n.g.querySelectorAll('.node-label, .node-sub').forEach((t) => {
    if (t.style.display === 'none') return;
    const tr = t.getBoundingClientRect(), b = n.r;
    if (tr.width && (tr.right > b.right + 1 || tr.left < b.left - 1 || tr.top < b.top - 1 || tr.bottom > b.bottom + 1)) out.push(`text overflows ${n.id}: "${t.textContent}" (text ${tr.left.toFixed(1)}..${tr.right.toFixed(1)}, box ${b.left.toFixed(1)}..${b.right.toFixed(1)}, textLength ${[...t.querySelectorAll('tspan')].map((x) => x.getAttribute('textLength') || '-').join('/')}, measured ${[...t.querySelectorAll('tspan')].map((x) => x.getComputedTextLength().toFixed(1)).join('/')}, font "${getComputedStyle(t).fontFamily}", fonts ${document.fonts.status})`);
  });
  document.querySelectorAll('.edge-label:not(.is-leaving)').forEach((l) => {
    const lr = l.getBoundingClientRect();
    for (const n of nodes) { const R = n.r; if (lr.right > R.left + 2 && lr.left < R.right - 2 && lr.bottom > R.top + 2 && lr.top < R.bottom - 2) out.push(`edge label "${l.textContent}" covers ${n.id}`); }
  });
  if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`page scrolls sideways (${document.documentElement.scrollWidth}px > ${window.innerWidth}px)`);
  return out;
};

// 1. Every step of every lesson, desktop.
const p = await page({ width: 1440, height: 900 });
await p.goto(BASE);
const hrefs = await p.$$eval('.module li a', (as) => as.map((a) => a.getAttribute('href')));
if (hrefs.length < 16) fail(`expected 16 lessons on the home page, found ${hrefs.length}`);
let steps = 0;
for (const href of hrefs) {
  const slug = href.split('/')[1];
  await p.goto(new URL(href, BASE).href);
  await p.waitForTimeout(150);
  const n = await p.$$eval('.dots li', (l) => l.length);
  if (EV) await p.screenshot({ path: `${EV}/${slug}-first.png` });
  for (let i = 0; i < n; i++) {
    if (i) await p.keyboard.press('ArrowRight');
    await p.waitForTimeout(400);
    steps++;
    const hash = await p.evaluate(() => location.hash);
    if (hash !== `#/${slug}/${i + 1}`) fail(`${slug}: after ${i} presses of → the URL is ${hash}`);
    for (const x of await p.evaluate(layout)) fail(`${slug} step ${i + 1}: ${x}`);
  }
  if (EV) await p.screenshot({ path: `${EV}/${slug}-last.png` });
}
if (steps !== 111) fail(`expected 111 steps, swept ${steps}`);

// 2. Search, theme, drawer, replay/pause.
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
await p.click('[data-action="pause"]');
if ((await p.getAttribute('[data-action="pause"]', 'aria-pressed')) !== 'true') fail('pause button did not toggle');
await p.goto(BASE + '#/tdd/8');
await p.waitForTimeout(200);
await p.keyboard.press('ArrowRight');
await p.waitForTimeout(200);
if (!(await p.evaluate(() => location.hash)).startsWith('#/ci-pipeline/1')) fail('→ on the last step did not open the next lesson');

// 3. Phone width, dark theme.
const m = await page({ width: 390, height: 844 }, 'dark');
await m.goto(BASE + '#/race-conditions/1');
await m.waitForTimeout(300);
if (!(await m.isVisible('.mobile-nav'))) fail('phone: bottom navigation is not visible');
await m.click('.mobile-nav [data-action="next"]');
await m.waitForTimeout(300);
if ((await m.evaluate(() => location.hash)) !== '#/race-conditions/2') fail('phone: Next button did not advance');
if ((await m.evaluate(() => document.documentElement.scrollWidth)) > 391) fail('phone: page scrolls sideways');
if (EV) await m.screenshot({ path: `${EV}/phone-dark.png`, fullPage: true });
await m.goto(BASE);
if ((await m.evaluate(() => document.documentElement.scrollWidth)) > 391) fail('phone: home page scrolls sideways');

await browser.close();
console.log(`swept ${hrefs.length} lessons, ${steps} steps`);
if (problems.length) { console.error(problems.map((x) => `✗ ${x}`).join('\n')); process.exit(1); }
console.log('✓ no problems');
