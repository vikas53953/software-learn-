// Validates every lesson: references to nodes/zones, tags, learn ticks, metrics keys.
import { LESSONS } from '../src/content/index.js';
const TAGS = new Set(['problem', 'idea', 'solution', 'case', 'tradeoff', 'recap']);
import { pathToFileURL } from 'node:url';

export function checkContent() {
const errors = [];
const err = (l, i, m) => errors.push(`${l.slug} step ${i + 1}: ${m}`);
const slugs = new Set();
for (const l of LESSONS) {
  if (slugs.has(l.slug)) err(l, -1, 'duplicate slug'); slugs.add(l.slug);
  const nodes = new Set(Object.keys(l.nodes)), zones = new Set(Object.keys(l.zones || {}));
  const mkeys = new Set(l.metrics.map((m) => m.key));
  const shown = new Set();
  l.steps.forEach((s, i) => {
    if (!TAGS.has(s.tag)) err(l, i, `bad tag ${s.tag}`);
    if (!s.title || !s.label || !s.body?.length) err(l, i, 'missing title/label/body');
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
  for (const [id, n] of Object.entries(l.nodes)) {
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
