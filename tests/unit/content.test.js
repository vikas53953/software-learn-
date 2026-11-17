// Every lesson must pass the content checker (also run as `npm run check`).
import { it, expect } from 'vitest';
import { checkContent } from '../../scripts/check-content.mjs';

it('all lessons are internally consistent', () => {
  expect(checkContent()).toEqual([]);
});
