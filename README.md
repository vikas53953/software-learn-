# Load-Bearing

An interactive software engineering course. Every concept is an animated diagram you step through, with the code beside it.

**16 lessons · 111 steps · 6 modules:** Design Principles (SOLID), Design Patterns, Testing, Delivery (CI/CD), Concurrency, Architecture.

## Run
```bash
npm install
npm run dev      # local dev server
npm run gates    # lint, content check, unit + property tests, build
npm run preview & npm run e2e   # sweep every step in a real browser
```

How changes are verified and merged is in `CLAUDE.md` and `docs/PIPELINE.md`.
```bash
npm run build    # static site in dist/ (deployed by Vercel on every push)
```

## How it is built
- Vite + plain JavaScript, no framework. Hash routing (`#/<lesson>/<step>`), so every step has a link.
- `src/diagram.js`: a keyed SVG scene renderer. Lessons declare nodes once; each step lists what appears, edges, animated packet flows, node states and metrics.
- `src/content/*.js`: all lesson content as data. Add a lesson by adding an object and listing it in `src/content/index.js`.
- Keyboard: ← → step, R replay, Space pause, F full screen, Ctrl K search.
