# SPEC.lock-v2.md — NYTHIS Obsidian Game Play v2

> **STATUS:** LOCKED 2026-06-16
> **Doctrine:** V4
> **Visual gate:** OVERRIDE — classics + brand are references

---

## 1. Mission (verbatim from VISION.md §1)

A premium 3D arcade hub where classic mechanics feel like cinematic worlds. Open-source. Browser-native. Local-first. Forged in the NYTHIS obsidian aesthetic.

## 2. Product Identity

- Name: NYTHIS Obsidian Game Play
- Repo slug: `nythis-obsidian-game-play`
- License: MIT
- Canonical path: `C:\Users\NYTHIS OBSIDIAN\Desktop\nythis-obsidian-game-play\`
- Brand voice: Corporate, foundational, premium
- Tagline: *The classics, sharpened.*

## 3. Scope Lock — v2 (8 Experiences)

| # | Pass | Name | Origin | Headline |
|---|---|---|---|---|
| 0 | 3.0 | NYTHIS Hub | — | Cinematic launcher, crystal world |
| 1 | 3.1 | Obsidian Pong | Pong (1972) | Paddle vs paddle, 3 AI tiers |
| 2 | 3.2 | Obsidian Snake | Snake (1976) | Grid, wraparound, combo |
| 3 | 3.3 | Obsidian Break | Breakout (1976) | Paddle, brick power-ups |
| 4 | 3.4 | Obsidian Sweep | Minesweeper (1989) | Logic grid, daily seed |
| 5 | 3.5 | Obsidian Drift | Asteroids (1979) | Vector shooter, hyperspace |
| 6 | 3.6 | Obsidian Stack | Tetris (1984) | Hold + ghost, endless garbage |
| 7 | 3.7 | **Obsidian Spire** ⭐ | NEW NYTHIS ORIGINAL | Vertical crystal tower puzzle |

**Exactly 8. No more in v2.**

### Obsidian Spire (locked design)

- Mechanic: Ascend a procedurally-fractured crystal tower; rotate tower per level; place obsidian fragments to bridge gaps.
- Two Upgrades: (a) Rewind 3 sec (one charge/level) (b) Crystal Sense (briefly highlights safest path)

## 4. The Two-Upgrade Rule

Every game ships with exactly two deliberate upgrades over its origin. Compile-time enforced via `[Upgrade, Upgrade]` tuple. Verbatim carry from v1.

## 5. Hard Restrictions

- No backend, database, auth, server code
- CC0/MIT/original NYTHIS art only
- No analytics, telemetry, trackers
- No trademarked game names
- Bundle ≤ 8 MB gzipped initial load
- iOS Safari + Android Chrome + desktop browsers
- 60fps target on Intel Iris Xe / mid-range Android
- No "coming soon" anywhere
- No GitHub push until v2.0.0 complete
- Headline original designed and approved before its pass starts

## 6. Stack — Pinned

```
react: ^18.3.0
react-dom: ^18.3.0
three: ^0.160.0
@react-three/fiber: ^8.17.0
@react-three/drei: ^9.114.0
@react-three/postprocessing: ^2.16.0
zustand: ^4.5.0
tailwindcss: ^4.0.0
@tailwindcss/vite: ^4.0.0
vite: ^5.4.0
typescript: ^5.3.0
```

**Forbidden:** Phaser, Babylon, PlayCanvas, P5, jQuery, lodash, moment, axios.

## 7. Architecture

```
nythis-obsidian-game-play/
├── public/
│   ├── brand/                  # NYTHIS logo + derivatives
│   └── art/                    # ComfyUI export drop zone
├── src/
│   ├── main.tsx                # React entry
│   ├── App.tsx                 # Top-level scene switcher
│   ├── core/
│   │   ├── store.ts            # Zustand: scene, mute, settings
│   │   ├── storage.ts          # nogp:v2:<scene>:<key> namespace
│   │   └── types.ts            # NythisGame contract (tuple upgrades)
│   ├── scenes/
│   │   └── hub/HubScene.tsx
│   ├── render/
│   │   ├── Stage.tsx           # R3F Canvas + lighting
│   │   └── CrystalShard.tsx    # NYTHIS brand object
│   ├── ui/
│   │   └── HubShell.tsx        # Wordmark + tagline + footer
│   └── styles/
│       └── obsidian.css
├── VISION.md / AUDIT-v2.md / SPEC.lock-v2.md / ASSETS.md
├── LICENSE / README.md / package.json / tsconfig.json / vite.config.ts
```

localStorage namespace: `nogp:v2:<scene-id>:<key>`

## 8. Contracts

```ts
export interface Upgrade {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}
export type UpgradePair = readonly [Upgrade, Upgrade];
export interface NythisGame {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly upgrades: UpgradePair;
  readonly Scene: React.ComponentType;
  readonly Menu?: React.ComponentType<{ onStart: () => void }>;
  getScore(): number;
  getHighScore(): number;
}
```

## 9. Deployment

- Target: GitHub Pages
- Path: `gh-pages` via Actions on main push
- Vite base: `/nythis-obsidian-game-play/`
- Pre-deploy gate: Phase 5 score ≥ 95
- No public commits until v2.0.0

## 10. Ship Readiness Criteria

- [ ] All 8 experiences mount, play start→score→hub
- [ ] Both upgrades functional per game
- [ ] Bundle ≤ 8 MB gzipped
- [ ] 60fps on Iris Xe / M1 / mid Android
- [ ] iOS Safari + Android Chrome touch verified
- [ ] Zero console errors anywhere
- [ ] NYTHIS brand in every scene
- [ ] High scores persist with `nogp:v2:*`
- [ ] All assets in ASSETS.md with SHA256
- [ ] LICENSE (MIT)
- [ ] README with screenshots/GIFs
- [ ] Clean-clone install ≤ 90 sec
- [ ] Deploy URL serves live build

## 11. No-Fake Audit Rules

Fail if:
- Game card exists but scene doesn't mount
- < 2 functional upgrades per game
- Upgrade listed but doesn't fire
- "Coming soon" placeholder ships
- Bundle > 8 MB gzipped
- Asset without ASSETS.md entry
- Trademarked name in code/UI
- localStorage key violates `nogp:v2:`
- Console errors in any scene
- FPS < 45 on target hardware

## 12. Out of Scope — Parked

Multiplayer, leaderboards, accounts, achievements, social sharing (beyond daily seed), PWA, theme switcher, localization, Render deploy.

## 13. Phase 3 Pass Ordering

| Pass | Output | Gate |
|---|---|---|
| 3.0 | Hub + R3F pipeline + core + brand | Hub renders crystal in R3F, 0 console errors, bundle < 1.5 MB |
| 3.1 | Obsidian Pong | Upgrades functional + visual gate |
| 3.2 | Obsidian Snake | Same |
| 3.3 | Obsidian Break | Same |
| 3.4 | Obsidian Sweep | Same |
| 3.5 | Obsidian Drift | Same |
| 3.6 | Obsidian Stack | Same |
| 3.7 | Obsidian Spire | Original verified + upgrades functional |
| 3.8 | Audio + mobile + polish + README + ASSETS | Ship readiness ≥ 95 |

## 14. Change Control

SPEC.lock-v2.md immutable for v2. SPEC RESET protocol: written approval → new AUDIT → updated VISION → new SPEC.lock → archive prior work → restart current pass.

## 15. Lock Manifest

LOCKED:
- 8 experiences
- Stack pins §6
- Bundle 8 MB gzipped
- 60fps target
- Two-Upgrade Rule
- MIT
- nogp:v2 namespace
- Pass ordering 3.0→3.8
- Repo slug
- Canonical path
- Brand DNA tokens
- Obsidian Spire design

---

```
SPEC.lock-v2.md frozen: 2026-06-16
Approved by: Operator (BIGSTODG)
Skill: nythis-production-saas-v3 (V4)
Visual gate: OVERRIDE
Next phase: Phase 3 — Pass 3.0 (Hub + R3F pipeline)
```
