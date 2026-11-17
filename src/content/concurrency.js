// Module 5: Concurrency

export const race = {
  slug: 'race-conditions',
  title: 'The Last Seat',
  short: 'Race Conditions',
  minutes: 12,
  level: 'Intermediate',
  promise: 'Two people book the last seat at the same moment. Watch "check, then act" go wrong, and three ways to fix it.',
  learn: [
    'Check-then-act and the lost update',
    'Why it passes every test and fails in production',
    'Mutual exclusion with a lock',
    'Atomic conditional updates in the database',
    'Optimistic concurrency with versions',
  ],
  metrics: [
    { key: 'seat', label: 'Seat 14C' },
    { key: 'confirmed', label: 'Confirmations sent' },
    { key: 'double', label: 'Double bookings' },
  ],
  nodes: {
    a: { x: 120, y: 110, label: 'Request A', sub: 'Asha books 14C', icon: 'thread', kind: 'thread', w: 160 },
    b: { x: 120, y: 350, label: 'Request B', sub: 'Ben books 14C', icon: 'thread', kind: 'thread', w: 160 },
    seat: { x: 560, y: 230, label: 'seats row 14C', sub: 'holder: null', icon: 'db', kind: 'store', w: 190, h: 64 },
    lock: { x: 340, y: 230, label: 'Lock', sub: 'seat:14C', icon: 'lock', kind: 'lock', w: 124 },
  },
  steps: [
    {
      label: 'Check, then act', tag: 'idea',
      title: 'The booking code looks obviously correct',
      add: ['a', 'seat'],
      edges: [['a', 'seat', { label: 'read, then write' }]],
      flows: [['a', 'seat', { n: 2 }]],
      metrics: { seat: 'free', confirmed: '0', double: '0' },
      body: [
        'Read the seat. If nobody holds it, write your name and send a confirmation. With one request at a time, this works every time.',
      ],
      code: { lang: 'ts', src: `async function book(seatId: string, user: string) {
  const seat = await db.one('SELECT holder FROM seats WHERE id=$1', [seatId]);
  if (seat.holder !== null) throw new SoldOut();
  await db.none('UPDATE seats SET holder=$1 WHERE id=$2', [user, seatId]);
  await sendConfirmation(user, seatId);
}` },
      done: 0,
    },
    {
      label: 'Both read', tag: 'problem',
      title: 'Two requests read "free" a millisecond apart',
      add: ['b'],
      edges: [['a', 'seat', { label: 'SELECT → free', tone: 'warn' }], ['b', 'seat', { label: 'SELECT → free', tone: 'warn' }]],
      flows: [['seat', 'a', { n: 1, tone: 'warn' }], ['seat', 'b', { n: 1, tone: 'warn' }]],
      state: { a: 'warn', b: 'warn' },
      body: [
        'Asha and Ben press "Book" at the same moment. Each request runs on its own thread or connection. Both `SELECT`s run before either `UPDATE`.',
        'Both see `holder: null`. Both pass the check. The check was true when it ran, and false by the time it mattered.',
      ],
      code: { lang: 'text', src: `t=0ms  A: SELECT holder → null
t=1ms  B: SELECT holder → null
t=3ms  A: UPDATE holder = 'asha'
t=4ms  B: UPDATE holder = 'ben'     ← overwrites A
t=6ms  A: email "You got 14C!"
t=7ms  B: email "You got 14C!"` },
      done: 1,
    },
    {
      label: 'Lost update', tag: 'problem',
      title: 'Two confirmations, one seat',
      set: { seat: { sub: 'holder: ben' } },
      edges: [['a', 'seat', { label: 'UPDATE asha', tone: 'bad' }], ['b', 'seat', { label: 'UPDATE ben', tone: 'bad' }]],
      flows: [['a', 'seat', { n: 1, tone: 'bad' }], ['b', 'seat', { n: 1, tone: 'bad', delay: 0.15 }]],
      state: { seat: 'bad', a: 'bad', b: 'warn' },
      metrics: { seat: 'ben', confirmed: '2', double: '1' },
      body: [
        'Ben\'s write silently replaces Asha\'s. Both got confirmation emails. Asha finds out at the gate.',
        'Ordinary tests rarely catch this, because they send one request at a time. It only appears under real concurrency, which is why it is called a **race condition**: the outcome depends on who wins the race.',
      ],
      callout: { type: 'key', text: 'Any time you read shared state, decide based on it, and then write, another actor can change it in between.' },
      done: 2,
    },
    {
      label: 'Lock', tag: 'solution',
      title: 'Option 1: one at a time, with a lock',
      add: ['lock'],
      set: { seat: { sub: 'holder: null' } },
      edges: [['a', 'lock', { label: 'acquired', tone: 'ok' }], ['b', 'lock', { label: 'waiting…', tone: 'warn', dash: true }], ['lock', 'seat']],
      flows: [['a', 'lock', { n: 1, tone: 'ok' }], ['lock', 'seat', { n: 1, tone: 'ok', delay: 0.3 }], ['b', 'lock', { n: 2, tone: 'warn', stall: 0.8 }]],
      state: { lock: 'hl', a: 'ok', b: 'warn', seat: '' },
      metrics: { seat: 'asha', confirmed: '1', double: '0' },
      body: [
        'Wrap the read-check-write in a critical section. In a single process, that is a mutex. Across servers, it can be a row lock (`SELECT ... FOR UPDATE` inside a transaction) or a distributed lock.',
        'Ben\'s request waits until Asha\'s finishes, then reads `holder: asha` and gets "sold out". Correct, but every booking for that seat is now serialised.',
      ],
      code: { lang: 'sql', src: `BEGIN;
SELECT holder FROM seats WHERE id = '14C' FOR UPDATE; -- B blocks here
UPDATE seats SET holder = 'asha' WHERE id = '14C';
COMMIT;` },
      done: 3,
    },
    {
      label: 'Atomic update', tag: 'solution',
      title: 'Option 2: make the check part of the write',
      remove: ['lock'],
      set: { seat: { sub: 'holder: asha' } },
      edges: [['a', 'seat', { label: '1 row updated', tone: 'ok' }], ['b', 'seat', { label: '0 rows → sold out', tone: 'warn' }]],
      flows: [['a', 'seat', { n: 1, tone: 'ok' }], ['b', 'seat', { n: 1, tone: 'warn', delay: 0.1 }]],
      state: { a: 'ok', b: '', seat: 'ok' },
      body: [
        'Put the condition in the `UPDATE` itself. The database applies each row update atomically, so only one request can change `holder` from null.',
        'Check the affected row count: 1 means you got it, 0 means someone else did. No explicit lock, no window, and it is usually the fastest fix.',
      ],
      code: { lang: 'sql', src: `UPDATE seats SET holder = $1
WHERE id = $2 AND holder IS NULL;   -- check and act in one step
-- rowCount = 1 → booked, 0 → sold out` },
      done: 4,
    },
    {
      label: 'Versions', tag: 'solution',
      title: 'Option 3: optimistic concurrency with a version',
      set: { seat: { sub: 'holder: asha · v8' } },
      edges: [['a', 'seat', { label: 'if v7 → v8 ✓', tone: 'ok' }], ['b', 'seat', { label: 'if v7 → conflict', tone: 'warn' }]],
      body: [
        'When the decision involves more than one field, keep a `version` column. Read it with the data, and write only if it has not changed: `UPDATE ... SET ..., version = 8 WHERE id = $1 AND version = 7`.',
        'If someone else got there first, you get 0 rows and can reload and retry or report a conflict. HTTP has the same idea with `ETag` and `If-Match`.',
      ],
      callout: { type: 'tip', text: 'Optimistic: assume conflicts are rare and detect them. Pessimistic: assume they are common and prevent them with locks.' },
      done: 5,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: close the gap between check and act',
      flows: [],
      state: {},
      body: [
        '**Race condition:** the result depends on timing between concurrent operations.',
        '**Lock** when you must serialise a multi-step operation; keep the critical section short.',
        '**Atomic conditional writes** are the simplest fix when the database can do the check.',
        '**Version numbers** detect conflicting updates without holding locks.',
      ],
      done: 5,
    },
  ],
};

export const deadlock = {
  slug: 'deadlocks',
  title: 'After You, No, After You',
  short: 'Deadlocks',
  minutes: 9,
  level: 'Advanced',
  promise: 'Two transfers lock two accounts in opposite order and wait for each other forever. See the cycle, then break it.',
  learn: [
    'How two locks taken in opposite orders form a cycle',
    'The four conditions every deadlock needs',
    'Prevention by consistent lock ordering',
    'Detection, timeouts and retries',
  ],
  metrics: [
    { key: 't1', label: 'Transfer 1' },
    { key: 't2', label: 'Transfer 2' },
    { key: 'done', label: 'Completed' },
  ],
  nodes: {
    t1: { x: 140, y: 120, label: 'Transfer 1', sub: 'acct 7 → acct 9', icon: 'thread', kind: 'thread', w: 170 },
    t2: { x: 140, y: 340, label: 'Transfer 2', sub: 'acct 9 → acct 7', icon: 'thread', kind: 'thread', w: 170 },
    l7: { x: 600, y: 120, label: 'Lock · account 7', icon: 'lock', kind: 'lock', w: 180 },
    l9: { x: 600, y: 340, label: 'Lock · account 9', icon: 'lock', kind: 'lock', w: 180 },
  },
  steps: [
    {
      label: 'Two transfers', tag: 'idea',
      title: 'Each transfer locks both accounts',
      add: ['t1', 't2', 'l7', 'l9'],
      metrics: { t1: 'starting', t2: 'starting', done: '0' },
      body: [
        'To move money safely, a transfer locks the source account, then the destination, so no one else changes either balance mid-transfer.',
        'Transfer 1 sends from 7 to 9. At the same moment, Transfer 2 sends from 9 to 7.',
      ],
      code: { lang: 'ts', src: `async function transfer(from: Account, to: Account, amt: number) {
  await from.lock.acquire();
  await to.lock.acquire();
  try { from.balance -= amt; to.balance += amt; }
  finally { to.lock.release(); from.lock.release(); }
}` },
      done: 0,
    },
    {
      label: 'First locks', tag: 'problem',
      title: 'Each takes its first lock',
      edges: [['t1', 'l7', { label: 'holds', tone: 'ok' }], ['t2', 'l9', { label: 'holds', tone: 'ok' }]],
      flows: [['t1', 'l7', { n: 1, tone: 'ok' }], ['t2', 'l9', { n: 1, tone: 'ok' }]],
      metrics: { t1: 'holds 7', t2: 'holds 9' },
      body: [
        'Transfer 1 locks account 7. Transfer 2 locks account 9. So far, so good.',
      ],
      done: 0,
    },
    {
      label: 'The cycle', tag: 'problem',
      title: 'Each waits for the lock the other holds',
      edges: [['t1', 'l7', { label: 'holds', tone: 'ok' }], ['t2', 'l9', { label: 'holds', tone: 'ok' }],
        ['t1', 'l9', { label: 'wants', tone: 'bad', dash: true, lx: -40, ly: -10 }], ['t2', 'l7', { label: 'wants', tone: 'bad', dash: true, lx: -40, ly: 18 }]],
      flows: [['t1', 'l9', { n: 2, tone: 'bad', stall: 0.75 }], ['t2', 'l7', { n: 2, tone: 'bad', stall: 0.75 }]],
      state: { t1: 'bad', t2: 'bad', l7: 'warn', l9: 'warn' },
      metrics: { t1: 'waiting for 9', t2: 'waiting for 7', done: '0' },
      body: [
        'Transfer 1 now asks for 9, held by Transfer 2. Transfer 2 asks for 7, held by Transfer 1. Neither will release what it holds until it gets what it wants.',
        'Both wait forever. CPU usage is zero, nothing logs an error, and requests pile up behind them.',
      ],
      callout: { type: 'key', text: 'A deadlock needs all four: mutual exclusion, hold and wait, no preemption, and a circular wait. Break any one and it cannot happen.' },
      done: 1,
    },
    {
      label: 'Order locks', tag: 'solution',
      title: 'Always lock in the same global order',
      edges: [['t1', 'l7', { label: '1st', tone: 'ok' }], ['t1', 'l9', { label: '2nd', tone: 'ok', lx: -40, ly: -10 }], ['t2', 'l7', { label: 'waits for 1st', tone: 'warn', dash: true, lx: -40, ly: 18 }]],
      flows: [['t1', 'l7', { n: 1, tone: 'ok' }], ['t1', 'l9', { n: 1, tone: 'ok', delay: 0.3 }], ['t2', 'l7', { n: 1, tone: 'warn', stall: 0.7 }]],
      state: { t1: 'ok', t2: 'warn', l7: '', l9: '' },
      metrics: { t1: 'done', t2: 'runs next', done: '2' },
      body: [
        'Lock the account with the lower ID first, whatever the transfer direction. Both transfers now ask for 7 first. Transfer 2 waits on 7 while holding nothing, so no cycle can form.',
        'Transfer 1 finishes and releases both. Transfer 2 then takes 7, then 9, and completes.',
      ],
      code: { lang: 'ts', src: `const [first, second] = from.id < to.id ? [from, to] : [to, from];
await first.lock.acquire();
await second.lock.acquire();` },
      done: 3,
    },
    {
      label: 'Detect & retry', tag: 'tradeoff',
      title: 'When you cannot control the order',
      flows: [],
      state: {},
      body: [
        'Sometimes the order is not known in advance. Then use `tryLock` with a timeout: if you cannot get the second lock, release the first, back off with jitter, and retry.',
        'Databases do this for you: Postgres and MySQL detect lock cycles and abort one transaction with a deadlock error. Your code must be ready to retry it.',
      ],
      callout: { type: 'warn', text: 'Retries without random jitter can make both sides retry in lock-step and collide again (a livelock).' },
      done: 4,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: no cycles, no deadlocks',
      body: [
        '**Cause:** locks taken in different orders by different threads.',
        '**Prevent** with one global lock order, or by locking everything up front.',
        '**Recover** with timeouts, jittered retries and database deadlock detection.',
        '**Simplest of all:** hold fewer locks, for less time.',
      ],
      done: 4,
    },
  ],
};

export const eventLoop = {
  slug: 'event-loop',
  title: 'One Thread, Many Tasks',
  short: 'The Event Loop',
  minutes: 12,
  level: 'Intermediate',
  promise: 'Predict the output of four lines of JavaScript, and learn why one slow loop freezes an entire server.',
  learn: [
    'The call stack runs one thing at a time',
    'Timers and I/O are handed off, not waited on',
    'Microtasks run before the next task',
    'Never block the loop',
  ],
  metrics: [
    { key: 'out', label: 'Console output' },
    { key: 'stack', label: 'Stack' },
    { key: 'p99', label: 'Server p99' },
  ],
  nodes: {
    stack: { x: 150, y: 230, label: 'Call stack', sub: 'one at a time', icon: 'layers', kind: 'svc', w: 170, h: 120 },
    apis: { x: 430, y: 85, label: 'Timers & I/O', sub: 'browser / libuv', icon: 'clock', kind: 'svc', w: 180 },
    micro: { x: 430, y: 245, label: 'Microtask queue', sub: 'promise callbacks', icon: 'queue', kind: 'queue', w: 190 },
    macro: { x: 430, y: 385, label: 'Task queue', sub: 'timers, I/O, events', icon: 'queue', kind: 'queue', w: 190 },
    loop: { x: 690, y: 245, label: 'Event loop', sub: 'stack empty?', icon: 'replay', kind: 'svc', w: 150, h: 62 },
  },
  steps: [
    {
      label: 'The puzzle', tag: 'idea',
      title: 'In what order do these lines print?',
      add: ['stack'],
      metrics: { out: '', stack: 'empty', p99: '—' },
      body: [
        'JavaScript runs your code on a single thread with one call stack. Yet it handles thousands of concurrent requests in Node.js. Here is a small puzzle to see how.',
        'Make a guess before stepping on.',
      ],
      code: { lang: 'js', src: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');` },
      done: 0,
    },
    {
      label: 'Sync first', tag: 'idea',
      title: 'Synchronous code runs to completion',
      add: ['apis', 'micro', 'macro'],
      set: { stack: { sub: 'running script' } },
      flows: [],
      state: { stack: 'hl' },
      metrics: { out: 'A D', stack: 'script' },
      body: [
        'The script itself is one task. `console.log(\'A\')` runs immediately. So does `console.log(\'D\')`. Nothing pre-empts running JavaScript: synchronous code runs until it returns.',
        'The other two lines do not run their callbacks now. They schedule them.',
      ],
      done: 1,
    },
    {
      label: 'setTimeout', tag: 'idea',
      title: 'setTimeout hands the callback to a timer',
      edges: [['stack', 'apis', { label: 'setTimeout(B, 0)' }], ['apis', 'macro', { label: 'after ≥ 0 ms', bend: -230 }]],
      flows: [['stack', 'apis', { n: 1 }], ['apis', 'macro', { n: 1, bend: -230, delay: 0.5 }]],
      set: { macro: { badge: 'B' } },
      state: { apis: 'hl' },
      body: [
        'The timer is managed outside your code. When it fires, its callback joins the **task queue** (also called the macrotask queue).',
        'Zero milliseconds means "as soon as possible", not "now". It still has to wait its turn in the queue.',
      ],
      done: 2,
    },
    {
      label: 'Promise', tag: 'idea',
      title: 'A resolved promise queues a microtask',
      edges: [['stack', 'micro', { label: '.then(C)' }]],
      flows: [['stack', 'micro', { n: 1 }]],
      set: { micro: { badge: 'C' } },
      state: { micro: 'hl' },
      metrics: { stack: 'script (ending)' },
      body: [
        'Promise callbacks go into a separate, higher-priority **microtask queue**. The script then finishes and the stack is empty.',
      ],
      done: 2,
    },
    {
      label: 'Microtasks', tag: 'solution',
      title: 'Empty stack: drain all microtasks first',
      add: ['loop'],
      set: { micro: { badge: '' }, stack: { sub: 'C callback' } },
      edges: [['loop', 'micro', { label: '1st', tone: 'ok' }], ['micro', 'stack', { tone: 'ok' }]],
      flows: [['micro', 'stack', { n: 1, tone: 'ok' }]],
      state: { micro: 'ok', loop: 'hl' },
      metrics: { out: 'A D C', stack: 'C' },
      body: [
        'After each task, the event loop runs **every** queued microtask, including any new ones they add, before moving on. So C prints next.',
      ],
      done: 3,
    },
    {
      label: 'Next task', tag: 'solution',
      title: 'Then take one task from the task queue',
      set: { macro: { badge: '' }, stack: { sub: 'B callback' } },
      edges: [['loop', 'macro', { label: '2nd', tone: 'accent' }], ['macro', 'stack', { tone: 'accent' }]],
      flows: [['macro', 'stack', { n: 1 }]],
      state: { macro: 'hl', loop: 'hl', micro: '' },
      metrics: { out: 'A D C B', stack: 'B' },
      body: [
        'Only then does the loop pick the next task: the timer callback. Final output: **A D C B**.',
        'In a browser, the page may also render between tasks. That is why a long task makes the page feel frozen.',
      ],
      done: 3,
    },
    {
      label: 'Blocking', tag: 'problem',
      title: 'One CPU-heavy request stalls every other request',
      set: { stack: { sub: 'hashing 50 MB file…' }, macro: { badge: '312', badgeTone: 'bad' } },
      edges: [['loop', 'macro', { dash: true, tone: 'bad', label: 'waiting' }], ['apis', 'macro', { bend: -230, tone: 'bad' }]],
      flows: [['apis', 'macro', { n: 4, bend: -230, tone: 'bad', stall: 0.85 }]],
      state: { stack: 'bad', macro: 'bad', loop: 'warn' },
      metrics: { stack: 'busy 2.1 s', p99: '2,300 ms' },
      body: [
        'In a Node.js server, one request runs a 2-second synchronous loop. While it runs, the stack is never empty, so the loop cannot deliver anything else. Health checks time out. 312 callbacks queue up.',
        'Async I/O is cheap because it waits outside the thread. CPU work does not: it holds the only thread.',
      ],
      done: 3,
    },
    {
      label: 'Offload', tag: 'solution',
      title: 'Move CPU work off the loop',
      set: { stack: { sub: 'fast handlers only' }, macro: { badge: '' }, apis: { label: 'Worker threads', sub: 'hashing, image work' } },
      edges: [['stack', 'apis', { label: 'post job', tone: 'ok' }], ['apis', 'macro', { label: 'result', bend: -230, tone: 'ok' }], ['loop', 'macro', { tone: 'ok' }]],
      flows: [['stack', 'apis', { n: 1, tone: 'ok' }], ['apis', 'macro', { n: 2, bend: -230, tone: 'ok' }], ['macro', 'stack', { n: 2 }]],
      state: { apis: 'ok', stack: 'ok' },
      metrics: { stack: 'free', p99: '45 ms' },
      body: [
        'Send heavy computation to a worker thread (or a separate job service) and get the result back as a message. Or break the work into chunks and yield between them with `setImmediate`.',
        'Watch event-loop lag as a production metric. A rising lag is often the first sign of a blocking call.',
      ],
      done: 4,
    },
    {
      label: 'Recap', tag: 'recap',
      title: 'Recap: keep the loop turning',
      flows: [],
      state: {},
      set: { apis: { label: 'Timers & I/O', sub: 'browser / libuv' } },
      body: [
        '**One stack:** running code is never pre-empted. An `async` function only pauses at `await`.',
        '**Order:** current task, then all microtasks, then the next task.',
        '**Async I/O** waits off-thread; **CPU work** does not.',
        '**Never block the loop:** use workers, chunking or another service for heavy work.',
      ],
      done: 4,
    },
  ],
};
