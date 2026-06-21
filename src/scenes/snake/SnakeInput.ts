import type { SnakeState, Dir } from "./SnakeGame"
import { setDir, startGame } from "./SnakeGame"

const keys: Record<string, boolean> = {}
let installed = false

export function installSnakeInput(): () => void {
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

export function pollSnakeInput(s: SnakeState): void {
  let next: Dir | null = null
  if (keys["arrowup"] || keys["w"]) next = "up"
  else if (keys["arrowdown"] || keys["s"]) next = "down"
  else if (keys["arrowleft"] || keys["a"]) next = "left"
  else if (keys["arrowright"] || keys["d"]) next = "right"
  if (next) setDir(s, next)
}

export function spaceJustPressed(): boolean {
  if (keys[" "]) { keys[" "] = false; return true }
  return false
}

export function escJustPressed(): boolean {
  if (keys["escape"]) { keys["escape"] = false; return true }
  return false
}

export function maybeStart(s: SnakeState): boolean {
  if (s.status !== "playing" && spaceJustPressed()) {
    startGame(s)
    return true
  }
  return false
}
