/**
 * Tutorial step types and shared interfaces
 */

import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import type { TileSuit } from '../../../../core/Tile'

/** Tile display configuration */
export interface TileDisplay {
  suit: TileSuit
  rank: number
}

/** Tutorial step definition */
export interface TutorialStep {
  id: string
  category: string
  title: string
  content: ReactNode
  showTiles?: TileDisplay[]
}

/** Function type for creating category steps */
export type StepCreator = (t: TFunction) => TutorialStep[]
