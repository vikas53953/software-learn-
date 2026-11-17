import { srp, ocp, lsp, dip } from './principles.js';
import { observer, decorator } from './patterns.js';
import { pyramid, doubles, tdd } from './testing.js';
import { ci, deploys } from './delivery.js';
import { race, deadlock, eventLoop } from './concurrency.js';
import { hexagonal, services } from './architecture.js';

export const MODULES = [
  { id: 'principles', name: 'Design Principles', blurb: 'SOLID, taught by watching code bend and break.', icon: 'layers', lessons: [srp, ocp, lsp, dip] },
  { id: 'patterns', name: 'Design Patterns', blurb: 'Reusable answers to recurring design problems.', icon: 'sparkle', lessons: [observer, decorator] },
  { id: 'testing', name: 'Testing', blurb: 'Fast feedback you can actually trust.', icon: 'test', lessons: [pyramid, doubles, tdd] },
  { id: 'delivery', name: 'Delivery', blurb: 'From commit to production, safely and often.', icon: 'rocket', lessons: [ci, deploys] },
  { id: 'concurrency', name: 'Concurrency', blurb: 'When two things happen at once.', icon: 'thread', lessons: [race, deadlock, eventLoop] },
  { id: 'architecture', name: 'Architecture', blurb: 'Where the big boundaries go, and why.', icon: 'box', lessons: [hexagonal, services] },
];

export const LESSONS = [];
MODULES.forEach((m, mi) => m.lessons.forEach((l, li) => {
  l.module = m; l.moduleIndex = mi; l.indexInModule = li;
  l.globalIndex = LESSONS.length;
  LESSONS.push(l);
}));

export const bySlug = Object.fromEntries(LESSONS.map((l) => [l.slug, l]));
