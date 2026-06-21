// SweepGame.ts — pure minesweeper logic, deterministic seeded RNG.
// Upgrade 1: Chord-Click (chord() method)
// Upgrade 2: Daily Seed (date-based deterministic board)

export type SweepCellState = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  neighbors: number;
};

export type SweepState = 'idle' | 'playing' | 'won' | 'lost';

export type SweepSnapshot = {
  width: number;
  height: number;
  totalMines: number;
  cells: SweepCellState[];
  state: SweepState;
  flagsCount: number;
  chordsUsed: number;
  elapsedMs: number;
  dailyMode: boolean;
  dailyDate: string;
  firstClick: boolean;
};

// Mulberry32 PRNG — deterministic seed.
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a hash of YYYY-MM-DD to a 32-bit seed.
function dateSeed(dateStr: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function todayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export class SweepGame {
  readonly width = 9;
  readonly height = 9;
  readonly totalMines = 10;

  cells: SweepCellState[] = [];
  state: SweepState = 'idle';
  flagsCount = 0;
  chordsUsed = 0;
  startTimeMs = 0;
  frozenElapsedMs = 0;
  dailyMode = false;
  dailyDate = '';
  firstClick = true;

  private rand: () => number = Math.random;

  constructor() {
    this.reset(false);
  }

  reset(daily: boolean): void {
    this.dailyMode = daily;
    this.dailyDate = todayDateStr();
    const seed = daily
      ? dateSeed(this.dailyDate)
      : Math.floor(Math.random() * 0xffffffff);
    this.rand = mulberry32(seed);
    this.cells = Array.from({ length: this.width * this.height }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      neighbors: 0,
    }));
    this.state = 'idle';
    this.flagsCount = 0;
    this.chordsUsed = 0;
    this.startTimeMs = 0;
    this.frozenElapsedMs = 0;
    this.firstClick = true;
  }

  private idx(x: number, y: number): number {
    return y * this.width + x;
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private placeMines(safeX: number, safeY: number): void {
    const safeIdx = this.idx(safeX, safeY);
    const positions: number[] = [];
    for (let i = 0; i < this.cells.length; i++) {
      if (i !== safeIdx) positions.push(i);
    }
    // Fisher-Yates with seeded rand.
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      const tmp = positions[i];
      positions[i] = positions[j]!;
      positions[j] = tmp!;
    }
    for (let i = 0; i < this.totalMines; i++) {
      const p = positions[i];
      if (p !== undefined) this.cells[p]!.mine = true;
    }
    // Compute neighbor counts.
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const c = this.cells[this.idx(x, y)]!;
        if (c.mine) continue;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (this.inBounds(nx, ny) && this.cells[this.idx(nx, ny)]!.mine) {
              count++;
            }
          }
        }
        c.neighbors = count;
      }
    }
  }

  reveal(x: number, y: number): void {
    if (this.state === 'won' || this.state === 'lost') return;
    if (!this.inBounds(x, y)) return;
    const c = this.cells[this.idx(x, y)]!;
    if (c.revealed || c.flagged) return;

    if (this.firstClick) {
      this.placeMines(x, y);
      this.firstClick = false;
      this.state = 'playing';
      this.startTimeMs = performance.now();
    }

    if (c.mine) {
      c.revealed = true;
      this.state = 'lost';
      this.freezeTime();
      for (const cell of this.cells) {
        if (cell.mine) cell.revealed = true;
      }
      return;
    }

    this.floodFill(x, y);
    this.checkWin();
  }

  private floodFill(sx: number, sy: number): void {
    const stack: Array<[number, number]> = [[sx, sy]];
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      if (!this.inBounds(x, y)) continue;
      const c = this.cells[this.idx(x, y)]!;
      if (c.revealed || c.flagged || c.mine) continue;
      c.revealed = true;
      if (c.neighbors === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            stack.push([x + dx, y + dy]);
          }
        }
      }
    }
  }

  flag(x: number, y: number): void {
    if (this.state === 'won' || this.state === 'lost') return;
    if (!this.inBounds(x, y)) return;
    const c = this.cells[this.idx(x, y)]!;
    if (c.revealed) return;
    c.flagged = !c.flagged;
    this.flagsCount += c.flagged ? 1 : -1;
  }

  // Upgrade 1: Chord-Click. On a revealed number cell, if flagged-neighbor
  // count === number, reveal all non-flagged unrevealed neighbors. If any
  // flag is wrong, this loses — that is the risk/reward.
  chord(x: number, y: number): void {
    if (this.state !== 'playing') return;
    if (!this.inBounds(x, y)) return;
    const c = this.cells[this.idx(x, y)]!;
    if (!c.revealed || c.mine || c.neighbors === 0) return;
    let flaggedCount = 0;
    const toReveal: Array<[number, number]> = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (!this.inBounds(nx, ny)) continue;
        const n = this.cells[this.idx(nx, ny)]!;
        if (n.flagged) flaggedCount++;
        else if (!n.revealed) toReveal.push([nx, ny]);
      }
    }
    if (flaggedCount !== c.neighbors) return;
    this.chordsUsed++;
    for (const [nx, ny] of toReveal) {
      this.reveal(nx, ny);
      if ((this.state as SweepState) !== 'playing') return;
    }
  }

  private checkWin(): void {
    let revealedNonMines = 0;
    for (const c of this.cells) {
      if (c.revealed && !c.mine) revealedNonMines++;
    }
    if (revealedNonMines === this.cells.length - this.totalMines) {
      this.state = 'won';
      this.freezeTime();
      for (const c of this.cells) {
        if (c.mine && !c.flagged) {
          c.flagged = true;
          this.flagsCount++;
        }
      }
    }
  }

  private freezeTime(): void {
    if (this.startTimeMs > 0 && this.frozenElapsedMs === 0) {
      this.frozenElapsedMs = performance.now() - this.startTimeMs;
    }
  }

  get elapsedMs(): number {
    if (this.state === 'idle' || this.startTimeMs === 0) return 0;
    if (this.frozenElapsedMs > 0) return this.frozenElapsedMs;
    return performance.now() - this.startTimeMs;
  }

  get minesRemaining(): number {
    return this.totalMines - this.flagsCount;
  }

  snapshot(): SweepSnapshot {
    return {
      width: this.width,
      height: this.height,
      totalMines: this.totalMines,
      cells: this.cells.map((c) => ({ ...c })),
      state: this.state,
      flagsCount: this.flagsCount,
      chordsUsed: this.chordsUsed,
      elapsedMs: this.elapsedMs,
      dailyMode: this.dailyMode,
      dailyDate: this.dailyDate,
      firstClick: this.firstClick,
    };
  }
}

