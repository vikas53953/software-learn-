// Module 5: Concurrency, lesson format 2: definition, Basics + Intermediate, scenes, checks.
// Diagram steps (add/edges/flows/state) are drawn by src/mapscene.js at the places in each lesson's `map`;
// steps with `scene` use src/content/scenes/concurrency.js.
import { scenes } from './scenes/concurrency.js';

const tile = (k, v, sub, tone) => ({ k, v, sub, tone });

// ---------------------------------------------------------------------------------------------
export const race = {
  format: 2,
  slug: 'race-conditions',
  title: 'The Last Seat',
  short: 'Race Conditions',
  minutes: 15,
  level: 'Beginner → Intermediate',
  promise: 'Two people book the last seat at the same moment. Watch "check, then act" go wrong, and learn three ways to fix it.',
  definition: {
    sentence: 'A **race condition** is a bug where the result depends on the timing of operations that run at the same time, so the same code is right on one run and wrong on the next.',
    more: 'The usual shape is "check, then act": read some shared state, decide, then write. Another request can change the state between the check and the act.',
    analogy: { title: 'Think of two people and one parking space', text: 'Both see the space is empty from the end of the row. Both drive towards it. Seeing it free was true; it just stopped being true before they arrived.' },
    mini: '**Race condition:** the result depends on timing between operations that run at the same time.',
  },
  learn: [
    'Spot check-then-act code and the lost update it causes.',
    'Explain why ordinary tests rarely catch a race.',
    'Fix it with a lock, an atomic conditional update or a version check.',
    'Know what transactions and isolation levels do, and do not, protect.',
  ],
  metrics: [
    { key: 'seat', label: 'Seat 14C' },
    { key: 'confirmed', label: 'Confirmations sent' },
    { key: 'double', label: 'Double bookings' },
  ],
  scenes,
  terms: {
    critical: ['Critical section', 'a piece of code that only one request may run at a time, guarded by a lock.'],
    atomic: ['Atomic', 'happens as one indivisible step: other operations see it either not at all or completely.'],
    optimistic: ['Optimistic concurrency', 'let everyone work without locks, and detect at write time whether someone else changed the data first.'],
  },
  map: { nodes: { a: [74, 60, 128], b: [74, 240, 128], seat: [384, 150, 150], lock: [224, 150, 90] } },
  nodes: {
    a: { x: 120, y: 110, label: 'Request A', sub: 'Asha books 14C', icon: 'thread', kind: 'thread', w: 160 },
    b: { x: 120, y: 350, label: 'Request B', sub: 'Ben books 14C', icon: 'thread', kind: 'thread', w: 160 },
    seat: { x: 560, y: 230, label: 'seats row 14C', sub: 'holder: null', icon: 'db', kind: 'store', w: 190, h: 64 },
    lock: { x: 340, y: 230, label: 'Lock', sub: 'seat 14C', icon: 'lock', kind: 'iface', w: 124 },
  },
  steps: [
    {
      lvl: 'basics', label: 'Check, then act', title: 'The booking code looks obviously correct', done: 0,
      say: 'Read the seat. If nobody holds it, write your name and send a confirmation. With one request at a time, this works every time.',
      add: ['a', 'seat'],
      edges: [['a', 'seat', { label: 'read, then write' }]],
      flows: [['a', 'seat', { n: 2 }]],
      metrics: { seat: 'free', confirmed: '0', double: '0' },
      blocks: [
        { lang: 'ts', code: `async function book(seatId: string, user: string) {
  const seat = await db.one(
    'SELECT holder FROM seats WHERE id = $1', [seatId]);
  if (seat.holder !== null) throw new SoldOut();
  await db.none(
    'UPDATE seats SET holder = $1 WHERE id = $2', [user, seatId]);
  await sendConfirmation(user, seatId);
}` },
        { p: 'Look for the gap: a read, a decision based on it, and a write, with `await` in between. Each `await` is a moment where other requests run.' },
      ],
    },
    {
      lvl: 'basics', label: 'Both read', title: 'Two requests read "free" a millisecond apart', scene: 'raceTimeline', done: 1,
      say: 'Asha and Ben press Book at the same moment. Both SELECTs run before either UPDATE, so both see holder null and both pass the check.',
      read: { tiles: [tile('Checks passed', '2', 'both saw "free"', 'bad'), tile('Seat holder', 'ben', 'A\'s write overwritten', 'bad'), tile('Emails sent', '2', 'for one seat', 'bad')] },
      blocks: [
        { p: 'The check was true when it ran, and false by the time it mattered. Ben\'s write silently replaces Asha\'s: a **lost update**.' },
        { callout: 'illus', title: 'About the numbers', text: 'Timings and counts in this lesson are illustrative.' },
      ],
    },
    {
      lvl: 'basics', label: 'Lost update', title: 'Two confirmations, one seat', done: 1,
      say: 'Both requests write, and both send an email. The database ends with Ben as the holder; Asha finds out at the gate.',
      add: ['b'],
      set: { seat: { sub: 'holder: ben' } },
      edges: [['a', 'seat', { label: 'UPDATE asha', tone: 'bad' }], ['b', 'seat', { label: 'UPDATE ben', tone: 'bad' }]],
      flows: [['a', 'seat', { n: 1, tone: 'bad' }], ['b', 'seat', { n: 1, tone: 'bad', delay: 0.15 }]],
      state: { seat: 'bad', a: 'bad', b: 'warn' },
      metrics: { seat: 'ben', confirmed: '2', double: '1' },
      blocks: [
        { callout: 'key', title: 'The pattern', text: 'Any time you read shared state, decide based on it, and then write, another actor can change it in between.' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: will the tests catch it?', scene: 'raceStress', done: 2,
      say: 'The test suite books a seat 50 times, one request after another. On launch day, 50 people try to book the same few seats at once.',
      check: {
        type: 'predict', q: 'How many double bookings does the test suite find?',
        opts: [{ t: 'None' }, { t: 'About half of them' }, { t: 'All of them' }],
        fb: ['', 'A race needs two requests between the same read and write. One at a time, they never overlap.', 'Each request finishes before the next starts, so there is never a second reader.'],
        ans: 0, why: 'Requests that never overlap cannot race. The bug only appears under real concurrency, which is why it passes every test and fails on launch day. To test for it, fire many requests at once against a real database.',
      },
    },
    {
      lvl: 'basics', label: 'Lock', title: 'Fix 1: one at a time, with a lock', done: 2,
      say: 'Make the read, check and write a critical section. Ben\'s request waits until Asha\'s finishes, then reads holder asha and gets "sold out".',
      add: ['lock'],
      set: { seat: { sub: 'holder: asha' } },
      edges: [['a', 'lock', { label: 'acquired', tone: 'ok' }], ['b', 'lock', { label: 'waiting', tone: 'warn', dash: true }], ['lock', 'seat']],
      flows: [['a', 'lock', { n: 1, tone: 'ok' }], ['lock', 'seat', { n: 1, tone: 'ok', delay: 0.3 }], ['b', 'lock', { n: 2, tone: 'warn', stall: 0.8 }]],
      state: { lock: 'hl', a: 'ok', b: 'warn' },
      metrics: { seat: 'asha', confirmed: '1', double: '0' },
      blocks: [
        { lang: 'sql', code: `BEGIN;
SELECT holder FROM seats
  WHERE id = '14C' FOR UPDATE;  -- B waits here
UPDATE seats SET holder = 'asha'
  WHERE id = '14C';
COMMIT;                         -- B continues` },
        { p: 'In one process the lock is a mutex. Across many servers, a row lock (`SELECT … FOR UPDATE` inside a transaction) works, because the database is the one place every server shares. It is correct, but every booking for that seat now waits in line.' },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 2,
      say: 'Spot the same bug in other code.',
      check: {
        type: 'choice', q: 'Which of these has the same race as the booking code?',
        opts: [
          { t: '`const b = await getBalance(id); if (b >= amt) await setBalance(id, b - amt);`' },
          { t: '`UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1`', hint: 'Here the check and the change happen inside one statement, which the database applies atomically.' },
          { t: '`const total = items.reduce((s, i) => s + i.price, 0);`', hint: 'Nothing here is shared or written: it only reads its own local list.' },
        ],
        ans: 0, why: 'Read, decide, then write, with an `await` in the gap. Two withdrawals can both see the old balance and both succeed, overdrawing the account.',
      },
    },
    {
      lvl: 'intermediate', label: 'Atomic update', title: 'Fix 2: make the check part of the write', done: 3,
      say: 'Put the condition inside the UPDATE. The database changes each row atomically, so only one request can turn holder from null into a name.',
      remove: ['lock'],
      set: { seat: { sub: 'holder: asha' } },
      edges: [['a', 'seat', { label: '1 row updated', tone: 'ok' }]],
      flows: [['a', 'seat', { n: 1, tone: 'ok' }]],
      state: { a: 'ok', seat: 'ok' },
      metrics: { seat: 'asha', confirmed: '1', double: '0' },
      blocks: [
        { lang: 'sql', code: `UPDATE seats SET holder = $1
WHERE id = $2 AND holder IS NULL;
-- rowCount 1: booked. 0: sold out.` },
        { p: 'There is no gap between check and act, no explicit lock, and only one round trip. When the database can express the check, this is usually the simplest and fastest fix. It is [[atomic|atomic]]: nobody can see it half done.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Predict', title: 'Predict: the second atomic update', done: 3,
      edges: [['a', 'seat', { label: '1 row updated', tone: 'ok' }], ['b', 'seat', { label: '?', tone: 'warn' }]],
      flows: [['a', 'seat', { n: 1, tone: 'ok' }], ['b', 'seat', { n: 1, tone: 'warn', delay: 0.1 }]],
      say: 'Asha\'s and Ben\'s conditional UPDATEs reach the database one millisecond apart. Asha\'s commits first.',
      check: {
        type: 'predict', q: 'What does Ben\'s `UPDATE … WHERE holder IS NULL` return?',
        opts: [{ t: 'rowCount 1, replacing Asha' }, { t: 'rowCount 0' }, { t: 'An error: row is locked' }],
        fb: ['After Asha\'s commit, `holder IS NULL` is false, so the row no longer matches.', '', 'Ben\'s statement may wait briefly for Asha\'s row lock, but then it simply matches nothing.'],
        ans: 1, why: 'Ben\'s UPDATE waits for Asha\'s to commit, re-checks the condition on the new row (in PostgreSQL\'s default mode), finds a holder, and updates nothing. The code reads rowCount 0 and says "sold out".',
      },
    },
    {
      lvl: 'intermediate', label: 'Versions', title: 'Fix 3: optimistic concurrency with a version', done: 3,
      say: 'When the decision involves several fields, keep a version number. Read it with the data, and write only if it has not changed since.',
      set: { seat: { sub: 'holder: asha · v8' } },
      edges: [['a', 'seat', { label: 'v7 → v8 ✓', tone: 'ok' }], ['b', 'seat', { label: 'v7? conflict', tone: 'warn' }]],
      flows: [['a', 'seat', { n: 1, tone: 'ok' }], ['b', 'seat', { n: 1, tone: 'warn', delay: 0.1 }]],
      state: { a: 'ok', b: 'warn' },
      blocks: [
        { lang: 'sql', code: `UPDATE seats
SET holder = $1, fare = $2, version = 8
WHERE id = $3 AND version = 7;
-- 0 rows: someone changed it. Reload, retry or report.` },
        { p: '[[optimistic|Optimistic concurrency]] assumes conflicts are rare and detects them; locks assume they are common and prevent them. HTTP uses the same idea: send the `ETag` you read in an `If-Match` header, and the server answers `412 Precondition Failed` if it changed.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Transactions', title: 'A transaction alone is not enough', scene: 'raceIso', done: 4,
      say: 'Wrapping the original read and write in a transaction does not fix it at PostgreSQL\'s default level. Stricter levels turn the lost update into an error you must retry.',
      read: { tiles: [tile('READ COMMITTED', 'overwrite', 'the default', 'bad'), tile('REPEATABLE READ', 'error', 'B must retry'), tile('SERIALIZABLE', 'error', 'one must retry')] },
      blocks: [
        { p: 'At READ COMMITTED, Ben\'s UPDATE waits for Asha\'s commit and then goes ahead, because its `WHERE id = $2` still matches. At REPEATABLE READ or SERIALIZABLE, PostgreSQL refuses instead, with a serialization error.' },
        { callout: 'warn', title: 'Errors are the price', text: 'Stricter isolation does not make conflicts disappear; it reports them. Code that uses it must catch serialization failures and retry the whole transaction.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'Pick the fix that fits each situation.',
      check: {
        type: 'match', q: 'Which fix suits each case best?', bins: ['Atomic conditional update', 'Row lock in a transaction', 'Version check'],
        bugs: [
          { t: 'Take one item from stock, only if at least one is left', a: 0, why: '`SET stock = stock - 1 WHERE id = $1 AND stock > 0`: one statement does the check and the change.', hint: 'Can a single UPDATE express both the condition and the change?' },
          { t: 'Two admins edit the same product page in a form for several minutes', a: 2, why: 'Holding a lock for minutes would block everyone. Save with the version you loaded, and warn if it changed.', hint: 'Would you hold a lock while someone types?' },
          { t: 'Move money between two accounts, with checks on both balances', a: 1, why: 'Several reads and writes across rows must happen together: lock the rows (in a fixed order) inside one transaction.', hint: 'Does the decision involve several rows that must change together?' },
          { t: 'Mark a coupon as used, only if it is still unused', a: 0, why: '`SET used = true WHERE code = $1 AND used = false`, then check the row count.', hint: 'One row, one condition: can the UPDATE carry it?' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: close the gap between check and act', done: 4,
      say: 'A race needs a gap between reading and writing. Close it with a lock, put the check inside the write, or detect conflicts with a version.',
      flows: [],
      state: {},
      metrics: { seat: 'asha', confirmed: '1', double: '0' },
      blocks: [
        { ul: [
          '**Race condition:** the result depends on timing between concurrent operations; look for read, decide, write.',
          '**Tests miss it** because requests never overlap; test with real concurrency.',
          '**Lock** when a multi-step operation must run alone; keep the critical section short.',
          '**Atomic conditional writes** are the simplest fix when the database can do the check.',
          '**Versions** detect conflicts without holding locks; stricter isolation reports conflicts as errors to retry.',
        ] },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
export const deadlock = {
  format: 2,
  slug: 'deadlocks',
  title: 'After You, No, After You',
  short: 'Deadlocks',
  minutes: 13,
  level: 'Beginner → Intermediate',
  promise: 'Two transfers lock two accounts in opposite order and wait for each other forever. See the cycle, then break it.',
  definition: {
    sentence: 'A **deadlock** is when two or more tasks each hold something the other needs and wait for it, so none of them can ever continue.',
    more: 'Edward Coffman and colleagues described the four conditions every deadlock needs in 1971. Remove any one of them and deadlock becomes impossible.',
    analogy: { title: 'Think of a narrow bridge', text: 'Two cars drive onto a one-lane bridge from opposite ends and meet in the middle. Each waits for the other to back up. Neither does.' },
    mini: '**Deadlock:** tasks each hold what another needs and wait for it, forever.',
  },
  learn: [
    'Show how two locks taken in opposite orders form a cycle.',
    'Name the four conditions every deadlock needs.',
    'Prevent deadlocks with one global lock order.',
    'Recover with detection, timeouts and jittered retries.',
  ],
  metrics: [
    { key: 't1', label: 'Transfer 1' },
    { key: 't2', label: 'Transfer 2' },
    { key: 'done', label: 'Completed' },
  ],
  scenes,
  terms: {
    waitfor: ['Wait-for graph', 'a drawing with an arrow from each task to the task it is waiting on. A loop in it is a deadlock.'],
    livelock: ['Livelock', 'tasks keep reacting to each other (backing off and retrying in step) without making progress, though none is blocked.'],
  },
  map: { nodes: { t1: [80, 70, 130], t2: [80, 230, 130], l7: [384, 70, 150], l9: [384, 230, 150] } },
  nodes: {
    t1: { x: 140, y: 120, label: 'Transfer 1', sub: 'acct 7 → acct 9', icon: 'thread', kind: 'thread', w: 170 },
    t2: { x: 140, y: 340, label: 'Transfer 2', sub: 'acct 9 → acct 7', icon: 'thread', kind: 'thread', w: 170 },
    l7: { x: 600, y: 120, label: 'Lock · account 7', icon: 'lock', kind: 'iface', w: 180 },
    l9: { x: 600, y: 340, label: 'Lock · account 9', icon: 'lock', kind: 'iface', w: 180 },
  },
  steps: [
    {
      lvl: 'basics', label: 'Two transfers', title: 'Each transfer locks both accounts', done: 0,
      say: 'To move money safely, a transfer locks the source account, then the destination. Transfer 1 sends from 7 to 9; at the same moment, Transfer 2 sends from 9 to 7.',
      add: ['t1', 't2', 'l7', 'l9'],
      metrics: { t1: 'starting', t2: 'starting', done: '0' },
      blocks: [
        { lang: 'ts', code: `async function transfer(from: Account, to: Account, amt: number) {
  await from.lock.acquire();
  await to.lock.acquire();
  try { from.balance -= amt; to.balance += amt; }
  finally { to.lock.release(); from.lock.release(); }
}` },
      ],
    },
    {
      lvl: 'basics', label: 'First locks', title: 'Each takes its first lock', done: 0,
      say: 'Transfer 1 locks account 7. Transfer 2 locks account 9. So far, so good.',
      edges: [['t1', 'l7', { label: 'holds', tone: 'ok' }], ['t2', 'l9', { label: 'holds', tone: 'ok' }]],
      flows: [['t1', 'l7', { n: 1, tone: 'ok' }], ['t2', 'l9', { n: 1, tone: 'ok' }]],
      metrics: { t1: 'holds 7', t2: 'holds 9', done: '0' },
      blocks: [{ p: 'Each transfer is following the code exactly. Nothing is wrong yet.' }],
    },
    {
      lvl: 'basics', label: 'The cycle', title: 'Each waits for the lock the other holds', done: 1,
      say: 'Transfer 1 now asks for 9, held by Transfer 2. Transfer 2 asks for 7, held by Transfer 1. Neither lets go of what it holds until it gets what it wants.',
      edges: [['t1', 'l7', { label: 'holds', tone: 'ok' }], ['t2', 'l9', { label: 'holds', tone: 'ok' }],
        ['t1', 'l9', { tone: 'bad', dash: true, bend: 30 }], ['t2', 'l7', { tone: 'bad', dash: true, bend: 30 }]],
      flows: [['t1', 'l9', { n: 2, tone: 'bad', stall: 0.75, bend: 30 }], ['t2', 'l7', { n: 2, tone: 'bad', stall: 0.75, bend: 30 }]],
      state: { t1: 'bad', t2: 'bad', l7: 'warn', l9: 'warn' },
      metrics: { t1: 'waiting for 9', t2: 'waiting for 7', done: '0' },
      blocks: [
        { p: 'Both wait forever. CPU use drops to zero, nothing logs an error, and other requests that need these accounts pile up behind them.' },
      ],
    },
    {
      lvl: 'basics', label: 'Four conditions', title: 'Every deadlock needs four things at once', scene: 'dlGraph', done: 2,
      say: 'Draw who waits for whom. Transfer 1 waits for Transfer 2, which waits for Transfer 1: a loop. A deadlock needs that loop and three other conditions.',
      read: { tiles: [tile('Mutual exclusion', 'yes', 'one holder per lock'), tile('Hold and wait', 'yes', 'keeps 7, asks for 9'), tile('Circular wait', 'yes', 'the loop', 'bad')] },
      blocks: [
        { ul: ['**Mutual exclusion:** a lock has one holder at a time.', '**Hold and wait:** a task keeps what it has while asking for more.', '**No preemption:** nobody can take a lock away from its holder.', '**Circular wait:** the [[waitfor|wait-for graph]] has a loop.'] },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 2,
      say: 'Pick the change that makes this deadlock impossible.',
      check: {
        type: 'choice', q: 'Which change guarantees the two transfers can never deadlock?',
        opts: [
          { t: 'Both transfers lock the account with the lower ID first' },
          { t: 'Add a 10 ms pause between taking the two locks', hint: 'A pause makes the overlap more likely, not less.' },
          { t: 'Run the service on a faster server', hint: 'Speed changes how often it happens, not whether it can.' },
        ],
        ans: 0, why: 'With one global order, both transfers ask for account 7 first. Whoever gets it also gets 9; the other waits while holding nothing, so no loop can form.',
      },
    },
    {
      lvl: 'intermediate', label: 'Order locks', title: 'Always lock in the same global order', done: 3,
      say: 'Lock the lower account ID first, whatever the direction. Transfer 2 now waits for 7 while holding nothing, so Transfer 1 finishes and Transfer 2 runs next.',
      edges: [['t1', 'l7', { label: '1st', tone: 'ok' }], ['t1', 'l9', { label: '2nd', tone: 'ok', bend: 30 }], ['t2', 'l7', { tone: 'warn', dash: true, bend: 30 }]],
      flows: [['t1', 'l7', { n: 1, tone: 'ok' }], ['t1', 'l9', { n: 1, tone: 'ok', delay: 0.3, bend: 30 }], ['t2', 'l7', { n: 1, tone: 'warn', stall: 0.7, bend: 30 }]],
      state: { t1: 'ok', t2: 'warn' },
      metrics: { t1: 'done', t2: 'runs next', done: '1' },
      blocks: [
        { lang: 'ts', code: `const [first, second] =
  from.id < to.id ? [from, to] : [to, from];
await first.lock.acquire();
await second.lock.acquire();` },
        { p: 'This breaks circular wait. It works for any number of locks, as long as everyone uses the same order.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Predict', title: 'Predict: three transfers in a ring', done: 3,
      say: 'Three transfers run at once: 7 → 9, 9 → 12 and 12 → 7. Every transfer locks the lower account ID first.',
      check: {
        type: 'predict', q: 'Can these three transfers deadlock?',
        opts: [{ t: 'Yes, they form a ring' }, { t: 'No' }, { t: 'Only if they start in the same millisecond' }],
        fb: ['The money moves in a ring, but the locks do not: everyone climbs the same order.', '', 'Timing does not matter once the order is fixed.'],
        ans: 1, why: 'A loop would need some transfer to hold a higher ID while waiting for a lower one. With lower-first ordering nobody ever does, so the wait-for graph cannot close.',
      },
    },
    {
      lvl: 'intermediate', label: 'Detect', title: 'Databases detect the loop and abort one side', scene: 'dlDetect', done: 4,
      say: 'When you cannot control the order, let the database break the loop. PostgreSQL notices the cycle, aborts one transaction with a deadlock error, and the other one finishes.',
      read: { tiles: [tile('Detection', 'after 1 s', 'Postgres default'), tile('Error', '40P01', 'deadlock detected', 'bad'), tile('Your job', 'retry', 'the whole transaction', 'ok')] },
      blocks: [
        { p: 'MySQL\'s InnoDB does the same, by default straight away. In both, the aborted transaction is rolled back, so retrying it from the start is safe.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Retry', title: 'Retry with jitter, or you get a livelock', done: 4,
      say: 'Retrying is right, but two transactions that retry after exactly the same pause can collide again and again. Add randomness to the wait.',
      edges: [],
      flows: [],
      state: {},
      metrics: { t1: 'done', t2: 'done (retry)', done: '2' },
      blocks: [
        { lang: 'ts', code: `for (let attempt = 1; ; attempt++) {
  try { return await db.tx(() => transfer(a, b, amt)); }
  catch (e) {
    if (e.code !== '40P01' || attempt === 5) throw e;
    const base = 50 * 2 ** attempt;   // 100, 200, 400 ms…
    await sleep(base / 2 + Math.random() * base / 2);
  }
}` },
        { callout: 'warn', title: 'Livelock', text: 'Without random jitter, both sides can back off and retry in step, colliding again and again. That is a [[livelock|livelock]]: nobody is blocked, and nobody makes progress.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'Each fix works by breaking one of the four conditions.',
      check: {
        type: 'match', q: 'Which condition does each fix break?', bins: ['Circular wait', 'Hold and wait', 'No preemption'],
        bugs: [
          { t: 'Always lock the lower account ID first', a: 0, why: 'A single order means the wait-for graph can never loop.', hint: 'Does it change what you hold, or the order you ask in?' },
          { t: 'Take both locks in one call, or neither', a: 1, why: 'Nobody ever holds one lock while waiting for another.', hint: 'Can a task still hold one lock while it waits?' },
          { t: 'The database aborts one transaction and frees its locks', a: 2, why: 'Locks are taken away from a holder by force, which is preemption.', hint: 'Who gives up the lock, and do they choose to?' },
          { t: '`tryLock` with a timeout: on failure, release what you hold and retry', a: 2, why: 'The task gives up locks it already holds instead of keeping them while it waits, the self-imposed form of preemption.', hint: 'What happens to the lock it already had?' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: no loops, no deadlocks', done: 4,
      say: 'Deadlocks come from locks taken in different orders. Prevent them with one global order, and recover with detection and jittered retries.',
      edges: [['t1', 'l7', { tone: 'ok' }], ['t1', 'l9', { tone: 'ok', bend: 30 }]],
      flows: [],
      state: { t1: 'ok', t2: 'ok' },
      blocks: [
        { ul: [
          '**Cause:** tasks take locks in different orders and wait while holding.',
          '**Four conditions:** mutual exclusion, hold and wait, no preemption, circular wait. Break one.',
          '**Prevent** with one global lock order, or by taking everything at once.',
          '**Recover** with database detection, timeouts and retries with jitter.',
          '**Simplest of all:** hold fewer locks, for less time.',
        ] },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
const PUZZLE = `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`;

export const eventLoop = {
  format: 2,
  slug: 'event-loop',
  title: 'One Thread, Many Tasks',
  short: 'The Event Loop',
  minutes: 15,
  level: 'Beginner → Intermediate',
  promise: 'Predict the output of four lines of JavaScript, and learn why one slow loop freezes an entire server.',
  definition: {
    sentence: 'The **event loop** is how JavaScript runs many tasks on one thread: it runs one piece of code to the end, then picks the next waiting callback from a queue, again and again.',
    more: 'Browsers and Node.js both work this way. Waiting (for a timer, the network or the disk) happens outside your code, so one thread can juggle thousands of connections, as long as no single piece of code runs for long.',
    analogy: { title: 'Think of a barista on their own', text: 'They take an order, start the machine, and serve the next customer while it brews. Fast, as long as nobody asks them to hand-grind a kilo of beans at the till.' },
    mini: '**Event loop:** run one callback to completion, then take the next one from the queues.',
  },
  learn: [
    'Explain why synchronous code always runs to the end first.',
    'Predict the order of timers and promise callbacks.',
    'Recognise code that blocks the loop, and its effect on a server.',
    'Move CPU-heavy work off the main thread.',
  ],
  metrics: [],
  scenes,
  terms: {
    micro: ['Microtask', 'a callback from a promise (`.then`, `await`) or `queueMicrotask`; all queued microtasks run before the next task.'],
    task: ['Task', 'a callback from a timer, an I/O event or a user event; the loop runs one per turn (also called a macrotask).'],
    worker: ['Worker thread', 'a separate JavaScript thread with its own event loop, talking to the main thread by messages.'],
  },
  steps: [
    {
      lvl: 'basics', label: 'The puzzle', title: 'In what order do these lines print?', scene: 'elState', done: 0,
      say: 'JavaScript runs your code on one thread with one call stack, yet a Node.js server handles thousands of requests at once. This four-line puzzle shows how.',
      ev: {},
      blocks: [
        { lang: 'js', code: PUZZLE },
        { p: 'Read it, make a guess, then step on.' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict the output', scene: 'elState', done: 0,
      say: 'Four calls to console.log: two direct, one in a timer of zero milliseconds, one in a promise callback.',
      ev: {},
      check: {
        type: 'predict', q: 'What does the puzzle print?',
        opts: [{ t: '`A B C D`' }, { t: '`A D C B`' }, { t: '`A D B C`' }],
        fb: ['That is the order of the lines, but B and C are callbacks: they run later.', '', 'Close: B and C both wait, but promise callbacks go first.'],
        ans: 1, why: 'A and D run immediately. C is a promise callback, which runs as soon as the script finishes. B is a timer callback, which waits for the next turn of the loop. The next steps show each move.',
      },
    },
    {
      lvl: 'basics', label: 'Sync first', title: 'Synchronous code runs to the end', scene: 'elState', done: 1,
      say: 'The whole script is one task and runs top to bottom without interruption. console.log A prints first; the next two lines only schedule callbacks for later.',
      ev: { stack: ['script'], out: 'A', prev: '', hl: 'stack' },
      blocks: [
        { p: 'Code that is running is never interrupted by another callback. An `async` function only pauses at `await`; between awaits it runs like any other code.' },
      ],
    },
    {
      lvl: 'basics', label: 'setTimeout', title: 'A timer hands its callback to the task queue', scene: 'elState', done: 1,
      say: 'setTimeout gives B to a timer outside your code. When the timer fires, B joins the task queue and waits its turn. Zero milliseconds means "as soon as possible", not "now".',
      ev: { stack: ['script'], apis: ['timer'], macro: ['B'], out: 'A', prev: 'A', hl: 'macro' },
      blocks: [
        { p: 'Each turn of the loop takes one [[task|task]] from the task queue. A delay of 0 is a minimum, not a promise: Node.js treats 0 as 1 ms, and browsers raise it to at least 4 ms once timers are nested more than five levels deep.' },
      ],
    },
    {
      lvl: 'basics', label: 'Promise', title: 'A resolved promise queues a microtask', scene: 'elState', done: 1,
      say: 'The promise is already resolved, so C goes straight into the microtask queue, which has priority over the task queue. Then D prints, the script ends and the stack is empty.',
      ev: { stack: [], micro: ['C'], macro: ['B'], out: 'A D', prev: 'A', hl: 'micro' },
      blocks: [
        { p: 'Promise callbacks, `await` continuations and `queueMicrotask` are all [[micro|microtasks]].' },
      ],
    },
    {
      lvl: 'basics', label: 'Microtasks', title: 'Empty stack: run every microtask first', scene: 'elState', done: 2,
      say: 'As soon as the stack is empty, the loop runs every waiting microtask, including any new ones they add, before it touches the task queue. C prints.',
      ev: { stack: ['C'], macro: ['B'], out: 'A D C', prev: 'A D', hl: 'stack' },
      blocks: [
        { callout: 'warn', title: 'Microtasks can starve the loop', text: 'A microtask that keeps queueing another microtask never lets the loop reach the task queue: timers and I/O wait forever.' },
      ],
    },
    {
      lvl: 'basics', label: 'Next task', title: 'Then one task from the task queue', scene: 'elState', done: 2,
      say: 'Only now does the loop take the next task: the timer callback. Final output: A D C B.',
      ev: { stack: ['B'], out: 'A D C B', prev: 'A D C', hl: 'stack' },
      blocks: [
        { ol: ['Run the current task to the end.', 'Run every microtask.', 'In a browser, maybe draw the page.', 'Take the next task, and repeat.'] },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', scene: 'elState', done: 2,
      say: 'Use the rule: current task, all microtasks, then the next task.',
      ev: { stack: [], out: '', hl: 'micro' },
      check: {
        type: 'choice', q: 'What does this print? `setTimeout(() => log(4)); Promise.resolve().then(() => { log(1); setTimeout(() => log(2)); queueMicrotask(() => log(3)); });`',
        opts: [
          { t: '`4 1 3 2`', hint: 'The script finishes first, and microtasks run before any timer.' },
          { t: '`1 3 4 2`' },
          { t: '`1 2 3 4`', hint: 'The timer for 2 is queued after the timer for 4, and 3 is a microtask.' },
        ],
        ans: 1, why: 'The script queues timer 4 and microtask 1. Microtask 1 logs 1, queues timer 2 (behind 4) and microtask 3, which runs straight away: 1, 3. Then the tasks in order: 4, 2.',
      },
    },
    {
      lvl: 'intermediate', label: 'Blocking', title: 'One CPU-heavy request stalls every other request', scene: 'elBlock', done: 3,
      say: 'A Node.js server hashes a 50 MB upload synchronously, which takes two seconds. The stack never empties, so every other request, even a health check, waits.',
      read: { tiles: [tile('Slow request', '2 s', 'expected'), tile('Quick requests', '+0.4 to 1.8 s', 'waiting in line', 'bad'), tile('CPU cores used', '1', 'of 8')] },
      blocks: [
        { p: 'Waiting for I/O is cheap because it happens outside the thread. CPU work is not: it holds the only thread the loop has.' },
        { callout: 'illus', title: 'About the numbers', text: 'Timings in this lesson are illustrative: a real 50 MB hash is much faster, but the same thing happens with any long CPU job.' },
        { callout: 'tip', title: 'Measure it', text: 'Track event-loop lag (for example with `perf_hooks.monitorEventLoopDelay()` in Node.js). Rising lag is often the first sign of a blocking call.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Predict', title: 'Predict: does async help?', scene: 'elBlock', done: 3,
      say: 'Someone suggests marking the hashing function async and awaiting it.',
      check: {
        type: 'predict', q: 'The function becomes `async function hash(buf) { /* same loop */ }`, called with `await`. Do other requests still wait?',
        opts: [{ t: 'No, async makes it run in the background' }, { t: 'Yes, just as long' }, { t: 'Only half as long' }],
        fb: ['`async` only changes the return value into a promise. The loop inside still runs on the main thread.', '', 'Nothing splits the work. It runs in one go, the same as before.'],
        ans: 1, why: 'An async function runs synchronously until its first `await`. The CPU loop has no await inside it, so it still holds the thread for two seconds. (Awaiting an already-settled value would only yield to microtasks, never to other requests.)',
      },
    },
    {
      lvl: 'intermediate', label: 'Offload', title: 'Move CPU work off the main thread', scene: 'elOffload', done: 4,
      say: 'Send the hashing to a worker thread and get the result back as a message. The main thread keeps answering requests while the worker computes.',
      read: { tiles: [tile('Main thread', 'free', 'serves requests', 'good'), tile('Worker', 'busy 2 s', 'on another core'), tile('Quick requests', 'normal', 'no queue', 'good')] },
      blocks: [
        { lang: 'js', code: `// main.js
import { Worker } from 'node:worker_threads';
const w = new Worker('./hash-worker.js');
w.postMessage(buffer);
w.once('message', (digest) => reply(digest));` },
        { p: 'Other options: split the work into chunks and yield between them with `setImmediate`, use built-in async versions (`crypto.pbkdf2` runs on libuv\'s thread pool; `pbkdf2Sync` does not), or move the job to a separate service.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', scene: 'elOffload', done: 4,
      say: 'Sort each line in a request handler.',
      check: {
        type: 'match', q: 'Does each call block the event loop while it works?', bins: ['Blocks the loop', 'Does not block'],
        bugs: [
          { t: '`fs.readFileSync(\'big.csv\')`', a: 0, why: 'Sync file APIs make the thread wait for the disk.', hint: 'What does the "Sync" in the name promise?' },
          { t: '`await fetch(url)`', a: 1, why: 'The request waits on the network outside the thread; the loop serves others meanwhile.', hint: 'Where does the waiting happen?' },
          { t: '`JSON.parse(text)` on a 200 MB string', a: 0, why: 'Parsing is CPU work on the main thread, and big inputs take seconds.', hint: 'Is this waiting, or computing?' },
          { t: '`crypto.pbkdf2(pw, salt, 600000, 32, \'sha256\', cb)`', a: 1, why: 'The callback version runs on libuv\'s thread pool, not the main thread.', hint: 'Is this the callback version or the Sync one?' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: keep the loop turning', scene: 'elState', done: 4,
      say: 'One stack runs one thing to the end. Then all microtasks, then the next task. Waiting is cheap; computing on the main thread blocks everyone.',
      ev: { stack: [], out: 'A D C B', prev: 'A D C B' },
      blocks: [
        { ul: [
          '**One stack:** running code is never interrupted; `async` functions only pause at `await`.',
          '**Order:** current task, then every microtask, then the next task.',
          '**Async I/O** waits off the thread; **CPU work** holds it.',
          '**Never block the loop:** use worker threads, chunking, async built-ins or another service.',
        ] },
      ],
    },
  ],
};
