# AUDIT-v2.md — NYTHIS Obsidian Game Play v2

**Project:** NYTHIS Obsidian Game Play v2
**Workflow:** V4 doctrine (nythis-production-saas-v3 skill)
**Phase:** 1 — Repository Audit
**Audit date:** 2026-06-16
**Canonical path:** `C:\Users\NYTHIS OBSIDIAN\Desktop\nythis-obsidian-game-play\`

---

## 1. Repo Snapshot

Greenfield + Vite React-TS scaffold. v1 preserved at `Desktop\nythis-obsidian-game-play-ARCHIVE\20260616-v1-2d-canvas\`.

## 2. VISION.md Alignment

All 7 vision sections locked. Brand DNA tokens in §3 carry directly into SPEC.lock §7.

## 3. Risk Register

| # | Severity | Risk | Mitigation |
|---|---|---|---|
| R1 | HIGH | Mid-tier vs Monument Valley contradiction | Iterative quality bar per pass; Pass 3.0 baseline; visual gate per game |
| R2 | HIGH | 8 cinematic 3D experiences = 3-6 month scope | Pass-by-pass gates; cut scope before extending |
| R3 | HIGH | Bundle budget under R3F + Drei + Three.js | Dynamic per-game chunks; KTX2/Basis textures; LOD on complex meshes |
| R4 | HIGH | ComfyUI/SD pipeline unproven | Pass 3.0 placeholder pipeline; first game introduces real matte layers |
| R5 | MED | Mobile/touch parity across 7 mechanics | Unified input layer from v1 archive; verify per pass |
| R6 | MED | iOS Safari WebGL2 quirks | Test scene Pass 3.0 on real iOS; context-loss recovery |
| R7 | MED | NYTHIS brand assets in v1 archive only | Copy logo + brand PNGs in Pass 3.0; SHA256 into ASSETS.md |
| R8 | LOW | Two-Upgrade Rule tuple | Verbatim carry from v1 |
| R9 | LOW | Audio (Kenney CC0) | Defer to Pass 3.8 |
| R10 | LOW | Deployment | Deferred — no push until v2 complete |

## 4. Cut List (vs v1)

- Canvas 2D rendering → CUT
- DOM Sweep → CUT
- 1.5 MB bundle → CUT (raised to 8 MB)
- Tailwind v4 UI → KEEP
- Two-Upgrade Rule → KEEP
- MIT → KEEP
- No backend → KEEP
- GitHub Pages → KEEP
- 6 classics → KEEP + EXTEND (+1 original)

## 5. Add List

- React + R3F + Drei + Three.js (vision requirement)
- Zustand (cross-scene state)
- @react-three/postprocessing (cinematic feel)
- ART-PIPELINE.md (new required doc)
- archive/ folder convention (V4 doctrine)
- Obsidian Spire (headline original — designed in SPEC.lock §3)

## 6. Phase 2 Recommendations

Lock into SPEC.lock-v2.md:
- 8 experiences (Hub + 6 classics + Spire)
- Stack pins per §6
- Bundle 8 MB
- 60fps target hardware
- Pass ordering 3.0→3.8

Frozen open questions resolved: R3F+Drei+Three.js r160 pinned; React 18; Tailwind v4; brand DNA per VISION.md §3; Obsidian Spire as headline; repo slug `nythis-obsidian-game-play`; GitHub deferred; Hub→Pong→Snake→Break→Sweep→Drift→Stack→Spire→Polish.

## 7. Blockers

None. Greenfield, vision locked, contradictions on file.

---

```
PHASE: 1 — Repository Audit
FILES READ: VISION.md
FILES CHANGED: AUDIT-v2.md
COMMANDS RUN: filesystem inspection
BLOCKERS: none
NEXT GATE: Operator review → SPEC.lock-v2.md
```
