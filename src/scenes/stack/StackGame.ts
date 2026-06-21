// StackGame.ts — Tetris canonical mechanics.
// Scoring locked to BPS/Nintendo NES standard (de-facto canonical Tetris):
//   Single = 40 × (level+1), Double = 100 × (level+1),
//   Triple = 300 × (level+1), Tetris = 1200 × (level+1).
//   Soft drop = 1 pt/cell (not level-scaled). Hard drop = 2 pts/cell.
//   Level up every 10 lines.
// 7-bag random piece sequence.
// Upgrade 1: Hold + Ghost (C/Shift = hold, ghost piece rendered separately in Scene)
// Upgrade 2: Endless Garbage (every 8s a garbage row rises from bottom)

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
export type StackStatus = 'menu' | 'playing' | 'gameover'

// Cell value: '' = empty, PieceType for filled cell (used for color)
export type Cell = '' | PieceType | 'G' // 'G' = garbage row cell

export const BOARD_W = 10
export const BOARD_H = 20

const PIECE_SHAPES: Record<PieceType, number[][][]> = {
  // Each piece: 4 rotation states, each a 2D matrix of 0/1.
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[1,1],[1,1]], [[1,1],[1,1]], [[1,1],[1,1]], [[1,1],[1,1]],
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ],
}

// NES-style fall frames per cell, indexed by level 0..29+
const NES_FRAMES_PER_CELL = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1]
const FPS = 60

export const SCORE_TABLE = { 1: 40, 2: 100, 3: 300, 4: 1200 } as const
export const LINES_PER_LEVEL = 10
export const GARBAGE_INTERVAL_MS = 8000

export interface Piece {
  type: PieceType
  rot: 0 | 1 | 2 | 3
  x: number // column of top-left of shape matrix
  y: number // row of top-left of shape matrix
}

export interface StackState {
  status: StackStatus
  board: Cell[][] // [row][col], row 0 = top
  current: Piece | null
  next: PieceType[]
  hold: PieceType | null
  holdLocked: boolean // can only hold once per piece
  bag: PieceType[]
  score: number
  lines: number
  level: number
  // Upgrade 1 evidence
  holdsUsed: number
  // Upgrade 2 evidence
  garbageRowsSurvived: number
  // Internals
  fallAccumMs: number
  garbageAccumMs: number
  softDropPressed: boolean
}

function emptyBoard(): Cell[][] {
  const b: Cell[][] = []
  for (let r = 0; r < BOARD_H; r++) {
    const row: Cell[] = []
    for (let c = 0; c < BOARD_W; c++) row.push('')
    b.push(row)
  }
  return b
}

// 7-bag random — produces a shuffled batch of all 7 pieces.
function newBag(): PieceType[] {
  const bag: PieceType[] = ['I','O','T','S','Z','J','L']
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = bag[i]
    bag[i] = bag[j]!
    bag[j] = tmp!
  }
  return bag
}

function shapeOf(p: Piece): number[][] {
  return PIECE_SHAPES[p.type][p.rot]!
}

function spawnPiece(type: PieceType): Piece {
  // Spawn centered near top
  return { type, rot: 0, x: 3, y: 0 }
}

function collides(board: Cell[][], piece: Piece): boolean {
  const shape = shapeOf(piece)
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy]!.length; dx++) {
      if (!shape[dy]![dx]) continue
      const x = piece.x + dx
      const y = piece.y + dy
      if (x < 0 || x >= BOARD_W || y >= BOARD_H) return true
      if (y >= 0 && board[y]![x] !== '') return true
    }
  }
  return false
}

function lockPiece(state: StackState): void {
  const p = state.current
  if (!p) return
  const shape = shapeOf(p)
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy]!.length; dx++) {
      if (!shape[dy]![dx]) continue
      const x = p.x + dx
      const y = p.y + dy
      if (y >= 0 && y < BOARD_H && x >= 0 && x < BOARD_W) {
        state.board[y]![x] = p.type
      }
    }
  }
  clearLines(state)
  spawnNext(state)
}

function clearLines(state: StackState): void {
  let cleared = 0
  for (let r = BOARD_H - 1; r >= 0; r--) {
    const full = state.board[r]!.every((c) => c !== '')
    if (full) {
      state.board.splice(r, 1)
      const emptyRow: Cell[] = []
      for (let c = 0; c < BOARD_W; c++) emptyRow.push('')
      state.board.unshift(emptyRow)
      cleared++
      r++ // re-check same row after shift
    }
  }
  if (cleared > 0) {
    const tier = cleared as 1 | 2 | 3 | 4
    const points = SCORE_TABLE[tier] * (state.level + 1)
    state.score += points
    state.lines += cleared
    const newLevel = Math.floor(state.lines / LINES_PER_LEVEL)
    if (newLevel > state.level) state.level = newLevel
  }
}

function spawnNext(state: StackState): void {
  // Pull next from next-queue, refill from bag
  const nextType = state.next.shift()!
  refillNext(state)
  state.current = spawnPiece(nextType)
  state.holdLocked = false
  if (collides(state.board, state.current)) {
    // Top out
    state.status = 'gameover'
    state.current = null
  }
}

function refillNext(state: StackState): void {
  while (state.next.length < 3) {
    if (state.bag.length === 0) state.bag = newBag()
    state.next.push(state.bag.shift()!)
  }
}

export function createState(): StackState {
  return {
    status: 'menu',
    board: emptyBoard(),
    current: null,
    next: [],
    hold: null,
    holdLocked: false,
    bag: [],
    score: 0,
    lines: 0,
    level: 0,
    holdsUsed: 0,
    garbageRowsSurvived: 0,
    fallAccumMs: 0,
    garbageAccumMs: 0,
    softDropPressed: false,
  }
}

export function startGame(state: StackState): void {
  state.status = 'playing'
  state.board = emptyBoard()
  state.current = null
  state.next = []
  state.hold = null
  state.holdLocked = false
  state.bag = newBag()
  state.score = 0
  state.lines = 0
  state.level = 0
  state.holdsUsed = 0
  state.garbageRowsSurvived = 0
  state.fallAccumMs = 0
  state.garbageAccumMs = 0
  state.softDropPressed = false
  refillNext(state)
  spawnNext(state)
}

export function move(state: StackState, dx: number): void {
  if (state.status !== 'playing' || !state.current) return
  const moved: Piece = { ...state.current, x: state.current.x + dx }
  if (!collides(state.board, moved)) state.current = moved
}

export function rotate(state: StackState, dir: 1 | -1): void {
  if (state.status !== 'playing' || !state.current) return
  const nextRot = (((state.current.rot + dir) % 4) + 4) % 4 as 0 | 1 | 2 | 3
  // Basic wall-kick: try offsets 0, +1, -1, +2, -2 horizontally
  for (const kick of [0, 1, -1, 2, -2]) {
    const tryPiece: Piece = { ...state.current, rot: nextRot, x: state.current.x + kick }
    if (!collides(state.board, tryPiece)) {
      state.current = tryPiece
      return
    }
  }
}

export function softDrop(state: StackState, on: boolean): void {
  if (state.status !== 'playing') return
  state.softDropPressed = on
}

// Returns true if piece locked.
function stepDown(state: StackState, softDropEarned: boolean): boolean {
  if (!state.current) return false
  const next: Piece = { ...state.current, y: state.current.y + 1 }
  if (collides(state.board, next)) {
    lockPiece(state)
    return true
  }
  state.current = next
  if (softDropEarned) state.score += 1
  return false
}

export function hardDrop(state: StackState): void {
  if (state.status !== 'playing' || !state.current) return
  let cells = 0
  while (state.current) {
    const next: Piece = { ...state.current, y: state.current.y + 1 }
    if (collides(state.board, next)) break
    state.current = next
    cells++
  }
  state.score += cells * 2
  lockPiece(state)
}

// Upgrade 1: Hold piece (swap current with hold buffer)
export function hold(state: StackState): void {
  if (state.status !== 'playing' || !state.current || state.holdLocked) return
  const currentType = state.current.type
  if (state.hold === null) {
    state.hold = currentType
    spawnNext(state)
  } else {
    const swap = state.hold
    state.hold = currentType
    state.current = spawnPiece(swap)
    if (collides(state.board, state.current)) {
      state.status = 'gameover'
      state.current = null
      return
    }
  }
  state.holdLocked = true
  state.holdsUsed++
}

// Upgrade 2: Endless Garbage — push a single garbage row up from the bottom.
// Garbage row has 9 'G' cells and 1 random gap. If a piece is in row 0 area,
// the rise can cause top-out.
function pushGarbage(state: StackState): void {
  if (state.status !== 'playing') return
  const gapCol = Math.floor(Math.random() * BOARD_W)
  const garbageRow: Cell[] = []
  for (let c = 0; c < BOARD_W; c++) garbageRow.push(c === gapCol ? '' : 'G')
  // Shift all rows up by 1
  const topRow = state.board[0]!
  if (topRow.some((c) => c !== '')) {
    // Top row has blocks — rising would push them off → top out
    state.status = 'gameover'
    state.current = null
    return
  }
  state.board.shift()
  state.board.push(garbageRow)
  state.garbageRowsSurvived++
  // Push current piece up to avoid sudden collision; if that fails, top out.
  if (state.current) {
    state.current = { ...state.current, y: state.current.y - 1 }
    if (state.current.y < -2 || collides(state.board, state.current)) {
      state.status = 'gameover'
      state.current = null
    }
  }
}

export function tick(state: StackState, dtMs: number): void {
  if (state.status !== 'playing' || !state.current) return

  // Gravity
  const framesPerCell = NES_FRAMES_PER_CELL[Math.min(state.level, NES_FRAMES_PER_CELL.length - 1)]!
  const msPerCell = (framesPerCell / FPS) * 1000
  const effectiveMs = state.softDropPressed ? Math.min(msPerCell, 50) : msPerCell
  state.fallAccumMs += dtMs
  while (state.fallAccumMs >= effectiveMs && state.status === 'playing') {
    state.fallAccumMs -= effectiveMs
    stepDown(state, state.softDropPressed)
  }

  // Garbage rise (Upgrade 2)
  state.garbageAccumMs += dtMs
  if (state.garbageAccumMs >= GARBAGE_INTERVAL_MS) {
    state.garbageAccumMs -= GARBAGE_INTERVAL_MS
    pushGarbage(state)
  }
}

// Compute ghost piece position for rendering (Upgrade 1 visual support)
export function ghostY(state: StackState): number | null {
  if (!state.current) return null
  let y = state.current.y
  while (true) {
    const next: Piece = { ...state.current, y: y + 1 }
    if (collides(state.board, next)) return y
    y++
  }
}
