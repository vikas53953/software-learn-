// Module 4: Delivery, lesson format 2: definition, Basics + Intermediate, scenes, checks.
// Diagram steps (add/edges/flows/state) are drawn by src/mapscene.js at the places in each lesson's `map`;
// steps with `scene` use src/content/scenes/delivery.js.
import { scenes } from './scenes/delivery.js';

const tile = (k, v, sub, tone) => ({ k, v, sub, tone });

// ---------------------------------------------------------------------------------------------
export const ci = {
  format: 2,
  slug: 'ci-pipeline',
  title: 'From Commit to Production',
  short: 'CI/CD Pipeline',
  minutes: 16,
  level: 'Beginner → Intermediate',
  promise: 'Follow one commit through build, tests, security checks and promotion, and see why each stage exists.',
  definition: {
    sentence: '**Continuous integration (CI)** means merging small changes into the shared main branch at least daily, with a machine building and testing every change. **Continuous delivery (CD)** keeps every passing change ready to release.',
    more: 'The term goes back to Grady Booch in 1991; Extreme Programming made it a daily habit in the late 1990s. The pipeline that does the checking is itself code, kept in the repository.',
    analogy: { title: 'Think of a kitchen pass', text: 'Every plate stops at the pass before it reaches a guest. The chef checks it in seconds, so a mistake is fixed while the cook still remembers making it.' },
    mini: '**CI/CD:** merge small and often, let a machine build and test every change, and keep main ready to release.',
  },
  learn: [
    'Explain why small, frequent merges are safer than big, rare ones.',
    'Order pipeline stages so the cheapest checks fail first.',
    'Place security checks in the pipeline: dependencies, code and secrets.',
    'Build once, promote the same artifact, and tell delivery from deployment.',
  ],
  metrics: [
    { key: 'freq', label: 'Deploys' },
    { key: 'lead', label: 'Commit → production' },
    { key: 'cfr', label: 'Change failure rate' },
    { key: 'mttr', label: 'Time to restore' },
  ],
  scenes,
  terms: {
    dora: ['DORA metrics', 'four measures of delivery performance from the DevOps Research and Assessment programme: deploy frequency, lead time, change failure rate and time to restore.'],
    trunk: ['Trunk-based development', 'everyone integrates into one main branch at least daily; branches, if any, live for hours or a day or two.'],
    sca: ['SCA', 'software composition analysis: checks your dependencies against databases of known vulnerabilities (CVEs).'],
    sast: ['SAST', 'static application security testing: reads your own source code for risky patterns without running it.'],
    artifact: ['Artifact', 'the built, ready-to-run output of the pipeline, such as a container image, identified by a content digest.'],
  },
  map: {
    nodes: {
      dev: [48, 50, 84], pr: [165, 50, 100], build: [285, 50, 84], test: [410, 50, 100],
      scan: [410, 150, 126], art: [280, 150, 100], stage: [150, 150, 96], gate: [46, 250, 80],
      prod: [176, 250, 112], manual: [340, 250, 150],
    },
  },
  nodes: {
    dev: { x: 80, y: 130, label: 'Developer', icon: 'user', kind: 'actor', w: 124 },
    pr: { x: 225, y: 130, label: 'Pull request', sub: 'small change', icon: 'git', kind: 'svc', w: 140 },
    build: { x: 380, y: 130, label: 'Build', sub: 'compile', icon: 'gear', kind: 'stage', w: 140 },
    test: { x: 535, y: 130, label: 'Test', sub: 'unit + API', icon: 'test', kind: 'stage', w: 140 },
    scan: { x: 690, y: 130, label: 'Security', sub: 'deps, code, keys', icon: 'shield', kind: 'stage', w: 150 },
    art: { x: 690, y: 330, label: 'Artifact', sub: 'image digest', icon: 'pkg', kind: 'store', w: 150 },
    stage: { x: 520, y: 330, label: 'Staging', sub: 'smoke + E2E', icon: 'server', kind: 'env', w: 140 },
    gate: { x: 370, y: 330, label: 'Approval', sub: 'optional', icon: 'flag', kind: 'stage', w: 124 },
    prod: { x: 215, y: 330, label: 'Production', icon: 'cloud', kind: 'env', w: 140 },
    manual: { x: 400, y: 240, label: 'Manual deploy\nevery 2 weeks', kind: 'note', w: 150 },
  },
  steps: [
    {
      lvl: 'basics', label: 'Big merges', title: '"Works on my machine", shipped every two weeks', done: 0,
      say: 'Branches live for weeks and merge in a rush before release. Someone builds on a laptop and copies the result to the servers.',
      add: ['dev', 'prod', 'manual'],
      edges: [['dev', 'prod', { dash: true, tone: 'bad', label: 'zip + ssh' }]],
      flows: [['dev', 'prod', { n: 1, dur: 3.5, tone: 'bad' }]],
      state: { manual: 'bad' },
      metrics: { freq: 'every 2 wks', lead: '≈ 10 days', cfr: '≈ 30%', mttr: 'hours' },
      blocks: [
        { p: 'Big batches mean big risk. When a release with 80 changes breaks, there are 80 suspects, and rolling back undoes all of them.' },
        { p: 'The four numbers below are the [[dora|DORA metrics]]. Elite teams deploy on demand, with lead times under a day and quick recovery. (DORA now calls the fourth one "failed deployment recovery time", and recent reports add a fifth, rework rate.)' },
        { callout: 'illus', title: 'About the numbers', text: 'Metric values in this lesson are illustrative.' },
      ],
    },
    {
      lvl: 'basics', label: 'Drift', title: 'The longer a branch lives, the harder it lands', scene: 'ciMerge', done: 1,
      say: 'While a branch waits, main keeps moving. After two weeks the branch is 42 commits behind, and merging it means untangling conflicts nobody remembers writing.',
      read: { tiles: [tile('Long branch', '9 files', 'in conflict', 'bad'), tile('Daily merges', '0–1 file', 'per merge', 'good'), tile('Same work', 'same size', 'split differently')] },
      blocks: [
        { callout: 'illus', title: 'About the numbers', text: 'Commit and conflict counts here are illustrative.' },
        { p: 'With [[trunk|trunk-based development]], everyone merges into main at least daily. Each merge is small, so conflicts are small, and everyone builds on the same up-to-date code.' },
        { callout: 'key', title: 'Unfinished work can still merge', text: 'Hide it behind a feature flag or keep it unreachable until it is ready. Merged is not the same as switched on; the deployment lesson shows how.' },
      ],
    },
    {
      lvl: 'basics', label: 'Integrate', title: 'Every change is built and tested by a machine', done: 1,
      say: 'Open a pull request, or merge to main, and a clean machine checks out the code, installs dependencies from the lockfile, and runs lint, tests and the build. Nobody\'s laptop is involved.',
      remove: ['manual', 'prod'],
      add: ['pr', 'build', 'test'],
      edges: [['dev', 'pr'], ['pr', 'build'], ['build', 'test']],
      flows: [['dev', 'pr', { n: 1 }], ['pr', 'build', { n: 1, delay: 0.3 }], ['build', 'test', { n: 1, delay: 0.6 }]],
      state: { build: 'hl', test: 'hl' },
      metrics: { lead: '≈ 5 days' },
      blocks: [
        { lang: 'yaml', code: `# .github/workflows/ci.yml
on:
  pull_request:
  push:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 22, cache: npm }
      # npm ci installs exact lockfile versions
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build` },
        { p: 'The pipeline is a file in the repository, so changes to it are reviewed and versioned like any other code.' },
      ],
    },
    {
      lvl: 'basics', label: 'Fail fast', title: 'A broken test blocks the merge in minutes', done: 2,
      say: 'A change breaks the discount rules. The unit tests fail, the pull request shows a red check, and branch protection stops the merge.',
      flows: [['dev', 'pr', { n: 1 }], ['pr', 'build', { n: 1 }], ['build', 'test', { n: 2, tone: 'bad', stall: 0.9 }]],
      state: { test: 'bad', pr: 'warn' },
      blocks: [
        { callout: 'key', title: 'The goal', text: 'Not zero red builds, but finding a problem minutes after it was written, while the change is still fresh in your head.' },
        { p: '**Branch protection** makes the checks mandatory: main only accepts pull requests whose required checks are green.' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: which order fails faster?', scene: 'ciOrder', done: 2,
      say: 'Two pipelines run the same four stages in a different order. Each stops at the first failure.',
      check: {
        type: 'predict', q: 'The commit has a lint error. Roughly how long until each pipeline reports it?',
        opts: [{ t: 'A: about 22 minutes. B: about 20 seconds.' }, { t: 'Both about 20 seconds' }, { t: 'Both about 22 minutes' }],
        fb: ['', 'Only if lint runs first. In A it runs last.', 'B runs lint first, so it stops almost at once.'],
        ans: 0, why: 'A runs E2E (15 min), integration (6 min) and unit tests (1 min) before it reaches lint. B runs lint first and stops after 20 seconds. Cheap checks first means most mistakes come back in seconds.',
      },
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 2,
      say: 'Main has just gone red after a merge, and three more pull requests are waiting.',
      check: {
        type: 'choice', q: 'What should the team do first?',
        opts: [
          { t: 'Keep merging; the failure is in someone else\'s area', hint: 'Every new merge now lands on a broken main, so nobody can tell whose change breaks what.' },
          { t: 'Revert the breaking commit, or fix it within minutes, before anything else merges' },
          { t: 'Mark the failing test as skipped so the queue can move', hint: 'That hides the bug instead of fixing it, and the test stops protecting anyone.' },
        ],
        ans: 1, why: 'A red main blocks everyone. Restoring green comes first, usually by reverting the commit and re-landing it once fixed.',
      },
    },
    {
      lvl: 'intermediate', label: 'Security', title: 'Check dependencies, code and secrets on every change', done: 3,
      say: 'Three more checks run on every pull request: known vulnerabilities in dependencies, risky patterns in your code, and keys committed by accident.',
      add: ['scan'],
      edges: [['dev', 'pr'], ['pr', 'build'], ['build', 'test'], ['test', 'scan']],
      flows: [['pr', 'build', { n: 1 }], ['build', 'test', { n: 1, delay: 0.3 }], ['test', 'scan', { n: 1, delay: 0.6 }]],
      state: { scan: 'hl' },
      blocks: [
        { ul: ['[[sca|SCA]] compares your dependency versions with published CVEs.', '[[sast|SAST]] reads your own code for patterns such as SQL built from user input.', '**Secret scanning** looks for things shaped like API keys, tokens and private keys.'] },
        { p: 'A key that reached the repository is already leaked, even if the next commit deletes it: it lives on in the history and in every clone. Revoke and rotate it first, then clean up.' },
        { callout: 'warn', title: 'Gate on what is actionable', text: 'Fail the build on new critical findings and track the rest. A check that fails on everything gets switched off.' },
        { p: 'Finding a vulnerable library in a pull request is far cheaper than finding it in a penetration test or an incident. This is often called "shifting left".' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 3,
      say: 'Sort each finding to the check that catches it.',
      check: {
        type: 'match', q: 'Which check would flag each problem?', bins: ['SCA (dependencies)', 'SAST (your code)', 'Secret scanning'],
        bugs: [
          { t: '`package.json` pins lodash 4.17.20, which has a published CVE', a: 0, why: 'A known-vulnerable version of a dependency: exactly what SCA looks up.', hint: 'Is the problem in code you wrote, or in a library?' },
          { t: '`db.query("SELECT * FROM users WHERE id = " + req.params.id)`', a: 1, why: 'SQL built from user input in your own code is a classic SAST finding (injection).', hint: 'Whose code is this, and what does it do with user input?' },
          { t: 'A file `config.js` contains `AKIA` followed by 16 more characters', a: 2, why: 'That is the shape of an AWS access key ID. Secret scanning matches known key formats.', hint: 'What does a string like that usually turn out to be?' },
          { t: '`eval(req.query.expr)` in a calculator endpoint', a: 1, why: 'Running user input as code is a risky pattern in your own source: SAST.', hint: 'Is anything here a library version or a key?' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Build once', title: 'Build one artifact and promote it unchanged', done: 4,
      say: 'After the merge, the pipeline builds one container image, tags it with the commit, and pushes it to a registry. Staging and production run that exact image; only configuration differs.',
      add: ['art', 'stage', 'prod'],
      edges: [['dev', 'pr'], ['pr', 'build'], ['build', 'test'], ['test', 'scan'], ['scan', 'art'], ['art', 'stage'], ['stage', 'prod']],
      flows: [['scan', 'art', { n: 1 }], ['art', 'stage', { n: 1, delay: 0.3 }], ['stage', 'prod', { n: 1, delay: 0.6 }]],
      state: { art: 'hl' },
      metrics: { freq: 'daily', lead: '< 1 day', cfr: '≈ 10%' },
      blocks: [
        { lang: 'bash', code: `IMAGE=reg.example.com/shop:$GIT_SHA
docker build -t $IMAGE .
docker push $IMAGE
# staging, then production, deploy
# this image by its digest` },
        { p: 'The [[artifact|artifact]] is identified by its content digest (`sha256:…`), so "the thing we tested" and "the thing we shipped" can be proven identical. Signing it and publishing an SBOM records who built it and what is inside.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Why once', title: 'Rebuilding per environment ships untested bytes', scene: 'ciPromote', done: 4,
      say: 'Build the same commit twice and you can get two different images: a base image tag moved, or a dependency range resolved to a newer version. Promote one digest instead.',
      read: { tiles: [tile('Per-env builds', '2 digests', 'one never tested', 'bad'), tile('Build once', '1 digest', 'staging = production', 'good'), tile('Differs per env', 'config only', 'URLs, secrets, sizes')] },
      blocks: [
        { p: 'Tags such as `node:22` are moving labels: the image behind them changes when a new patch ships. A digest never changes. Pin base images by digest in the Dockerfile, and deploy by digest too.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Delivery or deployment', title: 'Continuous delivery or continuous deployment?', done: 4,
      say: 'With continuous delivery, every passing change is ready and a person presses release. With continuous deployment, every passing change goes to production automatically.',
      add: ['gate'],
      edges: [['dev', 'pr'], ['pr', 'build'], ['build', 'test'], ['test', 'scan'], ['scan', 'art'], ['art', 'stage'], ['stage', 'gate'], ['gate', 'prod']],
      flows: [['art', 'stage', { n: 1 }], ['stage', 'gate', { n: 1, delay: 0.3 }], ['gate', 'prod', { n: 1, delay: 0.6 }]],
      state: { gate: 'hl' },
      metrics: { freq: 'many / day', lead: '< 1 hour', cfr: '< 5%', mttr: '< 1 hour' },
      blocks: [
        { table: { head: ['', 'Continuous delivery', 'Continuous deployment'], rows: [
          ['To production', 'A person approves', 'Automatic when green'],
          ['Good for', 'Audits, release windows', 'Fast feedback, small changes'],
          ['Needs', 'One-click releases', 'Strong tests and monitoring'],
        ] } },
        { p: 'Either way, a release is a button press or an automatic step, not a project.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'A team ships every two weeks and three releases in ten go wrong.',
      check: {
        type: 'choice', q: 'Which change is most likely to lower their change failure rate?',
        opts: [
          { t: 'Release less often, with a longer test phase before each release', hint: 'Bigger releases carry more changes per release, which makes each one riskier and harder to roll back.' },
          { t: 'Ship smaller changes more often through an automated pipeline' },
          { t: 'Add a second manual approval to every release', hint: 'Approvers rarely catch what tests miss in an 80-change release, and the wait makes batches bigger.' },
        ],
        ans: 1, why: 'DORA\'s research finds speed and stability rise together. Small changes are easier to test, review and roll back, and when one fails, the cause is obvious.',
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: small batches, checked by machines', done: 4,
      say: 'Merge small and often. Let a pipeline build and test every change, cheapest checks first. Check dependencies, code and secrets. Build once and promote the same artifact.',
      flows: [['dev', 'pr', { n: 1, dur: 2.4 }], ['pr', 'build', { n: 1, dur: 2.4 }], ['build', 'test', { n: 1, dur: 2.4 }], ['test', 'scan', { n: 1, dur: 2.4 }], ['scan', 'art', { n: 1, dur: 2.4 }], ['art', 'stage', { n: 1, dur: 2.4 }], ['stage', 'gate', { n: 1, dur: 2.4 }], ['gate', 'prod', { n: 1, dur: 2.4 }]],
      state: {},
      blocks: [
        { ul: [
          '**CI:** merge into main at least daily; every change is built and tested on a clean machine.',
          '**Fail fast:** cheapest checks first, branch protection on, and a red main is fixed before anything else.',
          '**Security in the pipeline:** SCA for dependencies, SAST for your code, secret scanning for keys.',
          '**Build once:** one artifact, one digest, promoted unchanged; only configuration differs.',
          '**Delivery or deployment:** a person presses release, or green goes out automatically.',
        ] },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------
export const deploys = {
  format: 2,
  slug: 'deployment-strategies',
  title: 'Releasing Without Fear',
  short: 'Deployment Strategies',
  minutes: 16,
  level: 'Beginner → Intermediate',
  promise: 'Recreate, rolling, blue-green, canary and feature flags: how each one limits the damage a bad release can do.',
  definition: {
    sentence: 'A **deployment strategy** is how you replace the running version of a service with a new one: who sees the new version, when, and how quickly you can take it back.',
    more: 'Every strategy trades cost and complexity for a smaller blast radius: the share of users a bad release can hurt before it is undone.',
    analogy: { title: 'Think of a new bus timetable', text: 'You can switch the whole city overnight, or try it on one route first and watch the complaints. The second way still has problems, but only one route feels them.' },
    mini: '**Deployment strategy:** how a new version replaces the old one, and how fast you can undo it.',
  },
  learn: [
    'Explain why "stop old, start new" means downtime, and how rolling updates avoid it.',
    'Use blue-green for an instant switch and an instant rollback.',
    'Change a database schema while two versions run side by side.',
    'Limit the blast radius with canaries and feature flags.',
  ],
  metrics: [
    { key: 'share', label: 'Traffic on v1.5' },
    { key: 'err', label: 'Error rate' },
    { key: 'down', label: 'Downtime' },
    { key: 'rollback', label: 'Rollback' },
  ],
  scenes,
  terms: {
    blast: ['Blast radius', 'how many users a bad release can affect before it is stopped.'],
    health: ['Health check', 'a request the platform makes to a new instance, such as GET /healthz, to decide whether it may receive traffic.'],
    expand: ['Expand and contract', 'changing a schema in steps (add the new shape, move data, remove the old shape) so old and new code both work throughout.'],
    flag: ['Feature flag', 'a switch checked at run time that turns a piece of already-deployed code on or off, for everyone or for chosen users.'],
  },
  map: {
    nodes: {
      users: [48, 150, 80], lb: [178, 150, 112], blue: [372, 66, 176], green: [372, 234, 176], flags: [178, 262, 130],
    },
  },
  nodes: {
    users: { x: 85, y: 230, label: 'Users', icon: 'users', kind: 'actor', w: 120 },
    lb: { x: 285, y: 230, label: 'Load balancer', sub: 'routes traffic', icon: 'arrows', kind: 'svc', w: 160, h: 62 },
    blue: { x: 580, y: 120, label: 'Blue · v1.4', sub: 'current', icon: 'server', kind: 'env-blue', w: 190, h: 62 },
    green: { x: 580, y: 340, label: 'Green · v1.5', sub: 'new', icon: 'server', kind: 'env-green', w: 190, h: 62 },
    flags: { x: 285, y: 395, label: 'Flag service', sub: 'checkout: off', icon: 'flag', kind: 'svc', w: 170 },
  },
  steps: [
    {
      lvl: 'basics', label: 'Recreate', title: 'Stop the old version, then start the new one', done: 0,
      say: 'The simplest strategy stops every instance of v1.4 and then starts v1.5. Until the new instances are up, nothing serves requests.',
      add: ['users', 'lb', 'blue'],
      set: { blue: { label: 'Servers · v1.4', sub: 'stopping…' } },
      edges: [['users', 'lb'], ['lb', 'blue', { tone: 'bad', dash: true }]],
      flows: [['users', 'lb', { n: 3, tone: 'bad', stall: 0.88 }]],
      state: { blue: 'bad' },
      metrics: { share: '—', err: '100%', down: '≈ 4 min', rollback: 'redeploy' },
      blocks: [
        { p: 'If v1.5 turns out to be broken, rolling back means doing the whole thing again in reverse, with more downtime.' },
        { p: 'Recreate is still the right call for batch workers, development environments, or a schema change two versions cannot share. Kubernetes offers it as `strategy.type: Recreate`.' },
        { callout: 'illus', title: 'About the numbers', text: 'Metric values in this lesson are illustrative.' },
      ],
    },
    {
      lvl: 'basics', label: 'Rolling', title: 'Rolling: replace instances a few at a time', scene: 'depRolling', done: 1,
      say: 'Replace two instances at a time. Each new one must pass its health check before the next two are replaced, so the service never goes dark.',
      read: { tiles: [tile('Downtime', '0', 'always some instances up', 'good'), tile('Versions live', '2', 'during the rollout'), tile('Rollback', 'another rollout', 'minutes, not seconds')] },
      blocks: [
        { p: 'This is the default for a Kubernetes Deployment (`strategy.type: RollingUpdate`, with `maxUnavailable` and `maxSurge` both 25% unless you change them). A new pod gets traffic once it is ready: if you define a readiness probe ([[health|health check]]), that probe must pass; with no probe, Kubernetes counts the pod as ready as soon as its containers start.' },
        { callout: 'key', title: 'The catch', text: 'For a while, v1.4 and v1.5 both serve traffic against the same database. They must both work with whatever schema is there.' },
      ],
    },
    {
      lvl: 'basics', label: 'Predict', title: 'Predict: a rename during a rollout', scene: 'depRename', done: 1,
      say: 'v1.5\'s migration renames the column price to price_cents, and runs as the rollout starts.',
      set: { blue: { label: 'Pool · v1.4 → v1.5', sub: '4 of 10 updated' } },
      edges: [['users', 'lb'], ['lb', 'blue']],
      flows: [['users', 'lb', { n: 3 }], ['lb', 'blue', { n: 3 }]],
      state: { blue: 'warn' },
      metrics: { share: '40%', err: '?', down: '0', rollback: 'slow' },
      check: {
        type: 'predict', q: 'Six instances still run v1.4, which reads `price`. What happens to their requests?',
        opts: [{ t: 'Nothing: each version uses its own column' }, { t: 'They fail until every instance runs v1.5' }, { t: 'The database blocks the rename while v1.4 is connected' }],
        fb: ['There is only one table. After the rename, `price` no longer exists for anyone.', '', 'Databases allow the rename; they do not know which code still needs the old name.'],
        ans: 1, why: 'After the rename, every query from v1.4 that mentions `price` fails. Zero-downtime deploys need schema changes that both versions can live with, which the intermediate part covers.',
      },
    },
    {
      lvl: 'basics', label: 'Blue-green', title: 'Blue-green: a full second environment, one switch', done: 2,
      say: 'Deploy v1.5 to an identical "green" environment while "blue" keeps serving. Test green on real infrastructure with no users on it.',
      add: ['green'],
      set: { blue: { label: 'Blue · v1.4', sub: 'live' }, green: { label: 'Green · v1.5', sub: 'idle, tested' } },
      edges: [['users', 'lb'], ['lb', 'blue'], ['lb', 'green', { dash: true, tone: 'muted' }]],
      flows: [['users', 'lb', { n: 3 }], ['lb', 'blue', { n: 3 }]],
      state: {},
      metrics: { share: '0%', err: '0.1%', down: '0', rollback: 'seconds' },
      blocks: [
        { p: 'When green looks right, change the load balancer so every new request goes to green. If something is wrong, change it back: blue is still running, untouched.' },
      ],
    },
    {
      lvl: 'basics', label: 'Switch', title: 'Flip the router', done: 2,
      say: 'The release is one routing change. Green takes all new traffic; blue stays on standby for a quick way back.',
      set: { blue: { sub: 'standby' }, green: { sub: 'live' } },
      edges: [['users', 'lb'], ['lb', 'blue', { dash: true, tone: 'muted' }], ['lb', 'green']],
      flows: [['users', 'lb', { n: 3 }], ['lb', 'green', { n: 3, tone: 'ok' }]],
      state: { green: 'ok', blue: 'dim' },
      metrics: { share: '100%', err: '0.1%' },
      blocks: [
        { ul: ['**Cost:** two full environments, at least during the release.', '**Draining:** long-lived connections such as WebSockets, and jobs in flight, must finish on blue.', '**Shared database:** both colours usually use one database, so the schema rule from rolling updates still applies.'] },
      ],
    },
    {
      lvl: 'basics', label: 'Check', title: 'Quick check', done: 2,
      say: 'Green went live two minutes ago, and checkout errors are climbing.',
      check: {
        type: 'choice', q: 'What is the fastest safe way to stop the damage?',
        opts: [
          { t: 'Point the load balancer back at blue' },
          { t: 'Hot-fix the bug and deploy v1.5.1 to green', hint: 'That might take an hour, with errors the whole time. Is there a faster way back?' },
          { t: 'Restart the green servers', hint: 'A restart runs the same broken code again.' },
        ],
        ans: 0, why: 'Blue is still running v1.4, so rolling back is the same one-line routing change as the release. Fix the bug afterwards, calmly. One catch: orders written while green was live must still be readable by blue, which is why the schema rule matters here too.',
      },
    },
    {
      lvl: 'intermediate', label: 'Expand, contract', title: 'Change the schema in three deploys', scene: 'depExpand', done: 3,
      say: 'To rename a column safely: add the new one and have v1.5 write both while you backfill; switch reads in v1.6 while it still writes both; and drop the old column only after v1.7, which writes just the new one, is fully out.',
      read: { tiles: [tile('Deploys', '3', 'then the drop'), tile('Broken requests', '0', 'at every step', 'ok'), tile('Old column', 'dropped last', 'the one step with no undo', 'bad')] },
      blocks: [
        { lang: 'sql', code: `-- 1. expand
ALTER TABLE products
  ADD COLUMN price_cents integer;

-- v1.5 writes both; backfill in batches
UPDATE products
  SET price_cents = round(price * 100)
  WHERE price_cents IS NULL
    AND id BETWEEN $1 AND $2;

-- 2. v1.6 reads price_cents, still
--    writes both; let price be empty
ALTER TABLE products
  ALTER COLUMN price DROP NOT NULL;

-- 3. contract: once v1.7 (writes only
--    price_cents) is fully rolled out
ALTER TABLE products
  DROP COLUMN price;` },
        { p: 'This is [[expand|expand and contract]] (also called parallel change). At every moment the running versions agree on the schema, and each release can roll back to the one before: v1.6 still writes `price`, so v1.5 keeps working if you return to it. The drop is the one step you cannot undo without a restore, so it comes last, on its own.' },
        { callout: 'tip', title: 'Big tables', text: 'Backfill in batches (for example, a few thousand rows per query) so one huge UPDATE does not lock the table or flood replication.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Canary', title: 'Canary: give 5% of users the new version first', done: 3,
      say: 'Send a small slice of real traffic to v1.5 and compare its error rate and latency with v1.4. If they match, step up: 25%, 50%, 100%.',
      set: { blue: { label: 'Stable · v1.4', sub: '95% of traffic' }, green: { label: 'Canary · v1.5', sub: '5% of traffic' } },
      edges: [['users', 'lb'], ['lb', 'blue', { label: '95%' }], ['lb', 'green', { label: '5%', tone: 'accent' }]],
      flows: [['users', 'lb', { n: 4 }], ['lb', 'blue', { n: 5 }], ['lb', 'green', { n: 1, dur: 2.2 }]],
      state: { green: 'hl' },
      metrics: { share: '5%', err: '0.1%', down: '0', rollback: 'shift traffic' },
      blocks: [
        { lang: 'yaml', code: `# Argo Rollouts
kind: Rollout
spec:
  strategy:
    canary:
      analysis:
        templates:
          - templateName: error-rate
      steps:
        - setWeight: 5
        - pause: { duration: 10m }
        - setWeight: 25
        - pause: { duration: 10m }
        - setWeight: 50
        - pause: { duration: 10m }` },
        { p: 'The [[blast|blast radius]] is now 5% of users instead of everyone. Tools such as Argo Rollouts and Flagger run the analysis and promote or abort on their own.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Analysis', title: 'Let the numbers decide', scene: 'depCanary', done: 3,
      say: 'Every minute the analysis checks the canary\'s error rate against a limit set in advance; the baseline is drawn for reference. At minute nine the canary passes 1%, and the rollout aborts by itself.',
      read: { tiles: [tile('Baseline v1.4', '0.1%', 'errors'), tile('Canary v1.5', '1.6%', 'at the abort', 'bad'), tile('Users exposed', '5%', 'errors from minute 9')] },
      blocks: [
        { p: 'Decide the limits before the rollout: error rate, p99 latency, maybe a business metric such as checkouts per minute. A human staring at dashboards is slower and less consistent than a rule.' },
        { callout: 'warn', title: 'Small canaries need time', text: 'At 5% of a quiet service, a few minutes may hold only a handful of requests. Wait for enough traffic before trusting the comparison.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Abort', title: 'The canary gets sick, and only 5% notice', done: 3,
      say: 'v1.5 fails for one payment provider. The canary is cut to 0% and every request goes back to v1.4.',
      set: { green: { sub: 'errors: 1.6%' }, blue: { sub: '100% of traffic' } },
      edges: [['users', 'lb'], ['lb', 'blue', { label: '100%' }], ['lb', 'green', { dash: true, tone: 'bad', label: '0%' }]],
      flows: [['users', 'lb', { n: 4 }], ['lb', 'blue', { n: 5 }]],
      state: { green: 'bad' },
      metrics: { share: '0%', err: '0.1%', rollback: 'automatic' },
      blocks: [
        { p: 'Total impact: 5% of users for the nine minutes the canary ran, instead of everyone until someone notices.' },
        { p: 'Next: reproduce the failure, fix it, and start a new canary with the fixed version. Nobody had to roll back by hand.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Feature flags', title: 'Deploy dark, release with a flag', done: 4,
      say: 'Ship the new checkout to production switched off. Turn it on for staff, then 1% of customers, then everyone, without another deploy.',
      add: ['flags'],
      set: { blue: { label: 'All servers · v1.6', sub: 'customers: old checkout' }, green: { label: 'New checkout', sub: 'v1.6 code, staff only', kind: 'note' }, flags: { sub: 'checkout: staff' } },
      edges: [['users', 'lb'], ['lb', 'blue'], ['flags', 'blue', { dash: true, tone: 'accent', label: 'per user' }], ['blue', 'green', { dash: true, tone: 'ok' }]],
      flows: [['users', 'lb', { n: 3 }], ['lb', 'blue', { n: 3 }], ['blue', 'green', { n: 1, tone: 'ok' }]],
      state: { flags: 'hl' },
      metrics: { share: '—', err: '0.1%', down: '0', rollback: 'flip the flag' },
      blocks: [
        { lang: 'ts', code: `// inside the app, on every request
const on = flags.isEnabled('new-checkout',
  { userId: user.id });
if (on) return newCheckout(cart);
return oldCheckout(cart);` },
        { p: 'A [[flag|feature flag]] separates deploying (a technical event) from releasing (a business decision). Turning the feature off takes seconds and needs no deploy.' },
        { callout: 'warn', title: 'Flags are debt', text: 'Each flag doubles the paths to test. Give every flag an owner and a removal date, and delete it once the feature is fully on.' },
      ],
    },
    {
      lvl: 'intermediate', label: 'Check', title: 'Quick check', done: 4,
      say: 'Pick the strategy that fits each situation.',
      check: {
        type: 'match', q: 'Which strategy fits each release best?', bins: ['Rolling update', 'Blue-green', 'Canary', 'Feature flag'],
        bugs: [
          { t: 'A routine library upgrade to a stateless API with 20 replicas', a: 0, why: 'Low risk, many identical instances: the default rolling update is enough.', hint: 'Does this need anything more than the default?' },
          { t: 'A risky payment change; you want real traffic on it, but only a little at first', a: 2, why: 'A small slice of real traffic, checked by metrics, is what a canary is for.', hint: 'Who should see it first, and how many of them?' },
          { t: 'Marketing wants the new pricing page live at 09:00 on launch day', a: 3, why: 'Deploy it days before, switched off, and flip the flag at 09:00. Release becomes a business decision.', hint: 'Does the deploy need to happen at 09:00?' },
          { t: 'A major version where rollback must take seconds and you can afford double capacity', a: 1, why: 'Blue-green keeps the old environment running, so going back is one routing change.', hint: 'Which strategy keeps a complete old copy ready?' },
        ],
      },
    },
    {
      lvl: 'intermediate', label: 'Recap', title: 'Recap: limit the blast radius', done: 4,
      say: 'Recreate is simple but goes dark. Rolling avoids downtime. Blue-green switches and rolls back in seconds. Canaries let metrics decide. Flags separate deploy from release.',
      flows: [],
      state: {},
      blocks: [
        { ul: [
          '**Recreate:** simple, with downtime. **Rolling:** no downtime, slower rollback.',
          '**Blue-green:** instant switch and rollback, at the cost of double capacity.',
          '**Two versions at once:** change schemas with expand and contract.',
          '**Canary:** real traffic on a small slice, promoted or aborted by metrics.',
          '**Feature flags:** deploy dark, release by flipping a switch, then remove the flag.',
        ] },
      ],
    },
  ],
};
