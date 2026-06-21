export type GameStatus = "FORGING" | "LIVE"

export interface GameUpgrade {
  readonly label: string
  readonly description: string
}

export interface GameCardData {
  readonly id: string
  readonly title: string
  readonly origin: string
  readonly originYear: number
  readonly pass: string
  readonly status: GameStatus
  readonly upgrades: readonly [GameUpgrade, GameUpgrade]
  readonly isOriginal?: boolean
}

export const games: readonly GameCardData[] = [
  {
    id: "pong",
    title: "Obsidian Pong",
    origin: "Pong",
    originYear: 1972,
    pass: "3.1",
    status: "LIVE",
    upgrades: [
      { label: "Local 2P", description: "Local two-player mode" },
      { label: "3-Tier AI", description: "Easy, Medium, Punisher difficulty" },
    ],
  },
  {
    id: "snake",
    title: "Obsidian Snake",
    origin: "Snake",
    originYear: 1976,
    pass: "3.2",
    status: "LIVE",
    upgrades: [
      { label: "Wraparound", description: "Edges connect, no instant-death walls" },
      { label: "Combo Chain", description: "Chain pickups for score multipliers" },
    ],
  },
  {
    id: "break",
    title: "Obsidian Break",
    origin: "Breakout",
    originYear: 1976,
    pass: "3.3",
    status: "LIVE",
    upgrades: [
      { label: "Paddle Spin", description: "Hold Shift to spin paddle and curve the ball" },
      { label: "Power Drops", description: "Bricks drop power-ups - expand, multi, slow, laser" },
    ],
  },
  {
    id: "sweep",
    title: "Obsidian Sweep",
    origin: "Minesweeper",
    originYear: 1989,
    pass: "3.4",
    status: "LIVE",
    upgrades: [
      { label: "Chord-Click", description: "Reveal adjacent safe cells in one click" },
      { label: "Daily Seed", description: "Same board for everyone, same day" },
    ],
  },
  {
    id: "drift",
    title: "Obsidian Drift",
    origin: "Asteroids",
    originYear: 1979,
    pass: "3.5",
    status: "LIVE",
    upgrades: [
      { label: "Thrust Trail", description: "Particle trail for momentum visualization" },
      { label: "Hyperspace", description: "Emergency teleport with risk" },
    ],
  },
  {
    id: "stack",
    title: "Obsidian Stack",
    origin: "Tetris",
    originYear: 1984,
    pass: "3.6",
    status: "LIVE",
    upgrades: [
      { label: "Hold + Ghost", description: "Modern piece-hold and drop-preview" },
      { label: "Endless Garbage", description: "Rising rows, survive as long as possible" },
    ],
  },
  {
    id: "spire",
    title: "Obsidian Spire",
    origin: "NYTHIS Original",
    originYear: 2026,
    pass: "3.7",
    status: "LIVE",
    isOriginal: true,
    upgrades: [
      { label: "Rewind 3s", description: "One rewind per level - undo recent moves" },
      { label: "Crystal Sense", description: "Briefly highlight the safest path forward" },
    ],
  },
] as const



