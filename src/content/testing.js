// Module 3: Testing, lesson format 2: definition, Basics + Intermediate, scenes, checks.
// Diagram steps (add/edges/flows/state) are drawn by src/mapscene.js at the places in each lesson's `map`;
// steps with `scene` use src/content/scenes/testing.js.
import { scenes } from './scenes/testing.js';

export { pyramid } from './testing-pyramid.js';

const tile = (k, v, sub, tone) => ({ k, v, sub, tone });

// ---------------------------------------------------------------------------------------------
export const doubles = {
  format: 2,
  slug: 'test-doubles',
  title: 'Stand-ins for Tests',
  short: 'Test Doubles',
  minutes: 16,
  level: 'Beginner → Intermediate',
  promise: 'Replace slow, unpredictable collaborators with stand-ins, and learn which stand-in each job needs.',
  definition: {
    sentence: 'A **test double** is any object that stands in for a real dependency during a test, so the test is fast, repeatable and about your code alone.',
    more: 'The name and the five kinds (dummy, stub, fake, spy, mock) come from Gerard Meszaros\'s book xUnit Test Patterns (2007). Many tools call all of them "mocks", which hides real differences.',
    analogy: { title: 'Think of a stunt double', text: 'The film still gets its shot, but nobody risks the lead actor for it. A test double lets the test run the scene without the real database, inbox or clock.' },
    mini: '**Test double:** a stand-in for a real dependency, so a test is fast, repeatable and focused.',
  },
  learn: [
    'Explain why real collaborators make unit tests slow and flaky.',
    'Choose between a stub, a fake, a spy and a mock for each dependency.',
    'Keep doubles at the edges, and wrap code you do not own before mocking it.',
    'Keep fakes honest with a shared contract suite.',
  ],
  metrics: [
    { key: 'time', label: 'Test time' },
    { key: 'det', label: 'Same result every run?' },
    { key: 'real', label: 'Real systems touched' },
  ],
  scenes,
  terms: {
    sut: ['System under test', 'the code a test is about; everything else it talks to is a collaborator.'],
    flaky: ['Flaky test', 'a test that sometimes passes and sometimes fails without any change to the code.'],
    query: ['Query', 'a call that asks for information and changes nothing, such as reading the time.'],
    command: ['Command', 'a call that causes an effect, such as sending an email or charging a card.'],
    contract: ['Contract suite', 'one set of tests run against every implementation of an interface, so they all behave the same way.'],
    adapter: ['Adapter', 'a small class of yours that wraps someone else\'s API behind an interface you designed.'],
  },
  map: {
    nodes: {
      test: [50, 150, 88], sut: [176, 150, 124],
      db: [386, 40, 150], fakeDb: [386, 40, 150], mail: [386, 112, 150], spyMail: [386, 112, 150],
      clock: [386, 184, 150], stubClock: [386, 184, 150], captcha: [386, 256, 150], stubCaptcha: [386, 256, 150],
    },
  },
  nodes: {
    test: { x: 100, y: 230, label: 'signup.test', icon: 'test', kind: 'test', w: 140 },
    sut: { x: 330, y: 230, label: 'SignupService', sub: 'system under test', icon: 'user', kind: 'class', w: 170, h: 62 },
    db: { x: 630, y: 70, label: 'Postgres', sub: 'real', icon: 'db', kind: 'store', w: 170 },
    fakeDb: { x: 630, y: 70, label: 'InMemoryUsers', sub: 'fake', icon: 'box', kind: 'double', w: 170 },
    mail: { x: 630, y: 175, label: 'Email API', sub: 'real, sends mail', icon: 'mail', kind: 'store', w: 170 },
    spyMail: { x: 630, y: 175, label: 'RecordingMailer', sub: 'spy', icon: 'eye', kind: 'double', w: 170 },
    clock: { x: 630, y: 280, label: 'System clock', sub: 'real, keeps moving', icon: 'clock', kind: 'store', w: 170 },
    stubClock: { x: 630, y: 280, label: 'FixedClock', sub: 'stub: 2026-01-15', icon: 'clock', kind: 'double', w: 170 },
    captcha: { x: 630, y: 385, label: 'Captcha check', sub: 'real, network', icon: 'shield', kind: 'store', w: 170 },
    stubCaptcha: { x: 630, y: 385, label: 'AlwaysHuman', sub: 'stub', icon: 'shield', kind: 'double', w: 170 },
  },
  steps: [
    {
      lvl: 'basics', label: 'Real things', title: 'A unit test that touches four real systems', done: 0,
      say: 'Signing up saves a user, sends a welcome email, checks a captcha and starts a 14-day trial. Tested with the real things, one test touches a database, an email provider, the internet and the clock.',
      add: ['test', 'sut', 'db', 'mail', 'clock', 'captcha'],
      edges: [['test', 'sut'], ['sut', 'db'], ['sut', 'mail'], ['sut', 'clock'], ['sut', 'captcha']],
      flows: [['test', 'sut', { n: 1, dur: 2.6 }], ['sut', 'db', { n: 1, dur: 2.6 }], ['sut', 'mail', { n: 1, dur: 2.6, delay: 0.3 }], ['sut', 'captcha', { n: 1, dur: 2.6, delay: 0.6 }]],
      state: { db: 'bad', mail: 'bad', captcha: 'bad', clock: 'bad' },
      metrics: { time: '3.8 s', det: 'no', real: '4' },
      blocks: [
        { lang: 'ts', code: `test('new users get a welcome email and a 14-day trial', async () => {
  const service = new SignupService(postgres, emailApi, systemClock, captcha);
  const user = await service.signUp('ana@example.com');
  // trialEndsOn is a calendar day, such as '2026-01-29'
  expect(user.trialEndsOn).toBe(isoDay(addDays(new Date(), 14)));
});` },
        { p: 'The [[sut|system under test]] is `SignupService`. The other four are collaborators, and every one of them is real.' },
        { callout: 'illus', title: 'About the numbers', text: 'Test times in this lesson are illustrative, chosen to show the size of the difference.' },
      ],
    },
    {
      lvl: 'basics', label: 'Flaky', title: 'Same test, different results', scene: 'dblFlaky', done: 1,
      say: 'Run it five times and it fails twice: once because the captcha service was slow, once because the trial date shifted while the test ran past midnight.',
      read: { tiles: [tile('Runs', '5', 'no code changes'), tile('Failed', '2', 'network, clock', 'bad'), tile('Slowest', '30 s', 'a timeout', 'bad')] },
      blocks: [
        { p: 'A [[flaky|flaky test]] trains people to press "re-run" instead of reading the failure. Soon a real bug gets re-run too.' },
        { ul: ['**Network:** the captcha and email services can be slow or down.', '**Time:** `new Date()` in the code and in the test are read at different moments. If midnight passes in between, they land on different days.'] },
      ],
    },
    {
      lvl: 'basics', label: 'Stub', title: 'Stubs give canned answers', done: 1,
      say: 'A stub answers a question with a fixed value and does nothing else. The clock always says 15 January; the captcha always says human.',
      remove: ['clock', 'captcha'],
      add: ['stubClock', 'stubCaptcha'],
      edges: [['test', 'sut'], ['sut', 'db'], ['sut', 'mail'], ['sut', 'stubClock'], ['sut', 'stubCaptcha']],
      flows: [['sut', 'stubClock', { n: 1, tone: 'ok' }], ['sut', 'stubCaptcha', { n: 1, tone: 'ok' }]],
      state: { db: 'bad', mail: 'bad' },
      metrics: { time: '1.2 s', det: 'almost', real: '2' },
      blocks: [
        { lang: 'ts', code: `const clock = { now: () => new Date('2026-01-15T09:00:00Z') };
const captcha = { verify: async () => true };

expect(user.trialEndsOn).toBe('2026-01-29');` },
        { callout: 'key', title: 'Use a stub for', text: 'Inputs your code reads: the time, random numbers, configuration, feature flags, "is this a human?".' },
        { p: 'This only works because `SignupService` takes the clock as a parameter instead of calling `new Date()` itself. Code that is easy to test this way is usually easier to change, too.' },
      ],
    },
    {
      lvl: 'basics', label: 'Fake', title: 'Fakes really work, just not in production', done: 2,
      say: 'A fake is a working implementation with a shortcut: a map in memory instead of Postgres. Save a user and you can load it back.',
      remove: ['db'],
      add: ['fakeDb'],
      edges: [['test', 'sut'], ['sut', 'fakeDb'], ['sut', 'mail'], ['sut', 'stubClock'], ['sut', 'stubCaptcha']],
      flows: [['sut', 'fakeDb', { n: 2, tone: 'ok' }]],
      state: { mail: 'bad' },
      metrics: { time: '1.1 s', det: 'yes', real: '1' },
      blocks: [
        { lang: 'ts', code: `class InMemoryUsers implements UserRepo {
  private byEmail = new Map<string, User>();
  async add(u: User) {
    if (this.byEmail.has(u.email)) throw new DuplicateEmail();
    this.byEmail.set(u.email, u);
  }
  async find(email: string) { return this.byEmail.get(email) ?? null; }
}` },
        { p: 'With a stub you would hard-code "user not found". With a fake you can test real behaviour, such as "a second sign-up with the same email is rejected".' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: the slowest part', done: 2,
      say: 'Clock, captcha and database are now doubles. Only the email API is still real.',
      state: { mail: 'bad' },
      check: {
        type: 'predict', q: 'Three of the four collaborators are now doubles. Which one decides how long the test takes?',
        opts: [{ t: 'The in-memory fake database' }, { t: 'The real email API' }, { t: 'The fixed clock' }],
        fb: ['The fake is a map in memory: it answers in microseconds.', '', 'A stub hands back a fixed value instantly.'],
        ans: 1, why: 'The test waits for the one remaining network call: the real email API, about a second here. One slow collaborator sets the speed of the whole test, which is why the next step replaces it too.',
      },
    },
    {
      lvl: 'basics', label: 'Spy', title: 'Spies record what was sent out', done: 2,
      say: 'Sending an email returns nothing useful to check. A spy stands in for the mailer and records every call, so the test can look afterwards.',
      remove: ['mail'],
      add: ['spyMail'],
      edges: [['test', 'sut'], ['sut', 'fakeDb'], ['sut', 'spyMail'], ['sut', 'stubClock'], ['sut', 'stubCaptcha']],
      flows: [['test', 'sut', { n: 2, dur: 0.8 }], ['sut', 'spyMail', { n: 2, tone: 'ok', dur: 0.8 }]],
      state: { spyMail: 'hl' },
      metrics: { time: '6 ms', det: 'yes', real: '0' },
      blocks: [
        { lang: 'ts', code: `const sent: Email[] = [];
const mailer = { send: async (e: Email) => { sent.push(e); } };

await new SignupService(users, mailer, clock, captcha).signUp('ana@example.com');

expect(sent).toEqual([expect.objectContaining({ to: 'ana@example.com', template: 'welcome' })]);` },
        { p: 'Test libraries build spies for you. In Vitest, `vi.fn()` records its calls, and matchers such as `toHaveBeenCalledWith` read them:' },
        { lang: 'ts', code: `const mailer = { send: vi.fn() };
await new SignupService(users, mailer, clock, captcha).signUp('ana@example.com');
expect(mailer.send).toHaveBeenCalledTimes(1);
expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({ template: 'welcome' }));` },
        { p: 'A strict **mock** turns this around: you declare the expected calls before running the code, and any unexpected call fails the test at once. Prefer the spy by default; reach for a strict mock when an extra call, such as a second charge, must never happen.' },
        { table: { head: ['Double', 'What it does'], rows: [
          ['Dummy', 'Fills a parameter; never actually used'],
          ['Stub', 'Returns canned answers'],
          ['Fake', 'Works, with a shortcut (in memory)'],
          ['Spy', 'Records calls; the test checks them afterwards'],
          ['Mock', 'Is told the expected calls up front and fails if they do not happen'],
        ] } },
        { changes: [['~', 'Test time 3.8 s → 6 ms'], ['~', 'Real systems touched: 4 → 0']] },
      ],
    },
    {
      lvl: 'basics', label: 'In and out', title: 'Queries in, commands out', scene: 'dblInOut', done: 2,
      say: 'A simple way to choose: when your code asks for something, stub or fake the answer. When your code tells something to happen, spy on or mock the call.',
      read: { tiles: [tile('Asks (query)', 'stub / fake', 'check the result'), tile('Tells (command)', 'spy / mock', 'check the call'), tile('Your own logic', 'real', 'no double')] },
      blocks: [
        { p: 'For a [[query|query]] you only care what your code does **with** the answer, so assert on the result. For a [[command|command]] the effect is the point, so assert that the call happened, with the right arguments.' },
        { callout: 'warn', title: 'Do not verify queries', text: 'Asserting "the clock was asked once" checks how the code works, not what it does. Read the time twice next month and that test breaks for no reason.' },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 2,
      say: 'Pick the double that fits the job.',
      check: {
        type: 'choice', q: 'Your test must prove that a refund charges the payment gateway **exactly once**, for 4,999 cents. What do you put in place of the gateway?',
        opts: [
          { t: 'A stub that always returns "ok"', hint: 'A stub answers, but it cannot tell you how many times it was called, or with what.' },
          { t: 'A spy or mock, then check the recorded call' },
          { t: 'The real gateway in test mode', hint: 'That works for a few integration tests, but it is slow and needs the network. Is there a lighter option for a unit test?' },
        ],
        ans: 1, why: 'Charging is a command: the effect is the point. A spy records the call so you can assert one call with 4,999 cents; a mock does the same check through expectations set up front.',
      },
    },
    {
      lvl: 'intermediate', label: 'Over-mocking', title: 'Mock the edges, not the middle', scene: 'dblOverMock', done: 3,
      say: 'If a test replaces every class the service uses, it describes the implementation line by line. Fold one small internal class into the service and nine tests fail, though nothing is broken.',
      read: { tiles: [tile('Behaviour changed', 'no', 'one class inlined'), tile('Edge-mocked suite', '12 ✓', 'still green', 'good'), tile('Mock-everything suite', '9 ✗', 'false alarms', 'bad')] },
      blocks: [
        { lang: 'ts', code: `// Over-mocked: pins how signUp works, not what it does
expect(validator.check).toHaveBeenCalledWith('ana@example.com');
expect(pricing.trialDays).toHaveBeenCalledTimes(1);` },
        { p: 'Tests like this break on every refactor, so people stop refactoring. Use real objects for everything inside your own module, and doubles only where the code meets the outside world: time, randomness, network, storage, email.' },
        { callout: 'illus', title: 'About the numbers', text: 'The test counts in the diagram are illustrative.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Own it', title: 'Don\'t mock what you don\'t own', scene: 'dblOwn', done: 3,
      say: 'Mocking a vendor SDK directly bakes your guess about it into hundreds of tests. Wrap it in a small interface of your own, mock that, and test the wrapper against the vendor\'s sandbox.',
      read: { tiles: [tile('Unit tests mock', 'your own', 'interface, not the SDK'), tile('Adapter tests use', 'sandbox', 'the real API, test mode'), tile('Vendor changes', '1 file', 'the adapter', 'good')] },
      blocks: [
        { lang: 'ts', code: `export interface PaymentGateway {
  charge(paymentMethodId: string, cents: number): Promise<ChargeId>;
}

export class StripeGateway implements PaymentGateway {
  constructor(private stripe: Stripe) {}
  async charge(paymentMethodId: string, cents: number) {
    const intent = await this.stripe.paymentIntents.create({
      amount: cents, currency: 'eur', payment_method: paymentMethodId, confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });
    return intent.id as ChargeId;
  }
}` },
        { p: 'The [[adapter|adapter]] is the only code that knows the SDK. Its few tests run against the provider\'s test mode in CI; everything else is tested against `PaymentGateway`, which you designed and understand.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Honest fakes', title: 'Keep fakes honest with one shared suite', scene: 'dblContract', done: 4,
      say: 'A fake is only useful while it behaves like the real thing. Run the same contract tests against both, and drift shows up as a red test, not a production bug.',
      read: { tiles: [tile('Suites', '1', 'run twice'), tile('Backends', '2', 'fake and Postgres'), tile('Drift caught', 'in CI', 'not in production', 'good')] },
      blocks: [
        { lang: 'ts', code: `describe.each([
  ['InMemoryUsers', () => new InMemoryUsers()],
  ['PostgresUsers', () => new PostgresUsers(testDb())],
])('%s', (_name, make) => {
  test('rejects a duplicate email, ignoring case', async () => {
    const users = make();
    await users.add(user('ana@example.com'));
    await expect(users.add(user('Ana@Example.com'))).rejects.toThrow(DuplicateEmail);
  });
});` },
        { p: 'This is a [[contract|contract suite]]. When production adds a rule, such as a case-insensitive unique index on email, the shared test fails for the fake until the fake learns the rule too.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'Sort each dependency into the lightest stand-in that does the job.',
      check: {
        type: 'match', q: 'For each dependency in a unit test, what should you use?', bins: ['Stub', 'Fake', 'Spy or mock', 'Real object'],
        bugs: [
          { t: 'The current time, for "has the trial expired?"', a: 0, why: 'A query: fix its answer with a stub.', hint: 'Does your code ask it something, or tell it to do something?' },
          { t: 'The user repository, used by 200 sign-up tests', a: 1, why: 'Many tests need real save-and-load behaviour; an in-memory fake gives it cheaply.', hint: 'Do the tests need it to really store and find things?' },
          { t: 'The SMS sender, for "a code is texted exactly once"', a: 2, why: 'A command whose effect is the point: record the call and check it.', hint: 'Is the call itself what you need to check?' },
          { t: 'A pure `formatPrice()` helper in your module', a: 3, why: 'Fast, deterministic and yours: use the real one.', hint: 'Is there anything slow or unpredictable about it?' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: the lightest double that works', done: 4,
      say: 'Doubles make tests fast and repeatable. Stub what you ask, spy on what you tell, fake what is heavy, keep your own logic real, and keep fakes honest.',
      state: { spyMail: 'ok', fakeDb: 'ok', stubClock: 'ok', stubCaptcha: 'ok' },
      flows: [],
      blocks: [
        { ul: [
          '**Why:** real collaborators make unit tests slow and [[flaky|flaky]].',
          '**Stubs** answer queries; **fakes** work in memory; **spies and mocks** check commands.',
          '**At the edges only:** time, randomness, network, storage and email. Keep your own logic real.',
          '**Wrap what you do not own** behind your interface, and test the wrapper against the real service.',
          '**Contract suites** keep fakes and real implementations in step.',
        ] },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
const T1 = 'Hello World';
const T2 = 'punctuation, spaces';
const T3 = 'accents';
const T4 = 'no letters at all';

export const tdd = {
  format: 2,
  slug: 'tdd',
  title: 'Red, Green, Refactor',
  short: 'Test-Driven Development',
  minutes: 15,
  level: 'Beginner → Intermediate',
  promise: 'Build a small function one failing test at a time, and see how the loop shapes the code.',
  definition: {
    sentence: '**Test-driven development (TDD)** means writing a small failing test first, then the simplest code that passes it, then cleaning up, in a loop that takes minutes: red, green, refactor.',
    more: 'Kent Beck popularised it as part of Extreme Programming around 2000. The tests are a side effect; the main product is code designed in small, checked steps.',
    analogy: { title: 'Think of a climbing rope', text: 'A climber clips the rope in every few metres. A slip costs a short fall, not the whole climb. Each passing test is a clip: a broken change sends you back minutes, not days.' },
    mini: '**TDD:** failing test first, simplest code to pass, then clean up. Red, green, refactor.',
  },
  learn: [
    'Run the loop: red, green, refactor, and say why the order matters.',
    'Write the simplest code that passes, and let the next test force the general version.',
    'Refactor safely, and start every bug fix with a failing test.',
    'Know where TDD fits, and the inside-out and outside-in styles.',
  ],
  metrics: [],
  scenes,
  terms: {
    regression: ['Regression test', 'a test that reproduces a bug that was fixed, so it cannot quietly return.'],
    triangulate: ['Triangulation', 'adding a second, different example so a hard-coded answer can no longer pass and the code has to become general.'],
    spike: ['Spike', 'a short, throwaway experiment to learn something, such as how a library behaves, before writing the real code.'],
  },
  steps: [
    {
      lvl: 'basics', label: 'The loop', title: 'Three steps, repeated every few minutes', scene: 'tddLoop', done: 0,
      say: 'Red: write a small test for behaviour that does not exist yet, and watch it fail. Green: write just enough code to pass. Refactor: improve the code while every test stays green.',
      read: { tiles: [tile('Red', 'fail first', 'proves the test works', 'bad'), tile('Green', 'pass simply', 'no extra features', 'good'), tile('Refactor', 'clean up', 'tests stay green')] },
      blocks: [
        { p: 'We will build `slugify`, which turns a blog title into the last part of its URL: "Hello World" becomes `hello-world`.' },
        { callout: 'key', title: 'Why red first', text: 'Seeing the test fail proves it can fail. A test that has never been red might not be testing anything.' },
      ],
    },
    {
      lvl: 'basics', label: 'Red 1', title: 'First test: lower case and hyphens', scene: 'tddBoard', done: 1,
      say: 'Describe the behaviour from the caller\'s side. slugify does not exist yet, so the test fails.',
      board: { phase: 'red', tests: [[T1, 'red']], code: ['// nothing yet'] },
      read: { term: [['cmd', 'npx vitest run slugify'], ['no', 'lower-cases and joins words with hyphens'], ['dim', '  ReferenceError: slugify is not defined']] },
      blocks: [
        { lang: 'ts', code: `test('lower-cases and joins words with hyphens', () => {
  expect(slugify('Hello World')).toBe('hello-world');
});` },
        { p: 'Read the failure. Nothing is written or imported yet, so "slugify is not defined" is the right reason to fail. A test failing for the wrong reason, such as a typo in the test, teaches you nothing.' },
      ],
    },
    {
      lvl: 'basics', label: 'Green 1', title: 'The simplest code that passes', scene: 'tddBoard', done: 2,
      say: 'Resist writing the complete version. Write only what the test demands, so every line of code is there because a test asked for it.',
      board: { phase: 'green', tests: [[T1, 'green']], code: ['export const slugify =', '  (t: string) =>', '    t.toLowerCase()', "     .split(' ')", "     .join('-');"] },
      read: { term: [['cmd', 'npx vitest run slugify'], ['ok', 'lower-cases and joins words with hyphens', '2 ms']] },
      blocks: [
        { lang: 'ts', code: `export const slugify = (t: string) =>
  t.toLowerCase().split(' ').join('-');` },
        { callout: 'tip', title: 'Even simpler is allowed', text: '`return \'hello-world\'` would also pass. Beck calls that "fake it till you make it". It is fine, because the next test will force the real code.' },
      ],
    },
    {
      lvl: 'basics', label: 'Red 2', title: 'Next test: punctuation and extra spaces', scene: 'tddBoard', done: 2,
      say: 'A real title has punctuation and stray spaces. Write that as the next test, and watch it fail for the right reason.',
      board: { phase: 'red', tests: [[T1, 'green'], [T2, 'red']], code: ['export const slugify =', '  (t: string) =>', '    t.toLowerCase()', "     .split(' ')", "     .join('-');"] },
      read: { term: [['cmd', 'npx vitest run slugify'], ['ok', 'lower-cases and joins words with hyphens'], ['no', 'drops punctuation and collapses spaces'], ['dim', "  expected 'ship-it-now'"], ['dim', "  received '--ship-it-—-now!--'"]] },
      blocks: [
        { lang: 'ts', code: `test('drops punctuation and collapses spaces', () => {
  expect(slugify('  Ship it — now!  ')).toBe('ship-it-now');
});` },
        { p: 'The first test still passes. Only the new behaviour is red, which tells you exactly what to build next.' },
      ],
    },
    {
      lvl: 'basics', label: 'Green 2', title: 'Make both pass', scene: 'tddBoard', done: 2,
      say: 'Replace every run of characters that are not letters or digits with one hyphen, then trim hyphens from both ends.',
      board: { phase: 'green', tests: [[T1, 'green'], [T2, 'green']], code: ['export const slugify =', '  (t: string) =>', '    t.toLowerCase()', "     .replace(/[^a-z0-9]+/g, '-')", "     .replace(/^-+|-+$/g, '');"] },
      read: { term: [['cmd', 'npx vitest run slugify'], ['ok', 'lower-cases and joins words with hyphens'], ['ok', 'drops punctuation and collapses spaces'], ['ok', '2 passed']] },
      blocks: [
        { lang: 'ts', code: `export const slugify = (t: string) =>
  t.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');` },
        { p: 'The second example forced the general rule. That is [[triangulate|triangulation]]: two different examples rule out a hard-coded answer.' },
      ],
    },
    {
      lvl: 'basics', label: 'Refactor', title: 'Clean up with a safety net', scene: 'tddBoard', done: 3,
      say: 'Now improve the code without changing what it does. Name the steps. Run the tests after each small change; they must stay green.',
      board: { phase: 'refactor', tests: [[T1, 'green'], [T2, 'green']], code: ["const NON_ALNUM = /[^a-z0-9]+/g;", "const EDGE_DASH = /^-+|-+$/g;", '', 'export const slugify =', '  (t: string) =>', '    t.toLowerCase()', "     .replace(NON_ALNUM, '-')", "     .replace(EDGE_DASH, '');"] },
      read: { term: [['cmd', 'npx vitest --watch slugify'], ['ok', '2 passed', 'after rename'], ['ok', '2 passed', 'after extract']] },
      blocks: [
        { p: 'Because the tests pin the behaviour, you can restructure boldly. If something goes red, the change you just made is the culprit, and undo is one keystroke away.' },
        { callout: 'warn', title: 'Refactor means no new behaviour', text: 'Handling accented letters would be new behaviour. That needs its own red test first, which is the next step.' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: accents', scene: 'tddBoard', done: 3,
      board: { phase: null, tests: [[T1, 'green'], [T2, 'green']], code: ['export const slugify =', '  (t: string) =>', '    t.toLowerCase()', "     .replace(NON_ALNUM, '-')", "     .replace(EDGE_DASH, '');", '', "slugify('Crème brûlée') // ?"], note: 'no test yet: what will it return?' },
      say: 'Before writing a test for "Crème brûlée", predict what today\'s code returns.',
      check: {
        type: 'predict', q: 'What does the current `slugify(\'Crème brûlée\')` return?',
        opts: [{ t: '`creme-brulee`' }, { t: '`cr-me-br-l-e`' }, { t: 'It throws an error' }],
        fb: ['That would need accents removed first. `è` is not in `[a-z0-9]`.', '', 'Nothing in the code can throw on a string; the regex just replaces characters.'],
        ans: 1, why: 'Each accented letter is outside `[a-z0-9]`, so it is replaced by a hyphen: "cr-me-br-l-e". Predicting the output is how you find out a test is needed.',
      },
    },
    {
      lvl: 'basics', label: 'Red, green', title: 'New behaviour gets its own red test', scene: 'tddBoard', done: 3,
      say: 'Write the accent test, see it fail, then pass it by splitting each accented letter into a base letter plus a mark, and dropping the marks.',
      board: {
        before: { phase: 'red', tests: [[T1, 'green'], [T2, 'green'], [T3, 'red']], code: ['export const slugify =', '  (t: string) =>', '    t.toLowerCase()', "     .replace(NON_ALNUM, '-')", "     .replace(EDGE_DASH, '');"], note: 'the accent test fails first' },
        phase: 'green', tests: [[T1, 'green'], [T2, 'green'], [T3, 'green']], code: ['const MARKS = /[\\u0300-\\u036f]/g;', 'const plain = (t: string) =>', "  t.normalize('NFKD')", "   .replace(MARKS, '');", 'export const slugify =', '  (t: string) =>', '    plain(t).toLowerCase()', "     .replace(NON_ALNUM, '-')", "     .replace(EDGE_DASH, '');"],
      },
      read: { term: [['cmd', 'npx vitest run slugify'], ['no', 'removes accents'], ['dim', "  expected 'creme-brulee'"], ['dim', "  received 'cr-me-br-l-e'"], ['cmd', 'npx vitest run slugify'], ['ok', '3 passed', 'after the fix']] },
      blocks: [
        { lang: 'ts', code: `test('removes accents', () => {
  expect(slugify('Crème brûlée')).toBe('creme-brulee');
});` },
        { p: '`normalize(\'NFKD\')` turns "è" into "e" followed by a combining accent mark (U+0300 to U+036F). Removing that range leaves plain letters.' },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', scene: 'tddLoop', done: 3,
      say: 'New behaviour turns up during a refactor. What now?',
      check: {
        type: 'choice', q: 'You are in the **refactor** step, and you notice an easy way to also support emoji in titles. What should you do?',
        opts: [
          { t: 'Add it now while the code is open', hint: 'Refactoring must not change behaviour. Emoji support is new behaviour with no test.' },
          { t: 'Finish the refactor green, then start a new loop with a failing emoji test' },
          { t: 'Add it, then write a test that matches what it does', hint: 'A test written to match existing code cannot fail first, so it proves little.' },
        ],
        ans: 1, why: 'New behaviour enters only through a red test. Refactoring keeps behaviour the same while the tests stay green.',
      },
    },
    {
      lvl: 'intermediate', label: 'Bugs', title: 'Every bug fix starts with a failing test', scene: 'tddBoard', done: 4,
      say: 'A user reports that a title of only punctuation gives an empty URL. First write a test that reproduces the bug and fails. Then fix it.',
      board: {
        before: { phase: 'red', tests: [[T1, 'green'], [T2, 'green'], [T3, 'green'], [T4, 'red']], code: ['export const slugify =', '  (t: string) =>', '    plain(t).toLowerCase()', "     .replace(NON_ALNUM, '-')", "     .replace(EDGE_DASH, '');", "// '!!!' gives '' today"], note: 'reproduce the bug first' },
        phase: 'green', tests: [[T1, 'green'], [T2, 'green'], [T3, 'green'], [T4, 'green']], code: ['export const slugify =', '  (t: string) =>', '    plain(t).toLowerCase()', "     .replace(NON_ALNUM, '-')", "     .replace(EDGE_DASH, '')", "     || 'untitled';"], note: 'now the fix is proven, and the test stays',
      },
      read: { term: [['cmd', 'npx vitest run slugify'], ['no', "gives a fallback for titles with no letters"], ['dim', "  expected 'untitled'"], ['dim', "  received ''"]] },
      blocks: [
        { lang: 'ts', code: `test('gives a fallback for titles with no letters', () => {
  expect(slugify('!!!')).toBe('untitled');
});

export const slugify = (t: string) =>
  plain(t).toLowerCase()
    .replace(NON_ALNUM, '-')
    .replace(EDGE_DASH, '') || 'untitled';` },
        { p: 'The failing test proves you understood the bug. When it turns green, it stays in the suite as a [[regression|regression test]], so the bug cannot quietly return.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Where it fits', title: 'Great for logic, awkward for exploration', scene: 'tddFit', done: 4,
      say: 'TDD shines when you know what the code should do: rules, parsing, a reproducible bug. When you are still discovering what to build, spike first, throw it away, then test-drive the real thing.',
      read: { tiles: [tile('Clear inputs, outputs', 'test first', 'rules, parsers', 'good'), tile('Unknown territory', 'spike', 'learn, then delete'), tile('After the spike', 'TDD', 'build it properly')] },
      blocks: [
        { p: 'A [[spike|spike]] answers a question, such as "how does this charting library handle time zones?". Its code is thrown away, because it was written to learn, not to last.' },
        { callout: 'tip', title: 'Design pressure', text: 'Writing the test first makes hard-to-test designs painful straight away. That pain pushes you towards small functions and injected dependencies, like the clock in the test doubles lesson.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Two styles', title: 'Inside-out or outside-in', scene: 'tddSchools', done: 4,
      say: 'Some teams build from the smallest pieces up, with real objects. Others start from the outer request and use doubles for collaborators that do not exist yet.',
      read: { tiles: [tile('Inside-out', 'classicist', 'real objects, state checks'), tile('Outside-in', 'mockist', 'doubles, interaction checks'), tile('In practice', 'both', 'pick per feature')] },
      blocks: [
        { table: { head: ['', 'Inside-out (classicist, "Chicago")', 'Outside-in (mockist, "London")'], rows: [
          ['Starts with', 'The core logic, such as `slugify`', 'The request, such as `POST /posts`'],
          ['Collaborators', 'Real objects where possible', 'Doubles until each one is built'],
          ['Risk', 'Building pieces nobody ends up calling', 'Tests tied to the planned call structure'],
        ] } },
        { p: 'The outside-in style is described in Freeman and Pryce\'s Growing Object-Oriented Software, Guided by Tests (2009). Both styles use the same red, green, refactor loop.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', scene: 'tddFit', done: 4,
      say: 'Decide where to start for each task.',
      check: {
        type: 'match', q: 'For each task, would you start with a failing test or with a spike?', bins: ['Failing test first', 'Spike first'],
        bugs: [
          { t: 'VAT must round to the nearest cent, half up', a: 0, why: 'Clear rule, clear examples: perfect for test-first.', hint: 'Do you already know the expected outputs?' },
          { t: 'Try three chart libraries to see which handles 1M points', a: 1, why: 'You are learning, not building. Throw the experiment away afterwards.', hint: 'Do you know yet what the code should look like?' },
          { t: 'Users report that "Q&A" becomes "q-a" instead of "q-and-a"', a: 0, why: 'A reproducible bug: write the failing test that shows it, then fix.', hint: 'Can you state the expected output exactly?' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: small steps, always green', scene: 'tddLoop', done: 4,
      say: 'Red proves the test can fail. Green with the simplest code. Refactor while green. New behaviour and every bug fix start with a red test.',
      read: { tiles: [tile('Tests written', '4', 'each one red first'), tile('Bugs that can return', '0', 'regression test kept', 'good'), tile('Loop length', 'minutes', 'never far from green')] },
      blocks: [
        { ul: [
          '**Red** first proves the test can fail; read why it fails.',
          '**Green** with the simplest code; let the next example force the general version.',
          '**Refactor** only while green, and never add behaviour there.',
          '**Bugs** start with a failing [[regression|regression test]].',
          '**Fit:** test-first for known behaviour; [[spike|spike]] first when you are still learning.',
        ] },
      ],
    },
  ],
};
