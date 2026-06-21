// StackInput.ts — keyboard for Stack.
// A/Left, D/Right       = move
// W/Up                   = rotate CW
// Z                      = rotate CCW
// S/Down (hold)          = soft drop
// Space                  = hard drop
// C / Shift              = hold (Upgrade 1)
// Esc                    = back to hub

import type { StackState } from './StackGame'
import { move, rotate, softDrop, hardDrop, hold } from './StackGame'

export function installStackInput(state: StackState, onEsc: () => void): () => void {
  let softHeld = false

  const down = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    const k = e.key

    if (k === 'Escape') { onEsc(); e.preventDefault(); return }

    if (e.repeat) {
      // Allow only horizontal move + soft drop to autorepeat
      if (k === 'a' || k === 'A' || k === 'ArrowLeft') { move(state, -1); e.preventDefault() }
      else if (k === 'd' || k === 'D' || k === 'ArrowRight') { move(state, 1); e.preventDefault() }
      return
    }

    if (k === 'a' || k === 'A' || k === 'ArrowLeft') { move(state, -1); e.preventDefault() }
    else if (k === 'd' || k === 'D' || k === 'ArrowRight') { move(state, 1); e.preventDefault() }
    else if (k === 'w' || k === 'W' || k === 'ArrowUp') { rotate(state, 1); e.preventDefault() }
    else if (k === 'z' || k === 'Z') { rotate(state, -1); e.preventDefault() }
    else if (k === 's' || k === 'S' || k === 'ArrowDown') {
      if (!softHeld) { softHeld = true; softDrop(state, true) }
      e.preventDefault()
    }
    else if (k === ' ' || k === 'Spacebar') { hardDrop(state); e.preventDefault() }
    else if (k === 'c' || k === 'C' || k === 'Shift') { hold(state); e.preventDefault() }
  }

  const up = (e: KeyboardEvent) => {
    const k = e.key
    if (k === 's' || k === 'S' || k === 'ArrowDown') {
      softHeld = false
      softDrop(state, false)
    }
  }

  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)

  return () => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
  }
}
