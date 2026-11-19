// Module 1: Design principles (SOLID), lesson format 2: definition, Basics + Intermediate, scenes, checks.
// Diagram steps (add/edges/flows/state) are drawn by src/mapscene.js at the places in each lesson's `map`;
// steps with `scene` use src/content/scenes/principles.js.
import { scenes } from './scenes/principles.js';

const tile = (k, v, sub, tone) => ({ k, v, sub, tone });

// ---------------------------------------------------------------------------------------------
export const srp = {
  format: 2,
  slug: 'single-responsibility',
  title: 'One Reason to Change',
  short: 'Single Responsibility',
  minutes: 16,
  level: 'Beginner → Intermediate',
  promise: 'Why a class that serves four teams breaks four times as often, and how to split it along the right seams.',
  definition: {
    sentence: 'The Single Responsibility Principle says a module should have **one reason to change**: it should answer to one group of people, not several.',
    more: 'It is the S in SOLID, named by Robert C. Martin. "Responsibility" does not mean "does only one thing". It means "is changed for only one stakeholder\'s reasons", so two teams never need to edit the same code for unrelated requests.',
    analogy: { title: 'Think of a shared kitchen drawer', text: 'If cutlery, batteries and takeaway menus share one drawer, everyone rummages through it and things get knocked about. Give each its own drawer and people stop getting in each other\'s way.' },
    mini: '**Single responsibility:** one module, one group of people who ask for its changes.',
  },
  learn: [
    'Say what "one reason to change" means, using owners (actors) instead of "does one thing".',
    'Spot a class with too many owners: merge conflicts, unrelated test failures, "and" in its description.',
    'Split along owner lines with a thin coordinator on top, safely, behind tests.',
    'Find seams from change history, and know when to stop splitting.',
  ],
  metrics: [
    { key: 'lines', label: 'Biggest class' },
    { key: 'reasons', label: 'Reasons to change' },
    { key: 'conflicts', label: 'Merge conflicts / wk' },
    { key: 'blast', label: 'Blast radius' },
  ],
  scenes,
  terms: {
    actor: ['Actor', 'a person or team who asks for changes to the code, such as Finance or the security team.'],
    cohesion: ['Cohesion', 'how closely the parts of a module belong together. High cohesion: everything in it changes for the same reason.'],
    conflict: ['Merge conflict', 'when two branches edit the same lines and git cannot combine them automatically, so a person has to.'],
    characterization: ['Characterization test', 'a test that records what the code does today, right or wrong, so you notice if a refactor changes it.'],
    facade: ['Facade', 'a thin class that keeps an old entry point working while it hands the real work to new, smaller classes.'],
  },
  map: {
    nodes: {
      fin: [62, 26, 112], mkt: [180, 26, 112], dba: [298, 26, 112], sec: [416, 26, 112],
      req: [48, 165, 84], god: [148, 165, 104],
      val: [290, 90, 124], price: [290, 140, 124], repo: [290, 190, 124], mail: [290, 240, 124],
      db: [420, 190, 96], smtp: [420, 240, 96],
    },
  },
  nodes: {
    req: { x: 95, y: 230, label: 'Checkout', sub: 'HTTP request', icon: 'user', kind: 'actor', w: 136 },
    god: { x: 320, y: 230, label: 'OrderService', sub: '820 lines', icon: 'class', kind: 'class', w: 168, h: 62 },
    db: { x: 720, y: 270, label: 'Orders DB', icon: 'db', kind: 'store', w: 130 },
    smtp: { x: 720, y: 375, label: 'Mail server', icon: 'mail', kind: 'store', w: 130 },
    fin: { x: 120, y: 60, label: 'Finance', sub: 'new tax rule', kind: 'note', w: 130, h: 46 },
    mkt: { x: 270, y: 60, label: 'Marketing', sub: 'new receipt copy', kind: 'note', w: 140, h: 46 },
    dba: { x: 425, y: 60, label: 'DBA', sub: 'schema change', kind: 'note', w: 130, h: 46 },
    sec: { x: 575, y: 60, label: 'Security', sub: 'stricter input', kind: 'note', w: 140, h: 46 },
    val: { x: 520, y: 140, label: 'OrderValidator', sub: '90 lines', icon: 'shield', kind: 'class', w: 160 },
    price: { x: 520, y: 225, label: 'PriceCalculator', sub: '120 lines', icon: 'chart', kind: 'class', w: 160 },
    repo: { x: 520, y: 310, label: 'OrderRepository', sub: '80 lines', icon: 'db', kind: 'class', w: 160 },
    mail: { x: 520, y: 395, label: 'ReceiptMailer', sub: '60 lines', icon: 'mail', kind: 'class', w: 160 },
  },
  steps: [
    {
      lvl: 'basics', label: 'The blob', title: 'One class does the whole checkout', done: 0,
      say: 'Meet OrderService. It checks the cart, works out the price, saves the order and emails a receipt. All in one class.',
      add: ['req', 'god', 'db', 'smtp'],
      edges: [['req', 'god'], ['god', 'db', { bend: -30 }], ['god', 'smtp', { bend: 30 }]],
      flows: [['req', 'god', { n: 2 }], ['god', 'db', { bend: -30, n: 1, dur: 1.4 }]],
      metrics: { lines: '820', reasons: '4', conflicts: '6', blast: 'whole file' },
      blocks: [
        { p: 'Our online shop has one class for checkout. It started at 80 lines. Every new feature landed here, because it was the obvious place.' },
        { lang: 'ts', code: `class OrderService {
  checkout(cart: Cart) {
    this.validate(cart);            // input rules
    const total = this.price(cart); // tax, discounts
    this.save(cart, total);         // SQL
    this.emailReceipt(cart);        // HTML template
  }
  // ...800 more lines
}` },
        { p: 'Nothing is broken yet. But every change, for any reason, edits the same file.' },
        { callout: 'illus', title: 'About the numbers', text: 'Line counts and conflicts per week in this lesson are illustrative, to show the shape of the problem.' },
      ],
    },
    {
      lvl: 'basics', label: 'Four owners', title: 'Four teams, one file', done: 1,
      say: 'Four different teams need changes in this one class, each for their own reason. That is four reasons to change.',
      add: ['fin', 'mkt', 'dba', 'sec'],
      edges: [['req', 'god'], ['god', 'db', { bend: -30 }], ['god', 'smtp', { bend: 30 }],
        ['fin', 'god', { dash: true, tone: 'warn' }], ['mkt', 'god', { dash: true, tone: 'warn' }], ['dba', 'god', { dash: true, tone: 'warn' }], ['sec', 'god', { dash: true, tone: 'warn' }]],
      flows: [['fin', 'god', { tone: 'warn', n: 1, dur: 2.2 }], ['sec', 'god', { tone: 'warn', n: 1, dur: 2.6 }]],
      state: { god: 'bad' },
      blocks: [
        { p: 'Finance wants a new tax rule. Marketing wants new receipt wording. The database admin (DBA) is renaming a column. Security wants stricter input checks. All four requests land in `OrderService`.' },
        { p: 'Each of these groups is an [[actor|actor]]: someone who asks for changes. This class has four.' },
        { callout: 'key', title: 'The principle', text: 'A module should be responsible to one actor. Put another way: it should have **one reason to change**.' },
      ],
    },
    {
      lvl: 'basics', label: 'Collisions', title: 'Watch the pull requests collide', scene: 'srpBlob', done: 1,
      say: 'Every team commits to the same file. When two changes land close together on the same lines, git cannot merge them by itself.',
      read: { tiles: [tile('Teams', '4', 'one file'), tile('Files', '1', 'OrderService.ts'), tile('Conflicts', '~5/wk', 'illustrative')] },
      blocks: [
        { p: 'Each amber dot is a commit from one team. They all head for `OrderService.ts`.' },
        { ul: ['When two pull requests edit nearby lines, you get a [[conflict|merge conflict]] that someone has to untangle by hand.', 'A typo in Marketing\'s email template can make Finance\'s pricing tests fail, because they share a file and a test run.', 'Every review needs someone who understands tax, SQL, HTML and security at once.'] },
        { callout: 'warn', title: 'Warning sign', text: 'If the same file shows up in almost every pull request, from people on different teams, it probably has more than one owner.' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: what does splitting buy?', done: 1,
      say: 'Make a guess. If each team got its own file, what happens to the merge conflicts between teams?',
      check: {
        type: 'predict', q: 'You split OrderService into four classes, one per team. Each team edits only its own. What happens to merge conflicts between teams?',
        opts: [{ t: 'About the same, it is the same code' }, { t: 'Roughly halved' }, { t: 'Close to zero' }], ans: 2,
        fb: ['Not quite: the code is the same, but who edits which file changes completely. ', 'Better than that: ', ''],
        why: 'Conflicts happen when two people edit the same lines. If each team owns a different file, teams stop touching each other\'s lines, so cross-team conflicts nearly vanish. Conflicts inside one team still happen, but they are far easier to sort out.',
      },
    },
    {
      lvl: 'basics', label: 'Split by actor', title: 'Give each reason its own home', done: 2,
      say: 'Pull each responsibility into its own class, owned by one team. A small CheckoutFlow keeps just the order of the steps.',
      add: ['val', 'price', 'repo', 'mail'],
      set: { god: { label: 'CheckoutFlow', sub: '40 lines' }, fin: { sub: 'owns pricing' }, mkt: { sub: 'owns receipts' }, dba: { sub: 'owns storage' }, sec: { sub: 'owns validation' } },
      edges: [['req', 'god'], ['god', 'val'], ['god', 'price'], ['god', 'repo'], ['god', 'mail'], ['repo', 'db'], ['mail', 'smtp']],
      flows: [['req', 'god', { n: 2 }], ['god', 'val', { n: 1 }], ['god', 'price', { n: 1, delay: 0.25 }], ['god', 'repo', { n: 1, delay: 0.5 }], ['god', 'mail', { n: 1, delay: 0.75 }]],
      state: { val: 'ok', price: 'ok', repo: 'ok', mail: 'ok' },
      metrics: { lines: '120', reasons: '1 each', conflicts: '1', blast: 'one class' },
      blocks: [
        { p: 'Each new class is small, has its own tests, and changes only when its own team asks. `CheckoutFlow` decides the **order** of the steps, which the product team owns.' },
        { lang: 'ts', code: `class CheckoutFlow {
  constructor(
    private validator: OrderValidator,
    private pricing: PriceCalculator,
    private orders: OrderRepository,
    private receipts: ReceiptMailer,
  ) {}

  checkout(cart: Cart) {
    this.validator.check(cart);
    const total = this.pricing.total(cart);
    const order = this.orders.save(cart, total);
    this.receipts.send(order);
  }
}` },
        { changes: [['+', 'OrderValidator, PriceCalculator, OrderRepository, ReceiptMailer'], ['~', 'OrderService becomes a 40-line CheckoutFlow']] },
      ],
    },
    {
      lvl: 'basics', label: 'After', title: 'Same week, separate files', scene: 'srpSplit', done: 2,
      say: 'Same teams, same commits as before. Now each lands in its own file, and nothing collides.',
      read: { tiles: [tile('Teams', '4', 'one file each'), tile('Files', '4 + flow', 'small, focused'), tile('Conflicts', '~0', 'between teams')] },
      blocks: [
        { p: 'The commits are exactly the same as in the earlier animation. Only the destination changed.' },
        { ul: ['Finance\'s reviewer only needs to understand pricing.', 'A failing `Receipt` test points straight at the email code.', 'Teams can ship on their own schedule.'] },
      ],
    },
    {
      lvl: 'basics', label: 'Tax rule', title: 'Finance changes a tax rule', done: 2,
      say: 'A new tax rule now touches one class and its tests. Nothing else is edited or needs retesting by hand.',
      edges: [['req', 'god'], ['god', 'val'], ['god', 'price'], ['god', 'repo'], ['god', 'mail'], ['repo', 'db'], ['mail', 'smtp'], ['fin', 'price', { dash: true, tone: 'accent', bend: 30 }]],
      flows: [['fin', 'price', { bend: 30, n: 2, tone: 'accent' }]],
      state: { price: 'hl', val: 'dim', repo: 'dim', mail: 'dim', god: 'dim', req: 'dim', db: 'dim', smtp: 'dim', mkt: 'dim', dba: 'dim', sec: 'dim' },
      metrics: { blast: 'PriceCalculator' },
      blocks: [
        { p: 'Digital goods must now be taxed where the buyer lives. The change lands in `PriceCalculator` and its tests, reviewed by someone who knows tax.' },
        { changes: [['~', 'Files changed: PriceCalculator.ts, PriceCalculator.test.ts'], ['-', 'No edits to validation, storage or email']] },
        { callout: 'tip', title: 'The "and" test', text: 'Describe the class in one sentence. "Calculates the order total" passes. "Validates **and** prices **and** saves" does not.' },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 2,
      say: 'Your turn. Which of these classes has more than one reason to change?',
      check: {
        type: 'choice', q: 'Which class breaks the Single Responsibility Principle?',
        opts: [
          { t: '`Money`: adds, subtracts and rounds amounts in cents', hint: 'All of these change together, for one reason: how money arithmetic works.' },
          { t: '`InvoicePdf`: lays out the invoice page and also calculates VAT', },
          { t: '`UserRepository`: finds, saves and deletes users in the database', hint: 'Three methods, but one owner and one reason: how users are stored.' },
        ],
        ans: 1, why: 'Page layout changes when the design team asks; VAT changes when Finance or the law does. Two actors, two reasons to change. Move the VAT calculation out and pass the result in.',
      },
    },
    {
      lvl: 'intermediate', label: 'Find seams', title: 'Let the history show you the seams', scene: 'srpSeams', done: 3,
      say: 'You do not have to guess who owns what. Version control already knows who changes each file, and which files change together.',
      read: { term: [['cmd', 'git log --since="6 months ago" --format=%an -- src/OrderService.ts | sort | uniq -c | sort -rn'], ['dim', '  41 Priya'], ['dim', '  33 Tom'], ['dim', '  19 Ana'], ['dim', '  17 Sam']] },
      blocks: [
        { p: 'Two questions find the seams in a big class:' },
        { ol: ['**Who changes it?** Count commit authors per file, then map each author to their team (Priya is in Finance, Tom in Marketing, and so on). Four teams on one file means four reasons to change.', '**What changes together?** Look at which files are edited in the same commits. To follow one method, give git the lines it sits on today. If `price()` is on lines 212 to 230 (example numbers), `git log -L 212,230:src/OrderService.ts` shows every commit that changed those lines, following them as they move. Code that always moves together belongs together.'] },
        { lang: 'bash', code: `# who changes this file? (authors, most frequent first)
git log --since="6 months ago" --format=%an -- src/OrderService.ts \\
  | sort | uniq -c | sort -rn

# which files change in the same commits as it?
git log --since="6 months ago" --format= --name-only --full-diff -- src/OrderService.ts \\
  | sort | uniq -c | sort -rn | head` },
        { callout: 'illus', title: 'Illustrative output', text: 'The names and counts in the terminal are made up. Real ones come from your repository.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Split safely', title: 'Refactor without breaking checkout', done: 3,
      set: { god: { label: 'OrderService', sub: 'facade' } },
      edges: [['req', 'god'], ['god', 'val'], ['god', 'price'], ['god', 'repo'], ['god', 'mail'], ['repo', 'db'], ['mail', 'smtp']],
      flows: [['req', 'god', { n: 2 }], ['god', 'price', { n: 1, tone: 'ok' }]],
      state: { price: 'ok', god: 'hl', val: 'dim', repo: 'dim', mail: 'dim', fin: 'dim', mkt: 'dim', dba: 'dim', sec: 'dim' },
      say: 'Do not rewrite the blob in one go. Pin down today\'s behaviour with tests, then move one responsibility at a time.',
      read: { term: [['cmd', 'npx vitest run checkout'], ['ok', 'characterization: totals for 50 recorded carts', '12 ms'], ['ok', 'characterization: receipt HTML snapshot', '4 ms'], ['dim', ''], ['dim', 'refactor step 1 of 4: extract PriceCalculator'], ['ok', 'all 52 tests still pass', '16 ms']] },
      blocks: [
        { callout: 'illus', title: 'Illustrative output', text: 'The cart count, test count and timings in the terminal are made up for this example.' },
        { ol: ['Write [[characterization|characterization tests]]: run real carts through `OrderService` and record the totals and receipts it produces today.', 'Extract one class, for example `PriceCalculator`. Leave `OrderService.price()` in place, but make it call the new class.', 'Run the tests. Same results? Commit.', 'Repeat for the other responsibilities. Callers keep using `OrderService` as a [[facade|facade]] until you switch them over.'] },
        { lang: 'ts', code: `class OrderService {
  constructor(private pricing = new PriceCalculator()) {}

  /** @deprecated use PriceCalculator directly */
  price(cart: Cart) {
    return this.pricing.total(cart); // old entry point, new home
  }
}` },
        { callout: 'key', title: 'Why small steps', text: 'Each step is a small, reviewable pull request that keeps checkout working. If a test fails, you know which move broke it.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Don\'t over-split', title: 'Cohesion: keep together what changes together', done: 4,
      set: { god: { label: 'CheckoutFlow', sub: '40 lines' } },
      say: 'Single responsibility is not one method per class. If two things always change together, splitting them just scatters one idea across files.',
      edges: [['req', 'god'], ['god', 'val'], ['god', 'price'], ['god', 'repo'], ['god', 'mail'], ['repo', 'db'], ['mail', 'smtp']],
      flows: [],
      state: { price: 'hl' },
      blocks: [
        { p: 'Imagine splitting `PriceCalculator` into `TaxLookup`, `DiscountApplier`, `Rounder` and `CurrencyFormatter`. That only helps if **different people change them for different reasons**.' },
        { p: 'If every tax change also touches rounding, they belong together. That is high [[cohesion|cohesion]].' },
        { table: { head: ['Signal', 'Split?'], rows: [
          ['Different teams edit different parts', 'Yes'],
          ['Parts change at very different rates', 'Yes'],
          ['Tests for one part keep breaking because of the other', 'Yes'],
          ['The file just feels long', 'Not on its own'],
          ['The parts are always edited in the same commit', 'No, keep them together'],
        ] } },
      ],
    },
    {
      lvl: 'intermediate', label: 'Levels', title: 'The same idea at every size', done: 4,
      say: 'The principle works for a function, a class, a package or a whole service. The question is always the same: who asks for this to change?',
      blocks: [
        { table: { head: ['Level', 'Too many reasons looks like', 'Split into'], rows: [
          ['Function', 'A 200-line function that parses, validates and saves', 'Three functions called in order'],
          ['Class', '`OrderService` with four owning teams', 'One class per owner plus a flow'],
          ['Package', 'A `utils` folder everyone dumps into', 'Packages named after what they do'],
          ['Service', 'One service that two teams deploy and fight over', 'Services aligned with team boundaries'],
        ] } },
        { callout: 'analogy', title: 'Conway\'s law', text: 'Systems tend to copy the shape of the teams that build them. SRP at the service level is often just making that copy deliberate: one team, one service.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'Sort these situations. Should you split the code, or leave it together?',
      check: {
        type: 'match', q: 'For each situation, should the code be split or kept together?', bins: ['Split it', 'Keep it together'],
        bugs: [
          { t: 'Two teams edit the same class every sprint and their pull requests conflict.', a: 0, why: 'Two owners with separate reasons: split along the team line.', hint: 'Two owners, separate reasons to change.' },
          { t: 'A 400-line parser that only the parsing team touches, and its parts always change together.', a: 1, why: 'One owner, one reason, high cohesion. Long is not the same as mixed.', hint: 'Long is not the problem. Who changes it, and do the parts move together?' },
          { t: 'Changing an email template made a pricing test fail.', a: 0, why: 'Unrelated concerns share a file and a test run. Separate them so failures point at the right place.', hint: 'Email and pricing have different owners.' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: one owner per module', done: 4,
      state: { val: 'ok', price: 'ok', repo: 'ok', mail: 'ok' },
      say: 'Responsibility means an owner. Split along owner lines, behind tests, and stop when the pieces always change together.',
      blocks: [
        { ul: [
          '**Responsibility means an actor.** A module should change for one group\'s reasons.',
          '**Symptoms:** frequent merge conflicts, unrelated tests failing, reviews that need four experts.',
          '**Find seams** with `git log`: who changes the file, and what changes with it.',
          '**Fix** by extracting one responsibility at a time behind characterization tests, with a thin flow on top.',
          '**Stop** when the pieces would always change together.',
        ] },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
export const ocp = {
  format: 2,
  slug: 'open-closed',
  title: 'Add, Don\'t Edit',
  short: 'Open / Closed',
  minutes: 16,
  level: 'Beginner → Intermediate',
  promise: 'Add a new payment method without touching the code that already works.',
  definition: {
    sentence: 'The Open/Closed Principle says code should be **open for extension but closed for modification**: you add new behaviour by adding new code, not by editing code that already works.',
    more: 'Bertrand Meyer first stated it in 1988. The version used today, built on interfaces and polymorphism, was popularised by Robert C. Martin as the O in SOLID.',
    analogy: { title: 'Think of a wall socket', text: 'A new lamp does not need the house rewired. It just needs a plug that fits the socket. The socket is the interface; every appliance is an implementation.' },
    mini: '**Open/closed:** add new behaviour as new code; leave working code alone.',
  },
  learn: [
    'Recognise the smell: one switch on a type, copied in several places.',
    'Explain "open for extension, closed for modification" with a real example.',
    'Use an interface (the Strategy pattern) plus a registry, so a new variant is a new file.',
    'Choose between classes and a closed union, and spot an abstraction that comes too early.',
  ],
  metrics: [
    { key: 'branches', label: 'Branches in processor' },
    { key: 'edited', label: 'Existing files edited' },
    { key: 'retest', label: 'Code to retest' },
    { key: 'methods', label: 'Payment methods' },
  ],
  scenes,
  terms: {
    strategy: ['Strategy pattern', 'putting each variant of a behaviour in its own class behind one interface, and choosing the behaviour by choosing the object.'],
    polymorphism: ['Polymorphism', 'calling the same method on different objects and getting each object\'s own behaviour, without checking its type.'],
    shotgun: ['Shotgun surgery', 'when one small change forces edits in many places across the code.'],
    union: ['Discriminated union', 'a type that is exactly one of a fixed list of shapes, told apart by a field such as `kind`.'],
    root: ['Composition root', 'the one place, usually at startup, where the app creates its objects and plugs them together.'],
  },
  map: {
    nodes: {
      co: [46, 150, 80], proc: [160, 150, 128], iface: [300, 150, 112],
      card: [424, 70, 104], paypal: [424, 150, 104], wallet: [424, 230, 104], edit: [160, 250, 140],
    },
  },
  nodes: {
    co: { x: 95, y: 230, label: 'Checkout', icon: 'card', kind: 'svc', w: 130 },
    proc: { x: 300, y: 230, label: 'PaymentProcessor', sub: 'switch (method)', icon: 'class', kind: 'class', w: 172, h: 62 },
    iface: { x: 505, y: 230, label: 'PaymentMethod', sub: 'interface', icon: 'iface', kind: 'iface', w: 156 },
    card: { x: 700, y: 110, label: 'CardPayment', icon: 'card', kind: 'class', w: 150 },
    paypal: { x: 700, y: 230, label: 'BankTransfer', icon: 'arrows', kind: 'class', w: 150 },
    wallet: { x: 700, y: 350, label: 'WalletPayment', sub: 'new', icon: 'sparkle', kind: 'class', w: 150 },
    edit: { x: 300, y: 380, label: 'Edit, retest,\nredeploy processor', kind: 'note', w: 170, h: 56 },
  },
  steps: [
    {
      lvl: 'basics', label: 'Two methods', title: 'A processor that knows every payment type', done: 0,
      say: 'Checkout hands the order to a payment processor. It picks the right code with a switch on the method name. With two methods, that is perfectly readable.',
      add: ['co', 'proc', 'card', 'paypal'],
      edges: [['co', 'proc'], ['proc', 'card', { bend: -20 }], ['proc', 'paypal']],
      flows: [['co', 'proc', { n: 2 }], ['proc', 'card', { bend: -20, n: 1 }]],
      metrics: { branches: '2', edited: '—', retest: '—', methods: '2' },
      blocks: [
        { p: 'Our shop takes cards and bank transfers. `PaymentProcessor` decides which code to run:' },
        { lang: 'ts', code: `pay(order: Order) {
  switch (order.method) {
    case 'card':     return chargeCard(order);
    case 'transfer': return startTransfer(order);
    default: throw new Error('unknown method');
  }
}` },
        { p: 'Nothing wrong yet. The trouble starts with the third method.' },
      ],
    },
    {
      lvl: 'basics', label: 'New method', title: 'Every new method edits the same file', scene: 'ocpSwitch', done: 1,
      say: 'Wallets are added. Then crypto. Each time someone opens the processor, adds a case, and every existing payment path has to be tested again.',
      read: { tiles: [tile('Cases', '2 → 4', 'in one switch'), tile('Files edited', '1, every time', 'the money code'), tile('To retest', 'all paths', 'card, transfer, …')] },
      blocks: [
        { p: 'The class that moves real money for cards and transfers is being edited for features that have nothing to do with them.' },
        { ul: ['A typo in the wallet case can break card payments.', 'Every release needs the whole payment suite rerun by hand or by slow tests.', 'Two teams adding two methods at once collide in the same switch.'] },
      ],
    },
    {
      lvl: 'basics', label: 'Copies', title: 'The same switch, in three places', done: 1,
      say: 'It is rarely just one switch. Refunds, fees and receipts each grow their own copy, and every new method means hunting them all down.',
      add: ['edit'],
      set: { proc: { sub: 'switch: +1 case' } },
      edges: [['co', 'proc'], ['proc', 'card', { bend: -20 }], ['proc', 'paypal'], ['edit', 'proc', { dash: true, tone: 'bad' }]],
      flows: [['edit', 'proc', { tone: 'bad', n: 1, dur: 2 }]],
      state: { proc: 'bad' },
      metrics: { branches: '3', edited: '3', retest: 'all methods' },
      blocks: [
        { lang: 'ts', code: `function pay(o: Order)        { switch (o.method) { /* … */ } }
function refund(p: Payment)   { switch (p.method) { /* … */ } }
function receiptText(o: Order){ switch (o.method) { /* … */ } }` },
        { p: 'Miss one copy and wallets work for paying but crash on refunds. This pattern has a name: [[shotgun|shotgun surgery]].' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: how many edits?', done: 1,
      say: 'Make a guess before we fix it. How many existing functions must change to add wallets?',
      check: {
        type: 'predict', q: 'The switch on payment method is copied in pay(), refund() and receiptText(). To add wallets, how many existing functions must you edit?',
        opts: [{ t: 'One' }, { t: 'Three' }, { t: 'None' }], ans: 1,
        fb: ['Only if you get lucky: ', '', 'Not with this design: '],
        why: 'Every copy of the switch needs a new case, so three existing functions change, and each is a chance to forget one. The fix you will see next brings this to zero edits.',
      },
    },
    {
      lvl: 'basics', label: 'An interface', title: 'Depend on a role, not a list of cases', done: 2,
      say: 'Describe what every payment method must do in an interface. Each method becomes its own class. The processor stops asking which kind it has.',
      add: ['iface'],
      remove: ['edit'],
      set: { proc: { sub: 'no switch' } },
      edges: [['co', 'proc'], ['proc', 'iface'], ['card', 'iface', { dash: true, tone: 'muted' }], ['paypal', 'iface', { dash: true, tone: 'muted' }]],
      flows: [['co', 'proc', { n: 2 }], ['proc', 'iface', { n: 2, delay: 0.3 }]],
      state: { iface: 'hl' },
      metrics: { branches: '0', edited: '—', retest: '—' },
      blocks: [
        { p: 'Every payment method must authorise, capture and refund. That list becomes an interface. Each method is a class that implements it, and the processor calls it through [[polymorphism|polymorphism]].' },
        { lang: 'ts', code: `interface PaymentMethod {
  authorize(o: Order): Promise<Auth>;
  capture(a: Auth): Promise<Receipt>;
  refund(r: Receipt): Promise<void>;
}

class PaymentProcessor {
  constructor(private methods: Map<string, PaymentMethod>) {}
  async pay(o: Order) {
    const m = this.methods.get(o.method);
    if (!m) throw new UnknownMethod(o.method);
    return m.capture(await m.authorize(o));
  }
}` },
        { callout: 'key', title: 'Open and closed', text: '**Open for extension:** you can add new payment behaviour. **Closed for modification:** you do it without editing the tested processor. This is the [[strategy|Strategy pattern]].' },
      ],
    },
    {
      lvl: 'basics', label: 'Plug in', title: 'Wallets plug in', scene: 'ocpPlug', done: 3,
      say: 'Adding wallets is now one new class that fits the interface. The processor, card and transfer code are untouched.',
      read: { tiles: [tile('New files', '1', 'WalletPayment.ts'), tile('Files edited', '0', 'tested code'), tile('To retest', 'wallet only', '')] },
      blocks: [
        { p: '`WalletPayment` implements `PaymentMethod`. Nothing that already works is opened.' },
        { lang: 'ts', code: `class WalletPayment implements PaymentMethod {
  constructor(private api: WalletApi) {}
  authorize(o: Order)   { return this.api.hold(o.totalCents); }
  capture(a: Auth)      { return this.api.settle(a.id); }
  refund(r: Receipt)    { return this.api.reverse(r.id); }
}` },
      ],
    },
    {
      lvl: 'basics', label: 'Register', title: 'One line to switch it on', done: 3,
      say: 'The new class still has to be plugged in somewhere. That is one line at startup, the only existing file that changes.',
      add: ['wallet'],
      edges: [['co', 'proc'], ['proc', 'iface'], ['card', 'iface', { dash: true, tone: 'muted' }], ['paypal', 'iface', { dash: true, tone: 'muted' }], ['wallet', 'iface', { dash: true, tone: 'ok' }]],
      flows: [['co', 'proc', { n: 2 }], ['proc', 'iface', { n: 2 }]],
      state: { wallet: 'ok', iface: '', card: 'dim', paypal: 'dim', proc: 'dim' },
      metrics: { edited: '1 (startup)', retest: 'wallet only', methods: '3' },
      blocks: [
        { lang: 'ts', code: `// main.ts: the composition root
const methods = new Map<string, PaymentMethod>([
  ['card', new CardPayment(gateway)],
  ['transfer', new BankTransfer(bank)],
  ['wallet', new WalletPayment(walletApi)], // the only new line
]);` },
        { p: 'This startup file is the [[root|composition root]]. It is the one place that knows every concrete class, and editing it is expected. The code that moves money stays closed.' },
        { changes: [['+', 'WalletPayment.ts'], ['+', 'One registration line at startup'], ['-', 'No edits to PaymentProcessor']] },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 3,
      say: 'Your turn. Which change follows the Open/Closed Principle?',
      check: {
        type: 'choice', q: 'Shipping needs a new carrier, "DroneDrop". Which change follows the Open/Closed Principle?',
        opts: [
          { t: 'Add `case \'drone\'` to the switch in `ShippingCalculator`', hint: 'That opens tested code that handles every other carrier.' },
          { t: 'Write a `DroneDrop` class that implements `Carrier`, and register it at startup' },
          { t: 'Copy `ShippingCalculator` to `ShippingCalculator2` and edit the copy', hint: 'Now there are two calculators to keep in sync, and callers must pick one.' },
        ],
        ans: 1, why: 'A new class behind the existing `Carrier` interface adds the behaviour without editing code that already works. The only edit is the registration line.',
      },
    },
    {
      lvl: 'intermediate', label: 'Closed unions', title: 'When a switch is the better choice', scene: 'ocpGrid', done: 4,
      read: { tiles: [tile('New type', 'classes', '+1 class, 1 register line', 'good'), tile('New operation', 'union', '+1 function, no edits', 'good'), tile('Pick by', 'what grows', 'types or operations')] },
      say: 'Classes make new types easy to add. But if the types are fixed and you keep adding operations, a closed union with a compiler check is often simpler.',
      blocks: [
        { p: 'Here is the trade-off, sometimes called the expression problem:' },
        { table: { head: ['Design', 'Adding a new type', 'Adding a new operation'], rows: [
          ['Interface + one class per type', 'Easy: one new class', 'Hard: edit every class'],
          ['[[union|Union]] + `switch` per operation', 'Hard: edit every switch', 'Easy: one new function'],
        ] } },
        { p: 'If the compiler forces every switch to handle every case, the "hunt down every copy" problem disappears:' },
        { lang: 'ts', code: `type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'rect'; w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2;
    case 'rect':   return s.w * s.h;
    default: {
      const missing: never = s; // compile error if a kind is not handled
      throw new Error(\`unhandled \${JSON.stringify(missing)}\`);
    }
  }
}` },
        { callout: 'tip', title: 'Rule of thumb', text: 'New **types** arrive often (payment methods, carriers, plugins)? Use an interface. New **operations** arrive often on a fixed set (shapes, AST nodes)? Use a union with an exhaustive switch.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Too early', title: 'Don\'t build the socket before the plug', done: 4,
      say: 'An interface with one implementation is just a detour. Wait until the variation is real before you abstract it.',
      flows: [], state: {},
      blocks: [
        { p: 'Every interface costs something: one more file, one more "go to definition", one more place a reader has to look.' },
        { ul: ['**First time:** just write the code.', '**Second time:** notice the similarity, maybe copy.', '**Third time:** now you know what varies. Extract the interface.'] },
        { callout: 'warn', title: 'Guessing wrong is expensive', text: 'Open/Closed protects you from changes you can predict. Abstract along the wrong axis and you get a rigid design that fights the change that actually comes.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'A drawing app. Which design keeps the changes smallest?',
      check: {
        type: 'choice', q: 'Your drawing app has three shape types that almost never change, but every sprint adds a new operation: area, outline, export to SVG, hit-testing. Which design keeps each change smallest?',
        opts: [
          { t: 'An interface `Shape` with a class per shape; add each operation as a method', hint: 'Every new operation means editing all three classes. That is the hard direction for classes.' },
          { t: 'A union type with an exhaustive `switch` in one function per operation' },
          { t: 'One big class with an `if` per shape inside every method', hint: 'That puts every shape and every operation in one place, with no compiler help when something is missed.' },
        ],
        ans: 1, why: 'With a fixed set of types and a growing list of operations, each new operation is one new function, and the `never` check makes the compiler list any case you forgot.',
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: extend by adding', done: 4,
      say: 'Spot the copied switch, put the varying behaviour behind an interface, plug new variants in at startup, and abstract only once the variation is real.',
      blocks: [
        { ul: [
          '**Smell:** the same `switch` on a type code in several places.',
          '**Fix:** an interface for the varying behaviour and one class per variant (Strategy), registered in the composition root.',
          '**Payoff:** a new variant is a new file; tested code stays closed.',
          '**Trade-off:** fixed types and growing operations? A union with an exhaustive switch fits better.',
          '**Timing:** abstract on the third case, not the first.',
        ] },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
export const lsp = {
  format: 2,
  slug: 'liskov-substitution',
  title: 'Keep the Promise',
  short: 'Liskov Substitution',
  minutes: 16,
  level: 'Beginner → Intermediate',
  promise: 'A subtype that compiles is not the same as a subtype that works. See how a "harmless" class crashes a backup job.',
  definition: {
    sentence: 'The Liskov Substitution Principle says that if code works with a type, it must keep working with **any subtype** of it, with no surprises and no type checks.',
    more: 'Barbara Liskov described the idea in 1987, and she and Jeannette Wing formalised it in 1994. It is about behaviour: a subtype must keep the promises its parent makes, not just match its method names.',
    analogy: { title: 'Think of a rental car', text: 'You book "a car" and expect to drive away: steering wheel, pedals, seats. If the agency hands you a car with no seats, it is technically still a car, but your trip is ruined.' },
    mini: '**Liskov substitution:** any subtype must work wherever its parent type is expected.',
  },
  learn: [
    'Explain that an interface is a promise about behaviour, not just a list of method names.',
    'Spot violations: "not supported" errors, empty overrides, instanceof checks in callers.',
    'Fix them by modelling capabilities with smaller interfaces.',
    'Apply the contract rules and test every implementation with one shared test suite.',
  ],
  metrics: [
    { key: 'impls', label: 'Implementations' },
    { key: 'checks', label: 'instanceof checks' },
    { key: 'failures', label: 'Runtime surprises' },
  ],
  scenes,
  terms: {
    subtype: ['Subtype', 'a class that implements an interface or extends another class, so it can be used wherever that type is expected.'],
    contract: ['Contract', 'everything callers may rely on: method names and types, plus the behaviour promised, such as "after write, read returns the data".'],
    pre: ['Precondition', 'what must be true before a method is called, such as "amount is positive". A subtype may not demand more.'],
    post: ['Postcondition', 'what a method promises once it returns, such as "the data is stored". A subtype may not promise less.'],
    invariant: ['Invariant', 'something that is always true about an object, such as "balance is never negative".'],
  },
  map: {
    nodes: {
      job: [62, 80, 108], viewer: [62, 220, 108], store: [222, 150, 120], wstore: [222, 80, 124], rstore: [222, 220, 124],
      disk: [404, 50, 120], bucket: [404, 150, 120], mirror: [404, 250, 130],
    },
  },
  nodes: {
    job: { x: 110, y: 160, label: 'BackupJob', sub: 'writes nightly', icon: 'clock', kind: 'svc', w: 150 },
    viewer: { x: 110, y: 340, label: 'ReportViewer', sub: 'reads only', icon: 'eye', kind: 'svc', w: 150 },
    store: { x: 340, y: 250, label: 'Storage', sub: 'read · write', icon: 'iface', kind: 'iface', w: 150 },
    wstore: { x: 340, y: 160, label: 'WritableStore', sub: 'write(key, data)', icon: 'iface', kind: 'iface', w: 160 },
    rstore: { x: 340, y: 340, label: 'ReadableStore', sub: 'read(key)', icon: 'iface', kind: 'iface', w: 160 },
    disk: { x: 600, y: 90, label: 'LocalDisk', icon: 'server', kind: 'class', w: 150 },
    bucket: { x: 600, y: 230, label: 'CloudBucket', icon: 'cloud', kind: 'class', w: 150 },
    mirror: { x: 600, y: 370, label: 'ReadOnlyMirror', sub: 'write() throws', icon: 'eye', kind: 'class', w: 160 },
  },
  steps: [
    {
      lvl: 'basics', label: 'The contract', title: 'An interface is a promise, not just a shape', done: 0,
      say: 'A Storage interface has read and write. Callers rely on more than the names: after write finishes, the data really is stored.',
      add: ['job', 'viewer', 'store', 'disk', 'bucket'],
      edges: [['job', 'store'], ['viewer', 'store'], ['disk', 'store', { dash: true, tone: 'muted' }], ['bucket', 'store', { dash: true, tone: 'muted' }]],
      flows: [['job', 'store', { n: 2 }], ['viewer', 'store', { n: 1, tone: 'ok' }]],
      metrics: { impls: '2', checks: '0', failures: '0' },
      blocks: [
        { p: 'Two programs use storage: a nightly `BackupJob` that writes, and a `ReportViewer` that reads. Both depend on one interface:' },
        { lang: 'ts', code: `interface Storage {
  read(key: string): Promise<Bytes>;
  /** Resolves once the data is safely stored. */
  write(key: string, data: Bytes): Promise<void>;
}` },
        { p: 'The types say little. The comment, and what every caller assumes, is the real [[contract|contract]]: after `write` resolves, a later `read` gets the data back.' },
      ],
    },
    {
      lvl: 'basics', label: 'A new subtype', title: 'A read-only mirror joins the family', done: 1,
      say: 'Someone adds a read-only mirror for cheaper reports. The interface demands write too, so the mirror just throws. It compiles.',
      add: ['mirror'],
      edges: [['job', 'store'], ['viewer', 'store'], ['disk', 'store', { dash: true, tone: 'muted' }], ['bucket', 'store', { dash: true, tone: 'muted' }], ['mirror', 'store', { dash: true, tone: 'warn' }]],
      state: { mirror: 'warn' },
      metrics: { impls: '3' },
      blocks: [
        { lang: 'ts', code: `class ReadOnlyMirror implements Storage {
  read(key: string) { return this.replica.get(key); }
  write(): Promise<void> {
    throw new Error('mirror is read-only'); // breaks the promise
  }
}` },
        { p: 'The type checker is happy. Code review sees a small, tidy class. But it is a [[subtype|subtype]] that cannot keep its parent\'s promise.' },
      ],
    },
    {
      lvl: 'basics', label: 'Swap', title: 'Same call, three stores', scene: 'lspSwap', done: 1,
      say: 'The backup job makes the same call each time. Two stores keep the promise. The mirror breaks it.',
      read: { tiles: [tile('LocalDisk', '✓', 'stored', 'good'), tile('CloudBucket', '✓', 'stored', 'good'), tile('ReadOnlyMirror', '✗', 'throws', 'bad')] },
      blocks: [
        { p: 'Substitution means swapping one implementation for another without the caller noticing. `BackupJob` should not need to know which store it got.' },
        { callout: 'key', title: 'The principle', text: 'Anywhere the program uses a type, it must work with **any subtype**, with no surprises and no type checks.' },
      ],
    },
    {
      lvl: 'basics', label: '3 a.m.', title: 'The backup job gets a mirror and fails', done: 2,
      say: 'A config change hands the mirror to the backup job. At 3 a.m. every write throws, and there is no backup that night.',
      edges: [['job', 'store'], ['viewer', 'store'], ['disk', 'store', { dash: true, tone: 'muted' }], ['bucket', 'store', { dash: true, tone: 'muted' }], ['mirror', 'store', { dash: true, tone: 'bad' }]],
      flows: [['job', 'store', { n: 3, tone: 'bad', stall: 0.92 }]],
      state: { mirror: 'bad', job: 'bad' },
      metrics: { failures: '1', checks: '1' },
      blocks: [
        { p: 'The quick "fix" is a type check in the caller:' },
        { lang: 'ts', code: `if (store instanceof ReadOnlyMirror) return; // skip backup` },
        { p: 'Now the caller has to know about every subtype, and every new caller must remember the same check.' },
        { changes: [['~', 'Callers start sprouting instanceof checks']] },
        { callout: 'warn', title: 'Red flags', text: 'Methods that throw "not supported", empty overrides, and `instanceof` checks in callers all suggest a subtype that cannot keep the promise.' },
      ],
    },
    {
      lvl: 'basics', label: 'Split roles', title: 'Model what each type can actually do', done: 3,
      say: 'Split the interface by capability. The mirror only claims it can read. Now wiring it into the backup job is a compile error.',
      remove: ['store'],
      add: ['wstore', 'rstore'],
      set: { mirror: { sub: 'read only, honestly' } },
      edges: [['job', 'wstore'], ['viewer', 'rstore'], ['disk', 'wstore', { dash: true, tone: 'muted' }], ['disk', 'rstore', { dash: true, tone: 'muted', bend: 30 }],
        ['bucket', 'wstore', { dash: true, tone: 'muted' }], ['bucket', 'rstore', { dash: true, tone: 'muted' }], ['mirror', 'rstore', { dash: true, tone: 'ok' }]],
      flows: [['job', 'wstore', { n: 2 }], ['viewer', 'rstore', { n: 2, tone: 'ok' }]],
      state: { mirror: 'ok', job: '', wstore: 'hl', rstore: 'hl' },
      metrics: { checks: '0', failures: '0' },
      blocks: [
        { lang: 'ts', code: `interface ReadableStore { read(key: string): Promise<Bytes>; }
interface WritableStore { write(key: string, d: Bytes): Promise<void>; }

class LocalDisk implements ReadableStore, WritableStore { /* ... */ }
class ReadOnlyMirror implements ReadableStore { /* ... */ }

new BackupJob(new ReadOnlyMirror()); // ✗ type error` },
        { p: 'The mistake is now caught in seconds by the compiler, instead of at 3 a.m. by an empty backup.' },
        { changes: [['+', 'ReadableStore and WritableStore'], ['-', 'Storage removed'], ['-', 'instanceof checks deleted']] },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 3,
      say: 'Your turn. Which of these classes breaks the promise?',
      check: {
        type: 'choice', q: 'All three implement `WritableStore`. Which one breaks the Liskov Substitution Principle?',
        opts: [
          { t: '`CachedStore`: writes to the real store and also keeps a copy in memory', hint: 'It still stores the data. Doing extra work is allowed as long as the promise holds.' },
          { t: '`LoggingStore`: logs every write, then passes it to the real store', hint: 'Callers still get exactly what was promised, plus a log line.' },
          { t: '`DryRunStore`: returns success from `write` but never saves anything' },
        ],
        ans: 2, why: '`write` promises the data is stored once it resolves. `DryRunStore` reports success and stores nothing, so a caller that reads the data back gets a surprise. It promises less than its parent.',
      },
    },
    {
      lvl: 'intermediate', label: 'The rules', title: 'What a subtype may and may not do', done: 3,
      say: 'A subtype may accept more and promise more. It must not demand more, promise less, or break a rule the parent always keeps.',
      flows: [], state: { mirror: 'ok' },
      blocks: [
        { table: { head: ['Part of the contract', 'A subtype may…', 'A subtype must not…'], rows: [
          ['[[pre|Preconditions]] (what callers must provide)', 'accept more: weaker preconditions', 'demand more, e.g. reject amounts the parent accepts'],
          ['[[post|Postconditions]] (what it promises)', 'promise more: stronger postconditions', 'promise less, e.g. "might not store"'],
          ['[[invariant|Invariants]] (always true)', 'add its own', 'break the parent\'s'],
          ['Errors', 'throw fewer, or more specific ones', 'throw kinds callers have no reason to expect'],
        ] } },
        { callout: 'tip', title: 'Memory aid', text: 'Ask for no more, promise no less.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Square', title: 'The classic trap: Square extends Rectangle', scene: 'lspSquare', done: 3,
      read: { tiles: [tile('Rectangle', '20', 'area, as expected', 'good'), tile('Square', '16', 'area, test fails', 'bad'), tile('Promise broken', 'width', 'setting it changed height')] },
      say: 'Mathematically, a square is a rectangle. In code, a Square that changes its height whenever you set its width breaks callers that resize rectangles.',
      blocks: [
        { lang: 'ts', code: `class Rectangle {
  constructor(public width: number, public height: number) {}
  setWidth(w: number)  { this.width = w; }
  setHeight(h: number) { this.height = h; }
  area() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w: number)  { this.width = w; this.height = w; }
  setHeight(h: number) { this.width = h; this.height = h; }
}

function stretch(r: Rectangle) {
  r.setWidth(5); r.setHeight(4);
  return r.area(); // a caller expects 20
}
stretch(new Square(1, 1)); // 16` },
        { p: 'The `Rectangle` contract silently included "setting the width does not change the height". `Square` breaks that rule. "Is a" in the real world does not guarantee "can stand in for" in code.' },
        { callout: 'key', title: 'The fix', text: 'Don\'t make one inherit from the other. Give both a shared read-only `Shape` with `area()`, and make them immutable so nobody resizes through the base type.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Shared tests', title: 'One test suite for every implementation', done: 4,
      say: 'Write the contract down as tests, and run the same tests against every implementation. A broken subtype then fails in CI, not in production.',
      read: { term: [['cmd', 'npx vitest run store.contract'], ['ok', 'LocalDisk › a read after write returns the same bytes', '3 ms'], ['ok', 'CloudBucket › a read after write returns the same bytes', '5 ms'], ['no', 'DryRunStore › a read after write returns the same bytes', 'expected Bytes(5) but got undefined']] },
      blocks: [
        { lang: 'ts', code: `const stores = [
  ['LocalDisk', () => new LocalDisk(tmpDir())],
  ['CloudBucket', () => new CloudBucket(fakeS3())],
  ['DryRunStore', () => new DryRunStore()],
] as const;

describe.each(stores)('%s keeps the read-after-write contract', (_name, make) => {
  test('a read after write returns the same bytes', async () => {
    const s = make();
    await s.write('k', bytes('hello'));
    expect(await s.read('k')).toEqual(bytes('hello'));
  });
});` },
        { p: 'Any new implementation is added to the list and must pass the same promises. Teams sometimes call this a contract suite.' },
        { callout: 'illus', title: 'Illustrative output', text: 'The timings and the exact failure message in the terminal are made up for this example.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Type gaps', title: 'Where the type checker will not save you', done: 4,
      say: 'TypeScript checks the shape of a subtype, not its behaviour. It even lets a method accept a narrower parameter than the interface promises.',
      blocks: [
        { p: 'Methods written with method syntax are compared loosely (bivariantly), even with `strict` on. This compiles:' },
        { lang: 'ts', code: `interface Handler {
  handle(e: Event): void;
}

class ClickOnly implements Handler {
  handle(e: MouseEvent) {   // narrower than Event: compiles anyway
    console.log(e.clientX);
  }
}

const h: Handler = new ClickOnly();
h.handle(new KeyboardEvent('keydown')); // e.clientX is undefined` },
        { p: '`ClickOnly` demands more than the interface promised callers it would accept: a stronger precondition. Declaring it as a function property, `handle: (e: Event) => void`, makes `strictFunctionTypes` reject the narrower parameter.' },
        { callout: 'warn', title: 'Takeaway', text: 'Types catch missing methods and wrong shapes. Broken promises about behaviour need contracts written down as tests.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'One more. A payment gateway subtype adds a rule. Is that allowed?',
      check: {
        type: 'choice', q: '`PaymentGateway.charge(cents)` accepts any positive amount. A new `BudgetGateway` subtype throws for amounts under 100 cents. What is wrong?',
        opts: [
          { t: 'Nothing: it throws a clear error message', hint: 'A clear message does not help a caller that was promised small amounts would work.' },
          { t: 'It strengthens a precondition: it demands more than the parent did' },
          { t: 'It weakens a postcondition: it promises less after charging', hint: 'Look at what it requires before charging, not what it promises after.' },
        ],
        ans: 1, why: 'Callers written against `PaymentGateway` may charge 50 cents, because the parent allowed it. The subtype rejects input the parent accepted, which is exactly what a subtype must not do. Model the limit in the type or in a separate capability instead.',
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: subtypes keep their parent\'s promises', done: 4,
      say: 'A contract is behaviour, not just names. Split capabilities so the compiler rejects bad wiring, and test every implementation against the same promises.',
      flows: [], state: {},
      blocks: [
        { ul: [
          '**Contracts** include behaviour, not just method signatures.',
          '**Red flags:** "not supported" errors, empty overrides, `instanceof` checks in callers, success that does nothing.',
          '**Rules:** ask for no more, promise no less, keep the parent\'s invariants.',
          '**Fix** by modelling capabilities separately, so the type system rejects bad wiring.',
          '**Test** every implementation with one shared contract suite.',
        ] },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
export const dip = {
  format: 2,
  slug: 'dependency-inversion',
  title: 'Point the Arrows Inward',
  short: 'Interfaces & Inversion',
  minutes: 18,
  level: 'Beginner → Intermediate',
  promise: 'Make business rules independent of databases and vendors, so tests run in milliseconds and suppliers are swappable.',
  definition: {
    sentence: 'The Dependency Inversion Principle says business rules should not depend on details like databases or email providers. **Both should depend on an interface that the business side owns.**',
    more: 'It is the D in SOLID, from Robert C. Martin. "Inversion" is about the direction of imports: the database code points at the rules\' interface, which is the opposite of the direction calls travel at run time.',
    analogy: { title: 'Think of a job advert', text: 'The company writes the job description, and candidates apply to fit it. The company does not reshape itself around one particular person. The description is the interface; each candidate is an implementation.' },
    mini: '**Dependency inversion:** rules own the interfaces; databases and vendors plug into them.',
  },
  learn: [
    'Explain why business rules should not import databases and vendors directly.',
    'Invert the dependency: interfaces owned by the rules, implemented by adapters.',
    'Test rules in milliseconds with fakes, and wire real parts in one composition root.',
    'Keep interfaces small (Interface Segregation) and invert only at real boundaries.',
  ],
  metrics: [
    { key: 'test', label: 'Unit test time' },
    { key: 'needs', label: 'Test needs' },
    { key: 'swap', label: 'Swap mail vendor' },
    { key: 'methods', label: 'Notifier methods' },
  ],
  scenes,
  terms: {
    policy: ['Policy', 'the business rules: the decisions that make your product what it is, such as "an invoice 31 days past due gets a reminder".'],
    adapter: ['Adapter', 'a class that implements one of the rules\' interfaces using a real technology, such as Postgres or an email API.'],
    fake: ['Fake', 'a small working stand-in used in tests, such as an in-memory list instead of a database.'],
    di: ['Dependency injection', 'passing an object the things it needs (usually through its constructor) instead of it creating them itself.'],
    root: ['Composition root', 'the one place, usually at startup, where real objects are created and plugged together.'],
    isp: ['Interface Segregation', 'the I in SOLID: no code should be forced to depend on methods it does not use.'],
  },
  zones: {
    policy: { x: 50, y: 30, w: 455, h: 400, label: 'POLICY · your domain', tone: 'accent' },
    detail: { x: 520, y: 30, w: 240, h: 400, label: 'DETAILS · infrastructure', tone: 'muted' },
  },
  map: {
    zones: { policy: [6, 8, 468, 150], detail: [6, 166, 468, 128, 'b'] },
    nodes: {
      test: [70, 46, 116], svc: [240, 46, 136], repoIf: [150, 124, 124], notifIf: [340, 124, 140],
      pg: [81, 216, 150], mem: [240, 216, 158], smtp: [396, 216, 148],
    },
  },
  nodes: {
    svc: { x: 165, y: 230, label: 'InvoiceService', sub: 'business rules', icon: 'file', kind: 'class', w: 164, h: 62 },
    test: { x: 165, y: 375, label: 'invoice.test.ts', icon: 'test', kind: 'test', w: 156 },
    repoIf: { x: 395, y: 130, label: 'InvoiceRepo', sub: 'interface', icon: 'iface', kind: 'iface', w: 146 },
    notifIf: { x: 395, y: 330, label: 'Notifier', sub: 'interface', icon: 'iface', kind: 'iface', w: 146 },
    pg: { x: 640, y: 100, label: 'PostgresInvoiceRepo', icon: 'db', kind: 'class', w: 196 },
    mem: { x: 640, y: 205, label: 'InMemoryInvoiceRepo', sub: 'for tests', icon: 'box', kind: 'class', w: 196 },
    smtp: { x: 640, y: 330, label: 'SmtpMailer', icon: 'mail', kind: 'class', w: 196 },
  },
  steps: [
    {
      lvl: 'basics', label: 'Direct imports', title: 'Business rules that import the database', done: 0,
      say: 'InvoiceService decides when an invoice is overdue and who gets a reminder. It creates its own Postgres connection and mail client.',
      add: ['svc', 'pg', 'smtp'],
      edges: [['svc', 'pg', { label: 'import', bend: -20 }], ['svc', 'smtp', { label: 'import', bend: 20 }]],
      flows: [['svc', 'pg', { bend: -20, n: 2 }], ['svc', 'smtp', { bend: 20, n: 1 }]],
      metrics: { test: '—', needs: '—', swap: '—', methods: '—' },
      blocks: [
        { lang: 'ts', code: `import { PostgresInvoiceRepo } from '../db/postgres';
import { SmtpMailer } from '../mail/smtp';

class InvoiceService {
  private repo = new PostgresInvoiceRepo(process.env.DB_URL);
  private mail = new SmtpMailer(process.env.SMTP_HOST);
  // ...the rules
}` },
        { p: 'The most important code in the system, the [[policy|rules]], now depends on the least stable code: database drivers, SQL and a mail vendor\'s library.' },
      ],
    },
    {
      lvl: 'basics', label: 'Slow tests', title: 'Testing one rule needs a database and a mail server', done: 0,
      say: 'To check one simple rule, the test must start a database and fake a mail server. It is slow, and it fails whenever Docker is not running.',
      add: ['test'],
      edges: [['svc', 'pg', { label: 'import', bend: -20 }], ['svc', 'smtp', { label: 'import', bend: 20 }], ['test', 'svc']],
      flows: [['test', 'svc', { n: 1, dur: 3 }], ['svc', 'pg', { bend: -20, n: 1, dur: 3, tone: 'warn' }]],
      state: { pg: 'warn', smtp: 'warn', test: 'bad' },
      metrics: { test: '4.2 s', needs: 'DB + SMTP', swap: 'edit rules' },
      blocks: [
        { p: 'The rule is simple: "an invoice 31 days past due gets a reminder". Testing it means starting Postgres, inserting rows and stubbing an SMTP server.' },
        { p: 'Switching to a different email provider means editing `InvoiceService` itself, the class with the business rules.' },
        { callout: 'warn', title: 'Why it hurts', text: 'When the rules depend on the details, every change in the details ripples up into the rules.' },
        { callout: 'illus', title: 'About the numbers', text: 'Test times in this lesson are illustrative.' },
      ],
    },
    {
      lvl: 'basics', label: 'Flip it', title: 'Flip the arrow', scene: 'dipFlip', done: 1,
      say: 'Watch the import arrow. The rules declare an interface. The database code now points up at it. Calls still flow down when the program runs.',
      read: { tiles: [tile('Calls at run time', 'down', 'rules → database'), tile('Imports in source', 'up', 'database → rules'), tile('Rules import', 'nothing', 'from infrastructure')] },
      blocks: [
        { p: 'Two different arrows matter here:' },
        { ul: ['**Run time:** `InvoiceService` still calls the database. That arrow points down, and it always will.', '**Source code:** who imports whom. After the flip, the Postgres code imports the rules\' interface, not the other way round.'] },
        { callout: 'key', title: 'The inversion', text: 'Source-code dependencies point **against** the flow of control. That is the whole trick.' },
      ],
    },
    {
      lvl: 'basics', label: 'Invert', title: 'Let the rules own the interfaces', done: 2,
      say: 'InvoiceService says what it needs: something that finds overdue invoices, and something that sends a notice. Those interfaces live next to the rules.',
      add: ['repoIf', 'notifIf'],
      zones: ['policy', 'detail'],
      edges: [['svc', 'repoIf', { label: 'needs' }], ['svc', 'notifIf', { label: 'needs' }], ['pg', 'repoIf', { dash: true, tone: 'ok', label: 'implements' }], ['smtp', 'notifIf', { dash: true, tone: 'ok', label: 'implements' }]],
      flows: [['svc', 'repoIf', { n: 2 }], ['svc', 'notifIf', { n: 1 }]],
      state: { repoIf: 'hl', notifIf: 'hl' },
      metrics: { swap: 'new adapter' },
      blocks: [
        { lang: 'ts', code: `// domain/ports.ts: owned by the rules
export interface InvoiceRepo { overdue(asOf: Date): Promise<Invoice[]>; }
export interface Notifier { notify(to: Customer, msg: string): Promise<void>; }

// domain/invoice-service.ts
export class InvoiceService {
  constructor(private repo: InvoiceRepo, private notifier: Notifier) {}
}` },
        { p: 'Postgres and SMTP become [[adapter|adapters]] that implement these interfaces. The service receives them through its constructor: that is [[di|dependency injection]].' },
        { callout: 'key', title: 'The principle', text: 'High-level modules should not depend on low-level modules. Both should depend on abstractions, and the abstractions belong to the high-level side.' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: how fast now?', done: 2,
      say: 'Make a guess. If the test uses an in-memory list instead of Postgres and a mail server, how long does it take?',
      check: {
        type: 'predict', q: 'The overdue-rule test took about 4 seconds with Postgres and a fake SMTP server. With an in-memory fake and a notifier that records messages in an array, roughly how long?',
        opts: [{ t: 'About the same, around 4 s' }, { t: 'Around 1 second' }, { t: 'A few milliseconds' }], ans: 2,
        fb: ['Much faster than that: ', 'Faster still: ', ''],
        why: 'With no database, network or container to start, the test is just function calls on objects in memory. That runs in milliseconds, and it cannot fail because Docker is down.',
      },
    },
    {
      lvl: 'basics', label: 'Fast fakes', title: 'The same rule, tested in milliseconds', done: 3,
      say: 'The test passes in a fake repo and a notifier that writes to an array. No containers, no network, no flakiness.',
      add: ['mem'],
      edges: [['svc', 'repoIf', { label: 'needs' }], ['svc', 'notifIf', { label: 'needs' }], ['pg', 'repoIf', { dash: true, tone: 'muted' }], ['mem', 'repoIf', { dash: true, tone: 'ok' }], ['smtp', 'notifIf', { dash: true, tone: 'muted' }], ['test', 'svc']],
      flows: [['test', 'svc', { n: 3, dur: 0.9 }], ['svc', 'repoIf', { n: 2, dur: 0.9 }]],
      state: { test: 'ok', mem: 'ok', pg: 'dim', smtp: 'dim' },
      metrics: { test: '8 ms', needs: 'nothing' },
      blocks: [
        { lang: 'ts', code: `test('reminds customers 31 days after the due date', async () => {
  const repo = new InMemoryInvoiceRepo([invoice({ dueDaysAgo: 31 })]);
  const sent: string[] = [];
  const svc = new InvoiceService(repo, {
    notify: async (_to, msg) => { sent.push(msg); },
  });

  await svc.sendReminders(today);

  expect(sent).toHaveLength(1);
});` },
        { p: 'The [[fake|fake]] repo is a few lines of code over an array. Keep one integration test that runs `PostgresInvoiceRepo` against a real database, so the adapter is checked too.' },
        { changes: [['+', 'InMemoryInvoiceRepo (tests only)'], ['~', 'Unit test time 4.2 s → 8 ms']] },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 3,
      say: 'Your turn. Where should the Notifier interface live?',
      check: {
        type: 'choice', q: 'Where should the `Notifier` interface that `InvoiceService` uses live?',
        opts: [
          { t: 'In the email package, next to `SmtpMailer`', hint: 'Then the rules would import the email package, and the arrow points the wrong way again.' },
          { t: 'In the domain package, next to `InvoiceService`' },
          { t: 'Nowhere: `InvoiceService` should create `SmtpMailer` directly', hint: 'That is where we started: slow tests and rules tied to one vendor.' },
        ],
        ans: 1, why: 'The rules own the interface, so it lives with them. The email adapter imports it and implements it. The domain package imports nothing from infrastructure.',
      },
    },
    {
      lvl: 'intermediate', label: 'Wiring', title: 'One place that knows the real parts', done: 3,
      say: 'Somebody still has to create Postgres and SMTP objects. Do it once, at startup, in the composition root. Everything else just receives what it needs.',
      blocks: [
        { lang: 'ts', code: `// main.ts: the composition root
const db = new Pool({ connectionString: process.env.DB_URL });

const invoices = new InvoiceService(
  new PostgresInvoiceRepo(db),
  new SmtpMailer(process.env.SMTP_HOST),
);

schedule('0 9 * * *', () => invoices.sendReminders(new Date()));` },
        { p: 'This [[root|composition root]] is the only file that imports both the rules and the infrastructure. Swapping the mail vendor is a new adapter plus one changed line here.' },
        { table: { head: ['Term', 'What it is', 'Needed?'], rows: [
          ['Dependency inversion', 'Which way the imports point', 'The goal'],
          ['Dependency injection', 'Passing collaborators in, e.g. by constructor', 'The usual way to do it'],
          ['DI container', 'A library that does the wiring for you', 'Optional; plain code is often enough'],
        ] } },
      ],
    },
    {
      lvl: 'intermediate', label: 'Fat interface', title: 'Then Notifier grows to 12 methods', done: 3,
      say: 'Other teams add SMS, push and digest methods to Notifier. The invoice service still uses one of the twelve, but every fake must now stub them all.',
      remove: ['mem'],
      set: { notifIf: { sub: '12 methods' }, smtp: { sub: '9 methods throw' } },
      edges: [['svc', 'repoIf', { label: 'needs' }], ['svc', 'notifIf', { label: 'uses 1 of 12' }], ['pg', 'repoIf', { dash: true, tone: 'muted' }], ['smtp', 'notifIf', { dash: true, tone: 'warn' }], ['test', 'svc']],
      flows: [],
      state: { notifIf: 'bad', smtp: 'warn' },
      metrics: { methods: '12' },
      blocks: [
        { p: 'Every implementation must now provide all twelve methods, so `SmtpMailer` throws "not supported" for nine of them (a Liskov smell). A change to `sendPush` touches code that never sends a push.' },
        { callout: 'key', title: 'Interface Segregation', text: 'No code should be forced to depend on methods it does not use. That is [[isp|Interface Segregation]], the I in SOLID.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Role interfaces', title: 'Small interfaces, shaped by the client', done: 4,
      say: 'Let each client declare the small interface it needs, named after its role. One mail adapter can implement several of them.',
      set: { notifIf: { label: 'OverdueNotifier', sub: 'notify(customer, msg)' }, smtp: { sub: 'several roles' } },
      edges: [['svc', 'repoIf', { label: 'needs' }], ['svc', 'notifIf', { label: 'needs' }], ['pg', 'repoIf', { dash: true, tone: 'muted' }], ['smtp', 'notifIf', { dash: true, tone: 'ok' }], ['test', 'svc']],
      flows: [['svc', 'notifIf', { n: 2 }]],
      state: { notifIf: 'ok', smtp: 'ok' },
      metrics: { methods: '1' },
      blocks: [
        { lang: 'ts', code: `// owned by the invoice rules
interface OverdueNotifier { notify(to: Customer, msg: string): Promise<void>; }
// owned by the marketing rules
interface DigestSender { sendDigest(to: Customer[], items: Item[]): Promise<void>; }

class SmtpMailer implements OverdueNotifier, DigestSender { /* ... */ }` },
        { p: 'This is why Dependency Inversion and Interface Segregation pair so well: when the rules own the interface, they naturally ask for exactly what they use.' },
        { changes: [['~', 'Notifier (12 methods) → OverdueNotifier (1)'], ['-', 'Stub methods removed from fakes']] },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'Not everything needs an interface. Which of these should you call directly?',
      check: {
        type: 'choice', q: 'Which dependency is NOT worth hiding behind an interface?',
        opts: [
          { t: 'The payment provider\'s HTTP API', hint: 'A network call to a vendor you may switch: a real boundary, and slow in tests.' },
          { t: 'A pure `formatCents(cents)` function in your own code, with one implementation' },
          { t: 'The database that stores invoices', hint: 'I/O and a technology choice: the classic place to invert.' },
        ],
        ans: 1, why: 'A pure function is already fast, predictable and easy to test. An interface in front of it adds a detour with no benefit. Invert at real boundaries: I/O, vendors, other teams.',
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: rules in the middle, details at the edge', done: 4,
      say: 'The rules own small interfaces. Databases and vendors implement them. One composition root wires it all, and tests use fakes.',
      flows: [], state: {},
      blocks: [
        { ul: [
          '**Dependency inversion:** the rules own the interfaces; infrastructure implements them.',
          '**Two arrows:** calls still go down at run time; imports point up, at the rules.',
          '**Wiring:** inject dependencies through constructors and create real ones in one composition root.',
          '**Payoff:** millisecond tests with fakes, swappable vendors, rules that outlive frameworks.',
          '**Interface Segregation:** keep interfaces small and named for the client\'s role.',
          '**Caution:** an interface for every class is noise. Invert at real boundaries.',
        ] },
      ],
    },
  ],
};
