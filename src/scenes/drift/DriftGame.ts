// DriftGame.ts — Asteroids canonical mechanics.
// Scoring locked to Atari 1979 standard: 20/50/100/200/1000, +1 life @ 10k.
// Upgrade 1: Thrust Trail (thrustFramesThisRun counter)
// Upgrade 2: Hyperspace (H = teleport, 10% destruction risk, hyperspaceUses counter)

export type DriftStatus = 'menu' | 'playing' | 'gameover'
export type AsteroidSize = 'large' | 'medium' | 'small'

export interface Vec2 { x: number; y: number }

export interface Asteroid {
  id: number
  pos: Vec2
  vel: Vec2
  size: AsteroidSize
  radius: number
  rot: number
  rotSpeed: number
}

export interface Bullet {
  pos: Vec2
  vel: Vec2
  ttl: number
}

export interface Ship {
  pos: Vec2
  vel: Vec2
  rot: number    // radians, 0 = up
  thrusting: boolean
  fireCooldown: number
  invuln: number // post-respawn invulnerability seconds
  alive: boolean
}

export interface DriftState {
  status: DriftStatus
  ship: Ship
  asteroids: Asteroid[]
  bullets: Bullet[]
  score: number
  lives: number
  wave: number
  wavesCleared: number
  // Upgrade evidence:
  thrustFramesThisRun: number
  hyperspaceUses: number
  hyperspaceLostShips: number
  // Internals:
  nextAsteroidId: number
  lastExtraLifeAt: number
  fireQueued: boolean
  hyperspaceQueued: boolean
}

// === Canonical scoring (Atari 1979) ===
export const SCORE = {
  large: 20,
  medium: 50,
  small: 100,
} as const

export const EXTRA_LIFE_EVERY = 10000
export const START_LIVES = 3
export const WORLD = { w: 30, h: 18 } // arena units; ship/asteroid sizes match
export const SHIP_RADIUS = 0.42
export const BULLET_TTL = 1.1
export const BULLET_SPEED = 16
export const SHIP_THRUST = 14
export const SHIP_DRAG = 0.36
export const SHIP_ROT_SPEED = 3.6
export const FIRE_COOLDOWN = 0.18
export const RESPAWN_INVULN = 2.2
export const HYPERSPACE_RISK = 0.1

const ASTEROID_RADII: Record<AsteroidSize, number> = {
  large: 1.55,
  medium: 0.95,
  small: 0.55,
}

const ASTEROID_SPEEDS: Record<AsteroidSize, number> = {
  large: 2.0,
  medium: 2.9,
  small: 3.8,
}

function wrap(p: Vec2): void {
  if (p.x < -WORLD.w / 2) p.x += WORLD.w
  else if (p.x > WORLD.w / 2) p.x -= WORLD.w
  if (p.y < -WORLD.h / 2) p.y += WORLD.h
  else if (p.y > WORLD.h / 2) p.y -= WORLD.h
}

function dist2(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x, dy = a.y - b.y
  return dx * dx + dy * dy
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function createState(): DriftState {
  return {
    status: 'menu',
    ship: makeShip(),
    asteroids: [],
    bullets: [],
    score: 0,
    lives: START_LIVES,
    wave: 0,
    wavesCleared: 0,
    thrustFramesThisRun: 0,
    hyperspaceUses: 0,
    hyperspaceLostShips: 0,
    nextAsteroidId: 1,
    lastExtraLifeAt: 0,
    fireQueued: false,
    hyperspaceQueued: false,
  }
}

function makeShip(): Ship {
  return {
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    rot: 0,
    thrusting: false,
    fireCooldown: 0,
    invuln: RESPAWN_INVULN,
    alive: true,
  }
}

function spawnWave(state: DriftState, waveNum: number): void {
  const count = Math.min(4 + (waveNum - 1), 9) // wave 1=4 large, capped at 9
  for (let i = 0; i < count; i++) {
    // Spawn away from ship center
    let p: Vec2
    do {
      p = { x: rand(-WORLD.w / 2, WORLD.w / 2), y: rand(-WORLD.h / 2, WORLD.h / 2) }
    } while (Math.hypot(p.x, p.y) < 4)
    const angle = Math.random() * Math.PI * 2
    const speed = ASTEROID_SPEEDS.large * rand(0.7, 1.0)
    state.asteroids.push({
      id: state.nextAsteroidId++,
      pos: p,
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      size: 'large',
      radius: ASTEROID_RADII.large,
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-1.2, 1.2),
    })
  }
}

export function startGame(state: DriftState): void {
  state.status = 'playing'
  state.ship = makeShip()
  state.asteroids = []
  state.bullets = []
  state.score = 0
  state.lives = START_LIVES
  state.wave = 1
  state.wavesCleared = 0
  state.thrustFramesThisRun = 0
  state.hyperspaceUses = 0
  state.hyperspaceLostShips = 0
  state.lastExtraLifeAt = 0
  spawnWave(state, 1)
}

export function setThrust(state: DriftState, on: boolean): void {
  if (state.status !== 'playing' || !state.ship.alive) return
  state.ship.thrusting = on
}

export function rotateShip(state: DriftState, dir: number, dt: number): void {
  if (state.status !== 'playing' || !state.ship.alive) return
  state.ship.rot += dir * SHIP_ROT_SPEED * dt
}

export function fire(state: DriftState): void {
  if (state.status !== 'playing' || !state.ship.alive) return
  if (state.ship.fireCooldown > 0) return
  const s = state.ship
  const dir = { x: -Math.sin(s.rot), y: Math.cos(s.rot) }
  state.bullets.push({
    pos: { x: s.pos.x + dir.x * SHIP_RADIUS, y: s.pos.y + dir.y * SHIP_RADIUS },
    vel: { x: s.vel.x + dir.x * BULLET_SPEED, y: s.vel.y + dir.y * BULLET_SPEED },
    ttl: BULLET_TTL,
  })
  s.fireCooldown = FIRE_COOLDOWN
}

// Upgrade 2: Hyperspace — random teleport with HYPERSPACE_RISK chance of self-destruct.
export function hyperspace(state: DriftState): void {
  if (state.status !== 'playing' || !state.ship.alive) return
  state.hyperspaceUses++
  if (Math.random() < HYPERSPACE_RISK) {
    state.hyperspaceLostShips++
    killShip(state)
    return
  }
  state.ship.pos = { x: rand(-WORLD.w / 2 + 2, WORLD.w / 2 - 2), y: rand(-WORLD.h / 2 + 2, WORLD.h / 2 - 2) }
  state.ship.vel = { x: 0, y: 0 }
  state.ship.invuln = 0.6
}

function killShip(state: DriftState): void {
  state.lives--
  if (state.lives <= 0) {
    state.status = 'gameover'
    state.ship.alive = false
    return
  }
  state.ship = makeShip()
}

function awardScore(state: DriftState, pts: number): void {
  state.score += pts
  const earned = Math.floor(state.score / EXTRA_LIFE_EVERY)
  if (earned > state.lastExtraLifeAt) {
    state.lives += earned - state.lastExtraLifeAt
    state.lastExtraLifeAt = earned
  }
}

function splitAsteroid(state: DriftState, a: Asteroid): void {
  const baseAngle = Math.atan2(a.vel.y, a.vel.x)
  if (a.size === 'large') {
    awardScore(state, SCORE.large)
    for (let i = 0; i < 2; i++) {
      const ang = baseAngle + (i === 0 ? 1 : -1) * (Math.PI / 4 + rand(0, 0.2))
      const sp = ASTEROID_SPEEDS.medium * rand(0.8, 1.1)
      state.asteroids.push({
        id: state.nextAsteroidId++,
        pos: { ...a.pos },
        vel: { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp },
        size: 'medium',
        radius: ASTEROID_RADII.medium,
        rot: a.rot,
        rotSpeed: rand(-1.8, 1.8),
      })
    }
  } else if (a.size === 'medium') {
    awardScore(state, SCORE.medium)
    for (let i = 0; i < 2; i++) {
      const ang = baseAngle + (i === 0 ? 1 : -1) * (Math.PI / 4 + rand(0, 0.2))
      const sp = ASTEROID_SPEEDS.small * rand(0.9, 1.2)
      state.asteroids.push({
        id: state.nextAsteroidId++,
        pos: { ...a.pos },
        vel: { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp },
        size: 'small',
        radius: ASTEROID_RADII.small,
        rot: a.rot,
        rotSpeed: rand(-2.5, 2.5),
      })
    }
  } else {
    awardScore(state, SCORE.small)
  }
}

export function tick(state: DriftState, dt: number): void {
  if (state.status !== 'playing') return
  const s = state.ship

  // Ship physics
  if (s.alive) {
    if (s.thrusting) {
      const dir = { x: -Math.sin(s.rot), y: Math.cos(s.rot) }
      s.vel.x += dir.x * SHIP_THRUST * dt
      s.vel.y += dir.y * SHIP_THRUST * dt
      state.thrustFramesThisRun++ // Upgrade 1 evidence accumulator
    }
    // Drag (gentle, preserves canonical inertia feel)
    s.vel.x -= s.vel.x * SHIP_DRAG * dt
    s.vel.y -= s.vel.y * SHIP_DRAG * dt
    s.pos.x += s.vel.x * dt
    s.pos.y += s.vel.y * dt
    wrap(s.pos)
    if (s.fireCooldown > 0) s.fireCooldown -= dt
    if (s.invuln > 0) s.invuln -= dt
  }

  // Bullets
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i]!
    b.pos.x += b.vel.x * dt
    b.pos.y += b.vel.y * dt
    wrap(b.pos)
    b.ttl -= dt
    if (b.ttl <= 0) state.bullets.splice(i, 1)
  }

  // Asteroids
  for (const a of state.asteroids) {
    a.pos.x += a.vel.x * dt
    a.pos.y += a.vel.y * dt
    a.rot += a.rotSpeed * dt
    wrap(a.pos)
  }

  // Bullet vs asteroid
  for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
    const b = state.bullets[bi]!
    let hit = -1
    for (let ai = 0; ai < state.asteroids.length; ai++) {
      const a = state.asteroids[ai]!
      if (dist2(b.pos, a.pos) < a.radius * a.radius) { hit = ai; break }
    }
    if (hit >= 0) {
      const a = state.asteroids[hit]!
      state.bullets.splice(bi, 1)
      state.asteroids.splice(hit, 1)
      splitAsteroid(state, a)
    }
  }

  // Ship vs asteroid
  if (s.alive && s.invuln <= 0) {
    for (const a of state.asteroids) {
      const r = a.radius + SHIP_RADIUS
      if (dist2(s.pos, a.pos) < r * r) {
        killShip(state)
        break
      }
    }
  }

  // Wave clear
  if (state.asteroids.length === 0 && state.status === 'playing') {
    state.wavesCleared++
    state.wave++
    spawnWave(state, state.wave)
    if (s.alive) s.invuln = 1.0 // breather between waves
  }
}
