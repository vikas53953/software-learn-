// The lesson player: definition card, animated stage with Play mode, lesson card, checks, finish.
// Everything that reaches innerHTML goes through esc() or md(), or highlight() for code.
import './player.css';
import { Diagram, resolveStep } from './diagram.js';
import { drawMap } from './mapscene.js';
import { createScene } from './scene.js';
import { highlight } from './highlight.js';
import { esc, md } from './text.js';
import { PLAY, PAUSE, TICK, MINI_PYRAMID as MINI } from './icons.js';
import { stepBlocks, stepDuration, grade, xpFor, nextStreak, readoutFor } from './learn.js';

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage may be blocked */ } },
};
const LVL = { basics: 'Basics', intermediate: 'Intermediate' };
const CALLOUT = { key: 'Key idea', tip: 'Good to know', warn: 'Watch out', analogy: 'Think of it like this', illus: '' };
const isPhone = () => matchMedia('(max-width: 760px)').matches;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');

/** Lessons written before format 2 still play: their promise stands in for the definition. */
const lvlOf = (s) => s.lvl || 'basics';
const sayOf = (s) => s.say || s.title;

export function mountLesson(main, l, { step = 0, nextLesson, onStep }) {
  const S = l.steps;
  const firstI = S.findIndex((s) => lvlOf(s) === 'intermediate');
  const nChecks = S.filter((s) => s.check && s.check.type !== 'predict').length;
  const def = l.definition || { sentence: l.promise, mini: `**${l.short}:** ${l.promise}` };
  const m = l.module;
  let i = step, playing = false, speed = 1, voice = false, xp = 0, firstTry = 0, finished = false, resumeAfterCheck = false;
  let timeUp = false, spoke = false;
  let tStart = 0, tDur = 0, playRaf = 0, termTimers = [], diagram = null, api = {};
  const answered = new Set(), tries = {};
  const st = nextStreak(store.get('lb:streak', null), new Date().toDateString(), new Date(Date.now() - 864e5).toDateString());
  store.set('lb:streak', st);

  const chips = [`<span class="lp-chip">About ${l.minutes} min</span>`];
  const nBasic = firstI < 0 ? S.length : firstI;
  chips.push(`<span class="lp-chip lvl-b">Basics: steps 1–${nBasic}</span>`);
  if (firstI >= 0) chips.push(`<span class="lp-chip lvl-i">Intermediate: steps ${firstI + 1}–${S.length}</span>`);
  const nPred = S.filter((s) => s.check?.type === 'predict').length;
  if (nChecks || nPred) chips.push(`<span class="lp-chip">${[nPred ? `${nPred} prediction${nPred > 1 ? 's' : ''}` : '', nChecks ? `${nChecks} check${nChecks > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ')}</span>`);
  if (firstI > 0) chips.push('<button type="button" class="lp-chip lp-jump" data-lp="jump">Know the basics? Jump to Intermediate →</button>');

  main.innerHTML = `
  <div class="lp">
    <div class="lp-progress">
      <div class="lp-segs" role="group" aria-label="Lesson progress">${S.map((s, k) => `<button type="button" class="lp-seg${s.check ? ' check' : ''}${k === firstI ? ' split' : ''}" data-seg="${k}" aria-label="Go to step ${k + 1}: ${esc(s.title)}"><i></i></button>`).join('')}</div>
      <span class="lp-stat lp-hide-s" title="Day streak">${'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .3 1.6 1 2.6 2 3 0-3.2-.5-6 .5-9z" class="flame"/></svg>'}<span>${st.n}</span></span>
      <span class="lp-stat" title="XP earned in this lesson"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" class="bolt"/></svg><span class="lp-xp">0</span> XP</span>
    </div>
    <section class="lp-head">
      <nav class="lp-crumb" aria-label="Breadcrumb"><a href="#/">Course</a> / Module ${pad(l.moduleIndex + 1)} · ${esc(m.name)} / Lesson ${l.indexInModule + 1} of ${m.lessons.length}</nav>
      <h1>${esc(l.title)}</h1>
      <div class="lp-chips">${chips.join('')}</div>
    </section>
    <section class="lp-defn" aria-label="Definition">
      <div class="lp-defn-full">
        <div class="what">
          <div class="lp-label">${l.definition ? 'Definition · in one sentence' : 'In one sentence'}</div>
          <p class="big">${md(def.sentence)}</p>
          ${def.more ? `<p>${md(def.more)}</p>` : ''}
          ${def.analogy ? `<div class="lp-callout c-analogy"><b class="t">${esc(def.analogy.title)}</b>${md(def.analogy.text)}</div>` : ''}
        </div>
        <div>
          <div class="lp-label">By the end you can</div>
          <ul class="lp-learn">${l.learn.map((t) => `<li>${TICK}<span>${md(t)}</span></li>`).join('')}</ul>
          <div class="lp-row">
            <button type="button" class="key primary" data-lp="start-play"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${PLAY}</svg>Play the explainer</button>
            <button type="button" class="key" data-lp="start-step">Step through myself</button>
            <button type="button" class="key ghost lp-hide-def" data-lp="hide-def">Hide definition</button>
          </div>
        </div>
      </div>
      <div class="lp-defn-mini">${MINI}<p>${md(def.mini || def.sentence)}</p><button type="button" class="key small" data-lp="show-def">Show definition</button></div>
    </section>
    <div class="lp-bench">
      <section class="lp-stage" aria-label="Animated diagram">
        <div class="lp-stage-top">
          ${l.hereIcon === 'pyramid' ? '<svg class="lp-here" viewBox="0 0 30 24" role="img" aria-label="Where this step sits in the pyramid"><rect x="1" y="16" width="28" height="7" rx="2"/><rect x="5" y="8.5" width="20" height="7" rx="2"/><rect x="9" y="1" width="12" height="7" rx="2"/></svg>' : ''}
          <span class="lp-lvl"></span><strong class="lp-stitle"></strong><span class="lp-count"></span>
        </div>
        <div class="lp-canvas"></div>
        <div class="lp-readout" aria-live="polite"></div>
        <p class="lp-caption" aria-live="polite"></p>
        <div class="lp-player">
          <button type="button" class="key play" data-lp="play" aria-label="Play"><svg viewBox="0 0 24 24" fill="currentColor" class="lp-play-ic" aria-hidden="true">${PLAY}</svg></button>
          <div class="lp-scrub" aria-hidden="true"><i></i></div>
          <button type="button" class="key small" data-lp="speed" aria-label="Playback speed">1×</button>
          <button type="button" class="key small lp-voice-btn" data-lp="voice" aria-pressed="false" title="Read the captions aloud">Voice off</button>
        </div>
      </section>
      <article class="lp-card"></article>
    </div>
    <nav class="lp-dock" aria-label="Lesson controls">
      <button type="button" class="key ghost" data-lp="back">Back</button>
      <button type="button" class="key lp-dvoice" data-lp="voice" aria-pressed="false" aria-label="Read captions aloud"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7" class="wave"/></svg></button>
      <button type="button" class="key primary play" data-lp="play" aria-label="Play"><svg viewBox="0 0 24 24" fill="currentColor" class="lp-play-ic" aria-hidden="true">${PLAY}</svg></button>
      <button type="button" class="key go lp-dnext" data-lp="next">Next</button>
    </nav>
    <div class="lp-fb" role="status"><div class="in"><div class="txt"><h3></h3><p></p></div><button type="button" class="key go" data-lp="fb">Continue</button></div></div>
    <canvas class="lp-confetti" aria-hidden="true"></canvas>
  </div>`;

  const $ = (sel) => main.querySelector(sel);
  const $$ = (sel) => main.querySelectorAll(sel);
  const root = $('.lp'), card = $('.lp-card'), canvas = $('.lp-canvas'), stageEl = $('.lp-stage'), fb = $('.lp-fb');
  const sceneSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sceneSvg.setAttribute('viewBox', '0 0 480 300'); sceneSvg.setAttribute('class', 'lp-scene'); sceneSvg.setAttribute('role', 'img');
  const K = createScene(sceneSvg);

  // ---------- readout ----------
  const lineHtml = ([kind, text, extra], k) => {
    const mark = kind === 'cmd' ? '<span class="t-cmd">$</span> ' : kind === 'ok' ? '<span class="t-ok">✓</span> ' : kind === 'no' ? '<span class="t-no">✗</span> ' : '';
    const body = kind === 'dim' ? `<span class="t-dim">${esc(text) || ' '}</span>` : esc(text);
    return `<div class="ln" data-k="${k}">${mark}${body}${extra ? `  <span class="t-dim">${esc(extra)}</span>` : ''}</div>`;
  };
  const readoutHtml = (r) => {
    if (r.term) return `<div class="lp-term" role="log"><div class="bar"><b></b><b></b><b></b></div>${r.term.map(lineHtml).join('')}</div>`;
    if (r.tiles) return `<div class="lp-tiles" style="--n:${Math.min(4, r.tiles.length)}">${r.tiles.map((t, k) => `<div class="lp-tile${t.tone ? ` ${esc(t.tone)}` : ''}" data-k="${k}"><span>${esc(t.k)}</span><b${String(t.v).length > 9 ? ' class="long"' : ''}>${esc(t.v)}</b><em>${esc(t.sub || '')}</em></div>`).join('')}</div>`;
    return `<div class="lp-rnote">${esc(r.note || '')}</div>`;
  };
  function runReadout(r) {
    termTimers.forEach(clearTimeout); termTimers = [];
    const h = readoutHtml(r);
    $('.lp-readout').innerHTML = h;
    const pr = card.querySelector('.lp-phone-readout'); if (pr) pr.innerHTML = h;
    if (r.term) r.term.forEach((_, k) => termTimers.push(setTimeout(() => $$(`.ln[data-k="${k}"]`).forEach((e) => e.classList.add('on')), reduced() ? 0 : 400 + (k * 600) / speed)));
  }
  const setTile = (k, v, tone, sub) => $$(`.lp-tile[data-k="${k}"]`).forEach((t) => {
    const b = t.querySelector('b'); b.textContent = v; b.classList.toggle('long', String(v).length > 9); t.className = 'lp-tile' + (tone ? ` ${tone}` : '');
    if (sub !== undefined) t.querySelector('em').textContent = sub;
  });

  // ---------- card ----------
  const blockHtml = (b) => {
    if (b.p) return `<p>${md(b.p)}</p>`;
    if (b.ul) return `<ul>${b.ul.map((x) => `<li>${md(x)}</li>`).join('')}</ul>`;
    if (b.ol) return `<ol>${b.ol.map((x) => `<li>${md(x)}</li>`).join('')}</ol>`;
    if (b.code !== undefined) return `<div class="lp-codewrap"><pre class="lp-code"><code>${highlight(b.code, b.lang || 'ts')}</code></pre></div>`;
    if (b.callout) { const t = b.title ?? CALLOUT[b.callout]; return `<div class="lp-callout c-${esc(b.callout)}">${t ? `<b class="t">${esc(t)}</b>` : ''}${md(b.text)}</div>`; }
    if (b.table) return `<div class="lp-tablewrap"><table class="lp-table"><thead><tr>${b.table.head.map((h) => `<th>${md(h)}</th>`).join('')}</tr></thead><tbody>${b.table.rows.map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if (b.slider) { const s = b.slider; return `<div class="lp-slider"><label for="lp-range">${esc(s.label).replace('{v}', `<span class="lp-range-v">${+s.value}</span>`)}</label><input type="range" id="lp-range" min="${+s.min}" max="${+s.max}" step="${+s.step}" value="${+s.value}"><div class="ends"><span>${+s.min}%</span><span>${+s.max}%</span></div></div>`; }
    if (b.changes) return `<div class="lp-changes"><b class="t">What changed</b><ul>${b.changes.map(([k, t]) => `<li class="ch-${k === '+' ? 'add' : k === '-' ? 'del' : 'mod'}"><span>${k === '~' ? '±' : esc(k)}</span>${md(t)}</li>`).join('')}</ul></div>`;
    return '';
  };
  const quizHtml = (c) => {
    const top = c.type === 'predict' ? '<span class="lp-predict-tag">Guess first, then watch</span>' : '';
    if (c.type !== 'match') return `<div class="lp-quiz">${top}<p class="q">${md(c.q)}</p><div class="lp-opts">${c.opts.map((o, k) => `<button type="button" class="lp-opt" data-opt="${k}"><span class="n">${k + 1}</span><span>${md(o.t)}</span></button>`).join('')}</div><div class="lp-row"><button type="button" class="key primary" data-lp="check" disabled>${c.type === 'predict' ? 'Lock in my guess' : 'Check'}</button></div></div>`;
    return `<div class="lp-quiz"><p class="q">${md(c.q)}</p><div class="lp-match">${c.bugs.map((b, k) => `<div class="bug" data-bug="${k}"><p>${md(b.t)}</p><div class="bins">${c.bins.map((n, j) => `<button type="button" class="lp-bin" data-bin="${j}">${esc(n)}</button>`).join('')}</div></div>`).join('')}</div><div class="lp-row"><button type="button" class="key primary" data-lp="check" disabled>Check</button></div></div>`;
  };

  function setHere(arr) {
    const h = $('.lp-here'); if (!h) return;
    [...h.children].forEach((r, k) => r.setAttribute('class', arr?.includes(2 - k) ? `on l${3 - k}` : ''));
  }
  const scrollCard = () => { if (!isPhone()) return; requestAnimationFrame(() => { const top = card.getBoundingClientRect().top + scrollY - stageEl.offsetHeight - 10; scrollTo({ top: Math.max(0, top), behavior: reduced() ? 'auto' : 'smooth' }); }); };

  function renderScene(s) {
    K.clear(); api = {};
    const custom = l.scenes && s.scene && l.scenes[s.scene];
    canvas.classList.toggle('is-diagram', !custom && !l.map);
    if (!custom && l.map) {
      diagram?.destroy(); diagram = null;
      if (!sceneSvg.isConnected) canvas.replaceChildren(sceneSvg);
      sceneSvg.setAttribute('aria-label', s.title);
      drawMap(K, l, i);
      return resolveStep(l, i).metrics;
    }
    if (custom) {
      diagram?.destroy(); diagram = null;
      if (!sceneSvg.isConnected) canvas.replaceChildren(sceneSvg);
      sceneSvg.setAttribute('aria-label', s.title);
      custom(K, { api, step: s, answered: answered.has(i), setTile, setSlider: (v) => { const r = card.querySelector('#lp-range'); if (r && +r.value !== v) r.value = v; const o = card.querySelector('.lp-range-v'); if (o) o.textContent = v; } });
      return {};
    }
    if (!diagram) { canvas.replaceChildren(); diagram = new Diagram(canvas); }
    diagram.render(l, i);
    return resolveStep(l, i).metrics;
  }

  function render() {
    const s = S[i];
    const lv = lvlOf(s);
    $('.lp-lvl').textContent = LVL[lv]; $('.lp-lvl').className = `lp-lvl ${lv}`;
    $('.lp-stitle').textContent = s.title; $('.lp-count').textContent = `${i + 1} / ${S.length}`; setHere(s.here);
    $('.lp-caption').textContent = sayOf(s);
    const locked = !!s.check && !answered.has(i);
    const label = `${s.check ? (s.check.type === 'predict' ? 'Predict' : 'Your turn') : LVL[lv]} · step ${i + 1}`;
    const last = i === S.length - 1;
    card.innerHTML = `<div class="lp-label">${esc(label)}</div><h2>${esc(s.title)}</h2><div class="lp-phone-readout"></div>${s.check ? quizHtml(s.check) : stepBlocks(s).map(blockHtml).join('')}
      <div class="lp-nav"><button type="button" class="key ghost" data-lp="back" ${i === 0 ? 'disabled' : ''}>Back</button><button type="button" class="key go" data-lp="next" ${locked ? 'disabled' : ''}>${last ? 'Finish lesson' : 'Next'}</button></div>`;
    $('.lp-dock [data-lp="back"]').disabled = i === 0;
    $('.lp-dnext').disabled = locked; $('.lp-dnext').textContent = last ? 'Finish' : 'Next';
    card.querySelectorAll('.lp-codewrap, .lp-tablewrap').forEach((w) => {
      const el = w.firstElementChild, scroller = w.classList.contains('lp-codewrap') ? el : w;
      if (el.scrollWidth > w.clientWidth + 2 || scroller.scrollWidth > scroller.clientWidth + 2) w.classList.add('scrolls');
      scroller.addEventListener('scroll', () => w.classList.remove('scrolls'), { once: true });
    });
    const metrics = renderScene(s);
    runReadout(readoutFor(l, s, metrics));
    const range = card.querySelector('#lp-range');
    if (range) { range.addEventListener('input', () => api.onSlider?.(+range.value)); range.addEventListener('pointerdown', () => { api.touched = true; }); }
    if (s.check) wireQuiz(s.check);
    paintSegs();
    document.title = `${s.title} · ${l.short} · Load-Bearing`;
  }

  const paintSegs = () => $$('.lp-seg').forEach((b, k) => { b.querySelector('i').style.width = k < i || finished ? '100%' : k === i ? '30%' : '0'; if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });

  // ---------- checks ----------
  function wireQuiz(c) {
    let pick = null; const picks = [];
    const btn = card.querySelector('[data-lp="check"]');
    if (answered.has(i)) { btn.hidden = true; markSolved(c); return; }
    if (c.type !== 'match') card.querySelectorAll('.lp-opt').forEach((b) => b.addEventListener('click', () => {
      card.querySelectorAll('.lp-opt').forEach((x) => x.classList.remove('sel', 'wrong')); b.classList.add('sel'); pick = +b.dataset.opt; btn.disabled = false;
    }));
    else card.querySelectorAll('.bug').forEach((bug) => bug.querySelectorAll('.lp-bin').forEach((b) => b.addEventListener('click', () => {
      bug.querySelectorAll('.lp-bin').forEach((x) => x.classList.remove('sel', 'wrong')); b.classList.add('sel');
      picks[+bug.dataset.bug] = +b.dataset.bin; btn.disabled = picks.filter((x) => x !== undefined).length < c.bugs.length;
    })));
    btn.addEventListener('click', () => {
      tries[i] = (tries[i] || 0) + 1;
      const g = grade(c, c.type === 'match' ? picks : pick);
      if (c.type === 'match') c.bugs.forEach((b, k) => { const el = card.querySelector(`.bug[data-bug="${k}"] .lp-bin[data-bin="${picks[k]}"]`); el.classList.remove('sel'); el.classList.add(g.wrong.includes(k) ? 'wrong' : 'right'); });
      else card.querySelector(`.lp-opt[data-opt="${pick}"]`).classList.add(g.wrong.length ? 'wrong' : 'right');
      if (!g.ok) return feedback(false, 'Not quite', `${g.hint}${c.tail ? ` ${c.tail}` : ''} Try again.`);
      const right = c.type === 'predict' ? g.right : true;
      const gain = xpFor(c, tries[i], right); xp += gain; $('.lp-xp').textContent = xp; answered.add(i);
      if (c.type !== 'predict' && tries[i] === 1) firstTry++;
      store.set('lb:xp', store.get('lb:xp', 0) + gain);
      btn.hidden = true; markSolved(c); unlock();
      if (c.type === 'predict') { feedback(true, right ? `Spot on! +${gain} XP` : `Locked in. +${gain} XP`, (g.hint || '') + c.why); api.reveal?.(); }
      else feedback(true, tries[i] === 1 ? `Correct! +${gain} XP` : `Got it. +${gain} XP`, c.type === 'match' ? c.bugs.map((b) => b.why).join(' ') : c.why);
    });
  }
  const unlock = () => { card.querySelector('[data-lp="next"]').disabled = false; $('.lp-dnext').disabled = false; };
  function markSolved(c) {
    if (c.type === 'match') { c.bugs.forEach((b, k) => card.querySelector(`.bug[data-bug="${k}"] .lp-bin[data-bin="${b.a}"]`).classList.add('right')); return; }
    card.querySelector(`.lp-opt[data-opt="${c.ans}"]`).classList.add('right');
    const w = document.createElement('div'); w.className = 'lp-callout c-key'; w.innerHTML = `<b class="t">Why</b>${md(c.why)}`;
    card.querySelector('.lp-quiz').appendChild(w);
  }
  function feedback(good, h, p) {
    fb.className = `lp-fb show ${good ? 'good' : 'bad'}`;
    fb.querySelector('h3').textContent = h; fb.querySelector('p').innerHTML = md(p);
    const b = fb.querySelector('[data-lp="fb"]'); b.textContent = good ? 'Continue' : 'Try again'; b.dataset.good = good ? '1' : '';
    b.focus({ preventScroll: true });
  }
  function closeFeedback() {
    const good = !!fb.querySelector('[data-lp="fb"]').dataset.good;
    fb.classList.remove('show');
    if (!good) return;
    if (resumeAfterCheck) { resumeAfterCheck = false; next(); if (!finished) play(); } else next();
  }

  // ---------- navigation and playback ----------
  const collapseDef = () => $('.lp-defn').classList.add('mini', 'started');
  function go(k, { scroll = true } = {}) {
    i = Math.max(0, Math.min(S.length - 1, k)); finished = false; fb.classList.remove('show');
    $('.lp-scrub i').style.width = '0%';
    if (i > 0 || playing) collapseDef();
    render(); onStep?.(i);
    if (scroll) scrollCard();
  }
  function next() { if (i < S.length - 1) go(i + 1); else finish(); }
  function tick(now) {
    if (!playing) return;
    const p = Math.min(1, (now - tStart) / tDur);
    $('.lp-scrub i').style.width = `${p * 100}%`;
    $$('.lp-seg')[i].querySelector('i').style.width = `${p * 100}%`;
    if (p >= 1) { timeUp = true; if (!voice || spoke || now - tStart > tDur * 2 + 4000) return advance(); }
    playRaf = requestAnimationFrame(tick);
  }
  function startStep() {
    const s = S[i];
    cancelAnimationFrame(playRaf);
    if (s.check && !answered.has(i)) { playing = false; resumeAfterCheck = true; setIcon(); speak(sayOf(s)); $('.lp-scrub i').style.width = '100%'; return; }
    tStart = performance.now(); tDur = stepDuration(s, speed); timeUp = false; spoke = false; playRaf = requestAnimationFrame(tick);
    // With voice on, move on after whichever ends later: the step's time or the speech (plus a short pause).
    // tick() also gives up waiting for speech that never ends, which happens when the browser has no voices.
    const at = i;
    if (voice) speak(sayOf(s), () => termTimers.push(setTimeout(() => { if (i !== at) return; spoke = true; if (playing && timeUp) advance(); }, 700)));
  }
  function advance() { if (i >= S.length - 1) { finish(); return; } go(i + 1); startStep(); }
  function play() { if (finished) go(0); playing = true; collapseDef(); setIcon(); startStep(); }
  function stop() { playing = false; cancelAnimationFrame(playRaf); setIcon(); try { speechSynthesis.cancel(); } catch { /* no speech */ } }
  function setIcon() {
    $$('.lp-play-ic').forEach((ic) => { ic.innerHTML = playing ? PAUSE : PLAY; });
    $$('[data-lp="play"]').forEach((b) => b.setAttribute('aria-label', playing ? 'Pause' : 'Play'));
  }
  function speak(text, done) {
    if (!voice || !('speechSynthesis' in window)) { done?.(); return; }
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.95 * speed; u.onend = () => done?.(); speechSynthesis.speak(u); } catch { done?.(); }
  }
  function toggleVoice() {
    voice = !voice;
    $('.lp-voice-btn').textContent = voice ? 'Voice on' : 'Voice off';
    $$('[data-lp="voice"]').forEach((b) => { b.setAttribute('aria-pressed', String(voice)); b.classList.toggle('on', voice); });
    if (!voice) { try { speechSynthesis.cancel(); } catch { /* no speech */ } }
    if (playing) startStep();
  }

  // ---------- finish ----------
  function finish() {
    if (finished) return;
    stop(); finished = true; paintSegs();
    K.clear();
    if (l.scenes?.finish) { diagram?.destroy(); diagram = null; canvas.replaceChildren(sceneSvg); l.scenes.finish(K, { api: {}, setTile, setSlider() {} }); }
    runReadout({ tiles: [{ k: 'XP', v: String(xp) }, { k: 'First try', v: `${firstTry} / ${nChecks}` }, { k: 'Day streak', v: String(st.n) }] });
    $('.lp-stitle').textContent = 'Lesson complete'; $('.lp-lvl').textContent = 'Done'; $('.lp-lvl').className = 'lp-lvl done'; setHere([0, 1, 2]);
    $('.lp-caption').textContent = l.wrapUp || `Lesson complete: ${l.short}.`;
    const terms = Object.values(l.terms || {});
    card.innerHTML = `<div class="lp-finish"><svg class="medal" viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="52" r="34"/><path d="M33 52l10 10 20-22"/></svg>
      <h2>Lesson complete</h2><p>${md(l.finishLine || 'Nice work. Here is what you covered.')}</p>
      <div class="row"><div><b>${xp}</b><span>XP</span></div><div><b>${firstTry}/${nChecks}</b><span>first try</span></div><div><b>${st.n}</b><span>day streak</span></div></div>
      ${terms.length ? `<div class="lp-label center">Key terms</div><div class="lp-gloss">${terms.map(([n, v]) => `<div><b>${esc(n)}.</b> ${md(v.charAt(0).toUpperCase() + v.slice(1))}</div>`).join('')}</div>` : ''}
      <div class="lp-nav show"><button type="button" class="key ghost" data-lp="again">Watch again</button>${nextLesson ? `<a class="key go" href="#/${esc(nextLesson.slug)}/1">Next: ${esc(nextLesson.short)}</a>` : '<a class="key go" href="#/">Back to the course</a>'}</div></div>`;
    $('.lp-dnext').disabled = true;
    scrollCard(); confetti();
  }
  function confetti() {
    if (reduced()) return;
    const c = $('.lp-confetti'), x = c.getContext('2d'); if (!x) return;
    c.width = innerWidth; c.height = innerHeight;
    const cs = getComputedStyle(document.documentElement), cols = ['--l1', '--l2', '--l3', '--accent', '--amber'].map((v) => cs.getPropertyValue(v).trim());
    const P = Array.from({ length: 120 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.4, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 4, c: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 6 }));
    let t = 0;
    (function f() { x.clearRect(0, 0, c.width, c.height); P.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.a += 0.2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }); if (++t < 110 && root.isConnected) requestAnimationFrame(f); else x.clearRect(0, 0, c.width, c.height); })();
  }

  // ---------- events ----------
  const startAt = (k) => { stop(); collapseDef(); go(k, { scroll: false }); if (isPhone()) scrollCard(); else stageEl.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); };
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-lp], [data-seg], .term-btn');
    if (!t) return;
    if (t.dataset.seg !== undefined) { stop(); return go(+t.dataset.seg); }
    if (t.classList.contains('term-btn')) return toggleTerm(t);
    switch (t.dataset.lp) {
      case 'play': return playing ? stop() : play();
      case 'next': stop(); return next();
      case 'back': stop(); return go(i - 1);
      case 'speed': speed = speed === 1 ? 1.5 : speed === 1.5 ? 0.75 : 1; t.textContent = `${speed}×`; if (playing) startStep(); return;
      case 'voice': return toggleVoice();
      case 'start-play': go(0, { scroll: false }); play(); if (isPhone()) scrollCard(); else stageEl.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); return;
      case 'start-step': return startAt(0);
      case 'jump': return startAt(firstI);
      case 'show-def': return $('.lp-defn').classList.remove('mini');
      case 'hide-def': return $('.lp-defn').classList.add('mini');
      case 'fb': return closeFeedback();
      case 'again': finished = false; go(0); return play();
    }
  });
  function toggleTerm(b) {
    const key = b.dataset.term, host = b.closest('p, li, td, .lp-callout'), anchor = b.closest('table') || host;
    const open = anchor.parentElement.querySelector(`.lp-pop[data-for="${key}"]`);
    if (open) { open.remove(); return; }
    const entry = l.terms?.[key]; if (!entry) return;
    const d = document.createElement('span'); d.className = 'lp-pop'; d.dataset.for = key;
    d.innerHTML = `<b>${esc(entry[0])}:</b> ${md(entry[1])}`;
    (anchor.closest('.lp-tablewrap') || anchor).after(d);
  }
  const onKey = (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || e.altKey || e.ctrlKey || e.metaKey) return;
    if (document.querySelector('.search:not([hidden]), .drawer:not([hidden])')) return;
    if (e.key === 'ArrowRight' && !(S[i].check && !answered.has(i))) { e.preventDefault(); stop(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); go(i - 1); }
    else if (e.key === ' ' && !(document.activeElement instanceof HTMLButtonElement)) { e.preventDefault(); playing ? stop() : play(); }
  };
  document.addEventListener('keydown', onKey);

  if (i > 0) collapseDef();
  go(i, { scroll: false });

  return {
    setStep(k) { if (k !== i) { stop(); go(k); } },
    destroy() { stop(); K.clear(); termTimers.forEach(clearTimeout); diagram?.destroy(); document.removeEventListener('keydown', onKey); },
  };
}
