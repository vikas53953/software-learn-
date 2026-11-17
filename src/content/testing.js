// Module 3: Testing

export const pyramid = {
  slug: 'test-pyramid',
  title: 'Shape of a Test Suite',
  short: 'Test Pyramid',
  minutes: 10,
  level: 'Beginner',
  promise: 'Why a suite of 300 browser tests takes 45 minutes and still misses bugs, and what a healthier mix looks like.',
  learn: [
    'Unit, integration and end-to-end tests: what each one proves',
    'The "ice cream cone" and why it hurts',
    'Building the pyramid from the bottom',
    'Test behaviour, not implementation',
  ],
  metrics: [
    { key: 'time', label: 'Suite time' },
    { key: 'flaky', label: 'Flaky reds / week' },
    { key: 'locate', label: 'Time to find the bug' },
  ],
  nodes: {
    cE2e: { x: 400, y: 100, label: 'End-to-end · 300 tests', sub: 'real browser, full stack', icon: 'eye', kind: 'band-bad', w: 560, h: 74 },
    cInt: { x: 400, y: 215, label: 'Integration · 60', icon: 'layers', kind: 'band', w: 340, h: 66 },
    cUnit: { x: 400, y: 320, label: 'Unit · 40', icon: 'test', kind: 'band', w: 180, h: 62 },
    pE2e: { x: 390, y: 100, label: 'E2E · 15', sub: 'critical journeys', icon: 'eye', kind: 'band', w: 200, h: 66 },
    pInt: { x: 390, y: 215, label: 'Integration · 150', sub: 'real DB, real HTTP, in containers', icon: 'layers', kind: 'band', w: 400, h: 70 },
    pUnit: { x: 390, y: 335, label: 'Unit · 1,200', sub: 'pure logic, milliseconds each', icon: 'test', kind: 'band-ok', w: 560, h: 78 },
    cost: { x: 745, y: 100, label: 'slower\ncostlier', kind: 'note', icon: false, w: 96, h: 48 },
    fast: { x: 745, y: 340, label: 'faster\ncheaper', kind: 'note', icon: false, w: 96, h: 48 },
  },
  steps: [
    {
      label: 'Ice cream cone', tag: 'problem',
      title: 'Most tests drive a real browser',
      add: ['cE2e', 'cInt', 'cUnit'],
      metrics: { time: '45 min', flaky: '9', locate: 'hours' },
      body: [
        'The team tests mostly through the UI: log in, click through checkout, assert on the screen. It feels thorough because it exercises everything.',
        'Each test takes seconds to minutes, depends on test data, timing and the network, and when it fails it says "checkout broke" rather than which line broke it.',
      ],
      callout: { type: 'warn', text: 'Top-heavy suites are called the "ice cream cone". Slow feedback trains people to ignore red builds.' },
      done: 0,
    },
    {
      label: 'Three layers', tag: 'idea',
      title: 'Each layer proves something different',
      state: { cE2e: 'dim', cInt: 'dim', cUnit: 'dim' },
      body: [
        '**Unit tests** check one piece of logic in isolation: "a 31-day-old invoice is overdue". Milliseconds, deterministic, and they point at the exact function.',
        '**Integration tests** check that your code works with real things it talks to: the SQL actually runs, the HTTP client parses the real response.',
        '**End-to-end tests** check that a user journey works with everything deployed together.',
      ],
      callout: { type: 'key', text: 'Higher layers give more confidence per test but cost more per test: slower, flakier and vaguer when they fail.' },
      done: 1,
    },
    {
      label: 'Wide base', tag: 'solution',
      title: 'Push each check to the lowest layer that can catch it',
      remove: ['cE2e', 'cInt', 'cUnit'],
      add: ['pUnit', 'fast'],
      state: { pUnit: 'hl' },
      metrics: { time: '20 s (unit)', locate: 'seconds' },
      body: [
        'Pricing rules, validation, date maths and state machines get unit tests. There will be many of them, and that is fine: 1,200 tests at a few milliseconds each finish in about 20 seconds.',
        'Logic that is hard to unit test is usually logic tangled up with I/O. Separating them (see Dependency Inversion) is what makes this layer possible.',
      ],
      done: 2,
    },
    {
      label: 'Middle', tag: 'solution',
      title: 'Integration tests for the seams',
      add: ['pInt'],
      state: { pInt: 'hl' },
      metrics: { time: '≈ 2.5 min' },
      body: [
        'Each adapter gets tested against the real thing: repositories against a throwaway Postgres container, HTTP clients against a recorded or contract-tested API.',
        'These catch the bugs unit tests cannot: a typo in SQL, a wrong column type, a misread JSON field.',
      ],
      done: 2,
    },
    {
      label: 'Thin top', tag: 'solution',
      title: 'A few end-to-end tests for the journeys that pay the bills',
      add: ['pE2e', 'cost'],
      state: { pE2e: 'hl' },
      metrics: { time: '≈ 8 min', flaky: '< 1', locate: 'minutes' },
      body: [
        'Keep 10 to 20 E2E tests for the flows that must never break: sign up, log in, check out, pay. They are a smoke alarm, not the main detector.',
        'When an E2E test finds a bug, write a lower-level test that reproduces it too. Then the next regression is caught in seconds.',
      ],
      callout: { type: 'tip', text: 'The numbers here are illustrative. The shape matters more than the exact ratio.' },
      done: 3,
    },
    {
      label: 'Behaviour', tag: 'tradeoff',
      title: 'Test what the code does, not how it does it',
      state: {},
      body: [
        'A unit test that asserts "method X calls method Y with Z" breaks on every refactor even when behaviour is unchanged. Assert on outputs and observable effects instead.',
        'Some teams prefer a "trophy" with a fatter integration layer, especially for thin CRUD services where most risk is in the wiring. Pick the shape that matches where your bugs actually come from.',
      ],
      done: 4,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: fast at the bottom, few at the top',
      body: [
        '**Many unit tests** for logic, **some integration tests** for seams, **few E2E tests** for critical journeys.',
        '**Fast feedback** is the point: under 10 minutes for the whole suite keeps people trusting it.',
        '**Every escaped bug** earns a test at the lowest layer that could have caught it.',
      ],
      done: 4,
    },
  ],
};

export const doubles = {
  slug: 'test-doubles',
  title: 'Stand-ins for Tests',
  short: 'Test Doubles',
  minutes: 11,
  level: 'Intermediate',
  promise: 'Stubs, fakes and mocks are not the same thing. Learn which to reach for, and when not to.',
  learn: [
    'Why real collaborators make unit tests slow and flaky',
    'Stubs: canned answers',
    'Fakes: working lightweight implementations',
    'Mocks and spies: verifying interactions',
    'Over-mocking, and "don\'t mock what you don\'t own"',
  ],
  metrics: [
    { key: 'time', label: 'Test time' },
    { key: 'det', label: 'Deterministic?' },
    { key: 'real', label: 'Real systems touched' },
  ],
  nodes: {
    test: { x: 100, y: 230, label: 'signup.test', icon: 'test', kind: 'test', w: 140 },
    sut: { x: 330, y: 230, label: 'SignupService', sub: 'system under test', icon: 'user', kind: 'class', w: 170, h: 62 },
    db: { x: 630, y: 70, label: 'Postgres', sub: 'real', icon: 'db', kind: 'store', w: 170 },
    fakeDb: { x: 630, y: 70, label: 'InMemoryUsers', sub: 'fake', icon: 'box', kind: 'double', w: 170 },
    mail: { x: 630, y: 175, label: 'Email API', sub: 'real, sends mail', icon: 'mail', kind: 'store', w: 170 },
    spyMail: { x: 630, y: 175, label: 'RecordingMailer', sub: 'spy / mock', icon: 'eye', kind: 'double', w: 170 },
    clock: { x: 630, y: 280, label: 'System clock', sub: 'real, keeps moving', icon: 'clock', kind: 'store', w: 170 },
    stubClock: { x: 630, y: 280, label: 'FixedClock', sub: 'stub: 2026-01-15', icon: 'clock', kind: 'double', w: 170 },
    captcha: { x: 630, y: 385, label: 'Captcha check', sub: 'real, network', icon: 'shield', kind: 'store', w: 170 },
    stubCaptcha: { x: 630, y: 385, label: 'AlwaysHuman', sub: 'stub', icon: 'shield', kind: 'double', w: 170 },
  },
  steps: [
    {
      label: 'Real things', tag: 'problem',
      title: 'A unit test that touches four real systems',
      add: ['test', 'sut', 'db', 'mail', 'clock', 'captcha'],
      edges: [['test', 'sut'], ['sut', 'db'], ['sut', 'mail'], ['sut', 'clock'], ['sut', 'captcha']],
      flows: [['test', 'sut', { n: 1, dur: 2.6 }], ['sut', 'db', { n: 1, dur: 2.6 }], ['sut', 'mail', { n: 1, dur: 2.6, delay: 0.3 }], ['sut', 'captcha', { n: 1, dur: 2.6, delay: 0.6 }]],
      state: { mail: 'warn', captcha: 'warn', clock: 'warn' },
      metrics: { time: '3.8 s', det: 'no', real: '4' },
      body: [
        'Testing "a new user gets a welcome email and a 14-day trial" with the real collaborators means a database, an email provider that really sends mail, a captcha service on the internet and a clock that never shows the same time twice.',
        'The test is slow, sometimes fails on network blips, and its "trial ends" assertion breaks around midnight.',
      ],
      done: 0,
    },
    {
      label: 'Stub', tag: 'solution',
      title: 'Stubs return canned answers',
      remove: ['clock', 'captcha'],
      add: ['stubClock', 'stubCaptcha'],
      edges: [['test', 'sut'], ['sut', 'db'], ['sut', 'mail'], ['sut', 'stubClock'], ['sut', 'stubCaptcha']],
      flows: [['sut', 'stubClock', { n: 1, tone: 'ok' }], ['sut', 'stubCaptcha', { n: 1, tone: 'ok' }]],
      state: { stubClock: 'ok', stubCaptcha: 'ok', mail: 'warn' },
      metrics: { real: '2' },
      body: [
        'A **stub** answers questions with fixed values and does nothing else. `FixedClock` always says 15 January 2026, so "trial ends 29 January" is always true.',
        'Use stubs for inputs your code reads: time, random numbers, configuration, a "yes, human" from a captcha.',
      ],
      code: { lang: 'ts', src: `const clock = { now: () => new Date('2026-01-15T09:00:00Z') };
const captcha = { verify: async () => true };` },
      done: 1,
    },
    {
      label: 'Fake', tag: 'solution',
      title: 'Fakes really work, just not in production',
      remove: ['db'],
      add: ['fakeDb'],
      edges: [['test', 'sut'], ['sut', 'fakeDb'], ['sut', 'mail'], ['sut', 'stubClock'], ['sut', 'stubCaptcha']],
      flows: [['sut', 'fakeDb', { n: 2, tone: 'ok' }]],
      state: { fakeDb: 'ok', mail: 'warn' },
      metrics: { real: '1' },
      body: [
        'A **fake** is a working implementation with a shortcut: an in-memory map instead of Postgres. You can save a user and load it back, and test "duplicate email is rejected" for real.',
        'Fakes need their own tests (or a shared contract test with the real adapter) so they do not drift from production behaviour.',
      ],
      code: { lang: 'ts', src: `class InMemoryUsers implements UserRepo {
  private byEmail = new Map<string, User>();
  async add(u: User) {
    if (this.byEmail.has(u.email)) throw new DuplicateEmail();
    this.byEmail.set(u.email, u);
  }
  async find(email: string) { return this.byEmail.get(email) ?? null; }
}` },
      done: 2,
    },
    {
      label: 'Mock / spy', tag: 'solution',
      title: 'Mocks and spies check what was sent out',
      remove: ['mail'],
      add: ['spyMail'],
      edges: [['test', 'sut'], ['sut', 'fakeDb'], ['sut', 'spyMail'], ['sut', 'stubClock'], ['sut', 'stubCaptcha']],
      flows: [['test', 'sut', { n: 2, dur: 0.8 }], ['sut', 'spyMail', { n: 2, tone: 'ok', dur: 0.8 }]],
      state: { spyMail: 'hl' },
      metrics: { time: '6 ms', det: 'yes', real: '0' },
      body: [
        'Sending an email is a side effect: there is nothing to read back. A **spy** records the calls so the test can assert on them afterwards. A **mock** is set up with expectations in advance and fails if they are not met.',
        'Use them for outgoing commands that matter to the business: "exactly one welcome email went to this address".',
      ],
      code: { lang: 'ts', src: `const sent: Email[] = [];
const mailer = { send: async (e: Email) => { sent.push(e); } };

await new SignupService(users, mailer, clock, captcha).signUp('ana@example.com');

expect(sent).toEqual([expect.objectContaining({
  to: 'ana@example.com', template: 'welcome',
})]);` },
      changes: [['~', 'Test time 3.8 s → 6 ms'], ['~', 'Real systems touched: 4 → 0']],
      done: 3,
    },
    {
      label: 'Over-mocking', tag: 'tradeoff',
      title: 'Mock the edges, not the middle',
      flows: [],
      state: {},
      body: [
        'If a test mocks every class the service talks to and checks every call, it describes the implementation line by line. Rename a private helper and twenty tests fail, though nothing is broken.',
        '**Don\'t mock what you don\'t own.** Mocking a vendor SDK directly encodes your guess about how it behaves. Wrap the SDK in your own small adapter, mock that, and integration-test the adapter against the real service.',
      ],
      callout: { type: 'key', text: 'Rule of thumb: stub queries, mock or spy on commands, fake heavyweight dependencies, and keep real objects for everything inside your own module.' },
      done: 5,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: pick the lightest double that works',
      body: [
        '**Dummy:** passed in but never used. **Stub:** canned answers. **Fake:** working shortcut. **Spy:** records calls. **Mock:** pre-programmed expectations.',
        '**Doubles belong at boundaries:** time, randomness, network, storage and email.',
        '**Verify fakes** against the real thing with contract or integration tests.',
      ],
      done: 5,
    },
  ],
};

export const tdd = {
  slug: 'tdd',
  title: 'Red, Green, Refactor',
  short: 'Test-Driven Development',
  minutes: 9,
  level: 'Beginner',
  promise: 'Build a small function one failing test at a time, and see how the loop shapes the design.',
  learn: [
    'The three-step loop and why the order matters',
    'Writing the simplest code that passes',
    'Refactoring with a safety net',
    'Where TDD fits, and where it doesn\'t',
  ],
  metrics: [
    { key: 'tests', label: 'Tests' },
    { key: 'pass', label: 'Passing' },
    { key: 'phase', label: 'Phase' },
  ],
  nodes: {
    red: { x: 400, y: 85, label: 'Red', sub: 'write a failing test', icon: 'x', kind: 'phase-red', w: 190, h: 62 },
    green: { x: 615, y: 360, label: 'Green', sub: 'make it pass, simply', icon: 'check', kind: 'phase-green', w: 190, h: 62 },
    refactor: { x: 185, y: 360, label: 'Refactor', sub: 'clean up, stay green', icon: 'wrench', kind: 'phase-blue', w: 190, h: 62 },
    fn: { x: 400, y: 245, label: 'slugify()', sub: 'title → URL path', icon: 'code', kind: 'class', w: 160 },
  },
  steps: [
    {
      label: 'The loop', tag: 'idea',
      title: 'Three steps, repeated every few minutes',
      add: ['red', 'green', 'refactor'],
      edges: [['red', 'green', { bend: -60 }], ['green', 'refactor', { bend: -40 }], ['refactor', 'red', { bend: -60 }]],
      flows: [['red', 'green', { bend: -60, n: 1, dur: 2.4 }], ['green', 'refactor', { bend: -40, n: 1, dur: 2.4, delay: 0.33 }], ['refactor', 'red', { bend: -60, n: 1, dur: 2.4, delay: 0.66 }]],
      metrics: { tests: '0', pass: '—', phase: '—' },
      body: [
        '**Red:** write a small test for behaviour that does not exist yet, and watch it fail. **Green:** write just enough code to pass. **Refactor:** improve the code while every test stays green.',
        'We will build `slugify`, which turns a blog title into a URL path segment.',
      ],
      callout: { type: 'key', text: 'Seeing the test fail first proves the test can fail. A test that has never been red might not be testing anything.' },
      done: 0,
    },
    {
      label: 'Red 1', tag: 'problem',
      title: 'First test: lower-case and hyphens',
      add: ['fn'],
      edges: [['red', 'green', { bend: -60 }], ['green', 'refactor', { bend: -40 }], ['refactor', 'red', { bend: -60 }], ['red', 'fn', { dash: true, tone: 'bad' }]],
      flows: [],
      state: { red: 'bad', fn: 'dim' },
      metrics: { tests: '1', pass: '0 / 1', phase: 'red' },
      body: [
        'The test describes the behaviour from the caller\'s side. `slugify` does not exist yet, so it fails.',
      ],
      code: { lang: 'ts', src: `test('lower-cases and joins words with hyphens', () => {
  expect(slugify('Hello World')).toBe('hello-world');
});
// ✗ ReferenceError: slugify is not defined` },
      done: 1,
    },
    {
      label: 'Green 1', tag: 'solution',
      title: 'The simplest code that passes',
      edges: [['red', 'green', { bend: -60 }], ['green', 'refactor', { bend: -40 }], ['refactor', 'red', { bend: -60 }], ['green', 'fn', { dash: true, tone: 'ok' }]],
      flows: [['red', 'green', { bend: -60, n: 1, tone: 'ok' }]],
      state: { green: 'ok', fn: '' },
      metrics: { pass: '1 / 1', phase: 'green' },
      body: [
        'Resist writing the "complete" version. Write only what the tests demand, so every line of code is justified by a test.',
      ],
      code: { lang: 'ts', src: `export const slugify = (s: string) =>
  s.toLowerCase().split(' ').join('-');
// ✓ 1 passing` },
      done: 2,
    },
    {
      label: 'Red 2', tag: 'problem',
      title: 'Next test: punctuation and extra spaces',
      edges: [['red', 'green', { bend: -60 }], ['green', 'refactor', { bend: -40 }], ['refactor', 'red', { bend: -60 }], ['red', 'fn', { dash: true, tone: 'bad' }]],
      flows: [['refactor', 'red', { bend: -60, n: 1, tone: 'bad' }]],
      state: { red: 'bad' },
      metrics: { tests: '2', pass: '1 / 2', phase: 'red' },
      body: [
        'A real title has punctuation and stray whitespace. Write that down as the next test, and watch it fail for the right reason.',
      ],
      code: { lang: 'ts', src: `test('drops punctuation and collapses spaces', () => {
  expect(slugify('  Ship it — now!  ')).toBe('ship-it-now');
});
// ✗ expected 'ship-it-now', got '--ship-it-—-now!--'` },
      done: 2,
    },
    {
      label: 'Green 2', tag: 'solution',
      title: 'Make both pass',
      edges: [['red', 'green', { bend: -60 }], ['green', 'refactor', { bend: -40 }], ['refactor', 'red', { bend: -60 }], ['green', 'fn', { dash: true, tone: 'ok' }]],
      flows: [['red', 'green', { bend: -60, n: 1, tone: 'ok' }]],
      state: { green: 'ok' },
      metrics: { pass: '2 / 2', phase: 'green' },
      body: [
        'Replace any run of non-alphanumeric characters with one hyphen, then trim hyphens from the ends.',
      ],
      code: { lang: 'ts', src: `export const slugify = (s: string) =>
  s.toLowerCase()
   .replace(/[^a-z0-9]+/g, '-')
   .replace(/^-+|-+$/g, '');
// ✓ 2 passing` },
      done: 2,
    },
    {
      label: 'Refactor', tag: 'solution',
      title: 'Clean up with a safety net',
      edges: [['red', 'green', { bend: -60 }], ['green', 'refactor', { bend: -40 }], ['refactor', 'red', { bend: -60 }], ['refactor', 'fn', { dash: true, tone: 'accent' }]],
      flows: [['green', 'refactor', { bend: -40, n: 1 }]],
      state: { refactor: 'hl' },
      metrics: { pass: '2 / 2', phase: 'refactor' },
      body: [
        'Now improve the code without changing behaviour: name the steps, and handle accented letters by stripping diacritics. Run the tests after each small change.',
        'Because the tests pin the behaviour, you can restructure boldly. If something goes red, the last change is the culprit.',
      ],
      code: { lang: 'ts', src: `const stripAccents = (s: string) =>
  s.normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '');

export const slugify = (title: string) =>
  stripAccents(title).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
// ✓ 2 passing` },
      callout: { type: 'tip', text: 'Accent handling is new behaviour, so strictly it deserves its own red test first: expect(slugify("Café")).toBe("cafe").' },
      done: 3,
    },
    {
      label: 'Where it fits', tag: 'tradeoff',
      title: 'Great for logic, awkward for exploration',
      flows: [['red', 'green', { bend: -60, n: 1, dur: 2.4 }], ['green', 'refactor', { bend: -40, n: 1, dur: 2.4, delay: 0.33 }], ['refactor', 'red', { bend: -60, n: 1, dur: 2.4, delay: 0.66 }]],
      state: {},
      body: [
        'TDD shines for logic with clear inputs and outputs: parsers, pricing, permissions, state machines. Writing the test first also pushes you towards small, decoupled units, because hard-to-test code is painful to write tests for first.',
        'It is less useful when you do not yet know what you are building, like a UI prototype or a spike to learn an API. Explore first, throw the spike away, then drive the real version with tests.',
      ],
      done: 4,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: small steps, always green',
      body: [
        '**Red** proves the test can fail. **Green** with the simplest code. **Refactor** while green.',
        '**Small steps:** each loop takes minutes, so you are never far from working code.',
        '**Design pressure:** testable-first code tends to be modular code.',
      ],
      done: 4,
    },
  ],
};
