// Module 2: Design patterns

export const observer = {
  slug: 'observer',
  title: 'Tell, Don\'t Call',
  short: 'Observer',
  minutes: 11,
  level: 'Intermediate',
  promise: 'Let an order announce what happened, and let anyone who cares react, without the order knowing who they are.',
  learn: [
    'The coupling cost of calling every interested party directly',
    'Subject and observers: publish an event, let listeners subscribe',
    'Why in-process observers are still synchronous by default',
    'Isolating failures and going asynchronous',
    'The hidden costs: invisible flow, ordering, leaks',
  ],
  metrics: [
    { key: 'deps', label: 'OrderService depends on' },
    { key: 'latency', label: 'Checkout latency' },
    { key: 'blast', label: 'If analytics is down' },
    { key: 'add', label: 'Adding a listener edits' },
  ],
  nodes: {
    order: { x: 130, y: 230, label: 'OrderService', sub: 'places orders', icon: 'card', kind: 'svc', w: 160, h: 62 },
    bus: { x: 380, y: 230, label: 'OrderEvents', sub: 'subject', icon: 'bell', kind: 'queue', w: 150, h: 62 },
    email: { x: 640, y: 55, label: 'Receipt email', icon: 'mail', kind: 'svc', w: 160 },
    stock: { x: 640, y: 145, label: 'Inventory', icon: 'box', kind: 'svc', w: 160 },
    analytics: { x: 640, y: 235, label: 'Analytics', icon: 'chart', kind: 'svc', w: 160 },
    loyalty: { x: 640, y: 325, label: 'Loyalty points', icon: 'sparkle', kind: 'svc', w: 160 },
    fraud: { x: 640, y: 415, label: 'Fraud check', sub: 'new', icon: 'shield', kind: 'svc', w: 160 },
  },
  steps: [
    {
      label: 'Direct calls', tag: 'problem',
      title: 'Placing an order calls four other systems',
      add: ['order', 'email', 'stock', 'analytics', 'loyalty'],
      edges: [['order', 'email', { bend: -30 }], ['order', 'stock', { bend: -10 }], ['order', 'analytics', { bend: 0 }], ['order', 'loyalty', { bend: 10 }]],
      flows: [['order', 'email', { bend: -30, n: 1 }], ['order', 'stock', { bend: -10, n: 1, delay: 0.25 }], ['order', 'analytics', { n: 1, delay: 0.5 }], ['order', 'loyalty', { bend: 10, n: 1, delay: 0.75 }]],
      metrics: { deps: '4 services', latency: '620 ms', blast: '—', add: 'OrderService' },
      body: [
        'After saving an order, `OrderService` calls the mailer, inventory, analytics and loyalty, one after another.',
        'Each new "when an order is placed, also do X" request adds another import and another call to the most business-critical class in the shop.',
      ],
      code: { lang: 'ts', src: `async place(cart: Cart) {
  const order = await this.orders.save(cart);
  await this.mailer.sendReceipt(order);
  await this.inventory.reserve(order);
  await this.analytics.track('order_placed', order);
  await this.loyalty.award(order);
  return order;
}` },
      done: 0,
    },
    {
      label: 'One fails', tag: 'problem',
      title: 'Analytics times out, and checkout fails with it',
      flows: [['order', 'email', { bend: -30, n: 1 }], ['order', 'stock', { bend: -10, n: 1 }], ['order', 'analytics', { n: 3, tone: 'bad', stall: 0.85 }]],
      state: { analytics: 'bad', order: 'warn' },
      metrics: { latency: '30 s timeout', blast: 'checkout fails' },
      body: [
        'The analytics vendor has a bad afternoon. Its call hangs until the timeout, and the thrown error bubbles up through `place()`.',
        'Customers cannot buy anything, because of a system that only counts purchases. The order was even saved, so a retry now creates a duplicate.',
      ],
      callout: { type: 'warn', text: 'Every direct call is a dependency on that system\'s uptime and speed. Non-essential work should not sit on the critical path.' },
      done: 1,
    },
    {
      label: 'Subject', tag: 'solution',
      title: 'Announce the event; let listeners subscribe',
      add: ['bus'],
      edges: [['order', 'bus', { label: 'emit' }], ['bus', 'email', { dash: true }], ['bus', 'stock', { dash: true }], ['bus', 'analytics', { dash: true }], ['bus', 'loyalty', { dash: true }]],
      flows: [['order', 'bus', { n: 2 }], ['bus', 'email', { n: 1 }], ['bus', 'stock', { n: 1, delay: 0.2 }], ['bus', 'analytics', { n: 1, delay: 0.4 }], ['bus', 'loyalty', { n: 1, delay: 0.6 }]],
      state: { bus: 'hl' },
      metrics: { deps: '1 subject', add: 'nothing' },
      body: [
        '`OrderService` now emits one fact: **an order was placed**. Each interested module registers itself with `OrderEvents` at startup.',
        'The order code no longer imports the mailer or analytics. New listeners plug in without anyone editing checkout.',
      ],
      code: { lang: 'ts', src: `type Listener = (e: OrderPlaced) => Promise<void>;

class OrderEvents {
  private listeners: Listener[] = [];
  subscribe(l: Listener) {
    this.listeners.push(l);
    return () => { this.listeners = this.listeners.filter(x => x !== l); };
  }
  async emit(e: OrderPlaced) {
    for (const l of this.listeners) await l(e); // still in series!
  }
}` },
      callout: { type: 'key', text: 'Observer: a subject keeps a list of observers and notifies them of changes, without knowing their concrete types.' },
      done: 2,
    },
    {
      label: 'Still coupled', tag: 'tradeoff',
      title: 'Decoupled code, but still the same call stack',
      flows: [['order', 'bus', { n: 2 }], ['bus', 'analytics', { n: 3, tone: 'bad', stall: 0.85 }]],
      state: { analytics: 'bad', bus: 'warn' },
      metrics: { latency: '30 s timeout', blast: 'checkout fails' },
      body: [
        'Look closely at `emit`. It still awaits each listener in turn, inside the checkout request. A slow or throwing listener is just as harmful as before.',
        'The Observer pattern removes the **compile-time** dependency. It does not, by itself, remove the **runtime** one.',
      ],
      callout: { type: 'warn', text: 'This is the most common misunderstanding of Observer and of in-process event emitters in general.' },
      done: 3,
    },
    {
      label: 'Isolate', tag: 'solution',
      title: 'Isolate each listener and take it off the hot path',
      flows: [['order', 'bus', { n: 2, dur: 0.9 }], ['bus', 'email', { n: 1 }], ['bus', 'stock', { n: 1 }], ['bus', 'analytics', { n: 2, tone: 'bad', stall: 0.85 }], ['bus', 'loyalty', { n: 1 }]],
      state: { analytics: 'bad', bus: 'ok', order: 'ok' },
      metrics: { latency: '180 ms', blast: 'only analytics' },
      body: [
        'Emit after the order commits, run listeners concurrently, catch each one\'s errors, and do not make checkout wait for non-essential work.',
        'For work that must survive a crash (like the receipt), write the event to a durable queue in the same transaction as the order (the "outbox" pattern) and process it in the background.',
      ],
      code: { lang: 'ts', src: `emit(e: OrderPlaced) {
  for (const l of this.listeners) {
    queueMicrotask(() =>
      l(e).catch(err => log.error({ err, listener: l.name })));
  }
}` },
      changes: [['~', 'Checkout no longer waits for listeners'], ['~', 'One failing listener only affects itself']],
      done: 4,
    },
    {
      label: 'New listener', tag: 'case',
      title: 'Fraud checks plug in without touching checkout',
      add: ['fraud'],
      edges: [['order', 'bus', { label: 'emit' }], ['bus', 'email', { dash: true }], ['bus', 'stock', { dash: true }], ['bus', 'analytics', { dash: true }], ['bus', 'loyalty', { dash: true }], ['bus', 'fraud', { dash: true, tone: 'ok' }]],
      flows: [['order', 'bus', { n: 2 }], ['bus', 'fraud', { n: 2, tone: 'ok' }], ['bus', 'email', { n: 1 }]],
      state: { fraud: 'ok', analytics: '' },
      metrics: { blast: '—', add: 'nothing' },
      body: [
        'The risk team writes a listener and registers it. The order code, its tests and its reviewers are not involved.',
      ],
      done: 4,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: announce facts, isolate reactions',
      flows: [],
      state: {},
      body: [
        '**Observer** removes compile-time coupling between the thing that changes and the things that react.',
        '**It is synchronous by default.** Isolate listeners and move slow work off the request path.',
        '**Costs:** control flow becomes harder to trace, listener order is not a contract, and forgotten unsubscriptions leak memory.',
        '**Across services**, the same idea becomes publish/subscribe over a message broker.',
      ],
      done: 5,
    },
  ],
};

export const decorator = {
  slug: 'decorator',
  title: 'Wrap, Don\'t Inherit',
  short: 'Decorator',
  minutes: 9,
  level: 'Intermediate',
  promise: 'Add logging, retries and caching to an HTTP client by stacking small wrappers, not by multiplying subclasses.',
  learn: [
    'Why inheritance explodes when features combine',
    'Decorators: same interface, extra behaviour',
    'Stacking wrappers, and why the order matters',
  ],
  metrics: [
    { key: 'classes', label: 'Classes to write' },
    { key: 'latency', label: 'Typical call' },
    { key: 'calls', label: 'Network calls' },
  ],
  nodes: {
    app: { x: 80, y: 230, label: 'App', icon: 'code', kind: 'svc', w: 112 },
    log: { x: 230, y: 230, label: 'Logging', sub: 'wrapper', icon: 'file', kind: 'class', w: 128 },
    retry: { x: 380, y: 230, label: 'Retry', sub: 'wrapper', icon: 'replay', kind: 'class', w: 128 },
    cache: { x: 530, y: 230, label: 'Cache', sub: 'wrapper', icon: 'layers', kind: 'class', w: 128 },
    http: { x: 690, y: 230, label: 'FetchClient', sub: 'real HTTP', icon: 'cloud', kind: 'class', w: 150 },
    explode: { x: 380, y: 85, label: 'LoggingRetryingCachingClient,\nRetryingCachingClient, LoggingCachingClient, …', kind: 'note', w: 420, h: 58 },
    order: { x: 380, y: 385, label: 'Cache outside Retry: a hit skips retries.\nRetry outside Cache: retries a cache read.', kind: 'note', w: 400, h: 58 },
  },
  steps: [
    {
      label: 'Base client', tag: 'idea',
      title: 'A plain HTTP client',
      add: ['app', 'http'],
      edges: [['app', 'http', { label: 'get(url)' }]],
      flows: [['app', 'http', { n: 2 }]],
      metrics: { classes: '1', latency: '120 ms', calls: '1 per get' },
      body: [
        '`FetchClient` implements `HttpClient` with a single method: `get(url)`. Now product wants logging, security wants retries with backoff, and performance wants caching.',
      ],
      code: { lang: 'ts', src: `interface HttpClient {
  get(url: string): Promise<Response>;
}` },
      done: 0,
    },
    {
      label: 'Subclass explosion', tag: 'problem',
      title: 'Three optional features, eight combinations',
      add: ['explode'],
      edges: [['app', 'http', { label: 'get(url)' }]],
      state: { explode: 'bad' },
      metrics: { classes: '8' },
      body: [
        'With inheritance, each combination is its own subclass. Three independent features give 2³ = 8 classes. Add a fourth (auth) and you have 16.',
        'Worse, the behaviour is fixed at compile time. You cannot turn caching off for one call site without yet another class.',
      ],
      callout: { type: 'warn', text: 'When features combine freely, inheritance multiplies classes. Composition adds them.' },
      done: 1,
    },
    {
      label: 'One wrapper', tag: 'solution',
      title: 'A wrapper that is also an HttpClient',
      remove: ['explode'],
      add: ['retry'],
      edges: [['app', 'retry'], ['retry', 'http']],
      flows: [['app', 'retry', { n: 2 }], ['retry', 'http', { n: 2, delay: 0.3 }]],
      state: { retry: 'hl' },
      metrics: { classes: '2' },
      body: [
        '`RetryingClient` implements `HttpClient` and holds another `HttpClient` inside. It forwards each call, and retries it on a transient failure.',
        'The app cannot tell the difference: it still just calls `get`. That is the Decorator pattern.',
      ],
      code: { lang: 'ts', src: `class RetryingClient implements HttpClient {
  constructor(private inner: HttpClient, private tries = 3) {}
  async get(url: string) {
    for (let i = 1; ; i++) {
      try { return await this.inner.get(url); }
      catch (e) {
        if (i >= this.tries || !isTransient(e)) throw e;
        await sleep(100 * 2 ** i); // exponential backoff
      }
    }
  }
}` },
      done: 2,
    },
    {
      label: 'Stack them', tag: 'solution',
      title: 'Compose any combination at startup',
      add: ['log', 'cache'],
      edges: [['app', 'log'], ['log', 'retry'], ['retry', 'cache'], ['cache', 'http']],
      flows: [['app', 'log', { n: 1 }], ['log', 'retry', { n: 1, delay: 0.2 }], ['retry', 'cache', { n: 1, delay: 0.4 }], ['cache', 'http', { n: 1, delay: 0.6 }]],
      state: { log: 'ok', retry: 'ok', cache: 'ok' },
      metrics: { classes: '4' },
      body: [
        'Each feature is one small class. The combination is decided where you build the client, and different parts of the app can get different stacks.',
      ],
      code: { lang: 'ts', src: `const client: HttpClient =
  new LoggingClient(
    new RetryingClient(
      new CachingClient(new FetchClient(), { ttl: 60 })));` },
      changes: [['+', 'LoggingClient, CachingClient'], ['~', '4 classes instead of 8, and 5 instead of 16 with auth']],
      done: 3,
    },
    {
      label: 'Cache hit', tag: 'case',
      title: 'A cache hit never reaches the network',
      flows: [['app', 'log', { n: 1 }], ['log', 'retry', { n: 1, delay: 0.2 }], ['retry', 'cache', { n: 1, delay: 0.4, tone: 'ok' }]],
      state: { cache: 'hl', http: 'dim' },
      metrics: { latency: '0.3 ms', calls: '0' },
      body: [
        'The cache wrapper answers from memory and returns. The request still flows through logging, so you still get a log line for it.',
      ],
      done: 3,
    },
    {
      label: 'Order matters', tag: 'tradeoff',
      title: 'The same wrappers in a different order behave differently',
      add: ['order'],
      flows: [],
      state: { order: 'warn' },
      metrics: { latency: '120 ms', calls: '1 per miss' },
      body: [
        'Put `Retry` inside `Logging` and you log one line per call. Put it outside and you log one line per attempt. Put `Cache` outside `Retry` and a hit skips retries entirely.',
        'Decorators also make stack traces deeper and can hide behaviour from someone reading the call site. Name them clearly and build the stack in one place.',
      ],
      callout: { type: 'tip', text: 'Middleware in Express, Koa or ASP.NET, and interceptors in gRPC, are decorators arranged as a pipeline.' },
      done: 3,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: compose behaviour',
      remove: ['order'],
      state: {},
      body: [
        '**Decorator:** an object that implements an interface by wrapping another object of the same interface.',
        '**Use it** for cross-cutting features that combine freely: logging, retries, caching, auth, metrics.',
        '**Watch** the order of the stack, and keep each wrapper focused on one job.',
      ],
      done: 3,
    },
  ],
};
