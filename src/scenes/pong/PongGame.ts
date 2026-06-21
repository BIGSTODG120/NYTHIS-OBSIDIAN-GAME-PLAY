// Pure Pong game logic. No React, no rendering. Deterministic.

export const ARENA = { width: 12, height: 7 } as const
export const PADDLE = { width: 0.3, height: 1.6, speed: 7 } as const
export const BALL = { radius: 0.18, baseSpeed: 6, maxSpeed: 12, speedup: 1.04 } as const
export const WIN_SCORE = 11

export interface PongState {
  ball: { x: number; y: number; vx: number; vy: number; speed: number }
  p1: { y: number; vy: number; score: number }
  p2: { y: number; vy: number; score: number }
  status: "menu" | "serving" | "playing" | "point" | "gameover"
  serveTo: 1 | 2
  pointTimer: number
  winner: 0 | 1 | 2
}

export function createState(): PongState {
  return {
    ball: { x: 0, y: 0, vx: 0, vy: 0, speed: BALL.baseSpeed },
    p1: { y: 0, vy: 0, score: 0 },
    p2: { y: 0, vy: 0, score: 0 },
    status: "menu",
    serveTo: 2,
    pointTimer: 0,
    winner: 0,
  }
}

export function serve(s: PongState): void {
  const dir = s.serveTo === 2 ? 1 : -1
  const angle = (Math.random() - 0.5) * 0.7
  s.ball.x = 0
  s.ball.y = 0
  s.ball.speed = BALL.baseSpeed
  s.ball.vx = Math.cos(angle) * BALL.baseSpeed * dir
  s.ball.vy = Math.sin(angle) * BALL.baseSpeed
  s.status = "playing"
}

export function tick(s: PongState, dt: number): void {
  if (s.status === "playing") {
    s.ball.x += s.ball.vx * dt
    s.ball.y += s.ball.vy * dt

    // Top/bottom walls
    const topY = ARENA.height / 2 - BALL.radius
    if (s.ball.y > topY) { s.ball.y = topY; s.ball.vy = -Math.abs(s.ball.vy) }
    if (s.ball.y < -topY) { s.ball.y = -topY; s.ball.vy = Math.abs(s.ball.vy) }

    // Paddle X positions
    const p1X = -ARENA.width / 2 + 0.6
    const p2X = ARENA.width / 2 - 0.6

    // Paddle collisions
    collide(s, p1X, s.p1.y, 1)
    collide(s, p2X, s.p2.y, -1)

    // Scoring
    if (s.ball.x < -ARENA.width / 2) { score(s, 2) }
    else if (s.ball.x > ARENA.width / 2) { score(s, 1) }
  } else if (s.status === "point") {
    s.pointTimer -= dt
    if (s.pointTimer <= 0) {
      if (s.p1.score >= WIN_SCORE && s.p1.score - s.p2.score >= 2) {
        s.status = "gameover"; s.winner = 1
      } else if (s.p2.score >= WIN_SCORE && s.p2.score - s.p1.score >= 2) {
        s.status = "gameover"; s.winner = 2
      } else {
        serve(s)
      }
    }
  }

  // Clamp paddles
  const maxY = ARENA.height / 2 - PADDLE.height / 2
  if (s.p1.y > maxY) s.p1.y = maxY
  if (s.p1.y < -maxY) s.p1.y = -maxY
  if (s.p2.y > maxY) s.p2.y = maxY
  if (s.p2.y < -maxY) s.p2.y = -maxY
}

function collide(s: PongState, px: number, py: number, dir: 1 | -1): void {
  const inXBand = dir === 1
    ? s.ball.x - BALL.radius <= px + PADDLE.width / 2 && s.ball.x > px
    : s.ball.x + BALL.radius >= px - PADDLE.width / 2 && s.ball.x < px
  if (!inXBand) return

  const inYBand = Math.abs(s.ball.y - py) <= PADDLE.height / 2 + BALL.radius
  if (!inYBand) return

  // Reverse X, add angle based on hit position
  const hitOffset = (s.ball.y - py) / (PADDLE.height / 2)
  const newAngle = hitOffset * 0.85
  s.ball.speed = Math.min(s.ball.speed * BALL.speedup, BALL.maxSpeed)
  s.ball.vx = Math.cos(newAngle) * s.ball.speed * dir
  s.ball.vy = Math.sin(newAngle) * s.ball.speed
  s.ball.x = dir === 1 ? px + PADDLE.width / 2 + BALL.radius : px - PADDLE.width / 2 - BALL.radius
}

function score(s: PongState, scorer: 1 | 2): void {
  if (scorer === 1) s.p1.score += 1
  else s.p2.score += 1
  s.status = "point"
  s.pointTimer = 1.0
  s.serveTo = scorer === 1 ? 2 : 1
  s.ball.vx = 0; s.ball.vy = 0
}
