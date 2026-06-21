// Pure Snake game logic. No React, no rendering. Deterministic.

export const GRID = { cols: 24, rows: 16 } as const
export const START_SPEED = 7
export const MAX_SPEED = 16
export const SPEEDUP_PER_FRUIT = 0.18
export const COMBO_WINDOW_MS = 3000

export type Dir = "up" | "down" | "left" | "right"

export interface Cell { x: number; y: number }

export interface SnakeState {
  segments: Cell[]
  prevSegments: Cell[]
  dir: Dir
  pendingDir: Dir
  fruit: Cell
  alive: boolean
  status: "menu" | "playing" | "gameover"
  score: number
  multiplier: number
  maxChainThisRun: number
  lastFruitAt: number
  fruitsEaten: number
  speed: number
  tickAcc: number
  stepInterval: number
  startTime: number
  // Visual event flags - cleared by scene each frame after consumption
  fruitEatPulseAt: number   // timestamp of last fruit eat, for pulse animation
  wrapFlashFrom: Cell | null  // edge cell where snake exited
  wrapFlashTo: Cell | null    // edge cell where snake re-entered
}

export function createSnake(): SnakeState {
  const midX = Math.floor(GRID.cols / 2)
  const midY = Math.floor(GRID.rows / 2)
  const segs: Cell[] = [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ]
  return {
    segments: segs,
    prevSegments: segs.map((c) => ({ ...c })),
    dir: "right",
    pendingDir: "right",
    fruit: { x: midX + 4, y: midY },
    alive: true,
    status: "menu",
    score: 0,
    multiplier: 1,
    maxChainThisRun: 1,
    lastFruitAt: 0,
    fruitsEaten: 0,
    speed: START_SPEED,
    tickAcc: 0,
    stepInterval: 1 / START_SPEED,
    startTime: 0,
    fruitEatPulseAt: 0,
    wrapFlashFrom: null,
    wrapFlashTo: null,
  }
}

export function startGame(s: SnakeState): void {
  const fresh = createSnake()
  Object.assign(s, fresh)
  s.status = "playing"
  s.startTime = performance.now()
}

export function setDir(s: SnakeState, dir: Dir): void {
  if (s.status !== "playing") return
  const opp: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" }
  if (opp[dir] === s.dir) return
  s.pendingDir = dir
}

// Returns the fractional progress (0..1) toward the next grid step
export function getStepProgress(s: SnakeState): number {
  if (s.status !== "playing") return 0
  return Math.min(s.tickAcc / s.stepInterval, 1)
}

export function tick(s: SnakeState, dt: number, wraparound: boolean): void {
  if (s.status !== "playing") return

  // Decay combo if window expired
  const now = performance.now()
  if (s.multiplier > 1 && now - s.lastFruitAt > COMBO_WINDOW_MS) {
    s.multiplier = 1
  }

  s.tickAcc += dt
  s.stepInterval = 1 / s.speed
  if (s.tickAcc < s.stepInterval) return
  s.tickAcc -= s.stepInterval

  // Snapshot prev positions for interpolation
  s.prevSegments = s.segments.map((c) => ({ ...c }))

  s.dir = s.pendingDir
  const head = s.segments[0]
  if (!head) return

  let nx = head.x
  let ny = head.y
  if (s.dir === "right") nx += 1
  else if (s.dir === "left") nx -= 1
  else if (s.dir === "up") ny += 1
  else if (s.dir === "down") ny -= 1

  // Wall behavior with visual flash data
  let wrapped = false
  if (wraparound) {
    if (nx < 0) { s.wrapFlashFrom = { x: 0, y: ny }; nx = GRID.cols - 1; s.wrapFlashTo = { x: nx, y: ny }; wrapped = true }
    else if (nx >= GRID.cols) { s.wrapFlashFrom = { x: GRID.cols - 1, y: ny }; nx = 0; s.wrapFlashTo = { x: nx, y: ny }; wrapped = true }
    else if (ny < 0) { s.wrapFlashFrom = { x: nx, y: 0 }; ny = GRID.rows - 1; s.wrapFlashTo = { x: nx, y: ny }; wrapped = true }
    else if (ny >= GRID.rows) { s.wrapFlashFrom = { x: nx, y: GRID.rows - 1 }; ny = 0; s.wrapFlashTo = { x: nx, y: ny }; wrapped = true }
  } else {
    if (nx < 0 || nx >= GRID.cols || ny < 0 || ny >= GRID.rows) {
      s.alive = false; s.status = "gameover"; return
    }
  }

  if (!wrapped) {
    // Clear stale wrap data after one tick of visibility
    if (s.wrapFlashFrom && now - s.lastFruitAt > 250) {
      s.wrapFlashFrom = null; s.wrapFlashTo = null
    }
  }

  // Self collision (skip tail tip which moves out of slot)
  for (let i = 0; i < s.segments.length - 1; i++) {
    const seg = s.segments[i]
    if (seg && seg.x === nx && seg.y === ny) {
      s.alive = false; s.status = "gameover"; return
    }
  }

  const eatingFruit = nx === s.fruit.x && ny === s.fruit.y

  s.segments.unshift({ x: nx, y: ny })
  if (!eatingFruit) {
    s.segments.pop()
  } else {
    if (s.lastFruitAt > 0 && now - s.lastFruitAt <= COMBO_WINDOW_MS) {
      s.multiplier = Math.min(s.multiplier + 1, 9)
    } else {
      s.multiplier = 1
    }
    s.lastFruitAt = now
    if (s.multiplier > s.maxChainThisRun) s.maxChainThisRun = s.multiplier
    s.score += s.multiplier
    s.fruitsEaten += 1
    s.fruitEatPulseAt = now
    s.speed = Math.min(s.speed + SPEEDUP_PER_FRUIT, MAX_SPEED)
    placeFruit(s)
  }
}

function placeFruit(s: SnakeState): void {
  const occupied = new Set(s.segments.map((c) => `${c.x},${c.y}`))
  const free: Cell[] = []
  for (let x = 0; x < GRID.cols; x++) {
    for (let y = 0; y < GRID.rows; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  if (free.length === 0) { s.status = "gameover"; return }
  const idx = Math.floor(Math.random() * free.length)
  const pick = free[idx]
  if (pick) { s.fruit.x = pick.x; s.fruit.y = pick.y }
}
