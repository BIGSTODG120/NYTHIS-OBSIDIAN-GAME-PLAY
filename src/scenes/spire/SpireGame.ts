// SpireGame.ts — NYTHIS Original "Obsidian Spire"
// Vertical crystal tower puzzle. Player places fragments onto rotating platforms.
// Upgrade 1: Rewind 3s (1 charge per level)
// Upgrade 2: Crystal Sense (1-second safe-path highlight, 2 charges per level)

export type SpireStatus = 'menu' | 'playing' | 'level-clear' | 'gameover'

export interface Platform {
  ringId: number          // 0 = base, ascending
  rotation: number        // current rotation in radians
  rotSpeed: number        // rad/sec
  // 8 slots around the ring; true = solid, false = gap
  slots: boolean[]
}

export interface Fragment {
  ringId: number          // which ring the fragment sits on
  angle: number           // angular position in radians
  placedAtMs: number      // timestamp for rewind history
}

export interface RewindSnapshot {
  ms: number
  fragments: Fragment[]
  platformsRotation: number[]
}

export interface SpireState {
  status: SpireStatus
  level: number
  platforms: Platform[]
  fragments: Fragment[]
  // Player cursor
  cursorAngle: number     // radians
  cursorRing: number      // which ring the cursor is currently pointing at
  // Upgrade 1: Rewind 3s
  rewindCharges: number
  rewindHistory: RewindSnapshot[]  // last 3s of snapshots
  rewindsUsed: number
  // Upgrade 2: Crystal Sense
  senseCharges: number
  senseActiveUntilMs: number       // wall-clock ms when current sense pulse ends
  sensesUsed: number
  // Time
  levelStartMs: number
  totalTimeMs: number
  // Win/loss
  fragmentsRequired: number
  fragmentsPlacedThisLevel: number
  // Internals
  nowMs: number
}

export const PLATFORMS_PER_LEVEL = (level: number) => Math.min(3 + level, 8)
export const FRAGMENTS_PER_LEVEL = (level: number) => 2 + level
export const SLOTS_PER_RING = 8
export const REWIND_WINDOW_MS = 3000
export const SENSE_DURATION_MS = 1000
export const REWIND_CHARGES_PER_LEVEL = 1
export const SENSE_CHARGES_PER_LEVEL = 2

function makePlatform(ringId: number, level: number): Platform {
  // Each platform has 5-6 solid slots out of 8 (gaps = misalignment risk)
  const slots: boolean[] = []
  const solidCount = 6 - Math.min(level, 2)  // tighter at higher levels
  const solidIndices = new Set<number>()
  while (solidIndices.size < solidCount) {
    solidIndices.add(Math.floor(Math.random() * SLOTS_PER_RING))
  }
  for (let i = 0; i < SLOTS_PER_RING; i++) slots.push(solidIndices.has(i))
  // Rotation speed alternates direction per ring, scales with level
  const dir = ringId % 2 === 0 ? 1 : -1
  const base = 0.35 + level * 0.06
  return {
    ringId,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: dir * base,
    slots,
  }
}

export function createState(): SpireState {
  return {
    status: 'menu',
    level: 1,
    platforms: [],
    fragments: [],
    cursorAngle: 0,
    cursorRing: 0,
    rewindCharges: 0,
    rewindHistory: [],
    rewindsUsed: 0,
    senseCharges: 0,
    senseActiveUntilMs: 0,
    sensesUsed: 0,
    levelStartMs: 0,
    totalTimeMs: 0,
    fragmentsRequired: 0,
    fragmentsPlacedThisLevel: 0,
    nowMs: 0,
  }
}

export function startGame(state: SpireState, startLevel = 1): void {
  state.status = 'playing'
  state.level = startLevel
  state.totalTimeMs = 0
  startLevel_impl(state, startLevel)
}

function startLevel_impl(state: SpireState, level: number): void {
  state.level = level
  state.platforms = []
  state.fragments = []
  state.cursorAngle = 0
  state.cursorRing = 0
  state.rewindCharges = REWIND_CHARGES_PER_LEVEL
  state.rewindHistory = []
  state.senseCharges = SENSE_CHARGES_PER_LEVEL
  state.senseActiveUntilMs = 0
  state.levelStartMs = state.nowMs
  state.fragmentsRequired = FRAGMENTS_PER_LEVEL(level)
  state.fragmentsPlacedThisLevel = 0
  const platformCount = PLATFORMS_PER_LEVEL(level)
  for (let i = 0; i < platformCount; i++) state.platforms.push(makePlatform(i, level))
}

// Move cursor angularly
export function moveCursor(state: SpireState, dAngle: number): void {
  if (state.status !== 'playing') return
  state.cursorAngle = (state.cursorAngle + dAngle) % (Math.PI * 2)
  if (state.cursorAngle < 0) state.cursorAngle += Math.PI * 2
}

// Move cursor between rings
export function changeRing(state: SpireState, delta: number): void {
  if (state.status !== 'playing') return
  state.cursorRing = Math.max(0, Math.min(state.platforms.length - 1, state.cursorRing + delta))
}

// Place fragment on current ring at current angle.
// Returns true if placed successfully (cursor was over a solid slot).
export function placeFragment(state: SpireState): boolean {
  if (state.status !== 'playing') return false
  const platform = state.platforms[state.cursorRing]
  if (!platform) return false
  // Which slot is the cursor pointing at, given platform rotation?
  const relativeAngle = (state.cursorAngle - platform.rotation + Math.PI * 4) % (Math.PI * 2)
  const slotIndex = Math.floor((relativeAngle / (Math.PI * 2)) * SLOTS_PER_RING) % SLOTS_PER_RING
  if (!platform.slots[slotIndex]) {
    // Missed — penalty: lose a fragment requirement increment (force one more placement)
    state.fragmentsRequired++
    return false
  }
  state.fragments.push({
    ringId: state.cursorRing,
    angle: state.cursorAngle,
    placedAtMs: state.nowMs,
  })
  state.fragmentsPlacedThisLevel++
  if (state.fragmentsPlacedThisLevel >= state.fragmentsRequired) {
    state.status = 'level-clear'
  }
  return true
}

// Upgrade 1: Rewind 3 seconds
export function rewind(state: SpireState): boolean {
  if (state.status !== 'playing') return false
  if (state.rewindCharges <= 0) return false
  const cutoff = state.nowMs - REWIND_WINDOW_MS
  // Drop fragments placed in window
  const beforeCount = state.fragments.length
  state.fragments = state.fragments.filter((f) => f.placedAtMs < cutoff)
  const dropped = beforeCount - state.fragments.length
  state.fragmentsPlacedThisLevel = Math.max(0, state.fragmentsPlacedThisLevel - dropped)
  // Find oldest valid snapshot
  const snap = [...state.rewindHistory].reverse().find((s) => s.ms <= cutoff)
  if (snap) {
    for (let i = 0; i < state.platforms.length; i++) {
      const r = snap.platformsRotation[i]
      if (r !== undefined && state.platforms[i]) state.platforms[i]!.rotation = r
    }
  }
  state.rewindHistory = state.rewindHistory.filter((s) => s.ms < cutoff)
  state.rewindCharges--
  state.rewindsUsed++
  return true
}

// Upgrade 2: Crystal Sense — highlight safe slots for 1s
export function crystalSense(state: SpireState): boolean {
  if (state.status !== 'playing') return false
  if (state.senseCharges <= 0) return false
  state.senseCharges--
  state.sensesUsed++
  state.senseActiveUntilMs = state.nowMs + SENSE_DURATION_MS
  return true
}

export function senseActive(state: SpireState): boolean {
  return state.nowMs < state.senseActiveUntilMs
}

// Advance to next level after level-clear
export function nextLevel(state: SpireState): void {
  if (state.status !== 'level-clear') return
  startLevel_impl(state, state.level + 1)
  state.status = 'playing'
}

export function tick(state: SpireState, dtMs: number): void {
  state.nowMs += dtMs
  if (state.status !== 'playing') return
  state.totalTimeMs += dtMs

  // Rotate platforms
  const dtSec = dtMs / 1000
  for (const p of state.platforms) {
    p.rotation = (p.rotation + p.rotSpeed * dtSec) % (Math.PI * 2)
    if (p.rotation < 0) p.rotation += Math.PI * 2
  }

  // Capture rewind snapshot every 100ms
  if (state.rewindHistory.length === 0 || state.nowMs - state.rewindHistory[state.rewindHistory.length - 1]!.ms >= 100) {
    state.rewindHistory.push({
      ms: state.nowMs,
      fragments: state.fragments.map((f) => ({ ...f })),
      platformsRotation: state.platforms.map((p) => p.rotation),
    })
    // Trim history older than window
    const cutoff = state.nowMs - REWIND_WINDOW_MS - 100
    while (state.rewindHistory.length > 0 && state.rewindHistory[0]!.ms < cutoff) {
      state.rewindHistory.shift()
    }
  }
}

export function totalSecondsStr(state: SpireState): string {
  const s = Math.floor(state.totalTimeMs / 1000)
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${m}:${ss.toString().padStart(2, '0')}`
}
