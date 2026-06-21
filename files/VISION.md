# VISION.md — NYTHIS OBSIDIAN GAME PLAY v2

> **STATUS:** LOCKED 2026-06-16
> **Phase:** 0 — Vision Lock
> **Doctrine:** V4 (nythis-production-saas-v3 skill)
> **Operator:** Christopher Stodghill / BIGSTODG

---

## 1. Mission

A premium 3D arcade hub where classic mechanics feel like cinematic worlds. Open-source. Browser-native. Local-first. Forged in the NYTHIS obsidian aesthetic.

## 2. The "Feels Like" Line

**Feels like Monument Valley, not like a Steam asset flip.**

Hand-crafted intent in every angle, light, and motion. No marketplace-asset look. No generic 3D demo polish. Every surface reads as designed.

## 3. Visual Benchmarks (Operator-Locked)

Per operator override 2026-06-16: **the classic games themselves are the visual references.** Mechanics are public-domain; visual identity is rebuilt from NYTHIS brand DNA.

| Element | Lock |
|---|---|
| Primary surface | Obsidian black `#0a0a0a` |
| Crystal accent (cool) | Violet electric `#7a4cd6` |
| Ember accent (warm) | Deep amber `#c8932a` |
| Foreground text | Off-white `#e8eef5` |
| Muted text | `#8a8a8a` |
| Geometric motif | Fractured crystal facets (NYTHIS logo derived) |
| Lighting model | Single key light + ambient + violet rim |
| Typography | `ui-monospace` system stack — no external fonts |

## 4. The Anti-Vision (What This Is NOT)

- Not a marketplace 3D asset flip
- Not a Flash-era browser game with Three.js coat of paint
- Not a Subway Surfers clone
- Not Steam shovelware aesthetic
- Not a children's product (Venus Star Kids covers that)
- Not Web3 / NFT / blockchain
- Not pixel art retro homage
- Not "minimum viable arcade"

## 5. Production Value Tier

**Mid-tier polished** with stretch reach toward premium-ambitious. Operator override on file: contradiction between Mid-tier and Monument-Valley-feel held open for iteration.

Locks:
- Clean shaders, no jank
- Stable 60fps on 3-year-old laptop iGPU
- Mobile-playable
- Bundle ≤ 8 MB gzipped initial load
- No "coming soon" placeholders

## 6. Audience Reaction Target

**"Wait, this runs in a browser?"**

The renderer, lighting, and motion are the headline — not the 50-year-old gameplay mechanics.

## 7. Operator Success Criteria

v2.0 ships when:
- NYTHIS-branded hub renders the obsidian crystal mark as the world's anchor
- All six classics rebuilt as cinematic 2.5D experiences (Pong, Snake, Sweep, Break, Drift, Stack)
- One original headline 3D title (Obsidian Spire)
- Two-Upgrade Rule preserved per game
- Mid-tier polished + Monument Valley aspiration
- MIT licensed, open-source, browser-only
- No GitHub push until all 8 experiences ship clean

## 8. Stack Implications

- React 18 + R3F + Drei + Three.js r160
- Vite + TypeScript strict
- Tailwind v4 for UI surfaces
- Zustand for shared state
- 2.5D matte-painting (Path 2)
- ComfyUI/SD art pipeline (operator-owned, local-first)
- No backend, accounts, telemetry

## 9. Contradictions on File (Operator Override 2026-06-16)

| Tension | Status |
|---|---|
| Mid-tier tier vs Monument Valley reference | Override active — iterate toward |
| "Ship when ready" vs 8 cinematic 3D experiences | Accepted — operator drives tempo |
| No public commits until done vs 3-6 month scope | Accepted |

## 10. Change Control

VISION.md is immutable for v2 build. Edits trigger SPEC RESET: new AUDIT, updated VISION, new SPEC.lock, restart of current Phase 3 pass, prior work archived.

---

```
VISION.md frozen: 2026-06-16
Approved by: Operator override (BIGSTODG)
Skill: nythis-production-saas-v3 (V4 doctrine)
Project: NYTHIS Obsidian Game Play v2
Next phase: Phase 1 — Repository Audit
```
