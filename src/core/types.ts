import type { ComponentType } from 'react'

export interface Upgrade {
  readonly id: string
  readonly name: string
  readonly description: string
}

export type UpgradePair = readonly [Upgrade, Upgrade]

export interface NythisGame {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly upgrades: UpgradePair
  readonly Scene: ComponentType
  getScore(): number
  getHighScore(): number
}