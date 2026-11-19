// Module 6: Architecture, lesson format 2: definition, Basics + Intermediate, scenes, checks.
// Diagram steps (add/edges/flows/state) are drawn by src/mapscene.js at the places in each lesson's `map`;
// steps with `scene` use src/content/scenes/architecture.js.
import { scenes } from './scenes/architecture.js';

const tile = (k, v, sub, tone) => ({ k, v, sub, tone });

// ---------------------------------------------------------------------------------------------
export const hexagonal = {
  format: 2,
  slug: 'hexagonal',
  title: 'Ports and Adapters',
  short: 'Hexagonal Architecture',
  minutes: 15,
  level: 'Beginner → Intermediate',
  promise: 'Put the business rules in the middle, and push web frameworks, databases and vendors to the edge, behind plugs you can swap.',
  definition: {
    sentence: '**Hexagonal architecture** (also called **ports and adapters**) keeps the business rules in a core that depends on nothing outside it. The outside world connects through interfaces the core defines, called **ports**, and small translators that implement them, called **adapters**.',
    more: 'Alistair Cockburn described it in 2005. The hexagon has no meaning of its own: it just leaves room to draw several ports around the core.',
    analogy: { title: 'Think of a laptop and travel adapters', text: 'The laptop has one plug shape of its own. In each country you buy a cheap adapter for the wall socket. Nobody rewires the laptop to travel.' },
    mini: '**Ports and adapters:** the core defines interfaces (ports); adapters connect the outside world to them.',
  },
  learn: [
    'See how framework and vendor code leaks into business rules.',
    'Name the core, its ports and its adapters, and which way each import points.',
    'Test the core without a database and swap a vendor by writing one adapter.',
    'Judge when the extra structure pays for itself.',
  ],
  metrics: [
    { key: 'imports', label: 'Vendor imports in core' },
    { key: 'test', label: 'Core test run' },
    { key: 'swap', label: 'Change payment provider' },
  ],
  scenes,
  terms: {
    port: ['Port', 'an interface owned by the core, written in the core\'s own words: what it offers (inbound) or what it needs (outbound).'],
    adapter: ['Adapter', 'a small piece of code that translates between one outside technology (HTTP, SQL, a vendor SDK) and a port.'],
    root: ['Composition root', 'the one place, usually at start-up, where concrete adapters are created and plugged into the core.'],
  },
  map: {
    nodes: {
      rest: [56, 60, 100], queue: [56, 150, 100], tests: [56, 240, 100],
      inPort: [180, 150, 96], core: [300, 150, 108],
      ordersPort: [300, 48, 104], payPort: [300, 252, 104],
      pg: [426, 48, 96], mem: [426, 116, 96], payB: [426, 184, 96], payA: [426, 252, 96],
    },
  },
  nodes: {
    rest: { x: 85, y: 140, label: 'REST API', sub: 'driving', icon: 'cloud', kind: 'svc', w: 140 },
    queue: { x: 85, y: 330, label: 'Queue', sub: 'driving', icon: 'queue', kind: 'svc', w: 140 },
    tests: { x: 85, y: 235, label: 'Core tests', sub: 'driving', icon: 'test', kind: 'test', w: 140 },
    inPort: { x: 265, y: 235, label: 'PlaceOrder', sub: 'in port', icon: 'plug', kind: 'iface', w: 140 },
    core: { x: 410, y: 235, label: 'Core', sub: 'order rules', icon: 'cpu', kind: 'core', w: 150 },
    ordersPort: { x: 560, y: 140, label: 'Orders', sub: 'out port', icon: 'plug', kind: 'iface', w: 130 },
    payPort: { x: 560, y: 330, label: 'Payments', sub: 'out port', icon: 'plug', kind: 'iface', w: 130 },
    pg: { x: 730, y: 140, label: 'Postgres', sub: 'driven', icon: 'db', kind: 'store', w: 120 },
    mem: { x: 730, y: 235, label: 'In-memory', sub: 'for tests', icon: 'box', kind: 'double', w: 120 },
    payA: { x: 730, y: 330, label: 'PayCo', sub: 'driven', icon: 'card', kind: 'store', w: 120 },
    payB: { x: 730, y: 420, label: 'PayNow', sub: 'new adapter', icon: 'card', kind: 'store', w: 120 },
  },
  steps: [
    {
      lvl: 'basics', label: 'Leaky', title: 'Business rules that know about HTTP and SQL', done: 0,
      say: 'A shop\'s order service started small. Today it reads the HTTP request, talks to the database through the ORM, and calls the payment vendor\'s SDK directly.',
      add: ['rest', 'core', 'pg', 'payA'],
      set: { core: { label: 'OrderService', sub: 'does everything' } },
      edges: [['rest', 'core'], ['core', 'pg'], ['core', 'payA']],
      flows: [['rest', 'core', { n: 2 }], ['core', 'pg', { n: 1 }], ['core', 'payA', { n: 1, delay: 0.4 }]],
      state: { core: 'bad' },
      metrics: { imports: '10 files', test: 'needs DB + sandbox', swap: 'weeks' },
      blocks: [
        { lang: 'ts', code: `import { Request } from 'express';
import { prisma } from '../db';
import { PayCo } from 'payco-sdk';

export async function placeOrder(req: Request) {
  const items = req.body.items;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal > 500 ? subtotal * 0.95 : subtotal;   // business rule
  const charge = await PayCo.charges.create({ amount: total });
  return prisma.order.create({ data: { items, chargeId: charge.id } });
}` },
        { p: 'The 5% discount rule sits next to an HTTP object, an ORM call and a vendor call. To test the discount, you need all three.' },
        { callout: 'illus', title: 'About the numbers', text: 'Counts and timings in this lesson are illustrative.' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: the vendor changes its SDK', scene: 'hexRipple', done: 1,
      say: 'PayCo ships version 3 of its SDK and renames its charge types.',
      check: {
        type: 'predict', q: 'Which files have to change?',
        opts: [{ t: 'One file: the payment code' }, { t: 'A few files, all in one folder' }, { t: 'Files in every folder, including pricing rules' }],
        fb: ['There is no single "payment code" file yet: the SDK types are imported wherever a charge is touched.', 'The SDK was never kept in one folder. Pricing and email code use its types too.', ''],
        ans: 2, why: 'With no boundary, a vendor\'s types spread wherever money is handled. A change outside your control now edits your pricing rules. The fix is to give the vendor exactly one place to live.',
      },
    },
    {
      lvl: 'basics', label: 'Core', title: 'Put the rules in the middle, depending on nothing', done: 1,
      say: 'Pull the business rules out into plain code. The core knows what an order is and when it gets a discount. It has never heard of Express, SQL or PayCo.',
      remove: ['rest', 'pg', 'payA'],
      set: { core: { label: 'Core', sub: 'order rules' } },
      edges: [], flows: [],
      state: { core: 'ok' },
      metrics: { imports: '0' },
      blocks: [
        { lang: 'ts', code: `// core/order.ts: no imports from frameworks or vendors
export class Order {
  constructor(readonly id: OrderId, readonly lines: Line[]) {}
  total(): Money { return sum(this.lines.map((l) => l.price.times(l.qty))); }
  discount(): Money { return this.total().gt(500) ? this.total().times(0.05) : Money.zero; }
}` },
        { p: 'This is ordinary code you can run and test anywhere. Everything else in the system is a detail that will plug into it.' },
      ],
    },
    {
      lvl: 'basics', label: 'Ports', title: 'Ports: the core\'s own interfaces', done: 2,
      say: 'The core declares what it offers, placing an order, and what it needs from the world: somewhere to keep orders, and a way to take payment.',
      add: ['inPort', 'ordersPort', 'payPort'],
      edges: [['inPort', 'core'], ['core', 'ordersPort'], ['core', 'payPort']],
      flows: [['inPort', 'core', { n: 1 }], ['core', 'ordersPort', { n: 1, delay: 0.3 }], ['core', 'payPort', { n: 1, delay: 0.6 }]],
      state: { inPort: 'hl', ordersPort: 'hl', payPort: 'hl', core: '' },
      blocks: [
        { lang: 'ts', code: `// core/ports.ts
export interface PlaceOrder { execute(cmd: PlaceOrderCmd): Promise<OrderId>; } // inbound
export interface Orders { save(o: Order): Promise<void>; }                      // outbound
export interface Payments { charge(o: Order, amount: Money): Promise<ChargeRef>; } // outbound` },
        { p: 'An inbound [[port|port]] is a use case the application offers. Outbound ports are needs. They speak the core\'s language: `charge(order, amount)`, not `PayCo.charges.create`.' },
      ],
    },
    {
      lvl: 'basics', label: 'Adapters', title: 'Adapters plug the world into the ports', done: 2,
      say: 'A REST controller and a queue consumer both call PlaceOrder. A Postgres class implements Orders. A PayCo class implements Payments, and it is the only file that imports the SDK.',
      add: ['rest', 'queue', 'pg', 'payA'],
      edges: [['rest', 'inPort'], ['queue', 'inPort'], ['inPort', 'core'], ['core', 'ordersPort'], ['core', 'payPort'], ['pg', 'ordersPort', { dash: true, tone: 'ok' }], ['payA', 'payPort', { dash: true, tone: 'ok' }]],
      flows: [['rest', 'inPort', { n: 1 }], ['queue', 'inPort', { n: 1, delay: 0.5 }], ['core', 'payPort', { n: 1, delay: 0.8 }]],
      state: { rest: 'ok', queue: 'ok', pg: 'ok', payA: 'ok' },
      metrics: { imports: '0', swap: 'one adapter' },
      blocks: [
        { lang: 'ts', code: `// adapters/paycoPayments.ts: the one place PayCo appears
import { PayCo } from 'payco-sdk';
import type { Order, Money } from '../core/order';
import type { Payments } from '../core/ports';

export class PayCoPayments implements Payments {
  constructor(private readonly key: string) {}

  async charge(o: Order, amount: Money) {
    const c = await PayCo.charges.create({ amount: amount.cents, ref: o.id }, { apiKey: this.key });
    return { id: c.id };
  }
}` },
        { p: '**Driving** [[adapter|adapters]] (left) call into the core. **Driven** adapters (right) are called by it, through its ports. Adding a CLI or a GraphQL endpoint is a new driving adapter, not a change to the core.' },
      ],
    },
    {
      lvl: 'basics', label: 'Direction', title: 'Calls flow out; imports point in', scene: 'hexArrows', done: 2,
      say: 'At run time the core calls the PayCo adapter. In the source code, the arrow points the other way: the adapter imports the core\'s port, and the core imports nothing.',
      read: { tiles: [tile('Core imports', '0', 'no vendors, no frameworks', 'ok'), tile('Adapter imports', 'port + SDK'), tile('Run-time call', 'core → adapter')] },
      blocks: [
        { p: 'This is the Dependency Inversion Principle applied to the whole application: high-level rules own the interface, low-level details implement it.' },
        { callout: 'key', title: 'One rule to check', text: 'Every import that crosses the core\'s boundary points inward. A lint rule can enforce it: files in `core/` may not import from `adapters/` or any framework package.' },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 2,
      say: 'Where is the vendor allowed to appear?',
      check: {
        type: 'choice', q: 'Which file may import `payco-sdk`?',
        opts: [
          { t: '`core/order.ts`, because orders get paid', hint: 'The core imports nothing from outside. That is what lets it be tested and kept for years.' },
          { t: '`core/ports.ts`, so the port can return PayCo types', hint: 'Ports are written in the core\'s words. Returning a vendor type would leak the vendor straight back in.' },
          { t: '`adapters/paycoPayments.ts`' },
          { t: 'The REST controller, so it can charge the card early', hint: 'Then the payment rule moves out of the core into an HTTP handler, and the queue consumer would need its own copy.' },
        ],
        ans: 2, why: 'Only the driven adapter knows PayCo exists. It translates the core\'s `charge(order, amount)` into the SDK call and the SDK\'s reply back into a `ChargeRef`.',
      },
    },
    {
      lvl: 'intermediate', label: 'Fast tests', title: 'Test the core in milliseconds', done: 3,
      say: 'Tests are just another driving adapter. Give the core an in-memory Orders and a fake Payments, and hundreds of business scenarios run without a database or a sandbox.',
      add: ['tests', 'mem'],
      edges: [['rest', 'inPort', { tone: 'muted' }], ['queue', 'inPort', { tone: 'muted' }], ['tests', 'inPort', { tone: 'accent' }], ['inPort', 'core'], ['core', 'ordersPort'], ['core', 'payPort'],
        ['pg', 'ordersPort', { dash: true, tone: 'muted' }], ['mem', 'ordersPort', { dash: true, tone: 'ok' }], ['payA', 'payPort', { dash: true, tone: 'muted' }]],
      flows: [['tests', 'inPort', { n: 2, dur: 0.8 }], ['inPort', 'core', { n: 2, dur: 0.8 }], ['core', 'ordersPort', { n: 1, dur: 0.8 }]],
      state: { tests: 'hl', mem: 'ok', rest: '', queue: '', pg: '', payA: '' },
      metrics: { test: '~1 s, no infra' },
      blocks: [
        { lang: 'ts', code: `test('orders over 500 get 5% off', async () => {
  const orders = new InMemoryOrders();
  const place = new PlaceOrderService(orders, new FakePayments());
  const id = await place.execute({ lines: [line('B1', 300, 2)] });
  expect((await orders.byId(id)).discount()).toEqual(money(30));
});` },
        { p: 'Keep the fake honest with **contract tests**: one shared test suite that runs against `InMemoryOrders` and `PostgresOrders` alike. If the fake drifts from the real thing, that suite goes red.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Predict', title: 'Predict: switching to a new provider', done: 3,
      say: 'The business signs with a cheaper provider, PayNow. Its SDK looks nothing like PayCo\'s.',
      edges: [['rest', 'inPort'], ['queue', 'inPort'], ['tests', 'inPort', { tone: 'muted' }], ['inPort', 'core'], ['core', 'ordersPort'], ['core', 'payPort'],
        ['pg', 'ordersPort', { dash: true, tone: 'ok' }], ['mem', 'ordersPort', { dash: true, tone: 'muted' }], ['payA', 'payPort', { dash: true, tone: 'ok' }]],
      flows: [['core', 'payPort', { n: 2 }]],
      state: { payPort: 'hl', payA: '', tests: '', mem: '' },
      check: {
        type: 'predict', q: 'What has to change to go live with PayNow?',
        opts: [{ t: 'The core and the Payments port' }, { t: 'A new adapter, plus one line where adapters are wired up' }, { t: 'Every caller of `charge`' }],
        fb: ['The port says "charge this order this amount". That need did not change, so neither does the port.', '', 'Callers talk to the port, not to PayCo. They cannot tell which adapter is plugged in.'],
        ans: 1, why: 'Write `PayNowPayments implements Payments`, run the shared payments contract tests against it, and change the wiring. Nothing in the core moves.',
      },
    },
    {
      lvl: 'intermediate', label: 'Wiring', title: 'One place plugs it all together', done: 3,
      say: 'Somebody has to choose which adapter goes into which port. That happens once, at start-up, in the composition root.',
      add: ['payB'],
      remove: ['tests', 'mem'],
      edges: [['rest', 'inPort'], ['queue', 'inPort'], ['inPort', 'core'], ['core', 'ordersPort'], ['core', 'payPort'],
        ['pg', 'ordersPort', { dash: true, tone: 'ok' }], ['payA', 'payPort', { dash: true, tone: 'muted' }], ['payB', 'payPort', { dash: true, tone: 'ok' }]],
      flows: [],
      state: { payB: 'hl', payA: '', pg: 'ok', payPort: '' },
      metrics: { swap: 'one adapter' },
      blocks: [
        { lang: 'ts', code: `// main.ts: the composition root
const orders = new PostgresOrders(pool);
const payments = config.provider === 'paynow'
  ? new PayNowPayments(config.paynowKey)
  : new PayCoPayments(config.paycoKey);
const placeOrder = new PlaceOrderService(orders, payments);
startHttp(placeOrder);
startConsumer(placeOrder);` },
        { p: 'The [[root|composition root]] is the only file that knows every concrete class. Because the choice is a config value, you can switch providers, or switch back, with a config change and a restart. The core is not touched.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'The price', title: 'Three shapes of one order', scene: 'hexMapping', done: 4,
      say: 'The HTTP body, the domain Order and the database row are different types now, and adapters translate between them. That is the cost of the structure.',
      read: { tiles: [tile('Types per order', '3', 'JSON, Order, row'), tile('Mapping code', 'in adapters', 'more to write'), tile('Core changes', 'rare', 'for vendor moves', 'ok')] },
      blocks: [
        { p: 'More interfaces, more mapping and more files. For a thin service that mostly moves rows to JSON and back, that is overhead with little reward.' },
        { callout: 'key', title: 'When it pays', text: 'Rich business rules, a system expected to live for years, or vendors and frameworks you may replace. Many teams start with just one port, around the riskiest vendor, and add more as needed.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'Sort each piece of code into the part of the hexagon it belongs to.',
      check: {
        type: 'match', q: 'Where does each piece belong?', bins: ['Core', 'Port', 'Adapter'],
        bugs: [
          { t: 'Refunds are allowed within 30 days of delivery', a: 0, why: 'A business rule: it belongs in the core, in plain code.', hint: 'Would this rule still exist if you changed every technology?' },
          { t: '`interface Payments { refund(o: Order): Promise<void> }`', a: 1, why: 'An interface in the core\'s words, describing what the core needs.', hint: 'Is it a promise of behaviour, with no implementation?' },
          { t: 'Turn PayCo error `card_declined` into `PaymentDeclined`', a: 2, why: 'Translating a vendor\'s vocabulary into the core\'s is exactly what a driven adapter does.', hint: 'Does it mention a specific vendor?' },
          { t: 'Express handler for `POST /orders`', a: 2, why: 'A driving adapter: it turns an HTTP request into a `PlaceOrder` command.', hint: 'Which side knows about HTTP?' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: the business in the middle', done: 4,
      say: 'Rules in the core, interfaces owned by the core, and adapters at the edge that you can test around and swap.',
      edges: [['rest', 'inPort'], ['queue', 'inPort'], ['inPort', 'core'], ['core', 'ordersPort'], ['core', 'payPort'], ['pg', 'ordersPort', { dash: true, tone: 'ok' }], ['payB', 'payPort', { dash: true, tone: 'ok' }]],
      state: {},
      metrics: { imports: '0', test: '~1 s, no infra', swap: 'one adapter' },
      blocks: [
        { ul: [
          '**Core:** business rules with no framework, database or vendor imports.',
          '**Ports:** interfaces the core owns, inbound (use cases) and outbound (needs).',
          '**Adapters:** translate between one technology and a port; driving adapters call in, driven adapters are called.',
          '**Imports point in;** calls flow out. The composition root wires it together.',
          '**Use it** where the domain is rich and long-lived; skip it for thin CRUD.',
        ] },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
export const services = {
  format: 2,
  slug: 'monolith-to-services',
  title: 'Splitting the Monolith',
  short: 'Monolith → Microservices',
  minutes: 16,
  level: 'Beginner → Intermediate',
  promise: 'When one deployable becomes the bottleneck, how to carve out a service safely, and what the network will charge you for it.',
  definition: {
    sentence: 'A **monolith** is one application deployed as a single unit. **Microservices** split a system into small services that each deploy on their own, own their data, and talk over the network.',
    more: 'Neither is better in general. A monolith is simpler to build, test and run. Services buy independence for teams, at the price of everything a network brings.',
    analogy: { title: 'Think of one restaurant kitchen', text: 'One kitchen with one pass is fast and easy to run. Six food trucks can each change their menu any day, but now orders travel by phone, and phones drop calls.' },
    mini: '**Monolith vs services:** one deploy and in-process calls, or independent deploys joined by network calls.',
  },
  learn: [
    'Explain why a modular monolith is a good default.',
    'Tell real reasons to split (teams, deploys, scaling, isolation) from bad ones.',
    'Extract a service step by step with the strangler fig.',
    'Handle the network tax: timeouts, idempotency keys and the outbox.',
  ],
  metrics: [
    { key: 'deploys', label: 'Deployables' },
    { key: 'release', label: 'Payments release' },
    { key: 'hops', label: 'Network hops per order' },
  ],
  scenes,
  terms: {
    strangler: ['Strangler fig', 'replace a system piece by piece: route one feature at a time to new code until the old code can be deleted. Named by Martin Fowler after the strangler fig, which grows around a host tree.'],
    idempotent: ['Idempotent', 'doing it twice has the same effect as doing it once.'],
    outbox: ['Transactional outbox', 'write an event to an outbox table in the same database transaction as the change; a separate relay publishes it afterwards.'],
  },
  map: {
    nodes: {
      client: [44, 150, 76], router: [132, 150, 84],
      catalog: [262, 40, 116], accounts: [262, 113, 116], orders: [262, 186, 116], payments: [262, 260, 116],
      db: [418, 186, 108], paydb: [418, 260, 108], paysvc: [262, 260, 116],
    },
  },
  nodes: {
    client: { x: 75, y: 230, label: 'Clients', icon: 'users', kind: 'actor', w: 116 },
    router: { x: 195, y: 230, label: 'Router', icon: 'arrows', kind: 'svc', w: 104 },
    catalog: { x: 400, y: 90, label: 'Catalog', icon: 'layers', kind: 'module', w: 150 },
    orders: { x: 400, y: 180, label: 'Orders', icon: 'file', kind: 'module', w: 150 },
    accounts: { x: 400, y: 270, label: 'Accounts', icon: 'user', kind: 'module', w: 150 },
    payments: { x: 400, y: 365, label: 'Payments', icon: 'card', kind: 'module', w: 150 },
    db: { x: 655, y: 140, label: 'Shared DB', icon: 'db', kind: 'store', w: 140 },
    paydb: { x: 752, y: 265, label: 'Pay DB', icon: 'db', kind: 'store', w: 86 },
    paysvc: { x: 640, y: 365, label: 'Payments', sub: 'own service', icon: 'card', kind: 'svc', w: 150 },
  },
  steps: [
    {
      lvl: 'basics', label: 'Monolith', title: 'One codebase, one deploy, one database', done: 1,
      say: 'The shop runs as one application. When Orders needs a payment, it calls a function in the Payments module, inside the same process and the same database transaction.',
      add: ['client', 'router', 'catalog', 'orders', 'accounts', 'payments', 'db'],
      edges: [['client', 'router'], ['router', 'orders'], ['orders', 'payments', { bend: -30 }], ['orders', 'db'], ['payments', 'db']],
      flows: [['client', 'router', { n: 2 }], ['router', 'orders', { n: 2 }], ['orders', 'db', { n: 1 }]],
      metrics: { deploys: '1', release: 'with everything', hops: '0' },
      blocks: [
        { lang: 'ts', code: `await db.transaction(async (tx) => {
  const order = await orders.create(tx, cart);
  await payments.charge(tx, order);   // a function call
});                                   // both commit, or neither does` },
        { p: 'A function call is fast, type-checked and either returns or throws. For a new product and a small team, this is usually the right choice: the simplest thing to build, test, deploy and debug.' },
        { callout: 'illus', title: 'About the numbers', text: 'Team sizes, counts and timings in this lesson are illustrative.' },
      ],
    },
    {
      lvl: 'basics', label: 'Growing pains', title: 'Six teams, one release train', scene: 'svcTrain', done: 1,
      say: 'The company grows to six teams. Payments must ship a tax fix today, but the weekly release is blocked by a failing Catalog test that Payments does not own.',
      read: { tiles: [tile('Teams', '6', 'one deploy'), tile('Release', 'weekly', 'blocked', 'bad'), tile('VAT fix', 'waiting', 'due today', 'bad')] },
      blocks: [
        { p: 'Payments also needs stricter security controls for card data than the rest of the code, and it scales differently on sale days. These are the pains that make teams look at splitting.' },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 2,
      say: 'Not every pain is a reason to add a network.',
      check: {
        type: 'choice', q: 'Which is a good reason to split Payments into its own service?',
        opts: [
          { t: 'The codebase passed 200,000 lines', hint: 'Size alone is not a reason. A large monolith with clean modules can work well.' },
          { t: 'Payments must deploy on its own schedule and needs stricter isolation for card data' },
          { t: 'Microservices are what modern teams use', hint: 'Fashion pays none of the costs you are about to take on.' },
          { t: 'To make Orders → Payments calls faster', hint: 'A network call is slower than a function call, not faster.' },
        ],
        ans: 1, why: 'Good reasons are about independence: separate deploys, separate scaling, or isolation for security and compliance. Those are organisational and operational, not about code size.',
      },
    },
    {
      lvl: 'basics', label: 'Modules first', title: 'Draw the boundary inside the monolith first', done: 2,
      say: 'Before adding a network, make Payments a real module: others call only its public interface, it owns its tables, and nobody else reads them directly.',
      edges: [['client', 'router'], ['router', 'orders'], ['orders', 'payments', { bend: -30, tone: 'ok' }], ['orders', 'db'], ['payments', 'db', { tone: 'ok' }]],
      state: { payments: 'hl' },
      blocks: [
        { lang: 'js', code: `// eslint config: only the public entry point may be imported
'no-restricted-imports': ['error', { patterns: [{
  group: ['**/payments/internal/*'],
  message: 'Use payments/index.ts, the public API.',
}] }]` },
        { p: 'If you cannot get the boundary right inside one process, a network will not fix it. It only makes mistakes slower to find and harder to undo. This shape is often called a **modular monolith**.' },
      ],
    },
    {
      lvl: 'basics', label: 'Strangler fig', title: 'Move one route at a time', scene: 'svcStrangler', done: 3,
      say: 'Build the Payments service beside the monolith. Point the router at it one route at a time, watch each move, and delete the old module when nothing calls it.',
      read: { tiles: [tile('Big-bang rewrite', 'none'), tile('Each move', 'reversible', 'flip the route back', 'ok'), tile('Old module', 'deleted last')] },
      blocks: [
        { p: 'This is the [[strangler|strangler fig]] pattern. The new system grows around the old one until the old part can be cut away, and every step is small enough to roll back.' },
      ],
    },
    {
      lvl: 'basics', label: 'Extracted', title: 'Payments has its own deploy and its own data', done: 3,
      say: 'Payments now runs as its own service with its own database. It deploys daily, on its own schedule. Orders reaches it over HTTP, and the router sends /payments/* straight to it.',
      add: ['paysvc', 'paydb'],
      remove: ['payments'],
      edges: [['client', 'router'], ['router', 'orders'], ['router', 'paysvc', { bend: 30, tone: 'accent' }], ['orders', 'paysvc', { tone: 'warn' }], ['orders', 'db'], ['paysvc', 'paydb']],
      flows: [['router', 'paysvc', { bend: 30, n: 1 }], ['orders', 'paysvc', { n: 2, tone: 'warn' }], ['paysvc', 'paydb', { n: 1 }]],
      state: { paysvc: 'ok' },
      metrics: { deploys: '2', release: 'daily, on its own', hops: '1' },
      blocks: [
        { p: 'Moving the data is usually the hardest part: copy it, keep both copies in sync while callers move, then cut over. Until Payments owns its data alone, the two are still coupled through the database.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Predict', title: 'Predict: the charge timed out', done: 3,
      say: 'Orders calls Payments to charge 120 euros. After 3 seconds the call times out. The customer is still waiting.',
      edges: [['client', 'router'], ['router', 'orders'], ['orders', 'paysvc', { tone: 'bad', dash: true }], ['orders', 'db'], ['paysvc', 'paydb']],
      flows: [['orders', 'paysvc', { n: 2, tone: 'bad', stall: 0.7 }]],
      state: { orders: 'warn', paysvc: 'warn' },
      check: {
        type: 'predict', q: 'Was the card charged?',
        opts: [{ t: 'No, the call failed' }, { t: 'Yes, timeouts only happen after the work is done' }, { t: 'You cannot tell from Orders' }],
        fb: ['The request may have arrived and been processed. Only the reply may have been lost.', 'The request may also have been lost on the way, or Payments may still be working on it.', ''],
        ans: 2, why: 'A timeout means "no answer yet", not "failed". Retrying blindly risks charging twice; not retrying risks never charging. The fix is to make the retry safe.',
      },
    },
    {
      lvl: 'intermediate', label: 'Network', title: 'A function call became a network call', scene: 'svcOutcomes', done: 3,
      say: 'A function call returns or throws. A network call can also be slow, or never answer. In the worst case, Payments charged the card and the reply was lost: that is the timeout you just predicted.',
      read: { tiles: [tile('Outcomes', '4', 'not 2'), tile('Timeout', 'unknown', 'charged or not?', 'bad'), tile('Shared transaction', 'gone', '', 'bad')] },
      blocks: [
        { p: 'Every remote call now needs a timeout, a decision about retries, and often a circuit breaker so a struggling service is not hammered further.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Idempotency', title: 'Make the retry safe with an idempotency key', done: 4,
      say: 'Orders sends a unique key with the charge and reuses it on every retry. Payments stores the key with the result, and a repeat returns the stored result instead of charging again.',
      edges: [['client', 'router'], ['router', 'orders'], ['orders', 'paysvc', { tone: 'ok' }], ['orders', 'db'], ['paysvc', 'paydb']],
      flows: [['orders', 'paysvc', { n: 2, tone: 'ok' }], ['paysvc', 'paydb', { n: 1, delay: 0.3 }]],
      state: { orders: 'ok', paysvc: 'ok' },
      blocks: [
        { lang: 'text', code: `POST /charges
Idempotency-Key: "order-8812-charge"
{ "orderId": "8812", "amount": 12000, "currency": "EUR" }

# retry after a timeout: same key, same body
# 200 OK  { "chargeId": "ch_51", "replayed": true }` },
        { p: 'Now "retry until you get an answer" is safe, because the operation is [[idempotent|idempotent]]. Many payment APIs accept a header like this, and there is an IETF draft that standardises it. The same key with a different body should be rejected, and retries still need backoff and a limit.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Outbox', title: 'No shared transaction: use an outbox', scene: 'svcOutbox', done: 4,
      say: 'Saving the order and telling Payments used to be one transaction. Now write the order and an "order placed" event in one local transaction, and let a relay publish the event.',
      read: { tiles: [tile('Order + event', 'atomic', 'one local commit', 'ok'), tile('Delivery', 'at least once'), tile('Consumer', 'idempotent', 'must be', 'bad')] },
      blocks: [
        { p: 'Without the [[outbox|outbox]], code that saves the order and then publishes can crash in between, and the event is lost. With it, the event is stored with the order and the relay retries until it is published.' },
        { p: 'A business process that spans services, such as "reserve stock, charge card, ship", becomes a **saga**: a series of local steps, each with a compensating step (refund, release stock) if a later one fails.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'The tax', title: 'What every new service costs', done: 4,
      say: 'Each service needs its own pipeline, dashboards, alerts, on-call and versioned API. Debugging one order now means following it across processes.',
      edges: [['client', 'router'], ['router', 'orders'], ['router', 'paysvc', { bend: 30, tone: 'accent' }], ['orders', 'paysvc', { tone: 'ok' }], ['orders', 'db'], ['paysvc', 'paydb']],
      flows: [['router', 'orders', { n: 1 }], ['orders', 'paysvc', { n: 1, delay: 0.4 }], ['paysvc', 'paydb', { n: 1, delay: 0.8 }]],
      state: {},
      read: { tiles: [tile('Tracing', 'needed', 'one ID across calls'), tile('Pipelines', '2', 'and growing'), tile('On-call', 'per service')] },
      blocks: [
        { p: 'Distributed tracing passes one trace ID through every call (the W3C `traceparent` header is the common format), so you can see where an order slowed down.' },
        { callout: 'warn', title: 'The distributed monolith', text: 'If services must be deployed together to work, or share one database schema, you have paid every cost of services and gained none of the independence.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'Decide what each situation calls for.',
      check: {
        type: 'match', q: 'Keep it a module, or extract a service?', bins: ['Keep as a module', 'Extract a service'],
        bugs: [
          { t: 'Search needs ten times the servers during sales, the rest does not', a: 1, why: 'Very different scaling needs are a real reason to run it separately.', hint: 'Does it need to scale on its own?' },
          { t: 'Two modules that change together in almost every pull request', a: 0, why: 'They are one concept split in two. A network between them would mean coordinated deploys: a distributed monolith.', hint: 'Could they ever deploy on their own?' },
          { t: 'A team of four owns the whole product', a: 0, why: 'There is no team to make independent. Services would add operations work with nobody to benefit.', hint: 'Whose independence would it buy?' },
          { t: 'Card data handling needs its own audited, locked-down environment', a: 1, why: 'Isolation for security or compliance is a strong reason: it keeps the audited scope small.', hint: 'Does it need to be fenced off from the rest?' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: split for independence, not fashion', done: 4,
      say: 'Start with a modular monolith. Split when teams, deploys, scaling or isolation demand it, move one route at a time, and pay the network tax on purpose.',
      edges: [['client', 'router'], ['router', 'orders'], ['router', 'paysvc', { bend: 30, tone: 'accent' }], ['orders', 'paysvc', { tone: 'ok' }], ['orders', 'db'], ['paysvc', 'paydb']],
      flows: [],
      state: {},
      metrics: { deploys: '2', release: 'daily, on its own', hops: '1' },
      blocks: [
        { ul: [
          '**Start** with a monolith that has hard module boundaries.',
          '**Split** for independent deploys, scaling or isolation, not for size.',
          '**Strangler fig:** route one feature at a time to the new service; delete the old code last.',
          '**Network calls** can time out with an unknown result: use timeouts, idempotency keys and retries.',
          '**No shared transaction:** use an outbox and sagas, and make consumers idempotent.',
        ] },
      ],
    },
  ],
};
