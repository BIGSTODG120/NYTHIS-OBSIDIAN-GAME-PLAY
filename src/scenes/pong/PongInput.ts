import type { PongState } from "./PongGame"
import { PADDLE } from "./PongGame"

const keys: Record<string, boolean> = {}

let installed = false

export function installInput(): () => void {
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

export function p1Input(state: PongState, dt: number): void {
  let dir = 0
  if (keys["w"]) dir += 1
  if (keys["s"]) dir -= 1
  // Solo mode fallback: arrow keys also drive P1 if W/S unused
  if (dir === 0) {
    if (keys["arrowup"]) dir += 1
    if (keys["arrowdown"]) dir -= 1
  }
  state.p1.vy = dir * PADDLE.speed
  state.p1.y += state.p1.vy * dt
}

export function p2InputHuman(state: PongState, dt: number): void {
  let dir = 0
  if (keys["arrowup"]) dir += 1
  if (keys["arrowdown"]) dir -= 1
  state.p2.vy = dir * PADDLE.speed
  state.p2.y += state.p2.vy * dt
}

export function spaceJustPressed(): boolean {
  if (keys[" "]) { keys[" "] = false; return true }
  return false
}

export function escJustPressed(): boolean {
  if (keys["escape"]) { keys["escape"] = false; return true }
  return false
}
