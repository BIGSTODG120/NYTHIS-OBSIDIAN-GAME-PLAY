// Pure Break game logic. No React, no rendering.

export const ARENA = { width: 11, height: 14 } as const
export const PADDLE = { baseWidth: 2.0, height: 0.3, y: -ARENA.height / 2 + 0.7, speed: 9 } as const
export const BALL = { radius: 0.15, baseSpeed: 7, maxSpeed: 12, speedup: 1.02 } as const
export const BRICK = { cols: 10, rows: 6, width: 0.95, height: 0.4, gap: 0.06, topMargin: 1.2 } as const

// Row scoring (top = highest)
export const ROW_POINTS: readonly number[] = [50, 40, 30, 20, 10, 5]

// Row colors (top = brightest violet, descending shades)
export const ROW_COLORS: readonly string[] = ["#a878ff", "#8e58ee", "#7a4cd6", "#6238b8", "#4a2a8e", "#36206a"]

export const POWER_DROP_CHANCE = 0.18

export type PowerType = "expand" | "multi" | "slow" | "laser"
export const POWER_DURATION_MS: Record<PowerType, number> = {
  expand: 9000,
  multi: 0,    // instant: spawns balls, no timer
  slow: 7000,
  laser: 6000,
}

export interface Brick {
  col: number
  row: number
  alive: boolean
}

export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  active: boolean
}

export interface PowerDrop {
  id: number
  x: number
  y: number
  vy: number
  type: PowerType
  caught: boolean
}

export interface ActivePower {
  type: PowerType
  expiresAt: number
}

export interface BreakState {
  paddleX: number
  paddleVy: number  // not used for movement, used as spin indicator value
  paddleWidth: number
  paddleSpin: number  // -1 = ccw, 0 = none, +1 = cw
  balls: Ball[]
  bricks: Brick[]
  powerDrops: PowerDrop[]
  activePowers: ActivePower[]
  laserShots: { x: number; y: number; alive: boolean }[]
  lives: number
  score: number
  level: number
  status: "menu" | "serving" | "playing" | "lifelost" | "gameover" | "won"
  serveTimer: number
  lifeLostTimer: number
  bricksBroken: number
  powerUpsCaught: number
  lastPowerCaught: PowerType | null
  startTime: number
  nextPowerId: number
}

export function createBreak(): BreakState {
  return {
    paddleX: 0,
    paddleVy: 0,
    paddleWidth: PADDLE.baseWidth,
    paddleSpin: 0,
    balls: [],
    bricks: [],
    powerDrops: [],
    activePowers: [],
    laserShots: [],
    lives: 3,
    score: 0,
    level: 1,
    status: "menu",
    serveTimer: 0,
    lifeLostTimer: 0,
    bricksBroken: 0,
    powerUpsCaught: 0,
    lastPowerCaught: null,
    startTime: 0,
    nextPowerId: 0,
  }
}

function buildBricks(): Brick[] {
  const out: Brick[] = []
  for (let r = 0; r < BRICK.rows; r++) {
    for (let c = 0; c < BRICK.cols; c++) {
      out.push({ col: c, row: r, alive: true })
    }
  }
  return out
}

function brickWorld(b: Brick): { x: number; y: number } {
  const totalW = BRICK.cols * BRICK.width + (BRICK.cols - 1) * BRICK.gap
  const startX = -totalW / 2 + BRICK.width / 2
  const startY = ARENA.height / 2 - BRICK.topMargin - BRICK.height / 2
  return {
    x: startX + b.col * (BRICK.width + BRICK.gap),
    y: startY - b.row * (BRICK.height + BRICK.gap),
  }
}

export { brickWorld }

export function startGame(s: BreakState): void {
  const fresh = createBreak()
  Object.assign(s, fresh)
  s.bricks = buildBricks()
  s.status = "serving"
  s.serveTimer = 0.6
  s.startTime = performance.now()
  s.balls = [{
    x: 0,
    y: PADDLE.y + PADDLE.height + BALL.radius + 0.05,
    vx: 0,
    vy: 0,
    speed: BALL.baseSpeed,
    active: true,
  }]
}

function launchBall(b: Ball): void {
  const angle = (Math.random() - 0.5) * 1.2 + Math.PI / 2  // mostly upward, slight side variance
  b.speed = BALL.baseSpeed
  b.vx = Math.cos(angle) * b.speed
  b.vy = Math.sin(angle) * b.speed
}

export function tick(s: BreakState, dt: number): void {
  const now = performance.now()

  // Expire powers
  s.activePowers = s.activePowers.filter((p) => now < p.expiresAt)
  const expanded = s.activePowers.some((p) => p.type === "expand")
  const slow = s.activePowers.some((p) => p.type === "slow")
  s.paddleWidth = expanded ? PADDLE.baseWidth * 1.55 : PADDLE.baseWidth

  if (s.status === "serving") {
    s.serveTimer -= dt
    const b = s.balls[0]
    if (b) {
      b.x = s.paddleX
      b.y = PADDLE.y + PADDLE.height + BALL.radius + 0.05
    }
    if (s.serveTimer <= 0) {
      if (b) launchBall(b)
      s.status = "playing"
    }
    return
  }

  if (s.status === "lifelost") {
    s.lifeLostTimer -= dt
    if (s.lifeLostTimer <= 0) {
      if (s.lives <= 0) { s.status = "gameover"; return }
      s.balls = [{
        x: s.paddleX,
        y: PADDLE.y + PADDLE.height + BALL.radius + 0.05,
        vx: 0, vy: 0, speed: BALL.baseSpeed, active: true,
      }]
      s.status = "serving"
      s.serveTimer = 0.6
    }
    return
  }

  if (s.status !== "playing") return

  const speedFactor = slow ? 0.7 : 1.0
  const ballScaleDt = dt * speedFactor

  // Update balls
  for (const b of s.balls) {
    if (!b.active) continue
    b.x += b.vx * ballScaleDt
    b.y += b.vy * ballScaleDt

    // Walls
    if (b.x < -ARENA.width / 2 + BALL.radius) { b.x = -ARENA.width / 2 + BALL.radius; b.vx = Math.abs(b.vx) }
    if (b.x > ARENA.width / 2 - BALL.radius) { b.x = ARENA.width / 2 - BALL.radius; b.vx = -Math.abs(b.vx) }
    if (b.y > ARENA.height / 2 - BALL.radius) { b.y = ARENA.height / 2 - BALL.radius; b.vy = -Math.abs(b.vy) }

    // Paddle
    const halfW = s.paddleWidth / 2
    if (
      b.y - BALL.radius <= PADDLE.y + PADDLE.height &&
      b.y - BALL.radius >= PADDLE.y - 0.1 &&
      b.x >= s.paddleX - halfW &&
      b.x <= s.paddleX + halfW &&
      b.vy < 0
    ) {
      b.y = PADDLE.y + PADDLE.height + BALL.radius
      const hitOffset = (b.x - s.paddleX) / halfW
      // Apply paddle spin influence to outgoing angle
      const spinBias = s.paddleSpin * 0.35
      const newAngle = Math.PI / 2 + hitOffset * 0.95 + spinBias
      b.speed = Math.min(b.speed * BALL.speedup, BALL.maxSpeed)
      b.vx = Math.cos(newAngle) * b.speed
      b.vy = Math.sin(newAngle) * b.speed
    }

    // Bricks
    for (const br of s.bricks) {
      if (!br.alive) continue
      const w = brickWorld(br)
      const dx = b.x - w.x
      const dy = b.y - w.y
      const overlapX = BRICK.width / 2 + BALL.radius - Math.abs(dx)
      const overlapY = BRICK.height / 2 + BALL.radius - Math.abs(dy)
      if (overlapX > 0 && overlapY > 0) {
        if (overlapX < overlapY) {
          b.vx = dx > 0 ? Math.abs(b.vx) : -Math.abs(b.vx)
          b.x += dx > 0 ? overlapX : -overlapX
        } else {
          b.vy = dy > 0 ? Math.abs(b.vy) : -Math.abs(b.vy)
          b.y += dy > 0 ? overlapY : -overlapY
        }
        br.alive = false
        s.bricksBroken += 1
        const rowPts = ROW_POINTS[br.row] ?? 5
        s.score += rowPts
        maybeDropPower(s, w.x, w.y)
        break
      }
    }

    // Out of bottom
    if (b.y < -ARENA.height / 2 - 0.5) b.active = false
  }

  s.balls = s.balls.filter((b) => b.active)

  // All balls lost
  if (s.balls.length === 0) {
    s.lives -= 1
    s.lifeLostTimer = 0.9
    s.status = "lifelost"
    s.activePowers = []
    s.powerDrops = []
    s.laserShots = []
    return
  }

  // Power drops fall
  for (const p of s.powerDrops) {
    if (p.caught) continue
    p.y += p.vy * dt
    // Catch
    const halfW = s.paddleWidth / 2
    if (
      p.y <= PADDLE.y + PADDLE.height + 0.15 &&
      p.y >= PADDLE.y - 0.2 &&
      p.x >= s.paddleX - halfW &&
      p.x <= s.paddleX + halfW
    ) {
      p.caught = true
      s.powerUpsCaught += 1
      s.lastPowerCaught = p.type
      applyPower(s, p.type, now)
    }
  }
  s.powerDrops = s.powerDrops.filter((p) => !p.caught && p.y > -ARENA.height / 2 - 0.5)

  // Lasers
  if (s.activePowers.some((p) => p.type === "laser") && (now % 350) < 16) {
    s.laserShots.push({ x: s.paddleX - 0.6, y: PADDLE.y + PADDLE.height + 0.15, alive: true })
    s.laserShots.push({ x: s.paddleX + 0.6, y: PADDLE.y + PADDLE.height + 0.15, alive: true })
  }
  for (const shot of s.laserShots) {
    if (!shot.alive) continue
    shot.y += 18 * dt
    if (shot.y > ARENA.height / 2) { shot.alive = false; continue }
    for (const br of s.bricks) {
      if (!br.alive) continue
      const w = brickWorld(br)
      if (
        shot.x >= w.x - BRICK.width / 2 &&
        shot.x <= w.x + BRICK.width / 2 &&
        shot.y >= w.y - BRICK.height / 2 &&
        shot.y <= w.y + BRICK.height / 2
      ) {
        br.alive = false
        s.bricksBroken += 1
        const rowPts = ROW_POINTS[br.row] ?? 5
        s.score += rowPts
        maybeDropPower(s, w.x, w.y)
        shot.alive = false
        break
      }
    }
  }
  s.laserShots = s.laserShots.filter((l) => l.alive)

  // Win check
  if (s.bricks.every((b) => !b.alive)) {
    s.status = "won"
  }
}

function maybeDropPower(s: BreakState, x: number, y: number): void {
  if (Math.random() > POWER_DROP_CHANCE) return
  const types: PowerType[] = ["expand", "multi", "slow", "laser"]
  const pick = types[Math.floor(Math.random() * types.length)]
  if (!pick) return
  s.powerDrops.push({
    id: s.nextPowerId++,
    x, y,
    vy: -2.2,
    type: pick,
    caught: false,
  })
}

function applyPower(s: BreakState, type: PowerType, now: number): void {
  if (type === "multi") {
    const original = s.balls[0]
    if (!original) return
    for (let i = 0; i < 2; i++) {
      const angle = Math.atan2(original.vy, original.vx) + (i === 0 ? 0.4 : -0.4)
      s.balls.push({
        x: original.x,
        y: original.y,
        vx: Math.cos(angle) * original.speed,
        vy: Math.sin(angle) * original.speed,
        speed: original.speed,
        active: true,
      })
    }
    return
  }
  // Remove existing power of same type then add fresh
  s.activePowers = s.activePowers.filter((p) => p.type !== type)
  s.activePowers.push({ type, expiresAt: now + POWER_DURATION_MS[type] })
}

export function setSpin(s: BreakState, spin: -1 | 0 | 1): void {
  s.paddleSpin = spin
}

export function movePaddle(s: BreakState, dir: -1 | 0 | 1, dt: number): void {
  s.paddleX += dir * PADDLE.speed * dt
  const limit = ARENA.width / 2 - s.paddleWidth / 2
  if (s.paddleX < -limit) s.paddleX = -limit
  if (s.paddleX > limit) s.paddleX = limit
}
