import type { BreakState } from "./BreakGame"
import { movePaddle, setSpin } from "./BreakGame"

const keys: Record<string, boolean> = {}
let installed = false

export function installBreakInput(): () => void {
  if (installed) return () => {}
  installed = true
  const down = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true }
  const up = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false }
  window.addEventListener("keydown", down)
  window.addEventListener("keyup", up)
  return () => {
    window.removeEventListener("keydown", down)
    window.removeEventListener("keyup", up)
    installed = false
  }
}

export function pollBreakInput(s: BreakState, dt: number): void {
  let dir: -1 | 0 | 1 = 0
  if (keys["arrowleft"] || keys["a"]) dir = -1
  else if (keys["arrowright"] || keys["d"]) dir = 1
  movePaddle(s, dir, dt)

  // Spin: shift-left = -1, shift-right = +1
  let spin: -1 | 0 | 1 = 0
  if (keys["shift"]) {
    // Generic shift = use direction of motion. If moving left, ccw; right, cw; idle = 0
    spin = dir === -1 ? -1 : dir === 1 ? 1 : 0
  }
  setSpin(s, spin)
}

export function spaceJustPressed(): boolean {
  if (keys[" "]) { keys[" "] = false; return true }
  return false
}

export function escJustPressed(): boolean {
  if (keys["escape"]) { keys["escape"] = false; return true }
  return false
}
