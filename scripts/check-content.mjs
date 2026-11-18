// Validates every lesson: references to nodes/zones, tags, learn ticks, metrics keys.
import { LESSONS } from '../src/content/index.js';
const TAGS = new Set(['problem', 'idea', 'solution', 'case', 'tradeoff', 'recap']);
import { pathToFileURL } from 'node:url';

const LVLS = new Set(['basics', 'intermediate']);
const textsOf = (s) => [s.say, s.title, ...(s.blocks || []).flatMap((b) => [b.p, b.text, ...(b.ul || []), ...(b.ol || []), ...(b.table ? [...b.table.head, ...b.table.rows.flat()] : [])]),
  ...(s.check ? [s.check.q, ...(s.check.opts || []).map((o) => o.t), ...(s.check.bugs || []).map((b) => b.t)] : [])].filter(Boolean);

/** Rules for format 2 lessons: level, caption, a body or a check, valid checks, known scenes and glossary terms. */
function checkV2(l, s, i, err) {
  if (!LVLS.has(s.lvl)) err(l, i, `bad lvl ${s.lvl}`);
  if (!s.title || !s.label || !s.say) err(l, i, 'missing title/label/say');
  if (!s.check && !s.blocks?.length) err(l, i, 'needs blocks or a check');
  if (s.scene && !l.scenes?.[s.scene]) err(l, i, `unknown scene ${s.scene}`);
  // With no node diagram there is nothing else to draw, so every step needs a scene.
  if (!s.scene && !Object.keys(l.nodes || {}).length) err(l, i, 'needs a scene (the lesson has no node diagram)');
  if (s.lvl === 'basics' && l.steps.slice(0, i).some((p) => p.lvl === 'intermediate')) err(l, i, 'basics step after intermediate');
  for (const t of textsOf(s)) for (const [, k] of t.matchAll(/\[\[([a-z0-9-]+)\|/g)) if (!l.terms?.[k]) err(l, i, `unknown term ${k}`);
  const c = s.check;
  if (!c) return;
  if (c.type === 'match') {
    if (!c.bins?.length || !c.bugs?.length) err(l, i, 'match needs bins and bugs');
    for (const b of c.bugs || []) { if (!(b.a >= 0 && b.a < c.bins.length)) err(l, i, 'match answer out of range'); if (!b.hint || !b.why) err(l, i, 'match bug needs hint and why'); }
  } else if (c.type === 'choice' || c.type === 'predict') {
    if (!(c.ans >= 0 && c.ans < c.opts.length)) err(l, i, 'answer out of range');
    if (!c.why) err(l, i, 'check needs why');
    if (c.type === 'choice') c.opts.forEach((o, k) => { if (k !== c.ans && !o.hint) err(l, i, `option ${k + 1} needs a hint`); });
    if (c.type === 'predict' && c.fb && c.fb.length !== c.opts.length) err(l, i, 'predict fb must match options');
  } else err(l, i, `bad check type ${c.type}`);
}

/** Checks the given lessons (all of them by default) and returns a list of problems. */
export function checkContent(lessons = LESSONS) {
const errors = [];
const err = (l, i, m) => errors.push(`${l.slug} step ${i + 1}: ${m}`);
const slugs = new Set();
for (const l of lessons) {
  if (slugs.has(l.slug)) err(l, -1, 'duplicate slug'); slugs.add(l.slug);
  if (l.format === 2 && !l.definition?.sentence) err(l, -1, 'format 2 lesson needs definition.sentence');
  const nodes = new Set(Object.keys(l.nodes || {})), zones = new Set(Object.keys(l.zones || {}));
  const mkeys = new Set(l.metrics.map((m) => m.key));
  const shown = new Set();
  l.steps.forEach((s, i) => {
    if (l.format === 2) checkV2(l, s, i, err);
    else {
      if (!TAGS.has(s.tag)) err(l, i, `bad tag ${s.tag}`);
      if (!s.title || !s.label || !s.body?.length) err(l, i, 'missing title/label/body');
    }
    for (const id of [...(s.add || []), ...(s.remove || []), ...Object.keys(s.state || {}), ...Object.keys(s.set || {})])
      if (!nodes.has(id)) err(l, i, `unknown node ${id}`);
    (s.add || []).forEach((id) => shown.add(id)); (s.remove || []).forEach((id) => shown.delete(id));
    for (const [a, b] of [...(s.edges || []), ...(s.flows || [])]) {
      if (!nodes.has(a) || !nodes.has(b)) err(l, i, `edge/flow to unknown node ${a}>${b}`);
      else if (!shown.has(a) || !shown.has(b)) err(l, i, `edge/flow touches hidden node ${a}>${b}`);
    }
    for (const z of s.zones || []) if (!zones.has(z)) err(l, i, `unknown zone ${z}`);
    for (const k of Object.keys(s.metrics || {})) if (!mkeys.has(k)) err(l, i, `unknown metric ${k}`);
    if ((s.done || 0) > l.learn.length) err(l, i, 'done > learn items');
    for (const [id, st] of Object.entries(s.state || {})) if (st && !shown.has(id)) err(l, i, `state on hidden node ${id}`);
  });
  const lastDone = Math.max(...l.steps.map((s) => s.done || 0));
  if (lastDone !== l.learn.length) err(l, l.steps.length - 1, `final ticks ${lastDone} != learn ${l.learn.length}`);
  if (l.map) {
    // Compact phone-readable layout (src/mapscene.js): every node and zone needs a place inside 480×300.
    for (const id of nodes) {
      const m = l.map.nodes?.[id];
      if (!m) { err(l, -1, `map has no place for node ${id}`); continue; }
      const [x, y, w] = m, h = 34 + (l.nodes[id].sub || Object.values(l.steps).some((s) => s.set?.[id]?.sub) ? 10 : 0) + 14 * (String(l.nodes[id].label).split('\n').length - 1);
      if (x - w / 2 < 0 || x + w / 2 > 480 || y - h / 2 < 0 || y + h / 2 > 300) err(l, -1, `map node ${id} outside 480×300`);
    }
    for (const id of zones) {
      const z = l.map.zones?.[id];
      if (!z) err(l, -1, `map has no place for zone ${id}`);
      else if (z[0] < 0 || z[1] < 0 || z[0] + z[2] > 480 || z[1] + z[3] > 300) err(l, -1, `map zone ${id} outside 480×300`);
    }
  }
  for (const [id, n] of Object.entries(l.nodes || {})) {
    const w = n.w || 148, h = n.h || 56;
    if (n.x - w / 2 < 0 || n.x + w / 2 > 800 || n.y - h / 2 < 0 || n.y + h / 2 > 460) err(l, -1, `node ${id} outside canvas`);
  }
}
return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = checkContent();
  errors.forEach((e) => console.error(`✗ ${e}`));
  console.log(`${LESSONS.length} lessons, ${LESSONS.reduce((a, l) => a + l.steps.length, 0)} steps, ${errors.length} problems`);
  process.exit(errors.length ? 1 : 0);
}
