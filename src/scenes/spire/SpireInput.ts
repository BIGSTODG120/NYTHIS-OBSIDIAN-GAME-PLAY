// SpireInput.ts — keyboard for Spire.
// A/Left, D/Right       = rotate cursor angle
// W/Up, S/Down          = change ring (up/down)
// Space                 = place fragment
// R                     = rewind 3s (Upgrade 1)
// E                     = crystal sense (Upgrade 2)
// Enter                 = next level (after level-clear)
// Esc                   = back to hub

import type { SpireState } from './SpireGame'
import { moveCursor, changeRing, placeFragment, rewind, crystalSense, nextLevel } from './SpireGame'

const CURSOR_STEP = Math.PI / 8  // 22.5° per press

export function installSpireInput(state: SpireState, onEsc: () => void): () => void {
  const down = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    const k = e.key
    if (k === 'Escape') { onEsc(); e.preventDefault(); return }
    if (k === 'a' || k === 'A' || k === 'ArrowLeft')  { moveCursor(state, -CURSOR_STEP); e.preventDefault() }
    else if (k === 'd' || k === 'D' || k === 'ArrowRight') { moveCursor(state, CURSOR_STEP); e.preventDefault() }
    else if (k === 'w' || k === 'W' || k === 'ArrowUp') { changeRing(state, 1); e.preventDefault() }
    else if (k === 's' || k === 'S' || k === 'ArrowDown') { changeRing(state, -1); e.preventDefault() }
    else if (k === ' ' || k === 'Spacebar') { placeFragment(state); e.preventDefault() }
    else if (k === 'r' || k === 'R') { rewind(state); e.preventDefault() }
    else if (k === 'e' || k === 'E') { crystalSense(state); e.preventDefault() }
    else if (k === 'Enter') { nextLevel(state); e.preventDefault() }
  }

  window.addEventListener('keydown', down)
  return () => window.removeEventListener('keydown', down)
}
