// Module 3, lesson 1: The Testing Pyramid (lesson format 2: definition, Basics + Intermediate, scenes, checks).
import { scenes } from './scenes/pyramid.js';

const cmd = (text) => ['cmd', text];
const ok = (text, ms) => ['ok', text, ms];
const no = (text, why) => ['no', text, why];
const dim = (text) => ['dim', text];

export const pyramid = {
  format: 2,
  slug: 'test-pyramid',
  title: 'The Testing Pyramid',
  short: 'Test Pyramid',
  minutes: 20,
  level: 'Beginner → Intermediate',
  promise: 'Why a suite of 380 browser tests takes an hour and still misses bugs, and how to turn it back into a fast, trustworthy pyramid.',
  definition: {
    sentence: 'The testing pyramid is a rule of thumb for balancing automated tests: write **many** small, fast unit tests, **fewer** integration tests, and only a **handful** of slow end-to-end tests.',
    more: 'It describes the shape of a healthy test suite: wide at the bottom, narrow at the top. Mike Cohn popularised it in his 2009 book Succeeding with Agile, where the layers were called Unit, Service and UI.',
    analogy: { title: 'Think of it like a car factory', text: 'Every bolt is checked as it is made (cheap, instant). Each engine is run on a test bench (slower). Only a few finished cars go on a test drive (expensive). You would never find a bad bolt by test-driving every car.' },
    mini: '**Testing pyramid:** many fast unit tests, fewer integration tests, a handful of end-to-end tests.',
  },
  learn: [
    'Say what a unit, integration and end-to-end test each check, with a real example of each.',
    'Explain why the bottom is wide: speed, cost, flakiness and how precisely a failure points at the bug.',
    'Turn an "ice-cream cone" suite back into a pyramid by pushing tests down.',
    'Use stubs, mocks, fakes and contract tests, and know when a trophy or honeycomb fits better.',
  ],
  metrics: [],
  nodes: {},
  hereIcon: 'pyramid',
  scenes,
  terms: {
    unit: ['Unit test', 'checks one small piece of code, usually one function or class, on its own: no database, network or browser. Runs in milliseconds.'],
    integration: ['Integration test', 'checks that two or more real parts work together, for example your code plus a real database. Runs in tens to hundreds of milliseconds.'],
    e2e: ['End-to-end (E2E) test', 'drives the whole running app the way a user would, usually through a real browser. Runs in seconds.'],
    flaky: ['Flaky test', 'a test that sometimes passes and sometimes fails with no code change, usually because of timing, shared data or the network.'],
    stub: ['Stub', 'a stand-in that returns fixed answers. The test does not check how it was called.'],
    mock: ['Mock', 'a stand-in set up with the calls it expects. The test checks that those calls really happened, with the right arguments.'],
    fake: ['Fake', 'a small, working version of a real dependency, such as an in-memory store instead of a real database.'],
    contract: ['Contract test', 'checks that two services still agree on the requests and responses they exchange, so each can be tested and deployed on its own.'],
  },
  steps: [
    {
      lvl: 'basics', label: 'Three kinds', title: 'Three kinds of test', here: [0, 1, 2], scene: 'build', done: 0,
      say: 'Automated tests come in three sizes. Small ones check one function. Medium ones check parts working together. Big ones check the whole app, like a user would.',
      read: { tiles: [{ k: 'Unit', v: 'Many', sub: 'milliseconds each' }, { k: 'Integration', v: 'Some', sub: '100s of ms each' }, { k: 'End-to-end', v: 'Few', sub: 'seconds each' }] },
      blocks: [
        { p: 'A test is code that checks other code automatically, every time someone changes it. Automated tests come in three sizes:' },
        { ul: ['**Small:** [[unit|unit tests]] check one function on its own.', '**Medium:** [[integration|integration tests]] check a few real parts working together.', '**Large:** [[e2e|end-to-end tests]] click through the real app like a customer.'] },
        { p: 'The pyramid is about **how many of each** you should have. Throughout this lesson we test one small online shop, so you can see all three sizes on the same code. Tap any dotted word for a quick definition.' },
      ],
    },
    {
      lvl: 'basics', label: 'Unit', title: 'Unit tests: the wide base', here: [0], scene: 'unit', done: 1,
      say: 'A unit test calls one function directly and checks the answer. No database, no network, no browser. That is why each one takes about a millisecond.',
      read: { term: [cmd('npx vitest price'), ok('SAVE10 takes 10% off', '2 ms'), ok('unknown code changes nothing', '1 ms'), dim(''), dim('Test Files  1 passed'), dim('     Tests  2 passed (0.04 s)')] },
      blocks: [
        { p: 'Our shop has a function that works out a price after a discount code. Prices are stored in **cents** (whole numbers), so $100.00 is `10000`.' },
        { lang: 'ts', code: `import { test, expect } from 'vitest';

function applyDiscount(cents, code) {
  if (code === 'SAVE10') return Math.round(cents * 0.9);
  return cents;
}

test('SAVE10 takes 10% off', () => {
  expect(applyDiscount(10000, 'SAVE10')).toBe(9000);
});

test('unknown code changes nothing', () => {
  expect(applyDiscount(10000, 'NOPE')).toBe(10000);
});` },
        { p: 'Each test calls the function with an input and checks the output. Nothing else runs.' },
        { callout: 'key', title: 'Why it matters', text: 'When one of these fails, you know exactly where the bug is: inside `applyDiscount`. That precision, plus speed, is why unit tests form the base.' },
        { callout: 'analogy', title: 'Why cents?', text: 'Computers store decimals like 0.1 inexactly, so `0.1 + 0.2` gives `0.30000000000000004`. Whole cents avoid that, and make tests exact.' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: how fast is the base?', here: [0], scene: 'predict', done: 1,
      say: 'Before we go on, make a guess. A real shop might have twelve hundred unit tests like these. How long does the whole lot take to run?',
      read: { tiles: [{ k: 'Unit tests', v: '1,200' }, { k: 'Each takes', v: '~2 ms' }, { k: 'All of them', v: '?' }] },
      check: {
        type: 'predict', q: '1,200 unit tests like the ones you just saw. How long does the whole suite take on a laptop?',
        opts: [{ t: '2–5 seconds' }, { t: 'About a minute' }, { t: 'About 20 minutes' }], ans: 0,
        fb: ['', 'A bit high: it is closer to 3 seconds. ', 'Much too high: it is closer to 3 seconds. Slow suites come from slow tests, not from many fast ones. '],
        why: '1,200 × ~2 ms is about 2.4 seconds, plus a little start-up. That is fast enough to run on every save, which is exactly why you can afford thousands of them.',
      },
    },
    {
      lvl: 'basics', label: 'Integration', title: 'Integration tests: the middle', here: [1], scene: 'integration', done: 1,
      say: 'A unit test never talks to a database, so it cannot tell you if your SQL is right. An integration test runs your real code against a real, throwaway database.',
      read: { term: [cmd('npx vitest orders --project integration'), dim('starting postgres test container… 2.8 s'), ok('saves an order and reads it back', '180 ms'), ok('rejects an order with no items', '95 ms'), dim(''), dim('     Tests  2 passed (3.1 s incl. start-up)')] },
      blocks: [
        { p: 'The shop saves orders with an `OrderRepository`. This test uses the real class and a real Postgres database started just for the test (for example with Testcontainers):' },
        { lang: 'ts', code: `test('saves an order and reads it back', async () => {
  const repo = new OrderRepository(testDatabase);
  await repo.save({ id: 'A1', cents: 9000 });

  const found = await repo.find('A1');
  expect(found).toEqual({ id: 'A1', cents: 9000 });
});` },
        { p: 'It catches problems a unit test cannot see: a misspelled column, a wrong data type, a missing migration. Each test takes tens to hundreds of milliseconds, plus a few seconds to start the database once.' },
        { callout: 'key', title: 'Key idea', text: 'Integration tests check the **seams** between parts. Keep each one focused on one seam, such as "our code ↔ database" or "our code ↔ payment API".' },
      ],
    },
    {
      lvl: 'basics', label: 'End-to-end', title: 'End-to-end tests: the tip', here: [2], scene: 'e2e', done: 1,
      say: 'An end-to-end test opens a real browser and buys something, exactly like a customer. It gives the most confidence, but it is slow and many things can break it.',
      read: { term: [cmd('npx playwright test checkout'), dim('starting web server, API, database…'), dim('launching chromium…'), ok('buy a lamp with SAVE10', '8.4 s'), dim(''), dim('  1 passed (11.2 s)')] },
      blocks: [
        { p: 'An end-to-end test starts the whole system (website, server, database, a payment sandbox) and acts like a person, here with Playwright:' },
        { lang: 'ts', code: `import { test, expect } from '@playwright/test';

test('buy a lamp with SAVE10', async ({ page }) => {
  await page.goto('/shop/lamp');
  await page
    .getByRole('button', { name: 'Add to cart' })
    .click();
  await page
    .getByLabel('Discount code')
    .fill('SAVE10');
  await expect(page.getByText('$90.00'))
    .toBeVisible();
  await page
    .getByRole('button', { name: 'Pay' })
    .click();
  await expect(page.getByRole('heading'))
    .toHaveText('Thanks for your order');
});` },
        { p: 'If this passes, a real customer can almost certainly check out. But it takes seconds, needs every part running, and when it fails the cause could be anywhere: the page, the server, the database or the network.' },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', here: [0, 1, 2], scene: 'quiz', done: 1,
      say: 'Your turn. The discount is sometimes wrong. Which test finds the cause fastest?',
      check: {
        type: 'choice', q: 'Customers say the 10% discount is sometimes wrong. Which test finds the cause fastest?',
        opts: [
          { t: 'An end-to-end test that buys a lamp with SAVE10', hint: 'It would show the wrong total, but it takes seconds and the cause could be in the page, server or database. Which test touches only the discount math?' },
          { t: 'A unit test that calls applyDiscount with a few prices' },
          { t: 'An integration test that saves an order to the database', hint: 'The database only stores the number. The discount is worked out before that. Which test runs just the calculation?' },
        ],
        ans: 1, why: 'A unit test runs the discount math directly in about a millisecond, so you can try dozens of prices instantly. If one fails, the bug is in applyDiscount.',
      },
    },
    {
      lvl: 'basics', label: 'Why the shape', title: 'Why this shape?', here: [0, 1, 2], scene: 'axis', done: 2,
      say: 'Going up the pyramid, tests get slower, cost more and act more like a real user. Going down, they get faster and point right at the bug. So most tests live at the bottom.',
      read: { tiles: [{ k: 'Unit', v: '~1–10 ms', sub: 'points at one function' }, { k: 'Integration', v: '~50 ms–1 s', sub: 'points at one seam' }, { k: 'End-to-end', v: '~5–60 s', sub: 'points at "somewhere"' }] },
      blocks: [
        { table: { head: ['', 'Unit', 'Integration', 'End-to-end'], rows: [
          ['**Typical time each**', '~1–10 ms', '~50 ms–1 s', '~5–60 s'],
          ['**A failure points to**', 'one function', 'one seam', '"somewhere"'],
          ['**Confidence the whole app works**', 'low', 'medium', 'high'],
          ['**Flakiness**', 'almost none', 'some', 'most'],
          ['**Example share of suite**', '~70–80%', '~15–20%', '~5–10%'],
        ] } },
        { p: 'Times and shares are typical ranges to give a feel, not rules.' },
        { callout: 'key', title: 'The trade-off in one line', text: 'Each layer up buys realism and costs time, money and clarity. Use the **cheapest test that can catch the bug**.' },
      ],
    },
    {
      lvl: 'basics', label: 'Mix it', title: 'Try it: mix your own suite', here: [0, 1, 2], scene: 'mix', done: 2,
      say: 'Drag the slider and watch what happens. As end-to-end tests take over, the suite gets much slower, flaky failures pile up, and the pyramid flips into a cone.',
      read: { tiles: [{ k: 'Suite time', v: '' }, { k: 'Flaky fails / week', v: '' }, { k: 'Shape', v: '' }] },
      blocks: [
        { slider: { label: 'End-to-end tests: {v}% of 1,000 tests', min: 5, max: 75, step: 5, value: 10 } },
        { p: 'The suite always has 1,000 tests in total, and 200 of them are integration tests. The slider moves tests between **unit** and **end-to-end**. Try 10%, then 50%.' },
        { ul: ['**Suite time** is the total if every test runs one after another. Running tests in parallel divides the time, but not the flakiness.', '**Flaky fails per week** counts random failures across 20 runs a week, when nothing in the code was wrong.'] },
        { callout: 'illus', text: 'Illustrative model: unit 5 ms, integration 300 ms, end-to-end 10 s each. One end-to-end run in 500 fails randomly; one integration run in 5,000.' },
      ],
    },
    {
      lvl: 'basics', label: 'Ice-cream cone', title: 'The anti-pattern: an ice-cream cone', here: [], scene: 'cone', done: 3,
      say: 'Many teams end up upside down: lots of manual checks and slow browser tests, very few unit tests. It looks like an ice-cream cone, and it wobbles.',
      read: { term: [cmd('npm run test:all'), dim('running 380 browser tests…'), no('checkout › pay with card', 'timeout 30 s'), no('search › filter by size', 'element not found'), dim('2 failed, 478 passed in 64 min'), dim('re-run… both pass now (flaky)')] },
      blocks: [
        { p: 'The upside-down shape is called the **ice-cream cone**. Meet a team with 60 unit tests, 40 integration tests, 380 browser tests and a manual checklist before each release.' },
        { p: 'It usually grows by accident: someone finds a bug, writes a browser test for it, and repeats that for years.' },
        { ul: ['The suite takes an hour, so people stop running it before pushing.', '[[flaky|Flaky]] failures train the team to click "re-run" instead of reading the error.', 'When a test does fail, someone digs through the whole stack to find out why.'] },
        { callout: 'warn', title: 'Warning sign', text: 'If your team\'s first reaction to a red build is "just re-run it", you probably have an ice-cream cone.' },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', here: [0, 1, 2], scene: 'quiz', done: 3,
      say: 'Your turn. Match each bug to the layer that should catch it.',
      check: {
        type: 'match', q: 'Three bugs reached customers. Which test layer should have caught each one?', bins: ['Unit', 'Integration', 'End-to-end'],
        bugs: [
          { t: 'Tax is rounded to the wrong cent on orders over $100.', a: 0, why: 'Pure arithmetic in one function: a unit test.', hint: 'The tax bug is pure math inside one function.' },
          { t: 'A database column was renamed, and saving an order now fails.', a: 1, why: 'Only a test that talks to the real database sees this: an integration test.', hint: 'The column bug only shows up when real code meets the real database.' },
          { t: 'A new cookie banner covers the Pay button on small screens.', a: 2, why: 'Only a real browser rendering the real page notices this: an end-to-end test.', hint: 'The banner bug needs a real page in a real browser to see it.' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Push down', title: 'Push each test down', here: [2, 0], scene: 'push', done: 3,
      say: 'When a slow test catches a bug, ask: what is the lowest layer that could have caught it? Write that test first, watch it fail, then fix the code.',
      read: { term: [cmd('npx vitest price'), no('price never goes below zero', 'expected -500 to be 0'), dim('… fix applied …'), cmd('npx vitest price'), ok('price never goes below zero', '2 ms'), ok('SAVE10 takes 10% off', '1 ms')] },
      blocks: [
        { p: 'The end-to-end checkout test fails: a $5 sticker with the `TEN_OFF` code ($10 off) charged the customer **−$5** (someone had added a `TEN_OFF` branch to `applyDiscount`). It took 12 seconds and a screenshot to notice. Before fixing it, write the cheapest test that sees the bug:' },
        { lang: 'ts', code: `// The bug: this branch was added last week
if (code === 'TEN_OFF') return cents - 1000;
// 500 - 1000 = -500

// 1. Write the unit test first. It fails (red).
test('price never goes below zero', () => {
  expect(applyDiscount(500, 'TEN_OFF')).toBe(0);
});

// 2. Fix the code. The test passes (green).
if (code === 'TEN_OFF') return Math.max(0, cents - 1000);` },
        { p: 'Now the bug is caught in 2 milliseconds, on every save, and the failure names the exact function. Keep the end-to-end test only if it checks something lower tests cannot, such as "the page really shows the discounted total".' },
        { callout: 'key', title: 'Habit', text: 'Every bug fix comes with a test at the lowest layer that would have caught it. Over time, this keeps the pyramid\'s shape on its own.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Worked example', title: 'Worked example: cone to pyramid', here: [0, 1, 2], scene: 'refactor', done: 3,
      say: 'Here is the cone team from earlier, three months later. They pushed checks down. Many more tests, yet the suite is eight times faster and far less flaky.',
      read: { tiles: [{ k: 'Suite time', v: '64 → 8 min', sub: 'one after another' }, { k: 'Flaky fails / week', v: '~15 → ~2', sub: '20 runs a week' }, { k: 'Tests', v: '480 → 1,190', sub: 'more tests, less time' }] },
      blocks: [
        { table: { head: ['', 'Unit', 'Integration', 'End-to-end', 'Manual'], rows: [
          ['**Before**', '60', '40', '380', '1 day per release'],
          ['**After**', '960', '190', '40', 'exploratory only'],
        ] } },
        { p: 'What they did, in order:' },
        { ol: ['Grouped the 380 browser tests by what they really checked. Most checked rules (prices, tax, validation), not the browser.', 'Rewrote each rule as a few unit tests, often several per browser test, since unit tests can cheaply try many inputs.', 'Moved database and API checks into integration tests, one seam each.', 'Kept 40 end-to-end tests for real customer journeys: sign up, search, check out, refund.'] },
        { callout: 'illus', text: 'Illustrative numbers, using the same model as the slider: unit 5 ms, integration 300 ms, end-to-end 10 s, with the same flake rates.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Doubles', title: 'Stubs, mocks and fakes', here: [0], scene: 'doubles', done: 4,
      say: 'To keep unit tests fast, swap slow or risky parts for stand-ins. A stub gives fixed answers, a mock checks it was called correctly, and a fake is a tiny working copy.',
      read: { term: [cmd('npx vitest checkout'), ok('charges the discounted total', '3 ms'), dim('  mock  payments.charge called with 9000 ✓'), dim('  fake  orders.count() = 1 ✓'), dim('  stub  tax.rateFor() returned 0'), dim('     Tests  1 passed (0.05 s)')] },
      blocks: [
        { p: 'Checkout needs three things: a payment service (slow, costs money), the order database (slow) and a tax service. In a unit test we replace them with **test doubles**:' },
        { table: { head: ['Double', 'What it does', 'Here'], rows: [
          ['**[[stub|Stub]]**', 'Returns a fixed answer. You don\'t check how it was called.', 'tax rate is always 0'],
          ['**[[mock|Mock]]**', 'Knows which call to expect; the test checks it happened.', 'was `charge(9000)` called?'],
          ['**[[fake|Fake]]**', 'A small working version of the real thing.', 'orders kept in memory'],
        ] } },
        { lang: 'ts', code: `import { test, expect, vi } from 'vitest';

test('charges the discounted total', async () => {
  // mock: we will check how it was called
  const payments = {
    charge: vi.fn().mockResolvedValue('ok'),
  };
  // fake: a small working order store
  const orders = new InMemoryOrderRepository();
  // stub: always answers 0
  const tax = { rateFor: () => 0 };

  const checkout = new Checkout(payments, orders, tax);
  await checkout.placeOrder({
    cents: 10000, code: 'SAVE10',
  });

  expect(payments.charge).toHaveBeenCalledWith(9000);
  expect(orders.count()).toBe(1);
});` },
        { callout: 'warn', title: 'Don\'t overdo mocks', text: 'A test that checks every internal call breaks on every refactor, even when behaviour is unchanged. Mock only at the edges (payments, email, other services) and prefer checking results.' },
        { callout: 'key', title: 'Keep the fake honest', text: 'Run the same test cases against the in-memory fake and the real database repository (as an integration test). If they disagree, the fake has drifted.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Contracts', title: 'Contract tests between services', here: [1], scene: 'contract', done: 4,
      say: 'When two teams talk over an API, each tests with a stand-in for the other. A contract test makes sure the stand-in still matches the real service.',
      read: { term: [cmd('npm run verify:pacts   # in Payments\' CI'), dim('Verifying pact between Shop and Payments'), no('a charge for order A1', 'expected status 201, got 400'), dim('  request body had amountCents; Payments now reads amount'), dim('build failed: Payments is not deployed')] },
      blocks: [
        { p: 'Our **Shop** calls a separate **Payments** service: `POST /charges` with `{ orderId, amountCents }`. Shop\'s unit tests use a stand-in for Payments. Payments\' tests use made-up requests.' },
        { p: 'Now the Payments team renames `amountCents` to `amount`. Both teams\' tests still pass, because neither talks to the other. Production breaks.' },
        { p: 'A [[contract|contract test]] fixes that gap. With a tool like Pact, Shop\'s tests record exactly what Shop sends and expects back:' },
        { lang: 'ts', code: `// In Shop's tests (the consumer)
provider
  .uponReceiving('a charge for order A1')
  .withRequest({
    method: 'POST',
    path: '/charges',
    body: { orderId: 'A1', amountCents: 9000 },
  })
  .willRespondWith({ status: 201 });

await provider.executeTest(async (mock) => {
  const client = new PaymentsClient(mock.url);
  await client.charge('A1', 9000);
});` },
        { p: 'That record (the "pact") is shared with Payments. Payments\' CI replays it against the real Payments service. After the rename, the replay gets a 400, so **Payments\' build fails before it is deployed**, not after.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'CI stages', title: 'Where each layer runs in CI', here: [0, 1, 2], scene: 'ci', done: 4,
      say: 'Run the fast, cheap tests first so most mistakes are caught in about a minute. Slower checks run later, and the full browser suite can run nightly.',
      read: { term: [cmd('git push'), ok('lint + unit tests', '1 m 05 s'), ok('integration tests', '3 m 40 s'), ok('smoke E2E (8 of 40 journeys)', '1 m 25 s'), dim('ready to merge · all 40 E2E run tonight at 02:00')] },
      blocks: [
        { p: 'CI (continuous integration) runs your tests automatically on every push. Order the stages so the cheapest catch most mistakes first:' },
        { table: { head: ['Stage', 'When', 'About'], rows: [
          ['**Lint + unit**', 'every push', '1 min'],
          ['**Integration**', 'every push, after unit', '4 min'],
          ['**Smoke E2E**', 'before merge or deploy', '1.5 min'],
          ['**Full E2E**', 'nightly or before a release', '7 min'],
        ] } },
        { ul: ['A **smoke** suite is a handful of end-to-end tests for the journeys that must never break, such as sign-in and checkout.', 'If a stage fails, later stages don\'t run, so you hear back in minutes, not an hour.', 'Quarantined flaky tests run in their own job that reports but does not block.'] },
        { p: 'Times are illustrative, for the 40 end-to-end tests the team kept in step 12 (about 10 s each).' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Other shapes', title: 'Other shapes: trophy and honeycomb', here: [1], scene: 'shapes', done: 4,
      say: 'The pyramid is a guide, not a law. Front-end teams often use a trophy, with integration tests as the biggest part. Microservice teams may use a honeycomb.',
      read: { tiles: [{ k: 'Pyramid', v: 'Logic-heavy', sub: 'rules, calculations, libraries' }, { k: 'Trophy', v: 'Front-end', sub: 'UI components + their data' }, { k: 'Honeycomb', v: 'Services', sub: 'microservices, many seams' }] },
      blocks: [
        { ul: [
          '**Testing trophy** (Kent C. Dodds, 2018, for front-end apps): a base of **static checks** (type checking and linting), a modest unit layer, a **large integration layer**, and a small end-to-end top. A UI component tested alone proves little; tested with its real children and data, it proves a lot.',
          '**Testing honeycomb** (Spotify engineers, 2018, for microservices): mostly **integration tests** of each service with its real database, a few "implementation detail" tests for tricky logic, and a few "integrated" tests that depend on other services being up.',
        ] },
        { p: 'All three agree: **prefer the cheapest test that gives real confidence**, and keep slow end-to-end tests few. They differ on which middle layer gives the best value for a kind of system.' },
        { callout: 'key', title: 'How to choose', text: 'Look at where your last 20 bugs came from. Mostly in logic? Grow the base. Mostly in how parts connect? Grow the middle.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Flaky tests', title: 'Taming flaky tests', here: [2], scene: 'flaky', done: 4,
      say: 'A flaky test passes and fails with no code change. Run it many times to prove it, find the cause, and fix it, instead of re-running and hoping.',
      read: { term: [cmd('npx playwright test search --repeat-each=20'), ok('17 passed'), no('3 failed', '"results list" not visible after 5 s'), dim('cause: test reads results before the search request finishes')] },
      blocks: [
        { p: 'Running one test 20 times in a row (as in the diagram) is the quickest way to prove it is flaky, and later to prove your fix worked. Common causes:' },
        { table: { head: ['Cause', 'Fix'], rows: [
          ['Fixed sleeps (`wait 2 s`)', 'Wait for a condition, such as "results list is visible".'],
          ['Tests share data and run in a different order', 'Each test creates its own data and cleans up.'],
          ['Real network, clock or randomness', 'Control them: stub the network, freeze the clock, seed random values.'],
        ] } },
        { p: 'If you can\'t fix it today, **quarantine** it: move it to a separate job that reports but doesn\'t block, give it an owner and a deadline.' },
        { callout: 'warn', title: 'About retries', text: 'Automatic retries turn red builds green, but they hide the flake and make the suite slower. If you use them, record every retry so the flakiness stays visible.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', here: [0, 1, 2], scene: 'quiz', done: 4,
      say: 'A slow, flaky suite. What do you do first?',
      check: {
        type: 'choice', q: 'Your end-to-end suite takes 40 minutes and fails randomly about once a day. What is the best first move?',
        opts: [
          { t: 'Turn on automatic retries so every test runs up to three times', hint: 'Retries turn the build green but hide the flaky tests, and the suite gets even slower. What would remove the cause?' },
          { t: 'Quarantine the flaky tests, find their causes, and push checks that don\'t need a browser down to unit or integration tests' },
          { t: 'Delete all the end-to-end tests', hint: 'Then nothing checks that a customer can really sign in and pay. Keep a few for real journeys.' },
          { t: 'Run the suite once a week instead of on every push', hint: 'Bugs would be found days after they were written, when the cause is hardest to find.' },
        ],
        ans: 1, why: 'Quarantine stops random failures blocking everyone today. Finding causes fixes them for good. Pushing checks down makes the suite faster and failures more precise, while a few end-to-end tests still cover real journeys.',
      },
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', here: [1], scene: 'quiz', done: 4,
      say: 'Last one. A field was renamed between two services. Which test catches it first?',
      check: {
        type: 'choice', q: 'Payments renames amountCents to amount. Shop\'s unit tests use a stand-in for Payments. Which test fails first, before anything reaches customers?',
        opts: [
          { t: 'Shop\'s unit tests', hint: 'Shop\'s stand-in for Payments still accepts amountCents, so these keep passing. That is exactly the gap.' },
          { t: 'The contract test in Payments\' CI, replaying what Shop sends' },
          { t: 'The nightly full end-to-end suite', hint: 'It might catch it, but only after the change has merged, and possibly after it has been deployed.' },
        ],
        ans: 1, why: 'The pact records what Shop really sends. Payments\' CI replays it against the new code, gets a 400 and fails the build, so the rename never ships.',
      },
    },
  ],
};
