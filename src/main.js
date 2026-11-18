import './styles.css';
import { MODULES, LESSONS, bySlug } from './content/index.js';
import { Diagram } from './diagram.js';
import { icon } from './icons.js';
import { esc } from './text.js';
import { mountLesson } from './player.js';

const app = document.getElementById('app');

// ---------- persistence (all access guarded: private mode / blocked storage) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const progress = store.get('lb:progress', {});
const markSeen = (lesson, i) => {
  if ((progress[lesson.slug] ?? -1) < i) { progress[lesson.slug] = i; store.set('lb:progress', progress); }
};
const lessonPct = (l) => Math.round((((progress[l.slug] ?? -1) + 1) / l.steps.length) * 100);

// ---------- helpers ----------
const pad = (n) => String(n).padStart(2, '0');
const totalSteps = LESSONS.reduce((a, l) => a + l.steps.length, 0);
const totalMinutes = LESSONS.reduce((a, l) => a + l.minutes, 0);

// ---------- theme ----------
const currentTheme = () => document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('lb:theme', next); } catch { /* ignore */ }
  syncThemeButton();
}
function syncThemeButton() {
  const b = document.querySelector('[data-action="theme"]');
  if (!b) return;
  const dark = currentTheme() === 'dark';
  b.innerHTML = icon(dark ? 'sun' : 'moon');
  b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}

// ---------- shell ----------
const logo = `<svg class="logo" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="22" width="28" height="7" rx="2" class="pm-1"/><rect x="6" y="14" width="20" height="7" rx="2" class="pm-2"/><rect x="10" y="6" width="12" height="7" rx="2" class="pm-3"/></svg>`;

app.innerHTML = `
  <header class="topbar">
    <button class="icon-btn" data-action="menu" aria-label="Open the course menu" aria-expanded="false" aria-controls="drawer">${icon('menu')}</button>
    <a class="brand" href="#/" aria-label="Load-Bearing home">${logo}<span>Load<span class="brand-dash">-</span>Bearing</span></a>
    <div class="topbar-spacer"></div>
    <button class="search-btn" data-action="search" aria-label="Search lessons">${icon('search', 16)}<span>Search lessons…</span><kbd>Ctrl K</kbd></button>
    <button class="icon-btn" data-action="theme" aria-label="Switch theme"></button>
  </header>
  <div class="scrim" data-action="close-drawer" hidden></div>
  <nav class="drawer" id="drawer" aria-label="Course" hidden></nav>
  <main id="main" tabindex="-1"></main>
  <div class="search" role="dialog" aria-modal="true" aria-label="Search the course" hidden>
    <div class="search-panel">
      <div class="search-input">${icon('search', 18)}<input type="search" placeholder="Search lessons and concepts…" aria-label="Search" autocomplete="off" spellcheck="false" /><button class="icon-btn sm" data-action="close-search" aria-label="Close search">${icon('close', 16)}</button></div>
      <ul class="search-results" role="listbox"></ul>
      <div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
    </div>
  </div>
`;
syncThemeButton();
const main = document.getElementById('main');
const drawer = document.getElementById('drawer');
const scrim = document.querySelector('.scrim');

function renderDrawer(activeSlug) {
  drawer.innerHTML = `
    <div class="drawer-head"><strong>Course</strong><button class="icon-btn sm" data-action="close-drawer" aria-label="Close the course menu">${icon('close', 16)}</button></div>
    <a class="drawer-home" href="#/">${icon('home', 16)} Overview</a>
    ${MODULES.map((m, mi) => `
      <div class="drawer-module">
        <div class="drawer-module-name"><span>${pad(mi + 1)}</span>${esc(m.name)}</div>
        <ul>${m.lessons.map((l) => `
          <li><a href="#/${l.slug}/1" class="${l.slug === activeSlug ? 'is-active' : ''}" ${l.slug === activeSlug ? 'aria-current="page"' : ''}>
            <span class="ring" style="--p:${lessonPct(l)}"></span><span>${esc(l.short)}</span></a></li>`).join('')}
        </ul>
      </div>`).join('')}`;
}
function openDrawer(open) {
  renderDrawer(state.lesson?.slug);
  drawer.hidden = !open; scrim.hidden = !open;
  document.querySelector('[data-action="menu"]').setAttribute('aria-expanded', String(open));
  if (open) drawer.querySelector('a.is-active, a')?.focus();
}

// ---------- search ----------
const searchEl = document.querySelector('.search');
const searchInput = searchEl.querySelector('input');
const resultsEl = searchEl.querySelector('.search-results');
const INDEX = LESSONS.flatMap((l) => [
  { kind: 'lesson', l, step: 0, title: l.title, sub: `${l.module.name} · ${l.short}`, text: `${l.title} ${l.short} ${l.promise} ${l.module.name} ${l.learn.join(' ')}`.toLowerCase() },
  ...l.steps.map((s, i) => ({ kind: 'step', l, step: i, title: s.title, sub: `${l.short} · step ${i + 1}`, text: `${s.title} ${s.label} ${(s.body || []).join(' ')} ${l.short}`.toLowerCase() })),
]);
let searchSel = 0, searchHits = [];
function runSearch() {
  const q = searchInput.value.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  searchHits = (terms.length ? INDEX.filter((e) => terms.every((t) => e.text.includes(t)))
    .sort((a, b) => (b.title.toLowerCase().includes(terms[0]) - a.title.toLowerCase().includes(terms[0])) || (a.kind === 'lesson' ? -1 : 1))
    : INDEX.filter((e) => e.kind === 'lesson')).slice(0, 12);
  searchSel = 0;
  resultsEl.innerHTML = searchHits.length ? searchHits.map((h, i) => `
    <li role="option" id="sr-${i}" aria-selected="${i === 0}"><a href="#/${h.l.slug}/${h.step + 1}">
      ${icon(h.kind === 'lesson' ? h.l.module.icon : 'right', 16)}<span><strong>${esc(h.title)}</strong><small>${esc(h.sub)}</small></span></a></li>`).join('')
    : `<li class="empty">No matches for “${esc(q)}”. Try “lock”, “mock” or “canary”.</li>`;
}
function moveSel(d) {
  if (!searchHits.length) return;
  searchSel = (searchSel + d + searchHits.length) % searchHits.length;
  resultsEl.querySelectorAll('li[role=option]').forEach((li, i) => li.setAttribute('aria-selected', String(i === searchSel)));
  resultsEl.querySelector(`#sr-${searchSel}`)?.scrollIntoView({ block: 'nearest' });
}
function openSearch(open) {
  searchEl.hidden = !open;
  if (open) { searchInput.value = ''; runSearch(); searchInput.focus(); }
}
searchInput.addEventListener('input', runSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
  else if (e.key === 'Enter' && searchHits[searchSel]) { e.preventDefault(); const h = searchHits[searchSel]; location.hash = `#/${h.l.slug}/${h.step + 1}`; openSearch(false); }
});
searchEl.addEventListener('click', (e) => { if (e.target === searchEl || e.target.closest('a')) openSearch(false); });

// ---------- state & routing ----------
const state = { lesson: null, player: null };

function parseHash() {
  const m = location.hash.match(/^#\/([a-z0-9-]+)(?:\/(\d+))?/);
  if (!m || !bySlug[m[1]]) return { view: 'home' };
  const l = bySlug[m[1]];
  const step = Math.min(Math.max(parseInt(m[2] || '1', 10) - 1, 0), l.steps.length - 1);
  return { view: 'lesson', lesson: l, step };
}

function route() {
  const r = parseHash();
  openDrawer(false);
  if (r.view === 'home') {
    teardownLesson();
    renderHome();
    document.title = 'Load-Bearing · Software engineering, one step at a time';
    return;
  }
  if (state.lesson !== r.lesson) { teardownLesson(); renderLesson(r.lesson, r.step); window.scrollTo(0, 0); return; }
  state.player.setStep(r.step);
}

function teardownLesson() {
  state.player?.destroy();
  state.player = null; state.lesson = null;
  document.body.classList.remove('in-lesson');
  if (heroDiagram) { heroDiagram.destroy(); heroDiagram = null; clearInterval(heroTimer); }
}

// ---------- home ----------
let heroDiagram = null, heroTimer = null;
const HERO = {
  slug: 'hero', title: 'Commit to production',
  nodes: {
    a: { x: 95, y: 120, label: 'Commit', icon: 'git', kind: 'svc', w: 120 },
    b: { x: 265, y: 120, label: 'Build', icon: 'gear', kind: 'stage', w: 120 },
    c: { x: 435, y: 120, label: 'Test', icon: 'test', kind: 'stage', w: 120 },
    d: { x: 605, y: 120, label: 'Scan', icon: 'shield', kind: 'stage', w: 120 },
    e: { x: 605, y: 330, label: 'Canary 5%', icon: 'server', kind: 'env-green', w: 140 },
    f: { x: 350, y: 330, label: 'Production', icon: 'cloud', kind: 'env', w: 140 },
  },
  steps: [
    { title: 'build', add: ['a', 'b', 'c', 'd', 'e', 'f'], edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f']], flows: [['a', 'b', { n: 1 }], ['b', 'c', { n: 1, delay: 0.25 }], ['c', 'd', { n: 1, delay: 0.5 }], ['d', 'e', { n: 1, delay: 0.75 }], ['e', 'f', { n: 1 }]], state: { b: 'hl' } },
    { title: 'test', state: { c: 'hl' } },
    { title: 'scan', state: { d: 'hl' } },
    { title: 'canary', state: { e: 'ok' } },
    { title: 'prod', state: { f: 'ok' } },
  ],
};

function renderHome() {
  const resume = LESSONS.find((l) => (progress[l.slug] ?? -1) >= 0 && (progress[l.slug] ?? -1) < l.steps.length - 1);
  const first = LESSONS[0];
  main.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">An interactive course</p>
        <h1>Software engineering,<br><span class="accent">one step at a time.</span></h1>
        <p class="lede">The principles that keep code standing under load: SOLID, design patterns, testing, delivery, concurrency and architecture. Each idea is a diagram you step through, with the code beside it.</p>
        <div class="hero-cta">
          <a class="btn primary" href="#/${(resume || first).slug}/${resume ? (progress[resume.slug] ?? 0) + 1 : 1}">${resume ? `Continue: ${esc(resume.short)}` : 'Start the course'} ${icon('right', 16)}</a>
          <button class="btn" data-action="scroll-modules">Browse modules</button>
        </div>
        <dl class="hero-stats">
          <div><dt>${LESSONS.length}</dt><dd>lessons</dd></div>
          <div><dt>${totalSteps}</dt><dd>steps</dd></div>
          <div><dt>${Math.round(totalMinutes / 6) / 10} h</dt><dd>total</dd></div>
        </dl>
      </div>
      <div class="hero-art card" aria-hidden="true"><div class="hero-diagram"></div></div>
    </section>
    <section class="modules" id="modules" aria-label="Modules">
      ${MODULES.map((m, mi) => `
        <article class="module card">
          <header><span class="module-num">${pad(mi + 1)}</span><span class="module-icon">${icon(m.icon, 20)}</span></header>
          <h2>${esc(m.name)}</h2>
          <p>${esc(m.blurb)}</p>
          <ol>${m.lessons.map((l) => `
            <li><a href="#/${l.slug}/1">
              <span class="ring" style="--p:${lessonPct(l)}"></span>
              <span class="lesson-link-text"><strong>${esc(l.short)}</strong><small>${esc(l.title)} · ${l.minutes} min · ${esc(l.level)}</small></span>
              ${icon('right', 16, 'chev')}</a></li>`).join('')}
          </ol>
        </article>`).join('')}
    </section>
    <section class="how card">
      <h2>How it works</h2>
      <div class="how-grid">
        <div>${icon('eye', 20)}<strong>Watch it fail first</strong><p>Every lesson opens with a real problem, so the fix has a reason.</p></div>
        <div>${icon('code', 20)}<strong>Code beside the diagram</strong><p>See the change in TypeScript, SQL or YAML as the picture changes.</p></div>
        <div>${icon('arrows', 20)}<strong>Step at your pace</strong><p>Use <kbd>←</kbd> <kbd>→</kbd> to step, <kbd>R</kbd> to replay, <kbd>Space</kbd> to pause. Every step has its own link.</p></div>
      </div>
    </section>
    <footer class="foot">Load-Bearing · an original course. Diagrams and content written for this site.</footer>`;
  heroDiagram = new Diagram(main.querySelector('.hero-diagram'));
  let i = 0;
  heroDiagram.render(HERO, 0);
  heroTimer = setInterval(() => { i = (i + 1) % HERO.steps.length; heroDiagram.render(HERO, i); }, 1800);
}

// ---------- lesson ----------
function renderLesson(l, step) {
  state.lesson = l;
  document.body.classList.add('in-lesson');
  state.player = mountLesson(main, l, {
    step,
    nextLesson: LESSONS[l.globalIndex + 1],
    onStep: (i) => { markSeen(l, i); history.replaceState(null, '', `#/${l.slug}/${i + 1}`); },
  });
}

// ---------- events ----------
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  switch (t.dataset.action) {
    case 'menu': return openDrawer(drawer.hidden);
    case 'close-drawer': return openDrawer(false);
    case 'search': return openSearch(true);
    case 'close-search': return openSearch(false);
    case 'theme': return toggleTheme();
    case 'scroll-modules': return document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' });
  }
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); return openSearch(searchEl.hidden); }
  if (e.key === 'Escape') {
    if (!searchEl.hidden) return openSearch(false);
    if (!drawer.hidden) return openDrawer(false);
  }
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || !searchEl.hidden;
  if (typing || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === '/') { e.preventDefault(); return openSearch(true); }
});

window.addEventListener('hashchange', route);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncThemeButton);
route();
