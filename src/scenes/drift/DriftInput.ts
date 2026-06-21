// DriftInput.ts — module-level keyboard utility (PongInput pattern).
// Exposes installDriftInput() to set up listeners and applyRotationFrame()
// to be called from useFrame for continuous rotation.

import type { DriftState } from './DriftGame'
import { setThrust, rotateShip, fire, hyperspace } from './DriftGame'

let activeKeys: Set<string> | null = null

export function installDriftInput(state: DriftState, onEsc: () => void): () => void {
  const keys = new Set<string>()
  activeKeys = keys

  const down = (e: KeyboardEvent) => {
    if (e.repeat) return
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    const k = e.key
    if (k === 'w' || k === 'W' || k === 'ArrowUp') { keys.add('thrust'); setThrust(state, true); e.preventDefault() }
    else if (k === 'a' || k === 'A' || k === 'ArrowLeft') { keys.add('left'); e.preventDefault() }
    else if (k === 'd' || k === 'D' || k === 'ArrowRight') { keys.add('right'); e.preventDefault() }
    else if (k === ' ' || k === 'Spacebar') { fire(state); e.preventDefault() }
    else if (k === 'h' || k === 'H' || k === 'ArrowDown' || k === 's' || k === 'S') { hyperspace(state); e.preventDefault() }
    else if (k === 'Escape') { onEsc(); e.preventDefault() }
  }

  const up = (e: KeyboardEvent) => {
    const k = e.key
    if (k === 'w' || k === 'W' || k === 'ArrowUp') { keys.delete('thrust'); setThrust(state, false) }
    else if (k === 'a' || k === 'A' || k === 'ArrowLeft') keys.delete('left')
    else if (k === 'd' || k === 'D' || k === 'ArrowRight') keys.delete('right')
  }

  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)

  return () => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
    if (activeKeys === keys) activeKeys = null
  }
}

// Called from useFrame in scene root each frame.
export function applyRotationFrame(state: DriftState, dt: number): void {
  if (!activeKeys) return
  if (activeKeys.has('left')) rotateShip(state, 1, dt)
  if (activeKeys.has('right')) rotateShip(state, -1, dt)
}
