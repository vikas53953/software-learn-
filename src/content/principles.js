// Module 1: Design principles (SOLID)

export const srp = {
  slug: 'single-responsibility',
  title: 'One Reason to Change',
  short: 'Single Responsibility',
  minutes: 9,
  level: 'Beginner',
  promise: 'Why a class that serves four teams breaks four times as often, and how to split it along the right seams.',
  learn: [
    'What "responsibility" really means: one actor, one reason to change',
    'How to spot a class with too many owners',
    'Splitting by actor, with an orchestrator on top',
    'Where to stop: cohesion beats tiny classes',
  ],
  metrics: [
    { key: 'lines', label: 'Biggest class' },
    { key: 'reasons', label: 'Reasons to change' },
    { key: 'conflicts', label: 'Merge conflicts / wk' },
    { key: 'blast', label: 'Blast radius' },
  ],
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
      label: 'The blob', tag: 'problem',
      title: 'One class does the whole checkout',
      add: ['req', 'god', 'db', 'smtp'],
      edges: [['req', 'god'], ['god', 'db', { bend: -30 }], ['god', 'smtp', { bend: 30 }]],
      flows: [['req', 'god', { n: 2 }], ['god', 'db', { bend: -30, n: 1, dur: 1.4 }]],
      metrics: { lines: '820', reasons: '4', conflicts: '6', blast: 'whole file' },
      body: [
        '`OrderService` validates the cart, prices it, saves it and emails a receipt. It started at 80 lines. Every new feature landed here because it was the obvious place.',
        'Nothing is broken yet. But every change, for any reason, edits the same file.',
      ],
      code: { lang: 'ts', src: `class OrderService {
  checkout(cart: Cart) {
    this.validate(cart);       // input rules
    const total = this.price(cart); // tax, discounts
    this.save(cart, total);    // SQL
    this.emailReceipt(cart);   // HTML template
  }
  // ...800 more lines
}` },
      callout: { type: 'key', text: 'Size is a symptom, not the disease. The disease is how many different people need this file to change.' },
      done: 0,
    },
    {
      label: 'Four owners', tag: 'problem',
      title: 'Four teams, one file',
      add: ['fin', 'mkt', 'dba', 'sec'],
      edges: [['req', 'god'], ['god', 'db', { bend: -30 }], ['god', 'smtp', { bend: 30 }],
        ['fin', 'god', { dash: true, tone: 'warn' }], ['mkt', 'god', { dash: true, tone: 'warn' }], ['dba', 'god', { dash: true, tone: 'warn' }], ['sec', 'god', { dash: true, tone: 'warn' }]],
      flows: [['fin', 'god', { tone: 'warn', n: 1, dur: 2.2 }], ['sec', 'god', { tone: 'warn', n: 1, dur: 2.6 }]],
      state: { god: 'bad' },
      body: [
        'Finance wants a new tax rule. Marketing wants new receipt wording. The DBA is renaming a column. Security wants stricter input checks. All four requests touch `OrderService`.',
        'Their pull requests collide. A typo in the email template can now break pricing tests, and a pricing change needs a review from someone who knows SQL.',
      ],
      callout: { type: 'key', text: 'The Single Responsibility Principle: a module should be responsible to one actor. Put differently, it should have one reason to change.' },
      changes: [['~', 'Reasons to change: 4 (one per team)'], ['~', 'Merge conflicts: about 6 a week']],
      done: 1,
    },
    {
      label: 'Split by actor', tag: 'solution',
      title: 'Give each reason its own home',
      add: ['val', 'price', 'repo', 'mail'],
      set: { god: { label: 'CheckoutFlow', sub: '40 lines' }, fin: { sub: 'owns PriceCalculator' }, mkt: { sub: 'owns ReceiptMailer' }, dba: { sub: 'owns OrderRepository' }, sec: { sub: 'owns OrderValidator' } },
      edges: [['req', 'god'], ['god', 'val'], ['god', 'price'], ['god', 'repo'], ['god', 'mail'], ['repo', 'db'], ['mail', 'smtp']],
      flows: [['req', 'god', { n: 2 }], ['god', 'val', { n: 1 }], ['god', 'price', { n: 1, delay: 0.25 }], ['god', 'repo', { n: 1, delay: 0.5 }], ['god', 'mail', { n: 1, delay: 0.75 }]],
      state: { val: 'ok', price: 'ok', repo: 'ok', mail: 'ok' },
      metrics: { lines: '120', reasons: '1 each', conflicts: '1', blast: 'one class' },
      body: [
        'Pull each responsibility into a class owned by one actor. `CheckoutFlow` keeps only the order of the steps, which is a decision the product team owns.',
        'Each new class is small, has its own tests, and changes only when its own owner asks for something.',
      ],
      code: { lang: 'ts', src: `class CheckoutFlow {
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
      changes: [['+', 'OrderValidator, PriceCalculator, OrderRepository, ReceiptMailer'], ['~', 'OrderService becomes a 40-line CheckoutFlow']],
      done: 3,
    },
    {
      label: 'Tax rule', tag: 'case',
      title: 'Finance changes a tax rule',
      edges: [['req', 'god'], ['god', 'val'], ['god', 'price'], ['god', 'repo'], ['god', 'mail'], ['repo', 'db'], ['mail', 'smtp'], ['fin', 'price', { dash: true, tone: 'accent', bend: 30 }]],
      flows: [['fin', 'price', { bend: 30, n: 2, tone: 'accent' }]],
      state: { price: 'hl', val: 'dim', repo: 'dim', mail: 'dim', god: 'dim', req: 'dim', db: 'dim', smtp: 'dim', mkt: 'dim', dba: 'dim', sec: 'dim' },
      metrics: { blast: 'PriceCalculator' },
      body: [
        'A new rule says digital goods are taxed where the buyer lives. The change lands in `PriceCalculator` and its tests. Nothing else is edited, recompiled in review, or retested by hand.',
        'The reviewer is someone from Finance engineering who knows tax, not someone who has to understand SQL and email templates too.',
      ],
      callout: { type: 'tip', text: 'A quick test for SRP: describe the class without using "and". "Calculates the order total" passes. "Validates and prices and saves" does not.' },
      changes: [['~', 'Files changed: PriceCalculator.ts, PriceCalculator.test.ts'], ['-', 'No edits to validation, storage or email']],
      done: 3,
    },
    {
      label: 'Don\'t over-split', tag: 'tradeoff',
      title: 'Cohesion: keep together what changes together',
      flows: [],
      state: {},
      body: [
        'SRP is not "one method per class". Splitting `PriceCalculator` into `TaxLookup`, `DiscountApplier`, `Rounder` and `CurrencyFormatter` only helps if different people change them for different reasons.',
        'If every tax change also touches rounding, those belong together. Too many tiny classes scatter one idea across ten files, which is its own maintenance cost.',
      ],
      callout: { type: 'warn', text: 'Split when you see different owners or different rates of change. Do not split just because a file feels long.' },
      done: 4,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: one owner per module',
      body: [
        '**Responsibility means an actor.** A module should change for one group\'s reasons.',
        '**Symptoms** of a violation: frequent merge conflicts, unrelated tests failing, reviews that need four experts.',
        '**Fix** by extracting along owner lines and keeping a thin coordinator on top.',
        '**Stop** when the pieces would always change together.',
      ],
      done: 4,
    },
  ],
};

export const ocp = {
  slug: 'open-closed',
  title: 'Add, Don\'t Edit',
  short: 'Open / Closed',
  minutes: 10,
  level: 'Beginner',
  promise: 'Add a new payment method without touching the code that already works.',
  learn: [
    'Why a growing switch statement is a warning sign',
    'Open for extension, closed for modification',
    'The Strategy pattern as the everyday tool',
    'When an abstraction is premature',
  ],
  metrics: [
    { key: 'branches', label: 'Branches in processor' },
    { key: 'edited', label: 'Existing files edited' },
    { key: 'retest', label: 'Code to retest' },
    { key: 'methods', label: 'Payment methods' },
  ],
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
      label: 'Two methods', tag: 'problem',
      title: 'A processor that knows every payment type',
      add: ['co', 'proc', 'card', 'paypal'],
      edges: [['co', 'proc'], ['proc', 'card', { bend: -20 }], ['proc', 'paypal']],
      flows: [['co', 'proc', { n: 2 }], ['proc', 'card', { bend: -20, n: 1 }]],
      metrics: { branches: '2', edited: '—', retest: '—', methods: '2' },
      body: [
        'Checkout hands the cart to `PaymentProcessor`, which picks the right code path with a `switch` on the method name.',
        'With two methods this is perfectly readable. The trouble starts with the third.',
      ],
      code: { lang: 'ts', src: `pay(order: Order) {
  switch (order.method) {
    case 'card':     return chargeCard(order);
    case 'transfer': return startTransfer(order);
    default: throw new Error('unknown method');
  }
}` },
      done: 0,
    },
    {
      label: 'New request', tag: 'problem',
      title: '"Can we add digital wallets by Friday?"',
      add: ['edit'],
      set: { proc: { sub: 'switch (method) +1 case' } },
      edges: [['co', 'proc'], ['proc', 'card', { bend: -20 }], ['proc', 'paypal'], ['edit', 'proc', { dash: true, tone: 'bad' }]],
      flows: [['edit', 'proc', { tone: 'bad', n: 1, dur: 2 }]],
      state: { proc: 'bad' },
      metrics: { branches: '3', edited: '1', retest: 'all methods' },
      body: [
        'Adding a wallet means opening `PaymentProcessor`, adding a case, and usually a few `if (method === \'wallet\')` checks for refunds and receipts in other files too.',
        'The class that handles real money for cards and transfers is now being edited for a feature that has nothing to do with them. Every method needs retesting.',
      ],
      callout: { type: 'warn', text: 'The same switch on a type code tends to reappear in several places (pay, refund, fees). Each new type means hunting down every copy.' },
      changes: [['~', 'PaymentProcessor edited'], ['~', 'Card and transfer paths need regression tests']],
      done: 1,
    },
    {
      label: 'An interface', tag: 'solution',
      title: 'Depend on a role, not a list of cases',
      add: ['iface'],
      remove: ['edit'],
      set: { proc: { sub: 'no switch' } },
      edges: [['co', 'proc'], ['proc', 'iface', { label: 'uses' }], ['card', 'iface', { dash: true, tone: 'muted' }], ['paypal', 'iface', { dash: true, tone: 'muted' }]],
      flows: [['co', 'proc', { n: 2 }], ['proc', 'iface', { n: 2, delay: 0.3 }]],
      state: { iface: 'hl' },
      metrics: { branches: '0', edited: '—', retest: '—' },
      body: [
        'Define what every payment method must do: `authorize`, `capture`, `refund`. Each method becomes its own class that implements this contract.',
        'The processor now talks to `PaymentMethod` and never asks which kind it has. That is the Strategy pattern: pick the behaviour by picking an object.',
      ],
      code: { lang: 'ts', src: `interface PaymentMethod {
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
      callout: { type: 'key', text: 'Open for extension: you can add behaviour. Closed for modification: you do it without editing tested code.' },
      done: 2,
    },
    {
      label: 'Add wallet', tag: 'case',
      title: 'Adding wallets is now a new file',
      add: ['wallet'],
      edges: [['co', 'proc'], ['proc', 'iface', { label: 'uses' }], ['card', 'iface', { dash: true, tone: 'muted' }], ['paypal', 'iface', { dash: true, tone: 'muted' }], ['wallet', 'iface', { dash: true, tone: 'ok' }]],
      flows: [['co', 'proc', { n: 2 }], ['proc', 'iface', { n: 2 }]],
      state: { wallet: 'ok', iface: '', card: 'dim', paypal: 'dim', proc: 'dim' },
      metrics: { edited: '0', retest: 'wallet only', methods: '3' },
      body: [
        '`WalletPayment` implements the interface and is registered at startup. The processor, the card code and the transfer code are untouched.',
        'Your code review is one new class plus its tests. The risk to existing payment paths is close to zero.',
      ],
      code: { lang: 'ts', src: `// composition root (startup)
const methods = new Map<string, PaymentMethod>([
  ['card', new CardPayment(gateway)],
  ['transfer', new BankTransfer(bank)],
  ['wallet', new WalletPayment(walletApi)], // the only new line
]);` },
      changes: [['+', 'WalletPayment.ts'], ['+', 'One registration line at startup'], ['-', 'No edits to PaymentProcessor']],
      done: 3,
    },
    {
      label: 'Not on day one', tag: 'tradeoff',
      title: 'Don\'t build the socket before the plug',
      flows: [],
      state: {},
      body: [
        'An interface with one implementation is just indirection. You pay for it in every "go to definition" without getting any of the benefit.',
        'A good rule of thumb: tolerate the first duplication, notice the second, abstract on the third. By then you know which parts really vary.',
      ],
      callout: { type: 'warn', text: 'OCP protects code from changes you can predict. Guessing the wrong axis of change gives you a rigid abstraction that fights the change that actually comes.' },
      done: 4,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: extend by adding',
      body: [
        '**Smell:** the same `switch` on a type code in several places.',
        '**Fix:** an interface for the varying behaviour, one class per variant (Strategy).',
        '**Payoff:** new variants are new files; tested code stays closed.',
        '**Timing:** abstract once the variation is real, not imagined.',
      ],
      done: 4,
    },
  ],
};

export const lsp = {
  slug: 'liskov-substitution',
  title: 'Keep the Promise',
  short: 'Liskov Substitution',
  minutes: 10,
  level: 'Intermediate',
  promise: 'A subtype that compiles is not the same as a subtype that works. See how a "harmless" class crashes a backup job.',
  learn: [
    'The contract behind an interface: what callers rely on',
    'How a subtype can type-check yet still break callers',
    'Preconditions, postconditions and invariants',
    'Fixing it by splitting the interface',
  ],
  metrics: [
    { key: 'impls', label: 'Implementations' },
    { key: 'checks', label: 'instanceof checks' },
    { key: 'failures', label: 'Runtime surprises' },
  ],
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
      label: 'The contract', tag: 'idea',
      title: 'An interface is a promise, not just a shape',
      add: ['job', 'viewer', 'store', 'disk', 'bucket'],
      edges: [['job', 'store'], ['viewer', 'store'], ['disk', 'store', { dash: true, tone: 'muted' }], ['bucket', 'store', { dash: true, tone: 'muted' }]],
      flows: [['job', 'store', { n: 2 }], ['viewer', 'store', { n: 1, tone: 'ok' }]],
      metrics: { impls: '2', checks: '0', failures: '0' },
      body: [
        '`Storage` has `read(key)` and `write(key, data)`. The types say little, but callers rely on more: after `write` returns, the data is stored and a later `read` gets it back.',
        'That unwritten promise is the contract. `BackupJob` is written against it and does not care which store it gets.',
      ],
      code: { lang: 'ts', src: `interface Storage {
  read(key: string): Promise<Bytes>;
  /** Resolves once data is durably stored. */
  write(key: string, data: Bytes): Promise<void>;
}` },
      done: 0,
    },
    {
      label: 'A new subtype', tag: 'problem',
      title: 'A read-only mirror joins the family',
      add: ['mirror'],
      edges: [['job', 'store'], ['viewer', 'store'], ['disk', 'store', { dash: true, tone: 'muted' }], ['bucket', 'store', { dash: true, tone: 'muted' }], ['mirror', 'store', { dash: true, tone: 'warn' }]],
      state: { mirror: 'warn' },
      metrics: { impls: '3' },
      body: [
        'Someone adds `ReadOnlyMirror` so reports can read from a cheaper replica. It needs `read`, but the interface also demands `write`, so it throws.',
        'It compiles. The type checker is satisfied. Code review sees a small, tidy class.',
      ],
      code: { lang: 'ts', src: `class ReadOnlyMirror implements Storage {
  read(key: string) { return this.replica.get(key); }
  write(): Promise<void> {
    throw new Error('mirror is read-only'); // breaks the promise
  }
}` },
      done: 1,
    },
    {
      label: '3 a.m.', tag: 'problem',
      title: 'The backup job gets a mirror and crashes',
      edges: [['job', 'store'], ['viewer', 'store'], ['disk', 'store', { dash: true, tone: 'muted' }], ['bucket', 'store', { dash: true, tone: 'muted' }], ['mirror', 'store', { dash: true, tone: 'bad' }]],
      flows: [['job', 'store', { n: 3, tone: 'bad', stall: 0.92 }]],
      state: { mirror: 'bad', job: 'bad' },
      metrics: { failures: '1', checks: '0' },
      body: [
        'A config change wires the mirror into `BackupJob`. At 3 a.m. every write throws and the backup silently does not happen.',
        'The quick "fix" is `if (store instanceof ReadOnlyMirror) skip()`. Now the caller has to know about subtypes, and every new caller has to remember the same check.',
      ],
      callout: { type: 'key', text: 'Liskov Substitution: anywhere the program uses a type, it must work with any subtype, with no surprises and no type checks.' },
      changes: [['~', 'Callers start sprouting instanceof checks']],
      done: 2,
    },
    {
      label: 'The rules', tag: 'idea',
      title: 'What a subtype may and may not do',
      flows: [],
      state: { mirror: 'bad' },
      body: [
        'A subtype may **accept more** (weaker preconditions) and **promise more** (stronger postconditions). It must not demand more from callers, promise less, or break an invariant the base type keeps.',
        '`ReadOnlyMirror.write` promises less: it can never store anything. Throwing a new kind of exception the caller has no reason to expect is also a broken promise.',
      ],
      callout: { type: 'tip', text: 'Classic example: Square extends Rectangle. Setting the width of a Square also changes its height, which breaks code that assumes width and height are independent.' },
      done: 3,
    },
    {
      label: 'Split roles', tag: 'solution',
      title: 'Model what each type can actually do',
      remove: ['store'],
      add: ['wstore', 'rstore'],
      set: { mirror: { sub: 'read only, honestly' } },
      edges: [['job', 'wstore'], ['viewer', 'rstore'], ['disk', 'wstore', { dash: true, tone: 'muted' }], ['disk', 'rstore', { dash: true, tone: 'muted', bend: 30 }],
        ['bucket', 'wstore', { dash: true, tone: 'muted' }], ['bucket', 'rstore', { dash: true, tone: 'muted' }], ['mirror', 'rstore', { dash: true, tone: 'ok' }]],
      flows: [['job', 'wstore', { n: 2 }], ['viewer', 'rstore', { n: 2, tone: 'ok' }]],
      state: { mirror: 'ok', job: '', wstore: 'hl', rstore: 'hl' },
      metrics: { checks: '0', failures: '0' },
      body: [
        'Split the interface by capability. `ReadOnlyMirror` implements only `ReadableStore`. `BackupJob` asks for a `WritableStore`.',
        'Now wiring the mirror into the backup job is a **compile error**, caught in seconds instead of at 3 a.m.',
      ],
      code: { lang: 'ts', src: `interface ReadableStore { read(key: string): Promise<Bytes>; }
interface WritableStore { write(key: string, d: Bytes): Promise<void>; }

class LocalDisk implements ReadableStore, WritableStore { /* ... */ }
class ReadOnlyMirror implements ReadableStore { /* ... */ }

new BackupJob(new ReadOnlyMirror()); // ✗ type error` },
      changes: [['+', 'ReadableStore and WritableStore'], ['-', 'Storage removed'], ['-', 'instanceof checks deleted']],
      done: 4,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: subtypes keep their parent\'s promises',
      flows: [],
      state: {},
      body: [
        '**Contracts** include behaviour, not just method signatures.',
        '**Red flags:** methods that throw "not supported", empty overrides, `instanceof` checks in callers.',
        '**Fix** by modelling capabilities separately, so the type system rejects bad wiring.',
        'This leads straight into the next principle: small, focused interfaces.',
      ],
      done: 4,
    },
  ],
};

export const dip = {
  slug: 'dependency-inversion',
  title: 'Point the Arrows Inward',
  short: 'Interfaces & Inversion',
  minutes: 12,
  level: 'Intermediate',
  promise: 'Make business rules independent of databases and vendors, so tests run in milliseconds and suppliers are swappable.',
  learn: [
    'Why high-level policy should not import low-level details',
    'Owning the interface on the policy side',
    'Fast tests with in-memory fakes',
    'Interface Segregation: small role interfaces',
  ],
  metrics: [
    { key: 'test', label: 'Unit test time' },
    { key: 'needs', label: 'Test needs' },
    { key: 'swap', label: 'Swap mail vendor' },
    { key: 'methods', label: 'Notifier methods' },
  ],
  zones: {
    policy: { x: 50, y: 30, w: 455, h: 400, label: 'POLICY · your domain', tone: 'accent' },
    detail: { x: 520, y: 30, w: 240, h: 400, label: 'DETAILS · infrastructure', tone: 'muted' },
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
      label: 'Direct imports', tag: 'problem',
      title: 'Business rules that import the database',
      add: ['svc', 'pg', 'smtp'],
      edges: [['svc', 'pg', { label: 'import', bend: -20 }], ['svc', 'smtp', { label: 'import', bend: 20 }]],
      flows: [['svc', 'pg', { bend: -20, n: 2 }], ['svc', 'smtp', { bend: 20, n: 1 }]],
      metrics: { test: '—', needs: '—', swap: '—', methods: '—' },
      body: [
        '`InvoiceService` decides when an invoice is overdue and who gets reminded. To do that it creates a `PostgresInvoiceRepo` and an `SmtpMailer` itself.',
        'The most important code in the system, the rules, now depends on the least stable code: drivers, SQL and a mail vendor\'s SDK.',
      ],
      code: { lang: 'ts', src: `import { PostgresInvoiceRepo } from '../db/postgres';
import { SmtpMailer } from '../mail/smtp';

class InvoiceService {
  private repo = new PostgresInvoiceRepo(process.env.DB_URL);
  private mail = new SmtpMailer(process.env.SMTP_HOST);
  // ...rules
}` },
      done: 0,
    },
    {
      label: 'Slow tests', tag: 'problem',
      title: 'Testing one rule needs a database and a mail server',
      add: ['test'],
      edges: [['svc', 'pg', { label: 'import', bend: -20 }], ['svc', 'smtp', { label: 'import', bend: 20 }], ['test', 'svc']],
      flows: [['test', 'svc', { n: 1, dur: 3 }], ['svc', 'pg', { bend: -20, n: 1, dur: 3, tone: 'warn' }]],
      state: { pg: 'warn', smtp: 'warn', test: 'bad' },
      metrics: { test: '4.2 s', needs: 'DB + SMTP', swap: 'edit rules' },
      body: [
        'To check "an invoice 31 days old is overdue", the test must start Postgres, seed rows and stub an SMTP server. It takes seconds and fails when Docker is not running.',
        'Switching to a different mail provider means editing `InvoiceService` itself, the class with the business rules.',
      ],
      callout: { type: 'warn', text: 'When high-level code depends on low-level code, every change in the details ripples up into the rules.' },
      done: 0,
    },
    {
      label: 'Invert', tag: 'solution',
      title: 'Let the policy own the interfaces',
      add: ['repoIf', 'notifIf'],
      zones: ['policy', 'detail'],
      edges: [['svc', 'repoIf', { label: 'needs' }], ['svc', 'notifIf', { label: 'needs' }], ['pg', 'repoIf', { dash: true, tone: 'ok', label: 'implements' }], ['smtp', 'notifIf', { dash: true, tone: 'ok', label: 'implements' }], ['test', 'svc']],
      flows: [['svc', 'repoIf', { n: 2 }], ['svc', 'notifIf', { n: 1 }]],
      state: { repoIf: 'hl', notifIf: 'hl' },
      metrics: { swap: 'new adapter' },
      body: [
        '`InvoiceService` declares what it needs: something that loads invoices and something that sends a notice. Those interfaces live **next to the rules**, in the domain package.',
        'Postgres and SMTP now depend on the domain\'s interfaces, not the other way round. The source-code arrows across the boundary point inward. That is the inversion.',
      ],
      code: { lang: 'ts', src: `// domain/ports.ts
export interface InvoiceRepo { overdue(asOf: Date): Promise<Invoice[]>; }
export interface Notifier { notify(to: Customer, msg: string): Promise<void>; }

// domain/invoice-service.ts
export class InvoiceService {
  constructor(private repo: InvoiceRepo, private notifier: Notifier) {}
}` },
      callout: { type: 'key', text: 'Dependency Inversion: high-level modules should not depend on low-level modules. Both should depend on abstractions, and the abstractions belong to the high-level side.' },
      done: 2,
    },
    {
      label: 'Fast fakes', tag: 'case',
      title: 'The same rule, tested in 8 ms',
      add: ['mem'],
      edges: [['svc', 'repoIf', { label: 'needs' }], ['svc', 'notifIf', { label: 'needs' }], ['pg', 'repoIf', { dash: true, tone: 'muted' }], ['mem', 'repoIf', { dash: true, tone: 'ok' }], ['smtp', 'notifIf', { dash: true, tone: 'muted' }], ['test', 'svc']],
      flows: [['test', 'svc', { n: 3, dur: 0.9 }], ['svc', 'repoIf', { n: 2, dur: 0.9 }]],
      state: { test: 'ok', mem: 'ok', pg: 'dim', smtp: 'dim' },
      metrics: { test: '8 ms', needs: 'nothing' },
      body: [
        'The test passes an `InMemoryInvoiceRepo` and a notifier that records messages in an array. No containers, no network, no flakiness.',
        'Production wiring happens once, at startup, in the composition root. That is the only place that knows about Postgres and SMTP.',
      ],
      code: { lang: 'ts', src: `test('reminds customers 31 days after due date', async () => {
  const repo = new InMemoryInvoiceRepo([invoice({ dueDaysAgo: 31 })]);
  const sent: string[] = [];
  const svc = new InvoiceService(repo, { notify: async (_, m) => { sent.push(m); } });
  await svc.sendReminders(today);
  expect(sent).toHaveLength(1);
});` },
      changes: [['+', 'InMemoryInvoiceRepo (test only)'], ['~', 'Unit test time 4.2 s → 8 ms']],
      done: 3,
    },
    {
      label: 'Fat interface', tag: 'problem',
      title: 'Then Notifier grows to 12 methods',
      remove: ['mem'],
      set: { notifIf: { sub: '12 methods' }, smtp: { sub: '9 methods throw' } },
      edges: [['svc', 'repoIf', { label: 'needs' }], ['svc', 'notifIf', { label: 'uses 1 of 12' }], ['pg', 'repoIf', { dash: true, tone: 'muted' }], ['smtp', 'notifIf', { dash: true, tone: 'warn' }], ['test', 'svc']],
      flows: [],
      state: { notifIf: 'bad', smtp: 'warn' },
      metrics: { methods: '12' },
      body: [
        'Over time other teams add `sendSms`, `sendPush`, `scheduleDigest`, `unsubscribe` and more to `Notifier`. `InvoiceService` still calls only one of them.',
        'Every implementation must now provide all twelve, and every fake in every test has to stub them. A change to `sendPush` forces a rebuild of code that never sends a push.',
      ],
      callout: { type: 'key', text: 'Interface Segregation: no client should be forced to depend on methods it does not use.' },
      done: 3,
    },
    {
      label: 'Role interfaces', tag: 'solution',
      title: 'Small interfaces, shaped by the client',
      set: { notifIf: { label: 'OverdueNotifier', sub: 'notify(customer, msg)' }, smtp: { sub: 'implements several roles' } },
      edges: [['svc', 'repoIf', { label: 'needs' }], ['svc', 'notifIf', { label: 'needs' }], ['pg', 'repoIf', { dash: true, tone: 'muted' }], ['smtp', 'notifIf', { dash: true, tone: 'ok' }], ['test', 'svc']],
      flows: [['svc', 'notifIf', { n: 2 }]],
      state: { notifIf: 'ok', smtp: 'ok' },
      metrics: { methods: '1' },
      body: [
        'Each client defines the interface it needs, named after its role. `SmtpMailer` can implement several small interfaces. Clients only see their own.',
        'This is why ISP and DIP pair so well: when the policy owns the interface, it naturally asks for exactly what it uses.',
      ],
      changes: [['~', 'Notifier (12 methods) → OverdueNotifier (1)'], ['-', 'Stub methods removed from fakes']],
      done: 4,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: rules in the middle, details at the edge',
      flows: [],
      state: {},
      body: [
        '**DIP:** policy owns the interfaces; infrastructure implements them; wire it all up at startup.',
        '**Payoff:** fast tests with fakes, swappable vendors, rules that outlive frameworks.',
        '**ISP:** keep interfaces small and named for the client\'s role.',
        '**Caution:** an interface for every class is noise. Invert at real boundaries: I/O, vendors, other teams.',
      ],
      done: 4,
    },
  ],
};
