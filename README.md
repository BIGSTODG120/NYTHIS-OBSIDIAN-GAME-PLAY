# NYTHIS Obsidian Game Play

**The classics, sharpened.**

Seven arcade games rebuilt with React Three Fiber, Zustand, and a cosmic environment that drifts behind every scene.

[**Play it live →**](https://bigstodg120.github.io/NYTHIS-OBSIDIAN-GAME-PLAY/)

---

## What is shipped

| Game | Inspired by | Mechanics |
|---|---|---|
| Obsidian Pong | Pong (1972) | Local 2P + 3-tier AI |
| Obsidian Snake | Snake (1976) | Wraparound + combo chain |
| Obsidian Break | Breakout (1976) | Paddle spin + power drops |
| Obsidian Sweep | Minesweeper (1989) | Chord-click + daily seed |
| Obsidian Drift | Asteroids (1979) | Thrust trail + hyperspace |
| Obsidian Stack | Tetris (1984) | Hold + ghost + endless garbage |
| Obsidian Spire | NYTHIS Original (2026) | 3s rewind + crystal sense |

## Stack

- React 18.3.1 + TypeScript (strict mode)
- React Three Fiber 8.17.10 + Three.js 0.160
- Zustand 4.5.5
- Tailwind 4
- Vite 5.4
- Playwright (20-spec gate, single worker)

## Cosmic environment

Every scene renders behind a single fixed Canvas2D cosmic layer: drifting violet nebulas with three radial anchors, twin counter-rotating galaxy spirals, three depth tiers of parallax stars (770+ on a standard viewport), and diagonal light streaks. Pure 2D for performance. Paused on tab blur to save battery.

## Local development

```bash
npm install
npm run dev      # localhost:5173
npm run build    # strict tsc -b + vite build
npm run test     # Playwright 20-spec gate
npm run deploy   # gh-pages -d dist
```

## Quality gates

- Strict TypeScript build (`tsc -b` exit 0)
- Playwright 20-spec gate (workers=1, fullyParallel=false)
- Bundle cap: 8,000 KB (currently 1,249 KB, 15.6%)
- Visual gate: cosmic environment confirmed in browser before every ship

## License

MIT. Free to fork, study, ship. No tracking, no upsell, no premium tier.

## Built by

[BIGSTODG120](https://github.com/BIGSTODG120) — Director of TOA Legacy Consulting, founder of NYTHIS.

Six arcade classics seeded a $300 billion industry. Most builders today couldn't ship one of them clean. This repo shipped seven.
