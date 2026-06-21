import { create } from "zustand"

export type SceneId = "hub" | "pong" | "snake" | "break" | "sweep" | "drift" | "stack" | "spire"
export type PongMode = "ai" | "2p"
export type PongAITier = "easy" | "medium" | "punisher"

interface AppState {
  activeScene: SceneId
  muted: boolean
  pongMode: PongMode
  pongAITier: PongAITier
  snakeWraparound: boolean
  setActiveScene: (id: SceneId) => void
  setMuted: (m: boolean) => void
  setPongMode: (m: PongMode) => void
  setPongAITier: (t: PongAITier) => void
  setSnakeWraparound: (w: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeScene: "hub",
  muted: false,
  pongMode: "ai",
  pongAITier: "medium",
  snakeWraparound: true,
  setActiveScene: (id) => set({ activeScene: id }),
  setMuted: (m) => set({ muted: m }),
  setPongMode: (m) => set({ pongMode: m }),
  setPongAITier: (t) => set({ pongAITier: t }),
  setSnakeWraparound: (w) => set({ snakeWraparound: w }),
}))
