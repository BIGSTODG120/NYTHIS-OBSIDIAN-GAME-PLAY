import type { PongState } from "./PongGame"
import { PADDLE } from "./PongGame"
import type { PongAITier } from "../../core/store"

interface AIConfig {
  reactionRange: number
  errorAmplitude: number
  recoveryRate: number
  trackOnlyIncoming: boolean
}

const CONFIGS: Record<PongAITier, AIConfig> = {
  easy: { reactionRange: 1.8, errorAmplitude: 0.5, recoveryRate: 3.2, trackOnlyIncoming: true },
  medium: { reactionRange: 3.2, errorAmplitude: 0.18, recoveryRate: 5.5, trackOnlyIncoming: true },
  punisher: { reactionRange: 6, errorAmplitude: 0.03, recoveryRate: PADDLE.speed, trackOnlyIncoming: false },
}

export function aiTick(state: PongState, tier: PongAITier, dt: number): void {
  const cfg = CONFIGS[tier]
  const ballComing = state.ball.vx > 0
  let target: number

  if (cfg.trackOnlyIncoming && !ballComing) {
    target = 0
  } else {
    target = state.ball.y + Math.sin(performance.now() / 700) * cfg.errorAmplitude
  }

  const diff = target - state.p2.y
  if (Math.abs(diff) < 0.05) {
    state.p2.vy = 0
  } else {
    const desired = Math.sign(diff) * Math.min(cfg.recoveryRate, Math.abs(diff) / dt)
    const step = Math.min(Math.abs(desired - state.p2.vy), cfg.reactionRange * dt * 10)
    state.p2.vy += Math.sign(desired - state.p2.vy) * step
  }

  state.p2.y += state.p2.vy * dt
}
