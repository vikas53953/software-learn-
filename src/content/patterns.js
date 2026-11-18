// Module 2: Design patterns, lesson format 2: definition, Basics + Intermediate, scenes, checks.
// Diagram steps (add/edges/flows/state) are drawn by src/mapscene.js at the places in each lesson's `map`;
// steps with `scene` use src/content/scenes/patterns.js.
import { scenes } from './scenes/patterns.js';

const tile = (k, v, sub, tone) => ({ k, v, sub, tone });

// ---------------------------------------------------------------------------------------------
export const observer = {
  format: 2,
  slug: 'observer',
  title: 'Tell, Don\'t Call',
  short: 'Observer',
  minutes: 18,
  level: 'Beginner → Intermediate',
  promise: 'Let an order announce what happened, and let anyone who cares react, without the order knowing who they are.',
  definition: {
    sentence: 'The Observer pattern lets one object (the **subject**) announce that something happened, while any number of other objects (**observers**) subscribe and react, without the subject knowing who they are.',
    more: 'It is one of the 23 patterns in the 1994 "Gang of Four" book, Design Patterns. Event emitters, DOM event listeners and publish/subscribe messaging are all versions of the same idea.',
    analogy: { title: 'Think of a newsletter', text: 'The writer sends one issue to a mailing list. Readers subscribe and unsubscribe on their own. The writer never needs to know who is reading, or what each reader does with it.' },
    mini: '**Observer:** a subject announces events; subscribers react; the subject does not know who they are.',
  },
  learn: [
    'Explain the cost of calling every interested system directly from core code.',
    'Use Observer: one subject, many subscribers, no imports between them.',
    'Know that in-process observers run synchronously by default, and take listeners off the hot path safely.',
    'Decide what should be an observer and what must stay a direct call.',
  ],
  metrics: [
    { key: 'deps', label: 'OrderService depends on' },
    { key: 'latency', label: 'Checkout latency' },
    { key: 'blast', label: 'If analytics is down' },
    { key: 'add', label: 'Adding a listener edits' },
  ],
  scenes,
  terms: {
    subject: ['Subject', 'the object that announces events and keeps the list of subscribers.'],
    observer: ['Observer', 'an object or function that subscribes to a subject and reacts when it is told something happened.'],
    hot: ['Hot path', 'the code a user is waiting on, such as the checkout request. Anything slow or fragile here hurts every customer.'],
    outbox: ['Outbox pattern', 'saving an event to a table in the same database transaction as the change it describes, then publishing it from there in the background.'],
    idempotent: ['Idempotent', 'safe to run more than once: doing it twice has the same effect as doing it once.'],
    pubsub: ['Publish/subscribe', 'the same idea across services: publishers send messages to a broker, and subscribers receive them without knowing the publisher.'],
  },
  map: {
    nodes: {
      order: [60, 150, 100], bus: [214, 150, 112],
      email: [400, 30, 120], stock: [400, 90, 120], analytics: [400, 150, 120], loyalty: [400, 210, 120], fraud: [400, 270, 120],
    },
  },
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
      lvl: 'basics', label: 'Direct calls', title: 'Placing an order calls four other systems', done: 0,
      say: 'After saving an order, OrderService calls the mailer, inventory, analytics and loyalty, one after another.',
      add: ['order', 'email', 'stock', 'analytics', 'loyalty'],
      edges: [['order', 'email', { bend: -30 }], ['order', 'stock', { bend: -10 }], ['order', 'analytics', { bend: 0 }], ['order', 'loyalty', { bend: 10 }]],
      flows: [['order', 'email', { bend: -30, n: 1 }], ['order', 'stock', { bend: -10, n: 1, delay: 0.25 }], ['order', 'analytics', { n: 1, delay: 0.5 }], ['order', 'loyalty', { bend: 10, n: 1, delay: 0.75 }]],
      metrics: { deps: '4 services', latency: '620 ms', blast: '—', add: 'OrderService' },
      blocks: [
        { lang: 'ts', code: `async place(cart: Cart) {
  const order = await this.orders.save(cart);
  await this.mailer.sendReceipt(order);
  await this.inventory.reserve(order);
  await this.analytics.track('order_placed', order);
  await this.loyalty.award(order);
  return order;
}` },
        { p: 'Every new "when an order is placed, also do X" request adds another import and another call to the most important class in the shop.' },
        { callout: 'illus', title: 'About the numbers', text: 'Latencies in this lesson are illustrative.' },
      ],
    },
    {
      lvl: 'basics', label: 'One fails', title: 'Analytics hangs, and checkout fails with it', done: 1,
      say: 'The analytics vendor has a bad afternoon. Its call hangs until it times out, and the error bubbles up through checkout.',
      flows: [['order', 'email', { bend: -30, n: 1 }], ['order', 'stock', { bend: -10, n: 1 }], ['order', 'analytics', { n: 3, tone: 'bad', stall: 0.85 }]],
      state: { analytics: 'bad', order: 'warn' },
      metrics: { latency: '30 s timeout', blast: 'checkout fails' },
      blocks: [
        { p: 'Customers cannot buy anything, because of a system that only **counts** purchases. Worse, the order was already saved, so when the customer retries, they may end up with a duplicate order.' },
        { callout: 'warn', title: 'Why it hurts', text: 'Every direct call ties checkout to that system\'s uptime and speed. Work the customer is not waiting for should not sit on the [[hot|hot path]].' },
      ],
    },
    {
      lvl: 'basics', label: 'Watch it', title: 'One slow system holds up everyone', scene: 'obsSync', done: 1,
      say: 'Each call waits for the one before. Email and inventory finish quickly, then analytics hangs, and checkout never gets its answer.',
      read: { tiles: [tile('Email + inventory', '200 ms', 'fine'), tile('Analytics', '30 s', 'then timeout', 'bad'), tile('Checkout', 'fails', 'customer sees an error', 'bad')] },
      blocks: [
        { p: 'Calls made with `await`, one after another, add up. One hanging dependency makes the whole request hang, and anything after it never runs: no loyalty points either.' },
      ],
    },
    {
      lvl: 'basics', label: 'Subject', title: 'Announce the event; let listeners subscribe', done: 2,
      say: 'Now OrderService just announces one fact: an order was placed. Each interested part subscribes to that announcement at startup.',
      add: ['bus'],
      edges: [['order', 'bus', { label: 'emit' }], ['bus', 'email', { dash: true }], ['bus', 'stock', { dash: true }], ['bus', 'analytics', { dash: true }], ['bus', 'loyalty', { dash: true }]],
      flows: [['order', 'bus', { n: 2 }], ['bus', 'email', { n: 1 }], ['bus', 'stock', { n: 1, delay: 0.2 }], ['bus', 'analytics', { n: 1, delay: 0.4 }], ['bus', 'loyalty', { n: 1, delay: 0.6 }]],
      state: { bus: 'hl' },
      metrics: { deps: '1 subject', add: 'nothing', latency: '—', blast: '—' },
      blocks: [
        { lang: 'ts', code: `type Listener = (e: OrderPlaced) => Promise<void>;

class OrderEvents {
  private listeners: Listener[] = [];

  subscribe(l: Listener) {
    this.listeners.push(l);
    return () => { this.listeners = this.listeners.filter(x => x !== l); };
  }

  async emit(e: OrderPlaced) {
    for (const l of this.listeners) await l(e);
  }
}

// at startup
events.subscribe(e => mailer.sendReceipt(e.order));
events.subscribe(e => analytics.track('order_placed', e.order));` },
        { p: '`OrderEvents` is the [[subject|subject]]; each subscribed function is an [[observer|observer]]. The order code no longer imports the mailer or analytics.' },
        { callout: 'key', title: 'The pattern', text: 'A subject keeps a list of observers and notifies them when something happens, without knowing what they are.' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: is checkout safe now?', done: 2,
      say: 'Think back to emit() in the previous step\'s code. If analytics hangs again, what happens to checkout?',
      check: {
        type: 'predict', q: 'Checkout now calls events.emit(), which loops over the listeners with await. Analytics hangs again. What happens?',
        opts: [{ t: 'Checkout is fine: it no longer calls analytics' }, { t: 'Checkout still hangs and fails' }, { t: 'Only the analytics listener fails' }], ans: 1,
        fb: ['That is the common trap: ', '', 'Not with this emit(): '],
        why: 'emit() still awaits each listener in turn, inside the checkout request. Checkout no longer imports analytics, but it still waits for it at run time.',
      },
    },
    {
      lvl: 'basics', label: 'Still coupled', title: 'Decoupled code, same call stack', done: 2,
      say: 'Observer removed the import. It did not remove the wait. The slow listener still runs inside the customer\'s request.',
      flows: [['order', 'bus', { n: 2 }], ['bus', 'analytics', { n: 3, tone: 'bad', stall: 0.85 }]],
      state: { analytics: 'bad', bus: 'warn' },
      metrics: { latency: '30 s timeout', blast: 'checkout fails' },
      blocks: [
        { table: { head: ['Kind of coupling', 'Removed by Observer?'], rows: [
          ['Compile time: OrderService imports Analytics', 'Yes'],
          ['Run time: checkout waits for Analytics', 'No, not with this emit()'],
          ['Failure: an Analytics error fails checkout', 'No, not with this emit()'],
        ] } },
        { callout: 'warn', title: 'Common misunderstanding', text: 'In-process events, such as Node\'s `EventEmitter`, call listeners synchronously, in the order they subscribed. "Event" does not mean "background". One difference from the `emit()` above: `EventEmitter` does not await async listeners, so a rejected promise becomes an unhandled rejection rather than a failed checkout.' },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 2,
      say: 'Your turn. What does the Observer pattern actually remove?',
      check: {
        type: 'choice', q: 'What does the Observer pattern, on its own, remove?',
        opts: [
          { t: 'The subject\'s compile-time dependency on its observers' },
          { t: 'Any chance that a slow observer slows the subject down', hint: 'Only if the subject stops waiting for observers. A plain emit loop still waits.' },
          { t: 'The need to handle errors from observers', hint: 'An observer that throws still throws, unless something catches it.' },
        ],
        ans: 0, why: 'The subject only knows "a list of listeners", not the mailer or analytics, so they can change or be added without editing it. Speed and failure isolation need extra work, which comes next.',
      },
    },
    {
      lvl: 'intermediate', label: 'Isolate', title: 'Take listeners off the hot path', scene: 'obsAsync', done: 3,
      say: 'Let emit hand the event off and return. Run listeners side by side, catch each one\'s errors, and the customer gets their answer straight away.',
      read: { tiles: [tile('Checkout', '180 ms', 'no waiting', 'good'), tile('Listeners', 'in parallel', 'checkout does not wait'), tile('Analytics fails', 'logged', 'nothing else hit')] },
      blocks: [
        { lang: 'ts', code: `emit(e: OrderPlaced) {
  for (const l of this.listeners) {
    // run later; one listener's error stays with it
    setImmediate(async () => {
      try { await l(e); }
      catch (err) { log.error({ err, event: e.type }); }
    });
  }
}` },
        { p: 'Two rules: **emit only after the order is committed**, so listeners never react to an order that was rolled back; and **catch per listener**, so one failure stays contained.' },
        { callout: 'warn', title: 'The catch', text: 'This runs in memory. If the server restarts after the order is saved but before the email is sent, the email is lost. Fine for analytics, not for receipts.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Outbox', title: 'Events that must not be lost', scene: 'obsOutbox', done: 3,
      read: { tiles: [tile('Saved with', 'the order', 'same transaction', 'good'), tile('Delivery', 'at least once', 'never exactly once'), tile('Crash after COMMIT', 'no loss', 'worker retries', 'good')] },
      say: 'For events that must survive a crash, save the event in the same database transaction as the order. A background worker publishes it afterwards.',
      flows: [['order', 'bus', { n: 2, dur: 0.9 }], ['bus', 'email', { n: 1 }], ['bus', 'stock', { n: 1 }], ['bus', 'analytics', { n: 2, tone: 'bad', stall: 0.85 }], ['bus', 'loyalty', { n: 1 }]],
      state: { analytics: 'bad', bus: 'ok', order: 'ok' },
      metrics: { latency: '180 ms', blast: 'only analytics' },
      blocks: [
        { lang: 'sql', code: `BEGIN;
INSERT INTO orders (id, customer_id, total_cents) VALUES ($1, $2, $3);
INSERT INTO outbox (event_id, type, payload)
  VALUES (gen_random_uuid(), 'OrderPlaced', $4);
COMMIT;
-- a worker reads unsent outbox rows, publishes them, then marks them sent` },
        { p: 'Either both rows are saved or neither is. That is the [[outbox|outbox pattern]]: no lost events, and no events for orders that never happened.' },
        { p: 'If the worker crashes after publishing but before marking a row as sent, it publishes that event again on restart. So delivery is **at least once**, never "exactly once".' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Twice', title: 'Make every listener safe to run twice', scene: 'obsIdem', done: 3,
      read: { tiles: [tile('Deliveries', '2', 'same event id'), tile('Points awarded', '+10', 'once', 'good'), tile('Guard', 'unique key', 'on event_id')] },
      say: 'If an event can arrive twice, a listener must not award loyalty points twice. Record which events you have already handled.',
      blocks: [
        { lang: 'ts', code: `async function awardPoints(e: OrderPlaced) {
  // the unique key on event_id makes the second attempt a no-op
  const inserted = await db.query(
    'INSERT INTO handled_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING',
    [e.eventId]);
  if (inserted.rowCount === 0) return; // already handled
  await loyalty.award(e.customerId, e.points);
}` },
        { p: 'A listener built like this is [[idempotent|idempotent]]. For full safety, run the insert and the award in one transaction, so a crash between them cannot lose the award.' },
        { callout: 'tip', title: 'Natural idempotency', text: 'Some actions are already safe twice: "set status to shipped" is; "add 10 points" is not. Prefer the first kind where you can.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Hidden costs', title: 'What Observer makes harder', done: 3,
      say: 'Observer trades a visible list of calls for an invisible one. Know the costs before you reach for it.',
      blocks: [
        { table: { head: ['Cost', 'What it looks like', 'What helps'], rows: [
          ['Invisible flow', '"What happens when an order is placed?" has no single answer in the code', 'Register all listeners in one place; log each delivery'],
          ['Ordering', 'Loyalty assumes inventory already ran', 'Never rely on listener order; pass what is needed in the event'],
          ['Leaks', 'A screen subscribes on open and never unsubscribes', 'Always keep and call the unsubscribe function'],
          ['Debugging', 'A stack trace starts in the event loop, not in checkout', 'Include an event id and the order id in every log line'],
        ] } },
        { callout: 'analogy', title: 'Across services', text: 'Between services the same idea is [[pubsub|publish/subscribe]] over a broker such as Kafka, RabbitMQ or a cloud queue, with the same costs, plus network failures.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'New listener', title: 'Fraud checks want to join. Should they?', done: 4,
      say: 'The risk team wants to react to orders. If they only need to flag orders for review, a listener is perfect. If they must block a payment, it is not.',
      add: ['fraud'],
      edges: [['order', 'bus', { label: 'emit' }], ['bus', 'email', { dash: true }], ['bus', 'stock', { dash: true }], ['bus', 'analytics', { dash: true }], ['bus', 'loyalty', { dash: true }], ['bus', 'fraud', { dash: true, tone: 'ok' }]],
      flows: [['order', 'bus', { n: 2 }], ['bus', 'fraud', { n: 2, tone: 'ok' }], ['bus', 'email', { n: 1 }]],
      state: { fraud: 'ok', analytics: '' },
      metrics: { blast: '—', add: 'nothing' },
      blocks: [
        { p: 'Adding a listener needs no change to checkout, its tests or its reviewers. That is the payoff.' },
        { p: 'But a listener reacts **after** the fact, and the subject ignores its answer. If fraud must be able to stop an order before the card is charged, it belongs in the checkout flow as a direct, awaited step.' },
        { callout: 'key', title: 'Rule of thumb', text: 'Notify observers about things that **already happened**. Call directly for things that must **decide** whether something happens.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'Sort these. Which reactions are fine as observers, and which must stay direct calls?',
      check: {
        type: 'match', q: 'For each piece of work, is it fine as an event listener, or must it stay a direct call in checkout?', bins: ['Listener is fine', 'Keep as a direct call'],
        bugs: [
          { t: 'Send the receipt email', a: 0, why: 'It reacts to an order that already exists, and can retry later. Use the outbox so it is not lost.', hint: 'Does checkout need its answer before replying?' },
          { t: 'Authorise the card payment', a: 1, why: 'Checkout cannot succeed without its answer. It must be called and awaited directly.', hint: 'Can the order succeed if this fails?' },
          { t: 'Record the sale in analytics', a: 0, why: 'Nobody is waiting for it, and losing one data point is not a disaster.', hint: 'Is anyone waiting on this?' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: announce facts, isolate reactions', done: 4,
      say: 'Observer removes imports, not waiting. Take listeners off the hot path, use an outbox for events that matter, make listeners idempotent, and keep decisions as direct calls.',
      flows: [], state: {},
      blocks: [
        { ul: [
          '**Observer** removes the compile-time link between the thing that changes and the things that react.',
          '**Synchronous by default:** isolate listeners and run them after the response.',
          '**Must not be lost?** Outbox in the same transaction, delivered at least once, so listeners must be idempotent.',
          '**Costs:** invisible flow, no ordering guarantees, leaks if you forget to unsubscribe.',
          '**Decisions stay direct calls;** observers react to facts.',
        ] },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
export const decorator = {
  format: 2,
  slug: 'decorator',
  title: 'Wrap, Don\'t Inherit',
  short: 'Decorator',
  minutes: 15,
  level: 'Beginner → Intermediate',
  promise: 'Add logging, retries and caching to an HTTP client by stacking small wrappers, not by multiplying subclasses.',
  definition: {
    sentence: 'The Decorator pattern adds behaviour to an object by **wrapping** it in another object with the **same interface**, so callers cannot tell the difference.',
    more: 'It is another of the Gang of Four patterns (1994). Each wrapper does one extra job, such as logging or retrying, and then passes the call on to the object inside.',
    analogy: { title: 'Think of a phone case', text: 'A case adds grip, a stand or a wallet, and you can stack or swap them. The phone inside is unchanged, and you still use it exactly the same way.' },
    mini: '**Decorator:** wrap an object in another with the same interface to add one job.',
  },
  learn: [
    'Explain why inheritance explodes when optional features combine.',
    'Write a decorator: same interface, wraps another object, adds one behaviour.',
    'Stack decorators and predict how their order changes behaviour.',
    'Tell decorators apart from proxies, adapters and middleware.',
  ],
  metrics: [
    { key: 'classes', label: 'Classes to write' },
    { key: 'latency', label: 'Typical call' },
    { key: 'calls', label: 'Network calls' },
  ],
  scenes,
  terms: {
    composition: ['Composition', 'building behaviour by putting objects inside other objects, instead of inheriting from a parent class.'],
    crosscutting: ['Cross-cutting concern', 'a job many parts of the code need, such as logging, retries, caching or auth, that has nothing to do with each part\'s main purpose.'],
    backoff: ['Exponential backoff', 'waiting longer before each retry (for example 200 ms, 400 ms, 800 ms) so a struggling server gets room to recover.'],
    transient: ['Transient error', 'a failure that may succeed if you simply try again, such as a timeout or a 503.'],
    middleware: ['Middleware', 'functions a web framework runs in order for each request. In Koa, each one can act before and after the rest of the chain.'],
  },
  map: {
    nodes: {
      app: [33, 150, 50], log: [124, 150, 72], retry: [222, 150, 64], cache: [316, 150, 64], http: [424, 150, 92],
      explode: [240, 50, 340], order: [240, 250, 320],
    },
  },
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
      lvl: 'basics', label: 'Base client', title: 'A plain HTTP client', done: 0,
      say: 'Our app fetches prices through a small HTTP client with one method, get. Now three teams each want something added to it.',
      add: ['app', 'http'],
      edges: [['app', 'http', { label: 'get(url)' }]],
      flows: [['app', 'http', { n: 2 }]],
      metrics: { classes: '1', latency: '120 ms', calls: '1 per get' },
      blocks: [
        { lang: 'ts', code: `interface HttpClient {
  get(url: string): Promise<Response>;
}

class FetchClient implements HttpClient {
  async get(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new HttpError(res.status); // fetch resolves on 4xx/5xx
    return res;
  }
}` },
        { p: 'Product wants **logging**. The platform team wants **retries** for flaky networks. Performance wants **caching**. Not every caller wants all three.' },
        { callout: 'illus', title: 'About the numbers', text: 'Latencies in this lesson are illustrative.' },
      ],
    },
    {
      lvl: 'basics', label: 'Subclasses', title: 'Three optional features, eight combinations', done: 1,
      say: 'With inheritance, every combination of features needs its own subclass. Three optional features means eight classes.',
      add: ['explode'],
      edges: [['app', 'http', { label: 'get(url)' }]],
      state: { explode: 'bad' },
      metrics: { classes: '8' },
      blocks: [
        { p: 'Each feature is either on or off, so three features give 2 × 2 × 2 = **8** combinations, each a separate class. Add a fourth (auth) and you need 16.' },
        { p: 'Worse, the choice is fixed when you write the class. You cannot turn caching off for one caller without yet another class.' },
        { callout: 'warn', title: 'Rule of thumb', text: 'When features combine freely, inheritance **multiplies** classes. [[composition|Composition]] **adds** them.' },
      ],
    },
    {
      lvl: 'basics', label: 'Count', title: 'Multiply versus add', scene: 'decCount', done: 1,
      say: 'Watch the count. Each new feature doubles the subclasses, but adds just one wrapper.',
      read: { tiles: [tile('3 features', '8 vs 4', 'classes: inheritance vs decorators'), tile('4 features', '16 vs 5', ''), tile('n features', '2ⁿ vs n + 1', '')] },
      blocks: [
        { p: 'With wrappers you write one class per feature, plus the real client. The combinations are built when the app starts, not written by hand.' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: five features', done: 1,
      say: 'Quick guess. Five optional features, all combinable. How many subclasses would inheritance need?',
      check: {
        type: 'predict', q: 'Five optional features that can be combined in any way: logging, retries, caching, auth and metrics. How many classes does the subclass approach need (counting the plain one)?',
        opts: [{ t: '10' }, { t: '25' }, { t: '32' }], ans: 2,
        fb: ['Higher: ', 'Close, but it doubles each time: ', ''],
        why: 'Each feature is on or off, so 2⁵ = 32 combinations. With decorators: five wrappers plus the real client, six classes.',
      },
    },
    {
      lvl: 'basics', label: 'One wrapper', title: 'A wrapper that is also an HttpClient', done: 2,
      say: 'RetryingClient implements HttpClient and holds another HttpClient inside. It passes each call on, and tries again if it fails briefly.',
      remove: ['explode'],
      add: ['retry'],
      edges: [['app', 'retry'], ['retry', 'http']],
      flows: [['app', 'retry', { n: 2 }], ['retry', 'http', { n: 2, delay: 0.3 }]],
      state: { retry: 'hl' },
      metrics: { classes: '2' },
      blocks: [
        { lang: 'ts', code: `class RetryingClient implements HttpClient {
  constructor(private inner: HttpClient, private tries = 3) {}

  async get(url: string) {
    for (let i = 1; ; i++) {
      try { return await this.inner.get(url); }
      catch (e) {
        if (i >= this.tries || !isTransient(e)) throw e;
        await sleep(100 * 2 ** i); // 200 ms, then 400 ms
      }
    }
  }
}` },
        { p: 'It retries only [[transient|transient errors]], waiting a little longer each time ([[backoff|exponential backoff]]). The app still just calls `get` and cannot tell it is wrapped.' },
        { callout: 'key', title: 'The pattern', text: 'Same interface as the thing it wraps, one extra job, then pass the call on.' },
      ],
    },
    {
      lvl: 'basics', label: 'Stack them', title: 'Build any combination at startup', done: 3,
      say: 'Each feature is one small class. You choose the combination where you build the client, and different callers can get different stacks.',
      add: ['log', 'cache'],
      edges: [['app', 'log'], ['log', 'retry'], ['retry', 'cache'], ['cache', 'http']],
      flows: [['app', 'log', { n: 1 }], ['log', 'retry', { n: 1, delay: 0.2 }], ['retry', 'cache', { n: 1, delay: 0.4 }], ['cache', 'http', { n: 1, delay: 0.6 }]],
      state: { log: 'ok', retry: 'ok', cache: 'ok' },
      metrics: { classes: '4' },
      blocks: [
        { lang: 'ts', code: `const prices: HttpClient =
  new LoggingClient(
    new RetryingClient(
      new CachingClient(new FetchClient(), { ttlSeconds: 60 })));

const payments: HttpClient =           // never cache payments
  new LoggingClient(new RetryingClient(new FetchClient()));` },
        { changes: [['+', 'LoggingClient, CachingClient'], ['~', '4 classes instead of 8, and 5 instead of 16 with auth']] },
      ],
    },
    {
      lvl: 'basics', label: 'Inside out', title: 'Follow a request through the layers', scene: 'decOnion', done: 3,
      say: 'A call passes through each wrapper on the way in, and back out through each on the way back. A cache hit turns back before reaching the network.',
      read: { tiles: [tile('Cache miss', '120 ms', '1 network call'), tile('Cache hit', '0.3 ms', '0 network calls', 'good'), tile('Logged', 'both', 'outermost layer')] },
      blocks: [
        { p: 'Think of the stack as layers of an onion. Logging is outermost, so it sees every call, hit or miss. The cache sits just outside the network, so a hit skips the network entirely.' },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 3,
      say: 'Your turn. Which of these classes is a decorator?',
      check: {
        type: 'choice', q: 'Which class is a decorator of `HttpClient`?',
        opts: [
          { t: '`TimingClient implements HttpClient`: holds an `HttpClient`, records how long each `get` takes, then returns its result' },
          { t: '`CachingFetchClient extends FetchClient`: overrides `get` to check a cache first', hint: 'That is inheritance: it is tied to one specific parent class and cannot wrap any other client.' },
          { t: '`PriceService`: holds an `HttpClient` and has a `getPrice(sku)` method', hint: 'It uses an `HttpClient`, but it does not offer the same interface, so it cannot stand in for one.' },
        ],
        ans: 0, why: 'Same interface as what it wraps, holds any `HttpClient` inside, adds one job, then passes the call on. That is a decorator.',
      },
    },
    {
      lvl: 'intermediate', label: 'Order matters', title: 'Same wrappers, different order, different behaviour', scene: 'decOrder', done: 3,
      read: { tiles: [tile('Logging outside', '1 line', 'per call'), tile('Retry outside', '3 lines', 'one per attempt'), tile('Attempts', '3', 'same in both')] },
      say: 'Decorators are not just a pile. The order you stack them in changes what happens.',
      add: ['order'],
      flows: [],
      state: { order: 'warn' },
      metrics: { latency: '120 ms', calls: '1 per miss' },
      blocks: [
        { table: { head: ['Stack (outside → inside)', 'What happens'], rows: [
          ['Logging → Retry → Fetch', 'One log line per call, however many attempts'],
          ['Retry → Logging → Fetch', 'One log line per **attempt**: you can see each retry'],
          ['Cache → Retry → Fetch', 'A cache hit never even enters the retry loop'],
          ['Retry → Cache → Fetch', 'Each retry checks the cache again first'],
        ] } },
        { p: 'Neither order is always right. Choose on purpose, build the stack in one place, and write a test for the behaviour you depend on.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 3,
      say: 'Use the order rules. How many log lines does this call produce?',
      check: {
        type: 'choice', q: 'The stack is Logging → Retry → Fetch. One `get` fails twice with a timeout, then succeeds on the third attempt. How many log lines does LoggingClient write?',
        opts: [
          { t: 'One' },
          { t: 'Three', hint: 'That would be true if Logging were inside Retry. Which layer does the retrying here?' },
          { t: 'None, because the call succeeded', hint: 'LoggingClient logs every call it sees, success or not.' },
        ],
        ans: 0, why: 'Logging is outermost, so it sees one call going in and one result coming out. The three attempts all happen inside RetryingClient.',
      },
    },
    {
      lvl: 'intermediate', label: 'Middleware', title: 'Decorators you already use', scene: 'decMiddleware', done: 4,
      read: { tiles: [tile('Layers', '3 + router', 'run in app.use() order'), tile('Over the limit', '429', 'auth never runs', 'bad'), tile('Logger', 'sees all', 'outermost layer', 'good')] },
      say: 'Koa middleware is the same idea arranged as a pipeline. Each layer awaits the rest of the chain, so it can act before and after it, like nested wrappers.',
      remove: ['order'],
      state: {},
      blocks: [
        { lang: 'ts', code: `// Koa: each app.use() wraps everything registered after it
app.use(requestLogger); // outermost: times every request
app.use(rateLimit);     // may answer 429 before auth runs
app.use(authenticate);
app.use(router.routes()); // GET /orders -> listOrders

async function requestLogger(ctx, next) {
  const start = Date.now();
  await next(); // the rest of the chain runs here
  log.info(ctx.method, ctx.url, ctx.status, Date.now() - start);
}` },
        { p: '[[middleware|Middleware]] in Koa and ASP.NET Core, and interceptors in gRPC, run in the order you register them and wrap what comes after, so the "order matters" rules apply.' },
        { callout: 'warn', title: 'Express is different', text: 'Express also runs middleware in registration order, but `next()` does not hand the response back. An Express logger sees the result by listening for `res.on(\'finish\')`.' },
        { callout: 'tip', title: 'Not the same as @decorators', text: 'The `@log` syntax in TypeScript and Python is a language feature that wraps a class or a class member when it is defined (in Python, any function). It is related, but the Decorator **pattern** wraps objects at run time and works in any language.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Look-alikes', title: 'Decorator, proxy and adapter', scene: 'decCompare', done: 4,
      read: { tiles: [tile('Decorator', 'same', 'interface; adds behaviour'), tile('Proxy', 'same', 'interface; controls access'), tile('Adapter', 'different', 'interface; translates')] },
      say: 'Three patterns all put one object in front of another. The difference is the job each one does.',
      blocks: [
        { table: { head: ['Pattern', 'Interface', 'Job', 'Example'], rows: [
          ['Decorator', 'Same as the inner object', 'Adds behaviour', 'RetryingClient, LoggingClient'],
          ['Proxy', 'Same as the inner object', 'Controls access to it', 'Lazy loading, permission checks, remote stubs'],
          ['Adapter', 'Different from the inner object', 'Translates one interface into another', 'Wrapping a vendor SDK to fit your `PaymentMethod`'],
        ] } },
        { p: 'Many classes mix these jobs. The names matter less than being able to say what each wrapper is for.' },
        { callout: 'warn', title: 'Costs', text: 'Deep stacks make stack traces longer and hide behaviour from someone reading the call site. Keep each wrapper to one [[crosscutting|cross-cutting concern]] and name it after that job.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: compose behaviour', done: 4,
      say: 'Wrap instead of subclassing when features combine. Each wrapper does one job, behind the same interface. Build the stack in one place and choose the order on purpose.',
      state: {},
      blocks: [
        { ul: [
          '**Decorator:** implements an interface by wrapping another object of the same interface, adding one job.',
          '**Why:** n features need n wrappers, not 2ⁿ subclasses, and the mix is chosen at startup.',
          '**Order matters:** what is outermost sees every call; what is innermost sees every attempt.',
          '**Everywhere:** middleware and interceptors are decorators arranged as a pipeline.',
          '**Look-alikes:** a proxy controls access; an adapter changes the interface.',
        ] },
      ],
    },
  ],
};
